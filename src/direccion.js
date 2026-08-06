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
const Par = require('./paridad');

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
  // ⭐⭐ TANDA 33 · la FORMA de numeración de cada casilla, calculada UNA vez.
  //   ⛔ Va aquí y no dentro de `resolver` porque `resolver` se llama por consulta
  //     y esto se calcula por vía: mezclarlo sería recalcular lo mismo 150.000
  //     veces. Y va colgado de la lista para no cambiar la forma del índice, que
  //     es lo que usan `abrir()`, `punto()` y media docena de scripts.
  for (const l of porNucleo.values()) l.paridad = Par.analizar(l);
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
 *   estado ∈ 'exacto' | 'numero-aproximado' | 'sin-numero-cerca'
 *          | 'calle-ambigua' | 'sin-calle' | 'sin-portales'
 * ⭐ `sin-numero-cerca` es la TANDA 33: **no se tiene**, y se devuelven
 *    `sugerencias` —solo de la acera pedida— para que la interfaz las ofrezca.
 *    ⛔ No se resuelve por su cuenta: `portal` viene a null a propósito.
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
  // ═════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ TANDA 33 · DOS ACERAS, DOS CALLES
  // ═════════════════════════════════════════════════════════════════════════
  //   Antes: el más cercano EN NÚMERO, sin mirar la paridad. Eso devolvía el 77
  //   cuando se pedía el 78 de Avenida Cataluña, con el par más próximo a 258 m.
  //   ⭐ **La cercanía numérica no es cercanía física**, y tratarlas como si lo
  //     fueran es el fallo entero.
  // ⛔ La regla NO está copiada aquí: la tiene `paridad.js` y se la llama (ley 56).
  //   Así el geocodificador y el medidor de `medir-paridad.js` deciden con el
  //   mismo código, no con dos redacciones de la misma idea.
  const an = lista.paridad || Par.analizar(lista);
  const d = Par.decidir(numero, lista, an);
  if (d.modo === 'sin-numero-cerca') {
    // ⭐ NO SE TIENE, y se sugiere. ⛔ La sugerencia nunca lleva el de enfrente.
    return { estado: 'sin-numero-cerca', consulta: texto, portal: null, nucleo: nu,
      // ⛔⛔ AQUÍ NO SE VUELVE A COPIAR CAMPO A CAMPO, Y ES UNA MARCHA ATRÁS.
      //   El nº134 dejó escrito que re-mapear pierde en silencio lo que se añada
      //   después, y aun así decidí mantener el mapeo explícito «para no exponer
      //   el portal crudo». Al día siguiente la tanda 34 añadió `enfrente` a la
      //   sugerencia y **se perdió exactamente igual** (nº137).
      //   ⇒ la sugerencia la construye `paridad.js` entera y entera se entrega:
      //     no hay ningún campo suyo que aquí haya que esconder —`portal` se
      //     expone a propósito, lo necesita quien calcule la ruta— y el mapeo
      //     solo servía para perder cosas.
      sugerencias: d.sugerencias.map((s) => ({ ...s })),
      paridad: d.modo, forma: an.forma, aviso: d.aviso };
  }
  return { estado: 'numero-aproximado', consulta: texto, portal: d.portal,
    paridad: d.modo, forma: an.forma, cota: d.cota ? d.cota.m : null, aviso: d.aviso };
}

// ═════════════════════════════════════════════════════════════════════════════
// A5 · LA PUERTA ÚNICA: de un texto a un punto sobre el grafo
// ═════════════════════════════════════════════════════════════════════════════
// ⭐ Antes había dos: `src/ruta.js` enganchaba coordenadas al nodo más cercano por
//    su cuenta, y `src/rutas-antonio.js` montaba su propio índice de portales. Dos
//    caminos de código desde el mismo dato divergen — es la forma exacta de los
//    fallos nº63 y nº67, donde algo se midió en un sitio y el motor usó otro.
//    Ahora las dos entradas pasan por aquí.

/**
 * Abre el contexto de búsqueda sobre un grafo ya construido.
 * ⚠️ Cuesta: engancha los 46.150 portales. Se hace UNA vez por proceso.
 */
function abrir(g, crudo, opciones = {}) {
  const E = require('./enganche');
  const Po = require('./portales');
  // ⭐ los nombres vienen del propio grafo, del MISMO recorte que lo produjo. Antes
  //    esto releía los 37 MB del crudo para sacar exactamente lo mismo.
  const TAGS = opciones.TAGS || { get: (id) => ({ name: g.nombres.get(id) || null }) };
  const r = E.enganchar(g, TAGS, opciones);
  const indice = construirIndice(r.portales.filter((o) => o.enganchado), r.vias);
  const eng = Po.indexarAristas(g.aristas, (e) => e.pie);
  return { g, TAGS, indice, eng, enganche: r,
    nombreDeWay: (id) => g.nombres.get(id) || null };
}

/**
 * Texto -> punto de enganche listo para el motor, o null.
 * ⭐ Arrastra el ESTADO del geocodificador (`exacto`, `numero-aproximado`, …) y su
 *    aviso: si el número no existe en el callejero, la respuesta lo dice en vez de
 *    inventarlo.
 */
function punto(texto, ctx) {
  const res = resolver(texto, ctx.indice);
  if (!res.portal) return null;
  const o = res.portal;
  return { arista: o.arista, seg: o.seg, t: o.t, q: o.q, d: o.d, lat: o.lat, lon: o.lon,
    m: o.m, tipo: 'portal', portal: o, estado: res.estado, aviso: res.aviso || null };
}

module.exports = { construirIndice, partir, resolver, abrir, punto };
