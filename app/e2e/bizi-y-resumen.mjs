/**
 * ⭐ LA PRUEBA REAL DE LOS BOTONES DE BiZi Y DEL RESUMEN ÚNICO (2/09).
 *
 * Chrome de verdad, motor de verdad, y **las dos fuentes vivas**: la sede del
 * Ayuntamiento para las bicis y los anclajes (§ 1.23) y Avanza para el bus
 * (§ 1.24). Lo que `buscador.spec.ts` compra con fixtures medidos aquí se mira
 * contra la cañería entera.
 *
 * Se ejecuta con el motor levantado y `ng serve` en el 4200:
 *
 *     node app/e2e/bizi-y-resumen.mjs [carpeta-de-fotos]
 */
import { abrirChrome, terceros, perfilesResiduales, esperarLineaDelLog } from './medir.mjs';

/* ⭐ **LOS RELOJES, CAMBIADOS POR HECHOS** (22/09, la tanda del arnés).
   Esta suite esperaba con `m.dormir(ms)`: 900/700/600/500 con el formulario,
   300 tras cada radio, 9000 y 16000 tras «Generar», 4000 tras cada botón vivo.
   Eso compraba «ha pasado este rato», y la jueza necesitaba que ESTUVIERA lo
   que iba a leer. [Puppeteer, su propio README] «no hay necesidad de llamadas
   malignas a sleep»; `waitForTimeout` se eliminó en la v22 y el reemplazo es
   esperar a LA COSA. Cada espera nombra su hecho —`m.esperar(nombre,
   predicado)`, ver `medir.mjs`— y el número de antes se queda como TOPE: si el
   hecho no llega, la suite cae diciendo cuál faltó.

   ⭐ **Y EL MOTOR CALIENTE, que era el reloj escondido.** El 19/09 esta suite
   dio rojo con el motor recién arrancado y verde al repetirla: el viaje en bus
   se buscaba antes de que el motor terminara su pase de desvíos, y el resumen
   salía sin ellos. Tres verdes seguidos después eran suerte de ORDEN —se
   corría cuando el motor ya llevaba rato vivo—, no espera. El motor escribe en
   su log cuándo acaba ese pase —`motor: <resumen del refresco>`, o `motor: no
   se ha podido leer la ruta operativa — …` si la fuente no contestó—, y esa
   línea es el hecho. `/api/salud` no lo dice, y hacer que lo diga es tocar el
   motor: otra tanda. Así que la suite pide la ruta del log en `MOTOR_LOG`, y
   **sin ella no finge**: lo dice en rojo. */

const APP = process.env.APP ?? 'http://localhost:4200/';
const MOTOR_LOG = process.env.MOTOR_LOG ?? null;
const FOTOS = process.argv[2] ?? '.';

const m = await abrirChrome({ alto: 1800 });
let malas = 0;
const juez = (nombre, bien, detalle) => {
  if (!bien) malas++;
  console.log(`${bien ? '✔' : '✖'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
};

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
  // Antes: 700 ms. Ahora: la lista cerrada y el portal de ese lado habilitado.
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
const modo = async (cual) => {
  const familia = cual === 'bizi' ? 'bici' : cual;
  await m.evaluar(`document.querySelector('input[name=familia][value=${familia}]').click()`);
  // Antes: 300 ms. Ahora: el radio marcado y un pintado encima.
  await m.esperar(
    `la familia ${familia} marcada`,
    `document.querySelector('input[name=familia][value=${familia}]')?.checked === true`,
    { topeMs: 300 },
  );
  await m.pintado();
  if (familia === 'bici') {
    await m.evaluar(`document.querySelector('input[name=bici][value=${cual}]').click()`);
    await m.esperar(
      `la bici ${cual} marcada`,
      `document.querySelector('input[name=bici][value=${cual}]')?.checked === true`,
      { topeMs: 300 },
    );
    await m.pintado();
  }
};
/**
 * «Generar» y esperar a SU RESPUESTA [el `waitForResponse` de la doctrina]:
 * el espía de `fetch` cuenta las respuestas de `/api/ruta`, y además el botón
 * tiene que haber dejado de estar ocupado, que es cuando la pantalla la ha
 * pintado. `topeMs` es el sleep de antes, ahora de rescate.
 */
const generar = async (topeMs) => {
  const antes = await m.evaluar(`window.__respuestasDeRuta ?? 0`);
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  await m.esperar(
    'la respuesta de /api/ruta, ya pintada',
    `(window.__respuestasDeRuta ?? 0) > ${antes} &&
     ![...document.querySelectorAll('button')].find((b) => b.textContent.includes('Generar'))?.disabled`,
    { topeMs },
  );
  await m.pintado();
};
/** Lo que se ve de los botones vivos y sus regiones, ahora mismo. */
const vivos = () =>
  m.evaluar(`[...document.querySelectorAll('.paso')]
    .filter((li) => li.querySelector('.vivo__boton'))
    .map((li) => ({
      // ACTA 14/09 [encargo de las cinco líneas, mitad 2]: leía la frase
      //    corrida (.paso__texto) y los hitos ya no la llevan; mordió «y cada uno
      //    está en su hito — … | …». El paso se lee ahora por su L1 y su L2, y
      //    la L1 empieza por la acción: «Coge una bici», «Deja la bici».
      paso: ['.hito__l1', '.hito__l2']
        .map((s) => (li.querySelector(s)?.textContent ?? '').replace(/\\s+/g, ' ').trim())
        .join(' · '),
      boton: li.querySelector('.vivo__boton').textContent.trim(),
      controla: li.querySelector('.vivo__boton').getAttribute('aria-controls'),
      region: (li.querySelector('.vivo__estado')?.textContent ?? '').trim(),
      papel: li.querySelector('.vivo__estado')?.getAttribute('role') ?? null,
      ocupada: li.querySelector('.vivo__estado')?.getAttribute('aria-busy') ?? null,
      apagado: li.querySelector('.vivo__boton').disabled,
    }))`);

try {
  // ⭐ EL MOTOR CALIENTE, antes de nada: es la condición de toda la suite.
  if (MOTOR_LOG === null) {
    juez(
      '⭐ el motor ha terminado su pase de arranque (desvíos)',
      false,
      'NO SE PUEDE SABER: falta MOTOR_LOG con la ruta del log del motor — sin ella esta suite no finge que está caliente',
    );
  } else {
    const t0 = Date.now();
    // El tope no mata la suite: si el pase no llega, se dice y se sigue
    // contando lo demás (la ley de fallar DICIENDO, 22/09, el peaje).
    try {
      const linea = await esperarLineaDelLog(
        MOTOR_LOG,
        /^motor: (ruta operativa de hoy|no se ha podido leer la ruta operativa) — /,
        'el pase de desvíos del motor terminado',
        // ⚠️ Solo cuenta lo que este motor haya escrito DESDE SU ARRANQUE. Si
        //    `MOTOR_LOG` apunta al log diario —que apila arranques—, la línea
        //    de uno anterior daría el listo con este motor todavía frío.
        { topeMs: 120000, desdeLaMarca: /^motor: cargando el grafo/ },
      );
      juez(
        '⭐ el motor ha terminado su pase de arranque (desvíos)',
        true,
        `«${linea.trim().slice(0, 90)}» · esperado ${Math.round((Date.now() - t0) / 1000)} s`,
      );
    } catch (fallo) {
      juez('⭐ el motor ha terminado su pase de arranque (desvíos)', false, String(fallo.message ?? fallo));
    }
  }

  // Antes: 5000 ms a ciegas. Ahora: que estén los dos campos de calle.
  await m.ir(APP, 0);
  await m.esperar(
    'la aplicación montada: los dos campos de calle',
    `document.querySelectorAll('app-autocompletar-via input').length === 2`,
    { topeMs: 5000 },
  );
  // El espía de las respuestas de /api/ruta: es el hecho que «Generar» espera.
  await m.evaluar(`(() => {
    window.__respuestasDeRuta = 0;
    const pedir = window.fetch;
    window.fetch = function (entrada) {
      const url = typeof entrada === 'string' ? entrada : entrada?.url;
      const promesa = pedir.apply(this, arguments);
      if (String(url).includes('/api/ruta')) {
        promesa.then(() => { window.__respuestasDeRuta++; }, () => { window.__respuestasDeRuta++; });
      }
      return promesa;
    };
  })()`);

  // ══ 1 · LOS DOS BOTONES DE LA BiZi ═══════════════════════════════════════
  await escribir(0, 'COLOSO');
  await elegir(0);
  await portal(0, '2');
  await escribir(1, 'CALLE OVIEDO');
  await elegir(1, 'CALLE OVIEDO');
  await portal(1, '5');
  await modo('bizi');
  await generar(9000);

  const antes = await vivos();
  juez('en BiZi hay DOS botones vivos, uno por hito', antes.length === 2, `${antes.length}`);
  if (antes.length === 2) {
    juez(
      '⭐ el de COGER dice «Bicis ahora» y el de DEJAR «Anclajes ahora»',
      antes[0].boton === 'Bicis ahora' && antes[1].boton === 'Anclajes ahora',
      `${antes[0].boton} | ${antes[1].boton}`,
    );
    juez(
      'y cada uno está en su hito',
      antes[0].paso.startsWith('Coge') && antes[1].paso.startsWith('Deja'),
      `${antes[0].paso.slice(0, 40)}… | ${antes[1].paso.slice(0, 40)}…`,
    );
    juez(
      'la región es `role=status` y apunta desde el botón [WCAG 4.1.3]',
      antes.every((v) => v.papel === 'status' && v.controla),
      antes.map((v) => `${v.papel}/${v.controla}`).join(' · '),
    );
    juez(
      'y el botón NO está deshabilitado',
      antes.every((v) => v.apagado === false),
    );
    console.log(`   los dos hitos: «${antes[0].paso}» · «${antes[1].paso}»`);
  }

  // ── Se pulsan los dos, y se mira lo que contestan ─────────────────────────
  // Antes: 4000 ms tras cada botón. Ahora: que SU región haya contestado —ya no
  // está `aria-busy` y dice algo—, que es exactamente lo que se lee después.
  // ⚠️ Y SE MIRA QUE EL BOTÓN ESTÉ ANTES DE PULSARLO (22/09, el peaje). Aquí
  //    se pulsaba a ciegas, y el día que el viaje salió SIN botones vivos la
  //    suite MURIÓ con «Cannot read properties of undefined (reading 'click')»:
  //    se perdieron las 16 juezas que venían detrás y el recuento de escapadas.
  //    La ley de la casa es fallar DICIENDO —el «⏱ TIEMPO AGOTADO» de
  //    `m.esperar` es eso mismo—, así que esto se pone rojo con su motivo y
  //    deja seguir a las demás.
  const contesta = async (i) => {
    const hay = await m.evaluar(`document.querySelectorAll('.vivo__boton').length`);
    if (hay <= i) {
      juez(`el botón vivo ${i} está para poder pulsarlo`, false, `hay ${hay} botones vivos en la página`);
      return false;
    }
    await m.evaluar(`document.querySelectorAll('.vivo__boton')[${i}].click()`);
    // Y el tope tampoco puede matar la suite: si la región no contesta, se dice
    // con el mensaje del «⏱ TIEMPO AGOTADO» y se sigue contando.
    try {
      await m.esperar(
        `la respuesta del botón vivo ${i} en su región`,
        `(() => {
          const r = document.querySelectorAll('.vivo__estado')[${i}];
          return !!r && r.getAttribute('aria-busy') !== 'true' && r.textContent.trim().length > 0;
        })()`,
        { topeMs: 4000 },
      );
    } catch (fallo) {
      juez(`el botón vivo ${i} contesta dentro de su tope`, false, String(fallo.message ?? fallo));
      return false;
    }
    return true;
  };
  await contesta(0);
  await contesta(1);
  const pulsados = await vivos();
  console.log(`   tras pulsar: «${pulsados[0]?.region}» · «${pulsados[1]?.region}»`);
  juez(
    '⭐ el de bicis contesta BICIS y el de anclajes contesta ANCLAJES',
    /bicis? disponibles?|no publica|no verificada/.test(pulsados[0]?.region ?? '') &&
      /anclajes? libres?|no publica|no verificada/.test(pulsados[1]?.region ?? ''),
    `${pulsados[0]?.region} || ${pulsados[1]?.region}`,
  );
  juez(
    'y las dos regiones dicen cosas DISTINTAS: no es la misma respuesta en las dos',
    pulsados[0]?.region !== pulsados[1]?.region,
  );

  // ── Dos pulsaciones son dos consultas: se cuentan de verdad ───────────────
  const contadas = await m.evaluar(
    `performance.getEntriesByType('resource').filter(r => r.name.includes('/api/estacion-viva')).length`,
  );
  juez(
    '⭐ dos pulsaciones = DOS consultas al motor (frescura por petición)',
    contadas === 2,
    `${contadas} peticiones a /api/estacion-viva`,
  );

  // Y la foto tampoco mata la suite si no hay pasos que enseñar: se encuadra lo
  // que haya (22/09, el peaje — aquí murió con «undefined.scrollIntoView»).
  await m.evaluar(`document.querySelectorAll('.paso')[0]?.scrollIntoView({block:'start'})`);
  // Antes: 300 ms. Ahora: el desplazamiento pintado antes de la foto.
  await m.pintado();
  await m.guardar(`${FOTOS}/bizi-botones.png`);
  console.log(`   foto de los botones en ${FOTOS}/bizi-botones.png`);

  // ══ 2 · EL RESUMEN ÚNICO, con el bus ═════════════════════════════════════
  await modo('bus');
  await generar(16000);

  const resumen = await m.evaluar(`(() => {
    const caja = document.querySelector('.resumen');
    if (!caja) return null;
    return {
      cajas: document.querySelectorAll('.resumen').length,
      titulo: caja.querySelector('.resumen__titulo')?.textContent.trim() ?? null,
      papel: caja.getAttribute('role'),
      lineas: [...caja.querySelectorAll('.resumen__linea')].map((l) => ({
        dice: l.textContent.replace(/\\s+/g, ' ').trim(),
        href: l.querySelector('a')?.getAttribute('href') ?? null,
      })),
      disparadores: caja.querySelectorAll('.detalles').length,
    };
  })()`);

  if (resumen === null) {
    juez('hay resumen en el viaje en bus', false, 'sin avisos hoy: no se puede juzgar');
  } else {
    juez('⭐ UNA sola caja de avisos', resumen.cajas === 1, `${resumen.cajas}`);
    juez(
      'con el título «Avisos de este viaje:» y `role=status`',
      resumen.titulo === 'Avisos de este viaje:' && resumen.papel === 'status',
      `«${resumen.titulo}» · ${resumen.papel}`,
    );
    console.log(`   ${resumen.lineas.length} línea(s):`);
    for (const l of resumen.lineas) console.log(`     · «${l.dice}» → ${l.href}`);
    // ⚠️ Esta jueza decía «arriba NO hay disparador: el detalle vive en el hito»
    //    hasta el 13/09. Desde la fase B el hito lleva solo la marca «desviada»
    //    y la lista de postes sube al renglón de su línea: un disparador por
    //    cada renglón con desvío, ni uno más y ni uno menos.
    const conDesvio = resumen.lineas.filter((l) => l.dice.includes('va hoy desviada')).length;
    juez(
      '⭐ y arriba hay un disparador de detalles por cada renglón con desvío',
      resumen.disparadores === conDesvio,
      `${resumen.disparadores} disparador(es) · ${conDesvio} renglón(es) con desvío`,
    );

    // ⭐ Cada enlace lleva a un paso QUE EXISTE y que lleva su nota.
    const destinos = await m.evaluar(`(() => {
      return [...document.querySelectorAll('.resumen__linea a')].map((a) => {
        const id = a.getAttribute('href').slice(1);
        const li = document.getElementById(id);
        return {
          href: a.getAttribute('href'),
          existe: !!li,
          enfocable: li?.getAttribute('tabindex'),
          // Su nota, o desde el 13/09 su marca «desviada» si el aviso es un desvío.
          tieneNota: !!li?.querySelector('.paso__nota, .paso__marca'),
          paso: (li?.querySelector('.paso__texto')?.textContent ?? '').replace(/\\s+/g, ' ').trim(),
        };
      });
    })()`);
    juez(
      '⭐ cada línea enlaza a un paso que existe, es enfocable y lleva su nota o su marca',
      destinos.length > 0 &&
        destinos.every((d) => d.existe && d.enfocable === '-1' && d.tieneNota),
      destinos.map((d) => `${d.href}→${d.existe ? 'ok' : 'NO'}`).join(' · '),
    );
    for (const d of destinos) console.log(`     ${d.href} lleva a «${d.paso}»`);

    // ⭐ Y AL SEGUIRLO, el foco se mueve de verdad. Es lo único que dice si el
    //    `tabindex="-1"` sirve para algo.
    if (destinos.length > 0) {
      const movido = await m.evaluar(`(() => {
        const a = document.querySelector('.resumen__linea a');
        a.click();
        const id = a.getAttribute('href').slice(1);
        return { foco: document.activeElement?.id ?? '(ninguno)', esperado: id };
      })()`);
      // Aquí había un `dormir(300)` DESPUÉS de leer el foco: no esperaba a nada
      // que la jueza fuera a mirar —el foco ya estaba leído—. Se quita.
      juez(
        '⭐ seguir el enlace mueve EL FOCO al paso, no solo la página',
        movido.foco === movido.esperado,
        `foco en «${movido.foco}», esperado «${movido.esperado}»`,
      );
    }
  }

  // ══ 3 · EL MINUTO, UNA SOLA VEZ ══════════════════════════════════════════
  const minutos = await m.evaluar(`(() => {
    const texto = document.body.innerText;
    const dichos = texto.match(/próximo en \\d+ min/g) ?? [];
    // ACTA 14/09 [cinco líneas]: solo miraba .paso__texto, y subir ya no la
    //    lleva — la juez habría pasado VACÍA. Mira también las líneas del hito.
    const enPasos = [...document.querySelectorAll('.paso__texto, .hito')]
      .map((p) => p.textContent)
      .filter((t) => /próximo en/.test(t));
    const enRegiones = [...document.querySelectorAll('.vivo__estado')]
      .map((r) => r.textContent.trim())
      .filter((t) => /próximo en/.test(t));
    return { dichos, enPasos, enRegiones };
  })()`);
  console.log(`   «próximo en …» aparece ${minutos.dichos.length} vez/veces: ${minutos.dichos.join(' | ')}`);
  juez(
    '⭐ el minuto vivo NO está en la frase de ningún paso',
    minutos.enPasos.length === 0,
    minutos.enPasos.join(' | ') || 'ninguna frase lo dice',
  );
  juez(
    '⭐ y como mucho lo dice UNA región, que es la del primer poste',
    minutos.enRegiones.length <= 1 && minutos.dichos.length === minutos.enRegiones.length,
    `${minutos.enRegiones.length} región(es) · ${minutos.dichos.length} en la pantalla`,
  );

  await m.evaluar(`document.querySelector('.resumen')?.scrollIntoView({block:'start'})`);
  // Antes: 300 ms. Ahora: el desplazamiento pintado antes de la foto.
  await m.pintado();
  await m.guardar(`${FOTOS}/resumen-avisos.png`);
  console.log(`   foto del resumen en ${FOTOS}/resumen-avisos.png`);

  {
    const t = terceros();
    juez(t.titulo, t.bien, t.detalle);
  }

  console.log(`\n${malas === 0 ? '✅ TODO VERDE' : `❌ ${malas} en rojo`}`);
  // El veredicto también se lee a máquina: 0 es verde y 1 es rojo, que es lo que
  // miran el shell y la batería. Sin esto el rojo solo quedaba en el texto.
  process.exitCode = malas === 0 ? 0 : 1;
} finally {
  m.cerrar();
}

// ⭐ Y EL ARNÉS NO SE DEJA NADA PUESTO (18/09): un perfil de Chrome olvidado son
//    82 MB, y el 18/09 había 111 en %TEMP% — 9 GB — con el disco al 100 %. Se
//    cuenta EL DIRECTORIO al acabar, no lo que se cree haber abierto.
//
// ⚠️ VA DETRÁS DEL `finally`, NO DENTRO DEL `try` (17/09). Allí se juzgaba con
//    el Chrome de esta suite todavía abierto: contaba su propio perfil como
//    residuo, y un borrado fallido de ESTA suite solo lo veía la siguiente.
{
  const perf = perfilesResiduales();
  juez(perf.titulo, perf.bien, perf.detalle);
  if (!perf.bien) process.exitCode = 1;
}
