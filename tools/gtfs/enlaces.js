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
const G8 = require('./gemelos');
const { cargar } = require('./feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(54) + ' ' + v);

/** El radio del pre-filtro (§4 del diseño). ⛔ Es un PRE-FILTRO: el coste son los metros. */
const RADIO_M = 300;

/** Lo que ya está publicado y este script tiene que reencontrar antes de hablar. */
const PUBLICADO = { paradasBus: 934, paradasTranvia: 50, bxb: 2266, bt: 272, total: 2538,
  aristasConLado: 2397, contradicen: 18, muestra: 324, sinEje324: 69, soloEje324: 33,
  // ⭐⭐⭐ TANDA 10 · EL SHA DEL ARTEFACTO ANTES DE QUE ENTRARA LA MARCA. Medido
  //   sobre `data/artefactos/enlaces.json` escrito por la tanda 8 (506.524 bytes).
  //   ⛔ Es lo que demuestra que esta tanda NO RECALCULA NADA: quitando el campo
  //     nuevo, el fichero tiene que volver a salir byte a byte el mismo.
  shaTanda8: 'e3a3a81a3b4c5617341183814c5af2a1000191990a039d243c25d9444d17a559',
  bytesTanda8: 506524,
  enlacesConMarca: 178, paradasConMarca: 34 };

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
const { stops, modo, lineasDe, feedInfo, routes, trips } = cargar();
const mk = (s) => ({ id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
  lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
  modo: modo.get(s.stop_id) || '?',
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
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ PUERTA 3 · LOS LÍMITES VIVEN DENTRO DEL ARTEFACTO, NO EN EL README
//
//   **Un límite escrito en el README no protege a nadie, porque quien consulta un
//   enlace no lee el README.** Cada uno viaja CON EL DATO al que afecta, y cada
//   uno lleva debajo un `A.exige` que lo mantiene vivo. Los que no lo llevan se
//   declaran como deuda en `limites.sinGuardian`, no se disimulan.
// ═════════════════════════════════════════════════════════════════════════════

// ── L3 · las rutas sin ni un viaje, recontadas AQUÍ para tener guardián ──────
const conViajes = new Set(trips.map((t) => t.route_id));
const zombis = routes.filter((r) => Number(r.route_type) === 704 && !conViajes.has(r.route_id))
  .map((r) => r.route_short_name).sort();

// ── L1 · las paradas que el pre-filtro deja sin ni un enlace ─────────────────
const conPar = new Set();
for (const p of pares) { conPar.add(p.a.id); conPar.add(p.b.id); }
const sinEnlaces = BUS.concat(TRA).filter((p) => !conPar.has(p.id)).map((p) => ({
  code: p.code, nombre: p.nombre,
  modo: modo.get(p.id),
  motivo: 'sin-par-candidato',
}));

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ L7 · TANDA 10 — LA MARCA DE «HAY OTRO POSTE CON ESTE NOMBRE AL LADO»
//
//   Antonio decidió el 11/08: **OPCIÓN C — se declara, no se fusiona.** ⛔ Aquí no
//   se junta ni un `stop_id` con otro: los 2.538 enlaces y sus metros salen
//   EXACTAMENTE iguales, y se demuestra con el sha.
//
//   ⭐ Y la marca va en el ENLACE, no solo en la parada (ley 161): quien consulta
//     un transbordo lee el enlace, y ahí es donde le va a aparecer duplicado.
// ═════════════════════════════════════════════════════════════════════════════
const TODAS = BUS.concat(TRA);
const marcaNombre = G8.marcar(TODAS, G8.UMBRAL_M);
const puntasMarcadas = (r) => {
  const p = [];
  if (marcaNombre.has(r.p.a.code)) p.push('a');
  if (marcaNombre.has(r.p.b.code)) p.push('b');
  return p;
};

const artefacto = {
  // ── L5 · CADUCIDAD Y LICENCIA ─────────────────────────────────────────────
  // ⛔⛔ LA LICENCIA DEL NAP OBLIGA A CONSERVAR SIN ALTERAR LA METAINFORMACIÓN DE
  //    FECHA, a citar al MITMS, a poner «Powered by MITRAMS» con enlace, y a
  //    decir si el dato es BRUTO o PROCESADO. El nuestro es PROCESADO y se dice.
  //    Si el artefacto se lo come, 004 incumple **y** pierde la caducidad.
  feed: fi ? { ...fi,
    caduca: '2026-10-05',
    procesado: true,
    procesadoQue: 'recortado a las líneas con viajes, reproyectado y cruzado con un grafo peatonal '
      + 'propio. ⛔ NO es el dato bruto del NAP: no se puede citar como tal.',
    fuente: 'Punto de Acceso Nacional (NAP) · Ministerio de Transportes y Movilidad Sostenible',
    atribucion: 'Powered by MITRAMS',
    atribucionUrl: 'https://nap.transportes.gob.es',
    // ⭐⭐ TANDA 9 · LA VIGENCIA VIAJA COMO FECHAS Y REGLA, NUNCA COMO ESTADO
    //    (ley 165). Un «dentro-del-periodo» horneado hoy seguiría diciendo lo
    //    mismo en noviembre: el veredicto depende del reloj, no del dato.
    vigencia: {
      inicio: fi.feed_start_date,
      fin: fi.feed_end_date,
      reglaDiasAviso: 30,
      comoSeEvalua: 'compara la fecha de HOY con `fin`. Si hoy > fin ⇒ fuera-del-periodo-declarado; '
        + 'si faltan 30 días o menos ⇒ se-acaba; si no ⇒ dentro-del-periodo.',
      noSeHornea: 'el estado NO viaja aquí a propósito: depende del reloj. Quien sirva esto lo recalcula.',
    },
  } : null,
  radioPrefiltro: RADIO_M,

  // ── L3 · LA RED ES LA DEL PERIODO DEL FEED, NO LA DE LA CIUDAD ────────────
  cobertura: {
    periodo: fi ? { desde: fi.inicio, hasta: fi.fin } : null,
    aviso: 'Ésta es la red del PERIODO DEL FEED, no la de la ciudad. Una parada que no esté en '
      + 'stops.txt no existe aquí aunque exista en la calle.',
    ejemploConocido: 'PA00617 (Parque de Atracciones) no está en stops.txt: quien lo busque un día '
      + 'de feria no encontrará la parada.',
    lineasFuera: { n: zombis.length, codigos: zombis, motivo: 'cero viajes en trips.txt' },
    modosFuera: ['tranvía como red — sus 50 paradas entran solo como PUNTAS de enlace'],
  },

  // ── L1 · LAS PARADAS QUE ESTE ARTEFACTO NO PUEDE CONTESTAR ────────────────
  // ⭐ Van DENTRO y con nombre. Si no estuvieran, una consulta sobre una de ellas
  //   devolvería una lista vacía, y **una lista vacía es indistinguible de «no hay
  //   transbordo»**. Lo que hay es un pre-filtro que las deja fuera.
  sinEnlaces: {
    n: sinEnlaces.length,
    aviso: 'Para estas paradas este artefacto NO dice nada. ⛔ No significa que no haya transbordo: '
      + 'significa que a menos de ' + RADIO_M + ' m no hay ninguna parada que aporte línea nueva. '
      + 'Puede haber una a ' + (RADIO_M + 20) + ' m y no se ha calculado.',
    paradas: sinEnlaces,
  },

  // ── L2 · EL VEREDICTO, CON SU LECTURA AL LADO ─────────────────────────────
  campos: {
    camino: {
      queEs: 'por dónde va el camino. Sale del GRAFO.',
      valores: {
        'sin-eje': 'ninguna arista del camino es eje de calzada',
        mixto: 'unas aristas son eje de calzada y otras no',
        'solo-eje': 'todas las aristas del camino son eje de calzada',
        'sin-camino-en-el-grafo': 'ESTE grafo no encuentra camino. ⛔ No significa que no se pueda '
          + 'ir andando: el grafo tiene 170 componentes.',
      },
    },
    lado: {
      queEs: 'qué sabemos de los lados de la calle. Sale de NUESTRO CONOCIMIENTO, no del grafo.',
      // ⭐⭐ LA DISTINCIÓN QUE JUSTIFICA QUE HAYA DOS CAMPOS. Si quien lee no puede
      //   separar conocimiento de ignorancia, los dos campos no han servido de nada.
      aviso: '⛔ `sin-lados-en-el-grafo` es CONOCIMIENTO («el dibujo no tiene dos lados») y '
        + '`no-consta` es IGNORANCIA («podría tenerlos y no llegamos al listón»). Son lo contrario '
        + 'y no se pueden leer igual.',
      valores: {
        'sin-lados-en-el-grafo': 'CONOCIMIENTO FIRME: ni una arista del camino es de una clase que '
          + 'pueda tener lado. ⚠️ La calle real puede tener dos aceras; el dibujo no.',
        'no-consta': 'IGNORANCIA: hay aristas que podrían tener lado y ninguna llega al listón '
          + '(≥4 portales de la misma vía y ≥75 % de la misma paridad).',
        'no-cambia-de-lado': 'el camino no cambia de acera en ningún punto decidible. ⚠️ NO dice '
          + 'que empiece en la acera correcta: eso no se mide.',
        'cambia-con-paso': 'cambia de acera y pasa por un paso de peatones',
        'cambia-sin-paso': 'cambia de acera sin pasar por ninguno. ⚠️ Doblar una esquina también lo '
          + 'hace y es legítimo: NO significa «cruza mal».',
      },
    },
    coste: 'METROS, no minutos. La velocidad de este proyecto está medida como BANDA (4,3–4,5 km/h '
      + 'reales, 5,0 km/h estándar en el buscador): guardar minutos convertiría una banda en un '
      + 'dato falso-preciso.',
  },
  enlaces: res.map((r) => {
    const e = {
      a: r.p.a.code, b: r.p.b.code, clase: r.p.clase,
      m: r.r ? Math.round(r.r.metros * 10) / 10 : null,   // ⭐ METROS, no minutos
      camino: r.camino, lado: r.lado,
      ...(r.mismaArista ? { mismaArista: true } : {}),
      aristas: r.r ? r.r.aristas : null,
    };
    // ⛔⛔ LA MARCA SE AÑADE AL FINAL Y NUNCA EN MEDIO. `JSON.stringify` respeta el
    //   orden de inserción: metida en medio cambiaría los bytes de TODOS los
    //   enlaces y el sha dejaría de poder demostrar que no se ha movido nada.
    const pm = puntasMarcadas(r);
    if (pm.length) e.mismoNombreCerca = pm;
    return e;
  }),
};

// ── L7 · el bloque, al FINAL de la raíz por la misma razón que el campo ──────
{
  const modoDe = new Map(TODAS.map((p) => [p.code, p.modo]));
  const marcadas = [...marcaNombre].map(([code, x]) => ({
    code, modo: modoDe.get(code), n: x.n, otras: x.otras,
  })).sort((u, v) => u.code.localeCompare(v.code));
  artefacto.mismoNombre = {
    umbralM: G8.UMBRAL_M,
    aviso: G8.AVISO_MARCA,
    // ⭐ LEY 157 AL NOMBRE DEL CAMPO: por qué no se llama `gemelo` ni `estacion`.
    porQueNoSeLlamaGemelo: 'dos gemelos son la misma cosa duplicada, y un lector concluiría «es la '
      + 'misma parada». Eso es la agrupación entrando por la puerta de atrás. `mismoNombreCerca` '
      + 'dice un hecho medible y NO dice qué significa.',
    comoSeCompara: 'el nombre, en minúsculas y con los espacios colapsados. ⛔ Ni tildes ni '
      + 'puntuación se tocan: medido sobre las 984, hacerlo no une ni un par más.',
    // ⭐⭐ EL UMBRAL VIAJA CON SU INCERTIDUMBRE, NO SOLO CON SU VALOR.
    banda: {
      desde: G8.BANDA_ESPERADA.desde, hasta: G8.BANDA_ESPERADA.hasta,
      queEs: 'el par de BUS más corto está a 13,7 m y el par de TRANVÍA más largo a 66,4 m: las dos '
        + 'poblaciones se PISAN a lo largo de 52,7 m. 19 de los 48 pares homónimos caen dentro, y '
        + '⛔ no hay ninguna medida que diga cuáles de ellos son un sitio o dos.',
      loQueCuesta: 'con el umbral en 15 m quedan SIN marca 2 pares de tranvía que parecen el mismo '
        + 'sitio (1201/1202 a 17,8 m · 2501/2502 a 66,4 m) y SÍ lleva marca 1 par de bus que parece '
        + 'dos aceras (PA00406/PA00407 a 13,7 m). ⛔ No se puede bajar un error sin subir el otro.',
    },
    campoEnElEnlace: {
      nombre: 'mismoNombreCerca',
      queEs: 'qué puntas del enlace («a», «b») tienen otro poste con su mismo nombre a menos de '
        + G8.UMBRAL_M + ' m. ⛔ NO cambia el coste ni el camino: los metros son los mismos.',
    },
    recuento: {
      // ⭐⭐ LEY 164 · de qué población es CADA celda, y los denominadores puestos.
      postesMarcados: { tranvia: marcadas.filter((x) => x.modo === 'tranvia').length,
        de_50_de_tranvia: 50,
        bus: marcadas.filter((x) => x.modo === 'bus').length, de_934_de_bus: 934 },
      enlacesMarcados: { total: artefacto.enlaces.filter((e) => e.mismoNombreCerca).length,
        busXbus: artefacto.enlaces.filter((e) => e.mismoNombreCerca && e.clase === 'bus×bus').length,
        de_2266_busXbus: 2266,
        busTranvia: artefacto.enlaces.filter((e) => e.mismoNombreCerca && e.clase !== 'bus×bus').length,
        de_272_busTranvia: 272 },
      aviso: '⛔ Las dos filas NO se suman: una cuenta POSTES y la otra ENLACES, y un poste marcado '
        + 'puede estar en varios enlaces o en ninguno.',
    },
    paradas: marcadas,
  };
}
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LOS GUARDIANES DE LOS SEIS LÍMITES — un límite sin guardián es una intención
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('   ⭐⭐ LOS GUARDIANES DE LOS LÍMITES — qué mantiene vivo a cada uno');
// L5 · caducidad, licencia y atribución
A.exige(!!artefacto.feed && !!artefacto.feed.version && !!artefacto.feed.fin
  && !!artefacto.feed.atribucion && !!artefacto.feed.atribucionUrl && artefacto.feed.procesado === true,
  'L5 · el artefacto no lleva feed_info completo con atribución y la marca de PROCESADO. '
  + 'La licencia del NAP exige conservar sin alterar la metainformación de fecha, citar al MITMS '
  + 'y decir si el dato es bruto o procesado');
A.exige(artefacto.feed && artefacto.feed.fin === '20261005',
  `L5 · la caducidad declarada (${artefacto.feed && artefacto.feed.fin}) no es la del feed`);
log('      L5 caducidad y licencia .......... A.exige sobre feed.version/fin/atribucion/procesado');
// L3 · la red es la del periodo
A.exige(zombis.length === 8, `L3 · salen ${zombis.length} líneas sin viajes y H2·6 midió 8`);
A.exige(!stops.some((s) => s.stop_code === 'PA00617'),
  'L3 · PA00617 SÍ está en stops.txt: el ejemplo del Parque de Atracciones ha caducado y el aviso '
  + 'de cobertura está señalando a un caso que ya no existe');
log('      L3 red del periodo ............... A.exige sobre las 8 zombis y sobre la ausencia de PA00617');
// L1 · las paradas invisibles
A.exige(sinEnlaces.length === 172, `L1 · salen ${sinEnlaces.length} paradas sin par y la Puerta 2 midió 172`);
A.exige(artefacto.sinEnlaces.paradas.every((p) => p.code && p.motivo),
  'L1 · alguna parada sin enlaces viaja sin código o sin motivo');
log('      L1 paradas invisibles ............ A.exige sobre las 172 y sobre code+motivo de cada una');
// L2 · el veredicto, con su leyenda, y que la leyenda cubra lo que se emite
{
  const emitidosC = new Set(res.map((r) => r.camino));
  const emitidosL = new Set(res.map((r) => r.lado));
  const faltaC = [...emitidosC].filter((v) => !artefacto.campos.camino.valores[v]);
  const faltaL = [...emitidosL].filter((v) => !artefacto.campos.lado.valores[v]);
  A.exige(faltaC.length === 0, `L2 · se emiten valores de camino sin leyenda: ${faltaC.join(', ')}`);
  A.exige(faltaL.length === 0, `L2 · se emiten valores de lado sin leyenda: ${faltaL.join(', ')}`);
  A.exige(/CONOCIMIENTO/.test(artefacto.campos.lado.aviso) && /IGNORANCIA/.test(artefacto.campos.lado.aviso),
    'L2 · el aviso del campo lado no distingue conocimiento de ignorancia');
  log('      L2 veredicto por enlace .......... A.exige: todo valor emitido tiene leyenda, y el aviso');
  log('                                        separa CONOCIMIENTO de IGNORANCIA');
}
// L6 · nunca «todos», nunca «el más rápido»
{
  // ⛔ El guardián mira el ARTEFACTO ENTERO, texto incluido: es lo que viaja.
  // ⛔⛔ LA PRIMERA VERSIÓN DE ESTA LISTA NO CAZABA NADA, y lo destapó su propia
  //   provocación: el patrón era `/\bel m[áa]s r[áa]pido\b/` y la frase que hay que
  //   cazar es **«el transbordo más rápido»** — con una palabra en medio. Un
  //   patrón pegado a «el» solo caza la forma exacta que se te ocurrió al
  //   escribirlo. ⇒ Se busca el NÚCLEO de la promesa, no la frase entera.
  const PROHIBIDAS = [/m[áa]s r[áa]pid/i, /mejor ruta/i, /\b[óo]ptim[oa]/i,
    /todos los transbordos/i, /\bsiempre\b/i, /garantiz/i, /\bel mejor\b/i];
  const texto = JSON.stringify(artefacto);
  const pilladas = PROHIBIDAS.filter((re) => re.test(texto)).map((re) => re.source);
  A.exige(pilladas.length === 0, `L6 · el artefacto contiene una promesa que no se puede cumplir: ${pilladas.join(' · ')}`);
  log('      L6 nunca «todos» ni «el más rápido» A.exige sobre el JSON entero, ' + PROHIBIDAS.length + ' patrones');
  // ⭐ LEY 156 · el cero se provoca: se enseña que el guardián sabe ponerse rojo
  const falso = JSON.stringify({ ...artefacto, prueba: 'el transbordo más rápido' });
  const cazado = PROHIBIDAS.some((re) => re.test(falso));
  log('      ⭐ provocado: con la frase «el transbordo más rápido» dentro ⇒ '
    + (cazado ? '✅ LO CAZA' : '⛔ NO LO CAZA — el guardián no vale'));
  A.exige(cazado, 'L6 · el guardián no caza «el transbordo más rápido»: su cero no vale nada');
}
// L4 · vive en el artefacto de la red, no en éste
log('      L4 sentidos condicionales ........ ⚠️ NO vive aquí: vive en `tools/gtfs/red-bus.js`,');
log('                                        en `sentido.terminal`, con su propio A.exige de cuota');
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ L7 · EL GUARDIÁN MIRA LAS 984, NO LA LISTA DE MARCADAS (ley 167)
//
//   ⛔ Un `A.exige` que recorriera `artefacto.mismoNombre.paradas` vigilaría la
//     lista que acabo de escribir. Con la lista vacía no daría ni una vuelta y
//     saldría verde. ⇒ El universo de este guardián son las 984 paradas del feed.
// ═════════════════════════════════════════════════════════════════════════════
{
  const M = artefacto.mismoNombre;
  // ── el universo, recontado del feed y no del bloque ────────────────────────
  const conParent = stops.filter((s) => s.parent_station && s.parent_station.length > 0).length;
  A.exige(stops.length === 984 && conParent === 0,
    `L7 · el feed trae ${stops.length} paradas y ${conParent} con parent_station. Esta marca existe `
    + 'porque NADA declara que dos postes formen una estación: si el feed empieza a declararlo, '
    + 'lo que hay que hacer no es marcar, es leerlo');
  // ── el texto dice las dos cosas que tiene que decir ────────────────────────
  A.exige(/POSTES/.test(M.aviso) && /parent_station/.test(M.aviso) && /984/.test(M.aviso),
    'L7 · el aviso de la marca no dice que este proyecto modela POSTES y que el feed no trae '
    + 'parent_station en ninguna de las 984');
  // ── la banda, con dudosos: un umbral sin dudosos es un umbral mal medido ───
  A.exige(M.banda.hasta > M.banda.desde && /19 de los 48/.test(M.banda.queEs),
    'L7 · la banda de solape viaja sin decir cuántos pares caen dentro: el umbral parecería una '
    + 'frontera limpia y no lo es');
  // ── ⛔⛔ Y LO QUE ESTA TANDA PROMETIÓ NO HACER: no se ha fusionado nada ──────
  const codigos = new Set(TODAS.map((p) => p.code));
  A.exige(codigos.size === 984, `L7 · quedan ${codigos.size} códigos de parada distintos y son 984: `
    + 'ALGO HA FUSIONADO DOS POSTES, que es exactamente lo que esta tanda tiene prohibido');
  A.exige(artefacto.enlaces.length === PUBLICADO.total,
    `L7 · el artefacto sale con ${artefacto.enlaces.length} enlaces y tenía ${PUBLICADO.total}`);
  // ── el recuento, contra lo medido en `gemelos.js` ──────────────────────────
  const nMarcadas = M.paradas.length;
  const nEnlaces = M.recuento.enlacesMarcados.total;
  log('      L7 mismo nombre cerca ............ A.exige sobre las 984 (parent_station 0), sobre el');
  log('                                        texto, sobre la banda y sobre que sigan siendo 984');
  di('   ⭐ postes con marca', nMarcadas + '   (tranvía ' + M.recuento.postesMarcados.tranvia
    + ' de 50 · bus ' + M.recuento.postesMarcados.bus + ' de 934)');
  di('   ⭐ enlaces con marca', nEnlaces + ' de ' + artefacto.enlaces.length
    + '   (bus×bus ' + M.recuento.enlacesMarcados.busXbus + ' de ' + nBxB
    + ' · bus↔tranvía ' + M.recuento.enlacesMarcados.busTranvia + ' de ' + nBT + ')');
  A.exige(nMarcadas === PUBLICADO.paradasConMarca, `L7 · salen ${nMarcadas} postes con marca y se midieron ${PUBLICADO.paradasConMarca}`);
  A.exige(nEnlaces === PUBLICADO.enlacesConMarca, `L7 · salen ${nEnlaces} enlaces con marca y se midieron ${PUBLICADO.enlacesConMarca}`);
  // ── ⭐ EL CERO DE bus×bus, CON SU CAUSA Y SU PROVOCACIÓN (leyes 152 y 156) ──
  log('');
  log('      ⭐ Y los enlaces bus×bus con marca salen CERO. Un cero no se publica solo:');
  const enSinEnlaces = new Set(sinEnlaces.map((p) => p.code));
  const busMarcados = M.paradas.filter((x) => x.modo === 'bus').map((x) => x.code);
  const busMarcadosSinPar = busMarcados.filter((c) => enSinEnlaces.has(c));
  log('        LA CAUSA: los ' + busMarcados.length + ' postes de bus con marca son ' + busMarcados.join(' y '));
  log('        y los ' + busMarcadosSinPar.length + ' están en `sinEnlaces` —el pre-filtro ya los dejó fuera—.');
  log('        ⇒ El cero NO es que la marca no mire el bus: es que esas dos paradas no tienen');
  log('          ni un enlace que marcar. Dos límites distintos que se tapan el uno al otro.');
  A.exige(busMarcadosSinPar.length === busMarcados.length,
    'L7 · algún poste de bus con marca SÍ tiene enlaces y aun así no hay enlaces bus×bus marcados: '
    + 'la explicación del cero es falsa');
  const marca25 = G8.marcar(TODAS, 25);
  const bxb25 = res.filter((r) => r.p.clase === 'bus×bus'
    && (marca25.has(r.p.a.code) || marca25.has(r.p.b.code))).length;
  log('        LA PROVOCACIÓN: con el umbral a 25 m salen ' + bxb25 + ' enlaces bus×bus marcados');
  log('          ⇒ ' + (bxb25 > 0 ? '✅ el cruce marca↔enlaces bus×bus FUNCIONA' : '⛔ NO funciona'));
  A.exige(bxb25 > 0, 'L7 · ni subiendo el umbral a 25 m se marca un enlace bus×bus: el cruce entre '
    + 'la marca y los enlaces no está funcionando y su cero no significa nada');
}
const json = JSON.stringify(artefacto);
// ⛔⛔ EN BYTES, NO EN CARACTERES. Esto decía `json.length`, que son unidades
//   UTF-16: cada tilde y cada ⛔ del artefacto cuesta más bytes que caracteres, y
//   el fichero salía 3,3 KB más grande de lo publicado. `red-bus.js` ya lo hacía
//   bien con `Buffer.byteLength` desde H2·6. (bitácora nº195)
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const bytes = (s) => Buffer.byteLength(s, 'utf8');
di('enlaces en el artefacto', artefacto.enlaces.length);
di('JSON compacto', kb(bytes(json)));
di('comprimido (gzip)', kb(require('zlib').gzipSync(json).length));
{
  const sinAristas = JSON.stringify({ ...artefacto, enlaces: artefacto.enlaces.map(({ aristas, ...x }) => x) });
  di('⭐ sin la lista de aristas', kb(bytes(sinAristas)) + ' · gzip '
    + kb(require('zlib').gzipSync(sinAristas).length));
  log('      ⇒ la lista de aristas es ' + (100 * (bytes(json) - bytes(sinAristas)) / bytes(json)).toFixed(0)
    + ' % del peso. Es lo que hace falta para DIBUJAR el enlace, no para calcularlo.');
}
di('dónde vive feed_info', fi ? 'artefacto.feed = ' + JSON.stringify(fi).slice(0, 80) : '⛔ NO CONSTA');

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ TANDA 8 · EL ARTEFACTO AL DISCO, Y LOS SEIS LÍMITES RELEÍDOS DEL FICHERO
//
//   La Puerta 3 dejó los seis límites comprobados **sobre el objeto en memoria**.
//   ⛔ Un `A.exige` sobre un objeto no demuestra nada del JSON que sale al disco:
//     `JSON.stringify` se come `undefined`, las funciones, los `Infinity` y los
//     `NaN` sin decir ni pío, y `Map`/`Set` salen como `{}`. ⇒ **La pregunta que
//     quedó abierta es cuál de los seis sobrevive a la serialización**, y solo se
//     contesta releyendo el fichero.
//
//   node tools/gtfs/enlaces.js --escribir data/artefactos/enlaces.json
// ═════════════════════════════════════════════════════════════════════════════
{
  const iEsc = process.argv.indexOf('--escribir');
  if (iEsc >= 0) {
    const fs = require('fs');
    const path = require('path');
    const destino = process.argv[iEsc + 1] || path.join(__dirname, '..', '..', 'data', 'artefactos', 'enlaces.json');
    fs.mkdirSync(path.dirname(destino), { recursive: true });

    // ═════════════════════════════════════════════════════════════════════════
    // ⭐⭐⭐ TANDA 10 · LA PRUEBA DE QUE NO SE HA MOVIDO NI UN METRO
    //
    //   Se quita el campo nuevo del artefacto y se comprueba que vuelve a salir
    //   **byte a byte** el fichero de la tanda 8. ⛔ Si un solo enlace se hubiera
    //   recalculado, o si un metro hubiera cambiado de redondeo, el sha lo dice.
    //
    //   ⚠️ Y por eso el campo se añade AL FINAL del objeto y del enlace: bastaría
    //     meterlo en medio para que los bytes cambiaran sin que nada se moviera,
    //     y entonces esta prueba no podría distinguir un reorden de un recálculo.
    // ═════════════════════════════════════════════════════════════════════════
    const sha = (b) => require('crypto').createHash('sha256').update(b).digest('hex');
    const sinMarca = JSON.parse(json);
    delete sinMarca.mismoNombre;
    for (const e of sinMarca.enlaces) delete e.mismoNombreCerca;
    const jsonSinMarca = JSON.stringify(sinMarca);
    const shaSinMarca = sha(Buffer.from(jsonSinMarca, 'utf8'));
    const antesExiste = fs.existsSync(destino);
    const shaEnDisco = antesExiste ? sha(fs.readFileSync(destino)) : null;
    log('');
    raya('─');
    log('P8a · ⭐⭐⭐ ¿SE HA MOVIDO ALGO? — el sha del artefacto SIN el campo nuevo');
    raya('─');
    di('sha del fichero que había en disco', shaEnDisco || '⚠️ no había fichero: se compara solo con el publicado');
    di('sha del artefacto de hoy SIN la marca', shaSinMarca);
    di('sha publicado por la tanda 8', PUBLICADO.shaTanda8);
    di('bytes: hoy sin marca · tanda 8', bytes(jsonSinMarca) + ' · ' + PUBLICADO.bytesTanda8
      + (bytes(jsonSinMarca) === PUBLICADO.bytesTanda8 ? '   ✅ el mismo' : '   ⛔ NO'));
    A.exige(shaSinMarca === PUBLICADO.shaTanda8,
      'los 2.538 enlaces SE HAN MOVIDO: quitando el campo nuevo el artefacto no vuelve a ser el de '
      + `la tanda 8 (${shaSinMarca} ≠ ${PUBLICADO.shaTanda8}). Esta tanda no recalcula nada.`);
    if (antesExiste) {
      A.exige(shaEnDisco === shaSinMarca,
        `el fichero que había en disco (${shaEnDisco}) no coincide con el artefacto de hoy sin la `
        + 'marca: o el de disco no era el de la tanda 8, o algo del cálculo ha cambiado');
    }
    // ⭐ el uno que acompaña al cero (ley 152): que la prueba sepa ponerse roja.
    const tocado = JSON.parse(jsonSinMarca);
    tocado.enlaces[0].m = Math.round((tocado.enlaces[0].m + 0.1) * 10) / 10;
    di('⭐ provocado: se le suma 0,1 m a UN enlace',
      sha(Buffer.from(JSON.stringify(tocado), 'utf8')) !== PUBLICADO.shaTanda8 ? '✅ el sha lo caza' : '⛔ NO lo caza');
    A.exige(sha(Buffer.from(JSON.stringify(tocado), 'utf8')) !== PUBLICADO.shaTanda8,
      'el sha no distingue un enlace con 0,1 m de más: no demuestra nada');

    fs.writeFileSync(destino, json);
    log('');
    raya('─');
    log('P8 · ⭐⭐⭐ AL DISCO, Y LOS SIETE LÍMITES RELEÍDOS DEL FICHERO');
    raya('─');
    const enDisco = fs.statSync(destino).size;
    di('escrito en', path.relative(path.join(__dirname, '..', '..'), destino).replace(/\\/g, '/'));
    di('tamaño en disco · en memoria', kb(enDisco) + ' · ' + kb(bytes(json))
      + (enDisco === bytes(json) ? '   ✅ el mismo, byte a byte' : '   ⛔ NO coinciden'));
    di('gzip del fichero', kb(require('zlib').gzipSync(fs.readFileSync(destino)).length));

    // ⛔ SE RELEE DEL DISCO. No se reutiliza `artefacto`: eso sería comprobar el
    //    objeto otra vez, que es justo lo que la Puerta 3 ya hizo.
    const R2 = JSON.parse(fs.readFileSync(destino, 'utf8'));
    log('');
    log('   ' + 'límite'.padEnd(8) + 'qué se comprueba RELEYENDO'.padEnd(58) + '¿sobrevive?');
    const chk = [];
    const c = (id, texto, ok) => { chk.push(ok); log('   ' + id.padEnd(8) + texto.padEnd(58) + (ok ? '✅ sí' : '⛔ NO')); };
    c('L1', 'sinEnlaces con las 172, cada una con code y motivo',
      !!R2.sinEnlaces && R2.sinEnlaces.n === 172 && R2.sinEnlaces.paradas.length === 172
      && R2.sinEnlaces.paradas.every((p) => p.code && p.motivo) && !!R2.sinEnlaces.aviso);
    c('L2', 'la leyenda cubre todo valor emitido, y separa saber de ignorar',
      !!R2.campos && [...new Set(R2.enlaces.map((e) => e.camino))].every((v) => R2.campos.camino.valores[v])
      && [...new Set(R2.enlaces.map((e) => e.lado))].every((v) => R2.campos.lado.valores[v])
      && /CONOCIMIENTO/.test(R2.campos.lado.aviso) && /IGNORANCIA/.test(R2.campos.lado.aviso));
    c('L3', 'cobertura: periodo, aviso, PA00617 y las 8 líneas fuera',
      !!R2.cobertura && !!R2.cobertura.periodo && /PERIODO DEL FEED/.test(R2.cobertura.aviso)
      && /PA00617/.test(R2.cobertura.ejemploConocido) && R2.cobertura.lineasFuera.n === 8);
    c('L4', 'NO vive aquí — vive en el artefacto de la red',
      R2.enlaces.every((e) => e.linea === undefined));
    c('L5', 'feed con version, fin, atribución y la marca de PROCESADO',
      !!R2.feed && R2.feed.fin === '20261005' && R2.feed.procesado === true
      && !!R2.feed.atribucion && !!R2.feed.atribucionUrl && !!R2.feed.fuente);
    c('L6', 'ni una promesa en el texto del fichero escrito',
      ![/m[áa]s r[áa]pid/i, /mejor ruta/i, /\b[óo]ptim[oa]/i, /garantiz/i]
        .some((re) => re.test(fs.readFileSync(destino, 'utf8'))));
    // ⭐⭐⭐ L7 · Y SE RELEE COMO LOS OTROS SEIS. `JSON.stringify` no se come un array
    //   de cadenas, pero eso hay que VERLO en el fichero, no suponerlo: la tanda 8
    //   existe entera porque los seis estaban probados sobre el objeto.
    c('L7', 'mismoNombre: umbral, banda con dudosos, texto y las 34 con distancia',
      !!R2.mismoNombre && R2.mismoNombre.umbralM === 15
      && /POSTES/.test(R2.mismoNombre.aviso) && /parent_station/.test(R2.mismoNombre.aviso)
      && /984/.test(R2.mismoNombre.aviso)
      && R2.mismoNombre.banda.desde === 13.7 && R2.mismoNombre.banda.hasta === 66.4
      && /19 de los 48/.test(R2.mismoNombre.banda.queEs)
      && R2.mismoNombre.paradas.length === PUBLICADO.paradasConMarca
      && R2.mismoNombre.paradas.every((p) => p.code && p.modo && p.otras.length
        && p.otras.every((o) => o.code && typeof o.m === 'number'))
      && R2.enlaces.filter((e) => e.mismoNombreCerca).length === PUBLICADO.enlacesConMarca
      && R2.enlaces.filter((e) => e.mismoNombreCerca)
        .every((e) => e.mismoNombreCerca.every((k) => k === 'a' || k === 'b')));
    log('');
    di('⇒ límites que sobreviven al disco', chk.filter(Boolean).length + ' de ' + chk.length);
    for (let i = 0; i < chk.length; i++) {
      A.exige(chk[i], `el límite L${i + 1} NO sobrevive a la serialización: estaba probado sobre `
        + 'un objeto en memoria y no sobre lo que se publica');
    }
    // ⭐ y el uno que acompaña al cero (ley 152): que la comprobación sepa fallar.
    const roto = JSON.parse(JSON.stringify(R2));
    delete roto.feed.procesado;
    const cazado = !(roto.feed && roto.feed.procesado === true);
    di('⭐ provocado: se quita feed.procesado del releído', cazado ? '✅ lo caza' : '⛔ NO lo caza');
    A.exige(cazado, 'la comprobación de L5 no caza que falte `procesado`: su verde no vale');

    // ═════════════════════════════════════════════════════════════════════════
    // ⭐⭐ LA SIMETRÍA DE LA MARCA, COMPROBADA SOBRE EL FICHERO ESCRITO
    //   Es simétrica por construcción, y «por construcción» es exactamente lo que
    //   se dice de las comprobaciones que no pueden fallar (ley 35). Se mira.
    // ═════════════════════════════════════════════════════════════════════════
    {
      const porCode = new Map(R2.mismoNombre.paradas.map((p) => [p.code, p]));
      let rel = 0, rotas = 0, dist = 0;
      for (const p of R2.mismoNombre.paradas) {
        for (const o of p.otras) {
          rel++;
          const y = porCode.get(o.code);
          const vuelta = y && y.otras.find((z) => z.code === p.code);
          if (!vuelta) { rotas++; continue; }
          if (Math.abs(vuelta.m - o.m) > 0.05) dist++;
        }
      }
      log('');
      di('simetría en el fichero: relaciones A→B', rel);
      di('   sin vuelta · con distinta distancia', rotas + ' · ' + dist + (rotas + dist === 0 ? '   ✅' : '   ⛔'));
      A.exige(rotas === 0 && dist === 0,
        `L7 · la marca no es simétrica en el fichero escrito: ${rotas} sin vuelta y ${dist} con `
        + 'distinta distancia en cada sentido');
      // ⭐ y que sepa ponerse roja
      const cojo = JSON.parse(JSON.stringify(R2.mismoNombre.paradas));
      const v = cojo[0]; const otro = cojo.find((p) => p.code === v.otras[0].code);
      otro.otras = otro.otras.filter((z) => z.code !== v.code);
      const idx = new Map(cojo.map((p) => [p.code, p]));
      let rotas2 = 0;
      for (const p of cojo) for (const o of p.otras) {
        const y = idx.get(o.code);
        if (!y || !y.otras.find((z) => z.code === p.code)) rotas2++;
      }
      di('⭐ provocado: se borra una vuelta del releído', rotas2 > 0 ? '✅ la caza (' + rotas2 + ')' : '⛔ NO la caza');
      A.exige(rotas2 > 0, 'la comprobación de simetría sobre el fichero no caza una vuelta borrada');
    }

    // ⭐⭐ el bloque `vigencia`, que la tanda 9 dejó definido y sin meter (ley 165)
    log('');
    di('⚠️ bloque `vigencia` en el fichero', R2.feed && R2.feed.vigencia ? '✅ está' : '⛔ NO está todavía');
    log('      ⛔ Y NO se hornea el estado: viajan las fechas y la regla. Ver `tools/gtfs/vigencia.js`.');
  }
}

log('');
raya();
log(A.cierre('LOS 2.538 ENLACES'));
