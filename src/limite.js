// EL LÍMITE MUNICIPAL DE ZARAGOZA — rel 345740, INE 50297.
//
// ⭐ Existe porque el "borde" de este grafo NO es un rectángulo. Overpass devuelve
//    el way ENTERO cuando cualquiera de sus nodos cae dentro del área, así que las
//    carreteras que salen del término vienen con su cola colgando fuera, y las que
//    entran desde fuera NO vienen: la calle se acaba en mitad del campo.
//
//    En la tanda 8 esto se midió contra el borde del bbox del casco y valió. Aquí
//    NO vale: una componente puede estar a 17 km del bbox y aun así pegada al
//    límite del término. Medir contra el rectángulo habría clasificado como
//    "trozo urbano aislado" lo que es un pueblo al que se llega por otro municipio.
//
// ⚠️ La consulta lleva bbox ADEMÁS del nombre, para no repetir el fallo de las
//    cuatro Zaragozas (bitácora nº57). Devolvió 1 relación, y se comprueba.

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros } = require('./geo');

const CRUDO_LIMITE = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_overpass_zaragoza-limite_geom.json');

/** Devuelve {sello, segs, bbox} con el límite en metros (EPSG:25830). */
function cargar(ruta = CRUDO_LIMITE) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const rels = d.elements.filter((e) => e.type === 'relation');
  if (rels.length !== 1) throw new Error(`el límite devolvió ${rels.length} relaciones, no 1: homónimos otra vez`);
  const r = rels[0];
  if (r.tags['ine:municipio'] !== '50297') throw new Error('la relación no es el municipio 50297');
  const segs = [];
  let sur = 90, norte = -90, oeste = 180, este = -180;
  for (const m of r.members) {
    if (!m.geometry || m.geometry.length < 2) continue;
    if (m.role && m.role !== 'outer') continue;         // los huecos (inner) no cuentan como borde exterior
    const pts = m.geometry.map((p) => aMetros(p.lon, p.lat));
    for (const p of m.geometry) {
      if (p.lat < sur) sur = p.lat; if (p.lat > norte) norte = p.lat;
      if (p.lon < oeste) oeste = p.lon; if (p.lon > este) este = p.lon;
    }
    for (let k = 0; k + 1 < pts.length; k++) segs.push([pts[k], pts[k + 1]]);
  }
  return { sello: d.osm3s && d.osm3s.timestamp_osm_base, rel: r.id, segs,
    bbox: { sur, oeste, norte, este } };
}

/** Distancia de un punto (en metros) al límite municipal. */
function distancia(p, segs) {
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

/**
 * ¿Está el punto DENTRO del término? Rayo hacia el este contando cortes.
 * ⚠️ Funciona sobre TODOS los segmentos sin ensamblar los anillos: mientras el
 *    conjunto forme anillos cerrados —lo forma, es un multipolígono válido— la
 *    paridad de cortes es la misma. Se comprueba con positivos de control.
 */
function dentro(p, segs) {
  let n = 0;
  for (const [a, b] of segs) {
    if ((a[1] > p[1]) === (b[1] > p[1])) continue;
    const x = a[0] + ((p[1] - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
    if (x > p[0]) n++;
  }
  return n % 2 === 1;
}

module.exports = { cargar, distancia, dentro, CRUDO_LIMITE };
