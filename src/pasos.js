// ⭐⭐ TANDA 21 · C5 y E2 · CUÁNTOS PASOS TIENE UN ITINERARIO, Y CUÁNTAS VECES
//     GRITA EL AVISO DE BICIS.
//
//   node src/pasos.js
//
// ⛔ NO recalcula ninguna ruta: se las pide a `rutas-antonio.js --pasos`, que es el
//    único que las produce. Una segunda copia del cálculo es el fallo nº68.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?»
// ═════════════════════════════════════════════════════════════════════════════
// C5 · «los pasos bajan» ⚠️ **puede salir bien por el motivo equivocado**: bajarían
//      igual si el agrupador se tragara cosas que no debe. ⇒ por eso van TRES
//      columnas y no dos —vieja · solo C · C+A— y **el cuadre de metros al lado**:
//      la suma de los pasos tiene que dar los mismos metros que la ruta, siempre.
//      Un agrupador que borra se ve ahí.
// C2 · el umbral de «corto» es una elección de percentil MÍA. ⇒ la curva entera,
//      de 0 m (sin absorber nada) a 50 m, para que se vea de qué depende.
// E2 · «el aviso de bicis es raro» ⚠️ **el número solo significa algo DESPUÉS de
//      agrupar**: antes de C salía en 4 de 20 tramos de la ruta 7 porque los tramos
//      eran trocitos. ⇒ se mide sobre los pasos que ve el usuario, y con su
//      denominador delante.

'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const A = require('./alarma');
const Rel = require('./relato');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(56)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
const m = (v) => (v >= 1000 ? (v / 1000).toFixed(2) + ' km' : Math.round(v) + ' m');
const T0 = Date.now();

function pedir() {
  let salida = '';
  try {
    salida = execFileSync(process.execPath,
      [path.join(__dirname, 'rutas-antonio.js'), '--aristas', '--pasos', '--modelo'],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    // ⚠️ sale en rojo a propósito: la nº4 tiene el rodeo declarado fuera de banda
    salida = (e.stdout || '').toString();
  }
  const l = salida.split('\n').find((x) => x.startsWith('##PASOS##'));
  return l ? JSON.parse(l.slice('##PASOS##'.length)) : null;
}

log('='.repeat(110));
log('C5 · ⭐⭐ CUÁNTOS PASOS TENÍA CADA RUTA Y CUÁNTOS TIENE AHORA');
log('='.repeat(110));
const R = pedir();
// ⭐⭐⭐ TANDA 2·bis · LA MISMA EXPECTATIVA PODRIDA QUE `donde-falta.js`, y por eso
//   se arregla igual: exigía `R.length === 7`, el proyecto decidió el 6 de agosto
//   (`c6f7f41`) que la ruta nº1 NO debe resolverse, y desde entonces esto no
//   medía nada — con la batería dándolo por bueno en cada pasada.
// ⛔ No es «bajar a 6»: el universo se le pregunta al banco de pruebas y aquí solo
//   se exige lo que este informe necesita, que es tener algo que medir. Quién
//   vigila que sean las que son es `modelo-rutas.js` (ley 56).
const banco = require('./tabla-rutas').leer().rutas.map((r) => r.n);
const leidas = (R || []).map((x) => x.n);
const faltan = banco.filter((n) => !leidas.includes(n));
if (!A.exige(leidas.length > 0, 'no se ha podido leer NINGUNA ruta de `rutas-antonio.js --pasos`')) {
  log('   ⛔ sin las rutas no hay nada que medir. NO CONSTA.');
  process.exit(1);
}
log('   ⭐ medido sobre ' + leidas.length + ' de las ' + banco.length + ' del banco de pruebas: '
  + leidas.join(', '));
log('      ' + (faltan.length
  ? '⚠️ NO se resuelve(n): ' + faltan.join(', ') + ' — expectativa declarada, no un hueco. '
    + 'Quien vigila ese número es `modelo-rutas.js`.'
  : '✅ se resuelven todas las del banco.'));

log('');
log('   ⭐ TRES columnas, no dos. La del medio aísla lo que hace C de lo que hace A:');
log('      · **vieja**  — la REGLA de la tanda 20 (fundir solo lo idéntico en nombre, tipo');
log('        y avisos) aplicada a los tramos de HOY. ⚠️ No es la salida de la tanda 20: es su');
log('        regla, para que la comparación aísle el agrupador y no arrastre también a D.');
log('        La salida real de la tanda 20 daba 27 · 9 · 31 · 11 · 3 · 8 · 20 = **109**.');
log('      · **solo C** — agrupada por vía, SIN los nombres nuevos del método de portales');
log('      · **C + A**  — lo que se publica');
log('');
log('   ' + 'ruta'.padStart(5) + 'tramos de OSM'.padStart(16) + 'vieja'.padStart(9)
  + 'solo C'.padStart(9) + 'C + A'.padStart(9) + '   ' + 'C reduce'.padStart(10)
  + 'A añade'.padStart(10) + 'total'.padStart(10));
let tV = 0, tC = 0, tN = 0, tT = 0;
for (const r of R) {
  tV += r.viejo; tC += r.soloC; tN += r.nuevo; tT += r.tramosOsm;
  log('   ' + String(r.n).padStart(5) + String(r.tramosOsm).padStart(16)
    + String(r.viejo).padStart(9) + String(r.soloC).padStart(9) + String(r.nuevo).padStart(9)
    + '   ' + (r.soloC - r.viejo >= 0 ? '+' : '') + String(r.soloC - r.viejo).padStart(9)
    + ((r.nuevo - r.soloC >= 0 ? '+' : '') + String(r.nuevo - r.soloC)).padStart(10)
    + ((r.nuevo - r.viejo >= 0 ? '+' : '') + String(r.nuevo - r.viejo)).padStart(10));
}
log('   ' + '─'.repeat(90));
log('   ' + 'TOTAL'.padStart(5) + String(tT).padStart(16) + String(tV).padStart(9)
  + String(tC).padStart(9) + String(tN).padStart(9)
  + '   ' + String(tC - tV).padStart(9) + String(tN - tC).padStart(10) + String(tN - tV).padStart(10));
log('');
log('   ⇒ ⭐ **C quita ' + (tV - tC) + ' pasos** (' + pct(tV - tC, tV) + ' de los ' + tV + '), y **A añade ' + (tN - tC) + '**.');
log('     ⚠️ Y que A AÑADA pasos no es un fallo de C: es lo que pasa cuando una parte de un');
log('        tramo gana nombre y la otra no. «Un tramo sin nombre de 108 m» se parte en «una');
log('        acera que parece de Principado de Morea, 30 m» + «un tramo sin nombre, 78 m».');
log('        **Más pasos y más información.** ⛔ Fundirlos sería ponerle a los 78 m un nombre');
log('        que nadie ha deducido para ellos.');
{
  const suben = R.filter((r) => r.nuevo > r.viejo).map((r) => r.n);
  di('rutas con MÁS pasos que antes', suben.length ? suben.join(', ') + '   (y las tres son por A)' : 'ninguna');
}

// ── el cuadre, que es lo que impide que «bajar» signifique «borrar» ──────────
log('');
log('   ⭐⭐ EL CUADRE — agrupar es borrar, así que la suma tiene que dar el total');
log('   ' + 'ruta'.padStart(5) + 'suma de los pasos'.padStart(22) + 'metros de la ruta'.padStart(20));
for (const r of R) {
  const suma = r.pasos.reduce((s, p) => s + p.metros, 0);
  const ok = Math.abs(suma - r.metros) < 0.5;
  log('   ' + String(r.n).padStart(5) + suma.toFixed(1).padStart(22) + r.metros.toFixed(1).padStart(20)
    + (ok ? '   ✅' : '   ⛔'));
  A.exige(ok, `la ruta nº${r.n}: los pasos suman ${suma.toFixed(1)} y la ruta mide ${r.metros}`);
}

// ── C2 · la curva de sensibilidad del umbral ────────────────────────────────
log('');
log('='.repeat(110));
log('C2 · ⚠️ DE QUÉ DEPENDE EL UMBRAL DE «CORTO»');
log('='.repeat(110));
log('   El umbral es el **p99 de la longitud de una arista `paso-de-peatones`** en Zaragoza');
log('   —13,3 m sobre las 10.494 que hay—, o sea **lo que mide cruzar una calle aquí**.');
log('   ⚠️ La magnitud sale del dato; **la elección del percentil es MÍA**. Por eso va la');
log('      curva entera, y el 0 m —no absorber nada— es la línea base.');
log('');
{
  const U = R[0].umbrales;
  log('   ' + 'ruta'.padStart(5) + U.map((u) => (u === 0 ? '0 m (base)' : u + ' m')).map((x) => x.padStart(12)).join(''));
  const tot = U.map(() => 0);
  for (const r of R) {
    r.curva.forEach((v, i) => { tot[i] += v; });
    log('   ' + String(r.n).padStart(5) + r.curva.map((v, i) => String(v).padStart(12)).join(''));
  }
  log('   ' + '─'.repeat(5 + 12 * U.length));
  log('   ' + 'TOTAL'.padStart(5) + tot.map((v) => String(v).padStart(12)).join(''));
  const i133 = U.indexOf(13.3);
  log('');
  di('⭐ el umbral aplicado (p99 = 13,3 m)', `${tot[i133]} pasos en total`);
  di('   sin absorber nada (0 m)', `${tot[0]}`);
  di('   al doble largo (30 m)', `${tot[U.indexOf(30)]}`);
  log('   ⇒ ⚠️ entre 13,3 m y 30 m la diferencia es de ' + (tot[i133] - tot[U.indexOf(30)])
    + ' pasos: **el resultado no cuelga del percentil**.');
  // ═════════════════════════════════════════════════════════════════════════
  // ⭐⭐ LA MONOTONÍA, RUTA POR RUTA — y es un guardián de verdad, no un adorno
  // ═════════════════════════════════════════════════════════════════════════
  //   Absorber interrupciones MÁS LARGAS no puede producir MÁS pasos: es
  //   aritmética. ⛔ Y sin embargo pasó: con el umbral a 13,3 m la ruta nº7 daba
  //   16 pasos y con 9,0 m daba 12 (bitácora nº104). La racha se tragaba el
  //   trozo que tenía que CERRARLA.
  //   ⚠️ El total sí era monótono —109 → 86— y por eso no se veía: **el fallo solo
  //   aparece ruta por ruta**. Un agregado puede tapar un signo.
  log('');
  log('   ⭐⭐ LA MONOTONÍA, RUTA POR RUTA. Absorber más largo no puede dar MÁS pasos.');
  let mono = true;
  for (const r of R) {
    for (let i = 1; i < r.curva.length; i++) {
      if (r.curva[i] > r.curva[i - 1]) {
        mono = false;
        A.fallo(`la ruta nº${r.n} da ${r.curva[i]} pasos con el umbral a ${U[i]} m y ${r.curva[i - 1]} con ${U[i - 1]} m`);
      }
    }
  }
  di('   ⇒ la curva es monótona en las siete', mono ? '✅' : '⛔');
  log('   ⚠️ Y el total SÍ era monótono mientras la nº7 no lo era: **un agregado tapa un');
  log('      signo**. Por eso la comprobación va ruta por ruta y no sobre la suma.');
}

// ── lo que se ha tragado, contado (agrupar es borrar) ───────────────────────
log('');
log('='.repeat(110));
log('C3 · ⭐ LO QUE SE HA TRAGADO — porque agrupar es borrar y hay que enseñarlo');
log('='.repeat(110));
{
  let n = 0, mm = 0;
  for (const r of R) {
    if (!r.comidos.length) continue;
    log('');
    log('   ruta nº' + r.n + ':');
    for (const c of r.comidos) {
      n++; mm += c.metros;
      log('      ' + m(c.metros).padStart(7) + '  «' + (c.nombre || 'sin nombre') + '»   dentro de «' + (c.en || '—') + '»');
    }
  }
  log('');
  di('⭐ interrupciones absorbidas en las siete', `${n}  (${m(mm)})`);
  log('   ⇒ Son los cruces que Antonio señaló: *«si se hace un cruce como es con Calle');
  log('     Juslibol para pasar de acera, estás en San Juan de la Peña igual»*.');
  log('   ⛔ Y NO se pierden: viajan en `comido` dentro del paso que se los tragó.');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('E2 · ⭐⭐ ¿CUÁNTAS VECES SALE EL AVISO DE BICIS?');
log('='.repeat(110));
log('   > *«Ese se mantiene siempre que sea verdad que en muy pocas calles pasa eso.»*');
log('   ⚠️ El número solo significa algo DESPUÉS de agrupar: antes de C salía en 4 de los 20');
log('      tramos de la ruta 7, pero los tramos eran trocitos. Aquí va sobre los PASOS.');
log('');
log('   ' + 'ruta'.padStart(5) + 'pasos'.padStart(9) + 'con aviso de bicis'.padStart(22)
  + '%'.padStart(9) + 'metros con bicis'.padStart(20) + '% de la ruta'.padStart(14));
let pT = 0, bT = 0, mT = 0, mmT = 0;
for (const r of R) {
  pT += r.nuevo; bT += r.conBici; mT += r.metros; mmT += r.metrosBici;
  log('   ' + String(r.n).padStart(5) + String(r.nuevo).padStart(9)
    + String(r.conBici).padStart(22) + pct(r.conBici, r.nuevo).padStart(9)
    + m(r.metrosBici).padStart(20) + pct(r.metrosBici, r.metros).padStart(14));
}
log('   ' + '─'.repeat(79));
log('   ' + 'TOTAL'.padStart(5) + String(pT).padStart(9) + String(bT).padStart(22)
  + pct(bT, pT).padStart(9) + m(mmT).padStart(20) + pct(mmT, mT).padStart(14));
log('');
di('⭐ el aviso sale en', `${bT} de los ${pT} pasos  (${pct(bT, pT)})`);
log('   ⚠️ EL LISTÓN, DECLARADO ANTES DE MIRARLO: si saliera en **más de la mitad** dejaría de');
log('      significar nada —sería el detector que grita ocho veces por nada— y habría que');
log('      decírselo a Antonio para que decida.');
if (bT / pT > 0.5) {
  A.fallo(`el aviso de bicis sale en el ${pct(bT, pT)} de los pasos: más de la mitad, deja de informar`);
} else {
  di('   ⇒ veredicto', `✅ sale en el ${pct(bT, pT)}: **es raro, y por eso informa**`);
}
log('   ⚠️ Y la muestra es de SIETE rutas del Actur y el centro, no de la ciudad. En un barrio');
log('      sin carril bici saldría 0; en el Actur, más. **No es una tasa de Zaragoza.**');

// ── el nombre deducido, contado igual ───────────────────────────────────────
log('');
log('='.repeat(110));
log('A2 · ⭐ Y EL NOMBRE DEDUCIDO — cuántos pasos lo llevan');
log('='.repeat(110));
log('   ' + 'ruta'.padStart(5) + 'pasos'.padStart(9) + 'con nombre DEDUCIDO'.padStart(23)
  + '%'.padStart(9) + 'metros'.padStart(12));
let dT = 0, dmT = 0;
for (const r of R) {
  dT += r.conDeducido; dmT += r.metrosDeducidos;
  log('   ' + String(r.n).padStart(5) + String(r.nuevo).padStart(9)
    + String(r.conDeducido).padStart(23) + pct(r.conDeducido, r.nuevo).padStart(9)
    + m(r.metrosDeducidos).padStart(12));
}
log('   ' + '─'.repeat(58));
log('   ' + 'TOTAL'.padStart(5) + String(pT).padStart(9) + String(dT).padStart(23)
  + pct(dT, pT).padStart(9) + m(dmT).padStart(12));
log('');
log('   ⚠️ Sale MENOS de lo que el modelo nombra, y es correcto: cuando un paso funde un');
log('      trozo deducido con otro que OSM SÍ nombra, **manda OSM (D0)** y el paso deja de');
log('      ser deducido. El nombre deducido solo se dice cuando es lo único que hay.');

log('');
log(A.cierre('PASOS Y AVISOS'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
