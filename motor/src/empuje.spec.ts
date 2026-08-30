/**
 * ⭐ LAS JUECES DEL EMPUJE (30/08, punto 9).
 *
 * Quien empuja su vehículo **es peatón**, y con eso se le abre lo peatonal a
 * paso de peatón. Es lo que ya hacía la rueda en los pasos de cebra desde la
 * casilla 3 —la celda del art. 54.4—, generalizado: no es una excepción del
 * paso de cebra, es la regla del que va andando.
 *
 * [DOC OSM, tabla canónica de acceso] *«el acceso se concede en toda situación
 * a quien va andando empujando su bicicleta; en consecuencia los ruteadores
 * pueden considerar…»*. [LEY RGC art. 121.2] mete a quien empuja en el
 * capítulo del peatón — ⚠️ **caduca el 01/10/2026**, que el RD 518/2026 lo
 * lleva al art. 122.2.a.
 *
 * ── El mecanismo: el coste decide, no un umbral ─────────────────────────────
 *
 * No hay número mágico de «hasta cuántos metros se puede empujar». El empuje
 * **compite en tiempo** dentro del mismo Dijkstra: 5 km/h contra 18 o 20. Un
 * rodeo de 900 m rodando pierde contra 50 m empujando; un atajo de 300 m por
 * la acera pierde contra 320 rodando. Es el mecanismo de OSRM, que modela el
 * tramo desmontado con `walking_speed` junto a su velocidad de perfil.
 *
 * ── Lo que estas jueces NO cubren, y lo cubre otra ──────────────────────────
 *
 * **La muralla del peatón** —el sha256 de sus 391 rutas— es la juez 11 de
 * `rueda.spec.ts` y sigue siendo la misma: no se copia aquí, se corre en la
 * misma suite. El empuje toca la red de la rueda; el peatón tiene la suya.
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
import { cargarAparcabicis } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { cuadernoPara } from './ruta.ts';
import { admiteComoPuerta, calcularRutaRodando, segundosDe } from './rodando.ts';
import { VELOCIDAD_EMPUJANDO_KMH, VELOCIDAD_KMH } from './rueda.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import type { Trayecto } from '@desplazame/tipos';

let motor: Motor;
let rueda: RedDeLaRueda;
let peaton: RedEnMemoria;
let portales: PortalesEnMemoria;
let rejillaRueda: Rejilla;

type Punto = [number, number];

/** El extremo de una petición, con su vía, a partir del código de portal. */
function extremo(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo)!;
  assert.ok(p, `no existe el portal ${codigo}`);
  return { via: p.via, portal: p.codigo };
}

/** Un trayecto de punta a punta, como lo pide la pantalla. */
function trayecto(modo: 'bici' | 'patin' | 'bizi', origen: string, destino: string): Trayecto {
  return calcularTrayecto(motor, {
    origen: extremo(origen),
    destino: extremo(destino),
    modo,
  });
}

/**
 * ⭐ La ruta RODANDO pelada, sin el remate del aparcabicis.
 *
 * Hace falta desde el 30/08: `calcularTrayecto` ya no devuelve una ruta, sino
 * un viaje de tres tramos —rodar, aparcar, andar—, y estas jueces son del
 * EMPUJE, que solo ocurre en el tramo que se rueda. Medir el total sería medir
 * además el paseo desde el aparcabicis, que no es lo que se está juzgando.
 */
function rodar(modo: 'bici' | 'patin' | 'bizi', a: Punto, b: Punto) {
  const eo = enganchar(rueda, rejillaRueda, a[0], a[1], (x) => admiteComoPuerta(rueda, x, modo));
  const ed = enganchar(rueda, rejillaRueda, b[0], b[1], (x) => admiteComoPuerta(rueda, x, modo));
  return eo && ed ? calcularRutaRodando(rueda, cuadernoPara(rueda), modo, eo, a, ed, b) : null;
}

/** Dónde está un portal, en `[lon, lat]` como el grafo. */
function donde(codigo: string): Punto {
  const p = portales.donde.get(codigo)!;
  return [p.lon, p.lat];
}

/** Los metros de una ruta que van EMPUJANDO. */
function metrosEmpujando(modo: 'bici' | 'patin' | 'bizi', a: Punto, b: Punto): number {
  const eo = enganchar(rueda, rejillaRueda, a[0], a[1], (x) => admiteComoPuerta(rueda, x, modo));
  const ed = enganchar(rueda, rejillaRueda, b[0], b[1], (x) => admiteComoPuerta(rueda, x, modo));
  if (!eo || !ed) {
    return -1;
  }
  const r = calcularRutaRodando(rueda, cuadernoPara(rueda), modo, eo, a, ed, b);
  if (!r) {
    return -1;
  }
  return r.trozos
    .filter((t) => rueda.empujando[t.arista] === 1)
    .reduce((s, t) => s + t.metros, 0);
}

/** El caso del ojo de Antonio: COLOSO 2 → LEOPOLDO ROMEO 27. */
const COLOSO = 'Portales.93310';
const ROMEO = 'Portales.79358';

describe('⭐ EL EMPUJE (30/08)', () => {
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
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi: cargarBiZi(entornoDe(portales)),
    };
  });

  /**
   * ⭐ JUEZ 1 — EL CASO DEL OJO DE ANTONIO.
   *
   * `COLOSO 2 → LEOPOLDO ROMEO 27` en patín. Sin empuje daba **5.741 m en 11
   * pasos**: el patín no puede cruzar el Camino de las Torres —no está en su
   * lista del art. 56.3— y se iba a buscar el paso lejano por el Puente de la
   * Unión, 1.700 + 1.780 + 350 + 900 m de rodeo. La bici, que sí puede, lo
   * hacía en 4.805.
   *
   * Con el empuje, unos metros con el patín en la mano resuelven el cruce y la
   * ruta baja: la barrera no era el vehículo, era no poder bajarse de él.
   *
   * ⚠️ **Y desde el remate del aparcabicis (30/08, casilla 5) hay DOS cifras**,
   * y las dos se fijan aquí porque son dos cosas distintas: el tramo que se
   * rueda mide **4.832 m** y el viaje entero —rodar, aparcar, andar— mide
   * **4.867**, los 35 m que se andan desde el aparcabicis hasta el portal.
   * Lo que esta juez es —el empuje— vive en el primero.
   *
   * ⚠️ **La cifra se movió de 4.551 a 4.832 m el 30/08 por la tarde**, y no es
   * una regresión: el selector de ruta le dio al patín su calibrado propio —el
   * fuerte, porque su vía ciclista es OBLIGATORIA [ORD art. 56.2.c] y eso no es
   * un gusto—. Con él paga 281 m y compra **287 m más de carril bici**
   * (3.991 → 4.278) y **baja su hostilidad de 510 a 191**. Sigue empujando
   * 33 m y sigue narrándolo; lo que cambia es por dónde va el resto. Frente a
   * los 5.741 de antes del empuje, sigue ahorrando 909. Lo que la juez mira son cuatro cosas, y las cuatro juntas:
   *
   * 1. **baja de los 5.741 m** de antes;
   * 2. **hay tramo empujado**, y no cero;
   * 3. **se narra**: algún paso dice «con el patín en la mano»;
   * 4. **los segundos cuadran** con la mezcla — el empuje a 5 km/h y lo demás
   *    a 18 con su techo, no todo a una velocidad.
   */
  test('⭐ 1 · el patín cruza en la mano y la ruta del caso baja de 5.741 m', () => {
    const t = trayecto('patin', COLOSO, ROMEO);

    assert.equal(t.avisos.length, 0, 'tiene que haber ruta');
    assert.ok(
      t.metros < 5741,
      `el patín seguía dando el rodeo: ${t.metros} m (antes del empuje eran 5.741)`,
    );

    const a = donde(COLOSO);
    const b = donde(ROMEO);
    // Las dos cifras exactas, para que el día que se muevan se sepa cuál.
    //
    // ⭐ **Se movieron +2 m el 30/08 por la tarde** (4.832 → 4.834 y 4.867 →
    // 4.869), al retirar la corrección de sentido de la Calle Monasterio de
    // Siresa, que estaba invertida. Cuadrado arista a arista contra el camino
    // de antes y el de después:
    //
    //   sale el rodeo:  Silvestre Pérez 131,2 + Doctor Iranzo 74,7 = 205,900 m
    //   entra el bueno: Monasterio de Siresa 130,1 + Guadalupe 78,0 = 208,100 m
    //   ------------------------------------------------------------------
    //   208,100 − 205,900 = +2,200 m, y las aristas comunes aportan 0,000
    //
    // Es decir: el patín vuelve a bajar Siresa hacia el Doctor Iranzo —que es
    // su sentido legal— en vez de rodearla, y le cuesta 2,2 m más porque el
    // rodeo era, por pura geometría, un pelo más corto. Ver bitácora del 30/08.
    assert.equal(
      Math.round(rodar('patin', a, b)!.metros),
      4834,
      'los metros RODADOS del caso, medidos el 30/08',
    );
    assert.equal(t.metros, 4869, 'y los del viaje entero, con el remate del aparcabicis');
    const empujados = metrosEmpujando('patin', a, b);
    assert.ok(empujados > 0, 'la ruta tiene que empujar en alguna parte');

    const enLaMano = t.pasos.filter((p) => p.texto.includes('con el patín en la mano'));
    assert.ok(
      enLaMano.length > 0,
      'el tramo empujado tiene que narrarse:\n' + t.pasos.map((p) => '  ' + p.texto).join('\n'),
    );

    // ⭐ Los segundos, con la mezcla. Rodando nunca por encima de la velocidad
    // del patín; empujando, a paso de peatón. Si todo fuera a una sola
    // velocidad, la duración caería fuera de esta horquilla.
    const rodados = t.metros - empujados;
    const minimo = rodados / ((VELOCIDAD_KMH.patin * 1000) / 3600) + empujados / ((VELOCIDAD_EMPUJANDO_KMH * 1000) / 3600);
    assert.ok(
      t.segundos >= Math.floor(minimo),
      `${t.segundos} s es menos de lo que costaría sin techos ni factores (${minimo.toFixed(0)})`,
    );
  });

  /**
   * ⭐ JUEZ 2 — EL EMPUJE NO SE ABUSA.
   *
   * El caso es el de la **juez 4 de `rueda.spec.ts`**: `Portales.120344 →
   * Portales.110047` en bici, 1.565 m cruzando la Avenida de Madrid. Ahí rodar
   * es mejor que empujar por cualquier acera, y el coste tiene que decirlo
   * solo — sin un umbral escrito en ninguna parte.
   *
   * La juez exige las dos mitades: **ni un metro empujado**, y **los mismos
   * 1.565 m** que antes de que existiera el empuje. Abrir lo peatonal no puede
   * cambiar una ruta a la que no le hacía falta.
   *
   * ⚠️ Los 1.565 son los del tramo RODADO. Desde el remate del aparcabicis el
   * viaje entero mide **1.721**: se pedalea 7 m más hasta el soporte de la
   * Calle Jaca y se andan 149 hasta el portal. Se fija también, por lo mismo
   * que en la juez 1 — dos cifras, dos cosas.
   */
  test('⭐ 2 · donde rodar es mejor, no se gana ni un metro de acera', () => {
    const a = donde('Portales.120344');
    const b = donde('Portales.110047');

    const empujados = metrosEmpujando('bici', a, b);
    assert.equal(Math.round(empujados), 0, 'no debería empujar nada');

    const t = calcularTrayecto(motor, {
      origen: extremo('Portales.120344'),
      destino: extremo('Portales.110047'),
      modo: 'bici',
    });
    assert.equal(
      Math.round(rodar('bici', a, b)!.metros),
      1565,
      'la ruta RODADA de la juez 4 no se mueve',
    );
    assert.equal(t.metros, 1721, 'y el viaje entero, con el remate del aparcabicis');
  });

  /**
   * ⭐ JUEZ 2 bis — EL INVARIANTE, sobre 100 pares al azar.
   *
   * La juez 2 mira un caso; esta mira el mecanismo. **Abrir una opción nunca
   * puede subir el mínimo**: si el empuje no compensa, el Dijkstra no lo coge,
   * y el coste tiene que salir igual o menor en TODAS las rutas. Un solo par
   * donde suba significaría que el empuje no está compitiendo, sino colándose.
   *
   * Se compara **en la misma red y con el mismo enganche** —la única diferencia
   * es hacer intransitables las aristas de acera—, así que no hay renumeración
   * ni extremos movidos de por medio: es la misma pregunta con y sin la opción.
   *
   * Medido sobre 200 pares el 30/08: **0 de 282 rutas suben de coste**, el
   * tiempo baja en 159 y sube en 18. Los 18 son un desajuste anterior a este
   * encargo y está declarado en el checkpoint: el montículo minimiza tiempo
   * **por factor de preferencia** [casilla 3] y la respuesta reporta el tiempo
   * **sin el factor**, así que la ruta que gana en el montículo puede no ser la
   * más rápida del reloj. El empuje no lo causa; añade opciones y lo enseña.
   */
  test('⭐ 2 bis · abrir el empuje no sube el coste de NINGUNA ruta', () => {
    // La misma red con las aceras intransitables: el factor es lo que pesa.
    // Los tres calibrados con las aceras intransitables: la juez compara con y
    // sin empuje, y desde el 30/08 «sin empuje» hay que decirlo en los tres.
    const factores = {
      rapida: Float32Array.from(rueda.factores.rapida),
      equilibrada: Float32Array.from(rueda.factores.equilibrada),
      tranquila: Float32Array.from(rueda.factores.tranquila),
    };
    for (let k = 0; k < rueda.soloEmpujando.length; k++) {
      if (rueda.soloEmpujando[k] === 1) {
        factores.rapida[k] = 1e7;
        factores.equilibrada[k] = 1e7;
        factores.tranquila[k] = 1e7;
      }
    }
    const sinEmpuje: RedDeLaRueda = { ...rueda, factores };
    const cuaderno = cuadernoPara(rueda);
    let semilla = 20260830;
    const azar = (): number => {
      semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
      return semilla / 0x7fffffff;
    };
    const sitios = portales.situados;
    let comparadas = 0;
    let bajan = 0;
    for (let n = 0; n < 100; n++) {
      const A = sitios[Math.floor(azar() * sitios.length)]!;
      const B = sitios[Math.floor(azar() * sitios.length)]!;
      const a: Punto = [A.lon, A.lat];
      const b: Punto = [B.lon, B.lat];
      for (const modo of ['bici', 'patin'] as const) {
        const eo = enganchar(rueda, rejillaRueda, a[0], a[1], (x) => admiteComoPuerta(rueda, x, modo));
        const ed = enganchar(rueda, rejillaRueda, b[0], b[1], (x) => admiteComoPuerta(rueda, x, modo));
        if (!eo || !ed) continue;
        const con = calcularRutaRodando(rueda, cuaderno, modo, eo, a, ed, b);
        const sin = calcularRutaRodando(sinEmpuje, cuaderno, modo, eo, a, ed, b);
        if (!con || !sin) continue;
        comparadas++;
        const coste = (r: typeof con, red: RedDeLaRueda): number =>
          r!.trozos.reduce((s, t) => s + segundosDe(red, t.arista, modo, t.metros), 0);
        const conEmpuje = coste(con, rueda);
        const sinNada = coste(sin, rueda);
        assert.ok(
          conEmpuje <= sinNada + 0.01,
          `el empuje ha SUBIDO el coste de ${A.codigo}→${B.codigo} en ${modo}: ` +
            `${conEmpuje.toFixed(1)} s contra ${sinNada.toFixed(1)}`,
        );
        if (conEmpuje < sinNada - 0.01) bajan++;
      }
    }
    assert.ok(comparadas > 100, `se han comparado ${comparadas} rutas`);
    assert.ok(bajan > 0, 'y en alguna tiene que bajar, o el empuje no sirve de nada');
  });

  /**
   * ⭐ JUEZ 3 — LA BICI DEL CASO NO EMPEORA.
   *
   * La bici hacía `COLOSO 2 → LEOPOLDO ROMEO 27` en **4.805 m** y no
   * necesitaba empujar: puede cruzar el Camino de las Torres rodando. Abrirle
   * lo peatonal no puede alargarle la ruta, y el Dijkstra por tiempo lo
   * garantiza — pero se comprueba, porque un cambio de red que empeora una
   * ruta que ya estaba bien es exactamente lo que no se ve.
   */
  test('⭐ 3 · la bici del caso no empeora: sigue en 4.805 m', () => {
    const t = trayecto('bici', COLOSO, ROMEO);
    assert.equal(t.avisos.length, 0);
    assert.ok(t.metros <= 4805, `la bici ha empeorado: ${t.metros} m (eran 4.805)`);
  });

  /**
   * ⭐ JUEZ 4 — EL TRAMO EMPUJADO ES UN PASO PROPIO, Y NO SE FUNDE.
   *
   * [DOC OSRM] su respuesta lleva un campo `mode` por paso, con el tramo
   * empujado como modo propio, y su suite tiene una prueba «de todos los
   * empujes y cambios de modo». La razón es de lectura: fundir el tramo que se
   * empuja con el que se rueda escribiría un paso que dice dos cosas a la vez,
   * y quien lo lee no sabría dónde bajarse.
   *
   * Aquí eso se traduce en dos condiciones sobre los pasos del caso:
   *
   * - **ningún paso mezcla**: el que lleva «en la mano» lo lleva entero;
   * - **se retoma**: después del empuje hay al menos un paso que no lo lleva,
   *   o sea que se vuelve a rodar y se dice.
   */
  test('⭐ 4 · el tramo empujado es su propio paso y después se retoma', () => {
    const t = trayecto('patin', COLOSO, ROMEO);
    const indices = t.pasos
      .map((p, i) => (p.texto.includes('en la mano') ? i : -1))
      .filter((i) => i >= 0);

    assert.ok(indices.length > 0, 'tiene que haber al menos un paso empujado');

    // Después del último empuje se vuelve a rodar, y hay paso que lo dice.
    const ultimo = indices[indices.length - 1]!;
    assert.ok(
      ultimo < t.pasos.length - 1,
      'el empuje no puede ser el último paso de esta ruta: se retoma y se llega rodando',
    );
    assert.ok(
      !t.pasos[ultimo + 1]!.texto.includes('en la mano'),
      'el paso siguiente al empuje ya no empuja: se ha retomado',
    );
  });
});
