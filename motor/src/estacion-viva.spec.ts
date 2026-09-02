/**
 * ⭐ EL ENDPOINT DE LA ESTACIÓN VIVA (2/09).
 *
 * ⚠️ **CERO RED.** La disponibilidad se le pasa por parámetro —`consultar`—,
 *    que es justo para qué existe ese parámetro: aquí se juzga **cómo se dice**
 *    lo que la sede conteste, y eso no depende de que la sede esté levantada.
 *    Lo que sí sale de una medición son los NÚMEROS del fixture: 8 bicis / 12
 *    anclajes libres a las 11:56 son la forma de la respuesta real de § 1.23.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTA_ESTACION,
  atenderEstacionViva,
  comoSeDiceLaEstacion,
  conUnidad,
  laCifra,
} from './estacion-viva.ts';
import type { Disponibilidad, EstadoDeEstacion } from './bizi.ts';

/** Una estación como la sirve la sede: bicis, anclajes libres y SU hora. */
function estado(bicis: number, anclajesLibres: number): EstadoDeEstacion {
  return {
    bicis,
    anclajesLibres,
    enServicio: true,
    cuando: new Date('2026-09-02T09:56:00Z'),
  };
}

function conEstaciones(pares: ReadonlyArray<readonly [number, EstadoDeEstacion]>): Disponibilidad {
  return {
    porNumero: new Map(pares),
    total: pares.length,
    enMantenimiento: 0,
    enMs: 12,
  };
}

/** La 42 con 8 bicis y 12 anclajes libres. Es el caso normal. */
const HAY = conEstaciones([[42, estado(8, 12)]]);

describe('la cifra de una estación', () => {
  test('las bicis y los anclajes se dicen con su unidad', () => {
    assert.equal(laCifra(estado(8, 12), 'bicis'), '8 bicis disponibles');
    assert.equal(laCifra(estado(8, 12), 'anclajes'), '12 anclajes libres');
  });

  /**
   * ⭐ EL SINGULAR, que es el que se olvida. «1 bicis disponibles» es la clase
   * de detalle que nadie prueba y que se lee en la pantalla el día que una
   * estación se queda con una sola.
   */
  test('con UNA se dice en singular, las dos veces', () => {
    assert.equal(laCifra(estado(1, 1), 'bicis'), '1 bici disponible');
    assert.equal(laCifra(estado(1, 1), 'anclajes'), '1 anclaje libre');
  });

  test('el cero se dice, no se calla', () => {
    assert.equal(laCifra(estado(0, 0), 'bicis'), '0 bicis disponibles');
    assert.equal(conUnidad(0, 'bici', 'bicis'), '0 bicis');
  });
});

describe('cómo se dice el estado de una estación', () => {
  test('⭐ con dato: la cifra y LA HORA DE ESE DATO', () => {
    const dicho = comoSeDiceLaEstacion(HAY, 42, 'bicis', ESTA_ESTACION);
    assert.equal(dicho.clase, 'hay');
    // La hora es la de `cuando` de la estación, no la de ahora: [DOC GBFS]
    // `last_reported` va por estación, y el 30/08 una respuesta real traía
    // seis marcas distintas entre sus 276 filas.
    assert.equal(dicho.texto, '8 bicis disponibles a las 11:56');
  });

  test('los anclajes son otra pregunta, y otra cifra', () => {
    const dicho = comoSeDiceLaEstacion(HAY, 42, 'anclajes', ESTA_ESTACION);
    assert.equal(dicho.clase, 'hay');
    assert.equal(dicho.texto, '12 anclajes libres a las 11:56');
  });

  /**
   * ⭐ AUSENTE NO ES CERO. [GTFS-Realtime] una entidad ausente del feed vivo
   * significa **sin información**, no «sin servicio» — y traducirla a «0 bicis»
   * sería publicar un número que nadie ha dicho.
   */
  test('⭐ la sede contesta y no trae esa estación: ausente, y NO cero', () => {
    const dicho = comoSeDiceLaEstacion(HAY, 999, 'bicis', ESTA_ESTACION);
    assert.equal(dicho.clase, 'ausente');
    assert.match(dicho.texto, /no publica esta estación/);
    assert.match(dicho.texto, /falta de información, no de bicis/);
    assert.doesNotMatch(dicho.texto, /\b0\b/);
  });

  test('y con anclajes, lo que no falta son anclajes libres', () => {
    const dicho = comoSeDiceLaEstacion(HAY, 999, 'anclajes', ESTA_ESTACION);
    assert.match(dicho.texto, /falta de información, no de anclajes libres/);
  });

  /**
   * ⭐ EL D-G DEL AYUNTAMIENTO, con sus palabras. Son las mismas que usa el
   * aviso del Generar y las mismas que el `mudo` del poste: se ha preguntado y
   * no se sabe. Que las tres cosas se digan igual **es** la doctrina.
   */
  test('⭐ la sede no contesta: mudo, con «disponibilidad no verificada»', () => {
    const dicho = comoSeDiceLaEstacion(null, 42, 'bicis', ESTA_ESTACION);
    assert.equal(dicho.clase, 'mudo');
    assert.match(dicho.texto, /disponibilidad no verificada/);
    assert.match(dicho.texto, /cuántas bicis hay/);
  });

  test('y el mudo de los anclajes pregunta por anclajes', () => {
    const dicho = comoSeDiceLaEstacion(null, 42, 'anclajes', ESTA_ESTACION);
    assert.match(dicho.texto, /cuántos anclajes libres hay/);
  });
});

describe('el endpoint', () => {
  const siempre = (d: Disponibilidad | null) => () => Promise.resolve(d);

  test('contesta 200 con la cifra', async () => {
    const r = await atenderEstacionViva('42', 'bicis', siempre(HAY));
    assert.equal(r.codigo, 200);
    assert.deepEqual(r.cuerpo, { clase: 'hay', texto: '8 bicis disponibles a las 11:56' });
  });

  /**
   * ⭐ LA VALIDACIÓN, y es la misma trampa que en el poste: `Number('')` vale
   * **0** y `Number('  3 ')` vale **3**. Dejar que el constructor decida
   * convierte una petición vacía en la estación 0.
   */
  test('⭐ sin «estacion», con basura o con cero: 400, no una estación inventada', async () => {
    for (const malo of [null, '', '   ', 'cuarenta', '4x', '0', '-3', '3.5']) {
      const r = await atenderEstacionViva(malo, 'bicis', siempre(HAY));
      assert.equal(r.codigo, 400, `«${malo}» tenía que ser 400`);
    }
  });

  /**
   * ⭐ Y `pide` se exige EXACTO. Un `pide=bicicletas` no es «casi bicis»:
   * contestar bicis a eso sería adivinar qué quería quien preguntó.
   */
  test('⭐ «pide» solo vale «bicis» o «anclajes»', async () => {
    for (const malo of [null, '', 'bicicletas', 'BICIS', 'anclaje', 'todo']) {
      const r = await atenderEstacionViva('42', malo, siempre(HAY));
      assert.equal(r.codigo, 400, `«${malo}» tenía que ser 400`);
    }
    assert.equal((await atenderEstacionViva('42', 'anclajes', siempre(HAY))).codigo, 200);
  });

  /**
   * ⭐ UNA ESTACIÓN QUE NO EXISTE **NO ES UN 400**, y esto es doctrina heredada
   * del poste: el 400 es para la petición mal escrita, que es un fallo de quien
   * pregunta. Una estación que la sede no publica es un hecho de la fuente, y
   * se contesta con 200 y un «no lo sabemos».
   */
  test('⭐ una estación que la sede no trae contesta 200 y «ausente»', async () => {
    const r = await atenderEstacionViva('999', 'bicis', siempre(HAY));
    assert.equal(r.codigo, 200);
    assert.equal('clase' in r.cuerpo && r.cuerpo.clase, 'ausente');
  });

  test('⭐ con la sede caída contesta 200 y «mudo»: el D-G, no un 503', async () => {
    const r = await atenderEstacionViva('42', 'bicis', siempre(null));
    assert.equal(r.codigo, 200);
    assert.equal('clase' in r.cuerpo && r.cuerpo.clase, 'mudo');
  });

  /**
   * ⭐ CADA PETICIÓN VUELVE A PREGUNTAR. Es la regla del BiZi —frescura por
   * petición, nunca caché— y aquí se compra contando visitas: dos llamadas al
   * endpoint son **dos** consultas a la fuente, no una servida de memoria.
   */
  test('⭐ dos peticiones son DOS consultas a la fuente: aquí no hay caché', async () => {
    let visitas = 0;
    const contando = () => {
      visitas++;
      return Promise.resolve(HAY);
    };
    await atenderEstacionViva('42', 'bicis', contando);
    await atenderEstacionViva('42', 'bicis', contando);
    assert.equal(visitas, 2);
  });
});
