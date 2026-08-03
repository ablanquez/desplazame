// D6 · BÚSQUEDA POR DIRECCIÓN — de "Coso 33" a un nodo del grafo.
//
// ⛔ NO es una copia del geocodificador heredado. Se ha mirado como referencia
//    —3.359 vías tokenizadas, índice `by-street`— y se ha escrito éste, que es
//    la ley del trasplante: se copian DATOS y DECISIONES, nunca MAQUINARIA.
//
// ⭐ Y hace una cosa que el heredado no necesitaba: cuando no encuentra el número
//    exacto, **lo dice**, y ofrece el más cercano de la misma vía como respuesta
//    DISTINTA. `NO CONSTA` es un resultado; inventar un portal, no.

'use strict';
const P = require('./portales');

/**
 * Índice de búsqueda: núcleo de la vía -> lista de portales.
 * ⚠️ La clave es el NÚCLEO (sin tipo de vía, sin artículos, sin acentos), así que
 *    "Coso", "CALLE DEL COSO" y "el coso" caen en la misma casilla — pero
 *    "Calle Mayor" y "Calle Mayor GRP" NO, y eso es correcto: son dos calles.
 */
function construirIndice(portalesEnganchados, vias) {
  const porNucleo = new Map();
  for (const o of portalesEnganchados) {
    const v = o.via || vias.get(o.codigoVia);
    if (!v || !v.nucleo) continue;
    if (!porNucleo.has(v.nucleo)) porNucleo.set(v.nucleo, []);
    porNucleo.get(v.nucleo).push(o);
  }
  // los números que se repiten (bloques, escaleras) se dejan todos: se elige después
  for (const l of porNucleo.values()) l.sort((a, b) => (a.n || 0) - (b.n || 0));
  return porNucleo;
}

/** Parte "Coso 33" en {calle, numero}. Devuelve numero=null si no lo hay. */
function partir(texto) {
  const s = String(texto).trim();
  const m = s.match(/^(.*?)[\s,]+(\d+)\s*[a-zA-Z]?$/);
  if (!m) return { calle: s, numero: null };
  return { calle: m[1].trim(), numero: Number(m[2]) };
}

/**
 * Resuelve una dirección.
 * @returns {{estado, portal?, calle?, candidatos?, aviso?}}
 *   estado ∈ 'exacto' | 'numero-aproximado' | 'calle-ambigua' | 'sin-calle' | 'sin-portales'
 */
function resolver(texto, indice) {
  const { calle, numero } = partir(texto);
  const nu = P.nucleo(calle);
  if (!nu) return { estado: 'sin-calle', consulta: texto };

  // ⚠️ coincidencia EXACTA de núcleo. No se busca "el más parecido": el
  //    emparejamiento aproximado ya falló en el 29,6 % del dataset heredado.
  let lista = indice.get(nu);
  if (!lista) {
    // única concesión, y declarada: las que empiezan igual. Si hay más de una, es
    // AMBIGUA y se dice; no se elige la primera.
    const cand = [...indice.keys()].filter((k) => k.startsWith(nu + ' ') || nu.startsWith(k + ' '));
    if (cand.length === 0) return { estado: 'sin-calle', consulta: texto, nucleo: nu };
    if (cand.length > 1) return { estado: 'calle-ambigua', consulta: texto, nucleo: nu, candidatos: cand };
    lista = indice.get(cand[0]);
  }
  if (!lista.length) return { estado: 'sin-portales', consulta: texto, nucleo: nu };
  if (numero === null) {
    return { estado: 'numero-aproximado', consulta: texto, portal: lista[Math.floor(lista.length / 2)],
      aviso: 'sin número: se devuelve un portal central de la vía' };
  }
  const exacto = lista.filter((o) => o.n === numero);
  if (exacto.length) {
    return { estado: 'exacto', consulta: texto, portal: exacto[0], hermanos: exacto.length };
  }
  let mejor = lista[0];
  for (const o of lista) if (Math.abs((o.n || 0) - numero) < Math.abs((mejor.n || 0) - numero)) mejor = o;
  return { estado: 'numero-aproximado', consulta: texto, portal: mejor,
    aviso: `el número ${numero} no existe en el callejero; el más cercano es el ${mejor.n}` };
}

module.exports = { construirIndice, partir, resolver };
