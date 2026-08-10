// EL LECTOR DEL FEED — abre el ZIP del NAP y devuelve tablas. Nada más.
//
// ⛔ POR QUÉ ESTO NO USA NINGUNA LIBRERÍA DE ZIP: el proyecto es de cero
//    dependencias, y un ZIP sin cifrar es un formato de veinte líneas. La
//    alternativa era meter un paquete para leer ocho ficheros de texto.
//
// ⚠️ LO QUE ESTE LECTOR **NO** HACE, dicho antes de que nadie lo suponga:
//    · no valida el GTFS  · no interpreta ninguna columna  · no toca la red
//    Solo descomprime y parte por comas. Todo lo que signifique algo se decide
//    fuera, y sobre todo en `identidad.js`.

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/** El crudo del 10/08. ⛔ No se vuelve a descargar: se mide siempre el mismo. */
const RUTA_FEED = path.join(__dirname, '..', '..', 'data', 'exploracion',
  '2026-08-10_nap_gtfs-ficha1176.zip');

const FIRMA_FIN_CENTRAL = 0x06054b50;

/**
 * Descomprime el ZIP entero en memoria. Devuelve `{nombre: Buffer}`.
 *
 * ⚠️ Se lee por el DIRECTORIO CENTRAL, no escaneando cabeceras locales. Las
 *    cabeceras locales pueden traer los tamaños a cero y remitir a un descriptor
 *    posterior; el directorio central siempre los tiene. Leerlo mal no da error:
 *    da un fichero truncado.
 */
function abrirZip(ruta = RUTA_FEED) {
  if (!fs.existsSync(ruta)) {
    throw new Error(`⛔ no existe el feed en ${ruta}. Esta tanda NO lo descarga: `
      + 'se mide el crudo del 10/08 y solo ese.');
  }
  const b = fs.readFileSync(ruta);

  let i = b.length - 22;
  while (i >= 0 && b.readUInt32LE(i) !== FIRMA_FIN_CENTRAL) i--;
  if (i < 0) throw new Error('⛔ no se encuentra el fin del directorio central: esto no es un ZIP.');

  const n = b.readUInt16LE(i + 10);
  let off = b.readUInt32LE(i + 16);
  const out = {};

  for (let k = 0; k < n; k++) {
    const largoNombre = b.readUInt16LE(off + 28);
    const largoExtra = b.readUInt16LE(off + 30);
    const largoComentario = b.readUInt16LE(off + 32);
    const nombre = b.toString('utf8', off + 46, off + 46 + largoNombre);
    const metodo = b.readUInt16LE(off + 10);
    const comprimido = b.readUInt32LE(off + 20);
    const local = b.readUInt32LE(off + 42);

    // El offset de los datos depende de la cabecera LOCAL, cuyos campos de
    // nombre y extra pueden medir distinto que los del directorio central.
    const localNombre = b.readUInt16LE(local + 26);
    const localExtra = b.readUInt16LE(local + 28);
    const ini = local + 30 + localNombre + localExtra;

    const crudo = b.subarray(ini, ini + comprimido);
    out[nombre] = metodo === 0 ? crudo : zlib.inflateRawSync(crudo);

    off += 46 + largoNombre + largoExtra + largoComentario;
  }
  return out;
}

/**
 * CSV a lista de objetos.
 *
 * ⚠️ Respeta las comillas dobles, porque `stop_name` las lleva: hay nombres con
 *    coma dentro («Vía Hispanidad N.º 73 / Nuestra Señora De Los ángeles») y
 *    partir a lo bruto por comas desplazaría todas las columnas siguientes sin
 *    dar ni un error.
 * ⚠️ Y quita el BOM: si la primera cabecera se llama "﻿stop_id", ninguna
 *    consulta por `stop_id` encuentra nada, y el resultado es un cero limpio.
 */
function tabla(buf) {
  const lineas = buf.toString('utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length);
  const cab = lineas[0].split(',').map((s) => s.trim());
  const filas = new Array(lineas.length - 1);
  for (let i = 1; i < lineas.length; i++) {
    const celdas = [];
    let cur = '';
    let entreComillas = false;
    for (const ch of lineas[i]) {
      if (ch === '"') { entreComillas = !entreComillas; continue; }
      if (ch === ',' && !entreComillas) { celdas.push(cur); cur = ''; continue; }
      cur += ch;
    }
    celdas.push(cur);
    const o = {};
    for (let c = 0; c < cab.length; c++) o[cab[c]] = (celdas[c] ?? '').trim();
    filas[i - 1] = o;
  }
  return filas;
}

/**
 * Las tablas que hacen falta, ya parseadas, y el modo de cada parada.
 *
 * ⭐ EL MODO NO SALE DE `stops.txt`: sale de qué rutas paran ahí. `stops.txt` no
 *    tiene ninguna columna que diga «esto es tranvía» —su `location_type` está
 *    vacío en 934 filas y a 0 en 50, que es la MISMA cosa según la norma—. El
 *    único camino honesto es stop_times × trips × routes.route_type.
 */
function cargar(ruta = RUTA_FEED) {
  const z = abrirZip(ruta);
  const stops = tabla(z['stops.txt']);
  const routes = tabla(z['routes.txt']);
  const trips = tabla(z['trips.txt']);
  const stopTimes = tabla(z['stop_times.txt']);
  const feedInfo = tabla(z['feed_info.txt']);

  const tipoDeRuta = new Map(routes.map((r) => [r.route_id, r.route_type]));
  const tipoDeViaje = new Map(trips.map((t) => [t.trip_id, tipoDeRuta.get(t.route_id)]));
  const rutaDeViaje = new Map(trips.map((t) => [t.trip_id, t.route_id]));

  const modo = new Map();
  const lineasDe = new Map();
  for (const s of stopTimes) {
    const tipo = tipoDeViaje.get(s.trip_id);
    if (tipo === undefined) continue;
    modo.set(s.stop_id, tipo === '900' ? 'tranvia' : 'bus');
    let set = lineasDe.get(s.stop_id);
    if (!set) { set = new Set(); lineasDe.set(s.stop_id, set); }
    set.add(rutaDeViaje.get(s.trip_id));
  }

  return { stops, routes, trips, feedInfo, modo, lineasDe, zip: z };
}

module.exports = { cargar, abrirZip, tabla, RUTA_FEED };
