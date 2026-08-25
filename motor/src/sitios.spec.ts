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
  sinRepetidos,
  sugerirSitios,
  LIMITE_SITIOS,
  type SitioSituado,
  type SitiosEnMemoria,
} from './sitios.ts';
import { cargarCallejero, normalizar } from './callejero.ts';
import { cargarPortales } from './portales.ts';

describe('Los sitios — farmacias', () => {
  let sitios: SitiosEnMemoria;

  before(() => {
    // ⚠️ Desde la validación espacial (24/08) los sitios NO se cargan solos:
    // necesitan el callejero para poder comprobar dónde cae cada coordenada y
    // para rescatar la que esté mal. Recibirlos ya cargados es el patrón de la
    // casa —lo mismo hace `cargarCallejero` con los portales—: nadie parsea
    // dos veces los mismos 10 MB.
    const portales = cargarPortales();
    sitios = cargarSitios(portales, cargarCallejero(portales));
  });

  test('⭐ carga las TRES categorías, y las cuenta una a una', () => {
    // ⚠️ Esta prueba decía «313 / 310 / 3» y era el fichero de farmacias solo.
    // La segunda tanda (24/08) mete centros de salud y hospitales, así que la
    // expectativa se mueve — y se mueve a MÁS detalle, no a menos: la suma
    // sola escondería de qué categoría falta cada coordenada.
    //
    // Los tres recuentos son DEL DATO, medidos sobre lo descargado y escritos
    // en las fichas § 1.16, § 1.17 y § 1.18.
    assert.deepEqual(
      sitios.porCategoria.map((c) => [c.tipo, c.total, c.conCoordenada, c.sinCoordenada]),
      [
        ['farmacia', 313, 310, 3],
        // ⚠️ Este bailó dos veces el 24/08. Con la validación espacial bajó a
        // 55: el de PORTUGAL tiene punto pero el punto no vale, y sin dirección
        // con número no había forma de rescatarlo. Con la corrección manual de
        // Antonio vuelve a 56 — no porque se le perdone, sino porque **ya tiene
        // una coordenada buena** y esa sí pasa los dos cheques.
        ['centro-salud', 56, 56, 0],
        ['hospital', 17, 15, 2],
        // ⭐ La cuarta (25/08), y la primera COMPUESTA: sus 77 salen de dos
        // ficheros municipales —la categoría 35 y la 223— deduplicados por id.
        ['biblioteca', 77, 75, 2],
      ],
    );
    // Y la suma, que es lo que ve el resto del motor. Escrita a mano: si se
    // calculara aquí, esto compararía el código consigo mismo.
    assert.equal(sitios.total, 463);
    assert.equal(sitios.conCoordenada, 456);
    assert.equal(sitios.sinCoordenada, 7);
  });

  test('⭐ REGLA B — al índice solo entran los que tienen coordenada', () => {
    // «Sin coordenada no existe» (Antonio, 23/08). Un destino que no se puede
    // situar no se puede enrutar, y sugerirlo sería prometer una ruta que
    // acaba en un aviso. [DOC Pelias] indexa *venues* con su punto; sin punto
    // no hay documento que indexar.
    assert.equal(sitios.indice.length, 456);
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

    // Y por el otro lado: la presentación de UNA FARMACIA se compone siempre
    // igual. Se acota a las farmacias desde la segunda tanda (24/08): en
    // centros de salud y hospitales el título SÍ se lee, porque es el nombre
    // del establecimiento y no el de una persona (§ 1.18). Exigir aquí el
    // mismo molde para las tres dejaría la mitad del índice sin nombre.
    for (const s of sitios.indice.filter((x) => x.tipo === 'farmacia')) {
      assert.ok(
        s.presentacion === `Farmacia · ${s.calle}`,
        `una presentación de farmacia no es «Farmacia · calle»: ${s.presentacion}`,
      );
    }
  });

  test('⭐ y en las otras dos categorías el título SÍ se lee, y es el del dato', () => {
    // La otra mitad de la decisión, y va con guardián propio para que no se
    // pueda cumplir «no enseñar el título» apagándolo en todas partes.
    const conTitulo = sitios.indice.filter((x) => x.tipo !== 'farmacia');
    assert.equal(conTitulo.length, 146, 'no están los 56 + 15 + 75 que entran al índice');
    for (const s of conTitulo) {
      assert.ok(
        s.presentacion.endsWith(` · ${s.calle}`),
        `la presentación no acaba en su calle: ${s.presentacion}`,
      );
      assert.ok(
        !s.presentacion.startsWith(`${s.categoria} · `),
        `«${s.presentacion}» se presenta con la categoría y no con su título`,
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
    // ⚠️ Eran dos hasta el 24/08, tres con la segunda tanda y CUATRO desde el
    // 25/08: las bibliotecas meten el Centro Meteorológico Territorial de
    // Aragón, La Rioja y **Navarra**, que casa por el nombre y no por la calle.
    // La expectativa se mueve porque cambió el DATO, no la regla.
    //
    // Y el orden se cuadra contra la fórmula, no contra lo que salga: las
    // cuatro empatan a EXACTA —«navarra» es palabra entera en las cuatro, en la
    // calle las tres primeras y en el nombre la cuarta—, así que manda el
    // alfabético por la dirección normalizada:
    //     «avda. de navarra» < «avenida de navarra» < «c/ dona blanca…» < «po del canal»
    //          a                    a                     c                    p
    assert.deepEqual(
      sugerirSitios(sitios, 'navarra').map((x) => x.presentacion),
      [
        'Farmacia · Avda. de Navarra, 65',
        'Centro de Especialidades Inocencio Jiménez · Avenida de Navarra, 78',
        'Farmacia · C/ Doña Blanca de Navarra, 46-48',
        'Biblioteca del Centro Meteorológico Territorial de Aragón, La Rioja y Navarra · Pº del Canal, 17',
      ],
    );
  });

  test('⭐ EL FOCO SUBE LO CERCANO [Pelias focus.point]', () => {
    // El mismo empate de arriba, con el otro extremo ya resuelto. Puesto el
    // foco encima de Doña Blanca, esa pasa delante — y la otra NO desaparece,
    // que es lo que separa un foco de un filtro.
    // Lo que se afirma no es una lista: es QUIÉN VA PRIMERO, y que la lejana
    // sigue estando. Con tres candidatas desde el 24/08, escribir las tres
    // enteras haría que esta prueba se rompiera cada vez que entre un dato
    // nuevo por esa calle, sin que la regla haya cambiado.
    const juntoADonaBlanca = { lon: -0.898502, lat: 41.652574 };
    const conFoco = sugerirSitios(sitios, 'navarra', juntoADonaBlanca);
    assert.equal(conFoco[0]!.presentacion, 'Farmacia · C/ Doña Blanca de Navarra, 46-48');
    assert.equal(conFoco.length, sugerirSitios(sitios, 'navarra').length, 'el foco ha filtrado');

    // Y al revés, con el foco en la otra: la que sube es la otra.
    const juntoALaAvenida = { lon: -0.90672, lat: 41.655212 };
    const alReves = sugerirSitios(sitios, 'navarra', juntoALaAvenida);
    assert.equal(alReves[0]!.presentacion, 'Farmacia · Avda. de Navarra, 65');
    assert.ok(
      alReves.some((x) => x.presentacion.includes('Doña Blanca')),
      'la lejana ha desaparecido: el foco prioriza, no filtra',
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
    // todas las que casan.
    //
    // ⚠️ Esta prueba se escribió contra las 310 farmacias, y la segunda tanda
    // la puso roja **por un fallo suyo**: comparaba las diez que salen contra
    // el ÍNDICE ENTERO, y desde el 24/08 el índice tiene 71 sitios que no
    // casan con «far». Reclamaba que un centro de salud cercano tenía que
    // haber salido en una búsqueda que no casa con él.
    //
    // Se rehace con quince sitios de laboratorio que casan TODOS, puestos a
    // distancias conocidas y crecientes. Así la prueba dice exactamente lo
    // suyo —el corte se hace después de ordenar— sin depender de cuántas
    // categorías haya ni de si casan.
    const foco = { lon: -0.88, lat: 41.65 };
    const quince = Array.from({ length: 15 }, (_, i) =>
      // El nº 0 el más lejano y el 14 el más cercano, para que el orden del
      // índice sea justo el CONTRARIO del que debe salir.
      sitioDe(`Sitios.${100 + i}`, `C/ Igual, ${100 + i}`, foco.lon + (15 - i) * 0.01, foco.lat),
    );

    const salen = sugerirSitios(indiceDe(...quince), 'igual', foco);
    assert.equal(salen.length, LIMITE_SITIOS);
    // Las diez MÁS CERCANAS son las diez últimas del índice, de la más cercana
    // a la más lejana: 114, 113, … 105.
    assert.deepEqual(
      salen.map((x) => x.codigo),
      Array.from({ length: 10 }, (_, i) => `Sitios.${114 - i}`),
    );
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
      tipo: 'farmacia',
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
      rescatados: [],
      corregidos: [],
      invalidos: [],
      porCategoria: [
        {
          tipo: 'farmacia',
          categoria: 'Farmacia',
          total: unos.length,
          conCoordenada: unos.length,
          sinCoordenada: 0,
          corregidos: 0,
          rescatados: 0,
          invalidos: 0,
          duplicados: 0,
        },
      ],
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

  // ── EL FILTRO DE CAPA ──────────────────────────────────────────────────────
  //
  // ⭐ [DOC Pelias] `layers` acota la búsqueda a una capa —su ejemplo es
  // `layers=address,venue`— y admite capas personalizadas. Aquí es lo que
  // sostiene el buscador por tipos del 24/08: el desplegable del formulario
  // elige una categoría y el cajetín deja de mezclar.
  //
  // Va como PARÁMETRO de `/api/sitios`, no como endpoint nuevo: la búsqueda es
  // la misma —mismas palabras, mismo orden, mismo foco— y lo único que cambia
  // es sobre qué se busca. Un `/api/farmacias` sería tres endpoints que hay que
  // mantener a la par y que se separarían a la primera.

  test('⭐ CON CAPA, solo salen los de esa categoría', () => {
    // «navarra» sin filtro trae farmacias Y un centro de especialidades.
    const todas = sugerirSitios(sitios, 'navarra');
    assert.ok(
      new Set(todas.map((x) => x.tipo)).size > 1,
      'la prueba no vale: sin filtro ya salía una sola categoría',
    );

    const soloFarmacias = sugerirSitios(sitios, 'navarra', null, 'farmacia');
    assert.ok(soloFarmacias.length > 0);
    assert.deepEqual([...new Set(soloFarmacias.map((x) => x.tipo))], ['farmacia']);

    const soloCentros = sugerirSitios(sitios, 'navarra', null, 'centro-salud');
    assert.ok(soloCentros.length > 0);
    assert.deepEqual([...new Set(soloCentros.map((x) => x.tipo))], ['centro-salud']);
  });

  test('⭐ el filtro NO cambia el orden de los que quedan', () => {
    // La capa quita, no reordena: los que sobreviven vienen en el mismo orden
    // relativo que traían sin filtro. Si el filtro se aplicara DESPUÉS del
    // corte a diez, esto seguiría pasando pero faltarían resultados — por eso
    // hay abajo una prueba aparte del corte.
    const conFiltro = sugerirSitios(sitios, 'navarra', null, 'farmacia').map((x) => x.codigo);
    const sinFiltro = sugerirSitios(sitios, 'navarra')
      .filter((x) => x.tipo === 'farmacia')
      .map((x) => x.codigo);
    assert.deepEqual(conFiltro, sinFiltro);
  });

  test('⭐ el filtro va ANTES del corte, no después', () => {
    // «far» casa con las 310 farmacias y con nada más, así que filtrar por
    // hospital tiene que dar CERO — y no «las diez primeras, de las que
    // ninguna es hospital», que es lo que saldría filtrando al final.
    assert.equal(sugerirSitios(sitios, 'far', null, 'hospital').length, 0);
    // Y al revés: «hospital» filtrado por hospital devuelve DIEZ, el tope, no
    // los que queden de una primera tanda mezclada.
    assert.equal(sugerirSitios(sitios, 'hospital', null, 'hospital').length, LIMITE_SITIOS);
  });

  test('sin capa, todo sigue igual que antes', () => {
    // El filtro es opcional y su ausencia no cambia nada: es lo que permite
    // que el resto de las pruebas de este fichero sigan valiendo.
    assert.deepEqual(
      sugerirSitios(sitios, 'navarra', null, null).map((x) => x.codigo),
      sugerirSitios(sitios, 'navarra').map((x) => x.codigo),
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

describe('Los sitios — la validación espacial', () => {
  let sitios: SitiosEnMemoria;

  before(() => {
    const portales = cargarPortales();
    sitios = cargarSitios(portales, cargarCallejero(portales));
  });

  /** Lo que los tres ficheros municipales traen, sin pasar por el motor. */
  function crudos(): Map<string, { calle: string; lon: number; lat: number }> {
    const fuera = new Map<string, { calle: string; lon: number; lat: number }>();
    const ficheros: [string, string][] = [
      ['Farmacias', '2026-08-23_zgzapi_equipamiento-farmacias.json'],
      ['CentrosSalud', '2026-08-24_zgzapi_equipamiento-centros-salud.json'],
      ['Hospitales', '2026-08-24_zgzapi_equipamiento-hospitales.json'],
      ['Bibliotecas', '2026-08-25_zgzapi_equipamiento-bibliotecas.json'],
      ['Bibliotecas', '2026-08-25_zgzapi_equipamiento-bibliotecas-especializadas.json'],
    ];
    for (const [prefijo, fichero] of ficheros) {
      const crudo = JSON.parse(
        readFileSync(fileURLToPath(new URL(`../../app/data/${fichero}`, import.meta.url)), 'utf8'),
      ) as {
        equipamiento: { id: number; calle?: string; geometry?: { coordinates?: number[] } }[];
      };
      for (const r of crudo.equipamiento) {
        const c = r.geometry?.coordinates;
        if (c && c.length >= 2) {
          fuera.set(`${prefijo}.${r.id}`, { calle: r.calle ?? '', lon: c[0]!, lat: c[1]! });
        }
      }
    }
    return fuera;
  }

  test('⭐ LA TABLA de validación, categoría por categoría', () => {
    // Revisadas = las que traen punto. De ellas, las rescatadas se mueven a su
    // portal y las inválidas se caen del índice. Escritas a mano, una a una.
    assert.deepEqual(
      sitios.porCategoria.map((c) => [
        c.tipo,
        c.total - c.sinCoordenada,
        c.corregidos,
        c.rescatados,
        c.invalidos,
      ]),
      [
        ['farmacia', 310, 0, 7, 0],
        ['centro-salud', 56, 1, 2, 0],
        // ⭐ CERO en hospitales, y no por casualidad: son recintos y quedan
        // fuera del cheque de distancia por decisión firmada.
        ['hospital', 15, 0, 0, 0],
        // ⭐ Y CERO en bibliotecas por lo mismo (25/08): también son recintos.
        // Aplicándoles el cheque de chicos se moverían OCHO, y la ida y vuelta
        // dice que las ocho están bien puestas — una de ellas se iría 4.825 m.
        ['biblioteca', 75, 0, 0, 0],
      ],
    );
    assert.equal(sitios.corregidos.length, 1);
    assert.equal(sitios.rescatados.length, 9);
    // ⭐ NINGUNA inválida ya: la única que había se corrigió a mano.
    assert.equal(sitios.invalidos.length, 0);
  });

  test('⭐ EL DE PORTUGAL, CORREGIDO A MANO: vuelve al índice y se puede elegir', () => {
    // ⚠️ Esta prueba exigía lo contrario hasta el 24/08 por la tarde: que el
    // 9090 se cayera del índice y no se sugiriera jamás. Era verdad mientras
    // nadie supiera dónde está de verdad — su coordenada era Portugal y su
    // dirección, «C/ Domingo Miral, s/n», no tiene número que rescatar.
    //
    // Lo que la deroga no es código: es **el dato**. Antonio confirmó la
    // coordenada sobre el terreno y con ella el centro de salud vuelve a ser un
    // destino. Es el remate del método de la lista de Kenia: lo que el proceso
    // no puede arreglar se manda a quien conoce el sitio, y lo que vuelve
    // confirmado entra — declarado, no a escondidas.
    const sitio = sitios.donde.get('CentrosSalud.9090');
    assert.ok(sitio, 'el 9090 sigue fuera del índice');
    assert.equal(sitio.lat, 41.6402816);
    assert.equal(sitio.lon, -0.9011954);

    // Y se encuentra escribiendo, que es de lo que se trataba.
    const sale = sugerirSitios(sitios, 'fernando el catolico', null, 'centro-salud');
    assert.deepEqual(
      sale.map((x) => x.codigo),
      ['CentrosSalud.9090'],
    );
    assert.match(sale[0]!.presentacion, /^Centro de Salud Fernando El Católico · /);
  });

  test('⭐ y la corrección va DECLARADA: quién lo dice, por qué, y desde dónde', () => {
    // El patrón de las cinco correcciones del callejero (§ 1.3): una corrección
    // sin fuente escrita es un número que alguien puso un día.
    assert.deepEqual(
      sitios.corregidos.map((c) => [c.codigo, c.lat, c.lon, c.motivo]),
      [['CentrosSalud.9090', 41.6402816, -0.9011954, 'frontera: la coordenada municipal cae en Portugal']],
    );
    assert.match(sitios.corregidos[0]!.fuente, /confirmación manual de Antonio/);
    // Y de dónde venía, que es lo que permite ver el tamaño del arreglo.
    assert.equal(sitios.corregidos[0]!.lonMunicipal, -8.184875254157216);
    assert.equal(sitios.corregidos[0]!.latMunicipal, 41.542372909710075);
  });

  test('⭐ el FICHERO MUNICIPAL sigue diciendo Portugal: no se ha editado', () => {
    // La corrección vive en memoria y en su tabla declarada. El dato entra como
    // vino — es la norma de la casa y el precedente de la validación espacial.
    const c = crudos().get('CentrosSalud.9090')!;
    assert.equal(c.lon, -8.184875254157216);
    assert.equal(c.lat, 41.542372909710075);
    assert.equal(c.calle, 'C/ Domingo Miral, s/n');
  });

  test('⭐ LAS NUEVE RESCATADAS, una a una y con sus metros de desvío', () => {
    assert.deepEqual(
      [...sitios.rescatados]
        .sort((a, b) => b.metros - a.metros)
        .map((r) => [r.codigo, Math.round(r.metros), r.porQue]),
      [
        ['CentrosSalud.9080', 497, 'distancia'],
        ['Farmacias.20445', 236, 'distancia'],
        ['Farmacias.20443', 236, 'distancia'],
        ['Farmacias.8671', 236, 'distancia'],
        ['Farmacias.20444', 236, 'distancia'],
        ['Farmacias.9013', 198, 'distancia'],
        ['CentrosSalud.28600', 110, 'distancia'],
        ['Farmacias.20530', 76, 'distancia'],
        ['Farmacias.8939', 52, 'distancia'],
      ],
    );
  });

  test('⭐ una rescatada queda EXACTAMENTE en su portal, no cerca', () => {
    // «C/ La Caza, 11»: el Ayuntamiento la publica 236 m al suroeste, con el
    // mismo vector de desvío que otras tres del mismo barrio. Ahora vive donde
    // el censo pone el 11 de La Caza.
    const farmacia = sitios.donde.get('Farmacias.20444');
    assert.ok(farmacia);
    assert.equal(farmacia.lon, -0.924971);
    assert.equal(farmacia.lat, 41.616909);
    // Y su origen queda escrito: de dónde venía y a qué portal se fue.
    const r = sitios.rescatados.find((x) => x.codigo === 'Farmacias.20444')!;
    assert.equal(r.lonMunicipal, -0.9263253602068995);
    assert.equal(r.latMunicipal, 41.6150414308692);
    assert.equal(r.portal, 'Portales.98467');
    assert.equal(r.via, 'CALLE LA CAZA');
    assert.equal(r.numero, '11');
  });

  test('⭐ y NADIE MÁS se mueve: los otros 371 conservan su coordenada', () => {
    // 456 en el índice, menos los 9 rescatados y el 1 corregido a mano.
    // El guardián de la costura: el rescate solo toca ROTAS. Si un día una
    // sana acabara movida, esto se pone rojo — se compara contra el fichero
    // municipal, no contra otra parte del motor.
    const delFichero = crudos();
    const movidos = [
      ...sitios.rescatados.map((r) => r.codigo),
      // El corregido a mano también se ha movido, y por eso se excluye aquí en
      // vez de dejar que la prueba lo cace: está contado en su propia tabla.
      ...sitios.corregidos.map((c) => c.codigo),
    ];
    let comprobados = 0;
    for (const s of sitios.indice) {
      if (movidos.includes(s.codigo)) {
        continue;
      }
      const c = delFichero.get(s.codigo)!;
      assert.equal(s.lon, c.lon, `${s.codigo} ha cambiado de longitud`);
      assert.equal(s.lat, c.lat, `${s.codigo} ha cambiado de latitud`);
      comprobados++;
    }
    assert.equal(comprobados, 446);
  });

  test('⭐ LA CATEGORÍA COMPUESTA: dos ficheros municipales, un solo tipo', () => {
    // Bibliotecas es la primera categoría del proyecto que no sale de un
    // fichero sino de dos: la 35 «Bibliotecas» (75) y la 223 «Bibliotecas
    // Especializadas» (2). En el índice son UNA sola cosa —mismo tipo, mismo
    // prefijo de código, misma lista de sugerencias—, y los dos ficheros son
    // un detalle de la fuente, no del producto.
    const suyas = sitios.indice.filter((x) => x.tipo === 'biblioteca');
    assert.equal(suyas.length, 75);
    for (const b of suyas) {
      assert.ok(b.codigo.startsWith('Bibliotecas.'), `${b.codigo} no lleva el prefijo`);
    }
    // Una de cada fichero, para que la prueba toque las dos fuentes: la
    // Biblioteca para Jóvenes Cubit es de la 35, y la del Museo de Goya, de la
    // 223. Si un día se cayera un fichero, esto se pone rojo.
    assert.match(sitios.donde.get('Bibliotecas.4946')!.presentacion, /^Biblioteca para Jóvenes Cubit · /);
    assert.match(sitios.donde.get('Bibliotecas.12239')!.presentacion, /^Biblioteca del Museo de Goya/);
  });

  test('⭐ LA DEDUPLICACIÓN, con registros de laboratorio', () => {
    // ⚠️ El dato real no ejecuta esta rama: las dos categorías de bibliotecas
    // no comparten ni un id, así que hoy no se cae ninguno. Una rama que nadie
    // ejecuta es una rama sin vigilar, y por eso `sinRepetidos` está exportada
    // y se le dan registros inventados — igual que `enPalabras`.
    assert.deepEqual(sinRepetidos([]), { unicos: [], duplicados: 0 });

    const a = { id: 1, quien: 'del primer fichero' };
    const b = { id: 2, quien: 'otro' };
    const aBis = { id: 1, quien: 'del segundo fichero' };
    const r = sinRepetidos([a, b, aBis]);
    assert.equal(r.duplicados, 1);
    // ⭐ Gana EL PRIMERO, que es el del fichero declarado primero en `FUENTES`.
    // No es un detalle: decide con qué título y con qué coordenada se queda.
    assert.deepEqual(r.unicos, [a, b]);

    // Y el caso feo: el mismo id tres veces son dos duplicados, no uno.
    assert.equal(sinRepetidos([a, aBis, aBis]).duplicados, 2);
    assert.equal(sinRepetidos([a, aBis, aBis]).unicos.length, 1);
  });

  test('⭐ y se DEDUPLICA por id: entra una vez aunque esté en las dos', () => {
    // Componer dos fuentes obliga a deduplicar. Hoy no hay ni un duplicado
    // —las dos categorías municipales no comparten ningún id—, y la cuenta se
    // lleva igual: es la que avisaría el día que el Ayuntamiento mueva un
    // registro de una categoría a la otra.
    const suya = sitios.porCategoria.find((c) => c.tipo === 'biblioteca')!;
    assert.equal(suya.duplicados, 0);
    // Y por si acaso, contado desde el otro lado: ningún código repetido.
    const codigos = sitios.indice.map((x) => x.codigo);
    assert.equal(new Set(codigos).size, codigos.length);
  });

  test('⭐ NINGUNA BIBLIOTECA se mueve: recinto, como los hospitales', () => {
    // ⚠️ El encargo las traía como «sitio chico» y el dato dijo que no. Ocho se
    // habrían movido, y la ida y vuelta demostró que las ocho están BIEN: son
    // cuartos dentro de recintos —un hospital, una facultad, un campus de
    // investigación— y su punto está en otra parte del recinto, no mal puesto.
    //
    // El caso que lo cerró: `Bibliotecas.12320`, la biblioteca DEL HOSPITAL
    // MIGUEL SERVET, con el mismo desvío de 169 m que el hospital y su punto a
    // 1 m del mismo portal. El hospital ya era recinto y no se movía; su
    // biblioteca, como «chico», sí. El mismo edificio con dos criterios.
    const delFichero = crudos();
    for (const s of sitios.indice.filter((x) => x.tipo === 'biblioteca')) {
      const c = delFichero.get(s.codigo)!;
      assert.equal(s.lon, c.lon, `${s.codigo} se ha movido`);
      assert.equal(s.lat, c.lat, `${s.codigo} se ha movido`);
    }
    // Y el caso testigo, con su cifra: si alguien metiera las bibliotecas en el
    // cheque de distancia, esta se iría 4.825 m a la otra punta de la avenida.
    const cita = sitios.donde.get('Bibliotecas.12521')!;
    assert.equal(cita.lon, delFichero.get('Bibliotecas.12521')!.lon);
  });

  test('⭐ NINGÚN HOSPITAL se mueve: la partición firmada, vigilada', () => {
    // El Miguel Servet está a 169 m del portal que su propia dirección declara
    // y eso NO es un error: es otra de sus entradas [Nominatim #536]. Si un día
    // alguien metiera los recintos en el cheque de distancia, esto lo caza —
    // y con ello se caerían las juez J10 y J11 del banco.
    const delFichero = crudos();
    for (const s of sitios.indice.filter((x) => x.tipo === 'hospital')) {
      const c = delFichero.get(s.codigo)!;
      assert.equal(s.lon, c.lon, `${s.codigo} se ha movido`);
      assert.equal(s.lat, c.lat, `${s.codigo} se ha movido`);
    }
    const servet = sitios.donde.get('Hospitales.9040')!;
    assert.equal(servet.lon, delFichero.get('Hospitales.9040')!.lon);
  });
});
