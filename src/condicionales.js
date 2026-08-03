// B · LOS PASOS CONDICIONALES — sitios por los que SE PUEDE andar, pero no siempre.
//
// ⚠️ NO son lo mismo que un `access=private`: eso es "un sitio por el que no se
//    anda". Son categorías distintas y mezclarlas infla el número y estropea la
//    decisión — pasó en la tanda 10, donde 1.650 resultaron ser 320.
//
// ⭐ TRES VÍAS DE BÚSQUEDA, no una, porque una etiqueta puede faltar:
//      1 · ETIQUETA   `tunnel=building_passage`, `covered`, `indoor`, `corridor`,
//                     `opening_hours`, `highway=elevator`
//      2 · NOMBRE     pasaje · pasadizo · galería · soportal · arcada
//      3 · GEOMETRÍA  tramos peatonales que ATRAVIESAN el polígono de un edificio
//
// ⚠️ La vía 3 es la única que puede encontrar un paso que NADIE haya etiquetado, y
//    por eso existe. Necesita los polígonos de edificio, que son un dato aparte y
//    solo se descargaron para el CENTRO DENSO (bbox 41,62-41,69 · -0,935 a -0,84).
//    Fuera de ahí la vía 3 NO OPERA, y eso se dice: no es que no haya, es que no
//    se ha mirado.
//
// ⚠️ Y la vía 2 produce falsos positivos por construcción: "Calle Manolita Marco"
//    contiene "arco". Se miden (§B3), no se disimulan.

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros, corteSegmentos } = require('./geo');

const CRUDO_EDIFICIOS = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_overpass_zaragoza-edificios-centro_geom.json');

// La ventana donde la vía GEOMÉTRICA puede operar. Fuera de ella no hay edificios
// descargados, y un cero ahí significaría "no se ha mirado", no "no hay".
const ZONA_EDIFICIOS = { sur: 41.62, oeste: -0.935, norte: 41.69, este: -0.84 };

/**
 * Vía 1 · la etiqueta lo dice.
 *
 * ⭐⭐ FIRME vs INDICIO, y la diferencia decide si se excluye o solo se marca.
 *
 * ⛔ `covered=yes` NO entra en lo firme, y corrige un número publicado. La tanda
 *    10 contó sus 179 ways dentro de los "320 pasos condicionales", y **`covered`
 *    no significa "no siempre abierto": significa "tiene techo"**. Mirados:
 *      · 65 son `service` — surtidores de gasolinera y un McAuto
 *      · hay `footway=crossing` con marquesina: un paso de peatones cubierto, que
 *        está abierto siempre
 *      · 2 son el Puente del Tercer Milenio, que tiene celosía
 *    Un paso de peatones con techo no cierra por la noche. Ver bitácora.
 *
 * ⭐ Lo que sí es firme es lo que implica ATRAVESAR ALGO QUE TIENE DUEÑO Y PUERTA:
 *    un pasaje bajo un edificio, un pasillo interior, un ascensor. Ésos pueden
 *    estar cerrados, y ésa es la definición.
 */
function porEtiqueta(t) {
  if (t.tunnel === 'building_passage') return { via: 'tunnel=building_passage', firme: true };
  if (t.highway === 'corridor') return { via: 'highway=corridor', firme: true };
  if (t.indoor === 'yes') return { via: 'indoor=yes', firme: true };
  if (t.opening_hours) return { via: 'opening_hours', firme: true };
  if (t.highway === 'elevator') return { via: 'highway=elevator', firme: true };
  if (t.covered === 'yes') return { via: 'covered=yes', firme: false };   // ⬅ solo indicio
  return null;
}

// Vía 2 · el nombre lo dice. NUNCA firme.
//
// ⚠️ `arco` NO entra: casa con "Manolita Marco" y con calles dedicadas a personas
//    apellidadas Arco. Un patrón que acierta un tercio no es una vía de búsqueda.
// ⚠️ Y en el callejero de Zaragoza **"Pasaje" es un TIPO DE VÍA**, como Calle o
//    Andador: `Pasaje de Coimbra` es `highway=residential`, o sea una calle por la
//    que pasan coches. El nombre señala dónde mirar; no dice qué hay.
// ⛔ Tampoco se propaga por nombre desde una etiqueta: probado, y se llevaba por
//    delante el Paseo de Sagasta entero —393 ways— porque una de sus aceras tiene
//    una marquesina. Compartir nombre con un pasaje no es ser el pasaje.
const PATRON_NOMBRE = /\b(pasaje|pasadizo|galer[ií]a|soportal(es)?|arcada)\b/i;
function porNombre(t) {
  const n = t.name || '';
  if (!PATRON_NOMBRE.test(n)) return null;
  return { via: 'nombre: ' + (n.match(PATRON_NOMBRE) || [])[0].toLowerCase(), firme: false };
}

/** Carga los polígonos de edificio, proyectados a metros. */
function cargarEdificios(ruta = CRUDO_EDIFICIOS) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const polis = [];
  for (const w of d.elements) {
    if (w.type !== 'way' || !w.geometry || w.geometry.length < 4) continue;
    const pts = w.geometry.map((p) => aMetros(p.lon, p.lat));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    polis.push({ id: w.id, pts, bb: [x0, y0, x1, y1] });
  }
  return { sello: d.osm3s && d.osm3s.timestamp_osm_base, polis };
}

/** Rejilla espacial de edificios, para no comparar todo contra todo. */
function indexar(polis, celda = 100) {
  const m = new Map();
  for (let i = 0; i < polis.length; i++) {
    const [x0, y0, x1, y1] = polis[i].bb;
    for (let x = Math.floor(x0 / celda); x <= Math.floor(x1 / celda); x++) {
      for (let y = Math.floor(y0 / celda); y <= Math.floor(y1 / celda); y++) {
        const k = x + ',' + y;
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(i);
      }
    }
  }
  return { m, celda };
}

/**
 * Vía 3 · ¿atraviesa este tramo el polígono de un edificio?
 *
 * ⭐ ATRAVESAR, no tocar: se exige que la parte de la línea que queda DENTRO del
 *    edificio mida al menos `minDentro` metros. Un tramo que roza una esquina o
 *    que entra 40 cm no es un pasaje, y sin este mínimo la vía 3 marcaría media
 *    ciudad — los portales, los accesos y cualquier acera pegada a una fachada.
 */
function atraviesaEdificio(pts, polis, idx, minDentro = 4) {
  const { m, celda } = idx;
  const cand = new Set();
  for (const p of pts) {
    const cx = Math.floor(p[0] / celda), cy = Math.floor(p[1] / celda);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      for (const i of (m.get(x + ',' + y) || [])) cand.add(i);
    }
  }
  for (const i of cand) {
    const po = polis[i];
    let dentro = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1];
      // se corta el segmento por el polígono y se mide el trozo interior
      const ts = [0, 1];
      for (let j = 0; j + 1 < po.pts.length; j++) {
        const c = corteSegmentos(a, b, po.pts[j], po.pts[j + 1]);
        if (c) ts.push(c.t);
      }
      ts.sort((x, y) => x - y);
      for (let j = 0; j + 1 < ts.length; j++) {
        const tm = (ts[j] + ts[j + 1]) / 2;
        const q = [a[0] + tm * (b[0] - a[0]), a[1] + tm * (b[1] - a[1])];
        if (puntoEnPoligono(q, po.pts)) {
          dentro += (ts[j + 1] - ts[j]) * Math.hypot(b[0] - a[0], b[1] - a[1]);
        }
      }
    }
    if (dentro >= minDentro) return { id: po.id, metros: dentro };
  }
  return null;
}

function puntoEnPoligono(p, poli) {
  let n = 0;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    if ((poli[i][1] > p[1]) !== (poli[j][1] > p[1])
      && p[0] < (poli[j][0] - poli[i][0]) * (p[1] - poli[i][1]) / (poli[j][1] - poli[i][1]) + poli[i][0]) n = !n;
  }
  return !!n;
}

/**
 * ⭐⭐ LA DECISIÓN: ¿se excluye del cálculo, o solo se marca?
 *
 * Se EXCLUYE solo lo FIRME —lo que la etiqueta dice que es—, porque la exclusión
 * es una acción y una acción se toma con evidencia, no con indicios.
 *
 * Se MARCA todo lo demás. Y la salvaguarda mira, cuenta y avisa: no arregla.
 *
 * ⚠️ Por qué la vía geométrica NO excluye, medido y no opinado:
 *      · recall del 36 % — no encuentra 47 de los 73 `building_passage` conocidos,
 *        entre ellos el Pasaje del Comercio, el de la Industria y el Miraflores;
 *      · y sus aciertos más profundos son plazas dentro del polígono de una
 *        manzana: 260 m "dentro de un edificio" no es un pasaje.
 *    La señal es real —29,7× la línea base— pero un instrumento con ese recall
 *    sirve para SEÑALAR DÓNDE MIRAR, no para cortar aristas.
 */
function decidir(hallazgos) {
  const firme = hallazgos.some((h) => h.firme);
  return { excluir: firme, marcar: hallazgos.length > 0 };
}

// ═════════════════════════════════════════════════════════════════════════════
// C2 · EL AVISO LLEVA EL NOMBRE DEL SITIO
// ═════════════════════════════════════════════════════════════════════════════
// ⭐ *"Puede estar cerrado"* no le sirve a nadie. *"Este tramo cruza el interior de
//    la Estación Zaragoza-Delicias"* sí: **la app no sabe el horario, pero el
//    usuario muchas veces sí.** Es lo mismo que hizo 003: no *"error"*, sino
//    *"esto no significa que no haya autobuses, significa que no lo sabemos"*.
//
// ⛔ EL NOMBRE SALE DEL DATO O NO SALE. Tres fuentes, en orden de firmeza, y
//    ninguna inventa: el edificio que atraviesa → el nombre del propio way → nada.
//    Cuando no hay, el aviso dice *"un edificio"*, que es la verdad.
//
// ⚠️ Y hay una cuarta respuesta que no es "no hay nombre": **"no se ha mirado"**.
//    Los polígonos de edificio solo se descargaron para el centro denso. Fuera de
//    esa ventana, la ausencia de edificio no significa que no lo cruce.

let _edificios = null;   // caché de proceso: el fichero son 12 MB

/** Carga (una vez) los polígonos CON su nombre, y su rejilla. */
function edificios(ruta = CRUDO_EDIFICIOS) {
  if (_edificios) return _edificios;
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const polis = [];
  for (const w of d.elements) {
    if (w.type !== 'way' || !w.geometry || w.geometry.length < 4) continue;
    const pts = w.geometry.map((p) => aMetros(p.lon, p.lat));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    // ⭐ `nodos` viaja con el polígono desde la tanda 14: las entradas `entrance=*`
    //    se emparejan con su edificio POR ID DE NODO, y sin esta lista habría que
    //    releer los 11.857 edificios por otro camino. Releer un dato es la forma
    //    barata de que dos copias divergan (fallos nº63 y nº67).
    polis.push({ id: w.id, pts, bb: [x0, y0, x1, y1], nombre: (w.tags || {}).name || null,
      nodos: w.nodes || null });
  }
  _edificios = { sello: d.osm3s && d.osm3s.timestamp_osm_base, polis, idx: indexar(polis) };
  return _edificios;
}

const enVentana = (lat, lon) => lat >= ZONA_EDIFICIOS.sur && lat <= ZONA_EDIFICIOS.norte
  && lon >= ZONA_EDIFICIOS.oeste && lon <= ZONA_EDIFICIOS.este;

/**
 * Rellena `condEdificio` y `condMirado` en las aristas condicionales.
 * ⭐ Solo mira las que YA están marcadas por etiqueta —151 ways de 98.774—, así que
 *    cuesta un pestañeo. No es la vía geométrica de búsqueda (ésa tiene un recall
 *    del 36 % y por eso no decide nada): aquí el paso ya está identificado y lo
 *    único que se busca es CÓMO SE LLAMA lo que atraviesa.
 */
function nombrar(aristas, aGrados) {
  let conNombre = 0, sinNombre = 0, fuera = 0;
  let E = null;
  for (const e of aristas) {
    if (!e.condicional) continue;
    const medio = e.pts[Math.floor(e.pts.length / 2)];
    const [lon, lat] = aGrados(medio[0], medio[1]);
    if (!enVentana(lat, lon)) { e.condMirado = false; fuera++; continue; }
    if (!E) E = edificios();
    e.condMirado = true;
    // ⚠️ el polígono que CONTIENE el punto medio del tramo. Se prefiere el que
    //    tenga nombre: un pasaje suele caer dentro de la manzana y del edificio.
    const { m, celda } = E.idx;
    const cx = Math.floor(medio[0] / celda), cy = Math.floor(medio[1] / celda);
    let elegido = null;
    for (const i of (m.get(cx + ',' + cy) || [])) {
      const po = E.polis[i];
      if (!puntoEnPoligono(medio, po.pts)) continue;
      if (!elegido || (!elegido.nombre && po.nombre)) elegido = po;
    }
    if (elegido) { e.condEdificio = { id: elegido.id, nombre: elegido.nombre }; if (elegido.nombre) conNombre++; else sinNombre++; }
    else sinNombre++;
  }
  return { conNombre, sinNombre, fuera };
}

/**
 * El aviso tal como lo vería un usuario. Devuelve null si el tramo no es condicional.
 * ⛔ Nunca inventa un nombre. Si no lo hay, lo dice.
 */
function aviso(e, nombreDeWay) {
  if (!e.condicional) return null;
  const nWay = nombreDeWay ? nombreDeWay(e.way) : null;
  const sitio = (e.condEdificio && e.condEdificio.nombre) ? `«${e.condEdificio.nombre}»`
    : (nWay ? `«${nWay}»` : null);

  if (e.condVia === 'highway=elevator') {
    return 'este tramo es un ASCENSOR' + (sitio ? ` de ${sitio}` : '')
      + ': puede estar parado, o solo funcionar en horario';
  }
  let t;
  if (sitio) t = `este tramo cruza el interior de ${sitio}`;
  else if (e.condMirado === false) {
    t = 'este tramo cruza el interior de un edificio ⚠️ (fuera de la ventana de edificios '
      + 'descargada: no se ha podido mirar cuál)';
  } else t = 'este tramo cruza el interior de un edificio (sin nombre en OSM)';

  if (e.condHorario) t += `, con horario declarado «${e.condHorario}»`;
  else t += ', y puede estar cerrado a ciertas horas — la app no sabe su horario';
  return t;
}

module.exports = { porEtiqueta, porNombre, decidir, cargarEdificios, indexar, atraviesaEdificio,
  puntoEnPoligono, edificios, nombrar, aviso, enVentana,
  PATRON_NOMBRE, ZONA_EDIFICIOS, CRUDO_EDIFICIOS };
