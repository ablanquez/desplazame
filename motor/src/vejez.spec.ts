/**
 * ⭐ EL AVISO DE VEJEZ DEL FEED, EN PANTALLA (8/09, M0 del punto 14).
 *
 * ── Por qué sube ────────────────────────────────────────────────────────────
 *
 * El motor ya sabía que el feed se le queda viejo: lo grita al arrancar, con el
 * umbral del validador canónico —**caducar en ≤7 días es aviso** [MobilityData
 * GTFS Validator]—. Pero ese grito vive en el log, y **el log lo lee quien
 * despliega, no quien busca una ruta**. Quien busca la ruta ve unos horarios y
 * no tiene forma de saber que están a punto de dejar de valer.
 *
 * Así que el aviso sube: la misma condición, el mismo umbral y la misma fecha,
 * dichos en la respuesta de bus.
 *
 * ⚠️ **Y es CADUCIDAD, no antigüedad.** Son dos cosas distintas y hoy no
 *    coinciden: el zip que se sirve tiene 7 días de edad —lo trajo el NAP el
 *    30/06— pero cubre hasta el 20261005, o sea 27 días por delante. Lo que le
 *    importa a quien viaja es hasta cuándo valen los horarios que está
 *    leyendo, y eso es `feed_end_date`. Ver la nota del checkpoint del 8/09.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  avisoDeVejezDelFeed,
  elFeedQueSeSirve,
  servirEsteFeedInfo,
  TOPE_DEL_AVISO,
  type FeedInfo,
} from './feed.ts';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import type { Extremo } from './etapas.ts';
import { andarConElPeaton, cocinar, type RedDeBus } from './red-bus.ts';
import { prepararViajeEnBus } from './viaje-bus.ts';
import type { Motor } from './trayecto.ts';

/**
 * ⭐ EL RECONOCEDOR, POR LA FORMA Y NO POR LA PROSA — el patrón `esDelFestivo`.
 *
 * ⚠️ La lección del 6/09: cuatro jueces buscaban «cuadro web de Avanza», la
 *    frase se acortó, y las cuatro dieron por «no hay aviso» en vez de por «el
 *    aviso cambió». Aquí se reconoce por el arranque —`Horarios de Avanza `—,
 *    que es lo que la frase no puede perder sin dejar de ser este aviso.
 */
const esDeLaVejez = (a: { readonly texto: string }): boolean =>
  /^Horarios de Avanza /.test(a.texto);

/** El feed de verdad, para no inventarse fechas. */
let real: FeedInfo;

/** Un martes cualquiera, dentro de la cobertura del feed que se sirve. */
const UN_MARTES = '20260907';

describe('⭐ LA FRASE — corta, con su fecha, y solo cuando toca', () => {
  before(() => {
    real = elFeedQueSeSirve().info!;
  });

  /**
   * ⭐ JUEZ 1 — CON EL FEED A PUNTO DE CADUCAR, HAY AVISO Y NOMBRA LA FECHA.
   *
   * El reloj es falso y el feed es el de verdad: se mueve el día, no el dato.
   * Tres días antes del `feed_end_date` estamos dentro del umbral de los 7.
   */
  test('⭐ 1 · a tres días de caducar hay aviso, y dice la fecha del feed_info', () => {
    const dicho = avisoDeVejezDelFeed(real, '20261002');
    assert.ok(dicho, 'a 3 días del final tiene que haber aviso');
    assert.ok(esDeLaVejez({ texto: dicho }), `no tiene la forma del aviso: «${dicho}»`);
    assert.match(dicho, /05\/10/, `tiene que nombrar el 05/10 (feed_end_date ${real.feedEndDate})`);
  });

  /** ⭐ JUEZ 2 — Y CON EL FEED YA CADUCADO TAMBIÉN, con su fecha. */
  test('⭐ 2 · pasado el final hay aviso, y también nombra la fecha', () => {
    const dicho = avisoDeVejezDelFeed(real, '20261101');
    assert.ok(dicho, 'un mes después del final tiene que haber aviso');
    assert.ok(esDeLaVejez({ texto: dicho }), `no tiene la forma del aviso: «${dicho}»`);
    assert.match(dicho, /05\/10/, 'tiene que nombrar el 05/10');
  });

  /** ⭐ JUEZ 3 — CON FEED FRESCO, SILENCIO. */
  test('⭐ 3 · con el feed vigente no hay aviso ninguno', () => {
    assert.equal(avisoDeVejezDelFeed(real, '20260908'), null, '27 días por delante es vigente');
  });

  /**
   * ⭐ JUEZ 4 — EL BORDE DEL UMBRAL, que es el del validador y no el nuestro.
   *
   * `feed_end_date` cuenta como cubierto, así que el 20260928 quedan 7 días y
   * **eso ya es aviso**; el 20260927 quedan 8 y todavía no.
   */
  test('⭐ 4 · el umbral son 7 días exactos: a 8 calla, a 7 habla', () => {
    assert.equal(avisoDeVejezDelFeed(real, '20260927'), null, 'a 8 días todavía no');
    assert.ok(avisoDeVejezDelFeed(real, '20260928'), 'a 7 días ya sí');
  });

  /** ⭐ JUEZ 5 — LA FRASE CABE. Best Practices: sé conciso. */
  test('⭐ 5 · la frase no pasa del tope, en los dos estados', () => {
    for (const hoy of ['20261002', '20261101', '20260930']) {
      const dicho = avisoDeVejezDelFeed(real, hoy);
      if (dicho) {
        assert.ok(
          dicho.length <= TOPE_DEL_AVISO,
          `«${dicho}» son ${dicho.length} caracteres y el tope es ${TOPE_DEL_AVISO}`,
        );
      }
    }
  });

  /**
   * ⭐ JUEZ 6 — SIN FEED_INFO NO SE INVENTA UNA FECHA.
   *
   * `feed_info.txt` es OPCIONAL en la referencia de GTFS. Un feed que no dice
   * hasta cuándo vale no puede presentarse como vigente ni como caducado con
   * una fecha de mentira: se avisa SIN fecha, que es lo que consta.
   */
  test('⭐ 6 · sin feed_info hay aviso pero sin fecha inventada', () => {
    assert.equal(avisoDeVejezDelFeed(null, UN_MARTES), null, 'sin info no hay nada que decir');
    const sinFin: FeedInfo = { feedVersion: 'X', feedStartDate: '20260101', feedEndDate: '' };
    const dicho = avisoDeVejezDelFeed(sinFin, UN_MARTES);
    assert.ok(dicho, 'un feed sin fecha de fin no se puede dar por bueno');
    assert.doesNotMatch(dicho, /\d\d\/\d\d/, `no puede nombrar una fecha: «${dicho}»`);
    assert.ok(dicho.length <= TOPE_DEL_AVISO, `${dicho.length} > ${TOPE_DEL_AVISO}`);
  });
});

describe('⭐ Y EN LA RESPUESTA DE BUS — que es donde tiene que verse', () => {
  let motor: Motor;
  let red: RedDeBus;
  let portales: PortalesEnMemoria;
  let peaton: RedEnMemoria;

  before(async () => {
    peaton = cargarRed(cargarGrafo());
    const rejilla = cargarRejilla(peaton);
    const cuaderno = cuadernoPara(peaton);
    const andar = andarConElPeaton(peaton, rejilla, cuaderno);
    motor = { red: peaton, rejilla, cuaderno } as unknown as Motor;
    portales = cargarPortales();
    red = (await cocinar(elFeedQueSeSirve().ruta, andar)).red;
    real = elFeedQueSeSirve().info!;
  });

  const extremo = (codigo: string, nombre: string): Extremo => {
    const p = portales.donde.get(codigo)!;
    return { lon: p.lon, lat: p.lat, nombre };
  };

  /** El viaje del ojo, el mismo par que juzga `viaje-bus.spec.ts`. */
  const elViaje = (fecha: string) =>
    prepararViajeEnBus(
      motor,
      red,
      extremo('Portales.93310', 'CALLE EL COLOSO 2'),
      extremo('Portales.79358', 'CALLE LEOPOLDO ROMEO 27'),
      fecha,
    ).trayecto();

  /**
   * ⭐ JUEZ 7 — EL AVISO LLEGA AL TRAYECTO, y no se cuelga de ningún paso.
   *
   * Es del **viaje entero**: no hay un paso concreto al que echarle la culpa de
   * que el horario caduque. Por eso va sin `paso`, como «no hay ruta».
   */
  test('⭐ 7 · con el feed servido y a punto de caducar, el viaje lo dice', () => {
    servirEsteFeedInfo(real);
    try {
      const t = elViaje('20261002');
      const suyos = t.avisos.filter(esDeLaVejez);
      assert.equal(suyos.length, 1, `avisos: ${JSON.stringify(t.avisos)}`);
      assert.match(suyos[0]!.texto, /05\/10/);
      assert.equal(suyos[0]!.paso, undefined, 'es del viaje entero, no de un paso');
      assert.ok(t.pasos.length > 0, 'y el viaje sigue saliendo: el aviso no lo rompe');
    } finally {
      servirEsteFeedInfo(null);
    }
  });

  /** ⭐ JUEZ 8 — CON FEED FRESCO EL VIAJE CALLA. */
  test('⭐ 8 · con el feed vigente el viaje no lleva el aviso', () => {
    servirEsteFeedInfo(real);
    try {
      const t = elViaje(UN_MARTES);
      assert.deepEqual(t.avisos.filter(esDeLaVejez), []);
    } finally {
      servirEsteFeedInfo(null);
    }
  });

  /**
   * ⭐ JUEZ 9 — Y SI NADIE HA SERVIDO EL FEED, SILENCIO.
   *
   * Las jueces no arrancan el servidor, así que aquí no hay feed servido. **No
   * saber no es saber que está viejo**: se calla, igual que los desvíos cuando
   * la fuente no contesta.
   */
  test('⭐ 9 · sin feed servido no se avisa de nada', () => {
    servirEsteFeedInfo(null);
    assert.deepEqual(elViaje('20261101').avisos.filter(esDeLaVejez), []);
  });
});
