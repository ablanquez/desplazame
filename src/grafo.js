// El grafo: componentes conexas y camino más corto.
//
// ⭐ El coste de hoy es la LONGITUD en metros, no el tiempo. El tiempo entra en H3
//    con el reloj; meterlo ahora sería inventar una velocidad de paseo y presentarla
//    como dato. Un hito no empieza hasta que el anterior cierra.

'use strict';
const { dist } = require('./geo');

/** Lista de adyacencia. `soloAPie` deja fuera las aristas por donde no se puede andar. */
function adyacencia(nodos, aristas, soloAPie = true) {
  const ady = Array.from({ length: nodos.length }, () => []);
  let usadas = 0;
  for (let i = 0; i < aristas.length; i++) {
    const e = aristas[i];
    if (soloAPie && !e.pie) continue;
    ady[e.a].push({ n: e.b, w: e.largo, e: i });
    ady[e.b].push({ n: e.a, w: e.largo, e: i });
    usadas++;
  }
  return { ady, usadas };
}

/**
 * Componentes conexas. Devuelve {comp:Int32Array, tamanos:[], n, aislados}
 * ⚠️ Los nodos SIN ninguna arista no cuentan como componente, y hay que decirlo:
 *    son nodos que existen en el terreno pero no participan de esta red (p. ej.
 *    solo tocan una autovía, que no es transitable a pie). Se devuelven aparte en
 *    `aislados` — antes se ignoraban en silencio, y eso hacía que borrar una
 *    arista colgante no moviera ningún contador. Ver bitácora nº50.
 */
function componentes(nodos, ady) {
  const comp = new Int32Array(nodos.length).fill(-1);
  const tamanos = [];
  let aislados = 0;
  for (let s = 0; s < nodos.length; s++) {
    if (ady[s].length === 0 && comp[s] === -1) aislados++;
    if (comp[s] !== -1 || ady[s].length === 0) continue;
    const c = tamanos.length;
    let n = 0;
    const pila = [s];
    comp[s] = c;
    while (pila.length) {
      const v = pila.pop(); n++;
      for (const { n: u } of ady[v]) if (comp[u] === -1) { comp[u] = c; pila.push(u); }
    }
    tamanos.push(n);
  }
  return { comp, tamanos, n: tamanos.length, aislados };
}

/**
 * Aristas de articulación (Tarjan, iterativo): las que al quitarlas parten la red.
 * Son los puntos únicos de fallo del grafo.
 *
 * ⚠️ Estaba dentro de `src/verificar.js`. Se sube aquí sin tocar una línea porque
 *    la verificación de la ciudad la necesita también, y tener dos Tarjan es tener
 *    dos verdades. La salida de `verificar.js` se comparó antes y después: idéntica.
 * ⚠️ Y la trampa que ya mordió (bitácora nº50): una articulación COLGANTE —con un
 *    extremo de grado 1— no parte nada, deja un nodo huérfano. Quien elija una para
 *    una contraprueba tiene que filtrarlas, o la prueba pasa por construcción.
 */
function articulaciones(nodos, ady) {
  const disc = new Int32Array(nodos.length).fill(-1);
  const low = new Int32Array(nodos.length).fill(0);
  const res = [];
  let t = 0;
  for (let s = 0; s < nodos.length; s++) {
    if (disc[s] !== -1 || !ady[s].length) continue;
    const pila = [[s, -1, 0]];
    disc[s] = low[s] = t++;
    while (pila.length) {
      const cima = pila[pila.length - 1];
      const [v, pe] = cima;
      if (cima[2] < ady[v].length) {
        const { n: u, e } = ady[v][cima[2]++];
        if (e === pe) continue;
        if (disc[u] === -1) { disc[u] = low[u] = t++; pila.push([u, e, 0]); }
        else low[v] = Math.min(low[v], disc[u]);
      } else {
        pila.pop();
        if (pila.length) {
          const p = pila[pila.length - 1][0];
          low[p] = Math.min(low[p], low[v]);
          if (low[v] > disc[p]) res.push(cima[1]);
        }
      }
    }
  }
  return res;
}

/** Cola de prioridad mínima (montículo binario). Sin dependencias. */
class Cola {
  constructor() { this.h = []; }
  push(p, v) { this.h.push([p, v]); let i = this.h.length - 1;
    while (i > 0) { const j = (i - 1) >> 1; if (this.h[j][0] <= this.h[i][0]) break;
      [this.h[i], this.h[j]] = [this.h[j], this.h[i]]; i = j; } }
  pop() { const t = this.h[0], u = this.h.pop();
    if (this.h.length) { this.h[0] = u; let i = 0;
      for (;;) { const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < this.h.length && this.h[l][0] < this.h[m][0]) m = l;
        if (r < this.h.length && this.h[r][0] < this.h[m][0]) m = r;
        if (m === i) break; [this.h[i], this.h[m]] = [this.h[m], this.h[i]]; i = m; } }
    return t; }
  get size() { return this.h.length; }
}

/** Dijkstra. Devuelve {dist, prev, prevArista} desde `origen`. */
function dijkstra(ady, origen) {
  const D = new Float64Array(ady.length).fill(Infinity);
  const prev = new Int32Array(ady.length).fill(-1);
  const prevA = new Int32Array(ady.length).fill(-1);
  const q = new Cola();
  D[origen] = 0; q.push(0, origen);
  while (q.size) {
    const [d, v] = q.pop();
    if (d > D[v]) continue;
    for (const { n: u, w, e } of ady[v]) {
      const nd = d + w;
      if (nd < D[u]) { D[u] = nd; prev[u] = v; prevA[u] = e; q.push(nd, u); }
    }
  }
  return { dist: D, prev, prevA };
}

/** Nodo del grafo más cercano a un punto en metros. Devuelve {nodo, d}. */
function nodoMasCercano(nodos, ady, p) {
  let mejor = -1, md = Infinity;
  for (let i = 0; i < nodos.length; i++) {
    if (ady[i].length === 0) continue;
    const d = Math.hypot(nodos[i].x - p[0], nodos[i].y - p[1]);
    if (d < md) { md = d; mejor = i; }
  }
  return { nodo: mejor, d: md };
}

/**
 * Reconstruye la ruta como lista de pasos.
 * ⭐ Devuelve DATOS, no prosa: un motor que contesta en texto no se puede
 *    comprobar automáticamente.
 */
function reconstruir(nodos, aristas, r, origen, destino) {
  if (!Number.isFinite(r.dist[destino])) return null;
  const camino = [];
  for (let v = destino; v !== origen; v = r.prev[v]) {
    if (r.prev[v] === -1) return null;
    camino.push(r.prevA[v]);
  }
  camino.reverse();
  const pasos = [];
  for (const ia of camino) {
    const e = aristas[ia];
    const ult = pasos[pasos.length - 1];
    // se agrupan tramos consecutivos del mismo way Y misma precisión.
    // ⚠️ AGRUPAR ES BORRAR: se agrupa lo IDÉNTICO, nunca lo parecido; y el
    //    contador de aristas del paso deja ver cuántas se fusionaron.
    if (ult && ult.way === e.way && ult.precision === e.precision
        && ult.unidoPorDefecto === e.unidoPorDefecto) {
      ult.metros += e.largo; ult.aristas++;
    } else {
      pasos.push({ way: e.way, highway: e.highway, precision: e.precision,
        unidoPorDefecto: e.unidoPorDefecto, metros: e.largo, aristas: 1 });
    }
  }
  for (const p of pasos) p.metros = Math.round(p.metros * 10) / 10;
  return { metros: Math.round(r.dist[destino] * 10) / 10, pasos, aristas: camino.length };
}

module.exports = { adyacencia, componentes, articulaciones, dijkstra, nodoMasCercano, reconstruir, Cola };
