// ⭐⭐ TANDA 19 · B · LA ASIGNACIÓN — de la línea municipal a la arista del grafo.
//
//   node src/asignar-bici.js
//
// ⛔⛔ NO TOCA EL GRAFO. Devuelve una tabla `arista → ciclista`. El grafo entra y
//     sale igual, y hay un hash que lo comprueba en `src/modelo.js`.
//
// ═════════════════════════════════════════════════════════════════════════════
// EL PROBLEMA, QUE NO ES DE DATOS
// ═════════════════════════════════════════════════════════════════════════════
//   La tanda 18 dejó el dato bueno —`tipo_carri` relleno al 100 %, `vias_codigo`
//   al 100 %— y el problema en otro sitio: **solo el 21,3 % de los metros tiene
//   UNA sola arista candidata**. En el 78,7 % hay acera de un lado, calzada y
//   acera de enfrente.
//   ⛔ Y elegir mal no da error: da una línea con el papel equivocado. Es el modo
//     de fallo de todo este proyecto.
//
// ═════════════════════════════════════════════════════════════════════════════
// LA REGLA, ESCRITA ANTES DE EJECUTARLA
// ═════════════════════════════════════════════════════════════════════════════
//   Se muestrea la línea municipal cada 10 m. Para cada punto, los WAYS con un
//   segmento a ≤15 m y con rumbo a ≤30° (los mismos números de la tanda 18).
//
//     1 · un solo way            → ASIGNADA · univoca
//     2 · varios → filtro por `tipo_carri`: si dice «acera», solo son candidatas
//         las plataformas de andar; si dice «calzada», las de rodar. Si queda uno
//                                → ASIGNADA · desempatada-por-tipo
//     3 · siguen varios, pero el más cercano está ≥5 m más cerca que el siguiente
//                                → ASIGNADA · desempatada-por-margen
//     4 · siguen varios y empatados
//                                → ⛔ AMBIGUA. NO se asigna.
//     5 · el filtro deja cero    → ⛔ SIN CANDIDATA COMPATIBLE. NO se asigna.
//
//   ⛔ Elegir «la más cercana» entre dos aceras equidistantes sería inventar. La
//     respuesta correcta ahí es NO ASIGNAR y contarlo.
//
//   ⚠️ EL MARGEN DE 5 m ES MÍO, y va con su porqué: un carril pintado sobre una
//   acera está a menos de media acera de su eje, y la acera de enfrente está al
//   otro lado de una calzada — en Zaragoza, 7-12 m. 5 m cae holgadamente entre
//   las dos escalas. **Se fija antes de mirar y se publica su curva de
//   sensibilidad**, escarmentado del nº93.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?» — POR CONTRAPRUEBA
// ═════════════════════════════════════════════════════════════════════════════
// B4a · DESPLAZAMIENTO · mover la capa 2 km tiene que hundir la asignación.
//       ⚠️ Y se mide **sobre la misma unidad que el resultado bueno** —metros
//       municipales asignados Y aristas asignadas—, porque en la tanda 18 esta
//       misma contraprueba funcionaba perfectamente sobre la geometría
//       equivocada (bitácora nº94).
//
// B4b · IDENTIDAD · tres experimentos con su ÁLGEBRA ESCRITA ANTES (ley 51):
//       · duplicar cada línea municipal → la asignación tiene que salir
//         **IDÉNTICA**: los candidatos de un punto no dependen de cuántas veces
//         esté escrito ese punto. Si cambia, el método depende de cómo venga
//         troceado el fichero, y eso es un fallo.
//       · partir cada línea por la mitad → **IDÉNTICA**, por lo mismo.
//       · ⭐ intercambiar `acera` ↔ `calzada` en el `tipo_carri` → la asignación
//         **TIENE QUE CAMBIAR**. Si no cambiara, el `tipo_carri` no estaría
//         haciendo nada y el paso 2 sería decorativo.
//
// B4c · PATRÓN DE VERDAD · los puntos que a 15 m tienen UNA sola candidata se
//       reevalúan a 30 m, donde aparecen más. La regla completa tiene que
//       recuperar el mismo way.
//       ⚠️ ¿Puede fallar? Sí, y de la peor manera: **si al abrir a 30 m no
//       apareciera ningún candidato nuevo, la prueba sería vacía y saldría 100 %**
//       ⇒ se publica cuántos puntos pasaron de verdad a tener varias candidatas.
//       Solo esos cuentan. ⭐ Y la verdad no la elijo yo: la univocidad a 15 m la
//       fijó la geometría (ley 17).

'use strict';
const fs = require('fs');
const path = require('path');
const F = require('./forma');
const A = require('./alarma');
const osm = require('./osm');
const { aMetros } = require('./geo');
const { ZONA_TERMINO } = require('./ruta');

const CAPA = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-04_wfs_movilidad-MU2_carriles_bici.json');

const RADIO = 15;        // m  — el de la tanda 18
const ANGULO = 30;       // grados
const PASO = 10;         // m  — un punto cada 10 m de línea municipal
const MARGEN = 5;        // m  — declarado arriba, con su porqué

// ⭐ QUÉ PLATAFORMA PUEDE LLEVAR CADA TIPO DE CARRIL. Escrito antes de mirar.
const COMPATIBLE = {
  'carril-sobre-acera': ['acera', 'carril-bici', 'plataforma-peatonal'],
  'carril-en-calzada': ['calzada', 'carril-bici', 'vial-de-servicio'],
  'senda-ciclable': ['carril-bici', 'camino', 'pista', 'plataforma-peatonal'],
  'calle-calmada': ['calzada', 'vial-de-servicio'],
  // ⛔ estos dos NO asignan: no describen una infraestructura en servicio
  'en-obras': [],
  'no-municipal': [],
};

const rumbo = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
function difAng(r1, r2) {
  let d = Math.abs(r1 - r2) % Math.PI;
  if (d > Math.PI / 2) d = Math.PI - d;
  return d * 180 / Math.PI;
}
function aSeg(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy;
  let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}

/** Lee la capa municipal y la proyecta a metros. Una entrada por LÍNEA. */
function cargarCapa(ruta = CAPA) {
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const out = [];
  for (const f of d.features) {
    if (!f.geometry) continue;
    const lineas = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const l of lineas) {
      const pts = l.map((c) => aMetros(c[0], c[1]));
      if (pts.length >= 2) out.push({ pts, p: f.properties });
    }
  }
  return { lineas: out, sello: d.timeStamp, n: d.features.length };
}

/** Rejilla de segmentos del grafo, con el índice de arista y de segmento. */
function indexar(aristas, celda = 100) {
  const m = new Map();
  for (let i = 0; i < aristas.length; i++) {
    const pts = aristas[i].pts;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1];
      const x0 = Math.floor(Math.min(a[0], b[0]) / celda), x1 = Math.floor(Math.max(a[0], b[0]) / celda);
      const y0 = Math.floor(Math.min(a[1], b[1]) / celda), y1 = Math.floor(Math.max(a[1], b[1]) / celda);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        const kk = x + ',' + y;
        if (!m.has(kk)) m.set(kk, []);
        m.get(kk).push([i, k]);
      }
    }
  }
  return { m, celda };
}

/**
 * ⭐ LA ASIGNACIÓN. Devuelve la tabla `arista → ciclista` y los contadores.
 * @param {object} g grafo (SOLO SE LEE)
 * @param {Array} lineas capa municipal ya proyectada
 * @param {Function} platDe (wayId) -> plataforma
 * @param {object} op {radio, margen}
 */
function asignar(g, lineas, platDe, op = {}) {
  const radio = op.radio ?? RADIO;
  const margen = op.margen ?? MARGEN;
  const idx = op.idx || indexar(g.aristas);
  const { m: rej, celda } = idx;
  const r = Math.ceil(radio / celda);

  const porArista = new Map();     // arista -> Map(clave -> metros)
  const c = { univoca: 0, tipo: 0, margen: 0, ambigua: 0, sinCompatible: 0, sinCandidata: 0, total: 0 };
  const cN = { univoca: 0, tipo: 0, margen: 0, ambigua: 0, sinCompatible: 0, sinCandidata: 0, total: 0 };
  const detalle = [];              // por punto, para el patrón de verdad

  for (const linea of lineas) {
    const cic = F.ciclistaDe(linea.p.tipo_carri);
    const compat = COMPATIBLE[cic] || [];
    for (let i = 1; i < linea.pts.length; i++) {
      const a = linea.pts[i - 1], b = linea.pts[i];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-9) continue;
      const rp = rumbo(a, b);
      const n = Math.max(1, Math.round(L / PASO));
      for (let j = 0; j < n; j++) {
        const s = (j + 0.5) / n;
        const p = [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])];
        const peso = L / n;
        c.total += peso; cN.total++;

        // ── candidatos: por WAY, guardando la arista más cercana de cada uno ──
        const cx = Math.floor(p[0] / celda), cy = Math.floor(p[1] / celda);
        const ways = new Map();
        for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
          for (const [ii, kk] of (rej.get(x + ',' + y) || [])) {
            const e = g.aristas[ii];
            const d = aSeg(p, e.pts[kk], e.pts[kk + 1]);
            if (d > radio) continue;
            if (difAng(rp, rumbo(e.pts[kk], e.pts[kk + 1])) > ANGULO) continue;
            const v = ways.get(e.way);
            if (!v || d < v.d) ways.set(e.way, { d, arista: ii });
          }
        }
        const todas = [...ways.entries()].sort((x, y) => x[1].d - y[1].d);
        let estado = null, elegido = null;
        if (!ways.size) estado = 'sinCandidata';
        else if (todas.length === 1) {
          // ⚠️ LA REGLA, TAL COMO LA DECLARÉ: un solo candidato se asigna SIN mirar
          //    la compatibilidad. Es discutible —y en B4a se ve lo que cuesta—,
          //    pero se queda como está: cambiarla después de ver la contraprueba
          //    sería ajustar el instrumento al resultado.
          // ⛔ `estricto` NO es la regla: es la ALTERNATIVA que B4a mide y que
          //    NADIE aplica. Existe para poder enseñar el número, no para usarlo.
          if (op.estricto && !compat.includes(platDe(todas[0][0]))) estado = 'sinCompatible';
          else { estado = 'univoca'; elegido = todas[0]; }
        } else {
          const filtradas = todas.filter(([w]) => compat.includes(platDe(w)));
          if (!compat.length || filtradas.length === 0) estado = 'sinCompatible';
          else if (filtradas.length === 1) { estado = 'tipo'; elegido = filtradas[0]; }
          else if (filtradas[1][1].d - filtradas[0][1].d >= margen) { estado = 'margen'; elegido = filtradas[0]; }
          else estado = 'ambigua';
        }
        c[estado] += peso; cN[estado]++;
        // ⭐ el detalle se apunta SIEMPRE, asigne o no. Si solo se apuntaran los
        //    asignados, dos ejecuciones con radios distintos tendrían longitudes
        //    distintas y no se podrían comparar punto a punto — que es justo lo
        //    que necesita el patrón de verdad de B4c.
        if (op.conDetalle) {
          detalle.push({ cic, ways: todas.length, compatibles: todas.filter(([w]) => compat.includes(platDe(w))).length,
            elegido: elegido ? elegido[0] : null, estado, peso });
        }
        if (!elegido) continue;
        const ia = elegido[1].arista;
        if (!porArista.has(ia)) porArista.set(ia, new Map());
        const mm = porArista.get(ia);
        const clave = JSON.stringify({ cic, tipo: linea.p.tipo_carri, cod: String(linea.p.vias_codigo),
          nombre: linea.p.vias_nombre_reducido, estado });
        mm.set(clave, (mm.get(clave) || 0) + peso);
      }
    }
  }

  // ── se resuelve cada arista con lo que más metros le haya caído encima ─────
  const tabla = new Map();
  for (const [ia, mm] of porArista) {
    const orden = [...mm.entries()].sort((a, b) => b[1] - a[1]);
    const g1 = JSON.parse(orden[0][0]);
    const total = orden.reduce((s, x) => s + x[1], 0);
    // ⭐ ¿le caen encima tramos de VÍAS DISTINTAS? Si sí, el código de vía de esa
    //    arista no está decidido y NO se usa para nombrarla (§A2: elegir sería
    //    inventar). Se cuenta aparte.
    const cods = new Set(orden.map(([k]) => JSON.parse(k).cod));
    tabla.set(ia, { ...g1, metros: orden[0][1], metrosTotal: total,
      candidatosDistintos: orden.length, codsDistintos: cods.size, apoyo: orden[0][1] / total });
  }
  return { tabla, metros: c, puntos: cN, detalle, porArista };
}

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const { construir, CRUDO } = require('./ruta');
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(56)} ${v}`);
  const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  const g = construir(ZONA_TERMINO);
  const crudo = osm.cargar(CRUDO);
  const tags = new Map();
  for (const w of osm.recortar(crudo.ways, ZONA_TERMINO)) tags.set(w.id, w.tags || {});
  const platDe = (wayId) => F.plataforma(tags.get(wayId));
  const idx = indexar(g.aristas);
  const capa = cargarCapa();

  log('='.repeat(110));
  log('B · LA ASIGNACIÓN — y las contrapruebas van DELANTE');
  log('='.repeat(110));
  di('capa municipal', `${capa.n} features · ${capa.lineas.length} líneas · sello ${capa.sello}`);
  di('regla', `radio ${RADIO} m · rumbo ≤${ANGULO}° · paso ${PASO} m · margen ${MARGEN} m`);

  // ── B4a · DESPLAZAMIENTO ──────────────────────────────────────────────────
  log('');
  log('B4a · ⭐⭐ CONTRAPRUEBA DE DESPLAZAMIENTO — la capa entera 2 km al este');
  log('   ⚠️ Y medida en LAS DOS unidades, la del resultado y la de las aristas. En la tanda');
  log('      18 esta misma contraprueba funcionaba perfectamente sobre la geometría');
  log('      equivocada (bitácora nº94): que se hunda no dice nada sobre QUÉ recorte mides.');
  const real = asignar(g, capa.lineas, platDe, { idx });
  const desplazadas = capa.lineas.map((l) => ({ p: l.p, pts: l.pts.map((q) => [q[0] + 2000, q[1]]) }));
  const desp = asignar(g, desplazadas, platDe, { idx });
  {
    const asigR = real.metros.univoca + real.metros.tipo + real.metros.margen;
    const asigD = desp.metros.univoca + desp.metros.tipo + desp.metros.margen;
    log('');
    log('   ' + 'unidad'.padEnd(34) + 'REAL'.padStart(20) + 'DESPLAZADA 2 km'.padStart(22) + 'razón'.padStart(9));
    log('   ' + 'metros municipales asignados'.padEnd(34) + `${km(asigR)} (${pct(asigR, real.metros.total)})`.padStart(20)
      + `${km(asigD)} (${pct(asigD, desp.metros.total)})`.padStart(22) + `×${(asigR / Math.max(1, asigD)).toFixed(1)}`.padStart(9));
    log('   ' + '⭐ ARISTAS del grafo asignadas'.padEnd(34) + String(real.tabla.size).padStart(20)
      + String(desp.tabla.size).padStart(22) + `×${(real.tabla.size / Math.max(1, desp.tabla.size)).toFixed(1)}`.padStart(9));
    A.exige(asigR > 3 * asigD, `la asignación no se hunde al desplazar la capa 2 km (${km(asigR)} contra ${km(asigD)}): mide densidad, no correspondencia`);
    A.exige(real.tabla.size > 3 * desp.tabla.size, `las aristas asignadas no se hunden al desplazar (${real.tabla.size} contra ${desp.tabla.size})`);

    // ═════════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ POST-HOC, Y VA DICHO: esto se escribe DESPUÉS de ver que el contador
    //      de ARISTAS no se hunde. ⛔ No se toca la regla ni el umbral. Lo que se
    //      hace es abrir el número, que es lo único honesto que queda.
    // ═════════════════════════════════════════════════════════════════════════
    log('');
    log('   ⚠️⚠️ LOS METROS SE HUNDEN ×3,5 PERO EL CONTADOR DE ARISTAS SOLO ×1,8. El guardián');
    log('      que declaré (×3 en aristas) se queda EN ROJO. ⛔ No muevo el umbral. Abro el');
    log('      número, que es lo único honesto: (post-hoc)');
    log('');
    log('   1 · ¿es el 2 km al este, o pasa en cualquier dirección?');
    log('      ' + 'desplazamiento'.padEnd(24) + 'metros asignados'.padStart(20) + 'aristas'.padStart(10) + 'razón aristas'.padStart(16));
    for (const [dx, dy, etq] of [[2000, 0, '2 km este'], [-2000, 0, '2 km oeste'],
      [0, 2000, '2 km norte'], [0, -2000, '2 km sur'], [5000, 0, '5 km este']]) {
      const d = asignar(g, capa.lineas.map((l) => ({ p: l.p, pts: l.pts.map((q) => [q[0] + dx, q[1] + dy]) })), platDe, { idx });
      const a = d.metros.univoca + d.metros.tipo + d.metros.margen;
      log('      ' + etq.padEnd(24) + `${km(a)} (${pct(a, d.metros.total)})`.padStart(20)
        + String(d.tabla.size).padStart(10) + `×${(real.tabla.size / Math.max(1, d.tabla.size)).toFixed(1)}`.padStart(16));
    }
    log('');
    log('   2 · ¿con cuánto APOYO queda cada arista asignada? — un contador de aristas no');
    log('      distingue «60 m de carril encima» de «un punto suelto de refilón».');
    {
      const sop = (r) => { const v = [...r.tabla.values()].map((x) => x.metrosTotal).sort((a, b) => a - b);
        return v.length ? { med: v[Math.floor(v.length / 2)], p90: v[Math.floor(v.length * 0.9)], n: v.length } : null; };
      const sR = sop(real), sD = sop(desp);
      log('      ' + 'metros municipales por arista asignada'.padEnd(44) + 'mediana'.padStart(10) + 'p90'.padStart(10));
      log('      ' + 'REAL'.padEnd(44) + km(sR.med).padStart(10) + km(sR.p90).padStart(10));
      log('      ' + 'DESPLAZADA 2 km'.padEnd(44) + km(sD.med).padStart(10) + km(sD.p90).padStart(10));
      log('      ⇒ ⭐ AHÍ ESTÁ: el desplazamiento produce muchas aristas con MIGAJAS encima.');
      log('        **El número de aristas asignadas no es una medida discriminante; los metros sí.**');
      log('        ⚠️ Y eso obliga a leer los contadores de C con cuidado: «cuántas aristas');
      log('        tienen ciclista» dice menos de lo que parece.');
    }
    log('');
    log('   3 · ¿de dónde salen las asignaciones de la capa desplazada? — clasificar antes de');
    log('      contar. Si son casi todas `univoca`, el culpable está identificado.');
    {
      const p = desp.puntos, t = desp.puntos.total;
      for (const k of ['univoca', 'tipo', 'margen', 'ambigua', 'sinCompatible', 'sinCandidata']) {
        log('      ' + k.padEnd(24) + String(p[k]).padStart(10) + pct(p[k], t).padStart(9));
      }
      log('      ⇒ ⚠️ LA REGLA ASIGNA EL CASO UNÍVOCO **SIN COMPROBAR LA COMPATIBILIDAD**, porque');
      log('        así la declaré. Una línea desplazada que cae sola al lado de cualquier calle');
      log('        se lleva esa arista aunque la plataforma no pegue ni con cola.');
      log('      ⛔ NO lo arreglo aquí: cambiar la regla después de ver la contraprueba es');
      log('        ajustar el instrumento al resultado. Lo que sí puedo es MEDIR la alternativa.');
    }
    log('');
    log('   4 · ⭐ LA ALTERNATIVA, MEDIDA Y **NO APLICADA**: exigir compatibilidad también en');
    log('      el caso unívoco. Va con su propia contraprueba de desplazamiento entera.');
    {
      const asignarEstricto = (lineas) => asignar(g, lineas, platDe, { idx, estricto: true });
      const rE = asignarEstricto(capa.lineas);
      const dE = asignarEstricto(capa.lineas.map((l) => ({ p: l.p, pts: l.pts.map((q) => [q[0] + 2000, q[1]]) })));
      const aR = rE.metros.univoca + rE.metros.tipo + rE.metros.margen;
      const aD = dE.metros.univoca + dE.metros.tipo + dE.metros.margen;
      log('      ' + 'regla'.padEnd(34) + 'metros'.padStart(14) + 'aristas'.padStart(10)
        + 'desplazada: metros'.padStart(20) + 'aristas'.padStart(10) + 'razón aristas'.padStart(15));
      log('      ' + 'DECLARADA (la que se aplica)'.padEnd(34) + km(asigR).padStart(14) + String(real.tabla.size).padStart(10)
        + km(asigD).padStart(20) + String(desp.tabla.size).padStart(10) + `×${(real.tabla.size / desp.tabla.size).toFixed(1)}`.padStart(15));
      log('      ' + '⭐ estricta (NO se aplica)'.padEnd(35) + km(aR).padStart(14) + String(rE.tabla.size).padStart(10)
        + km(aD).padStart(20) + String(dE.tabla.size).padStart(10) + `×${(rE.tabla.size / Math.max(1, dE.tabla.size)).toFixed(1)}`.padStart(15));
      log('      ⇒ decide Antonio. Aquí solo está medido.');
      global._ALT = { rE, dE };
    }
  }

  // ── B4b · IDENTIDAD ───────────────────────────────────────────────────────
  log('');
  log('B4b · ⭐⭐ CONTRAPRUEBAS DE IDENTIDAD — con el álgebra escrita antes (ley 51)');
  {
    const firma = (r) => [...r.tabla.entries()].map(([k, v]) => k + ':' + v.cic + ':' + v.cod).sort().join('|');
    const fReal = firma(real);

    // 1 · duplicar cada línea. ESPERADO: idéntico.
    const dup = capa.lineas.concat(capa.lineas.map((l) => ({ p: l.p, pts: l.pts.slice() })));
    const rDup = asignar(g, dup, platDe, { idx });
    const igualDup = firma(rDup) === fReal;
    di('   duplicar cada línea  (esperado: IDÉNTICO)', igualDup ? '✅ idéntico' : '⛔ CAMBIA — el método depende de cómo venga troceado');
    A.exige(igualDup, 'duplicar las líneas municipales cambia la asignación: el método depende del troceado del fichero');

    // 2 · partir cada línea por la mitad. ESPERADO: idéntico.
    const part = [];
    for (const l of capa.lineas) {
      if (l.pts.length < 3) { part.push(l); continue; }
      const m = Math.floor(l.pts.length / 2);
      part.push({ p: l.p, pts: l.pts.slice(0, m + 1) });
      part.push({ p: l.p, pts: l.pts.slice(m) });
    }
    const rPart = asignar(g, part, platDe, { idx });
    const igualPart = firma(rPart) === fReal;
    di('   partir cada línea en dos  (esperado: IDÉNTICO)', igualPart ? '✅ idéntico' : '⛔ CAMBIA');
    A.exige(igualPart, 'partir las líneas municipales cambia la asignación');

    // 3 · ⭐ intercambiar acera ↔ calzada. ESPERADO: TIENE QUE CAMBIAR.
    const trocado = capa.lineas.map((l) => {
      const t = String(l.p.tipo_carri || '');
      let nt = t;
      if (/acera/i.test(t)) nt = t.replace(/acera/i, 'calzada');
      else if (/calzada/i.test(t)) nt = t.replace(/calzada/i, 'acera');
      return { pts: l.pts, p: { ...l.p, tipo_carri: nt } };
    });
    const rTroc = asignar(g, trocado, platDe, { idx });
    const distintas = [...real.tabla.keys()].filter((k) => {
      const a = real.tabla.get(k), b = rTroc.tabla.get(k);
      return !b || b.cic !== a.cic;
    }).length;
    di('   ⭐ intercambiar acera↔calzada  (esperado: CAMBIA MUCHO)',
      `${distintas} aristas de ${real.tabla.size} cambian  (${pct(distintas, real.tabla.size)})`);
    A.exige(distintas > real.tabla.size * 0.2,
      `intercambiar acera↔calzada solo mueve ${pct(distintas, real.tabla.size)} de las aristas: el tipo_carri no está desempatando nada`);
  }

  // ── B4c · PATRÓN DE VERDAD ────────────────────────────────────────────────
  log('');
  log('B4c · ⭐⭐ PATRÓN DE VERDAD — la regla del 78,7 % aplicada al 21,3 % unívoco');
  log('   Los puntos que a 15 m tienen UNA sola candidata se reevalúan a 30 m, donde aparecen');
  log('   más. La regla completa tiene que recuperar el mismo way.');
  log('   ⚠️ ¿Puede fallar? Sí, y de la peor manera: si al abrir a 30 m no apareciera ningún');
  log('      candidato nuevo, la prueba sería VACÍA y saldría 100 %. ⇒ solo cuentan los puntos');
  log('      que de verdad pasaron a tener varias candidatas, y ese número se publica.');
  {
    const r15 = asignar(g, capa.lineas, platDe, { idx, conDetalle: true });
    const r30 = asignar(g, capa.lineas, platDe, { idx, radio: 30, conDetalle: true });
    // los detalles van en el MISMO orden: mismo recorrido, mismo muestreo
    A.exige(r15.detalle.length === r30.detalle.length, 'los dos muestreos no tienen el mismo número de puntos: no se pueden comparar uno a uno');
    let base = 0, seComplica = 0, acierta = 0, falla = 0, noOpina = 0;
    for (let i = 0; i < r15.detalle.length; i++) {
      const a = r15.detalle[i], b = r30.detalle[i];
      if (a.estado !== 'univoca') continue;
      base++;
      if (b.ways <= 1) continue;          // no se complicó: no cuenta
      seComplica++;
      if (b.estado === 'ambigua' || b.estado === 'sinCompatible') { noOpina++; continue; }
      if (b.elegido === a.elegido) acierta++; else falla++;
    }
    di('   puntos unívocos a 15 m (la verdad, fijada por la geometría)', base);
    di('   ⭐ …que a 30 m pasan a tener VARIAS candidatas', `${seComplica}  (${pct(seComplica, base)})`
      + (seComplica < base * 0.1 ? '  ⛔ la prueba está casi vacía' : ''));
    A.exige(seComplica > base * 0.1, `solo el ${pct(seComplica, base)} de los unívocos se complica a 30 m: la prueba es casi vacía`);
    di('   de ésos · ACIERTA el mismo way', `${acierta}  (${pct(acierta, seComplica)})`);
    di('   de ésos · FALLA', `${falla}  (${pct(falla, seComplica)})`);
    di('   de ésos · no opina (ambigua o sin compatible)', `${noOpina}  (${pct(noOpina, seComplica)})`);
    di('   ⭐⭐ ACIERTO CUANDO OPINA', `${acierta} de ${acierta + falla}  (${pct(acierta, acierta + falla)})`);
    global._B4c = { base, seComplica, acierta, falla, noOpina };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B3 · TRES RESULTADOS, NO DOS');
  log('='.repeat(110));
  {
    const m = real.metros, n = real.puntos;
    log('');
    log('   ' + 'resultado'.padEnd(34) + 'metros'.padStart(12) + '%'.padStart(9) + 'puntos'.padStart(10) + '%'.padStart(9));
    const fila = (etq, k) => log('   ' + etq.padEnd(34) + km(m[k]).padStart(12) + pct(m[k], m.total).padStart(9)
      + String(n[k]).padStart(10) + pct(n[k], n.total).padStart(9));
    fila('ASIGNADA · unívoca', 'univoca');
    fila('ASIGNADA · desempatada por tipo', 'tipo');
    fila('ASIGNADA · desempatada por margen', 'margen');
    fila('⛔ AMBIGUA · no se asigna', 'ambigua');
    fila('⛔ sin plataforma compatible', 'sinCompatible');
    fila('⛔ sin ninguna candidata a 15 m', 'sinCandidata');
    const asig = m.univoca + m.tipo + m.margen;
    log('   ' + '─'.repeat(74));
    di('⭐ ASIGNADAS en total', `${km(asig)}  (${pct(asig, m.total)})`);
    di('⭐ ARISTAS del grafo con `ciclista`', real.tabla.size);
    A.exige(real.metros.ambigua > 0,
      'la asignación no produce NI UNA ambigua, con 78,7 % de metros con varias candidatas: la regla está mal planteada');
  }

  // ── la sensibilidad del margen, que es mi mando ───────────────────────────
  log('');
  log('   ⚠️ EL MARGEN DE 5 m ES MÍO. Va su curva para que se vea de qué depende. ⛔ El número');
  log('      que vale es el de 5 m, fijado antes de mirar.');
  log('   ' + 'margen'.padEnd(14) + 'asignadas (m)'.padStart(16) + 'ambiguas (m)'.padStart(16) + 'aristas'.padStart(10));
  for (const mg of [0.5, 2, 5, 10, 1e9]) {
    const r = asignar(g, capa.lineas, platDe, { idx, margen: mg });
    const asig = r.metros.univoca + r.metros.tipo + r.metros.margen;
    log('   ' + (mg > 1e8 ? '∞ (sin margen)' : mg + ' m').padEnd(14) + km(asig).padStart(16)
      + km(r.metros.ambigua).padStart(16) + String(r.tabla.size).padStart(10)
      + (mg === MARGEN ? '   ⭐' : ''));
  }

  log('');
  log(A.cierre('ASIGNACIÓN MUNICIPAL → ARISTA'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { asignar, cargarCapa, indexar, COMPATIBLE, RADIO, ANGULO, PASO, MARGEN };
