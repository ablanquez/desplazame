import { Component, ElementRef, inject, signal, afterNextRender } from '@angular/core';
import { contraste, deCss, AA_TEXTO, type Rgb } from './contraste';

/**
 * ⭐ LA PÁGINA DE IDENTIDAD VISUAL — donde los tokens se miran (9/09, punto 15).
 *
 * ── Por qué existe una página solo para esto ────────────────────────────────
 *
 * Es el patrón de «foundations» de los sistemas de diseño, y aquí tiene además
 * un precedente propio: `/panel`. Nace **sin un solo enlace desde la portada**
 * y sin tocar ni un componente existente, igual que él, y por la misma razón —
 * el ojo necesita un sitio donde comprobar, y ese sitio no puede ser el
 * producto, porque entonces habría que romper el producto para verlo.
 *
 * ⚠️ **La app se ve hoy igual que ayer.** Aplicar los tokens al producto es la
 *    tanda 2. Esta página es lo único que los usa.
 *
 * ── ⭐ DE DÓNDE SALEN LOS HEX QUE SE ENSEÑAN, que es la decisión importante ──
 *
 * **De ninguna lista escrita aquí. Del CSS vivo.** La página monta dos sondas
 * —una en cada tema—, le pone a cada una `background-color: var(--el-token)` y
 * **lee el color que el navegador acabó pintando**.
 *
 * Escribir los hex otra vez en este fichero habría sido tener la paleta en dos
 * sitios, y este proyecto ya sabe cómo acaba eso: `contraste.ts` cuenta en su
 * cabecera las cuatro copias de una fórmula de las que la cuarta no era igual,
 * y no se notaba porque daba PARECIDO. Una página de identidad con hex propios
 * enseñaría tan tranquila un color que el CSS ya no tiene.
 *
 * ⚠️ Y el ratio se calcula con `contraste.ts`, **la misma función que juzga la
 *    pantalla y la que usa el instrumento de píxeles**. Si esta página aprueba
 *    un par, el juez lo aprueba con la misma aritmética.
 *
 * ⚠️ **jsdom no resuelve `var()`.** Medido el 9/09: `getComputedStyle` sobre
 *    una custom property de `:root` devuelve la cadena vacía, y a través de
 *    `var()` también. Por eso esta página **no puede medirse en un test de
 *    jsdom** —allí saldría NO CONSTA en todas las filas— y su medición de
 *    verdad vive en Chrome, en `e2e/identidad.mjs`. Lo que jsdom sí juzga es
 *    que la página monte y traiga todas sus filas.
 */

/** Un token, tal y como se pide al CSS: sin el `--`. */
type Token = string;

/** Los dos temas, que aquí son valores y no un estado global. */
export type Tema = 'light' | 'dark';

export const TEMAS: readonly Tema[] = ['light', 'dark'];

/** Los dieciséis semánticos, en el orden en que se leen. */
export const SEMANTICOS: readonly Token[] = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'primary',
  'primary-foreground',
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'warning-border',
  'warning-dark',
  'border',
  'ring',
  'muted',
  'muted-foreground',
  // ⭐ LA BANDA DE LAS CABECERAS DEL ACORDEÓN (11/09) — los dos primeros tokens
  //    que NO vienen de la maqueta. Entran aquí por lo mismo que los demás: un
  //    color que vive en la hoja y no en esta lista no se sondea, no se mide y
  //    no lo cuenta nadie — y éste nació justamente de un color que nadie medía.
  'banda-cabecera',
  'banda-cabecera-hover',
];

/** Los seis modos, con el nombre que usa el CSS. */
export const MODOS: readonly string[] = ['andando', 'bus', 'bici', 'patin', 'moto', 'coche'];

/** Las cuatro variantes de cada modo. */
export const VARIANTES: readonly string[] = ['soft', 'strong', 'solid', 'text'];

/** Los 24 tokens de modo, generados — no enumerados a mano. */
export const TOKENS_DE_MODO: readonly Token[] = MODOS.flatMap((m) =>
  VARIANTES.map((v) => `mode-${m}-${v}`),
);

/** Los 40 tokens de color que la página sondea. */
export const TODOS: readonly Token[] = [...SEMANTICOS, ...TOKENS_DE_MODO];

/**
 * Un par de los que se leen: un texto sobre una superficie.
 *
 * ⚠️ **Los seis `strong` sobre `soft` no estaban en el encargo y están aquí a
 *    propósito.** Son la píldora de modo SIN seleccionar, o sea la otra mitad
 *    exacta del mismo botón cuyo estado seleccionado sí se pedía medir. Medir
 *    un estado de un control y no el otro es fabricar un verde que no dice la
 *    verdad, y cuatro de esos seis incumplen.
 */
export interface Par {
  readonly texto: Token;
  readonly fondo: Token;
  readonly rotulo: string;
}

export const PARES: readonly Par[] = [
  { texto: 'foreground', fondo: 'background', rotulo: 'Texto sobre el fondo' },
  { texto: 'card-foreground', fondo: 'card', rotulo: 'Texto sobre una tarjeta' },
  { texto: 'primary-foreground', fondo: 'primary', rotulo: 'Botón principal' },
  { texto: 'success-foreground', fondo: 'success', rotulo: 'Aviso de acierto' },
  { texto: 'warning-foreground', fondo: 'warning', rotulo: 'Aviso de atención' },
  { texto: 'muted-foreground', fondo: 'muted', rotulo: 'Texto secundario' },
  // ⚠️ Los DOS estados de la banda, no solo el de reposo. Medir uno y no el
  //    otro es el mismo agujero que tenían las píldoras de modo: el hover es la
  //    mitad del control, y es donde el gris se aclara más.
  { texto: 'foreground', fondo: 'banda-cabecera', rotulo: 'Cabecera del acordeón' },
  {
    texto: 'foreground',
    fondo: 'banda-cabecera-hover',
    rotulo: 'Cabecera del acordeón — con el ratón',
  },
  ...MODOS.map((m) => ({
    texto: `mode-${m}-text`,
    fondo: `mode-${m}-solid`,
    rotulo: `Modo ${m} — seleccionado`,
  })),
  ...MODOS.map((m) => ({
    texto: `mode-${m}-strong`,
    fondo: `mode-${m}-soft`,
    rotulo: `Modo ${m} — sin seleccionar`,
  })),
];

/** Lo leído de un token en un tema. `hex` vacío = no se pudo medir. */
export interface Lectura {
  readonly hex: string;
  readonly rgb: Rgb | null;
}

/** Un par ya medido, listo para pintarse. */
export interface ParMedido {
  readonly par: Par;
  readonly texto: Lectura;
  readonly fondo: Lectura;
  /** `null` cuando alguno de los dos no se pudo leer: NO CONSTA, no un cero. */
  readonly ratio: number | null;
  readonly cumple: boolean;
}

/** `Rgb` → `#rrggbb`, que es como se escriben los tokens en el CSS. */
export function aHex({ r, g, b }: Rgb): string {
  const dos = (v: number): string => v.toString(16).padStart(2, '0');
  return `#${dos(r)}${dos(g)}${dos(b)}`;
}

/**
 * El ratio de un par ya leído, o `null` si falta alguno de los dos colores.
 *
 * ⚠️ Devuelve `null` y no `0` cuando no se puede medir: un cero se pintaría
 *    como un contraste malísimo, y lo que pasa es que **no se sabe**. Es la
 *    misma regla que el gris del panel de frescura — NO CONSTA no es un fallo,
 *    es la verdad sobre esa fila.
 */
export function ratioDe(texto: Lectura, fondo: Lectura): number | null {
  if (!texto.rgb || !fondo.rgb) {
    return null;
  }
  return contraste(aHex(texto.rgb), aHex(fondo.rgb));
}

@Component({
  selector: 'app-identidad',
  templateUrl: './identidad.html',
  styleUrl: './identidad.css',
})
export class Identidad {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Los catálogos, para que la plantilla los recorra. */
  protected readonly semanticos = SEMANTICOS;
  protected readonly modos = MODOS;
  protected readonly variantes = VARIANTES;
  protected readonly todos = TODOS;
  protected readonly temas = TEMAS;
  protected readonly aaTexto = AA_TEXTO;

  /**
   * ⭐ EL CONMUTADOR, y es LOCAL a esta página.
   *
   * Pone `data-theme` en el contenedor de la página y en ningún sitio más: no
   * toca `<html>`, no guarda nada, y al salir de aquí no queda rastro. El
   * conmutador de verdad —el de la app entera, con su preferencia recordada—
   * es de otra tanda. Este existe para una sola cosa: que el ojo pueda ver los
   * dos temas sin cambiar la configuración del sistema operativo.
   *
   * ⚠️ Arranca en `light` **explícito** y no en «lo que diga el sistema» a
   *    propósito: así lo que se ve aquí no depende de cómo tenga cada cual el
   *    portátil, y una captura de esta página significa lo mismo en todas
   *    partes.
   */
  protected readonly tema = signal<Tema>('light');

  protected alternar(): void {
    this.tema.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  /** Lo medido: `tema → token → lectura`. Vacío hasta que el navegador pinta. */
  protected readonly medidas = signal<Record<Tema, Record<Token, Lectura>>>({
    light: {},
    dark: {},
  });

  /** ¿Se pudo medir algo? En jsdom no, y entonces la página lo dice. */
  protected readonly hayMedidas = signal(false);

  constructor() {
    // Las sondas tienen que estar pintadas para poder leerlas: `getComputedStyle`
    // sobre un elemento que aún no está en el documento no devuelve colores.
    afterNextRender(() => this.medir());
  }

  /**
   * Lee de las sondas el color que el navegador acabó aplicando a cada token.
   *
   * ⚠️ Se lee `backgroundColor` **del elemento**, no la custom property. Es la
   *    diferencia entre preguntar «¿qué pone en la variable?» y «¿de qué color
   *    ha quedado esto?». Lo segundo es lo que ve quien mira la pantalla, y es
   *    lo que ya resuelve los `var()` encadenados del tema oscuro.
   */
  private medir(): void {
    const raiz = this.host.nativeElement as HTMLElement;
    const leidas: Record<Tema, Record<Token, Lectura>> = { light: {}, dark: {} };
    let algo = false;

    for (const tema of TEMAS) {
      for (const token of TODOS) {
        const el = raiz.querySelector<HTMLElement>(
          `[data-sonda='${tema}'] [data-token='${token}']`,
        );
        const css = el ? getComputedStyle(el).backgroundColor : '';
        const rgb = css ? deCss(css) : null;
        if (rgb) {
          algo = true;
        }
        leidas[tema][token] = { hex: rgb ? aHex(rgb) : '', rgb };
      }
    }

    this.medidas.set(leidas);
    this.hayMedidas.set(algo);
  }

  /** Lo leído de un token, o una lectura vacía si aún no se ha medido. */
  protected lectura(tema: Tema, token: Token): Lectura {
    return this.medidas()[tema][token] ?? { hex: '', rgb: null };
  }

  /** Los pares de un tema, ya medidos y con su ratio. */
  protected paresDe(tema: Tema): readonly ParMedido[] {
    return PARES.map((par) => {
      const texto = this.lectura(tema, par.texto);
      const fondo = this.lectura(tema, par.fondo);
      const ratio = ratioDe(texto, fondo);
      return { par, texto, fondo, ratio, cumple: ratio !== null && ratio >= AA_TEXTO };
    });
  }

  /** Cuántos pares de un tema no llegan al umbral. Se enseña arriba del todo. */
  protected cuantosIncumplen(tema: Tema): number {
    return this.paresDe(tema).filter((p) => p.ratio !== null && !p.cumple).length;
  }

  /** El ratio con dos decimales, o `NO CONSTA` si no se pudo medir. */
  protected ratioEscrito(p: ParMedido): string {
    return p.ratio === null ? 'NO CONSTA' : `${p.ratio.toFixed(2)}:1`;
  }

  /** `var(--token)`, para que la plantilla no lo construya a mano cada vez. */
  protected v(token: Token): string {
    return `var(--${token})`;
  }
}
