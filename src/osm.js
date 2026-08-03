// Carga del crudo de OSM y recorte a una zona.
//
// El crudo es la salida literal de Overpass (`out geom`): ways con tags y con la
// geometría completa embebida. NO se edita nunca — editar la evidencia la destruye.

'use strict';
const fs = require('fs');
const { aMetros } = require('./geo');

/** Lee el crudo y devuelve {sello, ways}. El sello se propaga a todo lo que salga de aquí. */
function cargar(ruta) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  return {
    sello: d.osm3s && d.osm3s.timestamp_osm_base,
    generador: d.generator,
    ways: d.elements.filter((e) => e.type === 'way' && e.geometry && e.geometry.length >= 2),
  };
}

/**
 * Recorta a un bbox {sur, oeste, norte, este} en grados.
 * ⚠️ Se conserva el way ENTERO si CUALQUIER vértice cae dentro. Recortar la
 *    geometría por el borde partiría calles y crearía puntas falsas justo en el
 *    límite, que es donde menos se miran. El borde se trata al final, no aquí.
 */
function recortar(ways, bbox) {
  const dentro = (p) => p.lat >= bbox.sur && p.lat <= bbox.norte && p.lon >= bbox.oeste && p.lon <= bbox.este;
  return ways.filter((w) => w.geometry.some(dentro));
}

/** Proyecta la geometría de un way a metros (EPSG:25830) una sola vez. */
function proyectar(ways) {
  for (const w of ways) {
    w.pts = w.geometry.map((p) => aMetros(p.lon, p.lat));
  }
  return ways;
}

/** Superficie de un bbox en km², medida en metros de verdad. */
function areaKm2(bbox) {
  const a = aMetros(bbox.oeste, bbox.sur);
  const b = aMetros(bbox.este, bbox.norte);
  return Math.abs((b[0] - a[0]) * (b[1] - a[1])) / 1e6;
}

/**
 * Censo de cúmulos: agrupa los ways por celda de 1 grado.
 *
 * ⚠️ Existe por un fallo, no por elegancia. La consulta de la tanda 8 pedía
 *    `area["name"="Zaragoza"]["admin_level"="8"]`, y eso NO nombra un sitio:
 *    nombra una CLASE de sitios. Vinieron cuatro Zaragozas — España, Costa Rica
 *    y Zaragoza de Puebla (México)—, 398 ways de otro continente escondidos
 *    dentro de 48.211. No se notan en el volumen; mueven el bbox 18.000 km.
 *    Ver bitácora nº57.
 *
 * ⭐ Se imprime SIEMPRE antes de recortar, para que la exclusión sea declarada
 *    y no silenciosa. Un recorte que tira dato sin decirlo es una mentira lenta.
 */
function clusters(ways) {
  const m = new Map();
  for (const w of ways) {
    const p = w.geometry[0];
    const k = Math.floor(p.lat) + ',' + Math.floor(p.lon);
    if (!m.has(k)) m.set(k, { n: 0, lat: 0, lon: 0, ejemplos: [] });
    const c = m.get(k);
    c.n++; c.lat += p.lat; c.lon += p.lon;
    if (c.ejemplos.length < 3 && (w.tags || {}).name) c.ejemplos.push(w.tags.name);
  }
  return [...m.values()]
    .map((c) => ({ ways: c.n, lat: c.lat / c.n, lon: c.lon / c.n, ejemplos: c.ejemplos }))
    .sort((a, b) => b.ways - a.ways);
}

/**
 * Bbox real ocupado por un conjunto de ways. La forma de auditar una descarga:
 * ⭐ no por su VOLUMEN (48.211 ways es perfectamente creíble) sino por su
 *    EXTENSIÓN (un término municipal de 27 millones de km² no lo es).
 */
function extension(ways) {
  let sur = 90, norte = -90, oeste = 180, este = -180;
  for (const w of ways) for (const p of w.geometry) {
    if (p.lat < sur) sur = p.lat;
    if (p.lat > norte) norte = p.lat;
    if (p.lon < oeste) oeste = p.lon;
    if (p.lon > este) este = p.lon;
  }
  return { sur, oeste, norte, este };
}

module.exports = { cargar, recortar, proyectar, areaKm2, clusters, extension };
