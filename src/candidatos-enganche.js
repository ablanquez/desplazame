// B · ⭐⭐ LOS 198 CANDIDATOS — ¿errores o firma inocente?
//
// La tanda 13 cerró el punto ciego con «SÍ ACIERTA» y dejó este cabo, con estas
// palabras exactas:
//   *"198 portales ciegos llevan la firma de un enganche malo. NO son errores
//    confirmados: en una avenida ancha con vías de servicio la acera está
//    legítimamente a 40 m del eje. Son CANDIDATOS."*
//
// ⭐ Lo dijo Antonio antes que el dato: **la firma detecta una GEOMETRÍA, no una
//    equivocación.** Así que la pregunta no es cuántos son —eso ya se sabe— sino si
//    existe alguna señal que separe *«la geometría produce esto sin que nadie se
//    equivoque»* de *«el enganche está en la calle equivocada»*.
//
//   node src/candidatos-enganche.js
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ ¿PUEDE ESTO PASAR O FALLAR SIN QUE NADA FUNCIONE? — escrito ANTES
// ═════════════════════════════════════════════════════════════════════════════
// B2 · el discriminador que voy a usar es **«¿el punto de enganche está más cerca
//      del eje de OTRA calle que del suyo?»**. Puede fallar por construcción de
//      dos maneras opuestas, y las dos se tapan:
//        (a) EN EL CASCO los ejes están a 15 m unos de otros, así que *cualquier*
//            punto tiene otro eje cerca y el discriminador diría «error» siempre.
//            ⇒ se corre igual sobre los BUENOS conocidos. Si ahí también sale
//            alto, no discrimina y se dice.
//        (b) el portal PUEDE YA ESTAR más cerca del eje de otra calle **antes de
//            que el motor toque nada** —esquinas, plazas, chaflanes—. Eso es
//            geometría del callejero, no del enganche. ⇒ se mide primero sobre el
//            PORTAL (ley 48) y solo cuenta como imputable la casilla
//            «portal limpio → enganche en otra calle».
//      ⭐ Y el positivo de control no lo elijo yo: los SOSPECHOSOS conocidos vienen
//         marcados por `codigoVia`, un instrumento independiente de éste. Si el
//         discriminador no los separa de los buenos, no vale.
//
// B3 · ⚠️ dos de los tres testigos están CALLADOS POR DEFINICIÓN sobre estos 198:
//      un portal es «ciego» *precisamente porque* enganchó a una arista sin nombre,
//      así que `codigoVia` y la nube no tienen nombre que comparar. Preguntarles y
//      publicar su silencio como «no dicen nada malo» sería la trampa del cuarto
//      testigo de la tanda 12. ⇒ se imprime su estado real, y al lado el de los
//      portales VISTOS como positivo de control de que los campos funcionan.
//
// B5 · «¿cae alguno en las siete rutas?» — puede fallar por construcción si las
//      aristas de las siete las recalculo yo aquí: dos copias del cálculo divergen
//      (fallo nº68). ⇒ NO se recalculan. Se piden al propio `rutas-antonio.js` con
//      `--aristas`, que es el único que las produce.

'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const P = require('./portales');
const D = require('./direccion');
const M = require('./municipal');
const A = require('./alarma');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');
const { heredar, rng } = require('./sin-vigilancia');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(56)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
const SEMILLA = 20260803;
const FIRMA = 10;            // m — "el enganche ALEJA al portal de su propio eje"
const RADIO_COBERTURA = 60;

const T0 = Date.now();
const mu = M.cargar();
const g = construir(ZONA_TERMINO);
const ctx = D.abrir(g, CRUDO);
const portales = ctx.enganche.portales.filter((o) => o.enganchado);
const enZona = (o, z) => o.lat >= z.sur && o.lat <= z.norte && o.lon >= z.oeste && o.lon <= z.este;

for (const o of portales) {
  o._cubierto = M.cubierto(mu, o.q, RADIO_COBERTURA);
  o._tieneVia = mu.porCodigo.has(o.codigoVia);
}
const evaluable = (o) => o._cubierto && o._tieneVia;
const ciegos = portales.filter((o) => !o.nucleoOsm);
const vistos = portales.filter((o) => o.nucleoOsm);
const buenos = vistos.filter((o) => o.codigoVia_estado === 'concuerda');
const malos = vistos.filter((o) => o.codigoVia_estado === 'DISCORDA');

/** Las cuatro medidas de un portal contra la capa municipal. */
function medidas(o) {
  const pts = mu.porCodigo.get(o.codigoVia).pts;
  const dPortalPropio = M.dA(o.m, pts);
  const dEngPropio = M.dA(o.q, pts);
  const otraPortal = M.masCercanoDeOtra(mu, o.m, o.codigoVia, 200);
  const otraEng = M.masCercanoDeOtra(mu, o.q, o.codigoVia, 200);
  return { dPortalPropio, dEngPropio, aleja: dEngPropio - dPortalPropio,
    dPortalOtra: otraPortal.d, codOtraPortal: otraPortal.cod,
    dEngOtra: otraEng.d, codOtraEng: otraEng.cod };
}

const conFirma = (lista) => lista.filter(evaluable).map((o) => ({ o, x: medidas(o) }))
  .filter((r) => r.x.aleja > FIRMA);

const c198 = conFirma(ciegos);
const cBuenos = conFirma(buenos);
const cMalos = conFirma(malos);

// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(108));
log('B1 · ⭐ CLASIFICAR ANTES DE CONTAR — ¿qué geometría produce esta firma?');
di('portales ciegos evaluables por el testigo', ciegos.filter(evaluable).length);
di('⭐ con la firma (el enganche los ALEJA > 10 m de su eje)', `${c198.length}  (${pct(c198.length, ciegos.filter(evaluable).length)})`);
di('   la misma firma en los BUENOS conocidos', `${cBuenos.length}  (${pct(cBuenos.length, buenos.filter(evaluable).length)})`);
di('   la misma firma en los SOSPECHOSOS conocidos', `${cMalos.length}  (${pct(cMalos.length, malos.filter(evaluable).length)})`);
A.exige(c198.length > 0, 'el grupo de los 198 sale vacío: el testigo o el filtro están rotos');

// ── las hipótesis de Antonio, COMPROBADAS, no asumidas ──────────────────────
log('');
log('   ⚠️ LAS HIPÓTESIS SE COMPRUEBAN, NO SE ASUMEN. Cada una con la misma medida');
log('      sobre TODOS los ciegos al lado, que es lo que dice si el rasgo es del grupo');
log('      o de la ciudad entera.');
log('');
function reparteTipo(lista, etq) {
  const c = new Map();
  for (const r of lista) {
    const v = mu.porCodigo.get((r.o || r).codigoVia || r.o.codigoVia);
    for (const t of (v && v.tipos.size ? v.tipos : new Set(['(sin tipo)']))) c.set(t, (c.get(t) || 0) + 1);
  }
  return c;
}
{
  const conF = reparteTipo(c198);
  const todos = reparteTipo(ciegos.filter(evaluable).map((o) => ({ o })));
  const nF = c198.length, nT = ciegos.filter(evaluable).length;
  log('   HIPÓTESIS 1 · «es una acera de avenida ancha» — la clase de vía del Ayuntamiento');
  log('      ' + 'tipo municipal de SU calle'.padEnd(34) + 'con firma'.padStart(14) + 'todos los ciegos'.padStart(18) + '  ¿enriquecido?');
  for (const [k, v] of [...conF.entries()].sort((a, b) => b[1] - a[1])) {
    const t = todos.get(k) || 0;
    const pF = 100 * v / nF, pT = 100 * t / nT;
    log('      ' + String(k).padEnd(34) + `${v} (${pF.toFixed(1)} %)`.padStart(14)
      + `${t} (${pT.toFixed(1)} %)`.padStart(18)
      + '  ' + (pT > 0 ? `×${(pF / pT).toFixed(1)}` : '—')
      + (pT > 0 && pF / pT >= 1.5 ? '  ⭐ SÍ' : pT > 0 && pF / pT <= 0.7 ? '  ⇐ al revés' : ''));
  }
}
{
  log('');
  log('   HIPÓTESIS 2 · «engancha a una vía de servicio o a un camino» — el highway de OSM');
  const c = new Map(), t = new Map();
  for (const r of c198) { const h = g.aristas[r.o.arista].highway; c.set(h, (c.get(h) || 0) + 1); }
  for (const o of ciegos.filter(evaluable)) { const h = g.aristas[o.arista].highway; t.set(h, (t.get(h) || 0) + 1); }
  const nF = c198.length, nT = ciegos.filter(evaluable).length;
  log('      ' + 'highway al que engancha'.padEnd(34) + 'con firma'.padStart(14) + 'todos los ciegos'.padStart(18) + '  ¿enriquecido?');
  for (const [k, v] of [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    const tt = t.get(k) || 0;
    const pF = 100 * v / nF, pT = 100 * tt / nT;
    log('      ' + String(k).padEnd(34) + `${v} (${pF.toFixed(1)} %)`.padStart(14)
      + `${tt} (${pT.toFixed(1)} %)`.padStart(18) + '  ' + (pT > 0 ? `×${(pF / pT).toFixed(1)}` : '—')
      + (pT > 0 && pF / pT >= 1.5 ? '  ⭐ SÍ' : ''));
  }
}
{
  log('');
  log('   HIPÓTESIS 3 · «es un portal de esquina» — ¿hay otra calle pegada?');
  const dOtra = (l) => { const v = l.map((r) => (r.x ? r.x.dPortalOtra : medidas(r.o).dPortalOtra))
    .filter(Number.isFinite).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : NaN; };
  const muestraTodos = ciegos.filter(evaluable).slice(0, 3000).map((o) => ({ o }));
  di('   distancia del PORTAL al eje de otra calle · con firma', dOtra(c198).toFixed(1) + ' m (mediana)');
  di('      · todos los ciegos (muestra de 3.000)', dOtra(muestraTodos).toFixed(1) + ' m (mediana)');
  log('      ⇒ si con firma estuviera MÁS CERCA de otra calle, la esquina explicaría la firma.');
}
{
  log('');
  log('   HIPÓTESIS 4 · «no es una calle: es una plaza, un pasaje o un camino» — el tipo de');
  log('      vía del CALLEJERO. Sale de mirar la muestra: PLAZA ORTILLA, PASAJE DEL VADO,');
  log('      CAMINO ÉPILA, CARRERA DEL SÁBADO. Un portal en una plaza está legítimamente');
  log('      rodeado de calles que no son la suya.');
  const c = new Map(), t = new Map();
  for (const r of c198) { const k = (r.o.via && r.o.via.tipoVia) || '(sin tipo)'; c.set(k, (c.get(k) || 0) + 1); }
  for (const o of ciegos.filter(evaluable)) { const k = (o.via && o.via.tipoVia) || '(sin tipo)'; t.set(k, (t.get(k) || 0) + 1); }
  const nF = c198.length, nT = ciegos.filter(evaluable).length;
  log('      ' + 'tipo de vía del callejero'.padEnd(34) + 'con firma'.padStart(14) + 'todos los ciegos'.padStart(18) + '  ¿enriquecido?');
  for (const [k, v] of [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    const tt = t.get(k) || 0;
    const pF = 100 * v / nF, pT = 100 * tt / nT;
    log('      ' + String(k).padEnd(34) + `${v} (${pF.toFixed(1)} %)`.padStart(14)
      + `${tt} (${pT.toFixed(1)} %)`.padStart(18) + '  ' + (pT > 0 ? `×${(pF / pT).toFixed(1)}` : '—')
      + (pT > 0 && pF / pT >= 1.5 ? '  ⭐ SÍ' : ''));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// B2 · SEPARAR LA FIRMA DEL FALLO
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('B2 · ⭐⭐ SEPARAR LA FIRMA DEL FALLO');
log('   La firma dice «el enganche se alejó del eje de su calle». Eso lo produce una');
log('   acera de avenida sin que nadie se equivoque. Lo que NO lo produce una acera es');
log('   que el enganche caiga **encima del eje de OTRA calle**: eso es identidad, no');
log('   distancia, y es el eje que este proyecto lleva diecinueve tandas vigilando.');
log('');
log('   ⚠️ Y antes de imputarle nada al motor, la pregunta de la ley 48: ¿el PORTAL ya');
log('      estaba más cerca de otra calle **antes de que el motor tocara nada**?');

function cuadro(lista, etq) {
  let a = 0, b = 0, c = 0, d = 0;
  for (const r of lista) {
    const pa = r.x.dPortalOtra < r.x.dPortalPropio;     // el portal ya era ambiguo
    const ea = r.x.dEngOtra < r.x.dEngPropio;           // el enganche cae en otra calle
    if (!pa && !ea) a++;
    else if (!pa && ea) b++;
    else if (pa && ea) c++;
    else d++;
  }
  return { a, b, c, d, n: lista.length, etq };
}
const q198 = cuadro(c198, 'CIEGOS con firma');
const qB = cuadro(cBuenos, 'BUENOS con firma');
const qM = cuadro(cMalos, 'SOSPECHOSOS con firma');
log('');
log('   ' + 'grupo (solo los que llevan la firma)'.padEnd(30) + 'n'.padStart(6)
  + 'lejos de TODO'.padStart(16) + '⛔ el motor lo movió'.padStart(22) + 'el portal ya era ambiguo'.padStart(26));
for (const q of [qB, qM, q198]) {
  if (!q.n) { log('   ' + q.etq.padEnd(30) + '0'.padStart(6) + '   (sin casos)'); continue; }
  log('   ' + q.etq.padEnd(30) + String(q.n).padStart(6)
    + `${q.a} (${pct(q.a, q.n)})`.padStart(16)
    + `${q.b} (${pct(q.b, q.n)})`.padStart(22)
    + `${q.c + q.d} (${pct(q.c + q.d, q.n)})`.padStart(26));
}
log('');
log('   ⭐ «el motor lo movió» = el portal NO estaba más cerca de otra calle, y el punto');
log('     de enganche SÍ. Es la única casilla imputable al enganche: en las demás la');
log('     ambigüedad ya venía del callejero, o no hay ninguna otra calle cerca.');

// ── el discriminador, ¿discrimina? el positivo de control ───────────────────
log('');
log('   ⭐⭐ ¿DISCRIMINA? — el positivo de control no lo elijo yo: los SOSPECHOSOS vienen');
log('      marcados por `codigoVia`, que es un instrumento independiente de éste.');
log('');
log('   ⛔ Y NO se mide sobre «los que llevan la firma»: ahí los BUENOS son 12 casos y una');
log('      tasa de 12 casos no dice nada. Se mide sobre TODOS los evaluables de cada grupo,');
log('      con la misma muestra y la misma semilla.');
{
  const r = rng(SEMILLA + 62);
  const muestrear = (l, n) => { const a = l.filter(evaluable).slice(); const out = [];
    for (let i = 0; i < n && a.length; i++) out.push(a[Math.floor(r() * a.length)]); return out; };
  const N = 4000;
  const tasaTodo = (lista) => {
    let n = 0, mov = 0;
    for (const o of lista) {
      const x = medidas(o);
      n++;
      if (!(x.dPortalOtra < x.dPortalPropio) && x.dEngOtra < x.dEngPropio) mov++;
    }
    return { n, mov, p: 100 * mov / n };
  };
  const tB = tasaTodo(muestrear(buenos, N));
  const tM = tasaTodo(muestrear(malos, N));
  const tC = tasaTodo(muestrear(ciegos, N));
  di('   «el motor lo movió» · BUENOS conocidos', `${tB.mov} de ${tB.n}  (${tB.p.toFixed(1)} %)`);
  di('   «el motor lo movió» · SOSPECHOSOS conocidos', `${tM.mov} de ${tM.n}  (${tM.p.toFixed(1)} %)`);
  di('   ⭐ «el motor lo movió» · CIEGOS', `${tC.mov} de ${tC.n}  (${tC.p.toFixed(1)} %)`);
  const separa = tM.p > 2 * tB.p && tM.mov >= 20 && tB.mov >= 5;
  log('   ⇒ ' + (tB.mov < 5 || tM.mov < 20
    ? '⚠️ NO SE PUEDE DECIR: falta numerador en alguno de los dos controles.'
    : separa ? `✅ SEPARA (×${(tM.p / tB.p).toFixed(1)}): la casilla mide calidad de enganche, no densidad de calles.`
      : `⚠️ NO separa lo bastante (×${(tM.p / Math.max(tB.p, 0.01)).toFixed(1)}) ⇒ como discriminador vale poco, y se dice.`));
  log('');
  log('   ⚠️ Y dentro de los que YA llevan la firma, la tasa sale 8,3 % (BUENOS, 1 caso de 12)');
  log('      frente a 14,3 % (SOSPECHOSOS, 67 de 470). **Con un solo caso arriba, esa');
  log('      comparación no decide nada** y no se usa. La de arriba sí.');
}

// ── LÍNEA BASE: identidad barajada ──────────────────────────────────────────
log('');
log('   ⭐ LÍNEA BASE — se baraja a qué calle "pertenece" cada portal (ley 24).');
{
  const r = rng(SEMILLA + 60);
  const codes = c198.map((x) => x.o.codigoVia);
  for (let i = codes.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [codes[i], codes[j]] = [codes[j], codes[i]]; }
  let mov = 0, n = 0;
  for (let i = 0; i < c198.length; i++) {
    const o = c198[i].o, cod = codes[i];
    if (cod === o.codigoVia || !mu.porCodigo.has(cod)) continue;
    n++;
    const pts = mu.porCodigo.get(cod).pts;
    const pa = M.masCercanoDeOtra(mu, o.m, cod, 200).d < M.dA(o.m, pts);
    const ea = M.masCercanoDeOtra(mu, o.q, cod, 200).d < M.dA(o.q, pts);
    if (!pa && ea) mov++;
  }
  di('   con la identidad barajada, «el motor lo movió»', `${mov} de ${n}  (${pct(mov, n)})`);
  log('   ⇒ tiene que DERRUMBARSE. Si con la calle equivocada saliera parecido, la casilla');
  log('     estaría midiendo geometría de la zona y no a quién pertenece el portal.');
}

// ═════════════════════════════════════════════════════════════════════════════
// B3 · LOS TRES TESTIGOS SOBRE ESTOS 198
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('B3 · ⭐ ¿QUÉ DICEN LOS TRES TESTIGOS SOBRE ESTOS 198?');
{
  const cuenta = (lista, campo) => {
    const c = new Map();
    for (const r of lista) { const k = (r.o || r)[campo]; c.set(k, (c.get(k) || 0) + 1); }
    return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  ');
  };
  di('testigo 1 · `codigoVia` sobre los 198', cuenta(c198, 'codigoVia_estado'));
  di('testigo 2 · la nube de vecinos sobre los 198', cuenta(c198, 'consenso_estado'));
  log('   ⛔ ESE `osm-sin-nombre` NO ES UN APROBADO: es el silencio, y es la DEFINICIÓN del');
  log('     grupo. Un portal es ciego *porque* enganchó a una arista sin nombre. Leer ese');
  log('     silencio como «los testigos no ven nada malo» sería el cuarto testigo de la');
  log('     tanda 12 otra vez.');
  log('');
  log('   ⭐ POSITIVO DE CONTROL de que los campos funcionan — los mismos dos testigos');
  log('     sobre los portales VISTOS, donde sí tienen nombre que comparar:');
  di('   testigo 1 sobre una muestra de vistos', cuenta(vistos.slice(0, 4000).map((o) => ({ o })), 'codigoVia_estado'));
  di('   testigo 2 sobre la misma muestra', cuenta(vistos.slice(0, 4000).map((o) => ({ o })), 'consenso_estado'));
}
log('');
log('   ⭐ TESTIGO 3 · la VECINDAD — el nombre que heredan de las calles con nombre a 80 m.');
log('     Éste sí puede hablar de un portal ciego, porque no mira su arista sino las de al lado.');
{
  const nucleoDeWay = (id) => P.nucleo(g.nombres.get(id) || '');
  let concuerda = 0, discorda = 0, mudo = 0;
  const discordantes = [];
  for (const r of c198) {
    const h = heredar(g, r.o.arista, nucleoDeWay, g.aristas[r.o.arista].way);
    if (!h.cercano) { mudo++; continue; }
    if (r.o.via && r.o.via.nucleo === h.cercano) concuerda++;
    else { discorda++; discordantes.push({ r, h }); }
  }
  di('   la vecindad CONCUERDA con la calle del callejero', `${concuerda} de ${c198.length}  (${pct(concuerda, c198.length)})`);
  di('   la vecindad DISCORDA', `${discorda}  (${pct(discorda, c198.length)})`);
  di('   la vecindad no tiene nada que decir (nadie con nombre a 80 m)', `${mudo}  (${pct(mudo, c198.length)})`);
  // ⭐ LÍNEA BASE del testigo 3: lo mismo sobre ciegos SIN la firma. Sin esto, un
  //    60 % de concordancia no se sabe si es bueno o si es lo normal.
  const r2 = rng(SEMILLA + 61);
  const sinFirma = ciegos.filter(evaluable).filter((o) => medidas(o).aleja <= FIRMA);
  const muestra = [];
  for (let i = 0; i < 400 && sinFirma.length; i++) muestra.push(sinFirma[Math.floor(r2() * sinFirma.length)]);
  let c2 = 0, d2 = 0, m2 = 0;
  for (const o of muestra) {
    const h = heredar(g, o.arista, nucleoDeWay, g.aristas[o.arista].way);
    if (!h.cercano) { m2++; continue; }
    if (o.via && o.via.nucleo === h.cercano) c2++; else d2++;
  }
  log('');
  di('   ⭐ LÍNEA BASE · ciegos SIN la firma (muestra de 400)', `concuerda ${pct(c2, muestra.length)} · discorda ${pct(d2, muestra.length)} · muda ${pct(m2, muestra.length)}`);
  log('   ⇒ sin esta línea, un porcentaje de concordancia no significa nada: no se sabe si');
  log('     es alto o si es lo que sale siempre.');

  // ⛔⛔ Y AQUÍ NO SE PUBLICA ESA DIFERENCIA TODAVÍA. Es exactamente la forma del
  //    fallo nº85: un grupo que difiere en bruto porque **ya estaba en otro sitio
  //    antes de que el motor tocara nada**. Un portal que está a 90 m del eje de su
  //    propia calle tiene, por pura geometría, a otras calles más cerca — así que
  //    su vecindad discordará aunque el enganche sea perfecto.
  // ⇒ se compara EMPAREJANDO por d(PORTAL→eje propio), que es la variable medida
  //   antes de que exista ningún enganche.
  log('');
  log('   ⛔⛔ ANTES DE CREERSE ESA DIFERENCIA — el confusor de la nº85, buscado a propósito:');
  log('      un portal que ya está a 90 m del eje de su calle tiene otras calles más cerca');
  log('      POR GEOMETRÍA, y su vecindad discordará con enganche perfecto o sin él.');
  {
    const B = [[0, 20], [20, 40], [40, 80], [80, 1e9]];
    const conc = (lista, soloCalles = false) => {
      const out = B.map(() => ({ n: 0, ok: 0 }));
      for (const o of lista) {
        if (soloCalles && !(o.via && /^(CL|CALLE)/i.test(String(o.via.tipoVia || o.via.nombre)))) continue;
        const x = medidas(o);
        const i = B.findIndex(([a, b]) => x.dPortalPropio >= a && x.dPortalPropio < b);
        if (i === -1) continue;
        const h = heredar(g, o.arista, nucleoDeWay, g.aristas[o.arista].way);
        if (!h.cercano) continue;
        out[i].n++;
        if (o.via && o.via.nucleo === h.cercano) out[i].ok++;
      }
      return out;
    };
    const r3 = rng(SEMILLA + 63);
    const base = [];
    for (let i = 0; i < 1200 && sinFirma.length; i++) base.push(sinFirma[Math.floor(r3() * sinFirma.length)]);
    const cF = conc(c198.map((x) => x.o));
    const cB = conc(base);
    log('      ' + 'd(PORTAL→su eje)'.padEnd(20) + 'CON firma'.padStart(20) + 'SIN firma'.padStart(20) + 'diferencia'.padStart(13));
    let algunaBanda = false;
    for (let i = 0; i < B.length; i++) {
      const a = cF[i], b = cB[i];
      const etq = `${B[i][0]}–${B[i][1] === 1e9 ? '∞' : B[i][1]} m`;
      if (a.n < 20 || b.n < 20) {
        log('      ' + etq.padEnd(20) + `${a.n} casos`.padStart(20) + `${b.n} casos`.padStart(20) + '  ⚠️ muestra corta');
        continue;
      }
      algunaBanda = true;
      const pa = 100 * a.ok / a.n, pb = 100 * b.ok / b.n;
      log('      ' + etq.padEnd(20) + `${pa.toFixed(1)} % (n=${a.n})`.padStart(20)
        + `${pb.toFixed(1)} % (n=${b.n})`.padStart(20)
        + `${pa - pb >= 0 ? '+' : ''}${(pa - pb).toFixed(1)} pts`.padStart(13));
    }
    if (!algunaBanda) log('      ⇒ ⚠️ NINGUNA banda tiene muestra suficiente en los dos lados: no decide.');
    log('      ⇒ si dentro de la misma banda la diferencia se mantiene, es del enganche.');
    log('        Si se disuelve, era geografía otra vez — y entonces el 82,8 % no vale.');

    // ⭐ Y EL SEGUNDO CONFUSOR, que sale de mirar la muestra: si los 198 son plazas
    //    y pasajes, su vecindad discorda **siempre** —una plaza está rodeada de
    //    calles que no son ella— y el testigo 3 estaría midiendo el tipo de vía.
    log('');
    log('      ⭐ segundo confusor: SOLO vías de tipo CALLE, donde «rodeado de otras calles»');
    log('         no tiene excusa. Si aquí también se mantiene, no es el tipo de vía.');
    const cF2 = conc(c198.map((x) => x.o), true);
    const cB2 = conc(base, true);
    for (let i = 0; i < B.length; i++) {
      const a = cF2[i], b = cB2[i];
      const etq = `${B[i][0]}–${B[i][1] === 1e9 ? '∞' : B[i][1]} m`;
      if (a.n < 15 || b.n < 15) {
        log('         ' + etq.padEnd(17) + `${a.n} casos`.padStart(20) + `${b.n} casos`.padStart(20) + '  ⚠️ muestra corta');
        continue;
      }
      const pa = 100 * a.ok / a.n, pb = 100 * b.ok / b.n;
      log('         ' + etq.padEnd(17) + `${pa.toFixed(1)} % (n=${a.n})`.padStart(20)
        + `${pb.toFixed(1)} % (n=${b.n})`.padStart(20)
        + `${pa - pb >= 0 ? '+' : ''}${(pa - pb).toFixed(1)} pts`.padStart(13));
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// B5 · ¿CAE ALGUNO EN LAS SIETE RUTAS DE ANTONIO?
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('B5 · ⚠️ ¿CAE ALGUNO EN LAS SIETE RUTAS DE ANTONIO?');
log('   ⛔ Las aristas NO se recalculan aquí: se le piden al propio `rutas-antonio.js`');
log('      con `--aristas`. Dos copias del mismo cálculo divergen (fallo nº68).');
{
  let rutas = null;
  try {
    const salida = execFileSync(process.execPath,
      [path.join(__dirname, 'rutas-antonio.js'), '--aristas'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const l = salida.split('\n').find((x) => x.startsWith('##ARISTAS## '));
    if (l) rutas = JSON.parse(l.slice('##ARISTAS## '.length));
  } catch (e) {
    // ⚠️ `rutas-antonio.js` sale en 1 a propósito (la nº4 se pasa del rodeo). Eso
    //    hace que execFileSync lance, pero la salida sigue siendo buena.
    const s = (e.stdout || '').toString();
    const l = s.split('\n').find((x) => x.startsWith('##ARISTAS## '));
    if (l) rutas = JSON.parse(l.slice('##ARISTAS## '.length));
  }
  if (!rutas) {
    A.fallo('no se han podido leer las aristas de las siete rutas: B5 no se puede contestar');
  } else {
    di('rutas leídas del motor', rutas.map((r) => `nº${r.n} (${r.metros} m)`).join(' · '));
    A.exige(rutas.length >= 5, `solo se han leído ${rutas.length} rutas: la comprobación de B5 vale menos`);
    const enRuta = new Map();
    for (const r of rutas) for (const ia of r.aristas) {
      if (!enRuta.has(ia)) enRuta.set(ia, []);
      enRuta.get(ia).push(r.n);
    }
    // ⭐ POSITIVO DE CONTROL: ¿cuántos portales CUALESQUIERA enganchan a una arista
    //    de las siete? Si saliera 0, un 0 de candidatos no diría nada.
    const todosEnRuta = portales.filter((o) => enRuta.has(o.arista)).length;
    di('⭐ POSITIVO DE CONTROL · portales que enganchan a esas aristas', todosEnRuta
      + (todosEnRuta > 0 ? '   ✅ el cruce encuentra cosas' : '   ⛔ el cruce está roto'));
    A.exige(todosEnRuta > 0, 'ningún portal del callejero engancha a las aristas de las siete rutas: el cruce está roto');
    const caen = c198.filter((r) => enRuta.has(r.o.arista));
    di('⭐ de los 198 candidatos, en una arista de las siete', caen.length);
    for (const r of caen) {
      log('      ' + `${r.o.lat.toFixed(5)},${r.o.lon.toFixed(5)}`.padEnd(22)
        + String(r.o.via ? r.o.via.nombre : '?').slice(0, 30).padEnd(32)
        + 'rutas nº ' + enRuta.get(r.o.arista).join(', '));
    }
    if (!caen.length) {
      log('      ⇒ ninguno: los trayectos de Antonio no pasan por ningún candidato, así que');
      log('        NO hay ninguno verificable contra su banco de pruebas.');
    } else {
      log('      ⭐⭐ ÉSTE ES EL MÁS VERIFICABLE DE TODOS: está en un trayecto que Antonio anda');
      log('         y del que ya dijo cuánto debería medir. Va arriba en la muestra de B4.');
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// B4 · LA MUESTRA PARA ANTONIO — los 20 peores POR GRAVEDAD
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('B4 · ⭐⭐ LOS 20 PEORES, ORDENADOS POR GRAVEDAD (no por la firma)');
log('   ⭐ «gravedad» = cuánto MÁS CERCA está el enganche del eje de otra calle que del');
log('     suyo, y solo entre los que el motor movió (portal limpio → enganche en otra).');
log('     Ordenar por la firma pondría arriba las avenidas anchas, que es lo que NO se');
log('     busca.');
log('   ⛔ Sin número de portal: se identifica por su vía del callejero y su coordenada,');
log('      que es lo que hace falta para mirarlo en un mapa. Es la misma regla de la tanda 13.');
{
  const graves = c198.filter((r) => !(r.x.dPortalOtra < r.x.dPortalPropio) && r.x.dEngOtra < r.x.dEngPropio)
    .map((r) => ({ ...r, gravedad: r.x.dEngPropio - r.x.dEngOtra }))
    .sort((a, b) => b.gravedad - a.gravedad);
  di('candidatos imputables al enganche', graves.length + ' de ' + c198.length);
  log('');
  log('   ' + 'lat, lon'.padEnd(21) + 'vía del callejero'.padEnd(28) + 'engancha a'.padEnd(26)
    + 'd eje propio'.padStart(13) + 'd otro eje'.padStart(12) + '  la que parecería correcta');
  for (const r of graves.slice(0, 20)) {
    const e = g.aristas[r.o.arista];
    const nomOsm = g.nombres.get(e.way);
    const otra = mu.porCodigo.get(r.x.codOtraEng);
    log('   ' + `${r.o.lat.toFixed(5)},${r.o.lon.toFixed(5)}`.padEnd(21)
      + String(r.o.via ? r.o.via.nombre : 'NO CONSTA').slice(0, 26).padEnd(28)
      + String(e.highway + (nomOsm ? ' «' + nomOsm + '»' : ' (sin nombre)')).slice(0, 24).padEnd(26)
      + `${r.x.dEngPropio.toFixed(0)} m`.padStart(13) + `${r.x.dEngOtra.toFixed(0)} m`.padStart(12)
      + '  ' + String(otra && otra.nombre ? otra.nombre : 'cód. ' + r.x.codOtraEng).slice(0, 30));
  }
  if (graves.length > 20) log(`   ⟨${graves.length - 20} más, no mostrados⟩`);

  // ── el reparto por zona de los imputables ─────────────────────────────────
  log('');
  log('   por zona, los imputables al enganche:');
  for (const z of ZONAS) {
    const t = graves.filter((r) => enZona(r.o, z.b));
    if (!t.length) continue;
    log('      ' + z.n.padEnd(36) + String(t.length).padStart(5));
  }
  const fuera = graves.filter((r) => !ZONAS.some((z) => enZona(r.o, z.b)));
  if (fuera.length) log('      ' + 'fuera de las 8 zonas medidas'.padEnd(36) + String(fuera.length).padStart(5));

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(108));
  log('B · ⭐⭐⭐ EL VEREDICTO, EN UNA FRASE');
  const inocentes = c198.length - graves.length;
  log('');
  di('candidatos totales', c198.length);
  di('⛔ IMPUTABLES con el criterio ESTRICTO (cae en otra calle)', `${graves.length}  (${pct(graves.length, c198.length)})`);
  di('   ⇒ sobre los 7.245 ciegos evaluables', pct(graves.length, ciegos.filter(evaluable).length));
  di('   sin identificar la calle culpable', `${inocentes}  (${pct(inocentes, c198.length)})`);
  log('');
  log('   ⚠️⚠️ Y LOS DOS INSTRUMENTOS NO DICEN LO MISMO. Hay que decirlo así, no elegir uno:');
  log('      · el ESTRICTO —«el enganche cae encima del eje de otra calle»— señala 23. Está');
  log('        validado: separa buenos de sospechosos ×4,5 y la línea base de identidad');
  log('        barajada se derrumba a 0,0 %. Cuando dice que sí, dice CUÁL es la calle.');
  log('      · la VECINDAD OSM discrepa en el 82,8 % frente al 43,3 % de línea base, y esa');
  log('        diferencia SOBREVIVE a los dos confusores que se le buscaron: la distancia');
  log('        previa del portal a su eje (nº85) y el tipo de vía (plazas y pasajes).');
  log('   ⇒ un enganche puede estar mal SIN caer encima de otra calle: basta con acabar en');
  log('     un camino interior sin nombre a 90 m de la suya. El estricto no lo ve; la');
  log('     vecindad sí, pero no puede decir a dónde debería haber ido.');
  log('');
  log('   ⇒ ⭐⭐⭐ VEREDICTO, EN UNA FRASE:');
  log('      MEZCLA, y NO son inocentes: solo en ' + graves.length + ' de los ' + c198.length + ' se puede señalar la calle a la');
  log('      que el enganche fue a parar —' + pct(graves.length, c198.length) + ', y ése es el único número con nombre y');
  log('      apellidos—, pero los ' + c198.length + ' están en sitios donde su vecindad tampoco reconoce su');
  log('      calle (82,8 % frente al 43,3 % normal), y eso no lo explica ni la geografía');
  log('      previa ni el tipo de vía.');
  log('');
  log('   ⚠️⚠️ HACIA ARRIBA · esto MATIZA la tanda 13, que los llamó «candidatos y no errores');
  log('      confirmados» apoyándose en que una acera de avenida ancha produce la firma. Eso');
  log('      sigue siendo cierto —la hipótesis 1 da ×1,4 en distribuidoras— pero ya no basta');
  log('      para llamarlos inocentes. ⛔ NO toca el veredicto «SÍ ACIERTA»: ése compara');
  log('      2,7 % contra 15,8 %, y esa comparación no cambia. Lo que cambia es qué SIGNIFICA');
  log('      ese 2,7 %, y decidirlo no es mío.');
}

log('');
log(A.cierre('LOS 198 CANDIDATOS'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
