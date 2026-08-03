// D + E · EL INFORME DEL ENGANCHE Y SU VERIFICACIÓN.
//
//   node src/informe-portales.js
//
// ⚠️⚠️ La verificación NO es el remate de esta tanda: es la mitad. El enganche es
//    el primer paso del proyecto que puede fallar SIN ROMPER NADA.

'use strict';
const osm = require('./osm');
const P = require('./portales');
const E = require('./enganche');
const G = require('./grafo');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');
const { aGrados, aMetros } = require('./geo');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(48)} ${v}`);
const linea = (t) => { log(''); log('='.repeat(98)); log(t); };
function rng(s0) { let s = s0 >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const T0 = Date.now();
const g = construir(ZONA_TERMINO);
const { ways } = osm.cargar(CRUDO);
const TAGS = new Map();
for (const w of ways) TAGS.set(w.id, w.tags || {});
const r = E.enganchar(g, TAGS);
const port = r.portales;
const eng = port.filter((o) => o.enganchado);

log('='.repeat(98));
log('D · EL ENGANCHE DE LOS 46.150 PORTALES');
di('sello del grafo', g.sello);
di('aristas del grafo · transitables a pie', `${g.aristas.length} · ${g.aristas.filter((e) => e.pie).length}`);
di('tiempo total hasta aquí', ((Date.now() - T0) / 1000).toFixed(1) + ' s');

// ── D2 · la decisión P4.5 ────────────────────────────────────────────────────
linea('D2 · ⭐ P4.5 RESUELTA — se GUARDA LA POSICIÓN, no se parte la arista');
log('   partir: 46.150 nodos y ~46.150 aristas nuevas sobre 98.774. ⛔ Y mete el error');
log('           DENTRO del terreno: un portal mal enganchado parte una calle donde no es.');
log('   guardar: el portal es {arista, t, distancia}. El grafo no cambia, todo lo');
log('           verificado en las tandas 8 y 10 sigue valiendo, y es reversible.');
di('coste de guardar', '2 nodos temporales por consulta, no 46.150 permanentes');
di('⇒ elegido', 'GUARDAR LA POSICIÓN');

// ── D3 · los contadores ──────────────────────────────────────────────────────
linea('D3 · ⭐⭐ LOS CONTADORES DEL ENGANCHE');
// ⭐ "dudoso" no es un tercer cajón vago: es un criterio medible. Un portal es
//    dudoso si la SEGUNDA calle distinta está a menos de 3 m de la primera —el
//    enganche no lo decidió la geometría, lo decidió el ruido— o si los dos
//    testigos independientes discrepan a la vez.
const esDudoso = (o) => o.enganchado
  && ((o.segundaD !== null && o.segundaD - o.d < 3)
    || (o.codigoVia_estado === 'DISCORDA' && o.consenso_estado === 'DISCORDA'));
const dud = eng.filter(esDudoso);
const claros = eng.filter((o) => !esDudoso(o));
di('enganchados CLAROS', claros.length);
di('enganchados DUDOSOS', dud.length);
di('NO enganchados (>120 m de toda arista a pie)', r.contadores.noEnganchados);
const suma = claros.length + dud.length + r.contadores.noEnganchados;
di('⭐ suma', `${suma}   ¿46.150 exactos? ${suma === 46150 ? '✅' : '⛔ NO CUADRA'}`);

log('');
log('   ⭐ DISTRIBUCIÓN DE LA DISTANCIA portal → arista (metros)');
const rp = E.reparto(eng.map((o) => o.d));
di('mediana · p90 · p99 · máximo', `${rp.mediana.toFixed(1)} · ${rp.p90.toFixed(1)} · ${rp.p99.toFixed(1)} · ${rp.max.toFixed(1)}`);
const h = {};
for (const o of eng) { const b = o.d < 2 ? '0-2' : o.d < 5 ? '2-5' : o.d < 10 ? '5-10' : o.d < 20 ? '10-20' : o.d < 50 ? '20-50' : '>50'; h[b] = (h[b] || 0) + 1; }
di('reparto', Object.entries(h).sort().map(([k, v]) => `${k}m:${v}`).join('  '));
const lejos = eng.filter((o) => o.d > 50);
di('⭐ a más de 50 m de cualquier arista', lejos.length + '  (' + (100 * lejos.length / 46150).toFixed(2) + ' %)');

log('');
log('   ⭐ LOS LEJANOS, CLASIFICADOS ANTES DE DAR EL NÚMERO (ley 29):');
{
  const clas = {};
  for (const o of lejos.concat(port.filter((x) => !x.enganchado))) {
    const k = !o.enganchado ? 'sin arista a pie a menos de 120 m'
      : o.peatonal ? 'lejos, y la arista es peatonal'
        : o.nucleoOsm ? 'lejos de una calle CON nombre' : 'lejos de una arista SIN nombre';
    clas[k] = (clas[k] || 0) + 1;
  }
  for (const [k, v] of Object.entries(clas).sort((a, b) => b[1] - a[1])) log('      ' + String(v).padStart(5) + '  ' + k);
}

// ── discordancia ─────────────────────────────────────────────────────────────
log('');
log('   ⭐⭐ DISCORDANCIA DEL `codigoVia` — clasificada, porque el bruto engaña');
{
  const est = {};
  for (const o of port) est[o.codigoVia_estado] = (est[o.codigoVia_estado] || 0) + 1;
  for (const [k, v] of Object.entries(est).sort((a, b) => b[1] - a[1])) {
    di('  ' + k, v + '  (' + (100 * v / 46150).toFixed(1) + ' %)');
  }
  const dis = port.filter((o) => o.codigoVia_estado === 'DISCORDA');
  let contiene = 0;
  for (const o of dis) {
    const a = o.via.nucleo, b = o.nucleoOsm;
    if (a && b && (a.includes(b) || b.includes(a))) contiene++;
  }
  log('');
  di('  de los DISCORDA, uno contiene al otro', contiene + '  ⬅ no es discordancia: es que el');
  log('        callejero municipal añade sufijos de barrio rural (CALLE MAYOR GRP =');
  log('        Garrapinillos) y calificativos que OSM no lleva. ⛔ NO se corrige con una');
  log('        lista de sufijos: `EBRO`, `LUNA` y `CRUZ` también van al final y son parte');
  log('        del nombre. Hacer esa lista sería repetir la ley 40.');
  di('  nombres REALMENTE distintos', (dis.length - contiene) + '  (' + (100 * (dis.length - contiene) / 46150).toFixed(2) + ' %)');

  const est2 = {};
  for (const o of port) est2[o.consenso_estado] = (est2[o.consenso_estado] || 0) + 1;
  log('');
  log('   ⭐ SEGUNDO TESTIGO — el consenso de la nube (no mira una sola letra):');
  for (const [k, v] of Object.entries(est2).sort((a, b) => b[1] - a[1])) {
    di('  ' + k, v + '  (' + (100 * v / 46150).toFixed(1) + ' %)');
  }
  const ambos = port.filter((o) => o.codigoVia_estado === 'DISCORDA' && o.consenso_estado === 'DISCORDA');
  log('');
  di('⭐⭐ DISCORDANTES POR LOS DOS TESTIGOS', ambos.length + '  (' + (100 * ambos.length / 46150).toFixed(2) + ' %)');
  log('      ⇒ Es el número comparable con el 3,5 % de la tanda 4, porque es el único');
  log('        que no depende de mi normalizador de nombres. Está por encima, y se dice.');
  // las vías donde la nube no opina (adenda §A1 lo exige explícitamente)
  const sinNube = new Set();
  for (const [cv, l] of r.porVia) if (l.filter((o) => o.nucleoOsm).length < 3) sinNube.add(cv);
  log('');
  di('⚠️ vías donde la NUBE NO OPINA', sinNube.size + ' de ' + r.porVia.size
    + '   (' + port.filter((o) => sinNube.has(o.codigoVia)).length + ' portales)');
  log('      la adenda §A1 exige decirlo: ahí la verificación es MÁS DÉBIL, y eso no');
  log('      puede quedar escondido dentro de un porcentaje global.');
}

// ── por zona ─────────────────────────────────────────────────────────────────
log('');
log('   ⭐ POR ZONA — ¿engancha igual en el casco que en Movera?');
log('   ' + 'zona'.padEnd(32) + 'portales'.padStart(9) + 'mediana'.padStart(9) + 'p90'.padStart(7)
  + '>50m'.padStart(7) + 'discorda2'.padStart(10));
for (const z of ZONAS) {
  const en = port.filter((o) => o.lat >= z.b.sur && o.lat <= z.b.norte && o.lon >= z.b.oeste && o.lon <= z.b.este);
  if (!en.length) { log('   ' + z.n.padEnd(32) + '        0'); continue; }
  const e2 = en.filter((o) => o.enganchado);
  const q = E.reparto(e2.map((o) => o.d));
  const d2 = en.filter((o) => o.codigoVia_estado === 'DISCORDA' && o.consenso_estado === 'DISCORDA').length;
  log('   ' + z.n.padEnd(32) + String(en.length).padStart(9) + q.mediana.toFixed(1).padStart(9)
    + q.p90.toFixed(1).padStart(7) + String(e2.filter((o) => o.d > 50).length).padStart(7)
    + (100 * d2 / en.length).toFixed(1).padStart(9) + '%');
}

// ── D4 · el lado de la calle ─────────────────────────────────────────────────
linea('D4 · ⭐ EL LADO DE LA CALLE — remedido SOBRE EL GRAFO PLANARIZADO');
log('   ⚠️ el 89,5 % de la adenda se midió sobre ways ENTEROS. Al partirlos en sus');
log('      intersecciones la unidad cambia, y hay que volver a medirlo. Aquí está.');
log('   ⚠️ Y se separan las vías peatonales: en una calle peatonal NO HAY LADO, y');
log('      contarlas infla el porcentaje midiendo bien donde no sirve.');
{
  const porArista = new Map();
  for (const o of eng) {
    if (o.arista === null) continue;
    if (!porArista.has(o.arista)) porArista.set(o.arista, []);
    porArista.get(o.arista).push(o);
  }
  function evaluar(lista) {
    // paridad -> lado dominante. acierto = fracción que respeta el mapa dominante
    const c = { 1: { par: 0, impar: 0 }, '-1': { par: 0, impar: 0 } };
    let n = 0;
    for (const o of lista) {
      if (!Number.isFinite(o.n) || o.lado === 0) continue;
      c[o.lado][o.n % 2 === 0 ? 'par' : 'impar']++; n++;
    }
    if (n < 4) return null;
    const a = c[1].par + c['-1'].impar;      // pares a un lado
    const b = c[1].impar + c['-1'].par;      // pares al otro
    return { n, acierto: Math.max(a, b) / n };
  }
  const filas = [];
  for (const [i, lista] of porArista) {
    const ev = evaluar(lista);
    if (!ev) continue;
    filas.push({ i, ...ev, peatonal: !!lista[0].peatonal, lista });
  }
  const rodada = filas.filter((f) => !f.peatonal);
  const peat = filas.filter((f) => f.peatonal);
  di('aristas con >=4 portales evaluables', filas.length);
  di('  de ellas RODADAS (tienen lado)', rodada.length);
  di('  de ellas PEATONALES (no hay lado)', peat.length + '  ⬅ se excluyen del número');
  const umbral = (arr, u) => arr.filter((f) => f.acierto >= u).length;
  log('');
  log('   ' + 'conjunto'.padEnd(26) + 'aristas'.padStart(9) + '>=0,95'.padStart(9) + '=1,00'.padStart(9) + 'portales cubiertos'.padStart(20));
  for (const [k, arr] of [['RODADAS (el número)', rodada], ['peatonales (referencia)', peat]]) {
    const cub = arr.filter((f) => f.acierto >= 0.95).reduce((s, f) => s + f.n, 0);
    const tot = arr.reduce((s, f) => s + f.n, 0);
    log('   ' + k.padEnd(26) + String(arr.length).padStart(9)
      + (100 * umbral(arr, 0.95) / (arr.length || 1)).toFixed(1).padStart(8) + '%'
      + (100 * umbral(arr, 1) / (arr.length || 1)).toFixed(1).padStart(8) + '%'
      + (tot ? (100 * cub / tot).toFixed(1) : '—').padStart(19) + '%');
  }
  // ⭐⭐ LA LÍNEA BASE, Y POR QUÉ HAY DOS.
  //
  // ⚠️ La primera que escribí BARAJABA LAS PARIDADES dentro de cada arista, que es
  //    lo que dice la adenda. Sobre ways enteros funciona; sobre aristas
  //    planarizadas NO DESTRUYE NADA: si los 4 portales de una arista son todos
  //    pares —lo normal, porque una arista corta cae en un solo lado— cualquier
  //    baraja deja el mismo multiconjunto y el acierto sigue siendo 1,00.
  //    Daba 30,5 %, y eso no era el azar: era el número de aristas homogéneas.
  //    ⇒ Una línea base que no puede bajar la señal no es una línea base, igual
  //      que una contraprueba que no puede ponerse roja no es una contraprueba.
  //
  // ⭐ La buena sortea EL LADO de cada portal a cara o cruz: eso sí rompe la
  //    correspondencia paridad↔lado, que es justo lo que se quiere medir.
  const rnd = rng(20260803);
  const baseParidad = rodada.map((f) => {
    const par = f.lista.map((o) => o.n).filter(Number.isFinite);
    for (let i = par.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [par[i], par[j]] = [par[j], par[i]]; }
    return evaluar(f.lista.filter((o) => Number.isFinite(o.n)).map((o, k) => ({ ...o, n: par[k] })));
  }).filter(Boolean);
  const baseLado = rodada.map((f) => evaluar(f.lista.map((o) => ({ ...o, lado: rnd() < 0.5 ? 1 : -1 })))).filter(Boolean);
  const pct = (arr) => 100 * arr.filter((x) => x.acierto >= 0.95).length / arr.length;
  log('');
  di('⛔ línea base MALA (paridades barajadas)', pct(baseParidad).toFixed(1) + ' %  ⬅ no destruye la señal');
  di('⭐ LÍNEA BASE BUENA (lado a cara o cruz)', pct(baseLado).toFixed(1) + ' %');
  di('   la señal real >=0,95', (100 * umbral(rodada, 0.95) / rodada.length).toFixed(1) + ' %');
  log('   ⇒ ' + ((umbral(rodada, 0.95) / rodada.length) / Math.max(1e-9, pct(baseLado) / 100)).toFixed(1) + '× el azar');
  log('');
  log('   ⚠️ D5 · NO se usa el lado en vías cuyo emparejamiento sea DUDOSO: sobre una vía');
  log('      mal emparejada el lado se calcula contra el eje equivocado y sale basura con');
  log('      buena pinta. Aristas descartadas por ese motivo:');
  const sucias = rodada.filter((f) => f.lista.some((o) => o.codigoVia_estado === 'DISCORDA' && o.consenso_estado === 'DISCORDA'));
  di('   aristas con algún portal doblemente discordante', sucias.length);
  const limpias = rodada.filter((f) => !sucias.includes(f));
  di('   ⇒ aristas donde el lado SÍ se puede usar', limpias.length + '  ('
    + (100 * umbral(limpias, 0.95) / (limpias.length || 1)).toFixed(1) + ' % pasan el 0,95)');
}

// ═══════════════════════════════════════════════════════════════════════════
linea('E · LA VERIFICACIÓN');

log('');
log('E1 · ⭐⭐ CONTRAPRUEBA DEL DESPLAZAMIENTO — los portales 2 km al noreste');
log('   ⚠️ Si el enganche sigue acertando con los portales movidos, no mide');
log('      correspondencia: mide densidad urbana. El número va ANTES del bueno.');
{
  const movidos = P.cargarPortales().map((p) => ({ ...p, m: [p.m[0] + 2000, p.m[1] + 2000] }));
  const rm = E.enganchar(g, TAGS, { portales: movidos, vias: r.vias });
  const conc = (x) => x.portales.filter((o) => o.codigoVia_estado === 'concuerda').length;
  const cons = (x) => x.portales.filter((o) => o.consenso_estado === 'concuerda').length;
  log('   ' + ''.padEnd(34) + 'MOVIDOS 2 km'.padStart(14) + 'reales'.padStart(12));
  log('   ' + 'enganchados'.padEnd(34) + String(rm.contadores.enganchados).padStart(14) + String(r.contadores.enganchados).padStart(12));
  log('   ' + 'codigoVia concuerda'.padEnd(34) + String(conc(rm)).padStart(14) + String(conc(r)).padStart(12));
  log('   ' + '   en %'.padEnd(34) + (100 * conc(rm) / 46150).toFixed(2).padStart(13) + '%' + (100 * conc(r) / 46150).toFixed(2).padStart(11) + '%');
  log('   ' + 'consenso concuerda'.padEnd(34) + String(cons(rm)).padStart(14) + String(cons(r)).padStart(12));
  const md = E.reparto(rm.portales.filter((o) => o.enganchado).map((o) => o.d));
  log('   ' + 'distancia mediana (m)'.padEnd(34) + md.mediana.toFixed(1).padStart(14) + rp.mediana.toFixed(1).padStart(12));
  const cae = conc(rm) / Math.max(1, conc(r));
  log('');
  di('⇒ el acierto del código cae a', (100 * cae).toFixed(1) + ' % del original');
  log('   ⇒ ' + (cae < 0.15 ? '✅ SE HUNDE: el enganche mide correspondencia, no densidad'
    : '⛔⛔ NO SE HUNDE — PARA TODO. El enganche no mide lo que dice medir.'));
}

log('');
log('E2 · ⭐⭐ CONTRAPRUEBA DE IDENTIDAD — la que siempre falta');
log('   ⚠️ El desplazamiento es ciego al eje IDENTIDAD: mueve TODO a la vez, así que');
log('      no puede distinguir "esta calle" de "una calle igual al lado". Se planta');
log('      una calle GEMELA a 12 m de una real y se mira si el enganche se entera.');
{
  // se elige la vía con más portales, y se le clona el eje desplazado 12 m
  let mejorVia = null, max = 0;
  for (const [cv, l] of r.porVia) if (l.length > max && l[0].via) { max = l.length; mejorVia = cv; }
  const lista = r.porVia.get(mejorVia);
  const nom = lista[0].via.nombre;
  const aristasDe = [...new Set(lista.filter((o) => o.arista !== null).map((o) => o.arista))];
  di('vía elegida (la de más portales)', nom + '  ·  ' + lista.length + ' portales  ·  ' + aristasDe.length + ' aristas');
  const clon = aristasDe.map((i) => {
    const e = g.aristas[i];
    return { ...e, pts: e.pts.map((p) => [p[0] + 12, p[1] + 12]), way: 999000000 + i };
  });
  const g2 = { ...g, aristas: g.aristas.concat(clon) };
  const T2 = new Map(TAGS);
  for (const c of clon) T2.set(c.way, { highway: 'residential', name: nom + ' (GEMELA DE PRUEBA)' });
  const r2 = E.enganchar(g2, T2, { portales: lista.map((o) => ({ id: o.id, codigoVia: o.codigoVia, numero: o.numero, n: o.n, lat: o.lat, lon: o.lon, m: o.m })), vias: r.vias });
  const aClon = r2.portales.filter((o) => o.arista !== null && g2.aristas[o.arista].way >= 999000000).length;
  di('portales que se van a la GEMELA', aClon + ' de ' + lista.length);
  di('⇒', aClon > 0
    ? '✅ el enganche SE ENTERA: distingue dos ejes a 12 m y el reparto cambia'
    : '⛔ no se entera de una calle nueva a 12 m');
  // y el complementario: ¿lo detectan las salvaguardas?
  const disc = r2.portales.filter((o) => o.codigoVia_estado === 'DISCORDA').length;
  di('   de los que se van, ¿los marca el codigoVia?', disc + '  (la gemela lleva otro nombre)');
}

log('');
log('E3 · ⭐ LÍNEA BASE — ¿qué acertaría un enganche AL AZAR?');
log('   ⚠️ Sin esto, "el 54 % concuerda" no significa nada: podría ser lo que sale solo.');
{
  const idx = P.indexarAristas(g.aristas, (e) => e.pie);
  const rnd = rng(20260804);
  let n = 0, ok = 0, sinCand = 0;
  const muestra = port.filter((o) => o.enganchado && o.via && o.via.nucleo);
  for (let k = 0; k < 4000; k++) {
    const o = muestra[Math.floor(rnd() * muestra.length)];
    // todas las aristas a pie a menos de 120 m, y se elige UNA AL AZAR
    const cand = [];
    const cx = Math.floor(o.m[0] / idx.celda), cy = Math.floor(o.m[1] / idx.celda);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      for (const [i] of (idx.m.get(x + ',' + y) || [])) cand.push(i);
    }
    if (!cand.length) { sinCand++; continue; }
    const e = g.aristas[cand[Math.floor(rnd() * cand.length)]];
    const nu = P.nucleo((TAGS.get(e.way) || {}).name);
    n++;
    if (nu && nu === o.via.nucleo) ok++;
  }
  const azar = 100 * ok / n;
  const real = 100 * port.filter((o) => o.codigoVia_estado === 'concuerda').length
    / port.filter((o) => o.via && o.via.nucleo && o.enganchado).length;
  di('muestra de portales (semilla 20260804)', n);
  di('acierto de un enganche AL AZAR (misma zona)', azar.toFixed(1) + ' %');
  di('acierto del enganche REAL', real.toFixed(1) + ' %');
  di('⇒', (real / Math.max(azar, 1e-9)).toFixed(1) + '× el azar');
}

log('');
log('E4 · ⭐ LA COLA, ORDENADA POR GRAVEDAD — los 50 peores para que Antonio los mire');
{
  const grav = (o) => (o.enganchado ? o.d : 999)
    + (o.codigoVia_estado === 'DISCORDA' ? 60 : 0)
    + (o.consenso_estado === 'DISCORDA' ? 60 : 0);
  const peores = port.slice().sort((a, b) => grav(b) - grav(a)).slice(0, 50);
  log('   ' + 'dirección'.padEnd(46) + 'dist'.padStart(7) + '  ' + 'OSM más cercana'.padEnd(28) + 'coordenada');
  for (const o of peores) {
    const dir = ((o.via ? o.via.nombre : '(sin vía ' + o.codigoVia + ')') + ' ' + o.numero).slice(0, 45);
    log('   ' + dir.padEnd(46) + (o.enganchado ? o.d.toFixed(0) + ' m' : 'SIN').padStart(7)
      + '  ' + String(o.nombreOsm || '(sin nombre)').slice(0, 27).padEnd(28)
      + o.lat.toFixed(5) + ',' + o.lon.toFixed(5));
  }
}

di('', '');
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');

module.exports = { g, r, TAGS };
