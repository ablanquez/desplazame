// ⭐ TANDA 22 · EL DATO DEL MAPA DE DOS COLORES — vuelca, no recalcula.
//
//   node src/exportar-nombre-simple.js
//
// Dos colores y ya: azul si la línea tiene nombre de vía, rojo si no.
// ⭐ El nombre cuenta **esté declarado o deducido**: si la línea tiene nombre, azul.
//    ⇒ se usa el modelo completo (`Mo.construirModelo`), que es el mismo que imprime
//      el texto de las rutas. ⛔ Si aquí se decidiera por otro camino, el mapa y el
//      itinerario dirían cosas distintas de la misma línea (fallo nº68).
//
// ⚠️ Sale como `.js` con `window.SIMPLE = …` y no como `.json` por lo mismo que los
//    otros dos exportadores: un HTML abierto con doble clic no puede hacer `fetch`
//    de un fichero local (CORS con `file://`); un `<script src>` sí carga.
//
// ⛔ NO se simplifica la geometría, igual que en `src/exportar.js`: el dibujo es el
//    grafo, no una aproximación cómoda.

'use strict';
const fs = require('fs');
const path = require('path');
const { aGrados, aMetros } = require('./geo');
const A = require('./alarma');
const D = require('./direccion');
const Mo = require('./modelo');
const Rel = require('./relato');
const PL = require('./planarizar');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

const SALIDA = path.join(__dirname, '..', 'tools', 'nombre-simple-visor.js');
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const pg = (p) => { const g = aGrados(p[0], p[1]); return [r6(g[0]), r6(g[1])]; };

// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ EL COLOR SE PREGUNTA POR EL MISMO CAMINO QUE EL MOTOR — bitácora nº107
// ═════════════════════════════════════════════════════════════════════════════
//   La primera versión leía `M[i].via`, que es el nombre **por ARISTA**. El motor
//   no usa eso: `relato.js` pregunta **por WAY** (`resolverPorWay`), porque el
//   texto corta por way. Y no dan lo mismo:
//
//       nombre por ARISTA (lo que pintaba el mapa)        44.842
//       nombre por WAY a secas (`deWay`)                  45.252
//       ⭐ lo que dice EL REDACTOR (lo que se pinta ahora)  45.593
//       ⛔ con nombre para el motor y saliendo ROJAS   774  (25,32 km)
//       ⚠️ al revés                                     23  ( 2,43 km)
//
//   Las 774 son TODAS de fuente `municipal-bici`, que es la única que se asigna
//   arista a arista: un way podía tener la mitad de sus aristas asignadas, el
//   motor lo nombraba entero y el mapa pintaba la otra mitad de rojo.
//
//   ⇒ **El mapa pinta lo que el producto dice.** Si el motor le pone nombre a esa
//     línea, la línea es azul. Un mapa que contradice al buscador de rutas no es
//     un mapa distinto: es un mapa equivocado.
//   ⭐⭐ Y NO SE COPIA LA REGLA: SE LLAMA AL REDACTOR. El color de cada línea sale
//     de `Rel.tramo()`, **la misma función que escribe el texto de las rutas**.
//     Copiar «primero OSM, luego el modelo» aquí sería un segundo camino de código
//     desde el mismo dato, y ésa es la forma exacta del fallo nº68 y del de hoy.
//     ⚠️ La primera versión del arreglo usaba `deWay` a secas —el modelo por way— y
//     **seguía divergiendo en 341 líneas**: un way que OSM SÍ nombra puede no llegar
//     a 2/3 en `resolverPorWay` y quedarse sin entrada, y el redactor lo nombra
//     igual porque mira OSM primero. ⇒ el único camino seguro es no tener dos.
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ TANDA 26 · TRES CATEGORÍAS, PORQUE HABÍA DOS COSAS EN EL MISMO ROJO
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Si un paso de cebra es un paso de cebra y no tiene nombre, no lo tendrá
//   >  que tener ninguno.»* — Antonio
//
//   Una **acera sin nombre** es información que falta. Un **paso de cebra sin
//   nombre** no lo es. Pintarlos del mismo rojo hacía que el mapa **exagerase el
//   problema**: 3.786 aristas de paso llevaban además un nombre DEDUCIDO por
//   nosotros, así que ni siquiera salían rojas — salían **azules**.
//
//   1 = tiene nombre (azul) · 0 = no lo tiene y debería (rojo) · 2 = no aplica (gris)
//
//   ⛔ Y el 2 no se decide aquí tampoco: lo dice `Rel.tramo().noAplica`, que lo
//     lee de `planarizar.js`. Este fichero sigue sin tener ni una regla propia.
const nombreDeLinea = (tramoDe, e) => tramoDe(e).nombre;
const CATEGORIA = (t) => (t.noAplica ? 2 : (t.nombre ? 1 : 0));

function construirSalida() {
  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const { M, deWay, modeloDeWay } = Mo.construirModelo(g, portales);
  const nombreDeWay = (id) => g.nombres.get(id) || null;
  // ⛔ EL ÚNICO SITIO DONDE SE DECIDE EL COLOR, y no decide aquí: pregunta.
  const tramoDe = (e) => Rel.tramo(
    { way: e.way, precision: e.precision, metros: e.largo }, nombreDeWay, 0, modeloDeWay);

  const aristas = g.aristas.map((e) => ({ g: e.pts.map(pg), n: CATEGORIA(tramoDe(e)) }));

  const con = aristas.filter((a) => a.n === 1).length;
  const noAp = aristas.filter((a) => a.n === 2).length;
  return {
    g, M, deWay, tramoDe, nombreDeWay,
    salida: {
      sello: g.sello, zona: g.zona, generado: 'src/exportar-nombre-simple.js',
      contadores: { total: aristas.length, conNombre: con,
        sinNombre: aristas.length - con - noAp, noAplica: noAp },
      aristas,
    },
  };
}

if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(48)} ${v}`);
  const T0 = Date.now();
  const { g, M, deWay, tramoDe, nombreDeWay, salida } = construirSalida();

  // ── la reproyección, ANTES de escribir nada ────────────────────────────────
  let peor = 0;
  for (const n of g.nodos) {
    const gr = aGrados(n.x, n.y);
    const v = aMetros(gr[0], gr[1]);
    peor = Math.max(peor, Math.hypot(n.x - v[0], n.y - v[1]));
  }

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, 'window.SIMPLE = ' + JSON.stringify(salida) + ';\n', 'utf8');
  const bytes = fs.statSync(SALIDA).size;

  log('='.repeat(88));
  log('EL DATO DEL MAPA DE DOS COLORES');
  log('='.repeat(88));
  log('');
  di('reproyección · error máximo ida y vuelta', (peor * 1000).toFixed(3) + ' mm  ' + (peor < 0.01 ? '✅' : '⛔'));
  A.exige(peor < 0.01, `la reproyección tiene ${peor.toFixed(3)} m de error`);

  log('');
  log('   ⭐ EL CUADRE — lo exportado contra EL REDACTOR (`relato.js`), línea a línea');
  const conW = g.aristas.filter((e) => CATEGORIA(tramoDe(e)) === 1).length;
  const grisW = g.aristas.filter((e) => CATEGORIA(tramoDe(e)) === 2).length;
  const c = salida.contadores;
  di('AZULES · con nombre — exportado / modelo', `${c.conNombre} / ${conW}   ${c.conNombre === conW ? '✅' : '⛔'}`);
  di('ROJAS  · sin nombre — exportado / modelo', `${c.sinNombre} / ${g.aristas.length - conW - grisW}   ${c.sinNombre === g.aristas.length - conW - grisW ? '✅' : '⛔'}`);
  di('⭐ GRISES · no aplica — exportado / modelo', `${c.noAplica} / ${grisW}   ${c.noAplica === grisW ? '✅' : '⛔'}`);
  di('⭐ suman', `${c.conNombre + c.sinNombre + c.noAplica} de ${g.aristas.length}   ${c.conNombre + c.sinNombre + c.noAplica === g.aristas.length ? '✅ ninguna fuera' : '⛔ FALTAN'}`);
  A.exige(c.conNombre === conW, 'el exportado no cuadra con lo que dice el redactor');
  A.exige(c.noAplica === grisW, 'los grises exportados no cuadran con lo que dice el redactor');
  A.exige(c.conNombre + c.sinNombre + c.noAplica === g.aristas.length, 'las tres cuentas no suman las aristas del grafo');
  // ⭐ EL NÚMERO QUE PIDIÓ ANTONIO: cuántas rojas quedan DE VERDAD.
  log('');
  di('⭐⭐ ROJAS DE VERDAD (líneas a las que les falta el nombre)', c.sinNombre);
  di('   …y cuántas eran antes, con los pasos dentro del rojo', c.sinNombre + c.noAplica);

  // ⚠️ EL CUADRE DE ARRIBA PASA POR CONSTRUCCIÓN, y eso es lo que se buscaba: el
  //    color LO DECIDE el redactor, así que no puede discrepar de él. **Ésa es la
  //    garantía**, no la comprobación. ⇒ lo que informa es la DIFERENCIA con las
  //    dos reglas anteriores, que es exactamente lo que estaba mal.
  log('');
  log('   ⚠️ Ese cuadre PASA POR CONSTRUCCIÓN, y es lo que se buscaba: el color lo decide el');
  log('      redactor, así que no puede discrepar de él. **Eso es la garantía, no la prueba.**');
  log('      Lo que informa es la diferencia con las dos reglas anteriores:');
  {
    const conA = M.filter((m) => m.via && m.via.nombre).length;
    const conD = g.aristas.filter((e) => { const w = deWay.get(e.way); return !!(w && w.via && w.via.nombre); }).length;
    const soloWay = [], soloArista = [];
    for (let i = 0; i < g.aristas.length; i++) {
      const a = !!(M[i].via && M[i].via.nombre);
      const w = CATEGORIA(tramoDe(g.aristas[i])) === 1;
      if (!a && w) soloWay.push(i); else if (a && !w) soloArista.push(i);
    }
    const km = (l) => (l.reduce((s, i) => s + g.aristas[i].largo, 0) / 1000).toFixed(2) + ' km';
    di('por ARISTA (lo que pintaba antes) — ⛔ la regla mala', conA);
    di('por WAY a secas (`deWay`) — ⚠️ tampoco, pierde nombres de OSM', conD);
    di('⭐ lo que dice EL REDACTOR (lo que se pinta ahora)', conW);
    di('⛔ tenían nombre para el MOTOR y salían ROJAS', `${soloWay.length}  (${km(soloWay)})`);
    di('⚠️ el modelo por arista les da nombre y NO se pintan azules', `${soloArista.length}  (${km(soloArista)})`);
    const gris = soloArista.filter((i) => PL.SIN_NOMBRE_POR_DEFINICION.has(g.aristas[i].precision));
    log('      ' + String(gris.length).padStart(6) + '  ⭐ porque son PASOS DE PEATONES y van de gris: '
      + 'OSM les puso nombre y el dato lo respeta, pero el');
    log('              mapa no las pinta de azul — la pregunta «¿tiene nombre?» no aplica ahí.');
    log('      ' + String(soloArista.length - gris.length).padStart(6) + '  el way no llega a 2/3 en `resolverPorWay`');
    const fu = new Map();
    for (const i of soloWay) {
      const w = deWay.get(g.aristas[i].way);
      const k = (w && w.via && w.via.fuente) || 'osm (el way no llega a 2/3 en `resolverPorWay`)';
      fu.set(k, (fu.get(k) || 0) + 1);
    }
    for (const [k, v] of [...fu.entries()].sort((a, b) => b[1] - a[1])) {
      log('      ' + String(v).padStart(6) + '  de fuente `' + k + '`');
    }
    log('      ⇒ `municipal-bici` es la ÚNICA fuente que se asigna arista a arista: un way');
    log('        con la mitad de sus aristas asignadas lo nombraba el motor entero y el mapa');
    log('        pintaba la otra mitad de rojo.');
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ⭐⭐ QUÉ ES EL GRIS — y qué NO se comprueba aquí, dicho antes de que nadie
  //     lo suponga (bitácora nº110)
  // ═════════════════════════════════════════════════════════════════════════════
  //   ⛔ AQUÍ NO VA EL «ANTES / AHORA». La primera versión lo puso, reconstruyendo
  //     el «antes» con `deWay` — que es el modelo YA ARREGLADO— y publicó
  //     «53.078 azules antes» cuando el número real era 56.864. Encima su cuadre
  //     salía ✅ **por construcción**: azules+rojas+grises siempre suman el total,
  //     se muevan como se muevan. ⇒ el antes/ahora vive en `src/paso-de-cebra.js`,
  //     que monta el modelo **de las dos maneras** y pregunta al redactor las dos
  //     veces. Aquí solo se comprueba lo que este fichero puede comprobar solo.
  log('');
  log('   ⭐ QUÉ ES EL GRIS — la identidad exacta, en las dos direcciones');
  {
    const pasos = [];
    for (let i = 0; i < g.aristas.length; i++) {
      if (PL.SIN_NOMBRE_POR_DEFINICION.has(g.aristas[i].precision)) pasos.push(i);
    }
    const grises = [];
    for (let i = 0; i < g.aristas.length; i++) if (salida.aristas[i].n === 2) grises.push(i);
    const soloPaso = pasos.filter((i) => salida.aristas[i].n !== 2);
    const soloGris = grises.filter((i) => !PL.SIN_NOMBRE_POR_DEFINICION.has(g.aristas[i].precision));
    di('aristas `paso-de-peatones` en el grafo', pasos.length);
    di('líneas pintadas de GRIS', grises.length);
    di('⛔ pasos que NO salen grises', soloPaso.length + (soloPaso.length ? '   ⛔' : '   ✅'));
    di('⛔ grises que NO son un paso', soloGris.length + (soloGris.length ? '   ⛔' : '   ✅'));
    A.exige(soloPaso.length === 0, 'hay pasos de peatones que no se pintan de gris');
    A.exige(soloGris.length === 0, 'hay líneas grises que no son pasos de peatones');
    log('   ⚠️ Las dos direcciones, y no una: «todos los pasos son grises» y «todos los grises');
    log('      son pasos» son afirmaciones distintas, y con una sola el gris podría estar');
    log('      llevándose media ciudad sin que se viera.');
    const conOsm = pasos.filter((i) => nombreDeWay(g.aristas[i].way));
    di('⭐ de esos pasos, los que OSM SÍ nombra', `${conOsm.length}  (${(conOsm.reduce((s, i) => s + g.aristas[i].largo, 0) / 1000).toFixed(2)} km)`);
    log('      ⛔ El nombre de OSM SE RESPETA en el dato: el modelo lo sigue llevando y el texto');
    log('        lo sigue teniendo. Lo que cambia es el COLOR: la pregunta «¿le falta el nombre?»');
    log('        no aplica a un paso de peatones, lo lleve o no.');
  }

  const vE = salida.aristas.reduce((s, a) => s + a.g.length, 0);
  const vG = g.aristas.reduce((s, e) => s + e.pts.length, 0);
  di('vértices exportados / del grafo', `${vE} / ${vG}   ${vE === vG ? '✅ sin simplificar' : '⛔'}`);
  A.exige(vE === vG, 'se han perdido vértices: el dibujo ya no es el grafo');

  log('');
  di('tools/nombre-simple-visor.js', (bytes / 1048576).toFixed(2) + ' MB');
  di('sello del dato', salida.sello);
  log('');
  log(A.cierre('EXPORTADO DEL MAPA SIMPLE'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { construirSalida, SALIDA, CATEGORIA };
