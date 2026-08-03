// B · LA CAPA MUNICIPAL COMPLETA — `movilidad:MU1_jerarquia_viaria`, 3.644 tramos.
//
// ⭐ D0 dice que el dato municipal **VERIFICA, NO DECIDE**. Éste es exactamente el
//    caso para el que existe esa decisión: una fuente **independiente de OSM** con
//    la que contrastar justo donde OSM se calla.
//
// ⛔ Y por eso aquí NO se corrige nada. Se mide si el enganche acierta. Corregir
//    con esta capa sería otra decisión, y no está tomada.
//
// La descarga (una sola petición, sello y cabeceras guardados al lado):
//   GET https://idezar-sig.zaragoza.es/servicios/geoserver/wfs
//       ?service=WFS&version=2.0.0&request=GetFeature
//       &typeNames=movilidad:MU1_jerarquia_viaria
//       &outputFormat=application/json&srsName=EPSG:4326
//
// ⚠️ `srsName=EPSG:4326` EXPLÍCITO. Sin él este servidor devuelve **metros** (UTM
//    30N) dentro de un GeoJSON, que es un fichero perfectamente válido y
//    perfectamente equivocado. Está medido en el reconocimiento de la tanda 0.

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros } = require('./geo');

const FICHERO = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_wfs_movilidad-MU1_jerarquia_viaria_completa.json');

let _cache = null;

/**
 * Carga la capa, proyectada a metros y agrupada por `codigo`.
 * @returns {{n, porCodigo:Map, puntos:Array, rejilla, bbox, sello}}
 */
function cargar(ruta = FICHERO) {
  if (_cache) return _cache;
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const porCodigo = new Map();
  const puntos = [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  let sinCodigo = 0;
  for (const f of d.features) {
    if (!f.geometry) continue;
    const cod = f.properties && f.properties.codigo;
    const k = cod == null ? null : String(cod);
    const pts = [];
    for (const linea of f.geometry.coordinates) {
      for (const p of linea) {
        // ⚠️ [lon, lat]: comprobado con el bbox, no supuesto por el nombre del CRS.
        const m = aMetros(p[0], p[1]);
        pts.push(m);
        // ⭐ el CÓDIGO viaja con el punto desde la tanda 14. Sin él se puede
        //    contestar «hay un eje cerca» pero no «es el eje de OTRA calle», y esa
        //    segunda pregunta es justo la que separa una firma inocente de un
        //    enganche a la calle equivocada.
        puntos.push({ m, cod: k });
        if (m[0] < x0) x0 = m[0]; if (m[0] > x1) x1 = m[0];
        if (m[1] < y0) y0 = m[1]; if (m[1] > y1) y1 = m[1];
      }
    }
    if (k == null) { sinCodigo++; continue; }
    if (!porCodigo.has(k)) porCodigo.set(k, { pts: [], nombre: null, tipos: new Set() });
    const v = porCodigo.get(k);
    v.pts.push(...pts);
    if (!v.nombre && f.properties.calle_2024) v.nombre = f.properties.calle_2024;
    if (f.properties.tipo) v.tipos.add(f.properties.tipo);
  }
  // rejilla de TODOS los puntos, para la pregunta "¿está esta zona cubierta?"
  const celda = 100;
  const rejilla = new Map();
  for (const p of puntos) {
    const k = Math.floor(p.m[0] / celda) + ',' + Math.floor(p.m[1] / celda);
    if (!rejilla.has(k)) rejilla.set(k, []);
    rejilla.get(k).push(p);
  }
  _cache = { n: d.features.length, porCodigo, puntos, rejilla, celda, sinCodigo,
    bbox: { x0, y0, x1, y1 }, sello: d.timeStamp, crs: d.crs && d.crs.properties && d.crs.properties.name,
    numberMatched: d.numberMatched, ruta };
  return _cache;
}

/** Distancia mínima de un punto (en metros) a un conjunto de vértices. */
function dA(m, pts) {
  let d = Infinity;
  for (const p of pts) {
    const x = Math.hypot(m[0] - p[0], m[1] - p[1]);
    if (x < d) d = x;
  }
  return d;
}

/**
 * ¿Hay algún tramo municipal —DEL CÓDIGO QUE SEA— cerca de este punto?
 * ⛔ Es la condición imprescindible antes de medir nada: sin ella, "lejos de mi
 *    calle" y "aquí no llega la capa" son indistinguibles, y eso ya falseó la
 *    medición de la tanda 12 (mediana 39,5 m, p99 de 3 km).
 */
function cubierto(M, m, radio = 60) {
  const cx = Math.floor(m[0] / M.celda), cy = Math.floor(m[1] / M.celda);
  const r = Math.ceil(radio / M.celda);
  for (let x = cx - r; x <= cx + r; x++) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (const p of (M.rejilla.get(x + ',' + y) || [])) {
        if (Math.hypot(m[0] - p.m[0], m[1] - p.m[1]) <= radio) return true;
      }
    }
  }
  return false;
}

/** El tramo municipal más cercano de CUALQUIER código, y su distancia. */
function masCercanoDeCualquiera(M, m, radio = 200) {
  let mejor = null, md = Infinity;
  const cx = Math.floor(m[0] / M.celda), cy = Math.floor(m[1] / M.celda);
  const r = Math.ceil(radio / M.celda);
  for (let x = cx - r; x <= cx + r; x++) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (const p of (M.rejilla.get(x + ',' + y) || [])) {
        const d = Math.hypot(m[0] - p.m[0], m[1] - p.m[1]);
        if (d < md) { md = d; mejor = p; }
      }
    }
  }
  return { d: md, p: mejor ? mejor.m : null, cod: mejor ? mejor.cod : null };
}

/**
 * ⭐⭐ El eje municipal más cercano **DE OTRA CALLE** que no sea `codigoPropio`.
 * Es la pregunta que separa «la geometría produce esta firma» de «el enganche está
 * en la calle equivocada»: estar lejos del eje propio puede ser una acera de
 * avenida; estar ENCIMA del eje de otra calle no.
 * @returns {{d:number, cod:string|null}}
 */
function masCercanoDeOtra(M, m, codigoPropio, radio = 200) {
  let md = Infinity, cod = null;
  const cx = Math.floor(m[0] / M.celda), cy = Math.floor(m[1] / M.celda);
  const r = Math.ceil(radio / M.celda);
  for (let x = cx - r; x <= cx + r; x++) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (const p of (M.rejilla.get(x + ',' + y) || [])) {
        if (p.cod === codigoPropio || p.cod == null) continue;
        const d = Math.hypot(m[0] - p.m[0], m[1] - p.m[1]);
        if (d < md) { md = d; cod = p.cod; }
      }
    }
  }
  return { d: md, cod };
}

module.exports = { cargar, dA, cubierto, masCercanoDeCualquiera, masCercanoDeOtra, FICHERO };
