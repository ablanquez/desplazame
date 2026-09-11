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

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
