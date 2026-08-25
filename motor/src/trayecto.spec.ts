/**
 * El trayecto: lo que se contesta cuando algo NO sale.
 *
 * Aquí se prueba sobre todo el borde: peticiones rotas, portales que no
 * existen, barrios que son islas y modos que no se atienden. Un motor de rutas
 * se juzga por el buen camino, pero se rompe por los otros.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed } from './red.ts';
import { cargarPortales } from './portales.ts';
import { cargarSitios } from './sitios.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import { leerPeticion } from './peticion.ts';

let motor: Motor;

/** CALLE PEDRO LAPUYADE 3 y CAMINO DE EN MEDIO 120. */
const LAPUYADE = { via: '16080', portal: 'Portales.84476' };
const EN_MEDIO = { via: '10225', portal: 'Portales.82922' };

/** Uno de PEÑA ZORONGO, que es isla del grafo. */
function unZorongo(): { via: string; portal: string } {
  const p = motor.portales.situados.find((s) => s.via === '14510')!;
  return { via: p.via, portal: p.codigo };
}

const pedir = (cuerpo: unknown) => calcularTrayecto(motor, leerPeticion(cuerpo));

describe('El trayecto', () => {
  before(() => {
    const red = cargarRed(cargarGrafo());
    const portales = cargarPortales();
    // ⚠️ El callejero deja de ser solo del formulario: desde la validación
    // espacial (24/08) los sitios lo necesitan para comprobar dónde cae cada
    // coordenada y para rescatar la que esté mal. Por eso sale del literal.
    const callejero = cargarCallejero(portales);
    motor = {
      red,
      rejilla: cargarRejilla(red),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(red),
    };
  });

  test('la ruta buena trae pasos, geometría, metros y duración derivada', () => {
    const t = pedir({ origen: LAPUYADE, destino: EN_MEDIO, modo: 'andando' });
    assert.equal(t.modo, 'andando');
    assert.equal(t.avisos.length, 0);
    assert.ok(t.pasos.length > 5);
    assert.ok(t.geometria.length > 50);
    assert.ok(t.metros > 3000 && t.metros < 4000);
    // La duración es DERIVADA: metros / 5,0 km/h. Se comprueba la fórmula, no
    // un número mágico — si alguien cambiara la velocidad, esto lo cazaría.
    assert.equal(t.segundos, Math.round(t.metros / (5000 / 3600)));
  });

  test('la geometría sale en [lat, lon], al revés que el grafo', () => {
    const t = pedir({ origen: LAPUYADE, destino: EN_MEDIO, modo: 'andando' });
    // Zaragoza está en 41,6 N y −0,9 E. Si se colara el orden del grafo, el
    // primer número sería negativo y la ruta aparecería en el golfo de Guinea.
    for (const [lat, lon] of t.geometria) {
      assert.ok(lat > 41 && lat < 42, `latitud fuera de Zaragoza: ${lat}`);
      assert.ok(lon > -2 && lon < 0, `longitud fuera de Zaragoza: ${lon}`);
    }
  });

  test('un barrio que es ISLA se contesta con un aviso, no con una ruta', () => {
    const t = pedir({ origen: unZorongo(), destino: EN_MEDIO, modo: 'andando' });
    assert.equal(t.pasos.length, 0);
    assert.equal(t.geometria.length, 0);
    assert.equal(t.metros, 0);
    assert.equal(t.avisos.length, 1);
    assert.match(t.avisos[0]!.texto, /no tiene ninguna calle andable cerca/);
    // Y el aviso dice QUÉ dirección es la que falla, con su nombre municipal.
    assert.match(t.avisos[0]!.texto, /PEÑA ZORONGO/);
  });

  test('los otros modos se contestan con honradez, no con una ruta a pie', () => {
    for (const modo of ['bus', 'bici', 'coche'] as const) {
      const t = pedir({ origen: LAPUYADE, destino: EN_MEDIO, modo });
      // Contesta con EL MODO QUE PIDIERON, para que la pantalla pueda decir
      // para cuál no hay ruta.
      assert.equal(t.modo, modo);
      assert.equal(t.pasos.length, 0);
      assert.match(t.avisos[0]!.texto, /Todavía no calculamos rutas en modo/);
    }
  });

  test('un portal que no existe se dice, y no se confunde con «no hay camino»', () => {
    const t = pedir({
      origen: { via: '16080', portal: 'Portales.999999999' },
      destino: EN_MEDIO,
      modo: 'andando',
    });
    assert.match(t.avisos[0]!.texto, /No conocemos ningún portal con el código/);
  });

  test('un portal que no es de la vía que dicen NO se acepta a la buena de Dios', () => {
    // La comprobación cruzada: el portal existe, pero es de otra calle. Sin
    // esto, una pantalla con un fallo de estado podría pedir una dirección
    // que nadie eligió nunca.
    const t = pedir({
      origen: { via: '10225', portal: LAPUYADE.portal },
      destino: EN_MEDIO,
      modo: 'andando',
    });
    assert.match(t.avisos[0]!.texto, /no es de la vía/);
  });

  test('peticiones rotas devuelven vacío bien formado, nunca una excepción', () => {
    const rotas: unknown[] = [
      null,
      undefined,
      42,
      'una cadena',
      [],
      {},
      { origen: LAPUYADE },
      { origen: LAPUYADE, destino: EN_MEDIO },
      { origen: LAPUYADE, destino: EN_MEDIO, modo: 7 },
      { origen: 'CALLE BURGOS', destino: EN_MEDIO, modo: 'andando' },
      { origen: { via: '16080' }, destino: EN_MEDIO, modo: 'andando' },
      { origen: { via: '', portal: '' }, destino: EN_MEDIO, modo: 'andando' },
    ];
    for (const rota of rotas) {
      const t = pedir(rota);
      assert.equal(t.pasos.length, 0, `${JSON.stringify(rota)} tenía que dar vacío`);
      assert.equal(t.geometria.length, 0);
      assert.equal(t.metros, 0);
      assert.equal(t.avisos.length, 1, `${JSON.stringify(rota)} tenía que traer un aviso`);
    }
  });

  // ── EL DESTINO CON NOMBRE ────────────────────────────────────────────────
  //
  // La juez FIJA de los sitios, elegida el 23/08 y declarada aquí para que no
  // cambie con el viento: **CALLE EL COLOSO 2 → Farmacias.8691**, la de la
  // Avenida de Navarra 65, que está a 1,37 km en línea recta. Tiene coordenada
  // —si no, no existiría— y está lejos de casa: una ruta corta no probaría que
  // el tubo entero funciona.

  /** CALLE EL COLOSO 2, el origen de las juez del punto 7. */
  const COLOSO = { via: '8065', portal: 'Portales.93310' };
  /** La farmacia juez: Avda. de Navarra, 65. */
  const FARMACIA = { sitio: 'Farmacias.8691' };

  test('⭐ de un portal a una FARMACIA: la ruta sale por el mismo tubo', () => {
    const t = pedir({ origen: COLOSO, destino: FARMACIA, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 3, `solo ${t.pasos.length} pasos`);
    assert.ok(t.geometria.length > 20);
    // Está a 1,37 km en línea recta, así que andando tiene que ser más.
    assert.ok(t.metros > 1370, `${t.metros} m es menos que la línea recta`);
    assert.equal(t.segundos, Math.round(t.metros / (5000 / 3600)));
  });

  test('⭐ y la llegada dice el SITIO, no una dirección inventada', () => {
    const t = pedir({ origen: COLOSO, destino: FARMACIA, modo: 'andando' });
    const llegada = t.pasos[t.pasos.length - 1]!;
    assert.equal(llegada.giro, 'llegada');
    assert.equal(llegada.metros, 0);
    // 🔒 La presentación, que es «Farmacia · calle» — nunca el título del dato.
    assert.match(llegada.texto, /^Farmacia · Avda\. de Navarra, 65 está a la (derecha|izquierda)$/);
  });

  test('⭐ el arranque sigue diciendo el PORTAL: el origen no ha cambiado', () => {
    const t = pedir({ origen: COLOSO, destino: FARMACIA, modo: 'andando' });
    assert.match(t.pasos[0]!.texto, /^Sal de Calle El Coloso 2 /);
  });

  test('⭐ REGLA B — un sitio SIN coordenada no se puede elegir', () => {
    // `Farmacias.8714` existe en el fichero y no tiene punto, así que no está
    // en el índice. Pedirlo se contesta con un aviso, no con una ruta a ningún
    // sitio: es la misma respuesta que un código inventado, y es la honesta.
    for (const codigo of ['Farmacias.8714', 'Farmacias.29916', 'Farmacias.30105']) {
      const t = pedir({ origen: COLOSO, destino: { sitio: codigo }, modo: 'andando' });
      assert.equal(t.pasos.length, 0, `${codigo} ha devuelto una ruta`);
      assert.equal(t.metros, 0);
      assert.equal(t.avisos.length, 1);
      assert.match(t.avisos[0]!.texto, /No conocemos ningún sitio con el código/);
    }
  });

  /** La segunda farmacia juez: Pº de la Mina, 5, a 2,48 km de la primera. */
  const FARMACIA_MINA = { sitio: 'Farmacias.8844' };

  test('⭐ LA INVERSA: de una FARMACIA a un portal', () => {
    // La simetría es el remate del 23/08: si el sitio vale de destino, tiene
    // que valer de origen. Lo contrario deja tonto al ⇅, que cruza los dos
    // lados desde el punto 6.
    const t = pedir({ origen: FARMACIA, destino: COLOSO, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 3, `solo ${t.pasos.length} pasos`);
    assert.ok(t.metros > 1370);
  });

  test('⭐ y el ARRANQUE dice el sitio, igual que la llegada decía el suyo', () => {
    const t = pedir({ origen: FARMACIA, destino: COLOSO, modo: 'andando' });
    // 🔒 La presentación, nunca el título del dato.
    assert.match(t.pasos[0]!.texto, /^Sal de Farmacia · Avda\. de Navarra, 65 y dirígete/);
    assert.match(t.pasos[t.pasos.length - 1]!.texto, /^Calle El Coloso 2 está a la /);
  });

  test('⭐ SITIO → SITIO: los dos extremos con nombre', () => {
    const t = pedir({ origen: FARMACIA, destino: FARMACIA_MINA, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 3);
    // 2,48 km en línea recta: andando, más.
    assert.ok(t.metros > 2480, `${t.metros} m es menos que la línea recta`);
    assert.match(t.pasos[0]!.texto, /^Sal de Farmacia · Avda\. de Navarra, 65 /);
    assert.match(t.pasos[t.pasos.length - 1]!.texto, /^Farmacia · Pº de la Mina, 5 está a la /);
  });

  // ── LA SEGUNDA TANDA: SANIDAD ──────────────────────────────────────────────
  //
  // Dos juez FIJAS, elegidas el 24/08 y declaradas aquí para que no se muevan
  // con el viento:
  //
  // · **EL COLOSO 2 → Hospital Universitario Miguel Servet** (`Hospitales.9040`).
  //   Es el hospital grande de la ciudad y está al otro lado del Ebro: cruza el
  //   Puente de Piedra y el centro entero, así que si algo del tubo se rompe,
  //   se rompe aquí.
  // · **EL COLOSO 2 → Centro de Salud Actur Norte** (`CentrosSalud.9118`).
  //   Elegido por estar a **1.436 m en línea recta** —el encargo pedía más de un
  //   kilómetro— y por ser un centro de salud propiamente dicho y no un
  //   consultorio ni un centro de especialidades, que en la categoría 781 los
  //   hay. Va por el mismo lado del río, para que las dos no prueben lo mismo.

  /** El Hospital Universitario Miguel Servet. */
  const MIGUEL_SERVET = { sitio: 'Hospitales.9040' };
  /** El Centro de Salud Actur Norte. */
  const ACTUR_NORTE = { sitio: 'CentrosSalud.9118' };

  test('⭐ COLOSO 2 → HOSPITAL: la ruta sale, y la llegada dice su nombre', () => {
    const t = pedir({ origen: COLOSO, destino: MIGUEL_SERVET, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 5, `solo ${t.pasos.length} pasos`);
    // 5,3 km en línea recta hasta el hospital: andando, más.
    assert.ok(t.metros > 5300, `${t.metros} m es menos que la línea recta`);
    // ⭐ El título INSTITUCIONAL se lee, al revés que en farmacias.
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^Hospital Universitario Miguel Servet · /,
      t.pasos[t.pasos.length - 1]!.texto,
    );
    // Y el arranque sigue siendo el portal: el origen no ha cambiado.
    assert.match(t.pasos[0]!.texto, /^Sal de Calle El Coloso 2 /);
  });

  test('⭐ COLOSO 2 → CENTRO DE SALUD a más de un kilómetro', () => {
    const t = pedir({ origen: COLOSO, destino: ACTUR_NORTE, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.metros > 1436, `${t.metros} m es menos que los 1.436 de la recta`);
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^Centro de Salud Actur Norte · /,
      t.pasos[t.pasos.length - 1]!.texto,
    );
  });

  test('⭐ REGLA B en las dos categorías nuevas: los que no tienen punto', () => {
    // Las dos clínicas sin coordenada del fichero de hospitales (§ 1.18). Ni se
    // pueden elegir ni se pueden enrutar: la respuesta es un aviso, no una
    // excepción y no una ruta a ninguna parte.
    for (const codigo of ['Hospitales.12288', 'Hospitales.12289']) {
      const t = pedir({ origen: COLOSO, destino: { sitio: codigo }, modo: 'andando' });
      assert.equal(t.pasos.length, 0, `${codigo} ha dado una ruta`);
      assert.equal(t.avisos.length, 1);
    }
  });

  test('⭐ REGLA B también en el ORIGEN: sin coordenada no se puede salir', () => {
    for (const codigo of ['Farmacias.8714', 'Farmacias.29916', 'Farmacias.30105']) {
      const t = pedir({ origen: { sitio: codigo }, destino: COLOSO, modo: 'andando' });
      assert.equal(t.pasos.length, 0, `${codigo} ha devuelto una ruta`);
      assert.equal(t.avisos.length, 1);
      assert.match(t.avisos[0]!.texto, /No conocemos ningún sitio con el código/);
    }
  });

  // ── LA VALIDACIÓN ESPACIAL, vista desde una ruta ───────────────────────────

  test('⭐ UNA RESCATADA anda hasta su propia puerta: de 401 m a ninguno', () => {
    // `Farmacias.20445` declara «C/ Joaquín Rodrigo, 17» y el Ayuntamiento la
    // publicaba a **236 m** de ese portal, con el mismo vector de desvío que
    // otras tres del mismo barrio (§ 1.16). Andando, esos 236 m en línea recta
    // eran **401 m de calles** — la ruta absurda de ir de una farmacia a su
    // propio portal, medida el 24/08 antes de arreglar nada.
    //
    // Rescatada, la farmacia ESTÁ en su portal, así que los dos extremos
    // enganchan en el mismo sitio y no hay nada que andar. El cero no es una
    // cifra que se haya observado y copiado: sale de la fórmula —misma
    // coordenada, mismo enganche, cero tramos— y `pasos.ts` ya tenía escrito
    // qué se dice entonces.
    const JOAQUIN_RODRIGO_17 = { via: '25755', portal: 'Portales.103883' };
    const t = pedir({
      origen: { sitio: 'Farmacias.20445' },
      destino: JOAQUIN_RODRIGO_17,
      modo: 'andando',
    });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.equal(t.metros, 0, `todavía anda ${t.metros} m hasta su propia puerta`);
    assert.equal(t.pasos.length, 1);
    assert.match(t.pasos[0]!.texto, /es el mismo portal del que sales/);
  });

  test('⭐ y la que NO se rescató sigue exactamente donde estaba', () => {
    // La contraparte, para que «rescatar» no se lea como «mover lo que haga
    // falta»: la farmacia juez de todo el banco no ha cambiado de sitio, y su
    // ruta desde EL COLOSO 2 es la misma que era.
    const t = pedir({ origen: COLOSO, destino: FARMACIA, modo: 'andando' });
    assert.equal(t.avisos.length, 0);
    assert.ok(t.metros > 1370);
    const s = motor.sitios.donde.get('Farmacias.8691')!;
    assert.equal(s.lon, -0.9067201540347999);
    assert.equal(s.lat, 41.6552124101774);
  });

  test('⭐ EL 9090 CORREGIDO A MANO: se puede elegir, y se llega andando', () => {
    // `CentrosSalud.9090` «Centro de Salud Fernando El Católico» venía con la
    // coordenada en PORTUGAL y la validación espacial lo dejaba fuera del
    // índice: su dirección es «C/ Domingo Miral, s/n» y sin número no había
    // portal que le devolviera el sitio. La confirmación manual de Antonio
    // (24/08) le da la coordenada buena, y con ella vuelve a ser un destino.
    //
    // Es el remate del método: lo que el proceso no puede arreglar se le manda
    // a quien conoce el terreno, y lo que vuelve confirmado entra declarado.
    const t = pedir({ origen: COLOSO, destino: { sitio: 'CentrosSalud.9090' }, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 5, `solo ${t.pasos.length} pasos`);
    // 5.229 m en línea recta desde EL COLOSO 2: andando, más.
    assert.ok(t.metros > 5229, `${t.metros} m es menos que la línea recta`);
    // ⚠️ «Fernando **el** Católico», con minúscula, y el título del dato dice
    // «El». No es una errata de la prueba: el paso pasa por la recomposición
    // que escribe los nombres como se leen —partículas en minúscula, criterio
    // del IGN—, y ahí «El» de un apodo baja. Las otras dos juez de sanidad no
    // lo enseñan porque «Miguel Servet» y «Actur Norte» no llevan partícula.
    // La sugerencia sí conserva el título tal cual; se comprueba en
    // `sitios.spec.ts`.
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^Centro de Salud Fernando el Católico · /,
      t.pasos[t.pasos.length - 1]!.texto,
    );
    // Y la llegada cae donde Antonio dijo, no donde decía el fichero.
    const s = motor.sitios.donde.get('CentrosSalud.9090')!;
    assert.equal(s.lat, 41.6402816);
    assert.equal(s.lon, -0.9011954);
  });

  test('un sitio inventado se contesta con aviso, no con una excepción', () => {
    const t = pedir({ origen: COLOSO, destino: { sitio: 'Farmacias.999999' }, modo: 'andando' });
    assert.equal(t.avisos.length, 1);
    assert.match(t.avisos[0]!.texto, /No conocemos ningún sitio/);
  });

  test('el destino de siempre —vía y portal— sigue funcionando igual', () => {
    // El contrato creció con una unión: lo que ya venía tiene que seguir
    // entrando por donde entraba.
    const t = pedir({ origen: LAPUYADE, destino: EN_MEDIO, modo: 'andando' });
    assert.equal(t.avisos.length, 0);
    assert.ok(t.pasos.length > 5);
  });

  test('el texto NO se acepta como dirección: es la ley de la entrada nº4', () => {
    // Mandar el nombre de la calle en vez del código no cuela por ningún lado.
    const t = pedir({
      origen: { via: 'CALLE PEDRO LAPUYADE', portal: '3' },
      destino: EN_MEDIO,
      modo: 'andando',
    });
    assert.equal(t.pasos.length, 0);
    assert.match(t.avisos[0]!.texto, /No conocemos ningún portal con el código 3/);
  });
});
