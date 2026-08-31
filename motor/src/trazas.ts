/**
 * ⭐ LA TRAZA DE UN PATRÓN, CORTADA POR SALTOS.
 *
 * ── El problema, con su nombre ──────────────────────────────────────────────
 *
 * El feed trae dos cosas que no vienen unidas: la **secuencia de paradas** de un
 * viaje (`stop_times`) y la **traza que dibuja el vehículo** (`shapes.txt`).
 * Entre las dos no hay ningún puente… salvo `shape_dist_traveled`, que diría a
 * qué metro de la traza cae cada parada.
 *
 * ⚠️ **Y en este feed ese puente no existe: 0 de 27.603 filas de `shapes.txt`
 * lo traen** (medido el 31/08). Así que hay que construirlo.
 *
 * [DOC OpenTripPlanner, `TripPattern`] la geometría de un patrón es **la
 * concatenación de las geometrías de sus saltos** (*hop geometries*), y sin
 * `shape_dist_traveled` cada parada **se proyecta sobre la traza** y se corta
 * entre proyecciones consecutivas. [Google Transit Partners] lo dice con las
 * mismas palabras: casar cada parada con *«su mejor posición a lo largo de la
 * traza»*.
 *
 * ── ⭐ POR QUÉ MONÓTONA Y NO «LA MÁS CERCANA» ───────────────────────────────
 *
 * Los bucles y las idas y vueltas por la misma calle son **la parte difícil**, y
 * no es teoría: en esta red, **31 de los 170 patrones** tienen alguna parada
 * cuya proyección más cercana cae en el paso de vuelta y no en el de ida. El
 * peor es la línea 117 (`117|0|1`, 120 paradas), donde el vecino más cercano
 * hace que la traza **salte 42 km hacia atrás** en mitad del recorrido.
 *
 * Por eso no se proyecta cada parada por su cuenta: se busca **la asignación
 * monótona de coste mínimo** —programación dinámica, con la restricción de que
 * la posición de la parada `i` nunca es anterior a la de la `i−1`—. Es el mismo
 * problema que casar dos secuencias en orden, y se resuelve igual.
 *
 * ── La reserva, declarada ───────────────────────────────────────────────────
 *
 * [Best practice del validador] una parada tiene que estar **a 100 m o menos**
 * de la traza de su viaje. Medido aquí: **3.532 proyecciones, la peor a 40,9 m**
 * y **ninguna** por encima de 100. Si alguna se pasara —otro feed, otro día—,
 * ese salto cae a **recta entre las dos paradas** y se dice: [OTP #2987] la
 * recta es una reserva legítima, pero **nunca silenciosa**.
 */
import type { Vertice } from '@desplazame/tipos';
import { metrosEntre } from './cercano.ts';

/** Una traza: la polilínea de `shapes.txt`, en `[lat, lon]` como el contrato. */
export type Traza = readonly Vertice[];

/**
 * ⭐ Hasta dónde puede estar una parada de su traza. **100 m** [best practice
 * del validador de GTFS]. Más allá, la traza no es la de ese viaje: dibujarla
 * sería enseñar un recorrido que ese autobús no hace.
 */
export const MAXIMO_DESVIO_M = 100;

/**
 * ⭐ Con cuántos decimales se guarda cada punto. **Seis: 0,11 m.**
 *
 * El feed los da con quince —`41.6380326942548`—, que es una precisión de
 * micras sobre un dato que no la tiene: las propias paradas se desvían de su
 * traza una **mediana de 5,4 m**. Redondear a seis quita 94 KB del cocinado sin
 * mover un píxel en pantalla; a cinco (1,1 m) empezaría a notarse en una curva
 * cerrada al máximo zoom.
 */
export const DECIMALES = 6;

/** Dónde cae una parada sobre una traza. */
export interface Proyeccion {
  /** Índice del segmento que la recibe: entre `traza[i]` y `traza[i + 1]`. */
  readonly i: number;
  /** Dónde dentro de ese segmento, de 0 a 1. */
  readonly t: number;
  /** Metros desde el principio de la traza. Es lo que hace la monotonía medible. */
  readonly s: number;
  /** Metros de la parada a su proyección. Es lo que se compara con los 100. */
  readonly desvio: number;
}

/** Los metros acumulados hasta cada vértice. Haversine, el de la casa. */
export function acumulados(traza: Traza): number[] {
  const a = [0];
  for (let i = 1; i < traza.length; i++) {
    a.push(a[i - 1]! + metrosEntre(traza[i - 1]![0], traza[i - 1]![1], traza[i]![0], traza[i]![1]));
  }
  return a;
}

/**
 * Un plano local en metros, anclado a una latitud.
 *
 * Proyectar un punto sobre un segmento es geometría de plano, y en grados no se
 * puede hacer: un grado de longitud en Zaragoza mide 0,75 de uno de latitud, y
 * sin corregirlo el pie de la perpendicular sale torcido. A escala de ciudad la
 * equirrectangular local se separa del haversine muy por debajo del metro.
 */
function planoEn(lat0: number): (v: Vertice) => readonly [number, number] {
  const RAD = Math.PI / 180;
  const R = 6371008.8;
  const kx = Math.cos(lat0 * RAD) * R * RAD;
  const ky = R * RAD;
  return ([lat, lon]) => [lon * kx, lat * ky];
}

/**
 * ⭐ LA PROYECCIÓN MONÓTONA de una secuencia de paradas sobre una traza.
 *
 * Programación dinámica: `mejor[i][j]` es el coste mínimo de colocar las
 * paradas `0..i` acabando en el segmento `j`, y sale de sumar la distancia de
 * la parada `i` al segmento `j` con **el mejor de los `j' ≤ j`** de la fila
 * anterior. Ese «≤ j» es toda la monotonía, y se calcula en una pasada con un
 * mínimo de prefijo: el coste total es `O(paradas × segmentos)`.
 *
 * Se minimiza la suma de distancias **al cuadrado** —mínimos cuadrados de toda
 * la vida—: penaliza más un desvío grande que dos pequeños, que es justo lo que
 * se quiere cuando una parada podría irse a la calle de al lado.
 */
export function proyectarMonotono(traza: Traza, paradas: readonly Vertice[]): Proyeccion[] {
  const segmentos = traza.length - 1;
  if (segmentos < 1 || paradas.length === 0) {
    return [];
  }
  const acum = acumulados(traza);
  const aPlano = planoEn(traza[0]![0]);
  const P = traza.map(aPlano);
  const S = paradas.map(aPlano);

  /** El pie de la perpendicular de `p` sobre el segmento `j`, y su distancia². */
  const sobre = (j: number, p: readonly [number, number]): { t: number; d2: number } => {
    const [ax, ay] = P[j]!;
    const [bx, by] = P[j + 1]!;
    const dx = bx - ax;
    const dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    // Un segmento de largo cero —dos puntos repetidos en el feed— no tiene
    // dirección: el pie es su propio vértice.
    const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / largo2));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    return { t, d2: (p[0] - qx) ** 2 + (p[1] - qy) ** 2 };
  };

  const deDonde = new Int32Array(paradas.length * segmentos).fill(-1);
  let previa = new Float64Array(segmentos);
  for (let j = 0; j < segmentos; j++) {
    previa[j] = sobre(j, S[0]!).d2;
  }
  for (let i = 1; i < paradas.length; i++) {
    const fila = new Float64Array(segmentos);
    let mejor = Infinity;
    let arg = -1;
    for (let j = 0; j < segmentos; j++) {
      // El mínimo de prefijo de la fila anterior, hasta `j` INCLUSIVE: dos
      // paradas pueden caer en el mismo segmento (dos postes en la misma recta).
      if (previa[j]! < mejor) {
        mejor = previa[j]!;
        arg = j;
      }
      fila[j] = sobre(j, S[i]!).d2 + mejor;
      deDonde[i * segmentos + j] = arg;
    }
    previa = fila;
  }

  let ultimo = 0;
  for (let j = 1; j < segmentos; j++) {
    if (previa[j]! < previa[ultimo]!) {
      ultimo = j;
    }
  }
  const js = new Array<number>(paradas.length);
  js[paradas.length - 1] = ultimo;
  for (let i = paradas.length - 1; i > 0; i--) {
    js[i - 1] = deDonde[i * segmentos + js[i]!]!;
  }

  const salida: Proyeccion[] = [];
  let anterior = -1;
  for (let i = 0; i < paradas.length; i++) {
    const j = js[i]!;
    const { t, d2 } = sobre(j, S[i]!);
    // ⚠️ La DP garantiza que los SEGMENTOS no retroceden, no que no retroceda
    // el metro exacto: dos paradas en el mismo segmento pueden salir al revés.
    // Aquí se aplasta ese caso, que es el único que queda.
    const s = Math.max(anterior, acum[j]! + t * (acum[j + 1]! - acum[j]!));
    anterior = s;
    salida.push({ i: j, t, s, desvio: Math.sqrt(d2) });
  }
  return salida;
}

/** Redondea un punto a `DECIMALES`. Ver por qué son seis. */
export function redondear([lat, lon]: Vertice): Vertice {
  return [Number(lat.toFixed(DECIMALES)), Number(lon.toFixed(DECIMALES))];
}

/** El punto exacto donde cae una proyección. */
export function puntoEn(traza: Traza, p: Proyeccion): Vertice {
  const [laA, loA] = traza[p.i]!;
  const [laB, loB] = traza[p.i + 1]!;
  return [laA + (laB - laA) * p.t, loA + (loB - loA) * p.t];
}

/** Un trozo de traza, con sus metros por el asfalto. */
export interface Trozo {
  readonly geometria: readonly Vertice[];
  readonly metros: number;
}

/**
 * ⭐ EL CORTE entre dos proyecciones: de una parada a la siguiente.
 *
 * Empieza **en el pie de la primera** y acaba **en el de la segunda**, con los
 * vértices de la traza que quedan en medio. Los dos extremos son puntos
 * calculados, no vértices del feed: por eso el fin de un salto y el principio
 * del siguiente son **exactamente el mismo punto**, que es lo que hace que la
 * concatenación no deje huecos.
 */
export function cortar(traza: Traza, a: Proyeccion, b: Proyeccion): Trozo {
  const geometria: Vertice[] = [redondear(puntoEn(traza, a))];
  for (let j = a.i + 1; j <= b.i; j++) {
    geometria.push(redondear(traza[j]!));
  }
  geometria.push(redondear(puntoEn(traza, b)));
  return { geometria, metros: Math.max(0, b.s - a.s) };
}

/**
 * ⭐ LA RESERVA: la recta entre dos paradas, cuando la traza no sirve.
 *
 * [OTP #2987] la recta vale como reserva **declarada**. Quien la usa lo marca,
 * y por eso el salto lleva su `recta: true`: una recta silenciosa se lee como
 * un recorrido y no lo es.
 */
export function rectaEntre(a: Vertice, b: Vertice): Trozo {
  return { geometria: [redondear(a), redondear(b)], metros: metrosEntre(a[0], a[1], b[0], b[1]) };
}
