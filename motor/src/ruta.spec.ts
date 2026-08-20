/**
 * La ruta, sobre el grafo de verdad.
 *
 * Las dos primeras pruebas son las importantes, y las dos fijan un caso REAL
 * de Zaragoza que se midió fallando con el algoritmo ingenuo antes de escribir
 * el trato propio. No son casos inventados para que salga bien: son los peores
 * que aparecieron al barrer el censo.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import {
  cargarRejilla,
  enganchar,
  metrosPlanos,
  type Enganche,
  type Rejilla,
} from './proyeccion.ts';
import { calcularRuta, cuadernoPara, geometriaDe, type Cuaderno } from './ruta.ts';

let red: RedEnMemoria;
let rejilla: Rejilla;
let portales: PortalesEnMemoria;
let cuaderno: Cuaderno;

/** Los dos de CAMINO ALMENARA DE SAN JUAN [GARRAPINILLOS]: 51 TV C91 y C93. */
const ALMENARA_91 = 'Portales.119141';
const ALMENARA_93 = 'Portales.117939';

/** CALLE PEDRO LAPUYADE 3 y CAMINO DE EN MEDIO 120. */
const LAPUYADE_3 = 'Portales.84476';
const EN_MEDIO_120 = 'Portales.82922';

/** Uno de PEÑA ZORONGO, que es isla. */
const ZORONGO = () => portales.situados.find((p) => p.via === '14510')!;

function engancheDe(codigo: string): { enganche: Enganche; punto: readonly [number, number] } {
  const portal = portales.donde.get(codigo)!;
  const enganche = enganchar(red, rejilla, portal.lon, portal.lat)!;
  assert.ok(enganche, `${codigo} tiene que enganchar`);
  return { enganche, punto: [portal.lon, portal.lat] };
}

function rutaEntre(a: string, b: string) {
  const uno = engancheDe(a);
  const otro = engancheDe(b);
  return calcularRuta(red, cuaderno, uno.enganche, uno.punto, otro.enganche, otro.punto);
}

describe('La ruta', () => {
  before(() => {
    red = cargarRed(cargarGrafo());
    rejilla = cargarRejilla(red);
    portales = cargarPortales();
    cuaderno = cuadernoPara(red);
  });

  test('⭐ el caso trivial NO da la vuelta a la manzana', () => {
    // MEDIDO antes de escribir el atajo: el algoritmo ingenuo —pegarse al
    // extremo más cercano de la arista y rutear de nodo a nodo— resolvía este
    // par con **689 metros**. Son dos puertas de la misma calle.
    const uno = engancheDe(ALMENARA_91);
    const otro = engancheDe(ALMENARA_93);
    assert.equal(
      uno.enganche.arista,
      otro.enganche.arista,
      'los dos tienen que enganchar a la misma arista, o esta prueba no prueba nada',
    );

    const ruta = calcularRuta(red, cuaderno, uno.enganche, uno.punto, otro.enganche, otro.punto)!;
    assert.ok(ruta, 'tiene que haber ruta');
    assert.equal(ruta.trivial, true);
    assert.equal(ruta.nodosVisitados, 0, 'el trivial no toca Dijkstra');

    // Y la medida que lo cierra: los metros son los que hay entre las dos
    // proyecciones siguiendo la calle. Si alguien quitara el atajo, esto
    // pasaría de ~10 m a ~689 y se pondría rojo.
    const enLineaRecta = metrosPlanos(
      uno.enganche.lon,
      uno.enganche.lat,
      otro.enganche.lon,
      otro.enganche.lat,
    );
    assert.ok(ruta.metros < 30, `la ruta trivial mide ${ruta.metros.toFixed(0)} m`);
    assert.ok(
      Math.abs(ruta.metros - enLineaRecta) < 1,
      `${ruta.metros.toFixed(2)} m por la calle contra ${enLineaRecta.toFixed(2)} m en recta`,
    );
  });

  test('⭐ las cuatro combinaciones eligen mejor que el extremo más cercano', () => {
    // MEDIDO: el ingenuo resolvía este par con 3.902 m saliendo por el extremo
    // que tenía más cerca. Probando las cuatro salen 3.465: **437 metros de
    // diferencia** en una ruta urbana normal.
    const ruta = rutaEntre(LAPUYADE_3, EN_MEDIO_120)!;
    assert.ok(ruta, 'tiene que haber ruta');
    assert.equal(ruta.trivial, false);
    assert.ok(
      ruta.metros < 3600,
      `${ruta.metros.toFixed(0)} m: el ingenuo daba 3.902 y las cuatro combinaciones 3.465`,
    );
  });

  test('una ruta céntrica sale con geometría continua y sin saltos', () => {
    const ruta = rutaEntre(LAPUYADE_3, EN_MEDIO_120)!;
    const puntos = geometriaDe(ruta);
    assert.ok(puntos.length > 10);
    // Ningún salto: dos puntos seguidos de una ruta a pie no se separan medio
    // kilómetro. Si el camino se reconstruyera mal, aquí saldría el teletransporte.
    for (let k = 1; k < puntos.length; k++) {
      const salto = metrosPlanos(puntos[k - 1]![0], puntos[k - 1]![1], puntos[k]![0], puntos[k]![1]);
      assert.ok(salto < 500, `salto de ${salto.toFixed(0)} m en el punto ${k}`);
    }
    // Y la suma de los trozos es lo que dice el total.
    const suma = ruta.trozos.reduce((t, trozo) => t + trozo.metros, 0);
    assert.ok(
      Math.abs(suma - ruta.metros) < 2,
      `los trozos suman ${suma.toFixed(1)} y el total dice ${ruta.metros.toFixed(1)}`,
    );
  });

  test('la geometría EMPIEZA en la puerta de origen y ACABA en la de destino', () => {
    const uno = engancheDe(LAPUYADE_3);
    const otro = engancheDe(EN_MEDIO_120);
    const ruta = calcularRuta(red, cuaderno, uno.enganche, uno.punto, otro.enganche, otro.punto)!;
    const puntos = geometriaDe(ruta);
    // El conector es lo que hace que la línea salga de la puerta y no del
    // medio de la calzada.
    assert.deepEqual(puntos[0], uno.punto);
    assert.deepEqual(puntos[puntos.length - 1], otro.punto);
  });

  test('sin camino se devuelve null: es un resultado, no un cuelgue', () => {
    // Un portal de PEÑA ZORONGO ni siquiera engancha —está en la componente
    // 39—, así que el caso se corta antes. Lo que esta prueba fija es que
    // engancharlo sea imposible y que nadie se invente una ruta.
    const zorongo = ZORONGO();
    assert.equal(enganchar(red, rejilla, zorongo.lon, zorongo.lat), null);
  });

  test('ida y vuelta miden lo mismo: andando no hay sentidos', () => {
    const ida = rutaEntre(LAPUYADE_3, EN_MEDIO_120)!;
    const vuelta = rutaEntre(EN_MEDIO_120, LAPUYADE_3)!;
    assert.ok(
      Math.abs(ida.metros - vuelta.metros) < 1,
      `ida ${ida.metros.toFixed(1)} m, vuelta ${vuelta.metros.toFixed(1)} m`,
    );
  });

  test('de un portal a sí mismo la ruta mide cero', () => {
    const ruta = rutaEntre(LAPUYADE_3, LAPUYADE_3)!;
    assert.equal(ruta.trivial, true);
    assert.ok(ruta.metros < 0.001);
  });
});
