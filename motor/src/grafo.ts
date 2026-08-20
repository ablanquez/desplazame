/**
 * La carga del grafo. Una vez, al arrancar, y a vivir en memoria.
 *
 * Es la razón de que el motor exista como proceso persistente: 22,8 MB de
 * red no se releen en cada petición.
 *
 * **El fichero no se toca.** Es un `.js` de una sola línea —`window.GRAFO =
 * {…};`— porque así lo exportó el proyecto anterior y así se copió, byte a
 * byte. Aquí se lee como TEXTO y se le quita el prefijo **en memoria**,
 * exactamente el mismo trato que le da la pantalla. Nunca se ejecuta como
 * script.
 *
 * Y no se transforma en nada: lo que queda en memoria es lo que el fichero
 * trae. El enganche portal→arista y la auditoría del intento anterior viajan
 * dentro; no se usan, pero **tampoco se tiran** — tirarlos sería filtrar el
 * dato. Los índices de adyacencia y todo lo que haga falta para rutear son
 * del punto 6, no de aquí.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** El dato vive en app/data/, que es de donde Angular puede servirlo. */
const FICHERO = fileURLToPath(new URL('../../app/data/grafo-visor.js', import.meta.url));

/** Lo que el fichero antepone al JSON. Se quita en memoria, no en disco. */
const PREFIJO = 'window.GRAFO = ';

/**
 * Una arista, tal y como viene. Los nueve campos que trae, sin inventar
 * ninguno: se barrieron las 98.774 y ninguna lleva nada más.
 *
 * De dos de ellos **NO CONSTA el significado**, porque el fichero no trae
 * leyenda y no se rellena con lo probable:
 *
 * - `a` vale 1 en el 95,74%. Todo lo que vale 0 son autopistas, enlaces,
 *   travesías y obras (1.000 `trunk`, 693 `construction`, 584 `motorway_link`,
 *   526 `motorway`…), así que **se usa como «andable»** — la correlación es
 *   la razón, y queda escrita por si algún día resulta ser otra cosa.
 * - `d` vale 1 en solo 378, y correlaciona con `proposed`, `track` y
 *   `construction`. No es sentido único —sería muchísimo más frecuente— ni
 *   componente. **No se usa para nada.**
 */
export interface AristaCruda {
  /** Su índice, y es exactamente su posición: verificado 0…98.773. */
  readonly i: number;
  /** Sus vértices, en [lon, lat] — al revés que el contrato. */
  readonly g: readonly (readonly [number, number])[];
  /** El tipo propio del exportador: `eje-de-calzada`, `acera`, `escaleras`… */
  readonly p: string;
  /** La etiqueta `highway` de OSM. */
  readonly h: string;
  /** El id de *way* de OSM: la clave que cruza con los nombres de § 1.14. */
  readonly w: number;
  /** NO CONSTA. Ver arriba. */
  readonly d: number;
  /** Andable. Ver arriba. */
  readonly a: number;
  /** Componente conexa; 0 es la mayor (96,4% de las aristas). */
  readonly c: number;
  /** Metros. **Verificados** contra la geometría: desviación media 0,097 m. */
  readonly m: number;
}

/** El grafo tal y como viene. Se declara solo lo que este punto mira. */
export interface GrafoCrudo {
  readonly sello: string;
  readonly contadores: { readonly nodos: number; readonly aristas: number };
  readonly aristas: readonly AristaCruda[];
}

/** El grafo cargado, con lo que costó cargarlo. */
export interface GrafoEnMemoria {
  readonly grafo: GrafoCrudo;
  readonly nodos: number;
  readonly aristas: number;
  readonly vertices: number;
  readonly leidoEnMs: number;
  readonly parseadoEnMs: number;
  readonly cargadoEnMs: number;
}

export function cargarGrafo(): GrafoEnMemoria {
  const principio = performance.now();

  const t0 = performance.now();
  const texto = readFileSync(FICHERO, 'utf8');
  const leidoEnMs = performance.now() - t0;

  if (!texto.startsWith(PREFIJO)) {
    throw new Error(`el grafo no empieza por «${PREFIJO}»: ${FICHERO}`);
  }

  const t1 = performance.now();
  const grafo = JSON.parse(texto.slice(PREFIJO.length).replace(/;\s*$/, '')) as GrafoCrudo;
  const parseadoEnMs = performance.now() - t1;

  // Recuentos reales donde se pueden contar. `nodos` es el único que el
  // fichero solo declara: el grafo no trae lista de nodos.
  let vertices = 0;
  for (const arista of grafo.aristas) {
    vertices += arista.g.length;
  }

  return {
    grafo,
    nodos: grafo.contadores.nodos,
    aristas: grafo.aristas.length,
    vertices,
    leidoEnMs,
    parseadoEnMs,
    cargadoEnMs: performance.now() - principio,
  };
}
