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
import { abrirChrome, contrasteReal, AA_TEXTO } from './medir.mjs';

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
 * ℹ️ El oscuro no se mide aquí y no es un olvido: el producto va clavado en
 *    claro —`<html data-theme="light">`—, así que su banda solo existe pintada
 *    en la sonda de `/identidad`. Su suelo, 21, vive en el censo de allí.
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

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
