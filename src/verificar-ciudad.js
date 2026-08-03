// LA VERIFICACIÓN DEL GRAFO DE LA CIUDAD — C2, C3, C5 y C6.
//
// ⭐ Las mismas contrapruebas de la tanda 8, a escala ×14. Si una no se pone roja
//    aquí, los números de esta tanda no valen.
//
//   node src/verificar-ciudad.js

'use strict';
const { construir, ZONA_TERMINO, ZONA_CASCO, CRUDO } = require('./ruta');
const { aMetros, aGrados, dist } = require('./geo');
const osm = require('./osm');
const { planarizar } = require('./planarizar');
const G = require('./grafo');
const fs = require('fs');
const path = require('path');

const CRUDO_TANDA3 = path.join(__dirname, '..', 'data', 'exploracion',
  '2026-08-02_osm_overpass_casco-highway.json');

const log = console.log;
const linea = (t) => { log(''); log('='.repeat(96)); log(t); };
const di = (k, v) => log(`   ${String(k).padEnd(46)} ${v}`);
function rng(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/**
 * ⭐⭐ Articulaciones CON EL TAMAÑO DE CADA LADO.
 *
 * Sin esto, "borrar una arista de articulación" no es una contraprueba: 341 de 458
 * del casco eran colgantes y la prueba pasaba por construcción (ley 35, bitácora
 * nº50). Aquí se calcula, en el mismo recorrido y sin coste extra, cuántos nodos
 * quedan a cada lado — y se elige la que parte DOS PARTES GRANDES, que es lo único
 * que de verdad pone a prueba el contador de componentes.
 */
function articulacionesConTamano(nodos, ady) {
  const disc = new Int32Array(nodos.length).fill(-1);
  const low = new Int32Array(nodos.length);
  const sub = new Int32Array(nodos.length);
  const res = [];
  let t = 0;
  for (let s = 0; s < nodos.length; s++) {
    if (disc[s] !== -1 || !ady[s].length) continue;
    // tamaño del árbol de esta componente, para saber el "otro lado"
    const raiz = t;
    const pila = [[s, -1, 0]];
    disc[s] = low[s] = t++; sub[s] = 1;
    const orden = [s];
    while (pila.length) {
      const cima = pila[pila.length - 1];
      const v = cima[0];
      if (cima[2] < ady[v].length) {
        const { n: u, e } = ady[v][cima[2]++];
        if (e === cima[1]) continue;
        if (disc[u] === -1) { disc[u] = low[u] = t++; sub[u] = 1; orden.push(u); pila.push([u, e, 0]); }
        else low[v] = Math.min(low[v], disc[u]);
      } else {
        pila.pop();
        if (pila.length) {
          const p = pila[pila.length - 1][0];
          low[p] = Math.min(low[p], low[v]);
          sub[p] += sub[v];
          if (low[v] > disc[p]) res.push({ arista: cima[1], hijo: v, sub: sub[v], compRaiz: raiz });
        }
      }
    }
    const total = t - raiz;
    for (const r of res) if (r.compRaiz === raiz) r.menor = Math.min(r.sub, total - r.sub);
  }
  return res;
}

function contarComponentes(nodos, aristas, sinArista = -1) {
  const ady = Array.from({ length: nodos.length }, () => []);
  for (let i = 0; i < aristas.length; i++) {
    if (i === sinArista || !aristas[i].pie) continue;
    const e = aristas[i];
    ady[e.a].push({ n: e.b, w: e.largo, e: i });
    ady[e.b].push({ n: e.a, w: e.largo, e: i });
  }
  return G.componentes(nodos, ady);
}

// ═════════════════════════════════════════════════════════════════════════════
const T0 = Date.now();
const g = construir(ZONA_TERMINO);
const { ways: todos } = osm.cargar(CRUDO);
const NOM = new Map();
for (const w of todos) NOM.set(w.id, (w.tags || {}).name || null);

log('='.repeat(96));
log('VERIFICACIÓN DEL GRAFO DE LA CIUDAD');
di('sello OSM', g.sello);
di('nodos · aristas', `${g.contadores.nodos} · ${g.aristas.length}`);
di('componentes (con arista) · aislados', `${g.comp.n} · ${g.comp.aislados}`);

// ── C2 · COMPONENTES CONEXAS ─────────────────────────────────────────────────
linea('C2 · ⭐ COMPONENTES CONEXAS — clasificadas ANTES de contarlas');
{
  const mayor = g.comp.tamanos.indexOf(Math.max(...g.comp.tamanos));
  const tamMayor = g.comp.tamanos[mayor];
  di('componentes', g.comp.n);
  di('la mayor', `${tamMayor} nodos  (${(100 * tamMayor / g.contadores.nodos).toFixed(2)} % del grafo)`);
  di('las demás suman', `${g.contadores.nodos - tamMayor} nodos`);

  // aristas por componente
  const porComp = new Map();
  for (const e of g.aristas) {
    if (!e.pie) continue;
    const k = g.comp.comp[e.a];
    if (k < 0 || k === mayor) continue;
    if (!porComp.has(k)) porComp.set(k, []);
    porComp.get(k).push(e);
  }

  // rejilla de los nodos de la MAYOR, para medir la distancia al continente
  const C = 200;
  const rej = new Map();
  for (let i = 0; i < g.nodos.length; i++) {
    if (g.comp.comp[i] !== mayor) continue;
    const k = Math.floor(g.nodos[i].x / C) + ',' + Math.floor(g.nodos[i].y / C);
    if (!rej.has(k)) rej.set(k, []);
    rej.get(k).push(i);
  }
  const alContinente = (p) => {
    for (let r = 1; r <= 25; r++) {
      let m = Infinity;
      const cx = Math.floor(p[0] / C), cy = Math.floor(p[1] / C);
      for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
        for (const i of (rej.get(x + ',' + y) || [])) {
          const d = Math.hypot(p[0] - g.nodos[i].x, p[1] - g.nodos[i].y);
          if (d < m) m = d;
        }
      }
      if (Number.isFinite(m)) return m;
    }
    return Infinity;
  };
  // ⭐ EL BORDE DE VERDAD: el límite municipal, no el rectángulo.
  //    Medir contra el bbox clasificaba como "trozo urbano aislado" a un pueblo
  //    del término al que se llega cruzando OTRO municipio — que es un artefacto
  //    de la descarga, no un hueco de la ciudad.
  const Lim = require('./limite');
  const lim = Lim.cargar();
  di('límite municipal', `rel ${lim.rel} · ${lim.segs.length} segmentos · sello ${lim.sello}`);

  // ⭐ Y "urbano" se MIDE, no se supone por el nombre de la clase: densidad de
  //    nodos del grafo entero alrededor. Mi primer clasificador llamaba "trozo
  //    urbano" a pistas de campo sin nombre, y no miraba la densidad en absoluto.
  const CD = 150;
  const rejT = new Map();
  for (let i = 0; i < g.nodos.length; i++) {
    if (!g.ady[i] || !g.ady[i].length) continue;
    const k = Math.floor(g.nodos[i].x / CD) + ',' + Math.floor(g.nodos[i].y / CD);
    if (!rejT.has(k)) rejT.set(k, []);
    rejT.get(k).push(i);
  }
  const densidad = (p) => {
    const cx = Math.floor(p[0] / CD), cy = Math.floor(p[1] / CD);
    let n = 0;
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      for (const i of (rejT.get(x + ',' + y) || [])) {
        if (Math.hypot(p[0] - g.nodos[i].x, p[1] - g.nodos[i].y) <= CD) n++;
      }
    }
    return n;
  };

  const filas = [];
  for (const [k, ar] of porComp) {
    const L = ar.reduce((a, e) => a + e.largo, 0);
    const cx = ar.reduce((a, e) => a + e.pts[0][0], 0) / ar.length;
    const cy = ar.reduce((a, e) => a + e.pts[0][1], 0) / ar.length;
    const nombres = [...new Set(ar.map((e) => NOM.get(e.way)).filter(Boolean))];
    const hws = [...new Set(ar.map((e) => e.highway))];
    let dCont = Infinity, dLim = Infinity, dens = 0;
    for (const e of ar) for (const p of [e.pts[0], e.pts[e.pts.length - 1]]) {
      dCont = Math.min(dCont, alContinente(p));
      dLim = Math.min(dLim, Lim.distancia(p, lim.segs));
      dens = Math.max(dens, densidad(p));
    }
    // ⭐ NO basta con "algún extremo dentro": eso da true para la cola de un pueblo
    //    vecino que asoma 20 m. Se mide QUÉ FRACCIÓN de la componente está dentro
    //    del término, que es lo que distingue "barrio nuestro incomunicado" de
    //    "pueblo de al lado". Un booleano habría dado el mismo ⚠️ a las dos cosas.
    let dentroN = 0;
    for (const e of ar) if (Lim.dentro(e.pts[Math.floor(e.pts.length / 2)], lim.segs)) dentroN++;
    const pctDentro = 100 * dentroN / ar.length;
    const dentroT = pctDentro > 0;
    // ¿tiene calles de pueblo? residential/living_street CON nombre es tejido urbano
    const callesConNombre = ar.filter((e) => ['residential', 'living_street', 'pedestrian', 'footway']
      .includes(e.highway) && NOM.get(e.way)).length;
    filas.push({ k, n: g.comp.tamanos[k], ar: ar.length, L, cx, cy, nombres, hws,
      dCont, dLim, dens, dentroT, pctDentro, callesConNombre });
  }
  filas.sort((a, b) => b.L - a.L);

  // ⭐⭐ DOS EJES, NO UNO. Mi primer clasificador ponía la cercanía al límite por
  //    delante de todo, y con eso metía en "artefacto" un pueblo entero de 294
  //    nodos y 317 calles con nombre. Estar pegado al borde es LA CAUSA de que
  //    esté suelto, no una razón para no mirarlo: el vecino de ese pueblo sigue
  //    sin poder llegar. Un solo eje mezcla QUÉ es con POR QUÉ está suelto, y el
  //    segundo se come al primero. AGRUPAR ES BORRAR.
  const queEs = (f) => {
    if (f.pctDentro < 50) return 'tejido de OTRO municipio que asoma al término';
    if (f.callesConNombre >= 5 && f.n >= 10) return '⚠️ TEJIDO URBANO DEL TÉRMINO (calles con nombre)';
    if (f.callesConNombre >= 1) return 'unas pocas calles con nombre';
    if (f.L < 200) return 'islote de geometría (<200 m)';
    return 'pistas y caminos sin nombre';
  };
  const porQue = (f) => {
    if (!f.dentroT) return 'está FUERA del término (cola de un way que se sale)';
    if (f.pctDentro < 50) return 'menos de la mitad cae dentro: es de otro municipio';
    if (f.dLim < 300) return 'el límite municipal corta el dato (<300 m del borde)';
    if (f.dCont < 5) return 'toca casi el continente (<5 m): defecto de mapeado';
    if (f.dCont < 50) return 'hueco de mapeado (5-50 m del continente)';
    return 'aislada de verdad, lejos del continente y del borde';
  };
  const clases = {}, causas = {};
  for (const f of filas) {
    f.que = queEs(f); f.causa = porQue(f);
    clases[f.que] = (clases[f.que] || 0) + 1;
    causas[f.causa] = (causas[f.causa] || 0) + 1;
  }
  log('');
  log('   ⭐ QUÉ SON (ley 29 — "urbano" se mide por calles con nombre, no por tamaño):');
  for (const [c, n] of Object.entries(clases).sort((a, b) => b[1] - a[1])) log('      ' + String(n).padStart(4) + '  ' + c);
  log('');
  log('   ⭐ POR QUÉ ESTÁN SUELTAS (eje distinto: la causa no cancela el qué):');
  for (const [c, n] of Object.entries(causas).sort((a, b) => b[1] - a[1])) log('      ' + String(n).padStart(4) + '  ' + c);
  const graves = filas.filter((f) => f.que.startsWith('⚠️'));
  log('');
  di('⇒ componentes de TEJIDO URBANO aisladas', graves.length
    + (graves.length ? '  ⚠️⚠️ COSTURA: hay que avisar DESTACADO' : '  ✅ ninguna'));
  for (const f of graves) {
    const gr = aGrados(f.cx, f.cy);
    log('        ⚠️ comp ' + String(f.k).padStart(3) + ' · ' + String(f.n).padStart(4) + ' nodos · '
      + f.L.toFixed(0).padStart(6) + ' m · ' + f.callesConNombre + ' calles con nombre');
    log('             ' + (f.nombres.slice(0, 3).join(' | ') || 'sin nombre'));
    log('             ' + gr[1].toFixed(5) + ',' + gr[0].toFixed(5)
      + '   https://www.openstreetmap.org/#map=16/' + gr[1].toFixed(5) + '/' + gr[0].toFixed(5));
    log('             dentro del término: ' + f.pctDentro.toFixed(0) + ' %   ·   causa: ' + f.causa);
  }

  log('');
  log('   ⭐ LAS 20 MAYORES, UNA A UNA  (agrupar es borrar):');
  for (const f of filas.slice(0, 20)) {
    const gr = aGrados(f.cx, f.cy);
    log('');
    log('      comp ' + String(f.k).padStart(4) + ' · ' + String(f.n).padStart(4) + ' nodos · '
      + String(f.ar).padStart(4) + ' aristas · ' + f.L.toFixed(0).padStart(6) + ' m');
    log('           ' + gr[1].toFixed(5) + ', ' + gr[0].toFixed(5)
      + '   https://www.openstreetmap.org/#map=17/' + gr[1].toFixed(5) + '/' + gr[0].toFixed(5));
    log('           al continente ' + (Number.isFinite(f.dCont) ? f.dCont.toFixed(1) + ' m' : '>5 km')
      + '   ·  al LÍMITE MUNICIPAL ' + (f.dLim / 1000).toFixed(2) + ' km'
      + '   ·  dentro del término ' + f.pctDentro.toFixed(0) + ' %');
    log('           densidad máx ' + f.dens + ' nodos/150 m   ·   calles con nombre ' + f.callesConNombre);
    log('           highway=' + f.hws.join(',') + '   nombre: ' + (f.nombres.length ? f.nombres.slice(0, 3).join(' | ') : '⚠️ SIN NOMBRE'));
    log('           ⇒ ' + f.que + '   ·   causa: ' + f.causa);
  }
}

// ── C3 · LAS TRES CONTRAPRUEBAS ──────────────────────────────────────────────
linea('C3 · ⭐⭐ LAS TRES CONTRAPRUEBAS, A ESCALA DE CIUDAD');

log('');
log('   [1] BORRAR UNA UNIÓN QUE JUNTA DOS PARTES GRANDES');
log('       ⚠️ NO al azar entre articulaciones: 341 de 458 del casco eran colgantes y la');
log('          prueba pasaba por construcción. Se elige la que deja MÁS nodos en el lado');
log('          pequeño — el caso más exigente para el contador, no el más cómodo.');
{
  const arts = articulacionesConTamano(g.nodos, g.ady);
  const conMenor = arts.filter((a) => Number.isFinite(a.menor));
  conMenor.sort((a, b) => b.menor - a.menor);
  di('aristas de articulación', arts.length);
  di('colgantes (lado menor = 1 nodo)', conMenor.filter((a) => a.menor <= 1).length);
  di('que parten >= 100 nodos', conMenor.filter((a) => a.menor >= 100).length);
  const el = conMenor[0];
  const e = g.aristas[el.arista];
  di('⇒ elegida: lado menor', el.menor + ' nodos');
  const m = e.pts[Math.floor(e.pts.length / 2)];
  const gr = aGrados(m[0], m[1]);
  log(`       arista ${el.arista} · way ${e.way} · ${e.highway} · ${e.largo.toFixed(1)} m · ${NOM.get(e.way) || '(sin nombre)'}`);
  log(`       ${gr[1].toFixed(5)}, ${gr[0].toFixed(5)}`);
  const antes = g.comp, dsp = contarComponentes(g.nodos, g.aristas, el.arista);
  const mA = Math.max(...antes.tamanos), mD = Math.max(...dsp.tamanos);
  log(`       componentes   antes: ${antes.n}       después: ${dsp.n}`);
  log(`       mayor         antes: ${mA}   después: ${mD}   (pierde ${mA - mD} nodos)`);
  log(`       ⇒ ${dsp.n > antes.n && mD < mA ? '✅ ROJO: el contador lo detecta, y el tamaño de la mayor baja' : '⛔ NO LO DETECTA'}`);
}

log('');
log('   [2] FORZAR UN CRUCE FALSO -> ¿aparece como unido-por-defecto?');
{
  const recorte = osm.proyectar(osm.recortar(todos, ZONA_TERMINO));
  const cx = 676000, cy = 4614000;
  const inv = (id, p1, p2, tags) => ({ id, nodes: [id * 10 + 1, id * 10 + 2],
    tags: tags || { highway: 'residential' }, pts: [p1, p2],
    geometry: [{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }] });
  const base = g.contadores;
  const r2 = planarizar([...recorte, inv(999000001, [cx - 50, cy], [cx + 50, cy]), inv(999000002, [cx, cy - 50], [cx, cy + 50])]);
  log(`       unido-por-defecto antes: ${base.unidoPorDefecto}   con el cruce plantado: ${r2.contadores.unidoPorDefecto}`);
  log(`       ⇒ ${r2.contadores.unidoPorDefecto > base.unidoPorDefecto ? '✅ ROJO: D2 lo caza y lo cuenta' : '⛔ NO LO CAZA'}`);
  const r3 = planarizar([...recorte,
    inv(999000003, [cx - 50, cy + 200], [cx + 50, cy + 200]),
    inv(999000004, [cx, cy + 150], [cx, cy + 250], { highway: 'residential', layer: '1', bridge: 'yes' })]);
  log(`       ⭐ control complementario — el mismo cruce con bridge+layer=1:`);
  log(`          no-conectados antes: ${base.cortesNoConectados}   después: ${r3.contadores.cortesNoConectados}`);
  log(`          ⇒ ${r3.contadores.cortesNoConectados > base.cortesNoConectados ? '✅ D1 lo separa por evidencia positiva' : '⛔ D1 no distingue'}`);
}

log('');
log('   [3] MOVER EL DATO 2 km -> ¿produce basura o disimula?');
log('       ⭐ si los contadores no se inmutan al desplazar la ciudad entera, es que');
log('          no dependen de dónde están las cosas, y entonces no miden geometría.');
{
  const recorte = osm.proyectar(osm.recortar(todos, ZONA_TERMINO));
  const movido = recorte.map((w) => ({ ...w, pts: w.pts.map((p) => [p[0] + 2000, p[1] + 2000]) }));
  const rm = planarizar(movido);
  const b = g.contadores, d = rm.contadores;
  log(`       nodos              ${String(b.nodos).padStart(7)} -> ${String(d.nodos).padStart(7)}`);
  log(`       aristas            ${String(b.aristas).padStart(7)} -> ${String(d.aristas).padStart(7)}`);
  log(`       cortes geométricos ${String(b.cortesGeometricos).padStart(7)} -> ${String(d.cortesGeometricos).padStart(7)}`);
  log(`       unido-por-defecto  ${String(b.unidoPorDefecto).padStart(7)} -> ${String(d.unidoPorDefecto).padStart(7)}`);
  log(`       puntas soldadas    ${String(b.puntasSoldadas).padStart(7)} -> ${String(d.puntasSoldadas).padStart(7)}`);
  const igual = b.nodos === d.nodos && b.aristas === d.aristas
    && b.cortesGeometricos === d.cortesGeometricos && b.unidoPorDefecto === d.unidoPorDefecto;
  log(`       ⇒ ${igual ? '✅ invariante a la traslación: el planarizado mide FORMA, no coordenadas absolutas' : '⛔ CAMBIA — depende de dónde esté la ciudad, y eso es un fallo'}`);
  // ⭐ y el contrario, que es el que de verdad puede ponerse rojo: deformar el dato
  const roto = recorte.map((w) => ({ ...w, pts: w.pts.map((p, i) => [p[0] + (i % 2) * 30, p[1]]) }));
  const rr = planarizar(roto);
  log(`       ⭐ contraprueba de la contraprueba — se DEFORMA el dato (zigzag de 30 m):`);
  log(`          aristas ${b.aristas} -> ${rr.contadores.aristas}   cortes ${b.cortesGeometricos} -> ${rr.contadores.cortesGeometricos}`);
  log(`          ⇒ ${rr.contadores.cortesGeometricos !== b.cortesGeometricos ? '✅ el planarizado SÍ reacciona a la geometría: la invarianza de arriba significa algo' : '⛔ no reacciona a nada — la prueba de traslación no probaba nada'}`);
}

// ── C5 · RUTAS DE CORDURA ────────────────────────────────────────────────────
linea('C5 · RUTAS DE CORDURA — travesías largas de la ciudad');
log('   ⚠️ una ruta MÁS CORTA que la recta es imposible. Si pasa, el grafo está roto.');
{
  const R = require('./rios');
  const urbanos = R.nodosUrbanos(g.nodos, g.ady);
  const rnd = rng(20260803);
  let ok = 0, imposible = 0, sinCamino = 0;
  const rodeos = [];
  const filas = [];
  let intentos = 0;
  while (filas.length < 15 && intentos < 100000) {
    intentos++;
    const a = urbanos[Math.floor(rnd() * urbanos.length)], b = urbanos[Math.floor(rnd() * urbanos.length)];
    if (a === b) continue;
    const recta = dist([g.nodos[a].x, g.nodos[a].y], [g.nodos[b].x, g.nodos[b].y]);
    if (recta < 3000) continue;                       // TRAVESÍAS, no paseos
    const r = G.dijkstra(g.ady, a);
    const m = r.dist[b];
    filas.push({ a, b, recta, m });
  }
  for (const f of filas) {
    const ga = aGrados(g.nodos[f.a].x, g.nodos[f.a].y), gb = aGrados(g.nodos[f.b].x, g.nodos[f.b].y);
    let est;
    if (!Number.isFinite(f.m)) { est = '⛔ SIN CAMINO'; sinCamino++; }
    else if (f.m < f.recta - 0.001) { est = '⛔⛔ RODEO < 1 — IMPOSIBLE'; imposible++; }
    else { est = '✅ rodeo ' + (f.m / f.recta).toFixed(2); ok++; rodeos.push(f.m / f.recta); }
    log('      ' + (f.recta / 1000).toFixed(2) + ' km recta -> '
      + (Number.isFinite(f.m) ? (f.m / 1000).toFixed(2) + ' km' : '  —  ').padStart(8)
      + '   ' + est.padEnd(24) + ga[1].toFixed(4) + ',' + ga[0].toFixed(4) + ' -> ' + gb[1].toFixed(4) + ',' + gb[0].toFixed(4));
  }
  rodeos.sort((a, b) => a - b);
  log('');
  di('con camino', `${ok} de ${filas.length}`);
  di('sin camino', sinCamino);
  di('⛔ rodeos imposibles (<1)', imposible + (imposible === 0 ? '  ✅' : '  ⛔ EL GRAFO ESTÁ ROTO'));
  di('rodeo mediano', rodeos.length ? rodeos[Math.floor(rodeos.length / 2)].toFixed(2) : '—');
  di('rodeo peor', rodeos.length ? rodeos[rodeos.length - 1].toFixed(2) : '—');
}

// ── C6 · CUENTA A MANO, OTRA VEZ ─────────────────────────────────────────────
linea('C6 · ⭐ CUENTA A MANO — los 10 cruces conocidos, ¿siguen estando al escalar?');
log('   ⭐ El control positivo NO lo elige quien escribió el instrumento (ley 17): salen');
log('      del crudo de la TANDA 3 —otro fichero, otra fecha, otra consulta.');
{
  const d3 = JSON.parse(fs.readFileSync(CRUDO_TANDA3, 'utf8'));
  const w3 = d3.elements.filter((e) => e.type === 'way' && e.nodes && (e.tags || {}).highway);
  const uso = new Map(), coord = new Map();
  for (const e of d3.elements) if (e.type === 'node' && e.lat !== undefined) coord.set(e.id, { lat: e.lat, lon: e.lon });
  for (const w of w3) for (const n of w.nodes) uso.set(n, (uso.get(n) || 0) + 1);
  const cands = [...uso.entries()].filter(([n, k]) => k >= 3 && coord.has(n))
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 10);
  let ok = 0, okPie = 0;
  for (const [n, k] of cands) {
    const p = aMetros(coord.get(n).lon, coord.get(n).lat);
    let mejor = -1, md = Infinity;
    for (let i = 0; i < g.nodos.length; i++) {
      const d = Math.hypot(g.nodos[i].x - p[0], g.nodos[i].y - p[1]);
      if (d < md) { md = d; mejor = i; }
    }
    const gPie = g.ady[mejor] ? g.ady[mejor].length : 0;
    const gTot = g.aristas.filter((e) => e.a === mejor || e.b === mejor).length;
    const bien = md <= 1.0 && gTot >= 3;
    if (bien) ok++;
    if (gPie >= 3) okPie++;
    log(`      nodo OSM ${String(n).padEnd(12)} ${k} ways -> grafo ${String(mejor).padStart(6)} a ${md.toFixed(2)} m  grado total ${gTot} / a pie ${gPie}  ${bien ? '✅' : '⛔'}`);
  }
  log(`   ⇒ ${ok} de ${cands.length} cruces CONSTRUIDOS   (en el casco de la tanda 8: 10 de 10)`);
  log(`   ⇒ ${okPie} de ${cands.length} utilizables A PIE  (en el casco de la tanda 8: 8 de 10)`);
}

log('');
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
