/**
 * LA HERENCIA POR VECINDAD, comprobada.
 *
 * Dos bancos, y son bancos distintos a propósito:
 *
 * - **El sintético**, con calles inventadas de geometría redonda. Ahí se fijan
 *   las reglas —el radio, la cobertura, la disputa, la ausencia de filtro de
 *   rumbo—, porque una regla comprobada solo cuando Zaragoza la dispara está
 *   comprobada a medias.
 * - **El real**, sobre el fichero municipal y el grafo enteros. Ahí se fija
 *   que el dato es el que la ficha § 1.15 declara, y que las calles del banco
 *   de verdad heredan lo que tienen que heredar.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  cargarEjes,
  casar,
  indexar,
  heredarNombres,
  puntoMedioDe,
  puntosMediosDeVia,
  COBERTURA_MINIMA,
  PASO_DE_MUESTREO_M,
  RADIO_M,
  UMBRAL_DE_DISPUTA,
  type EjeCrudo,
  type IndiceDeEjes,
} from './ejes.ts';
import { cargarGrafo, type GrafoEnMemoria } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';

/** Grados de latitud que hacen un metro, a la latitud de Zaragoza. */
const GRADO_LAT = 1 / 111194.9;
/** Y de longitud, que a 41,65° son más cortos. */
const GRADO_LON = GRADO_LAT / Math.cos((41.65 * Math.PI) / 180);

/** Un punto a X metros al este e Y al norte del origen de pruebas. */
const punto = (este: number, norte: number): [number, number] => [
  -0.88 + este * GRADO_LON,
  41.65 + norte * GRADO_LAT,
];

/** Una calle recta de sur a norte, con nombre, en la abscisa que se diga. */
function calleVertical(
  codigo: string,
  nombre: string | null,
  este: number,
  largo = 200,
): EjeCrudo {
  return { codigo, nombre, partes: [[punto(este, 0), punto(este, largo)]] };
}

/** Un trozo de calle vertical que solo existe entre dos alturas. */
function tramoVertical(
  codigo: string,
  nombre: string,
  este: number,
  desde: number,
  hasta: number,
): EjeCrudo {
  return { codigo, nombre, partes: [[punto(este, desde), punto(este, hasta)]] };
}

describe('El índice de ejes', () => {
  test('mete cada segmento de cada parte de la multilínea', () => {
    const indice = indexar([
      { codigo: '1', nombre: 'UNA', partes: [[punto(0, 0), punto(0, 50), punto(0, 100)]] },
      {
        codigo: '2',
        nombre: 'OTRA',
        partes: [
          [punto(50, 0), punto(50, 50)],
          [punto(60, 0), punto(60, 9)],
        ],
      },
    ]);
    assert.equal(indice.vias, 2);
    assert.equal(indice.segmentos, 4);
  });

  test('una vía sin geometría no aporta nada, y no revienta', () => {
    // Son los 18 DISEMINADOS del fichero municipal: multilínea vacía.
    const indice = indexar([{ codigo: '9340', nombre: 'DISEMINADO ALFOCEA', partes: [] }]);
    assert.equal(indice.vias, 1);
    assert.equal(indice.segmentos, 0);
  });
});

describe('El muestreo', () => {
  test(`parte el tramo cada ${PASO_DE_MUESTREO_M} m, y uno cortito da una muestra`, () => {
    const indice = indexar([calleVertical('1', 'LA CALLE', 0)]);
    // 100 m a 15 m de paso: 7 trozos, 7 muestras.
    assert.equal(casar(indice, [[punto(0, 0), punto(0, 100)]]).muestras, 7);
    // 4 m: no llega ni a un paso, pero se muestrea igual una vez — si no, un
    // tramo corto no votaría a nadie y quedaría mudo por no medir bastante.
    assert.equal(casar(indice, [[punto(0, 0), punto(0, 4)]]).muestras, 1);
  });
});

describe('La herencia por vecindad', () => {
  test('una acera pegada y paralela hereda el nombre de su calle', () => {
    const indice = indexar([calleVertical('100', 'CALLE DE PRUEBA', 0)]);
    const acera = casar(indice, [[punto(8, 10), punto(8, 190)]]);
    assert.equal(acera.herencia?.nombre, 'CALLE DE PRUEBA');
    assert.equal(acera.herencia?.codigo, '100');
    assert.equal(acera.cobertura, 1);
  });

  test('⭐ SIN filtro de rumbo: un tramo PERPENDICULAR pegado hereda igual', () => {
    // Es la doctrina de vecindad, y es justo lo que el filtro de paralelismo
    // de la medición previa descartaba: 2.136 ways / 63,5 km de esquinas y
    // chaflanes que pertenecen a la calle que tienen encima.
    const indice = indexar([calleVertical('100', 'CALLE DE PRUEBA', 0)]);
    const esquina = casar(indice, [[punto(2, 100), punto(20, 100)]]);
    assert.equal(esquina.herencia?.nombre, 'CALLE DE PRUEBA');
  });

  test(`más allá de ${RADIO_M} m no hay vecindad que valga`, () => {
    const indice = indexar([calleVertical('100', 'CALLE DE PRUEBA', 0)]);
    assert.equal(casar(indice, [[punto(26, 10), punto(26, 190)]]).herencia, null);
    assert.equal(casar(indice, [[punto(24, 10), punto(24, 190)]]).herencia?.codigo, '100');
  });

  test(`por debajo del ${COBERTURA_MINIMA * 100} % de cobertura no hereda`, () => {
    // Un way largo que solo roza la calle por una punta: la mayoría de sus
    // muestras no ven ningún eje, y eso NO es pertenecer.
    const indice = indexar([calleVertical('100', 'CALLE DE PRUEBA', 0, 30)]);
    const rozando = casar(indice, [[punto(8, 0), punto(8, 200)]]);
    assert.ok(rozando.cobertura < COBERTURA_MINIMA);
    assert.equal(rozando.herencia, null);
  });

  test('⭐ un way que corre media vida pegado a otra calle: DISPUTA, y no hereda', () => {
    // La mitad sur va pegada a UNA (8 m) y la mitad norte a OTRA (4 m). No hay
    // empate en ninguna muestra: cada una tiene su ganador claro, y aun así el
    // way no es de ninguna de las dos.
    //
    // Ojo con la tentación de ponerlas EQUIDISTANTES para «forzar» la disputa:
    // eso no la dispara, la resuelve el desempate. La duda de verdad es esta.
    const indice = indexar([
      calleVertical('100', 'CALLE UNA', -8),
      tramoVertical('200', 'CALLE OTRA', 4, 100, 190),
    ]);
    const enmedio = casar(indice, [[punto(0, 10), punto(0, 190)]]);
    // Seis votos cada una. Gana OTRA por ir más pegada —el desempate es la
    // distancia media—, pero seis es el 100 % de seis: hay duda, y no hereda.
    assert.equal(enmedio.disputa?.nombre, 'CALLE UNA');
    assert.equal(enmedio.herencia, null);
  });

  test('la disputa mira el NOMBRE, no el código: una calle partida no disputa', () => {
    // El callejero municipal parte vías en varios códigos; que las dos mitades
    // de la misma calle se voten entre ellas no es una duda, es la misma calle.
    const indice = indexar([
      calleVertical('100', 'CALLE PARTIDA', -10),
      calleVertical('200', 'CALLE PARTIDA', 10),
    ]);
    const enmedio = casar(indice, [[punto(0, 10), punto(0, 190)]]);
    assert.equal(enmedio.disputa, null);
    assert.equal(enmedio.herencia?.nombre, 'CALLE PARTIDA');
  });

  test(`el rival por debajo del ${UMBRAL_DE_DISPUTA * 100} % de los votos no estorba`, () => {
    // Misma forma que la disputa, pero la segunda calle solo alcanza el último
    // cuarto del way: es vecina de un trozo, no del way. Tres votos contra
    // nueve, y nueve por 0,8 son 7,2. El ganador se queda con el nombre.
    const indice = indexar([
      calleVertical('100', 'CALLE UNA', -8),
      tramoVertical('200', 'CALLE OTRA', 4, 150, 190),
    ]);
    const acera = casar(indice, [[punto(0, 10), punto(0, 190)]]);
    assert.equal(acera.disputa, null);
    assert.equal(acera.herencia?.nombre, 'CALLE UNA');
    assert.equal(acera.herencia?.cobertura, 9 / 12);
  });

  test('un eje sin nombre_publico no puede prestar nada', () => {
    // Es la GLORIETA ÓSCAR LAÍNEZ HERNÁNDEZ, la única de las 3.359 así.
    const indice = indexar([calleVertical('15912', null, 0)]);
    const acera = casar(indice, [[punto(8, 10), punto(8, 190)]]);
    assert.equal(acera.herencia, null);
  });

  test('cada muestra vota a UNO solo: al eje más cercano', () => {
    // Con dos calles dentro del radio, la de al lado se lleva TODOS los votos
    // y la de más allá ninguno. Si votara a las dos, la lejana pasaría el
    // umbral de disputa y nadie heredaría nunca en una calle estrecha.
    const indice = indexar([
      calleVertical('100', 'LA PEGADA', 0),
      calleVertical('200', 'LA DE ENFRENTE', 20),
    ]);
    const acera = casar(indice, [[punto(5, 10), punto(5, 190)]]);
    assert.equal(acera.herencia?.nombre, 'LA PEGADA');
    assert.equal(acera.disputa, null);
  });

  test('un way lejos de todo no hereda, y lo dice sin votos', () => {
    const indice = indexar([calleVertical('100', 'CALLE DE PRUEBA', 0)]);
    const perdido = casar(indice, [[punto(500, 10), punto(500, 190)]]);
    assert.equal(perdido.cobertura, 0);
    assert.equal(perdido.herencia, null);
    assert.equal(perdido.disputa, null);
  });
});

describe('Los ejes municipales de verdad', () => {
  let indice: IndiceDeEjes;
  before(() => {
    indice = cargarEjes();
  });

  test('trae las 3.359 vías del término, y sus 8.261 tramos', () => {
    assert.equal(indice.vias, 3359);
    assert.equal(indice.tramos, 8261);
    // 75.844 vértices repartidos en 8.261 tramos: un segmento menos por tramo.
    assert.equal(indice.segmentos, 75844 - 8261);
  });

  test('las 18 vías de DISEMINADO no traen geometría, y son las únicas', () => {
    assert.equal(indice.sinGeometria, 18);
  });

  test('una sola vía se queda sin nombre_publico', () => {
    assert.equal(indice.sinNombre, 1);
  });
});

describe('El cruce contra el grafo entero', () => {
  let red: RedEnMemoria;
  let grafo: GrafoEnMemoria;
  before(() => {
    grafo = cargarGrafo();
    red = cargarRed(grafo);
  });

  test('la avenida de Antonio: hay ways mudos que heredan ACADEMIA GENERAL MILITAR', () => {
    const suyos = [...red.nombreHeredado.values()].filter(
      (n) => n === 'AVENIDA ACADEMIA GENERAL MILITAR',
    );
    assert.ok(suyos.length > 0, 'ningún way mudo heredó la avenida');
  });

  test('⭐ la PUERTA DE DISPUTA actúa sobre un way de verdad, no solo en el banco', () => {
    // ⚠️ AJUSTE (tabla de acceso). El ejemplo era el way 475888308, 229 m de
    // carril bici entre la AVENIDA ACADEMIA GENERAL MILITAR y la AVENIDA SAN
    // JUAN DE LA PEÑA. **Ya no sirve**: al peatón no se le deja entrar en un
    // carril bici, así que ese way no está en la red y la prueba pasaría por
    // ausencia — que es la peor forma de pasar.
    //
    // El de ahora es el way 138558095, 1.952 m mudos que reparten sus votos
    // entre dos caminos: 53,1 % al ganador y 46,9 % al CAMINO DEL PINO ---MVR.
    // 0,469/0,531 = 0,88, por encima del 0,8 de la puerta: no se sabe de quién
    // es, así que no hereda de ninguno.
    assert.equal(red.nombreDeWay.has(138558095), false, 'ese way tiene nombre en OSM');
    assert.equal(red.nombreHeredado.has(138558095), false, 'ha heredado, y estaba en disputa');
    // Y los dos de al lado —ids consecutivos, el mismo camino— sí heredan.
    assert.equal(red.nombreHeredado.get(138558086), 'CAMINO DEL PINO ---MVR');
    assert.equal(red.nombreHeredado.get(138558089), 'CAMINO DEL PINO ---MVR');
    // ⭐ Y la puerta no es una anécdota de un way: actúa 848 veces en la red.
    assert.equal(red.herencias.porMotivo.disputa, 848);
  });

  test('lo heredado NUNCA pisa un nombre de OSM', () => {
    for (const way of red.nombreHeredado.keys()) {
      assert.equal(red.nombreDeWay.has(way), false);
    }
  });

  test('el cruce se puede repetir y da lo mismo: no depende del orden', () => {
    const otra = heredarNombres(red);
    assert.equal(otra.nombreHeredado.size, red.nombreHeredado.size);
    for (const [way, nombre] of red.nombreHeredado) {
      assert.equal(otra.nombreHeredado.get(way), nombre);
    }
  });
});

describe('El punto medio de una vía — el punto de las que no tienen portal', () => {
  test('⭐ está a MITAD DE RECORRIDO, no en el vértice del medio', () => {
    /**
     * La calle del banco sintético: **100 m rectos**, pero descritos con cuatro
     * vértices repartidos a lo bruto — 0, 10, 20 y 100. Es el dibujo típico de
     * una curva detallada seguida de una recta larga.
     *
     * · El vértice del medio está en el **15**.
     * · La media de los cuatro vértices cae en el **32,5**.
     * · La mitad del RECORRIDO está en el **50**, y es la única que significa
     *   algo: es el punto que parte la calle en dos mitades andables.
     *
     * Los tres son distintos a propósito. Con una calle de vértices regulares
     * los tres coincidirían y esta prueba no comprobaría nada.
     */
    const medio = puntoMedioDe([[punto(0, 0), punto(10, 0), punto(20, 0), punto(100, 0)]])!;
    assert.ok(medio, 'no ha dado punto');
    const metros = (medio.lon - -0.88) / GRADO_LON;
    assert.ok(Math.abs(metros - 50) < 0.5, `cae en el metro ${metros.toFixed(1)}, no en el 50`);
  });

  test('⭐ y con VARIAS PARTES se recorren como si fueran una sola', () => {
    // 113 de las 619 son multilínea. Dos tramos de 40 m separados por un hueco:
    // la mitad del recorrido son 40 m, que es el final del primero.
    const medio = puntoMedioDe([
      [punto(0, 0), punto(40, 0)],
      [punto(200, 0), punto(240, 0)],
    ])!;
    const metros = (medio.lon - -0.88) / GRADO_LON;
    assert.ok(Math.abs(metros - 40) < 0.5, `cae en el metro ${metros.toFixed(1)}, no en el 40`);
  });

  test('⭐ el punto SIEMPRE cae sobre la línea, incluso en una vía en «L»', () => {
    // Es la propiedad que descarta el centro del rectángulo que la contiene:
    // en una «L» ese centro cae en el hueco, en la manzana de al lado. Aquí la
    // «L» son 100 m al este y 100 al norte, y su mitad es la esquina.
    const medio = puntoMedioDe([[punto(0, 0), punto(100, 0), punto(100, 100)]])!;
    const este = (medio.lon - -0.88) / GRADO_LON;
    const norte = (medio.lat - 41.65) / GRADO_LAT;
    assert.ok(Math.abs(este - 100) < 0.5 && Math.abs(norte - 0) < 0.5, `(${este}, ${norte})`);
  });

  test('sin geometría NO se inventa un punto: NO CONSTA', () => {
    assert.equal(puntoMedioDe([]), null);
    assert.equal(puntoMedioDe([[]]), null);
    // Un solo vértice no es una línea: no hay recorrido que partir por la
    // mitad. Devolverlo sería inventarse que la vía está ahí.
    assert.equal(puntoMedioDe([[punto(0, 0)]]), null);
    // Y una línea de largo cero tampoco: los dos vértices son el mismo punto.
    assert.equal(puntoMedioDe([[punto(0, 0), punto(0, 0)]]), null);
  });

  test('⭐ sobre la capa REAL: 3.359 entradas y 18 sin punto, las de § 1.15', () => {
    const puntos = puntosMediosDeVia();
    // Hay una entrada por vía de la capa AUNQUE no tenga punto: es lo que deja
    // distinguir «no está en la capa» de «está y viene vacía».
    assert.equal(puntos.size, 3359);
    const sinPunto = [...puntos.values()].filter((p) => p === null).length;
    // Las 18 `DISEMINADO DISEMINADO <núcleo>`, que llegan con `coordinates: []`
    // y son coherentes: un diseminado no es una calle y no tiene eje que
    // dibujar. Está contado en la ficha § 1.15.
    assert.equal(sinPunto, 18);
  });
});
