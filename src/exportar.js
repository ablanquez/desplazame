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
//
// ⭐ A ESCALA DE CIUDAD (98.774 aristas, 378.222 vértices, 11 MB de geometría):
//    ⛔ NO se simplifica la geometría. Douglas-Peucker a 1 m ahorraba el 22 % de
//       los vértices a cambio de mover el dibujo hasta 1 metro. Un visor que
//       enseña el grafo movido un metro ya no está enseñando el grafo, y este
//       instrumento existe precisamente para cazar desajustes de ese tamaño
//       (los 20 nodos de la tanda 9 estaban a 1,90 m).
//    ⛔ NO se quita ni una arista. Lo que se recorta es CUÁNTAS SE PINTAN A LA
//       VEZ, en el visor, con un selector de zona — y el visor enseña siempre
//       "pintadas N de M", que es lo que hace imposible que filtre en silencio.
//
//   node src/exportar.js [casco]

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros, aGrados } = require('./geo');
const { construir, ZONA_CASCO, ZONA_TERMINO } = require('./ruta');
const { ZONAS } = require('./ciudad');

const SALIDA = path.join(__dirname, '..', 'tools', 'grafo-visor.js');
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const pg = (p) => { const g = aGrados(p[0], p[1]); return [r6(g[0]), r6(g[1])]; };

function exportar(zona = ZONA_TERMINO) {
  const g = construir(zona);

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

  // ── el límite municipal, como capa de referencia ──────────────────────────
  // ⭐ No es el grafo: es lo que EXPLICA las componentes sueltas del borde. Va
  //    en su propia capa y con su propio color para que no se confunda con dato.
  let limite = null;
  try {
    const Lim = require('./limite');
    const l = Lim.cargar();
    limite = { rel: l.rel, sello: l.sello, segs: l.segs.map(([a, b]) => [pg(a), pg(b)]) };
  } catch (e) {
    limite = { error: String(e.message) };
  }

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
      vertices: g.aristas.reduce((a, e) => a + e.pts.length, 0),
    },
    aristas,
    // los sitios donde el grafo puede estar mintiendo, cada uno como capa aparte
    porDefecto: g.porDefecto.map((x, i) => ({ n: i + 1, g: pg(x.p), wayA: x.wayA, wayB: x.wayB,
      nombreA: x.nombreA, nombreB: x.nombreB, hwA: x.hwA, hwB: x.hwB })),
    noConectados: g.noConectados.map((x, i) => ({ n: i + 1, g: pg(x.p), motivo: x.motivo,
      wayA: x.wayA, wayB: x.wayB, nombreA: x.nombreA, nombreB: x.nombreB })),
    puntasLejos: g.puntasLejos.map((x, i) => ({ n: i + 1, g: pg(x.p), g2: pg(x.q), d: x.d })),
    componentes: tam.map((t, k) => ({ k, nodos: t })),
    // D4 de la tanda 10 · las ventanas del eje DENSIDAD, para ver el reparto por barrio
    zonas: ZONAS.map((z) => ({ n: z.n, b: z.b })),
    limite,
  };

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, 'window.GRAFO = ' + JSON.stringify(salida) + ';\n', 'utf8');
  return { g, salida, peor, bytes: fs.statSync(SALIDA).size };
}

if (require.main === module) {
  const zona = process.argv[2] === 'casco' ? ZONA_CASCO : ZONA_TERMINO;
  const { g, salida, peor, bytes } = exportar(zona);
  const c = g.contadores;
  const L = [];
  L.push('='.repeat(88));
  L.push('A1 · REPROYECCIÓN metros -> grados');
  L.push(`   error máximo ida y vuelta sobre los ${g.nodos.length} nodos: ${(peor * 1000).toFixed(3)} mm  ${peor < 0.01 ? '✅' : '⛔'}`);
  L.push('');
  L.push('A2 · ⭐ EL CUADRE — lo exportado contra el grafo. Si no cuadra, PARAR.');
  L.push('   ⭐ es el que cazó los 20 nodos que estaban en dos sitios a la vez (nº53).');
  const filas = [
    ['aristas', salida.aristas.length, c.aristas],
    ['nodos (distintos en las aristas)', new Set(salida.aristas.flatMap((a) => [JSON.stringify(a.g[0]), JSON.stringify(a.g[a.g.length - 1])])).size, c.nodos],
    ['unido-por-defecto', salida.porDefecto.length, c.unidoPorDefecto],
    ['no conectados por evidencia', salida.noConectados.length, c.cortesNoConectados],
    ['puntas 2-5 m sin soldar', salida.puntasLejos.length, c.puntasFueraDeTecho],
    ['componentes', salida.componentes.length, g.comp.n],
    ['vértices de geometría', salida.aristas.reduce((a, x) => a + x.g.length, 0), c.aristas ? g.aristas.reduce((a, e) => a + e.pts.length, 0) : 0],
  ];
  let todoOk = true;
  for (const [k, a, b] of filas) {
    const ok = a === b;
    if (!ok && k.startsWith('nodos')) {
      L.push(`   ${k.padEnd(34)} exportado ${String(a).padStart(7)}   grafo ${String(b).padStart(7)}   ⚠️ ver abajo`);
    } else {
      if (!ok) todoOk = false;
      L.push(`   ${k.padEnd(34)} exportado ${String(a).padStart(7)}   grafo ${String(b).padStart(7)}   ${ok ? '✅' : '⛔'}`);
    }
  }

  // ⭐⭐ EL DESCUADRE DE NODOS NO SE EXPLICA CON UNA NOTA: SE DEMUESTRA.
  //
  // En la tanda 9 esta misma diferencia salió de +21 y estuve a punto de
  // despacharla escribiendo "es el redondeo" — una explicación plausible escrita
  // ANTES de comprobarla. Era falsa: eran nodos en dos sitios a la vez (nº53).
  // Lo que la desmintió fue el SIGNO: el redondeo solo puede dar MENOS, nunca más.
  //
  // Así que aquí no se explica, se prueba: se localiza cada colisión y se mide la
  // separación real. Si alguna supera la casilla del redondeo (~11 cm de lado), no
  // es redondeo y el exportador se para.
  {
    const usados = new Set();
    for (const e of g.aristas) { usados.add(e.a); usados.add(e.b); }
    const porClave = new Map();
    for (const i of usados) {
      const k = JSON.stringify(pg([g.nodos[i].x, g.nodos[i].y]));
      if (!porClave.has(k)) porClave.set(k, []);
      porClave.get(k).push(i);
    }
    const dif = usados.size - porClave.size;
    let peorCol = 0, pares = 0;
    for (const v of porClave.values()) {
      if (v.length < 2) continue;
      for (let a = 0; a < v.length; a++) for (let b = a + 1; b < v.length; b++) {
        pares++;
        peorCol = Math.max(peorCol, Math.hypot(g.nodos[v[a]].x - g.nodos[v[b]].x, g.nodos[v[a]].y - g.nodos[v[b]].y));
      }
    }
    const CASILLA = 0.12;   // 1e-6 grados ≈ 11 cm; se da 1 cm de margen
    L.push('');
    L.push('   ⭐ EL DESCUADRE DE NODOS, DEMOSTRADO (no explicado):');
    L.push(`      identidades de nodo con arista   ${usados.size}`);
    L.push(`      casillas distintas tras redondear ${porClave.size}   ⇒ diferencia ${dif}`);
    L.push(`      pares de nodos en la misma casilla ${pares}   separación peor ${(peorCol * 100).toFixed(2)} cm`);
    if (dif < 0) {
      L.push('      ⛔⛔ HAY MÁS EXPORTADOS QUE NODOS: eso NO lo puede causar el redondeo.');
      L.push('          Es un nodo en dos sitios a la vez. PARAR. (es el fallo nº53)');
      todoOk = false;
    } else if (peorCol > CASILLA) {
      L.push(`      ⛔ hay colisiones a más de ${(CASILLA * 100).toFixed(0)} cm: NO es el redondeo. PARAR.`);
      todoOk = false;
    } else {
      L.push(`      ⇒ ✅ todas por debajo de la casilla del redondeo: es redondeo, comprobado`);
    }
    L.push('      ⚠️ los nodos aislados —sin ninguna arista— no salen en el exportado por');
    L.push('         construcción: se pintan aristas, no nodos sueltos.');
  }
  L.push('');
  L.push('A3 · ⭐ QUÉ SE DEJA FUERA DEL DIBUJO');
  L.push('   aristas exportadas          ' + salida.aristas.length + ' de ' + c.aristas + '   ⇒ NINGUNA fuera');
  L.push('   vértices exportados         ' + salida.contadores.vertices + '   ⇒ sin simplificar: el dibujo es el grafo');
  L.push('   el visor pinta a la vez     lo que el selector de zona diga, y LO DICE en pantalla');
  L.push('   límite municipal            ' + (salida.limite && salida.limite.segs
    ? salida.limite.segs.length + ' segmentos (capa de referencia, NO es el grafo)' : '⛔ ' + (salida.limite || {}).error));
  L.push('');
  L.push('A4 · PESO');
  L.push(`   tools/grafo-visor.js  ${(bytes / 1048576).toFixed(2)} MB`);
  L.push(`   ⇒ ${bytes < 8 * 1048576 ? '✅ sin problema' : '⚠️ pesado: el visor pinta sobre LIENZO y por capas perezosas'}`);
  L.push('');
  L.push(`   sello del dato: ${salida.sello}`);
  L.push(`   zona: S ${salida.zona.sur} O ${salida.zona.oeste} N ${salida.zona.norte} E ${salida.zona.este}`);
  L.push(todoOk ? '\n   ⇒ ✅ CUADRA. Lo pintado es el grafo.' : '\n   ⇒ ⛔ NO CUADRA — PARAR.');
  console.log(L.join('\n'));
  if (!todoOk) process.exit(1);
}

module.exports = { exportar, SALIDA };
