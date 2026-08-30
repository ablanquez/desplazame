/**
 * ⭐ LAS JUECES DEL SELECTOR DE RUTA (30/08, punto 9).
 *
 * Tres maneras de llegar al mismo sitio, y el trío no es nuestro:
 * [DOC CycleStreets, API oficial] ofrece exactamente estos tres tipos —
 * *«minimizar tiempo · evitar tráfico · el compromiso entre ambos»*— y
 * **recomienda `balanced` como defecto de la interfaz**: *«práctica, equilibra
 * velocidad y agrado»*. `fastest` es *«vías con más tráfico, ciclista
 * confiado»* y `quietest` *«más agradable, a menudo menos directa»*.
 *
 * ⭐ Y hay un cuarto que **existe y desaconsejan**: `shortest`. Que lo
 * desaconsejen avala lo que este motor ya hacía desde la casilla 3 — el coste
 * es TIEMPO, no distancia.
 *
 * ── La mecánica del tranquila ───────────────────────────────────────────────
 *
 * [DOC CycleStreets] su puntuación es **inversa a la clasificación viaria**:
 * `trunk` y `primary` son *«muy hostiles»*, las menores y los carriles bici
 * tranquilos. Nuestra tabla de factores **ya es esa escala** —sale de la
 * `unsafe_highway_list` de OSRM—, así que tranquila no estrena escala: aplica
 * la misma **dos veces**.
 *
 * [DOC Valhalla] tiene el dial: `use_roads` de 0 a 1 con **defecto 0,5**. La
 * preferencia de la casilla 3 es ese defecto documentado, y ahora tiene sus
 * dos extremos.
 *
 * ── Lo que estas jueces NO cubren ───────────────────────────────────────────
 *
 * **La muralla del peatón** —el sha256 de sus 391 rutas— es la juez 11 de
 * `rueda.spec.ts`, y corre en la misma suite. Aquí no se copia.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRedDeLaRueda, type RedDeLaRueda } from './red-rueda.ts';
import { cargarRejilla, enganchar, type Rejilla } from './proyeccion.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { entornoDe } from './gacetero.ts';
import { cuadernoPara, type Ruta } from './ruta.ts';
import { admiteComoPuerta, calcularRutaRodando, segundosRodando } from './rodando.ts';
import { FACTOR_DE_TRAFICO, calibradoDe, type ModoDeRueda } from './rueda.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import type { TipoDeRuta, Trayecto } from '@desplazame/tipos';

let motor: Motor;
let rueda: RedDeLaRueda;
let peaton: RedEnMemoria;
let portales: PortalesEnMemoria;
let rejillaRueda: Rejilla;

type Punto = [number, number];

/**
 * El par juez: `Portales.120344 → Portales.110047`, el de la **Avenida de
 * Madrid** de la juez 4 de `rueda.spec.ts`. Se elige ese y no otro porque ya
 * está estudiado: se sabe qué avenida cruza y cuánto mide.
 */
const A = 'Portales.120344';
const B = 'Portales.110047';

function donde(codigo: string): Punto {
  const p = portales.donde.get(codigo)!;
  assert.ok(p, `no existe el portal ${codigo}`);
  return [p.lon, p.lat];
}

function extremo(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo)!;
  return { via: p.via, portal: p.codigo };
}

/** Una ruta rodando, con el tipo pedido. */
function rodar(modo: ModoDeRueda, a: Punto, b: Punto, ruta?: TipoDeRuta): Ruta | null {
  const eo = enganchar(rueda, rejillaRueda, a[0], a[1], (x) => admiteComoPuerta(rueda, x, modo));
  const ed = enganchar(rueda, rejillaRueda, b[0], b[1], (x) => admiteComoPuerta(rueda, x, modo));
  if (!eo || !ed) {
    return null;
  }
  return calcularRutaRodando(rueda, cuadernoPara(rueda), modo, eo, a, ed, b, ruta);
}

/**
 * ⭐ LA HOSTILIDAD de una ruta: sus metros de tráfico **pesados por clase**.
 *
 * ⚠️ **La primera versión de esta juez contaba metros de tráfico a secas, y
 * daba un rojo que no era del código.** En el par de la Avenida de Madrid la
 * tranquila sale con **193 m de tráfico y la rápida con 153**, y parecía que la
 * tranquila era peor. Mirando qué vías eran, la respuesta era la contraria: la
 * rápida mete **153 m de `primary`** y la tranquila los cambia por **193 de
 * `tertiary`**, que es lo que se le está pidiendo.
 *
 * Contar metros trata igual una avenida que una calle de tercer orden, y [DOC
 * CycleStreets] dice justo lo contrario: su puntuación es *inversa a la
 * clasificación viaria*, con `trunk` y `primary` *«muy hostiles»*. Así que lo
 * que se mide es metro × factor, que es esa escala.
 */
function hostilidad(r: Ruta): number {
  return r.trozos.reduce((s, t) => {
    const via = rueda.tipoDeWay.get(rueda.aristas[t.arista]!.way) ?? '';
    return s + t.metros * (FACTOR_DE_TRAFICO[via] ?? 0);
  }, 0);
}

/** Los metros de una ruta por una clase de vía concreta. */
function metrosDe(r: Ruta, clase: string): number {
  return r.trozos
    .filter((t) => rueda.tipoDeWay.get(rueda.aristas[t.arista]!.way) === clase)
    .reduce((s, t) => s + t.metros, 0);
}

/** Los metros que van por carril bici de verdad. */
function metrosDeCarril(r: Ruta): number {
  return r.trozos
    .filter((t) => rueda.tipoDeWay.get(rueda.aristas[t.arista]!.way) === 'cycleway')
    .reduce((s, t) => s + t.metros, 0);
}

/** La huella de una ruta: si dos rutas la comparten, son la misma al byte. */
function huella(r: Ruta): string {
  return r.metros.toFixed(6) + '|' + r.trozos.map((t) => t.arista + ':' + t.metros.toFixed(6)).join(',');
}

/** Un trayecto de punta a punta, como lo pide la pantalla. */
function trayecto(modo: ModoDeRueda, ruta?: TipoDeRuta): Trayecto {
  return calcularTrayecto(motor, { origen: extremo(A), destino: extremo(B), modo, ruta });
}

describe('⭐ EL SELECTOR DE RUTA (30/08)', () => {
  before(() => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    rejillaRueda = cargarRejilla(rueda);
    motor = {
      red: peaton,
      rejilla: cargarRejilla(peaton),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(peaton),
      redRueda: rueda,
      rejillaRueda,
      cuadernoRueda: cuadernoPara(rueda),
    };
  });

  /**
   * ⭐ JUEZ 1 — LAS TRES RUTAS DEL MISMO PAR SE ORDENAN COMO LA DOCTRINA.
   *
   * El par es el de la **Avenida de Madrid**, el de la juez 4 de
   * `rueda.spec.ts`: se elige ese porque ya está estudiado y se sabe qué
   * avenida cruza. Medido el 30/08:
   *
   * | | metros | min | carril | tráfico | hostilidad |
   * |---|---|---|---|---|---|
   * | **rápida** | 1.554 | 5,7 | 381 | `primary` 153 | 306 |
   * | **equilibrada** | 1.565 | 5,7 | 381 | `primary` 113 + `tertiary` 86 | 332 |
   * | **tranquila** | 1.710 | 6,2 | 260 | `tertiary` 193 | **241** |
   *
   * Lo que se exige no es que las tres sean distintas —eso podría salir por
   * casualidad— sino que se ordenen:
   *
   * - **rápida** es la más rápida del reloj. Es su definición literal;
   * - **tranquila** paga tiempo y **se quita la `primary` entera**: cambia sus
   *   153 m de avenida por 193 de calle de tercer orden;
   * - **equilibrada** es **la de hoy AL BYTE** — la no-regresión de la casilla
   *   3, y lo que hace que este encargo añada opciones sin mover a nadie.
   *
   * ⚠️ **Y una cosa que sorprende y no es un fallo**: la hostilidad de la
   * equilibrada (332) sale **por encima de la de la rápida** (306). No es que
   * el compromiso sea peor que el extremo: es que ninguna de las tres minimiza
   * la hostilidad — minimizan **tiempo por factor**, y la equilibrada compra
   * quitarse 40 m de `primary` a cambio de 86 de `tertiary`, que en tiempo
   * pesado le sale a cuenta y en esta suma no. Se dice aquí para que nadie lo
   * descubra dentro de un mes y lo tome por un error.
   */
  test('⭐ 1 · las tres rutas del mismo par se ordenan como la doctrina', () => {
    const a = donde(A);
    const b = donde(B);
    const rapida = rodar('bici', a, b, 'rapida')!;
    const equilibrada = rodar('bici', a, b, 'equilibrada')!;
    const tranquila = rodar('bici', a, b, 'tranquila')!;
    assert.ok(rapida && equilibrada && tranquila, 'las tres tienen que existir');

    // ⭐ LA NO-REGRESIÓN: equilibrada es la ruta de la casilla 3, sin tocar.
    assert.equal(Math.round(equilibrada.metros), 1565, 'la de hoy no se mueve');
    assert.equal(Math.round(rapida.metros), 1554);
    assert.equal(Math.round(tranquila.metros), 1710);

    // El tiempo real: la rápida es la más rápida. Es su definición.
    const t = (r: Ruta, tipo: TipoDeRuta): number => segundosRodando(rueda, r, 'bici', tipo);
    assert.ok(
      t(rapida, 'rapida') <= t(equilibrada, 'equilibrada'),
      `la rápida (${t(rapida, 'rapida').toFixed(0)} s) no puede tardar más que la de hoy`,
    );
    assert.ok(
      t(rapida, 'rapida') < t(tranquila, 'tranquila'),
      'la rápida tiene que ser más rápida que la tranquila',
    );

    // ⭐ Y lo que la tranquila COMPRA: se quita la `primary` entera y baja la
    // hostilidad. Las dos mitades juntas — una ruta más larga podría serlo por
    // casualidad; cero metros de avenida no es casualidad.
    assert.equal(Math.round(metrosDe(rapida, 'primary')), 153);
    assert.equal(Math.round(metrosDe(tranquila, 'primary')), 0, 'la tranquila no pisa avenida');
    assert.ok(
      hostilidad(tranquila) < hostilidad(rapida),
      `la tranquila (${hostilidad(tranquila).toFixed(0)}) tiene que ser menos hostil ` +
        `que la rápida (${hostilidad(rapida).toFixed(0)})`,
    );

    // Las tres no pueden ser la misma ruta, o el selector no selecciona nada.
    assert.notEqual(huella(rapida), huella(tranquila), 'rápida y tranquila son la misma ruta');
    assert.notEqual(huella(rapida), huella(equilibrada));
  });

  /**
   * ⭐ JUEZ 1 bis — EL CASO QUE MÁS SE VE: el carril bici de 0 a 1.339 m.
   *
   * `Portales.99126 → Portales.126086`, el par de la juez 1 de `rueda.spec.ts`.
   * Aquí el trío se lee de un vistazo, y enseña qué es cada extremo:
   *
   * | | metros | min | carril | tráfico | hostilidad |
   * |---|---|---|---|---|---|
   * | **rápida** | 2.986 | 10,0 | **0** | `secondary` 1.723 + `tertiary` 257 | 2.972 |
   * | **equilibrada** | 3.049 | 10,2 | 1.304 | `secondary` 382 + `tertiary` 284 | 943 |
   * | **tranquila** | 3.048 | 10,3 | **1.339** | `secondary` 364 + `tertiary` 257 | **881** |
   *
   * La rápida se va **por la avenida y no toca un metro de carril bici**: es
   * literalmente el «ciclista confiado» que describe CycleStreets. Por 62 m
   * más —un 2 %— la equilibrada compra 1.304 m de carril, y la tranquila
   * todavía 35 más por el mismo precio.
   */
  test('⭐ 1 bis · la rápida va por la avenida sin tocar carril; las otras dos lo compran', () => {
    const a = donde('Portales.99126');
    const b = donde('Portales.126086');
    const rapida = rodar('bici', a, b, 'rapida')!;
    const equilibrada = rodar('bici', a, b, 'equilibrada')!;
    const tranquila = rodar('bici', a, b, 'tranquila')!;

    assert.equal(Math.round(metrosDeCarril(rapida)), 0, 'la rápida no busca el carril');
    assert.ok(metrosDeCarril(equilibrada) > 1300);
    assert.ok(
      metrosDeCarril(tranquila) > metrosDeCarril(equilibrada),
      'la tranquila tiene que comprar más carril que la de en medio',
    );
    // Y la no-regresión: la equilibrada es la ruta de la juez 1 de la casilla 3.
    assert.equal(Math.round(equilibrada.metros), 3049);
    assert.ok(hostilidad(tranquila) < hostilidad(equilibrada));
    assert.ok(hostilidad(equilibrada) < hostilidad(rapida));
  });

  /**
   * ⭐ JUEZ 2 — EL PATÍN IGNORA EL PARÁMETRO, y no es un capricho.
   *
   * [ORD art. 56.2.c, literal] *«Los VMP circularán **obligatoriamente** por
   * carriles bici o vías ciclistas o lugares específicos destinados a la
   * circulación de bicicletas»*, y la calzada es subsidiaria [56.3: *«cuando no
   * exista vía ciclista»*]. Eso **no es un gusto que el usuario pueda elegir**:
   * es la ley, y por eso el patín lleva siempre la preferencia fuerte y el
   * campo ni siquiera se le enseña.
   *
   * La juez pide lo más fuerte que se puede pedir: pedirle `rapida` y pedirle
   * `tranquila` devuelve **la misma ruta al byte**.
   */
  test('⭐ 2 · el patín ignora `ruta`: la ley no es una preferencia', () => {
    const a = donde(A);
    const b = donde(B);
    const rapida = rodar('patin', a, b, 'rapida')!;
    const tranquila = rodar('patin', a, b, 'tranquila')!;
    const sinNada = rodar('patin', a, b)!;
    assert.ok(rapida && tranquila && sinNada);

    assert.equal(huella(rapida), huella(tranquila), 'al patín no le cambia lo que le pidan');
    assert.equal(huella(rapida), huella(sinNada));

    // Y es la FUERTE, no la de hoy: se comprueba contra la bici tranquila,
    // que es el mismo calibrado, y contra la bici equilibrada, que no lo es.
    assert.equal(
      calibradoDe('patin', 'rapida'),
      'tranquila',
      'el calibrado del patín es el fuerte, pida lo que pida',
    );
  });

  /**
   * ⭐ JUEZ 3 — SIN PARÁMETRO ES EQUILIBRADA, AL BYTE.
   *
   * Es la compatibilidad hacia atrás escrita como prueba: quien pedía rutas
   * antes de que existiera el selector las sigue pidiendo igual y recibe **lo
   * mismo que recibía**. La misma ley que se le aplicó a `modo` el 29/08.
   */
  test('⭐ 3 · sin `ruta` es equilibrada, al byte', () => {
    const a = donde(A);
    const b = donde(B);
    for (const modo of ['bici', 'bizi'] as const) {
      assert.equal(
        huella(rodar(modo, a, b)!),
        huella(rodar(modo, a, b, 'equilibrada')!),
        `sin parámetro, ${modo} tiene que dar la equilibrada`,
      );
      assert.equal(calibradoDe(modo, undefined), 'equilibrada');
    }

    // Y de punta a punta, por el mismo camino que la pantalla.
    const sinNada = trayecto('bici');
    const conEquilibrada = trayecto('bici', 'equilibrada');
    assert.equal(sinNada.metros, conEquilibrada.metros);
    assert.equal(sinNada.segundos, conEquilibrada.segundos);
    assert.deepEqual(
      sinNada.pasos.map((p) => p.texto),
      conEquilibrada.pasos.map((p) => p.texto),
    );
  });

  /**
   * ⭐ JUEZ 3 bis — LOS METROS Y LOS MINUTOS SIGUEN SIENDO LOS DE VERDAD.
   *
   * El tipo de ruta cambia **el peso, no el reloj**: las velocidades son las
   * mismas (18/20/18) y el tiempo que se contesta es el real de la ruta
   * elegida, no el ponderado. Un motor que prefiere puede dar un camino más
   * largo; lo que no puede es mentir sobre cuánto se tarda en recorrerlo.
   *
   * Se comprueba midiendo la tranquila con el reloj de la equilibrada: si el
   * factor se colara en la respuesta, los dos números no cuadrarían.
   */
  test('⭐ 3 bis · el tipo cambia el peso, no el reloj', () => {
    const a = donde(A);
    const b = donde(B);
    const tranquila = rodar('bici', a, b, 'tranquila')!;
    const t = calcularTrayecto(motor, {
      origen: extremo(A),
      destino: extremo(B),
      modo: 'bici',
      ruta: 'tranquila',
    });
    // Los metros de la respuesta son los metros de la ruta, sin ponderar.
    assert.equal(t.metros, Math.round(tranquila.metros));
    // Y los segundos, los del reloj de siempre.
    assert.equal(t.segundos, Math.round(segundosRodando(rueda, tranquila, 'bici', 'tranquila')));
  });
});
