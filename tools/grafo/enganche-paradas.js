// ⭐⭐⭐ EL ENGANCHE DE LAS 984 PARADAS AL GRAFO PEATONAL — LA MEDIDA QUE DECIDE
//      SI EL RADIO DE 300 m DEL DISEÑO DE H2a TIENE SENTIDO.
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ NO SE HEREDA EL 65 DE H1
// ═════════════════════════════════════════════════════════════════════════════
//   `src/ruta.js:151` publica `AVISO_ENGANCHE_M = 65`, y es el **p99 del
//   callejero de PORTALES**. Un portal es una PUERTA EN UNA FACHADA; un poste
//   está EN LA VÍA PÚBLICA. No tienen por qué distribuirse igual, y suponer que
//   sí sería exactamente heredar un número sin su población.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ EL POSITIVO DE CONTROL, Y NO ES OPCIONAL (ley 4)
// ═════════════════════════════════════════════════════════════════════════════
//   Este script mide TAMBIÉN una muestra de portales con el MISMO instrumento.
//   Si no reproduce el p99 de 65 m que H1 tiene publicado, el instrumento está
//   mal y las cifras de las paradas no valen nada. Un número bonito sin control
//   es indistinguible de no haber medido.
//
//   ⇒ QUÉ RESULTADO HARÍA FALLAR ESTA COMPROBACIÓN (ley 147): que el p99 de los
//     portales salga lejos de 65 m. Entonces PARA, y lo dice.
//
// ⚠️ SE MIDE CONTRA LA ARISTA, NO CONTRA EL NODO. Es la misma decisión que H1
//    tomó tras un enganche de 512 m: al nodo más cercano el máximo real del
//    callejero es 566,6 m, y a la arista baja a 303,1 m. Medir al nodo daría una
//    cola larguísima que no existe en el terreno.
//
//   node tools/grafo/enganche-paradas.js

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const P = require('../../src/portales');
const { cargar } = require('../gtfs/feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));

/** El p99 de H1, que es contra lo que se contrasta el instrumento. */
const P99_PORTALES_PUBLICADO = 65;
/** Cuánto puede alejarse el control antes de que esto sea otra medida. */
const TOLERANCIA_CONTROL_M = 10;

function percentiles(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const p = (q) => a[Math.min(a.length - 1, Math.floor(a.length * q))];
  return {
    n: a.length,
    min: a[0],
    p50: p(0.50), p75: p(0.75), p90: p(0.90), p95: p(0.95), p99: p(0.99),
    max: a[a.length - 1],
  };
}

const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

function fila(etiqueta, s) {
  log('   ' + etiqueta.padEnd(26)
    + String(s.n).padStart(6)
    + f1(s.min).padStart(9) + f1(s.p50).padStart(9) + f1(s.p75).padStart(9)
    + f1(s.p90).padStart(9) + f1(s.p95).padStart(9) + f1(s.p99).padStart(9)
    + f1(s.max).padStart(10));
}

raya();
log('EL ENGANCHE AL GRAFO PEATONAL — distribución, no media');
raya();

// ── el grafo de H1, el mismo que usa el motor ────────────────────────────────
const t0 = Date.now();
const g = R.construir(R.ZONA_TERMINO);

// ⛔⛔ LAS COMPONENTES SE COGEN DEL GRAFO, NO SE RECALCULAN. La primera versión de
//    este script llamaba a `G.adyacencia(..., sinCondicionales = true)` y sacaba
//    SUS PROPIAS componentes: 184 en vez de 170. Es decir, medía sobre un grafo
//    **que el motor no usa** —los pasos condicionales entran en el cálculo desde
//    la tanda 12— y habría publicado un recuento de paradas incomunicadas que no
//    le corresponde a ninguna ruta real. Ver bitácora.
const comp = g.comp.comp;
const tamanos = g.comp.tamanos;
const mayor = tamanos.indexOf(Math.max(...tamanos));

// ⭐ Y los dos recuentos de nodos NO son el mismo, ni deben serlo — pero la
//    relación entre ellos NO es la que parece a simple vista, y merece decirse:
//      `contadores.nodos`  (planarizar.js:508)  nodos que salen en ALGUNA arista,
//                                               sea transitable a pie o no
//      `g.nodos.length`                          todos los del array
//      `g.comp.aislados`                         los que no tienen NINGUNA
//                                               adyacencia EN EL GRAFO A PIE
//    ⚠️ La primera versión de esta línea afirmaba `nodos + aislados = array`. Es
//       FALSA, y el propio script lo dijo: los aislados a pie (1.977) incluyen
//       nodos que sí tienen aristas, solo que ninguna transitable. Lo que sí se
//       cumple es que quien no tiene arista alguna tampoco puede tener adyacencia.
const sinNingunaArista = g.nodos.length - g.contadores.nodos;
log('   grafo: nodos con alguna arista ' + g.contadores.nodos + ' · en el array ' + g.nodos.length
  + '   ⇒ sin ninguna arista ' + sinNingunaArista);
log('          aislados EN EL GRAFO A PIE ' + g.comp.aislados
  + '   (incluye a los anteriores, y a los que solo tocan vía no transitable)');
A.exige(g.comp.aislados >= sinNingunaArista,
  `hay ${sinNingunaArista} nodos sin ninguna arista pero solo ${g.comp.aislados} aislados a pie. `
  + 'Un nodo sin aristas no puede tener adyacencia: o el planarizado o el contador miente.');
log('   aristas ' + g.aristas.length + ' · a pie ' + g.aristasAPie
  + ' · componentes ' + g.comp.n + ' · mayor ' + Math.max(...tamanos)
  + '   (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
log('   ⭐ pasos condicionales DENTRO, que es como contesta el motor: ' + g.condicionales.dentro);
log('');

/**
 * Engancha un punto y devuelve la distancia, o `null` si está fuera del tope.
 * ⚠️ `engancharPunto` LANZA cuando no encuentra nada a menos de 350 m. Aquí se
 *    captura a propósito: un poste fuera del grafo es un RESULTADO que hay que
 *    contar, no una excepción que pare la medición de los otros 983.
 */
function engancheDe(lat, lon) {
  try {
    const e = R.engancharPunto(g, lat, lon, 'parada');
    const arista = g.aristas[e.arista];
    return { d: e.d, precision: arista.precision, nodo: arista.a };
  } catch (err) {
    return null;
  }
}

// ── ⭐ EL POSITIVO DE CONTROL: los portales, con el MISMO instrumento ─────────
log('⭐ POSITIVO DE CONTROL — los PORTALES, medidos con este mismo instrumento');
log('   Si el p99 no sale cerca de ' + P99_PORTALES_PUBLICADO + ' m, este script mide otra cosa.');
const portales = P.cargarPortales();
// Muestra determinista: uno de cada N. ⛔ Nada de aleatorio — una medición que
// cambia de valor entre ejecuciones no se puede comparar con la de mañana.
const PASO = 20;
const muestra = portales.filter((_, i) => i % PASO === 0);
const dPortales = [];
let portalesFuera = 0;
for (const p of muestra) {
  const e = engancheDe(p.lat, p.lon);
  if (e) dPortales.push(e.d); else portalesFuera++;
}
const ctl = percentiles(dPortales);
log('   portales en el callejero ................. ' + portales.length);
log('   muestra (1 de cada ' + PASO + ') ..................... ' + muestra.length
  + '   fuera del grafo: ' + portalesFuera);
log('');
log('   población                      n      mín      p50      p75      p90      p95      p99       máx');
raya('-');
fila('PORTALES (control)', ctl);

const desvio = Math.abs(ctl.p99 - P99_PORTALES_PUBLICADO);
log('');
log('   p99 medido ' + f1(ctl.p99) + ' m   ·   publicado por H1 ' + P99_PORTALES_PUBLICADO
  + ' m   ·   desvío ' + f1(desvio) + ' m');
A.exige(desvio <= TOLERANCIA_CONTROL_M,
  `el p99 de los portales sale en ${f1(ctl.p99)} m y H1 publica ${P99_PORTALES_PUBLICADO} m `
  + `(desvío ${f1(desvio)} m, tolerancia ${TOLERANCIA_CONTROL_M} m). El instrumento NO reproduce `
  + 'la medida conocida: todo lo que siga es ruido.');

// ── LAS PARADAS ──────────────────────────────────────────────────────────────
log('');
raya();
log('LAS PARADAS DEL FEED — bus y tranvía SEPARADOS, que son dos poblaciones');
raya();

const { stops, modo } = cargar();
const medidas = [];
let fuera = 0;
for (const s of stops) {
  const lat = Number.parseFloat(s.stop_lat);
  const lon = Number.parseFloat(s.stop_lon);
  const e = engancheDe(lat, lon);
  if (!e) { fuera++; continue; }
  medidas.push({
    id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
    modo: modo.get(s.stop_id) || '?', d: e.d, precision: e.precision,
    comp: comp[e.nodo], enMayor: comp[e.nodo] === mayor,
  });
}

const bus = medidas.filter((m) => m.modo === 'bus');
const tr = medidas.filter((m) => m.modo === 'tranvia');
log('   paradas medidas .......................... ' + medidas.length + ' de ' + stops.length
  + (fuera ? '   ⛔ fuera del grafo: ' + fuera : '   ✅ ninguna fuera del grafo'));
log('');
log('   población                      n      mín      p50      p75      p90      p95      p99       máx');
raya('-');
fila('PORTALES (control)', ctl);
fila('PARADAS · bus', percentiles(bus.map((m) => m.d)));
fila('PARADAS · tranvía', percentiles(tr.map((m) => m.d)));
fila('PARADAS · las 984', percentiles(medidas.map((m) => m.d)));

// ── las que pasan del aviso de H1 ────────────────────────────────────────────
const lejos = medidas.filter((m) => m.d > P99_PORTALES_PUBLICADO).sort((a, b) => b.d - a.d);
log('');
log('⚠️ LAS QUE PASAN DE ' + P99_PORTALES_PUBLICADO + ' m (el aviso de H1) ......... '
  + lejos.length + ' de ' + medidas.length
  + '   (' + (100 * lejos.length / medidas.length).toFixed(1) + ' %)');
for (const m of lejos.slice(0, 20)) {
  log('      ' + f1(m.d).padStart(7) + ' m   ' + (m.modo === 'bus' ? 'bus    ' : 'tranvía')
    + '  "' + m.code + '"  ' + m.nombre.slice(0, 44));
}
if (lejos.length > 20) log('      … y ' + (lejos.length - 20) + ' más');

// ── ⭐ LA PREGUNTA QUE HAY QUE CONTESTAR: ¿sobrevive el radio de 300 m? ───────
log('');
raya();
log('⭐⭐⭐ ¿SOBREVIVE EL RADIO DE 300 m DEL DISEÑO?');
raya();
const todas = percentiles(medidas.map((m) => m.d));
log('   El radio acota pares a vuelo de pájaro entre COORDENADAS de parada.');
log('   El error que introduce el enganche es, como mucho, la suma de los dos enganches.');
log('');
log('   error típico de un par (2 × p50) ......... ' + f1(2 * todas.p50) + ' m'
  + '   ⇒ ' + (200 * todas.p50 / 300).toFixed(1) + ' % del radio');
log('   error del 1 % peor (2 × p99) ............. ' + f1(2 * todas.p99) + ' m'
  + '   ⇒ ' + (200 * todas.p99 / 300).toFixed(1) + ' % del radio');
log('   peor caso posible (2 × máx) .............. ' + f1(2 * todas.max) + ' m');

// ── el tipo de arista y la componente, que son M2 y M3 del diseño ────────────
// ⚠️ «eje» es el mismo criterio que usa `src/acera-equivocada.js:51`, no uno nuevo.
const ES_EJE = new Set(['eje-de-calzada', 'eje-con-acera-declarada']);
const enEje = medidas.filter((m) => ES_EJE.has(m.precision)).length;
const porPrecision = {};
for (const m of medidas) porPrecision[m.precision] = (porPrecision[m.precision] || 0) + 1;
const fueraMayor = medidas.filter((m) => !m.enMayor);
log('');
raya();
log('M2 y M3 DEL DISEÑO — el tipo de arista y la componente');
raya();
log('   enganchadas a EJE DE CALZADA ............. ' + enEje + ' de ' + medidas.length
  + '   (' + (100 * enEje / medidas.length).toFixed(1) + ' %)');
log('      ⚠️ un enlace por el eje de la calzada NO es un enlace a pie: es el centro de la calle.');
for (const [k, v] of Object.entries(porPrecision).sort((a, b) => b[1] - a[1])) {
  log('      ' + k.padEnd(28) + String(v).padStart(5) + '   ' + (100 * v / medidas.length).toFixed(1) + ' %');
}
log('   FUERA de la componente mayor ............. ' + fueraMayor.length);
for (const m of fueraMayor.slice(0, 12)) {
  log('      componente ' + String(m.comp).padStart(4) + '   "' + m.code + '"  ' + m.nombre.slice(0, 44));
}
log('');
log('   ⭐ ¿es sospechoso un cero aquí? Con ' + g.comp.n + ' componentes, un 0 querría decir');
log('     que las 984 caen todas en la mayor — posible, pero hay que verlo escrito.');

log('');
raya();
log(A.cierre('EL ENGANCHE DE LAS PARADAS'));
