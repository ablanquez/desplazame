// A3 · ⛔⛔ LOS ROJOS DE LA ALARMA, PROVOCADOS — y el invariante sobre todo `src/`.
//
// ⭐ El invariante que se defiende, y que la tanda 12 no defendía:
//       si la salida declara un fallo, el código de salida NO puede ser 0.
//
// ⚠️ Y el invariante se comprueba sobre la MARCA de la alarma (`⛔ FALLO ·`,
//    `⛔⛔ IMPOSIBLE ·`), no sobre el símbolo `⛔` suelto. El símbolo se usa
//    también como prosa —"⛔ NO se copian los portales"— y contarlo daría un
//    número inflado: en la primera auditoría salieron 10 sospechosos y, al
//    clasificar las líneas a mano, **solo uno era un fallo de verdad**.
//
//   node src/probar-paradas.js
//   node src/probar-paradas.js --todo    (además, ejecuta todos los scripts de src/)

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('./alarma');

const L = [];
const di = (k, v) => L.push(`   ${String(k).padEnd(58)} ${v}`);
let todo = true;
const exige = (etq, ok, detalle) => {
  if (!ok) todo = false;
  di(etq, (ok ? '✅' : '⛔ NO PASA') + (detalle ? '   ' + detalle : ''));
};

/** Ejecuta un trozo de código en un proceso nuevo y devuelve {codigo, salida}. */
function correr(codigo) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-parada-'));
  const f = path.join(tmp, 'prueba.js');
  fs.writeFileSync(f, codigo.replace('<<ALARMA>>', JSON.stringify(path.join(__dirname, 'alarma.js'))));
  const r = spawnSync(process.execPath, [f], { encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return { codigo: r.status, salida: (r.stdout || '') + (r.stderr || '') };
}

L.push('='.repeat(100));
L.push('A3 · ⛔⛔ LOS DOS TIPOS DE PARADA, PROVOCADOS');

// ── P1 · fallo de expectativa: se anota, se sigue, y el proceso sale en rojo ──
L.push('');
L.push('P1 · FALLO DE EXPECTATIVA — una ruta de cordura que no se resuelve');
L.push('   el script sigue midiendo (hay que ver TODOS los fallos, no solo el primero)');
L.push('   pero ya no puede terminar en 0.');
{
  const r = correr(`
    const A = require(<<ALARMA>>);
    A.fallo('ruta de cordura SIN RESOLVER: Puerta del Carmen -> Magdalena');
    A.fallo('otra más, para ver que se ven las dos');
    console.log('EL-SCRIPT-SIGUE-Y-TERMINA-NORMALMENTE');
  `);
  exige('rojo: código de salida distinto de 0', r.codigo === 1, 'código ' + r.codigo);
  exige('  y el script SÍ siguió hasta el final', r.salida.includes('EL-SCRIPT-SIGUE-Y-TERMINA-NORMALMENTE'));
  exige('  y se ven LOS DOS fallos, no solo el primero',
    (r.salida.match(/⛔ FALLO ·/g) || []).length === 2);
  // ⭐ positivo de control: sin fallo, el mismo camino de código sale en 0
  const c = correr(`
    const A = require(<<ALARMA>>);
    A.exige(true, 'esto no debería anotarse');
    console.log('SIN-FALLOS');
  `);
  exige('positivo de control: sin fallos sale en 0', c.codigo === 0, 'código ' + c.codigo);
}

// ── P2 · imposibilidad física: lanza en el acto ──────────────────────────────
L.push('');
L.push('P2 · IMPOSIBILIDAD FÍSICA — un rodeo por debajo de 1');
L.push('   no se anota: se lanza. Seguir midiendo con un instrumento que acaba de');
L.push('   decir un absurdo no tiene sentido.');
{
  const r = correr(`
    const A = require(<<ALARMA>>);
    A.imposible('la ruta mide 1.0 m entre dos puntos separados 2744 m');
    console.log('ESTO-NO-SE-TIENE-QUE-VER');
  `);
  exige('rojo: código de salida distinto de 0', r.codigo !== 0, 'código ' + r.codigo);
  exige('  y el script NO siguió', !r.salida.includes('ESTO-NO-SE-TIENE-QUE-VER'));
  exige('  y la marca IMPOSIBLE está en la salida', r.salida.includes(A.MARCA_IMPOSIBLE));
}

// ── P3 · el caso real que costó dos tandas ───────────────────────────────────
L.push('');
L.push('P3 · ⭐⭐ EL CASO REAL — la ruta de cordura del casco que estuvo rota dos tandas');
L.push('   `Puerta del Carmen → Magdalena`, publicada en H1-PRIMER-GRAFO §C4d como');
L.push('   correcta, daba `⛔ componentes-distintas` y el proceso salía en 0.');
{
  // ⭐ se comprueba de verdad: se le quitan los pasos condicionales al grafo del
  //    casco —que es lo que la rompió en la tanda 11— y tiene que salir en ROJO.
  const r = correr(`
    const A = require(<<ALARMA>>);
    const R = require(${JSON.stringify(path.join(__dirname, 'ruta.js'))});
    const g = R.construir(R.ZONA_CASCO, { sinCondicionales: true });
    let res;
    try { res = R.resolver(g, 41.6503, -0.8843, 41.6540, -0.8722); }
    catch (e) { res = { encontrada: false, motivo: e.message.slice(0, 40) }; }
    A.exige(res.encontrada, 'ruta de cordura SIN RESOLVER: Puerta del Carmen -> Magdalena (' + res.motivo + ')');
    console.log('el informe termina igual, pero el proceso no puede salir en verde');
  `);
  exige('con los pasos condicionales FUERA, la ruta se rompe y PARA', r.codigo === 1, 'código ' + r.codigo);
  const l = (r.salida.split('\n').find((x) => x.includes('⛔ FALLO ·')) || '').trim();
  if (l) L.push('      ' + l.slice(0, 96));
  // ⭐ POSITIVO DE CONTROL: con la decisión de la tanda 12 puesta, la misma ruta va
  const c = correr(`
    const A = require(<<ALARMA>>);
    const R = require(${JSON.stringify(path.join(__dirname, 'ruta.js'))});
    const g = R.construir(R.ZONA_CASCO);
    const res = R.resolver(g, 41.6503, -0.8843, 41.6540, -0.8722);
    A.exige(res.encontrada, 'no debería fallar');
    console.log('METROS=' + res.metros);
  `);
  exige('positivo de control: con los pasos DENTRO, la misma ruta resuelve', c.codigo === 0,
    (c.salida.match(/METROS=[\d.]+/) || [''])[0]);
}

// ── P4 · el invariante sobre todo src/ ───────────────────────────────────────
if (process.argv.includes('--todo')) {
  L.push('');
  L.push('P4 · ⭐ EL INVARIANTE SOBRE TODO `src/` — ejecuta todos los scripts');
  const MODULOS = new Set(['geo.js', 'grafo.js', 'osm.js', 'planarizar.js', 'portales.js',
    'enganche.js', 'condicionales.js', 'direccion.js', 'limite.js', 'rios.js', 'alarma.js',
    path.basename(__filename), 'auditoria-paradas.js']);
  const fics = fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && !MODULOS.has(f)).sort();
  for (const f of fics) {
    const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 900000 });
    const salida = (r.stdout || '') + (r.stderr || '');
    const declara = salida.includes(A.MARCA_FALLO) || salida.includes(A.MARCA_IMPOSIBLE);
    const ok = !declara || r.status !== 0;
    if (!ok) todo = false;
    L.push('   ' + f.padEnd(26) + 'código ' + String(r.status).padEnd(8)
      + (declara ? 'DECLARA FALLO  ' : 'sin fallos     ')
      + (ok ? '✅' : '⛔ DECLARA UN FALLO Y SALE EN 0'));
  }
} else {
  L.push('');
  L.push('P4 · ⚠️ el invariante sobre todo `src/` NO se ha ejecutado (falta `--todo`).');
  L.push('   ⛔ y eso NO significa que pase: significa que no se ha mirado.');
}

L.push('');
L.push(todo ? '   ⇒ ✅ UN FALLO DETECTADO YA NO PUEDE TERMINAR EN VERDE.'
  : '   ⇒ ⛔ HAY UN CAMINO POR EL QUE UN FALLO SIGUE SALIENDO EN 0.');
console.log(L.join('\n'));
if (!todo) process.exit(1);
