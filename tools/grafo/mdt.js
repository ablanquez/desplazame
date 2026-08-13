// ⭐⭐⭐ H2b · TANDA 6 — EL MODELO DE ELEVACIÓN. **Solo lee y muestrea.**
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ ES ESTO Y DE DÓNDE SALE EL DATO
// ═════════════════════════════════════════════════════════════════════════════
//   Servicio  : WCS INSPIRE de elevación del IGN
//               https://servicios.idee.es/wcs-inspire/mdt
//   Producto  : «Modelos Digitales del Terreno de España … procedentes de
//               sensores LiDAR aerotransportados del proyecto PNOA-LiDAR del
//               Sistema Cartográfico Nacional» (su propio `ows:Abstract`).
//   Cobertura : `Elevacion25830_5` — paso de malla **5 m**, EPSG:25830.
//   Formato   : `application/asc` (ArcGrid ASCII), que se lee sin dependencias.
//
//   ⭐ Y LA COINCIDENCIA QUE HAY QUE DECIR EN VOZ ALTA, porque ahorra todo un
//     paso de reproyección y sus errores: el `.prj` que devuelve el servicio es
//     `PROJCS["ETRS89_UTM_zone_30N" … SPHEROID["GRS_1980",6378137,298.257222101]
//     … central_meridian −3 … scale_factor 0.9996 … false_easting 500000]`,
//     que es **exactamente** lo que implementa `src/geo.js:14-21`. El grafo ya
//     vive en esas coordenadas. ⛔ No se reproyecta nada.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LO QUE ESTE FICHERO **NO** HACE
// ═════════════════════════════════════════════════════════════════════════════
//   · **NO toca `src/`.** Ni una línea. La pendiente no entra en el motor.
//   · **NO añade ningún campo a ninguna arista.** La z se calcula fuera.
//   · **NO hace el grafo dirigido**, que es lo que haría falta para que subir y
//     bajar costaran distinto. Eso se MIDE en `cuesta.js` y se reporta.
//
//   node tools/grafo/mdt.js --bajar     baja las teselas que falten
//   node tools/grafo/mdt.js             mide la resolución y contrasta testigos

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST = path.join(__dirname, '..', '..', 'data', 'fuentes', 'mdt05');
const CLAVOS = path.join(__dirname, '..', '..', 'data', 'fuentes',
  '2026-08-13_wfs_idezar-Clavos_Topograficos.json');
const BASE = 'https://servicios.idee.es/wcs-inspire/mdt';

/** lado de la tesela que se pide al servicio, en metros. */
const T = 2000;
/** paso de malla del producto, en metros. ⛔ No es una elección: es del dato. */
const CS = 5;
/** columnas y filas de cada tesela. */
const N = T / CS;

const url = (x, y, paso = CS) => BASE + '?service=WCS&version=2.0.1&request=GetCoverage'
  + '&coverageId=Elevacion25830_' + paso
  + '&subset=x(' + x + ',' + (x + T) + ')&subset=y(' + y + ',' + (y + T) + ')'
  + '&format=application/asc';

/**
 * Lee una rejilla ArcGrid del cuerpo devuelto por el WCS.
 * ⚠️ El servicio contesta `multipart/related`: **detrás de la rejilla viene un
 *   segundo adjunto con el `.prj`**. Leer «todo lo que hay tras la cabecera»
 *   como números le añade 37 fichas de texto a la última fila y desplaza la
 *   rejilla entera sin que nada reviente. Por eso se corta en el límite MIME
 *   **y se cuenta**: la cuenta exacta es la que lo caza.
 */
function rejilla(txt) {
  const i = txt.indexOf('cellsize');
  if (i < 0) throw new Error('no hay cabecera ArcGrid en la respuesta');
  const cuerpo = txt.slice(txt.indexOf('\n', i) + 1).split(/\r?\n--wcs/)[0];
  const v = new Float32Array(N * N);
  let k = 0; let num = '';
  for (let c = 0; c < cuerpo.length; c++) {
    const ch = cuerpo[c];
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') { if (num) { v[k++] = +num; num = ''; } }
    else num += ch;
  }
  if (num) v[k++] = +num;
  if (k !== N * N) throw new Error('la tesela trae ' + k + ' celdas y la cabecera dice ' + N * N);
  return v;
}

const cache = new Map();

/** La tesela (tx,ty) en índices de tesela, o null si no está bajada. */
function tesela(tx, ty) {
  const k = tx + ':' + ty;
  if (cache.has(k)) return cache.get(k);
  const f = path.join(DEST, 'mdt05_' + (tx * T) + '_' + (ty * T) + '.asc');
  const z = fs.existsSync(f) ? rejilla(fs.readFileSync(f, 'latin1')) : null;
  cache.set(k, z);
  return z;
}

/**
 * Altura del terreno en (x,y) EPSG:25830, en metros, por interpolación bilineal
 * entre los cuatro centros de celda que lo rodean. `null` si falta alguno.
 * ⚠️ Es el modelo del TERRENO: un puente y un túnel **no son terreno**, y ahí
 *   esta función contesta la cota del suelo, no la de la calzada. Se mide
 *   cuántos son en `cuesta.js`.
 */
function altura(x, y) {
  const fx = x / CS - 0.5;
  const fy = y / CS - 0.5;
  const j0 = Math.floor(fx); const i0 = Math.floor(fy);
  const dx = fx - j0; const dy = fy - i0;
  let s = 0; let w = 0;
  const esq = [[j0, i0, (1 - dx) * (1 - dy)], [j0 + 1, i0, dx * (1 - dy)],
    [j0, i0 + 1, (1 - dx) * dy], [j0 + 1, i0 + 1, dx * dy]];
  for (const [jj, ii, pw] of esq) {
    const gx = jj * CS + CS / 2; const gy = ii * CS + CS / 2;
    const tx = Math.floor(gx / T); const ty = Math.floor(gy / T);
    const z = tesela(tx, ty);
    if (!z) continue;
    const col = Math.round((gx - tx * T - CS / 2) / CS);
    const fil = N - 1 - Math.round((gy - ty * T - CS / 2) / CS);
    if (col < 0 || col >= N || fil < 0 || fil >= N) continue;
    const v = z[fil * N + col];
    if (!Number.isFinite(v) || v < -1000) continue;
    s += v * pw; w += pw;
  }
  return w > 0.999 ? s / w : null;
}

/** Las teselas que hacen falta para un grafo: solo donde hay nodos. */
function teselasDe(nodos) {
  const m = new Map();
  for (const n of nodos) {
    const k = Math.floor(n.x / T) + ':' + Math.floor(n.y / T);
    if (!m.has(k)) m.set(k, [Math.floor(n.x / T) * T, Math.floor(n.y / T) * T]);
  }
  return [...m.values()].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function pedir(u) {
  return new Promise((res, rej) => {
    const req = https.get(u, (r) => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      const t = [];
      r.on('data', (c) => t.push(c));
      r.on('end', () => res(Buffer.concat(t).toString('latin1')));
    });
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

async function bajar(teselas, log) {
  fs.mkdirSync(DEST, { recursive: true });
  const cuenta = { ok: 0, ya: 0, falla: 0 };
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  let i = 0;
  async function obrero() {
    while (i < teselas.length) {
      const [x, y] = teselas[i++];
      const f = path.join(DEST, 'mdt05_' + x + '_' + y + '.asc');
      if (fs.existsSync(f) && fs.statSync(f).size > 1000) { cuenta.ya++; continue; }
      let bien = false;
      for (let k = 0; k < 4 && !bien; k++) {
        try {
          const txt = await pedir(url(x, y));
          const j = txt.indexOf('ncols');
          if (j < 0) throw new Error('sin cabecera ArcGrid');
          fs.writeFileSync(f, txt.slice(j).split(/\r?\n--wcs--/)[0], 'latin1');
          bien = true;
        } catch (e) { await espera(1000 * (k + 1) * (k + 1)); }
      }
      cuenta[bien ? 'ok' : 'falla']++;
      if (!bien) log('   ⛔ falla la tesela ' + x + ' ' + y);
    }
  }
  await Promise.all([obrero(), obrero(), obrero()]);
  return cuenta;
}

module.exports = { altura, teselasDe, bajar, rejilla, pedir, url, CLAVOS, DEST, T, CS, N };

// ═════════════════════════════════════════════════════════════════════════════
// CLI
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const A = require('../../src/alarma');
  const R = require('../../src/ruta');
  const log = (s) => process.stdout.write(s + '\n');
  const raya = (c = '=') => log(c.repeat(100));
  const di = (k, v) => log('   ' + String(k).padEnd(56) + ' ' + v);

  (async () => {
    raya();
    log('EL MODELO DE ELEVACIÓN — de quién es, qué resolución tiene y si dice la verdad');
    raya();

    const g = R.construir(R.ZONA_TERMINO);
    const teselas = teselasDe(g.nodos);
    di('nodos del grafo', g.nodos.length);
    di('teselas de ' + T + ' m con al menos un nodo', teselas.length);

    if (process.argv.includes('--bajar')) {
      log('');
      log('   bajando de ' + BASE + ' …');
      const c = await bajar(teselas, log);
      di('teselas', 'nuevas ' + c.ok + ' · ya estaban ' + c.ya + ' · fallan ' + c.falla);
      A.exige(c.falla === 0, `${c.falla} teselas no se han podido bajar: el muestreo tendría huecos`);
    }
    const faltan = teselas.filter(([x, y]) => !fs.existsSync(path.join(DEST, 'mdt05_' + x + '_' + y + '.asc')));
    di('teselas que faltan en disco', faltan.length + (faltan.length ? '   ⛔ ejecuta con --bajar' : '   ✅'));
    A.exige(faltan.length === 0, `faltan ${faltan.length} teselas: hay zonas del grafo sin altura`);

    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐⭐ LA RESOLUCIÓN, MEDIDA — no la que anuncia el servicio
    // ═══════════════════════════════════════════════════════════════════════
    //   El servicio ofrece la misma zona a 5, 25, 200, 500 y 1000 m. La
    //   pregunta del encargo era si el dato tiene la resolución que hace falta,
    //   y **la resolución que importa no es solo la horizontal**: si la malla de
    //   25 m viniera cuantizada a metros enteros, una calle en cuesta suave sería
    //   indistinguible de una llana por mucho que la malla fuese fina.
    log('');
    raya('─');
    log('P1 · ⭐⭐⭐ LA RESOLUCIÓN VERTICAL — se cuenta, no se supone');
    raya('─');
    const zona = teselas[Math.floor(teselas.length / 2)];
    for (const paso of [25, 5]) {
      const v = rejillaLibre(await pedir(url(zona[0], zona[1], paso)));
      const ent = v.filter((x) => Number.isInteger(x)).length;
      const dis = new Set(v).size;
      log('   malla de ' + String(paso).padStart(2) + ' m   celdas ' + String(v.length).padStart(7)
        + '   enteras ' + (100 * ent / v.length).toFixed(1).padStart(5) + ' %'
        + '   valores distintos ' + String(dis).padStart(6));
    }
    log('');
    log('   ⇒ ⭐ La malla de 25 m viene **cuantizada a metros enteros**. Sobre una');
    log('     arista de 25 m eso son escalones de pendiente del 4 %: no distingue');
    log('     una calle en cuesta suave de una llana. ⛔ Por eso se usa la de 5 m,');
    log('     que trae decimales de centímetro.');

    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐ EL SEGUNDO TESTIGO, INDEPENDIENTE — los clavos topográficos
    // ═══════════════════════════════════════════════════════════════════════
    //   ⭐ Ley de los dos testigos: el MDT es LiDAR aéreo del IGN; los clavos
    //     son señales de topografía clavadas y medidas en el suelo por el
    //     Ayuntamiento. **No comparten ni sensor, ni organismo, ni método.**
    log('');
    raya('─');
    log('P2 · ⭐⭐ EL INSTRUMENTO CONTRA UN TESTIGO INDEPENDIENTE');
    raya('─');
    A.exige(fs.existsSync(CLAVOS), 'no está el crudo de los clavos topográficos: sin segundo testigo '
      + 'la altura del MDT no está contrastada contra nada');
    const cl = JSON.parse(fs.readFileSync(CLAVOS, 'utf8'));
    di('clavos topográficos del WFS municipal', cl.features.length + ' de ' + cl.totalFeatures);
    const dif = [];
    let sinAlt = 0;
    for (const f of cl.features) {
      const a = f.properties.altitud;
      if (typeof a !== 'number') { sinAlt++; continue; }
      const [x, y] = f.geometry.coordinates;
      const z = altura(x, y);
      if (z === null) continue;
      dif.push({ d: z - a, nom: f.properties.nombre, sitio: f.properties.emplazamiento });
    }
    di('sin campo `altitud`', sinAlt + '   ⚠️ NO CONSTA su cota: no entran');
    const v = dif.map((x) => x.d).sort((a, b) => a - b);
    const q = (p) => v[Math.floor(p * (v.length - 1))];
    di('contrastados', dif.length);
    log('   MDT − clavo (m)   p01 ' + q(0.01).toFixed(2) + '   p10 ' + q(0.10).toFixed(2)
      + '   p50 ' + q(0.50).toFixed(2) + '   p90 ' + q(0.90).toFixed(2) + '   p99 ' + q(0.99).toFixed(2));
    const abs = dif.map((x) => Math.abs(x.d)).sort((a, b) => a - b);
    const qa = (p) => abs[Math.floor(p * (abs.length - 1))];
    log('   |MDT − clavo|     p50 ' + qa(0.50).toFixed(2) + '   p90 ' + qa(0.90).toFixed(2)
      + '   p99 ' + qa(0.99).toFixed(2) + '   max ' + abs[abs.length - 1].toFixed(2));
    A.exige(qa(0.50) < 1.0, `la mediana del desacuerdo con los clavos es ${qa(0.50).toFixed(2)} m: `
      + 'los dos testigos no están midiendo lo mismo y la pendiente que salga de aquí no vale');

    // ⚠️ los que se van lejos, mirados uno a uno en vez de escondidos en un p99
    log('');
    log('   ⚠️ LOS QUE MÁS SE VAN — mirados, no promediados');
    for (const x of dif.slice().sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5)) {
      log('      ' + (x.d >= 0 ? '+' : '') + x.d.toFixed(2).padStart(8) + ' m   clavo ' + String(x.nom).padEnd(10)
        + '  ' + String(x.sitio || '').slice(0, 46));
    }

    log('');
    A.cierre();
  })();

  /** como `rejilla()` pero sin exigir 400×400: la cabecera manda. */
  function rejillaLibre(txt) {
    const i = txt.indexOf('cellsize');
    const cuerpo = txt.slice(txt.indexOf('\n', i) + 1).split(/\r?\n--wcs/)[0];
    return cuerpo.trim().split(/\s+/).map(Number).filter((x) => Number.isFinite(x));
  }
}
