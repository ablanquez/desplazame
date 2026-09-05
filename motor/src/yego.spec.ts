/**
 * ⭐ LAS JUECES DE LA FLOTA VIVA DE YeGo (4/09, punto 13 casilla 2).
 *
 * ⚠️ **CERO RED.** La función que sale a internet recibe quién pide por
 *    parámetro, así que aquí no se toca YeGo: se le da un cuerpo y se mira qué
 *    hace con él.
 *
 * ⚠️ **Y LOS CUERPOS SON DEL FEED DE VERDAD, PEGADOS TAL CUAL** — sonda del
 *    05/09/2026 08:11:34 GMT, § 1.34 —. Los registros no están compuestos: son
 *    **doce de los 166** que el `free_bike_status` devolvió, copiados carácter a
 *    carácter con su `bike_id` rotado, su autonomía y su `is_disabled`. Lo que
 *    se elige es CUÁLES entran, no qué dicen — es el mismo trato que
 *    `distintivo.spec.ts` le da a los cuatro cuerpos de la DGT, y la ley que
 *    dejó la entrada nº32 de la bitácora: un fixture no se inventa la forma.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  dentroDelArea,
  edadEnPalabras,
  elAreaDeServicio,
  laFlotaViva,
  leerArea,
  leerFlota,
  motosCerca,
  olvidarElArea,
  olvidarLaFlota,
  TIPO_QUE_SE_USA,
  TTL_S,
  type Pedir,
} from './yego.ts';

/**
 * ⭐ DOCE MOTOS DEL FEED REAL, con el sobre real.
 *
 * Las nueve primeras son las más cercanas a `CALLE PEDRO LAPUYADE 3` —el origen
 * de siempre de estas jueces—, la décima es la **deshabilitada** más cercana, y
 * las dos últimas son las que están al otro lado. El sobre —`last_updated`,
 * `ttl`, `version`— es el que vino.
 */
const DEL_FEED = {
  last_updated: 1788595916,
  ttl: 240,
  version: '2.3',
  data: {
    bikes: [
      { bike_id: "68566601-eca5-45a7-8c66-ef457d32536f", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.637122, lon: -0.88283, vehicle_type_id: "yego_scooter", current_range_meters: 9500, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 19 },
      { bike_id: "6b49516b-5ae3-4146-b228-4c8307b1959e", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.638947, lon: -0.886407, vehicle_type_id: "yego_scooter", current_range_meters: 7500, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 15 },
      { bike_id: "0cdf7e68-bf33-410d-851c-ef35b451fec8", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.633765, lon: -0.887875, vehicle_type_id: "yego_scooter", current_range_meters: 35000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 70 },
      { bike_id: "806a4b89-2e62-401e-ac98-5cd63eb867ae", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.633737, lon: -0.887862, vehicle_type_id: "yego_scooter", current_range_meters: 25000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 50 },
      { bike_id: "26db9771-69cd-426a-af8f-934ef2d7f05e", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.63369, lon: -0.887843, vehicle_type_id: "yego_scooter", current_range_meters: 9500, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 19 },
      { bike_id: "40ad1d4c-7638-42b6-989f-e2370644ce1d", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.63372, lon: -0.887878, vehicle_type_id: "yego_scooter", current_range_meters: 30000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 60 },
      { bike_id: "b3a9d56e-a962-4f7b-91c5-67a92b685e68", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.633698, lon: -0.887955, vehicle_type_id: "yego_scooter", current_range_meters: 26000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 52 },
      { bike_id: "6c2db7a0-d8b1-4a67-a417-35b47c19a60e", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.633668, lon: -0.888028, vehicle_type_id: "yego_scooter", current_range_meters: 17000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 34 },
      { bike_id: "1ea2898c-0e4c-4931-b2a6-5dfb5485c342", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.633463, lon: -0.888747, vehicle_type_id: "yego_scooter", current_range_meters: 33000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 66 },
      { bike_id: "b3d02e1a-8092-474b-aeeb-a0ceb4445a0e", is_reserved: false, is_disabled: true, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.64115, lon: -0.892352, vehicle_type_id: "yego_scooter", current_range_meters: 36000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 72 },
      { bike_id: "3e81bbb5-6df6-444e-ab40-252e170923f0", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.64057, lon: -0.88736, vehicle_type_id: "yego_scooter", current_range_meters: 16500, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 33 },
      { bike_id: "edf4e3c4-30ef-4e98-9bba-64b2ba6e69e0", is_reserved: false, is_disabled: false, rental_uris: {android: "yego://", ios: "yego://"}, lat: 41.641862, lon: -0.885623, vehicle_type_id: "yego_scooter", current_range_meters: 38000, pricing_plan_id: "zaragoza yego_scooter", last_reported: 1788595916, current_fuel_percent: 76 },
    ],
  },
};

/** `CALLE PEDRO LAPUYADE 3`, el origen de siempre de estas jueces. */
const LAPUYADE: readonly [number, number] = [-0.884024, 41.636197];

/**
 * Una fuente de mentira que cuenta cuántas veces la han llamado.
 *
 * Es el mismo ayudante que `distintivo.spec.ts`, y por lo mismo: lo que se
 * compra aquí es **cuántas salidas a la red hay**, y eso solo se puede contar
 * desde fuera.
 */
function fuente(cuerpo: unknown, tarda = 0): { pedir: Pedir; visitas: () => number } {
  let visitas = 0;
  const pedir: Pedir = async () => {
    visitas++;
    if (tarda > 0) {
      await new Promise((sigue) => setTimeout(sigue, tarda));
    }
    return { ok: true, cuerpo };
  };
  return { pedir, visitas: () => visitas };
}

describe('⭐ LA FLOTA VIVA DE YeGo — el feed, la caché y la edad', () => {
  /**
   * ⭐ JUEZ A — EL PARSEO: doce dentro, once viables, y el sobre entero.
   *
   * Lo que se compra es que **la deshabilitada no pasa el filtro** y que la
   * autonomía llega en metros tal cual. Y que el `last_updated` del sobre se
   * guarda como la hora del dato: es la única que se puede decir, porque el
   * `last_reported` por moto es el mismo sello del volcado en las 166 (§ 1.34).
   */
  test('⭐ A · el feed se lee, y la deshabilitada no entra en las viables', () => {
    const flota = leerFlota(DEL_FEED);
    assert.ok(flota);
    assert.equal(flota.total, 12, 'las doce que trae el sobre');
    assert.equal(flota.motos.length, 11, 'once viables: la deshabilitada se cae');
    assert.equal(
      flota.motos.some((m) => m.id === 'b3d02e1a-8092-474b-aeeb-a0ceb4445a0e'),
      false,
      'la deshabilitada se ha colado',
    );
    // El sobre: la hora del dato es el `last_updated`, en segundos Unix.
    assert.equal(flota.cuando.getTime(), 1788595916 * 1000);
    // Y los campos que el motor mira, tal cual vinieron.
    const primera = flota.motos[0]!;
    assert.equal(primera.id, '68566601-eca5-45a7-8c66-ef457d32536f');
    assert.equal(primera.autonomiaM, 9500);
    assert.equal(primera.bateriaPct, 19);
    assert.equal(primera.lon, -0.88283);
    assert.equal(primera.lat, 41.637122);
  });

  /**
   * ⭐ JUEZ B — SOLO EL TIPO QUE SE USA, y **por `vehicle_type_id`**.
   *
   * ⚠️ § 1.34 lo mide: los `form_factor` de `vehicle_types` están **cruzados**
   *    con sus propios nombres —la «bicicleta» se declara `scooter` y el
   *    «patinete» se declara `bicycle`—. Seleccionar por ahí cogería el
   *    vehículo equivocado el día que la flota deje de ser homogénea. Hoy son
   *    166 de 166 `yego_scooter`, pero la clave es el id, no la forma.
   */
  test('⭐ B · solo entra `yego_scooter`, y se elige por el id del tipo', () => {
    assert.equal(TIPO_QUE_SE_USA, 'yego_scooter');
    const conIntrusa = {
      ...DEL_FEED,
      data: {
        bikes: [
          ...DEL_FEED.data.bikes.slice(0, 2),
          // Una bici del catálogo de YeGo, con el `form_factor` que el feed le
          // da de verdad: `scooter`. No es una moto y no puede entrar.
          { ...DEL_FEED.data.bikes[0]!, bike_id: 'no-es-una-moto', vehicle_type_id: 'yego_bike' },
        ],
      },
    };
    const flota = leerFlota(conIntrusa);
    assert.ok(flota);
    assert.equal(flota.motos.length, 2);
    assert.equal(flota.motos.some((m) => m.id === 'no-es-una-moto'), false);
  });

  /**
   * ⭐ JUEZ C — LA PODA POR RECTA, que es poda y no radio.
   *
   * Mismo papel que los 40 aparcamotos del remate y los 40 postes del bus: no
   * hay ninguna distancia a partir de la cual una moto «no existe»; lo que hay
   * es un límite a cuántas se le pasan al Dijkstra. Quien elige es el coste.
   */
  test('⭐ C · las candidatas vienen de la más cercana a la más lejana', () => {
    const flota = leerFlota(DEL_FEED)!;
    const cerca = motosCerca(flota, LAPUYADE[0], LAPUYADE[1], 5);
    assert.equal(cerca.length, 5);
    for (let k = 1; k < cerca.length; k++) {
      assert.ok(cerca[k]!.enRecta >= cerca[k - 1]!.enRecta, `la ${k} está más cerca`);
    }
    // La más cercana es la que se midió el 5/09: a 143 m del portal.
    assert.equal(cerca[0]!.id, '68566601-eca5-45a7-8c66-ef457d32536f');
    assert.ok(Math.abs(cerca[0]!.enRecta - 143) < 5, `${cerca[0]!.enRecta} m`);
    // Y pedir más de las que hay devuelve las que hay, sin inventar.
    assert.equal(motosCerca(flota, LAPUYADE[0], LAPUYADE[1], 999).length, 11);
  });

  /**
   * ⭐ JUEZ D — LA CACHÉ RESPETA EL `ttl`, y **aquí eso es la doctrina**.
   *
   * Al revés que con la BiZi, que se pregunta en cada ruta. § 1.34 lo argumenta:
   * la sede no dice cada cuánto cambia y YeGo **sí** —`ttl: 240`, y tres
   * lecturas separadas 20 s dieron el mismo `last_updated`—. Pedirlo más a
   * menudo no trae dato nuevo: trae el mismo fichero de 59 kB.
   */
  test('⭐ D · dos consultas dentro del ttl son UNA sola salida a YeGo', async () => {
    olvidarLaFlota();
    const { pedir, visitas } = fuente(DEL_FEED);
    const una = await laFlotaViva(pedir);
    const otra = await laFlotaViva(pedir);
    assert.ok(una && otra);
    assert.equal(visitas(), 1, 'ha salido dos veces a la red dentro del ttl');
    // Y la segunda devuelve el MISMO dato, no una copia recalculada.
    assert.equal(otra.cuando.getTime(), una.cuando.getTime());
    assert.equal(otra.motos.length, una.motos.length);
    assert.equal(TTL_S, 240);
  });

  /**
   * ⭐ JUEZ E — EL *SINGLE-FLIGHT*: diez rutas a la vez, una sola petición.
   *
   * Es el mismo mecanismo del BiZi y de Avanza [*request coalescing*;
   * `singleflight` de Go], y aquí se suma a la caché en vez de sustituirla: la
   * caché evita las que llegan **después**, el single-flight las que llegan
   * **a la vez**.
   */
  test('⭐ E · diez consultas simultáneas salen a YeGo una sola vez', async () => {
    olvidarLaFlota();
    const { pedir, visitas } = fuente(DEL_FEED, 30);
    const diez = await Promise.all(Array.from({ length: 10 }, () => laFlotaViva(pedir)));
    assert.equal(visitas(), 1, `${visitas()} salidas para diez consultas a la vez`);
    for (const f of diez) {
      assert.ok(f);
      assert.equal(f.motos.length, 11);
    }
  });

  /**
   * ⭐ JUEZ F — EL MUDO HONESTO: con YeGo caído no se inventa una flota.
   *
   * Y **no se cachea el silencio**: la siguiente consulta vuelve a preguntar.
   * Cachear un fallo cuatro minutos sería dejar la aplicación muda por un corte
   * de red de un segundo.
   */
  test('⭐ F · si YeGo no contesta se devuelve `null`, y no se guarda el silencio', async () => {
    olvidarLaFlota();
    let visitas = 0;
    const mudo: Pedir = async () => {
      visitas++;
      return { ok: false, cuerpo: null };
    };
    assert.equal(await laFlotaViva(mudo), null);
    assert.equal(await laFlotaViva(mudo), null);
    // ⭐ CUATRO, no dos: cada consulta lleva **un reintento** con 300 ms en
    //    medio, igual que Avanza. Que sean cuatro y no dos es lo que compra que
    //    el reintento existe; que sean cuatro y no dos ni tres es lo que compra
    //    que el silencio NO se ha guardado — con caché de fallos habrían sido
    //    dos y la segunda consulta ni habría salido.
    assert.equal(visitas, 4, 'dos consultas × (un intento + un reintento)');

    // Y un cuerpo con la forma rota tampoco pasa por bueno.
    for (const roto of [null, {}, { data: {} }, { data: { bikes: 'no es una lista' } }]) {
      assert.equal(leerFlota(roto), null, JSON.stringify(roto));
    }
    // Un sobre sin `last_updated` no vale: sin hora del dato no hay edad que
    // decir, y decir una edad falsa es peor que no decir ninguna.
    assert.equal(leerFlota({ data: { bikes: DEL_FEED.data.bikes } }), null);
  });

  /**
   * ⭐ JUEZ G — LA EDAD DEL DATO, dicha en cristiano.
   *
   * Es la mitad que hace honesta a la caché: si el dato puede tener hasta cuatro
   * minutos, quien lo lee tiene derecho a saber cuántos lleva.
   */
  test('⭐ G · la edad se dice en minutos, y por debajo del minuto se dice eso', () => {
    const t = new Date(1788595916 * 1000);
    assert.equal(edadEnPalabras(t, new Date(t.getTime() + 5_000)), 'hace menos de 1 min');
    assert.equal(edadEnPalabras(t, new Date(t.getTime() + 65_000)), 'hace 1 min');
    assert.equal(edadEnPalabras(t, new Date(t.getTime() + 185_000)), 'hace 3 min');
    // Y un reloj que va para atrás no produce «hace -2 min».
    assert.equal(edadEnPalabras(t, new Date(t.getTime() - 60_000)), 'hace menos de 1 min');
  });
});


/**
 * ⭐ EL FEED DE ZONAS ENTERO, PEGADO TAL CUAL — sonda del 05/09/2026 14:30:39
 * GMT, 4.319 bytes, § 1.34.
 *
 * ⚠️ **Aquí no hay selección que valga: está el feed completo.** El de la flota
 *    trae doce motos de 166 porque 166 no caben; éste cabe entero, y entero
 *    entra — sobre, `rules`, el `station_parking` que es de GBFS 3.0 en un feed
 *    2.3, y las diez manchas con sus 163 vértices. Los comentarios de cada
 *    mancha son cuentas sobre lo que hay debajo, no dato.
 *
 * ⭐ **Y la mancha 3 trae DOS HUECOS**, que es lo que hace a este fixture algo
 *    más que geometría de relleno: dentro de ellos están el Paseo de la
 *    Independencia, la Plaza de Aragón y la Plaza de España — 41 portales del
 *    centro que **quedan fuera del área** [medido el 5/09]. Un punto-en-polígono
 *    que se saltara los huecos daría verde diciendo lo contrario.
 */
const DEL_FEED_DE_ZONAS = {
  last_updated: 1788618639,
  ttl: 240,
  version: '2.3',
  data: {
    geofencing_zones: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'no go zone',
            rules: [
              {
                vehicle_type_id: ['yego_scooter', 'yego_bike', 'yego_kick'],
                ride_allowed: true,
                ride_through_allowed: true,
              },
            ],
            station_parking: false,
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              // ── mancha 0 · un anillo · 5 vértices
              [
                [
                  [-0.937605, 41.642958], [-0.933955, 41.643188], [-0.933909, 41.642958],
                  [-0.937421, 41.642683], [-0.937605, 41.642958],
                ]
              ],
              // ── mancha 1 · un anillo · 5 vértices
              [
                [
                  [-0.9349, 41.659535], [-0.931497, 41.659523], [-0.931553, 41.658588],
                  [-0.934894, 41.658725], [-0.9349, 41.659535],
                ]
              ],
              // ── mancha 2 · un anillo · 5 vértices
              [
                [
                  [-0.931232, 41.640727], [-0.929274, 41.642206], [-0.927912, 41.641793],
                  [-0.929046, 41.639959], [-0.931232, 41.640727],
                ]
              ],
              // ── mancha 3 · 3 anillos (exterior + 2 huecos) · 52 + 14 + 5 vértices
              [
                [
                  [-0.921336, 41.658376], [-0.916061, 41.657665], [-0.915759, 41.658213],
                  [-0.915787, 41.659503], [-0.914473, 41.661146], [-0.910034, 41.660206],
                  [-0.907715, 41.662076], [-0.906542, 41.662981], [-0.905541, 41.664515],
                  [-0.900543, 41.664475], [-0.894687, 41.66171], [-0.892704, 41.660344],
                  [-0.891074, 41.65894], [-0.888758, 41.658707], [-0.884664, 41.658096],
                  [-0.881507, 41.65795], [-0.878925, 41.657551], [-0.876021, 41.656179],
                  [-0.870847, 41.654291], [-0.86695, 41.65304], [-0.865426, 41.65246],
                  [-0.855712, 41.650088], [-0.856033, 41.649405], [-0.859148, 41.640207],
                  [-0.860794, 41.640093], [-0.861585, 41.639654], [-0.862071, 41.639177],
                  [-0.862581, 41.638433], [-0.863348, 41.638127], [-0.862122, 41.636123],
                  [-0.864727, 41.635093], [-0.868737, 41.637173], [-0.870831, 41.636257],
                  [-0.873385, 41.63536], [-0.874641, 41.636054], [-0.876957, 41.63724],
                  [-0.880111, 41.63473], [-0.884718, 41.638104], [-0.886333, 41.638859],
                  [-0.886912, 41.639659], [-0.88924, 41.640558], [-0.892674, 41.641054],
                  [-0.894307, 41.641933], [-0.898367, 41.63737], [-0.904904, 41.632921],
                  [-0.911826, 41.635832], [-0.914123, 41.64033], [-0.917524, 41.64937],
                  [-0.917199, 41.650477], [-0.918768, 41.652098], [-0.920772, 41.657467],
                  [-0.921336, 41.658376],
                ],
                [
                  [-0.885959, 41.647896], [-0.885488, 41.647351], [-0.884167, 41.647975],
                  [-0.884076, 41.648486], [-0.883924, 41.648781], [-0.882405, 41.650267],
                  [-0.881099, 41.651549], [-0.880188, 41.65173], [-0.880507, 41.65232],
                  [-0.881585, 41.652683], [-0.881676, 41.651889], [-0.884364, 41.649155],
                  [-0.884865, 41.648962], [-0.885959, 41.647896],
                ],
                [
                  [-0.880591, 41.656913], [-0.878304, 41.655794], [-0.878055, 41.656076],
                  [-0.880431, 41.657099], [-0.880591, 41.656913],
                ]
              ],
              // ── mancha 4 · un anillo · 40 vértices
              [
                [
                  [-0.907632, 41.669767], [-0.906452, 41.670041], [-0.898313, 41.671882],
                  [-0.897158, 41.672465], [-0.898041, 41.676111], [-0.890782, 41.676152],
                  [-0.890762, 41.678166], [-0.889269, 41.678134], [-0.889079, 41.676129],
                  [-0.884453, 41.675906], [-0.884252, 41.673215], [-0.877446, 41.673279],
                  [-0.877477, 41.673949], [-0.876742, 41.674524], [-0.871401, 41.67441],
                  [-0.87102, 41.674379], [-0.871365, 41.666752], [-0.868164, 41.665798],
                  [-0.865097, 41.662266], [-0.857872, 41.665095], [-0.853574, 41.657485],
                  [-0.85516, 41.652229], [-0.861556, 41.653999], [-0.866431, 41.65503],
                  [-0.869932, 41.656412], [-0.874824, 41.658239], [-0.876803, 41.658512],
                  [-0.878435, 41.659489], [-0.879438, 41.660327], [-0.881122, 41.660284],
                  [-0.881907, 41.660917], [-0.884996, 41.661176], [-0.888777, 41.662279],
                  [-0.890296, 41.663177], [-0.8925, 41.664463], [-0.89477, 41.666364],
                  [-0.89696, 41.668617], [-0.897984, 41.671245], [-0.907316, 41.669451],
                  [-0.907632, 41.669767],
                ]
              ],
              // ── mancha 5 · un anillo · 5 vértices
              [
                [
                  [-0.900517, 41.634147], [-0.900406, 41.634261], [-0.899675, 41.63363],
                  [-0.899778, 41.633538], [-0.900517, 41.634147],
                ]
              ],
              // ── mancha 6 · un anillo · 5 vértices
              [
                [
                  [-0.890536, 41.633454], [-0.890468, 41.633975], [-0.884339, 41.633425],
                  [-0.884417, 41.632896], [-0.890536, 41.633454],
                ]
              ],
              // ── mancha 7 · un anillo · 12 vértices
              [
                [
                  [-0.88862, 41.60693], [-0.888443, 41.607556], [-0.885333, 41.607045],
                  [-0.883899, 41.607424], [-0.88412, 41.609123], [-0.887009, 41.609634],
                  [-0.886767, 41.610326], [-0.880877, 41.609271], [-0.880304, 41.60815],
                  [-0.885443, 41.606847], [-0.888068, 41.606666], [-0.88862, 41.60693],
                ]
              ],
              // ── mancha 8 · un anillo · 5 vértices
              [
                [
                  [-0.874411, 41.616164], [-0.872324, 41.618269], [-0.870135, 41.617255],
                  [-0.872274, 41.614973], [-0.874411, 41.616164],
                ]
              ],
              // ── mancha 9 · un anillo · 10 vértices
              [
                [
                  [-0.862195, 41.63479], [-0.861483, 41.635575], [-0.861232, 41.636206],
                  [-0.860919, 41.63637], [-0.859542, 41.63506], [-0.858333, 41.635247],
                  [-0.857321, 41.634272], [-0.858919, 41.633347], [-0.860704, 41.633486],
                  [-0.862195, 41.63479],
                ]
              ],
            ],
          },
        },
      ],
    },
  },
};

/** Tres puntos medidos contra ese feed, para no repetirlos en cada juez. */
const ABEN_AIRE_33: readonly [number, number] = [-0.883141, 41.65758];
const INDEPENDENCIA_3: readonly [number, number] = [-0.881158, 41.651557];
const HEROINAS_17: readonly [number, number] = [-0.962188, 41.627303];

describe('⭐ EL ÁREA DE SERVICIO DE YeGo — la Service Zone que el contrato manda', () => {
  /**
   * ⭐ JUEZ H — SE LEEN LAS DIEZ MANCHAS, **y los huecos siguen ahí**.
   *
   * Lo que se compra no es que el JSON se parsee: es que la forma que sale de
   * `leerArea` sea la que el punto-en-polígono espera — una lista de manchas,
   * cada una con su anillo exterior primero y sus huecos detrás [RFC 7946
   * § 3.1.6]. Aplanar los anillos sería lo cómodo, y convertiría los dos huecos
   * del centro en dos manchas más.
   */
  test('⭐ H · el feed da diez manchas, 163 vértices y la del centro con sus dos huecos', () => {
    const area = leerArea(DEL_FEED_DE_ZONAS);
    assert.ok(area, 'el área no se ha leído');
    assert.equal(area.manchas.length, 10);
    const vertices = area.manchas.reduce(
      (suma, m) => suma + m.reduce((t, anillo) => t + anillo.length, 0),
      0,
    );
    assert.equal(vertices, 163);
    // Nueve manchas de un anillo y una de tres: exterior y dos huecos.
    assert.deepEqual(
      area.manchas.map((m) => m.length).sort((a, b) => a - b),
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
    );
    // Y la hora del dato es la del sobre, como en la flota.
    assert.equal(area.cuando.getTime(), 1788618639 * 1000);
  });

  /**
   * ⭐ JUEZ I — LO QUE NO SE PUEDE FIAR SE DEVUELVE COMO `null`.
   *
   * Mismo trato que la flota, y con un caso propio: **un área sin ninguna
   * mancha no es «no hay restricción», es un feed roto**. Devolverla vacía haría
   * que `dentroDelArea` dijera que no, y el motor rechazaría todos los destinos
   * de la ciudad por un fallo de lectura.
   */
  test('⭐ I · sin hora, sin manchas o con anillos rotos, el área es `null`', () => {
    const { data } = DEL_FEED_DE_ZONAS;
    // (a) Sin `last_updated` no hay hora del dato.
    assert.equal(leerArea({ data }), null);
    // (b) Sin `features` no hay nada que leer.
    assert.equal(
      leerArea({ last_updated: 1, data: { geofencing_zones: { type: 'FeatureCollection' } } }),
      null,
    );
    // (c) Cero manchas NO es un área vacía: es un feed roto.
    assert.equal(
      leerArea({
        last_updated: 1,
        data: { geofencing_zones: { type: 'FeatureCollection', features: [] } },
      }),
      null,
    );
    // (d) Y un anillo de tres esquinas o con coordenadas que no son números se
    //     tira: un polígono mal cerrado haría mentir al punto-en-polígono.
    const roto = (coordinates: unknown) => ({
      last_updated: 1,
      data: {
        geofencing_zones: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'MultiPolygon', coordinates } }],
        },
      },
    });
    assert.equal(leerArea(roto([[[[-0.88, 41.65], [-0.87, 41.65], [-0.88, 41.65]]]])), null);
    assert.equal(
      leerArea(roto([[[['-0.88', 41.65], [-0.87, 41.65], [-0.87, 41.66], [-0.88, 41.65]]]])),
      null,
    );
  });

  /**
   * ⭐ JUEZ J — DENTRO, FUERA, **Y EL HUECO CUENTA COMO FUERA**.
   *
   * La tercera es la que importa. `CALLE ABEN AIRE 33` y `PASEO INDEPENDENCIA 3`
   * están las dos dentro del anillo exterior de la mancha del centro; la segunda
   * cae además dentro de un hueco, y por eso está **fuera del área**. Sin los
   * huecos, las dos darían lo mismo.
   */
  test('⭐ J · el hueco del centro cuenta como fuera del área', () => {
    const area = leerArea(DEL_FEED_DE_ZONAS)!;
    assert.equal(dentroDelArea(area, ...ABEN_AIRE_33), true, 'Aben Aire 33 está dentro');
    assert.equal(dentroDelArea(area, ...HEROINAS_17), false, 'Heroínas de los Sitios está fuera');
    // ⭐ El Paseo de la Independencia: dentro del anillo exterior y dentro de un
    //    hueco. La respuesta buena es **fuera**.
    const soloElExterior = { ...area, manchas: area.manchas.map((m) => [m[0]!]) };
    assert.equal(
      dentroDelArea(soloElExterior, ...INDEPENDENCIA_3),
      true,
      'sin huecos, la Independencia caería dentro — si esto falla el fixture ha cambiado',
    );
    assert.equal(dentroDelArea(area, ...INDEPENDENCIA_3), false, 'y con huecos, fuera');
  });

  /**
   * ⭐ JUEZ K — EL ÁREA SE GUARDA IGUAL QUE LA FLOTA, **y en su propia caja**.
   *
   * Las dos usan `guardaConVuelo`, que está escrita una vez. Lo que esta juez
   * compra es que compartir el mecanismo no sea compartir el cajón: olvidar la
   * flota no puede tirar el área, ni al revés — si lo hiciera, cada ruta de YeGo
   * pediría los dos feeds otra vez.
   */
  test('⭐ K · dos consultas del área son una salida, y su caché es la suya', async () => {
    olvidarElArea();
    olvidarLaFlota();
    const zonas = fuente(DEL_FEED_DE_ZONAS);
    const flota = fuente(DEL_FEED);

    const primera = await elAreaDeServicio(zonas.pedir);
    assert.ok(primera);
    assert.equal(await elAreaDeServicio(zonas.pedir), primera, 'la segunda no viene de la caché');
    assert.equal(zonas.visitas(), 1, `${zonas.visitas()} salidas a YeGo, y el ttl son ${TTL_S} s`);

    // Y la flota es otro cajón: pedirla no toca lo guardado del área.
    assert.ok(await laFlotaViva(flota.pedir));
    assert.equal(await elAreaDeServicio(zonas.pedir), primera);
    assert.equal(zonas.visitas(), 1);

    // ⚠️ El silencio tampoco se guarda aquí. Con la caché tirada y YeGo mudo,
    //    la siguiente vuelve a salir en vez de servir un `null` de hace un rato.
    olvidarElArea();
    let mudo = 0;
    const calla: Pedir = async () => {
      mudo++;
      return { ok: false, cuerpo: null };
    };
    assert.equal(await elAreaDeServicio(calla), null);
    assert.equal(await elAreaDeServicio(calla), null);
    // Dos consultas × (un intento + un reintento) = cuatro salidas.
    assert.equal(mudo, 4, `${mudo} salidas: el silencio se ha guardado`);
  });
});
