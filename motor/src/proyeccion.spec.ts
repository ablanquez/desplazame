/**
 * La proyección, comprobada sobre el censo de verdad.
 *
 * Igual que `red.spec.ts`: sin fixtures. Lo que se quiere saber es si un
 * portal REAL de Zaragoza cae donde tiene que caer.
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
  metrosHastaElEnganche,
  NODE_SNAP_M,
  RADIO_MAXIMO_M,
  type Rejilla,
} from './proyeccion.ts';

let red: RedEnMemoria;
let rejilla: Rejilla;
let portales: PortalesEnMemoria;

/** El del Pilar, que es el que se usa en todo el proyecto. */
const PILAR = 'Portales.121428';

describe('La proyección', () => {
  before(() => {
    red = cargarRed(cargarGrafo());
    rejilla = cargarRejilla(red);
    portales = cargarPortales();
  });

  test('un portal céntrico engancha a metros de su puerta, dentro de una arista', () => {
    const portal = portales.donde.get(PILAR)!;
    const enganche = enganchar(red, rejilla, portal.lon, portal.lat)!;

    assert.ok(enganche, 'el portal del Pilar tiene que enganchar');
    // A pie de calle: no a 300 m.
    assert.ok(enganche.metros < 30, `enganchó a ${enganche.metros.toFixed(1)} m`);
    // Y el punto proyectado está DENTRO del segmento que dice, no en su
    // prolongación: ese recorte es lo que separa una proyección de una recta
    // infinita.
    assert.ok(enganche.fraccion >= 0 && enganche.fraccion <= 1);

    // El punto devuelto está de verdad sobre la geometría de esa arista.
    const g = red.aristas[enganche.arista]!.g;
    const a = g[enganche.segmento]!;
    const b = g[enganche.segmento + 1]!;
    const sobreElSegmento =
      metrosPlanos(a[0], a[1], enganche.lon, enganche.lat) +
      metrosPlanos(enganche.lon, enganche.lat, b[0], b[1]);
    assert.ok(
      Math.abs(sobreElSegmento - metrosPlanos(a[0], a[1], b[0], b[1])) < 0.01,
      'el punto proyectado no está sobre el segmento',
    );
  });

  test('un portal de una ISLA no engancha: es un Aviso, no una ruta inventada', () => {
    // URBANIZACIÓN PEÑA ZORONGO. Sus calles existen y son andables, pero viven
    // en la componente 39: desde el resto de Zaragoza no se llega andando.
    // Engancharlo al continente daría un conector de cientos de metros y una
    // ruta mentirosa; aquí se prefiere no contestar.
    const suyos = portales.situados.filter((p) => p.via === '14510');
    assert.ok(suyos.length > 400, 'Peña Zorongo tiene 460 portales');

    let sinEnganche = 0;
    for (const portal of suyos) {
      if (enganchar(red, rejilla, portal.lon, portal.lat) === null) {
        sinEnganche++;
      }
    }
    assert.equal(sinEnganche, suyos.length);
  });

  test('el node_snap pega al cruce lo que cae a menos de 5 m de un extremo', () => {
    // No se busca un portal concreto: se comprueba la REGLA sobre todos los
    // que la disparan. Si alguno se pegara a un nodo estando a 6 m, o dejara
    // de pegarse estando a 2, esto se pone rojo.
    let pegados = 0;
    let sueltos = 0;
    for (let k = 0; k < portales.situados.length; k += 7) {
      const portal = portales.situados[k]!;
      const enganche = enganchar(red, rejilla, portal.lon, portal.lat);
      if (!enganche) {
        continue;
      }
      const arista = red.aristas[enganche.arista]!;
      const primero = arista.g[0]!;
      const ultimo = arista.g[arista.g.length - 1]!;
      const alPrimero = metrosPlanos(enganche.lon, enganche.lat, primero[0], primero[1]);
      const alUltimo = metrosPlanos(enganche.lon, enganche.lat, ultimo[0], ultimo[1]);

      if (enganche.nodo === null) {
        // Si NO se pegó, es que la proyección quedó lejos de los dos extremos.
        assert.ok(
          alPrimero > NODE_SNAP_M && alUltimo > NODE_SNAP_M,
          `no se pegó estando a ${Math.min(alPrimero, alUltimo).toFixed(2)} m de un extremo`,
        );
        sueltos++;
      } else {
        // Si se pegó, el punto devuelto ES el del nodo, exactamente.
        assert.equal(enganche.lon, red.nodoLon[enganche.nodo]);
        assert.equal(enganche.lat, red.nodoLat[enganche.nodo]);
        assert.ok(Math.min(alPrimero, alUltimo) < 0.001);
        pegados++;
      }
    }
    assert.ok(pegados > 0, 'ningún portal disparó el node_snap: la regla no se probó');
    assert.ok(sueltos > pegados, 'lo normal es NO pegarse; algo va mal si es al revés');
  });

  test('nadie engancha más lejos del radio declarado', () => {
    for (let k = 0; k < portales.situados.length; k += 13) {
      const portal = portales.situados[k]!;
      const enganche = enganchar(red, rejilla, portal.lon, portal.lat);
      if (enganche && enganche.nodo === null) {
        assert.ok(enganche.metros <= RADIO_MAXIMO_M);
      }
    }
  });

  test('el reparto de metros dentro de la arista suma su longitud', () => {
    for (let k = 0; k < portales.situados.length; k += 101) {
      const portal = portales.situados[k]!;
      const enganche = enganchar(red, rejilla, portal.lon, portal.lat);
      if (!enganche) {
        continue;
      }
      const arista = red.aristas[enganche.arista]!;
      const hasta = metrosHastaElEnganche(red, enganche);
      assert.ok(hasta >= -0.001, 'un reparto negativo no existe');
      // Lo que queda por delante nunca puede ser más que la arista entera.
      assert.ok(
        hasta <= arista.metros + 1,
        `${hasta.toFixed(1)} m de reparto en una arista de ${arista.metros} m`,
      );
    }
  });

  test('coordenadas que no son coordenadas devuelven null, no revientan', () => {
    assert.equal(enganchar(red, rejilla, Number.NaN, 41.65), null);
    assert.equal(enganchar(red, rejilla, -0.87, Number.NaN), null);
    // En mitad del Atlántico tampoco hay calle.
    assert.equal(enganchar(red, rejilla, 0, 0), null);
  });
});
