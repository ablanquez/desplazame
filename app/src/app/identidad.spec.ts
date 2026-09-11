// ⚠️ De Node, y **existen en tiempo de ejecución**: las pruebas corren sobre
// Node. Lo que no existe son sus TIPOS — el proyecto no trae `@types/node`
// porque las dependencias son CERO. Es el mismo apaño, y por la misma razón,
// que ya usa `manifiesto.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { contraste, AA_TEXTO } from './contraste';
import { Identidad, MODOS, PARES, SEMANTICOS, TOKENS_DE_MODO, aHex } from './identidad';

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
  'warning-border': '#92400e',
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
  it('están los 42 tokens: 18 semánticos y 6 modos × 4 variantes', () => {
    // ⚠️ Eran 16 y 40 hasta el 11/09. Los dos nuevos son la banda de las
    //    cabeceras, y son los PRIMEROS que no vienen calcados de la maqueta.
    expect(SEMANTICOS.length).toBe(18);
    expect(TOKENS_DE_MODO.length).toBe(24);
    expect(TODOS.length).toBe(42);
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
  it('⭐ los cuatro bloques asignan los 42 tokens, y a la fuente que toca', () => {
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
const DEUDA: Readonly<Record<string, number>> = {};

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

  it('se miden los 20 pares en los dos temas: 40 medidas', () => {
    // ⚠️ Eran 18 y 36. Los dos nuevos son los DOS estados de la banda: medir
    //    solo el reposo dejaría el hover sin vigilar, que es donde el gris se
    //    aclara y el texto pierde contraste.
    expect(PARES.length).toBe(20);
    expect(medidos.length).toBe(40);
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

  it('trae una sonda por token y por tema: 84', () => {
    const f = TestBed.createComponent(Identidad);
    f.detectChanges();
    const raiz = f.nativeElement as HTMLElement;
    expect(raiz.querySelectorAll('[data-sonda] [data-token]').length).toBe(84);
    expect(raiz.querySelectorAll("[data-sonda='light'] [data-token]").length).toBe(42);
    expect(raiz.querySelectorAll("[data-sonda='dark'] [data-token]").length).toBe(42);
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
   * ⭐ EL TEMA, FIJADO EN CLARO MIENTRAS DURE LA MIGRACIÓN.
   *
   * Con el `body` ya en tokens pero los componentes todavía sin vestir, dejar
   * que mande `prefers-color-scheme` pintaría un fondo oscuro debajo de piezas
   * pensadas para fondo claro: un estado intermedio roto. La capa 3 gana al
   * sistema, y eso lo garantiza la jueza de la nº43. Se libera con el
   * conmutador, cuando los componentes estén migrados.
   */
  it('⭐ <html> fija el tema en claro durante la migración', () => {
    expect(HTML).toMatch(/<html[^>]*\sdata-theme="light"/);
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
