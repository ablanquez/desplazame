// El grafo: componentes conexas y camino más corto.
//
// ⭐ El coste de hoy es la LONGITUD en metros, no el tiempo. El tiempo entra en H3
//    con el reloj; meterlo ahora sería inventar una velocidad de paseo y presentarla
//    como dato. Un hito no empieza hasta que el anterior cierra.

'use strict';
const { dist } = require('./geo');

/**
 * Lista de adyacencia. `soloAPie` deja fuera las aristas por donde no se puede andar.
 * ⭐ `sinCondicionales` deja fuera además los PASOS CONDICIONALES: sitios por los
 *    que se puede andar pero no siempre —un pasaje bajo un edificio, un pasillo
 *    interior, un ascensor—. Siguen en el grafo porque existen; simplemente el
 *    enrutador no cuenta con ellos. Decisión de Antonio: se ignoran para calcular,
 *    pero se marcan y se cuentan.
 */
function adyacencia(nodos, aristas, soloAPie = true, sinCondicionales = false) {
  const ady = Array.from({ length: nodos.length }, () => []);
  let usadas = 0;
  for (let i = 0; i < aristas.length; i++) {
    const e = aristas[i];
    if (soloAPie && !e.pie) continue;
    if (sinCondicionales && e.condicional) continue;
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
        nombreNoAplica: e.nombreNoAplica,
        unidoPorDefecto: e.unidoPorDefecto, metros: e.largo, aristas: 1 });
    }
  }
  for (const p of pasos) p.metros = Math.round(p.metros * 10) / 10;
  return { metros: Math.round(r.dist[destino] * 10) / 10, pasos, aristas: camino.length };
}

// ═══════════════════════════════════════════════════════════════════════════
// EL MOTOR CON NODOS TEMPORALES — consecuencia directa de P4.5
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ Esto VIVÍA EN `src/rutas-antonio.js`, y ahí era un segundo motor: `ruta.js`
//    enganchaba al NODO más cercano y las siete rutas de Antonio enganchaban a la
//    ARISTA más cercana. Dos caminos de código desde el mismo dato, que es
//    exactamente la forma del fallo nº68 (medir una cosa y que el motor use otra).
//    Se sube aquí para que haya UN motor. La salida de las siete se comparó antes
//    y después del traslado.
//
// ⭐ Y la diferencia entre enganchar a nodo o a arista NO es cosmética, está
//    medida sobre los 46.150 portales reales:
//        a la ARISTA   mediana  5,3 m   p99   65,2 m   máximo 303,1 m
//        al NODO       mediana 24,4 m   p99  197,3 m   máximo 566,6 m
//    Enganchar al nodo mete hasta medio kilómetro de error antes de empezar.

/**
 * La distancia andando POR la arista `e` desde su origen hasta el punto `p`.
 * ⭐ Estaba escrita dentro de `insertar` y sale aquí porque el arreglo de la tanda
 *    8 la necesita en dos sitios. ⛔ No es un «ya que estoy»: dejarla duplicada
 *    sería tener dos copias de la misma aritmética, que es la forma exacta del
 *    fallo nº68 (medir una cosa y que el motor use otra).
 * ⚠️ El resultado es idéntico al de antes, línea a línea. Lo que lo demuestra no
 *    es este comentario: son los 26 congelados y las diez rutas de Antonio.
 */
function alLargoDeLaArista(e, p) {
  let a = 0;
  for (let k = 0; k < p.seg; k++) a += dist(e.pts[k], e.pts[k + 1]);
  return a + p.t * dist(e.pts[p.seg], e.pts[p.seg + 1]);
}

/**
 * Inserta un punto de enganche {arista, seg, t, q} como NODO TEMPORAL, partiendo
 * la arista solo para esta consulta.
 * ⭐ Es la consecuencia de P4.5: el portal NO parte la arista en el terreno, así
 *    que hay que insertarlo al vuelo. Son dos nodos por consulta, no 46.150
 *    permanentes — y un enganche malo no corrompe el grafo de los demás.
 */
function insertar(aristas, ady, nodos, p) {
  const e = aristas[p.arista];
  const antes = alLargoDeLaArista(e, p);
  const resto = Math.max(0, e.largo - antes);
  const id = nodos.length;
  // ⭐ `arista` y `antes` viajan en el nodo porque los necesita el enlace de abajo.
  //    Son los dos datos que dicen DÓNDE sobre la arista está este punto.
  nodos.push({ x: p.q[0], y: p.q[1], temporal: true, arista: p.arista, antes });
  ady.push([]);
  const enlaza = (n, w) => { ady[id].push({ n, w, e: p.arista }); ady[n].push({ n: id, w, e: p.arista }); };
  enlaza(e.a, antes);
  enlaza(e.b, resto);
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ TANDA DE ARREGLO 8 (12/08/2026) · LOS PUNTOS DE LA MISMA ARISTA SE
  //    ENLAZAN ENTRE SÍ. Antes no lo hacían, y entonces el camino más corto que
  //    este grafo sabía encontrar entre dos puntas de la MISMA arista era
  //    **salir a la esquina y volver**:
  //
  //        CALLE ALFONSO I 12 × 17        32,5 m por 11,9 reales      2,7×
  //        AVENIDA MONTAÑANA 736 × 797  1.145,2 m por 4,5 reales    256,4×
  //
  //    Universo medido: **233.767 pares de direcciones reales comparten arista**
  //    sobre 7.192 aristas (`tools/grafo/misma-arista.js`).
  //
  // ⛔ Y no se «declara» en vez de arreglarse porque **el dato SÍ está**: los dos
  //    puntos tienen su posición sobre la misma arista y la distancia es una
  //    resta. Declarar ignorancia aquí sería mentir sobre lo que se sabe.
  //
  // ⭐ VA EN `insertar` Y NO EN `rutaEntre` a propósito: `rutaEntre` mete DOS
  //    puntos, pero `src/puerta.js:242-243` (`rutaAEdificio`) mete hasta 25 en la
  //    misma consulta. Un arreglo en `rutaEntre` dejaría ese camino sin él.
  //
  // ⚠️ El recorrido hacia atrás vale porque los nodos temporales SIEMPRE se
  //    apilan al final y son contiguos: `id = nodos.length`. Los permanentes no
  //    llevan `temporal`, así que el bucle se para solo en cuanto sale de ellos.
  //    ⛔ Es O(nodos temporales), no O(nodos): 2 vueltas en una ruta normal.
  //
  // ⚠️ Y es SIMÉTRICO por construcción —`Math.abs`—, así que no depende del orden
  //    de inserción. `src/probar-misma-arista.js` lo comprueba con A→B y B→A.
  // ═══════════════════════════════════════════════════════════════════════════
  for (let i = id - 1; i >= 0 && nodos[i].temporal; i--) {
    if (nodos[i].arista !== p.arista) continue;
    enlaza(i, Math.abs(antes - nodos[i].antes));
  }
  return id;
}

/**
 * Ruta entre dos puntos de enganche. Devuelve metros, aristas y PASOS.
 * ⭐ Los metros de cada paso salen de la diferencia de distancias de Dijkstra, no
 *    de `e.largo`: las aristas de los extremos están PARTIDAS por el nodo temporal
 *    y su longitud entera no es la que se anda. Sumar `e.largo` daría un total que
 *    no cuadra con el que devuelve el motor — y cuadrarlo es lo que lo demuestra.
 */
function rutaEntre(g, oP, dP, opciones = {}) {
  const nodos = g.nodos.slice();
  const ady = g.ady.map((l) => l.slice());
  const a = insertar(g.aristas, ady, nodos, oP);
  const b = insertar(g.aristas, ady, nodos, dP);
  const r = dijkstra(ady, a);
  const total = r.dist[b];
  if (!Number.isFinite(total)) return { encontrada: false, motivo: 'sin-camino' };

  const crudos = [];
  // ⭐ la SECUENCIA DE NODOS se devuelve también, desde la tanda 16. No cambia
  //    ningún cálculo: es el mismo camino que ya se reconstruye aquí, expuesto.
  //    Sin ella no se puede dibujar la ruta —hay que saber en qué sentido se
  //    recorre cada arista y dónde se corta la primera y la última—, y
  //    reconstruirla fuera sería una segunda copia del camino (fallo nº68).
  const secuencia = [b];
  for (let v = b; v !== a; v = r.prev[v]) {
    if (r.prev[v] === -1) return { encontrada: false, motivo: 'sin-camino' };
    crudos.push({ ia: r.prevA[v], m: r.dist[v] - r.dist[r.prev[v]] });
    secuencia.push(r.prev[v]);
  }
  crudos.reverse();
  secuencia.reverse();

  const pasos = [];
  for (const { ia, m } of crudos) {
    const e = g.aristas[ia];
    const u = pasos[pasos.length - 1];
    // AGRUPAR ES BORRAR: solo se funden tramos IDÉNTICOS en way, precisión, D2 y
    // condicionalidad. El contador `aristas` deja ver cuántos se fundieron.
    if (u && u.way === e.way && u.precision === e.precision
        && u.unidoPorDefecto === e.unidoPorDefecto && u.condicional === !!e.condicional) {
      u.metros += m; u.aristas++;
    } else {
      pasos.push({ way: e.way, highway: e.highway, precision: e.precision,
        nombreNoAplica: e.nombreNoAplica,
        unidoPorDefecto: e.unidoPorDefecto, condicional: !!e.condicional,
        // ⭐ C3 · el motivo y el sitio viajan hasta la salida, igual que la
        //    precisión de D4. Sin ellos el aviso solo podría decir "puede estar
        //    cerrado", que no le sirve a nadie.
        condVia: e.condVia || null, condHorario: e.condHorario || null,
        condEdificio: e.condEdificio || null, condMirado: e.condMirado,
        metros: m, aristas: 1 });
    }
  }
  // ⭐ CUADRE: la suma de los tramos tiene que ser el total del motor. Prueba, no
  //    explica: si la agrupación pierde o duplica metros, salta aquí.
  const suma = pasos.reduce((s, p) => s + p.metros, 0);
  if (Math.abs(suma - total) > 0.01) {
    throw new Error(`⛔ los metros por tramo no cuadran con el total: ${suma.toFixed(3)} ≠ ${total.toFixed(3)}`);
  }
  for (const p of pasos) p.metros = Math.round(p.metros * 10) / 10;

  return { encontrada: true, metros: Math.round(total * 10) / 10,
    aristas: crudos.map((c) => c.ia), nodos: secuencia,
    // ⛔ los dos nodos temporales, para que quien dibuje sepa dónde cortar la
    //    primera y la última arista. Son ids, no puntos: el punto ya lo tiene.
    nodoOrigen: a, nodoDestino: b, pasos };
}

module.exports = { adyacencia, componentes, articulaciones, dijkstra, nodoMasCercano,
  reconstruir, insertar, alLargoDeLaArista, rutaEntre, Cola };
