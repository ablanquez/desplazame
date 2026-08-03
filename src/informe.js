// Los contadores del planarizado. Se imprimen SIEMPRE, salga bien o mal.
//
// ⭐ D2 no es una nota al pie: si el contador de `unido-por-defecto` no nace con el
//    planarizado, nadie lo añade después. El error aceptado a sabiendas tiene que
//    ser CONTABLE (ley 23).

'use strict';
const { construir, ZONA_CASCO, ZONA_TANDA3, contiene } = require('./ruta');

function percentiles(v) {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const p = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return { min: s[0], p25: p(0.25), mediana: p(0.5), p75: p(0.75), p90: p(0.9), max: s[s.length - 1] };
}

function informe(g) {
  const c = g.contadores;
  const L = [];
  const di = (k, v) => L.push(`   ${String(k).padEnd(42)} ${v}`);

  L.push('='.repeat(90));
  L.push('C1 · LA ZONA');
  di('sello del dato (timestamp_osm_base)', g.sello);
  di('bbox', `S ${g.zona.sur}  O ${g.zona.oeste}  N ${g.zona.norte}  E ${g.zona.este}`);
  di('superficie', `${g.areaKm2.toFixed(2)} km²`);
  di('ways de OSM dentro', c.waysEntrada);
  di('⭐ ¿contiene la ventana de la tanda 3?',
     contiene(g.zona, ZONA_TANDA3) ? 'SÍ — lo medido antes es comparable' : '⛔ NO — no se puede comparar');

  L.push('');
  L.push('C2 · EL PLANARIZADO');
  di('nodos OSM usados', c.nodosOsmUsados);
  di('  de ellos COMPARTIDOS por >=2 ways (D1·C1)', `${c.nodosCompartidos}  (${(100 * c.nodosCompartidos / c.nodosOsmUsados).toFixed(1)} %)`);
  di('particiones hechas (cortes internos)', c.particiones);
  di('nodos del grafo resultante', c.nodos);
  di('aristas del grafo resultante', c.aristas);
  di('  transitables a pie', `${g.aristasAPie}  (${(100 * g.aristasAPie / c.aristas).toFixed(1)} %)`);

  L.push('');
  L.push('C3 · LOS CONTADORES');
  di('cruces geométricos SIN nodo compartido', c.cortesGeometricos);
  di('  ⭐ UNIDOS POR DEFECTO (D2)', `${c.unidoPorDefecto}`);
  di('  NO unidos, por evidencia positiva (D1)', c.cortesNoConectados);
  for (const [m, n] of Object.entries(c.porMotivo).sort((a, b) => b[1] - a[1])) {
    di(`     · ${m}`, n);
  }
  const tot = c.cortesConectados + c.cortesNoConectados;
  di('  proporción unido-por-defecto', tot ? `${(100 * c.unidoPorDefecto / tot).toFixed(1)} % de los cruces geométricos` : 'n/a');
  L.push('');
  di('puntas soldadas por tolerancia (D5, ≤2,0 m)', c.puntasSoldadas);
  const pp = percentiles(c.distanciasPuntas);
  if (pp) di('  distancia de esas puntas', `min ${pp.min}  mediana ${pp.mediana}  p90 ${pp.p90}  max ${pp.max} m`);
  di('  puntas entre 2 y 5 m NO soldadas', `${c.puntasFueraDeTecho}   (se cuentan, no se tocan)`);

  L.push('');
  L.push('   D4 · reparto del campo de PRECISIÓN por arista:');
  const tp = Object.values(c.precision).reduce((a, b) => a + b, 0);
  for (const [k, n] of Object.entries(c.precision).sort((a, b) => b[1] - a[1])) {
    di(`     · ${k}`, `${String(n).padStart(6)}  (${(100 * n / tp).toFixed(1)} %)`);
  }

  L.push('');
  L.push('   COMPONENTES CONEXAS (solo aristas transitables a pie):');
  const t = [...g.comp.tamanos].sort((a, b) => b - a);
  di('componentes', g.comp.n);
  di('  la mayor', `${t[0]} nodos  (${(100 * t[0] / t.reduce((a, b) => a + b, 0)).toFixed(1)} % del total)`);
  di('  siguientes', t.slice(1, 9).join(', ') || '(ninguna más)');
  di('  con 1 solo nodo', t.filter((x) => x === 1).length);
  return L.join('\n');
}

if (require.main === module) {
  // ⛔ ANTES decía `construir()` a secas y se llevaba el casco por un valor por
  //    defecto. Aquí el casco es lo correcto —este informe compara contra la
  //    ventana de la tanda 3—, pero eso ahora está ESCRITO en vez de heredado.
  //    Comprobado: la salida es idéntica byte a byte antes y después del cambio.
  const g = construir(ZONA_CASCO);
  console.log(informe(g));
}
module.exports = { informe, percentiles };
