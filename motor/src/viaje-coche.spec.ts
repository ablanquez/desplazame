/**
 * ⭐ EL VIAJE EN COCHE (2/09, punto 12 casilla 1b).
 *
 * ⚠️ **CERO RED y cero caso inventado.** Todo sale de los ficheros del
 *    repositorio, y los cruces se citan **por su id de OSM**: una juez de
 *    restricciones sobre un cruce de mentira compraría que el código hace lo
 *    que el código hace.
 *
 * Las aristas **no se nombran por su índice**. El índice depende de en qué
 * orden salieran del cocinado, y una juez atada a un número se pondría roja el
 * día que la descarga cambie sin que nada esté mal. Se buscan por su `way` de
 * OSM y por el cruce que comparten, que es lo que las identifica de verdad.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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
import { cargarRejilla, enganchar } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import { calcularRutaEnCoche } from './viaje-coche.ts';
import type { Extremo } from './etapas.ts';

let portales: PortalesEnMemoria;
let coche: RedDeCocheServida;
/**
 * ⚠️ **EL MOTOR ENTERO, y no por gusto de tenerlo.** Estas jueces piden el
 *    viaje por `calcularTrayecto`, que es la puerta de verdad: con
 *    `viajeEnCoche` a pelo, **colarle el coche a la red de la rueda no las
 *    movía** —lo midió la contraprueba 4 del encargo, que solo mordía una juez
 *    de `trayecto.spec.ts`—. Una juez que no ve el reparto por modos no puede
 *    cazar un reparto equivocado.
 */
let motor: Motor;

/** Un portal, convertido en el extremo que el cálculo interno pide. */
function extremo(codigo: string): Extremo {
  const p = portales.donde.get(codigo);
  assert.ok(p, `no existe el portal ${codigo}`);
  return { lon: p.lon, lat: p.lat, nombre: `${p.via} ${p.numero}` };
}

/** Y en los dos códigos con los que viaja por el contrato. */
function porCodigos(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo);
  assert.ok(p, `no existe el portal ${codigo}`);
  return { via: p.via, portal: p.codigo };
}

/** Un viaje en coche entre dos portales, **por la puerta de verdad**. */
function viaje(origen: string, destino: string): Trayecto {
  return calcularTrayecto(motor, {
    origen: porCodigos(origen),
    destino: porCodigos(destino),
    modo: 'coche',
  });
}

/** Los índices de arista que la ruta recorre, en orden. */
function porDonde(origen: string, destino: string, red = coche): readonly number[] {
  const o = extremo(origen);
  const d = extremo(destino);
  const eo = enganchar(red.comoRed, red.rejilla, o.lon, o.lat);
  const ed = enganchar(red.comoRed, red.rejilla, d.lon, d.lat);
  assert.ok(eo && ed, 'los dos extremos tienen que enganchar');
  const r = calcularRutaEnCoche(red, eo, [o.lon, o.lat], ed, [d.lon, d.lat]);
  return r ? r.trozos.map((t) => t.arista) : [];
}

// ── Los dos portales del cruce vetado, y los dos del sentido único ───────────
//
// ASALTO 45 está antes del cruce de Calle Asalto con Calle del Heroísmo; DOCTOR
// BLANCO CORDERO 7 queda al otro lado, y el camino corto sería girar allí a la
// izquierda. La `no_left_turn` **rel 1211840** lo prohíbe.
const ASALTO_45 = 'Portales.83594';
const BLANCO_CORDERO_7 = 'Portales.96490';

// AVENIDA LOS PIRINEOS 2 y CALLE PALENCIA 2-4, a los dos lados de la way
// 23134100 —`oneway=yes` con `oneway:bicycle=no`—: la ida la usa, la vuelta no
// puede. Es la calle de la juez 4 de la casilla 1a, ahora dentro de un viaje.
const PIRINEOS_2 = 'Portales.125463';
const PALENCIA_2 = 'Portales.84756';

// PEDRO LAPUYADE 3 está fuera del casco; ABEN AIRE 33, dentro de la ZBE; y
// CAMINO DE EN MEDIO 120 al otro extremo de la ciudad, sin pisarla.
const LAPUYADE_3 = 'Portales.84476';
const ABEN_AIRE_33 = 'Portales.100601';
const EN_MEDIO_120 = 'Portales.82922';

/** Las ways de OSM del cruce de la `no_left_turn` 1211840. */
const ASALTO = 92741333;
const HEROISMO = 80733755;
/** La way de sentido único de la juez 4 de la casilla 1a. */
const PIRINEOS = 23134100;

describe('⭐ EL VIAJE EN COCHE — vetos, sentido y ZBE', () => {
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
   * ⭐ JUEZ 1 — LA `no_left_turn` 1211840 SE RESPETA **DENTRO DE UN VIAJE**.
   *
   * La casilla 1a compró que la transición estuviera vetada en la red. Esto es
   * otra cosa y es la que importa: que la BÚSQUEDA la obedezca. Un Dijkstra por
   * nodos daría verde en aquélla y rojo aquí — cuando llega al cruce ya ha
   * olvidado por dónde entró, que es la única pregunta que la restricción hace.
   *
   * El viaje `ASALTO 45 → DOCTOR BLANCO CORDERO 7` es el caso: sin la
   * restricción son **1.225 m**, y con ella **1.644 m** — un rodeo de 419 m por
   * Miguel Servet, Espartero y el Coso.
   */
  test('⭐ 1 · un viaje que giraría a la izquierda en el cruce vetado RODEA', () => {
    const A = coche.cocinada.aristas;
    const entrada = A.find(
      (a) =>
        a.way === ASALTO &&
        (coche.cocinada.salidas.get(a.hasta) ?? []).some((f) => A[f]!.way === HEROISMO),
    );
    assert.ok(entrada, 'la Calle Asalto tiene que llegar al cruce con el Heroísmo');
    const prohibida = (coche.cocinada.salidas.get(entrada.hasta) ?? []).find(
      (f) => A[f]!.way === HEROISMO,
    )!;
    // La transición está vetada en la red: es lo que la casilla 1a dejó.
    assert.ok(
      coche.cocinada.vetadas.has(`${entrada.i}>${prohibida}`),
      'la rel 1211840 tiene que vetar esa transición',
    );

    // Y el viaje NO la usa: en ningún punto se pasa de la una a la otra.
    const camino = porDonde(ASALTO_45, BLANCO_CORDERO_7);
    assert.ok(camino.length > 0, 'ese viaje tiene que existir');
    for (let k = 1; k < camino.length; k++) {
      assert.ok(
        !(camino[k - 1] === entrada.i && camino[k] === prohibida),
        `el viaje gira donde la rel 1211840 lo prohíbe (trozo ${k})`,
      );
    }
    // Y pasa por el cruce: si ni se acercara, la juez no probaría nada.
    assert.ok(camino.includes(entrada.i), 'el viaje tiene que llegar a ese cruce por Asalto');

    // El rodeo es real y se mide: la ruta es más larga que la línea prohibida.
    const t = viaje(ASALTO_45, BLANCO_CORDERO_7);
    assert.ok(t.metros > 1500, `el rodeo son ${t.metros} m, y sin veto serían 1.225`);
    assert.ok(
      t.pasos.some((p) => p.texto.includes('Coso')),
      'el rodeo de este caso sale por el Coso',
    );
  });

  /**
   * ⭐ JUEZ 2 — EL SENTIDO ÚNICO DEL COCHE, dentro de un viaje.
   *
   * La way **23134100** (Avenida de Pirineos) lleva `oneway=yes` **y**
   * `oneway:bicycle=no`: la bici puede a contramano y el coche no. La casilla
   * 1a compró que la red no tuviera esas aristas al revés; aquí se compra que
   * el viaje lo note — **la ida son 350 m por ella, y la vuelta 497 m sin ella**.
   */
  test('⭐ 2 · el sentido único del coche parte el viaje en dos: 350 m de ida, 497 de vuelta', () => {
    const suyas = new Set(
      coche.cocinada.aristas.filter((a) => a.way === PIRINEOS).map((a) => a.i),
    );
    assert.ok(suyas.size > 0, 'la way 23134100 tiene que estar en la red');
    for (const i of suyas) {
      assert.equal(coche.gemela[i], -1, `la arista ${i} no puede tener gemela: es de un solo sentido`);
    }

    const ida = porDonde(PIRINEOS_2, PALENCIA_2);
    const vuelta = porDonde(PALENCIA_2, PIRINEOS_2);
    assert.ok(ida.some((i) => suyas.has(i)), 'la ida tiene que ir por la Avenida de Pirineos');
    assert.ok(
      !vuelta.some((i) => suyas.has(i)),
      'la vuelta NO puede ir por ella: es de sentido único para el coche',
    );

    const t = viaje(PIRINEOS_2, PALENCIA_2);
    const v = viaje(PALENCIA_2, PIRINEOS_2);
    assert.equal(t.modo, 'coche', 'la respuesta tiene que venir del coche, no de otro modo');
    assert.equal(t.metros, 350);
    assert.equal(v.metros, 497);
    // Y el viaje del coche es UN tramo rodando: la rueda traería los del empuje.
    assert.deepEqual(t.tramos.map((x) => x.comoSeVa), ['rodando']);
  });

  /**
   * ⭐ JUEZ 4 — LAS SUMAS DEL CONTRATO CUADRAN Y LOS ÍNDICES CIERRAN.
   *
   * Son las jueces A y B de `tramos.spec.ts`, aplicadas al modo nuevo. Aquí van
   * sobre tres viajes distintos, porque un tramo único es fácil de cuadrar en
   * uno y de romper en el siguiente.
   */
  test('⭐ 4 · los tramos cubren la geometría y suman exactamente el total', () => {
    for (const [o, d] of [
      [ASALTO_45, BLANCO_CORDERO_7],
      [LAPUYADE_3, ABEN_AIRE_33],
      [LAPUYADE_3, EN_MEDIO_120],
    ] as const) {
      const t = viaje(o, d);
      assert.ok(t.tramos.length > 0, `${o}→${d}: ni un tramo`);
      assert.equal(t.tramos[0]!.desde, 0);
      assert.equal(t.tramos[t.tramos.length - 1]!.hasta, t.geometria.length - 1);
      assert.equal(t.tramos.reduce((s, x) => s + x.metros, 0), t.metros);
      assert.equal(t.tramos.reduce((s, x) => s + x.segundos, 0), t.segundos);
      // El coche va `rodando` y sin hitos: no se baja de él por el camino.
      assert.deepEqual(
        t.tramos.map((x) => x.comoSeVa),
        ['rodando'],
      );
      assert.equal(t.tramos[0]!.hito, null);
      // Y los pasos abren y cierran como en todos los modos.
      assert.equal(t.pasos[0]!.giro, 'salida');
      assert.equal(t.pasos[t.pasos.length - 1]!.giro, 'llegada');
      assert.equal(t.pasos[t.pasos.length - 1]!.metros, 0);
      for (const paso of t.pasos) {
        assert.equal(paso.texto, paso.partes.map((p) => p.texto).join(''));
      }
    }
  });

  /**
   * ⭐ JUEZ 5 — LA MURALLA. El coche no toca a nadie.
   *
   * Tres formas de decirlo, y las tres hacen falta:
   *
   * **a · Por el código.** Ni `coche.ts` ni `viaje-coche.ts` importan el grafo
   * del peatón, la red de la rueda o la del bus. Es la misma juez que la
   * casilla 1a le puso al cocinado, ahora sobre el viaje.
   *
   * **b · Por los objetos.** La red del coche no comparte ni una estructura con
   * las otras: sus nodos son otros, sus aristas son otras.
   *
   */
  test('⭐ 5a · el coche no importa el grafo del peatón, ni la rueda, ni el bus', () => {
    for (const fichero of ['coche.ts', 'viaje-coche.ts']) {
      const fuente = readFileSync(fileURLToPath(new URL(fichero, import.meta.url)), 'utf8');
      for (const prohibido of ['grafo.ts', 'red-rueda.ts', 'red-bus.ts', 'rodando.ts', 'rueda.ts']) {
        assert.ok(
          !fuente.includes(`from './${prohibido}'`),
          `${fichero} importa ${prohibido}: la muralla está rota`,
        );
      }
    }
  });

  test('⭐ 5b · la red del coche no comparte estructura con ninguna otra', () => {
    // Sus nodos son ids de OSM reconstruidos aparte, y sus aristas dirigidas.
    assert.equal(coche.cocinada.nodos.length, 30290);
    assert.equal(coche.cocinada.aristas.length, 57390);
    // La vestida y la cocinada son dos listas: la geometría va al revés en cada
    // una, y confundirlas cambiaría el lado de la sigmoide de `car.lua`.
    assert.notEqual(coche.comoRed.aristas, coche.cocinada.aristas);
    const cruda = coche.cocinada.aristas[0]!.g[0]!;
    const vestida = coche.comoRed.aristas[0]!.g[0]!;
    assert.equal(cruda[0], vestida[1], 'la cocinada va [lat, lon] y la vestida [lon, lat]');
    assert.equal(cruda[1], vestida[0]);
    // Y no hereda nombres del callejero municipal: los suyos son de OSM.
    assert.equal(coche.comoRed.nombreHeredado.size, 0);
    assert.equal(coche.conNombre, 14511);
    assert.equal(coche.sinNombre, 10731);
  });

  /**
   * ⭐ JUEZ 6 — LAS PENALIZACIONES NO PROHÍBEN.
   *
   * Es la otra mitad de la juez 1 y hace falta decirla aparte: si un giro caro
   * cerrara el paso, el rodeo de la juez 1 —que son cuatro giros de verdad— no
   * existiría, y la respuesta sería «no hay ruta» en vez de una ruta más larga.
   */
  test('⭐ 6 · una ruta con giros caros existe: la penalización cobra, no cierra', () => {
    const t = viaje(ASALTO_45, BLANCO_CORDERO_7);
    const giros = t.pasos.filter((p) => p.giro === 'derecha' || p.giro === 'izquierda');
    assert.ok(giros.length >= 4, `solo ${giros.length} giros de verdad: el caso ya no vale`);
    assert.ok(t.segundos > 0);
    // Y el tiempo lleva las transiciones dentro: `car.lua` las suma a
    // `turn.duration`. Sin ellas, 1.644 m a la velocidad de la tabla saldrían
    // por debajo de estos segundos.
    assert.ok(t.segundos >= 180, `${t.segundos} s: las transiciones no se están cobrando`);
  });

  /**
   * ⭐ JUEZ 7 — LOS EXTREMOS SIN CALZADA CONTESTAN, no revientan.
   *
   * ⚠️ Y hay un caso REAL en Zaragoza que hay que dejar escrito: en el cruce de
   *    **Calle del Doctor Iranzo con Calle de Leopoldo Romeo** (nodo OSM
   *    265560582) hay **cuatro relations** —9347855, 9347856, 9347857 y
   *    9347858— que entre las cuatro prohíben **las cuatro** transiciones
   *    posibles. El cruce queda cerrado y con él la way 672283905, que es donde
   *    engancha CALLE LEOPOLDO ROMEO 27. Es el dato de OSM, no el motor: lo que
   *    hace el motor es contestar «no hay forma», que es la verdad.
   */
  test('⭐ 7 · un destino al que el coche no puede llegar se contesta, no se rompe', () => {
    const t = viaje('Portales.93310', 'Portales.79358');
    assert.equal(t.pasos.length, 0);
    assert.equal(t.geometria.length, 0);
    assert.deepEqual(t.tramos, []);
    assert.equal(t.modo, 'coche');
    assert.equal(t.avisos.length, 1);
    assert.match(t.avisos[0]!.texto, /No hay forma de ir en coche/);
  });
});
