/**
 * ⭐ LAS JUECES DE LOS NOMBRES DEL CARRIL (30/08, punto 9, casilla 5).
 *
 * El fallo lo vio Antonio en ruta viva el 30/08: pedaleando por el carril bici
 * de la Avenida San Juan de la Peña, la ruta decía **«Continúa hacia el carril
 * bici · 1.510 m»**. Kilómetro y medio sin decir por dónde.
 *
 * ── Por qué pasaba, y estaba escrito antes de que se viera ──────────────────
 *
 * La herencia de nombre municipal (§ 1.15, `ejes.ts`) se cruzó **sobre las
 * aristas de la red del PEATÓN**, y la tabla de acceso del peatón cierra los
 * carriles bici. Así que los *ways* que **solo** existen en la red de la rueda
 * nunca pasaron por el cruce: no es que no heredaran, es que no se les
 * preguntó. La cabecera de `cargarRedDeLaRueda` lo decía con todas las letras
 * —*«narrarán por su tipo… arreglarlo es de la casilla 5»*—, y esta es.
 *
 * ── Lo medido ANTES, con el motor de HEAD contestando por HTTP ──────────────
 *
 * Sobre 200 pares de portales al azar (semilla fija), **196 dieron ruta en
 * bici y 142 de ellas —el 72,4 %— llevaban al menos un paso que decía "el
 * carril bici" a secas**; 686 pasos en total. En el par del ojo de Antonio
 * (`Portales.108536 → Portales.106070`) eran **5 de 9 pasos**.
 *
 * ── Las tres reglas del arreglo, en este orden ──────────────────────────────
 *
 * 1. **El `name` de OSM manda** [data-first]: si el way tiene nombre propio,
 *    no se hereda nada — es la regla que ya vivía en `heredarNombres`, que
 *    salta los *ways* que están en `nombreDeWay`.
 * 2. **Donde OSM calla, hereda del callejero municipal**, con las mismas dos
 *    puertas de confianza (cobertura y disputa) que usa el peatón. No se
 *    relaja ninguna: un carril mal casado sería peor que uno mudo.
 * 3. **Y se viste**: «el carril bici de Avenida San Juan de la Peña». El
 *    vestido es [PROPIO] sobre herencia doctrinada, y **solo se pone cuando el
 *    tramo entero es carril**: si al colapsar se mezcló con la calzada de la
 *    misma avenida, se narra la avenida a secas, que es lo que se pisa.
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
import { cargarAparcabicis } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { cuadernoPara } from './ruta.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import type { Paso, Trayecto } from '@desplazame/tipos';

let motor: Motor;
let rueda: RedDeLaRueda;
let peaton: RedEnMemoria;
let portales: PortalesEnMemoria;
/**
 * Cuántos *ways* hereda el peatón, **fotografiado antes de que exista la red de
 * la rueda**. Es lo único que puede demostrar que levantarla no le toca nada.
 */
let HEREDADOS_DEL_PEATON = 0;

/**
 * ⭐ EL PAR DEL OJO: `AVENIDA SAN JUAN DE LA PEÑA 4 → AVENIDA ACADEMIA GENERAL
 * MILITAR 1`, en bici.
 *
 * Es el que Antonio miró. Con el motor de HEAD daba **9 pasos, 5 de ellos
 * diciendo «el carril bici» a secas**, dos seguidos:
 *
 *     Gira a la izquierda hacia el carril bici · 75 m
 *     Gira a la derecha  hacia el carril bici · 30 m
 *     Gira a la izquierda hacia el carril bici · 130 m
 *     Gira a la derecha  hacia el carril bici · 1.510 m
 *     Gira a la izquierda hacia el carril bici · 120 m
 */
const A = 'Portales.108536';
const B = 'Portales.106070';

function extremo(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo)!;
  assert.ok(p, `no existe el portal ${codigo}`);
  return { via: p.via, portal: p.codigo };
}

/** Los pasos que narran el carril **sin nombre**: «el carril bici» y punto. */
function aSecas(pasos: readonly Paso[]): Paso[] {
  return pasos.filter((p) => /el carril bici(?! de )/.test(p.texto));
}

/** Los pasos que narran el carril **con su calle**: «el carril bici de X». */
function conNombre(pasos: readonly Paso[]): Paso[] {
  return pasos.filter((p) => p.texto.includes('el carril bici de '));
}

describe('⭐ LOS NOMBRES DEL CARRIL BICI (30/08)', () => {
  before(() => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    HEREDADOS_DEL_PEATON = peaton.nombreHeredado.size;
    portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
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
      bizi: cargarBiZi(entornoDe(portales)),
    };
  });

  /**
   * ⭐ JUEZ 9 — EL FLECO DEL OJO, MUERTO: el par de Antonio ya dice por dónde.
   *
   * ⚠️ **Esta juez nació pidiendo CERO carriles a secas, y estaba mal pedido.**
   * Con el arreglo puesto quedaba uno, y mirando cuál era, el rojo no era del
   * código: el *way* 475888308 —229 m de carril en el nudo donde se juntan las
   * dos avenidas— **no hereda por DISPUTA**, con 36,4 % de cobertura para una
   * vía y 34,1 % para la otra. Es la puerta de confianza de `ejes.ts` haciendo
   * exactamente su trabajo. Exigir cero habría obligado a bajarla, y entonces
   * la ruta diría un nombre inventado en vez de callar: peor.
   *
   * Así que lo que se exige es lo que de verdad se quiere:
   *
   * - **el tramo largo —el de 1.510 m que Antonio miró— dice su avenida**;
   * - **cuatro de los cinco mudos ya se nombran**;
   * - y lo que sigue genérico es **corto**: menos del 10 % del recorrido. Un
   *   «el carril bici» de 120 m entre dos indicaciones con nombre se lee; uno
   *   de kilómetro y medio, que es lo que había, no.
   */
  test('9 · el par del ojo nombra sus carriles, y lo que calla es corto', () => {
    const t: Trayecto = calcularTrayecto(motor, {
      origen: extremo(A),
      destino: extremo(B),
      modo: 'bici',
    });
    const nombrados = conNombre(t.pasos);
    assert.ok(
      nombrados.length >= 4,
      `solo ${nombrados.length} pasos nombran su carril; eran 5 los mudos. Los pasos: ` +
        t.pasos.map((p) => `«${p.texto}»`).join(' · '),
    );
    // Y el largo, el que se ve desde la bici: el tramo de 1,5 km ya se llama.
    const largo = t.pasos.find((p) => p.metros >= 1000);
    assert.ok(largo, 'el tramo largo del par ha desaparecido: la ruta ha cambiado');
    assert.match(
      largo.texto,
      /el carril bici de /,
      `el tramo de ${largo.metros} m sigue sin decir por dónde va: «${largo.texto}»`,
    );
    // Lo que se calla, se calla en corto.
    const mudos = aSecas(t.pasos).reduce((s, p) => s + p.metros, 0);
    assert.ok(
      mudos < t.metros * 0.1,
      `${mudos} m de ${t.metros} siguen narrados como «el carril bici» a secas: ` +
        aSecas(t.pasos)
          .map((p) => `«${p.texto}» ${p.metros} m`)
          .join(' · '),
    );
  });

  /**
   * ⭐ JUEZ 9 bis — LA HERENCIA LLEGA A LA RED DE LA RUEDA, contada.
   *
   * La juez de arriba mira una ruta; esta mira el cruce. Sin ella, un arreglo
   * que solo funcionara en la Avenida San Juan de la Peña daría verde.
   *
   * La red de la rueda tiene que heredar **más** *ways* que la del peatón: los
   * suyos y además los que solo existen aquí. Que sean estrictamente más es lo
   * único que se puede exigir sin clavar una cifra que cambiará con el dato.
   */
  test('9 bis · la rueda hereda nombres que el peatón no tenía', () => {
    assert.ok(
      rueda.nombreHeredado.size > peaton.nombreHeredado.size,
      `la rueda hereda ${rueda.nombreHeredado.size} y el peatón ${peaton.nombreHeredado.size}: ` +
        'la rueda sigue prestándose el mapa del peatón sin añadir el suyo',
    );
    // Y lo que hereda de más son carriles bici, no cualquier cosa.
    let carrilesConNombre = 0;
    for (const [way] of rueda.nombreHeredado) {
      if (!peaton.nombreHeredado.has(way) && rueda.tipoDeWay.get(way) === 'cycleway') {
        carrilesConNombre++;
      }
    }
    assert.ok(
      carrilesConNombre >= 100,
      `solo ${carrilesConNombre} carriles bici han heredado nombre; se esperaban cientos`,
    );
  });

  /**
   * ⭐ JUEZ 9 ter — EL `name` DE OSM MANDA, y la herencia no lo pisa.
   *
   * Es la regla 1, y es la que impide que este arreglo empeore lo que ya
   * estaba bien. Ningún *way* con nombre propio de OSM puede tener además
   * nombre heredado: si lo tuviera, habría dos verdades para el mismo tramo y
   * ganaría la de vecindad sobre la del dato.
   */
  test('9 ter · ningún way con nombre de OSM hereda otro', () => {
    const pisados: number[] = [];
    for (const [way] of rueda.nombreHeredado) {
      if (rueda.nombreDeWay.has(way)) {
        pisados.push(way);
      }
    }
    assert.deepEqual(
      pisados,
      [],
      `${pisados.length} ways con nombre propio de OSM han heredado encima: ${pisados.slice(0, 5).join(', ')}`,
    );
  });

  /**
   * ⭐ JUEZ 9 quater — EL PEATÓN NO SE ENTERA.
   *
   * La red del peatón se construye antes y la de la rueda se cuelga de ella.
   * Si al añadirle la herencia a la rueda se tocara el `Map` del peatón —por
   * mutarlo en vez de copiarlo—, sus 391 rutas cambiarían de narración sin que
   * nadie lo hubiera pedido. La muralla del peatón lo cazaría, pero tarde y
   * sin decir por qué; esto lo dice aquí.
   */
  /**
   * ⭐ JUEZ 9 quinquies — EL VESTIDO SE APAGA AL MEZCLARSE CON LA CALZADA.
   *
   * ⚠️ **Esta juez existe porque la contraprueba encontró un hueco.** La regla
   * del vestido —«solo si el tramo ENTERO es carril»— estaba escrita en tres
   * sitios de `pasos.ts` y **ninguna prueba la vigilaba**: quitándola de los
   * tres, las 346 seguían en verde. Y no es una regla teórica: quitándola
   * **cambia la narración de 125 de 200 rutas de bici al azar**, medido.
   *
   * El caso: `Portales.119421 → Portales.83882` en bici. Ahí se recorren 780 m
   * que son carril bici Y calzada de la **Avenida Tenor Fleta**, fundidos en un
   * solo paso porque son la misma avenida y no hay giro. Sin la regla, ese paso
   * diría «el carril bici de Avenida Tenor Fleta» durante los 780 m enteros,
   * también por donde ya no hay carril.
   */
  test('9 quinquies · un tramo mezclado no se viste de carril', () => {
    const t = calcularTrayecto(motor, {
      origen: extremo('Portales.119421'),
      destino: extremo('Portales.83882'),
      modo: 'bici',
    });
    const largo = t.pasos.find((p) => p.metros === 780);
    assert.ok(largo, 'el tramo de 780 m del caso ha desaparecido: la ruta ha cambiado');
    assert.equal(largo.texto, 'Gira a la izquierda hacia Avenida Tenor Fleta');
    assert.doesNotMatch(
      largo.texto,
      /carril bici/,
      'ese tramo mezcla carril y calzada: llamarlo carril es mentir en la mitad',
    );
    // ⚠️ Y NO se añade aquí un «pero en otro sitio sí se viste»: la primera
    // versión llevaba una condición con un `|| true` al final, que es una
    // aserción que no puede fallar. Que el vestido siga vivo lo demuestra la
    // juez 9, con su propio par.
  });

  test('9 quater · la herencia del peatón no crece por debajo', () => {
    // ⚠️ **La primera versión de esta juez no mordía**, y se descubrió en la
    // contraprueba: comparaba `peaton.nombreHeredado` con
    // `peaton.herencias.nombreHeredado`, y si la rueda ALIAS el mapa en vez de
    // copiarlo los dos apuntan al mismo objeto mutado y salen iguales. Una
    // juez que se cumple sola es peor que no tenerla.
    //
    // Lo que sí muerde es una foto tomada ANTES de que la rueda exista.
    assert.equal(
      peaton.nombreHeredado.size,
      HEREDADOS_DEL_PEATON,
      'el Map del peatón ha cambiado de tamaño al levantarse la rueda: alguien lo muta',
    );
    assert.notEqual(
      peaton.nombreHeredado,
      rueda.nombreHeredado,
      'la rueda tiene que llevar SU mapa, no el del peatón con cosas dentro',
    );
  });
});
