// C1 · ⭐⭐⭐ LOS RÍOS. Si una orilla queda incomunicada, se para todo.
//
//   node src/verificar-rios.js [semilla]

'use strict';
const { construir, ZONA_TERMINO } = require('./ruta');
const { aGrados, dist } = require('./geo');
const osm = require('./osm');
const G = require('./grafo');
const R = require('./rios');
// ⚠️ se llama AL y no A porque este fichero ya usa `A` para un punto de geometría.
const AL = require('./alarma');

const SEMILLA = Number(process.argv[2]) || 20260803;   // declarada: sin semilla no hay prueba
const PARES = 12;                 // pares por río
const MAX_DIST_RIO = 1500;        // m — la prueba tiene que ser RIBEREÑA, no provincial

const L = [];
const di = (k, v) => L.push(`   ${String(k).padEnd(44)} ${v}`);

L.push('='.repeat(92));
L.push('C1 · ⭐⭐⭐ ¿PARTEN LOS RÍOS EL GRAFO?');
L.push('');

const t0 = Date.now();
const g = construir(ZONA_TERMINO);
const { sello: selloRios, porRio } = R.cargar();
di('sello del crudo de calles', g.sello);
di('sello del crudo de ríos', selloRios);
di('nodos · aristas', `${g.contadores.nodos} · ${g.aristas.length}`);
di('componentes · mayor', `${g.comp.n} · ${Math.max(...g.comp.tamanos)}`);
di('semilla del sorteo', SEMILLA);

// ── nodos urbanos: el universo del sorteo ────────────────────────────────────
const urbanos = R.nodosUrbanos(g.nodos, g.ady);
di('nodos urbanos (>=25 vecinos en 150 m)', `${urbanos.length} de ${g.contadores.nodos}`);

// ⭐ POSITIVO DE CONTROL del clasificador de márgenes: dos puntos que TIENEN que
//    dar orillas distintas, y dos que TIENEN que dar la misma. Sin esto, un "0
//    pares encontrados" sería indistinguible de un detector roto.
L.push('');
L.push('⭐ POSITIVO DE CONTROL DEL DETECTOR DE MÁRGENES  (antes de cualquier cero)');
const { aMetros } = require('./geo');
const PILAR = aMetros(-0.87803, 41.65639);        // Plaza del Pilar — margen derecha
const ARRABAL = aMetros(-0.87795, 41.66175);      // El Arrabal — margen izquierda
const SAN_MIGUEL = aMetros(-0.87180, 41.65170);   // San Miguel — margen derecha, misma orilla
const cA = R.cortesConRio(PILAR, ARRABAL, porRio.Ebro);
const cB = R.cortesConRio(PILAR, SAN_MIGUEL, porRio.Ebro);
di('Pilar → Arrabal (orillas OPUESTAS)', `${cA} cortes  ${cA % 2 === 1 ? '✅ impar' : '⛔ el detector no ve el Ebro'}`);
di('Pilar → San Miguel (MISMA orilla)', `${cB} cortes  ${cB % 2 === 0 ? '✅ par' : '⛔ falso positivo'}`);
if (cA % 2 !== 1 || cB % 2 !== 0) {
  L.push('   ⛔⛔ EL DETECTOR ESTÁ ROTO. Todo lo que siga no vale.');
  console.log(L.join('\n'));
  process.exit(1);
}

// ── el sorteo, río a río ─────────────────────────────────────────────────────
const resumen = {};
for (const [rio, segs] of Object.entries(porRio)) {
  L.push('');
  L.push('─'.repeat(92));
  L.push(`RÍO ${rio.toUpperCase()}  ·  ${segs.length} segmentos de geometría`);

  // candidatos: urbanos y a menos de MAX_DIST_RIO del río
  const cerca = urbanos.filter((i) => R.distAlRio([g.nodos[i].x, g.nodos[i].y], segs) <= MAX_DIST_RIO);
  di('nodos urbanos ribereños (<=1.500 m)', cerca.length);
  if (cerca.length < 40) {
    di('⚠️ muy pocos candidatos', 'NO CONSTA: no hay tejido urbano a ambos lados aquí');
    resumen[rio] = { pares: 0, ok: 0, nota: 'sin tejido urbano suficiente' };
    continue;
  }

  const rnd = R.azar(SEMILLA + rio.length);
  const pares = [];
  let intentos = 0;
  while (pares.length < PARES && intentos < 200000) {
    intentos++;
    const a = cerca[Math.floor(rnd() * cerca.length)];
    const b = cerca[Math.floor(rnd() * cerca.length)];
    if (a === b) continue;
    const pa = [g.nodos[a].x, g.nodos[a].y], pb = [g.nodos[b].x, g.nodos[b].y];
    const recta = dist(pa, pb);
    if (recta < 200 || recta > 4000) continue;
    if (R.cortesConRio(pa, pb, segs) % 2 !== 1) continue;   // tienen que ser orillas OPUESTAS
    pares.push({ a, b, recta });
  }
  di('pares sorteados (orillas opuestas)', `${pares.length}  en ${intentos} intentos`);

  let ok = 0;
  const fallos = [];
  for (const p of pares) {
    const conectados = g.comp.comp[p.a] === g.comp.comp[p.b];
    let metros = null, rodeo = null;
    if (conectados) {
      const r = G.dijkstra(g.ady, p.a);
      metros = r.dist[p.b];
      rodeo = Number.isFinite(metros) ? metros / p.recta : null;
    }
    const bien = conectados && Number.isFinite(metros);
    if (bien) ok++; else fallos.push(p);
    const ga = aGrados(g.nodos[p.a].x, g.nodos[p.a].y), gb = aGrados(g.nodos[p.b].x, g.nodos[p.b].y);
    L.push('     ' + (bien ? '✅' : '⛔') + ' ' + String(Math.round(p.recta)).padStart(4) + ' m recta  →  '
      + (bien ? String(Math.round(metros)).padStart(5) + ' m  rodeo ' + rodeo.toFixed(2) : 'SIN CAMINO')
      + '   ' + ga[1].toFixed(5) + ',' + ga[0].toFixed(5) + '  →  ' + gb[1].toFixed(5) + ',' + gb[0].toFixed(5));
  }
  di('⇒ pares con camino', `${ok} de ${pares.length}  ${ok === pares.length ? '✅' : '⛔⛔ ORILLA INCOMUNICADA'}`);
  AL.exige(ok === pares.length, `orilla incomunicada en el ${rio}: solo ${ok} de ${pares.length} pares tienen camino`);
  resumen[rio] = { pares: pares.length, ok, fallos: fallos.length };
}

// ── C1b · cada puente con nombre, uno a uno ──────────────────────────────────
L.push('');
L.push('='.repeat(92));
L.push('C1b · ⭐ CADA PUENTE CON NOMBRE: ¿DEJA EL GRAFO CRUZARLO?');
L.push('   se toman los DOS EXTREMOS del way del puente y se exige camino corto entre ellos.');
L.push('   ⚠️ si el puente no estuviera cosido, el camino sería kilométrico o no existiría.');

const { ways } = osm.cargar(require('./ruta').CRUDO);
const rec = osm.proyectar(osm.recortar(ways, ZONA_TERMINO));
const puentes = [];
for (const w of rec) {
  const t = w.tags || {};
  if (!t.bridge || t.bridge === 'no') continue;
  const nom = t.name || t['bridge:name'];
  if (!nom) continue;
  // ¿sobre qué río pasa? el que corte su geometría
  for (const [rio, segs] of Object.entries(porRio)) {
    let corta = false;
    for (let k = 0; k + 1 < w.pts.length && !corta; k++) {
      if (R.cortesConRio(w.pts[k], w.pts[k + 1], segs) > 0) corta = true;
    }
    if (corta) { puentes.push({ nom, rio, w }); break; }
  }
}
// agrupar por (nombre, río) para MIRARLOS — el way más largo representa
const porNombre = new Map();
for (const p of puentes) {
  const k = p.nom + ' | ' + p.rio;
  const largo = p.w.pts.reduce((a, _, i) => i ? a + dist(p.w.pts[i - 1], p.w.pts[i]) : 0, 0);
  if (!porNombre.has(k) || porNombre.get(k).largo < largo) porNombre.set(k, { ...p, largo });
}
di('ways puente-con-nombre que cortan un río', puentes.length);
di('puentes distintos (nombre × río)', porNombre.size);

// ⚠️ El rodeo se mide contra la recta ENTRE LOS NODOS ENGANCHADOS, no entre los
//    extremos del way. Medido contra los extremos salía un rodeo de 0,89 —una ruta
//    más corta que la recta, que es imposible— y no era el grafo: era que el nodo
//    enganchado no coincide con el extremo del puente. Ley 36: cuando un número
//    sale imposible, el sospechoso es el instrumento.
const { transitableAPie } = require('./planarizar');
let pOk = 0;
const malos = [];
for (const [k, p] of [...porNombre.entries()].sort()) {
  const A = p.w.pts[0], B = p.w.pts[p.w.pts.length - 1];
  const na = G.nodoMasCercano(g.nodos, g.ady, A), nb = G.nodoMasCercano(g.nodos, g.ady, B);
  const pie = transitableAPie(p.w.tags || {});
  let estado, det;
  if (na.nodo === -1 || nb.nodo === -1) { estado = '⛔'; det = 'sin grafo cerca'; }
  else if (g.comp.comp[na.nodo] !== g.comp.comp[nb.nodo]) { estado = '⛔'; det = 'COMPONENTES DISTINTAS'; }
  else {
    const recta = dist([g.nodos[na.nodo].x, g.nodos[na.nodo].y], [g.nodos[nb.nodo].x, g.nodos[nb.nodo].y]);
    const r = G.dijkstra(g.ady, na.nodo);
    const m = r.dist[nb.nodo];
    if (!Number.isFinite(m)) { estado = '⛔'; det = 'sin camino'; }
    else {
      const rod = m / Math.max(recta, 1);
      // ⛔ imposibilidad física: se lanza, no se anota. Seguir midiendo con un
      //    instrumento que acaba de decir un absurdo no tiene sentido.
      if (rod < 0.999) AL.imposible(`el puente ${k} da un rodeo de ${rod.toFixed(3)}: menos que su propia línea recta`, { k, rod });
      else { estado = rod <= 3 ? '✅' : '⚠️'; }
      det = det || Math.round(m) + ' m  (recta ' + Math.round(recta) + ' m, rodeo ' + rod.toFixed(2) + ')';
    }
  }
  if (estado === '✅') pOk++; else malos.push({ k, det, pie });
  L.push('   ' + estado + ' ' + k.padEnd(52) + ' ' + det + (pie ? '' : '   [NO transitable a pie]'));
}
L.push('');
di('⇒ puentes cruzables a pie sin rodeo', `${pOk} de ${porNombre.size}`);
if (malos.length) {
  L.push('   ⚠️ los que no, y por qué:');
  for (const m of malos) {
    L.push('      ' + (m.pie ? '⛔ SÍ es transitable a pie y aun así rodea: ' : '✅ prohibido a pie por D4, el rodeo es CORRECTO: ')
      + m.k + '  ·  ' + m.det);
  }
  const sospechosos = malos.filter((m) => m.pie);
  di('   ⇒ rodeos SIN explicar', sospechosos.length + (sospechosos.length ? '  ⛔ HAY QUE MIRARLOS' : '  ✅ todos son autovías'));
  for (const s2 of sospechosos) {
    AL.fallo(`puente transitable a pie con rodeo sin explicar: ${s2.k} · ${s2.det}`);
  }
}

L.push('');
L.push(AL.cierre('VERIFICACIÓN DE RÍOS'));
di('tiempo total', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
console.log(L.join('\n'));
