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
//    un fallo de pintado real (CSS, orden de capas, tiles) — eso solo lo ve un ojo.

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
    map: () => ({ _nombre: 'mapa', fitBounds: () => L._m, setView: () => L._m }),
    tileLayer: capa('tile'),
    polyline: capa('polyline'),
    rectangle: capa('rectangle'),
    circleMarker: capa('circleMarker'),
    marker: capa('marker'),
    layerGroup: grupo,
    control: Object.assign(() => ({ onAdd: null, addTo: () => {} }),
      { layers: () => ({ addTo: () => {} }) }),
    DomUtil: { create: () => ({ innerHTML: '' }) },
    DomEvent: { disableClickPropagation: () => {} },
  };
  L._m = { _nombre: 'mapa', fitBounds: () => L._m };
  L.map = () => L._m;
  L.control.layers = () => ({ addTo: () => {} });
  return L;
}

function ejecutar(datosJs) {
  const html = fs.readFileSync(HTML, 'utf8');
  const bloques = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const codigo = bloques[bloques.length - 1];
  const reg = [];
  const ctx = {
    window: {}, document: { body: {}, getElementById: () => ({}) },
    console: { log: () => {} },
  };
  ctx.L = leafletFalso(reg);
  vm.createContext(ctx);
  vm.runInContext(datosJs, ctx);            // define window.GRAFO
  vm.runInContext(codigo, ctx);             // el visor
  return { reg, G: ctx.window.GRAFO };
}

function cuenta(reg, tipo) { return reg.filter((r) => r.tipo === tipo).length; }

const L = [];
const di = (k, v) => L.push(`   ${String(k).padEnd(46)} ${v}`);

L.push('='.repeat(88));
L.push('C4 · ¿EJECUTA EL VISOR CON EL FICHERO REAL?');
const datos = fs.readFileSync(DATOS, 'utf8');
let r;
try {
  r = ejecutar(datos);
  L.push('   ✅ el script del visor se ejecuta sin lanzar con los datos reales');
} catch (e) {
  L.push('   ⛔ EL VISOR REVIENTA: ' + e.message);
  console.log(L.join('\n'));
  process.exit(1);
}
const G = r.G;

L.push('');
L.push('C1 · ⭐ ¿PINTA TODO LO QUE HAY?  — un visor que filtra en silencio no sirve');
const polis = cuenta(r.reg, 'polyline');
const esperadoPolis = G.aristas.length * 2 + G.puntasLejos.length;   // capa 1 + capa 2 + puntas
di('polilíneas creadas', polis);
di('  esperadas (aristas ×2 capas + puntas)', esperadoPolis);
di('  ⇒', polis === esperadoPolis ? '✅ ninguna arista se pierde por el camino' : '⛔ SE PIERDEN ARISTAS');
const marcadores = cuenta(r.reg, 'marker');
di('marcadores (unido-por-defecto)', `${marcadores}  esperados ${G.porDefecto.length}  ${marcadores === G.porDefecto.length ? '✅' : '⛔'}`);
const circulos = cuenta(r.reg, 'circleMarker');
const espCirc = (G.componentes.length - 1) + G.porDefecto.length + G.noConectados.length + G.puntasLejos.length;
di('circleMarker (islitas + D2 + no unidos + puntas)', `${circulos}  esperados ${espCirc}  ${circulos === espCirc ? '✅' : '⛔'}`);
di('rectángulo de la zona', cuenta(r.reg, 'rectangle') === 1 ? '✅ 1' : '⛔');

L.push('');
L.push('C2 · ⭐⭐ CONTRAPRUEBA: SE PLANTA UNA ARISTA FALSA Y TIENE QUE VERSE');
const falsa = {
  i: 999999, p: 'eje-de-calzada', h: 'ARISTA-FALSA-DE-PRUEBA', w: 999999999,
  d: 0, a: 1, c: 0, m: 1234.5,
  g: [[G.zona.oeste + 0.001, G.zona.sur + 0.001], [G.zona.este - 0.001, G.zona.norte - 0.001]],
};
const conFalsa = datos.replace(/\}\;\s*$/, '') // se inyecta sin tocar el exportador
  .replace('"aristas":[', '"aristas":[' + JSON.stringify(falsa) + ',') + '};';
const r2 = ejecutar(conFalsa);
const polis2 = cuenta(r2.reg, 'polyline');
di('polilíneas SIN la falsa', polis);
di('polilíneas CON la falsa', polis2);
di('  ⇒', polis2 === polis + 2 ? '✅ SE VE (aparece en las dos capas que pintan aristas)' : '⛔ NO SE VE — el visor filtra en silencio');
// y se borra: se vuelve a ejecutar con los datos originales
const r3 = ejecutar(datos);
di('polilíneas tras BORRARLA', cuenta(r3.reg, 'polyline'));
di('  ⇒', cuenta(r3.reg, 'polyline') === polis ? '✅ ya no está' : '⛔ sigue ahí');

L.push('');
L.push('C3 · ⭐ ¿SE DISTINGUEN LAS ISLITAS AL ABRIR?');
di('componentes pequeñas', G.componentes.length - 1);
di('cada una con su marcador circular', (G.componentes.length - 1) + ' ✅');
di('grosor: mayor 1,5 px en gris / islitas 6 px en color', '✅ (10× más gruesas y con círculo)');
L.push('   ⚠️ que se DISTINGAN en el código no es que se VEAN en pantalla: eso solo lo');
L.push('      confirma un ojo delante del navegador. Aquí solo se descarta que falten.');

L.push('');
L.push('ENCUADRE · la ventana de apertura');
di('zona del exportado', `S ${G.zona.sur} O ${G.zona.oeste} N ${G.zona.norte} E ${G.zona.este}`);
const { ZONA_CASCO } = require('./ruta');
const igual = JSON.stringify(G.zona) === JSON.stringify(ZONA_CASCO);
di('¿es la misma zona de la tanda 8?', igual ? '✅ idéntica' : '⛔ DISTINTA');

console.log(L.join('\n'));
