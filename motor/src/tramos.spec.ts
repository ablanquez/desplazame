/**
 * ⭐ LAS JUECES DE LOS TRAMOS DEL VIAJE (30/08, punto 9, pulido del mapa).
 *
 * La respuesta publica desde hoy **cómo se recorre cada trecho** y **dónde
 * empieza y acaba dentro de la geometría**. [DOC OpenTripPlanner / Digitransit]
 * un itinerario es una lista de `legs` con su `mode`; esto es eso, y lo único
 * que cambia es que lo que el motor ya sabía por dentro ahora se dice.
 *
 * ── Por qué el contrato tuvo que crecer, medido ─────────────────────────────
 *
 * La pantalla no podía derivarlo. La única derivación posible —acumular los
 * `metros` de los pasos— falla porque **esos metros vienen redondeados a
 * propósito** (al metro por debajo de 100, a la decena por encima). En el caso
 * del ojo en BiZi la suma deriva **10 m** y pone el corte en el vértice 198
 * cuando el bueno es el 200: **6,9 m** de error, con el icono del hito cayendo
 * en mitad de la calle en vez de en la estación.
 *
 * ── Los tres invariantes, y por qué son tres ────────────────────────────────
 *
 * 1. **Los índices cierran**: el primero empieza en 0, el `hasta` de uno es el
 *    `desde` del siguiente, y el último acaba en `geometria.length − 1`. Sin
 *    esto quedan vértices que nadie pinta o líneas que se pisan.
 * 2. **Las cifras suman el total declarado**, exactamente. Se redondea por
 *    fronteras acumuladas y no tramo a tramo, que es lo que lo hace posible.
 * 3. **El empujado es `andando`**, no un tercer estado: quien lleva el vehículo
 *    en la mano va a pie [RGC art. 121.2], y así quien pinta no necesita saber
 *    que el empuje existe.
 *
 * ⚠️ **Los dos primeros invariantes nacieron rojos y no por casualidad**: al
 * comprobarlos a mano antes de escribir esta juez, el primer tramo de una etapa
 * rodada salía `[1..160]` en vez de `[0..160]` —el conector de la puerta se
 * quedaba fuera de todos los cortes— y por eso el tramo siguiente tampoco
 * cerraba. Está arreglado en `geometriaPorModo`, con el porqué escrito allí.
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
import type { Modo, Trayecto } from '@desplazame/tipos';

let motor: Motor;
let portales: PortalesEnMemoria;
let peaton: RedEnMemoria;
let rueda: RedDeLaRueda;
let bizi: BiZiEnMemoria;

/** El caso del ojo de Antonio: COLOSO 2 → LEOPOLDO ROMEO 27. */
const COLOSO = 'Portales.93310';
const ROMEO = 'Portales.79358';

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
    { origen: extremo(COLOSO), destino: extremo(ROMEO), modo },
    vivoDeMentira(),
  );
}

describe('⭐ LOS TRAMOS DEL VIAJE (30/08)', () => {
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
   * ⭐ JUEZ A — LOS ÍNDICES CIERRAN, en los cuatro modos.
   *
   * Se comprueban los cuatro y no uno: el andando trae un tramo, la bici y el
   * patín traen los del empuje más el remate, y la BiZi los de sus tres etapas.
   * Un arreglo que solo cuadrara en uno pasaría media juez.
   */
  test('A · los índices cierran y cubren la geometría entera', () => {
    for (const modo of ['andando', 'bici', 'patin', 'bizi'] as const) {
      const t = viaje(modo);
      assert.ok(t.tramos.length > 0, `${modo} no trae ni un tramo`);
      assert.equal(t.tramos[0]!.desde, 0, `${modo}: el primer tramo no empieza en el vértice 0`);
      assert.equal(
        t.tramos[t.tramos.length - 1]!.hasta,
        t.geometria.length - 1,
        `${modo}: el último tramo no llega al final de la geometría`,
      );
      t.tramos.forEach((tramo, i) => {
        assert.ok(tramo.hasta >= tramo.desde, `${modo}: el tramo ${i} va hacia atrás`);
        if (i > 0) {
          assert.equal(
            tramo.desde,
            t.tramos[i - 1]!.hasta,
            `${modo}: el tramo ${i} no empieza donde acaba el ${i - 1}`,
          );
        }
      });
    }
  });

  /**
   * ⭐ JUEZ B — LAS CIFRAS DE LOS TRAMOS SUMAN EL TOTAL DECLARADO.
   *
   * Exactamente, no «casi». Es lo que hace el redondeo por fronteras
   * acumuladas: redondeando cada tramo por su cuenta, un viaje en BiZi —cinco
   * tramos— podría descuadrar hasta en cinco metros, y quien sumara lo que lee
   * en pantalla no llegaría a la cifra de la cabecera.
   */
  test('B · los metros y los segundos de los tramos suman el total', () => {
    for (const modo of ['andando', 'bici', 'patin', 'bizi'] as const) {
      const t = viaje(modo);
      assert.equal(
        t.tramos.reduce((s, x) => s + x.metros, 0),
        t.metros,
        `${modo}: los metros de los tramos no dan el total`,
      );
      assert.equal(
        t.tramos.reduce((s, x) => s + x.segundos, 0),
        t.segundos,
        `${modo}: los segundos de los tramos no dan el total`,
      );
    }
  });

  /**
   * ⭐ JUEZ C — EL EMPUJADO ES `andando`, y el resto de la rueda `rodando`.
   *
   * El caso del ojo en bici cruza **45 m con la bici en la mano** y remata con
   * **52 m a pie** desde el aparcabicis. Los dos tienen que salir `andando`, y
   * el pedaleo `rodando`. Si el empuje saliera `rodando`, la pantalla lo
   * pintaría como si se fuera montado por una acera.
   */
  test('C · lo que se empuja sale como andando, no como rodando', () => {
    const t = viaje('bici');
    const aPie = t.tramos.filter((x) => x.comoSeVa === 'andando');
    const rodando = t.tramos.filter((x) => x.comoSeVa === 'rodando');
    assert.ok(aPie.length >= 2, `solo ${aPie.length} tramos a pie: el empuje no se ha partido`);
    assert.ok(rodando.length >= 1, 'tiene que quedar pedaleo');
    // Y el pedaleo es la mayor parte del viaje: si el reparto se hubiera dado
    // la vuelta, esta línea lo diría.
    const metrosRodando = rodando.reduce((s, x) => s + x.metros, 0);
    assert.ok(
      metrosRodando > t.metros * 0.8,
      `solo ${metrosRodando} m de ${t.metros} van rodando`,
    );
    // El andando puro no tiene nada que partir: un tramo y a pie.
    const aPieEntero = viaje('andando');
    assert.equal(aPieEntero.tramos.length, 1);
    assert.equal(aPieEntero.tramos[0]!.comoSeVa, 'andando');
  });

  /**
   * ⭐ JUEZ D — EL HITO CAE EN LA ESTACIÓN, no cerca de ella.
   *
   * Es la razón de ser de todo esto. El vértice `geometria[tramo.hasta]` del
   * tramo que muere en un hito tiene que estar **encima** del dato — la
   * estación BiZi o el aparcabicis—, no a unos metros.
   *
   * Se exige **menos de 1 m** y no cero exacto: son grados convertidos a
   * metros por un haversine, y pedir el cero sería pedir aritmética infinita.
   * Medido, sale a **0,0 m**.
   */
  test('D · el vértice del hito está encima de la estación', () => {
    const t = viaje('bizi');
    const conHito = t.tramos.filter((x) => x.hito !== null);
    assert.equal(conHito.length, 2, 'un viaje en BiZi tiene dos hitos, ni uno más ni uno menos');
    assert.equal(conHito[0]!.hito, 'coge');
    assert.equal(conHito[1]!.hito, 'aparca');

    // Los nombres que la narración escribe, en el mismo orden.
    const hitos = t.pasos.filter((p) => p.giro === 'coge' || p.giro === 'aparca');
    assert.equal(hitos.length, 2);
    conHito.forEach((tramo, i) => {
      assert.equal(
        tramo.hito,
        hitos[i]!.giro,
        'el hito del tramo y el del paso tienen que ser el mismo suceso',
      );
      const nombre = hitos[i]!.partes.find((x) => x.papel === 'via')?.texto ?? '';
      const estacion = bizi.estaciones.find((e) => e.nombre === nombre);
      assert.ok(estacion, `el paso nombra una estación desconocida: «${nombre}»`);
      const v = t.geometria[tramo.hasta]!;
      const lejos = metrosEntre(v[0], v[1], estacion.lat, estacion.lon);
      assert.ok(
        lejos < 1,
        `el vértice ${tramo.hasta} está a ${lejos.toFixed(1)} m de «${nombre}»`,
      );
    });
  });

  /**
   * ⭐ JUEZ E — EL REMATE TAMBIÉN PONE SU HITO, y solo uno.
   *
   * En bici y en patín hay **un** aparcabicis y por tanto **un** hito, y es de
   * clase `aparca`. Que no haya ninguno de clase `coge` no es un detalle: la
   * bici propia no se coge en ninguna parte, se sale con ella de casa.
   */
  test('E · la bici y el patín ponen un solo hito, y es de aparcar', () => {
    for (const modo of ['bici', 'patin'] as const) {
      const t = viaje(modo);
      const conHito = t.tramos.filter((x) => x.hito !== null);
      assert.equal(conHito.length, 1, `${modo}: tiene que haber un hito y solo uno`);
      assert.equal(conHito[0]!.hito, 'aparca');
      assert.equal(
        t.tramos.filter((x) => x.hito === 'coge').length,
        0,
        `${modo}: la bici propia no se coge en ninguna estación`,
      );
      // Y el hito no es el último tramo: después queda el paseo hasta la puerta.
      assert.notEqual(conHito[0], t.tramos[t.tramos.length - 1]);
    }
  });
});
