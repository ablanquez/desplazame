/**
 * ⭐ LA HORA DE QUIEN MIRA — juzgada CON EL PROCESO EN OTRO HUSO (8/09, nº41).
 *
 * ── ⚠️ Por qué esta suite lanza un HIJO en vez de comprobar aquí ────────────
 *
 * Porque **una juez que corre en el mismo huso que el código que juzga no
 * vigila el huso**: comparten la premisa y solo pueden darse la razón. Esta
 * máquina va en hora de Madrid, así que `alMinuto` acertaba en local mientras
 * en producción —Fráncfort, UTC— el poste enseñaba «13:53» a quien vive a las
 * 15:53. Las suites enteras en verde, 646/646, sin poder ver nada.
 *
 * Node fija su huso **al arrancar**, así que el reloj falso no se pone con un
 * mock: se pone lanzando el proceso con `TZ=UTC`, que es la condición de
 * producción. Es la misma técnica que las jueces del lanzador de Hostinger.
 *
 * ⚠️ Y la primera cosa que se compra es **que el reloj falso ha entrado**: sin
 *    eso, esta suite podría estar dando verde desde Madrid otra vez.
 *
 * ── Las dos mitades van juntas ──────────────────────────────────────────────
 *
 * El BiZi acertaba en pantalla por DOS errores que se anulaban: su `cuando` se
 * parseaba 2 h adelantado y luego se pintaba en UTC. Arreglar solo una mitad
 * rompe el texto que hoy sale bien, así que se juzgan las dos a la vez: el
 * INSTANTE guardado (contra el epoch, no contra un texto) y el TEXTO pintado.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

/** Lo que el hijo mide y devuelve. */
interface LoMedido {
  readonly zona: string;
  readonly pintadoDeUnInstanteFijo: string;
  readonly epochDeLaSede: number;
  readonly textoDelBizi: string;
  readonly epochEnInvierno: number;
}

/**
 * ⭐ EL CRUDO DE LA SEDE, copiado del feed real [la ley de la nº32].
 *
 * `lastUpdated` llega en ISO **sin marca de huso** y es hora española: § 1.23.
 * `2026-08-30T12:48:00` en Zaragoza (verano, CEST +2) es `10:48:00Z`.
 */
const CRUDO_DE_VERANO = '2026-08-30T12:48:00';
const INSTANTE_DE_VERANO = Date.parse('2026-08-30T10:48:00Z');

/** El mismo reloj de pared en INVIERNO: CET +1, así que son las 11:48 Z. */
const CRUDO_DE_INVIERNO = '2026-12-15T12:48:00';
const INSTANTE_DE_INVIERNO = Date.parse('2026-12-15T11:48:00Z');

/** Un instante fijo que en Zaragoza son las 12:48 de aquel día. */
const FIJO = '2026-08-30T10:48:00Z';

let medido: LoMedido;

describe('⭐ EL HUSO — la hora es la de Zaragoza, corra el motor donde corra', () => {
  before(async () => {
    // ⚠️ Se pasan como URL `file://` y no como ruta: el `import()` dinámico de
    //    Node no admite `f:\…` en Windows (ERR_UNSUPPORTED_ESM_URL_SCHEME).
    const reloj = new URL('./reloj.ts', import.meta.url).href;
    const etapas = new URL('./etapas.ts', import.meta.url).href;
    const guion = [
      'const { cuandoDeLaSede } = await import(process.argv[1]);',
      'const { alMinuto } = await import(process.argv[2]);',
      'const fijo = new Date(process.argv[3]);',
      'const deLaSede = cuandoDeLaSede(process.argv[4]);',
      'console.log(JSON.stringify({',
      '  zona: Intl.DateTimeFormat().resolvedOptions().timeZone,',
      '  pintadoDeUnInstanteFijo: alMinuto(fijo),',
      '  epochDeLaSede: deLaSede.getTime(),',
      '  textoDelBizi: alMinuto(deLaSede),',
      '  epochEnInvierno: cuandoDeLaSede(process.argv[5]).getTime(),',
      '}));',
    ].join('\n');

    medido = await new Promise<LoMedido>((listo, falla) => {
      const hijo = spawn(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          guion,
          reloj,
          etapas,
          FIJO,
          CRUDO_DE_VERANO,
          CRUDO_DE_INVIERNO,
        ],
        // ⭐ AQUÍ ESTÁ EL RELOJ FALSO, y es el de producción.
        { env: { ...process.env, TZ: 'UTC' } },
      );
      let salida = '';
      hijo.stdout.on('data', (t: Buffer) => (salida += t.toString()));
      hijo.stderr.on('data', (t: Buffer) => (salida += t.toString()));
      hijo.on('close', () => {
        const linea = salida.split('\n').find((l) => l.trim().startsWith('{'));
        if (!linea) {
          falla(new Error(`el hijo no midió nada. Lo que dijo:\n${salida.slice(-900)}`));
          return;
        }
        listo(JSON.parse(linea) as LoMedido);
      });
    });
  });

  /**
   * ⭐ JUEZ 0 — EL RELOJ FALSO HA ENTRADO.
   *
   * Sin esto, todo lo de abajo podría estar midiéndose desde Madrid y dando
   * verde por la misma casualidad que ocultó el fallo. Es la juez que vigila a
   * las jueces.
   */
  test('⭐ 0 · el hijo corre de verdad en UTC, no en el huso de esta máquina', () => {
    assert.equal(medido.zona, 'UTC', `el hijo dice estar en ${medido.zona}`);
  });

  /**
   * ⭐ JUEZ 1 — LA HORA PINTADA ES LA DE ZARAGOZA, CON EL PROCESO EN UTC.
   *
   * Es el fallo que vio el ojo: un instante que en Zaragoza son las 12:48 tiene
   * que escribirse «12:48» aunque el servidor viva en Fráncfort. Antes del
   * arreglo esto daba «10:48».
   */
  test('⭐ 1 · alMinuto pinta la hora de Zaragoza aunque el proceso vaya en UTC', () => {
    assert.equal(
      medido.pintadoDeUnInstanteFijo,
      '12:48',
      `${FIJO} son las 12:48 en Zaragoza y se pintó «${medido.pintadoDeUnInstanteFijo}»`,
    );
  });

  /**
   * ⭐ JUEZ 2 — EL `cuando` DEL BiZi ES EL INSTANTE REAL.
   *
   * ⚠️ **Se compara contra el EPOCH y no contra un texto**, a propósito: el
   *    texto salía bien mientras la fecha estaba mal, y comparar textos es lo
   *    que dejó pasar esto. Lo que se compra es el instante.
   */
  test('⭐ 2 · el cuando de la sede se guarda como el instante que de verdad es', () => {
    assert.equal(
      medido.epochDeLaSede,
      INSTANTE_DE_VERANO,
      `«${CRUDO_DE_VERANO}» es hora española: son ${INSTANTE_DE_VERANO} (10:48Z) y se guardó ` +
        `${medido.epochDeLaSede} (${new Date(medido.epochDeLaSede).toISOString()})`,
    );
  });

  /**
   * ⭐ JUEZ 3 — Y EL TEXTO DEL BiZi SIGUE SALIENDO BIEN.
   *
   * Las dos mitades del compensado se deshacen juntas. Si solo se arreglara el
   * parseo, esto diría «14:48»; si solo se arreglara el pintado, «10:48».
   */
  test('⭐ 3 · deshecho el compensado, el texto del BiZi sigue diciendo 12:48', () => {
    assert.equal(medido.textoDelBizi, '12:48');
  });

  /**
   * ⭐ JUEZ 4 — EL CAMBIO DE HORA, que es por lo que no vale un `+2` fijo.
   *
   * [La doctrina del 8/09] zona IANA, nunca desfase fijo: el +2 muere cada
   * octubre. El mismo reloj de pared —12:48— es 10:48Z en agosto y 11:48Z en
   * diciembre, y las dos cosas tienen que salir de la misma función.
   */
  test('⭐ 4 · el mismo reloj de pared es otro instante en invierno (CET, +1)', () => {
    assert.equal(
      medido.epochEnInvierno,
      INSTANTE_DE_INVIERNO,
      `«${CRUDO_DE_INVIERNO}» en invierno es 11:48Z y salió ` +
        `${new Date(medido.epochEnInvierno).toISOString()}`,
    );
    // Y no es el mismo desfase que en verano: si lo fuera, sería un `+2` fijo.
    const enVerano = INSTANTE_DE_VERANO - Date.parse(`${CRUDO_DE_VERANO}Z`);
    const enInvierno = medido.epochEnInvierno - Date.parse(`${CRUDO_DE_INVIERNO}Z`);
    assert.notEqual(enVerano, enInvierno, 'el desfase de verano y el de invierno no son el mismo');
  });
});
