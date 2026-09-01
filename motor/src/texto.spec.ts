/**
 * ⭐ LA DECODIFICACIÓN DE UN TEXTO AJENO. Con fixtures de **BYTES**, no de texto.
 *
 * ⚠️ Y eso no es un detalle de estilo: un fixture escrito como cadena en el
 *    fuente ya está decodificado, así que probaría el editor y no el lector.
 *    Aquí las respuestas se montan con los bytes exactos que pondría el
 *    servidor, y son los que se midieron contra Avanza el 1/09.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { charsetDe, textoDe, CHARSET_POR_DEFECTO } from './texto.ts';

/**
 * Una respuesta de mentira con los BYTES y la cabecera que se le digan.
 *
 * ⚠️ Toma un `ArrayBuffer` y no un `Uint8Array` porque es lo que `BodyInit`
 *    admite en los tipos de esta versión — y lo dijo `comprobar-tipos` con las
 *    seis jueces ya en verde, que es exactamente para lo que va primero.
 */
const respondiendo = (bytes: ArrayBuffer, contentType: string | null): Response =>
  new Response(bytes, {
    status: 200,
    headers: contentType === null ? {} : { 'Content-Type': contentType },
  });

/** «Plaza Aragón» tal y como lo sirve Avanza: UTF-8. Medido, byte a byte. */
const ARAGON_UTF8 = Uint8Array.from([
  0x50, 0x6c, 0x61, 0x7a, 0x61, 0x20, 0x41, 0x72, 0x61, 0x67, 0xc3, 0xb3, 0x6e,
]).buffer;

/** El mismo nombre en windows-1252: la «ó» es UN byte, `f3`. */
const ARAGON_1252 = Uint8Array.from([
  0x50, 0x6c, 0x61, 0x7a, 0x61, 0x20, 0x41, 0x72, 0x61, 0x67, 0xf3, 0x6e,
]).buffer;

describe('⭐ EL TEXTO DE UNA RESPUESTA AJENA', () => {
  test('el charset se lee de la cabecera, con o sin comillas y sin importar el caso', () => {
    assert.equal(charsetDe('text/html; charset=UTF-8'), 'utf-8');
    assert.equal(charsetDe('text/html;charset=iso-8859-1'), 'iso-8859-1');
    assert.equal(charsetDe('text/html; charset="windows-1252"'), 'windows-1252');
    assert.equal(charsetDe('text/html; Charset=UTF-8; boundary=x'), 'utf-8');
    // Y cuando no lo declara, se dice que no: no se adivina.
    assert.equal(charsetDe('text/html'), null);
    assert.equal(charsetDe(null), null);
  });

  /**
   * ⭐ JUEZ 3 — UN FIXTURE UTF-8 LEGÍTIMO SIGUE SALIENDO BIEN.
   *
   * Es el caso real: las tres fuentes de Avanza declaran `charset=UTF-8` y
   * sirven UTF-8. Lo que no se puede es romper lo que ya iba.
   */
  test('⭐ 3 · UTF-8 declarado y servido: el nombre sale con su tilde', async () => {
    const texto = await textoDe(respondiendo(ARAGON_UTF8, 'text/html; charset=UTF-8'));
    assert.equal(texto, 'Plaza Aragón');
    assert.equal(texto.includes('�'), false);
  });

  /**
   * ⭐ JUEZ 4 — EL CHARSET SALE DE LA CABECERA, NO DE UNA CONSTANTE.
   *
   * Los MISMOS bytes con dos cabeceras distintas tienen que dar dos cosas
   * distintas. Si el charset estuviera fijo, esta juez daría lo mismo dos veces.
   *
   * ⚠️ [Encoding Standard] la etiqueta `iso-8859-1` **no** es ISO-8859-1: se
   * mapea a `windows-1252`. Por eso las dos cabeceras dan el mismo resultado, y
   * eso se compra aquí en vez de suponerlo.
   */
  test('⭐ 4 · los mismos bytes con otra cabecera se decodifican distinto', async () => {
    // `f3` es «ó» en windows-1252 y una secuencia inválida en UTF-8.
    const comoUtf8 = await textoDe(respondiendo(ARAGON_1252, 'text/html; charset=UTF-8'));
    assert.equal(comoUtf8.includes('�'), true, 'leídos como UTF-8, esos bytes NO son válidos');

    const como1252 = await textoDe(respondiendo(ARAGON_1252, 'text/html; charset=windows-1252'));
    assert.equal(como1252, 'Plaza Aragón');

    // Y la etiqueta antigua es la misma tabla, que lo dice el estándar.
    const comoLatin1 = await textoDe(respondiendo(ARAGON_1252, 'text/html; charset=iso-8859-1'));
    assert.equal(comoLatin1, 'Plaza Aragón');

    // ⭐ El contraste que lo cierra: mismos bytes, dos respuestas distintas.
    assert.notEqual(comoUtf8, como1252);
  });

  test('sin charset declarado se usa el defecto, y va escrito', async () => {
    assert.equal(CHARSET_POR_DEFECTO, 'utf-8');
    assert.equal(await textoDe(respondiendo(ARAGON_UTF8, 'text/html')), 'Plaza Aragón');
    assert.equal(await textoDe(respondiendo(ARAGON_UTF8, null)), 'Plaza Aragón');
  });

  test('⚠️ un charset que no se conoce AVISA y no se traga el texto', async () => {
    const dichos: string[] = [];
    const texto = await textoDe(
      respondiendo(ARAGON_UTF8, 'text/html; charset=ebcdic-cp-wt'),
      (m) => dichos.push(m),
    );
    assert.equal(texto, 'Plaza Aragón');
    assert.equal(dichos.length, 1);
    assert.match(dichos[0]!, /charset desconocido «ebcdic-cp-wt»/);
  });

  /**
   * ⚠️ LA RAZÓN DE QUE ESTO EXISTA, comprada de frente: `Response.text()`
   * **ignora** el charset declarado [WHATWG Fetch] y decodifica siempre UTF-8.
   * Con una fuente en windows-1252 devuelve la palabra rota **sin error**.
   */
  test('⭐ y `Response.text()` NO haría esto: ignora la cabecera', async () => {
    const suyo = await respondiendo(ARAGON_1252, 'text/html; charset=windows-1252').text();
    assert.equal(suyo.includes('�'), true, 'text() decodifica como UTF-8 pase lo que pase');
    const nuestro = await textoDe(respondiendo(ARAGON_1252, 'text/html; charset=windows-1252'));
    assert.equal(nuestro, 'Plaza Aragón');
  });
});
