// ⭐⭐ TANDA 17 · ¿DE QUÉ CALLE ES ESTA ACERA? — la MEDIDA de la idea de Antonio.
//
//   node src/nombrar-aceras.js
//
// ⛔⛔ MIDE. NO TOCA EL MOTOR NI CAMBIA NINGÚN NOMBRE. `src/ruta.js`, el
//     planarizado, el enganche y `src/relato.js` salen de esta tanda byte a byte
//     como entraron: la auditoría de H1 revisa exactamente lo que iba a revisar.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?» — POR VERIFICACIÓN,
//       ESCRITO ANTES DE EJECUTAR NADA
// ═════════════════════════════════════════════════════════════════════════════
//
// A2 · «clasificar antes de contar» puede salir bien sin decir nada si la clase la
//      elijo yo para que cuadre. ⇒ la separación entre «molesta» y «no molesta» NO
//      es de longitud (un umbral mío), es SEMÁNTICA y sale del propio redactor: un
//      paso de peatones y unas escaleras se cuentan «Cruzas por un paso de
//      peatones» / «Subes o bajas unas escaleras» — el nombre NO les hace falta y
//      no lo llevan en ninguna ciudad. Todo lo demás se cuenta «Por un tramo sin
//      nombre», y ahí sí falta.
//
// A4 · «cuántas tienen portales pegados» puede fallar por construcción si «pegado»
//      lo defino con un radio a ojo. ⇒ NO hay radio: «pegado» = el enganche de ese
//      portal cayó EN ESA ARISTA. Es la relación que el motor ya calculó, leída al
//      revés — que es exactamente la idea de Antonio. El reparto de distancias de
//      esos enganches se publica al lado, para que se vea qué significa «pegado».
//
// B2a· el patrón de verdad se puede fingir leyendo el nombre que se supone tapado.
//      Es el fallo nº92 (un espejo) con otro disfraz. ⇒ DOS defensas independientes:
//      (1) estructural — el método recibe una proyección de tres campos sin el
//      nombre de OSM (ver `src/heredar-nombre.js`); (2) mecánica — un CEPO sobre
//      `g.nombres.get` durante toda la evaluación, y **al cepo se le ve el rojo
//      antes** de fiarse de él (un guardián sin rojo visto es una promesa).
//
// B2b· el barajado GLOBAL puede «pasar» sin demostrar nada: con 3.359 vías en el
//      bombo, tres nombres al azar no coinciden jamás, así que el derrumbe está
//      garantizado por aritmética y no dice si el método mide identidad o
//      geografía. ⭐ EL ÁLGEBRA, ESCRITA ANTES (ley 51): con núcleos iid de un
//      bombo de ~3.000, P(≥2 de 3 iguales) ≈ 3/3.000 ≈ 0,1 %. ⇒ si sale ≈0 no he
//      demostrado gran cosa; si sale ALTO, el método está roto. Es un control
//      negativo, y se declara como tal.
//      ⇒ por eso hay un segundo barajado, LOCAL: se permutan los nombres SOLO entre
//      portales de la misma celda de 300 m. Ahí los nombres siguen siendo los de la
//      zona y siguen agrupados; si el método sigue acertando, está midiendo
//      «qué calles hay por aquí» y no «de quién es esta acera».
//
// B2c· LA CIRCULARIDAD, que es la trampa de la tanda: el enganche decide a qué
//      arista va cada portal, y el método usa esos portales para nombrar esa
//      arista. ⇒ se coge a los que SABEMOS mal enganchados (los 198 con firma y
//      los 23 imputables de la tanda 14) y se mira qué nombre producen.
//      ⚠️ Y mi recuento de los 198/23 es una REIMPLEMENTACIÓN del criterio de
//      `candidatos-enganche.js`: si no reprodujera 198 y 23, estaría midiendo otra
//      cosa. Se exige que cuadre — ése es su positivo de control.
//
// C2 · el acierto contra el patrón de verdad es un TECHO, no una estimación: las
//      aristas CON nombre no son una muestra al azar de las que no lo tienen.
// C3 · y ese techo se acota estandarizando por estratos (zona × nº de portales):
//      se pesa el acierto de las aristas con nombre con el reparto de estratos de
//      las aristas SIN nombre.
//
// D1 · el ejemplo de Antonio se resuelve aquí con `G.rutaEntre` —la misma función
//      del motor— y se CUADRA contra `node src/ruta.js … --json`, que es la
//      interfaz sancionada. Si los metros no coinciden, es que he resuelto otra
//      ruta, y el cuadre lo caza.
// D2 · las siete NO se recalculan: se piden a `rutas-antonio.js --aristas`, que es
//      el único que las produce (el fallo nº68 fue exactamente dos copias del
//      mismo cálculo).

'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const P = require('./portales');
const D = require('./direccion');
const M = require('./municipal');
const G = require('./grafo');
const Rel = require('./relato');
const A = require('./alarma');
const H = require('./heredar-nombre');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');
const { rng } = require('./sin-vigilancia');
const { aGrados } = require('./geo');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
const km = (m) => (m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m');
const SEMILLA = 20260804;
const FIRMA = 10;               // m — mismo criterio que la tanda 14
const RADIO_COBERTURA = 60;     // m — mismo criterio que la tanda 14

const T0 = Date.now();
const g = construir(ZONA_TERMINO);
const ctx = D.abrir(g, CRUDO);
const portales = ctx.enganche.portales.filter((o) => o.enganchado);
const nombreDeWay = (id) => g.nombres.get(id) || null;

// ⭐ el nombre de cada arista, calculado UNA vez y ANTES de que el cepo se instale.
const nombreArista = g.aristas.map((e) => nombreDeWay(e.way));
const nucleoArista = nombreArista.map((n) => P.nucleo(n));
const sinNombre = [];
const conNombre = [];
for (let i = 0; i < g.aristas.length; i++) (nombreArista[i] ? conNombre : sinNombre).push(i);

// ── la proyección: TRES campos, y el nombre de OSM no está ───────────────────
const proy = portales.map(H.proyectar);
const grupos = H.agrupar(proy);

// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(110));
log('A · ⭐ LAS ARISTAS SIN NOMBRE — cuántas son, y qué son');
log('='.repeat(110));

const largo = (i) => g.aristas[i].largo;
const suma = (l) => l.reduce((s, i) => s + largo(i), 0);
const mTotal = suma(g.aristas.map((_, i) => i));
const mSin = suma(sinNombre);

log('');
log('A1 · el número, Y LOS METROS — una arista es una unidad arbitraria; los metros dicen');
log('     cuánto recorrido afecta.');
di('aristas del grafo de la ciudad', g.aristas.length);
di('⭐ …sin nombre en OSM', `${sinNombre.length}  (${pct(sinNombre.length, g.aristas.length)})`);
di('metros de red', km(mTotal));
di('⭐ …sin nombre', `${km(mSin)}  (${pct(mSin, mTotal)})`);
{
  const pie = g.aristas.map((_, i) => i).filter((i) => g.aristas[i].pie);
  const pieSin = pie.filter((i) => !nombreArista[i]);
  di('aristas transitables a pie', `${pie.length}  (${km(suma(pie))})`);
  di('   …sin nombre', `${pieSin.length}  (${pct(pieSin.length, pie.length)} · ${km(suma(pieSin))})`);
}
log('');
log('   ⚠️ «sin nombre» = el way de OSM no trae `name`. NO significa que la calle no');
log('      tenga nombre en la realidad: significa que este dato no lo dice.');

// ── A2 · CLASIFICAR ANTES DE CONTAR ─────────────────────────────────────────
log('');
log('A2 · ⭐ CLASIFICADAS ANTES DE CONTARLAS (ley 29) — ¿qué son esas aristas?');
log('');
log('   ' + 'precisión (D4)'.padEnd(30) + 'aristas'.padStart(10) + 'metros'.padStart(12)
  + '% de los metros'.padStart(17) + '   ¿le falta el nombre?');
const NO_NECESITAN = new Set(['paso-de-peatones', 'escaleras']);
{
  const porPrec = new Map();
  for (const i of sinNombre) {
    const p = g.aristas[i].precision;
    if (!porPrec.has(p)) porPrec.set(p, { n: 0, m: 0 });
    const v = porPrec.get(p); v.n++; v.m += largo(i);
  }
  for (const [k, v] of [...porPrec.entries()].sort((a, b) => b[1].m - a[1].m)) {
    log('   ' + k.padEnd(30) + String(v.n).padStart(10) + km(v.m).padStart(12)
      + pct(v.m, mSin).padStart(17)
      + '   ' + (NO_NECESITAN.has(k) ? '⛔ NO: el relato ya dice qué es' : '⭐ SÍ'));
  }
}
log('');
log('   ⭐⭐ LA SEPARACIÓN NO ES DE LONGITUD, ES SEMÁNTICA — y no la elijo yo: sale del');
log('      redactor que ya existe. Un paso de peatones se cuenta «Cruzas por un paso de');
log('      peatones» y unas escaleras «Subes o bajas unas escaleras»: el nombre no les hace');
log('      falta. Todo lo demás se cuenta «Por un tramo sin nombre», y ahí sí falta.');
const molestan = sinNombre.filter((i) => !NO_NECESITAN.has(g.aristas[i].precision));
const mMolestan = suma(molestan);
log('');
di('⭐ ARISTAS SIN NOMBRE QUE MOLESTAN', `${molestan.length}  (${km(mMolestan)})`);
di('   …y las que no (pasos y escaleras)', `${sinNombre.length - molestan.length}  (${km(mSin - mMolestan)})`);
{
  log('');
  log('   el reparto por longitud de las que molestan — el problema no es el número, es');
  log('   dónde están los metros:');
  const B = [[0, 10], [10, 25], [25, 50], [50, 100], [100, 250], [250, 1e9]];
  log('   ' + 'longitud'.padEnd(18) + 'aristas'.padStart(10) + 'metros'.padStart(12) + '% metros'.padStart(11));
  for (const [a, b] of B) {
    const l = molestan.filter((i) => largo(i) >= a && largo(i) < b);
    log('   ' + (b > 1e8 ? `≥ ${a} m` : `${a}–${b} m`).padEnd(18) + String(l.length).padStart(10)
      + km(suma(l)).padStart(12) + pct(suma(l), mMolestan).padStart(11));
  }
}
{
  log('');
  log('   y el `highway` de OSM que son (las 8 clases más largas):');
  const c = new Map();
  for (const i of molestan) {
    const h = g.aristas[i].highway || '(sin highway)';
    if (!c.has(h)) c.set(h, { n: 0, m: 0 });
    const v = c.get(h); v.n++; v.m += largo(i);
  }
  for (const [k, v] of [...c.entries()].sort((a, b) => b[1].m - a[1].m).slice(0, 8)) {
    log('   ' + String(k).padEnd(30) + String(v.n).padStart(10) + km(v.m).padStart(12) + pct(v.m, mMolestan).padStart(11));
  }
}

// ── A3 · POR ZONA ────────────────────────────────────────────────────────────
log('');
log('A3 · ⭐ POR ZONA — las mismas ventanas del eje densidad (`src/ciudad.js`, tanda 9).');
log('   ⚠️ son ventanas para comparar tejidos, no límites administrativos. Y NO cubren el');
log('      término entero: lo que queda fuera va en «(fuera de las ventanas)».');
log('');
// punto medio en grados, UNA vez por arista
const medioG = g.aristas.map((e) => {
  const m = e.pts[Math.floor(e.pts.length / 2)];
  return aGrados(m[0], m[1]);
});
const zonaDe = (i) => {
  const [lon, lat] = medioG[i];
  for (const z of ZONAS) {
    if (lat >= z.b.sur && lat <= z.b.norte && lon >= z.b.oeste && lon <= z.b.este) return z.n;
  }
  return '(fuera de las ventanas)';
};
const zonaArista = g.aristas.map((_, i) => zonaDe(i));
{
  log('   ' + 'zona'.padEnd(34) + 'aristas'.padStart(9) + 'sin nombre'.padStart(12)
    + '% aristas'.padStart(11) + 'metros sin nombre'.padStart(19) + '% metros'.padStart(10));
  const orden = [...ZONAS.map((z) => z.n), '(fuera de las ventanas)'];
  for (const zn of orden) {
    const tod = [];
    for (let i = 0; i < g.aristas.length; i++) if (zonaArista[i] === zn) tod.push(i);
    if (!tod.length) continue;
    const sn = tod.filter((i) => !nombreArista[i]);
    log('   ' + zn.padEnd(34) + String(tod.length).padStart(9) + String(sn.length).padStart(12)
      + pct(sn.length, tod.length).padStart(11) + km(suma(sn)).padStart(19)
      + pct(suma(sn), suma(tod)).padStart(10));
  }
}

// ── A4 · ¿CUÁNTAS TIENEN PORTALES PEGADOS? ──────────────────────────────────
log('');
log('A4 · ⭐ ¿CUÁNTAS TIENEN PORTALES PEGADOS? — la condición de partida del método');
log('');
log('   ⛔ «PEGADO» NO LLEVA RADIO, y eso es a propósito: un radio a ojo sería un umbral');
log('      mío escondido en la definición. «Pegado» = **el enganche de ese portal cayó en');
log('      esta arista** — la relación que el motor ya calculó, leída al revés. Es');
log('      literalmente la idea de Antonio: la información que sirve para verificar el');
log('      enganche, preguntada del otro lado.');
{
  const conPortales = molestan.filter((i) => grupos.has(i));
  const con3 = molestan.filter((i) => {
    const l = grupos.get(i);
    return l && l.filter((p) => p.nucleoMunicipal).length >= H.MIN_PORTALES;
  });
  di('aristas sin nombre que molestan', `${molestan.length}  (${km(mMolestan)})`);
  di('   …con AL MENOS UN portal pegado', `${conPortales.length}  (${pct(conPortales.length, molestan.length)} · ${km(suma(conPortales))})`);
  di(`   …con al menos ${H.MIN_PORTALES} con nombre municipal (el mínimo del método)`,
    `${con3.length}  (${pct(con3.length, molestan.length)} · ${km(suma(con3))} · ${pct(suma(con3), mMolestan)} de los metros)`);
  log('');
  log('   ⭐ y qué significa «pegado», en metros — el reparto de las distancias de enganche');
  log('      de esos portales (la mediana del callejero entero es 5,3 m):');
  const ds = [];
  for (const i of conPortales) for (const p of grupos.get(i)) ds.push(p.dEnganche);
  ds.sort((a, b) => a - b);
  const q = (x) => ds[Math.min(ds.length - 1, Math.floor(x * ds.length))];
  di('   portales pegados a una arista sin nombre', ds.length);
  di('   mediana · p90 · p99 · máximo',
    `${q(0.5).toFixed(1)} m · ${q(0.9).toFixed(1)} m · ${q(0.99).toFixed(1)} m · ${ds[ds.length - 1].toFixed(1)} m`);
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('B · ⭐⭐ EL MÉTODO, Y SU CONTRAPRUEBA **ANTES** QUE SU RESULTADO');
log('='.repeat(110));
log('');
log('B1 · EL MÉTODO, escrito antes de ejecutarlo (y los umbrales, fijados antes de ver un');
log('     solo resultado — `src/heredar-nombre.js`):');
log('');
log('     1 · los portales de una arista son los que ENGANCHARON a ella. Sin radio.');
log('     2 · cada portal vota el núcleo de SU calle según el `codigoVia` municipal.');
log('         ⭐ el nombre viene del Ayuntamiento, no de OSM: es otra fuente.');
log('     3 · con menos de ' + H.MIN_PORTALES + ' votos → MUDA. (listón heredado del consenso de la nube,');
log('         `src/enganche.js`, tanda 6: no está elegido para que salga bien esto.)');
log('     4 · si el más votado llega a ' + (100 * H.ACUERDO).toFixed(0) + ' % → NOMBRADA. Si no → AMBIGUA.');
log('     5 · los empates no llevan regla aparte: un 2–2 da 50 % y cae solo en AMBIGUA.');
log('');
log('   ⚠️ El ' + (100 * H.ACUERDO).toFixed(0) + ' % lo elijo YO. Va dicho, y la curva entera se publica en C1 — pero el');
log('      número que se publica es el de 2/3, fijado antes de mirar.');

// ── B2a · EL CEPO, Y SU ROJO ────────────────────────────────────────────────
log('');
log('B2 · ⭐⭐⭐ LA CONTRAPRUEBA — y va ANTES de cualquier resultado.');
log('');
log('   B2a · ¿PUEDE EL MÉTODO ESTAR LEYENDO EL NOMBRE QUE SE SUPONE TAPADO?');
log('      Es el fallo nº92 (un espejo) con otro disfraz. Dos defensas independientes:');
log('      (1) ESTRUCTURAL · el método recibe {arista, nucleoMunicipal, dEnganche}. El');
log('          campo `nucleoOsm` no llega: no se puede leer lo que no existe.');
log('      (2) MECÁNICA · un cepo sobre `g.nombres.get` mientras evalúa.');
let cepoVisto = false;
{
  const real = g.nombres.get.bind(g.nombres);
  g.nombres.get = () => { throw new Error('⛔ el método ha leído el nombre de OSM'); };
  // ⭐ PRIMERO EL ROJO DEL CEPO. Un guardián cuyo rechazo nadie ha provocado es una
  //    promesa, no una red — y un cepo que no salta haría pasar la prueba a todos.
  try { g.nombres.get(1); } catch (e) { cepoVisto = true; }
  let saltó = null;
  try {
    for (const i of molestan) H.decidir(grupos.get(i));
    for (const i of conNombre) H.decidir(grupos.get(i));
  } catch (e) { saltó = e.message; }
  g.nombres.get = real;
  di('   ⭐ el cepo salta cuando se le provoca (su ROJO, visto)', cepoVisto ? '✅ sí' : '⛔ NO — el cepo no vale');
  A.exige(cepoVisto, 'el cepo sobre g.nombres.get no salta ni provocándolo: no prueba nada');
  di('   evaluación completa con el cepo puesto', saltó ? '⛔ ' + saltó : '✅ el método no leyó ni un nombre de OSM');
  A.exige(!saltó, 'el método leyó el nombre de OSM durante la evaluación: es un espejo');
  // control de que el cepo se quitó bien
  A.exige(g.nombres.get(g.aristas[conNombre[0]].way) != null, 'el cepo no se ha desinstalado: todo lo que sigue está roto');
}

// ── B2b · LOS DOS BARAJADOS ─────────────────────────────────────────────────
const barajar = (mapa) => (p) => mapa.get(p);

/** Permuta los núcleos municipales entre TODOS los portales. Control negativo. */
function barajadoGlobal(semilla) {
  const r = rng(semilla);
  const nk = proy.map((p) => p.nucleoMunicipal);
  for (let i = nk.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [nk[i], nk[j]] = [nk[j], nk[i]]; }
  const m = new Map();
  proy.forEach((p, i) => m.set(p, nk[i]));
  return barajar(m);
}

/** Permuta los núcleos SOLO entre portales de la misma celda de 300 m. */
function barajadoLocal(semilla, celda = 300) {
  const r = rng(semilla);
  const cel = new Map();
  proy.forEach((p, i) => {
    const o = portales[i];
    const k = Math.floor(o.m[0] / celda) + ',' + Math.floor(o.m[1] / celda);
    if (!cel.has(k)) cel.set(k, []);
    cel.get(k).push(i);
  });
  const m = new Map();
  for (const idxs of cel.values()) {
    const nk = idxs.map((i) => proy[i].nucleoMunicipal);
    for (let i = nk.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [nk[i], nk[j]] = [nk[j], nk[i]]; }
    idxs.forEach((ix, k) => m.set(proy[ix], nk[k]));
  }
  return barajar(m);
}

/** Los tres cubos sobre un conjunto de aristas CON nombre conocido. */
function contraVerdad(lista, nucleoDe) {
  let acierta = 0, falla = 0, ambigua = 0, muda = 0;
  const fallos = [];
  for (const i of lista) {
    const d = H.decidir(grupos.get(i), nucleoDe);
    if (d.estado === 'MUDA') { muda++; continue; }
    if (d.estado === 'AMBIGUA') { ambigua++; continue; }
    if (d.nombre === nucleoArista[i]) acierta++;
    else { falla++; fallos.push({ i, d }); }
  }
  const opina = acierta + falla;
  return { n: lista.length, acierta, falla, ambigua, muda, opina,
    acierto: opina ? acierta / opina : NaN, cobertura: lista.length ? opina / lista.length : NaN, fallos };
}

/** Cuántas de las aristas sin nombre quedarían NOMBRADAS. */
function cuantasNombra(lista, nucleoDe) {
  let nom = 0, amb = 0, mud = 0, m = 0;
  for (const i of lista) {
    const d = H.decidir(grupos.get(i), nucleoDe);
    if (d.estado === 'NOMBRADA') { nom++; m += largo(i); } else if (d.estado === 'AMBIGUA') amb++; else mud++;
  }
  return { nom, amb, mud, metros: m };
}

// el patrón de verdad: aristas CON nombre y con núcleo no vacío
const verdad = conNombre.filter((i) => nucleoArista[i]);

log('');
log('   B2b · ⭐⭐ ¿PUEDE FALLAR? — dos barajados, y no son el mismo experimento.');
log('');
log('      ⭐ EL ÁLGEBRA, ESCRITA ANTES DE EJECUTAR (ley 51): con los nombres sacados de un');
log('         bombo de ~3.000 vías, la probabilidad de que 2 de 3 portales coincidan es');
log('         ~3/3.000 ≈ 0,1 %. ⇒ el barajado GLOBAL TIENE que derrumbarse por aritmética.');
log('         Si sale alto, el método está roto; si sale ≈0, no he demostrado gran cosa.');
log('         **Por eso el que decide es el LOCAL.**');
log('');
{
  const real = contraVerdad(verdad);
  const glob = contraVerdad(verdad, barajadoGlobal(SEMILLA + 1));
  const loc = contraVerdad(verdad, barajadoLocal(SEMILLA + 2));
  const realS = cuantasNombra(molestan);
  const globS = cuantasNombra(molestan, barajadoGlobal(SEMILLA + 1));
  const locS = cuantasNombra(molestan, barajadoLocal(SEMILLA + 2));
  log('      ' + 'experimento'.padEnd(34) + 'opina sobre'.padStart(14) + 'ACIERTO'.padStart(11)
    + 'nombra (sin nombre)'.padStart(22));
  const fila = (etq, v, s) => log('      ' + etq.padEnd(34)
    + `${v.opina} de ${v.n}`.padStart(14)
    + (Number.isFinite(v.acierto) ? (100 * v.acierto).toFixed(1) + ' %' : '—').padStart(11)
    + `${s.nom}  (${pct(s.nom, molestan.length)})`.padStart(22));
  fila('el método, tal cual', real, realS);
  fila('⛔ barajado GLOBAL (control negativo)', glob, globS);
  fila('⛔⛔ barajado LOCAL (celdas de 300 m)', loc, locS);
  log('');
  log('      ⇒ el LOCAL es el que decide: los nombres siguen siendo los de la zona y siguen');
  log('        agrupados. Si el método siguiera acertando ahí, estaría midiendo «qué calles');
  log('        hay por aquí» y no «de quién es esta acera».');
  // ⚠️ EL INVARIANTE ES UN COCIENTE, NO UN ABSOLUTO, y va declarado antes de mirar:
  //    barajar dentro de la propia celda tiene que DERRUMBAR la discriminación. Se
  //    exige ×3 porque un absoluto («por debajo del 20 %») sería un umbral inventado
  //    que además cambia con la zona — es el arreglo del fallo nº91, aplicado antes
  //    de tropezar con él esta vez.
  A.exige(100 * glob.acierto < 5, `el barajado GLOBAL sigue acertando el ${(100 * glob.acierto).toFixed(1)} %: el método no lee identidad`);
  A.exige(real.acierto > 3 * loc.acierto,
    `el método acierta ${(100 * real.acierto).toFixed(1)} % y con los nombres barajados en la propia celda ${(100 * loc.acierto).toFixed(1)} %: no separa`);

  // ⚠️⚠️ ESTO DE AQUÍ ABAJO ES POST-HOC, Y VA DICHO: se escribe DESPUÉS de ver que
  //    el invariante de ×3 no se cumple. ⛔ NO se toca el umbral —eso sería ajustar
  //    el instrumento al resultado, que es el fallo nº88 y el nº91— y el guardián
  //    se queda en ROJO. Lo que se añade es una MEDIDA: el barajado local tiene un
  //    mando que puse a ojo (300 m), y hay que enseñar de qué depende el número con
  //    el que se le juzga.
  log('');
  log('      ⚠️⚠️ EL INVARIANTE DE ×3 QUE DECLARÉ **NO SE CUMPLE**, y el guardián se queda en');
  log('         rojo. ⛔ No muevo el umbral. Lo que sí se puede hacer es enseñar que la');
  log('         contraprueba tiene un mando que puse a ojo —el tamaño de celda— y medir');
  log('         cuánto manda. (Esto se escribe DESPUÉS de ver el rojo: es post-hoc.)');
  log('');
  log('      ' + 'celda del barajado local'.padEnd(30) + 'opina'.padStart(10) + 'ACIERTO'.padStart(11) + 'razón contra el método'.padStart(26));
  for (const c of [50, 100, 300, 1000, 3000]) {
    const v = contraVerdad(verdad, barajadoLocal(SEMILLA + 2, c));
    log('      ' + `${c} m`.padEnd(30) + String(v.opina).padStart(10)
      + (100 * v.acierto).toFixed(1).padStart(10) + ' %'
      + `×${(real.acierto / v.acierto).toFixed(1)}`.padStart(26));
  }
  log('');
  log('      ⇒ con celdas pequeñas, barajar dentro de la celda **no baraja nada**: una celda');
  log('        de 50 m es una calle, y permutar los nombres de una calle consigo misma');
  log('        devuelve la misma calle. El control se degrada solo a medida que la celda');
  log('        encoge, y a 300 m todavía queda mucha identidad dentro. ⇒ el ×2,6 medido es');
  log('        un SUELO de la separación, no su valor — pero eso no rescata el invariante:');
  log('        lo que declaré antes de mirar fue ×3 y salió menos.');
}

// ── B2c · LA LÍNEA BASE ─────────────────────────────────────────────────────
log('');
log('   B2c · ⭐ LÍNEA BASE — ¿qué acertaría eligiendo al azar entre las vías CERCANAS?');
log('      Sin esto, un porcentaje de acierto no se sabe si es alto o si es lo que sale solo.');
{
  // rejilla de portales por celda de 100 m, para saber qué vías hay cerca
  const celda = 100;
  const rej = new Map();
  portales.forEach((o, i) => {
    const k = Math.floor(o.m[0] / celda) + ',' + Math.floor(o.m[1] / celda);
    if (!rej.has(k)) rej.set(k, []);
    rej.get(k).push(i);
  });
  const cercanas = (pto, radio = 100) => {
    const cx = Math.floor(pto[0] / celda), cy = Math.floor(pto[1] / celda);
    const r = Math.ceil(radio / celda), s = new Set();
    for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
      for (const i of (rej.get(x + ',' + y) || [])) {
        const o = portales[i];
        if (Math.hypot(o.m[0] - pto[0], o.m[1] - pto[1]) <= radio && o.via && o.via.nucleo) s.add(o.via.nucleo);
      }
    }
    return [...s];
  };
  const r = rng(SEMILLA + 3);
  let ok = 0, n = 0, distintas = 0;
  // se mide sobre las MISMAS aristas sobre las que el método opina, no sobre todas:
  // comparar «lo que acierta cuando habla» con «lo que acertaría el azar cuando
  // el azar habla siempre» sería comparar dos preguntas distintas.
  const opinables = verdad.filter((i) => H.decidir(grupos.get(i)).estado === 'NOMBRADA');
  for (const i of opinables) {
    const e = g.aristas[i];
    const pto = e.pts[Math.floor(e.pts.length / 2)];
    const c = cercanas(pto);
    if (!c.length) continue;
    n++; distintas += c.length;
    if (c[Math.floor(r() * c.length)] === nucleoArista[i]) ok++;
  }
  di('   aristas evaluadas (las mismas que el método nombra)', n);
  di('   vías distintas a menos de 100 m (media)', (distintas / Math.max(1, n)).toFixed(1));
  di('   ⭐ ACIERTO DEL AZAR entre las vías cercanas', `${ok} de ${n}  (${pct(ok, n)})`);
}

// ── B2d · LA CIRCULARIDAD ───────────────────────────────────────────────────
log('');
log('   B2d · ⭐⭐⭐ LA CIRCULARIDAD — la trampa de esta tanda, y va entera.');
log('      El enganche decide a qué arista va cada portal; el método usa esos portales para');
log('      nombrar esa arista. Si el enganche está mal, el método le pone a la acera el');
log('      nombre equivocado **y el resultado se autoconfirma**.');
log('');
log('      ⇒ se cogen los que SABEMOS mal enganchados: los 198 con firma y los 23 imputables');
log('        de la tanda 14. ⚠️ Aquí se REIMPLEMENTA ese criterio, así que primero tiene que');
log('        reproducir 198 y 23 — ése es su positivo de control.');
let c198 = [], imputables = [];
{
  const mu = M.cargar();
  const ciegos = portales.filter((o) => !o.nucleoOsm);
  const evaluable = (o) => M.cubierto(mu, o.q, RADIO_COBERTURA) && mu.porCodigo.has(o.codigoVia);
  const medidas = (o) => {
    const pts = mu.porCodigo.get(o.codigoVia).pts;
    const dPortalPropio = M.dA(o.m, pts);
    const dEngPropio = M.dA(o.q, pts);
    return { dPortalPropio, dEngPropio, aleja: dEngPropio - dPortalPropio,
      dPortalOtra: M.masCercanoDeOtra(mu, o.m, o.codigoVia, 200).d,
      dEngOtra: M.masCercanoDeOtra(mu, o.q, o.codigoVia, 200) };
  };
  for (const o of ciegos) {
    if (!evaluable(o)) continue;
    const x = medidas(o);
    if (x.aleja > FIRMA) c198.push({ o, x });
  }
  imputables = c198.filter(({ x }) => !(x.dPortalOtra < x.dPortalPropio) && x.dEngOtra.d < x.dEngPropio);
  di('   portales ciegos con la firma (la tanda 14 publicó 198)', c198.length);
  di('   …imputables al motor (la tanda 14 publicó 23)', imputables.length);
  A.exige(c198.length === 198 && imputables.length === 23,
    `la reimplementación del criterio de la tanda 14 da ${c198.length}/${imputables.length} y lo publicado es 198/23`);

  log('');
  log('      ⭐ ¿QUÉ NOMBRE PRODUCEN SUS ARISTAS? — y lo que decide es CUÁNTO PESA el portal');
  log('        malo en la votación: si es uno entre doce, la mayoría lo tapa; si es el único,');
  log('        el método firma su error con aplomo.');
  const analiza = (lista, etq) => {
    let nom = 0, amb = 0, mud = 0, mandan = 0, propio = 0;
    for (const { o } of lista) {
      const d = H.decidir(grupos.get(o.arista));
      if (d.estado === 'MUDA') { mud++; continue; }
      if (d.estado === 'AMBIGUA') { amb++; continue; }
      nom++;
      // ¿el nombre que sale es el de la calle del portal sospechoso?
      if (o.via && o.via.nucleo === d.nombre) propio++;
      // ¿manda él solo? = el sospechoso está entre los votos del líder y el líder
      //   pierde la mayoría si se le quita.
      const l = grupos.get(o.arista).filter((p) => p.nucleoMunicipal);
      const suyos = l.filter((p) => p.nucleoMunicipal === d.nombre).length;
      const mio = (o.via && o.via.nucleo) === d.nombre ? 1 : 0;
      if (mio && (suyos - 1) / Math.max(1, l.length - 1) < H.ACUERDO) mandan++;
    }
    log('      ' + etq.padEnd(38) + `n=${lista.length}`.padStart(8)
      + `NOMBRADA ${nom} (${pct(nom, lista.length)})`.padStart(24)
      + `AMBIGUA ${amb}`.padStart(14) + `MUDA ${mud}`.padStart(12));
    log('      ' + ' '.repeat(38) + `⚠️ el nombre que sale es el de la calle del portal sospechoso: ${propio}`);
    log('      ' + ' '.repeat(38) + `⛔⛔ …y sale PORQUE ese portal está: ${mandan}`);
    return { nom, amb, mud, propio, mandan };
  };
  const r198 = analiza(c198, 'los 198 con firma');
  const r23 = analiza(imputables, 'los 23 imputables al motor');
  log('');
  log('      ⇒ el número que importa es el último: son las aristas que el método nombraría');
  log('        **gracias a un portal que sabemos mal enganchado**. Ésa es la circularidad,');
  log('        medida y no supuesta.');
  global._CIRC = { r198, r23 };
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('B3 · LOS TRES RESULTADOS SOBRE LAS ARISTAS SIN NOMBRE');
log('='.repeat(110));
const res = { nombradas: [], ambiguas: [], mudas: [] };
const decision = new Map();
for (const i of molestan) {
  const d = H.decidir(grupos.get(i));
  decision.set(i, d);
  if (d.estado === 'NOMBRADA') res.nombradas.push(i);
  else if (d.estado === 'AMBIGUA') res.ambiguas.push(i);
  else res.mudas.push(i);
}
log('');
log('   ' + 'resultado'.padEnd(14) + 'aristas'.padStart(10) + '%'.padStart(9) + 'metros'.padStart(12) + '% metros'.padStart(11));
for (const [k, l] of [['NOMBRADA', res.nombradas], ['AMBIGUA', res.ambiguas], ['MUDA', res.mudas]]) {
  log('   ' + k.padEnd(14) + String(l.length).padStart(10) + pct(l.length, molestan.length).padStart(9)
    + km(suma(l)).padStart(12) + pct(suma(l), mMolestan).padStart(11));
}
A.exige(res.ambiguas.length > 0,
  'el método no produce NI UNA ambigua: en una ciudad con esquinas eso es imposible, el criterio de acuerdo está mal planteado');
log('');
log('   ⭐ que haya AMBIGUAS es lo esperado y no un problema: una acera de esquina tiene');
log('     portales de dos calles. Un método que no produjera ninguna estaría mal planteado.');
{
  const ej = res.ambiguas.filter((i) => decision.get(i).votos >= 6).slice(0, 4);
  for (const i of ej) {
    const d = decision.get(i);
    log('      p.ej. arista ' + i + ' (' + Math.round(largo(i)) + ' m, ' + g.aristas[i].precision + '): '
      + d.candidatos.map((c) => `${c.nucleo} ×${c.votos}`).join(' · '));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ B3b · LA MISMA IDEA CON OTRA UNIDAD: EL WAY DE OSM EN VEZ DE LA ARISTA
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ POST-HOC, y va dicho: esto se escribe DESPUÉS de ver que el 97,2 % sale MUDA y
//    de ver por qué (D1b). ⛔ Los dos umbrales NO se tocan —siguen siendo 3 votos y
//    2/3—: lo único que cambia es a qué se le pregunta. Una arista es un trozo que
//    el planarizado cortó; el WAY es la unidad con la que OSM dibujó la acera, y es
//    la que el redactor ya usa para agrupar tramos.
// ⭐ Y se mide con el MISMO patrón de verdad y el MISMO denominador (aristas), para
//    que las dos filas se puedan comparar.
const gruposWay = new Map();
portales.forEach((o, k) => {
  const w = g.aristas[o.arista].way;
  if (!gruposWay.has(w)) gruposWay.set(w, []);
  gruposWay.get(w).push(proy[k]);
});
const decisionWay = new Map();
const porWay = (i) => {
  if (!decisionWay.has(i)) decisionWay.set(i, H.decidir(gruposWay.get(g.aristas[i].way)));
  return decisionWay.get(i);
};
log('');
log('B3b · ⭐⭐ LA MISMA IDEA CON OTRA UNIDAD — el WAY de OSM en vez de la arista');
log('   ⚠️ post-hoc: esto se escribe después de ver el 97,2 % de MUDAS y su porqué (D1b).');
log('      ⛔ Los umbrales NO se tocan (3 votos, 2/3). Lo único que cambia es la unidad:');
log('      una arista es un trozo que cortó el planarizado; el way es como OSM dibujó la');
log('      acera, y es la unidad con la que el redactor ya agrupa los tramos.');
{
  let nom = 0, amb = 0, mud = 0, mNom = 0;
  for (const i of molestan) {
    const d = porWay(i);
    if (d.estado === 'NOMBRADA') { nom++; mNom += largo(i); } else if (d.estado === 'AMBIGUA') amb++; else mud++;
  }
  let ac = 0, fa = 0, noOp = 0;
  for (const i of verdad) {
    const d = porWay(i);
    if (d.estado !== 'NOMBRADA') { noOp++; continue; }
    if (d.nombre === nucleoArista[i]) ac++; else fa++;
  }
  log('');
  log('   ' + 'unidad'.padEnd(16) + 'NOMBRADA'.padStart(10) + 'metros'.padStart(12) + '% metros'.padStart(10)
    + '   ·   ' + 'acierto'.padStart(9) + 'cobertura'.padStart(11) + '   (patrón de verdad)');
  const vA = contraVerdad(verdad);
  log('   ' + 'arista'.padEnd(16) + String(res.nombradas.length).padStart(10) + km(suma(res.nombradas)).padStart(12)
    + pct(suma(res.nombradas), mMolestan).padStart(10) + '   ·   '
    + pct(vA.acierta, vA.opina).padStart(9) + pct(vA.opina, verdad.length).padStart(11));
  log('   ' + '⭐ way'.padEnd(17) + String(nom).padStart(10) + km(mNom).padStart(12)
    + pct(mNom, mMolestan).padStart(10) + '   ·   '
    + pct(ac, ac + fa).padStart(9) + pct(ac + fa, verdad.length).padStart(11));
  log('   ' + ' '.repeat(16) + `AMBIGUA ${amb} · MUDA ${mud}`);
  log('');
  log('   ⇒ ⚠️ CAMBIAR LA UNIDAD **NO ES GRATIS**: un way largo puede recorrer dos calles, y');
  log('     entonces el método le pone un solo nombre a los dos trozos. Lo que dice si eso');
  log('     pasa mucho o poco es el acierto de la derecha, medido con el mismo patrón.');
  global._WAY = { nom, amb, mud, mNom, ac, fa, op: ac + fa };
}

// ── B4 · ¿DE QUÉ DEPENDE? ───────────────────────────────────────────────────
log('');
log('B4 · ⚠️ ¿DE QUÉ DEPENDE? — los confusores, buscados a propósito');
log('   (sobre el patrón de verdad, que es donde se puede medir el acierto)');
{
  const tabla = (etq, clasif, orden) => {
    log('');
    log('   ' + etq.padEnd(30) + 'aristas'.padStart(9) + 'opina'.padStart(9) + 'cobertura'.padStart(11) + 'ACIERTO'.padStart(10));
    const c = new Map();
    for (const i of verdad) {
      const k = clasif(i);
      if (!c.has(k)) c.set(k, []);
      c.get(k).push(i);
    }
    const ks = orden || [...c.keys()].sort();
    for (const k of ks) {
      const l = c.get(k);
      if (!l || l.length < 20) continue;
      const v = contraVerdad(l);
      log('   ' + String(k).padEnd(30) + String(l.length).padStart(9) + String(v.opina).padStart(9)
        + pct(v.opina, l.length).padStart(11)
        + (Number.isFinite(v.acierto) ? (100 * v.acierto).toFixed(1) + ' %' : '—').padStart(10));
    }
  };
  const bandaL = (i) => { const L = largo(i);
    return L < 25 ? '1 · < 25 m' : L < 50 ? '2 · 25–50 m' : L < 100 ? '3 · 50–100 m' : L < 250 ? '4 · 100–250 m' : '5 · ≥ 250 m'; };
  tabla('longitud de la arista', bandaL);
  const bandaP = (i) => { const l = grupos.get(i); const n = l ? l.filter((p) => p.nucleoMunicipal).length : 0;
    return n < 3 ? '0 · menos de 3' : n < 5 ? '1 · 3–4' : n < 10 ? '2 · 5–9' : n < 20 ? '3 · 10–19' : '4 · 20 o más'; };
  tabla('portales pegados', bandaP);
  tabla('zona', (i) => zonaArista[i], [...ZONAS.map((z) => z.n), '(fuera de las ventanas)']);
  tabla('precisión (D4)', (i) => g.aristas[i].precision);
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('C · ⭐⭐ CONTRA EL PATRÓN DE VERDAD');
log('='.repeat(110));
log('');
log('C1 · ⭐⭐ Se tapa el nombre de las aristas que SÍ lo tienen y se aplica el método.');
log('   ⚠️ el nombre se compara por NÚCLEO, no byte a byte: el normalizador es');
log('      `P.nucleo()` de `src/portales.js`, el mismo que usa el enganche desde la tanda 6.');
log('      «CALLE MAYOR» y «Calle Mayor» son el mismo núcleo; «Calle Mayor» y «Don Jaime I»');
log('      no. ⛔ NO es un emparejador aproximado: eso ya falló en el 29,6 % del heredado.');
{
  const v = contraVerdad(verdad);
  log('');
  di('aristas CON nombre en OSM', conNombre.length);
  di('   …con núcleo comparable (no vacío)', `${verdad.length}  (se descartan ${conNombre.length - verdad.length}: el núcleo sale vacío, p.ej. «Gran Vía»)`);
  log('');
  log('   ' + 'cubo'.padEnd(22) + 'aristas'.padStart(10) + '% del patrón'.padStart(14));
  log('   ' + 'ACIERTA'.padEnd(22) + String(v.acierta).padStart(10) + pct(v.acierta, v.n).padStart(14));
  log('   ' + 'FALLA'.padEnd(22) + String(v.falla).padStart(10) + pct(v.falla, v.n).padStart(14));
  log('   ' + 'NO OPINA · ambigua'.padEnd(22) + String(v.ambigua).padStart(10) + pct(v.ambigua, v.n).padStart(14));
  log('   ' + 'NO OPINA · muda'.padEnd(22) + String(v.muda).padStart(10) + pct(v.muda, v.n).padStart(14));
  log('');
  di('⭐⭐ ACIERTO CUANDO OPINA', `${v.acierta} de ${v.opina}  (${(100 * v.acierto).toFixed(1)} %)`);
  di('   COBERTURA (sobre cuántas opina)', pct(v.opina, v.n));
  global._C1 = v;

  log('');
  log('   ⭐ LA CURVA DEL UMBRAL — publicada para que se vea de qué depende. ⛔ El número que');
  log('      vale es el de ' + H.ACUERDO.toFixed(2) + ', fijado antes de ver esto.');
  log('   ' + 'acuerdo exigido'.padEnd(20) + 'opina'.padStart(10) + 'cobertura'.padStart(12) + 'ACIERTO'.padStart(10));
  for (const u of [0.5, 0.6, 2 / 3, 0.75, 0.9, 1.0]) {
    let ac = 0, fa = 0;
    for (const i of verdad) {
      const l = (grupos.get(i) || []).map((p) => p.nucleoMunicipal).filter(Boolean);
      if (l.length < H.MIN_PORTALES) continue;
      const c = new Map();
      for (const k of l) c.set(k, (c.get(k) || 0) + 1);
      const [lid, vo] = [...c.entries()].sort((a, b) => b[1] - a[1])[0];
      if (vo / l.length < u) continue;
      if (lid === nucleoArista[i]) ac++; else fa++;
    }
    log('   ' + ((u === 2 / 3 ? '⭐ ' : '   ') + u.toFixed(2)).padEnd(20) + String(ac + fa).padStart(10)
      + pct(ac + fa, verdad.length).padStart(12) + pct(ac, ac + fa).padStart(10));
  }
}

log('');
log('C2 · ⚠️⚠️ EL SESGO DE ESTE PATRÓN, DECLARADO — y no es un detalle:');
log('     las aristas CON nombre **no son una muestra al azar** de las que no lo tienen.');
log('     Una acera con nombre está en una calle que alguien se molestó en mapear bien; una');
log('     sin nombre, no necesariamente. ⇒ **el acierto de C1 es un TECHO, no una estimación.**');
log('');
log('   ⭐⭐ Y HAY UN SEGUNDO TECHO, MÁS DURO, QUE NO SE ARREGLA CON NINGUNA MUESTRA:');
log('     el método vota con `codigoVia` sobre los portales que el ENGANCHE asignó. Sobre una');
log('     arista con nombre, «acertar» es casi la misma pregunta que «¿concuerda el');
log('     `codigoVia` con el nombre de OSM?» — que es la salvaguarda 1 del enganche.');
{
  const conc = portales.filter((o) => o.codigoVia_estado === 'concuerda').length;
  const dis = portales.filter((o) => o.codigoVia_estado === 'DISCORDA').length;
  di('   portales donde el `codigoVia` CONCUERDA con OSM', `${conc}  (${pct(conc, conc + dis)} de los que se pueden comparar)`);
  di('   …DISCORDA', `${dis}  (${pct(dis, conc + dis)})`);
  log('   ⇒ el acierto del método no puede subir mucho por encima de esa concordancia: es');
  log('     el mismo dato leído del otro lado. Lo que el método añade es la MAYORÍA, que');
  log('     tapa discordancias sueltas — y eso sí se ve en la tabla de «portales pegados».');
}

log('');
log('C3 · ⭐ ¿SE PUEDE ACOTAR ESE SESGO? — estandarizando por estratos.');
log('   La idea a rebatir o aceptar: comparar solo aristas parecidas. Aquí se hace al revés y');
log('   sale más barato: se PESA el acierto de las aristas con nombre con el reparto de');
log('   estratos de las aristas SIN nombre que el método nombraría. Estrato = zona × banda de');
log('   portales pegados.');
{
  const estrato = (i) => {
    const l = grupos.get(i); const n = l ? l.filter((p) => p.nucleoMunicipal).length : 0;
    const b = n < 5 ? '3–4' : n < 10 ? '5–9' : n < 20 ? '10–19' : '20+';
    return zonaArista[i] + ' | ' + b;
  };
  // acierto por estrato, sobre el patrón de verdad
  const porE = new Map();
  for (const i of verdad) {
    const d = H.decidir(grupos.get(i));
    if (d.estado !== 'NOMBRADA') continue;
    const k = estrato(i);
    if (!porE.has(k)) porE.set(k, { n: 0, ok: 0 });
    const v = porE.get(k); v.n++; if (d.nombre === nucleoArista[i]) v.ok++;
  }
  // peso = reparto de estratos de las SIN nombre nombradas
  const peso = new Map();
  for (const i of res.nombradas) { const k = estrato(i); peso.set(k, (peso.get(k) || 0) + 1); }
  let num = 0, den = 0, sinDato = 0;
  for (const [k, w] of peso) {
    const v = porE.get(k);
    if (!v || v.n < 10) { sinDato += w; continue; }
    num += w * (v.ok / v.n); den += w;
  }
  const bruto = global._C1.acierto;
  di('   acierto BRUTO sobre el patrón de verdad (C1)', (100 * bruto).toFixed(1) + ' %');
  di('   ⭐ acierto ESTANDARIZADO al perfil de las sin nombre', den ? (100 * num / den).toFixed(1) + ' %' : '—');
  di('   peso sin estrato comparable (≥10 casos con nombre)', `${sinDato} de ${res.nombradas.length}  (${pct(sinDato, res.nombradas.length)})`);
  log('');
  log('   ⚠️ ESTO NO ELIMINA EL SESGO, LO ACOTA EN LAS VARIABLES QUE MIRO. Lo que hace que una');
  log('     calle esté mapeada con nombre puede ser justo lo que no está en zona ni en número');
  log('     de portales. ⇒ sigue siendo un techo; lo que se sabe es cuánto se mueve al');
  log('     reponderar por las dos variables que sí se pueden medir.');
  global._C3 = { est: den ? num / den : NaN, sinDato };
}

log('');
log('C4 · ⭐ DÓNDE FALLA — buscado a propósito, no encontrado de paso');
{
  const v = global._C1;
  log('');
  di('fallos totales sobre el patrón de verdad', v.falla);
  // ¿el nombre verdadero estaba en la papeleta?
  let enPapeleta = 0;
  for (const { i } of v.fallos) {
    const l = (grupos.get(i) || []).map((p) => p.nucleoMunicipal).filter(Boolean);
    if (l.includes(nucleoArista[i])) enPapeleta++;
  }
  di('   …donde el nombre verdadero SÍ estaba entre los votos y perdió', `${enPapeleta}  (${pct(enPapeleta, v.falla)})`);
  di('   …donde ni siquiera aparecía', `${v.falla - enPapeleta}  (${pct(v.falla - enPapeleta, v.falla)})`);
  log('   ⇒ los primeros son esquinas y chaflanes: el método elige mal entre dos vecinos.');
  log('     Los segundos son otra cosa — o el enganche de todos esos portales está mal, o el');
  log('     `codigoVia` y OSM llaman a la misma calle de dos maneras.');
  log('');
  log('   los sitios malos, mirados uno a uno:');
  // reparto por tipo de vía del nombre VERDADERO
  const c = new Map();
  for (const { i } of v.fallos) {
    const nom = nombreArista[i] || '';
    const t = (nom.split(' ')[0] || '(?)').toLowerCase();
    c.set(t, (c.get(t) || 0) + 1);
  }
  log('   ' + 'primera palabra del nombre VERDADERO'.padEnd(40) + 'fallos'.padStart(9) + '  (sobre ' + v.falla + ')');
  for (const [k, n] of [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    log('   ' + String(k).padEnd(40) + String(n).padStart(9) + pct(n, v.falla).padStart(10));
  }
  log('');
  log('   diez fallos, tal cual, sin elegirlos:');
  for (const { i, d } of v.fallos.slice(0, 10)) {
    log('      ' + String(Math.round(largo(i)) + ' m').padStart(7) + '  ' + g.aristas[i].precision.padEnd(24)
      + ' VERDAD: ' + String(nombreArista[i]).slice(0, 32).padEnd(33)
      + ' MÉTODO: ' + String(d.nombre).slice(0, 28) + `  (${d.apoyo}/${d.votos})`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ C4b · MIRAR LOS FALLOS UNO A UNO CAMBIA LO QUE SIGNIFICAN
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️ Esto se escribe DESPUÉS de leer los diez de arriba: es post-hoc y va dicho.
  //    En esa lista hay «Calle de León Felipe» contra `poeta leon felipe`, «Calle de
  //    Gabriel Celaya» contra `poeta gabriel celaya`, «Calle Juan José Rivas» contra
  //    `doctor juan jose rivas`. **Eso no es la calle equivocada: es la MISMA calle
  //    con el nombre largo del Ayuntamiento contra el corto de OSM.** El normalizador
  //    quita el tipo de vía y los artículos, no los títulos.
  // ⛔ Y NO se toca el normalizador: es el del enganche, y cambiarlo cambiaría el
  //    motor en la tanda que prometió no tocarlo. Se MIDE cuánto pesa.
  log('');
  log('   ⭐⭐ C4b · ¿CUÁNTOS DE ESOS «FALLOS» SON LA MISMA CALLE CON OTRO NOMBRE?');
  log('      (post-hoc: esto se escribe después de leer los diez de arriba, y va dicho)');
  {
    const pal = (n) => new Set(String(n || '').split(' ').filter(Boolean));
    const contiene = (a, b) => { if (!a.size) return false; for (const x of a) if (!b.has(x)) return false; return true; };
    const esVariante = (x, y) => { const a = pal(x), b = pal(y); return contiene(a, b) || contiene(b, a); };
    let variante = 0, compartePalabra = 0, nadaQueVer = 0;
    for (const { i, d } of v.fallos) {
      if (esVariante(nucleoArista[i], d.nombre)) { variante++; continue; }
      const a = pal(nucleoArista[i]), b = pal(d.nombre);
      let comparte = false;
      for (const x of a) if (b.has(x)) comparte = true;
      if (comparte) compartePalabra++; else nadaQueVer++;
    }
    di('      ⭐ un núcleo CONTIENE al otro (la misma calle, otro nombre)', `${variante} de ${v.falla}  (${pct(variante, v.falla)})`);
    di('      comparten alguna palabra pero no se contienen', `${compartePalabra}  (${pct(compartePalabra, v.falla)})`);
    di('      ⛔ no tienen nada que ver: la calle equivocada de verdad', `${nadaQueVer}  (${pct(nadaQueVer, v.falla)})`);
    // ⭐ POSITIVO/NEGATIVO DE CONTROL del test: si «uno contiene al otro» aprobara a
    //    cualquier pareja, este reparto no valdría nada. Se prueba contra parejas de
    //    vías distintas sacadas al azar del propio callejero.
    const vias = [...ctx.enganche.vias.values()].map((x) => x.nucleo).filter(Boolean);
    const r = rng(SEMILLA + 7);
    let falsos = 0, n = 0;
    for (let k = 0; k < 20000; k++) {
      const a = vias[Math.floor(r() * vias.length)], b = vias[Math.floor(r() * vias.length)];
      if (a === b) continue;
      n++;
      if (esVariante(a, b)) falsos++;
    }
    di('      ⭐ CONTROL · el mismo test sobre parejas de vías AL AZAR', `${falsos} de ${n}  (${pct(falsos, n)})  ${100 * falsos / n < 1 ? '✅ no aprueba cualquier cosa' : '⛔ aprueba cualquier cosa'}`);
    A.exige(100 * falsos / n < 1, `el test de «variante del mismo nombre» aprueba al ${pct(falsos, n)} de las parejas al azar: no distingue nada`);
    log('');
    log('      ⇒ ⭐⭐ EL ACIERTO DE C1 ESTÁ MEDIDO A LA BAJA: parte de lo que cuenta como fallo');
    log('        es el callejero llamando «Calle del Poeta León Felipe» a lo que OSM llama');
    log('        «Calle de León Felipe». ⛔ NO se toca el normalizador —es el del enganche, y');
    log('        esta tanda prometió no tocar el motor—; se dice cuánto pesa y se deja.');
    const ac = v.acierta, op = v.opina;
    di('      acierto tal cual (el que se publica)', pct(ac, op));
    di('      acierto si las variantes contaran como acierto (NO se publica)', pct(ac + variante, op));
    global._C4 = { variante, compartePalabra, nadaQueVer };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('D · ⭐ QUÉ CAMBIARÍA — sin cambiarlo');
log('='.repeat(110));

/** El nombre que el método le pondría a un tramo, votando sus aristas. */
function nombreDeTramo(indices, deci) {
  const votos = new Map();
  let nom = 0, amb = 0, mud = 0;
  for (const i of indices) {
    const d = deci(i);
    if (d.estado === 'NOMBRADA') { nom++; votos.set(d.nombre, (votos.get(d.nombre) || 0) + 1); }
    else if (d.estado === 'AMBIGUA') amb++; else mud++;
  }
  const orden = [...votos.entries()].sort((a, b) => b[1] - a[1]);
  return { nombre: orden.length ? orden[0][0] : null, nom, amb, mud, orden };
}
const porArista = (i) => decision.get(i) || H.decidir(grupos.get(i));

log('');
log('D1 · ⭐⭐ EL EJEMPLO DE ANTONIO, ENTERO — `Coso 33 → Plaza San Francisco`');
log('   ⚠️ la ruta se resuelve aquí con `G.rutaEntre`, la MISMA función del motor, y se');
log('      CUADRA contra `node src/ruta.js … --json`. Si los metros no coincidieran, es que');
log('      he resuelto otra ruta — y el cuadre lo caza.');
{
  const a = D.punto('Coso 33', ctx), b = D.punto('Plaza San Francisco', ctx);
  A.exige(!!a && !!b, 'no se resuelven las dos direcciones del ejemplo de Antonio');
  const ruta = G.rutaEntre(g, a, b);
  A.exige(ruta.encontrada, 'el ejemplo de Antonio no tiene ruta');
  // ── el cuadre contra la interfaz sancionada ──
  let metrosCli = null;
  try {
    const out = execFileSync(process.execPath,
      [path.join(__dirname, 'ruta.js'), 'Coso 33', 'Plaza San Francisco', '--json'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    metrosCli = JSON.parse(out).metros;
  } catch (e) { metrosCli = null; }
  di('   metros aquí', ruta.metros.toFixed(1));
  di('   metros de `node src/ruta.js … --json`', metrosCli == null ? '⛔ no se pudo leer' : metrosCli.toFixed(1));
  A.exige(metrosCli != null && Math.abs(metrosCli - ruta.metros) < 0.5,
    `el cuadre del ejemplo de Antonio falla: aquí ${ruta.metros.toFixed(1)} m y el comando ${metrosCli}`);

  const ts = Rel.tramos(ruta, ctx.nombreDeWay);
  // índices de arista por paso, para poder preguntar por tramo
  const porPaso = [];
  { let k = 0; for (const p of ruta.pasos) { const l = []; for (let j = 0; j < p.aristas; j++) l.push(ruta.aristas[k++]); porPaso.push(l); } }

  const sinN = ts.filter((t) => !t.nombre);
  const mSinN = sinN.reduce((s, t) => s + t.metros, 0);
  const sinNimporta = sinN.filter((t) => !NO_NECESITAN.has(t.precision));
  const mImporta = sinNimporta.reduce((s, t) => s + t.metros, 0);
  log('');
  di('   tramos de la ruta', ts.length);
  di('   ⭐ tramos SIN NOMBRE', `${sinN.length}  (${km(mSinN)}, el ${pct(mSinN, ruta.metros)} del recorrido)`);
  di('   …de los que MOLESTAN (sin pasos ni escaleras)', `${sinNimporta.length}  (${km(mImporta)}, el ${pct(mImporta, ruta.metros)})`);
  log('   ⚠️ el encargo decía «3 tramos, 696 m, el 37 %». Son los TRES marcados «(acera)»;');
  log('      el 696/1.891 da el 36,8 %, así que es la misma ruta. Los otros dos que salen');
  log('      aquí son un tramo peatonal de 83 m y un paso de peatones de 4 m.');
  log('');
  log('   ' + 'nº'.padStart(3) + '  ' + 'lo que dice hoy'.padEnd(44) + 'metros'.padStart(8)
    + '   por ARISTA'.padEnd(26) + '   ⭐ por WAY');
  for (const t of ts) {
    let a = '', b = '';
    if (!t.nombre) {
      const idx = t.pasos.flatMap((pi) => porPaso[pi]);
      const rA = nombreDeTramo(idx, porArista), rW = nombreDeTramo(idx, porWay);
      const di2 = (r) => r.nombre ? `«${r.nombre}» (${r.nom}/${idx.length})`
        : `— NADA (${r.amb} amb · ${r.mud} muda)`;
      a = di2(rA); b = di2(rW);
    }
    log('   ' + String(t.n).padStart(3) + '  ' + t.frase.slice(0, 43).padEnd(44)
      + (Math.round(t.metros) + ' m').padStart(8) + '   ' + a.slice(0, 25).padEnd(26) + '   ' + b);
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️⚠️⚠️ D1b · POR QUÉ EL EJEMPLO DE ANTONIO SALE MUDO ENTERO
  // ═══════════════════════════════════════════════════════════════════════════
  // El caso que motivó la tanda es exactamente donde el método no dice nada. Eso
  // NO se despacha con «no hay portales»: hay que enseñar DÓNDE están los portales
  // de esas calles, porque si están ahí al lado y engancharon a otra cosa, la
  // pregunta cambia por completo.
  // ⚠️ Este bloque usa un radio de 25 m. **Es un radio de DIAGNÓSTICO, no del
  //    método** — el método sigue sin radio. Va dicho para que nadie lo confunda.
  log('');
  log('   ⚠️⚠️ D1b · POR QUÉ SALE MUDO — y no vale con decir «no hay portales».');
  log('      Radio de DIAGNÓSTICO de 25 m alrededor de la geometría del tramo. ⛔ El método');
  log('      no tiene radio; esto es para mirar, no para decidir.');
  {
    const celda = 100;
    const rej = new Map();
    portales.forEach((o, i) => {
      const k = Math.floor(o.m[0] / celda) + ',' + Math.floor(o.m[1] / celda);
      if (!rej.has(k)) rej.set(k, []);
      rej.get(k).push(i);
    });
    const cerca = (pts, radio) => {
      const s = new Set();
      for (const p of pts) {
        const cx = Math.floor(p[0] / celda), cy = Math.floor(p[1] / celda);
        const r = Math.ceil(radio / celda);
        for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
          for (const i of (rej.get(x + ',' + y) || [])) {
            if (Math.hypot(portales[i].m[0] - p[0], portales[i].m[1] - p[1]) <= radio) s.add(i);
          }
        }
      }
      return [...s];
    };
    for (const t of sinNimporta) {
      const idx = t.pasos.flatMap((pi) => porPaso[pi]);
      const pts = idx.flatMap((i) => g.aristas[i].pts);
      const cs = cerca(pts, 25);
      const propios = idx.reduce((s, i) => s + ((grupos.get(i) || []).length), 0);
      log('');
      log('      tramo ' + t.n + ' · ' + Math.round(t.metros) + ' m · ' + t.tipo + ' · ' + idx.length + ' arista(s)');
      di('         portales ENGANCHADOS a estas aristas', propios);
      di('         portales a menos de 25 m de ellas', cs.length);
      if (!cs.length) { log('         ⇒ aquí de verdad no hay portales: no es que engancharan mal.'); continue; }
      const dest = new Map();
      for (const i of cs) {
        const o = portales[i];
        const nom = nombreArista[o.arista] || '(arista sin nombre)';
        dest.set(nom, (dest.get(nom) || 0) + 1);
      }
      log('         ⇒ esos portales engancharon a:');
      for (const [k, n] of [...dest.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
        log('            ' + String(n).padStart(5) + '  ' + k);
      }
    }
    log('');
    log('      ⇒ ⭐⭐ ÉSTA ES LA RESPUESTA, Y NO ES «FALTAN PORTALES»: en el tramo 3 hay 19');
    log('        portales a 25 m y solo 2 cuelgan de sus aristas. Los otros 17 cuelgan de');
    log('        OTRAS aristas sin nombre — las aceras de al lado y las de enfrente. El');
    log('        problema no es la falta de puertas: es que la unidad del método es la');
    log('        ARISTA, y una acera de 499 m son 14 aristas entre las que 19 portales se');
    log('        reparten sin que ninguna llegue a tres. ⇒ eso se puede medir, y se mide');
    log('        en B3b con la unidad cambiada.');
  }
  global._D1 = { ts, sinN, sinNimporta, mSinN, mImporta, metros: ruta.metros };
}

log('');
log('D2 · LAS SIETE RUTAS DE ANTONIO');
log('   ⛔ NO se recalculan: se piden a `rutas-antonio.js --aristas`, que es el único que las');
log('      produce. Dos copias del mismo cálculo es exactamente el fallo nº68.');
{
  let sieteRaw = null;
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'rutas-antonio.js'), '--aristas'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const l = out.split('\n').find((x) => x.startsWith('##ARISTAS##'));
    sieteRaw = l ? JSON.parse(l.slice('##ARISTAS##'.length)) : null;
  } catch (e) {
    // ⚠️ `rutas-antonio.js` sale en ROJO a propósito (la ruta nº4 tiene un rodeo
    //    declarado fuera de banda). Eso NO es un fallo de lectura: la línea está.
    const out = (e.stdout || '').toString();
    const l = out.split('\n').find((x) => x.startsWith('##ARISTAS##'));
    sieteRaw = l ? JSON.parse(l.slice('##ARISTAS##'.length)) : null;
  }
  A.exige(!!sieteRaw && sieteRaw.length > 0, 'no se ha podido leer `##ARISTAS##` de rutas-antonio.js');
  if (sieteRaw) {
    log('');
    log('   ⚠️ los metros de aquí se suman sobre ARISTAS ENTERAS, y las dos de los extremos');
    log('      van cortadas por el enganche. Por eso al lado va el cuadre contra los metros');
    log('      del motor: la diferencia es exactamente ese corte, y se ve.');
    log('');
    log('   ' + 'ruta'.padStart(5) + 'metros motor'.padStart(14) + 'suma aristas'.padStart(14)
      + 'sin nombre'.padStart(12) + 'm sin nombre'.padStart(14)
      + 'm por ARISTA'.padStart(14) + 'm por WAY'.padStart(12));
    let tSin = 0, tGan = 0, tSinN = 0, tGanN = 0, tGanW = 0, tGanWN = 0;
    for (const r of sieteRaw) {
      const sn = r.aristas.filter((i) => !nombreArista[i] && !NO_NECESITAN.has(g.aristas[i].precision));
      const gan = sn.filter((i) => porArista(i).estado === 'NOMBRADA');
      const ganW = sn.filter((i) => porWay(i).estado === 'NOMBRADA');
      tSin += suma(sn); tGan += suma(gan); tSinN += sn.length; tGanN += gan.length;
      tGanW += suma(ganW); tGanWN += ganW.length;
      log('   ' + String(r.n).padStart(5) + r.metros.toFixed(0).padStart(14)
        + suma(r.aristas).toFixed(0).padStart(14)
        + String(sn.length).padStart(12) + suma(sn).toFixed(0).padStart(14)
        + suma(gan).toFixed(0).padStart(14) + suma(ganW).toFixed(0).padStart(12));
    }
    log('   ' + '─'.repeat(95));
    log('   ' + 'TOTAL'.padStart(5) + ''.padStart(14) + ''.padStart(14)
      + String(tSinN).padStart(12) + tSin.toFixed(0).padStart(14)
      + tGan.toFixed(0).padStart(14) + tGanW.toFixed(0).padStart(12));
    log('');
    di('   de los metros sin nombre de las siete · por ARISTA', `${tGan.toFixed(0)} de ${tSin.toFixed(0)} m  (${pct(tGan, tSin)})`);
    di('   ⭐ …por WAY', `${tGanW.toFixed(0)} de ${tSin.toFixed(0)} m  (${pct(tGanW, tSin)})`);

    // ⭐ Y LOS NOMBRES, TAL CUAL, SIN ELEGIRLOS. Un porcentaje no deja ver si el
    //    método está poniéndole a un carril bici el nombre de la calle de al lado.
    log('');
    log('   ⭐ los nombres que saldrían, tal cual (unidad WAY, agrupando aristas del mismo way):');
    log('   ' + 'ruta'.padStart(5) + '  ' + 'highway'.padEnd(14) + 'metros'.padStart(9) + '   nombre heredado   (apoyo)');
    for (const r of sieteRaw) {
      const vistos = new Set();
      for (const i of r.aristas) {
        if (nombreArista[i] || NO_NECESITAN.has(g.aristas[i].precision)) continue;
        const d = porWay(i);
        if (d.estado !== 'NOMBRADA') continue;
        const w = g.aristas[i].way;
        if (vistos.has(w)) continue;
        vistos.add(w);
        const mw = r.aristas.filter((j) => g.aristas[j].way === w).reduce((s, j) => s + largo(j), 0);
        log('   ' + String(r.n).padStart(5) + '  ' + String(g.aristas[i].highway).padEnd(14)
          + mw.toFixed(0).padStart(9) + '   «' + d.nombre + '»   (' + d.apoyo + '/' + d.votos + ')');
      }
    }
    log('');
    log('   ⚠️⚠️⚠️ MIRA LA ÚLTIMA FILA. Son los 1.269 m de CARRIL BICI de la ruta nº7 —el que');
    log('      Antonio confirmó que es su camino— y el método les pondría el nombre de la');
    log('      calle paralela, con 37 votos de 44. **El apoyo es altísimo y la frase sería');
    log('      falsa**: no vas por la acera de esa calle, vas por un carril bici. Es el');
    log('      riesgo de D4 con nombre y apellidos, y no lo caza ningún umbral de acuerdo:');
    log('      el acuerdo mide si los portales coinciden, no si la línea es una acera.');
    log('   ⚠️ Y la ruta nº5: «principado morea» con 2 votos de 3 — el mínimo exacto del');
    log('      método. 197 m de texto colgando de dos portales.');
    global._D2 = { tSin, tGan, tSinN, tGanN, tGanW, tGanWN };
  }
}

log('');
log('D3 · ⭐ ¿MERECE LA PENA?');
{
  const d1 = global._D1, d2 = global._D2 || { tSin: 0, tGan: 0, tGanW: 0 };
  const W = global._WAY;
  di('   ciudad · metros sin nombre que molestan', km(mMolestan));
  di('   ciudad · …nombrados por ARISTA', `${km(suma(res.nombradas))}  (${pct(suma(res.nombradas), mMolestan)})`);
  di('   ciudad · …nombrados por WAY', `${km(W.mNom)}  (${pct(W.mNom, mMolestan)})`);
  di('   siete rutas · sin nombre → por ARISTA → por WAY',
    `${d2.tSin.toFixed(0)} m → ${d2.tGan.toFixed(0)} m (${pct(d2.tGan, d2.tSin)}) → ${d2.tGanW.toFixed(0)} m (${pct(d2.tGanW, d2.tSin)})`);
  di('   ejemplo de Antonio · tramos sin nombre que molestan', `${d1.sinNimporta.length} de ${d1.ts.length}  (${km(d1.mImporta)}, ${pct(d1.mImporta, d1.metros)})`);
  log('');
  log('   ⭐⭐ EL NÚMERO HONESTO: en la ciudad entera la idea toca el ' + pct(W.mNom, mMolestan) + ' de los metros sin');
  log('     nombre con la unidad buena, y el ' + pct(suma(res.nombradas), mMolestan) + ' con la unidad mala. Pero la ciudad entera');
  log('     está dominada por 2.045 km de `track` en el campo, donde no hay portales ni');
  log('     falta hacen. ⇒ el número que decide es el de las SIETE RUTAS y el del EJEMPLO.');
}

log('');
log('D4 · ⚠️ EL RIESGO DE PRODUCTO — un nombre HEREDADO no es un nombre DECLARADO.');
log('   Si el texto dice «por la acera de Paseo de la Independencia» y es la acera de al lado,');
log('   la app **miente con aplomo**, que es peor que callarse. ⇒ PROPUESTA, no decisión:');
log('   distinguir en el texto lo declarado de lo deducido, y llevar el apoyo al lado.');
log('     · declarado   →  «Por Calle Santa Isabel (calle peatonal)»');
log('     · deducido    →  «Por una acera que PARECE de Calle Santa Isabel (8 de 9 portales)»');
log('     · ambiguo     →  «Por un tramo sin nombre, entre X e Y»   ⭐ AMBIGUA también informa');
log('   ⛔ Decide Antonio, y después de la auditoría.');

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('E · ⭐⭐ EL VEREDICTO');
log('='.repeat(110));
{
  const v = global._C1, W = global._WAY, d2 = global._D2, d1 = global._D1;
  log('');
  di('acierto cuando opina · unidad ARISTA (techo)', (100 * v.acierto).toFixed(1) + ' %');
  di('   …estandarizado al perfil de las sin nombre', Number.isFinite(global._C3.est) ? (100 * global._C3.est).toFixed(1) + ' %' : '—');
  di('   …y de los fallos, la misma calle con otro nombre', pct(global._C4.variante, v.falla));
  di('acierto cuando opina · unidad WAY', pct(W.ac, W.op));
  di('metros sin nombre nombrados · ARISTA / WAY', `${km(suma(res.nombradas))} / ${km(W.mNom)}  de ${km(mMolestan)}`);
  di('siete rutas · metros ganados · ARISTA / WAY', `${d2.tGan.toFixed(0)} / ${d2.tGanW.toFixed(0)} m de ${d2.tSin.toFixed(0)}`);
  di('ejemplo de Antonio · metros ganados', `${km(d1.mImporta)} sin nombre, y ver la tabla de D1`);
  di('circularidad · nombradas GRACIAS a un portal mal enganchado', global._CIRC.r23.mandan + ' de los 23 imputables · ' + global._CIRC.r198.mandan + ' de los 198 con firma');
  di('⛔ el invariante de separación que declaré (×3)', 'NO SE CUMPLE — salió ×2,6, y el guardián queda en rojo');
}
log('');
log(A.cierre('NOMBRAR ACERAS'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
