// ⭐⭐⭐ LA ARITMÉTICA DE LOS PARES CANDIDATOS — el número que decide el tamaño
//      de H2a, y ahora CON SU INSTRUMENTO VERSIONADO.
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE ESTE FICHERO, Y NO SOLO SU RESULTADO
// ═════════════════════════════════════════════════════════════════════════════
//   El `483.636 → 3.231 → 2.538` se publicó en `docs/DISENO-H2A-RED.md` §4.1
//   producido por un script de usar y tirar, FUERA del repositorio. Es decir: se
//   versionó la SALIDA y no el INSTRUMENTO, que es exactamente al revés de lo que
//   manda este proyecto. Nadie podía volver a producir el número.
//
// ⛔ ESTO NO CALCULA NINGÚN TRANSBORDO. Solo cuenta pares y los acota. Las rutas
//    peatonales son otra tanda, y el coste de un enlace son METROS ANDANDO, no
//    esta distancia. Aquí la línea recta se usa para lo ÚNICO para lo que vale:
//    decidir barato a quién se le va a preguntar.
//
// ⚠️ EL UNIVERSO, DECLARADO: las 984 paradas del feed 20260623_AUZSA_Y_TRANVIA,
//    con sus coordenadas tal y como vienen. Sin filtrar zombis: una parada sirve
//    o no sirve líneas vivas, pero sigue estando en la calle.
//
//   node tools/gtfs/pares-candidatos.js

'use strict';

const A = require('../../src/alarma');
const { cargar } = require('./feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));

/** El radio propuesto en el diseño. Un pre-filtro, NO un coste. */
const RADIO_PROPUESTO_M = 300;
/** Los tres números publicados en `docs/DISENO-H2A-RED.md` §4.1. */
const PUBLICADO = { totales: 483636, enRadio: 3231, candidatos: 2538 };

const R_TIERRA = 6371000;
const RAD = Math.PI / 180;

/**
 * Distancia a vuelo de pájaro, en metros.
 * ⚠️ Equirrectangular con el coseno de la latitud media, no Haversine: a estas
 *    distancias (centenares de metros, misma ciudad) la diferencia es de
 *    milímetros y esto se llama 483.636 veces. Lo que NO se hace es tratar
 *    grados como si fueran metros, que a 41,6° de latitud da un 25 % de error en
 *    la longitud y no lo nota nadie.
 */
function recta(a, b) {
  const x = (b.lon - a.lon) * RAD * Math.cos((a.lat + b.lat) / 2 * RAD);
  const y = (b.lat - a.lat) * RAD;
  return Math.hypot(x, y) * R_TIERRA;
}

raya();
log('PARES CANDIDATOS A TRANSBORDO — a vuelo de pájaro, como PRE-FILTRO');
raya();

const { stops, modo, lineasDe } = cargar();
const P = stops.map((s) => ({
  id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
  lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
  modo: modo.get(s.stop_id) || '?',
  lineas: lineasDe.get(s.stop_id) || new Set(),
}));

const N = P.length;
const totales = N * (N - 1) / 2;
log('   paradas .................................. ' + N);
log('   pares totales  N(N-1)/2 .................. ' + totales.toLocaleString('es-ES'));
log('');

const UMBRALES = [100, 150, 200, 250, 300, 400, 500, 750, 1000];
const enRadio = new Map(UMBRALES.map((u) => [u, 0]));
const cruzados = new Map(UMBRALES.map((u) => [u, 0]));
const masCercana = new Array(N).fill(Infinity);

let enRadioPropuesto = 0;
let sinLineaNueva = 0;

for (let i = 0; i < N; i++) {
  for (let j = i + 1; j < N; j++) {
    const m = recta(P[i], P[j]);
    if (m < masCercana[i]) masCercana[i] = m;
    if (m < masCercana[j]) masCercana[j] = m;
    for (const u of UMBRALES) {
      if (m <= u) {
        enRadio.set(u, enRadio.get(u) + 1);
        if (P[i].modo !== P[j].modo) cruzados.set(u, cruzados.get(u) + 1);
      }
    }
    if (m <= RADIO_PROPUESTO_M) {
      enRadioPropuesto++;
      // ⭐ EL SEGUNDO FILTRO: un par solo es candidato si al menos una de las dos
      //    paradas ofrece una línea que la otra no. Si las dos dan exactamente lo
      //    mismo, andar de una a otra no lleva a ninguna parte nueva.
      let aporta = false;
      for (const x of P[j].lineas) if (!P[i].lineas.has(x)) { aporta = true; break; }
      if (!aporta) for (const x of P[i].lineas) if (!P[j].lineas.has(x)) { aporta = true; break; }
      if (!aporta) sinLineaNueva++;
    }
  }
}

log('   radio       pares ≤ radio      % del total      de ellos BUS↔TRANVÍA');
raya('-');
for (const u of UMBRALES) {
  const n = enRadio.get(u);
  log('   ' + String(u).padStart(5) + ' m  ' + String(n).padStart(14)
    + (100 * n / totales).toFixed(3).padStart(12) + ' %'
    + String(cruzados.get(u)).padStart(12));
}

const candidatos = enRadioPropuesto - sinLineaNueva;
log('');
log('⭐⭐ EL ACOTADO PROPUESTO — radio ' + RADIO_PROPUESTO_M + ' m + «aporta línea nueva»');
log('   pares totales ............................ ' + totales.toLocaleString('es-ES'));
log('   pares ≤ ' + RADIO_PROPUESTO_M + ' m .............................. ' + enRadioPropuesto);
log('   de ellos, SIN ninguna línea nueva ........ ' + sinLineaNueva);
log('   ⇒ PARES CANDIDATOS ....................... ' + candidatos);
log('   reducción ................................ ' + Math.round(totales / candidatos) + '×');

// ── ⭐ el positivo de control del segundo filtro (ley 4 y ley 147) ────────────
log('');
log('⭐ POSITIVO DE CONTROL DEL SEGUNDO FILTRO — ¿discrimina, o deja pasar todo?');
log('   si no filtrara nada, los inútiles serían 0 ...... y son ' + sinLineaNueva);
log('   si filtrara todo, quedarían 0 .................. y quedan ' + candidatos);
A.exige(sinLineaNueva > 0 && candidatos > 0,
  'el segundo filtro no discrimina: o no quita nada o lo quita todo. Un filtro que no '
  + 'separa es indistinguible de no tener filtro.');

// ── ⭐⭐ contra lo publicado en el diseño: si no cuadra, ES UN HALLAZGO ────────
log('');
raya();
log('⭐⭐ CONTRA LO PUBLICADO EN docs/DISENO-H2A-RED.md §4.1');
raya();
const filas = [
  ['pares totales', totales, PUBLICADO.totales],
  ['pares ≤ ' + RADIO_PROPUESTO_M + ' m', enRadioPropuesto, PUBLICADO.enRadio],
  ['pares candidatos', candidatos, PUBLICADO.candidatos],
];
for (const [q, ahora, pub] of filas) {
  log('   ' + q.padEnd(22) + String(ahora).padStart(10) + '   publicado ' + String(pub).padStart(10)
    + '   ' + (ahora === pub ? '✅' : '⛔ DIFIERE en ' + (ahora - pub)));
  A.exige(ahora === pub,
    `«${q}» sale ${ahora} y el diseño publicó ${pub}. Si difiere, el número del diseño lo produjo `
    + 'un script que ya no existe, y eso es exactamente lo que este fichero viene a impedir.');
}

// ── el coste del acotado, que va publicado al lado del beneficio ─────────────
log('');
raya();
log('EL COSTE DEL ACOTADO — a quién deja sin ninguna pareja');
raya();
for (const u of [200, 300, 500]) {
  log('   paradas sin NINGUNA otra a ≤ ' + String(u).padStart(3) + ' m ......... '
    + masCercana.filter((x) => x > u).length + ' de ' + N);
}
const peor = Math.max(...masCercana);
log('   la parada más aislada tiene su vecina a .. ' + peor.toFixed(1) + ' m');
log('   ⇒ ⛔ ningún radio por debajo de ' + Math.ceil(peor) + ' m le da pareja a todo el mundo,');
log('     y eso NO es un defecto del radio: es que hay paradas que están solas.');

// ── la costura bus↔tranvía, que es el diferenciador del hito ─────────────────
log('');
raya();
log('⭐⭐ LA COSTURA BUS↔TRANVÍA — el enlace que ningún router sin grafo peatonal hace bien');
raya();
const T = P.filter((p) => p.modo === 'tranvia');
const B = P.filter((p) => p.modo === 'bus');
const alBusMasCercano = T.map((t) => Math.min(...B.map((b) => recta(t, b))));
for (const u of [150, 200, 300, 400, 500]) {
  log('   radio ' + String(u).padStart(4) + ' m   paradas de tranvía con bus cerca '
    + String(alBusMasCercano.filter((d) => d <= u).length).padStart(3) + ' de ' + T.length);
}
const ord = alBusMasCercano.slice().sort((a, b) => a - b);
log('   distancia al bus más cercano: mín ' + ord[0].toFixed(0) + ' m · mediana '
  + ord[Math.floor(ord.length / 2)].toFixed(0) + ' m · máx ' + ord[ord.length - 1].toFixed(0) + ' m');
log('   ⛔ las que se quedan fuera a ' + RADIO_PROPUESTO_M + ' m:');
T.forEach((t, i) => {
  if (alBusMasCercano[i] > RADIO_PROPUESTO_M) {
    log('      "' + t.code + '"  ' + t.nombre.padEnd(30) + ' el bus más cercano a '
      + alBusMasCercano[i].toFixed(0) + ' m');
  }
});

log('');
raya();
log(A.cierre('LOS PARES CANDIDATOS'));
