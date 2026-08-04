// ⭐ TANDA 22 · EL DATO DEL MAPA DE DOS COLORES — vuelca, no recalcula.
//
//   node src/exportar-nombre-simple.js
//
// Dos colores y ya: azul si la línea tiene nombre de vía, rojo si no.
// ⭐ El nombre cuenta **esté declarado o deducido**: si la línea tiene nombre, azul.
//    ⇒ se usa el modelo completo (`Mo.construirModelo`), que es el mismo que imprime
//      el texto de las rutas. ⛔ Si aquí se decidiera por otro camino, el mapa y el
//      itinerario dirían cosas distintas de la misma línea (fallo nº68).
//
// ⚠️ Sale como `.js` con `window.SIMPLE = …` y no como `.json` por lo mismo que los
//    otros dos exportadores: un HTML abierto con doble clic no puede hacer `fetch`
//    de un fichero local (CORS con `file://`); un `<script src>` sí carga.
//
// ⛔ NO se simplifica la geometría, igual que en `src/exportar.js`: el dibujo es el
//    grafo, no una aproximación cómoda.

'use strict';
const fs = require('fs');
const path = require('path');
const { aGrados, aMetros } = require('./geo');
const A = require('./alarma');
const D = require('./direccion');
const Mo = require('./modelo');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

const SALIDA = path.join(__dirname, '..', 'tools', 'nombre-simple-visor.js');
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const pg = (p) => { const g = aGrados(p[0], p[1]); return [r6(g[0]), r6(g[1])]; };

function construirSalida() {
  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const { M } = Mo.construirModelo(g, portales);

  const aristas = g.aristas.map((e, i) => ({
    g: e.pts.map(pg),
    // 1 = tiene nombre (declarado o deducido) · 0 = no lo tiene
    n: (M[i].via && M[i].via.nombre) ? 1 : 0,
  }));

  const con = aristas.filter((a) => a.n === 1).length;
  return {
    g, M,
    salida: {
      sello: g.sello, zona: g.zona, generado: 'src/exportar-nombre-simple.js',
      contadores: { total: aristas.length, conNombre: con, sinNombre: aristas.length - con },
      aristas,
    },
  };
}

if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(48)} ${v}`);
  const T0 = Date.now();
  const { g, M, salida } = construirSalida();

  // ── la reproyección, ANTES de escribir nada ────────────────────────────────
  let peor = 0;
  for (const n of g.nodos) {
    const gr = aGrados(n.x, n.y);
    const v = aMetros(gr[0], gr[1]);
    peor = Math.max(peor, Math.hypot(n.x - v[0], n.y - v[1]));
  }

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, 'window.SIMPLE = ' + JSON.stringify(salida) + ';\n', 'utf8');
  const bytes = fs.statSync(SALIDA).size;

  log('='.repeat(88));
  log('EL DATO DEL MAPA DE DOS COLORES');
  log('='.repeat(88));
  log('');
  di('reproyección · error máximo ida y vuelta', (peor * 1000).toFixed(3) + ' mm  ' + (peor < 0.01 ? '✅' : '⛔'));
  A.exige(peor < 0.01, `la reproyección tiene ${peor.toFixed(3)} m de error`);

  log('');
  log('   ⭐ EL CUADRE — lo exportado contra el modelo');
  const conM = M.filter((m) => m.via && m.via.nombre).length;
  const c = salida.contadores;
  di('AZULES · con nombre — exportado / modelo', `${c.conNombre} / ${conM}   ${c.conNombre === conM ? '✅' : '⛔'}`);
  di('ROJAS  · sin nombre — exportado / modelo', `${c.sinNombre} / ${M.length - conM}   ${c.sinNombre === M.length - conM ? '✅' : '⛔'}`);
  di('⭐ suman', `${c.conNombre + c.sinNombre} de ${g.aristas.length}   ${c.conNombre + c.sinNombre === g.aristas.length ? '✅ ninguna fuera' : '⛔ FALTAN'}`);
  A.exige(c.conNombre === conM && c.sinNombre === M.length - conM, 'el exportado no cuadra con el modelo');
  A.exige(c.conNombre + c.sinNombre === g.aristas.length, 'las dos cuentas no suman las aristas del grafo');

  const vE = salida.aristas.reduce((s, a) => s + a.g.length, 0);
  const vG = g.aristas.reduce((s, e) => s + e.pts.length, 0);
  di('vértices exportados / del grafo', `${vE} / ${vG}   ${vE === vG ? '✅ sin simplificar' : '⛔'}`);
  A.exige(vE === vG, 'se han perdido vértices: el dibujo ya no es el grafo');

  log('');
  di('tools/nombre-simple-visor.js', (bytes / 1048576).toFixed(2) + ' MB');
  di('sello del dato', salida.sello);
  log('');
  log(A.cierre('EXPORTADO DEL MAPA SIMPLE'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { construirSalida, SALIDA };
