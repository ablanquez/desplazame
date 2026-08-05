// ⭐⭐ TANDA 20 · C7 · LAS COMPROBACIONES DEL VISOR DE NOMBRES, antes de que nadie mire.
//
//   node src/probar-visor-nombres.js
//
// ⚠️ NO tengo navegador aquí. En vez de afirmar «carga bien», se EJECUTA el script
//    del HTML en Node contra un Leaflet simulado que CUENTA lo que se pinta.
//    Eso descarta errores de ejecución y pérdidas por el camino. Lo que NO puede
//    descartar es un fallo de pintado real (CSS, orden de capas, tiles,
//    rendimiento): eso solo lo ve un ojo delante del navegador, y se dice.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ UN ARNÉS DE PRUEBA ES UN INSTRUMENTO Y MIENTE IGUAL (ley 52)
// ═════════════════════════════════════════════════════════════════════════════
//   El visor devuelve sus propias cuentas (`CUENTA`, rellenado por `apunta()`).
//   ⚠️ **Comprobar `CUENTA` contra el dato NO prueba que el visor pinte**: prueba
//   que el visor sabe contar. Si `apunta()` mintiera —o si una capa contara y no
//   pintara— saldría verde igual.
//
//   ⇒ POR ESO HAY DOS CONTADORES INDEPENDIENTES:
//     (1) el del visor, `CUENTA.pintadas`;
//     (2) ⭐ el del ARNÉS: el Leaflet falso apunta cada objeto que alguien crea Y
//         mete en una capa. No pasa por `apunta()` ni lo conoce.
//     Si los dos coinciden y coinciden con el dato, el visor pinta lo que dice.
//
//   ⚠️ Y al arnés se le enseña su rojo antes de fiarse de él: se le da un dato con
//     una línea FALSA metida y tiene que contar una más; se le quita y tiene que
//     volver. Un contador que no ha dicho nunca «hay uno más» no ha dicho nada.

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const A = require('./alarma');

const HTML = path.join(__dirname, '..', 'tools', 'visor-nombres.html');
const DATOS = path.join(__dirname, '..', 'tools', 'nombres-visor.js');

/** Leaflet simulado: no dibuja, CUENTA. ⭐ Es el contador independiente. */
function leafletFalso(reg) {
  const capa = (tipo) => (...args) => {
    const o = {
      _tipo: tipo, _args: args, _popup: null,
      addTo(d) { (d._items || (d._items = [])).push(o); reg.push({ tipo, popup: o._popup }); return o; },
      bindPopup(h) { o._popup = h; return o; },
      setStyle() { return o; },
    };
    return o;
  };
  const grupo = () => {
    const g = { _nombre: 'grupo', _items: [], addTo() { return g; } };
    return g;
  };
  const L = {
    tileLayer: capa('tile'), polyline: capa('polyline'), rectangle: capa('rectangle'),
    circleMarker: capa('circleMarker'), marker: capa('marker'), layerGroup: grupo,
    DomUtil: { create: () => ({ innerHTML: '', querySelector: () => null }) },
    DomEvent: { disableClickPropagation: () => {} },
  };
  L._m = { _nombre: 'mapa', fitBounds: () => L._m, on: () => L._m, removeLayer: () => L._m };
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
  const ctx = { window: {}, document: { body: {}, getElementById: () => ({}), querySelector: () => null },
    console: { log: () => {} } };
  ctx.L = leafletFalso(reg);
  vm.createContext(ctx);
  vm.runInContext(datosJs, ctx);
  vm.runInContext(codigo, ctx);
  return { reg, G: ctx.window.NOMBRES, V: ctx.window.VISOR };
}

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(50)} ${v}`);
const T0 = Date.now();

log('='.repeat(96));
log('C0 · ¿EJECUTA EL VISOR CON EL FICHERO REAL?');
log('='.repeat(96));
if (!fs.existsSync(DATOS)) {
  A.fallo('no existe tools/nombres-visor.js — genéralo con `node src/exportar-nombres.js`');
  process.exit(1);
}
const datos = fs.readFileSync(DATOS, 'utf8');
di('tamaño de tools/nombres-visor.js', (Buffer.byteLength(datos) / 1048576).toFixed(2) + ' MB');
let r;
try {
  r = ejecutar(datos);
  log('   ✅ el script del visor se ejecuta sin lanzar con los datos reales');
} catch (e) {
  A.fallo('EL VISOR REVIENTA: ' + e.message);
  process.exit(1);
}
const G = r.G, V = r.V;
if (!V) { A.fallo('el visor no expone window.VISOR: no se puede comprobar'); process.exit(1); }

/**
 * Pinta UNA capa con la ciudad entera y devuelve las dos cuentas.
 * ⚠️ EL ORDEN IMPORTA Y COSTÓ UN ROJO: `setZona()` YA PINTA (repinta las capas
 *    activas). Si el contador del arnés se pone a cero antes de esa llamada, se
 *    come lo que pinta ella y acusa al visor de duplicar. **El cero va justo antes
 *    de la única pintada que se quiere medir.** (bitácora nº98)
 */
function medir(V, reg, capa) {
  V.setZona(0);
  reg.length = 0;
  const c = V.pintar([capa]);
  const arnes = reg.filter((x) => x.tipo === 'polyline' || x.tipo === 'circleMarker' || x.tipo === 'rectangle').length;
  return { visor: c[capa] ? c[capa].pintadas : null, total: c[capa] ? c[capa].total : null, arnes };
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('C1 · ⭐⭐ EL CUADRE — lo pintado contra lo calculado, LAS TRES CATEGORÍAS');
log('='.repeat(96));
log('   ⭐ Tres columnas y no dos: «visor» es lo que el visor dice de sí mismo; «arnés» lo');
log('      cuenta el Leaflet falso sin pasar por él. Si divergen, el visor cuenta y no pinta.');
log('');
log('   ' + 'capa'.padEnd(30) + 'visor'.padStart(10) + 'arnés'.padStart(10)
  + 'dato'.padStart(10) + '  veredicto');
const ESPERADO = {
  'con-nombre': G.contadores.cuentas['con-nombre'].aristas,
  'sin-nombre-con-portales': G.contadores.cuentas['sin-nombre-con-portales'].aristas,
  'sin-nombre-sin-portales': G.contadores.cuentas['sin-nombre-sin-portales'].aristas,
  'portales': G.contadores.portalesSinCalle,
  'zonas': G.zonas.length,
};
for (const capa of V.capas) {
  const m = medir(V, r.reg, capa);
  const esp = ESPERADO[capa];
  const ok = m.visor === esp && m.arnes === esp;
  log('   ' + capa.padEnd(30) + String(m.visor).padStart(10) + String(m.arnes).padStart(10)
    + String(esp).padStart(10) + '  ' + (ok ? '✅' : '⛔'));
  A.exige(m.visor === esp, `la capa ${capa} dice pintar ${m.visor} y el dato tiene ${esp}`);
  A.exige(m.arnes === esp, `la capa ${capa}: el arnés cuenta ${m.arnes} objetos y el dato tiene ${esp}`);
}
{
  const suma = ['con-nombre', 'sin-nombre-con-portales', 'sin-nombre-sin-portales']
    .reduce((s, k) => s + ESPERADO[k], 0);
  di('⭐ las tres categorías suman', `${suma} de ${G.contadores.aristas} aristas`
    + (suma === G.contadores.aristas ? '   ✅ ninguna se queda sin pintar' : '   ⛔ FALTAN'));
  A.exige(suma === G.contadores.aristas, 'las tres categorías no suman las aristas del grafo');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('C2 · ⭐⭐ LA CONTRAPRUEBA DE LA LÍNEA FALSA — y con ella, EL ROJO DEL ARNÉS');
log('='.repeat(96));
log('   Se mete una línea inventada en el dato, se comprueba que APARECE, se quita y se');
log('   comprueba que DESAPARECE. ⭐ Y de paso es lo que hace fiable al arnés: un contador');
log('   que no ha dicho nunca «hay uno más» no ha dicho nada (ley 52).');
{
  const base = JSON.parse(datos.replace(/^window\.NOMBRES = /, '').replace(/;\s*$/, ''));
  const antes = medir(V, r.reg, 'sin-nombre-con-portales');

  // ⚠️ la línea falsa se pone DENTRO del casco, para que además pase el filtro de zona
  const falsa = { i: 999999, g: [[-0.8800, 41.6550], [-0.8790, 41.6555]], k: 1, m: 99.9,
    p: 7, t: 0, c: 0, w: 999999, v: [[0, 7]], d: [-1, 0, 0] };
  const conFalsa = JSON.parse(JSON.stringify(base));
  conFalsa.aristas.push(falsa);
  conFalsa.contadores.cuentas['sin-nombre-con-portales'].aristas++;
  const r2 = ejecutar('window.NOMBRES = ' + JSON.stringify(conFalsa) + ';');
  const con = medir(r2.V, r2.reg, 'sin-nombre-con-portales');

  const r3 = ejecutar(datos);
  const quitada = medir(r3.V, r3.reg, 'sin-nombre-con-portales');

  log('');
  log('   ' + 'dato'.padEnd(34) + 'visor'.padStart(10) + 'arnés'.padStart(10));
  log('   ' + 'real'.padEnd(34) + String(antes.visor).padStart(10) + String(antes.arnes).padStart(10));
  log('   ' + 'real + 1 línea INVENTADA'.padEnd(34) + String(con.visor).padStart(10) + String(con.arnes).padStart(10));
  log('   ' + 'real otra vez (la falsa quitada)'.padEnd(34) + String(quitada.visor).padStart(10) + String(quitada.arnes).padStart(10));
  log('');
  di('⭐ la línea falsa SE VE', (con.arnes === antes.arnes + 1 && con.visor === antes.visor + 1)
    ? '✅ +1 en los dos contadores' : '⛔ NO aparece: el visor se traga líneas');
  di('⭐ al quitarla DESAPARECE', (quitada.arnes === antes.arnes && quitada.visor === antes.visor)
    ? '✅ vuelve al número de antes' : '⛔ NO vuelve: el visor pinta cosas que no están');
  A.exige(con.arnes === antes.arnes + 1 && con.visor === antes.visor + 1,
    'la línea falsa no aparece en el mapa: el visor se traga líneas en silencio');
  A.exige(quitada.arnes === antes.arnes && quitada.visor === antes.visor,
    'al quitar la línea falsa el mapa no vuelve a su cuenta anterior');

  // ⭐ y la contraprueba de la contraprueba: una línea falsa de OTRA categoría NO
  //    puede aparecer en la capa de las que duelen. Si apareciera, el color miente.
  const otra = JSON.parse(JSON.stringify(base));
  otra.aristas.push({ ...falsa, i: 999998, k: 0, n: 0, f: 0 });
  otra.contadores.cuentas['con-nombre'].aristas++;
  const r4 = ejecutar('window.NOMBRES = ' + JSON.stringify(otra) + ';');
  const cruz = medir(r4.V, r4.reg, 'sin-nombre-con-portales');
  di('⭐ una línea falsa CON NOMBRE no se cuela en la capa roja', cruz.arnes === antes.arnes
    ? '✅ sigue en ' + cruz.arnes : '⛔ SE HA COLADO: las categorías no separan');
  A.exige(cruz.arnes === antes.arnes, 'una arista con nombre aparece en la capa de las que duelen: el color miente');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('C3 · ⭐ EL RECORTE POR ZONA — que no recorte en silencio');
log('='.repeat(96));
{
  r.reg.length = 0;
  const todo = V.setZona(0)['sin-nombre-con-portales'];
  r.reg.length = 0;
  const casco = V.setZona(1)['sin-nombre-con-portales'];
  const arnesCasco = r.reg.filter((x) => x.tipo === 'polyline').length;
  V.setZona(0);
  log('');
  di('toda la ciudad · pintadas de total', `${todo.pintadas} de ${todo.total}`);
  di('solo el casco · pintadas de total', `${casco.pintadas} de ${casco.total}`);
  di('   …y el arnés cuenta', arnesCasco + (arnesCasco === casco.pintadas ? '   ✅' : '   ⛔'));
  di('⭐ el total NO cambia al recortar', todo.total === casco.total
    ? '✅ el panel sigue diciendo de cuánto' : '⛔ el recorte esconde el denominador');
  A.exige(arnesCasco === casco.pintadas, 'al recortar por zona el arnés y el visor no coinciden');
  A.exige(todo.total === casco.total, 'el recorte por zona cambia el denominador: el visor filtraría en silencio');
  A.exige(casco.pintadas < todo.pintadas, 'el recorte por zona no recorta nada');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('C4 · ⛔ EL GLOBO — ¿dice que el nombre deducido NO está aplicado?');
log('='.repeat(96));
log('   ⚠️ Es lo único que impide que un nombre informativo se lea como un nombre puesto.');
{
  const conD = G.aristas.find((a) => a.d && a.d[0] >= 0);
  const sinD = G.aristas.find((a) => a.d && a.d[0] < 0);
  const conN = G.aristas.find((a) => a.k === 0);
  const gD = conD ? V.globo(conD) : '';
  const gN = conN ? V.globo(conN) : '';
  log('');
  di('hay alguna arista con nombre deducido', conD ? '✅ arista ' + conD.i : '⛔ ninguna');
  di('⭐ su globo lleva el aviso «NO está aplicado»', /NO está aplicado/.test(gD) ? '✅' : '⛔ FALTA EL AVISO');
  di('   …y lleva el nombre que saldría', gD.includes(G.textos[conD.d[0]]) ? '✅ «' + G.textos[conD.d[0]] + '»' : '⛔');
  di('   …y dice cuántos portales lo apoyan', /portales de acuerdo/.test(gD) ? '✅' : '⛔');
  di('una arista SIN votos bastantes lo dice', sinD && /NO se podría deducir/.test(V.globo(sinD)) ? '✅' : '⛔');
  di('una arista CON nombre enseña su nombre y su fuente', /lo dice/.test(gN) && gN.includes(G.textos[conN.n]) ? '✅' : '⛔');
  A.exige(!!conD, 'ninguna arista trae nombre deducido: el globo de C4 no se puede comprobar');
  A.exige(/NO está aplicado/.test(gD), 'el globo del nombre deducido NO avisa de que no está aplicado');
  A.exige(gD.includes(G.textos[conD.d[0]]), 'el globo no enseña el nombre deducido');
  A.exige(!!sinD && /NO se podría deducir/.test(V.globo(sinD)), 'el globo no distingue una arista sin votos bastantes');
  A.exige(/lo dice/.test(gN) && gN.includes(G.textos[conN.n]), 'el globo de una arista con nombre no enseña su nombre');

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️⚠️ TANDA 31 · LA MISMA FORMA DEL nº105, ENCONTRADA BUSCÁNDOLA A PROPÓSITO
  // ═══════════════════════════════════════════════════════════════════════════
  //   Todo lo de arriba mira **UNA arista de muestra** y comprueba que su globo
  //   CONTIENE una frase. Eso es exactamente la forma que la tanda 29 destapó en
  //   `probar-modelo-obligatorio.js` §2: *la comprobación busca algo que otra
  //   fuente aporta por su cuenta*. Medido sobre las tres familias enteras:
  //
  //       «NO está aplicado»      1.292 de 1.292 deducidas   ✅
  //                               2.575 de 2.575 SIN VOTOS   ⛔⛔  ← no distingue
  //                                   0 de 41.930 con nombre  ✅
  //
  //   ⇒ **`«NO está aplicado»` no separa «deducida» de «sin votos»: lo lleva
  //     cualquier arista sin nombre.** La línea de arriba se lee como si probara
  //     que el globo distingue el nombre deducido, y lo único que prueba es que
  //     distingue «tiene nombre» de «no lo tiene».
  //   ⛔ La línea vieja NO se borra: sigue siendo cierta, y quitarla dejaría este
  //     fichero pareciendo que siempre supo lo que estaba comprobando.
  //   ⭐ Lo que se añade es la pareja que SÍ separa, sobre las familias enteras y
  //     no sobre una muestra: `«NO se podría deducir»` tiene que salir en TODAS
  //     las sin votos y en NINGUNA deducida.
  {
    const fam = (f) => G.aristas.filter(f);
    const dedu = fam((a) => a.d && a.d[0] >= 0);
    const sinV = fam((a) => a.d && a.d[0] < 0);
    const conNom = fam((a) => a.k === 0);
    const cuenta = (l, rx) => l.filter((a) => rx.test(V.globo(a))).length;
    const apl = [cuenta(dedu, /NO está aplicado/), cuenta(sinV, /NO está aplicado/), cuenta(conNom, /NO está aplicado/)];
    const pod = [cuenta(dedu, /NO se podría deducir/), cuenta(sinV, /NO se podría deducir/)];
    log('');
    log('   ⚠️⚠️ ¿DISTINGUE DE VERDAD, O LO DICE DE TODAS? — medido sobre las familias enteras');
    log('   ' + 'frase del globo'.padEnd(26) + 'deducidas'.padStart(12) + 'sin votos'.padStart(12) + 'con nombre'.padStart(13));
    log('   ' + '«NO está aplicado»'.padEnd(26) + `${apl[0]}/${dedu.length}`.padStart(12)
      + `${apl[1]}/${sinV.length}`.padStart(12) + `${apl[2]}/${conNom.length}`.padStart(13));
    log('   ' + '⭐ «NO se podría deducir»'.padEnd(27) + `${pod[0]}/${dedu.length}`.padStart(12)
      + `${pod[1]}/${sinV.length}`.padStart(12) + '—'.padStart(13));
    log('   ⛔ «NO está aplicado» NO separa deducida de sin-votos: lo lleva cualquiera sin nombre.');
    log('     Se deja dicho, porque la comprobación de arriba se lee como si lo separara.');
    // ⭐ y ésta SÍ es una pareja discriminante: todas de un lado, ninguna del otro
    di('⭐⭐ «NO se podría deducir»: TODAS las sin votos y NINGUNA deducida',
      (pod[1] === sinV.length && pod[0] === 0) ? '✅ separa' : '⛔ NO separa');
    A.exige(pod[1] === sinV.length && pod[0] === 0,
      `el globo no separa «sin votos» de «deducida»: ${pod[1]} de ${sinV.length} y ${pod[0]} de ${dedu.length}`);
    // ⭐ y que las tres familias existan: si alguna fuera 0, lo de arriba pasaría por vacío
    A.exige(dedu.length > 0 && sinV.length > 0 && conNom.length > 0,
      `alguna familia está vacía (${dedu.length}/${sinV.length}/${conNom.length}): esta comprobación pasaría por vacío`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('C5 · ⚠️ LO QUE ESTO **NO** COMPRUEBA');
log('='.repeat(96));
log('   · que se vea bien: colores, grosores, orden de capas, tiles, rendimiento con');
log('     98.774 líneas encendidas. **Eso solo lo ve un ojo delante del navegador.**');
log('   · que la clasificación sea correcta. Eso lo mide `src/donde-falta.js`; aquí solo');
log('     se comprueba que el mapa pinta lo que esa clasificación dice.');
log('   · que el fondo confirme nada. **El fondo es OSM, la misma fuente a la que le');
log('     faltan estos nombres**: no puede desmentirse a sí mismo.');

log('');
log(A.cierre('VISOR DE NOMBRES'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
