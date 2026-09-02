/**
 * LA RED: el grafo crudo convertido en algo por lo que se puede caminar.
 *
 * El fichero del grafo trae 98.774 aristas sueltas con su geometría, pero **no
 * trae nodos**: solo el contador. Sin nodos no hay adyacencia, y sin adyacencia
 * no hay ruta. Aquí se reconstruyen, una vez, al arrancar.
 *
 * Tres cosas se hacen y ninguna más:
 *
 * 1. **Quedarse con el subgrafo por el que el peatón puede andar** — `a=1`
 *    (andable), `c=0` (la componente mayor) **y la tabla de acceso por tipo**
 *    (`andando.ts`). Los dos primeros son estilo `minimum_reachability` de
 *    Valhalla: un candidato en una isla se descarta, porque una ruta que
 *    empieza en una isla no existe. El tercero es la ley: por el carril bici
 *    no se anda, y cerrarlo aquí —al construir la red, no al rutear— es lo que
 *    hacen las dos implementaciones de referencia.
 * 2. **Reconstruir los nodos** por coincidencia EXACTA de coordenada entre los
 *    extremos de las aristas. Medido en la consulta del 19/08 sobre el grafo
 *    entero: 68.639 extremos distintos frente a los 68.649 que el fichero
 *    declara. Los 10 de diferencia **NO CONSTAN**: no se inventa una causa.
 * 3. **Cargar el cruce way→nombre** de `motor/data/` (§ 1.14 del notices), que
 *    es lo que permite que un paso diga «por Calle Delicias» en vez de solo
 *    «sigue recto». Y donde OSM no nombró nada —el 60 %—, **heredar el nombre
 *    municipal por vecindad** contra los ejes de vía (§ 1.15, y `ejes.ts`).
 *
 * La adyacencia se guarda en **CSR** (tres arrays planos) y no en un array de
 * arrays: son ~187.000 medias aristas, y 68.639 arrays pequeños serían 68.639
 * objetos que el recolector tiene que mirar. Con CSR son tres bloques.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AristaCruda, GrafoEnMemoria } from './grafo.ts';
import { ACCESO_ANDANDO, puedeAndar } from './andando.ts';
import { heredarNombres, type Herencias } from './ejes.ts';
// `nucleoDe` viene de `pasos.ts`, y no hay ciclo: `pasos.ts` solo importa de
// aquí un **tipo**, que Node borra al ejecutar. Su única dependencia de valor
// es `proyeccion.ts`, que tampoco importa valores de la red.
import { nucleoDe, type ArticulosPropios } from './pasos.ts';

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
   * útil** tienen nombre aquí · y eso son **35.124 de las 89.047 aristas**
   * (39,4%). Eran 37.397 de 93.503 (40,0%) antes de que la tabla de acceso
   * cerrara el carril bici: las 2.273 que faltan son carril CON nombre.
   */
  readonly nombreDeWay: ReadonlyMap<number, string>;
  /**
   * El cruce `w` → `highway` de OSM: **el TIPO REAL de la vía**.
   *
   * Existe porque sin él no se puede decir la verdad de lo que no tiene
   * nombre. El perfil propio del exportador (`p`) mete en el mismo saco
   * —`eje-de-calzada`— cosas que no son lo mismo: **4.671 de las 4.675
   * aristas `cycleway` del grafo lo llevan**, y con solo `p` a la vista un
   * carril bici se anunciaba como «la calzada». Entrada nº7 de la bitácora.
   *
   * Va como `Map` por `w` y no como campo de cada arista **porque `h` es
   * constante dentro de un *way*** — verificado: 0 de las 98.774 aristas
   * discrepan del `h` de su way—. Así son 47.758 entradas en vez de 89.047
   * punteros, y queda simétrico con `nombreDeWay`, que se llena igual y se
   * consulta igual.
   *
   * Lleva **los 47.758 ways del grafo entero**, no solo los del subgrafo
   * útil: mismo criterio que `nombreDeWay`, poder distinguir «este way no
   * está» de «este way lo tiramos al cargar».
   */
  readonly tipoDeWay: ReadonlyMap<number, string>;
  /**
   * El cruce `w` → **nombre MUNICIPAL heredado por vecindad**.
   *
   * Solo lleva *ways* que **no** están en `nombreDeWay`: lo heredado nunca
   * pisa lo que OSM sí nombró. De dónde sale y con qué puertas, en `ejes.ts`.
   */
  readonly nombreHeredado: ReadonlyMap<number, string>;
  /** Lo que costó heredar, y con qué números. Se publica en `/api/salud`. */
  readonly herencias: Herencias;
  /**
   * El cruce **núcleo → artículos que OpenStreetMap escribe en mayúscula**.
   *
   * Existe porque el censo municipal publica todo en mayúscula y ahí no se ve
   * la diferencia entre `CALLE EL COLOSO` —el cuadro de Goya, artículo del
   * nombre propio— y `CALLE LA FUENTE`, donde el artículo solo acompaña. OSM
   * escribe en caso mixto y sí la marca, así que se le pregunta a él.
   *
   * Se usa **solo al escribir un paso**; no interviene en ninguna comparación.
   */
  readonly articulosPropios: ArticulosPropios;
  /**
   * ⭐ Cuántas aristas dejó fuera la **tabla de acceso** — y de qué tipo.
   *
   * Cuenta solo sobre las que ya habían pasado `a=1 ∧ c=0`: es el precio de la
   * tabla, aislado de los otros dos filtros. Se publica porque una red que
   * encoge sin que nadie lo note es justo lo que la tabla no quiere ser.
   */
  readonly cerradasPorTipo: ReadonlyMap<string, number>;
  /**
   * De esas, cuántas cayeron por **no tener fila en la tabla** en vez de por
   * una prohibición declarada. **Tiene que ser 0**: si sube, es que el dato
   * trae un tipo nuevo que nadie ha decidido, y hay que decidirlo.
   */
  readonly sinFilaEnLaTabla: number;
  /** Cuántos extremos sueltos quedan (grado 1): puntas del dato, no error. */
  readonly puntasSueltas: number;
  readonly cargadoEnMs: number;
}

/**
 * ⭐ LO QUE HACE FALTA PARA PROYECTAR Y PARA NARRAR — y nada más.
 *
 * Es `RedEnMemoria` menos todo lo que solo sirve para contarla: las cuentas de
 * carga, la herencia municipal medida, las puntas sueltas. `proyeccion.ts`,
 * los ayudantes de `ruta.ts` y `pasos.ts` piden esto en vez de la red entera,
 * y **no cambia una sola operación**: `RedEnMemoria` lo cumple, así que los
 * cinco modos que ya llamaban ahí siguen llamando igual.
 *
 * Existe porque el coche (2/09) trae **otra red** —la cocinada de la casilla
 * 1a, con sus aristas dirigidas— y quiere la misma narración. Sin esto habría
 * que rellenarle a mano las cuentas del peatón con ceros inventados, que es
 * justo lo que esta casa no hace: un `herencias` de mentira diría que el coche
 * heredó nombres del callejero municipal, y no hereda ninguno.
 */
export type RedNarrable = Pick<
  RedEnMemoria,
  | 'aristas'
  | 'nombreDeWay'
  | 'tipoDeWay'
  | 'nombreHeredado'
  | 'articulosPropios'
  | 'inicio'
  | 'salidaArista'
>;

// Lo que la red añade al montón **NO se mide desde aquí**, y el primer intento
// dio 89 MB: mientras esta función corre, el JSON de nombres recién parseado
// sigue vivo en su propio ámbito y se cuenta. Medido desde fuera, con el
// recolector forzado a los dos lados: **11,1 MB** sobre los 115,9 del grafo.

/** Los cuatro artículos que pueden formar parte de un nombre propio. */
const ARTICULOS: ReadonlySet<string> = new Set(['EL', 'LA', 'LOS', 'LAS']);

/**
 * ⭐ QUÉ ARTÍCULOS ESCRIBE OSM EN MAYÚSCULA, por núcleo de nombre.
 *
 * Solo los INTERMEDIOS: el que abre un nombre va alto siempre y no dice nada.
 *
 * Sale de dentro de `cargarRed` el 2/09 **sin cambiar una sola operación**: lo
 * pide la red del coche, que trae sus propios nombres de OSM y quiere la misma
 * respuesta. Se saca en vez de copiarse porque dos tablas de artículos que
 * deberían ser una acabarían no siéndolo, y la diferencia no daría ningún
 * error: solo un «Calle El Coloso» escrito de dos maneras según el modo.
 */
export function articulosDeEstosNombres(nombres: Iterable<string>): ArticulosPropios {
  const articulosPropios = new Map<string, Set<string>>();
  for (const nombre of nombres) {
    const palabras = nombre.split(/[^\p{L}\p{N}]+/u).filter((palabra) => palabra !== '');
    let nucleo: string | null = null;
    for (let k = 1; k < palabras.length; k++) {
      const palabra = palabras[k]!;
      const comparable = palabra
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
      if (!ARTICULOS.has(comparable) || palabra === palabra.toLowerCase()) {
        continue;
      }
      nucleo ??= nucleoDe(nombre);
      if (nucleo === '') {
        break;
      }
      const ya = articulosPropios.get(nucleo);
      if (ya) {
        ya.add(comparable);
      } else {
        articulosPropios.set(nucleo, new Set([comparable]));
      }
    }
  }
  return articulosPropios;
}

/** La clave de un punto: su coordenada literal, tal cual la escribió el dato. */
function clave(punto: readonly [number, number]): string {
  return `${punto[0]},${punto[1]}`;
}

/**
 * ⭐ EL TEJIDO: aristas sueltas → nodos y adyacencia. Sin acceso ni coste.
 *
 * Sale de dentro de `cargarRed` el 29/08 **sin cambiar una sola operación**:
 * lo pide la red de la rueda, que se levanta sobre otro subconjunto de las
 * mismas aristas crudas y necesita reconstruir sus nodos exactamente igual.
 * Se saca en vez de copiarse porque dos reconstrucciones de nodos que
 * deberían ser una acabarían no siéndolo — y una diferencia ahí no daría
 * ningún error, solo dos redes que no se parecen.
 *
 * Los nodos salen por **coincidencia EXACTA de coordenada** entre los extremos
 * de las aristas, y la adyacencia va en **CSR** (tres arrays planos): son
 * ~187.000 medias aristas, y un array por nodo serían 68.639 objetos que el
 * recolector tiene que mirar.
 */
export interface Tejido {
  readonly aristas: readonly AristaUtil[];
  readonly nodos: number;
  readonly nodoLon: Float64Array;
  readonly nodoLat: Float64Array;
  readonly inicio: Int32Array;
  readonly salidaArista: Int32Array;
  readonly salidaVecino: Int32Array;
  /** Cuántos extremos sueltos quedan (grado 1): puntas del dato, no error. */
  readonly puntasSueltas: number;
}

export function tejerLaRed(utiles: readonly AristaCruda[]): Tejido {
  // ── Los nodos, por coincidencia exacta de coordenada ──────────────────────
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

  // ── La adyacencia en CSR ──────────────────────────────────────────────────
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
    // ⭐ Las DOS medias aristas se meten siempre, también en la red de la
    // rueda: el CSR describe la topología, no el permiso. **El sentido único
    // no se resuelve quitando media arista**, sino mirando al relajar si el
    // salto va de `desde` a `hasta` o al revés — que es dato que la media
    // arista ya lleva. Quitarla aquí dejaría al enganche sin poder decir por
    // qué extremo entra un portal a una calle de sentido único.
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

  return {
    aristas,
    nodos,
    nodoLon: Float64Array.from(lon),
    nodoLat: Float64Array.from(lat),
    inicio,
    salidaArista,
    salidaVecino,
    puntasSueltas,
  };
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

  // ── 1 · El subgrafo por el que el peatón puede andar ───────────────────────
  // El orden importa para contar: `cerradasPorTipo` cuenta solo las que la
  // tabla de acceso quita de lo que **iba a entrar**, no las que ya sobraban
  // por `a` o por `c`. Sin ese orden, la cifra mezclaría tres motivos.
  const utiles: AristaCruda[] = [];
  const cerradasPorTipo = new Map<string, number>();
  let sinFilaEnLaTabla = 0;
  for (const cruda of memoria.grafo.aristas) {
    if (cruda.a !== 1 || cruda.c !== 0) {
      continue;
    }
    if (!puedeAndar(cruda.h)) {
      cerradasPorTipo.set(cruda.h, (cerradasPorTipo.get(cruda.h) ?? 0) + 1);
      if (!(cruda.h in ACCESO_ANDANDO)) {
        sinFilaEnLaTabla++;
      }
      continue;
    }
    utiles.push(cruda);
  }

  // ── 2 y 3 · Los nodos y la adyacencia ──────────────────────────────────────
  // Andando se anda en los dos sentidos, y el tejido los mete los dos: el grafo
  // no trae direccionalidad utilizable y a pie tampoco importaría.
  const { aristas, nodos, nodoLon, nodoLat, inicio, salidaArista, salidaVecino, puntasSueltas } =
    tejerLaRed(utiles);

  // ── 4 · El cruce way → nombre ──────────────────────────────────────────────
  const nombreDeWay = new Map<number, string>();
  const respuesta = JSON.parse(readFileSync(NOMBRES, 'utf8')) as RespuestaOverpass;
  for (const elemento of respuesta.elements) {
    const nombre = elemento.tags?.name;
    if (nombre) {
      nombreDeWay.set(elemento.id, nombre);
    }
  }

  // ── 5 · El cruce way → tipo real ───────────────────────────────────────────
  // Sale del grafo, no del fichero de nombres: lo llevan TODAS las aristas,
  // también las mudas — que son justo las que lo necesitan.
  const tipoDeWay = new Map<number, string>();
  for (const cruda of memoria.grafo.aristas) {
    tipoDeWay.set(cruda.w, cruda.h);
  }

  // ── 5 bis · Qué artículos son nombre propio, según OSM ─────────────────────
  // Se recorre el fichero de nombres una vez más y se anota, por núcleo, qué
  // artículos intermedios lleva OSM en mayúscula. Solo los intermedios: el que
  // abre el nombre va alto siempre y no dice nada.
  const articulosPropios = articulosDeEstosNombres(
    respuesta.elements
      .map((elemento) => elemento.tags?.name)
      .filter((nombre) => nombre !== undefined),
  );

  // ── 6 · La herencia por vecindad ───────────────────────────────────────────
  // Va la última porque necesita las aristas ya filtradas y los nombres de OSM
  // ya cargados: hereda EL QUE NO TIENE, y para saber quién no tiene hay que
  // haber leído antes quién sí. El índice de ejes nace y muere ahí dentro.
  const herencias = heredarNombres({ aristas, nombreDeWay });

  return {
    aristas,
    nodos,
    nodoLon,
    nodoLat,
    inicio,
    salidaArista,
    salidaVecino,
    nombreDeWay,
    tipoDeWay,
    nombreHeredado: herencias.nombreHeredado,
    herencias,
    articulosPropios,
    cerradasPorTipo,
    sinFilaEnLaTabla,
    puntasSueltas,
    cargadoEnMs: performance.now() - principio,
  };
}
