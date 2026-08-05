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
    rojas: l.filter((x) => x.color === V.ROJO).length,
    grises: l.filter((x) => x.color === V.GRIS).length,
    verdes: l.filter((x) => x.color === V.VERDE).length, total: l.length };
}

// ── el cuadre ────────────────────────────────────────────────────────────────
log('');
log('   ⭐ EL CUADRE — lo pintado contra lo calculado');
log('   ' + ''.padEnd(24) + 'visor'.padStart(10) + 'arnés'.padStart(10) + 'dato'.padStart(10));
{
  const a = arnes(r.reg, V);
  const filas = [
    ['AZULES · con nombre', V.cuenta.azules, a.azules, G.contadores.conNombre],
    ['ROJAS  · le falta', V.cuenta.rojas, a.rojas, G.contadores.sinNombre],
    ['⭐ VERDES · en zona verde', V.cuenta.verdes, a.verdes, G.contadores.enVerde],
    ['GRISES · no aplica', V.cuenta.grises, a.grises, G.contadores.noAplica],
  ];
  for (const [k, v, ar, d] of filas) {
    const ok = v === d && ar === d;
    log('   ' + k.padEnd(24) + String(v).padStart(10) + String(ar).padStart(10)
      + String(d).padStart(10) + '   ' + (ok ? '✅' : '⛔'));
    A.exige(v === d, `${k}: el visor dice ${v} y el dato tiene ${d}`);
    A.exige(ar === d, `${k}: el arnés cuenta ${ar} y el dato tiene ${d}`);
  }
  const suma = V.cuenta.azules + V.cuenta.rojas + V.cuenta.grises + V.cuenta.verdes;
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
  const fil = (k, x) => log('   ' + k.padEnd(34) + String(x.azules).padStart(10)
    + String(x.rojas).padStart(10) + String(x.verdes).padStart(10) + String(x.grises).padStart(10));
  log('   ' + 'dato'.padEnd(34) + 'azules'.padStart(10) + 'rojas'.padStart(10)
    + 'verdes'.padStart(10) + 'grises'.padStart(10));
  fil('real', antes);
  fil('real + 1 línea ROJA inventada', aCon);
  fil('real otra vez (la falsa quitada)', aFin);
  log('');
  const seVe = aCon.rojas === antes.rojas + 1 && aCon.azules === antes.azules && aCon.verdes === antes.verdes;
  const vuelve = aFin.rojas === antes.rojas && aFin.azules === antes.azules && aFin.verdes === antes.verdes;
  di('⭐ la línea falsa SE VE, y en SU color', seVe ? '✅ +1 roja, las azules igual' : '⛔ NO aparece');
  di('⭐ al quitarla DESAPARECE', vuelve ? '✅ vuelve al número de antes' : '⛔ NO vuelve');
  A.exige(seVe, 'la línea falsa no aparece en el mapa: el visor se traga líneas en silencio');
  A.exige(vuelve, 'al quitar la línea falsa el mapa no vuelve a su cuenta anterior');

  // ⭐ y las de control: cada categoría tiene que ir a SU montón y solo al suyo
  const control = (n, etq, campo) => {
    const c2 = JSON.parse(JSON.stringify(base));
    c2.aristas.push({ ...falsa, n });
    c2.contadores.total++; c2.contadores[campo]++;
    const x = arnes(ejecutar('window.SIMPLE = ' + JSON.stringify(c2) + ';').reg, V);
    const ok = x.azules === antes.azules + (n === 1 ? 1 : 0)
      && x.rojas === antes.rojas + (n === 0 ? 1 : 0)
      && x.grises === antes.grises + (n === 2 ? 1 : 0)
      && x.verdes === antes.verdes + (n === 3 ? 1 : 0);
    di('⭐ una falsa ' + etq, ok ? '✅ +1 en su montón, los otros tres igual' : '⛔ las cuatro categorías no separan');
    A.exige(ok, `una línea ${etq} no va a su montón: las cuatro categorías no separan`);
  };
  control(1, 'CON nombre → azul', 'conNombre');
  control(2, 'de PASO DE PEATONES → gris', 'noAplica');
  control(3, 'DENTRO DE ZONA VERDE → verde', 'enVerde');
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ LA COMPROBACIÓN QUE FALTABA: **CONTRA EL MOTOR, NO CONTRA EL FICHERO**
// ═════════════════════════════════════════════════════════════════════════════
//   Lo de arriba tenía tres contadores —visor, arnés, dato— y los tres decían
//   44.842. **Los tres leían la misma fuente, y la fuente estaba mal**: el mapa
//   contaba el nombre por ARISTA y el motor lo cuenta por WAY (bitácora nº107).
//   ⇒ *Tres contadores de la misma fuente no son tres testigos.*
//
//   Aquí se le pregunta a `relato.js` —**el redactor de verdad, el que imprime el
//   texto de las rutas**— qué nombre le pone a cada línea del grafo, y se compara
//   con el color. Si alguna vez vuelven a divergir, esto se pone rojo.
log('');
log('='.repeat(88));
log('CONTRA EL MOTOR — ¿pinta el mapa lo que el redactor dice de cada línea?');
log('='.repeat(88));
{
  const D = require('./direccion');
  const Mo = require('./modelo');
  const Rel = require('./relato');
  const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
  const gr = construir(ZONA_TERMINO);
  const ctx = D.abrir(gr, CRUDO);
  const { M, deWay, modeloDeWay } = Mo.construirModelo(gr, ctx.enganche.portales.filter((o) => o.enganchado));
  const nombreDeWay = (id) => gr.nombres.get(id) || null;

  /** ⭐ Lo que el REDACTOR dice de esta línea. Pasa por `relato.js`, no por el dato. */
  //   ⛔ Y la CATEGORÍA tampoco se decide aquí: se le pide al exportador la misma
  //     función que usó para pintar (ley 56 — no copies la regla, llama a la
  //     función). Si esto reimplementara «0/1/2», serían dos caminos otra vez.
  const { CATEGORIA } = require('./exportar-nombre-simple');
  const segunElMotor = (e) =>
    CATEGORIA(Rel.tramoDeArista(e, nombreDeWay, modeloDeWay));

  // ⭐⭐ TANDA 28 · EL VERDE SE COLAPSA A ROJO ANTES DE COMPARAR, y ésa es la
  //    comprobación que hace que la cuarta categoría no pueda esconder nada:
  //    para el MOTOR el verde no existe —esas líneas siguen sin nombre—, así que
  //    si el mapa pintara de verde algo que el motor llama azul o gris, aquí
  //    saltaría. **El verde solo puede ser una roja explicada.**
  const sinVerde = (n) => (n === 3 ? 0 : n);

  const NOMBRE = { 0: 'ROJA (le falta)', 1: 'AZUL (con nombre)', 2: 'GRIS (no aplica)' };
  const comparar = (colorDe) => {
    let mal = 0; const ej = [];
    for (let i = 0; i < gr.aristas.length; i++) {
      const pintado = colorDe(i), dice = segunElMotor(gr.aristas[i]);
      if (pintado !== dice) { mal++; if (ej.length < 4) ej.push([i, pintado, dice]); }
    }
    return { mal, ej };
  };

  di('aristas del grafo', gr.aristas.length);
  const r1 = comparar((i) => sinVerde(G.aristas[i].n));
  di('⭐ líneas donde el color y el redactor NO coinciden', r1.mal + (r1.mal === 0 ? '   ✅' : '   ⛔'));
  for (const [i, p, d] of r1.ej) {
    log('      ⛔ arista ' + i + ': el mapa la pinta ' + NOMBRE[p] + ' y el redactor dice ' + NOMBRE[d]);
  }
  A.exige(r1.mal === 0, `${r1.mal} líneas pintadas de un color que el redactor contradice`);

  // ⭐⭐ Y SU ROJO, VISTO: las reglas VIEJAS tienen que fallar. Si no fallaran, esta
  //    comprobación no distinguiría nada y valdría lo mismo que los tres contadores
  //    que dejaron pasar el fallo nº107.
  log('');
  log('   ⭐⭐ EL ROJO DE ESTA COMPROBACIÓN, VISTO — dos veces, con las dos reglas viejas:');
  const r2 = comparar((i) => ((M[i].via && M[i].via.nombre) ? 1 : 0));
  di('   (a) el nombre por ARISTA (lo de antes de la tanda 24)', r2.mal + (r2.mal > 0 ? '   ✅ la caza' : '   ⛔ NO LA CAZA'));
  A.exige(r2.mal > 0, 'la comprobación contra el motor no distingue la regla por arista: no vale');
  // ⭐ y la de HOY: dos categorías en vez de tres — todo lo gris pintado de rojo
  const r3 = comparar((i) => (G.aristas[i].n === 2 ? 0 : sinVerde(G.aristas[i].n)));
  di('   ⭐ (b) DOS categorías, con los pasos metidos en el rojo (la tanda 25)',
    r3.mal + (r3.mal > 0 ? '   ✅ la caza' : '   ⛔ NO LA CAZA'));
  A.exige(r3.mal > 0, 'la comprobación no distingue dos categorías de tres: el gris no está probado');
  log('   ⇒ ⭐ **habría cazado los dos fallos el día que se escribió.**');

  // ⭐⭐ Y EL ROJO DEL COLAPSO, VISTO: si NO se colapsara el verde, la comparación
  //    tendría que ponerse roja. Si no se pusiera, es que no hay ni un verde y la
  //    comprobación de arriba estaría pasando por vacío.
  log('');
  const r4 = comparar((i) => G.aristas[i].n);          // ⛔ sin colapsar
  di('⭐ sin colapsar el verde, ¿discrepa?', r4.mal + (r4.mal > 0 ? '   ✅ sí — hay verdes y se distinguen' : '   ⛔ NO — o no hay ni un verde, o la comprobación no mira'));
  A.exige(r4.mal > 0, 'sin colapsar el verde no hay discrepancias: no hay ni una línea verde, o la comparación no distingue');
  di('   …y coincide con los verdes del dato', `${r4.mal} / ${G.contadores.enVerde}   ${r4.mal === G.contadores.enVerde ? '✅' : '⛔'}`);
  A.exige(r4.mal === G.contadores.enVerde,
    'las discrepancias sin colapsar no son exactamente los verdes: el verde se está llevando algo más');
}

log('');
log('   ⚠️ Lo que esto NO comprueba: que se vea bien (colores, grosores, rendimiento con');
log('      ~99.000 líneas) ni que el NOMBRE sea correcto. Solo que el mapa y el motor dicen');
log('      lo mismo de cada línea. Si los dos se equivocan igual, esto sale verde.');
log('');
log(A.cierre('MAPA DE DOS COLORES'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
