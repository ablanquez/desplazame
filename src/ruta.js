// El comando de interrogación del motor. SOLO LA FORMA.
//
// ⭐ Por qué existe desde el primer día (idea de Antonio): un motor que solo se
//    prueba a través de la pantalla entrega cada fallo mezclado con fallos de
//    interfaz, y no se sabe cuál es cuál. Esto no es comodidad de desarrollo: es
//    la diferencia entre depurar el motor y depurar la aplicación.
//
// ⛔ NO es una API HTTP, ni tiene opciones, ni formatea bonito. Eso se construiría
//    para un motor que todavía no sabemos cómo será.
// ⭐ Devuelve JSON, no prosa: lo que contesta en texto no se puede comprobar solo.
//
//   node src/ruta.js <latO> <lonO> <latD> <lonD>

'use strict';
const path = require('path');
const { aMetros } = require('./geo');
const osm = require('./osm');
const { planarizar } = require('./planarizar');
const G = require('./grafo');

const CRUDO = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_overpass_zaragoza-highway_geom-y-tags.json');

// La zona del primer grafo. Casco antiguo de Zaragoza.
//
// ⚠️ AMPLIADA respecto al primer intento, y por un motivo medido, no estético:
//    el bbox inicial (S 41.648 O -0.888 N 41.660 E -0.869) NO contenía la ventana
//    del crudo `casco-highway.json` de la tanda 3, que llega hasta O -0.8935.
//    De los 10 cruces de control, 7 caían fuera — y el control positivo daba
//    "3 de 10" cuando en realidad era "3 de 3". Es el error nº18 del proyecto
//    ("la misma zona del casco eran dos rectángulos distintos") por segunda vez.
//    Esta zona CONTIENE aquélla, así que todo lo medido antes es comparable.
//    La contención se comprueba en tiempo de ejecución, no se da por buena.
const ZONA_CASCO = { sur: 41.648, oeste: -0.8945, norte: 41.6615, este: -0.869 };

// EL TÉRMINO MUNICIPAL COMPLETO.
//
// ⛔ NO es el bbox del dato tal como vino. El crudo trae CUATRO Zaragozas
//    —España, Costa Rica y Zaragoza de Puebla (México)— porque
//    `area["name"="Zaragoza"]` devuelve un CONJUNTO de áreas, no un área.
//    Son 398 ways de 48.211: invisibles en el volumen, y mueven el bbox
//    18.000 km. Ver bitácora nº57.
//
// ⭐ Éste es el bbox del cúmulo español, con 50 m de holgura. Ningún way queda
//    a caballo de esta caja (comprobado: 0), así que el recorte es limpio y no
//    parte nada por la mitad. La exclusión se IMPRIME en el censo de cúmulos,
//    no se hace en silencio.
const ZONA_TERMINO = { sur: 41.4011, oeste: -1.2199, norte: 41.982, este: -0.6541 };

// La ventana del crudo de la tanda 3, para comprobar la contención.
const ZONA_TANDA3 = { sur: 41.65502, oeste: -0.89354, norte: 41.66034, este: -0.88177 };
function contiene(a, b) {
  return a.sur <= b.sur && a.oeste <= b.oeste && a.norte >= b.norte && a.este >= b.este;
}

// ⭐ Ley 37: la contención se comprueba EN EJECUCIÓN, no mirando los números.
//    Si el término no contuviera al casco, todo lo comparado contra la línea
//    base de la tanda 8 sería incomparable — y no se notaría.
if (!contiene(ZONA_TERMINO, ZONA_CASCO) || !contiene(ZONA_TERMINO, ZONA_TANDA3)) {
  throw new Error('ZONA_TERMINO no contiene al casco: la comparación con la tanda 8 no vale');
}

function construir(zona = ZONA_CASCO, opciones = {}) {
  const { sello, ways } = osm.cargar(CRUDO);
  const recorte = osm.proyectar(osm.recortar(ways, zona));
  const { nodos, aristas, contadores, noConectados, porDefecto, puntasLejos } = planarizar(recorte, opciones);
  const { ady, usadas } = G.adyacencia(nodos, aristas, true);
  const comp = G.componentes(nodos, ady);
  return { sello, zona, nodos, aristas, ady, comp, contadores, noConectados, porDefecto,
    puntasLejos, aristasAPie: usadas, areaKm2: osm.areaKm2(zona) };
}

function resolver(g, latO, lonO, latD, lonD) {
  const pO = aMetros(lonO, latO), pD = aMetros(lonD, latD);
  const o = G.nodoMasCercano(g.nodos, g.ady, pO);
  const d = G.nodoMasCercano(g.nodos, g.ady, pD);

  // Lo que NO sabemos se dice, no se calla. Tres estados, no dos.
  const avisos = [];
  if (o.d > 100) avisos.push({ tipo: 'origen-lejos', metros: Math.round(o.d) });
  if (d.d > 100) avisos.push({ tipo: 'destino-lejos', metros: Math.round(d.d) });
  if (o.nodo === -1 || d.nodo === -1) {
    return { encontrada: false, motivo: 'sin-grafo-cerca', avisos };
  }
  if (g.comp.comp[o.nodo] !== g.comp.comp[d.nodo]) {
    return { encontrada: false, motivo: 'componentes-distintas', avisos,
      componenteOrigen: g.comp.comp[o.nodo], componenteDestino: g.comp.comp[d.nodo] };
  }

  const r = G.dijkstra(g.ady, o.nodo);
  const ruta = G.reconstruir(g.nodos, g.aristas, r, o.nodo, d.nodo);
  if (!ruta) return { encontrada: false, motivo: 'sin-camino', avisos };

  const recta = Math.hypot(pO[0] - pD[0], pO[1] - pD[1]);
  const porDefecto = ruta.pasos.filter((p) => p.unidoPorDefecto).length;
  const conPrecisionBaja = ruta.pasos.filter((p) => p.precision === 'eje-de-calzada').length;

  return {
    encontrada: true,
    metros: ruta.metros,
    lineaRecta: Math.round(recta * 10) / 10,
    rodeo: Math.round((ruta.metros / recta) * 1000) / 1000,
    engancheOrigen: Math.round(o.d * 10) / 10,
    engancheDestino: Math.round(d.d * 10) / 10,
    aristas: ruta.aristas,
    // D2 y D4 viajan hasta aquí, que es el punto entero de que nazcan en el planarizado
    pasosPorDefecto: porDefecto,
    pasosSinAceraConocida: conPrecisionBaja,
    avisos,
    pasos: ruta.pasos,
  };
}

if (require.main === module) {
  const a = process.argv.slice(2).map(Number);
  if (a.length !== 4 || a.some((x) => !Number.isFinite(x))) {
    console.error('uso: node src/ruta.js <latO> <lonO> <latD> <lonD>');
    process.exit(2);
  }
  const g = construir();
  const res = resolver(g, a[0], a[1], a[2], a[3]);
  console.log(JSON.stringify({
    sello: g.sello, zona: g.zona,
    grafo: { nodos: g.contadores.nodos, aristas: g.contadores.aristas,
      componentes: g.comp.n, mayor: Math.max(...g.comp.tamanos) },
    ...res,
  }, null, 2));
}

module.exports = { construir, resolver, ZONA_CASCO, ZONA_TERMINO, ZONA_TANDA3, contiene, CRUDO };
