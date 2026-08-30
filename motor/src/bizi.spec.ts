/**
 * ⭐ LAS JUECES DEL MODO BiZi (30/08, punto 9, casilla 6).
 *
 * Un viaje en BiZi son **tres tramos**: andar hasta una estación que tenga
 * bicis, pedalear hasta otra que tenga anclajes libres, y andar el resto.
 *
 * [DOC OpenTripPlanner, modo de alquiler] *«anda al punto, pedalea al punto de
 * devolución, anda el resto»*, con las estaciones **filtradas por
 * disponibilidad en el momento de planificar**. [DOC GBFS] el feed
 * `station_status` es dinámico: `num_bikes_available`, `num_docks_available` y
 * `last_reported` **por estación**.
 *
 * ── Cómo se prueba algo que cambia cada minuto ──────────────────────────────
 *
 * **Con una disponibilidad de mentira.** `calcularTrayecto` recibe el dato vivo
 * en vez de pedirlo, así que estas jueces le pasan el suyo: una estación a cero
 * bicis, otra a cero anclajes, o el silencio entero. Depender de cuántas bicis
 * haya hoy en la Calle Delicias sería una prueba que falla los martes.
 *
 * La única que sí toca la red es la del recuento de consultas, y esa sustituye
 * `fetch` por uno de mentira que cuenta — no llega a salir del proceso.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRedDeLaRueda, type RedDeLaRueda } from './red-rueda.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { entornoDe } from './gacetero.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarAparcabicis } from './aparcabicis.ts';
import {
  cargarBiZi,
  disponibilidadDeBiZi,
  type BiZiEnMemoria,
  type Disponibilidad,
  type EstadoDeEstacion,
} from './bizi.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import type { Paso, Trayecto } from '@desplazame/tipos';

let motor: Motor;
let bizi: BiZiEnMemoria;
let portales: PortalesEnMemoria;
let peaton: RedEnMemoria;
let rueda: RedDeLaRueda;

/**
 * ⭐ EL PAR JUEZ: `CALLE DELICIAS 101 Acc → CALLE CONDES DE ARAGÓN 36`.
 *
 * Es el par de la juez 6 de `rueda.spec.ts` —el de las velocidades—, elegido
 * porque ya está estudiado: se sabe que bici y BiZi lo recorren por el mismo
 * camino y que mide 1.870 m pedaleando de portal a portal.
 */
const A = 'Portales.122563';
const B = 'Portales.124841';

/** Un par de punta a punta del término: 50 minutos de pedaleo. */
const LEJOS_A = 'Portales.100109';
const LEJOS_B = 'Portales.115483';

function extremo(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo)!;
  assert.ok(p, `no existe el portal ${codigo}`);
  return { via: p.via, portal: p.codigo };
}

/**
 * ⭐ UNA DISPONIBILIDAD DE MENTIRA: todas las estaciones con bicis y anclajes,
 * salvo las que se digan.
 *
 * La hora se fija a una concreta —12:48 del 30/08— para que el texto del hito
 * se pueda comparar letra a letra. Con `new Date()` la prueba fallaría al
 * minuto siguiente de escribirla.
 */
const CUANDO = new Date(2026, 7, 30, 12, 48, 0);

function vivoDeMentira(cambios: Readonly<Record<number, Partial<EstadoDeEstacion>>> = {}): Disponibilidad {
  const porNumero = new Map<number, EstadoDeEstacion>();
  for (const e of bizi.estaciones) {
    porNumero.set(e.numero, {
      bicis: 5,
      anclajesLibres: 8,
      enServicio: true,
      cuando: CUANDO,
      ...(cambios[e.numero] ?? {}),
    });
  }
  return { porNumero, total: porNumero.size, enMantenimiento: 0, enMs: 1 };
}

function viaje(a: string, b: string, vivo: Disponibilidad | null): Trayecto {
  return calcularTrayecto(motor, { origen: extremo(a), destino: extremo(b), modo: 'bizi' }, vivo);
}

const cogeDe = (t: Trayecto): Paso | undefined => t.pasos.find((p) => p.giro === 'coge');
const dejaDe = (t: Trayecto): Paso | undefined => t.pasos.find((p) => p.giro === 'aparca');

/** El número de la estación que un hito nombra, buscado en el inventario. */
function estacionDe(paso: Paso): number {
  const nombre = paso.partes.find((p) => p.papel === 'via')?.texto ?? '';
  const e = bizi.estaciones.find((x) => x.nombre === nombre);
  assert.ok(e, `el hito nombra una estación que no está en el inventario: «${nombre}»`);
  return e.numero;
}

describe('⭐ EL MODO BiZi (30/08)', () => {
  before(() => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    bizi = cargarBiZi(entornoDe(portales));
    motor = {
      red: peaton,
      rejilla: cargarRejilla(peaton),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(peaton),
      redRueda: rueda,
      rejillaRueda: cargarRejilla(rueda),
      cuadernoRueda: cuadernoPara(rueda),
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi,
    };
  });

  /**
   * ⭐ JUEZ 4 — EL CASO DEL OJO EN BiZi: tres tramos, dos hitos, y las cifras.
   *
   * Con la disponibilidad de mentira —5 bicis y 8 anclajes en todas, a las
   * 12:48— los dos hitos tienen que salir **con el texto entero**: el nombre de
   * la estación, el número vivo y **la hora del dato de ESA estación**.
   *
   * Y las velocidades por tramo: lo que se anda va a 5,0 km/h y lo que se
   * pedalea a 20. Se comprueba **sin leerlo de la respuesta** —el contrato no
   * publica los tramos—: se suman los metros de los pasos de cada tramo y se
   * mira que la duración total no pueda salir de una sola velocidad.
   */
  test('⭐ 4 · el caso del ojo en BiZi: tres tramos y los dos hitos completos', () => {
    const t = viaje(A, B, vivoDeMentira());
    assert.deepEqual(t.avisos, [], 'con dato vivo no hay nada que avisar');

    const coge = cogeDe(t);
    const deja = dejaDe(t);
    assert.ok(coge, 'tiene que haber un hito de coger la bici');
    assert.ok(deja, 'y otro de dejarla');

    assert.equal(coge.texto, 'Coge una bici en la estación Villahermosa: F. y López — 5 bicis disponibles a las 12:48');
    assert.equal(deja.texto, 'Deja la bici en la estación Hispanidad: Condes Aragón — 8 anclajes libres a las 12:48');
    assert.equal(coge.metros, 0, 'un hito no abre tramo');
    assert.equal(deja.metros, 0);

    // ── Los TRES tramos, en su orden ────────────────────────────────────────
    const kCoge = t.pasos.indexOf(coge);
    const kDeja = t.pasos.indexOf(deja);
    assert.ok(kCoge > 0, 'antes de coger la bici hay que andar hasta la estación');
    assert.ok(kDeja > kCoge + 1, 'entre los dos hitos tiene que haber pedaleo');
    assert.ok(kDeja < t.pasos.length - 1, 'y después, el paseo hasta el portal');
    assert.equal(t.pasos[0]!.giro, 'salida');
    assert.match(t.pasos[kCoge + 1]!.texto, /^Pedalea hacia el /);
    assert.match(t.pasos[kDeja + 1]!.texto, /^Sigue a pie hacia el /);
    assert.equal(t.pasos[t.pasos.length - 1]!.giro, 'llegada');
    // Una sola llegada: los tramos de en medio no dicen «has llegado».
    assert.equal(t.pasos.filter((p) => p.giro === 'llegada').length, 1);

    // ── Las velocidades por tramo ───────────────────────────────────────────
    const suma = (desde: number, hasta: number): number =>
      t.pasos.slice(desde, hasta).reduce((s, p) => s + p.metros, 0);
    const andado = suma(0, kCoge) + suma(kDeja + 1, t.pasos.length);
    const pedaleado = suma(kCoge + 1, kDeja + 1);
    assert.ok(andado > 0 && pedaleado > 0, 'los tres tramos tienen que medir algo');
    // Si todo fuera a 5 el viaje duraría mucho más; si todo fuera a 20, mucho
    // menos. Los segundos de verdad tienen que caer estrictamente entre medias.
    const todoA5 = (andado + pedaleado) / (5000 / 3600);
    const todoA20 = (andado + pedaleado) / (20000 / 3600);
    assert.ok(
      t.segundos < todoA5 && t.segundos > todoA20,
      `${t.segundos} s no está entre ${todoA20.toFixed(0)} (todo a 20) y ${todoA5.toFixed(0)} (todo a 5)`,
    );

    assert.equal(t.metros, 2382, 'los metros del caso, medidos el 30/08');
    assert.equal(t.segundos, 589);
  });

  /**
   * ⭐ JUEZ 5 — LA ESTACIÓN VACÍA Y LA LLENA SE SALTAN.
   *
   * [DOC OTP] filtra las estaciones **por disponibilidad**, excluyendo las
   * llenas y las vacías. Aquí se comprueba mutando la respuesta viva: a la
   * estación que salía elegida se le ponen 0 bicis (o 0 anclajes) y la ruta
   * tiene que **cambiar de estación**, no fallar y no cogerla igual.
   *
   * Se hacen las dos mitades porque son dos filtros distintos y en dos
   * extremos distintos: al coger se piden bicis, al dejar se piden anclajes. Un
   * arreglo que solo mirara uno pasaría media juez.
   */
  test('⭐ 5 · una estación sin bicis (o sin anclajes) no se elige', () => {
    const normal = viaje(A, B, vivoDeMentira());
    const salidaNormal = estacionDe(cogeDe(normal)!);
    const llegadaNormal = estacionDe(dejaDe(normal)!);

    // Sin bicis en la de origen: se coge en otra.
    const sinBicis = viaje(A, B, vivoDeMentira({ [salidaNormal]: { bicis: 0 } }));
    assert.ok(cogeDe(sinBicis), 'tiene que seguir habiendo ruta: hay más estaciones');
    assert.notEqual(
      estacionDe(cogeDe(sinBicis)!),
      salidaNormal,
      'ha vuelto a mandar a la estación que está vacía',
    );

    // Sin anclajes en la de destino: se deja en otra.
    const sinAnclajes = viaje(A, B, vivoDeMentira({ [llegadaNormal]: { anclajesLibres: 0 } }));
    assert.ok(dejaDe(sinAnclajes), 'tiene que seguir habiendo ruta');
    assert.notEqual(
      estacionDe(dejaDe(sinAnclajes)!),
      llegadaNormal,
      'ha vuelto a mandar a la estación que está llena',
    );

    // Y una en MANTENIMIENTO tampoco vale, aunque diga que tiene bicis: es el
    // campo `estado`, el único de los tres que discrimina.
    const enObras = viaje(A, B, vivoDeMentira({ [salidaNormal]: { enServicio: false } }));
    assert.notEqual(estacionDe(cogeDe(enObras)!), salidaNormal);
  });

  /**
   * ⭐ JUEZ 6 — LA CONSULTA ES POR RUTA PEDIDA, y se cuenta.
   *
   * [DOC GBFS] `station_status` es el feed **dinámico**: se consume en vivo. Si
   * la respuesta se guardara entre rutas, la segunda contestaría con un número
   * que ya no es cierto — y el número es justo lo que el hito enseña.
   *
   * Se cuenta sustituyendo `fetch` por uno de mentira. **Dos llamadas seguidas
   * a `disponibilidadDeBiZi` tienen que salir a la red las dos veces.**
   */
  test('⭐ 6 · dos consultas seguidas son dos peticiones, no una guardada', async () => {
    const original = globalThis.fetch;
    let veces = 0;
    globalThis.fetch = (async () => {
      veces++;
      return new Response(
        JSON.stringify({
          totalCount: 1,
          result: [
            {
              title: '35- Comuneros',
              estado: 'IN_SERVICE',
              bicisDisponibles: 3,
              anclajesDisponibles: 16,
              lastUpdated: '2026-08-30T12:48:00',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as typeof fetch;
    try {
      const uno = await disponibilidadDeBiZi();
      const dos = await disponibilidadDeBiZi();
      assert.equal(veces, 2, 'la segunda consulta no ha salido: alguien la ha cacheado');
      assert.ok(uno && dos);
      assert.equal(uno.porNumero.get(35)?.bicis, 3, 'y el número de estación sale del title');
    } finally {
      globalThis.fetch = original;
    }
  });

  /**
   * ⭐ JUEZ 6 bis — SE LEE `estado`, NUNCA `estadoEstacion`.
   *
   * ⚠️ **Esta juez existe porque la contraprueba encontró un hueco.** Mutar el
   * lector para que hiciera caso a `estadoEstacion` dejaba las seis jueces en
   * verde —usan una disponibilidad de mentira que no pasa por el lector— y sin
   * embargo **rompía el modo entero**: sondeado contra la API de verdad el
   * 30/08, con ese campo salen **276 de 276 «no operativa»**, así que ninguna
   * estación pasaría el filtro y no habría ni una ruta de BiZi.
   *
   * El rasgo de aquí es real, copiado de la respuesta del 30/08: la misma
   * estación afirma a la vez `estado: IN_SERVICE` y un `estadoEstacion` que
   * apunta a `…/no-operativa`. Al menos una de las dos es falsa, y la que se
   * cree es `estado`, que es la única que discrimina.
   */
  test('⭐ 6 bis · el campo roto no manda: se lee «estado»', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          totalCount: 2,
          result: [
            {
              // La contradicción, tal y como la sirve la sede.
              title: '193- Pza. La Ermita',
              estado: 'IN_SERVICE',
              estadoEstacion:
                'http://vocab.linkeddata.es/datosabiertos/kos/transporte/bicicleta-publica/tipo-estado-estacion/no-operativa',
              bicisDisponibles: 0,
              anclajesDisponibles: 19,
              lastUpdated: '2026-08-30T11:56:08',
            },
            {
              // ⚠️ Y la de MANTENIMIENTO, que el 30/08 venía **sin los campos
              // de disponibilidad y sin descripción**. Leerlos con `?? 0`
              // diría «no quedan bicis»; lo que pasa es que no se sabe.
              title: '276-Acuario Zaragoza',
              estado: 'MAINTENANCE',
              estadoEstacion:
                'http://vocab.linkeddata.es/datosabiertos/kos/transporte/bicicleta-publica/tipo-estado-estacion/no-operativa',
              lastUpdated: '2026-08-30T11:56:05',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )) as typeof fetch;
    try {
      const vivo = await disponibilidadDeBiZi();
      assert.ok(vivo, 'la respuesta es buena: tiene que leerse');
      const ermita = vivo.porNumero.get(193);
      assert.ok(ermita, 'la estación 193 tiene cifras y tiene que estar');
      assert.equal(
        ermita.enServicio,
        true,
        'se ha creído a `estadoEstacion`, que dice «no operativa» en las 276',
      );
      assert.equal(ermita.bicis, 0);
      assert.equal(ermita.anclajesLibres, 19);
      // La de mantenimiento no trae cifras: no se inventa un cero para ella.
      assert.equal(vivo.porNumero.has(276), false);
      assert.equal(vivo.enMantenimiento, 1);
      assert.equal(vivo.total, 2);
    } finally {
      globalThis.fetch = original;
    }
  });

  /**
   * ⭐ JUEZ 7 — CON LA API CAÍDA, LA RUTA SALE, Y **SIN INVENTAR NADA**.
   *
   * Es el plan D-G firmado el 28/08: *componer sin prometer*. Se rutea con el
   * inventario —§ 1.8 dice dónde están las 276 estaciones y eso no caduca—, se
   * avisa de que la disponibilidad **no está verificada**, y los dos hitos
   * salen **sin número y sin hora**.
   *
   * Lo que la juez prohíbe expresamente es lo tentador: poner un cero, poner la
   * capacidad del inventario como si fuera disponibilidad, o poner la hora del
   * reloj como si fuera la del dato.
   */
  test('⭐ 7 · API caída: ruta con aviso, hitos sin número y sin hora', () => {
    const t = viaje(A, B, null);
    assert.ok(t.pasos.length > 0 && t.metros > 0, 'la ruta tiene que salir igual');
    assert.equal(t.avisos.length, 1);
    assert.match(t.avisos[0]!.texto, /disponibilidad no verificada/);

    const coge = cogeDe(t);
    const deja = dejaDe(t);
    assert.ok(coge && deja, 'los dos hitos siguen estando: la estación existe aunque calle la API');
    assert.equal(coge.texto, 'Coge una bici en la estación Villahermosa: F. y López');
    assert.equal(deja.texto, 'Deja la bici en la estación Hispanidad: Condes Aragón');
    for (const hito of [coge, deja]) {
      assert.doesNotMatch(hito.texto, /\d/, `«${hito.texto}» trae una cifra que nadie ha medido`);
      assert.doesNotMatch(hito.texto, /a las/, `«${hito.texto}» trae una hora inventada`);
    }
  });

  /**
   * ⭐ JUEZ 8 — EL AVISO DE LOS 30 MINUTOS.
   *
   * [FIRMADO por Antonio el 28/08, plan D-G] Si el pedaleo estimado supera el
   * tramo incluido del abono, se dice — y **sin inventar precios**: lo que
   * cueste el exceso está en las tarifas oficiales y no en este repositorio.
   *
   * El par son las dos estaciones más lejanas del término (`Avda. Real
   * Zaragoza` ↔ `Heroínas Sitios: Gómara`, 12,4 km en línea recta): **50
   * minutos de pedaleo**.
   *
   * Y la otra mitad, que es la que impide que el aviso salga siempre: el par
   * corto **no** lo lleva.
   */
  test('⭐ 8 · más de 30 minutos pedaleando lleva el aviso del abono', () => {
    const largo = viaje(LEJOS_A, LEJOS_B, vivoDeMentira());
    const abono = largo.avisos.find((a) => a.texto.includes('abono'));
    assert.ok(abono, 'un pedaleo de 50 minutos tiene que avisar:\n' + JSON.stringify(largo.avisos));
    assert.match(abono.texto, /supera el tramo incluido del abono/);
    assert.match(abono.texto, /pasa de 30 minutos/);
    // Sin precios: no hay ninguno en este repositorio que se pueda decir.
    assert.doesNotMatch(abono.texto, /€|euro|céntimo/i);

    const corto = viaje(A, B, vivoDeMentira());
    assert.equal(
      corto.avisos.find((a) => a.texto.includes('abono')),
      undefined,
      'un pedaleo de 6 minutos no puede avisar de nada',
    );
  });

  /**
   * ⭐ JUEZ 8 bis — LA MISMA ESTACIÓN PARA LOS DOS EXTREMOS NO ES UN VIAJE.
   *
   * Si la estación más cercana al origen y la más cercana al destino son la
   * misma, coger una bici para devolverla donde se cogió es un rodeo con
   * trámite. Se dice, y lo que se da es la ruta a pie — que es la verdad de ese
   * caso—, no una ruta absurda con dos hitos.
   */
  test('⭐ 8 bis · si la estación es la misma, se dice que andando se llega', () => {
    // Dos portales de vías DISTINTAS a 169 m, que comparten la estación 158
    // (`Alierta: Dos de Enero`). Se eligen distintos a propósito: con el mismo
    // portal dos veces la juez pasaría por ser un viaje de cero metros, y no
    // habría probado el caso que dice probar.
    const t = viaje('Portales.96724', 'Portales.109533', vivoDeMentira());
    const mismo = t.avisos.find((a) => a.texto.includes('se llega andando'));
    assert.ok(mismo, 'tiene que decirlo:\n' + JSON.stringify(t.avisos));
    assert.equal(cogeDe(t), undefined, 'y no puede haber hito de coger bici');
    assert.equal(dejaDe(t), undefined);
  });
});
