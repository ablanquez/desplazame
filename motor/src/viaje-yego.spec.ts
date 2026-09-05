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
import { leerFlota, TOPE_KMH, type FlotaViva } from './yego.ts';

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

/** La flota tal cual, y una con los cambios que cada juez necesite. */
const LA_FLOTA = (): FlotaViva => leerFlota(DEL_FEED)!;
const conMotos = (cambia: (b: Record<string, unknown>) => Record<string, unknown>): FlotaViva =>
  leerFlota({ ...DEL_FEED, data: { bikes: DEL_FEED.data.bikes.map((b) => cambia({ ...b })) } })!;

/** Un viaje en YeGo entre dos portales, por la puerta interna. */
function enYego(origen: string, destino: string, flota: FlotaViva | null = LA_FLOTA()): Trayecto {
  return viajeEnYego(coche, motor, extremo(origen), extremo(destino), flota, {
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
    assert.match(hitoDe(t, 'aparca') ?? '', /^Deja la moto en .+, donde esté permitido aparcar$/);
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
    const otro = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), sinElla, {
      ahora: new Date(1788595916 * 1000 + 90_000),
      cuando: new Date(2026, 8, 1, 10, 0, 0),
    });
    assert.ok(otro.metros > 0, 'sigue habiendo viaje con otra moto');
    assert.notEqual(hitoDe(otro, 'coge'), hitoDe(normal, 'coge'), 'ha cogido la deshabilitada');

    // Y una flota con TODAS deshabilitadas no da viaje, y lo dice.
    const ninguna = conMotos((b) => ({ ...b, is_disabled: true }));
    const nada = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), ninguna, {
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
    const nada = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), secas, {
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
    const otro = viajeEnYego(coche, motor, extremo(LAPUYADE_3), extremo(ABEN_AIRE_33), unaSeca, {
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
   * ⭐ JUEZ 8 — EL GEOFENCING SE LEE Y **NO SE INVENTA UNA RESTRICCIÓN**.
   *
   * § 1.34 lo mide entero: la única zona que YeGo publica se llama `"no go
   * zone"` y sus reglas dicen `ride_allowed: true`. Mandan las reglas —161 de
   * las 166 motos están aparcadas dentro—, así que **no hay nada que aplicar**.
   *
   * Lo que esta juez compra es que el motor **no se inventa la de al lado**: un
   * destino cualquiera de la ciudad da viaje, sin rechazos por zona. GBFS 2.3 no
   * tiene `global_rules`, así que del «fuera de las manchas» el feed no dice
   * nada — y lo que no está en el dato es `NO CONSTA`.
   */
  test('⭐ 8 · no se rechaza ningún destino por geofencing', () => {
    // Cuatro destinos repartidos: dentro de la mancha grande y lejos de ella.
    for (const destino of [ABEN_AIRE_33, 'Portales.105703', 'Portales.115483']) {
      const t = enYego(LAPUYADE_3, destino);
      assert.ok(t.metros > 0, `${destino} se ha quedado sin viaje`);
      const dicho = t.avisos.map((a) => a.texto).join(' ');
      assert.equal(/zona|geofenc|prohibid/i.test(dicho.replace(/Zona de Bajas Emisiones/g, '')), false,
        `se ha inventado una restricción de zona: ${dicho}`);
    }
  });

  /**
   * ⭐ JUEZ 9 — LA MURALLA: la moto compartida no le toca la red a nadie.
   *
   * `comoLaVeUnCiclomotor` devuelve una **vista**, no una modificación: las
   * aristas del coche tienen que seguir con sus segundos originales después de
   * haberla pedido. Si capara en el sitio, esto se pondría rojo y con él se
   * caerían el coche y la moto privada.
   */
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
   * ⭐ JUEZ 6 (del encargo) — EL MUDO HONESTO: sin feed **no hay viaje**.
   *
   * Y aquí es más duro que en la BiZi, a propósito. Allí el inventario de
   * estaciones vive en el repositorio y con la API caída se rutea igual sin
   * prometer disponibilidad. Aquí **las motos solo existen en el feed**: sin él
   * no se sabe dónde hay una sola. Ofrecer un viaje sería inventarse el
   * vehículo.
   */
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

  test('⭐ 6 · sin flota no se inventa un viaje: se dice que no se ha podido preguntar', () => {
    const t = enYego(LAPUYADE_3, ABEN_AIRE_33, null);
    assert.equal(t.modo, 'yego');
    assert.equal(t.metros, 0);
    assert.equal(t.pasos.length, 0);
    assert.equal(t.avisos.length, 1);
    assert.match(t.avisos[0]!.texto, /No hemos podido preguntarle a YeGo/);
  });
});
