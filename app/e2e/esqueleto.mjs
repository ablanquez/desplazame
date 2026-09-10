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
        marco: caja('.marco'), panel: caja('.panel'), lienzo: caja('.lienzo'),
        veAsa: ve('.panel__asa'), veSeparador: ve('.separador'),
        radio: getComputedStyle(q('.panel')).borderTopLeftRadius,
        anchoPildora: getComputedStyle(q('.panel__asa-pildora')).width,
        altoPildora: getComputedStyle(q('.panel__asa-pildora')).height,
        tocaAsa: getComputedStyle(q('.panel__asa')).minHeight,
      };
    `,
    );

    juzgar(
      forma.marco.w === ancho && forma.marco.h === alto,
      'L4 · el marco ocupa la pantalla EXACTA',
      `${forma.marco.w}×${forma.marco.h}`,
    );

    if (esMovil) {
      juzgar(forma.veAsa && !forma.veSeparador, 'L4 · en móvil manda el asa, no el separador');
      juzgar(forma.radio === '28px', 'L4 · la hoja lleva el radio de M3', forma.radio);
      juzgar(
        forma.anchoPildora === '32px' && forma.altoPildora === '4px' && forma.tocaAsa === '48px',
        'L4 · el asa es la píldora de M3 (4×32) con área de toque de 48',
        `${forma.anchoPildora}×${forma.altoPildora}, toque ${forma.tocaAsa}`,
      );
      // La hoja se superpone al mapa: el mapa sigue midiendo la pantalla entera.
      juzgar(
        forma.lienzo.h === alto && forma.panel.y > 0,
        'L4 · el mapa llena la pantalla y la hoja se le pone encima',
        `mapa ${forma.lienzo.h}px · hoja desde y=${forma.panel.y}`,
      );
    } else {
      juzgar(!forma.veAsa && forma.veSeparador, 'L4 · en escritorio manda el separador, no el asa');
      // ⭐ El panel a la IZQUIERDA y el mapa a la DERECHA [DISEÑO §211].
      juzgar(
        forma.panel.x === 0 && forma.lienzo.x >= forma.panel.w,
        'L4 · el panel a la izquierda y el mapa a la derecha',
        `panel x=${forma.panel.x} w=${forma.panel.w} · mapa x=${forma.lienzo.x}`,
      );
      juzgar(
        forma.panel.w === 501 && forma.panel.h === alto,
        'L4 · la columna mide lo de la referencia (500 + su borde) y va de arriba abajo',
        `${forma.panel.w}×${forma.panel.h}`,
      );
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
    if (esMovil) {
      // En móvil hay que desplegar la hoja para que haya bloque que agotar.
      await m.evaluar(`document.querySelector('.panel__asa').click()`);
      await m.dormir(500);
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

    // ═══════════ LAS CAPTURAS DE LOS ESTADOS ═══════════
    if (esMovil) {
      await m.guardar(`${CAPTURAS}/esq-movil-desplegada.png`);
      await m.evaluar(`document.querySelector('.panel__asa').click()`);
      await m.dormir(500);
      await m.guardar(`${CAPTURAS}/esq-movil-recogida.png`);
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
