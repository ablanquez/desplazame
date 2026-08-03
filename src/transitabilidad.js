// A · LA REGLA DE TRANSITABILIDAD — el informe que la justifica.
//
// ⭐ Enumera TODOS los valores de `highway` del dato (no una selección), aplica la
//    regla, y da el delta contra la tanda 10. Si algún número cambia sin explicación,
//    aquí se ve.
//
//   node src/transitabilidad.js

'use strict';
const osm = require('./osm');
const { planarizar, porQueNoSeAnda, transitableAPie, valoresDesconocidos,
  VIARIO_ANDABLE, VIARIO_NO_ANDABLE } = require('./planarizar');
const G = require('./grafo');
const { CRUDO, ZONA_TERMINO } = require('./ruta');
const { aGrados } = require('./geo');

// La regla que había en la tanda 10, para poder medir el delta. Se conserva aquí
// —y solo aquí— porque un delta sin el antes no es un delta.
const REGLA_TANDA10 = (t) => !['motorway', 'motorway_link', 'trunk', 'trunk_link'].includes(t.highway)
  && t.foot !== 'no' && t.highway !== 'construction';

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(46)} ${v}`);

const rec = osm.proyectar(osm.recortar(osm.cargar(CRUDO).ways, ZONA_TERMINO));
const p = planarizar(rec);
const TAGS = new Map();
for (const w of rec) TAGS.set(w.id, w.tags || {});

function conFiltro(filtro) {
  const ady = Array.from({ length: p.nodos.length }, () => []);
  let usadas = 0, metros = 0;
  for (let i = 0; i < p.aristas.length; i++) {
    const e = p.aristas[i];
    if (!filtro(TAGS.get(e.way) || {})) continue;
    ady[e.a].push({ n: e.b, w: e.largo, e: i }); ady[e.b].push({ n: e.a, w: e.largo, e: i });
    usadas++; metros += e.largo;
  }
  const c = G.componentes(p.nodos, ady);
  return { usadas, metros, comps: c.n, mayor: Math.max(...c.tamanos), aislados: c.aislados, comp: c };
}

log('='.repeat(96));
log('A1 · ⭐ TODOS LOS VALORES DE `highway` DEL DATO — con la lista completa delante');
log('   ⚠️ no una selección: los ' + rec.length + ' ways del término.');
log('');
const cuenta = {};
for (const w of rec) { const h = (w.tags || {}).highway || '(SIN highway)'; cuenta[h] = (cuenta[h] || 0) + 1; }
const filas = Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
log('   ' + 'valor'.padEnd(18) + 'ways'.padStart(7) + '   decisión');
for (const [h, n] of filas) {
  const dec = VIARIO_ANDABLE.has(h) ? '✅ se anda'
    : (VIARIO_NO_ANDABLE[h] ? '⛔ ' + VIARIO_NO_ANDABLE[h] : '⚠️ DESCONOCIDO — no se anda, y se avisa');
  log('   ' + h.padEnd(18) + String(n).padStart(7) + '   ' + dec);
}
log('');
di('valores distintos', filas.length);
const desc = valoresDesconocidos(rec);
di('⭐ valores DESCONOCIDOS por la regla', desc.length + (desc.length ? '  ⚠️ ' + desc.map((d) => d[0]).join(', ') : '  ✅ ninguno'));
log('   ⭐ el contador de desconocidos es el punto de la regla: un valor nuevo de OSM');
log('      no puede volverse andable sin que nadie lo decida. Falla CERRADA.');

log('');
log('='.repeat(96));
log('A2 · ⭐ EL COSTE DE CADA PUERTA, POR SEPARADO');
log('   ⚠️ decidir con las tres puertas juntas esconde cuál hace qué.');
log('');
const MU = ['construction', 'proposed', 'planned', 'razed', 'abandoned', 'disused', 'demolished', 'dismantled', 'removed'];
const PUERTAS = [
  ['sin ninguna puerta (el terreno entero)', () => true],
  ['G1 · ¿existe hoy?', (t) => !MU.includes(t.highway) && !MU.includes(t.footway) && !MU.some((k) => t[k] === 'yes')],
  ['G2 · ¿es vía por la que anda gente?', (t) => VIARIO_ANDABLE.has(t.highway)],
  ['G3 · ¿lo prohíbe el dato? (foot/access=no)', (t) => t.foot !== 'no' && t.access !== 'no'],
  ['⇒ LA REGLA (G1 y G2 y G3)', transitableAPie],
  ['la LISTA de la tanda 10', REGLA_TANDA10],
];
log('   ' + 'puerta'.padEnd(44) + 'aristas'.padStart(8) + 'km'.padStart(8) + 'comps'.padStart(7) + 'mayor'.padStart(8));
const res = {};
for (const [k, f] of PUERTAS) {
  const c = conFiltro(f); res[k] = c;
  log('   ' + k.padEnd(44) + String(c.usadas).padStart(8) + (c.metros / 1000).toFixed(0).padStart(8)
    + String(c.comps).padStart(7) + String(c.mayor).padStart(8));
}

log('');
log('   ⚠️ LAS DOS QUE NO SE APLICAN, Y POR QUÉ — medido, no opinado:');
const regla = transitableAPie;
for (const [k, extra] of [['foot=use_sidepath', (t) => t.foot !== 'use_sidepath'],
  ['access=private', (t) => t.access !== 'private']]) {
  const c = conFiltro((t) => regla(t) && extra(t));
  const base = res['⇒ LA REGLA (G1 y G2 y G3)'];
  log('      + ' + k.padEnd(24) + 'quita ' + String(base.usadas - c.usadas).padStart(5) + ' aristas   '
    + 'componentes ' + base.comps + ' -> ' + c.comps + '  (+' + (c.comps - base.comps) + ')');
}
log('      ⇒ las dos CREAN componentes. "usa la acera de al lado" solo vale si la acera');
log('        de al lado está en el grafo; que aparezcan islas demuestra que no está.');
log('        ⛔ NO se aplican. Quedan medidas y reportadas: la decisión no es mía.');

log('');
log('='.repeat(96));
log('A3 · ⚠️ ¿QUÉ PASA CON LOS 82 NODOS CUYO ÚNICO PASO ERA UNA `proposed`?');
{
  const antes = res['la LISTA de la tanda 10'];
  const ahora = res['⇒ LA REGLA (G1 y G2 y G3)'];
  di('componentes', `${antes.comps} -> ${ahora.comps}   (${ahora.comps - antes.comps >= 0 ? '+' : ''}${ahora.comps - antes.comps})`);
  di('mayor', `${antes.mayor} -> ${ahora.mayor}   (${ahora.mayor - antes.mayor})`);
  di('nodos aislados (sin ninguna arista a pie)', `${antes.aislados} -> ${ahora.aislados}   (+${ahora.aislados - antes.aislados})`);
  log('');
  log('   ⭐ Dónde han ido a parar. Los nodos que estaban en la mayor y ya no están:');
  const mA = antes.comp.tamanos.indexOf(antes.mayor), mB = ahora.comp.tamanos.indexOf(ahora.mayor);
  const perdidos = [];
  for (let i = 0; i < p.nodos.length; i++) {
    if (antes.comp.comp[i] === mA && ahora.comp.comp[i] !== mB) perdidos.push(i);
  }
  di('nodos que salen de la componente mayor', perdidos.length);
  const porDestino = {};
  for (const i of perdidos) {
    const k = ahora.comp.comp[i] < 0 ? 'aislado (sin arista)' : 'componente ' + ahora.comp.comp[i];
    (porDestino[k] = porDestino[k] || []).push(i);
  }
  for (const [k, v] of Object.entries(porDestino).sort((a, b) => b[1].length - a[1].length).slice(0, 8)) {
    const g = aGrados(p.nodos[v[0]].x, p.nodos[v[0]].y);
    log('      ' + String(v.length).padStart(4) + ' nodos -> ' + k.padEnd(22)
      + '  p. ej. ' + g[1].toFixed(5) + ',' + g[0].toFixed(5));
  }
  log('');
  log('   ⚠️ Es lo que TIENE que pasar: si el único paso a un sitio era una calle sin');
  log('      construir, ese sitio NO es alcanzable andando. El motor decía que sí.');
}

log('');
log('='.repeat(96));
log('A4 · ⭐ EL DELTA CONTRA LA TANDA 10, POR MOTIVO');
{
  const motivos = {};
  let metrosFuera = 0;
  for (const e of p.aristas) {
    const t = TAGS.get(e.way) || {};
    const antes = REGLA_TANDA10(t), ahora = transitableAPie(t);
    if (antes === ahora) continue;
    const k = (antes && !ahora ? 'SE QUITA · ' : 'SE AÑADE · ') + (porQueNoSeAnda(t) || 'se anda');
    motivos[k] = (motivos[k] || 0) + 1;
    if (antes && !ahora) metrosFuera += e.largo;
  }
  for (const [k, v] of Object.entries(motivos).sort((a, b) => b[1] - a[1])) {
    log('   ' + String(v).padStart(6) + '  ' + k);
  }
  di('metros que dejan de ser andables', (metrosFuera / 1000).toFixed(2) + ' km');
  const sum = Object.values(motivos).reduce((a, b) => a + b, 0);
  const dif = res['la LISTA de la tanda 10'].usadas - res['⇒ LA REGLA (G1 y G2 y G3)'].usadas;
  di('⭐ contador independiente', `suma de motivos ${sum}  ·  diferencia de aristas ${dif}  ${sum === dif ? '✅ cuadra' : '⛔ NO CUADRA'}`);
}
