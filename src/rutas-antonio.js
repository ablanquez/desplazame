// E5 · ⭐⭐⭐ LAS SIETE RUTAS DE ANTONIO.
//
// ⭐ Escritas ANTES de que existiera el enganche, a propósito, para que no
//    pudieran elegirse mirando qué salía bien (ley 17 y ley 22).
//
// ⛔ `data/pruebas/RUTAS-CONOCIDAS.md` NO SE TOCA. Se lee y se ejecuta. Los
//    resultados van en el informe, nunca en la tabla de Antonio — ni siquiera
//    para añadir una columna.
//
// ⚠️ Y si alguna falla NO se arregla para que pase. Se averigua por qué, se dice,
//    y la corrección va como REGLA, no como parche para ese caso.
//
//   node src/rutas-antonio.js

'use strict';
const osm = require('./osm');
const P = require('./portales');
const E = require('./enganche');
const D = require('./direccion');
const G = require('./grafo');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { aMetros, aGrados, dist } = require('./geo');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(44)} ${v}`);

// ── LOS DESTINOS QUE NO SON UNA DIRECCIÓN ────────────────────────────────────
// ⚠️ Etopía, el Hospital Lozano Blesa, la estación de Delicias y el C.C. Utrillas
//    NO están en el callejero municipal ni en el crudo de viario: son edificios.
//    ⛔ NO se ponen sus coordenadas de memoria. Se descargaron por nombre
//    (`data/fuentes/2026-08-03_overpass_zaragoza-poi-rutas.json`, sello
//    2026-08-03T12:48:20Z) y aquí van con la etiqueta OSM que los identifica.
const POI = {
  'Hospital Clínico Lozano Blesa': { lat: 41.64321, lon: -0.90341, osm: 'amenity=hospital "Hospital Clínico Universitario Lozano Blesa"' },
  'Centro Etopía': { lat: 41.65935, lon: -0.90731, osm: 'building=yes "Etopia"' },
  'Estación Delicias': { lat: 41.65857, lon: -0.91139, osm: 'railway=station "Zaragoza-Delicias"' },
  'C.C. Utrillas': { lat: 41.64014, lon: -0.86815, osm: 'shop=mall "Alcampo Utrillas"  ⚠️ identificado así: es el único centro comercial llamado Utrillas del dato' },
};

// Las siete, copiadas de `data/pruebas/RUTAS-CONOCIDAS.md` SIN modificarla.
const RUTAS = [
  { n: 1, o: 'Avenida Cataluña 78', d: 'Avenida Pablo Gargallo 16', banda: null, min: null,
    caso: '⭐⭐ CRUZA EL EBRO — y hay tres puentes posibles. No prueba que se cruce: prueba CUÁL elige',
    nota: 'Antonio cruza por el PUENTE DE PIEDRA' },
  { n: 2, o: 'Calle Manifestación 6', d: 'Calle Don Jaime I 17', banda: [350, 450], min: 5,
    caso: 'Casco antiguo: trama irregular. Prueba que el motor NO sale del casco para volver a entrar' },
  { n: 3, o: 'Cantando Bajo la Lluvia 6', d: 'Hospital Clínico Lozano Blesa', banda: [2900, 3400], min: 40,
    caso: 'Valdespartera → centro. Enganche donde el mapeado es más flojo y las calles son nuevas' },
  { n: 4, o: 'Centro Etopía', d: 'Estación Delicias', banda: [350, 450], min: 5,
    caso: '⭐ LA PLATAFORMA ELEVADA DE DELICIAS — 90 ways a layer=2, donde D1 podría haber aislado la estación' },
  { n: 5, o: 'Principado de Morea 14', d: 'C.C. Utrillas', banda: [350, 450], min: 5,
    caso: 'Corto y cotidiano. En 400 m, un error de enganche de 30 m es el 8 %' },
  { n: 6, o: 'Calle Francisco de Quevedo 1', d: 'Calle Matadero 1', banda: [350, 450], min: 5,
    caso: '⭐ DOS PORTALES EN ESQUINA (los dos son el nº 1). Ataca la salvaguarda de D3' },
  { n: 7, o: 'Calle El Coloso 2', d: 'Calle Valle de Zuriza 48', banda: [1800, 2100], min: 25,
    caso: '⭐⭐ EL DE REPETICIÓN. El único con tiempo real, no estimado — el dato más fiable' },
];

// ── el motor: ruta entre dos posiciones sobre aristas ────────────────────────
/**
 * Inserta un punto {arista, seg, t} como nodo temporal. Devuelve el id del nodo.
 * ⭐ Es la consecuencia de P4.5: como el portal NO parte la arista, hay que
 *    insertarlo al vuelo. Son dos nodos por consulta.
 */
function insertar(g, ady, nodos, p) {
  const e = g.aristas[p.arista];
  // distancia a lo largo de la polilínea hasta el punto de enganche
  let antes = 0;
  for (let k = 0; k < p.seg; k++) antes += dist(e.pts[k], e.pts[k + 1]);
  antes += p.t * dist(e.pts[p.seg], e.pts[p.seg + 1]);
  const resto = Math.max(0, e.largo - antes);
  const id = nodos.length;
  nodos.push({ x: p.q[0], y: p.q[1], temporal: true });
  ady.push([]);
  const enlaza = (n, w) => { ady[id].push({ n, w, e: p.arista }); ady[n].push({ n: id, w, e: p.arista }); };
  enlaza(e.a, antes);
  enlaza(e.b, resto);
  return id;
}

function rutaEntre(g, oPortal, dPortal) {
  const nodos = g.nodos.slice();
  const ady = g.ady.map((l) => l.slice());
  const a = insertar(g, ady, nodos, oPortal);
  const b = insertar(g, ady, nodos, dPortal);
  const r = G.dijkstra(ady, a);
  const m = r.dist[b];
  if (!Number.isFinite(m)) return { encontrada: false };
  // reconstruir para saber por dónde va
  const aristas = [];
  for (let v = b; v !== a; v = r.prev[v]) {
    if (r.prev[v] === -1) break;
    aristas.push(r.prevA[v]);
  }
  return { encontrada: true, metros: m, aristas: aristas.reverse() };
}

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const T0 = Date.now();
  const g = construir(ZONA_TERMINO);
  const { ways } = osm.cargar(CRUDO);
  const TAGS = new Map();
  for (const w of ways) TAGS.set(w.id, w.tags || {});
  const r = E.enganchar(g, TAGS);
  const idx = D.construirIndice(r.portales.filter((o) => o.enganchado), r.vias);
  const eng = P.indexarAristas(g.aristas, (e) => e.pie);

  log('='.repeat(98));
  log('E5 · ⭐⭐⭐ LAS SIETE RUTAS DE ANTONIO');
  log('   escritas ANTES de que existiera el enganche, y no se han tocado.');
  di('grafo · portales enganchados', `${g.aristas.length} aristas · ${r.contadores.enganchados}`);
  di('vías en el índice de direcciones', idx.size);

  // ⭐ D6 · el geocodificador, probado con las direcciones REALES de las rutas
  log('');
  log('D6 · ⭐ EL GEOCODIFICADOR, con las direcciones reales de las siete');
  const puntos = {};
  for (const ru of RUTAS) {
    for (const cual of ['o', 'd']) {
      const txt = ru[cual];
      if (puntos[txt]) continue;
      if (POI[txt]) {
        const p = POI[txt];
        const m = aMetros(p.lon, p.lat);
        const { mejor } = P.engancharUno(m, g.aristas, eng, () => '', 200);
        puntos[txt] = mejor ? { arista: mejor.i, seg: mejor.k, t: mejor.t, q: mejor.q, d: mejor.d,
          lat: p.lat, lon: p.lon, tipo: 'POI', osm: p.osm } : null;
        log('   ' + txt.padEnd(34) + 'POI  ' + (mejor ? mejor.d.toFixed(1) + ' m a la calle' : '⛔ sin grafo cerca')
          + '   ' + p.osm.slice(0, 46));
        continue;
      }
      const res = D.resolver(txt, idx);
      if (res.portal) {
        const o = res.portal;
        puntos[txt] = { arista: o.arista, seg: o.seg, t: o.t, q: o.q, d: o.d, lat: o.lat, lon: o.lon,
          tipo: 'portal', portal: o, estado: res.estado };
      } else puntos[txt] = null;
      log('   ' + txt.padEnd(34) + String(res.estado).padEnd(20)
        + (res.portal ? 'enganche ' + res.portal.d.toFixed(1) + ' m · OSM "' + (res.portal.nombreOsm || '—') + '"'
          + '  [' + res.portal.codigoVia_estado + '/' + res.portal.consenso_estado + ']' : '⛔')
        + (res.aviso ? '   ⚠️ ' + res.aviso : ''));
    }
  }

  log('');
  log('='.repeat(98));
  log('LAS SIETE, UNA A UNA');
  const resultados = [];
  for (const ru of RUTAS) {
    log('');
    log('─'.repeat(98));
    log(`RUTA ${ru.n} · ${ru.o}  →  ${ru.d}`);
    log(`   ${ru.caso}`);
    if (ru.nota) log(`   nota de Antonio: ${ru.nota}`);
    const a = puntos[ru.o], b = puntos[ru.d];
    if (!a || !b) { log('   ⛔ NO SE PUEDE RESOLVER LA DIRECCIÓN'); resultados.push({ ru, ok: false }); continue; }
    const res = rutaEntre(g, a, b);
    const recta = dist(aMetros(a.lon, a.lat), aMetros(b.lon, b.lat));
    if (a.tipo === 'POI') log('   ⚠️ el destino es un EDIFICIO: se rutea a su CENTRO, no a su puerta.');
    if (b.tipo === 'POI') log('   ⚠️ el destino es un EDIFICIO: se rutea a su CENTRO, no a su puerta. '
      + 'El enganche está a ' + b.d.toFixed(0) + ' m, y eso es error declarado, no del motor.');
    if (!res.encontrada) {
      log('   ⛔⛔ NO HAY CAMINO');
      // ⭐ ¿es por los pasos condicionales? Se comprueba, no se supone.
      const g2 = construir(ZONA_TERMINO, { conCondicionales: true });
      const eng2 = P.indexarAristas(g2.aristas, (e) => e.pie);
      const re = (p) => { const m = aMetros(p.lon, p.lat); const x = P.engancharUno(m, g2.aristas, eng2, () => '', 250).mejor;
        return x ? { arista: x.i, seg: x.k, t: x.t, q: x.q, d: x.d, lat: p.lat, lon: p.lon } : null; };
      const r2 = rutaEntre(g2, re(a), re(b));
      log('      ⭐ con los pasos condicionales ABIERTOS: '
        + (r2.encontrada ? r2.metros.toFixed(0) + ' m (rodeo ' + (r2.metros / recta).toFixed(2) + ')'
          + '   ⇒ el destino SOLO es alcanzable por un paso que no siempre está abierto'
          : 'sigue sin haber camino ⇒ la causa es otra'));
      resultados.push({ ru, ok: false, motivo: 'sin-camino', recta });
      continue;
    }
    const rodeo = res.metros / recta;
    const banda = ru.banda;
    const dentro = banda ? (res.metros >= banda[0] && res.metros <= banda[1]) : null;
    di('distancia calculada', res.metros.toFixed(0) + ' m');
    di('banda declarada por Antonio', banda ? `${banda[0]}–${banda[1]} m  (${ru.min} min)` : 'NO CONSTA');
    di('línea recta', recta.toFixed(0) + ' m');
    di('rodeo', rodeo.toFixed(2) + (rodeo < 1 ? '   ⛔⛔ IMPOSIBLE' : ''));
    di('enganche origen · destino', a.d.toFixed(1) + ' m · ' + b.d.toFixed(1) + ' m');
    if (banda) di('⇒ ¿dentro de banda?', dentro ? '✅ SÍ' : '⛔ NO  (' + (res.metros < banda[0] ? 'corta' : 'larga') + ' por ' + Math.abs(res.metros - (res.metros < banda[0] ? banda[0] : banda[1])).toFixed(0) + ' m)');
    // por dónde va: nombres de way en orden, sin repetir
    const nombres = [];
    for (const ia of res.aristas) {
      const n = (TAGS.get(g.aristas[ia].way) || {}).name;
      if (n && nombres[nombres.length - 1] !== n) nombres.push(n);
    }
    log('   por: ' + (nombres.join(' → ').slice(0, 300) || '(tramos sin nombre)'));
    resultados.push({ ru, ok: true, metros: res.metros, recta, rodeo, dentro, nombres, aristas: res.aristas, a, b });
  }

  // ── las tres preguntas concretas del briefing ──────────────────────────────
  log('');
  log('='.repeat(98));
  log('LAS TRES PREGUNTAS CONCRETAS');
  {
    const r1 = resultados.find((x) => x.ru.n === 1);
    log('');
    log('⭐ nº1 · ¿POR QUÉ PUENTE CRUZA?');
    if (r1 && r1.ok) {
      const puentes = r1.nombres.filter((n) => /puente|pasarela/i.test(n));
      di('puentes en la ruta', puentes.join(' · ') || '⚠️ ninguno con nombre');
      di('Antonio cruza por', 'el Puente de Piedra');
      di('⇒', puentes.some((p) => /piedra/i.test(p)) ? '✅ COINCIDE'
        : '⚠️ NO coincide — hay que mirar: o el coste está mal, o hay un rodeo escondido');
    } else log('   ⛔ la ruta 1 no se resolvió');

    const r6 = resultados.find((x) => x.ru.n === 6);
    log('');
    log('⭐ nº6 · ¿SE DISPARA LA DISCORDANCIA DE `codigoVia`?  (los dos portales son el nº 1)');
    if (r6 && r6.ok) {
      for (const [k, p] of [['origen', r6.a], ['destino', r6.b]]) {
        if (!p.portal) continue;
        const o = p.portal;
        di(k + ': ' + (o.via ? o.via.nombre : '?') + ' ' + o.numero,
          'OSM "' + (o.nombreOsm || '—') + '"   codigoVia:' + o.codigoVia_estado + '   nube:' + o.consenso_estado);
        di('   distancia · segunda calle a', o.d.toFixed(1) + ' m · ' + (o.segundaD !== null ? o.segundaD.toFixed(1) + ' m ("' + o.segundaNucleo + '")' : '—'));
      }
      const mal = [r6.a, r6.b].filter((p) => p.portal && p.portal.codigoVia_estado === 'DISCORDA').length;
      di('⇒', mal ? '⚠️ ' + mal + ' de 2 marcados por el código — la salvaguarda ACTÚA y no corrige'
        : '✅ los dos concuerdan: la esquina no engañó al enganche');
    } else log('   ⛔ la ruta 6 no se resolvió');

    const r4 = resultados.find((x) => x.ru.n === 4);
    log('');
    log('⭐ nº4 · ¿LLEGA A DELICIAS SIN RODEO ABSURDO?  (la plataforma elevada, layer=2)');
    if (r4 && r4.ok) {
      di('rodeo', r4.rodeo.toFixed(2));
      di('⇒', r4.rodeo <= 2 ? '✅ D1 no aisló la estación por dentro'
        : '⚠️ rodeo alto: hay que mirar si D1 partió la plataforma');
    } else log('   ⛔ la ruta 4 no se resolvió');
  }

  // ── E6 · cordura ───────────────────────────────────────────────────────────
  log('');
  log('='.repeat(98));
  log('E6 · RUTAS DE CORDURA — ninguna puede ser más corta que la línea recta');
  const imposibles = resultados.filter((x) => x.ok && x.rodeo < 0.999);
  di('rutas resueltas', resultados.filter((x) => x.ok).length + ' de 7');
  di('⛔ con rodeo < 1 (imposible)', imposibles.length + (imposibles.length ? '  ⛔ EL GRAFO ESTÁ ROTO' : '  ✅'));
  const conBanda = resultados.filter((x) => x.ok && x.ru.banda);
  di('dentro de la banda de Antonio', conBanda.filter((x) => x.dentro).length + ' de ' + conBanda.length);
  for (const x of conBanda.filter((x) => !x.dentro)) {
    log('      ⚠️ nº' + x.ru.n + ': ' + x.metros.toFixed(0) + ' m frente a ' + x.ru.banda[0] + '–' + x.ru.banda[1]);
  }

  log('');
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { RUTAS, POI, rutaEntre, insertar };
