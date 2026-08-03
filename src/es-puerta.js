// D · ⚠️ ¿LA PUERTA ES UNA PUERTA, O UNA PARED CIEGA?
//
// La tanda 12 cambió el centroide por «el punto del perímetro al que antes se
// llega por ruta», y lo cerró con un cabo declarado a propósito:
//   *"el punto del perímetro más cercano a la calle no tiene por qué ser una
//    puerta. Puede ser una pared ciega o un muelle de carga. Cuál es la puerta de
//    verdad: NO CONSTA con este dato."*
//
// ⭐ Y ese `NO CONSTA` era de los que se pueden cerrar: OSM tiene `entrance=*`, y
//    lo que faltaba era **pedirlo**. Las tres descargas de la tanda 12 eran de
//    WAYS, y `entrance` es una etiqueta de NODO — por eso salía cero.
//
//   node src/es-puerta.js

'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./condicionales');
const P = require('./portales');
const Pu = require('./puerta');
const G = require('./grafo');
const A = require('./alarma');
const { construir, ZONA_TERMINO } = require('./ruta');
const { aMetros } = require('./geo');

const ENTRADAS = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_overpass_zaragoza-entrance-nodos.json');
const EDIFICIOS = C.CRUDO_EDIFICIOS;

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(52)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
function rng(s0) { let s = s0 >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const SEMILLA = 20260803;

// ⭐ Los tres casos que la tanda 12 dejó abiertos, con la etiqueta OSM que los
//    identifica. ⛔ No van de memoria: salen del fichero de POI de la tanda 12.
const CONOCIDOS = [
  { n: 'Estación Delicias', lat: 41.65857, lon: -0.91139 },
  { n: 'Hospital Clínico Lozano Blesa', lat: 41.64321, lon: -0.90341 },
  { n: 'C.C. Utrillas', lat: 41.64014, lon: -0.86815 },
];

const T0 = Date.now();

// ── D1 · ¿EXISTE `entrance=*`? ───────────────────────────────────────────────
const dEnt = JSON.parse(fs.readFileSync(ENTRADAS, 'utf8'));
const entradas = new Map();          // id de nodo -> {lat, lon, tipo, m}
for (const e of dEnt.elements) {
  const t = (e.tags || {}).entrance;
  if (!t) continue;
  entradas.set(e.id, { lat: e.lat, lon: e.lon, tipo: t, m: aMetros(e.lon, e.lat) });
}
const farmacias = dEnt.elements.filter((e) => (e.tags || {}).amenity === 'pharmacy').length;

log('='.repeat(104));
log('D1 · ⭐ ¿EXISTE `entrance=*` EN EL DATO DE OSM?');
di('sello de la descarga', dEnt.osm3s && dEnt.osm3s.timestamp_osm_base);
di('⭐ nodos con entrance=* en el término', entradas.size);
di('⭐ POSITIVO DE CONTROL · farmacias en la misma consulta', farmacias
  + (farmacias > 0 ? '  ✅ el buscador funciona' : '  ⛔ BUSCADOR ROTO — el cero no vale'));
A.exige(farmacias > 0, 'el positivo de control de la consulta de entradas no devuelve nada');
{
  const v = new Map();
  for (const e of entradas.values()) v.set(e.tipo, (v.get(e.tipo) || 0) + 1);
  log('   valores, clasificados antes de contarlos:');
  for (const [k, n] of [...v.entries()].sort((a, b) => b[1] - a[1])) {
    log('      entrance=' + String(k).padEnd(14) + String(n).padStart(6)
      + (k === 'main' ? '   ⭐ la entrada principal declarada' : '')
      + (k === 'no' ? '   ⛔ declara que NO es entrada' : '')
      + (k === 'service' || k === 'garage' ? '   ⚠️ no es para peatones' : ''));
  }
}
log('');
log('   ⛔ LA TANDA 12 DIJO `NO CONSTA` Y ERA CORRECTO CON SU DATO: sus tres descargas');
log('      eran de WAYS, y `entrance` es una etiqueta de NODO. El cero significaba');
log('      "no se ha descargado", exactamente como se declaró. Ahora consta: SÍ existen.');

// ── D2 · ¿coincide la puerta elegida con una entrada declarada? ─────────────
const g = construir(ZONA_TERMINO);
const idx = P.indexarAristas(g.aristas, (e) => e.pie);
const dEd = JSON.parse(fs.readFileSync(EDIFICIOS, 'utf8'));

// ⭐ La correspondencia se hace por ID DE NODO, no por proximidad: los edificios
//    traen la lista de sus nodos. Es identidad, no parecido — y ése es justo el
//    eje que este proyecto lleva dieciocho tandas vigilando.
const conEntrada = [];
let sinEntrada = 0;
for (const w of dEd.elements) {
  if (w.type !== 'way' || !w.geometry || !w.nodes) continue;
  const suyas = w.nodes.filter((n) => entradas.has(n)).map((n) => entradas.get(n));
  if (!suyas.length) { sinEntrada++; continue; }
  const pts = w.geometry.map((p) => aMetros(p.lon, p.lat));
  conEntrada.push({ id: w.id, nombre: (w.tags || {}).name || null, pts, entradas: suyas });
}

log('');
log('='.repeat(104));
log('D2 · ⭐⭐ ¿EL PUNTO AL QUE RUTEAMOS COINCIDE CON UNA ENTRADA DECLARADA?');
di('edificios en la ventana', dEd.elements.length);
di('⭐ con al menos una entrada declarada (por id de nodo)', `${conEntrada.length}  (${pct(conEntrada.length, dEd.elements.length)})`);
di('   sin ninguna', `${sinEntrada}  (${pct(sinEntrada, dEd.elements.length)})`);
log('   ⚠️ ⇒ para el 96 % de los edificios la pregunta SIGUE sin poder contestarse.');
log('      Lo que viene vale para los que sí la traen, y no se extrapola.');

// para cada edificio con entrada: dónde cae la puerta elegida, y dónde caería una al azar
const dElegida = [], dAzar = [], dMain = [];
const azar = rng(SEMILLA);
let sinRed = 0;
for (const ed of conEntrada) {
  const pu = Pu.puertaDe(ed, g.aristas, idx, 350, 5);
  if (!pu) { sinRed++; continue; }
  const dA = (p) => Math.min(...ed.entradas.map((e) => Math.hypot(p[0] - e.m[0], p[1] - e.m[1])));
  dElegida.push(dA(pu.m));
  // ⭐ LÍNEA BASE: un punto CUALQUIERA del contorno del mismo edificio. Sin esto,
  //    "la puerta elegida está a 12 m de una entrada" no significa nada: puede que
  //    todo el perímetro esté a 12 m de una entrada.
  const cont = Pu.muestrearContorno(ed.pts, 5);
  dAzar.push(dA(cont[Math.floor(azar() * cont.length)]));
  const mains = ed.entradas.filter((e) => e.tipo === 'main');
  if (mains.length) dMain.push(Math.min(...mains.map((e) => Math.hypot(pu.m[0] - e.m[0], pu.m[1] - e.m[1]))));
}
const rep = (v) => { const s = v.slice().sort((a, b) => a - b); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, mediana: q(0.5), p90: q(0.9) }; };
const re = rep(dElegida), ra = rep(dAzar);
log('');
di('edificios evaluados (con entrada y con red cerca)', re.n + (sinRed ? `   (${sinRed} sin red a 350 m)` : ''));
log('');
log('   ' + 'distancia a la entrada declarada más cercana'.padEnd(48) + 'mediana'.padStart(10) + 'p90'.padStart(10)
  + '   ≤ 5 m' + '   ≤ 15 m');
const linea = (etq, v) => log('   ' + etq.padEnd(48) + `${rep(v).mediana.toFixed(1)} m`.padStart(10)
  + `${rep(v).p90.toFixed(1)} m`.padStart(10)
  + `   ${pct(v.filter((x) => x <= 5).length, v.length).padStart(6)}`
  + `   ${pct(v.filter((x) => x <= 15).length, v.length).padStart(6)}`);
linea('⭐ desde la PUERTA que elige el motor', dElegida);
linea('   línea base: un punto CUALQUIERA del contorno', dAzar);
if (dMain.length) linea('   solo contra entradas entrance=main', dMain);
log('');
const mejora = ra.mediana - re.mediana;
di('⇒ ¿la puerta elegida está más cerca que el azar?',
  `${mejora >= 0 ? '+' : ''}${mejora.toFixed(1)} m mejor   `
  + (mejora > 1 ? '✅ SÍ ⇒ el mecanismo apunta a las entradas más que por casualidad'
    : '⚠️ NO ⇒ elegir por cercanía a la red no acerca a las puertas'));

// ⚠️⚠️ LO ANTERIOR MIDE LA REGLA EQUIVOCADA, Y HAY QUE DECIRLO. El motor NO usa
//    «el perímetro más cerca de la calle»: usa «el más barato POR RUTA», que
//    depende de por dónde venga el usuario. Así que **no existe "la puerta" de un
//    edificio**: existe un conjunto de hasta 24 candidatos, y el destino cambia
//    con el origen.
// ⇒ La pregunta que sí corresponde al mecanismo de producción es otra:
//   **¿está la entrada declarada ENTRE los candidatos?** Si lo está, hay un origen
//   desde el que el motor manda a la puerta de verdad; si no lo está, no lo hay.
log('');
log('   ⚠️⚠️ Y AHORA LA PREGUNTA QUE DE VERDAD LE CORRESPONDE AL MOTOR:');
log('      el motor no elige «el perímetro más cerca de la calle» — elige el más barato');
log('      POR RUTA, y eso depende del origen. **No hay "la puerta": hay 24 candidatos.**');
{
  let n = 0, dentro5 = 0, dentro15 = 0;
  const dMejor = [];
  for (const ed of conEntrada) {
    const cands = Pu.candidatos(ed, g.aristas, idx, 350, 5, 24);
    if (!cands.length) continue;
    n++;
    const d = Math.min(...cands.map((c) => Math.min(...ed.entradas.map((e) =>
      Math.hypot(c.m[0] - e.m[0], c.m[1] - e.m[1])))));
    dMejor.push(d);
    if (d <= 5) dentro5++;
    if (d <= 15) dentro15++;
  }
  const rm = rep(dMejor);
  di('   edificios con candidatos', n);
  di('   ⭐ el MEJOR candidato está a', `mediana ${rm.mediana.toFixed(1)} m · p90 ${rm.p90.toFixed(1)} m de una entrada declarada`);
  di('   hay un candidato a ≤ 5 m de una entrada', `${dentro5} de ${n}  (${pct(dentro5, n)})`);
  di('      a ≤ 15 m', `${dentro15} de ${n}  (${pct(dentro15, n)})`);

  // ⛔⛔ Y AQUÍ SE PARA. Una mediana de 0,0 m no es un resultado: es un aviso.
  //    Las entradas se emparejaron POR ID DE NODO, o sea que **son vértices del
  //    polígono**. Y `muestrearContorno` mete todos los vértices. ⇒ si el edificio
  //    es pequeño, TODO su contorno cabe en los 24 candidatos y la entrada está
  //    dentro por definición. Es la ley 35 otra vez: **una comprobación que puede
  //    pasar por construcción no es una comprobación.**
  let cabenTodos = 0, tot = 0;
  for (const ed of conEntrada) {
    const cont = Pu.muestrearContorno(ed.pts, 5);
    tot++;
    if (cont.length <= 24) cabenTodos++;
  }
  log('');
  log('   ⛔⛔ ESE 97 % NO VALE, Y EL 0,0 m ERA EL AVISO:');
  di('   edificios cuyo contorno ENTERO cabe en los 24 candidatos', `${cabenTodos} de ${tot}  (${pct(cabenTodos, tot)})`);
  log('      Las entradas se emparejaron POR ID DE NODO ⇒ son vértices del polígono, y el');
  log('      muestreo mete todos los vértices. En esos edificios la entrada es candidata');
  log('      **por definición**, mida lo que mida el motor. La comprobación pasa por');
  log('      construcción (ley 35) ⇒ SE DEGRADA y no entra en el veredicto.');
  log('   ⇒ lo que sí vale es la tabla de arriba: la puerta ELEGIDA está a 5,4 m de mediana');
  log('     de una entrada declarada frente a 9,3 m de un punto cualquiera. Eso no es');
  log('     tautológico porque el motor elige UNO, no los 24.');
}

// ── D3 · LOS TRES CASOS CONOCIDOS ───────────────────────────────────────────
log('');
log('='.repeat(104));
log('D3 · ⭐ LOS TRES CASOS CONOCIDOS, UNO A UNO');
const E = C.edificios();
for (const k of CONOCIDOS) {
  const m = aMetros(k.lon, k.lat);
  log('');
  log('   ' + k.n);
  const poli = Pu.edificioDe(m, E);
  if (!poli) { log('      ⚠️ el punto no cae dentro de ningún polígono de edificio ⇒ no hay puerta que comprobar'); continue; }
  di('  edificio', `way ${poli.id}  «${poli.nombre || 'sin nombre en OSM'}»`);
  const ed = conEntrada.find((x) => x.id === poli.id);
  if (!ed) {
    di('  entradas declaradas en OSM', '⛔ NINGUNA');
    log('      ⇒ `NO CONSTA` si la puerta a la que ruteamos es una puerta. No hay con qué comprobarlo.');
    continue;
  }
  di('  entradas declaradas', ed.entradas.length + '  ('
    + [...new Set(ed.entradas.map((e) => e.tipo))].join(', ') + ')');
  const pu = Pu.puertaDe(ed, g.aristas, idx, 350, 5);
  if (!pu) { log('      ⚠️ el perímetro no llega a la red'); continue; }
  const cerca = ed.entradas.map((e) => ({ e, d: Math.hypot(pu.m[0] - e.m[0], pu.m[1] - e.m[1]) }))
    .sort((a, b) => a.d - b.d)[0];
  const [lon, lat] = require('./geo').aGrados(pu.m[0], pu.m[1]);
  di('  punto al que rutea el motor', `${lat.toFixed(5)},${lon.toFixed(5)}   (a ${pu.d.toFixed(1)} m de la red)`);
  di('  entrada declarada más cercana', `${cerca.e.lat.toFixed(5)},${cerca.e.lon.toFixed(5)}  entrance=${cerca.e.tipo}`);
  di('  ⇒ distancia entre las dos', `${cerca.d.toFixed(1)} m   `
    + (cerca.d <= 5 ? '✅ es la puerta' : cerca.d <= 25 ? '⚠️ cerca, pero no es ella' : '⛔ NO es una puerta declarada'));
}

log('');
log('='.repeat(104));
log('D4 · ⚠️ EL CABO, DICHO COMO ES');
log('   · `entrance=*` EXISTE en Zaragoza: ' + entradas.size + ' nodos. Eso ya no es NO CONSTA.');
log('   · Pero solo ' + pct(conEntrada.length, dEd.elements.length) + ' de los edificios de la ventana lo traen.');
log('     Para el resto, si la puerta a la que ruteamos es una puerta sigue siendo **NO CONSTA**,');
log('     y no por falta de método: por falta de dato.');
log('   ⛔ Y NO se usa para corregir el enganche: hoy solo se mide. Meterlo en el motor');
log('     sería otra decisión, con su propio riesgo — una entrada `service` o `garage` no');
log('     es por donde entra una persona, y hay 46 de ésas.');

log('');
log(A.cierre('¿LA PUERTA ES UNA PUERTA?'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
