// ⭐⭐⭐ TANDA 31 · B · EL NOMBRE PRESTADO — ⛔ MIDE. NO DECIDE. NO APLICA NADA.
//
//   node src/nombre-prestado.js
//
// ═════════════════════════════════════════════════════════════════════════════
// LA PREGUNTA, TAL COMO LA PONE ANTONIO
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Un tramo sin asignación propia coge el nombre del trozo de al lado, del
//   >  mismo way. Y con el modelo, coge también la CITA al Ayuntamiento.»*
//
//   ⭐ Y la frase que lo convierte en un problema y no en un detalle:
//     ***«Nombrar mal es equivocarse; citar mal es atribuir.»***
//
//   El mecanismo es `resolverPorWay()`: resuelve UN nombre por way a partir de las
//   aristas que sí tienen vía, y **ese nombre lo hereda el way entero**. Para las
//   fuentes que trabajan POR WAY —OSM, portales, calle pegada— eso no es un
//   préstamo: el way es su unidad. **Para `municipal-bici` sí lo es**, porque se
//   asigna ARISTA A ARISTA: un way con la mitad de sus aristas asignadas se nombra
//   entero, y la otra mitad lleva un nombre que nadie le puso a ella.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LO QUE ESTE FICHERO **NO** HACE
// ═════════════════════════════════════════════════════════════════════════════
//   No corta la herencia, no cambia el texto, no toca el modelo ni el mapa.
//   Mide, y la decisión es de Antonio. ⚠️ Todas las alternativas de §B4 se
//   calculan **sobre copias**; el modelo real sale de aquí como entró.

'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const A = require('./alarma');
const D = require('./direccion');
const Mo = require('./modelo');
const Rel = require('./relato');
const P = require('./portales');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

/** ⭐ Las fuentes que el AYUNTAMIENTO respalda. `osm` y `calle-pegada` no lo son. */
const DEL_AYUNTAMIENTO = new Set(['municipal-bici', 'portales']);

/**
 * ⭐ ¿Esta arista lleva un nombre PRESTADO?
 * Prestado = el way le da un nombre y la arista **no tiene vía propia** que lo
 * respalde. ⛔ No es lo mismo que «no tiene nombre»: el nombre se imprime igual.
 */
function prestamoDe(M, i, w) {
  if (!w || !w.via || !w.via.nombre) return null;          // el way no nombra: no hay préstamo
  const propia = M[i].via;
  if (!propia || !propia.nombre) return { clase: 'sin-via-propia' };
  const mismo = P.nucleo(propia.nombre) === P.nucleo(w.via.nombre);
  return mismo ? null : { clase: 'via-propia-DISTINTA', propia: propia.nombre };
}

module.exports = { DEL_AYUNTAMIENTO, prestamoDe };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(62)} ${v}`);
  const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const { M, deWay, modeloDeWay } = Mo.construirModelo(g, portales);
  const nombreDeWay = (id) => g.nombres.get(id) || null;
  const tramoDe = (e) => Rel.tramoDeArista(e, nombreDeWay, modeloDeWay);
  const largo = (i) => g.aristas[i].largo;

  log('='.repeat(112));
  log('B · EL NOMBRE PRESTADO — ⛔ SOLO MEDIDO. La decisión es de Antonio.');
  log('='.repeat(112));
  log('   ⭐ «Nombrar mal es equivocarse; citar mal es atribuir.»');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B1 · ⭐⭐ CUÁNTO ES — en el grafo entero');
  log('='.repeat(112));
  log('   ⚠️ El denominador NO es «las aristas con nombre»: es «las aristas cuyo NOMBRE SE');
  log('      IMPRIME», o sea las que el redactor nombra. Se le pregunta a él (ley 56).');
  const nombradas = [], prestadas = [], distintas = [];
  for (let i = 0; i < g.aristas.length; i++) {
    const t = tramoDe(g.aristas[i]);
    if (!t.nombre) continue;
    nombradas.push(i);
    const p = prestamoDe(M, i, deWay.get(g.aristas[i].way));
    if (!p) continue;
    if (p.clase === 'sin-via-propia') prestadas.push(i); else distintas.push(i);
  }
  const mN = nombradas.reduce((s, i) => s + largo(i), 0);
  const mP = prestadas.reduce((s, i) => s + largo(i), 0);
  const mD = distintas.reduce((s, i) => s + largo(i), 0);
  di('aristas cuyo nombre SE IMPRIME', `${nombradas.length}  (${km(mN)})`);
  di('⭐ …con nombre PRESTADO — la arista no tiene vía propia', `${prestadas.length}  (${km(mP)})   ${pct(prestadas.length, nombradas.length)}`);
  di('⚠️ …con vía propia DISTINTA de la del way', `${distintas.length}  (${km(mD)})   ${pct(distintas.length, nombradas.length)}`);
  A.exige(prestadas.length > 0, 'no sale ni un nombre prestado: o el mecanismo no existe o esta medida no lo ve');

  // ⭐ CLASIFICAR ANTES DE CONTAR (ley 29): el préstamo de OSM no es el mismo
  //   fenómeno que el de `municipal-bici`, porque OSM nombra POR WAY por diseño.
  log('');
  log('   ⭐ CLASIFICADO POR LA FUENTE DEL NOMBRE QUE SE PRESTA — porque no son lo mismo');
  log('   ' + 'fuente del way'.padEnd(24) + 'aristas'.padStart(10) + 'metros'.padStart(12)
    + '¿es un préstamo de verdad?'.padStart(30));
  const porFuente = new Map();
  for (const i of prestadas) {
    const w = deWay.get(g.aristas[i].way);
    const f = (w.via.fuente) || '(?)';
    if (!porFuente.has(f)) porFuente.set(f, { n: 0, m: 0 });
    const v = porFuente.get(f); v.n++; v.m += largo(i);
  }
  const UNIDAD = {
    'osm': 'NO — OSM nombra el way entero, ésa es su unidad',
    'municipal-bici': '⭐⭐ SÍ — se asigna ARISTA A ARISTA',
    'portales': 'NO — el método vota POR WAY',
    'calle-pegada': 'NO — el segundo testigo decide POR WAY',
  };
  for (const [f, v] of [...porFuente.entries()].sort((a, b) => b[1].n - a[1].n)) {
    log('   ' + f.padEnd(24) + String(v.n).padStart(10) + km(v.m).padStart(12)
      + (UNIDAD[f] || '(?)').padStart(30));
  }
  const bici = porFuente.get('municipal-bici') || { n: 0, m: 0 };
  log('   ⇒ ⭐ El préstamo que importa es el de `municipal-bici`: ' + bici.n + ' aristas ('
    + km(bici.m) + ').');
  log('     Los demás no son préstamos: su unidad de decisión YA es el way.');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B2 · ⭐ ¿CUÁNTAS VECES ACIERTA EL PRÉSTAMO? — tapándole la suya a las que SÍ la tienen');
  log('='.repeat(112));
  log('   ⭐⭐ EL EXPERIMENTO: para cada arista que SÍ tiene vía propia, se recalcula el');
  log('      nombre de su way **quitándola del voto** y se compara lo que le habría tocado');
  log('      con lo que ella misma dice. ⛔ Es la única forma de medirlo: las prestadas no');
  log('      tienen verdad contra la que comparar, por definición.');
  log('   ⚠️ Y el sesgo va declarado: **las que tienen vía propia no son una muestra de las');
  log('      prestadas.** Miden lo mismo —¿el way es homogéneo?— sobre la parte del way que');
  log('      sí está cubierta. Si el préstamo pasara justo donde el way cambia de calle, esto');
  log('      lo sobreestimaría. No sé cuánto, y por eso se dice.');
  {
    // agrupar por way, una sola vez
    const idxDeWay = new Map();
    for (let i = 0; i < g.aristas.length; i++) {
      const w = g.aristas[i].way;
      if (!idxDeWay.has(w)) idxDeWay.set(w, []);
      idxDeWay.get(w).push(i);
    }
    let n = 0, ok = 0, sinResto = 0;
    const falla = [];
    for (let i = 0; i < g.aristas.length; i++) {
      const propia = M[i].via;
      if (!propia || !propia.nombre) continue;
      const hermanas = idxDeWay.get(g.aristas[i].way).filter((j) => j !== i && M[j].via && M[j].via.nombre);
      if (!hermanas.length) { sinResto++; continue; }
      // ⭐ lo que le habría tocado: la vía con más metros entre las hermanas
      const porNuc = new Map();
      for (const j of hermanas) {
        const nu = P.nucleo(M[j].via.nombre);
        porNuc.set(nu, (porNuc.get(nu) || 0) + largo(j));
      }
      const gana = [...porNuc.entries()].sort((a, b) => b[1] - a[1])[0][0];
      n++;
      if (gana === P.nucleo(propia.nombre)) ok++;
      else if (falla.length < 5) falla.push([i, propia.nombre, gana]);
    }
    di('aristas con vía propia Y con hermanas con vía en su way', n);
    di('   …a las que el préstamo les habría puesto SU nombre', `${ok}  (${pct(ok, n)})`);
    di('   ⚠️ …a las que les habría puesto OTRO', `${n - ok}  (${pct(n - ok, n)})`);
    di('   (descartadas: única con vía en su way, no hay de quién heredar)', sinResto);
    for (const [i, mio, otro] of falla) {
      log('      ⚠️ arista ' + i + ' es «' + mio + '» y el préstamo le habría puesto «' + otro + '»');
    }
    A.exige(n > 0, 'no hay ni una arista con vía propia y hermanas: B2 estaría midiendo el vacío');
    // ⭐⭐ Y SU ROJO, VISTO: si el préstamo acertara el 100 %, este experimento no
    //   distinguiría nada y habría que sospechar de él, no celebrarlo.
    di('⭐⭐ ¿el experimento DISTINGUE? (si acertara el 100 %, no mediría nada)',
      ok < n ? `✅ sí — falla en ${n - ok}` : '⛔ NO — acierto perfecto: sospechoso, no bueno');
    A.exige(ok < n, 'el préstamo acierta el 100 %: eso no es un método bueno, es un experimento que no distingue');
    global._B2 = { n, ok };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B3 · ⭐⭐⭐ LA CITA — ¿cuántas veces se atribuye al AYUNTAMIENTO algo dicho de otros metros?');
  log('='.repeat(112));
  log('   ⭐ Ésta es la pregunta que decide. Un nombre prestado de OSM es un nombre que');
  log('      puede estar mal. Un nombre prestado de `municipal-bici` o de `portales` viene');
  log('      con el respaldo del Ayuntamiento detrás, y **ese respaldo no cubre estos metros**.');
  {
    const citadas = prestadas.filter((i) => {
      const w = deWay.get(g.aristas[i].way);
      return DEL_AYUNTAMIENTO.has(w.via.fuente);
    });
    const decl = citadas.filter((i) => deWay.get(g.aristas[i].way).via.declarada);
    const mC = citadas.reduce((s, i) => s + largo(i), 0);
    const mDe = decl.reduce((s, i) => s + largo(i), 0);
    di('aristas con nombre PRESTADO de una fuente del Ayuntamiento', `${citadas.length}  (${km(mC)})`);
    di('   ⭐⭐ …y además la vía va como DECLARADA (no lleva el aviso de deducida)', `${decl.length}  (${km(mDe)})`);
    log('   ⇒ ⭐⭐⭐ **' + decl.length + ' aristas (' + km(mDe) + ') se presentan como nombre declarado');
    log('     por el Ayuntamiento sobre metros que no tienen asignación propia.**');
    log('     ⚠️ Las otras ' + (citadas.length - decl.length) + ' llevan el aviso «lo deducen los portales», así que el texto');
    log('       ya avisa de que no es un dato: ahí se equivoca, pero no atribuye.');
    global._B3 = { citadas: citadas.length, decl: decl.length, metros: mDe };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B1b/B3b · ⭐⭐ Y EN LAS SIETE RUTAS — que es donde lo lee una persona');
  log('='.repeat(112));
  log('   ⚠️ La tanda 21 midió que de 1.585 m nombrados en las siete, solo 543 tenían');
  log('      asignación propia. **Eso fue ANTES de la calle pegada (tanda 25).** Hoy:');
  let sieteAristas = null;
  try {
    const salida = execFileSync(process.execPath,
      [path.join(__dirname, 'rutas-antonio.js'), '--aristas', '--modelo'],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const l = salida.split('\n').find((x) => x.startsWith('##ARISTAS##'));
    if (l) sieteAristas = JSON.parse(l.slice('##ARISTAS##'.length));
  } catch (e) {
    // ⚠️ `rutas-antonio.js` sale en rojo a propósito (el rodeo de la nº4 está fuera
    //    de banda), así que un código != 0 NO significa que no haya salida.
    const s = (e.stdout || '').toString();
    const l = s.split('\n').find((x) => x.startsWith('##ARISTAS##'));
    if (l) sieteAristas = JSON.parse(l.slice('##ARISTAS##'.length));
  }
  A.exige(!!sieteAristas, 'no se ha podido leer `##ARISTAS##` de las siete rutas: B1b no dice nada');
  if (sieteAristas) {
    log('');
    log('   ⚠️ «nombrados» puede pasarse de «metros»: la ruta usa TROZOS de la primera y la');
    log('      última arista (el enganche), y aquí se suman enteras. La columna que importa es');
    log('      la razón, no la diferencia.');
    log('   ' + 'ruta'.padStart(5) + 'metros'.padStart(10) + 'nombrados'.padStart(12)
      + 'PRESTADOS'.padStart(12) + 'con CITA'.padStart(12) + '   % de lo nombrado que es prestado');
    let tN = 0, tP = 0, tC = 0;
    for (const r of sieteAristas) {
      let mn = 0, mp = 0, mc = 0;
      for (const i of r.aristas) {
        const t = tramoDe(g.aristas[i]);
        if (!t.nombre) continue;
        mn += largo(i);
        const p = prestamoDe(M, i, deWay.get(g.aristas[i].way));
        if (!p || p.clase !== 'sin-via-propia') continue;
        mp += largo(i);
        const w = deWay.get(g.aristas[i].way);
        if (DEL_AYUNTAMIENTO.has(w.via.fuente) && w.via.declarada) mc += largo(i);
      }
      tN += mn; tP += mp; tC += mc;
      log('   ' + String(r.n).padStart(5) + km(r.metros).padStart(10) + km(mn).padStart(12)
        + km(mp).padStart(12) + km(mc).padStart(12) + pct(mp, mn).padStart(34));
    }
    log('   ' + '─'.repeat(100));
    log('   ' + 'TOTAL'.padStart(5) + ''.padStart(10) + km(tN).padStart(12)
      + km(tP).padStart(12) + km(tC).padStart(12) + pct(tP, tN).padStart(34));
    global._B7 = { nombrados: tN, prestados: tP, citados: tC };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B4 · ⭐ LAS TRES OPCIONES, CON SU COSTE MEDIDO — ⛔ ninguna aplicada');
  log('='.repeat(112));
  {
    // ── (a) cortar la herencia ────────────────────────────────────────────────
    log('');
    log('   (a) ⛔ CORTAR LA HERENCIA — una arista sin vía propia se queda sin nombre');
    log('       ⚠️ El coste NO es «cuántas aristas pierden el nombre»: es **cuántos PASOS MÁS**');
    log('          dice «un tramo sin nombre» quien lee el itinerario. Un paso partido en tres');
    log('          se lee tres veces.');
    if (sieteAristas) {
      let pasosAhora = 0, pasosCortado = 0, sinNombreAhora = 0, sinNombreCortado = 0;
      for (const r of sieteAristas) {
        // ⭐ los pasos se cuentan como los cuenta el redactor: se rompe el paso
        //   cuando cambia el nombre impreso. ⛔ Aproximación declarada: `relato.js`
        //   además funde por way y precisión, así que esto es una COTA INFERIOR de
        //   los pasos y una cota inferior del empeoramiento.
        const seq = (cortar) => {
          const out = [];
          for (const i of r.aristas) {
            const t = tramoDe(g.aristas[i]);
            let nom = t.nombre;
            if (cortar && nom) {
              const p = prestamoDe(M, i, deWay.get(g.aristas[i].way));
              if (p && p.clase === 'sin-via-propia') nom = null;
            }
            const k = nom || '(sin nombre)';
            if (!out.length || out[out.length - 1] !== k) out.push(k);
          }
          return out;
        };
        const a = seq(false), b = seq(true);
        pasosAhora += a.length; pasosCortado += b.length;
        sinNombreAhora += a.filter((x) => x === '(sin nombre)').length;
        sinNombreCortado += b.filter((x) => x === '(sin nombre)').length;
      }
      di('pasos en las siete rutas — ahora / cortando', `${pasosAhora} / ${pasosCortado}`);
      di('⭐⭐ pasos que dicen «un tramo sin nombre» — ahora / cortando',
        `${sinNombreAhora} / ${sinNombreCortado}   (+${sinNombreCortado - sinNombreAhora})`);
      log('       ⚠️ Cota INFERIOR: el redactor funde además por way y precisión, así que los');
      log('         pasos reales son menos y el empeoramiento puede ser distinto. Lo que esta');
      log('         cuenta sí dice bien es la DIRECCIÓN y el orden de magnitud.');
      global._B4a = { pasosAhora, pasosCortado, sinNombreAhora, sinNombreCortado };
    }

    // ── (b) marcarla en el texto ──────────────────────────────────────────────
    log('');
    log('   (b) ⭐ MARCARLA EN EL TEXTO — se dice el nombre y se dice que es del way');
    log('       Redactado, para que se pueda leer en voz alta y decidir:');
    log('');
    log('           1. ◦ Por lo que parece, Calle Salvador Minguijón          503 m');
    log('              el nombre es el del tramo de al lado: a estos metros no les');
    log('              corresponde ninguno por su cuenta');
    log('');
    log('       ⚠️ Coste: una línea más en ' + (global._B7 ? 'los pasos afectados' : 'cada paso afectado')
      + ', y un itinerario más largo de leer.');
    log('       ⭐ A cambio: **deja de atribuir**. El nombre sigue estando —que es lo que sirve');
    log('         para orientarse— y la cita se retira, que es lo que no era nuestro.');

    // ── (c) dejarlo ───────────────────────────────────────────────────────────
    log('');
    log('   (c) DEJARLO COMO ESTÁ — qué se asume, dicho sin rodeos');
    log('       · Que un way de OSM no cambia de calle a mitad. ⭐ Casi siempre cierto: B2 lo');
    log('         mide en ' + (global._B2 ? pct(global._B2.ok, global._B2.n) : '—') + ' sobre las que se pueden comprobar.');
    log('       · Que cuando el Ayuntamiento asigna un carril a la mitad de un way, esa');
    log('         asignación vale para el way entero. ⛔ **Eso no lo dice el Ayuntamiento: lo');
    log('         decimos nosotros**, y es exactamente lo que mide B3.');
  }

  log('');
  log('   ⛔⛔ AQUÍ NO SE DECIDE. Los números están; la decisión es de Antonio.');
  log('');
  log('   ⚠️ Lo que esto NO mide: si el nombre prestado es CORRECTO en los casos que');
  log('      importan. B2 mide sobre las que tienen vía propia, que por definición no son');
  log('      las prestadas. No hay patrón de verdad para las prestadas — y NO CONSTA cómo');
  log('      construirlo sin salir a la calle.');
  log('');
  log(A.cierre('EL NOMBRE PRESTADO'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
