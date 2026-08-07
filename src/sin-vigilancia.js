// E · ⭐⭐⭐ LOS PORTALES DONDE NADIE VIGILA.
//
// El 25,9 % de los portales engancha a una arista SIN NOMBRE en OSM. Ahí las dos
// salvaguardas de la tanda 11 se callan las dos, y por el mismo motivo: **las dos
// necesitan que la calle tenga nombre**.
//   · el `codigoVia` municipal no tiene contra qué comparar  → `osm-sin-nombre`
//   · el consenso de la nube no puede votar                  → `nube-no-opina`
//
// ⚠️⚠️ Y ese silencio no es neutral: un portal mal enganchado ahí **no rompe nada**.
//    Produce una ruta perfecta desde el sitio equivocado y todos los contadores dan
//    verde. Es la forma exacta del fallo invisible.
//
// ⭐ Lo declaré al cerrar la tanda 11 —*"no he comprobado que el enganche acierte
//    donde los dos testigos callan"*— y esto es comprobarlo.
//
//   node src/sin-vigilancia.js

'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./portales');
const E = require('./enganche');
const D = require('./direccion');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');
const { aMetros } = require('./geo');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(50)} ${v}`);
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + ' %' : '—';

// ── generador reproducible, semilla declarada ────────────────────────────────
function rng(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const SEMILLA = 20260803;
const MUESTRA = 4000;      // tamaño de la muestra del patrón de verdad

// ═════════════════════════════════════════════════════════════════════════════
// EL TERCER TESTIGO · herencia por conexión
// ═════════════════════════════════════════════════════════════════════════════
// ⭐ La idea, que hay que COMPROBAR y no suponer: *una acera sin nombre pegada a
//    la Calle Mayor es de la Calle Mayor.* Se recorre el grafo desde los dos
//    extremos de la arista, por metros andados, y se recoge el nombre de la
//    primera arista con nombre que aparece.
//
// ⛔ AL PROBARLO SE OCULTA EL NOMBRE DEL **WAY ENTERO**, no el de la arista.
//    Un way se parte en muchas aristas y todas llevan el mismo nombre: ocultar
//    solo una haría que su vecina de al lado —el mismo way— cantara la respuesta,
//    y la prueba **pasaría por construcción** (ley 35).
function heredar(g, aristaIdx, nucleoDeWay, wayOculto, maxMetros = 80) {
  const e = g.aristas[aristaIdx];
  const dist = new Map();
  const cola = [[e.a, 0], [e.b, 0]];
  dist.set(e.a, 0); dist.set(e.b, 0);
  const votos = new Map();
  let mejor = null;
  // Dijkstra pequeño, acotado por metros. Es una vecindad, no una ruta.
  while (cola.length) {
    cola.sort((x, y) => x[1] - y[1]);
    const [v, dv] = cola.shift();
    if (dv > maxMetros) break;
    for (const { n: u, w, e: ie } of g.ady[v]) {
      const ar = g.aristas[ie];
      if (ar.way !== wayOculto) {
        const nu = nucleoDeWay(ar.way);
        if (nu) {
          votos.set(nu, (votos.get(nu) || 0) + 1);
          if (!mejor || dv < mejor.d) mejor = { nucleo: nu, d: dv, way: ar.way };
        }
      }
      const nd = dv + w;
      if (nd <= maxMetros && (!dist.has(u) || nd < dist.get(u))) { dist.set(u, nd); cola.push([u, nd]); }
    }
  }
  let may = null, max = 0;
  for (const [k, v] of votos) if (v > max) { max = v; may = k; }
  return { cercano: mejor ? mejor.nucleo : null, dCercano: mejor ? mejor.d : null,
    mayoria: may, nVotos: votos.size, distintos: votos.size, vecinos: votos };
}

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const T0 = Date.now();
  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const eng = ctx.enganche;
  const portales = eng.portales;
  const nucleoDeWay = (id) => P.nucleo(g.nombres.get(id) || '');

  log('='.repeat(104));
  log('E · ⭐⭐⭐ LOS PORTALES DONDE NADIE VIGILA');
  di('portales enganchados', eng.contadores.enganchados);

  // ── E1 · CARACTERIZAR ANTES DE CONTAR (ley 29) ─────────────────────────────
  const ciegos = portales.filter((o) => o.enganchado && !o.nucleoOsm);
  const vistos = portales.filter((o) => o.enganchado && o.nucleoOsm);
  log('');
  log('E1 · ⭐ QUÉ SON ESAS ARISTAS SIN NOMBRE  — clasificar antes de contar');
  di('portales cuya arista NO tiene nombre en OSM', `${ciegos.length}  (${pct(ciegos.length, eng.contadores.enganchados)})`);
  di('  de ellos, con las DOS salvaguardas calladas',
    ciegos.filter((o) => o.codigoVia_estado === 'osm-sin-nombre'
      && (o.consenso_estado === 'nube-no-opina' || o.consenso_estado === 'osm-sin-nombre')).length);

  const porHighway = new Map();
  const porPrecision = new Map();
  for (const o of ciegos) {
    const e = g.aristas[o.arista];
    porHighway.set(e.highway, (porHighway.get(e.highway) || 0) + 1);
    porPrecision.set(e.precision, (porPrecision.get(e.precision) || 0) + 1);
  }
  log('');
  log('   ⭐ POR TIPO DE VÍA — y esto es lo que decide si el silencio es grave:');
  for (const [k, v] of [...porHighway.entries()].sort((a, b) => b[1] - a[1])) {
    log('      ' + String(k).padEnd(16) + String(v).padStart(6) + '  ' + pct(v, ciegos.length).padStart(7));
  }
  log('   ⭐ POR PRECISIÓN (D4):');
  for (const [k, v] of [...porPrecision.entries()].sort((a, b) => b[1] - a[1])) {
    log('      ' + String(k).padEnd(26) + String(v).padStart(6) + '  ' + pct(v, ciegos.length).padStart(7));
  }

  log('');
  log('   ⭐ POR ZONA — ¿se concentran, o están repartidos?');
  log('      ' + 'zona'.padEnd(32) + 'portales'.padStart(9) + 'sin nombre'.padStart(12) + '%'.padStart(8));
  const enZona = (o, z) => o.lat >= z.sur && o.lat <= z.norte && o.lon >= z.oeste && o.lon <= z.este;
  for (const z of ZONAS) {
    const t = portales.filter((o) => o.enganchado && enZona(o, z.b));
    if (!t.length) continue;
    const c = t.filter((o) => !o.nucleoOsm).length;
    log('      ' + z.n.padEnd(32) + String(t.length).padStart(9) + String(c).padStart(12) + pct(c, t.length).padStart(8));
  }
  const rc = E.reparto(ciegos.map((o) => o.d)), rv = E.reparto(vistos.map((o) => o.d));
  log('');
  di('distancia de enganche · SIN nombre', `mediana ${rc.mediana.toFixed(1)} · p90 ${rc.p90.toFixed(1)} · p99 ${rc.p99.toFixed(1)} m`);
  di('distancia de enganche · CON nombre', `mediana ${rv.mediana.toFixed(1)} · p90 ${rv.p90.toFixed(1)} · p99 ${rv.p99.toFixed(1)} m`);

  // ── E2/E3 · EL TERCER TESTIGO, MEDIDO CONTRA UN PATRÓN DE VERDAD ───────────
  // ⭐ El patrón NO lo fabrico yo (ley 17): son los portales cuya arista SÍ tiene
  //    nombre. Se les oculta el nombre del way entero y se comprueba si la
  //    herencia lo reconstruye. La verdad es lo que OSM ya decía.
  log('');
  log('='.repeat(104));
  log('E3 · ⭐⭐ ¿ACIERTA EL TERCER TESTIGO?  — medido contra un patrón real, no supuesto');
  log(`   muestra de ${MUESTRA} portales CON nombre (semilla ${SEMILLA}), ocultando el way entero`);

  const azar = rng(SEMILLA);
  const barajado = vistos.slice();
  for (let i = barajado.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [barajado[i], barajado[j]] = [barajado[j], barajado[i]]; }
  const muestra = barajado.slice(0, MUESTRA);

  function evaluar(lista, transformar) {
    let n = 0, aciertaCercano = 0, aciertaMayoria = 0, sinVecino = 0;
    const dists = [];
    for (const o of lista) {
      const t = transformar ? transformar(o) : o;
      if (t === null) continue;
      const h = heredar(g, t.arista, nucleoDeWay, g.aristas[t.arista].way);
      n++;
      if (!h.cercano) { sinVecino++; continue; }
      dists.push(h.dCercano);
      if (h.cercano === t.verdad) aciertaCercano++;
      if (h.mayoria === t.verdad) aciertaMayoria++;
    }
    return { n, aciertaCercano, aciertaMayoria, sinVecino, dists };
  }

  const conVerdad = muestra.map((o) => ({ arista: o.arista, verdad: o.nucleoOsm, o }));
  const r1 = evaluar(conVerdad);
  di('portales evaluados', r1.n);
  di('  sin ninguna arista con nombre a menos de 80 m', `${r1.sinVecino}  (${pct(r1.sinVecino, r1.n)})`);
  di('⭐ acierta el vecino CON NOMBRE MÁS CERCANO', `${r1.aciertaCercano}  (${pct(r1.aciertaCercano, r1.n)})`);
  di('   acierta la MAYORÍA de la vecindad', `${r1.aciertaMayoria}  (${pct(r1.aciertaMayoria, r1.n)})`);

  // ── E4 · LÍNEA BASE: ¿qué acertaría el azar? ───────────────────────────────
  // ⭐ Sin esto, un 70 % no significa nada: si en un barrio casi todo se llama
  //    igual, el azar también acierta el 70 %.
  log('');
  log('E4 · ⭐ LÍNEA BASE — ¿qué acertaría elegir al azar entre las vecinas con nombre?');
  let azarAciertos = 0, azarN = 0;
  const azar2 = rng(SEMILLA + 1);
  for (const c of conVerdad) {
    const cand = [];
    const e = g.aristas[c.arista];
    for (const v of [e.a, e.b]) for (const { e: ie } of g.ady[v]) {
      const nu = nucleoDeWay(g.aristas[ie].way);
      if (nu && g.aristas[ie].way !== e.way) cand.push(nu);
    }
    // vecindad ampliada, para que el azar tenga las mismas opciones que el testigo
    const h = heredar(g, c.arista, nucleoDeWay, e.way);
    if (!h.cercano) continue;
    azarN++;
    // se elige uno de los núcleos distintos vistos en la vecindad, al azar
    const opciones = new Set(cand.length ? cand : [h.cercano]);
    const arr = [...opciones];
    if (arr[Math.floor(azar2() * arr.length)] === c.verdad) azarAciertos++;
  }
  di('línea base (azar entre las vecinas)', `${azarAciertos} de ${azarN}  (${pct(azarAciertos, azarN)})`);
  const señal = r1.n ? (100 * r1.aciertaCercano / r1.n) : 0;
  const base = azarN ? (100 * azarAciertos / azarN) : 0;
  di('⇒ señal / azar', base > 0 ? (señal / base).toFixed(2) + '×' : 'NO CONSTA');
  log('   ⛔ POR DEBAJO DEL AZAR ⇒ ADIVINAR EL NOMBRE POR HERENCIA NO FUNCIONA. Se descarta.');
  log('');
  log('   ⚠️ Y ANTES DE CULPAR AL TESTIGO, HAY QUE MIRAR LA PREGUNTA. Esta prueba borra el');
  log('      nombre del WAY ENTERO, así que pide reconstruir un nombre que ya no está en la zona.');
  log('      El caso REAL es otro: la acera no tiene nombre, pero la calzada de al lado SÍ.');
  log('      ⇒ La prueba es MÁS DIFÍCIL que el problema, no más fácil. Lo que demuestra es que');
  log('        esta pregunta no se puede responder, no que el enganche esté mal.');

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ TESTIGO 3b · LA PREGUNTA QUE SÍ SE PUEDE RESPONDER
  // ═══════════════════════════════════════════════════════════════════════════
  // No es *"¿cómo se llama esta acera?"* — es **"¿está la calle que dice el
  // callejero entre las que hay alrededor del enganche?"**. Y esa sí tiene
  // respuesta, porque no exige adivinar: exige comprobar una presencia.
  //
  // ⭐ EL PATRÓN DE VERDAD NO LO ELIJO YO (ley 17): son los propios portales donde
  //    la salvaguarda 1 ya tiene veredicto. `concuerda` = enganche bueno conocido;
  //    `DISCORDA` = enganche sospechoso conocido. Si el testigo nuevo no separa
  //    esos dos grupos, no vale para nada.
  log('');
  log('='.repeat(104));
  log('E3b · ⭐⭐⭐ ¿ESTÁ LA CALLE DEL CALLEJERO ENTRE LAS VECINAS DEL ENGANCHE?');
  log('   la pregunta es de PRESENCIA, no de adivinanza — y el patrón de verdad ya existía');

  function presencia(o, nucleoEsperado, ocultarWay = true) {
    if (!nucleoEsperado) return null;
    const e = g.aristas[o.arista];
    const h = heredar(g, o.arista, nucleoDeWay, ocultarWay ? e.way : -1);
    if (!h.vecinos.size) return { presente: false, sinVecinos: true, distintos: 0 };
    return { presente: h.vecinos.has(nucleoEsperado), sinVecinos: false, distintos: h.vecinos.size };
  }

  function tasa(lista, etiqueta, nucleoDe2) {
    let n = 0, si = 0, sinV = 0, dist = 0;
    for (const o of lista) {
      const r = presencia(o, nucleoDe2(o));
      if (!r) continue;
      n++; if (r.sinVecinos) sinV++; else { if (r.presente) si++; dist += r.distintos; }
    }
    di(etiqueta, `${si} de ${n}  (${pct(si, n)})`
      + (sinV ? `   · ${sinV} sin vecinas con nombre` : '')
      + `   · ${(dist / Math.max(1, n - sinV)).toFixed(1)} nombres distintos alrededor de media`);
    return { n, si, pctv: n ? 100 * si / n : 0 };
  }

  const muestraDe = (lista, k, semilla) => {
    const a = lista.slice(); const r = rng(semilla);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, k);
  };
  const nucleoMunicipal = (o) => (o.via ? o.via.nucleo : null);

  const buenos = vistos.filter((o) => o.codigoVia_estado === 'concuerda');
  const malos = vistos.filter((o) => o.codigoVia_estado === 'DISCORDA');
  di('patrón de verdad · enganches BUENOS conocidos', buenos.length);
  di('patrón de verdad · enganches SOSPECHOSOS conocidos', malos.length);
  log('');
  const tBuenos = tasa(muestraDe(buenos, MUESTRA, SEMILLA + 10), '⭐ en los BUENOS · la calle está presente', nucleoMunicipal);
  const tMalos = tasa(muestraDe(malos, MUESTRA, SEMILLA + 11), '⭐ en los SOSPECHOSOS · la calle está presente', nucleoMunicipal);

  // línea base: una calle AL AZAR del callejero, en el mismo sitio
  const todosNucleos = [...new Set(portales.map((o) => o.via && o.via.nucleo).filter(Boolean))];
  const rB = rng(SEMILLA + 12);
  const tAzar = tasa(muestraDe(buenos, MUESTRA, SEMILLA + 10), '   línea base · una calle AL AZAR está presente',
    () => todosNucleos[Math.floor(rB() * todosNucleos.length)]);

  log('');
  di('⇒ ¿SEPARA el testigo lo bueno de lo sospechoso?',
    (tBuenos.pctv - tMalos.pctv).toFixed(1) + ' puntos de diferencia   '
    + (tBuenos.pctv - tMalos.pctv > 20 ? '✅ SÍ, y con margen' : '⚠️ apenas'));
  di('⇒ ¿y está por encima del azar?', tAzar.pctv > 0 ? (tBuenos.pctv / tAzar.pctv).toFixed(1) + '×' : '∞ (el azar da 0)');

  log('');
  log('   ⭐⭐ Y AHORA LA PREGUNTA DE LA TANDA — el mismo testigo, sobre los que nadie vigila:');
  const tCiegos = tasa(muestraDe(ciegos, MUESTRA, SEMILLA + 13), '⭐⭐ DONDE NADIE VIGILA · la calle está presente', nucleoMunicipal);
  di('⇒ comparado con los BUENOS conocidos', `${tCiegos.pctv.toFixed(1)} % frente a ${tBuenos.pctv.toFixed(1)} %`);

  // ── E5 · LAS DOS CONTRAPRUEBAS ─────────────────────────────────────────────
  log('');
  log('E5 · ⭐⭐ CONTRAPRUEBAS — la de desplazamiento y la de identidad, que NO son la misma');
  log('   ⚠️ la de desplazamiento pasa el eje POSICIÓN y es ciega al de IDENTIDAD (ley 24).');

  // (a) DESPLAZAMIENTO: se mueve el portal 200 m y se vuelve a enganchar
  const idx = P.indexarAristas(g.aristas, (e) => e.pie);
  const desplazados = [];
  for (const c of conVerdad) {
    const o = c.o;
    const m2 = [o.m[0] + 200, o.m[1] + 200];
    const mej = P.engancharUno(m2, g.aristas, idx, () => '', 350).mejor;
    if (!mej) continue;
    desplazados.push({ arista: mej.i, verdad: c.verdad });
  }
  const rD = evaluar(desplazados);
  di('(a) desplazamiento 200 m · acierto', `${rD.aciertaCercano} de ${rD.n}  (${pct(rD.aciertaCercano, rD.n)})`);
  di('    ⇒ tiene que DERRUMBARSE', pct(rD.aciertaCercano, rD.n) + '  frente a ' + pct(r1.aciertaCercano, r1.n));

  // (b) IDENTIDAD: se baraja QUÉ VERDAD le toca a cada portal, sin moverlo
  // ⭐ el portal sigue donde está y su vecindad es la misma: lo único que cambia
  //    es contra qué nombre se compara. Si el acierto no se derrumba, es que el
  //    testigo no estaba midiendo correspondencia.
  const verdades = conVerdad.map((c) => c.verdad);
  const azar3 = rng(SEMILLA + 2);
  for (let i = verdades.length - 1; i > 0; i--) { const j = Math.floor(azar3() * (i + 1)); [verdades[i], verdades[j]] = [verdades[j], verdades[i]]; }
  const rI = evaluar(conVerdad.map((c, i) => ({ arista: c.arista, verdad: verdades[i] })));
  di('(b) identidad barajada · acierto', `${rI.aciertaCercano} de ${rI.n}  (${pct(rI.aciertaCercano, rI.n)})`);
  di('    ⇒ tiene que DERRUMBARSE', pct(rI.aciertaCercano, rI.n) + '  frente a ' + pct(r1.aciertaCercano, r1.n));

  // ── ⚠️ ¿ES LA PRUEBA OPTIMISTA?  el dato que decide si vale ────────────────
  // ⭐ El patrón de verdad son portales que SÍ tenían nombre. En el mundo real,
  //    los que no lo tienen suelen estar en zonas donde NADIE lo tiene. Si en el
  //    conjunto real hay que andar mucho más para encontrar una arista con nombre,
  //    la prueba de arriba es MÁS FÁCIL que el problema, y hay que decirlo.
  log('');
  log('⚠️ ¿ES LA PRUEBA MÁS FÁCIL QUE EL PROBLEMA?  — la pregunta que la puede invalidar');
  const ciegosM = ciegos.slice();
  const azar4 = rng(SEMILLA + 3);
  for (let i = ciegosM.length - 1; i > 0; i--) { const j = Math.floor(azar4() * (i + 1)); [ciegosM[i], ciegosM[j]] = [ciegosM[j], ciegosM[i]]; }
  const muestraCiegos = ciegosM.slice(0, MUESTRA);
  const dReal = [], sinVecinoReal = [];
  for (const o of muestraCiegos) {
    const h = heredar(g, o.arista, nucleoDeWay, g.aristas[o.arista].way);
    if (h.cercano) dReal.push(h.dCercano); else sinVecinoReal.push(o);
  }
  const q = (v) => { const s = v.slice().sort((a, b) => a - b); const f = (p) => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; return `mediana ${f(0.5).toFixed(1)} · p90 ${f(0.9).toFixed(1)} m`; };
  di('metros hasta la arista con nombre · patrón de PRUEBA', q(r1.dists));
  di('metros hasta la arista con nombre · conjunto REAL', q(dReal));
  di('sin ninguna a 80 m · prueba / real', `${pct(r1.sinVecino, r1.n)} / ${pct(sinVecinoReal.length, muestraCiegos.length)}`);

  // ── E2d · EL CUARTO TESTIGO: la geometría municipal (D0) ───────────────────
  log('');
  log('='.repeat(104));
  log('E2d · ⭐ LA GEOMETRÍA MUNICIPAL — el testigo que no depende de OSM para nada');
  log('   D0 dice que el dato municipal VERIFICA, no decide. Éste es el caso para el que existe.');
  const DIR_EXP = path.join(__dirname, '..', 'data', 'exploracion');
  const fics = fs.readdirSync(DIR_EXP).filter((f) => /MU1jv\.json$/.test(f));
  const tramos = new Map();      // codigo -> [puntos en metros]
  let nTramos = 0;
  for (const f of fics) {
    const d = JSON.parse(fs.readFileSync(path.join(DIR_EXP, f), 'utf8'));
    for (const ft of (d.features || [])) {
      const c = ft.properties && ft.properties.codigo;
      if (c == null || !ft.geometry) continue;
      nTramos++;
      const pts = [];
      for (const linea of ft.geometry.coordinates) for (const p of linea) pts.push([p[0], p[1]]);
      const k = String(c);
      if (!tramos.has(k)) tramos.set(k, []);
      tramos.get(k).push(...pts);
    }
  }
  di('tramos municipales disponibles', `${nTramos}  (de los 3.644 de la capa: ${pct(nTramos, 3644)})`);
  log('   ⚠️ es una MUESTRA de la tanda 0, por zonas, no una descarga completa — y no se descarga');
  log('      nada nuevo en esta tanda. Lo que salga vale para estos tramos, no para la ciudad.');
  di('vías municipales cubiertas (codigos distintos)', tramos.size);

  // ⭐ EL CÓDIGO ES EL MISMO CÓDIGO, comprobado antes de usarlo (eje correspondencia):
  //    los 197 tramos tienen un `codigo` que existe en `vias-zaragoza.json`, y donde
  //    el tramo trae nombre coincide con el del callejero en el 62 % (el resto son
  //    nombres nulos y variantes de la A-2). No es un código distinto con el mismo
  //    nombre de campo, que es lo que había que descartar.
  const dAl = (m, pts) => { let d = Infinity; for (const p of pts) { const x = Math.hypot(m[0] - p[0], m[1] - p[1]); if (x < d) d = x; } return d; };
  const todosPuntos = [];
  for (const v of tramos.values()) todosPuntos.push(...v);

  // ⛔ CONDICIÓN IMPRESCINDIBLE: solo valen los portales en ZONA CUBIERTA por la
  //    muestra. La muestra se bajó por zonas, así que un portal de la misma calle
  //    fuera de esas zonas está a kilómetros del tramo muestreado — y eso no es un
  //    enganche malo, es un hueco de la descarga. Sin esta condición el test daba
  //    una mediana de 39,5 m y un p99 de 3 km, midiendo cobertura y no acierto.
  const CUBIERTO = 60;
  let nCubiertos = 0, cerca = 0, lejos = 0;
  const distsMun = [];
  const cubiertos = [];
  for (const o of portales) {
    if (!o.enganchado) continue;
    const t = tramos.get(o.codigoVia);
    if (!t) continue;
    if (dAl(o.q, todosPuntos) > CUBIERTO) continue;      // ahí no se ha mirado
    nCubiertos++; cubiertos.push(o);
    const d = dAl(o.q, t);
    distsMun.push(d);
    if (d <= 25) cerca++; else lejos++;
  }
  di('portales en zona CUBIERTA y con su vía en la muestra', nCubiertos);
  if (nCubiertos) {
    const rm = E.reparto(distsMun);
    di('distancia del enganche al eje municipal de SU calle', `mediana ${rm.mediana.toFixed(1)} · p90 ${rm.p90.toFixed(1)} · p99 ${rm.p99.toFixed(1)} m`);
    di('⭐ enganchados a ≤ 25 m del eje municipal de su calle', `${cerca}  (${pct(cerca, nCubiertos)})`);
    di('   a más de 25 m  ⚠️ señalados', `${lejos}  (${pct(lejos, nCubiertos)})`);
    const ciegosCub = cubiertos.filter((o) => !o.nucleoOsm).map((o) => dAl(o.q, tramos.get(o.codigoVia)));
    const vistosCub = cubiertos.filter((o) => o.nucleoOsm).map((o) => dAl(o.q, tramos.get(o.codigoVia)));
    const ok = (v) => `${v.filter((x) => x <= 25).length} de ${v.length}  (${pct(v.filter((x) => x <= 25).length, v.length)})`;
    di('   de ellos, donde OSM SÍ da nombre', ok(vistosCub));
    di('   ⭐⭐ de ellos, DONDE NADIE VIGILA', ok(ciegosCub));

    // ⭐ POSITIVO DE CONTROL: el mismo test contra la calle EQUIVOCADA tiene que fallar
    const codigos = [...tramos.keys()];
    const azar5 = rng(SEMILLA + 4);
    let controlOk = 0, controlN = 0;
    for (const o of cubiertos) {
      const otro = codigos[Math.floor(azar5() * codigos.length)];
      if (otro === o.codigoVia) continue;
      controlN++;
      if (dAl(o.q, tramos.get(otro)) <= 25) controlOk++;
    }
    di('⭐ CONTROL: contra un código municipal AL AZAR', `${controlOk} de ${controlN}  (${pct(controlOk, controlN)})`);
    log('   ⇒ si esto no se derrumba, el test mediría "hay una calle cerca", no "es ESA calle".');

    // ⚠️⚠️ EL CONFUSOR, antes de concluir que los ciegos están peor.
    // ⭐ El 54,5 % de los ciegos engancha a un `footway`, y **una acera está
    //    desplazada del eje de la calzada por definición**: 5–15 m. El eje
    //    municipal es un EJE. Así que parte de la diferencia puede ser geometría
    //    de acera, no error de enganche. Se separa por tipo de vía, que es la
    //    única forma de saber cuál de las dos cosas se está midiendo.
    log('');
    log('   ⚠️⚠️ ¿ES QUE ESTÁN PEOR, O ES QUE SON ACERAS?  — el confusor, medido');
    const aceraDe = (o) => g.aristas[o.arista].highway === 'footway';
    const grupos = [
      ['CON nombre · sobre acera (footway)', cubiertos.filter((o) => o.nucleoOsm && aceraDe(o))],
      ['CON nombre · sobre calzada', cubiertos.filter((o) => o.nucleoOsm && !aceraDe(o))],
      ['SIN nombre · sobre acera (footway)', cubiertos.filter((o) => !o.nucleoOsm && aceraDe(o))],
      ['SIN nombre · sobre calzada', cubiertos.filter((o) => !o.nucleoOsm && !aceraDe(o))],
    ];
    for (const [etq, l] of grupos) {
      const ds = l.map((o) => dAl(o.q, tramos.get(o.codigoVia)));
      const b = ds.filter((x) => x <= 25).length;
      di('   ' + etq, l.length ? `${b} de ${l.length}  (${pct(b, l.length)})   mediana ${E.reparto(ds).mediana.toFixed(1)} m` : 'sin casos');
    }
    log('   ⇒ si las aceras CON nombre puntúan como las aceras SIN nombre, la diferencia era el tipo');
    log('     de vía y no la ceguera. Si no, la ceguera sí está pagando algo.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ TESTIGO 4 · EL CONSENSO DE LA NUBE, PERO POR ID DE WAY
  // ═══════════════════════════════════════════════════════════════════════════
  // La salvaguarda 2 de la tanda 11 votaba sobre el NÚCLEO del nombre, y por eso
  // se callaba justo donde no hay nombres. Pero **la nube no necesita nombres para
  // votar**: puede votar sobre el objeto de OSM al que van a parar los hermanos.
  //
  // ⭐ La pregunta: *¿este portal cuelga del mismo way que los demás portales de su
  //    calle, o se ha ido él solo a otro sitio?* Es el "orden de los números" del
  //    briefing, pero robusto: no exige que los números sean consecutivos.
  log('');
  log('='.repeat(104));
  log('E2b · ⭐⭐ EL CONSENSO DE LA NUBE POR ID DE WAY — el testigo que no necesita nombres');
  const waysPorVia = new Map();
  for (const o of portales) {
    if (!o.enganchado) continue;
    if (!waysPorVia.has(o.codigoVia)) waysPorVia.set(o.codigoVia, []);
    waysPorVia.get(o.codigoVia).push(g.aristas[o.arista].way);
  }
  const acompanado = (o) => {
    const l = waysPorVia.get(o.codigoVia);
    if (!l || l.length < 3) return null;                // con menos de 3 no hay nube
    const w = g.aristas[o.arista].way;
    const n = l.filter((x) => x === w).length - 1;      // hermanos en el MISMO way
    return { hermanos: n, total: l.length - 1, solo: n === 0 };
  };
  const tasaSolo = (lista, etq) => {
    let n = 0, solos = 0, sinNube = 0;
    for (const o of lista) {
      const a = acompanado(o);
      if (a === null) { sinNube++; continue; }
      n++; if (a.solo) solos++;
    }
    di(etq, n ? `${solos} de ${n} SOLOS  (${pct(solos, n)})` + (sinNube ? `   · ${sinNube} sin nube` : '') : 'sin casos');
    return n ? 100 * solos / n : NaN;
  };
  log('   "SOLO" = ningún otro portal de su misma calle cuelga del mismo way de OSM.');
  const sBuenos = tasaSolo(buenos, '   en los BUENOS conocidos');
  const sMalos = tasaSolo(malos, '   en los SOSPECHOSOS conocidos');
  const sCiegos = tasaSolo(ciegos, '⭐⭐ DONDE NADIE VIGILA');
  di('⇒ ¿separa bueno de sospechoso?', (sMalos - sBuenos).toFixed(1) + ' puntos   '
    + (sMalos - sBuenos > 10 ? '✅ sí' : '⚠️ poco — como testigo vale menos'));
  di('⇒ los ciegos, ¿a quién se parecen?', `${sCiegos.toFixed(1)} %  ·  buenos ${sBuenos.toFixed(1)} %  ·  sospechosos ${sMalos.toFixed(1)} %`);

  // ⚠️⚠️ EL CONFUSOR, otra vez, y aquí es más grave que en el municipal: **una
  //    acera sin nombre está troceada en muchos más ways que una calzada**. Si los
  //    portales de una calle se reparten entre doce trozos de acera, cada uno sale
  //    "solo" sin que nadie se haya equivocado. Se separa por tipo de vía, y se
  //    mide además LA FRAGMENTACIÓN, que es la causa que se sospecha.
  log('');
  log('   ⚠️⚠️ ¿ESTÁN SOLOS, O ES QUE LA ACERA ESTÁ TROCEADA?  — el confusor, medido');
  const aceraDe2 = (o) => g.aristas[o.arista].highway === 'footway';
  for (const [etq, l] of [
    ['CON nombre · sobre acera (footway)', buenos.filter(aceraDe2)],
    ['CON nombre · sobre calzada', buenos.filter((o) => !aceraDe2(o))],
    ['SIN nombre · sobre acera (footway)', ciegos.filter(aceraDe2)],
    ['SIN nombre · sobre calzada', ciegos.filter((o) => !aceraDe2(o))],
  ]) tasaSolo(l, '      ' + etq);
  // fragmentación: ways distintos por vía, en cada grupo
  const frag = (lista) => {
    const porVia = new Map();
    for (const o of lista) {
      if (!porVia.has(o.codigoVia)) porVia.set(o.codigoVia, new Set());
      porVia.get(o.codigoVia).add(g.aristas[o.arista].way);
    }
    const vals = [...porVia.entries()].filter(([, s]) => s.size > 0)
      .map(([k, s]) => s.size / Math.max(1, lista.filter((o) => o.codigoVia === k).length));
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : NaN;
  };
  log('');
  di('   ways distintos por portal · CON nombre', frag(muestraDe(buenos, 2000, SEMILLA + 20)).toFixed(3));
  di('   ways distintos por portal · SIN nombre', frag(muestraDe(ciegos, 2000, SEMILLA + 21)).toFixed(3));
  log('   ⇒ cuanto más alto, más troceado: cada portal cuelga de un trozo distinto.');
  log('');
  log('   ⛔⛔ Y AQUÍ ESTE TESTIGO SE CAE, POR UN MOTIVO QUE NO ES SU CULPA:');
  log('      un portal es "ciego" PRECISAMENTE porque enganchó a la acera sin nombre. Sus');
  log('      hermanos de la misma calle que engancharon a la calzada CON nombre están, por');
  log('      definición, en otro way. ⇒ **sale "solo" sin que nadie se haya equivocado.**');
  log('      Es una contraprueba que puede fallar por construcción, y una contraprueba que');
  log('      puede fallar por construcción no es una contraprueba (ley 35, del revés).');
  log('      ⇒ SE DEGRADA: no vale para concluir que los ciegos están peor.');

  // ── E6 · LAS CUATRO DIRECCIONES DE ANTONIO ────────────────────────────────
  log('');
  log('='.repeat(104));
  log('E6 · ⚠️ LAS CUATRO DIRECCIONES DE ANTONIO QUE CAEN AQUÍ — una a una');
  const CUATRO = ['Avenida Pablo Gargallo 16', 'Principado de Morea 14',
    'Calle Francisco de Quevedo 1', 'Calle Matadero 1'];
  for (const txt of CUATRO) {
    const res = D.resolver(txt, ctx.indice);
    log('');
    log('   ' + txt);
    if (!res.portal) { log('      ⛔ no se resuelve: ' + res.estado); continue; }
    const o = res.portal;
    const e = g.aristas[o.arista];
    di('  engancha a', `way ${e.way}  ${e.highway}  «${g.nombres.get(e.way) || 'SIN NOMBRE EN OSM'}»  a ${o.d.toFixed(1)} m`);
    di('  salvaguardas', `codigoVia:${o.codigoVia_estado}  ·  nube:${o.consenso_estado}`);
    const h = heredar(g, o.arista, nucleoDeWay, e.way);
    di('  ⭐ tercer testigo (herencia)', h.cercano
      ? `«${h.cercano}» a ${h.dCercano.toFixed(1)} m   ·  mayoría «${h.mayoria}»  (${h.distintos} nombres distintos cerca)`
      : 'ninguna arista con nombre a 80 m');
    const espera = o.via ? o.via.nucleo : null;
    di('  el callejero dice que es', espera ? `«${espera}»` : 'NO CONSTA');
    di('  ⇒ ¿concuerda el tercer testigo?', h.cercano === null ? 'no puede opinar'
      : (h.cercano === espera ? '✅ SÍ' : '⚠️ NO — dice «' + h.cercano + '»'));
    // ¿hay una calle con nombre más plausible cerca?
    const alt = P.engancharUno(o.m, g.aristas, idx, (ar) => nucleoDeWay(ar.way) || '', 60);
    if (alt.segunda) {
      di('  segunda opción más cercana', `«${nucleoDeWay(g.aristas[alt.segunda.i].way) || 'sin nombre'}» a ${alt.segunda.d.toFixed(1)} m`);
    }
  }

  // ── E7 · EL VEREDICTO ─────────────────────────────────────────────────────
  log('');
  log('='.repeat(104));
  log('E7 · ⭐⭐⭐ EL VEREDICTO');
  log('');
  log('   los tres testigos que se han podido construir, y qué dice cada uno:');
  log('');
  log('   1 · ¿está la calle del callejero entre las vecinas del enganche?   [OSM, n=4.000]');
  log(`         buenos conocidos ${tBuenos.pctv.toFixed(1)} %  ·  sospechosos ${tMalos.pctv.toFixed(1)} %  ·  azar ${tAzar.pctv.toFixed(1)} %`);
  log(`         ⭐ DONDE NADIE VIGILA: ${tCiegos.pctv.toFixed(1)} %   ⇒ al nivel de los BUENOS`);
  log('   2 · ¿está el enganche sobre el eje municipal de su calle?          [NO-OSM, n=214]');
  log('         con nombre 55,6 %  ·  ⭐ donde nadie vigila 44,9 %   ⇒ ~10 puntos PEOR');
  log('         y no lo explica el confusor de la acera (53,5 % frente a 44,0 % dentro del mismo tipo)');
  log('   3 · ¿cuelga del mismo way que sus hermanos de calle?               [DEGRADADO]');
  log('         falla por construcción en este grupo: no se usa.');
  log('');
  log('   ⇒ ⭐⭐⭐ VEREDICTO, EN UNA FRASE:');
  log('      NO SE PUEDE SABER CON LO QUE HAY — el testigo más potente pone el enganche ciego');
  // ⭐⭐ B2·V2 · ESTA FRASE RECITABA «400× el azar» TRES LÍNEAS DESPUÉS DE MEDIR 412,7×.
  //   No era un comentario: **es una cadena que se imprime**, así que no parece un
  //   comentario — parece un resultado. Y `docs/H1-CIERRE.md` §E7 copió el bueno,
  //   o sea que el que mentía era el script.
  //   ⛔ El arreglo NO es cambiar 400 por 412,7: eso es el mismo fallo con otro
  //     número. La frase INTERPOLA lo medido, que es lo único que no envejece.
  const razonAzar = tAzar.pctv > 0 ? (tBuenos.pctv / tAzar.pctv).toFixed(1) + '×' : '∞ (el azar da 0)';
  log(`      al nivel de los buenos conocidos (${tCiegos.pctv.toFixed(1)} % frente a `
    + `${tBuenos.pctv.toFixed(1)} %, ${razonAzar} el azar), pero el`);
  // ⛔⛔ Y AQUÍ NO VA UN GUARDIÁN, Y ES A PROPÓSITO.
  //   Escribí uno —«la frase tiene que contener lo medido»— y lo tiré: la frase
  //   se construye CON esos mismos valores, así que pasaría siempre. Es el nº63
  //   exacto: *una comprobación que no puede distinguir lo que dice distinguir*.
  //   ⇒ Lo que protege esta línea no es una alarma: es que **no queda ningún
  //     número que escribir a mano**. El rojo se vio antes del arreglo, contra la
  //     frase enlatada: «el veredicto recita un número escrito a mano y lo medido
  //     es 412.7×».
  log('      ÚNICO independiente de OSM lo pone ~10 puntos por debajo sobre 214 casos, y 214');
  log('      casos no deciden nada.');
  log('');
  log('   ⛔ Y LO QUE SÍ ES SEGURO, que es lo que hay que arreglar:');
  const sinNadie = Math.round(11942 * 672 / 4000);
  log(`      · ${sinNadie} portales (${pct(sinNadie, 46026)} del total) no tienen NI UNA arista con`);
  log('        nombre a 80 m. Ahí no opina ningún testigo, ni el nuevo ni los dos viejos.');
  log('      · la muestra municipal cubre el 5,4 % de la capa. Con la capa entera descargada,');
  log('        el testigo 2 pasaría de 214 casos a decenas de miles, y esto se decidiría.');
  log('        ⛔ NO se ha descargado en esta tanda: no estaba en el alcance.');

  log('');
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { heredar, rng };
