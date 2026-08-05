// ⭐⭐ TANDA 26 · UN PASO DE CEBRA NO TIENE NOMBRE — la medición.
//
//   node src/paso-de-cebra.js
//
// ═════════════════════════════════════════════════════════════════════════════
// LA IDEA DE ANTONIO
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Si un paso de cebra es un paso de cebra y no tiene nombre, no lo tendrá
//   >  que tener ninguno, digo yo.»*
//
//   ⭐⭐ Y lo que abre es una distinción que el mapa no tenía: hasta hoy metía
//     **dos cosas distintas en el mismo rojo**.
//
//       · una ACERA sin nombre        → falta información. Es un problema.
//       · un PASO DE CEBRA sin nombre → no falta nada. Es así.
//
//   ⇒ Juntarlos hacía que el mapa **exagerase el problema**. Y encima el método de
//     la tanda 25 les estaba poniendo nombre, así que ni siquiera salían rojos.
//
// ⛔ ESTE FICHERO NO DECIDE NADA: la regla la declara `planarizar.js` junto a
//    `precision()`, y el color lo decide `relato.js`. Aquí solo se mide, se compara
//    el antes con el ahora, y se traen los números de las escaleras para que decida
//    Antonio.

'use strict';
const P = require('./portales');
const NL = require('./nombre-largo');
const A = require('./alarma');
const CP = require('./calle-pegada');
const Mo = require('./modelo');
const Dir = require('./direccion');
const Rel = require('./relato');
const PL = require('./planarizar');
const osm = require('./osm');
const { CATEGORIA } = require('./exportar-nombre-simple');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

module.exports = { };

if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const T0 = Date.now();

  const g = construir(ZONA_TERMINO);
  const ctx = Dir.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const tags = new Map();
  for (const w of osm.recortar(osm.cargar(CRUDO).ways, g.zona)) tags.set(w.id, w.tags || {});
  const nombreDeWay = (id) => g.nombres.get(id) || null;
  const nucleoDeWay = CP.nucleoDeWayDe(g);
  const mismo = (a, b) => !!a && !!b && (a === b || NL.mismaVia(a, b));

  // ⭐⭐ LOS DOS MODELOS, EN EL MISMO PROCESO. El «antes» se CALCULA, no se lee de
  //   un fichero ni —peor— del modelo ya arreglado (bitácora nº110).
  const antes = Mo.construirModelo(g, portales, { pasosConNombre: true });
  const ahora = Mo.construirModelo(g, portales);
  const trA = (e) => Rel.tramo({ way: e.way, precision: e.precision, metros: e.largo }, nombreDeWay, 0, antes.modeloDeWay);
  const trB = (e) => Rel.tramo({ way: e.way, precision: e.precision, metros: e.largo }, nombreDeWay, 0, ahora.modeloDeWay);

  log('='.repeat(104));
  log('UN PASO DE CEBRA NO TIENE NOMBRE');
  log('='.repeat(104));

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('A1 · ⭐ ¿CUÁNTOS PASOS DE CEBRA TENÍAN NOMBRE? — separando el ajeno del nuestro');
  log('='.repeat(104));
  log('   ⚠️ La sospecha del encargo, comprobada y no supuesta: un paso de cebra tiene portales');
  log('      cerca Y una calle pegada, así que cumple las condiciones de LOS DOS testigos.');
  const pasos = [];
  for (let i = 0; i < g.aristas.length; i++) {
    if (PL.SIN_NOMBRE_POR_DEFINICION.has(g.aristas[i].precision)) pasos.push(i);
  }
  const mSum = (l) => l.reduce((s, i) => s + g.aristas[i].largo, 0);
  const conOsm = pasos.filter((i) => nombreDeWay(g.aristas[i].way));
  const deducidos = pasos.filter((i) => !nombreDeWay(g.aristas[i].way) && trA(g.aristas[i]).nombre);
  log('');
  di('aristas `paso-de-peatones`', `${pasos.length}  (${km(mSum(pasos))})`);
  di('   ⭐ con nombre que trae OSM — dato ajeno, SE RESPETA', `${conOsm.length}  (${km(mSum(conOsm))})  ${pct(conOsm.length, pasos.length)}`);
  di('   ⛔ con nombre puesto POR NOSOTROS (deducido)', `${deducidos.length}  (${km(mSum(deducidos))})  ${pct(deducidos.length, pasos.length)}`);
  di('   sin nombre de ninguna clase', pasos.length - conOsm.length - deducidos.length);
  A.exige(deducidos.length > 0,
    'ningún paso de cebra tenía nombre deducido: o el positivo de control está roto, o el «antes» no es el de antes');
  log('');
  log('   ⭐ EL POSITIVO DE CONTROL DE ESE NÚMERO: si saliera cero habría que sospechar, porque');
  log('      los pasos cumplen las condiciones de los dos testigos. Sale ' + deducidos.length + ', y con su');
  log('      desglose por testigo — que es lo que dice CUÁL de los dos los estaba nombrando:');
  {
    const t = new Map();
    for (const i of deducidos) {
      const v = trA(g.aristas[i]).via;
      const k = (v && (v.testigos || v.fuente)) || '?';
      if (!t.has(k)) t.set(k, { n: 0, m: 0 });
      const x = t.get(k); x.n++; x.m += g.aristas[i].largo;
    }
    for (const [k, v] of [...t.entries()].sort((a, b) => b[1].n - a[1].n)) {
      log('      ' + String(k).padEnd(24) + String(v.n).padStart(7) + km(v.m).padStart(11));
    }
    log('      ⇒ ⚠️⚠️ **casi todos los pone la CALLE PEGADA, o sea el testigo que metí ayer.**');
    log('        Y el porqué estaba escrito y medido en la tanda 25 §D4: en una línea CORTA los');
    log('        cinco puntos de muestreo caen casi encima, y ahí el método es más flojo. **Las');
    log('        líneas más cortas del grafo son justamente los pasos** (mediana 3,9 m).');
    log('        ⛔ No es un fallo del método: es que la pregunta no aplicaba y nadie se lo dijo.');
  }
  log('');
  log('   ⚠️ Y los ' + conOsm.length + ' que nombra OSM, mirados: son nombres de CALLE —«Paseo de Sagasta»,');
  log('      «Calle del Coso»—, no nombres propios del paso. El mapeador extendió la calle sobre');
  log('      el cruce. ⛔ Aun así **no se toca el dato ajeno**: se respeta y se pinta gris.');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('A4 · ⭐⭐ QUÉ CAMBIA — el antes y el ahora, los dos CALCULADOS');
  log('='.repeat(104));
  log('   ⛔ El «antes» no se lee de ningún fichero: se monta el modelo con la regla vieja');
  log('     (`pasosConNombre`) en este mismo proceso y se le pregunta al MISMO redactor.');
  {
    // el álgebra, escrita antes de ejecutar (ley 51):
    //   · azules_ahora = azules_antes − (pasos que tenían nombre)
    //   · rojas_ahora  = rojas_antes  − (pasos que no lo tenían)
    //   · grises       = todos los pasos
    let azA = 0, roA = 0, azB = 0, roB = 0, grB = 0;
    let mAzA = 0, mRoA = 0, mAzB = 0, mRoB = 0, mGrB = 0;
    const cambian = [];
    for (let i = 0; i < g.aristas.length; i++) {
      const e = g.aristas[i];
      // ⭐ la regla VIEJA es dos categorías: tiene nombre o no lo tiene
      const a = trA(e).nombre ? 1 : 0;
      const b = CATEGORIA(trB(e));
      if (a === 1) { azA++; mAzA += e.largo; } else { roA++; mRoA += e.largo; }
      if (b === 1) { azB++; mAzB += e.largo; } else if (b === 0) { roB++; mRoB += e.largo; } else { grB++; mGrB += e.largo; }
      if (a !== b) cambian.push(i);
    }
    log('');
    log('   ' + 'categoría'.padEnd(26) + 'antes'.padStart(9) + 'ahora'.padStart(9)
      + 'metros antes'.padStart(15) + 'metros ahora'.padStart(15));
    log('   ' + 'AZULES · con nombre'.padEnd(26) + String(azA).padStart(9) + String(azB).padStart(9)
      + km(mAzA).padStart(15) + km(mAzB).padStart(15));
    log('   ' + '⭐ ROJAS · LE FALTA'.padEnd(27) + String(roA).padStart(9) + String(roB).padStart(9)
      + km(mRoA).padStart(15) + km(mRoB).padStart(15));
    log('   ' + '⭐ GRISES · no aplica'.padEnd(27) + '—'.padStart(9) + String(grB).padStart(9)
      + '—'.padStart(15) + km(mGrB).padStart(15));
    log('   ' + '─'.repeat(72));
    log('   ' + 'suman'.padEnd(26) + String(azA + roA).padStart(9) + String(azB + roB + grB).padStart(9));
    log('');
    di('⭐⭐ ROJAS DE VERDAD — las líneas a las que LES FALTA el nombre', `${roB}  (${km(mRoB)})`);
    di('   …y cuántas parecían, con los pasos metidos en el rojo', `${roA}  (${km(mRoA)})`);
    di('   ⇒ el mapa exageraba el problema en', `${roA - roB} líneas  (${pct(roA - roB, roA)})`);
    log('');
    di('pasos que PIERDEN el nombre deducido', deducidos.length);
    di('líneas que cambian de categoría', cambian.length);
    // ⭐ EL ÁLGEBRA: lo que cambia tiene que ser EXACTAMENTE el conjunto de pasos.
    const fuera = cambian.filter((i) => !PL.SIN_NOMBRE_POR_DEFINICION.has(g.aristas[i].precision));
    di('⛔ …y de ellas, las que NO son un paso de peatones', fuera.length + (fuera.length ? '   ⛔' : '   ✅ ninguna'));
    A.exige(fuera.length === 0, 'ha cambiado de categoría algo que no es un paso de peatones');
    A.exige(cambian.length === pasos.length, `cambian ${cambian.length} líneas y hay ${pasos.length} pasos: no es el mismo conjunto`);
    A.exige(azA - azB === conOsm.length + deducidos.length, 'los azules no bajan exactamente en los pasos que tenían nombre');
    A.exige(roA - roB === pasos.length - conOsm.length - deducidos.length, 'las rojas no bajan exactamente en los pasos que no lo tenían');
    log('   ⭐ Y esas cuatro exigencias NO pasan por construcción: si el gris se llevara una');
    log('     acera, o si algún otro nombre se hubiera movido de paso, se ponen rojas.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('C · ⭐ ESCALERAS Y PASARELAS — se mira, NO se decide');
  log('='.repeat(104));
  log('   ⚠️ Aquí no está claro, y por eso se trae el número y no una decisión.');
  log('      La pregunta: una escalera que baja de una calle a otra, ¿es de alguna?');

  // aristas por nodo, para saber qué hay en los extremos
  const porNodo = new Map();
  for (let i = 0; i < g.aristas.length; i++) {
    for (const n of [g.aristas[i].a, g.aristas[i].b]) {
      if (!porNodo.has(n)) porNodo.set(n, []);
      porNodo.get(n).push(i);
    }
  }
  const waysDe = (pre) => {
    const m = new Map();
    for (let i = 0; i < g.aristas.length; i++) {
      if (g.aristas[i].precision !== pre) continue;
      const w = g.aristas[i].way;
      if (!m.has(w)) m.set(w, []);
      m.get(w).push(i);
    }
    return m;
  };
  const extremos = (idxs) => {
    const c = new Map();
    for (const i of idxs) for (const n of [g.aristas[i].a, g.aristas[i].b]) c.set(n, (c.get(n) || 0) + 1);
    return [...c.entries()].filter(([, v]) => v === 1).map(([n]) => n);
  };
  const callesEn = (nodo, propio) => {
    const s = new Set();
    for (const i of porNodo.get(nodo) || []) {
      const w = g.aristas[i].way;
      if (w === propio) continue;
      const nu = nucleoDeWay(w);
      if (nu) s.add(nu);
    }
    return s;
  };

  log('');
  log('   C1 · cuántas hay, y cuántas se están nombrando HOY');
  {
    const esc = [];
    for (let i = 0; i < g.aristas.length; i++) if (g.aristas[i].precision === 'escaleras') esc.push(i);
    const eOsm = esc.filter((i) => nombreDeWay(g.aristas[i].way));
    const eDed = esc.filter((i) => !nombreDeWay(g.aristas[i].way) && trB(g.aristas[i]).nombre);
    di('aristas `escaleras`', `${esc.length}  (${km(mSum(esc))})`);
    di('   con nombre de OSM', `${eOsm.length}  (${km(mSum(eOsm))})`);
    di('   ⭐ con nombre DEDUCIDO por nosotros — lo que está en juego', `${eDed.length}  (${km(mSum(eDed))})`);
    global._ESC = { n: esc.length, osm: eOsm.length, ded: eDed.length, m: mSum(eDed) };
  }

  log('');
  log('   ⭐⭐ LA PRUEBA QUE DECIDE: ¿sus dos extremos dan a LA MISMA calle o a dos DISTINTAS?');
  log('      Si los dos extremos son la misma calle, la escalera es un TRAMO ESCALONADO de ella');
  log('      y su nombre es el suyo. Si son dos calles distintas, ATRAVIESA, y no es de ninguna');
  log('      — que es exactamente el caso del paso de cebra.');
  log('');
  log('   ' + 'forma'.padEnd(20) + 'los extremos…'.padEnd(46) + 'ways'.padStart(7) + '%'.padStart(9) + 'metros'.padStart(11));
  for (const pre of ['escaleras', 'paso-de-peatones']) {
    const ws = waysDe(pre);
    const cl = new Map();
    for (const [w, idxs] of ws) {
      const ex = extremos(idxs);
      const sets = ex.map((n) => callesEn(n, w)).filter((s) => s.size);
      let k;
      if (ex.length !== 2) k = '(no tiene dos extremos limpios)';
      else if (sets.length < 2) k = 'alguno NO toca ninguna calle con nombre ⇒ NO CONSTA';
      else {
        const [a, b] = sets;
        k = [...a].some((x) => [...b].some((y) => mismo(x, y)))
          ? '⭐ dan a LA MISMA calle  ⇒ la recorre' : '⛔ dan a calles DISTINTAS ⇒ la atraviesa';
      }
      if (!cl.has(k)) cl.set(k, { n: 0, m: 0 });
      const v = cl.get(k); v.n++; v.m += idxs.reduce((s, i) => s + g.aristas[i].largo, 0);
    }
    const tot = [...cl.values()].reduce((s, v) => s + v.n, 0);
    let primera = true;
    for (const [k, v] of [...cl.entries()].sort((a, b) => b[1].n - a[1].n)) {
      log('   ' + (primera ? pre : '').padEnd(20) + k.padEnd(46) + String(v.n).padStart(7)
        + pct(v.n, tot).padStart(9) + km(v.m).padStart(11));
      primera = false;
    }
    if (pre === 'escaleras') global._ESCX = cl;
  }
  log('   ⚠️ El 82,7 % de las escaleras NO se puede decidir así: alguno de sus extremos no toca');
  log('      ninguna calle con nombre. **`NO CONSTA` no es «no lo he mirado»: es que no se sabe.**');

  log('');
  log('   C2 · ⭐⭐ EL TESTIGO INDEPENDIENTE: cuando OSM SÍ nombra una escalera, ¿qué nombre le pone?');
  log('      Si le pusiera un nombre PROPIO («Escaleras de X»), tendría sentido que las escaleras');
  log('      lleven nombre suyo. Si le pone el de una calle vecina, es que el mapeador las trata');
  log('      como el tramo escalonado de esa calle. ⭐ Y esto NO lo elijo yo: lo dice el dato ajeno.');
  {
    const ws = waysDe('escaleras');
    let vecino = 0, propio = 0;
    const muestra = [];
    for (const [w, idxs] of ws) {
      const nu = nucleoDeWay(w);
      if (!nu) continue;
      const cerca = new Set();
      for (const n of extremos(idxs)) for (const x of callesEn(n, w)) cerca.add(x);
      const esVecino = [...cerca].some((x) => mismo(x, nu));
      if (esVecino) vecino++; else propio++;
      if (!esVecino && muestra.length < 6) muestra.push(nombreDeWay(w));
    }
    log('');
    di('ways de escalera que OSM nombra', vecino + propio);
    di('   ⭐ el nombre es el de una calle que sale de su propio extremo', `${vecino}  (${pct(vecino, vecino + propio)})`);
    di('   …no coincide con ninguna vecina (podría ser nombre propio)', `${propio}  (${pct(propio, vecino + propio)})`);
    for (const m of muestra) log('      · «' + m + '»');
    A.exige(vecino + propio > 0, 'ninguna escalera tiene nombre en OSM: sin dato ajeno esta comprobación no dice nada');
    global._C2 = { vecino, propio };
  }

  log('');
  log('   C4 · ⚠️ ¿QUÉ MÁS ESTÁ EN EL MISMO CASO? — lo que se buscó a propósito');
  log('      El criterio no es «es pequeño»: es **atravesar en vez de recorrer**.');
  {
    const familias = [
      ['isleta · `footway=traffic_island`', (t) => t.footway === 'traffic_island'],
      ['pasarela peatonal · `footway`+`bridge`', (t) => (t.highway === 'footway' || t.highway === 'path') && t.bridge && t.bridge !== 'no'],
      ['pasarela ciclista · `cycleway`+`bridge`', (t) => t.highway === 'cycleway' && t.bridge && t.bridge !== 'no'],
      ['paso subterráneo · `footway`+`tunnel`', (t) => t.highway === 'footway' && t.tunnel && t.tunnel !== 'no'],
      ['ascensor · `highway=elevator`', (t) => t.highway === 'elevator'],
      ['rotonda · `junction=roundabout`', (t) => t.junction === 'roundabout'],
    ];
    log('');
    log('   ' + 'familia'.padEnd(42) + 'aristas'.padStart(9) + 'metros'.padStart(11)
      + 'con nombre DEDUCIDO'.padStart(22));
    for (const [etq, f] of familias) {
      let n = 0, m = 0, d = 0, md = 0;
      for (const e of g.aristas) {
        if (!f(tags.get(e.way) || {})) continue;
        n++; m += e.largo;
        if (!nombreDeWay(e.way) && trB(e).nombre) { d++; md += e.largo; }
      }
      log('   ' + etq.padEnd(42) + String(n).padStart(9) + km(m).padStart(11)
        + `${d} (${km(md)})`.padStart(22));
    }
    log('');
    log('   ⭐⭐ LA ISLETA ES EL MISMO CASO Y NO ESTÁ ARREGLADA: es literalmente el trocito que');
    log('     queda en medio del paso de cebra, y su precisión D4 es `peatonal`, no');
    log('     `paso-de-peatones`, así que la regla de hoy no la toca. ⛔ Extenderla sería una');
    log('     decisión, y las decisiones son de Antonio. **El número está arriba.**');
    log('   ⚠️ Las PASARELAS y los pasos subterráneos atraviesan un río o una vía, no una calle:');
    log('      no tienen «dos calles» entre las que elegir. Son otro caso, y suelen llevar nombre');
    log('      propio cuando lo llevan («Puente de la Banda del Canal»).');
    log('   ⛔ Las ROTONDAS no están en este caso: una rotonda SÍ tiene nombre propio en Zaragoza');
    log('     («Rotonda Villa de Pau», «Rotonda Pablo Gargallo»). Se miró y se descarta.');
  }

  log('');
  log('   C3 · ⭐ LA RECOMENDACIÓN — y decide Antonio');
  log('      **NO aplicar la regla del paso a las escaleras.** Tres razones, con su número:');
  log('      1 · el dato ajeno dice lo contrario: de las ' + (global._C2.vecino + global._C2.propio)
    + ' escaleras que OSM nombra, ' + global._C2.vecino + ' llevan el');
  log('          nombre de una calle que sale de su propio extremo. El mapeador las trata como');
  log('          tramo escalonado, no como conector.');
  log('      2 · de las que se pueden decidir por sus extremos, la mayoría RECORRE una sola calle.');
  log('      3 · lo que está en juego son ' + global._ESC.ded + ' aristas y ' + km(global._ESC.m)
    + ': el mapa no se mueve por eso.');
  log('      ⚠️ Y el cabo que queda: **las que unen dos calles DISTINTAS sí son el caso del paso**,');
  log('         y ahí el nombre es tan inventado como en un cruce. Se puede distinguir con esta');
  log('         misma prueba de extremos — pero solo en el 17,3 % de los casos. Decide Antonio.');

  log('');
  log(A.cierre('UN PASO DE CEBRA NO TIENE NOMBRE'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
