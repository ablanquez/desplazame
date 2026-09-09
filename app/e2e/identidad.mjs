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
  primary: '#2563eb', 'primary-foreground': '#ffffff', success: '#16a34a',
  'success-foreground': '#ffffff', warning: '#fff4e5', 'warning-foreground': '#b45309',
  'warning-border': '#b45309', 'warning-dark': '#7c3d00', border: '#e2e8f0', ring: '#2563eb',
  muted: '#f1f5f9', 'muted-foreground': '#64748b',
  'mode-andando-soft': '#dcfce7', 'mode-andando-strong': '#16a34a',
  'mode-andando-solid': '#16a34a', 'mode-andando-text': '#ffffff',
  'mode-bus-soft': '#ccfbf1', 'mode-bus-strong': '#0f766e',
  'mode-bus-solid': '#0d9488', 'mode-bus-text': '#ffffff',
  'mode-bici-soft': '#f3e8ff', 'mode-bici-strong': '#7e22ce',
  'mode-bici-solid': '#9333ea', 'mode-bici-text': '#ffffff',
  'mode-patin-soft': '#fce7f3', 'mode-patin-strong': '#be185d',
  'mode-patin-solid': '#db2777', 'mode-patin-text': '#ffffff',
  'mode-moto-soft': '#ffedd5', 'mode-moto-strong': '#c2410c',
  'mode-moto-solid': '#ea580c', 'mode-moto-text': '#ffffff',
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
  'mode-bici-soft': '#581c87', 'mode-bici-strong': '#c084fc',
  'mode-bici-solid': '#a855f7', 'mode-bici-text': '#3b0764',
  'mode-patin-soft': '#831843', 'mode-patin-strong': '#f472b6',
  'mode-patin-solid': '#f43f5e', 'mode-patin-text': '#4c0519',
  'mode-moto-soft': '#7c2d12', 'mode-moto-strong': '#fb923c',
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
  //    No es un objetivo: es la raya en la pared, para que el crecimiento de la
  //    portada se vea siempre y nadie tenga que acordarse de comprobarlo.
  const ANTES = { peticiones: 4, bytes: 506686 };
  console.log(
    `\n  antes de esta tanda (3ff5fd8): ${ANTES.peticiones} peticiones · ${ANTES.bytes} B`,
  );
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

  juzgar(
    !enLaPortada.some((r) => /Inter-\w+\.woff2/.test(r.url)),
    'la portada NO se baja ninguna Inter',
    'el body no se ha tocado, así que nadie la usa todavía',
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
  await mando.cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'dark' }],
  });
  await mando.ir(PAGINA, 4500);
  comparar('⭐ capa 2 · el sistema pide oscuro', await leerTokens(':root'), OSCURO);

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
  //    eran once en cuanto se midieron `success` y `muted`: una cantidad a mano
  //    en un texto envejece a la primera — la lección de la nº39, en pequeño.
  console.log(
    `\n  ⚠️ ${porDebajo} pares no llegan a ${AA_TEXTO}:1 y están calcados así a propósito:`,
  );
  console.log('     son los valores del modelado aprobado y su corrección la decide Antonio.');

  // ═════════ LAS CAPTURAS ═════════
  await mando.ir(PAGINA, 5000);
  await mando.guardar(CAPTURAS + '/identidad-claro.png');
  await mando.evaluar(`document.querySelector('.identidad__conmutador').click()`);
  await mando.dormir(900);
  await mando.guardar(CAPTURAS + '/identidad-oscuro.png');
  console.log('\n  capturas: identidad-claro.png · identidad-oscuro.png');

  // Y que el conmutador sea LOCAL de verdad: el documento no se entera.
  const enElDocumento = await mando.evaluar(
    `String(document.documentElement.getAttribute('data-theme'))`,
  );
  juzgar(
    enElDocumento === 'null',
    'el conmutador es local: <html> sigue sin data-theme',
    `<html data-theme=${enElDocumento}>`,
  );

  console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
} finally {
  mando.cerrar();
}
