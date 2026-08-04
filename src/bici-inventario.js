// ⭐⭐ TANDA 18 · ¿QUÉ SABE EL AYUNTAMIENTO DE SUS CARRILES BICI?
//
//   node src/bici-inventario.js
//
// ⛔⛔ ESTO MIRA. NO DISEÑA NADA Y NO TOCA EL MOTOR. Ni el planarizado, ni el
//     enganche, ni D4, ni la salida de texto. La capa municipal **no entra en el
//     grafo**: se lee, se compara y se cuenta. El modelo de tres capas —vía ·
//     qué es · qué papel juega por modo— es la tanda siguiente y se diseña con
//     Antonio delante.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?» — POR VERIFICACIÓN,
//       ESCRITO ANTES DE EJECUTAR
// ═════════════════════════════════════════════════════════════════════════════
//
// A4 · la descarga puede venir en metros dentro de un GeoJSON perfectamente
//      válido y perfectamente equivocado (pasó en la tanda 0). ⇒ el CRS **no se
//      lee del nombre**: se comprueba contra el rango de las coordenadas, y
//      además se exige que `numberMatched === numberReturned` — si el servidor
//      hubiera paginado, el inventario contaría una parte y no lo diría.
//      ⚠️ Y ley 41: se busca a propósito si hay geometría de otras Zaragozas.
//
// B1 · «cuántos registros traen el campo relleno» puede salir bonito contando
//      `!= null` cuando el campo trae `''` o `'0'`. ⇒ se cuenta vacío como
//      null, '' y sólo-espacios, y se enseñan los valores REALES.
//
// B2 · el campo `tipo_carri` puede existir y estar vacío en el 90 %: es el fallo
//      del `estadoEstacion` de BiZi (ley 5, el aspecto de rigor no es calidad).
//      ⇒ el reparto va **en metros**, no en número de features — una feature es
//      una unidad arbitraria y hay una de 448 m junto a otras de 30.
//      ⚠️ Y se contrasta con la OTRA capa que habla del mismo hecho
//      (`carril_bizi_20250127.TIPO_CARRI`), que es el único modo de saber si el
//      vocabulario controlado dice algo o sólo lo parece.
//
// B4 · `longitud_total` es un campo declarado por el Ayuntamiento y la geometría
//      es un contador INDEPENDIENTE. ⇒ se comparan. Si no cuadran, uno de los
//      dos miente y hay que saber cuál antes de citar ningún kilómetro.
//
// C2 · ⭐⭐ el emparejamiento por proximidad **puede medir densidad urbana en vez
//      de correspondencia**: en el casco hay una arista cada 15 m, así que
//      cualquier línea cae cerca de alguna. ⇒ CONTRAPRUEBA DE DESPLAZAMIENTO:
//      la capa entera se mueve 2 km y **tiene que hundirse**. Es exactamente lo
//      que pasó en la tanda 3.
//      ⚠️ Y el radio de emparejamiento es un mando mío. Escarmentado del nº93,
//      **no se fija un radio y ya**: se publica la curva entera con su
//      desplazada al lado, para que se vea que la conclusión no cuelga de mi
//      número.
//
// C4 · el tramo de la ruta 7 se identifica **por su way de OSM**, no por
//      coordenadas de memoria: son los ways 354344721 y 475881583, que salieron
//      de `exportar-rutas.js` en la tanda 16 y que Antonio confirmó a pie.
//
// D1 · «0 aristas con `segregated`» es indistinguible de «el buscador de tags
//      está roto». ⇒ positivo de control antes de cualquier cero.

'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./portales');
const A = require('./alarma');
const osm = require('./osm');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { aMetros, aGrados } = require('./geo');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(56)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');

const F = path.join(__dirname, '..', 'data', 'fuentes');
const MU2 = path.join(F, '2026-08-04_wfs_movilidad-MU2_carriles_bici.json');
const BIZI = path.join(F, '2026-08-04_wfs_idezar-carril_bizi_20250127.json');

// ⭐ los dos ways del tramo de 1.269 m de la ruta nº7 (tanda 16, confirmado a pie)
const WAYS_RUTA7 = [354344721, 475881583];

const T0 = Date.now();

// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(110));
log('A · LA DESCARGA, VERIFICADA ANTES DE USARLA');
log('='.repeat(110));
log('');
log('   ⭐ Candidatas encontradas en el `GetCapabilities` GUARDADO (cero peticiones), buscando');
log('      por CONTENIDO —bici · ciclable · ciclista · ciclovía · bizi— y no sólo por «bici»:');
{
  const cap = fs.readFileSync(path.join(__dirname, '..', 'data', 'exploracion',
    '2026-08-02_idezar-geoserver_wfs-getcapabilities.xml'), 'utf8');
  const bloques = [...cap.matchAll(/<FeatureType[^>]*>([\s\S]*?)<\/FeatureType>/g)].map((m) => m[1]);
  const campo = (b, t) => {
    const m = b.match(new RegExp('<' + t + '>([\\s\\S]*?)</' + t + '>'));
    return m ? m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  };
  // ⭐ POSITIVO DE CONTROL PRIMERO. Sin él, un «0 candidatas» y un buscador roto
  //    son la misma pantalla — y ya me pasó al escribir esto: la primera versión
  //    de `campo()` tenía la barra mal escapada y devolvía 0 de 12.
  const ctrl = bloques.filter((b) => campo(b, 'Name').includes('MU1_jerarquia_viaria')).length;
  const neg = bloques.filter((b) => campo(b, 'Name').includes('capa-que-no-existe')).length;
  di('FeatureType en el fichero', bloques.length);
  di('⭐ control POSITIVO · ¿encuentra MU1_jerarquia_viaria?', ctrl + (ctrl === 1 ? '  ✅' : '  ⛔ BUSCADOR ROTO'));
  di('⭐ control NEGATIVO · una capa inventada', neg + (neg === 0 ? '  ✅' : '  ⛔'));
  A.exige(ctrl === 1 && neg === 0, 'el buscador de capas no pasa sus propios controles');
  const TERMS = /bici|ciclab|ciclis|ciclov|bizi/i;
  const hits = bloques.map((b) => campo(b, 'Name')).filter((n) => TERMS.test(n));
  log('');
  for (const n of hits) log('      ' + n);
  di('total candidatas', hits.length);
  log('');
  log('   ⇒ ⭐ SE ELIGE `movilidad:MU2_carriles_bici`, y el motivo es que es la ÚNICA que trae');
  log('     a la vez el TIPO de carril y el CÓDIGO DE VÍA. Las demás:');
  log('        · MU1_CC_carriles_bici_todos_{2023,2024,2025} → son AFOROS (num_est, nodo_d,');
  log('          nodo_h, iml): cuentan bicis, no describen el carril.');
  log('        · MU1_CC_aforos_bici_y_vmp · bici_comparativa · reparto_modal → aforos también.');
  log('        · MU1_estaciones_bici_ubicacion · MU2_aparcabicis → PUNTOS, no red.');
  log('        · idezar_base:carril_bizi_20250127 → sí es red, sólo dos campos (TIPO_DIREC,');
  log('          TIPO_CARRI). ⭐ Se descarga IGUAL, para contrastar el vocabulario (ley 5).');
}

/** Carga una capa WFS: verifica, proyecta a metros y devuelve tramos. */
function cargarCapa(ruta, campoGeom, etq) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  log('');
  log('   ── ' + etq + ' ' + '─'.repeat(Math.max(0, 92 - etq.length)));
  di('features', d.features.length);
  di('numberMatched / numberReturned', `${d.numberMatched} / ${d.numberReturned}`);
  // ⛔ si el servidor hubiera paginado, el inventario contaría un trozo y no lo diría
  A.exige(d.numberMatched === d.numberReturned && d.numberReturned === d.features.length,
    `${etq}: el servidor ha paginado (${d.numberMatched} disponibles, ${d.numberReturned} servidas)`);
  di('sello (timeStamp del servidor)', d.timeStamp);
  di('CRS declarado', d.crs && d.crs.properties && d.crs.properties.name);

  // ⭐ EL CRS NO SE CREE POR EL NOMBRE: se comprueba contra el rango real.
  let lon0 = Infinity, lon1 = -Infinity, lat0 = Infinity, lat1 = -Infinity, nPtos = 0;
  const tramos = [];
  for (const f of d.features) {
    if (!f.geometry) continue;
    const lineas = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const linea of lineas) {
      const pts = [];
      for (const c of linea) {
        if (c[0] < lon0) lon0 = c[0]; if (c[0] > lon1) lon1 = c[0];
        if (c[1] < lat0) lat0 = c[1]; if (c[1] > lat1) lat1 = c[1];
        nPtos++;
        pts.push(aMetros(c[0], c[1]));
      }
      if (pts.length >= 2) tramos.push({ pts, p: f.properties, id: f.id });
    }
  }
  const grados = lon0 > -181 && lon1 < 181 && lat0 > -91 && lat1 < 91;
  di('vértices', nPtos);
  di('extensión real', `lon ${lon0.toFixed(4)} … ${lon1.toFixed(4)}   lat ${lat0.toFixed(4)} … ${lat1.toFixed(4)}`);
  di('⭐ ¿son GRADOS de verdad, no metros disfrazados?', grados ? '✅ sí' : '⛔ NO: el WFS ha servido UTM dentro del GeoJSON');
  A.exige(grados, `${etq}: las coordenadas no son grados; el srsName no se ha respetado`);
  // ⚠️ LEY 41 · las cuatro Zaragozas. Aquí tienen que estar TODAS dentro del término.
  const fuera = [];
  for (const f of d.features) {
    if (!f.geometry) continue;
    const lineas = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const l of lineas) for (const c of l) {
      if (c[1] < ZONA_TERMINO.sur || c[1] > ZONA_TERMINO.norte
        || c[0] < ZONA_TERMINO.oeste || c[0] > ZONA_TERMINO.este) fuera.push(c);
    }
  }
  di('⚠️ vértices FUERA del término (ley 41, otras Zaragozas)', fuera.length
    + (fuera.length ? '  ⛔ ' + JSON.stringify(fuera[0]) : '  ✅ ninguno'));
  let L = 0;
  for (const t of tramos) for (let i = 1; i < t.pts.length; i++) L += Math.hypot(t.pts[i][0] - t.pts[i - 1][0], t.pts[i][1] - t.pts[i - 1][1]);
  di('⭐ longitud MEDIDA sobre la geometría', km(L));
  return { d, tramos, metros: L };
}

const mu2 = cargarCapa(MU2, 'geom', 'movilidad:MU2_carriles_bici  (la elegida)');
const bizi = cargarCapa(BIZI, 'the_geom', 'idezar_base:carril_bizi_20250127  (para contrastar)');

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('B · EL INVENTARIO — ¿QUÉ DISTINGUE?');
log('='.repeat(110));

const vacio = (v) => v == null || (typeof v === 'string' && v.trim() === '');

/** Metros por valor de un campo. ⭐ En METROS: una feature es una unidad arbitraria. */
function repartoPorMetros(tramos, campo) {
  const m = new Map();
  for (const t of tramos) {
    let L = 0;
    for (let i = 1; i < t.pts.length; i++) L += Math.hypot(t.pts[i][0] - t.pts[i - 1][0], t.pts[i][1] - t.pts[i - 1][1]);
    const v = vacio(t.p[campo]) ? '(vacío)' : String(t.p[campo]);
    if (!m.has(v)) m.set(v, { n: 0, m: 0 });
    const x = m.get(v); x.n++; x.m += L;
  }
  return m;
}

log('');
log('B1 · ⭐ LOS CAMPOS, UNO A UNO — todos, no una selección. «Relleno» = ni null, ni cadena');
log('     vacía, ni sólo espacios.');
{
  const feats = mu2.d.features;
  const claves = [...new Set(feats.flatMap((f) => Object.keys(f.properties || {})))];
  log('');
  log('   ' + 'campo'.padEnd(24) + 'tipo'.padEnd(10) + 'relleno'.padStart(16) + 'valores distintos'.padStart(19));
  for (const k of claves) {
    const vals = feats.map((f) => f.properties[k]);
    const rell = vals.filter((v) => !vacio(v)).length;
    const dist = new Set(vals.filter((v) => !vacio(v)).map(String)).size;
    const tipos = [...new Set(vals.filter((v) => v != null).map((v) => typeof v))].join('/') || 'null';
    log('   ' + k.padEnd(24) + tipos.padEnd(10) + `${rell} (${pct(rell, feats.length)})`.padStart(16)
      + String(dist).padStart(19));
  }
}

log('');
log('B2 · ⭐⭐⭐ LA PREGUNTA QUE LO DECIDE TODO: ¿DISTINGUE ACERA DE CALZADA?');
log('   ⚠️ No se deduce del nombre del campo. Aquí están los valores REALES, y el reparto va');
log('      EN METROS (hay features de 448 m junto a features de 30).');
log('');
{
  const r = repartoPorMetros(mu2.tramos, 'tipo_carri');
  log('   ⚠️ la columna cuenta LÍNEAS, no features: 733 features traen 2.120 líneas porque la');
  log('      geometría es MultiLineString. Los metros no dependen de eso.');
  log('');
  log('   ' + 'tipo_carri (valor literal del dato)'.padEnd(44) + 'líneas'.padStart(8)
    + 'metros'.padStart(12) + '% metros'.padStart(11));
  const tot = [...r.values()].reduce((s, x) => s + x.m, 0);
  for (const [k, v] of [...r.entries()].sort((a, b) => b[1].m - a[1].m)) {
    log('   ' + k.padEnd(44) + String(v.n).padStart(8) + km(v.m).padStart(12) + pct(v.m, tot).padStart(11));
  }
  const rellenos = tot - ((r.get('(vacío)') || { m: 0 }).m);
  log('');
  di('⭐ metros con tipo declarado', `${km(rellenos)}  (${pct(rellenos, tot)})`);
  A.exige(rellenos / tot > 0.5, `el campo tipo_carri está vacío en el ${pct(tot - rellenos, tot)} de los metros: existe pero no dice nada`);
  // ⭐ y la clasificación que importa: ¿el texto dice dónde va el carril?
  const dice = (k) => /acera/i.test(k) ? 'SOBRE LA ACERA'
    : /calzada/i.test(k) ? 'EN CALZADA'
      : /senda/i.test(k) ? 'SENDA CICLABLE (vía propia)'
        : /calmado/i.test(k) ? 'CALLE CALMADA (compartida con el tráfico)'
          : /construc/i.test(k) ? 'EN OBRAS'
            : /no municipal/i.test(k) ? 'NO MUNICIPAL' : '⚠️ NO CLASIFICADO';
  const cls = new Map();
  for (const [k, v] of r) {
    if (k === '(vacío)') continue;
    const c = dice(k);
    cls.set(c, (cls.get(c) || 0) + v.m);
  }
  log('');
  log('   ⭐ agrupado por lo que el texto DICE del sitio físico (la clasificación es mía, y los');
  log('      valores literales están arriba para poder rebatirla):');
  for (const [k, v] of [...cls.entries()].sort((a, b) => b[1] - a[1])) {
    log('      ' + k.padEnd(42) + km(v).padStart(12) + pct(v, tot).padStart(11));
  }
  log('');
  log('   ⚠️ Y UN DETALLE QUE DELATA CÓMO SE MANTIENE ESTA CAPA: «Senda ciclable» y «Senda');
  log('      Ciclable» conviven como valores distintos (84,5 km contra 28 m). El vocabulario');
  log('      NO está controlado por el servidor: es texto escrito a mano. Que sea legible no');
  log('      significa que sea un enumerado (ley 5).');
}

log('');
log('   ⭐ Y EL CONTRASTE CON LA OTRA CAPA (ley 5: el aspecto de rigor no es calidad).');
log('      `carril_bizi_20250127` trae el mismo hecho como CÓDIGO. Si los dos vocabularios');
log('      dijeran cosas distintas, el más normalizado no sería el más fiable — ya pasó con');
log('      `estadoEstacion` de BiZi.');
{
  for (const campo of ['TIPO_CARRI', 'TIPO_DIREC']) {
    const r = repartoPorMetros(bizi.tramos, campo);
    const tot = [...r.values()].reduce((s, x) => s + x.m, 0);
    log('');
    log('   ' + (campo + ' (carril_bizi_20250127)').padEnd(44) + 'tramos'.padStart(8) + 'metros'.padStart(12) + '% metros'.padStart(11));
    for (const [k, v] of [...r.entries()].sort((a, b) => b[1].m - a[1].m)) {
      log('   ' + k.padEnd(44) + String(v.n).padStart(8) + km(v.m).padStart(12) + pct(v.m, tot).padStart(11));
    }
  }
  log('');
  log('   ⚠️ `TIPO_CARRI` de esa capa es un CÓDIGO SIN LEYENDA: el WFS no publica el diccionario');
  log('      que dice qué es un «3». ⇒ `NO CONSTA` qué significan sus valores.');
  log('');
  log('   ⭐⭐ PERO SE PUEDE COMPROBAR SI LOS DOS VOCABULARIOS DICEN LO MISMO, Y ES LA PRUEBA QUE');
  log('      IMPORTA: las dos capas dibujan casi las mismas líneas. Se cruzan GEOMÉTRICAMENTE');
  log('      (a 5 m y paralelas) y se tabula tipo contra código.');
  log('      ⚠️ ¿Puede esto pasar sin que nada funcione? Sí: si el cruce empareja mal, saldría');
  log('        una tabla revuelta que yo podría leer como «las capas discrepan». ⇒ va con la');
  log('        distancia mediana del cruce al lado; si es de centímetros, el cruce es bueno.');
  {
    const rejB = new Map(), segsB = [];
    for (const t of bizi.tramos) {
      for (let i = 1; i < t.pts.length; i++) {
        const a = t.pts[i - 1], b = t.pts[i];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) continue;
        const s = segsB.length; segsB.push({ a, b, t });
        const x0 = Math.floor(Math.min(a[0], b[0]) / 100), x1 = Math.floor(Math.max(a[0], b[0]) / 100);
        const y0 = Math.floor(Math.min(a[1], b[1]) / 100), y1 = Math.floor(Math.max(a[1], b[1]) / 100);
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
          const kk = x + ',' + y;
          if (!rejB.has(kk)) rejB.set(kk, []);
          rejB.get(kk).push(s);
        }
      }
    }
    const cruce = new Map();
    const ds = [];
    let sin = 0, tot = 0;
    for (const t of mu2.tramos) {
      for (let i = 1; i < t.pts.length; i++) {
        const a = t.pts[i - 1], b = t.pts[i];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (L < 1e-9) continue;
        const rp = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const n = Math.max(1, Math.round(L / 10));
        for (let j = 0; j < n; j++) {
          const s = (j + 0.5) / n;
          const p = [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])];
          const peso = L / n; tot += peso;
          const cx = Math.floor(p[0] / 100), cy = Math.floor(p[1] / 100);
          let mejor = null;
          for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
            for (const si of (rejB.get(x + ',' + y) || [])) {
              const sg = segsB[si];
              const d = aSeg(p, sg.a, sg.b);
              if (d > 5) continue;
              let da = Math.abs(rp - Math.atan2(sg.b[1] - sg.a[1], sg.b[0] - sg.a[0])) % Math.PI;
              if (da > Math.PI / 2) da = Math.PI - da;
              if (da * 180 / Math.PI > 30) continue;
              if (!mejor || d < mejor.d) mejor = { d, t: sg.t };
            }
          }
          if (!mejor) { sin += peso; continue; }
          ds.push(mejor.d);
          const k = (t.p.tipo_carri || '(vacío)') + ' ⇄ ' + (mejor.t.p.TIPO_CARRI || '(vacío)');
          cruce.set(k, (cruce.get(k) || 0) + peso);
        }
      }
    }
    ds.sort((a, b) => a - b);
    log('');
    di('   metros de MU2 con una línea de la otra capa a menos de 5 m', `${km(tot - sin)}  (${pct(tot - sin, tot)})`);
    di('   distancia del cruce · mediana · p90', ds.length ? `${ds[Math.floor(ds.length / 2)].toFixed(2)} m · ${ds[Math.floor(ds.length * 0.9)].toFixed(2)} m` : '—');
    log('');
    log('   ' + 'tipo_carri (MU2)  ⇄  TIPO_CARRI (carril_bizi)'.padEnd(52) + 'metros'.padStart(12) + '%'.padStart(9));
    const totC = [...cruce.values()].reduce((s, v) => s + v, 0);
    for (const [k, v] of [...cruce.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
      log('   ' + k.padEnd(52) + km(v).padStart(12) + pct(v, totC).padStart(9));
    }
    log('');
    log('   ⇒ ⭐ EL CÓDIGO QUEDA DESCIFRADO por correspondencia: 3=Bidireccional acera,');
    log('     5=Senda ciclable, 4=Calmado, 2=Bidireccional calzada, 6=Unidireccional calzada,');
    log('     8=Unidireccional acera. Los seis primeros pares se llevan el 99,1 % de los metros.');
    log('');
    log('   ⛔⛔ PERO OJO A LA DISTANCIA DEL CRUCE: mediana 0,00 m Y p90 0,00 m. Eso no es «las');
    log('      dos capas coinciden»: es que **son la misma geometría, vértice a vértice**. Una');
    log('      sale de la otra.');
    log('   ⇒ ⚠️ `carril_bizi_20250127` NO ES UN TESTIGO INDEPENDIENTE de `MU2_carriles_bici`.');
    log('     Sirve para descifrar el código y para el sentido, y para nada más. **El campo');
    log('     `tipo_carri` no tiene una segunda opinión en ninguna fuente municipal.**');
    global._CRUCE = { cruce, totC, ds };
  }
}

log('');
log('B3 · ⭐ EL NOMBRE DE VÍA — es el requisito nuevo de Antonio («todas las líneas tendrían');
log('     que llevar un nombre de vía»).');
{
  const feats = mu2.d.features;
  const conCod = feats.filter((f) => !vacio(f.properties.vias_codigo)).length;
  const conNom = feats.filter((f) => !vacio(f.properties.vias_nombre_reducido)).length;
  di('features con `vias_codigo`', `${conCod}  (${pct(conCod, feats.length)})`);
  di('features con `vias_nombre_reducido`', `${conNom}  (${pct(conNom, feats.length)})`);
  // ⭐ y el código, ¿es EL MISMO codigoVia del callejero que ya usamos?
  //    Sin esto, «trae código de vía» es una frase, no un dato utilizable.
  const vias = P.cargarVias();
  let dentro = 0, fuera = 0, concuerda = 0, discorda = 0;
  const ejemplosMal = [];
  for (const f of feats) {
    const c = f.properties.vias_codigo;
    if (vacio(c)) continue;
    const v = vias.get(String(c));
    if (!v) { fuera++; continue; }
    dentro++;
    const a = P.nucleo(v.nombre), b = P.nucleo(f.properties.vias_nombre_reducido);
    if (!b) continue;
    if (a === b) concuerda++; else { discorda++; if (ejemplosMal.length < 5) ejemplosMal.push([c, v.nombre, f.properties.vias_nombre_reducido]); }
  }
  log('');
  di('⭐ códigos que EXISTEN en el callejero municipal (3.359 vías)', `${dentro}  (${pct(dentro, dentro + fuera)})`);
  di('   códigos que no están en el callejero', fuera);
  di('   ⭐ y el nombre que trae la capa, ¿coincide con el del callejero?', `${concuerda} sí · ${discorda} no  (${pct(concuerda, concuerda + discorda)})`);
  A.exige(dentro > 0, 'ningún `vias_codigo` de la capa de bici existe en el callejero: no es el mismo código');
  for (const [c, a, b] of ejemplosMal) log('      ⚠️ ' + String(c).padEnd(8) + 'callejero: ' + String(a).padEnd(40) + 'capa bici: ' + b);
  global._B3 = { conCod, conNom, dentro, fuera, concuerda, discorda };
}

log('');
log('B4 · SENTIDO, LONGITUD, ESTADO Y FECHA');
{
  const feats = mu2.d.features;
  const conFecha = feats.filter((f) => !vacio(f.properties.fecha));
  di('features con `fecha`', `${conFecha.length}  (${pct(conFecha.length, feats.length)})`);
  if (conFecha.length) {
    const fs2 = conFecha.map((f) => String(f.properties.fecha)).sort();
    di('   rango de fechas', fs2[0] + ' … ' + fs2[fs2.length - 1]);
    const porAno = new Map();
    for (const f of fs2) { const a = f.slice(0, 4); porAno.set(a, (porAno.get(a) || 0) + 1); }
    log('      por año: ' + [...porAno.entries()].sort().map(([k, v]) => k + ':' + v).join('  '));
  }
  log('   ⚠️ SENTIDO: `MU2_carriles_bici` NO trae sentido. Lo trae la OTRA capa (`TIPO_DIREC`).');
  log('      ⇒ para el sentido harían falta las dos, o emparejarlas.');
  log('');
  log('   ⭐ `longitud_total` DECLARADO contra la geometría MEDIDA — contador independiente:');
  let decl = 0, med = 0, n = 0;
  const difs = [];
  for (const f of feats) {
    if (vacio(f.properties.longitud_total) || !f.geometry) continue;
    const lineas = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    let L = 0;
    for (const l of lineas) {
      let prev = null;
      for (const c of l) { const m = aMetros(c[0], c[1]); if (prev) L += Math.hypot(m[0] - prev[0], m[1] - prev[1]); prev = m; }
    }
    decl += Number(f.properties.longitud_total); med += L; n++;
    difs.push(L - Number(f.properties.longitud_total));
  }
  difs.sort((a, b) => a - b);
  di('   features comparables', n);
  di('   suma DECLARADA / suma MEDIDA', `${km(decl)} / ${km(med)}   (dif ${((med - decl) / decl * 100).toFixed(1)} %)`);
  di('   dif por feature · mediana · p10 · p90', `${difs[Math.floor(difs.length / 2)].toFixed(1)} m · ${difs[Math.floor(difs.length * 0.1)].toFixed(1)} m · ${difs[Math.floor(difs.length * 0.9)].toFixed(1)} m`);
  log('');
  log('   ⚠️⚠️ LA MEDIANA ES 0,1 m Y LA SUMA SE VA UN 8,7 %: eso NO es ruido repartido, es que');
  log('      unas pocas features cargan con toda la diferencia. Clasificado antes de contar:');
  {
    const B = [[0, 5], [5, 50], [50, 200], [200, 1e9]];
    log('      ' + 'diferencia |medida − declarada|'.padEnd(34) + 'features'.padStart(10) + 'metros de diferencia'.padStart(22));
    for (const [a, b] of B) {
      const l = difs.filter((d) => Math.abs(d) >= a && Math.abs(d) < b);
      log('      ' + (b > 1e8 ? `≥ ${a} m` : `${a}–${b} m`).padEnd(34) + String(l.length).padStart(10)
        + l.reduce((s, d) => s + d, 0).toFixed(0).padStart(22));
    }
    log('      ⇒ el campo `longitud_total` describe UNA línea y la feature puede traer varias:');
    log('        es una etiqueta del tramo, no la suma de su geometría. ⛔ Para citar kilómetros');
    log('        se usa la GEOMETRÍA MEDIDA (333,72 km), que es la que se puede recalcular.');
  }
}

log('');
log('B5 · ⚠️ LO DEMÁS QUE TRAE Y NO HABÍAMOS PENSADO');
{
  const feats = mu2.d.features;
  const obs = feats.filter((f) => !vacio(f.properties.observaciones));
  di('features con `observaciones`', `${obs.length}  (${pct(obs.length, feats.length)})`);
  for (const f of obs.slice(0, 8)) log('      · ' + String(f.properties.observaciones).slice(0, 92));
  const tv = new Map();
  for (const f of feats) { const k = vacio(f.properties.vias_tipo_via) ? '(vacío)' : f.properties.vias_tipo_via; tv.set(k, (tv.get(k) || 0) + 1); }
  log('');
  log('   `vias_tipo_via`: ' + [...tv.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join('  '));
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('C · EL SOLAPE CON EL GRAFO — ¿llega la información a donde hace falta?');
log('='.repeat(110));

const g = construir(ZONA_TERMINO);
const crudo = osm.cargar(CRUDO);
const tagsPorWay = new Map();
for (const w of osm.recortar(crudo.ways, ZONA_TERMINO)) tagsPorWay.set(w.id, w.tags || {});

// ── índice de segmentos del grafo, con su rumbo ──────────────────────────────
const CELDA = 100;
const rejilla = new Map();
for (let i = 0; i < g.aristas.length; i++) {
  const pts = g.aristas[i].pts;
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k], b = pts[k + 1];
    const x0 = Math.floor(Math.min(a[0], b[0]) / CELDA), x1 = Math.floor(Math.max(a[0], b[0]) / CELDA);
    const y0 = Math.floor(Math.min(a[1], b[1]) / CELDA), y1 = Math.floor(Math.max(a[1], b[1]) / CELDA);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const kk = x + ',' + y;
      if (!rejilla.has(kk)) rejilla.set(kk, []);
      rejilla.get(kk).push([i, k]);
    }
  }
}

const RADIO_MAX = 30;       // m — el tope de la búsqueda; la curva se publica entera
const ANGULO_MAX = 30;      // grados — «paralelo» es una decisión y va dicha
const PASO = 10;            // m — un punto cada 10 m a lo largo de la línea municipal

const rumbo = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
function difAngular(r1, r2) {
  let d = Math.abs(r1 - r2) % Math.PI;      // sin sentido: una acera puede ir «al revés»
  if (d > Math.PI / 2) d = Math.PI - d;
  return d * 180 / Math.PI;
}
function aSeg(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const L2 = vx * vx + vy * vy;
  let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}

/**
 * El mejor emparejamiento PARALELO de un punto, dentro de RADIO_MAX.
 * ⭐ Devuelve TAMBIÉN cuántos WAYS distintos compiten dentro de 15 m: sin eso,
 *    «el 99 % empareja» no distingue *«cae sobre la arista correcta»* de *«cae
 *    sobre alguna de las tres que hay ahí»*, y esa diferencia es justo la que
 *    decide si el modelo de la tanda siguiente se puede rellenar sin ambigüedad.
 */
function mejorParalelo(p, rp) {
  const cx = Math.floor(p[0] / CELDA), cy = Math.floor(p[1] / CELDA);
  const r = Math.ceil(RADIO_MAX / CELDA);
  let mejor = null;
  const compiten = new Set();
  for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
    for (const [i, k] of (rejilla.get(x + ',' + y) || [])) {
      const e = g.aristas[i];
      const d = aSeg(p, e.pts[k], e.pts[k + 1]);
      if (d > RADIO_MAX) continue;
      const ang = difAngular(rp, rumbo(e.pts[k], e.pts[k + 1]));
      if (ang > ANGULO_MAX) continue;
      if (d <= 15) compiten.add(e.way);
      if (!mejor || d < mejor.d) mejor = { i, d, ang };
    }
  }
  if (mejor) mejor.compiten = compiten.size;
  return mejor;
}

/** Muestrea una capa cada PASO metros y empareja. `dx` desplaza la capa entera. */
function emparejar(tramos, dx = 0, dy = 0) {
  const puntos = [];
  for (const t of tramos) {
    for (let i = 1; i < t.pts.length; i++) {
      const a = [t.pts[i - 1][0] + dx, t.pts[i - 1][1] + dy];
      const b = [t.pts[i][0] + dx, t.pts[i][1] + dy];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-9) continue;
      const rp = rumbo(a, b);
      const n = Math.max(1, Math.round(L / PASO));
      for (let j = 0; j < n; j++) {
        const s = (j + 0.5) / n;
        puntos.push({ p: [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])], rp, peso: L / n, t });
      }
    }
  }
  const out = [];
  for (const q of puntos) out.push({ ...q, m: mejorParalelo(q.p, q.rp) });
  return out;
}

log('');
log('C1 · LOS KILÓMETROS DE CADA LADO');
const cycleway = [];
for (let i = 0; i < g.aristas.length; i++) if (g.aristas[i].highway === 'cycleway') cycleway.push(i);
const mCycle = cycleway.reduce((s, i) => s + g.aristas[i].largo, 0);
di('capa municipal `MU2_carriles_bici` (medido)', km(mu2.metros));
di('capa `carril_bizi_20250127` (medido)', km(bizi.metros));
di('aristas `highway=cycleway` del grafo', `${cycleway.length}  (${km(mCycle)})`);
log('   ⚠️ y NO son comparables tal cual: un carril bidireccional sobre acera es UNA línea');
log('      municipal y puede ser DOS ways de OSM (la acera y el carril), o ninguno.');

log('');
log('C2 · ⭐⭐ ¿SE PUEDEN EMPAREJAR? — y la contraprueba de desplazamiento VA DELANTE');
log('   ⚠️ La pregunta que hay que hacerse antes: **esto puede medir densidad urbana en vez de');
log('      correspondencia.** En el casco hay una arista cada 15 m; cualquier línea cae cerca de');
log('      alguna. ⇒ la capa entera se mueve 2 km al este y el emparejamiento tiene que hundirse.');
log('   ⚠️ Y el radio es un mando MÍO. Escarmentado del nº93, no fijo uno y ya: va la curva.');
log('');
{
  const real = emparejar(mu2.tramos);
  const desp = emparejar(mu2.tramos, 2000, 0);
  const totM = real.reduce((s, q) => s + q.peso, 0);
  log('   ' + 'radio'.padEnd(12) + 'metros emparejados'.padStart(20) + '% de la capa'.padStart(14)
    + '   ·   ' + 'DESPLAZADA 2 km'.padStart(18) + 'razón'.padStart(9));
  for (const R of [5, 10, 15, 20, 30]) {
    const a = real.filter((q) => q.m && q.m.d <= R).reduce((s, q) => s + q.peso, 0);
    const b = desp.filter((q) => q.m && q.m.d <= R).reduce((s, q) => s + q.peso, 0);
    log('   ' + `${R} m`.padEnd(12) + km(a).padStart(20) + pct(a, totM).padStart(14)
      + '   ·   ' + (pct(b, totM) + ' (' + km(b) + ')').padStart(18)
      + (b > 0 ? `×${(a / b).toFixed(1)}` : '×∞').padStart(9));
  }
  const R = 15;
  const a15 = real.filter((q) => q.m && q.m.d <= R).reduce((s, q) => s + q.peso, 0);
  const b15 = desp.filter((q) => q.m && q.m.d <= R).reduce((s, q) => s + q.peso, 0);
  log('');
  A.exige(a15 > 3 * b15, `el emparejamiento no se hunde al desplazar la capa 2 km (${pct(a15, totM)} contra ${pct(b15, totM)}): mide densidad, no correspondencia`);
  di('⇒ ¿se hunde al desplazar?', a15 > 3 * b15 ? `✅ sí — ×${(a15 / b15).toFixed(1)}: mide correspondencia` : '⛔ NO: mide densidad urbana');
  global._C2 = { real, desp, totM, R };

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️⚠️ EL 99,5 % ES REDONDO, Y ESO ES LA SEÑAL — no se celebra, se abre
  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('   ⚠️⚠️ ESE 99,5 % NO SIGNIFICA LO QUE PARECE, Y SALE DEMASIADO REDONDO PARA DEJARLO.');
  log('      El grafo tiene una línea encima de CADA calle de Zaragoza: que un carril bici caiga');
  log('      «sobre alguna arista» es casi trivial. La pregunta útil no es SI cae, es SOBRE');
  log('      CUÁL — y si hay una sola candidata o tres.');
  log('');
  log('   ⭐ WAYS DISTINTOS que compiten dentro de 15 m y con el mismo rumbo:');
  {
    const emp = real.filter((q) => q.m && q.m.d <= R);
    const c = new Map();
    for (const q of emp) c.set(q.m.compiten, (c.get(q.m.compiten) || 0) + q.peso);
    const totE = [...c.values()].reduce((s, v) => s + v, 0);
    log('      ' + 'candidatos'.padEnd(22) + 'metros'.padStart(12) + '%'.padStart(9));
    for (const k of [...c.keys()].sort((a, b) => a - b)) {
      const etq = k === 1 ? '1  ⭐ unívoco' : k >= 5 ? '5 o más  ⛔' : String(k);
      if (k >= 5) continue;
      log('      ' + etq.padEnd(22) + km(c.get(k)).padStart(12) + pct(c.get(k), totE).padStart(9));
    }
    const cinco = [...c.entries()].filter(([k]) => k >= 5).reduce((s, [, v]) => s + v, 0);
    log('      ' + '5 o más  ⛔'.padEnd(22) + km(cinco).padStart(12) + pct(cinco, totE).padStart(9));
    const univoco = c.get(1) || 0;
    log('');
    di('   ⭐⭐ metros con UNA SOLA candidata (asignable sin decidir nada)', `${km(univoco)}  (${pct(univoco, totE)})`);
    di('      metros con dos o más (hay que elegir, y elegir es inventar)', `${km(totE - univoco)}  (${pct(totE - univoco, totE)})`);
    global._UNIV = { univoco, totE };
  }
}

log('');
log('C3 · ⭐ LOS TRES GRUPOS, EN METROS');
{
  const { real, totM, R } = global._C2;
  const emp = real.filter((q) => q.m && q.m.d <= R);
  const noEmp = real.filter((q) => !(q.m && q.m.d <= R));
  const mEmp = emp.reduce((s, q) => s + q.peso, 0);
  di('EN LOS DOS · la línea municipal cae sobre una arista del grafo', `${km(mEmp)}  (${pct(mEmp, totM)})`);
  di('SOLO EN EL MUNICIPAL · carril que el grafo no tiene', `${km(totM - mEmp)}  (${pct(totM - mEmp, totM)})`);
  // ⭐ ¿qué es lo que NO empareja? clasificar antes de contar
  const porTipo = new Map();
  for (const q of noEmp) {
    const k = vacio(q.t.p.tipo_carri) ? '(vacío)' : q.t.p.tipo_carri;
    porTipo.set(k, (porTipo.get(k) || 0) + q.peso);
  }
  log('      lo que NO empareja, por tipo:');
  for (const [k, v] of [...porTipo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
    log('         ' + k.padEnd(40) + km(v).padStart(12) + pct(v, totM - mEmp).padStart(11));
  }
  // el tercer grupo: cycleway de OSM que no toca ninguna línea municipal
  const tocadas = new Set(emp.map((q) => q.m.i));
  const soloOsm = cycleway.filter((i) => !tocadas.has(i));
  const mSolo = soloOsm.reduce((s, i) => s + g.aristas[i].largo, 0);
  log('');
  di('SOLO EN OSM · `cycleway` que ninguna línea municipal toca', `${soloOsm.length} aristas  (${km(mSolo)}, ${pct(mSolo, mCycle)} del cycleway)`);
  log('      ⚠️ CLASIFICAR ANTES DE CONTAR: ¿qué son?');
  const cls = new Map();
  for (const i of soloOsm) {
    const t = tagsPorWay.get(g.aristas[i].way) || {};
    const k = t.name ? 'con nombre' : (t.foot === 'no' ? 'sin nombre · foot=no' : 'sin nombre');
    if (!cls.has(k)) cls.set(k, { n: 0, m: 0 });
    const v = cls.get(k); v.n++; v.m += g.aristas[i].largo;
  }
  for (const [k, v] of [...cls.entries()].sort((a, b) => b[1].m - a[1].m)) {
    log('         ' + k.padEnd(40) + String(v.n).padStart(8) + km(v.m).padStart(12));
  }
  // ¿y están dentro del casco urbano o son de fuera?
  const nombres = new Map();
  for (const i of soloOsm) {
    const t = tagsPorWay.get(g.aristas[i].way) || {};
    if (!t.name) continue;
    nombres.set(t.name, (nombres.get(t.name) || 0) + g.aristas[i].largo);
  }
  log('      los 6 nombres con más metros de `cycleway` que el Ayuntamiento no reconoce:');
  for (const [k, v] of [...nombres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
    log('         ' + String(k).slice(0, 46).padEnd(48) + km(v).padStart(12));
  }
  global._C3 = { mEmp, totM, mSolo, soloOsm };
}

log('');
log('C4 · ⭐⭐ EL CASO QUE MOTIVA TODO ESTO — el tramo de 1.269 m de la ruta nº7');
log('   ⛔ se identifica por su WAY de OSM, no por coordenadas de memoria:');
log('      ways ' + WAYS_RUTA7.join(' y ') + ', el corredor del Actur. Antonio lo ha andado y');
log('      dijo: «es carril bici a misma cota que acera pegado».');
log('   ⛔ Y NO SE MIDE SOBRE LOS WAYS ENTEROS: se piden las aristas de la ruta nº7 a');
log('      `rutas-antonio.js --aristas` y se cruzan con esos ways. Los ways enteros miden 3 km');
log('      y Antonio sólo anduvo 1.269 m; medir sobre el way entero contestaría otra pregunta.');
{
  let sieteRaw = null;
  try {
    const out = require('child_process').execFileSync(process.execPath,
      [path.join(__dirname, 'rutas-antonio.js'), '--aristas'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const l = out.split('\n').find((x) => x.startsWith('##ARISTAS##'));
    sieteRaw = l ? JSON.parse(l.slice('##ARISTAS##'.length)) : null;
  } catch (e) {
    // ⚠️ `rutas-antonio.js` sale en ROJO a propósito (la nº4 tiene el rodeo declarado
    //    fuera de banda). Eso no es un fallo de lectura: la línea está en su stdout.
    const out = (e.stdout || '').toString();
    const l = out.split('\n').find((x) => x.startsWith('##ARISTAS##'));
    sieteRaw = l ? JSON.parse(l.slice('##ARISTAS##'.length)) : null;
  }
  A.exige(!!sieteRaw, 'no se ha podido leer `##ARISTAS##` de rutas-antonio.js');
  const r7 = (sieteRaw || []).find((x) => x.n === 7);
  A.exige(!!r7, 'la ruta nº7 no viene en la salida de rutas-antonio.js');
  const enteras = [];
  for (let i = 0; i < g.aristas.length; i++) if (WAYS_RUTA7.includes(g.aristas[i].way)) enteras.push(i);
  const idx = (r7 ? r7.aristas : []).filter((i) => WAYS_RUTA7.includes(g.aristas[i].way));
  const mR7 = idx.reduce((s, i) => s + g.aristas[i].largo, 0);
  log('');
  di('aristas de esos ways en el grafo (el way ENTERO)', `${enteras.length}  (${km(enteras.reduce((s, i) => s + g.aristas[i].largo, 0))})`);
  di('⭐ …de ellas, LAS QUE PISA LA RUTA Nº7', `${idx.length}  (${km(mR7)})`);
  A.exige(idx.length > 0, 'los ways de la ruta 7 no aparecen en las aristas de la ruta 7');
  for (const w of WAYS_RUTA7) {
    const t = tagsPorWay.get(w) || {};
    log('      way ' + w + ' · OSM dice: ' + (Object.keys(t).length
      ? Object.entries(t).map(([k, v]) => k + '=' + v).join(' · ') : '⛔ sin tags'));
  }
  // ¿qué línea municipal cae encima de esas aristas?
  const { real, R } = global._C2;
  const enR7 = real.filter((q) => q.m && q.m.d <= R && idx.includes(q.m.i));
  const mMuni = enR7.reduce((s, q) => s + q.peso, 0);
  log('');
  di('⭐ metros de capa municipal que caen sobre ese tramo', `${km(mMuni)}  (de ${km(mR7)} de tramo)`);
  if (!enR7.length) {
    log('   ⛔⛔ LA CAPA MUNICIPAL NO TIENE NADA AHÍ. Antonio lo ha andado y dice que es carril');
    log('      bici. **La discrepancia es el hallazgo** y hay que decirla, no explicarla.');
    A.exige(false, 'la capa municipal no reconoce como carril bici el tramo de la ruta 7, que Antonio confirmó a pie');
  } else {
    const c = new Map();
    for (const q of enR7) {
      const k = [q.t.p.tipo_carri, q.t.p.vias_tipo_via, q.t.p.vias_nombre_reducido, q.t.p.vias_codigo].join(' | ');
      c.set(k, (c.get(k) || 0) + q.peso);
    }
    log('   ⭐ y lo que DICE de él (tipo | tipo de vía | nombre | código):');
    for (const [k, v] of [...c.entries()].sort((a, b) => b[1] - a[1])) {
      log('      ' + km(v).padStart(10) + '   ' + k);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ Y AHORA AL REVÉS, QUE ES LA PREGUNTA DE VERDAD
  // ═══════════════════════════════════════════════════════════════════════════
  // Arriba se ha preguntado «¿qué líneas municipales caen sobre este tramo?».
  // Eso está sesgado: una línea municipal que encaje MEJOR con la calzada de al
  // lado no aparece aquí aunque describa la misma avenida. La pregunta directa
  // es la contraria: **para cada metro de este tramo, ¿cuál es la línea
  // municipal más cercana y qué dice?**
  log('');
  log('   ⭐⭐ AL REVÉS — para cada metro del tramo que Antonio anduvo, la línea municipal más');
  log('      cercana y paralela. (La de arriba está sesgada: una línea que encaje mejor con la');
  log('      calzada de al lado no sale, aunque describa la misma avenida.)');
  {
    // rejilla de segmentos municipales
    const rejM = new Map();
    const segs = [];
    for (const t of mu2.tramos) {
      for (let i = 1; i < t.pts.length; i++) {
        const a = t.pts[i - 1], b = t.pts[i];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) continue;
        const s = segs.length;
        segs.push({ a, b, t });
        const x0 = Math.floor(Math.min(a[0], b[0]) / CELDA), x1 = Math.floor(Math.max(a[0], b[0]) / CELDA);
        const y0 = Math.floor(Math.min(a[1], b[1]) / CELDA), y1 = Math.floor(Math.max(a[1], b[1]) / CELDA);
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
          const kk = x + ',' + y;
          if (!rejM.has(kk)) rejM.set(kk, []);
          rejM.get(kk).push(s);
        }
      }
    }
    const cuenta = new Map();
    let sinNada = 0, total = 0;
    const ds = [];
    for (const i of idx) {
      const pts = g.aristas[i].pts;
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (L < 1e-9) continue;
        const rp = rumbo(a, b);
        const n = Math.max(1, Math.round(L / PASO));
        for (let j = 0; j < n; j++) {
          const s = (j + 0.5) / n;
          const p = [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])];
          const peso = L / n;
          total += peso;
          const cx = Math.floor(p[0] / CELDA), cy = Math.floor(p[1] / CELDA);
          const r = Math.ceil(RADIO_MAX / CELDA);
          let mejor = null;
          for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
            for (const si of (rejM.get(x + ',' + y) || [])) {
              const sg = segs[si];
              const d = aSeg(p, sg.a, sg.b);
              if (d > RADIO_MAX) continue;
              if (difAngular(rp, rumbo(sg.a, sg.b)) > ANGULO_MAX) continue;
              if (!mejor || d < mejor.d) mejor = { d, t: sg.t };
            }
          }
          if (!mejor) { sinNada += peso; continue; }
          ds.push(mejor.d);
          const k2 = mejor.t.p.tipo_carri + '  ·  ' + mejor.t.p.vias_nombre_reducido;
          cuenta.set(k2, (cuenta.get(k2) || 0) + peso);
        }
      }
    }
    ds.sort((a, b) => a - b);
    log('');
    log('      ' + 'tipo_carri · vía'.padEnd(56) + 'metros'.padStart(10) + '%'.padStart(9));
    for (const [k, v] of [...cuenta.entries()].sort((a, b) => b[1] - a[1])) {
      log('      ' + k.slice(0, 55).padEnd(56) + km(v).padStart(10) + pct(v, total).padStart(9));
    }
    if (sinNada) log('      ' + '(ninguna línea municipal a 30 m)'.padEnd(56) + km(sinNada).padStart(10) + pct(sinNada, total).padStart(9));
    di('      distancia a la línea municipal · mediana · p90', ds.length
      ? `${ds[Math.floor(ds.length / 2)].toFixed(1)} m · ${ds[Math.floor(ds.length * 0.9)].toFixed(1)} m` : '—');
    global._C4b = { cuenta, total, sinNada };
  }
  global._C4 = { idx, mR7, enR7 };
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('D · Y QUÉ DICE OSM POR SU CUENTA');
log('='.repeat(110));
log('');
log('D1 · las etiquetas secundarias de las aristas `cycleway`');
log('   ⭐ POSITIVO DE CONTROL PRIMERO: un cero y un buscador roto son la misma pantalla.');
{
  const ways = new Set(cycleway.map((i) => g.aristas[i].way));
  const ctrl = [...ways].filter((w) => (tagsPorWay.get(w) || {}).highway === 'cycleway').length;
  di('⭐ control · ways que el buscador ve como highway=cycleway', `${ctrl} de ${ways.size}` + (ctrl === ways.size ? '  ✅' : '  ⛔ ROTO'));
  A.exige(ctrl === ways.size, 'el buscador de tags no ve el highway de los propios cycleway');
  log('');
  log('   ' + 'etiqueta'.padEnd(24) + 'ways que la traen'.padStart(20) + '%'.padStart(9) + '   valores');
  for (const k of ['name', 'segregated', 'foot', 'bicycle', 'surface', 'oneway', 'width',
    'cycleway', 'cycleway:right', 'cycleway:left', 'lit', 'traffic_sign']) {
    const con = [...ways].filter((w) => !vacio((tagsPorWay.get(w) || {})[k]));
    const vals = new Map();
    for (const w of con) { const v = String((tagsPorWay.get(w))[k]); vals.set(v, (vals.get(v) || 0) + 1); }
    const muestra = k === 'name' ? '(' + vals.size + ' distintos)'
      : [...vals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a, b]) => a + ':' + b).join('  ');
    log('   ' + k.padEnd(24) + String(con.length).padStart(20) + pct(con.length, ways.size).padStart(9) + '   ' + muestra);
  }
}

log('');
log('D2 · ⭐ ¿PUEDE OSM DISTINGUIR POR SÍ SOLO LOS TRES CASOS?');
log('   Los tres casos son: segregado en calzada · pintado sobre acera · compartido.');
{
  const ways = new Set(cycleway.map((i) => g.aristas[i].way));
  let seg = 0, pista = 0, nada = 0;
  for (const w of ways) {
    const t = tagsPorWay.get(w) || {};
    if (!vacio(t.segregated)) seg++;
    else if (!vacio(t.foot) || !vacio(t.bicycle)) pista++;
    else nada++;
  }
  di('ways `cycleway` con `segregated` (el único que lo dice claro)', `${seg}  (${pct(seg, ways.size)})`);
  di('   con `foot`/`bicycle` pero sin `segregated`', `${pista}  (${pct(pista, ways.size)})`);
  di('   ⛔ sin ninguna de las tres', `${nada}  (${pct(nada, ways.size)})`);
  log('   ⇒ ese último número es la respuesta a D2.');
}

log('');
log('D4 · ⚠️⚠️ EL CASO INVERSO — aceras que en realidad llevan bici y OSM llama sólo `footway`');
{
  const { real, R } = global._C2;
  const emp = real.filter((q) => q.m && q.m.d <= R);
  const porHighway = new Map();
  for (const q of emp) {
    const h = g.aristas[q.m.i].highway || '(sin highway)';
    if (!porHighway.has(h)) porHighway.set(h, { m: 0, tipos: new Map() });
    const v = porHighway.get(h);
    v.m += q.peso;
    const k = vacio(q.t.p.tipo_carri) ? '(vacío)' : q.t.p.tipo_carri;
    v.tipos.set(k, (v.tipos.get(k) || 0) + q.peso);
  }
  log('   ⭐ a qué `highway` de OSM cae encima cada metro de carril bici municipal:');
  log('   ' + 'highway de OSM'.padEnd(22) + 'metros'.padStart(12) + '%'.padStart(9) + '   tipo municipal dominante');
  const totE = [...porHighway.values()].reduce((s, v) => s + v.m, 0);
  for (const [k, v] of [...porHighway.entries()].sort((a, b) => b[1].m - a[1].m).slice(0, 10)) {
    const top = [...v.tipos.entries()].sort((a, b) => b[1] - a[1])[0];
    log('   ' + k.padEnd(22) + km(v.m).padStart(12) + pct(v.m, totE).padStart(9)
      + '   ' + top[0] + ' (' + pct(top[1], v.m) + ')');
  }
  // ⭐⭐ el número que importa: metros de acera-bici que OSM etiqueta footway y NO cycleway
  const enFootway = emp.filter((q) => {
    const e = g.aristas[q.m.i];
    return e.highway === 'footway' && /acera/i.test(String(q.t.p.tipo_carri || ''));
  });
  const mFoot = enFootway.reduce((s, q) => s + q.peso, 0);
  const waysFoot = new Set(enFootway.map((q) => g.aristas[q.m.i].way));
  let conBici = 0;
  for (const w of waysFoot) if (!vacio((tagsPorWay.get(w) || {}).bicycle)) conBici++;
  log('');
  di('⭐⭐ metros de carril bici SOBRE ACERA que caen en un `footway` de OSM', km(mFoot));
  di('   ways `footway` implicados', waysFoot.size);
  di('   …de ellos, con `bicycle=*` en OSM', `${conBici}  (${pct(conBici, waysFoot.size)})`);
  log('   ⇒ los que NO lo traen son aceras que llevan bici y OSM no lo dice. Es justo lo que');
  log('     el modelo nuevo tendría que poder representar — y el motor de hoy no puede.');
  global._D4 = { mFoot, waysFoot: waysFoot.size, conBici };
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('E · EL VEREDICTO — y la PARADA');
log('='.repeat(110));
{
  const { mEmp, totM } = global._C3;
  const r = repartoPorMetros(mu2.tramos, 'tipo_carri');
  const tot = [...r.values()].reduce((s, x) => s + x.m, 0);
  const conTipo = tot - ((r.get('(vacío)') || { m: 0 }).m);
  log('');
  di('la capa distingue el TIPO en', `${km(conTipo)} de ${km(tot)}  (${pct(conTipo, tot)})`);
  di('trae CÓDIGO DE VÍA en', pct(global._B3.conCod, mu2.d.features.length) + ' de las features');
  di('llega al grafo (emparejado, radio 15 m)', `${km(mEmp)}  (${pct(mEmp, totM)})`);
  di('acera-bici que OSM llama sólo `footway`', km(global._D4.mFoot));
}
log('');
log(A.cierre('INVENTARIO DE CARRILES BICI'));
di('peticiones al WFS en esta tanda', '5 (3 DescribeFeatureType + 2 GetFeature) de 8 de presupuesto');
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
