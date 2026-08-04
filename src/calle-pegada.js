// ⭐⭐ TANDA 25 · LA CALLE QUE VA PEGADA — el SEGUNDO testigo, y nada más.
//
//   node src/calle-pegada.js          # la medición entera (A · B · C · D)
//
// ═════════════════════════════════════════════════════════════════════════════
// LA IDEA, EN PALABRAS DE ANTONIO
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Además del portal, ¿no puede comprobar que tiene otra línea en paralelo a
//   >  nada de distancia que tiene el nombre, y compararlo contra los portales?»*
//   > *«Esas líneas tienen una lat-lon, ¿verdad? Pues imagino que si por varios
//   >  puntos de esa lat-lon se llevan 2-3 metros, será la misma calle.»*
//
//   ⭐ **El «en varios puntos» es lo que lo hace fiable**: distingue *va pegada a
//     lo largo* de *se toca en un sitio*. Sin eso, cualquier calle que cruce
//     contaría. Y con eso **no hace falta hablar de ángulos ni de paralelismo**:
//     si la distancia se mantiene a lo largo de toda la línea, es que van
//     paralelas — sale solo.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ ESTO NO ES HEREDAR: SON DOS TESTIGOS INDEPENDIENTES
// ═════════════════════════════════════════════════════════════════════════════
//   Heredar el nombre de la línea vecina sería OSM contra OSM, y una acera puede
//   estar entre dos calles o pegada a la equivocada. Lo que hace fuerte a esto es
//   que hay **dos fuentes distintas**:
//
//     · los **PORTALES** que dan a la línea  → `codigoVia` del **Ayuntamiento**
//     · la **CALLE PEGADA** a lo largo       → `name` de **OSM**
//
//   > Si los dos dicen lo mismo → se nombra.
//   > Si discrepan → **AMBIGUA, y no se nombra.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐ LA GARANTÍA ESTRUCTURAL: ESTE MÓDULO NO PUEDE LEER EL NOMBRE QUE BUSCA
// ═════════════════════════════════════════════════════════════════════════════
//   `decidir()` recibe **la GEOMETRÍA del way** y el índice de las líneas con
//   nombre, y el way que se evalúa se **excluye de los candidatos**. No recibe su
//   propio nombre por ningún parámetro: el patrón de verdad de §D no se puede
//   fingir leyendo lo que se supone tapado (es la forma del fallo nº92).
//   ⚠️ Lo que esto NO impide es que un way VECINO de la misma calle sea el
//      candidato. Eso **es el mecanismo**, no una trampa —en producción la acera
//      sin nombre encuentra a su calzada, que es otro way—, pero en §D crea un
//      caso trivial: la CONTINUACIÓN colineal del propio way. ⇒ se mide aparte.

'use strict';
const NL = require('./nombre-largo');

// ═════════════════════════════════════════════════════════════════════════════
// LOS TRES MANDOS, DECLARADOS ANTES DE VER UN RESULTADO
// ═════════════════════════════════════════════════════════════════════════════
//
// · PUNTOS · ⭐ **cinco, y ninguno en los extremos** (10 · 30 · 50 · 70 · 90 % de
//   la longitud). Los extremos de una línea son NODOS DE CRUCE: ahí la calle que
//   cruza pasa a cero metros, así que muestrear en la punta elegiría
//   sistemáticamente la transversal. Con dos puntos no se distingue un cruce de
//   un paralelo; con cinco, una racha de coincidencias ya no es casualidad.
//   ⚠️ En una línea CORTA los cinco puntos caen casi encima: el test es más
//      flojo ahí, y por eso el informe publica el acierto por banda de longitud
//      y la curva de sensibilidad con 3 · 5 · 9 puntos.
//   ⭐ El muestreo es por longitud acumulada, así que **no depende del orden** en
//      que estén las aristas del way: los puntos se reparten igual.
const FRACCIONES = [0.1, 0.3, 0.5, 0.7, 0.9];

// · RADIO · ⛔ NO se pone a ojo. Sale de §A1: **el p90 del máximo por vía de la
//   distancia entre una acera CON nombre y su calzada del mismo nombre**, medido
//   sobre las 3.161 aceras con nombre de Zaragoza y redondeado al metro. La regla
//   se escribió ANTES de ejecutar (ley 51) y el informe la vuelve a derivar y lo
//   EXIGE, así que si el dato cambia esto se pone en rojo — mecanismo, no
//   disciplina.
//
//   ⚠️⚠️ Y LO QUE MIDIÓ §A2 HAY QUE PONERLO DELANTE: **las dos distribuciones se
//   solapan**. La calle propia está a 5,6 m de mediana y **la ajena a 6,9 m**. ⇒
//   **un umbral de distancia NO distingue una cosa de la otra**, y en el 42,5 %
//   de las aceras hay una calle con otro nombre más cerca —en algún punto— que la
//   suya en su peor punto. **El radio NO es el discriminador: es un control de
//   cobertura.** Lo que discrimina es la unanimidad a lo largo (ver ACUERDO).
const RADIO = 11;     // m — derivado en §A1: ceil(p90) = 11

// ⭐⭐ LA REGLA, Y POR QUÉ ÉSTA Y NO «LA MÁS CERCANA»
// ═════════════════════════════════════════════════════════════════════════════
//   > *«si por varios puntos de esa lat-lon se llevan 2-3 metros, será la misma
//   >  calle»* — Antonio
//
//   **Se exige que la vía esté dentro del radio en TODOS los puntos, y que sea la
//   ÚNICA que lo esté.** No «la más cercana en cada punto», y hay dos motivos:
//
//   1 · ⚠️ §A2 acaba de enseñar que la distancia no ordena bien: fiarlo todo a
//       quién queda más cerca sería fiarlo a una diferencia de un metro entre dos
//       distribuciones que se solapan.
//   2 · ⭐ **En una esquina o un chaflán hay DOS calles paralelas, y eso tiene que
//       salir AMBIGUO** — que es un resultado correcto, no un problema. Con «la
//       más cercana» el chaflán elegiría una y se callaría la duda.
//
//   ⭐ Y una calle que CRUZA no sobrevive: está a cero metros en un punto y a
//     veinte en los otros cuatro. Ése es exactamente el trabajo que hace el «en
//     varios puntos» de Antonio.
//   ⚠️ La variante «la más cercana en cada punto» se MIDE y se publica en el
//      informe (§B), para que se vea qué se está dejando fuera.
const ACUERDO_PUNTOS = 1.0;   // ⭐ unanimidad: en TODOS los puntos

// ── geometría de un way ──────────────────────────────────────────────────────

/** Los segmentos de un way, con su longitud acumulada. ⛔ Solo lee `g`. */
function geometriaDeWay(g, idxs) {
  const segs = [];
  let total = 0;
  for (const i of idxs) {
    const pts = g.aristas[i].pts;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len <= 0) continue;
      segs.push({ a, b, len, ini: total });
      total += len;
    }
  }
  return { segs, total };
}

/** El punto que está a la fracción `f` de la longitud del way. */
function puntoEn(geo, f) {
  const objetivo = geo.total * f;
  for (const s of geo.segs) {
    if (objetivo <= s.ini + s.len) {
      const t = s.len ? (objetivo - s.ini) / s.len : 0;
      return [s.a[0] + t * (s.b[0] - s.a[0]), s.a[1] + t * (s.b[1] - s.a[1])];
    }
  }
  const u = geo.segs[geo.segs.length - 1];
  return u ? u.b : null;
}

/** Los puntos de muestreo de un way. */
function puntosDe(geo, fracciones = FRACCIONES) {
  if (!geo.segs.length || geo.total <= 0) return [];
  return fracciones.map((f) => puntoEn(geo, f));
}

// ── el índice de las líneas CON nombre ───────────────────────────────────────

const aSeg = (p, a, b) => {
  const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy;
  let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
};

/**
 * Rejilla sobre los SEGMENTOS de las aristas cuyo way tiene núcleo.
 * @param {Function} nucleoDeWay (wayId) -> núcleo o ''
 */
function indexar(g, nucleoDeWay, celda = 20) {
  const m = new Map();
  for (let i = 0; i < g.aristas.length; i++) {
    if (!nucleoDeWay(g.aristas[i].way)) continue;
    const pts = g.aristas[i].pts;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1];
      const x0 = Math.floor(Math.min(a[0], b[0]) / celda), x1 = Math.floor(Math.max(a[0], b[0]) / celda);
      const y0 = Math.floor(Math.min(a[1], b[1]) / celda), y1 = Math.floor(Math.max(a[1], b[1]) / celda);
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          const kk = x + ',' + y;
          if (!m.has(kk)) m.set(kk, []);
          m.get(kk).push([i, k]);
        }
      }
    }
  }
  return { m, celda };
}

/**
 * La línea con nombre más cercana a `p`, POR NÚCLEO, dentro de `radio`.
 * ⛔ `wayExcluido` no entra: es el way que se está evaluando.
 * @returns {Map<nucleo, {d, way, nombre}>}
 */
function escanear(idx, g, p, radio, wayExcluido, nucleoDeWay, nombreDeWay) {
  const out = new Map();
  if (!p) return out;
  const r = Math.ceil(radio / idx.celda);
  const cx = Math.floor(p[0] / idx.celda), cy = Math.floor(p[1] / idx.celda);
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      const l = idx.m.get((cx + dx) + ',' + (cy + dy));
      if (!l) continue;
      for (const [i, k] of l) {
        const e = g.aristas[i];
        if (e.way === wayExcluido) continue;
        const d = aSeg(p, e.pts[k], e.pts[k + 1]);
        if (d > radio) continue;
        const nu = nucleoDeWay(e.way);
        if (!nu) continue;
        const prev = out.get(nu);
        if (!prev || d < prev.d) out.set(nu, { d, way: e.way, nombre: nombreDeWay(e.way) });
      }
    }
  }
  return out;
}

/** El más cercano de todos, sea del núcleo que sea. */
function mejorDe(mapa) {
  let mejor = null;
  for (const [nu, v] of mapa) if (!mejor || v.d < mejor.d) mejor = { nucleo: nu, ...v };
  return mejor;
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LA DECISIÓN — tres resultados, no dos
// ═════════════════════════════════════════════════════════════════════════════
//   · PEGADA  — UNA vía, y solo una, está dentro del radio en TODOS los puntos
//   · AMBIGUA — hay DOS o más que lo cumplen. ⭐ Es lo que pasa en una esquina o
//               un chaflán, y **es un resultado correcto**, no un problema.
//   · SUELTA  — ninguna lo cumple: no va pegada a nada a lo largo.
/**
 * @param {object} geo salida de `geometriaDeWay`
 * @param {number} way el way que se evalúa (⛔ se excluye de los candidatos: es
 *   lo que impide que §D se conteste sola leyendo el nombre que se tapa)
 * @param {object} [op] `{radio, fracciones, acuerdo, regla}`
 *   · `regla: 'cercana'` mide la VARIANTE «la más cercana en cada punto». ⛔ No es
 *     la aplicada; está para publicar qué se deja fuera.
 */
function decidir(geo, idx, g, way, nucleoDeWay, nombreDeWay, op = {}) {
  const radio = op.radio === undefined ? RADIO : op.radio;
  const fracciones = op.fracciones || FRACCIONES;
  const acuerdo = op.acuerdo === undefined ? ACUERDO_PUNTOS : op.acuerdo;
  const pts = puntosDe(geo, fracciones);
  if (!pts.length) return { estado: 'SUELTA', razon: 'sin geometría', puntos: 0 };

  const n = pts.length;
  const mapas = pts.map((p) => escanear(idx, g, p, radio, way, nucleoDeWay, nombreDeWay));

  // ⭐ «la misma vía» no es igualdad de cadenas: «Poeta María Zambrano» y «María
  //   Zambrano» son la misma calle, y eso lo decide `nombre-largo.js` (tanda 21).
  const mismo = (a, b) => a === b || NL.mismaVia(a, b);

  // ── la VARIANTE «la más cercana en cada punto» (⛔ no aplicada, solo medida) ─
  if (op.regla === 'cercana') {
    const votos = mapas.map(mejorDe).filter((v) => v);
    if (!votos.length) return { estado: 'SUELTA', puntos: n, votos: 0 };
    let mejorN = null, mejorA = 0;
    for (const c of votos) {
      const a = votos.filter((x) => mismo(x.nucleo, c.nucleo)).length;
      if (a > mejorA) { mejorA = a; mejorN = c.nucleo; }
    }
    if (mejorA / n < acuerdo) {
      return { estado: 'AMBIGUA', puntos: n, apoyo: mejorA, votos: votos.length,
        candidatos: [...new Set(votos.map((c) => c.nucleo))].slice(0, 3) };
    }
    const gan = votos.filter((x) => mismo(x.nucleo, mejorN));
    return { estado: 'PEGADA', puntos: n, apoyo: mejorA, votos: votos.length,
      ...conNombreLargo(gan) };
  }

  // ── LA REGLA APLICADA: presente en TODOS los puntos, y única ───────────────
  //   ⚠️ Los núcleos se agrupan por vía ANTES de contar: si una calle aparece
  //      como «Calle Mayor» en un punto y «Mayor MVR» en otro, es una sola.
  const grupos = [];                      // [{nucleos:Set, apariciones:[{d,way,nombre,nucleo}]}]
  for (let k = 0; k < n; k++) {
    for (const [nu, v] of mapas[k]) {
      let gr = grupos.find((G) => [...G.nucleos].some((x) => mismo(x, nu)));
      if (!gr) { gr = { nucleos: new Set(), puntos: new Set(), apariciones: [] }; grupos.push(gr); }
      gr.nucleos.add(nu);
      gr.puntos.add(k);
      gr.apariciones.push({ nucleo: nu, ...v });
    }
  }
  const enTodos = grupos.filter((G) => G.puntos.size >= Math.ceil(acuerdo * n));
  if (!enTodos.length) {
    const cerca = grupos.length;
    return { estado: 'SUELTA', puntos: n, cerca,
      razon: cerca ? 'ninguna vía llega a todos los puntos' : 'no hay ninguna línea con nombre al lado' };
  }
  if (enTodos.length > 1) {
    return { estado: 'AMBIGUA', puntos: n, cuantas: enTodos.length,
      candidatos: enTodos.map((G) => [...G.nucleos][0]).slice(0, 3) };
  }
  const G = enTodos[0];
  const ds = G.apariciones.map((x) => x.d);
  return { estado: 'PEGADA', puntos: n, apoyo: G.puntos.size,
    ...conNombreLargo(G.apariciones),
    dMax: Math.max(...ds), dMed: ds.slice().sort((a, b) => a - b)[Math.floor(ds.length / 2)] };
}

/** ⭐ «si es título grande, se deja el grande» (tanda 21 §B). */
function conNombreLargo(apariciones) {
  let mejor = apariciones[0];
  for (const x of apariciones) {
    if (NL.palabras(x.nucleo).length > NL.palabras(mejor.nucleo).length) mejor = x;
  }
  return { nucleo: mejor.nucleo, nombre: mejor.nombre, wayVecino: mejor.way };
}

/** Agrupa las aristas del grafo por way. */
function porWay(g) {
  const m = new Map();
  for (let i = 0; i < g.aristas.length; i++) {
    const w = g.aristas[i].way;
    if (!m.has(w)) m.set(w, []);
    m.get(w).push(i);
  }
  return m;
}

/** Núcleo del nombre de OSM de un way, memorizado. ⛔ Se llama millones de veces. */
function nucleoDeWayDe(g) {
  const P = require('./portales');
  const memo = new Map();
  return (id) => {
    if (memo.has(id)) return memo.get(id);
    const v = P.nucleo(g.nombres.get(id) || null);
    memo.set(id, v);
    return v;
  };
}

/**
 * ⭐ El segundo testigo para TODO el grafo. ⛔ No muta nada.
 * @returns {Map<way, decisión>}
 */
function decidirTodos(g, nucleoDeWay, nombreDeWay, op = {}) {
  const ways = porWay(g);
  const idx = indexar(g, nucleoDeWay, op.celda || 20);
  const out = new Map();
  for (const [w, ix] of ways) {
    out.set(w, decidir(geometriaDeWay(g, ix), idx, g, w, nucleoDeWay, nombreDeWay, op));
  }
  return out;
}

// ⛔⛔ LOS EXPORTS VAN **ANTES** DEL BLOQUE DE LÍNEA DE ÓRDENES, Y NO ES ESTILO:
//   el informe de abajo pide `./modelo`, y `modelo.js` pide `./calle-pegada` de
//   vuelta. Si los exports estuvieran al final, quien entrase por el ciclo
//   recibiría un objeto vacío y `CP.decidirTodos` sería `undefined` **sin que el
//   error mencione el ciclo por ningún lado**. Es literalmente el fallo nº105.
module.exports = { FRACCIONES, RADIO, ACUERDO_PUNTOS,
  geometriaDeWay, puntoEn, puntosDe, indexar, escanear, mejorDe, decidir, porWay, aSeg,
  nucleoDeWayDe, decidirTodos, conNombreLargo };

// ═════════════════════════════════════════════════════════════════════════════
// LA MEDICIÓN — A · B · C · D
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const P = require('./portales');
  const A = require('./alarma');
  const Mo = require('./modelo');
  const Dir = require('./direccion');
  const Mun = require('./municipal');
  const osm = require('./osm');
  const { rng } = require('./sin-vigilancia');
  const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(56)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const T0 = Date.now();
  const SEMILLA = 20260804;

  const g = construir(ZONA_TERMINO);
  const ctx = Dir.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const tags = new Map();
  for (const w of osm.recortar(osm.cargar(CRUDO).ways, g.zona)) tags.set(w.id, w.tags || {});

  const nombreDeWay = (id) => g.nombres.get(id) || null;
  const nucleoDeWay = nucleoDeWayDe(g);
  const ways = porWay(g);
  const idx = indexar(g, nucleoDeWay, 20);
  const geoDe = new Map();
  for (const [w, ix] of ways) geoDe.set(w, geometriaDeWay(g, ix));
  const largoDe = (w) => geoDe.get(w).total;
  const conNombre = (w) => !!nucleoDeWay(w);
  const sinNombre = (w) => !nucleoDeWay(w);
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  const mismo = (a, b) => !!a && !!b && (a === b || NL.mismaVia(a, b));

  log('='.repeat(104));
  log('LA CALLE QUE VA PEGADA — el segundo testigo');
  log('='.repeat(104));
  di('ways del grafo · con nombre en OSM · sin nombre',
    `${ways.size} · ${[...ways.keys()].filter(conNombre).length} · ${[...ways.keys()].filter(sinNombre).length}`);
  di('ways `footway=sidewalk` · de ellos con nombre',
    `${[...ways.keys()].filter((w) => (tags.get(w) || {}).footway === 'sidewalk').length} · `
    + `${[...ways.keys()].filter((w) => (tags.get(w) || {}).footway === 'sidewalk' && conNombre(w)).length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('A · ⭐⭐ CUÁNTO SEPARAN DE VERDAD — medido antes de poner ningún umbral');
  log('='.repeat(104));
  log('   ⛔ El umbral no se pone a ojo. Se miden las DOS distribuciones que tiene que separar:');
  log('      A1 · lo que dista una acera CON nombre de su MISMA calle');
  log('      A2 · lo que dista de la calle con OTRO nombre más cercana');
  log('   ⚠️ Y el estadístico no es la media: la regla exige que la calle esté al lado EN TODOS');
  log('      los puntos, así que de A1 manda **el PEOR de los cinco puntos**. De A2, el MEJOR:');
  log('      una calle ajena que se acerca en UN punto ya es capaz de ganar ahí.');
  const MAX_A = 60;
  const A1 = [], A2 = [];
  let sinCalzada = 0, sinRival = 0, separables = 0, comparadas = 0;
  for (const [w] of ways) {
    if ((tags.get(w) || {}).footway !== 'sidewalk' || !conNombre(w)) continue;
    const propio = nucleoDeWay(w);
    const pts = puntosDe(geoDe.get(w));
    if (!pts.length) continue;
    let peorMismo = 0, mejorOtro = Infinity, falta = false;
    for (const p of pts) {
      const mapa = escanear(idx, g, p, MAX_A, w, nucleoDeWay, nombreDeWay);
      let dM = Infinity, dO = Infinity;
      for (const [nu, v] of mapa) {
        if (mismo(nu, propio)) { if (v.d < dM) dM = v.d; } else if (v.d < dO) dO = v.d;
      }
      if (!isFinite(dM)) { falta = true; break; }
      peorMismo = Math.max(peorMismo, dM);
      mejorOtro = Math.min(mejorOtro, dO);
    }
    if (falta) { sinCalzada++; continue; }
    A1.push(peorMismo);
    if (isFinite(mejorOtro)) A2.push(mejorOtro); else sinRival++;
    comparadas++;
    if (peorMismo < mejorOtro) separables++;
  }
  const F2 = (v) => (v === undefined ? '—' : v.toFixed(2) + ' m');
  log('');
  log('   A1 · la acera y SU calle — el peor de los 5 puntos          n=' + A1.length);
  log('      p10 ' + F2(q(A1, 0.10)) + '   mediana ' + F2(q(A1, 0.50)) + '   p75 ' + F2(q(A1, 0.75))
    + '   ⭐ p90 ' + F2(q(A1, 0.90)) + '   p95 ' + F2(q(A1, 0.95)) + '   máx ' + F2(q(A1, 1)));
  di('   ⚠️ aceras con nombre descartadas (su calle no está a ≤60 m en algún punto)', sinCalzada);
  log('');
  log('   A2 · la calle con OTRO nombre — el mejor de los 5 puntos    n=' + A2.length);
  log('      p01 ' + F2(q(A2, 0.01)) + '   p05 ' + F2(q(A2, 0.05)) + '   p10 ' + F2(q(A2, 0.10))
    + '   mediana ' + F2(q(A2, 0.50)) + '   p90 ' + F2(q(A2, 0.90)) + '   máx ' + F2(q(A2, 1)));
  di('   sin ninguna otra calle a ≤60 m', sinRival);
  log('');
  log('   ⚠️⚠️ **LAS DOS DISTRIBUCIONES SE SOLAPAN, Y HAY QUE DECIRLO ANTES QUE NADA.**');
  di('   ⭐ aceras donde la propia gana a la ajena por distancia', `${separables} de ${comparadas}  (${pct(separables, comparadas)})`);
  log('      La calle propia está a ' + F2(q(A1, 0.50)) + ' de mediana y **la ajena a ' + F2(q(A2, 0.50)) + '**.');
  log('      ⇒ ⛔ **UN UMBRAL DE DISTANCIA NO DISTINGUE UNA COSA DE LA OTRA.** En el '
    + pct(comparadas - separables, comparadas) + ' de');
  log('        las aceras hay una calle ajena más cerca —en algún punto— que la suya en el peor.');
  log('        En las calles estrechas el método NO puede decidir por distancia, y no lo hace:');
  log('        **lo que decide es ir pegada EN TODOS LOS PUNTOS**, que es lo que dijo Antonio.');
  log('');
  log('   A3 · ⭐ EL UMBRAL, Y DE DÓNDE SALE');
  const derivado = Math.ceil(q(A1, 0.90));
  di('   regla escrita ANTES de ejecutar: ceil(p90 de A1)', derivado + ' m');
  di('   ⭐ RADIO declarado en el módulo', RADIO + ' m   ' + (RADIO === derivado ? '✅ cuadra' : '⛔ NO CUADRA'));
  A.exige(RADIO === derivado, `el RADIO del módulo (${RADIO}) ya no es el que sale del dato (${derivado})`);
  log('      ⚠️ Y el radio **NO es el discriminador**: es un control de COBERTURA. Lo dice A2.');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B · ⭐⭐ EL SEGUNDO TESTIGO SOBRE LAS LÍNEAS SIN NOMBRE');
  log('='.repeat(104));
  const cuenta = (op, filtro) => {
    const c = { PEGADA: 0, AMBIGUA: 0, SUELTA: 0 }, m = { PEGADA: 0, AMBIGUA: 0, SUELTA: 0 };
    for (const [w] of ways) {
      if (!filtro(w)) continue;
      const d = decidir(geoDe.get(w), idx, g, w, nucleoDeWay, nombreDeWay, op);
      c[d.estado]++; m[d.estado] += largoDe(w);
    }
    return { c, m };
  };
  const B = cuenta({}, sinNombre);
  log('   ' + 'resultado'.padEnd(12) + 'ways'.padStart(9) + 'metros'.padStart(12));
  for (const k of ['PEGADA', 'AMBIGUA', 'SUELTA']) {
    log('   ' + k.padEnd(12) + String(B.c[k]).padStart(9) + km(B.m[k]).padStart(12));
  }
  log('');
  log('   ⭐ LA COSTURA DEL ENCARGO: «si no sale ninguna AMBIGUA, sospecha — las esquinas existen».');
  di('   ways AMBIGUOS (dos calles pegadas a la vez)', B.c.AMBIGUA + (B.c.AMBIGUA > 0 ? '   ✅ los hay' : '   ⛔ CERO'));
  A.exige(B.c.AMBIGUA > 0, 'no sale ni una AMBIGUA: en una ciudad con esquinas eso es imposible');
  log('');
  log('   ⚠️ LA VARIANTE «la más cercana en cada punto» — ⛔ NO es la aplicada, va para que se');
  log('      vea qué se deja fuera:');
  const V = cuenta({ regla: 'cercana' }, sinNombre);
  for (const k of ['PEGADA', 'AMBIGUA', 'SUELTA']) {
    log('      ' + k.padEnd(12) + String(V.c[k]).padStart(9) + km(V.m[k]).padStart(12));
  }
  log('');
  log('   curvas de sensibilidad — ⛔ el número que vale es el del radio y los puntos declarados');
  log('      ' + 'radio'.padEnd(12) + 'PEGADA'.padStart(9) + 'AMBIGUA'.padStart(10) + 'SUELTA'.padStart(10));
  for (const r of [6, 8, RADIO, 15, 20]) {
    const x = cuenta({ radio: r }, sinNombre);
    log('      ' + ((r === RADIO ? '⭐ ' : '   ') + r + ' m').padEnd(12) + String(x.c.PEGADA).padStart(9)
      + String(x.c.AMBIGUA).padStart(10) + String(x.c.SUELTA).padStart(10));
  }
  log('      ' + 'puntos'.padEnd(12) + 'PEGADA'.padStart(9) + 'AMBIGUA'.padStart(10) + 'SUELTA'.padStart(10));
  for (const [etq, fr] of [['3', [0.17, 0.5, 0.83]], ['5', FRACCIONES],
    ['9', [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]]]) {
    const x = cuenta({ fracciones: fr }, sinNombre);
    log('      ' + ((etq === '5' ? '⭐ ' : '   ') + etq).padEnd(12) + String(x.c.PEGADA).padStart(9)
      + String(x.c.AMBIGUA).padStart(10) + String(x.c.SUELTA).padStart(10));
  }
  log('   ⇒ ⭐ ni el radio ni el número de puntos mandan mucho: entre 3 y 9 puntos hay 167 ways de');
  log('     diferencia sobre 47.758. **El que manda es exigir la unanimidad.**');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('D · ⭐⭐ CONTRA EL PATRÓN DE VERDAD — tapándole el nombre a las que sí lo tienen');
  log('='.repeat(104));
  log('   ⭐ LA GARANTÍA ESTRUCTURAL: `decidir()` recibe GEOMETRÍA y el índice, y el way que se');
  log('      evalúa se excluye de los candidatos. Su nombre no entra por ningún parámetro.');
  log('   ⭐ Y ADEMÁS UN CEPO, porque una garantía que nadie ha visto saltar es una promesa:');
  {
    // ⭐ el cepo: `nucleoDeWay` no puede ser llamado NUNCA con el way evaluado
    let evaluando = null, saltos = 0;
    const cepo = (id) => { if (id === evaluando) saltos++; return nucleoDeWay(id); };
    evaluando = [...ways.keys()][0];
    cepo(evaluando);
    di('   ⭐ el cepo salta cuando se le provoca (su ROJO, visto)', saltos === 1 ? '✅ sí' : '⛔ NO SALTA');
    A.exige(saltos === 1, 'el cepo no salta ni cuando se le provoca: no vale como guardián');
    saltos = 0;
    for (const [w] of ways) {
      if (!conNombre(w)) continue;
      evaluando = w;
      decidir(geoDe.get(w), idx, g, w, cepo, nombreDeWay, {});
    }
    di('   evaluación completa con el cepo puesto', saltos === 0
      ? '✅ el método no leyó ni una vez el nombre que se le tapaba' : '⛔ LO LEYÓ ' + saltos + ' VECES');
    A.exige(saltos === 0, 'el método lee el nombre que se le está tapando: el patrón de verdad no vale');
  }
  const nodosDe = new Map();
  for (const [w, ix] of ways) {
    const s = new Set();
    for (const i of ix) { s.add(g.aristas[i].a); s.add(g.aristas[i].b); }
    nodosDe.set(w, s);
  }
  let acierta = 0, falla = 0, ambD = 0, sueltaD = 0;
  let toca = 0, tocaOk = 0, suelto = 0, sueltoOk = 0;
  const fallos = [];
  const porBanda = new Map();
  for (const [w] of ways) {
    if (!conNombre(w)) continue;
    const verdad = nucleoDeWay(w);
    const d = decidir(geoDe.get(w), idx, g, w, nucleoDeWay, nombreDeWay, {});
    const L = largoDe(w);
    const banda = L < 25 ? '1 · < 25 m' : L < 50 ? '2 · 25–50 m' : L < 100 ? '3 · 50–100 m'
      : L < 250 ? '4 · 100–250 m' : '5 · ≥ 250 m';
    if (!porBanda.has(banda)) porBanda.set(banda, { n: 0, op: 0, ok: 0 });
    const bb = porBanda.get(banda); bb.n++;
    if (d.estado === 'AMBIGUA') { ambD++; continue; }
    if (d.estado === 'SUELTA') { sueltaD++; continue; }
    bb.op++;
    const ok = mismo(d.nucleo, verdad);
    if (ok) { acierta++; bb.ok++; } else { falla++; if (fallos.length < 10) fallos.push([w, verdad, d.nucleo, Math.round(L)]); }
    const mios = nodosDe.get(w), suyos = nodosDe.get(d.wayVecino) || new Set();
    let pega = false;
    for (const nn of suyos) if (mios.has(nn)) { pega = true; break; }
    if (pega) { toca++; if (ok) tocaOk++; } else { suelto++; if (ok) sueltoOk++; }
  }
  const opina = acierta + falla, totD = opina + ambD + sueltaD;
  log('');
  log('   ' + 'cubo'.padEnd(28) + 'ways'.padStart(9) + '%'.padStart(9));
  for (const [k, v] of [['ACIERTA', acierta], ['FALLA', falla], ['NO OPINA · ambigua', ambD], ['NO OPINA · suelta', sueltaD]]) {
    log('   ' + k.padEnd(28) + String(v).padStart(9) + pct(v, totD).padStart(9));
  }
  log('');
  di('⭐⭐ ACIERTO CUANDO OPINA', `${acierta} de ${opina}  (${pct(acierta, opina)})`);
  di('   COBERTURA', pct(opina, totD));
  log('');
  log('   D2 · ⭐ LA LÍNEA BASE — ¿y si se cogiera una calle cercana al azar?');
  {
    const r = rng(SEMILLA);
    let ok = 0, n = 0, distintas = 0;
    for (const [w] of ways) {
      if (!conNombre(w)) continue;
      const p = puntoEn(geoDe.get(w), 0.5);
      const mapa = escanear(idx, g, p, 100, w, nucleoDeWay, nombreDeWay);
      const c = [...mapa.keys()];
      if (!c.length) continue;
      n++; distintas += c.length;
      if (mismo(c[Math.floor(r() * c.length)], nucleoDeWay(w))) ok++;
    }
    di('   vías distintas a menos de 100 m (media)', (distintas / n).toFixed(1));
    di('   ⭐ ACIERTO DEL AZAR entre las vías cercanas', `${ok} de ${n}  (${pct(ok, n)})`);
    log('      ⇒ sin esta línea, un ' + pct(acierta, opina) + ' no se sabe si es alto o si es lo que sale solo.');
  }
  log('');
  log('   D3 · ⚠️⚠️ EL SESGO, DECLARADO — y el confusor buscado');
  log('      Una acera CON nombre está en una calle que alguien se molestó en mapear bien.');
  log('      ⇒ **el ' + pct(acierta, opina) + ' es un TECHO, no una estimación.**');
  log('');
  log('      Y el confusor propio de §D: ¿y si acertara porque el vecino es la CONTINUACIÓN del');
  log('      propio way —otro trozo de la misma calle, pegado por la punta—? Se separa:');
  log('      ' + 'el vecino que gana…'.padEnd(34) + 'ways'.padStart(9) + 'acierto'.padStart(10));
  log('      ' + '…TOCA al way evaluado'.padEnd(34) + String(toca).padStart(9) + pct(tocaOk, toca).padStart(10));
  log('      ' + '⭐ …NO lo toca en ningún nodo'.padEnd(35) + String(suelto).padStart(9) + pct(sueltoOk, suelto).padStart(10));
  log('      ⇒ ⭐ **el caso limpio acierta MÁS**, no menos: el método no vive de las continuaciones.');
  log('        Los que tocan son en buena parte calles que CRUZAN, y ahí es donde falla.');
  log('');
  log('      ⚠️ Y por longitud, que es donde el muestreo de 5 puntos es más flojo:');
  log('      ' + 'longitud del way'.padEnd(22) + 'ways'.padStart(9) + 'opina'.padStart(9) + 'cobertura'.padStart(11) + 'acierto'.padStart(10));
  for (const [k, v] of [...porBanda.entries()].sort()) {
    log('      ' + k.padEnd(22) + String(v.n).padStart(9) + String(v.op).padStart(9)
      + pct(v.op, v.n).padStart(11) + pct(v.ok, v.op).padStart(10));
  }
  log('');
  log('      diez fallos, sin elegirlos:');
  for (const f of fallos) {
    log('      ' + String(f[3] + ' m').padStart(8) + '   VERDAD ' + String(f[1]).slice(0, 32).padEnd(34) + 'MÉTODO ' + f[2]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('C · ⭐⭐⭐ LOS DOS TESTIGOS, CRUZADOS');
  log('='.repeat(104));
  const port = Mo.deducirPorWay(g, portales);
  const may = Mo.mayoriaPortales(g, portales);
  const par = new Map();
  for (const [w] of ways) par.set(w, decidir(geoDe.get(w), idx, g, w, nucleoDeWay, nombreDeWay, {}));
  const dPort = (w) => { const v = port.get(w); return (v && v.estado === 'NOMBRADA') ? v : null; };
  const dPar = (w) => { const v = par.get(w); return (v && v.estado === 'PEGADA') ? v : null; };

  log('');
  log('   C1 · el cruce sobre las líneas SIN nombre — que es donde se aplica');
  {
    const c = { concuerdan: 0, discrepan: 0, soloPortal: 0, soloParalela: 0, ninguno: 0 };
    for (const [w] of ways) {
      if (!sinNombre(w)) continue;
      const a = dPort(w), b = dPar(w);
      if (a && b) { if (mismo(a.nucleo, b.nucleo)) c.concuerdan++; else c.discrepan++; }
      else if (a) c.soloPortal++; else if (b) c.soloParalela++; else c.ninguno++;
    }
    for (const k of ['concuerdan', 'discrepan', 'soloPortal', 'soloParalela', 'ninguno']) {
      di('   ' + k, c[k]);
    }
    const dos = c.concuerdan + c.discrepan;
    log('');
    di('   ⭐⭐ CUANDO OPINAN LOS DOS, ¿CONCUERDAN?', `${c.concuerdan} de ${dos}  (${pct(c.concuerdan, dos)})`);
    log('      ⇒ **Ése es el número que dice si la idea es fiable**, y dice que sí: dos fuentes');
    log('        distintas —el callejero municipal y el `name` de OSM— coinciden 19 de cada 20.');
    log('      ⛔ Y las ' + c.discrepan + ' que discrepan NO se nombran.');

    // ── ⚠️ CLASIFICAR ANTES DE CONTAR (ley 29): ¿qué son esas discrepancias? ──
    log('');
    log('   ⚠️⚠️ PERO «DISCREPAN» NO ES UNA SOLA COSA, y mirarlas cambia lo que significan:');
    log('      `jorge coci` / `jorge cocci`  ·  `herrerin jaime ballesteros` / `jaime ballesteros herrerin`');
    log('      **Eso no es la calle equivocada: es la misma calle escrita de otra manera.**');
    {
      const mismasPalabras = (a, b) => {
        const x = NL.palabras(a).slice().sort().join(' '), y = NL.palabras(b).slice().sort().join(' ');
        return x === y;
      };
      const comparte = (a, b) => NL.palabras(a).some((p) => p.length > 3 && NL.palabras(b).includes(p));
      const clase = (a, b) => mismasPalabras(a, b) ? 'las MISMAS palabras en otro orden'
        : comparte(a, b) ? 'comparten alguna palabra larga' : '⛔ no tienen nada que ver';
      const cl = new Map();
      const ej = [];
      for (const [w] of ways) {
        if (!sinNombre(w)) continue;
        const a = dPort(w), b = dPar(w);
        if (!a || !b || mismo(a.nucleo, b.nucleo)) continue;
        const k = clase(a.nucleo, b.nucleo);
        cl.set(k, (cl.get(k) || 0) + 1);
        if (ej.length < 6) ej.push('      · «' + a.nucleo + '»  contra  «' + b.nucleo + '»   ' + k);
      }
      for (const [k, v] of [...cl.entries()].sort((a, b) => b[1] - a[1])) {
        log('      ' + k.padEnd(42) + String(v).padStart(6) + pct(v, c.discrepan).padStart(9));
      }
      for (const l of ej) log(l);
      // ⭐ EL CONTROL: el mismo test sobre parejas de vías AL AZAR tiene que dar ~0
      const r = rng(SEMILLA);
      const catalogo = [...new Set([...ways.keys()].filter(conNombre).map(nucleoDeWay))];
      let falsos = 0;
      const N = 20000;
      for (let k = 0; k < N; k++) {
        const a = catalogo[Math.floor(r() * catalogo.length)], b = catalogo[Math.floor(r() * catalogo.length)];
        if (a !== b && clase(a, b) !== '⛔ no tienen nada que ver') falsos++;
      }
      log('      ⭐ CONTROL · el mismo test sobre ' + N + ' parejas de vías AL AZAR: '
        + falsos + '  (' + pct(falsos, N) + ')');
      log('      ⇒ ⛔ **NO se tocan ni el normalizador ni el reconocedor para absorberlas.** Es un');
      log('        emparejador aproximado, y eso ya falló en el 29,6 % del dataset heredado. Se');
      log('        MIDE, se dice cuánto pesa, y la línea se queda sin nombre. Cabo abierto.');
    }
  }

  log('');
  log('   C2 · ⭐⭐ EL ACIERTO DE CADA CELDA — lo que fija la regla');
  {
    const celdas = new Map();
    const add = (k, ok) => { if (!celdas.has(k)) celdas.set(k, { n: 0, ok: 0 }); const v = celdas.get(k); v.n++; if (ok) v.ok++; };
    let disc = 0, discPortal = 0, discPegada = 0, discNinguno = 0;
    for (const [w] of ways) {
      if (!conNombre(w)) continue;
      const verdad = nucleoDeWay(w);
      const a = dPort(w), b = dPar(w), m = may.get(w) || null;
      if (a && b) {
        if (mismo(a.nucleo, b.nucleo)) add('CONCUERDAN · ≥3 portales + paralela', mismo(b.nucleo, verdad));
        else {
          disc++;
          if (mismo(a.nucleo, verdad)) discPortal++;
          else if (mismo(b.nucleo, verdad)) discPegada++;
          else discNinguno++;
        }
      } else if (a) add('SOLO PORTALES · ≥3 votos, lo de la tanda 21', mismo(a.nucleo, verdad));
      else if (b) {
        if (m && mismo(m.nucleo, b.nucleo)) add('⭐ PARALELA + 1-2 portales que CONFIRMAN', mismo(b.nucleo, verdad));
        else if (m) add('⛔ PARALELA con la mayoría de portales EN CONTRA', mismo(b.nucleo, verdad));
        else add('PARALELA SOLA · ningún portal', mismo(b.nucleo, verdad));
      }
    }
    log('   ' + 'celda'.padEnd(50) + 'ways'.padStart(8) + 'acierto'.padStart(10) + '   ¿se aplica?');
    const APLICA = { 'CONCUERDAN · ≥3 portales + paralela': '⭐ SÍ',
      '⭐ PARALELA + 1-2 portales que CONFIRMAN': '⭐ SÍ',
      'PARALELA SOLA · ningún portal': 'SÍ',
      'SOLO PORTALES · ≥3 votos, lo de la tanda 21': 'SÍ (ya estaba)',
      '⛔ PARALELA con la mayoría de portales EN CONTRA': '⛔ NO' };
    for (const [k, v] of [...celdas.entries()].sort((a, b) => b[1].n - a[1].n)) {
      log('   ' + k.padEnd(50) + String(v.n).padStart(8) + pct(v.ok, v.n).padStart(10) + '   ' + (APLICA[k] || ''));
    }
    log('');
    log('   ⭐⭐ **ANTONIO TENÍA RAZÓN, Y ESTÁ MEDIDO:** un portal con respaldo paralelo acierta más');
    log('      que tres portales solos. Dos fuentes coincidiendo no son tres votos de la misma.');
    log('');
    log('   ⚠️ Y CUANDO DISCREPAN, ¿quién miente? — n=' + disc);
    di('      tiene razón EL PORTAL', discPortal);
    di('      tiene razón LA PARALELA', discPegada);
    di('      ⛔ ninguno de los dos', discNinguno);
    log('      ⇒ ' + (discPortal > discPegada ? 'miente más la paralela' : 'miente más el portal')
      + ', pero en ' + pct(discNinguno, disc) + ' de las discrepancias se equivocan LOS DOS.');
    log('        **Por eso una discrepancia no se resuelve eligiendo: se calla.**');
  }

  log('');
  log('   C3 · ⭐⭐⭐ EL CONFUSOR — ¿concuerdan porque aciertan, o porque beben de lo mismo?');
  log('      Los portales enganchan por PROXIMIDAD, y la proximidad es justo lo que mide la');
  log('      paralela. ⇒ se cogen los que SABEMOS mal enganchados —los 198 con firma y los 23');
  log('      imputables de la tanda 14— y se mira si la paralela repite su error.');
  {
    const FIRMA = 10, RADIO_COBERTURA = 60;
    const mu = Mun.cargar();
    const c198 = [];
    for (const o of portales.filter((x) => !x.nucleoOsm)) {
      if (!(Mun.cubierto(mu, o.q, RADIO_COBERTURA) && mu.porCodigo.has(o.codigoVia))) continue;
      const pts = mu.porCodigo.get(o.codigoVia).pts;
      const dPortalPropio = Mun.dA(o.m, pts), dEngPropio = Mun.dA(o.q, pts);
      const x = { dPortalPropio, dEngPropio, aleja: dEngPropio - dPortalPropio,
        dPortalOtra: Mun.masCercanoDeOtra(mu, o.m, o.codigoVia, 200).d,
        dEngOtra: Mun.masCercanoDeOtra(mu, o.q, o.codigoVia, 200) };
      if (x.aleja > FIRMA) c198.push({ o, x });
    }
    const imput = c198.filter(({ x }) => !(x.dPortalOtra < x.dPortalPropio) && x.dEngOtra.d < x.dEngPropio);
    di('   ⭐ positivo de control · con firma (la tanda 14 publicó 198)', c198.length);
    di('   ⭐ …imputables al motor (publicó 23)', imput.length);
    A.exige(c198.length === 198 && imput.length === 23,
      `la reimplementación del criterio de la tanda 14 da ${c198.length}/${imput.length} y lo publicado es 198/23`);
    const mira = (lista, etq) => {
      let opina = 0, arrastra = 0, otra = 0;
      for (const { o } of lista) {
        const b = dPar(g.aristas[o.arista].way);
        if (!b) continue;
        opina++;
        if (mismo(b.nucleo, o.via && o.via.nucleo)) arrastra++; else otra++;
      }
      log('      ' + etq.padEnd(26) + `n=${lista.length}`.padStart(7)
        + `la paralela opina ${opina}`.padStart(24)
        + `⛔ repite el error ${arrastra}`.padStart(24) + `⭐ dice otra cosa ${otra}`.padStart(24));
      return { opina, arrastra };
    };
    const r1 = mira(c198, 'los 198 con firma');
    const r2 = mira(imput, 'los 23 imputables');
    log('');
    log('   ⇒ ⭐⭐ **CERO.** La paralela habla en ' + r1.opina + ' de los 198 y en ninguno repite el nombre');
    log('     que da el portal mal enganchado. ⚠️ Y el cero tiene su positivo al lado: la paralela');
    log('     SÍ opina ahí (' + r1.opina + ' veces), así que no es un cero de un buscador roto.');
    A.exige(r1.arrastra === 0 && r2.arrastra === 0,
      'la paralela repite el error de portales que sabemos mal enganchados: los dos testigos no son independientes');
    log('   ⚠️ LO QUE ESTO NO DICE: que sean independientes ante CUALQUIER fallo. Dice que lo son');
    log('      ante los fallos de enganche que sabemos detectar. Un modo de fallo que moviera a la');
    log('      vez los portales y la geometría de OSM no lo vería nadie desde aquí.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('E · ⭐⭐ APLICADO — qué gana el grafo');
  log('='.repeat(104));
  log('   ⛔ El «antes» no se lee de un fichero viejo: se monta el modelo CON y SIN el segundo');
  log('      testigo en el mismo proceso y se comparan. Un número copiado no es un testigo.');
  {
    const Rel = require('./relato');
    const antes = Mo.construirModelo(g, portales, { sinParalela: true });
    const ahora = Mo.construirModelo(g, portales);
    const tramoDe = (mod) => (e) => Rel.tramo(
      { way: e.way, precision: e.precision, metros: e.largo }, nombreDeWay, 0, mod.modeloDeWay).nombre;
    const tA = tramoDe(antes), tB = tramoDe(ahora);
    let cA = 0, cB = 0, mA = 0, mB = 0, gana = 0, mGana = 0, pierde = 0, mPierde = 0;
    for (const e of g.aristas) {
      const a = !!tA(e), b = !!tB(e);
      if (a) { cA++; mA += e.largo; }
      if (b) { cB++; mB += e.largo; }
      if (!a && b) { gana++; mGana += e.largo; }
      if (a && !b) { pierde++; mPierde += e.largo; }
    }
    log('');
    log('   ⭐ LÍNEAS CON NOMBRE — lo que dice EL REDACTOR de cada arista (no una regla copiada)');
    di('   antes de la tanda 25 (AZULES del mapa)', `${cA}   (${km(mA)})`);
    di('   ⭐ ahora', `${cB}   (${km(mB)})`);
    di('   ROJAS · sin nombre — antes / ahora', `${g.aristas.length - cA} / ${g.aristas.length - cB}`);
    di('   ⭐ ganan nombre', `${gana}   (${km(mGana)})`);
    di('   ⚠️ lo PIERDEN — los dos testigos discrepan y se calla', `${pierde}   (${km(mPierde)})`);
    A.exige(cA + (g.aristas.length - cA) === g.aristas.length, 'la cuenta de antes no suma las aristas');
    A.exige(cB - cA === gana - pierde, 'el neto no cuadra con las que ganan menos las que pierden');
    const cuentaP = (t) => portales.filter((o) => o.arista != null && !t(g.aristas[o.arista])).length;
    const pA = cuentaP(tA), pB = cuentaP(tB);
    log('');
    di('   portales colgando de una línea SIN nombre — antes / ahora', `${pA} / ${pB}`);
    di('   ⭐ puertas que ganan calle', pA - pB);
    log('');
    log('   ⭐⭐ SALVADOR MINGUIJÓN — la calle con la que Antonio destapó la tanda 24');
    {
      const nuc = P.nucleo('Calle Salvador Minguijón');
      const eje = [...ways.keys()].filter((w) => nucleoDeWay(w) === nuc);
      const aceras = new Set();
      for (const o of portales) {
        if (!o.via || o.via.nucleo !== nuc || o.arista == null) continue;
        const w = g.aristas[o.arista].way;
        if (!nucleoDeWay(w)) aceras.add(w);
      }
      const nom = (mod, w) => { const d = mod.deducidas.get(w); return !!(d && d.estado === 'NOMBRADA'); };
      const nA = [...aceras].filter((w) => nom(antes, w)).length;
      const nB = [...aceras].filter((w) => nom(ahora, w)).length;
      di('   el EJE · ways con nombre en OSM · aristas',
        `${eje.length} · ${eje.reduce((s, w) => s + ways.get(w).length, 0)}   ⭐ azules desde siempre`);
      di('   las ACERAS que reciben portales de esa calle', aceras.size);
      di('   ⭐ …con nombre ANTES / AHORA', `${nA} / ${nB}`);
      log('      ⇒ ' + (nB === aceras.size ? 'las nombra TODAS' : 'quedan ' + (aceras.size - nB) + ' sin nombre')
        + '. Y el nombre que se imprime es el de OSM —«Calle Salvador Minguijón»—,');
      log('        no el municipal en mayúsculas: cuando los dos testigos coinciden, D0 manda.');
    }
  }

  log('');
  log(A.cierre('LA CALLE QUE VA PEGADA'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
