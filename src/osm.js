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

module.exports = { cargar, recortar, proyectar, areaKm2 };
