// ⭐⭐ ¿PARTEN LOS RÍOS EL GRAFO?  — la comprobación de mayor impacto del proyecto.
//
// Un puente sin coser deja media ciudad incomunicada Y EL MAPA SE VE PERFECTO:
// las dos orillas están dibujadas, las calles están todas, no falta ni una línea.
// El fallo no es visible, es topológico. Y en el casco NO PODÍA APARECER, porque
// casi toda aquella zona estaba en la misma orilla del Ebro.
//
// ⭐ Los puntos NO se eligen a dedo (ley 26: elegir el caso que sale bien no
//    prueba nada). Se sortean con semilla declarada entre los nodos URBANOS de
//    cada margen, y la pertenencia a un margen se decide contando cortes con la
//    geometría REAL del río, no con un eje que me haya inventado yo.
//
// ⚠️ La geometría de los ríos es un dato aparte, descargado con bbox y NO con
//    `area["name"=...]` — precisamente para no repetir el fallo de los cuatro
//    municipios homónimos (bitácora nº57).

'use strict';
const path = require('path');
const fs = require('fs');
const { aMetros, dist, corteSegmentos } = require('./geo');

const CRUDO_RIOS = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_overpass_zaragoza-rios_geom-y-tags.json');

// Los tres ríos del briefing. El Gállego aparece con DOS nombres en OSM
// ("Río Gállego" y "Gállego"): son el mismo río y van juntos, dicho aquí.
const RIOS = {
  Ebro: ['Río Ebro'],
  Huerva: ['Río Huerva'],
  Gállego: ['Río Gállego', 'Gállego'],
};

/** Carga los ríos y devuelve {nombre: [segmento...]} en metros (EPSG:25830). */
function cargar(ruta = CRUDO_RIOS) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const sello = d.osm3s && d.osm3s.timestamp_osm_base;
  const porRio = {};
  for (const [rio, nombres] of Object.entries(RIOS)) {
    const segs = [];
    for (const w of d.elements) {
      if (w.type !== 'way' || !w.geometry || w.geometry.length < 2) continue;
      if (!nombres.includes((w.tags || {}).name)) continue;
      const pts = w.geometry.map((p) => aMetros(p.lon, p.lat));
      for (let k = 0; k + 1 < pts.length; k++) segs.push([pts[k], pts[k + 1]]);
    }
    porRio[rio] = segs;
  }
  return { sello, porRio };
}

/**
 * ⭐ De qué margen es cada punto, sin inventarme un eje: se cuenta cuántas veces
 *    el segmento recto A→B corta el río. IMPAR = orillas distintas.
 *    No hace falta encadenar los ways, ni orientarlos, ni saber cuál es "norte".
 */
function cortesConRio(a, b, segs) {
  let n = 0;
  for (const [p, q] of segs) if (corteSegmentos(a, b, p, q)) n++;
  return n;
}

/** Distancia mínima de un punto al río (para exigir que la prueba sea RIBEREÑA). */
function distAlRio(p, segs) {
  let m = Infinity;
  for (const [a, b] of segs) {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const L2 = vx * vx + vy * vy;
    let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
    if (d < m) m = d;
  }
  return m;
}

/** Azar reproducible. La semilla se declara en el informe: sin semilla no hay prueba. */
function azar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Nodos URBANOS: los que tienen al menos `minVecinos` nodos del grafo a menos de
 * `radio` metros. ⚠️ Sin esto el sorteo cae en caminos de campo y la prueba
 * mediría otra cosa: que el monte está desconectado, no que la ciudad lo está.
 */
function nodosUrbanos(nodos, ady, { radio = 150, minVecinos = 25 } = {}) {
  const C = radio;
  const rej = new Map();
  for (let i = 0; i < nodos.length; i++) {
    if (!ady[i] || !ady[i].length) continue;
    const k = Math.floor(nodos[i].x / C) + ',' + Math.floor(nodos[i].y / C);
    if (!rej.has(k)) rej.set(k, []);
    rej.get(k).push(i);
  }
  const urbanos = [];
  for (let i = 0; i < nodos.length; i++) {
    if (!ady[i] || !ady[i].length) continue;
    const cx = Math.floor(nodos[i].x / C), cy = Math.floor(nodos[i].y / C);
    let n = 0;
    for (let x = cx - 1; x <= cx + 1 && n < minVecinos; x++) {
      for (let y = cy - 1; y <= cy + 1 && n < minVecinos; y++) {
        for (const j of (rej.get(x + ',' + y) || [])) {
          if (j !== i && Math.hypot(nodos[i].x - nodos[j].x, nodos[i].y - nodos[j].y) <= radio) n++;
          if (n >= minVecinos) break;
        }
      }
    }
    if (n >= minVecinos) urbanos.push(i);
  }
  return urbanos;
}

module.exports = { cargar, cortesConRio, distAlRio, azar, nodosUrbanos, CRUDO_RIOS, RIOS };
