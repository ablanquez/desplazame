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

/**
 * ⭐ LAS CUATRO QUE DECIDEN — tanda T1 (24/09), sobre el hallazgo A-1 / C-1.
 *
 * ── ⚠️ Qué destapó la auditoría, y por qué las de arriba no bastaban ────────
 *
 * Las juezas del 8/09 compraron **lo que se PINTA**: `alMinuto` y el `cuando`
 * del BiZi. Pero el huso no solo se pinta — **decide**. La auditoría de cierre
 * censó [A-CODIGO.md § A-1] **cuatro funciones que eligen** leyendo el reloj
 * del proceso con `getHours`, `getDay`, `getDate`:
 *
 *   · `hoyEnGtfs`          → qué día de servicio se busca en el calendario
 *   · `segundosDelDia`     → desde qué minuto se buscan los viajes del bus
 *   · `laZbeEstaEnVigor`   → si se veta o no la Zona de Bajas Emisiones
 *   · `laVentana`          → qué fechas sabe contestar el cuadro del festivo
 *
 * Y la mutación de [C-TESTS.md § C-1] midió el agujero: **95 juezas seguían en
 * verde** con el motor sirviendo el día equivocado. Ninguna podía verlo,
 * porque todas corren en esta máquina, que va en hora de Madrid — la misma
 * casualidad de la nº41, otra vez, un piso más abajo.
 *
 * En producción muerde: el servidor va en **UTC**, así que de 00:00 a 02:00 de
 * Zaragoza se sirve el día GTFS **anterior**, y la franja de la ZBE corre dos
 * horas atrasada **todo el día**.
 *
 * ── El instante elegido, y por qué ése ──────────────────────────────────────
 *
 * `2026-09-14T22:30:00Z` es, en Zaragoza, **el martes 15 a las 00:30**, y en
 * UTC **el lunes 14 a las 22:30**. Cambian de golpe la hora, el día del mes
 * **y el día de la semana**: un instante que separa las dos respuestas en los
 * tres ejes a la vez. Los otros dos muerden la franja por sus dos bordes.
 */

/** Lo que el hijo mide de las cuatro que deciden. */
interface LoQueDeciden {
  readonly zona: string;
  readonly diaGtfs: string;
  readonly segundos: number;
  readonly primeroDeLaVentana: string;
  readonly ultimoDeLaVentana: string;
  readonly avisoDeLaZbe: string;
  readonly zbeAlAbrir: boolean;
  readonly zbeAlCerrar: boolean;
}

/** En Zaragoza es el **martes 15 a las 00:30**; en UTC, el lunes 14 a las 22:30. */
const MADRUGADA = '2026-09-14T22:30:00Z';
/** Las **08:30 del martes** en Zaragoza —la ZBE ya está en vigor—; 06:30 en UTC. */
const AL_ABRIR = '2026-09-15T06:30:00Z';
/** Las **20:30 del martes** en Zaragoza —la ZBE ya NO—; 18:30 en UTC, que sí. */
const AL_CERRAR = '2026-09-15T18:30:00Z';

let deciden: LoQueDeciden;

describe('⭐ EL HUSO QUE DECIDE — las cuatro del A-1, con el proceso en UTC', () => {
  before(async () => {
    const trayecto = new URL('./trayecto.ts', import.meta.url).href;
    const viajeBus = new URL('./viaje-bus.ts', import.meta.url).href;
    const viajeCoche = new URL('./viaje-coche.ts', import.meta.url).href;
    const festivo = new URL('./festivo.ts', import.meta.url).href;
    const guion = [
      'const { hoyEnGtfs } = await import(process.argv[1]);',
      'const { segundosDelDia } = await import(process.argv[2]);',
      'const { laZbeEstaEnVigor, avisoDelRelojDeLaZbe } = await import(process.argv[3]);',
      'const { laVentana } = await import(process.argv[4]);',
      'const madrugada = new Date(process.argv[5]);',
      'const ventana = laVentana(madrugada);',
      'console.log(JSON.stringify({',
      '  zona: Intl.DateTimeFormat().resolvedOptions().timeZone,',
      '  diaGtfs: hoyEnGtfs(madrugada),',
      '  segundos: segundosDelDia(madrugada),',
      '  primeroDeLaVentana: ventana[0],',
      '  ultimoDeLaVentana: ventana[ventana.length - 1],',
      '  avisoDeLaZbe: avisoDelRelojDeLaZbe(madrugada),',
      '  zbeAlAbrir: laZbeEstaEnVigor(new Date(process.argv[6])),',
      '  zbeAlCerrar: laZbeEstaEnVigor(new Date(process.argv[7])),',
      '}));',
    ].join('\n');

    deciden = await new Promise<LoQueDeciden>((listo, falla) => {
      const hijo = spawn(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          guion,
          trayecto,
          viajeBus,
          viajeCoche,
          festivo,
          MADRUGADA,
          AL_ABRIR,
          AL_CERRAR,
        ],
        // ⭐ EL RELOJ DE PRODUCCIÓN, que es el que esta máquina no puede tener.
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
        listo(JSON.parse(linea) as LoQueDeciden);
      });
    });
  });

  /**
   * ⭐ JUEZ 0 — EL RELOJ FALSO HA ENTRADO, otra vez.
   *
   * La misma de arriba y por la misma razón: sin comprar que el hijo va de
   * verdad en UTC, las cinco de abajo podrían estar dándose la razón desde
   * Madrid. Es la juez que vigila a las jueces.
   */
  test('⭐ 0 · el hijo corre de verdad en UTC, no en el huso de esta máquina', () => {
    assert.equal(deciden.zona, 'UTC', `el hijo dice estar en ${deciden.zona}`);
  });

  /**
   * ⭐ JUEZ 5 — EL DÍA DE SERVICIO DEL BUS ES EL DE LA CALLE.
   *
   * A las 00:30 de Zaragoza en UTC todavía es ayer, y con el día de ayer se
   * busca en el calendario del GTFS de ayer: horarios de otro día de servicio.
   */
  test('⭐ 5 · hoyEnGtfs da el día de Zaragoza aunque el proceso vaya en UTC', () => {
    assert.equal(
      deciden.diaGtfs,
      '20260915',
      `${MADRUGADA} es el martes 15 en Zaragoza y se sirvió el día «${deciden.diaGtfs}»`,
    );
  });

  /**
   * ⭐ JUEZ 6 — Y EL MINUTO DESDE EL QUE SE BUSCA, TAMBIÉN.
   *
   * 22 h de diferencia en el punto de partida de la búsqueda: no es un viaje
   * peor, es el conjunto entero de viajes equivocado.
   */
  test('⭐ 6 · segundosDelDia cuenta desde la medianoche de Zaragoza', () => {
    assert.equal(
      deciden.segundos,
      1800,
      `las 00:30 de Zaragoza son 1800 s y se contaron ${deciden.segundos}`,
    );
  });

  /**
   * ⭐ JUEZ 7 — LA VENTANA DEL FESTIVO EMPIEZA HOY, y «hoy» es el de la calle.
   *
   * Desplazada un día, la ventana deja fuera el **+9** real y mete el de ayer,
   * que la web contesta vacío: se gasta una visita para nada y se deja sin
   * suplir el día que sí tenía cuadro.
   */
  test('⭐ 7 · laVentana arranca en el día de Zaragoza, no en el de UTC', () => {
    assert.equal(deciden.primeroDeLaVentana, '20260915', 'la ventana empieza hoy');
    assert.equal(deciden.ultimoDeLaVentana, '20260924', 'y llega a hoy + 9');
  });

  /**
   * ⭐ JUEZ 8 — LA FRANJA DE LA ZBE, POR SUS DOS BORDES.
   *
   * Es la que decide si se veta media ciudad. Con el proceso en UTC la franja
   * corre **dos horas atrasada todo el día**: a las 08:30 de la calle no veta
   * —y debe— y a las 20:30 veta —y no debe—.
   */
  test('⭐ 8 · la ZBE abre y cierra por el reloj de la calle, no por el del proceso', () => {
    assert.equal(deciden.zbeAlAbrir, true, 'a las 08:30 de Zaragoza la zona YA está en vigor');
    assert.equal(deciden.zbeAlCerrar, false, 'y a las 20:30 ya NO lo está');
  });

  /**
   * ⭐ JUEZ 9 — Y EL AVISO DICE LA HORA QUE SE MIRÓ, que es la de Zaragoza.
   *
   * ⚠️ Cruza el **día de la semana** además de la hora: en UTC ese instante es
   *    lunes y en Zaragoza martes. Un aviso que dice el día equivocado es el
   *    fallo contándose a sí mismo en pantalla.
   */
  test('⭐ 9 · el aviso del reloj de la ZBE nombra la hora y el día de Zaragoza', () => {
    assert.match(
      deciden.avisoDeLaZbe,
      /son las 00:30 del martes/,
      `el aviso salió: «${deciden.avisoDeLaZbe}»`,
    );
  });
});
