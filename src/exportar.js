// Vuelca el grafo YA CONSTRUIDO a un fichero pintable. No lo rehace: lo exporta.
//
// ⚠️ Sale como .js con una asignación (`window.GRAFO = …`) y NO como .json, por un
//    motivo práctico: un HTML abierto con doble clic no puede hacer `fetch` de un
//    fichero local — el navegador lo bloquea por CORS con `file://`. Un
//    `<script src>` sí carga. Cuanta menos maquinaria haya entre el grafo y el
//    ojo, menos sitios donde el fallo pueda ser del visor.
//
// ⚠️ La reproyección metros -> grados es un sitio donde se pierde el sentido sin
//    que nada falle: un error aquí no revienta, mueve la ciudad. Se comprueba con
//    ida y vuelta antes de escribir nada.

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros, aGrados } = require('./geo');
const { construir } = require('./ruta');

const SALIDA = path.join(__dirname, '..', 'tools', 'grafo-visor.js');
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const pg = (p) => { const g = aGrados(p[0], p[1]); return [r6(g[0]), r6(g[1])]; };

function exportar() {
  const g = construir();

  // ── comprobación de la reproyección, ANTES de escribir ────────────────────
  let peor = 0;
  for (const n of g.nodos) {
    const gr = aGrados(n.x, n.y);
    const v = aMetros(gr[0], gr[1]);
    peor = Math.max(peor, Math.hypot(n.x - v[0], n.y - v[1]));
  }
  if (peor > 0.01) throw new Error(`reproyección con error de ${peor.toFixed(3)} m — abortado`);

  const comp = g.comp;
  const tam = comp.tamanos;
  const mayor = tam.indexOf(Math.max(...tam));

  const aristas = g.aristas.map((e, i) => ({
    i,
    g: e.pts.map(pg),
    p: e.precision,
    h: e.highway,
    w: e.way,
    d: e.unidoPorDefecto ? 1 : 0,
    a: e.pie ? 1 : 0,
    c: comp.comp[e.a],
    m: Math.round(e.largo * 10) / 10,
  }));

  const salida = {
    sello: g.sello,
    zona: g.zona,
    generado: 'src/exportar.js',
    contadores: {
      nodos: g.contadores.nodos, aristas: g.contadores.aristas,
      componentes: comp.n, mayor, tamanoMayor: Math.max(...tam),
      unidoPorDefecto: g.contadores.unidoPorDefecto,
      noConectados: g.contadores.cortesNoConectados,
      puntasLejos: g.contadores.puntasFueraDeTecho,
    },
    aristas,
    // los sitios donde el grafo puede estar mintiendo, cada uno como capa aparte
    porDefecto: g.porDefecto.map((x, i) => ({ n: i + 1, g: pg(x.p), wayA: x.wayA, wayB: x.wayB,
      nombreA: x.nombreA, nombreB: x.nombreB, hwA: x.hwA, hwB: x.hwB })),
    noConectados: g.noConectados.map((x, i) => ({ n: i + 1, g: pg(x.p), motivo: x.motivo,
      wayA: x.wayA, wayB: x.wayB, nombreA: x.nombreA, nombreB: x.nombreB })),
    puntasLejos: g.puntasLejos.map((x, i) => ({ n: i + 1, g: pg(x.p), g2: pg(x.q), d: x.d })),
    componentes: tam.map((t, k) => ({ k, nodos: t })),
  };

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, 'window.GRAFO = ' + JSON.stringify(salida) + ';\n', 'utf8');
  return { g, salida, peor, bytes: fs.statSync(SALIDA).size };
}

if (require.main === module) {
  const { g, salida, peor, bytes } = exportar();
  const c = g.contadores;
  const L = [];
  L.push('='.repeat(88));
  L.push('A1 · REPROYECCIÓN metros -> grados');
  L.push(`   error máximo ida y vuelta sobre los ${g.nodos.length} nodos: ${(peor * 1000).toFixed(3)} mm  ${peor < 0.01 ? '✅' : '⛔'}`);
  L.push('');
  L.push('A2 · ⭐ EL CUADRE — lo exportado contra el grafo. Si no cuadra, PARAR.');
  const filas = [
    ['aristas', salida.aristas.length, c.aristas],
    ['nodos (distintos en las aristas)', new Set(salida.aristas.flatMap((a) => [JSON.stringify(a.g[0]), JSON.stringify(a.g[a.g.length - 1])])).size, c.nodos],
    ['unido-por-defecto', salida.porDefecto.length, c.unidoPorDefecto],
    ['no conectados por evidencia', salida.noConectados.length, c.cortesNoConectados],
    ['puntas 2-5 m sin soldar', salida.puntasLejos.length, c.puntasFueraDeTecho],
    ['componentes', salida.componentes.length, g.comp.n],
  ];
  let todoOk = true;
  for (const [k, a, b] of filas) {
    const ok = a === b;
    if (!ok && k.startsWith('nodos')) {
      L.push(`   ${k.padEnd(34)} exportado ${String(a).padStart(6)}   grafo ${String(b).padStart(6)}   ⚠️ ver nota`);
    } else {
      if (!ok) todoOk = false;
      L.push(`   ${k.padEnd(34)} exportado ${String(a).padStart(6)}   grafo ${String(b).padStart(6)}   ${ok ? '✅' : '⛔'}`);
    }
  }
  L.push('');
  L.push('   ⚠️ nota sobre los nodos: el exportado cuenta EXTREMOS DE ARISTA distintos por');
  L.push('      coordenada redondeada a 1e-6 (~11 cm). El grafo cuenta identidades de nodo.');
  L.push('      Los nodos aislados —sin ninguna arista— no aparecen en el exportado por');
  L.push('      construcción: se pintan aristas, no nodos sueltos.');
  L.push('');
  L.push('A4 · PESO');
  L.push(`   tools/grafo-visor.js  ${(bytes / 1048576).toFixed(2)} MB`);
  L.push(`   ⇒ ${bytes < 8 * 1048576 ? '✅ el navegador lo aguanta sin recortar nada' : '⚠️ pesado: habría que recortar Y DECIR QUÉ SE DEJA FUERA'}`);
  L.push('');
  L.push(`   sello del dato: ${salida.sello}`);
  L.push(`   zona: S ${salida.zona.sur} O ${salida.zona.oeste} N ${salida.zona.norte} E ${salida.zona.este}`);
  L.push(todoOk ? '\n   ⇒ ✅ CUADRA. Lo pintado es el grafo.' : '\n   ⇒ ⛔ NO CUADRA — PARAR.');
  console.log(L.join('\n'));
  if (!todoOk) process.exit(1);
}

module.exports = { exportar, SALIDA };
