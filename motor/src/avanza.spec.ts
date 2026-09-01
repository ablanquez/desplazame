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
  BACKOFF_MS,
  ESPERA_MS,
  estadoVivoDe,
  leerRespuesta,
  llegadasDelPoste,
  normalizarLinea,
  posteDeCodigo,
  reintentosHechos,
  reiniciarVisitas,
  ultimoMudo,
  REINTENTOS,
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

  /**
   * ⭐ JUEZ 7 — UNA RESPUESTA DE 3,5 s YA NO ES «MUDO».
   *
   * ⚠️ **Nace de un caso de Antonio.** Vio la línea 30 marcada como muda en el
   * poste de Jorge Cocci mientras la web de Avanza contestaba con cuatro
   * coches. Medida la latencia real de ese poste: **mediana 2.139 ms y máximo
   * 2.838** en cinco llamadas seguidas, con el tope en 3.000. No era la fuente.
   *
   * El tope pasa a los **4.000** de ZetaBus, que lleva meses en producción
   * contra este mismo servidor [`transporte.ts:157`].
   */
  test('⭐ 7 · una respuesta que tarda 3,5 s se lee, no se descarta', async () => {
    reiniciarVisitas();
    assert.equal(ESPERA_MS, 4000, 'el tope de ZetaBus');
    const lenta = (async () => {
      await new Promise((r) => setTimeout(r, 3500));
      return new Response(DEL_POSTE_1000, { status: 200 });
    }) as unknown as typeof fetch;

    const lectura = await llegadasDelPoste(7000, lenta);
    assert.ok(lectura, '3,5 s está por debajo del tope: eso no es «no lo sabemos»');
    assert.equal(lectura!.llegadas.length, 2);
    assert.equal(reintentosHechos(), 0, 'y no hizo falta reintentar');
  });

  /**
   * ⭐ JUEZ 8 — EL REINTENTO: un fallo suelto no deja el poste mudo.
   *
   * [ZetaBus, `transporte.ts:172`] *«una petición a Avanza, con timeout duro y
   * un reintento»*, con `BACKOFF_MS = 300` entre los dos. **Uno, no tres**: la
   * pantalla está esperando.
   */
  test('⭐ 8 · un fallo suelto se reintenta una vez, y solo una', async () => {
    reiniciarVisitas();
    assert.equal(REINTENTOS, 1);
    assert.equal(BACKOFF_MS, 300);

    let llamadas = 0;
    const flaqueaUnaVez = (async () => {
      llamadas++;
      if (llamadas === 1) {
        throw new Error('ECONNRESET');
      }
      return new Response(DEL_POSTE_1000, { status: 200 });
    }) as unknown as typeof fetch;

    const lectura = await llegadasDelPoste(7001, flaqueaUnaVez);
    assert.ok(lectura, 'el segundo intento contestó');
    assert.equal(llamadas, 2);
    assert.equal(reintentosHechos(), 1);
    assert.equal(visitasHechas(), 1, 'una visita es un poste preguntado, no una petición');

    // Y si falla las dos, se rinde: no se reintenta sin fin.
    reiniciarVisitas();
    let siempreMal = 0;
    const rota = (async () => {
      siempreMal++;
      throw new Error('ENOTFOUND');
    }) as unknown as typeof fetch;
    assert.equal(await llegadasDelPoste(7002, rota), null);
    assert.equal(siempreMal, REINTENTOS + 1, 'un intento y un reintento, y ya');
  });

  /**
   * ⭐ EL MUDO CON SU MOTIVO — las CINCO causas, distinguidas.
   *
   * ═══════════════════════════════════════════════════════════════════════════
   *  ⛔ NACE DE UN DIAGNÓSTICO QUE COSTÓ MEDIA HORA (1/09). Un poste salió mudo
   *    en un Generar y hubo que medir contra el servidor —treinta y tantas
   *    llamadas— para saber cuál de las cinco cosas había pasado. Era un tope
   *    agotado, y era la única de las cinco que se podía descartar mirando el
   *    reloj: el Generar tardó **8.456 ms**, o sea `4000 + 300 + 4000`.
   *
   *  `unaVez` devolvía `null` para todo: el `catch` de red, el `!r.ok` y el
   *  parseo fallido. Cinco causas, un solo silencio.
   *
   *  [GTFS-Realtime] separa «sin información» de «sin servicio»; ZetaBus cuenta
   *  `timeouts`, `errores` y `reintentos` **por separado** (`transporte.ts`). El
   *  motivo es para el log; **el aviso al usuario no cambia**: «no hemos podido
   *  preguntar» sigue siendo lo honesto de cara afuera, porque de cara afuera
   *  las cinco son lo mismo.
   * ═══════════════════════════════════════════════════════════════════════════
   */
  test('⭐ las cinco causas del mudo dan cinco motivos distintos', async () => {
    /** Un `fetch` que falla como se le diga. */
    const cae = (como: string): typeof fetch =>
      (async () => {
        if (como === 'tope') {
          const e = new Error('The operation was aborted due to timeout');
          e.name = 'TimeoutError';
          throw e;
        }
        if (como === 'red') {
          throw new TypeError('fetch failed');
        }
        if (como === 'http') {
          return new Response('lo que sea', { status: 503 });
        }
        if (como === 'parseo') {
          return new Response('esto no es el JSON que esperaba', { status: 200 });
        }
        // «contador»: el fixture MEDIDO con un coche menos en `tablatiempos`.
        //    Es la misma mutación que usa la juez 3, no una respuesta inventada.
        return new Response(DEL_POSTE_1000.replace('4669 [7 mins]', '4669'), { status: 200 });
      }) as unknown as typeof fetch;

    const motivos = new Map<string, string>();
    for (const causa of ['tope', 'red', 'http', 'parseo', 'contador']) {
      reiniciarVisitas();
      const r = await llegadasDelPoste(1000, cae(causa));
      assert.equal(r, null, `«${causa}» tiene que salir mudo`);
      const ultimo = ultimoMudo();
      assert.ok(ultimo, `«${causa}» no ha dejado motivo`);
      motivos.set(causa, ultimo!.motivo);
    }

    // ⭐ CINCO CAUSAS, CINCO MOTIVOS DISTINTOS. Si dos compartieran motivo, el
    //    log volvería a obligar a medir contra el servidor para saber cuál fue.
    assert.equal(new Set(motivos.values()).size, 5, `motivos: ${JSON.stringify([...motivos])}`);
    assert.equal(motivos.get('tope'), 'tope');
    assert.equal(motivos.get('red'), 'red');
    assert.equal(motivos.get('http'), 'http');
    assert.equal(motivos.get('parseo'), 'parseo');
    assert.equal(motivos.get('contador'), 'contador');
  });

  /**
   * ⭐ Y EL MOTIVO LLEVA EL DATO QUE HACE FALTA para no volver a medir: el HTTP
   * su status, el parseo sus bytes, y todos sus milisegundos.
   */
  test('⭐ el motivo del mudo trae el dato de su causa', async () => {
    reiniciarVisitas();
    await llegadasDelPoste(1000, (async () => new Response('x', { status: 503 })) as unknown as typeof fetch);
    const http = ultimoMudo()!;
    assert.equal(http.motivo, 'http');
    assert.equal(http.status, 503);
    assert.ok(http.ms >= 0, 'y sus milisegundos');

    reiniciarVisitas();
    await llegadasDelPoste(
      1000,
      (async () => new Response('no es json', { status: 200 })) as unknown as typeof fetch,
    );
    const parseo = ultimoMudo()!;
    assert.equal(parseo.motivo, 'parseo');
    assert.equal(parseo.bytes, 'no es json'.length);
  });

  /**
   * ⭐ Y EL AVISO AL USUARIO ES EL MISMO EN LAS CINCO.
   *
   * De cara afuera las cinco son lo mismo: se ha preguntado y no se sabe. Un
   * aviso que dijera «error 503» no le sirve a quien espera un autobús, y uno
   * que dijera «se agotó el tiempo» invitaría a pensar que reintentando saldría.
   */
  test('⭐ el aviso al usuario NO distingue la causa', () => {
    for (const motivo of ['tope', 'red', 'http', 'parseo', 'contador'] as const) {
      assert.equal(estadoVivoDe(null, '29').clase, 'mudo', `${motivo} sigue siendo mudo`);
    }
    // Y `EstadoVivo` no lleva el motivo: es del log, no del contrato.
    assert.deepEqual(Object.keys(estadoVivoDe(null, '29')), ['clase']);
  });

});
