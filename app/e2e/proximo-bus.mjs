/**
 * ⭐ LA PRUEBA REAL DEL BOTÓN «PRÓXIMO BUS» (1/09).
 *
 * Chrome de verdad, motor de verdad y Avanza de verdad. Lo que las jueces del
 * `buscador.spec.ts` compran con un `HttpTestingController` —la región existe,
 * `aria-busy` se mueve, el botón no se deshabilita— aquí se mira **contra la
 * fuente en vivo**, que es donde se sabe si la cañería entera está unida.
 *
 * Se ejecuta con el motor levantado y `ng serve` en el 4200:
 *
 *     node app/e2e/proximo-bus.mjs [CALLE_ORIGEN] [PORTAL] [CALLE_DESTINO] [PORTAL]
 */
import { abrirChrome } from './medir.mjs';

// ⚠️ La dirección se puede dar por entorno (14/09): `localhost` resuelve antes
//    a [::1], y en esta máquina ahí contesta a veces OTRO servidor que no es el
//    motor que se quiere medir. `APP=http://127.0.0.1:4200/ node …`.
const APP = process.env.APP ?? 'http://localhost:4200/';

const m = await abrirChrome({ alto: 2000 });
let malas = 0;
const juez = (nombre, bien, detalle) => {
  if (!bien) malas++;
  console.log(`${bien ? '✔' : '✖'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
};

try {
  await m.ir(APP, 5000);

  const escribir = async (i, texto) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via input')[${i}];
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(texto)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await m.dormir(900);
  };
  const elegir = async (i, exacto) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-autocompletar-via')[${i}];
      const ops = [...c.querySelectorAll('[role=option]')];
      const o = ops.find(x => x.textContent.trim().toUpperCase() === ${JSON.stringify(String(exacto ?? '').toUpperCase())}) ?? ops[0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    await m.dormir(700);
  };
  const portal = async (i, num) => {
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal input')[${i}]; if (!c) return;
      c.focus();
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(c, ${JSON.stringify(num)}); c.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await m.dormir(600);
    await m.evaluar(`(() => {
      const c = document.querySelectorAll('app-selector-portal')[${i}]; if (!c) return;
      const ops = [...c.querySelectorAll('[role=option]')];
      const o = ops.find((x) => x.textContent.trim() === ${JSON.stringify(num)}) ?? ops[0];
      if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); }
    })()`);
    await m.dormir(500);
  };

  await escribir(0, process.argv[2] ?? 'COLOSO');
  await elegir(0);
  await portal(0, process.argv[3] ?? '2');
  await escribir(1, process.argv[4] ?? 'CALLE OVIEDO');
  await elegir(1, process.argv[4] ?? 'CALLE OVIEDO');
  await portal(1, process.argv[5] ?? '5');
  // El grupo de la primera fila se llama `familia` desde el 2/09 (punto 11):
  // el bus no tiene segunda fila, así que aquí sigue siendo un solo clic.
  await m.evaluar(`document.querySelector('input[name=familia][value=bus]').click()`);
  await m.dormir(300);

  const arranque = Date.now();
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  await m.dormir(16000);
  const generarMs = Date.now() - arranque;

  // ── 1 · EL BOTÓN ESTÁ, Y SU REGIÓN TAMBIÉN ────────────────────────────────
  const anatomia = await m.evaluar(`(() => {
    const botones = [...document.querySelectorAll('.vivo__boton')];
    return {
      botones: botones.length,
      regiones: document.querySelectorAll('.vivo__estado').length,
      pares: botones.map((b) => {
        const r = document.getElementById(b.getAttribute('aria-controls'));
        return {
          texto: b.textContent.trim(),
          apunta: !!r,
          papel: r?.getAttribute('role') ?? null,
          ocupada: r?.getAttribute('aria-busy') ?? null,
          dice: (r?.textContent ?? '').trim(),
          bloqueado: b.disabled,
          // Desde el 14/09 subir y transbordar van en cinco líneas: el paso se
          // nombra por su L1 y su L2, no por la frase corrida que ya no pinta.
          delPaso: ['.hito__l1', '.hito__l2', '.hito__l3']
            .map((s) => (b.closest('.paso')?.querySelector(s)?.textContent ?? '').replace(/\\s+/g, ' ').trim())
            .filter(Boolean)
            .join(' · '),
        };
      }),
      subidas: [...document.querySelectorAll('.hito__accion')].filter((a) =>
        /^(Sube|Transborda)$/.test(a.textContent.trim()),
      ).length,
    };
  })()`);

  juez(
    '1 · cada subida de bus tiene su botón y su región',
    anatomia.botones > 0 && anatomia.botones === anatomia.regiones,
    `${anatomia.botones} botones · ${anatomia.regiones} regiones · ${anatomia.subidas} subidas`,
  );
  juez(
    '2 · la región existe antes de pulsar, con role=status',
    anatomia.pares.length > 0 && anatomia.pares.every((p) => p.apunta && p.papel === 'status'),
    anatomia.pares.map((p) => `${p.papel}/${p.apunta}`).join(' · '),
  );
  juez(
    '3 · ningún botón nace deshabilitado',
    anatomia.pares.length > 0 && anatomia.pares.every((p) => !p.bloqueado),
    anatomia.pares.map((p) => `«${p.texto}»`).join(' · '),
  );
  for (const p of anatomia.pares) {
    console.log(`    · ${p.delPaso}\n      región: «${p.dice || '(vacía)'}» aria-busy=${p.ocupada}`);
  }

  // ── 3 · Y LA REGIÓN VACÍA SIGUE EN EL ÁRBOL DE ACCESIBILIDAD ────────────
  //
  // ⭐ Es la juez que faltaba el 1/09 y por la que hay entrada en la bitácora.
  //    `.vivo__estado:empty { display: none }` dejaba la región vacía FUERA del
  //    árbol: dos `role=status` con ella vacía, tres al darle texto. Una región
  //    que entra en el árbol a la vez que su contenido no se anuncia [WCAG
  //    4.1.3], que es justo lo que el botón promete.
  //
  // ⚠️ Y esto NO se puede comprar en `buscador.spec.ts`: jsdom no aplica el CSS
  //    del componente, así que allí `display` sale `block` con la regla mala
  //    dentro. Se compra donde hay píxeles, que es aquí.
  const pintadas = await m.evaluar(`(() => {
    return [...document.querySelectorAll('.vivo__estado')].map((r) => ({
      vacia: r.textContent.trim() === '',
      display: getComputedStyle(r).display,
    }));
  })()`);
  juez(
    '7 · ninguna región de estado está en display:none, ni vacía',
    pintadas.some((x) => x.vacia) && pintadas.every((x) => x.display !== 'none'),
    pintadas.map((x) => `${x.vacia ? 'vacía' : 'con texto'}:${x.display}`).join(' · '),
  );

  await m.cdp('Accessibility.enable');
  const cuantosStatus = async () =>
    (await m.cdp('Accessibility.getFullAXTree')).nodes.filter(
      (n) => (n.role?.value ?? '') === 'status' && !n.ignored,
    ).length;
  const conVacias = await cuantosStatus();
  // ⚠️ Se escribe en el NODO DE TEXTO, no en `textContent`: asignar
  //    `textContent` sustituye los hijos por uno nuevo y destruye el nodo que
  //    Angular tiene cogido para su interpolación — la página se queda muda a
  //    partir de ahí. Lo aprendí rompiéndolo: las jueces 5 y 6 se pusieron
  //    rojas con «» y el fallo era de esta sonda, no de la pantalla.
  await m.evaluar(
    `document.querySelectorAll('.vivo__estado').forEach((r) => { if (!r.textContent.trim() && r.firstChild) r.firstChild.data = 'x'; })`,
  );
  await m.dormir(300);
  const conTexto = await cuantosStatus();
  juez(
    '8 · las regiones ya están en el árbol de accesibilidad ANTES de tener texto',
    conVacias > 0 && conVacias === conTexto,
    `${conVacias} con las vacías · ${conTexto} al darles texto`,
  );
  // Se deshace la marca: lo que viene despues pulsa de verdad y tiene que
  // encontrar la region como estaba.
  await m.evaluar(
    `document.querySelectorAll('.vivo__estado').forEach((r) => { if (r.firstChild?.data === 'x') r.firstChild.data = ''; })`,
  );
  await m.dormir(200);

  // ── 2 · SE PULSA EL ÚLTIMO, que es el que el Generar NO consultó ──────────
  const cual = anatomia.botones - 1;
  const antes = await m.evaluar(
    `(document.querySelectorAll('.vivo__estado')[${cual}].textContent ?? '').trim()`,
  );
  await m.evaluar(`document.querySelectorAll('.vivo__boton')[${cual}].click()`);
  await m.dormir(120);
  const enVuelo = await m.evaluar(`(() => {
    const r = document.querySelectorAll('.vivo__estado')[${cual}];
    const b = document.querySelectorAll('.vivo__boton')[${cual}];
    return { ocupada: r.getAttribute('aria-busy'), dice: r.textContent.trim(), bloqueado: b.disabled,
             enfocable: (document.activeElement === b) || !b.hasAttribute('disabled') };
  })()`);
  juez(
    '4 · en vuelo: aria-busy true y el botón sigue enfocable',
    enVuelo.ocupada === 'true' && !enVuelo.bloqueado,
    `aria-busy=${enVuelo.ocupada} · disabled=${enVuelo.bloqueado} · dice «${enVuelo.dice}»`,
  );

  const t0 = Date.now();
  let despues = null;
  for (let i = 0; i < 60; i++) {
    despues = await m.evaluar(`(() => {
      const r = document.querySelectorAll('.vivo__estado')[${cual}];
      return { ocupada: r.getAttribute('aria-busy'), dice: r.textContent.trim(),
               tarda: !!r.closest('.vivo').querySelector('.vivo__tarda') };
    })()`);
    if (despues.ocupada === 'false') break;
    await m.dormir(300);
  }
  const tardo = Date.now() - t0;
  juez(
    '5 · al contestar, aria-busy false y la región lleva el resultado',
    despues.ocupada === 'false' && despues.dice.length > 0,
    `aria-busy=${despues.ocupada} · «${despues.dice}» · ${tardo} ms`,
  );
  juez(
    '6 · el resultado es uno de los tres estados que existen',
    /^próximo en \d+ min \(dato de las \d\d:\d\d\)$/.test(despues.dice) ||
      /^Avanza no anuncia ningún próximo/.test(despues.dice) ||
      /disponibilidad no verificada\.$/.test(despues.dice),
    `«${despues.dice}»`,
  );
  console.log(`    antes de pulsar: «${antes || '(vacía)'}»`);
  console.log(`    el Generar tardó ${generarMs} ms (con la espera de 16 s dentro)`);

  // ── 9 · LOS TRES BOTONES Y LA L5 TRAS CADA UNO (14/09, bitácora nº53) ────
  //
  // ⭐ Lo que faltaba y por lo que esta prueba dio VERDE con el zombi vivo:
  //    pulsaba solo el ÚLTIMO botón —el que el Generar no consultó— y no leía
  //    nada más que la región. La advertencia del Generar se quedaba pintada
  //    junto al PRIMERO con el dato ya leído, y aquí nadie miraba.
  //
  //    Ahora se pulsan TODOS: los de bus aquí, y «Bicis ahora» y «Anclajes
  //    ahora» en un viaje en BiZi. Tras cada uno, en SU paso: la región dice uno
  //    de los estados que existen, va vestida de advertencia SI Y SOLO SI dice
  //    que no se pudo leer, y no queda ninguna tira que diga otra cosa. Contra
  //    la fuente de verdad: lo que conteste es lo que se juzga.
  const MUDO = /disponibilidad no verificada\.$|^No se pudo preguntar al motor/;
  const leerL5 = (i) =>
    m.evaluar(`(() => {
      const b = document.querySelectorAll('.vivo__boton')[${i}];
      const li = b.closest('.paso');
      const r = document.getElementById(b.getAttribute('aria-controls'));
      return {
        boton: b.textContent.trim(),
        ocupada: r.getAttribute('aria-busy'),
        dice: r.textContent.replace(/\\s+/g, ' ').trim(),
        avisa: r.classList.contains('vivo__estado--aviso'),
        papel: r.getAttribute('role'),
        tiras: [...li.querySelectorAll('.paso__nota')].map((n) => n.textContent.replace(/\\s+/g, ' ').trim()),
      };
    })()`);
  const pulsarYLeer = async (i) => {
    await m.evaluar(`document.querySelectorAll('.vivo__boton')[${i}].click()`);
    await m.dormir(150);
    let l5 = await leerL5(i);
    for (let k = 0; k < 80 && l5.ocupada !== 'false'; k++) {
      await m.dormir(250);
      l5 = await leerL5(i);
    }
    return l5;
  };
  const juzgarL5 = (etiqueta, l5) => {
    juez(
      `9 · «${l5.boton}» ${etiqueta}: una sola voz — la región advierte si y solo si no pudo leer, y ninguna tira de lo vivo`,
      l5.ocupada === 'false' &&
        l5.papel === 'status' &&
        l5.dice.length > 0 &&
        l5.avisa === MUDO.test(l5.dice) &&
        !l5.tiras.some((t) => /No hemos podido preguntar|Avanza no anuncia|El Ayuntamiento contesta/.test(t)),
      `«${l5.dice}» · ${l5.avisa ? 'VESTIDA de advertencia' : 'como dato'} · tiras ${l5.tiras.length ? l5.tiras.map((t) => '«' + t.slice(0, 40) + '…»').join(' ') : 'ninguna'}`,
    );
  };
  const deBus = await m.evaluar(`document.querySelectorAll('.vivo__boton').length`);
  for (let i = 0; i < deBus; i++) {
    juzgarL5(`(${i + 1} de ${deBus}, en bus)`, await pulsarYLeer(i));
  }

  // Y la BiZi: el mismo viaje, en la bici pública.
  await m.evaluar(`document.querySelector('input[name=familia][value=bici]').click()`);
  await m.dormir(400);
  await m.evaluar(`document.querySelector('input[name=bici][value=bizi]').click()`);
  await m.dormir(400);
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  await m.dormir(9000);
  const deBizi = await m.evaluar(`[...document.querySelectorAll('.vivo__boton')].map((b) => b.textContent.trim())`);
  juez(
    '9 · la BiZi trae sus dos botones: «Bicis ahora» y «Anclajes ahora»',
    deBizi.length === 2 && deBizi[0] === 'Bicis ahora' && deBizi[1] === 'Anclajes ahora',
    deBizi.map((b) => `«${b}»`).join(' · ') || '(ninguno)',
  );
  for (let i = 0; i < deBizi.length; i++) {
    juzgarL5('(en BiZi)', await pulsarYLeer(i));
  }

  // La captura va donde se le diga, y no se deja tirada en la raíz del
  // repositorio: una imagen suelta ahí se cuela en el siguiente `git add` sin
  // que nadie la mire.
  const donde = process.argv[6] || 'proximo-bus.png';
  await m.guardar(donde);
  console.log('\ncaptura → ' + donde);
} finally {
  m.cerrar();
}
console.log(malas === 0 ? '\nVERDE: todas en verde.' : `\nROJO: ${malas} en rojo.`);
process.exit(malas === 0 ? 0 : 1);
