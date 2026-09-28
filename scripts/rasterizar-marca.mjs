/**
 * ⭐ EL RASTERIZADOR DE LA MARCA — y no hace falta instalar nada.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ **POR QUÉ ESTE FICHERO VIVE EN EL REPOSITORIO** (C-5 de la auditoría de
 *     cierre, 24/09, aplicada aquí el 28/09).
 *
 *  `app/marca/PROCEDENCIA.md` decía que cambiar el `.ico` «pide un rasterizador
 *  que este repositorio no tiene». Lo tiene: **el Chrome del arnés**, el mismo
 *  con el que esta casa mide píxeles desde el primer día, conducido por CDP.
 *  Ninguna dependencia entra en `package.json` por producir imágenes.
 *
 *  Y el guion se queda **aquí dentro** por la lección que ya pagó la batería:
 *  un instrumento que vive fuera deja a quien clona con la documentación y sin
 *  la herramienta, reconstruyéndola a mano. Un comando que no se puede repetir
 *  no es un comando: es una anécdota.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⭐ **FUENTE ÚNICA: los SVG de `app/marca/`.** Todo raster nace de ellos. Quien
 *    cambie la marca cambia el SVG y vuelve a correr esto; nadie retoca un PNG
 *    a mano, porque entonces el dibujo dejaría de cuadrar con su fuente y la
 *    jueza del parecido —que solo mira los vectoriales— no se enteraría.
 *
 * ⚠️ **EL `.ico` SALE DEL TEMA CLARO, Y NO PUEDE SER DE OTRO.** Un raster no lee
 *    `prefers-color-scheme`. Se rasteriza con lo que el navegador ve sin emular
 *    nada, y eso se IMPRIME al correr en vez de suponerlo.
 *
 * Uso:   node scripts/rasterizar-marca.mjs
 * Deja:  app/public/favicon.ico · app/marca/apple-touch-icon.png ·
 *        app/marca/icon-192.png · app/marca/icon-512.png ·
 *        app/marca/og.png · docs/img/logo.png
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MARCA = join(RAIZ, 'app', 'marca');
const PUBLICO = join(RAIZ, 'app', 'public');

// El taller: fuera del árbol, como manda la casa con lo temporal.
const TALLER = join(process.env['TEMP'] ?? RAIZ, 'rasterizar-marca');
mkdirSync(TALLER, { recursive: true });
process.env['TEMP'] = join(TALLER, 'perfiles');
mkdirSync(process.env['TEMP'], { recursive: true });
const { abrirChrome } = await import(`file:///${join(RAIZ, 'app', 'e2e', 'medir.mjs').split('\\').join('/')}`);

/** El SVG al tamaño que le pidamos, sin el `width`/`height` que traiga. */
function svgAlTamano(fichero, lado) {
  const crudo = readFileSync(join(MARCA, fichero), 'utf8');
  return crudo.replace(/<svg\b([^>]*)>/, (_todo, attrs) => {
    const limpio = attrs.replace(/\s(width|height)="[^"]*"/g, '');
    return `<svg${limpio} width="${lado}" height="${lado}">`;
  });
}

/**
 * Lo que se produce, y de qué SVG sale cada cosa.
 *
 * ⚠️ **El logo del README sale del `app-icon.svg` y NO del `completo.svg`**, y es
 *    una decisión medida (28/09): a los 110 px de ancho que usa el escaparate,
 *    el completo deja la palabra en unos 13 px de alto —ilegible de cerca— y
 *    además **repite «Desplázame» justo encima del `# Desplázame`** del propio
 *    README. El cuadrado se lee entero a ese tamaño y no duplica nada. El
 *    `completo.svg` sigue siendo el logo completo; lo que no es, es un logo de
 *    cabecera a 110 px.
 */
const ENCARGOS = [
  ['favicon.svg', 16, null],
  ['favicon.svg', 32, null],
  ['favicon.svg', 48, null],
  ['app-icon.svg', 110, join(RAIZ, 'docs', 'img', 'logo.png')],
  ['app-icon.svg', 180, join(MARCA, 'apple-touch-icon.png')],
  ['app-icon.svg', 192, join(MARCA, 'icon-192.png')],
  ['app-icon.svg', 512, join(MARCA, 'icon-512.png')],
];

const m = await abrirChrome({ ancho: 600, alto: 600, puerto: 9892 });
const hechos = [];
try {
  await m.ir('about:blank', 800);
  const esquema = await m.evaluar(
    `matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'`,
  );
  console.log(`marca: el navegador, sin emular nada, ve el tema ${esquema.toUpperCase()} — es el que llevará el .ico\n`);

  for (const [fuente, lado, destino] of ENCARGOS) {
    const pagina = join(TALLER, 'pagina.html');
    writeFileSync(
      pagina,
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
        'html,body{margin:0;padding:0;background:transparent}svg{display:block}' +
        '</style></head><body>' +
        svgAlTamano(fuente, lado) +
        '</body></html>',
      'utf8',
    );
    await m.cdp('Emulation.setDeviceMetricsOverride', {
      width: lado,
      height: lado,
      deviceScaleFactor: 1,
      mobile: false,
    });
    // Fondo transparente: el favicon de la marca no trae fondo propio.
    await m.cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    await m.ir(`file:///${pagina.split('\\').join('/')}`, 600);
    await m.pintado();
    const { data } = await m.cdp('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: lado, height: lado, scale: 1 },
      captureBeyondViewport: false,
    });
    const png = Buffer.from(data, 'base64');
    // El tamaño se LEE de la cabecera PNG, no se da por hecho.
    const ancho = png.readUInt32BE(16);
    if (ancho !== lado) throw new Error(`el PNG de ${lado} salió de ${ancho}`);
    if (destino) {
      writeFileSync(destino, png);
      console.log(`  ${destino.replace(RAIZ, '').padEnd(34)} ${String(png.length).padStart(6)} bytes · ${lado}×${lado} · de ${fuente}`);
    }
    hechos.push({ lado, png });
  }

  // ── LA TARJETA AL COMPARTIR ───────────────────────────────────────────────
  //
  // ⭐ 1200×630 es la medida del protocolo Open Graph, y **no es decorativa**:
  //    es la relación 1,91:1 que WhatsApp, Telegram y las redes recortan sin
  //    cortar nada. Aquí se compone y se captura igual que los iconos — misma
  //    fuente única, mismo instrumento, ninguna dependencia.
  //
  // ⚠️ **EL TAMAÑO DEL LOGO ESTÁ MEDIDO CONTRA LA MINIATURA, no elegido a ojo.**
  //    La tarjeta se ve a unos **300 px de ancho** en el hilo de una app de
  //    mensajería, o sea a **un cuarto**. Con el logo a 700 px de ancho aquí, la
  //    palabra «Desplázame» cae en unos 23 px de altura de caja en esa
  //    miniatura: se lee. A 400 px se quedaba en 13 y no se leía.
  //
  // ⚠️ **Inter se carga del fichero que viaja**, `app/public/fuentes/`, y no de
  //    la letra del sistema: si no, la tarjeta saldría con otra tipografía en
  //    cada máquina que la regenerase.
  const LEMA =
    'Cómo ir de un portal a otro en Zaragoza: andando, en autobús o tranvía, ' +
    'en bici o patinete, en coche o en moto.';
  const fuentes = join(RAIZ, 'app', 'public', 'fuentes').split('\\').join('/');
  const completo = readFileSync(join(MARCA, 'completo.svg'), 'utf8').replace(
    /<svg\b([^>]*)>/,
    (_t, a) => `<svg${a.replace(/\s(width|height)="[^"]*"/g, '')} width="700" height="118.9">`,
  );
  const tarjeta = join(TALLER, 'og.html');
  writeFileSync(
    tarjeta,
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
       @font-face { font-family: Inter; font-weight: 400; src: url('file:///${fuentes}/Inter-Regular.woff2') format('woff2'); }
       @font-face { font-family: Inter; font-weight: 600; src: url('file:///${fuentes}/Inter-SemiBold.woff2') format('woff2'); }
       html, body { margin: 0; padding: 0; }
       body { width: 1200px; height: 630px; display: flex; flex-direction: column;
              align-items: center; justify-content: center; gap: 52px;
              /* El claro de la casa: --claro-background y --claro-foreground de styles.css */
              background: #ffffff; color: #1e293b;
              font-family: Inter, system-ui, sans-serif; }
       p { margin: 0; max-width: 940px; text-align: center; font-size: 38px;
           line-height: 1.38; font-weight: 400; }
     </style></head><body>
       <div style="color:#2563eb">${completo}</div>
       <p>${LEMA}</p>
     </body></html>`,
    'utf8',
  );
  await m.cdp('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await m.cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 255, g: 255, b: 255, a: 1 } });
  await m.ir(`file:///${tarjeta.split('\\').join('/')}`, 900);
  await m.evaluar('document.fonts.ready.then(() => 1)');
  await m.pintado();
  const og = await m.cdp('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
    captureBeyondViewport: false,
  });
  const ogPng = Buffer.from(og.data, 'base64');
  if (ogPng.readUInt32BE(16) !== 1200 || ogPng.readUInt32BE(20) !== 630) {
    throw new Error(`la tarjeta salió de ${ogPng.readUInt32BE(16)}×${ogPng.readUInt32BE(20)}`);
  }
  writeFileSync(join(MARCA, 'og.png'), ogPng);
  console.log(`  \\app\\marca\\og.png                  ${String(ogPng.length).padStart(6)} bytes · 1200×630 · de completo.svg + el lema`);
  rmSync(tarjeta, { force: true });
} finally {
  m.cerrar();
}

/**
 * ⭐ EL `.ico` MULTI-IMAGEN, escrito a mano: cabecera de 6 bytes, una entrada de
 * 16 por imagen, y los PNG detrás. El contenedor ICO admite **PNG dentro** desde
 * Windows Vista y es lo que entienden todos los navegadores de hoy.
 */
const paraElIco = hechos.filter((h) => [16, 32, 48].includes(h.lado));
const indice = Buffer.alloc(6 + 16 * paraElIco.length);
indice.writeUInt16LE(0, 0); // reservado
indice.writeUInt16LE(1, 2); // 1 = icono
indice.writeUInt16LE(paraElIco.length, 4);
let desplazamiento = indice.length;
paraElIco.forEach((h, i) => {
  const p = 6 + 16 * i;
  indice.writeUInt8(h.lado, p); // ancho
  indice.writeUInt8(h.lado, p + 1); // alto
  indice.writeUInt8(0, p + 2); // sin paleta
  indice.writeUInt8(0, p + 3); // reservado
  indice.writeUInt16LE(1, p + 4); // planos
  indice.writeUInt16LE(32, p + 6); // bits por píxel
  indice.writeUInt32LE(h.png.length, p + 8);
  indice.writeUInt32LE(desplazamiento, p + 12);
  desplazamiento += h.png.length;
});
const ico = Buffer.concat([indice, ...paraElIco.map((h) => h.png)]);
writeFileSync(join(PUBLICO, 'favicon.ico'), ico);
console.log(
  `  /app/public/favicon.ico            ${String(ico.length).padStart(6)} bytes · ` +
    `${paraElIco.map((h) => h.lado).join('·')} · ${paraElIco.length} imágenes · de favicon.svg`,
);

rmSync(join(TALLER, 'pagina.html'), { force: true });
console.log('\n✅ la marca rasterizada. Sus juezas viven en app/src/app/sistema-de-iconos.spec.ts');
