// ⭐⭐ TANDA DE ARREGLO 8 · CUÁNTO SE HA MOVIDO — la otra mitad de la contraprueba
//
// La contraprueba de que H1 no se movió (las diez rutas, los 26 congelados, la
// batería) dice **que no ha pasado nada**. Un arreglo que no se hubiera aplicado
// diría exactamente lo mismo (ley 152). ⇒ Aquí va el UNO que acompaña a ese cero:
// **qué SÍ se ha movido, cuánto, y sobre qué universo.**
//
// ⚠️ EL «ANTES» ESTÁ RECONSTRUIDO, y se dice: `insertarViejo()` reproduce aquí el
//    `insertar` anterior al arreglo —enlazar solo con los dos extremos de la
//    arista—. Es una segunda copia del código de producción, que es justo lo que
//    este proyecto persigue… así que **NO se cree por decreto**:
//    ⭐ POSITIVO DE CONTROL: tiene que reproducir al decímetro los tres números que
//      esta tanda vio en rojo antes de tocar nada — 32,5 · 41,4 · 1.145,2. Si no
//      los reproduce, el «antes» no es el antes y el informe entero no vale.
//
//   node tools/grafo/efecto-arreglo.js [--muestra N]

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const D = require('../../src/direccion');
const { cargar } = require('../gtfs/feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(52) + ' ' + v);

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const TAM_MUESTRA = arg('--muestra', 400);

/** El radio del pre-filtro de H2a, y el criterio de `pares-candidatos.js`. */
const RADIO_M = 300;

/** ⛔ EL `insertar` DE ANTES DEL ARREGLO, reconstruido. Enlaza solo con los dos
 *  extremos: nunca con otro punto temporal de la misma arista. */
function insertarViejo(aristas, ady, nodos, p) {
  const e = aristas[p.arista];
  const antes = G.alLargoDeLaArista(e, p);
  const resto = Math.max(0, e.largo - antes);
  const id = nodos.length;
  nodos.push({ x: p.q[0], y: p.q[1], temporal: true });
  ady.push([]);
  const enlaza = (n, w) => { ady[id].push({ n, w, e: p.arista }); ady[n].push({ n: id, w, e: p.arista }); };
  enlaza(e.a, antes);
  enlaza(e.b, resto);
  return id;
}

/** La ruta entre dos puntos CON EL MOTOR DE ANTES. Solo los metros. */
function rutaViejaEntre(g, oP, dP) {
  const nodos = g.nodos.slice();
  const ady = g.ady.map((l) => l.slice());
  const a = insertarViejo(g.aristas, ady, nodos, oP);
  const b = insertarViejo(g.aristas, ady, nodos, dP);
  const r = G.dijkstra(ady, a);
  const t = r.dist[b];
  return Number.isFinite(t) ? Math.round(t * 10) / 10 : null;
}

const pct = (xs, q) => xs[Math.min(xs.length - 1, Math.floor(xs.length * q))];
const reparto = (xs, u = ' m') => {
  const s = xs.slice().sort((a, b) => a - b);
  return `mín ${s[0].toFixed(1)}${u} · p50 ${pct(s, 0.5).toFixed(1)}${u} · p90 ${pct(s, 0.9).toFixed(1)}${u}`
    + ` · p99 ${pct(s, 0.99).toFixed(1)}${u} · máx ${s[s.length - 1].toFixed(1)}${u}`;
};

raya();
log('CUÁNTO SE HA MOVIDO EL ARREGLO — el UNO que acompaña al cero de la contraprueba');
raya();

const g = R.construir(R.ZONA_TERMINO);
const ctx = D.abrir(g, R.CRUDO);
di('grafo', 'R.construir(R.ZONA_TERMINO) — el mismo del motor');
di('aristas · portales enganchados', g.aristas.length + ' · ' + ctx.enganche.contadores.enganchados);

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P0 · ⭐⭐ EL POSITIVO DE CONTROL DEL «ANTES» — sin esto, el antes es una suposición');
raya('─');
const CONOCIDOS = [
  { via: 'CALLE ALFONSO I', a: '12', b: '17', antes: 32.5 },
  { via: 'AVENIDA SAN JUAN BOSCO', a: '5', b: '3', antes: 41.4 },
  { via: 'AVENIDA MONTAÑANA', a: '736', b: '797', antes: 1145.2 },
];
function parDe(c) {
  const de = (n) => ctx.enganche.portales.filter((o) => o.enganchado
    && o.via && o.via.nombre === c.via && String(o.numero) === n);
  for (const x of de(c.a)) for (const y of de(c.b)) if (x.arista === y.arista) return { x, y };
  return null;
}
log('   ' + 'caso'.padEnd(36) + 'el ANTES reconstruido'.padStart(22)
  + 'lo que se vio en rojo'.padStart(23) + '   ¿cuadra?');
for (const c of CONOCIDOS) {
  const p = parDe(c);
  if (!A.exige(!!p, `el control ${c.via} ${c.a}×${c.b} ha desaparecido`)) continue;
  const v = rutaViejaEntre(g, p.x, p.y);
  const ok = v !== null && Math.abs(v - c.antes) < 0.06;
  log('   ' + (c.via + ' ' + c.a + ' × ' + c.b).slice(0, 35).padEnd(36)
    + ((v === null ? '—' : v.toFixed(1)) + ' m').padStart(22) + (c.antes.toFixed(1) + ' m').padStart(23)
    + (ok ? '   ✅' : '   ⛔ NO — el «antes» no es el antes'));
  A.exige(ok, `el «antes» reconstruido da ${v} m donde el rojo de la tanda dio ${c.antes} m`);
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P1 · EL UNIVERSO — pares de direcciones reales que comparten arista');
raya('─');
const porArista = new Map();
for (const o of ctx.enganche.portales) {
  if (!o.enganchado) continue;
  if (!porArista.has(o.arista)) porArista.set(o.arista, []);
  porArista.get(o.arista).push(o);
}
const pares = [];
for (const [ia, lista] of porArista) {
  if (lista.length < 2) continue;
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) pares.push({ ia, x: lista[i], y: lista[j] });
  }
}
di('aristas con 2 o más portales', porArista.size ? [...porArista.values()].filter((l) => l.length > 1).length : 0);
di('⭐ pares de direcciones que comparten arista', pares.length.toLocaleString('es-ES'));
A.exige(pares.length > 0, 'no hay ni un par que comparta arista: no hay nada que medir');

// ⭐ LA MUESTRA, Y SU CRITERIO — determinista, 1 de cada K sobre el orden en que
//   salen los pares. ⛔ No se eligen los interesantes.
const K = Math.max(1, Math.floor(pares.length / TAM_MUESTRA));
const muestra = pares.filter((_, i) => i % K === 0);
di('muestra', '1 de cada ' + K + ' ⇒ ' + muestra.length + ' pares  (determinista, NO elegida)');

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P2 · ⭐⭐⭐ LA INFLACIÓN, ANTES Y DESPUÉS — mismo instrumento, misma ejecución');
raya('─');
const antesInf = [], despuesInf = [], factores = [];
let movidos = 0, exactos = 0;
for (const p of muestra) {
  const e = g.aristas[p.ia];
  const verdad = Math.abs(G.alLargoDeLaArista(e, p.x) - G.alLargoDeLaArista(e, p.y));
  const vi = rutaViejaEntre(g, p.x, p.y);
  const r = G.rutaEntre(g, p.x, p.y);
  if (vi === null || !r.encontrada) continue;
  antesInf.push(vi - verdad);
  despuesInf.push(r.metros - verdad);
  if (verdad > 0.001) factores.push(vi / verdad);
  if (Math.abs(r.metros - vi) > 0.05) movidos++;
  if (Math.abs(r.metros - verdad) <= 0.05) exactos++;
}
di('pares medidos', antesInf.length);
log('');
log('   ANTES  inflación   ' + reparto(antesInf));
log('   DESPUÉS inflación  ' + reparto(despuesInf));
log('');
di('factor motor÷verdad ANTES', reparto(factores, '×'));
di('⭐ pares que se mueven con el arreglo', movidos + ' de ' + antesInf.length
  + '  (' + (100 * movidos / antesInf.length).toFixed(1) + ' %)');
di('⭐ pares que ahora dan la verdad exacta', exactos + ' de ' + antesInf.length
  + '  (' + (100 * exactos / antesInf.length).toFixed(1) + ' %)');
// ⛔ el cero de la contraprueba necesita este uno: si NADA se moviera, el arreglo
//    no se habría aplicado y la batería verde no significaría nada.
A.exige(movidos > 0, 'ni un solo par se mueve: el arreglo no se ha aplicado');
const peorDespues = Math.max(...despuesInf);
A.exige(peorDespues <= 0.05, `después del arreglo todavía queda inflación: ${peorDespues.toFixed(2)} m`);

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P3 · ⭐ LOS 16 PARES DE PARADAS DE BUS — los que midió la tanda 6 de H2a');
raya('─');
const R_TIERRA = 6371000, RAD = Math.PI / 180;
const recta = (a, b) => {
  const x = (b.lon - a.lon) * RAD * Math.cos((a.lat + b.lat) / 2 * RAD);
  const y = (b.lat - a.lat) * RAD;
  return Math.hypot(x, y) * R_TIERRA;
};
const { stops, modo, lineasDe } = cargar();
const P = stops.filter((s) => modo.get(s.stop_id) === 'bus').map((s) => ({
  id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
  lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
  lineas: lineasDe.get(s.stop_id) || new Set(),
}));
for (const p of P) p.eng = R.engancharPunto(g, p.lat, p.lon, 'parada');
let candidatos = 0;
const mismos = [];
for (let i = 0; i < P.length; i++) {
  for (let j = i + 1; j < P.length; j++) {
    if (recta(P[i], P[j]) > RADIO_M) continue;
    let aporta = false;
    for (const x of P[j].lineas) if (!P[i].lineas.has(x)) { aporta = true; break; }
    if (!aporta) for (const x of P[i].lineas) if (!P[j].lineas.has(x)) { aporta = true; break; }
    if (!aporta) continue;
    candidatos++;
    if (P[i].eng.arista === P[j].eng.arista) mismos.push([P[i], P[j]]);
  }
}
di('paradas de bus · pares candidatos', P.length + ' · ' + candidatos);
// ⭐ positivo de control de la reconstrucción: la tanda 6 publicó 2.266 y 16.
di('⭐ contraste con la tanda 6 (2.266 · 16)', candidatos + ' · ' + mismos.length
  + (candidatos === 2266 && mismos.length === 16 ? '   ✅ los mismos' : '   ⚠️ NO coinciden'));
A.exige(candidatos === 2266, `los pares candidatos salen ${candidatos} y la tanda 6 publicó 2.266`);
A.exige(mismos.length === 16, `los pares de misma arista salen ${mismos.length} y la tanda 6 publicó 16`);
log('');
log('   ' + 'el par'.padEnd(56) + 'ANTES'.padStart(10) + 'DESPUÉS'.padStart(10)
  + 'la verdad'.padStart(11) + '  se quita');
const quitados = [];
for (const [a, b] of mismos) {
  const e = g.aristas[a.eng.arista];
  const verdad = Math.abs(G.alLargoDeLaArista(e, a.eng) - G.alLargoDeLaArista(e, b.eng));
  const vi = rutaViejaEntre(g, a.eng, b.eng);
  const r = G.rutaEntre(g, a.eng, b.eng);
  quitados.push(vi - r.metros);
  log('   ' + (a.nombre + ' × ' + b.nombre).slice(0, 55).padEnd(56)
    + (vi.toFixed(1) + ' m').padStart(10) + (r.metros.toFixed(1) + ' m').padStart(10)
    + (verdad.toFixed(1) + ' m').padStart(11) + ('  −' + (vi - r.metros).toFixed(1) + ' m'));
  A.exige(Math.abs(r.metros - verdad) <= 0.05,
    `el par ${a.code}×${b.code} sigue inflado: ${r.metros} m contra ${verdad.toFixed(1)} m`);
}
log('');
di('metros que se quitan de encima', reparto(quitados));
di('⇒ sobre 2.266 pares candidatos', mismos.length + ' corregidos ('
  + (100 * mismos.length / 2266).toFixed(1) + ' %) · los otros ' + (2266 - mismos.length) + ' intactos');

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ LEY 151 · ¿QUÉ CLASE DE TRAYECTO NO HAY ENTRE LAS DIEZ RUTAS DE CORDURA?
//
// Las diez van de un punto a otro y `rutaEntre` inserta DOS. Pero `rutaAEdificio`
// (`src/puerta.js:236-258`) inserta el origen **y hasta 24 puertas candidatas a
// la vez**, y esas candidatas salen de muestrear el contorno del edificio cada
// 5 m: **muchas caen sobre la misma arista.** Con el arreglo, esas candidatas
// quedan enlazadas entre sí ⇒ `r.dist[ids[i]]` puede BAJAR ⇒ **puede cambiar qué
// puerta gana**, y con ella la ruta publicada.
//
// ⛔ Ésa es la clase que las diez no cubren de verdad: solo tres tocan un edificio,
//    y las tres quedaron clavadas. Que tres no se muevan no dice nada de las demás.
// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('P4 · ⭐⭐⭐ LA CLASE QUE LAS DIEZ NO CUBREN — 25 puntos insertados a la vez');
raya('─');
{
  const Pu = require('../../src/puerta');
  const Co = require('../../src/condicionales');
  const En = require('../../src/entradas');
  const Ent = En.cargar();
  const Ed = Co.edificios();

  // ⭐ el origen es FIJO y conocido: el mismo portal del que salen las rutas 7, 8
  //   y 9 de Antonio. Así lo único que puede cambiar entre antes y después es la
  //   elección de puerta, que es lo que se quiere medir.
  const origen = ctx.enganche.portales.find((o) => o.enganchado && o.via
    && o.via.nombre === 'CALLE EL COLOSO' && String(o.numero) === '2');
  if (!A.exige(!!origen, 'no se encuentra CALLE EL COLOSO 2: sin origen fijo no hay medida')) {
    log('   ⛔ no se puede ejecutar');
  } else {
    // muestra determinista: 1 de cada K edificios en el orden del fichero
    const TOPE_EDIFICIOS = 60;
    const kE = Math.max(1, Math.floor(Ed.polis.length / TOPE_EDIFICIOS));
    const sel = Ed.polis.filter((_, i) => i % kE === 0).slice(0, TOPE_EDIFICIOS);
    di('edificios en el dato · muestra', Ed.polis.length + ' · 1 de cada ' + kE
      + ' ⇒ ' + sel.length + '  (determinista)');

    // ⭐ el motor de ANTES se consigue pasándole a `rutaAEdificio` un `G` con el
    //   `insertar` viejo. Es el mismo camino de código: solo cambia la pieza.
    const G_VIEJO = { ...G, insertar: insertarViejo };
    let conCompartida = 0, evaluados = 0, cambiaPuerta = 0, cambiaMetros = 0;
    let peorDelta = 0;
    for (const poli of sel) {
      const ac = Pu.accesos(poli, g.aristas, ctx.eng, Ent);
      if (!ac || !ac.cands || ac.cands.length < 2) continue;
      const aristas = ac.cands.map((c) => c.arista);
      const comparte = new Set(aristas).size < aristas.length;
      if (comparte) conCompartida++;
      const vieja = Pu.rutaAEdificio(G_VIEJO, g, origen, poli, ctx.eng, Ent);
      const nueva = Pu.rutaAEdificio(G, g, origen, poli, ctx.eng, Ent);
      if (!vieja.encontrada || !nueva.encontrada) continue;
      evaluados++;
      const dp = Math.hypot(vieja.puerta.m[0] - nueva.puerta.m[0], vieja.puerta.m[1] - nueva.puerta.m[1]);
      if (dp > 0.5) cambiaPuerta++;
      const d = nueva.metros - vieja.metros;
      if (Math.abs(d) > 0.05) { cambiaMetros++; if (Math.abs(d) > Math.abs(peorDelta)) peorDelta = d; }
    }
    di('edificios con 2+ candidatas · evaluados', conCompartida + ' con arista compartida · ' + evaluados + ' con ruta');
    di('⭐ edificios donde CAMBIA la puerta elegida', cambiaPuerta + ' de ' + evaluados);
    di('⭐ edificios donde CAMBIAN los metros', cambiaMetros + ' de ' + evaluados
      + (cambiaMetros ? '   peor Δ ' + peorDelta.toFixed(1) + ' m' : ''));
    // ⛔ Si aquí cambiara algo, no sería un fallo del arreglo: sería H1 moviéndose
    //    fuera de las diez rutas, y eso es decisión de Antonio, no mía.
    log('');
    log(cambiaMetros === 0
      ? '   ⇒ ✅ NINGUNO se mueve. El arreglo no toca la elección de puerta en esta muestra.'
      : '   ⇒ ⛔⛔ ' + cambiaMetros + ' EDIFICIOS SE MUEVEN FUERA DE LAS DIEZ RUTAS. Se REPORTA, no se decide.');
  }
}

log('');
raya();
log(A.cierre('CUÁNTO SE HA MOVIDO EL ARREGLO'));
