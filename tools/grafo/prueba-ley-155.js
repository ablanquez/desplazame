// ⭐⭐⭐ LEY 155 · EL EXPERIMENTO QUE MATARÍA LA EXPLICACIÓN DE AYER
//
// ═════════════════════════════════════════════════════════════════════════════
// LA AFIRMACIÓN QUE SE PONE A PRUEBA
// ═════════════════════════════════════════════════════════════════════════════
//   La tanda de arreglo 8 midió que **58 de 60 edificios tienen puertas candidatas
//   compartiendo arista** y que, aun así, **ninguno cambió de puerta ni de metros**
//   (`docs/H1-ARREGLO-8-MISMA-ARISTA.md` §6). La causa que se propuso allí,
//   marcada `CAUSA NO CONFIRMADA`:
//
//     «desde un origen LEJANO el coste lo domina la aproximación, y los atajos de
//      unos metros dentro del racimo de puertas no cambian el orden»
//
//   ⇒ ⭐⭐ SU PREDICCIÓN FALSABLE: **un origen que SÍ comparta arista con una puerta
//     candidata TIENE que cambiar.** Si no cambia, la explicación es FALSA y la
//     causa vuelve a `NO CONSTA`.
//
// ⛔ Esto NO toca `src/grafo.js` ni nada de H1: mide, y el «antes» se consigue
//    pasándole a `rutaAEdificio` un `G` con el `insertar` de antes del arreglo —
//    el mismo truco de `tools/grafo/efecto-arreglo.js`, que ya trae su positivo
//    de control.
//
//   node tools/grafo/prueba-ley-155.js

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const D = require('../../src/direccion');
const Pu = require('../../src/puerta');
const Co = require('../../src/condicionales');
const En = require('../../src/entradas');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);

/** ⛔ El `insertar` de ANTES del arreglo, reconstruido. */
function insertarViejo(aristas, ady, nodos, p) {
  const e = aristas[p.arista];
  const antes = G.alLargoDeLaArista(e, p);
  const resto = Math.max(0, e.largo - antes);
  const id = nodos.length;
  nodos.push({ x: p.q[0], y: p.q[1], temporal: true });
  ady.push([]);
  const enlaza = (n, w) => { ady[id].push({ n, w, e: p.arista }); ady[n].push({ n: id, w, e: p.arista }); };
  enlaza(e.a, antes);
  enlaza(e.b, resto);
  return id;
}
const G_VIEJO = { ...G, insertar: insertarViejo };

raya();
log('LEY 155 · ¿ES CIERTA LA EXPLICACIÓN DE AYER? — el experimento que la mataría');
raya();

const g = R.construir(R.ZONA_TERMINO);
const ctx = D.abrir(g, R.CRUDO);
const Ent = En.cargar();
const Ed = Co.edificios();
di('grafo (ley 148)', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P0 · ⭐ EL POSITIVO DE CONTROL DEL «ANTES» — sin él, el antes es una suposición');
raya('─');
{
  const de = (v, n) => ctx.enganche.portales.find((o) => o.enganchado && o.via
    && o.via.nombre === v && String(o.numero) === n);
  const x = de('CALLE ALFONSO I', '12'), y = de('CALLE ALFONSO I', '17');
  if (A.exige(!!x && !!y && x.arista === y.arista, 'el control ALFONSO I 12×17 ha desaparecido')) {
    const nodos = g.nodos.slice(); const ady = g.ady.map((l) => l.slice());
    const a = insertarViejo(g.aristas, ady, nodos, x);
    const b = insertarViejo(g.aristas, ady, nodos, y);
    const v = Math.round(G.dijkstra(ady, a).dist[b] * 10) / 10;
    const nuevo = G.rutaEntre(g, x, y).metros;
    di('CALLE ALFONSO I 12 × 17 · antes reconstruido', v + ' m   (la tanda 8 lo vio en rojo a 32,5 m)');
    di('                        · con el arreglo', nuevo + ' m');
    A.exige(Math.abs(v - 32.5) < 0.06, `el «antes» da ${v} m y el rojo de la tanda 8 fue 32,5 m`);
    A.exige(Math.abs(nuevo - 11.9) < 0.06, `el «después» da ${nuevo} m y la verdad son 11,9 m`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// P1 · LOS CASOS: un edificio Y UN ORIGEN QUE COMPARTE ARISTA CON UNA CANDIDATA
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P1 · LOS CASOS — origen SOBRE la arista de una puerta candidata');
raya('─');
log('   Criterio, declarado y determinista: se recorren los edificios en el orden');
log('   del fichero; para cada uno se piden sus puertas candidatas y se busca un');
log('   PORTAL REAL del callejero que cuelgue de la arista de alguna de ellas y que');
log('   NO sea la candidata misma. Los 25 primeros que salen. ⛔ No se eligen los');
log('   que dan bonito: se para en cuanto hay 25.');

// índice arista → portales, para encontrar el origen deprisa
const porArista = new Map();
for (const o of ctx.enganche.portales) {
  if (!o.enganchado) continue;
  if (!porArista.has(o.arista)) porArista.set(o.arista, []);
  porArista.get(o.arista).push(o);
}

const TOPE = 25;
const casos = [];
for (const poli of Ed.polis) {
  if (casos.length >= TOPE) break;
  let ac;
  try { ac = Pu.accesos(poli, g.aristas, ctx.eng, Ent); } catch (_) { continue; }
  if (!ac || !ac.cands || ac.cands.length < 2) continue;
  for (const c of ac.cands) {
    const lista = porArista.get(c.arista);
    if (!lista || !lista.length) continue;
    // el origen: el portal de esa arista más lejano de la candidata, para que el
    // enlace nuevo tenga algo que ahorrar. ⭐ El criterio se fija aquí, no después.
    const e = g.aristas[c.arista];
    const sc = G.alLargoDeLaArista(e, c);
    let mejor = null, dmax = -1;
    for (const o of lista) {
      const d = Math.abs(G.alLargoDeLaArista(e, o) - sc);
      if (d > dmax) { dmax = d; mejor = o; }
    }
    if (mejor && dmax > 1) { casos.push({ poli, origen: mejor, arista: c.arista, sep: dmax }); break; }
  }
}
di('edificios recorridos hasta juntar los casos', casos.length + ' casos');
A.exige(casos.length > 0, 'no se ha podido montar ni un caso: el experimento no se puede hacer');

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P2 · ⭐⭐⭐ LA PREDICCIÓN, Y LO QUE SALE');
raya('─');
log('   PREDICCIÓN de la explicación de ayer: si el origen comparte arista con una');
log('   candidata, el enlace nuevo SÍ entra en el camino ⇒ los metros TIENEN que');
log('   cambiar en una parte apreciable de los casos.');
log('   ⛔ Si NO cambian, la explicación de ayer es FALSA.');
log('');
log('   ' + 'edificio'.padEnd(30) + 'origen'.padEnd(26) + 'ANTES'.padStart(10)
  + 'DESPUÉS'.padStart(10) + 'Δ'.padStart(9) + '  ¿puerta?');
let cambiaMetros = 0, cambiaPuerta = 0, evaluados = 0;
const deltas = [];
for (const c of casos) {
  const vieja = Pu.rutaAEdificio(G_VIEJO, g, c.origen, c.poli, ctx.eng, Ent);
  const nueva = Pu.rutaAEdificio(G, g, c.origen, c.poli, ctx.eng, Ent);
  if (!vieja.encontrada || !nueva.encontrada) continue;
  evaluados++;
  const d = nueva.metros - vieja.metros;
  const dp = Math.hypot(vieja.puerta.m[0] - nueva.puerta.m[0], vieja.puerta.m[1] - nueva.puerta.m[1]);
  if (Math.abs(d) > 0.05) { cambiaMetros++; deltas.push(d); }
  if (dp > 0.5) cambiaPuerta++;
  log('   ' + String(c.poli.nombre || '(sin nombre) ' + c.poli.id).slice(0, 29).padEnd(30)
    + ((c.origen.via && c.origen.via.nombre ? c.origen.via.nombre : '?') + ' ' + c.origen.numero).slice(0, 25).padEnd(26)
    + (vieja.metros.toFixed(1) + ' m').padStart(10) + (nueva.metros.toFixed(1) + ' m').padStart(10)
    + ((d >= 0 ? '+' : '') + d.toFixed(1)).padStart(9)
    + (dp > 0.5 ? '   ⭐ cambia (' + dp.toFixed(1) + ' m)' : '   —'));
}
log('');
di('casos evaluados', evaluados);
di('⭐ casos donde CAMBIAN los metros', cambiaMetros + ' de ' + evaluados
  + '  (' + (evaluados ? (100 * cambiaMetros / evaluados).toFixed(1) : '—') + ' %)');
di('⭐ casos donde CAMBIA la puerta elegida', cambiaPuerta + ' de ' + evaluados);
if (deltas.length) {
  const s = deltas.slice().sort((a, b) => a - b);
  di('reparto de Δ (metros que se quitan)', `mín ${s[0].toFixed(1)} · p50 ${s[Math.floor(s.length / 2)].toFixed(1)} · máx ${s[s.length - 1].toFixed(1)}`);
}

log('');
raya('─');
log('P3 · ⭐⭐⭐ EL VEREDICTO SOBRE LA EXPLICACIÓN DE AYER');
raya('─');
if (evaluados === 0) {
  log('   ⚠️ NO CONSTA: no se ha podido evaluar ni un caso.');
} else if (cambiaMetros > 0) {
  log('   ✅ LA EXPLICACIÓN DE AYER SOBREVIVE. Con el origen SOBRE la arista de una');
  log('     candidata, los metros SÍ cambian en ' + cambiaMetros + ' de ' + evaluados + ' casos.');
  log('     ⇒ Que los 58 de 60 de ayer no se movieran era **inercia por construcción**');
  log('       —el origen estaba fuera— y no casualidad. La causa deja de ser NO CONFIRMADA.');
} else {
  log('   ⛔⛔ LA EXPLICACIÓN DE AYER ES FALSA. Ni un caso cambia ni con el origen');
  log('     sobre la arista de una candidata. ⇒ La causa vuelve a `NO CONSTA` y el');
  log('     §6 de `docs/H1-ARREGLO-8-MISMA-ARISTA.md` queda corregido en documento nuevo.');
}
// ⛔ el resultado NO se exige en ninguna dirección: las dos respuestas son
//    legítimas y forzar una sería fabricar el veredicto.

log('');
raya();
log(A.cierre('LEY 155 · LA EXPLICACIÓN DE AYER'));
