/**
 * Los pasos: los umbrales de giro y el reparto de nombres.
 *
 * Los umbrales se prueban con ángulos SINTÉTICOS, y a propósito en los bordes:
 * un corte mal puesto por un grado no lo caza ninguna ruta de verdad, pero
 * escribe «gira ligeramente» donde hay una esquina de noventa grados.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarRejilla, enganchar, type Rejilla } from './proyeccion.ts';
import { calcularRuta, cuadernoPara, type Cuaderno } from './ruta.ts';
import {
  colapsarManiobras,
  comoSeLlama,
  esLaMismaCalle,
  comoSePresenta,
  NO_SON_ROMANOS,
  nucleoDe,
  PALABRAS_DE_TIPO,
  unificarElRegistro,
  CORTE_DE_NOMBRE_M,
  escribirPasos,
  fundirMicroTramos,
  giroDe,
  metrosParaLeer,
  NARRAN_SIEMPRE_POR_TIPO,
  nombreGenerico,
  UMBRAL_MICRO_M,
  type TramoFundido,
  type TramoLlano,
} from './pasos.ts';
import type { Giro } from '@desplazame/tipos';

/**
 * Si un nombre es de OSM o es el hueco dicho por su tipo. La convención de
 * estas pruebas: los que empiezan por artículo minúsculo —«la calzada», «el
 * paso de peatones»— son los innombrados, como en `POR_TIPO`.
 */
const tieneNombre = (nombre: string): boolean => !/^(la|el|las) /.test(nombre);

/** Un tramo llano de mentira, para probar la fusión con ángulos a mano. */
function tramo(
  nombre: string,
  metros: number,
  entrada: number,
  salida = entrada,
  esMunicipal = false,
): TramoLlano {
  return { nombre, conNombre: tieneNombre(nombre), esMunicipal, metros, entrada, salida };
}

/**
 * Una maniobra ya fundida, para probar el COLAPSO con ángulos a mano.
 *
 * El `giro` es el que se anuncia al entrar en ella, y por construcción es el
 * ángulo entre la salida de la anterior y la entrada de esta: al escribirlas a
 * mano hay que mantener esa coherencia o la prueba mide otra cosa.
 */
function maniobra(
  nombre: string,
  metros: number,
  giro: Giro,
  entrada: number,
  salida = entrada,
  esMunicipal = false,
): TramoFundido {
  return { nombre, conNombre: tieneNombre(nombre), esMunicipal, metros, giro, entrada, salida };
}

/** Los nombres que sobreviven a un colapso, en orden. */
const nombresDe = (ms: readonly TramoFundido[]): string[] => ms.map((m) => m.nombre);

/**
 * Los 27 valores de `highway` que trae el grafo, contados sobre
 * `app/data/grafo-visor.js`. La tabla de nombres genéricos los cubre todos.
 */
const LOS_27_HIGHWAY = [
  'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified',
  'residential', 'motorway_link', 'trunk_link', 'primary_link',
  'secondary_link', 'tertiary_link', 'busway', 'living_street', 'service',
  'track', 'path', 'cycleway', 'footway', 'steps', 'pedestrian', 'corridor',
  'construction', 'proposed', 'raceway', 'services', 'rest_area',
] as const;

describe('La fusión de micro-tramos', () => {
  test('⭐ LA SALVAGUARDA: un giro real de 90° entre dos trozos cortos NO se pierde', () => {
    // Rumbo norte 100 m · seis metros de cruce girando ya · rumbo este 100 m.
    // El de seis metros se funde, y lo que se anuncia tiene que seguir siendo
    // el giro de noventa grados que hay entre lo que se andaba y lo que se va
    // a andar. Si el ángulo se midiera contra el trozo fundido en vez de
    // saltárselo, aquí saldría «recto» y quien anda se pasaría de largo.
    const salen = fundirMicroTramos([
      tramo('Calle Norte', 100, 0, 0),
      tramo('la acera', 6, 45, 45),
      tramo('Calle Este', 100, 90, 90),
    ]);
    assert.equal(salen.length, 2);
    assert.equal(salen[1]!.nombre, 'Calle Este');
    assert.equal(salen[1]!.giro, 'derecha');
  });

  test('los noventa grados sobreviven aunque vengan repartidos en dos cruces', () => {
    const salen = fundirMicroTramos([
      tramo('Calle Norte', 100, 0, 0),
      tramo('la acera', 5, 30),
      tramo('el paso de peatones', 5, 60),
      tramo('Calle Este', 100, 90, 90),
    ]);
    assert.equal(salen.length, 2);
    assert.equal(salen[1]!.giro, 'derecha');
  });

  test('los metros NO se pierden: lo fundido se suma al que lo absorbe', () => {
    const salen = fundirMicroTramos([
      tramo('Calle Norte', 100, 0, 0),
      tramo('la acera', 6, 0),
      tramo('el paso de peatones', 9, 0),
      tramo('Calle Este', 100, 90, 90),
    ]);
    assert.equal(salen[0]!.metros, 115);
    assert.equal(salen[1]!.metros, 100);
    const total = salen.reduce((t, m) => t + m.metros, 0);
    assert.equal(total, 215, 'la suma tiene que ser la misma antes y después');
  });

  test('el ARRANQUE nunca desaparece, ni siendo el más corto de todos', () => {
    const salen = fundirMicroTramos([
      tramo('el paso de peatones', 3, 0, 0),
      tramo('Calle Larga', 400, 0, 0),
    ]);
    assert.ok(salen.length >= 1);
    assert.equal(salen[0]!.giro, 'salida');
    // Y como el largo domina, es SU nombre el que se anuncia y su rumbo el que
    // manda para el cardinal.
    assert.equal(salen[0]!.nombre, 'Calle Larga');
    assert.equal(salen[0]!.metros, 403);
  });

  test('recto + MISMO nombre desaparece; recto + nombre distinto queda «Continúa»', () => {
    const misma = fundirMicroTramos([
      tramo('Calle Larga', 200, 0, 0),
      tramo('Calle Larga', 300, 0, 0),
    ]);
    assert.equal(misma.length, 1);
    assert.equal(misma[0]!.metros, 500);

    const cambia = fundirMicroTramos([
      tramo('Calle Larga', 200, 0, 0),
      tramo('Calle Otra', 300, 0, 0),
    ]);
    assert.equal(cambia.length, 2);
    assert.equal(cambia[1]!.giro, 'recto');
  });

  test('lo que llega justo al umbral se queda: el corte es estricto', () => {
    const justo = fundirMicroTramos([
      tramo('Calle Norte', 100, 0, 0),
      tramo('la acera', UMBRAL_MICRO_M, 90, 90),
    ]);
    assert.equal(justo.length, 2, `${UMBRAL_MICRO_M} m no es micro: el corte es «menor que»`);

    const porUnPelo = fundirMicroTramos([
      tramo('Calle Norte', 100, 0, 0),
      tramo('la acera', UMBRAL_MICRO_M - 1, 90, 90),
    ]);
    assert.equal(porUnPelo.length, 1);
  });
});

describe('Lo mudo se nombra por su tipo REAL', () => {
  // Entrada nº7 de la bitácora: un carril bici se anunciaba como «la calzada».
  // [DOC Valhalla] «a generic description will be used… when a walkway,
  // cycleway or trail is unnamed» — el tipo real manda, y vive en `h`.

  test('⭐ un CARRIL BICI mudo se dice carril bici, no calzada', () => {
    assert.equal(nombreGenerico('eje-de-calzada', 'cycleway'), 'el carril bici');
  });

  test('⭐ y una CALZADA de verdad sigue diciéndose calzada', () => {
    // La corrección no puede llevarse por delante el caso que sí era cierto.
    for (const h of ['residential', 'tertiary', 'secondary', 'primary', 'unclassified']) {
      assert.equal(nombreGenerico('eje-de-calzada', h), 'la calzada', `h=${h}`);
    }
  });

  test('los otros tres genéricos del eje dicen lo que son', () => {
    assert.equal(nombreGenerico('eje-de-calzada', 'track'), 'el camino');
    assert.equal(nombreGenerico('eje-de-calzada', 'service'), 'el vial de servicio');
    assert.equal(nombreGenerico('eje-de-calzada', 'path'), 'la senda');
  });

  test('`eje-con-acera-declarada` es igual de genérico: también manda h', () => {
    // Son 2.418 aristas y el mismo problema: el perfil no dice qué es la vía.
    assert.equal(nombreGenerico('eje-con-acera-declarada', 'cycleway'), 'el carril bici');
    assert.equal(nombreGenerico('eje-con-acera-declarada', 'residential'), 'la calzada');
  });

  test('⭐ el perfil FINO manda sobre h, y no al revés', () => {
    // Una acera es una acera aunque su `h` sea `footway`, que se diría igual;
    // pero un paso de peatones también es `footway` y NO es una acera. Cuando
    // el perfil distingue más que el tipo, gana el perfil.
    assert.equal(nombreGenerico('acera', 'footway'), 'la acera');
    assert.equal(nombreGenerico('paso-de-peatones', 'footway'), 'el paso de peatones');
    assert.equal(nombreGenerico('escaleras', 'steps'), 'las escaleras');
    assert.equal(nombreGenerico('peatonal', 'footway'), 'la zona peatonal');
  });

  test('LOS 27 valores de highway del grafo tienen traducción, y ninguna vacía', () => {
    // Si el dato trajera uno más, cae en el genérico declarado y esta prueba
    // lo sigue cubriendo.
    assert.equal(LOS_27_HIGHWAY.length, 27);
    for (const h of LOS_27_HIGHWAY) {
      const dicho = nombreGenerico('eje-de-calzada', h);
      assert.ok(dicho.length > 0, `h=${h} no tiene traducción`);
      // Y encaja detrás de «hacia»: artículo y singular.
      assert.match(dicho, /^(el|la|las|los) /, `h=${h} dice «${dicho}», que no encaja tras «hacia»`);
    }
  });

  test('un highway que no existe no se calla: cae en el genérico declarado', () => {
    assert.equal(nombreGenerico('eje-de-calzada', 'lo-que-sea'), 'el camino');
    assert.equal(nombreGenerico('eje-de-calzada', undefined), 'el camino');
  });

  test('un perfil desconocido tampoco se calla', () => {
    assert.equal(nombreGenerico('perfil-que-no-existe', 'residential'), 'la calzada');
    assert.equal(nombreGenerico('perfil-que-no-existe', undefined), 'el camino');
  });
});

describe('El colapso de maniobras', () => {
  test('⭐ JUEZ 14-15: dos «ligeramente a la izquierda» por la misma calle son una', () => {
    // Copiado de la ruta de Antonio, El Coloso 2 → Padre Arrupe 1:
    //   Gira ligeramente a la izquierda hacia Paseo de Fernando el Católico · 380 m
    //   Gira ligeramente a la izquierda hacia Paseo de Fernando el Católico · 510 m
    // Es un paseo que describe una curva, y se anda una sola vez.
    const salen = colapsarManiobras([
      maniobra('Gran Vía', 610, 'salida', 0, 30),
      maniobra('Paseo de Fernando el Católico', 380, 'ligera-izquierda', 355, 350),
      maniobra('Paseo de Fernando el Católico', 510, 'ligera-izquierda', 325, 320),
    ]);
    assert.equal(salen.length, 2);
    assert.equal(salen[1]!.metros, 890, 'los metros de las dos se suman');
    // El giro que se anuncia es con el que se ENTRA en el paseo, no el de en
    // medio: entrar sí es una maniobra, seguir la curva no.
    assert.equal(salen[1]!.giro, 'ligera-izquierda');
    // Y la salida es la de la última: lo que venga después mide su giro desde
    // ahí. Es lo que mantiene el ángulo combinado sin recalcular nada.
    assert.equal(salen[1]!.salida, 320);
  });

  test('⭐ JUEZ 5-6: «continúa» + «ligeramente a la izquierda» por el mismo puente, una', () => {
    //   Continúa hacia Puente de Piedra · 39 m
    //   Gira ligeramente a la izquierda hacia Puente de Piedra · 240 m
    const salen = colapsarManiobras([
      maniobra('Calle Sobrarbe', 320, 'salida', 0, 0),
      maniobra('Puente de Piedra', 39, 'recto', 0, 0),
      maniobra('Puente de Piedra', 240, 'ligera-izquierda', 340, 340),
    ]);
    assert.deepEqual(nombresDe(salen), ['Calle Sobrarbe', 'Puente de Piedra']);
    assert.equal(salen[1]!.metros, 279);
    assert.equal(salen[1]!.giro, 'recto', 'se entra en el puente sin torcer');
  });

  test('⭐ LA SALVAGUARDA: un giro DE VERDAD en la misma calle se sigue anunciando', () => {
    // Es el defecto que el encargo nombra y que NO se imita: suprimir el giro
    // porque la calle se llama igual deja a quien anda sin la única
    // instrucción que necesitaba.
    for (const giro of ['derecha', 'izquierda', 'cerrada-derecha', 'media-vuelta'] as const) {
      const salen = colapsarManiobras([
        maniobra('Calle Larga', 200, 'salida', 0, 0),
        maniobra('Calle Larga', 200, giro, 90, 90),
      ]);
      assert.equal(salen.length, 2, `el giro «${giro}» ha desaparecido`);
      assert.equal(salen[1]!.giro, giro);
    }
  });

  test('⭐ LA INTERRUPCIÓN CORTA se absorbe entre sus dos vecinos iguales', () => {
    //   Gira ligeramente a la izquierda hacia Paseo de la Independencia · 420 m
    //   Continúa hacia la zona peatonal · 86 m
    //   Continúa hacia Paseo de la Independencia · 110 m
    const salen = colapsarManiobras([
      maniobra('Plaza de España', 66, 'salida', 0, 0),
      maniobra('Paseo de la Independencia', 420, 'ligera-izquierda', 340, 340),
      maniobra('la zona peatonal', 86, 'recto', 340, 340),
      maniobra('Paseo de la Independencia', 110, 'recto', 340, 340),
    ]);
    assert.deepEqual(nombresDe(salen), ['Plaza de España', 'Paseo de la Independencia']);
    assert.equal(salen[1]!.metros, 616, '420 + 86 + 110');
  });

  test('una interrupción LARGA no se absorbe: tiene entidad propia', () => {
    // El corte es el de OSRM, 105 m. Con 130 la zona peatonal es un tramo del
    // que merece la pena avisar, y se queda.
    const salen = colapsarManiobras([
      maniobra('Plaza de España', 66, 'salida', 0, 0),
      maniobra('Paseo de la Independencia', 420, 'ligera-izquierda', 340, 340),
      maniobra('la zona peatonal', 130, 'recto', 340, 340),
      maniobra('Paseo de la Independencia', 110, 'recto', 340, 340),
    ]);
    assert.equal(salen.length, 4);
    assert.ok(130 > CORTE_DE_NOMBRE_M, 'la prueba tiene que estar por encima del corte');
  });

  test('lo que llega justo al corte se queda: el umbral es estricto', () => {
    const justo = (metros: number) =>
      colapsarManiobras([
        maniobra('A', 400, 'salida', 0, 0),
        maniobra('la acera', metros, 'recto', 0, 0),
        maniobra('A', 200, 'recto', 0, 0),
      ]).length;
    assert.equal(justo(CORTE_DE_NOMBRE_M - 1), 1, 'por debajo del corte se absorbe');
    assert.equal(justo(CORTE_DE_NOMBRE_M), 3, 'justo en el corte, no');
  });

  test('⭐ dos suaves que SUMAN un giro de verdad no se colapsan', () => {
    // Cada uno es «ligeramente a la derecha» —30° y otros 30°—, pero de punta
    // a punta son 60°, que es una derecha. Si se mirara solo cada giro por
    // separado, colapsar se comería la esquina.
    const salen = colapsarManiobras([
      maniobra('A', 400, 'salida', 0, 0),
      maniobra('la acera', 50, 'ligera-derecha', 30, 30),
      maniobra('A', 200, 'ligera-derecha', 60, 60),
    ]);
    assert.equal(giroDe(0, 60), 'derecha', 'el combinado es un giro de verdad');
    assert.equal(salen.length, 3, 'se ha colapsado un giro de 60°');
  });

  test('⭐ sin NOMBRE no hay «misma calle»: dos calzadas anónimas no se juntan', () => {
    // La regla de OSRM, literal: vacío contra vacío es false. Dos tramos que
    // OSM no nombró se dicen los dos «la calzada» y no son la misma calle —
    // juntarlos por el nombre se comería el giro que hay entre ellos.
    const salen = colapsarManiobras([
      maniobra('la calzada', 86, 'salida', 0, 0),
      maniobra('la calzada', 220, 'ligera-izquierda', 340, 340),
    ]);
    assert.equal(salen.length, 2);
    assert.equal(salen[1]!.giro, 'ligera-izquierda');
  });

  test('el ARRANQUE sigue siendo el arranque aunque crezca', () => {
    const salen = colapsarManiobras([
      maniobra('Calle Larga', 100, 'salida', 0, 0),
      maniobra('Calle Larga', 300, 'recto', 0, 0),
    ]);
    assert.equal(salen.length, 1);
    assert.equal(salen[0]!.giro, 'salida', 'el arranque no puede dejar de serlo');
    assert.equal(salen[0]!.metros, 400);
    assert.equal(salen[0]!.entrada, 0, 'y conserva su rumbo: de ahí sale el cardinal');
  });

  test('se repite hasta el final: una absorción destapa la siguiente', () => {
    // Primera vuelta: los dos trozos de Calle Corta se unen entre sí (regla A)
    // y quedan como UNA interrupción de 70 m — pero la pasada ya había pasado
    // por ahí. La segunda vuelta la absorbe. Con una sola pasada saldrían tres.
    //
    // La calle de en medio tiene NOMBRE a propósito: sin nombre, la regla A no
    // uniría sus dos trozos y este caso no se daría.
    const salen = colapsarManiobras([
      maniobra('Avenida Ancha', 300, 'salida', 0, 0),
      maniobra('Calle Corta', 40, 'recto', 0, 0),
      maniobra('Calle Corta', 30, 'recto', 0, 0),
      maniobra('Avenida Ancha', 200, 'recto', 0, 0),
    ]);
    assert.equal(salen.length, 1);
    assert.equal(salen[0]!.metros, 570);
  });

  test('los metros NO se pierden nunca, colapse lo que colapse', () => {
    const entrada = [
      maniobra('A', 300, 'salida', 0, 0),
      maniobra('A', 120, 'ligera-derecha', 20, 20),
      maniobra('la acera', 60, 'recto', 20, 20),
      maniobra('A', 200, 'recto', 20, 20),
      maniobra('B', 400, 'derecha', 110, 110),
    ];
    const antes = entrada.reduce((t, m) => t + m.metros, 0);
    const despues = colapsarManiobras(entrada).reduce((t, m) => t + m.metros, 0);
    assert.equal(despues, antes);
  });
});

describe('Los umbrales de giro', () => {
  /**
   * [DOC Valhalla] `valhalla/baldr/turn.cc`. Cada pareja es el ÚLTIMO grado de
   * un tramo y el PRIMERO del siguiente: si un corte se mueve, uno de los dos
   * cambia de clase y esta tabla se pone roja.
   */
  const BORDES: ReadonlyArray<readonly [number, string]> = [
    [0, 'recto'],
    [10, 'recto'],
    [11, 'ligera-derecha'],
    [44, 'ligera-derecha'],
    [45, 'derecha'],
    [135, 'derecha'],
    [136, 'cerrada-derecha'],
    [159, 'cerrada-derecha'],
    [160, 'media-vuelta'],
    [200, 'media-vuelta'],
    [201, 'cerrada-izquierda'],
    [224, 'cerrada-izquierda'],
    [225, 'izquierda'],
    [315, 'izquierda'],
    [316, 'ligera-izquierda'],
    [349, 'ligera-izquierda'],
    [350, 'recto'],
    [359, 'recto'],
  ];

  test('los nueve cortes están donde dice turn.cc, grado a grado', () => {
    for (const [grados, esperado] of BORDES) {
      assert.equal(giroDe(0, grados), esperado, `${grados}° tenía que ser «${esperado}»`);
    }
  });

  test('el ángulo se mide RELATIVO, no absoluto', () => {
    // Viniendo del sur y saliendo al este se gira a la izquierda; viniendo del
    // norte y saliendo al este, a la derecha. Los mismos 90° de diferencia.
    assert.equal(giroDe(0, 90), 'derecha');
    assert.equal(giroDe(90, 180), 'derecha');
    assert.equal(giroDe(180, 90), 'izquierda');
    // Y cruzando el 0 sin romperse. OJO al escribir estos: de rumbo 350 a
    // rumbo 10 hay VEINTE grados a la derecha, no cero — la primera versión de
    // esta prueba esperaba «recto» y el rojo era de la prueba, no del código.
    assert.equal(giroDe(355, 5), 'recto');
    assert.equal(giroDe(5, 355), 'recto');
    assert.equal(giroDe(350, 10), 'ligera-derecha');
    assert.equal(giroDe(10, 350), 'ligera-izquierda');
    assert.equal(giroDe(340, 60), 'derecha');
  });
});

describe('El redondeo de los metros', () => {
  test('al metro por debajo de 100, a la decena por encima', () => {
    assert.equal(metrosParaLeer(0), 0);
    assert.equal(metrosParaLeer(8.4), 8);
    assert.equal(metrosParaLeer(99.4), 99);
    assert.equal(metrosParaLeer(104), 100);
    assert.equal(metrosParaLeer(447), 450);
    assert.equal(metrosParaLeer(3465), 3470);
  });
});

describe('⭐ NIVEL 3 — el nombre municipal heredado por vecindad', () => {
  /** Una red de mentira con un solo way, para preguntar cómo se llama. */
  const redCon = (
    osm: string | null,
    heredado: string | null,
    highway: string,
  ): Parameters<typeof comoSeLlama>[0] => ({
    nombreDeWay: new Map(osm ? [[1, osm]] : []),
    nombreHeredado: new Map(heredado ? [[1, heredado]] : []),
    tipoDeWay: new Map([[1, highway]]),
  });

  test('con nombre de OSM, la herencia NO pinta nada: manda el way', () => {
    // OSM es de quien es la red. Si el way dice cómo se llama, se le cree.
    const red = redCon('Avenida de Navarra', 'CALLE OTRA COSA', 'residential');
    assert.deepEqual(comoSeLlama(red, 1, 'eje-de-calzada'), {
      nombre: 'Avenida de Navarra',
      conNombre: true,
      esMunicipal: false,
    });
  });

  test('sin nombre de OSM pero con herencia, se dice el MUNICIPAL', () => {
    // Es la ruta de Antonio: 1.270 m de carril bici que son la avenida.
    const red = redCon(null, 'AVENIDA ACADEMIA GENERAL MILITAR', 'cycleway');
    assert.deepEqual(comoSeLlama(red, 1, 'eje-de-calzada'), {
      nombre: 'AVENIDA ACADEMIA GENERAL MILITAR',
      conNombre: true,
      // ⭐ Y viene del registro MUNICIPAL, que es lo que le da preferencia
      // cuando se junta con la misma calle escrita por OSM.
      esMunicipal: true,
    });
  });

  test('lo heredado CUENTA como nombre: puede colapsar contra otro tramo igual', () => {
    // `conNombre` es el `has_name_or_ref` de OSRM. Un nombre municipal es un
    // nombre: si no lo fuera, dos tramos heredados de la misma avenida no se
    // fundirían y la ruta diría dos veces lo mismo.
    assert.equal(comoSeLlama(redCon(null, 'AVENIDA MADRID', 'footway'), 1, 'acera').conNombre, true);
  });

  test('sin nada que heredar, sigue mandando el tipo REAL', () => {
    const red = redCon(null, null, 'cycleway');
    assert.deepEqual(comoSeLlama(red, 1, 'eje-de-calzada'), {
      nombre: 'el carril bici',
      conNombre: false,
      esMunicipal: false,
    });
  });

  test('⭐ un PASO DE PEATONES no hereda jamás, aunque el cruce le diera nombre', () => {
    // Una cebra CRUZA la calle: no pertenece a ella. Decir «continúa por
    // Avenida de Navarra» mientras se cruza Navarra es peor que no decir nada.
    const red = redCon(null, 'AVENIDA DE NAVARRA', 'footway');
    assert.deepEqual(comoSeLlama(red, 1, 'paso-de-peatones'), {
      nombre: 'el paso de peatones',
      conNombre: false,
      esMunicipal: false,
    });
  });

  test('⭐ unas ESCALERAS tampoco: lo que importa es que son escaleras', () => {
    const red = redCon(null, 'CALLE MAYOR', 'steps');
    assert.deepEqual(comoSeLlama(red, 1, 'escaleras'), {
      nombre: 'las escaleras',
      conNombre: false,
      esMunicipal: false,
    });
  });

  test('y son esos dos perfiles, ni uno más', () => {
    // Si mañana alguien mete «acera» en la lista, la mitad de la herencia se
    // apaga sin que ninguna otra prueba se entere.
    assert.deepEqual([...NARRAN_SIEMPRE_POR_TIPO].sort(), ['escaleras', 'paso-de-peatones']);
  });
});

describe('⭐ EL NÚCLEO — dos grafías de la misma calle son la misma calle', () => {
  test('los ejemplos límite del encargo', () => {
    // Del censo municipal, tal y como vienen.
    assert.equal(nucleoDe('PLAZA EL PROGRESO'), 'PROGRESO');
    // La palabra de tipo se quita TODAS las veces que encabeza: el municipal
    // trae 21 nombres que la repiten, y si solo se quitara una, la de OSM no
    // casaría con la suya nunca.
    assert.equal(nucleoDe('CAMINO CAMINO DE LAS TORRES'), 'TORRES');
    assert.equal(nucleoDe('Camino de las Torres'), 'TORRES');
    assert.equal(nucleoDe('PATIO PATIO DE LA LICORERA'), 'LICORERA');
  });

  test('la doble grafía que motivó todo esto: municipal y OSM dan el mismo núcleo', () => {
    for (const [municipal, osm] of [
      ['AVENIDA SAN JUAN DE LA PEÑA', 'Avenida de San Juan de la Peña'],
      ['AVENIDA SAN JOSÉ', 'Avenida de San José'],
      ['PASEO CUÉLLAR', 'Paseo Cuéllar'],
      ['ANDADOR VEINTE DE DICIEMBRE', 'Andador del Veinte de Diciembre'],
      ['AVENIDA MADRID', 'Avenida de Madrid'],
      ['CALLE SAN JUAN BAUTISTA DE LA SALLE', 'Calle de San Juan Bautista de la Salle'],
    ]) {
      assert.equal(nucleoDe(municipal!), nucleoDe(osm!), `${municipal} ≠ ${osm}`);
      assert.ok(nucleoDe(municipal!).length > 0);
    }
  });

  test('los espacios dobles del WFS dejan de estorbar', () => {
    // 20 de las 3.358 vías municipales los traen (§ 1.15). En pantalla no se
    // ven —el HTML los colapsa— pero al comparar cadenas sí contaban.
    assert.equal(nucleoDe('CALLE JUAN RAMÓN  JIMÉNEZ'), nucleoDe('Calle de Juan Ramón Jiménez'));
    assert.equal(nucleoDe('PLAZA EL  PROGRESO'), nucleoDe('PLAZA EL PROGRESO'));
  });

  test('⭐ dos calles con el mismo nombre y distinto tipo SÍ casan, y hay que saberlo', () => {
    // Es consecuencia directa de quitar la palabra de tipo, que es la doctrina
    // (OSRM: un cambio de prefijo «Avenida» no es un cambio de nombre). Aquí
    // queda fijado para que nadie lo descubra por sorpresa en una ruta.
    assert.equal(nucleoDe('RONDA HISPANIDAD'), nucleoDe('VÍA HISPANIDAD'));
  });

  test('un núcleo VACÍO no casa con nada, ni consigo mismo', () => {
    // Un nombre que es solo tipo y partículas se queda sin núcleo. No se
    // inventa nada: se declara que no casa, como el vacío de OSRM.
    assert.equal(nucleoDe('CALLE DE LA'), '');
    assert.equal(nucleoDe('   '), '');
    assert.equal(esLaMismaCalle(conNombre('CALLE DE LA'), conNombre('CALLE DE LA')), false);
  });

  test('la lista de palabras de tipo es la del censo municipal, las 30', () => {
    // Sale del dato (§ 1.15), no de la cabeza: una por cada `tipo_via`, y el
    // cruce da exactamente una palabra por tipo.
    assert.equal(PALABRAS_DE_TIPO.size, 30);
    for (const palabra of ['CALLE', 'AVENIDA', 'PASEO', 'CAMINO', 'PLAZA', 'RONDA', 'VIA']) {
      assert.ok(PALABRAS_DE_TIPO.has(palabra), `falta ${palabra}`);
    }
  });

  /** Una denominación con nombre de verdad, para preguntar por la equivalencia. */
  const conNombre = (nombre: string, esMunicipal = false) => ({
    nombre,
    conNombre: true,
    esMunicipal,
  });

  test('el vacío sigue sin casar: dos genéricos NO son la misma calle', () => {
    // La regla de OSRM que ya estaba: `// make sure empty is not involved`.
    // El núcleo no la deroga — «la acera» y «la acera» siguen sin casar.
    const generico = { nombre: 'la acera', conNombre: false, esMunicipal: false };
    assert.equal(esLaMismaCalle(generico, generico), false);
    assert.equal(esLaMismaCalle(conNombre('CALLE MAYOR'), generico), false);
  });

  test('calles distintas del mismo tipo siguen siendo distintas', () => {
    assert.equal(esLaMismaCalle(conNombre('CALLE SOBRARBE'), conNombre('Calle de Don Jaime I')), false);
    assert.equal(esLaMismaCalle(conNombre('CALLE BARCELONA ---CST'), conNombre('Calle Barcelona')), false);
  });
});

describe('⭐ EL CANÓNICO — cuando las dos grafías se juntan, manda la municipal', () => {
  test('la fusión de micro-tramos deja el nombre municipal', () => {
    // Un trozo de OSM de 10 m pegado a la avenida heredada: se funde, y lo que
    // queda escrito es el nombre que el usuario leyó en el formulario.
    const fundidos = fundirMicroTramos([
      tramo('AVENIDA SAN JUAN DE LA PEÑA', 760, 0, 0, true),
      tramo('Avenida de San Juan de la Peña', 10, 0),
    ]);
    assert.deepEqual(nombresDe(fundidos), ['AVENIDA SAN JUAN DE LA PEÑA']);
    assert.equal(fundidos[0]!.metros, 770);
  });

  test('⭐ y también cuando el trozo de OSM es el LARGO', () => {
    // La regla del dominante decía «manda el que más mide». Con dos grafías de
    // la misma calle eso daría a veces una y a veces la otra en la misma ruta.
    // Entre equivalentes manda el registro, no los metros.
    const colapsadas = colapsarManiobras([
      maniobra('AVENIDA SAN JUAN DE LA PEÑA', 760, 'salida', 0, 0, true),
      maniobra('Avenida de San Juan de la Peña', 1040, 'recto', 0),
    ]);
    assert.deepEqual(nombresDe(colapsadas), ['AVENIDA SAN JUAN DE LA PEÑA']);
    assert.equal(colapsadas[0]!.metros, 1800);
  });

  test('⭐ UN SOLO REGISTRO POR CALLE, aunque los dos pasos tengan que existir', () => {
    // Aquí NO se funde nada y es correcto que no se funda: entre los dos pasos
    // hay un giro de verdad, y un giro de verdad en la misma calle se anuncia
    // —es la salvaguarda que el encargo del colapso dejó viva—.
    //
    // Lo que no puede ser es que el mismo paseo se escriba de dos maneras en
    // la misma lista. Medido antes de esta pasada: pasaba en el 23,0 % de las
    // rutas, y 97 de los 102 casos eran exactamente este, con giro en medio.
    const unificadas = unificarElRegistro([
      maniobra('PASEO CUÉLLAR', 360, 'salida', 0, 0, true),
      maniobra('Calle de Prueba', 200, 'derecha', 90, 90),
      maniobra('Paseo Cuéllar', 180, 'izquierda', 0, 0),
    ]);
    assert.deepEqual(nombresDe(unificadas), [
      'PASEO CUÉLLAR',
      'Calle de Prueba',
      'PASEO CUÉLLAR',
    ]);
    // Y son TRES pasos: unificar el registro no funde nada.
    assert.equal(unificadas.length, 3);
  });

  test('sin municipal en la ruta, el nombre de OSM se queda como está', () => {
    const unificadas = unificarElRegistro([
      maniobra('Paseo Cuéllar', 360, 'salida', 0),
      maniobra('Paseo de Sagasta', 200, 'derecha', 90),
    ]);
    assert.deepEqual(nombresDe(unificadas), ['Paseo Cuéllar', 'Paseo de Sagasta']);
  });

  test('un genérico no se renombra nunca, aunque su texto casara', () => {
    const unificadas = unificarElRegistro([
      maniobra('CALLE ACERA', 360, 'salida', 0, 0, true),
      maniobra('la acera', 200, 'derecha', 90),
    ]);
    assert.deepEqual(nombresDe(unificadas), ['CALLE ACERA', 'la acera']);
  });

  test('un nombre que solo tiene OSM NO se renombra: se queda como está', () => {
    const colapsadas = colapsarManiobras([
      maniobra('Calle de Don Jaime I', 610, 'salida', 0),
      maniobra('Calle de Don Jaime I', 100, 'recto', 0),
    ]);
    assert.deepEqual(nombresDe(colapsadas), ['Calle de Don Jaime I']);
  });
});

describe('⭐ LA ABSORCIÓN ANCHA — el segmento corto se come aunque no case con nadie', () => {
  test('el carril bici de 82 m entre dos avenidas desaparece dentro de la primera', () => {
    // Es el paso 3 de EL COLOSO 2 → VALLE DE ZURIZA 1. Mide menos que el corte
    // de OSRM, no tuerce, y separa dos avenidas que no son la misma: la regla
    // estrecha no lo tocaba porque exigía que los dos vecinos casaran.
    const colapsadas = colapsarManiobras([
      maniobra('AVENIDA ACADEMIA GENERAL MILITAR', 430, 'salida', 90, 90, true),
      maniobra('el carril bici', 82, 'recto', 90),
      maniobra('AVENIDA SAN JUAN DE LA PEÑA', 1660, 'recto', 90, 90, true),
    ]);
    assert.deepEqual(nombresDe(colapsadas), [
      'AVENIDA ACADEMIA GENERAL MILITAR',
      'AVENIDA SAN JUAN DE LA PEÑA',
    ]);
    assert.equal(colapsadas[0]!.metros, 512);
    assert.equal(colapsadas[1]!.metros, 1660);
  });

  test(`por encima de ${CORTE_DE_NOMBRE_M} m ya no es una interrupción: se queda`, () => {
    const colapsadas = colapsarManiobras([
      maniobra('CALLE UNA', 430, 'salida', 90),
      maniobra('CALLE ENMEDIO', CORTE_DE_NOMBRE_M + 1, 'recto', 90),
      maniobra('CALLE OTRA', 400, 'recto', 90),
    ]);
    assert.equal(colapsadas.length, 3);
  });

  test('⭐ SALVAGUARDA: un giro de verdad al entrar en el corto NO se come', () => {
    // Si para meterte en los 40 m hay que girar a la derecha, esos 40 m son
    // una maniobra y se anuncian. Da igual lo poco que midan.
    const colapsadas = colapsarManiobras([
      maniobra('CALLE UNA', 430, 'salida', 0),
      maniobra('CALLE CORTA', 40, 'derecha', 90),
      maniobra('CALLE OTRA', 400, 'derecha', 180),
    ]);
    assert.equal(colapsadas.length, 3);
  });

  test('⭐ SALVAGUARDA: dos suaves del mismo signo que suman un giro tampoco', () => {
    // 30° + 30° son 60°, que es una derecha de verdad. El ángulo combinado a
    // través de lo que se suprime es lo único que lo caza.
    const colapsadas = colapsarManiobras([
      maniobra('CALLE UNA', 430, 'salida', 0, 0),
      maniobra('CALLE CORTA', 40, 'ligera-derecha', 30, 30),
      maniobra('CALLE OTRA', 400, 'ligera-derecha', 60, 60),
    ]);
    assert.equal(colapsadas.length, 3);
  });

  test('el ÚLTIMO no se absorbe: sin nadie detrás no hay ángulo que comprobar', () => {
    const colapsadas = colapsarManiobras([
      maniobra('CALLE UNA', 430, 'salida', 90),
      maniobra('CALLE CORTA', 40, 'recto', 90),
    ]);
    assert.equal(colapsadas.length, 2);
  });

  test('el ARRANQUE nunca desaparece, aunque sea corto y suave', () => {
    const colapsadas = colapsarManiobras([
      maniobra('CALLE CORTA', 12, 'salida', 90),
      maniobra('CALLE UNA', 430, 'recto', 90),
      maniobra('CALLE OTRA', 400, 'recto', 90),
    ]);
    assert.equal(colapsadas[0]!.giro, 'salida');
    assert.equal(colapsadas[0]!.nombre, 'CALLE CORTA');
  });
});

describe('⭐ LA PRESENTACIÓN — el nombre administrativo se lee como se escribe', () => {
  test('la mayúscula administrativa baja a caso mixto', () => {
    assert.equal(comoSePresenta('AVENIDA SAN JUAN DE LA PEÑA', true), 'Avenida San Juan de la Peña');
    assert.equal(comoSePresenta('CALLE GONZALO CALAMITA', true), 'Calle Gonzalo Calamita');
    assert.equal(comoSePresenta('CALLE MARQUÉS DE LA CADENA', true), 'Calle Marqués de la Cadena');
    assert.equal(comoSePresenta('PASEO ISABEL LA CATÓLICA', true), 'Paseo Isabel la Católica');
  });

  test('las partículas van en minúscula, salvo si abren el nombre', () => {
    // [DOC IGN, Directrices toponímicas] las palabras significativas en
    // mayúscula inicial y las partículas en minúscula. La lista es la misma
    // que usa el núcleo, y eso no es casualidad: son las mismas partículas.
    assert.equal(comoSePresenta('AVENIDA DE LOS PIRINEOS', true), 'Avenida de los Pirineos');
    assert.equal(comoSePresenta('PASEO GRAN VÍA DE DON SANTIAGO RAMÓN Y CAJAL', true),
      'Paseo Gran Vía de Don Santiago Ramón y Cajal');
    assert.equal(comoSePresenta('LA ALMOZARA', true), 'La Almozara');
    assert.equal(comoSePresenta('EL COLOSO', true), 'El Coloso');
  });

  test('⭐ los ROMANOS se quedan en mayúsculas', () => {
    // [DOC RAE] los números romanos se escriben siempre en mayúsculas.
    // Los doce que aparecen de verdad en el censo municipal, medidos.
    assert.equal(comoSePresenta('CALLE ALFONSO I', true), 'Calle Alfonso I');
    assert.equal(comoSePresenta('CALLE ALFONSO II DE ARAGÓN', true), 'Calle Alfonso II de Aragón');
    assert.equal(comoSePresenta('CALLE ALFONSO III DE ARAGÓN', true), 'Calle Alfonso III de Aragón');
    assert.equal(comoSePresenta('CALLE RAMÓN BERENGUER IV', true), 'Calle Ramón Berenguer IV');
    assert.equal(comoSePresenta('CALLE ALFONSO V DE ARAGÓN', true), 'Calle Alfonso V de Aragón');
    assert.equal(comoSePresenta('CALLE ADRIANO VI', true), 'Calle Adriano VI');
    assert.equal(comoSePresenta('CALLE ALFONSO X EL SABIO', true), 'Calle Alfonso X el Sabio');
    assert.equal(comoSePresenta('GLORIETA PIO XII', true), 'Glorieta Pio XII');
    assert.equal(comoSePresenta('CALLE LEÓN XIII', true), 'Calle León XIII');
    assert.equal(comoSePresenta('CALLE JUAN XXII', true), 'Calle Juan XXII');
    assert.equal(comoSePresenta('CALLE JUAN XXIII', true), 'Calle Juan XXIII');
  });

  test('⭐ un romano PEGADO A UN SIGNO sigue siendo un romano — bitácora nº8', () => {
    // El banco de arriba usa romanos rodeados de espacios, y por eso daba
    // verde mientras `GRUPO ALFÉREZ ROJAS (GP-F II)` salía «(Gp-f Ii)». El
    // dato real pega los signos a las palabras; la prueba también tiene que
    // hacerlo.
    assert.equal(comoSePresenta('GRUPO ALFÉREZ ROJAS (GP-F II)', true), 'Grupo Alférez Rojas (Gp-F II)');
    assert.equal(comoSePresenta('CALLE MALPICA (II)', true), 'Calle Malpica (II)');
    assert.equal(comoSePresenta('CALLE FELIPE V, EL REY', true), 'Calle Felipe V, el Rey');
  });

  test('⭐ el PUNTO separa palabras dentro del token, como el espacio', () => {
    // El censo escribe `NTRA.SRA.DEL AGUA` sin espacios, y tratándolo como una
    // sola palabra salía «Ntra.sra.del Agua».
    assert.equal(comoSePresenta('CALLE NTRA.SRA.DEL AGUA', true), 'Calle Ntra.Sra.del Agua');
    assert.equal(comoSePresenta('CALLE SOR M.JESÚS ÁGREDA', true), 'Calle Sor M.Jesús Ágreda');
  });

  test('⭐ y una palabra que PARECE romana no lo es: la regex casa el token ENTERO', () => {
    // Es la trampa del encargo. `CIVIL` empieza por C-I-V pero no valida
    // entero, y por eso no hace falta excepción: la ancla la rechaza sola.
    assert.equal(comoSePresenta('CALLE GUARDIA CIVIL', true), 'Calle Guardia Civil');
    assert.equal(comoSePresenta('CALLE MIL VIENTOS', true), 'Calle Mil Vientos');
    assert.equal(comoSePresenta('CALLE EL CID', true), 'Calle el Cid');
    assert.equal(comoSePresenta('CALLE LA VID', true), 'Calle la Vid');
  });

  test('⭐ LA COLISIÓN DECLARADA: «MI» valida como romano y NUNCA lo es', () => {
    // Medido sobre los 3.358 nombres del censo: de los tokens que la regex
    // acepta, uno solo no es un número — `MI`, en CALLE MI TÍO y en CALLE
    // TODO SOBRE MI MADRE. Como romano vale 1001, que no numera a ningún rey.
    assert.deepEqual([...NO_SON_ROMANOS], ['MI']);
    assert.equal(comoSePresenta('CALLE MI TÍO', true), 'Calle Mi Tío');
    assert.equal(comoSePresenta('CALLE TODO SOBRE MI MADRE', true), 'Calle Todo Sobre Mi Madre');
  });

  test('lo que no es una palabra se deja donde está', () => {
    // El marcador de núcleo rural es un código del censo, no una palabra.
    assert.equal(comoSePresenta('CALLE BARCELONA ---CST', true), 'Calle Barcelona ---CST');
    // Y el número del portal, y los paréntesis que el dato trae dentro.
    assert.equal(comoSePresenta('CALLE ALFONSO I 10', true), 'Calle Alfonso I 10');
    assert.equal(comoSePresenta('CALLE BURGOS [CASETAS] 4', true), 'Calle Burgos [Casetas] 4');
    assert.equal(comoSePresenta('CALLE MALPICA II (Q)', true), 'Calle Malpica II (Q)');
  });

  test('lo que el dato trae ABREVIADO se queda abreviado', () => {
    // [DOC OSM ES] «sin abreviaturas»: abreviar es decisión del software y
    // aquí no se toma. Pero DESabreviar tampoco: el censo escribe `NTRA. SRA.`
    // y desplegarlo sería inventarse el dato, no presentarlo.
    assert.equal(comoSePresenta('CALLE NTRA. SRA. DEL PILAR', true), 'Calle Ntra. Sra. del Pilar');
  });

  test('un nombre de OSM que ya viene en caso mixto no se toca', () => {
    for (const nombre of [
      'Calle de Don Jaime I',
      'Paseo de Fernando el Católico',
      'Gran Vía de Santiago Ramón y Cajal',
      'Avenida de San Juan de la Peña',
    ]) {
      assert.equal(comoSePresenta(nombre, false), nombre);
    }
  });

  test('un genérico tampoco: ya está escrito como se lee', () => {
    assert.equal(comoSePresenta('el carril bici', false), 'el carril bici');
    assert.equal(comoSePresenta('la zona peatonal', false), 'la zona peatonal');
  });

  test('un municipal que NO viene en mayúsculas plenas se recompone igual', () => {
    // Es la única de las 3.359: ANDADOR ABOGACíA TURNO DE OFICIO, con la
    // vocal acentuada en minúscula (§ 1.3, suciedad del origen declarada).
    // Recomponer la deja legible sin tocar el fichero.
    assert.equal(
      comoSePresenta('ANDADOR ABOGACíA TURNO DE OFICIO', true),
      'Andador Abogacía Turno de Oficio',
    );
  });

  test('⭐ presentar NO cambia el núcleo: las comparaciones siguen intactas', () => {
    // La costura que importa. Si presentar afectara al núcleo, la fusión de
    // dos grafías dejaría de funcionar en cuanto el texto cambiara de caja.
    for (const nombre of [
      'AVENIDA SAN JUAN DE LA PEÑA',
      'CALLE ALFONSO I',
      'PASEO ISABEL LA CATÓLICA',
      'CALLE BARCELONA ---CST',
      'DISEMINADO DISEMINADO CASETAS',
    ]) {
      assert.equal(nucleoDe(comoSePresenta(nombre, true)), nucleoDe(nombre), nombre);
    }
  });
});

describe('Los pasos de una ruta real', () => {
  let red: RedEnMemoria;
  let rejilla: Rejilla;
  let portales: PortalesEnMemoria;
  let cuaderno: Cuaderno;

  /** CALLE PEDRO LAPUYADE 3 → CAMINO DE EN MEDIO 120. */
  const ORIGEN = 'Portales.84476';
  const DESTINO = 'Portales.82922';

  function pasosDe(a: string, b: string) {
    const uno = portales.donde.get(a)!;
    const otro = portales.donde.get(b)!;
    const ea = enganchar(red, rejilla, uno.lon, uno.lat)!;
    const eb = enganchar(red, rejilla, otro.lon, otro.lat)!;
    const ruta = calcularRuta(red, cuaderno, ea, [uno.lon, uno.lat], eb, [otro.lon, otro.lat])!;
    return escribirPasos(red, ruta, 'CALLE DE PRUEBA 1', 'CALLE DE LLEGADA 2', [
      otro.lon,
      otro.lat,
    ]);
  }

  before(() => {
    red = cargarRed(cargarGrafo());
    rejilla = cargarRejilla(red);
    portales = cargarPortales();
    cuaderno = cuadernoPara(red);
  });

  test('empieza con el cardinal y acaba diciendo de qué lado queda la puerta', () => {
    const pasos = pasosDe(ORIGEN, DESTINO);
    assert.equal(pasos[0]!.giro, 'salida');
    assert.match(pasos[0]!.texto, /dirígete hacia el (norte|noreste|este|sureste|sur|suroeste|oeste|noroeste)/);
    const ultimo = pasos[pasos.length - 1]!;
    assert.equal(ultimo.giro, 'llegada');
    assert.match(ultimo.texto, /está a la (derecha|izquierda)$/);
    assert.equal(ultimo.metros, 0);
  });

  test('LOS EXTREMOS hablan municipal: el nombre del formulario, no el de OSM', () => {
    const pasos = pasosDe(ORIGEN, DESTINO);
    // Se le pasaron nombres municipales inventados, y son los que salen: si el
    // motor cogiera el nombre de OSM para los extremos, aquí saldría «Calle de
    // Pedro Lapuyade» y no lo que eligió el usuario. Es el 19,4% discordante.
    // ⚠️ AJUSTE (presentación). Los extremos siguen siendo los municipales
    // —es lo que esta prueba fija— pero ya no se escriben en mayúscula
    // administrativa: se recomponen a caso mixto como todo lo demás.
    assert.match(pasos[0]!.texto, /^Sal de Calle de Prueba 1 /);
    assert.match(pasos[pasos.length - 1]!.texto, /^Calle de Llegada 2 /);
  });

  /**
   * ⚠️ ESTA ES LA PRUEBA QUE MINTIÓ. Entrada nº7 de la bitácora.
   *
   * Antes traía la lista de palabras genéricas **escrita a mano**, y «la
   * calzada» estaba en ella. Así que daba verde mientras a un peatón se le
   * decía que anduviera por la calzada de una avenida yendo por un carril
   * bici: la lista decía qué se PUEDE decir, no cuándo es cierto cada cosa.
   *
   * Dos cambios, y los dos salen de la ley de esa entrada:
   *
   * 1. **La lista ya no se escribe aquí**: se construye llamando a
   *    `nombreGenerico` sobre los perfiles y los tipos que existen. Si mañana
   *    entra una palabra nueva, esta prueba la acepta sola; y si alguien borra
   *    una, deja de aceptarla sola. No puede volver a desincronizarse.
   * 2. **Y se ata la palabra a la condición**: esta ruta pasa por `service` y
   *    por `track`, así que TIENE que decir «el vial de servicio» y «el
   *    camino» — y NO puede decir «la calzada», porque no pisa ninguna calzada
   *    muda. Eso es lo que la versión vieja no sabía comprobar.
   */
  test('EL INTERIOR habla OSM cuando hay nombre, y por TIPO REAL cuando no', () => {
    const pasos = pasosDe(ORIGEN, DESTINO);
    const medio = pasos.slice(1, -1);

    // El vocabulario genérico, tomado de las tablas de verdad y no copiado.
    const PERFILES = [
      'acera', 'paso-de-peatones', 'escaleras', 'peatonal',
      'eje-de-calzada', 'eje-con-acera-declarada',
    ];
    const genericas = new Set(
      PERFILES.flatMap((p) => LOS_27_HIGHWAY.map((h) => nombreGenerico(p, h))),
    );

    const haciaDonde = (t: string) => t.replace(/^.*? hacia /, '');
    const conNombre = medio.filter((p) => !genericas.has(haciaDonde(p.texto)));
    const porTipo = medio.filter((p) => genericas.has(haciaDonde(p.texto)));

    assert.ok(conNombre.length > 0, 'ninguna calle con nombre: el cruce no está entrando');
    assert.ok(porTipo.length > 0, 'ninguna por tipo: el 60% sin nombre no se está tratando');
    assert.equal(conNombre.length + porTipo.length, medio.length);

    // Y la parte que ata palabra ↔ condición, que es la que faltaba.
    const textos = medio.map((p) => p.texto);
    assert.ok(
      textos.some((t) => /hacia el vial de servicio$/.test(t)),
      'esta ruta pisa `service` y no lo dice',
    );
    assert.ok(
      textos.some((t) => /hacia el camino$/.test(t)),
      'esta ruta pisa `track` y no lo dice',
    );
    assert.equal(
      textos.filter((t) => /hacia la calzada$/.test(t)).length,
      0,
      'dice «la calzada» y esta ruta no pisa ninguna calzada muda',
    );
  });

  test('no encadena «continúa» sobre la misma calle: eso se une en un tramo', () => {
    // Sin unir los tramos del mismo nombre salían trece pasos «Continúa hacia
    // Calle de Pedro Lapuyade» de 8, 87 y 210 m. Medido: 50 pasos entonces,
    // 34 ahora.
    //
    // Lo que se exige es EXACTAMENTE lo que la unión garantiza: que no haya
    // dos seguidos con el mismo nombre y sin giro. Dos «gira ligeramente a la
    // izquierda hacia la calzada» seguidos SÍ pueden salir, y no es un fallo:
    // es una curva de dos tramos, y unirlos se comería un giro de verdad.
    const pasos = pasosDe(ORIGEN, DESTINO);
    const haciaDonde = (texto: string): string => texto.replace(/^.*? hacia /, '');
    for (let k = 1; k < pasos.length; k++) {
      if (pasos[k]!.giro !== 'recto') {
        continue;
      }
      assert.notEqual(
        haciaDonde(pasos[k]!.texto),
        haciaDonde(pasos[k - 1]!.texto),
        `el paso ${k} sigue recto por lo mismo que el anterior: «${pasos[k]!.texto}»`,
      );
    }
  });

  test('⭐ el cruce de doce pasos se lee como una maniobra, no como doce', () => {
    // ANTES de fundir, esta misma ruta escribía esto —copiado del checkpoint
    // del 20/08— para cruzar UN cruce:
    //
    //   Gira a la izquierda hacia el paso de peatones · 8 m
    //   Continúa hacia la acera · 3 m
    //   Gira a la derecha hacia la acera · 77 m
    //   Gira a la izquierda hacia la acera · 250 m
    //   Gira a la derecha hacia la acera · 3 m
    //   Continúa hacia el paso de peatones · 10 m
    //   Continúa hacia la acera · 23 m
    //   Continúa hacia el paso de peatones · 11 m
    //   Gira a la izquierda hacia la acera · 6 m
    //   Gira a la derecha hacia la calzada · 4 m
    //   Gira a la izquierda hacia la calzada · 6 m
    //   Gira a la derecha hacia la calzada · 86 m
    //
    // Doce pasos, ocho de ellos por debajo de 25 m. La ruta entera tenía 34.
    const pasos = pasosDe(ORIGEN, DESTINO);
    assert.ok(
      pasos.length <= 15,
      `la ruta larga sale con ${pasos.length} pasos; antes de fundir eran 34`,
    );
    // Y lo que fija que no vuelvan: ningún paso intermedio por debajo del
    // umbral. El arranque puede llevar pocos metros si la ruta es corta, y la
    // llegada lleva cero por definición.
    for (const paso of pasos.slice(1, -1)) {
      assert.ok(
        paso.metros >= UMBRAL_MICRO_M,
        `«${paso.texto}» son ${paso.metros} m, por debajo del umbral de ${UMBRAL_MICRO_M}`,
      );
    }
  });

  test('⭐ la chicane conserva su giro: fundir no endereza lo que tuerce', () => {
    // El tramo sin nombre del polígono: 117 m de `service` y 23 m de `track`.
    // El de 23 es micro (< 25 m) y se funde en el anterior, así que sale UN
    // paso de ~140 m — y lo que se anuncia sigue siendo el giro con el que se
    // entra en la chicane, no un «continúa recto». Eso es lo que fija.
    //
    // ⚠️ Antes esto buscaba «la calzada · 220 m», y los 220 eran una FUSIÓN
    // FALSA: un vial de servicio y un camino de tierra soldados porque los dos
    // se llamaban «la calzada». Al decir cada uno lo que es dejan de fundirse,
    // y la ruta pasa de 13 pasos a 14. Entrada nº7 de la bitácora.
    const pasos = pasosDe(ORIGEN, DESTINO);
    const chicane = pasos.find(
      (p) => p.metros >= 130 && p.metros <= 150 && /vial de servicio$/.test(p.texto),
    );
    assert.ok(chicane, 'no aparece el tramo de la chicane fundido');
    assert.equal(chicane!.giro, 'ligera-izquierda');
  });

  test('la suma de metros de los pasos no cambia al fundir', () => {
    // Fundir mueve metros de un paso a otro; no puede perderlos. Se compara
    // contra los metros de la ruta, que los calcula el Dijkstra por su cuenta.
    const uno = portales.donde.get(ORIGEN)!;
    const otro = portales.donde.get(DESTINO)!;
    const ea = enganchar(red, rejilla, uno.lon, uno.lat)!;
    const eb = enganchar(red, rejilla, otro.lon, otro.lat)!;
    const ruta = calcularRuta(red, cuaderno, ea, [uno.lon, uno.lat], eb, [otro.lon, otro.lat])!;
    const pasos = escribirPasos(red, ruta, 'A', 'B', [otro.lon, otro.lat]);
    const suma = pasos.reduce((t, p) => t + p.metros, 0);
    // Con el redondeo a la decena por encima de 100 m, la suma se separa un
    // poco; lo que no puede es perder un tramo entero.
    assert.ok(
      Math.abs(suma - ruta.metros) < 40,
      `los pasos suman ${suma} m y la ruta mide ${ruta.metros.toFixed(0)}`,
    );
  });

  test('de un portal a sí mismo lo dice, en vez de escribir una ruta vacía', () => {
    const pasos = pasosDe(ORIGEN, ORIGEN);
    assert.equal(pasos.length, 1);
    assert.equal(pasos[0]!.giro, 'llegada');
    assert.match(pasos[0]!.texto, /el mismo portal/);
  });

  // ── LA RUTA LARGA DE ANTONIO ─────────────────────────────────────────────
  //
  // CALLE EL COLOSO 2 → CALLE PADRE ARRUPE 1, 6,4 km de punta a punta de la
  // ciudad. La generó él en pantalla y la narración salía densa: 19 pasos con
  // la misma calle anunciada dos y tres veces. Es la ruta que fija esta pasada.

  /** CALLE EL COLOSO 2 y CALLE PADRE ARRUPE 1. */
  const COLOSO = 'Portales.93310';
  const ARRUPE = 'Portales.108946';

  /** «Gira a la izquierda hacia X» → «X». Lo que importa es el hacia dónde. */
  const haciaDonde = (texto: string): string => texto.replace(/^.*? hacia /, '');

  test('⭐ NINGUNA calle se anuncia dos veces seguidas sin torcer de verdad', () => {
    // Esto es la regla A vista desde la ruta: dos pasos seguidos que llevan al
    // mismo sitio, con un giro que no es un giro, son un solo paso. Los dos
    // casos juez de esta ruta eran Fernando el Católico (14 y 15) y Puente de
    // Piedra (5 y 6).
    const pasos = pasosDe(COLOSO, ARRUPE);
    const SUAVES = new Set(['recto', 'ligera-derecha', 'ligera-izquierda']);
    for (let k = 1; k < pasos.length - 1; k++) {
      if (!SUAVES.has(pasos[k]!.giro)) {
        continue;
      }
      assert.notEqual(
        haciaDonde(pasos[k]!.texto),
        haciaDonde(pasos[k - 1]!.texto),
        `el paso ${k + 1} repite la calle del anterior sin torcer: «${pasos[k]!.texto}»`,
      );
    }
  });

  test('⭐ Paseo de la Independencia se dice UNA vez, no tres', () => {
    // Iba partido en tres —420 m, la zona peatonal 86 m, y 110 m más— porque
    // OSM corta el paseo por el tramo peatonal. Quien anda ve un paseo.
    const pasos = pasosDe(COLOSO, ARRUPE);
    const independencia = pasos.filter((p) => /Paseo de la Independencia$/.test(p.texto));
    assert.equal(independencia.length, 1, 'el paseo sigue partido');
    assert.ok(
      independencia[0]!.metros >= 600,
      `el paseo mide ${independencia[0]!.metros} m; los tres trozos sumaban 616`,
    );
  });

  test('la ruta larga baja de 19 pasos, y no pierde ni el arranque ni la llegada', () => {
    const pasos = pasosDe(COLOSO, ARRUPE);
    assert.ok(pasos.length < 19, `sigue en ${pasos.length} pasos`);
    assert.equal(pasos[0]!.giro, 'salida');
    assert.equal(pasos[pasos.length - 1]!.giro, 'llegada');
    assert.equal(pasos[pasos.length - 1]!.metros, 0);
  });

  test('colapsar tampoco pierde metros en la ruta larga', () => {
    const uno = portales.donde.get(COLOSO)!;
    const otro = portales.donde.get(ARRUPE)!;
    const ea = enganchar(red, rejilla, uno.lon, uno.lat)!;
    const eb = enganchar(red, rejilla, otro.lon, otro.lat)!;
    const ruta = calcularRuta(red, cuaderno, ea, [uno.lon, uno.lat], eb, [otro.lon, otro.lat])!;
    const pasos = escribirPasos(red, ruta, 'A', 'B', [otro.lon, otro.lat]);
    const suma = pasos.reduce((t, p) => t + p.metros, 0);
    assert.ok(
      Math.abs(suma - ruta.metros) < 60,
      `los pasos suman ${suma} m y la ruta mide ${ruta.metros.toFixed(0)}`,
    );
  });

  test('⭐ los 1.270 m de carril bici NUNCA son «la calzada» — bitácora nº7', () => {
    // Entrada nº7 de la bitácora. El tramo son tres ways —354344721, 475888308
    // y 475881583—, los tres h=cycleway y los tres mudos en OSM. Decía «Gira a
    // la derecha hacia la calzada · 1270 m», que es FALSO: no se anda por la
    // calzada de la avenida, se anda por el carril bici de al lado.
    //
    // ⚠️ AJUSTE (herencia por vecindad). Esta prueba exigía además que el
    // tramo dijera «el carril bici». **Ya no lo dice, y es lo correcto**: el
    // carril bici de una avenida ES la avenida, y ahora se llama por su
    // nombre. Lo que la prueba protege sigue intacto, y es lo que la entrada
    // de la bitácora fijaba: que no vuelva a decir «la calzada».
    const pasos = pasosDe(COLOSO, ARRUPE);
    assert.equal(
      pasos.filter((p) => /hacia la calzada$/.test(p.texto)).length,
      0,
      `queda una calzada: ${pasos.filter((p) => /calzada/.test(p.texto)).map((p) => p.texto)}`,
    );
  });

  test('⭐ y AHORA se dicen por su nombre: los 1.270 m son dos avenidas SEGUIDAS', () => {
    // El tramo largo no era una cosa: eran la AVENIDA ACADEMIA GENERAL MILITAR
    // y la AVENIDA SAN JUAN DE LA PEÑA.
    //
    // ⚠️ AJUSTE (regla ancha). Entre las dos había un trozo de 82 m de carril
    // que ninguna reclama —queda en disputa al heredar— y que salía como paso
    // propio. Ahora se absorbe dentro de la primera: las dos avenidas van
    // SEGUIDAS. Los metros no se pierden, se suman a la Academia.
    const pasos = pasosDe(COLOSO, ARRUPE);
    const academia = pasos.findIndex((p) => p.texto.endsWith('hacia Avenida Academia General Militar'));
    const sanJuan = pasos.findIndex((p) => p.texto.endsWith('hacia Avenida San Juan de la Peña'));
    assert.ok(academia >= 0, 'el carril bici de la Academia sigue sin nombre');
    assert.equal(sanJuan, academia + 1, 'entre las dos avenidas se ha colado un paso');
    // 430 m de avenida + los 82 del carril absorbido, redondeados a la decena.
    assert.equal(pasos[academia]!.metros, 510);
  });

  test('⭐ y la ruta larga ya no dice la MISMA avenida dos veces seguidas', () => {
    // Era el vicio que este remate viene a quitar: «AVENIDA SAN JUAN DE LA
    // PEÑA · 760 m» (municipal, heredada del carril) seguida de «Avenida de
    // San Juan de la Peña · 1040 m» (de OSM, la calzada). Misma avenida, dos
    // registros, dos pasos. Ahora es uno, y con el nombre municipal.
    const pasos = pasosDe(COLOSO, ARRUPE);
    const sanJuan = pasos.filter((p) => /SAN JUAN DE LA PEÑA$/i.test(p.texto));
    assert.equal(sanJuan.length, 1, `sale ${sanJuan.length} veces: ${sanJuan.map((p) => p.texto)}`);
    // Y se escribe con el artículo de la partícula en minúscula, no con la
    // mayúscula administrativa del censo: es el mismo nombre, presentado.
    assert.match(sanJuan[0]!.texto, /hacia Avenida San Juan de la Peña$/);
    assert.equal(sanJuan[0]!.metros, 1810, 'los 760 y los 1.040 tienen que sumarse');
  });

  test('la ruta céntrica corta NO se toca: sigue en cuatro pasos', () => {
    // CALLE ALFONSO I 10 → PASEO INDEPENDENCIA 3. Es la del README y la del
    // checkpoint anterior: si esta pasada la cambiara, habría que re-copiarla.
    const pasos = pasosDe('Portales.104760', 'Portales.120461');
    assert.equal(pasos.length, 4);
    assert.deepEqual(
      pasos.map((p) => p.giro),
      ['salida', 'izquierda', 'ligera-derecha', 'llegada'],
    );
    assert.deepEqual(
      pasos.map((p) => p.metros),
      [91, 150, 96, 0],
    );
  });
});
