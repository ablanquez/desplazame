/**
 * El gacetero: el entorno, el emparejador estricto y el veredicto.
 *
 * Aquí se juzga la pieza sola, contra el callejero de verdad. Lo que la
 * validación le hace al índice de sitios se juzga en `sitios.spec.ts`, y lo que
 * le hace a una ruta, en `trayecto.spec.ts`.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { metrosEntre } from './cercano.ts';
import {
  cargarGacetero,
  dentroDelEntorno,
  portalDeLaDireccion,
  metrosALaVia,
  esSubsecuencia,
  validar,
  MARGEN_DEL_ENTORNO_M,
  UMBRAL_DE_DESVIO_M,
  type Gacetero,
} from './gacetero.ts';

let portales: PortalesEnMemoria;
let gacetero: Gacetero;

/**
 * ⚠️ La coordenada de PORTUGAL: `9090` «Centro de Salud Fernando El Católico»,
 * tal y como viene en el fichero municipal (§ 1.17). Está a unos 610 km.
 */
const PORTUGAL = { lon: -8.184875254157216, lat: 41.542372909710075 };

describe('El gacetero — el entorno', () => {
  before(() => {
    portales = cargarPortales();
    gacetero = cargarGacetero(portales, cargarCallejero(portales));
  });

  test('⭐ el entorno SALE DEL DATO: son los cuatro extremos del censo con su margen', () => {
    // Se recalculan aquí a mano, sobre los mismos 46.150 portales. No es
    // comparar el código consigo mismo: lo que se afirma es la REGLA —el
    // rectángulo es el de los portales, ensanchado el margen— frente a la
    // alternativa de un rectángulo escrito a mano, que es lo que esto prohíbe.
    let lonMin = Infinity;
    let lonMax = -Infinity;
    let latMin = Infinity;
    let latMax = -Infinity;
    for (const p of portales.situados) {
      lonMin = Math.min(lonMin, p.lon);
      lonMax = Math.max(lonMax, p.lon);
      latMin = Math.min(latMin, p.lat);
      latMax = Math.max(latMax, p.lat);
    }
    // Los extremos medidos hoy sobre el censo, escritos para que se vea de qué
    // tamaño es la caja: 32,6 km de ancho por 30,3 de alto, el término entero.
    assert.equal(lonMin.toFixed(6), '-1.160933');
    assert.equal(lonMax.toFixed(6), '-0.768544');
    assert.equal(latMin.toFixed(6), '41.501989');
    assert.equal(latMax.toFixed(6), '41.774764');

    // Y el entorno los envuelve, sin pasarse: el margen es de 250 m, que en
    // grados son estas milésimas.
    const holguraLat = (gacetero.entorno.latMax - latMax) * 111132;
    assert.ok(
      Math.abs(holguraLat - MARGEN_DEL_ENTORNO_M) < 1,
      `la holgura en latitud es de ${holguraLat.toFixed(0)} m`,
    );
    assert.ok(gacetero.entorno.lonMin < lonMin && gacetero.entorno.lonMax > lonMax);
  });

  test('⭐ los 46.150 portales caen DENTRO: el entorno no deja fuera nada de la ciudad', () => {
    for (const p of portales.situados) {
      assert.ok(dentroDelEntorno(gacetero.entorno, p.lon, p.lat), `${p.codigo} se queda fuera`);
    }
  });

  test('⭐ la coordenada de PORTUGAL cae fuera, y cae fuera POR CONSTRUCCIÓN', () => {
    assert.equal(dentroDelEntorno(gacetero.entorno, PORTUGAL.lon, PORTUGAL.lat), false);

    // «Por construcción» quiere decir que no depende del margen que se elija:
    // está a 584 km del borde, así que ni ensanchando el entorno mil veces el
    // margen entraría. Un rectángulo escrito a mano sí podría estar mal puesto;
    // este sale de los propios portales.
    const kmFuera = ((gacetero.entorno.lonMin - PORTUGAL.lon) * 83195) / 1000;
    assert.ok(kmFuera > 500, `solo ${kmFuera.toFixed(0)} km fuera`);
  });

  test('el entorno se cierra en sus bordes, no los deja abiertos', () => {
    const { lonMin, lonMax, latMin, latMax } = gacetero.entorno;
    const centroLat = (latMin + latMax) / 2;
    assert.equal(dentroDelEntorno(gacetero.entorno, lonMin, centroLat), true);
    assert.equal(dentroDelEntorno(gacetero.entorno, lonMax, centroLat), true);
    assert.equal(dentroDelEntorno(gacetero.entorno, lonMin - 0.0001, centroLat), false);
    assert.equal(dentroDelEntorno(gacetero.entorno, lonMax + 0.0001, centroLat), false);
    const centroLon = (lonMin + lonMax) / 2;
    assert.equal(dentroDelEntorno(gacetero.entorno, centroLon, latMin - 0.0001), false);
    assert.equal(dentroDelEntorno(gacetero.entorno, centroLon, latMax + 0.0001), false);
  });
});

/**
 * Un punto del centro de Zaragoza, para las pruebas a las que la coordenada les
 * da igual: las que miran si un nombre casa o si un número es único. Desde el
 * 27/08 el emparejador **necesita** un punto —desambigua por cercanía—, así que
 * ya no hay llamadas sin él, y las que no dependen de él lo dicen usando este.
 */
const EN_EL_CENTRO = { lon: -0.8773, lat: 41.6518 };

describe('El gacetero — el emparejador estricto', () => {
  before(() => {
    portales = cargarPortales();
    gacetero = cargarGacetero(portales, cargarCallejero(portales));
  });

  /** Donde el Ayuntamiento publica la farmacia de «C/ La Caza, 11». */
  const LA_CAZA = { lon: -0.9263253602068995, lat: 41.6150414308692 };

  test('⭐ una dirección normal da SU portal, con su coordenada del censo', () => {
    // «C/ La Caza, 11» es una de las cuatro farmacias del desvío del datum, y
    // por eso está aquí: es la dirección que va a rescatarla.
    const p = portalDeLaDireccion(gacetero, 'C/ La Caza, 11', LA_CAZA.lon, LA_CAZA.lat);
    assert.ok(p, 'no ha casado');
    assert.equal(p.codigo, 'Portales.98467');
    assert.equal(p.numero, '11');
    assert.equal(p.lon, -0.924971);
    assert.equal(p.lat, 41.616909);
  });

  test('⭐ un NOMBRE AMBIGUO se desambigua por CERCANÍA: AVENIDA y CALLE MADRID', () => {
    // El equipamiento escribe «C/», pero fiarse del tipo pediría una tabla de
    // equivalencias que nadie publica. Antes que adivinar, no casar.
    //
    // ⚠️ Esta prueba usaba «C/ Aragón, 1» y **pasaba por el motivo equivocado**:
    // ninguna de las cuatro vías Aragón tiene un portal 1 único, así que
    // aceptar la ambigüedad tampoco la habría hecho casar. Se cazó mutando —la
    // mutación «gana la primera vía» no la ponía roja— y se cambió por un caso
    // que sí distingue: AVENIDA MADRID **sí** tiene un nº1 y uno solo, así que
    // sin la regla de unicidad una farmacia de la Calle Madrid acabaría
    // rescatada a la Avenida.
    const madrid = gacetero.viasPorNombre.get('madrid');
    assert.equal(madrid?.length, 2);
    assert.deepEqual(
      madrid.map((c) => gacetero.nombreDeVia.get(c)),
      ['AVENIDA MADRID', 'CALLE MADRID'],
    );
    assert.equal(
      portales.porVia.get(madrid[0]!)!.filter((p) => p.numero === '1').length,
      1,
    );

    // ⭐ Y DESDE EL 27/08 SÍ CASA, porque manda la geografía. La misma
    // dirección, «C/ Madrid, 1», da un portal u otro según DÓNDE esté el punto
    // que la acompaña — que es justo lo que hace un geocodificador con un
    // topónimo repetido [location bias].
    // Se usa el nº 3, que existe y es único en las DOS —el 1 solo lo tiene la
    // avenida, así que no distinguiría nada.
    const a = portales.donde.get(
      portales.porVia.get(madrid[0]!)!.find((p) => p.numero === '3')!.codigo,
    )!;
    const c = portales.donde.get(
      portales.porVia.get(madrid[1]!)!.find((p) => p.numero === '3')!.codigo,
    )!;
    // Los dos «Madrid 3» están a 13.389 m: si estuvieran pegados, esta prueba
    // no probaría nada.
    assert.ok(
      metrosEntre(a.lat, a.lon, c.lat, c.lon) > 10000,
      'los dos Madrid 3 están demasiado cerca para que esto pruebe algo',
    );
    // La MISMA dirección da un portal u otro según dónde esté el punto.
    assert.equal(portalDeLaDireccion(gacetero, 'C/ Madrid, 3', a.lon, a.lat)?.codigo, a.codigo);
    assert.equal(portalDeLaDireccion(gacetero, 'C/ Madrid, 3', c.lon, c.lat)?.codigo, c.codigo);

    // ⭐ Y LA GUARDA: si el punto no está cerca de NINGUNA de las candidatas,
    // no se elige la menos mala — no se elige ninguna. Es la mitad que faltaba
    // de «la geo-similitud manda»: sin ella, desambiguar por cercanía casaba
    // direcciones que antes se descartaban y **metía cinco rescates nuevos, de
    // los que tres eran falsos** (medido el 27/08 sobre las siete categorías).
    assert.equal(
      portalDeLaDireccion(gacetero, 'C/ Madrid, 3', PORTUGAL.lon, PORTUGAL.lat),
      null,
      'con el punto en Portugal no puede elegir un Madrid cualquiera',
    );

    // Y el caso gordo, que ahora también se resuelve: cuatro vías se llaman
    // Aragón —dos calles en dos barrios y dos plazas—.
    assert.equal(gacetero.viasPorNombre.get('aragon')?.length, 4);
  });

  test('⭐ un NÚMERO REPETIDO no casa: San Juan de la Peña 181 son 23 portales', () => {
    // Bloques y escaleras de la misma dirección, repartidos por la parcela. Es
    // el caso que enseñó por qué la unicidad del número también hace falta: sin
    // ella se elegía uno a suertes y la farmacia 8881 —que está BIEN puesta, a
    // 4 m de su bloque— salía «rota» a 53 m y se habría movido.
    assert.equal(portalDeLaDireccion(gacetero, 'Avda. San Juan de la Peña, 181', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
  });

  test('⭐ «s/n» no casa, y por eso el de Portugal no se puede rescatar', () => {
    assert.equal(portalDeLaDireccion(gacetero, 'C/ Domingo Miral, s/n', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
    // La vía existe y tiene portales: lo que falta es el número.
    assert.equal(gacetero.viasPorNombre.get('domingo miral')?.length, 1);
  });

  test('un número que esa vía no tiene, tampoco', () => {
    assert.equal(portalDeLaDireccion(gacetero, 'C/ La Caza, 9999', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
  });

  test('una dirección vacía o sin nombre no revienta: devuelve null', () => {
    assert.equal(portalDeLaDireccion(gacetero, '', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
    assert.equal(portalDeLaDireccion(gacetero, 'NO CONSTA', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
    assert.equal(portalDeLaDireccion(gacetero, '11', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
    assert.equal(portalDeLaDireccion(gacetero, 'C/ 11', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
  });

  test('⭐ EL CALLEJERO parte la dirección: «Puente del Pilar 31, local 6»', () => {
    // Hay dos números y ninguna coma que diga cuál es el portal. Se prueban los
    // dos cortes: «puente del pilar» + 31 resuelve, «puente del pilar 31, local»
    // + 6 no existe. Gana el único que resuelve.
    const p = portalDeLaDireccion(gacetero, 'Avda. Puente del Pilar 31, local 6', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat);
    assert.equal(p?.numero, '31');
  });

  test('⭐ y lo mismo cuando el número está en el NOMBRE de la calle', () => {
    // «14 de Septiembre» empieza por un número, y cortar por el primero dejaría
    // un nombre vacío. El callejero de Zaragoza además la escribe con letra
    // —CALLE CATORCE DE SEPTIEMBRE—, así que esta no casa por otro motivo; lo
    // que se comprueba aquí es que no revienta ni casa cualquier cosa.
    assert.equal(portalDeLaDireccion(gacetero, 'C/ 14 de Septiembre, 4', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
  });

  test('el número del censo trae cola, y se compara por sus dígitos', () => {
    // «12-14» del equipamiento contra el portal «12» del censo; y al revés, un
    // portal «21-23» contra el «21» escrito.
    assert.equal(portalDeLaDireccion(gacetero, 'Pº María Agustín, 12-14', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat)?.numero, '12');
    assert.equal(portalDeLaDireccion(gacetero, 'Pº María Agustín, 21-23', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat)?.numero, '21-23');
  });

  test('⭐ LA REGLA DE LA SUBSECUENCIA, sola y sin red', () => {
    // ⚠️ Esta prueba existe porque la contraprueba la pidió: mutando
    // `esSubsecuencia` para comparar TROZOS en vez de palabras, las 277 pruebas
    // seguían VERDES. La guarda de cercanía descarta después las candidatas
    // absurdas, así que el resultado no se movía — pero la regla estaba rota y
    // nadie la miraba. Aquí se mira sola.
    const parte = (t: string): string[] => t.split(' ');

    // ⭐ El caso de la nº14: el nombre de pila que el callejero no registra.
    assert.equal(esSubsecuencia(parte('doctor palomar'), parte('doctor alejandro palomar')), true);
    // En ORDEN, no en cualquier orden.
    assert.equal(esSubsecuencia(parte('palomar doctor'), parte('doctor alejandro palomar')), false);
    // Y no hace falta que vayan seguidas.
    assert.equal(esSubsecuencia(parte('a d'), parte('a b c d')), true);

    // ⚠️ EL FANTASMA DE LA TANDA 1, que es lo que esto no puede reabrir:
    // «mina» está DENTRO de «taormina» como trozo de letras y no como palabra.
    assert.equal(esSubsecuencia(parte('la mina'), parte('taormina')), false);
    assert.equal(esSubsecuencia(parte('casa mayor'), parte('casamayor')), false);
    assert.equal(esSubsecuencia(parte('santo domingo'), parte('isabel santodomingo')), false);

    // ⭐ Y el mínimo de DOS palabras: un nombre de una sola cabría dentro de
    // medio callejero —«mayor» está en cien direcciones— y no dice nada.
    assert.equal(esSubsecuencia(parte('mayor'), parte('calle mayor de casetas')), false);
    assert.equal(esSubsecuencia(parte('carmen'), parte('nuestra senora del carmen')), false);
    // Con dos, sí.
    assert.equal(esSubsecuencia(parte('del carmen'), parte('nuestra senora del carmen')), true);
  });

  test('⭐ LA SUBSECUENCIA compara PALABRAS, no trozos: el fantasma no vuelve', () => {
    // ⚠️ La tanda 1 cerró la puerta a los parecidos porque un emparejador flojo
    // casó «mina» con CONTAMINA y «mayor» con CASAMAYOR. La nº14 vuelve a
    // abrirla, pero solo para **palabras enteras en orden**, y esta prueba es
    // la que sostiene la diferencia.
    //
    // El callejero de Zaragoza trae el caso servido: «taormina» LLEVA DENTRO
    // «mina» como trozo de letras, y son tres calles distintas.
    for (const clave of ['taormina', 'la mina', 'minas']) {
      assert.equal(gacetero.viasPorNombre.has(clave), true, `falta la clave ${clave}`);
    }

    // «C/ Taormina, 2» desde su propio punto da SU calle, no el Paseo la Mina.
    const taormina = portales.donde.get(
      portales.porVia.get(gacetero.viasPorNombre.get('taormina')![0]!)![0]!.codigo,
    )!;
    const casa = portalDeLaDireccion(gacetero, 'C/ Taormina, 2', taormina.lon, taormina.lat);
    assert.equal(casa?.codigo, taormina.codigo);
    assert.equal(gacetero.nombreDeVia.get(casa!.via), 'CALLE TAORMINA');

    // Y al revés: puesto EN el Paseo la Mina, «C/ Taormina, 2» no casa —
    // ninguna candidata tiene una puerta cerca, y la clave exacta única que
    // queda es la de Taormina, que está a 10 km. Se rescataría, no se
    // confundiría de calle.
    const laMina = portales.donde.get(
      portales.porVia.get(gacetero.viasPorNombre.get('la mina')![0]!)![0]!.codigo,
    )!;
    const desdeLaMina = portalDeLaDireccion(gacetero, 'C/ Taormina, 2', laMina.lon, laMina.lat);
    assert.equal(desdeLaMina?.codigo, taormina.codigo, 'se ha ido a la calle equivocada');
  });

  test('⭐ EL TOPÓNIMO PARCIAL sí casa: «Doctor Alejandro Palomar» → DOCTOR PALOMAR', () => {
    // El caso de la nº14. El Ayuntamiento escribe la dirección con el nombre de
    // pila y el callejero registra la calle sin él, así que las dos claves son
    // distintas y no hay homónimo que desambiguar. La subsecuencia de palabras
    // las une, y la guarda decide cuál: desde San Juan de Mozarrifar gana la
    // del barrio; desde la ciudad, la de la ciudad.
    assert.equal(gacetero.viasPorNombre.get('doctor alejandro palomar')?.length, 1);
    assert.equal(gacetero.viasPorNombre.get('doctor palomar')?.length, 1);

    const enElBarrio = { lon: -0.8426853752732937, lat: 41.716620571592415 };
    const casa = portalDeLaDireccion(gacetero, 'C/ Doctor Alejandro Palomar, 21', enElBarrio.lon, enElBarrio.lat);
    // `nombreDeVia` guarda el nombre LIMPIO, sin el marcador de barrio rural:
    // el crudo del censo es «CALLE DOCTOR PALOMAR ---SJN».
    assert.equal(gacetero.nombreDeVia.get(casa!.via), 'CALLE DOCTOR PALOMAR');

    // Y la clave exacta gana cuando ella sí supera la guarda: puesto en la
    // calle de la ciudad, la misma dirección da la de la ciudad.
    const enLaCiudad = { lon: -0.872152, lat: 41.651282 };
    const otra = portalDeLaDireccion(gacetero, 'C/ Doctor Alejandro Palomar, 21', enLaCiudad.lon, enLaCiudad.lat);
    assert.equal(gacetero.nombreDeVia.get(otra!.via), 'CALLE DOCTOR ALEJANDRO PALOMAR');
  });

  test('⚠️ el ARTÍCULO que un registro escribe y el otro no, NO casa', () => {
    // Es la limitación declarada del emparejador, y está aquí escrita para que
    // se vea: el equipamiento dice «Avda. de Navarra» y el callejero municipal
    // «AVENIDA NAVARRA». Como los nombres tienen que ser idénticos, no casa —
    // y la farmacia de esa dirección se queda sin validar, que es exactamente
    // como estaba antes de existir el gacetero.
    assert.equal(portalDeLaDireccion(gacetero, 'Avda. de Navarra, 65', EN_EL_CENTRO.lon, EN_EL_CENTRO.lat), null);
    assert.equal(gacetero.viasPorNombre.has('navarra'), true);
    assert.equal(gacetero.viasPorNombre.has('de navarra'), false);
  });
});

describe('El gacetero — dos cortes que resuelven: laboratorio', () => {
  /**
   * ⚠️ **Esta rama el dato real no la alcanza.** Medido sobre las 386
   * direcciones de los tres ficheros: **ninguna** resuelve por dos cortes
   * distintos, así que con el callejero de Zaragoza el `return null` de la
   * ambigüedad no se ejecuta nunca. Dejarla sin prueba sería dejar sin vigilar
   * la regla que decide qué pasa el día que una dirección diga dos cosas.
   *
   * Así que se fabrica el caso: dos vías donde el nombre de la segunda contiene
   * al de la primera con un número por medio. Es el mismo recurso que usan las
   * pruebas del orden con sus «sitios de laboratorio».
   */
  function gaceteroDeLaboratorio(conLaSegundaVia = true): Gacetero {
    const suyos = [
      { codigo: 'P.2', numero: '2', via: '1', lon: -0.9, lat: 41.6 },
      { codigo: 'P.3', numero: '3', via: '2', lon: -0.8, lat: 41.7 },
    ];
    return {
      entorno: { lonMin: -2, lonMax: 0, latMin: 41, latMax: 42 },
      viasPorNombre: new Map(
        conLaSegundaVia
          ? [
              ['uno', ['1']],
              ['uno 2 dos', ['2']],
            ]
          : [['uno', ['1']]],
      ),
      // El mismo índice, agrupado por la primera palabra: es lo que usa la
      // búsqueda por subsecuencia (nº14).
      nombresPorPrimeraPalabra: new Map(
        conLaSegundaVia ? [['uno', ['uno', 'uno 2 dos']]] : [['uno', ['uno']]],
      ),
      nombreDeVia: new Map([
        ['1', 'CALLE UNO'],
        ['2', 'CALLE UNO 2 DOS'],
      ]),
      portales: {
        total: suyos.length,
        porVia: new Map([
          ['1', [{ codigo: 'P.2', numero: '2' }]],
          ['2', [{ codigo: 'P.3', numero: '3' }]],
        ]),
        situados: suyos,
        donde: new Map(suyos.map((p) => [p.codigo, p])),
        cargadoEnMs: 0,
      },
      cargadoEnMs: 0,
    };
  }

  test('un solo corte que resuelve: casa, aunque haya otro número por medio', () => {
    // Sin la segunda vía, «C/ Uno 2 Dos 3» solo resuelve por un sitio: el 2 de
    // CALLE UNO. El «3» del final no lleva a ninguna parte y se descarta.
    const solo = gaceteroDeLaboratorio(false);
    assert.equal(portalDeLaDireccion(solo, 'C/ Uno, 2', 0, 0)?.codigo, 'P.2');
    assert.equal(portalDeLaDireccion(solo, 'C/ Uno 2 Dos 3', 0, 0)?.codigo, 'P.2');
  });

  test('⭐ DOS cortes que resuelven: no casa NINGUNO', () => {
    // La misma dirección con la segunda vía existiendo dice dos cosas: el 2 de
    // UNO y el 3 de UNO 2 DOS. No distingue, así que no se rescata nada — y se
    // ve que el `null` sale de la ambigüedad y no de no saber leerla, porque la
    // prueba de arriba la lee bien.
    assert.equal(portalDeLaDireccion(gaceteroDeLaboratorio(), 'C/ Uno 2 Dos 3', 0, 0), null);
  });
});

describe('El gacetero — el veredicto', () => {
  before(() => {
    portales = cargarPortales();
    gacetero = cargarGacetero(portales, cargarCallejero(portales));
  });

  /** El portal de «C/ La Caza, 11», que es donde debería estar la farmacia. */
  const LA_CAZA = { lon: -0.924971, lat: 41.616909 };
  /** Su vía, que tiene TRECE portales — por eso la segunda medida importa. */
  const LA_CAZA_VIA = '7045';
  /** Y donde el Ayuntamiento la publica, tal cual: 236 m al suroeste. */
  const LA_CAZA_MUNICIPAL = { lon: -0.9263253602068995, lat: 41.6150414308692 };

  test('una coordenada que está donde dice su dirección, sana', () => {
    const v = validar(gacetero, LA_CAZA.lon, LA_CAZA.lat, 'C/ La Caza, 11', true);
    assert.equal(v.estado, 'sana');
  });

  test('⭐ una coordenada a más de 50 m de su propia puerta, RESCATADA al portal', () => {
    const v = validar(gacetero, LA_CAZA_MUNICIPAL.lon, LA_CAZA_MUNICIPAL.lat, 'C/ La Caza, 11', true);
    assert.equal(v.estado, 'rescatada');
    assert.equal(v.estado === 'rescatada' && v.porQue, 'distancia');
    assert.equal(v.estado === 'rescatada' && Math.round(v.metros), 236);
    assert.equal(v.estado === 'rescatada' && v.portal.codigo, 'Portales.98467');
  });

  test('⭐ el umbral es el firmado, y ahora lo cruzan DOS medidas', () => {
    // Se camina hacia el norte desde el portal, en metros contados.
    const aLatitud = (metros: number) => LA_CAZA.lat + metros / 111132;
    const a = (metros: number) =>
      validar(gacetero, LA_CAZA.lon, aLatitud(metros), 'C/ La Caza, 11', true).estado;
    const aLaVia = (metros: number) =>
      Math.round(metrosALaVia(gacetero, LA_CAZA_VIA, LA_CAZA.lon, aLatitud(metros)));

    assert.equal(UMBRAL_DE_DESVIO_M, 50, 'el umbral no se toca');

    // 1) Por debajo del umbral contra SU NÚMERO: sana, como siempre.
    assert.equal(a(49), 'sana');

    // 2) ⚠️ Y AQUÍ ESTÁ EL CAMBIO DEL 27/08. A 51 m del portal 11 esto se
    //    rescataba, y ya no: la calle tiene trece portales y a esa altura hay
    //    otro a 21 m. El punto está en su calle; lo único que discrepa es el
    //    número, y eso no es un error que arreglar.
    assert.equal(aLaVia(51), 21);
    assert.equal(a(51), 'sana');

    // 3) Y cuando **las dos** medidas pasan de 50, sí se rescata: a 100 m del
    //    portal, la vía entera queda a 62 m.
    assert.equal(aLaVia(100), 62);
    assert.equal(a(100), 'rescatada');

    // El borde de la segunda medida, por si alguien la mueve sin decirlo: a
    // 80 m la vía está a 43 —sana— y a 100 m a 62 —rescatada—.
    assert.equal(aLaVia(80), 43);
    assert.equal(a(80), 'sana');
  });

  test('⭐ LA PARTICIÓN FIRMADA: sin cheque de distancia, la misma coordenada es sana', () => {
    // Es lo que hace que un hospital no se mueva. Misma coordenada, misma
    // dirección, mismo desvío de 236 m: con `mideLaDistancia` en false, sana.
    const v = validar(gacetero, LA_CAZA_MUNICIPAL.lon, LA_CAZA_MUNICIPAL.lat, 'C/ La Caza, 11', false);
    assert.equal(v.estado, 'sana');
  });

  test('⭐ FUERA DEL ENTORNO y sin dirección que case: INVÁLIDA, y eso es regla B', () => {
    const v = validar(gacetero, PORTUGAL.lon, PORTUGAL.lat, 'C/ Domingo Miral, s/n', true);
    assert.equal(v.estado, 'invalida');
    assert.equal(v.estado === 'invalida' && v.porQue, 'frontera');
  });

  test('⭐ FUERA DEL ENTORNO pero con dirección que casa: se rescata igual', () => {
    // La frontera no es una condena: si la dirección resuelve, el gacetero la
    // sitúa. Y se rescata AUNQUE sea un hospital, porque de la frontera no
    // libra la partición: un recinto grande tampoco puede estar en Portugal.
    for (const mide of [true, false]) {
      const v = validar(gacetero, PORTUGAL.lon, PORTUGAL.lat, 'C/ La Caza, 11', mide);
      assert.equal(v.estado, 'rescatada');
      assert.equal(v.estado === 'rescatada' && v.porQue, 'frontera');
      assert.equal(v.estado === 'rescatada' && v.portal.codigo, 'Portales.98467');
    }
  });

  test('una dirección que no casa, dentro del entorno, se queda como está', () => {
    // Sin dirección resoluble no hay contra qué medir, así que no se toca. Es
    // el caso de la mayoría: 201 de 386 casan.
    const v = validar(gacetero, LA_CAZA_MUNICIPAL.lon, LA_CAZA_MUNICIPAL.lat, 'C/ Aragón, 1', true);
    assert.equal(v.estado, 'sana');
  });
});
