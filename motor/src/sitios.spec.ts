/**
 * Los sitios: el índice de destinos con nombre, y la regla que decide quién
 * entra en él.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  cargarSitios,
  enPalabras,
  sugerirSitios,
  LIMITE_SITIOS,
  type SitioSituado,
  type SitiosEnMemoria,
} from './sitios.ts';
import { normalizar } from './callejero.ts';

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

  // ── EL ORDEN ───────────────────────────────────────────────────────────────
  //
  // ⭐ Hasta el 23/08 NO HABÍA ORDEN, y nadie lo había escrito. Sondeado antes
  // de tocarlo: `/api/sitios?q=far` devolvía las posiciones 0..9 DEL FICHERO,
  // es decir las diez primeras que el Ayuntamiento puso en su JSON, cortando
  // las otras 300 sin criterio ninguno. Era estable —el mismo fichero da
  // siempre lo mismo— pero arbitrario, y sobre todo **el corte se aplicaba
  // antes de ordenar**: las diez que salían no eran las diez mejores de nada.
  //
  // Ahora el orden es doctrina, y se comprueba en este bloque.

  /** Las mismas de siempre, con el índice DADO LA VUELTA. */
  const alReves = (): SitiosEnMemoria => ({ ...sitios, indice: [...sitios.indice].reverse() });

  test('⭐ EL ORDEN ES TOTAL: dar la vuelta al índice no cambia la salida', () => {
    // La garantía de que la lista «no baila»: el resultado es función de la
    // consulta y del foco, y de nada más. Si quedara un empate sin desempatar,
    // el orden del fichero se colaría por él y esto se pondría rojo.
    for (const q of ['far', 'cas', 'navarra', 'san']) {
      assert.deepEqual(
        sugerirSitios(alReves(), q).map((x) => x.codigo),
        sugerirSitios(sitios, q).map((x) => x.codigo),
        `«${q}» cambia de orden al reordenar el índice`,
      );
    }
  });

  test('⭐ LA RELEVANCIA LINGÜÍSTICA MANDA [Pelias]', () => {
    // «cas» casa con 15: en 10 empieza una palabra —Castro, Caspe, Castilla,
    // Casanova, Castelar, Casia— y en 5 cae DENTRO de una: Uncastillo, Lucas,
    // Moncasi, Picasso. Las diez primeras tienen que ser las diez de palabra,
    // y como el tope es diez, las otras cinco no asoman.
    const salen = sugerirSitios(sitios, 'cas');
    assert.equal(salen.length, 10);
    const dentroDePalabra = ['Uncastillo', 'Lucas', 'Moncasi', 'Picasso'];
    for (const s of salen) {
      for (const trozo of dentroDePalabra) {
        assert.ok(
          !s.presentacion.includes(trozo),
          `«${s.presentacion}» casa dentro de una palabra y ha salido por delante`,
        );
      }
    }
  });

  test('⭐ EN EMPATE Y SIN FOCO, alfabético por la dirección [PROPIO]', () => {
    // «navarra» casa con dos, y las dos con el mismo rango: la palabra entera.
    // La doctrina calla en el empate puro, así que se declara uno: alfabético.
    assert.deepEqual(
      sugerirSitios(sitios, 'navarra').map((x) => x.presentacion),
      ['Farmacia · Avda. de Navarra, 65', 'Farmacia · C/ Doña Blanca de Navarra, 46-48'],
    );
  });

  test('⭐ EL FOCO SUBE LO CERCANO [Pelias focus.point]', () => {
    // El mismo empate de arriba, con el otro extremo ya resuelto. Puesto el
    // foco encima de Doña Blanca, esa pasa delante — y la otra NO desaparece,
    // que es lo que separa un foco de un filtro.
    const juntoADonaBlanca = { lon: -0.898502, lat: 41.652574 };
    assert.deepEqual(
      sugerirSitios(sitios, 'navarra', juntoADonaBlanca).map((x) => x.presentacion),
      ['Farmacia · C/ Doña Blanca de Navarra, 46-48', 'Farmacia · Avda. de Navarra, 65'],
    );

    // Y al revés, con el foco en la otra: vuelve el orden de antes.
    const juntoALaAvenida = { lon: -0.90672, lat: 41.655212 };
    assert.deepEqual(
      sugerirSitios(sitios, 'navarra', juntoALaAvenida).map((x) => x.presentacion),
      ['Farmacia · Avda. de Navarra, 65', 'Farmacia · C/ Doña Blanca de Navarra, 46-48'],
    );
  });

  test('⭐ EL FOCO NO MANDA SOBRE LA LENGUA: es el segundo criterio', () => {
    // Foco pegado a «C/ Uncastillo, 2», que casa con «cas» DENTRO de palabra.
    // Estar al lado no le da derecho a entrar: la lengua va primero, y las
    // diez de palabra siguen ocupando la lista entera.
    const encimaDeUncastillo = sitios.donde.get(
      sugerirSitios(sitios, 'uncastillo')[0]!.codigo,
    )!;
    const salen = sugerirSitios(sitios, 'cas', {
      lon: encimaDeUncastillo.lon,
      lat: encimaDeUncastillo.lat,
    });
    assert.equal(salen.length, 10);
    assert.ok(
      !salen.some((x) => x.presentacion.includes('Uncastillo')),
      'el foco ha colado una peor por estar cerca',
    );
  });

  test('⭐ EL CORTE SE APLICA DESPUÉS DE ORDENAR, no antes', () => {
    // Era el fallo de fondo del orden viejo: se cortaba a diez mientras se
    // recorría el fichero, así que las diez que salían eran las diez primeras
    // del JSON. Con foco, las diez tienen que ser las diez MÁS CERCANAS de
    // todas las que casan, no las diez primeras que se encontraron.
    const foco = { lon: -0.898502, lat: 41.652574 };
    const salen = sugerirSitios(sitios, 'far', foco);
    assert.equal(salen.length, LIMITE_SITIOS);

    const distancia = (codigo: string): number => {
      const s = sitios.donde.get(codigo)!;
      return Math.hypot((s.lon - foco.lon) * 82000, (s.lat - foco.lat) * 111000);
    };
    // Las diez, ordenadas de cerca a lejos.
    const suyas = salen.map((x) => distancia(x.codigo));
    assert.deepEqual(suyas, [...suyas].sort((a, b) => a - b), 'no vienen de cerca a lejos');
    // Y ninguna de las 300 que se quedan fuera está más cerca que la última.
    const fuera = sitios.indice.filter((s) => !salen.some((x) => x.codigo === s.codigo));
    const laUltima = suyas[suyas.length - 1]!;
    for (const s of fuera) {
      assert.ok(
        distancia(s.codigo) >= laUltima,
        `${s.presentacion} está más cerca que la última que sale`,
      );
    }
  });

  // ── DOS CASOS QUE EL DATO REAL NO PUEDE PROVOCAR ───────────────────────────
  //
  // ⚠️ La contraprueba destapó dos ramas que ninguna prueba tocaba, y las dos
  // por el mismo motivo: **las 310 farmacias no tienen dos direcciones
  // iguales, ni una sola donde la puntuación cambie el resultado**. Medido:
  // `direcciones repetidas entre las 310: 0`. Quitar el desempate por código o
  // partir las palabras solo por espacios dejaba las 20 pruebas en verde.
  //
  // No se borran, porque no son adorno: son lo que hace que el orden sea TOTAL
  // y que la puntuación no mande. Se les fabrica el caso, que es la otra salida
  // —y la buena cuando la rama protege de algo que hoy no pasa pero puede.
  //
  // Los sitios de laboratorio se montan con `normalizar` y `enPalabras`, **las
  // de verdad**: una copia local se quedaría atrás en cuanto cambiaran.

  /** Un sitio inventado, con los campos que el índice le calcula. */
  function sitioDe(codigo: string, calle: string, lon = -0.88, lat = 41.65): SitioSituado {
    return {
      codigo,
      presentacion: `Farmacia · ${calle}`,
      categoria: 'Farmacia',
      calle,
      lon,
      lat,
      comparableNombre: normalizar('Farmacia'),
      comparableCalle: normalizar(calle),
      palabrasNombre: enPalabras(normalizar('Farmacia')),
      palabrasCalle: enPalabras(normalizar(calle)),
    };
  }

  /** Un índice de mentira con los sitios que se le den. */
  function indiceDe(...unos: SitioSituado[]): SitiosEnMemoria {
    return {
      total: unos.length,
      conCoordenada: unos.length,
      sinCoordenada: 0,
      indice: unos,
      donde: new Map(unos.map((u) => [u.codigo, u])),
      cargadoEnMs: 0,
    };
  }

  test('⭐ DOS DIRECCIONES IGUALES: desempata el código, y no el fichero', () => {
    // Es la última capa del orden, la que lo hace total. Con las 310 de hoy no
    // se alcanza nunca —no hay dos direcciones repetidas— así que aquí se le
    // fabrica el empate: mismo texto, distinto código.
    const a = sitioDe('Farmacias.100', 'C/ Igual, 1');
    const b = sitioDe('Farmacias.200', 'C/ Igual, 1');

    assert.deepEqual(
      sugerirSitios(indiceDe(a, b), 'igual').map((x) => x.codigo),
      ['Farmacias.100', 'Farmacias.200'],
    );
    // Y del revés en el índice, el MISMO resultado: eso es que es total.
    assert.deepEqual(
      sugerirSitios(indiceDe(b, a), 'igual').map((x) => x.codigo),
      ['Farmacias.100', 'Farmacias.200'],
    );
  });

  test('⭐ LA PUNTUACIÓN NO MANDA: «Broto,» es la palabra «broto»', () => {
    // Partiendo solo por espacios, «broto,» no es «broto»: se queda en
    // «empieza por» en vez de «es», y una dirección donde la palabra va suelta
    // se colaría por delante de la que la lleva con coma. Que el número de
    // portal vaya detrás de una coma no es mérito de nadie.
    const conComa = sitioDe('Farmacias.100', 'C/ Broto, 5');
    const suelta = sitioDe('Farmacias.200', 'C/ Zeta Broto 7');

    assert.deepEqual(
      sugerirSitios(indiceDe(conComa, suelta), 'broto').map((x) => x.presentacion),
      ['Farmacia · C/ Broto, 5', 'Farmacia · C/ Zeta Broto 7'],
      'la coma ha cambiado el orden',
    );
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
