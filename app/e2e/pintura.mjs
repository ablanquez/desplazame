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
import { abrirChrome } from './medir.mjs';

const APP = (process.argv[2] ?? 'http://localhost:4200').replace(/\/+$/, '') + '/';
const CAPTURAS = (process.argv[3] ?? '.').replace(/[\\/]+$/, '');

let fallos = 0;
const juzgar = (bien, titulo, detalle = '') => {
  if (!bien) fallos++;
  console.log(`  ${bien ? 'OK ' : '✗✗ '} ${titulo}${detalle ? '  ·  ' + detalle : ''}`);
};
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

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
