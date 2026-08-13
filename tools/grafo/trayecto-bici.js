// ⭐⭐⭐ H2b · TANDA 5 — LA VELOCIDAD DE `empuja`, Y EL TRAYECTO COMO UN OBJETO.
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ ESTA TANDA EXISTE
// ═════════════════════════════════════════════════════════════════════════════
//   La tanda 4 midió que **en METROS la BiZi no gana nunca**: rodar no acorta la
//   distancia, acorta el tiempo, y encima suma los dos tramos andando. ⇒ un motor
//   que minimiza metros **jamás propondría la bici**. La unidad de tiempo no era
//   una mejora del modelo: **es la condición para que el modo exista.**
//
// ⛔ LO QUE ESTE FICHERO **NO** HACE:
//   · no toca `src/` — ni una línea
//   · no combina con el bus ni con el tranvía: el bus no tiene duración, así que
//     no se puede sumar con esto
//   · no hace el grafo dirigido: `oneway` sigue medido y sin aplicar
//   · no inventa ninguna constante: las tres van con su cita, fichero a fichero
//
//   node tools/grafo/trayecto-bici.js

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
const Rel = require('../../src/relato');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(52) + ' ' + v);
const f1 = (x) => (Number.isFinite(x) ? (Math.round(x * 10) / 10).toFixed(1) : '∞');
const pc = (a, b) => (100 * a / b).toFixed(1) + ' %';

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ LAS TRES CONSTANTES, CADA UNA CON SU CITA — ⛔ ninguna inventada
//
//   ANDAR   5,0 km/h   ya adoptada por H1 y viva en `src/relato.js:78`
//   RODAR  18,0 km/h   adoptada en H2b·0 (Valhalla «Hybrid or City» · ORS 18)
//   ⭐ EMPUJAR 4,0 km/h — LA DE HOY, y las dos fuentes que la modelan la nombran:
//
//     openrouteservice · CommonBikeFlagEncoder.java
//        protected static final int PUSHING_SECTION_SPEED = 4;
//        // Pushing section highways are parts where you need to get off your
//        // bike and push it
//        setHighwaySpeed(KEY_STEPS, PUSHING_SECTION_SPEED / 2);   ⇒ 2 en escaleras
//
//     OSRM · profiles/bicycle.lua
//        local walking_speed = 4            (línea 13)
//        …usada por `bike_push_handler()`:  push_forward_speed = profile.walking_speed
//        …y por el tag `bicycle = "dismount"`
//
//     Valhalla · Route API reference
//        ⛔ NO MODELA EL EMPUJAR. Su costing de bici no tiene ninguna opción de
//          andar ni de bajarse, y su documentación no lo menciona. ⇒ `NO CONSTA`.
//
//   ⇒ ⭐ SE ELIGE 4,0 km/h, y **no es una votación**: las DOS que modelan el
//     empujar dan exactamente lo mismo, y la tercera no habla de ello. *Es el
//     mismo argumento con el que se eligió el 18, donde dos distinguían tipo de
//     bicicleta y la tercera no.*
//
// ⚠️ Y QUÉ SE ESTÁ CITANDO EXACTAMENTE, que es lo que el encargo mandaba decir:
//   **la velocidad de EMPUJAR una bici, no la de una bici rodando por una acera.**
//   ⛔ Son dos cosas distintas y en `docs/H2B-CIRCULACION-BICI.md` cité la segunda
//     (`setHighwaySpeed("footway", 6)`). **El 6 es una bici RODANDO despacio por
//     una acera; el 4 es una persona andando con la bici en la mano.** Lo que aquí
//     se llama `empuja` es lo segundo.
// ═════════════════════════════════════════════════════════════════════════════
const V = { andar: 5.0, empujar: 4.0, rodar: 18.0 };
/** metros → minutos, con la velocidad del régimen. ⛔ Nunca una media de las tres. */
const min = (m, v) => m / (v * 1000 / 60);
/** Valhalla · bss_rent_cost y bss_return_cost, 120 s cada uno (H2b·0). */
const CAMBIO_S = 120;

const EXP = path.join(__dirname, '..', '..', 'data', 'exploracion');
const PUB = { circula: 49972, estaciones: 276, andandoPOI: 4743.4 };

raya();
log('EL TRAYECTO EN BICI COMO UN SOLO OBJETO — y la pregunta que ahora sí se puede hacer');
raya();

// ═════════════════════════════════════════════════════════════════════════════
// P0 · LAS CONSTANTES, Y QUE LA DE ANDAR NO SE INVENTA AQUÍ
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P0 · LAS TRES CONSTANTES — cada una con su procedencia');
raya('─');
log('   ' + 'régimen'.padEnd(12) + 'km/h'.padStart(7) + '   de dónde sale');
log('   ' + 'andar'.padEnd(12) + V.andar.toFixed(1).padStart(7) + '   `src/relato.js:78` — la que YA usa el motor');
log('   ' + 'empujar'.padEnd(12) + V.empujar.toFixed(1).padStart(7) + '   ⭐ ORS `PUSHING_SECTION_SPEED = 4` · OSRM `walking_speed = 4`');
log('   ' + 'rodar'.padEnd(12) + V.rodar.toFixed(1).padStart(7) + '   adoptada en H2b·0 (Valhalla «Hybrid or City» · ORS)');
// ⛔ La de andar NO se escribe a mano: se lee del motor. Si el motor cambia y esto
//   no, los dos números divergen en silencio — que es el fallo nº56 del proyecto.
di('⭐ control: la de andar coincide con `Rel.VELOCIDAD_KMH`',
  Rel.VELOCIDAD_KMH === V.andar ? '✅ ' + Rel.VELOCIDAD_KMH : '⛔ ' + Rel.VELOCIDAD_KMH + ' ≠ ' + V.andar);
A.exige(Rel.VELOCIDAD_KMH === V.andar,
  `el motor anda a ${Rel.VELOCIDAD_KMH} km/h y aquí se usa ${V.andar}: dos copias de la misma `
  + 'constante que ya han divergido');
log('');
log('   ⚠️ Y LO QUE SE ADOPTA ES LA MITAD DEL MODELO, dicho con su cifra:');
log('     ORS parte el empujar en dos —4 km/h en general y **2 en escaleras**— y aquí');
log('     se adopta UNA sola cifra. Abajo se mide cuánto de lo empujado son escaleras.');

// ═════════════════════════════════════════════════════════════════════════════
// P1 · EL GRAFO Y LOS DOS REGÍMENES
// ═════════════════════════════════════════════════════════════════════════════
const g = R.construir(R.ZONA_TERMINO);
const tagsDe = new Map(osm.cargar(R.CRUDO).ways.map((w) => [w.id, w.tags || {}]));
const CIRCULA = new Set(['cycleway', 'residential', 'service', 'tertiary', 'secondary', 'primary',
  'unclassified', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link', 'track', 'path']);
const pasaBici = (e) => CIRCULA.has(e.highway)
  && !((tagsDe.get(e.way) || {}).bicycle === 'no' || (tagsDe.get(e.way) || {}).access === 'no');
const nCircula = g.aristas.filter(pasaBici).length;
A.exige(nCircula === PUB.circula, `el predicado da ${nCircula} y está publicado ${PUB.circula}`);
const idxPie = P.indexarAristas(g.aristas, (e) => e.pie);
const { ady: adyPie } = G.adyacencia(g.nodos, g.aristas, G.PASA_A_PIE, false);
const { ady: adyBici } = G.adyacencia(g.nodos, g.aristas, pasaBici, false);

/**
 * Dijkstra con varios orígenes, cada uno con su coste inicial.
 * ⭐ Devuelve además `de[]`: **de qué origen viene el mínimo de cada nodo.** Sin
 *   eso, decir «se entra por la estación X» sería una suposición: el que el
 *   camino óptimo entre por la estación más barata NO se sigue de nada.
 */
function dijkstraMulti(ady, origenes) {
  const dist = new Float64Array(ady.length).fill(Infinity);
  const de = new Int32Array(ady.length).fill(-1);
  const q = new G.Cola();
  for (let k = 0; k < origenes.length; k++) {
    const [n, d0] = origenes[k];
    if (d0 < dist[n]) { dist[n] = d0; de[n] = k; q.push(d0, n); }
  }
  while (q.size) {
    const [d, v] = q.pop();
    if (d > dist[v]) continue;
    for (const { n: u, w } of ady[v]) {
      const nd = d + w;
      if (nd < dist[u]) { dist[u] = nd; de[u] = de[v]; q.push(nd, u); }
    }
  }
  dist.de = de;
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
// nodos desde los que se puede rodar, y lo que cuesta llegar EMPUJANDO
const nodosBici = new Set();
for (const e of g.aristas) if (pasaBici(e)) { nodosBici.add(e.a); nodosBici.add(e.b); }
const empujeHasta = dijkstraMulti(adyPie, [...nodosBici].map((n) => [n, 0]));

// ⭐ CUÁNTO DE LO EMPUJADO SON ESCALERAS — la cifra de la simplificación de arriba
{
  const { ady: adyEmpuje } = G.adyacencia(g.nodos, g.aristas,
    (e) => e.pie && !pasaBici(e), false);
  let mEsc = 0, mTot = 0;
  for (const e of g.aristas) {
    if (!e.pie || pasaBici(e)) continue;
    mTot += e.largo;
    if (e.highway === 'steps') mEsc += e.largo;
  }
  log('');
  di('metros por los que se EMPUJA en todo el grafo', f1(mTot / 1000) + ' km');
  di('   …de ellos, escaleras', f1(mEsc / 1000) + ' km   (' + pc(mEsc, mTot) + ')');
  log('      ⇒ ⭐ adoptar una sola cifra en vez de las dos de ORS afecta al ' + pc(mEsc, mTot)
    + ' de lo empujable.');
  log('        **No es cero, y por eso se dice.** El error máximo que introduce es el de');
  log('        contar esas escaleras al doble de su velocidad.');
}

// ── las estaciones BiZi ──────────────────────────────────────────────────────
let W = [];
for (const f of fs.readdirSync(EXP).filter((f) => /^2026-08-02_wfs_bizi_pag\d+\.json$/.test(f)).sort()) {
  W = W.concat(JSON.parse(fs.readFileSync(path.join(EXP, f), 'utf8')).features);
}
A.exige(W.length === PUB.estaciones, `salen ${W.length} estaciones y son ${PUB.estaciones}`);
const EST = [];
for (const w of W) {
  const m = aMetros(w.geometry.coordinates[0], w.geometry.coordinates[1]);
  const { mejor } = P.engancharUno(m, g.aristas, idxPie, () => '', 350);
  if (!mejor) continue;
  const ar = g.aristas[mejor.i];
  const nodo = empujeHasta[ar.a] <= empujeHasta[ar.b] ? ar.a : ar.b;
  EST.push({ n: w.properties.numero, nom: w.properties.nombre,
    nodoPie: ar.a, engPie: mejor.d, empuje: Math.min(empujeHasta[ar.a], empujeHasta[ar.b]), nodoBici: nodo });
}
di('estaciones enganchadas', EST.length + ' de ' + W.length);

// ═════════════════════════════════════════════════════════════════════════════
// P2 · ⭐⭐⭐ EL TRAYECTO COMO **UN** OBJETO — cinco tramos, cada uno con su régimen
// ═════════════════════════════════════════════════════════════════════════════
/**
 * ⭐ El trayecto entero, con sus tramos de acceso DENTRO. ⛔ Ya no son «la ruta»
 *   y «un número al lado»: es una lista de tramos y su suma.
 * @returns {{tramos:[], metros:number, segundos:number, entrada, salida}}
 */
function trayectoBizi(mO, mD) {
  const eO = P.engancharUno(mO, g.aristas, idxPie, () => '', 350).mejor;
  const eD = P.engancharUno(mD, g.aristas, idxPie, () => '', 350).mejor;
  if (!eO || !eD) return null;
  const nO = g.aristas[eO.i].a, nD = g.aristas[eD.i].a;
  const desdeO = dijkstraMulti(adyPie, [[nO, eO.d]]);
  const haciaD = dijkstraMulti(adyPie, [[nD, eD.d]]);
  // entrar a la red de bici por cada estación: andar + empujar
  const entradas = [];
  for (const e of EST) {
    const andar = desdeO[e.nodoPie];
    if (!Number.isFinite(andar) || !Number.isFinite(e.empuje)) continue;
    entradas.push([e.nodoBici, min(andar, V.andar) + min(e.empuje, V.empujar), e, andar]);
  }
  if (!entradas.length) return null;
  // ⭐⭐ EL DIJKSTRA SOBRE LA RED DE BICI VA EN **MINUTOS**, no en metros: es lo
  //   único que permite que el camino mínimo compare tramos de regímenes distintos.
  const adyBiciMin = adyBici.map((l) => l.map((x) => ({ n: x.n, w: min(x.w, V.rodar) })));
  const rodado = dijkstraMulti(adyBiciMin, entradas.map(([n, t]) => [n, t]));
  let mejor = null;
  for (const e of EST) {
    const andar = haciaD[e.nodoPie];
    if (!Number.isFinite(andar) || !Number.isFinite(e.empuje)) continue;
    const t = rodado[e.nodoBici] + min(e.empuje, V.empujar) + min(andar, V.andar);
    if (Number.isFinite(t) && (!mejor || t < mejor.t)) {
      mejor = { t, salida: e, andarSalida: andar, tRodado: rodado[e.nodoBici] };
    }
  }
  if (!mejor) return null;
  // ⭐ LA ENTRADA REAL: la que el Dijkstra usó para llegar al nodo de salida.
  //   ⛔ NO «la entrada más barata»: son cosas distintas y confundirlas produce
  //     una tabla de tramos que no pertenece al camino que se está publicando.
  const k = rodado.de[mejor.salida.nodoBici];
  A.exige(k >= 0, 'el nodo de salida no tiene origen registrado: el camino no se puede reconstruir');
  const [, tEntrada, eEntrada, andarEntrada] = entradas[k];
  const entrada = { t: tEntrada, e: eEntrada, andar: andarEntrada };
  return { desdeO, haciaD, nO, nD, mejor, entrada, engO: eO.d, engD: eD.d };
}

log('');
raya('─');
log('P2 · ⭐⭐⭐ EL TRAYECTO COMO UN SOLO OBJETO — los cinco tramos');
raya('─');
const pO = Ra.POI['Estación Delicias'], pD = Ra.POI['C.C. Utrillas'];
const mO = aMetros(pO.lon, pO.lat), mD = aMetros(pD.lon, pD.lat);
const T = trayectoBizi(mO, mD);
A.exige(!!T, 'no sale trayecto en BiZi entre los dos POI');
{
  // ⛔ el andando entero, CON EL MOTOR — el patrón externo, no una copia
  const rMotor = (() => {
    const o = R.engancharPunto(g, pO.lat, pO.lon, 'origen');
    const d = R.engancharPunto(g, pD.lat, pD.lon, 'destino');
    const r = G.rutaEntre(g, o, d);
    return r.encontrada ? r.metros : null;
  })();
  di('andando entero, CON EL MOTOR', rMotor + ' m   (la tanda 3 publicó ' + PUB.andandoPOI + ')');
  A.exige(Math.abs(rMotor - PUB.andandoPOI) < 0.05,
    `el andando entero da ${rMotor} y está publicado ${PUB.andandoPOI}`);
  const tAndar = min(rMotor, V.andar);
  log('');
  log('   ⭐⭐⭐ EL TRAYECTO EN BiZi, TRAMO A TRAMO — ⛔ ya no hay «un número al lado»');
  log('   ' + 'tramo'.padEnd(28) + 'régimen'.padStart(10) + 'metros'.padStart(11) + 'km/h'.padStart(7) + 'minutos'.padStart(10));
  const andarO = T.entrada.andar;
  di('estación de entrada · de salida', '#' + T.entrada.e.n + ' ' + T.entrada.e.nom
    + '  →  #' + T.mejor.salida.n + ' ' + T.mejor.salida.nom);
  const filas = [
    ['1 · del origen a la estación', 'andar', andarO, V.andar],
    ['2 · empujar hasta la calzada', 'empujar', T.entrada.e.empuje, V.empujar],
    ['3 · rodando', 'rodar', null, V.rodar],
    ['4 · empujar desde la calzada', 'empujar', T.mejor.salida.empuje, V.empujar],
    ['5 · de la estación al destino', 'andar', T.mejor.andarSalida, V.andar],
  ];
  // el tramo 3 en metros se despeja del tiempo total
  const tFijos = min(andarO, V.andar) + min(T.entrada.e.empuje, V.empujar)
    + min(T.mejor.salida.empuje, V.empujar) + min(T.mejor.andarSalida, V.andar);
  const tRodando = T.mejor.t - tFijos;
  filas[2][2] = tRodando * (V.rodar * 1000 / 60);
  let mTot = 0;
  for (const [etq, reg, m, v] of filas) {
    mTot += m;
    log('   ' + etq.padEnd(28) + reg.padStart(10) + f1(m).padStart(11) + v.toFixed(1).padStart(7)
      + f1(min(m, v)).padStart(10));
  }
  log('   ' + '─'.repeat(66));
  log('   ' + 'TOTAL sin cambio de modo'.padEnd(28) + ''.padStart(10) + f1(mTot).padStart(11)
    + ''.padStart(7) + f1(T.mejor.t).padStart(10));
  log('   ' + ('+ coger y devolver (2 × ' + CAMBIO_S + ' s)').padEnd(28) + ''.padStart(10) + ''.padStart(11)
    + ''.padStart(7) + f1(2 * CAMBIO_S / 60).padStart(10));
  const tBiziCon = T.mejor.t + 2 * CAMBIO_S / 60;
  log('   ' + '⭐ TOTAL EN BiZi'.padEnd(28) + ''.padStart(10) + ''.padStart(11) + ''.padStart(7)
    + f1(tBiziCon).padStart(10));
  log('');
  log('   ' + 'ANDANDO ENTERO'.padEnd(28) + 'andar'.padStart(10) + f1(rMotor).padStart(11)
    + V.andar.toFixed(1).padStart(7) + f1(tAndar).padStart(10));
  log('');
  di('⇒ ¿gana la BiZi en este caso?', tBiziCon < tAndar
    ? '⭐ SÍ, por ' + f1(tAndar - tBiziCon) + ' min'
    : '⛔ NO — pierde por ' + f1(tBiziCon - tAndar) + ' min');
  di('   …y SIN los ' + (2 * CAMBIO_S) + ' s de cambio de modo', T.mejor.t < tAndar
    ? '⭐ SÍ, por ' + f1(tAndar - T.mejor.t) + ' min' : '⛔ NO — pierde por ' + f1(T.mejor.t - tAndar) + ' min');
  log('');
  log('   ⚠️ ALCANCE, pegado al número: **esto es UN caso, y sus dos puntas son EDIFICIOS**');
  log('     grandes (una estación de tren y un centro comercial), no portales. **No es una');
  log('     muestra.** El umbral de verdad se mide abajo, sobre ' + '25 pares' + '.');
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 · ⭐⭐⭐ ¿A PARTIR DE CUÁNTOS METROS GANA? — la curva, no un caso
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · ⭐⭐⭐ EL UMBRAL — una escalera de destinos, ⛔ no un caso');
raya('─');
{
  // ⛔ El origen y los destinos NO se eligen a ojo: origen = el primer portal del
  //   callejero, y los destinos = el portal cuya distancia en recta se acerca más
  //   a cada peldaño. Determinista y reproducible.
  const portales = P.cargarPortales();
  const org = portales[0];
  const PELDANOS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000];
  const dest = [];
  for (const objetivo of PELDANOS) {
    let mejor = null, md = Infinity;
    for (const p of portales) {
      const d = Math.hypot(p.m[0] - org.m[0], p.m[1] - org.m[1]);
      const err = Math.abs(d - objetivo);
      if (err < md) { md = err; mejor = { p, d }; }
    }
    if (mejor) dest.push({ objetivo, ...mejor });
  }
  log('   origen: portal id ' + org.id + ' (el primero del callejero) · ' + dest.length + ' destinos');
  log('');
  log('   ' + 'recta'.padStart(8) + 'andando'.padStart(10) + 'min'.padStart(8)
    + '  |' + 'BiZi m'.padStart(10) + 'min'.padStart(8) + 'con cambio'.padStart(12)
    + '  ⇒ ¿gana la BiZi?');
  let umbralSin = null, umbralCon = null;
  for (const d of dest) {
    const t = trayectoBizi(org.m, d.p.m);
    const andando = t ? t.desdeO[t.nD] : Infinity;
    if (!t || !Number.isFinite(andando)) { log('   ' + f1(d.d).padStart(8) + '   sin camino'); continue; }
    const tAnd = min(andando, V.andar);
    const tSin = t.mejor.t, tCon = tSin + 2 * CAMBIO_S / 60;
    // los metros del trayecto en BiZi, sumando los cinco tramos
    const mRod = (tSin - min(t.entrada.andar, V.andar) - min(t.entrada.e.empuje, V.empujar)
      - min(t.mejor.salida.empuje, V.empujar) - min(t.mejor.andarSalida, V.andar)) * (V.rodar * 1000 / 60);
    const mBizi = t.entrada.andar + t.entrada.e.empuje + mRod + t.mejor.salida.empuje + t.mejor.andarSalida;
    if (umbralSin === null && tSin < tAnd) umbralSin = d.d;
    if (umbralCon === null && tCon < tAnd) umbralCon = d.d;
    log('   ' + f1(d.d).padStart(8) + f1(andando).padStart(10) + f1(tAnd).padStart(8)
      + '  |' + f1(mBizi).padStart(10) + f1(tSin).padStart(8) + f1(tCon).padStart(12)
      + '   ' + (tCon < tAnd ? '⭐ SÍ' : tSin < tAnd ? '⚠️ solo sin cambio' : '⛔ no'));
  }
  log('');
  di('⭐ umbral SIN el coste de cambio', umbralSin === null ? '⛔ no gana en ninguno' : '≈ ' + f1(umbralSin) + ' m en recta');
  di('⭐ umbral CON los ' + (2 * CAMBIO_S) + ' s', umbralCon === null ? '⛔ no gana en ninguno' : '≈ ' + f1(umbralCon) + ' m en recta');
  A.exige(umbralSin === null || umbralCon === null || umbralCon >= umbralSin,
    'el umbral CON coste de cambio sale menor que SIN él: la aritmética está al revés');
}

// ═════════════════════════════════════════════════════════════════════════════
// P4 · LOS LÍMITES
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · ⚠️ LOS LÍMITES, DECLARADOS');
raya('─');
log('   ⛔ UN TIEMPO CON CONSTANTE ADOPTADA NO ES UNA PREDICCIÓN. La forma en que se');
log('     publica lleva la constante pegada: «12 min a 18 km/h» ✅, «unos 12 minutos» ⛔.');
log('   ⛔ NO SE SABE SI HAY BICIS. H2 es sin reloj.');
{
  const one = g.aristas.filter((e) => pasaBici(e) && (tagsDe.get(e.way) || {}).oneway === 'yes').length;
  log('   ⛔ La red de bici sigue NO DIRIGIDA: `oneway=yes` en ' + one + ' de ' + nCircula
    + ' (' + pc(one, nCircula) + ').');
}
log('   ⛔ Y NO se suma con el bus: **el bus no tiene duración por decisión de Antonio**,');
log('     así que un trayecto con bus no se puede comparar con éste.');

log('');
raya();
log(A.cierre('EL TRAYECTO EN BICI'));
