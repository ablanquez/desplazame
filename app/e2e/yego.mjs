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
 * ⭐ Y DESDE EL 5/09, **el área de servicio pintada y el destino que se rechaza**
 * — las dos cosas que el contrato del operador trajo [GCC v-2025/05/20 § 3.2.2].
 * Aquí es además donde se comprueba que **los huecos se dibujan como huecos**:
 * en las pruebas de unidad el mapa no tiene tamaño y Leaflet lo recorta todo a
 * una caja de cuatro píxeles, así que la única manera de verlo es un navegador
 * de verdad.
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
      // ⭐ Los dos polígonos de contexto se cuentan **por su borde**, no por su
      //    número: el de la ZBE es continuo y los del área de YeGo van a rayas.
      //    Contarlos a bulto ataría la prueba a cuántas manchas publique hoy.
      poligonos: [...document.querySelectorAll('.leaflet-zbe-pane path')].filter(
        (x) => x.getAttribute('stroke-dasharray') === null,
      ).length,
      manchas: [...document.querySelectorAll('.leaflet-zbe-pane path')].filter(
        (x) => x.getAttribute('stroke-dasharray') !== null,
      ).length,
      // Cuántos subcaminos tiene la mancha más partida: los huecos.
      anillosDeLaMayor: Math.max(
        0,
        ...[...document.querySelectorAll('.leaflet-zbe-pane path')]
          .filter((x) => x.getAttribute('stroke-dasharray') !== null)
          .map((x) => (x.getAttribute('d') ?? '').match(/M/g)?.length ?? 0),
      ),
      bordeDelArea: [...document.querySelectorAll('.leaflet-zbe-pane path')]
        .find((x) => x.getAttribute('stroke-dasharray') !== null)
        ?.getAttribute('stroke') ?? null,
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
  juez('⭐ y con Privada el área de YeGo NO se pinta', enMoto.manchas === 0,
    `${enMoto.manchas} manchas`);

  // ── 2 · CON YeGo NO HAY DISTINTIVO, Y EL POLÍGONO SIGUE ───────────────────
  await pulsar('moto', 'yego');
  const enYego = await foto();
  juez('⭐ con YeGo la pregunta del distintivo NO está', enYego.distintivos === null);
  juez('ni la del aparcamiento', enYego.aparcamientos === null);
  juez('⭐ y el polígono de la ZBE se sigue pintando', enYego.poligonos === 1,
    `${enYego.poligonos} polígonos`);
  juez('y la fila de la moto sigue, con YeGo marcada', enYego.motos?.marcada === 'yego');

  // ── 2-bis · EL ÁREA DE SERVICIO, PINTADA Y CON SUS HUECOS ─────────────────
  juez('⭐ con YeGo se pintan las manchas del área de servicio', enYego.manchas > 0,
    `${enYego.manchas} manchas`);
  juez('⭐ y su borde va a rayas, que es lo que lo distingue del de la ZBE',
    enYego.bordeDelArea === '#166534', enYego.bordeDelArea ?? 'sin borde');
  juez(
    '⭐ y los HUECOS se dibujan como huecos: la mancha del centro trae tres anillos',
    enYego.anillosDeLaMayor >= 3,
    `${enYego.anillosDeLaMayor} subcaminos en la más partida`,
  );

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
      poligonos: [...document.querySelectorAll('.leaflet-zbe-pane path')].filter(
        (x) => x.getAttribute('stroke-dasharray') === null,
      ).length,
      manchas: [...document.querySelectorAll('.leaflet-zbe-pane path')].filter(
        (x) => x.getAttribute('stroke-dasharray') !== null,
      ).length,
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
    '⭐ y el remate es dejarla en el destino, dentro del área y con el consejo de YeGo',
    /^Deja la moto en .+, dentro del área de YeGo — prioriza un aparcamiento de motos$/.test(
      pintado.deja ?? '',
    ),
    pintado.deja ?? 'no hay remate',
  );
  juez(
    '⭐ el resumen dice cuántas motos hay y de cuándo es el dato',
    pintado.resumen.some((l) => /^Motos de YeGo: \d+ libres, datos de hace/.test(l)),
    pintado.resumen[0] ?? '',
  );
  juez('el polígono sigue debajo del trazo', pintado.poligonos === 1, `${pintado.poligonos}`);
  juez('⭐ y el área de servicio sigue pintada con la ruta encima', pintado.manchas > 0,
    `${pintado.manchas} manchas`);
  juez('empieza andando (ámbar) y sigue rodando', pintado.colores[0] === '#b45309');
  juez('⛔ ni un identificador de moto en la página', pintado.hayUuid === false);

  // ── 4 · LA FOTO ───────────────────────────────────────────────────────────
  await m.evaluar(`document.querySelector('fieldset.modos.familias').scrollIntoView({block:'start'})`);
  await m.dormir(500);
  await m.guardar(FOTO);
  console.log(`   foto en ${FOTO}`);

  // ── 5 · ⭐ UN DESTINO FUERA DEL ÁREA, Y LA PANTALLA LO DICE ────────────────
  //
  // `PASEO INDEPENDENCIA 3` está en pleno centro **y dentro de un hueco** del
  // área de servicio [§ 1.34]. Es el caso que más se parece a un fallo y no lo
  // es: el contrato de YeGo no deja terminar ahí. Lo que se compra es que el
  // motivo llegue a la cara con las palabras del contrato.
  await escribir(1, 'PASEO INDEPENDENCIA');
  await elegir(1, 'PASEO INDEPENDENCIA');
  await portal(1, '3');
  await m.evaluar(`window.__cuerpos = []`);
  await m.evaluar(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Generar')).click()`,
  );
  await m.dormir(6000);

  const rechazo = await m.evaluar(`(() => ({
    pasos: document.querySelectorAll('.paso').length,
    trazas: document.querySelectorAll('path.leaflet-interactive').length,
    resumen: [...document.querySelectorAll('.resumen__linea')].map((l) => l.textContent.replace(/\\s+/g, ' ').trim()),
    manchas: [...document.querySelectorAll('.leaflet-zbe-pane path')].filter(
      (x) => x.getAttribute('stroke-dasharray') !== null,
    ).length,
  }))()`);
  console.log(`   RECHAZO: ${rechazo.resumen.join(' | ')}`);
  juez(
    '⭐ un destino dentro de un hueco del área se rechaza con las palabras del contrato',
    rechazo.resumen.some((l) =>
      l.includes(
        'El área de servicio de YeGo no llega a tu destino: su contrato solo permite terminar ' +
          'el viaje dentro de su zona.',
      ),
    ),
    rechazo.resumen.join(' | ') || 'sin resumen',
  );
  juez('⛔ y no queda ni un paso ni una traza que finjan un viaje',
    rechazo.pasos === 0 && rechazo.trazas === 0, `${rechazo.pasos} pasos · ${rechazo.trazas} trazas`);
  juez('y el área se sigue viendo, que es lo que explica el «no»', rechazo.manchas > 0,
    `${rechazo.manchas} manchas`);
  await m.guardar(FOTO.replace('.png', '-fuera.png'));
  console.log(`   foto del rechazo en ${FOTO.replace('.png', '-fuera.png')}`);
} finally {
  await m.cerrar();
}

console.log(malas === 0 ? '\nVERDE: la moto compartida está en la pantalla y llega a YeGo.' : `\nROJO: ${malas} mal.`);
process.exit(malas === 0 ? 0 : 1);
