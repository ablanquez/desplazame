/**
 * ⭐ LA IDENTIDAD VISUAL, MEDIDA EN CHROME DE VERDAD (9/09, punto 15).
 *
 * ── ⚠️ Por qué esto existe además de `identidad.spec.ts` ────────────────────
 *
 * Porque el juez unitario lee **el fichero** y este lee **la pantalla**, y no
 * son lo mismo. Medido el 9/09: en jsdom, `getComputedStyle` sobre una custom
 * property devuelve la cadena vacía, y a través de `var()` también. Allí no se
 * puede comprobar que el tema oscuro se aplique — solo que esté escrito.
 *
 * Aquí sí. Y además se pueden hacer tres cosas que un test no puede:
 *
 * 1. **Forzar `prefers-color-scheme`** con `Emulation.setEmulatedMedia`. Es la
 *    ÚNICA forma de juzgar la capa del sistema operativo, que si no viviría
 *    sin vigilancia: quien tenga el portátil en oscuro es quien la sufre.
 * 2. **Contar las peticiones de red de verdad**, con `Network.enable`. Un grep
 *    del código dice que no está escrito; esto dice que no se pide.
 * 3. **Mirar el píxel pintado**, con la doctrina de `medir.mjs`: el color real,
 *    con opacidades y capas ya dentro.
 *
 * ⚠️ Necesita `ng serve` en 4200 y un Chrome, como el resto de los `e2e/`.
 *    Se lanza a mano: `node e2e/identidad.mjs`
 */
import { abrirChrome, contrasteRgb, deHex, AA_TEXTO } from './medir.mjs';

/**
 * Contra quién se mide. Por defecto `ng serve`, como el resto de los `e2e/`,
 * pero admite otra URL para medir **el paquete de producción**: el reparto en
 * trozos que hace `ng build` no es el del servidor de desarrollo, y la cuenta
 * de peticiones de la portada solo significa algo sobre el de verdad.
 */
const APP = (process.argv[2] ?? 'http://localhost:4200').replace(/\/+$/, '') + '/';
const PAGINA = APP + 'identidad';

/**
 * Donde van los PNG. ⚠️ Por defecto AL LADO, nunca dentro del repositorio:
 * los `e2e/` de aqui ya han dejado capturas sueltas en la raiz mas de una vez
 * y hubo que borrarlas a mano. Se pasa como segundo argumento.
 */
const CAPTURAS = (process.argv[3] ?? '.').replace(/[\\/]+$/, '');

/** Lo calcado del `index.css` de la referencia. La copia de control. */
const CLARO = {
  background: '#ffffff', foreground: '#1e293b', card: '#ffffff', 'card-foreground': '#1e293b',
  primary: '#2563eb', 'primary-foreground': '#ffffff', success: '#15803d',
  'success-foreground': '#ffffff', warning: '#fff4e5', 'warning-foreground': '#b45309',
  'warning-border': '#b45309', 'warning-dark': '#7c3d00', border: '#e2e8f0', ring: '#2563eb',
  muted: '#f8fafc', 'muted-foreground': '#64748b',
  'mode-andando-soft': '#dcfce7', 'mode-andando-strong': '#15803d',
  'mode-andando-solid': '#15803d', 'mode-andando-text': '#ffffff',
  'mode-bus-soft': '#ccfbf1', 'mode-bus-strong': '#0f766e',
  'mode-bus-solid': '#0f766e', 'mode-bus-text': '#ffffff',
  'mode-bici-soft': '#f3e8ff', 'mode-bici-strong': '#7e22ce',
  'mode-bici-solid': '#9333ea', 'mode-bici-text': '#ffffff',
  'mode-patin-soft': '#fce7f3', 'mode-patin-strong': '#be185d',
  'mode-patin-solid': '#db2777', 'mode-patin-text': '#ffffff',
  'mode-moto-soft': '#ffedd5', 'mode-moto-strong': '#c2410c',
  'mode-moto-solid': '#c2410c', 'mode-moto-text': '#ffffff',
  'mode-coche-soft': '#f1f5f9', 'mode-coche-strong': '#334155',
  'mode-coche-solid': '#475569', 'mode-coche-text': '#ffffff',
};

const OSCURO = {
  background: '#121212', foreground: '#f0f0f0', card: '#1e1e1e', 'card-foreground': '#f0f0f0',
  primary: '#93c5fd', 'primary-foreground': '#0f172a', success: '#22c55e',
  'success-foreground': '#0f172a', warning: '#3a1d00', 'warning-foreground': '#fde68a',
  'warning-border': '#92400e', 'warning-dark': '#fef3c7', border: '#333333', ring: '#93c5fd',
  muted: '#242424', 'muted-foreground': '#b8b8b8',
  'mode-andando-soft': '#14532d', 'mode-andando-strong': '#4ade80',
  'mode-andando-solid': '#22c55e', 'mode-andando-text': '#052e16',
  'mode-bus-soft': '#134e4a', 'mode-bus-strong': '#2dd4bf',
  'mode-bus-solid': '#14b8a6', 'mode-bus-text': '#042f2e',
  'mode-bici-soft': '#581c87', 'mode-bici-strong': '#d8b4fe',
  'mode-bici-solid': '#c084fc', 'mode-bici-text': '#3b0764',
  'mode-patin-soft': '#831843', 'mode-patin-strong': '#f9a8d4',
  'mode-patin-solid': '#fb7185', 'mode-patin-text': '#4c0519',
  'mode-moto-soft': '#7c2d12', 'mode-moto-strong': '#fdba74',
  'mode-moto-solid': '#f97316', 'mode-moto-text': '#431407',
  'mode-coche-soft': '#1e293b', 'mode-coche-strong': '#94a3b8',
  'mode-coche-solid': '#94a3b8', 'mode-coche-text': '#0f172a',
};

const TOKENS = Object.keys(CLARO);

let fallos = 0;
let porDebajo = 0;
const juzgar = (bien, titulo, detalle = '') => {
  if (!bien) fallos++;
  console.log(`  ${bien ? 'OK ' : '✗✗ '} ${titulo}${detalle ? '  ·  ' + detalle : ''}`);
};

const mando = await abrirChrome({ ancho: 1400, alto: 2200 });

try {
  // ═════════ (iii) y (iv) — LA RED, ANTES DE NADA ═════════
  //
  // Se enciende la vigilancia de red antes de navegar: lo que se cuenta es lo
  // que el navegador pide de verdad, no lo que el código dice.
  await mando.cdp('Network.enable');

  // ⚠️ EN FRÍO de verdad: sin caché, la caché es justo lo que oculta el peso.
  //    `PerformanceObserver` no hace falta — `performance.getEntriesByType`
  //    ya trae todo lo que la página se ha bajado desde que se cargó.
  await mando.cdp('Network.clearBrowserCache');
  await mando.ir(APP, 4500);
  const enLaPortada = await mando.evaluar(`
    JSON.stringify(performance.getEntriesByType('resource')
      .map((e) => ({ url: e.name, bytes: e.transferSize })))
  `).then(JSON.parse);

  console.log('\n═══ (iv) LA PORTADA EN FRÍO ═══');

  // ⚠️ Solo lo que sirve este dominio. Las teselas de OpenStreetMap son de
  //    fuera, no las decide este repositorio, y meterlas en la cuenta la haría
  //    depender de si el mapa llegó a pintarse.
  const propias = enLaPortada.filter((r) => r.url.startsWith(APP));
  const peso = propias.reduce((s, r) => s + (r.bytes || 0), 0);
  console.log(
    `  peticiones propias: ${propias.length}  ·  de terceros (teselas): ${enLaPortada.length - propias.length}`,
  );
  console.log(`  peso propio transferido: ${peso} B (${(peso / 1024).toFixed(1)} kB)`);
  for (const r of propias) {
    console.log(`    ${String(r.bytes ?? 0).padStart(7)} B  ${r.url.replace(APP, '/')}`);
  }

  // ⭐ EL CENSO DE ANTES, medido el 9/09 sobre el `app/dist` de la commit
  //    3ff5fd8 —el de antes de esta tanda— servido igual y con la misma sonda.
  //
  // ⚠️ NO ES UN UMBRAL, Y ESA ES LA DIFERENCIA. La portada tiene que poder
  //    crecer: la primera formulacion de esta juez pedia que no ganara «ni
  //    peticiones ni peso», y eso es incompatible con el propio encargo que
  //    mandaba meter los tokens en el CSS global. Un CSS global mas grande es
  //    peso, por definicion.
  //
  //    Asi que lo que se vigila es el INVARIANTE —la portada no monta la
  //    pagina nueva, no baja Inter y no baja el trozo perezoso: eso si son
  //    juezas, y estan aqui debajo— y lo que se hace con el peso es CANTARLO
  //    en cada ejecucion. Crecimiento gobernado, no congelado: la raya en la
  //    pared esta para que nadie tenga que acordarse de mirar.
  //
  //    La raya se mueve cada tanda, a la medida de la anterior: lo que se
  //    compara siempre es «un paso», no «el origen». Ha ido marcando
  //    3ff5fd8 (4 · 506.686 B, antes de los tokens), la tanda 1 (6 · 518.423) y
  //    la tanda 2 (8 · 745.483); ahora marca el remate 1 de la tanda 3, que es
  //    contra lo que crece este.
  const ANTES = { peticiones: 8, bytes: 751542, de: 'el remate 1 de la tanda 3 (ffc2964)' };
  console.log(`\n  antes de esta tanda — ${ANTES.de}: ${ANTES.peticiones} peticiones · ${ANTES.bytes} B`);
  console.log(
    `  ahora:                          ${propias.length} peticiones · ${peso} B` +
      `   → ${propias.length - ANTES.peticiones >= 0 ? '+' : ''}${propias.length - ANTES.peticiones}` +
      ` peticiones · ${peso - ANTES.bytes >= 0 ? '+' : ''}${peso - ANTES.bytes} B`,
  );
  console.log(
    '  ⚠️ Sin comprimir: ni el motor ni la sonda comprimen. `ng build` estima el\n' +
      '     CSS en 3,36 kB transferidos frente a 3,29 antes — los tokens repiten\n' +
      '     mucho y se comprimen casi enteros.',
  );

  // ⚠️ LA LETRA DE ESTA JUEZ CAMBIO EN LA TANDA 2, y hay que decirlo: hasta
  //    entonces exigia que la portada NO bajara Inter, porque el `body` no
  //    estaba vestido y nadie la usaba. Ahora la portada **es** quien la usa,
  //    asi que bajarla es lo correcto y no bajarla seria el fallo.
  const interEnPortada = enLaPortada.filter((r) => /Inter-\w+\.woff2/.test(r.url));
  juzgar(
    interEnPortada.length > 0 && interEnPortada.every((r) => r.url.startsWith(APP)),
    'la portada baja Inter, y del propio dominio',
    interEnPortada.map((r) => r.url.split('/').pop()).join(', ') || 'ninguna',
  );

  // ⭐ Y SOLO SE PRECARGA EL 400, que no es lo mismo que «solo se baja el 400».
  //
  // ⚠️ Esta juez decia lo segundo y era falso: los `h1` y los `legend` son
  //    negrita, asi que en cuanto el `body` paso a Inter el navegador pidio
  //    tambien el SemiBold. Eso es correcto —la pagina lo usa—; lo que se
  //    decidio precargar es solo el peso del texto corrido.
  const precargado = await mando.evaluar(
    `JSON.stringify([...document.querySelectorAll('link[rel="preload"]')].map((l) => l.href))`,
  ).then(JSON.parse);
  juzgar(
    precargado.length === 1 && /Inter-Regular\.woff2$/.test(precargado[0] ?? ''),
    'solo se precarga el peso 400 — el 500 y el 600 llegan si la pagina los usa',
    precargado.map((u) => u.split('/').pop()).join(', ') || 'nada precargado',
  );

  // ⭐ NI UNA DOS VECES. Un preload cuya URL no case con la del `@font-face`
  //    no ahorra: descarga el fichero por duplicado, y no avisa de nada.
  const veces = {};
  for (const r of interEnPortada) veces[r.url] = (veces[r.url] ?? 0) + 1;
  const repetidas = Object.entries(veces).filter(([, n]) => n > 1);
  juzgar(
    repetidas.length === 0,
    'ninguna fuente se baja dos veces (el preload casa con el @font-face)',
    repetidas.map(([u, n]) => `${u.split('/').pop()} x${n}`).join(', '),
  );

  juzgar(
    !enLaPortada.some((r) => /identidad/.test(r.url)),
    'la portada NO se baja el trozo de /identidad',
    'la ruta es perezosa',
  );

  // ── (iii) Google Fonts, en las dos páginas ──────────────────────────────
  console.log('\n═══ (iii) NI UNA PETICIÓN A GOOGLE FONTS ═══');
  for (const [nombre, url] of [['la portada', APP], ['/identidad', PAGINA]]) {
    await mando.ir(url, 4000);
    const google = await mando.evaluar(`
      JSON.stringify(performance.getEntriesByType('resource')
        .map((e) => e.name)
        .filter((u) => /fonts\\.(googleapis|gstatic)\\.com/.test(u)))
    `).then(JSON.parse);
    juzgar(google.length === 0, `${nombre}: 0 peticiones a Google`, google.join(', '));
  }

  // ── Inter sí se sirve del propio dominio, en /identidad ─────────────────
  await mando.ir(PAGINA, 4500);
  const fuentes = await mando.evaluar(`
    JSON.stringify(performance.getEntriesByType('resource')
      .map((e) => e.name).filter((u) => /\\.woff2/.test(u)))
  `).then(JSON.parse);
  console.log(`\n  Inter servida desde: ${fuentes.map((u) => u.replace(APP, '/')).join(', ') || '(ninguna)'}`);
  juzgar(
    fuentes.length > 0 && fuentes.every((u) => u.startsWith(APP)),
    '/identidad baja Inter, y del propio dominio',
  );

  // ═════════ (i) LOS TOKENS, EN LAS TRES CAPAS ═════════
  const leerTokens = async (selector) =>
    JSON.parse(
      await mando.evaluar(`
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          const s = getComputedStyle(el);
          const o = {};
          for (const t of ${JSON.stringify(TOKENS)}) o[t] = s.getPropertyValue('--' + t).trim();
          return JSON.stringify(o);
        })()
      `),
    );

  const comparar = (titulo, leidos, esperados) => {
    const mal = TOKENS.filter((t) => leidos[t] !== esperados[t]);
    juzgar(
      mal.length === 0,
      `${titulo}: los 40 tokens valen lo calcado`,
      mal.length ? mal.map((t) => `--${t}=${leidos[t] || '(vacío)'}≠${esperados[t]}`).join(' · ') : '',
    );
  };

  console.log('\n═══ (i) LOS TOKENS, EN LAS TRES CAPAS ═══');

  // Capa 1 — el claro, con el sistema en claro.
  await mando.cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  });
  await mando.ir(PAGINA, 4500);
  comparar('capa 1 · :root con el sistema en claro', await leerTokens(':root'), CLARO);

  // ⭐ Capa 2 — el sistema en oscuro. Es la que NINGÚN test unitario alcanza.
  //
  // ⚠️ Y DESDE LA TANDA 2 HAY QUE QUITAR EL `data-theme` PARA VERLA. El
  //    documento lo lleva fijado en «light» mientras dure la migracion, asi que
  //    el `:not([data-theme='light'])` de la capa 2 no aplica en ningun sitio
  //    de la app: es justo su efecto buscado. Pero la capa SIGUE AHI y el dia
  //    que llegue el conmutador volvera a mandar, asi que se sigue juzgando —
  //    se le quita el atributo al documento, se mide, y se le devuelve.
  //
  //    Sin esto, la juez quedaria en verde por una razon nueva (no hay nada que
  //    medir) en vez de por la que se escribio, y eso es exactamente el verde
  //    que persigue la nº43.
  await mando.cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'dark' }],
  });
  await mando.ir(PAGINA, 4500);
  const temaFijado = await mando.evaluar(
    `String(document.documentElement.getAttribute('data-theme'))`,
  );
  await mando.evaluar(`document.documentElement.removeAttribute('data-theme')`);
  comparar('⭐ capa 2 · el sistema pide oscuro', await leerTokens(':root'), OSCURO);
  await mando.evaluar(
    `document.documentElement.setAttribute('data-theme', ${JSON.stringify(temaFijado)})`,
  );
  juzgar(temaFijado === 'light', 'y el documento lo tenia fijado en claro', `era ${temaFijado}`);

  // Y con el sistema en oscuro, un trozo marcado como claro TIENE que ganar.
  comparar(
    "⭐ capa 3 · [data-theme='light'] gana al sistema oscuro",
    await leerTokens("[data-sonda='light']"),
    CLARO,
  );

  // Capa 3 — la elección explícita del oscuro, con el sistema en claro.
  await mando.cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  });
  await mando.ir(PAGINA, 4500);
  comparar(
    "capa 3 · [data-theme='dark'] con el sistema en claro",
    await leerTokens("[data-sonda='dark']"),
    OSCURO,
  );

  // ═════════ (ii) EL CONTRASTE, PAR A PAR Y EN LOS DOS TEMAS ═════════
  console.log('\n═══ (ii) EL CONTRASTE DE LOS PARES ═══');
  for (const [tema, tabla] of [['light', CLARO], ['dark', OSCURO]]) {
    console.log(`\n  ── ${tema} ──`);
    const pares = [
      ['foreground', 'background'], ['card-foreground', 'card'],
      ['primary-foreground', 'primary'], ['success-foreground', 'success'],
      ['warning-foreground', 'warning'], ['muted-foreground', 'muted'],
      ...['andando', 'bus', 'bici', 'patin', 'moto', 'coche'].flatMap((m) => [
        [`mode-${m}-text`, `mode-${m}-solid`],
        [`mode-${m}-strong`, `mode-${m}-soft`],
      ]),
    ];
    const leidos = await leerTokens(`[data-sonda='${tema}']`);
    for (const [a, b] of pares) {
      // ⚠️ El ratio se calcula sobre lo LEÍDO del navegador, no sobre la tabla:
      //    si el CSS aplicado no fuera el calcado, este número lo diría.
      const r = contrasteRgb(deHex(leidos[a] || tabla[a]), deHex(leidos[b] || tabla[b]));
      const ok = r >= AA_TEXTO;
      if (!ok) porDebajo++;
      console.log(
        `  ${ok ? 'OK ' : '⚠️ '} ${(a + ' / ' + b).padEnd(40)} ${leidos[a]} sobre ${leidos[b]}  =  ${r.toFixed(2)}:1`,
      );
    }
  }
  // ⚠️ La cifra se CUENTA, no se escribe. Aquí ponía «los nueve marcados» y ya
  //    eran once en cuanto se midieron `success` y `muted`; luego bajaron a
  //    cero al corregirlos. Una cantidad a mano en un texto envejece a la
  //    primera, y el texto que la acompaña también: por eso las dos frases
  //    salen de la cuenta y no de lo que era verdad el día que se escribieron.
  juzgar(
    porDebajo === 0,
    `los ${36 - porDebajo} de 36 pares cumplen AA (${AA_TEXTO}:1)`,
    porDebajo ? `${porDebajo} por debajo — decidir: corregir el valor o censarlo` : '',
  );

  // ═════════ LAS CAPTURAS ═════════
  await mando.ir(PAGINA, 5000);
  await mando.guardar(CAPTURAS + '/identidad-claro.png');
  await mando.evaluar(`document.querySelector('.identidad__conmutador').click()`);
  await mando.dormir(900);
  await mando.guardar(CAPTURAS + '/identidad-oscuro.png');
  console.log('\n  capturas: identidad-claro.png · identidad-oscuro.png');

  // Y que el conmutador sea LOCAL de verdad: el documento no se entera.
  //
  // ⚠️ Esto pedia que `<html>` siguiera SIN `data-theme`, y desde la tanda 2 lo
  //    lleva puesto en «light» a proposito. Lo que importaba nunca fue que
  //    estuviera vacio, sino que el conmutador de esta pagina NO LO CAMBIE.
  const enElDocumento = await mando.evaluar(
    `String(document.documentElement.getAttribute('data-theme'))`,
  );
  juzgar(
    enElDocumento === 'light',
    'el conmutador es local: no toca el data-theme de <html>',
    `<html data-theme=${enElDocumento}> (tras pulsar «ver en oscuro»)`,
  );

  // ═════════ (v) LA BASE, Y EL TEMA FIJADO EN CLARO ═════════
  //
  // ⭐ LA VARA DE LA nº43, APLICADA AL PRODUCTO. Con el `body` en tokens pero
  //    los componentes aun sin vestir, dejar mandar al sistema pintaria fondo
  //    oscuro debajo de piezas pensadas para fondo claro. `data-theme="light"`
  //    en `<html>` lo impide — y que lo impida DE VERDAD solo se puede ver
  //    emulando el sistema, que es lo unico que ningun test alcanza.
  console.log('\n═══ (v) LA BASE DEL PRODUCTO ═══');
  for (const [nombre, sistema] of [['claro', 'light'], ['OSCURO', 'dark']]) {
    await mando.cdp('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: sistema }],
    });
    await mando.ir(APP, 4500);
    const b = JSON.parse(
      await mando.evaluar(`(() => {
        const s = getComputedStyle(document.body);
        return JSON.stringify({
          tema: document.documentElement.getAttribute('data-theme'),
          fondo: s.backgroundColor, color: s.color,
          familia: s.fontFamily, cifras: s.fontVariantNumeric,
        });
      })()`),
    );
    juzgar(
      b.tema === 'light' && b.fondo === 'rgb(255, 255, 255)' && b.color === 'rgb(30, 41, 59)',
      `con el sistema en ${nombre}, la portada se queda CLARA`,
      `data-theme=${b.tema} · fondo ${b.fondo} · texto ${b.color}`,
    );
    if (sistema === 'light') {
      juzgar(/Inter/.test(b.familia), 'y el body pide Inter', b.familia);
      juzgar(b.cifras === 'tabular-nums', 'y sus cifras son tabulares', b.cifras);
    }
  }

  console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
} finally {
  mando.cerrar();
}
