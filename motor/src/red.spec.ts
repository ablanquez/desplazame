/**
 * La red, comprobada sobre el dato de verdad.
 *
 * Aquí no hay fixtures: se carga el grafo entero, como al arrancar. Cuesta
 * unos segundos y merece la pena — lo que se quiere saber es si la adyacencia
 * sale bien de ESTE fichero, no de uno inventado.
 *
 * Se carga UNA vez para todo el fichero: son 22,8 MB y volver a parsearlos por
 * prueba multiplicaría el reloj sin comprobar nada nuevo.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { puedeAndar } from './andando.ts';
import type { GrafoEnMemoria } from './grafo.ts';

let grafo: GrafoEnMemoria;
let red: RedEnMemoria;

describe('La red', () => {
  before(() => {
    grafo = cargarGrafo();
    red = cargarRed(grafo);
  });

  test('⭐ se queda con lo andable, lo conectado y lo PERMITIDO al peatón', () => {
    // Eran 93.503 con `a=1 ∧ c=0`. La tabla de acceso (`andando.ts`) quita
    // 4.456 más —todas `h=cycleway`, la única prohibición— y quedan 89.047.
    assert.equal(red.aristas.length, 89047);
    assert.equal([...red.cerradasPorTipo].flat().join(), 'cycleway,4456');
    // ⭐ Y ninguna cayó por no tener fila: el hueco de la tabla es 0.
    assert.equal(red.sinFilaEnLaTabla, 0);
    // Y ninguna se cuela: si alguna llegara con a=0, c!=0 o prohibida, la ruta
    // podría meter al usuario por una autopista, por una isla o por el carril.
    const crudas = new Map(grafo.grafo.aristas.map((a) => [a.i, a]));
    for (const arista of red.aristas) {
      const cruda = crudas.get(arista.i)!;
      assert.equal(cruda.a, 1);
      assert.equal(cruda.c, 0);
      assert.equal(puedeAndar(cruda.h), true, `${cruda.h} no se anda y está dentro`);
    }
  });

  test('reconstruye los nodos por coordenada, con el desajuste de 10 declarado', () => {
    // El fichero DECLARA cuántos nodos tiene la componente mayor. Juntar
    // coordenadas devuelve diez menos, y esos diez NO CONSTAN: lo que esta
    // prueba fija es que sigan siendo diez y no se conviertan en mil sin que
    // nadie se entere.
    assert.equal(grafo.grafo.contadores.tamanoMayor, 65707);
    // ⭐ El desajuste de 10 sigue vivo, y se mide donde se medía: sobre
    // `a=1 ∧ c=0`, ANTES de que la tabla de acceso quite nada. Cambiar esta
    // cuenta por la de la red nueva habría borrado el hallazgo en vez de
    // conservarlo — son dos restas distintas y las dos importan.
    const antesDeLaTabla = new Set<string>();
    for (const a of grafo.grafo.aristas) {
      if (a.a !== 1 || a.c !== 0) continue;
      antesDeLaTabla.add(`${a.g[0]![0]},${a.g[0]![1]}`);
      antesDeLaTabla.add(`${a.g[a.g.length - 1]![0]},${a.g[a.g.length - 1]![1]}`);
    }
    assert.equal(antesDeLaTabla.size, 65697);
    assert.equal(grafo.grafo.contadores.tamanoMayor - antesDeLaTabla.size, 10);
    // Y lo que la tabla de acceso se lleva por su cuenta: 1.423 nodos.
    assert.equal(red.nodos, 64274);
    assert.equal(antesDeLaTabla.size - red.nodos, 1423);
  });

  test('⭐ el cruce de artículos propios: 252 núcleos que OSM escribe altos', () => {
    // El censo municipal publica todo en mayúscula y ahí no se ve si el
    // artículo pertenece al nombre. OSM sí lo marca, y de él sale este cruce.
    assert.equal(red.articulosPropios.size, 252);
    // Los tres que se leen en las rutas de Antonio y en el README.
    assert.deepEqual([...(red.articulosPropios.get('COLOSO') ?? [])], ['EL']);
    assert.deepEqual([...(red.articulosPropios.get('HABANA') ?? [])], ['LA']);
    // Y uno que NO está: «Calle la Fuente» del Actur no es un nombre propio…
    assert.equal(red.articulosPropios.has('ISABEL CATOLICA'), false);
  });

  test('la adyacencia es simétrica: si de A se llega a B, de B se llega a A', () => {
    const vecinosDe = (nodo: number): Set<number> => {
      const salen = new Set<number>();
      for (let k = red.inicio[nodo]!; k < red.inicio[nodo + 1]!; k++) {
        salen.add(red.salidaVecino[k]!);
      }
      return salen;
    };
    // Sobre una muestra determinista: comprobar los 65.697 es el mismo
    // resultado y diez veces el reloj.
    for (let nodo = 0; nodo < red.nodos; nodo += 97) {
      for (const vecino of vecinosDe(nodo)) {
        assert.ok(
          vecinosDe(vecino).has(nodo),
          `de ${nodo} se llega a ${vecino}, pero no al revés`,
        );
      }
    }
  });

  test('cada arista aparece dos veces en el CSR: una por sentido', () => {
    assert.equal(red.salidaArista.length, red.aristas.length * 2);
    const veces = new Map<number, number>();
    for (const k of red.salidaArista) {
      veces.set(k, (veces.get(k) ?? 0) + 1);
    }
    assert.equal(veces.size, red.aristas.length);
    for (const [, n] of veces) {
      assert.equal(n, 2);
    }
  });

  test('los nodos de una arista están donde dice su geometría', () => {
    for (let k = 0; k < red.aristas.length; k += 1000) {
      const arista = red.aristas[k]!;
      const primero = arista.g[0]!;
      const ultimo = arista.g[arista.g.length - 1]!;
      assert.equal(red.nodoLon[arista.desde], primero[0]);
      assert.equal(red.nodoLat[arista.desde], primero[1]);
      assert.equal(red.nodoLon[arista.hasta], ultimo[0]);
      assert.equal(red.nodoLat[arista.hasta], ultimo[1]);
    }
  });

  test('el cruce de nombres carga, y cubre 35.124 aristas de la red nueva', () => {
    // El fichero no cambia —19.897 entradas—, pero la red sí: eran 37.397 de
    // 93.503 (40,0 %) y ahora son 35.124 de 89.047 (39,4 %). Las 2.273 que
    // faltan son carril bici CON nombre en OSM, que ya no está en la red.
    assert.equal(red.nombreDeWay.size, 19897);
    const conNombre = red.aristas.filter((a) => red.nombreDeWay.has(a.way)).length;
    assert.equal(conNombre, 35124);
    // La que abrió el cruce en la consulta del 19/08.
    assert.equal(red.nombreDeWay.get(4759672), 'Calle de San Francisco de Borja');
  });
});
