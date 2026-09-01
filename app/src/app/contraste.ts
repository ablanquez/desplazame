/**
 * ⭐ LA FÓRMULA DEL CONTRASTE. **UNA SOLA VEZ, EN TODO EL PROYECTO.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  HEREDADA DE ZETABUS, `src/core/contraste.ts`, y con ella su historia — que
 *  es la razón de que este fichero exista separado y no dentro del componente:
 *
 *  Allí la fórmula **estaba escrita cuatro veces, y la cuarta no era la misma**.
 *  Hacía `(0.2126·r + 0.7152·g + 0.0722·b) / 255`: los coeficientes de la WCAG
 *  aplicados sobre valores **codificados en gamma sRGB**, sin linealizar. Y lo
 *  peligroso no era que diera mal, sino que daba **parecido** — tres copias
 *  buenas y una divergente que coincide casi siempre es peor que cuatro malas,
 *  porque nada la delata hasta el día en que un tono cae donde discrepan.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y VIVE FUERA DEL COMPONENTE POR LO MISMO QUE ALLÍ: la usan **los dos
 *    lados**. La pantalla decide con ella el color de un número (`chip.ts`) y el
 *    ribete de una línea (`mapa.ts`); el instrumento juzga con ella lo que hay
 *    pintado (`e2e/medir.mjs`). Si vivieran separadas, el instrumento podría
 *    aprobar exactamente lo que la pantalla considera ilegible.
 *
 * ⚠️ Este módulo es MATEMÁTICA PURA: no importa nada, ni de la casa. Se puede
 *    leer y comprobar contra la especificación sin abrir ningún otro fichero.
 *    https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

/** Un color, canal a canal, **en 0..255** — que es como los dan el CSS y el PNG. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Luminancia relativa (WCAG 2.x), en 0..1.
 *
 * ⚠️ LA LÍNEA QUE NO SE PUEDE SALTAR es la de `linealizar`: lo que devuelven
 *    `getComputedStyle` y un PNG está **codificado en gamma**. Sin deshacer esa
 *    codificación, los coeficientes 0,2126 / 0,7152 / 0,0722 se aplican sobre el
 *    espacio equivocado y el número que sale no es luminancia.
 */
export function luminancia({ r, g, b }: Rgb): number {
  const linealizar = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linealizar(r) + 0.7152 * linealizar(g) + 0.0722 * linealizar(b);
}

/** Razón de contraste WCAG entre dos colores. Simétrica: el orden da igual. */
export function contrasteRgb(a: Rgb, b: Rgb): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `#RRGGBB` o `RRGGBB` → `Rgb`. El feed publica sin almohadilla; el CSS, con. */
export function deHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Contraste entre dos colores **en hexadecimal**, que es como los da el GTFS. */
export function contraste(a: string, b: string): number {
  return contrasteRgb(deHex(a), deHex(b));
}

/**
 * `rgb(17, 24, 39)` / `rgba(17, 24, 39, .5)` → `Rgb`, o `null` si no se entiende.
 *
 * ⚠️ **El alfa se IGNORA a propósito y hay que saberlo.** Un color con alfa no se
 *    puede resolver sin conocer lo que hay detrás, y adivinarlo sería inventar.
 *    Quien necesite el color REAL de un píxel translúcido no debe usar esto:
 *    tiene que mirar el píxel pintado (`contrasteReal` en `e2e/medir.mjs`).
 */
export function deCss(css: string): Rgb | null {
  const m = css.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) {
    return null;
  }
  const [r, g, b] = m.slice(0, 3).map(Number);
  return { r: r!, g: g!, b: b! };
}

/** WCAG 1.4.3 AA: 4,5:1 para texto normal. */
export const AA_TEXTO = 4.5;

/**
 * WCAG 1.4.11 AA: **3:1 para gráficos con significado**.
 *
 * [W3C, *Understanding Non-text Contrast*] cada línea de un gráfico necesita
 * 3:1 contra lo que tiene al lado. Una polilínea de ruta es exactamente eso: si
 * no se distingue del plano, el plano no dice por dónde se va.
 */
export const AA_GRAFICO = 3;

/**
 * La **tierra** de OpenStreetMap, `#f2efe9`, que es sobre lo que se pinta casi
 * toda ruta de Zaragoza. Medido del propio teselado, no elegido.
 *
 * ⚠️ No es el único fondo posible —hay calzada blanca (`#ffffff`), parques y
 *    agua (`#aad3df`)—, pero es el mayoritario y el que se usa para decidir.
 *    Sobre el agua no va ninguna ruta.
 */
export const TIERRA_OSM = 'f2efe9';

/**
 * ⭐ LOS DOS EXTREMOS DEL PLANO, censados del teselado de verdad (1/09).
 *
 * ⚠️ **La tierra es solo el 17,5 % de lo que hay debajo de una traza.** Contado
 * sobre los 259.072 píxeles del lienzo en un viaje de la 21, éstos son los
 * colores que OpenStreetMap pone y cuánto ocupan:
 *
 *     #f2efe9  17,5 %  la tierra          #ffffff   1,6 %  calzada
 *     #fefefe   7,8 %  calzada menor      #f7fabf   1,5 %  zona verde clara
 *     #d1c6bd   4,4 %  edificado          #ebdbe8   1,5 %  ferrocarril
 *     #e0dfdf   3,4 %  suelo urbano       #d4cbc4   1,3 %  edificado
 *     #c7c7b4   2,2 %  industrial         #d4d3d3   1,1 %  suelo urbano
 *     #fbd6a4   1,9 %  la secundaria      #f9b29c   1,0 %  la primaria
 *
 * [WCAG 1.4.11 · W3C *Understanding Non-text Contrast*] los 3:1 se miden contra
 * los colores **adyacentes**, y una línea de bus los cruza todos. Así que medir
 * contra la tierra y dar por bueno el resultado **no cumple el criterio**: la 21
 * (`#978685`) da 3,02:1 contra la tierra y **1,96:1 contra la primaria naranja**.
 *
 * Estos dos valen para comprobar que un ribete se ve sobre el plano ENTERO: el
 * más claro y el más oscuro de los que salen por encima del 1 %.
 */
export const PLANO_MAS_CLARO = 'ffffff';
export const PLANO_MAS_OSCURO = 'f9b29c';
