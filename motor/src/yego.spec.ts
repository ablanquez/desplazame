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
  edadEnPalabras,
  laFlotaViva,
  leerFlota,
  motosCerca,
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
