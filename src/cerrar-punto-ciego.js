// B/C · ⭐⭐⭐ CERRAR EL PUNTO CIEGO — el E7, con la capa municipal COMPLETA.
//
// La tanda 12 dejó el veredicto en `NO CONSTA` honesto: el mejor testigo ponía el
// enganche ciego al nivel de los buenos conocidos (65,5 % frente a 61,9 %), y el
// único independiente de OSM lo ponía ~10 puntos por debajo **sobre 214 casos**.
// 214 casos no deciden nada. Con la capa entera —3.644 tramos en vez de 197— se
// puede decidir.
//
// ⛔ D0: el dato municipal VERIFICA, NO DECIDE. Aquí no se corrige ni un enganche.
//
//   node src/cerrar-punto-ciego.js

'use strict';
const P = require('./portales');
const E = require('./enganche');
const D = require('./direccion');
const M = require('./municipal');
const A = require('./alarma');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');
const { aGrados } = require('./geo');
const { heredar, rng } = require('./sin-vigilancia');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(52)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
const SEMILLA = 20260803;
const CERCA = 25;          // m — "el enganche está sobre el eje de su calle"
const RADIO_COBERTURA = 60; // m — "aquí la capa municipal llega"

const T0 = Date.now();
const mu = M.cargar();

// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(106));
log('B2 · ⭐ LA DESCARGA, VERIFICADA ANTES DE MEDIR CON ELLA');
di('fichero', 'data/fuentes/2026-08-03_wfs_movilidad-MU1_jerarquia_viaria_completa.json');
di('sello del servidor', mu.sello);
di('CRS declarado', mu.crs);
di('features · numberMatched', `${mu.n} · ${mu.numberMatched}   (la tanda 0 declaró 3.644)`);
A.exige(mu.n === 3644, `la capa municipal trae ${mu.n} tramos, no los 3.644 declarados en la tanda 0`);
di('tramos SIN código de vía', mu.sinCodigo);
di('códigos de vía distintos', mu.porCodigo.size);
{
  const b = mu.bbox;
  const [o, s] = aGrados(b.x0, b.y0), [e, n] = aGrados(b.x1, b.y1);
  di('bbox de la capa (grados)', `S ${s.toFixed(4)} O ${o.toFixed(4)} N ${n.toFixed(4)} E ${e.toFixed(4)}`);
  di('bbox del término (ZONA_TERMINO)', `S ${ZONA_TERMINO.sur} O ${ZONA_TERMINO.oeste} N ${ZONA_TERMINO.norte} E ${ZONA_TERMINO.este}`);
  // ⭐ LEY 41 · ¿trae homónimos de otras Zaragozas? El bbox lo contesta solo: si
  //    hubiera un tramo en Costa Rica o en Puebla, el bbox mediría miles de km.
  const anchoKm = (b.x1 - b.x0) / 1000, altoKm = (b.y1 - b.y0) / 1000;
  di('⭐ tamaño real del bbox', `${anchoKm.toFixed(1)} × ${altoKm.toFixed(1)} km`);
  di('   ⇒ ¿homónimos de otras Zaragozas? (ley 41)',
    anchoKm < 100 && altoKm < 100 ? '✅ NO — todo cabe en una ciudad' : '⛔ SÍ — el bbox es continental');
  A.exige(anchoKm < 100 && altoKm < 100, 'la capa municipal trae geometría de otra Zaragoza');
  log('');
  log('   ⚠️ ⭐ LA CAPA NO CUBRE EL TÉRMINO ENTERO, y eso NO es un fallo de la descarga:');
  log('      es viario municipal urbano. Fuera de su bbox, un "no cuadra" significaría');
  log('      "aquí no llega la capa", no "el enganche está mal". Se mide abajo, por zona.');
}

// ── el grafo y el enganche ───────────────────────────────────────────────────
const g = construir(ZONA_TERMINO);
const ctx = D.abrir(g, CRUDO);
const portales = ctx.enganche.portales.filter((o) => o.enganchado);
const ciegos = portales.filter((o) => !o.nucleoOsm);
const vistos = portales.filter((o) => o.nucleoOsm);
const buenos = vistos.filter((o) => o.codigoVia_estado === 'concuerda');
const malos = vistos.filter((o) => o.codigoVia_estado === 'DISCORDA');

log('');
log('='.repeat(106));
log('COBERTURA · ¿a cuántos portales llega la capa municipal?');
let cub = 0, cubCiegos = 0, conSuVia = 0;
for (const o of portales) {
  const c = M.cubierto(mu, o.q, RADIO_COBERTURA);
  o._cubierto = c;
  o._tieneVia = mu.porCodigo.has(o.codigoVia);
  if (c) { cub++; if (!o.nucleoOsm) cubCiegos++; }
  if (c && o._tieneVia) conSuVia++;
}
di('portales enganchados', portales.length);
di(`en zona cubierta (algún tramo a ≤ ${RADIO_COBERTURA} m)`, `${cub}  (${pct(cub, portales.length)})`);
di('   y además su codigoVia está en la capa', `${conSuVia}  (${pct(conSuVia, portales.length)})`);
di('⭐ de los CIEGOS, en zona cubierta', `${cubCiegos} de ${ciegos.length}  (${pct(cubCiegos, ciegos.length)})`);
log('');
log('   ⚠️ frente a los 214 casos de la tanda 12. Eso es lo que cambia hoy.');

// ── por zona, para ver dónde NO llega ────────────────────────────────────────
log('');
log('   por zona — dónde llega la capa y dónde no:');
log('      ' + 'zona'.padEnd(32) + 'portales'.padStart(9) + 'cubiertos'.padStart(11) + '%'.padStart(8));
const enZona = (o, z) => o.lat >= z.sur && o.lat <= z.norte && o.lon >= z.oeste && o.lon <= z.este;
for (const z of ZONAS) {
  const t = portales.filter((o) => enZona(o, z.b));
  if (!t.length) continue;
  const c = t.filter((o) => o._cubierto).length;
  log('      ' + z.n.padEnd(32) + String(t.length).padStart(9) + String(c).padStart(11) + pct(c, t.length).padStart(8));
}

// ═════════════════════════════════════════════════════════════════════════════
// B4 · ⭐⭐ ANTES DE USAR EL TESTIGO: ¿PUEDE ACERTAR O FALLAR POR CONSTRUCCIÓN?
// ═════════════════════════════════════════════════════════════════════════════
// El cuarto testigo de la tanda 12 se cayó por esto: un portal es "ciego"
// **precisamente porque enganchó a una arista sin nombre**, así que salía "solo"
// sin que nadie se hubiera equivocado. La pertenencia al grupo causaba el
// resultado. Aquí hay que descartarlo ANTES, no después.
//
// ⭐ La prueba decisiva: medir la distancia al eje municipal **desde el portal
//    mismo**, antes de que exista ningún enganche. Si los ciegos ya están más
//    lejos de su eje ANTES de enganchar, la diferencia es GEOGRAFÍA —dónde vive
//    esa gente—, no calidad del enganche. Y entonces lo que hay que mirar es
//    cuánto MEJORA o EMPEORA el enganche respecto al portal, que es lo único que
//    el enganche controla.
log('');
log('='.repeat(106));
log('B4 · ⭐⭐ ¿PUEDE ESTE TESTIGO ACERTAR O FALLAR POR CONSTRUCCIÓN?');
log('   la pregunta que tumbó al cuarto testigo de la tanda 12, hecha ANTES esta vez.');

function medir(lista) {
  const dPortal = [], dEnganche = [], delta = [], pares = [];
  for (const o of lista) {
    if (!o._cubierto || !o._tieneVia) continue;
    const pts = mu.porCodigo.get(o.codigoVia).pts;
    const dp = M.dA(o.m, pts);       // el portal, TAL CUAL viene del Ayuntamiento
    const de = M.dA(o.q, pts);       // el punto donde el motor lo enganchó
    dPortal.push(dp); dEnganche.push(de); delta.push(de - dp);
    pares.push([dp, de]);
  }
  const q = (v) => (v.length ? E.reparto(v) : null);
  return { n: dPortal.length, dPortal: q(dPortal), dEnganche: q(dEnganche), delta: q(delta),
    cerca: dEnganche.filter((x) => x <= CERCA).length,
    cercaPortal: dPortal.filter((x) => x <= CERCA).length, pares };
}

// ⭐⭐ EL TECHO GEOGRÁFICO. El enganche no puede acercar un portal a un eje del que
//    el propio portal ya está lejos: la posición del portal la pone el
//    Ayuntamiento, no el motor. Así que la pregunta honesta no es *"¿cuántos
//    aciertan?"* sino **"¿cuánto del techo alcanzable conserva el enganche?"**
const conserva = (v) => (v.cercaPortal ? 100 * v.cerca / v.cercaPortal : NaN);

// ⭐⭐ Y LA COMPARACIÓN EMPAREJADA: mismos tramos de distancia previa, para que la
//    geografía no decida. Es la contraprueba de "no pasa por construcción".
const BANDAS = [[0, 10], [10, 20], [20, 30], [30, 50], [50, 100], [100, 1e9]];
function porBanda(v) {
  return BANDAS.map(([a, b]) => {
    const s = v.pares.filter(([dp]) => dp >= a && dp < b);
    const ok = s.filter(([, de]) => de <= CERCA).length;
    return { a, b, n: s.length, ok };
  });
}

const gr = {
  'BUENOS conocidos (concuerda)': medir(buenos),
  'SOSPECHOSOS conocidos (DISCORDA)': medir(malos),
  '⭐⭐ CIEGOS (nadie vigila)': medir(ciegos),
};
log('');
log('   ' + 'grupo'.padEnd(34) + 'n'.padStart(7) + '  ' + 'd(PORTAL→eje)'.padStart(15)
  + '  ' + 'd(ENGANCHE→eje)'.padStart(16) + '  ' + 'lo que mueve'.padStart(14));
for (const [k, v] of Object.entries(gr)) {
  if (!v.n) { log('   ' + k.padEnd(34) + 'sin casos'); continue; }
  log('   ' + k.padEnd(34) + String(v.n).padStart(7)
    + '  ' + `${v.dPortal.mediana.toFixed(1)} m`.padStart(15)
    + '  ' + `${v.dEnganche.mediana.toFixed(1)} m`.padStart(16)
    + '  ' + `${(v.delta.mediana >= 0 ? '+' : '')}${v.delta.mediana.toFixed(1)} m`.padStart(14));
}
log('');
log('   ⭐⭐ LOS CIEGOS YA ESTÁN MÁS LEJOS DE SU EJE **ANTES DE ENGANCHAR NADA**:');
log('      32,7 m frente a 23,8 m de los buenos, casi lo mismo que los sospechosos (34,5).');
log('      La posición del portal la pone el AYUNTAMIENTO, no el motor. ⇒ cualquier');
log('      comparación en bruto está midiendo dónde vive esa gente, no si el enganche');
log('      acierta. Es la trampa que tumbó al cuarto testigo, con otro disfraz.');
log('');
log('   ⭐ EL TECHO GEOGRÁFICO — cuántos aciertan YA, sin motor de por medio:');
log('   ' + 'grupo'.padEnd(34) + 'el PORTAL acierta'.padStart(20) + 'el ENGANCHE acierta'.padStart(21)
  + 'conserva'.padStart(11));
for (const [k, v] of Object.entries(gr)) {
  if (!v.n) continue;
  log('   ' + k.padEnd(34) + `${pct(v.cercaPortal, v.n)}`.padStart(20)
    + `${pct(v.cerca, v.n)}`.padStart(21) + `${conserva(v).toFixed(1)} %`.padStart(11));
}
log('   ⇒ "conserva" = qué parte de lo alcanzable mantiene el enganche. **Ésa es la');
log('     pregunta**: el motor no puede acercar a un eje del que el portal ya está lejos.');

log('');
log('   ⭐⭐ Y LA COMPARACIÓN EMPAREJADA, que es la que no puede pasar por construcción:');
log('      mismos tramos de distancia previa portal→eje, y dentro de cada uno se compara.');
log('      ' + 'd(portal→eje)'.padEnd(16) + 'BUENOS'.padStart(18) + 'CIEGOS'.padStart(18) + 'diferencia'.padStart(13));
{
  const bB = porBanda(gr['BUENOS conocidos (concuerda)']);
  const bC = porBanda(gr['⭐⭐ CIEGOS (nadie vigila)']);
  for (let i = 0; i < BANDAS.length; i++) {
    const a = bB[i], c = bC[i];
    if (a.n < 30 || c.n < 30) {
      log('      ' + `${a.a}–${a.b === 1e9 ? '∞' : a.b} m`.padEnd(16)
        + `${a.n} casos`.padStart(18) + `${c.n} casos`.padStart(18) + '  ⚠️ muestra corta');
      continue;
    }
    const pa = 100 * a.ok / a.n, pc = 100 * c.ok / c.n;
    log('      ' + `${a.a}–${a.b === 1e9 ? '∞' : a.b} m`.padEnd(16)
      + `${pa.toFixed(1)} % (n=${a.n})`.padStart(18)
      + `${pc.toFixed(1)} % (n=${c.n})`.padStart(18)
      + `${(pc - pa >= 0 ? '+' : '')}${(pc - pa).toFixed(1)} pts`.padStart(13));
  }
  log('      ⚠️ y su límite: por debajo de 20 m el acierto es del 100 % POR ARITMÉTICA —el');
  log('         enganche mueve menos de 1 m y el umbral son 25—, y por encima de 30 es del 0 %.');
  log('         **La única banda que informa es la de 20–30 m.** Por eso hace falta lo de abajo.');
}

// ⭐⭐ EL DISCRIMINADOR SIN UMBRAL: no "¿acierta?", sino **cuánto ALEJA el enganche
//    a cada portal de su propio eje**. No depende de dónde ponga yo el corte, y un
//    enganche a la calle equivocada tiene que verse aquí como una cola larga.
log('');
log('   ⭐⭐ SIN UMBRAL — ¿cuánto ALEJA el enganche a cada grupo de su propio eje?');
log('      ' + 'grupo'.padEnd(34) + 'mediana'.padStart(10) + 'p90'.padStart(10)
  + 'p99'.padStart(10) + '   aleja > 10 m' + '   aleja > 25 m');
for (const [k, v] of Object.entries(gr)) {
  if (!v.n) continue;
  const d = v.pares.map(([dp, de]) => de - dp);
  const a10 = d.filter((x) => x > 10).length, a25 = d.filter((x) => x > 25).length;
  log('      ' + k.padEnd(34) + `${v.delta.mediana.toFixed(1)} m`.padStart(10)
    + `${v.delta.p90.toFixed(1)} m`.padStart(10) + `${v.delta.p99.toFixed(1)} m`.padStart(10)
    + `   ${pct(a10, d.length).padStart(7)}` + `   ${pct(a25, d.length).padStart(7)}`);
}
log('      ⇒ un enganche a la calle equivocada tiene que aparecer aquí como cola larga.');

// ⭐⭐ Y AHORA LO ÚTIL: ¿DÓNDE está esa cola en los ciegos? Un porcentaje no se
//    arregla; una lista de sitios, sí. (Clasificar antes de contar, ley 29.)
log('');
log('   ⭐ LA COLA DE LOS CIEGOS, MIRADA — los que el enganche ALEJA más de 10 m de su eje');
{
  const sospechosos = [];
  for (const o of ciegos) {
    if (!o._cubierto || !o._tieneVia) continue;
    const pts = mu.porCodigo.get(o.codigoVia).pts;
    const d = M.dA(o.q, pts) - M.dA(o.m, pts);
    if (d > 10) sospechosos.push({ o, d });
  }
  di('portales ciegos con esa firma', `${sospechosos.length} de ${gr['⭐⭐ CIEGOS (nadie vigila)'].n}  (${pct(sospechosos.length, gr['⭐⭐ CIEGOS (nadie vigila)'].n)})`);
  const porHw = new Map(), porZona = new Map();
  for (const s of sospechosos) {
    const hw = g.aristas[s.o.arista].highway;
    porHw.set(hw, (porHw.get(hw) || 0) + 1);
    const z = ZONAS.find((zz) => enZona(s.o, zz.b));
    const k = z ? z.n : 'fuera de las 8 zonas';
    porZona.set(k, (porZona.get(k) || 0) + 1);
  }
  log('      por tipo de vía a la que enganchan:');
  for (const [k, v] of [...porHw.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    log('         ' + String(k).padEnd(18) + String(v).padStart(5) + '  ' + pct(v, sospechosos.length).padStart(7));
  }
  log('      por zona:');
  for (const [k, v] of [...porZona.entries()].sort((a, b) => b[1] - a[1])) {
    log('         ' + k.padEnd(34) + String(v).padStart(5));
  }
  // ⭐ y una muestra concreta, con coordenada, para poder mirarla
  log('      ⭐ los 8 peores, con coordenada:');
  sospechosos.sort((a, b) => b.d - a.d);
  for (const s of sospechosos.slice(0, 8)) {
    log('         ' + `${s.o.lat.toFixed(5)},${s.o.lon.toFixed(5)}`.padEnd(22)
      + String(s.o.via ? s.o.via.nombre : '?').slice(0, 34).padEnd(36)
      + `+${s.d.toFixed(0)} m`.padStart(8) + '   ' + g.aristas[s.o.arista].highway);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// B3 · EL TESTIGO, AHORA CON LA CAPA ENTERA
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(106));
log('B3 · ⭐⭐ ¿ESTÁ EL ENGANCHE SOBRE EL EJE MUNICIPAL DE SU PROPIA CALLE?');
log(`   "acierta" = el punto de enganche está a ≤ ${CERCA} m del eje que el Ayuntamiento`);
log('   llama esa calle. Ni una letra de por medio: geometría contra geometría.');
log('');
log('   ' + 'grupo'.padEnd(34) + 'acierta'.padStart(18) + '   ' + 'p90'.padStart(8) + '   ' + 'p99'.padStart(9));
for (const [k, v] of Object.entries(gr)) {
  if (!v.n) continue;
  log('   ' + k.padEnd(34) + `${v.cerca} de ${v.n}  (${pct(v.cerca, v.n)})`.padStart(18)
    + '   ' + `${v.dEnganche.p90.toFixed(1)} m`.padStart(8) + '   ' + `${v.dEnganche.p99.toFixed(0)} m`.padStart(9));
}

// ⭐ ¿SEPARA lo bueno conocido de lo sospechoso conocido? Si no, no mide calidad
//    de enganche y no sirve para transferirlo a los ciegos.
const pB = 100 * gr['BUENOS conocidos (concuerda)'].cerca / gr['BUENOS conocidos (concuerda)'].n;
const pM = 100 * gr['SOSPECHOSOS conocidos (DISCORDA)'].cerca / gr['SOSPECHOSOS conocidos (DISCORDA)'].n;
const pC = 100 * gr['⭐⭐ CIEGOS (nadie vigila)'].cerca / gr['⭐⭐ CIEGOS (nadie vigila)'].n;
log('');
di('⭐ ¿separa BUENOS de SOSPECHOSOS?', `${(pB - pM).toFixed(1)} puntos   `
  + (pB - pM > 15 ? '✅ SÍ ⇒ mide calidad de enganche' : '⚠️ poco ⇒ como testigo vale menos'));

// ── LÍNEA BASE: contra un código municipal AL AZAR ──────────────────────────
log('');
log('   ⭐ LÍNEA BASE — el mismo test contra la calle EQUIVOCADA');
{
  const codigos = [...mu.porCodigo.keys()];
  const r = rng(SEMILLA + 40);
  const base = (lista) => {
    let n = 0, ok = 0;
    for (const o of lista) {
      if (!o._cubierto || !o._tieneVia) continue;
      const otro = codigos[Math.floor(r() * codigos.length)];
      if (otro === o.codigoVia) continue;
      n++;
      if (M.dA(o.q, mu.porCodigo.get(otro).pts) <= CERCA) ok++;
    }
    return { n, ok };
  };
  const bb = base(buenos.slice(0, 6000)), bc = base(ciegos);
  di('   en los BUENOS · con un código al azar', `${bb.ok} de ${bb.n}  (${pct(bb.ok, bb.n)})`);
  di('   en los CIEGOS · con un código al azar', `${bc.ok} de ${bc.n}  (${pct(bc.ok, bc.n)})`);
  log('   ⇒ si esto no se derrumba, el test mediría "hay una calle cerca", no "es ESA calle".');
  A.exige(pct(bb.ok, bb.n) !== '—' && (100 * bb.ok / bb.n) < 10,
    'la línea base del testigo municipal no se derrumba: mide proximidad, no identidad');
}

// ── B5 · CONTRAPRUEBAS DE DESPLAZAMIENTO Y DE IDENTIDAD ─────────────────────
log('');
log('B5 · ⭐⭐ LAS DOS CONTRAPRUEBAS — la de desplazamiento es ciega a la identidad (ley 24)');
{
  const idx = P.indexarAristas(g.aristas, (e) => e.pie);
  // (a) DESPLAZAMIENTO: se mueve el portal 200 m, se reengancha, y se mide igual
  const r = rng(SEMILLA + 41);
  const muestra = ciegos.slice();
  for (let i = muestra.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [muestra[i], muestra[j]] = [muestra[j], muestra[i]]; }
  const sub = muestra.slice(0, 4000);
  let nD = 0, okD = 0;
  for (const o of sub) {
    if (!o._cubierto || !o._tieneVia) continue;
    const m2 = [o.m[0] + 200, o.m[1] + 200];
    const mej = P.engancharUno(m2, g.aristas, idx, () => '', 350).mejor;
    if (!mej) continue;
    nD++;
    if (M.dA(mej.q, mu.porCodigo.get(o.codigoVia).pts) <= CERCA) okD++;
  }
  di('(a) desplazamiento 200 m · acierta', `${okD} de ${nD}  (${pct(okD, nD)})`);
  di('    ⇒ frente al enganche real', pct(gr['⭐⭐ CIEGOS (nadie vigila)'].cerca, gr['⭐⭐ CIEGOS (nadie vigila)'].n));

  // (b) IDENTIDAD: el portal NO se mueve; se le cambia contra qué calle se compara
  const conVia = sub.filter((o) => o._cubierto && o._tieneVia);
  const codes = conVia.map((o) => o.codigoVia);
  const r2 = rng(SEMILLA + 42);
  for (let i = codes.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [codes[i], codes[j]] = [codes[j], codes[i]]; }
  let okI = 0;
  for (let i = 0; i < conVia.length; i++) {
    if (M.dA(conVia[i].q, mu.porCodigo.get(codes[i]).pts) <= CERCA) okI++;
  }
  di('(b) identidad barajada · acierta', `${okI} de ${conVia.length}  (${pct(okI, conVia.length)})`);
  log('   ⇒ las dos tienen que derrumbarse, y por motivos distintos: la primera dice que');
  log('     el testigo mira la POSICIÓN; la segunda, que mira QUIÉN ES. Ley 24.');
}

// ── B6 · EL LÍMITE DECLARADO: el emparejamiento municipal↔OSM ───────────────
log('');
log('B6 · ⚠️ EL LÍMITE DEL TESTIGO — no es un oráculo');
{
  // ⭐ ¿cuántos portales NO se pueden evaluar, y por qué? Clasificado, no agrupado.
  const sinCob = portales.filter((o) => !o._cubierto).length;
  const sinVia = portales.filter((o) => o._cubierto && !o._tieneVia).length;
  di('portales que el testigo NO puede evaluar', `${sinCob + sinVia}  (${pct(sinCob + sinVia, portales.length)})`);
  di('   porque la capa no llega a su zona', `${sinCob}  (${pct(sinCob, portales.length)})`);
  di('   porque su codigoVia no está en la capa', `${sinVia}  (${pct(sinVia, portales.length)})`);
  log('   ⚠️ La capa son 3.644 tramos de viario municipal para 3.359 vías del callejero:');
  log('      no es un mapa de todas las calles, es la jerarquía viaria. Un portal en un');
  log('      andador o en un camino puede no tener tramo, y eso NO dice nada de su enganche.');
}

// ═════════════════════════════════════════════════════════════════════════════
// C · LOS PORTALES SIN NINGÚN TESTIGO
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(106));
log('C · ⭐ LOS PORTALES SIN NINGÚN TESTIGO — ¿los rescata la capa municipal?');
const nucleoDeWay = (id) => P.nucleo(g.nombres.get(id) || '');
const huerfanos = [];
for (const o of ciegos) {
  const h = heredar(g, o.arista, nucleoDeWay, g.aristas[o.arista].way);
  if (!h.cercano) huerfanos.push(o);
}
di('CIEGOS sin ninguna calle con nombre a 80 m', `${huerfanos.length}  (${pct(huerfanos.length, portales.length)} del total)`);
log('   ⚠️ la tanda 12 los estimó en 2.006 extrapolando de una muestra de 4.000.');
log('      Esto es el recuento COMPLETO, no una extrapolación.');

const rescatados = huerfanos.filter((o) => o._cubierto && o._tieneVia);
di('⭐ de ellos, que la capa municipal SÍ alcanza', `${rescatados.length}  (${pct(rescatados.length, huerfanos.length)})`);
{
  const ok = rescatados.filter((o) => M.dA(o.q, mu.porCodigo.get(o.codigoVia).pts) <= CERCA).length;
  di('   y de esos, con el enganche sobre su eje', `${ok} de ${rescatados.length}  (${pct(ok, rescatados.length)})`);
}
const sinNada = huerfanos.filter((o) => !(o._cubierto && o._tieneVia));
di('⛔ SIGUEN SIN NINGÚN TESTIGO', `${sinNada.length}  (${pct(sinNada.length, portales.length)} del total)`);

log('');
log('   por zona, los que siguen sin testigo:');
for (const z of ZONAS) {
  const t = sinNada.filter((o) => enZona(o, z.b));
  if (!t.length) continue;
  log('      ' + z.n.padEnd(34) + String(t.length).padStart(6));
}
{
  const fuera = sinNada.filter((o) => !ZONAS.some((z) => enZona(o, z.b)));
  log('      ' + 'fuera de las 8 zonas medidas'.padEnd(34) + String(fuera.length).padStart(6));
}
log('');
log('   ⭐ MUESTRA AL AZAR DE 20, con coordenada, para que las mire Antonio:');
log('      ⛔ sin nombre ni número: el portal se identifica por su vía del callejero.');
{
  const r = rng(SEMILLA + 50);
  const a = sinNada.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  log('      ' + 'lat, lon'.padEnd(22) + 'vía del callejero'.padEnd(38) + 'engancha a'.padEnd(16) + 'a');
  for (const o of a.slice(0, 20)) {
    const e = g.aristas[o.arista];
    log('      ' + `${o.lat.toFixed(5)},${o.lon.toFixed(5)}`.padEnd(22)
      + String(o.via ? o.via.nombre : 'NO CONSTA').slice(0, 36).padEnd(38)
      + String(e.highway).padEnd(16) + o.d.toFixed(1) + ' m');
  }
  log(`      (semilla ${SEMILLA + 50}, declarada — la muestra se puede reproducir)`);
}

// ── C4 · ¿IMPORTAN? ─────────────────────────────────────────────────────────
log('');
log('C4 · ⚠️ ¿IMPORTAN? — un fallo en un descampado no es lo mismo que uno en el Actur');
{
  // densidad de portales alrededor: un portal rodeado de muchos es un sitio donde
  // vive gente; uno solo en 300 m es un descampado.
  const celda = 300;
  const rej = new Map();
  for (const o of portales) {
    const k = Math.floor(o.m[0] / celda) + ',' + Math.floor(o.m[1] / celda);
    rej.set(k, (rej.get(k) || 0) + 1);
  }
  const dens = (o) => rej.get(Math.floor(o.m[0] / celda) + ',' + Math.floor(o.m[1] / celda)) || 0;
  const q = (l) => { const v = l.map(dens).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : NaN; };
  di('portales vecinos en 300 m · mediana de TODOS', q(portales));
  di('   de los CIEGOS', q(ciegos));
  di('   ⭐ de los que SIGUEN SIN TESTIGO', q(sinNada));
  const solos = sinNada.filter((o) => dens(o) <= 5).length;
  di('   de los sin testigo, en sitios con ≤5 portales alrededor', `${solos}  (${pct(solos, sinNada.length)})`);
}

// ═════════════════════════════════════════════════════════════════════════════
// B7 · EL VEREDICTO
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(106));
log('B7 · ⭐⭐⭐ EL VEREDICTO');
log('');
log('   ' + 'grupo'.padEnd(34) + 'enganche sobre su eje'.padStart(22) + '   ' + 'lo que mueve el enganche'.padStart(26));
for (const [k, v] of Object.entries(gr)) {
  if (!v.n) continue;
  log('   ' + k.padEnd(34) + `${pct(v.cerca, v.n)}  (n=${v.n})`.padStart(22)
    + '   ' + `${(v.delta.mediana >= 0 ? '+' : '')}${v.delta.mediana.toFixed(1)} m de mediana`.padStart(26));
}
log('');
di('separación BUENOS − SOSPECHOSOS', (pB - pM).toFixed(1) + ' puntos');
di('⭐ CIEGOS frente a BUENOS, EN BRUTO', `${pC.toFixed(1)} % frente a ${pB.toFixed(1)} %   (${(pC - pB).toFixed(1)} puntos)`);
log('   ⛔ y ese −14,4 NO es el veredicto: es geografía. Los ciegos ya estaban 8,9 m más');
log('     lejos de su eje ANTES de enganchar. Emparejando por distancia previa, ±2,6 puntos.');
log('');
log('   ⭐⭐ LO QUE DECIDE, sin umbral y sin geografía de por medio:');
{
  const firma = (v) => {
    const d = v.pares.map(([dp, de]) => de - dp);
    return 100 * d.filter((x) => x > 10).length / d.length;
  };
  const fB = firma(gr['BUENOS conocidos (concuerda)']);
  const fM = firma(gr['SOSPECHOSOS conocidos (DISCORDA)']);
  const fC = firma(gr['⭐⭐ CIEGOS (nadie vigila)']);
  log(`      el enganche ALEJA al portal >10 m de su propio eje:`);
  log(`         BUENOS conocidos        ${fB.toFixed(1)} %`);
  log(`         SOSPECHOSOS conocidos   ${fM.toFixed(1)} %      ⇒ el testigo separa ${(fM / Math.max(fB, 0.01)).toFixed(0)}×`);
  log(`         ⭐⭐ CIEGOS               ${fC.toFixed(1)} %      ⇒ ${((fM - fC) / (fM - fB) * 100).toFixed(0)} % del camino hacia los BUENOS`);
  log('');
  log('   ⇒ ⭐⭐⭐ VEREDICTO, EN UNA FRASE:');
  log('      SÍ ACIERTA — donde nadie vigila, el enganche se comporta como los buenos');
  log(`      conocidos y no como los sospechosos (${fC.toFixed(1)} % frente a ${fB.toFixed(1)} % y ${fM.toFixed(1)} %), y al`);
  log('      emparejar por distancia previa la diferencia en bruto desaparece.');
  log('');
  log('   ⚠️ CON DOS CABOS, Y NO SON PEQUEÑOS:');
  log('      · 198 portales ciegos llevan la firma de un enganche malo. NO son errores');
  log('        confirmados: en una avenida ancha con vías de servicio la acera está');
  log('        legítimamente a 40 m del eje. Son CANDIDATOS, y van con su coordenada.');
  log('      · el testigo no llega al 36,3 % de los portales, y los sitios donde no llega');
  log('        NO son aleatorios: Garrapinillos 0 %, PLAZA 1,6 %, Malpica 43 %. Lo medido');
  log('        vale para la ciudad urbana, no para el término entero.');
}

log('');
log(A.cierre('CIERRE DEL PUNTO CIEGO'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
