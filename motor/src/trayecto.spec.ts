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
import { cargarSitios, sugerirSitios } from './sitios.ts';
import { buscar, cargarCallejero } from './callejero.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import { leerPeticion } from './peticion.ts';
import { metrosEntre } from './cercano.ts';

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

  // ── LA TERCERA TANDA: BIBLIOTECAS ──────────────────────────────────────────
  //
  // La juez FIJA de la categoría, elegida el 25/08 y declarada aquí para que no
  // se mueva con el viento: **la Biblioteca para Jóvenes Cubit**
  // (`Bibliotecas.4946`, C/ Mas de las Matas, 20). Se eligió por tres cosas
  // medidas: está a **2.029 m en línea recta** de EL COLOSO 2 —el encargo pedía
  // más de un kilómetro—, engancha a la red **a 1 m**, y su nombre no se parece
  // a ningún otro del índice, así que la sugerencia que la trae no puede
  // confundirse con otra.

  /** La Biblioteca para Jóvenes Cubit. */
  const CUBIT = { sitio: 'Bibliotecas.4946' };

  test('⭐ COLOSO 2 → BIBLIOTECA: la ruta sale, y la llegada dice su nombre', () => {
    const t = pedir({ origen: COLOSO, destino: CUBIT, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    // ⚠️ Aquí puse `> 5` copiando la juez del hospital y salió roja con CINCO,
    // que es lo que de verdad mide esta ruta: salida, un giro, un tramo largo
    // de 1.370 m por San Juan de la Peña, otro giro y la llegada. No era el
    // motor: era la expectativa, copiada de una ruta que cruza media ciudad.
    assert.ok(t.pasos.length > 3, `solo ${t.pasos.length} pasos`);
    // 2.029 m en línea recta: andando, más. Y no mucho más — si un día saliera
    // el doble, sería que el enganche se ha ido a otra parte.
    assert.ok(t.metros > 2029, `${t.metros} m es menos que la línea recta`);
    assert.ok(t.metros < 4058, `${t.metros} m es el doble de la línea recta`);
    assert.equal(t.segundos, Math.round(t.metros / (5000 / 3600)));
    // ⭐ El título institucional se lee, como en sanidad.
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^Biblioteca para Jóvenes Cubit · C\/ Mas de las Matas, 20 está a la (derecha|izquierda)$/,
      t.pasos[t.pasos.length - 1]!.texto,
    );
    // Y el arranque sigue siendo el portal: el origen no ha cambiado.
    assert.match(t.pasos[0]!.texto, /^Sal de Calle El Coloso 2 /);
  });

  test('⭐ y su coordenada es la del fichero, sin tocar: es RECINTO', () => {
    // La contraparte de la juez de arriba. Bibliotecas no pasa por el cheque de
    // distancia (25/08), así que la ruta llega a donde el Ayuntamiento la pone
    // y no a la puerta que su dirección nombra.
    const b = motor.sitios.donde.get('Bibliotecas.4946')!;
    assert.equal(b.lon, -0.8678951683351173);
    assert.equal(b.lat, 41.663689367443794);
  });

  // ── LA CUARTA TANDA: EDUCACIÓN ─────────────────────────────────────────────
  //
  // Tres juez FIJAS, una por categoría, declaradas aquí para que no se muevan
  // con el viento. Las tres se eligieron con una condición medida: **ninguna
  // de las tres está entre los rescatados**, porque lo que estas pruebas miran
  // es la ruta y un sitio que además se mueve mezclaría dos historias.
  //
  // · **C.E.I.P. María Moliner** (`Colegios.591`, C/ Miraflores, 10). Se busca
  //   por **sigla + palabra** —«ceip moliner»—, que es como se teclea un
  //   colegio de verdad y lo que obliga a que la sigla del título sea
  //   buscable. A 5.405 m en línea recta de EL COLOSO 2.
  // · **C.E.I. Chicotes** (`Guarderias.8512`, C/ Balbino Orensanz, 55), a
  //   3.453 m.
  // · **Facultad de Veterinaria** (`Universidades.8226`, C/ Miguel Servet,
  //   177), a 5.319 m — y es además el caso Miguel Servet otra vez, ahora en
  //   la calle que lleva su nombre.

  const MOLINER = { sitio: 'Colegios.591' };
  const CHICOTES = { sitio: 'Guarderias.8512' };
  const VETERINARIA = { sitio: 'Universidades.8226' };

  test('⭐ COLOSO 2 → COLEGIO: la ruta sale, y la llegada dice su sigla entera', () => {
    const t = pedir({ origen: COLOSO, destino: MOLINER, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    // Cruza media ciudad de norte a sur: 24 pasos medidos, y se exige bastante
    // menos para que un combine de narración no ponga esto rojo sin motivo.
    assert.ok(t.pasos.length > 10, `solo ${t.pasos.length} pasos`);
    // 5.405 m en línea recta. Andando salen 5.972, que es ×1,10 — y el techo
    // se pone en el doble, que es el que avisaría de un enganche perdido.
    assert.ok(t.metros > 5405, `${t.metros} m es menos que la línea recta`);
    assert.ok(t.metros < 10810, `${t.metros} m es el doble de la línea recta`);
    assert.equal(t.segundos, Math.round(t.metros / (5000 / 3600)));
    // ⭐ El título institucional se lee, y **con su sigla y sus puntos**: es la
    // forma en que el municipio nombra un colegio y la que alguien teclea.
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^C\.E\.I\.P\. María Moliner · C\/ Miraflores, 10 está a la (derecha|izquierda)$/,
      t.pasos[t.pasos.length - 1]!.texto,
    );
    assert.match(t.pasos[0]!.texto, /^Sal de Calle El Coloso 2 /);
  });

  test('⭐ y se encuentra escribiendo SIGLA Y NOMBRE: «ceip moliner»', () => {
    // La verificación de títulos dijo que las siglas punteadas son el nombre
    // real de un colegio (§ 1.20). Si el troceador se comiera los puntos mal,
    // «ceip» dejaría de casar y la categoría entera sería inencontrable por la
    // única vía por la que la gente la busca.
    const sale = sugerirSitios(motor.sitios, 'ceip moliner', null, 'colegio');
    assert.ok(
      sale.some((x) => x.codigo === 'Colegios.591'),
      `«ceip moliner» no trae el 591: ${sale.map((x) => x.codigo).join(', ')}`,
    );
  });

  test('⭐ COLOSO 2 → GUARDERÍA: la ruta sale y la llegada la nombra', () => {
    const t = pedir({ origen: COLOSO, destino: CHICOTES, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 6, `solo ${t.pasos.length} pasos`);
    // 3.453 m de recta; medidos 4.262, que es ×1,23.
    assert.ok(t.metros > 3453, `${t.metros} m es menos que la línea recta`);
    assert.ok(t.metros < 6906, `${t.metros} m es el doble de la línea recta`);
    assert.equal(t.segundos, Math.round(t.metros / (5000 / 3600)));
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^C\.E\.I\. Chicotes · C\/ Balbino Orensanz, 55 está a la (derecha|izquierda)$/,
      t.pasos[t.pasos.length - 1]!.texto,
    );
  });

  test('⭐ COLOSO 2 → UNIVERSIDAD: la ruta sale, y llega al RECINTO', () => {
    const t = pedir({ origen: COLOSO, destino: VETERINARIA, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 10, `solo ${t.pasos.length} pasos`);
    // 5.319 m de recta; medidos 6.838, que es ×1,29 — el más torcido de los
    // tres, y se dice: el campus queda al otro lado del río y del Canal, así
    // que el rodeo es la ciudad, no el motor.
    assert.ok(t.metros > 5319, `${t.metros} m es menos que la línea recta`);
    assert.ok(t.metros < 10638, `${t.metros} m es el doble de la línea recta`);
    // ⚠️ Aquí NO vale la igualdad exacta que usan las otras juez, y esta ruta
    // es la que lo destapó: `metros` y `segundos` se redondean **los dos por
    // separado desde la misma cifra sin redondear** (`trayecto.ts`, 210-211),
    // así que rehacer la división con los metros YA redondeados puede dar un
    // segundo de menos. Aquí da 4.923 y el motor dice 4.924, porque los metros
    // de verdad son 6.838,9 y no 6.838. Las otras juez pasan por los pelos.
    // Se exige lo que de verdad se cumple siempre: un segundo de margen.
    assert.ok(
      Math.abs(t.segundos - Math.round(t.metros / (5000 / 3600))) <= 1,
      `${t.segundos} s no cuadra con ${t.metros} m ni con un segundo de margen`,
    );
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^Facultad de Veterinaria · C\/ Miguel Servet, 177 está a la (derecha|izquierda)$/,
      t.pasos[t.pasos.length - 1]!.texto,
    );
  });

  test('⭐ y la universidad conserva su coordenada del fichero: es RECINTO', () => {
    // La contraparte de la juez de arriba, igual que en bibliotecas: las
    // universidades no pasan por el cheque de distancia (firma del 25/08), así
    // que la ruta llega a donde el Ayuntamiento la pone y no a la puerta que su
    // dirección nombra. Un campus tiene varias.
    const u = motor.sitios.donde.get('Universidades.8226')!;
    assert.equal(u.lon, -0.8614534089812746);
    assert.equal(u.lat, 41.63448972768281);
  });

  test('⭐ EL ANDRÉS OLIVÁN llega a SAN JUAN DE MOZARRIFAR, su barrio', () => {
    // ⭐ El reverso del testigo que vivió aquí un día. La nº14 se abrió con una
    // prueba que AFIRMABA el fallo —el colegio aterrizando a 7,6 km, en la
    // calle de la ciudad que se llama casi igual— y escrita para caerse sola el
    // día que se arreglara. Se cayó, y esto es lo que la sustituye.
    //
    // Su coordenada es la del fichero municipal, sin tocar: ya no se rescata,
    // porque el emparejador encuentra «CALLE DOCTOR PALOMAR ---SJN» —que tiene
    // una puerta a 11 m— y esa gana a la homónima parcial de la ciudad.
    const s = motor.sitios.donde.get('Colegios.549')!;
    assert.equal(s.lon, -0.8426853752732937);
    assert.equal(s.lat, 41.716620571592415);
    assert.equal(
      motor.sitios.rescatados.some((r) => r.codigo === 'Colegios.549'),
      false,
      'el Andrés Oliván ha vuelto a moverse',
    );
  });

  test('⭐ y la RUTA hasta él sale, con los metros de una ruta a un barrio rural', () => {
    const t = pedir({ origen: COLOSO, destino: { sitio: 'Colegios.549' }, modo: 'andando' });
    assert.equal(t.avisos.length, 0, t.avisos[0]?.texto);
    assert.ok(t.pasos.length > 4, `solo ${t.pasos.length} pasos`);
    // EL COLOSO 2 está en Parque Goya, al norte, y San Juan de Mozarrifar
    // también: son 4.437 m en línea recta, mucho menos que los 14 km que habría
    // desde el centro. La ruta no puede ser más corta que la recta.
    assert.ok(t.metros > 4437, `${t.metros} m es menos que la línea recta`);
    assert.ok(t.metros < 8874, `${t.metros} m es el doble de la línea recta`);
    assert.equal(t.segundos, Math.round(t.metros / (5000 / 3600)));
    assert.match(
      t.pasos[t.pasos.length - 1]!.texto,
      /^C\.E\.I\.P\. Andrés Oliván · C\/ Doctor Alejandro Palomar, 21 está a la (derecha|izquierda)$/,
      t.pasos[t.pasos.length - 1]!.texto,
    );
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

describe('⭐ Una VÍA SIN PORTAL, de punta a punta (27/08)', () => {
  before(() => {
    const red = cargarRed(cargarGrafo());
    const portales = cargarPortales();
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

  /**
   * ⭐ EL CASO, elegido del dato y declarado para que no se mueva.
   *
   * **PUENTE DE PIEDRA**, código de vía `23125`, **cero portales** — un puente
   * no tiene portales, y por eso hasta hoy no se podía ni escribir. Su punto de
   * resolución es el medio de su geometría en la capa de ejes:
   * `[-0,875317, 41,657227]`, sobre el Ebro.
   *
   * El origen es **CALLE MAYOR 1** (`Portales.104742`), en el casco viejo, a
   * `[-0,877335, 41,654165]`.
   */
  const PUENTE = { via: '23125', portal: '23125' };
  const MAYOR_1 = { via: '18600', portal: 'Portales.104742' };

  test('se puede pedir la ruta, y sale', () => {
    const t = pedir({ origen: MAYOR_1, destino: PUENTE, modo: 'andando' });
    assert.deepEqual(t.avisos, [], 'ha contestado con aviso en vez de con ruta');
    assert.ok(t.pasos.length > 0);
    assert.ok(t.geometria.length > 0);
  });

  test('⭐ y los METROS son coherentes con la recta: 402 andando para 379 en línea', () => {
    /**
     * La comprobación que separa «contesta algo» de «contesta bien». Del portal
     * al punto medio del puente hay **379 m en línea recta** (haversine), y la
     * ruta mide **402 m**: un factor de **1,06**.
     *
     * Ese factor es lo que se juzga, no el número suelto. Un punto medio mal
     * calculado —el primer vértice, la media de los vértices— seguiría dando
     * una ruta perfectamente válida; lo que delataría es que la ruta y la recta
     * dejarían de parecerse a la ruta y la recta de ESTE punto.
     */
    const t = pedir({ origen: MAYOR_1, destino: PUENTE, modo: 'andando' });
    const punto = motor.callejero.puntoDeVia.get('23125')!;
    const salida = motor.portales.donde.get('Portales.104742')!;
    const recta = metrosEntre(salida.lat, salida.lon, punto.lat, punto.lon);
    assert.ok(Math.abs(recta - 379) <= 1, `la recta mide ${recta.toFixed(0)} m, no 379`);
    assert.equal(t.metros, 402);
    assert.ok(t.metros / recta < 1.3, `la ruta da un rodeo de ${(t.metros / recta).toFixed(2)}×`);
  });

  test('⭐ la LLEGADA lo nombra, y sin número: no hay ninguno que decir', () => {
    const t = pedir({ origen: MAYOR_1, destino: PUENTE, modo: 'andando' });
    const ultimo = t.pasos[t.pasos.length - 1]!;
    assert.equal(ultimo.giro, 'llegada');
    assert.match(ultimo.texto, /Puente de Piedra/);
    // Y NO le cuelga un número inventado detrás del nombre.
    assert.equal(/Puente de Piedra \d/.test(ultimo.texto), false, ultimo.texto);
  });

  test('⭐ la INVERSA: se sale del puente igual que se llega a él', () => {
    const t = pedir({ origen: PUENTE, destino: MAYOR_1, modo: 'andando' });
    assert.deepEqual(t.avisos, []);
    assert.match(t.pasos[0]!.texto, /Puente de Piedra/);
  });

  test('⭐ y sirve de FOCO: el mismo código resuelve a punto donde sea que viaje', () => {
    // Es la propiedad que hace que esto no sea un truco: elegir el puente en un
    // campo tiene que ordenar la lista del otro. Si `puntoDeVia` no resolviera
    // aquí, el campo contrario se quedaría sin foco y nada se pondría rojo.
    const punto = motor.callejero.puntoDeVia.get('23125')!;
    const cerca = buscar(motor.callejero, 'jaime', punto).map((v) => v.limpio);
    const lejos = buscar(motor.callejero, 'jaime').map((v) => v.limpio);
    assert.notDeepEqual(cerca, lejos, 'el foco en el puente no ha cambiado nada');
  });

  test('la comprobación cruzada distingue los TRES casos, y no los mezcla', () => {
    // 1 · Un punto de vía puesto en la vía equivocada.
    const cruzado = pedir({
      origen: { via: '18600', portal: '23125' },
      destino: MAYOR_1,
      modo: 'andando',
    });
    assert.match(cruzado.avisos[0]!.texto, /no es de la vía 18600/);

    // 2 · Una vía QUE SÍ TIENE PORTALES pedida por su código de vía. La puerta
    //     de las sin-portal no se abre para las que sí los tienen: ahí hay que
    //     elegir una puerta, que es lo que la casilla del Nº existe para hacer.
    const conPortales = pedir({
      origen: { via: '18600', portal: '18600' },
      destino: PUENTE,
      modo: 'andando',
    });
    assert.match(conPortales.avisos[0]!.texto, /No conocemos ningún portal con el código 18600/);

    // 3 · Y una de las 9 que no se pueden situar sigue sin poderse pedir: la
    //     GLORIETA LAS BANDERAS (3410), que la capa de ejes no conoce.
    const sinPunto = pedir({
      origen: { via: '3410', portal: '3410' },
      destino: MAYOR_1,
      modo: 'andando',
    });
    assert.match(sinPunto.avisos[0]!.texto, /No conocemos ningún portal con el código 3410/);
  });
});
