// ⭐⭐ TANDA 27 · LOS PARQUES — la teoría de Antonio, MEDIDA. ⛔ NO SE APLICA NADA.
//
//   node src/parques.js
//
// ═════════════════════════════════════════════════════════════════════════════
// LA TEORÍA
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Hay muchas manchas rojas en la ciudad que son parques o zonas verdes
//   >  grandes.»* — Antonio
//
//   ⭐ Y encaja con lo de la tanda 26: **un camino dentro de un parque no es de
//     ninguna calle.** Los senderos del Parque Grande no tienen nombre porque no
//     son vías urbanas, y por eso el método no puede nombrarlos: **no hay portales
//     dentro de un parque**, y la calle más cercana está lejos y no va pegada.
//   ⇒ Serían el mismo grupo que el paso de cebra: no es que les FALTE el nombre,
//     es que **no lo tienen ni deben tenerlo**.
//
// ⚠️⚠️ PERO HAY UNA DIFERENCIA QUE ES LA QUE HACE QUE ESTA TANDA MIDA Y NO APLIQUE:
//   **un paso de cebra se reconoce SOLO por su etiqueta; un camino de parque, no.**
//   Es un `footway` o un `path` igual que una acera. Lo que lo distingue es DÓNDE
//   ESTÁ — dentro del polígono de un parque—, y eso depende de una fuente externa
//   que puede estar mal dibujada.
//
// ⛔⛔ ESTE FICHERO NO CAMBIA NI UN NOMBRE NI UN COLOR. Mide, separa, y trae una
//     recomendación. **Decide Antonio.**

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros } = require('./geo');

const DIR = path.join(__dirname, '..', 'data', 'fuentes');
const MUNICIPAL = path.join(DIR, '2026-08-05_wfs_idezar-ZonasVerdesPrincipales.json');
const OSM = path.join(DIR, '2026-08-05_overpass_zaragoza-zonas-verdes.json');

// ── geometría ────────────────────────────────────────────────────────────────

const areaAnillo = (r) => {
  let s = 0;
  for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return Math.abs(s) / 2;
};

/** Un polígono ya proyectado: anillos en metros, con su bbox y su superficie. */
function armar(anillos, datos) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, area = 0;
  anillos.forEach((r, k) => {
    for (const p of r) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    area += (k === 0 ? 1 : -1) * areaAnillo(r);
  });
  return { anillos, bbox: [x0, y0, x1, y1], area: Math.max(0, area), ...datos };
}

/** ⭐ La capa municipal: `idezar_base:ZonasVerdesPrincipales_carto1000_2012`. */
function cargarMunicipal(ruta = MUNICIPAL) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const out = [];
  for (const f of d.features) {
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const p of polys) {
      out.push(armar(p.map((r) => r.map((c) => aMetros(c[0], c[1]))), { nombre: null, fuente: 'municipal' }));
    }
  }
  return out;
}

/**
 * ⭐ La capa de OSM. ⚠️ De las relaciones se cogen los anillos `outer` como
 * polígonos sueltos y **se ignoran los `inner`**: eso sobreestima un poco la
 * superficie (los agujeros cuentan como parque), y va declarado porque no es
 * gratis — un edificio dentro de un parque contaría como parque.
 */
function cargarOsm(ruta = OSM) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const out = [];
  for (const e of d.elements) {
    const t = e.tags || {};
    const dat = { nombre: t.name || null, fuente: 'osm',
      clase: t.leisure ? 'leisure=' + t.leisure : (t.landuse ? 'landuse=' + t.landuse : '?') };
    if (e.type === 'way' && e.geometry && e.geometry.length >= 4) {
      out.push(armar([e.geometry.map((c) => aMetros(c.lon, c.lat))], dat));
    } else if (e.type === 'relation' && e.members) {
      for (const m of e.members) {
        if (m.role !== 'outer' || !m.geometry || m.geometry.length < 4) continue;
        out.push(armar([m.geometry.map((c) => aMetros(c.lon, c.lat))], dat));
      }
    }
  }
  return out;
}

// ── el índice y el «dentro» ──────────────────────────────────────────────────

/** Rejilla por bbox de polígono. */
function indexar(polis, celda = 200) {
  const m = new Map();
  polis.forEach((P, i) => {
    const [x0, y0, x1, y1] = P.bbox;
    for (let x = Math.floor(x0 / celda); x <= Math.floor(x1 / celda); x++) {
      for (let y = Math.floor(y0 / celda); y <= Math.floor(y1 / celda); y++) {
        const k = x + ',' + y;
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(i);
      }
    }
  });
  return { m, celda, polis };
}

/** Punto en anillo, por cruces de rayo. */
function enAnillo(p, r) {
  let dentro = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const yi = r[i][1], yj = r[j][1];
    if ((yi > p[1]) !== (yj > p[1])) {
      const x = r[i][0] + (p[1] - yi) / (yj - yi) * (r[j][0] - r[i][0]);
      if (p[0] < x) dentro = !dentro;
    }
  }
  return dentro;
}

/** El polígono que contiene a `p`, o -1. ⭐ Anillo 0 dentro y ninguno de los otros. */
function polDe(idx, p) {
  const l = idx.m.get(Math.floor(p[0] / idx.celda) + ',' + Math.floor(p[1] / idx.celda));
  if (!l) return -1;
  for (const i of l) {
    const P = idx.polis[i];
    const [x0, y0, x1, y1] = P.bbox;
    if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1) continue;
    if (!enAnillo(p, P.anillos[0])) continue;
    let hueco = false;
    for (let k = 1; k < P.anillos.length; k++) if (enAnillo(p, P.anillos[k])) { hueco = true; break; }
    if (!hueco) return i;
  }
  return -1;
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ EL CRITERIO DE «DENTRO», DECLARADO ANTES DE MEDIR
// ═════════════════════════════════════════════════════════════════════════════
//   Se muestrea la línea en **los mismos cinco puntos** que usa `calle-pegada.js`
//   —10 · 30 · 50 · 70 · 90 % de su longitud— y **se exige que los CINCO caigan
//   dentro**. ⛔ No me invento ni el muestreo ni el listón: los hereda de la
//   tanda 25, donde se fijaron para otra pregunta (ley 17), y los extremos se
//   evitan por el mismo motivo que allí — **son nodos de cruce, y en una línea que
//   sale del parque el extremo cae justo en el borde**.
//
//   ⚠️ Y el listón importa mucho más aquí que allí: con «basta un punto» entrarían
//      todas las líneas que ROZAN el parque, que es exactamente el modo de fallo
//      que hay que evitar —llevarse por delante la acera del borde—. El informe
//      publica la curva entera (1/5 · 3/5 · 4/5 · 5/5).
const FRACCIONES = [0.1, 0.3, 0.5, 0.7, 0.9];

/** Cuántos de los puntos de muestreo de una arista caen dentro de algún parque. */
function puntosDentro(idx, e, fracciones = FRACCIONES) {
  // muestreo por longitud acumulada sobre la polilínea de la arista
  const pts = e.pts;
  const acum = [0];
  for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acum[acum.length - 1];
  if (!(total > 0)) return { dentro: 0, n: 0, pol: -1 };
  let dentro = 0, pol = -1;
  for (const f of fracciones) {
    const obj = total * f;
    let i = 1;
    while (i < acum.length - 1 && acum[i] < obj) i++;
    const t = (acum[i] - acum[i - 1]) ? (obj - acum[i - 1]) / (acum[i] - acum[i - 1]) : 0;
    const p = [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])];
    const k = polDe(idx, p);
    if (k >= 0) { dentro++; if (pol < 0) pol = k; }
  }
  return { dentro, n: fracciones.length, pol };
}

module.exports = { MUNICIPAL, OSM, FRACCIONES, cargarMunicipal, cargarOsm,
  indexar, polDe, enAnillo, puntosDentro, areaAnillo };

// ═════════════════════════════════════════════════════════════════════════════
// LA MEDICIÓN — B · C · D.  ⛔ Y NADA MÁS: no se aplica.
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const A = require('./alarma');
  const Mo = require('./modelo');
  const Dir = require('./direccion');
  const Rel = require('./relato');
  const CP = require('./calle-pegada');
  const { CATEGORIA } = require('./exportar-nombre-simple');
  const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const ha = (a) => (a >= 1e6 ? (a / 1e6).toFixed(2) + ' km²' : (a / 1e4).toFixed(2) + ' ha');
  const T0 = Date.now();

  const g = construir(ZONA_TERMINO);
  const ctx = Dir.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const mod = Mo.construirModelo(g, portales);
  const nombreDeWay = (id) => g.nombres.get(id) || null;
  const cat = (e) => CATEGORIA(Rel.tramoDeArista(e, nombreDeWay, mod.modeloDeWay));

  log('='.repeat(104));
  log('LOS PARQUES — la teoría de Antonio, medida.  ⛔ NADA DE ESTO SE APLICA');
  log('='.repeat(104));

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('B · ⭐ ¿QUÉ DATO DE PARQUES HAY?');
  log('='.repeat(104));
  log('   B1 · lo que se buscó en el `GetCapabilities` que YA ESTABA EN DISCO — cero peticiones');
  log('      ⭐ POSITIVO DE CONTROL del buscador, antes de afirmar ningún cero: sobre las mismas');
  log('        178 capas encuentra `carril/bici` (13), `vias/callejero` (17) y `acera` (3).');
  log('      ⛔⛔ Y LA HIPÓTESIS DE DÓNDE MIRAR ERA FALSA: el workspace `medioambiente` tiene 39');
  log('        capas y **ninguna es de parques** — son 26 de ruido, emisiones, contenedores,');
  log('        fuentes de agua y plantación. Ahí no estaba.');
  log('      ⭐ Están en `idezar_base`, y son cartografía base:');
  log('         · idezar_base:ZonasVerdesPrincipales_carto1000_2012      ⭐ la que sirve');
  log('         · idezar_base:ZonasVerdesSecundarias_carto500_n50_2019');
  log('         · idezar_base:zona_verde_juegos_infantiles_2022 · EXPO_ZonaVerde · EXPO_ParqueMetropolitano');
  log('      ⚠️ Y en `medioambiente` no hay nada, pero `infraestructuraverde:reposicion` sí existe');
  log('         como workspace: una sola capa, y es de reposición de arbolado.');

  const mun = cargarMunicipal();
  const osm = cargarOsm();
  const areaTot = (l) => l.reduce((s, P) => s + P.area, 0);
  log('');
  log('   B2 · qué trae la capa municipal — ⚠️ y lo que NO trae');
  di('`ZonasVerdesPrincipales_carto1000_2012` · polígonos', `${mun.length}   (${ha(areaTot(mun))})`);
  log('      ⛔ **SIN NOMBRE Y SIN TIPO.** Sus dos únicos atributos son `GEODB_OID` y `NAME`, y');
  log('        `NAME` vale 0 en las 1.175 filas: 0 valores distintos. Es geometría pura.');
  log('      ⚠️ Y la capa `Secundarias` NO es un inventario de parques: son 38.854 polígonos con');
  log('        atributos de dibujo CAD (`IGDS_COLOR`, `IGDS_LEVEL`…), **mediana 0 m²** y 35.235');
  log('        de menos de 100 m². Son parterres y alcorques. ⛔ Se descarta, y con su medida.');
  log('');
  log('   B3 · ⭐ EL SEGUNDO TESTIGO: OSM');
  di('polígonos de zona verde en OSM', `${osm.length}   (${ha(areaTot(osm))})`);
  {
    const c = new Map();
    for (const P of osm) {
      if (!c.has(P.clase)) c.set(P.clase, { n: 0, a: 0 });
      const v = c.get(P.clase); v.n++; v.a += P.area;
    }
    for (const [k, v] of [...c.entries()].sort((a, b) => b[1].a - a[1].a).slice(0, 6)) {
      log('      ' + k.padEnd(30) + String(v.n).padStart(7) + ha(v.a).padStart(14));
    }
    di('   …con nombre', osm.filter((P) => P.nombre).length);
  }

  const iM = indexar(mun), iO = indexar(osm);
  log('');
  log('   B4 · ⭐⭐ LOS DOS TESTIGOS, CRUZADOS — ¿coinciden en dónde están los parques?');
  log('      Se rocía una rejilla de puntos cada 25 m sobre el término y se mira quién dice qué.');
  {
    // ⛔ la rejilla se acota al bbox COMÚN de las dos capas: fuera de ahí la
    //    comparación no dice nada, solo que una capa no llega.
    const bb = (l) => l.reduce((b, P) => [Math.min(b[0], P.bbox[0]), Math.min(b[1], P.bbox[1]),
      Math.max(b[2], P.bbox[2]), Math.max(b[3], P.bbox[3])], [Infinity, Infinity, -Infinity, -Infinity]);
    const a = bb(mun), b = bb(osm);
    const R = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
    const PASO = 25;
    let soloM = 0, soloO = 0, dos = 0, ninguno = 0;
    for (let x = R[0]; x <= R[2]; x += PASO) {
      for (let y = R[1]; y <= R[3]; y += PASO) {
        const p = [x, y];
        const m = polDe(iM, p) >= 0, o = polDe(iO, p) >= 0;
        if (m && o) dos++; else if (m) soloM++; else if (o) soloO++; else ninguno++;
      }
    }
    const verde = dos + soloM + soloO;
    di('puntos de la rejilla', dos + soloM + soloO + ninguno);
    di('   ⭐ los DOS dicen que es verde', `${dos}   (${pct(dos, verde)} de lo verde)`);
    di('   solo el MUNICIPAL', `${soloM}   (${pct(soloM, verde)})`);
    di('   solo OSM', `${soloO}   (${pct(soloO, verde)})`);
    A.exige(dos > 0, 'las dos capas no coinciden en un solo punto: o una está mal georreferenciada o el test está roto');
    log('      ⇒ ⚠️ **Discrepan, y bastante.** No es un fallo de ninguna: **miden cosas distintas.**');
    log('        El municipal es cartografía base de 2012 restringida al suelo urbano; OSM incluye');
    log('        `landuse=grass` de sotos, medianas y descampados que nadie llamaría parque.');
    log('      ⛔ Y por eso lo que sigue se mide **con las dos por separado**, no con la unión.');
    global._B4 = { dos, soloM, soloO };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('C · ⭐⭐ ¿CUÁNTAS ROJAS SON DE PARQUE?');
  log('='.repeat(104));
  log('   ⭐ El criterio de «dentro», declarado antes de medir: los MISMOS cinco puntos de');
  log('     muestreo de `calle-pegada.js` (10·30·50·70·90 %) y **los cinco dentro**. Heredado de');
  log('     otra pregunta (ley 17), y los extremos se evitan porque en una línea que sale del');
  log('     parque el extremo cae justo en el borde.');

  const rojas = [], azules = [];
  for (let i = 0; i < g.aristas.length; i++) {
    const c = cat(g.aristas[i]);
    if (c === 0) rojas.push(i); else if (c === 1) azules.push(i);
  }
  const mSum = (l) => l.reduce((s, i) => s + g.aristas[i].largo, 0);
  di('rojas del mapa (les falta el nombre)', `${rojas.length}   (${km(mSum(rojas))})`);
  A.exige(rojas.length > 0, 'no hay ninguna roja: el categorizador está roto');

  const medir = (idx, etq) => {
    const dentro = { 1: [], 3: [], 4: [], 5: [] };
    const polDeArista = new Map();
    for (const i of rojas) {
      const r = puntosDentro(idx, g.aristas[i]);
      for (const u of [1, 3, 4, 5]) if (r.dentro >= u) dentro[u].push(i);
      if (r.dentro === 5) polDeArista.set(i, r.pol);
    }
    log('');
    log('   ' + etq);
    log('      ' + 'listón'.padEnd(26) + 'rojas'.padStart(9) + 'metros'.padStart(12) + '% de las rojas'.padStart(16));
    for (const u of [1, 3, 4, 5]) {
      log('      ' + (u === 5 ? '⭐ los 5 puntos dentro' : u + ' de 5 puntos dentro').padEnd(26)
        + String(dentro[u].length).padStart(9) + km(mSum(dentro[u])).padStart(12)
        + pct(dentro[u].length, rojas.length).padStart(16));
    }
    return { dentro: dentro[5], roza: dentro[1], polDeArista };
  };
  const RM = medir(iM, 'C1a · con la capa MUNICIPAL');
  const RO = medir(iO, 'C1b · con OSM');
  log('');
  log('   ⚠️ Mira la diferencia entre «1 de 5» y «los 5»: es el modo de fallo entero. Con «basta');
  log('      rozar» entrarían ' + (RO.roza.length - RO.dentro.length) + ' líneas más solo en OSM, y muchas de ésas son la acera');
  log('      del borde. **El listón no es un detalle: es la separación.**');

  // ── C2 · senderos interiores contra aceras del borde ──────────────────────
  log('');
  log('   C2 · ⭐⭐⭐ SENDEROS INTERIORES CONTRA ACERAS DEL BORDE — lo que NO se puede mezclar');
  log('      ⚠️ Si esto se junta, se le quitaría el nombre a aceras que sí lo tienen. Se separa');
  log('        con DOS señales independientes, y se publican las dos:');
  log('        (a) ⭐ **el daño directo**: cuántas líneas que HOY TIENEN NOMBRE caerían dentro.');
  log('            No es una heurística: es la cuenta exacta de lo que se rompería.');
  log('        (b) la distancia de la línea al BORDE del polígono que la contiene.');
  {
    for (const [etq, idx, R] of [['MUNICIPAL', iM, RM], ['OSM', iO, RO]]) {
      const az = azules.filter((i) => puntosDentro(idx, g.aristas[i]).dentro === 5);
      log('');
      di('   (a) ' + etq + ' · líneas CON NOMBRE que caerían dentro', `${az.length}   (${km(mSum(az))})`);
      // ⭐ y de qué son: si son aceras, es exactamente el daño que se teme
      const c = new Map();
      for (const i of az) {
        const k = g.aristas[i].precision;
        if (!c.has(k)) c.set(k, { n: 0, m: 0 });
        const v = c.get(k); v.n++; v.m += g.aristas[i].largo;
      }
      for (const [k, v] of [...c.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 5)) {
        log('         ' + k.padEnd(30) + String(v.n).padStart(7) + km(v.m).padStart(12));
      }
      global['_DANO_' + etq] = az.length;
    }
    // (b) la distancia al borde, sobre las rojas de dentro
    const dBorde = (i, idx, pol) => {
      if (pol < 0) return null;
      const P = idx.polis[pol];
      const pts = g.aristas[i].pts;
      const c = pts[Math.floor(pts.length / 2)];
      let d = Infinity;
      for (const r of P.anillos) {
        for (let k = 0; k + 1 < r.length; k++) {
          const a2 = r[k], b2 = r[k + 1];
          const vx = b2[0] - a2[0], vy = b2[1] - a2[1], L2 = vx * vx + vy * vy;
          let t = L2 ? ((c[0] - a2[0]) * vx + (c[1] - a2[1]) * vy) / L2 : 0;
          t = Math.max(0, Math.min(1, t));
          const dd = Math.hypot(c[0] - (a2[0] + t * vx), c[1] - (a2[1] + t * vy));
          if (dd < d) d = dd;
        }
      }
      return d;
    };
    log('');
    log('      (b) ⭐ la distancia de la roja al BORDE del parque que la contiene');
    log('      ' + 'fuente'.padEnd(14) + 'rojas dentro'.padStart(14) + 'mediana'.padStart(11)
      + 'p10'.padStart(9) + '≤5 m del borde'.padStart(16));
    for (const [etq, idx, R] of [['MUNICIPAL', iM, RM], ['OSM', iO, RO]]) {
      const ds = R.dentro.map((i) => dBorde(i, idx, R.polDeArista.get(i))).filter((x) => x != null && isFinite(x));
      ds.sort((a, b) => a - b);
      const cerca = ds.filter((x) => x <= 5).length;
      log('      ' + etq.padEnd(14) + String(R.dentro.length).padStart(14)
        + (ds.length ? ds[Math.floor(ds.length / 2)].toFixed(1) + ' m' : '—').padStart(11)
        + (ds.length ? ds[Math.floor(ds.length * 0.1)].toFixed(1) + ' m' : '—').padStart(9)
        + `${cerca} (${pct(cerca, ds.length)})`.padStart(16));
    }
    log('      ⇒ ⚠️ una línea a menos de 5 m del borde puede ser la acera perimetral **aunque los');
    log('        cinco puntos caigan dentro**: el polígono suele incluir el paseo de contorno.');
  }

  // ── C3 · el tamaño del parque ─────────────────────────────────────────────
  log('');
  log('   C3 · ⭐⭐ EL TAMAÑO — un parque grande no es un jardín entre dos bloques');
  {
    const bandas = [[0, 2000, 'jardincillo  < 2.000 m²'], [2000, 10000, '2.000 – 1 ha'],
      [10000, 50000, '1 – 5 ha'], [50000, 200000, '5 – 20 ha'], [200000, Infinity, '⭐ ≥ 20 ha']];
    for (const [etq, idx, R] of [['MUNICIPAL', iM, RM], ['OSM', iO, RO]]) {
      log('');
      log('      ' + etq + ' · ' + 'tamaño del parque'.padEnd(26) + 'rojas'.padStart(8)
        + 'metros'.padStart(12) + 'parques'.padStart(10));
      for (const [a2, b2, nom] of bandas) {
        const l = R.dentro.filter((i) => {
          const P = idx.polis[R.polDeArista.get(i)];
          return P && P.area >= a2 && P.area < b2;
        });
        const ps = new Set(l.map((i) => R.polDeArista.get(i)));
        log('      ' + ' '.repeat(etq.length + 3) + nom.padEnd(26) + String(l.length).padStart(8)
          + km(mSum(l)).padStart(12) + String(ps.size).padStart(10));
      }
    }
    log('');
    log('      ⇒ ⭐ **La frontera existe y se ve**: casi todos los metros están en los parques');
    log('        grandes, y los jardincillos aportan cuatro líneas sueltas. ⚠️ Y ahí es donde la');
    log('        acera que cruza un jardín de barrio SÍ puede ser de la calle.');
  }

  // ── C4 · ¿le hemos puesto nombre a senderos de parque? ─────────────────────
  log('');
  log('   C4 · ⚠️ ¿LE HEMOS PUESTO NOMBRE DE CALLE A SENDEROS DE PARQUE?');
  log('      ⛔ La pregunta literal del encargo no se puede contestar como está escrita: una roja');
  log('        NO tiene nombre, por definición. Lo que sí se puede medir —y es lo que preocupa—');
  log('        es cuántas líneas DENTRO de un parque llevan hoy un nombre puesto POR NOSOTROS.');
  {
    for (const [etq, idx] of [['MUNICIPAL', iM], ['OSM', iO]]) {
      const ded = [], dec = [];
      for (let i = 0; i < g.aristas.length; i++) {
        const e = g.aristas[i];
        if (nombreDeWay(e.way)) continue;                    // el de OSM es dato ajeno
        const t = Rel.tramoDeArista(e, nombreDeWay, mod.modeloDeWay);
        if (!t.nombre) continue;
        if (puntosDentro(idx, e).dentro !== 5) continue;
        // ⚠️ CLASIFICAR ANTES DE CONTAR, y esto casi se publica mal: `municipal-bici`
        //    NO es deducido — lo DECLARA el Ayuntamiento en su capa de carriles bici.
        //    Meterlo en el mismo saco habría inflado «lo que inventamos» en un 56 %.
        if (t.via && t.via.declarada === false) ded.push(i); else dec.push(i);
      }
      di('   ' + etq + ' · dentro, con nombre que DEDUCIMOS nosotros', `${ded.length}   (${km(mSum(ded))})`);
      const c = new Map();
      for (const i of ded) {
        const v = Rel.tramoDeArista(g.aristas[i], nombreDeWay, mod.modeloDeWay).via;
        c.set((v && v.testigos) || '?', (c.get((v && v.testigos) || '?') || 0) + 1);
      }
      log('         por testigo: ' + [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '=' + v).join(' · '));
      di('   ' + etq + ' · dentro, con nombre DECLARADO por el Ayuntamiento', `${dec.length}   (${km(mSum(dec))})`);
      log('         ⭐ son carriles bici que atraviesan el parque y llevan `vias_codigo` municipal.');
      log('           ⛔ Eso NO lo inventamos nosotros: lo declara el Ayuntamiento.');
      global['_DED_' + etq] = ded.length;
    }
    log('      ⇒ ⚠️ Ojo con leer esto como «el mismo caso de los pasos»: **una parte de estas');
    log('        líneas son de verdad de una calle** —la que bordea el parque—, y el polígono se');
    log('        las traga. Es la otra cara de C2.');
  }

  // ── C5 · los sitios concretos ─────────────────────────────────────────────
  log('');
  log('   C5 · ⭐ LOS SITIOS QUE ANTONIO VE ROJOS');
  {
    const BUSCAR = ['parque grande', 'parque del agua', 'canal', 'miralbueno', 'venecia',
      'delicias', 'oliver', 'torre ramona'];
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    log('      ' + 'parque (nombre de OSM)'.padEnd(40) + 'superficie'.padStart(12)
      + 'rojas'.padStart(8) + 'metros'.padStart(11) + 'con nombre'.padStart(12));
    const yaVisto = new Set();
    for (const q of BUSCAR) {
      const cands = osm.map((P, i) => [P, i]).filter(([P]) => P.nombre && norm(P.nombre).includes(q));
      // el mayor de cada nombre
      cands.sort((a, b) => b[0].area - a[0].area);
      for (const [P, i] of cands.slice(0, 2)) {
        if (yaVisto.has(P.nombre)) continue;
        yaVisto.add(P.nombre);
        const uno = indexar([P]);
        const rj = [], az = [];
        for (let k = 0; k < g.aristas.length; k++) {
          const e = g.aristas[k];
          if (e.pts[0][0] < P.bbox[0] - 50 || e.pts[0][0] > P.bbox[2] + 50) continue;
          if (e.pts[0][1] < P.bbox[1] - 50 || e.pts[0][1] > P.bbox[3] + 50) continue;
          if (puntosDentro(uno, e).dentro !== 5) continue;
          const c = cat(e);
          if (c === 0) rj.push(k); else if (c === 1) az.push(k);
        }
        if (!rj.length && !az.length) continue;
        log('      ' + String(P.nombre).slice(0, 38).padEnd(40) + ha(P.area).padStart(12)
          + String(rj.length).padStart(8) + km(mSum(rj)).padStart(11) + String(az.length).padStart(12));
      }
    }
    log('      ⚠️ La columna «con nombre» es la que avisa: donde sale alta, el polígono se está');
    log('         comiendo calles de verdad, no senderos. ⭐ Y en «Anillo Verde Oliver» sale');
    log('         DESPROPORCIONADA: 19 rojas contra 131 con nombre. Ahí el polígono no es un');
    log('         parque, es una franja que envuelve calles enteras del barrio.');
    const faltan = BUSCAR.filter((q) => !osm.some((P) => P.nombre && norm(P.nombre).includes(q)));
    log('      ⛔ **NO CONSTA** para ' + faltan.join(', ') + ': no hay en OSM ningún polígono de zona');
    log('         verde con ese nombre. No es que no haya parque — es que el dato no lo nombra, y');
    log('         la capa municipal no trae nombres para poder buscarlo por ahí.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('D · ⛔ LA RECOMENDACIÓN — y decide Antonio');
  log('='.repeat(104));
  log('   D1 · ⭐ NO pintarlos de gris como los pasos. **Sí pintarlos de otra cosa, o de nada.**');
  log('      1 · La teoría es correcta y el número la respalda: los senderos de los parques');
  log('          grandes no son de ninguna calle, y son metros de rojo que no son un problema.');
  log('      2 · ⛔ Pero un paso de cebra se reconoce por su ETIQUETA y un sendero por DÓNDE');
  log('          ESTÁ, y ese «dónde» sale de una capa que **no tiene nombre, no tiene tipo, es de');
  log('          2012 y discrepa de OSM**. Meter eso en `sinNombrePorDefinicion()` sería colgar');
  log('          una regla de definición de una fuente de calidad desconocida.');
  log('      3 · Y el daño está medido arriba (C2a): líneas que HOY tienen nombre y caerían');
  log('          dentro. Eso no es un riesgo teórico, es una cuenta.');
  log('   ⭐ Lo que sí propongo, si Antonio quiere: **una cuarta categoría VERDE en el mapa**, que');
  log('     no cambie el modelo ni el texto — solo el color— y que diga «esto está dentro de una');
  log('     zona verde». El nombre se sigue deduciendo igual, y quien mire el mapa ve por qué esa');
  log('     mancha es roja. ⛔ Decide Antonio.');
  log('');
  log('   D2 · ⚠️ LO QUE NO SE PUEDE DECIDIR CON LO QUE HAY');
  log('      · **Cuál de las dos capas tiene razón** donde discrepan. Ninguna trae fecha de');
  log('        revisión por polígono ni tipo; la municipal ni siquiera trae nombre.');
  log('      · **Dónde acaba el parque y empieza la acera.** El polígono no lo dice, y el');
  log('        criterio de los 5 puntos solo acota el error: no lo elimina.');
  log('      · **Si un `landuse=grass` de OSM es un parque o una mediana.** No hay dato.');

  log('');
  log(A.cierre('LOS PARQUES'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
