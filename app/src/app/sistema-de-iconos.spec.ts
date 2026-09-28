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
// @ts-expect-error — idem: hace falta para inmovilizar el sha del favicon viejo
import { createHash } from 'node:crypto';
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

  /**
   * ⛔ ACTA (F-1, 24/09): el censo sube de 18 a 19, y de 7 a 8 los de 16 px.
   *
   * El icono nuevo es la flecha `arrow_back` del **«Volver al buscador» de
   * `/identidad`**, que hasta hoy era una isla sin salida. Es a 16 px porque es
   * **la misma pieza que `/creditos`**, letra por letra: darle otro tamaño para
   * no tocar esta cifra habría sido inventar una segunda versión del mismo
   * enlace, que es peor deuda que la que este censo lleva la cuenta.
   *
   * Y esta jueza funcionó exactamente como su cabecera prometía: la cifra está
   * clavada para que quien añada un icono a 16 px **tenga que venir aquí**, y
   * al venir lea por qué. Vine.
   */
  it('⭐ el censo de tamaños es el que dice el acta', () => {
    const cuenta: Record<number, number> = {};
    for (const l of LADOS) cuenta[l] = (cuenta[l] ?? 0) + 1;
    expect(cuenta).toEqual({ 14: 2, 16: 8, 18: 1, 20: 4, 24: 2, 48: 2 });
    expect(LADOS.length).toBe(19);
  });

  it('⭐ y exactamente ONCE usos caen fuera de la retícula, ni uno más', () => {
    const fuera = LADOS.filter((l) => l !== 20 && l !== 24 && !(l >= 48));
    expect(fuera.length, `fuera de 20/24: ${fuera.join(', ')}`).toBe(11);
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
   * ⚠️ **AQUÍ PONÍA que «el navegador se queda con la última declaración que
   *    entiende»**, y no es lo que dice la fuente. Leída el 28/09:
   *
   *      «If there are multiple <link rel="icon">s, the browser uses their
   *       media, type, and sizes attributes to select the most appropriate
   *       icon. If several icons are equally appropriate, the last one is
   *       used.»  [MDN · HTML attribute: rel — rel=icon]
   *
   *    O sea que **«la última» es el desempate**, no la regla: lo primero que
   *    manda son `media`, `type` y `sizes`. Con las dos líneas peladas que
   *    había, todo era desempate — por eso la nota vieja parecía cierta.
   *
   * ⭐ Desde el 28/09 **las dos declaran su `sizes`**, así que el navegador
   *    elige por lo que necesita. Esta jueza compra las dos cosas: que el
   *    tamaño esté escrito, y que el orden siga dejando al vectorial el último
   *    para el caso de empate.
   */
  it('⭐ el índice lo declara, con su `sizes`, y DESPUÉS del `.ico` de respaldo', () => {
    const html = leer('app/src/index.html');
    const ico = html.indexOf('type="image/x-icon"');
    const vec = html.indexOf('type="image/svg+xml"');
    expect(ico, 'no está el .ico de respaldo').toBeGreaterThan(0);
    expect(vec, 'no está el favicon SVG').toBeGreaterThan(0);
    expect(vec).toBeGreaterThan(ico);
    expect(html, 'el .ico no dice qué tamaños trae').toContain('sizes="48x48 32x32 16x16"');
    expect(html, 'el SVG no dice que sirve para cualquier talla').toContain('sizes="any"');
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

  /**
   * ⚠️ **AQUÍ SE EXIGÍAN CUATRO FICHEROS Y AHORA SON SIETE** (28/09): entraron
   *    los tres rasters del app-icon al cablearlo. La lista sigue siendo
   *    EXACTA a propósito —`toEqual`, no `toContain`—: lo que esta jueza
   *    defiende es que en `app/marca/` no aparezca nada sin ficha, y da igual
   *    que sea un dibujo nuevo o un PNG que alguien dejó ahí de paso.
   *
   * ⭐ Y LOS RASTERS NO SON FUENTE: **nacen de los SVG por comando**, y por eso
   *    la jueza del parecido —la de arriba— sigue mirando solo a los cuatro
   *    vectoriales. Quien cambie la marca cambia el SVG y vuelve a correr el
   *    comando que `PROCEDENCIA.md` tiene escrito; si cambiara el PNG a mano,
   *    el dibujo dejaría de cuadrar con su fuente y nadie se enteraría.
   */
  it('⭐ los siete ficheros de la marca están, y con su ficha', () => {
    const hay = (readdirSync(RAIZ + MARCA) as string[]).sort();
    expect(hay).toEqual([
      'PROCEDENCIA.md',
      'app-icon.svg',
      'apple-touch-icon.png',
      'completo.svg',
      'favicon.svg',
      'icon-192.png',
      'icon-512.png',
      'simbolo.svg',
    ]);
    const doc = leer(MARCA + 'PROCEDENCIA.md');
    for (const f of [
      'simbolo.svg',
      'completo.svg',
      'favicon.svg',
      'app-icon.svg',
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
    ]) {
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
   * ⭐ **EL APP-ICON ESTÁ CABLEADO Y EL MANIFEST EXISTE (28/09).**
   *
   * ⚠️ **AQUÍ PONÍA LO CONTRARIO**, y era verdad hasta hoy: «el app-icon existe,
   *    y NO está cableado todavía» —`not.toContain('app-icon')` y el manifest
   *    `toBe(false)`—. Aquella jueza no vigilaba un acierto: **fijaba un estado**
   *    para que cablearlo fuese *«una decisión y no un descuido»* [DISEÑO §39.6].
   *    Esta es esa decisión, firmada por Antonio el 28/09, así que la jueza
   *    cambia de sentido y **sigue haciendo el mismo trabajo**: antes impedía que
   *    se colara sin acta, ahora impide que se caiga sin que nadie lo note.
   */
  it('⭐ el app-icon está cableado y el manifest existe', () => {
    expect(leer(MARCA + 'app-icon.svg')).toContain('512');
    const html = leer('app/src/index.html');
    expect(html, 'el apple-touch-icon no está declarado').toContain('rel="apple-touch-icon"');
    expect(html, 'el manifest no está declarado').toContain('rel="manifest"');
    expect(existsSync(RAIZ + 'app/public/manifest.webmanifest')).toBe(true);

    const manifiesto = JSON.parse(leer('app/public/manifest.webmanifest')) as {
      name: string;
      short_name: string;
      display: string;
      theme_color: string;
      background_color: string;
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
    };
    expect(manifiesto.name).toBe('Desplázame');
    expect(manifiesto.short_name).toBe('Desplázame');
    // ⚖️ `browser` por dictado de Antonio: esto NO es una PWA —no hay service
    //    worker ni nada fuera de línea— y declararla instalable sería mentir.
    expect(manifiesto.display, 'esto no es una PWA: el display es `browser`').toBe('browser');
    expect(manifiesto.theme_color).toBe('#2563eb');
    expect(manifiesto.background_color).toBe('#ffffff');
    expect(manifiesto.icons.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512']);
  });

  /**
   * ⭐ LOS RASTERS EXISTEN Y MIDEN LO QUE DICEN, leído de su cabecera.
   *
   * ⚠️ **No vale con que el fichero esté**: un PNG de 32 llamado `icon-512.png`
   *    pasaría cualquier comprobación de existencia y saldría recortado en el
   *    lanzador de alguien. Así que se leen los cuatro bytes del `IHDR` —ancho y
   *    alto de verdad— y las entradas del `.ico`, que es un formato con índice.
   *
   * ⚠️ Y **el `.ico` ya no es el que dejó el andamiaje**. Ese es el hallazgo que
   *    esta jueza inmoviliza: el favicon por defecto de Angular tiene
   *    `sha256 f9102be8…` y estuvo en la pestaña desde el 16/08. Si algún día
   *    vuelve —un revert, una copia de plantilla—, esta jueza lo canta.
   */
  it('⭐ los rasters de la marca están, y miden lo que dicen', () => {
    // ⚠️ Sin `@types/node` no existe el nombre `Buffer`, así que se declara la
    //    forma mínima que esta jueza usa. Misma costura que el resto del fichero.
    interface Bytes {
      readUInt8(posicion: number): number;
      readUInt16LE(posicion: number): number;
      readUInt32BE(posicion: number): number;
      subarray(desde: number, hasta: number): { toString(codificacion: string): string };
    }
    const bytes = (rel: string): Bytes => readFileSync(RAIZ + rel) as Bytes;

    // Los PNG: ancho y alto viven en el `IHDR`, bytes 16-23.
    for (const [fichero, lado] of [
      ['app/marca/apple-touch-icon.png', 180],
      ['app/marca/icon-192.png', 192],
      ['app/marca/icon-512.png', 512],
    ] as Array<[string, number]>) {
      const b = bytes(fichero);
      expect(b.subarray(1, 4).toString('latin1'), `${fichero} no es un PNG`).toBe('PNG');
      expect(b.readUInt32BE(16), `${fichero} no mide ${lado} de ancho`).toBe(lado);
      expect(b.readUInt32BE(20), `${fichero} no mide ${lado} de alto`).toBe(lado);
    }

    // El `.ico`: cabecera de 6 bytes y una entrada de 16 por imagen.
    const ico = bytes('app/public/favicon.ico');
    expect(ico.readUInt16LE(2), 'el .ico no se declara como icono').toBe(1);
    const cuantas = ico.readUInt16LE(4);
    expect(cuantas, 'el .ico no trae tres tamaños').toBe(3);
    const lados = [...Array(cuantas).keys()].map((i) => ico.readUInt8(6 + 16 * i));
    expect(lados.sort((a, b) => a - b)).toEqual([16, 32, 48]);

    const EL_DE_ANGULAR = 'f9102be80297c0529207607be5277b4f90bca89d65988fa1771b91c7894e815f';
    expect(
      createHash('sha256').update(ico).digest('hex'),
      'el favicon volvió a ser el del andamiaje de Angular',
    ).not.toBe(EL_DE_ANGULAR);
  });
});
