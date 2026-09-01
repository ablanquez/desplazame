/**
 * ⭐ LAS JUECES QUE MIRAN LA PANTALLA DE VERDAD. Miden el PÍXEL, no el CSS.
 *
 * Se lanzan a mano —`node app/e2e/pantalla.mjs`— con el motor en 3000 y la
 * pantalla en 4200, porque necesitan un Chrome y una red viva. No entran en
 * `npm run probar` por eso mismo: una prueba que depende de que Avanza conteste
 * no es una prueba de la muralla, es una medición.
 *
 * ⚠️ **Y aquí no vale `getComputedStyle`.** El instrumento de ZetaBus lo aprendió
 *    a base de aprobar un texto invisible; el nuestro lo comprueba antes de medir
 *    nada, en la primera juez de este fichero.
 */
import { abrirChrome, contrasteReal, contrasteRgb, deHex, luminancia, AA_TEXTO, AA_GRAFICO } from './medir.mjs';

const APP = 'http://localhost:4200/';
/** La tierra de OpenStreetMap, sobre la que se pinta casi toda ruta. */
const TIERRA = 'f2efe9';

let fallos = 0;
let pasadas = 0;
const juez = (nombre, cond, detalle = '') => {
  if (cond) {
    pasadas++;
    console.log(`  OK   ${nombre}${detalle ? ' · ' + detalle : ''}`);
  } else {
    fallos++;
    console.log(`  MAL  ${nombre}${detalle ? ' · ' + detalle : ''}`);
  }
};

const m = await abrirChrome({ puerto: 9351 });

try {
  // ══ JUEZ 0 · EL INSTRUMENTO, ANTES QUE NADA ═══════════════════════════════
  //
  // ⭐ La contraprueba de ZetaBus, en su propio terreno: un texto negro a
  //    `opacity: 0.18` sobre blanco. `getComputedStyle().color` devuelve
  //    `rgb(0,0,0)` → **21:1, aprobado**, y en pantalla no se ve nada. El píxel
  //    dice la verdad. Si esta juez fallara, todas las demás valdrían cero.
  await m.ir('about:blank', 200);
  await m.evaluar(`document.body.innerHTML =
    '<div style="background:#fff;padding:40px"><span id="fantasma" style="color:#000;opacity:0.18;font-size:40px;font-weight:700">FANTASMA</span></div>';
   document.body.style.margin = '0';`);
  await m.dormir(300);
  const porElCss = await m.evaluar(`(() => {
    const s = getComputedStyle(document.querySelector('#fantasma'));
    return { color: s.color, opacidad: s.opacity };
  })()`);
  const cssDice = contrasteRgb({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  const elPixel = await contrasteReal(m, '#fantasma');
  juez(
    '0 · el CSS aprueba un texto invisible; el píxel no',
    cssDice > 20 && elPixel.contraste < AA_TEXTO,
    `getComputedStyle dice ${porElCss.color} → ${cssDice.toFixed(2)}:1 · el píxel dice ${elPixel.contraste.toFixed(2)}:1`,
  );

  // Y la fórmula del instrumento es la misma que la de la pantalla: blanco
  // contra negro son 21:1 exactos, y el gris medio empata.
  juez(
    '0b · la fórmula: blanco/negro = 21:1',
    Math.abs(contrasteRgb(deHex('ffffff'), deHex('000000')) - 21) < 1e-9,
    `${contrasteRgb(deHex('ffffff'), deHex('000000')).toFixed(4)}:1`,
  );

  // ══ LA PANTALLA ═══════════════════════════════════════════════════════════
  await m.ir(APP, 5000);

  const escribir = async (i, texto) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await m.dormir(900);
  };
  const elegir = async (i, exacto) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via')[${i}];
      const ops = [...c.querySelectorAll('[role=option]')];
      const o = ops.find(x => x.textContent.trim().toUpperCase() === ${JSON.stringify(String(exacto ?? '').toUpperCase())}) ?? ops[0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    await m.dormir(700);
  };
  const portal = async (i, num) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal input')[${i}]; if (!c) return;
      c.focus();
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await m.dormir(600);
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal')[${i}]; if (!c) return;
      const ops = [...c.querySelectorAll('[role=option]')];
      const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    await m.dormir(500);
  };

  const viaje = process.argv[2] ?? 'COLOSO';
  await escribir(0, viaje);
  await elegir(0);
  await portal(0, process.argv[3] ?? '2');
  await escribir(1, process.argv[4] ?? 'CALLE OVIEDO');
  await elegir(1, process.argv[4] ?? 'CALLE OVIEDO');
  await portal(1, process.argv[5] ?? '5');
  await m.evaluar(`document.querySelector('input[name=modo][value=bus]').click()`);
  await m.dormir(300);
  await m.evaluar(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`);
  await m.dormir(16000);

  // ── JUEZ 1 y 2 · TODOS LOS CHIPS DE LA PANTALLA, EN EL PÍXEL ──────────────
  const cuantos = await m.evaluar(`document.querySelectorAll('.chip-linea').length`);
  console.log(`\n  chips en pantalla: ${cuantos}`);
  const flojos = [];
  for (let i = 0; i < cuantos; i++) {
    const r = await contrasteReal(m, '.chip-linea', { indice: i });
    const linea = r.etiqueta;
    console.log(
      `    [${linea}] fondo rgb(${r.fondo.r},${r.fondo.g},${r.fondo.b}) · número rgb(${r.texto.r},${r.texto.g},${r.texto.b}) → ${r.contraste.toFixed(2)}:1`,
    );
    if (r.contraste < AA_TEXTO) flojos.push(`${linea} a ${r.contraste.toFixed(2)}:1`);
  }
  juez('1+2 · todo chip de la pantalla ≥ 4,5:1 medido en el píxel', flojos.length === 0, flojos.join(' · '));

  // ── JUEZ 3 · LAS LÍNEAS DEL MAPA, contra la tierra de OSM ─────────────────
  const lineas = await m.evaluar(`[...document.querySelectorAll('path.leaflet-interactive')].map((p) => ({
    color: p.getAttribute('stroke'), grosor: p.getAttribute('stroke-width'), dash: p.getAttribute('stroke-dasharray'),
  }))`);
  console.log(`\n  polilíneas en el mapa: ${lineas.length}`);
  const tierra = deHex(TIERRA);
  const debiles = [];
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    // ⚠️ Con halo, lo que se mide NO es la línea contra el plano: es el HALO
    //    contra el plano y la LÍNEA contra el halo [WCAG: «un halo puede usarse
    //    como fondo»]. Y quién es el halo de quién se lee del propio SVG: el
    //    ribete es la polilínea inmediatamente anterior y más ancha.
    const previa = lineas[i - 1];
    const suHalo =
      previa && Number(previa.grosor) > Number(l.grosor) && previa.dash === l.dash ? previa : null;
    const contra = suHalo ? deHex(suHalo.color) : tierra;
    const c = contrasteRgb(deHex(l.color), contra);
    const donde = suHalo ? `su ribete ${suHalo.color}` : 'la tierra';
    console.log(`    ${l.color} grosor ${l.grosor}${l.dash ? ' dash ' + l.dash : ''} → ${c.toFixed(2)}:1 contra ${donde}`);
    if (c < AA_GRAFICO) debiles.push(`${l.color} a ${c.toFixed(2)}:1 contra ${donde}`);
    // Y si es un ribete, tiene que verse él sobre el plano.
    const esRibete = lineas[i + 1] && Number(l.grosor) > Number(lineas[i + 1].grosor) && lineas[i + 1].dash === l.dash;
    if (esRibete) {
      const cr = contrasteRgb(deHex(l.color), tierra);
      if (cr < AA_GRAFICO) debiles.push(`el ribete ${l.color} a ${cr.toFixed(2)}:1 sobre la tierra`);
    }
  }
  juez('3 · toda línea ≥ 3:1 contra lo que tiene detrás (su ribete o la tierra)', debiles.length === 0, debiles.join(' · '));

  await m.guardar(process.argv[6] ?? 'contraste.png');
} finally {
  m.cerrar();
}

console.log(`\n  ${pasadas} en verde · ${fallos} en rojo`);
process.exitCode = fallos > 0 ? 1 : 0;
