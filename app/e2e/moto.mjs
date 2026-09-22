/**
 * ⭐ LA PRUEBA REAL DEL GRUPO [Moto] (4/09, punto 13, casilla 3).
 *
 * Chrome de verdad y motor de verdad. Lo que `buscador.spec.ts` compra en
 * jsdom —la sexta familia, el distintivo compartido, el parking ausente, el
 * polígono— aquí se mira **contra el motor vivo**, que es donde se sabe si lo
 * que se pulsa arriba llega abajo y si lo que baja se pinta.
 *
 * Y hace la foto que el checkpoint pide: la botonera con [Moto] marcada, el
 * polígono de la zona sobre el mapa y el hito del aparcamoto.
 *
 * ⭐ **Y mide el ancho de la fila**, que es la deuda que deja pasar de cinco a
 * seis: [DOC sistemas de diseño · control segmentado] el rango del patrón es de
 * 2 a 5 opciones con etiqueta, y ese fue el argumento del 2/09 para bajar de
 * seis a cinco. La sexta vuelve por decisión del encargo; lo que aquí se mide es
 * si además **se sale de la fila**, que es otra pregunta y tiene respuesta
 * numérica.
 *
 * Se ejecuta con el motor levantado y `ng serve` en el 4200:
 *
 *     node app/e2e/moto.mjs
 */
import { readFileSync } from 'node:fs';
import { abrirChrome, terceros, perfilesResiduales } from './medir.mjs';

/** El trazado del `.svg` descargado: el mismo patrón que `pintura.mjs`, sin copiarlo aquí. */
const trazadoDelFichero = (nombre) =>
  /\sd="([^"]+)"/.exec(
    readFileSync(new URL(`../simbolos/${nombre}.svg`, import.meta.url), 'utf8'),
  )?.[1] ?? '(el fichero no tiene trazado)';

/* ⭐ **LOS RELOJES, CAMBIADOS POR HECHOS** (22/09, la tanda del arnés).
   Aquí se esperaba con `m.dormir(ms)`: 400 tras pulsar un radio, 900 tras
   teclear una calle, 700 al elegirla, 600 + 500 con el portal y 9000 tras
   «Generar». Eso compraba «ha pasado este rato», y lo que la jueza necesitaba
   era otra cosa: que ESTÉ lo que va a leer. Con la máquina lenta el reloj se
   quedaba corto y leía una pantalla a medias; con la rápida, esperaba de balde.
   [Puppeteer, su propio README] «no hay necesidad de llamadas malignas a
   sleep»; `waitForTimeout` se eliminó en la v22, y el reemplazo es esperar a LA
   COSA. Cada espera de abajo nombra su hecho —`m.esperar(nombre, predicado)`,
   ver `medir.mjs`—, y el número de antes se queda como TOPE de rescate: si el
   hecho no llega, la suite cae diciendo cuál faltó, nunca en verde de suerte. */

/* ⭐ LA URL, POR ARGUMENTO (10/09). Estaba a fuego en `localhost:4200`, o sea
   que este juez solo corría con `ng serve` delante y no contra el dist que
   sirve el motor. Es la misma costura que se le quitó a `creditos.mjs`. El
   defecto no cambia: quien lo invoque como siempre, sigue igual. */
const APP = (process.argv[2] ?? 'http://localhost:4200').replace(/\/+$/, '') + '/';
const FOTO = process.argv[3] ?? 'moto.png';

const m = await abrirChrome({ alto: 1900 });
let malas = 0;
const juez = (nombre, bien, detalle) => {
  if (!bien) malas++;
  console.log(`${bien ? '✔' : '✖'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
};

const pulsar = async (nombre, valor) => {
  const ok = await m.evaluar(
    `(() => { const r = document.querySelector('input[name=${nombre}][value=${valor}]'); if (!r) return false; r.click(); return true; })()`,
  );
  // Antes: 400 ms. Ahora: que el radio ESTÉ marcado, y un pintado encima para
  // que la fila que depende de él ya se haya redibujado cuando se lea.
  if (ok) {
    await m.esperar(
      `el radio ${nombre}=${valor} marcado`,
      `document.querySelector('input[name=${nombre}][value=${valor}]')?.checked === true`,
      { topeMs: 400 },
    );
    await m.pintado();
  }
  return ok;
};

/** Lo que hay en la fila de familias y en las dos preguntas del motor. */
const foto = () =>
  m.evaluar(`(() => {
    const f = document.querySelector('fieldset.modos.familias');
    const grupo = (sel) => {
      const g = document.querySelector(sel);
      return g === null ? null : {
        leyenda: g.querySelector('legend')?.textContent.trim() ?? null,
        nombre: g.querySelector('input[type=radio]')?.name ?? null,
        cuantas: g.querySelectorAll('input[type=radio]').length,
      };
    };
    return {
      familias: {
        leyenda: f.querySelector('legend')?.textContent.trim() ?? null,
        opciones: [...f.querySelectorAll('.modo')].map((l) => l.textContent.trim()),
        valores: [...f.querySelectorAll('input[type=radio]')].map((r) => r.value),
        marcada: [...f.querySelectorAll('input[type=radio]')].find((r) => r.checked)?.value ?? null,
      },
      aparcamientos: grupo('fieldset.modos.aparcamientos'),
      distintivos: grupo('fieldset.modos.distintivos'),
      cuantosDistintivos: document.querySelectorAll('fieldset.modos.distintivos').length,
      cuantasMatriculas: document.querySelectorAll('input[name=matricula]').length,
      // Polígonos, no trazos: en claro el borde de la zona lleva debajo su ribete (remate de la tanda 6 · parte 2).
      poligonos: document.querySelectorAll('.leaflet-zbe-pane path:not(.ribete-de-borde)').length,
    };
  })()`);

try {
  // Antes: 5000 ms a ciegas tras navegar. Ahora: que la fila de familias esté.
  await m.ir(APP, 0);
  await m.esperar(
    'la aplicación montada: la fila de las seis familias',
    `document.querySelectorAll('fieldset.modos.familias input[name=familia]').length === 6`,
    { topeMs: 5000 },
  );

  // ── 1 · LA PRIMERA FILA SON SEIS, Y EN SU ORDEN ───────────────────────────
  const inicio = await foto();
  juez(
    'la primera fila son SEIS familias, con «Cómo»',
    inicio.familias.opciones.length === 6 && inicio.familias.leyenda === 'Cómo',
    `${inicio.familias.opciones.length} · «${inicio.familias.leyenda}»`,
  );
  console.log(`   son: ${inicio.familias.opciones.join(' | ')}`);
  juez(
    '⭐ y sus `value` son los del contrato, con `moto` entre patín y coche',
    JSON.stringify(inicio.familias.valores) ===
      JSON.stringify(['andando', 'bus', 'bici', 'patin', 'moto', 'coche']),
    inicio.familias.valores.join(' | '),
  );
  // ⭐ NINGUNA VIENE MARCADA (10/09) — [ANTONIO], y manda sobre el calco.
  //    Este juez decía «andando viene marcada al cargar» y **mordió**: era el
  //    defecto de la maqueta, y quitarlo es justo el encargo. Nadie decide por
  //    quien busca que va andando.
  juez('⭐ NINGUNA familia viene marcada al cargar', inicio.familias.marcada === null,
    `marcada: ${inicio.familias.marcada ?? '(ninguna)'}`);

  // ── 2 · EL ANCHO DE LA FILA, MEDIDO ───────────────────────────────────────
  //
  // La deuda de pasar de cinco a seis. Se mide como el 30/08: la suma de las
  // opciones más sus huecos, contra lo que el `fieldset` deja libre.
  const ancho = await m.evaluar(`(() => {
    const f = document.querySelector('fieldset.modos.familias');
    const opciones = [...f.querySelectorAll('.modo')];
    const hueco = parseFloat(getComputedStyle(f).gap) || 0;
    const suma = opciones.reduce((t, o) => t + o.getBoundingClientRect().width, 0);
    const dentro = f.clientWidth
      - parseFloat(getComputedStyle(f).paddingLeft)
      - parseFloat(getComputedStyle(f).paddingRight);
    // Cuántas filas ocupan de verdad: por cuántas alturas distintas hay.
    const filas = new Set(opciones.map((o) => Math.round(o.getBoundingClientRect().top))).size;
    return {
      suma: Math.round(suma * 10) / 10,
      huecos: Math.round(hueco * (opciones.length - 1) * 10) / 10,
      dentro: Math.round(dentro * 10) / 10,
      filas,
      fuente: getComputedStyle(opciones[0]).fontFamily + ' ' + getComputedStyle(opciones[0]).fontSize,
      ventana: window.innerWidth,
    };
  })()`);
  const ocupa = Math.round((ancho.suma + ancho.huecos) * 10) / 10;
  console.log(
    `   ancho: ${ancho.suma} px de opciones + ${ancho.huecos} de huecos = ${ocupa} ` +
      `de ${ancho.dentro} útiles · ${ancho.filas} fila(s) · ventana ${ancho.ventana} · ${ancho.fuente}`,
  );
  juez(
    'las seis caben en UNA fila sin recortarse',
    ancho.filas === 1 && ocupa <= ancho.dentro,
    `sobran ${Math.round((ancho.dentro - ocupa) * 10) / 10} px`,
  );

  // ── 3 · CON [Moto]: EL DISTINTIVO SÍ, EL PARKING NO ───────────────────────
  await pulsar('familia', 'moto');
  const enMoto = await foto();
  juez(
    '⭐ con Moto la pregunta del distintivo EXISTE',
    enMoto.distintivos !== null && enMoto.distintivos.leyenda === '¿Distintivo ambiental?',
    enMoto.distintivos?.leyenda ?? 'no está',
  );
  juez(
    '⭐ y la del aparcamiento NO — no está, no está en gris',
    enMoto.aparcamientos === null,
    enMoto.aparcamientos ? `hay ${enMoto.aparcamientos.cuantas} radios` : 'ausente',
  );
  juez(
    '⭐ el selector es UNO: un `fieldset` y una matrícula en toda la página',
    enMoto.cuantosDistintivos === 1 && enMoto.cuantasMatriculas === 1,
    `${enMoto.cuantosDistintivos} grupos · ${enMoto.cuantasMatriculas} matrículas`,
  );
  juez(
    '⭐ el polígono de la ZBE se pinta con Moto',
    enMoto.poligonos === 1,
    `${enMoto.poligonos} polígonos`,
  );

  // Y el coche sigue teniendo las dos preguntas.
  await pulsar('familia', 'coche');
  const enCoche = await foto();
  juez(
    'el coche sigue con sus DOS preguntas',
    enCoche.aparcamientos !== null && enCoche.distintivos !== null,
    `${enCoche.aparcamientos?.cuantas} parkings · ${enCoche.distintivos?.cuantas} etiquetas`,
  );

  // Y al volver a la moto, lo contestado en el coche NO se hereda.
  await pulsar('distintivo', 'b');
  await pulsar('familia', 'moto');
  const heredado = await m.evaluar(
    `[...document.querySelectorAll('input[name=distintivo]')].filter(r => r.checked).length`,
  );
  juez('⭐ cambiar de vehículo devuelve el distintivo a sin-elegir', heredado === 0, `${heredado} marcados`);

  // ── 4 · EL CASO DEL OJO, CONTRA EL MOTOR VIVO ─────────────────────────────
  const escribir = async (i, texto) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    // Antes: 900 ms. Ahora: que la lista de esa calle traiga opciones.
    await m.esperar(
      `las sugerencias de «${texto}» en el campo ${i}`,
      `document.querySelectorAll('app-autocompletar-via')[${i}].querySelectorAll('[role=option]').length > 0`,
      { topeMs: 900 },
    );
  };
  const elegir = async (i, exacto) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via')[${i}];
      const ops = [...c.querySelectorAll('[role=option]')];
      const o = ops.find(x => x.textContent.trim().toUpperCase() === ${JSON.stringify(String(exacto ?? '').toUpperCase())}) ?? ops[0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    // Antes: 700 ms. Ahora: la lista cerrada y el portal de ese lado habilitado,
    // que es lo que la elección de una calle abre.
    await m.esperar(
      `la calle elegida en el campo ${i}: su lista cerrada y el portal habilitado`,
      `document.querySelectorAll('app-autocompletar-via')[${i}].querySelectorAll('[role=option]').length === 0 &&
       document.querySelectorAll('app-selector-portal input')[${i}]?.disabled === false`,
      { topeMs: 700 },
    );
  };
  const portal = async (i, num) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal input')[${i}]; if (!c) return;
      c.focus();
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    // Antes: 600 ms. Ahora: que el portal pedido ESTÉ en la lista.
    await m.esperar(
      `el portal ${num} en la lista del campo ${i}`,
      `[...document.querySelectorAll('app-selector-portal')[${i}].querySelectorAll('[role=option]')]
        .some((x) => x.textContent.trim() === ${JSON.stringify(num)})`,
      { topeMs: 600 },
    );
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal')[${i}]; if (!c) return;
      const ops = [...c.querySelectorAll('[role=option]')];
      const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    // Antes: 500 ms. Ahora: el campo con ese portal puesto y su lista cerrada.
    await m.esperar(
      `el portal ${num} puesto en el campo ${i}`,
      `document.querySelectorAll('app-selector-portal input')[${i}]?.value.trim() === ${JSON.stringify(num)} &&
       document.querySelectorAll('app-selector-portal')[${i}].querySelectorAll('[role=option]').length === 0`,
      { topeMs: 500 },
    );
  };

  // El espía del cuerpo que sale. Va por `fetch`, medido el 2/09.
  await m.evaluar(`(() => {
    window.__cuerpos = [];
    window.__respuestasDeRuta = 0;
    const pedir = window.fetch;
    window.fetch = function (entrada, opciones) {
      const url = typeof entrada === 'string' ? entrada : entrada?.url;
      const esRuta = String(url).includes('/api/ruta');
      if (esRuta && opciones?.body) window.__cuerpos.push(String(opciones.body));
      const promesa = pedir.apply(this, arguments);
      // ⭐ Y LA RESPUESTA, contada (22/09): es el hecho que «Generar» espera.
      if (esRuta) promesa.then(() => { window.__respuestasDeRuta++; }, () => { window.__respuestasDeRuta++; });
      return promesa;
    };
  })()`);

  await escribir(0, 'PEDRO LAPUYADE');
  await elegir(0, 'CALLE PEDRO LAPUYADE');
  await portal(0, '3');
  await escribir(1, 'ABEN AIRE');
  await elegir(1, 'CALLE ABEN AIRE');
  await portal(1, '33');

  await m.evaluar(`window.__cuerpos = []; window.__respuestasDeRuta = 0`);
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  // Antes: 9000 ms a ciegas. Ahora: LA RESPUESTA de /api/ruta —contada por el
  // espía de `fetch`— y el botón ya libre, que es cuando la pantalla la ha
  // pintado. Es el `waitForResponse` de la doctrina. 9000 queda de TOPE.
  await m.esperar(
    'la respuesta de /api/ruta, ya pintada',
    `window.__respuestasDeRuta >= 1 &&
     ![...document.querySelectorAll('button')].find((b) => b.textContent.includes('Generar'))?.disabled`,
    { topeMs: 9000 },
  );
  await m.pintado();

  const cuerpos = (await m.evaluar(`window.__cuerpos`)).map((c) => JSON.parse(c));
  juez('sale UNA petición de ruta', cuerpos.length === 1, `${cuerpos.length}`);
  juez(
    '⭐ y manda `modo: "moto"` y NADA de aparcamiento',
    cuerpos[0]?.modo === 'moto' && cuerpos[0]?.aparcamiento === undefined,
    Object.keys(cuerpos[0] ?? {}).sort().join(', '),
  );

  const pintado = await m.evaluar(`(() => {
    const pasos = [...document.querySelectorAll('.paso')];
    const hito = pasos.find((li) => (li.querySelector('.paso__texto')?.textContent ?? '').startsWith('Aparca'));
    const encima = [...document.querySelectorAll('path.leaflet-interactive')].filter((_, i) => i % 2 === 1);
    return {
      modo: document.querySelector('.pasos__modo')?.textContent.trim() ?? null,
      // ⚠️ ACTA (14/09, nº55): aquí se leía \`.ruta__totales span\`, que murió con
      //    la cabecera del 12/09 y dejaba el renglón del registro en blanco
      //    («Modo: Moto ·  · 17 pasos») sin que ninguna jueza lo notara.
      totales: [...document.querySelectorAll('.ruta__titular > span:not([aria-hidden])')].map((s) => s.textContent.trim()),
      cuantosPasos: pasos.length,
      hito: hito ? hito.querySelector('.paso__texto').textContent.replace(/\\s+/g, ' ').trim() : null,
      // ⚠️ ACTA (14/09, nº55): la marca era el glifo 🅿 en \`.paso__flecha\`, y
      //    los glifos murieron el 12/09 con los SVG. La marca vive hoy en el
      //    círculo del carril, como el trazado de \`local_parking\`.
      marca: hito ? hito.querySelector('.paso__circulo svg path')?.getAttribute('d') ?? null : null,
      colores: encima.map((p) => p.getAttribute('stroke')),
      poligonos: document.querySelectorAll('.leaflet-zbe-pane path:not(.ribete-de-borde)').length,
      sugerencia: document.querySelector('.sugerencia__boton') !== null,
    };
  })()`);
  console.log(`   ${pintado.modo} · ${pintado.totales.join(' · ')} · ${pintado.cuantosPasos} pasos`);
  console.log(`   HITO: ${pintado.hito}`);
  console.log(`   traza: ${pintado.colores.join(' ')}`);

  juez('el rótulo dice «Modo: Moto»', pintado.modo === 'Modo: Moto', pintado.modo ?? '');
  juez(
    '⭐ el hito es el del aparcamoto, con su «(sin coste)»',
    (pintado.hito ?? '').startsWith('Aparca en el aparcamiento de motos') &&
      (pintado.hito ?? '').endsWith('(sin coste)'),
    pintado.hito ?? 'no hay hito',
  );
  // ⭐ **ACTA DEL BARRIDO A `opsz20` (18/09).** Aquí ponía `'local_parking'` a
  //    secas, y se puso roja con razón: la P del aparcamiento se pinta a 18 px
  //    —en la lista de pasos y en el plano— y desde el barrido el catálogo
  //    guarda su instancia `opsz20`. El fichero cambia; la comparación carácter
  //    a carácter, no.
  const P_DE_APARCAR = trazadoDelFichero('local_parking_20px');
  juez(
    'y su marca es la P de aparcar, el `local_parking` de su fichero',
    pintado.marca === P_DE_APARCAR,
    pintado.marca === null ? '(no hay dibujo en el círculo)' : pintado.marca === P_DE_APARCAR ? 'idéntico al fichero' : 'DISTINTO del fichero',
  );
  juez(
    '⭐ la traza CORTA en rojo donde pisa la zona',
    pintado.colores.includes('#d32f2f'),
    pintado.colores.join(' '),
  );
  juez('el polígono sigue debajo del trazo', pintado.poligonos === 1, `${pintado.poligonos}`);
  juez('la moto no elige aparcamiento: no hay atajo de zona cruzada', pintado.sugerencia === false);

  // ── 5 · LA FOTO: botonera, polígono y hito en el mismo encuadre ───────────
  await m.evaluar(`document.querySelector('fieldset.modos.familias').scrollIntoView({block:'start'})`);
  // Antes: 500 ms. Ahora: que el desplazamiento esté PINTADO antes de la foto.
  await m.pintado();
  await m.guardar(FOTO);
  console.log(`   foto en ${FOTO}`);
} finally {
  await m.cerrar();
}

{
  const t = terceros();
  juez(t.titulo, t.bien, t.detalle);

  // ⭐ Y EL ARNÉS NO SE DEJA NADA PUESTO (18/09): un perfil de Chrome
  //    olvidado son 82 MB, y el 18/09 había 111 en %TEMP% — 9 GB — con el
  //    disco al 100 %. Se cuenta EL DIRECTORIO al acabar, no lo que se
  //    cree haber abierto.
  const perf = perfilesResiduales();
  juez(perf.titulo, perf.bien, perf.detalle);
}

console.log(malas === 0 ? '\nVERDE: la moto está en la botonera y llega al motor.' : `\nROJO: ${malas} mal.`);
process.exit(malas === 0 ? 0 : 1);
