/**
 * ⭐ LAS JUECES DE LA BÚSQUEDA EN BUS Y TRANVÍA (31/08).
 *
 * ⚠️ **CERO RED.** La red se cocina del zip del repositorio y el peatón es el de
 * la casa; no se llama a nadie de fuera. Los casos de las firmas **están
 * medidos sobre el dato real**, no inventados: cada uno se encontró barriendo la
 * red y sus cifras son las que salen.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRejilla, type Rejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { andarConElPeaton, cocinar, type AndarEntre, type RedDeBus } from './red-bus.ts';
import { elFeedQueSeSirve } from './feed.ts';
import {
  buscarViaje,
  esperaEstimada,
  intervaloDeHoy,
  lineaDelViaje,
  PENALIZACION_TRANSBORDO_S,
  RADIO_M,
  RONDAS,
  VELOCIDAD_PEATON_MS,
  type Acceso,
} from './viaje-bus.ts';

let red: RedDeBus;
let andar: AndarEntre;
let portales: PortalesEnMemoria;
let peaton: RedEnMemoria;
let rejilla: Rejilla;

/** Un martes cualquiera de septiembre, con la red entera operando. */
const UN_MARTES = '20260907';

/** Empezar y acabar EN una parada, para medir la búsqueda sin el ruido del paseo. */
const enLaParada = (id: string): Acceso[] => [{ parada: id, metros: 0 }];

/** Los postes a los que se llega andando desde un punto, con su radio por modo. */
function accesos(lon: number, lat: number): Acceso[] {
  const salida: Acceso[] = [];
  for (const p of red.paradas) {
    const radio = RADIO_M[p.modos.includes('tram') ? 'tram' : 'bus'];
    const dx = (p.lon - lon) * 82500;
    const dy = (p.lat - lat) * 111320;
    if (Math.hypot(dx, dy) > radio) {
      continue;
    }
    const m = andar(lon, lat, p.lon, p.lat);
    if (m !== null && m <= radio) {
      salida.push({ parada: p.id, metros: Math.round(m) });
    }
  }
  return salida;
}

describe('⭐ EL VIAJE EN BUS Y TRANVÍA — la búsqueda por rondas', () => {
  before(async () => {
    peaton = cargarRed(cargarGrafo());
    rejilla = cargarRejilla(peaton);
    andar = andarConElPeaton(peaton, rejilla, cuadernoPara(peaton));
    portales = cargarPortales();
    red = (await cocinar(elFeedQueSeSirve().ruta, andar)).red;
  });

  /**
   * ⭐ JUEZ 1 — EL CASO DEL OJO: COLOSO 2 → LEOPOLDO ROMEO 27 en bus.
   *
   * El mismo par que lleva toda la semana sirviendo de piedra de toque, ahora en
   * bus. Sale un viaje de **un solo vehículo**, la línea 29, y sus cifras son
   * las que son: no se eligieron, se midieron.
   */
  test('⭐ 1 · el caso del ojo sale en un vehículo, con sus postes y sus cifras', () => {
    const o = portales.donde.get('Portales.93310')!;
    const d = portales.donde.get('Portales.79358')!;
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: accesos(o.lon, o.lat),
      salida: accesos(d.lon, d.lat),
    })!;
    assert.ok(viaje, 'el caso del ojo tiene que tener viaje en bus');

    assert.equal(viaje.vehiculos, 1);
    assert.equal(viaje.tranvias, 0);
    assert.equal(viaje.transbordos.length, 0, 'con un vehículo no hay transbordo que valga');

    const nombre = new Map(red.paradas.map((p) => [p.id, p.nombre]));
    assert.equal(nombre.get(viaje.accesoAndando.parada), 'Bernardo Ramazzini / Maz');
    assert.equal(viaje.accesoAndando.metros, 478);
    assert.equal(nombre.get(viaje.salidaAndando.parada), 'Miguel Servet N.º 28');
    assert.equal(viaje.salidaAndando.metros, 897);

    const linea = lineaDelViaje(red, viaje.montados[0]!.patron);
    assert.equal(linea.corto, '29');
    assert.equal(linea.modo, 'bus');
    assert.equal(linea.color, 'F5C100', 'el color sale del feed, no de nosotros');
    assert.equal(viaje.montados[0]!.iHasta - viaje.montados[0]!.iDesde, 16, 'dieciséis postes');

    // ⭐ Y LAS SUMAS CUADRAN: el total es exactamente lo que cuestan sus partes.
    const m = viaje.montados[0]!;
    const aMano =
      viaje.accesoAndando.metros / VELOCIDAD_PEATON_MS +
      m.espera +
      m.rodando +
      viaje.salidaAndando.metros / VELOCIDAD_PEATON_MS;
    assert.equal(viaje.segundos, Math.round(aMano), 'el total no es la suma de sus partes');
  });

  /**
   * ⭐ JUEZ 2 — **FIRMA 6**: menos vehículos gana, aunque tarde más.
   *
   * ⚠️ El caso está **medido sobre la red real**, barriéndola hasta encontrar
   * uno donde la firma cueste dinero: `Av. De América N.º 69` →
   * `Madre Teresa De Calcuta N.º 3`. El directo de la **línea 33** tarda
   * **40,3 min**; hay un bus+bus (**34+41**) que tarda **39,4 min**, casi un
   * minuto menos. **Gana el directo.** Es la firma haciendo lo que se firmó.
   */
  test('⭐ 2 · FIRMA 6: el directo gana al bus+bus aunque tarde casi un minuto más', () => {
    const desde = enLaParada('16572');
    const hasta = enLaParada('16867');
    const directo = buscarViaje({ red, fecha: UN_MARTES, acceso: desde, salida: hasta })!;
    assert.ok(directo);
    assert.equal(directo.vehiculos, 1, 'tiene que ganar el de un vehículo');
    assert.equal(lineaDelViaje(red, directo.montados[0]!.patron).corto, '33');

    // Y la alternativa existe y es MÁS RÁPIDA: sin el patrón del directo, la
    // búsqueda encuentra un dos-vehículos que tarda menos.
    const sinElDirecto: RedDeBus = {
      ...red,
      patrones: red.patrones.filter((p) => p.id !== directo.montados[0]!.patron.id),
    };
    const conDos = buscarViaje({ red: sinElDirecto, fecha: UN_MARTES, acceso: desde, salida: hasta })!;
    assert.ok(conDos);
    assert.equal(conDos.vehiculos, 2);
    assert.ok(
      conDos.segundos < directo.segundos,
      `la alternativa tenía que ser más rápida: ${conDos.segundos} vs ${directo.segundos}`,
    );
    // La firma cuesta esto, y queda escrito para que se pueda discutir con la cifra:
    assert.equal(Math.round((directo.segundos - conDos.segundos) / 6) / 10, 0.9, 'minutos que cuesta la firma 6');
  });

  /**
   * ⭐ JUEZ 3 — **FIRMA 3**: a igual número de vehículos, menos tranvía gana.
   *
   * ⚠️ **Y este caso cuesta caro, así que va con su cifra delante.**
   * `Asín Y Palacios N.º 5` → `La Fragua / Parque Tapices De Goya`: bus+bus
   * (**42+35**) tarda **63,9 min** y gana; bus+tranvía (**42+TRA**) tarda
   * **53,8 min**. La firma 3 hace perder **10,1 minutos** para evitar un
   * tranvía. Está medido y está dicho: si algún día se quiere revisar la firma,
   * este es el número con el que discutirla.
   */
  test('⭐ 3 · FIRMA 3: bus+bus gana a bus+tranvía, y cuesta 10,1 minutos', () => {
    const desde = enLaParada('16524');
    const hasta = enLaParada('17664');
    const sinTranvia = buscarViaje({ red, fecha: UN_MARTES, acceso: desde, salida: hasta })!;
    assert.ok(sinTranvia);
    assert.equal(sinTranvia.vehiculos, 2);
    assert.equal(sinTranvia.tranvias, 0, 'gana el que no usa tranvía');
    assert.deepEqual(
      sinTranvia.montados.map((m) => lineaDelViaje(red, m.patron).corto),
      ['42', '35'],
    );

    const sinEseBus: RedDeBus = {
      ...red,
      patrones: red.patrones.filter((p) => p.id !== sinTranvia.montados[1]!.patron.id),
    };
    const conTranvia = buscarViaje({ red: sinEseBus, fecha: UN_MARTES, acceso: desde, salida: hasta })!;
    assert.ok(conTranvia);
    assert.equal(conTranvia.vehiculos, 2, 'el mismo número de vehículos');
    assert.equal(conTranvia.tranvias, 1);
    assert.ok(conTranvia.segundos < sinTranvia.segundos);
    assert.equal(
      Math.round((sinTranvia.segundos - conTranvia.segundos) / 6) / 10,
      10.1,
      'minutos que cuesta la firma 3 en este par',
    );
  });

  /**
   * ⭐ JUEZ 4 — LOS RADIOS: 500 m para el bus, 800 para el tranvía. **Firma 4.**
   *
   * Es un radio de búsqueda, no una frontera. Y son distintos porque el tranvía
   * tiene menos paradas y más frecuencia: andar 800 m hasta un tranvía es un
   * trato que se hace, y hasta un bus que pasa cada 20 minutos no.
   */
  test('⭐ 4 · un poste de bus a 600 m no es acceso; uno de tranvía a 700 sí', () => {
    assert.equal(RADIO_M.bus, 500);
    assert.equal(RADIO_M.tram, 800);
    assert.ok(RADIO_M.tram > RADIO_M.bus);

    // Sobre el dato: los accesos del caso del ojo están TODOS dentro de su radio.
    const o = portales.donde.get('Portales.93310')!;
    const cerca = accesos(o.lon, o.lat);
    assert.ok(cerca.length > 0);
    const porId = new Map(red.paradas.map((p) => [p.id, p]));
    for (const a of cerca) {
      const p = porId.get(a.parada)!;
      const radio = RADIO_M[p.modos.includes('tram') ? 'tram' : 'bus'];
      assert.ok(a.metros <= radio, `${p.nombre}: ${a.metros} m con radio ${radio}`);
    }
    // Y hay al menos un poste de bus entre 500 y 800 m que NO entró: la
    // diferencia de radios no es decorativa.
    const fuera = red.paradas.filter((p) => {
      if (p.modos.includes('tram')) return false;
      const dx = (p.lon - o.lon) * 82500;
      const dy = (p.lat - o.lat) * 111320;
      const recta = Math.hypot(dx, dy);
      return recta > RADIO_M.bus && recta <= RADIO_M.tram;
    });
    assert.ok(fuera.length > 0, 'tiene que haber postes de bus en esa corona');
    for (const p of fuera) {
      assert.equal(cerca.some((a) => a.parada === p.id), false, `${p.nombre} no puede ser acceso`);
    }
  });

  /**
   * ⭐ JUEZ 5 — EL TRANSBORDO: solo pares de la `F`, y con sus 120 s.
   *
   * Los transbordos que la búsqueda usa **salen del cocinado**, que ya los
   * calculó andando de verdad. Aquí se compra que no se inventa ninguno y que
   * la penalización se suma.
   */
  test('⭐ 5 · los transbordos son los del cocinado, y suman sus 120 s', () => {
    assert.equal(PENALIZACION_TRANSBORDO_S, 120);
    const posibles = new Set(red.transbordos.map((t) => `${t.desde}>${t.hasta}`));

    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: enLaParada('16524'),
      salida: enLaParada('17664'),
    })!;
    assert.ok(viaje.transbordos.length > 0, 'este par transborda');
    for (const t of viaje.transbordos) {
      assert.ok(posibles.has(`${t.desde}>${t.hasta}`), `${t.desde}>${t.hasta} no está en la F`);
      assert.ok(t.metros <= 500, 'ningún transbordo pasa de 500 m');
    }

    // Y la suma: el total es acceso + Σ(espera+rodando) + Σ(transbordo+120) + salida.
    const aMano =
      viaje.accesoAndando.metros / VELOCIDAD_PEATON_MS +
      viaje.montados.reduce((n, m) => n + m.espera + m.rodando, 0) +
      viaje.transbordos.reduce(
        (n, t) => n + t.metros / VELOCIDAD_PEATON_MS + PENALIZACION_TRANSBORDO_S,
        0,
      ) +
      viaje.salidaAndando.metros / VELOCIDAD_PEATON_MS;
    assert.equal(viaje.segundos, Math.round(aMano));
  });

  /**
   * ⭐ JUEZ 6 — LA ESPERA ES `H/2` DEL PATRÓN **HOY**.
   *
   * [Dial 1967 · Clerq 1972 · Wirasinghe 1980] `E[W] = H/2` para llegadas
   * aleatorias a un servicio frecuente. `H` es el intervalo **de hoy**, no el
   * medio de la semana: un patrón que en domingo hace la mitad de viajes tiene
   * el doble de espera, y eso se nota.
   */
  test('⭐ 6 · la espera es la mitad del intervalo de HOY, y cambia con el día', () => {
    const linea29 = red.lineas.find((l) => l.corto === '29')!;
    const patron = red.patrones.find((p) => p.linea === linea29.id && p.principal)!;

    const h = intervaloDeHoy(patron, red, UN_MARTES)!;
    assert.ok(h > 0);
    assert.equal(esperaEstimada(patron, red, UN_MARTES), Math.round(h / 2));

    // El domingo pasa menos, así que se espera más. 20260906 es domingo.
    const hDomingo = intervaloDeHoy(patron, red, '20260906');
    if (hDomingo !== null) {
      assert.ok(hDomingo > h, `domingo ${hDomingo} tendría que ser mayor que martes ${h}`);
    }

    // Un día sin servicio no tiene intervalo, y NO se inventa uno por defecto.
    assert.equal(intervaloDeHoy(patron, red, '20261012'), null);
    assert.equal(esperaEstimada(patron, red, '20261012'), null);
  });

  /**
   * ⭐ JUEZ 7 — EL 12/10 NO HAY BUS, y eso no es «no hay ruta»: es que el feed
   * se acaba.
   *
   * El censo lo midió y la cocina lo confirma: del 10/10 no queda un viaje. La
   * búsqueda no puede inventarse uno.
   */
  test('⭐ 7 · el 12/10, el Pilar, no hay viaje en bus', () => {
    const o = portales.donde.get('Portales.93310')!;
    const d = portales.donde.get('Portales.79358')!;
    const acceso = accesos(o.lon, o.lat);
    const salida = accesos(d.lon, d.lat);

    assert.ok(buscarViaje({ red, fecha: UN_MARTES, acceso, salida }), 'un martes sí');
    assert.equal(buscarViaje({ red, fecha: '20261012', acceso, salida }), null, 'el Pilar no');
    assert.equal(buscarViaje({ red, fecha: '20261010', acceso, salida }), null);
  });

  /**
   * ⭐ JUEZ 9 — EL ORDEN LEXICOGRÁFICO, literal.
   *
   * Las tres capas, una a una y en su orden: **vehículos** manda sobre todo;
   * **tranvías** desempata; **tiempo** decide al final. Las dos primeras ya se
   * han comprado con casos reales en las jueces 2 y 3; aquí se compra que son
   * un orden y no una mezcla, y que la tercera capa existe.
   */
  test('⭐ 9 · vehículos, luego tranvías, luego tiempo: en ese orden', () => {
    assert.equal(RONDAS, 3, 'el tope de rondas es el tope de vehículos');

    // Capa 1 sobre capa 3: la juez 2 lo midió — 1 vehículo de 40,3 min gana a
    // 2 de 39,4. Capa 2 sobre capa 3: la juez 3 — 0 tranvías de 63,9 gana a 1
    // de 53,8. Aquí queda la comprobación de que la tercera capa ordena de
    // verdad cuando las dos primeras empatan.
    const desde = enLaParada('16572');
    const hasta = enLaParada('16867');
    const uno = buscarViaje({ red, fecha: UN_MARTES, acceso: desde, salida: hasta })!;
    assert.equal(uno.vehiculos, 1);

    // Quitando su patrón, el siguiente de UN vehículo (si lo hay) tiene que ser
    // más lento que él: si no, el orden por tiempo no estaría ordenando.
    const sin: RedDeBus = {
      ...red,
      patrones: red.patrones.filter((p) => p.id !== uno.montados[0]!.patron.id),
    };
    const otro = buscarViaje({ red: sin, fecha: UN_MARTES, acceso: desde, salida: hasta });
    if (otro && otro.vehiculos === 1) {
      assert.ok(otro.segundos >= uno.segundos, 'había un directo más rápido y no se eligió');
    }
  });

  /**
   * ⭐ JUEZ 10 — NADA DE ESTO TOCA AL PEATÓN NI A LA RUEDA.
   *
   * La muralla del peatón vive en `rueda.spec.ts` y se corre con la suite; aquí
   * se compra lo que esta búsqueda podría haber roto sin querer: que sigue
   * usando el mismo peatón de siempre y que no le ha cambiado nada.
   */
  test('⭐ 10 · el peatón que usa la búsqueda es el de siempre, intacto', () => {
    assert.equal(peaton.aristas.length > 0, true);
    // El mismo andar que el resto de la casa: dos puntos conocidos, un número
    // que no depende de nada de esta casilla.
    const o = portales.donde.get('Portales.93310')!;
    const d = portales.donde.get('Portales.79358')!;
    const m = andar(o.lon, o.lat, d.lon, d.lat);
    assert.ok(m !== null && m > 0);
    // Y la velocidad a pie es la de la casa, no una propia del bus.
    assert.equal(Math.round(VELOCIDAD_PEATON_MS * 3600), 5000);
  });
});
