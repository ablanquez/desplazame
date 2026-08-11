// ⭐⭐⭐ TANDA DE ARREGLO 8 · LA PRUEBA DE «LAS DOS PUNTAS EN LA MISMA ARISTA»
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ VIGILA, Y POR QUÉ EXISTE
// ═════════════════════════════════════════════════════════════════════════════
//   `insertar` (`src/grafo.js`) mete cada punto de enganche como NODO TEMPORAL y
//   lo enlaza con los DOS EXTREMOS de su arista. Cuando las dos puntas de una
//   consulta caían en la MISMA arista, entre ellas no había enlace: el camino más
//   corto que el grafo sabía encontrar era **salir a la esquina y volver**.
//
//   No era un caso de laboratorio. Medido sobre el callejero real
//   (`tools/grafo/misma-arista.js`, 11/08/2026): **233.767 pares de direcciones
//   comparten arista**, sobre 7.192 aristas, con separación real p50 34,8 m.
//
// ⭐⭐⭐ ESTA PRUEBA NACIÓ ROJA Y SE VIO ROJA, con estos números en pantalla, ANTES
//    de tocar `src/grafo.js` (12/08/2026):
//
//        CALLE ALFONSO I 12 × 17         el motor    32,5 m   la verdad  11,9 m    2,7×
//        AVENIDA SAN JUAN BOSCO 5 × 3    el motor    41,4 m   la verdad  17,3 m    2,4×
//        AVENIDA MONTAÑANA 736 × 797     el motor 1.145,2 m   la verdad   4,5 m  256,4×
//
//    Sin haber visto el 32,5 antes, el 11,9 de después no demuestra nada (ley 62).
//
// ⚠️ POR QUÉ NO SE «DECLARA» EN VEZ DE ARREGLARSE, que era la otra salida: el
//    veredicto por acera se declara porque **el grafo no tiene el dato** —las dos
//    aceras no están dibujadas—. Aquí el dato SÍ está: las dos direcciones caen en
//    la misma arista, con su posición conocida sobre ella, y la distancia es una
//    resta. **Decir «no sé andar entre ellas» sería mentir sobre lo que se sabe.**
//
//   node src/probar-misma-arista.js

'use strict';
const A = require('./alarma');
const G = require('./grafo');
const D = require('./direccion');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

const log = console.log;
const di = (k, v) => log('   ' + String(k).padEnd(52) + ' ' + v);
const raya = (c = '=') => log(c.repeat(100));

/** Lo que se acepta como «igual». `res.metros` llega redondeado a un decimal,
 *  así que 5 cm es lo más estrecho que se puede exigir sin mentir. */
const TOLERANCIA_M = 0.05;

// ═════════════════════════════════════════════════════════════════════════════
// LOS TRES CASOS, Y DE DÓNDE SALE CADA UNO — la procedencia importa
// ═════════════════════════════════════════════════════════════════════════════
//   · Los dos primeros vienen de la **muestra CIEGA** de `tools/grafo/misma-arista.js`:
//     los primeros pares por índice de arista. ⛔ No se eligieron por su resultado;
//     el criterio se fijó antes de mirar ninguno.
//   · ⭐⭐ EL TERCERO SE ELIGIÓ MIRANDO EL RESULTADO, y se dice en vez de disimularlo:
//     es **el par de los 233.767 con MAYOR inflación**, buscado a propósito. No es
//     una muestra: es el TECHO del universo — si el arreglo resuelve el peor caso
//     que existe, los de en medio no pueden salir peor.
//     ⛔ Y por eso NO sustituye a los otros dos, que son los que valen como muestra.
//     ⚠️ Su forma explica el 254×: `AVENIDA MONTAÑANA` es un eje de calzada de
//     1.164,6 m sin partir, y los dos portales caen a 4,5 m uno del otro cerca de
//     su punto medio. Salir a la esquina y volver era recorrer la avenida entera.
const CASOS = [
  { via: 'CALLE ALFONSO I', a: '12', b: '17', antes: 32.5, origen: 'muestra ciega' },
  { via: 'AVENIDA SAN JUAN BOSCO', a: '5', b: '3', antes: 41.4, origen: 'muestra ciega' },
  { via: 'AVENIDA MONTAÑANA', a: '736', b: '797', antes: 1145.2, origen: '⭐ el PEOR de los 233.767' },
];

/**
 * La distancia andando POR la arista desde su origen hasta el punto `p`.
 * ⚠️ Está escrita AQUÍ a propósito, aunque `grafo.js` tenga la suya: si la prueba
 *    pidiera la verdad al mismo código que está juzgando, comprobaría que el
 *    módulo coincide consigo mismo (ley 96, circularidad). **La verdad de una
 *    prueba no puede salir del acusado.**
 */
function alLargo(e, p) {
  let a = 0;
  for (let k = 0; k < p.seg; k++) {
    a += Math.hypot(e.pts[k + 1][0] - e.pts[k][0], e.pts[k + 1][1] - e.pts[k][1]);
  }
  return a + p.t * Math.hypot(e.pts[p.seg + 1][0] - e.pts[p.seg][0],
    e.pts[p.seg + 1][1] - e.pts[p.seg][1]);
}

raya();
log('LA PRUEBA DE «LAS DOS PUNTAS EN LA MISMA ARISTA» — nació roja el 12/08/2026');
raya();

const g = construir(ZONA_TERMINO);
const ctx = D.abrir(g, CRUDO);
di('grafo', 'construir(ZONA_TERMINO) — el mismo que usa el motor');
di('aristas · portales enganchados', g.aristas.length + ' · ' + ctx.enganche.contadores.enganchados);
di('tolerancia', TOLERANCIA_M + ' m   (res.metros llega redondeado a 0,1 m)');

/** Los dos portales del caso, EXIGIENDO que compartan arista. */
function parDe(c) {
  const de = (n) => ctx.enganche.portales.filter((o) => o.enganchado
    && o.via && o.via.nombre === c.via && String(o.numero) === n);
  const as = de(c.a), bs = de(c.b);
  for (const x of as) for (const y of bs) if (x.arista === y.arista) return { x, y };
  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('T1 · LOS TRES CASOS — el motor contra la verdad por la arista');
raya('─');
log('   ' + 'caso'.padEnd(34) + 'arista'.padStart(8) + 'el motor'.padStart(12)
  + 'la verdad'.padStart(11) + 'infla'.padStart(10) + 'factor'.padStart(9) + '   veredicto');

for (const c of CASOS) {
  const etiq = (c.via + ' ' + c.a + ' × ' + c.b).slice(0, 33);
  const p = parDe(c);
  // ⛔ QUE EL CASO EXISTA ES PARTE DE LA PRUEBA. Si el callejero o el grafo se
  //    movieran y estos dos portales dejaran de compartir arista, esta prueba
  //    estaría pasando sobre nada — que es la forma barata de un guardián muerto.
  if (!A.exige(!!p, `el caso ${c.via} ${c.a}×${c.b} ya no existe: los dos portales no comparten arista`)) {
    log('   ' + etiq.padEnd(34) + '   ⛔ EL CASO HA DESAPARECIDO — la prueba no vigila nada');
    continue;
  }
  const e = g.aristas[p.x.arista];
  const verdad = Math.abs(alLargo(e, p.x) - alLargo(e, p.y));
  const r = G.rutaEntre(g, p.x, p.y);
  const ok = r.encontrada && Math.abs(r.metros - verdad) <= TOLERANCIA_M;
  log('   ' + etiq.padEnd(34) + String(p.x.arista).padStart(8)
    + (r.encontrada ? r.metros.toFixed(1) + ' m' : '—').padStart(12)
    + (verdad.toFixed(1) + ' m').padStart(11)
    + (r.encontrada ? (r.metros - verdad >= 0 ? '+' : '') + (r.metros - verdad).toFixed(1) + ' m' : '—').padStart(10)
    + (r.encontrada && verdad > 0.001 ? (r.metros / verdad).toFixed(1) + '×' : '—').padStart(9)
    + (ok ? '   ✅' : '   ⛔ SALE A LA ESQUINA Y VUELVE'));
  A.exige(ok, `${c.via} ${c.a}×${c.b}: el motor da ${r.encontrada ? r.metros : 'SIN CAMINO'} m `
    + `y por la arista son ${verdad.toFixed(1)} m  (antes del arreglo daba ${c.antes})`);

  // ── ⭐ EL TERCER CAMINO (ley 149) — la verdad medida de otra forma ──────────
  //   Si los dos enganches caen en el MISMO segmento de la polilínea, la distancia
  //   por la arista y la distancia en línea recta entre sus dos proyecciones son
  //   la misma cosa, porque un segmento es recto. Es aritmética distinta —Pitágoras
  //   sobre `q`, no suma de tramos— y sirve de contraste independiente.
  //   ⚠️ Si caen en segmentos distintos, la recta es una COTA INFERIOR y solo se
  //     puede exigir eso. Se dice cuál de los dos casos es.
  const recta = Math.hypot(p.x.q[0] - p.y.q[0], p.x.q[1] - p.y.q[1]);
  const mismoSeg = p.x.seg === p.y.seg;
  log('        tercer camino: recta entre las dos proyecciones ' + recta.toFixed(2) + ' m'
    + (mismoSeg ? '   ⇒ mismo segmento: tiene que COINCIDIR' : '   ⇒ segmentos distintos: solo COTA INFERIOR'));
  A.exige(mismoSeg ? Math.abs(recta - verdad) < 0.01 : recta <= verdad + 0.01,
    `${c.via} ${c.a}×${c.b}: la verdad por la arista (${verdad.toFixed(2)}) no cuadra con `
    + `la recta entre proyecciones (${recta.toFixed(2)})`);

  // ── el mismo par AL REVÉS ──────────────────────────────────────────────────
  // ⚠️ El grafo NO es dirigido (`src/grafo.js:25-26`): `adyacencia` mete las dos
  //    direcciones con el mismo peso. Así que A→B y B→A tienen que dar EXACTAMENTE
  //    lo mismo. Si el arreglo dependiera del ORDEN DE INSERCIÓN, aquí saldría — y
  //    sería un fallo nuevo, no el que se venía a arreglar.
  const rv = G.rutaEntre(g, p.y, p.x);
  const simetrico = rv.encontrada && r.encontrada && Math.abs(rv.metros - r.metros) < 0.001;
  log('        A→B ' + (r.encontrada ? r.metros.toFixed(1) : '—') + ' m   ·   B→A '
    + (rv.encontrada ? rv.metros.toFixed(1) : '—') + ' m' + (simetrico ? '   ✅ idénticos' : '   ⛔ DIFIEREN'));
  A.exige(simetrico, `${c.via} ${c.a}×${c.b}: A→B da ${r.metros} m y B→A da ${rv.metros} m`);
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
raya('─');
log('T2 · ⭐ TRES PUNTOS EN LA MISMA ARISTA — el caso que `rutaEntre` no llega a ver');
raya('─');
log('   `rutaEntre` inserta DOS puntos. Pero `insertar` es público y `src/puerta.js`');
log('   mete hasta 25 en la misma consulta (`rutaAEdificio`). Si el arreglo viviera');
log('   en `rutaEntre`, ese camino se quedaría sin él y nadie lo notaría.');
{
  const p0 = parDe(CASOS[0]);
  if (!A.exige(!!p0, 'sin el primer caso no se puede montar el de tres puntos')) {
    log('   ⛔ no se puede ejecutar');
  } else {
    const ia = p0.x.arista;
    const e = g.aristas[ia];
    const nodos = g.nodos.slice();
    const ady = g.ady.map((l) => l.slice());
    // tres fracciones DECLARADAS del primer segmento de la arista
    const F = [0.15, 0.45, 0.80];
    const puntos = F.map((t) => ({
      arista: ia, seg: 0, t,
      q: [e.pts[0][0] + t * (e.pts[1][0] - e.pts[0][0]),
        e.pts[0][1] + t * (e.pts[1][1] - e.pts[0][1])],
    }));
    di('arista · fracciones', ia + ' · ' + F.join(' · '));
    const ids = puntos.map((p) => G.insertar(g.aristas, ady, nodos, p));
    log('   ' + 'par'.padEnd(10) + 'el grafo'.padStart(11) + 'la verdad'.padStart(11)
      + 'infla'.padStart(10) + '   veredicto');
    for (let i = 0; i < ids.length; i++) {
      const r = G.dijkstra(ady, ids[i]);
      for (let j = i + 1; j < ids.length; j++) {
        const verdad = Math.abs(alLargo(e, puntos[i]) - alLargo(e, puntos[j]));
        const dado = r.dist[ids[j]];
        const ok = Number.isFinite(dado) && Math.abs(dado - verdad) <= TOLERANCIA_M;
        log('   ' + ((i + 1) + '→' + (j + 1)).padEnd(10)
          + (Number.isFinite(dado) ? dado.toFixed(1) + ' m' : '—').padStart(11)
          + (verdad.toFixed(1) + ' m').padStart(11)
          + (Number.isFinite(dado) ? (dado - verdad >= 0 ? '+' : '') + (dado - verdad).toFixed(1) + ' m' : '—').padStart(10)
          + (ok ? '   ✅' : '   ⛔'));
        A.exige(ok, `tres puntos en la arista ${ia}: de ${i + 1} a ${j + 1} el grafo da `
          + `${Number.isFinite(dado) ? dado.toFixed(1) : 'infinito'} m y la verdad es ${verdad.toFixed(1)} m`);
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LEY 152 AL REVÉS: aquí hace falta comprobar que el arreglo NO actúa donde no
//    le toca. Un arreglo que acortara TODO también pasaría las pruebas de arriba.
log('');
raya('─');
log('T3 · ⭐⭐ EL CONTROL — dos puntas en aristas DISTINTAS no pueden inventarse un atajo');
raya('─');
{
  const p = parDe(CASOS[0]);
  if (!p) {
    log('   ⛔ sin el primer caso no hay control');
  } else {
    const e = g.aristas[p.x.arista];
    const vecina = g.ady[e.b].find((v) => v.e !== p.x.arista);
    if (!A.exige(!!vecina, 'no hay ninguna arista vecina: el control no se puede montar')) {
      log('   ⛔ sin control');
    } else {
      const e2 = g.aristas[vecina.e];
      const otro = { arista: vecina.e, seg: 0, t: 0.5,
        q: [(e2.pts[0][0] + e2.pts[1][0]) / 2, (e2.pts[0][1] + e2.pts[1][1]) / 2] };
      const r = G.rutaEntre(g, p.x, otro);
      const enLinea = Math.hypot(p.x.q[0] - otro.q[0], p.x.q[1] - otro.q[1]);
      di('aristas de las dos puntas', p.x.arista + ' y ' + vecina.e + '   ⇒ DISTINTAS');
      di('el motor · la línea recta', (r.encontrada ? r.metros.toFixed(1) : '—') + ' m · ' + enLinea.toFixed(1) + ' m');
      const sano = r.encontrada && r.metros >= enLinea - TOLERANCIA_M;
      A.exige(sano, `el control de aristas distintas da ${r.metros} m con una recta de `
        + `${enLinea.toFixed(1)} m: ninguna ruta puede ser más corta que la recta`);
      di('⇒', sano ? '✅ sigue siendo un camino de verdad, no un atajo inventado'
        : '⛔⛔ EL ARREGLO HA INVENTADO UN ATAJO');
    }
  }
}

log('');
raya();
log(A.cierre('LAS DOS PUNTAS EN LA MISMA ARISTA'));
