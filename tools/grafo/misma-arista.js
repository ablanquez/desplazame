// ⭐⭐⭐ ¿ESTÁ CONTAMINADO EL RODEO DE LAS RUTAS CORTAS?
//
// LA PREGUNTA, UNA SOLA: en las diez rutas de `data/pruebas/RUTAS-CONOCIDAS.md`,
// ¿las dos puntas enganchan a la MISMA arista?
//
// ⛔ POR QUÉ IMPORTA. `src/grafo.js:202-215` (`insertar`) enlaza cada nodo temporal
//    SOLO con los dos extremos de su arista, nunca con el otro nodo temporal. Si
//    las dos puntas caen en la misma arista, el camino más corto que el motor sabe
//    encontrar SALE A LA ESQUINA Y VUELVE. Medido en la tanda 6 sobre los pares de
//    paradas: 16 de 2.266, inflación p50 +49,0 m, factor máximo 26,4×.
//
// ⇒ Y el argumento que sostiene el diseño de H2a —*«el rodeo es peor en los
//   trayectos cortos, que son los del transbordo»*— sale de cuatro rutas de ~500 m.
//   233 metros en recta caben de sobra dentro de un tramo de calle. **Si alguna de
//   las cortas tiene las dos puntas en la misma arista, su rodeo lo infla el motor,
//   no la ciudad.**
//
// ⛔⛔ ESTO NO ARREGLA NADA. `src/grafo.js` no se toca: el arreglo mueve el grafo,
//    los 26 congelados, las diez rutas y la batería entera, y esa es una decisión
//    de Antonio. Aquí solo se MIDE.
//
// ⭐⭐ LEY 148 · SOBRE QUÉ GRAFO SE MIDE, y cómo se comprueba que es ése:
//    se construye con `R.construir(R.ZONA_TERMINO)` —la MISMA llamada de
//    `src/rutas-antonio.js:103`— y los puntos se resuelven con las MISMAS funciones
//    (`puntoDe`, `Pu.accesoA`, `Pu.rutaAEdificio`). Pero eso es una promesa, no una
//    prueba: **la prueba es que este script exige reproducir, ruta a ruta, los
//    metros Y la lista de aristas que publica el propio motor** con `--aristas`.
//    Si algo difiere en un metro o en un índice, PARA. Sin ese fichero no arranca.
//
//   node src/rutas-antonio.js --aristas   →  la línea ##ARISTAS##  →  fichero .json
//   node tools/grafo/misma-arista.js --motor <fichero.json>

'use strict';

const path = require('path');
const fs = require('fs');
const RAIZ = path.join(__dirname, '..', '..');
const req = (m) => require(path.join(RAIZ, 'src', m));

const A = req('alarma');
const R = req('ruta');
const G = req('grafo');
const D = req('direccion');
const P = req('portales');
const Pu = req('puerta');
const Co = req('condicionales');
const En = req('entradas');
const T = req('tabla-rutas');
const { dist } = req('geo');
const { puntoDe } = req('rutas-antonio');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(52) + ' ' + v);

/** Corta = por debajo de este umbral en LÍNEA RECTA. Declarado antes de medir. */
const CORTA_M = 1000;

/**
 * ⭐ La distancia andando POR la arista entre dos enganches de la misma arista.
 *    Se calcula igual que `insertar` calcula su `antes` (`src/grafo.js:204-206`),
 *    y es exactamente lo que `rutaEntre` NO sabe dar.
 * ⛔ No corrige el metraje de nadie: mide cuánto se infla.
 */
function alLargoDeLaArista(e, p) {
  let a = 0;
  for (let k = 0; k < p.seg; k++) {
    a += Math.hypot(e.pts[k + 1][0] - e.pts[k][0], e.pts[k + 1][1] - e.pts[k][1]);
  }
  a += p.t * Math.hypot(e.pts[p.seg + 1][0] - e.pts[p.seg][0], e.pts[p.seg + 1][1] - e.pts[p.seg][1]);
  return a;
}

// ── el artefacto del motor, OBLIGATORIO ──────────────────────────────────────
const iM = process.argv.indexOf('--motor');
if (iM === -1 || !process.argv[iM + 1]) {
  log('⛔ FALTA `--motor <fichero.json>`. Sin él este script no puede demostrar que');
  log('   mide sobre el grafo del motor, y entonces no mide nada: sería una segunda');
  log('   copia del cálculo, que es la forma exacta del fallo nº68.');
  log('   Se saca así:  node src/rutas-antonio.js --aristas | grep ##ARISTAS##');
  process.exit(2);
}
const MOTOR = JSON.parse(fs.readFileSync(process.argv[iM + 1], 'utf8'));
const delMotor = new Map(MOTOR.map((x) => [x.n, x]));

raya();
log('¿ESTÁ CONTAMINADO EL RODEO DE LAS RUTAS CORTAS? — las diez de Antonio, una a una');
raya();

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('P0 · ⭐ LEY 147 · QUÉ RESULTADO HARÍA FALLAR ESTA COMPROBACIÓN');
log('     (escrito aquí arriba, en el código, antes de que se ejecute una sola línea de medida)');
log('');
log('   1 · Si alguna ruta LARGA (recta ≥ ' + CORTA_M + ' m) sale «misma arista» → EL CONTROL HA');
log('       FALLADO. Una arista de más de un kilómetro con las dos puntas dentro no es');
log('       un tramo de calle: es un fallo del instrumento, y todo lo demás es ruido.');
log('   2 · Si mis metros o mi lista de aristas NO reproducen los del motor → estoy');
log('       midiendo sobre OTRO grafo. Se para y no se publica nada.');
log('   3 · Si `aristas[0]` no es la arista de enganche del origen, o la última no es');
log('       la del destino → mi modelo del camino es falso, y con él el veredicto.');
log('   4 · Si NINGUNA de las diez sale «misma arista», el resultado solo vale si el');
log('       instrumento ha demostrado antes que sabe verlo: por eso el nº3 de arriba');
log('       y por eso el tercer camino de P5.');

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P1 · EL GRAFO — ley 148: sobre cuál se mide, y por qué es el del motor');
raya('─');
const g = R.construir(R.ZONA_TERMINO);
const ctx = D.abrir(g, R.CRUDO);
const Ent = En.cargar();
di('llamada', 'R.construir(R.ZONA_TERMINO)  ⇐ la misma de src/rutas-antonio.js:103');
di('aristas · nodos', g.aristas.length + ' · ' + g.nodos.length);
di('componentes (mayor)', g.comp.n + '  (' + Math.max(...g.comp.tamanos) + ')');
di('portales enganchados', ctx.enganche.contadores.enganchados);
di('⛔ pasos condicionales', 'DENTRO del cálculo, como en el motor');

const tabla = T.leer();
const lect = T.informe(tabla);
if (!lect.cuadra) { log('   ⛔ la tabla de Antonio no cuadra. PARADA.'); process.exit(1); }
di('rutas leídas de la tabla de Antonio', tabla.rutas.length);

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ ESTO ES UNA COPIA DE LA ORQUESTACIÓN de `src/rutas-antonio.js:186-217`, y se
//    declara como tal: no es una segunda implementación del cálculo —las funciones
//    son las mismas— pero sí es una segunda copia del ORDEN en que se llaman.
//    ⭐ Lo que la legitima es P4: si la copia divergiera del original en un metro o
//    en un índice de arista, el cuadre se pone rojo y este script para.
// ═════════════════════════════════════════════════════════════════════════════
function resolver(ru) {
  const a = puntoDe(ru.o, ctx, g), b = puntoDe(ru.d, ctx, g);
  if (!a || !b) return { ok: false, motivo: 'sin-direccion' };
  const aP = a.tipo === 'POI' ? Pu.accesoA(a, g, ctx.eng, null, Ent) : a;
  const bP = b.tipo === 'POI' ? Pu.accesoA(b, g, ctx.eng, null, Ent) : b;
  const hayPuerta = !!(aP.puerta || bP.puerta);
  let resRuta = null, bR = null;
  if (bP.puerta) {
    const poli = Pu.edificioDe(b.m, Co.edificios());
    const rr = Pu.rutaAEdificio(G, g, aP, poli, ctx.eng, Ent);
    if (rr.encontrada) { resRuta = rr; bR = rr.puerta; }
  }
  const res = resRuta || (hayPuerta ? G.rutaEntre(g, aP, bP) : G.rutaEntre(g, a, b));
  const bFin = bR || bP;
  const oFin = hayPuerta ? aP : a;
  const recta = resRuta ? dist(aP.m, bR.m) : (hayPuerta ? dist(aP.m, bP.m) : dist(a.m, b.m));
  if (!res.encontrada) return { ok: false, motivo: 'sin-camino', recta, oFin, bFin };
  return { ok: true, res, oFin, bFin, recta, hayPuerta };
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P2 · LAS DIEZ — ¿las dos puntas en la MISMA arista?');
raya('─');
log('   ' + 'nº'.padEnd(4) + 'origen → destino'.padEnd(44) + 'ar.origen'.padStart(10)
  + 'ar.dest'.padStart(10) + '   ¿MISMA?  ' + 'recta'.padStart(9) + 'ruta'.padStart(9)
  + 'rodeo'.padStart(8) + '  clase');

const filas = [];
for (const ru of tabla.rutas) {
  const r = resolver(ru);
  if (!r.ok) {
    filas.push({ ru, ok: false, motivo: r.motivo });
    log('   ' + String(ru.n).padEnd(4) + (ru.o + ' → ' + ru.d).slice(0, 43).padEnd(44)
      + '⛔ ' + r.motivo);
    continue;
  }
  const iA = r.oFin.arista, iB = r.bFin.arista;
  const misma = iA === iB;
  const rodeo = r.res.metros / r.recta;
  const clase = r.recta < CORTA_M ? 'CORTA' : 'LARGA';
  const f = { ru, ok: true, iA, iB, misma, rodeo, metros: r.res.metros, recta: r.recta,
    clase, res: r.res, oFin: r.oFin, bFin: r.bFin };
  if (misma) {
    const e = g.aristas[iA];
    f.verdad = Math.abs(alLargoDeLaArista(e, r.oFin) - alLargoDeLaArista(e, r.bFin));
    f.rodeoReal = f.verdad / r.recta;
    f.factor = f.verdad > 0.001 ? r.res.metros / f.verdad : null;
    f.precision = e.precision;
    f.largoArista = e.largo;
  }
  filas.push(f);
  log('   ' + String(ru.n).padEnd(4) + (ru.o + ' → ' + ru.d).slice(0, 43).padEnd(44)
    + String(iA).padStart(10) + String(iB).padStart(10)
    + (misma ? '   ⛔ SÍ    ' : '   ✅ no    ')
    + r.recta.toFixed(0).padStart(9) + r.res.metros.toFixed(0).padStart(9)
    + rodeo.toFixed(2).padStart(8) + '  ' + clase);
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · ⭐⭐ EL CONTROL POSITIVO — las LARGAS');
raya('─');
const largas = filas.filter((f) => f.ok && f.clase === 'LARGA');
const cortas = filas.filter((f) => f.ok && f.clase === 'CORTA');
di('umbral declarado antes de medir', 'recta < ' + CORTA_M + ' m ⇒ CORTA');
di('largas · cortas', largas.length + ' · ' + cortas.length);
di('largas: rectas', largas.map((f) => f.recta.toFixed(0) + ' m').join(' · ') || '—');
di('largas con «misma arista»', largas.filter((f) => f.misma).length
  + (largas.some((f) => f.misma) ? '   ⛔⛔ EL CONTROL HA FALLADO' : '   ✅ ninguna, como debe ser'));
A.exige(largas.length > 0, 'no hay ninguna ruta larga: sin control no hay medida');
A.exige(!largas.some((f) => f.misma),
  'una ruta LARGA sale con las dos puntas en la misma arista: el instrumento está roto');
log('');
log('   ⭐ Y qué demuestra este control, exactamente: que «misma arista» NO es una');
log('     etiqueta que se pegue sola. Una arista del grafo mide, de mediana, unas');
log('     decenas de metros; que ninguna ruta de kilómetros la dispare es lo que');
log('     distingue una medida de un sello.');

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · ⭐⭐ EL CUADRE CONTRA EL MOTOR — ley 148, la parte que no es una promesa');
raya('─');
log('   ' + 'nº'.padEnd(4) + 'metros aquí'.padStart(13) + 'metros motor'.padStart(14)
  + '  aristas'.padEnd(12) + 'aristas[0]=enganche'.padStart(21) + '  aristas[-1]=enganche');
let cuadran = 0, comparadas = 0;
for (const f of filas) {
  if (!f.ok) continue;
  const m = delMotor.get(f.ru.n);
  if (!m) { log('   ' + String(f.ru.n).padEnd(4) + '⚠️ el motor no publica esta ruta'); continue; }
  comparadas++;
  const igualM = Math.abs(m.metros - f.metros) < 0.05;
  const igualA = JSON.stringify(m.aristas) === JSON.stringify(f.res.aristas);
  const pri = f.res.aristas[0] === f.iA;
  const ult = f.res.aristas[f.res.aristas.length - 1] === f.iB;
  if (igualM && igualA && pri && ult) cuadran++;
  log('   ' + String(f.ru.n).padEnd(4) + f.metros.toFixed(1).padStart(13) + m.metros.toFixed(1).padStart(14)
    + ('  ' + (igualA ? '✅ idénticas' : '⛔ DIFIEREN')).padEnd(14)
    + (pri ? '✅' : '⛔').padStart(12) + (ult ? '            ✅' : '            ⛔'));
  A.exige(igualM, `la ruta nº${f.ru.n}: mido ${f.metros} m y el motor publica ${m.metros} m`);
  A.exige(igualA, `la ruta nº${f.ru.n}: mi lista de aristas no es la del motor`);
  A.exige(pri, `la ruta nº${f.ru.n}: aristas[0] no es la arista de enganche del origen`);
  A.exige(ult, `la ruta nº${f.ru.n}: la última arista no es la de enganche del destino`);
}
log('');
di('rutas que cuadran con el motor', cuadran + ' de ' + comparadas);

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P5 · ⭐ LEY 149 · EL TERCER CAMINO — leído SOLO del artefacto del motor');
raya('─');
log('   No usa mi enganche ni mi grafo: usa la lista de aristas que el motor publica.');
log('   Si las dos puntas caen en la misma arista, la primera y la última entrada de');
log('   esa lista tienen que ser el MISMO índice — porque `insertar` etiqueta los dos');
log('   enlaces del nodo temporal con `e: p.arista` (`src/grafo.js:211`).');
log('');
log('   ' + 'nº'.padEnd(4) + 'aristas[0]'.padStart(12) + 'aristas[-1]'.padStart(13)
  + '  nº de aristas'.padEnd(16) + 'veredicto del motor solo' + '     ¿coincide conmigo?');
for (const m of MOTOR) {
  const pri = m.aristas[0], ult = m.aristas[m.aristas.length - 1];
  const vTercero = pri === ult;
  const mia = filas.find((f) => f.ru.n === m.n);
  const acuerdo = mia && mia.ok ? (vTercero === mia.misma) : null;
  log('   ' + String(m.n).padEnd(4) + String(pri).padStart(12) + String(ult).padStart(13)
    + ('  ' + m.aristas.length).padEnd(16)
    + (vTercero ? '⛔ MISMA ARISTA'.padEnd(26) : '✅ aristas distintas'.padEnd(26))
    + (acuerdo === null ? '—' : acuerdo ? '✅ sí' : '⛔ NO'));
  if (mia && mia.ok) {
    A.exige(vTercero === mia.misma,
      `la ruta nº${m.n}: el artefacto del motor y mi enganche no dicen lo mismo sobre «misma arista»`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P6 · ⛔⛔ LAS CONTAMINADAS — los dos números al lado, y el factor');
raya('─');
const malas = filas.filter((f) => f.ok && f.misma);
if (!malas.length) {
  log('   ✅ NINGUNA de las diez tiene las dos puntas en la misma arista.');
  log('   ⭐ Y eso vale porque el instrumento ha enseñado que sabe verlo: P4 demuestra');
  log('     que mido sobre el grafo del motor, P5 lo confirma desde su propio artefacto,');
  log('     y P3 enseña que la etiqueta no se pega sola.');
} else {
  log('   ' + 'nº'.padEnd(4) + 'clase'.padEnd(7) + 'recta'.padStart(9) + 'motor'.padStart(10)
    + 'verdad'.padStart(10) + 'infla'.padStart(9) + 'factor'.padStart(8)
    + '   rodeo publ.'.padEnd(15) + 'rodeo real');
  for (const f of malas) {
    log('   ' + String(f.ru.n).padEnd(4) + f.clase.padEnd(7) + f.recta.toFixed(0).padStart(9)
      + f.metros.toFixed(0).padStart(10) + f.verdad.toFixed(1).padStart(10)
      + ('+' + (f.metros - f.verdad).toFixed(0)).padStart(9)
      + (f.factor === null ? '—' : f.factor.toFixed(1) + '×').padStart(8)
      + ('   ' + f.rodeo.toFixed(2)).padEnd(15) + f.rodeoReal.toFixed(2));
    log('        arista ' + f.iA + ' · ' + f.precision + ' · largo ' + f.largoArista.toFixed(1) + ' m');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P7 · ⭐⭐ LA TABLA DE RODEOS RECALCULADA — cuáles se mueven y cuáles no');
raya('─');
log('   ' + 'nº'.padEnd(4) + 'clase'.padEnd(7) + 'recta'.padStart(9) + 'rodeo publicado'.padStart(17)
  + 'rodeo real'.padStart(12) + '  ¿se mueve?      tope de Antonio');
for (const f of filas) {
  if (!f.ok) { log('   ' + String(f.ru.n).padEnd(4) + '⛔ ' + f.motivo); continue; }
  const real = f.misma ? f.rodeoReal : f.rodeo;
  const mueve = Math.abs(real - f.rodeo) > 0.005;
  log('   ' + String(f.ru.n).padEnd(4) + f.clase.padEnd(7) + f.recta.toFixed(0).padStart(9)
    + f.rodeo.toFixed(2).padStart(17) + real.toFixed(2).padStart(12)
    + (mueve ? '  ⛔ SÍ            ' : '  ✅ clavado       ')
    + (f.ru.rodeoMax === null ? 'NO CONSTA' : '≤ ' + f.ru.rodeoMax.toFixed(2))
    + (real <= (f.ru.rodeoMax === null ? Infinity : f.ru.rodeoMax) ? '' : '   ⚠️ FUERA'));
}

log('');
const mediaC = (xs) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
const rodeoDe = (f) => (f.misma ? f.rodeoReal : f.rodeo);
const mC = mediaC(cortas.map(rodeoDe)), mL = mediaC(largas.map(rodeoDe));
const mCpub = mediaC(cortas.map((f) => f.rodeo)), mLpub = mediaC(largas.map((f) => f.rodeo));
di('rodeo medio CORTAS · publicado → real', (mCpub === null ? '—' : mCpub.toFixed(2)) + ' → '
  + (mC === null ? '—' : mC.toFixed(2)));
di('rodeo medio LARGAS · publicado → real', (mLpub === null ? '—' : mLpub.toFixed(2)) + ' → '
  + (mL === null ? '—' : mL.toFixed(2)));
di('cortas máx · largas máx (real)', Math.max(...cortas.map(rodeoDe)).toFixed(2)
  + ' · ' + Math.max(...largas.map(rodeoDe)).toFixed(2));

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL POSITIVO DE CONTROL — LEY 4: TODO CERO SE DEMUESTRA CON UN POSITIVO.
//
// P3 es un control NEGATIVO: enseña que la etiqueta no se pega donde no debe. No
// enseña que se pegue donde sí. Un `iA === iB` que nunca ha dado `true` sobre
// datos reales es una promesa, no un instrumento (ley 3 de los guardianes).
//
// ⇒ Aquí se busca en el CALLEJERO REAL —los 46.150 portales, el mismo dato del
//   que salen los orígenes y destinos de las diez— pares de direcciones que SÍ
//   comparten arista, y se pasan por el mismo camino de código.
// ⛔ Y de paso responde a la pregunta que el «no» deja abierta: ¿se salvaron las
//   cuatro cortas por suerte, o porque el defecto vive en otro rango?
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P8 · ⭐⭐⭐ EL POSITIVO DE CONTROL — dos direcciones REALES que SÍ comparten arista');
raya('─');

const porArista = new Map();
for (const o of ctx.enganche.portales) {
  if (!o.enganchado) continue;
  if (!porArista.has(o.arista)) porArista.set(o.arista, []);
  porArista.get(o.arista).push(o);
}
let nAristasCompartidas = 0, nPares = 0;
const separaciones = [];
const paresCompartidos = [];
for (const [ia, lista] of porArista) {
  if (lista.length < 2) continue;
  nAristasCompartidas++;
  const e = g.aristas[ia];
  const conPos = lista.map((o) => ({ o, s: alLargoDeLaArista(e, o) })).sort((a, b) => a.s - b.s);
  for (let i = 0; i < conPos.length; i++) {
    for (let j = i + 1; j < conPos.length; j++) {
      nPares++;
      separaciones.push(conPos[j].s - conPos[i].s);
      paresCompartidos.push({ ia, a: conPos[i], b: conPos[j] });
    }
  }
}
separaciones.sort((a, b) => a - b);
const pc = (q) => separaciones[Math.min(separaciones.length - 1, Math.floor(separaciones.length * q))];
di('portales enganchados', ctx.enganche.contadores.enganchados);
di('aristas con 2 o más portales', nAristasCompartidas);
di('⭐ PARES DE DIRECCIONES QUE COMPARTEN ARISTA', nPares.toLocaleString('es-ES'));
A.exige(nPares > 0, 'no existe ni un par de portales sobre la misma arista: sin positivo no hay cero');
di('separación real entre ellos (por la arista)', separaciones.length
  ? `p50 ${pc(0.5).toFixed(1)} m · p90 ${pc(0.9).toFixed(1)} m · p99 ${pc(0.99).toFixed(1)} m · máx ${separaciones[separaciones.length - 1].toFixed(1)} m`
  : '—');

// ⭐ LA MUESTRA, Y SU CRITERIO — declarado y determinista. ⛔ No se eligen «los
//   buenos»: se ordenan por índice de arista y se toman los seis primeros. Elegir
//   la muestra mirando el resultado es fabricar el resultado.
const MUESTRA = 6;
paresCompartidos.sort((x, y) => x.ia - y.ia || x.a.s - y.a.s);
const control = paresCompartidos.slice(0, MUESTRA);
log('');
log('   ⭐ muestra: los ' + MUESTRA + ' primeros por índice de arista. Determinista, NO elegida.');
log('');
log('   ' + 'arista'.padStart(8) + '   ' + 'dirección A'.padEnd(30) + 'dirección B'.padEnd(30)
  + 'motor'.padStart(9) + 'verdad'.padStart(9) + 'factor'.padStart(8) + '  ¿lo ve?');
let vistos = 0;
for (const p of control) {
  const r = G.rutaEntre(g, p.a.o, p.b.o);
  const verdad = p.b.s - p.a.s;
  const lo = p.a.o.arista === p.b.o.arista;         // el mismo veredicto de P2
  if (lo) vistos++;
  const nom = (o) => ((o.via && o.via.nombre ? o.via.nombre : '?') + ' ' + o.numero).slice(0, 29);
  log('   ' + String(p.ia).padStart(8) + '   ' + nom(p.a.o).padEnd(30) + nom(p.b.o).padEnd(30)
    + (r.encontrada ? r.metros.toFixed(1) : '—').padStart(9) + verdad.toFixed(1).padStart(9)
    + (r.encontrada && verdad > 0.001 ? (r.metros / verdad).toFixed(1) + '×' : '—').padStart(8)
    + (lo ? '   ⛔ SÍ' : '   ✅ no'));
  A.exige(lo, `el positivo de control falla: ${nom(p.a.o)} y ${nom(p.b.o)} comparten la arista `
    + `${p.ia} y el instrumento dice que no`);
  A.exige(!r.encontrada || r.metros >= verdad - 0.05,
    `el motor da ${r.metros} m donde la verdad por la arista son ${verdad.toFixed(1)} m: imposible`);
}
log('');
di('⇒ el instrumento ve el SÍ', vistos + ' de ' + control.length
  + (vistos === control.length ? '   ✅ SABE DECIR QUE SÍ' : '   ⛔⛔ NO SABE VERLO — el cero de P6 no vale'));

// ── y la pregunta que el «no» deja abierta ──────────────────────────────────
log('');
log('   ⭐⭐ ¿SUERTE O RANGO? — dónde vive el defecto, contra dónde viven las cortas');
di('separación de los pares contaminables · p99 · máx', separaciones.length
  ? pc(0.99).toFixed(0) + ' m · ' + separaciones[separaciones.length - 1].toFixed(0) + ' m' : '—');
log('');
log('   ' + 'nº'.padEnd(4) + 'recta de la corta'.padStart(18)
  + '   pares REALES que comparten arista y están AL MENOS igual de separados');
for (const f of cortas.slice().sort((a, b) => a.recta - b.recta)) {
  const n = separaciones.filter((s) => s >= f.recta).length;
  log('   ' + String(f.ru.n).padEnd(4) + (f.recta.toFixed(0) + ' m').padStart(18)
    + '   ' + String(n).padStart(6) + ' de ' + nPares + '  (' + (100 * n / nPares).toFixed(1) + ' %)');
}
log('');
log('   ⇒ ⛔ Si esa columna NO es cero, las cuatro cortas NO se salvaron «por ser');
log('     largas para el defecto»: el defecto llega hasta su rango y no las tocó.');
log('   ⚠️ `NO CONSTA` la PROBABILIDAD: para decir «una de cada N» haría falta el');
log('     denominador —todos los pares de portales a esa distancia—, y no se ha');
log('     medido en esta tanda. Lo que sí consta es que el rango alcanza.');

log('');
raya();
log(A.cierre('¿CONTAMINADO EL RODEO DE LAS CORTAS?'));
