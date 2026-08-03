// B · EL INFORME DE LOS PASOS CONDICIONALES.
//
//   node src/informe-condicionales.js

'use strict';
const osm = require('./osm');
const C = require('./condicionales');
const P = require('./planarizar');
const G = require('./grafo');
const { CRUDO, ZONA_TERMINO } = require('./ruta');
const { aGrados } = require('./geo');

const PEATONAL = new Set(['footway', 'path', 'steps', 'pedestrian', 'corridor', 'living_street']);
const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(46)} ${v}`);

/** Devuelve Map(wayId -> {w, hallazgos:[{via,firme}], excluir}). */
function buscar(ways, opciones = {}) {
  const conGeometria = opciones.geometria !== false;
  const m = new Map();
  const anota = (w, h) => {
    if (!h) return;
    if (!m.has(w.id)) m.set(w.id, { w, hallazgos: [] });
    m.get(w.id).hallazgos.push(h);
  };
  for (const w of ways) {
    anota(w, C.porEtiqueta(w.tags || {}));
    anota(w, C.porNombre(w.tags || {}));
  }
  if (conGeometria) {
    const { polis } = C.cargarEdificios();
    const idx = C.indexar(polis);
    const enZ = (w) => w.geometry.some((g) => g.lat >= C.ZONA_EDIFICIOS.sur && g.lat <= C.ZONA_EDIFICIOS.norte
      && g.lon >= C.ZONA_EDIFICIOS.oeste && g.lon <= C.ZONA_EDIFICIOS.este);
    for (const w of ways) {
      if (!PEATONAL.has((w.tags || {}).highway) || !enZ(w)) continue;
      const g = C.atraviesaEdificio(w.pts, polis, idx);
      if (g) anota(w, { via: 'geometría: ' + g.metros.toFixed(0) + ' m dentro del edificio ' + g.id, firme: false });
    }
  }
  for (const v of m.values()) Object.assign(v, C.decidir(v.hallazgos));
  return m;
}

if (require.main === module) {
  const rec = osm.proyectar(osm.recortar(osm.cargar(CRUDO).ways, ZONA_TERMINO));
  const hall = buscar(rec);

  log('='.repeat(96));
  log('B1 · ⭐⭐ POSITIVO DE CONTROL — el Pasaje Palafox (41.65121,-0.88324)');
  const pal = [...hall.values()].filter((h) => ((h.w.tags || {}).name || '').includes('Pasaje Palafox'));
  di('ways del Pasaje Palafox encontrados', pal.length);
  for (const h of pal) di('  way ' + h.w.id, h.hallazgos.map((x) => x.via).join(' · ') + '   ⇒ ' + (h.excluir ? 'SE EXCLUYE' : 'solo se marca'));
  if (!pal.length || !pal.every((h) => h.excluir)) {
    log('   ⛔⛔ LA BÚSQUEDA ESTÁ ROTA. No se sigue.'); process.exit(1);
  }
  log('   ⇒ ✅ encontrado por etiqueta y por nombre, y excluido');
  log('');
  log('   ⛔ CORRECCIÓN AL BRIEFING, reportada hacia arriba: el briefing dice que el');
  log('      Palafox NO estaba entre los 96 `building_passage`. Sí estaba — sus tres');
  log('      ways lo llevan. Lo que sí es cierto es que ADEMÁS tiene una punta sin');
  log('      soldar de 4,94 m, y las dos cosas son ciertas a la vez.');

  log('');
  log('='.repeat(96));
  log('B2 · ¿CUÁNTOS HAY?  — clasificados por CÓMO se detectaron y por si son FIRMES');
  const porVia = {};
  for (const h of hall.values()) {
    for (const x of h.hallazgos) {
      const k = (x.firme ? '✅ FIRME  · ' : '⚠️ indicio · ') + x.via.split(':')[0];
      porVia[k] = (porVia[k] || 0) + 1;
    }
  }
  for (const [k, v] of Object.entries(porVia).sort((a, b) => b[1] - a[1])) log('   ' + String(v).padStart(5) + '  ' + k);
  const excl = [...hall.values()].filter((h) => h.excluir);
  log('');
  di('ways señalados por alguna vía', hall.size);
  di('⇒ ways EXCLUIDOS (evidencia firme)', excl.length);
  di('⇒ ways solo MARCADOS (indicio)', hall.size - excl.length);
  log('');
  log('   ⛔ Y CORRIGE UN NÚMERO PUBLICADO: la tanda 10 dio 320 pasos condicionales.');
  const cov = rec.filter((w) => (w.tags || {}).covered === 'yes').length;
  di('   de aquellos, `covered=yes`', cov + '  ⬅ NO son pasos condicionales: tienen techo');
  log('      65 son surtidores de gasolinera (`service`), y hay pasos de peatones con');
  log('      marquesina. Un paso de peatones cubierto no cierra por la noche.');

  log('');
  log('='.repeat(96));
  log('B3 · ⚠️ LOS FALSOS POSITIVOS — la laxitud vive en los casi-aciertos');
  const soloNombre = [...hall.values()].filter((h) => h.hallazgos.every((x) => x.via.startsWith('nombre')));
  di('ways que SOLO casan por nombre', soloNombre.length);
  for (const h of soloNombre) {
    const t = h.w.tags, g = h.w.geometry[Math.floor(h.w.geometry.length / 2)];
    log('      ' + String(t.name).padEnd(32) + '[' + String(t.highway).padEnd(12) + ']  '
      + g.lat.toFixed(5) + ',' + g.lon.toFixed(5)
      + (['residential', 'living_street', 'secondary'].includes(t.highway) ? '   ⛔ pasan coches: NO es un pasaje' : ''));
  }
  const arco = rec.filter((w) => /\barco\b/i.test((w.tags || {}).name || ''));
  di('ways que casarían con el patrón `arco`', arco.length + '  ⬅ descartado ANTES de contar');
  log('      "Calle Manolita Marco", "Mosén Félix Marco", "Ricardo del Arco": apellidos.');

  log('');
  log('='.repeat(96));
  log('B4 · ⭐ EXCLUIR LOS FIRMES — ¿alguno era el ÚNICO PASO a algún sitio?');
  {
    const ids = new Set([...hall.values()].filter((h) => h.excluir).map((h) => h.w.id));
    const p = P.planarizar(rec);
    const T = new Map(); for (const w of rec) T.set(w.id, w.tags || {});
    const f0 = (e) => P.transitableAPie(T.get(e.way) || {});
    const comp = (f) => {
      const ady = Array.from({ length: p.nodos.length }, () => []);
      let n = 0;
      for (let i = 0; i < p.aristas.length; i++) {
        const e = p.aristas[i]; if (!f(e)) continue; n++;
        ady[e.a].push({ n: e.b, w: e.largo, e: i }); ady[e.b].push({ n: e.a, w: e.largo, e: i });
      }
      const c = G.componentes(p.nodos, ady);
      return { n, comps: c.n, mayor: Math.max(...c.tamanos), ady };
    };
    const A = comp(f0), B = comp((e) => f0(e) && !ids.has(e.way));
    di('aristas de pasos condicionales firmes', A.n - B.n);
    di('componentes', `${A.comps} -> ${B.comps}   (+${B.comps - A.comps})`);
    di('componente mayor', `${A.mayor} -> ${B.mayor}   (${B.mayor - A.mayor})`);
    const arts = new Set(G.articulaciones(p.nodos, A.ady));
    let art = 0;
    const sitios = [];
    for (let i = 0; i < p.aristas.length; i++) {
      const e = p.aristas[i];
      if (arts.has(i) && f0(e) && ids.has(e.way)) {
        art++;
        const m = e.pts[Math.floor(e.pts.length / 2)];
        sitios.push({ g: aGrados(m[0], m[1]), way: e.way, nom: (T.get(e.way) || {}).name });
      }
    }
    di('⭐ de ellas ARTICULACIÓN (único paso)', art);
    log('      las 8 primeras, para que se puedan mirar:');
    for (const s of sitios.slice(0, 8)) {
      log('         ' + s.g[1].toFixed(5) + ',' + s.g[0].toFixed(5) + '   way ' + String(s.way).padEnd(12) + (s.nom || '(sin nombre)'));
    }
    log('   ⇒ ' + (B.mayor < A.mayor
      ? '⚠️ excluirlos deja ' + (A.mayor - B.mayor) + ' nodos fuera de la componente mayor.'
      : '✅ no aísla nada'));
    log('      ⭐ Y es lo correcto: si el único acceso a un portal es un pasaje que');
    log('         cierra, ese portal NO siempre es alcanzable. Decirlo es el trabajo.');
  }
}

module.exports = { buscar, PEATONAL };
