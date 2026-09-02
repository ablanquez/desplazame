/**
 * ⭐ LA PRUEBA REAL DEL PIE DE CRÉDITOS (1/09).
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
 *     node app/e2e/creditos.mjs
 */
import { abrirChrome, contrasteReal, AA_TEXTO } from './medir.mjs';

const APP = 'http://localhost:4200/';

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
      enlaces: [...p.querySelectorAll('a')].map((a) => ({ href: a.href, dice: a.textContent.trim() })),
    };
  })()`);
  juez('hay pie de créditos en la página', linea !== null);
  if (linea) {
    console.log(`   dice: «${linea.texto}»`);
    for (const titular of [
      'Avanza Zaragoza S.A.U.',
      'Punto de Acceso Nacional (MITMA)',
      'Ayuntamiento de Zaragoza',
      'colaboradores de OpenStreetMap',
    ]) {
      juez(`nombra a «${titular}»`, linea.texto.includes(titular));
    }
    juez(
      'cumple la fórmula del MITMS: «Powered by MITRAMS» + enlace + bruto/procesado',
      linea.texto.includes('Powered by MITRAMS') &&
        linea.texto.includes('bruto y procesado') &&
        linea.enlaces.some((a) => a.href.includes('transportes.gob.es')),
      linea.enlaces.map((a) => a.href).join(' · '),
    );
    juez(
      'la cartografía enlaza al copyright de OpenStreetMap',
      linea.enlaces.some((a) => a.href.includes('openstreetmap.org/copyright')),
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
  for (const [nombre, texto, con] of [
    ['a la vista', pegados.visto, ' · '],
    ['sin lo oculto (lo que lee un lector de pantalla)', pegados.oido, ' '],
  ]) {
    const juntas = [
      `S.A.U.${con}Horarios`,
      `(dato bruto y procesado)${con}Datos municipales`,
      `(Ley 37/2007)${con}Cartografía`,
    ];
    const faltan = juntas.filter((j) => !texto.includes(j));
    juez(
      `los tres cortes entre titulares llevan su espacio ${nombre}`,
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
  for (const selector of ['.creditos__linea', '.creditos__fechas']) {
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

  console.log(`\n${malas === 0 ? '✅ TODO VERDE' : `❌ ${malas} en rojo`}`);
} finally {
  m.cerrar();
}
