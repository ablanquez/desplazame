// A · ⭐⭐ LOS ROJOS DE LOS GUARDIANES, PROVOCADOS A PROPÓSITO.
//
// ⭐ Ley del proyecto: *un guardián cuyo rojo nadie ha provocado es una promesa,
//    no una red.* Aquí se rompen las cuatro cosas que los guardianes de la tanda
//    12 dicen proteger, y se comprueba que cada uno se pone rojo — y, lo que
//    importa igual, que el MISMO caso sin romper sale verde.
//
// ⚠️ El positivo de control no es decorativo: sin él, un guardián que dijera
//    siempre "rojo" pasaría estas cuatro pruebas.
//
//   node src/probar-guardianes.js

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const R = require('./ruta');
const G = require('./grafo');
const { aGrados } = require('./geo');

const L = [];
const di = (k, v) => L.push(`   ${String(k).padEnd(56)} ${v}`);
let todo = true;
const exige = (etq, ok, detalle) => {
  if (!ok) todo = false;
  di(etq, (ok ? '✅' : '⛔ NO SE PUSO ROJO') + (detalle ? '   ' + detalle : ''));
};

L.push('='.repeat(100));
L.push('A · LOS ROJOS PROVOCADOS DE LOS CUATRO GUARDIANES');

// ── G1 · la zona es obligatoria ──────────────────────────────────────────────
L.push('');
L.push('G1 · ⛔ `construir()` SIN ZONA — el valor por defecto que contestaba con el casco');
{
  let salto = null;
  try { R.construir(); } catch (e) { salto = e.message; }   // PROVOCACIÓN deliberada (ver auditoria-grafo.js)
  exige('rojo: construir() sin argumento', !!salto, salto ? salto.slice(0, 46) + '…' : '');
  let ok = false;
  try { R.construir(R.ZONA_CASCO); ok = true; } catch (e) { ok = false; }
  di('positivo de control: construir(ZONA_CASCO)', ok ? '✅ verde — no dice rojo a todo' : '⛔ falla también lo bueno');
  if (!ok) todo = false;
}

// ── G2 · el auditor estático ─────────────────────────────────────────────────
L.push('');
L.push('G2 · ⛔ UN FICHERO NUEVO QUE LLAMA A `construir()` SIN ZONA');
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-guardian-'));
  const limpio = path.join(tmp, 'inocente.js');
  fs.writeFileSync(limpio, "const { construir, ZONA_TERMINO } = require('./ruta');\nconst g = construir(ZONA_TERMINO);\n");
  const correr = () => {
    try { execFileSync(process.execPath, [__dirname + '/auditoria-grafo.js', tmp], { encoding: 'utf8' }); return 0; }
    catch (e) { return e.status; }
  };
  di('positivo de control: solo el fichero limpio', correr() === 0 ? '✅ verde' : '⛔ ya sale rojo sin motivo');
  if (correr() !== 0) todo = false;
  fs.writeFileSync(path.join(tmp, 'descuidado.js'), "const { construir } = require('./ruta');\nconst g = construir();\n");
  exige('rojo: se añade un fichero con construir() a secas', correr() === 1);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ── G3 · el punto fuera del grafo ────────────────────────────────────────────
L.push('');
L.push('G3 · ⛔ UN ORIGEN A MÁS DE ' + R.MAX_ENGANCHE_M + ' m DEL GRAFO — el caso de los 512 m');
{
  const g = R.construir(R.ZONA_CASCO);
  // ⭐ el caso REAL que lo destapó: un punto de la ciudad preguntado al grafo del
  //    casco. Antes contestaba una ruta desde 512 m más allá y decía `encontrada`.
  let salto = null;
  try { R.resolver(g, 41.6255, -0.8865, 41.6516, -0.8797); } catch (e) { salto = e.message; }
  exige('rojo: punto de Delicias contra el grafo del casco', !!salto);
  let ok = false;
  try { ok = R.resolver(g, 41.6563, -0.8783, 41.6516, -0.8797).encontrada; } catch (e) { ok = false; }
  di('positivo de control: dos puntos del casco', ok ? '✅ verde — contesta la ruta' : '⛔ falla también lo bueno');
  if (!ok) todo = false;
}

// ── G4 · el imposible físico ─────────────────────────────────────────────────
L.push('');
L.push('G4 · ⛔⛔ UNA ARISTA QUE TELETRANSPORTA — rodeo por debajo de 1');
{
  const g = R.construir(R.ZONA_CASCO);
  // dos nodos lo más lejos posible DENTRO DE LA COMPONENTE MAYOR.
  // ⚠️ "dentro de la mayor" no es un adorno: dos nodos de componentes distintas no
  //    tienen ruta, y entonces el positivo de control fallaría por falta de camino
  //    en vez de por el sabotaje — y el rojo de después no probaría nada.
  const mayor = g.comp.tamanos.indexOf(Math.max(...g.comp.tamanos));
  let a = -1, b = -1, mejor = 0;
  const paso = Math.max(1, Math.floor(g.nodos.length / 400));
  for (let i = 0; i < g.nodos.length; i += paso) {
    if (g.comp.comp[i] !== mayor) continue;
    for (let j = i + paso; j < g.nodos.length; j += paso) {
      if (g.comp.comp[j] !== mayor) continue;
      const d = Math.hypot(g.nodos[i].x - g.nodos[j].x, g.nodos[i].y - g.nodos[j].y);
      if (d > mejor) { mejor = d; a = i; b = j; }
    }
  }
  // ⚠️ aGrados devuelve [lon, lat], no {lat, lon}. Leerlo al revés hizo que el
  //    rojo de este guardián saltara POR OTRO MOTIVO (bitácora nº71).
  const [lonA, latA] = aGrados(g.nodos[a].x, g.nodos[a].y);
  const [lonB, latB] = aGrados(g.nodos[b].x, g.nodos[b].y);
  const pa = { lat: latA, lon: lonA }, pb = { lat: latB, lon: lonB };
  di('los dos nodos elegidos distan', mejor.toFixed(0) + ' m   (los dos en la componente mayor)');

  // positivo de control ANTES de romper nada
  let antes = null;
  try { antes = R.resolver(g, pa.lat, pa.lon, pb.lat, pb.lon); } catch (e) { antes = null; }
  di('positivo de control: la ruta real entre ellos', antes && antes.encontrada
    ? '✅ ' + antes.metros.toFixed(0) + ' m, rodeo físico ' + antes.rodeoFisico : '⛔ no se resolvió');
  if (!antes || !antes.encontrada) todo = false;

  // ⛔ AHORA SE ROMPE: una arista de 1 m entre dos nodos separados 2 km.
  g.aristas.push({ a, b, largo: 1, way: 999999999, highway: 'ARISTA-QUE-TELETRANSPORTA',
    precision: 'eje-de-calzada', pie: true, condicional: false, unidoPorDefecto: false,
    pts: [[g.nodos[a].x, g.nodos[a].y], [g.nodos[b].x, g.nodos[b].y]] });
  const i = g.aristas.length - 1;
  g.ady[a].push({ n: b, w: 1, e: i });
  g.ady[b].push({ n: a, w: 1, e: i });
  delete g._idxAristas;                       // que el enganche vuelva a indexar
  g.comp = G.componentes(g.nodos, g.ady);

  let salto = null, colado = null;
  try { colado = R.resolver(g, pa.lat, pa.lon, pb.lat, pb.lon); } catch (e) { salto = e.message; }
  exige('rojo: la ruta mide menos que la línea recta', !!salto,
    salto ? salto.slice(0, 60) + '…' : 'devolvió ' + (colado && colado.metros) + ' m con encontrada:' + (colado && colado.encontrada));
}

L.push('');
L.push(todo ? '   ⇒ ✅ LOS CUATRO GUARDIANES SE HAN VISTO EN ROJO, y ninguno dice rojo a todo.'
  : '   ⇒ ⛔ HAY UN GUARDIÁN QUE NO SE PONE ROJO CUANDO DEBE.');
console.log(L.join('\n'));
if (!todo) process.exit(1);
