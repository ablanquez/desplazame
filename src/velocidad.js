// ⭐⭐⭐ TANDA 4 · LA VELOCIDAD — que los tiempos publicados salgan de una
//     CONSTANTE ESTÁNDAR y no de una persona.
//
//   node src/velocidad.js            # A · el guardián
//   node src/velocidad.js --probar   # B · la contraprueba: su rojo, provocado
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ POR QUÉ CAMBIA — y no es que 6 estuviera mal: es que la PREGUNTA era otra
// ═════════════════════════════════════════════════════════════════════════════
//   Los tiempos se calculaban con **la velocidad de Antonio**, ~6 km/h, derivada
//   de UN trayecto suyo cronometrado (la ruta nº7, ~25 min sobre 2,6 km de GPS).
//   Eso contesta *«¿a qué velocidad anda Antonio?»*. **Pero esto es un buscador
//   para cualquiera**, y la pregunta que tiene que contestar es otra:
//   *«¿qué velocidad publica un buscador de rutas?»*.
//
//   ⇒ **`VELOCIDAD_KMH = 5,0` (1,39 m/s), y no es una media: es un estándar.**
//
// ═════════════════════════════════════════════════════════════════════════════
// LAS FUENTES, escritas al lado del número (⛔ y no son la literatura clínica)
// ═════════════════════════════════════════════════════════════════════════════
//   · **openrouteservice** fija **5 km/h** para los perfiles a pie en todos los
//     tipos de vía permitidos.
//   · Las isócronas basadas en **OSRM / Valhalla** usan **5 km/h** por defecto,
//     descrito como «un ritmo moderado para un adulto medio».
//
//   ⭐⭐⭐ Y la razón de peso, que es de DISEÑO: este proyecto se define por **no**
//     usar OSRM, Valhalla ni GraphHopper. **Usar su misma constante hace que sus
//     tiempos sean COMPARABLES con los de ellos.** Si alguien contrasta una ruta
//     de aquí con otro motor y sale lo mismo, eso VALIDA el motor. Con 6 o con
//     6,67 no cuadraría y no se sabría por qué.
//
// ⚠️ DATO DE CONTEXTO, ⛔ NO ES VALIDACIÓN: la velocidad de marcha preferida en
//   humanos suele caer entre 1,10 y 1,65 m/s (4,0–5,9 km/h). Antonio declara
//   ~9 min/km = **6,67 km/h**, por encima de ese rango. ⭐ Eso no dice que ande
//   mal: dice que **su ritmo no puede calibrar un buscador para cualquiera**, que
//   es exactamente el argumento de esta tanda.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LO QUE ESTO DISUELVE
// ═════════════════════════════════════════════════════════════════════════════
//   La ruta nº7 era «el eje del que más cuelga»: de un solo testigo humano
//   colgaban todos los tiempos y dos de las tres bandas. **Con una constante
//   estándar, la nº7 ya no calibra nada.** ⇒ el eje no se arregla: DESAPARECE.
//   ⭐ Y las caminatas de Antonio siguen valiendo para lo que de verdad miden:
//     que los METROS del motor son correctos (2.529 del motor contra 2.600 del
//     GPS). Un GPS mide bien distancias; los minutos eran otra cosa.
//
// ⚠️ LO QUE ESTE GUARDIÁN **NO** COMPRUEBA, dicho antes de que nadie lo suponga:
//   · No ejecuta `rutas-antonio.js`. Compara contra los METROS CONGELADOS de
//     `modelo-rutas.js` (`PUBLICADOS`), que son un patrón externo y anterior a
//     esta tanda y **no dependen de la velocidad**. Ejecutar las siete rutas en
//     cada pasada costaría diez minutos de reloj a toda la batería.
//   · No comprueba que 5,0 sea «la velocidad correcta». Eso no es medible: es
//     una decisión, y va arriba con sus fuentes.

'use strict';
const fs = require('fs');
const path = require('path');
const A = require('./alarma');
const Rel = require('./relato');

const RAIZ = path.join(__dirname, '..');
const log = console.log;
const di = (k, v) => log('   ' + String(k).padEnd(58) + v);

/** ⭐ EL ESTÁNDAR. ⛔ Se escribe aquí y en `relato.js` NO se vuelve a escribir:
 *  allí se importa. Dos sitios con el mismo número es un sitio que se pudrirá. */
const ESTANDAR_KMH = 5.0;

/** La conversión, escrita OTRA VEZ y a propósito: si esto llamara a
 *  `Rel.minutos()` no comprobaría nada — compararía una función consigo misma. */
const minutosEsperados = (metros) => metros / (ESTANDAR_KMH * 1000 / 60);

// ═════════════════════════════════════════════════════════════════════════════
// EL VEREDICTO — función pura, para que la contraprueba pueda alimentarla
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @param {number} kmh la velocidad que usa de verdad el redactor
 * @param {Object} tiempos {ruta: minutosPublicados} tal y como se publican
 * @param {Object} metros {ruta: metros} los metros congelados
 * @returns {{ok: boolean, malos: Array, v: string}}
 */
function juzgar(kmh, tiempos, metros) {
  const malos = [];
  if (Math.abs(kmh - ESTANDAR_KMH) > 1e-9) {
    malos.push({ que: 'la constante', hay: kmh, debe: ESTANDAR_KMH });
  }
  for (const n of Object.keys(metros)) {
    if (tiempos[n] == null) continue;
    const debe = Math.max(1, Math.round(minutosEsperados(metros[n])));
    if (tiempos[n] !== debe) malos.push({ que: 'ruta ' + n, hay: tiempos[n], debe });
  }
  return { ok: malos.length === 0, malos,
    v: malos.length ? '⛔ ' + malos.length + ' que no corresponde(n) a ' + ESTANDAR_KMH + ' km/h' : '✅' };
}

// ── los metros CONGELADOS, leídos del fichero que los declara (ley 105) ──────
function metrosPublicados() {
  const src = fs.readFileSync(path.join(__dirname, 'modelo-rutas.js'), 'utf8');
  const m = src.match(/const PUBLICADOS = \{([^}]*)\}/);
  if (!m) return null;
  const out = {};
  for (const p of m[1].matchAll(/(\d+):\s*([\d.]+)/g)) out[p[1]] = Number(p[2]);
  return out;
}

// ── lo que publica HOY el motor, sin ejecutarlo: su propia función ───────────
const metros = metrosPublicados();
const tiemposDelMotor = {};
for (const n of Object.keys(metros || {})) tiemposDelMotor[n] = Math.max(1, Math.round(Rel.minutos(metros[n])));

log('='.repeat(104));
log('LA VELOCIDAD · ¿SALEN LOS TIEMPOS DE UNA CONSTANTE ESTÁNDAR?');
log('='.repeat(104));
di('⭐ el estándar que este proyecto adopta', ESTANDAR_KMH.toFixed(1) + ' km/h   (openrouteservice · OSRM/Valhalla)');
di('la que usa hoy el redactor `relato.js`', Rel.VELOCIDAD_KMH + ' km/h');
di('metros congelados leídos de `modelo-rutas.js`', metros ? Object.keys(metros).length + ' rutas' : '⛔ NO SE PUEDEN LEER');
A.exige(!!metros, 'no se han podido leer los metros congelados de `modelo-rutas.js`: sin patrón externo esto no mide nada');

log('');
log('   ' + 'ruta'.padStart(6) + 'metros'.padStart(11) + 'publica'.padStart(10)
  + ('a ' + ESTANDAR_KMH.toFixed(1)).padStart(10) + '   veredicto');
const j = juzgar(Rel.VELOCIDAD_KMH, tiemposDelMotor, metros || {});
for (const n of Object.keys(metros || {})) {
  const debe = Math.max(1, Math.round(minutosEsperados(metros[n])));
  log('   ' + n.padStart(6) + metros[n].toFixed(1).padStart(11)
    + (tiemposDelMotor[n] + ' min').padStart(10) + (debe + ' min').padStart(10)
    + '   ' + (tiemposDelMotor[n] === debe ? '✅' : '⛔ NO CORRESPONDE'));
}

log('');
log('   V1 · la constante del redactor es el estándar');
A.exige(Math.abs(Rel.VELOCIDAD_KMH - ESTANDAR_KMH) < 1e-9,
  `el redactor anda a ${Rel.VELOCIDAD_KMH} km/h y el estándar es ${ESTANDAR_KMH}: los tiempos publicados no son los de un buscador`);

log('   V2 · los tiempos publicados corresponden al estándar');
A.exige(j.malos.filter((x) => x.que !== 'la constante').length === 0,
  j.malos.filter((x) => x.que !== 'la constante').length + ' tiempo(s) publicado(s) que no corresponden a ' + ESTANDAR_KMH + ' km/h');

// ── V3 · ⚠️ EL VISOR — se genera aparte, y puede quedarse atrás ──────────────
//   ⛔ `exportar-rutas.js` NO se ejecuta desde aquí (escribe dentro del
//     repositorio). Se LEE lo último que dejó escrito. Si el motor cambia y
//     nadie reexporta, el visor publica otra velocidad que el informe: esto lo
//     dice en voz alta en vez de dejarlo pasar.
log('   V3 · el visor exportado publica la misma velocidad');
const fVisor = path.join(RAIZ, 'tools', 'rutas-visor.js');
if (!fs.existsSync(fVisor)) {
  log('        ⚠️ no hay visor exportado: nada que comparar. NO CONSTA.');
} else {
  const cab = fs.readFileSync(fVisor, 'utf8').slice(0, 400);
  const mv = cab.match(/"velocidadKmh":\s*([\d.]+)/);
  const kmhVisor = mv ? Number(mv[1]) : null;
  di('   velocidad del visor', kmhVisor == null ? '⛔ no se encuentra en la cabecera' : kmhVisor + ' km/h');
  A.exige(kmhVisor != null && Math.abs(kmhVisor - ESTANDAR_KMH) < 1e-9,
    `el visor publica ${kmhVisor} km/h y el motor ${ESTANDAR_KMH}: hay que reexportar con \`exportar-rutas.js\``);
}

// ── V4 · el número no puede estar escrito a mano en ningún texto ─────────────
//   ⭐ Ley 116: el mismo valor en dos sitios es un sitio que se pudrirá. La línea
//     que avisa al usuario tiene que DERIVAR de la constante, no repetirla.
log('   V4 · ningún texto repite la cifra a mano');
const rel = fs.readFileSync(path.join(__dirname, 'relato.js'), 'utf8');
const aMano = [];
rel.split('\n').forEach((l, i) => {
  if (/^\s*(?:\/\/|\*)/.test(l)) return;                       // los comentarios se miran aparte
  if (/L\.push|log\(/.test(l) && /['"`][^'"`]*\d[.,]?\d*\s*km\/h/.test(l)) aMano.push(i + 1);
});
di('   líneas de `relato.js` que imprimen una velocidad literal', aMano.length + (aMano.length ? '   ⛔ ' + aMano.join(', ') : '   ✅'));
A.exige(aMano.length === 0,
  aMano.length + ' texto(s) de `relato.js` escriben la velocidad a mano en vez de derivarla de la constante');

// ═════════════════════════════════════════════════════════════════════════════
// B · LA CONTRAPRUEBA — ⛔ un guardián no está hecho hasta que se ha visto su rojo
// ═════════════════════════════════════════════════════════════════════════════
if (process.argv.includes('--probar')) {
  log('');
  log('='.repeat(104));
  log('B · ⭐⭐ LA CONTRAPRUEBA — el rojo provocado, sin tocar nada');
  log('='.repeat(104));
  const M = { 7: 2528.9, 2: 598.1 };
  const bien = { 7: Math.max(1, Math.round(minutosEsperados(2528.9))), 2: Math.max(1, Math.round(minutosEsperados(598.1))) };

  const c1 = juzgar(ESTANDAR_KMH, bien, M);
  log('   C1 · positivo de control — constante y tiempos correctos      '
    + (c1.ok ? '✅ verde' : '⛔ grita con todo bien: no distingue nada'));
  A.exige(c1.ok, 'el guardián grita con la constante y los tiempos correctos');

  const c2 = juzgar(6, bien, M);
  log('   C2 · la CONSTANTE mal (6 km/h) y los tiempos bien             '
    + (!c2.ok ? '✅ lo caza' : '⛔ NO LO VE'));
  A.exige(!c2.ok, 'el guardián no caza una constante que no es el estándar');

  const c3 = juzgar(ESTANDAR_KMH, { 7: 25, 2: bien[2] }, M);
  log('   C3 · la constante bien y UN TIEMPO de los viejos (25 min)     '
    + (!c3.ok ? '✅ lo caza' : '⛔ NO LO VE'));
  A.exige(!c3.ok, 'el guardián no caza un tiempo que se ha quedado con la velocidad vieja');

  const c4 = juzgar(ESTANDAR_KMH, { 7: bien[7] + 1, 2: bien[2] }, M);
  log('   C4 · …y basta UN MINUTO de diferencia                         '
    + (!c4.ok ? '✅ lo caza' : '⛔ se le escapa'));
  A.exige(!c4.ok, 'el guardián necesita más de un minuto de diferencia para enterarse');

  log('');
  log('   ⚠️ Lo que la contraprueba NO enseña: que los tiempos que salen por');
  log('      pantalla en `rutas-antonio.js` sean estos. Eso se comprueba a mano');
  log('      ejecutándolo, y esta tanda lo ha hecho — pero no está automatizado.');
}

log('');
log(A.cierre('LA VELOCIDAD'));
