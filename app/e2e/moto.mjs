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
import { abrirChrome } from './medir.mjs';

const APP = 'http://localhost:4200/';
const FOTO = process.argv[2] ?? 'moto.png';

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
      poligonos: document.querySelectorAll('.leaflet-zbe-pane path').length,
    };
  })()`);

try {
  await m.ir(APP, 5000);

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
  juez('andando viene marcada al cargar', inicio.familias.marcada === 'andando');

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

  // El espía del cuerpo que sale. Va por `fetch`, medido el 2/09.
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
      totales: [...document.querySelectorAll('.ruta__totales span')].map((s) => s.textContent.trim()),
      cuantosPasos: pasos.length,
      hito: hito ? hito.querySelector('.paso__texto').textContent.replace(/\\s+/g, ' ').trim() : null,
      marca: hito ? hito.querySelector('.paso__flecha')?.textContent.trim() : null,
      colores: encima.map((p) => p.getAttribute('stroke')),
      poligonos: document.querySelectorAll('.leaflet-zbe-pane path').length,
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
  juez('y su marca es la 🅿', pintado.marca === '🅿', pintado.marca ?? '');
  juez(
    '⭐ la traza CORTA en rojo donde pisa la zona',
    pintado.colores.includes('#d32f2f'),
    pintado.colores.join(' '),
  );
  juez('el polígono sigue debajo del trazo', pintado.poligonos === 1, `${pintado.poligonos}`);
  juez('la moto no elige aparcamiento: no hay atajo de zona cruzada', pintado.sugerencia === false);

  // ── 5 · LA FOTO: botonera, polígono y hito en el mismo encuadre ───────────
  await m.evaluar(`document.querySelector('fieldset.modos.familias').scrollIntoView({block:'start'})`);
  await m.dormir(500);
  await m.guardar(FOTO);
  console.log(`   foto en ${FOTO}`);
} finally {
  await m.cerrar();
}

console.log(malas === 0 ? '\nVERDE: la moto está en la botonera y llega al motor.' : `\nROJO: ${malas} mal.`);
process.exit(malas === 0 ? 0 : 1);
