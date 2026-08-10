// ⭐⭐⭐ EL PUENTE DE IDENTIDAD — Y ESTE ES EL ÚNICO FICHERO DEL PROYECTO QUE
//      SABE CÓMO SE ESCRIBE UN CÓDIGO DE PARADA DE AVANZA.
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ IDENTIFICA UNA PARADA EN 004, Y QUÉ NO
// ═════════════════════════════════════════════════════════════════════════════
//   La identidad es el `stop_id` del feed, TAL CUAL, como cadena opaca. Medido
//   sobre el feed 20260623_AUZSA_Y_TRANVIA: 984 stop_id y 984 distintos.
//
//   El NÚMERO DE POSTE de Avanza —el que está escrito en la marquesina— NO es la
//   identidad: es un ATRIBUTO, y 50 paradas no lo tienen. Confundir las dos cosas
//   es el fallo que este fichero existe para impedir.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ POR QUÉ LA FÓRMULA ESTÁ ANCLADA — Y NO ES PURISMO, ESTÁ MEDIDO
// ═════════════════════════════════════════════════════════════════════════════
//   En este feed conviven DOS CONVENIOS en la misma columna `stop_code`:
//
//       BUS      "AA99999"   934 de 934      ⇐ dos letras + CINCO dígitos
//       TRANVÍA  "9999"       50 de 50       ⇐ CUATRO dígitos, sin letras
//       (forma: 9 = dígito · A = letra)
//
//   Como cadenas no chocan: la intersección literal de los dos juegos es 0. El
//   choque aparece en cuanto alguien "limpia" el código para quedarse el número:
//
//       quitando el prefijo y conservando el número  →  15 números compartidos
//           nº 301  ←  "PA00301" Camino Del Pilón   ·   "0301" Juslibol
//           nº 401  ←  "PA00401" Av. De Montañana   ·   "0401" Campus Río Ebro
//
//   Y con la fórmula que 003 PUBLICA en su documento de diseño —`int(code[2:])`—
//   es mucho peor, porque a un código de cuatro cifras le corta la mitad:
//
//       nº 1  ×24     "0101" "0201" "0301" "0401" …   VEINTICUATRO paradas
//       nº 2  ×23     "PA00002" "0102" "0202" …       y aquí choca bus CON tranvía
//
//   ⇒ Tres paradas distintas del tranvía, el mismo número, y NI UN ERROR: sale un
//     entero con toda la pinta de ser un poste bueno. Ese es el modo de fallo.
//
//   ⭐ 003 tenía la valla puesta, pero la tenía EN SU REGEX, no en la frase que
//     publicó. Su código real es `/^PA(\d{5})$/`. 004 no hereda la frase: hereda
//     la regex. (Ley 145.)
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ IMPIDE QUE ESTO SALGA DE AQUÍ
// ═════════════════════════════════════════════════════════════════════════════
//   La valla no es este comentario. Son tres cosas comprobables:
//     1 · el prefijo solo puede aparecer en ESTE fichero  → es un `grep`
//     2 · 934 paradas con poste y 50 sin él               → es un recuento
//     3 · los 50 códigos del tranvía dan NO TIENE         → `probar-identidad.js`
//   La tercera es la que puede ponerse roja, y se ha visto roja.

'use strict';

/**
 * ⭐ LA FORMA DE UN CÓDIGO DE PARADA DE AVANZA. Anclada por los dos extremos y
 *    con el número de dígitos EXACTO.
 *
 * ⚠️ Cada trozo impide un fallo concreto, y por eso ninguno se puede quitar:
 *      ^ … $      que "XPA00002Y" pase. Sin anclas valdría cualquier cadena que
 *                 CONTENGA el patrón, no solo la que lo sea.
 *      PA         que entre un código de tranvía: los 50 son `\d{4}` y ninguno
 *                 lleva letras.
 *      \d{5}      ⭐ el ancla de verdad. Fija el convenio OBSERVADO (934 de 934)
 *                 en vez de aceptar lo que venga. Con `\d+` esto seguiría
 *                 rechazando al tranvía —le falta el "PA"— pero dejaría de
 *                 avisar el día que el publicador cambie el ancho del número, y
 *                 ese día queremos enterarnos, no adaptarnos en silencio.
 */
const FORMA_CODIGO_AVANZA = /^PA(\d{5})$/;

/**
 * ⭐ NO TIENE. Y es un valor, no un error.
 *
 * ⚠️ Las 50 paradas del tranvía NO tienen número de poste, y eso es CORRECTO, no
 *    una excepción que haya que tratar. Devolver `null` obliga a quien llama a
 *    mirarlo; devolver 0 lo dejaría colarse en una suma.
 */
const NO_TIENE = null;

/**
 * El número de poste de Avanza de una parada, o `NO_TIENE`.
 *
 * ⛔ NO dice si el poste EXISTE. Dice si ese código está escrito en el convenio
 *    de Avanza y qué número lleva dentro. Existir es otra pregunta y la contesta
 *    el feed, no una expresión regular.
 *
 * @param {unknown} stopCode el `stop_code` crudo del GTFS
 * @returns {number|null}
 */
function posteDeAvanza(stopCode) {
  // ⚠️ Nada de `String(x ?? '')` a lo bruto: un número, un objeto o un array
  //    pasarían por aquí convertidos en algo que casi parece un código. Si no es
  //    una cadena, no es un `stop_code`.
  if (typeof stopCode !== 'string') return NO_TIENE;

  const m = FORMA_CODIGO_AVANZA.exec(stopCode.trim());
  if (!m) return NO_TIENE;

  // ⚠️ `parseInt` con base 10 explícita. Sin la base, un "08" o un "09" fueron
  //    octal en JavaScript durante años, y este proyecto ya se comió una
  //    interpretación hexadecimal por un `Number()` demasiado servicial.
  const n = Number.parseInt(m[1], 10);

  // ⛔ "PA00000" es sintácticamente válido y no es un poste. Un 0 que se cuela
  //    en una lista de postes no da error: da una parada fantasma.
  if (!Number.isInteger(n) || n <= 0) return NO_TIENE;

  return n;
}

/**
 * ⛔⛔ LA FÓRMULA QUE 003 PUBLICA EN SU DOCUMENTO DE DISEÑO. NO SE USA PARA NADA.
 *
 * Vive aquí, exportada, por UNA razón: `probar-identidad.js` la necesita para
 * demostrar que la prueba de esta valla SABE PONERSE ROJA. Un guardián cuyo rojo
 * nadie ha provocado es una promesa, no una red.
 *
 * ⚠️ Si algún día alguien la llama desde código de producto, el `grep` de la
 *    valla no lo cazará —no lleva el prefijo dentro— pero el recuento sí: daría
 *    984 paradas con poste en vez de 934.
 */
function posteSegunLaFraseDe003(stopCode) {
  if (typeof stopCode !== 'string') return NO_TIENE;
  const n = Number.parseInt(stopCode.slice(2), 10);
  return Number.isFinite(n) ? n : NO_TIENE;
}

module.exports = { posteDeAvanza, posteSegunLaFraseDe003, NO_TIENE, FORMA_CODIGO_AVANZA };
