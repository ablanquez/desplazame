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
  escribirPasos,
  fundirMicroTramos,
  giroDe,
  metrosParaLeer,
  UMBRAL_MICRO_M,
  type TramoLlano,
} from './pasos.ts';

/** Un tramo llano de mentira, para probar la fusión con ángulos a mano. */
function tramo(
  nombre: string,
  metros: number,
  entrada: number,
  salida = entrada,
): TramoLlano {
  return { nombre, conNombre: !nombre.startsWith('la '), metros, entrada, salida };
}

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
    assert.match(pasos[0]!.texto, /^Sal de CALLE DE PRUEBA 1 /);
    assert.match(pasos[pasos.length - 1]!.texto, /^CALLE DE LLEGADA 2 /);
  });

  test('EL INTERIOR habla OSM cuando hay nombre, y por TIPO cuando no', () => {
    const pasos = pasosDe(ORIGEN, DESTINO);
    const medio = pasos.slice(1, -1);
    const conNombre = medio.filter((p) => /hacia (Calle|Avenida|Camino|Paseo|Plaza)/.test(p.texto));
    const porTipo = medio.filter((p) =>
      /hacia (la acera|el paso de peatones|las escaleras|la zona peatonal|la calzada)$/.test(
        p.texto,
      ),
    );
    assert.ok(conNombre.length > 0, 'ninguna calle con nombre: el cruce no está entrando');
    assert.ok(porTipo.length > 0, 'ninguna por tipo: el 60% sin nombre no se está tratando');
    // Y no queda ninguno por clasificar: o nombre, o tipo.
    assert.equal(conNombre.length + porTipo.length, medio.length);
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
    // Tres tramos sin nombre que hacían dos «ligeramente a la izquierda» y una
    // «ligeramente a la derecha» —120, 23 y 82 m—. El de 23 es micro. Al
    // fundirlos sale UN paso de ~220 m, y lo que se anuncia sigue siendo el
    // giro con el que se entra en la chicane, no un «continúa recto».
    const pasos = pasosDe(ORIGEN, DESTINO);
    const chicane = pasos.find((p) => p.metros >= 200 && p.metros <= 240 && /calzada/.test(p.texto));
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
});
