/**
 * ⭐ EL INSTRUMENTO QUE MIRA LA PANTALLA. SOLO PÍXELES. CERO MODELO.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  HEREDADO DE ZETABUS (`e2e/lib/medir.ts`), Y CON SU LECCIÓN, que es la razón
 *  de que esto exista en vez de un `getComputedStyle` de tres líneas:
 *
 *  Su primera versión leía `color` con `getComputedStyle` y lo comparaba contra
 *  el píxel del fondo. Parecía honesto —la mitad venía del píxel— y era trampa:
 *
 *      **`getComputedStyle().color` NO INCLUYE EL `opacity` DEL ELEMENTO.**
 *
 *  Un `<span style="color:#000; opacity:0.18">` sobre blanco devuelve
 *  `rgb(0,0,0)`. Contraste calculado: **21:1. PERFECTO. APROBADO.** Y en
 *  pantalla no se ve nada.
 *
 *  ⇒ AQUÍ NO SE MODELA NADA. Se recortan los píxeles del elemento y se miran:
 *      · el FONDO es el color que MÁS SE REPITE (la moda)
 *      · el TEXTO es el más LEJANO en luminancia que aparezca lo bastante
 *        (≥3 píxeles, así no manda un píxel suelto de suavizado)
 *
 *  Con eso, el alfa, la opacidad heredada, los degradados, los `filter` y
 *  cualquier capa encima YA ESTÁN DENTRO DEL NÚMERO, porque son el número. El
 *  navegador ya lo pintó.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y ES `.mjs` SIN TIPOS Y SIN LIBRERÍAS a propósito: **las dependencias son
 *    CERO**. Chrome se conduce por CDP sobre el `WebSocket` global de Node, y el
 *    PNG se decodifica con el `zlib` que Node ya trae. No hay Playwright ni
 *    `pngjs` que instalar, y este fichero no entra en ningún `tsconfig`.
 */
import { spawn } from 'node:child_process';
import { inflateSync } from 'node:zlib';

export const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/** WCAG 1.4.3 AA (texto) y 1.4.11 AA (gráficos). Las mismas de `contraste.ts`. */
export const AA_TEXTO = 4.5;
export const AA_GRAFICO = 3;

const linealizar = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/**
 * Luminancia relativa (WCAG 2.x). **La misma fórmula que `src/app/contraste.ts`**,
 * con su linealización — si el instrumento y la pantalla no compartieran fórmula,
 * el instrumento podría aprobar exactamente lo que la pantalla considera ilegible.
 *
 * ⚠️ Está escrita dos veces porque el instrumento es `.mjs` sin build y la
 *    pantalla es TypeScript de Angular. **Lo vigila una juez**: `e2e/pantalla.mjs`
 *    compara los dos resultados sobre los mismos pares antes de medir nada.
 */
export const luminancia = ({ r, g, b }) =>
  0.2126 * linealizar(r) + 0.7152 * linealizar(g) + 0.0722 * linealizar(b);

export function contrasteRgb(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const deHex = (hex) => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  EL PNG, A MANO. Firma + IHDR + IDAT inflado + defiltrado.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decodifica un PNG de 8 bits (RGB o RGBA) a `{ ancho, alto, datos }` con
 * `datos` en RGBA plano.
 *
 * ⚠️ **No es un decodificador general y lo dice**: no hace paleta, ni 16 bits,
 *    ni entrelazado Adam7. Chrome captura en RGBA de 8 bits sin entrelazar, así
 *    que es lo único que hace falta — y si algún día llegara otra cosa, esto
 *    **revienta con su motivo** en vez de devolver píxeles inventados.
 */
export function leerPng(buf) {
  const FIRMA = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== FIRMA[i]) throw new Error('esto no es un PNG');
  }
  let p = 8;
  let ancho = 0;
  let alto = 0;
  let canales = 0;
  const trozos = [];
  while (p < buf.length) {
    const largo = buf.readUInt32BE(p);
    const tipo = buf.toString('ascii', p + 4, p + 8);
    const cuerpo = buf.subarray(p + 8, p + 8 + largo);
    if (tipo === 'IHDR') {
      ancho = cuerpo.readUInt32BE(0);
      alto = cuerpo.readUInt32BE(4);
      const bits = cuerpo[8];
      const color = cuerpo[9];
      const entrelazado = cuerpo[12];
      if (bits !== 8) throw new Error(`PNG de ${bits} bits: solo se leen los de 8`);
      if (entrelazado !== 0) throw new Error('PNG entrelazado: no se lee');
      if (color === 2) canales = 3;
      else if (color === 6) canales = 4;
      else throw new Error(`PNG de tipo de color ${color}: solo RGB (2) y RGBA (6)`);
    } else if (tipo === 'IDAT') {
      trozos.push(cuerpo);
    } else if (tipo === 'IEND') {
      break;
    }
    p += 12 + largo;
  }
  const crudo = inflateSync(Buffer.concat(trozos));
  const porFila = ancho * canales;
  const datos = Buffer.alloc(ancho * alto * 4);
  const previa = Buffer.alloc(porFila);
  const actual = Buffer.alloc(porFila);
  let q = 0;
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[q++];
    crudo.copy(actual, 0, q, q + porFila);
    q += porFila;
    // Los cinco filtros del PNG (RFC 2083 §6): None, Sub, Up, Average, Paeth.
    for (let i = 0; i < porFila; i++) {
      const a = i >= canales ? actual[i - canales] : 0;
      const b = previa[i];
      const c = i >= canales ? previa[i - canales] : 0;
      let x = actual[i];
      if (filtro === 1) x += a;
      else if (filtro === 2) x += b;
      else if (filtro === 3) x += (a + b) >> 1;
      else if (filtro === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        x += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filtro !== 0) {
        throw new Error(`filtro PNG desconocido: ${filtro}`);
      }
      actual[i] = x & 0xff;
    }
    for (let x = 0; x < ancho; x++) {
      const o = (y * ancho + x) * 4;
      const i = x * canales;
      datos[o] = actual[i];
      datos[o + 1] = actual[i + 1];
      datos[o + 2] = actual[i + 2];
      datos[o + 3] = canales === 4 ? actual[i + 3] : 255;
    }
    actual.copy(previa);
  }
  return { ancho, alto, datos };
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHROME POR CDP
// ─────────────────────────────────────────────────────────────────────────────

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Abre Chrome headless y devuelve un mando con `evaluar`, `captura` y `cerrar`. */
export async function abrirChrome({ puerto = 9350, ancho = 1280, alto = 1400 } = {}) {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--force-device-scale-factor=1',
    '--remote-debugging-port=' + puerto,
    '--user-data-dir=' + process.env.TEMP + '/perfil-medir-' + puerto,
    'about:blank',
  ]);
  chrome.on('error', (e) => {
    throw new Error('Chrome no arranca: ' + e.message);
  });

  let url = null;
  for (let i = 0; i < 40 && !url; i++) {
    try {
      const lista = await (await fetch(`http://localhost:${puerto}/json/list`)).json();
      url = lista.find((t) => t.type === 'page')?.webSocketDebuggerUrl ?? null;
    } catch {
      // Todavía no ha abierto el puerto: se reintenta.
    }
    if (!url) await dormir(250);
  }
  if (!url) throw new Error('Chrome no abrió el puerto de depuración');

  const ws = new WebSocket(url);
  await new Promise((ok) => (ws.onopen = ok));
  let n = 0;
  const pendientes = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    const p = m.id && pendientes.get(m.id);
    if (p) {
      pendientes.delete(m.id);
      m.error ? p.mal(new Error(JSON.stringify(m.error))) : p.ok(m.result);
    }
  };
  const cdp = (method, params = {}) => {
    const id = ++n;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, mal) => pendientes.set(id, { ok, mal }));
  };

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: ancho,
    height: alto,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const evaluar = async (expr) => {
    const r = await cdp('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description ?? 'error en la página');
    }
    return r.result.value;
  };

  return {
    cdp,
    evaluar,
    ir: async (u, esperaMs = 4500) => {
      await cdp('Page.navigate', { url: u });
      await dormir(esperaMs);
    },
    dormir,
    /** La pantalla entera, ya decodificada a RGBA. */
    captura: async () => leerPng(Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')),
    guardar: async (ruta) => {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(ruta, Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    },
    cerrar: () => {
      ws.close();
      chrome.kill();
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  LA MEDIDA
// ─────────────────────────────────────────────────────────────────────────────

const clave = ({ r, g, b }) => (r << 16) | (g << 8) | b;
const desdeClave = (k) => ({ r: (k >> 16) & 255, g: (k >> 8) & 255, b: k & 255 });

/** Cuenta los colores de un rectángulo de la captura. */
export function censoDe(png, { x, y, w, h }) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(png.ancho, Math.round(x + w));
  const y1 = Math.min(png.alto, Math.round(y + h));
  if (x1 <= x0 || y1 <= y0) {
    throw new Error('el recorte cae FUERA DEL VIEWPORT: no hay píxeles que mirar');
  }
  const cuenta = new Map();
  for (let fy = y0; fy < y1; fy++) {
    for (let fx = x0; fx < x1; fx++) {
      const o = (fy * png.ancho + fx) * 4;
      const k = (png.datos[o] << 16) | (png.datos[o + 1] << 8) | png.datos[o + 2];
      cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
    }
  }
  return cuenta;
}

/**
 * ⭐ EL CONTRASTE REAL DE UN ELEMENTO, mirando lo que hay pintado.
 *
 * `fondo` es la moda; `texto` es el más lejano en luminancia que aparezca al
 * menos `minimo` veces. Ese suelo de 3 píxeles es lo que impide que mande un
 * píxel suelto del suavizado de los bordes.
 */
export async function contrasteReal(mando, selector, { minimo = 3, indice = 0 } = {}) {
  // ⚠️ El elemento se busca por SELECTOR + ÍNDICE, no con `:nth-of-type`: ése
  //    cuenta hermanos POR ETIQUETA, así que `.chip-linea:nth-of-type(2)` no es
  //    «el segundo chip» sino «el segundo <span> que además es un chip». Con
  //    cinco chips repartidos entre la leyenda y los pasos no coincide ninguno.
  const buscar = `document.querySelectorAll(${JSON.stringify(selector)})[${indice}]`;
  const caja = await mando.evaluar(`(() => {
    const e = ${buscar};
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const c = e.getBoundingClientRect();
    return { x: c.x, y: c.y, w: c.width, h: c.height, texto: e.textContent.trim() };
  })()`);
  if (!caja) throw new Error(`"${selector}"[${indice}] no está en la página`);
  await mando.dormir(120);
  const caja2 = await mando.evaluar(`(() => {
    const c = ${buscar}.getBoundingClientRect();
    return { x: c.x, y: c.y, w: c.width, h: c.height };
  })()`);

  const png = await mando.captura();
  const cuenta = censoDe(png, caja2);
  const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
  const fondo = desdeClave(orden[0][0]);
  const lf = luminancia(fondo);

  /**
   * ⚠️ ¿ESTE TEXTO LLEVA HALO? Porque entonces la pregunta es OTRA, y esto se
   *    descubrió midiendo (1/09, `docs/BITACORA.md`).
   *
   *    Sin halo hay dos colores —texto y fondo— y el par que WCAG mide es ése.
   *    **Con halo hay tres**, y el fondo adyacente al relleno ya no es el color
   *    del chip: es el halo. Un número blanco con trazo negro sobre un verde
   *    medio se mide **blanco contra negro**, no blanco contra verde — y este
   *    instrumento, con el criterio de «el más lejano en luminancia», elegía
   *    siempre el blanco (que está más lejos del verde que el negro) y devolvía
   *    el contraste que precisamente el halo viene a arreglar.
   *
   *    Se pregunta a la PÁGINA si hay trazo, no se adivina por los píxeles.
   */
  const conHalo = await mando.evaluar(`(() => {
    const s = getComputedStyle(${buscar});
    return parseFloat(s.webkitTextStrokeWidth || '0') > 0;
  })()`);

  const frecuentes = orden.filter(([, veces]) => veces >= minimo).map(([k]) => desdeClave(k));
  let texto = fondo;
  if (conHalo) {
    // El relleno es el más CLARO y el halo el más OSCURO de los que se ven.
    const porLuz = [...frecuentes].sort((a, b) => luminancia(a) - luminancia(b));
    const claro = porLuz[porLuz.length - 1];
    const oscuro = porLuz[0];
    return {
      etiqueta: caja.texto,
      conHalo,
      fondo: oscuro,
      texto: claro,
      contraste: contrasteRgb(claro, oscuro),
      pixeles: [...cuenta.values()].reduce((a, b) => a + b, 0),
    };
  }
  let peor = -1;
  for (const c of frecuentes) {
    const d = Math.abs(luminancia(c) - lf);
    if (d > peor) {
      peor = d;
      texto = c;
    }
  }
  return {
    etiqueta: caja.texto,
    conHalo,
    fondo,
    texto,
    contraste: contrasteRgb(fondo, texto),
    pixeles: [...cuenta.values()].reduce((a, b) => a + b, 0),
  };
}
