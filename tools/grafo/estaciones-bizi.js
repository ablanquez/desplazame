// ⭐⭐⭐ H2b · TANDA 4 — LAS 276 ESTACIONES BiZi. **SOLO MIDE.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ LO QUE ESTE FICHERO **NO** HACE
// ═════════════════════════════════════════════════════════════════════════════
//   · no toca `src/` — ni una línea. La rendija de la tanda de arreglo 9 se cerró
//   · no combina con el bus ni con el tranvía (tanda siguiente)
//   · no calcula ni un minuto: la velocidad de `empuja` no está decidida
//   · no hace el grafo dirigido: `oneway` sigue medido y sin aplicar
//
//   node tools/grafo/estaciones-bizi.js

'use strict';

const fs = require('fs');
const path = require('path');
const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const P = require('../../src/portales');
const osm = require('../../src/osm');
const { aMetros } = require('../../src/geo');
const Ra = require('../../src/rutas-antonio');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);
const f1 = (x) => (Number.isFinite(x) ? (Math.round(x * 10) / 10).toFixed(1) : '∞');
const pc = (a, b) => (100 * a / b).toFixed(1) + ' %';

const EXP = path.join(__dirname, '..', '..', 'data', 'exploracion');
/** Lo publicado que hay que REENCONTRAR, no recitar. */
const PUB = {
  estaciones: 276, anclajes: 5520, portales: 46150, muestra: 2308,
  p99Peatonal: 65.4,          // docs/H2A-ENGANCHE-DE-LAS-PARADAS.md §2.2
  p99Postes: 11.1,            // ídem, bus
  p99PortalesBici: 73.9,      // docs/H2B-ENGANCHE-BICI.md §1.2
  circula: 49972, maxEng: 350,
};
const TOL_CONTROL_M = 1.0;

function percentiles(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const p = (q) => a[Math.min(a.length - 1, Math.floor(a.length * q))];
  return { n: a.length, min: a[0], p50: p(0.50), p75: p(0.75), p90: p(0.90),
    p95: p(0.95), p99: p(0.99), max: a[a.length - 1] };
}
const CAB = '   ' + 'población'.padEnd(32) + 'n'.padStart(7) + 'mín'.padStart(9)
  + 'p50'.padStart(9) + 'p75'.padStart(9) + 'p90'.padStart(9) + 'p95'.padStart(9)
  + 'p99'.padStart(9) + 'máx'.padStart(10);
const fila = (etq, s) => log('   ' + etq.padEnd(32) + String(s.n).padStart(7)
  + f1(s.min).padStart(9) + f1(s.p50).padStart(9) + f1(s.p75).padStart(9)
  + f1(s.p90).padStart(9) + f1(s.p95).padStart(9) + f1(s.p99).padStart(9) + f1(s.max).padStart(10));

raya();
log('LAS 276 ESTACIONES BiZi — distribución, no media. ⛔ Solo se mide.');
raya();

// ═════════════════════════════════════════════════════════════════════════════
// P0 · EL UNIVERSO (ley 148)
// ═════════════════════════════════════════════════════════════════════════════
const g = R.construir(R.ZONA_TERMINO);
const tagsDe = new Map(osm.cargar(R.CRUDO).ways.map((w) => [w.id, w.tags || {}]));
const CIRCULA = new Set(['cycleway', 'residential', 'service', 'tertiary', 'secondary', 'primary',
  'unclassified', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link', 'track', 'path']);
const pasaBici = (e) => CIRCULA.has(e.highway)
  && !((tagsDe.get(e.way) || {}).bicycle === 'no' || (tagsDe.get(e.way) || {}).access === 'no');

log('');
raya('─');
log('P0 · EL UNIVERSO — el grafo del motor y el predicado ya publicado');
raya('─');
di('grafo', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');
const nCircula = g.aristas.filter(pasaBici).length;
di('aristas · a pie · que «circulan»', g.aristas.length + ' · ' + g.aristas.filter((e) => e.pie).length + ' · ' + nCircula);
A.exige(nCircula === PUB.circula, `el predicado da ${nCircula} y H2b·2 publicó ${PUB.circula}`);
const idxPie = P.indexarAristas(g.aristas, (e) => e.pie);
const idxBici = P.indexarAristas(g.aristas, pasaBici);
const engancheDe = (m, idx) => {
  const { mejor } = P.engancharUno(m, g.aristas, idx, () => '', PUB.maxEng);
  return mejor ? { d: mejor.d, i: mejor.i } : null;
};

// ═════════════════════════════════════════════════════════════════════════════
// P1 · ⭐⭐ EL POSITIVO DE CONTROL — sin esto nada vale (ley 4)
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P1 · ⭐⭐ EL POSITIVO DE CONTROL — la muestra de H2·5, con ESTE instrumento');
raya('─');
const portales = P.cargarPortales();
A.exige(portales.length === PUB.portales, `salen ${portales.length} portales y son ${PUB.portales}`);
const muestra = portales.filter((_, i) => i % 20 === 0);
const dCtl = [];
for (const p of muestra) { const e = engancheDe(p.m, idxPie); if (e) dCtl.push(e.d); }
const ctl = percentiles(dCtl);
log(CAB); raya('-');
fila('PORTALES → red PEATONAL', ctl);
const desvio = Math.abs(ctl.p99 - PUB.p99Peatonal);
di('p99 medido · publicado · desvío', f1(ctl.p99) + ' m · ' + PUB.p99Peatonal + ' m · ' + f1(desvio) + ' m');
A.exige(desvio <= TOL_CONTROL_M,
  `el control da p99 ${f1(ctl.p99)} m y lo publicado es ${PUB.p99Peatonal} m: el instrumento NO `
  + 'reproduce la medida conocida y todo lo que siga es ruido');
{
  const falso = percentiles(dCtl.map((x) => x * 1.5));
  di('⭐ provocado: la muestra inflada un 50 %', Math.abs(falso.p99 - PUB.p99Peatonal) > TOL_CONTROL_M
    ? '✅ lo cazaría (p99 ' + f1(falso.p99) + ')' : '⛔ NO lo cazaría');
  A.exige(Math.abs(falso.p99 - PUB.p99Peatonal) > TOL_CONTROL_M, 'el control no sabe fallar');
}

// ═════════════════════════════════════════════════════════════════════════════
// P2 · LAS DOS FUENTES, RECONTADAS — ⛔ no recitadas
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P2 · LAS DOS FUENTES — recontadas hoy sobre los ficheros del 2/08');
raya('─');
let W = [];
const pags = fs.readdirSync(EXP).filter((f) => /^2026-08-02_wfs_bizi_pag\d+\.json$/.test(f)).sort();
for (const f of pags) W = W.concat(JSON.parse(fs.readFileSync(path.join(EXP, f), 'utf8')).features);
const anclajes = W.reduce((s, w) => s + w.properties.anclajes_bicicletas, 0);
di('WFS · ficheros de paginación', pags.length);
di('WFS · estaciones · anclajes', W.length + ' · ' + anclajes + '   (publicado ' + PUB.estaciones + ' · ' + PUB.anclajes + ')');
A.exige(W.length === PUB.estaciones && anclajes === PUB.anclajes,
  `el WFS da ${W.length} estaciones y ${anclajes} anclajes; lo publicado es ${PUB.estaciones} y ${PUB.anclajes}`);

// ── la SEGUNDA fuente, y qué se puede contrastar DE VERDAD ───────────────────
const AP = JSON.parse(fs.readFileSync(path.join(EXP, '2026-08-02_zaragoza-api_bizi-rows1.json'), 'utf8'));
const AG = JSON.parse(fs.readFileSync(path.join(EXP, '2026-08-02_zaragoza-api_bizi-rows50.geojson'), 'utf8')).features;
di('API de la sede · totalCount declarado', AP.totalCount);
di('⚠️ API · estaciones EN DISCO', AG.length + ' de ' + AP.totalCount + '   ⇒ el contraste uno a uno solo alcanza a ' + AG.length);
A.exige(AP.totalCount === PUB.estaciones, `la API declara ${AP.totalCount} y el WFS ${PUB.estaciones}`);
log('');
log('   ⭐ LA CLAVE, y no es la proximidad: el `title` de la API empieza por el `numero`');
log('     del WFS ⇒ hay identificador, y emparejar por distancia sería inventarlo.');
{
  const porNum = new Map(W.map((w) => [w.properties.numero, w]));
  const RT = 6371000, RAD = Math.PI / 180;
  const dg = (a, b) => {
    const x = (b[0] - a[0]) * RAD * Math.cos((a[1] + b[1]) / 2 * RAD);
    const y = (b[1] - a[1]) * RAD;
    return Math.hypot(x, y) * RT;
  };
  let conNum = 0, existen = 0; const dd = [];
  for (const a of AG) {
    const m = /^(\d+)-/.exec(a.properties.title);
    if (!m) continue;
    conNum++;
    const w = porNum.get(Number(m[1]));
    if (!w) continue;
    existen++;
    dd.push(dg(a.geometry.coordinates, w.geometry.coordinates));
  }
  di('API con `numero` en el título', conNum + ' de ' + AG.length);
  di('⭐ …y cuyo número EXISTE en el WFS', existen + ' de ' + conNum);
  A.exige(existen === conNum, `${conNum - existen} números de la API no existen en el WFS`);
  const s = percentiles(dd);
  log('');
  log(CAB); raya('-');
  fila('⚠️ LA MISMA estación, WFS ↔ API', s);
  log('      a más de 10 m: ' + dd.filter((x) => x > 10).length + ' de ' + dd.length);
  log('   ⇒ ⚠️ **Las dos fuentes NO están en el mismo sitio.** Coinciden en el recuento y en');
  log('     la identidad, y difieren hasta ' + f1(s.max) + ' m en la POSICIÓN. ⛔ Y eso importa aquí,');
  log('     porque el enganche que se mide abajo es de ese orden de magnitud.');
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 · `tipologia` — qué dice el esquema, y qué se puede medir
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · `tipologia` — ⛔ qué significa: NO CONSTA. Qué se puede MEDIR: esto.');
raya('─');
{
  const xsd = fs.readFileSync(path.join(EXP, '2026-08-02_wfs_describe_movilidad-MU1_estaciones_bici_ubicacion.xml'), 'utf8');
  const linea = xsd.split(/>\s*/).find((l) => l.includes('name="tipologia"'));
  log('   lo que el esquema del WFS declara, literal:');
  log('      ' + (linea || '(no aparece)').trim());
  const doc = /documentation|annotation|enumeration/i.test(xsd);
  di('¿trae documentación, anotación o enumerado?', doc ? '⚠️ SÍ' : '⛔ NO — `xsd:string` y nada más');
  A.exige(!doc, 'el esquema SÍ documenta algo: hay que leerlo en vez de declarar NO CONSTA');
  log('   ⇒ ⛔ **Qué significa LINEAL, ENFRENTADA o DOBLE: `NO CONSTA`.** No hay leyenda');
  log('     publicada, y deducirla del nombre sería inventar el dato.');
  log('');
  log('   ⭐ Y LO QUE SÍ SE MIDE — la sospecha que el encargo mandaba comprobar:');
  log('     *«una ENFRENTADA podría tener dos anclajes a los dos lados de la calle»*, que');
  log('     sería el problema de los andenes gemelos con otro nombre.');
  const RT = 6371000, RAD = Math.PI / 180;
  const dg = (a, b) => {
    const x = (b.lon - a.lon) * RAD * Math.cos((a.lat + b.lat) / 2 * RAD);
    const y = (b.lat - a.lat) * RAD;
    return Math.hypot(x, y) * RT;
  };
  const E = W.map((w) => ({ n: w.properties.numero, nom: w.properties.nombre,
    tipo: w.properties.tipologia, anc: w.properties.anclajes_bicicletas,
    pav: w.properties.pavimento, lon: w.geometry.coordinates[0], lat: w.geometry.coordinates[1] }));
  log('');
  log('   ' + 'tipología'.padEnd(14) + 'n'.padStart(6) + 'vecina más cercana (mín · p50)'.padStart(34)
    + 'anclajes (mín · p50 · máx)'.padStart(30));
  const tipos = [...new Set(E.map((e) => e.tipo))].sort();
  for (const T of tipos) {
    const S = E.filter((e) => e.tipo === T);
    const v = percentiles(S.map((p) => Math.min(...E.filter((q) => q !== p).map((q) => dg(p, q)))));
    const a = percentiles(S.map((p) => p.anc));
    log('   ' + T.padEnd(14) + String(S.length).padStart(6)
      + (f1(v.min) + ' m · ' + f1(v.p50) + ' m').padStart(34)
      + (a.min + ' · ' + a.p50 + ' · ' + a.max).padStart(30));
  }
  const enf = E.filter((e) => e.tipo !== 'LINEAL');
  const minVec = Math.min(...enf.map((p) => Math.min(...E.filter((q) => q !== p).map((q) => dg(p, q)))));
  log('');
  di('⛔ la NO-LINEAL más cercana a otra estación', f1(minVec) + ' m');
  log('      ⇒ ⭐⭐ **NO es el problema de los andenes.** Si `ENFRENTADA` fuera «dos mitades a');
  log('        los dos lados de la calle», habría PARES de estaciones a metros una de otra,');
  log('        y la más cercana está a ' + f1(minVec) + ' m. **Es UNA feature, con UN número y UN');
  log('        recuento de anclajes.** Lo que describa la palabra, `NO CONSTA`.');
  A.exige(minVec > 100, `hay una estación no-LINEAL a ${f1(minVec)} m de otra: la sospecha de los `
    + 'andenes gemelos NO está descartada y hay que PARAR y avisar');
}

// ═════════════════════════════════════════════════════════════════════════════
// P4 · ⭐⭐⭐ EL ENGANCHE DE LAS 276 — ⛔ sin heredar ningún listón
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · ⭐⭐⭐ EL ENGANCHE DE LAS 276 — y NO se hereda ningún listón');
raya('─');
log('   ⛔ Un portal está en una FACHADA (p99 ' + PUB.p99Peatonal + ' m) y un poste EN LA VÍA PÚBLICA');
log('     (p99 ' + PUB.p99Postes + ' m). Una estación está en la acera o en la calzada: **puede');
log('     parecerse más al poste, y hay que medirlo.**');
const EST = W.map((w) => ({ n: w.properties.numero, nom: w.properties.nombre,
  tipo: w.properties.tipologia, pav: w.properties.pavimento, anc: w.properties.anclajes_bicicletas,
  m: aMetros(w.geometry.coordinates[0], w.geometry.coordinates[1]) }));
const dPie = [], dBici = [];
let sinPie = 0, sinBici = 0;
for (const e of EST) {
  const a = engancheDe(e.m, idxPie); const b = engancheDe(e.m, idxBici);
  if (a) { dPie.push(a.d); e.ePie = a; } else sinPie++;
  if (b) { dBici.push(b.d); e.eBici = b; } else sinBici++;
}
log('');
log(CAB); raya('-');
fila('⭐ ESTACIONES → red PEATONAL', percentiles(dPie));
fila('⭐ ESTACIONES → red de BICI', percentiles(dBici));
log('   ' + '─'.repeat(97));
fila('(publicado) PORTALES → peatonal', { n: PUB.portales, min: 0, p50: 5.3, p75: 8.8, p90: 18, p95: 27, p99: 65.2, max: 303.1 });
fila('(publicado) POSTES de bus → peat.', { n: 934, min: 0, p50: 2.2, p75: 5.0, p90: 7.3, p95: 8.3, p99: 11.1, max: 23.7 });
log('');
di('⛔ estaciones SIN arista peatonal a ' + PUB.maxEng + ' m', sinPie);
di('⛔ estaciones SIN arista de BICI a ' + PUB.maxEng + ' m', sinBici);

// ═════════════════════════════════════════════════════════════════════════════
// P5 · EL TRAMO EMPUJANDO — el criterio de la tanda 3, aplicado
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P5 · EL TRAMO EMPUJANDO — el criterio de la tanda 3, sin cambiarlo');
raya('─');
const { ady: adyPie } = G.adyacencia(g.nodos, g.aristas, G.PASA_A_PIE, false);
const { ady: adyBici } = G.adyacencia(g.nodos, g.aristas, pasaBici, false);
/** Dijkstra con varios orígenes, cada uno con su distancia inicial.
 *  ⚠️ Es el mismo algoritmo de `G.dijkstra` con la cola del proyecto; lo único que
 *  cambia es el arranque. Se controla abajo contra la función del proyecto. */
function dijkstraMulti(ady, origenes) {
  const dist = new Float64Array(ady.length).fill(Infinity);
  const q = new G.Cola();
  for (const [n, d0] of origenes) { if (d0 < dist[n]) { dist[n] = d0; q.push(d0, n); } }
  while (q.size) {
    const [d, v] = q.pop();
    if (d > dist[v]) continue;
    for (const { n: u, w } of ady[v]) {
      const nd = d + w;
      if (nd < dist[u]) { dist[u] = nd; q.push(nd, u); }
    }
  }
  return dist;
}
{
  const o = g.aristas.find((e) => e.pie).a;
  const mio = dijkstraMulti(adyPie, [[o, 0]]);
  const suyo = G.dijkstra(adyPie, o).dist;
  let dif = 0;
  for (let i = 0; i < mio.length; i++) if (mio[i] !== suyo[i]) dif++;
  di('⭐ control: multiorigen con UN origen vs `G.dijkstra`', dif === 0 ? '✅ idéntico nodo a nodo' : '⛔ ' + dif);
  A.exige(dif === 0, `el multiorigen difiere de G.dijkstra en ${dif} nodos`);
}
const nodosBici = new Set();
for (const e of g.aristas) if (pasaBici(e)) { nodosBici.add(e.a); nodosBici.add(e.b); }
const alaBici = dijkstraMulti(adyPie, [...nodosBici].map((n) => [n, 0]));
const empuje = [];
let sinLlegar = 0;
for (const e of EST) {
  if (!e.ePie) { sinLlegar++; continue; }
  const ar = g.aristas[e.ePie.i];
  const d = Math.min(alaBici[ar.a], alaBici[ar.b]);
  if (!Number.isFinite(d)) { sinLlegar++; continue; }
  e.empuje = e.ePie.d + d;
  empuje.push(e.empuje);
}
log('');
log(CAB); raya('-');
fila('⭐ EMPUJANDO, andado de verdad', percentiles(empuje));
fila('   (comparar) en línea recta', percentiles(dBici));
log('');
di('⛔ estaciones que NO alcanzan la red de bici andando', sinLlegar + '   (' + pc(sinLlegar, EST.length) + ')');
{
  const yaEsBici = EST.filter((e) => e.ePie && pasaBici(g.aristas[e.ePie.i])).length;
  di('⭐ estaciones cuya arista PEATONAL ya es de bici', yaEsBici + '   (' + pc(yaEsBici, EST.length) + ')');
  log('      ⇒ para ésas el tramo empujando es CERO. En portales fue el 63,9 %.');
}
log('');
log('   ⚠️ Y el reparto por `pavimento`, que es la variable que sospechaba la tanda 1:');
log('   ' + 'pavimento'.padEnd(14) + 'n'.padStart(6) + 'p50 a la bici'.padStart(16) + 'p90'.padStart(10) + 'máx'.padStart(10));
for (const pav of [...new Set(EST.map((e) => e.pav))].sort()) {
  const S = EST.filter((e) => e.pav === pav && e.eBici);
  const s = percentiles(S.map((e) => e.eBici.d));
  log('   ' + pav.padEnd(14) + String(s.n).padStart(6) + (f1(s.p50) + ' m').padStart(16)
    + (f1(s.p90) + ' m').padStart(10) + (f1(s.max) + ' m').padStart(10));
}

// ═════════════════════════════════════════════════════════════════════════════
// P6 · ⭐⭐⭐ UN TRAYECTO EN BiZi — andar · rodar · andar
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P6 · ⭐⭐⭐ UN TRAYECTO EN BiZi — ⛔ que salga no demuestra nada');
raya('─');
/** Nodo de bici desde el que se rueda tras empujar, y lo que cuesta llegar. */
function accesoBici(nodo) {
  // el nodo de bici más cercano andando, y su distancia
  return alaBici[nodo];
}
function trayectoBizi(mO, mD) {
  const eO = engancheDe(mO, idxPie), eD = engancheDe(mD, idxPie);
  if (!eO || !eD) return null;
  const nO = g.aristas[eO.i].a, nD = g.aristas[eD.i].a;
  // 1 · andar desde el origen a TODOS los nodos
  const desdeO = dijkstraMulti(adyPie, [[nO, eO.d]]);
  const haciaD = dijkstraMulti(adyPie, [[nD, eD.d]]);
  // 2 · coste de llegar rodando: se entra a la red de bici por la estación A
  const entradas = [];
  for (const e of EST) {
    if (!e.ePie) continue;
    const ar = g.aristas[e.ePie.i];
    const andar = desdeO[ar.a];
    const emp = Math.min(alaBici[ar.a], alaBici[ar.b]);
    if (!Number.isFinite(andar) || !Number.isFinite(emp)) continue;
    const nodoBici = alaBici[ar.a] <= alaBici[ar.b] ? ar.a : ar.b;
    entradas.push([nodoBici, andar + emp, e]);
  }
  if (!entradas.length) return null;
  // 3 · UN solo Dijkstra sobre la red de bici, arrancando con esos costes
  const rodado = dijkstraMulti(adyBici, entradas.map(([n, c]) => [n, c]));
  // 4 · salir por la estación B
  let mejor = null;
  for (const e of EST) {
    if (!e.ePie) continue;
    const ar = g.aristas[e.ePie.i];
    const emp = Math.min(alaBici[ar.a], alaBici[ar.b]);
    const nodoBici = alaBici[ar.a] <= alaBici[ar.b] ? ar.a : ar.b;
    const andar = haciaD[ar.a];
    const tot = rodado[nodoBici] + emp + andar;
    if (Number.isFinite(tot) && (!mejor || tot < mejor.total)) mejor = { total: tot, salida: e };
  }
  return { mejor, desdeO, haciaD, nO, nD };
}
{
  const pO = Ra.POI['Estación Delicias'], pD = Ra.POI['C.C. Utrillas'];
  const t = trayectoBizi(aMetros(pO.lon, pO.lat), aMetros(pD.lon, pD.lat));
  A.exige(!!t && !!t.mejor, 'no sale ningún trayecto en BiZi entre los dos POI');
  const andandoEntero = t.desdeO[t.nD];
  // ⛔⛔ LEY 182 · EL ATAJO DE ESTE BLOQUE, CON SU CIFRA AL LADO. Todo lo de aquí
  //   se mide **de NODO a NODO** —el enganche entra como coste inicial—, mientras
  //   que el motor inserta el punto proyectado DENTRO de la arista (`G.insertar`).
  //   ⇒ los dos números no son el mismo, y el atajo se usa porque hace falta un
  //     Dijkstra completo sobre 276 entradas, no una ruta suelta.
  //   ⭐ Lo que legitima la comparación es que **las DOS ramas usan el mismo
  //     atajo**: BiZi y andando salen de la misma aproximación.
  // ⛔ El de VERDAD: con el enganche del motor, que es el que produjo el 4.743,4
  //   publicado por la tanda 3. ⭐ No se fabrica el punto: se llama a la función.
  const rMotor = (() => {
    const o = R.engancharPunto(g, pO.lat, pO.lon, 'origen');
    const d = R.engancharPunto(g, pD.lat, pD.lon, 'destino');
    const r = G.rutaEntre(g, o, d);
    return r.encontrada ? r.metros : null;
  })();
  log('   ⛔ EL ATAJO DE ESTE BLOQUE, MEDIDO (ley 182):');
  di('   andando, de NODO a NODO (lo que se usa aquí)', f1(andandoEntero) + ' m');
  di('   andando, CON EL MOTOR (R.engancharPunto + G.rutaEntre)', rMotor == null ? 'NO CONSTA' : rMotor + ' m   (la tanda 3 publicó 4743,4)');
  if (rMotor != null) {
    const dif = rMotor - andandoEntero;
    di('   ⇒ lo que cuesta no insertar el punto en la arista', f1(dif) + ' m   (' + pc(Math.abs(dif), rMotor) + ')');
    log('      ⚠️ **Las dos ramas de abajo llevan este mismo sesgo**, así que la comparación');
    log('        BiZi ↔ andando vale; ⛔ los metros absolutos NO son los del motor.');
    A.exige(Math.abs(dif) < 100, `el atajo de nodo a nodo se desvía ${f1(dif)} m del motor: `
      + 'demasiado para comparar nada con él');
  }
  log('');
  di('⭐ trayecto en BiZi, total en METROS', f1(t.mejor.total) + ' m');
  di('   andando entero (la MISMA aproximación)', f1(andandoEntero) + ' m');
  di('   ⇒ diferencia', f1(t.mejor.total - andandoEntero) + ' m   ('
    + (t.mejor.total > andandoEntero ? '⛔ la BiZi es MÁS LARGA' : '⭐ la BiZi es más corta') + ')');
  log('');
  log('   ⛔⛔ Y AQUÍ ESTÁ EL RESULTADO DE VERDAD, que no es el número: **en METROS la BiZi');
  log('     NO PUEDE GANAR casi nunca.** Rodar no acorta: acorta el TIEMPO. ⇒ un motor que');
  log('     minimiza metros **nunca elegiría la BiZi, ni a 400 m ni a 4 km**, y la pregunta');
  log('     «¿la cogería para 400 m?» **no se puede ni formular sin la unidad de tiempo.**');
  A.exige(t.mejor.total >= andandoEntero - 1,
    'la BiZi sale MÁS CORTA en metros que andar: revisar, porque rodar no acorta distancia');
}

// ═════════════════════════════════════════════════════════════════════════════
// P7 · LOS LÍMITES
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P7 · ⚠️ LOS LÍMITES, DECLARADOS');
raya('─');
log('   ⛔ NO SE SABE SI HAY BICIS. H2 es sin reloj: lo máximo que se puede decir es');
log('     **«esta estación existe y está aquí»**. La API trae `bicisDisponibles` y');
log('     `anclajesDisponibles` y ⛔ **no se usan**: son una foto de un instante.');
{
  const one = g.aristas.filter((e) => pasaBici(e) && (tagsDe.get(e.way) || {}).oneway === 'yes').length;
  log('');
  log('   ⛔ La red de bici sigue NO DIRIGIDA: `oneway=yes` en ' + one + ' de ' + nCircula
    + ' (' + pc(one, nCircula) + ').');
  log('   ⛔ Y sigue SIN DURACIÓN: falta la velocidad de `empuja`.');
}

log('');
raya();
log(A.cierre('LAS ESTACIONES BiZi'));
