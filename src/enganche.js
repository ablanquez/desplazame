// D · EL ENGANCHE COMPLETO, CON SUS DOS SALVAGUARDAS.
//
// ⛔ LA SALVAGUARDA MIRA, CUENTA Y AVISA. NO ARREGLA.
//    Corregir por cercanía es reintroducir el emparejamiento aproximado que ya
//    falló en el 29,6 % del dataset heredado: se cambia lo seguro por lo probable.
//
// Dos testigos INDEPENDIENTES, que es lo que los hace valer:
//    1 · el `codigoVia` municipal — dice cómo se llama la calle del portal
//    2 · el consenso de la nube — dice a qué objeto de OSM van los DEMÁS portales
//        de esa misma calle
//    El primero viene del Ayuntamiento; el segundo, de la geometría. Si los dos
//    dicen lo mismo, el enganche es sólido; si discrepan, se marca.

'use strict';
const P = require('./portales');
const { transitableAPie } = require('./planarizar');

/**
 * Engancha todos los portales al grafo.
 * @returns {{portales:Array, porVia:Map, contadores:Object}}
 */
function enganchar(g, tagsPorWay, opciones = {}) {
  const maxRadio = opciones.maxRadio ?? 120;
  const portales = opciones.portales || P.cargarPortales();
  const vias = opciones.vias || P.cargarVias();

  // ⚠️ solo se engancha a aristas TRANSITABLES A PIE: un portal cuelga de la calle
  //    por la que se llega andando, no de la autovía que pasa por detrás.
  const aristas = g.aristas;
  const idx = P.indexarAristas(aristas, (e) => e.pie);
  const nombreDe = (e) => ((tagsPorWay.get(e.way) || {}).name) || null;
  const nucleoDe = (e) => P.nucleo(nombreDe(e));

  const res = [];
  for (const p of portales) {
    const { mejor, segunda } = P.engancharUno(p.m, aristas, idx, nucleoDe, maxRadio);
    const via = vias.get(p.codigoVia) || null;
    const o = {
      ...p,
      via,
      enganchado: !!mejor,
      arista: mejor ? mejor.i : null,
      seg: mejor ? mejor.k : null,
      d: mejor ? mejor.d : null,
      t: mejor ? mejor.t : null,
      q: mejor ? mejor.q : null,
      nombreOsm: mejor ? nombreDe(aristas[mejor.i]) : null,
      nucleoOsm: mejor ? nucleoDe(aristas[mejor.i]) : null,
      // ⭐ el empate: si la segunda vía distinta está casi igual de cerca, el
      //    enganche no es un acierto, es una moneda al aire. Se cuenta aparte.
      segundaD: segunda ? segunda.d : null,
      segundaNucleo: segunda ? nucleoDe(aristas[segunda.i]) : null,
      lado: null,
    };
    if (mejor) {
      const e = aristas[mejor.i];
      o.lado = P.ladoDe(p.m, e.pts[mejor.k], e.pts[mejor.k + 1]);
      o.precision = e.precision;
      o.peatonal = ['footway', 'path', 'steps', 'pedestrian', 'corridor', 'living_street'].includes(e.highway);
    }
    res.push(o);
  }

  // ── SALVAGUARDA 1 · el `codigoVia` municipal ───────────────────────────────
  for (const o of res) {
    if (!o.enganchado) { o.codigoVia_estado = 'sin-enganche'; continue; }
    if (!o.via || !o.via.nucleo) { o.codigoVia_estado = 'sin-nombre-municipal'; continue; }
    if (!o.nucleoOsm) { o.codigoVia_estado = 'osm-sin-nombre'; continue; }
    o.codigoVia_estado = o.via.nucleo === o.nucleoOsm ? 'concuerda' : 'DISCORDA';
  }

  // ── SALVAGUARDA 2 · el consenso de la nube ─────────────────────────────────
  // ⭐ Para cada `codigoVia`, a qué núcleo de OSM van la MAYORÍA de sus portales.
  //    Un portal que se sale del consenso de sus hermanos está señalado por la
  //    geometría, sin haber mirado una sola letra del nombre.
  const porVia = new Map();
  for (const o of res) {
    if (!porVia.has(o.codigoVia)) porVia.set(o.codigoVia, []);
    porVia.get(o.codigoVia).push(o);
  }
  for (const [cv, lista] of porVia) {
    const votos = new Map();
    for (const o of lista) {
      if (!o.nucleoOsm) continue;
      votos.set(o.nucleoOsm, (votos.get(o.nucleoOsm) || 0) + 1);
    }
    let cons = null, max = 0;
    for (const [k, v] of votos) if (v > max) { max = v; cons = k; }
    const conNombre = lista.filter((o) => o.nucleoOsm).length;
    for (const o of lista) {
      o.consenso = cons;
      o.consensoFuerza = conNombre ? max / conNombre : 0;
      o.consensoVotos = conNombre;
      // ⚠️ el consenso NO opina si la vía tiene menos de 3 portales con nombre:
      //    con uno o dos, "la mayoría" es una palabra grande para nada.
      if (conNombre < 3) o.consenso_estado = 'nube-no-opina';
      else if (!o.nucleoOsm) o.consenso_estado = 'osm-sin-nombre';
      else o.consenso_estado = o.nucleoOsm === cons ? 'concuerda' : 'DISCORDA';
    }
  }

  const c = {
    total: res.length,
    enganchados: res.filter((o) => o.enganchado).length,
    noEnganchados: res.filter((o) => !o.enganchado).length,
  };
  return { portales: res, porVia, contadores: c, vias };
}

/** Distribución de un array de números: mediana, p90, p99, máximo. */
function reparto(vals) {
  const s = vals.slice().sort((a, b) => a - b);
  const q = (p) => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN;
  return { n: s.length, min: s[0], mediana: q(0.5), p90: q(0.9), p99: q(0.99), max: s[s.length - 1] };
}

module.exports = { enganchar, reparto };
