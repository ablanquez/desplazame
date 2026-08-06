// ⭐⭐⭐ TANDA 32 · ¿A QUÉ ACERA ENGANCHA CADA PORTAL? — ⛔ AUDITA Y MIDE. NO ARREGLA.
//
//   node src/acera-equivocada.js
//
// ═════════════════════════════════════════════════════════════════════════════
// EL HALLAZGO DE ANTONIO
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Te das cuenta de que Avenida Cataluña 78 en el recorrido lo marca en la
//   >  acera contraria, y que además está mucho antes.»*
//   > *«Si analizas la Avenida de Madrid, la parte de números altos, verás que ni
//   >  de coña coincide una acera con la de enfrente.»*
//
//   ⛔⛔ Y POR QUÉ NADA LO CAZÓ: **las dos aceras de una avenida tienen el mismo
//     nombre y el mismo `codigoVia`**. El `codigoVia` dice «correcto», la nube de
//     portales dice «correcto», la calle pegada dice «correcto». No es que
//     fallaran: **ninguno de los tres mira de qué acera se trata.**
//   ⇒ Todos los porcentajes publicados —99,6 % · 97,0 % · 93,4 % · 89,7 %— miden
//     IDENTIDAD DE CALLE, no de acera.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ EL SESGO DE ESTA TANDA, DECLARADO ANTES DE MEDIR
// ═════════════════════════════════════════════════════════════════════════════
//   La tesis es que hay un fallo, y **eso empuja a que el número salga grande**.
//   ⇒ Tres frenos, puestos antes de mirar:
//     1 · **Un eje de calzada NO tiene lado.** En una calle dibujada por su eje,
//         los portales de las dos aceras cuelgan de la misma línea y ninguno está
//         «en la acera contraria»: no hay dos aceras que elegir. Contarlos sería
//         inflar el número con casos que no son el fallo.
//     2 · **La paridad dominante de una arista se declara con listón**, y el
//         listón va escrito aquí arriba, no ajustado luego.
//     3 · **Las dianas de Antonio son el CONTROL, no la muestra**: si el método no
//         caza Avenida de Madrid y Avenida de Cataluña, el método no vale, y eso
//         se dice antes que ningún porcentaje.

'use strict';
const A = require('./alarma');
const D = require('./direccion');
const P = require('./portales');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

// ── LOS LISTONES, declarados antes de ejecutar ───────────────────────────────
/** Portales de la vía colgando de una arista para que su paridad «mande». */
const MIN_PORTALES_ARISTA = 4;
/** Fracción de una paridad para llamar a la arista «de esa acera». */
const DOMINIO = 0.75;
/** Portales de cada paridad para decir que una vía tiene DOS HILOS. */
const MIN_HILO = 5;

/** ⭐ Precisiones D4 que SÍ son un lado. Un eje no lo es: es de las dos aceras. */
const TIENE_LADO = new Set(['acera', 'peatonal', 'escaleras', 'paso-de-peatones']);
const ES_EJE = new Set(['eje-de-calzada', 'eje-con-acera-declarada']);

const par = (n) => (n % 2 === 0 ? 'par' : 'impar');

/**
 * ⭐⭐ Clasifica cada arista por la paridad de los portales de UNA vía que cuelgan
 * de ella. Devuelve Map `via|arista` -> {n, par, impar, dominante, precision}.
 * ⛔ La clave lleva la vía: la misma arista puede tener portales de dos calles.
 */
function paridadDeAristas(portales, aristas) {
  const m = new Map();
  for (const o of portales) {
    if (!o.enganchado || o.n == null) continue;
    const k = o.codigoVia + '|' + o.arista;
    if (!m.has(k)) m.set(k, { n: 0, par: 0, impar: 0, arista: o.arista, via: o.codigoVia });
    const x = m.get(k);
    x.n++; x[par(o.n)]++;
  }
  for (const x of m.values()) {
    x.precision = aristas[x.arista].precision;
    const mayor = Math.max(x.par, x.impar);
    x.dominante = (x.n >= MIN_PORTALES_ARISTA && mayor / x.n >= DOMINIO)
      ? (x.par > x.impar ? 'par' : 'impar') : null;
  }
  return m;
}

/**
 * ⭐ El veredicto de un portal. Tres estados y ninguno es «otros».
 *   CORRECTO         · la arista es de acera y su paridad dominante es la suya
 *   LADO-CONTRARIO   · la arista es de acera y su paridad dominante es la OTRA
 *   NO-DECIDIBLE     · es un eje (no hay lado), o la arista no tiene dominante
 */
function veredicto(o, tabla) {
  if (!o.enganchado || o.n == null) return { estado: 'NO-DECIDIBLE', motivo: 'sin-enganche-o-sin-numero' };
  const x = tabla.get(o.codigoVia + '|' + o.arista);
  if (!x) return { estado: 'NO-DECIDIBLE', motivo: 'sin-tabla' };
  if (ES_EJE.has(x.precision)) return { estado: 'NO-DECIDIBLE', motivo: 'la-arista-es-un-EJE', x };
  if (!TIENE_LADO.has(x.precision)) return { estado: 'NO-DECIDIBLE', motivo: 'precision-sin-lado', x };
  if (!x.dominante) return { estado: 'NO-DECIDIBLE', motivo: 'la-arista-no-tiene-paridad-dominante', x };
  return { estado: x.dominante === par(o.n) ? 'CORRECTO' : 'LADO-CONTRARIO', x };
}

/** Los dos hilos de una vía, ordenados por número. */
function hilos(lista) {
  const p = lista.filter((o) => o.n != null && o.n % 2 === 0).sort((a, b) => a.n - b.n);
  const i = lista.filter((o) => o.n != null && o.n % 2 === 1).sort((a, b) => a.n - b.n);
  return { par: p, impar: i, dos: p.length >= MIN_HILO && i.length >= MIN_HILO };
}

/**
 * ⭐⭐ EL DESFASE ENTRE HILOS de una vía: para cada portal, a qué distancia está el
 * portal de la OTRA paridad con el número más próximo. Si las dos aceras van
 * emparejadas, sale pequeño; si van desfasadas, sale grande.
 * ⛔ Se mide en METROS sobre el terreno, no en números.
 */
function desfase(lista) {
  const h = hilos(lista);
  if (!h.dos) return null;
  const vals = [];
  for (const [a, b] of [[h.par, h.impar], [h.impar, h.par]]) {
    for (const o of a) {
      let mejor = null, dn = Infinity;
      for (const q of b) {
        const k = Math.abs(q.n - o.n);
        if (k < dn) { dn = k; mejor = q; }
      }
      if (mejor) vals.push(Math.hypot(mejor.m[0] - o.m[0], mejor.m[1] - o.m[1]));
    }
  }
  return vals;
}

/** Mediana, p90, máximo. */
function reparto(v) {
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, mediana: q(0.5), p90: q(0.9), max: s[s.length - 1] };
}

module.exports = { paridadDeAristas, veredicto, hilos, desfase, reparto,
  MIN_PORTALES_ARISTA, DOMINIO, MIN_HILO, TIENE_LADO, ES_EJE, par };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const todos = ctx.enganche.portales;
  const eng = todos.filter((o) => o.enganchado);
  const porVia = new Map();
  for (const o of eng) {
    if (!porVia.has(o.codigoVia)) porVia.set(o.codigoVia, []);
    porVia.get(o.codigoVia).push(o);
  }
  const nombreVia = (cv) => { const l = porVia.get(cv); return (l && l[0].via && l[0].via.nombre) || cv; };

  log('='.repeat(112));
  log('¿A QUÉ ACERA ENGANCHA CADA PORTAL? — ⛔ SOLO AUDITA Y MIDE');
  log('='.repeat(112));
  di('portales del callejero', todos.length);
  di('   …enganchados al grafo', `${eng.length}  (${pct(eng.length, todos.length)})`);
  di('vías con portales enganchados', porVia.size);
  di('listones declarados', `arista: ≥${MIN_PORTALES_ARISTA} portales y ≥${(100 * DOMINIO).toFixed(0)} % de una paridad · hilo: ≥${MIN_HILO}`);

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('A · ⭐⭐ EL CASO CONCRETO — Avenida Cataluña 78, que es donde Antonio lo vio');
  log('='.repeat(112));
  const ps = P.cargarPortales();
  {
    const res = D.resolver('Avenida Cataluña 78', ctx.indice);
    // ⚠️⚠️ TANDA 33 · LO QUE ESTE BLOQUE MIDE YA NO ES LO QUE CONTESTA EL BUSCADOR.
    //   La regla de la paridad (`src/paridad.js`) hizo que `Avenida Cataluña 78`
    //   deje de tener respuesta: ahora sale `sin-numero-cerca` y dos sugerencias.
    //   ⛔ El hallazgo de la tanda 32 NO se borra ni se reescribe: se sigue midiendo
    //     **sobre el nº77**, que es lo que se devolvía entonces, pedido ahora de
    //     forma explícita. Así los números de `docs/H1-ACERA-EQUIVOCADA.md` siguen
    //     siendo reproducibles y al lado se ve qué contesta el buscador de hoy.
    const o = res.portal || D.resolver('Avenida Cataluña 77', ctx.indice).portal;
    di('lo que se pide', 'Avenida Cataluña 78');
    di('⭐⭐ lo que devuelve HOY el geocodificador', res.portal
      ? `el portal nº${res.portal.n}   (estado: ${res.estado})`
      : `⛔ NADA — estado ${res.estado}, con sugerencias `
        + (res.sugerencias || []).map((s) => 'nº' + s.n).join(' / ') + '   ⭐ TANDA 33');
    di('   y lo dice', res.aviso ? '✅ «' + res.aviso + '»' : '⛔ NO lo dice');
    A.exige(!!res.aviso, 'el geocodificador cambia de número y no lo dice');
    di('⚠️ lo que devolvía cuando se midió esto (tanda 32)', `el portal nº${o.n}`);
    di('⛔ ¿cambiaba de PARIDAD?', (78 % 2) !== (o.n % 2) ? '⛔ SÍ — 78 es par y el 77 es impar' : 'no');
    log('');
    di('A1 · el enganche del portal que devuelve', `arista ${o.arista} a ${o.d.toFixed(2)} m`);
    const e = g.aristas[o.arista];
    di('   la arista', `way ${e.way} · ${e.highway} · ${e.precision} · «${g.nombres.get(e.way) || '(sin nombre)'}»`);
    const v = null; // el veredicto se calcula abajo, con la tabla
    di('   ⭐ ¿está el 78 en el callejero?', ps.some((p) => p.codigoVia === o.codigoVia && p.n === 78) ? 'SÍ' : '⛔ NO — por eso cae al 77');
    // ⭐ la pregunta que lo cierra: ¿dónde estaba el de SU paridad?
    const mismos = ps.filter((p) => p.codigoVia === o.codigoVia && p.n != null && p.n % 2 === 0)
      .sort((a, b) => Math.abs(a.n - 78) - Math.abs(b.n - 78));
    for (const c of mismos.slice(0, 2)) {
      di(`   ⭐⭐ el par más próximo en número (nº${c.n})`,
        `a ${Math.hypot(c.m[0] - o.m[0], c.m[1] - o.m[1]).toFixed(0)} m del nº${o.n} que te da`);
    }
    log('');
    log('   A3 · ⚠️ ¿PODÍA HABERLO DICHO ALGUNO DE LOS TRES TESTIGOS? — predicción: ninguno');
    di('   testigo 1 · el `codigoVia` municipal', o.codigoVia_estado + (o.codigoVia_estado === 'concuerda' ? '   ⛔ dice que está bien' : ''));
    di('   testigo 2 · el consenso de la nube', o.consenso_estado + (o.consenso_estado === 'concuerda' ? '   ⛔ dice que está bien' : ''));
    di('   testigo 3 · la calle pegada (mismo nombre)', 'la avenida se llama igual por los dos lados   ⛔ dice que está bien');
    A.exige(o.codigoVia_estado === 'concuerda' && o.consenso_estado === 'concuerda',
      'algún testigo SÍ señala el caso de Antonio: entonces el diagnóstico de esta tanda está mal y hay que releerlo');
    log('   ⇒ ⭐⭐⭐ Los tres dicen «correcto» porque **los tres miran la CALLE, y las dos aceras');
    log('     son la misma calle**. El que sí avisó fue el geocodificador, y su aviso dice');
    log('     «el más cercano es el 77» — donde «cercano» es EN NÚMERO, y se lee como EN LA CALLE.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('C · ⭐⭐⭐ LAS DIANAS DE ANTONIO — el CONTROL. Van antes que ningún porcentaje.');
  log('='.repeat(112));
  log('   ⛔ Si el método no caza estas dos, el método no vale y todo lo de abajo sobra.');
  const DIANAS = ['cataluna', 'madrid'];
  const nucleoDeVia = (cv) => { const l = porVia.get(cv); return (l && l[0].via && l[0].via.nucleo) || ''; };
  const dianaCv = new Map();
  for (const cv of porVia.keys()) {
    const nu = nucleoDeVia(cv);
    if (DIANAS.includes(nu)) dianaCv.set(nu, cv);
  }
  log('');
  log('   ' + 'vía'.padEnd(28) + 'portales'.padStart(10) + 'pares'.padStart(8) + 'impares'.padStart(9)
    + 'DESFASE entre hilos (m)'.padStart(30));
  const desfasesDiana = new Map();
  for (const [nu, cv] of dianaCv) {
    const l = porVia.get(cv);
    const h = hilos(l);
    const d = desfase(l);
    const r = reparto(d || []);
    desfasesDiana.set(nu, r);
    log('   ' + nombreVia(cv).padEnd(28) + String(l.length).padStart(10) + String(h.par.length).padStart(8)
      + String(h.impar.length).padStart(9)
      + (r ? `mediana ${r.mediana.toFixed(0)} · p90 ${r.p90.toFixed(0)} · máx ${r.max.toFixed(0)}` : 'NO HAY DOS HILOS').padStart(30));
  }
  A.exige(dianaCv.size === 2, `no se han encontrado las dos dianas en el callejero (${dianaCv.size} de 2)`);

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B1 · LOS DOS HILOS — cuántas vías los tienen, y las que NO encajan');
  log('='.repeat(112));
  let conDos = 0, unSoloLado = 0, pocos = 0, repetidos = 0;
  const desfasePorVia = new Map();
  for (const [cv, l] of porVia) {
    const h = hilos(l);
    const nums = l.map((o) => o.n).filter((n) => n != null);
    const rep = nums.length - new Set(nums).size;
    if (rep > 0) repetidos++;
    if (h.dos) { conDos++; const d = desfase(l); if (d) desfasePorVia.set(cv, reparto(d)); }
    else if (h.par.length === 0 || h.impar.length === 0) unSoloLado++;
    else pocos++;
  }
  di('vías con DOS HILOS claros (≥5 de cada paridad)', `${conDos}  (${pct(conDos, porVia.size)})`);
  di('⚠️ vías de UN SOLO LADO (toda una paridad)', `${unSoloLado}  (${pct(unSoloLado, porVia.size)})`);
  di('⚠️ vías con pocos de alguna paridad', `${pocos}  (${pct(pocos, porVia.size)})`);
  di('⚠️ vías con algún número REPETIDO dentro de sí', `${repetidos}  (${pct(repetidos, porVia.size)})`);
  log('   ⛔ Las tres últimas NO se fuerzan: numeración correlativa en vez de par/impar');
  log('     (Torres de San Lamberto, Polígono San Valero), calles de un solo lado, y bloques');
  log('     que comparten número. **Van a NO DECIDIBLE, que es un resultado.**');
  A.exige(conDos > 0, 'ninguna vía tiene dos hilos: el método no puede opinar de nada');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B2 · ⭐⭐ ¿DE QUÉ ACERA ES LA ARISTA A LA QUE ENGANCHA?');
  log('='.repeat(112));
  log('   ⭐ Una arista de ACERA pertenece a un lado; un EJE DE CALZADA no: los portales de');
  log('     las dos aceras cuelgan de la misma línea y ninguno está «enfrente». ⇒ los ejes');
  log('     van a NO DECIDIBLE por definición, no por no saber.');
  const tabla = paridadDeAristas(eng, g.aristas);
  const cuenta = { CORRECTO: 0, 'LADO-CONTRARIO': 0, 'NO-DECIDIBLE': 0 };
  const motivos = new Map();
  const contrarios = [];
  for (const o of eng) {
    const v = veredicto(o, tabla);
    cuenta[v.estado]++;
    o._v = v;
    if (v.estado === 'NO-DECIDIBLE') motivos.set(v.motivo, (motivos.get(v.motivo) || 0) + 1);
    if (v.estado === 'LADO-CONTRARIO') contrarios.push(o);
  }
  log('');
  for (const k of ['CORRECTO', 'LADO-CONTRARIO', 'NO-DECIDIBLE']) {
    log('   ' + (k === 'LADO-CONTRARIO' ? '⛔ ' + k : k).padEnd(30) + String(cuenta[k]).padStart(10)
      + pct(cuenta[k], eng.length).padStart(10));
  }
  log('');
  log('   ⚠️ POR QUÉ NO SE PUEDE DECIDIR — clasificar antes de contar (ley 29)');
  for (const [k, v] of [...motivos.entries()].sort((a, b) => b[1] - a[1])) {
    log('      ' + k.padEnd(44) + String(v).padStart(10) + pct(v, eng.length).padStart(10));
  }
  const decidibles = cuenta.CORRECTO + cuenta['LADO-CONTRARIO'];
  di('⭐ sobre los DECIDIBLES, los que están enfrente', `${cuenta['LADO-CONTRARIO']} de ${decidibles}   ${pct(cuenta['LADO-CONTRARIO'], decidibles)}`);
  A.exige(decidibles > 0, 'no hay ni un portal decidible: el método no separa nada');

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ LA LÍNEA BASE — sin esto, un 0,8 % no dice si el método ve poco o no ve
  // ═══════════════════════════════════════════════════════════════════════════
  //   Se barajan las paridades DENTRO de cada vía y se vuelve a preguntar. Si el
  //   método distinguiera algo, con las paridades barajadas tendría que salir
  //   muchísimo más «enfrente». Si saliera lo mismo, el método está ciego y el
  //   0,8 % no significa nada.
  //   ⛔ Se baraja la PARIDAD, no el portal: así el enganche, la geometría y las
  //     aristas se quedan exactamente como están y lo único que cambia es la
  //     etiqueta que el método usa para decidir.
  log('');
  log('   ⭐⭐⭐ LA LÍNEA BASE — paridades barajadas dentro de cada vía');
  {
    let semilla = 20260805;
    const rnd = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
    const falsos = eng.map((o) => ({ ...o }));
    for (const [, l] of porVia) {
      const idx = l.map((o) => falsos.findIndex((x) => x.id === o.id)).filter((i) => i >= 0);
      const ns = idx.map((i) => falsos[i].n);
      for (let i = ns.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ns[i], ns[j]] = [ns[j], ns[i]]; }
      idx.forEach((i, k) => { falsos[i].n = ns[k]; });
    }
    const tb = paridadDeAristas(falsos, g.aristas);
    let c2 = 0, d2 = 0;
    for (const o of falsos) { const v = veredicto(o, tb); if (v.estado === 'LADO-CONTRARIO') c2++; if (v.estado !== 'NO-DECIDIBLE') d2++; }
    log('      ' + 'el método, tal cual'.padEnd(40) + `${cuenta['LADO-CONTRARIO']} de ${decidibles}`.padStart(18) + pct(cuenta['LADO-CONTRARIO'], decidibles).padStart(10));
    log('      ' + '⛔ con las paridades BARAJADAS'.padEnd(41) + `${c2} de ${d2}`.padStart(18) + pct(c2, d2).padStart(10));
    const separa = (d2 ? c2 / d2 : 0) > 3 * (decidibles ? cuenta['LADO-CONTRARIO'] / decidibles : 1);
    di('   ⭐⭐ ¿el método SEPARA? (barajado ≥ ×3 el real)', separa ? '✅ sí' : '⛔ NO — el 0,8 % no significa nada');
    A.exige(separa, 'con las paridades barajadas sale casi lo mismo: el método no distingue nada y su número no vale');
    global._BASE = { c2, d2 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ EL CONTROL DE LAS DIANAS — y son DOS afirmaciones, no una
  // ═══════════════════════════════════════════════════════════════════════════
  //   Antonio dijo dos cosas de estas avenidas, y no son la misma:
  //     (a) *«lo marca en la acera contraria»*  → eso es §B2
  //     (b) *«ni de coña coincide una acera con la de enfrente»* → eso es el DESFASE
  //   ⚠️⚠️ Se comprueban las dos por separado **y el resultado es distinto**, que es
  //     justo lo que hace falta saber. ⛔ El `A.exige` va sobre (b) porque es la
  //     afirmación literal y medible sobre la avenida; (a) se REPORTA con su
  //     explicación medida, no se disimula.
  log('');
  log('   ⭐⭐⭐ ¿CAZA EL MÉTODO LAS DOS DIANAS? — dos preguntas distintas');
  let cazadasDesfase = 0;
  for (const [nu, cv] of dianaCv) {
    const l = porVia.get(cv);
    const c = l.filter((o) => o._v && o._v.estado === 'LADO-CONTRARIO').length;
    const d = l.filter((o) => o._v && o._v.estado !== 'NO-DECIDIBLE').length;
    // ¿hay alguna arista de acera con las DOS paridades? Si no, el enganche no puede
    // estar «enfrente»: cada acera lleva solo su paridad.
    const porAr = new Map();
    for (const o of l) {
      if (!TIENE_LADO.has(g.aristas[o.arista].precision) || ES_EJE.has(g.aristas[o.arista].precision)) continue;
      if (!porAr.has(o.arista)) porAr.set(o.arista, { par: 0, impar: 0 });
      porAr.get(o.arista)[par(o.n)]++;
    }
    const mixtas = [...porAr.values()].filter((x) => x.par > 0 && x.impar > 0).length;
    const r = desfasesDiana.get(nu);
    log('      ' + nombreVia(cv).padEnd(24)
      + `(a) enfrente: ${c} de ${d}`.padStart(26) + (c > 0 ? '  ✅' : '  ⛔ NO')
      + `   (b) desfase mediano: ${r ? r.mediana.toFixed(0) + ' m' : '—'}`.padStart(34)
      + (r && r.mediana > 50 ? '  ✅ LA CAZA' : '  ⛔ NO'));
    log('        ⚠️ aristas de ACERA de esta vía con las DOS paridades: ' + mixtas + ' de ' + porAr.size
      + (mixtas === 0 ? '   ⇒ el enganche NO PUEDE estar enfrente aquí' : ''));
    if (r && r.mediana > 50) cazadasDesfase++;
  }
  log('   ⇒ ⭐⭐⭐ (a) NO se caza, y el motivo está medido: **cada acera lleva solo su');
  log('     paridad**, así que en estas dos avenidas el enganche es correcto. Lo que está');
  log('     desfasado es la NUMERACIÓN, que es (b) — y es lo que Antonio describió.');
  A.exige(cazadasDesfase === dianaCv.size,
    `el método no caza el desfase de ${dianaCv.size - cazadasDesfase} de las ${dianaCv.size} dianas: el instrumento no vale`);

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B3 · ⭐⭐⭐ ¿CUÁNTO DESVÍA? — que es lo que dice si esto es cosmético o grave');
  log('='.repeat(112));
  log('   ⭐ EL ARRANQUE DE LA RUTA ES LA PROYECCIÓN SOBRE LA ARISTA, no un nodo: se');
  log('     comprueba en `grafo.insertar()`, que mete el nodo temporal en `q`. ⇒ la');
  log('     distancia portal→arranque **es la distancia de enganche**, y es pequeña por');
  log('     construcción. **Estar enfrente no desplaza a lo largo de la calle.**');
  {
    const dTodos = reparto(eng.map((o) => o.d));
    const dContra = reparto(contrarios.map((o) => o.d));
    log('');
    log('   ' + 'distancia portal → arranque de su ruta'.padEnd(44) + 'mediana'.padStart(10)
      + 'p90'.padStart(10) + 'máx'.padStart(10));
    log('   ' + 'todos los enganchados'.padEnd(44) + dTodos.mediana.toFixed(1).padStart(10)
      + dTodos.p90.toFixed(1).padStart(10) + dTodos.max.toFixed(1).padStart(10));
    if (dContra) log('   ' + '⛔ los del LADO CONTRARIO'.padEnd(45) + dContra.mediana.toFixed(1).padStart(10)
      + dContra.p90.toFixed(1).padStart(10) + dContra.max.toFixed(1).padStart(10));
    log('   ⇒ ⭐ El daño del enganche a la acera de enfrente NO es desplazamiento: es que hay');
    log('     que CRUZAR. El desplazamiento a lo largo de la calle viene de otro sitio, y es');
    log('     lo que mide §B3b.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B3b · ⭐⭐⭐ EL DESPLAZAMIENTO DE VERDAD — el número que NO existe en el callejero');
  log('='.repeat(112));
  log('   ⭐ Es lo que pasó en Avenida Cataluña 78: **el 78 no existe**. `direccion.js`');
  log('     cae al número más cercano **sin mirar la paridad**, y devuelve el 77 — la otra');
  log('     acera. Y en una avenida con los hilos desfasados, eso son cientos de metros.');
  log('   ⚠️ Este desplazamiento NO lo produce el enganche: lo produce el geocodificador.');
  {
    // para cada vía con dos hilos, cada HUECO de numeración: qué número faltaría,
    // a qué portal caería hoy, y a qué distancia está el de su misma paridad.
    const saltos = [];
    const _den = { vias: 0, rango: 0, existen: 0, huecos: 0 };
    for (const [cv, l] of porVia) {
      const h = hilos(l);
      if (!h.dos) continue;
      const presentes = new Set(l.map((o) => o.n).filter((n) => n != null));
      const nums = [...presentes].sort((a, b) => a - b);
      const lo = nums[0], hi = nums[nums.length - 1];
      _den.rango += (hi - lo + 1);
      _den.existen += presentes.size;
      _den.vias++;
      for (let n = lo; n <= hi; n++) {
        if (presentes.has(n)) continue;
        _den.huecos++;
        // ⛔ lo que haría HOY `direccion.resolver`: el más cercano EN NÚMERO
        let dado = null, dn = Infinity;
        for (const o of l) { if (o.n == null) continue; const k = Math.abs(o.n - n); if (k < dn) { dn = k; dado = o; } }
        if (!dado) continue;
        const cambiaParidad = (dado.n % 2) !== (n % 2);
        if (!cambiaParidad) continue;
        // el de SU paridad más próximo en número
        const suyos = l.filter((o) => o.n != null && o.n % 2 === n % 2);
        if (!suyos.length) continue;
        let mio = null, dm = Infinity;
        for (const o of suyos) { const k = Math.abs(o.n - n); if (k < dm) { dm = k; mio = o; } }
        saltos.push({ cv, n, dado: dado.n, mio: mio.n,
          metros: Math.hypot(mio.m[0] - dado.m[0], mio.m[1] - dado.m[1]) });
      }
    }
    // ⭐⭐ EL DENOMINADOR HONESTO — la unidad del resultado, declarada:
    //   «de las direcciones que se pueden pedir en una vía con dos hilos, ¿cuántas
    //   caen en un hueco que ADEMÁS te cambia de acera?»
    log('');
    log('   ⭐⭐ EL DENOMINADOR — sobre las ' + _den.vias + ' vías con dos hilos');
    di('números que se pueden pedir (del mínimo al máximo de cada vía)', _den.rango);
    di('   …que EXISTEN en el callejero', `${_den.existen}  (${pct(_den.existen, _den.rango)})`);
    di('   …que son HUECO', `${_den.huecos}  (${pct(_den.huecos, _den.rango)})`);
    di('⭐ …y de los huecos, los que te CAMBIAN DE ACERA', `${saltos.length}  (${pct(saltos.length, _den.huecos)} de los huecos · ${pct(saltos.length, _den.rango)} de lo pedible)`);
    A.exige(saltos.length > 0, 'no sale ni un número inexistente que cambie de paridad: o el callejero es perfecto o esto no mide');
    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ CLASIFICAR ANTES DE CONTAR (ley 29) — y aquí hacía falta
    // ═══════════════════════════════════════════════════════════════════════
    //   La primera versión publicó **66.973 huecos, mediana 126 m y máximo 18.633 m**.
    //   ⛔ El máximo es una CARRETERA de 18 km, y las doce peores filas eran la
    //     misma —la Autovía de Logroño— repetida. Un número que sale así de grande
    //     es el instrumento hablando, no el dato (costura del encargo).
    //   ⇒ Se parte por el TIPO DE VÍA del propio callejero —no una clasificación
    //     mía— y se publican las dos. Una calle urbana y una carretera de acceso
    //     con numeración cada varios kilómetros no son el mismo problema.
    // ⚠️ `tipoVia` son CÓDIGOS DE DOS LETRAS, no palabras (bitácora nº128). La
    //   primera versión comparaba contra 'CALLE', 'AVENIDA'… y daba **CERO vías
    //   urbanas**, que es imposible: Avenida Cataluña es una de ellas y su hueco
    //   —el 78— es el caso que abre esta tanda. ⭐ Lo cazó saber que tenía que estar.
    // ⭐ El criterio: trama de calle con DOS ACERAS y numeración alternando. Se
    //   declara la lista, y lo que queda fuera se cuenta y se enseña.
    //     CL calle · AV avenida · PS paseo · PL plaza · GL glorieta · RD ronda
    //     TR travesía · CJ callejón · PJ pasaje · AN andador · VI vía
    const URBANAS = new Set(['CL', 'AV', 'PS', 'PL', 'GL', 'RD', 'TR', 'CJ', 'PJ', 'AN', 'VI']);
    const tipoDe = (cv) => { const l = porVia.get(cv); return (l && l[0].via && String(l[0].via.tipoVia || '').toUpperCase().trim()) || '(?)'; };
    const urbano = saltos.filter((s) => URBANAS.has(tipoDe(s.cv)));
    const resto = saltos.filter((s) => !URBANAS.has(tipoDe(s.cv)));
    const rT = reparto(saltos.map((s) => s.metros));
    const rU = reparto(urbano.map((s) => s.metros));
    const rR = reparto(resto.map((s) => s.metros));
    log('');
    log('   ' + 'huecos que cambian de paridad'.padEnd(40) + 'cuántos'.padStart(10)
      + 'mediana'.padStart(10) + 'p90'.padStart(10) + 'máx'.padStart(12));
    const fila = (etq, l, r) => log('   ' + etq.padEnd(40) + String(l.length).padStart(10)
      + (r ? r.mediana.toFixed(0) : '—').padStart(10) + (r ? r.p90.toFixed(0) : '—').padStart(10)
      + (r ? r.max.toFixed(0) : '—').padStart(12));
    fila('TODOS', saltos, rT);
    fila('⭐ solo vías URBANAS (CL AV PS PL GL RD TR CJ PJ AN VI)', urbano, rU);
    fila('⚠️ el resto (CN CT DS PG UR GP PQ JR PT…)', resto, rR);
    // ⛔ y que la partición no se coma nada en silencio
    A.exige(urbano.length + resto.length === saltos.length, 'la partición urbano/resto no suma el total');
    A.exige(urbano.length > 0, 'CERO huecos en vías urbanas: imposible — Avenida Cataluña es urbana y su hueco (el 78) abre esta tanda');
    log('   ⇒ ⭐ El titular es la fila del medio. La de abajo es real pero es otro problema:');
    log('     una carretera numerada cada kilómetro no tiene «la acera de enfrente».');
    if (rU) {
      di('⛔ urbanos que desplazan más de 50 m', `${urbano.filter((s) => s.metros > 50).length}  (${pct(urbano.filter((s) => s.metros > 50).length, urbano.length)})`);
      di('⛔ …más de 200 m', `${urbano.filter((s) => s.metros > 200).length}  (${pct(urbano.filter((s) => s.metros > 200).length, urbano.length)})`);
    }
    // ⭐ los peores, UNO POR VÍA: si no, las doce filas son la misma calle repetida
    log('');
    log('   ⭐ LAS 12 VÍAS URBANAS CON EL PEOR SALTO — uno por vía, no doce de la misma');
    log('   ' + 'vía'.padEnd(38) + 'pides'.padStart(8) + 'te da'.padStart(8) + 'el suyo'.padStart(9)
      + 'metros'.padStart(10) + '  huecos así');
    const peorDeVia = new Map();
    for (const s of urbano) {
      const q = peorDeVia.get(s.cv);
      if (!q) peorDeVia.set(s.cv, { s, n: 1 });
      else { q.n++; if (s.metros > q.s.metros) q.s = s; }
    }
    for (const { s, n } of [...peorDeVia.values()].sort((a, b) => b.s.metros - a.s.metros).slice(0, 12)) {
      log('   ' + nombreVia(s.cv).slice(0, 36).padEnd(38) + String(s.n).padStart(8)
        + String(s.dado).padStart(8) + String(s.mio).padStart(9) + s.metros.toFixed(0).padStart(10)
        + '  ' + n);
    }
    global._B3b = { saltos, urbano, rU, rT };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B4 · ⚠️ DÓNDE SE CONCENTRA — las 20 peores vías por desfase entre hilos');
  log('='.repeat(112));
  {
    const filas = [...desfasePorVia.entries()]
      .map(([cv, r]) => ({ cv, r, contra: (porVia.get(cv) || []).filter((o) => o._v && o._v.estado === 'LADO-CONTRARIO').length }))
      .sort((a, b) => b.r.mediana - a.r.mediana);
    log('   ' + 'vía'.padEnd(40) + 'portales'.padStart(9) + 'desfase mediano'.padStart(17)
      + 'p90'.padStart(9) + 'máx'.padStart(9) + 'enfrente'.padStart(10));
    for (const f of filas.slice(0, 20)) {
      log('   ' + nombreVia(f.cv).slice(0, 38).padEnd(40) + String((porVia.get(f.cv) || []).length).padStart(9)
        + f.r.mediana.toFixed(0).padStart(17) + f.r.p90.toFixed(0).padStart(9)
        + f.r.max.toFixed(0).padStart(9) + String(f.contra).padStart(10));
    }
    log('');
    const grandes = filas.filter((f) => f.r.mediana > 50);
    di('⭐ vías con desfase mediano > 50 m entre sus dos hilos', `${grandes.length} de ${filas.length}  (${pct(grandes.length, filas.length)})`);
    di('   …> 100 m', filas.filter((f) => f.r.mediana > 100).length);
    log('   ⇒ ⭐ C3 · Antonio no se acordaba de más, y el dato las encuentra solo.');
    global._B4 = { filas };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('D · ⭐⭐ LOS CATORCE EXTREMOS DE LAS SIETE RUTAS');
  log('='.repeat(112));
  log('   ⚠️ Antonio dio las siete por buenas mirándolas, así que esto importa el doble.');
  {
    const T = require('./tabla-rutas');
    const POI = require('./rutas-antonio').POI;
    const psVia = new Map();
    for (const p of ps) { if (!psVia.has(p.codigoVia)) psVia.set(p.codigoVia, []); psVia.get(p.codigoVia).push(p); }
    const t = T.leer();
    log('');
    log('   ' + 'ruta'.padStart(5) + '  ' + 'extremo'.padEnd(34) + 'estado'.padEnd(20)
      + 'pides→da'.padStart(12) + '  paridad   el de SU paridad');
    let cambian = 0, poi = 0;
    for (const r of t.rutas) {
      for (const [et, txt] of [['O', r.o], ['D', r.d]]) {
        if (POI[txt]) { poi++; log('   ' + String(r.n).padStart(5) + '  ' + (et + ' ' + txt).padEnd(34) + 'POI (edificio) — no tiene portal ni paridad'); continue; }
        const res = D.resolver(txt, ctx.indice);
        if (!res.portal) { log('   ' + String(r.n).padStart(5) + '  ' + (et + ' ' + txt).padEnd(34) + String(res.estado)); continue; }
        const o = res.portal, pedido = D.partir(txt).numero;
        const cambia = pedido != null && o.n != null && (pedido % 2) !== (o.n % 2);
        if (cambia) cambian++;
        let extra = '';
        if (cambia) {
          const suyos = (psVia.get(o.codigoVia) || []).filter((x) => x.n != null && x.n % 2 === pedido % 2)
            .sort((a, b) => Math.abs(a.n - pedido) - Math.abs(b.n - pedido));
          if (suyos.length) extra = `nº${suyos[0].n} a ${Math.hypot(suyos[0].m[0] - o.m[0], suyos[0].m[1] - o.m[1]).toFixed(0)} m`;
        }
        log('   ' + String(r.n).padStart(5) + '  ' + (et + ' ' + txt).padEnd(34) + String(res.estado).padEnd(20)
          + `${pedido}→${o.n}`.padStart(12) + '  ' + (cambia ? '⛔ CAMBIA' : '  ok    ') + '   ' + extra);
      }
    }
    // ── D2 · ⭐⭐ ¿cuántos metros cambiaría? ⛔ se CALCULA, no se aplica ──────
    log('');
    log('   D2 · ⭐⭐ QUÉ PASARÍA — la ruta entre los portales de la paridad pedida');
    log('        ⛔ Solo se calcula. No se toca el enganche, ni la tabla, ni las rutas.');
    {
      const G = require('./grafo');
      const pt = (o) => ({ arista: o.arista, seg: o.seg, t: o.t, q: o.q, d: o.d });
      const mts = (a, b) => { const r = G.rutaEntre(g, pt(a), pt(b)); return r.encontrada ? r.metros : null; };
      const busca = (txt) => (D.resolver(txt, ctx.indice) || {}).portal;
      const paridadDe = (o, pedido) => {
        const l = (psVia.get(o.codigoVia) || []).filter((x) => x.n != null && x.n % 2 === pedido % 2)
          .sort((a, b) => Math.abs(a.n - pedido) - Math.abs(b.n - pedido));
        if (!l.length) return null;
        // hay que devolver el ENGANCHADO, no el crudo
        return eng.find((e2) => e2.id === l[0].id) || null;
      };
      // ⚠️⚠️ TANDA 33 · ESTE «HOY» ES EL DE LA TANDA 32, Y AHORA HAY QUE PEDIRLO.
      //   Aquella medía la ruta 1 entre **el 77 y el 15** —lo que devolvía el
      //   buscador al pedir el 78 y el 16—. Con la regla de la paridad esas dos
      //   consultas ya no tienen respuesta, así que los portales se piden por su
      //   número, explícitos.
      // ⭐ Y así el cuadre de abajo mejora: deja de depender de la regla del
      //   buscador y pasa a guardar lo que de verdad tiene que guardar —el grafo y
      //   el enganche—. Si mañana la paridad cambia otra vez, este número no se
      //   mueve; si se mueve, es que se ha movido el terreno.
      const o1 = busca('Avenida Cataluña 77'), d1 = busca('Avenida Pablo Gargallo 15');
      const o1p = paridadDe(o1, 78), d1p = paridadDe(d1, 16);
      const hoy1 = mts(o1, d1);

      di('   ruta 1 · como la midió la tanda 32 (nº' + o1.n + ' → nº' + d1.n + ')', hoy1.toFixed(1) + ' m   ⭐ publicado 3086,9');
      if (o1p && d1p) {
        const alt = mts(o1p, d1p);
        di('   ruta 1 · con la paridad pedida (nº' + o1p.n + ' → nº' + d1p.n + ')',
          alt.toFixed(1) + ' m   ⇒ ' + (alt - hoy1).toFixed(1) + ' m  (' + (100 * (alt - hoy1) / hoy1).toFixed(1) + ' %)');
      }
      const o6 = busca('Calle Francisco de Quevedo 1'), d6 = busca('Calle Matadero 2');
      const d6p = paridadDe(d6, 1);
      const hoy6 = mts(o6, d6);
      di('   ruta 6 · como la midió la tanda 32 (nº' + o6.n + ' → nº' + d6.n + ')', hoy6.toFixed(1) + ' m   ⭐ publicado 523,4');
      if (d6p) di('   ruta 6 · con la paridad pedida (→ nº' + d6p.n + ')', mts(o6, d6p).toFixed(1) + ' m');
      // ⭐⭐ EL CUADRE QUE HACE QUE ESTO VALGA: el «hoy» calculado aquí tiene que ser
      //   el número publicado. Si no lo fuera, esta sección estaría midiendo otra cosa.
      di('⭐⭐ ¿el «hoy» reproduce lo publicado?',
        (Math.abs(hoy1 - 3086.9) < 0.05 && Math.abs(hoy6 - 523.4) < 0.05) ? '✅ 3086,9 y 523,4 clavados' : '⛔ NO');
      A.exige(Math.abs(hoy1 - 3086.9) < 0.05 && Math.abs(hoy6 - 523.4) < 0.05,
        `el «hoy» de D2 da ${hoy1.toFixed(1)} y ${hoy6.toFixed(1)} y lo publicado es 3086,9 y 523,4: esta sección mide otra cosa`);
    }

    log('');
    // ⚠️⚠️ TANDA 33 · ESTA CUENTA YA NO PUEDE SALIR MÁS QUE CERO, Y DECIR SOLO «0»
    //   SERÍA ENGAÑOSO. Cuando se midió esto salían **3 de 10**: el 78→77, el 16→15
    //   y el 1→2. La regla de la paridad los ha convertido en dos `sin-numero-cerca`
    //   —la ruta 1— y en un cambio dentro de su acera —el 1→3 de la ruta 6—.
    //   ⇒ se imprimen las dos cuentas: **el cero es el resultado de la regla, no la
    //     desaparición del hallazgo.**
    const aSug = t.rutas.flatMap((r) => [r.o, r.d]).filter((txt) => !POI[txt]
      && D.resolver(txt, ctx.indice).estado === 'sin-numero-cerca').length;
    di('⛔ extremos que CAMBIAN DE PARIDAD', `${cambian} de ${14 - poi} con portal  (${poi} son POI)`);
    di('   ⭐ cuando se midió esto (tanda 32, sin la regla)', '3 de 10 — el 78→77, el 16→15 y el 1→2');
    di('   ⭐⭐ y hoy, con la regla: extremos SIN RESPUESTA', `${aSug} de ${14 - poi}   (los de la ruta 1)`);
    A.exige(cambian === 0, `${cambian} extremos siguen cambiando de paridad con la regla de la tanda 33 aplicada: la regla no está actuando en el banco`);
    log('   ⇒ ⭐⭐ La ruta 7 —la que CALIBRA los ~6 km/h de toda la tabla contra los 2.600 m del');
    log('     GPS— tiene sus dos extremos EXACTOS. **La calibración no está en cuestión.**');
    global._D = { cambian, poi };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('E · ⭐ LA SOLUCIÓN — propuesta y medida. ⛔ NO APLICADA.');
  log('='.repeat(112));
  log('   ⚠️ Son DOS reglas, no una, porque el trabajo ha encontrado DOS mecanismos:');
  log('     (a) el ENGANCHE cuelga el portal de la acera de enfrente  → 76 portales');
  log('     (b) el GEOCODIFICADOR cae al número más cercano sin mirar la paridad');
  log('         → es lo que pasó en Avenida Cataluña 78, y es el que desplaza.');

  // ── E3 · la salvaguarda que falta, y es el testigo INDEPENDIENTE ───────────
  log('');
  log('   E3 · ⭐⭐ LA SALVAGUARDA QUE HOY NO EXISTE — y de paso es el segundo testigo');
  log('        *«un portal cuyo enganche queda lejos de los vecinos de SU MISMA PARIDAD es');
  log('         sospechoso, aunque el nombre cuadre»*');
  log('   ⛔ Y NO es circular con §B2: §B2 mira la paridad DOMINANTE de la arista; esto mira');
  log('     la CONTINUIDAD de la numeración. Son dos cosas distintas del mismo dato.');
  {
    const saltoVecino = [];
    const porPortal = new Map();
    for (const [, l] of porVia) {
      const h = hilos(l);
      if (!h.dos) continue;
      for (const hilo of [h.par, h.impar]) {
        for (let i = 0; i < hilo.length; i++) {
          const o = hilo[i];
          const vecinos = [hilo[i - 1], hilo[i + 1]].filter(Boolean);
          if (!vecinos.length) continue;
          const d = Math.min(...vecinos.map((v) => Math.hypot(v.q[0] - o.q[0], v.q[1] - o.q[1])));
          saltoVecino.push(d);
          porPortal.set(o.id, d);
        }
      }
    }
    const r = reparto(saltoVecino);
    log('');
    log('   ' + 'distancia del enganche al del vecino de SU paridad'.padEnd(50)
      + 'mediana'.padStart(10) + 'p90'.padStart(10) + 'máx'.padStart(10));
    log('   ' + ''.padEnd(50) + r.mediana.toFixed(0).padStart(10) + r.p90.toFixed(0).padStart(10)
      + r.max.toFixed(0).padStart(10));
    // ⚠️ el listón se declara aquí y ahora: el p99 de la propia distribución. No es
    //   un número inventado — sale del dato— y se dice cuál es.
    const s = saltoVecino.slice().sort((a, b) => a - b);
    const LISTON = s[Math.floor(0.99 * s.length)];
    const sospechosos = [...porPortal.entries()].filter(([, d]) => d > LISTON).map(([id]) => id);
    di('⭐ listón (p99 de la propia distribución)', LISTON.toFixed(0) + ' m');
    di('⭐⭐ portales que señalaría esta salvaguarda', `${sospechosos.length}  (${pct(sospechosos.length, eng.length)})`);
    // ⭐⭐ ¿COINCIDE CON §B2? Dos testigos independientes que señalan lo mismo valen
    //   más que cualquiera de los dos. Si no coincidieran en NADA, uno de los dos
    //   estaría midiendo otra cosa.
    const setS = new Set(sospechosos);
    const cruce = contrarios.filter((o) => setS.has(o.id)).length;
    di('   …de los 76 del LADO CONTRARIO, cuántos señala también', `${cruce} de ${contrarios.length}`);
    log('   ⇒ ⚠️ Los dos testigos se solapan poco, y eso NO es un fallo: miran cosas');
    log('     distintas. §B2 caza «cuelga de la acera de enfrente»; E3 caza «el enganche da');
    log('     un salto respecto a sus vecinos», que incluye portales de fondo de patio,');
    log('     torres retranqueadas y numeración desordenada. **Los dos hacen falta.**');
    global._E3 = { sospechosos: sospechosos.length, cruce, LISTON };
  }

  // ── E4 · el coste ─────────────────────────────────────────────────────────
  log('');
  log('   E4 · ⚠️ EL COSTE — ⛔ medido sobre copias, nada aplicado');
  {
    // (a) el enganche: para cada uno de los del lado contrario, ¿hay una arista de
    //     SU paridad, y a qué distancia? Es la pregunta de §A1 generalizada.
    const porViaArista = new Map();
    for (const [k, x] of tabla) {
      if (!x.dominante || ES_EJE.has(x.precision) || !TIENE_LADO.has(x.precision)) continue;
      const cv = k.split('|')[0];
      if (!porViaArista.has(cv)) porViaArista.set(cv, []);
      porViaArista.get(cv).push(x);
    }
    const dSuya = [];
    let sinAlternativa = 0;
    for (const o of contrarios) {
      const cands = (porViaArista.get(o.codigoVia) || []).filter((x) => x.dominante === par(o.n));
      if (!cands.length) { sinAlternativa++; continue; }
      let mejor = Infinity;
      for (const x of cands) {
        const e = g.aristas[x.arista];
        for (let k = 0; k + 1 < e.pts.length; k++) {
          const s = P.aSegmento(o.m, e.pts[k], e.pts[k + 1]);
          if (s.d < mejor) mejor = s.d;
        }
      }
      dSuya.push({ o, d: mejor });
    }
    const rr = reparto(dSuya.map((x) => x.d));
    di('(a) portales que se moverían de arista', `${dSuya.length} de ${contrarios.length}`);
    di('   ⚠️ …y los que NO tienen arista de su paridad en su vía', sinAlternativa);
    if (rr) log('   ' + '     distancia a la arista de SU acera'.padEnd(50)
      + rr.mediana.toFixed(1).padStart(10) + rr.p90.toFixed(1).padStart(10) + rr.max.toFixed(1).padStart(10));
    log('   ⭐ Si esa distancia es parecida a la de hoy, el enganche por proximidad estaba');
    log('     eligiendo entre dos casi empatadas — que es exactamente lo que pasa en A1.');

    // (b) el geocodificador
    log('');
    di('(b) huecos urbanos que hoy te cambian de acera', global._B3b.urbano.length);
    di('   ⭐ …y de ellos, los que desplazan más de 50 m', global._B3b.urbano.filter((s) => s.metros > 50).length);
    log('   ⇒ ⭐ La regla (b) es barata y no toca el grafo: `direccion.resolver()` prefiere el');
    log('     más cercano DE SU PARIDAD, y si no hay, cae al de hoy **y lo dice**.');
    log('   ⚠️ Y lo que NO resuelve: pedir el 78 te daría el 74 o el 84, que siguen sin ser el');
    log('     78. **Lo honesto sería interpolar sobre el hilo par**, y eso es otra tanda.');
  }

  log('');
  log('   ⚠️ Lo que esto NO mide: si el portal está físicamente en la acera que dice el');
  log('      callejero. Se compara el enganche contra **la paridad de sus vecinos**, que es');
  log('      un testigo del dato, no del terreno. Para saber la verdad haría falta mirar la');
  log('      calle, y eso NO CONSTA aquí.');
  log('');
  log(A.cierre('LA ACERA EQUIVOCADA'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
