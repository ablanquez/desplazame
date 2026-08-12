// ⭐⭐⭐ H2b · TANDA 3 — EL ENGANCHE PROPIO DE LA BICI. **SOLO MIDE.**
//
// ═════════════════════════════════════════════════════════════════════════════
// DE DÓNDE VIENE ESTA TANDA
// ═════════════════════════════════════════════════════════════════════════════
//   H2b·2 lo destapó sin buscarlo: **un edificio da a la acera, y por una acera
//   no se rueda.** Con el enganche de andar, una ruta en bici desde un portal
//   sale `SIN CAMINO` — con el grafo sano (96,9 % de los nodos en la mayor
//   componente de `circula`).
//
// ⛔ LO QUE ESTE FICHERO **NO** HACE:
//   · no toca `src/grafo.js` ni `src/ruta.js` — la rendija de la tanda 9 se cerró
//   · no mete las estaciones BiZi (tanda siguiente), aunque compartan el problema
//   · no hace el grafo dirigido: `oneway` sigue medido y sin aplicar
//   · no calcula ni un minuto
//
//   node tools/grafo/enganche-bici.js

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const P = require('../../src/portales');
const osm = require('../../src/osm');
const { aMetros } = require('../../src/geo');
const Ra = require('../../src/rutas-antonio');
const D = require('../../src/direccion');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);
const f1 = (x) => (Number.isFinite(x) ? (Math.round(x * 10) / 10).toFixed(1) : '∞');
const pc = (a, b) => (100 * a / b).toFixed(1) + ' %';

/** Lo publicado que este instrumento tiene que reencontrar antes de hablar. */
const PUBLICADO = {
  portales: 46150, muestra: 2308, p99Peatonal: 65.4, paso: 20,
  maxEnganche: 350,          // src/ruta.js:153
  circula: 49972,            // docs/H2B-CIRCULACION-BICI.md §0
};
/** ⚠️ Tolerancia del control. La hermana (`enganche-paradas.js`) usa 10 m contra
 *  el 65 redondo de H1; aquí se contrasta contra el 65,4 MEDIDO por ella, así que
 *  se aprieta a 1 m: es la MISMA medición, no una parecida. */
const TOL_CONTROL_M = 1.0;

function percentiles(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const p = (q) => a[Math.min(a.length - 1, Math.floor(a.length * q))];
  return { n: a.length, min: a[0], p50: p(0.50), p75: p(0.75), p90: p(0.90),
    p95: p(0.95), p99: p(0.99), max: a[a.length - 1] };
}
const CAB = '   ' + 'población'.padEnd(30) + 'n'.padStart(7) + 'mín'.padStart(9)
  + 'p50'.padStart(9) + 'p75'.padStart(9) + 'p90'.padStart(9) + 'p95'.padStart(9)
  + 'p99'.padStart(9) + 'máx'.padStart(10);
const fila = (etq, s) => log('   ' + etq.padEnd(30) + String(s.n).padStart(7)
  + f1(s.min).padStart(9) + f1(s.p50).padStart(9) + f1(s.p75).padStart(9)
  + f1(s.p90).padStart(9) + f1(s.p95).padStart(9) + f1(s.p99).padStart(9) + f1(s.max).padStart(10));

raya();
log('EL ENGANCHE DE LA BICI — distribución, no media. ⛔ Solo se mide.');
raya();

// ═════════════════════════════════════════════════════════════════════════════
// P0 · EL UNIVERSO (ley 148) Y EL PREDICADO
// ═════════════════════════════════════════════════════════════════════════════
const g = R.construir(R.ZONA_TERMINO);
const crudo = osm.cargar(R.CRUDO);
const tagsDe = new Map(crudo.ways.map((w) => [w.id, w.tags || {}]));

// ⛔ EL PREDICADO NO SE COPIA A OJO: son las mismas listas de
//   `tools/grafo/circulacion-bici.js`, y se comprueba que dan su misma cifra.
const CIRCULA = new Set(['cycleway', 'residential', 'service', 'tertiary', 'secondary', 'primary',
  'unclassified', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link', 'track', 'path']);
const prohibidoPorElDato = (t) => t.bicycle === 'no' || t.access === 'no';
const pasaBici = (e) => CIRCULA.has(e.highway) && !prohibidoPorElDato(tagsDe.get(e.way) || {});

log('');
raya('─');
log('P0 · EL UNIVERSO — el grafo del motor, y el predicado ya publicado');
raya('─');
di('grafo', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');
di('aristas · a pie', g.aristas.length + ' · ' + g.aristas.filter((e) => e.pie).length);
const nCircula = g.aristas.filter(pasaBici).length;
di('aristas que «circulan»', nCircula + '   (publicado ' + PUBLICADO.circula + ')');
A.exige(nCircula === PUBLICADO.circula,
  `el predicado da ${nCircula} aristas y H2b·2 publicó ${PUBLICADO.circula}: no es el mismo predicado `
  + 'y nada de lo que sigue es comparable con lo publicado');
const portales = P.cargarPortales();
di('portales del callejero', portales.length + '   (publicado ' + PUBLICADO.portales + ')');
A.exige(portales.length === PUBLICADO.portales, `salen ${portales.length} portales y son ${PUBLICADO.portales}`);

// ── los dos índices, con la MISMA función del proyecto y distinto predicado ───
// ⭐ `src/ruta.js:157` construye el peatonal así: `P.indexarAristas(g.aristas, (e) => e.pie)`.
//   Aquí se hace igual y se cambia solo el predicado. **Ésa es toda la diferencia.**
const idxPie = P.indexarAristas(g.aristas, (e) => e.pie);
const idxBici = P.indexarAristas(g.aristas, pasaBici);

/** Distancia del punto a la arista más cercana del índice, o `null` si no hay. */
function engancheDe(p, idx) {
  const { mejor } = P.engancharUno(p.m, g.aristas, idx, () => '', PUBLICADO.maxEnganche);
  return mejor ? { d: mejor.d, i: mejor.i } : null;
}

// ═════════════════════════════════════════════════════════════════════════════
// P1 · ⭐⭐ EL POSITIVO DE CONTROL — sin esto, nada de lo demás vale (ley 4)
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P1 · ⭐⭐ EL POSITIVO DE CONTROL — la misma muestra que H2·5, con ESTE instrumento');
raya('─');
log('   H2·5 midió el enganche PEATONAL de 1 de cada ' + PUBLICADO.paso + ' portales y publicó');
log('   **p99 = ' + PUBLICADO.p99Peatonal + ' m**. ⛔ Si este instrumento no lo reproduce, mide otra cosa.');
const muestra = portales.filter((_, i) => i % PUBLICADO.paso === 0);
di('muestra determinista (1 de cada ' + PUBLICADO.paso + ')', muestra.length + '   (H2·5: ' + PUBLICADO.muestra + ')');
A.exige(muestra.length === PUBLICADO.muestra, `la muestra sale ${muestra.length} y H2·5 usó ${PUBLICADO.muestra}`);
const dCtl = [];
let ctlFuera = 0;
for (const p of muestra) { const e = engancheDe(p, idxPie); if (e) dCtl.push(e.d); else ctlFuera++; }
const ctl = percentiles(dCtl);
log('');
log(CAB);
raya('-');
fila('PORTALES → red PEATONAL', ctl);
const desvio = Math.abs(ctl.p99 - PUBLICADO.p99Peatonal);
log('');
di('p99 medido · publicado por H2·5 · desvío', f1(ctl.p99) + ' m · ' + PUBLICADO.p99Peatonal + ' m · ' + f1(desvio) + ' m');
A.exige(desvio <= TOL_CONTROL_M,
  `el p99 del control sale ${f1(ctl.p99)} m y H2·5 publicó ${PUBLICADO.p99Peatonal} m `
  + `(desvío ${f1(desvio)} m, tolerancia ${TOL_CONTROL_M} m). El instrumento NO reproduce la medida `
  + 'conocida: todo lo que siga es ruido.');
// ⭐ LEY 152 · el cero con su uno: que el control SEPA fallar.
{
  const falso = percentiles(dCtl.map((x) => x * 1.5));
  di('⭐ provocado: la misma muestra inflada un 50 %', Math.abs(falso.p99 - PUBLICADO.p99Peatonal) > TOL_CONTROL_M
    ? '✅ el control lo cazaría (p99 ' + f1(falso.p99) + ')' : '⛔ NO lo cazaría');
  A.exige(Math.abs(falso.p99 - PUBLICADO.p99Peatonal) > TOL_CONTROL_M,
    'el control no distingue una medida inflada un 50 %: su verde no vale nada');
}

// ═════════════════════════════════════════════════════════════════════════════
// P2 · ⭐⭐⭐ LOS 46.150 PORTALES CONTRA LAS DOS REDES
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P2 · ⭐⭐⭐ LOS ' + portales.length + ' PORTALES — a la red peatonal y a la red de bici');
raya('─');
const dPie = [], dBici = [];
let sinPie = 0, sinBici = 0;
const lejos = [];
for (const p of portales) {
  const a = engancheDe(p, idxPie);
  const b = engancheDe(p, idxBici);
  if (a) dPie.push(a.d); else sinPie++;
  if (b) dBici.push(b.d); else sinBici++;
  if (b && a && b.d > 100) lejos.push({ p, dPie: a.d, dBici: b.d });
}
log(CAB);
raya('-');
fila('PORTALES → red PEATONAL', percentiles(dPie));
fila('⭐ PORTALES → red de BICI', percentiles(dBici));
const sPie = percentiles(dPie), sBici = percentiles(dBici);
log('');
di('⛔ portales SIN arista peatonal a ' + PUBLICADO.maxEnganche + ' m', sinPie + '   (' + pc(sinPie, portales.length) + ')');
di('⛔ portales SIN arista de BICI a ' + PUBLICADO.maxEnganche + ' m', sinBici + '   (' + pc(sinBici, portales.length) + ')');
log('');
log('   ⭐ el factor, percentil a percentil — ⛔ no una media:');
log('   ' + 'percentil'.padEnd(14) + 'peatonal'.padStart(11) + 'bici'.padStart(11) + 'factor'.padStart(10));
for (const k of ['p50', 'p75', 'p90', 'p95', 'p99', 'max']) {
  log('   ' + k.padEnd(14) + (f1(sPie[k]) + ' m').padStart(11) + (f1(sBici[k]) + ' m').padStart(11)
    + ((sBici[k] / sPie[k]).toFixed(2) + '×').padStart(10));
}

// ── cuántos quedan lejos, con el listón puesto delante ───────────────────────
log('');
log('   ⭐⭐ CUÁNTOS QUEDAN LEJOS — la curva entera, ⛔ sin elegir listón todavía');
log('   ' + 'a más de'.padEnd(12) + 'peatonal'.padStart(12) + '%'.padStart(9) + 'bici'.padStart(12) + '%'.padStart(9));
for (const X of [25, 50, 65, 100, 150, 200, 350]) {
  const a = dPie.filter((d) => d > X).length, b = dBici.filter((d) => d > X).length;
  log('   ' + (X + ' m').padEnd(12) + String(a).padStart(12) + pc(a, portales.length).padStart(9)
    + String(b).padStart(12) + pc(b, portales.length).padStart(9));
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 · ⭐⭐⭐ LO QUE DE VERDAD CUESTA: EL TRAMO EMPUJANDO, ANDADO
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · ⭐⭐⭐ EL TRAMO EMPUJANDO — y NO es la distancia en línea recta');
raya('─');
log('   ⛔ La distancia del P2 es perpendicular a la arista: **la que se anda es otra**,');
log('     porque se anda POR EL GRAFO. Aquí se mide la de verdad, y para las 46.150,');
log('     no para una muestra: un Dijkstra MULTIORIGEN desde todos los nodos que tocan');
log('     una arista de bici, sobre la red peatonal. Una sola pasada.');
const { ady: adyPie } = G.adyacencia(g.nodos, g.aristas, G.PASA_A_PIE, false);
/** Dijkstra con varios orígenes a la vez. ⚠️ Es el mismo algoritmo de
 *  `G.dijkstra` con la cola del proyecto (`G.Cola`); lo único que cambia es que
 *  arranca con N nodos a distancia 0. Se VALIDA abajo contra `G.dijkstra`. */
function dijkstraMulti(ady, origenes) {
  const dist = new Float64Array(ady.length).fill(Infinity);
  const q = new G.Cola();
  for (const o of origenes) { dist[o] = 0; q.push(0, o); }
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
// ⭐⭐ EL CONTROL DE MI PROPIA REIMPLEMENTACIÓN (ley 56 al revés: si hay que
//   reescribir, hay que demostrar que coincide). Con UN solo origen tiene que dar
//   exactamente lo que da la función del proyecto, nodo a nodo.
{
  const o = g.aristas.find((e) => e.pie).a;
  const mio = dijkstraMulti(adyPie, [o]);
  const suyo = G.dijkstra(adyPie, o).dist;
  let dif = 0;
  for (let i = 0; i < mio.length; i++) if (mio[i] !== suyo[i]) dif++;
  di('⭐ control: multiorigen con UN origen vs `G.dijkstra`', dif === 0 ? '✅ idéntico nodo a nodo' : '⛔ ' + dif + ' nodos distintos');
  A.exige(dif === 0, `mi Dijkstra multiorigen difiere de G.dijkstra en ${dif} nodos: no es el mismo algoritmo`);
}
const nodosBici = new Set();
for (const e of g.aristas) if (pasaBici(e)) { nodosBici.add(e.a); nodosBici.add(e.b); }
di('nodos que tocan una arista de bici', nodosBici.size + ' de ' + g.nodos.length);
const distAlaBici = dijkstraMulti(adyPie, [...nodosBici]);

// para cada portal: enganche peatonal + lo andado desde ese nodo hasta la bici
const empuje = [];
let sinLlegar = 0;
for (const p of portales) {
  const a = engancheDe(p, idxPie);
  if (!a) { sinLlegar++; continue; }
  const e = g.aristas[a.i];
  const d = Math.min(distAlaBici[e.a], distAlaBici[e.b]);
  if (!Number.isFinite(d)) { sinLlegar++; continue; }
  empuje.push(a.d + d);
}
log('');
log(CAB);
raya('-');
fila('⭐ EMPUJANDO, andado de verdad', percentiles(empuje));
fila('   (comparar) en línea recta', percentiles(dBici));
log('');
di('⛔ portales que NO alcanzan la red de bici andando', sinLlegar + '   (' + pc(sinLlegar, portales.length) + ')');
// ⭐⭐ POR QUÉ EL ANDADO SALE MENOR QUE LA RECTA — ⛔ y no se afirma, se cuenta.
//   Las dos columnas NO miden lo mismo: la recta va del portal a la arista de bici
//   más cercana; la andada va del portal a su arista PEATONAL y de ahí, por el
//   grafo, al nodo de bici más próximo. ⇒ si la arista a la que engancha el portal
//   **ya es de bici**, lo andado es cero y el total es el enganche peatonal.
{
  let yaEsBici = 0, sinDato = 0;
  for (const p of portales) {
    const a = engancheDe(p, idxPie);
    if (!a) { sinDato++; continue; }
    if (pasaBici(g.aristas[a.i])) yaEsBici++;
  }
  log('');
  di('⭐ portales cuya arista PEATONAL ya es de bici', yaEsBici + '   (' + pc(yaEsBici, portales.length) + ')');
  log('      ⇒ para ésos el tramo empujando es **cero**, y por eso la mediana andada');
  log('        baja por debajo de la recta. **No es una paradoja: son dos preguntas.**');
  A.exige(yaEsBici > portales.length / 2,
    `solo ${yaEsBici} portales enganchan a una arista que ya es de bici: entonces la mediana andada `
    + 'no se explica por esto y hay que buscar otra causa antes de publicarla');
}
{
  const s = percentiles(empuje);
  log('');
  log('   ⭐⭐ Y ésta es la cifra que decide el criterio: **la mitad de los portales está a');
  log('     ' + f1(s.p50) + ' m o menos de la red de bici**, andando. El p90 son ' + f1(s.p90) + ' m.');
  A.exige(s.p50 < 200, `la mediana del tramo empujando sale ${f1(s.p50)} m: si hay que empujar eso `
    + 'de mediana, el modo bici no arranca desde un portal y es una decisión de producto, no un listón');
}

// ═════════════════════════════════════════════════════════════════════════════
// P4 · ⭐⭐ LA RUTA, Y POR DÓNDE VA — la trampa de la tanda 2 vuelve aquí
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · ⭐⭐ LAS DOS RUTAS YA MEDIDAS — ⛔ que salgan no demuestra nada');
raya('─');
{
  const ctx = D.abrir(g, R.CRUDO);
  const { ady: adyBici } = G.adyacencia(g.nodos, g.aristas, pasaBici, false);
  const gBici = { ...g, ady: adyBici };
  const puntoEn = (nombre, idx) => {
    const p = Ra.POI[nombre];
    const m = aMetros(p.lon, p.lat);
    const { mejor } = P.engancharUno(m, g.aristas, idx, () => '', PUBLICADO.maxEnganche);
    return mejor ? { arista: mejor.i, seg: mejor.k, t: mejor.t, q: mejor.q, d: mejor.d } : null;
  };
  const NOMS = ['Estación Delicias', 'C.C. Utrillas'];
  log('   ' + 'POI'.padEnd(22) + 'enganche A PIE'.padEnd(30) + 'enganche a la BICI');
  for (const n of NOMS) {
    const a = puntoEn(n, idxPie), b = puntoEn(n, idxBici);
    log('   ' + n.padEnd(22)
      + (g.aristas[a.arista].highway + ' a ' + f1(a.d) + ' m').padEnd(30)
      + (b ? g.aristas[b.arista].highway + ' a ' + f1(b.d) + ' m' : '⛔ ninguna'));
  }
  const oB = puntoEn(NOMS[0], idxBici), dB = puntoEn(NOMS[1], idxBici);
  const oP = puntoEn(NOMS[0], idxPie), dP = puntoEn(NOMS[1], idxPie);
  const rPie = G.rutaEntre(g, oP, dP);
  const rBici = G.rutaEntre(gBici, oB, dB);
  log('');
  di('a pie   · enganche a pie', rPie.encontrada ? rPie.metros + ' m · ' + rPie.aristas.length + ' aristas' : '⛔ sin camino');
  di('en bici · enganche de bici', rBici.encontrada ? rBici.metros + ' m · ' + rBici.aristas.length + ' aristas' : '⛔ sin camino');
  A.exige(rBici.encontrada, 'no hay ruta en bici entre los dos POI con enganche propio');
  if (rBici.encontrada) {
    const rep = new Map();
    for (const ia of rBici.aristas) {
      const e = g.aristas[ia];
      rep.set(e.highway, (rep.get(e.highway) || 0) + e.largo);
    }
    const tot = [...rep.values()].reduce((s, x) => s + x, 0);
    log('');
    log('   ⭐⭐⭐ EL REPARTO — esto es lo que hay que mirar, no los metros');
    log('   ' + 'highway'.padEnd(18) + 'metros'.padStart(10) + '%'.padStart(8));
    for (const [h, m] of [...rep].sort((a, b) => b[1] - a[1])) {
      log('   ' + h.padEnd(18) + m.toFixed(0).padStart(10) + pc(m, tot).padStart(8));
    }
    const cw = rep.get('cycleway') || 0;
    log('');
    di('⭐ de la ruta, por CARRIL BICI', f1(cw / 1000) + ' km   (' + pc(cw, tot) + ')');
    // ⛔ Y CUÁNTO SE HACE EMPUJANDO: los dos huecos del enganche, que la ruta NO lleva dentro.
    const eO = g.aristas[oP.arista], eD = g.aristas[dP.arista];
    const empO = oP.d + Math.min(distAlaBici[eO.a], distAlaBici[eO.b]);
    const empD = dP.d + Math.min(distAlaBici[eD.a], distAlaBici[eD.b]);
    log('');
    log('   ⛔⛔ Y LO QUE LA RUTA NO CUENTA: el tramo EMPUJANDO de cada punta,');
    log('     porque el trayecto no empieza sobre la calzada — empieza en una puerta.');
    di('   empujando en el origen', f1(empO) + ' m');
    di('   empujando en el destino', f1(empD) + ' m');
    di('   ⇒ el trayecto real', f1(empO) + ' + ' + rBici.metros + ' + ' + f1(empD) + ' = '
      + f1(empO + rBici.metros + empD) + ' m');
    log('      ⚠️ y los dos extremos van a **otra velocidad**: empujando no se va a 18 km/h.');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// P5 · ⚠️ LO QUE FALTA PARA QUE ESTO TENGA DURACIÓN
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P5 · ⚠️ LOS LÍMITES, DECLARADOS');
raya('─');
log('   ⛔ SIN DURACIÓN. La constante adoptada son 18 km/h **en calzada**, y este');
log('     trayecto tiene tres partes con tres regímenes: empujar · rodar · empujar.');
log('     ⇒ Falta **una velocidad para `empuja`**. openrouteservice le da a la acera');
log('       una cifra muy inferior a la de calzada; adoptarla es una decisión y no');
log('       se toma aquí.');
{
  const one = g.aristas.filter((e) => pasaBici(e) && (tagsDe.get(e.way) || {}).oneway === 'yes').length;
  log('');
  log('   ⛔ Y LA RED DE BICI ES NO DIRIGIDA: `oneway=yes` en ' + one + ' de las ' + nCircula
    + ' que circulan');
  log('     (' + pc(one, nCircula) + ') ⇒ **una ruta puede meterse a contramano** y el motor no se entera.');
  log('     Medido en H2b·2, sin resolver, y sigue igual.');
}

log('');
raya();
log(A.cierre('EL ENGANCHE DE LA BICI'));
