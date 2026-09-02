/**
 * ⭐ LA RED DEL COCHE, SERVIDA (2/09, punto 12 casilla 1b).
 *
 * La casilla 1a dejó **la cocina**: `red-coche.ts` convierte los cuatro
 * ficheros crudos en un grafo dirigido con los vetos de giro dentro. Aquí no
 * se cocina nada — no se toca ni una regla de allí—: se **carga una vez**, se
 * mide, y se le pone encima lo que el viaje necesita y el cocinado no guarda.
 *
 * ── Las tres cosas que se le añaden ─────────────────────────────────────────
 *
 * **1 · LOS NOMBRES.** El cocinado guarda `way` y `highway`, no el `name`: la
 * narración los necesita y salen del mismo crudo del viario. Medido el 2/09:
 * **14.511 de las 25.242 ways rodables traen `name` (57,5 %)**, y el fichero
 * de nombres de la casa (§ 1.5) no aporta — de las 10.731 mudas rescata
 * **7**, porque es la misma fuente. Así que aquí **no hay herencia municipal**
 * y lo que no tiene nombre se narra por su tipo, como siempre.
 *
 * **2 · EL VESTIDO DE `RedNarrable`.** Proyectar un portal y escribir los
 * pasos son dos oficios de la casa que ya funcionan, y funcionan sobre una
 * forma concreta. En vez de escribir un segundo `enganchar` y un segundo
 * `escribirPasos` —que es como se acaba con dos narradores que divergen—, la
 * red del coche se **viste** de esa forma. `RedNarrable` es justo el trozo que
 * esos dos oficios miran; lo que no aplica —las cuentas de herencia del
 * peatón— no se rellena con ceros, es que no está.
 *
 * **3 · LA GEMELA.** El cocinado es DIRIGIDO: una calle de doble sentido son
 * dos aristas, una por sentido. Al enganchar un portal, la rejilla devuelve
 * una de las dos —la que caiga primero—, y salir siempre por ese sentido
 * mandaría a dar la vuelta a la manzana la mitad de las veces. `gemela` dice
 * cuál es la otra, y el viaje prueba las dos. Es la versión dirigida de las
 * «cuatro combinaciones» de `ruta.ts`.
 *
 * ── Lo que NO se hace aquí ──────────────────────────────────────────────────
 *
 * Ni se buscan rutas —eso es `viaje-coche.ts`— ni se toca el peatón, ni la
 * rueda, ni el bus: son redes distintas sobre ficheros distintos.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  cocinarRedDeCoche,
  type CrudoParaCocinar,
  type RedDeCoche,
  type WayCruda,
} from './red-coche.ts';
import { articulosDeEstosNombres, type AristaUtil, type RedNarrable } from './red.ts';
import { cargarRejilla, type Rejilla } from './proyeccion.ts';

/** Un punto en `[lon, lat]`, como el resto de la casa. */
type Punto = readonly [number, number];

// ── Los cuatro ficheros, con su ficha en THIRD-PARTY-NOTICES.md ──────────────
//
// El viario, las restricciones y los semáforos viven en `motor/data/` (§ 1.27,
// § 1.28, § 1.29): los lee el motor y solo el motor. La ZBE vive en
// `app/data/` (§ 1.30) porque es geometría municipal, como el resto del WFS.

const VIARIO = fileURLToPath(
  new URL('../data/2026-09-02_osm_overpass_zaragoza-bbox_viario-coche.json', import.meta.url),
);
const RESTRICCIONES = fileURLToPath(
  new URL('../data/2026-09-02_osm_overpass_zaragoza-bbox_restricciones-giro.json', import.meta.url),
);
const SEMAFOROS = fileURLToPath(
  new URL('../data/2026-09-02_osm_overpass_zaragoza-bbox_semaforos.json', import.meta.url),
);
const ZBE = fileURLToPath(
  new URL('../../app/data/2026-09-02_wfs_movilidad-MU1_ZBE.json', import.meta.url),
);

/** La red del coche lista para contestar, con lo que costó levantarla. */
export interface RedDeCocheServida {
  /** La cocinada de la casilla 1a, tal cual: vetos, semáforos y contadores. */
  readonly cocinada: RedDeCoche;
  /** La misma, vestida de lo que `proyeccion.ts` y `pasos.ts` saben leer. */
  readonly comoRed: RedNarrable;
  readonly rejilla: Rejilla;
  /**
   * Por arista, la que recorre **la misma geometría al revés**, o `-1` si la
   * calle es de sentido único y no la tiene.
   */
  readonly gemela: Int32Array;
  /**
   * Por nodo, las aristas que **LLEGAN** a él. El cocinado guarda las que
   * salen; para terminar un viaje en un cruce hacen falta las otras.
   */
  readonly entradas: ReadonlyMap<number, readonly number[]>;
  /** Cuántas ways traen `name` de OSM, y cuántas se quedan sin él. */
  readonly conNombre: number;
  readonly sinNombre: number;
  readonly cargadoEnMs: number;
  /** Lo que la red entera —cocinada y vestida— añade al montón. */
  readonly heapMb: number;
}

/**
 * ⭐ LA CSR DEL COCHE: por nodo, **una entrada por RAMA**, no por arista.
 *
 * La usa una sola cosa: `encrucijadaDe` en `pasos.ts`, que pregunta cuántas
 * salidas tiene un cruce sin contar aquella por la que se llegó, y si alguna
 * otra rama se llama igual. En el peatón esa cuenta sale del grado del nodo,
 * porque su grafo es **no dirigido**: una calle es una rama.
 *
 * ⚠️ Aquí no: una calle de doble sentido son DOS aristas entre los mismos dos
 *    nodos. Registrarlas las dos contaría cada rama dos veces —y peor, la
 *    gemela de la calle por la que se sigue lleva su mismo nombre, así que
 *    `otraDelMismoNombre` diría que sí siempre—. Así que se registra **una
 *    por rama**, deduplicando por `(way, el otro extremo)`.
 *
 * Y de las dos gemelas se prefiere **la que SALE del nodo**, que es la que el
 * narrador va a pasar como `aristaQueSigue` y por tanto la que sabe saltarse.
 */
function csrPorRamas(cocinada: RedDeCoche): {
  inicio: Int32Array;
  salidaArista: Int32Array;
} {
  const nodos = cocinada.nodos.length;
  const cuantas = new Int32Array(nodos);
  const vistas = new Set<string>();

  // Dos pasadas por la misma regla: primero las que salen —que son las que se
  // prefieren— y después las que llegan, que solo entran si su rama no estaba.
  const ramas: [nodo: number, arista: number][] = [];
  const anotar = (nodo: number, arista: number, otro: number, way: number): void => {
    const clave = `${nodo}|${way}|${otro}`;
    if (vistas.has(clave)) {
      return;
    }
    vistas.add(clave);
    cuantas[nodo]!++;
    ramas.push([nodo, arista]);
  };
  for (const a of cocinada.aristas) {
    anotar(a.desde, a.i, a.hasta, a.way);
  }
  for (const a of cocinada.aristas) {
    anotar(a.hasta, a.i, a.desde, a.way);
  }

  const inicio = new Int32Array(nodos + 1);
  for (let n = 0; n < nodos; n++) {
    inicio[n + 1] = inicio[n]! + cuantas[n]!;
  }
  const salidaArista = new Int32Array(ramas.length);
  const puesto = new Int32Array(nodos);
  for (const [nodo, arista] of ramas) {
    salidaArista[inicio[nodo]! + puesto[nodo]!] = arista;
    puesto[nodo]!++;
  }
  return { inicio, salidaArista };
}

/**
 * Viste la red cocinada de `RedNarrable`.
 *
 * ⚠️ **La geometría se da la vuelta aquí.** El cocinado la guarda en
 *    `[lat, lon]` —como el contrato— y toda la maquinaria de proyectar y de
 *    narrar de la casa trabaja en `[lon, lat]`, como el grafo. Se invierte una
 *    sola vez, al vestir, y no en cada consulta.
 *
 *    Y **la del cocinado se queda donde está**: `costeDeTransicion` mide el
 *    ángulo del giro con ella, y en `[lon, lat]` la sigmoide saldría del lado
 *    contrario — el `turn_bias` de `car.lua` no es simétrico, así que cambiar
 *    el orden cambiaría la penalización de izquierda por la de derecha.
 */
function vestirDeRed(
  cocinada: RedDeCoche,
  nombreDeWay: ReadonlyMap<number, string>,
): RedNarrable {
  const aristas: AristaUtil[] = cocinada.aristas.map((a) => ({
    i: a.i,
    desde: a.desde,
    hasta: a.hasta,
    metros: a.metros,
    way: a.way,
    // El `perfil` del peatón es el del exportador —`acera`, `escaleras`—, y el
    // coche no tiene ninguno: lo que tiene es el `highway` de OSM. Va ahí sin
    // traducir, y `nombreGenerico` lo resuelve igual: su tabla fina no lleva
    // ni un tipo de calzada, así que cae directa a la del `highway`.
    perfil: a.h,
    g: a.g.map(([lat, lon]) => [lon, lat] as Punto),
  }));

  const tipoDeWay = new Map<number, string>();
  for (const a of cocinada.aristas) {
    tipoDeWay.set(a.way, a.h);
  }

  const { inicio, salidaArista } = csrPorRamas(cocinada);

  return {
    aristas,
    nombreDeWay,
    tipoDeWay,
    // ⭐ VACÍO, y es un dato, no un hueco: el coche **no hereda** nombres del
    // callejero municipal. La herencia por vecindad de `ejes.ts` se midió
    // sobre el grafo del peatón y sus ways; sobre estas otras habría que
    // volver a medirla entera, y eso no es esta casilla. Lo que no tiene
    // nombre de OSM se narra por su tipo — «la calzada», «el vial de
    // servicio»—, que es lo que ya hace el peatón cuando no hereda.
    nombreHeredado: new Map(),
    articulosPropios: articulosDeEstosNombres(nombreDeWay.values()),
    inicio,
    salidaArista,
  };
}

/** Por nodo, las aristas que llegan a él: el reverso de `salidas`. */
function entradasDe(cocinada: RedDeCoche): ReadonlyMap<number, readonly number[]> {
  const entradas = new Map<number, number[]>();
  for (const a of cocinada.aristas) {
    const ya = entradas.get(a.hasta);
    if (ya) {
      ya.push(a.i);
    } else {
      entradas.set(a.hasta, [a.i]);
    }
  }
  return entradas;
}

/** El índice de la arista que va al revés por la misma geometría, o `-1`. */
function gemelasDe(cocinada: RedDeCoche): Int32Array {
  const donde = new Map<string, number>();
  for (const a of cocinada.aristas) {
    const clave = `${a.way}|${a.desde}|${a.hasta}`;
    if (!donde.has(clave)) {
      donde.set(clave, a.i);
    }
  }
  const gemela = new Int32Array(cocinada.aristas.length).fill(-1);
  for (const a of cocinada.aristas) {
    gemela[a.i] = donde.get(`${a.way}|${a.hasta}|${a.desde}`) ?? -1;
  }
  return gemela;
}

/** Lee los cuatro ficheros crudos. Se separa para poder medir la lectura. */
export function leerCrudoDelCoche(): CrudoParaCocinar {
  const leer = (ruta: string): unknown => JSON.parse(readFileSync(ruta, 'utf8'));
  return {
    viario: leer(VIARIO),
    restricciones: leer(RESTRICCIONES),
    semaforos: leer(SEMAFOROS),
    zbe: leer(ZBE),
  } as CrudoParaCocinar;
}

/**
 * Carga la red del coche entera: lee, cocina, viste y mide. **Una vez.**
 *
 * El crudo del viario son 19,9 MB de JSON y se suelta en cuanto se ha cocinado:
 * lo que se queda vivo es la red. Por eso el montón se mide **después** de
 * salir de aquí, y no dentro — dentro, el JSON recién parseado sigue contando.
 */
export function cargarRedDeCoche(): RedDeCocheServida {
  const principio = performance.now();
  const antes = process.memoryUsage().heapUsed;

  const crudo = leerCrudoDelCoche();
  const cocinada = cocinarRedDeCoche(crudo);

  const nombreDeWay = new Map<number, string>();
  let sinNombre = 0;
  for (const w of crudo.viario.elements as readonly WayCruda[]) {
    const nombre = w.tags?.['name'];
    if (nombre === undefined) {
      sinNombre++;
    } else {
      nombreDeWay.set(w.id, nombre);
    }
  }

  const comoRed = vestirDeRed(cocinada, nombreDeWay);
  return {
    cocinada,
    comoRed,
    rejilla: cargarRejilla(comoRed),
    gemela: gemelasDe(cocinada),
    entradas: entradasDe(cocinada),
    conNombre: nombreDeWay.size,
    sinNombre,
    cargadoEnMs: performance.now() - principio,
    heapMb: (process.memoryUsage().heapUsed - antes) / 1048576,
  };
}

/**
 * ⭐ LA RED SERVIDA, como la del bus: **una sola copia por proceso**.
 *
 * Va en una variable de módulo y no dentro de `Motor` por lo mismo que la del
 * bus: solo la mira un modo, pesa lo que pesa, y meterla en `Motor` obligaría
 * a que cada juez de la rueda o del peatón la levantara para construir su
 * motor de mentira.
 *
 * Se carga **la primera vez que alguien la pide** y se queda. El servidor la
 * pide al arrancar para que la primera ruta no la pague y para poder decir en
 * el log lo que costó; una juez que solo mire el peatón no la levanta nunca.
 */
let servida: RedDeCocheServida | null = null;

export function laRedDeCoche(): RedDeCocheServida {
  servida ??= cargarRedDeCoche();
  return servida;
}
