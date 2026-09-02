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
import { abrirChrome } from './medir.mjs';

const APP = 'http://localhost:4200/';
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
const modo = async (cual) => {
  const familia = cual === 'bizi' ? 'bici' : cual;
  await m.evaluar(`document.querySelector('input[name=familia][value=${familia}]').click()`);
  await m.dormir(300);
  if (familia === 'bici') {
    await m.evaluar(`document.querySelector('input[name=bici][value=${cual}]').click()`);
    await m.dormir(300);
  }
};
const generar = async (esperaMs) => {
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  await m.dormir(esperaMs);
};
/** Lo que se ve de los botones vivos y sus regiones, ahora mismo. */
const vivos = () =>
  m.evaluar(`[...document.querySelectorAll('.paso')]
    .filter((li) => li.querySelector('.vivo__boton'))
    .map((li) => ({
      paso: (li.querySelector('.paso__texto')?.textContent ?? '').replace(/\\s+/g, ' ').trim(),
      boton: li.querySelector('.vivo__boton').textContent.trim(),
      controla: li.querySelector('.vivo__boton').getAttribute('aria-controls'),
      region: (li.querySelector('.vivo__estado')?.textContent ?? '').trim(),
      papel: li.querySelector('.vivo__estado')?.getAttribute('role') ?? null,
      ocupada: li.querySelector('.vivo__estado')?.getAttribute('aria-busy') ?? null,
      apagado: li.querySelector('.vivo__boton').disabled,
    }))`);

try {
  await m.ir(APP, 5000);

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
  await m.evaluar(`document.querySelectorAll('.vivo__boton')[0].click()`);
  await m.dormir(4000);
  await m.evaluar(`document.querySelectorAll('.vivo__boton')[1].click()`);
  await m.dormir(4000);
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

  await m.evaluar(`document.querySelectorAll('.paso')[0].scrollIntoView({block:'start'})`);
  await m.dormir(300);
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
    juez(
      '⭐ y arriba NO hay disparador de detalles: el detalle vive en el hito',
      resumen.disparadores === 0,
      `${resumen.disparadores}`,
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
          tieneNota: !!li?.querySelector('.paso__nota'),
          paso: (li?.querySelector('.paso__texto')?.textContent ?? '').replace(/\\s+/g, ' ').trim(),
        };
      });
    })()`);
    juez(
      '⭐ cada línea enlaza a un paso que existe, es enfocable y lleva su nota',
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
      await m.dormir(300);
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
    const enPasos = [...document.querySelectorAll('.paso__texto')]
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
  await m.dormir(300);
  await m.guardar(`${FOTOS}/resumen-avisos.png`);
  console.log(`   foto del resumen en ${FOTOS}/resumen-avisos.png`);

  console.log(`\n${malas === 0 ? '✅ TODO VERDE' : `❌ ${malas} en rojo`}`);
} finally {
  m.cerrar();
}
