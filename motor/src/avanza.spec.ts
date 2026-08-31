/**
 * ⭐ LAS JUECES DE LA CONSULTA VIVA AL POSTE (31/08).
 *
 * ⚠️ **CERO RED, y el fixture está MEDIDO.** El cuerpo de aquí abajo es la
 * respuesta **literal** que Avanza dio al poste 1000 el 31/08 a las 10:27 GMT
 * —2.927 bytes, `Content-Type: text/html` y JSON dentro—, copiada byte a byte.
 * No es una respuesta que yo imagine que Avanza manda: es la que mandó.
 *
 * Es la **ley nº18** aplicada: un esquema dice el tipo, no la codificación, y un
 * fixture copia la medición, no la lectura de la documentación. Aquella entrada
 * salió justo de inventarme unas comillas que el NAP no ponía.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  leerRespuesta,
  llegadasDelPoste,
  normalizarLinea,
  posteDeCodigo,
  reiniciarVisitas,
  visitasHechas,
} from './avanza.ts';

/**
 * ⭐ LA RESPUESTA DE VERDAD, del poste 1000 (Plaza Emperador Carlos V /
 * Intercambiador), el 31/08/2026 a las 10:27:32 GMT.
 *
 * Trae dos coches de la línea `053` hacia MIRALBUENO: el 4937 a 0 minutos y el
 * 4669 a 7. Y trae la cicatriz entera: el `<strong>053<i…></i>MIRALBUENO` cuyo
 * texto plano sería `053MIRALBUENO` pegado.
 */
const DEL_POSTE_1000 = "{\"maquinas\":{\"0\":{\"coordenadas\":{\"0\":{\"LAT\":41.638001,\"LON\":-0.89869}},\"icon\":\"https:\\/\\/gps.avanzabus.com\\/img\\/bus_rojo.png\",\"info\":\"Plaza Emperador Carlos V \\/ Intercambiador\",\"title\":\"Plaza Emperador Carlos V \\/ Intercambiador\"},\"1\":{\"coordenadas\":{\"0\":{\"LAT\":41.63800048182846,\"LON\":-0.8986539415097062}},\"info\":\"<table border=\\\"0\\\">\\n                        <tr>\\n                            <td class=\\\"td_info\\\">Bus<\\/td>\\n                            <td class=\\\"td_info\\\">L\\u00ednea<\\/td>\\n                            <td class=\\\"td_info\\\">Tiempo<\\/td>\\n                            <td class=\\\"td_info\\\">Distancia<\\/td>\\n                        <\\/tr>\\n\\n                        <tr>\\n                            <td class=\\\"td_info2\\\">&nbsp4937<\\/td>\\n                            <td class=\\\"td_info2\\\">053->MIRALBUENO<\\/td>\\n                            <td class=\\\"td_info2\\\">0 min.<\\/td>\\n                            <td class=\\\"td_info2\\\">0 kms.<\\/td>\\n                        <\\/tr>\\n                    <\\/table>\",\"title\":\"053 4937\",\"icon\":\"https:\\/\\/gps.avanzabus.com\\/img\\/bus.png\"},\"2\":{\"coordenadas\":{\"0\":{\"LAT\":41.64057659791711,\"LON\":-0.9134942226698433}},\"info\":\"<table border=\\\"0\\\">\\n                        <tr>\\n                            <td class=\\\"td_info\\\">Bus<\\/td>\\n                            <td class=\\\"td_info\\\">L\\u00ednea<\\/td>\\n                            <td class=\\\"td_info\\\">Tiempo<\\/td>\\n                            <td class=\\\"td_info\\\">Distancia<\\/td>\\n                        <\\/tr>\\n\\n                        <tr>\\n                            <td class=\\\"td_info2\\\">&nbsp4669<\\/td>\\n                            <td class=\\\"td_info2\\\">053->MIRALBUENO<\\/td>\\n                            <td class=\\\"td_info2\\\">7 min.<\\/td>\\n                            <td class=\\\"td_info2\\\">1 kms.<\\/td>\\n                        <\\/tr>\\n                    <\\/table>\",\"title\":\"053 4669\",\"icon\":\"https:\\/\\/gps.avanzabus.com\\/img\\/bus.png\"}},\"tablatiempos\":\"<li>\\n                        <a href=\\\"#\\\">\\n                            <i class=\\\"fa fa-dot-circle-o\\\"><\\/i>\\n                            <strong>053\\n                            <i class=\\\"fa fa-long-arrow-right fa-fw\\\"><\\/i>MIRALBUENO\\n                            <\\/strong>\\n                        <\\/a><ul class=\\\"nav nav-second-level\\\">\\n                        <li>\\n                            <a href=\\\"https:\\/\\/gps.avanzabus.com\\/zaragoza\\/fParadas\\/1000\\/4937\\\">\\n\\n                            <i class=\\\"fa fa-map-marker fa-fw\\\"><\\/i>\\n                            4937 [0 mins]\\n                            <\\/a>\\n                        <\\/li><li>\\n                        <a href=\\\"https:\\/\\/gps.avanzabus.com\\/zaragoza\\/fParadas\\/1000\\/4669\\\">\\n\\n                        <i class=\\\"fa fa-map-marker fa-fw\\\"><\\/i>\\n                        4669 [7 mins]\\n                        <\\/a>\\n                    <\\/li><\\/ul><\\/li>\"}";

describe('⭐ LA CONSULTA VIVA AL POSTE DE AVANZA', () => {
  beforeEach(() => reiniciarVisitas());

  /**
   * ⭐ JUEZ 1 — LA FORMA MEDIDA SE LEE ENTERA.
   *
   * La línea sale de `maquinas[i].title` —que es JSON— y los minutos de los
   * `[N mins]` de `tablatiempos`. Ni un parser de HTML ni una dependencia.
   */
  test('⭐ 1 · la respuesta real del poste 1000 se lee entera', () => {
    const lectura = leerRespuesta(1000, DEL_POSTE_1000, new Date('2026-08-31T10:27:32Z'))!;
    assert.ok(lectura, 'la respuesta medida tiene que leerse');
    assert.equal(lectura.poste, 1000);
    assert.equal(lectura.nombre, 'Plaza Emperador Carlos V / Intercambiador');
    assert.deepEqual(lectura.llegadas, [
      { linea: '53', minutos: 0, coche: '4937' },
      { linea: '53', minutos: 7, coche: '4669' },
    ]);
  });

  /**
   * ⭐ JUEZ 2 — `053` DEL OPERADOR ES `53` DEL FEED.
   *
   * Avanza escribe la línea con ceros delante y el GTFS no. Sin normalizar, la
   * comparación falla siempre y los minutos reales no llegarían nunca — un
   * fallo que no se ve, porque «no hay dato» y «no cruzo» se parecen mucho.
   */
  test('⭐ 2 · la línea se normaliza para poder cruzarla con el feed', () => {
    assert.equal(normalizarLinea('053'), '53');
    assert.equal(normalizarLinea('39'), '39');
    // Y lo que no son ceros de relleno no se toca.
    assert.equal(normalizarLinea('N7'), 'N7');
    assert.equal(normalizarLinea('Ci1'), 'Ci1');
    assert.equal(normalizarLinea('TRA'), 'TRA');
    assert.equal(normalizarLinea('000'), '000', 'no se convierte en cadena vacía');

    // Y el poste sale del `stop_code` del feed.
    assert.equal(posteDeCodigo('PA01000'), 1000);
    assert.equal(posteDeCodigo('PA00010'), 10);
    assert.equal(posteDeCodigo('0101'), null, 'el tranvía no tiene poste de Avanza');
  });

  /**
   * ⭐ JUEZ 3 — EL CONTADOR DE CONTROL: si los dos canales no cuadran, se calla.
   *
   * [L1] un extractor necesita un contador independiente. Aquí la fuente lo
   * regala: los `title` de `maquinas` y los `[N mins]` de `tablatiempos` hablan
   * de los mismos coches por caminos distintos. Si dejan de coincidir, **no se
   * inventa**: se devuelve `null`, que es «no lo sabemos», y arriba se convierte
   * en el plan D-G.
   */
  test('⭐ 3 · si los dos canales se contradicen, no se dice nada', () => {
    // Le quitamos UN coche a `tablatiempos` y dejamos `maquinas` intacto.
    const cojo = DEL_POSTE_1000.replace('4669 [7 mins]', '4669');
    assert.notEqual(cojo, DEL_POSTE_1000, 'la mutación tenía que aplicarse');
    assert.equal(leerRespuesta(1000, cojo, new Date()), null, 'con los canales descuadrados, null');

    // ⭐ Y AL REVÉS: un coche de MÁS en `tablatiempos` que no está en
    // `maquinas`. Este caso lo caza **solo el recuento** —el bucle recorre los
    // coches de `maquinas` y no llegaría a mirar el sobrante—, y por eso está:
    // sin él, quitar la comparación de tamaños no ponía nada rojo.
    const conSobrante = DEL_POSTE_1000.replace(
      '4669 [7 mins]',
      '4669 [7 mins]</a></li><li><a>9999 [3 mins]',
    );
    assert.notEqual(conSobrante, DEL_POSTE_1000);
    assert.equal(leerRespuesta(1000, conSobrante, new Date()), null, 'un coche de más también descuadra');

    // Y un cuerpo que no es el JSON esperado tampoco se adivina.
    assert.equal(leerRespuesta(1000, '<html>mantenimiento</html>', new Date()), null);
    assert.equal(leerRespuesta(1000, '', new Date()), null);
    assert.equal(leerRespuesta(1000, '{"otra":"cosa"}', new Date()), null);
  });

  /**
   * ⭐ JUEZ 4 — SINGLE-FLIGHT **POR POSTE**.
   *
   * Un `Generar` que se suba dos veces en el mismo poste hace **una** visita;
   * dos postes distintos hacen dos. Es el mismo patrón que el BiZi, con la
   * clave puesta donde aquí toca.
   */
  test('⭐ 4 · dos consultas al MISMO poste a la vez son una sola visita', async () => {
    const pedir = (async () => {
      await new Promise((r) => setTimeout(r, 5));
      return new Response(DEL_POSTE_1000, { status: 200 });
    }) as unknown as typeof fetch;

    const [a, b] = await Promise.all([llegadasDelPoste(1000, pedir), llegadasDelPoste(1000, pedir)]);
    assert.equal(visitasHechas(), 1, `dos subidas al mismo poste hicieron ${visitasHechas()} visitas`);
    assert.equal(a, b, 'las dos comparten la MISMA respuesta');

    // Dos postes distintos, dos visitas.
    reiniciarVisitas();
    await Promise.all([llegadasDelPoste(1000, pedir), llegadasDelPoste(1001, pedir)]);
    assert.equal(visitasHechas(), 2);
  });

  /**
   * ⭐ JUEZ 5 — NO ES UNA CACHÉ: dos `Generar` seguidos son dos visitas.
   *
   * La frescura por petición es la conducta firmada, la misma que el BiZi.
   */
  test('⭐ 5 · dos consultas SEGUIDAS son dos visitas, no una guardada', async () => {
    const pedir = (async () => new Response(DEL_POSTE_1000, { status: 200 })) as unknown as typeof fetch;
    await llegadasDelPoste(1000, pedir);
    await llegadasDelPoste(1000, pedir);
    assert.equal(visitasHechas(), 2, 'alguien ha cacheado la respuesta entre peticiones');
  });

  /**
   * ⭐ JUEZ 6 — SI LA FUENTE CALLA O SE CAE, `null` — y eso es el D-G.
   *
   * Un 500, un 403 del cortafuegos o un 302 a mantenimiento **no son «no hay
   * autobuses»**: son «no lo sabemos», y se dicen distinto [ZetaBus].
   */
  test('⭐ 6 · un error de la fuente no es «no hay buses»: es no saberlo', async () => {
    for (const codigo of [500, 403, 302]) {
      reiniciarVisitas();
      const pedir = (async () => new Response('', { status: codigo })) as unknown as typeof fetch;
      assert.equal(await llegadasDelPoste(2000 + codigo, pedir), null, `el ${codigo}`);
    }
    // Y la red caída, igual.
    const rota = (async () => {
      throw new Error('ENOTFOUND');
    }) as unknown as typeof fetch;
    assert.equal(await llegadasDelPoste(3000, rota), null);
  });
});
