/**
 * ⭐ EL TEXTO DE UNA RESPUESTA AJENA, **decodificado por su charset declarado**.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  POR QUÉ NO VALE `Response.text()`.
 *
 *  [WHATWG Fetch] `text()` decodifica **siempre UTF-8** e **ignora el charset
 *  de la cabecera**. Con una fuente que responda `charset=iso-8859-1`, una «é»
 *  llega como carácter de reemplazo y **no hay error**: la lectura sale
 *  adelante con la palabra rota dentro.
 *
 *  ⚠️ **Y hoy eso no cambia nada, y aun así se hace.** Medido el 1/09 contra las
 *  tres fuentes de Avanza —el poste vivo, la página del nonce y la ruta
 *  operativa—: las tres declaran `text/html; charset=UTF-8` y las tres sirven
 *  UTF-8 de verdad. «Aragón» llega como `41 72 61 67 c3 b3 6e`, y decodificado
 *  como UTF-8 salen **0 caracteres de reemplazo**. Así que esto no arregla un
 *  fallo vivo: **quita un fallo mudo**. El día que una de esas páginas cambie
 *  de codificación —un WordPress se reconfigura sin avisar a nadie—, `text()`
 *  seguiría sin protestar y los nombres saldrían rotos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **Y si la respuesta no declara charset, NO se adivina.** El defecto es
 *    `utf-8` porque es lo que `text()` haría y lo que estas fuentes sirven, y va
 *    escrito aquí en vez de deducido de los bytes: adivinar la codificación de
 *    un texto corto es acertar de casualidad.
 *
 * [Encoding Standard] la etiqueta `iso-8859-1` **no** es ISO-8859-1: el estándar
 * la mapea a `windows-1252`, y eso lo hace ya `TextDecoder`, que es de quien
 * viene la tabla. Aquí no hay tabla propia que mantener.
 */

/** Lo que se usa cuando la respuesta no dice de qué codificación viene. */
export const CHARSET_POR_DEFECTO = 'utf-8';

/**
 * El charset declarado en un `Content-Type`, en minúsculas, o `null`.
 *
 * Acepta el valor entrecomillado, que es legal [RFC 9110 · `parameter-value`].
 */
export function charsetDe(contentType: string | null): string | null {
  if (contentType === null) {
    return null;
  }
  const m = /;\s*charset\s*=\s*"?([^";\s]+)"?/i.exec(contentType);
  return m ? m[1]!.toLowerCase() : null;
}

/**
 * El cuerpo de una respuesta como texto, decodificado por lo que ella declara.
 *
 * ⚠️ Un charset que `TextDecoder` no conozca **no se silencia**: se dice cuál
 *    era y se cae a UTF-8, que es lo que `text()` habría hecho de todos modos.
 *    Un aviso es preferible a una palabra rota que nadie mira.
 */
export async function textoDe(
  respuesta: Response,
  avisar: (mensaje: string) => void = (m) => console.warn(m),
): Promise<string> {
  const etiqueta = charsetDe(respuesta.headers.get('content-type')) ?? CHARSET_POR_DEFECTO;
  const bytes = await respuesta.arrayBuffer();
  try {
    return new TextDecoder(etiqueta).decode(bytes);
  } catch {
    avisar(`motor: charset desconocido «${etiqueta}»; se lee como ${CHARSET_POR_DEFECTO}`);
    return new TextDecoder(CHARSET_POR_DEFECTO).decode(bytes);
  }
}
