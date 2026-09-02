/**
 * ⭐ LA PRUEBA REAL DE LA BOTONERA EN DOS FILAS (2/09, punto 11, casilla 1).
 *
 * Chrome de verdad y motor de verdad. Lo que `buscador.spec.ts` compra en
 * jsdom —la fila se revela, los `name` son dos, los `value` son los del
 * contrato— aquí se mira **contra el motor vivo**, que es donde se sabe si lo
 * que se pulsa arriba llega abajo.
 *
 * Y hace la foto que el checkpoint pide: la botonera con la fila revelada.
 *
 * Se ejecuta con el motor levantado y `ng serve` en el 4200:
 *
 *     node app/e2e/dos-filas.mjs
 */
import { abrirChrome } from './medir.mjs';

const APP = 'http://localhost:4200/';
const FOTO = process.argv[2] ?? 'dos-filas.png';

const m = await abrirChrome({ alto: 1300 });
let malas = 0;
const juez = (nombre, bien, detalle) => {
  if (!bien) malas++;
  console.log(`${bien ? '✔' : '✖'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
};

/** Lo que hay pintado en las tres filas, ahora mismo. */
const foto = () =>
  m.evaluar(`(() => {
    const fila = (sel) => {
      const f = document.querySelector(sel);
      if (!f) return null;
      return {
        leyenda: f.querySelector('legend')?.textContent.trim() ?? null,
        nombre: f.querySelector('input[type=radio]')?.name ?? null,
        opciones: [...f.querySelectorAll('.modo')].map((l) => l.textContent.trim()),
        valores: [...f.querySelectorAll('input[type=radio]')].map((r) => r.value),
        marcada: [...f.querySelectorAll('input[type=radio]')].find((r) => r.checked)?.value ?? null,
        cuantas: f.querySelectorAll('input[type=radio]').length,
      };
    };
    return {
      familias: fila('fieldset.modos.familias'),
      bicis: fila('fieldset.modos.bicis'),
      rutas: fila('fieldset.modos.rutas'),
    };
  })()`);

const pulsar = async (nombre, valor) => {
  const ok = await m.evaluar(
    `(() => { const r = document.querySelector('input[name=${nombre}][value=${valor}]'); if (!r) return false; r.click(); return true; })()`,
  );
  await m.dormir(300);
  return ok;
};

try {
  await m.ir(APP, 5000);

  // ── 1 · LA PRIMERA FILA SON CINCO, Y LAS DE SIEMPRE ───────────────────────
  const inicio = await foto();
  juez(
    'la primera fila son CINCO familias, con «Cómo» y su propio `name`',
    inicio.familias?.cuantas === 5 && inicio.familias.leyenda === 'Cómo',
    `${inicio.familias?.cuantas} · «${inicio.familias?.leyenda}» · name=${inicio.familias?.nombre}`,
  );
  console.log(`   son: ${inicio.familias?.opciones.join(' | ')}`);
  juez('andando viene marcada al cargar', inicio.familias?.marcada === 'andando');

  // ── 2 · Y LA SEGUNDA NO ESTÁ CON NINGUNA DE LAS OTRAS CUATRO ──────────────
  //
  // ⚠️ Se comprueba con las CUATRO, no con una: el revelado condicional que
  //    solo falla con el patín no lo caza una prueba que solo mire «andando».
  for (const familia of ['andando', 'bus', 'patin', 'coche']) {
    await pulsar('familia', familia);
    const ahora = await foto();
    juez(`con «${familia}» la segunda fila NO está`, ahora.bicis === null);
  }

  // ── 3 · CON BICI SÍ, Y ENTRA POR PRIVADA ──────────────────────────────────
  await pulsar('familia', 'bici');
  const conBici = await foto();
  juez('con «bici» la segunda fila aparece', conBici.bicis !== null, conBici.bicis?.leyenda ?? '');
  juez(
    'sus dos opciones son «Privada» y «Pública BiZi»',
    JSON.stringify(conBici.bicis?.opciones) === JSON.stringify(['Privada', 'Pública BiZi']),
    conBici.bicis?.opciones.join(' | '),
  );
  juez(
    '⭐ y sus `value` son los DEL CONTRATO: bici y bizi',
    JSON.stringify(conBici.bicis?.valores) === JSON.stringify(['bici', 'bizi']),
    conBici.bicis?.valores.join(' | '),
  );
  juez('entra por Privada, que es el defecto', conBici.bicis?.marcada === 'bici');
  juez(
    '⭐ es su PROPIO grupo: `name` distinto del de la primera fila',
    conBici.bicis?.nombre !== conBici.familias?.nombre,
    `${conBici.familias?.nombre} vs ${conBici.bicis?.nombre}`,
  );
  juez(
    'y la primera fila sigue con «bici» marcada: son dos grupos, no uno de siete',
    conBici.familias?.marcada === 'bici',
  );
  juez(
    'las tres rutas siguen debajo',
    JSON.stringify(conBici.rutas?.opciones) === JSON.stringify(['Rápida', 'Equilibrada', 'Tranquila']),
    conBici.rutas?.opciones.join(' | '),
  );

  // ── 4 · LA FOTO, con la fila revelada ─────────────────────────────────────
  await m.evaluar(`document.querySelector('fieldset.modos.familias').scrollIntoView({block:'start'})`);
  await m.dormir(300);
  await m.guardar(FOTO);
  console.log(`   foto en ${FOTO}`);

  // ── 5 · Y LO QUE LLEGA AL MOTOR ───────────────────────────────────────────
  //
  // Se rellena una dirección de verdad y se generan las dos bicis, mirando lo
  // que el navegador manda. Es lo único que prueba que la segunda fila está
  // cableada y no solo pintada.
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

  // ⭐ EL ESPÍA, y **por dónde sale de verdad se MIDIÓ, no se supuso** (2/09).
  //
  // ⚠️ La primera versión de esto envolvía solo `XMLHttpRequest`, dando por
  //    hecho que HttpClient va por XHR mientras no se ponga `withFetch()`. Dio
  //    **cero peticiones** con la pantalla pintando el resultado, que es la
  //    señal de que el roto está en el instrumento. Contado en la página con
  //    los dos espías puestos: `{ xhr: 0, fetch: 2 }` — **este HttpClient sale
  //    por `fetch`**. Se envuelven los dos igualmente: si mañana cambia el
  //    transporte, esto lo seguirá viendo.
  await m.evaluar(`(() => {
    window.__cuerpos = [];
    const dePeticion = (url, cuerpo) => {
      if (String(url).includes('/api/ruta') && cuerpo) window.__cuerpos.push(String(cuerpo));
    };
    const abrir = XMLHttpRequest.prototype.open;
    const enviar = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (metodo, url) { this.__url = url; return abrir.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function (cuerpo) {
      dePeticion(this.__url, cuerpo);
      return enviar.apply(this, arguments);
    };
    const pedir = window.fetch;
    window.fetch = function (entrada, opciones) {
      const url = typeof entrada === 'string' ? entrada : entrada?.url;
      dePeticion(url, opciones?.body);
      return pedir.apply(this, arguments);
    };
  })()`);

  await escribir(0, 'COLOSO');
  await elegir(0);
  await portal(0, '2');
  await escribir(1, 'CALLE OVIEDO');
  await elegir(1, 'CALLE OVIEDO');
  await portal(1, '5');

  for (const cual of ['bici', 'bizi']) {
    await pulsar('familia', 'bici');
    await pulsar('bici', cual);
    await m.evaluar(`window.__cuerpos = []`);
    await m.evaluar(
      `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
    );
    await m.dormir(9000);
    const cuerpos = (await m.evaluar(`window.__cuerpos`)).map((c) => JSON.parse(c));
    juez(
      `⭐ pulsando «${cual === 'bici' ? 'Privada' : 'Pública BiZi'}» el motor recibe modo=${cual}`,
      cuerpos.length === 3 && cuerpos.every((c) => c.modo === cual),
      `${cuerpos.length} peticiones · modos: ${[...new Set(cuerpos.map((c) => c.modo))].join(',')} · ` +
        `rutas: ${cuerpos.map((c) => c.ruta).join(',')}`,
    );
    const dice = await m.evaluar(`document.querySelector('.pasos__modo')?.textContent.trim() ?? '(nada)'`);
    juez(`y la pantalla lo dice: «${dice}»`, dice.includes(cual === 'bici' ? 'Bici privada' : 'BiZi'));
  }

  // Y el bus, que es el de la muralla: una sola petición y sin `ruta`.
  await pulsar('familia', 'bus');
  await m.evaluar(`window.__cuerpos = []`);
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  await m.dormir(12000);
  const delBus = (await m.evaluar(`window.__cuerpos`)).map((c) => JSON.parse(c));
  juez(
    '⭐ LA MURALLA · el bus manda UNA petición, con modo=bus y sin `ruta`',
    delBus.length === 1 && delBus[0].modo === 'bus' && !('ruta' in delBus[0]),
    `${delBus.length} · claves: ${Object.keys(delBus[0] ?? {}).sort().join(',')}`,
  );

  console.log(`\n${malas === 0 ? '✅ TODO VERDE' : `❌ ${malas} en rojo`}`);
} finally {
  m.cerrar();
}
