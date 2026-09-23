import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { ACCESO_ANDANDO, puedeAndar } from './andando.ts';

describe('⭐ LA TABLA DE ACCESO DEL PEATÓN', () => {
  test('el CARRIL BICI está prohibido, y es la fila que muerde', () => {
    // [DOC Valhalla graph.lua] pedestrian_forward = false para cycleway.
    // [DOC OSRM foot.lua] `cycleway` no aparece en la tabla de velocidades.
    // [ORD Zaragoza art. 25] el carril bici no es zona peatonal.
    assert.equal(puedeAndar('cycleway'), false);
  });

  test('lo peatonal está permitido — es donde el peatón va POR LEY', () => {
    // [LEY RGC art. 122.1, reformado por RD 518/2026, en vigor 01-10-2026] la
    // zona peatonal practicable es el sitio del peatón; la calzada es el «en su
    // defecto».
    for (const h of ['footway', 'pedestrian', 'path', 'steps', 'corridor', 'living_street']) {
      assert.equal(puedeAndar(h), true, `${h} tenía que estar permitido`);
    }
  });

  // ⚠️ ACTA — ESTA JUEZA LLEVABA LA CITA EN EL NOMBRE, y la cita se movió
  //    (23/09/2026). Se llamaba «el "salvo" del 121.1 no se resuelve aquí»: el
  //    122.1 reformado ya no dice «salvo», dice «En los supuestos en los que no
  //    exista zona peatonal practicable […] o, en su defecto, por la calzada».
  //    **Compra exactamente lo mismo que compraba** —los quince tipos de
  //    calzada abiertos, ni uno más ni uno menos—: no se ha tocado una sola
  //    aserción, solo el nombre y el comentario, para que lo que promete y lo
  //    que la ley dice vuelvan a ser la misma frase.
  test('toda la CALZADA está permitida: el «en su defecto» del 122.1 no se resuelve aquí', () => {
    // El acceso dice quién PUEDE entrar; que sea el último recurso lo dice el
    // coste, no la puerta. Cerrar la calzada aquí dejaría sin ruta a media
    // ciudad, y el RGC no la cierra: la pone detrás de la acera.
    for (const h of [
      'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified',
      'residential', 'service', 'track', 'busway',
      'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link',
    ]) {
      assert.equal(puedeAndar(h), true, `${h} tenía que estar permitido`);
    }
  });

  test('⭐ un tipo DESCONOCIDO no entra: el que no está en la tabla, no pasa', () => {
    // Es a propósito y es el lado seguro: un tipo nuevo que apareciera en el
    // dato entraría hoy sin que nadie hubiera decidido que se puede andar por
    // él. Que no entre se nota —la red encoge— y se puede contar.
    assert.equal(puedeAndar('teleferico'), false);
    assert.equal(puedeAndar(''), false);
  });

  test('⭐ la tabla cubre los 27 valores de `h` del grafo: ninguno cae al hueco', () => {
    // Sin esto, el lado seguro del test anterior se convertiría en un agujero
    // silencioso: un tipo real del dato quedaría fuera de la red sin que nadie
    // lo hubiera decidido.
    const grafo = cargarGrafo();
    const tipos = new Set(grafo.grafo.aristas.map((a) => a.h));
    assert.equal(tipos.size, 27);
    const fuera = [...tipos].filter((h) => !(h in ACCESO_ANDANDO));
    assert.deepEqual(fuera, [], `sin fila en la tabla: ${fuera.join(', ')}`);
  });

  test('la tabla NO tiene filas de más: cada fila existe en el grafo', () => {
    const grafo = cargarGrafo();
    const tipos = new Set(grafo.grafo.aristas.map((a) => a.h));
    const sobran = Object.keys(ACCESO_ANDANDO).filter((h) => !tipos.has(h));
    assert.deepEqual(sobran, [], `filas sin dato detrás: ${sobran.join(', ')}`);
  });

  test('solo el cycleway está a false: una prohibición y ninguna más', () => {
    const prohibidos = Object.entries(ACCESO_ANDANDO)
      .filter(([, puede]) => !puede)
      .map(([h]) => h);
    assert.deepEqual(prohibidos, ['cycleway']);
  });
});
