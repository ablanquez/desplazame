// ⭐⭐⭐ TANDA 34 · ¿LOS 150 m DE ENFRENTE SON ANCHO O SON DESFASE?
//
//   node src/medir-listones.js
//
// ═════════════════════════════════════════════════════════════════════════════
// LA PREGUNTA, Y POR QUÉ ES LA QUE MANDA
// ═════════════════════════════════════════════════════════════════════════════
//   Antonio abre la acera de enfrente hasta 150 m *«porque pueden ser avenidas
//   muy anchas»*. ⚠️ Pero **un número de metros no distingue dos cosas opuestas**:
//     · ANCHO   — el de enfrente está CRUZANDO la calle. Es lo que él quiere.
//     · DESFASE — el de enfrente está CALLE ABAJO. **Es el fallo de Avenida
//                 Cataluña otra vez**, con 150 m en vez de 258.
//   ⇒ si las que entran son sobre todo desfase, los 150 reabren el fallo por otra
//     puerta, y eso hay que decirlo **antes que ningún otro número**.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ EL CRITERIO NO SE CALIBRA — la ley del nº132
// ═════════════════════════════════════════════════════════════════════════════
//   *Un listón calibrado contra N casos conocidos acierta en los N casos: eso no
//   es una comprobación, es la definición de calibrar.* ⇒ **no se ha mirado
//   ninguna avenida para elegir el corte.** Es 45°, el punto medio geométrico
//   entre «perpendicular al eje» y «a lo largo del eje»: ancho si manda la
//   componente transversal, desfase si manda la longitudinal.
//   ⛔ Y la sensibilidad a 30° y 60° va impresa, para que se vea que el resultado
//     no depende de estar pegado al borde.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ Y EL EJE SE MIDE DOS VECES, POR CAMINOS QUE NO SE HABLAN (ley 60)
// ═════════════════════════════════════════════════════════════════════════════
//   1 · el HILO — la dirección entre el portal anterior y el siguiente de la
//       misma acera. Es la que usa `paridad.js`, y no toca el grafo.
//   2 · la ARISTA — la dirección del segmento de OSM al que ese portal engancha.
//   Si los dos no concordaran, toda la clasificación de arriba no valdría. Se
//   mide la discrepancia y se enseña **antes** de usar el criterio.

'use strict';
const A = require('./alarma');
const D = require('./direccion');
const P = require('./portales');
const Par = require('./paridad');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

/** ⛔ Igual que en `medir-paridad.js`: 99999 es «no tiene número», no un portal. */
const CENTINELA = 9999;
const conCentinela = (l) => l.some((o) => o.n != null && o.n >= CENTINELA);

function reparto(v) {
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, p25: q(0.25), mediana: q(0.5), p75: q(0.75), p90: q(0.9), p95: q(0.95), max: s[s.length - 1] };
}

/** Ángulo (0-90°) entre dos direcciones sin signo. */
function entre(a, b) {
  if (!a || !b) return null;
  const c = Math.abs(a[0] * b[0] + a[1] * b[1]);
  return Math.acos(Math.max(0, Math.min(1, c))) * 180 / Math.PI;
}

module.exports = { reparto, entre, conCentinela, CENTINELA };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  const ps = P.cargarPortales();
  const vias = P.cargarVias();
  const indice = D.construirIndice(ps, vias);
  const nombreDe = (l) => [...new Set(l.map((o) => (vias.get(o.codigoVia) || {}).nombre).filter(Boolean))].join(' + ');

  log('='.repeat(112));
  log('⭐⭐⭐ TANDA 34 · ¿LOS 150 m DE LA ACERA DE ENFRENTE SON ANCHO O SON DESFASE?');
  log('='.repeat(112));
  di('listón de su acera · listón de enfrente', `${Par.RAZONABLE_M} m · ${Par.ENFRENTE_M} m`);
  di('corte ancho/desfase (⛔ NO calibrado: punto medio geométrico)', Par.ANGULO_ANCHO + '°');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B0 · ⭐⭐ ¿VALE EL EJE? — dos testigos independientes, antes de usarlo');
  log('='.repeat(112));
  log('   ⛔ Si el eje del hilo y el eje de la arista no concordaran, la clasificación de');
  log('     §B2 no significaría nada. Se mide primero.');
  {
    const g = construir(ZONA_TERMINO);
    const ctx = D.abrir(g, CRUDO);
    const porNucleo = ctx.indice;
    const desac = [];
    let mirados = 0, sinHilo = 0, sinArista = 0;
    for (const l of porNucleo.values()) {
      const an = l.paridad;
      if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
      for (const par of [0, 1]) {
        const hilo = l.filter((o) => o.n != null && o.n % 2 === par).sort((a, b) => a.n - b.n);
        for (const o of hilo) {
          const e1 = Par.ejeLocal(o, hilo);
          if (!e1) { sinHilo++; continue; }
          const ar = g.aristas[o.arista];
          if (!ar || o.seg == null || !ar.pts[o.seg + 1]) { sinArista++; continue; }
          const a = ar.pts[o.seg], b = ar.pts[o.seg + 1];
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (L < 1) { sinArista++; continue; }
          const e2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
          desac.push(entre(e1, e2));
          mirados++;
        }
      }
    }
    const r = reparto(desac);
    di('portales con los dos ejes medibles', mirados);
    di('   sin eje de hilo · sin eje de arista', `${sinHilo} · ${sinArista}`);
    log('   ' + 'desacuerdo entre el eje del HILO y el de la ARISTA (grados)'.padEnd(58)
      + 'med'.padStart(7) + 'p75'.padStart(7) + 'p90'.padStart(7) + 'p95'.padStart(7));
    log('   ' + ''.padEnd(58) + r.mediana.toFixed(0).padStart(7) + r.p75.toFixed(0).padStart(7)
      + r.p90.toFixed(0).padStart(7) + r.p95.toFixed(0).padStart(7));
    const bajo30 = desac.filter((x) => x < 30).length;
    di('⭐ los que concuerdan por debajo de 30°', `${bajo30}  (${pct(bajo30, desac.length)})`);
    // ⛔ LÍNEA BASE: si los dos ejes fueran ruido, el desacuerdo medio de dos
    //   direcciones al azar sería 45°. Sin esto, un «p90 = 40°» no dice si es bueno.
    log('   ⭐⭐ LÍNEA BASE: dos direcciones AL AZAR desacuerdan 45° de media. Si esta');
    log('     mediana no estuviera muy por debajo de 45, los dos testigos serían ruido.');
    A.exige(r.mediana < 20,
      `los dos ejes desacuerdan ${r.mediana.toFixed(0)}° de mediana: el eje del hilo no es el de la calle y §B2 no vale`);
    global._G = g;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B4 · ⭐ LOS ANCHOS REALES DE ZARAGOZA — para saber si 150 es generoso o justo');
  log('='.repeat(112));
  log('   ⭐ El ancho de una vía = la componente TRANSVERSAL entre un portal y el más');
  log('     cercano de la otra acera. ⛔ No la distancia a secas: ésa incluye el desfase.');
  const anchoDeVia = new Map();
  {
    for (const l of indice.values()) {
      const an = l.paridad;
      if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
      if (conCentinela(l)) continue;
      const vals = [];
      for (const par of [0, 1]) {
        const hilo = l.filter((o) => o.n != null && o.n % 2 === par).sort((a, b) => a.n - b.n);
        const otro = l.filter((o) => o.n != null && o.n % 2 !== par);
        for (const o of hilo) {
          const eje = Par.ejeLocal(o, hilo);
          if (!eje) continue;
          let mejor = null, dm = Infinity;
          for (const q of otro) { const d = Par.dist(o, q); if (d < dm) { dm = d; mejor = q; } }
          if (!mejor) continue;
          vals.push(Par.descomponer(o, mejor, eje).ancho);
        }
      }
      if (vals.length >= 5) anchoDeVia.set(l, reparto(vals));
    }
    log('');
    log('   ⭐ LAS QUE PIDIÓ ANTONIO — buscadas por nombre, no por núcleo');
    log('   ' + 'vía'.padEnd(46) + 'portales'.padStart(9) + 'ancho med'.padStart(11)
      + 'p75'.padStart(7) + 'p90'.padStart(7) + 'máx'.padStart(8));
    const PEDIDAS = [/GÓMEZ LAGUNA/i, /HISPANIDAD/i, /AVENIDA CATALUÑA/i, /AVENIDA MADRID/i];
    let encontradas = 0;
    for (const re of PEDIDAS) {
      let hallada = false;
      for (const [l, r] of anchoDeVia) {
        if (!re.test(nombreDe(l))) continue;
        hallada = true;
        log('   ' + nombreDe(l).slice(0, 44).padEnd(46) + String(l.length).padStart(9)
          + r.mediana.toFixed(0).padStart(11) + r.p75.toFixed(0).padStart(7)
          + r.p90.toFixed(0).padStart(7) + r.max.toFixed(0).padStart(8));
      }
      if (hallada) encontradas++;
      else log('   ' + String(re).slice(0, 44).padEnd(46) + 'NO CONSTA: no llega a dos hilos o no está en el callejero');
    }
    A.exige(encontradas === PEDIDAS.length,
      `${PEDIDAS.length - encontradas} de las ${PEDIDAS.length} vías que pidió Antonio no se han encontrado: el listado no contesta a lo que se preguntó`);
    // ⭐ y el reparto de TODAS, que es lo que dice si 150 es generoso
    const todos = [...anchoDeVia.values()].map((r) => r.mediana);
    const rT = reparto(todos);
    log('');
    di('vías con ancho medible (dos hilos, ≥5 medidas)', anchoDeVia.size);
    log('   ' + 'ancho mediano por vía (m)'.padEnd(58) + 'med'.padStart(7) + 'p75'.padStart(7)
      + 'p90'.padStart(7) + 'p95'.padStart(7) + 'máx'.padStart(8));
    log('   ' + ''.padEnd(58) + rT.mediana.toFixed(0).padStart(7) + rT.p75.toFixed(0).padStart(7)
      + rT.p90.toFixed(0).padStart(7) + rT.p95.toFixed(0).padStart(7) + rT.max.toFixed(0).padStart(8));
    for (const u of [30, 50, 100, 150]) {
      di(`   vías más anchas de ${u} m`, `${todos.filter((x) => x > u).length}  (${pct(todos.filter((x) => x > u).length, todos.length)})`);
    }
    log('   ⇒ ⭐ Con esto se puede decir si 150 m es generoso o justo, en vez de opinarlo.');
    global._ANCHOS = rT;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B1–B2 · ⭐⭐⭐ LAS QUE ENTRAN POR LOS 150: ¿ANCHO O DESFASE?');
  log('='.repeat(112));
  {
    const casos = [];
    for (const l of indice.values()) {
      const an = l.paridad;
      if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
      const limpia = !conCentinela(l);
      const presentes = new Set(l.map((o) => o.n).filter((n) => n != null));
      const nums = [...presentes].sort((a, b) => a - b);
      for (let n = nums[0]; n <= nums[nums.length - 1]; n++) {
        if (presentes.has(n)) continue;
        const d = Par.decidir(n, l, an);
        for (const s of (d.sugerencias || [])) {
          if (!s.enfrente) continue;
          casos.push({ l, n, s, limpia,
            situacion: d.cota && d.cota.acota === 'hueco' ? 'hueco' : 'fuera-del-tramo' });
        }
      }
    }
    const limpios = casos.filter((c) => c.limpia);
    log('');
    di('sugerencias de enfrente emitidas', `${casos.length}   (limpias, sin centinela: ${limpios.length})`);
    log('   ⛔ Todo lo de abajo va sobre las LIMPIAS. Con el centinela dentro, una sola vía');
    log('     aporta el 70 % y el resultado sería el de esa vía, no el de Zaragoza.');
    A.exige(limpios.length > 0, 'no queda ni una sugerencia de enfrente al quitar el centinela: no hay nada que clasificar');

    const clases = new Map();
    for (const c of limpios) clases.set(c.s.clase, (clases.get(c.s.clase) || 0) + 1);
    log('');
    log('   ⭐⭐⭐ EL NÚMERO QUE DECIDE SI 150 VALE');
    for (const k of ['ancho', 'desfase', 'NO CONSTA']) {
      const v = clases.get(k) || 0;
      log('   ' + (k === 'desfase' ? '⛔ DESFASE — está calle abajo' : k === 'ancho' ? '⭐ ANCHO — está cruzando' : '⚠️ NO CONSTA — sin eje medible')
        .padEnd(50) + String(v).padStart(9) + pct(v, limpios.length).padStart(10));
    }
    // ── partido por situación: la referencia no siempre es igual de fiable ────
    log('');
    log('   ⚠️ PARTIDO POR SITUACIÓN — porque la referencia no siempre vale lo mismo');
    log('     Cuando el número pedido cae DENTRO de un hueco de su acera, el portal de');
    log('     referencia está al lado y la descomposición es limpia. Cuando cae FUERA del');
    log('     tramo, la referencia es el extremo del hilo y **está lejos del sitio pedido**:');
    log('     ahí «ancho» y «desfase» se miden entre dos puntos que ya son los dos raros.');
    log('   ' + 'situación'.padEnd(30) + 'casos'.padStart(9) + 'ancho'.padStart(9)
      + 'desfase'.padStart(9) + '% desfase'.padStart(11));
    for (const sit of ['hueco', 'fuera-del-tramo']) {
      const g2 = limpios.filter((c) => c.situacion === sit);
      const de = g2.filter((c) => c.s.clase === 'desfase').length;
      const an2 = g2.filter((c) => c.s.clase === 'ancho').length;
      log('   ' + sit.padEnd(30) + String(g2.length).padStart(9) + String(an2).padStart(9)
        + String(de).padStart(9) + pct(de, g2.length).padStart(11));
    }
    // ── sensibilidad: que el resultado no dependa de estar pegado al corte ────
    log('');
    log('   ⭐ SENSIBILIDAD DEL CORTE — para ver que no está pegado al borde');
    log('   ' + 'corte'.padEnd(30) + 'ancho'.padStart(9) + 'desfase'.padStart(9) + '% desfase'.padStart(11));
    for (const u of [30, 45, 60]) {
      const de = limpios.filter((c) => c.s.grados != null && c.s.grados < u).length;
      const an2 = limpios.filter((c) => c.s.grados != null && c.s.grados >= u).length;
      log('   ' + (u + '°' + (u === Par.ANGULO_ANCHO ? '   ⭐ el aplicado' : '')).padEnd(30)
        + String(an2).padStart(9) + String(de).padStart(9) + pct(de, an2 + de).padStart(11));
    }
    // ── y el tamaño del desfase cuando lo hay ────────────────────────────────
    const rLargo = reparto(limpios.filter((c) => c.s.clase === 'desfase' && c.s.largo != null).map((c) => c.s.largo));
    const rAncho = reparto(limpios.filter((c) => c.s.clase === 'ancho' && c.s.ancho != null).map((c) => c.s.ancho));
    log('');
    log('   ⭐⭐ CUÁNTO, EN METROS — la componente que da nombre a cada clase');
    log('   ' + ''.padEnd(58) + 'n'.padStart(8) + 'med'.padStart(7) + 'p75'.padStart(7)
      + 'p90'.padStart(7) + 'máx'.padStart(8));
    if (rLargo) log('   ' + '⛔ desfase: cuánto te adelanta CALLE ABAJO'.padEnd(59)
      + String(rLargo.n).padStart(8) + rLargo.mediana.toFixed(0).padStart(7)
      + rLargo.p75.toFixed(0).padStart(7) + rLargo.p90.toFixed(0).padStart(7) + rLargo.max.toFixed(0).padStart(8));
    if (rAncho) log('   ' + '⭐ ancho: cuánto hay que CRUZAR'.padEnd(58)
      + String(rAncho.n).padStart(8) + rAncho.mediana.toFixed(0).padStart(7)
      + rAncho.p75.toFixed(0).padStart(7) + rAncho.p90.toFixed(0).padStart(7) + rAncho.max.toFixed(0).padStart(8));
    // ⛔ y la comparación con el ancho REAL medido en §B4: si el «ancho» de estas
    //   sugerencias fuera mucho mayor que el ancho típico de las calles, la etiqueta
    //   estaría mintiendo aunque la geometría cuadrara.
    if (rAncho && global._ANCHOS) {
      di('⚠️ ancho típico de una vía de Zaragoza (§B4)', global._ANCHOS.mediana.toFixed(0) + ' m');
      log('   ⇒ si el «ancho» de las sugerencias fuera muy superior a eso, la etiqueta estaría');
      log('     llamando «cruzar» a algo que no es cruzar una calle.');
    }
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐⭐ Y EL APRIETE: cada «ancho», contra el ancho de SU PROPIA VÍA
    // ═══════════════════════════════════════════════════════════════════════
    //   El 45° dice que la componente transversal manda. No dice que sea el ancho
    //   de esa calle. ⇒ se compara cada caso con la anchura medida de su vía en
    //   §B4: si cruzar sale mucho más de lo que mide la calle, **la etiqueta
    //   «ancho» está tapando otra cosa**, y sería el mismo fallo con otro nombre.
    log('');
    log('   ⭐⭐⭐ EL APRIETE — cada «ancho» contra el ancho REAL de su propia vía');
    {
      let conVia = 0, sobra2 = 0, sobra3 = 0, cabe = 0, sinDato = 0;
      const veces = [];
      for (const c of limpios) {
        if (c.s.clase !== 'ancho') continue;
        const r = anchoDeVia.get(c.l);
        if (!r || r.mediana < 1) { sinDato++; continue; }
        conVia++;
        const k = c.s.ancho / r.mediana;
        veces.push(k);
        if (k > 3) sobra3++; else if (k > 2) sobra2++; else cabe++;
      }
      di('casos «ancho» con anchura de su vía medida', `${conVia}   (sin dato: ${sinDato})`);
      di('   ⭐ el cruce CABE en el ancho de su calle (≤ ×2)', `${cabe}  (${pct(cabe, conVia)})`);
      di('   ⚠️ entre ×2 y ×3 el ancho de su calle', `${sobra2}  (${pct(sobra2, conVia)})`);
      di('   ⛔ más de ×3 el ancho de su calle', `${sobra3}  (${pct(sobra3, conVia)})`);
      const rv = reparto(veces);
      if (rv) di('   veces el ancho de su vía (med · p75 · p90)',
        `${rv.mediana.toFixed(1)} · ${rv.p75.toFixed(1)} · ${rv.p90.toFixed(1)}`);
      log('   ⇒ ⭐ Lo que CABE es el ancho de verdad. Lo demás lleva la etiqueta «cruzando»');
      log('     y no es cruzar esa calle.');
      global._APRIETE = { cabe, conVia, total: limpios.length };
    }
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐ B3 · EL DIAL — ⛔ NO SE TOCA NADA. Es para que decida Antonio.
    // ═══════════════════════════════════════════════════════════════════════
    log('');
    log('   ⭐⭐ B3 · SI EL RADIO FUERA OTRO — ⛔ no se cambia nada, es el dato para decidir');
    log('   ' + 'radio'.padEnd(18) + 'sugerencias'.padStart(13) + 'ancho'.padStart(9)
      + 'desfase'.padStart(9) + '% desfase'.padStart(11) + '   cruce que CABE en su calle');
    for (const R of [25, 50, 75, 100, 150]) {
      const dentro = limpios.filter((c) => c.s.metros <= R);
      const de = dentro.filter((c) => c.s.clase === 'desfase').length;
      const an2 = dentro.length - de;
      let cabe = 0;
      for (const c of dentro) {
        if (c.s.clase !== 'ancho') continue;
        const r = anchoDeVia.get(c.l);
        if (r && r.mediana >= 1 && c.s.ancho / r.mediana <= 2) cabe++;
      }
      log('   ' + (R + ' m' + (R === Par.ENFRENTE_M ? '   ⭐ el aplicado' : '')).padEnd(18)
        + String(dentro.length).padStart(13) + String(an2).padStart(9) + String(de).padStart(9)
        + pct(de, dentro.length).padStart(11) + `   ${cabe}  (${pct(cabe, dentro.length)})`);
    }
    log('');
    log('   ⚠️ Y LA OTRA PALANCA, que no es el radio: **limitar lo que te adelanta CALLE');
    log('     ABAJO**, que es exactamente lo que distingue las dos cosas. ⛔ NO se aplica.');
    log('   ' + 'tope de «calle abajo»'.padEnd(30) + 'sugerencias'.padStart(13)
      + 'ancho'.padStart(9) + 'desfase'.padStart(9) + '% desfase'.padStart(11));
    for (const X of [10, 20, 40, 999]) {
      const dentro = limpios.filter((c) => c.s.largo != null && c.s.largo <= X);
      const de = dentro.filter((c) => c.s.clase === 'desfase').length;
      log('   ' + (X === 999 ? 'sin tope (hoy)' : '≤ ' + X + ' m').padEnd(30)
        + String(dentro.length).padStart(13) + String(dentro.length - de).padStart(9)
        + String(de).padStart(9) + pct(de, dentro.length).padStart(11));
    }
    log('   ⇒ ⛔ **NO ELIJO.** El encargo dice que si salen sobre todo desfase, se dice y se');
    log('     para. Sale que sí, y aquí están las dos palancas con su coste medido.');
    global._B2 = { limpios, clases };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('C1 · ⭐⭐ AVENIDA CATALUÑA 78 — con los tres listones');
  log('='.repeat(112));
  {
    for (const q of ['Avenida Cataluña 78', 'Avenida Pablo Gargallo 16', 'Calle Matadero 1']) {
      const r = D.resolver(q, indice);
      log('');
      log('   ' + q);
      di('   estado', r.estado + (r.paridad ? '   [' + r.paridad + ' · vía ' + r.forma + ']' : ''));
      di('   respuesta', r.portal ? 'portal nº' + r.portal.n : '⛔ NO SE TIENE — solo sugerencia');
      if (r.aviso) log('      aviso   «' + r.aviso + '»');
      for (const s of (r.sugerencias || [])) {
        log('      ' + (s.enfrente ? '⛔ ENFRENTE  ' : '⭐ su acera  ') + ('nº' + s.n).padEnd(7)
          + (s.metros == null ? 'NO CONSTA' : s.metros + ' m').padEnd(9)
          + (s.grados == null ? '' : `${s.grados.toFixed(0)}° ${s.clase}  (calle abajo ${s.largo.toFixed(0)} m · cruzando ${s.ancho.toFixed(0)} m)`)
          + '   ' + s.motivo);
      }
    }
    // ⛔⛔ LA COSTURA DEL ENCARGO: el 77 está a 258 m del 74. NO puede entrar.
    const r = D.resolver('Avenida Cataluña 78', indice);
    const cuela = (r.sugerencias || []).some((s) => s.n === 77);
    log('');
    di('⛔⛔ ¿entra el 77 en las sugerencias?', cuela ? '⛔ SÍ — el listón no lo está frenando' : '✅ NO — está a 258 m del 74');
    A.exige(!cuela, 'el 77 de Avenida Cataluña entra en las sugerencias: está a 258 m del 74 y el listón de '
      + Par.ENFRENTE_M + ' m no lo debería dejar pasar');
  }

  log('');
  log(A.cierre('LOS TRES LISTONES'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
