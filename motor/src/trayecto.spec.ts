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
import { calcularTrayecto, leerPeticion, type Motor } from './trayecto.ts';

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
    motor = {
      red,
      rejilla: cargarRejilla(red),
      portales,
      callejero: cargarCallejero(portales),
      sitios: cargarSitios(),
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
