/**
 * ⭐ LAS JUECES DEL VIAJE EN MOTO COMPARTIDA (4/09, punto 13 casilla 2).
 *
 * ⚠️ **CERO RED.** La flota entra por parámetro, así que aquí no se toca YeGo.
 *    Las motos son **doce del feed de verdad, pegadas tal cual** — la sonda del
 *    05/09 de § 1.34, las mismas que `yego.spec.ts`—: lo que se elige es cuáles
 *    entran, no qué dicen.
 *
 * Lo que estas jueces compran, y que `yego.spec.ts` no puede: que el **viaje**
 * salga —andar, coger, rodar, dejar—, que gane la moto que gana **por coste**,
 * que la autonomía descarte, y que el ciclomotor vaya capado a 45.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Trayecto } from '@desplazame/tipos';
import { cargarGrafo } from './grafo.ts';
import { cargarRed } from './red.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { cargarAparcabicis } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { cargarRedDeLaRueda } from './red-rueda.ts';
import { entornoDe } from './gacetero.ts';
import { cargarRedDeCoche, type RedDeCocheServida } from './coche.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import type { Motor } from './trayecto.ts';
import type { Extremo } from './etapas.ts';
import { comoLaVeUnCiclomotor, olvidarLaRedCapada, viajeEnYego } from './viaje-yego.ts';
import {
  dentroDelArea,
  leerArea,
  leerFlota,
  TOPE_KMH,
  type AreaDeServicio,
  type FlotaViva,
} from './yego.ts';

let motor: Motor;
let coche: RedDeCocheServida;
let portales: PortalesEnMemoria;

/** Un portal, convertido en el extremo que el cálculo interno pide. */
function extremo(codigo: string): Extremo {
  const p = portales.donde.get(codigo);
  assert.ok(p, `no existe el portal ${codigo}`);
  return { lon: p.lon, lat: p.lat, nombre: `${p.via} ${p.numero}` };
}

const LAPUYADE_3 = 'Portales.84476';
const ABEN_AIRE_33 = 'Portales.100601';
/** `AVENIDA ISLA DE MURANO 1`, en Arcosur: **dentro**, pero en su propia mancha. */
const ISLA_DE_MURANO_1 = 'Portales.99681';
/** `AVENIDA LAS HEROÍNAS DE LOS SITIOS 17`: fuera de las diez manchas. */
const HEROINAS_17 = 'Portales.115483';
/** `PASEO INDEPENDENCIA 3`: en pleno centro y **dentro de un hueco**. */
const INDEPENDENCIA_3 = 'Portales.120461';

/** El sobre y las doce motos del feed real. Ver la cabecera. */
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

/**
 * ⭐ EL FEED DE ZONAS ENTERO — sonda del 05/09/2026 14:30:39 GMT, 4.319 bytes.
 *
 * Está copiado tal cual y completo, igual que en `yego.spec.ts`: diez manchas,
 * 163 vértices, y **la del centro con sus dos huecos**. Se duplica a propósito —
 * importar un fixture de otro `.spec.ts` haría correr sus jueces dos veces.
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

/** El área de servicio que sale de ese feed. La que el contrato hace regla. */
const EL_AREA = (): AreaDeServicio => leerArea(DEL_FEED_DE_ZONAS)!;

/** La flota tal cual, y una con los cambios que cada juez necesite. */
const LA_FLOTA = (): FlotaViva => leerFlota(DEL_FEED)!;
const conMotos = (cambia: (b: Record<string, unknown>) => Record<string, unknown>): FlotaViva =>
  leerFlota({ ...DEL_FEED, data: { bikes: DEL_FEED.data.bikes.map((b) => cambia({ ...b })) } })!;

/** Un viaje en YeGo entre dos portales, por la puerta interna. */
function enYego(
  origen: string,
  destino: string,
  flota: FlotaViva | null = LA_FLOTA(),
  area: AreaDeServicio | null = EL_AREA(),
): Trayecto {
  return viajeEnYego(coche, motor, extremo(origen), extremo(destino), flota, area, {
    // El reloj se fija: la edad del dato entra en un aviso, y sin esto la juez
    // diría una cosa distinta cada minuto que pasa.
    ahora: new Date(1788595916 * 1000 + 90_000),
    cuando: new Date(2026, 8, 1, 10, 0, 0),
  });
}

const hitoDe = (t: Trayecto, giro: 'coge' | 'aparca'): string | undefined =>
  t.pasos.find((p) => p.giro === giro)?.texto;
const comoSeVan = (t: Trayecto): string[] => t.tramos.map((x) => x.comoSeVa);

describe('⭐ EL VIAJE EN YeGo — andar hasta ella, rodar, y dejarla', () => {
  before(() => {
    const memoria = cargarGrafo();
    const peaton = cargarRed(memoria);
    portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    const rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    coche = cargarRedDeCoche();
    motor = {
      red: peaton,
      rejilla: cargarRejilla(peaton),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(peaton),
      redRueda: rueda,
      rejillaRueda: cargarRejilla(rueda),
      cuadernoRueda: cuadernoPara(rueda),
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi: cargarBiZi(entornoDe(portales)),
    };
  });

  /**
   * ⭐ JUEZ 1 — EL VIAJE ENTERO: andar → coge → rodar → aparca.
   *
   * Dos tramos y dos hitos, y **ni uno más**: la moto se deja en el destino
   * porque es *free-floating* [§ 1.34, `return_constraint`]. La BiZi tiene un
   * tercer tramo a pie desde el anclaje; aquí no lo hay, y ésa es la diferencia
   * que esta juez fija.
   */
  test('⭐ 1 · se anda, se coge, se rueda y se deja: dos etapas y dos hitos', () => {
    const t = enYego(LAPUYADE_3, ABEN_AIRE_33);
    assert.equal(t.modo, 'yego');
    assert.ok(t.metros > 0, 'no hay viaje');

    // ⚠️ **Los TRAMOS son más de dos, y no es un fallo**: lo conducido se parte
    //    por la Zona de Bajas Emisiones —es el corte que pinta la traza roja, y
    //    lo hace `etapaEnCoche` desde la casilla 3-bis del coche—. Lo que son
    //    dos son las ETAPAS: se anda una vez y se rueda una vez.
    const comoSeVa = comoSeVan(t);
    assert.equal(comoSeVa[0], 'andando', 'el viaje no empieza andando');
    assert.equal(
      comoSeVa.slice(1).every((x) => x === 'rodando'),
      true,
      `después de andar solo se rueda: ${comoSeVa.join(', ')}`,
    );
    assert.equal(comoSeVa.filter((x) => x === 'andando').length, 1, 'se anda dos veces');
    // ⭐ Y NO HAY TERCERA ETAPA A PIE: la moto se deja en el destino, que es la
    //    diferencia de verdad con la BiZi. Ver la cabecera de `viaje-yego.ts`.
    assert.equal(comoSeVa[comoSeVa.length - 1], 'rodando', 'sobra un paseo al final');

    // Los dos hitos, cada uno en el tramo que muere donde pasa la cosa.
    assert.equal(t.tramos[0]!.hito, 'coge', 'el paseo no remata en la moto');
    assert.equal(t.tramos[t.tramos.length - 1]!.hito, 'aparca', 'no se deja la moto al final');
    assert.deepEqual(
      t.tramos.map((x) => x.hito).filter((h) => h !== null),
      ['coge', 'aparca'],
      'hay hitos de más',
    );
    assert.match(hitoDe(t, 'coge') ?? '', /^Coge la moto de YeGo \(\d+ km de autonomía\)$/);
    // ⚠️ **Esta línea se puso roja sola el 5/09**, y por la razón buena: el hito
    //    dejó de decir «donde esté permitido aparcar» en cuanto el motor empezó
    //    a comprobar el área. Ahora afirma lo que ha comprobado. Ver la juez 12.
    assert.match(
      hitoDe(t, 'aparca') ?? '',
      /^Deja la moto en .+, dentro del área de YeGo — prioriza un aparcamiento de motos$/,
    );
    // ⛔ Y el `bike_id` NO se enseña: es el único campo que el operador rota.
    assert.equal(JSON.stringify(t).includes('68566601'), false, 'se ha colado un bike_id');

    // La edad del dato va en un aviso, siempre. Es la mitad que hace honesta a
    // la caché de 240 s: el reloj de la juez está 90 s por delante del feed.
    assert.match(t.avisos[0]!.texto, /^Motos de YeGo: 11 libres, datos de hace 1 min\.$/);
  });

  /**
   * ⭐ JUEZ 2 — UNA MOTO `is_disabled` NO SE ELIGE, aunque sea la mejor.
   *
   * Se le pone a la ganadora la marca de deshabilitada y el viaje **tiene que
   * cambiar**. Sin el filtro, la elegida seguiría siendo la misma y el sello del
   * trayecto no se movería — que es justo lo que la contraprueba comprueba.
   */
  test('⭐ 2 · la moto deshabilitada no se elige, y el viaje cambia', () => {
    const normal = enYego(LAPUYADE_3, ABEN_AIRE_33);
    const ganadora = /\((\d+) km/.exec(hitoDe(normal, 'coge') ?? '')![1];

    // La misma flota con la ganadora marcada como fuera de servicio.
    const sinElla = conMotos((b) =>
      Math.round((b['current_range_meters'] as number) / 1000) === Number(ganadora) &&
      b['is_disabled'] === false
        ? { ...b, is_disabled: true }
        : b,
    );
    const otro = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), sinElla, EL_AREA(), {
      ahora: new Date(1788595916 * 1000 + 90_000),
      cuando: new Date(2026, 8, 1, 10, 0, 0),
    });
    assert.ok(otro.metros > 0, 'sigue habiendo viaje con otra moto');
    assert.notEqual(hitoDe(otro, 'coge'), hitoDe(normal, 'coge'), 'ha cogido la deshabilitada');

    // Y una flota con TODAS deshabilitadas no da viaje, y lo dice.
    const ninguna = conMotos((b) => ({ ...b, is_disabled: true }));
    const nada = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), ninguna, EL_AREA(), {
      ahora: new Date(1788595916 * 1000 + 90_000),
    });
    assert.equal(nada.metros, 0);
    assert.match(nada.avisos.map((a) => a.texto).join(' '), /No hay ninguna moto de YeGo libre/);
  });

  /**
   * ⭐ JUEZ 3 — LA AUTONOMÍA DESCARTA: sin batería para el viaje, no es opción.
   *
   * `current_range_meters` existe para esto. Se le deja a todas la batería justa
   * para no llegar y el motor tiene que decirlo, no elegir la menos mala.
   */
  test('⭐ 3 · una moto sin autonomía para el viaje no se elige', () => {
    const normal = enYego(LAPUYADE_3, ABEN_AIRE_33);
    const rodado = normal.tramos[1]!.metros;
    assert.ok(rodado > 1000, `el rodado son ${rodado} m`);

    // (a) A todas se les deja MENOS de lo que el viaje pide: no hay ruta, y el
    //     aviso dice por qué — no se ofrece una moto que se queda a medias.
    const secas = conMotos((b) => ({ ...b, current_range_meters: 500 }));
    const nada = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), secas, EL_AREA(), {
      ahora: new Date(1788595916 * 1000 + 90_000),
    });
    assert.equal(nada.metros, 0);
    assert.match(
      nada.avisos.map((a) => a.texto).join(' '),
      /A ninguna de las motos de YeGo .* le queda batería para llegar/,
    );

    // (b) Y con la ganadora seca pero las demás llenas, gana otra.
    const ganadora = /\((\d+) km/.exec(hitoDe(normal, 'coge') ?? '')![1];
    const unaSeca = conMotos((b) =>
      Math.round((b['current_range_meters'] as number) / 1000) === Number(ganadora)
        ? { ...b, current_range_meters: 300 }
        : b,
    );
    const otro = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), unaSeca, EL_AREA(), {
      ahora: new Date(1788595916 * 1000 + 90_000),
      cuando: new Date(2026, 8, 1, 10, 0, 0),
    });
    assert.ok(otro.metros > 0);
    assert.notEqual(hitoDe(otro, 'coge'), hitoDe(normal, 'coge'), 'ha cogido la que no llega');
  });

  /**
   * ⭐ JUEZ 4 — LA VELOCIDAD VA CAPADA A 45, y se cuenta arista a arista.
   *
   * No se mide sobre un viaje —donde el capado se diluye entre calles de 30—
   * sino sobre **la red entera**: ninguna arista de la vista del ciclomotor
   * puede recorrerse a más de 45 km/h, y las que el coche hace a 50 o más tienen
   * que haber cambiado de tiempo.
   */
  test('⭐ 4 · ninguna arista de la red capada pasa de 45 km/h', () => {
    olvidarLaRedCapada();
    const capada = comoLaVeUnCiclomotor(coche);
    const deCoche = coche.cocinada.aristas;
    const deMoto = capada.cocinada.aristas;
    assert.equal(deMoto.length, deCoche.length, 'la red ha cambiado de tamaño');

    let masRapidas = 0;
    let masLentaAhora = 0;
    for (let k = 0; k < deCoche.length; k++) {
      const a = deCoche[k]!;
      const m = deMoto[k]!;
      if (a.metros <= 0 || a.segundos <= 0) {
        continue;
      }
      const kmhMoto = m.metros / 1000 / (m.segundos / 3600);
      // Ni una arista por encima del tope, con un pelo de holgura por el
      // redondeo a la décima que la cocina hace en `metros` y en `segundos`.
      assert.ok(kmhMoto <= TOPE_KMH + 0.5, `arista ${k} a ${kmhMoto.toFixed(1)} km/h`);
      // ⚠️ El reparto se hace con **la misma cuenta que el código**, no con una
      //    velocidad derivada y un margen: derivar la velocidad de dos campos ya
      //    redondeados y compararla con 45 deja aristas justo en la frontera a
      //    un lado y a otro según el pelo que se elija. El tiempo mínimo a 45 es
      //    exacto, y es lo que decide.
      const minimo = (a.metros / 1000 / TOPE_KMH) * 3600;
      if (minimo > a.segundos) {
        masRapidas++;
        assert.ok(m.segundos > a.segundos, `la arista ${k} no se ha frenado`);
        masLentaAhora++;
      } else {
        // Y las que ya iban por debajo NO se tocan: el tope solo baja.
        assert.equal(m.segundos, a.segundos, `la arista ${k} ha cambiado sin motivo`);
      }
      // Los metros y la geometría son los del coche: solo cambia el tiempo.
      assert.equal(m.metros, a.metros);
      assert.equal(m.zbe, a.zbe);
    }
    assert.ok(masRapidas > 0, 'no hay ni una calle de más de 45: la juez no prueba nada');
    assert.equal(masLentaAhora, masRapidas);
    console.log(`   [medido] aristas por encima de 45 km/h en el coche: ${masRapidas}`);
  });

  /**
   * ⭐ JUEZ 10 — EL DESTINO TIENE QUE CAER DENTRO DEL ÁREA DE SERVICIO (5/09).
   *
   * ═══════════════════════════════════════════════════════════════════════════
   *  ⚠️ **ESTA JUEZ SUSTITUYE A LA 8, Y LA 8 SE PUSO ROJA SOLA.** Decía *«no se
   *  rechaza ningún destino por geofencing»* y compraba justo lo contrario de lo
   *  que hoy se compra. **No estaba mal escrita: estaba bien escrita sobre otra
   *  fuente.** El 4/09 lo único que había era el feed —una zona llamada `"no go
   *  zone"` con `ride_allowed: true`—, y con eso delante no inventarse la
   *  restricción era lo correcto.
   *
   *  Lo que cambió el 5/09 no fue el dato: fue que **se leyó el contrato**
   *  [GCC v-2025/05/20, § 3.2.2, transcrito en § 1.34]:
   *
   *      «Pausing and/or ending a ride is only allowed within the Service Zone»
   *
   *  Y esa juez, al correr la suite con la regla nueva, cayó con
   *  `Portales.115483 se ha quedado sin viaje`. Se deja escrito aquí porque es
   *  el caso bueno: **un guardián que se pone rojo solo cuando la fuente cambia
   *  de opinión es exactamente para lo que está**.
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Dos destinos fuera, y los dos por motivos distintos:
   *
   *   · `AVENIDA LAS HEROÍNAS DE LOS SITIOS 17`, lejos de las diez manchas.
   *   · `PASEO INDEPENDENCIA 3`, **en pleno centro y dentro de un hueco** de la
   *     mancha grande. Es el caso que un punto-en-polígono descuidado dejaría
   *     pasar, y en el dato son 41 portales de Independencia, Plaza de Aragón y
   *     Plaza de España [medido el 5/09].
   */
  test('⭐ 10 · un destino fuera del área no da viaje, y dice por qué', () => {
    for (const destino of [HEROINAS_17, INDEPENDENCIA_3]) {
      const t = enYego(LAPUYADE_3, destino);
      assert.equal(t.metros, 0, `${destino} tenía que quedarse sin viaje`);
      assert.equal(t.pasos.length, 0);
      assert.equal(t.geometria.length, 0);
      assert.match(
        t.avisos.map((a) => a.texto).join(' '),
        /El área de servicio de YeGo no llega a tu destino: su contrato solo permite terminar el viaje dentro de su zona\./,
        `${destino} se ha quedado sin motivo`,
      );
      // Y la edad del dato sigue diciéndose: un «no» también lleva su fecha.
      assert.match(t.avisos[0]!.texto, /^Motos de YeGo: \d+ libres, datos de/);
    }
    // ⭐ Y uno DENTRO sigue exactamente igual que antes de que existiera la regla.
    for (const destino of [ABEN_AIRE_33, 'Portales.105703']) {
      const t = enYego(LAPUYADE_3, destino);
      assert.ok(t.metros > 0, `${destino} se ha quedado sin viaje`);
    }
  });

  /**
   * ⭐ JUEZ 11 — SE PUEDE RODAR FUERA. **El contrato lo dice con todas las
   * letras**, y es la mitad que impide que la regla se pase de frenada.
   *
   *     «Vehicles may indeed leave the Service Zone; however, the User must
   *      return and complete the Trip within»
   *
   * El caso está medido y es contundente: de `CALLE PEDRO LAPUYADE 3` a
   * `AVENIDA ISLA DE MURANO 1` —Arcosur, que tiene su propia mancha, la 7— la
   * ruta cruza toda la ciudad por fuera del área. **258 de sus 336 vértices
   * rodados caen fuera**, y el viaje es perfectamente legal.
   *
   * ⚠️ Y el origen tampoco cuenta: `CALLE PEDRO LAPUYADE 3` está **fuera** de las
   *    diez manchas. Andar hasta una moto no es un viaje en moto.
   */
  test('⭐ 11 · se rueda fuera del área sin problema si el viaje termina dentro', () => {
    const area = EL_AREA();
    assert.equal(
      dentroDelArea(area, extremo(LAPUYADE_3).lon, extremo(LAPUYADE_3).lat),
      false,
      'el origen de siempre tenía que estar FUERA del área',
    );

    const t = enYego(LAPUYADE_3, ISLA_DE_MURANO_1);
    assert.ok(t.metros > 0, 'un destino dentro de la mancha 7 tiene que dar viaje');

    // Lo rodado empieza donde muere el paseo, que es donde está el hito `coge`.
    const cierraElPaseo = t.tramos.findIndex((x) => x.hito === 'coge');
    const rodados = t.geometria.slice(t.tramos[cierraElPaseo + 1]!.desde);
    const fuera = rodados.filter(([lat, lon]) => !dentroDelArea(area, lon, lat)).length;
    assert.ok(
      fuera > rodados.length / 2,
      `solo ${fuera} de ${rodados.length} vértices rodados caen fuera: la juez no prueba nada`,
    );
    // Y ni un aviso que hable de rechazo: rodar fuera no es noticia.
    assert.equal(
      /área de servicio de YeGo no llega/.test(t.avisos.map((a) => a.texto).join(' ')),
      false,
    );
  });

  /**
   * ⭐ JUEZ 12 — EL HITO PROMETE SOLO LO QUE SE HA COMPROBADO.
   *
   * Con el área leída, el remate dice *«dentro del área de YeGo — prioriza un
   * aparcamiento de motos»*: la primera mitad es un hecho que el motor acaba de
   * comprobar, y la segunda es consejo del propio operador [FAQ `/es/faq/parking`].
   *
   * ⚠️ **Sin el área, vuelve la frase de antes.** Y no es un detalle de estilo:
   *    afirmar «dentro del área» sin haberla podido leer sería prometer con la
   *    autoridad de un dato que no se tiene. Además sale el aviso que lo dice —
   *    la misma doctrina del mudo honesto del poste de autobús.
   */
  test('⭐ 12 · sin área leída el hito no promete, y se avisa de que no se ha comprobado', () => {
    const conArea = enYego(LAPUYADE_3, ABEN_AIRE_33);
    assert.match(
      hitoDe(conArea, 'aparca') ?? '',
      /, dentro del área de YeGo — prioriza un aparcamiento de motos$/,
    );

    // ⭐ El mismo viaje con el feed de zonas mudo: se ofrece igual —el área es
    //    una restricción, no el inventario— pero sin prometer nada.
    const sinArea = enYego(LAPUYADE_3, ABEN_AIRE_33, LA_FLOTA(), null);
    assert.ok(sinArea.metros > 0, 'sin área el viaje se ofrece igual');
    assert.match(hitoDe(sinArea, 'aparca') ?? '', /, donde esté permitido aparcar$/);
    assert.match(
      sinArea.avisos.map((a) => a.texto).join(' '),
      /No hemos podido comprobar el área de servicio de YeGo/,
    );

    // Y con el área leída ese aviso no está: no se avisa de lo que sí se sabe.
    assert.equal(
      /No hemos podido comprobar el área/.test(conArea.avisos.map((a) => a.texto).join(' ')),
      false,
    );

    // ⚠️ Sin área **tampoco se rechaza** un destino de fuera: aplicar una
    //    restricción que no se ha podido leer sería inventarse la prohibición.
    const lejos = enYego(LAPUYADE_3, HEROINAS_17, LA_FLOTA(), null);
    assert.ok(lejos.metros > 0, 'sin área no se puede rechazar nada');
  });

  /**
   * ⭐ JUEZ 8-bis — EL AVISO DE LA ZONA APUNTA AL PASO POR EL QUE SE ENTRA.
   *
   * ⚠️ **Esta juez nace de un fallo medido el 5/09**, no de una precaución: el
   *    aviso salía con `paso: 5`, que en este viaje es el hito de **coger la
   *    moto** — un paso del paseo, donde no hay zona que pisar—. `avisosDeLaZbe`
   *    numera los pasos de la etapa conducida, y en YeGo esa etapa va **detrás
   *    del paseo**; en el coche y en la moto privada va primera y los dos
   *    índices coinciden, así que el desfase no existía hasta hoy.
   *
   * Lo que se compra: que el paso que el aviso señala sea **de los que se
   * conducen**, y no uno de los de andar.
   */
  test('⭐ 8-bis · el aviso de la ZBE apunta a un paso de los que se conducen', () => {
    const t = enYego(LAPUYADE_3, ABEN_AIRE_33);
    const deLaZona = t.avisos.find((a) => a.texto.includes('Zona de Bajas Emisiones'));
    assert.ok(deLaZona, 'este viaje tiene que cruzar la zona');
    assert.equal(typeof deLaZona.paso, 'number');

    // (a) Cae después del hito de coger: los pasos de antes son del paseo.
    const dondeSeCoge = t.pasos.findIndex((x) => x.giro === 'coge');
    assert.ok(dondeSeCoge >= 0, 'no hay hito de coger');
    assert.ok(
      deLaZona.paso! > dondeSeCoge,
      `el aviso cuelga del paso ${deLaZona.paso}, y la moto se coge en el ${dondeSeCoge}`,
    );
    assert.ok(deLaZona.paso! < t.pasos.length, 'el aviso apunta fuera de la lista');

    // ⭐ (b) Y CAE DONDE SE ENTRA DE VERDAD, medido **en metros**.
    //
    // ⚠️ La comprobación de (a) sola **no basta, y se descubrió con la
    //    contraprueba**: quitando el desplazamiento el aviso pasaba del paso 13
    //    al 8, y el 8 sigue siendo mayor que el 4 del `coge`. La juez daba verde
    //    con el fallo vivo. Lo que sí lo ata es la distancia: el paso que el
    //    aviso señala tiene que estar **donde empieza el primer tramo de zona**,
    //    y eso no depende de cómo se numeren los pasos.
    const hastaLaZona = t.tramos
      .slice(0, t.tramos.findIndex((x) => x.zbe === true))
      .reduce((suma, x) => suma + x.metros, 0);
    const hastaElAviso = t.pasos
      .slice(0, deLaZona.paso!)
      .reduce((suma, x) => suma + x.metros, 0);
    // Un paso de holgura: el corte de la zona cae dentro de una arista y el paso
    // que la contiene empieza un poco antes. Se acota con el paso más largo del
    // viaje, que es lo máximo que se puede desviar por esa razón.
    const elMasLargo = Math.max(...t.pasos.map((x) => x.metros));
    assert.ok(
      Math.abs(hastaElAviso - hastaLaZona) <= elMasLargo,
      `el aviso cuelga a ${hastaElAviso} m del arranque y la zona empieza a ${hastaLaZona} m`,
    );
  });

  /**
   * ⭐ JUEZ 9 — LA MURALLA: la moto compartida no le toca la red a nadie.
   *
   * `comoLaVeUnCiclomotor` devuelve una **vista**, no una modificación: las
   * aristas del coche tienen que seguir con sus segundos originales después de
   * haberla pedido. Si capara en el sitio, esto se pondría rojo y con él se
   * caerían el coche y la moto privada.
   */
  test('⭐ 9 · la red del coche no se entera de que existe el ciclomotor', () => {
    const antes = coche.cocinada.aristas.slice(0, 500).map((a) => a.segundos);
    olvidarLaRedCapada();
    comoLaVeUnCiclomotor(coche);
    const despues = coche.cocinada.aristas.slice(0, 500).map((a) => a.segundos);
    assert.deepEqual(despues, antes, 'la vista capada ha tocado la red del coche');
    // Y la vista se guarda: pedirla dos veces devuelve el mismo objeto, que es
    // lo que evita copiar 89.000 aristas en cada ruta.
    assert.equal(comoLaVeUnCiclomotor(coche), comoLaVeUnCiclomotor(coche));
  });

  /**
   * ⭐ JUEZ 1-bis — GANA LA DEL COSTE, **no la más cercana**.
   *
   * `andar × PESO_DE_ANDAR + rodar`, la misma cuenta con la que el coche elige
   * bordillo [OTP `walkReluctance` 4,0]. Sin el peso, el motor mandaría a andar
   * un kilómetro para ahorrarse dos minutos de rodar; sin el coste y solo con la
   * recta, cogería la de al lado aunque saliera por el camino largo.
   *
   * ⚠️ **Y esto no es teórico: está medido.** Barridos 40 orígenes al azar del
   *    censo hacia `CALLE ABEN AIRE 33` el 5/09, **el coste elige distinto que
   *    la recta en 11**. El caso que se fija aquí es `Portales.86033`: gana la
   *    moto de 38 km y la más cercana en recta es la de 17 km.
   */
  test('⭐ 1-bis · gana la moto del COSTE, no la más cercana en recta', () => {
    const origen = 'Portales.86033';
    const o = extremo(origen);
    const flota = LA_FLOTA();
    // La más cercana en recta, con la misma cuenta que usa la poda.
    const enRecta = [...flota.motos]
      .map((m) => ({ m, r: Math.hypot((m.lat - o.lat) * 111, (m.lon - o.lon) * 83) }))
      .sort((a, b) => a.r - b.r)[0]!.m;
    assert.equal(Math.round(enRecta.autonomiaM / 1000), 17, 'la más cercana ha cambiado de sitio');

    const t = enYego(origen, ABEN_AIRE_33);
    assert.ok(t.metros > 0);
    // Y la que gana es OTRA: la de 38 km, que está más lejos y sale mejor.
    assert.match(hitoDe(t, 'coge') ?? '', /\(38 km de autonomía\)/);
  });

  /**
   * ⭐ JUEZ 6 (del encargo) — EL MUDO HONESTO: sin feed **no hay viaje**.
   *
   * Y aquí es más duro que en la BiZi, a propósito. Allí el inventario de
   * estaciones vive en el repositorio y con la API caída se rutea igual sin
   * prometer disponibilidad. Aquí **las motos solo existen en el feed**: sin él
   * no se sabe dónde hay una sola. Ofrecer un viaje sería inventarse el
   * vehículo.
   */
  test('⭐ 6 · sin flota no se inventa un viaje: se dice que no se ha podido preguntar', () => {
    const t = enYego(LAPUYADE_3, ABEN_AIRE_33, null);
    assert.equal(t.modo, 'yego');
    assert.equal(t.metros, 0);
    assert.equal(t.pasos.length, 0);
    assert.equal(t.avisos.length, 1);
    assert.match(t.avisos[0]!.texto, /No hemos podido preguntarle a YeGo/);
  });
});
