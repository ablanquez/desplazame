/**
 * ⭐ EL ESQUELETO, MEDIDO EN CHROME DE VERDAD (10/09, tanda 3).
 *
 * Las cuatro juezas del layout. Ninguna cabe en un test de jsdom: allí no hay
 * viewport, ni media queries que apliquen, ni scroll que agotar, ni Leaflet
 * pintando teselas. Lo que aquí se comprueba **es lo que se ve**.
 *
 * ⚠️ Y SE MIDE LO PINTADO, NO LA CAJA. Durante esta misma tanda la hoja
 *    inferior estuvo tapada entera por el mapa —los panes de Leaflet llegan a
 *    z-index 700 y el panel iba en 20— y `getBoundingClientRect` seguía
 *    devolviendo sus 390×154 px tan tranquilo. Una jueza que se hubiera
 *    conformado con el rectángulo habría dado verde sobre algo invisible.
 *
 * Se lanza a mano, con el motor sirviendo el `dist`:
 *     node e2e/esqueleto.mjs http://localhost:3111 <carpeta-de-capturas>
 */
import { abrirChrome } from './medir.mjs';

const APP = (process.argv[2] ?? 'http://localhost:4200').replace(/\/+$/, '') + '/';
const CAPTURAS = (process.argv[3] ?? '.').replace(/[\\/]+$/, '');

/** El móvil y el escritorio. El umbral que los separa es 768 [referencia]. */
const ANCHOS = {
  movil: { ancho: 390, alto: 844, puerto: 9361 },
  escritorio: { ancho: 1440, alto: 900, puerto: 9362 },
};

let fallos = 0;
const juzgar = (bien, titulo, detalle = '') => {
  if (!bien) fallos++;
  console.log(`  ${bien ? 'OK ' : '✗✗ '} ${titulo}${detalle ? '  ·  ' + detalle : ''}`);
};

/** Lee del navegador un objeto serializado. */
const leer = (m, expr) => m.evaluar(`JSON.stringify((() => { ${expr} })())`).then(JSON.parse);

for (const [nombre, { ancho, alto, puerto }] of Object.entries(ANCHOS)) {
  const m = await abrirChrome({ ancho, alto, puerto });
  const esMovil = nombre === 'movil';
  try {
    const estadoDeLosBloquesSimple =
      `return [...document.querySelectorAll('.bloque')].map((b) => b.classList.contains('bloque--abierto'));`;
    await m.ir(APP, 6000);
    console.log(`\n═══ ${nombre.toUpperCase()} · ${ancho}×${alto} ═══`);

    // ═══════════ L4 · EL ESQUELETO EXISTE, Y CAMBIA CON EL ANCHO ═══════════
    //
    // La misma implementación en los dos: lo que cambia es qué aplica. Se mide
    // lo PINTADO —qué se ve y dónde está— y no solo que el nodo exista.
    const forma = await leer(
      m,
      `
      const q = (s) => document.querySelector(s);
      const caja = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const ve = (s) => { const e = q(s); if (!e) return false; const c = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
      return {
        marco: caja('.marco'), panel: caja('.panel'), zonaMapa: caja('.zona-mapa'),
        tablero: caja('.tablero'),
        veSeparador: ve('.separador'),
        // AQUI SE LEIA EL ASA DE LA HOJA —la pildora de 4x32 y su area de
        // toque de 48— y esta lectura REVENTO el 11/09 con un
        // «getComputedStyle: parameter 1 is not of type Element»: la hoja
        //    murió y el nodo no existe. Fue la primera jueza en morder, y de la
        //    manera más ruidosa posible, que es la buena.
        veBarra: ve('.barra'),
        veCreditos: ve('.creditos'),
        vePuertaMovil: ve('.puerta-creditos'),
        veCabeceraAcordeon: ve('.bloque__cabecera'),
        vePestanaCabecera: ve('.pestana__cabecera'),
        botones: [...document.querySelectorAll('.barra__boton')].map((b) => {
          const r = b.getBoundingClientRect();
          return {
            texto: b.textContent.trim(),
            w: Math.round(r.width), h: Math.round(r.height),
            actual: b.getAttribute('aria-current'),
          };
        }),
        altoBarra: caja('.barra')?.h ?? 0,
        // Qué pestaña dice el marco que se está mirando.
        pestana: document.querySelector('.marco').getAttribute('data-pestana'),
      };
    `,
    );

    juzgar(
      forma.marco.w === ancho && forma.marco.h === alto,
      'L4 · el marco ocupa la pantalla EXACTA',
      `${forma.marco.w}×${forma.marco.h}`,
    );

    if (esMovil) {
      // ⭐ LA LETRA NUEVA (11/09): en móvil manda LA BARRA DE PESTAÑAS. Lo que
      //    aquí se comprobaba —el asa, el radio de 28 de la hoja, la píldora de
      //    4×32— se retira con la hoja, no se afloja: ya no hay hoja que medir.
      juzgar(
        forma.veBarra && !forma.veSeparador,
        'L4 · en móvil manda la barra de pestañas, no el separador',
      );
      juzgar(
        forma.botones.length === 3 &&
          forma.botones.map((b) => b.texto).join('|') === 'Buscador|Ruta|Mapa',
        'L4 · ⭐ la barra tiene TRES huecos, y son los del encargo',
        forma.botones.map((b) => b.texto).join(' · ') || '(ninguno)',
      );
      // ⚠️ El reparto equitativo se compra midiendo, no leyendo el `flex`: tres
      //    botones que suman el ancho de la pantalla y miden lo mismo.
      const anchos = forma.botones.map((b) => b.w);
      juzgar(
        anchos.length === 3 && Math.max(...anchos) - Math.min(...anchos) <= 1 &&
          Math.abs(anchos.reduce((a, b) => a + b, 0) - ancho) <= 2,
        'L4 · y se reparten la pantalla a partes iguales',
        `${anchos.join(' + ')} = ${anchos.reduce((a, b) => a + b, 0)} de ${ancho}`,
      );
      // [WCAG 2.5.5] el objetivo mínimo; la maqueta pide 48 y es lo que se mide.
      juzgar(
        forma.botones.every((b) => b.h >= 48),
        'L4 · cada hueco de la barra es tocable [WCAG 2.5.5: ≥48]',
        forma.botones.map((b) => `${b.texto} ${b.h}px`).join(' · '),
      );
      // ⚠️ El color NO es la única señal de cuál está puesta [WCAG 1.4.1].
      juzgar(
        forma.botones.filter((b) => b.actual === 'page').length === 1 &&
          forma.botones.find((b) => b.actual === 'page')?.texto.startsWith('Buscador'),
        'L4 · ⭐ y la puesta se dice con `aria-current`, no solo con el color',
        forma.botones.map((b) => `${b.texto}:${b.actual ?? '—'}`).join(' · '),
      );
      // ⭐ LA PESTAÑA ES LA PANTALLA ENTERA: el panel llena el tablero, no un
      //    trozo de abajo como hacía la hoja.
      juzgar(
        forma.panel.y === forma.tablero.y && forma.panel.h === forma.tablero.h &&
          forma.panel.w === ancho,
        'L4 · ⭐ la pestaña ocupa el tablero ENTERO, no un trozo de abajo',
        `panel ${forma.panel.w}×${forma.panel.h} desde y=${forma.panel.y} · tablero ${forma.tablero.h}`,
      );
      juzgar(
        forma.zonaMapa.h === forma.tablero.h,
        'L4 · y el mapa sigue midiendo el tablero entero, debajo',
        `mapa ${forma.zonaMapa.h}px de ${forma.tablero.h}`,
      );
      // ⛔ LA FRANJA DEL PIE NO ESTÁ, y la puerta a /creditos sí: ver la ley
      //    repartida que explica la plantilla junto a `.puerta-creditos`.
      juzgar(
        !forma.veCreditos && forma.vePuertaMovil,
        'L4 · ⛔ la franja del pie no está, y la puerta a /creditos sí',
        `franja ${forma.veCreditos} · puerta ${forma.vePuertaMovil}`,
      );
      // Y el acordeón no manda: su cabecera con chevrón no se pinta.
      juzgar(
        !forma.veCabeceraAcordeon,
        'L4 · sin acordeón: la cabecera con chevrón no se pinta en móvil',
      );
    } else {
      juzgar(
        !forma.veBarra && forma.veSeparador,
        'L4 · en escritorio manda el separador, no la barra',
      );
      juzgar(
        forma.veCreditos && !forma.vePuertaMovil && forma.veCabeceraAcordeon &&
          !forma.vePestanaCabecera,
        'L4 · y vuelve todo lo suyo: franja, acordeón, y nada de móvil',
        `franja ${forma.veCreditos} · puerta ${forma.vePuertaMovil} · ` +
          `acordeón ${forma.veCabeceraAcordeon} · cabecera de pestaña ${forma.vePestanaCabecera}`,
      );
      // ⭐ El panel a la IZQUIERDA y el mapa a la DERECHA [DISEÑO §211].
      juzgar(
        forma.panel.x === 0 && forma.zonaMapa.x >= forma.panel.w,
        'L4 · el panel a la izquierda y el mapa a la derecha',
        `panel x=${forma.panel.x} w=${forma.panel.w} · mapa x=${forma.zonaMapa.x}`,
      );
      // ⭐ EL ANCHO YA NO ES EL DE LA REFERENCIA: ES UNA SUMA (10/09, remate-bis).
      //
      // ⚠️ Esta jueza decía «500 + su borde» y **mordió en rojo al cambiarlo**,
      //    que es lo que se le pedía: `559×876`. [ANTONIO] manda sobre el calco,
      //    así que se actualiza a la letra nueva en vez de aflojarla — y la
      //    letra nueva no es un número redondo, es el peor caso medido:
      //
      //        Bus / Tranvía abierto 141,23 + Patín (VMP) abierto 133,97
      //        + 4 círculos × 46 + 5 huecos × 8   = 499,20 la fila
      //        + 26 de la tarjeta + 32 del cuerpo = 557,20 → 558 de `width`
      //
      //    559 pintados, con su borde derecho. Que la suma se cumpla de verdad
      //    —los seis en una línea en cualquier combinación— lo mide
      //    `e2e/pintura.mjs`, que es quien sabe abrir chips.
      juzgar(
        forma.panel.w === 559 && forma.panel.h === forma.tablero.h,
        'L4 · la columna mide su peor caso (558 + su borde) y llena el tablero',
        `${forma.panel.w}×${forma.panel.h} de ${forma.tablero.h}`,
      );
    }

    // ⭐ EL ESTADO INICIAL, calcado de la referencia: buscador abierto y
    //    resultado plegado (`useState(true)` / `useState(false)`). Se mide
    //    ANTES de tocar nada — en cuanto una jueza pulse algo, se pierde.
    const alArrancar = await leer(m, estadoDeLosBloquesSimple);
    juzgar(
      alArrancar[0] === true && alArrancar[1] === false,
      'L5 · al arrancar: el buscador abierto y el resultado plegado',
      `buscador ${alArrancar[0] ? 'abierto' : 'plegado'} · resultado ${alArrancar[1] ? 'abierto' : 'plegado'}`,
    );

    // ═══════════ L6 · LOS CREDITOS Y LA ATRIBUCION NATIVA, SIN PISARSE ═══════
    //
    // ⚠️ La maqueta esconde la atribucion de Leaflet con `display: none` y
    //    escribe la suya en su lugar. Aqui NO: tapar una atribucion para
    //    reescribirla es lo que no debe pasar por descuido, asi que conviven —
    //    y que convivan se MIDE, porque la primera version del pie tapaba el
    //    principio de la de Leaflet y solo se vio en la captura.
    const pie = await leer(
      m,
      `
      const c = document.querySelector('.creditos');
      const a = document.querySelector('.leaflet-control-attribution');
      if (!c || !a) return null;
      const rc = c.getBoundingClientRect(), ra = a.getBoundingClientRect();
      const solapa = !(rc.right <= ra.left || ra.right <= rc.left ||
                       rc.bottom <= ra.top || ra.bottom <= rc.top);
      const ve = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
      // Y el punto medio de la atribucion tiene que devolverla A ELLA.
      const enMedio = document.elementFromPoint(ra.x + ra.width / 2, ra.y + ra.height / 2);
      const enElPie = document.elementFromPoint(rc.x + rc.width / 2, rc.y + rc.height / 2);
      return { solapa, veCreditos: ve(c), veAtribucion: ve(a),
               atribucionDestapada: !!enMedio && (enMedio === a || a.contains(enMedio)),
               creditosDestapados: !!enElPie && (enElPie === c || c.contains(enElPie)),
               diceOsm: /OpenStreetMap/i.test(c.innerText),
               diceLeaflet: /Leaflet/.test(c.innerText),
               // ⭐ LA LETRA NUEVA (10/09, remate 2). La franja se encogio a
               //    UNA linea: «Leaflet | © colaboradores de OpenStreetMap ·
               //    Creditos». El resto de la atribucion se fue a /creditos
               //    [RD 1495/2011: el aviso accesible «de forma permanente,
               //    facil y directa»], y lo unico que NO puede irse es la de
               //    OSM, que la politica de teselas exige ver sobre el mapa.
               enlaceCreditos: !!c.querySelector('a[href$="/creditos"]'),
               // ⚠️ «Una linea» se MIDE, no se supone. Un rango sobre el
               //    contenido devuelve un rectangulo POR FRAGMENTO —no por
               //    renglon: medido, daba 16 sobre una linea de 24 px de
               //    alto—, asi que lo que se cuenta son las ALTURAS DISTINTAS
               //    a las que empiezan esos rectangulos, que si son los
               //    renglones. Si en movil envolviera, aqui saldria 2.
               lineas: (() => { const p = c.querySelector('.creditos__linea');
                 if (!p) return 0; const r = document.createRange();
                 r.selectNodeContents(p);
                 return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; })(),
               altoPie: Math.round(rc.height),
               textos: c.innerText.replace(/\s+/g, ' ').length };
    `,
    );
    // ⚠️ ESTA JUEZA SE PARTE EN DOS EL 11/09, y no por comodidad: en móvil la
    //    franja del pie YA NO EXISTE —ese borde lo ocupa la barra de pestañas—,
    //    así que medir «el pie y la nativa sin pisarse» allí no tiene sujeto.
    //    Mordió tal cual estaba: «pie 0px · destapado: false».
    //
    //    La ley no cambia; cambia quién la cumple en cada ancho:
    //    · ESCRITORIO: la franja del marco lo dice, y la nativa de Leaflet
    //      convive con ella sin pisarse. Igual que siempre.
    //    · MÓVIL: lo dice EL CONTROL NATIVO de Leaflet dentro de la pestaña
    //      Mapa, que es exactamente donde la política de teselas de OSM lo
    //      exige —sobre el mapa y sin interfaz encima—, y las otras dos
    //      pestañas no enseñan mapa, así que no hay mapa cuya atribución falte.
    if (!esMovil) {
      juzgar(
        pie !== null && pie.veCreditos && pie.creditosDestapados && pie.diceOsm && !pie.solapa,
        'L6 · la atribución a OpenStreetMap se lee, y nadie tapa el pie',
        pie
          ? `pie ${pie.altoPie}px · dice OSM: ${pie.diceOsm} · destapado: ${pie.creditosDestapados}` +
            ` · la nativa ${pie.atribucionDestapada ? 'tambien se ve' : 'queda debajo'}`
          : 'falta alguno',
      );

      // ⭐ Y LA FRANJA ES UNA LINEA, CON SU PUERTA. Las dos mitades de la letra:
      //    lo que se queda —Leaflet y OSM, que son lo del mapa— y lo que lleva
      //    al resto —el enlace a /creditos—.
      juzgar(
        pie !== null && pie.diceLeaflet && pie.diceOsm && pie.enlaceCreditos && pie.lineas === 1,
        'L6 · la franja es UNA sola línea: Leaflet, OSM y la puerta a /creditos',
        pie
          ? `${pie.lineas} renglón(es) · Leaflet: ${pie.diceLeaflet} · OSM: ${pie.diceOsm}` +
            ` · enlace a /creditos: ${pie.enlaceCreditos} · ${pie.altoPie}px de alto`
          : 'no hay pie',
      );
    } else {
      // Se va a la pestaña Mapa, que es donde el mapa se ve.
      await m.evaluar(`[...document.querySelectorAll('.barra__boton')].find((b) => b.textContent.trim().startsWith('Mapa')).click()`);
      await m.dormir(600);
      const nativa = await leer(
        m,
        `
        const a = document.querySelector('.leaflet-control-attribution');
        if (!a) return null;
        const r = a.getBoundingClientRect();
        const s = getComputedStyle(a);
        // El punto medio tiene que devolverla A ELLA: que exista y mida no
        // prueba que se vea — la hoja la tapaba «en silencio» y solo se cazo
        // mirando la captura (ver el comentario del z-index en styles.css).
        const enMedio = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          ve: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0,
          destapada: !!enMedio && (enMedio === a || a.contains(enMedio)),
          diceOsm: /OpenStreetMap/i.test(a.innerText),
          diceLeaflet: /Leaflet/.test(a.innerText),
          dentroDePantalla: r.top >= 0 && r.bottom <= window.innerHeight + 1 &&
                            r.left >= 0 && r.right <= window.innerWidth + 1,
          caja: Math.round(r.width) + 'x' + Math.round(r.height),
          hayFranja: !!document.querySelector('.creditos') &&
                     getComputedStyle(document.querySelector('.creditos')).display !== 'none',
        };
      `,
      );
      juzgar(
        nativa !== null && nativa.ve && nativa.destapada && nativa.diceOsm &&
          nativa.dentroDePantalla,
        'L6 · ⭐ en móvil la atribución de OSM la lleva el control NATIVO, y está destapada',
        nativa
          ? `${nativa.caja} · OSM: ${nativa.diceOsm} · Leaflet: ${nativa.diceLeaflet}` +
            ` · destapada: ${nativa.destapada} · dentro de pantalla: ${nativa.dentroDePantalla}`
          : 'no hay control de atribución',
      );
      juzgar(
        nativa !== null && !nativa.hayFranja,
        'L6 · ⛔ y la franja del pie no está: la sustituyen la nativa y la puerta del formulario',
      );
      await m.guardar(`${CAPTURAS}/pestana-mapa.png`);
      // Se vuelve al buscador para no dejar el terreno movido a las siguientes.
      await m.evaluar(`[...document.querySelectorAll('.barra__boton')].find((b) => b.textContent.trim().startsWith('Buscador')).click()`);
      await m.dormir(400);
    }

    // ═══════════ L1 · SIN SCROLL GLOBAL ═══════════
    //
    // ⚠️ No basta con que `scrollTop` sea 0: eso lo cumple cualquier página que
    //    quepa. Se comprueba que **no hay nada que desplazar** aunque dentro
    //    haya contenido de sobra — y de sobra lo hay: el formulario no cabe.
    const global = await leer(
      m,
      `
      const d = document.documentElement;
      return {
        desbordaDoc: d.scrollHeight > d.clientHeight + 1,
        desbordaBody: document.body.scrollHeight > document.body.clientHeight + 1,
        overflowHtml: getComputedStyle(d).overflowY,
        overflowBody: getComputedStyle(document.body).overflowY,
        hayContenidoDeSobra: [...document.querySelectorAll('.bloque__cuerpo')]
          .some((e) => e.scrollHeight > e.clientHeight + 1),
      };
    `,
    );
    juzgar(
      !global.desbordaDoc && !global.desbordaBody,
      'L1 · el documento no tiene nada que desplazar',
      `html ${global.overflowHtml} · body ${global.overflowBody}`,
    );

    // ═══════════ L2 · EL SCROLL DE UN BLOQUE NO SE ESCAPA ═══════════
    //
    // ⚠️ Aquí se EMPUJA DE VERDAD con la rueda, no se lee una propiedad. Que
    //    `overscroll-behavior` diga `contain` es lo que está escrito; que la
    //    página no se mueva al agotar el bloque es lo que pasa.
    // ⚠️ LA PRECONDICION SE CONSTRUYE, no se supone. Esta juez daba por hecho
    //    que algun bloque desbordaria, y con el resultado plegado —el estado
    //    inicial de la referencia— el buscador tiene 760 px y le cabe todo:
    //    no habia nada que agotar y la juez se quedaba sin objeto. Se abren
    //    los dos, que es cuando se reparten la altura y el formulario no cabe.
    // ⚠️ EN MOVIL YA NO HAY QUE PREPARAR NADA, y aqui se desplegaba la hoja.
    //    La pestaña Buscador es la pantalla entera y el formulario no le cabe:
    //    la precondicion —un bloque con contenido de sobra— viene puesta.
    if (!esMovil) {
      for (const i of [0, 1]) {
        const abierto = await m.evaluar(
          `document.querySelectorAll('.bloque')[${i}].classList.contains('bloque--abierto')`,
        );
        if (!abierto) {
          await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[${i}].click()`);
          await m.dormir(400);
        }
      }
    }
    const cuerpo = await leer(
      m,
      `
      const e = [...document.querySelectorAll('.bloque__cuerpo')].find((x) => x.scrollHeight > x.clientHeight + 1);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
               contain: getComputedStyle(e).overscrollBehaviorY };
    `,
    );

    if (cuerpo) {
      // Se agota el bloque a base de rueda, y luego se sigue empujando.
      for (let i = 0; i < 30; i++) {
        await m.cdp('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: cuerpo.x,
          y: cuerpo.y,
          deltaX: 0,
          deltaY: 400,
        });
      }
      await m.dormir(600);
      const tras = await leer(
        m,
        `
        const e = [...document.querySelectorAll('.bloque__cuerpo')].find((x) => x.scrollHeight > x.clientHeight + 1);
        return {
          agotado: e ? e.scrollTop + e.clientHeight >= e.scrollHeight - 2 : false,
          scrollDoc: Math.round(document.documentElement.scrollTop + window.scrollY),
          arribaDelMarco: Math.round(document.querySelector('.marco').getBoundingClientRect().y),
        };
      `,
      );
      juzgar(tras.agotado, 'L2 · el bloque se ha desplazado hasta el final', `contain: ${cuerpo.contain}`);
      juzgar(
        tras.scrollDoc === 0 && tras.arribaDelMarco === 0,
        'L2 · y agotado, seguir empujando NO mueve la página',
        `scroll del documento ${tras.scrollDoc} · el marco sigue en y=${tras.arribaDelMarco}`,
      );
    } else {
      juzgar(false, 'L2 · había un bloque con contenido de sobra que agotar', 'no lo hay: nada que medir');
    }

    // ═══════════ L5 · EL ABATIMIENTO, EN LAS CUATRO COMBINACIONES ═══════════
    //
    // ⚠️ ESTA ES LA JUEZA QUE FALTABA. La tanda 3 midio tamanos, posiciones,
    //    scroll y re-encuadre —todo verde— y el acordeon no plegaba: las
    //    cuatro juezas del layout habian medido la casa sin probar las
    //    puertas. Un control que cambia de estado necesita una jueza que lo
    //    PULSE, y entra en la misma tanda que el control. Bitacora nº46.
    const estadoDeLosBloques = `
      const marco = document.querySelector('.marco').getBoundingClientRect();
      const q = (e, s) => e.querySelector(s);
      return [...document.querySelectorAll('.bloque')].map((b) => {
        const cab = q(b, '.bloque__cabecera');
        const rc = cab.getBoundingClientRect();
        const cue = q(b, '.bloque__cuerpo');
        const rb = b.getBoundingClientRect();
        // ⚠️ «Clicable» de verdad: que el punto medio de la cabecera devuelva
        //    la propia cabecera. Estar en el DOM y tener un rectangulo no basta
        //    —lo aprendimos con la hoja tapada por el mapa—: si algo esta
        //    encima, o si el bloque la recorta, aqui sale otro elemento.
        const enElPunto = document.elementFromPoint(rc.x + rc.width / 2, rc.y + rc.height / 2);
        return {
          abierto: b.classList.contains('bloque--abierto'),
          altoBloque: Math.round(rb.height),
          altoCabecera: Math.round(rc.height),
          cabeceraDentro: rc.y >= marco.y - 1 && rc.bottom <= marco.bottom + 1,
          cabeceraClicable: !!enElPunto && (enElPunto === cab || cab.contains(enElPunto)),
          // ⚠️ Se mide si el cuerpo OCUPA, no si existe en el DOM. El acordeón
          //    oculta en vez de destruir —el porqué, en el checkpoint— así que
          //    el nodo está siempre y lo que cambia es cuánto mide. Preguntar
          //    por su existencia sería volver a medir el DOM en vez del píxel.
          cuerpoOcupa: cue ? cue.getBoundingClientRect().height > 0 : false,
          altoCuerpo: cue ? Math.round(cue.getBoundingClientRect().height) : 0,
        };
      });
    `;

    /** Deja el acordeon en la combinacion pedida, pulsando de verdad. */
    const ponerEn = async (buscador, pasos) => {
      for (const [i, quiero] of [buscador, pasos].entries()) {
        const hay = await m.evaluar(
          `document.querySelectorAll('.bloque')[${i}].classList.contains('bloque--abierto')`,
        );
        if (hay !== quiero) {
          await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[${i}].click()`);
          await m.dormir(400);
        }
      }
      return leer(m, estadoDeLosBloques);
    };

    // ⚠️ LAS CUATRO COMBINACIONES SON DE ESCRITORIO, y desde el 11/09 SOLO de
    //    escritorio: en movil no hay acordeon que combinar — cada pestaña es la
    //    pantalla entera y son excluyentes. Lo de movil lo compra L8, abajo.
    console.log('');
    for (const [b, p] of (esMovil ? [] : [[true, false], [true, true], [false, true], [false, false]])) {
      const bl = await ponerEn(b, p);
      const como = `${b ? 'abierto' : 'plegado'}/${p ? 'abierto' : 'plegado'}`;

      juzgar(
        bl.every((x) => x.cabeceraDentro && x.cabeceraClicable && x.altoCabecera >= 44),
        `L5 · ${como} — las dos cabeceras dentro del marco y clicables`,
        bl.map((x) => `${x.altoCabecera}px${x.cabeceraDentro ? '' : ' FUERA'}${x.cabeceraClicable ? '' : ' TAPADA'}`).join(' · '),
      );

      // Plegado = SOLO la cabecera. Nada de cuerpo, ni escondido ni a cero.
      juzgar(
        bl.every((x) => x.abierto || (!x.cuerpoOcupa && Math.abs(x.altoBloque - x.altoCabecera) <= 2)),
        `L5 · ${como} — el plegado ensena SOLO su cabecera`,
        bl.map((x) => (x.abierto ? 'abierto' : `bloque ${x.altoBloque} / cabecera ${x.altoCabecera}` + (x.cuerpoOcupa ? ' ⚠ el cuerpo ocupa ' + x.altoCuerpo : ''))).join(' · '),
      );

      // Y el abierto se queda con el resto: mas alto que su propia cabecera.
      const abiertos = bl.filter((x) => x.abierto);
      if (abiertos.length) {
        juzgar(
          abiertos.every((x) => x.altoCuerpo > 0 && x.altoBloque > x.altoCabecera + 20),
          `L5 · ${como} — el abierto se queda con el sitio que sobra`,
          abiertos.map((x) => `${x.altoBloque}px`).join(' · '),
        );
      }
    }

    // ═══════════ L7 · LA COREOGRAFIA COMPLETA: LA IDA Y LA VUELTA ═══════════
    //
    // ⚠️ LA MITAD QUE FALTABA. La ida entro con el remate 1 —[DISENO §57]
    //    «abatir automaticamente el buscador al obtener resultados; el usuario
    //    lo reabre a mano»—, pero «lo reabre a mano» no decia que pasaba con el
    //    resultado, y lo que pasaba era NADA: quedaban los dos abiertos
    //    reparteindose la altura. La vuelta la decide Antonio, y es la simetrica
    //    de la ida: reabrir el buscador pliega el resultado — o sea, el estado
    //    exacto del arranque.
    //
    // Se mide EN LO PINTADO, con el mismo lector que L5 —alturas de caja y
    // `cuerpoOcupa`—, no leyendo clases ni preguntandole a la senal.
    //
    // ⚠️ Y se genera UNA RUTA DE VERDAD, no se simula el estado a mano: la ida
    //    solo existe dentro de `generarRuta`, asi que fabricarla desde fuera
    //    seria juzgar una coreografia que la app no baila. Hace falta el motor
    //    sirviendo el dist — es como se lanza este fichero.
    {
      const escribir = async (i, texto) => {
        await m.evaluar(`(() => {
          const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
          if (!c) return;
          const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
        })()`);
        await m.dormir(900);
      };
      const elegir = async (i, exacto) => {
        await m.evaluar(`(() => {
          const c = document.querySelectorAll('app-autocompletar-via')[${i}];
          if (!c) return;
          const ops = [...c.querySelectorAll('[role=option]')];
          const o = ops.find((x) => x.textContent.trim().toUpperCase() === ${JSON.stringify(exacto.toUpperCase())}) ?? ops[0];
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
          if (!c) return;
          const ops = [...c.querySelectorAll('[role=option]')];
          const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
          if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
        })()`);
        await m.dormir(500);
      };

      // El buscador tiene que estar abierto para escribir en el: L5 lo dejo
      // plegado, y un campo oculto no se rellena. En movil la pestaña Buscador
      // ya es la que se esta mirando.
      if (!esMovil) {
        await ponerEn(true, false);
      }
      await escribir(0, 'COLOSO');
      await elegir(0, 'COLOSO');
      await portal(0, '2');
      await escribir(1, 'CALLE OVIEDO');
      await elegir(1, 'CALLE OVIEDO');
      await portal(1, '5');
      // Andando: es el modo que el motor SI calcula y el que menos tarda. Bus
      // y coche se van por el atajo del «todavia no» y no llegan a la ida.
      await m.evaluar(`document.querySelector('input[name=familia][value=andando]').click()`);
      await m.dormir(300);

      const listo = await m.evaluar(`(() => {
        const b = [...document.querySelectorAll('button.generar')][0];
        return !!b && !b.disabled;
      })()`);
      juzgar(listo === true, 'L7 · los cuatro campos puestos: «Generar ruta» se puede pulsar');

      if (listo) {
        await m.evaluar(`document.querySelector('button.generar').click()`);
        // Se espera a que la ruta LLEGUE, no N milisegundos: el boton vuelve de
        // «Generando…» cuando el motor ha contestado.
        for (let i = 0; i < 60 && (await m.evaluar(`!!document.querySelector('button.generar')?.disabled`)); i++) {
          await m.dormir(500);
        }
        await m.dormir(600);

        if (!esMovil) {
          const ida = await leer(m, estadoDeLosBloques);
          juzgar(
            ida[0].abierto === false && !ida[0].cuerpoOcupa && ida[1].abierto === true && ida[1].altoCuerpo > 0,
            'L7 · IDA — al generar: el resultado se abre y el buscador se pliega',
            `buscador ${ida[0].abierto ? 'abierto' : 'plegado'} (cuerpo ${ida[0].altoCuerpo}px) · ` +
              `resultado ${ida[1].abierto ? 'abierto' : 'plegado'} (cuerpo ${ida[1].altoCuerpo}px)`,
          );

          await m.guardar(`${CAPTURAS}/coreografia-${nombre}-ida.png`);

          // Y LA VUELTA: se pulsa la cabecera del Buscador, como haria una mano.
          await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[0].click()`);
          await m.dormir(500);
          const vuelta = await leer(m, estadoDeLosBloques);
          juzgar(
            vuelta[0].abierto === true && vuelta[0].altoCuerpo > 0 &&
              vuelta[1].abierto === false && !vuelta[1].cuerpoOcupa,
            'L7 · VUELTA — al reabrir el buscador: el resultado se pliega abajo',
            `buscador ${vuelta[0].abierto ? 'abierto' : 'plegado'} (cuerpo ${vuelta[0].altoCuerpo}px) · ` +
              `resultado ${vuelta[1].abierto ? 'abierto' : 'plegado'} (cuerpo ${vuelta[1].altoCuerpo}px)`,
          );
          // Y el sitio al que se vuelve es EL DEL ARRANQUE, no uno parecido.
          juzgar(
            vuelta[0].abierto === alArrancar[0] && vuelta[1].abierto === alArrancar[1],
            'L7 · y la vuelta deja exactamente el estado del arranque',
            `arranque ${alArrancar.join('/')} · vuelta ${vuelta.map((x) => x.abierto).join('/')}`,
          );

          await m.guardar(`${CAPTURAS}/coreografia-${nombre}-vuelta.png`);
        } else {
          // ⭐ LA COREOGRAFIA DE MOVIL (11/09) — `handleGenerateRoute` salta a
          //    la pestaña «Ruta», y `handleReset` vuelve a «Buscador».
          const ida = await leer(
            m,
            `
            const marco = document.querySelector('.marco');
            const pasos = document.querySelector('.bloque--pasos');
            const r = pasos ? pasos.getBoundingClientRect() : null;
            return {
              pestana: marco.getAttribute('data-pestana'),
              actual: [...document.querySelectorAll('.barra__boton')]
                .find((b) => b.getAttribute('aria-current') === 'page')?.textContent.trim() ?? null,
              altoPasos: r ? Math.round(r.height) : 0,
              hayPasos: document.querySelectorAll('.paso').length,
            };
          `,
          );
          juzgar(
            ida.pestana === 'ruta' && ida.altoPasos > 0 && ida.hayPasos > 0,
            'L7 · ⭐ IDA en movil — al generar se salta a la pestaña «Ruta», con la ruta dentro',
            `pestaña ${ida.pestana} · barra dice «${ida.actual}» · ${ida.hayPasos} pasos en ${ida.altoPasos}px`,
          );
          await m.guardar(`${CAPTURAS}/coreografia-${nombre}-ida.png`);

          // LA VUELTA: «Limpiar busqueda» — que en movil vive en la pestaña
          // Buscador, asi que primero se vuelve a ella con la barra, como una
          // mano.
          await m.evaluar(`[...document.querySelectorAll('.barra__boton')].find((b) => b.textContent.trim().startsWith('Buscador')).click()`);
          await m.dormir(400);
          await m.evaluar(`document.querySelector('button.limpiar').click()`);
          await m.dormir(600);
          const vuelta = await leer(
            m,
            `
            return {
              pestana: document.querySelector('.marco').getAttribute('data-pestana'),
              marcados: [...document.querySelectorAll('input[name=familia]')].filter((r) => r.checked).length,
              calles: [...document.querySelectorAll('app-autocompletar-via input')].map((c) => c.value).join('|'),
              generar: document.querySelector('button.generar').disabled,
              trazas: document.querySelectorAll('.leaflet-overlay-pane path').length,
            };
          `,
          );
          juzgar(
            vuelta.pestana === 'buscador' && vuelta.marcados === 0 &&
              vuelta.calles === '|' && vuelta.generar === true,
            'L7 · ⭐ VUELTA en movil — «Limpiar» devuelve a «Buscador» y todo a cero',
            `pestaña ${vuelta.pestana} · modos marcados ${vuelta.marcados} · ` +
              `calles «${vuelta.calles}» · Generar apagado ${vuelta.generar} · ` +
              `trazas en el mapa ${vuelta.trazas}`,
          );
          await m.guardar(`${CAPTURAS}/coreografia-${nombre}-vuelta.png`);
        }
      }
    }

    // ═══════════ L8 · EL PASEO POR LAS TRES PESTAÑAS (11/09) ═══════════
    //
    // ⚠️ ESTA JUEZA SUSTITUYE A LAS CAPTURAS DE LA HOJA —desplegada y
    //    recogida—, que ya no existen. Y compra tres cosas que la hoja no
    //    tenia que demostrar:
    //
    //    1. UNA SOLA pestaña visible cada vez, y a pantalla completa.
    //    2. EL MAPA NO SE DESMONTA: al volver a «Mapa» tras pasear, sus
    //       teselas siguen cubriendolo. Si se desmontara y volviera a montarse,
    //       aqui saldrian cuadros grises — que es exactamente el fallo que el
    //       patron de la referencia evita, y la razon de taparlo por opacidad
    //       en vez de quitarlo.
    //    3. El contador de instancias de Leaflet: UNA, la misma, de principio
    //       a fin. Es la prueba dura de que no se remonta.
    if (esMovil) {
      const cobertura = `
        const c = document.querySelector('.leaflet-container');
        const t = [...document.querySelectorAll('.leaflet-tile-loaded, .leaflet-tile')];
        if (!c || !t.length) return { cubre: 0, ancho: 0, teselas: 0, instancias: 0 };
        const r = c.getBoundingClientRect();
        let izq = Infinity, der = -Infinity;
        for (const x of t) { const q = x.getBoundingClientRect();
          if (q.width > 0) { izq = Math.min(izq, q.left); der = Math.max(der, q.right); } }
        return {
          cubre: Math.round(Math.min(der, r.right) - Math.max(izq, r.left)),
          ancho: Math.round(r.width),
          teselas: t.length,
          instancias: document.querySelectorAll('.leaflet-container').length,
        };
      `;
      const aPestana = async (cual) => {
        await m.evaluar(`[...document.querySelectorAll('.barra__boton')].find((b) => b.textContent.trim().startsWith(${JSON.stringify(cual)})).click()`);
        await m.dormir(600);
        return leer(
          m,
          `
          const q = (sel) => { const e = document.querySelector(sel); if (!e) return null;
            const c = getComputedStyle(e); const r = e.getBoundingClientRect();
            return { ve: c.display !== 'none' && c.visibility !== 'hidden' && c.opacity !== '0' &&
                         r.width > 0 && r.height > 0,
                     w: Math.round(r.width), h: Math.round(r.height),
                     abajo: Math.round(r.bottom) }; };
          const tablero = document.querySelector('.tablero').getBoundingClientRect();
          return {
            pestana: document.querySelector('.marco').getAttribute('data-pestana'),
            buscador: q('.bloque--buscador'),
            pasos: q('.bloque--pasos'),
            mapa: q('.zona-mapa'),
            tablero: { w: Math.round(tablero.width), h: Math.round(tablero.height),
                       abajo: Math.round(tablero.bottom) },
          };
        `,
        );
      };

      console.log('');
      for (const [cual, clave] of [['Buscador', 'buscador'], ['Ruta', 'pasos'], ['Mapa', 'mapa']]) {
        const v = await aPestana(cual);
        const visibles = ['buscador', 'pasos', 'mapa'].filter((k) => v[k] && v[k].ve);
        juzgar(
          visibles.length === 1 && visibles[0] === clave,
          `L8 · «${cual}» — se ve UNA sola cosa, y es la suya`,
          `se ven: ${visibles.join(', ') || '(nada)'} · data-pestana=${v.pestana}`,
        );
        // ⚠️ ESTA JUEZA MEDIA MAL Y LO DIJO: pedia que el bloque midiera el
        //    tablero ENTERO y daba 659 de 779. Los 120 que faltaban son la
        //    cabecera compacta de la pestaña, que es parte de la pantalla y no
        //    un hueco. Lo que hay que comprar es que **no sobre nada por
        //    abajo**: que lo suyo llegue al borde inferior del tablero y ocupe
        //    todo el ancho. El fallo era del instrumento, no de la pintura.
        const suyo = v[clave];
        juzgar(
          !!suyo && suyo.w === v.tablero.w && Math.abs(suyo.abajo - v.tablero.abajo) <= 1,
          `L8 · «${cual}» — llega al borde de abajo del tablero, sin hueco`,
          suyo
            ? `${suyo.w}x${suyo.h}, acaba en y=${suyo.abajo} · el tablero acaba en ${v.tablero.abajo}`
            : 'no esta',
        );
        await m.guardar(`${CAPTURAS}/pestana-${clave}.png`);
      }

      // ⭐ Y AL VOLVER, EL MAPA SIGUE ENTERO. Se pasea otra vez y se mide.
      await aPestana('Buscador');
      await aPestana('Ruta');
      const tras = await aPestana('Mapa');
      const mapa = await leer(m, cobertura);
      juzgar(
        mapa.instancias === 1,
        'L8 · ⭐ el mapa NO se ha remontado: sigue habiendo UNA instancia de Leaflet',
        `${mapa.instancias} contenedor(es) · ${mapa.teselas} teselas`,
      );
      juzgar(
        mapa.ancho > 0 && mapa.cubre >= mapa.ancho - 2,
        'L8 · ⭐ y tras pasear las tres pestañas las teselas lo siguen cubriendo — sin huecos grises',
        `${mapa.cubre} de ${mapa.ancho} px · pestaña ${tras.pestana}`,
      );

      await m.evaluar(`[...document.querySelectorAll('.barra__boton')].find((b) => b.textContent.trim().startsWith('Buscador')).click()`);
      await m.dormir(400);
    } else {
      await m.guardar(`${CAPTURAS}/esq-pc-abierta.png`);

      // ═══════════ L3 · EL MAPA SE RE-ENCUADRA AL PLEGAR ═══════════
      //
      // [DOC Leaflet] `invalidateSize` «checks if the map container size changed
      // and updates the map if so». Sin la llamada, la parte que antes no
      // existía se queda **sin teselas**: Leaflet cree que sigue midiendo lo de
      // antes y no pide las que faltan.
      //
      // ⚠️ Se mide LO PINTADO: cuánto del contenedor cubren las teselas de
      //    verdad. Preguntarle a Leaflet su tamaño sería preguntarle al mismo
      //    que se equivoca.
      const cobertura = `
        const c = document.querySelector('.leaflet-container');
        const t = [...document.querySelectorAll('.leaflet-tile-loaded, .leaflet-tile')];
        const r = c.getBoundingClientRect();
        if (!t.length) return { cubre: 0, ancho: Math.round(r.width) };
        const izq = Math.min(...t.map((x) => x.getBoundingClientRect().left));
        const der = Math.max(...t.map((x) => x.getBoundingClientRect().right));
        return { cubre: Math.round(Math.min(der, r.right) - Math.max(izq, r.left)),
                 ancho: Math.round(r.width) };
      `;
      const antes = await leer(m, cobertura);
      juzgar(
        antes.cubre >= antes.ancho - 2,
        'L3 · con la columna abierta, las teselas cubren el mapa',
        `${antes.cubre} de ${antes.ancho} px`,
      );

      // Se pliega y se espera al `transitionend` de verdad, no a un cronómetro.
      await m.evaluar(`
        window.__fin = new Promise((ok) => {
          const p = document.querySelector('.panel');
          p.addEventListener('transitionend', (e) => { if (e.propertyName === 'width') ok(true); }, { once: true });
        });
        document.querySelector('.separador').click();
      `);
      const llego = await m.evaluar(
        `Promise.race([window.__fin, new Promise((ok) => setTimeout(() => ok(false), 3000))])`,
      );
      juzgar(llego === true, 'L3 · el plegado dispara transitionend sobre `width`');
      await m.dormir(900);

      const despues = await leer(m, cobertura);
      // ⚠️ SE EXIGE LA MAGNITUD, no un `>`. Esta juez decia «es mas ancho» y
      //    lo comprobaba con mayor-que: dio OK con el mapa ganando UN pixel
      //    —el del borde— mientras la columna no se plegaba en absoluto. El
      //    fallo tipico no es que no cambie nada, es que cambie un poco por
      //    otro motivo. Ver bitacora nº45.
      const gana = despues.ancho - antes.ancho;
      juzgar(
        gana >= forma.panel.w - 2,
        'L3 · plegada la columna, el mapa gana TODO el ancho que ella tenia',
        `${antes.ancho} → ${despues.ancho} px (gana ${gana} de ${forma.panel.w})`,
      );
      juzgar(
        despues.cubre >= despues.ancho - 2,
        'L3 · y las teselas cubren el ancho nuevo — sin huecos grises',
        `${despues.cubre} de ${despues.ancho} px`,
      );
      await m.guardar(`${CAPTURAS}/esq-pc-plegada.png`);

      // Y de vuelta, con el acordeón en otra combinación.
      await m.evaluar(`document.querySelector('.separador').click()`);
      await m.dormir(700);
      await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[0].click()`);
      await m.dormir(500);
      await m.guardar(`${CAPTURAS}/esq-pc-solo-indicaciones.png`);
      await m.evaluar(`document.querySelectorAll('.bloque__cabecera')[1].click()`);
      await m.dormir(500);
      await m.guardar(`${CAPTURAS}/esq-pc-ambos-cerrados.png`);
    }
  } finally {
    m.cerrar();
  }
}

console.log(`\n${fallos === 0 ? '✅ VERDE' : `❌ ${fallos} EN ROJO`}`);
