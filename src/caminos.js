// C · INVENTARIO DE CAMINOS DE TIERRA — contar y situar. ⛔ NO penalizar.
//
// ⭐ Es una categoría de CUALIDAD, no de existencia: el camino está y es legal.
//    Un camino de tierra entre campos a las once de la noche es técnicamente una
//    ruta y prácticamente un despropósito. La forma correcta de tratarlo es
//    PENALIZAR, no excluir — pero **el coste no existe todavía** (hoy el coste es
//    la longitud en metros, y punto).
//
// ⚠️ Y hay una razón de peso para no excluirlos nunca: en Movera o en
//    Garrapinillos **el camino ES la calle**. Excluirlos dejaría barrios enteros
//    sin rutas. Por eso este fichero cuenta y sitúa, y no toca nada.
//
//   node src/caminos.js

'use strict';
const osm = require('./osm');
const P = require('./planarizar');
const G = require('./grafo');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');
const { aGrados } = require('./geo');

// Superficies que hacen que un camino sea "de tierra" a efectos de andar de noche.
const SUPERFICIE_BLANDA = new Set(['dirt', 'ground', 'earth', 'gravel', 'fine_gravel',
  'compacted', 'sand', 'grass', 'mud', 'pebblestone', 'unpaved', 'rock']);
const SUPERFICIE_DURA = new Set(['asphalt', 'paved', 'concrete', 'paving_stones',
  'sett', 'cobblestone', 'tiles', 'metal', 'wood', 'concrete:plates', 'chipseal']);

const esTipoCamino = (t) => t.highway === 'track' || t.highway === 'path';
const esSuperficieBlanda = (t) => t.surface !== undefined && SUPERFICIE_BLANDA.has(t.surface);

if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(46)} ${v}`);
  const g = construir(ZONA_TERMINO);
  const { ways } = osm.cargar(CRUDO);
  const T = new Map();
  for (const w of ways) T.set(w.id, w.tags || {});
  const aPie = g.aristas.filter((e) => e.pie);

  log('='.repeat(96));
  log('C1 · CUÁNTAS SON');
  di('aristas transitables a pie', aPie.length);
  const km = (a) => (a.reduce((s, e) => s + e.largo, 0) / 1000).toFixed(1);
  const grupos = [
    ['highway=track', (t) => t.highway === 'track'],
    ['highway=path', (t) => t.highway === 'path'],
    ['⇒ track o path', esTipoCamino],
    ['superficie BLANDA declarada', esSuperficieBlanda],
    ['superficie DURA declarada', (t) => t.surface !== undefined && SUPERFICIE_DURA.has(t.surface)],
    ['SIN surface declarada', (t) => t.surface === undefined],
    ['⭐ camino Y superficie blanda', (t) => esTipoCamino(t) && esSuperficieBlanda(t)],
    ['⚠️ camino SIN surface (no se sabe)', (t) => esTipoCamino(t) && t.surface === undefined],
    ['con lit=yes (alumbrado)', (t) => t.lit === 'yes'],
    ['⭐ camino CON alumbrado', (t) => esTipoCamino(t) && t.lit === 'yes'],
    ['⚠️ camino SIN lit declarado', (t) => esTipoCamino(t) && t.lit === undefined],
  ];
  log('');
  log('   ' + 'grupo'.padEnd(40) + 'aristas'.padStart(8) + 'km'.padStart(9) + '   % de las de a pie');
  for (const [k, f] of grupos) {
    const a = aPie.filter((e) => f(T.get(e.way) || {}));
    log('   ' + k.padEnd(40) + String(a.length).padStart(8) + km(a).padStart(9)
      + '   ' + (100 * a.length / aPie.length).toFixed(1) + ' %');
  }
  // ⭐ los valores de surface que hay, con la lista completa delante
  const sup = {};
  for (const e of aPie) { const s = (T.get(e.way) || {}).surface || '(sin declarar)'; sup[s] = (sup[s] || 0) + 1; }
  const desc = Object.keys(sup).filter((s) => s !== '(sin declarar)' && !SUPERFICIE_BLANDA.has(s) && !SUPERFICIE_DURA.has(s));
  log('');
  di('valores de `surface` distintos', Object.keys(sup).length);
  di('⭐ sin clasificar (ni blanda ni dura)', desc.length + (desc.length ? '  ⚠️ ' + desc.join(', ') : '  ✅ ninguno'));

  log('');
  log('='.repeat(96));
  log('C2 · ⭐ DÓNDE ESTÁN — por zona. ⚠️ En Movera el camino ES la calle.');
  log('');
  log('   ' + 'zona'.padEnd(32) + 'aristas'.padStart(8) + 'caminos'.padStart(9) + '%'.padStart(7)
    + 'blandos'.padStart(9) + '%'.padStart(7));
  for (const z of ZONAS) {
    const en = aPie.filter((e) => {
      const m = e.pts[Math.floor(e.pts.length / 2)];
      const gg = aGrados(m[0], m[1]);
      return gg[1] >= z.b.sur && gg[1] <= z.b.norte && gg[0] >= z.b.oeste && gg[0] <= z.b.este;
    });
    const cam = en.filter((e) => esTipoCamino(T.get(e.way) || {}));
    const bl = en.filter((e) => esSuperficieBlanda(T.get(e.way) || {}));
    log('   ' + z.n.padEnd(32) + String(en.length).padStart(8) + String(cam.length).padStart(9)
      + (en.length ? (100 * cam.length / en.length).toFixed(1) : '—').padStart(7)
      + String(bl.length).padStart(9)
      + (en.length ? (100 * bl.length / en.length).toFixed(1) : '—').padStart(7));
  }
  log('');
  log('   ⚠️ La lectura: si en un barrio rural los caminos son un tercio de la red,');
  log('      penalizarlos ahí no es "afinar el coste": es dejar el barrio sin rutas');
  log('      razonables mientras el centro no se entera. Por eso hoy solo se cuentan.');

  log('');
  log('='.repeat(96));
  log('C3 · ⭐ ¿CUÁNTAS SON ARTICULACIÓN?  — el número que dice si penalizar sería inocuo');
  {
    const arts = new Set(G.articulaciones(g.nodos, g.ady));
    let camArt = 0, blArt = 0, total = 0;
    const sitios = [];
    for (let i = 0; i < g.aristas.length; i++) {
      const e = g.aristas[i];
      if (!e.pie) continue;
      if (!arts.has(i)) continue;
      total++;
      const t = T.get(e.way) || {};
      if (esTipoCamino(t)) {
        camArt++;
        const m = e.pts[Math.floor(e.pts.length / 2)];
        sitios.push({ g: aGrados(m[0], m[1]), largo: e.largo, nom: t.name, hw: t.highway });
      }
      if (esSuperficieBlanda(t)) blArt++;
    }
    di('aristas de articulación (a pie)', total);
    di('⭐ de ellas, caminos (track/path)', camArt + '  (' + (100 * camArt / total).toFixed(1) + ' %)');
    di('   de ellas, superficie blanda', blArt);
    log('');
    log('   ⇒ ' + camArt + ' sitios donde el ÚNICO paso es un camino. Penalizarlos mucho');
    log('      no los quita del grafo, pero los hace inalcanzables en la práctica.');
    log('      Los 6 más largos:');
    for (const s of sitios.sort((a, b) => b.largo - a.largo).slice(0, 6)) {
      log('         ' + s.largo.toFixed(0).padStart(5) + ' m  ' + s.hw.padEnd(6) + '  '
        + s.g[1].toFixed(5) + ',' + s.g[0].toFixed(5) + '   ' + (s.nom || '(sin nombre)'));
    }
  }

  log('');
  log('C4 · ⛔ NO SE TOCA NADA. Se decide cuando exista el coste (H3, con el reloj).');
}

module.exports = { esTipoCamino, esSuperficieBlanda, SUPERFICIE_BLANDA, SUPERFICIE_DURA };
