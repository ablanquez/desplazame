/**
 * LA RED: el grafo crudo convertido en algo por lo que se puede caminar.
 *
 * El fichero del grafo trae 98.774 aristas sueltas con su geometría, pero **no
 * trae nodos**: solo el contador. Sin nodos no hay adyacencia, y sin adyacencia
 * no hay ruta. Aquí se reconstruyen, una vez, al arrancar.
 *
 * Tres cosas se hacen y ninguna más:
 *
 * 1. **Quedarse con el subgrafo útil** — `a=1` (andable) y `c=0` (la componente
 *    mayor). Es el estilo `minimum_reachability` de Valhalla: un candidato en
 *    una isla se descarta, porque una ruta que empieza en una isla no existe.
 * 2. **Reconstruir los nodos** por coincidencia EXACTA de coordenada entre los
 *    extremos de las aristas. Medido en la consulta del 19/08 sobre el grafo
 *    entero: 68.639 extremos distintos frente a los 68.649 que el fichero
 *    declara. Los 10 de diferencia **NO CONSTAN**: no se inventa una causa.
 * 3. **Cargar el cruce way→nombre** de `motor/data/` (§ 1.14 del notices), que
 *    es lo que permite que un paso diga «por Calle Delicias» en vez de solo
 *    «sigue recto».
 *
 * La adyacencia se guarda en **CSR** (tres arrays planos) y no en un array de
 * arrays: son ~187.000 medias aristas, y 68.639 arrays pequeños serían 68.639
 * objetos que el recolector tiene que mirar. Con CSR son tres bloques.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AristaCruda, GrafoEnMemoria } from './grafo.ts';

/** Los nombres de vía de OSM. Vive en `motor/data/`: no lo sirve el navegador. */
const NOMBRES = fileURLToPath(
  new URL('../data/2026-08-02_osm_overpass_zaragoza-termino_nombres.json', import.meta.url),
);

/** Lo que el fichero de nombres trae, de lo que aquí se mira. */
interface RespuestaOverpass {
  readonly elements: readonly { readonly id: number; readonly tags?: { readonly name?: string } }[];
}

/**
 * Una arista por la que sí se puede andar, ya con sus dos nodos puestos.
 *
 * `g` se conserva **por referencia al objeto crudo**: son 378.222 vértices en
 * total y copiarlos sería duplicar 16 MB para no cambiarles nada. Va en
 * `[lon, lat]`, como el fichero — la inversión a `[lat, lon]` ocurre una sola
 * vez, al escribir la respuesta.
 */
export interface AristaUtil {
  /** Su índice en el grafo original, que es su nombre en todas partes. */
  readonly i: number;
  readonly desde: number;
  readonly hasta: number;
  /** Metros, tal y como los trae el fichero: verificados contra la geometría. */
  readonly metros: number;
  /** Id de *way* de OSM: la clave del nombre. */
  readonly way: number;
  /** El tipo propio del exportador: `acera`, `paso-de-peatones`, `escaleras`… */
  readonly perfil: string;
  /** Sus vértices, en `[lon, lat]`. Prestados del grafo crudo. */
  readonly g: readonly (readonly [number, number])[];
}

/** La red lista para rutear, con lo que costó levantarla. */
export interface RedEnMemoria {
  readonly aristas: readonly AristaUtil[];
  readonly nodos: number;
  /** Coordenadas de cada nodo, por su id. Separadas para no crear objetos. */
  readonly nodoLon: Float64Array;
  readonly nodoLat: Float64Array;
  /** CSR: las medias aristas que salen de cada nodo. */
  readonly inicio: Int32Array;
  readonly salidaArista: Int32Array;
  readonly salidaVecino: Int32Array;
  /**
   * El cruce `w` → nombre de calle. Lleva **el fichero entero: 19.897**, no
   * solo los que el grafo usa — filtrarlo ahorraría unas pocas decenas de KB y
   * costaría poder decir «este way no está en el fichero» distinto de «este
   * way lo tiramos al cargar».
   *
   * Tres cifras que son tres cosas distintas, y conviene no confundirlas:
   * 19.897 entradas en el fichero · **15.388 de los 44.594 *ways* del subgrafo
   * útil** tienen nombre aquí · y eso son **37.397 de las 93.503 aristas**
   * (40,0%), que es la cifra de la ficha § 1.14.
   */
  readonly nombreDeWay: ReadonlyMap<number, string>;
  /** Cuántos extremos sueltos quedan (grado 1): puntas del dato, no error. */
  readonly puntasSueltas: number;
  readonly cargadoEnMs: number;
}

// Lo que la red añade al montón **NO se mide desde aquí**, y el primer intento
// dio 89 MB: mientras esta función corre, el JSON de nombres recién parseado
// sigue vivo en su propio ámbito y se cuenta. Medido desde fuera, con el
// recolector forzado a los dos lados: **11,1 MB** sobre los 115,9 del grafo.

/** La clave de un punto: su coordenada literal, tal cual la escribió el dato. */
function clave(punto: readonly [number, number]): string {
  return `${punto[0]},${punto[1]}`;
}

/**
 * Levanta la red sobre un grafo ya cargado.
 *
 * No lee el grafo del disco: lo recibe. Así el orden de arranque queda a la
 * vista en `servidor.ts` y no escondido en dos módulos que leen el mismo
 * fichero por su cuenta.
 */
export function cargarRed(memoria: GrafoEnMemoria): RedEnMemoria {
  const principio = performance.now();

  // ── 1 · El subgrafo útil ───────────────────────────────────────────────────
  const utiles: AristaCruda[] = [];
  for (const cruda of memoria.grafo.aristas) {
    if (cruda.a === 1 && cruda.c === 0) {
      utiles.push(cruda);
    }
  }

  // ── 2 · Los nodos, por coincidencia exacta de coordenada ───────────────────
  const idDeClave = new Map<string, number>();
  const lon: number[] = [];
  const lat: number[] = [];
  const nodoDe = (punto: readonly [number, number]): number => {
    const k = clave(punto);
    const ya = idDeClave.get(k);
    if (ya !== undefined) {
      return ya;
    }
    const id = lon.length;
    idDeClave.set(k, id);
    lon.push(punto[0]);
    lat.push(punto[1]);
    return id;
  };

  const aristas: AristaUtil[] = [];
  for (const cruda of utiles) {
    const primero = cruda.g[0];
    const ultimo = cruda.g[cruda.g.length - 1];
    if (!primero || !ultimo) {
      continue;
    }
    aristas.push({
      i: cruda.i,
      desde: nodoDe(primero),
      hasta: nodoDe(ultimo),
      metros: cruda.m,
      way: cruda.w,
      perfil: cruda.p,
      g: cruda.g,
    });
  }

  const nodos = lon.length;

  // ── 3 · La adyacencia en CSR ───────────────────────────────────────────────
  // Se cuenta primero cuántas salen de cada nodo, se hace la suma acumulada, y
  // se rellena. Dos pasadas, cero arrays intermedios.
  const grado = new Int32Array(nodos);
  for (const arista of aristas) {
    grado[arista.desde]!++;
    grado[arista.hasta]!++;
  }
  const inicio = new Int32Array(nodos + 1);
  for (let n = 0; n < nodos; n++) {
    inicio[n + 1] = inicio[n]! + grado[n]!;
  }
  const total = inicio[nodos]!;
  const salidaArista = new Int32Array(total);
  const salidaVecino = new Int32Array(total);
  const hueco = Int32Array.from(inicio.subarray(0, nodos));
  for (let k = 0; k < aristas.length; k++) {
    const arista = aristas[k]!;
    // Andando se anda en los dos sentidos: el grafo no trae direccionalidad
    // utilizable y a pie tampoco importaría.
    const uno = hueco[arista.desde]!++;
    salidaArista[uno] = k;
    salidaVecino[uno] = arista.hasta;
    const otro = hueco[arista.hasta]!++;
    salidaArista[otro] = k;
    salidaVecino[otro] = arista.desde;
  }

  let puntasSueltas = 0;
  for (let n = 0; n < nodos; n++) {
    if (grado[n] === 1) {
      puntasSueltas++;
    }
  }

  // ── 4 · El cruce way → nombre ──────────────────────────────────────────────
  const nombreDeWay = new Map<number, string>();
  const respuesta = JSON.parse(readFileSync(NOMBRES, 'utf8')) as RespuestaOverpass;
  for (const elemento of respuesta.elements) {
    const nombre = elemento.tags?.name;
    if (nombre) {
      nombreDeWay.set(elemento.id, nombre);
    }
  }

  return {
    aristas,
    nodos,
    nodoLon: Float64Array.from(lon),
    nodoLat: Float64Array.from(lat),
    inicio,
    salidaArista,
    salidaVecino,
    nombreDeWay,
    puntasSueltas,
    cargadoEnMs: performance.now() - principio,
  };
}
