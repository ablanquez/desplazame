// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, existsSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Buscador } from './buscador';
import { SIMBOLOS } from './simbolos';

/**
 * ⭐ LA PINTURA DEL BUSCADOR (10/09, punto 15 · tanda 4).
 *
 * Lo que se puede juzgar sin navegador: **que los emojis se fueron**, que cada
 * chip lleva su dibujo Y su palabra, que ningún color se ha estrenado a mano, y
 * —la que más vale— que **ninguna regla de `hover` vive fuera de su consulta**.
 *
 * ⚠️ Lo que NO cabe aquí es el píxel: si el chip activo se pinta de su `-solid`
 *    y si el pin aparece solo en táctil son medidas de Chrome, y viven en
 *    `app/e2e/pintura.mjs`. jsdom no resuelve `var()` —medido el 9/09— ni tiene
 *    consultas de medios que apliquen.
 */
declare const process: { cwd(): string };

const RAIZ = ((): string => {
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/app/src/styles.css')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro app/src/styles.css subiendo desde ' + process.cwd());
})();

const PLANTILLA: string = readFileSync(RAIZ + 'app/src/app/buscador.html', 'utf8');
const HOJA_GLOBAL: string = readFileSync(RAIZ + 'app/src/styles.css', 'utf8');
const HOJA_BUSCADOR: string = readFileSync(RAIZ + 'app/src/app/buscador.css', 'utf8');

/** El CSS sin comentarios: lo que un comentario diga no es una regla. */
function sinComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * ⭐ LAS REGLAS `:hover` QUE **NO** ESTÁN DENTRO DE `@media (hover: hover)`.
 *
 * Se recorre el fichero contando llaves y llevando la pila de `@media` abierta,
 * que es la única forma de saber en qué contexto cae cada selector. Buscar
 * «¿aparece `hover: hover` en el fichero?» no valdría: la pregunta no es si la
 * consulta existe, es si **esta** regla está dentro de ella.
 */
function hoveresSueltos(css: string): string[] {
  const limpio = sinComentarios(css);
  const sueltos: string[] = [];
  const pila: boolean[] = []; // por cada bloque abierto: ¿es un @media de hover?
  let dentroDeHover = 0;
  let i = 0;
  let desde = 0;

  while (i < limpio.length) {
    const c = limpio[i];
    if (c === '{') {
      const cabecera = limpio.slice(desde, i).trim();
      const esMediaDeHover = /@media[^{]*\(\s*hover\s*:\s*hover\s*\)/.test(cabecera);
      const esBloqueDeReglas = !cabecera.startsWith('@');
      if (esMediaDeHover) dentroDeHover++;
      pila.push(esMediaDeHover);
      if (esBloqueDeReglas && /:hover\b/.test(cabecera) && dentroDeHover === 0) {
        sueltos.push(cabecera.replace(/\s+/g, ' '));
      }
      desde = i + 1;
    } else if (c === '}') {
      if (pila.pop() === true) dentroDeHover--;
      desde = i + 1;
    }
    i++;
  }
  return sueltos;
}

describe('⭐ LA PINTURA — los emojis fuera y el hover en su sitio', () => {
  /**
   * ⭐ LOS EMOJIS SE VAN, Y SE COMPRUEBA POR RANGO, no por lista.
   *
   * ⚠️ Buscar «📍» y «⇅» uno a uno dejaría entrar el siguiente que a alguien le
   *    apeteciera poner. Se barren los bloques de pictogramas y flechas enteros,
   *    que es la pregunta de verdad: **¿hay algún dibujo hecho de texto?**
   */
  it('⭐ no queda ni un emoji en el FORMULARIO del buscador', () => {
    const PICTOGRAMAS = /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{FE0F}]/gu;
    // ⚠️ Los ⭐ y ⚠️ de los comentarios NO cuentan: son prosa para quien lee el
    //    código, no dibujos de la pantalla. Se mira solo fuera de comentarios.
    const sinComentar = PLANTILLA.replace(/<!--[\s\S]*?-->/g, '');
    // ⚠️ Y SOLO EL FORMULARIO, que es lo que esta tanda viste. En el resultado
    //    quedan dos —el ⏳ de «Próximo bus» y el ⚠ de la nota de un paso— y su
    //    tanda es la 5. Barrer la plantilla entera pondría roja una jueza por
    //    trabajo que nadie ha encargado todavía; dejarlos sin decirlo sería
    //    peor. Quedan dichos aquí y en el checkpoint.
    const desde = sinComentar.indexOf('<form class="buscador"');
    const hasta = sinComentar.indexOf('</form>');
    expect(desde).toBeGreaterThan(-1);
    expect(hasta).toBeGreaterThan(desde);
    const enElFormulario = sinComentar.slice(desde, hasta).match(PICTOGRAMAS);
    expect(enElFormulario ?? []).toEqual([]);
    // Y que la barrida sirva de algo: fuera del formulario todavía quedan.
    expect((sinComentar.match(PICTOGRAMAS) ?? []).length).toBeGreaterThan(0);
  });

  /**
   * ⭐ EL HOVER, SOLO BAJO SU CONSULTA — y esta es la jueza de la doctrina.
   *
   * [DOC MDN · Media Queries 4] `hover: hover` es «el mecanismo primario de
   * entrada puede pasar por encima de elementos». En un táctil no lo hay: el
   * navegador **emula** el hover con la pulsación, y el estado se queda PEGADO
   * al soltar — la píldora que acabas de tocar se queda con el fondo de «estoy
   * encima» hasta que toques otra cosa.
   *
   * Se barren las DOS hojas, porque el lenguaje vive repartido entre las dos.
   */
  it('⭐ ninguna regla `:hover` vive fuera de `@media (hover: hover)`', () => {
    expect(hoveresSueltos(HOJA_GLOBAL)).toEqual([]);
    expect(hoveresSueltos(HOJA_BUSCADOR)).toEqual([]);
  });

  /**
   * ⚠️ Y LA CONTRAPRUEBA DEL INSTRUMENTO, dentro. Si el barredor no supiera
   *    encontrar un `:hover` suelto, la jueza de arriba daría verde sobre
   *    cualquier cosa. Se le da un CSS con uno dentro y otro fuera.
   */
  it('⭐ y el barredor sabe distinguir el de dentro del de fuera', () => {
    const fingido = `
      .a:hover { color: red; }
      @media (hover: hover) { .b:hover { color: blue; } }
      @media (min-width: 768px) { .c:hover { color: green; } }
    `;
    const sueltos = hoveresSueltos(fingido);
    expect(sueltos.some((s) => s.includes('.a:hover'))).toBe(true);
    expect(sueltos.some((s) => s.includes('.b:hover'))).toBe(false);
    // El de dentro de OTRO media sí es suelto: `min-width` no protege de nada.
    expect(sueltos.some((s) => s.includes('.c:hover'))).toBe(true);
  });

  /**
   * ⭐ EL PIN, SOLO EN TÁCTIL DE VERDAD — la mitad que sí cabe en jsdom: que la
   * regla esté escrita con el par de MQ4 y **sin ninguna `min-width`**.
   *
   * ⚠️ Medir por ancho es la trampa: un PC con la ventana estrecha no tiene
   *    menos ratón. El par `(hover: none) and (pointer: coarse)` es lo que
   *    distingue el aparato, no el hueco.
   */
  it('⭐ el pin se revela con `(hover: none) and (pointer: coarse)`, no por ancho', () => {
    const css = sinComentarios(HOJA_BUSCADOR);
    const bloque = /@media\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)\s*\{([^}]*\{[^}]*\}[^}]*)\}/.exec(css);
    expect(bloque).not.toBeNull();
    expect(bloque![1]).toContain('.ubicacion');
    expect(bloque![1]).toContain('display: inline-flex');
    // Y apagado por defecto, que es lo que hace que la consulta sea la puerta.
    expect(/\.ubicacion\s*\{[^}]*display:\s*none/.test(css)).toBe(true);
  });

  /**
   * ⭐ NINGÚN COLOR ESTRENADO A MANO en lo repintado.
   *
   * La pintura **no decide colores**: los consume. Si un estado necesitara un
   * tono que los tokens no tienen, el sitio de esa decisión es `/identidad` con
   * el juez de contraste delante, no un hex escrito aquí.
   *
   * ⚠️ Se exceptúan las sombras, que son `rgb(0 0 0 / …)` puro y no son tinta
   *    de nada: no hay token de sombra y no se inventa uno para esta tanda.
   */
  it('⭐ los selectores repintados no traen ni un hex suelto', () => {
    const css = sinComentarios(HOJA_BUSCADOR);
    const conHex: string[] = [];
    for (const nombre of ['.modo', '.generar', '.limpiar', '.ubicacion', '.invertir', '.tipo', 'legend']) {
      const re = new RegExp('(^|\\})\\s*([^{}]*\\' + nombre + '[^{}]*)\\{([^}]*)\\}', 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(css)) !== null) {
        if (/#[0-9a-fA-F]{3,8}\b/.test(m[3]!)) conHex.push(m[2]!.trim() + ' → ' + m[3]!.trim());
      }
    }
    expect(conHex).toEqual([]);
  });
});

describe('⭐ LOS CHIPS — dibujo Y palabra, y su familia de tokens', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function raiz(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  /**
   * ⭐ LAS SEIS, CON SU DIBUJO Y CON SU NOMBRE — y el nombre no es lo pintado.
   *
   * ⚠️ **Esta juez decía otra cosa hasta el remate.** Compraba «etiqueta de
   *    texto VISIBLE en las seis», que era la desviación que Antonio rechazó.
   *    Ahora compra lo que la norma pide de verdad: [WCAG 4.1.2] un **nombre
   *    accesible** en cada control, esté o no pintada la palabra. Que solo el
   *    activo la enseñe es pintura, y la pintura se mide en Chrome —jsdom no
   *    aplica la hoja global, así que aquí `max-width: 0` no existiría—.
   */
  it('⭐ cada chip lleva su símbolo, su nombre accesible y su palabra en el DOM', async () => {
    const chips = (await raiz()).querySelectorAll('.familias .modo--chip');
    expect(chips.length).toBe(6);
    for (const chip of chips) {
      const dibujo = chip.querySelector('app-simbolo svg path')?.getAttribute('d') ?? '';
      expect(Object.values(SIMBOLOS)).toContain(dibujo);

      // El nombre, en el control: no depende de ninguna regla de pintura.
      const control = chip.querySelector('.modo__radio');
      const nombre = control?.getAttribute('aria-label') ?? '';
      expect(nombre.length).toBeGreaterThan(0);

      // Y la palabra sigue en el DOM aunque se pliegue: se encoge, no se borra.
      const texto = chip.querySelector('.modo__texto')?.textContent?.trim() ?? '';
      expect(texto).toBe(nombre);
    }
  });

  /**
   * ⭐ Y EL DIBUJO NO HABLA. Si el `svg` se anunciara además por su cuenta, un
   * lector de pantalla diría el modo dos veces — una por el `aria-label` del
   * radio y otra por el icono.
   */
  it('⭐ el símbolo de cada chip va `aria-hidden`', async () => {
    for (const chip of (await raiz()).querySelectorAll('.familias .modo--chip')) {
      expect(chip.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  /**
   * ⭐ EL PLEGADO SE ESCRIBE CON `max-width`, NO CON `display: none`.
   *
   * ⚠️ La diferencia no es de estilo: un `display: none` saca la palabra del
   *    árbol de accesibilidad. Aquí no importaría —el `aria-label` la
   *    sostiene—, pero sí importa que el plegado sea **animable**, que es lo
   *    que la maqueta hace. Se compra sobre la hoja global, que es donde vive.
   */
  it('⭐ la etiqueta se pliega encogiendo, y solo se abre en activo o en hover', () => {
    const css = sinComentarios(HOJA_GLOBAL);
    expect(/\.modo--chip \.modo__texto \{[^}]*max-width:\s*0/.test(css)).toBe(true);
    expect(/\.modo--chip\.modo--activo \.modo__texto \{[^}]*max-width:\s*150px/.test(css)).toBe(true);
    // Y la revelación por hover, dentro de su consulta — lo compra además la
    // juez de doctrina de arriba, que barre las dos hojas enteras.
    const conHover = /@media \(hover: hover\) \{[\s\S]*?\.modo--chip:hover \.modo__texto \{[^}]*max-width:\s*150px/;
    expect(conHover.test(css)).toBe(true);
    // Nada de `display: none` para plegar.
    expect(/\.modo--chip \.modo__texto \{[^}]*display:\s*none/.test(css)).toBe(false);
  });

  /**
   * ⭐ Y EL `data-modo` DE CADA CHIP ES EL NOMBRE DE UNA FAMILIA DE TOKENS.
   *
   * Es lo que hace que el CSS no necesite tabla de traducción: `bici` →
   * `--mode-bici-*`. Si alguien pusiera ahí una palabra que no es un modo, el
   * chip se quedaría **sin color** y jsdom no lo vería —no resuelve `var()`—,
   * así que se compra contra los tokens escritos en la hoja global.
   */
  it('⭐ el `data-modo` de cada chip tiene sus cuatro tokens en la hoja global', async () => {
    const chips = (await raiz()).querySelectorAll('.familias .modo--chip');
    const faltan: string[] = [];
    for (const chip of chips) {
      const modo = chip.getAttribute('data-modo') ?? '';
      for (const variante of ['soft', 'strong', 'solid', 'text']) {
        if (!HOJA_GLOBAL.includes(`--mode-${modo}-${variante}:`)) faltan.push(`--mode-${modo}-${variante}`);
      }
    }
    expect(faltan).toEqual([]);
  });

  /** Los seis grupos de subformulario hablan la misma lengua que los chips. */
  it('⭐ las píldoras de los subformularios usan el primitivo compartido', async () => {
    const sinPildora = [...(await raiz()).querySelectorAll('.modos .modo')].filter(
      (l) => !l.classList.contains('pildora'),
    );
    expect(sinPildora.length).toBe(0);
  });
});

describe('⭐ «LIMPIAR BÚSQUEDA» — calcada de handleReset', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('⭐ el botón existe, es secundario y va ANTES de «Generar ruta»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const botones = [...raiz.querySelectorAll('.acciones button')];
    expect(botones.length).toBe(2);
    expect(botones[0]!.classList.contains('limpiar')).toBe(true);
    expect(botones[0]!.classList.contains('boton--secundario')).toBe(true);
    expect(botones[0]!.textContent?.trim()).toBe('Limpiar búsqueda');
    expect(botones[1]!.classList.contains('generar')).toBe(true);
    expect(botones[1]!.classList.contains('boton--principal')).toBe(true);
  });

  /**
   * ⭐ Y VACÍA DE VERDAD: el CÓDIGO, no solo el texto.
   *
   * ⚠️ Ésta es la compra que importa. Borrar lo que se ve y dejar la vía y el
   *    portal puestos sería el fallo de la nº4 con otro disfraz: el formulario
   *    diría «vacío» y `sePuedeGenerar()` seguiría diciendo que sí. Se mide por
   *    el botón de generar, que es quien mira los códigos.
   */
  it('⭐ vacía los dos lados y «Generar ruta» vuelve a estar apagado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const componente = fixture.componentInstance as unknown as {
      origen: { calle: { set(v: string): void }; via: { set(v: unknown): void } };
      destino: { calle: { set(v: string): void }; via: { set(v: unknown): void } };
      modo: { set(v: string): void; (): string };
      limpiar(): void;
    };

    componente.origen.calle.set('COLOSO');
    componente.destino.calle.set('CALLE OVIEDO');
    componente.modo.set('coche');
    fixture.detectChanges();
    await fixture.whenStable();

    raiz.querySelector<HTMLButtonElement>('.limpiar')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const cajas = raiz.querySelectorAll<HTMLInputElement>('app-autocompletar-via input');
    expect([...cajas].map((c) => c.value)).toEqual(['', '']);
    expect(componente.modo()).toBe('andando');
    expect(raiz.querySelector<HTMLButtonElement>('.generar')!.disabled).toBe(true);
  });
});
