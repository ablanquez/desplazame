/**
 * ⭐ LAS JUECES DEL HUECO DE LAS CAPAS (6/09).
 *
 * ⚠️ **CERO RED.** La red se cocina del zip del repositorio y a Avanza no se le
 * llama: el dato vivo del poste entra por un `pedir` de mentira que contesta
 * 503, que es la conducta del mudo y no cambia el viaje.
 *
 * El fallo que vigilan es de los que solo existen **durante un minuto**: entre
 * que el motor empieza a contestar y que sus dos capas aterrizan pasan unos 60
 * segundos, y en ese hueco se servía el horario oficial **sin decirlo**. El
 * 6/09 eso mandó a alguien a transbordar en el Coso, que está en obras. Ver la
 * entrada de esa fecha en `docs/BITACORA.md`.
 *
 * ⭐ ── LA REGLA DE CASA ────────────────────────────────────────────────────
 *
 * Estas jueces montan sobre la **red operativa** cuando compran un viaje
 * concreto, y cuando montan sobre la pelada es **el caso**: el hueco ES la
 * ausencia de capa.
 */
import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed } from './red.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarPortales } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { entornoDe } from './gacetero.ts';
import { cargarRedDeLaRueda } from './red-rueda.ts';
import { cargarAparcabicis } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { elFeedQueSeSirve } from './feed.ts';
import { andarConElPeaton, cocinar, servirEstaRed, type RedDeBus } from './red-bus.ts';
import { lineaDelViaje } from './viaje-bus.ts';
import {
  aplicarDesvios,
  aristaDeLaTraza,
  edadDeLaOperativa,
  rodarConElCoche,
  servirOperativa,
  EDAD_FRESCA_MS,
  RITMO_DEL_REFRESCO_MS,
  type RedConDesvios,
} from './patron-operativo.ts';
import { cargarRedDeCoche } from './coche.ts';
import { compararRecorrido, oficialDe } from './desvios.ts';
import {
  elFestivoHaAterrizado,
  huecosDelCalendario,
  olvidarElFestivo,
  refrescarElFestivo,
} from './festivo.ts';
import { calcularTrayecto, calcularTrayectoVivo, hoyEnGtfs, type Motor } from './trayecto.ts';
import { leerPeticion } from './peticion.ts';

/** El caso del ojo: `CALLE EL COLOSO 2 → AV. ALCALDE GÓMEZ LAGUNA 38`. */
const EL_CASO = {
  origen: { via: '8065', portal: 'Portales.93310' },
  destino: { via: '13340', portal: 'Portales.92683' },
  modo: 'bus',
};

/** Un domingo con huecos de calendario: así la capa del festivo tiene trabajo. */
const UN_DOMINGO = new Date(2026, 8, 13, 13, 0, 0, 0);
/** Y un laborable, donde el feed lo trae todo y no hay nada que suplir. */
const UN_LUNES = new Date(2026, 8, 14, 13, 0, 0, 0);

/** 🔒 Nada sale a la red: el poste vivo contesta 503 y el viaje sale igual. */
const LA_CALLE_MUDA: typeof fetch = (async () =>
  new Response('', { status: 503 })) as unknown as typeof fetch;

let motor: Motor;
let red: RedDeBus;
let operativa: RedConDesvios;

/** Los avisos que hablan del hueco, que son los que estas jueces compran. */
const delHueco = (t: { readonly avisos: readonly { readonly texto: string }[] }) =>
  t.avisos.filter((a) => /aún no se han? podido leer|se leyeron hace/.test(a.texto));

describe('⭐ EL HUECO DE LAS CAPAS — servir diciendo lo que se sabe', () => {
  before(async () => {
    const peaton = cargarRed(cargarGrafo());
    const portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    const redRueda = cargarRedDeLaRueda(cargarGrafo(), peaton, entornoDe(portales));
    motor = {
      red: peaton,
      rejilla: cargarRejilla(peaton),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(peaton),
      redRueda,
      rejillaRueda: cargarRejilla(redRueda),
      cuadernoRueda: cuadernoPara(redRueda),
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi: cargarBiZi(entornoDe(portales)),
    };
    red = (
      await cocinar(
        elFeedQueSeSirve().ruta,
        andarConElPeaton(peaton, cargarRejilla(peaton), cuadernoPara(peaton)),
      )
    ).red;
    servirEstaRed(red);

    // Una operativa de verdad, aunque sin desvíos: lo que se juzga aquí es que
    // HAYA capa y cuándo se sirvió, no qué trae dentro.
    const coche = cargarRedDeCoche();
    operativa = aplicarDesvios(
      red,
      () => null,
      new Map(),
      rodarConElCoche(coche),
      (traza, saliendo) => aristaDeLaTraza(coche, traza, saliendo),
    );
  });

  beforeEach(() => {
    servirOperativa(null);
    olvidarElFestivo();
  });

  /** La capa del festivo, dada por aterrizada sin salir a ninguna parte. */
  const elFestivoAterriza = async (cuando: Date): Promise<void> => {
    const fecha = hoyEnGtfs(cuando);
    const cortoDe = (p: Parameters<typeof lineaDelViaje>[1]) => lineaDelViaje(red, p).corto;
    // Una web que calla: el pase termina igual, que es lo que marca.
    await refrescarElFestivo(red, fecha, cortoDe, LA_CALLE_MUDA, 0);
  };

  /**
   * ⭐ JUEZ 1 — CON LAS CAPAS FRÍAS SE DICE; CON LAS CALIENTES, NO.
   *
   * Es el caso de Antonio a las 17:20. El viaje sale —no se bloquea nada— pero
   * la respuesta lleva por delante que está calculada con el horario oficial.
   */
  test('⭐ 1 · con las capas frías la respuesta lo declara, y con las calientes no', async () => {
    const frio = await calcularTrayectoVivo(motor, leerPeticion(EL_CASO), LA_CALLE_MUDA, UN_DOMINGO);
    assert.ok(frio.tramos.length > 0, 'el viaje tiene que salir igual: el listen no se bloquea');
    const dichos = delHueco(frio).map((a) => a.texto);
    assert.ok(
      dichos.some((t) => t.includes('los desvíos de hoy aún no se han podido leer')),
      `falta el aviso del hueco: ${JSON.stringify(frio.avisos.map((a) => a.texto))}`,
    );
    assert.ok(
      dichos.some((t) => t.includes('líneas cuyo horario de hoy')),
      'y el del festivo, que un domingo SÍ tiene huecos que suplir',
    );

    // Y con las dos calientes, ni uno.
    servirOperativa(operativa, UN_DOMINGO.getTime());
    await elFestivoAterriza(UN_DOMINGO);
    const caliente = await calcularTrayectoVivo(
      motor,
      leerPeticion(EL_CASO),
      LA_CALLE_MUDA,
      UN_DOMINGO,
    );
    assert.deepEqual(delHueco(caliente), [], 'con las capas calientes no se avisa de nada');
  });

  /**
   * ⭐ JUEZ 2 — LA CAPA VIEJA SE SIRVE, Y SE DICE SU EDAD.
   *
   * [*stale-while-revalidate*.] Un desvío de hace ocho horas sigue siendo mejor
   * información que el recorrido de curso, así que **no se tira**. Lo que no
   * vale es servirlo callando cuándo se leyó.
   */
  test('⭐ 2 · la capa envejecida se sirve CON su edad dicha; la fresca, sin ella', async () => {
    await elFestivoAterriza(UN_DOMINGO);

    // Servida hace ocho horas, y se pregunta ahora.
    const haceOchoHoras = UN_DOMINGO.getTime() - 8 * 3_600_000;
    servirOperativa(operativa, haceOchoHoras);
    assert.equal(edadDeLaOperativa(UN_DOMINGO.getTime()), 8 * 3_600_000);
    assert.ok(8 * 3_600_000 > EDAD_FRESCA_MS, 'ocho horas tienen que pasar de viejas');

    const vieja = await calcularTrayectoVivo(
      motor,
      leerPeticion(EL_CASO),
      LA_CALLE_MUDA,
      UN_DOMINGO,
    );
    assert.deepEqual(
      delHueco(vieja).map((a) => a.texto),
      ['Los desvíos de hoy se leyeron hace 8 h.'],
      'la edad, dicha en la unidad que se lee de un vistazo',
    );
    // ⭐ Y SE SIGUE SIRVIENDO: la capa vieja manda, no se cae al oficial.
    assert.ok(vieja.tramos.length > 0, 'el viaje sale');

    // Recién servida: ni una palabra.
    servirOperativa(operativa, UN_DOMINGO.getTime());
    const fresca = await calcularTrayectoVivo(
      motor,
      leerPeticion(EL_CASO),
      LA_CALLE_MUDA,
      UN_DOMINGO,
    );
    assert.deepEqual(delHueco(fresca), [], 'una capa fresca no se anuncia');

    // Y el umbral es el ritmo del refresco con un pase de margen, no un número suelto.
    assert.equal(EDAD_FRESCA_MS, RITMO_DEL_REFRESCO_MS * 2);
  });

  /**
   * ⭐ JUEZ 3 — EL AVISO SE VA SOLO. La secuencia entera del arranque.
   *
   * Es lo que separa un aviso honrado de un cartel pegado: si no desapareciera
   * al aterrizar la capa, en dos días nadie lo leería.
   */
  test('⭐ 3 · la secuencia del arranque: se avisa, y al aterrizar las capas deja de avisarse', async () => {
    const pedir = () => calcularTrayectoVivo(motor, leerPeticion(EL_CASO), LA_CALLE_MUDA, UN_DOMINGO);

    // t = 0 · el motor contesta y no sabe nada de la calle.
    assert.equal(edadDeLaOperativa(UN_DOMINGO.getTime()), null);
    assert.equal(elFestivoHaAterrizado(), false);
    assert.equal(delHueco(await pedir()).length, 2, 'al arrancar se declaran las dos capas');

    // t = 40 s aprox. · aterriza la de desvíos. Queda la del festivo.
    servirOperativa(operativa, UN_DOMINGO.getTime());
    const aMedias = delHueco(await pedir());
    assert.equal(aMedias.length, 1, 'con una capa dentro queda un aviso');
    assert.ok(aMedias[0]!.texto.includes('líneas cuyo horario'), 'y es el del festivo');

    // t = 60 s aprox. · aterriza la del festivo. Silencio, y ahora sí es honrado.
    await elFestivoAterriza(UN_DOMINGO);
    assert.deepEqual(delHueco(await pedir()), [], 'con las dos dentro, ni un aviso');
  });

  /**
   * ⭐ JUEZ 4 — LA MURALLA NO SE ENTERA DE NADA.
   *
   * Los ocho modos siguen dando su sello al byte. Y no es casualidad: **el bus
   * de producción va SIEMPRE por `calcularTrayectoVivo`** —lo decide
   * `servidor.ts` con `leida?.modo === 'bus'`— y la muralla va por la puerta
   * síncrona, que es la de las jueces del peatón y de la rueda. El aviso del
   * hueco vive solo en la puerta que sirve buses de verdad.
   *
   * ⚠️ **La asimetría es deliberada y se compra aquí**: si algún día la puerta
   *    síncrona empezara a servir bus de cara al público, esta juez seguiría en
   *    verde y el silencio volvería por ahí. Queda dicho.
   */
  test('⭐ 4 · la puerta síncrona no lleva el aviso, y por eso la muralla no se mueve', () => {
    // Capas frías, que es como corre la muralla.
    assert.equal(edadDeLaOperativa(UN_DOMINGO.getTime()), null);
    assert.equal(elFestivoHaAterrizado(), false);

    const porLaSincrona = calcularTrayecto(
      motor,
      leerPeticion(EL_CASO),
      null,
      UN_DOMINGO,
      null,
      null,
    );
    assert.deepEqual(
      delHueco(porLaSincrona),
      [],
      'la puerta síncrona no declara el hueco: no sirve buses de cara al público',
    );
  });
});
