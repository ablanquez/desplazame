/**
 * ⭐ LA PINTURA DEL BUSCADOR, MEDIDA EN CHROME (10/09, punto 15 · tanda 4).
 *
 * Tres cosas que jsdom **no puede** juzgar y que aquí se miden sobre lo pintado:
 *
 * · **El pin, por el APARATO y no por el ancho.** Emular el aparato es la única
 *   forma de preguntarle al navegador «¿y si el puntero fuera grueso?» sin
 *   tener un móvil delante — y **no vale `setEmulatedMedia`**, que acepta
 *   `hover`/`pointer` y no hace nada: ver la nota de P1/P2.
 * · **El permiso, solo tras el gesto.** Se espía `getCurrentPosition` desde
 *   ANTES de que la página exista, y se cuenta cuántas veces se llamó al cargar
 *   —tiene que ser cero— y cuántas al pulsar.
 * · **Los tokens de cada chip.** jsdom no resuelve `var()` (medido el 9/09), así
 *   que si el chip activo se pinta de su `-solid` solo se sabe aquí.
 *
 * Se lanza con el motor sirviendo el dist:
 *     node e2e/pintura.mjs http://localhost:3111 <carpeta-de-capturas>
 */
import { readFileSync } from 'node:fs';
import { abrirChrome, terceros, contrasteReal, contrasteRgb, luminancia, AA_GRAFICO, AA_TEXTO } from './medir.mjs';

const APP = (process.argv[2] ?? 'http://localhost:4200').replace(/\/+$/, '') + '/';
const CAPTURAS = (process.argv[3] ?? '.').replace(/[\\/]+$/, '');

let fallos = 0;
const juzgar = (bien, titulo, detalle = '') => {
  if (!bien) fallos++;
  console.log(`  ${bien ? 'OK ' : '✗✗ '} ${titulo}${detalle ? '  ·  ' + detalle : ''}`);
};
/**
 * ⭐ EL SUELO DE LA BANDA — FIJADO (11/09), y la jueza pasó a verde sin tocarle
 * la vara: lo que cambió fue el color, que es como tenía que ser.
 *
 * ⚠️ **Estuvo en rojo a propósito durante un día.** La banda se calcó de la
 *    maqueta —`muted` al 30 %— y medida resultó invisible: **2 puntos de 255**
 *    de separación con la superficie. Antonio la rechazó con las capturas
 *    delante y fijó el par B de la escala slate.
 *
 * 29 es **el valor elegido**, no un mínimo cómodo: `slate-200` sobre el blanco
 * de la tarjeta. Si alguien aclara la banda un paso, esto muerde. Lo que compra
 * no es el color: es que la banda se vea SIN el ratón encima, que es lo que el
 * hover no puede sustituir [NN/g, acordeones].
 *
 * ℹ️ El oscuro de la BANDA no se mide aquí: el producto va clavado en claro
 *    —`<html data-theme="light">`— y su suelo, 21, vive en el censo de
 *    `/identidad`. Aquí ponía «el oscuro no se mide aquí» a secas, y desde la
 *    tanda 6 (15/09) sí se mide: el RESULTADO entero en oscuro es la P25, que
 *    pone el tema por el atributo y lo comprueba antes de medir.
 */
const MINIMO_DE_SEPARACION = 29;

/** Un {r,g,b} de `contrasteReal`, en texto legible para el acta. */
const enRgb = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;

const leer = (m, expr) => m.evaluar(`JSON.stringify((() => { ${expr} })())`).then(JSON.parse);

/**
 * ⭐ EL TRAZADO TAL Y COMO LLEGÓ, leído del fichero descargado.
 *
 * Sirve para preguntarle a la pantalla si el icono que pinta es EL MISMO que
 * el `.svg` que tiene su sha256 en `app/simbolos/PROCEDENCIA.md`. Copiar el
 * trazado aquí sería guardar el mismo dato dos veces y que las dos copias se
 * separen el día que alguien redibuje una a mano.
 */
/**
 * ⭐ `contrasteReal`, PERO SIN TIRAR EL FICHERO cuando el elemento no está.
 *
 * ⚠️ Esto es la lección de la L4 del 11/09: el lector del asa reventó con
 *    `getComputedStyle: parameter 1 is not of type 'Element'` en cuanto su
 *    sujeto dejó de existir, y se llevó por delante TODAS las juezas que venían
 *    detrás — que estaban bien. Una jueza que no encuentra a quien mide tiene
 *    que dar ROJO y dejar correr a las demás, no cortar la sesión.
 */
const contrasteSiEsta = async (m, selector, opciones = {}) => {
  const hay = await m.evaluar(
    `document.querySelectorAll(${JSON.stringify(selector)}).length > ${opciones.indice ?? 0}`,
  );
  return hay ? contrasteReal(m, selector, opciones) : null;
};

const trazadoDelFichero = (nombre) =>
  /\sd="([^"]+)"/.exec(
    readFileSync(new URL(`../simbolos/${nombre}.svg`, import.meta.url), 'utf8'),
  )?.[1] ?? '(el fichero no tiene trazado)';

/** Los seis chips: color, tamaño, y cuánto ocupa su palabra AHORA MISMO. */
const LOS_CHIPS = `
  const raiz = getComputedStyle(document.documentElement);
  const tono = (modo, v) => raiz.getPropertyValue('--mode-' + modo + '-' + v).trim();
  const aRgb = (hex) => {
    const h = hex.replace('#', '');
    return 'rgb(' + parseInt(h.slice(0,2),16) + ', ' + parseInt(h.slice(2,4),16) + ', ' + parseInt(h.slice(4,6),16) + ')';
  };
  return [...document.querySelectorAll('.familias .modo--chip')].map((c) => {
    const s = getComputedStyle(c);
    const modo = c.getAttribute('data-modo');
    const activo = c.classList.contains('modo--activo');
    const r = c.getBoundingClientRect();
    return {
      modo, activo,
      fondo: s.backgroundColor,
      tinta: s.color,
      esperadoFondo: aRgb(tono(modo, activo ? 'solid' : 'soft')),
      esperadaTinta: aRgb(tono(modo, activo ? 'text' : 'strong')),
      alto: Math.round(r.height),
      ancho: Math.round(r.width),
      radio: s.borderTopLeftRadius,
      conDibujo: !!c.querySelector('svg path'),
      anchoTexto: Math.round(c.querySelector('.modo__texto')?.getBoundingClientRect().width ?? 0),
      nombre: c.querySelector('.modo__radio')?.getAttribute('aria-label') ?? '',
    };
  });
`;

/** Qué se ve del pin: cuántos hay pintados y con qué caja. */
const ESTADO_DEL_PIN = `
  const pines = [...document.querySelectorAll('.ubicacion')];
  const pintados = pines.filter((p) => {
    const c = getComputedStyle(p);
    const r = p.getBoundingClientRect();
    return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  });
  const uno = pintados[0]?.getBoundingClientRect();
  return {
    enElDom: pines.length,
    pintados: pintados.length,
    lado: uno ? [Math.round(uno.width), Math.round(uno.height)] : null,
    display: pines[0] ? getComputedStyle(pines[0]).display : null,
  };
`;

// ═══════════ P1 y P2 · EL PIN, POR EL APARATO ═══════════
//
// ⚠️ **EL MECANISMO NO ES `setEmulatedMedia`, Y ESO SE MIDIÓ.** La primera
//    versión de esta jueza emulaba `hover`/`pointer` por `features`, que es lo
//    que uno escribiría: Chrome **lo acepta y no hace nada** — medido,
//    `matchMedia('(pointer: coarse)')` seguía diciendo `false`. Lo que sí
//    cambia el par de MQ4 es la emulación de aparato:
//    `Emulation.setTouchEmulationEnabled` + `setDeviceMetricsOverride` con
//    `mobile: true`. Comprobado en las dos direcciones:
//        táctil → { coarse: true,  noHover: true,  pin: 'flex' }
//        ratón  → { coarse: false, noHover: false, pin: 'none' }
//
// ⚠️ Y LA MITAD DE ESCRITORIO DABA VERDE POR LA RAZÓN EQUIVOCADA. Con la
//    emulación sin efecto, el pin estaba oculto porque el navegador seguía
//    siendo un PC — no porque la regla funcionara. **La jueza se salvó por
//    estar escrita EN PAREJA**: la mitad táctil, que exige verlo, es la que
//    delató que el mando no llegaba. Una sola de las dos habría aprobado un
//    mecanismo muerto.
for (const [nombre, tactil, seVe] of [
  ['ESCRITORIO (hover: hover · pointer: fine)', false, false],
  ['TÁCTIL (hover: none · pointer: coarse)', true, true],
]) {
  // ⚠️ La ventana ANCHA en las dos, y el táctil se emula aparte: si esta jueza
  //    midiera estrechando, estaría comprobando lo que NO queremos —que el pin
  //    dependa del hueco— y daría verde con la regla escrita al revés.
  const m = await abrirChrome({ ancho: 1280, alto: 900, puerto: 9401 + (seVe ? 1 : 0) });
  try {
    if (tactil) {
      await m.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await m.cdp('Emulation.setDeviceMetricsOverride', {
        width: 1280, height: 900, deviceScaleFactor: 1, mobile: true,
      });
    }
    await m.ir(APP, 6000);
    console.log(`\n═══ ${nombre} ═══`);

    // ⭐ Y SE COMPRUEBA QUE EL MANDO LLEGÓ, antes de juzgar nada con él. Es la
    //    lección de arriba convertida en línea: una emulación que no aplica
    //    convierte a la jueza en un espejo.
    const mq = await leer(
      m,
      `return { par: matchMedia('(hover: none) and (pointer: coarse)').matches };`,
    );
    juzgar(
      mq.par === tactil,
      'P0 · la emulación de puntero ha llegado de verdad',
      `(hover: none) and (pointer: coarse) → ${mq.par}, se esperaba ${tactil}`,
    );

    const pin = await leer(m, ESTADO_DEL_PIN);
    juzgar(
      pin.enElDom === 2,
      'P1 · los dos pines siguen en el DOM (uno por lado), pase lo que pase',
      `${pin.enElDom} en el documento`,
    );
    juzgar(
      seVe ? pin.pintados === 2 : pin.pintados === 0,
      `P2 · el pin ${seVe ? 'SE VE' : 'NO se ve'} con este puntero`,
      `${pin.pintados} pintados · display ${pin.display}`,
    );
    if (seVe) {
      // [WCAG 2.5.5] 44 es el suelo del objetivo táctil, y es lo que mide.
      juzgar(
        pin.lado !== null && pin.lado[0] >= 44 && pin.lado[1] >= 44,
        'P2 · y mide al menos 44×44 [WCAG 2.5.5]',
        pin.lado ? `${pin.lado[0]}×${pin.lado[1]}` : 'sin caja',
      );
      await m.guardar(`${CAPTURAS}/pintura-pin-tactil.png`);
    } else {
      await m.guardar(`${CAPTURAS}/pintura-pc.png`);
    }
  } finally {
    m.cerrar();
  }
}

// ═══════════ P3 y P4 · EL PERMISO, SOLO TRAS EL GESTO ═══════════
{
  const m = await abrirChrome({ ancho: 390, alto: 844, puerto: 9403 });
  try {
    // El mismo mecanismo de arriba: el pin solo existe en táctil, así que para
    // poder pulsarlo hay que ser un táctil.
    await m.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await m.cdp('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
    });

    // ⭐ EL ESPÍA VA ANTES DE QUE LA PÁGINA EXISTA. Ponerlo después de cargar
    //    no serviría de nada: la pregunta es justamente si se llamó AL CARGAR.
    await m.cdp('Page.enable');
    await m.cdp('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__vecesQueSePidio = 0;
        const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
        navigator.geolocation.getCurrentPosition = function (...args) {
          window.__vecesQueSePidio++;
          return original(...args);
        };
      `,
    });

    // ⚠️ NADA DE GEOLOCALIZACIÓN REAL EN PRUEBAS. Se concede el permiso y se
    //    fija una posición inventada por CDP: la de la Plaza del Pilar, con un
    //    radio de 10 m para que pase el filtro de precisión de la pantalla.
    await m.cdp('Browser.grantPermissions', { origin: APP.replace(/\/$/, ''), permissions: ['geolocation'] });
    await m.cdp('Emulation.setGeolocationOverride', {
      latitude: 41.656, longitude: -0.8785, accuracy: 10,
    });

    await m.ir(APP, 6000);
    console.log('\n═══ EL PERMISO Y EL GESTO ═══');

    const alCargar = await m.evaluar('window.__vecesQueSePidio');
    juzgar(
      alCargar === 0,
      'P3 · al abrir la página NO se ha pedido la posición ni una vez',
      `${alCargar} llamadas`,
    );

    // Y ahora el gesto: se pulsa el pin del ORIGEN, como pulsaría una mano.
    await m.evaluar(`document.querySelectorAll('.ubicacion')[0].click()`);
    await m.dormir(2500);

    const trasElGesto = await m.evaluar('window.__vecesQueSePidio');
    juzgar(trasElGesto === 1, 'P4 · y al pulsar el pin se pide UNA vez', `${trasElGesto} llamadas`);

    const relleno = await leer(
      m,
      `
      const caja = document.querySelectorAll('app-autocompletar-via input')[0];
      const aviso = document.querySelector('.aviso-ubicacion');
      return { calle: caja ? caja.value : null, aviso: aviso ? aviso.textContent.trim() : null };
    `,
    );
    // ⚠️ Lo que se compra es que el pin LLEGA A ALGO: o rellena el campo o dice
    //    por qué no. Lo que no puede pasar es que se quede callado.
    juzgar(
      (relleno.calle ?? '').length > 0 || (relleno.aviso ?? '').length > 0,
      'P4 · y contesta: o rellena la calle o dice por qué no',
      relleno.calle ? `calle «${relleno.calle}»` : `aviso «${(relleno.aviso ?? '').slice(0, 70)}»`,
    );
    await m.guardar(`${CAPTURAS}/pintura-pin-usado.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P5 · LOS CHIPS, CON SUS TOKENS ═══════════
{
  const m = await abrirChrome({ ancho: 1280, alto: 900, puerto: 9404 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ LOS CHIPS Y SUS TOKENS ═══');

    const chips = await leer(m, LOS_CHIPS);

    juzgar(chips.length === 6, 'P5 · hay seis chips de familia', `${chips.length}`);
    const malPintados = chips.filter(
      (c) => c.fondo !== c.esperadoFondo || c.tinta !== c.esperadaTinta,
    );
    juzgar(
      malPintados.length === 0,
      'P5 · cada chip se pinta con SU familia de tokens (solid/text si activo, soft/strong si no)',
      malPintados.length
        ? malPintados.map((c) => `${c.modo}: ${c.fondo} ≠ ${c.esperadoFondo}`).join(' · ')
        : chips.map((c) => `${c.modo}${c.activo ? '*' : ''}`).join(' '),
    );
    juzgar(
      chips.every((c) => c.conDibujo),
      'P5 · los seis llevan su dibujo',
      chips.filter((c) => !c.conDibujo).map((c) => c.modo).join(' ') || 'los seis',
    );

    // ⭐ SOLO EL ACTIVO ENSEÑA LA PALABRA — el calco, y la desviación de la
    //    tanda 4 retirada. Se mide en píxeles: los plegados miden CERO.
    juzgar(
      chips.every((c) => (c.activo ? c.anchoTexto > 0 : c.anchoTexto === 0)),
      'P5 · solo el chip ACTIVO enseña su palabra; los demás son círculo',
      chips.map((c) => `${c.modo}${c.activo ? '*' : ''}:${c.anchoTexto}px`).join(' · '),
    );

    // Y los plegados siguen teniendo NOMBRE, que es lo que la norma pide.
    juzgar(
      chips.every((c) => c.nombre.length > 0),
      'P5 · y todos conservan su nombre accesible aunque no se lea',
      chips.map((c) => c.nombre).join(' · '),
    );
    juzgar(
      chips.every((c) => c.alto >= 44),
      'P5 · con el alto mínimo de 44 [WCAG 2.5.5]',
      chips.map((c) => c.alto).join(' · '),
    );
    juzgar(
      chips.every((c) => parseFloat(c.radio) >= 20),
      'P5 · y forma de píldora, no de botón',
      chips[0]?.radio ?? 'sin radio',
    );

    // Y una captura por modo, con su subformulario desplegado.
    for (const familia of ['andando', 'bus', 'bici', 'patin', 'moto', 'coche']) {
      await m.evaluar(`document.querySelector('input[name=familia][value=${familia}]').click()`);
      await m.dormir(400);
      await m.guardar(`${CAPTURAS}/pintura-modo-${familia}.png`);
    }

    // Y el pie con los dos botones.
    await m.evaluar(`document.querySelector('.acciones').scrollIntoView()`);
    await m.dormir(300);
    await m.guardar(`${CAPTURAS}/pintura-acciones.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P6 · EL HOVER REVELA LA PALABRA, Y SOLO DONDE HAY HOVER ═══════
//
// ⚠️ Es la mitad que la hoja estática no puede comprar: que la regla esté
//    escrita dentro de `@media (hover: hover)` lo dice `pintura.spec.ts`; que
//    al pasar por encima la palabra APAREZCA —y que en un táctil no— son
//    píxeles, y se miden aquí moviendo el ratón de verdad por CDP.
for (const [mundo, tactil] of [['PC', false], ['TÁCTIL', true]]) {
  const m = await abrirChrome({ ancho: 1280, alto: 900, puerto: 9405 + (tactil ? 1 : 0) });
  try {
    if (tactil) {
      await m.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await m.cdp('Emulation.setDeviceMetricsOverride', {
        width: 1280, height: 900, deviceScaleFactor: 1, mobile: true,
      });
    }
    await m.ir(APP, 6000);
    console.log(`\n═══ EL HOVER DEL CHIP · ${mundo} ═══`);

    // La P0 otra vez: nada se juzga con un mando que no se sabe si llegó.
    const mq = await leer(
      m,
      `return { par: matchMedia('(hover: none) and (pointer: coarse)').matches };`,
    );
    juzgar(mq.par === tactil, `P0 · la emulación ha llegado (${mundo})`, `par → ${mq.par}`);

    const enReposo = await leer(m, LOS_CHIPS);
    await m.guardar(`${CAPTURAS}/chips-${mundo.toLowerCase()}-reposo.png`);

    // ⭐ EL RATÓN, ENCIMA DE UN CHIP QUE NO ESTÁ ELEGIDO. Se mueve de verdad
    //    con `Input.dispatchMouseEvent`: un `:hover` no se puede simular con
    //    JavaScript, y disparar un evento `mouseover` a mano tampoco lo activa.
    const caja = await leer(
      m,
      `
      const c = [...document.querySelectorAll('.familias .modo--chip')]
        .find((x) => !x.classList.contains('modo--activo'));
      const r = c.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
               modo: c.getAttribute('data-modo') };
    `,
    );
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: caja.x, y: caja.y });
    await m.dormir(700);
    const conElRaton = await leer(m, LOS_CHIPS);
    await m.guardar(`${CAPTURAS}/chips-${mundo.toLowerCase()}-hover.png`);

    const antes = enReposo.find((c) => c.modo === caja.modo);
    const ahora = conElRaton.find((c) => c.modo === caja.modo);
    juzgar(
      antes.anchoTexto === 0,
      `P6 · en reposo el chip «${caja.modo}» no enseña palabra`,
      `${antes.anchoTexto} px`,
    );
    juzgar(
      tactil ? ahora.anchoTexto === 0 : ahora.anchoTexto > 0,
      `P6 · con el ratón encima ${tactil ? 'SIGUE sin enseñarla (no hay hover)' : 'la enseña'}`,
      `${antes.anchoTexto} → ${ahora.anchoTexto} px`,
    );

    // ⚠️ Y EL EMPUJÓN A LAS VECINAS, MEDIDO Y DICHO. El chip crece al abrirse,
    //    así que las de su derecha se mueven. Es lo que hace la maqueta —es la
    //    vara—, y se cuenta con número en vez de descubrirse en producción.
    if (!tactil) {
      const derecha = enReposo.filter((c) => c.modo !== caja.modo);
      const movidas = derecha.filter((c, i) => c.ancho !== conElRaton.filter((x) => x.modo !== caja.modo)[i].ancho);
      const creció = ahora.ancho - antes.ancho;
      console.log(
        `     ⚠️ el chip crece ${creció} px al abrirse y empuja a las de su fila` +
          ` (${movidas.length} cambian de ancho ellas mismas: ${movidas.length === 0 ? 'ninguna' : 'ojo'})`,
      );
    }
  } finally {
    m.cerrar();
  }
}

// ═══════════ P7 · LA FILA, EN UNA SOLA LÍNEA — SIEMPRE ═══════════
//
// ⚠️ Ésta es la jueza de la columna a medida, y lo que compra no es el número
//    558: compra **la consecuencia**. Un ancho puede ser correcto y la fila
//    envolver igual —basta que alguien alargue una etiqueta—, así que se mide
//    lo que de verdad importa: que los seis chips comparten la MISMA fila.
//
//    «Misma fila» se mide por la coordenada `y` de cada uno, no por el ancho
//    sumado: si uno bajara, su `y` sería otra. Y se comprueba en TRES estados:
//    en reposo, con el ratón sobre el más largo, y en el PEOR CASO —los dos de
//    etiqueta más larga abiertos a la vez—, que es el que dio el número.
{
  const m = await abrirChrome({ ancho: 1440, alto: 900, puerto: 9407 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ LA FILA EN UNA LÍNEA ═══');

    const filas = `
      const chips = [...document.querySelectorAll('.familias .modo--chip')];
      const ys = chips.map((c) => Math.round(c.getBoundingClientRect().top));
      const izq = chips.map((c) => Math.round(c.getBoundingClientRect().left));
      return {
        lineas: new Set(ys).size,
        anchos: chips.map((c) => Math.round(c.getBoundingClientRect().width)),
        derecha: Math.max(...chips.map((c) => c.getBoundingClientRect().right)),
        borde: document.querySelector('.familias').getBoundingClientRect().right
               - parseFloat(getComputedStyle(document.querySelector('.familias')).paddingRight)
               - parseFloat(getComputedStyle(document.querySelector('.familias')).borderRightWidth),
        desbordaX: document.querySelector('.bloque__cuerpo').scrollWidth
                 > document.querySelector('.bloque__cuerpo').clientWidth + 1,
      };
    `;

    const enReposo = await leer(m, filas);
    juzgar(enReposo.lineas === 1, 'P7 · en reposo, los seis en UNA línea', `${enReposo.lineas} línea(s)`);
    await m.guardar(`${CAPTURAS}/fila-reposo.png`);

    // Con el ratón sobre el más largo — «Bus / Tranvía», medido: 141,23 abierto.
    const largo = await leer(
      m,
      `
      const c = document.querySelector('.familias .modo--chip[data-modo="bus"]');
      const r = c.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    `,
    );
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: largo.x, y: largo.y });
    await m.dormir(700);
    const conHover = await leer(m, filas);
    juzgar(
      conHover.lineas === 1 && !conHover.desbordaX,
      'P7 · con el más largo abierto por el ratón, siguen en UNA línea y sin scroll',
      `${conHover.lineas} línea(s) · anchos ${conHover.anchos.join('+')}`,
    );
    await m.guardar(`${CAPTURAS}/fila-hover-largo.png`);

    // ⭐ EL PEOR CASO: los DOS más largos abiertos a la vez. Se elige «Patín
    //    (VMP)» como activo —133,97— y se deja el ratón sobre «Bus / Tranvía»
    //    —141,23—: es exactamente la suma que dio el ancho de la columna.
    await m.evaluar(`document.querySelector('input[name=familia][value=patin]').click()`);
    await m.dormir(500);
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: largo.x, y: largo.y });
    await m.dormir(700);
    const peorCaso = await leer(m, filas);
    juzgar(
      peorCaso.lineas === 1 && !peorCaso.desbordaX,
      'P7 · ⭐ EL PEOR CASO —los dos más largos abiertos— cabe en UNA línea',
      `${peorCaso.lineas} línea(s) · ${peorCaso.anchos.join('+')} = ` +
        `${peorCaso.anchos.reduce((a, b) => a + b, 0)} + huecos · sobran ` +
        `${Math.round(peorCaso.borde - peorCaso.derecha)} px hasta el borde`,
    );
    await m.guardar(`${CAPTURAS}/fila-peor-caso.png`);

    // ⭐ Y CON EL FOCO, que es el mismo mecanismo [ANTONIO, mejora del remate-bis].
    await m.evaluar(`document.querySelector('.familias .modo--chip[data-modo="bus"] .modo__radio').focus()`);
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
    await m.dormir(700);
    const conFoco = await leer(m, filas);
    const anchoBusFoco = conFoco.anchos[1];
    juzgar(
      anchoBusFoco > 46,
      'P7 · el foco del teclado también revela la etiqueta (mejora declarada)',
      `«Bus / Tranvía» mide ${anchoBusFoco} px con el foco puesto`,
    );
    juzgar(
      conFoco.lineas === 1 && !conFoco.desbordaX,
      'P7 · y con el foco tampoco envuelve',
      `${conFoco.lineas} línea(s)`,
    );
    await m.guardar(`${CAPTURAS}/fila-foco.png`);

    // ═══ (b) y (c): el Tipo entero y el Nº legible ═══
    const campos = await leer(
      m,
      `
      const tipo = document.querySelector('.campo--tipo');
      const tarjeta = document.querySelector('.punto');
      const num = document.querySelector('app-selector-portal input');
      const medir = (e, t) => {
        const s = document.createElement('span');
        s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
        const c = getComputedStyle(e);
        s.style.font = c.font || (c.fontWeight + ' ' + c.fontSize + '/' + c.lineHeight + ' ' + c.fontFamily);
        s.textContent = t;
        document.body.appendChild(s);
        const w = s.getBoundingClientRect().width;
        s.remove();
        return w;
      };
      const dentro = num ? parseFloat(getComputedStyle(num).paddingLeft) + parseFloat(getComputedStyle(num).paddingRight) : 0;
      return {
        anchoTipo: Math.round(tipo.getBoundingClientRect().width),
        anchoUtilTarjeta: Math.round(
          tarjeta.getBoundingClientRect().width
          - parseFloat(getComputedStyle(tarjeta).paddingLeft)
          - parseFloat(getComputedStyle(tarjeta).paddingRight)
          - 2 * parseFloat(getComputedStyle(tarjeta).borderLeftWidth),
        ),
        marcador: num ? num.placeholder : null,
        anchoNum: num ? Math.round(num.getBoundingClientRect().width) : 0,
        anchoTextoNum: num ? Math.round(medir(num, num.placeholder) + dentro) : 0,
      };
    `,
    );
    juzgar(
      campos.anchoTipo >= campos.anchoUtilTarjeta - 1,
      'P8 · [ANTONIO] el «Tipo» ocupa TODO el ancho de su tarjeta',
      `${campos.anchoTipo} de ${campos.anchoUtilTarjeta} útiles`,
    );
    juzgar(
      campos.anchoNum >= campos.anchoTextoNum,
      'P8 · [ANTONIO] y el «Nº» lee su marcador ENTERO, sin entrecortar',
      `«${campos.marcador}» pide ${campos.anchoTextoNum} px y la casilla da ${campos.anchoNum}`,
    );
    await m.guardar(`${CAPTURAS}/campos-tipo-y-numero.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P9 · EL ARRANQUE SIN MODO, Y LA VUELTA A CERO ═══════════
//
// ⭐ [ANTONIO] La maqueta abre con «Andando» marcado y eso muere. Aquí se mide
//    lo que de verdad ve quien abre la página, y las tres consecuencias van
//    juntas porque son una sola decisión: cero chips marcados, cero
//    subformularios, y «Generar ruta» apagado.
//
// ⚠️ Y se mide TAMBIÉN la vuelta: elegir un modo hace nacer su subformulario, y
//    «Limpiar búsqueda» lo devuelve todo a cero. Un arranque limpio con un
//    «Limpiar» que dejara «Andando» puesto sería media obra — y es exactamente
//    la letra que el encargo cambia en `handleReset`.
{
  const m = await abrirChrome({ ancho: 1440, alto: 900, puerto: 9409 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ EL ARRANQUE SIN MODO ═══');

    const estado = `
      return {
        marcados: [...document.querySelectorAll('input[name=familia]')]
          .filter((r) => r.checked).map((r) => r.value),
        activos: document.querySelectorAll('.familias .modo--activo').length,
        subformularios: [...document.querySelectorAll('fieldset.modos:not(.familias)')]
          .map((f) => f.querySelector('legend')?.textContent.trim() ?? '(sin leyenda)'),
        generar: document.querySelector('.generar').disabled,
        // El foco del teclado: con NINGUNO marcado, los seis radios son
        // tabulables — es la conducta nativa del grupo sin selección.
        tabulables: [...document.querySelectorAll('input[name=familia]')]
          .filter((r) => r.tabIndex >= 0).length,
      };
    `;

    const alAbrir = await leer(m, estado);
    juzgar(
      alAbrir.marcados.length === 0 && alAbrir.activos === 0,
      'P9 · ⭐ al abrir NO hay ningún modo marcado',
      `marcados: ${alAbrir.marcados.join(',') || '(ninguno)'} · pintados activos: ${alAbrir.activos}`,
    );
    juzgar(
      alAbrir.subformularios.length === 0,
      'P9 · ni un subformulario a la vista',
      alAbrir.subformularios.join(' | ') || '(ninguno)',
    );
    juzgar(alAbrir.generar === true, 'P9 · «Generar ruta» apagado', `disabled=${alAbrir.generar}`);
    juzgar(
      alAbrir.tabulables === 6,
      'P9 · y el teclado entra igual: los seis radios son alcanzables',
      `${alAbrir.tabulables} de 6`,
    );
    await m.guardar(`${CAPTURAS}/arranque-sin-modo.png`);

    // Se elige «Coche», que es la familia con MÁS subformularios detrás —el
    // aparcamiento y la ZBE—: si nacen los suyos, nacen los de cualquiera.
    await m.evaluar(`document.querySelector('input[name=familia][value=coche]').click()`);
    await m.dormir(500);
    const conCoche = await leer(m, estado);
    juzgar(
      conCoche.marcados.join(',') === 'coche' && conCoche.subformularios.length > 0,
      'P9 · al elegir «Coche» nace su subformulario',
      `marcado: ${conCoche.marcados.join(',')} · nacen: ${conCoche.subformularios.join(' | ')}`,
    );
    await m.guardar(`${CAPTURAS}/modo-elegido-subformulario.png`);

    // Y «Limpiar búsqueda» devuelve el modo a NINGUNO, que es la letra nueva.
    await m.evaluar(`document.querySelector('.limpiar').click()`);
    await m.dormir(500);
    const trasLimpiar = await leer(m, estado);
    juzgar(
      trasLimpiar.marcados.length === 0 &&
        trasLimpiar.subformularios.length === 0 &&
        trasLimpiar.generar === true,
      'P9 · ⭐ «Limpiar búsqueda» deja el modo en NINGUNO, como al abrir',
      `marcados: ${trasLimpiar.marcados.join(',') || '(ninguno)'} · ` +
        `subformularios: ${trasLimpiar.subformularios.length} · Generar apagado: ${trasLimpiar.generar}`,
    );
    await m.guardar(`${CAPTURAS}/limpiar-a-cero.png`);

    // ⭐ Y LA LETRA DEL VACÍO, LEÍDA DE LA PANTALLA (11/09) — [ANTONIO].
    //
    // La fija también una jueza de jsdom, y aquí se repite a propósito: aquélla
    // lee el DOM que Angular compone, ésta lee lo que hay pintado tras abrir el
    // bloque con el ratón. Enumera CINCO condiciones porque cinco son desde que
    // el modo entró en la que enciende «Generar ruta».
    await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[1].click()`);
    await m.dormir(500);
    const vacio = await m.evaluar(
      `document.querySelector('.pasos__vacio')?.textContent.trim() ?? '(no está)'`,
    );
    juzgar(
      vacio ===
        'Todavía no hay pasos. Rellena origen y destino, elige cómo te mueves y pulsa "Generar ruta".',
      'P9 · ⭐ el vacío del resultado dice las CINCO condiciones',
      `«${vacio}»`,
    );
    await m.guardar(`${CAPTURAS}/vacio-letra-nueva.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P10 · LAS CABECERAS DEL ACORDEÓN, CON CUERPO ═══════════
//
// ⭐ [NN/g, acordeones] la señal de expandible es el pecado ausente más común, y
//    la cabecera tiene que distinguirse del contenido **en los dos estados**.
//    La maqueta lo traía y aquí faltaba: `background: none`. Se calca la banda.
//
// ⚠️ El fondo de la banda es `muted` al 30 %, o sea SEMITRANSPARENTE: el
//    `backgroundColor` calculado vuelve como `rgba(...)` y compararlo con el
//    del cuerpo diría «distintos» aunque se pintaran igual. Por eso lo que se
//    mide no es el color declarado: es **el píxel**, con `contrasteReal`, que
//    fotografía y cuenta. Un instrumento que preguntara al CSS daría verde con
//    una banda invisible.
{
  const m = await abrirChrome({ ancho: 1440, alto: 900, puerto: 9410 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ LAS CABECERAS CON CUERPO ═══');

    // El píxel de la banda y el del cuerpo, medidos por captura. La franja que
    // se muestrea del cuerpo es la de justo debajo de la cabecera: es ahí donde
    // la separación tiene que verse.
    const bandaYCuerpo = async () =>
      await m.evaluar(`(() => {
        const c = document.querySelector('.bloque__cabecera');
        const s = getComputedStyle(c);
        return {
          fondoDeclarado: s.backgroundColor,
          bordeAbajo: s.borderBottomWidth + ' ' + s.borderBottomStyle + ' ' + s.borderBottomColor,
          transicion: s.transitionProperty,
        };
      })()`);

    for (const abierto of [true, false]) {
      // El bloque del Buscador arranca ABIERTO; se pliega pulsando su cabecera.
      if (!abierto) {
        await m.evaluar(`document.querySelector('.bloque__cabecera').click()`);
        await m.dormir(400);
      }
      const cual = abierto ? 'abierto' : 'plegado';
      const decl = await bandaYCuerpo();
      const banda = await contrasteReal(m, '.bloque__cabecera', { indice: 0 });
      // ⭐ Y LA SUPERFICIE CONTRA LA QUE SE COMPARA, que costó acertar.
      //
      // ⚠️ Primero se midió `.bloque` de al lado —«Indicaciones»— y la jueza dio
      //    ROJO con la banda ya puesta: plegado, ese bloque **es casi solo su
      //    propia cabecera**, así que el color más frecuente de su caja era otra
      //    banda. Se estaba comparando la banda consigo misma. El instrumento
      //    mentía, no la pintura.
      //
      //    La superficie buena es la franja del título de la app —«Desplázame»—:
      //    es el fondo pelado del panel, está a la vista en LOS DOS estados y no
      //    lleva banda ninguna.
      const superficie = await contrasteReal(m, '.cabecera', { indice: 0 });

      juzgar(
        enRgb(banda.fondo) !== enRgb(superficie.fondo),
        `P10 · ⭐ la cabecera «Buscador» ${cual} se distingue de la superficie`,
        `banda ${enRgb(banda.fondo)} · superficie ${enRgb(superficie.fondo)} · declarada ${decl.fondoDeclarado}`,
      );
      juzgar(
        !/^0px/.test(decl.bordeAbajo),
        `P10 · y su borde delimita dónde acaba la cabecera (${cual})`,
        decl.bordeAbajo,
      );
      // ⭐ Y CUÁNTO se separa, que es lo que de verdad se pidió: «que se
      //    distinga» y «que se distinga EN REPOSO» no son la misma compra. La
      //    de arriba pasaba con 2 puntos de 255.
      const separacion = Math.max(
        Math.abs(banda.fondo.r - superficie.fondo.r),
        Math.abs(banda.fondo.g - superficie.fondo.g),
        Math.abs(banda.fondo.b - superficie.fondo.b),
      );
      juzgar(
        separacion >= MINIMO_DE_SEPARACION,
        `P10 · ⭐ y se distingue EN REPOSO, sin ratón (${cual})`,
        `${separacion} puntos de 255, y el suelo es ${MINIMO_DE_SEPARACION}`,
      );
      juzgar(
        banda.contraste >= AA_TEXTO,
        `P10 · el texto de cabecera sobre la banda cumple AA (${cual})`,
        `${enRgb(banda.texto)} sobre ${enRgb(banda.fondo)} = ${banda.contraste.toFixed(2)}:1`,
      );
      await m.guardar(`${CAPTURAS}/cabecera-${cual}.png`);
    }

    // Se devuelve a abierto para las dos siguientes.
    await m.evaluar(`document.querySelector('.bloque__cabecera').click()`);
    await m.dormir(400);

    // ⭐ EL HOVER, con feedback y bajo `@media (hover: hover)`. Que la regla no
    //    se escape de ese envoltorio lo vigila la jueza de `pintura.spec.ts`,
    //    que lee la hoja entera; aquí se mide que el ratón CAMBIA algo.
    const enReposo = await contrasteReal(m, '.bloque__cabecera', { indice: 0 });
    const donde = await m.evaluar(`(() => {
      const r = document.querySelector('.bloque__cabecera').getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    })()`);
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: donde.x, y: donde.y });
    await m.dormir(500);
    const conRaton = await contrasteReal(m, '.bloque__cabecera', { indice: 0 });
    juzgar(
      enRgb(conRaton.fondo) !== enRgb(enReposo.fondo),
      'P10 · ⭐ con el ratón encima la banda responde',
      `${enRgb(enReposo.fondo)} → ${enRgb(conRaton.fondo)}`,
    );
    juzgar(
      conRaton.contraste >= AA_TEXTO,
      'P10 · y con el ratón encima el texto sigue cumpliendo AA',
      `${conRaton.contraste.toFixed(2)}:1`,
    );
    await m.guardar(`${CAPTURAS}/cabecera-hover.png`);

    // El foco, con señal propia y sin depender del ratón.
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
    await m.evaluar(`document.querySelector('.bloque__cabecera').focus()`);
    await m.dormir(300);
    const foco = await m.evaluar(`(() => {
      const s = getComputedStyle(document.querySelector('.bloque__cabecera'));
      return s.outlineWidth + ' ' + s.outlineStyle + ' ' + s.outlineColor;
    })()`);
    juzgar(!/^0px/.test(foco), 'P10 · el foco del teclado lleva su señal propia', foco);
    await m.guardar(`${CAPTURAS}/cabecera-foco.png`);

    // ⛔ AQUÍ NO SE MIDE EL OSCURO, Y SE DICE POR QUÉ.
    //
    // Se intentó: `Emulation.setEmulatedMedia` con `prefers-color-scheme: dark`,
    // y `matchMedia` contestó `true`… **y la pintura no cambió ni un punto**:
    // banda y superficie salieron exactamente iguales que en claro. La jueza
    // habría dado VERDE por la razón equivocada, que es la misma trampa que
    // cazó P0 con el `hover` en la tanda 4.
    //
    // La causa no es el instrumento: `src/index.html` sirve
    // `<html lang="es" data-theme="light">`, o sea que **la app va clavada en
    // claro** y `prefers-color-scheme` no la mueve — es una decisión con su
    // propia jueza en `identidad.spec.ts`. El único sitio donde el oscuro se
    // pinta es la sonda de `/identidad`, así que el par de la banda en oscuro
    // se mide allí: ver el censo de `e2e/identidad.mjs`.
  } finally {
    m.cerrar();
  }
}

// ═══════════ P11 · LA BANDA, TAMBIÉN EN TÁCTIL EMULADO ═══════════
//
// ⚠️ Aquí NO se mide el hover: en táctil no lo hay, y ésa es justamente la
//    razón de que la regla viva bajo `@media (hover: hover)`. Lo que se compra
//    es que **la banda existe igual sin ratón** — la señal de expandible no
//    puede depender de un puntero que no está.
//
// ⚠️ Y EL APARATO CAMBIÓ EL 11/09: era un teléfono de 412 y ahora es una
//    TABLETA de 1024. No es aflojar la jueza, es que su sujeto se mudó: con las
//    pestañas de móvil el acordeón deja de existir por debajo de 768, así que
//    medir su banda en un teléfono es medir un elemento con `display: none`.
//    La jueza reventó tal cual, con «el recorte cae FUERA DEL VIEWPORT».
//    Una tableta es táctil Y ancha: el acordeón está, y el ratón no. Eso es
//    exactamente lo que había que comprar, y ahora se compra mejor.
{
  const m = await abrirChrome({ ancho: 1024, alto: 1366, puerto: 9411 });
  try {
    await m.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await m.cdp('Emulation.setDeviceMetricsOverride', {
      width: 1024, height: 1366, deviceScaleFactor: 0, mobile: true,
    });
    await m.ir(APP, 6000);
    console.log('\n═══ LA BANDA EN TÁCTIL ═══');

    const emulado = await m.evaluar(
      `JSON.stringify({ grueso: matchMedia('(pointer: coarse)').matches, hover: matchMedia('(hover: hover)').matches })`,
    ).then(JSON.parse);
    juzgar(
      emulado.grueso === true && emulado.hover === false,
      'P11 · P0 · la emulación llegó: puntero grueso y sin hover',
      `coarse=${emulado.grueso} hover=${emulado.hover}`,
    );

    const hay = await m.evaluar(`document.querySelectorAll('.bloque__cabecera').length`);
    if (hay > 0) {
      const banda = await contrasteReal(m, '.bloque__cabecera', { indice: 0 });
      juzgar(
        banda.contraste >= AA_TEXTO,
        'P11 · la cabecera del acordeón se ve y cumple AA sin ratón (tableta 1024)',
        `${enRgb(banda.texto)} sobre ${enRgb(banda.fondo)} = ${banda.contraste.toFixed(2)}:1`,
      );
      await m.guardar(`${CAPTURAS}/cabecera-tactil.png`);
    } else {
      juzgar(false, 'P11 · la cabecera existe en táctil', 'no hay ninguna .bloque__cabecera');
    }
  } finally {
    m.cerrar();
  }
}

// ═══════════ P12 · LA FILA DE CHIPS EN MÓVIL: IMÁN Y AUTO-CENTRADO ═══════
//
// ⭐ [SearchForm.tsx] en móvil la fila se desplaza a lo ancho con imán, y el
//    chip elegido se trae al centro solo. En una pantalla de 390 los seis no
//    caben en cuanto uno abre su etiqueta, así que sin esto elegir «Coche» —el
//    último— lo deja pegado al borde y medio cortado.
//
// ⚠️ Y se emula el APARATO, no el ancho: `setDeviceMetricsOverride` con
//    `mobile: true` más `setTouchEmulationEnabled`. La P0 de siempre compra que
//    la emulación llegó antes de juzgar nada con ella — `setEmulatedMedia` con
//    `features` acepta `pointer` y no hace nada, medido en la tanda 4.
{
  const m = await abrirChrome({ ancho: 390, alto: 844, puerto: 9412 });
  try {
    await m.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await m.cdp('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 0, mobile: true,
    });
    await m.ir(APP, 6000);
    console.log('\n═══ LA FILA DE CHIPS EN MÓVIL ═══');

    const emulado = await m.evaluar(
      `JSON.stringify({ grueso: matchMedia('(pointer: coarse)').matches, ancho: innerWidth })`,
    ).then(JSON.parse);
    juzgar(
      emulado.grueso === true && emulado.ancho === 390,
      'P12 · P0 · la emulación llegó: puntero grueso y 390 de ancho',
      `coarse=${emulado.grueso} · innerWidth=${emulado.ancho}`,
    );

    const fila = `
      const f = document.querySelector('.familias');
      const s = getComputedStyle(f);
      const r = f.getBoundingClientRect();
      const chips = [...f.querySelectorAll('.modo--chip')];
      return {
        imán: s.scrollSnapType,
        suave: s.scrollBehavior,
        barra: s.scrollbarWidth,
        envuelve: s.flexWrap,
        desplaza: f.scrollWidth > f.clientWidth + 1,
        scrollWidth: Math.round(f.scrollWidth),
        clientWidth: Math.round(f.clientWidth),
        scrollLeft: Math.round(f.scrollLeft),
        // El sangrado: la fila tiene que llegar al filo de la pantalla.
        izquierda: Math.round(r.left),
        derecha: Math.round(r.right),
        // Una linea sola: si envolviera, habria mas de una coordenada y.
        lineas: new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top))).size,
        imanDelChip: chips.length ? getComputedStyle(chips[0]).scrollSnapAlign : '(sin chips)',
        activo: (() => {
          const a = f.querySelector('.modo--activo');
          if (!a) return null;
          const q = a.getBoundingClientRect();
          return { modo: a.getAttribute('data-modo'), centro: Math.round(q.x + q.width / 2) };
        })(),
        centroDeLaFila: Math.round(r.x + r.width / 2),
      };
    `;

    const enReposo = await leer(m, fila);
    juzgar(
      enReposo.imán.startsWith('x') && enReposo.suave === 'smooth' &&
        enReposo.barra === 'none' && enReposo.envuelve === 'nowrap' &&
        enReposo.imanDelChip === 'center',
      'P12 · ⭐ la fila lleva imán en x, desplazamiento suave, sin barra y sin envolver',
      `snap ${enReposo.imán} · ${enReposo.suave} · scrollbar ${enReposo.barra} · ` +
        `${enReposo.envuelve} · chip ${enReposo.imanDelChip}`,
    );
    juzgar(
      enReposo.lineas === 1,
      'P12 · y los seis van en UNA línea, por larga que sea',
      `${enReposo.lineas} línea(s) · ${enReposo.scrollWidth} px de fila en ${enReposo.clientWidth} de hueco`,
    );
    // ⚠️ El sangrado del calco (`-mx-4 px-4`): la fila llega al filo de la
    //    pantalla. Sin él, el corte queda a media distancia y se lee como
    //    «aquí se acabó» en vez de «hay más a la derecha».
    juzgar(
      enReposo.izquierda <= 0 && enReposo.derecha >= 390,
      'P12 · ⭐ y llega al filo de la pantalla: el corte dice que hay más',
      `de x=${enReposo.izquierda} a x=${enReposo.derecha} en una pantalla de 390`,
    );
    await m.guardar(`${CAPTURAS}/movil-chips-reposo.png`);

    // ⭐ EL AUTO-CENTRADO: se elige «Coche», que es el ÚLTIMO de los seis y el
    //    que peor lo tiene — sin centrado se queda contra el borde derecho.
    await m.evaluar(`document.querySelector('input[name=familia][value=coche]').click()`);
    // ⚠️ 2 s y no 900 ms: el chip tarda sus 300 en crecer, el centrado empieza
    //    DESPUÉS —va atado a su `transitionend`— y encima es suave. Medido con
    //    900 ms se leía la fila a mitad de camino (`scrollLeft` 7 de 11), que
    //    no es un fallo de la pintura sino del cronómetro del instrumento.
    await m.dormir(2000);
    const conCoche = await leer(m, fila);
    juzgar(
      conCoche.desplaza === true,
      'P12 · con un chip abierto la fila ya no cabe: se desplaza',
      `${conCoche.scrollWidth} px de fila en ${conCoche.clientWidth} de hueco`,
    );
    // ⚠️ EL JUICIO ES CONTRA EL IDEAL RECORTADO, no contra «el centro a secas».
    //    Con seis chips en 390 px la fila desborda 11 px: centrar el ÚLTIMO es
    //    imposible por definición — no hay tanto sitio a la derecha—, y pedirlo
    //    sería una jueza que no puede ponerse verde nunca. Lo que se compra es
    //    que la fila se haya ido **todo lo que podía** hacia el centro del chip
    //    elegido, que es lo que hace `scrollIntoView({ inline: 'center' })`.
    const centrado = await leer(
      m,
      `
      const f = document.querySelector('.familias');
      const a = f.querySelector('.modo--activo');
      if (!a) return null;
      const tope = f.scrollWidth - f.clientWidth;
      const ideal = a.offsetLeft + a.offsetWidth / 2 - f.clientWidth / 2;
      const r = a.getBoundingClientRect(), q = f.getBoundingClientRect();
      return {
        modo: a.getAttribute('data-modo'),
        scrollLeft: Math.round(f.scrollLeft),
        idealRecortado: Math.round(Math.max(0, Math.min(ideal, tope))),
        tope: Math.round(tope),
        // Y entero dentro de lo que se ve, que es la consecuencia que importa.
        aLaVista: r.left >= q.left - 1 && r.right <= q.right + 1,
        // La contraprueba, calculada: sin mover la fila, este chip se saldria.
        cortadoSinMover: a.offsetLeft + a.offsetWidth > f.clientWidth + 1,
      };
    `,
    );
    // ⚠️ ESTA JUEZA SE ESCRIBIO DOS VECES MAL ANTES DE ACERTAR, y las dos
    //    medidas quedan aqui porque explican QUE se puede comprar:
    //
    //    1. Pedia el ideal exacto y daba «5 px de los 11». El numero final no
    //       lo pone `scrollIntoView`: lo pone EL IMAN — `scroll-snap-type: x
    //       proximity` reengancha la fila a su anclaje mas cercano, que es lo
    //       que el calco pide. Exigir el ideal seria juzgar contra una mecanica
    //       pedida a proposito.
    //    2. Pedia ademas que sin mover el chip quedara cortado, y salio
    //       `false`: a 390 px con seis chips la fila desborda 11 px, que son
    //       **su propio relleno**. El ultimo chip acaba en 383 de 388: no se
    //       corta. La premisa era mia, no del dato.
    //
    //    Lo que SI se compra, y es lo que el calco promete: al elegir, LA FILA
    //    SE MUEVE SOLA —estaba en 0 y deja de estarlo— y el chip elegido acaba
    //    entero a la vista. Con seis chips en 390 ese movimiento es corto; el
    //    dia que entre un modo mas, o con un movil mas estrecho, es la
    //    diferencia entre verlo y no verlo.
    juzgar(
      centrado !== null && enReposo.scrollLeft === 0 && centrado.scrollLeft > 0 &&
        centrado.aLaVista,
      'P12 · ⭐ y al elegir, la fila se mueve SOLA y deja el chip entero a la vista',
      centrado
        ? `«${centrado.modo}» · de ${enReposo.scrollLeft} a ${centrado.scrollLeft} px ` +
          `(tope ${centrado.tope}, el iman decide el final) · entero a la vista: ${centrado.aLaVista}`
        : 'no hay chip activo',
    );
    await m.guardar(`${CAPTURAS}/movil-chip-centrado.png`);

    // ⭐ [ANTONIO] EL Nº LEGIBLE TAMBIÉN EN MÓVIL. La maqueta lo corta a 80 px
    //    con el marcador truncado; eso ya se vetó en escritorio y aquí vale
    //    igual. Se mide lo mismo que P8: que el marcador quepa entero.
    const num = await leer(
      m,
      `
      const c = document.querySelector('app-selector-portal input');
      if (!c) return null;
      const s = getComputedStyle(c);
      const p = document.createElement('span');
      p.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
      p.style.font = s.font || (s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight + ' ' + s.fontFamily);
      p.textContent = c.placeholder;
      document.body.appendChild(p);
      const pide = p.getBoundingClientRect().width +
        parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
      p.remove();
      return {
        marcador: c.placeholder,
        da: Math.round(c.getBoundingClientRect().width),
        pide: Math.round(pide),
      };
    `,
    );
    juzgar(
      num !== null && num.da >= num.pide,
      'P12 · ⭐ [ANTONIO] el «Nº» lee su marcador ENTERO también en móvil',
      num ? `«${num.marcador}» pide ${num.pide} px y la casilla da ${num.da}` : 'no hay casilla',
    );

    // ═══ P13 · [ANTONIO] EL PIN EN FILA CON EL TIPO ═══
    //
    // ⭐ En <768 el botón de ubicación quedó descolgado en su propia fila:
    //    medido antes de tocar nada, el pin en y=165 y el «Tipo» en y=221. La
    //    letra de Antonio es [PIN][Tipo ▾] compartiendo fila — la diana en su
    //    cuadrado de 44 a la izquierda y el desplegable ocupando lo que queda.
    //
    // ⚠️ «Comparten fila» se mide por SOLAPE VERTICAL y no por una `y` igual:
    //    las dos cajas no miden lo mismo —el pin son 44 y el bloque del Tipo
    //    incluye su rótulo—, así que exigir la misma `y` sería exigir que el
    //    rótulo desapareciera. Y además se comprueba que el centro del pin cae
    //    DENTRO del desplegable: es lo que hace que se lean como una fila y no
    //    como dos cosas apiladas que se rozan.
    const enFila = await leer(
      m,
      `
      const p = document.querySelector('.punto');
      const pin = p.querySelector('.ubicacion');
      const tipo = p.querySelector('.campo--tipo');
      const select = p.querySelector('select.tipo');
      if (!pin || !tipo || !select) return null;
      const c = (e) => { const r = e.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
                 h: Math.round(r.height), der: Math.round(r.right),
                 abajo: Math.round(r.bottom), medio: Math.round(r.y + r.height / 2) }; };
      const rp = p.getBoundingClientRect();
      const cs = getComputedStyle(p);
      return {
        pin: c(pin), tipo: c(tipo), select: c(select),
        utilDerecha: Math.round(rp.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth)),
      };
    `,
    );
    juzgar(
      enFila !== null &&
        enFila.pin.y < enFila.tipo.abajo && enFila.tipo.y < enFila.pin.abajo &&
        enFila.pin.der <= enFila.tipo.x,
      'P13 · ⭐ [ANTONIO] el pin y el «Tipo» comparten fila, con la diana a la izquierda',
      enFila
        ? `pin y=${enFila.pin.y}..${enFila.pin.abajo} (x hasta ${enFila.pin.der}) · ` +
          `Tipo y=${enFila.tipo.y}..${enFila.tipo.abajo} (x desde ${enFila.tipo.x})`
        : 'falta alguna de las dos piezas',
    );
    juzgar(
      enFila !== null &&
        enFila.pin.medio >= enFila.select.y && enFila.pin.medio <= enFila.select.abajo,
      'P13 · y la diana queda a la altura del desplegable, no del rótulo',
      enFila
        ? `centro del pin en y=${enFila.pin.medio} · el select va de ${enFila.select.y} a ${enFila.select.abajo}`
        : 'falta alguna de las dos piezas',
    );
    juzgar(
      enFila !== null && enFila.pin.w === 44 && enFila.pin.h === 44,
      'P13 · el pin conserva su cuadrado de 44 [WCAG 2.5.5]',
      enFila ? `${enFila.pin.w}×${enFila.pin.h}` : 'no hay pin',
    );
    juzgar(
      enFila !== null && Math.abs(enFila.tipo.der - enFila.utilDerecha) <= 1,
      'P13 · ⭐ y el desplegable llega al borde derecho de su tarjeta',
      enFila ? `acaba en x=${enFila.tipo.der} y la tarjeta da hasta ${enFila.utilDerecha}` : '—',
    );
    await m.guardar(`${CAPTURAS}/movil-pin-en-fila.png`);

    // ⭐ EL SAFE-AREA: las dos mitades. Sin el meta, `env()` vale 0 y el relleno
    //    de la barra no existe [DOC MDN]; sin el relleno, el meta solo sirve
    //    para meter la página debajo del indicador de inicio. Van juntas o
    //    ninguna, así que se compran juntas.
    const seguro = await leer(
      m,
      `
      const meta = document.querySelector('meta[name=viewport]')?.getAttribute('content') ?? '';
      const barra = document.querySelector('.barra');
      const r = barra.getBoundingClientRect();
      // Lo que quede pegado al borde de abajo, censado: la barra es la
      // candidata número uno documentada, y aquí se comprueba que es la única.
      const pegados = [...document.querySelectorAll('body *')].filter((e) => {
        const c = getComputedStyle(e);
        if (c.position !== 'fixed' && c.position !== 'absolute') return false;
        const q = e.getBoundingClientRect();
        return q.height > 0 && Math.abs(q.bottom - window.innerHeight) <= 1;
      }).map((e) => e.className.toString().split(' ')[0] || e.tagName.toLowerCase());
      return {
        meta,
        cubre: /viewport-fit\s*=\s*cover/.test(meta),
        relleno: getComputedStyle(barra).paddingBottom,
        abajoDeLaBarra: Math.round(r.bottom),
        alto: window.innerHeight,
        pegados: [...new Set(pegados)],
      };
    `,
    );
    juzgar(
      seguro.cubre === true,
      'P12 · ⭐ el meta declara `viewport-fit=cover` — sin él, `env()` vale 0',
      seguro.meta,
    );
    juzgar(
      seguro.abajoDeLaBarra === seguro.alto,
      'P12 · y la barra acaba justo en el borde de abajo, con su relleno seguro',
      `acaba en ${seguro.abajoDeLaBarra} de ${seguro.alto} · relleno de seguridad ${seguro.relleno}`,
    );
    // ⚠️ En Chrome de escritorio `env(safe-area-inset-bottom)` vale 0: aquí no
    //    hay notch. Lo que se puede comprobar es que NADA MÁS quede pegado al
    //    borde de abajo — la barra es lo único, y lleva el relleno declarado.
    //    El juicio de verdad es el teléfono de Antonio.
    juzgar(
      seguro.pegados.length <= 1,
      'P12 · y no hay nada más pegado al borde que la barra',
      seguro.pegados.join(', ') || '(nada)',
    );
    await m.guardar(`${CAPTURAS}/movil-safe-area.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P14 · LOS CUATRO ESTADOS DEL RESULTADO ═══════════
//
// ⭐ [maqueta `RouteResult.tsx`, § 3a de la tanda 5] el panel del resultado
//    tiene CUATRO caras y hasta hoy solo dos estaban vestidas. Aquí se compran
//    las cuatro contra la pantalla de verdad, y con el motor de verdad: los dos
//    estados que faltaban —cargando y error— se provocan estrangulando la red
//    con `Network.emulateNetworkConditions`, no fabricando el estado a mano. Un
//    estado que solo sabe llegar porque se lo empuja desde fuera no está
//    comprado: está fingido.
//
// ⚠️ LA TRAMPA QUE ESTA JUEZA EXISTE PARA CAZAR [WCAG 4.1.3 · ARIA19]: una
//    región viva tiene que estar EN EL DOM ANTES del mensaje. Si nace con su
//    contenido, el lector de pantalla no estaba observándola cuando cambió y no
//    hay nada que anunciar — se ve en pantalla y no se oye. La casa ya lo tenía
//    escrito para `#lo-de-la-dgt`, y aquí estaba justo al revés: el `@if`
//    envolvía al `role="status"`, no al revés.
//
// ⚠️ Y el hueso NO se lee: es `aria-hidden`. Anunciar cuatro cajas grises no es
//    accesibilidad, es ruido — quien no ve el hueso oye la frase, que es la que
//    lleva la información.
{
  const m = await abrirChrome({ ancho: 1440, alto: 1000, puerto: 9414 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ LOS CUATRO ESTADOS DEL RESULTADO ═══');
    await m.cdp('Network.enable');

    // El bloque de indicaciones, abierto: plegado no se pinta nada de esto.
    await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[1].click()`);
    await m.dormir(400);

    // ── (1) LAS DOS REGIONES VIVAS, PRIMADAS Y VACÍAS ────────────────────
    const regiones = `
      const mirar = (papel) => {
        const e = document.querySelector('.pasos [role=' + papel + ']');
        return e === null ? null : { texto: e.textContent.trim(), hijos: e.children.length };
      };
      return { status: mirar('status'), alerta: mirar('alert') };
    `;
    const alAbrir = await leer(m, regiones);
    juzgar(
      alAbrir.status !== null && alAbrir.status.texto === '',
      'P14 · ⭐ la región `role="status"` YA ESTÁ en el DOM al abrir, y vacía',
      alAbrir.status === null ? '(no está)' : `«${alAbrir.status.texto}» · hijos ${alAbrir.status.hijos}`,
    );
    juzgar(
      alAbrir.alerta !== null && alAbrir.alerta.texto === '',
      'P14 · ⭐ y la región `role="alert"` del error, igual: presente y vacía',
      alAbrir.alerta === null ? '(no está)' : `«${alAbrir.alerta.texto}» · hijos ${alAbrir.alerta.hijos}`,
    );

    // ── (2) EL VACÍO: SU ICONO GRANDE, Y QUE SEA EL FICHERO QUE BAJAMOS ──
    //
    // No se compara con un trazado copiado aquí —eso sería el mismo dato dos
    // veces—: se lee `app/simbolos/route.svg`, que es el fichero con su sha256
    // en PROCEDENCIA.md. Si alguien redibuja el icono a mano, esto muerde.
    const elIcono = (sel) => `(() => {
      const s = document.querySelector(${JSON.stringify(sel)});
      if (!s) return null;
      const p = s.querySelector('path');
      return { lado: s.getAttribute('width') + 'x' + s.getAttribute('height'), d: p ? p.getAttribute('d') : null };
    })()`;
    const iconoVacio = JSON.parse(await m.evaluar(`JSON.stringify(${elIcono('.pasos__vacio svg')})`));
    juzgar(
      iconoVacio !== null && iconoVacio.d === trazadoDelFichero('route'),
      'P14 · ⭐ el vacío enseña el icono `route`, y es el SVG que se descargó',
      iconoVacio === null ? '(no hay icono)' : `d ${iconoVacio.d === trazadoDelFichero('route') ? 'idéntico al fichero' : 'DISTINTO del fichero'}`,
    );
    juzgar(
      iconoVacio !== null && iconoVacio.lado === '48x48',
      'P14 · y mide los 48 de la maqueta (`w-12 h-12`)',
      iconoVacio === null ? '(no hay icono)' : iconoVacio.lado,
    );
    const letraVacia = await contrasteSiEsta(m, '.pasos__vacio', { minimo: 20 });
    juzgar(
      letraVacia !== null && letraVacia.contraste >= AA_TEXTO,
      'P14 · y su letra se lee: contraste medido sobre el píxel',
      letraVacia === null
        ? '(el vacío no está en la página)'
        : `${letraVacia.contraste.toFixed(2)}:1 · texto ${enRgb(letraVacia.texto)} sobre ${enRgb(letraVacia.fondo)}`,
    );
    await m.guardar(`${CAPTURAS}/estado-vacio.png`);

    // ── EL FORMULARIO, RELLENO DE VERDAD ─────────────────────────────────
    const escribir = async (i, texto) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
        if (!c) return;
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(900);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via')[${i}];
        const o = [...c.querySelectorAll('[role=option]')][0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(700);
    };
    const portal = async (i, num) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal input')[${i}];
        if (!c) return;
        c.focus();
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(600);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal')[${i}];
        const ops = [...c.querySelectorAll('[role=option]')];
        const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(500);
    };
    await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[0].click()`);
    await m.dormir(400);
    await escribir(0, 'COLOSO');
    await portal(0, '2');
    await escribir(1, 'CALLE OVIEDO');
    await portal(1, '5');
    await m.evaluar(`document.querySelector('input[name=familia][value=andando]').click()`);
    await m.dormir(400);
    const listo = await m.evaluar(`!document.querySelector('button.generar').disabled`);
    juzgar(listo === true, 'P14 · el formulario queda listo para generar', `Generar encendido: ${listo}`);

    // ── (3) EL CARGANDO: EL HUESO, SOBRE UNA CARGA DE VERDAD ─────────────
    //
    // ⚠️ El hueso monta sobre `esperando()`, que es la señal QUE YA TENÍA UN
    //    UMBRAL: el segundo de NN/g. No sobre `generando()`, que se enciende en
    //    el mismo tick del clic — un hueso que parpadea 80 ms y desaparece es
    //    peor que ningún hueso. Por eso aquí se estrangula la red: sin latencia,
    //    el motor resuelve andando en ~20 ms y este estado NO EXISTIRÍA nunca en
    //    una medida honesta.
    await m.cdp('Network.emulateNetworkConditions', {
      offline: false,
      latency: 4000,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await m.evaluar(`document.querySelector('button.generar').click()`);
    await m.dormir(1600);

    const cargando = await leer(m, `
      const hueso = document.querySelector('.hueso');
      const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      const pinta = (s) => getComputedStyle(s).backgroundColor;
      const barras = hueso ? [...hueso.querySelectorAll('.hueso__linea, .hueso__caja, .hueso__circulo')] : [];
      const region = document.querySelector('.pasos [role=status]');
      return {
        hay: hueso !== null,
        oculto: hueso ? hueso.getAttribute('aria-hidden') : null,
        barras: barras.length,
        colores: [...new Set(barras.map(pinta))],
        mueve: hueso ? getComputedStyle(hueso).animationName : null,
        muted: token('--muted'),
        anuncio: region ? region.textContent.trim() : '(no está)',
        vacio: document.querySelector('.pasos__vacio') !== null,
      };
    `);
    juzgar(
      cargando.hay === true && cargando.barras >= 10,
      'P14 · ⭐ mientras carga se pinta EL HUESO de la maqueta, no una frase sola',
      `huesos contados: ${cargando.barras}`,
    );
    juzgar(
      cargando.oculto === 'true',
      'P14 · y el hueso NO se lee: `aria-hidden`',
      `aria-hidden=${cargando.oculto}`,
    );
    juzgar(
      cargando.colores.length === 1,
      'P14 · pintado con UN solo color, y el mismo en los doce huesos',
      cargando.colores.join(' | '),
    );

    juzgar(
      cargando.mueve !== null && cargando.mueve !== 'none',
      'P14 · y late — el pulso de la maqueta, que es lo que dice que está vivo',
      `animation-name: ${cargando.mueve}`,
    );
    juzgar(
      cargando.anuncio === 'Calculando la ruta…',
      'P14 · y la frase es LA NUESTRA, no la «Calculando mejores rutas...» de la maqueta',
      `«${cargando.anuncio}» · la letra depende del modo y por eso no se calca`,
    );
    juzgar(
      cargando.vacio === false,
      'P14 · y el vacío se ha ido: cargando y vacío no conviven',
      `¿sigue el vacío? ${cargando.vacio}`,
    );
    await m.guardar(`${CAPTURAS}/estado-cargando.png`);

    // ⚠️ [WCAG 2.3.3] con menos movimiento pedido, el hueso SE QUEDA —hace
    //    falta— pero deja de latir. No se quita el indicador: se para.
    await m.cdp('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await m.dormir(300);
    const quieto = await leer(m, `
      const h = document.querySelector('.hueso');
      return { hay: h !== null, mueve: h ? getComputedStyle(h).animationName : null };
    `);
    juzgar(
      quieto.hay === true && quieto.mueve === 'none',
      'P14 · ⭐ con `prefers-reduced-motion: reduce` el hueso sigue, y se para',
      `sigue: ${quieto.hay} · animation-name: ${quieto.mueve}`,
    );

    // ⭐ Y QUE EL HUESO SE VEA, QUE ES LA LECCIÓN DE LA BANDA (11/09).
    //
    // ⚠️ **La maqueta dice `bg-muted` y aquí eso no vale.** `--muted` de esta
    //    casa es `slate-50` desde la tanda 1-bis: medido sobre la tarjeta blanca
    //    da **3 puntos de 255**, el mismo error exacto que Antonio rechazó en
    //    las cabeceras del acordeón —«2 puntos de 255», invisible—. Un hueso que
    //    no se ve no es un hueso: es una pausa en blanco. Por eso la vara no es
    //    un token concreto sino EL MISMO SUELO que él fijó para la banda.
    //
    // ⚠️ **Y SE MIDE AQUÍ, CON EL LATIDO PARADO, y eso costó un rojo.** La
    //    primera versión medía en mitad de la carga y la captura pillaba el
    //    pulso a media bajada: el color declarado era `rgb(226, 232, 240)`
    //    —slate-200, sus 29 puntos— y el píxel devolvía `rgb(238, 242, 246)`,
    //    17 puntos. No mentía la pintura: mentía el instante. Una jueza que mide
    //    un fotograma al azar de una animación de 2 s da verde o rojo según
    //    cuándo se lance, y eso no es una jueza. El `prefers-reduced-motion` que
    //    la línea de arriba acaba de encender deja el hueso quieto y opaco, que
    //    es su estado de reposo: ahí sí hay un número que significa algo.
    const huesoPintado = await contrasteSiEsta(m, '.hueso__caja', { minimo: 40 });
    const superficieDelHueso = await contrasteSiEsta(m, '.cabecera', { indice: 0 });
    const separacionDelHueso =
      huesoPintado === null || superficieDelHueso === null
        ? -1
        : Math.max(
            Math.abs(huesoPintado.fondo.r - superficieDelHueso.fondo.r),
            Math.abs(huesoPintado.fondo.g - superficieDelHueso.fondo.g),
            Math.abs(huesoPintado.fondo.b - superficieDelHueso.fondo.b),
          );
    juzgar(
      separacionDelHueso >= MINIMO_DE_SEPARACION,
      'P14 · ⭐ y EN REPOSO SE VE — el suelo de la banda, no el `--muted` de la maqueta',
      separacionDelHueso < 0
        ? `(no hay hueso que medir) · --muted habría dado: ${cargando.muted}`
        : `${separacionDelHueso} puntos de 255 (suelo ${MINIMO_DE_SEPARACION}) · ` +
          `hueso ${enRgb(huesoPintado.fondo)} sobre ${enRgb(superficieDelHueso.fondo)} · ` +
          `--muted habría dado: ${cargando.muted}`,
    );

    // ⭐ Y CUÁNTO SE APAGA EL LATIDO EN SU PUNTO MÁS BAJO, que es lo que aquel
    //    rojo destapó: el hueso no vale lo mismo todo el rato. Se lee del
    //    fotograma del 50 % —no se deduce— y se compra que no baje de la mitad.
    //    Por debajo, el pulso deja de ser un latido y se convierte en un
    //    parpadeo hacia el blanco, que es justo lo que la banda enseñó a no
    //    hacer. El número va al acta con su cuenta hecha.
    const fondo = await m.evaluar(`(() => {
      for (const hoja of document.styleSheets) {
        let reglas; try { reglas = hoja.cssRules; } catch { continue; }
        for (const r of reglas) {
          if (r.type === CSSRule.KEYFRAMES_RULE && r.name === 'latido') {
            for (const k of r.cssRules) {
              if (k.keyText === '50%') return parseFloat(k.style.opacity);
            }
          }
        }
      }
      return null;
    })()`);
    juzgar(
      fondo !== null && fondo >= 0.5,
      'P14 · y el latido no se apaga del todo: su fotograma más bajo, declarado',
      fondo === null
        ? '(no se encuentra el @keyframes `latido`)'
        : `opacidad ${fondo} en el 50 % · el hueso pasa por ` +
          `${Math.round(separacionDelHueso * fondo)} puntos en lo más bajo del pulso`,
    );

    await m.cdp('Emulation.setEmulatedMedia', { features: [] });

    // Que la respuesta llegue, y la red vuelva a la normalidad.
    for (let i = 0; i < 40 && (await m.evaluar(`document.querySelector('.hueso') !== null`)); i++) {
      await m.dormir(300);
    }
    await m.cdp('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });

    // ── (4) EL ERROR: SIN MOTOR AL OTRO LADO ─────────────────────────────
    //
    // Se corta la red de verdad. Es el único camino por el que `noContesta()`
    // se enciende en producción, así que es el único por el que vale medirlo.
    await m.cdp('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    await m.evaluar(`document.querySelector('button.generar').click()`);
    await m.dormir(2500);

    const error = await leer(m, `
      const caja = document.querySelector('.pasos [role=alert]');
      const svg = document.querySelector('.pasos__error svg');
      const p = svg ? svg.querySelector('path') : null;
      return {
        papel: caja ? caja.getAttribute('role') : '(no está)',
        texto: caja ? caja.textContent.trim() : '(no está)',
        lado: svg ? svg.getAttribute('width') + 'x' + svg.getAttribute('height') : '(no hay icono)',
        d: p ? p.getAttribute('d') : null,
        hueso: document.querySelector('.hueso') !== null,
        vacio: document.querySelector('.pasos__vacio') !== null,
      };
    `);
    juzgar(
      error.texto === 'No se pudo preguntar al motor. ¿Está arrancado?',
      'P14 · ⭐ sin nadie al otro lado, el error habla — y por la región `alert`',
      `role=${error.papel} · «${error.texto}»`,
    );
    juzgar(
      error.d === trazadoDelFichero('cloud_off'),
      'P14 · con el icono `cloud_off`, y es el SVG que se descargó',
      error.d === null ? '(no hay icono)' : error.d === trazadoDelFichero('cloud_off') ? 'idéntico al fichero' : 'DISTINTO del fichero',
    );
    juzgar(error.lado === '48x48', 'P14 · y mide los 48 de la maqueta', error.lado);
    juzgar(
      error.papel === 'alert' && error.hueso === false && error.vacio === false,
      'P14 · ⭐ y los cuatro estados son EXCLUYENTES: con el error no hay hueso ni vacío',
      `error: ${error.papel === 'alert'} · hueso: ${error.hueso} · vacío: ${error.vacio}`,
    );
    const letraError = await contrasteSiEsta(m, '.pasos__error', { minimo: 20 });
    juzgar(
      letraError !== null && letraError.contraste >= AA_TEXTO,
      'P14 · y la letra del error se lee: contraste medido sobre el píxel',
      letraError === null
        ? '(el error no está en la página)'
        : `${letraError.contraste.toFixed(2)}:1 · texto ${enRgb(letraError.texto)} sobre ${enRgb(letraError.fondo)}`,
    );
    await m.guardar(`${CAPTURAS}/estado-error.png`);

    await m.cdp('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
  } finally {
    m.cerrar();
  }
}

// ═══════════ P15 · NI UN EMOJI EN TODA LA APP ═══════════
//
// ⭐ [§ 3d de la tanda 5, ampliado por la orden del 12/09] «los emojis mueren
//    aquí», y la jueza mira LA APP ENTERA, no solo el formulario.
//
// El barrido es sobre el DOM PINTADO, no sobre los ficheros: un censo por
// `grep` cuenta los ⭐ y los ⚠️ de los comentarios —que son cientos y no llegan
// a ninguna pantalla— y se le escapa lo que un componente inyecta en tiempo de
// ejecución, que es justo donde estaban los cuatro del mapa. Se recorre el
// árbol de texto, se pregunta por rango Unicode, y se dice dónde está cada uno.
//
// ⚠️ Se salta lo que pinta Leaflet en sus controles: el «−» del zoom es suyo,
//    no nuestro, y no se puede quitar sin quitarle el botón a la gente. Los
//    MARCADORES sí entran —`.leaflet-marker-icon` no es un control—, que es
//    donde vivían `🚲 🅿 🚌 🚏`.
//
// ⚠️ Y se mira CON RUTA GENERADA en los cuatro modos: la lista de pasos vacía
//    no tiene ni una flecha, así que una jueza que solo abriera la página daría
//    verde con los quince glifos intactos esperando a la primera búsqueda.
{
  const m = await abrirChrome({ ancho: 1440, alto: 1000, puerto: 9415 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ NI UN EMOJI EN TODA LA APP ═══');

    const BARRIDO = `
      const RANGO = /[\\u2190-\\u21FF\\u2300-\\u23FF\\u25A0-\\u27BF\\u2B00-\\u2BFF\\uFE0F]|[\\u{1F000}-\\u{1FAFF}]/gu;
      const hallados = [];
      const paseo = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = paseo.nextNode())) {
        const e = n.parentElement;
        if (!e || e.closest('.leaflet-control')) continue;
        const encontrado = (n.nodeValue || '').match(RANGO);
        if (!encontrado) continue;
        hallados.push({
          glifos: [...new Set(encontrado)].join(' '),
          donde: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''),
        });
      }
      return hallados;
    `;

    const escribir = async (i, texto) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
        if (!c) return;
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(900);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via')[${i}];
        const o = [...c.querySelectorAll('[role=option]')][0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(700);
    };
    const portal = async (i, num) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal input')[${i}];
        if (!c) return;
        c.focus();
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(600);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal')[${i}];
        const ops = [...c.querySelectorAll('[role=option]')];
        const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(500);
    };
    const generar = async (modo) => {
      await m.evaluar(`document.querySelector('input[name=familia][value=${modo}]').click()`);
      await m.dormir(500);
      await m.evaluar(`document.querySelector('button.generar').click()`);
      for (let i = 0; i < 80 && (await m.evaluar(`!!document.querySelector('button.generar')?.disabled`)); i++) {
        await m.dormir(300);
      }
      await m.dormir(1400);
    };

    await escribir(0, 'COLOSO');
    await portal(0, '2');
    await escribir(1, 'CALLE OVIEDO');
    await portal(1, '5');

    const alAbrir = await leer(m, BARRIDO);
    juzgar(
      alAbrir.length === 0,
      'P15 · con el formulario relleno, ni un glifo pictográfico',
      alAbrir.map((x) => `${x.glifos} en ${x.donde}`).join(' | ') || '(ninguno)',
    );

    // ⭐ LOS CUATRO MODOS, porque cada uno saca glifos distintos: la bici trae
    //    `coge`/`aparca`, el bus `sube`/`baja`/`transborda`, y el coche y andar
    //    sacan la familia entera de giros.
    for (const modo of ['bici', 'bus', 'coche', 'andando']) {
      await generar(modo);
      const hay = await leer(m, BARRIDO);
      const cuantos = hay.reduce((a, x) => a + x.glifos.split(' ').length, 0);
      juzgar(
        hay.length === 0,
        `P15 · ⭐ con la ruta en ${modo.toUpperCase()} pintada, ni un glifo en toda la app`,
        hay.length === 0
          ? '(ninguno, con el mapa y la lista llenos)'
          : `${cuantos} en ${hay.length} nodos · ` +
            [...new Set(hay.map((x) => `${x.glifos}→${x.donde}`))].slice(0, 8).join(' | '),
      );
      await m.guardar(`${CAPTURAS}/sin-emojis-${modo}.png`);
    }

    // ⭐ Y LA OTRA PANTALLA DEL PRODUCTO: los créditos.
    //
    // ⚠️ Ampliar el barrido aquí destapó **el último carácter que quedaba
    //    haciendo de icono**: un `←` de texto en «Volver al buscador». No lo
    //    veía nadie porque todas las juezas de emoji miraban el buscador.
    //
    // ℹ️ `/identidad` NO entra, y se declara para que no parezca un olvido: no
    //    es producto, es el instrumento —la sonda que pinta la paleta— y sus
    //    `⚠️` viven dentro de párrafos que explican una medida, como los de los
    //    comentarios. Si algún día se enseña a alguien que no sea nosotros,
    //    entra.
    await m.ir(APP + 'creditos', 4000);
    const enCreditos = await leer(m, BARRIDO);
    juzgar(
      enCreditos.length === 0,
      'P15 · ⭐ y en la página de créditos tampoco queda ninguno',
      enCreditos.map((x) => `${x.glifos} en ${x.donde}`).join(' | ') || '(ninguno)',
    );
    await m.guardar(`${CAPTURAS}/sin-emojis-creditos.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P16 · EL TIMELINE Y LA CABECERA, VESTIDOS ═══════════
//
// ⭐ [maqueta `RouteResult.tsx`, `status="success"`] los pasos dejan de ser una
//    fila de texto con una flecha delante y pasan a ser una línea de tiempo:
//    círculo de 32 con su maniobra dentro, hilo que los cose, y la distancia a
//    la derecha en cifras tabulares.
//
// ⚠️ El hilo y el círculo son `aria-hidden` los dos: lo que dicen —«gira a la
//    izquierda»— ya está escrito al lado con todas sus letras. Un lector que
//    anunciara «imagen, giro a la izquierda» antes de leer «Gira a la
//    izquierda…» diría dos veces lo mismo.
{
  const m = await abrirChrome({ ancho: 1440, alto: 1000, puerto: 9416 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ EL TIMELINE Y LA CABECERA ═══');

    const escribir = async (i, texto) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
        if (!c) return;
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(900);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via')[${i}];
        const o = [...c.querySelectorAll('[role=option]')][0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(700);
    };
    const portal = async (i, num) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal input')[${i}];
        if (!c) return;
        c.focus();
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(600);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal')[${i}];
        const ops = [...c.querySelectorAll('[role=option]')];
        const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(500);
    };

    await escribir(0, 'COLOSO');
    await portal(0, '2');
    await escribir(1, 'CALLE OVIEDO');
    await portal(1, '5');
    // El bus: es el único modo que trae a la vez chips de línea, nota ámbar y
    // los hitos de subir y bajar. Un solo viaje y se juzga todo.
    await m.evaluar(`document.querySelector('input[name=familia][value=bus]').click()`);
    await m.dormir(500);
    await m.evaluar(`document.querySelector('button.generar').click()`);
    for (let i = 0; i < 80 && (await m.evaluar(`!!document.querySelector('button.generar')?.disabled`)); i++) {
      await m.dormir(300);
    }
    await m.dormir(1500);

    const linea = await leer(m, `
      const pasos = [...document.querySelectorAll('.paso')];
      const px = (v) => Math.round(parseFloat(v));
      return {
        cuantos: pasos.length,
        circulos: pasos.map((p) => {
          const c = p.querySelector('.paso__circulo');
          if (!c) return null;
          const s = getComputedStyle(c);
          const svg = c.querySelector('svg');
          return {
            lado: px(s.width) + 'x' + px(s.height),
            redondo: s.borderRadius,
            fondo: s.backgroundColor,
            tinta: s.color,
            d: svg ? svg.querySelector('path').getAttribute('d') : null,
            oculto: c.getAttribute('aria-hidden'),
          };
        }),
        hilos: pasos.map((p) => {
          const h = p.querySelector('.paso__hilo');
          return h === null ? null : { ancho: px(getComputedStyle(h).width), color: getComputedStyle(h).backgroundColor };
        }),
        metros: pasos.map((p) => {
          const e = p.querySelector('.paso__metros');
          return e === null ? null : getComputedStyle(e).fontVariantNumeric;
        }).filter((x) => x !== null),
      };
    `);

    juzgar(linea.cuantos > 3, 'P16 · hay una ruta con pasos que juzgar', `${linea.cuantos} pasos`);
    juzgar(
      linea.circulos.every((c) => c !== null && c.lado === '32x32'),
      'P16 · ⭐ cada paso lleva su círculo de 32, el de la maqueta',
      linea.circulos.every((c) => c !== null)
        ? [...new Set(linea.circulos.map((c) => c.lado))].join(' | ')
        : `${linea.circulos.filter((c) => c === null).length} pasos SIN círculo`,
    );
    juzgar(
      linea.circulos.every((c) => c !== null && c.oculto === 'true'),
      'P16 · y el círculo no se lee: el texto de al lado dice lo mismo',
      [...new Set(linea.circulos.map((c) => (c === null ? '(sin círculo)' : `aria-hidden=${c.oculto}`)))].join(' | '),
    );
    juzgar(
      linea.circulos.every((c) => c !== null && c.d !== null),
      'P16 · ⭐ y dentro va un SVG, no un carácter',
      `${linea.circulos.filter((c) => c !== null && c.d !== null).length} de ${linea.cuantos} con trazado`,
    );
    // El hilo cose los pasos: lo llevan todos MENOS el último, que no cose con
    // nada. Un hilo colgando del final es una promesa de que sigue habiendo
    // camino.
    const conHilo = linea.hilos.filter((h) => h !== null).length;
    juzgar(
      conHilo === linea.cuantos - 1 && linea.hilos[linea.cuantos - 1] === null,
      'P16 · ⭐ el hilo cose todos los pasos menos el último',
      `${conHilo} hilos para ${linea.cuantos} pasos · el último ${linea.hilos[linea.cuantos - 1] === null ? 'no lo lleva' : 'LO LLEVA'}`,
    );
    // ⚠️ El `every` de un array vacío es `true`: sin sujeto esto daba VERDE con
    //    cero hilos en la página. Se le exige el sujeto antes que la medida.
    const losHilos = linea.hilos.filter((h) => h !== null);
    juzgar(
      losHilos.length > 0 && losHilos.every((h) => h.ancho === 2),
      'P16 · y mide los 2 px de la maqueta',
      losHilos.length === 0
        ? '(no hay ni un hilo que medir)'
        : [...new Set(losHilos.map((h) => h.ancho + 'px'))].join(' | '),
    );
    juzgar(
      linea.metros.length > 0 && linea.metros.every((v) => v.includes('tabular-nums')),
      'P16 · ⭐ y las distancias van en cifras tabulares: la coma cae en la misma columna',
      [...new Set(linea.metros)].join(' | ') || '(ningún paso con metros)',
    );
    // ═══════════ P18 · NADA SE SALE DE SU CAJA ═══════════
    //
    // ⭐ LA JUEZA QUE FALTABA, Y LA ESCRIBE UN FALLO (12/09, bitácora nº49).
    //
    // ⚠️ Las siete de arriba dieron VERDE —círculo de 32, ocho hilos de 2 px,
    //    cifras tabulares, titular en 24/700— mientras el botón «Próximo bus» y
    //    la nota ámbar se pintaban ENCIMA del paso siguiente. Todas medían
    //    PIEZAS: cuánto mide, de qué color es, cuántas hay. Ninguna preguntaba
    //    lo único que estaba mal, que es dónde acaba cada una.
    //
    //    Y no es una rareza de este caso: en una columna flex un hijo que pide
    //    más de lo que hay **no desborda visiblemente**, se le encoge la caja y
    //    pinta fuera de ella. Sin un juicio como éste, eso es invisible para
    //    cualquier medida de tamaño — la caja mide lo que se le pidió.
    //
    // Se compran las dos caras del mismo hecho: que ningún descendiente se
    // salga por abajo de su paso, y que dos pasos no se pisen entre sí. La
    // segunda es la que se vio con el ojo; la primera dice por dónde.
    const cajas = await leer(m, `
      const px = (n) => Math.round(n);
      const pasos = [...document.querySelectorAll('.paso')];
      const fugados = [];
      pasos.forEach((p, i) => {
        const suya = p.getBoundingClientRect();
        for (const hijo of p.querySelectorAll('*')) {
          const b = hijo.getBoundingClientRect();
          if (b.height === 0 && b.width === 0) continue;
          if (b.bottom > suya.bottom + 1) {
            fugados.push({
              paso: i,
              que: hijo.tagName.toLowerCase() + '.' + (String(hijo.className).split(' ')[0] || '?'),
              sobra: px(b.bottom - suya.bottom),
            });
          }
        }
      });
      const pisados = [];
      for (let i = 1; i < pasos.length; i++) {
        const antes = pasos[i - 1].getBoundingClientRect();
        const ahora = pasos[i].getBoundingClientRect();
        if (ahora.top < antes.bottom - 1) pisados.push({ i, solape: px(antes.bottom - ahora.top) });
      }
      return { pasos: pasos.length, fugados, pisados };
    `);
    juzgar(
      cajas.fugados.length === 0,
      'P18 · ⭐ nada se sale de su paso por abajo — la jueza que escribió la nº49',
      cajas.fugados.length === 0
        ? `${cajas.pasos} pasos revisados, ni un descendiente fuera`
        : cajas.fugados.map((x) => `paso ${x.paso}: ${x.que} sobra ${x.sobra}px`).join(' | '),
    );
    juzgar(
      cajas.pisados.length === 0,
      // ⚠️ Dice CAJAS y no «pintura» a propósito: con el fallo de la nº49 vivo,
      //    ésta daba verde —los `.paso` no se solapaban entre sí— y lo que se
      //    salía era el contenido de uno de ellos. Son dos cosas distintas y
      //    las compra cada una la suya; la de arriba es la que cazó aquello.
      'P18 · y las CAJAS de dos pasos no se solapan',
      cajas.pisados.length === 0
        ? `${cajas.pasos} pasos, ni un solape`
        : cajas.pisados.map((x) => `el ${x.i - 1} pisa al ${x.i} por ${x.solape}px`).join(' | '),
    );

    await m.guardar(`${CAPTURAS}/timeline-vestido.png`);

    // ── LA CABECERA ──────────────────────────────────────────────────────
    const cabecera = await leer(m, `
      const t = document.querySelector('.ruta__titular');
      const flecha = document.querySelector('.ruta__flecha svg');
      const p = flecha ? flecha.querySelector('path') : null;
      return {
        titular: t ? t.textContent.replace(/\\s+/g, ' ').trim() : '(no está)',
        tamano: t ? getComputedStyle(t).fontSize : null,
        peso: t ? getComputedStyle(t).fontWeight : null,
        cifras: t ? getComputedStyle(t).fontVariantNumeric : null,
        d: p ? p.getAttribute('d') : null,
        rotulo: (document.querySelector('.ruta__lineas-rotulo') || {}).textContent || '(no está)',
      };
    `);
    juzgar(
      cabecera.d === trazadoDelFichero('arrow_forward'),
      'P16 · ⭐ la cabecera enseña origen → destino con `arrow_forward`, el SVG del fichero',
      cabecera.d === null ? '(no hay flecha)' : cabecera.d === trazadoDelFichero('arrow_forward') ? 'idéntico al fichero' : 'DISTINTO del fichero',
    );
    juzgar(
      // ⚠️ Pedía «>= 700» y daba OK con el 700 pintando el 600 (nº51): leía
      //    el estilo computado de un peso que la app no carga. [ANTONIO, cierre
      //    de la fase B] se queda el 600, que es el peso más alto que hay; que
      //    ningún peso se quede sin cara lo compra la P21.
      cabecera.tamano === '24px' && Number(cabecera.peso) === 600,
      'P16 · y el titular va en el 2xl, en el semibold: el peso más alto que la app carga',
      `${cabecera.tamano} / peso ${cabecera.peso} · «${cabecera.titular}»`,
    );
    juzgar(
      cabecera.cifras !== null && cabecera.cifras.includes('tabular-nums'),
      'P16 · con sus cifras tabulares',
      String(cabecera.cifras),
    );

    // ── EL AVISO ÁMBAR, POR TOKENS ───────────────────────────────────────
    //
    // ⚠️ No se compara con un hex escrito aquí: se le pregunta a la página cuál
    //    es el valor del token y se compara el píxel declarado contra ÉSE. Un
    //    hex copiado en la jueza es la misma copia que se está quitando del CSS.
    const ambar = await leer(m, `
      const tono = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      const aHex = (rgb) => {
        const [r, g, b] = rgb.match(/\\d+/g).map(Number);
        return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
      };
      // ⚠️ LAS DOS CAJAS, no la primera que aparezca. La primera versión hacía
      //    .resumen o .paso__nota, la primera que hubiera, y con eso el icono de
      //    la nota daba verde por el del resumen —o al revés—: son el mismo aviso
      //    dicho en dos sitios y las dos tienen que vestirse igual, que es justo
      //    lo que este juicio existe para comprar.
      const cajas = [...document.querySelectorAll('.resumen, .paso__nota')];
      if (cajas.length === 0) return { hay: false };
      const mirar = (caja) => {
        const s = getComputedStyle(caja);
        const svg = caja.querySelector('svg');
        return {
          cual: caja.className.split(' ')[0],
          fondo: aHex(s.backgroundColor),
          tinta: aHex(s.color),
          d: svg ? svg.querySelector('path').getAttribute('d') : null,
        };
      };
      return {
        hay: true,
        cuantas: cajas.length,
        cajas: cajas.map(mirar),
        cual: cajas.map((c) => c.className.split(' ')[0]).join(' + '),
        fondo: aHex(getComputedStyle(cajas[0]).backgroundColor),
        tinta: aHex(getComputedStyle(cajas[0]).color),
        tokenFondo: tono('--warning'),
        tokenTinta: tono('--warning-dark'),
      };
    `);
    // ⚠️ **ESTA JUEZA ESTABA MAL PENSADA Y DABA VERDE CON LA COPIA PUESTA.**
    //
    //    Comparaba el color computado de la caja con el valor del token, y los
    //    hexes que hay hoy a pelo en el CSS —`#fff4e5`, `#7c3d00`— SON el valor
    //    del token: la comparación se cumple sola. Es el patrón de la nº48 otra
    //    vez, un número que aparece pero que no compra nada.
    //
    //    Lo que de verdad distingue «sale del token» de «tiene el mismo color
    //    que el token» es que EL TOKEN LO MUEVA: se le cambia el valor en
    //    caliente sobre `:root` y se mira si la caja obedece. Un hex copiado se
    //    queda quieto. Y se devuelve a su sitio al acabar.
    const SONDA = 'rgb(255, 0, 255)';
    const obedece = await leer(m, `
      const caja = document.querySelector('.resumen') || document.querySelector('.paso__nota');
      if (!caja) return { hay: false };
      const raiz = document.documentElement;
      const antesFondo = getComputedStyle(caja).backgroundColor;
      const antesTinta = getComputedStyle(caja).color;
      raiz.style.setProperty('--warning', 'rgb(255, 0, 255)');
      raiz.style.setProperty('--warning-dark', 'rgb(255, 0, 255)');
      const fondo = getComputedStyle(caja).backgroundColor;
      const tinta = getComputedStyle(caja).color;
      raiz.style.removeProperty('--warning');
      raiz.style.removeProperty('--warning-dark');
      return { hay: true, cual: caja.className, antesFondo, antesTinta, fondo, tinta,
               vuelve: getComputedStyle(caja).backgroundColor === antesFondo };
    `);
    juzgar(
      obedece.hay === true && obedece.fondo === SONDA && obedece.tinta === SONDA,
      'P16 · ⭐ el aviso ámbar OBEDECE al token `warning` — se le mueve y se mueve',
      obedece.hay === false
        ? '(no hay aviso en este viaje)'
        : `${obedece.cual} · al poner el token en magenta: fondo ${obedece.fondo}, tinta ${obedece.tinta} · ` +
          `(en reposo eran ${obedece.antesFondo} y ${obedece.antesTinta})`,
    );
    juzgar(
      obedece.hay === true && obedece.vuelve === true,
      'P16 · y la sonda no deja rastro: al soltar el token vuelve a su ámbar',
      obedece.hay === false ? '(no hay aviso)' : `vuelve: ${obedece.vuelve}`,
    );
    // Y el valor de reposo, al acta: que el ámbar siga siendo EL MISMO de
    // siempre después del cambio, no uno parecido.
    juzgar(
      ambar.hay === true && ambar.fondo === ambar.tokenFondo && ambar.tinta === ambar.tokenTinta,
      'P16 · y el ámbar no ha cambiado de color al cambiar de dueño',
      ambar.hay === false
        ? '(no hay aviso en este viaje)'
        : `fondo ${ambar.fondo} = token ${ambar.tokenFondo} · tinta ${ambar.tinta} = token ${ambar.tokenTinta}`,
    );
    juzgar(
      ambar.hay === true && ambar.cajas.every((c) => c.d === trazadoDelFichero('warning')),
      'P16 · y el ⚠ de TODAS las cajas ámbar es ahora el SVG `warning` del fichero',
      ambar.hay === false
        ? '(no hay aviso en este viaje)'
        : ambar.cajas
            .map((c) => `${c.cual}: ${c.d === null ? 'SIN ICONO' : c.d === trazadoDelFichero('warning') ? 'ok' : 'OTRO dibujo'}`)
            .join(' · '),
    );
    // ⚠️ ESTE TÍTULO MINTIÓ (13/09, nº50). Decía «es el mismo aviso dicho en dos
    //    sitios» y dio OK con el desvío de la 35 arriba y el HORARIO abajo: mide
    //    el VESTIDO de las cajas, no lo que dicen. Lo que dicen lo compra la P20.
    juzgar(
      ambar.hay === true && new Set(ambar.cajas.map((c) => c.fondo + c.tinta)).size === 1,
      'P16 · y todas las cajas ámbar se visten igual (el vestido; lo que dicen, en la P20)',
      ambar.hay === false
        ? '(no hay aviso)'
        : `${ambar.cuantas} cajas · ` + [...new Set(ambar.cajas.map((c) => `${c.fondo} sobre ${c.tinta}`))].join(' | '),
    );
    await m.guardar(`${CAPTURAS}/cabecera-y-ambar.png`);

    // ═══════════ P17 · LOS BADGES, POR LA VARA DEL CONTORNO ═══════════
    //
    // ⭐ [ORDEN de Antonio, 12/09] la caída al badge neutro queda RETIRADA: el
    //    `route_color` no se toca y el número va blanco con trazo negro. Con lo
    //    cual **esta jueza no puede medir el par ingenuo del feed**: 27 de las 53
    //    líneas de Zaragoza no llegan a 4,5:1 obedeciendo al feed, y medirlas
    //    así daría rojo sobre una pintura que es correcta a propósito.
    //
    // La vara es la del contorno, que es literal de [WCAG · Understanding
    // 1.4.3]: *«cuando hay un borde alrededor de la letra, el borde añade
    // contraste y se usa al calcular»*. `contrasteReal` ya lo sabe hacer — le
    // pregunta a la página si hay `-webkit-text-stroke` y, si lo hay, mide
    // relleno contra halo en vez de relleno contra fondo. Eso es lo que da el
    // suelo de 4,58:1 para cualquier color imaginable.
    const cuantosChips = await m.evaluar(`document.querySelectorAll('.chip-linea').length`);
    juzgar(cuantosChips > 0, 'P17 · hay chips de línea que medir', `${cuantosChips} chips`);
    for (let i = 0; i < cuantosChips; i++) {
      const chip = await contrasteSiEsta(m, '.chip-linea', { indice: i, minimo: 12 });
      juzgar(
        chip !== null && chip.contraste >= AA_TEXTO,
        `P17 · ⭐ el chip «${chip === null ? '?' : chip.etiqueta}» se lee POR EL CONTORNO`,
        chip === null
          ? '(no está)'
          : `${chip.contraste.toFixed(2)}:1 · ${chip.conHalo ? 'con trazo, medido relleno contra halo' : 'SIN TRAZO — medido contra el fondo del feed'} · ` +
            `${enRgb(chip.texto)} sobre ${enRgb(chip.fondo)}`,
      );
    }
  } finally {
    m.cerrar();
  }
}

// ═══════════ P19 · LA RONDA DEL OJO: RAYAS, FILO, AIRE Y HOVER ═══════════
//
// ⭐ [ANTONIO, 12/09] cuatro cosas que se ven mirando y que ninguna medida de
//    esta casa preguntaba. Es la continuación de la ley de la nº49: las juezas
//    compran piezas, y lo que se estropea es la relación entre ellas.
//
// ⚠️ La raya NO se busca por clase sino POR SU BORDE: se recorre el paso y se
//    coge el elemento que de verdad lleva `border-bottom`. Así la jueza vale
//    antes y después del cambio —hoy la lleva el cuerpo, mañana la fila— y no
//    hay que reescribirla para que siga comprando lo mismo.
{
  const m = await abrirChrome({ ancho: 1440, alto: 1000, puerto: 9417 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ LA RONDA DEL OJO ═══');

    const escribir = async (i, texto) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
        if (!c) return;
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(900);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via')[${i}];
        const o = [...c.querySelectorAll('[role=option]')][0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(700);
    };
    const portal = async (i, num) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal input')[${i}];
        if (!c) return;
        c.focus();
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(600);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal')[${i}];
        const ops = [...c.querySelectorAll('[role=option]')];
        const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(500);
    };

    await escribir(0, 'COLOSO');
    await portal(0, '2');
    await escribir(1, 'CALLE OVIEDO');
    await portal(1, '5');
    // El bus: es el modo que mezcla pasos CON distancia y pasos SIN ella —los
    // hitos valen 0 y no la escriben—, que es justo donde el filo se torcía.
    await m.evaluar(`document.querySelector('input[name=familia][value=bus]').click()`);
    await m.dormir(500);
    await m.evaluar(`document.querySelector('button.generar').click()`);
    for (let i = 0; i < 80 && (await m.evaluar(`!!document.querySelector('button.generar')?.disabled`)); i++) {
      await m.dormir(300);
    }
    await m.dormir(1500);

    const geometria = await leer(m, `
      const px = (n) => Math.round(n * 100) / 100;
      const pasos = [...document.querySelectorAll('.paso')];
      const rayas = [];
      const filos = [];
      const columnas = [];
      pasos.forEach((p, i) => {
        // ⭐ El elemento que LLEVA la raya, sea quien sea — pero SOLO entre el
        //    paso y sus hijos directos.
        //
        // ⚠️ La primera versión miraba todos los descendientes y recogía tres
        //    bordes que no son rayas: el del chip de línea —rgba(0,0,0,0.25),
        //    que existe para que un chip casi blanco no se disuelva— y el del
        //    botón «Próximo bus». Daba «6 finales distintos» mezclando la raya
        //    con la orla de una insignia. Un hijo directo del paso es una
        //    COLUMNA de la fila; lo de más adentro es decoración de su
        //    contenido, y no separa nada.
        const conBorde = [p, ...p.children].filter((e) => {
          const s = getComputedStyle(e);
          return parseFloat(s.borderBottomWidth) > 0 && s.borderBottomStyle !== 'none';
        });
        for (const e of conBorde) {
          const b = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          rayas.push({ paso: i, que: e.tagName.toLowerCase() + '.' + (String(e.className).split(' ')[0] || '?'),
                       izq: px(b.left), der: px(b.right), color: s.borderBottomColor, grosor: s.borderBottomWidth });
        }
        const cuerpo = p.querySelector('.paso__cuerpo');
        if (cuerpo) filos.push({ paso: i, der: px(cuerpo.getBoundingClientRect().right) });
        const col = p.querySelector('.paso__metros');
        columnas.push(col === null
          ? { paso: i, hay: false }
          : { paso: i, hay: true, ancho: px(col.getBoundingClientRect().width),
              texto: (col.textContent || '').trim() });
      });
      // ⚠️ EL «BORDE DERECHO DE LA FILA» YA NO ES EL DE LA CAJA DEL PASO
      //    (12/09). Desde que la banda de realce se gana su aire con margen
      //    negativo, esa caja llega 1 rem más allá por cada lado —0→543— y
      //    comparar contra ella pedía una raya que tocase el filo del panel, o
      //    sea justo lo contrario de lo que el aire viene a arreglar. El final
      //    que de verdad se compró es EL DE LA ÚLTIMA COLUMNA: la raya llega
      //    hasta donde acaba la distancia, no hasta donde acaba el texto.
      //
      // ⚠️ Y sin comillas invertidas en este comentario: vive dentro de un
      //    literal de plantilla y una sola lo cierra. Van tres veces.
      const ultima = pasos.length ? pasos[0].querySelector('.paso__metros') : null;
      return { pasos: pasos.length, rayas, filos, columnas,
               fila: px(ultima ? ultima.getBoundingClientRect().right : 0),
               tokenBorde: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() };
    `);

    const izqs = [...new Set(geometria.rayas.map((r) => r.izq))];
    const ders = [...new Set(geometria.rayas.map((r) => r.der))];
    juzgar(
      geometria.rayas.length >= geometria.pasos - 1,
      'P19 · hay rayas separadoras que juzgar',
      `${geometria.rayas.length} rayas en ${geometria.pasos} pasos`,
    );
    juzgar(
      izqs.length === 1,
      'P19 · ⭐ todas las rayas ARRANCAN en el mismo sitio',
      izqs.length === 1 ? `todas en x=${izqs[0]}` : `${izqs.length} arranques distintos: ${izqs.join(', ')}`,
    );
    juzgar(
      ders.length === 1,
      'P19 · ⭐ y todas ACABAN en el mismo sitio',
      ders.length === 1 ? `todas en x=${ders[0]}` : `${ders.length} finales distintos: ${ders.join(', ')}`,
    );
    juzgar(
      ders.length === 1 && Math.abs(ders[0] - geometria.fila) <= 1,
      'P19 · y ese final es el de la ÚLTIMA COLUMNA, no donde acabe el texto',
      `raya hasta ${ders.join('/')} · la columna de distancias acaba en ${geometria.fila}`,
    );
    juzgar(
      [...new Set(geometria.rayas.map((r) => r.grosor))].length === 1 &&
        [...new Set(geometria.rayas.map((r) => r.color))].length === 1,
      'P19 · y todas son la misma raya: mismo grosor y mismo color',
      `${[...new Set(geometria.rayas.map((r) => r.grosor))].join('/')} · ` +
        `${[...new Set(geometria.rayas.map((r) => r.color))].join(' | ')}`,
    );

    // ⭐ EL FILO DERECHO DE LOS CUERPOS, que es lo que la columna reservada
    //    endereza: hoy el cuerpo se estira cuando el paso no trae distancia.
    const filos = [...new Set(geometria.filos.map((f) => f.der))];
    juzgar(
      filos.length === 1,
      'P19 · ⭐ todos los cuerpos acaban en el mismo filo',
      filos.length === 1
        ? `todos en x=${filos[0]}`
        : `${filos.length} filos: ` + geometria.filos.map((f) => `${f.paso}→${f.der}`).join(' '),
    );

    // ⭐ Y LA COLUMNA DE DISTANCIAS, RESERVADA EN TODOS — también vacía.
    const sinColumna = geometria.columnas.filter((c) => !c.hay).map((c) => c.paso);
    const anchos = [...new Set(geometria.columnas.filter((c) => c.hay).map((c) => c.ancho))];
    juzgar(
      sinColumna.length === 0,
      'P19 · ⭐ la columna de distancias existe en TODOS los pasos, con dato o sin él',
      sinColumna.length === 0
        ? `${geometria.columnas.length} de ${geometria.columnas.length}`
        : `faltan en los pasos ${sinColumna.join(', ')}`,
    );
    juzgar(
      anchos.length === 1,
      'P19 · y todas miden lo mismo',
      anchos.length === 1
        ? `${anchos[0]} px · valores: ` +
          geometria.columnas.map((c) => (c.hay ? `«${c.texto || '(vacía)'}»` : '(no está)')).join(' ')
        : `${anchos.length} anchos: ${anchos.join(', ')}`,
    );

    // ⭐ EL AIRE ENTRE EL CHIP Y EL TEXTO [maqueta: `gap-2`, o sea 0,5rem].
    // ⚠️ **Y AQUÍ NO VALE `getBoundingClientRect` DEL TEXTO**, que fue el primer
    //    intento y devolvía **−43 px de aire**: `.paso__texto` es un `<span>` en
    //    línea que envuelve en tres renglones, y su caja es la UNIÓN de los tres
    //    —o sea, empieza en el margen izquierdo del párrafo, muy a la izquierda
    //    del chip—. La pregunta no es dónde empieza el bloque de texto: es dónde
    //    empieza EL PRIMER CARÁCTER. Eso se pide con un `Range` sobre el primer
    //    nodo de texto y su primer rectángulo de línea.
    //
    // ACTA 14/09 [encargo de las cinco líneas, mitad 2]: medía del chip a la
    //    primera letra de la frase corrida (.paso__frase / .paso__texto), y los
    //    pasos con chip ya no la llevan: el chip vive en la L1, con la marca y la
    //    acción. Mordió con «(ningún paso con chip)». La vara no cambia —8 px—:
    //    se mide del chip a lo PRIMERO que se pinta detrás en su línea —otro
    //    chip, el icono de la marca o la acción—. Aquí sí vale la caja: en una
    //    fila flexible cada pieza es un bloque y no envuelve dentro de otra. Si
    //    lo que sigue ha bajado de renglón, ahí no hay hueco que medir.
    const aire = await leer(m, `
      const huecos = [];
      for (const chip of document.querySelectorAll('.hito__l1 .chip-linea')) {
        const sigue = chip.nextElementSibling;
        if (!sigue) continue;
        const c = chip.getBoundingClientRect();
        const s = sigue.getBoundingClientRect();
        if (s.top >= c.bottom) continue;
        huecos.push(Math.round((s.left - c.right) * 100) / 100);
      }
      return { huecos };
    `);
    juzgar(
      aire.huecos.length > 0 && aire.huecos.every((h) => h >= 8),
      'P19 · ⭐ el chip de línea respira: al menos el `gap-2` de la maqueta (8 px)',
      aire.huecos.length === 0 ? '(ningún paso con chip)' : `huecos medidos: ${aire.huecos.join(', ')} px`,
    );
    await m.guardar(`${CAPTURAS}/rayas-y-filo.png`);

    // ⭐ EL HOVER DEL PASO, Y SU GEMELO DEL TECLADO.
    //
    // ⚠️ El fondo se mide con el ratón puesto encima DE VERDAD
    //    (`Input.dispatchMouseEvent`): un `:hover` no se dispara con un evento
    //    sintético de JavaScript. Y se mide antes y después, que es la
    //    contraprueba: si el reposo y el hover devuelven lo mismo, no hay hover
    //    por mucho que la regla esté escrita.
    const fondoDelPaso = async () =>
      m.evaluar(`getComputedStyle(document.querySelectorAll('.paso')[1]).backgroundColor`);
    const enReposo = await fondoDelPaso();
    const caja = JSON.parse(
      await m.evaluar(`(() => { const c = document.querySelectorAll('.paso')[1].getBoundingClientRect();
        return JSON.stringify({ x: Math.round(c.x + c.width / 2), y: Math.round(c.y + c.height / 2) }); })()`),
    );
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: caja.x, y: caja.y });
    await m.dormir(250);
    const conRaton = await fondoDelPaso();
    juzgar(
      conRaton !== enReposo,
      'P19 · ⭐ el paso se enciende con el ratón encima',
      `reposo ${enReposo} → con ratón ${conRaton}`,
    );

    // ⭐ Y LA BANDA RESPIRA [ANTONIO, 12/09, con la captura delante].
    //
    // ⚠️ La primera banda salió pegada a todo: el icono apurado contra el filo
    //    izquierdo y la distancia contra el derecho, sin un pelo de aire. Un
    //    realce que muerde lo que realza se lee como un recorte, no como un
    //    subrayado.
    //
    // Se compran las dos cosas que pidió: que la banda ABARQUE la fila entera
    // —el carril del icono DENTRO, no fuera— y que dentro quede aire a los dos
    // lados. El paso de aire no se inventa: es el `gap` que la propia fila ya
    // usa entre el carril y el cuerpo, 1 rem.
    const AIRE = 16;
    const banda = await leer(m, `
      const px = (n) => Math.round(n * 100) / 100;
      const p = document.querySelectorAll('.paso')[1];
      const b = p.getBoundingClientRect();
      const carril = p.querySelector('.paso__carril').getBoundingClientRect();
      const metros = p.querySelector('.paso__metros').getBoundingClientRect();
      const scroll = p.closest('.bloque__cuerpo');
      return {
        banda: px(b.left) + '→' + px(b.right), ancho: px(b.width),
        aireIzq: px(carril.left - b.left),
        aireDer: px(b.right - metros.right),
        carrilDentro: carril.left >= b.left - 0.5 && carril.right <= b.right + 0.5,
        desborda: scroll ? scroll.scrollWidth - scroll.clientWidth : 0,
      };
    `);
    juzgar(
      banda.carrilDentro === true,
      'P19 · ⭐ y la banda abarca la fila entera: el carril del icono queda DENTRO',
      `banda ${banda.banda} (${banda.ancho} px) · el carril dentro: ${banda.carrilDentro}`,
    );
    juzgar(
      banda.aireIzq >= AIRE && banda.aireDer >= AIRE,
      'P19 · ⭐ y respira: aire a los dos lados, el mismo paso que usa la fila',
      `izquierda ${banda.aireIzq} px · derecha ${banda.aireDer} px · el paso es ${AIRE}`,
    );
    // ⚠️ Y que el aire no se pague con una barra horizontal: la banda se gana
    //    el sitio con margen negativo, y un margen negativo mal medido saca
    //    scroll al panel entero.
    juzgar(
      banda.desborda === 0,
      'P19 · y el sitio de la banda no se paga con una barra de desplazamiento',
      `sobra a lo ancho: ${banda.desborda} px`,
    );
    await m.guardar(`${CAPTURAS}/paso-hover.png`);

    // El gemelo del teclado. Se pulsa una tecla DE VERDAD antes de mover el
    // foco: [DOC MDN · :focus-visible] el navegador decide por la modalidad de
    // la última interacción, así que un `focus()` a secas tras un clic no lo
    // dispara — y ése es justo el camino real, porque a `.paso` solo se llega
    // por programa desde el resumen.
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
    await m.dormir(150);
    await m.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, key: 'Tab' });
    await m.cdp('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab' });
    await m.dormir(150);
    const conFoco = await leer(m, `
      const p = document.querySelectorAll('.paso')[1];
      p.focus();
      return { fondo: getComputedStyle(p).backgroundColor, visible: p.matches(':focus-visible') };
    `);
    juzgar(
      conFoco.visible === true && conFoco.fondo !== enReposo,
      'P19 · ⭐ y el teclado ve lo mismo: `:focus-visible` enciende igual que el ratón',
      `:focus-visible ${conFoco.visible} · fondo ${conFoco.fondo} (reposo ${enReposo})`,
    );
    // Y con el mismo aire: es la misma banda, no una parecida.
    const bandaFoco = await leer(m, `
      const px = (n) => Math.round(n * 100) / 100;
      const p = document.querySelectorAll('.paso')[1];
      const b = p.getBoundingClientRect();
      const carril = p.querySelector('.paso__carril').getBoundingClientRect();
      const metros = p.querySelector('.paso__metros').getBoundingClientRect();
      return { aireIzq: px(carril.left - b.left), aireDer: px(b.right - metros.right) };
    `);
    juzgar(
      bandaFoco.aireIzq >= AIRE && bandaFoco.aireDer >= AIRE,
      'P19 · y la banda del foco respira igual que la del ratón',
      `izquierda ${bandaFoco.aireIzq} px · derecha ${bandaFoco.aireDer} px`,
    );
    await m.guardar(`${CAPTURAS}/paso-foco.png`);

    // ═══════ P19-bis · LA RUTA QUE NINGUNA JUEZA PISABA ═══════
    //
    // ⭐ [12/09] Esto sale de leer la hoja, no de mirar la pantalla. `.sugerencia`
    //    —el atajo «Sugerir zona naranja»— llevaba las MISMAS dos declaraciones
    //    que reventaron el paso en la nº49: `flex: 1 0 100%` y una sangría de
    //    2,2rem escritas para la fila que envolvía. Y ninguna jueza pasaba por
    //    ahí: ese botón solo existe en coche CON zona de aparcamiento elegida, y
    //    tanto la P18 como el resto del timeline corren sobre el bus.
    //
    // ⚠️ Del `flex` nos salvó algo que conviene tener escrito, porque es LO
    //    CONTRARIO de la trampa que ha mordido cinco veces en esta casa: Angular
    //    no reescribe `.paso__cuerpo > *` dejando el universal, lo reescribe
    //    como `.paso__cuerpo[_ng] > [_ng]`, o sea (0,3,0), y eso GANA a
    //    `.sugerencia[_ng]`, que es (0,2,0). Preguntado a la página, no deducido:
    //    las dos reglas casan y la que manda es la del cuerpo.
    //
    // La sangría no la salvó nadie: 35 px medidos, apuntando a una columna que
    // ya no existe. Lo que compra esta jueza es el FILO IZQUIERDO — que todo lo
    // que cuelga del cuerpo empiece donde empieza el cuerpo—, que es la pareja
    // del filo derecho de arriba y lo que caza este tipo de resto.
    await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[0].click()`);
    await m.dormir(400);
    await m.evaluar(`document.querySelector('input[name=familia][value=coche]').click()`);
    await m.dormir(700);
    await m.evaluar(`document.querySelector('input[name=aparcamiento][value=azul]').click()`);
    await m.dormir(400);
    await m.evaluar(`document.querySelector('button.generar').click()`);
    for (let i = 0; i < 80 && (await m.evaluar(`!!document.querySelector('button.generar')?.disabled`)); i++) {
      await m.dormir(300);
    }
    await m.dormir(1500);

    const enCoche = await leer(m, `
      const px = (n) => Math.round(n);
      const sangrias = [];
      for (const cuerpo of document.querySelectorAll('.paso__cuerpo')) {
        const izq = cuerpo.getBoundingClientRect().left;
        for (const hijo of cuerpo.children) {
          const b = hijo.getBoundingClientRect();
          if (b.width === 0 && b.height === 0) continue;
          const d = px(b.left - izq);
          if (d !== 0) sangrias.push((String(hijo.className).split(' ')[0] || '?') + ' a ' + d + 'px');
        }
      }
      const fugados = [];
      [...document.querySelectorAll('.paso')].forEach((p, i) => {
        const suya = p.getBoundingClientRect();
        for (const h of p.querySelectorAll('*')) {
          const b = h.getBoundingClientRect();
          if (b.height === 0 && b.width === 0) continue;
          if (b.bottom > suya.bottom + 1) {
            fugados.push(i + ':' + (String(h.className).split(' ')[0] || h.tagName.toLowerCase()) + ' sobra ' + px(b.bottom - suya.bottom));
          }
        }
      });
      return { atajo: document.querySelector('.sugerencia') !== null, sangrias, fugados,
               pasos: document.querySelectorAll('.paso').length };
    `);
    juzgar(
      enCoche.atajo === true,
      'P19-bis · la ruta en coche con zona azul trae el atajo «Sugerir zona naranja»',
      enCoche.atajo ? `${enCoche.pasos} pasos, con atajo` : '(no ha salido el atajo: no se juzga nada)',
    );
    juzgar(
      enCoche.sangrias.length === 0,
      'P19-bis · ⭐ todo lo que cuelga del cuerpo arranca en el filo del cuerpo',
      enCoche.sangrias.length === 0 ? 'ni una sangría suelta' : enCoche.sangrias.join(' | '),
    );
    juzgar(
      enCoche.fugados.length === 0,
      'P19-bis · y aquí tampoco se sale nada de su paso (la nº49, en la otra ruta)',
      enCoche.fugados.length === 0 ? `${enCoche.pasos} pasos revisados` : enCoche.fugados.join(' | '),
    );
    await m.guardar(`${CAPTURAS}/coche-atajo.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P20 · LOS AVISOS SIN REPETIR: LA MARCA Y EL RESUMEN ═══════════
//
// ⭐ [ANTONIO, 13/09, fase B] la tira ámbar que repetía el aviso entero en el
//    paso MUERE [alert fatigue]. El paso afectado lleva una MARCA CORTA junto al
//    chip —icono `warning` + «desviada»—; el hecho y su lista, arriba, en un
//    renglón por línea y con un solo «detalles».
//
// ⚠️ EL SUJETO: el desvío es dato VIVO de Avanza, y el día que ninguna línea de
//    esta ruta vaya desviada la jueza no tendría a quién medir. Así que si la
//    respuesta no trae desvío, SE SIEMBRA uno en ella —en la respuesta XHR,
//    antes de que Angular la lea— y el acta dice cuál de los dos se midió. Se
//    siembra en la línea de la primera subida, con la forma del motor.
//
// ⚠️ Y nace de un fallo: con la línea base de esta fase, sobre esta ruta, la
//    P16 dio «es el mismo aviso dicho en dos sitios · 3 cajas» con el desvío de
//    la 35 tapado por su horario de festivo y sin un solo «detalles» en la
//    página. Nº50 de docs/BITACORA.md.
{
  const m = await abrirChrome({ ancho: 1440, alto: 1000, puerto: 9420 });
  try {
    await m.ir(APP, 6000);
    console.log('\n═══ LOS AVISOS SIN REPETIR ═══');

    // La siembra, sobre FETCH.
    //
    // ⚠️ La primera versión la puso sobre XMLHttpRequest, deducido de leer
    //    app.config.ts —provideHttpClient() sin withFetch()— y NO se enteró de
    //    ninguna respuesta. Preguntado a la página: la app pide con fetch
    //    («fetch /api/vias?q=COLOSO»). En Angular 22 fetch es lo que hay por
    //    defecto. Lo que se lee en la configuración no es lo que corre.
    //
    // OJO: esto va dentro de una plantilla de JS, así que en sus comentarios
    // no puede haber ni una comilla invertida.
    await m.evaluar(`(() => {
      const pedir = window.fetch;
      window.fetch = async function (...args) {
        const respuesta = await pedir.apply(this, args);
        const url = String(args[0]?.url ?? args[0]);
        if (!url.includes('/api/ruta') || !respuesta.ok) return respuesta;
        const texto = cambiar(await respuesta.clone().text());
        return new Response(texto, {
          status: respuesta.status,
          statusText: respuesta.statusText,
          headers: respuesta.headers,
        });
      };
      const cambiar = (texto) => {
        const cuerpo = JSON.parse(texto);
        const t = cuerpo.trayecto ?? cuerpo;
        if (!t || !Array.isArray(t.avisos) || !Array.isArray(t.pasos)) return texto;
        if (t.avisos.some((a) => a.texto.includes('va hoy desviada'))) {
          window.__desvio = 'vivo';
          return texto;
        }
        const sube = t.pasos.find((p) => p.giro === 'sube');
        const via = sube && sube.partes.find((x) => x.papel === 'via');
        if (!via) return texto;
        t.avisos.unshift({ texto: 'La línea ' + via.texto + ' va hoy desviada: no para en Poste Sembrado 1: para provisionalmente en Poste Sembrado 2.' });
        window.__desvio = 'sembrado en la ' + via.texto;
        return JSON.stringify(cuerpo);
      };
      window.__sembrarParaProbar = cambiar;
    })()`);

    // ⭐ AUTOPRUEBA DE LA SIEMBRA. El día que haya desvío vivo —el 13/09 lo
    //    había— la rama que siembra no corre, y un instrumento con una mitad
    //    que no se ejecuta es una mitad sin vigilar. Se le da un cuerpo SIN
    //    desvío y otro CON, y se mira que siembre en el primero y no en el otro.
    const autoprueba = await leer(m, `
      const sin = { trayecto: { avisos: [], pasos: [{ giro: 'sube', partes: [{ papel: 'via', texto: '42' }] }] } };
      const con = { trayecto: { avisos: [{ texto: 'La línea 42 va hoy desviada: no para en X.' }], pasos: sin.trayecto.pasos } };
      const antes = window.__desvio;
      const a = JSON.parse(window.__sembrarParaProbar(JSON.stringify(sin)));
      const b = JSON.parse(window.__sembrarParaProbar(JSON.stringify(con)));
      window.__desvio = antes;
      return { siembra: a.trayecto.avisos.map((x) => x.texto), respeta: b.trayecto.avisos.length };
    `);
    juzgar(
      autoprueba.siembra.length === 1 && autoprueba.siembra[0].startsWith('La línea 42 va hoy desviada') && autoprueba.respeta === 1,
      'P20 · autoprueba: la siembra siembra donde no hay desvío y respeta donde lo hay',
      `sin desvío → «${autoprueba.siembra[0] ?? '(nada)'}» · con desvío → ${autoprueba.respeta} aviso`,
    );

    const escribir = async (i, texto) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
        if (!c) return;
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(900);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-autocompletar-via')[${i}];
        const o = [...c.querySelectorAll('[role=option]')][0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(700);
    };
    const portal = async (i, num) => {
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal input')[${i}];
        if (!c) return;
        c.focus();
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await m.dormir(600);
      await m.evaluar(`(() => {
        const c = document.querySelectorAll('app-selector-portal')[${i}];
        const ops = [...c.querySelectorAll('[role=option]')];
        const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
        if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
      })()`);
      await m.dormir(500);
    };

    await escribir(0, 'COLOSO');
    await portal(0, '2');
    await escribir(1, 'CALLE OVIEDO');
    await portal(1, '5');
    await m.evaluar(`document.querySelector('input[name=familia][value=bus]').click()`);
    await m.dormir(500);
    await m.evaluar(`document.querySelector('button.generar').click()`);
    for (let i = 0; i < 80 && (await m.evaluar(`!!document.querySelector('button.generar')?.disabled`)); i++) {
      await m.dormir(300);
    }
    await m.dormir(1500);

    const avisos = await leer(m, `
      const t = (e) => (e?.textContent ?? '').replace(/\\s+/g, ' ').trim();
      const marcas = [...document.querySelectorAll('.paso__marca')];
      const m0 = marcas[0];
      const svg = m0?.querySelector('svg');
      const renglones = [...document.querySelectorAll('.resumen__linea')];
      return {
        desvio: window.__desvio ?? null,
        marcas: marcas.length,
        palabra: t(m0),
        d: svg?.querySelector('path')?.getAttribute('d') ?? null,
        callado: svg?.getAttribute('aria-hidden') ?? null,
        junto: m0?.previousElementSibling?.classList.contains('chip-linea') ?? false,
        chip: t(m0?.previousElementSibling),
        fondoMarca: m0 ? getComputedStyle(m0).backgroundColor : null,
        tirasDeDesvio: [...document.querySelectorAll('.paso__nota')].filter((n) => t(n).includes('va hoy desviada')).length,
        hrefs: renglones.map((r) => r.querySelector('a')?.getAttribute('href') ?? null).filter((h) => h !== null),
        renglones: renglones.length,
        detalles: document.querySelectorAll('.detalles').length,
        detallesArriba: document.querySelectorAll('.resumen .detalles').length,
        estado: document.querySelector('.resumen')?.getAttribute('role') ?? null,
      };
    `);
    juzgar(
      avisos.desvio !== null,
      'P20 · la ruta trae un desvío que medir',
      avisos.desvio === null ? '(ni vivo ni sembrado: la siembra no encontró subida)' : `desvío ${avisos.desvio}`,
    );
    juzgar(
      avisos.marcas >= 1 && avisos.palabra === 'desviada',
      'P20 · ⭐ el paso de la línea desviada lleva la marca «desviada»',
      `${avisos.marcas} marca(s) · «${avisos.palabra}»`,
    );
    juzgar(
      avisos.d !== null && avisos.d === trazadoDelFichero('warning') && avisos.callado === 'true',
      'P20 · y su icono es el `warning` del fichero, callado [1.4.1: color + icono + texto]',
      avisos.d === null ? '(sin icono)' : `${avisos.d === trazadoDelFichero('warning') ? 'idéntico al fichero' : 'DISTINTO del fichero'} · aria-hidden ${avisos.callado}`,
    );
    juzgar(
      avisos.junto === true,
      'P20 · ⭐ y va JUNTO AL CHIP de su línea',
      avisos.junto ? `justo detrás del chip «${avisos.chip}»` : 'lo que tiene delante no es un chip',
    );
    juzgar(
      avisos.tirasDeDesvio === 0 && avisos.fondoMarca === 'rgba(0, 0, 0, 0)',
      'P20 · ⭐ la tira ámbar del desvío ha muerto en los pasos, y la marca no la imita',
      `tiras con el desvío: ${avisos.tirasDeDesvio} · fondo de la marca ${avisos.fondoMarca}`,
    );

    const enReposo = await contrasteSiEsta(m, '.paso__marca', { minimo: 12 });
    juzgar(
      enReposo !== null && enReposo.contraste >= AA_TEXTO,
      'P20 · ⭐ la marca se lee: ≥ 4,5:1 en reposo',
      enReposo === null ? '(no hay marca que medir)' : `${enReposo.contraste.toFixed(2)}:1 · ${enRgb(enReposo.texto)} sobre ${enRgb(enReposo.fondo)}`,
    );
    await m.guardar(`${CAPTURAS}/fase-b-marca.png`);

    // ⭐ [ANTONIO, cierre de la fase B] el horario de festivo deja también su
    //    marca, «festivo». Se miran TODAS las marcas, no la primera: palabra
    //    permitida, ninguna tira de festivo en los pasos, y contraste de cada una.
    //    El festivo solo existe los días que el motor lo manda; el acta dice
    //    cuántas hubo.
    const todas = await leer(m, `
      const t = (e) => (e?.textContent ?? '').replace(/\\s+/g, ' ').trim();
      return {
        palabras: [...document.querySelectorAll('.paso__marca')].map(t),
        tirasDeFestivo: [...document.querySelectorAll('.paso__nota')].filter((n) => /Línea \\S+ hoy: /.test(t(n))).length,
      };
    `);
    juzgar(
      todas.palabras.every((p) => p === 'desviada' || p === 'festivo') && todas.tirasDeFestivo === 0,
      'P20 · ⭐ cada marca dice «desviada» o «festivo», y ningún horario de festivo deja tira',
      `marcas: ${todas.palabras.join(', ') || '(ninguna)'} · tiras de festivo: ${todas.tirasDeFestivo}`,
    );
    const contrastes = [];
    for (let i = 0; i < todas.palabras.length; i++) {
      const c = await contrasteSiEsta(m, '.paso__marca', { indice: i, minimo: 12 });
      contrastes.push(c === null ? null : c.contraste);
    }
    juzgar(
      contrastes.length > 0 && contrastes.every((c) => c !== null && c >= AA_TEXTO),
      'P20 · y TODAS se leen: ≥ 4,5:1 cada una',
      contrastes.map((c, i) => `«${todas.palabras[i]}» ${c === null ? '(no está)' : c.toFixed(2) + ':1'}`).join(' · '),
    );

    // Y sobre la banda del realce, que también la pinta: con el ratón DE VERDAD.
    const donde = await leer(m, `
      const e = document.querySelector('.paso__marca');
      if (!e) return null;
      const c = e.getBoundingClientRect();
      return { x: c.x + c.width / 2, y: c.y + c.height / 2 };
    `);
    let enBanda = null;
    let fondoBanda = null;
    if (donde !== null) {
      await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: donde.x, y: donde.y });
      await m.dormir(300);
      fondoBanda = await m.evaluar(`getComputedStyle(document.querySelector('.paso__marca').closest('.paso')).backgroundColor`);
      enBanda = await contrasteSiEsta(m, '.paso__marca', { minimo: 12 });
    }
    juzgar(
      enBanda !== null && fondoBanda === 'rgb(226, 232, 240)' && enBanda.contraste >= AA_TEXTO,
      'P20 · ⭐ y sobre la banda del realce, también ≥ 4,5:1',
      enBanda === null ? '(no hay marca que medir)' : `banda ${fondoBanda} · ${enBanda.contraste.toFixed(2)}:1 · ${enRgb(enBanda.texto)} sobre ${enRgb(enBanda.fondo)}`,
    );
    await m.guardar(`${CAPTURAS}/fase-b-marca-banda.png`);
    await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });

    juzgar(
      avisos.hrefs.length > 0 && new Set(avisos.hrefs).size === avisos.hrefs.length,
      'P20 · ⭐ el resumen: un renglón por línea, ninguno repite destino',
      `${avisos.renglones} renglones · destinos ${avisos.hrefs.join(' ')}`,
    );
    juzgar(
      avisos.detalles === 1 && avisos.detallesArriba === 1,
      'P20 · ⭐ un solo «detalles» en toda la página, y está arriba',
      `${avisos.detalles} en la página · ${avisos.detallesArriba} en el resumen`,
    );
    const abre = await leer(m, `
      const b = document.querySelector('.resumen .detalles');
      if (!b) return null;
      b.scrollIntoView({ block: 'center' });
      b.click();
      return null;
    `).then(() => m.dormir(300)).then(() => leer(m, `
      const c = document.querySelector('.resumen .detalles__cuerpo');
      return c ? { visible: getComputedStyle(c).display !== 'none', texto: c.textContent.trim().slice(0, 60) } : null;
    `));
    juzgar(
      abre !== null && abre.visible === true && abre.texto !== '',
      'P20 · y abre: la lista de postes se ve al pulsarlo',
      abre === null ? '(no hay lista)' : `visible ${abre.visible} · «${abre.texto}…»`,
    );
    await m.guardar(`${CAPTURAS}/fase-b-resumen-detalles.png`);
    juzgar(
      avisos.estado === 'status',
      'P20 · y la región del resumen sigue siendo role="status"',
      `role ${avisos.estado}`,
    );
  } finally {
    m.cerrar();
  }
}

// ═══════════ P21 · EL CSS NO PIDE UN PESO QUE NO EXISTE ═══════════
//
// ⭐ [ANTONIO, 13/09, cierre de la fase B; nº51] la app carga Inter en 400, 500
//    y 600, y así se queda. Pero cuatro reglas pedían 700, y un 700 sin cara
//    pinta el 600: medido, mismo ancho y misma tinta. El CSS decía negrita y la
//    pantalla enseñaba semibold, y la P16 lo daba por bueno leyendo el estilo
//    computado. Esta jueza compra que ningún peso declarado se quede sin cara.
//
// ⚠️ Solo las reglas que NO declaran su propia familia: el zoom de Leaflet
//    pide «bold 18px Lucida Console», y ese peso es de otra letra.
// ⚠️ Y `<strong>` NO entra: su 700 es del navegador, no de esta hoja.
{
  const m = await abrirChrome({ ancho: 1440, alto: 900, puerto: 9421 });
  try {
    await m.ir(APP, 5000);
    console.log('\n═══ LOS PESOS DE LA LETRA ═══');
    const pesos = await leer(m, `
      const caras = new Set();
      const pedidos = [];
      let otraFamilia = 0;
      const numero = (w) => (w === 'bold' ? '700' : w === 'normal' ? '400' : w);
      const recorrer = (reglas) => {
        for (const r of reglas) {
          if (r instanceof CSSFontFaceRule) {
            if (r.style.getPropertyValue('font-family').replace(/["']/g, '').trim() === 'Inter') {
              caras.add(numero(r.style.getPropertyValue('font-weight').trim()));
            }
          } else if (r.cssRules && !(r instanceof CSSStyleRule)) {
            recorrer(r.cssRules);
          } else if (r instanceof CSSStyleRule && r.style.fontWeight) {
            const familia = r.style.fontFamily;
            if (familia && !familia.includes('Inter') && !familia.includes('--font-sans') && familia !== 'inherit') {
              otraFamilia++;
              continue;
            }
            pedidos.push({ selector: r.selectorText.replace(/\\[_ng[^\\]]*\\]/g, ''), peso: numero(r.style.fontWeight) });
          }
        }
      };
      for (const hoja of document.styleSheets) {
        try { recorrer(hoja.cssRules); } catch { /* hoja ajena: no se puede leer */ }
      }
      const sinCara = pedidos.filter((p) => /^\\d+$/.test(p.peso) && !caras.has(p.peso));
      return { caras: [...caras].sort(), pedidos: pedidos.length, otraFamilia, sinCara };
    `);
    juzgar(
      pesos.caras.length > 0,
      'P21 · la hoja declara sus caras de Inter',
      `caras: ${pesos.caras.join(', ')}`,
    );
    juzgar(
      pesos.sinCara.length === 0,
      'P21 · ⭐ ninguna regla pide un peso de Inter que no se carga (nº51)',
      pesos.sinCara.length === 0
        ? `${pesos.pedidos} pesos declarados, todos con cara · ${pesos.otraFamilia} regla(s) con otra familia, fuera`
        : pesos.sinCara.map((p) => `${p.selector} → ${p.peso}`).join(' | '),
    );
  } finally {
    m.cerrar();
  }
}

// ═══════════ P22 · LA FASE C: LO CONTEXTUAL EN SU PUNTO, LA FICHA Y EL TERMINAL ═══════════
//
// ⭐ [ANTONIO, 14/09, tres resoluciones por doctrina]
//    (a) lo contextual —la BiZi que no contesta, la zona, el poste mudo— vive
//        SOLO en su tira: el resumen es para lo que afecta al viaje entero.
//    (b) el poste y la estación, como entidad: ficha de CONTORNO, icono +
//        número [WCAG 1.4.11 — la rellena perdía la forma sobre la banda].
//    (c) origen y destino: el círculo LLENO en primary, por primer y último
//        paso y no por el giro.
//
// ⚠️ EL SUJETO DE (a) SE SIEMBRA: un aviso contextual es dato vivo y hoy puede
//    no haber ninguno. Se añade a la respuesta de /api/ruta un aviso con
//    `paso` en la primera subida —la forma del de la ZBE—, y el acta lo dice.
//    La costura de la orden va dentro: nada del viaje se queda sin sitio.
//
// OJO: dentro de las plantillas de JS, ni una comilla invertida en los comentarios.
const SEMBRADO = 'Aviso de contexto sembrado por la jueza P22.';

async function viajeP22(m, modo) {
  // En un paso que NO es hito, la forma del aviso de la ZBE. La primera versión
  // sembraba en la primera subida y ahí tapaba al aviso MUDO del bus, que cae en
  // el mismo paso: la tira enseña una sola nota y el mudo se quedaba arriba.
  await generarCon(m, modo, `
      const HITOS = ['salida', 'sube', 'baja', 'transborda', 'coge', 'aparca', 'llegada'];
      const i = t.pasos.findIndex((p, k) => k > 0 && !HITOS.includes(p.giro));
      if (i >= 0) t.avisos.push({ texto: ${JSON.stringify(SEMBRADO)}, paso: i });
  `);
}

/**
 * COLOSO 2 → OVIEDO 5 en el modo que se diga, con la respuesta de /api/ruta
 * retocada por `siembra` —código que recibe el trayecto en `t`— y, si se da,
 * `vivo(url)` contestando por los botones vivos sin salir a la fuente.
 */
async function generarCon(m, modo, siembra, vivo = null, ajuste = '', generar = true) {
  await m.evaluar(`(() => {
    const pedir = window.fetch;
    window.fetch = async function (...args) {
      const url = String(args[0]?.url ?? args[0]);
      ${vivo === null ? '' : `if (url.includes('/api/poste-vivo') || url.includes('/api/estacion-viva')) {
        const cuerpo = (${vivo})(url);
        await new Promise((r) => setTimeout(r, 200));
        return new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'content-type': 'application/json' } });
      }`}
      const respuesta = await pedir.apply(this, args);
      if (!url.includes('/api/ruta') || !respuesta.ok) return respuesta;
      const cuerpo = JSON.parse(await respuesta.clone().text());
      const t = cuerpo.trayecto ?? cuerpo;
      ${siembra}
      return new Response(JSON.stringify(cuerpo), { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
    };
  })()`);
  const escribir = async (i, texto) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
      if (!c) return;
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await m.dormir(900);
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via')[${i}];
      const o = [...c.querySelectorAll('[role=option]')][0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    await m.dormir(700);
  };
  const portal = async (i, num) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal input')[${i}];
      if (!c) return;
      c.focus();
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await m.dormir(600);
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal')[${i}];
      const ops = [...c.querySelectorAll('[role=option]')];
      const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    await m.dormir(500);
  };
  await escribir(0, 'COLOSO');
  await portal(0, '2');
  await escribir(1, 'CALLE OVIEDO');
  await portal(1, '5');
  // La BiZi no es una familia: es la bici pública dentro de la familia bici.
  await m.evaluar(`document.querySelector('input[name=familia][value=${modo === 'bizi' ? 'bici' : modo}]').click()`);
  await m.dormir(600);
  if (modo === 'bizi') {
    await m.evaluar(`document.querySelector('input[name=bici][value=bizi]').click()`);
    await m.dormir(400);
  }
  // Lo que un modo pida antes de generar —la zona del coche en la P25—.
  if (ajuste) {
    await m.evaluar(ajuste);
    await m.dormir(400);
  }
  // Y sin generar, cuando quien llama quiere pulsar él —el hueso de la P25
  // necesita estrangular la red ENTRE el formulario y el clic—.
  if (!generar) return;
  await m.evaluar(`document.querySelector('button.generar').click()`);
  for (let i = 0; i < 100 && (await m.evaluar(`!!document.querySelector('button.generar')?.disabled`)); i++) {
    await m.dormir(300);
  }
  await m.dormir(1800);
}

/** El valor de un token de color, resuelto por el navegador, en rgb(). */
const tokenRgb = (m, token) =>
  m.evaluar(`(() => {
    const d = document.createElement('div');
    d.style.backgroundColor = 'var(--${token})';
    document.body.appendChild(d);
    const c = getComputedStyle(d).backgroundColor;
    d.remove();
    return c;
  })()`);
const aRgb = (css) => {
  const [r, g, b] = css.match(/\d+/g).map(Number);
  return { r, g, b };
};

/**
 * ⭐ LA BATERÍA DE ANCHOS (14/09): el caso de Antonio entra.
 *
 * Su pantalla es 1920×1080 en 32" al 100 %: ~69 PPI, píxel gordo. Lo que a 1440
 * en un portátil se ve con aire, allí se ve pegado — el «solape» del chip se
 * midió en 1,0 px y a esa densidad eso es cero. Se mide ahí además de en PC y
 * en móvil, que es donde se vio y no donde se sospechó.
 */
const PANTALLAS = [
  { id: 'antonio', nombre: 'ANTONIO 1920×1080', ancho: 1920, alto: 1080, puerto: 9424 },
  { id: 'pc', nombre: 'PC 1440', ancho: 1440, alto: 1000, puerto: 9422 },
  { id: 'movil', nombre: 'MÓVIL 390', ancho: 390, alto: 844, puerto: 9423 },
];

for (const pantalla of PANTALLAS) {
  const m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: pantalla.puerto });
  try {
    await m.ir(APP, 6000);
    console.log(`\n═══ LA FASE C · ${pantalla.nombre} ═══`);
    await viajeP22(m, 'bus');

    // ── (a) lo contextual, solo en su punto ──
    const a = await leer(m, `
      const t = (e) => (e?.textContent ?? '').replace(/\\s+/g, ' ').trim();
      const renglones = [...document.querySelectorAll('.resumen__linea')].map((l) => {
        const c = l.cloneNode(true);
        c.querySelectorAll('.detalles, .detalles__cuerpo').forEach((x) => x.remove());
        return t(c);
      });
      const tiras = [...document.querySelectorAll('.paso__nota')].map((n) => t(n.querySelector('.aviso-ruta__hecho') ?? n));
      return {
        sembrado: tiras.includes(${JSON.stringify(SEMBRADO)}),
        repetidas: tiras.filter((x) => renglones.some((r) => r.includes(x))),
        tiras: tiras.length,
        renglones,
      };
    `);
    juzgar(
      a.sembrado === true,
      `P22 · ${pantalla.id} · el aviso contextual sembrado sale en su paso, como tira`,
      a.sembrado ? `${a.tiras} tira(s) en los pasos` : '(no está en ningún paso)',
    );
    juzgar(
      a.sembrado === true && a.repetidas.length === 0,
      `P22 · ${pantalla.id} · ⭐ ninguna tira se repite en el resumen (a)`,
      a.repetidas.length === 0 ? `resumen: ${a.renglones.length} renglón(es) · ${a.renglones.map((r) => '«' + r.slice(0, 40) + '…»').join(' ')}` : a.repetidas.join(' | '),
    );
    await m.evaluar(`(document.querySelector('.resumen') ?? document.querySelector('.ruta')).scrollIntoView({ block: 'start' })`);
    await m.dormir(300);
    await m.guardar(`${CAPTURAS}/fase-c-${pantalla.id}-resumen.png`);

    // ── (b) la ficha de contorno ──
    const ficha = await leer(m, `
      const fichas = [...document.querySelectorAll('.ficha-entidad')];
      const f = fichas[0];
      if (!f) return { cuantas: 0 };
      f.scrollIntoView({ block: 'center' });
      const s = getComputedStyle(f);
      const r = f.getBoundingClientRect();
      const cuerpo = f.closest('.paso__cuerpo').getBoundingClientRect();
      return {
        cuantas: fichas.length,
        numero: f.textContent.trim(),
        icono: f.querySelector('svg path')?.getAttribute('d') ?? null,
        callado: f.querySelector('svg')?.getAttribute('aria-hidden') ?? null,
        borde: s.borderTopColor, anchoBorde: s.borderTopWidth, fondo: s.backgroundColor,
        alto: Math.round(r.height), cabe: r.right <= cuerpo.right + 0.5 && r.left >= cuerpo.left - 0.5,
        // El aire hasta la PRIMERA letra del nombre, con un Range: la caja de un
        // strong que envuelve es la unión de sus renglones y mentiría.
        aire: (() => {
          const nombre = f.nextElementSibling;
          const texto = nombre?.firstChild;
          if (!texto) return null;
          const rango = document.createRange();
          rango.setStart(texto, 0); rango.setEnd(texto, 1);
          const letra = rango.getClientRects()[0];
          if (!letra) return null;
          // Si el nombre empieza en el renglón de abajo, no hay aire que medir en esa línea.
          return Math.abs(letra.top - r.top) > r.height ? 'otra línea' : Math.round((letra.left - r.right) * 100) / 100;
        })(),
        sobraAncho: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    `);
    juzgar(
      ficha.cuantas >= 1 && /^\d+$/.test(ficha.numero) && ficha.icono === trazadoDelFichero('directions_bus') && ficha.callado === 'true',
      `P22 · ${pantalla.id} · ⭐ el poste lleva su ficha: icono del fichero, callado, y el número (b)`,
      ficha.cuantas === 0 ? '(no hay ficha)' : `${ficha.cuantas} ficha(s) · «${ficha.numero}» · icono ${ficha.icono === trazadoDelFichero('directions_bus') ? 'idéntico al fichero' : 'DISTINTO'} · aria-hidden ${ficha.callado}`,
    );
    juzgar(
      ficha.cuantas >= 1 && ficha.anchoBorde === '1px' && ficha.fondo === 'rgba(0, 0, 0, 0)',
      `P22 · ${pantalla.id} · y es de CONTORNO: borde de 1 px y sin relleno`,
      ficha.cuantas === 0 ? '(no hay ficha)' : `borde ${ficha.anchoBorde} ${ficha.borde} · fondo ${ficha.fondo}`,
    );
    // ⚠️ Nació de la captura, no de un número: la ficha salió PEGADA al nombre,
    //    «(33)Av. Academia», porque Angular quita el espacio en blanco entre dos
    //    etiquetas y el de la plantilla no llegaba a la pantalla. La prueba de
    //    unidad no lo veía: compra quién va detrás, no cuánto aire hay.
    juzgar(
      ficha.cuantas >= 1 && (ficha.aire === 'otra línea' || (typeof ficha.aire === 'number' && ficha.aire >= 4)),
      `P22 · ${pantalla.id} · ⭐ y entre la ficha y el nombre hay aire: al menos 4 px`,
      ficha.cuantas === 0 ? '(no hay ficha)' : `aire ${ficha.aire}${typeof ficha.aire === 'number' ? ' px' : ''}`,
    );
    // ⚠️ La costura de la orden: si no cabe en la anatomía del paso a 390, PARA.
    juzgar(
      ficha.cuantas >= 1 && ficha.cabe === true && ficha.alto <= 24 && ficha.sobraAncho === 0,
      `P22 · ${pantalla.id} · ⭐ la ficha cabe en su paso: dentro del cuerpo, en una línea y sin scroll lateral`,
      ficha.cuantas === 0 ? '(no hay ficha)' : `dentro ${ficha.cabe} · alto ${ficha.alto} px · sobra a lo ancho ${ficha.sobraAncho} px`,
    );
    if (pantalla.id === 'pc') {
      const card = aRgb(await tokenRgb(m, 'card'));
      // ⚠️ Leía `banda-cabecera`, el color que el realce tomaba prestado. Desde la
      //    tanda 6 el realce tiene token propio y se lee EL SUYO: si un día se
      //    separan, esta jueza tiene que medir el que pinta el paso.
      const banda = aRgb(await tokenRgb(m, 'superficie-realce'));
      const borde = ficha.cuantas ? aRgb(ficha.borde) : null;
      const enReposo = await contrasteSiEsta(m, '.ficha-entidad', { minimo: 8 });
      juzgar(
        enReposo !== null && enReposo.contraste >= AA_TEXTO && borde !== null && contrasteRgb(borde, card) >= AA_GRAFICO,
        'P22 · ⭐ en reposo: el número ≥ 4,5:1 y el borde ≥ 3:1 contra la tarjeta',
        enReposo === null ? '(no hay ficha)' : `número ${enReposo.contraste.toFixed(2)}:1 · borde ${contrasteRgb(borde, card).toFixed(2)}:1`,
      );
      await m.guardar(`${CAPTURAS}/fase-c-ficha-reposo.png`);
      const donde = await leer(m, `const r = document.querySelector('.ficha-entidad')?.getBoundingClientRect(); return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;`);
      let enBanda = null;
      let fondoPaso = null;
      if (donde) {
        await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: donde.x, y: donde.y });
        await m.dormir(300);
        fondoPaso = await m.evaluar(`getComputedStyle(document.querySelector('.ficha-entidad').closest('.paso')).backgroundColor`);
        enBanda = await contrasteSiEsta(m, '.ficha-entidad', { minimo: 8 });
      }
      juzgar(
        enBanda !== null && fondoPaso === `rgb(${banda.r}, ${banda.g}, ${banda.b})` && enBanda.contraste >= AA_TEXTO && contrasteRgb(borde, banda) >= AA_GRAFICO,
        'P22 · ⭐ sobre la banda del realce: el número ≥ 4,5:1 y el borde ≥ 3:1 — la forma no se pierde',
        enBanda === null ? '(no hay ficha)' : `banda ${fondoPaso} · número ${enBanda.contraste.toFixed(2)}:1 · borde ${contrasteRgb(borde, banda).toFixed(2)}:1`,
      );
      await m.guardar(`${CAPTURAS}/fase-c-ficha-banda.png`);
      await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 3, y: 3 });
      await m.dormir(200);
    }

    // ── (c) el círculo terminal ──
    const primary = await tokenRgb(m, 'primary');
    const primaryFg = await tokenRgb(m, 'primary-foreground');
    const c = await leer(m, `
      const origen = ${JSON.stringify(trazadoDelFichero('trip_origin'))};
      const pasos = [...document.querySelectorAll('.paso')];
      const circulos = pasos.map((p, i) => {
        const e = p.querySelector('.paso__circulo');
        const s = getComputedStyle(e);
        return { i, fondo: s.backgroundColor, tinta: s.color, deOrigen: e.querySelector('path')?.getAttribute('d') === origen };
      });
      return { circulos, ultimo: pasos.length - 1 };
    `);
    const llenos = c.circulos.filter((x) => x.fondo === primary).map((x) => x.i);
    const salidasDeEnMedio = c.circulos.filter((x) => x.deOrigen && x.i !== 0 && x.i !== c.ultimo);
    juzgar(
      llenos.length === 2 && llenos[0] === 0 && llenos[1] === c.ultimo &&
        c.circulos[0].tinta === primaryFg && c.circulos[c.ultimo].tinta === primaryFg,
      `P22 · ${pantalla.id} · ⭐ el círculo LLENO va en el primer y el último paso, y en ninguno más (c)`,
      `llenos en ${llenos.join(', ') || '(ninguno)'} de 0..${c.ultimo} · tinta ${c.circulos[0].tinta}`,
    );
    juzgar(
      salidasDeEnMedio.length > 0 && salidasDeEnMedio.every((x) => x.fondo !== primary),
      `P22 · ${pantalla.id} · y el trip_origin de mitad de ruta NO se llena: va por posición, no por giro`,
      salidasDeEnMedio.length === 0 ? '(esta ruta no trae salida a mitad: no se juzga)' : `${salidasDeEnMedio.length} salida(s) en medio, en ${salidasDeEnMedio.map((x) => x.i).join(', ')}, sin llenar`,
    );
    if (pantalla.id === 'pc') {
      const o = await contrasteSiEsta(m, '.paso__circulo', { indice: 0, minimo: 6 });
      const d = await contrasteSiEsta(m, '.paso__circulo', { indice: c.ultimo, minimo: 6 });
      juzgar(
        o !== null && d !== null && o.contraste >= AA_TEXTO && d.contraste >= AA_TEXTO,
        'P22 · ⭐ y su icono se lee: ≥ 4,5:1 en el origen y en el destino',
        o === null || d === null ? '(no hay círculos)' : `origen ${o.contraste.toFixed(2)}:1 · destino ${d.contraste.toFixed(2)}:1`,
      );
    }
    await m.evaluar(`document.querySelectorAll('.paso')[0].scrollIntoView({ block: 'start' })`);
    await m.dormir(300);
    await m.guardar(`${CAPTURAS}/fase-c-${pantalla.id}-origen.png`);
    await m.evaluar(`[...document.querySelectorAll('.paso')].at(-1).scrollIntoView({ block: 'end' })`);
    await m.dormir(300);
    await m.guardar(`${CAPTURAS}/fase-c-${pantalla.id}-destino.png`);
    await m.evaluar(`document.querySelector('.ficha-entidad')?.scrollIntoView({ block: 'center' })`);
    await m.dormir(300);
    await m.guardar(`${CAPTURAS}/fase-c-${pantalla.id}-ficha.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P23 · LAS CINCO LÍNEAS, EL AIRE Y LA ÚLTIMA VOZ ═══════════
//
// ⭐ [encargo de las cinco líneas, 14/09; bitácora nº53 y nº54]
//    · cada papel en su línea, de arriba abajo: L1 chip+acción · L2 ficha+lugar
//      · L3 datos · L4 botón+región — y ninguna caja pisa a otra dentro del
//      paso (la P18 miraba paso contra paso, nunca dentro).
//    · EL AIRE: entre un chip, una marca o una ficha y el renglón de encima o
//      de debajo, al menos 4,3 px — la vara que fijó la nº52. Hoy mide 1,0 px.
//    · L5: con la fuente muda sembrada, la región va vestida de advertencia y
//      no hay tira; y al contestar el botón, la advertencia se va.
//
// OJO: dentro de las plantillas de JS, ni una comilla invertida en los comentarios.
const AIRE_MINIMO = 4.3;

/** La sede o Avanza callados en el Generar, con la forma del motor del 14/09. */
const SIEMBRA_MUDA = {
  bus: `
    const i = t.pasos.findIndex((p) => p.giro === 'sube' && p.aQuienPreguntar);
    if (i >= 0) {
      const p = t.pasos[i];
      const vias = p.partes.filter((x) => x.papel === 'via');
      t.avisos = t.avisos.filter((a) => !/^(Avanza no anuncia|No hemos podido preguntar)/.test(a.texto));
      p.vivo = { clase: 'mudo', texto: 'No hemos podido preguntar cuándo pasa la línea ' + vias[0].texto + ' por este poste: disponibilidad no verificada.' };
      t.avisos.push({ texto: 'No hemos podido preguntar cuándo pasa la línea ' + vias[0].texto + ' por el poste ' + vias[vias.length - 1].texto + ': disponibilidad no verificada.' });
    }
  `,
  bizi: `
    t.avisos = t.avisos.filter((a) => !/^No hemos podido preguntar/.test(a.texto));
    t.pasos.forEach((p, i) => {
      if (p.giro !== 'coge' && p.giro !== 'aparca') return;
      const ultima = p.partes.map((x) => x.papel).lastIndexOf('via');
      p.partes = p.partes.slice(0, ultima + 1);
      p.texto = p.partes.map((x) => x.texto).join('');
      delete p.disponibilidad;
      const cosa = p.giro === 'coge' ? 'cuántas bicis hay' : 'cuántos anclajes libres hay';
      t.avisos.unshift({ texto: 'No hemos podido preguntar ' + cosa + ' en la estación ' + p.partes[ultima].texto + ' ahora mismo: disponibilidad no verificada.', paso: i });
    });
  `,
};
const VIVO_CON_EXITO = `(url) => /estacion-viva/.test(url)
  ? { clase: 'hay', texto: /pide=anclajes/.test(url) ? '7 anclajes libres a las 13:04' : '4 bicis disponibles a las 13:04' }
  : { clase: 'llega', texto: 'próximo en 3 min (dato de las 13:04)' }`;

/** Lo pintado de los pasos de cinco líneas: sus líneas, el aire y los solapes. */
const LO_DE_LAS_CINCO = `
  const t = (e) => (e?.textContent ?? '').replace(/\\s+/g, ' ').trim();
  const nombre = (el) => el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '');
  const ATOMOS = '.chip-linea, .paso__marca, .ficha-entidad';
  const PIEZAS = ATOMOS + ', .hito__accion, .hito__l3, .vivo__boton, .vivo__estado, .paso__nota';
  return [...document.querySelectorAll('.paso')].map((li, indice) => {
    if (!li.querySelector('.chip-linea, .ficha-entidad')) return null;
    const cajas = [];
    for (const el of li.querySelectorAll(PIEZAS)) for (const b of el.getClientRects()) if (b.width * b.height > 0) cajas.push({ que: nombre(el), el, b });
    const recorrer = document.createTreeWalker(li.querySelector('.paso__cuerpo'), NodeFilter.SHOW_TEXT);
    for (let n = recorrer.nextNode(); n; n = recorrer.nextNode()) {
      if (!n.data.trim() || n.parentElement.closest(PIEZAS)) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const b of r.getClientRects()) if (b.width * b.height > 0) cajas.push({ que: 'texto «' + n.data.trim().slice(0, 16) + '»', el: n.parentElement, b, texto: true });
    }
    // Los renglones de texto, también los de dentro de las piezas que son texto.
    for (const el of li.querySelectorAll('.hito__accion, .hito__l3, .vivo__estado')) {
      const r = document.createRange(); r.selectNodeContents(el);
      for (const b of r.getClientRects()) if (b.width * b.height > 0) cajas.push({ que: 'renglón de ' + nombre(el), el, b, texto: true });
    }
    let aire = Infinity, dondeAire = '';
    for (const X of cajas) {
      if (!X.el.matches(ATOMOS)) continue;
      for (const T of cajas) {
        if (!T.texto || X.el.contains(T.el)) continue;
        if (Math.min(X.b.right, T.b.right) - Math.max(X.b.left, T.b.left) <= 0) continue;
        const d = T.b.bottom <= X.b.top + 0.5 ? X.b.top - T.b.bottom : T.b.top >= X.b.bottom - 0.5 ? T.b.top - X.b.bottom : null;
        if (d !== null && d < aire) { aire = d; dondeAire = X.que + ' ↔ ' + T.que; }
      }
    }
    const pisan = [];
    for (let a = 0; a < cajas.length; a++) for (let c = a + 1; c < cajas.length; c++) {
      const A = cajas[a], C = cajas[c];
      if (A.el === C.el || A.el.contains(C.el) || C.el.contains(A.el)) continue;
      const w = Math.min(A.b.right, C.b.right) - Math.max(A.b.left, C.b.left);
      const h = Math.min(A.b.bottom, C.b.bottom) - Math.max(A.b.top, C.b.top);
      if (w > 0.5 && h > 0.5) pisan.push(A.que + ' ⟷ ' + C.que + ' ' + w.toFixed(1) + '×' + h.toFixed(1));
    }
    const lineas = ['.hito__l1', '.hito__l2', '.hito__l3', '.vivo'].map((s) => li.querySelector(s)).filter(Boolean);
    let enOrden = lineas.length >= 3;
    for (let k = 1; k < lineas.length; k++) {
      if (lineas[k].getBoundingClientRect().top < lineas[k - 1].getBoundingClientRect().bottom - 0.5) enOrden = false;
    }
    const region = li.querySelector('.vivo__estado');
    return {
      indice,
      l1: t(li.querySelector('.hito__l1')), l2: t(li.querySelector('.hito__l2')), l3: t(li.querySelector('.hito__l3')),
      lineas: lineas.length, enOrden,
      aire: aire === Infinity ? null : Math.round(aire * 10) / 10, dondeAire,
      pisan,
      region: t(region), avisa: region?.classList.contains('vivo__estado--aviso') ?? null,
      tira: t(li.querySelector('.paso__nota')) || null,
    };
  }).filter(Boolean);
`;

for (const pantalla of PANTALLAS) {
  for (const modo of ['bus', 'bizi']) {
    for (const caso of ['reposo', 'muda']) {
      const m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: pantalla.puerto + 10 });
      try {
        await m.ir(APP, 6000);
        console.log(`\n═══ LAS CINCO LÍNEAS · ${pantalla.nombre} · ${modo} · ${caso === 'reposo' ? 'en reposo' : 'con la fuente muda'} ═══`);
        await generarCon(m, modo, caso === 'muda' ? SIEMBRA_MUDA[modo] : '', VIVO_CON_EXITO);
        const hitos = await leer(m, LO_DE_LAS_CINCO);
        const dicho = `${pantalla.id} · ${modo} · ${caso}`;
        juzgar(
          hitos.length >= 2 && hitos.every((h) => h.enOrden),
          `P23 · ${dicho} · ⭐ cada hito en sus líneas, de arriba abajo: L1 · L2 · L3 · botón y región`,
          hitos.length === 0 ? '(ningún hito con chip o ficha)' : hitos.map((h) => `«${h.l1}» / «${h.l2}» / «${h.l3}» (${h.lineas} líneas${h.enOrden ? '' : ', DESORDENADAS'})`).join(' | '),
        );
        juzgar(
          hitos.length >= 2 && hitos.every((h) => h.aire === null || h.aire >= AIRE_MINIMO),
          `P23 · ${dicho} · ⭐ EL AIRE: chip, marca y ficha a ≥ ${AIRE_MINIMO} px del renglón vecino (nº52)`,
          hitos.map((h) => `${h.aire === null ? 'sin vecino' : h.aire + ' px'}${h.aire !== null && h.aire < AIRE_MINIMO ? ' (' + h.dondeAire + ')' : ''}`).join(' · '),
        );
        juzgar(
          hitos.length >= 2 && hitos.every((h) => h.pisan.length === 0),
          `P23 · ${dicho} · ⭐ dentro del paso ninguna caja pisa a otra (la P18, chip contra chip)`,
          hitos.every((h) => h.pisan.length === 0) ? `${hitos.length} hitos, ni un solape` : hitos.flatMap((h) => h.pisan).join(' | '),
        );
        if (pantalla.id === 'movil' || pantalla.id === 'antonio') {
          const sobra = await m.evaluar(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
          juzgar(sobra === 0, `P23 · ${dicho} · y sin scroll lateral`, `sobra ${sobra} px`);
        }
        const primero = hitos.find((h) => h.region !== null && (modo === 'bizi' || h.avisa !== null));
        await m.evaluar(`document.querySelectorAll('.paso')[${hitos[0]?.indice ?? 0}].scrollIntoView({ block: 'start' })`);
        await m.dormir(300);
        await m.guardar(`${CAPTURAS}/cinco-${pantalla.id}-${modo}-${caso}.png`);
        if (caso === 'muda') {
          const conBoton = hitos.filter((h) => h.region !== null);
          juzgar(
            conBoton.length > 0 && conBoton.some((h) => h.avisa === true) && conBoton.every((h) => h.avisa === false || h.tira === null),
            `P23 · ${dicho} · ⭐ L5: el mudo lo dice la REGIÓN vestida de advertencia, y no hay tira`,
            conBoton.map((h) => `${h.avisa ? 'advierte' : 'dato'} «${h.region.slice(0, 44)}…» · tira ${h.tira === null ? 'no' : 'SÍ'}`).join(' | '),
          );
          if (pantalla.id === 'pc') {
            const c = await contrasteSiEsta(m, '.vivo__estado--aviso', { minimo: 6 });
            juzgar(c !== null && c.contraste >= AA_TEXTO, 'P23 · ⭐ y la advertencia se lee: ≥ 4,5:1', c === null ? '(no hay advertencia)' : `${c.contraste.toFixed(2)}:1`);
          }
          // El ciclo: se pulsa cada botón que advierte y la fuente contesta.
          const avisan = conBoton.filter((h) => h.avisa).map((h) => h.indice);
          for (const i of avisan) {
            await m.evaluar(`document.querySelectorAll('.paso')[${i}].querySelector('.vivo__boton').click()`);
            await m.dormir(700);
          }
          const tras = (await leer(m, LO_DE_LAS_CINCO)).filter((h) => avisan.includes(h.indice));
          juzgar(
            tras.length > 0 && tras.every((h) => h.avisa === false && h.tira === null && !/No hemos podido preguntar/.test(h.region)),
            `P23 · ${dicho} · ⭐ tras el botón con éxito, la advertencia MUERE: una sola voz (nº53)`,
            tras.map((h) => `«${h.region}» · ${h.avisa ? 'SIGUE advirtiendo' : 'dato'}`).join(' | '),
          );
          await m.evaluar(`document.querySelectorAll('.paso')[${avisan[0] ?? 0}].scrollIntoView({ block: 'start' })`);
          await m.dormir(300);
          await m.guardar(`${CAPTURAS}/cinco-${pantalla.id}-${modo}-tras-el-boton.png`);
        }
        void primero;
      } finally {
        m.cerrar();
      }
    }
  }
}

// ═══════════ P24 · LA CABECERA DEL RESULTADO, CON SU REGIÓN ═══════════
//
// ⭐ [ANTONIO, 14/09, veto de la tanda 5; NN/g «The Principle of Common Region»]
//    cifras, extremos y chips son UN grupo —el sumario del viaje— y hoy flotan
//    sueltos compitiendo con el timeline. Lo que se compra es el PRINCIPIO, no
//    la forma: un límite que se ve —borde a 3:1 en los cuatro lados [WCAG
//    1.4.11], o un fondo que se separa del panel al menos lo que la banda
//    (MINIMO_DE_SEPARACION)— con todo el grupo DENTRO y con aire, sin pisar al
//    resumen ni al primer paso, y con la letra a 4,5:1 sobre lo pintado.
//
// OJO: dentro de las plantillas de JS, ni una comilla invertida en los comentarios.
const LA_CABECERA = `
  const r = document.querySelector('.ruta');
  if (!r) return null;
  const s = getComputedStyle(r);
  let p = r.parentElement;
  while (p && getComputedStyle(p).backgroundColor === 'rgba(0, 0, 0, 0)') p = p.parentElement;
  const caja = r.getBoundingClientRect();
  const lados = ['Top', 'Right', 'Bottom', 'Left'].map((l) => ({
    ancho: parseFloat(s['border' + l + 'Width']), estilo: s['border' + l + 'Style'], color: s['border' + l + 'Color'],
  }));
  const hijos = [...r.children].map((h) => {
    const b = h.getBoundingClientRect();
    return {
      que: h.classList[0],
      dentro: b.left >= caja.left && b.right <= caja.right && b.top >= caja.top && b.bottom <= caja.bottom,
      aire: Math.round(Math.min(b.left - caja.left, caja.right - b.right, b.top - caja.top, caja.bottom - b.bottom) * 10) / 10,
    };
  });
  const pisa = (sel) => {
    const v = document.querySelector(sel);
    if (!v) return null;
    const b = v.getBoundingClientRect();
    const w = Math.min(b.right, caja.right) - Math.max(b.left, caja.left);
    const h = Math.min(b.bottom, caja.bottom) - Math.max(b.top, caja.top);
    return w > 0.5 && h > 0.5;
  };
  return {
    lados, fondo: s.backgroundColor, panel: p ? getComputedStyle(p).backgroundColor : null,
    hijos, pisaResumen: pisa('.resumen'), pisaPaso: pisa('.paso'),
  };
`;
const opaco = (css) => css !== 'rgba(0, 0, 0, 0)' && !/,\s*0\)$/.test(css);

for (const pantalla of PANTALLAS) {
  const m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: pantalla.puerto + 20 });
  try {
    await m.ir(APP, 6000);
    console.log(`\n═══ LA CABECERA Y SU REGIÓN · ${pantalla.nombre} ═══`);
    await generarCon(m, 'bus', '');
    const c = await leer(m, LA_CABECERA);
    const dicho = `P24 · ${pantalla.id}`;
    if (c === null) {
      juzgar(false, `${dicho} · ⭐ la cabecera del resultado tiene su región`, '(no hay .ruta en la página)');
      continue;
    }
    const panel = aRgb(c.panel ?? 'rgb(255, 255, 255)');
    const bordes = c.lados.map((l) => (l.ancho >= 1 && l.estilo !== 'none' ? contrasteRgb(aRgb(l.color), panel) : 0));
    const porBorde = bordes.every((x) => x >= AA_GRAFICO);
    const f = opaco(c.fondo) ? aRgb(c.fondo) : null;
    const separacion = f === null ? 0 : Math.max(Math.abs(f.r - panel.r), Math.abs(f.g - panel.g), Math.abs(f.b - panel.b));
    const porFondo = separacion >= MINIMO_DE_SEPARACION;
    juzgar(
      porBorde || porFondo,
      `${dicho} · ⭐ la cabecera del resultado tiene su REGIÓN: borde a ≥ ${AA_GRAFICO}:1 en los cuatro lados, o fondo a ≥ ${MINIMO_DE_SEPARACION} puntos del panel`,
      `bordes ${bordes.map((x) => x.toFixed(2)).join(' / ')} :1 · fondo ${c.fondo} a ${separacion} puntos de ${c.panel}`,
    );
    juzgar(
      c.hijos.length >= 3 && c.hijos.every((h) => h.dentro && h.aire >= AIRE_MINIMO),
      `${dicho} · ⭐ y el grupo entero va DENTRO, a ≥ ${AIRE_MINIMO} px del filo`,
      c.hijos.map((h) => `${h.que} ${h.dentro ? h.aire + ' px' : 'FUERA'}`).join(' · '),
    );
    juzgar(
      c.pisaResumen !== true && c.pisaPaso !== true,
      `${dicho} · y la región no pisa al resumen ni al primer paso (la P18)`,
      `resumen ${c.pisaResumen === null ? 'no hay' : c.pisaResumen ? 'PISA' : 'no'} · paso ${c.pisaPaso ? 'PISA' : 'no'}`,
    );
    for (const [sel, que] of [['.ruta__metros', 'las cifras'], ['.ruta__punto', 'los extremos'], ['.ruta__lineas-rotulo', '«Se viaja en»']]) {
      const t = await contrasteSiEsta(m, sel, { minimo: 6 });
      juzgar(t !== null && t.contraste >= AA_TEXTO, `${dicho} · y ${que} se leen dentro: ≥ ${AA_TEXTO}:1 sobre lo pintado`, t === null ? '(no está)' : `${t.contraste.toFixed(2)}:1`);
    }
    if (pantalla.id !== 'pc') {
      const sobra = await m.evaluar(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
      juzgar(sobra === 0, `${dicho} · y sin scroll lateral`, `sobra ${sobra} px`);
    }
    await m.evaluar(`(document.querySelector('.resumen') ?? document.querySelector('.ruta')).scrollIntoView({ block: 'start' })`);
    await m.dormir(300);
    await m.guardar(`${CAPTURAS}/cabecera-region-${pantalla.id}.png`);
  } finally {
    m.cerrar();
  }
}

// ═══════════ P25 · EL RESULTADO EN OSCURO, ENTERO Y EN LOS TRES ANCHOS ═══════════
//
// ⭐ [tanda 6 · parte 1, 15/09; bitácora del 15/09] el resultado nunca se había
//    mirado entero con el tema oscuro puesto: el producto va clavado en claro y
//    el censo de tokens daba los dos temas por cumplidos. Con el oscuro puesto,
//    la negrita de los pasos leía a 1,04:1, «Se viaja en» a 2,24, el borde
//    ámbar a 2,35 contra la tarjeta y «Próximo bus» era un bloque blanco.
//
// ⚠️ LA VARA DE LA P0, ANTES DE UNA SOLA CIFRA: el tema se pone por el atributo
//    del contrato de tokens —`data-theme="dark"` en <html>— y la jueza LEE del
//    DOM el atributo Y dos tokens computados con su valor oscuro. Un «oscuro
//    verde» medido con el tema en claro ya pasó una vez (nº43). Si el tema no
//    está puesto, esa sesión da ROJO y no se mide nada más en ella.
//
// ⚠️ Lo que se compra sobre el PÍXEL (contrasteReal): la letra. Lo que se compra
//    sobre el valor computado: los bordes, que son opacos y de 1-3 px —el píxel
//    de un filete de 1 px se mezcla con el suavizado— y la red, que ignora
//    opacidades y por eso NO sustituye al píxel: caza lo que nadie pensó en
//    medir, y declara su límite.
//
// ⚠️ La tesela NO se juzga aquí: esta es la red de la tarjeta. La del mapa
//    —la tesela oscura, su atribución y lo que la pisa— es la P26 (parte 2).
//
// OJO: dentro de las plantillas de JS, ni una comilla invertida en los comentarios.
const OSCURO_BASE = { background: 'rgb(18, 18, 18)', card: 'rgb(30, 30, 30)' };
const CLARO_BASE = { background: 'rgb(255, 255, 255)', card: 'rgb(255, 255, 255)' };

/** Pone el tema y lo COMPRUEBA en el DOM. Devuelve si está puesto de verdad. */
async function ponerTema(m, tema, dicho) {
  await m.evaluar(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(tema)})`);
  await m.dormir(250);
  const attr = await m.evaluar(`document.documentElement.getAttribute('data-theme')`);
  const fondo = await tokenRgb(m, 'background');
  const card = await tokenRgb(m, 'card');
  const esperado = tema === 'dark' ? OSCURO_BASE : CLARO_BASE;
  const puesto = attr === tema && fondo === esperado.background && card === esperado.card;
  juzgar(
    puesto,
    `${dicho} · ⭐ la vara de la P0: el tema ${tema} está PUESTO — atributo y tokens leídos del DOM`,
    `data-theme=${attr} · --background ${fondo} · --card ${card}`,
  );
  return puesto;
}

/** La red: todo texto y todo borde opaco superior o izquierdo del resultado, contra su fondo computado. */
const BARRIDO_DEL_RESULTADO = `
  const raiz = document.querySelector('.bloque--pasos');
  const rgb = (s) => { const m = s.match(/[\\d.]+/g); if (!m) return null; const [r, g, b, a] = m.map(Number); return { r, g, b, a: a ?? 1 }; };
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const C = (a, b) => (Math.max(L(a), L(b)) + 0.05) / (Math.min(L(a), L(b)) + 0.05);
  const fondoDe = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a === 1) return c; } return null; };
  const nombre = (el) => el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '');
  const malos = []; let textos = 0; let bordes = 0;
  for (const el of raiz.querySelectorAll('*')) {
    const s = getComputedStyle(el); const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0 || s.visibility === 'hidden' || el.closest('.chip-linea')) continue;
    const fondo = fondoDe(el);
    if (!fondo) continue;
    if ([...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim())) {
      textos++;
      const r = C(rgb(s.color), fondo);
      if (r < 4.5) malos.push(nombre(el) + ' texto ' + s.color + ' ' + r.toFixed(2) + ':1');
    }
    for (const lado of ['Top', 'Left']) {
      if (parseFloat(s['border' + lado + 'Width']) < 1 || s['border' + lado + 'Style'] === 'none') continue;
      const c = rgb(s['border' + lado + 'Color']);
      if (!c || c.a < 1) continue;
      bordes++;
      const r = C(c, fondoDe(el.parentElement) ?? fondo);
      if (r < 3) malos.push(nombre(el) + ' borde ' + lado + ' ' + s['border' + lado + 'Color'] + ' ' + r.toFixed(2) + ':1');
    }
  }
  return { textos, bordes, malos: [...new Set(malos)] };
`;

/** Un borde computado contra un token: la cifra de 1.4.11. */
const bordeContra = async (m, selector, lado, token) => {
  const c = await m.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); return e ? getComputedStyle(e).border${lado}Color : null; })()`);
  return c === null ? null : contrasteRgb(aRgb(c), aRgb(await tokenRgb(m, token)));
};

const CONTEXTO_Y_VIAJE = `
  const HITOS = ['salida', 'sube', 'baja', 'transborda', 'coge', 'aparca', 'llegada'];
  const k = t.pasos.findIndex((p, j) => j > 0 && !HITOS.includes(p.giro));
  if (k >= 0) t.avisos.push({ texto: ${JSON.stringify(SEMBRADO)}, paso: k });
  t.avisos.push({ texto: 'Aviso de viaje entero sembrado por la jueza P25.' });
`;

/**
 * ⭐ LOS GRISES DEL PASO CON EL RATÓN ENCIMA (remate de la tanda 6, 15/09).
 *
 * La distancia y los datos del hito van en gris sobre el realce. En CLARO daban
 * 3,86:1 —slate-500 sobre slate-200— y el tamaño pintado es 14 px a peso 600 y
 * 400: texto NORMAL, vara 4,5 [WCAG 1.4.3]. Se mide la vara con el tamaño real
 * y el contraste sobre el píxel, con el ratón DE VERDAD encima de cada uno.
 */
async function grisesConElRaton(m, dicho, tema) {
  for (const [sel, que] of [['.paso__metros', 'la distancia'], ['.hito__l3', 'los datos del hito']]) {
    const donde = await leer(m, `
      const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.trim());
      if (!e) return null;
      e.scrollIntoView({ block: 'center' });
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, px: parseFloat(s.fontSize), peso: Number(s.fontWeight),
               indice: [...document.querySelectorAll(${JSON.stringify(sel)})].indexOf(e) };
    `);
    let t = null;
    let fondoPaso = null;
    if (donde) {
      await m.dormir(150);
      await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: donde.x, y: donde.y });
      await m.dormir(300);
      fondoPaso = await m.evaluar(`getComputedStyle(document.querySelectorAll(${JSON.stringify(sel)})[${donde.indice}].closest('.paso')).backgroundColor`);
      t = await contrasteReal(m, sel, { indice: donde.indice, minimo: 6 });
      await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 3, y: 3 });
      await m.dormir(200);
    }
    // La vara, de lo pintado: grande es ≥ 24 px, o ≥ 18,66 px a peso 700 o más.
    const grande = donde !== null && (donde.px >= 24 || (donde.px >= 18.66 && donde.peso >= 700));
    const vara = grande ? AA_GRAFICO : AA_TEXTO;
    const realce = await tokenRgb(m, 'superficie-realce');
    juzgar(
      t !== null && fondoPaso === realce && t.contraste >= vara,
      `${dicho} · ⭐ ${tema} · ${que} con el ratón encima se lee: ≥ ${vara}:1 (vara de su tamaño pintado)`,
      t === null ? `(no hay ${sel})` : `${donde.px} px · peso ${donde.peso} · ${grande ? 'grande' : 'normal'} · paso ${fondoPaso} · ${t.contraste.toFixed(2)}:1 · ${enRgb(t.texto)} sobre ${enRgb(t.fondo)}`,
    );
  }
}

for (const pantalla of PANTALLAS) {
  const dicho = `P25 · ${pantalla.id}`;
  const movil = pantalla.ancho < 768;

  // ── (A) EL VIAJE EN BUS: pasos, cabecera, resumen, tira, L5 y la región con dato ──
  let m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: pantalla.puerto + 30 });
  try {
    await m.ir(APP, 6000);
    console.log(`\n═══ EL RESULTADO EN OSCURO · ${pantalla.nombre} · el viaje en bus ═══`);
    if (await ponerTema(m, 'dark', `${dicho} · bus`)) {
      await generarCon(m, 'bus', SIEMBRA_MUDA.bus + CONTEXTO_Y_VIAJE, VIVO_CON_EXITO);
      if (await ponerTema(m, 'dark', `${dicho} · bus, tras generar`)) {
        for (const [sel, que] of [
          ['.paso__texto strong', 'la negrita de los pasos (la calle)'],
          ['.pasos__modo', '«Modo: …»'],
          ['.ruta__lineas-rotulo', '«Se viaja en»'],
          ['.ruta__metros', 'las cifras de la cabecera'],
          ['.hito__accion', 'la acción del hito'],
          ['.hito__l3', 'los datos del hito'],
          ['.paso__metros', 'la distancia'],
          ['.vivo__estado--aviso', 'la L5 que advierte'],
          ['.paso__nota', 'la tira ámbar'],
          ['.resumen__linea', 'el resumen de avisos'],
        ]) {
          const t = await contrasteSiEsta(m, sel, { minimo: 6 });
          juzgar(
            t !== null && t.contraste >= AA_TEXTO,
            `${dicho} · ⭐ ${que} se lee: ≥ ${AA_TEXTO}:1 sobre lo pintado`,
            t === null ? `(no hay ${sel})` : `${t.contraste.toFixed(2)}:1 · ${enRgb(t.texto)} sobre ${enRgb(t.fondo)}`,
          );
        }

        // «Próximo bus»: se lee, y NO es un bloque claro dentro del oscuro [DISEÑO §32].
        const realce = aRgb(await tokenRgb(m, 'superficie-realce'));
        const boton = await contrasteSiEsta(m, '.vivo__boton', { minimo: 6 });
        juzgar(
          boton !== null && boton.contraste >= AA_TEXTO && luminancia(boton.fondo) <= luminancia(realce),
          `${dicho} · ⭐ «Próximo bus» se lee y no es un bloque claro: su fondo no pasa de la superficie del realce`,
          boton === null ? '(no hay botón)' : `${boton.contraste.toFixed(2)}:1 · fondo ${enRgb(boton.fondo)} · techo ${enRgb(realce)}`,
        );

        // Los bordes ámbar contra sus vecinos [WCAG 1.4.11].
        const bordes = {
          'resumen/tarjeta': await bordeContra(m, '.resumen', 'Top', 'card'),
          'resumen/su ámbar': await bordeContra(m, '.resumen', 'Top', 'warning'),
          'tira/tarjeta': await bordeContra(m, '.paso__nota', 'Left', 'card'),
          'tira/realce': await bordeContra(m, '.paso__nota', 'Left', 'superficie-realce'),
          'L5/tarjeta': await bordeContra(m, '.vivo__estado--aviso', 'Left', 'card'),
          'L5/su ámbar': await bordeContra(m, '.vivo__estado--aviso', 'Left', 'warning'),
        };
        juzgar(
          Object.values(bordes).every((r) => r !== null && r >= AA_GRAFICO),
          `${dicho} · ⭐ el borde ámbar se distingue de todo lo que tiene al lado: ≥ ${AA_GRAFICO}:1`,
          Object.entries(bordes).map(([k, r]) => `${k} ${r === null ? 'NO ESTÁ' : r.toFixed(2)}`).join(' · '),
        );

        const red = await leer(m, BARRIDO_DEL_RESULTADO);
        juzgar(
          red.textos > 30 && red.malos.length === 0,
          `${dicho} · ⭐ la red: ningún texto a < 4,5 ni borde opaco a < 3 en todo el resultado (valor computado)`,
          `${red.textos} textos · ${red.bordes} bordes · ${red.malos.length ? red.malos.join(' | ') : 'ninguno por debajo'}`,
        );
        if (pantalla.id !== 'pc') {
          const sobra = await m.evaluar(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
          juzgar(sobra === 0, `${dicho} · y sin scroll lateral`, `sobra ${sobra} px`);
        }
        await m.evaluar(`document.querySelector('.bloque--pasos .bloque__cuerpo').scrollTop = 0`);
        await m.dormir(300);
        await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-arriba.png`);

        // Con el ratón encima de un paso con calle: la negrita sobre el realce.
        if (!movil) {
          const donde = await leer(m, `
            const s = document.querySelector('.paso__texto strong');
            if (!s) return null;
            s.scrollIntoView({ block: 'center' });
            const r = s.getBoundingClientRect();
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          `);
          let t = null;
          let fondoPaso = null;
          if (donde) {
            await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: donde.x, y: donde.y });
            await m.dormir(300);
            fondoPaso = await m.evaluar(`getComputedStyle(document.querySelector('.paso__texto strong').closest('.paso')).backgroundColor`);
            t = await contrasteSiEsta(m, '.paso__texto strong', { minimo: 6 });
            await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-realce.png`);
            await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 3, y: 3 });
            await m.dormir(200);
          }
          juzgar(
            t !== null && fondoPaso === enRgb(realce) && t.contraste >= AA_TEXTO,
            `${dicho} · ⭐ con el ratón: la negrita sobre el realce, ≥ ${AA_TEXTO}:1, y el realce es SU token`,
            t === null ? '(no hay negrita)' : `paso ${fondoPaso} · ${t.contraste.toFixed(2)}:1`,
          );
        }

        if (!movil) await grisesConElRaton(m, dicho, 'oscuro');

        // El hito, y la región con DATO tras pulsar: la voz del último intento.
        const avisan = await m.evaluar(`[...document.querySelectorAll('.paso')].map((p, i) => (p.querySelector('.vivo__estado--aviso') ? i : -1)).filter((i) => i >= 0)`);
        if (avisan.length) {
          await m.evaluar(`document.querySelectorAll('.paso')[${avisan[0]}].scrollIntoView({ block: 'start' })`);
          await m.dormir(300);
          await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-hito.png`);
        }
        for (const i of avisan) {
          await m.evaluar(`document.querySelectorAll('.paso')[${i}].querySelector('.vivo__boton').click()`);
          await m.dormir(700);
        }
        const conDato = await m.evaluar(`[...document.querySelectorAll('.vivo__estado:not(.vivo__estado--aviso)')].findIndex((e) => e.textContent.trim())`);
        const dato = conDato < 0 ? null : await contrasteReal(m, '.vivo__estado:not(.vivo__estado--aviso)', { indice: conDato, minimo: 6 });
        juzgar(
          dato !== null && dato.contraste >= AA_TEXTO,
          `${dicho} · ⭐ la región con DATO, tras el botón, se lee: ≥ ${AA_TEXTO}:1`,
          dato === null ? '(ninguna región con dato)' : `«${dato.etiqueta}» ${dato.contraste.toFixed(2)}:1`,
        );
        await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-tras-el-boton.png`);

        // Y el claro, con la misma red: nada del claro se afloja por el oscuro.
        if (await ponerTema(m, 'light', `${dicho} · claro`)) {
          if (!movil) await grisesConElRaton(m, dicho, 'claro');
          const enClaro = await leer(m, BARRIDO_DEL_RESULTADO);
          juzgar(
            enClaro.textos > 30 && enClaro.malos.length === 0,
            `${dicho} · y en CLARO la misma red, sin nada por debajo`,
            `${enClaro.textos} textos · ${enClaro.bordes} bordes · ${enClaro.malos.length ? enClaro.malos.join(' | ') : 'ninguno por debajo'}`,
          );
          await m.evaluar(`document.querySelector('.bloque--pasos .bloque__cuerpo').scrollTop = 0`);
          await m.dormir(300);
          await m.guardar(`${CAPTURAS}/claro-${pantalla.id}-arriba.png`);
          if (avisan.length) {
            await m.evaluar(`document.querySelectorAll('.paso')[${avisan[0]}].scrollIntoView({ block: 'start' })`);
            await m.dormir(300);
            await m.guardar(`${CAPTURAS}/claro-${pantalla.id}-hito.png`);
          }
        }
      }
    }
  } finally {
    m.cerrar();
  }

  // ── (B) EL COCHE CON ZONA: el atajo «Sugerir zona» ──
  m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: pantalla.puerto + 40 });
  try {
    await m.ir(APP, 6000);
    console.log(`\n═══ EL RESULTADO EN OSCURO · ${pantalla.nombre} · el coche con zona ═══`);
    if (await ponerTema(m, 'dark', `${dicho} · coche`)) {
      await generarCon(m, 'coche', '', null, `document.querySelector('input[name=aparcamiento][value=azul]').click()`);
      const realce = aRgb(await tokenRgb(m, 'superficie-realce'));
      const atajo = await contrasteSiEsta(m, '.sugerencia__boton', { minimo: 6 });
      juzgar(
        atajo !== null && atajo.contraste >= AA_TEXTO && luminancia(atajo.fondo) <= luminancia(realce),
        `${dicho} · ⭐ «Sugerir zona» se lee y no es un bloque claro`,
        atajo === null ? '(no ha salido el atajo)' : `${atajo.contraste.toFixed(2)}:1 · fondo ${enRgb(atajo.fondo)}`,
      );
      await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-coche.png`);
    }
  } finally {
    m.cerrar();
  }

  // ── (C) LOS ESTADOS: el vacío, el hueso y el error ──
  m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: pantalla.puerto + 50 });
  try {
    await m.ir(APP, 6000);
    console.log(`\n═══ EL RESULTADO EN OSCURO · ${pantalla.nombre} · los estados ═══`);
    if (await ponerTema(m, 'dark', `${dicho} · estados`)) {
      const aLaRuta = movil
        ? `[...document.querySelectorAll('.barra__boton')].find((b) => /Ruta/.test(b.textContent)).click()`
        : `document.querySelector('#cabecera-pasos').getAttribute('aria-expanded') === 'true' || document.querySelector('#cabecera-pasos').click()`;
      await m.evaluar(aLaRuta);
      await m.dormir(400);
      const vacio = await contrasteSiEsta(m, '.pasos__vacio', { minimo: 20 });
      juzgar(vacio !== null && vacio.contraste >= AA_TEXTO, `${dicho} · el vacío se lee`, vacio === null ? '(no hay vacío)' : `${vacio.contraste.toFixed(2)}:1`);
      await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-vacio.png`);

      // El hueso, sobre una carga de verdad y QUIETO: la lección de la P14 —un
      // fotograma al azar de un latido no es una medida—. El suelo es el del
      // oscuro que fija el censo para la banda: 21 puntos.
      await m.cdp('Network.enable');
      await m.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await generarCon(m, 'andando', '', null, '', false);
      await m.cdp('Network.emulateNetworkConditions', { offline: false, latency: 4000, downloadThroughput: -1, uploadThroughput: -1 });
      await m.evaluar(`document.querySelector('button.generar').click()`);
      await m.dormir(1700);
      if (movil) {
        await m.evaluar(aLaRuta);
        await m.dormir(300);
      }
      const hueso = await leer(m, `
        const h = document.querySelector('.hueso__caja');
        if (!h) return null;
        return { hueso: getComputedStyle(h).backgroundColor, panel: getComputedStyle(document.querySelector('.panel')).backgroundColor };
      `);
      const sep = hueso === null ? -1 : Math.max(...['r', 'g', 'b'].map((k) => Math.abs(aRgb(hueso.hueso)[k] - aRgb(hueso.panel)[k])));
      juzgar(sep >= 21, `${dicho} · el hueso se ve sobre el panel oscuro: ≥ 21 puntos de 255`, hueso === null ? '(no hay hueso)' : `${sep} puntos · ${hueso.hueso} sobre ${hueso.panel}`);
      await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-hueso.png`);
      for (let i = 0; i < 40 && (await m.evaluar(`document.querySelector('.hueso') !== null`)); i++) await m.dormir(300);

      // El error: sin nadie al otro lado, de verdad.
      await m.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
      await m.evaluar(`document.querySelector('button.generar').click()`);
      await m.dormir(2500);
      if (movil) {
        await m.evaluar(aLaRuta);
        await m.dormir(300);
      }
      const error = await contrasteSiEsta(m, '.pasos__error', { minimo: 20 });
      juzgar(error !== null && error.contraste >= AA_TEXTO, `${dicho} · el error se lee`, error === null ? '(no hay error)' : `${error.contraste.toFixed(2)}:1`);
      await m.guardar(`${CAPTURAS}/oscuro-${pantalla.id}-error.png`);
    }
  } finally {
    m.cerrar();
  }
}

// ═══════════ P26 · EL MAPA EN LOS DOS TEMAS: LA TESELA, SU ATRIBUCIÓN Y LO QUE LA PISA ═══════════
//
// ⭐ [tanda 6 · parte 2, 15/09] con el tema oscuro puesto, el mapa seguía
//    pintando la tesela clara de OpenStreetMap: luminancia media 0,70 en el
//    lienzo, frente a 0,013 de la tarjeta. Es el deslumbre que la P25 capturaba
//    sin juzgar. Esta es la red del MAPA; la P25 es la de la tarjeta y no se toca.
//
// ⚠️ La vara de la P0 antes de medir: el tema se pone por el atributo del
//    contrato y se comprueba en el DOM (ponerTema).
//
// ⚠️ LO QUE SE COMPRA, y dónde:
//    · la capa: el src de las teselas pintadas y la atribución, leídos del DOM.
//    · el deslumbre: la moda del lienzo con las capas de encima ocultas, sobre
//      el PÍXEL, y no más clara que la superficie del realce (el mismo techo que
//      la P25 pone a «Próximo bus»).
//    · lo que pisa la tesela [WCAG 1.4.11, 3:1 contra lo adyacente]: la tesela
//      se censa sobre el píxel DEBAJO de cada trazo (captura con las capas
//      ocultas, en los píxeles que el trazo ocupa en la captura con ellas), y se
//      queda lo que ocupa al menos el 1 %, que es la regla de contraste.ts. Los
//      colores del trazo y del ribete salen de su stroke, que es opaco.
//      · una línea con ribete: línea contra ribete ≥ 3, y contra cada color de
//        la tesela la separa quien pueda —la línea o su ribete— (ribeteDe).
//      · un borde sin ribete (la ZBE, el área de YeGo): él solo, ≥ 3.
//      · un pin: su relleno contra su halo blanco ≥ 3, y el par contra la
//        tesela. Las familias que no salen en este viaje se miden con un clon
//        del pin pintado, al que se le cambia solo el relleno.
//      · el hito: su aro contra la tesela ≥ 3.
//    · los controles: el glifo del zoom y la atribución se leen (≥ 4,5 sobre el
//      píxel) y no son un bloque claro dentro del oscuro.
//
// ⚠️ En CLARO se juzga la capa y su atribución, y se captura. Sus contrastes
//    los llevan pantalla.mjs y la P18-P24, y no se duplican aquí.
//
// OJO: dentro de las plantillas de JS, ni una comilla invertida en los comentarios.
const MODOS_P26 = [
  { id: 'andando', ajuste: '' },
  { id: 'bus', ajuste: '' },
  { id: 'bici', ajuste: '' },
  { id: 'coche', ajuste: `document.querySelector('input[name=aparcamiento][value=azul]').click()` },
  { id: 'moto', ajuste: `document.querySelector('input[name=moto][value=yego]').click()`, dicho: 'yego' },
];

/** Los rellenos de los pins, por familia [iconos.ts]: origen/farmacia, destino, sanitario, cultura, educación, sin papel. */
const RELLENOS_DE_PIN = ['#1a7f37', '#c1121f', '#0d47a1', '#6a1b9a', '#614800', '#44403c'];

/**
 * Y los que el mapa pinta EN CLARO [iconos.ts, `EN_EL_MAPA_CLARO`]: un paso más
 * oscuro en la familia para verde, rojo, azul y mostaza. El clon tiene que llevar
 * lo que la pantalla pinta de verdad; con los de arriba mediría un pin que el
 * tema claro ya no pone. Los dos pins reales del viaje comprueban la tabla: si
 * no coincidieran con ella, su jueza lo diría con su color.
 */
const RELLENOS_DE_PIN_EN_CLARO = ['#14532d', '#7f1d1d', '#1e3a8a', '#6a1b9a', '#422006', '#44403c'];

const OCULTAR_CAPAS = `document.querySelectorAll('.leaflet-overlay-pane, .leaflet-marker-pane, .leaflet-zbe-pane, .p26-clon').forEach((e) => (e.style.visibility = 'hidden'))`;
const MOSTRAR_CAPAS = `document.querySelectorAll('.leaflet-overlay-pane, .leaflet-marker-pane, .leaflet-zbe-pane, .p26-clon').forEach((e) => (e.style.visibility = ''))`;
const OCULTAR_CONTROLES = `document.querySelectorAll('.leaflet-control-container').forEach((e) => (e.style.visibility = 'hidden'))`;
const MOSTRAR_CONTROLES = `document.querySelectorAll('.leaflet-control-container').forEach((e) => (e.style.visibility = ''))`;

/** Espera a que TODAS las teselas pintadas estén cargadas. */
async function esperarTeselas(m) {
  for (let i = 0; i < 60; i++) {
    const listo = await m.evaluar(`(() => {
      const t = [...document.querySelectorAll('.leaflet-tile-container img.leaflet-tile')];
      return t.length > 0 && t.every((x) => x.classList.contains('leaflet-tile-loaded') && x.complete);
    })()`);
    if (listo) break;
    await m.dormir(250);
  }
  await m.dormir(400);
}

/** La capa pintada y lo que la atribuye, leído del DOM. */
const LA_CAPA = `
  const t = [...document.querySelectorAll('.leaflet-tile-container img.leaflet-tile')].map((x) => x.src);
  const a = document.querySelector('.leaflet-control-attribution');
  const r = a ? a.getBoundingClientRect() : null;
  const centro = r ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
  const pie = document.querySelector('.creditos__linea');
  const lienzo = document.querySelector('.leaflet-container').getBoundingClientRect();
  return {
    teselas: t.length,
    osm: t.filter((u) => /^https:\\/\\/tile\\.openstreetmap\\.org\\//.test(u)).length,
    oscuras: t.filter((u) => /^https:\\/\\/[a-d]\\.basemaps\\.cartocdn\\.com\\/dark_all\\//.test(u)).length,
    conKey: t.filter((u) => /[?&]key=[^&]+/.test(u)).length,
    atribucion: a ? a.textContent.replace(/\\s+/g, ' ').trim() : null,
    enlaceOsm: !!a?.querySelector('a[href="https://www.openstreetmap.org/copyright"]') && /colaboradores de OpenStreetMap/.test(a.textContent),
    enlaceCarto: !!a?.querySelector('a[href="https://carto.com/attributions"]') && /CARTO/.test(a.textContent),
    visible: !!r && r.width > 0 && r.height > 0 && r.bottom <= innerHeight && r.right <= innerWidth && getComputedStyle(a).visibility !== 'hidden' && !!centro && a.contains(centro),
    pie: pie ? { osm: !!pie.querySelector('a[href="https://www.openstreetmap.org/copyright"]'), carto: !!pie.querySelector('a[href="https://carto.com/attributions"]'), texto: pie.textContent.replace(/\\s+/g, ' ').trim() } : null,
    lienzo: { x: lienzo.x, y: lienzo.y, w: lienzo.width, h: lienzo.height },
  };
`;

/** Juzga que la capa y su atribución son las del tema. Devuelve la lectura. */
async function juzgarLaCapa(m, dicho, tema) {
  await esperarTeselas(m);
  const c = await leer(m, LA_CAPA);
  const oscuro = tema === 'dark';
  juzgar(
    oscuro ? c.teselas > 0 && c.oscuras === c.teselas && c.conKey === c.teselas : c.teselas > 0 && c.osm === c.teselas,
    `${dicho} · ⭐ ${tema} · la tesela es la del tema: ${oscuro ? 'Dark Matter de CARTO, con su key' : 'la de OpenStreetMap de siempre'}`,
    `${c.teselas} teselas · OSM ${c.osm} · dark_all ${c.oscuras} · con key ${c.conKey}`,
  );
  juzgar(
    c.visible && c.enlaceOsm && (oscuro ? c.enlaceCarto : !c.enlaceCarto),
    `${dicho} · ⭐ ${tema} · la atribución dice la capa activa, visible sobre el mapa: ${oscuro ? '© OpenStreetMap + © CARTO' : '© OpenStreetMap, sin CARTO'}`,
    `«${c.atribucion}» · visible ${c.visible}`,
  );
  if (c.pie !== null) {
    juzgar(
      c.pie.osm && (oscuro ? c.pie.carto : !c.pie.carto),
      `${dicho} · ${tema} · y el pie dice lo mismo que la atribución`,
      `«${c.pie.texto}»`,
    );
  }
  return c;
}

const cerca = (png, o, col, tol = 6) =>
  Math.abs(png.datos[o] - col.r) <= tol && Math.abs(png.datos[o + 1] - col.g) <= tol && Math.abs(png.datos[o + 2] - col.b) <= tol;
const deHex6 = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });

/**
 * El censo de la tesela bajo un trazo: los píxeles de las cajas donde la captura
 * CON capas pinta alguno de los colores dados, mirados en la captura SIN capas.
 * Varias cajas se juntan sin contar dos veces un píxel: todos los trozos de un
 * mismo color son UN trazo, y un trozo de 3 px no es una muestra.
 * Devuelve los colores de tesela que ocupan ≥ 1 % y cuántos píxeles del trazo hay.
 */
function teselaBajo(conCapas, sinCapas, cajas, colores, dpr = 1) {
  const visto = new Uint8Array(conCapas.ancho * conCapas.alto);
  const cuenta = new Map();
  let n = 0;
  for (const caja of cajas) {
    const x0 = Math.max(0, Math.floor(caja.x * dpr)), y0 = Math.max(0, Math.floor(caja.y * dpr));
    const x1 = Math.min(conCapas.ancho, Math.ceil((caja.x + caja.w) * dpr)), y1 = Math.min(conCapas.alto, Math.ceil((caja.y + caja.h) * dpr));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = y * conCapas.ancho + x;
        if (visto[i]) continue;
        visto[i] = 1;
        const o = i * 4;
        if (!colores.some((c) => cerca(conCapas, o, c))) continue;
        // Solo lo que la capa PINTA: un píxel igual en las dos capturas es tesela.
        const igual = Math.abs(conCapas.datos[o] - sinCapas.datos[o]) <= 6 && Math.abs(conCapas.datos[o + 1] - sinCapas.datos[o + 1]) <= 6 && Math.abs(conCapas.datos[o + 2] - sinCapas.datos[o + 2]) <= 6;
        if (igual) continue;
        n++;
        const k = (sinCapas.datos[o] << 16) | (sinCapas.datos[o + 1] << 8) | sinCapas.datos[o + 2];
        cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
      }
    }
  }
  const tesela = [...cuenta.entries()].filter(([, c]) => c / Math.max(n, 1) >= 0.01).map(([k]) => ({ r: (k >> 16) & 255, g: (k >> 8) & 255, b: k & 255 }));
  return { n, tesela };
}

/** Por debajo de esto no hay muestra: se dice que no se mide, y no se juzga. */
const MUESTRA_MINIMA = 150;

/** Agrupa por clave. */
const agrupar = (lista, clave) => {
  const g = new Map();
  for (const x of lista) {
    const k = clave(x);
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(x);
  }
  return g;
};

/** Lo que pisa la tesela, en el DOM: pares línea/ribete, bordes de polígono, pins e hitos. */
const LO_QUE_PISA = `
  const lienzo = document.querySelector('.leaflet-container').getBoundingClientRect();
  const caja = (e) => { const r = e.getBoundingClientRect(); const x = Math.max(r.x - 3, lienzo.x), y = Math.max(r.y - 3, lienzo.y); return { x, y, w: Math.min(r.right + 3, lienzo.right) - x, h: Math.min(r.bottom + 3, lienzo.bottom) - y }; };
  const hex = (s) => { if (!s) return null; if (s[0] === '#') return s.length === 4 ? '#' + [...s.slice(1)].map((c) => c + c).join('') : s.toLowerCase(); const m = s.match(/\\d+/g); return '#' + m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join(''); };
  const trazos = [...document.querySelectorAll('.leaflet-overlay-pane path')];
  const pares = [];
  for (let i = 0; i + 1 < trazos.length; i += 2) {
    const ribete = trazos[i], linea = trazos[i + 1];
    const cr = ribete.getBoundingClientRect(), cl = linea.getBoundingClientRect();
    if (cl.width === 0 && cl.height === 0) continue;
    pares.push({ linea: hex(linea.getAttribute('stroke')), ribete: hex(ribete.getAttribute('stroke')), anchoLinea: Number(linea.getAttribute('stroke-width')), anchoRibete: Number(ribete.getAttribute('stroke-width')), caja: caja(ribete) });
  }
  // Un borde puede llevar su ribete debajo (la zona en claro): va delante en el
  // panel, con la clase ribete-de-borde, y se juzga EN PAREJA con él.
  const bordes = [];
  let ribetePendiente = null;
  for (const p of document.querySelectorAll('.leaflet-zbe-pane path')) {
    if (p.classList.contains('ribete-de-borde')) { ribetePendiente = hex(p.getAttribute('stroke')); continue; }
    bordes.push({ borde: hex(p.getAttribute('stroke')), ribete: ribetePendiente, raya: p.getAttribute('stroke-dasharray'), caja: caja(p) });
    ribetePendiente = null;
  }
  const pins = [...document.querySelectorAll('.leaflet-marker-icon svg[data-icono]')].map((s) => { const p = s.querySelector('path'); return { icono: s.getAttribute('data-icono'), papel: s.getAttribute('data-papel'), relleno: hex(p.getAttribute('fill')), halo: hex(p.getAttribute('stroke')), caja: caja(s) }; });
  const hitos = [...document.querySelectorAll('.leaflet-marker-icon .hito')].map((h) => { const s = getComputedStyle(h); return { aro: hex(s.borderTopColor), fondo: hex(s.backgroundColor), dibujo: hex(s.color), caja: caja(h) }; });
  return { pares, bordes, pins, hitos, dpr: devicePixelRatio, lienzo: { x: lienzo.x, y: lienzo.y, w: lienzo.width, h: lienzo.height } };
`;

/** Pone un clon de un pin por cada relleno de familia, sobre la tesela, a su tamaño. */
const CLONAR_PINS = (rellenosDelTema) => `
  const origen = document.querySelector('.leaflet-marker-icon svg[data-icono]');
  if (!origen) return 0;
  const lienzo = document.querySelector('.leaflet-container').getBoundingClientRect();
  const rellenos = ${JSON.stringify(rellenosDelTema)};
  rellenos.forEach((f, i) => {
    const c = origen.cloneNode(true);
    c.classList.add('p26-clon');
    c.setAttribute('data-icono', 'clon');
    c.setAttribute('data-papel', f);
    c.querySelector('path').setAttribute('fill', f);
    c.style.cssText = 'position:fixed;z-index:450;pointer-events:none;left:' + (lienzo.x + 60 + i * 44) + 'px;top:' + (lienzo.y + lienzo.height * 0.55) + 'px';
    document.body.append(c);
  });
  return rellenos.length;
`;

/**
 * ⭐ EN CLARO TAMBIÉN (remate de la parte 2, 15/09): los bordes de polígono y los
 * pins se juzgan sobre la tesela de OpenStreetMap con la misma regla. El borde
 * de la ZBE daba 1,46 sobre el tranvía y los pins verde y rojo 2,29-2,68 sobre
 * el oliva, y hasta hoy nadie los vigilaba. El deslumbre, las trazas y los
 * hitos del claro no se juzgan aquí: los llevan pantalla.mjs y la P18-P24.
 */
async function juzgarLoQuePisa(m, dicho, tema = 'dark') {
  const oscuro = tema === 'dark';
  const lo = await leer(m, LO_QUE_PISA);
  const clones = await leer(m, CLONAR_PINS(oscuro ? RELLENOS_DE_PIN : RELLENOS_DE_PIN_EN_CLARO));
  const deLosClones = await leer(m, `return [...document.querySelectorAll('svg.p26-clon')].map((s) => { const r = s.getBoundingClientRect(); const p = s.querySelector('path'); return { icono: 'clon', papel: p.getAttribute('fill'), relleno: p.getAttribute('fill').toLowerCase(), halo: p.getAttribute('stroke').toLowerCase(), caja: { x: r.x - 3, y: r.y - 3, w: r.width + 6, h: r.height + 6 } }; });`);
  await m.evaluar(OCULTAR_CONTROLES);
  await m.dormir(150);
  const con = await m.captura();
  await m.evaluar(OCULTAR_CAPAS);
  await m.dormir(250);
  const sin = await m.captura();
  await m.evaluar(MOSTRAR_CAPAS);
  await m.evaluar(MOSTRAR_CONTROLES);
  await m.evaluar(`document.querySelectorAll('svg.p26-clon').forEach((e) => e.remove())`);

  // El deslumbre: la moda del lienzo sin capas, contra el techo del realce.
  if (oscuro) {
  const L = lo.lienzo;
  const moda = new Map();
  for (let y = Math.floor(L.y); y < Math.min(sin.alto, L.y + L.h); y++) {
    for (let x = Math.floor(L.x); x < Math.min(sin.ancho, L.x + L.w); x++) {
      const o = (y * sin.ancho + x) * 4;
      const k = (sin.datos[o] << 16) | (sin.datos[o + 1] << 8) | sin.datos[o + 2];
      moda.set(k, (moda.get(k) ?? 0) + 1);
    }
  }
  const [kModa] = [...moda.entries()].sort((a, b) => b[1] - a[1])[0];
  const colorModa = { r: (kModa >> 16) & 255, g: (kModa >> 8) & 255, b: kModa & 255 };
  const realce = aRgb(await tokenRgb(m, 'superficie-realce'));
  juzgar(
    luminancia(colorModa) <= luminancia(realce),
    `${dicho} · ⭐ la tesela no deslumbra: su color dominante no es más claro que la superficie del realce`,
    `moda ${enRgb(colorModa)} (luminancia ${luminancia(colorModa).toFixed(4)}) · techo ${enRgb(realce)} (${luminancia(realce).toFixed(4)})`,
  );
  }

  const conPeorTesela = (a, b, tesela) => {
    let min = Infinity, cual = null;
    for (const t of tesela) { const v = Math.max(contrasteRgb(a, t), b ? contrasteRgb(b, t) : 0); if (v < min) { min = v; cual = t; } }
    return { min, cual };
  };

  for (const [clave, grupo] of oscuro ? agrupar(lo.pares, (p) => p.linea + '|' + p.ribete) : []) {
    const [hl, hr] = clave.split('|');
    const linea = deHex6(hl), ribete = deHex6(hr);
    const bajo = teselaBajo(con, sin, grupo.map((p) => p.caja), [linea, ribete], lo.dpr);
    if (bajo.n < MUESTRA_MINIMA) {
      console.log(`  ··  ${dicho} · la traza ${hl} con ribete ${hr} no se mide: ${bajo.n} px pintados en ${grupo.length} trozo(s), por debajo de ${MUESTRA_MINIMA}`);
      continue;
    }
    const entreSi = contrasteRgb(linea, ribete);
    const { min, cual } = conPeorTesela(linea, ribete, bajo.tesela);
    juzgar(
      entreSi >= AA_GRAFICO && min >= AA_GRAFICO,
      `${dicho} · ⭐ la traza ${hl} y su ribete ${hr} se separan de la tesela de debajo: ≥ ${AA_GRAFICO}:1 [1.4.11]`,
      `línea/ribete ${entreSi.toFixed(2)} · peor contra la tesela ${min.toFixed(2)} sobre ${enRgb(cual)} · ${bajo.tesela.length} colores ≥ 1 % bajo ${bajo.n} px · ${grupo.length} trozo(s)`,
    );
  }
  for (const [clave, grupo] of agrupar(lo.bordes, (b) => b.borde + '|' + (b.ribete ?? ''))) {
    const [hb, hr] = clave.split('|');
    const borde = deHex6(hb);
    const ribete = hr ? deHex6(hr) : null;
    const bajo = teselaBajo(con, sin, grupo.map((b) => b.caja), ribete ? [borde, ribete] : [borde], lo.dpr);
    if (bajo.n < MUESTRA_MINIMA) {
      console.log(`  ··  ${dicho} · el borde ${hb}${hr ? ' con ribete ' + hr : ''} no se mide: ${bajo.n} px pintados, por debajo de ${MUESTRA_MINIMA}`);
      continue;
    }
    const { min, cual } = conPeorTesela(borde, ribete, bajo.tesela);
    const entreSi = ribete ? contrasteRgb(borde, ribete) : Infinity;
    juzgar(
      min >= AA_GRAFICO && entreSi >= AA_GRAFICO,
      `${dicho} · ⭐ el borde ${hb}${grupo[0].raya ? ' a rayas' : ''}${hr ? ' y su ribete ' + hr : ''} del polígono se separa de la tesela: ≥ ${AA_GRAFICO}:1 [1.4.11]`,
      `${ribete ? 'borde/ribete ' + entreSi.toFixed(2) + ' · ' : ''}peor ${min.toFixed(2)} sobre ${enRgb(cual)} · ${bajo.tesela.length} colores ≥ 1 % bajo ${bajo.n} px · ${grupo.length} polígono(s)`,
    );
  }
  // Sin viaje no hay pins (YeGo solo pinta su área): entonces no hay tabla que comprobar.
  if (!oscuro && lo.pins.length > 0) {
    const reales = lo.pins.filter((p) => p.icono === 'via').map((p) => p.relleno);
    juzgar(
      reales.length === 2 && reales.every((r) => RELLENOS_DE_PIN_EN_CLARO.includes(r)),
      `${dicho} · los pins reales en claro llevan los tonos que miden los clones`,
      reales.join(' · ') || '(sin pins)',
    );
  }
  for (const p of [...lo.pins, ...deLosClones]) {
    // Un pin fuera del lienzo —la jueza de la vista arrastra el mapa— no está pintado: se dice, no se juzga.
    if (p.caja.w <= 0 || p.caja.h <= 0) {
      console.log(`  ··  ${dicho} · el pin ${p.icono}/${p.papel} no se mide: queda fuera de la vista`);
      continue;
    }
    const relleno = deHex6(p.relleno), halo = deHex6(p.halo);
    const bajo = teselaBajo(con, sin, [p.caja], [halo], lo.dpr);
    const entreSi = contrasteRgb(relleno, halo);
    const { min, cual } = conPeorTesela(relleno, halo, bajo.tesela);
    juzgar(
      clones > 0 && bajo.n >= 10 && bajo.tesela.length > 0 && entreSi >= AA_GRAFICO && min >= AA_GRAFICO,
      `${dicho} · ⭐ el pin ${p.icono}/${p.papel} (${p.relleno}) se lee sobre la tesela por su halo ${p.halo}: ≥ ${AA_GRAFICO}:1 [1.4.11]`,
      `relleno/halo ${entreSi.toFixed(2)} · peor contra la tesela ${Number.isFinite(min) ? min.toFixed(2) : '—'}${cual ? ' sobre ' + enRgb(cual) : ''} · halo pintado ${bajo.n} px`,
    );
  }
  for (const h of oscuro ? lo.hitos : []) {
    const aro = deHex6(h.aro);
    const bajo = teselaBajo(con, sin, [h.caja], [aro], lo.dpr);
    const { min, cual } = conPeorTesela(aro, null, bajo.tesela);
    juzgar(
      bajo.n >= 10 && bajo.tesela.length > 0 && min >= AA_GRAFICO && contrasteRgb(deHex6(h.dibujo), deHex6(h.fondo)) >= AA_GRAFICO,
      `${dicho} · el hito: su aro ${h.aro} contra la tesela, y su dibujo contra su disco: ≥ ${AA_GRAFICO}:1`,
      `aro/tesela ${Number.isFinite(min) ? min.toFixed(2) : '—'}${cual ? ' sobre ' + enRgb(cual) : ''} · dibujo/disco ${contrasteRgb(deHex6(h.dibujo), deHex6(h.fondo)).toFixed(2)}`,
    );
  }
  return lo;
}

async function juzgarControles(m, dicho) {
  const realce = aRgb(await tokenRgb(m, 'superficie-realce'));
  for (const [sel, que] of [['.leaflet-control-zoom-in', 'el «+» del zoom'], ['.leaflet-control-zoom-out', 'el «−» del zoom'], ['.leaflet-control-attribution', 'la atribución']]) {
    const t = await contrasteSiEsta(m, sel, { minimo: 6 });
    juzgar(
      t !== null && t.contraste >= AA_TEXTO && luminancia(t.fondo) <= luminancia(realce),
      `${dicho} · ⭐ ${que} se lee (≥ ${AA_TEXTO}:1 sobre el píxel) y no es un bloque claro dentro del oscuro`,
      t === null ? `(no hay ${sel})` : `${t.contraste.toFixed(2)}:1 · ${enRgb(t.texto)} sobre ${enRgb(t.fondo)} · techo ${enRgb(realce)}`,
    );
  }
}

for (const [k, pantalla] of PANTALLAS.entries()) {
  const movil = pantalla.ancho < 768;
  const alMapa = `[...document.querySelectorAll('.barra__boton')].find((b) => b.textContent.trim().startsWith('Mapa'))?.click()`;
  for (const [i, modo] of MODOS_P26.entries()) {
    const nombre = modo.dicho ?? modo.id;
    const dicho = `P26 · ${pantalla.id} · ${nombre}`;
    const m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: 9600 + 10 * k + i });
    try {
      await m.ir(APP, 6000);
      console.log(`\n═══ EL MAPA EN LOS DOS TEMAS · ${pantalla.nombre} · ${nombre} ═══`);
      await m.evaluar(`window.__p26SinRecarga = 'vivo'`);
      await generarCon(m, modo.id, '', null, modo.ajuste);
      if (movil) {
        await m.evaluar(alMapa);
        await m.dormir(600);
      }
      if (!(await ponerTema(m, 'dark', `${dicho} · oscuro`))) continue;
      await juzgarLaCapa(m, dicho, 'dark');
      await juzgarLoQuePisa(m, dicho);
      await juzgarControles(m, dicho);
      await m.guardar(`${CAPTURAS}/mapa-oscuro-${pantalla.id}-${nombre}.png`);

      // ⭐ Y la capa sigue al atributo EN CALIENTE, ida y vuelta, sin recargar:
      //    la atribución acompaña siempre a su capa (la parte 3 lo pulsará).
      if (modo.id === 'andando') {
        for (const tema of ['light', 'dark', 'light']) {
          if (await ponerTema(m, tema, `${dicho} · en caliente`)) await juzgarLaCapa(m, `${dicho} · en caliente`, tema);
        }
        const vivo = await m.evaluar(`window.__p26SinRecarga`);
        juzgar(vivo === 'vivo', `${dicho} · ⭐ tres cambios de tema y la página NO se ha recargado`, `marca ${vivo}`);
      }
      if (await ponerTema(m, 'light', `${dicho} · claro`)) {
        await juzgarLaCapa(m, dicho, 'light');
        await juzgarLoQuePisa(m, `${dicho} · claro`, 'light');
        await m.guardar(`${CAPTURAS}/mapa-claro-${pantalla.id}-${nombre}.png`);
      }
      if (modo.id === 'andando') {
        // ⭐ Y LA VISTA NO SE MUEVE (remate de la parte 2, bitácora del 15/09):
        //    quien ha arrastrado el mapa y cambia de tema no tiene que perder lo
        //    que movió. Se arrastra de verdad con el ratón y se compara la vista
        //    antes y después. Va AL FINAL de la sesión: el arrastre saca pins de
        //    la vista, y antes de medirlos estorbaría.
        const centro = await leer(m, `const r = document.querySelector('.leaflet-container').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };`);
        await m.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: centro.x, y: centro.y, button: 'left', clickCount: 1 });
        for (let k = 1; k <= 6; k++) await m.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: centro.x - 20 * k, y: centro.y - 12 * k, button: 'left', buttons: 1 });
        await m.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: centro.x - 120, y: centro.y - 72, button: 'left', clickCount: 1 });
        await m.dormir(900);
        const VISTA = `return { panel: getComputedStyle(document.querySelector('.leaflet-map-pane')).transform, zoom: ([...document.querySelectorAll('.leaflet-tile-container img.leaflet-tile')][0]?.src.split('/').slice(-3)[0]) ?? null };`;
        const antes = await leer(m, VISTA);
        for (const tema of ['dark', 'light']) {
          await ponerTema(m, tema, `${dicho} · con el mapa movido`);
          await esperarTeselas(m);
        }
        const despues = await leer(m, VISTA);
        juzgar(
          antes.panel !== 'none' && antes.panel === despues.panel && antes.zoom === despues.zoom,
          `${dicho} · ⭐ y la vista que la persona movió sigue donde la dejó: cambiar de tema no vuelve a encuadrar`,
          `antes ${antes.panel} · z${antes.zoom} → después ${despues.panel} · z${despues.zoom}`,
        );
      }
    } finally {
      m.cerrar();
    }
  }
}

{
  const t = terceros();
  juzgar(t.bien, t.titulo, t.detalle);
}

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
// El veredicto también se lee a máquina: 0 es verde y 1 es rojo, que es lo que
// miran el shell y la batería. Sin esto el rojo solo quedaba en el texto.
process.exitCode = fallos === 0 ? 0 : 1;
