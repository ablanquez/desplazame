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
import { readFileSync } from 'node:fs';
import { abrirChrome, censoDe, contrasteReal, contrasteRgb, deHex, AA_TEXTO, AA_GRAFICO } from './medir.mjs';

const APP = 'http://localhost:4200/';
/**
 * ⚠️ LOS DOS EXTREMOS DEL PLANO, no «la tierra».
 *
 * Censados del teselado real (ver `src/app/contraste.ts`): la tierra `#f2efe9`
 * es solo el 17,5 % de lo que hay debajo de una traza, y [WCAG 1.4.11] los 3:1
 * son contra los colores **adyacentes**. Medir contra un solo fondo aprueba
 * líneas que no se ven sobre la carretera que pisan — la 21 daba 3,02:1 contra
 * la tierra y 1,96:1 contra la primaria naranja.
 */
const PLANO_CLARO = 'ffffff';
const PLANO_OSCURO = 'f9b29c';

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
  // El modo, por argumento: la juez de los huecos necesita un paseo largo, y el
  // más largo lo da una ruta a pie entera.
  const modo = process.argv[7] ?? 'bus';
  // ⭐ DOS FILAS DESDE EL 2/09 (punto 11): la primera pregunta la FAMILIA y la
  //    segunda, solo con Bici, cuál de las dos. Así que elegir `bizi` son dos
  //    clics, y el segundo solo existe después del primero — la fila se revela,
  //    no está apagada. Se pulsa como pulsaría una persona.
  const familia = modo === 'bizi' ? 'bici' : modo;
  await m.evaluar(`document.querySelector('input[name=familia][value=${familia}]').click()`);
  await m.dormir(300);
  if (familia === 'bici') {
    await m.evaluar(`document.querySelector('input[name=bici][value=${modo}]').click()`);
    await m.dormir(300);
  }
  await m.evaluar(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`);
  await m.dormir(16000);

  // ── JUEZ 5 · NI UN CARÁCTER DE REEMPLAZO EN TODA LA PANTALLA ─────────────
  //
  // ⭐ El caso del ojo del 1/09: «Plaza Arag��n». Un U+FFFD es lo que un
  //    decodificador escribe cuando se le rompe una secuencia, así que buscarlo
  //    en el DOM entero es preguntar «¿se ha roto algún texto por el camino?»
  //    sin tener que saber de antemano cuál. Cuesta una línea y cubre todo.
  const rotos = await m.evaluar(`(() => {
    const t = document.body.innerText;
    const sitios = [];
    for (const li of document.querySelectorAll('.paso, .aviso-ruta, .ruta__punto, .chip-linea')) {
      if (li.textContent.includes('\\uFFFD')) sitios.push(li.textContent.replace(/\\s+/g, ' ').trim().slice(0, 90));
    }
    return { cuantos: (t.match(/\\uFFFD/g) ?? []).length, sitios };
  })()`);
  juez(
    '5 · ni un carácter de reemplazo en la narración',
    rotos.cuantos === 0,
    rotos.cuantos ? `${rotos.cuantos} · ${rotos.sitios.join(' | ')}` : 'ninguno',
  );

  // ── JUEZ 3 · NINGÚN POSTE NOMBRADO SIN SU NÚMERO ─────────────────────────
  //
  // ⭐ [Referencia GTFS, `stop_code`] el número es el de la señal, y por eso se
  //    enseña. Si apareciera unas veces sí y otras no, quien lo busca en la
  //    marquesina no sabría si es que no existe o es que no se lo han dicho.
  //    Se busca en el DOM entero: los pasos, los avisos y sus detalles.
  const sinNumero = await m.evaluar(`(() => {
    const malos = [];
    for (const e of document.querySelectorAll('.paso__texto, .aviso-ruta, .detalles__cuerpo')) {
      const t = e.textContent.replace(/\s+/g, ' ');
      // Cada mención de «poste X» tiene que llevar «poste N · …».
      for (const m of t.matchAll(/poste ([^,.·]{0,40})/g)) {
        if (!/^\d/.test(m[1].trim())) malos.push(m[0].trim().slice(0, 60));
      }
    }
    return malos;
  })()`);
  juez(
    '3 · ningún poste se nombra sin su número',
    sinNumero.length === 0,
    sinNumero.length ? sinNumero.join(' | ') : 'todos con número',
  );

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
  // ⚠️ Con CERO chips esta juez sería vacuamente cierta: «todos» de un conjunto
  //    vacío se cumple siempre. Se exige que haya alguno, o se dice que no aplica.
  if (cuantos === 0) {
    console.log('  ⓘ  este viaje no ha salido en bus: la juez de los chips no aplica');
  } else {
    juez('1+2 · todo chip de la pantalla ≥ 4,5:1 medido en el píxel', flojos.length === 0, flojos.join(' · '));
  }

  // ── JUEZ 1 COMPLETA · LAS 53 LÍNEAS DEL FEED, EN EL PÍXEL ────────────────
  //
  // ⚠️ Un viaje enseña dos o tres chips, no 53. Así que los 53 se miden
  //    **CLONANDO un chip de verdad de la página** y cambiándole el fondo: el
  //    clon hereda el atributo de encapsulado de Angular, así que le aplica el
  //    CSS REAL del producto —el mismo contorno, el mismo cuerpo, el mismo
  //    suavizado—. Lo único que se pone desde fuera es el color del feed, que es
  //    justo lo que varía entre líneas.
  //
  //    Lo que esto NO es: una pantalla del producto con 53 chips, que no existe.
  //    Lo que SÍ es: el estilo del producto sometido a los 53 colores reales.
  const cocinado = JSON.parse(
    readFileSync(new URL('../data/nap_gtfs-ficha1176.cocinado.json', import.meta.url), 'utf-8'),
  ).lineas;
  console.log(`\n  las ${cocinado.length} líneas del feed, con el CSS del chip real:`);
  // ⚠️ Sin un chip de verdad en la página no hay CSS real que clonar, y montar
  //    uno a mano mediría un estilo inventado. Se dice y se sigue.
  if (!(await m.evaluar(`document.querySelector('.chip-linea') !== null`))) {
    console.log('  ⓘ  no hay ningún chip en pantalla del que clonar: esta juez no aplica');
  } else {
  await m.evaluar(`(() => {
    const modelo = document.querySelector('.chip-linea');
    const banco = document.createElement('div');
    banco.id = 'banco';
    banco.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;padding:4px';
    document.body.appendChild(banco);
    window.__ponChip = (corto, fondo, texto, contorno) => {
      banco.innerHTML = '';
      const c = modelo.cloneNode(true);
      c.textContent = corto;
      c.style.backgroundColor = '#' + fondo;
      c.style.color = '#' + texto;
      c.classList.toggle('chip-linea--contorno', contorno);
      c.className = c.className + ' medido';
      banco.appendChild(c);
    };
  })()`);

  const NOCHE = '1C1A42';
  const malos = [];
  for (const l of cocinado) {
    const buho = /^N/i.test(l.corto);
    const fondo = buho ? NOCHE : l.color;
    const texto = buho ? l.color : 'FFFFFF';
    await m.evaluar(`window.__ponChip(${JSON.stringify(l.corto)}, ${JSON.stringify(fondo)}, ${JSON.stringify(texto)}, ${!buho})`);
    await m.dormir(60);
    const r = await contrasteReal(m, '.medido');
    if (r.contraste < AA_TEXTO) malos.push(`${l.corto} a ${r.contraste.toFixed(2)}:1`);
  }
  await m.evaluar(`document.querySelector('#banco')?.remove()`);
  juez(
    `1 · las ${cocinado.length} líneas del feed ≥ 4,5:1 con el CSS real, medidas en el píxel`,
    malos.length === 0,
    malos.length ? malos.join(' · ') : 'ninguna por debajo',
  );
  }

  // ── JUEZ 3 · LAS LÍNEAS DEL MAPA, contra la tierra de OSM ─────────────────
  const lineas = await m.evaluar(`[...document.querySelectorAll('path.leaflet-interactive')].map((p) => ({
    color: p.getAttribute('stroke'), grosor: p.getAttribute('stroke-width'), dash: p.getAttribute('stroke-dasharray'),
  }))`);
  console.log(`\n  polilíneas en el mapa: ${lineas.length}`);
  /** Lo que un color se separa del plano, en su caso más desfavorable. */
  const sobreElPlano = (hex) =>
    Math.min(
      contrasteRgb(deHex(hex), deHex(PLANO_CLARO)),
      contrasteRgb(deHex(hex), deHex(PLANO_OSCURO)),
    );
  const debiles = [];
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    // ⚠️ Con halo, lo que se mide NO es la línea contra el plano: es la LÍNEA
    //    contra el halo [WCAG: «un halo puede usarse como fondo»]. Y quién es el
    //    halo de quién se lee del propio SVG: el ribete es la polilínea
    //    inmediatamente anterior, más ancha y con el mismo trazo.
    const previa = lineas[i - 1];
    const suHalo =
      previa && Number(previa.grosor) > Number(l.grosor) && previa.dash === l.dash ? previa : null;
    const esRibete =
      lineas[i + 1] && Number(l.grosor) > Number(lineas[i + 1].grosor) && lineas[i + 1].dash === l.dash;
    if (esRibete) {
      // Un ribete no se juzga solo: se juzga con su línea, en la vuelta siguiente.
      console.log(`    ${l.color} grosor ${l.grosor} · es el ribete del siguiente`);
      continue;
    }
    // ⚠️ Y SIN HALO se mide contra el PLANO ENTERO, no contra la tierra: ese era
    //    el fallo que dejó a la 21 sin ribete, y el instrumento lo repetía.
    const c = suHalo ? contrasteRgb(deHex(l.color), deHex(suHalo.color)) : sobreElPlano(l.color);
    const donde = suHalo ? `su ribete ${suHalo.color}` : 'el peor color del plano';
    console.log(`    ${l.color} grosor ${l.grosor}${l.dash ? ' dash ' + l.dash : ''} → ${c.toFixed(2)}:1 contra ${donde}`);
    if (c < AA_GRAFICO) debiles.push(`${l.color} a ${c.toFixed(2)}:1 contra ${donde}`);
    // Y el par se separa del plano: lo aporta el ribete, o la propia línea.
    const delPar = Math.max(suHalo ? sobreElPlano(suHalo.color) : 0, sobreElPlano(l.color));
    if (delPar < AA_GRAFICO) debiles.push(`el par de ${l.color} a ${delPar.toFixed(2)}:1 sobre el plano`);
  }
  juez(
    '3 · toda línea ≥ 3:1 contra su vecino, y el par sobre el plano',
    debiles.length === 0,
    debiles.join(' · '),
  );

  // ── JUEZ 3b · LOS HUECOS SIGUEN SIENDO HUECOS ────────────────────────────
  //
  // ⭐ El casing del a-pie es discontinuo con el mismo patrón, y esto lo compra
  //    donde de verdad importa: en el píxel. Se recorre la caja de la polilínea
  //    del a-pie y se cuenta cuánto plano se ve entre guiones. Un casing sólido
  //    los habría rellenado de negro y aquí saldría cero.
  // ⚠️ **NO por la caja del `<path>`**: `getBoundingClientRect()` de un path de
  //    Leaflet devuelve una caja degenerada —medida: 1 píxel—, y sobre un píxel
  //    cualquier porcentaje se cumple. Se recorre **el trazo**, con
  //    `getPointAtLength` y el CTM, que da la coordenada de pantalla exacta.
  const puntos = await m.evaluar(`(() => {
    // ⚠️ EL MÁS LARGO de los tramos a pie, no el primero. El primero suele ser
    //    el paseo hasta el poste —30 m, que al zoom de la ruta es **1 píxel**—, y
    //    sobre un píxel cualquier porcentaje se cumple. Lo cazó la juez de al
    //    lado al pedir que hubiera ámbar: sin ella, 3b daba verde sobre 2 píxeles.
    const candidatos = [...document.querySelectorAll('path.leaflet-interactive')]
      .filter((x) => x.getAttribute('stroke') === '#b45309');
    const p = candidatos.sort((a, b) => b.getTotalLength() - a.getTotalLength())[0];
    if (!p || p.getTotalLength() < 40) return null;
    const ctm = p.getScreenCTM();
    const largo = p.getTotalLength();
    const salida = [];
    for (let d = 0; d <= largo; d += 1) {
      const q = p.getPointAtLength(d).matrixTransform(ctm);
      salida.push([Math.round(q.x), Math.round(q.y)]);
    }
    return { largo, puntos: salida };
  })()`);
  if (puntos === null) {
    console.log('\n  ⓘ  este viaje no trae tramo a pie: la juez de los huecos no aplica');
  } else {
    const png = await m.captura();
    const enHex = ([x, y]) => {
      const o = (y * png.ancho + x) * 4;
      return [png.datos[o], png.datos[o + 1], png.datos[o + 2]]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('');
    };
    const cuenta = { ambar: 0, ribete: 0, plano: 0 };
    for (const q of puntos.puntos) {
      const hex = enHex(q);
      if (hex === 'b45309') cuenta.ambar++;
      else if (hex === '000000') cuenta.ribete++;
      else cuenta.plano++;
    }
    const total = puntos.puntos.length;
    console.log(
      `\n  el trazo del a-pie: ${Math.round(puntos.largo)} px de largo · ámbar ${cuenta.ambar} · ribete ${cuenta.ribete} · plano ${cuenta.plano}`,
    );
    // ⭐ Con `10 8`, 8 de cada 18 píxeles del recorrido caen en un hueco: un 44 %
    //    en el ideal. Se pide bastante menos —el suavizado de los extremos come
    //    algo— pero lo suficiente para que un casing sólido, que daría 0, muerda.
    juez(
      '3b · entre los guiones del a-pie se sigue viendo el plano',
      cuenta.plano > total * 0.25,
      `${((100 * cuenta.plano) / total).toFixed(0)} % del recorrido es hueco (patrón 10 8 → 44 % ideal)`,
    );
    juez('3b-bis · y el ámbar sigue estando en el trazo', cuenta.ambar > total * 0.25, `${cuenta.ambar} px de ámbar`);
  }

  await m.guardar(process.argv[6] ?? 'contraste.png');
} finally {
  m.cerrar();
}

console.log(`\n  ${pasadas} en verde · ${fallos} en rojo`);
process.exitCode = fallos > 0 ? 1 : 0;
