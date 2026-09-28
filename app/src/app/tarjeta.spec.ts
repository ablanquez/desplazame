import { describe, expect, it } from 'vitest';
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, existsSync } from 'node:fs';

/**
 * ⭐ LA TARJETA AL COMPARTIR EL ENLACE — Open Graph y Twitter Card (28/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ **POR QUÉ ESTO VA ESTÁTICO EN `index.html` Y NO POR EL `Meta` DE ANGULAR.**
 *
 *  Los rastreadores de WhatsApp, Telegram, Slack, Signal o Discord piden el
 *  HTML y **NO ejecutan JavaScript**. Lo que Angular ponga en el `<head>` al
 *  arrancar la aplicación **no existe para ellos**: verían un documento con el
 *  `app-root` vacío y ninguna etiqueta. Por eso las quince van escritas en el
 *  `index.html`, que es lo que viaja en el dist y lo que el servidor entrega.
 *
 *  El `Meta` de Angular sigue mandando **en la pestaña**: `rotulo.ts` cambia el
 *  `<title>` y la `description` al navegar entre páginas, y eso es de quien sí
 *  ejecuta JavaScript. Las dos cosas conviven a propósito.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⭐ **Y LA `description` ES UNA SOLA, que es lo delicado de que convivan.**
 *    `rotulo.ts` usa `updateTag` y no `addTag` —con su acta escrita desde el
 *    24/09—, así que reemplaza la estática en vez de añadir una segunda. Si
 *    alguien la cambiara a `addTag`, el documento acabaría con dos y el
 *    rastreador leería la que quisiera. Esta jueza cuenta que hay **una**, y
 *    mira el fuente de `rotulo.ts` para que el cambio no pase callado.
 */

declare const process: { cwd(): string };

const RAIZ = ((): string => {
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/datapackage.json')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro datapackage.json subiendo desde ' + process.cwd());
})();

const leer = (rel: string): string => readFileSync(RAIZ + rel, 'utf8') as string;
const HTML: string = leer('app/src/index.html');

const SITIO = 'https://desplazame.antonioblanquez.es';
const TITULO = 'Desplázame — cómo ir de un portal a otro en Zaragoza';
const DESCRIPCION =
  'Andando, en bus o tranvía, en BiZi, patinete, coche o moto: la ruta de hoy con los ' +
  'datos de ahora mismo. Datos abiertos del Ayuntamiento y de los operadores, citados uno a uno.';
const IMAGEN = SITIO + '/og.png';

/**
 * Las quince, **en el orden de Linaje**, que es el patrón de la casa para esto.
 * `property` para Open Graph —lo pide el protocolo— y `name` para la tarjeta de
 * Twitter y la descripción, que son `name` de toda la vida.
 */
const ETIQUETAS: ReadonlyArray<readonly [atributo: 'name' | 'property', clave: string, valor: string]> = [
  [
    'name',
    'description',
    // ⚠️ LITERAL la de la portada (B-1, `buscador.ts`): si divergieran, el
    //    rastreador leería una cosa y quien navega con JS vería otra.
    'Buscador multimodal de Zaragoza: andando, bus urbano, BiZi, patinete, moto compartida y coche, con datos abiertos del Ayuntamiento.',
  ],
  ['property', 'og:type', 'website'],
  ['property', 'og:site_name', 'Desplázame'],
  ['property', 'og:title', TITULO],
  ['property', 'og:description', DESCRIPCION],
  ['property', 'og:url', SITIO + '/'],
  ['property', 'og:image', IMAGEN],
  ['property', 'og:image:width', '1200'],
  ['property', 'og:image:height', '630'],
  ['property', 'og:image:alt', TITULO],
  ['property', 'og:locale', 'es_ES'],
  ['name', 'twitter:card', 'summary_large_image'],
  ['name', 'twitter:title', TITULO],
  ['name', 'twitter:description', DESCRIPCION],
  ['name', 'twitter:image', IMAGEN],
];

/** El `content` de una etiqueta del `<head>`, o `null` si no está. */
function contenidoDe(atributo: string, clave: string): string | null {
  const patron = new RegExp(
    `<meta\\s+${atributo}="${clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="([^"]*)"`,
    'i',
  );
  return patron.exec(HTML)?.[1] ?? null;
}

describe('⭐ La tarjeta al compartir el enlace', () => {
  it('⭐ las QUINCE etiquetas están, con su valor firmado', () => {
    const faltan: string[] = [];
    const mal: string[] = [];
    for (const [atributo, clave, valor] of ETIQUETAS) {
      const hay = contenidoDe(atributo, clave);
      if (hay === null) faltan.push(clave);
      else if (hay !== valor) mal.push(`${clave}: «${hay}» en vez de «${valor}»`);
    }
    expect(faltan, 'etiquetas que no están').toEqual([]);
    expect(mal, 'etiquetas con otro texto').toEqual([]);
    expect(ETIQUETAS.length).toBe(15);
  });

  /**
   * ⚠️ **UNA ABSOLUTA, Y NO ES UN CAPRICHO DEL PROTOCOLO.** Un rastreador que
   *    recibe `og:image="og.png"` no tiene contra qué resolverlo: no está
   *    navegando, está leyendo un documento suelto. [ogp.me] pide URL absoluta,
   *    y sin ella la tarjeta sale sin imagen — que es el fallo que nadie ve
   *    hasta que comparte el enlace.
   */
  it('⭐ la imagen y la URL son ABSOLUTAS', () => {
    for (const clave of ['og:image', 'og:url']) {
      expect(contenidoDe('property', clave), `${clave} no es absoluta`).toMatch(/^https:\/\//);
    }
    expect(contenidoDe('name', 'twitter:image')).toMatch(/^https:\/\//);
  });

  /**
   * ⭐ Y NO DIVERGEN: Linaje repite título y descripción en la tarjeta de
   *    Twitter en vez de heredarlos, y repetir es exactamente donde dos textos
   *    se separan con el tiempo. Aquí se compra que siguen siendo el mismo.
   */
  it('⭐ la tarjeta de Twitter dice LO MISMO que Open Graph', () => {
    expect(contenidoDe('name', 'twitter:title')).toBe(contenidoDe('property', 'og:title'));
    expect(contenidoDe('name', 'twitter:description')).toBe(contenidoDe('property', 'og:description'));
    expect(contenidoDe('name', 'twitter:image')).toBe(contenidoDe('property', 'og:image'));
  });

  it('⭐ hay UNA sola `description`, y `rotulo.ts` la actualiza en vez de añadir otra', () => {
    const cuantas = (HTML.match(/<meta\s+name="description"/gi) ?? []).length;
    expect(cuantas, 'el documento declara más de una descripción').toBe(1);
    const rotulo = leer('app/src/app/rotulo.ts');
    // ⚠️ **Se compra LA LLAMADA, no la palabra**, y esta jueza nació roja por no
    //    hacerlo: `rotulo.ts` **nombra** `addTag` en su propia acta —«`updateTag`
    //    y no `addTag`: con `addTag` cada navegación añadiría otra»— y un
    //    `not.toContain('addTag')` la ponía en rojo por estar bien explicada.
    //    Un guardián que castiga el comentario que lo justifica no vigila nada.
    expect(rotulo, 'rotulo.ts no actualiza la descripción').toMatch(/\.updateTag\s*\(/);
    expect(rotulo, 'rotulo.ts AÑADE una segunda descripción en vez de actualizarla').not.toMatch(
      /\.addTag\s*\(/,
    );
  });

  /**
   * ⭐ LA IMAGEN EXISTE Y MIDE LO QUE DICE, leído de su cabecera PNG.
   *
   * ⚠️ Las dos etiquetas `og:image:width` y `og:image:height` son una **promesa**
   *    al rastreador —las lee para reservar el hueco antes de descargarla—, así
   *    que una promesa que no cuadre con el fichero es peor que no hacerla.
   *    Aquí se comprueban contra el `IHDR` de verdad, no contra sí mismas.
   */
  it('⭐ og.png existe y mide 1200×630 de verdad', () => {
    interface Bytes {
      readUInt32BE(posicion: number): number;
      subarray(desde: number, hasta: number): { toString(codificacion: string): string };
    }
    const png = readFileSync(RAIZ + 'app/marca/og.png') as Bytes;
    expect(png.subarray(1, 4).toString('latin1'), 'og.png no es un PNG').toBe('PNG');
    const ancho = png.readUInt32BE(16);
    const alto = png.readUInt32BE(20);
    expect(ancho).toBe(Number(contenidoDe('property', 'og:image:width')));
    expect(alto).toBe(Number(contenidoDe('property', 'og:image:height')));
    expect([ancho, alto]).toEqual([1200, 630]);
    // Y el build la copia a la raíz del sitio: sin esto, `/og.png` daría 404.
    expect(leer('app/angular.json')).toContain('"glob": "og.png"');
  });
});
