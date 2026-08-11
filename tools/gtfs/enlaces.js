// ⭐⭐⭐ H2a · TANDA 7 · PUERTA 2 — LOS 2.538 ENLACES A PIE
//
// ═════════════════════════════════════════════════════════════════════════════
// LO QUE ESTO CONSTRUYE, Y POR QUÉ ES LA PIEZA DEL PROYECTO
// ═════════════════════════════════════════════════════════════════════════════
//   El feed no trae `transfers.txt`, ni `pathways.txt`, ni un solo
//   `parent_station`, y bus y tranvía no comparten NI UNA parada de 984. ⇒ **todo
//   enlace entre modos es un tramo A PIE**. Los routers sin grafo peatonal lo
//   resuelven con un radio a vuelo de pájaro; aquí se anda el grafo.
//
//   2.266 pares bus×bus  +  272 pares bus↔tranvía  =  2.538
//
// ⭐ EL COSTE SE GUARDA EN METROS, NO EN MINUTOS (decisión D2 del diseño): la
//    velocidad de H1 está medida como BANDA (4,3–4,5 km/h para Antonio, 5,0 km/h
//    estándar en el buscador). Guardar minutos convertiría una banda en un dato
//    falso-preciso, y quien lo leyera después no sabría que lo era.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL VEREDICTO VA EN DOS CAMPOS, Y NO EN UNO
// ═════════════════════════════════════════════════════════════════════════════
//   La Puerta 1 midió que **28 de 67 enlaces `ACERA` (41,8 %) eran NO DECIDIBLES**.
//   Una categoría con dos poblaciones de ese tamaño dentro no es una categoría:
//   son dos con un nombre puesto encima. Y hay algo peor: **53 de 324 tienen las
//   dos puntas en eje, y eso NO es ignorancia — es conocimiento firme.** Sabemos
//   que ahí no hay lados. Meterlo en el mismo saco que los 28 aplasta *«sé que no
//   hay»* con *«no sé si hay»*, que son lo contrario.
//
//      CAMINO   por dónde va el camino      hecho del GRAFO
//      LADO     qué sabemos de sus lados    hecho de NUESTRO CONOCIMIENTO
//
//   ⛔ Y no se hace un solo campo con más valores porque 4 × 5 = **20 etiquetas
//     compuestas**, y **cada nombre es una oportunidad de que alguien lea algo que
//     el instrumento no sabe** (ley 157). `CRUZA CALLADO` era UNA y casi se cuela.
//   ⭐ Y el argumento de coste: el listón de cobertura (`≥4 portales · 75 %`) es
//     una decisión pendiente. Con dos campos, el día que cambie **solo se
//     recalcula el segundo**. Con uno, hay que reetiquetar los 2.538 enteros.
//
//   node tools/gtfs/enlaces.js

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const D = require('../../src/direccion');
const Ac = require('../../src/acera-equivocada');
const { cargar } = require('./feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);

/** El radio del pre-filtro (§4 del diseño). ⛔ Es un PRE-FILTRO: el coste son los metros. */
const RADIO_M = 300;

/** Lo que ya está publicado y este script tiene que reencontrar antes de hablar. */
const PUBLICADO = { paradasBus: 934, paradasTranvia: 50, bxb: 2266, bt: 272, total: 2538,
  aristasConLado: 2397, contradicen: 18, muestra: 324, sinEje324: 69, soloEje324: 33 };

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LOS DOS CAMPOS, Y LA PRUEBA DE LA LEY 157 PASADA A CADA NOMBRE
//
//   La prueba: *¿puede un lector que solo ve la etiqueta concluir algo que el
//   instrumento no sabe?* Si sí, se renombra ANTES de publicarse.
//
//   CAMPO «CAMINO» — sale de la clase D4 de las aristas que recorre
//     sin-eje                  ninguna arista del camino es eje de calzada
//                              ⚠️ se llamó `acera` y NO PASA la prueba: un lector
//                              concluye «va por la acera correcta», que es justo
//                              lo que la Puerta 1 demostró que no se sabe.
//     mixto                    unas aristas son eje y otras no
//     solo-eje                 todas las aristas del camino son eje de calzada
//     sin-camino-en-el-grafo   ⚠️ se llamó `sin-camino` y NO PASA: un lector
//                              concluye «no se puede ir andando». Lo que se sabe
//                              es que ESTE GRAFO no encuentra camino, que es otra
//                              cosa — el grafo tiene 170 componentes.
//
//   CAMPO «LADO» — sale de la tabla de paridad de `src/acera-equivocada.js`
//     sin-lados-en-el-grafo    ⭐ CONOCIMIENTO FIRME: ni una arista del camino es
//                              de una clase que pueda tener lado. ⚠️ se llamó
//                              `sin-lados` y NO PASA: la calle real sí puede tener
//                              dos aceras; lo que no las tiene es el dibujo.
//     no-consta                ⚠️ IGNORANCIA: hay aristas que podrían tener lado y
//                              ninguna llega al listón. ⛔ Es lo contrario del
//                              anterior y por eso son dos valores y no uno.
//     no-cambia-de-lado        ⚠️ se llamó `mismo-lado` y NO PASA: un lector
//                              concluye «empieza en la acera correcta», y eso NO
//                              se mide. Lo que se mide es que no cambia.
//     cambia-con-paso          cambia de lado y pasa por un paso de peatones
//     cambia-sin-paso          cambia de lado sin pasar por ninguno. ⚠️ se llamó
//                              `cruza-callado` y NO PASA: doblar una esquina
//                              cambia de acera sin paso y es legítimo.
// ═════════════════════════════════════════════════════════════════════════════
const ES_EJE = Ac.ES_EJE;
/** ⭐ Las únicas clases que pueden llevar un lado. Un paso de peatones cruza la
 *  calle —no tiene lado— y unas escaleras tampoco. Medido en la Puerta 1: de las
 *  dos salieron 0 aristas con lado decidible sobre 11.303. */
const PUEDE_TENER_LADO = new Set(['acera', 'peatonal']);
const ES_PASO = (e) => e.precision === 'paso-de-peatones';

const R_TIERRA = 6371000, RAD = Math.PI / 180;
const recta = (a, b) => {
  const x = (b.lon - a.lon) * RAD * Math.cos((a.lat + b.lat) / 2 * RAD);
  const y = (b.lat - a.lat) * RAD;
  return Math.hypot(x, y) * R_TIERRA;
};
const pctl = (s, q) => s[Math.min(s.length - 1, Math.floor(s.length * q))];
const rep = (xs, u = ' m', d = 0) => {
  const s = xs.slice().sort((a, b) => a - b);
  return `mín ${s[0].toFixed(d)}${u} · p50 ${pctl(s, 0.5).toFixed(d)}${u} · p90 ${pctl(s, 0.9).toFixed(d)}${u}`
    + ` · p99 ${pctl(s, 0.99).toFixed(d)}${u} · máx ${s[s.length - 1].toFixed(d)}${u}`;
};

raya();
log('LOS 2.538 ENLACES A PIE — el veredicto en DOS campos: CAMINO y LADO');
raya();

const g = R.construir(R.ZONA_TERMINO);
const ctx = D.abrir(g, R.CRUDO);
di('grafo (ley 148)', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');
di('aristas · portales enganchados', g.aristas.length + ' · ' + ctx.enganche.contadores.enganchados);

// ── la tabla de lados, y su cuadre con la Puerta 1 ───────────────────────────
const tabla = Ac.paridadDeAristas(ctx.enganche.portales, g.aristas);
const ladoDe = new Map(); const contradicen = new Set();
for (const x of tabla.values()) {
  if (!x.dominante) continue;
  if (ES_EJE.has(x.precision)) continue;               // ⛔ un eje no tiene lado
  if (!PUEDE_TENER_LADO.has(x.precision)) continue;
  if (ladoDe.has(x.arista) && ladoDe.get(x.arista) !== x.dominante) { contradicen.add(x.arista); continue; }
  ladoDe.set(x.arista, x.dominante);
}
for (const ia of contradicen) ladoDe.delete(ia);
di('aristas con LADO decidible', ladoDe.size + '  (la Puerta 1 publicó 1.361 de acera+peatonal)');
di('aristas donde dos vías se contradicen', contradicen.size);

// ═════════════════════════════════════════════════════════════════════════════
// P0 · EL UNIVERSO, Y SU CUADRE CON LO PUBLICADO
// ═════════════════════════════════════════════════════════════════════════════
const { stops, modo, lineasDe, feedInfo } = cargar();
const mk = (s) => ({ id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
  lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
  lineas: lineasDe.get(s.stop_id) || new Set() });
const BUS = stops.filter((s) => modo.get(s.stop_id) === 'bus').map(mk);
const TRA = stops.filter((s) => modo.get(s.stop_id) === 'tranvia').map(mk);
for (const p of BUS.concat(TRA)) {
  p.eng = R.engancharPunto(g, p.lat, p.lon, 'parada');
  p.precision = g.aristas[p.eng.arista].precision;
  p.comp = g.comp.comp[g.aristas[p.eng.arista].a];
}
const pares = [];
for (let i = 0; i < BUS.length; i++) {
  for (let j = i + 1; j < BUS.length; j++) {
    if (recta(BUS[i], BUS[j]) > RADIO_M) continue;
    let aporta = false;
    for (const x of BUS[j].lineas) if (!BUS[i].lineas.has(x)) { aporta = true; break; }
    if (!aporta) for (const x of BUS[i].lineas) if (!BUS[j].lineas.has(x)) { aporta = true; break; }
    if (aporta) pares.push({ a: BUS[i], b: BUS[j], clase: 'bus×bus' });
  }
}
// ⛔ bus↔tranvía NO lleva el filtro de «línea nueva»: bus y tranvía no comparten
//    ni una línea, así que TODOS aportan. Aplicarlo sería una condición que nunca
//    puede fallar, y una condición que no puede fallar no filtra: decora.
for (const b of BUS) for (const t of TRA) {
  if (recta(b, t) <= RADIO_M) pares.push({ a: b, b: t, clase: 'bus↔tranvía' });
}
const nBxB = pares.filter((p) => p.clase === 'bus×bus').length;
const nBT = pares.length - nBxB;
log('');
raya('─');
log('P0 · EL UNIVERSO — y el cuadre con lo que el proyecto ya tiene publicado');
raya('─');
di('paradas de bus · de tranvía', BUS.length + ' · ' + TRA.length);
di('pares bus×bus', nBxB + '   (publicado ' + PUBLICADO.bxb + ')');
di('pares bus↔tranvía', nBT + '   (publicado ' + PUBLICADO.bt + ')');
di('⭐ TOTAL', pares.length + '   (publicado ' + PUBLICADO.total + ')');
A.exige(BUS.length === PUBLICADO.paradasBus, `las paradas de bus salen ${BUS.length}`);
A.exige(TRA.length === PUBLICADO.paradasTranvia, `las paradas de tranvía salen ${TRA.length}`);
A.exige(nBxB === PUBLICADO.bxb, `los pares bus×bus salen ${nBxB} y está publicado ${PUBLICADO.bxb}`);
A.exige(nBT === PUBLICADO.bt, `los pares bus↔tranvía salen ${nBT} y está publicado ${PUBLICADO.bt}`);
A.exige(pares.length === PUBLICADO.total, `el total sale ${pares.length}`);

// ═════════════════════════════════════════════════════════════════════════════
// P1 · EL CÁLCULO
// ═════════════════════════════════════════════════════════════════════════════
function clasificar(p) {
  const o = { rectaM: recta(p.a, p.b) };
  if (p.a.comp !== p.b.comp) return { ...o, camino: 'sin-camino-en-el-grafo', lado: 'no-consta', r: null };
  const r = G.rutaEntre(g, p.a.eng, p.b.eng);
  if (!r || !r.encontrada) return { ...o, camino: 'sin-camino-en-el-grafo', lado: 'no-consta', r: null };
  let ejes = 0, pasos = 0, conLado = 0, puedeLado = 0;
  const lados = [];
  for (const ia of r.aristas) {
    const e = g.aristas[ia];
    if (ES_EJE.has(e.precision)) ejes++;
    if (ES_PASO(e)) pasos++;
    if (PUEDE_TENER_LADO.has(e.precision)) puedeLado++;
    const l = ladoDe.get(ia);
    if (l) { conLado++; if (lados[lados.length - 1] !== l) lados.push(l); }
  }
  // ⭐⭐ LA RECTA ENTRE LOS ENGANCHES, que es la que de verdad acota la ruta.
  //   ⛔ `o.rectaM` va de PARADA a PARADA, y el camino andado NO pasa por las
  //     paradas: pasa por sus proyecciones sobre el grafo. Comparar la ruta con la
  //     recta entre paradas produce rodeos por debajo de 1 que no son imposibles:
  //     son dos medidas entre puntos distintos. (bitácora nº189)
  const rectaEng = Math.hypot(p.a.eng.q[0] - p.b.eng.q[0], p.a.eng.q[1] - p.b.eng.q[1]);
  const camino = ejes === 0 ? 'sin-eje' : (ejes === r.aristas.length ? 'solo-eje' : 'mixto');
  let lado;
  if (puedeLado === 0) lado = 'sin-lados-en-el-grafo';
  else if (conLado === 0) lado = 'no-consta';
  else if (lados.length < 2) lado = 'no-cambia-de-lado';
  else lado = pasos > 0 ? 'cambia-con-paso' : 'cambia-sin-paso';
  return { ...o, camino, lado, r, ejes, pasos, conLado, puedeLado, rectaEng,
    engA: p.a.eng.d, engB: p.b.eng.d,
    mismaArista: p.a.eng.arista === p.b.eng.arista };
}

const T0 = Date.now();
const res = pares.map((p) => ({ p, ...clasificar(p) }));
di('tiempo del cálculo', ((Date.now() - T0) / 1000).toFixed(1) + ' s');

// ═════════════════════════════════════════════════════════════════════════════
// P2 · LA TABLA CRUZADA
// ═════════════════════════════════════════════════════════════════════════════
const CAMINOS = ['sin-eje', 'mixto', 'solo-eje', 'sin-camino-en-el-grafo'];
const LADOS = ['no-cambia-de-lado', 'cambia-con-paso', 'cambia-sin-paso', 'no-consta', 'sin-lados-en-el-grafo'];
function cruzada(lista, titulo) {
  log('');
  log('   ' + titulo);
  log('   ' + 'CAMINO \\ LADO'.padEnd(24) + LADOS.map((l) => l.slice(0, 13).padStart(15)).join('') + 'TOTAL'.padStart(9));
  for (const c of CAMINOS) {
    const fila = LADOS.map((l) => lista.filter((r) => r.camino === c && r.lado === l).length);
    const t = fila.reduce((s, x) => s + x, 0);
    if (t === 0 && c !== 'sin-camino-en-el-grafo') continue;
    log('   ' + c.padEnd(24) + fila.map((x) => String(x).padStart(15)).join('') + String(t).padStart(9));
  }
  const tot = LADOS.map((l) => lista.filter((r) => r.lado === l).length);
  log('   ' + 'TOTAL'.padEnd(24) + tot.map((x) => String(x).padStart(15)).join('') + String(lista.length).padStart(9));
}
log('');
raya('─');
log('P2 · ⭐⭐ LA TABLA CRUZADA — CAMINO × LADO');
raya('─');
cruzada(res, 'LOS 2.538 ENTEROS');

// ── la muestra de 324 de H2·6, reetiquetada, para comparar con lo publicado ──
const soloBxB = res.filter((r) => r.p.clase === 'bus×bus');
const K = Math.max(1, Math.floor(soloBxB.length / 300));
const m324 = soloBxB.filter((_, i) => i % K === 0);
cruzada(m324, 'LA MUESTRA DE 324 DE H2·6, REETIQUETADA  (1 de cada ' + K + ' ⇒ ' + m324.length + ')');
{
  const sinEje = m324.filter((r) => r.camino === 'sin-eje').length;
  const soloEje = m324.filter((r) => r.camino === 'solo-eje').length;
  log('');
  di('control: sin-eje en la muestra', sinEje + '   (H2·6 publicó ' + PUBLICADO.sinEje324 + ' caminos sin ni una arista de eje)');
  di('control: solo-eje en la muestra', soloEje + '   (H2·6 publicó ' + PUBLICADO.soloEje324 + ' caminos enteros por eje)');
  A.exige(m324.length === PUBLICADO.muestra, `la muestra sale ${m324.length} y H2·6 publicó ${PUBLICADO.muestra}`);
  A.exige(sinEje === PUBLICADO.sinEje324, `sin-eje sale ${sinEje} y H2·6 publicó ${PUBLICADO.sinEje324}`);
  A.exige(soloEje === PUBLICADO.soloEje324, `solo-eje sale ${soloEje} y H2·6 publicó ${PUBLICADO.soloEje324}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 · LOS REPARTOS, Y LA COBERTURA DE CADA CAMPO
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · EL REPARTO DE CADA CAMPO SOBRE LOS 2.538');
raya('─');
for (const [nombre, vals] of [['CAMINO', CAMINOS], ['LADO', LADOS]]) {
  log('   ' + nombre);
  for (const v of vals) {
    const n = res.filter((r) => r[nombre.toLowerCase()] === v).length;
    log('      ' + v.padEnd(26) + String(n).padStart(6) + '   ' + (100 * n / res.length).toFixed(1).padStart(5) + ' %');
  }
  log('');
}
{
  const sc = res.filter((r) => r.camino === 'sin-camino-en-el-grafo');
  di('⛔ SIN CAMINO EN EL GRAFO', sc.length + ' de ' + res.length);
  // ⭐⭐ LEY 156: un cero se publica con su cobertura Y su provocación, o no se
  //   publica. Si no ha salido ninguno, se provoca a propósito.
  if (sc.length === 0) {
    const fuera = BUS.concat(TRA).filter((p) => p.comp !== g.comp.comp[0]);
    log('      ⚠️ CERO. Y un cero no se publica solo: se provoca. Buscando dos paradas');
    log('        de componentes distintas para enseñar que el veredicto existe…');
    let hecho = false;
    for (let i = 0; i < BUS.length && !hecho; i++) {
      for (let j = i + 1; j < BUS.length && !hecho; j++) {
        if (BUS[i].comp === BUS[j].comp) continue;
        const c = clasificar({ a: BUS[i], b: BUS[j] });
        log('      ✅ PROVOCADO: "' + BUS[i].code + '" × "' + BUS[j].code + '" ⇒ ' + c.camino);
        A.exige(c.camino === 'sin-camino-en-el-grafo', 'el veredicto sin-camino no se puede provocar');
        hecho = true;
      }
    }
    if (!hecho) log('      ⛔ NO SE HA PODIDO PROVOCAR — ' + fuera.length + ' paradas fuera de la componente mayor');
  } else {
    for (const r of sc.slice(0, 8)) {
      log('      "' + r.p.a.code + '" ' + r.p.a.nombre.slice(0, 24).padEnd(25)
        + '"' + r.p.b.code + '" ' + r.p.b.nombre.slice(0, 24).padEnd(25)
        + 'recta ' + r.rectaM.toFixed(0) + ' m   comp ' + r.p.a.comp + ' ≠ ' + r.p.b.comp);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// P4 · LA DISTRIBUCIÓN DE METROS, Y EL RODEO
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · LOS METROS — distribución, no media');
raya('─');
const conRuta = res.filter((r) => r.r);
const metros = conRuta.map((r) => r.r.metros);
const rodeos = conRuta.filter((r) => r.rectaM > 1).map((r) => r.r.metros / r.rectaM);
di('enlaces con camino', conRuta.length + ' de ' + res.length);
di('metros andando', rep(metros));
di('línea recta ENTRE PARADAS (el pre-filtro)', rep(conRuta.map((r) => r.rectaM)));
di('línea recta ENTRE ENGANCHES', rep(conRuta.map((r) => r.rectaEng)));
di('⚠️ hueco parada → grafo', rep(conRuta.flatMap((r) => [r.engA, r.engB]), ' m', 1));
log('');
log('   ⭐⭐ HAY DOS RODEOS Y NO SON EL MISMO, y confundirlos costó un rojo (bitácora nº189):');
log('     · el CONSULTADO va de parada a parada — es lo que el usuario pide, y es el');
log('       comparable con las rutas de Antonio. ⚠️ PUEDE bajar de 1 sin que nada esté');
log('       roto: el camino andado no incluye el hueco de la parada al grafo.');
log('     · el DEL CAMINO va de enganche a enganche — son las dos puntas que el motor');
log('       une de verdad. ⛔ Éste NO puede bajar de 1, y es donde vive el guardián.');
di('⭐ RODEO CONSULTADO (parada→parada)', rep(rodeos, '×', 2));
{
  const rodEng = conRuta.filter((r) => r.rectaEng > 1).map((r) => r.r.metros / r.rectaEng);
  di('⭐ RODEO DEL CAMINO (enganche→enganche)', rep(rodEng, '×', 2));
  // ⛔ IMPOSIBILIDAD FÍSICA, con la tolerancia que el dato permite y no una más
  //   fina: `res.metros` llega redondeado a 0,1 m, así que exigir un cociente
  //   ≥0,999 sobre un enlace de 13 m es pedir 1,3 cm a un dato que tiene 5. Se
  //   compara en METROS ABSOLUTOS contra la resolución del redondeo (bitácora nº190).
  const TOL = 0.05;
  const imposibles = conRuta.filter((r) => r.r.metros < r.rectaEng - TOL);
  di('⛔ ruta más corta que su propia recta (imposible)', imposibles.length
    + '   tolerancia ' + TOL + ' m = el redondeo de res.metros'
    + (imposibles.length ? '   ⛔⛔ EL GRAFO ESTÁ ROTO' : '   ✅'));
  A.exige(imposibles.length === 0, `${imposibles.length} enlaces miden menos que la recta entre sus enganches`);
  for (const r of imposibles.slice(0, 5)) {
    log('      "' + r.p.a.code + '" × "' + r.p.b.code + '"   ruta ' + r.r.metros
      + ' m · recta ' + r.rectaEng.toFixed(3) + ' m');
  }
  // ⭐ LEY 152 · el cero necesita su uno: cuántos rodeos consultados SÍ bajan de 1,
  //   que es el fenómeno legítimo que el guardián no debe confundir con el fallo.
  const bajos = conRuta.filter((r) => r.rectaM > 1 && r.r.metros / r.rectaM < 0.999);
  di('⭐ rodeos CONSULTADOS por debajo de 1 (legítimos)', bajos.length + ' de ' + conRuta.length
    + '   ⇒ el hueco parada→grafo, no un atajo inventado');
}

// ═════════════════════════════════════════════════════════════════════════════
// P5 · ⭐⭐⭐ LOS CRUCES HACIA ATRÁS (ley 154)
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P5 · ⭐⭐⭐ LOS CRUCES HACIA ATRÁS — números viejos que este cálculo debe reencontrar');
raya('─');
{
  // ⚠️ La tanda 4 publicó: «48 de 50 paradas de tranvía tienen un bus a ≤300 m,
  //   mediana 73 m». Eso es la distancia AL BUS MÁS CERCANO, a vuelo de pájaro —
  //   NO la mediana de los 272 pares. Compararlo con los 272 sería comparar dos
  //   poblaciones distintas y llamarlo contradicción.
  const porTranvia = new Map();
  for (const r of res) {
    if (r.p.clase !== 'bus↔tranvía') continue;
    const k = r.p.b.id;
    if (!porTranvia.has(k)) porTranvia.set(k, { recta: [], and: [] });
    porTranvia.get(k).recta.push(r.rectaM);
    if (r.r) porTranvia.get(k).and.push(r.r.metros);
  }
  di('paradas de tranvía con algún bus a ≤300 m', porTranvia.size + ' de ' + TRA.length
    + '   (la tanda 4 publicó 48 de 50)');
  A.exige(porTranvia.size === 48, `salen ${porTranvia.size} paradas de tranvía con bus a ≤300 m y la tanda 4 publicó 48`);

  // ⭐⭐⭐ EL CRUCE DE VERDAD, Y HAY QUE MEDIRLO COMO LO MIDIÓ ELLA.
  //   `docs/DISENO-H2A-RED.md:334-337` publica «mín 20 · mediana 73 · p90 130 ·
  //   máx 418 m» y ese máximo de 418 SON LAS DOS DE JUSLIBOL, que están FUERA del
  //   radio de 300. ⇒ La población es **las 50**, sin recortar. Medirlo sobre las
  //   48 que caben en el radio da otro número y parecería una contradicción.
  const minRectaTodas = TRA.map((t) => Math.min(...BUS.map((b) => recta(t, b))));
  const sT = minRectaTodas.slice().sort((a, b) => a - b);
  const PUB4 = { min: 20, p50: 73, p90: 130, max: 418 };
  const mio = { min: sT[0], p50: pctl(sT, 0.5), p90: pctl(sT, 0.9), max: sT[sT.length - 1] };
  log('');
  log('   ⭐⭐⭐ LAS 50 PARADAS DE TRANVÍA Y SU BUS MÁS CERCANO, EN RECTA — sin recortar');
  log('   ' + 'medida'.padEnd(12) + 'aquí'.padStart(10) + 'tanda 4'.padStart(10) + '   ¿cuadra?');
  for (const k of ['min', 'p50', 'p90', 'max']) {
    const ok = Math.abs(mio[k] - PUB4[k]) <= 1;
    log('   ' + k.padEnd(12) + (mio[k].toFixed(0) + ' m').padStart(10) + (PUB4[k] + ' m').padStart(10)
      + '   ' + (ok ? '✅' : '⛔ NO — ' + (mio[k] - PUB4[k]).toFixed(0) + ' m de diferencia'));
    A.exige(ok, `el ${k} del bus más cercano sale ${mio[k].toFixed(0)} m y la tanda 4 publicó ${PUB4[k]} m`);
  }
  const minAnd = [...porTranvia.values()].filter((v) => v.and.length).map((v) => Math.min(...v.and));
  const sA = minAnd.slice().sort((a, b) => a - b);
  log('');
  di('⭐⭐ mediana del bus MÁS CERCANO, ANDANDO (las 48)', pctl(sA, 0.5).toFixed(0) + ' m');
  di('   reparto andando', rep(minAnd));
  {
    // el mismo recorte para las dos, que si no se comparan poblaciones distintas
    const min48 = [...porTranvia.values()].map((v) => Math.min(...v.recta)).sort((a, b) => a - b);
    di('   la misma población en recta (las 48)', pctl(min48, 0.5).toFixed(0) + ' m');
    di('   ⇒ factor andando ÷ recta, misma población', (pctl(sA, 0.5) / pctl(min48, 0.5)).toFixed(2) + '×');
  }
  log('');
  log('   ⚠️ Y LA COMPARACIÓN QUE NO SE HACE, dicha para que nadie la haga: la mediana');
  log('     de los ' + nBT + ' pares bus↔tranvía NO se compara con esos 73 m. Son poblaciones');
  log('     distintas —«el más cercano» contra «todos los que caben en 300 m»— y');
  log('     cruzarlas daría una contradicción inventada.');
  di('   (para que conste) mediana de los ' + nBT + ' pares en recta',
    pctl(res.filter((r) => r.p.clase === 'bus↔tranvía').map((r) => r.rectaM).sort((a, b) => a - b), 0.5).toFixed(0) + ' m');

  // ── el rodeo contra el de las rutas cortas de Antonio ────────────────────
  log('');
  const s = rodeos.slice().sort((a, b) => a - b);
  di('⭐ rodeo de los 2.538 · p50', pctl(s, 0.5).toFixed(2) + '×');
  log('      las CUATRO rutas cortas de Antonio: 1,10 · 1,32 · 1,37 · 2,17   (media 1,49)');
  log('      ⇒ ' + (pctl(s, 0.5) < 1.20
    ? '⛔⛔ POR DEBAJO DE 1,20 — el pre-filtro estaría eligiendo pares fáciles. PARAR.'
    : '✅ dentro del rango de los trayectos cortos medidos por Antonio'));
}

// ═════════════════════════════════════════════════════════════════════════════
// P6 · ⭐ QUÉ CLASE DE ENLACE NO HAY ENTRE LOS 2.538 (ley 151)
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P6 · ⭐ QUÉ CLASE DE ENLACE NO HAY AQUÍ — el pre-filtro define lo invisible');
raya('─');
{
  let sinNingun = 0;
  const paradasConPar = new Set();
  for (const p of pares) { paradasConPar.add(p.a.id); paradasConPar.add(p.b.id); }
  for (const p of BUS.concat(TRA)) if (!paradasConPar.has(p.id)) sinNingun++;
  di('paradas SIN ni un par candidato', sinNingun + ' de ' + (BUS.length + TRA.length));
  log('      ⇒ para esas paradas, este artefacto no dice NADA. No es que no haya');
  log('        transbordo: es que a menos de ' + RADIO_M + ' m no hay ninguna parada que');
  log('        aporte línea nueva. **El pre-filtro las hace invisibles.**');
  di('enlaces tranvía×tranvía', '0 — ⛔ NO SE CALCULAN. El tranvía como red es H2·8');
  di('enlaces con la MARCA misma-arista', res.filter((r) => r.mismaArista).length
    + '   (la Puerta 1 midió 19)');
}

// ═════════════════════════════════════════════════════════════════════════════
// P7 · EL ARTEFACTO
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P7 · EL ARTEFACTO — el tamaño es lo que decidirá el stack');
raya('─');
const fi = feedInfo[0] ? {
  version: feedInfo[0].feed_version,
  inicio: feedInfo[0].feed_start_date,
  fin: feedInfo[0].feed_end_date,
  editor: feedInfo[0].feed_publisher_name,
} : null;
const artefacto = {
  // ⛔⛔ LA LICENCIA DEL NAP OBLIGA A CONSERVAR SIN ALTERAR LA METAINFORMACIÓN DE
  //    FECHA. Si el artefacto se la come, 004 incumple **y** pierde la caducidad.
  //    Por eso `feed` va DENTRO y se exige, no se confía.
  feed: fi,
  radioPrefiltro: RADIO_M,
  campos: { camino: CAMINOS, lado: LADOS },
  enlaces: res.map((r) => ({
    a: r.p.a.code, b: r.p.b.code, clase: r.p.clase,
    m: r.r ? Math.round(r.r.metros * 10) / 10 : null,     // ⭐ METROS, no minutos
    camino: r.camino, lado: r.lado,
    ...(r.mismaArista ? { mismaArista: true } : {}),
    aristas: r.r ? r.r.aristas : null,
  })),
};
A.exige(!!artefacto.feed, 'el artefacto no lleva `feed_info`: la licencia del NAP exige conservar '
  + 'sin alterar la metainformación de fecha, y sin ella además se pierde la caducidad');
const json = JSON.stringify(artefacto);
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
di('enlaces en el artefacto', artefacto.enlaces.length);
di('JSON compacto', kb(json.length));
di('comprimido (gzip)', kb(require('zlib').gzipSync(json).length));
{
  const sinAristas = JSON.stringify({ ...artefacto, enlaces: artefacto.enlaces.map(({ aristas, ...x }) => x) });
  di('⭐ sin la lista de aristas', kb(sinAristas.length) + ' · gzip '
    + kb(require('zlib').gzipSync(sinAristas).length));
  log('      ⇒ la lista de aristas es ' + (100 * (json.length - sinAristas.length) / json.length).toFixed(0)
    + ' % del peso. Es lo que hace falta para DIBUJAR el enlace, no para calcularlo.');
}
di('dónde vive feed_info', fi ? 'artefacto.feed = ' + JSON.stringify(fi).slice(0, 80) : '⛔ NO CONSTA');

log('');
raya();
log(A.cierre('LOS 2.538 ENLACES'));
