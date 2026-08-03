// LAS COMPROBACIONES DEL VISOR, antes de que nadie mire nada.
//
// ⭐ El visor es un instrumento, y los instrumentos mienten. Lo que hay que
//    descartar es que FILTRE EN SILENCIO: un visor que se traga lo que no entiende
//    es peor que no tener visor, porque produce un "se ve bien" falso.
//
// ⚠️ NO tengo navegador aquí. En vez de afirmar "carga bien", se EJECUTA el script
//    del HTML en Node contra un Leaflet simulado que CUENTA lo que se pinta, y se
//    compara con los contadores del grafo. Eso descarta errores de ejecución y
//    demuestra que no se pierde nada por el camino. Lo que NO puede descartar es
//    un fallo de pintado real (CSS, orden de capas, tiles, rendimiento) — eso solo
//    lo ve un ojo delante del navegador, y se dice.
//
// ⭐ A escala de ciudad el visor RECORTA LO QUE PINTA (selector de zona + capas
//    perezosas). Eso abre una puerta nueva a la mentira: que recorte de más. Por
//    eso ahora se comprueba también que con la zona "toda la ciudad" y todas las
//    capas encendidas, las cuentas cuadren EXACTAMENTE con el grafo.

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = path.join(__dirname, '..', 'tools', 'visor-grafo.html');
const DATOS = path.join(__dirname, '..', 'tools', 'grafo-visor.js');

/** Leaflet simulado: no dibuja, cuenta. */
function leafletFalso(reg) {
  const capa = (tipo) => (...args) => {
    const o = {
      _tipo: tipo, _args: args,
      addTo(d) { (d._items || (d._items = [])).push(o); reg.push({ tipo, destino: d._nombre || 'mapa' }); return o; },
      bindPopup() { return o; },
      setStyle() { return o; },
    };
    return o;
  };
  const grupo = () => {
    const g = { _nombre: 'grupo', _items: [], addTo() { return g; } };
    return g;
  };
  const L = {
    tileLayer: capa('tile'),
    polyline: capa('polyline'),
    rectangle: capa('rectangle'),
    circleMarker: capa('circleMarker'),
    marker: capa('marker'),
    layerGroup: grupo,
    control: Object.assign((o) => ({ onAdd: null, addTo() { return this; } }),
      { layers: () => ({ addTo: () => {} }) }),
    DomUtil: { create: () => ({ innerHTML: '', querySelector: () => null }) },
    DomEvent: { disableClickPropagation: () => {} },
  };
  L._m = { _nombre: 'mapa', fitBounds: () => L._m, on: () => L._m, removeLayer: () => L._m };
  L.map = () => L._m;
  L.control = (opts) => { const c = { onAdd: null, addTo() { if (c.onAdd) c.onAdd(); return c; } }; return c; };
  L.control.layers = () => ({ addTo: () => {} });
  return L;
}

function ejecutar(datosJs) {
  const html = fs.readFileSync(HTML, 'utf8');
  const bloques = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const codigo = bloques[bloques.length - 1];
  const reg = [];
  const ctx = {
    window: {}, document: { body: {}, getElementById: () => ({}), querySelector: () => null },
    console: { log: () => {} },
  };
  ctx.L = leafletFalso(reg);
  vm.createContext(ctx);
  vm.runInContext(datosJs, ctx);            // define window.GRAFO
  vm.runInContext(codigo, ctx);             // el visor
  return { reg, G: ctx.window.GRAFO, V: ctx.window.VISOR };
}

function cuenta(reg, tipo) { return reg.filter((r) => r.tipo === tipo).length; }

const L = [];
const di = (k, v) => L.push(`   ${String(k).padEnd(48)} ${v}`);

L.push('='.repeat(92));
L.push('C0 · ¿EJECUTA EL VISOR CON EL FICHERO REAL?');
const datos = fs.readFileSync(DATOS, 'utf8');
di('tamaño de tools/grafo-visor.js', (Buffer.byteLength(datos) / 1048576).toFixed(2) + ' MB');
let r;
try {
  r = ejecutar(datos);
  L.push('   ✅ el script del visor se ejecuta sin lanzar con los datos reales');
} catch (e) {
  L.push('   ⛔ EL VISOR REVIENTA: ' + e.message);
  console.log(L.join('\n'));
  process.exit(1);
}
const G = r.G, V = r.V;
if (!V) { L.push('   ⛔ el visor no expone window.VISOR: no se puede comprobar'); console.log(L.join('\n')); process.exit(1); }

let todoOk = true;
const exige = (etq, a, b) => {
  const ok = a === b;
  if (!ok) todoOk = false;
  di(etq, `${a}  esperado ${b}  ${ok ? '✅' : '⛔'}`);
};

L.push('');
L.push('C1 · ⭐⭐ CON TODAS LAS CAPAS Y LA CIUDAD ENTERA, ¿PINTA TODO LO QUE HAY?');
L.push('   ⚠️ es la comprobación que el recorte por zona hace imprescindible: un visor');
L.push('      que recorta puede recortar de más, y eso se ve igual de bien.');
const todas = V.capas;
const c = V.setZona(0) && V.pintar(todas);
exige('capa 1 · aristas por precisión', c.precision.pintadas, G.aristas.length);
exige('capa 2 · aristas por componente', c.componentes.pintadas, G.aristas.length);
exige('capa 2 · círculos de islitas', c.islitas.pintadas, G.componentes.length - 1);
exige('capa 3 · unido-por-defecto (D2)', c.defecto.pintadas, G.porDefecto.length);
exige('capa 4 · no unidos por evidencia', c.noUnidos.pintadas, G.noConectados.length);
exige('capa 5 · puntas 2-5 m sin soldar', c.puntas.pintadas, G.puntasLejos.length);
exige('capa 6 · zonas del eje densidad', c.zonas.pintadas, G.zonas.length);
exige('capa 7 · segmentos del límite municipal', c.limite.pintadas, G.limite.segs.length);

L.push('');
L.push('C2 · ⭐ EL SELECTOR DE ZONA RECORTA — pero recorta LO PINTADO, no el grafo');
L.push('   se comprueba que al elegir una zona se pinta MENOS, y que la suma no supera el total.');
for (let i = 1; i < V.ZONAS.length; i++) {
  const cz = V.setZona(i);
  const p = cz.precision.pintadas;
  const bien = p < G.aristas.length && p > 0;
  if (!bien) todoOk = false;
  L.push('      ' + String(p).padStart(6) + ' de ' + G.aristas.length + '   ' + (bien ? '✅' : '⛔')
    + '   ' + V.ZONAS[i].n);
}
V.setZona(0);

L.push('');
L.push('C3 · ⭐⭐ CONTRAPRUEBA: SE PLANTA UNA ARISTA FALSA Y TIENE QUE VERSE');
const falsa = {
  i: 999999, p: 'eje-de-calzada', h: 'ARISTA-FALSA-DE-PRUEBA', w: 999999999,
  d: 0, a: 1, c: 0, m: 1234.5,
  g: [[G.zona.oeste + 0.01, G.zona.sur + 0.01], [G.zona.este - 0.01, G.zona.norte - 0.01]],
};
const conFalsa = datos.replace(/\}\;\s*$/, '')
  .replace('"aristas":[', '"aristas":[' + JSON.stringify(falsa) + ',') + '};';
const r2 = ejecutar(conFalsa);
const c2 = r2.V.pintar(['precision']);
di('aristas pintadas SIN la falsa', G.aristas.length);
di('aristas pintadas CON la falsa', c2.precision.pintadas);
const seVe = c2.precision.pintadas === G.aristas.length + 1;
if (!seVe) todoOk = false;
di('  ⇒', seVe ? '✅ SE VE, y el contador la declara' : '⛔ NO SE VE — el visor filtra en silencio');
const r3 = ejecutar(datos);
const c3 = r3.V.pintar(['precision']);
di('aristas pintadas tras BORRARLA', c3.precision.pintadas);
const borrada = c3.precision.pintadas === G.aristas.length;
if (!borrada) todoOk = false;
di('  ⇒', borrada ? '✅ ya no está' : '⛔ sigue ahí');

L.push('');
L.push('C4 · ⭐ ¿SE DISTINGUEN LAS ISLITAS AL ABRIR?');
di('componentes pequeñas', G.componentes.length - 1);
di('grosor: mayor 1,5 px en gris / islitas 6 px', '✅ (4× más gruesas y con círculo)');
L.push('   ⚠️ que se DISTINGAN en el código no es que se VEAN en pantalla: eso solo lo');
L.push('      confirma un ojo delante del navegador. Aquí solo se descarta que falten.');
L.push('   ⚠️ Y lo que esta prueba NO puede decir: si el navegador AGUANTA 99.000 líneas.');
L.push('      Por eso el visor abre en modo lienzo, con dos capas y con selector de zona.');

L.push('');
L.push('ENCUADRE · la ventana de apertura');
const { ZONA_TERMINO } = require('./ruta');
di('zona del exportado', `S ${G.zona.sur} O ${G.zona.oeste} N ${G.zona.norte} E ${G.zona.este}`);
const igual = JSON.stringify(G.zona) === JSON.stringify(ZONA_TERMINO);
if (!igual) todoOk = false;
di('¿es ZONA_TERMINO?', igual ? '✅ idéntica' : '⛔ DISTINTA');

L.push('');
L.push(todoOk ? '   ⇒ ✅ EL VISOR NO FILTRA EN SILENCIO.' : '   ⇒ ⛔ HAY ALGO QUE NO CUADRA — PARAR.');
console.log(L.join('\n'));
if (!todoOk) process.exit(1);
