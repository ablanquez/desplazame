// ⭐⭐⭐ H2a · TANDA 7 · PUERTA 1 — ¿UN ENLACE «ACERA» VA POR LA ACERA CORRECTA?
//
// ═════════════════════════════════════════════════════════════════════════════
// LA PREGUNTA, Y POR QUÉ VA ANTES QUE LOS 2.538
// ═════════════════════════════════════════════════════════════════════════════
//   H2·6 clasificó 324 enlaces y publicó **20,7 % ACERA**. Pero ese `ACERA`
//   significa *«el camino va por aristas de tipo acera»*, **NO «va por la acera
//   correcta»**. Son dos cosas distintas y solo una es la que sostiene la tesis
//   del hito: *«nosotros lo calculamos andando, así que sabemos por qué lado»*.
//
//   ⛔ Si el veredicto nace mintiendo, calcular 2.538 enlaces con él es tirar la
//     tanda entera. Por eso esto va primero.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ EL LÍMITE DEL INSTRUMENTO, DECLARADO SOBRE EL MODELO Y NO SOBRE LOS CASOS
// ═════════════════════════════════════════════════════════════════════════════
//   (ley 150) `src/acera-equivocada.js` sabe de qué lado está una arista **solo
//   cuando cuelgan de ella ≥4 portales de una misma vía y ≥75 % son de la misma
//   paridad**. Fuera de ahí **la pregunta no se puede ni formular**:
//     · un EJE DE CALZADA no tiene dos lados: tiene un eje;
//     · una acera de la que no cuelga ningún portal no tiene paridad que mande.
//   ⇒ Este instrumento **no puede ponerse rojo** sobre esas aristas, y eso NO es
//     un aprobado: es una población que sigue sin vigilar. Se cuenta y se dice.
//
//   node tools/grafo/lado-de-la-acera.js [--muestra N]

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const D = require('../../src/direccion');
const Ac = require('../../src/acera-equivocada');
const { cargar } = require('../gtfs/feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? Number(process.argv[i + 1]) : d; };

/** ⛔ Los mismos de H2·6, para que la muestra sea LA MISMA y comparable. */
const RADIO_M = 300;
const TAM_MUESTRA = arg('--muestra', 300);

/** Lo que H2·6 publicó sobre esta muestra. Es el positivo de control de que
 *  este script está mirando el mismo universo y no uno parecido. */
const PUBLICADO_H2_6 = { paradas: 934, pares: 2266, muestra: 324, ACERA: 67, EJE: 254, MISMA: 3, SIN: 0 };

const ES_EJE = Ac.ES_EJE;
const ES_PASO = (e) => e.precision === 'paso-de-peatones';

const R_TIERRA = 6371000, RAD = Math.PI / 180;
const recta = (a, b) => {
  const x = (b.lon - a.lon) * RAD * Math.cos((a.lat + b.lat) / 2 * RAD);
  const y = (b.lat - a.lat) * RAD;
  return Math.hypot(x, y) * R_TIERRA;
};

raya();
log('¿UN ENLACE «ACERA» VA POR LA ACERA CORRECTA? — sobre la MISMA muestra de H2·6');
raya();

const g = R.construir(R.ZONA_TERMINO);
const ctx = D.abrir(g, R.CRUDO);
di('grafo (ley 148)', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');
di('aristas · portales enganchados', g.aristas.length + ' · ' + ctx.enganche.contadores.enganchados);

// ═════════════════════════════════════════════════════════════════════════════
// P0 · LA MUESTRA — y el positivo de control de que es la de ayer
// ═════════════════════════════════════════════════════════════════════════════
const { stops, modo, lineasDe } = cargar();
const P = stops.filter((s) => modo.get(s.stop_id) === 'bus').map((s) => ({
  id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
  lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
  lineas: lineasDe.get(s.stop_id) || new Set(),
}));
for (const p of P) {
  p.eng = R.engancharPunto(g, p.lat, p.lon, 'parada');
  p.precision = g.aristas[p.eng.arista].precision;
  p.comp = g.comp.comp[g.aristas[p.eng.arista].a];
}
const pares = [];
for (let i = 0; i < P.length; i++) {
  for (let j = i + 1; j < P.length; j++) {
    if (recta(P[i], P[j]) > RADIO_M) continue;
    let aporta = false;
    for (const x of P[j].lineas) if (!P[i].lineas.has(x)) { aporta = true; break; }
    if (!aporta) for (const x of P[i].lineas) if (!P[j].lineas.has(x)) { aporta = true; break; }
    if (aporta) pares.push([i, j]);
  }
}
const K = Math.max(1, Math.floor(pares.length / TAM_MUESTRA));
const muestra = pares.filter((_, i) => i % K === 0);
log('');
raya('─');
log('P0 · LA MUESTRA — la MISMA de H2·6, y se demuestra');
raya('─');
di('paradas de bus', P.length + '   (H2·6 publicó ' + PUBLICADO_H2_6.paradas + ')');
di('pares candidatos', pares.length + '   (H2·6 publicó ' + PUBLICADO_H2_6.pares + ')');
di('muestra 1 de cada ' + K, muestra.length + '   (H2·6 publicó ' + PUBLICADO_H2_6.muestra + ')');
A.exige(P.length === PUBLICADO_H2_6.paradas, `las paradas salen ${P.length} y H2·6 publicó ${PUBLICADO_H2_6.paradas}`);
A.exige(pares.length === PUBLICADO_H2_6.pares, `los pares salen ${pares.length} y H2·6 publicó ${PUBLICADO_H2_6.pares}`);
A.exige(muestra.length === PUBLICADO_H2_6.muestra, `la muestra sale ${muestra.length} y H2·6 publicó ${PUBLICADO_H2_6.muestra}`);

// ═════════════════════════════════════════════════════════════════════════════
// P1 · DE QUÉ LADO ES CADA ARISTA — la tabla de `acera-equivocada.js`
// ═════════════════════════════════════════════════════════════════════════════
const tabla = Ac.paridadDeAristas(ctx.enganche.portales, g.aristas);
// arista → lado, si UNA sola vía manda en ella y las que mandan no se contradicen
const ladoDe = new Map();
const contradicen = new Set();
for (const x of tabla.values()) {
  if (!x.dominante) continue;
  if (ladoDe.has(x.arista) && ladoDe.get(x.arista) !== x.dominante) { contradicen.add(x.arista); continue; }
  ladoDe.set(x.arista, x.dominante);
}
for (const ia of contradicen) ladoDe.delete(ia);
log('');
raya('─');
log('P1 · ⭐⭐ LA COBERTURA DEL INSTRUMENTO, SOBRE EL MODELO (ley 150)');
raya('─');
di('listones de acera-equivocada.js', `≥${Ac.MIN_PORTALES_ARISTA} portales por arista · dominio ≥${(100 * Ac.DOMINIO).toFixed(0)} %`);
di('aristas del grafo', g.aristas.length);
di('⭐ aristas con LADO decidible', ladoDe.size + '  (' + (100 * ladoDe.size / g.aristas.length).toFixed(1) + ' % del grafo)');
di('aristas donde dos vías se contradicen (descartadas)', contradicen.size);
{
  const porClase = {};
  for (const e of g.aristas) porClase[e.precision] = (porClase[e.precision] || 0) + 1;
  const decid = {};
  for (const ia of ladoDe.keys()) {
    const p = g.aristas[ia].precision;
    decid[p] = (decid[p] || 0) + 1;
  }
  log('');
  log('   ' + 'clase de arista'.padEnd(28) + 'en el grafo'.padStart(12) + 'con lado'.padStart(11)
    + '   ¿puede el instrumento ponerse rojo?');
  for (const k of Object.keys(porClase).sort((a, b) => porClase[b] - porClase[a])) {
    log('   ' + k.padEnd(28) + String(porClase[k]).padStart(12) + String(decid[k] || 0).padStart(11)
      + '   ' + (ES_EJE.has(k) ? '⛔ NUNCA — un eje no tiene dos lados'
        : Ac.TIENE_LADO.has(k) ? (decid[k] ? '✅ donde hay paridad dominante' : '⛔ en ninguna')
          : '⛔ la clase no lleva lado'));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// P2 · EL VEREDICTO DE H2·6, REPRODUCIDO — y luego el del LADO
// ═════════════════════════════════════════════════════════════════════════════
function veredictoH26(a, b) {
  if (a.comp !== b.comp) return { v: 'SIN CAMINO', r: null };
  const r = G.rutaEntre(g, a.eng, b.eng);
  if (!r || !r.encontrada) return { v: 'SIN CAMINO', r: null };
  if (a.eng.arista === b.eng.arista) return { v: 'MISMA ARISTA', r };
  const puntasEje = ES_EJE.has(a.precision) || ES_EJE.has(b.precision);
  let ejes = 0;
  for (const ia of r.aristas) if (ES_EJE.has(g.aristas[ia].precision)) ejes++;
  return { v: (puntasEje || ejes > 0) ? 'EJE' : 'ACERA', r, ejes };
}

const res = [];
for (const [i, j] of muestra) {
  const a = P[i], b = P[j];
  const { v, r } = veredictoH26(a, b);
  const o = { a, b, v, r };
  if (r) {
    // el camino, arista a arista, con su lado cuando se sabe
    const lados = [];
    let pasos = 0, conLado = 0;
    for (const ia of r.aristas) {
      if (ES_PASO(g.aristas[ia])) pasos++;
      const l = ladoDe.get(ia);
      if (l) { conLado++; if (lados[lados.length - 1] !== l) lados.push(l); }
    }
    o.pasos = pasos;
    o.conLado = conLado;
    o.total = r.aristas.length;
    o.cambios = Math.max(0, lados.length - 1);
    o.ladoA = ladoDe.get(a.eng.arista) || null;
    o.ladoB = ladoDe.get(b.eng.arista) || null;
  }
  res.push(o);
}
const cuenta = {};
for (const r of res) cuenta[r.v] = (cuenta[r.v] || 0) + 1;
log('');
raya('─');
log('P2 · EL REPARTO DE H2·6, REPRODUCIDO SOBRE LA MISMA MUESTRA');
raya('─');
for (const k of ['ACERA', 'EJE', 'MISMA ARISTA', 'SIN CAMINO']) {
  const n = cuenta[k] || 0;
  const pub = { ACERA: PUBLICADO_H2_6.ACERA, EJE: PUBLICADO_H2_6.EJE,
    'MISMA ARISTA': PUBLICADO_H2_6.MISMA, 'SIN CAMINO': PUBLICADO_H2_6.SIN }[k];
  log('   ' + k.padEnd(16) + String(n).padStart(5) + '   ' + (100 * n / res.length).toFixed(1).padStart(5)
    + ' %      H2·6 publicó ' + String(pub).padStart(4) + '   ' + (n === pub ? '✅' : '⛔ NO CUADRA'));
  A.exige(n === pub, `el veredicto ${k} sale ${n} y H2·6 publicó ${pub}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 · ⭐⭐⭐ EL LADO DE LA ACERA, SOBRE LOS ENLACES «ACERA»
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · ⭐⭐⭐ LOS ENLACES «ACERA» — ¿van por la acera correcta, o cruzan sin decirlo?');
raya('─');
const aceras = res.filter((r) => r.v === 'ACERA');
log('   Cuatro respuestas, y ninguna es «otros»:');
log('     MISMO LADO         el camino no cambia de acera en ningún punto decidible');
log('     CAMBIA CON PASO    cambia de acera Y pasa por un paso de peatones');
log('     ⚠️ CAMBIA SIN PASO cambia de acera sin pasar por ningún paso de peatones');
log('     ⚠️ NO DECIDIBLE    ninguna arista del camino tiene lado ⇒ no se puede preguntar');
log('');
log('   ⛔⛔ Y LO QUE «CAMBIA SIN PASO» NO SIGNIFICA, dicho antes del número (ley 145):');
log('     NO es «cruza la calle a lo loco». Doblar la esquina cambia de acera sin');
log('     ningún paso y es perfectamente legítimo. Lo que este veredicto marca es');
log('     que **el camino pasa de un lado al otro y el dato no dice por dónde** —');
log('     que es distinto de afirmar que ahí se cruza mal. Nombrarlo «cruza callado»');
log('     habría prometido más de lo que se sabe.');
log('');
const clase = (r) => {
  if (r.conLado === 0) return 'NO DECIDIBLE';
  if (r.cambios === 0) return 'MISMO LADO';
  return r.pasos > 0 ? 'CAMBIA CON PASO' : 'CAMBIA SIN PASO';
};
const cAcera = {};
for (const r of aceras) { const k = clase(r); cAcera[k] = (cAcera[k] || 0) + 1; }
for (const k of ['MISMO LADO', 'CAMBIA CON PASO', 'CAMBIA SIN PASO', 'NO DECIDIBLE']) {
  const n = cAcera[k] || 0;
  log('   ' + k.padEnd(20) + String(n).padStart(5) + '   ' + (100 * n / aceras.length).toFixed(1).padStart(5)
    + ' %  de los ' + aceras.length + ' ACERA' + (k === 'CAMBIA SIN PASO' && n ? '   ⚠️' : ''));
}
log('');
di('⭐ aristas del camino con lado decidible', (() => {
  const t = aceras.reduce((s, r) => s + r.total, 0), c = aceras.reduce((s, r) => s + r.conLado, 0);
  return c + ' de ' + t + '  (' + (100 * c / t).toFixed(1) + ' %)';
})());
di('enlaces ACERA con las DOS puntas de lado conocido',
  aceras.filter((r) => r.ladoA && r.ladoB).length + ' de ' + aceras.length);
di('⚠️ enlaces ACERA sobre los que el instrumento NO puede ponerse rojo',
  (cAcera['NO DECIDIBLE'] || 0) + ' de ' + aceras.length
  + '  (' + (100 * (cAcera['NO DECIDIBLE'] || 0) / aceras.length).toFixed(1) + ' %)');

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL POSITIVO DE CONTROL DE LOS CEROS (ley 4 y ley 152)
//   Un veredicto que nunca ha salido es indistinguible de uno imposible. Aquí hay
//   dos que pueden salir a cero —«CAMBIA SIN PASO» y «CAMBIA CON PASO»— y hay que
//   demostrar que el instrumento SABE emitirlos. Se provocan a propósito:
//   se buscan en el grafo dos aristas de la MISMA vía con lados OPUESTOS y se
//   rutea entre ellas. ⛔ No es una muestra: es una provocación declarada.
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3·bis · ⭐⭐⭐ LA CONTRAPRUEBA — provocar los veredictos que no se han visto');
raya('─');
{
  // por vía: aristas con lado par y con lado impar
  const porVia = new Map();
  for (const x of tabla.values()) {
    if (!x.dominante || !ladoDe.has(x.arista)) continue;
    if (!porVia.has(x.via)) porVia.set(x.via, { par: [], impar: [] });
    porVia.get(x.via)[x.dominante].push(x.arista);
  }
  let provocados = { 'CAMBIA CON PASO': null, 'CAMBIA SIN PASO': null }, intentos = 0;
  for (const [via, s] of porVia) {
    if (!s.par.length || !s.impar.length) continue;
    for (const ia of s.par.slice(0, 3)) {
      for (const ib of s.impar.slice(0, 3)) {
        if (intentos > 400) break;
        intentos++;
        const ea = g.aristas[ia], eb = g.aristas[ib];
        if (g.comp.comp[ea.a] !== g.comp.comp[eb.a]) continue;
        const pa = { arista: ia, seg: 0, t: 0.5, q: [(ea.pts[0][0] + ea.pts[1][0]) / 2, (ea.pts[0][1] + ea.pts[1][1]) / 2] };
        const pb = { arista: ib, seg: 0, t: 0.5, q: [(eb.pts[0][0] + eb.pts[1][0]) / 2, (eb.pts[0][1] + eb.pts[1][1]) / 2] };
        const r = G.rutaEntre(g, pa, pb);
        if (!r.encontrada) continue;
        let pasos = 0, conLado = 0; const lados = [];
        for (const k of r.aristas) {
          if (ES_PASO(g.aristas[k])) pasos++;
          const l = ladoDe.get(k);
          if (l) { conLado++; if (lados[lados.length - 1] !== l) lados.push(l); }
        }
        if (lados.length < 2) continue;
        const v = pasos > 0 ? 'CAMBIA CON PASO' : 'CAMBIA SIN PASO';
        if (!provocados[v]) provocados[v] = { via, ia, ib, m: r.metros, pasos, conLado, n: r.aristas.length };
      }
    }
    if (provocados['CAMBIA CON PASO'] && provocados['CAMBIA SIN PASO']) break;
  }
  di('intentos de provocación', intentos);
  for (const k of ['CAMBIA CON PASO', 'CAMBIA SIN PASO']) {
    const p = provocados[k];
    log('   ' + k.padEnd(20) + (p
      ? `✅ PROVOCADO — vía ${p.via}, aristas ${p.ia}×${p.ib}: ${p.m.toFixed(0)} m, `
        + `${p.n} aristas, ${p.conLado} con lado, ${p.pasos} pasos`
      : '⛔ NO SE HA PODIDO PROVOCAR — el veredicto puede ser inalcanzable'));
    A.exige(!!p, `el veredicto «${k}» no se ha podido provocar ni a propósito: `
      + 'un valor que nunca sale no es un veredicto, es una promesa');
  }
  log('');
  log('   ⇒ ⭐ Esto es lo que convierte el «0 de CAMBIA SIN PASO» de arriba en un dato:');
  log('     el instrumento sabe emitirlo, así que su cero en la muestra es un cero');
  log('     de verdad **dentro de su cobertura** — que es del 6,7 % de las aristas.');
}

// ⭐ los casos, con nombre y apellidos
const malos = aceras.filter((r) => clase(r) === 'CAMBIA SIN PASO');
if (malos.length) {
  log('');
  log('   ⚠️ LOS QUE CAMBIAN DE ACERA SIN PASAR POR UN PASO:');
  for (const r of malos.slice(0, 12)) {
    log('      "' + r.a.code + '" ' + r.a.nombre.slice(0, 26).padEnd(27)
      + '"' + r.b.code + '" ' + r.b.nombre.slice(0, 26).padEnd(27)
      + r.r.metros.toFixed(0) + ' m · ' + r.total + ' aristas · ' + r.conLado + ' con lado');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ Y EL MISMO ANÁLISIS SOBRE LOS «EJE», que es donde la pregunta NO existe
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · ⭐⭐ LA POBLACIÓN QUE NO SE PUEDE VIGILAR — los 324, por si se puede preguntar');
raya('─');
{
  const puntaEje = res.filter((r) => ES_EJE.has(r.a.precision) || ES_EJE.has(r.b.precision)).length;
  const dosEje = res.filter((r) => ES_EJE.has(r.a.precision) && ES_EJE.has(r.b.precision)).length;
  di('enlaces con alguna PUNTA en eje de calzada', puntaEje + ' de ' + res.length
    + '  (' + (100 * puntaEje / res.length).toFixed(1) + ' %)');
  di('enlaces con LAS DOS puntas en eje', dosEje + ' de ' + res.length
    + '  (' + (100 * dosEje / res.length).toFixed(1) + ' %)');
  const preguntables = res.filter((r) => r.r && r.conLado > 0).length;
  di('⭐ enlaces sobre los que la pregunta SE PUEDE FORMULAR', preguntables + ' de ' + res.length
    + '  (' + (100 * preguntables / res.length).toFixed(1) + ' %)');
  log('');
  log('   ⇒ El resto NO sale aprobado: sale SIN EXAMINAR. Es la ley 150 en números.');
}

// ═════════════════════════════════════════════════════════════════════════════
// P5 · ⭐⭐ `MISMA ARISTA` — la categoría que la tanda de arreglo 8 dejó caducada
//
//   H2·6 la definió como *«el grafo no las distingue Y EL METRAJE ES FALSO»*. La
//   segunda mitad ya no es cierta: desde el 12/08 el metraje de esos pares es el
//   bueno. ⇒ Hay que decidir qué queda de la categoría, y decidirlo con números.
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P5 · ⭐⭐ QUÉ QUEDA DE «MISMA ARISTA» AHORA QUE EL METRAJE ES BUENO');
raya('─');
{
  // el recuento sobre TODO el universo, no sobre la muestra: es donde importa
  let bxb = 0;
  for (const [i, j] of pares) if (P[i].eng.arista === P[j].eng.arista) bxb++;
  // y los 272 bus↔tranvía, con el mismo criterio de radio
  const T = stops.filter((s) => modo.get(s.stop_id) === 'tranvia').map((s) => ({
    id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
    lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
  }));
  for (const t of T) { t.eng = R.engancharPunto(g, t.lat, t.lon, 'parada'); t.precision = g.aristas[t.eng.arista].precision; }
  let bt = 0, btMisma = 0;
  for (const b of P) for (const t of T) {
    if (recta(b, t) > RADIO_M) continue;
    bt++;
    if (b.eng.arista === t.eng.arista) btMisma++;
  }
  di('paradas de tranvía', T.length);
  di('pares bus×bus con las dos puntas en la misma arista', bxb + ' de ' + pares.length
    + '  (' + (100 * bxb / pares.length).toFixed(1) + ' %)');
  di('pares bus↔tranvía en el radio · con la misma arista', bt + ' · ' + btMisma);
  di('⭐ sobre los 2.538 del hito', (bxb + btMisma) + ' pares  ('
    + (100 * (bxb + btMisma) / (pares.length + bt)).toFixed(1) + ' %)');
  // ⭐ y lo que decide la clasificación: ¿de qué clase es la arista compartida?
  const clases = {};
  for (const [i, j] of pares) {
    if (P[i].eng.arista !== P[j].eng.arista) continue;
    const p = g.aristas[P[i].eng.arista].precision;
    clases[p] = (clases[p] || 0) + 1;
  }
  log('');
  log('   ⭐ de qué clase es la arista que comparten (bus×bus):');
  for (const [k, v] of Object.entries(clases).sort((a, b) => b[1] - a[1])) {
    log('      ' + k.padEnd(26) + String(v).padStart(4) + '   ⇒ el enlace sería '
      + (ES_EJE.has(k) ? 'EJE' : 'ACERA'));
  }
  log('');
  log('   ⇒ ⭐⭐ DECISIÓN: `MISMA ARISTA` DEJA DE SER UN VEREDICTO y pasa a ser una MARCA.');
  log('     El motivo es que la mitad que la justificaba ya no existe: el metraje era');
  log('     falso y ha dejado de serlo. Lo que queda —«el grafo no distingue las dos');
  log('     paradas»— no es una cuarta clase de camino: es la clase de su arista, y');
  log('     por ella se clasifica igual que los demás (EJE o ACERA, arriba).');
  log('     ⚠️ Pero la marca NO se tira: sigue siendo el caso donde dos paradas con');
  log('     nombres distintos son el mismo punto para el grafo, y eso el usuario');
  log('     tiene derecho a saberlo. ⛔ Lo que se retira es la palabra «falso».');
}

log('');
raya();
log(A.cierre('EL LADO DE LA ACERA'));
