// EL PLANARIZADO — convierte un montón de líneas en una red.
//
// Aplica las decisiones del diseño, y cada una lleva su etiqueta al lado para que
// se pueda auditar qué regla actuó en cada punto:
//
//   D1 · UNIR POR DEFECTO. No unir SOLO con evidencia positiva de desnivel.
//        C1 · precedencia del nodo: si dos vías comparten nodo OSM, se conectan
//             y ninguna señal lo contradice. En OSM el nodo ES la topología.
//        C2 · evidencia: bridge / tunnel / layer distinto, o salto de velocidad
//             >= 50 ENTRE DOS VÍAS RODADAS.
//        La jerarquía NO vota.
//   D2 · toda unión sin evidencia se marca `unido-por-defecto` y SE CUENTA.
//   D4 · la precisión es un CAMPO por arista, desde aquí hasta la interfaz.
//   D5 · tolerancia 2,0 m para soldar puntas sueltas. Techo duro 5 m.
//
// ⚠️ Dos trampas de formato que ya mordieron y van explícitas:
//    · `layer` NO es entero: existe "-1.5". parseInt lo trunca o lo tira.
//    · `tunnel=building_passage` NO es un túnel: es un pasaje bajo un edificio
//      y a pie se pasa. Tratarlo como desnivel cortaría un camino real.

'use strict';
const { dist, corteSegmentos } = require('./geo');

const TOLERANCIA_PUNTA = 2.0;      // D5
const TECHO_PUNTA = 5.0;           // D5 · techo duro
const SALTO_VELOCIDAD = 50;        // D1 · C2

// Vías por las que NO circula tráfico rodado. Define quién es "rodada" en C2.
const NO_RODADAS = new Set(['footway', 'path', 'steps', 'pedestrian', 'cycleway',
  'bridleway', 'corridor', 'via_ferrata']);
// Vías por las que no se puede andar. Se construyen igual (son terreno) pero el
// enrutador a pie no las usa. Separar "existe" de "se puede pasar" es de D4.
const PROHIBIDAS_A_PIE = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link']);

const esRodada = (t) => !NO_RODADAS.has(t.highway);

/** ⚠️ float, no int: existe layer="-1.5". Un valor no numérico cuenta como 0. */
function nivel(t) {
  if (t.layer === undefined) return 0;
  const v = parseFloat(t.layer);
  return Number.isFinite(v) ? v : 0;
}
const esPuente = (t) => t.bridge !== undefined && t.bridge !== 'no';
/** ⚠️ building_passage NO entra: a pie se pasa por debajo del edificio. */
const esTunel = (t) => ['yes', 'culvert', 'passage'].includes(t.tunnel);

function velocidad(t) {
  if (!t.maxspeed) return null;
  const v = parseInt(String(t.maxspeed).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(v) ? v : null;
}

/**
 * D1 aplicada a un cruce geométrico SIN nodo compartido.
 * Devuelve {conectar:boolean, motivo:string}.
 */
function decidirCruce(ta, tb) {
  if (nivel(ta) !== nivel(tb)) return { conectar: false, motivo: 'layer-distinto' };
  if (esPuente(ta) !== esPuente(tb)) return { conectar: false, motivo: 'bridge' };
  if (esTunel(ta) !== esTunel(tb)) return { conectar: false, motivo: 'tunnel' };
  if (esRodada(ta) && esRodada(tb)) {
    const va = velocidad(ta), vb = velocidad(tb);
    if (va !== null && vb !== null && Math.abs(va - vb) >= SALTO_VELOCIDAD) {
      return { conectar: false, motivo: 'salto-velocidad' };
    }
  }
  // D2 · no hay evidencia positiva: se une, y se marca.
  return { conectar: true, motivo: 'unido-por-defecto' };
}

/** D4 · la precisión con la que sabemos por dónde se anda en esta arista. */
function precision(t) {
  if (t.footway === 'crossing' || t.highway === 'crossing') return 'paso-de-peatones';
  if (t.footway === 'sidewalk') return 'acera';
  if (t.highway === 'steps') return 'escaleras';
  if (['footway', 'pedestrian', 'path', 'living_street'].includes(t.highway)) return 'peatonal';
  if (t.sidewalk && !['no', 'none', 'separate'].includes(t.sidewalk)) return 'eje-con-acera-declarada';
  return 'eje-de-calzada';
}

const transitableAPie = (t) =>
  !PROHIBIDAS_A_PIE.has(t.highway) && t.foot !== 'no' && t.highway !== 'construction';

// ─────────────────────────────────────────────────────────────────────────────

function planarizar(ways, opciones = {}) {
  const tol = opciones.tolerancia ?? TOLERANCIA_PUNTA;
  const cont = {
    waysEntrada: ways.length,
    nodosOsmUsados: 0, nodosCompartidos: 0,
    cortesGeometricos: 0, cortesConectados: 0, cortesNoConectados: 0,
    porMotivo: {}, unidoPorDefecto: 0,
    puntasSoldadas: 0, distanciasPuntas: [],
    precision: {}, aristas: 0, nodos: 0, particiones: 0,
    puntasFueraDeTecho: 0,
  };

  // ── 1 · nodos OSM y cuántos ways los usan. Aquí vive D1·C1. ────────────────
  const uso = new Map();
  for (const w of ways) for (const n of w.nodes) uso.set(n, (uso.get(n) || 0) + 1);
  cont.nodosOsmUsados = uso.size;
  cont.nodosCompartidos = [...uso.values()].filter((v) => v >= 2).length;

  // ── 2 · puntos de corte por way ────────────────────────────────────────────
  // cortes[i] = Map(clave -> {idx, t, punto, nodoOsm|null})
  const cortes = ways.map(() => []);
  for (let i = 0; i < ways.length; i++) {
    const w = ways[i];
    for (let k = 0; k < w.nodes.length; k++) {
      if (uso.get(w.nodes[k]) >= 2) {
        cortes[i].push({ idx: k, t: 0, p: w.pts[k], nodo: w.nodes[k] });
      }
    }
  }

  // ── 3 · cruces geométricos sin nodo compartido. Aquí vive D1·C2 y D2. ──────
  const CELDA = 100;
  const rejilla = new Map();
  const meter = (i, s) => {
    const [a, b] = [ways[i].pts[s], ways[i].pts[s + 1]];
    const x0 = Math.floor(Math.min(a[0], b[0]) / CELDA), x1 = Math.floor(Math.max(a[0], b[0]) / CELDA);
    const y0 = Math.floor(Math.min(a[1], b[1]) / CELDA), y1 = Math.floor(Math.max(a[1], b[1]) / CELDA);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = x + ',' + y;
      if (!rejilla.has(k)) rejilla.set(k, []);
      rejilla.get(k).push([i, s]);
    }
  };
  for (let i = 0; i < ways.length; i++) for (let s = 0; s + 1 < ways[i].pts.length; s++) meter(i, s);

  const vistos = new Set();
  const noConectados = [];
  const porDefecto = [];
  for (const lista of rejilla.values()) {
    for (let a = 0; a < lista.length; a++) for (let b = a + 1; b < lista.length; b++) {
      const [i, s] = lista[a], [j, u] = lista[b];
      if (i === j) continue;
      const clave = i < j ? `${i}:${s}:${j}:${u}` : `${j}:${u}:${i}:${s}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      // si comparten nodo OSM en ese punto, D1·C1 ya lo resolvió arriba
      const ns = new Set([ways[i].nodes[s], ways[i].nodes[s + 1]]);
      if (ns.has(ways[j].nodes[u]) || ns.has(ways[j].nodes[u + 1])) continue;
      const c = corteSegmentos(ways[i].pts[s], ways[i].pts[s + 1], ways[j].pts[u], ways[j].pts[u + 1]);
      if (!c) continue;
      cont.cortesGeometricos++;
      const d = decidirCruce(ways[i].tags || {}, ways[j].tags || {});
      cont.porMotivo[d.motivo] = (cont.porMotivo[d.motivo] || 0) + 1;
      if (d.conectar) {
        cont.cortesConectados++;
        cont.unidoPorDefecto++;                                  // D2
        cortes[i].push({ idx: s, t: c.t, p: c.p, nodo: null, defecto: true });
        cortes[j].push({ idx: u, t: c.u, p: c.p, nodo: null, defecto: true });
        // D2 exige un contador; para poder MIRARLOS hace falta además el sitio.
        porDefecto.push({ wayA: ways[i].id, wayB: ways[j].id, p: c.p,
          nombreA: (ways[i].tags || {}).name || null, nombreB: (ways[j].tags || {}).name || null,
          hwA: (ways[i].tags || {}).highway, hwB: (ways[j].tags || {}).highway });
      } else {
        cont.cortesNoConectados++;
        noConectados.push({ wayA: ways[i].id, wayB: ways[j].id, motivo: d.motivo, p: c.p,
          nombreA: (ways[i].tags || {}).name || null, nombreB: (ways[j].tags || {}).name || null,
          hwA: (ways[i].tags || {}).highway, hwB: (ways[j].tags || {}).highway });
      }
    }
  }

  // ── 4 · partir cada way en sus cortes ─────────────────────────────────────
  const nodos = [];                       // {x,y}
  const indicePorClave = new Map();       // clave espacial/osm -> id de nodo
  const claveOsm = (n) => 'n' + n;
  const claveXY = (p) => `p${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`;
  function nodoDe(p, nodoOsm) {
    const k = nodoOsm !== null && nodoOsm !== undefined ? claveOsm(nodoOsm) : claveXY(p);
    if (indicePorClave.has(k)) return indicePorClave.get(k);
    const id = nodos.length;
    nodos.push({ x: p[0], y: p[1], osm: nodoOsm ?? null });
    indicePorClave.set(k, id);
    return id;
  }

  const aristas = [];
  for (let i = 0; i < ways.length; i++) {
    const w = ways[i], t = w.tags || {};
    const pr = precision(t), pie = transitableAPie(t);
    // posiciones de corte ordenadas a lo largo del way, con extremos incluidos
    const marcas = [{ idx: 0, t: 0, p: w.pts[0], nodo: w.nodes[0] },
      ...cortes[i],
      { idx: w.pts.length - 1, t: 0, p: w.pts[w.pts.length - 1], nodo: w.nodes[w.nodes.length - 1] }];
    marcas.sort((a, b) => (a.idx - b.idx) || (a.t - b.t));
    // deduplicar marcas en la misma posición
    const limpio = [];
    for (const m of marcas) {
      const ult = limpio[limpio.length - 1];
      if (ult && ult.idx === m.idx && Math.abs(ult.t - m.t) < 1e-9) {
        if (m.nodo != null) ult.nodo = m.nodo;
        if (m.defecto) ult.defecto = true;
        continue;
      }
      limpio.push({ ...m });
    }
    if (limpio.length > 2) cont.particiones += limpio.length - 2;

    for (let m = 0; m + 1 < limpio.length; m++) {
      const A = limpio[m], B = limpio[m + 1];
      // reconstruir la polilínea entre las dos marcas
      const puntos = [A.p];
      for (let k = A.idx + 1; k <= B.idx; k++) {
        if (k === B.idx && B.t === 0) break;
        puntos.push(w.pts[k]);
      }
      puntos.push(B.p);
      let L = 0;
      for (let k = 0; k + 1 < puntos.length; k++) L += dist(puntos[k], puntos[k + 1]);
      if (L < 1e-6) continue;
      const na = nodoDe(A.p, A.nodo), nb = nodoDe(B.p, B.nodo);
      if (na === nb) continue;
      aristas.push({
        a: na, b: nb, largo: L, way: w.id, highway: t.highway,
        precision: pr, pie,
        unidoPorDefecto: !!(A.defecto || B.defecto),
        pts: puntos,
      });
      cont.precision[pr] = (cont.precision[pr] || 0) + 1;
    }
  }

  // ── 5 · D5 · soldar puntas sueltas ────────────────────────────────────────
  const grado = new Array(nodos.length).fill(0);
  for (const e of aristas) { grado[e.a]++; grado[e.b]++; }
  const puntas = [];
  for (let i = 0; i < nodos.length; i++) if (grado[i] === 1) puntas.push(i);
  const rej2 = new Map();
  const kxy = (n) => `${Math.floor(n.x / 10)},${Math.floor(n.y / 10)}`;
  for (let i = 0; i < nodos.length; i++) {
    const k = kxy(nodos[i]);
    if (!rej2.has(k)) rej2.set(k, []);
    rej2.get(k).push(i);
  }
  const soldadura = new Map();                 // nodo -> nodo destino
  const puntasLejos = [];                      // 2-5 m: contadas y localizadas, no soldadas
  for (const p of puntas) {
    const n = nodos[p];
    let mejor = null, md = Infinity;
    const cx = Math.floor(n.x / 10), cy = Math.floor(n.y / 10);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      for (const q of (rej2.get(x + ',' + y) || [])) {
        if (q === p || soldadura.has(q)) continue;
        const d = Math.hypot(n.x - nodos[q].x, n.y - nodos[q].y);
        if (d > 0 && d < md) { md = d; mejor = q; }
      }
    }
    if (mejor !== null && md <= tol) {
      soldadura.set(p, mejor);
      cont.puntasSoldadas++;
      cont.distanciasPuntas.push(Math.round(md * 100) / 100);
    } else if (mejor !== null && md <= TECHO_PUNTA) {
      cont.puntasFueraDeTecho++;                // entre 2 y 5 m: NO se sueldan, se cuentan
      puntasLejos.push({ p: [n.x, n.y], q: [nodos[mejor].x, nodos[mejor].y], d: Math.round(md * 100) / 100 });
    }
  }
  const resolver = (i) => (soldadura.has(i) ? soldadura.get(i) : i);
  // ⚠️ Soldar cambia la IDENTIDAD del nodo; si no se mueve también la GEOMETRÍA,
  //    el grafo dice "unido" y el dibujo enseña dos líneas separadas hasta 2 m.
  //    Pasó: 20 nodos con dos coordenadas, la peor a 1,90 m. Lo cazó el exportador
  //    del visor, no ningún contador. Se mueve el extremo y se recalcula el largo
  //    —hasta 2 m por arista soldada— para que topología y dibujo digan lo mismo.
  //    Ver bitácora nº53.
  for (const e of aristas) {
    if (soldadura.has(e.a)) { e.a = soldadura.get(e.a); e.pts[0] = [nodos[e.a].x, nodos[e.a].y]; }
    if (soldadura.has(e.b)) { e.b = soldadura.get(e.b); e.pts[e.pts.length - 1] = [nodos[e.b].x, nodos[e.b].y]; }
    let L = 0;
    for (let k = 0; k + 1 < e.pts.length; k++) L += dist(e.pts[k], e.pts[k + 1]);
    e.largo = L;
  }

  cont.aristas = aristas.length;
  cont.nodos = new Set(aristas.flatMap((e) => [e.a, e.b])).size;

  return { nodos, aristas, contadores: cont, noConectados, porDefecto, puntasLejos };
}

module.exports = { planarizar, decidirCruce, precision, nivel, esPuente, esTunel,
  velocidad, esRodada, transitableAPie, TOLERANCIA_PUNTA, TECHO_PUNTA };
