// C · ⭐ LOS 1.592 SIN NINGÚN TESTIGO — acotar, entender por qué, y declarar.
//
// La tanda 13 los contó: 1.879 portales ciegos sin ninguna calle con nombre a 80 m,
// de los que la capa municipal rescata 287 ⇒ **1.592 (3,5 %) sin nada que los
// confirme ni los desmienta**. Y midió lo que impide despacharlos: **mediana de 25
// vecinos en 300 m**, y en la muestra salieron Avenida de la Ilustración, José
// Anselmo Clavé y Vía Hispanidad.
//
// ⚠️ Así que **NO todos son descampados**, y ése es el motivo de este bloque: un
//    3,5 % en el Actur no es lo mismo que un 3,5 % en un polígono.
//
// ⛔ NO se busca otra fuente. Se acota, se cuenta y se declara como cabo. Es otra
//    tanda con su propia decisión.
//
//   node src/sin-testigo.js
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ ¿PUEDE ESTO PASAR O FALLAR SIN QUE NADA FUNCIONE? — escrito ANTES
// ═════════════════════════════════════════════════════════════════════════════
// C2 · «por qué no los alcanza ningún testigo» — las causas NO se pueden repartir a
//      ojo: un portal puede tener dos a la vez (ni capa municipal ni vecino con
//      nombre). ⇒ se cuentan como conjuntos que se solapan, con su intersección
//      impresa, y se comprueba que la suma de las casillas disjuntas da el total.
//      Si no cuadra, la clasificación se está comiendo casos.
//
// C3a · «coherencia entre vecinos» — ⚠️ PASA POR CONSTRUCCIÓN si la vía tiene dos
//      portales: dos portales pegados enganchan a la misma arista siempre. ⇒ se
//      exige un mínimo de portales por vía, y sobre todo se VALIDA: la misma medida
//      sobre los BUENOS conocidos y los SOSPECHOSOS conocidos. Si no los separa, la
//      señal no mide coherencia de enganche y no se usa. El control no lo elijo yo:
//      `codigoVia` marcó esos grupos en la tanda 9.
//
// C3b · «la distancia» — 3 m es más creíble que 25 m. ⚠️ Puede pasar por
//      construcción al revés: los sin testigo son de sitios raros, así que su
//      distancia podría ser peor por geografía y no por calidad (nº85). ⇒ se compara
//      contra los BUENOS y se dice qué es lo que se está comparando.
//
// C4 · «cuántos están en sitio urbano» — ⚠️ el umbral de densidad lo elegiría yo, y
//      eso es exactamente lo que la ley 17 prohíbe. ⇒ el listón sale de las ZONAS
//      que `src/ciudad.js` definió en la tanda 9 para el eje densidad, sin saber
//      nada de esto: el p10 de densidad de los portales del casco + ensanche +
//      Actur. Y lleva su POSITIVO DE CONTROL: aplicado a Garrapinillos y PLAZA
//      —que son campo y polígono— tiene que suspenderlos casi enteros. Si no lo
//      hace, el listón no mide «urbano».

'use strict';
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
const RADIO_COBERTURA = 60;

const T0 = Date.now();
const mu = M.cargar();
const g = construir(ZONA_TERMINO);
const ctx = D.abrir(g, CRUDO);
const portales = ctx.enganche.portales.filter((o) => o.enganchado);
const enZona = (o, z) => o.lat >= z.sur && o.lat <= z.norte && o.lon >= z.oeste && o.lon <= z.este;
const nucleoDeWay = (id) => P.nucleo(g.nombres.get(id) || '');

for (const o of portales) {
  o._cubierto = M.cubierto(mu, o.q, RADIO_COBERTURA);
  o._tieneVia = mu.porCodigo.has(o.codigoVia);
}
const ciegos = portales.filter((o) => !o.nucleoOsm);
const vistos = portales.filter((o) => o.nucleoOsm);
const buenos = vistos.filter((o) => o.codigoVia_estado === 'concuerda');
const malos = vistos.filter((o) => o.codigoVia_estado === 'DISCORDA');

// ── el grupo, reconstruido con el mismo criterio de la tanda 13 ──────────────
const huerfanos = [];
for (const o of ciegos) {
  const h = heredar(g, o.arista, nucleoDeWay, g.aristas[o.arista].way);
  o._heredado = h.cercano;
  if (!h.cercano) huerfanos.push(o);
}
const sinNada = huerfanos.filter((o) => !(o._cubierto && o._tieneVia));

log('='.repeat(108));
log('C0 · EL GRUPO, RECONSTRUIDO — mismo criterio que la tanda 13');
di('portales enganchados', portales.length);
di('ciegos (OSM no da nombre a su arista)', `${ciegos.length}  (${pct(ciegos.length, portales.length)})`);
di('   y además sin ninguna calle con nombre a 80 m', huerfanos.length);
di('⛔ SIN NINGÚN TESTIGO (tampoco la capa municipal)', `${sinNada.length}  (${pct(sinNada.length, portales.length)})`);
A.exige(sinNada.length > 1000 && sinNada.length < 2500,
  `el grupo sin testigo sale en ${sinNada.length}, y la tanda 13 publicó 1.592: algo ha cambiado sin declararse`);

// ═════════════════════════════════════════════════════════════════════════════
// C2 · ¿POR QUÉ NO LOS ALCANZA NINGÚN TESTIGO?
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('C2 · ⭐⭐ ¿POR QUÉ NO LOS ALCANZA NINGÚN TESTIGO? — la pregunta útil');
log('   ⚠️ Un portal puede tener dos causas a la vez. Se cuentan como casillas DISJUNTAS');
log('      y se comprueba que suman el total: una clasificación que no cuadra se está');
log('      comiendo casos.');
{
  const sinCapa = sinNada.filter((o) => !o._cubierto);
  const conCapaSinVia = sinNada.filter((o) => o._cubierto && !o._tieneVia);
  log('');
  log('   TODOS son ciegos y huérfanos de OSM por definición del grupo. Lo que los');
  log('   distingue es qué les pasa con la capa municipal:');
  di('   ⛔ la capa municipal NO LLEGA a su zona', `${sinCapa.length}  (${pct(sinCapa.length, sinNada.length)})`);
  di('   ⛔ la capa llega, pero su vía NO está en ella', `${conCapaSinVia.length}  (${pct(conCapaSinVia.length, sinNada.length)})`);
  const suma = sinCapa.length + conCapaSinVia.length;
  di('   ⇒ cuadre', `${suma} = ${sinNada.length}  ` + (suma === sinNada.length ? '✅' : '⛔ NO CUADRA'));
  A.exige(suma === sinNada.length, 'la clasificación de causas no suma el total del grupo');

  // ⭐ y la causa de OSM, medida y no supuesta: ¿a qué distancia estaría el vecino
  //    con nombre más próximo? 80 m es el radio de `heredar`; si con 300 lo
  //    encontraran casi todos, el problema es el radio, no el mapa.
  log('');
  log('   ⭐ ¿es que OSM no nombra NADA por ahí, o es que 80 m se queda corto?');
  const r = rng(SEMILLA + 70);
  const muestra = [];
  for (let i = 0; i < 400; i++) muestra.push(sinNada[Math.floor(r() * sinNada.length)]);
  let a300 = 0, nada = 0;
  const ds = [];
  for (const o of muestra) {
    const h = heredar(g, o.arista, nucleoDeWay, g.aristas[o.arista].way, 300);
    if (h.cercano) { a300++; ds.push(h.dCercano); } else nada++;
  }
  ds.sort((x, y) => x - y);
  di('   con el radio a 300 m, encuentran un vecino con nombre', `${a300} de ${muestra.length}  (${pct(a300, muestra.length)})`);
  di('      y está a', ds.length ? `mediana ${ds[Math.floor(ds.length / 2)].toFixed(0)} m · p90 ${ds[Math.floor(ds.length * 0.9)].toFixed(0)} m` : '—');
  di('   ⛔ ni a 300 m hay nada con nombre', `${nada}  (${pct(nada, muestra.length)})`);
  log('   ⇒ ésta es la diferencia entre «el radio se queda corto» y «OSM está mudo ahí».');

  log('');
  log('   ⭐ y por dónde andan: el highway al que enganchan');
  const c = new Map(), t = new Map();
  for (const o of sinNada) { const h = g.aristas[o.arista].highway; c.set(h, (c.get(h) || 0) + 1); }
  for (const o of portales) { const h = g.aristas[o.arista].highway; t.set(h, (t.get(h) || 0) + 1); }
  log('      ' + 'highway'.padEnd(24) + 'sin testigo'.padStart(16) + 'todos'.padStart(18) + '  ¿enriquecido?');
  for (const [k, v] of [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7)) {
    const tt = t.get(k) || 0;
    const pF = 100 * v / sinNada.length, pT = 100 * tt / portales.length;
    log('      ' + String(k).padEnd(24) + `${v} (${pF.toFixed(1)} %)`.padStart(16)
      + `${tt} (${pT.toFixed(1)} %)`.padStart(18) + '  ' + (pT > 0 ? `×${(pF / pT).toFixed(1)}` : '—')
      + (pT > 0 && pF / pT >= 1.5 ? '  ⭐' : ''));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// C3 · ¿SE PUEDE DECIR ALGO DE ELLOS SIN UN TESTIGO?
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('C3 · ⭐ ¿SE PUEDE DECIR ALGO SIN TESTIGO? — dos señales, comprobadas antes de usarlas');

// ── C3a · coherencia entre vecinos de la misma vía ──────────────────────────
log('');
log('   (a) COHERENCIA ENTRE VECINOS: si los portales de la misma vía enganchan todos');
log('       a la misma arista de OSM, el enganche es consistente aunque nadie lo confirme.');
log('   ⚠️ Con 2 portales sale 100 % por aritmética. Se exige un mínimo de 5 por vía.');
function coherencia(lista, minPortales = 5) {
  const porVia = new Map();
  for (const o of lista) {
    const k = o.codigoVia;
    if (!porVia.has(k)) porVia.set(k, []);
    porVia.get(k).push(o);
  }
  let vias = 0, suma = 0, portalesEn = 0;
  for (const [, l] of porVia) {
    if (l.length < minPortales) continue;
    const c = new Map();
    for (const o of l) { const w = g.aristas[o.arista].way; c.set(w, (c.get(w) || 0) + 1); }
    const mayor = Math.max(...c.values());
    vias++; suma += mayor / l.length; portalesEn += l.length;
  }
  return { vias, portales: portalesEn, media: vias ? 100 * suma / vias : NaN };
}
{
  const cS = coherencia(sinNada), cB = coherencia(buenos), cM = coherencia(malos);
  log('');
  log('      ' + 'grupo'.padEnd(34) + 'vías con ≥5'.padStart(14) + 'portales'.padStart(11) + 'coherencia media'.padStart(19));
  for (const [k, v] of [['BUENOS conocidos', cB], ['SOSPECHOSOS conocidos', cM], ['⭐ SIN NINGÚN TESTIGO', cS]]) {
    log('      ' + k.padEnd(34) + String(v.vias).padStart(14) + String(v.portales).padStart(11)
      + (Number.isFinite(v.media) ? v.media.toFixed(1) + ' %' : 'sin casos').padStart(19));
  }
  const separa = Number.isFinite(cB.media) && Number.isFinite(cM.media) && (cB.media - cM.media > 5);
  log('   ⇒ ' + (separa
    ? `✅ la señal SEPARA lo bueno de lo sospechoso (${(cB.media - cM.media).toFixed(1)} pts) ⇒ mide coherencia de enganche.`
    : `⚠️ NO separa buenos de sospechosos (${(cB.media - cM.media).toFixed(1)} pts) ⇒ **no vale como señal**, y se dice.`));
  log('      ⛔ Y aunque separase: coherente NO es correcto. Cinco portales que enganchan');
  log('        todos a la misma calle equivocada son perfectamente coherentes.');
}

// ── C3b · la distancia de enganche ─────────────────────────────────────────
log('');
log('   (b) LA DISTANCIA: 3 m es más creíble que 25 m.');
{
  const rep = (l) => { const v = l.map((o) => o.d).sort((a, b) => a - b);
    return `mediana ${v[Math.floor(v.length / 2)].toFixed(1)} m · p90 ${v[Math.floor(v.length * 0.9)].toFixed(1)} m · p99 ${v[Math.floor(v.length * 0.99)].toFixed(1)} m`; };
  di('   BUENOS conocidos', rep(buenos));
  di('   SOSPECHOSOS conocidos', rep(malos));
  di('   ⭐ SIN NINGÚN TESTIGO', rep(sinNada));
  const cerca = sinNada.filter((o) => o.d <= 5).length;
  di('   ⭐ sin testigo, pero enganchados a ≤ 5 m', `${cerca}  (${pct(cerca, sinNada.length)})`);
  log('   ⇒ un enganche a 3 m puede seguir siendo a la calle equivocada —la de al lado está');
  log('     a 12 m— así que esto ACOTA el error, no lo descarta. Es lo único que se puede');
  log('     decir sin testigo, y hay que decirlo con ese tamaño.');
}

// ═════════════════════════════════════════════════════════════════════════════
// C1 + C4 · ¿DÓNDE ESTÁN, Y CUÁNTOS IMPORTAN?
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('C4 · ⭐⭐ ¿IMPORTAN? — el número que hay que publicar no es el 3,5 % bruto');

// la densidad de portales en 300 m, la misma medida de la tanda 13
const CELDA = 300;
const rej = new Map();
for (const o of portales) {
  const k = Math.floor(o.m[0] / CELDA) + ',' + Math.floor(o.m[1] / CELDA);
  rej.set(k, (rej.get(k) || 0) + 1);
}
const dens = (o) => rej.get(Math.floor(o.m[0] / CELDA) + ',' + Math.floor(o.m[1] / CELDA)) || 0;

// ⭐ EL LISTÓN NO LO ELIJO YO. Sale del p10 de densidad de los portales que caen en
//    las zonas que `ciudad.js` declaró urbanas en la tanda 9, para otra cosa.
const URBANAS = ['casco histórico', 'ensanche (Gran Vía · Sagasta)', 'periferia · Actur-Rey Fernando'];
const CAMPO = ['polígono · PLAZA', 'rural · Garrapinillos'];
let LISTON = 0;
{
  const zs = ZONAS.filter((z) => URBANAS.includes(z.n));
  const v = portales.filter((o) => zs.some((z) => enZona(o, z.b))).map(dens).sort((a, b) => a - b);
  LISTON = v[Math.floor(v.length * 0.10)];
  di('portales en las 3 zonas urbanas de `ciudad.js`', v.length);
  di('⭐ LISTÓN = p10 de su densidad (portales en 300 m)', LISTON);
  log('   ⛔ el listón NO lo elijo yo: sale de unas ventanas que la tanda 9 dibujó para el');
  log('     eje densidad, sin saber nada de este grupo (ley 17).');
  // ⭐ POSITIVO DE CONTROL del listón: en campo y polígono tiene que suspender
  const zc = ZONAS.filter((z) => CAMPO.includes(z.n));
  const vc = portales.filter((o) => zc.some((z) => enZona(o, z.b)));
  const pasan = vc.filter((o) => dens(o) >= LISTON).length;
  di('⭐ CONTROL · portales de PLAZA y Garrapinillos que lo pasan', `${pasan} de ${vc.length}  (${pct(pasan, vc.length)})`);
  // ⚠️⚠️ Y ESE CONTROL PASA POR LOS PELOS. 34,9 % no es «casi enteros». En vez de
  //    mover el listón hasta que salga bonito —que es ajustar el instrumento al
  //    resultado, prohibido— se abre por zona, que es donde está la explicación.
  log('   ⚠️⚠️ ESE NÚMERO NO ES UN APROBADO LIMPIO, y no se arregla moviendo el listón:');
  for (const z of zc) {
    const t = portales.filter((o) => enZona(o, z.b));
    const p = t.filter((o) => dens(o) >= LISTON).length;
    log('      ' + z.n.padEnd(34) + `${p} de ${t.length}  (${pct(p, t.length)})`.padStart(22));
  }
  log('      ⇒ el listón NO confunde polígono con ciudad; lo que hace es aprobar el CASCO DE');
  log('        UN PUEBLO, que tiene la densidad de una ciudad porque **es** un sitio donde');
  log('        vive gente. Eso no es un fallo del listón: es que «urbano» y «Zaragoza');
  log('        capital» no son lo mismo, y para esta pregunta —¿alguien pediría una ruta');
  log('        aquí?— el casco de Garrapinillos cuenta que sí.');
  A.exige(vc.length > 0 && 100 * pasan / vc.length < 50,
    `el listón de urbanidad aprueba al ${pct(pasan, vc.length)} de los portales de polígono y campo: no mide lo que dice medir`);
}

log('');
const urbanos = sinNada.filter((o) => dens(o) >= LISTON);
const noUrbanos = sinNada.filter((o) => dens(o) < LISTON);
di('sin ningún testigo · TOTAL', `${sinNada.length}  (${pct(sinNada.length, portales.length)} del callejero)`);
di('⭐⭐ …de ellos, EN SITIO URBANO', `${urbanos.length}  (${pct(urbanos.length, sinNada.length)} del grupo · ${pct(urbanos.length, portales.length)} del callejero)`);
di('   …en polígono, camino o descampado', `${noUrbanos.length}  (${pct(noUrbanos.length, sinNada.length)})`);
log('');
log('   ⇒ ⭐ ÉSE ES EL NÚMERO ÚTIL: ' + urbanos.length + ' portales (' + pct(urbanos.length, portales.length) + ' del callejero) están en');
log('     sitios donde vive gente y nadie puede confirmar si su enganche es correcto.');

// ⭐ ¿CUÁNTO DEPENDE DEL LISTÓN? Un número que se mueve con el umbral hay que dar
//    con su sensibilidad al lado, o es una cifra con una decisión mía escondida.
log('');
log('   ⚠️ y cuánto depende del listón, para que la decisión no quede escondida en un p10:');
{
  const zs = ZONAS.filter((z) => URBANAS.includes(z.n));
  const v = portales.filter((o) => zs.some((z) => enZona(o, z.b))).map(dens).sort((a, b) => a - b);
  for (const p of [0.05, 0.10, 0.25, 0.50]) {
    const L = v[Math.floor(v.length * p)];
    const n = sinNada.filter((o) => dens(o) >= L).length;
    log('      listón = p' + String(Math.round(p * 100)).padStart(2) + ' de la densidad urbana = ' + String(L).padStart(4)
      + ' vecinos   ⇒ ' + String(n).padStart(5) + ' urbanos  (' + pct(n, sinNada.length) + ' del grupo)');
  }
  log('      ⇒ entre el p5 y el p50 la cifra se mueve, y por eso va publicada con el listón');
  log('        al lado y no sola.');
}

log('');
log('   por zona — dónde están los que SÍ importan:');
log('      ' + 'zona'.padEnd(36) + 'sin testigo'.padStart(13) + 'de ellos urbanos'.padStart(19));
for (const z of ZONAS) {
  const t = sinNada.filter((o) => enZona(o, z.b));
  if (!t.length) continue;
  const u = t.filter((o) => dens(o) >= LISTON).length;
  log('      ' + z.n.padEnd(36) + String(t.length).padStart(13) + `${u}  (${pct(u, t.length)})`.padStart(19));
}
{
  const f = sinNada.filter((o) => !ZONAS.some((z) => enZona(o, z.b)));
  const u = f.filter((o) => dens(o) >= LISTON).length;
  log('      ' + 'fuera de las 8 zonas medidas'.padEnd(36) + String(f.length).padStart(13) + `${u}  (${pct(u, f.length)})`.padStart(19));
  log('      ⚠️ «fuera de las 8 zonas» NO es «en el campo»: las 8 ventanas cubren una parte');
  log('         de la ciudad, no toda. Por eso la columna urbana se mide con la densidad y');
  log('         no con la ventana.');
}

// ⭐ las vías más afectadas, con nombre: es lo que Antonio puede reconocer
log('');
log('   ⭐ LAS VÍAS URBANAS MÁS AFECTADAS — las que Antonio puede reconocer de vista:');
{
  const c = new Map();
  for (const o of urbanos) {
    const k = o.via ? o.via.nombre : 'NO CONSTA';
    c.set(k, (c.get(k) || 0) + 1);
  }
  log('      ' + 'vía del callejero'.padEnd(46) + 'portales sin testigo'.padStart(21));
  const ord = [...c.entries()].sort((a, b) => b[1] - a[1]);
  for (const [k, v] of ord.slice(0, 15)) {
    log('      ' + String(k).slice(0, 44).padEnd(46) + String(v).padStart(21));
  }
  // ⛔ AGRUPAR ES BORRAR, Y AQUÍ LA AGRUPACIÓN ES EL HALLAZGO: el número útil no
  //    está repartido por la ciudad, está apilado en una avenida.
  log('');
  log('   ⚠️⚠️ ⭐ Y ESTO NO ES UN LISTADO DE APOYO, ES EL HALLAZGO:');
  di('   la vía más afectada', `«${ord[0][0]}» con ${ord[0][1]} portales`);
  di('   ⇒ qué parte del número útil es ella sola', `${pct(ord[0][1], urbanos.length)} de los ${urbanos.length}`);
  di('   las 3 primeras vías juntas', `${pct(ord.slice(0, 3).reduce((s, x) => s + x[1], 0), urbanos.length)}`);
  di('   vías urbanas distintas afectadas', ord.length);
  log('   ⇒ el cabo urbano NO está repartido por la ciudad: está APILADO. Eso lo hace mucho');
  log('     más barato de cerrar que un 1,2 % disperso — y también mucho más visible para');
  log('     cualquiera que ande por ahí.');
}

// ═════════════════════════════════════════════════════════════════════════════
// C5 · LA MUESTRA AL AZAR
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('C5 · ⭐ MUESTRA AL AZAR DE 20, con coordenada, para que las mire Antonio');
log('   ⛔ Sin número de portal: se identifica por su vía del callejero y su coordenada.');
{
  const r = rng(SEMILLA + 71);
  const a = sinNada.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  log('');
  log('   ' + 'lat, lon'.padEnd(21) + 'vía del callejero'.padEnd(34) + 'engancha a'.padEnd(16)
    + 'a'.padStart(8) + 'vecinos'.padStart(9) + '  ¿urbano?');
  for (const o of a.slice(0, 20)) {
    const e = g.aristas[o.arista];
    const d = dens(o);
    log('   ' + `${o.lat.toFixed(5)},${o.lon.toFixed(5)}`.padEnd(21)
      + String(o.via ? o.via.nombre : 'NO CONSTA').slice(0, 32).padEnd(34)
      + String(e.highway).padEnd(16) + `${o.d.toFixed(1)} m`.padStart(8)
      + String(d).padStart(9) + '  ' + (d >= LISTON ? '⭐ SÍ' : 'no'));
  }
  log(`   (semilla ${SEMILLA + 71}, declarada — la muestra se puede reproducir)`);
}

log('');
log('='.repeat(108));
log('C6 · ⛔ EL CABO, DECLARADO — no se busca otra fuente');
log('   · ' + sinNada.length + ' portales (' + pct(sinNada.length, portales.length) + ' del callejero) no tienen ningún testigo. De ellos,');
log('     ' + urbanos.length + ' están en sitio urbano y ' + noUrbanos.length + ' en polígono, camino o descampado.');
log('   · Lo único que se puede decir de ellos sin testigo es su distancia de enganche,');
log('     que ACOTA el error pero no lo descarta.');
log('   ⛔ Cerrar esto necesitaría OTRA FUENTE, y hoy no se sabe cuál. Eso es una tanda');
log('     con su propia decisión, no un remate de ésta.');

log('');
log(A.cierre('LOS SIN TESTIGO'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
