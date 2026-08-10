// ⭐⭐⭐ LA PRUEBA DEL PUENTE DE IDENTIDAD — Y NACE ROJA A PROPÓSITO.
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ RESULTADO HARÍA FALLAR ESTA COMPROBACIÓN (ley 147)
// ═════════════════════════════════════════════════════════════════════════════
//   Se puede contestar, y por eso es una comprobación y no un adorno:
//     · que alguna de las 50 paradas del tranvía devuelva un número
//     · que el recuento deje de ser 934 con poste y 50 sin él
//     · que dos paradas distintas compartan número de poste
//
//   Y se DEMUESTRA que sabe fallar, no se promete: con `--formula=003` se mete
//   la fórmula que 003 publica en su documento y la prueba se pone roja sola,
//   con las 24 paradas del tranvía colapsadas al poste 1 impresas al lado.
//
//       node tools/gtfs/probar-identidad.js --formula=003    ⛔ ROJO, código 1
//       node tools/gtfs/probar-identidad.js                  ✅ VERDE, código 0
//
// ⚠️ ESTE FICHERO VIVE EN `tools/`, NO EN `src/`, y no es un descuido: `src/` es
//    el universo de la batería, y un invariante del proyecto no puede depender
//    de que exista un ZIP de exploración en el disco. Lo que aquí se comprueba
//    es el COCINADO del feed, no el motor.

'use strict';

const A = require('../../src/alarma');
const { cargar } = require('./feed');
const { posteDeAvanza, posteSegunLaFraseDe003 } = require('./identidad');

const usar003 = process.argv.includes('--formula=003');
const poste = usar003 ? posteSegunLaFraseDe003 : posteDeAvanza;

const log = (s) => process.stdout.write(s + '\n');
const raya = () => log('='.repeat(100));

raya();
log('PRUEBA DEL PUENTE DE IDENTIDAD — ' + (usar003
  ? '⛔ CON LA FÓRMULA QUE 003 PUBLICA (int(stop_code[2:])) · SE ESPERA ROJO'
  : '✅ CON LA FÓRMULA DE 004 (/^PA(\\d{5})$/)'));
raya();

const { stops, modo } = cargar();
const bus = stops.filter((s) => modo.get(s.stop_id) === 'bus');
const tranvia = stops.filter((s) => modo.get(s.stop_id) === 'tranvia');

log('   paradas en el feed ....................... ' + stops.length);
log('   de bus ................................... ' + bus.length);
log('   de tranvía ............................... ' + tranvia.length);
log('');

// ── P1 · el tranvía NO tiene poste. Es la que caza la fórmula mala ───────────
const tranviaConPoste = tranvia.filter((s) => poste(s.stop_code) !== null);
log('P1 · ⭐⭐⭐ LAS 50 DEL TRANVÍA NO PUEDEN TENER NÚMERO DE POSTE');
log('   con poste (deberían ser 0) ............... ' + tranviaConPoste.length);
if (tranviaConPoste.length) {
  const porNumero = new Map();
  for (const s of tranviaConPoste) {
    const n = poste(s.stop_code);
    if (!porNumero.has(n)) porNumero.set(n, []);
    porNumero.get(n).push(s);
  }
  const colisiones = [...porNumero.entries()].filter(([, a]) => a.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  log('   ⛔ y de ellas, cuántas comparten número:');
  for (const [n, a] of colisiones.slice(0, 3)) {
    log('      poste ' + String(n).padStart(4) + ' ×' + a.length + '   '
      + a.slice(0, 5).map((s) => '"' + s.stop_code + '" ' + s.stop_name.slice(0, 22)).join(' · '));
  }
}
A.exige(tranviaConPoste.length === 0,
  `${tranviaConPoste.length} paradas de tranvía han recibido número de poste. `
  + 'El tranvía NO tiene poste de Avanza: si la fórmula le da uno, está inventándoselo.');

// ── P2 · el recuento, que es la otra mitad de la valla ───────────────────────
const busConPoste = bus.filter((s) => poste(s.stop_code) !== null);
log('');
log('P2 · EL RECUENTO — 934 con poste y 50 sin él');
log('   de bus, con poste ........................ ' + busConPoste.length + ' de ' + bus.length);
A.exige(busConPoste.length === bus.length,
  `${bus.length - busConPoste.length} paradas de BUS se han quedado sin poste. `
  + 'El convenio medido es 934 de 934: si alguna falla, o el feed cambió o la forma está mal.');

// ── P3 · dos paradas no pueden compartir poste ───────────────────────────────
const dueño = new Map();
const choques = [];
for (const s of stops) {
  const n = poste(s.stop_code);
  if (n === null) continue;
  if (dueño.has(n)) choques.push([n, dueño.get(n), s]); else dueño.set(n, s);
}
log('');
log('P3 · ⭐ DOS PARADAS DISTINTAS NO PUEDEN COMPARTIR NÚMERO DE POSTE');
log('   choques .................................. ' + choques.length);
for (const [n, a, b] of choques.slice(0, 5)) {
  log('      ⛔ poste ' + String(n).padStart(5) + '   "' + a.stop_code + '" ' + a.stop_name.slice(0, 26)
    + '   ×   "' + b.stop_code + '" ' + b.stop_name.slice(0, 26));
}
A.exige(choques.length === 0,
  `${choques.length} pares de paradas comparten número de poste. Un número compartido no da `
  + 'error: da una parada que se hace pasar por otra.');

// ── P4 · el positivo de control, sin el cual los ceros no valen (ley 4) ──────
log('');
log('P4 · ⭐ POSITIVO DE CONTROL — la fórmula tiene que ACEPTAR lo que debe aceptar');
const casos = [
  ['PA00002', 2, 'el código más bajo que existe en el feed'],
  ['PA01183', 1183, 'uno normal'],
  [' PA00669 ', 669, 'con espacios alrededor: se recortan'],
  ['2101', null, 'un código de tranvía'],
  ['XPA00002', null, 'el patrón CONTENIDO, no anclado'],
  ['PA00002Y', null, 'basura detrás'],
  ['PA0002', null, 'cuatro dígitos: no es el convenio'],
  ['PA000021', null, 'seis dígitos: tampoco'],
  ['PA00000', null, 'sintácticamente válido y no es un poste'],
  ['', null, 'vacío'],
  [null, null, 'nulo'],
  [669, null, 'un número, no una cadena'],
];
let malos = 0;
for (const [entrada, esperado, porque] of casos) {
  const dio = poste(entrada);
  const ok = dio === esperado;
  if (!ok) malos++;
  log('      ' + (ok ? '✅' : '⛔') + ' ' + JSON.stringify(entrada).padEnd(12)
    + ' → ' + String(dio).padEnd(6) + ' (se esperaba ' + String(esperado) + ')   ' + porque);
}
A.exige(malos === 0, `${malos} casos de la tabla de control no dan lo esperado.`);

log('');
raya();
log(A.cierre('EL PUENTE DE IDENTIDAD'));
