/**
 * ⭐ EL SISTEMA DE ICONOS — LA JUEZA DEL CENSO (17/09, la identidad).
 *
 * El §39 del DISEÑO todavía no está escrito: se entrega como borrador y lo
 * escribe el estratega. Lo que sí entra hoy es **el portero**, porque un
 * sistema sin quien lo cuente se deshace solo — y el censo del 17/09 encontró
 * la app con **tres catálogos de dibujos** conviviendo sin nadie que los mirara
 * juntos.
 *
 * ── LOS TRES CATÁLOGOS, y por qué son tres y no uno ─────────────────────────
 *
 * · **A · Material Symbols**, `app/simbolos/` — el set único que firma el §5.
 *   Treinta símbolos más dos instancias ópticas de 48. Su portero es
 *   `simbolos.spec.ts`: fichero ↔ tabla, carácter a carácter.
 * · **B · Las ocho formas de capa**, dibujadas a mano en `iconos.ts`. **No son
 *   Material Symbols y eso es una excepción declarada**, no un descuido: seis
 *   calcan una convención ajena (la chincheta de los mapas, la cruz verde de
 *   farmacia, la señal S-23 del hospital, el libro de osm-carto, el lápiz y el
 *   birrete de Maki) y dos están firmadas como PROPIAS porque la doctrina no
 *   daba ninguna (el chupete de la guardería y la cruz azul del centro de
 *   salud). El porqué entero, en la cabecera de `iconos.ts`.
 * · **C · Lo que pinta Leaflet solo** — la banderita de su atribución. No es
 *   nuestra, no la elegimos y no la censamos: se declara y se deja en paz.
 *
 * ── LO QUE ESTA JUEZA COMPRA ────────────────────────────────────────────────
 *
 * Que no nazca un **cuarto**. Ningún `<svg>` escrito a mano fuera de los tres
 * sitios que pueden escribirlo, ninguno sin `aria-hidden`, ningún símbolo
 * huérfano en el catálogo, y la deuda de tamaños **fijada con su cifra** para
 * que no crezca en silencio.
 */
import { describe, expect, it } from 'vitest';
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { SIMBOLOS, SIMBOLOS_48, SUFIJO, ficheroDe, type NombreDeSimbolo } from './simbolos';
import { SIMBOLO_DEL_GIRO } from './buscador';
import { SIMBOLO_DEL_HITO } from './mapa';

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

/** Todo el código de la interfaz, sin las pruebas: contando el directorio. */
const FUENTES: ReadonlyArray<{ ruta: string; texto: string }> = ((): { ruta: string; texto: string }[] => {
  const salida: { ruta: string; texto: string }[] = [];
  const bajar = (dir: string): void => {
    for (const e of readdirSync(RAIZ + dir, { withFileTypes: true }) as Array<{
      name: string;
      isDirectory(): boolean;
    }>) {
      const rel = dir + '/' + e.name;
      if (e.isDirectory()) bajar(rel);
      else if (/\.(ts|html)$/.test(e.name) && !e.name.endsWith('.spec.ts')) {
        salida.push({ ruta: rel, texto: leer(rel) });
      }
    }
  };
  bajar('app/src');
  return salida;
})();

const sinComentarios = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(\/\/|\s\*).*$/gm, '');

describe('⭐ (I) EL CATÁLOGO — se cuenta el directorio, no una lista', () => {
  it('⭐ los ficheros de `app/simbolos/` son los del catálogo, y nada más', () => {
    // ⭐ **ACTA (18/09).** Aquí se contaban «los de 24» y «los de 48» porque el
    //    catálogo guardaba una instancia de referencia para todos. Desde el
    //    barrido a `opsz20`, **cada símbolo guarda la instancia que se pinta** y
    //    el fichero lleva el sufijo que lo dice, así que la cuenta es: un
    //    fichero por símbolo, más uno por cada segunda instancia.
    const svg = (readdirSync(RAIZ + 'app/simbolos') as string[]).filter((f) => f.endsWith('.svg'));
    expect(svg.length, 'ficheros .svg en la carpeta').toBe(
      Object.keys(SIMBOLOS).length + Object.keys(SIMBOLOS_48).length,
    );
    // Y nada suelto: solo `.svg`, la licencia y la procedencia.
    const otros = (readdirSync(RAIZ + 'app/simbolos') as string[]).filter(
      (f) => !f.endsWith('.svg') && f !== 'LICENCIA-APACHE-2.0.txt' && f !== 'PROCEDENCIA.md',
    );
    expect(otros, 'hay ficheros sin declarar en app/simbolos').toEqual([]);
  });

  /**
   * ⭐ CADA SÍMBOLO TIENE SU SHA EN LA PROCEDENCIA, y esto no es burocracia:
   * es Apache 2.0 y la ficha del NOTICES apunta aquí. Un símbolo bajado sin
   * anotar es un fichero de terceros sin trazabilidad.
   */
  it('⭐ los treinta y uno llevan su sha256 anotado en PROCEDENCIA.md', () => {
    const doc = leer('app/simbolos/PROCEDENCIA.md');
    const svg = (readdirSync(RAIZ + 'app/simbolos') as string[]).filter((f) => f.endsWith('.svg'));
    const sinFicha = svg.filter((f) => !doc.includes('`' + f + '`'));
    expect(sinFicha, 'símbolos sin ficha en PROCEDENCIA.md').toEqual([]);
  });

  /**
   * ⭐ EL SUFIJO DICE LA VERDAD, Y SE COMPRUEBA CONTRA EL DISCO.
   *
   * [DOC OFICIAL] el nombre **sin sufijo** identifica en el repositorio la
   * instancia por defecto: `wght400 · GRAD0 · FILL0 · opsz24`. Así que un
   * fichero sin sufijo es de 24 y uno con `_20px` es de 20 — y `SUFIJO` tiene
   * que decir exactamente eso de cada símbolo, o el catálogo miente sobre lo
   * que guarda.
   */
  it('⭐ el sufijo de cada símbolo casa con el fichero que hay en disco', () => {
    const svg = new Set((readdirSync(RAIZ + 'app/simbolos') as string[]).filter((f) => f.endsWith('.svg')));
    const mentiras = (Object.keys(SIMBOLOS) as NombreDeSimbolo[]).filter(
      (n) => !svg.has(ficheroDe(n) + '.svg'),
    );
    expect(mentiras, 'símbolos cuyo fichero no está donde `ficheroDe` dice').toEqual([]);
    // Y solo hay dos sufijos posibles: los otros dos puntos del eje (40) no se
    // pintan en ningún sitio, y bajarlos sería peso muerto con licencia.
    expect([...new Set(Object.values(SUFIJO))].sort()).toEqual(['_20px', '_48px']);
  });

  /**
   * ⭐ NINGÚN SÍMBOLO HUÉRFANO. Un `.svg` que nadie pinta es peso muerto con
   * licencia: se baja lo que se usa.
   */
  it('⭐ todos los símbolos del catálogo se pintan en alguna parte', () => {
    const codigo = FUENTES.filter((f) => !f.ruta.endsWith('simbolos.ts'))
      .map((f) => f.texto)
      .join('\n');
    const huerfanos = (Object.keys(SIMBOLOS) as NombreDeSimbolo[]).filter(
      (n) => !new RegExp(`['"]${n}['"]`).test(codigo),
    );
    expect(huerfanos, 'símbolos que nadie pinta').toEqual([]);
  });
});

describe('⭐ (II) NINGÚN ICONO FUERA DEL SISTEMA', () => {
  /**
   * ⭐ LOS TRES SITIOS QUE PUEDEN ESCRIBIR UN `<svg>`, y ni uno más.
   *
   * ⚠️ Los dos de fuera de `simbolos.ts` existen por la misma razón: **Leaflet
   *    quiere HTML en crudo**, así que dentro de un `divIcon` no cabe un
   *    componente de Angular. Los dos importan el trazado en vez de copiarlo.
   *    Si aparece un cuarto, esta jueza lo caza — y entonces hay que decidir si
   *    entra al sistema o si se reescribe con `app-simbolo`.
   */
  /**
   * ⭐ **ACTA DEL CUARTO (18/09).** Aquí eran TRES, y el 18/09 la jueza **se
   *    puso roja con razón**: entró `marca.ts`. No es un icono que se haya
   *    colado — es el **logotipo**, que por doctrina no sale de la familia de
   *    iconos de sistema y por eso vive en `app/marca/` con su propia ficha.
   *    Entra a la lista DECLARADO, que es justo lo que esta jueza compra: que
   *    un `<svg>` nuevo obligue a decidir en vez de aparecer callado.
   */
  const PUEDEN_DIBUJAR = [
    'app/src/app/simbolos.ts',
    'app/src/app/iconos.ts',
    'app/src/app/mapa.ts',
    'app/src/app/marca.ts',
  ];

  it('⭐ solo CUATRO ficheros escriben un `<svg>` a mano', () => {
    const conSvg = FUENTES.filter((f) => /<svg/i.test(sinComentarios(f.texto))).map((f) => f.ruta);
    expect(conSvg.sort()).toEqual([...PUEDEN_DIBUJAR].sort());
  });

  /**
   * ⭐ Y LOS TRES OCULTAN LO QUE PINTAN [triaje del W3C].
   *
   * El árbol de decisión del WAI: un icono que viaja al lado de un texto que ya
   * dice lo mismo es DECORATIVO, y lo decorativo se esconde — si no, el lector
   * de pantalla lo dice dos veces. En esta casa **todos** lo son, porque el §5
   * manda que cada icono lleve su etiqueta de texto al lado. Medido sobre lo
   * pintado el 17/09: de 26 `<svg>` en pantalla con una ruta de bus delante, 25
   * ocultos y 1 suelto — y el suelto es el lienzo de Leaflet, que no es nuestro.
   */
  it('⭐ los tres marcan `aria-hidden` en lo que dibujan', () => {
    for (const ruta of PUEDEN_DIBUJAR) {
      const t = sinComentarios(leer(ruta));
      expect(t, `${ruta} dibuja sin ocultar`).toMatch(/aria-hidden/);
    }
  });

  /**
   * ⭐ Y NADIE COPIA UN TRAZADO A MANO. Los dos que dibujan fuera de
   * `simbolos.ts` **importan** `SIMBOLOS`; el día que alguien pegue una `d` de
   * Material en otro sitio, esto lo caza.
   */
  it('⭐ el trazado de Material se importa, no se pega', () => {
    const culpables: string[] = [];
    for (const f of FUENTES) {
      if (f.ruta.endsWith('simbolos.ts')) continue;
      for (const n of Object.keys(SIMBOLOS) as NombreDeSimbolo[]) {
        if (f.texto.includes(SIMBOLOS[n])) culpables.push(`${f.ruta} · ${n}`);
      }
    }
    expect(culpables, 'trazados de Material copiados a pelo').toEqual([]);
  });
});

describe('⭐ (III) EL MAPA ACCIÓN → ICONO, completo y dentro del catálogo', () => {
  it('⭐ los quince giros del contrato tienen icono, y es del catálogo', () => {
    const valores = Object.values(SIMBOLO_DEL_GIRO);
    expect(Object.keys(SIMBOLO_DEL_GIRO).length).toBe(15);
    expect(valores.filter((v) => !(v in SIMBOLOS))).toEqual([]);
  });

  it('⭐ los cuatro hitos del plano también, y repiten los de la lista', () => {
    expect(Object.keys(SIMBOLO_DEL_HITO).length).toBe(4);
    for (const [hito, simbolo] of Object.entries(SIMBOLO_DEL_HITO)) {
      expect(simbolo in SIMBOLOS, `${hito} fuera del catálogo`).toBe(true);
      // ⚠️ La misma marca en la lista y en el plano: quien lee «Sube a la 39»
      //    busca ESE dibujo sobre el mapa.
      expect(SIMBOLO_DEL_GIRO[hito as keyof typeof SIMBOLO_DEL_GIRO]).toBe(simbolo);
    }
  });
});

describe('⭐ (IV) LOS TAMAÑOS — la deuda del eje óptico, fijada con su cifra', () => {
  /**
   * ⭐ LA REGLA OFICIAL, Y LA CUENTA DE LO QUE NO LA CUMPLE.
   *
   * [DOC OFICIAL, Material Symbols] los iconos de sistema van a **24 dp** (20
   * en escritorio denso), y **solo las instancias de 20 y 24 están alineadas a
   * la retícula**: para cualquier otro tamaño se usa el eje óptico, no el
   * escalado a pelo. Del eje existen cuatro instancias —20, 24, 40 y 48—,
   * verificado contra el repositorio el 17/09.
   *
   * ⚠️ HOY LA APP PINTA A 14, 16, 18, 20, 24 Y 48. Los de 48 ya se arreglaron
   *    —tienen su instancia propia—; los de 14, 16 y 18 **no tienen instancia
   *    exacta**, porque el eje no baja de 20. Su arreglo es bajarse la familia
   *    entera a `opsz20`, y eso son veintiséis ficheros más con su precio en el
   *    paquete: es una decisión del §39, no un apaño de esta jueza.
   *
   * ⚠️ **Y POR ESO LA CIFRA VA CLAVADA AQUÍ**, no como un `toBeLessThan`
   *    cómodo: la deuda que se conoce no crece sola. Quien añada un icono a 16
   *    px tendrá que venir a subir este número, y al subirlo leerá por qué.
   */
  const LADOS = ((): number[] => {
    const salida: number[] = [];
    for (const f of FUENTES) {
      const t = sinComentarios(f.texto);
      for (const m of t.matchAll(/<app-simbolo\b[^>]*?\/>/gs)) {
        const lado = /\[?lado\]?="(\d+)"/.exec(m[0]);
        salida.push(lado ? Number(lado[1]) : 20);
      }
    }
    return salida;
  })();

  it('⭐ el censo de tamaños es el que dice el acta', () => {
    const cuenta: Record<number, number> = {};
    for (const l of LADOS) cuenta[l] = (cuenta[l] ?? 0) + 1;
    expect(cuenta).toEqual({ 14: 2, 16: 7, 18: 1, 20: 4, 24: 2, 48: 2 });
    expect(LADOS.length).toBe(18);
  });

  it('⭐ y exactamente DIEZ usos caen fuera de la retícula, ni uno más', () => {
    const fuera = LADOS.filter((l) => l !== 20 && l !== 24 && !(l >= 48));
    expect(fuera.length, `fuera de 20/24: ${fuera.join(', ')}`).toBe(10);
  });

  /**
   * ⚠️ El icono de hito del plano se compone a mano en `mapa.ts` y también
   *    tiene su lado. Va contado aparte porque no pasa por `app-simbolo`.
   */
  it('⭐ el hito del plano dibuja a 14, y está declarado', () => {
    expect(sinComentarios(leer('app/src/app/mapa.ts'))).toContain('LADO_DEL_DIBUJO = 14');
  });

  /**
   * ⭐ NINGÚN PESO NUEVO. Los treinta y dos ficheros son la instancia por
   * defecto —`wght400 · GRAD0 · FILL0`—, que es la que el nombre sin sufijos
   * identifica en el repositorio oficial. Un fichero con sufijo de peso o de
   * relleno rompería el «un peso consistente por tema de UI» de la doctrina.
   */
  it('⭐ el catálogo es de UN solo peso: sin sufijos de wght, grad ni fill', () => {
    const svg = (readdirSync(RAIZ + 'app/simbolos') as string[]).filter((f) => f.endsWith('.svg'));
    const conEje = svg.filter((f) => /_(wght|grad|fill)/i.test(f));
    expect(conEje, 'ficheros de otro peso, grado o relleno').toEqual([]);
  });
});

describe('⭐ (V) LA MARCA — el logo, su favicon y su sitio', () => {
  const MARCA = 'app/marca/';

  /**
   * ⭐ EL FAVICON LLEVA SU MEDIA QUERY DENTRO [§36 · DOC MDN].
   *
   * Un favicon se pinta en la pestaña, **fuera del documento**: no hereda el
   * `data-theme` de la página y no hay forma de que lo haga. Lo único que puede
   * leer es `prefers-color-scheme`, desde un `<style>` embebido en el propio
   * SVG — y si ese `<style>` no está, el favicon se queda en un solo color y
   * nadie se entera hasta que alguien mira la pestaña en oscuro.
   */
  it('⭐ el favicon es SVG y trae la media query del tema EN SU INTERIOR', () => {
    const svg = leer(MARCA + 'favicon.svg');
    expect(svg).toContain('<style>');
    expect(svg).toContain('@media (prefers-color-scheme: dark)');
    // Los dos azules de la marca, y NINGÚN blanco puro en el oscuro [§36].
    expect(svg).toContain('#2563eb');
    expect(svg).toContain('#93c5fd');
    const enOscuro = svg.slice(svg.indexOf('@media (prefers-color-scheme: dark)'));
    expect(enOscuro.toLowerCase(), 'blanco puro en el oscuro [§36]').not.toMatch(/#fff|#ffffff/);
  });

  /**
   * ⭐ Y ESTÁ CABLEADO, que es lo que de verdad lo pone en la pestaña.
   *
   * ⚠️ El SVG va **después** del `.ico`: el navegador se queda con la última
   *    declaración que entiende, así que ese orden deja el `.ico` de respaldo y
   *    el vectorial mandando. Al revés, el `.ico` ganaría siempre.
   */
  it('⭐ el índice lo declara, y DESPUÉS del `.ico` de respaldo', () => {
    const html = leer('app/src/index.html');
    const ico = html.indexOf('type="image/x-icon"');
    const vec = html.indexOf('type="image/svg+xml"');
    expect(ico, 'no está el .ico de respaldo').toBeGreaterThan(0);
    expect(vec, 'no está el favicon SVG').toBeGreaterThan(0);
    expect(vec).toBeGreaterThan(ico);
    // Y el build lo copia: sin esta entrada, `/favicon.svg` daría 404.
    expect(leer('app/angular.json')).toContain('"input": "marca"');
  });

  /**
   * ⭐ EL MISMO DIBUJO EN LOS CUATRO SITIOS, y esta es la jueza que hace falta:
   * el símbolo vive en el componente **y** en cuatro ficheros, así que son
   * cinco copias del mismo trazado. Es el riesgo que `contraste.ts` cuenta que
   * ya salió mal una vez — aquí tiene portero.
   *
   * ⚠️ **Y desde el 21/09 son SEIS**: el puntero del paso en el mapa es el pin
   *    de esta marca, por orden de Antonio. Por eso el trazado dejó de estar
   *    suelto en el `d=` de la plantilla y pasó a `GOTA_DE_LA_MARCA`, que el
   *    mapa importa. Lo único que cambia aquí es **de dónde se lee el
   *    original**: la comilla en vez del `d="`. Lo que compra la jueza —que
   *    los cuatro ficheros dibujen ESA gota y no otra— no se ha movido.
   */
  it('⭐ el símbolo de la cabecera y el de los ficheros son EL MISMO', () => {
    const gota = /'(M16 3a8[^']+)'/.exec(leer('app/src/app/marca.ts'))?.[1];
    expect(gota, 'no encuentro la gota en el componente').toBeDefined();
    for (const f of ['simbolo.svg', 'completo.svg', 'favicon.svg', 'app-icon.svg']) {
      expect(leer(MARCA + f), `${f} dibuja otra gota`).toContain(gota!);
    }
  });

  it('⭐ los cuatro ficheros de la marca están, y con su ficha', () => {
    const hay = (readdirSync(RAIZ + MARCA) as string[]).sort();
    expect(hay).toEqual(['PROCEDENCIA.md', 'app-icon.svg', 'completo.svg', 'favicon.svg', 'simbolo.svg']);
    const doc = leer(MARCA + 'PROCEDENCIA.md');
    for (const f of ['simbolo.svg', 'completo.svg', 'favicon.svg', 'app-icon.svg']) {
      expect(doc, `${f} sin ficha`).toContain('`' + f + '`');
    }
  });

  /**
   * ⭐ Y NO SE CUELA EN EL CATÁLOGO DE ICONOS. Es marca: si acabara en
   * `app/simbolos/`, el censo de esa carpeta dejaría de cuadrar contra el
   * repositorio de Google, que es justo lo que le da valor.
   */
  it('⭐ la marca NO vive en `app/simbolos/`', () => {
    const enIconos = (readdirSync(RAIZ + 'app/simbolos') as string[]).filter((f) =>
      /marca|logo|simbolo\.svg|favicon|app-icon/.test(f),
    );
    expect(enIconos, 'la marca se ha colado en el catálogo de iconos').toEqual([]);
  });

  /**
   * ⚠️ **EL APP-ICON SE PRODUCE Y NO SE CABLEA**, y va declarado: hoy no hay
   *    `manifest.webmanifest` y crearlo es fuera de alcance. Esta jueza fija el
   *    estado para que el día que se cablee sea una decisión y no un descuido.
   */
  it('⚠️ el app-icon existe, y NO está cableado todavía', () => {
    expect(leer(MARCA + 'app-icon.svg')).toContain('512');
    expect(leer('app/src/index.html'), 'alguien cableó el app-icon sin acta').not.toContain('app-icon');
    expect(existsSync(RAIZ + 'app/public/manifest.webmanifest')).toBe(false);
  });
});
