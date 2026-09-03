/**
 * ⭐ LAS JUECES DE LA CONSULTA DEL DISTINTIVO (3/09, casilla 3-bis).
 *
 * ⚠️ **CERO RED.** Los cuatro cuerpos son los que la sede de la DGT devolvió de
 *    verdad el 3/09 (sonda B), recortados al `div.avisos_msg` que es lo único
 *    que se lee. Las matrículas de esas consultas salen del **fichero público
 *    de microdatos de la propia DGT** (CC BY 4.0), y aquí van con los cuatro
 *    dígitos tachados: lo que la juez compra es la forma de la respuesta.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  atenderDistintivo,
  consultasHechas,
  esMatricula,
  fraseDeLaSede,
  normalizar,
  type Pedir,
} from './distintivo.ts';

/** El bloque de la sede, con la frase que toque dentro. */
const comoContesta = (frase: string): string =>
  `<form id="distintivoAmbientalForm">…</form> <div class="avisos_msg"> ` +
  `<div class="alert alert-warning alert-dismissible" role="alert"> ` +
  `<p class="my-auto"><span class="fa fa-exclamation-triangle" aria-hidden="true"></span>` +
  `&nbsp;&nbsp;${frase}</p> </div> </div> <script>…</script>`;

/** Las cuatro, literales, medidas el 3/09. */
const CON_ETIQUETA_C = comoContesta(
  'El veh&iacute;culo 0000BBM cumple con los requisitos para obtener el Distintivo Ambiental C. ' +
    'Pulsa en la imagen del distintivo para conocer la informaci&oacute;n contenida en la etiqueta ' +
    'y los veh&iacute;culos que tienen derecho a su obtenci&oacute;n.',
);
const SIN_DISTINTIVO = comoContesta(
  'Sin distintivo. Tu veh&iacute;culo no cumple los requisitos para ser etiquetado como ' +
    'veh&iacute;culo limpio.',
);
const NO_EXISTE = comoContesta(
  'No se ha encontrado ning&uacute;n resultado para la matr&iacute;cula introducida.',
);

/** Un `Pedir` de mentira que cuenta las visitas y contesta lo que se le diga. */
function fuente(cuerpo: string): { pedir: Pedir; visitas: () => number; urls: string[] } {
  let visitas = 0;
  const urls: string[] = [];
  return {
    pedir: async (url) => {
      visitas++;
      urls.push(url);
      return { ok: true, status: 200, texto: cuerpo };
    },
    visitas: () => visitas,
    urls,
  };
}

describe('⭐ EL DISTINTIVO POR MATRÍCULA (casilla 3-bis)', () => {
  /**
   * ⭐ JUEZ 5 — LOS CUATRO CAMINOS, con los cuerpos medidos.
   *
   * Y el cuarto —el formato malo— **no sale a la red**: la DGT publica los tres
   * formatos en el `placeholder` de su propio formulario, así que una matrícula
   * mal escrita se contesta aquí sin gastarle un viaje a la sede.
   */
  test('⭐ 5 · los cuatro caminos de la consulta', async () => {
    const conC = fuente(CON_ETIQUETA_C);
    const etiqueta = await atenderDistintivo('0000BBM', conC.pedir);
    assert.equal(etiqueta.codigo, 200);
    assert.equal(etiqueta.cuerpo.clase, 'etiqueta');
    assert.equal(etiqueta.cuerpo.distintivo, 'C');
    assert.equal(etiqueta.cuerpo.fuente, 'DGT');
    // ⭐ El texto va TAL CUAL lo dio la sede: su aviso legal pide reproducción
    //    fiel. Lo único que se le hace es quitarle las etiquetas y las entidades.
    assert.match(etiqueta.cuerpo.texto, /^El vehículo 0000BBM cumple con los requisitos/);
    assert.ok(!etiqueta.cuerpo.texto.includes('&'), 'las entidades se resuelven');
    assert.ok(etiqueta.cuerpo.cuando.length > 0, 'un dato de ahora lleva su hora');

    const sin = await atenderDistintivo('0000BBC', fuente(SIN_DISTINTIVO).pedir);
    assert.equal(sin.cuerpo.clase, 'sinDistintivo');
    assert.equal(sin.cuerpo.distintivo, undefined);
    assert.match(sin.cuerpo.texto, /^Sin distintivo\./);

    const nada = await atenderDistintivo('0000BBB', fuente(NO_EXISTE).pedir);
    assert.equal(nada.cuerpo.clase, 'noExiste');

    // ⭐ Y el formato malo: 400, y **sin salir a la red**.
    const malo = fuente(NO_EXISTE);
    const roto = await atenderDistintivo('AAAA000', malo.pedir);
    assert.equal(roto.codigo, 400);
    assert.equal(roto.cuerpo.clase, 'formato');
    assert.equal(malo.visitas(), 0, 'una matrícula mal escrita no se le pregunta a nadie');
    // Los tres formatos de la DGT, y nada más.
    for (const buena of ['0000BBM', 'AB1234CD', 'C1234BCD']) {
      assert.equal(esMatricula(buena), true, buena);
    }
    // ⭐ Y con guiones, espacios o minúsculas TAMBIÉN vale: se normaliza antes
    //    de mirar. La DGT pide «sin guiones ni espacios» y contesta un error;
    //    aquí se arregla en vez de regañar, que es lo que cuesta una línea.
    for (const escrita of ['0000-BBM', '0000 bbm', ' 0000bbm ']) {
      assert.equal(esMatricula(normalizar(escrita)), true, escrita);
    }
    for (const mala of ['AAAA000', '000BBM', '0000BBMM', 'AEIOU', '']) {
      assert.equal(esMatricula(normalizar(mala)), false, mala);
    }
  });

  /**
   * ⭐ JUEZ 5 bis — DOS LLAMADAS A LA VEZ SON **UNA SOLA VISITA**.
   *
   * Es el single-flight de la casa [request coalescing]. Y deduplica **solo lo
   * que está en vuelo**: en cuanto la primera termina, la siguiente vuelve a
   * preguntar de verdad. Cachear la respuesta sería **guardar la matrícula**, y
   * eso no se hace.
   */
  test('⭐ 5 bis · dos consultas simultáneas son una visita; la de después, otra', async () => {
    const f = fuente(CON_ETIQUETA_C);
    const antes = consultasHechas();
    const [a, b] = await Promise.all([
      atenderDistintivo('0000BBM', f.pedir),
      atenderDistintivo('0000BBM', f.pedir),
    ]);
    assert.equal(f.visitas(), 1, 'dos pulsaciones a la vez, una visita');
    assert.equal(a.cuerpo.clase, b.cuerpo.clase);
    assert.equal(consultasHechas(), antes + 1);

    // Y ya suelta: la de después pregunta otra vez.
    await atenderDistintivo('0000BBM', f.pedir);
    assert.equal(f.visitas(), 2, 'no hay caché: lo de antes no vale para ahora');

    // Dos matrículas distintas nunca comparten vuelo.
    const g = fuente(SIN_DISTINTIVO);
    await Promise.all([atenderDistintivo('0000BBC', g.pedir), atenderDistintivo('0000BCX', g.pedir)]);
    assert.equal(g.visitas(), 2);
  });

  /**
   * ⭐ JUEZ 5 ter — CUANDO LA FUENTE FALLA: un reintento, y luego mudo.
   *
   * El mudo lleva **motivo al log y no lleva matrícula**, y el texto que se
   * enseña dice qué hacer: elegir a mano. Es el D-G de la casa — componer sin
   * prometer— aplicado a la DGT.
   */
  test('⭐ 5 ter · un fallo se reintenta una vez; dos, y se dice que no se sabe', async () => {
    let visitas = 0;
    const aLaSegunda: Pedir = async (url) => {
      visitas++;
      void url;
      if (visitas === 1) {
        throw new Error('la red');
      }
      return { ok: true, status: 200, texto: CON_ETIQUETA_C };
    };
    const bien = await atenderDistintivo('0000BBM', aLaSegunda);
    assert.equal(visitas, 2, 'un reintento');
    assert.equal(bien.cuerpo.clase, 'etiqueta');

    let siempre = 0;
    const nunca: Pedir = async () => {
      siempre++;
      throw new Error('la red');
    };
    const roto = await atenderDistintivo('0000BCX', nunca);
    assert.equal(siempre, 2, 'uno y un reintento, no tres');
    assert.equal(roto.codigo, 200, 'la fuente muda no es un error nuestro');
    assert.equal(roto.cuerpo.clase, 'mudo');
    assert.match(roto.cuerpo.texto, /a mano/);

    // Y un 200 con la página cambiada: parseo, no invención.
    const otraPagina = await atenderDistintivo('0000CLP', async () => ({
      ok: true,
      status: 200,
      texto: '<html><body>la sede se ha rehecho</body></html>',
    }));
    assert.equal(otraPagina.cuerpo.clase, 'mudo');
    assert.equal(fraseDeLaSede('<html>sin nada</html>'), null);
  });

  /**
   * ⭐ JUEZ 7 — **LA MATRÍCULA NO SALE DE LA CONSULTA**.
   *
   * Ni en la respuesta, ni en el log. Se comprueba capturando lo que el módulo
   * escribe por `console.log` mientras se le hacen las cuatro consultas, y
   * mirando también el JSON de todas ellas.
   */
  test('⭐ 7 · ni la respuesta ni el log llevan la matrícula', async () => {
    const dicho: string[] = [];
    const original = console.log;
    console.log = (...x: unknown[]): void => {
      dicho.push(x.map((y) => String(y)).join(' '));
    };
    let cuerpos = '';
    try {
      const casos: readonly (readonly [string, Pedir])[] = [
        ['0000BCX', fuente(SIN_DISTINTIVO).pedir],
        ['0000HTT', fuente(NO_EXISTE).pedir],
        ['AAAA000', fuente(NO_EXISTE).pedir],
        ['0002BGP', async () => { throw new Error('la red'); }],
      ];
      for (const [matricula, pedir] of casos) {
        const r = await atenderDistintivo(matricula, pedir);
        cuerpos += JSON.stringify(r.cuerpo);
      }
    } finally {
      console.log = original;
    }

    // ⚠️ `0000BBM` SÍ aparece en un texto: es la frase que la DGT devuelve, y
    //    ésa se reproduce fiel. Por eso las cuatro de aquí son OTRAS: lo que se
    //    compra es que la matrícula **que se preguntó** no se filtre por su
    //    cuenta a ningún sitio.
    for (const matricula of ['0000BCX', '0000HTT', 'AAAA000', '0002BGP']) {
      assert.equal(cuerpos.includes(matricula), false, `${matricula} en la respuesta`);
      assert.equal(dicho.join('\n').includes(matricula), false, `${matricula} en el log`);
    }
    // Y el log sí cuenta la consulta: qué pasó, sin decir de quién.
    assert.ok(dicho.some((x) => x.includes('distintivo — 400 (formato)')));
    assert.ok(dicho.some((x) => x.includes('distintivo — mudo (red)')));
  });
});
