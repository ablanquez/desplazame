// LOS CONTADORES DE LA CIUDAD, contra la línea base del casco.
//
// ⭐ Las reglas D1–D5 son EXACTAMENTE las mismas que en la tanda 8. Si un número
//    sale distinto tiene que ser porque la ciudad es distinta del casco, no porque
//    el proceso haya cambiado. Cambiar las dos cosas a la vez hace imposible saber
//    cuál produjo la diferencia (ley 19).
//
//   node src/ciudad.js

'use strict';
const { construir, ZONA_CASCO, ZONA_TERMINO, CRUDO } = require('./ruta');
const { aGrados, dist } = require('./geo');
const osm = require('./osm');
const G = require('./grafo');

// ── LAS ZONAS DEL EJE DENSIDAD (C4) ──────────────────────────────────────────
// ⚠️ Estos bboxes son MÍOS, no de ningún callejero oficial: son ventanas para
//    comparar tejidos urbanos distintos, no límites administrativos. Cada uno
//    lleva un POSITIVO DE CONTROL —una calle que TIENE que estar dentro— para
//    que un contador a cero se distinga de una ventana mal puesta.
const ZONAS = [
  { n: 'casco histórico', b: ZONA_CASCO, control: 'Calle del Coso' },
  { n: 'ensanche (Gran Vía · Sagasta)', b: { sur: 41.6355, oeste: -0.8930, norte: 41.6480, este: -0.8730 }, control: 'Gran Vía' },
  { n: 'periferia · Valdespartera', b: { sur: 41.6050, oeste: -0.9330, norte: 41.6230, este: -0.9060 }, control: null },
  { n: 'periferia · Actur-Rey Fernando', b: { sur: 41.6600, oeste: -0.9070, norte: 41.6800, este: -0.8730 }, control: null },
  { n: 'polígono · Malpica-Santa Isabel', b: { sur: 41.6700, oeste: -0.8600, norte: 41.6950, este: -0.8200 }, control: null },
  { n: 'polígono · PLAZA', b: { sur: 41.6250, oeste: -1.0500, norte: 41.6700, este: -0.9700 }, control: null },
  { n: 'rural · Movera', b: { sur: 41.6600, oeste: -0.8250, norte: 41.6850, este: -0.7900 }, control: null },
  { n: 'rural · Garrapinillos', b: { sur: 41.6600, oeste: -1.0600, norte: 41.6900, este: -1.0100 }, control: null },
];

/** Reparto de precisión (D4) en porcentaje, sobre un conjunto de aristas. */
function repartoPrecision(aristas) {
  const c = {};
  for (const e of aristas) c[e.precision] = (c[e.precision] || 0) + 1;
  const t = aristas.length || 1;
  return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, { n: v, pct: (100 * v / t) }]));
}

/** Aristas cuyo punto medio cae dentro de un bbox en grados. */
function aristasEn(aristas, bbox) {
  return aristas.filter((e) => {
    const m = e.pts[Math.floor(e.pts.length / 2)];
    const g = aGrados(m[0], m[1]);
    return g[1] >= bbox.sur && g[1] <= bbox.norte && g[0] >= bbox.oeste && g[0] <= bbox.este;
  });
}

if (require.main === module) {
  const L = [];
  const di = (k, v) => L.push(`   ${String(k).padEnd(42)} ${v}`);
  const fila = (etq, casco, ciudad, nota) =>
    L.push('  ' + String(etq).padEnd(34) + String(casco).padStart(12) + String(ciudad).padStart(14)
      + (nota ? '   ' + nota : ''));

  const T = Date.now();

  // ── A · el censo de cúmulos: la exclusión se declara ───────────────────────
  L.push('='.repeat(100));
  L.push('A · EL CRUDO, Y LAS CUATRO ZARAGOZAS');
  const crudo = osm.cargar(CRUDO);
  di('sello OSM', crudo.sello);
  di('ways en el fichero', crudo.ways.length);
  const cl = osm.clusters(crudo.ways);
  L.push('   ⚠️ el fichero contiene ' + cl.length + ' cúmulos geográficos distintos:');
  for (const c of cl) {
    L.push('      ' + String(c.ways).padStart(6) + ' ways   ' + c.lat.toFixed(3) + ', ' + c.lon.toFixed(3)
      + '   ' + (c.ejemplos[0] || '(sin nombre)'));
  }
  const ext = osm.extension(crudo.ways);
  di('extensión REAL del fichero', `S ${ext.sur.toFixed(3)} O ${ext.oeste.toFixed(3)} N ${ext.norte.toFixed(3)} E ${ext.este.toFixed(3)}`);
  di('  superficie de ese bbox', osm.areaKm2(ext).toFixed(0) + ' km²  ⛔ el término mide 973,8');
  L.push('');
  di('⇒ se recorta a ZONA_TERMINO', `S ${ZONA_TERMINO.sur} O ${ZONA_TERMINO.oeste} N ${ZONA_TERMINO.norte} E ${ZONA_TERMINO.este}`);
  di('  superficie del bbox del término', osm.areaKm2(ZONA_TERMINO).toFixed(0) + ' km²');
  const recorte = osm.recortar(crudo.ways, ZONA_TERMINO);
  di('  ways que quedan', recorte.length + '   (excluidos ' + (crudo.ways.length - recorte.length) + ' de otro continente)');
  const aCaballo = crudo.ways.filter((w) => {
    const d = (p) => p.lat >= ZONA_TERMINO.sur && p.lat <= ZONA_TERMINO.norte && p.lon >= ZONA_TERMINO.oeste && p.lon <= ZONA_TERMINO.este;
    return w.geometry.some(d) && !w.geometry.every(d);
  }).length;
  di('  ⭐ ways partidos por el recorte', aCaballo + (aCaballo === 0 ? '  ✅ ninguno: el corte es limpio' : '  ⚠️ HAY QUE MIRARLOS'));

  // ── construir los dos grafos ───────────────────────────────────────────────
  const t1 = Date.now();
  const ciudad = construir(ZONA_TERMINO);
  const tCiudad = Date.now() - t1;
  const t2 = Date.now();
  const casco = construir(ZONA_CASCO);
  const tCasco = Date.now() - t2;

  const kmCasco = casco.areaKm2, kmCiudad = ciudad.areaKm2;

  L.push('');
  L.push('='.repeat(100));
  L.push('B · LOS CONTADORES — CASCO (línea base) vs CIUDAD');
  L.push('  ' + ''.padEnd(34) + 'CASCO'.padStart(12) + 'CIUDAD'.padStart(14));
  L.push('  ' + '─'.repeat(80));
  fila('superficie del bbox (km²)', kmCasco.toFixed(2), kmCiudad.toFixed(0), '×' + (kmCiudad / kmCasco).toFixed(0));
  fila('ways de entrada', casco.contadores.waysEntrada, ciudad.contadores.waysEntrada, '×' + (ciudad.contadores.waysEntrada / casco.contadores.waysEntrada).toFixed(1));

  L.push('');
  L.push('  B1 · el grafo');
  fila('nodos', casco.contadores.nodos, ciudad.contadores.nodos, '×' + (ciudad.contadores.nodos / casco.contadores.nodos).toFixed(1));
  fila('aristas', casco.aristas.length, ciudad.aristas.length, '×' + (ciudad.aristas.length / casco.aristas.length).toFixed(1));
  fila('particiones (cortes de way)', casco.contadores.particiones, ciudad.contadores.particiones);
  fila('nodos OSM compartidos (D1·C1)', casco.contadores.nodosCompartidos, ciudad.contadores.nodosCompartidos);
  fila('tiempo de planarizado (s)', (tCasco / 1000).toFixed(1), (tCiudad / 1000).toFixed(1));
  fila('memoria (rss, MB)', '—', (process.memoryUsage().rss / 1048576).toFixed(0));

  L.push('');
  L.push('  B2 · ⭐ unido-por-defecto (D2) — el contador que decide si D1 aguanta');
  const d2c = casco.contadores.unidoPorDefecto, d2n = ciudad.contadores.unidoPorDefecto;
  fila('casos', d2c, d2n, '×' + (d2n / d2c).toFixed(1));
  fila('por km² de bbox', (d2c / kmCasco).toFixed(3), (d2n / kmCiudad).toFixed(3));
  fila('por 1.000 aristas', (1000 * d2c / casco.aristas.length).toFixed(2), (1000 * d2n / ciudad.aristas.length).toFixed(2));
  fila('por 1.000 ways de entrada', (1000 * d2c / casco.contadores.waysEntrada).toFixed(2), (1000 * d2n / ciudad.contadores.waysEntrada).toFixed(2));
  // ⭐ CLASIFICAR ANTES DE CONTAR (ley 29): en el casco 4 de 6 eran unas obras.
  L.push('');
  L.push('     ⭐ clasificados por causa aparente ANTES de dar el número (ley 29):');
  const clase = (d) => {
    const hw = [d.hwA, d.hwB];
    if (hw.includes('construction')) return 'obras (highway=construction)';
    if (hw.every((h) => ['footway', 'path', 'steps', 'cycleway', 'pedestrian'].includes(h))) return 'peatonal × peatonal';
    if (hw.some((h) => ['footway', 'path', 'steps', 'cycleway', 'pedestrian'].includes(h))) return 'peatonal × rodada';
    if (hw.some((h) => h === 'service' || h === 'track')) return 'servicio o pista';
    return 'rodada × rodada';
  };
  const clases = {};
  for (const d of ciudad.porDefecto) clases[clase(d)] = (clases[clase(d)] || 0) + 1;
  const clasesC = {};
  for (const d of casco.porDefecto) clasesC[clase(d)] = (clasesC[clase(d)] || 0) + 1;
  for (const k of new Set([...Object.keys(clases), ...Object.keys(clasesC)])) {
    fila('     ' + k, clasesC[k] || 0, clases[k] || 0);
  }

  L.push('');
  L.push('  B3 · no unidos POR EVIDENCIA — ¿cambia el reparto?');
  const mots = new Set([...Object.keys(casco.contadores.porMotivo), ...Object.keys(ciudad.contadores.porMotivo)]);
  for (const m of [...mots].sort()) {
    const a = casco.contadores.porMotivo[m] || 0, b = ciudad.contadores.porMotivo[m] || 0;
    const pa = casco.contadores.cortesGeometricos ? (100 * a / casco.contadores.cortesGeometricos).toFixed(1) : '—';
    const pb = (100 * b / ciudad.contadores.cortesGeometricos).toFixed(1);
    fila('  ' + m, a + ' (' + pa + '%)', b + ' (' + pb + '%)');
  }
  fila('cortes geométricos totales', casco.contadores.cortesGeometricos, ciudad.contadores.cortesGeometricos);

  L.push('');
  L.push('  B4 · ⭐ puntas (D5) — ¿aparece un pico justo por encima de 2,0 m?');
  fila('soldadas (<=2,0 m)', casco.contadores.puntasSoldadas, ciudad.contadores.puntasSoldadas);
  fila('2-5 m SIN soldar', casco.contadores.puntasFueraDeTecho, ciudad.contadores.puntasFueraDeTecho);
  const histo = (vals, paso, max) => {
    const h = {};
    for (const v of vals) { const b = (Math.floor(v / paso) * paso).toFixed(1); h[b] = (h[b] || 0) + 1; }
    return Object.entries(h).sort((a, b) => a[0] - b[0]).filter(([k]) => +k < max)
      .map(([k, v]) => `${k}-${(+k + paso).toFixed(1)}:${v}`).join('  ');
  };
  L.push('     soldadas, casco : ' + histo(casco.contadores.distanciasPuntas, 0.5, 2.0));
  L.push('     soldadas, ciudad: ' + histo(ciudad.contadores.distanciasPuntas, 0.5, 2.0));
  L.push('     2-5 m,   ciudad: ' + histo(ciudad.puntasLejos.map((p) => p.d), 0.5, 5.0));
  const justoEncima = ciudad.puntasLejos.filter((p) => p.d < 2.5).length;
  const total25 = ciudad.puntasLejos.length;
  di('   ⇒ ¿pico entre 2,0 y 2,5 m?', `${justoEncima} de ${total25} (${(100 * justoEncima / total25).toFixed(0)} %)`);
  L.push('        ⚠️ si el reparto fuera uniforme se esperaría el 17 % (0,5 de 3,0 m).');

  L.push('');
  L.push('  B5 · ⭐⭐ reparto de precisión (D4) — la comparación más interesante');
  const rc = repartoPrecision(casco.aristas), rn = repartoPrecision(ciudad.aristas);
  for (const k of ['eje-de-calzada', 'eje-con-acera-declarada', 'acera', 'paso-de-peatones', 'peatonal', 'escaleras']) {
    fila('  ' + k, ((rc[k] || {}).pct || 0).toFixed(1) + ' %', ((rn[k] || {}).pct || 0).toFixed(1) + ' %',
      (rn[k] ? rn[k].n : 0) + ' aristas');
  }

  L.push('');
  L.push('  B6 · ⭐ PASOS CONDICIONALES — el número que decide si se reabre la decisión');
  L.push('     ⚠️ CLASIFICADO ANTES DE CONTARLO (ley 29). "Paso condicional" es un sitio por el');
  L.push('        que SE PUEDE andar pero no siempre. NO es lo mismo que un sitio privado, que');
  L.push('        es un sitio por el que no se anda. Sumarlos daría un número inflado y una');
  L.push('        decisión equivocada — que es exactamente lo que pasó con el 8,36 % (nº43).');
  const cond = {
    'PASO CONDICIONAL · tunnel=building_passage': (t) => t.tunnel === 'building_passage',
    'PASO CONDICIONAL · covered=yes': (t) => t.covered === 'yes',
    'PASO CONDICIONAL · indoor=yes': (t) => t.indoor === 'yes',
    'PASO CONDICIONAL · highway=corridor': (t) => t.highway === 'corridor',
    'PASO CONDICIONAL · con opening_hours': (t) => !!t.opening_hours,
    'ACCESO RESTRINGIDO · access=private': (t) => t.access === 'private',
    'ACCESO RESTRINGIDO · access=customers': (t) => t.access === 'customers',
    'ACCESO RESTRINGIDO · foot=private/customers': (t) => ['private', 'customers'].includes(t.foot),
    'PERMISIVO (no condicional) · access=permissive': (t) => t.access === 'permissive',
  };
  const rec2 = osm.recortar(crudo.ways, ZONA_TERMINO);
  const recCasco = osm.recortar(crudo.ways, ZONA_CASCO);
  const idsPaso = new Set(), idsAcceso = new Set();
  for (const [k, f] of Object.entries(cond)) {
    const hits = rec2.filter((w) => f(w.tags || {}));
    fila('  ' + k, recCasco.filter((w) => f(w.tags || {})).length, hits.length);
    if (k.startsWith('PASO')) for (const w of hits) idsPaso.add(w.id);
    if (k.startsWith('ACCESO')) for (const w of hits) idsAcceso.add(w.id);
  }
  L.push('');
  di('   ⇒ PASOS CONDICIONALES (ways distintos)', idsPaso.size + ' de ' + rec2.length
    + ' (' + (100 * idsPaso.size / rec2.length).toFixed(2) + ' %)');
  di('   ⇒ accesos restringidos (otra cosa)', idsAcceso.size);
  // ⭐ ¿cuántos de esos pasos son TRANSITABLES a pie? los que no, no son el problema
  const pasoAndable = [...rec2].filter((w) => idsPaso.has(w.id)
    && require('./planarizar').transitableAPie(w.tags || {})).length;
  di('   ⇒ de ellos, transitables a pie', pasoAndable);
  // ⭐ positivo de control: el buscador tiene que encontrar algo que SÍ está
  const ctrl = rec2.filter((w) => (w.tags || {}).highway === 'footway').length;
  di('   ⭐ positivo de control (highway=footway)', ctrl + (ctrl > 0 ? '  ✅ el buscador de tags funciona' : '  ⛔ ROTO'));
  // ⭐ y el control negativo: un tag que NO debería existir
  const inv = rec2.filter((w) => (w.tags || {}).highway === 'no-existe-este-valor').length;
  di('   ⭐ control negativo (tag inventado)', inv + (inv === 0 ? '  ✅ no inventa positivos' : '  ⛔ ROTO'));

  L.push('');
  L.push('  B7 · el eje ESCALA — reparto de longitudes de arista');
  const cortas = (a, u) => a.filter((e) => e.largo < u).length;
  for (const u of [5, 10, 25, 50, 100]) {
    fila('  aristas de menos de ' + u + ' m',
      (100 * cortas(casco.aristas, u) / casco.aristas.length).toFixed(1) + ' %',
      (100 * cortas(ciudad.aristas, u) / ciudad.aristas.length).toFixed(1) + ' %');
  }
  const med = (a) => { const s = a.map((e) => e.largo).sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  fila('  mediana (m)', med(casco.aristas).toFixed(1), med(ciudad.aristas).toFixed(1));
  fila('  arista más larga (m)', Math.max(...casco.aristas.map((e) => e.largo)).toFixed(0), Math.max(...ciudad.aristas.map((e) => e.largo)).toFixed(0));

  // ── C4 · EL EJE DENSIDAD ───────────────────────────────────────────────────
  L.push('');
  L.push('='.repeat(100));
  L.push('C4 · ⭐ EL EJE DENSIDAD — el que no se ha medido NUNCA');
  L.push('   ⚠️ los bboxes son ventanas MÍAS para comparar tejidos, no límites administrativos.');
  L.push('');
  L.push('  ' + 'zona'.padEnd(32) + 'aristas'.padStart(8) + 'km²'.padStart(7) + 'ar/km²'.padStart(9)
    + 'calzada'.padStart(9) + 'acera'.padStart(8) + 'peatonal'.padStart(9) + 'pasos'.padStart(7) + '  D2');
  const porZona = [];
  for (const z of ZONAS) {
    const ar = aristasEn(ciudad.aristas, z.b);
    const km = osm.areaKm2(z.b);
    const r = repartoPrecision(ar);
    const p = (k) => ((r[k] || {}).pct || 0);
    const d2 = ciudad.porDefecto.filter((d) => {
      const gg = aGrados(d.p[0], d.p[1]);
      return gg[1] >= z.b.sur && gg[1] <= z.b.norte && gg[0] >= z.b.oeste && gg[0] <= z.b.este;
    }).length;
    porZona.push({ z, ar, km, r, d2 });
    L.push('  ' + z.n.padEnd(32) + String(ar.length).padStart(8) + km.toFixed(1).padStart(7)
      + (ar.length / km).toFixed(0).padStart(9)
      + (p('eje-de-calzada').toFixed(1) + '%').padStart(9)
      + ((p('acera') + p('eje-con-acera-declarada')).toFixed(1) + '%').padStart(8)
      + (p('peatonal').toFixed(1) + '%').padStart(9)
      + (p('paso-de-peatones').toFixed(1) + '%').padStart(7)
      + '  ' + d2);
  }
  L.push('');
  L.push('  ⭐ POSITIVOS DE CONTROL de las ventanas (una ventana mal puesta da cero, y el cero se lee mal):');
  const { ways: todos } = crudo;
  for (const z of ZONAS) {
    if (!z.control) continue;
    const hay = osm.recortar(todos, z.b).some((w) => ((w.tags || {}).name || '').includes(z.control));
    L.push('     ' + z.n.padEnd(34) + '¿está "' + z.control + '"? ' + (hay ? '✅' : '⛔ VENTANA MAL PUESTA'));
  }
  L.push('     ⚠️ las zonas sin control declarado NO están verificadas por nombre: se declara.');

  const cal = porZona.map((x) => ({ n: x.z.n, v: (x.r['eje-de-calzada'] || {}).pct || 0 })).sort((a, b) => b.v - a.v);
  L.push('');
  L.push('  ⇒ eje-de-calzada, de peor a mejor: ' + cal.map((c) => c.n.split(' ')[0] + ' ' + c.v.toFixed(0) + '%').join(' · '));

  L.push('');
  di('tiempo total', ((Date.now() - T) / 1000).toFixed(1) + ' s');
  console.log(L.join('\n'));
}

module.exports = { ZONAS, repartoPrecision, aristasEn };
