// ⭐⭐⭐ TANDA 9 · EL GUARDIÁN DE VIGENCIA DEL FEED — Y VIVE AQUÍ A PROPÓSITO
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ ESTE FICHERO ESTÁ EN `src/` Y NO EN `tools/`
// ═════════════════════════════════════════════════════════════════════════════
//   La lógica vive en `tools/gtfs/vigencia.js`, que es donde le corresponde. Pero
//   **`src/probar-paradas.js:217` solo ejecuta los `.js` de `src/`** — `tools/`
//   está fuera del universo de la batería (ley 142). ⇒ Un guardián de caducidad
//   metido en `tools/` **es un guardián que nadie corre nunca**, y el 6 de octubre
//   de 2026 seguiría sin enterarse nadie. Aquí sí lo corre la batería.
//
//   ⛔ Es el mismo motivo por el que la prueba de «la misma arista» vive en `src/`:
//     un guardián fuera de la batería es una promesa.
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ HACE, Y QUÉ NO
// ═════════════════════════════════════════════════════════════════════════════
//   · Compara la fecha de HOY con el `feed_end_date` del GTFS. **Ese es el
//     guardián que faltaba**: el que ya había comprobaba que la fecha VIAJARA
//     dentro del artefacto, no que no hubiera pasado (ley 163).
//   · ⛔ FALLA solo en `fuera-del-periodo-declarado`. `se-acaba` avisa y no falla:
//     el dato sigue siendo el bueno, y un rojo de treinta días enseña a ignorarlo.
//   · ⚠️ **Su veredicto depende del reloj del sistema**, así que se coteja el
//     reloj con la fecha del propio ZIP y se avisa si va por detrás.
//   · ⚠️ Y si el dato no está —un clon recién hecho no lo trae, y eso está
//     declarado en el README— **no se estrella ni falla: dice NO CONSTA.** Un
//     guardián que revienta donde no hay dato es un guardián que hay que apagar.
//
//   node src/probar-vigencia.js
//   node src/probar-vigencia.js --hoy 20261006     ⭐ para verlo en rojo

'use strict';
const fs = require('fs');
const A = require('./alarma');

const log = console.log;
const di = (k, v) => log('   ' + String(k).padEnd(50) + ' ' + v);

log('='.repeat(100));
log('EL GUARDIÁN DE VIGENCIA DEL FEED — ¿ha pasado la fecha, no solo está la fecha?');
log('='.repeat(100));

let V, F;
try {
  V = require('../tools/gtfs/vigencia');
  F = require('../tools/gtfs/feed');
} catch (e) {
  di('⚠️ NO CONSTA', 'no se encuentran las herramientas del GTFS: ' + e.message);
  process.exit(0);
}

if (!fs.existsSync(F.RUTA_FEED)) {
  // ⛔ NO es un fallo: el dato no viaja en el repositorio, y está dicho en el
  //    README. Un clon recién hecho llega aquí y tiene que pasar de largo.
  di('⚠️ NO CONSTA', 'el GTFS no está descargado — el dato no viaja en el repositorio');
  di('   cómo se consigue', 'node tools/bajar-gtfs.js');
  log('');
  log(A.cierre('LA VIGENCIA DEL FEED'));
  process.exit(0);
}

const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const hoyArg = arg('--hoy');
const HOY = hoyArg || new Date().toISOString().slice(0, 10).replace(/-/g, '');

const fi = F.tabla(F.abrirZip()['feed_info.txt'])[0];
di('feed_version', fi.feed_version);
di('periodo declarado por el editor', fi.feed_start_date + ' – ' + fi.feed_end_date);
di('fecha de referencia', HOY + (hoyArg ? '   ⚠️ FORZADA con --hoy' : '   (el reloj del sistema)'));

// ⭐ el cotejo del reloj: si va por DETRÁS de la fecha del fichero descargado,
//   está mal puesto — y ése es el sentido del error que produce un falso «vigente».
const mtime = fs.statSync(F.RUTA_FEED).mtime.toISOString().slice(0, 10).replace(/-/g, '');
const relojAtras = HOY < mtime;
di('el ZIP se descargó el', mtime);
di('⇒ ¿el reloj va por detrás del fichero?', relojAtras
  ? '⛔ SÍ — el reloj está mal puesto y el veredicto NO VALE' : '✅ no');
if (!hoyArg) {
  A.exige(!relojAtras, 'el reloj del sistema es anterior a la fecha del ZIP descargado: está mal '
    + 'puesto, y con él un feed caducado puede salir vigente');
}

const v = V.vigencia(fi.feed_start_date, fi.feed_end_date, HOY);
log('');
di('estado', v.estado);
di('días hasta el fin del periodo', v.quedan === undefined ? 'NO CONSTA' : v.quedan);
log('');
log('   ⭐ EL AVISO, TAL COMO TIENE QUE VERLO QUIEN CONSULTA:');
log('      ' + (v.dice || v.motivo));

// ⛔ el guardián que faltaba
A.exige(!V.esFallo(v.estado), `el feed está en estado «${v.estado}»: ${v.dice || v.motivo}`);

// ⭐⭐ LEY 156 · y que se vea que sabe ponerse rojo, en la MISMA ejecución. Sin
//   esto, el verde de hoy es indistinguible de un guardián que no mira nada.
log('');
log('   ⭐⭐ LA PROVOCACIÓN, en la misma ejecución — ¿sabe este guardián ponerse rojo?');
for (const d of ['20261005', '20261006', '20261231']) {
  const r = V.vigencia(fi.feed_start_date, fi.feed_end_date, d);
  log('      con la fecha ' + d + ' ⇒ ' + r.estado.padEnd(30)
    + (V.esFallo(r.estado) ? '⛔ SERÍA FALLO' : '✅ pasaría'));
}
const provocado = V.esFallo(V.vigencia(fi.feed_start_date, fi.feed_end_date, '20261006').estado);
A.exige(provocado, 'el guardián no se pone rojo ni con una fecha posterior al fin del periodo: '
  + 'su verde de hoy no vale nada');
di('   ⇒ sabe ponerse rojo', provocado ? '✅ sí, y se ha visto arriba' : '⛔ NO');

log('');
log(A.cierre('LA VIGENCIA DEL FEED'));
