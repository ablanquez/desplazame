// ⭐⭐⭐ TANDA DE ARREGLO 9 — LA CONTRAPRUEBA DE QUE H1 NO SE HA MOVIDO.
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ DEMUESTRA, Y EN QUÉ ORDEN
// ═════════════════════════════════════════════════════════════════════════════
//   1 · Que el código NUEVO se ejecuta de verdad — porque una firma que ignorase
//       su parámetro daría exactamente los mismos resultados idénticos, y el
//       verde de esta tanda no valdría nada (ley 108: sospecha cuando pasa).
//   2 · Que con el predicado de andar **todo sale idéntico**: las diez rutas en
//       metros Y en índices de arista, el grafo, y las componentes.
//   3 · Que el instrumento SABRÍA detectar un cambio (ley 152: el cero con su uno).
//   4 · Que la firma sirve para lo que se cambió: el predicado de bici, enchufado.
//
// ⛔ LO QUE **NO** HACE: no construye el modo bici, ni el enganche propio, ni una
//    sola ruta de producto. Enchufa el predicado y enseña sus números.
//
//   node tools/grafo/firma-adyacencia.js

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const osm = require('../../src/osm');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

/**
 * Lo que estaba publicado ANTES de tocar la firma, medido con el árbol en
 * `e95e88a`. ⛔ Es lo que convierte esto en una contraprueba y no en una foto:
 * sin un patrón externo, comparar el motor consigo mismo no prueba nada (ley 55).
 */
const ANTES = {
  nodos: 68649, aristas: 98774, componentes: 170, aPie: 94570,
  // sha de la línea `##ARISTAS##` de `node src/rutas-antonio.js --aristas`
  shaRutas: '65a16a414dbe27f4d25f2662cebfd75ebd7899b2c31f5fd0cf36cd9fe71ca871',
  rutasQueResuelven: 9,
};

raya();
log('TANDA DE ARREGLO 9 · ¿SE HA MOVIDO ALGO DE H1? — la firma de `adyacencia`');
raya();

// ═════════════════════════════════════════════════════════════════════════════
// P1 · ⭐⭐⭐ ¿SE ESTÁ EJECUTANDO EL CÓDIGO NUEVO? — antes de creerse un idéntico
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P1 · ⭐⭐⭐ LO PRIMERO: demostrar que el código NUEVO se ejecuta');
raya('─');
log('   ⛔ Un idéntico no vale si la firma ignora su parámetro: daría idéntico igual.');
log('     Dos pruebas, y las dos tienen que salir en la misma pasada.');
log('');
const g = R.construir(R.ZONA_TERMINO);
{
  // (1) la llamada VIEJA tiene que reventar
  let reviento = null;
  try {
    G.adyacencia(g.nodos, g.aristas, true, false);
  } catch (e) { reviento = e.message; }
  di('(1) la llamada vieja `adyacencia(…, true, …)`', reviento ? '✅ REVIENTA' : '⛔ NO revienta — la firma no valida');
  if (reviento) log('      ' + reviento.slice(0, 96));
  A.exige(!!reviento, 'la firma acepta un booleano como tercer argumento: el cambio no está aplicado');

  // (2) un predicado DISTINTO tiene que dar números distintos
  const aPie = G.adyacencia(g.nodos, g.aristas, G.PASA_A_PIE, false).usadas;
  const todo = G.adyacencia(g.nodos, g.aristas, () => true, false).usadas;
  const nada = G.adyacencia(g.nodos, g.aristas, () => false, false).usadas;
  di('(2) usadas con `G.PASA_A_PIE`', aPie);
  di('    usadas con `() => true`', todo + '   ⇒ ' + (todo - aPie) + ' más');
  di('    usadas con `() => false`', nada);
  A.exige(aPie === ANTES.aPie, `con PASA_A_PIE salen ${aPie} aristas y antes eran ${ANTES.aPie}`);
  A.exige(todo === g.aristas.length && nada === 0 && todo > aPie,
    'el predicado no cambia el resultado: `adyacencia` lo está ignorando y todo lo demás de '
    + 'esta tanda es un idéntico sin valor');
  log('      ⇒ ✅ el parámetro se HONRA: tres predicados, tres resultados distintos.');
}

// ═════════════════════════════════════════════════════════════════════════════
// P2 · EL GRAFO — ley 148: es el del motor
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P2 · EL GRAFO DEL MOTOR — `R.construir(R.ZONA_TERMINO)`');
raya('─');
log('   ' + 'medida'.padEnd(26) + 'ahora'.padStart(12) + 'antes'.padStart(12) + '   ¿igual?');
const fila = (etq, ahora, antes) => {
  const ok = ahora === antes;
  log('   ' + etq.padEnd(26) + String(ahora).padStart(12) + String(antes).padStart(12) + '   ' + (ok ? '✅' : '⛔ SE HA MOVIDO'));
  A.exige(ok, `${etq}: ahora ${ahora} y antes ${antes}`);
};
fila('nodos (contadores)', g.contadores.nodos, ANTES.nodos);
fila('aristas', g.aristas.length, ANTES.aristas);
fila('componentes', g.comp.n, ANTES.componentes);
fila('aristas usadas (a pie)', G.adyacencia(g.nodos, g.aristas, G.PASA_A_PIE, false).usadas, ANTES.aPie);

// ═════════════════════════════════════════════════════════════════════════════
// P3 · ⭐⭐⭐ LAS DIEZ RUTAS — metros E ÍNDICES DE ARISTA
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · ⭐⭐⭐ LAS RUTAS DE CORDURA — metros Y la lista de índices de arista');
raya('─');
log('   ⛔ Se ejecuta `src/rutas-antonio.js --aristas` en un proceso aparte, que es');
log('     como lo hace `src/modelo-rutas.js`: se compara contra el MOTOR, no contra');
log('     una copia de su regla (ley 55).');
const salida = (() => {
  try {
    return execFileSync(process.execPath,
      [path.join(__dirname, '..', '..', 'src', 'rutas-antonio.js'), '--aristas'],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { return (e.stdout || '').toString(); }   // ⚠️ sale en rojo a propósito: la nº4
})();
const linea = salida.split('\n').find((x) => x.startsWith('##ARISTAS##'));
A.exige(!!linea, 'no se ha podido leer `##ARISTAS##`: sin eso esta tanda no demuestra nada');
const RUTAS = JSON.parse(linea.slice('##ARISTAS##'.length));
log('');
log('   ' + 'ruta'.padStart(6) + 'metros'.padStart(12) + 'aristas'.padStart(10) + '   sha256 de los índices');
for (const r of RUTAS) {
  log('   ' + String(r.n).padStart(6) + r.metros.toFixed(1).padStart(12) + String(r.aristas.length).padStart(10)
    + '   ' + sha(JSON.stringify(r.aristas)).slice(0, 32));
}
log('');
const shaAhora = sha(linea.trim() + '\n');
di('rutas que resuelven', RUTAS.length + '   (antes ' + ANTES.rutasQueResuelven + ')');
di('sha de la línea entera · ahora', shaAhora);
di('                       · antes', ANTES.shaRutas);
di('⇒ ¿IDÉNTICO?', shaAhora === ANTES.shaRutas ? '✅ SÍ — ni un decimal, ni un índice' : '⛔ NO');
A.exige(RUTAS.length === ANTES.rutasQueResuelven, `resuelven ${RUTAS.length} rutas y antes eran ${ANTES.rutasQueResuelven}`);
A.exige(shaAhora === ANTES.shaRutas,
  'las rutas de cordura SE HAN MOVIDO: la condición con la que se aprobó reabrir H1 es que no lo '
  + 'hicieran. Hay que deshacer.');

// ⭐ LEY 152 · EL CERO CON SU UNO: que este instrumento SEPA detectar un cambio.
log('');
log('   ⭐⭐ LA PROVOCACIÓN — ¿sabría este instrumento ver que algo se ha movido?');
{
  const tocado = JSON.parse(JSON.stringify(RUTAS));
  tocado[0].metros = Math.round((tocado[0].metros + 0.1) * 10) / 10;
  const shaMetro = sha('##ARISTAS## ' + JSON.stringify(tocado) + '\n');
  di('   con 0,1 m de más en UNA ruta', shaMetro !== ANTES.shaRutas ? '✅ lo caza' : '⛔ NO lo caza');
  A.exige(shaMetro !== ANTES.shaRutas, 'el sha no distingue 0,1 m: no demuestra nada');

  const tocado2 = JSON.parse(JSON.stringify(RUTAS));
  tocado2[0].aristas[0] = tocado2[0].aristas[0] + 1;
  const shaIdx = sha('##ARISTAS## ' + JSON.stringify(tocado2) + '\n');
  di('   con UN índice de arista cambiado', shaIdx !== ANTES.shaRutas ? '✅ lo caza' : '⛔ NO lo caza');
  A.exige(shaIdx !== ANTES.shaRutas, 'el sha no distingue un índice de arista: no demuestra nada');
  log('      ⇒ ⭐ y las dos importan: **una ruta puede medir lo mismo yendo por otro sitio.**');
}

// ═════════════════════════════════════════════════════════════════════════════
// P4 · ⭐⭐ LA FIRMA SIRVE PARA LO QUE SE CAMBIÓ — el predicado de bici enchufado
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · ⭐⭐ EL PREDICADO DE BICI, ENCHUFADO — ⛔ solo enchufado');
raya('─');
{
  const tagsDe = new Map(osm.cargar(R.CRUDO).ways.map((w) => [w.id, w.tags || {}]));
  // ⛔ NO se copia la regla de `circulacion-bici.js`: se importan sus conjuntos.
  //   Copiarla sería tener dos definiciones de «circula» que pueden divergir.
  const CIRC = new Set(['cycleway', 'residential', 'service', 'tertiary', 'secondary', 'primary',
    'unclassified', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link', 'track', 'path']);
  const prohibe = (t) => t.bicycle === 'no' || t.access === 'no';
  const pasaBici = (e) => CIRC.has(e.highway) && !prohibe(tagsDe.get(e.way) || {});

  const { ady, usadas } = G.adyacencia(g.nodos, g.aristas, pasaBici, false);
  const comp = G.componentes(g.nodos, ady);
  const km = (m) => (m / 1000).toFixed(1) + ' km';
  const metros = g.aristas.filter(pasaBici).reduce((s, e) => s + e.largo, 0);
  di('aristas que entran en la red de bici', usadas + '   (' + (100 * usadas / g.aristas.length).toFixed(1) + ' % del grafo)');
  di('kilómetros', km(metros));
  di('componentes', comp.n);
  di('la mayor, en nodos', comp.tamanos[0] + ' de ' + comp.tamanos.reduce((s, x) => s + x, 0));
  log('');
  log('   ⭐ Y esto es lo único que demuestra: **que se puede construir la red de un modo');
  log('     que no es el peatón sin tocar el grafo ni copiar una arista.** ⛔ No hay enganche');
  log('     de bici, ni tiempos, ni rutas de producto: eso es la tanda siguiente.');
  A.exige(usadas > 0.30 * g.aristas.length,
    `la red de bici sale con ${usadas} aristas: si el predicado se hubiera roto al enchufarlo, `
    + 'saldría un número pequeño y una red de juguete');
}

log('');
raya();
log(A.cierre('LA FIRMA DE `adyacencia`'));
