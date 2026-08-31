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
import { metrosEntre } from './cercano.ts';
import {
  buscarViaje,
  COSTE_DE_SUBIR,
  PESO_DE_ANDAR,
  PESO_DE_ESPERAR,
  PESO_POR_MODO,
  pesoDeAndar,
  esperaEstimada,
  etapaMontada,
  intervaloDeHoy,
  lineaDelViaje,
  PENALIZACION_TRANSBORDO_S,
  postesCerca,
  preguntarPorLasSubidas,
  prepararViajeEnBus,
  RADIO_M,
  RONDAS,
  VELOCIDAD_PEATON_MS,
  type Acceso,
} from './viaje-bus.ts';
import { reiniciarVisitas, visitasHechas } from './avanza.ts';
import type { Motor } from './trayecto.ts';
import type { Extremo } from './etapas.ts';

let red: RedDeBus;
let andar: AndarEntre;
let portales: PortalesEnMemoria;
let peaton: RedEnMemoria;
let rejilla: Rejilla;
/**
 * ⭐ EL MOTOR MÍNIMO, y va con un `as` que se declara.
 *
 * El viaje en bus toca del motor **tres cosas y ninguna más** —la red del
 * peatón, su rejilla y su cuaderno—, porque lo único que le pide es
 * `etapaAndando`. Cargar el motor entero aquí sería levantar la rueda, el
 * callejero, los sitios, los aparcabicis y el BiZi para no usarlos.
 */
let motor: Motor;

/** Un martes cualquiera de septiembre, con la red entera operando. */
const UN_MARTES = '20260907';

/**
 * ⭐ EL PESO DE UN VIAJE, con la fórmula de la casilla escrita entera:
 *
 *     walkReluctance × andar  +  Σ(boardCost + espera×1 + saltos)  +
 *     Σ(transbordo×walkReluctance + 120)  +  walkReluctance × salir
 *
 * Se calcula aquí, a mano y aparte del motor, para que las jueces comparen
 * contra la doctrina y no contra la implementación. Si el motor cambiara de
 * fórmula sin querer, esto dejaría de cuadrar.
 */
function pesoDelViaje(v: {
  readonly accesoAndando: { readonly metros: number };
  readonly salidaAndando: { readonly metros: number };
  readonly montados: readonly { readonly espera: number; readonly rodando: number }[];
  readonly transbordos: readonly { readonly metros: number }[];
}): number {
  return (
    pesoDeAndar(v.accesoAndando.metros) +
    v.montados.reduce((n, m) => n + COSTE_DE_SUBIR + PESO_DE_ESPERAR * m.espera + m.rodando, 0) +
    v.transbordos.reduce((n, t) => n + pesoDeAndar(t.metros) + PENALIZACION_TRANSBORDO_S, 0) +
    pesoDeAndar(v.salidaAndando.metros)
  );
}

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
    const cuaderno = cuadernoPara(peaton);
    andar = andarConElPeaton(peaton, rejilla, cuaderno);
    motor = { red: peaton, rejilla, cuaderno } as unknown as Motor;
    portales = cargarPortales();
    red = (await cocinar(elFeedQueSeSirve().ruta, andar)).red;
  });

  /**
   * ⭐ JUEZ 1 — EL CASO DEL OJO: COLOSO 2 → LEOPOLDO ROMEO 27 en bus.
   *
   * El mismo par que lleva toda la semana sirviendo de piedra de toque, ahora en
   * bus. Sale un viaje de **un solo vehículo**, la línea 29.
   *
   * ⚠️ **Y el poste de subida va JUSTIFICADO, no copiado de la salida.** Hasta el
   * 31/08 esta juez compraba `Bernardo Ramazzini / Maz` **a 478 m**, que es lo
   * que el motor devolvía — y lo que devolvía estaba mal. El poste que compra
   * ahora es el que cogería un vecino, y se puede decir por qué:
   *
   *   · `Av. Academia General Militar N.º 37` está **a 60 m** del portal;
   *   · lleva **la misma línea 29 en la misma dirección** (patrón `29|1|1`);
   *   · Ramazzini es el índice 8 de ese patrón y éste el 10, así que subir en
   *     Ramazzini cuesta 418 m más de andar **y 87 s más de rodar**.
   *
   * Ver la entrada del 31/08 de `docs/BITACORA.md`, y la ley que sale de ella.
   *
   * ⭐ **Y desde los pesos de OTP el viaje son DOS vehículos, no uno**, y es la
   * doctrina haciendo su trabajo: el de un solo vehículo dejaba en la puerta un
   * paseo final de **897 m**, que con `walkReluctance 4` pesa **2.583** —más de
   * cuarenta minutos percibidos—. El de dos acaba a **194 m** y sale además
   * **más rápido en segundos de verdad** (41,3 min contra 41,9).
   */
  test('⭐ 1 · el caso del ojo: sube en el poste de la puerta y sale en dos vehículos', () => {
    const o = portales.donde.get('Portales.93310')!;
    const d = portales.donde.get('Portales.79358')!;
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: accesos(o.lon, o.lat),
      salida: accesos(d.lon, d.lat),
    })!;
    assert.ok(viaje, 'el caso del ojo tiene que tener viaje en bus');

    assert.equal(viaje.vehiculos, 2);
    assert.equal(viaje.tranvias, 0);
    assert.equal(viaje.transbordos.length, 1);

    const nombre = new Map(red.paradas.map((p) => [p.id, p.nombre]));
    assert.equal(nombre.get(viaje.accesoAndando.parada), 'Av. Academia General Militar N.º 37');
    assert.equal(viaje.accesoAndando.metros, 60, 'el poste que hay al salir del portal');
    assert.equal(nombre.get(viaje.salidaAndando.parada), 'Doctor Iranzo N.º 61');
    assert.equal(viaje.salidaAndando.metros, 194, 'y se baja casi en la puerta');

    const linea = lineaDelViaje(red, viaje.montados[0]!.patron);
    assert.equal(linea.corto, '29');
    assert.equal(linea.modo, 'bus');
    assert.equal(linea.color, 'F5C100', 'el color sale del feed, no de nosotros');
    assert.equal(viaje.montados[0]!.iDesde, 10, 'sube en el índice 10, no en el 8');

    // ⭐ Y EL CONTRASTE CON EL POSTE QUE SE ELEGÍA ANTES, con la cifra delante:
    // Ramazzini está en el mismo patrón y en la misma dirección, dos índices
    // antes, y a 478 m. Que esté DENTRO del conjunto de acceso es lo que hace
    // que esta juez valga: no gana por no estar, gana por costar menos.
    const ramazzini = accesos(o.lon, o.lat).find(
      (a) => nombre.get(a.parada) === 'Bernardo Ramazzini / Maz',
    );
    assert.ok(ramazzini, 'Ramazzini tiene que seguir siendo un acceso posible');
    assert.equal(ramazzini!.metros, 478);
    assert.ok(
      viaje.montados[0]!.patron.paradas.indexOf(ramazzini!.parada) === 8,
      'y estar dos índices antes en el MISMO patrón',
    );

    // ⭐ Y LAS SUMAS CUADRAN, **en segundos de verdad**: los pesos son para
    // elegir camino, no para el reloj. Andar 194 m sigue costando 140 s aunque
    // para decidir cuenten como 559.
    const aMano =
      viaje.accesoAndando.metros / VELOCIDAD_PEATON_MS +
      viaje.montados.reduce((n, m) => n + m.espera + m.rodando, 0) +
      viaje.transbordos.reduce(
        (n, t) => n + t.metros / VELOCIDAD_PEATON_MS + PENALIZACION_TRANSBORDO_S,
        0,
      ) +
      viaje.salidaAndando.metros / VELOCIDAD_PEATON_MS;
    assert.equal(viaje.segundos, Math.round(aMano), 'el total no es la suma de sus partes');
    assert.ok(pesoDelViaje(viaje) > viaje.segundos, 'el peso pesa más que el reloj');
  });

  /**
   * ⭐ JUEZ 2 — **FIRMA 6**: menos vehículos gana, aunque tarde más.
   *
   * ⚠️ El caso está **medido sobre la red real**, barriéndola hasta encontrar
   * uno donde la firma cueste dinero: `Av. De América N.º 69` →
   * `Madre Teresa De Calcuta N.º 3`. El directo de la **línea 33** tarda
   * **40,3 min**; hay un dos-vehículos (**34+Ci1**) que tarda **35,8 min**.
   * **Gana el directo.** Es la firma haciendo lo que se firmó.
   *
   * ⭐ **Y ya no gana por una llave, gana por el peso** (31/08). [DOC OTP,
   * literal] *«no optimizamos por menos transbordos: lleva a resultados
   * absurdos»*; la preferencia se expresa con `walkBoardCost`. Medido en este
   * par: el de dos vehículos es **235 s más rápido de verdad** y pesa **1.087
   * más** —600 del segundo billete, 142 m de transbordo y sus 120 s—, así que
   * pierde. Pesos: **3.020** el directo, **4.107** el de dos.
   */
  test('⭐ 2 · el directo gana por PESO, no por una llave: el de dos ahorra menos de 600', () => {
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
    // ⭐ LA DOCTRINA, EN UNA RESTA: el de dos ahorra tiempo real, pero menos de
    // lo que cuesta subirse otra vez. Ese «menos de 600» es TODA la regla.
    const ahorroReal = directo.segundos - conDos.segundos;
    assert.equal(ahorroReal, 235, 'los segundos de verdad que ahorra el de dos');
    assert.ok(
      ahorroReal < COSTE_DE_SUBIR,
      `ahorra ${ahorroReal} s y subirse cuesta ${COSTE_DE_SUBIR}: por eso pierde`,
    );
    // Y los pesos, a mano y con la fórmula de la doctrina.
    assert.equal(Math.round(pesoDelViaje(directo)), 3020);
    assert.equal(Math.round(pesoDelViaje(conDos)), 4107);
    assert.ok(pesoDelViaje(directo) < pesoDelViaje(conDos), 'gana el de menos peso');
  });

  /**
   * ⭐ JUEZ 3 — **LA FIRMA 3 ESTÁ RETIRADA**: el tranvía ya no penaliza.
   *
   * ⚠️ [DOC OTP, `transitReluctanceForMode`] la preferencia por modo existe y se
   * expresa con un peso —no con un veto—, **pero su ejemplo va al revés del
   * nuestro**: trae `RAIL 0,85`, o sea que el tren se PREFIERE. La doctrina no
   * da ningún número para penalizar un tranvía, y la firma 3 no tenía más apoyo
   * que la costumbre. Se retira, y lo que queda es `1,0` para los dos modos.
   *
   * El par de `Asín Y Palacios N.º 5` → `La Fragua / Parque Tapices De Goya`,
   * que es donde la firma costaba dinero, se vuelve a medir con la firma fuera:
   * el motor sigue eligiendo **bus+bus (42+35)** aunque el bus+tranvía tarde
   * 4,3 min menos de reloj. ⭐ **Y ahora no es por el modo: es por el peso** —
   * el del tranvía acaba a **353 m** de la puerta y el de bus+bus **a 0**.
   */
  test('⭐ 3 · el tranvía ya no penaliza: los dos modos pesan 1', () => {
    assert.equal(PESO_POR_MODO.bus, 1);
    assert.equal(PESO_POR_MODO.tram, 1, 'la firma 3 está retirada, no rebajada');

    const desde = enLaParada('16524');
    const hasta = enLaParada('17664');
    const sinTranvia = buscarViaje({ red, fecha: UN_MARTES, acceso: desde, salida: hasta })!;
    assert.ok(sinTranvia);
    assert.equal(sinTranvia.vehiculos, 2);
    assert.equal(sinTranvia.tranvias, 0);
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
    assert.equal(conTranvia.tranvias, 1);
    assert.ok(conTranvia.segundos < sinTranvia.segundos, 'el del tranvía es más rápido de reloj');

    // ⭐ Y PIERDE POR EL PASEO FINAL, no por ser tranvía: 353 m contra 0.
    assert.equal(sinTranvia.salidaAndando.metros, 0);
    assert.equal(conTranvia.salidaAndando.metros, 353);
    assert.ok(
      pesoDelViaje(sinTranvia) < pesoDelViaje(conTranvia),
      `pesos: ${Math.round(pesoDelViaje(sinTranvia))} contra ${Math.round(pesoDelViaje(conTranvia))}`,
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

    // ⚠️ El par es **el caso (A) de Antonio** —`COLOSO 2 → I.E.S. Grande
    // Covián`—, y desde el 31/08: el que usaba antes dejó de transbordar
    // cuando la subida empezó a reconsiderarse, y una juez del transbordo
    // sobre un viaje sin transbordo no comprueba nada.
    const oA = portales.donde.get('Portales.93310')!;
    const dA = portales.donde.get('Portales.100833')!;
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: accesos(oA.lon, oA.lat),
      salida: accesos(dA.lon, dA.lat),
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
   * ⭐ JUEZ 9 — **EL COSTE TOTAL DECIDE, y decide ENTRE RONDAS.**
   *
   * ⚠️ Hasta el 31/08 la búsqueda devolvía **la primera ronda que llegara**,
   * porque «menos vehículos» era una llave absoluta: la ronda 2 no podía ganarle
   * a la 1 dijera lo que dijera el reloj. Ahora la preferencia vive dentro del
   * coste —`COSTE_DE_SUBIR` por vehículo— y **todas las rondas compiten**.
   *
   * El caso del ojo es la prueba: la ronda 1 llega (un solo 29, acabando a 897 m
   * de la puerta) y **aun así gana la ronda 2**, porque esos 897 m pesan 2.583.
   */
  test('⭐ 9 · una ronda posterior puede ganar si su coste total es menor', () => {
    assert.equal(RONDAS, 3, 'el tope de rondas sigue siendo el tope de vehículos');

    const o = portales.donde.get('Portales.93310')!;
    const d = portales.donde.get('Portales.79358')!;
    const peticion = { red, fecha: UN_MARTES, acceso: accesos(o.lon, o.lat), salida: accesos(d.lon, d.lat) };
    const dos = buscarViaje(peticion)!;
    assert.equal(dos.vehiculos, 2, 'gana la ronda 2');

    // Que la ronda 1 LLEGABA se compra tapando el segundo vehículo: sigue
    // habiendo viaje, y es peor de peso aunque use un vehículo menos.
    const sinElSegundo: RedDeBus = {
      ...red,
      patrones: red.patrones.filter((p) => p.id !== dos.montados[1]!.patron.id),
    };
    const otro = buscarViaje({ ...peticion, red: sinElSegundo })!;
    assert.ok(otro, 'sin ese patrón sigue habiendo viaje');
    assert.ok(
      pesoDelViaje(dos) < pesoDelViaje(otro),
      `el elegido tiene que pesar menos: ${Math.round(pesoDelViaje(dos))} contra ${Math.round(pesoDelViaje(otro))}`,
    );
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

  /**
   * ⭐ LAS DOS RESPUESTAS DE AVANZA, **MEDIDAS** el 31/08/2026 a las 13:16.
   *
   * [Ley nº18] un esquema dice el TIPO, no la codificación, y **el fixture
   * copia la medición**. Estas dos son las que el servidor mandó, byte a byte,
   * sin una coma puesta por mí:
   *
   *   · **poste 1000** (Plaza Emperador Carlos V / Intercambiador), 2.930
   *     bytes: la línea `053` con dos coches, el 4937 a **5 min** y el 4669 a
   *     **12 min**. Trae la cicatriz entera —`<strong>053<i…></i>MIRALBUENO`—.
   *   · **poste 1203** (Bernardo Ramazzini / Maz), 219 bytes: `maquinas` con
   *     **solo la parada** y `tablatiempos` **vacío**. Es el poste donde el
   *     caso del ojo se sube a la 29, y a esa hora **no venía ni un bus**.
   *
   * ⚠️ La segunda es el caso que no me habría inventado nunca y salió a la
   * primera medición: la respuesta legítima de un poste sin nada que decir.
   */
  const MEDIDO_POSTE_1000 = "{\"maquinas\":{\"0\":{\"coordenadas\":{\"0\":{\"LAT\":41.638001,\"LON\":-0.89869}},\"icon\":\"https:\\/\\/gps.avanzabus.com\\/img\\/bus_rojo.png\",\"info\":\"Plaza Emperador Carlos V \\/ Intercambiador\",\"title\":\"Plaza Emperador Carlos V \\/ Intercambiador\"},\"1\":{\"coordenadas\":{\"0\":{\"LAT\":41.640968435279994,\"LON\":-0.9102758371901934}},\"info\":\"<table border=\\\"0\\\">\\n                        <tr>\\n                            <td class=\\\"td_info\\\">Bus<\\/td>\\n                            <td class=\\\"td_info\\\">L\\u00ednea<\\/td>\\n                            <td class=\\\"td_info\\\">Tiempo<\\/td>\\n                            <td class=\\\"td_info\\\">Distancia<\\/td>\\n                        <\\/tr>\\n\\n                        <tr>\\n                            <td class=\\\"td_info2\\\">&nbsp4937<\\/td>\\n                            <td class=\\\"td_info2\\\">053->MIRALBUENO<\\/td>\\n                            <td class=\\\"td_info2\\\">5 min.<\\/td>\\n                            <td class=\\\"td_info2\\\">1 kms.<\\/td>\\n                        <\\/tr>\\n                    <\\/table>\",\"title\":\"053 4937\",\"icon\":\"https:\\/\\/gps.avanzabus.com\\/img\\/bus.png\"},\"2\":{\"coordenadas\":{\"0\":{\"LAT\":41.65174088377712,\"LON\":-0.9237253579670318}},\"info\":\"<table border=\\\"0\\\">\\n                        <tr>\\n                            <td class=\\\"td_info\\\">Bus<\\/td>\\n                            <td class=\\\"td_info\\\">L\\u00ednea<\\/td>\\n                            <td class=\\\"td_info\\\">Tiempo<\\/td>\\n                            <td class=\\\"td_info\\\">Distancia<\\/td>\\n                        <\\/tr>\\n\\n                        <tr>\\n                            <td class=\\\"td_info2\\\">&nbsp4669<\\/td>\\n                            <td class=\\\"td_info2\\\">053->MIRALBUENO<\\/td>\\n                            <td class=\\\"td_info2\\\">12 min.<\\/td>\\n                            <td class=\\\"td_info2\\\">2 kms.<\\/td>\\n                        <\\/tr>\\n                    <\\/table>\",\"title\":\"053 4669\",\"icon\":\"https:\\/\\/gps.avanzabus.com\\/img\\/bus.png\"}},\"tablatiempos\":\"<li>\\n                        <a href=\\\"#\\\">\\n                            <i class=\\\"fa fa-dot-circle-o\\\"><\\/i>\\n                            <strong>053\\n                            <i class=\\\"fa fa-long-arrow-right fa-fw\\\"><\\/i>MIRALBUENO\\n                            <\\/strong>\\n                        <\\/a><ul class=\\\"nav nav-second-level\\\">\\n                        <li>\\n                            <a href=\\\"https:\\/\\/gps.avanzabus.com\\/zaragoza\\/fParadas\\/1000\\/4937\\\">\\n\\n                            <i class=\\\"fa fa-map-marker fa-fw\\\"><\\/i>\\n                            4937 [5 mins]\\n                            <\\/a>\\n                        <\\/li><li>\\n                        <a href=\\\"https:\\/\\/gps.avanzabus.com\\/zaragoza\\/fParadas\\/1000\\/4669\\\">\\n\\n                        <i class=\\\"fa fa-map-marker fa-fw\\\"><\\/i>\\n                        4669 [12 mins]\\n                        <\\/a>\\n                    <\\/li><\\/ul><\\/li>\"}";
  const MEDIDO_POSTE_1203 = "{\"maquinas\":{\"0\":{\"coordenadas\":{\"0\":{\"LAT\":41.685224,\"LON\":-0.870433}},\"icon\":\"https:\\/\\/gps.avanzabus.com\\/img\\/bus_rojo.png\",\"info\":\"Bernardo Ramazzini \\/ Maz\",\"title\":\"Bernardo Ramazzini \\/ Maz\"}},\"tablatiempos\":\"\"}";

  /** Un `fetch` de mentira que contesta siempre con un cuerpo medido. */
  const respondiendo = (cuerpo: string): typeof fetch =>
    (async () => new Response(cuerpo, { status: 200 })) as unknown as typeof fetch;

  /** Los dos extremos del caso del ojo, como los recibe el motor. */
  const extremo = (codigo: string, nombre: string): Extremo => {
    const p = portales.donde.get(codigo)!;
    return { lon: p.lon, lat: p.lat, nombre };
  };
  const elOjo = (): { readonly origen: Extremo; readonly destino: Extremo } => ({
    origen: extremo('Portales.93310', 'CALLE EL COLOSO 2'),
    destino: extremo('Portales.79358', 'CALLE LEOPOLDO ROMEO 27'),
  });

  /**
   * ⭐ JUEZ 8 — LA LÍNEA ESTÁ EN EL POSTE: los minutos vivos sustituyen al ~H/2.
   *
   * [GTFS-Realtime, el principio de la casa] **lo real desplaza a lo
   * programado**. El caso está medido de punta a punta: `Plaza Emperador
   * Carlos V / Intercambiador` → `Av. Gómez Laguna N.º 48`, un vehículo, la
   * **línea 53**. El horario publicado da una espera estimada de **268 s**;
   * Avanza, en ese mismo poste y a esa misma hora, dice **5 minutos**.
   *
   * ⚠️ Y lo que se compra no es el texto: **es el total**. 698 s con la
   * estimación, **730 s** con el dato vivo. Enseñar los minutos y no sumarlos
   * dejaría el paso diciendo una cosa y la cabecera otra.
   */
  test('⭐ 8 · con la línea en el poste, el hito lleva minutos y el total cambia', async () => {
    reiniciarVisitas();
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: enLaParada('17671'),
      salida: enLaParada('16755'),
    })!;
    assert.equal(viaje.vehiculos, 1);
    assert.equal(lineaDelViaje(red, viaje.montados[0]!.patron).corto, '53');
    assert.equal(viaje.montados[0]!.espera, 268, 'la espera que el horario estima hoy');

    const vivas = await preguntarPorLasSubidas(red, viaje.montados, respondiendo(MEDIDO_POSTE_1000));
    assert.equal(vivas.length, 1);
    assert.equal(vivas[0]!.clase, 'llega');
    assert.equal((vivas[0] as { minutos: number }).minutos, 5, 'el primero de los dos coches');

    const estimada = etapaMontada(red, viaje.montados[0]!, 268, null);
    const viva = etapaMontada(red, viaje.montados[0]!, 268, vivas[0]!);
    assert.equal(estimada.segundos, 698, 'la etapa con la espera estimada');
    assert.equal(viva.segundos, 730, 'los 5 min vivos tienen que entrar en el total');

    assert.match(estimada.pasos[0]!.texto, /~4 min de espera$/);
    assert.match(viva.pasos[0]!.texto, /próximo en 5 min \(dato de las \d\d:\d\d\)$/);
  });

  /**
   * ⭐ JUEZ 11 — LA LÍNEA NO ESTÁ: se dice, y la estimación se queda donde está.
   *
   * La medición del poste 1203 —el del caso del ojo— vino **vacía**: ni un
   * coche. Eso **no es «no hay servicio nunca»** ni es «no lo sabemos»: es que
   * ahora mismo no viene ninguno, y las tres cosas se dicen distinto.
   *
   * Entonces la ruta **sale igual** —componer sin prometer— con la espera del
   * horario publicado, y el aviso nombra **la línea y el poste**, que es lo que
   * permite ponerlo al lado de SU hito y no de otro [GOV.UK, doble sitio].
   */
  test('⭐ 11 · si la línea no está en el poste, se dice — y la ruta sale igual', async () => {
    reiniciarVisitas();
    const { origen, destino } = elOjo();
    const preparado = prepararViajeEnBus(motor, red, origen, destino, UN_MARTES);
    const conVivo = await preparado.conElVivo!(respondiendo(MEDIDO_POSTE_1203));
    const sinPreguntar = preparado.trayecto();

    const aviso = conVivo.avisos.find((a) => a.texto.includes('no anuncia ningún próximo'));
    assert.ok(aviso, `no se dijo que Avanza callaba. Avisos: ${JSON.stringify(conVivo.avisos)}`);
    // ⚠️ [GTFS-Realtime] AUSENTE es «sin información en tiempo real», no «sin
    // servicio». La juez compra el texto medido y NO la conclusión que tenía antes.
    assert.match(aviso!.texto, /^Avanza no anuncia ningún próximo de la línea \S+ /);
    assert.ok(!aviso!.texto.includes('prestando servicio'), 'eso era una conclusión, no el dato');
    // ⚠️ **El poste NO va escrito a mano.** Se saca del viaje que el motor
    // acaba de devolver, porque lo que esta juez compra es que el aviso nombre
    // el poste de SU subida — no cuál es ese poste. El 31/08 cambió al
    // arreglarse la búsqueda, y escrito a mano habría muerto sin razón.
    const subida = conVivo.pasos.find((x) => x.giro === 'sube')!;
    const suPoste = subida.partes.filter((x) => x.papel === 'via').at(-1)!.texto;
    assert.ok(
      aviso!.texto.includes(suPoste),
      `el aviso tiene que nombrar SU poste (${suPoste}) para poder ir al lado de su hito`,
    );

    // La ruta no cambia: sin dato vivo que sustituya, manda el horario.
    assert.equal(conVivo.segundos, sinPreguntar.segundos);
    assert.equal(conVivo.metros, sinPreguntar.metros);
    const sube = conVivo.pasos.find((x) => x.giro === 'sube')!;
    assert.match(sube.texto, /~\d+ min de espera$/, 'la espera sigue siendo la estimada');
  });

  /**
   * ⭐ JUEZ 12 — SI LA API CALLA, D-G: la ruta sale y no se promete nada.
   *
   * Es el plan firmado el 28/08 para el BiZi, con las mismas palabras —
   * «disponibilidad no verificada»— porque es la misma condición: se ha
   * preguntado y no se sabe. **Y no es lo mismo que la juez 11**: allí la
   * fuente contestó y dijo que no venía nadie; aquí no contestó.
   */
  test('⭐ 12 · si la API calla, D-G: la ruta sale con su aviso y sin promesas', async () => {
    reiniciarVisitas();
    const { origen, destino } = elOjo();
    const muda = (async () => {
      throw new Error('ENOTFOUND');
    }) as unknown as typeof fetch;
    const t = await prepararViajeEnBus(motor, red, origen, destino, UN_MARTES).conElVivo!(muda);

    assert.ok(t.pasos.length > 0, 'componer sin prometer: la ruta sale igual');
    const aviso = t.avisos.find((a) => a.texto.includes('disponibilidad no verificada'));
    assert.ok(aviso, `sin D-G. Avisos: ${JSON.stringify(t.avisos)}`);
    const subida = t.pasos.find((x) => x.giro === 'sube')!;
    const suPoste = subida.partes.filter((x) => x.papel === 'via').at(-1)!.texto;
    assert.ok(aviso!.texto.includes(suPoste), `el D-G también nombra su poste (${suPoste})`);
  });

  /**
   * ⭐ JUEZ 13 — DOS SUBIDAS EN EL MISMO POSTE, **UNA** consulta.
   *
   * El single-flight de `avanza.ts` deduplica lo que está en vuelo, y eso solo
   * sirve si las consultas **salen a la vez**. Preguntando en fila india esta
   * juez daría 2: es la que obliga a que el `Promise.all` exista.
   */
  test('⭐ 13 · dos subidas en el mismo poste hacen UNA sola consulta', async () => {
    reiniciarVisitas();
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: enLaParada('17671'),
      salida: enLaParada('16755'),
    })!;
    const dos = [viaje.montados[0]!, viaje.montados[0]!];
    const vivas = await preguntarPorLasSubidas(red, dos, respondiendo(MEDIDO_POSTE_1000));
    assert.equal(vivas.length, 2, 'las dos subidas tienen su respuesta');
    assert.equal(visitasHechas(), 1, `dos subidas al mismo poste hicieron ${visitasHechas()} visitas`);
  });

  /**
   * ⭐ JUEZ 14 — DOS «Generar», DOS consultas. Esto **no es una caché**.
   *
   * La frescura por petición es la conducta firmada, la misma que el BiZi: un
   * minuto guardado es un minuto que ya no es cierto.
   */
  /**
   * ⭐ JUEZ 15 — EL MONTADO VA POR EL ASFALTO, y las sumas siguen cerrando.
   *
   * Desde la casilla 4 la geometría del tramo montado es la traza de verdad, no
   * la recta de poste a poste. Dos cosas que tienen que ser ciertas a la vez:
   *
   * · **Más metros que la poligonal de postes.** El asfalto rodea manzanas que
   *   la cuerda se saltaba. Si saliera menos, la traza no sería la de esa línea.
   * · **Las sumas del contrato siguen exactas**: los tramos suman el total, y
   *   los índices de cada tramo caen dentro de la geometría y se tocan en las
   *   costuras. Es lo que `redondearTramos` promete, y ahora hay 470 vértices
   *   donde había 47.
   */
  test('⭐ 15 · el montado va por el asfalto y las sumas del contrato cierran', () => {
    const { origen, destino } = elOjo();
    const t = prepararViajeEnBus(motor, red, origen, destino, UN_MARTES).trayecto();
    const montado = t.tramos.find((x) => x.comoSeVa === 'montado')!;
    assert.ok(montado, 'el caso del ojo tiene tramo montado');

    // La poligonal de postes: lo que se dibujaba hasta ayer.
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: postesCerca(red, andar, origen.lon, origen.lat),
      salida: postesCerca(red, andar, destino.lon, destino.lat),
    })!;
    const m = viaje.montados[0]!;
    const porId = new Map(red.paradas.map((p) => [p.id, p]));
    let porLosPostes = 0;
    for (let k = m.iDesde; k < m.iHasta; k++) {
      const a = porId.get(m.patron.paradas[k]!)!;
      const b = porId.get(m.patron.paradas[k + 1]!)!;
      porLosPostes += metrosEntre(a.lat, a.lon, b.lat, b.lon);
    }
    assert.ok(
      montado.metros > porLosPostes,
      `el asfalto (${montado.metros} m) tendría que dar más que la cuerda (${Math.round(porLosPostes)} m)`,
    );

    // Las sumas y las costuras.
    assert.equal(
      t.tramos.reduce((n, x) => n + x.metros, 0),
      t.metros,
      'los tramos no suman los metros del viaje',
    );
    assert.equal(
      t.tramos.reduce((n, x) => n + x.segundos, 0),
      t.segundos,
      'los tramos no suman los segundos del viaje',
    );
    t.tramos.forEach((x, i) => {
      assert.ok(x.desde >= 0 && x.hasta < t.geometria.length, `el tramo ${i} se sale de la geometría`);
      if (i > 0) {
        assert.equal(x.desde, t.tramos[i - 1]!.hasta, `el tramo ${i} no cose con el anterior`);
      }
    });
  });

  test('⭐ 14 · dos «Generar» son dos consultas, no una guardada', async () => {
    reiniciarVisitas();
    const { origen, destino } = elOjo();
    const preparado = prepararViajeEnBus(motor, red, origen, destino, UN_MARTES);
    const primera = await preparado.conElVivo!(respondiendo(MEDIDO_POSTE_1203));
    // ⚠️ Las visitas por «Generar» son **una por subida**, y cuántas subidas
    // tiene el viaje lo decide la búsqueda — el 31/08 pasó de una a dos y este
    // número, escrito a mano, murió sin tener nada que ver con la caché.
    const subidas = primera.pasos.filter((x) => x.giro === 'sube').length;
    assert.ok(subidas > 0, 'el viaje tiene al menos una subida');
    assert.equal(visitasHechas(), subidas, 'una visita por subida en el primer Generar');

    await preparado.conElVivo!(respondiendo(MEDIDO_POSTE_1203));
    assert.equal(visitasHechas(), subidas * 2, 'alguien ha guardado la respuesta entre peticiones');
  });
});
