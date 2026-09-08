/**
 * ⭐ EL GUION QUE CUENTA LAS FICHAS DEL `THIRD-PARTY-NOTICES.md` (8/09).
 *
 * ── ⚠️ Por qué existe: el desfase que ya ha pasado TRES veces ───────────────
 *
 * La cabecera del documento dice cuántos conjuntos de datos de terceros hay, y
 * se ha quedado vieja tres veces seguidas:
 *
 *   · decía **catorce** cuando había veintiséis  → corregido a mano
 *   · decía **veintiséis** cuando había treinta y cinco → corregido a mano, y
 *     esa vez con la advertencia de la vez anterior escrita justo encima
 *   · decía **treinta y uno** cuando había treinta y seis → 8/09
 *
 * Y las dos primeras veces se «arregló» **escribiendo una nota que avisaba del
 * desfase**. Una nota que avisa de un desfase no lo impide: solo deja
 * constancia de que se sabía. Lo que lo impide es esto.
 *
 * ⚠️ **Vive en la suite del motor porque es donde hay un `node --test`**, no
 *    porque sea código del motor. Lo que juzga es un documento de la raíz, y
 *    por eso lo lee por una ruta relativa a ESTE fichero y no al `cwd`: la
 *    suite se lanza desde `motor/` y desde la raíz, y tiene que valer igual.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** La raíz del repositorio, desde este fichero: `motor/src/…` → dos arriba. */
const NOTICES = new URL('../../THIRD-PARTY-NOTICES.md', import.meta.url);

/** Los números escritos con letra que la cabecera usa, del 1 al 60. */
const EN_LETRA: Readonly<Record<string, number>> = {
  catorce: 14,
  veintiséis: 26,
  'treinta y uno': 31,
  'treinta y cinco': 35,
  'treinta y seis': 36,
  'treinta y siete': 37,
  'treinta y ocho': 38,
  'treinta y nueve': 39,
  cuarenta: 40,
  'cuarenta y uno': 41,
  'cuarenta y dos': 42,
  'cuarenta y tres': 43,
};

describe('⭐ EL RECUENTO DEL THIRD-PARTY-NOTICES — la cabecera no puede envejecer sola', () => {
  const texto = readFileSync(NOTICES, 'utf8');
  /** Las fichas de verdad: los encabezados `### 1.x`. */
  const fichas = [...texto.matchAll(/^### 1\.(\d+) · /gm)];

  /**
   * ⭐ JUEZ 1 — LA CIFRA DE LA CABECERA ES LA QUE HAY.
   *
   * Se compara con el número **escrito con letra**, que es como la cabecera lo
   * dice. Si alguien añade una § 1.x y no toca ese párrafo, esto se pone rojo.
   */
  test('⭐ 1 · la cabecera dice tantas fichas como fichas hay', () => {
    // El `> ` de la cita puede partir la frase en dos líneas: se tolera.
    const dicho = /\*\*([a-zé ]+)\*\* fichas[\s>]+propias/.exec(texto);
    assert.ok(dicho, 'la cabecera tiene que decir cuántas fichas propias hay, en negrita');
    const cuantas = EN_LETRA[dicho[1]!.trim()];
    assert.ok(
      cuantas !== undefined,
      `«${dicho[1]}» no está en la tabla de números con letra de esta juez: añádelo`,
    );
    assert.equal(
      cuantas,
      fichas.length,
      `la cabecera dice ${cuantas} y hay ${fichas.length} encabezados «### 1.x»`,
    );
  });

  /**
   * ⭐ JUEZ 2 — Y LA NUMERACIÓN NO TIENE HUECOS NI REPETIDOS.
   *
   * Las fichas se citan por su § desde el código y desde la bitácora. Un hueco
   * o un número repetido convierte una cita en una promesa rota.
   */
  test('⭐ 2 · las fichas van de la 1.1 a la última, sin huecos ni repetidos', () => {
    const numeros = fichas.map((m) => Number(m[1]));
    assert.deepEqual(
      numeros,
      [...numeros].sort((a, b) => a - b),
      'las fichas tienen que estar en orden',
    );
    assert.equal(new Set(numeros).size, numeros.length, 'no puede haber dos fichas con el mismo §');
    assert.deepEqual(
      numeros,
      Array.from({ length: numeros.length }, (_, i) => i + 1),
      'la numeración va de 1 a N, sin huecos',
    );
  });

  /**
   * ⭐ JUEZ 3 — LAS QUE SE CONSULTAN ESTÁN EN LA TABLA, Y LA TABLA EXISTE.
   *
   * La tabla de «NO SE COPIAN: SE CONSULTAN» es la que separa el documento en
   * dos mitades. Lo que se compra es que **el número que la anuncia** y las
   * filas que tiene digan lo mismo — el mismo desfase, en pequeño.
   */
  /**
   * ⭐ JUEZ 4 — Y «EL RESTO DEL DATO» CIERRA LA LISTA (8/09, tras la nº39).
   *
   * ⚠️ **Esta juez nace de un fallo que ESTE MISMO FICHERO dejó pasar.** El
   *    7/09 entró la ficha de la DGT **detrás** de la de cierre; las tres jueces
   *    de arriba dieron verde —la cabecera cuadraba, la numeración era seguida y
   *    la tabla también— y sin embargo el documento estaba mal. Lo cazaron dos
   *    jueces de `app/src/app/atribucion.spec.ts`, que llevaban un día en rojo
   *    sin que nadie las corriera. Ver la entrada nº39 de `docs/BITACORA.md`.
   *
   * ⚠️ **Es una copia declarada, no un descuido.** La misma regla la vigila
   *    `atribucion.spec.ts` desde la interfaz. Se duplica a propósito porque las
   *    dos suites se corren por separado —y el 7/09 se corrió solo una—: una
   *    regla que solo vive en la suite que no se ejecutó no protege nada.
   *
   * Lo que se compra es que **cierra**, no qué número tiene: nombrar el número es
   * garantizarse un rojo cada vez que entra un dato nuevo.
   */
  test('⭐ 4 · la ficha de «el resto del dato» es la ÚLTIMA, tenga el número que tenga', () => {
    const titulos = [...texto.matchAll(/^### 1\.\d+ · (.+)$/gm)].map((m) => m[1]!);
    assert.ok(titulos.length > 0, 'tiene que haber fichas');
    assert.match(
      titulos[titulos.length - 1]!,
      /El resto del dato/,
      `la última ficha es «${titulos[titulos.length - 1]}» y tenía que ser la del resto del dato`,
    );
    assert.equal(
      titulos.filter((t) => /El resto del dato/.test(t)).length,
      1,
      'la de cierre es UNA sola',
    );
  });

  test('⭐ 3 · la tabla de las que se consultan dice tantas como filas tiene', () => {
    const anuncio = /\*\*Y ([A-ZÉ]+) NO SE COPIAN: SE CONSULTAN\.\*\*/.exec(texto);
    assert.ok(anuncio, 'la cabecera tiene que anunciar cuántas fuentes se consultan');
    const cuantas: Readonly<Record<string, number>> = { TRES: 3, CUATRO: 4, CINCO: 5, SEIS: 6, SIETE: 7, OCHO: 8 };
    const dicho = cuantas[anuncio[1]!];
    assert.ok(dicho !== undefined, `«${anuncio[1]}» no está en la tabla de esta juez: añádelo`);

    // Las filas de esa tabla son las líneas de cita que empiezan por «> | § 1.»
    const filas = [...texto.matchAll(/^> \| § 1\.\d+ \| /gm)];
    assert.equal(dicho, filas.length, `anuncia ${dicho} y la tabla tiene ${filas.length} filas`);
  });
});
