/**
 * ⭐ LAS JUECES DEL RANGO DE VÉRTICES DE CADA PASO (21/09, casilla 5b).
 *
 * La casilla 5b llevaba parada desde el 14/09 con esta letra: *«Paso sin
 * coordenadas (solo hitos vía vértices; giros no — tocar motor = decisión
 * aparte)»*. La decisión llegó, y se resolvió **por doctrina, no por gusto**:
 * los dos motores de rutas canónicos publican esto de serie y con el mismo
 * formato.
 *
 * ── De dónde sale la forma ──────────────────────────────────────────────────
 *
 * [DOC Valhalla, referencia de su API] cada maniobra lleva `begin_shape_index`
 * y `end_shape_index`: índices a la **polyline única** del trayecto, no una
 * geometría propia por maniobra. [DOC OSRM] su `RouteStep` referencia su
 * rebanada de la geometría compartida igual, **y con el solape documentado**:
 * cada paso comparte su coordenada inicial con la final del anterior.
 *
 * Aquí eso no estrena nada: es **la misma ley que ya rige `TramoDelViaje`**
 * desde el 30/08 —«el vértice de la costura pertenece a los dos»—, y por eso
 * las dos parejas de índices se pueden leer con la misma cabeza.
 *
 * ── Los tres invariantes que se compran ─────────────────────────────────────
 *
 * 1. **CONTIGUOS**: el `hasta` de un paso es el `desde` del siguiente. Es el
 *    solape de OSRM, y sin él los trechos resaltados dejarían un hueco de un
 *    vértice entre paso y paso.
 * 2. **CUBREN**: el primero empieza en 0 —con el conector de la puerta dentro—
 *    y el último acaba en `geometria.length − 1`. La unión de los rangos es la
 *    geometría entera, sin huecos.
 * 3. **VAN LOS DOS O NINGUNO**, y dentro de los límites. Medio rango sería
 *    peor que ninguno: la pantalla no sabría qué resaltar.
 *
 * ⚠️ **Y el paso que CIERRA es degenerado a propósito**: `desde === hasta ===
 *    último vértice. No abre trecho —sus `metros` son 0— y darle uno le
 *    robaría su rebanada al paso anterior. Valhalla hace exactamente esto con
 *    su maniobra de destino, y la jueza D lo compra para que nadie lo
 *    «arregle» repartiendo la cola.
 *
 * ⚠️ **Se juzgan SEIS modos y no uno.** Andando trae una etapa; la bici y el
 *    patín, las del empuje; la BiZi, sus tres etapas cosidas por `juntar`; el
 *    coche, la suya con los cortes de la Zona de Bajas Emisiones; y el bus, un
 *    viaje con tramos montados, que es el único cuyos pasos NO los escribe
 *    `escribirPasos`. Un arreglo que solo cuadrara en uno pasaría media juez.
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
import { cargarBiZi, type BiZiEnMemoria, type Disponibilidad, type EstadoDeEstacion } from './bizi.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import { metrosEntre } from './cercano.ts';
import { andarConElPeaton, cocinar, type RedDeBus } from './red-bus.ts';
import { elFeedQueSeSirve } from './feed.ts';
import { viajeEnBus } from './viaje-bus.ts';
import type { Modo, Paso, Trayecto } from '@desplazame/tipos';

let motor: Motor;
let portales: PortalesEnMemoria;
let peaton: RedEnMemoria;
let rueda: RedDeLaRueda;
let bizi: BiZiEnMemoria;
let redBus: RedDeBus;

/** El caso del ojo de Antonio: COLOSO 2 → LEOPOLDO ROMEO 27. */
const COLOSO = 'Portales.93310';
const ROMEO = 'Portales.79358';
/** Y el destino del coche, por lo que explica `tramos.spec.ts`: el cruce de
 *  LEOPOLDO ROMEO está cerrado al coche por cuatro relations de OSM. */
const EN_MEDIO = 'Portales.82922';
const UN_MARTES = '20260907';

function extremo(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo)!;
  assert.ok(p, `no existe el portal ${codigo}`);
  return { via: p.via, portal: p.codigo };
}

/** Una disponibilidad de mentira: todas con bicis y anclajes, a las 12:48. */
function vivoDeMentira(): Disponibilidad {
  const porNumero = new Map<number, EstadoDeEstacion>();
  for (const e of bizi.estaciones) {
    porNumero.set(e.numero, {
      bicis: 5,
      anclajesLibres: 8,
      enServicio: true,
      cuando: new Date(2026, 7, 30, 12, 48, 0),
    });
  }
  return { porNumero, total: porNumero.size, enMantenimiento: 0, enMs: 1 };
}

function viaje(modo: Modo): Trayecto {
  return calcularTrayecto(
    motor,
    { origen: extremo(COLOSO), destino: extremo(modo === 'coche' ? EN_MEDIO : ROMEO), modo },
    vivoDeMentira(),
  );
}

function enBus(): Trayecto {
  const o = portales.donde.get(COLOSO)!;
  const d = portales.donde.get(ROMEO)!;
  return viajeEnBus(
    motor,
    redBus,
    { nombre: `${o.via} ${o.numero}`, lon: o.lon, lat: o.lat },
    { nombre: `${d.via} ${d.numero}`, lon: d.lon, lat: d.lat },
    UN_MARTES,
  );
}

/** Los seis viajes, cada uno con su nombre para que el fallo diga cuál es. */
let losViajes: readonly (readonly [string, Trayecto])[] = [];

/** Los pasos que traen rango. Los que no, se cuentan aparte y se declaran. */
function conRango(pasos: readonly Paso[]): readonly Paso[] {
  return pasos.filter((p) => p.desde !== undefined || p.hasta !== undefined);
}

describe('⭐ EL RANGO DE VÉRTICES DE CADA PASO (21/09, casilla 5b)', () => {
  before(async () => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    bizi = cargarBiZi(entornoDe(portales));
    const rejilla = cargarRejilla(peaton);
    const cuaderno = cuadernoPara(peaton);
    motor = {
      red: peaton,
      rejilla,
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno,
      redRueda: rueda,
      rejillaRueda: cargarRejilla(rueda),
      cuadernoRueda: cuadernoPara(rueda),
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi,
    };
    redBus = (await cocinar(elFeedQueSeSirve().ruta, andarConElPeaton(peaton, rejilla, cuaderno))).red;
    losViajes = [
      ...(['andando', 'bici', 'patin', 'bizi', 'coche'] as const).map(
        (m) => [m, viaje(m)] as const,
      ),
      ['bus', enBus()] as const,
    ];
  });

  /**
   * ⭐ JUEZ A — VAN LOS DOS O NINGUNO, y dentro de la geometría.
   *
   * Medio rango es peor que ninguno: la pantalla no sabría qué resaltar y
   * tendría que inventarse la otra mitad. Y un índice fuera de la geometría
   * pintaría un trecho vacío sin decir nada.
   */
  test('A · van los dos índices o no va ninguno, y caen dentro de la geometría', () => {
    for (const [nombre, t] of losViajes) {
      assert.ok(t.pasos.length > 0, `${nombre}: no trae ni un paso`);
      t.pasos.forEach((paso, i) => {
        const tiene = (paso.desde !== undefined) === (paso.hasta !== undefined);
        assert.ok(tiene, `${nombre}: el paso ${i} trae medio rango (${paso.desde}, ${paso.hasta})`);
        if (paso.desde === undefined) {
          return;
        }
        assert.ok(
          Number.isInteger(paso.desde) && Number.isInteger(paso.hasta),
          `${nombre}: el paso ${i} trae un índice que no es entero`,
        );
        assert.ok(paso.desde >= 0, `${nombre}: el paso ${i} empieza en ${paso.desde}`);
        assert.ok(
          paso.hasta! <= t.geometria.length - 1,
          `${nombre}: el paso ${i} acaba en ${paso.hasta} y la geometría tiene ${t.geometria.length}`,
        );
        assert.ok(
          paso.hasta! >= paso.desde,
          `${nombre}: el paso ${i} va hacia atrás (${paso.desde} → ${paso.hasta})`,
        );
      });
    }
  });

  /**
   * ⭐ JUEZ B — CONTIGUOS: el `hasta` de uno es el `desde` del siguiente.
   *
   * Es **el solape documentado de OSRM**, y comprarlo es lo que garantiza que
   * los trechos resaltados se toquen. Sin él quedaría un vértice de nadie entre
   * paso y paso, y a la vista sería una raya fina que se corta.
   */
  test('B · ⭐ los rangos son CONTIGUOS: el fin de uno es el inicio del siguiente [solape de OSRM]', () => {
    for (const [nombre, t] of losViajes) {
      const pasos = conRango(t.pasos);
      assert.ok(pasos.length >= 2, `${nombre}: solo ${pasos.length} paso(s) con rango, no hay costura que juzgar`);
      for (let i = 1; i < pasos.length; i++) {
        assert.equal(
          pasos[i]!.desde,
          pasos[i - 1]!.hasta,
          `${nombre}: el paso ${i} empieza en ${pasos[i]!.desde} y el ${i - 1} acabó en ${pasos[i - 1]!.hasta}`,
        );
      }
    }
  });

  /**
   * ⭐ JUEZ C — CUBREN: la unión de los rangos es la geometría entera.
   *
   * El primero empieza en **0** —con el conector de la puerta dentro, que es la
   * lección que `geometriaPorModo` ya se llevó el 30/08— y el último acaba en
   * `geometria.length − 1`. Con la contigüidad de la juez B, las dos cosas
   * juntas significan que no hay un solo vértice sin dueño.
   */
  test('C · ⭐ los rangos CUBREN la geometría entera, sin huecos', () => {
    for (const [nombre, t] of losViajes) {
      const pasos = conRango(t.pasos);
      assert.equal(pasos[0]!.desde, 0, `${nombre}: el primer paso con rango no empieza en el vértice 0`);
      assert.equal(
        pasos[pasos.length - 1]!.hasta,
        t.geometria.length - 1,
        `${nombre}: el último paso con rango no llega al final de la geometría`,
      );
      // Y la cuenta de verdad: se marca cada vértice que algún paso cubre.
      const cubiertos = new Set<number>();
      for (const p of pasos) {
        for (let v = p.desde!; v <= p.hasta!; v++) {
          cubiertos.add(v);
        }
      }
      assert.equal(
        cubiertos.size,
        t.geometria.length,
        `${nombre}: ${t.geometria.length - cubiertos.size} vértice(s) sin ningún paso que los cubra`,
      );
    }
  });

  /**
   * ⭐ JUEZ D — EL PASO QUE CIERRA ES DEGENERADO, y a propósito.
   *
   * La llegada —o el hito que cierra una etapa— no abre trecho ninguno: sus
   * `metros` son 0. Darle una rebanada se la quitaría al paso anterior, que es
   * quien de verdad recorre ese trecho. Valhalla hace esto mismo con su
   * maniobra de destino: `begin_shape_index === end_shape_index`.
   */
  test('D · ⭐ el paso que cierra el viaje es degenerado: no le roba su trecho al anterior', () => {
    for (const [nombre, t] of losViajes) {
      const pasos = conRango(t.pasos);
      const ultimo = pasos[pasos.length - 1]!;
      assert.equal(
        ultimo.desde,
        ultimo.hasta,
        `${nombre}: el paso de cierre se queda con ${ultimo.hasta! - ultimo.desde!} vértice(s)`,
      );
      assert.equal(ultimo.metros, 0, `${nombre}: el paso de cierre no tiene 0 metros`);
    }
  });

  /**
   * ⭐ JUEZ F — **LA REBANADA MIDE LO QUE EL PASO DICE**, y esto es lo que
   *    separa «los índices cierran» de «los índices apuntan a la línea buena».
   *
   * Las juezas B y C compran que los rangos encajen entre sí. Encajarían
   * igual de bien **desplazados en bloque**: si la traducción de trozo a
   * vértice se equivocara, seguirían siendo contiguos y seguirían cubriendo, y
   * cada paso resaltaría el trecho de otro. Esta juez sale de las juezas y va
   * al terreno: mide la rebanada sobre la geometría y la compara con los
   * `metros` que el propio paso declara.
   *
   * ── El margen, medido antes de escribirlo ─────────────────────────
   *
   * No es un número a ojo: se sondearon los cinco modos paso a paso y la
   * desviación tiene **dos fuentes y ninguna más**:
   *
   * 1. **El redondeo de `metrosParaLeer`** —al metro por debajo de 100, a la
   *    decena por encima—, que da ±5 m como mucho. Medido: ningún paso de los
   *    78 pasa de ±5.
   * 2. **Los conectores**, el trecho entre la puerta y la calzada. Por
   *    contrato **no cuentan en `metros`** —se andan salga uno por donde
   *    salga— **pero sí van dibujados en `geometria`**, para que la línea
   *    salga de la puerta. Así que el paso que abre una etapa y el que la
   *    cierra miden de más. Medido: +7, +8 y +23 —el peor, el remate a pie
   *    del aparcabicis en bici y patín—.
   *
   * Por eso el margen NO es un número a ojo sobre el largo del paso —eso se
   * probó y lo cazó en el acto: `coche[8]`, 750 m declarados contra 765 de
   * rebanada, +15 en un paso largo—. El margen va **por dónde está el
   * conector**: los pasos que ABREN o CIERRAN una etapa llevan uno dentro y
   * se les dan 40 m; a los de en medio, que no pueden llevarlo, **5 m**, que
   * es exactamente el redondeo y ni un metro más.
   *
   * Y quién abre o cierra etapa no se adivina: el paso que cierra una etapa
   * tiene 0 metros —la llegada, o el hito—, así que abre etapa el paso 0 y el
   * que va detrás de uno de 0, y la cierra el que va delante de uno de 0.
   *
   * Un mapeo desplazado no se cuela por ninguno de los dos: se iría por
   * cientos de metros.
   */
  test('F · ⭐ cada rebanada MIDE lo que su paso dice: los índices apuntan a la línea buena', () => {
    const MARGEN_CON_CONECTOR = 40;
    const MARGEN_LIMPIO = 5;
    let peor = { quien: '(ninguno)', d: 0, margen: 0 };
    for (const [nombre, t] of losViajes) {
      t.pasos.forEach((paso, i) => {
        if (paso.desde === undefined || paso.metros === 0) {
          return;
        }
        // Abre etapa el primero y el que sigue a un paso de 0 metros; la cierra
        // el que va delante de uno de 0. Ahí, y solo ahí, hay conector.
        const tocaConector =
          i === 0 ||
          t.pasos[i - 1]!.metros === 0 ||
          (t.pasos[i + 1] !== undefined && t.pasos[i + 1]!.metros === 0);
        let largo = 0;
        for (let v = paso.desde + 1; v <= paso.hasta!; v++) {
          const a = t.geometria[v - 1]!;
          const b = t.geometria[v]!;
          largo += metrosEntre(a[0], a[1], b[0], b[1]);
        }
        const d = Math.round(largo) - paso.metros;
        const margen = tocaConector ? MARGEN_CON_CONECTOR : MARGEN_LIMPIO;
        if (Math.abs(d) > Math.abs(peor.d)) {
          peor = { quien: `${nombre}[${i}] ${paso.giro}${tocaConector ? ' [con conector]' : ''}`, d, margen };
        }
        assert.ok(
          Math.abs(d) <= margen,
          `${nombre}: el paso ${i} (${paso.giro}) dice ${paso.metros} m y su rebanada ` +
            `v[${paso.desde}..${paso.hasta}] mide ${Math.round(largo)} m — ${d > 0 ? '+' : ''}${d}, ` +
            `fuera del margen de ${margen}`,
        );
      });
    }
    console.log(
      `     la peor desviación de los seis viajes: ${peor.quien} ` +
        `${peor.d > 0 ? '+' : ''}${peor.d} m, con margen de ${peor.margen}`,
    );
  });

  /**
   * ⭐ JUEZ E — EL CENSO DE LO QUE VIAJA SIN RANGO, declarado.
   *
   * §3 del encargo: un paso que no pueda llevar rango honesto viaja sin él y la
   * pantalla no resalta. Esta juez no lo prohíbe: lo **cuenta y lo dice**, para
   * que el día que aparezca uno nuevo se vea en el acta y no en silencio.
   */
  test('E · el censo de pasos sin rango, dicho con su nombre', () => {
    const sinRango: string[] = [];
    for (const [nombre, t] of losViajes) {
      t.pasos.forEach((paso, i) => {
        if (paso.desde === undefined) {
          sinRango.push(`${nombre}[${i}] ${paso.giro}: «${paso.texto}»`);
        }
      });
    }
    assert.deepEqual(
      sinRango,
      [],
      `pasos sin rango en los seis modos:\n  ${sinRango.join('\n  ')}`,
    );
  });
});
