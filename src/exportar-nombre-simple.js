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
const PQ = require('./parques');
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

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ TANDA 28 · LA CUARTA CATEGORÍA — y es una VARIANTE DEL ROJO, no una hermana
// ═════════════════════════════════════════════════════════════════════════════
//   3 = verde: **la línea sigue siendo roja para el motor**, y el verde solo dice
//   *«está dentro de una zona verde, por eso es roja»*.
//
//   ⛔⛔ LA SEPARACIÓN QUE HACE QUE ESTO NO PUEDA ROMPER NADA:
//     · `CATEGORIA(t)`      → lo que dice EL MOTOR (0/1/2). No se toca.
//     · `CATEGORIA_MAPA()`  → añade una explicación GEOGRÁFICA encima, y **solo
//       puede convertir un 0 en un 3**. Nunca toca un 1 ni un 2.
//   ⇒ Una línea con nombre sigue azul pase lo que pase, así que el verde no puede
//     dejar sin nombre a ninguna calle. Y la prueba contra el motor colapsa 3→0 y
//     sigue exigiendo cero discrepancias: **el verde no puede tapar una divergencia**.
const CATEGORIA_MAPA = (t, e, idxVerde) => {
  const c = CATEGORIA(t);
  if (c !== 0 || !idxVerde) return c;
  return PQ.dentroDelVerde(idxVerde, e) ? 3 : 0;
};

function construirSalida() {
  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const { M, deWay, modeloDeWay } = Mo.construirModelo(g, portales);
  const nombreDeWay = (id) => g.nombres.get(id) || null;
  // ⛔ EL ÚNICO SITIO DONDE SE DECIDE EL COLOR, y no decide aquí: pregunta.
  const tramoDe = (e) => Rel.tramoDeArista(e, nombreDeWay, modeloDeWay);

  // ⭐ el índice de zonas verdes lo monta `parques.js`: la regla —qué capa manda y
  //   con qué listón— vive allí, no aquí. Este fichero sigue sin tener ni una.
  const idxVerde = PQ.indiceDelMapa();
  const aristas = g.aristas.map((e) => ({ g: e.pts.map(pg), n: CATEGORIA_MAPA(tramoDe(e), e, idxVerde) }));

  const cuenta = (k) => aristas.filter((a) => a.n === k).length;
  return {
    g, M, deWay, tramoDe, nombreDeWay, idxVerde,
    salida: {
      sello: g.sello, zona: g.zona, generado: 'src/exportar-nombre-simple.js',
      contadores: { total: aristas.length, conNombre: cuenta(1),
        sinNombre: cuenta(0), noAplica: cuenta(2), enVerde: cuenta(3) },
      aristas,
    },
  };
}

if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(48)} ${v}`);
  const T0 = Date.now();
  const { g, M, deWay, tramoDe, nombreDeWay, idxVerde, salida } = construirSalida();

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
  const rojoW = g.aristas.length - conW - grisW;      // lo que el MOTOR llama rojo
  const verdeW = g.aristas.filter((e) => CATEGORIA_MAPA(tramoDe(e), e, idxVerde) === 3).length;
  const c = salida.contadores;
  di('AZULES · con nombre — exportado / modelo', `${c.conNombre} / ${conW}   ${c.conNombre === conW ? '✅' : '⛔'}`);
  di('ROJAS  · le falta — exportado / modelo', `${c.sinNombre} / ${rojoW - verdeW}   ${c.sinNombre === rojoW - verdeW ? '✅' : '⛔'}`);
  di('⭐ VERDES · roja dentro de zona verde', `${c.enVerde} / ${verdeW}   ${c.enVerde === verdeW ? '✅' : '⛔'}`);
  di('GRISES · no aplica — exportado / modelo', `${c.noAplica} / ${grisW}   ${c.noAplica === grisW ? '✅' : '⛔'}`);
  const suma4 = c.conNombre + c.sinNombre + c.noAplica + c.enVerde;
  di('⭐ suman', `${suma4} de ${g.aristas.length}   ${suma4 === g.aristas.length ? '✅ ninguna fuera' : '⛔ FALTAN'}`);
  A.exige(c.conNombre === conW, 'el exportado no cuadra con lo que dice el redactor');
  A.exige(c.noAplica === grisW, 'los grises exportados no cuadran con lo que dice el redactor');
  A.exige(c.enVerde === verdeW, 'los verdes exportados no cuadran con la regla de `parques.js`');
  A.exige(suma4 === g.aristas.length, 'las cuatro cuentas no suman las aristas del grafo');
  // ⭐⭐ Y LA QUE DE VERDAD PROTEGE: el verde SOLO puede salir de una roja. Si algún
  //    día se comiera un azul o un gris, el motor y el mapa dirían cosas distintas.
  A.exige(c.sinNombre + c.enVerde === rojoW,
    'el verde no sale de las rojas: se está llevando líneas que el motor NO llama rojas');
  log('');
  di('⭐⭐ ROJAS DE VERDAD (rojas + verdes: al motor le falta el nombre en las dos)', rojoW);
  di('   …de ellas, EXPLICADAS por estar en zona verde', `${c.enVerde}  (${(100 * c.enVerde / rojoW).toFixed(1)} %)`);
  di('   …sin explicación: el rojo que queda', c.sinNombre);

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
    const gris = soloArista.filter((i) => g.aristas[i].nombreNoAplica);
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
      if (g.aristas[i].nombreNoAplica) pasos.push(i);
    }
    const grises = [];
    for (let i = 0; i < g.aristas.length; i++) if (salida.aristas[i].n === 2) grises.push(i);
    const soloPaso = pasos.filter((i) => salida.aristas[i].n !== 2);
    const soloGris = grises.filter((i) => !g.aristas[i].nombreNoAplica);
    di('aristas SIN NOMBRE POR DEFINICIÓN (paso de cebra + isleta)', pasos.length);
    di('líneas pintadas de GRIS', grises.length);
    di('⛔ las que NO salen grises', soloPaso.length + (soloPaso.length ? '   ⛔' : '   ✅'));
    di('⛔ grises que SÍ podrían tener nombre', soloGris.length + (soloGris.length ? '   ⛔' : '   ✅'));
    A.exige(soloPaso.length === 0, 'hay líneas sin nombre por definición que no se pintan de gris');
    A.exige(soloGris.length === 0, 'hay líneas grises que sí podrían tener nombre');
    log('   ⚠️ Las dos direcciones, y no una: «todas las que no tienen nombre son grises» y');
    log('      «todas las grises son de ésas» son afirmaciones distintas, y con una sola el gris');
    log('      podría estar llevándose media ciudad sin que se viera.');
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

module.exports = { construirSalida, SALIDA, CATEGORIA, CATEGORIA_MAPA };
