// A · ⭐⭐ `entrance=*` EN EL MOTOR — «si el dato dice dónde se entra, se entra por ahí».
//
// Decisión nueva de Antonio (tanda 14). La regla vive en `src/entradas.js` y
// `src/puerta.js`; esto solo la MIDE.
//
//   node src/entrar-por-la-puerta.js
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ ANTES DE ESCRIBIR NADA: ¿PUEDE ESTO PASAR O FALLAR SIN QUE NADA FUNCIONE?
// ═════════════════════════════════════════════════════════════════════════════
// Van TRES tandas seguidas con una comprobación degradada por saltarse esta
// pregunta (nº82 · nº85 · nº86). Las respuestas, escritas ANTES de medir:
//
// A1 · «existen 2.085 entradas» — PUEDE FALLAR por construcción si el fichero
//      estuviera vacío o mal leído. Lo tapa el positivo de control de la propia
//      descarga (las farmacias, que venían en la misma consulta y no las elijo yo).
//      ⇒ un cero de entradas con farmacias > 0 sería un cero de verdad.
//
// A2 · «a N destinos les cambia el punto» — ⚠️ PUEDE PASAR POR CONSTRUCCIÓN de dos
//      formas, y las dos hay que taparlas:
//        (a) si mido «se movió» comparando el punto nuevo con **el conjunto** de
//            candidatos viejos, saldría 0,0 m casi siempre: la entrada ES un
//            vértice del polígono y el muestreo mete todos los vértices. Es
//            exactamente la trampa de la nº86. ⇒ NO se mide así. Se mide contra
//            **el candidato que el motor ELEGÍA**, que es uno, y elegir puede
//            fallar.
//        (b) si el origen está pegado al edificio, viejo y nuevo colapsan al mismo
//            punto y saldría «no cambia nada» por culpa del muestreo, no de la
//            regla. ⇒ los orígenes van por BANDAS de distancia declaradas, y el
//            número se da por banda.
//      ⭐ Y el CONTROL NULO que demuestra que el instrumento mide algo: los mismos
//         orígenes contra edificios SIN ninguna entrada declarada, donde la regla
//         no cambia. Ahí el desplazamiento tiene que ser **0,0 m en el 100 %**. Si
//         saliera cualquier otra cosa, lo que mido es ruido del arnés.
//
// A3 · «los tres casos conocidos» — no puede pasar por construcción porque son
//      tres casos nombrados de antemano por Antonio, con su número publicado en la
//      tanda 12/13. La comparación es contra un número escrito antes.
//
// A4 · «las siete rutas» — la tabla la escribió Antonio antes de que existiera el
//      enganche, y no se toca. Es el único banco de pruebas que no elegí yo.

'use strict';
const P = require('./portales');
const G = require('./grafo');
const C = require('./condicionales');
const Pu = require('./puerta');
const En = require('./entradas');
const A = require('./alarma');
const { construir, ZONA_TERMINO } = require('./ruta');
const { aMetros, aGrados } = require('./geo');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(54)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
function rng(s0) { let s = s0 >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const SEMILLA = 20260803;

// ⭐ Los tres casos, con las coordenadas del fichero de POI de la tanda 12 y el
//    número que quedó publicado. ⛔ Ninguno va de memoria.
const CONOCIDOS = [
  { n: 'Estación Delicias', lat: 41.65857, lon: -0.91139, publicado: 'rutea a 25,8 m de su entrance=main (tanda 13, D3)' },
  { n: 'Hospital Clínico Lozano Blesa', lat: 41.64321, lon: -0.90341, publicado: 'enganche del centro a 45,8 m (tanda 12, D1)' },
  { n: 'C.C. Utrillas', lat: 41.64014, lon: -0.86815, publicado: 'enganche del centro a 28,7 m (tanda 12, D1)' },
];

const T0 = Date.now();
const E = En.cargar();
const g = construir(ZONA_TERMINO);
const idx = P.indexarAristas(g.aristas, (e) => e.pie);
const Ed = C.edificios();

// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(106));
log('A1 · ⭐ LA CLASIFICACIÓN — antes de contar, y con el motivo de cada corte');
di('fichero', 'data/fuentes/2026-08-03_overpass_zaragoza-entrance-nodos.json');
di('sello de la descarga', E.sello);
di('nodos con entrance=* en el término', E.n);
di('⭐ POSITIVO DE CONTROL · farmacias en la misma consulta', E.control.farmacias
  + (E.control.farmacias > 0 ? '  ✅ el buscador funciona' : '  ⛔ BUSCADOR ROTO'));
A.exige(E.control.farmacias > 0, 'el positivo de control de la descarga de entradas no devuelve nada');
log('');
log('   ' + 'valor'.padEnd(22) + 'n'.padStart(7) + '   clase        por qué');
{
  const motivo = {
    main: 'la principal declarada — es la única que el dato llama así',
    persona: 'se entra a pie, pero el dato NO dice que sea la principal',
  };
  for (const [k, n] of [...E.porTipo.entries()].sort((a, b) => b[1] - a[1])) {
    const c = En.clase(k);
    log('   ' + ('entrance=' + k).padEnd(22) + String(n).padStart(7) + '   ' + c.padEnd(12)
      + ' ' + (c === 'descartada' ? '⛔ ' + En.DESCARTADA.get(k)
        : c === 'desconocida' ? '⚠️ valor no previsto: se cuenta aparte y NO se usa'
          : (c === 'main' ? '⭐ ' : '') + motivo[c]));
  }
}
{
  const cl = { main: 0, persona: 0, descartada: 0, desconocida: 0 };
  for (const e of E.porNodo.values()) cl[e.clase]++;
  log('');
  di('⭐ usables como PRINCIPAL', cl.main);
  di('⭐ usables CON AVISO (no es la principal)', cl.persona);
  di('⛔ descartadas, y cada una por su motivo', `${cl.descartada}  (${pct(cl.descartada, E.n)})`);
  di('⚠️ valores no previstos (se cuentan, no se usan)', cl.desconocida);
  A.exige(cl.main + cl.persona + cl.descartada + cl.desconocida === E.n,
    'la clasificación de entradas no suma el total: se está perdiendo algún valor');
}

// ── el emparejamiento edificio ↔ entrada, por ID DE NODO ────────────────────
const conEntrada = [];      // polis con al menos una entrada USABLE
const soloDescartadas = [];
let emparejadas = 0;
for (const po of Ed.polis) {
  if (!po.nodos) continue;
  const acc = En.deEdificio(po.nodos, E);
  const total = acc.principales.length + acc.persona.length + acc.descartadas.length + acc.desconocidas.length;
  if (!total) continue;
  emparejadas += total;
  if (acc.principales.length || acc.persona.length) conEntrada.push({ po, acc });
  else soloDescartadas.push({ po, acc });
}
log('');
di('edificios en la ventana', Ed.polis.length);
di('⭐ con alguna entrada USABLE (por id de nodo)', `${conEntrada.length}  (${pct(conEntrada.length, Ed.polis.length)})`);
di('   con entradas, pero todas descartadas', soloDescartadas.length);
di('entradas emparejadas con un edificio', `${emparejadas} de ${E.n}  (${pct(emparejadas, E.n)})`);
log('   ⚠️ el resto no es un fallo del emparejamiento: la ventana de edificios es solo el');
log('      centro denso (41,62–41,69 · -0,935 a -0,84) y una entrada fuera de ahí no tiene');
log('      con qué emparejarse. Se mide abajo cuántas caen dentro y no encuentran edificio.');
{
  // ⭐ el cero se comprueba: ¿cuántas entradas caen DENTRO de la ventana y aun así
  //    no encuentran edificio? Si fueran muchas, el emparejamiento estaría roto.
  const usadas = new Set();
  for (const { po } of [...conEntrada, ...soloDescartadas]) for (const n of po.nodos) if (E.porNodo.has(n)) usadas.add(n);
  let dentroSin = 0, fuera = 0;
  for (const e of E.porNodo.values()) {
    if (usadas.has(e.id)) continue;
    if (C.enVentana(e.lat, e.lon)) dentroSin++; else fuera++;
  }
  di('   sin edificio, FUERA de la ventana', fuera + '   ⇒ no hay con qué emparejar');
  di('   sin edificio, DENTRO de la ventana', dentroSin
    + '   ⇒ nodos de entrada que no son vértice de ningún building=*');
}

// ═════════════════════════════════════════════════════════════════════════════
// A2 · ¿A CUÁNTOS DESTINOS LES CAMBIA ALGO, Y CUÁNTO SE MUEVE EL PUNTO?
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(106));
log('A2 · ⭐ ¿A CUÁNTOS DESTINOS LES CAMBIA EL PUNTO, Y CUÁNTO SE MUEVE?');
log('   ⚠️ El destino de un edificio DEPENDE DEL ORIGEN —el motor elige la puerta más');
log('      barata por ruta—, así que "el punto" no existe sin decir desde dónde. Se mide');
log('      con orígenes al azar por BANDAS de distancia, semilla declarada.');

// nodos del grafo utilizables como origen: los de la componente mayor
const mayor = (() => { let b = 0; for (let i = 1; i < g.comp.tamanos.length; i++) if (g.comp.tamanos[i] > g.comp.tamanos[b]) b = i; return b; })();
const nodosOrigen = [];
for (let i = 0; i < g.nodos.length; i++) if (g.comp.comp[i] === mayor) nodosOrigen.push(i);

const BANDAS = [[300, 800], [800, 2000]];

/**
 * Para un edificio y un origen: dónde ruteaba ANTES (perímetro) y dónde rutea
 * AHORA (la regla nueva), en un solo Dijkstra.
 * ⭐ Los dos conjuntos de candidatos entran en la MISMA copia del grafo: comparar
 *    dos Dijkstras distintos deja la puerta abierta a que la diferencia sea del
 *    arnés y no de la regla.
 */
function antesYdespues(poli, nodoOrigen) {
  const viejos = Pu.candidatos(poli, g.aristas, idx);
  const ac = Pu.accesos(poli, g.aristas, idx, E);
  if (!viejos.length || !ac.cands.length) return null;
  const nodos = g.nodos.slice();
  const ady = g.ady.map((l) => l.slice());
  const idV = viejos.map((c) => G.insertar(g.aristas, ady, nodos, c));
  const idN = ac.cands.map((c) => G.insertar(g.aristas, ady, nodos, c));
  const r = G.dijkstra(ady, nodoOrigen);
  const arg = (ids, cs) => {
    let mj = -1, co = Infinity;
    for (let i = 0; i < ids.length; i++) { const c = r.dist[ids[i]] + cs[i].d; if (c < co) { co = c; mj = i; } }
    return mj === -1 || !Number.isFinite(co) ? null : { c: cs[mj], coste: co };
  };
  const v = arg(idV, viejos), n = arg(idN, ac.cands);
  if (!v || !n) return null;
  return { viejo: v, nuevo: n, nivel: ac.nivel,
    mov: Math.hypot(v.c.m[0] - n.c.m[0], v.c.m[1] - n.c.m[1]),
    dCoste: n.coste - v.coste };
}

function medirGrupo(lista, etiqueta) {
  const r = rng(SEMILLA + 7);
  const filas = [];
  for (const { po } of lista) {
    const c = Pu.centroide(po.pts);
    for (const [a, b] of BANDAS) {
      // un origen al azar dentro de la banda de distancia al edificio
      let elegido = -1;
      for (let intento = 0; intento < 60 && elegido === -1; intento++) {
        const i = nodosOrigen[Math.floor(r() * nodosOrigen.length)];
        const d = Math.hypot(g.nodos[i].x - c[0], g.nodos[i].y - c[1]);
        if (d >= a && d <= b) elegido = i;
      }
      if (elegido === -1) continue;
      const x = antesYdespues(po, elegido);
      if (x) filas.push({ ...x, banda: `${a}–${b}`, nombre: po.nombre });
    }
  }
  return filas;
}

const filas = medirGrupo(conEntrada, 'con entrada');
log('');
log('   ' + 'banda del origen'.padEnd(20) + 'pares'.padStart(8) + 'cambia el punto'.padStart(18)
  + 'movimiento mediano'.padStart(21) + 'p90'.padStart(9) + 'máx'.padStart(9));
for (const [a, b] of BANDAS) {
  const s = filas.filter((f) => f.banda === `${a}–${b}`);
  if (!s.length) continue;
  const mv = s.map((f) => f.mov).sort((x, y) => x - y);
  const q = (p) => mv[Math.min(mv.length - 1, Math.floor(p * mv.length))];
  const cambian = s.filter((f) => f.mov > 0.5).length;
  log('   ' + `${a}–${b} m`.padEnd(20) + String(s.length).padStart(8)
    + `${cambian}  (${pct(cambian, s.length)})`.padStart(18)
    + `${q(0.5).toFixed(1)} m`.padStart(21) + `${q(0.9).toFixed(1)} m`.padStart(9)
    + `${mv[mv.length - 1].toFixed(1)} m`.padStart(9));
}
{
  const cambian = filas.filter((f) => f.mov > 0.5);
  const gordos = filas.filter((f) => f.mov > 25);
  log('');
  di('⭐ pares donde el destino SE MUEVE (> 0,5 m)', `${cambian.length} de ${filas.length}  (${pct(cambian.length, filas.length)})`);
  di('   y se mueve más de 25 m', `${gordos.length}  (${pct(gordos.length, filas.length)})`);
  const peor = filas.slice().sort((a, b) => b.mov - a.mov)[0];
  if (peor) di('   el que más se mueve', `${peor.mov.toFixed(1)} m   (nivel ${peor.nivel}, banda ${peor.banda} m)`);
  // ⚠️ lo que CUESTA la decisión: ir a la puerta declarada puede ser más largo que
  //    ir al punto de perímetro más barato. Es correcto y hay que verlo, no taparlo.
  const dc = filas.map((f) => f.dCoste).sort((a, b) => a - b);
  const q = (p) => dc[Math.min(dc.length - 1, Math.floor(p * dc.length))];
  log('');
  di('⚠️ lo que CUESTA en metros ir a la puerta declarada', `mediana ${q(0.5).toFixed(1)} m · p90 ${q(0.9).toFixed(1)} m · máx ${dc[dc.length - 1].toFixed(1)} m`);
  log('      ⇒ un número positivo NO es un empeoramiento: es que la puerta de verdad está');
  log('        más lejos que el trozo de fachada más cómodo. Preferir la fachada era');
  log('        preferir nuestra estimación al dato.');
  const negativos = dc.filter((x) => x < -0.01).length;
  di('   pares donde la puerta declarada sale MÁS CORTA', negativos);

  // ⭐ CLASIFICAR ANTES DE CONTAR (ley 29): «97,3 % cambia» no dice nada útil si el
  //    cambio mediano son 6,7 m. Lo que hay que mirar son los que se mueven mucho,
  //    con su nombre, para poder comprobarlos a mano.
  log('');
  log('   ⭐ LOS QUE MÁS SE MUEVEN, con nombre — la lista que se puede comprobar a mano:');
  log('      ' + 'mueve'.padStart(9) + '  ' + 'cuesta'.padStart(9) + '  ' + 'nivel'.padEnd(12) + 'edificio');
  const vistos = new Set();
  for (const f of filas.slice().sort((a, b) => b.mov - a.mov)) {
    const n = f.nombre || '(sin nombre en OSM)';
    if (vistos.has(n)) continue;
    vistos.add(n);
    log('      ' + `${f.mov.toFixed(0)} m`.padStart(9) + '  ' + `${f.dCoste >= 0 ? '+' : ''}${f.dCoste.toFixed(0)} m`.padStart(9)
      + '  ' + f.nivel.padEnd(12) + n);
    if (vistos.size >= 10) break;
  }
}

// ── el reparto de niveles sobre TODOS los edificios con entrada ──────────────
log('');
log('   por qué nivel entra cada edificio — y el caso que no se resuelve en silencio:');
{
  const c = new Map();
  for (const { po } of conEntrada) {
    const ac = Pu.accesos(po, g.aristas, idx, E);
    const k = ac.motivo === 'entrada-declarada-sin-red' ? '⚠️ entrada declarada que NO engancha a la red' : ac.nivel;
    c.set(k, (c.get(k) || 0) + 1);
  }
  for (const [k, v] of [...c.entries()].sort((a, b) => b[1] - a[1])) {
    log('      ' + String(k).padEnd(48) + String(v).padStart(6) + '  ' + pct(v, conEntrada.length).padStart(7));
  }
}

// ── ⭐ EL CONTROL NULO: los mismos orígenes, edificios SIN entrada declarada ──
log('');
log('   ⭐⭐ CONTROL NULO — el mismo arnés sobre edificios SIN ninguna entrada declarada.');
log('      Ahí la regla NO cambia, así que el desplazamiento tiene que ser 0,0 m en el');
log('      100 %. Cualquier otra cosa significaría que lo que mido arriba es ruido.');
{
  const r = rng(SEMILLA + 8);
  const sinEntrada = Ed.polis.filter((p) => p.nodos && !p.nodos.some((n) => E.porNodo.has(n)));
  const muestra = [];
  for (let i = 0; i < 150 && sinEntrada.length; i++) muestra.push({ po: sinEntrada[Math.floor(r() * sinEntrada.length)] });
  const fc = medirGrupo(muestra, 'control');
  const movidos = fc.filter((f) => f.mov > 0.001).length;
  di('   pares del control', fc.length);
  di('   ⭐ con desplazamiento distinto de 0', movidos + (movidos === 0 ? '   ✅ el arnés no inventa movimiento' : '   ⛔ EL ARNÉS ESTÁ ROTO'));
  A.exige(fc.length > 50, 'el control nulo se quedó sin casos: no demuestra nada');
  A.exige(movidos === 0, `el control nulo mueve ${movidos} destinos donde la regla no cambia`);
}

// ═════════════════════════════════════════════════════════════════════════════
// A3 · LOS TRES CASOS CONOCIDOS, UNO A UNO, ANTES Y DESPUÉS
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(106));
log('A3 · ⭐⭐ LOS TRES CASOS CONOCIDOS — antes y después');
for (const k of CONOCIDOS) {
  const m = aMetros(k.lon, k.lat);
  log('');
  log('   ' + k.n);
  di('  publicado antes', k.publicado);
  const poli = Pu.edificioDe(m, Ed);
  if (!poli) { log('      ⚠️ el punto no cae dentro de ningún polígono ⇒ la regla no aplica: se queda en el punto pedido'); continue; }
  di('  edificio', `way ${poli.id}  «${poli.nombre || 'sin nombre en OSM'}»`);
  const acc = En.deEdificio(poli.nodos || [], E);
  di('  entradas declaradas', `main ${acc.principales.length} · persona ${acc.persona.length} · descartadas ${acc.descartadas.length}`
    + (acc.descartadas.length ? '  (' + [...new Set(acc.descartadas.map((e) => e.tipo))].join(', ') + ')' : ''));
  const ac = Pu.accesos(poli, g.aristas, idx, E);
  di('  ⭐ nivel que aplica', ac.nivel.toUpperCase() + '   ' + ac.motivo);
  // ⛔⛔ Y AQUÍ NO SE MIDE `puertaDe()`. Es la regla [2] —«el perímetro más pegado a
  //    la calle»— y **el motor no la usa**: usa [3], el perímetro más barato POR
  //    RUTA, que depende del origen. La tanda 13 midió estos tres casos con [2],
  //    con la advertencia impresa dos pantallas más arriba en su propio informe.
  //    ⇒ se mide sobre la regla que manda, y con orígenes al azar por bandas.
  const r = rng(SEMILLA + 11);
  const cen = Pu.centroide(poli.pts);
  const dEnt = [];
  let n = 0, sobre = 0;
  for (let intento = 0; intento < 900 && n < 60; intento++) {
    const i = nodosOrigen[Math.floor(r() * nodosOrigen.length)];
    const dd = Math.hypot(g.nodos[i].x - cen[0], g.nodos[i].y - cen[1]);
    if (dd < 300 || dd > 2000) continue;
    const x = antesYdespues(poli, i);
    if (!x) continue;
    n++;
    const usar = acc.principales.length ? acc.principales : acc.persona;
    if (!usar.length) continue;
    const d = Math.min(...usar.map((e) => Math.hypot(x.viejo.c.m[0] - e.m[0], x.viejo.c.m[1] - e.m[1])));
    dEnt.push(d);
    if (d <= 5) sobre++;
  }
  if (!dEnt.length) {
    log('      ⇒ sin entradas declaradas: no hay contra qué medir. `NO CONSTA` si la puerta era una puerta.');
  } else {
    const s = dEnt.slice().sort((a, b) => a - b);
    di('  ⭐ ANTES · el destino REAL del motor ([3], por ruta)', `a ${s[Math.floor(s.length / 2)].toFixed(1)} m de la entrada declarada `
      + `más cercana (mediana de ${n} orígenes)`);
    di('     y caía justo ENCIMA de una (≤ 5 m)', `${sobre} de ${dEnt.length}  (${pct(sobre, dEnt.length)})`);
    di('  ⭐ AHORA · el destino es la entrada declarada', '0,0 m en el 100 %   ⚠️ POR CONSTRUCCIÓN');
    log('      ⚠️ ese 100 % NO es un logro y no entra en ningún veredicto: el destino nuevo ES');
    log('         la entrada, así que la distancia es cero por definición (ley 35). Lo que');
    log('         informa es la línea de ARRIBA, que dice de dónde se venía.');
  }
  if (ac.aviso) log('      ⚠️ AVISO AL USUARIO: ' + ac.aviso);
}

// ═════════════════════════════════════════════════════════════════════════════
// A5 · EL AVISO, TAL COMO LO VERÍA UN USUARIO
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(106));
log('A5 · ⭐ EL AVISO CUANDO LA ENTRADA NO ES LA PRINCIPAL');
log('   ⛔ No inventa nombres: dice el tipo tal como viene del dato. Si OSM pone `yes`,');
log('      el aviso pone `yes`. Poner «puerta lateral de la calle X» sería escribir dato.');
{
  const conAviso = conEntrada.filter(({ acc }) => !acc.principales.length && acc.persona.length);
  di('edificios que lo llevarían', `${conAviso.length} de ${conEntrada.length}  (${pct(conAviso.length, conEntrada.length)})`);
  const ej = conAviso.slice(0, 3);
  for (const { po, acc } of ej) {
    log('');
    log('      «' + (po.nombre || 'edificio sin nombre en OSM') + '»');
    log('      ⚠️  ' + En.elegir(acc).aviso);
  }
  log('');
  log('   ⭐ y cuando SÍ es la principal, no hay aviso: el dato dice lo que hace falta y');
  log('     avisar de todo es no avisar de nada.');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(106));
log('A6 · ⚠️⚠️ EL CABO QUE NO SE PUEDE CERRAR');
log('   Una entrada declarada PUEDE ESTAR CERRADA AL PÚBLICO. `entrance=*` dice «aquí hay');
log('   una puerta», no «aquí se puede pasar ahora». Un portón que solo abre de día, un');
log('   edificio que cambió de uso, una puerta que existía cuando alguien la mapeó.');
log('   ⇒ Con este dato: **NO CONSTA**, y no por falta de método — por falta de dato.');
log('   ⇒ Es el mismo límite que tienen los pasos condicionales, y se declara igual.');
log('   ⚠️ Y hay un segundo, más pequeño: `entrance=yes` puede ser una puerta lateral');
log('     perfectamente buena o una de servicio que nadie etiquetó mejor. El dato no');
log('     distingue, y el aviso tampoco pretende distinguir: dice lo que se sabe.');

log('');
log(A.cierre('entrance=* EN EL MOTOR'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
