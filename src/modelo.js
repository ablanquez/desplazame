// ⭐⭐ TANDA 19 · C · EL MODELO APLICADO — vía · forma · papel deducido.
//
//   node src/modelo.js
//
// ⛔⛔ NO MUTA EL GRAFO. `aplicar()` LEE `g` y devuelve una tabla nueva; no toca
//     ni un campo de `g.aristas`. Y eso no se promete: se comprueba con un HASH
//     del grafo antes y después (ley 37 — mecanismo, no disciplina).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?»
// ═════════════════════════════════════════════════════════════════════════════
// C3 · «el grafo peatonal no cambia» ⚠️ **PASA POR CONSTRUCCIÓN**: si este módulo
//      no muta nada, el hash sale igual haga lo que haga el resto. ⇒ se dice, y
//      el hash se queda porque su valor es FUTURO: el día que alguien añada un
//      `e.forma = …` dentro de un bucle, esto lo caza. Para que el hash pruebe
//      algo HOY, se le enseña su rojo: se muta una arista a propósito en una
//      copia y se comprueba que el hash cambia.
//
// INV · el invariante `plataforma` ↔ `precision` NO se espera en cero, y está
//      predicho en `src/forma.js` ANTES de ejecutarlo: choques en `living_street`
//      y en `steps`+`crossing`, **y en ninguna otra familia**. Si sale una
//      tercera, es un hallazgo. Si salen cero, es que copié el orden de
//      `precision()` sin darme cuenta y el invariante no vale nada.
//
// A5 · el álgebra aprobada decía 6.075 aristas con `ciclista`. ⚠️ Ese número
//      salía de la regla INGENUA de la tanda 18 —«la candidata más cercana
//      siempre»—, que es justo lo que B se ha negado a hacer. Con tres
//      resultados (asignada · ambigua · no asignada) el número tiene que BAJAR.
//      **La desviación es un hallazgo, no un ajuste**, y va con su explicación.

'use strict';
const crypto = require('crypto');
const P = require('./portales');
const F = require('./forma');
const A = require('./alarma');
const osm = require('./osm');
const AB = require('./asignar-bici');
const H = require('./heredar-nombre');
const NL = require('./nombre-largo');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

/** Huella del grafo: si alguien lo muta, esto cambia. */
function hashGrafo(g) {
  const h = crypto.createHash('sha256');
  for (const e of g.aristas) {
    h.update(`${e.a}|${e.b}|${e.largo.toFixed(6)}|${e.way}|${e.highway}|${e.precision}|`
      + `${e.pie ? 1 : 0}|${e.condicional ? 1 : 0}|${e.unidoPorDefecto ? 1 : 0}|${e.pts.length}\n`);
  }
  return h.digest('hex');
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ TANDA 21 · A · EL MÉTODO DE LOS PORTALES, APLICADO — se acabó la prueba
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Tenemos una línea que no tiene nombre de vía, pero por proximidad tiene
//   >  varios portales con nombre de vía. ¿Conclusión? Tenemos un nombre de vía
//   >  para esa línea.»* — Antonio
//
//   Medido en las tandas 17 y 20 antes de aplicarlo: acierta el 76,7 % por arista
//   y el 80,9 % por way —**89,7 % y 92,3 % contando el nombre largo** (tanda 21
//   §B)— contra un azar del 18,5 %, y cubriría **8.289 de las 11.742 puertas** que
//   hoy cuelgan de líneas sin nombre.
//
//   ⛔ **LA UNIDAD ES EL WAY**, y no es una elección de hoy: la tanda 17 §B3b midió
//     que multiplica la cobertura por 2,4 y sube el acierto 4 puntos, con el mismo
//     patrón de verdad y los mismos umbrales.
//   ⛔ **AMBIGUA SIGUE SIENDO UN RESULTADO.** Si los portales no se ponen de
//     acuerdo (2/3), el way NO se nombra. Elegir a ciegas es inventar.
//   ⛔ **Y VA MARCADO**: `declarada: false`. El texto tiene que poder decir que ese
//     nombre no lo declara nadie, lo deducimos nosotros.
//
//   ⚠️ EL PASO QUE CASI SE CUELA (bitácora nº101): `heredar-nombre.js` devuelve un
//     **NÚCLEO NORMALIZADO** (`torre sierras`), no un nombre. Aquí se recupera el
//     nombre real **del portal que votó**, no de un índice por núcleo: dos vías
//     pueden compartir núcleo y ser dos calles (ley 41).

/**
 * ⭐ B dentro de A: dos vías cuyo núcleo es recorte de la otra son la misma calle,
 * así que sus votos NO deben partirse. Devuelve Map<nucleo, canónico>.
 * ⚠️ Si un corto cabe en DOS largos distintos, se deja como está (B2).
 */
function canonizar(nucleos) {
  const set = [...new Set(nucleos.filter((x) => x))];
  const m = new Map();
  for (const n of set) {
    const cand = set.filter((k) => k !== n && NL.recorteDe(n, k));
    m.set(n, cand.length === 1 ? cand[0] : n);
  }
  return m;
}

/**
 * ⭐ El método de los portales, por WAY. ⛔ No muta nada.
 * @returns {Map<way, {estado, nucleo, nombre, codigoVia, apoyo, votos}>}
 */
function deducirPorWay(g, portales, op = {}) {
  const grupos = new Map();
  for (const o of portales) {
    if (o.arista == null) continue;
    const w = g.aristas[o.arista].way;
    if (!grupos.has(w)) grupos.set(w, []);
    grupos.get(w).push(o);
  }
  const out = new Map();
  for (const [w, lista] of grupos) {
    const canon = op.sinNombreLargo ? null : canonizar(lista.map((o) => (o.via && o.via.nucleo) || null));
    const nucleoDe = canon
      ? (p) => (p.nucleoMunicipal ? (canon.get(p.nucleoMunicipal) || p.nucleoMunicipal) : null)
      : undefined;
    const d = H.decidir(lista.map(H.proyectar), nucleoDe);
    if (d.estado !== 'NOMBRADA') { out.set(w, { estado: d.estado, votos: d.votos }); continue; }
    // ── A4 · del NÚCLEO al NOMBRE REAL, y del portal que votó ────────────────
    // ⭐ «si es título grande, se deja el grande»: entre los que votaron, se coge
    //    el nombre con más palabras — que es el largo del que habla Antonio.
    const votantes = lista.filter((o) => {
      const n = (o.via && o.via.nucleo) || null;
      if (!n) return false;
      return (canon ? (canon.get(n) || n) : n) === d.nombre;
    });
    let mejor = null;
    for (const o of votantes) {
      if (!o.via || !o.via.nombre) continue;
      if (!mejor || NL.palabras(o.via.nucleo).length > NL.palabras(mejor.via.nucleo).length) mejor = o;
    }
    if (!mejor) { out.set(w, { estado: 'SIN-NOMBRE-MUNICIPAL', votos: d.votos, nucleo: d.nombre }); continue; }
    out.set(w, { estado: 'NOMBRADA', nucleo: d.nombre, nombre: mejor.via.nombre,
      codigoVia: String(mejor.codigoVia), apoyo: d.apoyo, votos: d.votos });
  }
  return out;
}

/**
 * ⭐ El modelo. Devuelve un array paralelo a `g.aristas`. ⛔ No muta `g`.
 * @param {Map} [deducidas] salida de `deducirPorWay` — la tercera fuente (tanda 21)
 * @returns {Array<{via, forma, papel}>}
 */
function aplicar(g, tags, tabla, vias, deducidas) {
  const out = new Array(g.aristas.length);
  for (let i = 0; i < g.aristas.length; i++) {
    const e = g.aristas[i];
    const t = tags.get(e.way) || {};
    const asig = tabla.get(i) || null;

    const plataforma = F.plataforma(t);
    // ⛔ ni `en-obras` ni `no-municipal` describen infraestructura en servicio:
    //    se guardan como lo que son, no se convierten en carril.
    const ciclista = asig ? asig.cic : null;
    const forma = { plataforma, ciclista,
      ciclistaFuente: asig ? 'municipal:MU2_carriles_bici' : null,
      ciclistaEstado: asig ? asig.estado : null,
      ciclistaTipo: asig ? asig.tipo : null,
      ciclistaApoyo: asig ? Math.round(asig.metrosTotal) : null };

    // ── LA VÍA, por orden de fiabilidad (§A2) ──────────────────────────────
    const nombreOsm = g.nombres.get(e.way) || null;
    let via = null;
    if (nombreOsm) {
      // ⭐ D0: manda OSM. El municipal VERIFICA, no decide — así que su código
      //    viaja al lado, pero el nombre no se toca.
      via = { nombre: nombreOsm, codigoVia: asig ? asig.cod : null,
        fuente: 'osm', declarada: true };
    } else if (asig && asig.cod && asig.codsDistintos === 1) {
      const v = vias.get(String(asig.cod));
      if (v) via = { nombre: v.nombre, codigoVia: String(asig.cod), fuente: 'municipal-bici', declarada: true };
    }
    // ── ⭐⭐ TANDA 21 · LA TERCERA FUENTE, YA APLICADA ────────────────────────
    // ⛔ Va la ÚLTIMA a propósito: solo habla donde no hay nada declarado. Y va
    //    marcada `declarada: false`, que es lo que permite al texto decirlo.
    if (!via && deducidas) {
      const d = deducidas.get(e.way);
      if (d && d.estado === 'NOMBRADA') {
        via = { nombre: d.nombre, codigoVia: d.codigoVia, fuente: 'portales',
          declarada: false, apoyo: d.apoyo, votos: d.votos };
      }
    }

    out[i] = { via, forma,
      papel: { pie: F.papel(forma, 'pie'), bici: F.papel(forma, 'bici') },
      coherente: F.coherente(plataforma, e.precision) };
  }
  return out;
}

/** Los dos papeles reales: se anda Y se circula. Es el caso que motivó la tanda. */
const dosPapeles = (m) => !/^⛔|^NO CONSTA/.test(m.papel.bici.rol) && !/^⛔/.test(m.papel.pie.rol);

// ═════════════════════════════════════════════════════════════════════════════
// ⭐ EL MODELO ES POR ARISTA; EL RELATO PREGUNTA POR WAY
// ═════════════════════════════════════════════════════════════════════════════
//   `Rel.tramos()` corta por `way` de OSM, así que para el texto hay que resolver
//   cada way a una vía. ⚠️ Y un way puede recorrer DOS vías: el 475881583 de la
//   ruta 7 lleva 794 m de Avenida de San Juan de la Peña y 15 m de Calle Valle de
//   Broto.
//
//   ⚠️⚠️ MI PRIMERA REGLA AQUÍ FUE «solo si todas las aristas coinciden», y era
//   mala: **15 metros tumbaban 794**, y dejaban sin nombre justo el tramo mejor
//   documentado del proyecto. Se cambia, y se declara el cambio (§4 del método).
//
//   ⭐ EL LISTÓN NO ME LO INVENTO: **2/3 de los metros con vía**, que es el mismo
//     acuerdo que `src/heredar-nombre.js` fijó en la tanda 17 para la pregunta
//     idéntica —*¿cuándo un conjunto de votos nombra una línea?*—. Un umbral
//     heredado de otra pregunta no está elegido para que salga bien ésta (ley 17).
//   ⛔ Y si no llega a 2/3, el way NO se nombra. Elegir sería inventar.
const ACUERDO_WAY = 2 / 3;

function resolverPorWay(g, M) {
  const porWay = new Map();
  for (let i = 0; i < g.aristas.length; i++) {
    const w = g.aristas[i].way;
    if (!porWay.has(w)) porWay.set(w, []);
    porWay.get(w).push(i);
  }
  const out = new Map();
  for (const [w, idxs] of porWay) {
    const conVia = idxs.filter((i) => M[i].via);
    if (!conVia.length) { out.set(w, null); continue; }
    const metros = new Map();
    for (const i of conVia) {
      const k = M[i].via.codigoVia || M[i].via.nombre;
      if (!metros.has(k)) metros.set(k, { m: 0, i });
      const v = metros.get(k);
      v.m += g.aristas[i].largo;
      if (g.aristas[i].largo > g.aristas[v.i].largo) v.i = i;
    }
    const orden = [...metros.values()].sort((a, b) => b.m - a.m);
    const total = orden.reduce((s, x) => s + x.m, 0);
    if (orden[0].m / total < ACUERDO_WAY) { out.set(w, null); continue; }
    out.set(w, { via: M[orden[0].i].via, forma: M[orden[0].i].forma,
      apoyo: orden[0].m / total, metros: orden[0].m });
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ FUENTE ÚNICA — el modelo entero se monta EN UN SITIO
// ═════════════════════════════════════════════════════════════════════════════
//   Lo usan `ruta.js` (una ruta en la terminal), `rutas-antonio.js` (las siete),
//   `modelo-rutas.js` (el guardián) y los informes. ⛔ Si cada uno lo montara por
//   su cuenta, divergirían — que es el fallo nº68 con otro traje.
//   ⚠️ Cuesta: relee el crudo de OSM y monta la asignación municipal. Una vez por
//      proceso, y los portales se le pasan YA enganchados.
function construirModelo(g, portales, op = {}) {
  const tags = new Map();
  for (const w of osm.recortar(osm.cargar(CRUDO).ways, g.zona)) tags.set(w.id, w.tags || {});
  const vias = P.cargarVias();
  const asig = AB.asignar(g, AB.cargarCapa().lineas, (w) => F.plataforma(tags.get(w)),
    { idx: AB.indexar(g.aristas) });
  const deducidas = op.sinPortales ? null : deducirPorWay(g, portales, op);
  const M = aplicar(g, tags, asig.tabla, vias, deducidas);
  const deWay = resolverPorWay(g, M);
  return { M, deWay, deducidas, tags, vias, asig, modeloDeWay: (w) => deWay.get(w) || null };
}

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const T0 = Date.now();

  const D = require('./direccion');
  const g = construir(ZONA_TERMINO);
  const hAntes = hashGrafo(g);
  // ⭐ TANDA 21 · los portales entran en el modelo: son la tercera fuente de nombre
  const ctx = D.abrir(g, CRUDO);
  const portalesEng = ctx.enganche.portales.filter((o) => o.enganchado);
  const mod = construirModelo(g, portalesEng);
  const { M, tags, vias, asig, deducidas } = mod;
  const capa = AB.cargarCapa();
  const idx = AB.indexar(g.aristas);
  const platDe = (w) => F.plataforma(tags.get(w));
  const hDespues = hashGrafo(g);

  log('='.repeat(110));
  log('C · EL MODELO APLICADO A LAS ' + g.aristas.length + ' ARISTAS');
  log('='.repeat(110));

  // ── C3 primero: si el grafo cambia, nada de lo demás importa ──────────────
  log('');
  log('C3 · ⭐⭐ LA COMPROBACIÓN QUE MANDA — ¿cambia algo del grafo peatonal?');
  di('nodos · aristas · componentes · a pie',
    `${g.contadores.nodos} · ${g.contadores.aristas} · ${g.comp.n} · ${g.aristasAPie}`);
  di('hash del grafo ANTES de aplicar el modelo', hAntes.slice(0, 32));
  di('hash del grafo DESPUÉS', hDespues.slice(0, 32) + (hAntes === hDespues ? '   ✅ idéntico' : '   ⛔ EL MODELO HA MUTADO EL GRAFO'));
  A.exige(hAntes === hDespues, 'el modelo ha mutado el grafo: las siete rutas ya no son comparables');
  log('');
  log('   ⚠️ ESO PASA POR CONSTRUCCIÓN y hay que decirlo: `aplicar()` no escribe en `g`, así');
  log('      que el hash saldría igual hiciera lo que hiciera. Su valor es FUTURO — el día que');
  log('      alguien meta un `e.forma = …` en un bucle, esto lo caza.');
  log('   ⭐ Para que pruebe algo HOY, se le enseña su rojo: se muta una arista a propósito.');
  {
    const copia = { aristas: g.aristas.map((e) => ({ ...e })) };
    copia.aristas[0].largo += 0.001;
    const hMutado = hashGrafo(copia);
    di('   ⭐ hash de un grafo con UNA arista movida 1 mm', hMutado.slice(0, 32)
      + (hMutado !== hAntes ? '   ✅ el hash lo caza' : '   ⛔ EL HASH NO SIRVE'));
    A.exige(hMutado !== hAntes, 'el hash no distingue un grafo mutado: no vale como guardián');
  }

  // ── el invariante plataforma ↔ precision ──────────────────────────────────
  log('');
  log('INV · ⭐⭐ EL INVARIANTE `plataforma` ↔ `precision`');
  log('   ⛔ NO espero cero. Está predicho en `src/forma.js` ANTES de ejecutar: choques en');
  log('      `living_street` y en `steps`+`crossing`, y EN NINGUNA OTRA FAMILIA.');
  log('      Cero choques significaría que copié el orden de `precision()` y el invariante');
  log('      no valdría nada (ley 35).');
  {
    const choques = [];
    for (let i = 0; i < M.length; i++) if (!M[i].coherente) choques.push(i);
    di('aristas con choque', `${choques.length}  (${pct(choques.length, M.length)})`);
    const fam = new Map();
    for (const i of choques) {
      const t = tags.get(g.aristas[i].way) || {};
      const k = `${M[i].forma.plataforma} ⇄ ${g.aristas[i].precision}   (highway=${t.highway}`
        + (t.footway ? ' footway=' + t.footway : '') + ')';
      if (!fam.has(k)) fam.set(k, { n: 0, m: 0 });
      const v = fam.get(k); v.n++; v.m += g.aristas[i].largo;
    }
    log('');
    log('   ' + 'familia del choque'.padEnd(66) + 'aristas'.padStart(9) + 'metros'.padStart(12));
    for (const [k, v] of [...fam.entries()].sort((a, b) => b[1].n - a[1].n)) {
      log('   ' + k.padEnd(66) + String(v.n).padStart(9) + km(v.m).padStart(12));
    }
    const esperadas = [...fam.keys()].filter((k) => /living_street/.test(k) || /highway=steps/.test(k));
    const inesperadas = [...fam.keys()].filter((k) => !esperadas.includes(k));
    log('');
    di('familias PREDICHAS que aparecen', esperadas.length);
    di('⚠️ familias NO predichas', inesperadas.length + (inesperadas.length ? '  ⛔ HALLAZGO — hay que mirarlas' : '  ✅ ninguna'));
    for (const k of inesperadas) log('      ⛔ ' + k);
    A.exige(choques.length > 0, 'el invariante da CERO choques: `plataforma` ha acabado copiando el orden de `precision()` y no prueba nada');
    A.exige(inesperadas.length === 0, `el invariante saca ${inesperadas.length} familia(s) de choque que NO estaban predichas`);
    global._INV = { choques: choques.length, fam };
  }

  // ── los dos casos borde que pidió Antonio ─────────────────────────────────
  log('');
  log('BORDE · ⭐ los dos sitios donde una derivación mal hecha rompería el texto');
  {
    const cw = [];
    for (let i = 0; i < g.aristas.length; i++) if (g.aristas[i].highway === 'cycleway') cw.push(i);
    const cw4 = cw.filter((i) => g.aristas[i].precision === 'eje-con-acera-declarada');
    di('aristas `highway=cycleway`', cw.length);
    di('   …con precisión `eje-con-acera-declarada` (las 4 del borde)', cw4.length);
    const todasPlat = new Set(cw.map((i) => M[i].forma.plataforma));
    di('   plataforma que les da el modelo', [...todasPlat].join(' · '));
    di('   ⭐ ¿las 4 siguen siendo coherentes?', cw4.every((i) => M[i].coherente) ? '✅ sí — `carril-bici` admite las dos precisiones' : '⛔ NO');
    A.exige(cw4.every((i) => M[i].coherente), 'las 4 cycleway con acera declarada chocan: la tabla ADMISIBLE está mal');

    const sw = [];
    for (let i = 0; i < g.aristas.length; i++) if ((tags.get(g.aristas[i].way) || {}).footway === 'sidewalk') sw.push(i);
    di('aristas `footway=sidewalk`', sw.length);
    di('   …con plataforma `acera`', `${sw.filter((i) => M[i].forma.plataforma === 'acera').length}  (esperado: todas)`);
    di('   …con precisión `acera`', `${sw.filter((i) => g.aristas[i].precision === 'acera').length}  (esperado: todas)`);
    // ⭐ LO QUE DE VERDAD PROTEGE EL TEXTO es la precisión, porque es la que se
    //    imprime. Va como comprobación aparte y en positivo.
    A.exige(sw.every((i) => g.aristas[i].precision === 'acera'),
      'alguna `footway=sidewalk` ha dejado de tener precisión `acera`: el texto se movería');
    // ⚠️ Y ésta es la MÍA, la que se pone en rojo: mi lectura física discrepa en 1.
    A.exige(sw.every((i) => M[i].forma.plataforma === 'acera'),
      'alguna `footway=sidewalk` no es `acera` para mi lectura física (mira la familia de choque)');
    for (const i of sw) {
      if (M[i].forma.plataforma === 'acera') continue;
      const t = tags.get(g.aristas[i].way) || {};
      log('      ⛔ la excepción: way ' + g.aristas[i].way + ' · '
        + Object.entries(t).map(([k, v]) => k + '=' + v).join(' · '));
    }
  }

  // ── C2 · los contadores, contra el álgebra de A5 ──────────────────────────
  log('');
  log('C2 · ⭐ LOS CONTADORES, CONTRA EL ÁLGEBRA DE A5');
  log('');
  log('   reparto de PLATAFORMA');
  log('   ' + 'plataforma'.padEnd(26) + 'aristas'.padStart(9) + 'metros'.padStart(12) + '%'.padStart(9));
  {
    const c = new Map();
    for (let i = 0; i < M.length; i++) {
      const k = M[i].forma.plataforma;
      if (!c.has(k)) c.set(k, { n: 0, m: 0 });
      const v = c.get(k); v.n++; v.m += g.aristas[i].largo;
    }
    const tot = [...c.values()].reduce((s, v) => s + v.m, 0);
    for (const [k, v] of [...c.entries()].sort((a, b) => b[1].n - a[1].n)) {
      log('   ' + k.padEnd(26) + String(v.n).padStart(9) + km(v.m).padStart(12) + pct(v.m, tot).padStart(9));
    }
    di('⭐ suma', `${[...c.values()].reduce((s, v) => s + v.n, 0)} de ${M.length}  · sin cajón «otros»`);
    A.exige([...c.keys()].every((k) => F.PLATAFORMAS.includes(k)), 'ha salido una plataforma fuera de la lista declarada');
  }
  log('');
  log('   reparto de CICLISTA');
  log('   ' + 'ciclista'.padEnd(26) + 'aristas'.padStart(9) + 'metros'.padStart(12) + 'apoyo mediano'.padStart(16));
  {
    const c = new Map();
    for (let i = 0; i < M.length; i++) {
      const k = M[i].forma.ciclista || '(ninguno)';
      if (!c.has(k)) c.set(k, { n: 0, m: 0, ap: [] });
      const v = c.get(k); v.n++; v.m += g.aristas[i].largo;
      if (M[i].forma.ciclistaApoyo != null) v.ap.push(M[i].forma.ciclistaApoyo);
    }
    for (const [k, v] of [...c.entries()].sort((a, b) => b[1].n - a[1].n)) {
      v.ap.sort((a, b) => a - b);
      log('   ' + k.padEnd(26) + String(v.n).padStart(9) + km(v.m).padStart(12)
        + (v.ap.length ? v.ap[Math.floor(v.ap.length / 2)] + ' m' : '—').padStart(16));
    }
    const con = M.filter((m) => m.forma.ciclista).length;
    log('');
    di('⭐ aristas con `ciclista`', `${con}   ⚠️ el álgebra de A5 decía 6.075`);
    log('   ⚠️⚠️ DESVIACIÓN, y es un HALLAZGO, no un ajuste: los 6.075 de A5 salían de la regla');
    log('      INGENUA de la tanda 18 —«la candidata más cercana, siempre»—, que es exactamente');
    log('      lo que B se ha negado a hacer. Con tres resultados, el 34,5 % de los metros');
    log('      municipales queda AMBIGUO y no se asigna. ⇒ el número tenía que bajar.');
    log('   ⚠️ Y el «apoyo mediano» está ahí por lo que salió en B4a: una arista con 3 m de');
    log('      carril encima cuenta lo mismo que una con 130 m en el contador de aristas, y la');
    log('      capa desplazada 2 km producía 1.930 aristas de migajas. **Los metros mandan.**');
  }
  log('');
  log('   ⭐⭐ EL CASO QUE MOTIVÓ LA TANDA: aristas con DOS PAPELES');
  log('   ⚠️ Y CLASIFICADO ANTES DE CONTAR, porque «dos papeles» a secas engorda: un paso de');
  log('      peatones se cruza andando y en bici, y eso ya pasaba antes de esta tanda. Lo nuevo');
  log('      es el papel en bici que trae el DATO MUNICIPAL sobre una línea de andar.');
  {
    const dos = [];
    for (let i = 0; i < M.length; i++) if (dosPapeles(M[i])) dos.push(i);
    const mm = (l) => km(l.reduce((s, i) => s + g.aristas[i].largo, 0));
    const porPlataforma = dos.filter((i) => !M[i].forma.ciclista);
    const porMunicipal = dos.filter((i) => M[i].forma.ciclista);
    di('aristas con papel a pie Y papel en bici', `${dos.length}  (${mm(dos)})`);
    di('   …el papel en bici sale de la PLATAFORMA (pasos, cycleway sueltos)', `${porPlataforma.length}  (${mm(porPlataforma)})   — ya pasaba antes`);
    di('   ⭐ …el papel en bici lo trae el DATO MUNICIPAL', `${porMunicipal.length}  (${mm(porMunicipal)})   — es lo nuevo`);
    log('');
    log('   ' + 'plataforma + ciclista (solo las del dato municipal)'.padEnd(50) + 'aristas'.padStart(8) + 'metros'.padStart(12));
    const c = new Map();
    for (const i of porMunicipal) {
      const k = M[i].forma.plataforma + ' + ' + M[i].forma.ciclista;
      if (!c.has(k)) c.set(k, { n: 0, m: 0 });
      const v = c.get(k); v.n++; v.m += g.aristas[i].largo;
    }
    for (const [k, v] of [...c.entries()].sort((a, b) => b[1].n - a[1].n)) {
      log('   ' + k.padEnd(50) + String(v.n).padStart(8) + km(v.m).padStart(12));
    }
    // ⭐ EL CASO LITERAL DE ANTONIO, en sus dos formas de aparecer
    const seAnda = new Set(['acera', 'plataforma-peatonal', 'camino', 'pista', 'calzada', 'vial-de-servicio']);
    const aceraBici = porMunicipal.filter((i) => M[i].forma.plataforma === 'acera' || M[i].forma.plataforma === 'plataforma-peatonal');
    const cwSobreAcera = porMunicipal.filter((i) => M[i].forma.plataforma === 'carril-bici' && M[i].forma.ciclista === 'carril-sobre-acera');
    log('');
    log('   ⭐⭐ «UNA ACERA QUE COMPARTE CARRIL BICI» — aparece de DOS maneras, y la segunda es');
    log('      la gorda. Depende de si OSM dibujó la acera o dibujó el carril:');
    di('   (a) OSM dibujó la ACERA y el municipal le pone carril encima', `${aceraBici.length}  (${mm(aceraBici)})`);
    di('   (b) OSM dibujó el CARRIL y el municipal dice que va SOBRE LA ACERA', `${cwSobreAcera.length}  (${mm(cwSobreAcera)})`);
    log('      ⇒ en (b) el motor ya mandaba ahí al peatón —`cycleway` está en la lista positiva');
    log('        «compartidas»— pero NADIE sabía por qué. Ahora el dato lo dice: va sobre la acera.');
    global._DOS = { dos: dos.length, porMunicipal: porMunicipal.length, aceraBici: aceraBici.length, cwSobreAcera: cwSobreAcera.length };
  }
  log('');
  log('   ⭐ LA VÍA — cuántas aristas la tienen, y de dónde viene');
  {
    const c = new Map();
    for (let i = 0; i < M.length; i++) {
      const k = M[i].via ? M[i].via.fuente : '(sin vía)';
      if (!c.has(k)) c.set(k, { n: 0, m: 0 });
      const v = c.get(k); v.n++; v.m += g.aristas[i].largo;
    }
    log('   ' + 'fuente del nombre'.padEnd(26) + 'aristas'.padStart(9) + 'metros'.padStart(12) + '%'.padStart(9));
    for (const [k, v] of [...c.entries()].sort((a, b) => b[1].n - a[1].n)) {
      log('   ' + k.padEnd(26) + String(v.n).padStart(9) + km(v.m).padStart(12) + pct(v.n, M.length).padStart(9));
    }
    const gana = c.get('municipal-bici') || { n: 0 };
    const port = c.get('portales') || { n: 0, m: 0 };
    log('');
    log('   ⭐⭐ TANDA 21 · LA TERCERA FUENTE, YA APLICADA — el método de los portales');
    di('   aristas que ganan vía DEDUCIDA de los portales', `${port.n}  (${km(port.m)})   ⛔ marcadas `
      + '`declarada: false`');
    {
      const est = new Map();
      for (const d of deducidas.values()) est.set(d.estado, (est.get(d.estado) || 0) + 1);
      log('   ' + 'resultado del método, por WAY'.padEnd(34) + 'ways'.padStart(10));
      for (const [k, v] of [...est.entries()].sort((a, b) => b[1] - a[1])) {
        log('   ' + String(k).padEnd(34) + String(v).padStart(10));
      }
      log('   ⚠️ AMBIGUA es un RESULTADO, no un problema: una acera de esquina tiene portales de');
      log('      dos calles y no es de ninguna en exclusiva. Ahí NO se nombra.');
      // ⭐ cuánto aporta B (el nombre largo) DENTRO de A
      const sinB = deducirPorWay(g, portalesEng, { sinNombreLargo: true });
      let nB = 0;
      for (const [w, d] of deducidas) {
        if (d.estado !== 'NOMBRADA') continue;
        const s = sinB.get(w);
        if (!s || s.estado !== 'NOMBRADA') nB++;
      }
      di('   ⭐ ways que SOLO se nombran gracias al nombre largo (§B)', nB);
      global._PORT = { n: port.n, m: port.m, est, nB };
    }
    log('');
    di('⭐ aristas que GANAN vía (no tenían nombre en OSM)', `${gana.n}   ⚠️ el álgebra de A5 decía 2.632`);
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐⭐ EL TERMÓMETRO INDEPENDIENTE DE LA ASIGNACIÓN
    // ═══════════════════════════════════════════════════════════════════════
    // Donde OSM SÍ tiene nombre, la asignación no lo necesita — pero le pega un
    // `vias_codigo` igual. ⇒ **¿coinciden?** Es un patrón de verdad que la regla
    // NO puede ver: el nombre de OSM no entra en la decisión (§B1-B2 solo miran
    // distancia, rumbo y plataforma). Y no lo elijo yo (ley 17).
    log('');
    log('   ⭐⭐⭐ ¿ACIERTA LA ASIGNACIÓN? — el termómetro que la regla no puede ver');
    log('      Donde OSM tiene nombre, la asignación le pega un `vias_codigo` igual. La regla');
    log('      NO mira el nombre de OSM: solo distancia, rumbo y plataforma. ⇒ que coincidan');
    log('      o no es un patrón de verdad independiente.');
    const porEstado = new Map();
    const ejemplos = [];
    for (let i = 0; i < M.length; i++) {
      const m = M[i];
      if (!m.via || m.via.fuente !== 'osm' || !m.via.codigoVia) continue;
      const v = vias.get(String(m.via.codigoVia));
      if (!v) continue;
      const est = m.forma.ciclistaEstado || '(?)';
      if (!porEstado.has(est)) porEstado.set(est, { n: 0, ok: 0 });
      const x = porEstado.get(est); x.n++;
      if (P.nucleo(v.nombre) === P.nucleo(m.via.nombre)) x.ok++;
      else if (ejemplos.length < 6) ejemplos.push([m.via.codigoVia, v.nombre, m.via.nombre, est]);
    }
    log('');
    log('      ' + 'cómo se asignó'.padEnd(30) + 'aristas'.padStart(10) + 'coincide con OSM'.padStart(20));
    let cT = 0, oT = 0;
    for (const k of ['univoca', 'tipo', 'margen', '(?)']) {
      const v = porEstado.get(k);
      if (!v) continue;
      cT += v.n; oT += v.ok;
      log('      ' + k.padEnd(30) + String(v.n).padStart(10) + `${v.ok} (${pct(v.ok, v.n)})`.padStart(20));
    }
    log('      ' + '─'.repeat(60));
    log('      ' + '⭐ TOTAL'.padEnd(31) + String(cT).padStart(10) + `${oT} (${pct(oT, cT)})`.padStart(20));
    log('');
    log('      ⇒ ⚠️ ESE NÚMERO NO ES «EL ACIERTO DE LA ASIGNACIÓN» A SECAS, y hay que decirlo:');
    log('        parte de las discordancias son el callejero y OSM llamando distinto a la misma');
    log('        calle (la tanda 17 midió que eso era el 56,8 % de sus «fallos»). Es una COTA');
    log('        INFERIOR del acierto, no una estimación.');
    log('      ⛔ Y las que no coinciden NO se corrigen: manda OSM (D0).');
    for (const [c2, a, b, e] of ejemplos) {
      log('         ⚠️ ' + String(c2).padEnd(8) + e.padEnd(10) + 'municipal: ' + String(a).slice(0, 34).padEnd(36) + 'OSM: ' + b);
    }
    global._VIA = { gana: gana.n, comparables: cT, concuerda: oT, porEstado };

    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ POST-HOC Y NO APLICADO — pero el número hay que ponerlo delante
    // ═══════════════════════════════════════════════════════════════════════
    // `univoca` acierta MENOS que `tipo` y `margen`. Eso apunta al mismo sitio que
    // la contraprueba de desplazamiento de B4a: **el paso 1 de la regla asigna sin
    // comprobar la compatibilidad**. Dos medidas independientes, el mismo agujero.
    // ⛔ La regla NO se cambia aquí. Se mide la alternativa y decide Antonio.
    log('');
    log('   ⚠️⚠️ `univoca` ACIERTA MENOS QUE LAS OTRAS DOS, y eso apunta al mismo sitio que la');
    log('      contraprueba de desplazamiento: **el paso 1 de la regla asigna sin comprobar la');
    log('      compatibilidad**. Dos medidas independientes señalando el mismo agujero.');
    log('   ⛔ La regla no se cambia aquí. Se MIDE la alternativa (post-hoc, no aplicada):');
    {
      const asigE = AB.asignar(g, capa.lineas, platDe, { idx, estricto: true });
      const ME = aplicar(g, tags, asigE.tabla, vias);
      const pe = new Map();
      for (let i = 0; i < ME.length; i++) {
        const m = ME[i];
        if (!m.via || m.via.fuente !== 'osm' || !m.via.codigoVia) continue;
        const v = vias.get(String(m.via.codigoVia));
        if (!v) continue;
        const est = m.forma.ciclistaEstado || '(?)';
        if (!pe.has(est)) pe.set(est, { n: 0, ok: 0 });
        const x = pe.get(est); x.n++;
        if (P.nucleo(v.nombre) === P.nucleo(m.via.nombre)) x.ok++;
      }
      let n2 = 0, o2 = 0;
      for (const v of pe.values()) { n2 += v.n; o2 += v.ok; }
      const gana2 = ME.filter((m) => m.via && m.via.fuente === 'municipal-bici').length;
      log('');
      log('      ' + 'regla'.padEnd(32) + 'aristas con ciclista'.padStart(22) + 'ganan vía'.padStart(12)
        + 'coincide con OSM'.padStart(20));
      log('      ' + 'DECLARADA (la que se aplica)'.padEnd(32) + String(asig.tabla.size).padStart(22)
        + String(gana.n).padStart(12) + `${oT} de ${cT} (${pct(oT, cT)})`.padStart(20));
      log('      ' + '⭐ estricta (NO se aplica)'.padEnd(33) + String(asigE.tabla.size).padStart(22)
        + String(gana2).padStart(12) + `${o2} de ${n2} (${pct(o2, n2)})`.padStart(20));
      log('      ⇒ decide Antonio. Aquí solo está medido, y con las dos contrapruebas al lado.');
      global._ALT2 = { n: asigE.tabla.size, gana: gana2, ok: o2, tot: n2 };
    }
  }

  // ── B6 · las aceras con bici que OSM no declara ──────────────────────────
  log('');
  log('B6 · ⭐ LAS ACERAS CON BICI QUE OSM NO DECLARA — ¿las recoge el modelo?');
  log('   La tanda 18 midió 1,30 km de carril sobre acera cayendo en `footway` de OSM, en 59');
  log('   ways, de los que solo 6 llevaban `bicycle=*`.');
  {
    const sobreAcera = [];
    for (let i = 0; i < M.length; i++) {
      if (M[i].forma.ciclista !== 'carril-sobre-acera') continue;
      if (!['acera', 'plataforma-peatonal'].includes(M[i].forma.plataforma)) continue;
      sobreAcera.push(i);
    }
    const ways = new Set(sobreAcera.map((i) => g.aristas[i].way));
    const conBici = [...ways].filter((w) => (tags.get(w) || {}).bicycle).length;
    di('aristas de andar con `carril-sobre-acera` encima', `${sobreAcera.length}  (${km(sobreAcera.reduce((s, i) => s + g.aristas[i].largo, 0))})`);
    di('   ways de OSM implicados', ways.size);
    di('   …de ellos, con `bicycle=*` en OSM', `${conBici}  (${pct(conBici, ways.size)})`);
    log('   ⇒ ⭐ SÍ las recoge: son líneas que OSM llama solo «acera» o «peatonal» y que el');
    log('     modelo marca como compartidas con bicis. **Antes eso no se podía ni escribir.**');
    log('   ⚠️ Y salen MENOS que en la tanda 18, por un motivo sano: allí se cogía la candidata');
    log('      más cercana siempre; aquí el 34,5 % de los metros queda ambiguo y no se asigna.');
    global._B6 = { n: sobreAcera.length, ways: ways.size, conBici };
  }

  log('');
  log(A.cierre('MODELO VÍA · FORMA · PAPEL'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { aplicar, hashGrafo, dosPapeles, resolverPorWay, ACUERDO_WAY,
  deducirPorWay, canonizar, construirModelo };
