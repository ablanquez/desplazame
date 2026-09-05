/**
 * ⭐ LA PRUEBA REAL DE LA MOTO COMPARTIDA (4/09, punto 13, casilla 2).
 *
 * Chrome de verdad, motor de verdad y **YeGo de verdad**: es la única de las
 * pruebas reales de la casa que sale a una API de un tercero, así que lo que
 * aquí se ve es la flota que hay en la calle en este momento.
 *
 * Y hace la foto que el checkpoint pide: la fila [Privada] [Pública YeGo], el
 * polígono de la zona, y el hito con la autonomía de la moto que ha ganado.
 *
 * Se ejecuta con el motor levantado y `ng serve` en el 4200:
 *
 *     node app/e2e/yego.mjs
 */
import { abrirChrome } from './medir.mjs';

const APP = 'http://localhost:4200/';
const FOTO = process.argv[2] ?? 'yego.png';

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
  await m.dormir(400);
  return ok;
};

const foto = () =>
  m.evaluar(`(() => {
    const grupo = (sel) => {
      const g = document.querySelector(sel);
      return g === null ? null : {
        leyenda: g.querySelector('legend')?.textContent.trim() ?? null,
        nombre: g.querySelector('input[type=radio]')?.name ?? null,
        opciones: [...g.querySelectorAll('.modo')].map((l) => l.textContent.trim()),
        valores: [...g.querySelectorAll('input[type=radio]')].map((r) => r.value),
        marcada: [...g.querySelectorAll('input[type=radio]')].find((r) => r.checked)?.value ?? null,
      };
    };
    return {
      familias: grupo('fieldset.modos.familias'),
      motos: grupo('fieldset.modos.motos'),
      distintivos: grupo('fieldset.modos.distintivos'),
      aparcamientos: grupo('fieldset.modos.aparcamientos'),
      poligonos: document.querySelectorAll('.leaflet-zbe-pane path').length,
    };
  })()`);

try {
  await m.ir(APP, 5000);

  // ── 1 · LA SEGUNDA FILA DE LA MOTO ────────────────────────────────────────
  const inicio = await foto();
  juez('la primera fila sigue en SEIS familias', inicio.familias?.opciones.length === 6,
    inicio.familias?.opciones.join(' | '));
  juez('sin Moto, la segunda fila no está', inicio.motos === null);

  await pulsar('familia', 'moto');
  const enMoto = await foto();
  juez(
    '⭐ con Moto aparece [Privada] [Pública YeGo]',
    JSON.stringify(enMoto.motos?.opciones) === JSON.stringify(['Privada', 'Pública YeGo']),
    enMoto.motos?.opciones.join(' | '),
  );
  juez(
    '⭐ y sus `value` son los del contrato: moto y yego',
    JSON.stringify(enMoto.motos?.valores) === JSON.stringify(['moto', 'yego']),
    enMoto.motos?.valores.join(' | '),
  );
  juez('entra por Privada, que es el defecto', enMoto.motos?.marcada === 'moto');
  juez(
    '⭐ es su PROPIO grupo: `name` distinto del de la primera fila',
    enMoto.motos?.nombre === 'moto' && enMoto.familias?.nombre === 'familia',
    `${enMoto.familias?.nombre} vs ${enMoto.motos?.nombre}`,
  );
  juez('con Privada, la pregunta del distintivo SÍ está', enMoto.distintivos !== null);

  // ── 2 · CON YeGo NO HAY DISTINTIVO, Y EL POLÍGONO SIGUE ───────────────────
  await pulsar('moto', 'yego');
  const enYego = await foto();
  juez('⭐ con YeGo la pregunta del distintivo NO está', enYego.distintivos === null);
  juez('ni la del aparcamiento', enYego.aparcamientos === null);
  juez('⭐ y el polígono de la ZBE se sigue pintando', enYego.poligonos === 1,
    `${enYego.poligonos} polígonos`);
  juez('y la fila de la moto sigue, con YeGo marcada', enYego.motos?.marcada === 'yego');

  // ── 3 · UN VIAJE DE VERDAD, CONTRA LA FLOTA DE VERDAD ─────────────────────
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

  await m.evaluar(`(() => {
    window.__cuerpos = [];
    const pedir = window.fetch;
    window.fetch = function (entrada, opciones) {
      const url = typeof entrada === 'string' ? entrada : entrada?.url;
      if (String(url).includes('/api/ruta') && opciones?.body) window.__cuerpos.push(String(opciones.body));
      return pedir.apply(this, arguments);
    };
  })()`);

  await escribir(0, 'PEDRO LAPUYADE');
  await elegir(0, 'CALLE PEDRO LAPUYADE');
  await portal(0, '3');
  await escribir(1, 'ABEN AIRE');
  await elegir(1, 'CALLE ABEN AIRE');
  await portal(1, '33');

  await m.evaluar(`window.__cuerpos = []`);
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  await m.dormir(9000);

  const cuerpos = (await m.evaluar(`window.__cuerpos`)).map((c) => JSON.parse(c));
  juez('sale UNA petición de ruta', cuerpos.length === 1, `${cuerpos.length}`);
  juez(
    '⭐ y manda `modo: "yego"` y NADA más',
    cuerpos[0]?.modo === 'yego' && Object.keys(cuerpos[0] ?? {}).length === 3,
    Object.keys(cuerpos[0] ?? {}).sort().join(', '),
  );

  const pintado = await m.evaluar(`(() => {
    const pasos = [...document.querySelectorAll('.paso')];
    const texto = (p) => p ? p.querySelector('.paso__texto').textContent.replace(/\\s+/g, ' ').trim() : null;
    const encima = [...document.querySelectorAll('path.leaflet-interactive')].filter((_, i) => i % 2 === 1);
    return {
      modo: document.querySelector('.pasos__modo')?.textContent.trim() ?? null,
      totales: [...document.querySelectorAll('.ruta__totales span')].map((s) => s.textContent.trim()),
      cuantosPasos: pasos.length,
      coge: texto(pasos.find((li) => (li.querySelector('.paso__texto')?.textContent ?? '').startsWith('Coge'))),
      deja: texto(pasos.find((li) => (li.querySelector('.paso__texto')?.textContent ?? '').startsWith('Deja'))),
      resumen: [...document.querySelectorAll('.resumen__linea')].map((l) => l.textContent.replace(/\\s+/g, ' ').trim()),
      colores: encima.map((p) => p.getAttribute('stroke')),
      poligonos: document.querySelectorAll('.leaflet-zbe-pane path').length,
      hayUuid: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/.test(document.body.innerHTML),
    };
  })()`);
  console.log(`   ${pintado.modo} · ${pintado.totales.join(' · ')} · ${pintado.cuantosPasos} pasos`);
  console.log(`   COGE: ${pintado.coge}`);
  console.log(`   DEJA: ${pintado.deja}`);
  console.log(`   AVISOS: ${pintado.resumen.join(' | ')}`);
  console.log(`   traza: ${pintado.colores.join(' ')}`);

  juez('el rótulo dice «Modo: YeGo»', pintado.modo === 'Modo: YeGo', pintado.modo ?? '');
  juez(
    '⭐ el hito de coger dice la autonomía de la moto que ha ganado',
    /^Coge la moto de YeGo \(\d+ km de autonomía\)$/.test(pintado.coge ?? ''),
    pintado.coge ?? 'no hay hito',
  );
  juez(
    '⭐ y el remate es dejarla en el destino, no en un aparcamoto',
    /^Deja la moto en .+, donde esté permitido aparcar$/.test(pintado.deja ?? ''),
    pintado.deja ?? 'no hay remate',
  );
  juez(
    '⭐ el resumen dice cuántas motos hay y de cuándo es el dato',
    pintado.resumen.some((l) => /^Motos de YeGo: \d+ libres, datos de hace/.test(l)),
    pintado.resumen[0] ?? '',
  );
  juez('el polígono sigue debajo del trazo', pintado.poligonos === 1, `${pintado.poligonos}`);
  juez('empieza andando (ámbar) y sigue rodando', pintado.colores[0] === '#b45309');
  juez('⛔ ni un identificador de moto en la página', pintado.hayUuid === false);

  // ── 4 · LA FOTO ───────────────────────────────────────────────────────────
  await m.evaluar(`document.querySelector('fieldset.modos.familias').scrollIntoView({block:'start'})`);
  await m.dormir(500);
  await m.guardar(FOTO);
  console.log(`   foto en ${FOTO}`);
} finally {
  await m.cerrar();
}

console.log(malas === 0 ? '\nVERDE: la moto compartida está en la pantalla y llega a YeGo.' : `\nROJO: ${malas} mal.`);
process.exit(malas === 0 ? 0 : 1);
