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

  /**
   * ⭐ LA BÚSQUEDA POR PALABRAS.
   *
   * [DOC Pelias] Su analizador **trocea la consulta y casa los trozos contra
   * varios campos**, en vez de exigir que la frase entera aparezca en uno.
   * Aquí es lo que separa una búsqueda de un `includes`: «farmacia bretón» es
   * lo que escribe cualquiera, y contra la presentación entera —«Farmacia ·
   * C/ Tomás Bretón, 36»— no casa, porque entre las dos palabras hay un «· C/
   * Tomás » que la consulta no lleva.
   *
   * La regla: **todas las palabras tienen que casar, cada una contra el nombre
   * O contra la calle**. Todas, porque cada palabra que se escribe es una
   * condición más —quien escribe dos quiere menos resultados, no más—; y
   * contra cualquiera de los dos campos, porque quien escribe no sabe ni tiene
   * por qué saber en cuál de ellos cae cada palabra.
   */
  test('⭐ «farmacia bretón»: una palabra al nombre y otra a la calle', () => {
    const salen = sugerirSitios(sitios, 'farmacia bretón');
    assert.ok(salen.length > 0, 'no encuentra nada con dos palabras de campos distintos');
    for (const s of salen) {
      assert.match(s.presentacion, /Breton|Bretón/, `no es de Bretón: ${s.presentacion}`);
    }
  });

  test('⭐ el orden NO manda: «bretón farmacia» da lo mismo', () => {
    const derecho = sugerirSitios(sitios, 'farmacia bretón');
    const revés = sugerirSitios(sitios, 'bretón farmacia');
    assert.deepEqual(
      revés.map((s) => s.codigo),
      derecho.map((s) => s.codigo),
    );
    assert.ok(derecho.length > 0);
  });

  test('cada palabra RECORTA: dos palabras no traen más que una', () => {
    // Si «todas deben casar» se implementara como «alguna», esto crecería en
    // vez de encoger. Con el límite en 10 la desigualdad se ve igual.
    const una = sugerirSitios(sitios, 'bretón');
    const dos = sugerirSitios(sitios, 'bretón sabinigo');
    assert.ok(una.length > 0, 'la palabra sola no trae nada');
    assert.equal(dos.length, 0, `«bretón sabinigo» no es ninguna: trae ${dos.length}`);
  });

  test('una palabra sola sigue funcionando como antes', () => {
    assert.ok(sugerirSitios(sitios, 'farmacia').length > 0);
    assert.ok(sugerirSitios(sitios, 'bretón').length > 0);
  });

  test('se parte por cualquier blanco, y por rachas enteras', () => {
    // ⚠️ El tabulador está aquí a propósito. Con `split(' ')` esta prueba se
    // pone roja y con `split(/\s+/)` no, que es la diferencia entre las dos:
    // sin él, las dos formas dan lo mismo y la prueba no distinguiría nada.
    // Se descubrió mutando: la versión de antes seguía verde con `split(' ')`.
    const limpio = sugerirSitios(sitios, 'farmacia bretón');
    for (const escrito of ['  farmacia   bretón  ', 'farmacia\tbretón']) {
      assert.deepEqual(
        sugerirSitios(sitios, escrito).map((s) => s.codigo),
        limpio.map((s) => s.codigo),
        `«${escrito}» no da lo mismo que «farmacia bretón»`,
      );
    }
    assert.ok(limpio.length > 0);
  });
});
