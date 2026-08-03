// LA VERIFICACIÓN. Sin esto el grafo no está hecho.
//
// ⭐ Las tres contrapruebas de C4c plantan el fallo a propósito y comprueban que el
//    instrumento se pone ROJO. Un guardián cuyo rojo nadie ha provocado es una
//    promesa, no una red.
// ⭐ El control positivo NO lo elige quien escribió el instrumento (ley 17): los
//    cruces conocidos salen del crudo de OSM de la tanda 3 —otro fichero, otra
//    fecha, otra consulta— y no de una lista escrita hoy.

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros } = require('./geo');
const osm = require('./osm');
const { planarizar } = require('./planarizar');
const G = require('./grafo');
const { construir, ZONA_CASCO } = require('./ruta');
const A = require('./alarma');

const CRUDO_TANDA3 = path.join(__dirname, '..', 'data', 'exploracion',
  '2026-08-02_osm_overpass_casco-highway.json');

const log = console.log;
const linea = (t) => { log(''); log('='.repeat(90)); log(t); };

// ── generador reproducible: sin Math.random, semilla declarada ──────────────
function rng(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ── aristas de articulación: ahora vive en `grafo.js`, porque la verificación de
//    la ciudad la necesita también y dos Tarjan son dos verdades. Misma función.
const puentes = (nodos, ady) => G.articulaciones(nodos, ady);

function contarComponentes(nodos, aristas, sinArista = -1) {
  const ady = Array.from({ length: nodos.length }, () => []);
  for (let i = 0; i < aristas.length; i++) {
    if (i === sinArista) continue;
    const e = aristas[i];
    if (!e.pie) continue;
    ady[e.a].push({ n: e.b, w: e.largo, e: i });
    ady[e.b].push({ n: e.a, w: e.largo, e: i });
  }
  return G.componentes(nodos, ady);
}

// ═══════════════════════════════════════════════════════════════════════════
// ⛔ ANTES decía `construir()` a secas. El casco es lo correcto aquí —toda esta
//    verificación se compara contra el crudo de la tanda 3, que es del casco—,
//    pero lo era por un valor por defecto, no por una decisión escrita.
const g = construir(ZONA_CASCO);
const c = g.contadores;

linea('C4a · ¿ES UNA RED?  —  componentes conexas, CON SU LÍNEA BASE');
{
  // Línea base: el mismo dato SIN planarizar — cada way es una polilínea suelta y
  // solo se unen donde OSM ya trae el nodo compartido explícitamente.
  const { ways } = osm.cargar(require('./ruta').CRUDO);
  const recorte = osm.proyectar(osm.recortar(ways, ZONA_CASCO));
  const crudo = planarizar(recorte, { tolerancia: 0 });
  const sinCruces = planarizar(recorte.map((w) => ({ ...w })), { tolerancia: 0 });
  log(`   ⭐ LÍNEA BASE (sin soldar puntas, D5 = 0 m):   ${contarComponentes(sinCruces.nodos, sinCruces.aristas).n} componentes`);
  log(`      grafo de hoy (D5 = 2,0 m):                 ${g.comp.n} componentes`);
  const t = [...g.comp.tamanos].sort((a, b) => b - a);
  log(`      la mayor: ${t[0]} nodos = ${(100 * t[0] / t.reduce((a, b) => a + b, 0)).toFixed(1)} %`);
  log(`      ⇒ soldar las puntas de D5 quitó ${contarComponentes(sinCruces.nodos, sinCruces.aristas).n - g.comp.n} componentes`);
  log('');
  log('   las componentes pequeñas, para MIRARLAS (agrupar es borrar):');
  const porComp = new Map();
  for (let i = 0; i < g.nodos.length; i++) {
    const k = g.comp.comp[i];
    if (k < 0) continue;
    if (!porComp.has(k)) porComp.set(k, []);
    porComp.get(k).push(i);
  }
  const chicas = [...porComp.entries()].filter(([, v]) => v.length <= 6)
    .sort((a, b) => b[1].length - a[1].length);
  for (const [k, ns] of chicas.slice(0, 10)) {
    const aris = g.aristas.filter((e) => g.comp.comp[e.a] === k && e.pie);
    const hw = [...new Set(aris.map((e) => e.highway))].join(',');
    const ways = [...new Set(aris.map((e) => e.way))].slice(0, 3);
    log(`      comp ${String(k).padStart(3)}  ${String(ns.length).padStart(2)} nodos  ${String(aris.length).padStart(2)} aristas  highway=${hw}  ways ${ways.join(' ')}`);
  }
}

linea('C4b · CUENTA A MANO — 10 cruces conocidos del casco');
log('   ⭐ NO los elijo hoy: salen del crudo de la TANDA 3 (otro fichero, otra fecha,');
log('      otra consulta), tomando los nodos que más ways comparten. Criterio objetivo.');
{
  const d3 = JSON.parse(fs.readFileSync(CRUDO_TANDA3, 'utf8'));
  // ⚠️ Este crudo se pidió con `out body`, NO con `out geom`: los ways traen
  //    `nodes` y las coordenadas vienen como elementos `node` SUELTOS. Dos crudos
  //    de OSM del mismo proyecto no tienen la misma forma — depende de la
  //    sentencia `out` que se usara. Ver bitácora nº51.
  const w3 = d3.elements.filter((e) => e.type === 'way' && e.nodes && (e.tags || {}).highway);
  const uso = new Map();
  const coord = new Map();
  for (const e of d3.elements) {
    if (e.type === 'node' && e.lat !== undefined) coord.set(e.id, { lat: e.lat, lon: e.lon });
  }
  for (const w of w3) for (const n of w.nodes) uso.set(n, (uso.get(n) || 0) + 1);
  const cands = [...uso.entries()].filter(([n, k]) => k >= 3 && coord.has(n))
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 10);
  log(`   candidatos con >=3 ways en el crudo de la tanda 3: ${[...uso.values()].filter((v) => v >= 3).length}`);
  log('');
  let ok = 0, okPie = 0;
  for (const [n, k] of cands) {
    const p = aMetros(coord.get(n).lon, coord.get(n).lat);
    let mejor = -1, md = Infinity;
    for (let i = 0; i < g.nodos.length; i++) {
      const d = Math.hypot(g.nodos[i].x - p[0], g.nodos[i].y - p[1]);
      if (d < md) { md = d; mejor = i; }
    }
    // ⚠️ DOS grados, y la diferencia importa: el TOTAL dice si el planarizado
    //    encontró el cruce; el DE PIE dice si se puede usar andando. Medir solo
    //    el segundo daba un ⛔ en un cruce que estaba perfectamente construido,
    //    pero con dos de sus cuatro vías marcadas `foot=no`. Ver bitácora nº52.
    const gPie = g.ady[mejor] ? g.ady[mejor].length : 0;
    const gTot = g.aristas.filter((e) => e.a === mejor || e.b === mejor).length;
    const bien = md <= 1.0 && gTot >= 3;
    if (bien) ok++;
    if (gPie >= 3) okPie++;
    log(`      nodo OSM ${String(n).padEnd(12)} ${k} ways  ->  grafo ${String(mejor).padStart(5)}  a ${md.toFixed(2)} m  grado total ${gTot} / a pie ${gPie}  ${bien ? '✅' : '⛔'}`);
  }
  log(`   ⇒ ${ok} de ${cands.length} cruces CONSTRUIDOS (grado total >= 3, a <=1 m de su sitio)`);
  log(`   ⇒ ${okPie} de ${cands.length} además utilizables A PIE — la diferencia son vías con foot=no`);
}

linea('C4c · LAS TRES CONTRAPRUEBAS — plantar el fallo y ver el rojo');

log('');
log('   [1] BORRAR UNA UNIÓN A PROPÓSITO -> ¿lo detecta el contador de componentes?');
{
  const P = puentes(g.nodos, g.ady).filter((i) => i >= 0);
  const grado = new Array(g.nodos.length).fill(0);
  for (const e of g.aristas) if (e.pie) { grado[e.a]++; grado[e.b]++; }
  // ⚠️ Un puente COLGANTE (un extremo de grado 1) no parte la red: deja un nodo
  //    huérfano. Elegir al azar entre TODAS las articulaciones hacía que la
  //    contraprueba pudiera no ponerse roja POR CONSTRUCCIÓN. Ver bitácora nº50.
  const internos = P.filter((i) => grado[g.aristas[i].a] > 1 && grado[g.aristas[i].b] > 1);
  log(`       aristas de articulación: ${P.length}   de ellas INTERNAS (parten de verdad): ${internos.length}`);
  log(`       colgantes (un extremo de grado 1): ${P.length - internos.length}  ⬅ éstas NO parten la red`);
  const antes = g.comp;
  const r = rng(20260802);
  const elegida = internos[Math.floor(r() * internos.length)];
  const dsp = contarComponentes(g.nodos, g.aristas, elegida);
  const e = g.aristas[elegida];
  const mayorAntes = Math.max(...antes.tamanos), mayorDsp = Math.max(...dsp.tamanos);
  log(`       se borra la arista ${elegida} (way ${e.way}, ${e.highway}, ${e.largo.toFixed(1)} m)`);
  log(`       componentes   antes: ${antes.n}      después: ${dsp.n}`);
  log(`       mayor         antes: ${mayorAntes}   después: ${mayorDsp}`);
  log(`       nodos aislados antes: ${antes.aislados}  después: ${dsp.aislados}`);
  const detecta1 = dsp.n > antes.n || mayorDsp < mayorAntes;
  log(`       ⇒ ${detecta1 ? '✅ ROJO: el contador lo detecta' : '⛔ NO LO DETECTA — el contador no vigila nada'}`);
  A.exige(detecta1, 'la contraprueba de borrar una articulación NO se detecta: el contador no vigila nada');
}

log('');
log('   [2] FORZAR UN CRUCE FALSO -> ¿aparece como unido-por-defecto?');
{
  const { ways } = osm.cargar(require('./ruta').CRUDO);
  const recorte = osm.proyectar(osm.recortar(ways, ZONA_CASCO));
  // dos ways inventados que se cruzan en aspa, sin nodo compartido y sin ninguna
  // evidencia de desnivel: D1 tiene que unirlos y D2 tiene que contarlo.
  const cx = 676000, cy = 4614000;
  const inv = (id, p1, p2) => ({ id, nodes: [id * 10 + 1, id * 10 + 2],
    tags: { highway: 'residential' }, pts: [p1, p2],
    geometry: [{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }] });
  const conFalso = [...recorte,
    inv(999000001, [cx - 50, cy], [cx + 50, cy]),
    inv(999000002, [cx, cy - 50], [cx, cy + 50])];
  const r2 = planarizar(conFalso);
  const antes = c.unidoPorDefecto, despues = r2.contadores.unidoPorDefecto;
  log(`       unido-por-defecto antes: ${antes}   con el cruce plantado: ${despues}`);
  log(`       cruces geométricos antes: ${c.cortesGeometricos}   después: ${r2.contadores.cortesGeometricos}`);
  log(`       ⇒ ${despues > antes ? '✅ ROJO: D2 lo caza y lo cuenta' : '⛔ NO LO CAZA — D2 no cuenta nada'}`);
  A.exige(despues > antes, 'la contraprueba de D2 NO se detecta: el cruce plantado no mueve el contador');

  // y el control complementario: el mismo cruce CON evidencia (uno en layer=1)
  const conEvid = [...recorte,
    { ...inv(999000003, [cx - 50, cy + 200], [cx + 50, cy + 200]) },
    { ...inv(999000004, [cx, cy + 150], [cx, cy + 250]), tags: { highway: 'residential', layer: '1', bridge: 'yes' } }];
  const r3 = planarizar(conEvid);
  log(`       ⭐ control complementario — el mismo cruce con bridge+layer=1:`);
  log(`          no-conectados antes: ${c.cortesNoConectados}   después: ${r3.contadores.cortesNoConectados}`);
  log(`          ⇒ ${r3.contadores.cortesNoConectados > c.cortesNoConectados ? '✅ D1 lo separa por evidencia positiva' : '⛔ D1 no distingue'}`);
  A.exige(r3.contadores.cortesNoConectados > c.cortesNoConectados, 'D1 NO distingue el cruce con evidencia positiva');
}

log('');
log('   [3] MOVER LA ZONA 2 km -> ¿produce basura o disimula?');
{
  const zona2 = { sur: ZONA_CASCO.sur + 0.018, oeste: ZONA_CASCO.oeste,
    norte: ZONA_CASCO.norte + 0.018, este: ZONA_CASCO.este };
  const g2 = construir(zona2);
  log(`       zona original:  ${c.waysEntrada} ways, ${c.aristas} aristas, ${g.comp.n} componentes, mayor ${Math.max(...g.comp.tamanos)}`);
  log(`       zona +2 km N:   ${g2.contadores.waysEntrada} ways, ${g2.contadores.aristas} aristas, ${g2.comp.n} componentes, mayor ${Math.max(...g2.comp.tamanos)}`);
  log('       ⚠️ lectura: esto NO es una contraprueba de "acierta o falla" — mover la zona da');
  log('          OTRA zona real de la ciudad, no un absurdo. Lo que comprueba es que el');
  log('          planarizado no está cableado a este trozo: si produjera números idénticos');
  log('          o basura (0 aristas, 1 componente gigante o mil), estaría mal.');
}

linea('C4d · RUTAS DE CORDURA — ninguna puede ser más corta que la línea recta');
{
  const { resolver } = require('./ruta');
  const pares = [
    ['Pilar -> Plaza España', 41.6563, -0.8783, 41.6516, -0.8797],
    ['Mercado Central -> San Miguel', 41.6570, -0.8823, 41.6519, -0.8730],
    ['Puerta del Carmen -> Magdalena', 41.6503, -0.8843, 41.6540, -0.8722],
  ];
  for (const [nombre, a, b, cc, d] of pares) {
    const r = resolver(g, a, b, cc, d);
    // ⛔⛔ AQUÍ ESTABA EL FALLO QUE COSTÓ DOS TANDAS. Esta línea imprimía el motivo
    //    y hacía `continue`, y el proceso terminaba en 0. La ruta `Puerta del
    //    Carmen → Magdalena` estuvo rota desde la tanda 11 con este ⛔ en pantalla.
    if (!A.exige(r.encontrada, `ruta de cordura SIN RESOLVER: ${nombre} (${r.motivo})`,
      { nombre, motivo: r.motivo })) { continue; }
    const malo = r.metros < r.lineaRecta;
    A.exige(!malo, `ruta de cordura más corta que la línea recta: ${nombre} `
      + `(${r.metros} m frente a ${r.lineaRecta} m)`, { nombre, metros: r.metros, recta: r.lineaRecta });
    log(`   ${nombre.padEnd(32)} ${String(r.metros).padStart(7)} m   recta ${String(r.lineaRecta).padStart(7)} m   rodeo ×${r.rodeo}  ${malo ? '⛔ IMPOSIBLE' : '✅'}`);
    log(`   ${''.padEnd(32)}   enganche O/D ${r.engancheOrigen}/${r.engancheDestino} m · ${r.pasos.length} pasos · ${r.pasosPorDefecto} por defecto · ${r.pasosSinAceraConocida} sin acera conocida`);
  }
}

linea('C5 · EL EJE ESCALA — nunca medido en este proyecto');
{
  const largos = g.aristas.map((e) => e.largo).sort((a, b) => a - b);
  const p = (q) => largos[Math.min(largos.length - 1, Math.floor(q * largos.length))];
  log(`   longitud de arista: min ${largos[0].toFixed(2)}  p10 ${p(0.1).toFixed(1)}  mediana ${p(0.5).toFixed(1)}  p90 ${p(0.9).toFixed(1)}  max ${largos[largos.length - 1].toFixed(0)} m`);
  for (const u of [1, 2, 5, 10]) {
    const n = largos.filter((x) => x < u).length;
    log(`     aristas de menos de ${String(u).padStart(2)} m: ${String(n).padStart(5)}  (${(100 * n / largos.length).toFixed(2)} %)`);
  }
  const ways = new Map();
  for (const e of g.aristas) ways.set(e.way, (ways.get(e.way) || 0) + e.largo);
  const wl = [...ways.values()].sort((a, b) => b - a);
  log(`   longitud por WAY: mediana ${wl[Math.floor(wl.length / 2)].toFixed(1)} m   max ${wl[0].toFixed(0)} m`);
  const cortos = [...ways.values()].filter((x) => x < 10).length;
  log(`     ways de menos de 10 m: ${cortos} de ${ways.size}  (${(100 * cortos / ways.size).toFixed(1)} %)`);
  const part = new Map();
  for (const e of g.aristas) part.set(e.way, (part.get(e.way) || 0) + 1);
  const maxPart = [...part.entries()].sort((a, b) => b[1] - a[1])[0];
  log(`   ⭐ el way MÁS partido: ${maxPart[0]} en ${maxPart[1]} aristas`);
  const sinPartir = [...part.values()].filter((x) => x === 1).length;
  log(`     ways NO partidos (1 sola arista): ${sinPartir} de ${part.size}  (${(100 * sinPartir / part.size).toFixed(1)} %)`);
}

log('');
log(A.cierre('VERIFICACIÓN DEL CASCO'));
