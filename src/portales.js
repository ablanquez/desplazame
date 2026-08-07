// D · EL ENGANCHE DE LOS 46.150 PORTALES.
//
// ⚠️⚠️ ES EL PASO QUE PUEDE FALLAR SIN ROMPER NADA. Un portal colgado de la calle
//    equivocada no produce ningún error: produce una ruta perfecta desde el sitio
//    equivocado, y todos los contadores dan verde. Por eso hay dos salvaguardas
//    independientes, y por eso ninguna de las dos corrige.
//
// ═════════════════════════════════════════════════════════════════════════════
// P4.5 · ¿SE PARTE LA ARISTA POR CADA PORTAL, O SE GUARDA LA POSICIÓN SOBRE ELLA?
// ═════════════════════════════════════════════════════════════════════════════
//   Pregunta abierta del diseño. Se resuelve por **GUARDAR LA POSICIÓN**, y no por
//   coste —que también— sino por tres consecuencias:
//
//   1. ⭐⭐ UN ENGANCHE MALO NO DEBE CORROMPER EL TERRENO. Partir la arista mete
//      el error DENTRO del grafo: un portal mal enganchado parte una calle por un
//      sitio que no es, y a partir de ahí el fallo está en el terreno y lo hereda
//      todo. Guardando la posición, el error se queda en el portal — y una
//      consulta mala no estropea las demás.
//   2. ⭐ TODO LO VERIFICADO SIGUE VALIENDO. Partir cambiaría nodos, aristas,
//      componentes, articulaciones y longitudes, y dejaría incomparables las
//      tandas 8 y 10 — que son la única línea base que existe.
//   3. ⭐ ES REVERSIBLE. Cambiar el criterio de enganche mañana no obliga a
//      reconstruir el grafo: se recalcula una tabla.
//
//   El coste: al resolver una ruta hay que insertar origen y destino como nodos
//   temporales sobre su arista. Son dos nodos por consulta, no 46.150 permanentes.
//   Y es exactamente la misma separación de D0: el dato municipal no se mezcla con
//   el terreno, lo verifica.
//
// ⛔ NO se copia el geocodificador heredado. Se usa como referencia y se escribe
//    éste (ley del trasplante). Los portales se leen DONDE ESTÁN, no se copian.

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros, dist } = require('./geo');

const RUTA_PORTALES = 'E:/PROYECTOS WEB/01 ZGZ RADAR REACT/data/generated/territorio/callejero/ayuntamiento-zaragoza/portales-zaragoza.json';
const RUTA_VIAS = 'E:/PROYECTOS WEB/01 ZGZ RADAR REACT/data/generated/territorio/callejero/ayuntamiento-zaragoza/vias-zaragoza.json';

// ── normalización de nombres de vía ──────────────────────────────────────────
// El callejero municipal dice `CALLE DEL COSO`; OSM dice `Calle del Coso`. Y a
// veces `AVENIDA` frente a `Av.`, o `ANDADOR` frente a nada. Se reduce cada nombre
// a su NÚCLEO: sin tipo de vía, sin artículos, sin acentos, sin puntuación.
//
// ⚠️ Esto NO es un emparejador: es un normalizador. Comparar núcleos dice si dos
//    nombres son el mismo, no cuál es el más parecido. El emparejamiento aproximado
//    ya falló en el 29,6 % del dataset heredado, y aquí no se usa.
const TIPOS_VIA = ['calle', 'avenida', 'plaza', 'paseo', 'camino', 'andador', 'ronda',
  'via', 'travesia', 'carretera', 'puente', 'pasaje', 'parque', 'glorieta', 'costanilla',
  'callejon', 'cuesta', 'subida', 'bajada', 'barrio', 'urbanizacion', 'poligono',
  'grupo', 'bulevar', 'autovia', 'autopista', 'senda', 'vereda', 'canal', 'acequia',
  'jardin', 'gran via', 'pasadizo', 'rinconada', 'escalinata', 'galeria', 'monasterio'];
// ⚠️ Artículos y TRATAMIENTOS DE CORTESÍA (`don`, `doña`). Entran porque son una
//    clase gramatical cerrada, igual que los artículos — no porque hicieran falta
//    para una dirección concreta. Y se comprobó ANTES de darlos por buenos:
//    la concordancia del `codigoVia` sube de 25.037 a 25.120 sobre los 46.150
//    portales. Si solo hubiera arreglado el caso que me hacía falta —"Calle Don
//    Jaime I", que es la ruta nº2 de Antonio— sería un parche, y estaría
//    prohibido: es ajustar el instrumento al resultado deseado.
const ARTICULOS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'a', 'al', "d'", 'en',
  'don', 'dona']);

function sinAcentos(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Núcleo comparable de un nombre de vía. Devuelve '' si no queda nada. */
function nucleo(nombre) {
  if (!nombre) return '';
  let s = sinAcentos(String(nombre)).toLowerCase();
  s = s.replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  // el tipo de vía va al principio; se quita el más largo que case
  for (const t of TIPOS_VIA.slice().sort((a, b) => b.length - a.length)) {
    if (s === t) return '';
    if (s.startsWith(t + ' ')) { s = s.slice(t.length + 1); break; }
  }
  const palabras = s.split(' ').filter((p) => p && !ARTICULOS.has(p));
  return palabras.join(' ');
}

// ── carga ────────────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ TANDA 35 · EL CENTINELA — 99999 no es un número de portal
// ═════════════════════════════════════════════════════════════════════════════
//   117 portales traen `sortNumber = 99999`. Su número crudo es `"BL0"`, `"A1"`,
//   `"C3"`, `"LL"`… — **bloques y letras, sin número de portal**. 99999 es el
//   centinela con el que el callejero dice «no tiene».
//
//   ⛔⛔ Las tandas 32, 33 y 34 lo contaron como un portal más. Como el universo
//     «lo que se puede pedir» va del número mínimo al máximo de cada vía, una vía
//     iba **de 1 a 99999**: 99.998 consultas inventadas, el 66,2 % del
//     denominador de tres informes (`docs/H1-LISTONES.md` §0b).
//
//   ⚠️ LO QUE **NO** SE HACE, y va aquí para que nadie lo «arregle» de más: estos
//     117 portales **no desaparecen**. Existen, están en algún sitio y siguen
//     enganchados al grafo. Dos vías enteras —`URBANIZACIÓN ALAMEDA` (38) y
//     `URBANIZACIÓN PARQUE ROMA` (43)— son **solo** portales así: quitarlos las
//     borraría del buscador. ⇒ salen del universo de lo que se puede pedir POR
//     NÚMERO, y de nada más.
//
// ⭐ Y la definición vive AQUÍ, una sola vez: `direccion.js` la llama, y los
//   medidores la llaman. Tres copias de la misma constante es cómo se llega a que
//   una tanda limpie y otra no (ley 56).
//
// ⛔⛔ ARREGLOS 1 · LA CONSTANTE SE LLAMABA `CENTINELA` Y VALÍA 9999.
//   El centinela del callejero es **99999**; 9999 era el **techo por debajo del
//   cual un número se considera pedible**. Dos cosas distintas con un solo
//   nombre — y el mensaje de `medir-paridad.js` llegaba a imprimir *«el centinela
//   declarado es 9999»*, que es sencillamente falso.
//   ⚠️ Hoy no muerde y va medido: **0 portales** con número crudo en la franja
//     `[9999, 99999)` (control positivo: 46.033 por debajo del techo). Pero el
//     día que el callejero estrene un portal 12345, este techo lo tira **en
//     silencio**, y el guardián de `medir-paridad.js` no podría verlo porque
//     compara contra el número equivocado.
//   ⇒ Se separan los dos conceptos y **cada uno dice lo que es**.
const TECHO_PEDIBLE = 9999;

/** ⭐ El valor con el que el callejero municipal dice «este portal no tiene
 *  número»: `sortNumber = 99999` sobre `"BL0"`, `"A1"`, `"LL"`… **Observado**,
 *  no supuesto: es el único valor crudo ≥ `TECHO_PEDIBLE` en los 46.150. */
const CENTINELA_CALLEJERO = 99999;

/** El número con el que se puede PEDIR un portal, o `null` si no tiene. */
function numeroPedible(n) {
  return (Number.isFinite(n) && n > 0 && n < TECHO_PEDIBLE) ? n : null;
}

/** Los 46.150 portales, proyectados a metros. ⛔ Se leen donde están; no se copian.
 *
 * ⭐⭐⭐ TANDA DE ARREGLOS 1 · EL CENTINELA SE APAGA **AQUÍ**, NO EN UNA COPIA.
 *   La tanda 35 lo apagó en `direccion.construirIndice`, que trabaja sobre una
 *   copia. Esta función seguía devolviendo `n = 99999`, y **el que la lee en
 *   crudo hace `o.n % 2` y se lleva 117 impares inventados**: así midió
 *   `acera-equivocada.js` **150.947 / 123.132 / 66.973 / 126 m** durante cuatro
 *   tandas, con la batería en verde (sus invariantes son de forma, no de valor).
 *
 *   ⛔ SE MARCA, NO SE EXCLUYE, y no es una elección de estilo:
 *     · el bloque de arriba lo prohíbe — `URBANIZACIÓN ALAMEDA` (38 portales) y
 *       `URBANIZACIÓN PARQUE ROMA` (43) son **solo** portales así, y quitarlos
 *       las borraría del buscador;
 *     · `direccion.js:36` **ya define esta forma exacta** desde la tanda 35. Esto
 *       no inventa un contrato: mueve el que ya existía de la copia al origen.
 *   ⭐ Y la marca deja el número crudo a la vista (`numeroCrudo`), porque «BL0» es
 *     un dato, no un hueco: quien quiera enseñarlo puede.
 *
 *   ⚠️ `direccion.construirIndice` sigue llamando a `numeroPedible` y **debe
 *     seguir haciéndolo**: es idempotente sobre lo ya marcado, y es lo que
 *     protege el día que alguien construya un índice desde otra fuente.
 */
function cargarPortales(ruta = RUTA_PORTALES) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  return d.map((p) => {
    const bruto = Number(p.sortNumber);
    const n = numeroPedible(bruto);
    const o = {
      id: p.portalId,
      codigoVia: String(p.codigoVia),
      numero: p.numero,
      n,
      lat: p.coordLat,
      lon: p.coordLon,
      m: aMetros(p.coordLon, p.coordLat),
    };
    if (n === null) { o.sinNumero = true; o.numeroCrudo = p.numero; }
    return o;
  });
}

/** Las 3.359 vías del callejero municipal, indexadas por `codigoVia`. */
function cargarVias(ruta = RUTA_VIAS) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const m = new Map();
  for (const v of d) {
    m.set(String(v.codigoVia), {
      codigoVia: String(v.codigoVia),
      nombre: v.nombrePublico || v.nombre,
      nucleo: nucleo(v.nombrePublico || v.nombre),
      tipoVia: v.tipoVia,
      numPortales: v.numPortales,
    });
  }
  return m;
}

// ── el enganche ──────────────────────────────────────────────────────────────

/** Punto más cercano de un segmento a `p`. Devuelve {d, t, q}. */
function aSegmento(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const L2 = vx * vx + vy * vy;
  let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  const q = [a[0] + t * vx, a[1] + t * vy];
  return { d: Math.hypot(p[0] - q[0], p[1] - q[1]), t, q };
}

/** Rejilla de aristas para no comparar todo contra todo. */
function indexarAristas(aristas, filtro, celda = 100) {
  const m = new Map();
  for (let i = 0; i < aristas.length; i++) {
    if (filtro && !filtro(aristas[i])) continue;
    const pts = aristas[i].pts;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1];
      const x0 = Math.floor(Math.min(a[0], b[0]) / celda), x1 = Math.floor(Math.max(a[0], b[0]) / celda);
      const y0 = Math.floor(Math.min(a[1], b[1]) / celda), y1 = Math.floor(Math.max(a[1], b[1]) / celda);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        const kk = x + ',' + y;
        if (!m.has(kk)) m.set(kk, []);
        m.get(kk).push([i, k]);
      }
    }
  }
  return { m, celda };
}

/**
 * Arista más cercana a un punto, buscando en anillos crecientes.
 * ⭐ Devuelve TAMBIÉN la segunda mejor de OTRA vía: es lo que permite saber si el
 *    enganche estaba reñido. Un portal a 4,0 m de una calle y a 4,2 m de otra no
 *    es un acierto, es un empate — y los empates hay que contarlos aparte.
 */
function engancharUno(p, aristas, idx, nombreDe, maxRadio = 120) {
  const { m, celda } = idx;
  const cx = Math.floor(p[0] / celda), cy = Math.floor(p[1] / celda);
  let mejor = null, segunda = null;
  for (let r = 0; r <= Math.ceil(maxRadio / celda); r++) {
    for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
      if (r > 0 && Math.abs(x - cx) !== r && Math.abs(y - cy) !== r) continue;
      for (const [i, k] of (m.get(x + ',' + y) || [])) {
        const e = aristas[i];
        const s = aSegmento(p, e.pts[k], e.pts[k + 1]);
        if (s.d > maxRadio) continue;
        if (!mejor || s.d < mejor.d) {
          if (mejor && nombreDe(aristas[mejor.i]) !== nombreDe(e)) segunda = mejor;
          mejor = { i, k, d: s.d, t: s.t, q: s.q };
        } else if ((!segunda || s.d < segunda.d) && nombreDe(e) !== nombreDe(aristas[mejor.i])) {
          segunda = { i, k, d: s.d, t: s.t, q: s.q };
        }
      }
    }
    // dos anillos más allá del primer acierto, por si el mejor está en diagonal
    if (mejor && r >= Math.ceil(mejor.d / celda) + 1) break;
  }
  return { mejor, segunda };
}

/** ⭐ D4 · a qué lado del eje cae el punto. +1 / -1 / 0 si está encima. */
function ladoDe(p, a, b) {
  const z = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  return z > 0 ? 1 : z < 0 ? -1 : 0;
}

module.exports = { cargarPortales, cargarVias, nucleo, sinAcentos, aSegmento,
  indexarAristas, engancharUno, ladoDe, RUTA_PORTALES, RUTA_VIAS, TIPOS_VIA,
  TECHO_PEDIBLE, CENTINELA_CALLEJERO, numeroPedible };
