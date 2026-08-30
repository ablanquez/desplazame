/**
 * ⭐ EL BANCO DE SENTIDOS (29/08, rehecho el 30/08): un juez, un mecanismo
 * vacío y nueve testigos.
 *
 * ⚠️ **Este fichero nació el 29/08 defendiendo una corrección que estaba MAL.**
 * La Calle Monasterio de Siresa se corrigió a `-1` —al revés del dibujo de
 * OSM— y el 30/08 Antonio precisó la dirección exacta sobre el terreno: la
 * calle es de sentido único **HACIA el Doctor Iranzo**, y no se entra desde
 * él. Eso es exactamente lo que OSM ya decía con su `oneway=yes`. La fila se
 * retiró y las jueces se rehicieron para comprar **la verdad del terreno** en
 * vez del valor de la tabla. Ver la entrada del 30/08 de `docs/BITACORA.md`.
 *
 * Tres clases de prueba viven aquí, y conviene no confundirlas:
 *
 * 1. **EL JUEZ DE SIRESA.** Ya no vigila una corrección: vigila **la calle**.
 *    Compra que solo se puede recorrer hacia el Doctor Iranzo, venga ese
 *    sentido de donde venga —hoy, del fichero de OSM sin tocar—. Si alguien
 *    vuelve a meter la fila invertida, se pone rojo.
 * 2. **EL GUARDIÁN DEL MECANISMO.** La tabla está **vacía y viva**: las tres
 *    cerraduras de `sentidos-corregidos.ts` siguen ahí, probadas con una fila
 *    de mentira, para que la próxima corrección —la que sí venga del ojo—
 *    nazca con su deshielo puesto.
 * 3. ⚠️ **LOS TESTIGOS**, y estos son al revés que todo lo demás de la casa:
 *    **documentan la conducta de HOY, que se sospecha equivocada**, y están
 *    escritos **para caerse** el día que la corrección llegue. Un testigo en
 *    verde no es una buena noticia: es la foto de un candidato que sigue sin
 *    verificar. Es el patrón del Andrés Oliván — el testigo de la bitácora
 *    nº14, que documenta un fallo vivo hasta que se arregla.
 *
 * ── De dónde salen los testigos ─────────────────────────────────────────────
 *
 * De la **sonda-Cygnus** del 29/08 [patrón Telenav: conflar el dato abierto
 * local contra OSM y **dar la lista a verificar, nunca subirla a ciegas**;
 * ImproveOSM declara un 6 % de falsos positivos en esta misma clase de
 * detección]. La sonda cruza `doble_sent` de MU1 contra `oneway` de OSM vía a
 * vía y saca 434 candidatos en cuatro clases; la lista entera vive en el
 * scratchpad y es la mesa de Antonio.
 *
 * **Ninguno de estos nueve está verificado.** No se corrige ni uno hasta que
 * Antonio los mire: aquí solo se deja constancia de qué hace el motor hoy con
 * ellos, con su número, para que el día del arreglo se vea exactamente qué
 * cambió.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRedDeLaRueda, type RedDeLaRueda } from './red-rueda.ts';
import { cargarRejilla, enganchar, type Rejilla } from './proyeccion.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { entornoDe } from './gacetero.ts';
import { cuadernoPara, type Ruta, type TrozoDeRuta } from './ruta.ts';
import { admiteComoPuerta, calcularRutaRodando } from './rodando.ts';
import { SENTIDOS_CORREGIDOS, sentidoCorregidoDe } from './sentidos-corregidos.ts';

let rueda: RedDeLaRueda;
let rejilla: Rejilla;
let portales: PortalesEnMemoria;
let peaton: RedEnMemoria;

type Punto = [number, number];

/** Las aristas de un *way*, en orden de índice. */
function aristasDe(way: number): number[] {
  const ks: number[] = [];
  for (let k = 0; k < rueda.aristas.length; k++) {
    if (rueda.aristas[k]!.way === way) ks.push(k);
  }
  return ks;
}

function rodar(a: Punto, b: Punto): Ruta | null {
  const eo = enganchar(rueda, rejilla, a[0], a[1], (x) => admiteComoPuerta(rueda, x, 'bici'));
  const ed = enganchar(rueda, rejilla, b[0], b[1], (x) => admiteComoPuerta(rueda, x, 'bici'));
  if (!eo || !ed) return null;
  return calcularRutaRodando(rueda, cuadernoPara(rueda), 'bici', eo, a, ed, b);
}

/**
 * Los trozos de una ruta que caen en Siresa **y avanzan**.
 *
 * ⚠️ Los de **cero metros** se quedan fuera, y no es un descarte de
 * conveniencia: la puerta de un extremo deja un muñón cuya `g` es el mismo
 * punto repetido —`[-0.861679,41.647264]` dos veces— y **un segmento de
 * longitud cero no apunta a ninguna parte**. Preguntarle la dirección no da
 * «oeste»: no da nada. Lo que sí se mira, y aquí importa, es que la suma de
 * metros de esos trozos sea la que se espera.
 */
function porSiresa(r: Ruta): readonly TrozoDeRuta[] {
  return r.trozos.filter((t) => rueda.aristas[t.arista]!.way === 24433275 && t.metros > 0);
}

/** Los metros de Siresa que una ruta se come, muñones incluidos. */
function metrosDeSiresa(r: Ruta): number {
  return r.trozos
    .filter((t) => rueda.aristas[t.arista]!.way === 24433275)
    .reduce((m, t) => m + t.metros, 0);
}

/**
 * ⭐ ¿Ese trozo se anduvo hacia el ESTE? Es la pregunta entera de este fichero.
 *
 * `t.g` es la geometría **en el orden en que se recorrió**, no la de la arista:
 * por eso sirve para saber la dirección real y la del `way` no. Siresa va casi
 * recta de oeste a este —de `-0.8665` a `-0.8617`—, así que comparar la
 * longitud de los extremos basta y no hace falta rumbo ninguno.
 */
function haciaElEste(t: TrozoDeRuta): boolean {
  return t.g[t.g.length - 1]![0]! > t.g[0]![0]!;
}

/** Las dos puntas de un *way*, para recorrerlo entero en los dos sentidos. */
function puntasDe(way: number): readonly [Punto, Punto] {
  const ks = aristasDe(way);
  const primera = rueda.aristas[ks[0]!]!;
  const ultima = rueda.aristas[ks[ks.length - 1]!]!;
  return [primera.g[0] as Punto, ultima.g[ultima.g.length - 1] as Punto];
}

describe('⭐ LOS SENTIDOS: la corrección de Siresa y el banco de testigos', () => {
  before(() => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    portales = cargarPortales();
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    rejilla = cargarRejilla(rueda);
  });

  /**
   * ⭐ EL JUEZ DE SIRESA — **la calle solo se recorre hacia el Doctor Iranzo**.
   *
   * `way 24433275`, Calle Monasterio de Siresa, 10 aristas y 414,1 m. OSM la
   * dibuja de **oeste a este** —de `-0.866521, 41.647517` a
   * `-0.861679, 41.647264`— y la etiqueta `oneway=yes`. Antonio, sobre la
   * calle, el 30/08: *sentido único **hacia** el Doctor Iranzo; no se entra
   * desde el Doctor Iranzo*. **El sentido del dibujo es el bueno**, y por eso
   * hoy no hay nada que corregir. (Ninguna de las dos puntas toca el Doctor
   * Iranzo: la del oeste queda a 216 m y la del este a 185 m, medido sobre la
   * red. Quien dice la dirección es el ojo, no esa diferencia de 31 m.)
   *
   * ⚠️ **Lo que esta juez compra es la verdad del terreno, no un valor de una
   * tabla.** Da igual de dónde salga el sentido —hoy sale del `oneway=yes` de
   * § 1.21, sin corrección ninguna—: lo que no puede pasar es que un trozo de
   * ruta recorra Siresa hacia el oeste. Se mira **`t.g`**, la geometría del
   * trozo en el orden en que se anduvo, no la de la arista.
   *
   * Y por eso la juez de ayer no valía. Compraba `sentido === -1` y «la ruta
   * no pisa la calle», que son las dos cosas que la corrección **equivocada**
   * producía; con ella puesta, bajar Siresa hacia Iranzo era imposible
   * —`SIN RUTA`— y lo único que el motor permitía era entrar desde Iranzo,
   * 414,1 m a contramano. Estuvo verde el día entero. Ver bitácora del 30/08.
   */
  test('⭐ el juez de Siresa: se baja hacia Iranzo y NO se remonta desde Iranzo', () => {
    const ks = aristasDe(24433275);
    assert.equal(ks.length, 10, 'la Calle Monasterio de Siresa tiene 10 aristas');
    for (const k of ks) {
      assert.equal(
        rueda.sentido[k],
        1,
        `la arista ${k} va en el sentido del dibujo (oeste→este, hacia Iranzo)`,
      );
    }

    // Las dos puntas de la calle, para recorrerla entera en los dos sentidos.
    const [oeste, este] = puntasDe(24433275);

    // ⭐ HACIA IRANZO (el sentido bueno): se baja la calle entera y punto.
    const bajando = rodar(oeste, este)!;
    assert.ok(bajando, 'hacia Iranzo tiene que haber ruta');
    assert.equal(
      new Set(porSiresa(bajando).map((t) => t.arista)).size,
      10,
      'se recorre la calle entera, arista a arista',
    );
    assert.equal(Math.round(bajando.metros), 414);

    assert.ok(Math.abs(metrosDeSiresa(bajando) - 414.1) < 0.1, 'los 414,1 m de la calle');

    // ⭐ DESDE IRANZO (el sentido prohibido): hay que RODEAR, y **no se
    // recorre ni un metro de la calle**. Lo único de Siresa que aparece es el
    // muñón de 0,00 m de la puerta del origen, que no es andar: es estar.
    const remontando = rodar(este, oeste)!;
    assert.ok(remontando, 'desde Iranzo tiene que haber ruta, aunque sea rodeando');
    assert.equal(metrosDeSiresa(remontando), 0, 'ni un metro de Siresa se anda desde Iranzo');
    assert.equal(Math.round(remontando.metros), 602);
    assert.ok(
      remontando.metros > bajando.metros,
      `el rodeo tiene que costar: ${remontando.metros.toFixed(1)} vs ${bajando.metros.toFixed(1)}`,
    );

    // ⭐ Y EL INVARIANTE, el que la juez de ayer no miraba: NINGÚN trozo de
    // Siresa se anda hacia el oeste. En ninguna de las dos rutas.
    for (const [nombre, r] of [['bajando', bajando], ['remontando', remontando]] as const) {
      for (const t of porSiresa(r)) {
        assert.ok(
          haciaElEste(t),
          `${nombre}: la arista ${t.arista} se anduvo hacia el OESTE, y eso es contramano`,
        );
      }
    }
  });

  /**
   * ⭐ LAS DOS RUTAS DEL CASO, volcadas con sus metros.
   *
   * Es la ruta que empezó todo esto: `COLOSO 2 → LEOPOLDO ROMEO 27` en bici, y
   * su vuelta. Se dejan aquí las dos con su cifra para que el día que algo las
   * mueva se vea cuánto y hacia dónde.
   *
   * Lo que la reversión les hizo, medido: **la ida no se movió ni un metro**
   * —nunca pisó Siresa, ni con la corrección ni sin ella—, y **la vuelta bajó
   * de 5.199,0 a 5.122,4 m**, 76,6 menos, porque ahora puede bajar Siresa
   * hacia Iranzo en vez de rodearla.
   *
   * ⚠️ **Y esta juez NO exige que ninguna de las dos evite Siresa.** Bajar la
   * calle hacia el Doctor Iranzo es legal; si el coste quiere pasar por ahí,
   * que pase. Lo único que no se admite es que un trozo la remonte. Exigir que
   * no la pise sería volver al error de ayer —comprar un resultado en vez de
   * la causa— y ataría la ruta a un rodeo que nadie ha pedido.
   */
  test('⭐ las dos rutas del caso: sus metros, y ni un trozo a contramano', () => {
    const origen = portales.donde.get('Portales.93310')!;
    const destino = portales.donde.get('Portales.79358')!;
    const ida = rodar([origen.lon, origen.lat], [destino.lon, destino.lat])!;
    const vuelta = rodar([destino.lon, destino.lat], [origen.lon, origen.lat])!;
    assert.ok(ida && vuelta, 'las dos rutas del ojo de Antonio tienen que existir');

    assert.equal(Math.round(ida.metros), 4551, 'COLOSO 2 → LEOPOLDO ROMEO 27');
    assert.equal(Math.round(vuelta.metros), 5122, 'LEOPOLDO ROMEO 27 → COLOSO 2');

    for (const [nombre, r] of [['ida', ida], ['vuelta', vuelta]] as const) {
      for (const t of porSiresa(r)) {
        assert.ok(haciaElEste(t), `${nombre}: Siresa se anduvo hacia el OESTE, y eso es contramano`);
      }
    }
  });

  /**
   * ⭐ EL MECANISMO, VACÍO Y VIVO — las tres cerraduras siguen cerrando.
   *
   * La tabla se quedó **sin filas** el 30/08, y eso no es que el mecanismo
   * sobre: es que hoy no hay ninguna calle verificada por el ojo. Las
   * cerraduras se prueban con una fila de mentira, porque lo que hay que
   * garantizar es que **la próxima corrección nazca con su deshielo puesto**.
   *
   * [CycleStreets] la *repair table* es una tabla **mantenida**: corrige el
   * dato malo y **se retira cuando el testimonio que la sostenía cae**. Eso es
   * exactamente lo que pasó aquí.
   */
  test('⭐ el mecanismo: la tabla está vacía y las tres cerraduras siguen cerrando', () => {
    assert.deepEqual(SENTIDOS_CORREGIDOS, [], 'hoy no hay ninguna calle verificada por el ojo');

    // Un way que no está en la tabla no se toca: devuelve undefined y ya.
    assert.equal(sentidoCorregidoDe(24433275, 'yes', true), undefined);

    // Y el fichero de § 1.21 sigue diciendo del way de Siresa lo que decía —es
    // el deshielo, que ahora no protege ninguna fila pero sí documenta por qué
    // la de ayer sobraba: OSM ya decía lo que el terreno dice.
    const fichero = fileURLToPath(
      new URL('../data/2026-08-28_osm_overpass_zaragoza-bbox_viario-etiquetas.json', import.meta.url),
    );
    const elementos = JSON.parse(readFileSync(fichero, 'utf8')).elements as {
      id: number;
      tags?: Record<string, string>;
    }[];
    const siresa = elementos.find((w) => w.id === 24433275);
    assert.ok(siresa, 'el way de Siresa tiene que seguir en § 1.21');
    assert.equal(
      siresa.tags?.['oneway'],
      'yes',
      'OSM dice oneway=yes, que es la verdad del terreno: por eso no hay nada que corregir',
    );
  });

  /**
   * ⚠️ LOS TESTIGOS DE LA CLASE A — «MU1 dice sentido único y OSM no lo dice».
   *
   * Estas siete calles las declara el Ayuntamiento de **un solo sentido**
   * (`doble_sent=NO` en MU1) y **ningún *way* de OSM lleva `oneway`**. Hoy la
   * bici las remonta en los dos sentidos, y por eso ida y vuelta miden lo
   * mismo. Si Antonio confirma que el municipal tiene razón, la vuelta pasará a
   * costar un rodeo y **esta prueba se caerá**.
   *
   * Son la clase A1 de la sonda: **71 vías, 223 aristas, 8,5 km** en total.
   */
  test('⚠️ TESTIGO A · siete calles que MU1 dice de un sentido y la bici remonta hoy', () => {
    const CASOS: readonly { way: number; via: string; metros: number; ida: number }[] = [
      { way: 49359902, via: 'Calle La Cometa', metros: 194.2, ida: 289.9 },
      { way: 49359905, via: 'Calle El Pescadoret', metros: 155.2, ida: 155.2 },
      { way: 24320054, via: 'Calle de las Madres de la Plaza de Mayo', metros: 230.1, ida: 230.1 },
      { way: 36112019, via: 'Calle de la Isla de Malta', metros: 125.4, ida: 125.4 },
      { way: 49359908, via: 'Calle El Sueño', metros: 45.8, ida: 45.8 },
      { way: 49359896, via: 'Calle Josefa Bayeu', metros: 135.1, ida: 135.1 },
      { way: 124408532, via: 'Calle de Antonín Dvořák', metros: 256.5, ida: 256.5 },
    ];
    for (const c of CASOS) {
      const ks = aristasDe(c.way);
      assert.ok(ks.length > 0, `${c.via}: el way ${c.way} tiene que estar en la red`);
      const metros = ks.reduce((s, k) => s + rueda.aristas[k]!.metros, 0);
      assert.ok(Math.abs(metros - c.metros) < 0.5, `${c.via}: ${metros.toFixed(1)} m`);
      // ⚠️ HOY: abiertas en los dos sentidos.
      for (const k of ks) {
        assert.equal(rueda.sentido[k], 0, `${c.via}: hoy la arista ${k} no tiene sentido`);
      }
      const [a, b] = puntasDe(c.way);
      const ida = rodar(a, b)!;
      const vuelta = rodar(b, a)!;
      assert.ok(Math.abs(ida.metros - c.ida) < 1, `${c.via}: ida ${ida.metros.toFixed(1)} m`);
      assert.ok(
        Math.abs(ida.metros - vuelta.metros) < 1,
        `${c.via}: hoy la vuelta cuesta lo mismo que la ida (${vuelta.metros.toFixed(1)})`,
      );
    }
  });

  /**
   * ⚠️ LOS TESTIGOS DE LA CLASE B — «OSM dice sentido único y MU1 dice doble».
   *
   * Aquí es al revés: OSM las etiqueta `oneway=yes` y el Ayuntamiento las
   * declara de **doble sentido**. Hoy la bici las rodea. Si el municipal tiene
   * razón, el rodeo desaparecerá y **esta prueba se caerá**.
   *
   * ⚠️ Y esta clase tiene un falso positivo de manual que la sonda ya aparta:
   * **la avenida de doble calzada**, que OSM parte en dos *ways* de sentido
   * único opuestos y MU1 llama —con razón— de doble sentido. Son **156 vías y
   * 145,2 km**, el 98 % de los metros de la clase. Estos dos casos son de la
   * clase B2, la que queda después de apartarlas: **25 vías, 56 aristas,
   * 1,8 km**.
   */
  test('⚠️ TESTIGO B · dos calles que MU1 dice de doble sentido y la bici rodea hoy', () => {
    const CASOS: readonly { way: number; via: string; ida: number; vuelta: number }[] = [
      // 15,5 m de calle que obligan a un rodeo de 554: es el más gordo del lote.
      { way: 24381157, via: 'Calle de Santiago Guallar', ida: 15.5, vuelta: 554.2 },
      { way: 35994309, via: 'Calle de Gran Turismo', ida: 144.6, vuelta: 277.0 },
    ];
    for (const c of CASOS) {
      const ks = aristasDe(c.way);
      assert.ok(ks.length > 0, `${c.via}: el way ${c.way} tiene que estar en la red`);
      for (const k of ks) {
        assert.equal(rueda.sentido[k], 1, `${c.via}: hoy la arista ${k} es de sentido único`);
      }
      const [a, b] = puntasDe(c.way);
      const ida = rodar(a, b)!;
      const vuelta = rodar(b, a)!;
      assert.ok(Math.abs(ida.metros - c.ida) < 1, `${c.via}: ida ${ida.metros.toFixed(1)} m`);
      assert.ok(
        Math.abs(vuelta.metros - c.vuelta) < 1,
        `${c.via}: hoy la vuelta rodea (${vuelta.metros.toFixed(1)} m)`,
      );
      assert.ok(vuelta.metros > ida.metros, `${c.via}: el rodeo tiene que costar`);
    }
  });

  /**
   * ⚠️ Y LA CIFRA QUE MÁS IMPORTA: dónde la sonda es CIEGA.
   *
   * El contraste municipal×OSM no puede ver una inversión, porque `doble_sent`
   * dice **si** hay sentido único y `oneway` dice **cuál** — donde las dos
   * fuentes coinciden en que lo hay, el contraste calla aunque apunten a lados
   * contrarios. **Siresa vivía justo ahí**, y la encontró un ojo mirando una
   * ruta, no esta sonda.
   *
   * Esta prueba no compra una conducta: fija el TAMAÑO del punto ciego, para
   * que nadie lea los 434 candidatos como si fueran todo lo que hay.
   *
   * Lo que el motor puede contar por sí solo son **16.504 aristas de calzada de
   * sentido único con jerarquía municipal detrás**: el universo entero donde una
   * inversión puede esconderse. La sonda afina más —de esas, en **1.185 vías,
   * 7.846 aristas y 299,8 km** las dos fuentes dicen «único» y por tanto el
   * contraste calla—, pero para separarlas hace falta `doble_sent`, que la
   * jerarquía en memoria no lleva: se agrega por vía y aquí no se usa para
   * nada. La cifra fina vive en la sonda, con su comando; esta prueba fija la
   * gruesa, que es la que puede vigilar.
   */
  test('⚠️ el punto ciego: 16.504 aristas de sentido único donde una inversión podría esconderse', () => {
    const CALZADA = new Set([
      'residential', 'unclassified', 'tertiary', 'secondary', 'primary',
      'service', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link',
    ]);
    let aristas = 0;
    let metros = 0;
    for (let k = 0; k < rueda.aristas.length; k++) {
      const a = rueda.aristas[k]!;
      const tipo = rueda.tipoDeWay.get(a.way);
      if (!tipo || !CALZADA.has(tipo)) continue;
      if (!rueda.jerarquia.porWay.has(a.way)) continue;
      if (rueda.sentido[k] === 0) continue;
      aristas++;
      metros += a.metros;
    }
    assert.equal(aristas, 16504);
    assert.ok(Math.abs(metros / 1000 - 628.3) < 1, `${(metros / 1000).toFixed(1)} km`);
  });
});
