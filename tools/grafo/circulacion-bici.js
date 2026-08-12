// ⭐⭐⭐ H2b · TANDA 2 — POR DÓNDE PUEDE CIRCULAR UNA BICI. **SOLO MIDE.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LO QUE ESTE FICHERO **NO** HACE, dicho antes de que nadie lo suponga
// ═════════════════════════════════════════════════════════════════════════════
//   · **NO toca `src/grafo.js` ni ningún fichero de `src/`.** Ni una línea.
//   · **NO hace el grafo dirigido.** `oneway` se MIDE y no se aplica.
//   · **NO añade ningún campo a ninguna arista.** El predicado se calcula fuera,
//     uniendo por `e.way` contra el crudo de OSM.
//   · **NO construye la bici como modo**: ni estaciones, ni combinación, ni
//     tiempos. Aquí solo se contesta *«¿por dónde puede ir?»*.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ LA TRAMPA DE ESTA TANDA ES EL VERDE, Y ESTÁ ESCRITA DE ANTES
// ═════════════════════════════════════════════════════════════════════════════
//   `docs/DISENO-H2B-MODOS.md` §5.1 predijo el fallo: *«si la circulación de la
//   bici se define como “aristas con `ciclista`”, la tanda sale verde, produce
//   rutas, y son rutas por el 3,5 % del grafo. El motor contestaría, y
//   contestaría mal.»*
//
//   ⇒ Por eso aquí **lo primero que se mide es cuánto grafo deja pasar cada
//     variante**, y una ruta de ejemplo se publica **con el reparto de tipos de
//     arista**, nunca solo con sus metros. *Que salga una ruta no demuestra que
//     el predicado sea correcto: demuestra que hay camino.*
//
//   node tools/grafo/circulacion-bici.js

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const osm = require('../../src/osm');
const Ra = require('../../src/rutas-antonio');
const D = require('../../src/direccion');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);
const km = (m) => (m / 1000).toFixed(1) + ' km';
const pc = (a, b) => (100 * a / b).toFixed(1) + ' %';

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL PREDICADO, Y LA LEY 157 A SU NOMBRE
//
//   La prueba: *¿puede un lector que solo ve la etiqueta concluir algo que el
//   instrumento no sabe?*
//
//     `ciclable`        ⛔ NO PASA. Se lee «apto para ir en bici», que incluye
//                       que sea seguro y que sea legal. **De lo único que hay
//                       dato es de la CLASE DE VÍA de OSM.**
//     `transitableEnBici` ⛔ NO PASA, y por lo mismo que el anterior: «transitable»
//                       afirma que se puede pasar, y en una `primary` con tráfico
//                       denso eso es una opinión, no un dato.
//     `permitido`       ⛔ NO PASA: afirma permiso legal. **OSM no lo declara** —
//                       solo 2.502 aristas de 98.774 traen `bicycle=*`.
//     ⭐ `CIRCULA`      ✅ PASA. Dice que **esta clase de vía es de las que se
//                       recorren rodando**, y no dice ni que sea segura, ni que
//                       sea legal, ni que sea agradable.
//
//   ⇒ Y por eso el veredicto tiene TRES valores y no dos, con la misma forma que
//     el campo `lado` de H2a: **separar lo que se sabe de lo que se ignora.**
// ═════════════════════════════════════════════════════════════════════════════

/** ⭐ Por dónde se RUEDA. Sale de la clase de vía, que es de lo único que hay dato. */
const CIRCULA = new Set([
  // la franja propia de la bici
  'cycleway',
  // la calzada — ⛔ y esto NO es una preferencia: la tanda 1 midió que la red
  //   ciclable de Zaragoza son 666 trozos, así que sin calzada no hay red.
  'residential', 'service', 'tertiary', 'secondary', 'primary', 'unclassified',
  'living_street', 'primary_link', 'secondary_link', 'tertiary_link',
  // el campo: pistas y caminos. Se rueda, aunque se ruede peor.
  'track', 'path',
]);

/**
 * ⭐ Por dónde se EMPUJA: se pasa, pero bajándose de la bici.
 * ⚠️ Y esta clase existe porque las tres referencias la tienen. El literal de
 *    openrouteservice, tal cual — `setHighwaySpeed("footway", 6)` frente a 18 en
 *    calzada, y `setHighwaySpeed(KEY_STEPS, PUSHING_SECTION_SPEED / 2)` —, y OSRM
 *    ni siquiera las mete en su tabla `bicycle_speeds`. **No es un invento mío:
 *    es el nivel que los tres modelan y que nuestra constante única no puede.**
 */
const EMPUJA = new Set(['footway', 'pedestrian', 'corridor', 'steps']);

/**
 * ⛔ Lo que el DATO prohíbe explícitamente. Solo lo inequívoco, igual que hace
 *    `prohibidoPorElDato()` en `src/planarizar.js:142` para el peatón.
 * ⚠️ `bicycle=dismount` NO entra aquí: significa «bájate», que es EMPUJA, no
 *    prohibido. Meterlo en el mismo saco borraría la distinción.
 */
const prohibidoPorElDato = (t) => t.bicycle === 'no' || t.access === 'no';

/**
 * El veredicto de una arista. `circula` · `empuja` · `prohibido`.
 * @param {object} e arista del grafo (trae `highway`)
 * @param {object} t los tags del way, unidos por `e.way`
 */
function veredicto(e, t) {
  if (prohibidoPorElDato(t)) return 'prohibido';
  if (CIRCULA.has(e.highway)) return 'circula';
  if (EMPUJA.has(e.highway)) return 'empuja';
  // ⛔ todo lo demás —autovía, vía rápida, obras, proyectadas, circuito— es
  //   prohibido. Y NO es un cajón de sastre: es la misma lista negativa que
  //   `VIARIO_NO_ANDABLE` de `src/planarizar.js`, que ya excluye estas clases
  //   para el peatón por motivos que valen igual para la bici.
  return 'prohibido';
}

raya();
log('POR DÓNDE PUEDE CIRCULAR UNA BICI — solo se mide. ⛔ No se toca el grafo.');
raya();

// ═════════════════════════════════════════════════════════════════════════════
// P0 · EL UNIVERSO (ley 148) Y EL CONTROL DE LA UNIÓN
// ═════════════════════════════════════════════════════════════════════════════
const g = R.construir(R.ZONA_TERMINO);
const crudo = osm.cargar(R.CRUDO);
const tagsDe = new Map(crudo.ways.map((w) => [w.id, w.tags || {}]));
const TOT = g.aristas.length;
const TOTM = g.aristas.reduce((s, e) => s + e.largo, 0);

log('');
raya('─');
log('P0 · EL UNIVERSO — ⭐⭐ ley 148: sobre QUÉ grafo se mide');
raya('─');
di('grafo', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');
di('aristas · km', TOT + ' · ' + km(TOTM));
di('ways del crudo de OSM', crudo.ways.length + '   sello ' + crudo.sello);
// ⭐ EL CONTROL DE LA UNIÓN. Todo esto cuelga de unir la arista con sus tags por
//   `e.way`. Si la unión fallara en silencio, cada arista sin tags saldría como
//   «prohibido» y el predicado se hundiría sin decir por qué.
const sinTags = g.aristas.filter((e) => !tagsDe.has(e.way)).length;
di('⭐ aristas cuyo `way` NO está en el crudo', sinTags + (sinTags === 0 ? '   ✅ la unión es total' : '   ⛔'));
A.exige(sinTags === 0, `${sinTags} aristas no encuentran su way en el crudo: la unión por e.way no es total `
  + 'y todo lo que sigue está medido sobre tags vacíos');
// ⭐ y el uno que acompaña al cero (ley 152): que el control sepa fallar
{
  const falso = new Map(tagsDe); falso.delete(g.aristas[0].way);
  const roto = g.aristas.filter((e) => !falso.has(e.way)).length;
  di('⭐ provocado: se borra un way del índice', roto > 0 ? '✅ lo caza (' + roto + ')' : '⛔ NO lo caza');
  A.exige(roto > 0, 'el control de la unión no caza un way ausente: su cero no vale nada');
}

// ═════════════════════════════════════════════════════════════════════════════
// P1 · EL VEREDICTO SOBRE LAS 98.774
// ═════════════════════════════════════════════════════════════════════════════
const ver = g.aristas.map((e) => veredicto(e, tagsDe.get(e.way) || {}));
/** arista → su índice, para que un predicado pueda consultar `ver` sin copiar nada. */
const indiceDe = new Map(g.aristas.map((e, i) => [e, i]));
const idx = { circula: [], empuja: [], prohibido: [] };
for (let i = 0; i < ver.length; i++) idx[ver[i]].push(i);
const metrosDe = (l) => l.reduce((s, i) => s + g.aristas[i].largo, 0);

log('');
raya('─');
log('P1 · EL VEREDICTO — tres valores, y los dos primeros NO son lo mismo');
raya('─');
log('   ' + 'veredicto'.padEnd(14) + 'aristas'.padStart(9) + '% grafo'.padStart(9)
  + 'km'.padStart(11) + '% km'.padStart(8) + '   qué significa');
const QUE = {
  circula: 'se RUEDA. La clase de vía es de las que se recorren en bici',
  empuja: '⚠️ se pasa BAJÁNDOSE. No se rueda',
  prohibido: '⛔ el dato lo prohíbe, o la clase no admite bici',
};
for (const k of ['circula', 'empuja', 'prohibido']) {
  const m = metrosDe(idx[k]);
  log('   ' + k.padEnd(14) + String(idx[k].length).padStart(9) + pc(idx[k].length, TOT).padStart(9)
    + km(m).padStart(11) + pc(m, TOTM).padStart(8) + '   ' + QUE[k]);
}
A.exige(idx.circula.length + idx.empuja.length + idx.prohibido.length === TOT,
  'los tres veredictos no suman las aristas del grafo: hay aristas sin clasificar');

// ═════════════════════════════════════════════════════════════════════════════
// P2 · ⭐⭐⭐ CUÁNTO GRAFO DEJA PASAR CADA VARIANTE — y el fallo predicho
// ═════════════════════════════════════════════════════════════════════════════
/** Componentes conexas de un subconjunto de aristas. ⛔ No toca `g`. */
function componentes(pasa) {
  const p = new Array(g.nodos.length);
  for (let i = 0; i < p.length; i++) p[i] = i;
  const find = (x) => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
  let n = 0, m = 0;
  for (const e of g.aristas) {
    if (!pasa(e)) continue;
    n++; m += e.largo;
    const a = find(e.a), b = find(e.b);
    if (a !== b) p[a] = b;
  }
  const gr = new Map();
  for (const e of g.aristas) {
    if (!pasa(e)) continue;
    const r = find(e.a);
    if (!gr.has(r)) gr.set(r, { n: 0, m: 0 });
    const x = gr.get(r); x.n++; x.m += e.largo;
  }
  const l = [...gr.values()].sort((a, b) => b.m - a.m);
  return { n, m, comp: l.length, mayorM: l.length ? l[0].m : 0 };
}

const CALZADA = ['residential', 'service', 'tertiary', 'secondary', 'primary', 'unclassified',
  'living_street', 'primary_link', 'secondary_link', 'tertiary_link'];
const VARIANTES = [
  ['⛔ A · solo `cycleway` — EL FALLO PREDICHO', new Set(['cycleway'])],
  ['B · cycleway + campo (track, path)', new Set(['cycleway', 'track', 'path'])],
  ['⭐ C · B + CALZADA  ⇐ el predicado `circula`', new Set(['cycleway', 'track', 'path', ...CALZADA])],
  ['D · C + peatonal (empujando)', new Set(['cycleway', 'track', 'path', ...CALZADA, 'footway', 'pedestrian', 'corridor'])],
];

log('');
raya('─');
log('P2 · ⭐⭐⭐ CUÁNTO GRAFO DEJA PASAR CADA VARIANTE, Y EN CUÁNTOS TROZOS QUEDA');
raya('─');
log('   ' + 'variante'.padEnd(44) + 'aristas'.padStart(9) + '% grafo'.padStart(9)
  + 'km'.padStart(11) + 'trozos'.padStart(9) + 'el mayor'.padStart(10));
for (const [etq, S] of VARIANTES) {
  const r = componentes((e) => S.has(e.highway));
  log('   ' + etq.padEnd(44) + String(r.n).padStart(9) + pc(r.n, TOT).padStart(9)
    + km(r.m).padStart(11) + String(r.comp).padStart(9) + pc(r.mayorM, r.m).padStart(10));
}
log('');
log('   ⛔⛔ LA VARIANTE A ES EL FALLO QUE `docs/DISENO-H2B-MODOS.md` §5.1 PREDIJO,');
log('     y sale medido: un predicado hecho solo de carril bici deja pasar el 4,7 %');
log('     del grafo. ⚠️ Y la otra forma de escribir el mismo error —las 3.472 aristas');
log('     con `ciclista` del municipal, medidas en la tanda 1— es todavía menor: 3,5 %.');
log('   ⭐ Y la que decide es la C: **con la calzada dentro, la bici puede rutear.**');

// ⭐⭐ QUÉ PORCENTAJE **DEBERÍA** DEJAR PASAR — el álgebra ANTES del número (ley 51)
//
// ⛔⛔ Y LA PRIMERA VERSIÓN DE ESTE BLOQUE SE PUSO ROJA, con razón. Restaba las
//   `!e.pie` (4.204) como *«las que no admiten ni peatón ni bici»*, y **eso es
//   falso**: `e.pie` se apaga también con `foot=no` sobre clases que la bici sí
//   usa —184 `cycleway`, 94 `residential`, 47 `footway`—. ⇒ El álgebra mezclaba
//   una lista de CLASES con un filtro del DATO y no cuadraba por 635.
//   ⭐ El número no estaba mal: **estaba mal el argumento**, y lo cazó su propio
//     `A.exige` en la primera ejecución. *Por eso el álgebra se escribe antes.*
log('');
log('   ⭐⭐ ¿Y cuánto DEBERÍA dejar pasar? El álgebra, y NO puede pasar por construcción:');
log('     Una bici va por donde va un coche y además por donde el coche no va. ⇒ pierde');
log('     respecto al peatón las aceras y las escaleras, y gana respecto a él… nada.');
log('     ⛔ Todo se cuenta POR CLASE DE VÍA, sin mezclar con filtros del dato.');
{
  const nDe = (S) => g.aristas.filter((e) => S.has(e.highway)).length;
  // las clases que no admiten ni peatón ni bici: la lista NEGATIVA de src/planarizar.js
  const NI_UNO = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'busway',
    'raceway', 'services', 'rest_area', 'construction', 'proposed', 'planned',
    'razed', 'abandoned', 'disused']);
  const soloPeatonal = nDe(EMPUJA);
  const niUno = nDe(NI_UNO);
  const esperadoClase = TOT - soloPeatonal - niUno;
  di('   aristas del grafo', TOT);
  di('   − clases peatonales puras (acera, zona peatonal, escaleras)', '−' + soloPeatonal);
  di('   − clases que no admiten ni peatón ni bici (autovía, obras…)', '−' + niUno);
  di('   ⇒ aristas de clase «se rueda»', esperadoClase + '   (' + pc(esperadoClase, TOT) + ')');
  const porClaseReal = g.aristas.filter((e) => CIRCULA.has(e.highway)).length;
  di('   lo que sale contando clases', porClaseReal + (porClaseReal === esperadoClase ? '   ✅ cuadra exacto' : '   ⛔ NO CUADRA'));
  A.exige(porClaseReal === esperadoClase,
    `las tres listas de clases no parten el grafo: por clase salen ${porClaseReal} y el álgebra `
    + `dice ${esperadoClase}. Hay una clase de highway que no está en ninguna de las tres`);
  // y ahora el paso del DATO, que es el único que puede restar más
  const quitaElDato = porClaseReal - idx.circula.length;
  di('   − las que el DATO prohíbe (bicycle=no · access=no)', '−' + quitaElDato);
  di('   ⇒ veredicto «circula»', idx.circula.length + '   (' + pc(idx.circula.length, TOT) + ')');
  A.exige(porClaseReal - quitaElDato === idx.circula.length,
    'la resta del dato no cuadra con el veredicto: hay aristas clasificadas dos veces');
  A.exige(idx.circula.length / TOT > 0.30, `el predicado deja pasar solo ${pc(idx.circula.length, TOT)} `
    + 'del grafo: es el fallo predicho en docs/DISENO-H2B-MODOS.md §5.1 y no se puede construir encima');
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 · ⭐⭐ EL POSITIVO DE CONTROL (ley 152): acepta Y rechaza, en la misma pasada
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · ⭐⭐ EL POSITIVO DE CONTROL — un cero necesita su uno, y aquí van los dos');
raya('─');
const porClase = (h) => g.aristas.map((e, i) => [e, i]).filter(([e]) => e.highway === h);
const cuentaVer = (h, v) => porClase(h).filter(([, i]) => ver[i] === v).length;
log('   ' + 'lo que TIENE que pasar'.padEnd(40) + 'aristas'.padStart(9) + '  veredicto');
for (const h of ['cycleway', 'residential', 'primary', 'track']) {
  const n = porClase(h).length, ok = cuentaVer(h, 'circula');
  log('   ' + ('highway=' + h).padEnd(40) + String(n).padStart(9) + '  ' + ok + ' circula   '
    + (ok > 0 ? '✅' : '⛔ NO PASA NINGUNA'));
  A.exige(ok > 0, `ninguna arista de highway=${h} sale como «circula»: el predicado no acepta lo que debe`);
}
log('');
log('   ' + 'lo que TIENE que rechazar'.padEnd(40) + 'aristas'.padStart(9) + '  veredicto');
for (const [h, esperado] of [['steps', 'empuja'], ['motorway', 'prohibido'], ['trunk', 'prohibido'],
  ['motorway_link', 'prohibido'], ['construction', 'prohibido'], ['footway', 'empuja']]) {
  const n = porClase(h).length, mal = porClase(h).filter(([, i]) => ver[i] === 'circula').length;
  log('   ' + ('highway=' + h + ' ⇒ ' + esperado).padEnd(40) + String(n).padStart(9)
    + '  ' + (n - mal) + ' bien   ' + (mal === 0 ? '✅' : '⛔ ' + mal + ' SE CUELAN COMO «circula»'));
  A.exige(mal === 0, `${mal} aristas de highway=${h} salen como «circula» y no deberían`);
}
log('');
{
  // ⭐ y la mitad negativa que viene del DATO, no de la clase
  const bicicletaNo = g.aristas.map((e, i) => [e, i]).filter(([e]) => (tagsDe.get(e.way) || {}).bicycle === 'no');
  const cazadas = bicicletaNo.filter(([, i]) => ver[i] === 'prohibido').length;
  di('aristas con `bicycle=no` en el dato', bicicletaNo.length);
  di('   …de ellas, veredicto «prohibido»', cazadas + (cazadas === bicicletaNo.length ? '   ✅ todas' : '   ⛔'));
  A.exige(cazadas === bicicletaNo.length, 'alguna arista con bicycle=no no sale como prohibido');
  // ⭐⭐ LA PROVOCACIÓN: que el predicado sepa cambiar de veredicto
  const cobaya = g.aristas[idx.circula[0]];
  const antes = veredicto(cobaya, tagsDe.get(cobaya.way) || {});
  const despues = veredicto(cobaya, { ...(tagsDe.get(cobaya.way) || {}), bicycle: 'no' });
  di('⭐ provocado: se le pone `bicycle=no` a una que circula',
    antes === 'circula' && despues === 'prohibido' ? '✅ cambia a prohibido' : '⛔ NO cambia');
  A.exige(antes === 'circula' && despues === 'prohibido',
    'el predicado no reacciona a `bicycle=no`: su mitad negativa no vale nada');
}

// ═════════════════════════════════════════════════════════════════════════════
// P4 · `oneway` — SE MIDE, ⛔ NO SE APLICA
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · `oneway` — ⛔ se MIDE el tamaño del problema. NO se hace el grafo dirigido.');
raya('─');
{
  const circ = idx.circula.map((i) => g.aristas[i]);
  const one = circ.filter((e) => (tagsDe.get(e.way) || {}).oneway === 'yes');
  di('aristas que «circulan»', circ.length);
  di('⛔ …de ellas con `oneway=yes`', one.length + '   (' + pc(one.length, circ.length) + ')   '
    + km(one.reduce((s, e) => s + e.largo, 0)));
  const m = new Map();
  for (const e of one) m.set(e.highway, (m.get(e.highway) || 0) + 1);
  log('      por clase: ' + [...m].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ':' + v).join(' · '));
  log('');
  log('   ⛔⛔ QUÉ PASA HOY SI SE IGNORA, dicho sin rodeos: el grafo es NO DIRIGIDO');
  log('     (`src/grafo.js:18`, `adyacencia()` empuja en los dos sentidos), así que');
  log('     **una ruta en bici puede meterse a contramano por cualquiera de esas');
  log('     ' + one.length + ' aristas** y el motor no se enteraría. Es el ' + pc(one.length, circ.length) + ' de su propia red.');
  log('');
  log('   ⚠️ ¿PUEDE UNA BICI IR EN CONTRA DE UN `oneway`? — se contesta con el DATO:');
  const decl = g.aristas.filter((e) => (tagsDe.get(e.way) || {})['oneway:bicycle'] === 'no').length;
  const declEnCirc = one.filter((e) => (tagsDe.get(e.way) || {})['oneway:bicycle'] === 'no').length;
  di('   aristas con `oneway:bicycle=no` en todo el grafo', decl);
  di('   …de las ' + one.length + ' que circulan con oneway', declEnCirc);
  log('      ⇒ ⛔ **`NO CONSTA` para las otras ' + (one.length - declEnCirc) + '.** En España el');
  log('        contrasentido ciclista existe pero depende de señalización municipal, y');
  log('        **OSM no lo declara aquí**. ⛔ Es dato, no deducción: no se supone ni que sí');
  log('        ni que no.');
}

// ═════════════════════════════════════════════════════════════════════════════
// P5 · ⭐⭐ UNA RUTA DE EJEMPLO — Y SE PUBLICA POR DÓNDE VA, NO SOLO QUE EXISTE
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P5 · ⭐⭐ UNA RUTA EN BICI — ⛔ que salga no demuestra nada. Lo que cuenta es por dónde va.');
raya('─');
{
  // ⛔ Los dos extremos NO los elijo a ojo sobre el mapa: son dos de los cuatro
  //   POI que el proyecto ya tiene declarados en `src/rutas-antonio.js:45`, y son
  //   los dos más separados (ley 17: el control no lo elige quien escribe).
  const ctx = D.abrir(g, R.CRUDO);
  const o = Ra.puntoDe('Estación Delicias', ctx, g);
  const d = Ra.puntoDe('C.C. Utrillas', ctx, g);
  A.exige(!!o && !!d, 'no se han podido enganchar los dos POI: la ruta de ejemplo no se puede medir');

  // ═══════════════════════════════════════════════════════════════════════════
  // ⛔⛔ EL HALLAZGO QUE ESTA TANDA NO IBA BUSCANDO — Y APARECIÓ EN ROJO
  //
  //   La primera versión pedía la ruta en bici con el enganche NORMAL, el que usa
  //   el motor para andar. Salió **«sin camino»** mientras a pie salían 4.743 m.
  //   ⛔ Y la primera explicación que escribí —*«el predicado deja el grafo
  //     roto»*— **era falsa**: la mayor componente de `circula` tiene el 94,3 %
  //     de los km. Lo que estaba roto no era la red: era **el sitio por donde se
  //     entra en ella.**
  //
  //   ⇒ ⭐⭐⭐ **Un edificio engancha a una ACERA, y por una acera no se rueda.**
  //     La bici necesita SU PROPIO ENGANCHE, igual que lo van a necesitar las
  //     estaciones BiZi (H2b·3). Se mide aquí y no se arregla.
  // ═══════════════════════════════════════════════════════════════════════════
  const Po = require('../../src/portales');
  const setCircula = new Set(idx.circula.map((i) => g.aristas[i]));
  const engBici = Po.indexarAristas(g.aristas, (e) => setCircula.has(e));
  const puntoBici = (nombre) => {
    const p = Ra.POI[nombre];
    const m = require('../../src/geo').aMetros(p.lon, p.lat);
    const { mejor } = Po.engancharUno(m, g.aristas, engBici, () => '', 400);
    return mejor ? { arista: mejor.i, seg: mejor.k, t: mejor.t, q: mejor.q, d: mejor.d } : null;
  };
  log('   ⛔⛔ POR DÓNDE ENTRA CADA MODO EN LA RED — y no es lo mismo');
  log('   ' + 'POI'.padEnd(22) + 'enganche A PIE'.padEnd(34) + 'enganche EN BICI');
  const oB = puntoBici('Estación Delicias');
  const dB = puntoBici('C.C. Utrillas');
  for (const [nom, pPie, pBici] of [['Estación Delicias', o, oB], ['C.C. Utrillas', d, dB]]) {
    const eP = g.aristas[pPie.arista];
    const eB = pBici ? g.aristas[pBici.arista] : null;
    log('   ' + nom.padEnd(22)
      + (eP.highway + ' a ' + pPie.d.toFixed(1) + ' m [' + veredicto(eP, tagsDe.get(eP.way) || {}) + ']').padEnd(34)
      + (eB ? eB.highway + ' a ' + pBici.d.toFixed(1) + ' m' : '⛔ ninguna a 400 m'));
  }
  A.exige(!!oB && !!dB, 'algún POI no encuentra arista «circula» a menos de 400 m: la bici no puede '
    + 'ni empezar la ruta desde ahí');
  log('');
  log('   ⇒ ⭐⭐ **El hueco del enganche en bici es mayor que el de a pie**, y eso NO es');
  log('     un defecto del predicado: es que los edificios dan a la acera. **La bici');
  log('     necesita su propio enganche**, y ese tramo se hace EMPUJANDO.');
  log('');

  // ⭐⭐⭐ TANDA DE ARREGLO 9 · EL APAÑO DE ESTA LÍNEA HA DESAPARECIDO, y es la
  //   prueba de que la firma nueva sirve para lo que se cambió.
  //   ⛔ Lo que había aquí antes: `adyacencia()` solo aceptaba el booleano
  //     `soloAPie`, así que para conseguir una red de bici había que pasarle una
  //     COPIA de las 98.774 aristas con `pie` redefinido —`{ ...e, pie: false }`—.
  //     Era un apaño de medición declarado en voz alta, no un diseño.
  //   ⭐ Ahora se le pasa el predicado y ya está. **Mismos números, sin copia.**
  const pasaBici = (e) => ver[indiceDe.get(e)] === 'circula';
  const { ady } = G.adyacencia(g.nodos, g.aristas, pasaBici, false);
  const gBici = { ...g, ady };

  const rPie = G.rutaEntre(g, o, d);
  const rBiciMalEnganchada = G.rutaEntre(gBici, o, d);
  const rBici = G.rutaEntre(gBici, oB, dB);
  di('a pie   · enganche a pie', rPie.encontrada ? rPie.metros + ' m · ' + rPie.aristas.length + ' aristas' : '⛔ sin camino');
  di('⛔ en bici · con el enganche DE ANDAR', rBiciMalEnganchada.encontrada
    ? rBiciMalEnganchada.metros + ' m' : '⛔ SIN CAMINO — y el grafo no está roto: lo está la puerta');
  di('⭐ en bici · con enganche de bici', rBici.encontrada ? rBici.metros + ' m · ' + rBici.aristas.length + ' aristas' : '⛔ sin camino');
  A.exige(rBici.encontrada, 'no hay ruta en bici ni con enganche propio: entonces sí es la red la que '
    + 'está rota, y no el enganche');
  // ⭐ LEY 152 · el cero necesita su uno: el «sin camino» de arriba tiene que ser
  //   REPRODUCIBLE y explicado, no una anécdota. Si algún día deja de salir, es
  //   que alguien ha tocado el enganche y hay que enterarse.
  A.exige(!rBiciMalEnganchada.encontrada,
    'ahora SÍ hay ruta en bici con el enganche de andar: el hallazgo de esta tanda ha dejado de ser '
    + 'cierto y el texto que lo explica está caducado');

  if (rBici.encontrada) {
    log('');
    log('   ⭐⭐⭐ EL REPARTO DE LA RUTA EN BICI — esto es lo que hay que mirar, no los metros');
    const rep = new Map();
    for (const ia of rBici.aristas) {
      const e = g.aristas[ia];
      rep.set(e.highway, (rep.get(e.highway) || 0) + e.largo);
    }
    const tot = [...rep.values()].reduce((s, x) => s + x, 0);
    log('   ' + 'highway'.padEnd(18) + 'metros'.padStart(10) + '%'.padStart(8) + '   veredicto');
    for (const [h, m] of [...rep].sort((a, b) => b[1] - a[1])) {
      log('   ' + h.padEnd(18) + m.toFixed(0).padStart(10) + pc(m, tot).padStart(8)
        + '   ' + (CIRCULA.has(h) ? 'circula' : EMPUJA.has(h) ? '⚠️ empuja' : '⛔ prohibido'));
    }
    const enCarril = rep.get('cycleway') || 0;
    log('');
    di('⭐ de la ruta, por CARRIL BICI', km(enCarril) + '   (' + pc(enCarril, tot) + ')');
    log('      ⇒ ⚠️ **el resto va por calzada**, que es exactamente lo que la tanda 1');
    log('        anticipó al medir que la red ciclable son 666 trozos. **No es un');
    log('        defecto del predicado: es cómo está la ciudad.**');
    // ⛔ y la ley 177: la constante única ya está mintiendo si los tipos son muy distintos
    log('');
    log('   ⛔ LEY 177 SOBRE ESTA RUTA: pasa por ' + rep.size + ' clases de vía distintas, y');
    log('     openrouteservice les daría velocidades distintas (18 en calzada, 12 en');
    log('     `track`, 10 en `path`). **Con una sola constante de 18 km/h, el tiempo de');
    log('     esta ruta ya es optimista.** Se declara; no se arregla aquí.');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// P6 · ⛔⛔ QUÉ HARÍA FALTA PARA METERLO EN EL MOTOR — medido, no estimado
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P6 · ⛔⛔ QUÉ TOCA H1 — medido. **No se toca nada: se mide y se para.**');
raya('─');
{
  di('¿está `highway` en la arista?', "SÍ — `e.highway`. ⇒ el predicado de CLASE no necesita campo nuevo");
  di('¿están `bicycle` / `access` / `oneway` en la arista?', 'NO. Solo viven en los tags del crudo');
  const conTags = g.aristas.filter((e, i) => {
    const t = tagsDe.get(e.way) || {};
    return prohibidoPorElDato(t) && CIRCULA.has(e.highway);
  }).length;
  log('');
  log('   ⭐ EL PRECIO DE **NO** REABRIR H1, en un número:');
  di('   aristas que el dato prohíbe y la clase dejaría pasar', conTags);
  di('   sobre las que «circulan»', pc(conTags, idx.circula.length));
  log('      ⇒ un predicado hecho SOLO con `e.highway` —que no toca nada— se equivoca');
  log('        en ' + conTags + ' aristas de ' + idx.circula.length + '. **Ése es el coste de no abrir H1**, y es de Antonio.');
  log('');
  log('   ⛔⛔ Y LO QUE **SÍ** OBLIGA A TOCAR `src/`, que es más grande que un campo:');
  log('     `src/grafo.js:18` — `adyacencia(nodos, aristas, soloAPie = true, …)`');
  log('     **El modo no es un predicado: es un booleano con el nombre de un modo.**');
  log('     Para que el motor rutee en bici hay que darle a esa función una forma de');
  log('     preguntar «¿pasa este modo?», y eso es cambiar su firma. ⇒ **PARA Y AVISA.**');
  log('');
  log('   ⚠️ Y el coste de la alternativa, para que se pueda comparar:');
  log('     mantener la unión por `e.way` en ejecución cuesta un índice de '
    + crudo.ways.length + ' entradas');
  log('     en memoria, y **obliga a llevar el crudo de OSM al lado del grafo**, que hoy');
  log('     no hace falta para andar.');
}

log('');
raya();
log(A.cierre('LA CIRCULACIÓN DE LA BICI'));
