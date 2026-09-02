/**
 * ⭐ LA RED DEL COCHE (2/09, punto 12 casilla 1a).
 *
 * ⚠️ **CERO RED.** Todo sale de los cuatro ficheros del repositorio, y los
 *    casos NO están inventados: cada restricción se cita **por su id de OSM** y
 *    se eligió del censo del 2/09. Una juez de restricciones con un cruce de
 *    mentira compraría que el código hace lo que el código hace.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PENALIZACION_DE_MEDIA_VUELTA,
  PENALIZACION_DE_SEMAFORO,
  VELOCIDAD_KMH,
  anguloDeGiro,
  cocinarRedDeCoche,
  costeDeTransicion,
  dentroDeLaZbe,
  penalizacionDeGiro,
  puedeElCoche,
  sentidoDelCoche,
  velocidadDe,
  type RedDeCoche,
} from './red-coche.ts';

const dato = (r: string): string => fileURLToPath(new URL(`../${r}`, import.meta.url));
const leer = (r: string): unknown => JSON.parse(readFileSync(dato(r), 'utf8'));

let red: RedDeCoche;
let crudo: Parameters<typeof cocinarRedDeCoche>[0];

before(() => {
  crudo = {
    viario: leer('data/2026-09-02_osm_overpass_zaragoza-bbox_viario-coche.json'),
    restricciones: leer('data/2026-09-02_osm_overpass_zaragoza-bbox_restricciones-giro.json'),
    semaforos: leer('data/2026-09-02_osm_overpass_zaragoza-bbox_semaforos.json'),
    zbe: leer('../app/data/2026-09-02_wfs_movilidad-MU1_ZBE.json'),
  } as Parameters<typeof cocinarRedDeCoche>[0];
  red = cocinarRedDeCoche(crudo);
});

/** Las aristas de un way que terminan en el nodo de OSM dado. */
function entrandoA(way: number, nodoOsm: number): number[] {
  const i = indiceDelNodo(nodoOsm);
  return red.aristas.filter((a) => a.way === way && a.hasta === i).map((a) => a.i);
}
function saliendoDe(way: number, nodoOsm: number): number[] {
  const i = indiceDelNodo(nodoOsm);
  return red.aristas.filter((a) => a.way === way && a.desde === i).map((a) => a.i);
}
/** El índice interno de un nodo de OSM, por su coordenada en el crudo. */
function indiceDelNodo(nodoOsm: number): number {
  const nodos = (crudo.restricciones.elements as { type: string; id: number; lat?: number; lon?: number }[]).filter(
    (e) => e.type === 'node',
  );
  const n = nodos.find((x) => x.id === nodoOsm);
  assert.ok(n, `el nodo ${nodoOsm} no viene en el crudo de restricciones`);
  const i = red.nodos.findIndex((p) => p[0] === n!.lat && p[1] === n!.lon);
  assert.ok(i >= 0, `el nodo ${nodoOsm} no está en la red`);
  return i;
}

describe('⭐ LA RED DEL COCHE — cocina y giros', () => {
  /**
   * ⭐ JUEZ 1 — UNA `no_left_turn` DE VERDAD VETA SU GIRO, Y SOLO EL SUYO.
   *
   * **rel 1211840**, en el cruce de **Calle Asalto** con **Calle del Heroísmo**
   * (nodo 297503189): no se puede girar a la izquierda de la way 92741333 a la
   * 80733755. Por ese cruce pasan **cuatro ways**, así que si el veto se
   * derramara sobre el cruce entero el resto de salidas también caería — y eso
   * es lo que la segunda mitad de esta juez impide.
   */
  test('⭐ 1 · la no_left_turn 1211840 veta SU transición, y las demás del cruce siguen', () => {
    const entradas = entrandoA(92741333, 297503189);
    const prohibidas = saliendoDe(80733755, 297503189);
    assert.ok(entradas.length > 0, 'la Calle Asalto tiene que entrar en ese nodo');
    assert.ok(prohibidas.length > 0, 'la Calle del Heroísmo tiene que salir de ese nodo');

    for (const e of entradas) {
      for (const s of prohibidas) {
        assert.equal(costeDeTransicion(red, e, s), null, `la transición ${e}→${s} tenía que estar vetada`);
      }
      // ⭐ Y el cruce SIGUE abierto por lo demás: al menos una salida con coste.
      const todas = red.salidas.get(red.aristas[e]!.hasta) ?? [];
      const vivas = todas.filter((s) => costeDeTransicion(red, e, s) !== null);
      assert.ok(vivas.length > 0, 'el cruce entero no puede quedar cerrado por una no_left_turn');
    }
  });

  /**
   * ⭐ JUEZ 2 — UNA `only_straight_on` DEJA SOLO SU `to`.
   *
   * **rel 545214**, Carretera de Logroño (nodo 685350410): viniendo de la way
   * 54516732 **lo único permitido** es seguir por la 54516730. Las otras dos
   * ways del cruce —Calle de Álvarez Rodríguez— quedan fuera.
   *
   * ⚠️ `only_*` es el reverso de `no_*`: veta **las demás**, no la suya. Un
   *    cocinado que lo tratara como un `no_` prohibiría justo el único giro
   *    legal, y la ruta saldría igual — por otro sitio— sin que nada chillara.
   */
  test('⭐ 2 · la only_straight_on 545214 deja solo su `to`', () => {
    const entradas = entrandoA(54516732, 685350410);
    const permitidas = new Set(saliendoDe(54516730, 685350410));
    assert.ok(entradas.length > 0 && permitidas.size > 0);

    for (const e of entradas) {
      for (const s of red.salidas.get(red.aristas[e]!.hasta) ?? []) {
        const coste = costeDeTransicion(red, e, s);
        if (permitidas.has(s)) {
          assert.notEqual(coste, null, `la ${e}→${s} es el único «to»: no puede estar vetada`);
        } else {
          assert.equal(coste, null, `la ${e}→${s} no es el «to»: tenía que estar vetada`);
        }
      }
    }
  });

  /**
   * ⭐ JUEZ 3 — `except=bicycle` NO EXIME AL COCHE.
   *
   * **rel 1243522**, Avenida de César Augusto (nodo 263791242), con
   * `except=bicycle;small_electric_vehicle`. Eximir es eximir **a quien se
   * nombra**: la bici puede seguir de frente, el coche no. Leer el `except`
   * como «hay excepción, luego no aplica» mandaría al coche por un giro
   * prohibido.
   *
   * Y el reverso está medido: **tres** relations de Zaragoza llevan
   * `except=motorcar` —1244752, 2204334 y 9451064— y ésas sí eximen al coche.
   */
  test('⭐ 3 · except=bicycle sigue vetando al COCHE', () => {
    const entradas = entrandoA(689453452, 263791242);
    const permitidas = new Set(saliendoDe(82878127, 263791242));
    assert.ok(entradas.length > 0, 'la Avenida de César Augusto tiene que entrar');

    // ⚠️ **Esta juez nació DÉBIL y lo dijo la contraprueba** (2/09): contaba
    //    «hay algún veto en el cruce» y `exentas >= 3`, y las dos cosas seguían
    //    siendo ciertas con el fallo dentro —tratar cualquier `except` como
    //    eximente—, así que daba verde. Ahora se nombra **la salida concreta**
    //    que tiene que quedar vetada, la Calle Morería, y el contador se compra
    //    EXACTO: son tres, y con el fallo serían dieciséis.
    const morería = [
      ...saliendoDe(82878130, 263791242),
      ...saliendoDe(1236050787, 263791242),
    ];
    assert.ok(morería.length > 0, 'la Calle Morería tiene que salir de ese nodo');
    for (const e of entradas) {
      for (const s of morería) {
        assert.equal(
          costeDeTransicion(red, e, s),
          null,
          `la ${e}→${s} va a Morería: la only_straight_on la veta aunque exima a la bici`,
        );
      }
      // Y lo que la restricción SÍ permite sigue permitido.
      for (const s of permitidas) {
        assert.notEqual(costeDeTransicion(red, e, s), null, `el «to» ${e}→${s} no puede estar vetado`);
      }
    }
    assert.equal(
      red.contadores.restriccionesExentas,
      3,
      'solo eximen al coche las tres con except=motorcar: 1244752, 2204334 y 9451064',
    );
  });

  /**
   * ⭐ JUEZ 4 — EL SENTIDO ÚNICO DEL COCHE, sin la excepción de la bici.
   *
   * **way 23134100, Avenida de Pirineos**: `oneway=yes` con
   * `oneway:bicycle=no`. Para la rueda es de doble sentido; **para el coche
   * no**, y ésa es toda la diferencia entre las dos redes.
   */
  test('⭐ 4 · una oneway=yes con contraflujo ciclista es de UN sentido para el coche', () => {
    assert.equal(sentidoDelCoche({ oneway: 'yes', 'oneway:bicycle': 'no' }), 'directo');
    assert.equal(sentidoDelCoche({ oneway: 'yes', 'oneway:bicycle': 'yes' }), 'directo');
    // Y sobre el dato real: las aristas de esa way van todas en el mismo sentido.
    const suyas = red.aristas.filter((a) => a.way === 23134100);
    assert.ok(suyas.length > 0, 'la Avenida de Pirineos tiene que estar en la red');
    for (const a of suyas) {
      const vuelta = red.aristas.find((b) => b.way === 23134100 && b.desde === a.hasta && b.hasta === a.desde);
      assert.equal(vuelta, undefined, `la arista ${a.i} no puede tener su vuelta: es oneway para el coche`);
    }
    // `-1` se respeta y no se repara.
    assert.equal(sentidoDelCoche({ oneway: '-1' }), 'inverso');
    // `junction=roundabout` implica sentido único aunque no lo diga.
    assert.equal(sentidoDelCoche({ junction: 'roundabout' }), 'directo');
  });

  /**
   * ⭐ JUEZ 5 — LA SIGMOIDE, con los valores de `car.lua`.
   *
   * Tres ángulos calculados a mano con la fórmula copiada
   * (`turn_penalty` 7,5 · `turn_bias` 1,075):
   *
   *   0°   →  7.5 / (1 + e^(6.5·1.075))              = 0.00688…
   *   90°  →  7.5 / (1 + e^(-(13/1.075·0.5 − 6.5·1.075))) = 3.7237…
   *   180° →  7.5 / (1 + e^(-(13/1.075 − 6.5·1.075)))     = 7.1400…
   *
   * ⚠️ Y **las dos ramas NO son simétricas**: a −90° no sale lo mismo que a
   *    +90°, porque el sesgo entra dividiendo en una y multiplicando en la
   *    otra. Una aproximación simétrica pasaría los dos primeros y fallaría
   *    aquí, que es exactamente por lo que esta comprobación existe.
   */
  test('⭐ 5 · la sigmoide da los valores de car.lua, y es asimétrica', () => {
    const cerca = (a: number, b: number, msg: string): void =>
      assert.ok(Math.abs(a - b) < 1e-4, `${msg}: ${a} vs ${b}`);
    cerca(penalizacionDeGiro(0), 7.5 / (1 + Math.exp(6.5 * 1.075)), 'recto');
    cerca(
      penalizacionDeGiro(90),
      7.5 / (1 + Math.exp(-((13 / 1.075) * 0.5 - 6.5 * 1.075))),
      'noventa grados',
    );
    cerca(penalizacionDeGiro(180), 7.5 / (1 + Math.exp(-(13 / 1.075 - 6.5 * 1.075))), 'media vuelta');

    // El techo es `turn_penalty` y nunca se pasa.
    assert.ok(penalizacionDeGiro(180) < 7.5);
    assert.ok(penalizacionDeGiro(-180) < 7.5);
    // ⭐ La asimetría, que es la firma de la fórmula de verdad.
    assert.notEqual(penalizacionDeGiro(90), penalizacionDeGiro(-90));
    assert.ok(penalizacionDeGiro(0) < 0.01, 'seguir recto casi no cuesta');
  });

  /**
   * ⭐ JUEZ 6 — EL SEMÁFORO FIJA 2 s.
   *
   * `duration = profile.properties.traffic_signal_penalty or 2` de
   * `lib/obstacles.lua`: el perfil del coche no lo declara, así que son dos.
   * Se compra sobre la red real: la misma transición cuesta 2 s más cuando su
   * nodo tiene semáforo.
   */
  test('⭐ 6 · pasar por un nodo con semáforo cuesta 2 s más', () => {
    assert.equal(PENALIZACION_DE_SEMAFORO, 2);
    let conSemaforo: [number, number] | null = null;
    for (const a of red.aristas) {
      if (!red.conSemaforo.has(a.hasta)) continue;
      const s = (red.salidas.get(a.hasta) ?? []).find((x) => costeDeTransicion(red, a.i, x) !== null);
      if (s !== undefined) {
        conSemaforo = [a.i, s];
        break;
      }
    }
    assert.ok(conSemaforo, 'tiene que haber alguna transición por un nodo con semáforo');
    const [e, s] = conSemaforo!;
    const coste = costeDeTransicion(red, e, s)!;
    const a = red.aristas[e]!;
    const b = red.aristas[s]!;
    const vertice = red.nodos[a.hasta]!;
    const sinSemaforo = penalizacionDeGiro(
      anguloDeGiro(a.g[a.g.length - 2] ?? a.g[0]!, vertice, b.g[1] ?? b.g[0]!),
    );
    assert.ok(
      Math.abs(coste - sinSemaforo - 2) < 1e-9,
      `el semáforo tiene que poner exactamente 2 s: ${coste} − ${sinSemaforo}`,
    );
    assert.ok(red.contadores.semaforosCasados > 1000, `semáforos casados: ${red.contadores.semaforosCasados}`);
  });

  /**
   * ⭐ JUEZ 7 — LAS ARISTAS DENTRO DE LA ZBE QUEDAN MARCADAS.
   *
   * Un punto del casco —el centroide del anillo de la fase 1— cae dentro; uno
   * de Miralbueno, fuera. Y sobre la red: hay aristas marcadas y hay aristas
   * sin marcar, que es lo que impide que un `zbe: true` para todas pase por
   * bueno.
   *
   * ⚠️ **La ZBE avisa, no veta**: la app no sabe la etiqueta ambiental de quien
   *    conduce [FAQ de la sede: B/C/ECO/CERO libres sin registro; alcanza a los
   *    SIN etiqueta]. Marcar es todo lo que se hace aquí; la frase la pondrá el
   *    viaje.
   */
  test('⭐ 7 · lo de dentro de la ZBE se marca, y lo de fuera no', () => {
    const zbe = leer('../app/data/2026-09-02_wfs_movilidad-MU1_ZBE.json') as {
      features: { properties: Record<string, string>; geometry: { coordinates: number[][][][] } }[];
    };
    const fase1 = zbe.features.find((f) => f.properties['fase'] === 'FASE 1')!;
    assert.ok(fase1, 'la fase 1 tiene que estar en la capa');
    assert.ok(dentroDeLaZbe(-0.884443, 41.655692, fase1.geometry.coordinates), 'el casco está dentro');
    assert.ok(!dentroDeLaZbe(-0.95, 41.7, fase1.geometry.coordinates), 'Miralbueno está fuera');

    const dentro = red.aristas.filter((a) => a.zbe).length;
    assert.ok(dentro > 0, 'tiene que haber aristas dentro de la ZBE');
    assert.ok(dentro < red.aristas.length, 'no pueden estar TODAS dentro');
    assert.equal(dentro, red.contadores.enZbe);
  });

  /**
   * ⭐ JUEZ 8 — DETERMINISMO: dos cocinas, el mismo resultado.
   *
   * Es la ley del punto 10. Se compara la **serialización** de lo que se
   * guardaría, no el objeto: dos `Map` con el mismo contenido en otro orden
   * darían distinto fichero y el mismo `deepEqual`.
   */
  test('⭐ 8 · dos cocinas dan exactamente lo mismo', async () => {
    const { createHash } = await import('node:crypto');
    const huella = (r: RedDeCoche): string =>
      createHash('sha256')
        .update(
          JSON.stringify({
            formato: r.formato,
            sello: r.sello,
            nodos: r.nodos,
            aristas: r.aristas,
            salidas: [...r.salidas].sort((a, b) => a[0] - b[0]),
            conSemaforo: [...r.conSemaforo].sort((a, b) => a - b),
            vetadas: [...r.vetadas].sort(),
          }),
        )
        .digest('hex');
    const otra = cocinarRedDeCoche(crudo);
    assert.equal(huella(red), huella(otra));
    assert.equal(red.contadores.aristas, otra.contadores.aristas);
    assert.equal(red.contadores.vetos, otra.contadores.vetos);
  });

  /**
   * ⭐ JUEZ 9 — LA MURALLA: el coche no toca a nadie.
   *
   * Peatón, rueda y bus se cocinan de otros ficheros y con otras reglas. Lo que
   * esta juez compra es que **este módulo no importa ni un trozo de aquéllos**:
   * si mañana alguien reutilizara `red.ts` «para no repetir», la tabla del
   * peatón empezaría a decidir por dónde va el coche.
   */
  test('⭐ 9 · LA MURALLA · la red del coche no importa nada del peatón, la rueda ni el bus', () => {
    const fuente = readFileSync(fileURLToPath(new URL('./red-coche.ts', import.meta.url)), 'utf8');
    for (const prohibido of ['./red.ts', './red-rueda.ts', './red-bus.ts', './grafo.ts', './rueda.ts', './andando.ts']) {
      assert.ok(!fuente.includes(`from '${prohibido}'`), `no puede importar ${prohibido}`);
    }
    // Y su fichero de datos es suyo: no lee el grafo del peatón.
    assert.ok(!fuente.includes('grafo-visor'));
  });

  /**
   * ⭐ JUEZ 10 — LA VELOCIDAD POR TIPO, con `maxspeed` DE TOPE.
   *
   * La tabla es de `car.lua` y está copiada; esto compra que se usa **tal
   * cual**, y que el `maxspeed` de la vía **solo baja**. Una `residential` con
   * `maxspeed=50` sigue a 25: la tabla dice cómo se circula, la señal cuánto
   * deja. Es la juez que la contraprueba (e) muerde.
   */
  test('⭐ 10 · la velocidad sale de la tabla de car.lua y maxspeed solo baja', () => {
    assert.equal(VELOCIDAD_KMH['motorway'], 90);
    assert.equal(VELOCIDAD_KMH['residential'], 25);
    assert.equal(VELOCIDAD_KMH['living_street'], 10);
    assert.equal(VELOCIDAD_KMH['service'], 15);

    assert.equal(velocidadDe({ highway: 'residential' }), 25);
    assert.equal(velocidadDe({ highway: 'residential', maxspeed: '50' }), 25, 'el tope no SUBE');
    assert.equal(velocidadDe({ highway: 'residential', maxspeed: '20' }), 20, 'el tope BAJA');
    assert.equal(velocidadDe({ highway: 'motorway', maxspeed: '120' }), 90);
    assert.equal(velocidadDe({ highway: 'motorway', maxspeed: '80' }), 80);
    // ⚠️ Lo que no es un número limpio no se usa: se calla, no se inventa.
    assert.equal(velocidadDe({ highway: 'primary', maxspeed: 'ES:urban' }), 65);
    assert.equal(velocidadDe({ highway: 'primary', maxspeed: 'none' }), 65);
    assert.equal(velocidadDe({ highway: 'primary', maxspeed: 'walk' }), 65);
    // Y un tipo que no está en la tabla cae al defecto de car.lua.
    assert.equal(velocidadDe({ highway: 'busway' }), 10);
  });

  /** El acceso, por la jerarquía del wiki. */
  test('el acceso: lo específico pisa a lo general', () => {
    assert.equal(puedeElCoche({}), true);
    assert.equal(puedeElCoche({ access: 'private' }), false);
    assert.equal(puedeElCoche({ access: 'private', motorcar: 'yes' }), true);
    assert.equal(puedeElCoche({ access: 'yes', motor_vehicle: 'no' }), false);
    assert.equal(puedeElCoche({ vehicle: 'no' }), false);
  });

  /** La media vuelta, con su limitación heredada y escrita. */
  test('la media vuelta DIRECTA cuesta 20 s más', () => {
    assert.equal(PENALIZACION_DE_MEDIA_VUELTA, 20);
    const ida = red.aristas.find((a) =>
      red.aristas.some((b) => b.way === a.way && b.desde === a.hasta && b.hasta === a.desde),
    );
    assert.ok(ida, 'tiene que haber alguna calle de doble sentido');
    const vuelta = red.aristas.find(
      (b) => b.way === ida!.way && b.desde === ida!.hasta && b.hasta === ida!.desde,
    )!;
    const coste = costeDeTransicion(red, ida!.i, vuelta.i);
    assert.ok(coste !== null && coste >= 20, `la media vuelta tiene que costar ≥20 s: ${coste}`);
  });

  /** Y los contadores del censo, para que el checkpoint no se invente nada. */
  test('los contadores dicen lo que hay', () => {
    const c = red.contadores;
    assert.equal(c.waysLeidas, 25242);
    assert.ok(c.aristas > 0 && c.nodos > 0);
    assert.equal(
      c.restriccionesAplicadas + c.restriccionesViaWay + c.restriccionesFuera + c.restriccionesExentas,
      c.restriccionesLeidas,
      'las restricciones tienen que cuadrar: aplicadas + via-way + fuera + exentas = leídas',
    );
    assert.equal(c.restriccionesViaWay, 11, 'las de via-way son 11 y se cuentan, no se aplican');
  });
});
