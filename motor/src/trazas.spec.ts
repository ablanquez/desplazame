/**
 * ⭐ LAS JUECES DE LA TRAZA DEL ASFALTO (31/08).
 *
 * ⚠️ **CERO RED.** La traza sale de `shapes.txt` del zip del repositorio y las
 * paradas del cocinado; no se llama a nadie de fuera. Las cifras están
 * **medidas sobre el feed entero**, no sobre una muestra.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { elFeedQueSeSirve } from './feed.ts';
import { casarConSuTraza, cocinar, leerLasTrazas, type RedDeBus } from './red-bus.ts';
import { acumulados, cortar, MAXIMO_DESVIO_M, proyectarMonotono, type Traza } from './trazas.ts';
import { metrosEntre } from './cercano.ts';
import type { Vertice } from '@desplazame/tipos';

let red: RedDeBus;
let trazas: Map<string, Traza>;
let donde: Map<string, Vertice>;

describe('⭐ LA TRAZA DEL ASFALTO, cortada por saltos', () => {
  before(async () => {
    const ruta = elFeedQueSeSirve().ruta;
    // Sin peatón: los transbordos no pintan nada aquí y cuestan la mitad del rato.
    red = (await cocinar(ruta, null)).red;
    trazas = await leerLasTrazas(ruta, readFileSync(ruta));
    donde = new Map(red.paradas.map((p) => [p.id, [p.lat, p.lon] as Vertice]));
  });

  /**
   * ⭐ JUEZ 1 — CADA PARADA CABE EN SU TRAZA, Y NADIE RETROCEDE.
   *
   * Las dos mitades van juntas porque se sostienen la una a la otra:
   *
   * · **≤ 100 m** es la *best practice* del validador de GTFS. Medido sobre los
   *   170 patrones: **3.532 proyecciones y la peor a 40,9 m**. Ni una se pasa.
   * · **Monótonas**: la posición de la parada `i` nunca es anterior a la de la
   *   `i−1`. ⚠️ Y esto no es una precaución teórica — **31 de los 170 patrones**
   *   tienen alguna parada cuyo vecino más cercano cae en el paso de vuelta. El
   *   peor es la **línea 117**, donde la proyección global salta **42 km hacia
   *   atrás** en mitad del recorrido y dibujaría la ruta yendo y viniendo.
   */
  test('⭐ 1 · las paradas caben en su traza (≤100 m) y las proyecciones no retroceden', () => {
    let cuantas = 0;
    let peor = 0;
    let peorQuien = '';
    for (const patron of red.patrones) {
      const casada = casarConSuTraza(patron, trazas, donde);
      assert.ok(casada, `el patrón ${patron.id} se quedó sin traza que casar`);
      assert.equal(casada!.proyecciones.length, patron.paradas.length);
      let anterior = -1;
      casada!.proyecciones.forEach((q, i) => {
        cuantas++;
        if (q.desvio > peor) {
          peor = q.desvio;
          peorQuien = `${patron.id} · parada ${i}`;
        }
        assert.ok(
          q.desvio <= MAXIMO_DESVIO_M,
          `${patron.id} · parada ${i} a ${q.desvio.toFixed(0)} m de su traza`,
        );
        assert.ok(q.s >= anterior, `${patron.id} retrocede en la parada ${i}`);
        anterior = q.s;
      });
    }
    assert.equal(cuantas, 3532, 'las proyecciones que hay que hacer');
    assert.equal(Number(peor.toFixed(1)), 40.9, `la peor es ${peorQuien}`);
  });

  /**
   * ⭐ JUEZ 2 — LA CONCATENACIÓN ES CONTINUA: cero huecos.
   *
   * [DOC OpenTripPlanner] la geometría de un patrón es **la concatenación de
   * las geometrías de sus saltos**, y una concatenación con huecos no es una
   * línea: es una lista de trozos sueltos que en pantalla se ven como una
   * carretera cortada. El fin de un salto tiene que ser **exactamente** el
   * principio del siguiente, y lo es porque los dos son el mismo punto
   * calculado: el pie de la proyección de la parada que comparten.
   */
  test('⭐ 2 · el fin de cada salto es el principio del siguiente, sin huecos', () => {
    let saltos = 0;
    for (const patron of red.patrones) {
      for (let k = 0; k + 1 < patron.saltos.length; k++) {
        const fin = patron.saltos[k]!.traza.at(-1);
        const principio = patron.saltos[k + 1]!.traza[0];
        assert.ok(fin && principio, `${patron.id} tiene un salto sin traza`);
        assert.deepEqual(
          principio,
          fin,
          `${patron.id}: hueco entre el salto ${k} y el ${k + 1}`,
        );
        saltos++;
      }
      // Y ninguna traza degenerada: un salto es una línea, no un punto.
      for (const s of patron.saltos) {
        assert.ok(s.traza.length >= 2, `${patron.id} tiene un salto con menos de dos puntos`);
      }
    }
    assert.equal(saltos, 3362 - red.patrones.length, 'las costuras que hay que comprobar');
  });

  /**
   * ⭐ JUEZ 3 — LA FORMA SE ELIGE POR CÓMO LE QUEDA, no por su nombre.
   *
   * ⚠️ La juez que caza el atajo. `210|0|10` cita **dos** formas y la diferencia
   * no es cosmética: con `210_I` su peor parada cae a **4.222 m** de la traza y
   * con `210_V` a **14 m**. Coger la primera por orden alfabético metía **42
   * paradas** por encima del límite de los 100 m — y la juez 1 no se enteraría
   * de por qué.
   */
  test('⭐ 3 · con dos formas se elige la que mejor le queda, no la primera', () => {
    const patron = red.patrones.find((p) => p.id === '210|0|10')!;
    assert.deepEqual([...patron.formas].sort(), ['210_I', '210_V'], 'el caso de las dos formas');

    const paradas = patron.paradas.map((id) => donde.get(id)!);
    const peorCon = (forma: string): number =>
      proyectarMonotono(trazas.get(forma)!, paradas).reduce((m, q) => Math.max(m, q.desvio), 0);
    assert.ok(peorCon('210_I') > 4000, `210_I deja la peor parada a ${peorCon('210_I').toFixed(0)} m`);
    assert.ok(peorCon('210_V') < 20, `210_V la deja a ${peorCon('210_V').toFixed(0)} m`);

    // Y la elegida es la buena: sus saltos NO son rectas de reserva.
    assert.equal(casarConSuTraza(patron, trazas, donde)!.forma, '210_V');
    assert.equal(patron.saltos.filter((s) => s.recta).length, 0);
  });

  /**
   * ⭐ JUEZ 4 — EL CORTE MIDE EL ASFALTO, y no se salta camino.
   *
   * Los metros de un salto son los de la traza entre las dos proyecciones, así
   * que por la desigualdad triangular tienen que ser **≥ la recta entre esas
   * dos proyecciones**. Si salieran menores, el corte se estaría comiendo un
   * trozo de camino. Medido: **168 de 3.362 se quedan por debajo, y el peor por
   * 9,3 cm** — eso no es camino perdido, es la diferencia entre medir el arco
   * con haversine y proyectar en un plano local. Por eso la holgura es de medio
   * metro y no de cero.
   *
   * ⚠️ **Y NO se compara con la recta entre las PARADAS**, que es lo que parecía
   * la comprobación natural y es falsa: **490 saltos** salen más cortos que ella
   * —el peor por **14,8 m**—, y no porque falte camino, sino porque las paradas
   * están hasta 40 m fuera de la traza y la recta entre dos puntos de fuera
   * puede ser más larga que el arco entre sus pies. Se descubrió con esta juez
   * en rojo. La relación con la poligonal de postes es del VIAJE entero, y ahí
   * se compra: ver la juez 15 de `viaje-bus.spec.ts`.
   *
   * Sobre el feed entero: **1.277 km de asfalto** en 3.362 saltos.
   */
  test('⭐ 4 · los metros del salto son los del arco, nunca menos que su cuerda', () => {
    let kmTotales = 0;
    let cuantos = 0;
    for (const patron of red.patrones) {
      patron.saltos.forEach((salto, k) => {
        const a = salto.traza[0]!;
        const b = salto.traza.at(-1)!;
        const cuerda = metrosEntre(a[0], a[1], b[0], b[1]);
        assert.ok(
          salto.metros + 0.5 >= cuerda,
          `${patron.id} salto ${k}: ${salto.metros.toFixed(1)} m de arco para ${cuerda.toFixed(1)} de cuerda`,
        );
        kmTotales += salto.metros / 1000;
        cuantos++;
      });
    }
    assert.equal(cuantos, 3362);
    assert.equal(Math.round(kmTotales), 1277, 'los km de asfalto del feed entero');
  });

  /**
   * ⭐ JUEZ 5 — LA GEOMETRÍA, a mano, sobre una traza inventada.
   *
   * Las cuatro de arriba miran el feed real y son las que valen; ésta mira la
   * mecánica con una escuadra, que es donde se ve si el corte hace lo que dice:
   * una traza en L, dos paradas a media altura, y el trozo que sale.
   */
  test('⭐ 5 · el corte empieza y acaba en el pie de la perpendicular', () => {
    // Una L: 100 m al norte y luego 100 m al este, más o menos.
    const traza: Traza = [
      [41.65, -0.88],
      [41.6509, -0.88],
      [41.6509, -0.8788],
    ];
    const acum = acumulados(traza);
    assert.ok(acum[2]! > acum[1]! && acum[1]! > 0, 'la traza acumula hacia adelante');

    // Dos paradas separadas de la traza, una en cada brazo.
    const paradas: Vertice[] = [
      [41.6504, -0.87995],
      [41.6509, -0.87935],
    ];
    const [a, b] = proyectarMonotono(traza, paradas);
    assert.equal(a!.i, 0, 'la primera cae en el primer brazo');
    assert.equal(b!.i, 1, 'la segunda en el segundo');
    assert.ok(b!.s > a!.s, 'y en ese orden');
    assert.ok(a!.desvio < 10 && b!.desvio < 10, 'las dos caen cerca de su brazo');

    const trozo = cortar(traza, a!, b!);
    // Pie de la primera → el vértice de la esquina → pie de la segunda.
    assert.equal(trozo.geometria.length, 3);
    assert.deepEqual(trozo.geometria[1], [41.6509, -0.88], 'el codo de la L va dentro');
    assert.equal(Math.round(trozo.metros), Math.round(b!.s - a!.s));
    assert.ok(trozo.metros > 100, 'el camino por la L es más largo que la diagonal');
  });
});
