/**
 * ⭐ LA PRUEBA REAL DE LOS CRÉDITOS (1/09; reescrita el 10/09).
 *
 * ⚠️ **DESDE EL 10/09 SON DOS PANTALLAS, no una.** La franja del pie se encogió
 *    a una línea —«Leaflet | © colaboradores de OpenStreetMap · Créditos»— y los
 *    cuatro titulares se mudaron a `/creditos`. Este fichero se mudó con ellos:
 *    mide la franja donde está la franja y los titulares donde están ahora los
 *    titulares. Darse por cumplido en el sitio viejo es justo el fallo del que
 *    nació la juez del MITMS.
 *
 * Chrome de verdad. Lo que `app/src/app/atribucion.spec.ts` compra en jsdom
 * —que los cuatro titulares están en el DOM y que los enlaces apuntan donde
 * deben— aquí se mira **sobre píxeles pintados**, porque hay dos promesas del
 * encargo que jsdom **no puede** juzgar:
 *
 * · **«Contraste medido»** — el CSS del componente no se aplica en jsdom
 *   (medido el 1/09, y está en `docs/BITACORA.md`), así que allí
 *   `getComputedStyle` no sabe de qué color es nada. Aquí se cuenta el color
 *   de cada píxel del rectángulo y se calcula la razón WCAG con la MISMA
 *   fórmula que usa la pantalla (`contraste.ts` ↔ `medir.mjs`).
 * · **«Sin tapar el mapa»** — sin maquetación no hay cajas, y sin cajas no hay
 *   solape que comprobar.
 *
 * Se ejecuta con `ng serve` en el 4200 (el motor no hace falta: el pie no
 * pregunta nada a nadie, y eso también se comprueba aquí):
 *
 *     node app/e2e/creditos.mjs [http://localhost:3111]
 */
import { abrirChrome, contrasteReal, AA_TEXTO } from './medir.mjs';

// La URL por argumento, como el resto de los ficheros de `e2e/`: con `ng serve`
// en el 4200 por defecto, o con el motor sirviendo el dist si se le pasa.
const APP = (process.argv[2] ?? 'http://localhost:4200').replace(/\/+$/, '') + '/';

const m = await abrirChrome({ alto: 1600 });
let malas = 0;
const juez = (nombre, bien, detalle) => {
  if (!bien) malas++;
  console.log(`${bien ? '✔' : '✖'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
};

try {
  await m.ir(APP, 5000);

  // ── 1 · EL PIE ESTÁ, Y ES UN PUNTO DE REFERENCIA ──────────────────────────
  //
  // [HTML] un `<footer>` sólo es `contentinfo` cuando su ancestro de seccionado
  // más cercano es `body`. Está fuera de `<main>` justo por eso, y esto lo
  // comprueba **preguntándoselo al árbol de accesibilidad**, no leyendo la
  // plantilla: es lo único que dice si el navegador lo ha entendido así.
  await m.cdp('Accessibility.enable');
  const arbol = await m.cdp('Accessibility.getFullAXTree');
  const contentinfo = arbol.nodes.filter(
    (n) => n.role?.value === 'contentinfo' && !n.ignored,
  );
  juez(
    'el pie es un punto de referencia `contentinfo`',
    contentinfo.length === 1,
    `${contentinfo.length} en el árbol (se espera 1)`,
  );

  // ── 2 · LOS CUATRO TITULARES, EN LO QUE SE VE ─────────────────────────────
  const linea = await m.evaluar(`(() => {
    const p = document.querySelector('footer.creditos');
    if (!p) return null;
    return {
      texto: p.innerText.replace(/\\s+/g, ' ').trim(),
      partes: [...p.querySelectorAll('.creditos__parte')].length,
      // ⚠️ Las ALTURAS DISTINTAS, no los rectangulos: un rango devuelve uno
      //    por fragmento —medido, 16 sobre una linea de 24 px— y lo que se
      //    quiere contar son renglones.
      renglones: (() => { const l = p.querySelector('.creditos__linea');
        if (!l) return 0; const r = document.createRange();
        r.selectNodeContents(l);
        return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; })(),
      enlaces: [...p.querySelectorAll('a')].map((a) => ({ href: a.href, dice: a.textContent.trim() })),
    };
  })()`);
  juez('hay pie de créditos en la página', linea !== null);
  if (linea) {
    console.log(`   dice: «${linea.texto}»`);
    // ⭐ LO QUE SE QUEDA, que es la excepción y no una preferencia: la política
    //    de teselas de OpenStreetMap exige ver su atribución CLARAMENTE SOBRE
    //    EL MAPA, sin esconderla tras interfaz. Lo demás se rige por el patrón
    //    del aviso accesible «de forma permanente, fácil y directa».
    juez(
      'la franja conserva la atribución de OSM, con «colaboradores» y su enlace',
      linea.texto.includes('colaboradores de OpenStreetMap') &&
        linea.enlaces.some((a) => a.href.includes('openstreetmap.org/copyright')),
    );
    juez('y nombra a Leaflet, que es la otra mitad de la línea del mapa', linea.texto.includes('Leaflet'));
    juez(
      'y lleva a /creditos, que es donde está ahora el resto del aviso',
      linea.enlaces.some((a) => new URL(a.href).pathname === '/creditos'),
      linea.enlaces.map((a) => a.href).join(' · '),
    );
    // ⭐ LA CONTRAPRUEBA DE LA MUDANZA: si los tres siguieran también aquí, las
    //    juezas de la página darían verde y nadie sabría que no se encogió.
    const quedan = ['Avanza Zaragoza S.A.U.', 'Punto de Acceso Nacional (MITMA)', 'Ayuntamiento de Zaragoza'].filter(
      (t) => linea.texto.includes(t),
    );
    juez(
      'y los otros tres titulares ya NO están en la franja',
      quedan.length === 0,
      quedan.length ? 'siguen aquí: ' + quedan.join(' | ') : 'los tres se fueron',
    );
    // ⚠️ UNA SOLA LÍNEA, MEDIDA. Un rango sobre el contenido devuelve un
    //    rectángulo POR CAJA DE LÍNEA: contar rectángulos es contar renglones
    //    pintados. Si en móvil no cupiera, aquí saldría 2.
    juez(
      'y es UNA sola línea a lo ancho de esta ventana',
      linea.renglones === 1,
      `${linea.renglones} renglón(es)`,
    );
  }

  // ── 2b · Y LOS TITULARES NO SE PEGAN, NI AL OJO NI AL OÍDO ────────────────
  //
  // ⚠️ Este juez nació de una medición, no de una idea: la primera versión de
  //    la línea pintaba «Avanza Zaragoza S.A.U.·Horarios: GTFS…». Angular borra
  //    el espacio entre elementos, así que el `·` quedaba pegado por los dos
  //    lados. Se arregló con `&ngsp;`, y esto impide que vuelva.
  //
  // Se mira **dos veces y de dos maneras distintas**, porque son dos fallos
  // distintos: lo que se VE (`innerText`) y lo que se LEE en voz alta — que es
  // el mismo texto **sin lo que va `aria-hidden`**, y ahí el `·` no está para
  // separar nada.
  const pegados = await m.evaluar(`(() => {
    const pie = document.querySelector('footer.creditos');
    const copia = pie.cloneNode(true);
    for (const x of copia.querySelectorAll('[aria-hidden="true"]')) x.remove();
    document.body.appendChild(copia);
    const sinOcultos = copia.innerText.replace(/\\s+/g, ' ').trim();
    copia.remove();
    return { visto: pie.innerText.replace(/\\s+/g, ' ').trim(), oido: sinOcultos };
  })()`);
  //
  // ⚠️ Las juntas se nombran UNA A UNA en vez de con un patrón. El primer
  //    intento fue un patrón —«una letra mayúscula pegada a un punto»— y daba
  //    rojo sobre la línea buena: **«S.A.U.» es exactamente eso**. Un juez que
  //    se equivoca con el caso normal no vale, aunque también cazara el malo.
  //
  // ⚠️ LAS JUNTAS SON OTRAS DESDE EL 10/09 —la línea tiene dos cortes en vez de
  //    tres—, pero el fallo que se teme es el mismo y por eso la juez sigue
  //    aquí en vez de irse con los titulares: lo que se compra es que Angular
  //    no se coma los espacios, y eso se estropea igual con dos que con cuatro.
  for (const [nombre, texto, sep, con] of [
    ['a la vista', pegados.visto, ' | ', ' · '],
    ['sin lo oculto (lo que lee un lector de pantalla)', pegados.oido, ' ', ' '],
  ]) {
    const juntas = [`Leaflet${sep}©`, `OpenStreetMap${con}Créditos`];
    const faltan = juntas.filter((j) => !texto.includes(j));
    juez(
      `los dos cortes de la línea llevan su espacio ${nombre}`,
      faltan.length === 0,
      faltan.length ? 'pegados: ' + faltan.join(' | ') : juntas.length + ' de ' + juntas.length,
    );
  }
  console.log(`   lo que se oye: «${pegados.oido}»`);

  // ── 3 · EL CONTRASTE, MEDIDO SOBRE PÍXELES ────────────────────────────────
  //
  // ⚠️ La contraprueba del propio instrumento va DENTRO: si el rectángulo
  //    medido tuviera un solo color, el contraste saldría 1:1 y la prueba se
  //    caería sola en vez de aprobar un blanco sobre blanco. Y si saliera un
  //    número pero con dos píxeles contados, tampoco valdría: por eso se
  //    imprime `pixeles`.
  // ⚠️ `.creditos__fechas` se fue con la mudanza: la línea de la fecha vive
  //    ahora en `/creditos`, y allí se mide (abajo).
  for (const selector of ['.creditos__linea']) {
    const c = await contrasteReal(m, selector);
    juez(
      `contraste de \`${selector}\` ≥ ${AA_TEXTO}:1 [WCAG 1.4.3]`,
      c.contraste >= AA_TEXTO,
      `${c.contraste.toFixed(2)}:1 · texto rgb(${c.texto.r},${c.texto.g},${c.texto.b}) ` +
        `sobre rgb(${c.fondo.r},${c.fondo.g},${c.fondo.b}) · ${c.pixeles} píxeles mirados`,
    );
  }

  // ── 4 · Y NO TAPA EL MAPA ─────────────────────────────────────────────────
  //
  // Dos comprobaciones, porque una sola se podría cumplir por casualidad: que
  // las cajas **no se solapen**, y que el pie esté **en el flujo** —sin
  // `fixed`, `sticky` ni `absolute`—, que es lo que garantiza que tampoco lo
  // tapará con otra ventana o con el mapa más alto.
  const cajas = await m.evaluar(`(() => {
    const mapa = document.querySelector('app-mapa');
    const pie = document.querySelector('footer.creditos');
    if (!mapa || !pie) return null;
    const a = mapa.getBoundingClientRect();
    const b = pie.getBoundingClientRect();
    return {
      mapa: { top: a.top, bottom: a.bottom, alto: a.height },
      pie: { top: b.top, bottom: b.bottom, alto: b.height },
      posicion: getComputedStyle(pie).position,
      solapa: !(b.top >= a.bottom || b.bottom <= a.top),
    };
  })()`);
  juez('el mapa y el pie existen los dos', cajas !== null);
  if (cajas) {
    juez(
      'el pie NO se solapa con el mapa',
      cajas.solapa === false,
      `mapa ${Math.round(cajas.mapa.top)}–${Math.round(cajas.mapa.bottom)} · ` +
        `pie ${Math.round(cajas.pie.top)}–${Math.round(cajas.pie.bottom)}`,
    );
    juez(
      'el pie va en el flujo, no flotando encima',
      cajas.posicion === 'static',
      `position: ${cajas.posicion}`,
    );
    juez('el pie ocupa alto de verdad (no está colapsado)', cajas.pie.alto > 10, `${Math.round(cajas.pie.alto)} px`);
  }

  // ── 5 · Y LA RAÍZ SIGUE FRÍA ──────────────────────────────────────────────
  //
  // La ley del 22/08: abrir la portada no pide nada.
  //
  // ⚠️ **CORRECCIÓN DEL 2/09.** Aquí ponía que el juez de `app.spec.ts` tenía
  //    un agujero —«cuenta `fetch` y HttpClient va por XHR»—. **Las dos
  //    mitades eran falsas y se han medido:**
  //
  //    · En Chrome, con los dos espías puestos a la vez, una petición de
  //      HttpClient sale por `fetch`: `{ xhr: 0, fetch: 2 }`.
  //    · Y en la suite no se cuela: metida una petición de HttpClient al
  //      construir la raíz, `app.spec.ts` se pone ROJO.
  //
  //    Lo que sí es cierto, y es más fino: **no lo caza el contador de
  //    `fetch`** —`provideHttpClientTesting` sustituye el transporte, así que
  //    ahí no llega ninguna llamada real— sino `http.verify()` del `afterEach`:
  //    *«Expected no open requests, found 1: GET /api/salud»*. El guardián
  //    existe; no es el que su nombre dice.
  //
  // Esto de aquí sigue teniendo sentido por otra razón: mide lo que el
  // navegador pide DE VERDAD, sin backend fingido en medio.
  const pedidas = await m.evaluar(
    `performance.getEntriesByType('resource').map(r => r.name).filter(u => u.includes('/api/') || u.includes('/datos/') || u.includes('datapackage'))`,
  );
  juez(
    'abrir la raíz con el pie puesto NO pide ni una vez al motor',
    pedidas.length === 0,
    pedidas.length ? pedidas.join(' · ') : 'cero peticiones de datos',
  );

  // ── 6 · Y LA PÁGINA DE CRÉDITOS, QUE ES DONDE VIVE EL AVISO ──────────────
  //
  // Las mismas compras que hacía el pie, sobre la pantalla nueva y sobre
  // píxeles. Que se hayan mudado no las relaja: si una fórmula legal se cumplía
  // en el pie y aquí no, la mudanza habría perdido una obligación por el camino.
  console.log('\n── /creditos ──');
  await m.ir(APP + 'creditos', 5000);

  const pagina = await m.evaluar(`(() => {
    const p = document.querySelector('.creditos-pagina');
    if (!p) return null;
    const d = document.documentElement;
    return {
      texto: p.innerText.replace(/\\s+/g, ' ').trim(),
      enlaces: [...p.querySelectorAll('a')].map((a) => ({ href: a.href, dice: a.textContent.trim() })),
      // ⭐ Y QUE SE PUEDA LEER ENTERA — bitácora nº47.
      overflow: getComputedStyle(d).overflowY,
      overflowBody: getComputedStyle(document.body).overflowY,
    };
  })()`);
  juez('la página de créditos existe y monta', pagina !== null);

  if (pagina) {
    for (const titular of [
      'Avanza Zaragoza S.A.U.',
      'Punto de Acceso Nacional (MITMA)',
      'Origen de los datos: Ayuntamiento de Zaragoza',
      'colaboradores de OpenStreetMap',
    ]) {
      juez(`nombra a «${titular}»`, pagina.texto.includes(titular));
    }
    juez(
      'cumple la fórmula del MITMS: «Powered by MITRAMS» + enlace + bruto/procesado',
      pagina.texto.includes('Powered by MITRAMS') &&
        pagina.texto.includes('bruto y procesado') &&
        pagina.enlaces.some((a) => a.href.includes('transportes.gob.es')),
    );
    juez('cita la Ley 37/2007 con su enlace al BOE', pagina.texto.includes('Ley 37/2007') &&
      pagina.enlaces.some((a) => a.href.includes('boe.es')));
    juez(
      'resuelve la fecha de actualización como enlace al panel de frescura',
      pagina.enlaces.some((a) => new URL(a.href).pathname === '/panel'),
    );
    juez('la cartografía enlaza al copyright de OpenStreetMap y nombra la ODbL',
      pagina.enlaces.some((a) => a.href.includes('openstreetmap.org/copyright')) &&
        pagina.texto.includes('ODbL'));
    juez('la tipografía va con su licencia, y el enlace apunta al fichero que viaja',
      pagina.texto.includes('SIL Open Font License') &&
        pagina.enlaces.some((a) => new URL(a.href).pathname === '/fuentes/LICENCIA-OFL.txt'));
    juez('dice que los titulares no respaldan esta aplicación',
      pagina.texto.includes('no participan, patrocinan ni apoyan'));

    // ⭐ Y SE PUEDE LEER ENTERA — bitácora nº47, donde el `overflow: hidden`
    //    global del esqueleto decapitó esta clase de página.
    juez(
      'el documento NO está recortado: nada le impide desplazarse',
      pagina.overflow !== 'hidden' && pagina.overflowBody !== 'hidden',
      `html ${pagina.overflow} · body ${pagina.overflowBody}`,
    );

    // ⚠️ Y LA PRECONDICIÓN SE CONSTRUYE, NO SE SUPONE — la lección de L2. Esta
    //    juez daba ROJO con la página arreglada: la ventana del instrumento
    //    mide 1600 px de alto y la página CABE, así que no había nada que
    //    desplazar y la juez se quedaba sin objeto. Se estrecha el viewport a
    //    una altura de móvil y se empuja de verdad.
    await m.cdp('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 500, deviceScaleFactor: 1, mobile: false,
    });
    await m.dormir(400);
    const bajando = await m.evaluar(`(() => {
      const d = document.documentElement;
      const desborda = d.scrollHeight > d.clientHeight + 1;
      window.scrollTo(0, 5000);
      return JSON.stringify({ desborda, alto: d.clientHeight, contenido: d.scrollHeight,
        bajo: Math.round(window.scrollY) });
    })()`);
    const b2 = JSON.parse(bajando);
    juez(
      'y en una ventana corta desborda Y baja de verdad',
      b2.desborda === true && b2.bajo > 0,
      `${b2.contenido} px de contenido en ${b2.alto} de ventana · bajó ${b2.bajo} px`,
    );
    await m.cdp('Emulation.clearDeviceMetricsOverride');
    await m.dormir(300);

    // ⚠️ Se miden LOS DOS pares, y el gris primero: la intro va en
    //    `--muted-foreground`, que es el más flojo de la página. Medir sólo el
    //    texto normal aprobaría la página por su mejor par.
    for (const selector of ['.creditos-pagina__intro', '.creditos-pagina__titular']) {
      const cp = await contrasteReal(m, selector);
      juez(
        `contraste de \`${selector}\` ≥ ${AA_TEXTO}:1 [WCAG 1.4.3]`,
        cp.contraste >= AA_TEXTO,
        `${cp.contraste.toFixed(2)}:1 · texto rgb(${cp.texto.r},${cp.texto.g},${cp.texto.b}) ` +
          `sobre rgb(${cp.fondo.r},${cp.fondo.g},${cp.fondo.b}) · ${cp.pixeles} píxeles mirados`,
      );
    }

    // ⚠️ Y ES PEREZOSA: entrar aquí NO pide datos a nadie.
    const pedidasAqui = await m.evaluar(
      `performance.getEntriesByType('resource').map(r => r.name).filter(u => u.includes('/api/') || u.includes('/datos/'))`,
    );
    juez(
      'entrar en /creditos no pide ni un dato al motor',
      pedidasAqui.length === 0,
      pedidasAqui.length ? pedidasAqui.join(' · ') : 'cero peticiones de datos',
    );
  }

  console.log(`\n${malas === 0 ? '✅ TODO VERDE' : `❌ ${malas} en rojo`}`);
} finally {
  m.cerrar();
}
