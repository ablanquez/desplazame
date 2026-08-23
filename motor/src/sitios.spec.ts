/**
 * Los sitios: el índice de destinos con nombre, y la regla que decide quién
 * entra en él.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cargarSitios, sugerirSitios, LIMITE_SITIOS, type SitiosEnMemoria } from './sitios.ts';

describe('Los sitios — farmacias', () => {
  let sitios: SitiosEnMemoria;

  before(() => {
    sitios = cargarSitios();
  });

  test('carga las 313 del fichero, y dice cuántas tienen punto', () => {
    // Los recuentos son los del dato, verificados el 23/08 sobre el fichero:
    // 313 registros, 310 con coordenada, 3 sin.
    assert.equal(sitios.total, 313);
    assert.equal(sitios.conCoordenada, 310);
    assert.equal(sitios.sinCoordenada, 3);
  });

  test('⭐ REGLA B — al índice solo entran los que tienen coordenada', () => {
    // «Sin coordenada no existe» (Antonio, 23/08). Un destino que no se puede
    // situar no se puede enrutar, y sugerirlo sería prometer una ruta que
    // acaba en un aviso. [DOC Pelias] indexa *venues* con su punto; sin punto
    // no hay documento que indexar.
    assert.equal(sitios.indice.length, 310);
    assert.equal(sitios.indice.length, sitios.conCoordenada);
    for (const s of sitios.indice) {
      assert.ok(Number.isFinite(s.lat) && Number.isFinite(s.lon));
    }
  });

  test('⭐ REGLA B — los tres sin punto no se sugieren JAMÁS', () => {
    // Sus ids, del fichero: 29916, 30105 y 8714. Se buscan por la calle que
    // declaran —el tercero no declara ninguna— y no pueden aparecer.
    const huerfanos = ['Farmacias.29916', 'Farmacias.30105', 'Farmacias.8714'];
    for (const codigo of huerfanos) {
      assert.equal(sitios.donde.has(codigo), false, `${codigo} está en el índice`);
    }
    // Y por si alguien los metiera con otro código: ninguna sugerencia de las
    // que salen por su calle puede ser una de ellas.
    for (const q of ['pilon', 'tenor fleta']) {
      for (const s of sugerirSitios(sitios, q)) {
        assert.ok(!huerfanos.includes(s.codigo), `${s.codigo} se ha sugerido`);
      }
    }
  });

  test('sugiere desde DOS letras, como las vías', () => {
    // El patrón de la casa: `/api/vias` sugiere desde 2. Con una sola letra no
    // se sugiere nada, porque no es una búsqueda: es empezar a escribir.
    assert.equal(sugerirSitios(sitios, 'f').length, 0);
    assert.ok(sugerirSitios(sitios, 'fa').length > 0);
  });

  test('nunca más de DIEZ sugerencias', () => {
    // [DOC Pelias] Su `size` por defecto es 10, y es el mismo número que ya usa
    // el autocompletar de vías.
    //
    // ⚠️ El **10 va escrito a mano** además de comprobarse contra la constante.
    // Con solo `<= LIMITE_SITIOS` la prueba se movía con el código: subir la
    // constante a 25 la dejaba en verde, porque estaba comparando el código
    // consigo mismo. Lo cazó la contraprueba.
    assert.equal(LIMITE_SITIOS, 10);
    // «far» casa con las 310 —todas empiezan por «Farmacia»—, así que este es
    // el caso que de verdad topa.
    assert.equal(sugerirSitios(sitios, 'far').length, 10);
    assert.ok(sugerirSitios(sitios, 'a').length <= 10);
  });

  test('⭐ casa por el nombre de presentación Y por la calle', () => {
    // Quien busca «farmacia» quiere la categoría; quien busca «navarra» quiere
    // la de su calle. Las dos entradas valen.
    assert.ok(sugerirSitios(sitios, 'farmacia').length > 0);
    const navarra = sugerirSitios(sitios, 'navarra');
    assert.ok(navarra.length > 0, 'ninguna farmacia casa con «navarra»');
    assert.ok(navarra.every((s) => /navarra/i.test(s.presentacion)));
  });

  test('⭐ el `title` del dato NO se usa para presentar: en ninguno de los 310', () => {
    // El campo `title` es el que puede llevar el nombre de la persona titular
    // —274 de los 313 lo llevan— y la decisión parlamentada es que no salga de
    // aquí. La prueba no adivina qué texto «parece un nombre»: comprueba lo
    // que de verdad se decidió, que es que **ese campo no se lee**.
    //
    // (El primer intento sí adivinaba, con una expresión de «Apellido,
    // Nombre», y marcaba dos direcciones como si fueran personas — «Pza.
    // Azteca, S/N (Parque Hispanidad)». Una prueba que señala lo que no es,
    // acaba enseñando a ignorarla.)
    const crudo = JSON.parse(
      readFileSync(
        fileURLToPath(
          new URL('../../app/data/2026-08-23_zgzapi_equipamiento-farmacias.json', import.meta.url),
        ),
        'utf8',
      ),
    ) as { equipamiento: { id: number; title?: string }[] };

    const titulos = new Map(crudo.equipamiento.map((r) => [`Farmacias.${r.id}`, r.title ?? '']));
    const cuelan = sitios.indice.filter((s) => {
      const t = titulos.get(s.codigo) ?? '';
      return t !== '' && s.presentacion.includes(t);
    });
    assert.equal(cuelan.length, 0, `${cuelan.length} presentaciones llevan el título del dato`);

    // Y por el otro lado: la presentación se compone SIEMPRE igual.
    for (const s of sitios.indice) {
      assert.ok(
        s.presentacion === `Farmacia · ${s.calle}`,
        'una presentación no es «Farmacia · calle»',
      );
    }
  });

  test('la presentación es «Farmacia · calle»', () => {
    const uno = sitios.donde.get('Farmacias.8691');
    assert.ok(uno, 'no está la farmacia juez');
    assert.equal(uno!.categoria, 'Farmacia');
    assert.equal(uno!.presentacion, 'Farmacia · Avda. de Navarra, 65');
  });

  test('la búsqueda no distingue acentos ni mayúsculas', () => {
    const a = sugerirSitios(sitios, 'TOMÁS');
    const b = sugerirSitios(sitios, 'tomas');
    assert.deepEqual(
      a.map((s) => s.codigo),
      b.map((s) => s.codigo),
    );
    assert.ok(a.length > 0);
  });
});
