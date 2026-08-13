// ⭐⭐⭐ H2b · TANDA 6 — LA CUESTA. **Esta tanda MIDE y decide si merece la pena.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LO QUE ESTE FICHERO **NO** HACE, dicho antes de que nadie lo suponga
// ═════════════════════════════════════════════════════════════════════════════
//   · **NO aplica la pendiente al motor.** Ni a `src/`, ni a las adyacencias,
//     ni a ninguna arista. Aquí se contesta *«¿cuánto se movería?»*.
//   · **NO recalcula nada publicado.** El umbral de ~1,5 km y los 28,6 min de
//     `docs/H2B-TRAYECTO-BICI.md` **siguen siendo los que son**: lo que se hace
//     es medirles el error **sobre el mismo camino**.
//   · **NO hace el grafo dirigido**, que es lo que haría falta de verdad.
//
// ⚠️ Y EL ALCANCE DEL NÚMERO DE §P6, PEGADO AL NÚMERO Y NO EN UN APARTADO FINAL:
//   medir el error sobre **el mismo camino** da una **COTA INFERIOR**. Con la
//   pendiente dentro, el camino óptimo también cambiaría —en la tanda 5, cambiar
//   de metros a minutos ya movió el camino de 4.734 m a 5.527 m— y un motor que
//   pudiera esquivar la cuesta perdería menos de lo que aquí sale.
//
//   node tools/grafo/cuesta.js

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
const M = require('./mdt');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(56) + ' ' + v);
const f1 = (x) => x.toFixed(1);
const f2 = (x) => x.toFixed(2);
const pc = (a, b) => (100 * a / b).toFixed(1) + ' %';

// ─────────────────────────────────────────────────────────────────────────────
// LAS CONSTANTES DE LA TANDA 0 Y LA 5. ⛔ Aquí no se toca ninguna.
// ─────────────────────────────────────────────────────────────────────────────
const V = { andar: 5.0, empujar: 4.0, rodar: 18.0 };
const min = (m, v) => m / (v * 1000 / 60);
const CAMBIO_S = 120;

// ─────────────────────────────────────────────────────────────────────────────
// ⭐⭐ LAS DOS TABLAS DE VALHALLA, COPIADAS DE SU FUENTE — y la trampa que tienen
//
//   Las dos se llaman `kGradeBasedSpeedFactor` y **NO significan lo mismo**:
//     · en `src/sif/bicyclecost.cc:132` multiplica la VELOCIDAD
//         `bike_speed = speed_ * surface … * kGradeBasedSpeedFactor[grade]`  (L716)
//     · en `src/sif/pedestriancost.cc:201` multiplica el TIEMPO
//         `sec = edge->length() * speedfactor_ * … * kGradeBasedSpeedFactor[…]` (L750)
//   ⇒ un 1,83 al +10 % es **83 % MÁS TIEMPO** para el peatón, y un 0,5 al +10 %
//     es **la mitad de velocidad** para la bici. Leer la del peatón con la
//     convención de la bici diría que uno anda más rápido cuesta arriba.
//   ⭐ Ley: **tener la fuente correcta no garantiza tener el valor correcto.**
// ─────────────────────────────────────────────────────────────────────────────
const GRADOS = [-10, -8, -6.5, -5, -3, -1.5, 0, 1.5, 3, 5, 6.5, 8, 10, 11.5, 13, 15];
/** multiplica VELOCIDAD (bicyclecost.cc:132-149) */
const F_BICI = [2.2, 2.0, 1.9, 1.7, 1.4, 1.2, 1.0, 0.95, 0.85, 0.75, 0.65, 0.55, 0.5, 0.45, 0.4, 0.3];
/** multiplica TIEMPO (pedestriancost.cc:201-218) */
const F_PIE = [1.33, 1.22, 1.08, 0.97, 0.88, 0.92, 1.00, 1.10, 1.20, 1.33, 1.43, 1.57, 1.83, 2.03, 2.23, 2.50];
/** el cubo de Valhalla al que cae una pendiente con signo. */
const cubo = (p) => {
  let k = 0; let d = Infinity;
  for (let i = 0; i < GRADOS.length; i++) { const x = Math.abs(p - GRADOS[i]); if (x < d) { d = x; k = i; } }
  return k;
};

raya();
log('LA CUESTA — ¿hay dato, cuánta hay, y cuánto se movería lo ya publicado?');
raya();

// ═════════════════════════════════════════════════════════════════════════════
// P0 · EL UNIVERSO Y LOS DOS CONTROLES DE UNIÓN
// ═════════════════════════════════════════════════════════════════════════════
const g = R.construir(R.ZONA_TERMINO);
const crudo = osm.cargar(R.CRUDO);
const tagsDe = new Map(crudo.ways.map((w) => [w.id, w.tags || {}]));
const CIRCULA = new Set(['cycleway', 'residential', 'service', 'tertiary', 'secondary', 'primary',
  'unclassified', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link', 'track', 'path']);
const pasaBici = (e) => CIRCULA.has(e.highway)
  && !((tagsDe.get(e.way) || {}).bicycle === 'no' || (tagsDe.get(e.way) || {}).access === 'no');
const PUB = { circula: 49972, kmBici: 4870.8, andandoPOI: 4743.4, rodando: 4348.3, tramo1: 416.4,
  tramo5: 762.7, totalBizi: 32.6, totalAndando: 56.9 };

log('');
raya('─');
log('P0 · EL UNIVERSO — sobre qué grafo se mide, y qué sostiene la unión');
raya('─');
di('grafo', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');
di('aristas · nodos', g.aristas.length + ' · ' + g.nodos.length);
const bici = g.aristas.filter(pasaBici);
di('aristas de bici (`circula`)', bici.length + '   publicado ' + PUB.circula);
A.exige(bici.length === PUB.circula, `el predicado da ${bici.length} y está publicado ${PUB.circula}`);
const kmBici = bici.reduce((s, e) => s + e.largo, 0) / 1000;
di('km de bici', f1(kmBici) + '   publicado ' + PUB.kmBici);

// la z de cada nodo, una sola vez
const Z = new Float64Array(g.nodos.length).fill(NaN);
for (let i = 0; i < g.nodos.length; i++) {
  const z = M.altura(g.nodos[i].x, g.nodos[i].y);
  if (z !== null) Z[i] = z;
}
const conZ = Z.reduce((s, x) => s + (Number.isNaN(x) ? 0 : 1), 0);
di('⭐ nodos con altura del MDT', conZ + ' de ' + g.nodos.length + '   ' + pc(conZ, g.nodos.length));
A.exige(conZ === g.nodos.length, `${g.nodos.length - conZ} nodos sin altura: habría tramos del grafo `
  + 'midiéndose como llanos por falta de dato, no por ser llanos');
// ⭐ y el uno que acompaña al cero (ley del positivo de control): que sepa fallar
{
  const fuera = M.altura(0, 0);
  di('⭐ provocado: se pide la altura fuera de las teselas', fuera === null ? '✅ contesta null' : '⛔ contesta ' + fuera);
  A.exige(fuera === null, 'el muestreador inventa altura fuera de su cobertura: sus ceros no valen nada');
}

// ═════════════════════════════════════════════════════════════════════════════
// P1 · ⭐⭐ EL POSITIVO DE CONTROL — la cuesta que la ciudad misma nombra
// ═════════════════════════════════════════════════════════════════════════════
//   ⛔ No lo elige quien mide: son calles cuyo NOMBRE MUNICIPAL dice que son
//     una cuesta. Si el instrumento las da por llanas, no mide lo que dice.
//   ⭐ Y con su negativo al lado, que es lo que lo convierte en control: un
//     nombre que SUENA a altura sin serlo tiene que salir plano.
// ═════════════════════════════════════════════════════════════════════════════
const nomDe = (e) => (tagsDe.get(e.way) || {}).name || '';
const pendDe = (e) => {
  const z0 = Z[e.a]; const z1 = Z[e.b];
  if (Number.isNaN(z0) || Number.isNaN(z1) || e.largo < 0.5) return null;
  return (z1 - z0) / e.largo * 100;
};
log('');
raya('─');
log('P1 · ⭐⭐ POSITIVO DE CONTROL — las calles que se llaman cuesta, y una que no lo es');
raya('─');
const CONTROL = [
  ['Cuesta del Reloj', 'positivo', true],
  ['Subida La Cadena', 'positivo', true],
  ['Camino Alto del Molino', '⭐ NEGATIVO', false],
];
log('   ' + 'calle'.padEnd(26) + 'clase'.padEnd(12) + 'aristas'.padStart(8) + 'metros'.padStart(9)
  + '|p| media'.padStart(11) + '|p| max'.padStart(9) + '   veredicto');
for (const [n, clase, esperaCuesta] of CONTROL) {
  const s = g.aristas.filter((e) => nomDe(e) === n && pendDe(e) !== null);
  A.exige(s.length > 0, `«${n}» no aparece en el grafo: el control positivo no puede correrse `
    + 'y un cero de pendiente sería indistinguible de un cero de búsqueda');
  const m = s.reduce((t, e) => t + e.largo, 0);
  const med = s.reduce((t, e) => t + Math.abs(pendDe(e)) * e.largo, 0) / m;
  const mx = Math.max(...s.map((e) => Math.abs(pendDe(e))));
  const ok = esperaCuesta ? med >= 5 : med < 2;
  log('   ' + n.padEnd(26) + clase.padEnd(12) + String(s.length).padStart(8) + f1(m).padStart(9)
    + (f2(med) + ' %').padStart(11) + (f1(mx) + ' %').padStart(9)
    + '   ' + (ok ? '✅' : '⛔') + ' ' + (esperaCuesta ? 'sale cuesta' : 'sale llano'));
  A.exige(ok, `«${n}» debía salir ${esperaCuesta ? 'en cuesta' : 'llano'} y sale al ${f2(med)} %: `
    + 'el instrumento no mide lo que dice medir');
}

// ── el segundo control, que no depende de ningún nombre: un río no sube ──────
log('');
log('   ⭐ Y EL CONTROL QUE NO DEPENDE DE NINGÚN NOMBRE: un río no puede subir.');
{
  const RIOS = path.join(__dirname, '..', '..', 'data', 'fuentes',
    '2026-08-03_overpass_zaragoza-rios_geom-y-tags.json');
  const j = JSON.parse(fs.readFileSync(RIOS, 'utf8'));
  // ⚠️ en OSM se llama «Río Ebro», no «Ebro». Filtrar por 'Ebro' devuelve CERO y
  //   no avisa: es el mismo fallo que «La Chimenea» de la tanda 10, otra vez.
  const ways = (j.elements || []).filter((e) => e.tags && e.tags.name === 'Río Ebro' && e.geometry);
  A.exige(ways.length > 0, 'cero ways del Ebro: el filtro por nombre no encuentra el río y su '
    + 'perfil no se puede comprobar');
  const franjas = new Map();
  for (const w of ways) {
    for (const p of w.geometry) {
      const m = aMetros(p.lon, p.lat);
      const z = M.altura(m[0], m[1]);
      if (z === null) continue;
      const k = Math.floor(m[0] / 2000) * 2000;
      if (!franjas.has(k)) franjas.set(k, []);
      franjas.get(k).push(z);
    }
  }
  const ks = [...franjas.keys()].filter((k) => franjas.get(k).length >= 5).sort((a, b) => a - b);
  let suben = 0; let prev = null;
  for (const k of ks) {
    const v = franjas.get(k).sort((a, b) => a - b);
    const med = v[Math.floor(v.length / 2)];
    if (prev !== null && med > prev + 0.01) suben++;
    prev = med;
  }
  const z0 = (() => { const v = franjas.get(ks[0]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; })();
  const z1 = prev;
  di('   franjas de 2 km con ≥ 5 puntos de cauce', ks.length);
  di('   caída de la mediana, de oeste a este', f1(z0 - z1) + ' m en '
    + f1((ks[ks.length - 1] - ks[0]) / 1000) + ' km   (' + f2(100 * (z0 - z1) / (ks[ks.length - 1] - ks[0])) + ' %)');
  di('   ⭐ franjas que SUBEN yendo aguas abajo', suben + ' de ' + (ks.length - 1)
    + (suben <= 1 ? '   ✅ el perfil baja' : '   ⛔'));
  A.exige(suben <= 1, `${suben} franjas del Ebro suben yendo hacia el este: el muestreo de altura `
    + 'no reproduce ni el perfil de un río');
}

// ═════════════════════════════════════════════════════════════════════════════
// P2 · ⭐⭐ CUÁNTA CUESTA HAY — la distribución, ⛔ no una media
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P2 · ⭐⭐ CUÁNTA CUESTA HAY EN LA RED DE BICI — pesado por METROS');
raya('─');
const filas = [];
for (const e of bici) {
  const p = pendDe(e);
  if (p === null) continue;
  filas.push({ e, p: Math.abs(p) });
}
di('aristas medidas', filas.length + ' de ' + bici.length
  + '   (' + (bici.length - filas.length) + ' de menos de 0,5 m: la pendiente no significa nada)');

// ⚠️ el suelo de ruido, ANTES de la distribución: sin él, no se sabe qué parte
//   de la cola es cuesta y qué parte es el MDT.
log('');
log('   ⚠️ EL SUELO DE RUIDO — |pendiente| según lo LARGA que sea la arista.');
log('     Una arista de 4 m mide un desnivel sobre menos de una celda de MDT.');
log('   ' + 'largo'.padEnd(13) + 'aristas'.padStart(8) + 'km'.padStart(9)
  + 'p50'.padStart(8) + 'p90'.padStart(8) + 'p99'.padStart(8) + 'max'.padStart(9));
for (const [a, b] of [[0, 5], [5, 10], [10, 25], [25, 50], [50, 100], [100, 250], [250, 1e9]]) {
  const s = filas.filter((f) => f.e.largo >= a && f.e.largo < b);
  if (!s.length) continue;
  const v = s.map((f) => f.p).sort((x, y) => x - y);
  const q = (p) => v[Math.floor(p * (v.length - 1))];
  log('   ' + (b > 1e8 ? '≥ ' + a + ' m' : a + '–' + b + ' m').padEnd(13) + String(s.length).padStart(8)
    + f1(s.reduce((t, f) => t + f.e.largo, 0) / 1000).padStart(9)
    + f2(q(0.5)).padStart(8) + f2(q(0.9)).padStart(8) + f2(q(0.99)).padStart(8)
    + f1(v[v.length - 1]).padStart(9));
}

function reparto(sel, etiqueta) {
  const tot = sel.reduce((s, f) => s + f.e.largo, 0);
  log('');
  log('   ' + etiqueta + '   —   ' + f1(tot / 1000) + ' km sobre ' + sel.length + ' aristas');
  log('   ' + '|pendiente|'.padEnd(13) + 'km'.padStart(10) + '% km'.padStart(9) + 'aristas'.padStart(9)
    + '   qué es');
  const QUE = ['llano', 'imperceptible en bici', 'se nota', '⚠️ se acusa', '⛔ cuesta de verdad',
    '⛔ dura', '⛔⛔ Valhalla ya la penaliza ×4,5 o más'];
  let i = 0; let acum = 0;
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 5], [5, 8], [8, 10], [10, 1e9]]) {
    const s = sel.filter((f) => f.p >= a && f.p < b);
    const m = s.reduce((t, f) => t + f.e.largo, 0);
    acum += m;
    log('   ' + (b > 1e8 ? '≥ ' + a + ' %' : a + '–' + b + ' %').padEnd(13) + f1(m / 1000).padStart(10)
      + pc(m, tot).padStart(9) + String(s.length).padStart(9) + '   ' + QUE[i++]);
  }
  A.exige(Math.abs(acum - tot) < 1, 'los tramos de pendiente no suman los km del universo');
  return tot;
}
const totTodas = reparto(filas, 'TODAS LAS ARISTAS DE BICI');
reparto(filas.filter((f) => f.e.largo >= 25), '⭐ SOLO LAS DE ≥ 25 m — cinco celdas de MDT, el ruido cae');
{
  const bajo2 = filas.filter((f) => f.p < 2).reduce((s, f) => s + f.e.largo, 0);
  const sobre5 = filas.filter((f) => f.p >= 5).reduce((s, f) => s + f.e.largo, 0);
  log('');
  di('⇒ km por debajo del 2 %', f1(bajo2 / 1000) + '   ' + pc(bajo2, totTodas));
  di('⇒ km por encima del 5 %', f1(sobre5 / 1000) + '   ' + pc(sobre5, totTodas));
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 · EL ACTUR ARRIBA Y EL EBRO ABAJO — con su cifra, que un adjetivo no tiene
//      denominador
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · EL ACTUR ARRIBA, EL EBRO ABAJO — ⭐ con su cifra');
raya('─');
const SITIOS = [
  ['Actur', /^(Avenida de Ranillas|Calle de Margarita Xirgu|Calle de Antón García Abril|Avenida de la Ilustración)$/],
  ['Ribera del Ebro', /^(Paseo de Echegaray y Caballero|Puente de Piedra)$/],
  ['Casco', /^(Calle de Alfonso I|Calle del Coso|Paseo de la Independencia)$/],
  ['Torrero', /^(Vía Ibérica|Calle de Cuéllar)$/],
];
const zSitio = {};
log('   ' + 'sitio'.padEnd(20) + 'puntos'.padStart(8) + 'z p10'.padStart(9) + 'z p50'.padStart(9)
  + 'z p90'.padStart(9));
for (const [et, re] of SITIOS) {
  const v = [];
  for (const e of g.aristas) {
    if (!re.test(nomDe(e))) continue;
    for (const p of e.pts) { const z = M.altura(p[0], p[1]); if (z !== null) v.push(z); }
  }
  A.exige(v.length > 0, `«${et}» no encuentra ninguna calle: el contraste de alturas no se puede hacer`);
  v.sort((a, b) => a - b);
  zSitio[et] = v[Math.floor(0.5 * v.length)];
  log('   ' + et.padEnd(20) + String(v.length).padStart(8) + f1(v[Math.floor(0.1 * v.length)]).padStart(9)
    + f1(zSitio[et]).padStart(9) + f1(v[Math.floor(0.9 * v.length)]).padStart(9));
}
di('⇒ ⭐ el Actur sobre la ribera del Ebro', f1(zSitio.Actur - zSitio['Ribera del Ebro']) + ' m');
A.exige(zSitio.Actur > zSitio['Ribera del Ebro'] + 10,
  'el Actur no sale por encima de la ribera del Ebro: el instrumento no encuentra la cuesta que hay');

// ═════════════════════════════════════════════════════════════════════════════
// P4 · ⚠️ DONDE EL MDT NO PUEDE ACERTAR — y cuántos son
// ═════════════════════════════════════════════════════════════════════════════
//   Un MDT es el modelo del TERRENO. Un puente y un túnel no son terreno: en el
//   puente devuelve la cota del suelo de debajo, y en el túnel la del cerro de
//   encima. ⛔ Declararlo no es medirlo, así que va con su cifra.
log('');
raya('─');
log('P4 · ⚠️ DONDE EL MDT NO PUEDE ACERTAR — puentes y túneles, con su cifra');
raya('─');
{
  const es = (e, k) => { const t = tagsDe.get(e.way) || {}; return t[k] && t[k] !== 'no'; };
  let nP = 0; let mP = 0; let nT = 0; let mT = 0;
  for (const f of filas) {
    if (es(f.e, 'bridge')) { nP++; mP += f.e.largo; }
    if (es(f.e, 'tunnel')) { nT++; mT += f.e.largo; }
  }
  log('   ' + 'puentes'.padEnd(20) + String(nP).padStart(7) + ' aristas   ' + f1(mP / 1000).padStart(7)
    + ' km   ' + pc(mP, totTodas) + ' de la red de bici');
  log('   ' + 'túneles'.padEnd(20) + String(nT).padStart(7) + ' aristas   ' + f1(mT / 1000).padStart(7)
    + ' km   ' + pc(mT, totTodas));
  log('   ' + '⇒ juntos'.padEnd(20) + String(nP + nT).padStart(7) + ' aristas   ' + f1((mP + mT) / 1000).padStart(7)
    + ' km   ' + pc(mP + mT, totTodas) + '  ⚠️ su pendiente es la del terreno, no la de la calzada');
}
// ── y las más empinadas, mirando qué son en vez de fiarse del percentil ──────
log('');
log('   LAS 10 ARISTAS MÁS EMPINADAS DE ≥ 25 m — se miran, no se promedian');
for (const f of filas.filter((x) => x.e.largo >= 25).sort((a, b) => b.p - a.p).slice(0, 10)) {
  const t = tagsDe.get(f.e.way) || {};
  log('   ' + (f1(f.p) + ' %').padStart(8) + f1(f.e.largo).padStart(8) + ' m  '
    + String(f.e.highway).padEnd(11) + (t.name || '(sin nombre)').slice(0, 30).padEnd(32)
    + (t.bridge ? 'bridge ' : '') + (t.tunnel ? 'tunnel ' : '') + (t.layer ? 'layer=' + t.layer : ''));
}

// ═════════════════════════════════════════════════════════════════════════════
// P5 · ⭐⭐⭐ EL EFECTO SOBRE LO PUBLICADO — ⛔ se mide, no se arregla
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P5 · ⭐⭐⭐ CUÁNTO SE MOVERÍA LO YA PUBLICADO — ⛔ nada se recalcula');
raya('─');

const idxPie = P.indexarAristas(g.aristas, (e) => e.pie);
const { ady: adyPie } = G.adyacencia(g.nodos, g.aristas, G.PASA_A_PIE, false);
const { ady: adyBici } = G.adyacencia(g.nodos, g.aristas, pasaBici, false);

/** Dijkstra multiorigen que además guarda POR DÓNDE se llegó (nodo y arista). */
function dij(ady, origenes) {
  const dist = new Float64Array(ady.length).fill(Infinity);
  const de = new Int32Array(ady.length).fill(-1);
  const pre = new Int32Array(ady.length).fill(-1);
  const pra = new Int32Array(ady.length).fill(-1);
  const q = new G.Cola();
  for (let k = 0; k < origenes.length; k++) {
    const [n, d0] = origenes[k];
    if (d0 < dist[n]) { dist[n] = d0; de[n] = k; q.push(d0, n); }
  }
  while (q.size) {
    const [d, v] = q.pop();
    if (d > dist[v]) continue;
    for (const { n: u, w, e } of ady[v]) {
      const nd = d + w;
      if (nd < dist[u]) { dist[u] = nd; de[u] = de[v]; pre[u] = v; pra[u] = e; q.push(nd, u); }
    }
  }
  return { dist, de, pre, pra };
}
/** el camino de aristas recorridas, EN EL SENTIDO EN QUE SE RECORREN. */
function camino(r, n) {
  const out = [];
  let v = n;
  while (r.pre[v] >= 0) { out.push({ de: r.pre[v], a: v, e: r.pra[v] }); v = r.pre[v]; }
  return out.reverse();
}
/**
 * Minutos de un camino, con y sin cuesta.
 * ⚠️ `esVel` distingue las dos convenciones de Valhalla, que se llaman igual.
 */
function tiempo(cam, vel, tabla, esVel) {
  let m = 0; let llano = 0; let cuesta = 0; let sube = 0; let baja = 0;
  for (const paso of cam) {
    const e = g.aristas[paso.e];
    m += e.largo;
    llano += min(e.largo, vel);
    const z0 = Z[paso.de]; const z1 = Z[paso.a];
    if (Number.isNaN(z0) || Number.isNaN(z1) || e.largo < 0.5) { cuesta += min(e.largo, vel); continue; }
    const dz = z1 - z0;
    if (dz > 0) sube += dz; else baja += -dz;
    const f = tabla[cubo(dz / e.largo * 100)];
    cuesta += esVel ? min(e.largo, vel * f) : min(e.largo, vel) * f;
  }
  return { m, llano, cuesta, sube, baja };
}

// ── las 276 estaciones, igual que en la tanda 5 ─────────────────────────────
const EXP = path.join(__dirname, '..', '..', 'data', 'exploracion');
let W = [];
for (const f of fs.readdirSync(EXP).filter((f) => /^2026-08-02_wfs_bizi_pag\d+\.json$/.test(f)).sort()) {
  W = W.concat(JSON.parse(fs.readFileSync(path.join(EXP, f), 'utf8')).features);
}
A.exige(W.length === 276, `salen ${W.length} estaciones y son 276`);
const nodosBici = new Set();
for (const e of g.aristas) if (pasaBici(e)) { nodosBici.add(e.a); nodosBici.add(e.b); }
const empujeHasta = dij(adyPie, [...nodosBici].map((n) => [n, 0])).dist;
const EST = [];
for (const w of W) {
  const m = aMetros(w.geometry.coordinates[0], w.geometry.coordinates[1]);
  const { mejor } = P.engancharUno(m, g.aristas, idxPie, () => '', 350);
  if (!mejor) continue;
  const ar = g.aristas[mejor.i];
  EST.push({ n: w.properties.numero, nom: w.properties.nombre, nodoPie: ar.a,
    empuje: Math.min(empujeHasta[ar.a], empujeHasta[ar.b]),
    nodoBici: empujeHasta[ar.a] <= empujeHasta[ar.b] ? ar.a : ar.b });
}

/** el trayecto en BiZi de la tanda 5, con los caminos reconstruidos. */
function trayecto(mO, mD) {
  const eO = P.engancharUno(mO, g.aristas, idxPie, () => '', 350).mejor;
  const eD = P.engancharUno(mD, g.aristas, idxPie, () => '', 350).mejor;
  if (!eO || !eD) return null;
  const nO = g.aristas[eO.i].a; const nD = g.aristas[eD.i].a;
  const rO = dij(adyPie, [[nO, eO.d]]);
  const rD = dij(adyPie, [[nD, eD.d]]);
  const entradas = [];
  for (const e of EST) {
    const andar = rO.dist[e.nodoPie];
    if (!Number.isFinite(andar) || !Number.isFinite(e.empuje)) continue;
    entradas.push([e.nodoBici, min(andar, V.andar) + min(e.empuje, V.empujar), e]);
  }
  if (!entradas.length) return null;
  const adyMin = adyBici.map((l) => l.map((x) => ({ n: x.n, w: min(x.w, V.rodar), e: x.e })));
  const rod = dij(adyMin, entradas.map(([n, t]) => [n, t]));
  let mejor = null;
  for (const e of EST) {
    const andar = rD.dist[e.nodoPie];
    if (!Number.isFinite(andar) || !Number.isFinite(e.empuje)) continue;
    const t = rod.dist[e.nodoBici] + min(e.empuje, V.empujar) + min(andar, V.andar);
    if (Number.isFinite(t) && (!mejor || t < mejor.t)) mejor = { t, salida: e };
  }
  if (!mejor) return null;
  const k = rod.de[mejor.salida.nodoBici];
  A.exige(k >= 0, 'el nodo de salida no tiene origen registrado: el camino no se puede reconstruir');
  // ⚠️ `engO`/`engD` son los metros del ENGANCHE —del punto a su arista—, que van
  //   dentro de los tramos 1 y 5 publicados y **no son ninguna arista del grafo**:
  //   sin ellos el camino reconstruido sale corto y el control diría que no es el
  //   mismo trayecto. Se cuentan como llanos, porque no hay arista de la que sacar
  //   su pendiente. ⛔ Y es un apaño con su cifra: se imprime abajo cuánto es.
  return { rO, rD, rod, mejor, ent: entradas[k][2], nO, nD, engO: eO.d, engD: eD.d };
}

// ── el caso publicado, y el control de que es EL MISMO ──────────────────────
const pO = Ra.POI['Estación Delicias']; const pD = Ra.POI['C.C. Utrillas'];
const T5 = trayecto(aMetros(pO.lon, pO.lat), aMetros(pD.lon, pD.lat));
A.exige(!!T5, 'no sale trayecto en BiZi entre los dos POI');
const cRod = camino(T5.rod, T5.mejor.salida.nodoBici);
const c1 = camino(T5.rO, T5.ent.nodoPie);
const c5 = camino(T5.rD, T5.mejor.salida.nodoPie);
const rod = tiempo(cRod, V.rodar, F_BICI, true);
/** suma el enganche —llano por falta de dato— al tramo andado que lo lleva dentro. */
const conEnganche = (r, eng) => ({ ...r, m: r.m + eng,
  llano: r.llano + min(eng, V.andar), cuesta: r.cuesta + min(eng, V.andar) });
const t1 = conEnganche(tiempo(c1, V.andar, F_PIE, false), T5.engO);
const t5 = conEnganche(tiempo(c5, V.andar, F_PIE, false), T5.engD);

log('');
log('   ⭐⭐ CONTROL: ¿es EL MISMO trayecto que se publicó? — si no, no se le puede');
log('     medir el error a nada.');
log('   ' + 'tramo'.padEnd(24) + 'reconstruido'.padStart(13) + 'publicado'.padStart(11));
const CTRL = [['3 · rodando', rod.m, PUB.rodando], ['1 · andar al origen', t1.m, PUB.tramo1],
  ['5 · andar al destino', t5.m, PUB.tramo5]];
for (const [et, mio, pub] of CTRL) {
  log('   ' + et.padEnd(24) + f1(mio).padStart(13) + f1(pub).padStart(11)
    + (Math.abs(mio - pub) < 0.1 ? '   ✅' : '   ⛔ NO es el mismo camino'));
  A.exige(Math.abs(mio - pub) < 0.1, `el tramo «${et}» sale ${f1(mio)} y está publicado ${f1(pub)}: `
    + 'estaría midiéndole el error a otro trayecto');
}
di('estación de entrada · de salida', '#' + T5.ent.n + ' ' + T5.ent.nom + '  →  #'
  + T5.mejor.salida.n + ' ' + T5.mejor.salida.nom + '   (publicadas #236 y #40)');

log('');
log('   EL EFECTO SOBRE ESE MISMO CAMINO');
log('   ' + 'tramo'.padEnd(24) + 'metros'.padStart(9) + 'sube'.padStart(8) + 'baja'.padStart(8)
  + 'llano'.padStart(9) + 'con cuesta'.padStart(12) + 'dif'.padStart(9));
for (const [et, r] of [['1 · andar', t1], ['3 · rodar', rod], ['5 · andar', t5]]) {
  log('   ' + et.padEnd(24) + f1(r.m).padStart(9) + f1(r.sube).padStart(8) + f1(r.baja).padStart(8)
    + f1(r.llano).padStart(9) + f1(r.cuesta).padStart(12)
    + ((r.cuesta - r.llano >= 0 ? '+' : '') + f1(r.cuesta - r.llano)).padStart(9));
}
const empuje = min(T5.ent.empuje, V.empujar) + min(T5.mejor.salida.empuje, V.empujar);
const bLl = t1.llano + rod.llano + t5.llano + empuje + 2 * CAMBIO_S / 60;
const bCu = t1.cuesta + rod.cuesta + t5.cuesta + empuje + 2 * CAMBIO_S / 60;
log('   ' + '⇒ TOTAL EN BiZi'.padEnd(24) + ''.padStart(25) + f1(bLl).padStart(9) + f1(bCu).padStart(12)
  + ((bCu - bLl >= 0 ? '+' : '') + f1(bCu - bLl)).padStart(9) + '   ' + pc(Math.abs(bCu - bLl), bLl));
A.exige(Math.abs(bLl - PUB.totalBizi) < 0.1, `el total llano sale ${f1(bLl)} y está publicado ${PUB.totalBizi}`);
di('⚠️ de los tramos 1 y 5, metros de ENGANCHE contados como llanos',
  f1(T5.engO + T5.engD) + ' m   ' + pc(T5.engO + T5.engD, t1.m + t5.m) + ' de lo andado');
{
  const rA = dij(adyPie, [[T5.nO, 0]]);
  const a = conEnganche(conEnganche(tiempo(camino(rA, T5.nD), V.andar, F_PIE, false), T5.engO), T5.engD);
  log('   ' + '⇒ ANDANDO ENTERO'.padEnd(24) + f1(a.m).padStart(9) + f1(a.sube).padStart(8)
    + f1(a.baja).padStart(8) + f1(a.llano).padStart(9) + f1(a.cuesta).padStart(12)
    + ((a.cuesta - a.llano >= 0 ? '+' : '') + f1(a.cuesta - a.llano)).padStart(9)
    + '   ' + pc(Math.abs(a.cuesta - a.llano), a.llano));
  log('');
  di('la BiZi ganaba por (llano)', f1(a.llano - bLl) + ' min');
  di('⭐ la BiZi ganaría por (con cuesta)', f1(a.cuesta - bCu) + ' min');
}

// ── el umbral ───────────────────────────────────────────────────────────────
log('');
log('   ⭐⭐⭐ EL UMBRAL — la misma escalera determinista de la tanda 5');
// ⛔ ni el origen ni los destinos se eligen a ojo: origen = el primer portal del
//   callejero, destinos = el portal cuya distancia en recta se acerca más a cada
//   peldaño. Es la misma escalera determinista de la tanda 5.
const portales = P.cargarPortales();
const mOrg = portales[0].m;
const PELDANOS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000];
log('   ' + 'recta'.padStart(8) + 'andar llano'.padStart(12) + 'andar cuesta'.padStart(13)
  + 'BiZi llano'.padStart(11) + 'BiZi cuesta'.padStart(12) + '   gana llano   gana cuesta');
let umbLl = null; let umbCu = null;
for (const objetivo of PELDANOS) {
  let mejor = null; let md = Infinity;
  for (const p of portales) {
    const d = Math.hypot(p.m[0] - mOrg[0], p.m[1] - mOrg[1]);
    if (Math.abs(d - objetivo) < md) { md = Math.abs(d - objetivo); mejor = { m: p.m, d }; }
  }
  A.exige(!!mejor, `no hay ningún portal para el peldaño de ${objetivo} m: la escalera del umbral `
    + 'estaría midiéndose sobre menos peldaños de los que dice');
  const t = trayecto(mOrg, mejor.m);
  if (!t) { log('   ' + f1(mejor.d).padStart(8) + '   sin trayecto'); continue; }
  const a1 = conEnganche(tiempo(camino(t.rO, t.ent.nodoPie), V.andar, F_PIE, false), t.engO);
  const a5 = conEnganche(tiempo(camino(t.rD, t.mejor.salida.nodoPie), V.andar, F_PIE, false), t.engD);
  const ar = tiempo(camino(t.rod, t.mejor.salida.nodoBici), V.rodar, F_BICI, true);
  const emp = min(t.ent.empuje, V.empujar) + min(t.mejor.salida.empuje, V.empujar);
  const bl = a1.llano + ar.llano + a5.llano + emp + 2 * CAMBIO_S / 60;
  const bc = a1.cuesta + ar.cuesta + a5.cuesta + emp + 2 * CAMBIO_S / 60;
  const an = conEnganche(conEnganche(tiempo(camino(dij(adyPie, [[t.nO, 0]]), t.nD),
    V.andar, F_PIE, false), t.engO), t.engD);
  const gLl = bl < an.llano; const gCu = bc < an.cuesta;
  if (gLl && umbLl === null) umbLl = mejor.d;
  if (gCu && umbCu === null) umbCu = mejor.d;
  log('   ' + f1(mejor.d).padStart(8) + f1(an.llano).padStart(12) + f1(an.cuesta).padStart(13)
    + f1(bl).padStart(11) + f1(bc).padStart(12)
    + (gLl ? '   ⭐ SÍ    ' : '   ⛔ no    ') + (gCu ? '   ⭐ SÍ' : '   ⛔ no'));
}
log('');
di('umbral publicado (llano)', umbLl === null ? 'no gana en ningún peldaño' : f1(umbLl) + ' m   ⇒ ~1.500 m');
di('⭐ umbral con la pendiente dentro', umbCu === null ? 'no gana en ningún peldaño' : f1(umbCu) + ' m');
di('⇒ el umbral se mueve', umbLl === null || umbCu === null ? 'NO CONSTA' : f1(umbCu - umbLl) + ' m');

log('');
raya();
log(A.cierre('LA CUESTA'));
