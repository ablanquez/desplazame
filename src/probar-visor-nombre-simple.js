// ⭐ TANDA 22 · LAS COMPROBACIONES DEL MAPA DE DOS COLORES, antes de enseñarlo.
//
//   node src/probar-visor-nombre-simple.js
//
// ⚠️ NO tengo navegador aquí. Se EJECUTA el script del HTML en Node contra un
//    Leaflet simulado que cuenta lo que se pinta. Eso descarta que reviente y que
//    se pierda algo por el camino; **no** descarta un fallo de pintado real (CSS,
//    tiles, rendimiento). Eso solo lo ve un ojo delante del navegador.
//
// ⭐ DOS CONTADORES INDEPENDIENTES, que es lo que hace que esto pruebe algo:
//    (1) el que el visor publica de sí mismo (`CUENTA`);
//    (2) el del ARNÉS, que mira el COLOR con el que se creó cada polilínea y no
//        pasa por el visor.
//    Comprobar solo (1) probaría que el visor sabe contar, no que pinte.

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const A = require('./alarma');

const HTML = path.join(__dirname, '..', 'tools', 'visor-nombre-simple.html');
const DATOS = path.join(__dirname, '..', 'tools', 'nombre-simple-visor.js');

/** Leaflet simulado: no dibuja, apunta el color de cada línea. */
function leafletFalso(reg) {
  const capa = (tipo) => (...args) => {
    const o = { _tipo: tipo, _args: args,
      addTo() { reg.push({ tipo, color: (args[1] || {}).color }); return o; },
      bindPopup() { return o; }, setStyle() { return o; } };
    return o;
  };
  const L = {
    tileLayer: capa('tile'), polyline: capa('polyline'), rectangle: capa('rectangle'),
    circleMarker: capa('circleMarker'), marker: capa('marker'),
    layerGroup: () => { const g = { _grupo: true, addTo() { return g; } }; return g; },
    DomUtil: { create: () => ({ innerHTML: '' }) },
    DomEvent: { disableClickPropagation: () => {} },
  };
  L._m = { fitBounds: () => L._m, on: () => L._m, removeLayer: () => L._m };
  L.map = () => L._m;
  L.control = () => { const c = { onAdd: null, addTo() { if (c.onAdd) c.onAdd(); return c; } }; return c; };
  L.control.layers = () => ({ addTo: () => {} });
  return L;
}

function ejecutar(datosJs) {
  const html = fs.readFileSync(HTML, 'utf8');
  const bloques = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const codigo = bloques[bloques.length - 1];
  const reg = [];
  const ctx = { window: {}, document: { body: {} }, console: { log: () => {} } };
  ctx.L = leafletFalso(reg);
  vm.createContext(ctx);
  vm.runInContext(datosJs, ctx);
  vm.runInContext(codigo, ctx);
  return { reg, G: ctx.window.SIMPLE, V: ctx.window.VISOR };
}

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(48)} ${v}`);
const T0 = Date.now();

log('='.repeat(88));
log('EL MAPA DE DOS COLORES — comprobado sin navegador');
log('='.repeat(88));
if (!fs.existsSync(DATOS)) {
  A.fallo('no existe tools/nombre-simple-visor.js — genéralo con `node src/exportar-nombre-simple.js`');
  process.exit(1);
}
const datos = fs.readFileSync(DATOS, 'utf8');
di('tamaño del dato', (Buffer.byteLength(datos) / 1048576).toFixed(2) + ' MB');
let r;
try {
  r = ejecutar(datos);
  log('   ✅ el script del visor se ejecuta sin lanzar con los datos reales');
} catch (e) {
  A.fallo('EL VISOR REVIENTA: ' + e.message);
  process.exit(1);
}
const G = r.G, V = r.V;
if (!V) { A.fallo('el visor no expone window.VISOR'); process.exit(1); }

/** Cuenta las polilíneas por color, sin pasar por el visor. */
function arnes(reg, V) {
  const l = reg.filter((x) => x.tipo === 'polyline');
  return { azules: l.filter((x) => x.color === V.AZUL).length,
    rojas: l.filter((x) => x.color === V.ROJO).length, total: l.length };
}

// ── el cuadre ────────────────────────────────────────────────────────────────
log('');
log('   ⭐ EL CUADRE — lo pintado contra lo calculado');
log('   ' + ''.padEnd(24) + 'visor'.padStart(10) + 'arnés'.padStart(10) + 'dato'.padStart(10));
{
  const a = arnes(r.reg, V);
  const filas = [
    ['AZULES · con nombre', V.cuenta.azules, a.azules, G.contadores.conNombre],
    ['ROJAS  · sin nombre', V.cuenta.rojas, a.rojas, G.contadores.sinNombre],
  ];
  for (const [k, v, ar, d] of filas) {
    const ok = v === d && ar === d;
    log('   ' + k.padEnd(24) + String(v).padStart(10) + String(ar).padStart(10)
      + String(d).padStart(10) + '   ' + (ok ? '✅' : '⛔'));
    A.exige(v === d, `${k}: el visor dice ${v} y el dato tiene ${d}`);
    A.exige(ar === d, `${k}: el arnés cuenta ${ar} y el dato tiene ${d}`);
  }
  const suma = V.cuenta.azules + V.cuenta.rojas;
  di('⭐ suman', `${suma} de ${G.contadores.total}   ${suma === G.contadores.total ? '✅ ninguna sin pintar' : '⛔ FALTAN'}`);
  A.exige(suma === G.contadores.total, `se pintan ${suma} líneas y el grafo tiene ${G.contadores.total}`);
  A.exige(a.total === G.contadores.total, `el arnés cuenta ${a.total} polilíneas y el grafo tiene ${G.contadores.total}`);
}

// ── la línea falsa ───────────────────────────────────────────────────────────
log('');
log('   ⭐⭐ LA LÍNEA FALSA — se mete, se ve; se quita, desaparece.');
log('      ⭐ Y de paso es lo único que hace fiable al arnés: un contador que no ha');
log('        dicho nunca «hay uno más» no ha dicho nada (ley 52).');
{
  const base = JSON.parse(datos.replace(/^window\.SIMPLE = /, '').replace(/;\s*$/, ''));
  const antes = arnes(r.reg, V);

  const falsa = { g: [[-0.8800, 41.6550], [-0.8790, 41.6555]], n: 0 };   // roja
  const con = JSON.parse(JSON.stringify(base));
  con.aristas.push(falsa);
  con.contadores.total++; con.contadores.sinNombre++;
  const r2 = ejecutar('window.SIMPLE = ' + JSON.stringify(con) + ';');
  const aCon = arnes(r2.reg, r2.V);

  const r3 = ejecutar(datos);
  const aFin = arnes(r3.reg, r3.V);

  log('');
  log('   ' + 'dato'.padEnd(34) + 'azules'.padStart(10) + 'rojas'.padStart(10));
  log('   ' + 'real'.padEnd(34) + String(antes.azules).padStart(10) + String(antes.rojas).padStart(10));
  log('   ' + 'real + 1 línea ROJA inventada'.padEnd(34) + String(aCon.azules).padStart(10) + String(aCon.rojas).padStart(10));
  log('   ' + 'real otra vez (la falsa quitada)'.padEnd(34) + String(aFin.azules).padStart(10) + String(aFin.rojas).padStart(10));
  log('');
  const seVe = aCon.rojas === antes.rojas + 1 && aCon.azules === antes.azules;
  const vuelve = aFin.rojas === antes.rojas && aFin.azules === antes.azules;
  di('⭐ la línea falsa SE VE, y en SU color', seVe ? '✅ +1 roja, las azules igual' : '⛔ NO aparece');
  di('⭐ al quitarla DESAPARECE', vuelve ? '✅ vuelve al número de antes' : '⛔ NO vuelve');
  A.exige(seVe, 'la línea falsa no aparece en el mapa: el visor se traga líneas en silencio');
  A.exige(vuelve, 'al quitar la línea falsa el mapa no vuelve a su cuenta anterior');

  // ⭐ y la de control: una falsa AZUL tiene que ir al otro montón
  const con2 = JSON.parse(JSON.stringify(base));
  con2.aristas.push({ ...falsa, n: 1 });
  con2.contadores.total++; con2.contadores.conNombre++;
  const r4 = ejecutar('window.SIMPLE = ' + JSON.stringify(con2) + ';');
  const aAz = arnes(r4.reg, r4.V);
  di('⭐ una falsa CON nombre va al montón azul', aAz.azules === antes.azules + 1 && aAz.rojas === antes.rojas
    ? '✅ +1 azul, las rojas igual' : '⛔ los dos colores no separan');
  A.exige(aAz.azules === antes.azules + 1 && aAz.rojas === antes.rojas,
    'una línea con nombre no se pinta de azul: los dos colores no separan');
}

log('');
log('   ⚠️ Lo que esto NO comprueba: que se vea bien (colores, grosores, rendimiento con');
log('      ~99.000 líneas) ni que la clasificación sea correcta. Solo que el mapa pinta lo');
log('      que el modelo dice, y en el color que le toca.');
log('');
log(A.cierre('MAPA DE DOS COLORES'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
