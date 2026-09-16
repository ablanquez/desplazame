// ⚠️ De Node, y **existen en tiempo de ejecución**: las pruebas corren sobre
// Node. Lo que no existe son sus TIPOS — el proyecto no trae `@types/node`
// porque las dependencias son CERO. Es el mismo apaño, y por la misma razón,
// que ya usa `manifiesto.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { contraste, AA_TEXTO, AA_GRAFICO } from './contraste';
import { Identidad, LIMITES, MODOS, PARES, SEMANTICOS, TOKENS_DE_MODO, aHex } from './identidad';

/**
 * ⭐ LOS TOKENS Y SU CONTRASTE — la tanda 1 del calco (9/09, punto 15).
 *
 * ── ⚠️ Por qué estos jueces LEEN EL FICHERO en vez de mirar la pantalla ─────
 *
 * Porque en jsdom **no hay pantalla que mirar**. Medido el 9/09:
 *
 *     getComputedStyle(elemento).getPropertyValue('--background')  →  ""
 *     ...a través de var()                                         →  ""
 *
 * jsdom no resuelve las custom properties de `:root` ni los `var()`. Un juez
 * escrito aquí con `getComputedStyle` no comprobaría los tokens: comprobaría
 * cadenas vacías contra cadenas vacías, y pasaría con el CSS borrado entero.
 * **Esa es exactamente la clase de verde que persigue media bitácora.**
 *
 * Así que el reparto es:
 *
 * · **Aquí**, el fichero como texto: qué declara el CSS, token a token. Es
 *   determinista, cubre los 80 valores y no depende de ningún navegador.
 * · **En `e2e/identidad.mjs`**, el píxel: qué acabó pintando Chrome de verdad,
 *   con la página abierta. Ahí sí hay `getComputedStyle` que resuelve, y ahí
 *   se mide el color real —con opacidades y capas dentro—, que es la doctrina
 *   que ya dejó escrita `e2e/medir.mjs`.
 *
 * ⚠️ Y LA TABLA DE ABAJO ES UNA COPIA A PROPÓSITO, calcada a mano del
 *    `index.css` de la referencia. Un juez que sacara los valores esperados
 *    del mismo fichero que juzga se estaría comparando consigo mismo y pasaría
 *    siempre. La copia de control es lo que convierte esto en un juez.
 */

/** `process` es de Node y tampoco está tipado aquí. Solo se usa `cwd()`. */
declare const process: { cwd(): string };

/** La raíz del repositorio, buscada subiendo — el mismo apaño del manifiesto. */
const RAIZ = ((): string => {
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/datapackage.json')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro datapackage.json subiendo desde ' + process.cwd());
})();

const leer = (rel: string): string => readFileSync(RAIZ + rel, 'utf8') as string;

const CSS = leer('app/src/styles.css');
const CSS_DE_LA_PAGINA = leer('app/src/app/identidad.css');

/** Lo calcado del `index.css` de Figma Make: tema claro. */
const CLARO: Readonly<Record<string, string>> = {
  background: '#ffffff',
  foreground: '#1e293b',
  card: '#ffffff',
  'card-foreground': '#1e293b',
  primary: '#2563eb',
  'primary-foreground': '#ffffff',
  success: '#15803d',
  'success-foreground': '#ffffff',
  warning: '#fff4e5',
  'warning-foreground': '#b45309',
  'warning-border': '#b45309',
  'warning-dark': '#7c3d00',
  border: '#e2e8f0',
  ring: '#2563eb',
  muted: '#f8fafc',
  'muted-foreground': '#64748b',
  // ⭐ NO SALE DEL `index.css` DE FIGMA MAKE, y es el primero que no sale.
  //    La maqueta pintaba la banda con `muted` al 30 %, que aquí se separaba 2
  //    puntos de 255 del blanco. [ANTONIO, 11/09] eligió el par B de la escala
  //    slate con las capturas delante: 29 puntos en reposo.
  'banda-cabecera': '#e2e8f0',
  'banda-cabecera-hover': '#cbd5e1',
  // ⭐ TANDA 6 (15/09): el #555 que vivía A PELO en tres reglas — «Se viaja en»,
  //    «Modo: …» y el subtítulo — entra con su nombre y su valor de siempre.
  leyenda: '#555555',
  // ⭐ Y el realce del paso deja de tomar prestada la banda: mismo valor, token
  //    propio. Prestado, un cambio en la banda movía el realce sin avisar.
  'superficie-realce': '#e2e8f0',
  // ⭐ REMATE (15/09): la distancia y los datos del paso, slate-500 → 600. El
  //    500 daba 3,86:1 sobre el realce con 14 px (texto normal, vara 4,5).
  'secundario-del-paso': '#475569',
  // ⭐ EL PUENTE (15/09): la frontera de los campos del Buscador [WCAG 1.4.11].
  //    Los campos llevaban #999 (2,85:1) y el desplegable `border` (1,23). El
  //    slate-400 se queda en 2,56; el 500 es el paso mínimo que llega (4,76).
  'borde-de-campo': '#64748b',
  // ⭐ EL PUENTE-BIS (16/09): los dos estados del panel de frescura que no tenían
  //    familia en la casa. En claro son los valores de siempre, ya medidos.
  'estado-caducado-superficie': '#fde7e7',
  'estado-caducado-borde': '#c0392b',
  'estado-caducado-tinta': '#8c1c12',
  'estado-vigente-superficie': '#e8f5e9',
  'estado-vigente-borde': '#2e7d32',
  'estado-vigente-tinta': '#1b5e20',
  'mode-andando-soft': '#dcfce7',
  'mode-andando-strong': '#15803d',
  'mode-andando-solid': '#15803d',
  'mode-andando-text': '#ffffff',
  'mode-bus-soft': '#ccfbf1',
  'mode-bus-strong': '#0f766e',
  'mode-bus-solid': '#0f766e',
  'mode-bus-text': '#ffffff',
  'mode-bici-soft': '#f3e8ff',
  'mode-bici-strong': '#7e22ce',
  'mode-bici-solid': '#9333ea',
  'mode-bici-text': '#ffffff',
  'mode-patin-soft': '#fce7f3',
  'mode-patin-strong': '#be185d',
  'mode-patin-solid': '#db2777',
  'mode-patin-text': '#ffffff',
  'mode-moto-soft': '#ffedd5',
  'mode-moto-strong': '#c2410c',
  'mode-moto-solid': '#c2410c',
  'mode-moto-text': '#ffffff',
  'mode-coche-soft': '#f1f5f9',
  'mode-coche-strong': '#334155',
  'mode-coche-solid': '#475569',
  'mode-coche-text': '#ffffff',
};

/** Lo calcado del bloque `.dark` de la referencia. */
const OSCURO: Readonly<Record<string, string>> = {
  background: '#121212',
  foreground: '#f0f0f0',
  card: '#1e1e1e',
  'card-foreground': '#f0f0f0',
  primary: '#93c5fd',
  'primary-foreground': '#0f172a',
  success: '#22c55e',
  'success-foreground': '#0f172a',
  warning: '#3a1d00',
  'warning-foreground': '#fde68a',
  // ⭐ amber-800 → 600 (tanda 6, 15/09) [WCAG 1.4.11]: el #92400e del calco daba
  //    2,35:1 contra la tarjeta, 2,18 contra su ámbar y 1,78 sobre el realce.
  //    El paso mínimo de la familia que da 3:1 contra LOS TRES es el 600 (5,23 ·
  //    4,86 · 3,97); el 700 se quedaba en 2,52 sobre el realce. Bitácora del 15/09.
  'warning-border': '#d97706',
  'warning-dark': '#fef3c7',
  border: '#333333',
  ring: '#93c5fd',
  muted: '#242424',
  'muted-foreground': '#b8b8b8',
  // ⭐ Reposo = el mismo hex que `border` (12dp de la escalera de elevación); el
  //    hover ESTRENA gris, porque la escalera de Material se acaba en 24dp
  //    (#383838) y ese peldaño daba un escalón de 5 puntos contra los 23 del
  //    claro. #404040 mide 1,2186:1 de escalón contra el 1,2044:1 del claro.
  'banda-cabecera': '#333333',
  'banda-cabecera-hover': '#404040',
  // ⭐ POR REGLA, no a ojo: el primer gris que da contra la tarjeta oscura el
  //    mismo 7,46:1 que el #555 da contra la clara (#adadad se queda en 7,43).
  leyenda: '#aeaeae',
  // ⭐ POR REGLA: el realce hace el papel de la banda —«el gris que sí se ve
  //    sobre la tarjeta»— y toma su peldaño de elevación, 12dp.
  'superficie-realce': '#333333',
  // Cero pasos: #b8b8b8 ya da 8,40 contra la tarjeta y 6,37 contra el realce.
  'secundario-del-paso': '#b8b8b8',
  // ⭐ POR REGLA: el primer gris que da 3:1 contra la tarjeta oscura (3,04;
  //    #686868 se queda en 2,99). En oscuro los campos llevaban el `border` de
  //    la casa, 1,32:1.
  'borde-de-campo': '#696969',
  // ⭐ EL PUENTE-BIS (16/09), POR REGLA y con el ámbar oscuro de la casa como
  //    patrón (#3a1d00 / #d97706 / #fef3c7): la superficie es el paso más oscuro
  //    de la familia, la tinta el más claro, y el borde el paso mínimo que da 3:1
  //    contra su superficie Y contra la página. Rojo: el 700 (#b91c1c) se queda
  //    en 2,50 sobre su superficie; el 600 da 3,34 y 3,88. Verde: el 700
  //    (#15803d) da 2,97; el 600 da 4,52 y 5,68.
  'estado-caducado-superficie': '#450a0a',
  'estado-caducado-borde': '#dc2626',
  'estado-caducado-tinta': '#fee2e2',
  'estado-vigente-superficie': '#052e16',
  'estado-vigente-borde': '#16a34a',
  'estado-vigente-tinta': '#dcfce7',
  'mode-andando-soft': '#14532d',
  'mode-andando-strong': '#4ade80',
  'mode-andando-solid': '#22c55e',
  'mode-andando-text': '#052e16',
  'mode-bus-soft': '#134e4a',
  'mode-bus-strong': '#2dd4bf',
  'mode-bus-solid': '#14b8a6',
  'mode-bus-text': '#042f2e',
  'mode-bici-soft': '#581c87',
  'mode-bici-strong': '#d8b4fe',
  'mode-bici-solid': '#c084fc',
  'mode-bici-text': '#3b0764',
  'mode-patin-soft': '#831843',
  'mode-patin-strong': '#f9a8d4',
  'mode-patin-solid': '#fb7185',
  'mode-patin-text': '#4c0519',
  'mode-moto-soft': '#7c2d12',
  'mode-moto-strong': '#fdba74',
  'mode-moto-solid': '#f97316',
  'mode-moto-text': '#431407',
  'mode-coche-soft': '#1e293b',
  'mode-coche-strong': '#94a3b8',
  'mode-coche-solid': '#94a3b8',
  'mode-coche-text': '#0f172a',
};

/** Un CSS sin sus comentarios: lo que el navegador de verdad va a leer. */
function sinComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * El cuerpo del bloque que abre con ese selector, contando llaves.
 *
 * ⚠️ `indexOf('{', i)` y **no** `i + selector.length`: hay selectores que ya
 *    traen la llave dentro (`':root {'`), y buscando después de ellos se salta
 *    a la llave del bloque SIGUIENTE. Pasó el 9/09 y devolvía el cuerpo del
 *    `@media` creyendo que era el de `:root` — los 80 tokens en rojo de golpe.
 */
function bloque(css: string, selector: string): string {
  const i = css.indexOf(selector);
  if (i < 0) {
    return '';
  }
  const abre = css.indexOf('{', i);
  let hondo = 0;
  for (let j = abre; j < css.length; j++) {
    if (css[j] === '{') hondo++;
    if (css[j] === '}') {
      hondo--;
      if (hondo === 0) return css.slice(abre + 1, j);
    }
  }
  return '';
}

/** Las declaraciones `--nombre: valor` de un cuerpo, ya sin comentarios. */
function declaraciones(cuerpo: string): Record<string, string> {
  const limpio = cuerpo.replace(/\/\*[\s\S]*?\*\//g, '');
  const salida: Record<string, string> = {};
  for (const m of limpio.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    salida[m[1]!] = m[2]!.trim();
  }
  return salida;
}

const EN_ROOT = declaraciones(bloque(CSS, ':root {'));
const CAPA_SISTEMA = declaraciones(bloque(CSS, ":root:not([data-theme='light'])"));
const ELEGIDO_OSCURO = declaraciones(bloque(CSS, "[data-theme='dark'] {"));
const ELEGIDO_CLARO = declaraciones(bloque(CSS, "[data-theme='light'] {"));

const TODOS = [...SEMANTICOS, ...TOKENS_DE_MODO];

describe('⭐ (i) LOS TOKENS — que valgan lo calcado, los 80', () => {
  it('están los 52 tokens: 28 semánticos y 6 modos × 4 variantes', () => {
    // ⚠️ Eran 16 y 40 hasta el 11/09. Los dos nuevos son la banda de las
    //    cabeceras, y son los PRIMEROS que no vienen calcados de la maqueta.
    // ⚠️ Y 18 y 42 hasta el 15/09 (tanda 6): entran la leyenda —el #555 a pelo—
    //    y la superficie del realce, que tomaba prestada la banda.
    // ⚠️ Y 21 y 45 desde el remate: el gris secundario del paso.
    // ⚠️ Y 22 y 46 desde el puente: la frontera de los campos.
    // ⚠️ Y 28 y 52 desde el puente-bis: los dos estados del panel, con su
    //    superficie, su borde y su tinta. El ámbar y el gris NO estrenan: son el
    //    `warning` y el `muted` de la casa, que ya estaban.
    expect(SEMANTICOS.length).toBe(28);
    expect(TOKENS_DE_MODO.length).toBe(24);
    expect(TODOS.length).toBe(52);
  });

  for (const token of [...SEMANTICOS, ...TOKENS_DE_MODO]) {
    it(`--claro-${token} vale ${CLARO[token]}`, () => {
      expect(EN_ROOT[`claro-${token}`], `--claro-${token} en :root`).toBe(CLARO[token]);
    });

    it(`--oscuro-${token} vale ${OSCURO[token]}`, () => {
      expect(EN_ROOT[`oscuro-${token}`], `--oscuro-${token} en :root`).toBe(OSCURO[token]);
    });
  }

  /**
   * ⭐ LA JUEZ DE LA INDIRECCIÓN, y es la que de verdad hace falta.
   *
   * Cada hex se escribe una sola vez y **cuatro** bloques lo referencian. Eso
   * mata la divergencia de valores, pero deja una grieta nueva: que un token se
   * olvide en una de las cuatro listas. Si faltara en la capa del sistema,
   * quien tenga el portátil en oscuro vería ese token en claro y nadie se
   * enteraría, porque `prefers-color-scheme` no se puede forzar desde aquí.
   *
   * ⚠️ **El bloque del claro elegido entró tarde y por un fallo real**: no
   *    estaba, se dio por hecho que `:root` bastaba, y con el sistema en oscuro
   *    un elemento marcado `light` heredaba los cuarenta tokens oscuros. La
   *    nº43. Ahora las cuatro listas se cuentan igual, y ninguna es opcional.
   */
  it('⭐ los cuatro bloques asignan los 45 tokens, y a la fuente que toca', () => {
    for (const token of TODOS) {
      expect(EN_ROOT[token], `--${token} falta en :root`).toBe(`var(--claro-${token})`);
      expect(CAPA_SISTEMA[token], `--${token} falta en la capa del sistema`).toBe(
        `var(--oscuro-${token})`,
      );
      expect(ELEGIDO_OSCURO[token], `--${token} falta en el oscuro elegido`).toBe(
        `var(--oscuro-${token})`,
      );
      expect(ELEGIDO_CLARO[token], `--${token} falta en el claro elegido [nº43]`).toBe(
        `var(--claro-${token})`,
      );
    }
  });

  /**
   * [DOC MDN] Sin `color-scheme` los controles nativos —selects, barras de
   * desplazamiento, inputs— se quedan claros dentro de una interfaz oscura.
   */
  it('cada tema declara su color-scheme', () => {
    expect(bloque(CSS, ':root {')).toContain('color-scheme: light');
    expect(bloque(CSS, ":root:not([data-theme='light'])")).toContain('color-scheme: dark');
    expect(bloque(CSS, "[data-theme='dark'] {")).toContain('color-scheme: dark');
    expect(bloque(CSS, "[data-theme='light'] {")).toContain('color-scheme: light');
  });

  /**
   * ⭐ El `:not` de la capa del sistema es lo que deja ganar a la elección.
   * Sin él, quien elige claro teniendo el sistema en oscuro no lo consigue —y
   * es un fallo que solo se ve en el portátil de otra persona.
   */
  it("⭐ la capa del sistema se aparta cuando alguien ha elegido el claro", () => {
    expect(CSS).toContain("@media (prefers-color-scheme: dark)");
    expect(CSS).toContain(":root:not([data-theme='light'])");
  });

  /**
   * ⭐ EL PESO DEL TEXTO, QUE TAMBIÉN ES UN TOKEN DE TEMA (16/09, parte 3).
   *
   * [DISEÑO §3, *Recomendación*] «En modo oscuro, subir un peso (400→500) para
   * compensar el adelgazamiento óptico documentado sobre fondos oscuros».
   *
   * ⚠️ Va en los CUATRO bloques por la misma razón que los colores: si faltara
   *    en la capa del sistema, quien tiene el portátil en oscuro leería el
   *    oscuro con la letra fina y nadie se enteraría. Se declara con su valor
   *    literal y no por la indirección `--claro-*`/`--oscuro-*`, que existe para
   *    que **cada hex** se escriba una vez; aquí no hay hexes, hay dos números,
   *    y esta jueza cubre las cuatro copias.
   *
   * ⚠️ Y el §3 manda **solo el salto 400→500**. Los 500 y 600 del claro no se
   *    tocan: subirlos también sería inventarse letra que el documento no firma.
   */
  it('⭐ [§3] el peso del texto sube 400→500 en oscuro, en los cuatro bloques', () => {
    expect(EN_ROOT['peso-texto'], '--peso-texto falta en :root').toBe('400');
    expect(CAPA_SISTEMA['peso-texto'], '--peso-texto falta en la capa del sistema').toBe('500');
    expect(ELEGIDO_OSCURO['peso-texto'], '--peso-texto falta en el oscuro elegido').toBe('500');
    expect(ELEGIDO_CLARO['peso-texto'], '--peso-texto falta en el claro elegido').toBe('400');
  });

  it('⭐ [§3] y el `body` lo pinta, que es de donde hereda todo el texto', () => {
    expect(bloque(CSS, 'body {')).toContain('font-weight: var(--peso-texto)');
  });

  /**
   * ⚠️ Un peso que el `@font-face` no tiene lo sintetiza el navegador
   *    engordando el 400, y eso es exactamente el borrón que el §3 quiere
   *    evitar. El 500 tiene su fichero propio: `Inter-Medium.woff2`.
   */
  it('⭐ [§3] el 500 existe de verdad: tiene su @font-face y su fichero', () => {
    expect(CSS).toContain("src: url('/fuentes/Inter-Medium.woff2')");
    expect(existsSync(RAIZ + 'app/public/fuentes/Inter-Medium.woff2')).toBe(true);
  });

  /**
   * ⭐ LA TRAMPA DE LAS TRANSICIONES, documentada: las transiciones que animan
   * el cambio de tema animan también su PRIMERA aplicación, y eso se ve como un
   * flash aunque el atributo llegue a tiempo. El guion del `index.html` marca
   * `<html>` mientras carga; esta es la regla que hace que esa marca sirva.
   *
   * ⚠️ `!important` a propósito, y es de los pocos de la casa: tiene que ganarle
   *    a cualquier `transition` de cualquier hoja, incluidas las de componente.
   */
  it('⭐ hay una regla que apaga TODAS las transiciones mientras arranca', () => {
    const limpio = sinComentarios(CSS);
    const i = limpio.indexOf('.sin-transiciones');
    expect(i, 'no existe la regla `.sin-transiciones`').toBeGreaterThanOrEqual(0);
    expect(bloque(limpio, '.sin-transiciones')).toContain('transition: none !important');
    // Los pseudoelementos también transicionan, y también parpadean.
    const selector = limpio.slice(i, limpio.indexOf('{', i));
    expect(selector).toContain('::before');
    expect(selector).toContain('::after');
  });
});

/**
 * ⭐ (ii) EL CONTRASTE — los 36, medidos, y **ninguno por debajo**.
 *
 * ── La historia de este censo, porque explica por qué sigue montado ─────────
 *
 * El calco trajo **once** pares por debajo de 4,5:1. El 9/09 se paró y se
 * avisó en vez de corregirlos por cuenta propia, y mientras tanto este censo
 * los tuvo fijados uno a uno con su ratio exacto: no los absolvía, los
 * inmovilizaba. Corregidos ese mismo día —un paso de sombra dentro de cada
 * familia—, **el censo se ha quedado vacío**.
 *
 * ⚠️ Y VACÍO ES COMO TIENE QUE SEGUIR. La lista no se borra porque el
 *    mecanismo sigue haciendo falta: si mañana entra un par que no llega, la
 *    jueza de abajo lo caza y obliga a decidir —arreglarlo o censarlo con su
 *    número—. Lo que no puede pasar es que una deuda nueva entre en silencio.
 */
const DEUDA: Readonly<Record<string, number>> = {
  // ⚠️ Aquí vivió UNA deuda del 15/09 al 15/09 (remate de la tanda 6): la
  //    distancia y los datos del paso sobre el realce en CLARO, 3,86:1. Medido
  //    en lo pintado: 14 px a peso 600 y 400 —texto normal, vara 4,5 [WCAG
  //    1.4.3]—, así que suspendía y se arregló. Vuelve a estar vacía.
};

describe('⭐ (ii) EL CONTRASTE — los pares declarados, en los dos temas', () => {
  const tabla = { light: CLARO, dark: OSCURO } as const;

  /** Todos los pares, de los dos temas, con su ratio ya calculado. */
  const medidos = (['light', 'dark'] as const).flatMap((tema) =>
    PARES.map((par) => {
      const texto = tabla[tema][par.texto]!;
      const fondo = tabla[tema][par.fondo]!;
      return { clave: `${tema} · ${par.rotulo}`, texto, fondo, ratio: contraste(texto, fondo) };
    }),
  );

  it('se miden los 37 pares en los dos temas: 74 medidas', () => {
    // ⚠️ Eran 18 y 36. Los dos siguientes fueron los DOS estados de la banda:
    //    medir solo el reposo dejaría el hover sin vigilar, que es donde el
    //    gris se aclara y el texto pierde contraste.
    // ⚠️ Y el 21 (14/09, fase C) es el número de la ficha de poste o estación:
    //    `foreground` sobre `card`. Sobre la banda del realce ya estaba medido.
    // ⚠️ Y el 22 (14/09, la región de la cabecera): los extremos del viaje van
    //    en `muted-foreground` sobre la tarjeta, y el censo solo lo medía sobre
    //    `muted` — un par que se pintaba y no se contaba.
    // ⚠️ Y del 23 al 28 (15/09, tanda 6, el resultado en oscuro): la leyenda
    //    —el #555 que vivía a pelo—, el texto y la distancia sobre el realce, y
    //    el ámbar entero: la tinta sobre su superficie (la que pintan el resumen,
    //    la tira y la L5, y que el censo NO tenía: solo medía `warning-foreground`)
    //    y la marca «desviada» sobre la tarjeta y sobre el realce.
    // ⚠️ Y el 29 (remate): el gris del paso sobre la tarjeta; el de «con el
    //    ratón» deja de ser `muted-foreground` y pasa a ser el suyo.
    // ⚠️ Y el 30 y el 31 (el puente, 15/09): lo escrito en un campo en borrador
    //    va en `foreground` sobre el ámbar, y la opción activa de un desplegable
    //    se pinta invertida —la tarjeta sobre `foreground`—. Las dos vivían a
    //    pelo en las hojas de los campos, que la jueza (vi) no barría.
    // ⚠️ Y del 32 al 37 (el puente-bis, 16/09): el panel de frescura no se pinta
    //    sobre una tarjeta, sino sobre la página, y el censo no tenía ni un par
    //    contra `background` salvo el texto principal. Entran la leyenda y el gris
    //    sobre la página, la cabecera de la tabla sobre `muted`, los dos chips
    //    nuevos y el aviso de fallo del panel.
    expect(PARES.length).toBe(37);
    expect(medidos.length).toBe(74);
    expect(PARES.some((p) => p.texto === 'leyenda' && p.fondo === 'background')).toBe(true);
    expect(PARES.some((p) => p.texto === 'foreground' && p.fondo === 'muted')).toBe(true);
    expect(PARES.some((p) => p.texto === 'foreground' && p.fondo === 'warning')).toBe(true);
    expect(PARES.some((p) => p.texto === 'card' && p.fondo === 'foreground')).toBe(true);
    expect(PARES.some((p) => p.texto === 'secundario-del-paso' && p.fondo === 'superficie-realce')).toBe(true);
    expect(PARES.some((p) => p.texto === 'leyenda' && p.fondo === 'card')).toBe(true);
    expect(PARES.some((p) => p.texto === 'warning-dark' && p.fondo === 'warning')).toBe(true);
    expect(PARES.some((p) => p.texto === 'foreground' && p.fondo === 'card')).toBe(true);
    expect(PARES.some((p) => p.texto === 'muted-foreground' && p.fondo === 'card')).toBe(true);
  });

  for (const m of medidos) {
    if (m.clave in DEUDA) {
      continue;
    }
    it(`${m.clave} cumple AA — ${m.texto} sobre ${m.fondo}`, () => {
      expect(contraste(m.texto, m.fondo)).toBeGreaterThanOrEqual(AA_TEXTO);
    });
  }

  /**
   * El censo. Cada uno con su ratio exacto: si un valor cambia, salta.
   */
  for (const [clave, esperado] of Object.entries(DEUDA)) {
    it(`⚠️ ${clave} NO llega a ${AA_TEXTO}:1 — sigue en ${esperado}:1, pendiente de decisión`, () => {
      const m = medidos.find((x) => x.clave === clave);
      expect(m, `el par «${clave}» ya no existe: hay que revisar el censo`).toBeDefined();
      expect(m!.ratio).toBeLessThan(AA_TEXTO);
      expect(Number(m!.ratio.toFixed(2))).toBe(esperado);
    });
  }

  /**
   * ⭐ Y QUE NO SE COLE UNA DEUDA SIN CENSAR. Es la jueza que sostiene todo lo
   * demás: el bucle de arriba solo mira los pares que ya conoce, así que sin
   * esta, uno nuevo incumpliendo entraría en silencio.
   *
   * ⚠️ Se compara la lista ENTERA, no la cuenta. Un `length` cuadraría igual
   *    si un par se arreglara y otro se rompiera a la vez.
   */
  it('⭐ ningún par por debajo del umbral que no esté censado', () => {
    const bajos = medidos.filter((m) => m.ratio < AA_TEXTO).map((m) => m.clave);
    expect(bajos.sort()).toEqual(Object.keys(DEUDA).sort());
  });

  /**
   * ⭐ (ii-ter) LOS LÍMITES NO TEXTUALES, a 3:1 [WCAG 1.4.11] (14/09, fase C).
   *
   * La ficha de contorno y el círculo terminal se eligieron POR ESTO: lo que
   * identifica el componente tiene que distinguirse de lo que tiene al lado, en
   * reposo Y sobre la banda del realce. Un borde no es texto y su vara es 3:1,
   * así que va en su propia lista y no mezclado con los pares de 4,5.
   */
  it('⭐ los 18 límites, en los dos temas, a 3:1 o más', () => {
    // ⚠️ Y del 12 al 18 (el puente-bis): el borde de cada chip de estado del
    //    panel, contra su superficie Y contra la página en la que se pinta —los
    //    cuatro: caducado, vigente, el ámbar de la casa y el gris—. El gris usa
    //    `muted-foreground` de borde: con `--border` se quedaba en 1,4 y con el
    //    #999 de hoy, en 2,50 sobre su superficie.
    // ⚠️ Y del 9 al 11 (el puente, 15/09): la frontera de los campos contra la
    //    tarjeta —2,85 y 1,23 en claro, en producción; bitácora del 15/09—, el
    //    anillo del foco de los campos, que no existía, y la opción activa de un
    //    desplegable contra su lista.
    // ⚠️ Eran 4 (fase C). Desde la tanda 6 (15/09): los dos «con el ratón» se
    //    miden sobre el realce, que es donde se pintan, y no sobre la banda de la
    //    que tomaba prestado el color; y entra el BORDE ÁMBAR contra sus tres
    //    vecinos —la tarjeta, su propio ámbar y el realce— más el anillo del
    //    foco del paso sobre el realce. El borde ámbar suspendía en oscuro y
    //    esta lista no lo nombraba: bitácora del 15/09.
    expect(LIMITES.map((l) => `${l.borde}/${l.fondo}`)).toEqual([
      'muted-foreground/card',
      'muted-foreground/superficie-realce',
      'primary/card',
      'primary/superficie-realce',
      'warning-border/card',
      'warning-border/warning',
      'warning-border/superficie-realce',
      'ring/superficie-realce',
      'borde-de-campo/card',
      'ring/card',
      'foreground/card',
      'estado-caducado-borde/estado-caducado-superficie',
      'estado-caducado-borde/background',
      'estado-vigente-borde/estado-vigente-superficie',
      'estado-vigente-borde/background',
      'warning-border/background',
      'muted-foreground/muted',
      'muted-foreground/background',
    ]);
    for (const tema of ['light', 'dark'] as const) {
      for (const l of LIMITES) {
        const r = contraste(tabla[tema][l.borde]!, tabla[tema][l.fondo]!);
        expect(r, `${tema} · ${l.rotulo}`).toBeGreaterThanOrEqual(AA_GRAFICO);
      }
    }
  });

  /** La aritmética de la página es la misma que la del juez, no una parecida. */
  it('aHex y contraste son los del proyecto: ida y vuelta sin perder nada', () => {
    expect(aHex({ r: 30, g: 41, b: 59 })).toBe('#1e293b');
    expect(contraste('#1e293b', '#ffffff')).toBeCloseTo(14.63, 2);
  });
});

/**
 * ⭐ (iii) NI UNA PETICIÓN A GOOGLE FONTS, en ningún sitio de la app.
 *
 * El `index.css` de la referencia abre con un `@import` a
 * `fonts.googleapis.com`. Es la única línea suya que se descarta a propósito:
 * cargar la letra en remoto manda **la IP de quien mira** a un tercero sin base
 * legal habiendo alternativa neutra — Juzgado Regional de Múnich, enero de
 * 2022. La alternativa neutra es servir el `.woff2` desde el propio dominio, y
 * es lo que se hace.
 *
 * ⚠️ Se buscan LOS DOS dominios: `fonts.googleapis.com` sirve la hoja de
 *    estilos y `fonts.gstatic.com` los ficheros de letra. Vigilar solo el
 *    primero dejaría pasar un `@font-face` que apuntara al segundo.
 */
describe('⭐ (iii) LA LETRA NO VIENE DE GOOGLE', () => {
  /**
   * ⭐ LA JUEZ QUE BARRE, y no una lista escrita a mano.
   *
   * ⚠️ Una lista de ficheros solo cubre los que había el día que se escribió.
   *    Es la enfermedad que ya diagnosticaron la nº39 y la nº40 —la regla
   *    escrita como enumeración—, y aquí sería particularmente mala: el
   *    componente que mañana meta un `@import` a Google no estaría en la
   *    lista, y por eso mismo pasaría. `import.meta.glob` los trae todos, los
   *    de hoy y los que se creen después.
   */
  const TODO_LO_QUE_SE_SIRVE: Record<string, string> = ((): Record<string, string> => {
    const salida: Record<string, string> = {};
    const bajar = (dir: string): void => {
      for (const e of readdirSync(RAIZ + dir, { withFileTypes: true }) as {
        name: string;
        isDirectory(): boolean;
      }[]) {
        const rel = dir + '/' + e.name;
        if (e.isDirectory()) {
          bajar(rel);
        } else if (/\.(css|html)$/.test(e.name)) {
          salida[rel] = leer(rel);
        }
      }
    };
    bajar('app/src');
    return salida;
  })();

  it('la juez barre de verdad: hay ficheros que mirar', () => {
    // Sin esto, un glob que no casara con nada daría verde en todo lo de abajo
    // por la razón equivocada — porque no mira nada, no porque esté limpio.
    const cuantos = Object.keys(TODO_LO_QUE_SE_SIRVE).length;
    expect(cuantos, 'el barrido no ha encontrado ni un fichero').toBeGreaterThan(10);
    expect(Object.keys(TODO_LO_QUE_SE_SIRVE)).toContain('app/src/styles.css');
  });

  for (const dominio of ['fonts.googleapis.com', 'fonts.gstatic.com']) {
    it(`ningún fichero de la app pide nada a ${dominio}`, () => {
      // ⚠️ SE BUSCA EL DOMINIO A SECAS, sin intentar reconocer la sintaxis de
      //    la petición. La primera versión exigía un `url(`, `src=` o `href=`
      //    delante, y daba VERDE con un `@import url('https://fonts.google…')`
      //    puesto a propósito: su clase de caracteres excluía las comillas, que
      //    es exactamente donde vive la URL. Ver bitácora nº42.
      //
      //    La mención en un comentario que explica por qué NO se usa sí es
      //    legítima, y por eso se quitan los comentarios antes de mirar: lo que
      //    queda es lo que el navegador va a leer.
      for (const [ruta, texto] of Object.entries(TODO_LO_QUE_SE_SIRVE)) {
        expect(sinComentarios(texto).includes(dominio), `${ruta} pide ${dominio}`).toBe(false);
      }
    });
  }

  it('⭐ Inter se sirve del propio dominio, y con los tres pesos', () => {
    for (const peso of ['400', '500', '600']) {
      expect(CSS).toContain(`font-weight: ${peso}`);
    }
    for (const f of ['Inter-Regular', 'Inter-Medium', 'Inter-SemiBold']) {
      expect(CSS).toContain(`url('/fuentes/${f}.woff2') format('woff2')`);
    }
    // Rutas absolutas del propio sitio: ni `http`, ni `//`, ni otro dominio.
    expect(CSS).not.toMatch(/src:\s*url\(['"]?(https?:)?\/\//);
  });

  it('font-display: swap en los tres, para que el texto se lea desde el principio', () => {
    // Sin comentarios: la cabecera de `styles.css` menciona `font-display:
    // swap` para explicarlo, y contando el texto crudo salian CUATRO.
    expect(sinComentarios(CSS).match(/font-display:\s*swap/g)?.length).toBe(3);
  });

  /**
   * [DOC MDN] La propiedad de alto nivel, no `font-feature-settings: "tnum"`.
   * La referencia usa la sintaxis vieja; se calca el efecto, no la sintaxis —
   * `font-feature-settings` pisa el resto de características de la fuente.
   */
  it('las cifras tabulares se piden con font-variant-numeric', () => {
    const css = sinComentarios(CSS_DE_LA_PAGINA);
    expect(css).toContain('font-variant-numeric: tabular-nums');
    // El comentario SI la nombra, para explicar por que no se usa; lo que
    // no puede haber es una declaracion de verdad.
    expect(css).not.toContain('font-feature-settings');
  });
});

/**
 * La página monta y trae sus filas. ⚠️ Aquí NO se comprueban colores: en jsdom
 * saldrían todos vacíos (ver la cabecera). Lo que se comprueba es que están
 * todas las filas y todas las sondas, que es lo que el navegador necesita
 * encontrar para poder medir.
 */
describe('LA PÁGINA de identidad monta con todo lo que hay que medir', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Identidad] }).compileComponents();
  });

  it('trae una sonda por token y por tema: 104', () => {
    const f = TestBed.createComponent(Identidad);
    f.detectChanges();
    const raiz = f.nativeElement as HTMLElement;
    expect(raiz.querySelectorAll('[data-sonda] [data-token]').length).toBe(104);
    expect(raiz.querySelectorAll("[data-sonda='light'] [data-token]").length).toBe(52);
    expect(raiz.querySelectorAll("[data-sonda='dark'] [data-token]").length).toBe(52);
  });

  it('pinta los seis modos con sus cuatro variantes', () => {
    const f = TestBed.createComponent(Identidad);
    f.detectChanges();
    const raiz = f.nativeElement as HTMLElement;
    expect(raiz.querySelectorAll('.identidad__modo').length).toBe(MODOS.length);
    expect(raiz.querySelectorAll('.identidad__variante').length).toBe(MODOS.length * 4);
    // Dos píldoras por modo: la seleccionada y la que no lo está.
    expect(raiz.querySelectorAll('.identidad__pildora').length).toBe(MODOS.length * 2);
  });

  it('⭐ pinta los límites no textuales: una fila por límite y por tema (fase C)', () => {
    const f = TestBed.createComponent(Identidad);
    f.detectChanges();
    const raiz = f.nativeElement as HTMLElement;
    // Un color que vive en la hoja y no en esta página no lo mide nadie.
    expect(raiz.querySelectorAll('.identidad__limite').length).toBe(LIMITES.length * 2);
  });

  it('el conmutador es LOCAL: pone data-theme en la página y no en <html>', () => {
    const f = TestBed.createComponent(Identidad);
    f.detectChanges();
    const raiz = f.nativeElement as HTMLElement;
    const seccion = raiz.querySelector('.identidad')!;
    const antes = document.documentElement.getAttribute('data-theme');

    expect(seccion.getAttribute('data-theme')).toBe('light');
    raiz.querySelector<HTMLButtonElement>('.identidad__conmutador')!.click();
    f.detectChanges();

    expect(seccion.getAttribute('data-theme')).toBe('dark');
    // ⭐ Lo que de verdad importa: el documento no se ha enterado.
    expect(document.documentElement.getAttribute('data-theme')).toBe(antes);
  });

  it('dice NO CONSTA cuando no ha podido medir, en vez de enseñar ceros', () => {
    // Es lo que pasa aquí mismo: jsdom no resuelve var(). La página lo declara
    // en lugar de pintar un contraste inventado.
    const f = TestBed.createComponent(Identidad);
    f.detectChanges();
    const raiz = f.nativeElement as HTMLElement;
    expect(raiz.querySelector('.identidad__nomide')).not.toBeNull();
  });
});

/**
 * ⭐ (v) LA BASE DEL PRODUCTO — el primer cambio que se ve (tanda 2).
 *
 * Aquí se juzga lo que la app entera hereda: el fondo, el texto, la letra y el
 * tema fijado. Lo que NO se juzga aquí es cómo queda en pantalla —eso lo mide
 * `e2e/identidad.mjs` en Chrome—, porque jsdom no resuelve `var()`.
 */
describe('⭐ (v) LA BASE — el body vestido, y la letra que llega a tiempo', () => {
  const HTML = leer('app/src/index.html');
  const base = sinComentarios(bloque(CSS, 'body {'));

  /**
   * ⭐ EL SAFE-AREA, Y SUS DOS MITADES (11/09, tanda de móvil).
   *
   * [DOC MDN, `env()`] las cuatro variables `safe-area-inset-*` **valen 0
   * mientras el viewport no sea `cover`**. La barra de pestañas pide
   * `env(safe-area-inset-bottom)` de relleno para no quedarse debajo del
   * indicador de inicio de un iPhone; sin la palabra en el meta, ese relleno
   * sería 0 y la barra estaría tapada justo en el aparato para el que se hizo.
   *
   * ⚠️ **Las dos mitades se compran JUNTAS y a propósito.** Cada una sola es
   *    peor que ninguna: el meta sin el relleno mete la página debajo del
   *    indicador y no la aparta; el relleno sin el meta es una declaración que
   *    siempre vale 0. Una jueza por mitad dejaría pasar las dos medias obras.
   *
   * ⚠️ Y esto NO se puede medir en Chrome de escritorio, donde no hay notch y
   *    `env()` vale 0 igualmente. Lo que se comprueba aquí es que **está
   *    declarado**; el juicio de verdad es el teléfono de Antonio.
   */
  it('⭐ el safe-area está declarado por entero: el meta `cover` Y el relleno', () => {
    expect(HTML).toMatch(/<meta[^>]*name="viewport"[^>]*viewport-fit\s*=\s*cover/);
    expect(sinComentarios(bloque(CSS, '.barra {'))).toContain(
      'padding-bottom: env(safe-area-inset-bottom)',
    );
  });

  it('el body toma el fondo y el texto de los tokens, no de un hex suelto', () => {
    expect(base).toContain('background-color: var(--background)');
    expect(base).toContain('color: var(--foreground)');
    expect(base).toContain('font-family: var(--font-sans)');
  });

  it('las cifras del producto son tabulares, con la propiedad de alto nivel', () => {
    expect(base).toContain('font-variant-numeric: tabular-nums');
    expect(base).not.toContain('font-feature-settings');
  });

  it('y el suavizado que trae la referencia en su base', () => {
    expect(base).toContain('-webkit-font-smoothing: antialiased');
    expect(base).toContain('-moz-osx-font-smoothing: grayscale');
  });

  /**
   * ⭐ El margen del body, a cero — y esta jueza pedía lo contrario hasta la
   * tanda 3.
   *
   * ⚠️ Mientras el `body` solo estaba vestido, tocarle el margen habría movido
   *    la página ocho píxeles sin ganar nada, y esta jueza lo prohibía. Con el
   *    esqueleto encima la cuenta cambia: la app ocupa **exactamente** la
   *    pantalla, y esos 8 px hacían que el documento midiera 860 en una ventana
   *    de 844 — scroll global, que es justo lo que el layout no puede tener.
   *    Se reformula en vez de borrarse para que quede dicho por qué cambió.
   */
  it('⭐ el body pone su margen a cero, que es lo que el esqueleto exige', () => {
    expect(base).toMatch(/margin:\s*0/);
  });

  /**
   * ⭐ EL RESET QUE HAY QUE ESCRIBIR SIEMPRE.
   *
   * Los controles de formulario **no heredan la tipografía**: sin esto, el
   * `body` pasa a Inter y los `select`, `input` y botones —el cuerpo entero de
   * esta pantalla— se quedan en la letra del sistema.
   */
  it('⭐ los controles de formulario heredan la tipografía', () => {
    // Se lee el selector entero, no cada nombre suelto: buscar «input,» a pelo
    // casaría con cualquier sitio del fichero donde apareciera esa palabra.
    const m = /((?:\s*(?:button|input|select|textarea),?)+)\s*\{([^}]*)\}/.exec(
      sinComentarios(CSS),
    );
    expect(m, 'no encuentro el reset de herencia de los controles').not.toBeNull();
    const nombres = m![1]!.split(',').map((x) => x.trim()).filter(Boolean).sort();
    expect(nombres).toEqual(['button', 'input', 'select', 'textarea']);
    // Solo la tipografía: tocar tamaños o colores aquí movería el layout.
    expect(m![2]!.trim()).toBe('font: inherit;');
  });

  /**
   * ⭐ **ACTA DE LA LIBERACIÓN DEL TEMA (16/09, tanda 6 · parte 3).**
   *
   * Aquí ponía `expect(HTML).toMatch(/<html[^>]*\sdata-theme="light"/)` con este
   * porqué: *«con el `body` ya en tokens pero los componentes todavía sin
   * vestir, dejar que mande `prefers-color-scheme` pintaría un fondo oscuro
   * debajo de piezas pensadas para fondo claro: un estado intermedio roto. Se
   * libera con el conmutador, cuando los componentes estén migrados.»*
   *
   * **Los componentes están migrados** —resultado, mapa, Buscador y `/panel`,
   * los cuatro con su jueza— y el conmutador entra en este commit. Así que el
   * clavo sale, y la jueza se da la vuelta: lo que ahora se vigila es que el
   * atributo **NO** esté escrito a mano.
   *
   * ⚠️ Y no es un detalle de limpieza. Con `data-theme="light"` en el HTML, el
   *    `:not([data-theme='light'])` de la capa 2 **no casaba nunca**: el §35
   *    estaba escrito entero en el CSS y desconectado en la práctica. Medido el
   *    16/09 con `prefers-color-scheme: dark` emulado antes de navegar: fondo
   *    pintado `rgb(255, 255, 255)` y `color-scheme` computado `light`. El
   *    sistema no mandaba, y ninguna jueza lo decía porque todas daban por
   *    bueno el clavo.
   */
  it('⭐ <html> ya NO clava el tema: el sistema y la elección mandan', () => {
    const etiqueta = /<html[^>]*>/.exec(HTML)?.[0] ?? '';
    expect(etiqueta, 'no encuentro la etiqueta <html>').not.toBe('');
    expect(etiqueta, 'el tema sigue clavado a mano en el HTML').not.toContain('data-theme');
  });

  /**
   * ⭐ LA JUEZA DEL DOBLE DESCARGUE, que es la que de verdad hace falta aquí.
   *
   * ⚠️ Un `preload` cuya URL no coincida **letra por letra** con la del
   *    `@font-face` no ahorra nada: el navegador no reconoce lo precargado y
   *    **baja el fichero dos veces**. Y no avisa de nada — solo se ve mirando
   *    la red. Por eso las dos se extraen y se comparan, en vez de darlas por
   *    buenas porque «las escribí iguales».
   */
  it('⭐ el preload y el @font-face piden EXACTAMENTE la misma URL', () => {
    const precargada = /<link[^>]*rel="preload"[^>]*href="([^"]+)"/.exec(HTML)?.[1];
    const enElCss = /src:\s*url\('([^']*Inter-Regular[^']*)'\)/.exec(CSS)?.[1];
    expect(precargada, 'no hay preload de fuente en index.html').toBeDefined();
    expect(enElCss, 'no encuentro el @font-face del peso 400').toBeDefined();
    expect(precargada).toBe(enElCss);
  });

  it('el preload se declara como fuente, con su tipo y anónimo', () => {
    const link = /<link[^>]*rel="preload"[^>]*>/.exec(HTML)?.[0] ?? '';
    expect(link).toContain('as="font"');
    expect(link).toContain('type="font/woff2"');
    // Sin `crossorigin` la petición precargada no casa con la real: dos veces.
    expect(link).toContain('crossorigin');
  });

  it('⚠️ solo se precarga el peso 400, que es el del texto corrido', () => {
    const precargas = HTML.match(/<link[^>]*rel="preload"[^>]*>/g) ?? [];
    expect(precargas.length).toBe(1);
    expect(precargas[0]).toContain('Inter-Regular');
  });

  /**
   * El respaldo con métricas ajustadas: es lo que quita el salto de maquetación
   * cuando Inter entra por `swap`. `local('Arial')` no descarga nada.
   */
  it('⭐ el respaldo lleva las métricas ajustadas, y va en la pila', () => {
    // ⚠️ `bloque()` toma un SELECTOR y busca la llave que sigue. Pasarle una
    //    declaración de dentro —`font-family: 'Inter Fallback'`— le hace saltar
    //    a la llave del bloque SIGUIENTE. Aquí se recorta el `@font-face` que
    //    contiene esa familia, que es lo que hacía falta.
    const respaldo =
      (sinComentarios(CSS).match(/@font-face\s*\{[^}]*\}/g) ?? []).find((b) =>
        b.includes("'Inter Fallback'"),
      ) ?? '';
    expect(respaldo).toContain("local('Arial')");
    expect(respaldo).toContain('size-adjust: 107.64%');
    expect(respaldo).toContain('ascent-override: 90.49%');
    expect(respaldo).toContain('descent-override: 22.48%');
    // Detrás de Inter y delante de system-ui: solo vale mientras Inter no está.
    expect(EN_ROOT['font-sans']).toBe("'Inter', 'Inter Fallback', system-ui, sans-serif");
  });
});

/**
 * ⭐ (vi) LOS COLORES A PELO EN LAS HOJAS DEL RESULTADO (15/09, tanda 6).
 *
 * La cicatriz de la casa: un color que vive en la hoja y no en la lista no lo
 * mide nadie. Pasó con la banda el 11/09 y volvió a pasar en grande el 15/09:
 * con el oscuro puesto, el `strong` de los pasos (#1a1a1a) leía a 1,04:1 y
 * «Se viaja en» (#555) a 2,24, con el censo en verde. Bitácora del 15/09.
 *
 * [Android Developers · migrar a tema oscuro] el asesino clásico son los
 * colores escritos a pelo, que no cambian con el tema: se prefieren atributos
 * de tema. Aquí, `var(--…)`.
 *
 * ⚠️ BARRE, no enumera reglas: toda declaración con un color que no sea la
 *    definición de un token tiene que estar en la lista de abajo CON SU PORQUÉ.
 *    Una nueva entra en rojo y obliga a decidir: tokenizarla o escribir por qué
 *    se queda.
 *
 * ⚠️ Y DESDE EL PUENTE (15/09) BARRE TODAS LAS HOJAS DE LA APP, no una lista.
 *    Leía tres —`styles.css`, `buscador.css` y `resultado.css`— y daba verde con
 *    el formulario del Buscador lleno de `#999` y `#fff`: vivían en las hojas de
 *    `app-autocompletar-via` y `app-selector-portal`, y la regla `.campo input`
 *    que SÍ barría, en `buscador.css`, no alcanzaba a ningún campo por la
 *    encapsulación. Bitácora del 15/09. Una lista de hojas solo cubre las que
 *    había el día que se escribió: la lección de la (iii), que ya barría.
 *
 * ⚠️ Y reconoce los colores CON NOMBRE (`white`, `gray`…) y las funciones de
 *    color modernas: la versión anterior solo veía hex, `rgb()` y `hsl()`.
 */
describe('⭐ (vi) NI UN COLOR A PELO en ninguna hoja de la app, salvo los que dicen por qué', () => {
  const HOJAS: readonly string[] = ((): string[] => {
    const salida: string[] = [];
    const bajar = (dir: string): void => {
      for (const e of readdirSync(RAIZ + dir, { withFileTypes: true }) as {
        name: string;
        isDirectory(): boolean;
      }[]) {
        const rel = dir + '/' + e.name;
        if (e.isDirectory()) bajar(rel);
        else if (e.name.endsWith('.css')) salida.push(rel);
      }
    };
    bajar('app/src');
    return salida.sort();
  })();
  const NOMBRES =
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray grey green greenyellow honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen canvas canvastext field fieldtext buttonface buttontext highlight highlighttext graytext';
  const COLOR = new RegExp(
    '#[0-9a-f]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|(?<![-\\w])(?:' +
      NOMBRES.split(' ').join('|') +
      ')(?![-\\w])',
    'i',
  );
  /** Propiedades donde una palabra no es un color: nombres de letra y de animación. */
  const NO_SON_COLOR = new Set(['font-family', 'animation', 'animation-name', 'grid-template-areas', 'content', 'transition', 'will-change']);

  /** `hoja · propiedad: valor`, repetidos tantas veces como aparezcan. */
  const aPelo = (): string[] =>
    HOJAS.flatMap((hoja) =>
      [...sinComentarios(leer(hoja)).matchAll(/(?<=^|[;{])\s*([-\w]+)\s*:\s*([^;{}]+);/g)]
        .filter((m) => !m[1]!.startsWith('--') && !NO_SON_COLOR.has(m[1]!) && COLOR.test(m[2]!))
        // ⚠️ El `(?<=…)` mira atrás SIN comerse el `;`. La primera versión lo
        //    consumía y se saltaba una declaración de cada dos: no veía el #1a1a1a
        //    del `strong` ni el #334155 de la región. Cazado depurando su rojo.
        .map((m) => `${hoja.split('/').pop()} · ${m[1]}: ${m[2]!.trim()}`),
    );

  /**
   * Los que se quedan, y por qué. Ninguno lleva la legibilidad de un texto ni
   * el límite de un componente EN EL TEMA: por eso no necesitan par.
   */
  const SE_QUEDAN: readonly string[] = [
    // Sombras: adorno de elevación. En oscuro la elevación la dicen las
    // superficies [M3: overlay tonal — tarjeta #1e1e1e sobre fondo #121212], y
    // una sombra negra sobre oscuro no pinta nada que haga falta leer.
    'styles.css · box-shadow: 0 1px 2px rgb(0 0 0 / 5%)',
    'styles.css · box-shadow: 0 0 12px rgb(0 0 0 / 8%)',
    'styles.css · box-shadow: 2px 0 6px rgb(0 0 0 / 12%)',
    'buscador.css · box-shadow: 0 1px 2px rgb(0 0 0 / 0.05)',
    'buscador.css · box-shadow: 0 1px 2px rgb(0 0 0 / 0.05)',
    // El trazo negro del número del chip: el chip lleva SU fondo (el color de la
    // línea), así que su contraste no depende del tema [chip.ts].
    'styles.css · -webkit-text-stroke: 2px #000',
    // El ribete del chip. Al acta de la tanda 6: el chip se identifica por su
    // número —legible por contorno en los dos temas— y su borde no es límite
    // exigible [WCAG 1.4.11]; en oscuro el negro al 25 % no pinta nada, y
    // cambiarlo es cambiar la insignia, que es decisión de Antonio [chip.ts].
    'styles.css · border: 1px solid rgb(0 0 0 / 25%)',
    // La sombra de las dos listas que flotan (el puente, 15/09): adorno de
    // elevación, como las de arriba. En oscuro lo que separa la lista de lo que
    // tiene debajo es su frontera, `--borde-de-campo`, medida a 3:1.
    'autocompletar-via.css · box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15)',
    'selector-portal.css · box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15)',
    // ⚠️ Aquí vivieron los 21 colores a pelo de `panel.css`, declarados por el
    //    puente (15/09) como «fuera de alcance». El puente-bis (16/09) los vistió
    //    con tokens y salen de esta lista: **no es un cementerio**, lo que se
    //    queda se queda con un porqué vigente. El barrido de rutas del 16/09
    //    confirmó que `/panel` era la última página sin vestir.
  ];

  it('la jueza barre de verdad: TODAS las hojas, y las que pintan tienen declaraciones que mirar', () => {
    // Las diez de hoy, contadas: sin esto, un barrido que no bajara a `app/`
    // daría verde por no mirar nada.
    expect(HOJAS.length).toBeGreaterThanOrEqual(10);
    for (const hoja of [
      'app/src/styles.css',
      'app/src/app/buscador.css',
      'app/src/app/resultado.css',
      'app/src/app/autocompletar-via.css',
      'app/src/app/selector-portal.css',
      'app/src/app/mapa.css',
      'app/src/app/panel.css',
    ]) {
      expect(HOJAS, hoja).toContain(hoja);
    }
    for (const hoja of ['app/src/styles.css', 'app/src/app/buscador.css', 'app/src/app/resultado.css']) {
      expect(sinComentarios(leer(hoja)).match(/:\s*var\(--/g)?.length ?? 0, hoja).toBeGreaterThan(10);
    }
  });

  it('y reconoce un color con nombre: su contraprueba vive en la propia jueza', () => {
    expect(COLOR.test('1px solid white')).toBe(true);
    expect(COLOR.test('var(--card)')).toBe(false);
    expect(COLOR.test('color-mix(in srgb, var(--card) 90%, transparent)')).toBe(false);
    expect(COLOR.test('not-allowed')).toBe(false);
  });

  it('⭐ los colores a pelo son EXACTAMENTE los que dicen por qué', () => {
    expect(aPelo().sort()).toEqual([...SE_QUEDAN].sort());
  });

  /**
   * ⭐ Y EL REALCE YA NO TOMA PRESTADA LA BANDA. Mientras el paso se pintaba
   * con `--banda-cabecera`, cambiar la cabecera del acordeón movía el realce sin
   * que ninguna jueza lo supiera. Cada token, en las reglas de su papel.
   */
  it('⭐ la banda solo la usa la cabecera del acordeón, y el realce solo el paso', () => {
    const usos = (token: string): string[] =>
      // `identidad.css` ya viene en el barrido: añadirla aparte la contaría dos veces.
      HOJAS.flatMap((hoja) =>
        [...sinComentarios(leer(hoja)).matchAll(/([^{};]+)\{([^{}]*)\}/g)]
          // `includes` con el paréntesis de cierre, y no una RegExp montada con
          // plantilla: así `banda-cabecera` no casa con `banda-cabecera-hover`,
          // y no hay escapes que se pierdan por el camino (se perdieron).
          .filter((m) => m[2]!.includes(`var(--${token})`))
          .map((m) => m[1]!.trim()),
      );
    expect(usos('banda-cabecera')).toEqual(['.bloque__cabecera']);
    expect(usos('banda-cabecera-hover')).toEqual(['.bloque__cabecera:hover']);
    expect(usos('superficie-realce').sort()).toEqual(['.paso:focus-visible', '.paso:hover']);
  });
});

/**
 * ⭐ (vii) LOS CAMPOS DEL BUSCADOR, CON LOS TOKENS QUE TIENEN PAR (el puente, 15/09).
 *
 * El formulario va a salir en oscuro con la parte 3, y sus campos no los pinta
 * `buscador.css`: los de calle y portal viven en `app-autocompletar-via` y
 * `app-selector-portal`, y con la encapsulación emulada una regla del padre no
 * alcanza a un `input` del hijo. Medido en la sonda del diagnóstico: en claro,
 * la frontera leía a 2,85:1 (`#999`) y la del desplegable a 1,23; en oscuro, la
 * lista de portales era `#fff` con la letra clara heredada. Bitácora del 15/09.
 *
 * Aquí se fija QUÉ token lleva cada papel; que el token llegue a su vara lo
 * fijan el censo de arriba (pares y límites) y la P27 sobre el píxel.
 */
describe('⭐ (vii) LOS CAMPOS DEL BUSCADOR se visten con los tokens que el censo mide', () => {
  /** Las reglas de una hoja: selector normalizado → cuerpo. Varias si se repite. */
  const reglas = (hoja: string): { sel: string; cuerpo: string }[] =>
    [...sinComentarios(leer(hoja)).matchAll(/([^{};]+)\{([^{}]*)\}/g)].map((m) => ({
      sel: m[1]!.replace(/\s+/g, ' ').trim(),
      cuerpo: m[2]!,
    }));
  const cuerpoDe = (hoja: string, sel: string): string =>
    reglas(hoja)
      .filter((r) => r.sel === sel)
      .map((r) => r.cuerpo)
      .join('\n');

  for (const [hoja, lista, activa] of [
    ['app/src/app/autocompletar-via.css', '.sugerencias', '.sugerencia--activa'],
    ['app/src/app/selector-portal.css', '.portales', '.portal--activo'],
  ] as const) {
    const nombre = hoja.split('/').pop();

    it(`${nombre} · el campo: frontera de campo, fondo de tarjeta y letra de la casa`, () => {
      const c = cuerpoDe(hoja, '.campo input');
      expect(c).toMatch(/border:\s*1px solid var\(--borde-de-campo\)/);
      expect(c).toMatch(/background-color:\s*var\(--card\)/);
      expect(c).toMatch(/color:\s*var\(--foreground\)/);
    });

    it(`${nombre} · el foco del campo es el anillo de la casa [WCAG 2.4.7]`, () => {
      expect(cuerpoDe(hoja, '.campo input:focus-visible')).toMatch(/outline:\s*2px solid var\(--ring\)/);
    });

    it(`${nombre} · la lista flota sobre la tarjeta, con su frontera y su letra`, () => {
      const c = cuerpoDe(hoja, lista);
      expect(c).toMatch(/background:\s*var\(--card\)/);
      expect(c).toMatch(/border:\s*1px solid var\(--borde-de-campo\)/);
      expect(c).toMatch(/color:\s*var\(--foreground\)/);
    });

    it(`${nombre} · la opción activa va invertida: la tarjeta sobre foreground`, () => {
      const c = cuerpoDe(hoja, activa);
      expect(c).toMatch(/background:\s*var\(--foreground\)/);
      expect(c).toMatch(/color:\s*var\(--card\)/);
    });

    it(`${nombre} · el borrador es el ámbar de la casa, con sus tokens`, () => {
      const c = cuerpoDe(hoja, '.campo input.campo__entrada--borrador');
      expect(c).toMatch(/border-color:\s*var\(--warning-border\)/);
      expect(c).toMatch(/background:\s*var\(--warning\)/);
    });
  }

  it('selector-portal.css · el texto de ayuda del número va en el gris que tiene par', () => {
    const c = cuerpoDe('app/src/app/selector-portal.css', '.campo input::placeholder');
    expect(c).toMatch(/color:\s*var\(--muted-foreground\)/);
    expect(c).toMatch(/opacity:\s*1/);
  });

  it('buscador.css · la matrícula, campo nativo, solo lleva el gris de su texto de ayuda', () => {
    const c = cuerpoDe('app/src/app/buscador.css', '.matricula__campo::placeholder');
    expect(c).toMatch(/color:\s*var\(--muted-foreground\)/);
    expect(reglas('app/src/app/buscador.css').filter((r) => /matricula__campo/.test(r.sel)).map((r) => r.sel)).toEqual([
      '.matricula__campo::placeholder',
    ]);
  });

  it('buscador.css · el desplegable del tipo y su lista llevan la frontera de campo', () => {
    expect(cuerpoDe('app/src/app/buscador.css', '.tipo')).toMatch(/border:\s*1px solid var\(--borde-de-campo\)/);
    const picker = cuerpoDe('app/src/app/buscador.css', '.tipo::picker(select)');
    expect(picker).toMatch(/border:\s*1px solid var\(--borde-de-campo\)/);
    expect(picker).toMatch(/color:\s*var\(--foreground\)/);
  });

  /**
   * ⚠️ Y buscador.css NO VUELVE A TENER UNA REGLA DE `input` QUE NO PINTA NADA.
   *    Las tres de `.campo input` decían «44 px, `var(--border)`, `var(--card)`»
   *    y ningún campo las recibía. Una regla que no se aplica es peor que ninguna:
   *    parece que manda, y la jueza (vi) la daba por limpia.
   */
  it('⭐ buscador.css no tiene reglas de `.campo input`: los campos son de sus componentes', () => {
    const muertas = reglas('app/src/app/buscador.css').filter((r) => /\.campo input/.test(r.sel));
    expect(muertas.map((r) => r.sel)).toEqual([]);
  });
});

/**
 * ⭐ (viii) EL PANEL DE FRESCURA, CON LOS TOKENS DE LA CASA (el puente-bis, 16/09).
 *
 * `/panel` es la última página que quedaba sin vestir: el barrido de rutas del
 * 16/09 la capturó bajo `data-theme=dark` con **193 textos por debajo de 4,5:1**
 * y el peor a 1,03 —la cabecera de la tabla, letra clara sobre su #f3f3f3—.
 * Aquí se fija qué token lleva cada papel; que cada token llegue a su vara lo
 * fija el censo de arriba, y que se pinte, la P28 sobre el píxel.
 *
 * ⚠️ El panel se pinta sobre la PÁGINA, no sobre una tarjeta: sus grises se
 *    miden contra `background`, que en oscuro (#121212) no es `card` (#1e1e1e).
 */
describe('⭐ (viii) EL PANEL DE FRESCURA se viste con los tokens que el censo mide', () => {
  const HOJA = 'app/src/app/panel.css';
  const reglas = (hoja: string): { sel: string; cuerpo: string }[] =>
    [...sinComentarios(leer(hoja)).matchAll(/([^{};]+)\{([^{}]*)\}/g)].map((m) => ({
      sel: m[1]!.replace(/\s+/g, ' ').trim(),
      cuerpo: m[2]!,
    }));
  const cuerpoDe = (sel: string): string =>
    reglas(HOJA)
      .filter((r) => r.sel === sel)
      .map((r) => r.cuerpo)
      .join('\n');

  it('los textos del panel llevan los grises de la casa', () => {
    expect(cuerpoDe('.panel__intro')).toMatch(/color:\s*var\(--foreground\)/);
    expect(cuerpoDe('.panel__hoy')).toMatch(/color:\s*var\(--muted-foreground\)/);
    expect(cuerpoDe('.panel__ruta')).toMatch(/color:\s*var\(--muted-foreground\)/);
    expect(cuerpoDe('.panel__noconsta')).toMatch(/color:\s*var\(--muted-foreground\)/);
    expect(cuerpoDe('.panel__fuente')).toMatch(/color:\s*var\(--leyenda\)/);
    expect(cuerpoDe('.panel__pie')).toMatch(/color:\s*var\(--leyenda\)/);
  });

  it('la tabla: el filete de la casa y la cabecera sobre la superficie apagada', () => {
    expect(cuerpoDe('.panel__tabla th, .panel__tabla td')).toMatch(/border:\s*1px solid var\(--border\)/);
    expect(cuerpoDe('.panel__tabla thead th')).toMatch(/background:\s*var\(--muted\)/);
  });

  it('⭐ el aviso de fallo va en la tinta del estado caducado', () => {
    expect(cuerpoDe('.panel__fallo')).toMatch(/color:\s*var\(--estado-caducado-tinta\)/);
  });

  /**
   * ⭐ LOS CUATRO CHIPS, cada uno con su trío. Dos estrenan familia —caducado y
   * vigente—; los otros dos NO estrenan nada: el «por revisar» es el ámbar de la
   * casa y el «sin regla» es su gris. El borde del gris pasa a
   * `muted-foreground`: el #999 de hoy daba 2,50 sobre su propia superficie.
   */
  it('⭐ los cuatro estados llevan superficie, borde y tinta con token', () => {
    const trio = (sel: string): string[] =>
      [...cuerpoDe(sel).matchAll(/var\(--([\w-]+)\)/g)].map((m) => m[1]!);
    expect(trio('.panel__estado--rojo')).toEqual([
      'estado-caducado-superficie',
      'estado-caducado-borde',
      'estado-caducado-tinta',
    ]);
    expect(trio('.panel__estado--verde')).toEqual([
      'estado-vigente-superficie',
      'estado-vigente-borde',
      'estado-vigente-tinta',
    ]);
    expect(trio('.panel__estado--ambar')).toEqual(['warning', 'warning-border', 'warning-dark']);
    expect(trio('.panel__estado--gris')).toEqual(['muted', 'muted-foreground', 'muted-foreground']);
  });

  /**
   * ⚠️ [WCAG 1.4.1, nivel A] el color no puede ser el único medio de transmitir
   * información. Aquí ya se cumplía antes de vestir nada —y por eso este
   * encargo no rediseña—: cada chip lleva su texto. Se vigila desde hoy, que es
   * lo que impide que un rediseño futuro lo pierda sin que nadie lo vea.
   */
  it('⭐ cada chip de estado dice su estado con palabras, no solo con color', () => {
    const plantilla = leer('app/src/app/panel.html');
    const chips = [...plantilla.matchAll(/<span class="panel__estado[^"]*"[^>]*>([^<]*)</g)].map(
      (m) => m[1]!.trim(),
    );
    // Los cuatro del resumen llevan la palabra escrita; el de cada fila la toma
    // del dato (`fila.e.texto`), que es texto de verdad y lo comprueba la P28
    // sobre los 58 pintados. Lo que aquí no puede pasar es que alguno vaya vacío.
    expect(chips.length).toBeGreaterThanOrEqual(5);
    for (const c of chips) {
      expect(c, 'un chip sin nada dentro').not.toBe('');
    }
    const literales = chips.filter((c) => c.replace(/\{\{[^}]*\}\}/g, '').trim() !== '');
    expect(literales.length).toBeGreaterThanOrEqual(4);
    expect(chips.some((c) => /\{\{\s*fila\.e\.texto\s*\}\}/.test(c))).toBe(true);
  });
});
