/**
 * LA PROYECCIÓN: de un portal a un punto de la red por la que se anda.
 *
 * Un portal es una puerta, y las puertas no están sobre la calzada: están a
 * unos metros. Para poder rutear hace falta saber **en qué punto exacto de qué
 * arista** se entra a la red, y ese punto casi nunca es un nodo.
 *
 * El enganche del intento anterior se perdió —el grafo solo trae su auditoría,
 * ni id de arista ni punto proyectado (§ 1.4 del notices)—, así que se
 * construye aquí, siguiendo el patrón de **Loki**, el módulo de *snapping* de
 * Valhalla:
 *
 * - candidatas **en un radio**, no la primera que aparezca;
 * - se devuelve **la coordenada proyectada**, no el nodo más cercano;
 * - **`node_snap_tolerance`**: si la proyección cae pegada a un extremo de la
 *   arista, se usa el nodo. Valhalla trae 5 m por defecto y **se adopta ese
 *   valor**, no se inventa otro;
 * - solo se miran aristas del **subgrafo útil** (`a=1` ∧ `c=0`), que es el
 *   equivalente de su `minimum_reachability`: engancharse a una isla es
 *   engancharse a ningún sitio.
 *
 * El conector portal→proyección **no es una arista de la red**: es el trocito
 * de acera o de jardín que hay entre la puerta y la calle. Se guarda para
 * dibujarlo en la geometría de la respuesta, y sus metros **no se suman al
 * coste**, porque el que anda los anda de todos modos salga por donde salga.
 */

import type { RedNarrable } from './red.ts';

/**
 * [DOC Valhalla] `node_snap_tolerance`: *«during edge correlation this is the
 * tolerance used to determine whether to snap to the intersection rather than
 * along the street, in meters»*. Su valor por defecto es **5 metros**, y ese
 * se adopta: la doctrina del punto 7 dice adoptarlo o declarar otro, y no hay
 * ningún dato medido aquí que justifique separarse.
 */
export const NODE_SNAP_M = 5;

/**
 * Hasta dónde se busca arista. **No sale de la doctrina: sale del dato.**
 *
 * Medida la distancia de los 46.150 portales del censo a la arista más cercana
 * del subgrafo útil:
 *
 *     p50 5,5 m · p75 9,1 · p90 18,5 · p95 27,9 · p99 67,8 · p99,9 174,8
 *     máximo 244,8 m · pasan de 50 m: 753 · de 100 m: 219 · de 150 m: 81
 *
 * El p50 de 5,5 m concuerda con los 5,3 m que midió la auditoría del intento
 * anterior (§ 1.4) contra el grafo ENTERO, y esa coincidencia es lo que dice
 * que la proyección está bien hecha. La cola es más gorda que la suya porque
 * aquí se han quitado 5.271 aristas —islas y no andables—, así que lo que
 * colgaba de ellas ahora queda más lejos.
 *
 * **581 portales no encuentran arista dentro de 250 m, y no son un fallo del
 * enganche: son barrios enteros que en el grafo son islas.** Se concentran en
 * catorce vías, y 460 de los 581 son una sola —URBANIZACIÓN PEÑA ZORONGO—,
 * cuyas calles existen y son andables pero viven en la componente 39. Las
 * siguen VILLARRAPA (86 entre cuatro vías) y el entorno del MONASTERIO DE
 * SANTA FE (28).
 *
 * Por eso el radio no se sube: pasados los 250 m ya no hay una calle mal
 * medida, hay un barrio desconectado. Subirlo engancharía Peña Zorongo a la
 * primera calle del continente, a cientos de metros, y devolvería una ruta
 * mentirosa en vez de un `Aviso` honrado.
 */
export const RADIO_MAXIMO_M = 250;

/**
 * Los radios que se prueban, de menor a mayor: con 40 m resuelve el 97% y no
 * hace falta mirar más celdas.
 */
const RADIOS = [40, 120, RADIO_MAXIMO_M];

/** Radio medio de la Tierra, el mismo que usa `cercano.ts`. */
const RADIO_TIERRA_M = 6371008.8;

/** Latitud de referencia para el plano local: el centro de Zaragoza. */
const LAT_REFERENCIA = 41.65;

const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

/**
 * Metros por grado, en un plano local.
 *
 * [PROPIO] Proyectar sobre un segmento pide geometría plana, y a escala de
 * manzana la Tierra es plana: con la latitud de referencia fija, el error de
 * escala en los ±0,3° que abarca el término municipal es del orden del 0,3%,
 * que sobre los 5 m del `node_snap` son 1,5 cm. El haversine se reserva para
 * lo que se publica.
 */
const M_POR_GRADO_LAT = (Math.PI / 180) * RADIO_TIERRA_M;
const M_POR_GRADO_LON = M_POR_GRADO_LAT * Math.cos(aRadianes(LAT_REFERENCIA));

/** Un punto del plano local, en metros. */
export function aPlano(lon: number, lat: number): readonly [number, number] {
  return [lon * M_POR_GRADO_LON, lat * M_POR_GRADO_LAT];
}

/** Distancia en metros entre dos puntos, sobre el mismo plano local. */
export function metrosPlanos(
  lonA: number,
  latA: number,
  lonB: number,
  latB: number,
): number {
  const dx = (lonB - lonA) * M_POR_GRADO_LON;
  const dy = (latB - latA) * M_POR_GRADO_LAT;
  return Math.hypot(dx, dy);
}

/**
 * Dónde entra un portal a la red.
 *
 * Si `nodo` no es `null`, el `node_snap` actuó y se entra por un cruce: la
 * ruta arranca ahí y no hay que partir ninguna arista. Si es `null`, se entra
 * por dentro de la arista, y entonces hay dos salidas —hacia cada extremo— que
 * son las que obligan a probar las cuatro combinaciones.
 */
export interface Enganche {
  /** Índice en `red.aristas`. */
  readonly arista: number;
  /** Qué segmento de la geometría, y en qué fracción de él. */
  readonly segmento: number;
  readonly fraccion: number;
  /** El punto proyectado, en `[lon, lat]` como el grafo. */
  readonly lon: number;
  readonly lat: number;
  /** Metros del conector: de la puerta a la calzada. */
  readonly metros: number;
  /** El nodo al que se pegó, si el `node_snap` actuó. */
  readonly nodo: number | null;
}

/**
 * El índice espacial de la red: qué segmentos caen en cada celda.
 *
 * Sin él, enganchar un portal costaría barrer 378.222 segmentos. Con una
 * rejilla de 100 m se miran unas decenas.
 *
 * Se indexa por SEGMENTO y no por arista porque hay aristas de 11,6 km: meter
 * una de esas entera en todas las celdas de su marco sería llenar media
 * rejilla con una sola calle.
 */
export interface Rejilla {
  readonly celdas: ReadonlyMap<number, readonly number[]>;
  /** Para cada entrada del índice: a qué arista y a qué segmento pertenece. */
  readonly segArista: Int32Array;
  readonly segIndice: Int32Array;
  readonly cargadoEnMs: number;
}

/** Lado de la celda, en metros. */
const CELDA_M = 100;

/** Cuántas celdas caben en una fila. Sobra para el bbox del grafo. */
const ANCHO_REJILLA = 1 << 14;

function claveCelda(x: number, y: number): number {
  return y * ANCHO_REJILLA + x;
}

/** Construye la rejilla. Una vez, al arrancar. */
export function cargarRejilla(red: RedNarrable): Rejilla {
  const principio = performance.now();

  let cuantos = 0;
  for (const arista of red.aristas) {
    cuantos += Math.max(0, arista.g.length - 1);
  }
  const segArista = new Int32Array(cuantos);
  const segIndice = new Int32Array(cuantos);

  const celdas = new Map<number, number[]>();
  let siguiente = 0;
  for (let k = 0; k < red.aristas.length; k++) {
    const g = red.aristas[k]!.g;
    for (let j = 0; j + 1 < g.length; j++) {
      const id = siguiente++;
      segArista[id] = k;
      segIndice[id] = j;

      const [ax, ay] = aPlano(g[j]![0], g[j]![1]);
      const [bx, by] = aPlano(g[j + 1]![0], g[j + 1]![1]);
      const x0 = Math.floor(Math.min(ax, bx) / CELDA_M);
      const x1 = Math.floor(Math.max(ax, bx) / CELDA_M);
      const y0 = Math.floor(Math.min(ay, by) / CELDA_M);
      const y1 = Math.floor(Math.max(ay, by) / CELDA_M);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const clave = claveCelda(x, y);
          const lista = celdas.get(clave);
          if (lista) {
            lista.push(id);
          } else {
            celdas.set(clave, [id]);
          }
        }
      }
    }
  }

  return {
    celdas,
    segArista,
    segIndice,
    cargadoEnMs: performance.now() - principio,
  };
}

/**
 * Engancha un punto a la red: la proyección perpendicular más cercana.
 *
 * Devuelve `null` cuando no hay ninguna arista útil dentro de `RADIO_MAXIMO_M`.
 * Eso no es un error: es la respuesta para un portal que no da a esta red, y
 * arriba se convierte en un `Aviso`.
 *
 * ⭐ `admite` (29/08) acota qué aristas pueden ser candidatas, y es
 * **opcional**: sin él se engancha a la más cercana de todas, que es lo que
 * hacía antes y lo que sigue haciendo el peatón, al byte.
 *
 * Lo pide el patín. Su tabla es una lista cerrada [ORD art. 56.3], así que
 * buena parte de la calzada le está vedada — y sin filtro, la puerta de casa
 * engancharía a la avenida de 50 por la que no puede circular y la ruta
 * empezaría prohibida. El mecanismo no es nuestro: [DOC Valhalla, Loki] filtra
 * los candidatos de una localización **por el modelo de coste**, de modo que
 * una localización se pega a una arista por la que ese vehículo puede ir.
 */
export function enganchar(
  red: RedNarrable,
  rejilla: Rejilla,
  lon: number,
  lat: number,
  admite?: (arista: number) => boolean,
): Enganche | null {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }
  const [px, py] = aPlano(lon, lat);

  for (const radio of RADIOS) {
    const cx = Math.floor(px / CELDA_M);
    const cy = Math.floor(py / CELDA_M);
    const alcance = Math.ceil(radio / CELDA_M);

    let mejor: Enganche | null = null;
    let mejorMetros = Infinity;

    for (let y = cy - alcance; y <= cy + alcance; y++) {
      for (let x = cx - alcance; x <= cx + alcance; x++) {
        const lista = rejilla.celdas.get(claveCelda(x, y));
        if (!lista) {
          continue;
        }
        for (const id of lista) {
          const k = rejilla.segArista[id]!;
          if (admite && !admite(k)) {
            continue;
          }
          const j = rejilla.segIndice[id]!;
          const g = red.aristas[k]!.g;
          const [ax, ay] = aPlano(g[j]![0], g[j]![1]);
          const [bx, by] = aPlano(g[j + 1]![0], g[j + 1]![1]);

          // Proyección de P sobre el segmento AB, recortada a [0,1]: el punto
          // tiene que caer DENTRO del segmento, no en su prolongación.
          const abx = bx - ax;
          const aby = by - ay;
          const largo2 = abx * abx + aby * aby;
          const t =
            largo2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * abx + (py - ay) * aby) / largo2));
          const qx = ax + t * abx;
          const qy = ay + t * aby;
          const metros = Math.hypot(px - qx, py - qy);
          if (metros >= mejorMetros) {
            continue;
          }

          mejorMetros = metros;
          mejor = {
            arista: k,
            segmento: j,
            fraccion: t,
            lon: g[j]![0] + t * (g[j + 1]![0] - g[j]![0]),
            lat: g[j]![1] + t * (g[j + 1]![1] - g[j]![1]),
            metros,
            nodo: null,
          };
        }
      }
    }

    if (mejor && mejorMetros <= radio) {
      return conNodeSnap(red, mejor);
    }
  }
  return null;
}

/**
 * Aplica el `node_snap_tolerance`: si la proyección cayó a menos de 5 m de un
 * extremo de la arista, se entra por el nodo.
 *
 * El porqué es práctico: proyectado a 30 cm de una esquina, partir la arista
 * produce un primer «tramo» de 30 cm que luego habría que redactar como paso.
 * Pegándolo al cruce, la ruta empieza en el cruce y ya está.
 */
function conNodeSnap(red: RedNarrable, enganche: Enganche): Enganche {
  const arista = red.aristas[enganche.arista]!;
  const primero = arista.g[0]!;
  const ultimo = arista.g[arista.g.length - 1]!;

  const alPrimero = metrosPlanos(enganche.lon, enganche.lat, primero[0], primero[1]);
  const alUltimo = metrosPlanos(enganche.lon, enganche.lat, ultimo[0], ultimo[1]);

  if (alPrimero <= NODE_SNAP_M && alPrimero <= alUltimo) {
    return {
      ...enganche,
      segmento: 0,
      fraccion: 0,
      lon: primero[0],
      lat: primero[1],
      metros: metrosPlanos(enganche.lon, enganche.lat, primero[0], primero[1]) + enganche.metros,
      nodo: arista.desde,
    };
  }
  if (alUltimo <= NODE_SNAP_M) {
    return {
      ...enganche,
      segmento: arista.g.length - 2,
      fraccion: 1,
      lon: ultimo[0],
      lat: ultimo[1],
      metros: alUltimo + enganche.metros,
      nodo: arista.hasta,
    };
  }
  return enganche;
}

/**
 * Cuántos metros hay, siguiendo la geometría, desde el principio de la arista
 * hasta el punto enganchado. El resto hasta el final es la otra mitad.
 *
 * Se mide sobre la geometría y no sobre `m`, porque `m` es el total y aquí
 * hace falta el reparto. Los dos concuerdan: la desviación media entre la suma
 * de la geometría y `m` está medida en 0,097 m.
 */
export function metrosHastaElEnganche(red: RedNarrable, enganche: Enganche): number {
  const g = red.aristas[enganche.arista]!.g;
  let acumulado = 0;
  for (let j = 0; j < enganche.segmento; j++) {
    acumulado += metrosPlanos(g[j]![0], g[j]![1], g[j + 1]![0], g[j + 1]![1]);
  }
  const a = g[enganche.segmento]!;
  const b = g[enganche.segmento + 1]!;
  return acumulado + enganche.fraccion * metrosPlanos(a[0], a[1], b[0], b[1]);
}

/** Los metros de la arista, medidos sobre su geometría. */
export function metrosDeLaGeometria(g: readonly (readonly [number, number])[]): number {
  let total = 0;
  for (let j = 0; j + 1 < g.length; j++) {
    total += metrosPlanos(g[j]![0], g[j]![1], g[j + 1]![0], g[j + 1]![1]);
  }
  return total;
}
