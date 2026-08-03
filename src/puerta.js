// D · RUTEAR A LA PUERTA, NO AL CENTRO DEL EDIFICIO.
//
// ⚠️ NO es el caso de la Estación de Delicias: es una CLASE. Rutear a una estación,
//    un hospital o un centro comercial **por su centro geométrico** mete un error
//    que no es del grafo ni del enganche — es de la pregunta. Casos ya conocidos:
//    Delicias 31,1 m · Hospital Clínico 45,8 m · C.C. Utrillas 28,7 m.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ POR QUÉ EL PERÍMETRO Y NO `entrance=*`
// ═════════════════════════════════════════════════════════════════════════════
//   Lo primero era comprobar si OSM trae las entradas, **antes** de contar con
//   ellas. Buscadas en los tres ficheros descargados:
//
//     edificios   11.857 elementos   con entrance: 0
//     poi             28 elementos   con entrance: 0
//     viario      48.211 elementos   con entrance: 0
//
//   ⭐ POSITIVO DE CONTROL, porque un cero sin él es indistinguible de un buscador
//      roto: el mismo buscador encuentra 11.857 con `building=*` y 3.282 con
//      `building:levels`. Funciona; simplemente no hay entradas.
//
//   ⚠️ Y LA LECTURA HONESTA DE ESE CERO: `entrance` en OSM es una etiqueta de
//      NODO, y las tres descargas son **solo de ways**. Así que el cero significa
//      **"no se ha descargado"**, NO "Zaragoza no tiene entradas mapeadas".
//      ⇒ Si Zaragoza las tiene o no: `NO CONSTA`. Lo que consta es que con este
//        dato no se pueden usar.
//
//   ⇒ SE USA EL PERÍMETRO: el punto del contorno del edificio más próximo a la
//     red transitable. Es geometría, no etiqueta, así que existe siempre.
//
// ⚠️ D4 · ¿SIGUE SIENDO HONESTO? A medias, y hay que decirlo: el punto del
//    perímetro más cercano a la calle **no tiene por qué ser una puerta**. Puede
//    ser una pared ciega, un muelle de carga o una salida de emergencia. Lo que
//    se gana es dejar de rutear a un punto que con seguridad NO es la entrada —el
//    centro geométrico— y quedarse en uno que puede serlo. **Cuál es la puerta de
//    verdad: `NO CONSTA` con este dato.**

'use strict';
const C = require('./condicionales');
const P = require('./portales');

/** Centro geométrico de un polígono (media de sus vértices). */
function centroide(pts) {
  let x = 0, y = 0;
  for (const p of pts) { x += p[0]; y += p[1]; }
  return [x / pts.length, y / pts.length];
}

/** El polígono de edificio que CONTIENE un punto en metros, o null. */
function edificioDe(m, E) {
  const { idx, polis } = E;
  const cx = Math.floor(m[0] / idx.celda), cy = Math.floor(m[1] / idx.celda);
  let elegido = null;
  for (const i of (idx.m.get(cx + ',' + cy) || [])) {
    const po = polis[i];
    if (!C.puntoEnPoligono(m, po.pts)) continue;
    // se prefiere el que tenga nombre: la estación está mapeada como varios
    // polígonos y solo uno lleva el nombre.
    if (!elegido || (!elegido.nombre && po.nombre)) elegido = po;
  }
  return elegido;
}

/** Puntos a lo largo del contorno, cada `paso` metros. Los vértices siempre entran. */
function muestrearContorno(pts, paso = 5) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    out.push(a);
    const n = Math.floor(L / paso);
    for (let k = 1; k <= n; k++) {
      const t = (k * paso) / L;
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

/**
 * El punto del perímetro más próximo a la red, y su enganche.
 * @returns {{m, arista, seg, t, q, d}|null}
 */
function puertaDe(poli, aristas, idxAristas, maxRadio = 350, paso = 5) {
  let mejor = null;
  for (const m of muestrearContorno(poli.pts, paso)) {
    const r = P.engancharUno(m, aristas, idxAristas, () => '', maxRadio).mejor;
    if (!r) continue;
    if (!mejor || r.d < mejor.d) mejor = { m, arista: r.i, seg: r.k, t: r.t, q: r.q, d: r.d };
  }
  return mejor;
}

/**
 * Convierte un punto-destino (lat/lon) en su punto de acceso.
 * Devuelve `{tipo:'centro'}` intacto si el punto no cae dentro de ningún edificio.
 * ⛔ No decide por su cuenta que algo es un edificio: lo comprueba con la geometría.
 */
function accesoA(punto, g, idxAristas, E = null) {
  const m = punto.m;
  const lat = punto.lat, lon = punto.lon;
  if (!C.enVentana(lat, lon)) {
    return { ...punto, puerta: null, motivo: 'fuera-de-la-ventana-de-edificios' };
  }
  const Ed = E || C.edificios();
  const poli = edificioDe(m, Ed);
  if (!poli) return { ...punto, puerta: null, motivo: 'el-punto-no-cae-en-ningun-edificio' };
  const pu = puertaDe(poli, g.aristas, idxAristas);
  if (!pu) return { ...punto, puerta: null, motivo: 'el-perimetro-no-llega-a-la-red' };
  return {
    ...punto,
    arista: pu.arista, seg: pu.seg, t: pu.t, q: pu.q, d: pu.d, m: pu.m,
    puerta: { edificio: poli.id, nombre: poli.nombre, m: pu.m, dCentro: punto.d, dPuerta: pu.d },
    motivo: 'perimetro-mas-proximo-a-la-red',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ EL PUNTO DEL PERÍMETRO MÁS PRÓXIMO A LA RED NO ES EL MÁS PRÓXIMO AL QUE VIENE
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ Esto no lo anticipé: lo destapó la ruta 3. Al cambiar el centro del Hospital
//    Clínico por «el punto de su perímetro más pegado a la calle», la ruta se hizo
//    **119 m MÁS LARGA** (3.731 → 3.850) y el rodeo empeoró de 1,24 a 1,29.
//
//    El motivo, mirado: ese punto está a 0,0 m de una calle… **que está al otro
//    lado del edificio**. Minimizar la distancia de ENGANCHE no es minimizar la
//    distancia que anda una persona: son dos cosas distintas y solo una es la
//    pregunta.
//
// ⇒ La regla correcta sale de qué es un destino-edificio: **llegar al edificio es
//   tocar su perímetro por donde antes se llegue**. Así que se prueban todos los
//   puntos de acceso candidatos y **manda el que sale más barato POR RUTA**, no
//   por línea recta. Es un solo Dijkstra con varios destinos: no cuesta más.
//
// ⛔ Y esto NO es ajustar el instrumento para que salga bonito: la regla se decide
//    por lo que significa el destino, no por el número que produce. La prueba es
//    que se publican **las tres** —centro, perímetro-más-cerca-de-la-red y
//    perímetro-más-barato-por-ruta— y en la nº4 la tercera también empeora la
//    distancia respecto a la segunda… porque es más honesta.

/**
 * Candidatos de acceso a un edificio: puntos del contorno con enganche a la red.
 * Se quedan los `tope` mejores por distancia de enganche, para no insertar 200
 * nodos temporales por consulta.
 */
function candidatos(poli, aristas, idxAristas, maxRadio = 350, paso = 5, tope = 24) {
  const out = [];
  for (const m of muestrearContorno(poli.pts, paso)) {
    const r = P.engancharUno(m, aristas, idxAristas, () => '', maxRadio).mejor;
    if (!r) continue;
    out.push({ m, arista: r.i, seg: r.k, t: r.t, q: r.q, d: r.d });
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, tope);
}

/**
 * Ruta desde `origen` hasta el edificio `poli`, eligiendo la puerta POR RUTA.
 * @returns {{encontrada, metros, pasos, aristas, puerta, candidatos}}
 */
function rutaAEdificio(G, g, origen, poli, idxAristas) {
  const cands = candidatos(poli, g.aristas, idxAristas);
  if (!cands.length) return { encontrada: false, motivo: 'el-perimetro-no-llega-a-la-red' };
  const nodos = g.nodos.slice();
  const ady = g.ady.map((l) => l.slice());
  const o = G.insertar(g.aristas, ady, nodos, origen);
  const ids = cands.map((c) => G.insertar(g.aristas, ady, nodos, c));
  const r = G.dijkstra(ady, o);
  let mejor = -1, coste = Infinity;
  for (let i = 0; i < ids.length; i++) {
    // ⭐ el coste es la ruta MÁS lo que queda de andar desde la calle hasta la
    //    fachada. Sin ese sumando, una puerta a 30 m de la calle parecería igual
    //    de buena que una a 0 m.
    const c = r.dist[ids[i]] + cands[i].d;
    if (c < coste) { coste = c; mejor = i; }
  }
  if (mejor === -1 || !Number.isFinite(coste)) return { encontrada: false, motivo: 'sin-camino' };
  const res = G.rutaEntre(g, origen, cands[mejor]);
  return { ...res, puerta: cands[mejor], nCandidatos: cands.length,
    peorCandidato: Math.max(...cands.map((c, i) => r.dist[ids[i]] + c.d).filter(Number.isFinite)) };
}

module.exports = { centroide, edificioDe, muestrearContorno, puertaDe, accesoA,
  candidatos, rutaAEdificio };

// ═════════════════════════════════════════════════════════════════════════════
// D1 · LA MEDIDA DE LA CLASE — ¿a cuántos afecta, y cuánto?
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const { construir, ZONA_TERMINO } = require('./ruta');
  const E = require('./enganche');
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(46)} ${v}`);

  const g = construir(ZONA_TERMINO);
  const idx = P.indexarAristas(g.aristas, (e) => e.pie);
  const Ed = C.edificios();

  log('='.repeat(104));
  log('D1 · ⭐ EL CENTROIDE ES UNA CLASE, NO EL CASO DE DELICIAS');
  di('polígonos de edificio en la ventana', Ed.polis.length);
  di('  de ellos, CON nombre en OSM', Ed.polis.filter((p) => p.nombre).length);
  log('   ⚠️ la ventana de edificios es solo el centro denso (41,62–41,69 · -0,935 a -0,84).');
  log('      Fuera de ahí no se ha descargado nada: un cero ahí sería "no se ha mirado".');

  // ⭐ el reparto centro→calle contra perímetro→calle, sobre TODOS los edificios
  const dc = [], dp = [], ganancia = [];
  const grandes = [];
  for (const po of Ed.polis) {
    const c = centroide(po.pts);
    const rc = P.engancharUno(c, g.aristas, idx, () => '', 350).mejor;
    if (!rc) continue;
    const pu = puertaDe(po, g.aristas, idx);
    if (!pu) continue;
    dc.push(rc.d); dp.push(pu.d); ganancia.push(rc.d - pu.d);
    if (rc.d - pu.d > 40 && po.nombre) grandes.push({ n: po.nombre, c: rc.d, p: pu.d });
  }
  log('');
  log('   distancia del punto de destino a la calle más cercana, en metros:');
  const r = (v) => { const q = E.reparto(v); return `mediana ${q.mediana.toFixed(1)} · p90 ${q.p90.toFixed(1)} · p99 ${q.p99.toFixed(1)} · máx ${q.max.toFixed(1)}`; };
  di('desde el CENTRO geométrico', r(dc));
  di('desde el PERÍMETRO (la puerta)', r(dp));
  di('⇒ lo que se gana', r(ganancia));
  const peor = ganancia.filter((x) => x > 20).length;
  di('edificios donde el centro miente más de 20 m', `${peor} de ${dc.length}  (${(100 * peor / dc.length).toFixed(1)} %)`);

  log('');
  log('   ⭐ los peores, con nombre — para poder comprobarlos a mano:');
  grandes.sort((a, b) => (b.c - b.p) - (a.c - a.p));
  for (const x of grandes.slice(0, 12)) {
    log('   ' + (x.c - x.p).toFixed(0).padStart(6) + ' m de error   '
      + x.c.toFixed(0).padStart(4) + ' → ' + x.p.toFixed(0).padStart(3) + ' m    ' + x.n);
  }
}
