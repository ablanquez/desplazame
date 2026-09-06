/**
 * ⭐ LAS JUECES DE LA BÚSQUEDA EN BUS Y TRANVÍA (31/08).
 *
 * ⚠️ **CERO RED.** La red se cocina del zip del repositorio y el peatón es el de
 * la casa; no se llama a nadie de fuera. Los casos de las firmas **están
 * medidos sobre el dato real**, no inventados: cada uno se encontró barriendo la
 * red y sus cifras son las que salen.
 *
 * ⭐ ── LA REGLA DE CASA (6/09) ───────────────────────────────────
 *
 * **Una juez que compra un viaje concreto de un día concreto lo monta sobre la
 * red OPERATIVA —`aplicarDesvios` con el recorrido de ese día—, o declara en su
 * propio comentario por qué la red pelada le vale.**
 *
 * Sale de la entrada nº36 de `docs/BITACORA.md`, que es la tercera del mismo
 * día sobre la misma forma de equivocarse. La juez 4 de la ventana horaria
 * montaba sobre la red del feed y sellaba un `29+38` que **baja en el poste
 * 1293 · Coso 80 y sube en el 334 · Coso 55**, dos postes que hoy no pisa nadie
 * porque el Coso está en obras. Con 603 jueces en verde.
 *
 * El porqué es de manual: [GTFS Trip Modifications] *«el consumidor debe
 * comportarse como si el estático hubiera sido modificado»*, **y una juez
 * también es un consumidor**. Una que se construye a mano el mundo que debería
 * vigilar no vigila: imita, y lo imitado cuadra siempre.
 *
 * ⚠️ **«Declarar» no es una salida fácil, es una obligación de escribir.** Vale
 *    para las jueces que compran una RELACIÓN —«con la capa cambia y sin ella
 *    no», «con reloj sale igual que sin él», «dos consultas son dos visitas»—,
 *    porque esa relación se sostiene sobre cualquier red mientras sea la misma
 *    en los dos lados. No vale para las que compran un itinerario.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRejilla, type Rejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { andarConElPeaton, cocinar, operaEl, type AndarEntre, type RedDeBus } from './red-bus.ts';
import {
  aplicarDesvios,
  aristaDeLaTraza,
  avisoDeDesvio,
  rodarConElCoche,
  type RedConDesvios,
} from './patron-operativo.ts';
import { cargarRedDeCoche } from './coche.ts';
import { compararRecorrido, oficialDe } from './desvios.ts';
import { elFeedQueSeSirve } from './feed.ts';
import { metrosEntre } from './cercano.ts';
import {
  buscarViaje,
  pasoDeSubir,
  COSTE_DE_SUBIR,
  PESO_DE_ANDAR,
  PESO_DE_ESPERAR,
  PESO_POR_MODO,
  pesoDeAndar,
  POSTES_CANDIDATOS,
  ESTANDAR_DE_PLANEAMIENTO_M,
  TOPE_DE_ACCESO_S,
  esperaEstimada,
  etapaMontada,
  intervaloDeHoy,
  ventanaDe,
  elDiaAntes,
  segundosDelDia,
  circulaHoy,
  SEGUNDOS_DEL_DIA,
  lineaDelViaje,
  PENALIZACION_TRANSBORDO_S,
  postesCerca,
  preguntarPorLaPrimeraSubida,
  prepararViajeEnBus,
  RONDAS,
  VELOCIDAD_PEATON_MS,
  viajeEnBus,
  type Acceso,
} from './viaje-bus.ts';
import {
  llegadasDelPoste,
  nombrarPoste,
  numeroDePoste,
  reiniciarVisitas,
  visitasHechas,
} from './avanza.ts';
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

/**
 * Los postes de acceso de un punto.
 *
 * ⚠️ Llama a `postesCerca`, el de producción, y no reimplementa nada. Hasta el
 * 31/08 esto era una copia de la lógica del motor dentro de la prueba — así que
 * el día que el motor cambió de regla, la copia siguió aplicando la vieja y las
 * jueces medían un mundo que ya no existía.
 */
const accesos = (lon: number, lat: number): Acceso[] => postesCerca(red, andar, lon, lat);

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
   * ⭐ JUEZ 1 — EL CASO DEL OJO, y lo que Antonio dijo que tenía que salir.
   *
   * `COLOSO 2 → LEOPOLDO ROMEO 27` en bus. Sale **un solo vehículo, la línea
   * 44**, y **35,9 min**. Vale la pena escribir de dónde viene ese número,
   * porque son tres arreglos seguidos sobre el mismo par:
   *
   * ```
   * 51,8 min  con la subida sin reconsiderar y el veto de 500 m
   * 43,0 min  cuando la subida se reconsideró (sube a 60 m, no a 478)
   * 41,3 min  con los pesos de OTP (dos vehículos: 897 m de paseo final pesan 2.583)
   * 35,9 min  sin el veto de los 500 m: la 44 pasa a 540 m y lleva a la puerta
   * ```
   *
   * ⚠️ **Y el poste de subida no está copiado de la salida** — la ley de la
   * entrada del 31/08—: `Av. Salvador Allende / San Juan De La Peña` se compra
   * porque **está a 540 m y lleva directo a 194 m del destino**, mientras que el
   * poste de la puerta (60 m) obliga a acabar a 846 m. La juez 9 pone los pesos
   * de las dos opciones uno al lado del otro.
   */
  test('⭐ 1 · el caso del ojo: un solo vehículo, la 44, y a 194 m de la puerta', () => {
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
    assert.equal(viaje.transbordos.length, 0);

    const porId = new Map(red.paradas.map((p) => [p.id, p]));
    assert.equal(porId.get(viaje.accesoAndando.parada)!.codigo, 'PA00214');
    assert.equal(viaje.accesoAndando.metros, 540, 'más de los 500 del veto que había');
    assert.equal(porId.get(viaje.salidaAndando.parada)!.codigo, 'PA00430');
    assert.equal(viaje.salidaAndando.metros, 194, 'y se baja casi en la puerta');

    const linea = lineaDelViaje(red, viaje.montados[0]!.patron);
    assert.equal(linea.corto, '44', 'la línea que Antonio dijo');
    assert.equal(linea.modo, 'bus');
    assert.equal(linea.color, '27A737', 'el color sale del feed, no de nosotros');

    // ⭐ Y LAS SUMAS CUADRAN, **en segundos de verdad**: los pesos son para
    // elegir camino, no para el reloj.
    const m = viaje.montados[0]!;
    const aMano =
      viaje.accesoAndando.metros / VELOCIDAD_PEATON_MS +
      m.espera +
      m.rodando +
      viaje.salidaAndando.metros / VELOCIDAD_PEATON_MS;
    assert.equal(viaje.segundos, Math.round(aMano), 'el total no es la suma de sus partes');
    assert.equal(viaje.segundos, 2153);
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
   * ⭐ JUEZ 4 — **EL ACCESO YA NO ES UN VETO**: la 44, a 530 m, entra.
   *
   * ⚠️ Esta juez decía lo contrario hasta el 31/08: compraba que un poste de bus
   * a más de 500 m **no podía ser acceso**. Y ese era el fallo: [DOC OTP2] el
   * límite de acceso y salida es **de rendimiento** —su consejo es *ponerlo
   * alto*, y su defecto son 4 horas— y **quien decide es `walkReluctance`**.
   * Un número de planeamiento usado como regla de router.
   *
   * El caso que lo pidió es literal: la **línea 44** pasa a **530 m andando** del
   * portal de Antonio, y con el veto no existía. Ahora entra en el conjunto de
   * acceso; que gane o no lo dice el coste — y su calendario, que hoy la deja
   * fuera por otra razón.
   *
   * Los 500/800 siguen citados como lo que son: el estándar de planeamiento.
   */
  test('⭐ 4 · un poste a más de 500 m SÍ es acceso, y el que decide es el peso', () => {
    assert.equal(TOPE_DE_ACCESO_S, 1800, 'treinta minutos andando');
    assert.equal(ESTANDAR_DE_PLANEAMIENTO_M.bus, 500, 'citado, no aplicado');
    assert.equal(ESTANDAR_DE_PLANEAMIENTO_M.tram, 800);

    const o = portales.donde.get('Portales.93310')!;
    const cerca = postesCerca(red, andar, o.lon, o.lat);
    const porId = new Map(red.paradas.map((p) => [p.id, p]));

    // ⭐ EL POSTE DE LA 44, a 530 m: dentro. Es el caso de Antonio, literal.
    const de44 = cerca.find((a) => porId.get(a.parada)!.codigo === 'PA00216');
    assert.ok(de44, 'el poste de la 44 tiene que estar en el acceso');
    assert.equal(de44!.metros, 530);
    assert.ok(de44!.metros > ESTANDAR_DE_PLANEAMIENTO_M.bus, 'y está más allá de los 500');

    // Ninguno pasa del tope de rendimiento, y no hay más de los que se piden.
    assert.ok(cerca.length <= POSTES_CANDIDATOS, `${cerca.length} candidatos`);
    for (const a of cerca) {
      assert.ok(
        a.metros <= TOPE_DE_ACCESO_S * VELOCIDAD_PEATON_MS,
        `${porId.get(a.parada)!.nombre}: ${a.metros} m`,
      );
    }

    // ⭐ Y el que decide es el PESO: andar los 530 m del poste de la 44 pesa
    // más que los 60 m del de la puerta, y esa diferencia es la que compite.
    const puerta = cerca.find((a) => porId.get(a.parada)!.codigo === 'PA00033')!;
    assert.equal(puerta.metros, 60);
    assert.ok(pesoDeAndar(de44!.metros) > pesoDeAndar(puerta.metros) + COSTE_DE_SUBIR);
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

    // ⚠️ **El par ha cambiado dos veces hoy**, y las dos por lo mismo: cada
    // arreglo de la búsqueda deja sin transbordo al par que servía de ejemplo,
    // y una juez del transbordo sobre un viaje sin transbordo no comprueba
    // nada. Este está barrido sobre la red con los pesos ya puestos:
    // `ALDEBARÁN 56 → CARDENAL DE BARDAJÍ 24`, líneas 36+21, 28,7 min, con un
    // transbordo de 163 m entre las dos aceras de la Avenida de Madrid.
    const oA = portales.donde.get('Portales.91655')!;
    const dA = portales.donde.get('Portales.107146')!;
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
   * El caso se monta sobre el del ojo, tapando la 44 para que la elección sea
   * entre uno y dos vehículos:
   *
   * ```
   * un vehículo (solo la 29): 43,5 min, acaba a 846 m de la puerta → peso 5.167
   * dos vehículos (35+30)   : 41,9 min, acaba a 288 m             → peso 4.608
   * ```
   *
   * La ronda 1 **llega**, y aun así pierde: sus 846 m finales pesan 2.437 y el
   * segundo billete solo cuesta 600.
   */
  test('⭐ 9 · una ronda posterior gana si su coste total es menor', () => {
    assert.equal(RONDAS, 3, 'el tope de rondas sigue siendo el tope de vehículos');

    const o = portales.donde.get('Portales.93310')!;
    const d = portales.donde.get('Portales.79358')!;
    const peticion = {
      fecha: UN_MARTES,
      acceso: accesos(o.lon, o.lat),
      salida: accesos(d.lon, d.lat),
    };

    const sinLa44: RedDeBus = {
      ...red,
      patrones: red.patrones.filter((p) => lineaDelViaje(red, p).corto !== '44'),
    };
    const dos = buscarViaje({ ...peticion, red: sinLa44 })!;
    assert.equal(dos.vehiculos, 2, 'gana la ronda 2');

    // Y la ronda 1 LLEGÁBAMOS: con solo la 29 hay viaje de un vehículo.
    const soloLa29: RedDeBus = {
      ...red,
      patrones: red.patrones.filter((p) => lineaDelViaje(red, p).corto === '29'),
    };
    const uno = buscarViaje({ ...peticion, red: soloLa29 })!;
    assert.ok(uno, 'la ronda 1 llegaba: hay viaje de un solo vehículo');
    assert.equal(uno.vehiculos, 1);
    assert.equal(uno.salidaAndando.metros, 846, 'pero deja 846 m de paseo final');

    assert.ok(
      pesoDelViaje(dos) < pesoDelViaje(uno),
      `el de dos tiene que pesar menos: ${Math.round(pesoDelViaje(dos))} contra ${Math.round(pesoDelViaje(uno))}`,
    );
    // Y la razón, con la cifra: el paseo que se ahorra pesa más que el billete.
    assert.ok(
      pesoDeAndar(uno.salidaAndando.metros) - pesoDeAndar(dos.salidaAndando.metros) > COSTE_DE_SUBIR,
    );
  });

  /**
   * ⭐ JUEZ 16 — **LA SUBIDA SE RECONSIDERA**, y el caso que lo pidió.
   *
   * [RAPTOR, la regla de «coger un vehículo anterior», traducida a costes] al
   * recorrer un patrón hay que volver a preguntarse en cada parada si conviene
   * subir ahí. Con solo la 29 en la red —para que la elección sea dónde subir y
   * no en qué línea— el motor sube en el poste **de la puerta**:
   *
   * ```
   * PA00033 Av. Academia General Militar N.º 37 · 60 m · índice 10 del patrón
   * PA01203 Bernardo Ramazzini / Maz            · 478 m · índice 8   ← el que elegía antes
   * ```
   *
   * Los dos están en el conjunto de acceso y en el MISMO patrón, así que el 33
   * no gana por estar solo: gana por costar menos.
   */
  test('⭐ 16 · se sube en el poste de la puerta, no en el primero del patrón', () => {
    const o = portales.donde.get('Portales.93310')!;
    const d = portales.donde.get('Portales.79358')!;
    const soloLa29: RedDeBus = {
      ...red,
      patrones: red.patrones.filter((p) => lineaDelViaje(red, p).corto === '29'),
    };
    const viaje = buscarViaje({
      red: soloLa29,
      fecha: UN_MARTES,
      acceso: accesos(o.lon, o.lat),
      salida: accesos(d.lon, d.lat),
    })!;
    assert.ok(viaje);

    const porId = new Map(red.paradas.map((p) => [p.id, p]));
    const m = viaje.montados[0]!;
    assert.equal(porId.get(m.desde)!.codigo, 'PA00033');
    assert.equal(viaje.accesoAndando.metros, 60);
    assert.equal(m.iDesde, 10, 'el índice 10, no el 8');

    // ⭐ Y RAMAZZINI SIGUE SIENDO ACCESO POSIBLE, dos índices antes: si no
    // estuviera, esta juez ganaría por ausencia y no probaría nada.
    const ramazzini = accesos(o.lon, o.lat).find(
      (a) => porId.get(a.parada)!.codigo === 'PA01203',
    );
    assert.ok(ramazzini, 'Ramazzini tiene que seguir en el conjunto de acceso');
    assert.equal(ramazzini!.metros, 478);
    assert.equal(m.patron.paradas.indexOf(ramazzini!.parada), 8);
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
  /** Un viaje entero entre dos portales, sin preguntar a nadie. */
  const elViajeDe = (o: string, d: string) =>
    prepararViajeEnBus(
      motor,
      red,
      extremo(o, 'Origen'),
      extremo(d, 'Destino'),
      UN_MARTES,
    ).trayecto();

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

    const viva = await preguntarPorLaPrimeraSubida(
      red,
      viaje.montados,
      respondiendo(MEDIDO_POSTE_1000),
    );
    assert.equal(viva.clase, 'llega');
    assert.equal((viva as { minutos: number }).minutos, 5, 'el primero de los dos coches');

    // ⚠️ El RELOJ usa `espera` (H/2 = 268 s) y el TEXTO usa `intervalo` (H =
    // 536 s = cada 9 min). Son dos preguntas distintas y por eso van aparte.
    const como = { espera: 268, intervalo: 536 };
    const estimada = etapaMontada(red, viaje.montados[0]!, como);
    const conViva = etapaMontada(red, viaje.montados[0]!, { ...como, vivo: viva });
    assert.equal(estimada.segundos, 698, 'la etapa con la espera estimada');
    assert.equal(conViva.segundos, 730, 'los 5 min vivos tienen que entrar en el total');

    assert.match(estimada.pasos[0]!.texto, /frecuencia teórica: cada 9 min$/);

    // ⭐ EL MINUTO VIVO **YA NO ESTÁ EN LA FRASE DEL PASO** (2/09). Está en la
    // región del botón «Próximo bus», que es donde se puede refrescar — y el
    // paso se queda con lo que no caduca: cada cuánto pasa la línea.
    assert.match(conViva.pasos[0]!.texto, /frecuencia teórica: cada 9 min$/, 'la frase, sin minuto');
    assert.doesNotMatch(conViva.pasos[0]!.texto, /próximo en/, 'y sin el minuto DOS veces');
    assert.match(
      conViva.pasos[0]!.vivo!.texto,
      /^próximo en 5 min \(dato de las \d\d:\d\d\)$/,
      'el minuto viaja en `vivo`, que es lo que llena la región',
    );

    // ⚠️ Y el RELOJ sí lo sigue usando: lo que se quitó fue la repetición del
    //    texto, no el dato. Son los 730 s de arriba contra los 698 estimados.
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
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra que un aviso APAREZCA y que la ruta siga saliendo. Ni el texto del aviso
 * ni la existencia de ruta dependen de por dónde pase hoy el autobús.
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
    assert.match(
      sube.texto,
      /frecuencia teórica: cada \d+ min$/,
      'sin dato vivo se dice la frecuencia, que es el lenguaje del servicio',
    );
  });

  /**
   * ⭐ JUEZ 12 — SI LA API CALLA, D-G: la ruta sale y no se promete nada.
   *
   * Es el plan firmado el 28/08 para el BiZi, con las mismas palabras —
   * «disponibilidad no verificada»— porque es la misma condición: se ha
   * preguntado y no se sabe. **Y no es lo mismo que la juez 11**: allí la
   * fuente contestó y dijo que no venía nadie; aquí no contestó.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra la conducta ante un mudo. El desvío no cambia quién calla.
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
   * ⭐ JUEZ 32 — EL MOTOR DICE **A QUIÉN PREGUNTAR**, y en tranvía a nadie.
   *
   * El botón «Próximo bus» necesita dos datos —el número de poste de Avanza y
   * la línea— y **los manda el motor**, no los saca la pantalla leyendo la
   * frase. La frase dice «en el poste 33 · Av. Academia General Militar N.º 37»
   * y sacar el 33 de ahí ataría la interfaz a un formato que el motor puede
   * cambiar mañana. Ver `aQuienPreguntar` en el contrato.
   *
   * ⚠️ **Y el tranvía no lo lleva**, que es lo que hace que el botón no exista
   *    ahí. Su `stop_code` es `1312` y no un `PAnnnnn`: Avanza no cubre esos
   *    postes, así que no es que no lo sepamos — es que no hay a quién
   *    preguntar. Un botón que al pulsarlo solo pudiera decir «no lo sé» es
   *    peor que no tenerlo: promete un dato que no existe.
   *
   * El caso del tranvía **se busca en la red**, no se escribe a mano: lo que se
   * compra es que ningún montado de tranvía lleve a quién preguntar, no que un
   * poste concreto no lo lleve.
   */
  test('⭐ 32 · el bus dice a quién preguntar; el tranvía no lleva a nadie', () => {
    const montadoDe = (patron: (typeof red.patrones)[number]) => ({
      patron,
      desde: patron.paradas[0]!,
      hasta: patron.paradas[1]!,
      iDesde: 0,
      iHasta: 1,
      espera: 300,
      rodando: 120,
    });
    const porId = new Map(red.paradas.map((x) => [x.id, x]));

    // 1 · UN BUS: lleva el número del poste y su línea.
    const deBus = red.patrones.find(
      (x) => x.modo === 'bus' && /^PA\d+$/.test(porId.get(x.paradas[0]!)?.codigo ?? ''),
    )!;
    const sube = etapaMontada(red, montadoDe(deBus), { espera: 300, intervalo: 600 }).pasos[0]!;
    assert.equal(sube.giro, 'sube');
    const suPoste = numeroDePoste(porId.get(deBus.paradas[0]!)!.codigo);
    assert.deepEqual(
      sube.aQuienPreguntar,
      { poste: Number(suPoste), linea: lineaDelViaje(red, deBus).corto },
      'el bus manda el poste de Avanza y su línea',
    );

    // 2 · EL TRANVÍA: ninguno de los suyos lleva a quién preguntar.
    const deTranvia = red.patrones.filter((x) => x.modo === 'tram');
    assert.ok(deTranvia.length > 0, 'la red tiene que traer tranvía para que esto valga');
    for (const patron of deTranvia) {
      const paso = etapaMontada(red, montadoDe(patron), { espera: 300, intervalo: 600 }).pasos[0]!;
      assert.equal(
        paso.aQuienPreguntar,
        undefined,
        `el tranvía ${lineaDelViaje(red, patron).corto} no tiene fuente a la que preguntar, ` +
          `y su poste es ${porId.get(patron.paradas[0]!)?.codigo}`,
      );
    }
  });

  /**
   * ⭐ JUEZ 27 — EL GENERAR PREGUNTA **SOLO POR EL PRIMER POSTE**.
   *
   * Es la regla de casa desde la 3b, dicha entera: **el dato vivo sustituye la
   * espera del PRIMER vehículo**, y ya solo del primero. «Próximo en 3 min» en
   * un poste al que se llega dentro de cuarenta minutos es un número cierto
   * sobre un autobús que no se va a coger, así que los siguientes se dicen con
   * la frecuencia teórica — eso ya era así.
   *
   * ⚠️ **Lo que cambia hoy es que tampoco se les pregunta.** Consultar el
   * segundo poste solo servía para fabricar un aviso de algo que nunca se iba a
   * decir: la línea 30 «no anuncia ningún próximo» en un poste al que faltan
   * cuarenta minutos no es una noticia, es ruido, y encima cuesta otra visita a
   * Avanza —hasta 8,4 s medidos— dentro del Generar. Lo que quiera saberse de
   * ese poste se pide **a petición**, con su botón. Ver `/api/poste-vivo`.
   *
   * Y son DOS compras en una: **una sola visita** y **cero avisos** del
   * segundo. La primera sin la segunda dejaría pasar una caché que respondiera
   * sin red; la segunda sin la primera, una consulta que se hiciera y se tirara.
   *
   * ⚠️ **ESTA JUEZ JUBILA A LA 23**, que compraba lo contrario: *«dos postes
   *    distintos preguntan a la vez; el total es el mayor, no la suma»*. Era
   *    cierta y era necesaria mientras el Generar preguntaba a todos —evitaba
   *    dos esperas de 8,4 s encadenadas—, y hoy no tiene sujeto: ya no hay dos
   *    postes que preguntar. **No se ha debilitado: se ha quedado sin caso**, y
   *    lo que la sustituye compra lo contrario por la misma razón de fondo (el
   *    límite de 10 s de [NN/g]) — antes en paralelo, ahora no preguntando.
   *    Su otra mitad, la deduplicación en vuelo, sigue viva en la juez 13.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: cuenta VISITAS a la fuente. El número de consultas es el mismo se pase por
 * donde se pase.
 */
  test('⭐ 27 · el Generar consulta el primer poste y ninguno más', async () => {
    reiniciarVisitas();
    let pedidas = 0;
    const contando: typeof fetch = (async () => {
      pedidas++;
      return new Response(MEDIDO_POSTE_1203, { status: 200 });
    }) as unknown as typeof fetch;

    const eo = extremo('Portales.93310', 'Origen');
    const ed = extremo('Portales.98006', 'Destino');
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: postesCerca(red, andar, eo.lon, eo.lat),
      salida: postesCerca(red, andar, ed.lon, ed.lat),
    })!;
    assert.equal(viaje.vehiculos, 2, 'el caso tiene que ser de dos subidas');
    const primera = lineaDelViaje(red, viaje.montados[0]!.patron).corto;
    const segunda = lineaDelViaje(red, viaje.montados[1]!.patron).corto;
    assert.notEqual(primera, segunda, 'y de dos lineas distintas, para poder distinguirlas');

    const t = await prepararViajeEnBus(motor, red, eo, ed, UN_MARTES).conElVivo!(contando);

    assert.equal(visitasHechas(), 1, `se visitaron ${visitasHechas()} postes; solo toca el primero`);
    assert.equal(pedidas, 1, `se pidieron ${pedidas} respuestas a Avanza; solo toca una`);

    // Y el aviso que sale es el del PRIMERO, no el del segundo.
    const delVivo = t.avisos.filter((a) => /Avanza no anuncia|No hemos podido preguntar/.test(a.texto));
    assert.equal(delVivo.length, 1, `avisos de lo vivo: ${JSON.stringify(delVivo)}`);
    assert.match(delVivo[0]!.texto, new RegExp(`de la l\u00ednea ${primera} `));
    assert.ok(
      !delVivo.some((a) => new RegExp(`de la l\u00ednea ${segunda} `).test(a.texto)),
      `la segunda subida no se consulta, asi que no puede tener aviso de lo vivo`,
    );
  });

  /**
   * ⭐ JUEZ 13 — DOS PREGUNTAS A LA VEZ POR EL MISMO POSTE, **UNA** consulta.
   *
   * El single-flight de `avanza.ts` deduplica lo que está **en vuelo**: dos
   * peticiones simultáneas por el poste 1000 comparten una sola visita.
   *
   * ⚠️ **Antes esto se compraba a través de `preguntarPorLasSubidas`**, con dos
   *    subidas al mismo poste dentro de un Generar. Desde el 1/09 el Generar
   *    pregunta por uno solo (juez 27), así que ese camino ya no existe — pero
   *    el que sí existe es **dos pulsaciones a la vez del botón «Próximo bus»**,
   *    o dos pestañas del navegador, que llegan a `llegadasDelPoste` por
   *    `/api/poste-vivo`. La compra es la misma y ahora se hace donde ocurre.
   */
  test('⭐ 13 · dos preguntas simultáneas por el mismo poste hacen UNA sola visita', async () => {
    reiniciarVisitas();
    const responde = respondiendo(MEDIDO_POSTE_1000);
    const [a, b] = await Promise.all([
      llegadasDelPoste(1000, responde),
      llegadasDelPoste(1000, responde),
    ]);
    assert.ok(a && b, 'las dos preguntas tienen su respuesta');
    assert.equal(a, b, 'y es LA MISMA lectura: es lo que significa estar en vuelo');
    assert.equal(visitasHechas(), 1, `dos preguntas a la vez hicieron ${visitasHechas()} visitas`);
  });

  /**
   * ⭐ JUEZ 24 — CADA POSTE NOMBRADO LLEVA SU NÚMERO.
   *
   * [Referencia GTFS, `stop_code`] es *«un texto corto o número que identifica
   * la parada para los viajeros»*, el de **la señal y los sistemas de
   * información**. En la calle, lo que hay escrito grande en la marquesina es
   * ese número: decir «el poste Av. Academia General Militar N.º 37» y callarse
   * el 33 es dar la mitad de la seña justo en el momento de buscarla.
   *
   * ⚠️ Y va en TODOS los sitios donde se nombra un poste, no solo en la subida:
   * si el número apareciera unas veces sí y otras no, quien lo busca no sabría
   * si es que no existe o es que no se lo han dicho.
   */
  test('⭐ 24 · sube, transborda y baja nombran el poste con su número', () => {
    const t = elViajeDe('Portales.93310', 'Portales.98006');

    const sube = t.pasos.find((p) => p.giro === 'sube')!;
    assert.match(sube.texto, /en el poste 33 · Av\. Academia General Militar N\.º 37/);

    const transborda = t.pasos.find((p) => p.giro === 'transborda')!;
    assert.match(transborda.texto, /^En el poste \d+ · Plaza De Ariño, transborda/);

    const baja = t.pasos.find((p) => p.giro === 'baja')!;
    assert.match(baja.texto, /^Baja en el poste \d+ · /);

    // ⭐ Y NINGUNO se queda sin número: se busca el patrón en todos.
    for (const p of t.pasos.filter((x) => ['sube', 'baja', 'transborda'].includes(x.giro))) {
      assert.match(p.texto, /poste \d+ · /, `este paso nombra un poste sin número: ${p.texto}`);
    }
  });

  /**
   * ⭐ JUEZ 25 — EL BUS LLEVA EL NÚMERO DE AVANZA; EL TRANVÍA, EL SUYO.
   *
   * ⚠️ Son dos formas porque el feed trae dos, y **no se uniforman**: `PA00033`
   * es el identificador de Avanza y en el cartel pone `33`; las 50 paradas de
   * tranvía no llevan ese prefijo porque no son de Avanza, y ponerles uno sería
   * inventar un identificador que no está en ninguna señal.
   *
   * Medido sobre el cocinado: **934 de 984** con `PAnnnnn` —la misma cuenta que
   * ZetaBus— y 50 con código numérico a secas.
   */
  test('⭐ 25 · PA00033 se enseña como 33; el código del tranvía, tal cual', () => {
    assert.equal(numeroDePoste('PA00033'), '33');
    assert.equal(numeroDePoste('PA00719'), '719');
    assert.equal(numeroDePoste('1312'), '1312');
    assert.equal(numeroDePoste('0101'), '0101', 'el del tranvía no se recorta');
    // Y lo que no es ninguna de las dos cosas no se inventa.
    assert.equal(numeroDePoste('ABC'), null);
    assert.equal(numeroDePoste(''), null);

    assert.equal(nombrarPoste('PA00033', 'Av. Academia General Militar N.º 37'), '33 · Av. Academia General Militar N.º 37');
    assert.equal(nombrarPoste('1312', 'Plaza Aragón'), '1312 · Plaza Aragón');
    // Sin número, solo el nombre: nada de un hueco donde iría algo.
    assert.equal(nombrarPoste('ABC', 'Un Sitio'), 'Un Sitio');

    // ⭐ Y las 984 del feed: las que tienen número lo tienen bien.
    const conNumero = red.paradas.filter((p) => numeroDePoste(p.codigo) !== null);
    assert.equal(conNumero.length, red.paradas.length, 'toda parada del feed tiene número que enseñar');
    const deAvanza = red.paradas.filter((p) => p.codigo.startsWith('PA'));
    assert.equal(deAvanza.length, 934);
    assert.equal(red.paradas.length - deAvanza.length, 50, 'las del tranvía');
  });

  /**
   * ⭐ JUEZ 26 — LOS AVISOS DEL VIVO TAMBIÉN NOMBRAN EL POSTE CON SU NÚMERO.
   *
   * Es el mismo poste del que habla el hito, y la regla del doble sitio [GOV.UK]
   * exige que digan lo mismo: si el paso dice «poste 33 · Av. Academia» y el
   * aviso dice solo «Av. Academia», quien los lee no puede casarlos de un vistazo.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra que dos textos coincidan ENTRE SÍ. La coherencia se sostiene sobre
 * cualquier red mientras sea la misma en los dos lados.
 */
  test('⭐ 26 · el aviso del vivo nombra el poste igual que el hito', async () => {
    reiniciarVisitas();
    const { origen, destino } = elOjo();
    const conVivo = await prepararViajeEnBus(motor, red, origen, destino, UN_MARTES).conElVivo!(
      respondiendo(MEDIDO_POSTE_1203),
    );
    for (const a of conVivo.avisos.filter((x) => /el poste/.test(x.texto))) {
      assert.match(a.texto, /poste \d+ · /, `este aviso nombra un poste sin número: ${a.texto}`);
    }
  });

  /**
   * ⭐ JUEZ 21 — CUÁNTAS PARADAS SE VA DENTRO DE CADA VEHÍCULO.
   *
   * [Google Directions API, `transit_details.num_stops`] *«el número de paradas
   * de este paso; incluye la de llegada, pero no la de salida»*, y su ejemplo
   * literal: si se sale de A, se pasa por B y C y se llega a D, **son 3**.
   *
   * ⚠️ Y `num_stops` es propiedad **del paso de transporte**, no del viaje: cada
   * vehículo lleva la cuenta del suyo. Nuestro `sube` y nuestro `transborda`
   * arrancan cada uno un paso de transporte, así que cada uno dice **sus**
   * paradas — la del `transborda` es la del vehículo que se COGE, igual que su
   * frecuencia.
   *
   * `COLOSO 2 → OVIEDO 5` va en **35 + 39**. Aquí la convención se compra
   * contando los nombres del recorrido de hoy, que es el ejemplo de Google con
   * paradas de verdad: la 35 recorre **13** postes de `Av. Academia General
   * Militar N.º 37` a `Plaza De Ariño`, y se dicen **12**.
   */
  test('⭐ 21 · cada vehículo dice sus paradas, sin la de salida y con la de llegada', () => {
    const eo = extremo('Portales.93310', 'Origen');
    const ed = extremo('Portales.98006', 'Destino');
    const viaje = buscarViaje({
      red,
      fecha: UN_MARTES,
      acceso: postesCerca(red, andar, eo.lon, eo.lat),
      salida: postesCerca(red, andar, ed.lon, ed.lat),
    })!;
    assert.equal(viaje.montados.length, 2);

    // ⭐ LA COMPRA DE LA CONVENCIÓN: A → B → C → D son 3, contando nombres.
    const recorridos = viaje.montados.map((m) =>
      m.patron.paradas.slice(m.iDesde, m.iHasta + 1),
    );
    assert.equal(recorridos[0]!.length, 13, 'los postes por los que pasa la 35, incluido el de subir');
    assert.equal(recorridos[1]!.length, 17);

    const t = elViajeDe('Portales.93310', 'Portales.98006');
    const sube = t.pasos.find((x) => x.giro === 'sube')!;
    const transborda = t.pasos.find((x) => x.giro === 'transborda')!;
    assert.equal(
      sube.texto,
      'Sube a la línea 35 en el poste 33 · Av. Academia General Militar N.º 37 ' +
        '— 12 paradas — frecuencia teórica: cada 8 min',
    );
    assert.equal(
      transborda.texto,
      'En el poste 432 · Plaza De Ariño, transborda de la línea 35 a la línea 39 ' +
        '— 16 paradas — frecuencia teórica de la 39: cada 6 min',
    );
    // Y son las de cada uno: `recorrido − 1`, no las del viaje entero.
    assert.equal(12, recorridos[0]!.length - 1);
    assert.equal(16, recorridos[1]!.length - 1);

    // ⚠️ La cuenta va en el texto, y **no toca el reloj**: el total sigue igual.
    assert.equal(t.segundos, 3184);
  });

  /**
   * ⭐ JUEZ 22 — UNA PARADA SE DICE EN SINGULAR, y cero no se dice.
   *
   * Se monta a mano porque la red no da hoy un salto de un solo poste entre dos
   * portales, y la regla se compra igual: el texto lo escribe `pasoDeSubir`.
   */
  test('⭐ 22 · una parada va en singular; ninguna, no se nombra', () => {
    const linea = { id: 'X', corto: '99', largo: 'Prueba', color: '000000', colorTexto: 'FFFFFF', modo: 'bus' as const };
    assert.match(pasoDeSubir(linea, 'Un Poste', 1, 600).texto, /— 1 parada — frecuencia/);
    assert.match(pasoDeSubir(linea, 'Un Poste', 2, 600).texto, /— 2 paradas — frecuencia/);
    assert.equal(
      pasoDeSubir(linea, 'Un Poste', 0, 600).texto,
      'Sube a la línea 99 en el poste Un Poste — frecuencia teórica: cada 10 min',
    );
  });

  /**
   * ⭐ JUEZ 17 — EL TRANSBORDO EN EL MISMO POSTE ES **UN SOLO PASO**.
   *
   * `COLOSO 2 → OVIEDO 5` sale en **35 + 39** y las dos se cogen en `Plaza De
   * Ariño`. Hasta el 31/08 eso se narraba en **tres** pasos —«Baja», «es el
   * mismo portal del que sales», «Sube»— y un tramo a pie de **cero metros**.
   *
   * [Referencia GTFS, `transfers.txt`] el transbordo es un elemento de primera
   * clase entre dos rutas en una parada, y en la misma parada `from_stop_id =
   * to_stop_id`. Es un acto, y se cuenta como un acto.
   */
  test('⭐ 17 · cambiar de bus sin moverse es un paso, no tres', () => {
    const t = elViajeDe('Portales.93310', 'Portales.98006');

    const transbordos = t.pasos.filter((p) => p.giro === 'transborda');
    assert.equal(transbordos.length, 1, 'un transbordo, un paso');
    assert.equal(
      transbordos[0]!.texto,
      'En el poste 432 · Plaza De Ariño, transborda de la línea 35 a la línea 39 ' +
        '— 16 paradas — frecuencia teórica de la 39: cada 6 min',
    );
    // ⭐ Y los dos chips: las dos líneas van como partes `via`, en orden.
    assert.deepEqual(
      transbordos[0]!.partes.filter((x) => x.papel === 'via').map((x) => x.texto),
      ['432 · Plaza De Ariño', '35', '39'],
    );

    // Y los tres pasos viejos ya no están.
    assert.equal(t.pasos.filter((p) => p.giro === 'baja').length, 1, 'solo se baja al final');
    assert.equal(
      t.pasos.some((p) => p.texto.includes('es el mismo portal del que sales')),
      false,
    );
    assert.equal(t.pasos.length, 11, 'trece pasos eran antes del pulido');

    // Y el tramo a pie de cero metros tampoco: cuatro tramos, no cinco.
    assert.equal(t.tramos.length, 4);
    assert.equal(t.tramos.filter((x) => x.metros === 0).length, 0, 'ni un tramo de 0 m');
    // El icono del poste del cambio es el de subirse al siguiente.
    assert.equal(t.tramos[1]!.hito, 'sube');
  });

  /**
   * ⭐ JUEZ 18 — CON PASEO, LOS TRES PASOS SE QUEDAN.
   *
   * `ALDEBARÁN 56 → CARDENAL DE BARDAJÍ 24` cambia de la 36 a la 21 cruzando la
   * Avenida de Madrid: **163 m**. Ahí sí se baja, se anda y se sube, y son tres
   * cosas distintas que hay que hacer. El pulido de arriba **no las toca**.
   */
  test('⭐ 18 · un transbordo con paseo conserva bajar, andar y subir', () => {
    const t = elViajeDe('Portales.91655', 'Portales.107146');

    assert.equal(t.pasos.filter((p) => p.giro === 'transborda').length, 0, 'aquí hay que andar');
    assert.equal(t.pasos.filter((p) => p.giro === 'sube').length, 2);
    assert.equal(t.pasos.filter((p) => p.giro === 'baja').length, 2);
    // El paseo del transbordo sigue siendo su tramo, con sus metros.
    assert.equal(t.tramos.length, 5);
    assert.equal(t.tramos[2]!.comoSeVa, 'andando');
    assert.ok(t.tramos[2]!.metros > 100, `el paseo del transbordo: ${t.tramos[2]!.metros} m`);
  });

  /**
   * ⭐ JUEZ 19 — LA FRECUENCIA ES EL LENGUAJE DEL SERVICIO.
   *
   * [Google Transit Partners] los servicios de frecuencia se describen por su
   * cabecera —«pasan cada 5-15 minutos»—, no por una espera concreta. Así que
   * las subidas dicen **cada N min**, y solo el dato vivo, cuando lo hay,
   * sustituye eso por un minuto concreto.
   *
   * ⚠️ **Y el reloj no cambia**: el total sigue sumando `E[W] = H/2`. Decir
   * «cada 8 min» y sumar 4 no es contradictorio — son dos preguntas distintas.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra la forma de una frase, no el itinerario que la lleva.
 */
  test('⭐ 19 · las subidas dicen la frecuencia; solo el vivo dice un minuto', async () => {
    const t = elViajeDe('Portales.93310', 'Portales.98006');
    const sube = t.pasos.find((p) => p.giro === 'sube')!;
    assert.match(sube.texto, /frecuencia teórica: cada 8 min$/, 'la primera, sin vivo');
    const transborda = t.pasos.find((p) => p.giro === 'transborda')!;
    assert.match(transborda.texto, /frecuencia teórica de la 39: cada 6 min$/, 'y la segunda');
    assert.equal(t.pasos.some((p) => p.texto.includes('min de espera')), false);

    // Y con dato vivo, la PRIMERA dice el minuto concreto.
    reiniciarVisitas();
    const { origen, destino } = elOjo();
    const conVivo = await prepararViajeEnBus(motor, red, origen, destino, UN_MARTES).conElVivo!(
      respondiendo(MEDIDO_POSTE_1000),
    );
    const primera = conVivo.pasos.find((p) => p.giro === 'sube' || p.giro === 'transborda')!;
    // ⭐ Desde el 2/09 la frase dice SIEMPRE la frecuencia, tenga dato vivo o
    //    no: el minuto vive en `vivo`, que es lo que la región enseña.
    assert.match(primera.texto, /frecuencia teórica/);
    assert.doesNotMatch(primera.texto, /próximo en/);
  });

  /**
   * ⭐ JUEZ 20 — EL RELOJ NO SE HA MOVIDO, al segundo.
   *
   * El pulido es de **narración**. Los 120 s del transbordo, que vivían en el
   * tramo a pie de cero metros, se han mudado dentro del vehículo siguiente; si
   * se hubieran perdido por el camino, estos dos números lo dirían.
   *
   * Medidos con el código de **antes** del pulido, y otra vez después:
   * `COLOSO 2 → OVIEDO 5` **3.184 s / 7.911 m**, y `ALDEBARÁN 56 → CARDENAL DE
   * BARDAJÍ 24` **1.724 s / 3.445 m**.
   */
  test('⭐ 20 · el total del viaje es el mismo que antes del pulido', () => {
    const conTransbordo = elViajeDe('Portales.93310', 'Portales.98006');
    assert.equal(conTransbordo.segundos, 3184);
    assert.equal(conTransbordo.metros, 7911);

    const conPaseo = elViajeDe('Portales.91655', 'Portales.107146');
    assert.equal(conPaseo.segundos, 1724);
    assert.equal(conPaseo.metros, 3445);

    // Y las sumas del contrato siguen cerrando en los dos.
    for (const t of [conTransbordo, conPaseo]) {
      assert.equal(t.tramos.reduce((n, x) => n + x.segundos, 0), t.segundos);
      assert.equal(t.tramos.reduce((n, x) => n + x.metros, 0), t.metros);
      t.tramos.forEach((x, i) => {
        if (i > 0) {
          assert.equal(x.desde, t.tramos[i - 1]!.hasta, `el tramo ${i} no cose con el anterior`);
        }
      });
    }
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
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra que las sumas del contrato cuadren consigo mismas —metros, segundos,
 * pesos—. Cuadran sobre cualquier red.
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

  /**
   * ℹ️ **La red pelada le vale** [REGLA DE CASA]: cuenta VISITAS a la fuente,
   * como la 27. Dos pulsaciones son dos consultas se pase por donde se pase.
   */
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

/** Un domingo de septiembre: los búhos operan y las siete suplidas no. */
const UN_DOMINGO = '20260913';
/** El lunes siguiente. Los búhos no operan; la red de día, entera. */
const EL_LUNES = '20260914';
/** Las 13:00 y la 01:30, en segundos del día de servicio. */
const MEDIODIA = 13 * 3600;
const LA_MADRUGADA = 90 * 60;


/**
 * ⭐ EL RECORRIDO REAL DE HOY de las cuatro líneas que el caso del Coloso toca,
 * copiado **entero** de lo que `admin-ajax.php?action=get_stops_list` contestó
 * el 6/09/2026 [la ley de la entrada nº32: ni un byte compuesto].
 *
 * ⚠️ **Son cuatro líneas, no las cincuenta y nueve, y eso se declara.** El
 *    barrido completo de ese día dio 23 sentidos desviados; se ha medido que el
 *    ganador de este caso es **el mismo** con los 23 veredictos que con estos
 *    ocho —`29+Ci1+53 · 77,4 min` las dos veces—, así que las demás líneas se
 *    quedan sin veredicto y con su patrón del feed. Eso **no es una licencia de
 *    la prueba**: es exactamente lo que hace producción con una línea que el
 *    refresco todavía no ha leído —*no saber no es no haberlo*—.
 *
 * ⚠️ Y `get_stops_list` **no acepta fecha**: contesta el recorrido de HOY. Este
 *    fixture es, por tanto, «la calle del 6/09» aplicada al domingo de las
 *    jueces. Es un *fixture*, no una predicción.
 */
const RECORRIDOS_DE_HOY: Readonly<Record<string, readonly { readonly poste: number; readonly nombre: string }[]>> = {
  '29|0': [
    { poste: 284, nombre: "Camino de Las Torres n.º 10" },
    { poste: 889, nombre: "Concepción / Miguel Servet" },
    { poste: 744, nombre: "Plaza San Miguel" },
    { poste: 340, nombre: "Coso n.º 188" },
    { poste: 1246, nombre: "P. Echegaray y Caballero / Puente de Piedra" },
    { poste: 1247, nombre: "Pso. Echegaray y Caballero / Puente de Santiago" },
    { poste: 126, nombre: "Av. de Los Pirineos / Tv Aragón" },
    { poste: 816, nombre: "Valle de Broto / Parque del Tío Jorge" },
    { poste: 217, nombre: "Av. Salvador Allende / Bomberos" },
    { poste: 3010, nombre: "Av. Salvador Allende / Juslibol" },
    { poste: 218, nombre: "Av. Salvador Allende / del Somport" },
    { poste: 213, nombre: "Av. Salvador Allende Fte. n.º 85" },
    { poste: 214, nombre: "Av. Salvador Allende / San Juan de La Peña" },
    { poste: 28, nombre: "Av. Academia General Militar n.º 2" },
    { poste: 29, nombre: "Av. Academia General Militar n.º 14" },
    { poste: 31, nombre: "Av. Academia General Militar n.º 54" },
    { poste: 34, nombre: "Av. Academia General Militar / Maz" },
    { poste: 32, nombre: "Av. Academia General Militar / Cristo Rey" },
    { poste: 366, nombre: "Autovía de Huesca / Pasarela" },
    { poste: 527, nombre: "Jesús Y María n.º 15" },
    { poste: 346, nombre: "Cristo Rey n.º 23" },
    { poste: 347, nombre: "Cristo Rey n.º 77" },
    { poste: 219, nombre: "Hospital Royo Villanova" },
  ],
  '29|1': [
    { poste: 219, nombre: "Hospital Royo Villanova" },
    { poste: 529, nombre: "Jesús Y María n.º 89" },
    { poste: 528, nombre: "Jesús Y María n.º 61" },
    { poste: 346, nombre: "Cristo Rey n.º 23" },
    { poste: 347, nombre: "Cristo Rey n.º 77" },
    { poste: 883, nombre: "Camino de Los Molinos n.º 150" },
    { poste: 898, nombre: "Camino de Los Molinos n.º 165" },
    { poste: 365, nombre: "Bernardo Ramazzini n.º 5" },
    { poste: 1203, nombre: "Bernardo Ramazzini / Maz" },
    { poste: 36, nombre: "Av. Academia General Militar / Maz (Dir. Centro)" },
    { poste: 33, nombre: "Av. Academia General Militar n.º 37" },
    { poste: 3508, nombre: "Av. Academia General Militar n.º 7" },
    { poste: 216, nombre: "Av. Salvador Allende n.º 107" },
    { poste: 215, nombre: "Av. Salvador Allende n.º 85" },
    { poste: 212, nombre: "Av. Salvador Allende n.º 67" },
    { poste: 3012, nombre: "Av. Salvador Allende n.º 33" },
    { poste: 210, nombre: "Av. Salvador Allende n.º 5" },
    { poste: 811, nombre: "Valle de Broto n.º 18 / Av. Salvador Allende" },
    { poste: 131, nombre: "Av. de Los Pirineos / Valle Broto" },
    { poste: 124, nombre: "Av. de Los Pirineos / Colegio" },
    { poste: 659, nombre: "P. Echegaray Y Caballero / Plaza del Pilar" },
    { poste: 654, nombre: "P. Echegaray y Caballero n.º 112" },
    { poste: 1285, nombre: "Asalto / Centro de Historias" },
    { poste: 585, nombre: "Miguel Servet n.º 28" },
    { poste: 284, nombre: "Camino de Las Torres n.º 10" },
  ],
  '38|0': [
    { poste: 8000, nombre: "Instalaciones Az" },
    { poste: 599, nombre: "Miguel Servet n.º 199" },
    { poste: 3018, nombre: "Av. Cesáreo Alierta / 3Er Cinturón" },
    { poste: 605, nombre: "Miguel Servet n.º 147" },
    { poste: 594, nombre: "Miguel Servet n.º 123 / Padre Chaminade" },
    { poste: 591, nombre: "Miguel Servet / Francisco Quevedo" },
    { poste: 589, nombre: "Miguel Servet n.º 71 / Minas" },
    { poste: 587, nombre: "Miguel Servet n.º 57" },
    { poste: 586, nombre: "Miguel Servet n.º 37" },
    { poste: 584, nombre: "Miguel Servet n.º 13" },
    { poste: 1248, nombre: "P. de La Mina n.º 15" },
    { poste: 634, nombre: "P. de La Constitución n.º 33 / Plaza de Los Sitios" },
    { poste: 632, nombre: "P. de La Constitución n.º 11 / Plaza Aragón" },
    { poste: 669, nombre: "P. Pamplona n.º 4 / Plaza Paraiso" },
    { poste: 505, nombre: "Hernán Cortés n.º 6" },
    { poste: 698, nombre: "P. de Teruel n.º 24" },
    { poste: 795, nombre: "Santander n.º 34" },
    { poste: 435, nombre: "Duquesa Villahermosa n.º 10" },
    { poste: 442, nombre: "Duquesa Villahermosa n.º 109 / Vía Univérsitas" },
    { poste: 3049, nombre: "Duquesa Villahermosa / Parque de Delicias" },
    { poste: 440, nombre: "Duquesa Villahermosa / Alferez Rojas" },
    { poste: 821, nombre: "Vía Hispanidad / Duquesa Villahermosa" },
    { poste: 823, nombre: "Vía Hispanidad n.º 73 / Nuestra Señora de Los Ángeles" },
    { poste: 1165, nombre: "Nuestra Señora de Los Ángeles n.º 20" },
    { poste: 103, nombre: "Ciudad Escolar Pignatelli" },
    { poste: 1315, nombre: "Biel / Dalia" },
    { poste: 1316, nombre: "Hortensia / Biel" },
    { poste: 1317, nombre: "Hortensia" },
    { poste: 748, nombre: "Francisca Millán Serrano / M.A Blanco" },
    { poste: 3537, nombre: "Aldebarán n.º 60" },
    { poste: 627, nombre: "Las Pleyades / Berenice" },
    { poste: 806, nombre: "Tulipán n.º 67" },
  ],
  '38|1': [
    { poste: 806, nombre: "Tulipán n.º 67" },
    { poste: 3539, nombre: "Vía Láctea / Torre Pajaritos" },
    { poste: 8, nombre: "Miguel Ángel Blanco n.º 53" },
    { poste: 260, nombre: "Av. Valdefierro n.º 43" },
    { poste: 261, nombre: "Av. Valdefierro n.º 27" },
    { poste: 258, nombre: "Av. Valdefierro n.º 1" },
    { poste: 1318, nombre: "Dalia / Biel" },
    { poste: 1319, nombre: "Jarque Moncayo / Escuela Pignatelli" },
    { poste: 1166, nombre: "Nuestra Señora de Los Ángeles n.º 7" },
    { poste: 604, nombre: "Nuestra Señora de Los Ángeles/ Vía Hispanidad" },
    { poste: 439, nombre: "Duquesa Villahermosa n.º 155" },
    { poste: 3052, nombre: "Duquesa Villahermosa n.º 129" },
    { poste: 443, nombre: "Duquesa Villahermosa / Centro Deportivo Municipal" },
    { poste: 437, nombre: "Duquesa Villahermosa n.º 97" },
    { poste: 551, nombre: "López de Luna n.º 13" },
    { poste: 236, nombre: "Av. San Juan Bosco n.º 7" },
    { poste: 329, nombre: "Corona de Aragón n.º 51" },
    { poste: 277, nombre: "Carmen n.º 19" },
    { poste: 507, nombre: "Hernán Cortés n.º 35" },
    { poste: 1079, nombre: "Hernán Cortés n.º 9" },
    { poste: 681, nombre: "P. Pamplona n.º 1 / Plaza Paraíso" },
    { poste: 1228, nombre: "P. de La Constitución / Patio de La Infanta" },
    { poste: 1258, nombre: "P. de La Mina / Centro de Mayores" },
    { poste: 585, nombre: "Miguel Servet n.º 28" },
    { poste: 588, nombre: "Miguel Servet n.º 60" },
    { poste: 590, nombre: "Miguel Servet n.º 86" },
    { poste: 593, nombre: "Miguel Servet n.º 122" },
    { poste: 602, nombre: "Miguel Servet / Belchite" },
    { poste: 3017, nombre: "Miguel Servet n.º 174" },
    { poste: 600, nombre: "Miguel Servet n.º 204" },
    { poste: 601, nombre: "Miguel Servet / 3Er Cinturón" },
    { poste: 1122, nombre: "Miguel Servet / Camino Enmedio" },
    { poste: 598, nombre: "Cochera Avanza" },
    { poste: 8000, nombre: "Instalaciones Az" },
  ],
  'Ci1|0': [
    { poste: 1143, nombre: "Camino de Las Torres n.º 4" },
    { poste: 284, nombre: "Camino de Las Torres n.º 10" },
    { poste: 3027, nombre: "Camino de Las Torres n.º 24" },
    { poste: 288, nombre: "Camino de Las Torres n.º 40" },
    { poste: 294, nombre: "Camino de Las Torres / Plaza Schweitzer" },
    { poste: 293, nombre: "Camino de Las Torres n.º 116" },
    { poste: 480, nombre: "Gascón de Gotor n.º 4" },
    { poste: 481, nombre: "Gascón de Gotor n.º 26" },
    { poste: 17, nombre: "Arzobispo Morcillo n.º 32" },
    { poste: 684, nombre: "P. Mariano Renovales n.º 10" },
    { poste: 558, nombre: "Luis Vives n.º 9" },
    { poste: 716, nombre: "P. Fernando El Católico n.º 70" },
    { poste: 863, nombre: "Violante de Hungría / Palacio de Deportes" },
    { poste: 864, nombre: "Violante de Hungría / Escuela de Idiomas" },
    { poste: 851, nombre: "Vía Univérsitas n.º 10" },
    { poste: 3053, nombre: "Vía Univérsitas n.º 44" },
    { poste: 856, nombre: "Vía Univérsitas / Av. de Madrid" },
    { poste: 3047, nombre: "Rioja n.º 22" },
    { poste: 191, nombre: "Av. de Navarra / C.M.E. Inocencio Jiménez" },
    { poste: 3073, nombre: "Estación Delicias / Acceso Llegadas" },
  ],
  'Ci1|1': [
    { poste: 3073, nombre: "Estación Delicias / Acceso Llegadas" },
    { poste: 1097, nombre: "Estación Delicias / Acceso Estación Autobuses" },
    { poste: 1031, nombre: "Estación Delicias / Acceso Salidas" },
    { poste: 1320, nombre: "Av. Expo 2008 / Etopía" },
    { poste: 1107, nombre: "Av. Expo 2008 / Supermercado" },
    { poste: 1160, nombre: "Av. de Ranillas / Puente Tercer Milenio" },
    { poste: 1128, nombre: "Av. de Ranillas / Palacio de Congresos" },
    { poste: 1108, nombre: "Av. de Ranillas / Parque Empresarial" },
    { poste: 1161, nombre: "Av. de Ranillas / Ciudad de La Justicia" },
    { poste: 3058, nombre: "Pablo Ruiz Picasso Fte. Policía" },
    { poste: 1213, nombre: "Pablo Ruiz Picasso / G.Gómez Avellaneda" },
    { poste: 3062, nombre: "G. Gómez Avellaneda n.º 47" },
    { poste: 3063, nombre: "G. Gómez Avellaneda / Rosalía de Castro" },
    { poste: 3064, nombre: "Valle de Broto / Kasán" },
    { poste: 816, nombre: "Valle de Broto / Parque del Tío Jorge" },
    { poste: 3501, nombre: "Valle de Broto n.º 9" },
    { poste: 3033, nombre: "Marqués de La Cadena / Chimenea" },
    { poste: 576, nombre: "Marqués de La Cadena n.º 57 / Plaza Mozart" },
    { poste: 3542, nombre: "Marqués de La Cadena / Av. de La Jota" },
    { poste: 3013, nombre: "Marqués de La Cadena / C.D.M. La Jota" },
    { poste: 1208, nombre: "Marqués de La Cadena / Puente de La Unión" },
    { poste: 1142, nombre: "Camino de Las Torres / CDM Alberto Maestro" },
    { poste: 1143, nombre: "Camino de Las Torres n.º 4" },
  ],
  '53|0': [
    { poste: 1000, nombre: "Plaza Emperador Carlos V / Intercambiador" },
    { poste: 863, nombre: "Violante de Hungría / Palacio de Deportes" },
    { poste: 325, nombre: "Condes de Aragón n.º 16" },
    { poste: 537, nombre: "Av. Juan Carlos I / Jardines de Taifá" },
    { poste: 134, nombre: "Av. Gómez Laguna n.º 20" },
    { poste: 137, nombre: "Av. Gómez Laguna n.º 48" },
    { poste: 3051, nombre: "Vía Hispanidad n.º 56" },
    { poste: 822, nombre: "Vía Hispanidad / Villa de Andorra" },
    { poste: 826, nombre: "Vía Hispanidad n.º 80" },
    { poste: 829, nombre: "Vía Hispanidad n.º 100 / Los Enlaces" },
    { poste: 6, nombre: "Alfred Nobel / Vía Hispanidad" },
    { poste: 4, nombre: "Alfred Nobel / Monasterio" },
    { poste: 2, nombre: "Agustín Príncipe n. º 2" },
    { poste: 625, nombre: "Pedro Porter n.º 5" },
    { poste: 525, nombre: "Jerónimo Cáncer n.º 24" },
    { poste: 765, nombre: "San Alberto Magno / C.S. Oliver" },
    { poste: 912, nombre: "Lagos de Coronas n.º 39" },
    { poste: 913, nombre: "Lagos de Coronas / Campo de Fútbol" },
    { poste: 914, nombre: "Lagos de Coronas / Ibón de Astún" },
    { poste: 893, nombre: "Camino del Pilón / Ibón de Armeña" },
    { poste: 297, nombre: "Camino del Pilón n.º 86 / Ibón de Plan" },
    { poste: 298, nombre: "Camino del Pilón n.º 122" },
    { poste: 1100, nombre: "Camino del Pilón n.º 141" },
    { poste: 300, nombre: "Camino del Pilón / Iglesia" },
  ],
  '53|1': [
    { poste: 300, nombre: "Camino del Pilón / Iglesia" },
    { poste: 299, nombre: "Camino del Pilón n.º 131" },
    { poste: 301, nombre: "Camino del Pilón / Ibón de Plan" },
    { poste: 894, nombre: "Camino del Pilón / Lagos de Coronas" },
    { poste: 3529, nombre: "Lagos de Coronas n.º 14 / Ibón de Astún" },
    { poste: 916, nombre: "Lagos de Coronas / La Camisera" },
    { poste: 3530, nombre: "Lagos de Coronas / Ibón de Escalar" },
    { poste: 1284, nombre: "Antonio Leyva / C.S Oliver" },
    { poste: 3532, nombre: "Antonio Leyva n.º 68 / Colegio" },
    { poste: 14, nombre: "Antonio Leyva n.º 33" },
    { poste: 3531, nombre: "Alfred Nobel n.º 5" },
    { poste: 827, nombre: "Vía Hispanidad n.º 83" },
    { poste: 825, nombre: "Vía Hispanidad n.º 77" },
    { poste: 824, nombre: "Vía Hispanidad n.º 73" },
    { poste: 3050, nombre: "Vía Hispanidad n.º 59" },
    { poste: 139, nombre: "Av. Gómez Laguna n.º 49" },
    { poste: 544, nombre: "Av. Juan Pablo II / Centro Comercial" },
    { poste: 543, nombre: "Av. Juan Pablo II n.º 60" },
    { poste: 623, nombre: "Pedro III / Asín Y Palacios" },
    { poste: 25, nombre: "Asín Y Palacios n.º 8" },
    { poste: 861, nombre: "Violante de Hungría n.º 5" },
    { poste: 1000, nombre: "Plaza Emperador Carlos V / Intercambiador" },
  ],
};

/**
 * La red operativa del día: la del feed con esos recorridos encima.
 *
 * Es lo que `refrescarYServir` compone en producción, con la misma función y el
 * mismo asfalto —por calzada, `rodarConElCoche`—. Ver la REGLA DE CASA arriba.
 */
function laOperativaDelDia(): RedConDesvios {
  const coche = cargarRedDeCoche();
  const veredictos = new Map<string, ReturnType<typeof compararRecorrido>>();
  for (const [clave, postes] of Object.entries(RECORRIDOS_DE_HOY)) {
    const [linea, direccion] = clave.split('|');
    const patron = red.patrones.find(
      (p) =>
        p.principal &&
        p.modo === 'bus' &&
        lineaDelViaje(red, p).corto === linea &&
        p.direccion === direccion,
    );
    if (!patron) {
      continue;
    }
    veredictos.set(clave, compararRecorrido(oficialDe(red, patron), postes));
  }
  return aplicarDesvios(
    red,
    (linea, direccion) => veredictos.get(`${linea}|${direccion}`) ?? null,
    new Map(),
    rodarConElCoche(coche),
    (traza, saliendo) => aristaDeLaTraza(coche, traza, saliendo),
  );
}

describe('⭐ LA VENTANA HORARIA DEL SERVICIO — el reloj que faltaba', () => {
  let operativa: RedConDesvios;
  before(() => {
    operativa = laOperativaDelDia();
  });

  /** El viaje del caso, montado sobre la red operativa y con sus avisos. */
  const viajeDelDia = (a: Extremo, b: Extremo, fecha: string, ahora: number | null = null) =>
    prepararViajeEnBus(motor, operativa.red, a, b, fecha, {
      suprimidas: operativa.suprimidas,
      avisos: operativa.desviadas.map((x) => ({
        linea: x.linea,
        direccion: x.direccion,
        texto: avisoDeDesvio(x),
      })),
    }, ahora).trayecto();
  /** El patrón principal de una línea, por su corto. */
  const patronDe = (corto: string, direccion = '0') =>
    red.patrones.find(
      (p) => p.principal && p.modo === 'bus' && lineaDelViaje(red, p).corto === corto && p.direccion === direccion,
    )!;
  const extremo = (codigo: string) => {
    const q = portales.situados.find((s) => s.codigo === codigo)!;
    return { lat: q.lat, lon: q.lon, nombre: codigo };
  };

  /**
   * ⭐ JUEZ 1 — EL N4 A MEDIODÍA.
   *
   * El N4 opera el domingo —`operaEl` dice `true` y es cierto—, y su ventana va
   * de **01:00 a 04:45**. A las 13:00 su servicio **ha cesado** [`frequencies`:
   * `end_time` es la hora en que la frecuencia *«cambia o CESA»*], así que no es
   * una opción. A la 01:30 sí, y con la espera de siempre.
   */
  test('⭐ 1 · el N4 no se aborda a las 13:00 y sí a la 01:30', () => {
    const n4 = patronDe('N4');
    assert.ok(operaEl(red, n4, UN_DOMINGO), 'el N4 tiene que operar ese día, o no hay caso');
    const v = ventanaDe(n4, red, UN_DOMINGO)!;
    assert.deepEqual([v.primera, v.ultima], [3600, 17100], 'la ventana medida del N4: 01:00–04:45');

    assert.equal(esperaEstimada(n4, red, UN_DOMINGO, MEDIODIA), null, 'a las 13:00 ha cesado');
    assert.equal(circulaHoy(red, n4, UN_DOMINGO, MEDIODIA), false, 'y no entra en el índice');

    const deMadrugada = esperaEstimada(n4, red, UN_DOMINGO, LA_MADRUGADA);
    assert.equal(deMadrugada, Math.round(v.intervalo / 2), 'a la 01:30 vale el H/2 de siempre');
    assert.ok(circulaHoy(red, n4, UN_DOMINGO, LA_MADRUGADA), 'y sí entra en el índice');

    // Y sin reloj sigue valiendo lo de antes del 6/09: la conducta no se toca.
    assert.equal(esperaEstimada(n4, red, UN_DOMINGO), Math.round(v.intervalo / 2));
  });

  /**
   * ⭐ JUEZ 2 — LA MADRUGADA, QUE ES DEL DÍA DE AYER.
   *
   * A las 00:10 una diurna todavía no ha empezado **su** día —y esperar a su
   * primera son horas—, pero el último vehículo de AYER puede estar en la
   * calle: el feed guarda esos viajes con la hora pasada de 86.400 [convención
   * del día de servicio]. El caso se elige **del cocinado, por id**.
   */
  test('⭐ 2 · a las 00:10 se aborda por el servicio de AYER, no esperando a mañana', () => {
    // El 40/1: medido, el domingo va de 05:24 a **25:20** —o sea 91.200 s—.
    const p = red.patrones.find((x) => x.id === '40|1|2')!;
    const ayer = ventanaDe(p, red, UN_DOMINGO)!;
    assert.ok(ayer.ultima > SEGUNDOS_DEL_DIA, `el fixture necesita una última >86.400 y es ${ayer.ultima}`);
    assert.equal(elDiaAntes(EL_LUNES), UN_DOMINGO, 'el lunes 14 va detrás del domingo 13');

    const alasCeroDiez = 10 * 60;
    const hoy = ventanaDe(p, red, EL_LUNES);
    assert.ok(hoy !== null && alasCeroDiez < hoy.primera, 'su propio día aún no ha empezado');

    const espera = esperaEstimada(p, red, EL_LUNES, alasCeroDiez)!;
    assert.equal(espera, Math.round(ayer.intervalo / 2), 'se coge el de ayer, con su H/2');
    assert.ok(
      espera < hoy!.primera - alasCeroDiez,
      `esperar a mañana serían ${hoy!.primera - alasCeroDiez} s y el de ayer llega en ${espera}`,
    );
  });

  /**
   * ⭐ JUEZ 3 — ANTES DE LA PRIMERA, LA ESPERA ES HASTA LA PRIMERA.
   *
   * No se veta —el 43 de las 07:00 existe a las 06:30, solo que hay que
   * esperarlo—, pero **no se cobra `H/2`**: el primer vehículo sale a su hora y
   * no antes. Quien decide si compensa es el coste, no un veto inventado.
   */
  test('⭐ 3 · a las 06:30, una línea de primera a las 07:00 cuesta 30 min de espera, no H/2', () => {
    const p = red.patrones.find((x) => x.id === '43|0|1')!;
    const v = ventanaDe(p, red, EL_LUNES)!;
    assert.equal(v.primera, 7 * 3600, 'el fixture es la línea que empieza a las 07:00');

    const espera = esperaEstimada(p, red, EL_LUNES, 6 * 3600 + 30 * 60);
    assert.equal(espera, 30 * 60, 'media hora hasta la primera salida');
    assert.notEqual(espera, Math.round(v.intervalo / 2), 'y NO el H/2, que aquí sería mentira');

    // Se aborda: existir existe. Un veto habría dejado a alguien sin opción.
    assert.ok(circulaHoy(red, p, EL_LUNES, 6 * 3600 + 30 * 60), 'antes de la primera SÍ se aborda');
    // Y treinta minutos más tarde ya está dentro de la ventana: H/2.
    assert.equal(esperaEstimada(p, red, EL_LUNES, 7 * 3600 + 60), Math.round(v.intervalo / 2));
  });

  /**
   * ⭐ JUEZ 4 — EL CASO DEL OJO: NINGÚN BÚHO A MEDIODÍA, Y CON LAS OBRAS DENTRO.
   *
   * `CALLE EL COLOSO 2 → GÓMEZ LAGUNA 38` en domingo y con la capa del festivo
   * **vacía** salía por **N2+N4, 64,2 min** —dos búhos que a esa hora no
   * circulan—.
   *
   * ⚠️ **Y esta juez nació mal, el mismo 6/09.** Montaba sobre `red` —la del
   *    feed— y por eso sellaba un `29+38` que **baja en el poste 1293 · Coso 80
   *    y sube en el 334 · Coso 55**: dos postes que hoy no pisa nadie, porque el
   *    Coso está en obras. Y los pintaba, con la traza a 45,8 m de media —445,3
   *    en lo peor— de por donde el 29 pasa de verdad. Ver la entrada nº36 de
   *    `docs/BITACORA.md` y la REGLA DE CASA de la cabecera.
   *
   * Ahora monta sobre la **operativa del día** y compra lo que gana con las
   * obras puestas: `29+Ci1+53`, medido, con el aviso del desvío de la 29.
   */
  test('⭐ 4 · el caso del Coloso a mediodía: ni búho, ni poste en obras', () => {
    const A = extremo('Portales.93310');
    const B = extremo('Portales.92683');

    const sinReloj = viajeDelDia(A, B, UN_DOMINGO);
    const lineasSin = sinReloj.tramos.map((t) => t.linea?.corto).filter((x): x is string => !!x);
    assert.ok(
      lineasSin.some((l) => /^N\d/.test(l)),
      `sin reloj este caso montaba un búho, y ahora monta ${lineasSin.join('+')}: la juez ya no vigila nada`,
    );

    const aMediodia = viajeDelDia(A, B, UN_DOMINGO, MEDIODIA);
    const lineasCon = aMediodia.tramos.map((t) => t.linea?.corto).filter((x): x is string => !!x);
    assert.deepEqual(
      lineasCon,
      ['29', 'Ci1', '53'],
      `con las obras dentro el ganador medido es 29+Ci1+53, y salió ${lineasCon.join('+') || '(nada)'}`,
    );
    assert.deepEqual(
      lineasCon.filter((l) => /^N\d/.test(l)),
      [],
      'a las 13:00 no puede montar ningún búho',
    );

    // ⭐ Y NINGUNA PARADA DEL VIAJE ESTÁ EN OBRAS. Se pregunta al fixture, que
    //    es lo que la calle contestó: si un poste no está en el recorrido de hoy
    //    de su línea, mandar a alguien a esperar ahí es mandarlo a una acera.
    const viaje = buscarViaje({
      red: operativa.red,
      fecha: UN_DOMINGO,
      ahora: MEDIODIA,
      suprimidas: operativa.suprimidas,
      acceso: accesos(A.lon, A.lat),
      salida: accesos(B.lon, B.lat),
    })!;
    for (const m of viaje.montados) {
      const corto = lineaDelViaje(operativa.red, m.patron).corto;
      const v = ventanaDe(m.patron, operativa.red, UN_DOMINGO)!;
      assert.ok(
        v.primera <= MEDIODIA && MEDIODIA <= v.ultima,
        `${corto} tiene ventana ${v.primera}–${v.ultima} y son las ${MEDIODIA}`,
      );
      const enLaCalle = RECORRIDOS_DE_HOY[`${corto}|${m.patron.direccion}`];
      if (!enLaCalle) {
        continue;
      }
      for (const i of [m.iDesde, m.iHasta]) {
        const parada = operativa.red.paradas.find((p) => p.id === m.patron.paradas[i]);
        const poste = Number(String(parada?.codigo ?? '').replace(/^\D*0*/, ''));
        assert.ok(
          enLaCalle.some((q) => q.poste === poste),
          `el viaje usa el poste ${poste} de la línea ${corto}, y hoy esa línea no pasa por ahí`,
        );
      }
    }

    // Y el desvío de la 29 se dice: no basta con esquivarlo en silencio.
    assert.ok(
      aMediodia.avisos.some((a) => a.texto.includes('línea 29') && a.texto.includes('1293')),
      `falta el aviso del desvío de la 29: ${aMediodia.avisos.map((a) => a.texto).join(' | ')}`,
    );
  });

  /**
   * ⭐ JUEZ 5 — DONDE NO HABÍA BÚHO, NO CAMBIA NI UN BYTE.
   *
   * `RODRIGO REBOLLEDO 37 → GÓMEZ LAGUNA 38` no montaba ninguno —medido en el
   * diagnóstico—, así que enchufar el reloj no puede moverlo. Es el sello que
   * separa «arreglar el búho» de «mover la búsqueda».
   *
   * ℹ️ **La red pelada le vale** [REGLA DE CASA], y se ha comprobado que sí:
   * lo que compra es una RELACIÓN —idéntico con reloj y sin él— medida sobre la
   * misma red en los dos lados. Se probó a montarla sobre la operativa y **la
   * contraprueba no mordió**: su viaje es `Ci3+41`, y ninguna de esas dos líneas
   * está en el fixture de recorridos, así que la operativa le daba exactamente
   * la misma red con más ceremonia. Cumplir la regla no es aparentarla.
   */
  test('⭐ 5 · un viaje que no montaba búho sale idéntico con reloj y sin él', () => {
    const A = extremo('Portales.109451');
    const B = extremo('Portales.92683');
    const sinReloj = viajeEnBus(motor, red, A, B, UN_DOMINGO);
    const aMediodia = viajeEnBus(motor, red, A, B, UN_DOMINGO, MEDIODIA);
    const lineas = sinReloj.tramos.map((t) => t.linea?.corto).filter((x): x is string => !!x);
    assert.ok(lineas.length > 0 && !lineas.some((l) => /^N\d/.test(l)), 'el caso no puede llevar búho');
    assert.equal(
      createHash('sha256').update(JSON.stringify(aMediodia)).digest('hex'),
      createHash('sha256').update(JSON.stringify(sinReloj)).digest('hex'),
      `tenía que salir al byte y salió ${aMediodia.tramos.map((t) => t.linea?.corto ?? '').join('+')}`,
    );
  });

  /** ⭐ Y el reloj de pared se lee igual que la fecha: en LOCAL. */
  test('⭐ segundosDelDia lee la hora local, y elDiaAntes cruza el mes', () => {
    assert.equal(segundosDelDia(new Date(2026, 8, 6, 13, 0, 0)), 46_800);
    assert.equal(segundosDelDia(new Date(2026, 8, 6, 0, 10, 30)), 630);
    assert.equal(elDiaAntes('20260901'), '20260831');
    assert.equal(elDiaAntes('20260101'), '20251231');
  });
});
