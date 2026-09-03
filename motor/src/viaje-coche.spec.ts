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
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TipoDeAparcamiento, Trayecto } from '@desplazame/tipos';
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
import { escribirPasos } from './pasos.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import {
  AVISO_ZBE,
  AVISO_ZBE_EVITADA,
  calcularRutaEnCoche,
  laZbeEstaEnVigor,
} from './viaje-coche.ts';
import { dondeAparcarCerca, elAparcamiento } from './aparcamiento.ts';
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
function viaje(
  origen: string,
  destino: string,
  extra?: {
    readonly aparcamiento?: TipoDeAparcamiento;
    readonly puedeEntrarEnLaZbe?: boolean;
  },
  cuando?: Date,
): Trayecto {
  return calcularTrayecto(
    motor,
    { origen: porCodigos(origen), destino: porCodigos(destino), modo: 'coche', ...extra },
    null,
    cuando,
  );
}

/**
 * ⭐ DOS RELOJES DE MENTIRA, y por eso el reloj entra por parámetro.
 *
 * El **1 de septiembre de 2026 es martes** y el **6, domingo**. Sin poder
 * mentirle al reloj, la juez de la franja solo se podría correr entre semana y
 * de 8 a 20 — que es como no poder correrla.
 */
const MARTES_A_LAS_10 = new Date(2026, 8, 1, 10, 0, 0);
const DOMINGO_A_LAS_10 = new Date(2026, 8, 6, 10, 0, 0);

/** Dónde acabó aparcando un viaje: el `id` del WFS del sitio que ganó. */
function dondeAparca(t: Trayecto, tipo: TipoDeAparcamiento): string | null {
  const hito = t.pasos.find((x) => x.giro === 'aparca');
  if (!hito) {
    return null;
  }
  // El hito lleva el nombre y el detalle, no el id: el id se recupera buscando
  // el sitio que cae encima del vértice del hito, que es donde el contrato dice
  // que está — `geometria[tramo.hasta]`, a 0,0 m del dato.
  const corte = t.tramos[0]!.hasta;
  const [lat, lon] = t.geometria[corte]!;
  const [cerca] = dondeAparcarCerca(elAparcamiento(), tipo, lon, lat, 1);
  return cerca ? cerca.id : null;
}

/**
 * El sha256 de un trayecto, **con las claves de cada objeto ordenadas**.
 *
 * Un objeto JSON no promete el orden de sus claves, así que compararlo tal cual
 * confunde «ha cambiado la respuesta» con «se ha montado de otra manera».
 */
function selloDe(t: Trayecto): string {
  const canonico = JSON.stringify(t, (_k, v: unknown) =>
    v !== null && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v as Record<string, unknown>)
            .sort()
            .map((k) => [k, (v as Record<string, unknown>)[k]]),
        )
      : v,
  );
  return createHash('sha256').update(canonico).digest('hex');
}

/** Si el coche se ha quedado aparcado DENTRO de la zona. */
function aparcaDentroDeLaZbe(t: Trayecto): boolean {
  const corte = t.tramos[0]?.hasta;
  if (corte === undefined || t.tramos[0]!.hito !== 'aparca') {
    return false;
  }
  // El vértice del hito cae a 0,0 m del sitio donde se deja el coche.
  const [lat, lon] = t.geometria[corte]!;
  const e = enganchar(coche.comoRed, coche.rejilla, lon, lat);
  return e !== null && coche.cocinada.aristas[e.arista]!.zbe;
}

/** Si la ruta pisa alguna arista marcada como Zona de Bajas Emisiones. */
function pisaLaZbe(t: Trayecto): boolean {
  return t.avisos.some((a) => a.texto.includes('Zona de Bajas Emisiones') && a.paso !== undefined);
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

// Y dos pares que caen en el MISMO cruce por el `node_snap`: CAMINO ABEJAR 71
// TV C9 y C11 están a 45,9 m en línea recta, y CALLE ABEDUL 1 y 2 a 11,0 m. Los
// dos pares son la entrada nº30 de `docs/BITACORA.md`.
const ABEJAR_C9 = 'Portales.115617';
const ABEJAR_C11 = 'Portales.118293';
const ABEDUL_1 = 'Portales.90046';
const ABEDUL_2 = 'Portales.114182';
// Y su contrapartida, que es la mitad que faltaba: dos direcciones que TAMBIÉN
// enganchan a un cruce, pero **a cruces distintos** (7313 y 4288). Sin ella, un
// corte que se tragara cualquier par de enganches pegados a un nodo pasaba las
// once jueces en verde — medido, contraprueba 5 del encargo.
const CONDE_DE_ARANDA_101 = 'Portales.109255';
const OSA_MAYOR_4 = 'Portales.91645';

// PEDRO LAPUYADE 3 está fuera del casco; ABEN AIRE 33, dentro de la ZBE; y
// CAMINO DE EN MEDIO 120 al otro extremo de la ciudad, sin pisarla.
const LAPUYADE_3 = 'Portales.84476';
// Y uno pegado al casco pero FUERA: su mejor aparcamiento regulado cae dentro.
const SAN_VICENTE_DE_PAUL_3 = 'Portales.79057';
const ABEN_AIRE_33 = 'Portales.100601';
const EN_MEDIO_120 = 'Portales.82922';

/** Las ways de OSM del cruce de la `no_left_turn` 1211840. */
const ASALTO = 92741333;
const HEROISMO = 80733755;
/** La way de sentido único de la juez 4 de la casilla 1a. */
const PIRINEOS = 23134100;

// ── Los sitios donde el coche acaba aparcando, citados por su id del WFS ────
//
// Salen de medir, no de elegir: son los que el COSTE elige para el viaje
// `PEDRO LAPUYADE 3 → CALLE ABEN AIRE 33` con cada tipo. Ver la juez 1.
const ESRE_MOSEN_PEDRO_DOSSET = 'MU1_estacionamientos_calle.46777';
const LIBRE_ARQUITECTO_LA_FIGUERA = 'MU1_estacionamientos_calle.45408';
const PMR_ECHEGARAY = 'MU1_reservas.43011';

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
   * ⭐ JUEZ 3 — EL AVISO DE LA ZBE, EN EL DOBLE SITIO. Y solo cuando toca.
   *
   * «El doble sitio» son el resumen de arriba y el paso por el que se entra
   * [GOV.UK, el patrón de los desvíos]. El motor lo dice **una vez** con su
   * `paso` puesto, y eso es lo que permite pintarlo en los dos sin adivinar.
   *
   * `LAPUYADE 3 → ABEN AIRE 33` entra en el casco por **Calle San Blas**, y ése
   * es el paso que se compra — no el primero de la ruta ni el último.
   */
  test('⭐ 3 · el viaje que cruza el casco trae el aviso, con el paso donde entra', () => {
    const t = viaje(LAPUYADE_3, ABEN_AIRE_33);
    assert.equal(t.avisos.length, 1, 'un viaje por el casco trae el aviso de la ZBE, y uno solo');
    const aviso = t.avisos[0]!;
    assert.equal(aviso.texto, AVISO_ZBE);
    // La letra de la FAQ oficial, medida el 2/09. Si alguien la suaviza, rojo.
    assert.match(aviso.texto, /de lunes a viernes de 8:00 a 20:00/);
    assert.match(aviso.texto, /sin distintivo necesitan autorización/);
    assert.match(aviso.texto, /B, C, ECO y CERO circulan libres/);

    // ⭐ EL SEGUNDO SITIO: el paso, y es el que ENTRA.
    assert.equal(typeof aviso.paso, 'number', 'sin `paso` no hay doble sitio, hay uno');
    const paso = t.pasos[aviso.paso!];
    assert.ok(paso, `el aviso apunta al paso ${aviso.paso}, que no existe`);
    assert.ok(
      paso.texto.includes('San Blas'),
      `el aviso cuelga de «${paso.texto}», y se entra en la zona por Calle San Blas`,
    );
    assert.notEqual(paso.giro, 'llegada', 'en la llegada no se entra en ninguna parte');

    // Y la ruta se devuelve igual: AVISA, NO VETA.
    assert.ok(t.metros > 0 && t.pasos.length > 3, 'la ruta por la ZBE se devuelve entera');
  });

  test('⭐ 3 bis · el viaje que no la pisa no lo trae', () => {
    const t = viaje(LAPUYADE_3, EN_MEDIO_120);
    assert.ok(t.metros > 0, 'ese viaje existe');
    assert.deepEqual(t.avisos, [], `un viaje que no cruza el casco no avisa: ${JSON.stringify(t.avisos)}`);
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
   * **c · Por el añadido a la narración.** `escribirPasos` estrena un parámetro
   * —`aperturas`— y hay que comprar que **rellenarlo no cambia la respuesta**:
   * es lo único de este encargo que toca un fichero que los cinco modos usan.
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

  test('⭐ 5c · rellenar `aperturas` no mueve un byte de los pasos', () => {
    const o = extremo(LAPUYADE_3);
    const d = extremo(ABEN_AIRE_33);
    const eo = enganchar(coche.comoRed, coche.rejilla, o.lon, o.lat)!;
    const ed = enganchar(coche.comoRed, coche.rejilla, d.lon, d.lat)!;
    const r = calcularRutaEnCoche(coche, eo, [o.lon, o.lat], ed, [d.lon, d.lat])!;
    const sin = escribirPasos(coche.comoRed, r, 'A', 'B', [d.lon, d.lat]);
    const aperturas: number[] = [];
    const con = escribirPasos(coche.comoRed, r, 'A', 'B', [d.lon, d.lat], undefined, undefined, aperturas);
    assert.equal(JSON.stringify(con), JSON.stringify(sin));
    // Y lo que rellena es una entrada por paso, sin retroceder nunca.
    assert.equal(aperturas.length, con.length);
    for (let k = 1; k < aperturas.length; k++) {
      assert.ok(aperturas[k]! >= aperturas[k - 1]!, 'las aperturas no pueden ir hacia atrás');
    }
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
   * ⭐ JUEZ 8 — DOS DIRECCIONES DEL MISMO CRUCE NO DAN LA VUELTA A LA MANZANA.
   *
   * ⚠️ Es la **entrada nº30 de `docs/BITACORA.md`**, y lo que la hace valer la
   *    pena no es el fallo: es que **el peatón tenía este caso vigilado desde el
   *    24/08** —«UNA RESCATADA anda hasta su propia puerta»— y su juez siguió en
   *    verde, porque solo mira `andando`. Medido con el fallo vivo: CAMINO
   *    ABEJAR 71 TV C9 → C11, a 45,9 m en línea recta, daba **635 m y 119 s**;
   *    CALLE ABEDUL 1 → 2, a 11,0 m, daba **«no hay forma»**.
   *
   * Son **672 nodos** de la red con más de un portal pegado, así que no es un
   * caso de laboratorio: es el bloque de pisos con dos portales en la esquina.
   */
  test('⭐ 8 · dos direcciones pegadas al mismo cruce están a cero metros', () => {
    for (const [o, d] of [
      [ABEJAR_C9, ABEJAR_C11],
      [ABEDUL_1, ABEDUL_2],
    ] as const) {
      // El caso es el que es: los dos enganches caen en el MISMO nodo. Si algún
      // día dejaran de hacerlo, la juez lo dice en vez de pasar de largo.
      const eo = extremo(o);
      const ed = extremo(d);
      const a = enganchar(coche.comoRed, coche.rejilla, eo.lon, eo.lat)!;
      const b = enganchar(coche.comoRed, coche.rejilla, ed.lon, ed.lat)!;
      assert.equal(a.nodo, b.nodo, `${o} y ${d} ya no enganchan al mismo cruce`);
      assert.notEqual(a.nodo, null, 'el caso pide que el node_snap actúe');

      const t = viaje(o, d);
      assert.deepEqual(t.avisos, [], `${o}→${d}: ${t.avisos[0]?.texto}`);
      assert.equal(t.metros, 0, `${o}→${d}: todavía conduce ${t.metros} m hasta la puerta de al lado`);
      assert.equal(t.pasos.length, 1);
      assert.match(t.pasos[0]!.texto, /es el mismo portal del que sales/);
    }
  });

  /**
   * ⭐ JUEZ 8 bis — Y DOS CRUCES DISTINTOS SIGUEN SIENDO UN VIAJE.
   *
   * La otra mitad, y hace falta: la juez de arriba compra que el corte actúe, y
   * ésta que **no se pase**. CALLE CONDE DE ARANDA 101 y CALLE OSA MAYOR 4
   * enganchan las dos a un cruce —el 7313 y el 4288—, y entre ellas hay 4.740 m
   * de ciudad. Un corte que mirara «los dos van pegados a un nodo» sin comparar
   * cuál las dejaría a cero, y las once jueces seguirían en verde.
   */
  test('⭐ 8 bis · dos direcciones pegadas a cruces DISTINTOS siguen teniendo viaje', () => {
    const eo = extremo(CONDE_DE_ARANDA_101);
    const ed = extremo(OSA_MAYOR_4);
    const a = enganchar(coche.comoRed, coche.rejilla, eo.lon, eo.lat)!;
    const b = enganchar(coche.comoRed, coche.rejilla, ed.lon, ed.lat)!;
    assert.notEqual(a.nodo, null, 'el caso pide que el node_snap actúe en los dos');
    assert.notEqual(b.nodo, null, 'el caso pide que el node_snap actúe en los dos');
    assert.notEqual(a.nodo, b.nodo, 'y que sean cruces DISTINTOS');

    const t = viaje(CONDE_DE_ARANDA_101, OSA_MAYOR_4);
    assert.equal(t.metros, 4740);
    assert.equal(t.segundos, 478);
    assert.equal(t.pasos.length, 13);
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

  describe('⭐ EL REMATE AL PARKING Y LA ZBE SELECCIONABLE (casilla 2)', () => {
    /**
     * ⭐ JUEZ 1 DEL ENCARGO — EL REMATE AL PARKING, y **por coste, no por radio**.
     *
     * `PEDRO LAPUYADE 3 → CALLE ABEN AIRE 33` con cada tipo aparca en un sitio
     * distinto, y los tres son reales y se citan por su `id` del WFS:
     *
     * | tipo | dónde | conducir | andar |
     * |---|---|---|---|
     * | `regulado` | `…46777` ESRE, CALLE MOSEN PEDRO DOSSET | 3.248 m | 140 m |
     * | `gratuito` | `…45408` LIBRE, CALLE ARQUITECTO LA FIGUERA | 4.316 m | 509 m |
     *
     * ⚠️ **Y el regulado NO es el más cercano en línea recta**: ése es el
     *    `…46776`, a 67 m del portal. Gana el `…46777` porque el viaje entero sale
     *    más barato. Es la juez que la contraprueba del radio muerde.
     */
    test('⭐ 1 · regulado y gratuito aparcan en tramos reales y distintos', () => {
      const reg = viaje(LAPUYADE_3, ABEN_AIRE_33, { aparcamiento: 'regulado' });
      const gra = viaje(LAPUYADE_3, ABEN_AIRE_33, { aparcamiento: 'gratuito' });

      // Dos tramos: se conduce y se anda. Y el primero muere en el hito.
      for (const [nombre, t] of [['regulado', reg], ['gratuito', gra]] as const) {
        assert.deepEqual(
          t.tramos.map((x) => x.comoSeVa),
          ['rodando', 'andando'],
          `${nombre}: el viaje con aparcamiento son dos tramos`,
        );
        assert.equal(t.tramos[0]!.hito, 'aparca', `${nombre}: el coche se deja al final del primero`);
        assert.equal(t.tramos[1]!.hito, null);
        // Las sumas del contrato, exactas.
        assert.equal(t.tramos.reduce((a, x) => a + x.metros, 0), t.metros, `${nombre}: metros`);
        assert.equal(t.tramos.reduce((a, x) => a + x.segundos, 0), t.segundos, `${nombre}: segundos`);
        // Y los índices cierran sobre la geometría entera.
        assert.equal(t.tramos[0]!.desde, 0);
        assert.equal(t.tramos[1]!.hasta, t.geometria.length - 1);
        assert.equal(t.tramos[1]!.desde, t.tramos[0]!.hasta, `${nombre}: hay un hueco entre tramos`);
      }

      // El paso del hito dice DÓNDE y QUÉ es, con la palabra del censo.
      const hitoReg = reg.pasos.find((x) => x.giro === 'aparca')!;
      assert.match(hitoReg.texto, /^Aparca en /);
      assert.match(hitoReg.texto, /zona regulada de residentes \(ESRE\)$/);
      assert.match(hitoReg.texto, /Mosen Pedro Dosset/);
      assert.equal(hitoReg.metros, 0, 'un hito no abre tramo');

      const hitoGra = gra.pasos.find((x) => x.giro === 'aparca')!;
      assert.match(hitoGra.texto, /estacionamiento sin regulación$/);

      // ⭐ Y NINGUNO DE LOS DOS INVENTA UN PRECIO NI UNA FRANJA: § 1.11 no trae
      //    ni tarifa ni horario, así que decir cualquiera de las dos sería
      //    ponerle al Ayuntamiento en la boca algo que no ha dicho.
      for (const hito of [hitoReg, hitoGra]) {
        assert.equal(/[€$]|euro|\d\s*[.,]\d+\s*€|\/\s*hora/i.test(hito.texto), false, hito.texto);
        assert.equal(/\d{1,2}[:.]\d{2}/.test(hito.texto), false, `${hito.texto} promete una franja`);
      }

      // Y detrás del hito, el paseo: dicho, y con sus metros.
      const aPieReg = reg.pasos[reg.pasos.indexOf(hitoReg) + 1]!;
      assert.match(aPieReg.texto, /^Sal andando hacia /);
      assert.ok(aPieReg.metros > 0, 'el paseo tiene que decir cuánto se anda');

      // ⭐ Los DOS tipos son dos sitios distintos, y el gratuito anda más: en el
      //    casco no hay bordillo libre, y eso es el dato hablando.
      assert.notEqual(reg.metros, gra.metros);
      assert.ok(
        gra.tramos[1]!.metros > reg.tramos[1]!.metros,
        `el gratuito anda ${gra.tramos[1]!.metros} m y el regulado ${reg.tramos[1]!.metros}`,
      );

      // Y son los tramos que son, citados por su id.
      assert.equal(dondeAparca(reg, 'regulado'), ESRE_MOSEN_PEDRO_DOSSET);
      assert.equal(dondeAparca(gra, 'gratuito'), LIBRE_ARQUITECTO_LA_FIGUERA);
    });

    /**
     * ⭐ JUEZ 2 — `discapacitado` remata en una PMR real, con **su horario tal
     * cual**: `permanente`, en minúsculas, como el censo lo escribe.
     *
     * Normalizarlo a `PERMANENTE` sería empezar a interpretar 104 cadenas.
     */
    test('⭐ 2 · discapacitado remata en una plaza PMR real, con su horario literal', () => {
      const t = viaje(LAPUYADE_3, ABEN_AIRE_33, { aparcamiento: 'discapacitado' });
      assert.deepEqual(t.tramos.map((x) => x.comoSeVa), ['rodando', 'andando']);
      assert.equal(t.tramos[0]!.hito, 'aparca');
      const hito = t.pasos.find((x) => x.giro === 'aparca')!;
      assert.match(hito.texto, /plaza PMR \(horario: permanente\)$/);
      assert.equal(dondeAparca(t, 'discapacitado'), PMR_ECHEGARAY);
      // Es una de las 1.226 en vigor, no una retirada ni una denegada.
      assert.ok(elAparcamiento().pmr.some((x) => x.id === PMR_ECHEGARAY));
    });

    /**
     * ⭐ JUEZ 4 — LA ZBE SELECCIONABLE, con su reloj.
     *
     * Tres estados sobre el mismo viaje —`PEDRO LAPUYADE 3 → CALLE PALENCIA 2-4`,
     * que por el camino corto atraviesa el casco—:
     *
     *   · sin decir nada → entra, y lo avisa (lo de la casilla 1b).
     *   · «no puede entrar» un **martes a las 10** → **rodea** por el Puente de la
     *     Almozara: 4.304 m y 407 s, contra 4.439 m y 370 s por dentro.
     *   · lo mismo un **domingo a las 10** → **no se veta nada** y entra, con el
     *     aviso del reloj, que dice la hora que ha mirado.
     */
    test('⭐ 4 · con «no puede entrar» y dentro de la franja, la ruta rodea la zona', () => {
      const dentro = viaje(LAPUYADE_3, PALENCIA_2, undefined, MARTES_A_LAS_10);
      const rodeando = viaje(LAPUYADE_3, PALENCIA_2, { puedeEntrarEnLaZbe: false }, MARTES_A_LAS_10);

      assert.ok(pisaLaZbe(dentro), 'el caso pide un viaje que por el camino corto entre en la zona');
      assert.equal(dentro.avisos[0]!.texto, AVISO_ZBE);
      assert.equal(typeof dentro.avisos[0]!.paso, 'number');

      assert.equal(pisaLaZbe(rodeando), false, 'con el veto puesto no se pisa ni una arista de la zona');
      assert.deepEqual(rodeando.avisos, [{ texto: AVISO_ZBE_EVITADA }]);
      // ⚠️ Y el aviso NO puede decir que la ruta «rodea» nada: ver abajo.
      assert.equal(/rodea|evita/i.test(AVISO_ZBE_EVITADA), false, AVISO_ZBE_EVITADA);
      assert.ok(rodeando.metros > 0 && rodeando.pasos.length > 3, 'y hay ruta, no un aviso a secas');
      assert.ok(
        rodeando.segundos > dentro.segundos,
        `rodear tiene que costar más: ${rodeando.segundos} s contra ${dentro.segundos}`,
      );
      assert.ok(
        rodeando.pasos.some((x) => x.texto.includes('Almozara')),
        'este caso rodea por el Puente de la Almozara',
      );

      // Y con «sí puede entrar», entra: el mismo viaje, sin veto.
      const entrando = viaje(LAPUYADE_3, PALENCIA_2, { puedeEntrarEnLaZbe: true }, MARTES_A_LAS_10);
      assert.equal(pisaLaZbe(entrando), true);
      assert.equal(entrando.metros, dentro.metros);
    });

    test('⭐ 4 bis · fuera de la franja no se veta nada, y el aviso lo dice con la hora', () => {
      const domingo = viaje(LAPUYADE_3, PALENCIA_2, { puedeEntrarEnLaZbe: false }, DOMINGO_A_LAS_10);
      assert.equal(pisaLaZbe(domingo), true, 'un domingo la zona no está en vigor: no hay qué vetar');
      assert.equal(domingo.avisos.length, 1);
      const aviso = domingo.avisos[0]!;
      assert.match(aviso.texto, /pero ahora no está en vigor/);
      assert.match(aviso.texto, /de lunes a viernes de 8:00 a 20:00/);
      assert.match(aviso.texto, /son las 10:00 del domingo/);
      // Sigue siendo un aviso del DOBLE SITIO: dice a qué paso pertenece.
      assert.equal(typeof aviso.paso, 'number');
      assert.ok(domingo.pasos[aviso.paso!]);
      // Y el reloj es el que decide: `laZbeEstaEnVigor` no adivina.
      assert.equal(laZbeEstaEnVigor(MARTES_A_LAS_10), true);
      assert.equal(laZbeEstaEnVigor(DOMINGO_A_LAS_10), false);
      assert.equal(laZbeEstaEnVigor(new Date(2026, 8, 1, 7, 59)), false, 'a las 7:59 todavía no');
      assert.equal(laZbeEstaEnVigor(new Date(2026, 8, 1, 20, 0)), false, 'a las 20:00 ya no');
    });

    /**
     * ⭐ JUEZ 4 quater — EL AVISO DEL VETO **NO PUEDE PROMETER UN RODEO**.
     *
     * ⚠️ Lo cazó una medición, no una juez: con el veto puesto, el aviso salía
     *    en **178 de 178** rutas de 200 peticiones al azar — entre ellas
     *    `PEDRO LAPUYADE 3 → CAMINO DE EN MEDIO 120`, que cruza la ciudad de
     *    punta a punta **sin acercarse al casco**. Decía «la ruta rodea la Zona
     *    de Bajas Emisiones» y esa ruta no rodeaba nada.
     *
     * Lo que sí es cierto en las 178 es que **se ha buscado con la zona
     * cerrada**, y eso es lo que el aviso dice ahora. Esta juez lo compra sobre
     * el caso que lo destapó.
     */
    test('⭐ 4 quater · el aviso del veto es cierto también lejos del casco', () => {
      const lejos = viaje(LAPUYADE_3, EN_MEDIO_120, { puedeEntrarEnLaZbe: false }, MARTES_A_LAS_10);
      assert.ok(lejos.metros > 0);
      assert.equal(pisaLaZbe(lejos), false, 'este viaje no se acerca a la zona');
      // Sale el aviso —el veto se ha aplicado— y no promete ningún desvío.
      assert.deepEqual(lejos.avisos, [{ texto: AVISO_ZBE_EVITADA }]);
      assert.match(lejos.avisos[0]!.texto, /se ha buscado sin entrar/);
      // Y sin el veto, ese mismo viaje no trae aviso ninguno: la 1b, intacta.
      assert.deepEqual(viaje(LAPUYADE_3, EN_MEDIO_120).avisos, []);
    });

    /**
     * ⭐ JUEZ 4 ter — Y LA ZONA SE VETA **TAMBIÉN COMO SITIO DONDE APARCAR**.
     *
     * Vetarla solo en la búsqueda dejaría al coche aparcado dentro después de
     * haberla rodeado, que es peor que no haberla rodeado: **la sanción es por
     * estar**, no por pasar.
     *
     * El caso: `CALLE SAN VICENTE DE PAÚL 3DP` está FUERA de la zona, pero su
     * mejor aparcamiento regulado cae DENTRO. Con el veto puesto, el coche
     * aparca fuera y anda — 2.421 m de viaje en vez de los de dentro.
     */
    test('⭐ 4 ter · con el veto puesto, tampoco se aparca dentro de la zona', () => {
      const suelto = viaje(LAPUYADE_3, SAN_VICENTE_DE_PAUL_3, { aparcamiento: 'regulado' }, MARTES_A_LAS_10);
      assert.equal(
        aparcaDentroDeLaZbe(suelto),
        true,
        'el caso pide un destino cuyo mejor aparcamiento regulado caiga DENTRO',
      );

      const vetado = viaje(
        LAPUYADE_3,
        SAN_VICENTE_DE_PAUL_3,
        { aparcamiento: 'regulado', puedeEntrarEnLaZbe: false },
        MARTES_A_LAS_10,
      );
      assert.ok(vetado.metros > 0, 'sigue habiendo viaje: el destino está fuera');
      assert.equal(aparcaDentroDeLaZbe(vetado), false, 'ha aparcado dentro de la zona vetada');
      assert.deepEqual(vetado.tramos.map((x) => x.comoSeVa), ['rodando', 'andando']);
      assert.equal(vetado.tramos[0]!.hito, 'aparca');
      assert.equal(vetado.metros, 2421);
    });

    /**
     * ⭐ JUEZ 5 — UN DESTINO **DENTRO** DEL CASCO, sin poder entrar: se dice.
     *
     * `CALLE ABEN AIRE 33` está dentro de la zona. La respuesta honrada es que no
     * hay ruta en coche sin entrar, **no** una ruta que deja a alguien en el borde
     * sin avisarle de que su portal está dentro.
     *
     * ⚠️ Y vale también **con aparcamiento pedido**: aparcar fuera y andar hasta
     *    un portal de dentro sigue siendo entrar en la zona a pie —que es legal—,
     *    pero la ruta en coche no llega, y eso es lo que se contesta.
     */
    test('⭐ 5 · a un portal de dentro no se le inventa una ruta que no entra', () => {
      for (const extra of [
        { puedeEntrarEnLaZbe: false },
        { puedeEntrarEnLaZbe: false, aparcamiento: 'regulado' as const },
        { puedeEntrarEnLaZbe: false, aparcamiento: 'gratuito' as const },
      ]) {
        const t = viaje(LAPUYADE_3, ABEN_AIRE_33, extra, MARTES_A_LAS_10);
        assert.equal(t.pasos.length, 0, JSON.stringify(extra));
        assert.equal(t.geometria.length, 0);
        assert.deepEqual(t.tramos, []);
        assert.equal(t.avisos.length, 1);
        assert.match(t.avisos[0]!.texto, /No hay forma de llegar en coche sin entrar/);
        assert.match(t.avisos[0]!.texto, /queda dentro de la zona/);
      }
      // Y el mismo portal, pudiendo entrar, sí tiene ruta: el veto es del
      // distintivo, no del sitio.
      const pudiendo = viaje(LAPUYADE_3, ABEN_AIRE_33, { puedeEntrarEnLaZbe: true }, MARTES_A_LAS_10);
      assert.ok(pudiendo.metros > 0);
    });

    /**
     * ⭐ JUEZ 6 — SIN PARÁMETROS, LA RESPUESTA DE LA CASILLA 1b. Al byte.
     *
     * Las cifras son las que el checkpoint del 2/09 midió por HTTP contra el
     * motor vivo, y aquí se compran una a una. Y además se compra lo que de
     * verdad quiere decir «al byte»: que **pasar los dos campos como `undefined`
     * dé exactamente el mismo JSON** que no pasarlos.
     */
    test('⭐ 6 · sin aparcamiento ni distintivo, la respuesta es la de la 1b', () => {
      const cruzando = viaje(LAPUYADE_3, ABEN_AIRE_33);
      assert.equal(cruzando.metros, 3386);
      assert.equal(cruzando.segundos, 423);
      assert.equal(cruzando.pasos.length, 14);
      assert.equal(cruzando.geometria.length, 251);
      assert.deepEqual(cruzando.tramos.map((x) => x.comoSeVa), ['rodando']);
      assert.equal(cruzando.tramos[0]!.hito, null);
      assert.equal(cruzando.avisos.length, 1);
      assert.equal(cruzando.avisos[0]!.paso, 9);

      const sinCasco = viaje(LAPUYADE_3, EN_MEDIO_120);
      assert.equal(sinCasco.metros, 4241);
      assert.equal(sinCasco.segundos, 400);
      assert.equal(sinCasco.pasos.length, 8);
      assert.deepEqual(sinCasco.avisos, []);

      // Ausente y `undefined` son lo mismo, y tienen que serlo: es la
      // compatibilidad hacia atrás dicha en bytes.
      assert.equal(
        JSON.stringify(viaje(LAPUYADE_3, ABEN_AIRE_33, { aparcamiento: undefined, puedeEntrarEnLaZbe: undefined })),
        JSON.stringify(cruzando),
      );

      /**
       * ⭐ Y AL BYTE DE VERDAD: el sha256 de la respuesta ENTERA, medido contra
       * el commit de la casilla 1b (`8763c64`).
       *
       * ⚠️ Las claves se ordenan antes de serializar, y **esa vuelta hace
       *    falta**: el montaje del coche pasa ahora por `juntar`, como los
       *    demás modos de varios tramos, y `juntar` lista `avisos` en segundo
       *    lugar en vez de en cuarto. Ni un valor cambia — se midió el 3/09
       *    sobre 36 trayectos de los seis modos—, pero el orden de las claves
       *    de un objeto JSON sí, y eso no es parte de ninguna promesa.
       */
      assert.equal(selloDe(cruzando), '105b67ff1310534103331880501cfcbefa472c658fed083d02d4316a72f6f963');
      assert.equal(selloDe(sinCasco), 'aa2225aed85848e8f66f62c442f0b8aabde47360ae1914fb9141290dd5f1d3d8');
    });

    /**
     * ⭐ JUEZ 7 — LA MURALLA: pedir un coche con aparcamiento no mueve a nadie.
     *
     * El remate usa **el motor del peatón** —`etapaAndando`, el mismo Dijkstra y
     * el mismo cuaderno que una ruta a pie—, así que esta es la juez que caza que
     * el coche le deje el cuaderno como se lo encontró. Se pide una ruta a pie,
     * se mete un coche con parking por el medio, y se vuelve a pedir la misma.
     */
    test('⭐ 7 · el coche con aparcamiento no mueve a los otros cinco modos', () => {
      const deLosCinco = (): string =>
        JSON.stringify(
          (['andando', 'bici', 'patin', 'bizi'] as const).map((modo) =>
            calcularTrayecto(motor, {
              origen: porCodigos(LAPUYADE_3),
              destino: porCodigos(EN_MEDIO_120),
              modo,
            }),
          ),
        );
      const antes = deLosCinco();
      viaje(LAPUYADE_3, ABEN_AIRE_33, { aparcamiento: 'regulado' });
      viaje(LAPUYADE_3, PALENCIA_2, { puedeEntrarEnLaZbe: false }, MARTES_A_LAS_10);
      const despues = deLosCinco();
      assert.equal(despues, antes, 'una ruta de coche ha movido lo que contestan los demás modos');
    });
  });

});
