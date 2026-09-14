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
import { abrirChrome, contrasteReal, contrasteRgb, AA_GRAFICO, AA_TEXTO } from './medir.mjs';

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
    const aire = await leer(m, `
      const huecos = [];
      for (const f of document.querySelectorAll('.paso__frase')) {
        const chip = f.querySelector('.chip-linea');
        const texto = f.querySelector('.paso__texto');
        if (!chip || !texto) continue;
        const paseo = document.createTreeWalker(texto, NodeFilter.SHOW_TEXT);
        let nodo = paseo.nextNode();
        while (nodo && !(nodo.nodeValue || '').trim()) nodo = paseo.nextNode();
        if (!nodo) continue;
        const r = document.createRange();
        r.selectNodeContents(nodo);
        const primera = r.getClientRects()[0];
        if (!primera) continue;
        huecos.push(Math.round((primera.left - chip.getBoundingClientRect().right) * 100) / 100);
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
  await m.evaluar(`(() => {
    const pedir = window.fetch;
    window.fetch = async function (...args) {
      const respuesta = await pedir.apply(this, args);
      const url = String(args[0]?.url ?? args[0]);
      if (!url.includes('/api/ruta') || !respuesta.ok) return respuesta;
      const cuerpo = JSON.parse(await respuesta.clone().text());
      const t = cuerpo.trayecto ?? cuerpo;
      // En un paso que NO es hito, la forma del aviso de la ZBE. La primera versión
      // sembraba en la primera subida y ahí tapaba al aviso MUDO del bus, que cae en
      // el mismo paso: la tira enseña una sola nota y el mudo se quedaba arriba.
      const HITOS = ['salida', 'sube', 'baja', 'transborda', 'coge', 'aparca', 'llegada'];
      const i = t.pasos.findIndex((p, k) => k > 0 && !HITOS.includes(p.giro));
      if (i >= 0) t.avisos.push({ texto: ${JSON.stringify(SEMBRADO)}, paso: i });
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

for (const pantalla of [{ id: 'pc', ancho: 1440, alto: 1000, puerto: 9422 }, { id: 'movil', ancho: 390, alto: 844, puerto: 9423 }]) {
  const m = await abrirChrome({ ancho: pantalla.ancho, alto: pantalla.alto, puerto: pantalla.puerto });
  try {
    await m.ir(APP, 6000);
    console.log(`\n═══ LA FASE C · ${pantalla.id === 'pc' ? 'PC 1440' : 'MÓVIL 390'} ═══`);
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
      const banda = aRgb(await tokenRgb(m, 'banda-cabecera'));
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

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
