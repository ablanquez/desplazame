// ⭐⭐⭐ EL VEREDICTO POR ENLACE — y ataca la tesis del hito de frente.
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE, Y POR QUÉ AHORA
// ═════════════════════════════════════════════════════════════════════════════
//   La tesis de H2a es: *los routers sin grafo peatonal resuelven el transbordo
//   con un radio a vuelo de pájaro, y por eso mandan a cruzar una autovía;
//   nosotros lo calculamos ANDANDO.*
//
//   ⛔ Pero H2·5 midió que **456 de 984 paradas (46,3 %) enganchan al EJE DE LA
//     CALZADA**, donde OSM no ha dibujado la acera. **Y el eje de la calzada NO
//     TIENE DOS LADOS.** Un enlace que salga de ahí atraviesa la calle sin que
//     nada lo registre: no es que el instrumento se equivoque, es que **su modelo
//     no representa el cruce** (ley 150).
//
//   ⇒ Si medio itinerario va por el eje, el cálculo andando produce el MISMO
//     error que el radio — solo que firmado con metros y con pinta de exacto.
//     **Un error con decimales es peor que un error redondo: se cree más.**
//
// ═════════════════════════════════════════════════════════════════════════════
// LOS CUATRO VEREDICTOS, Y POR QUÉ SON CUATRO Y NO DOS
// ═════════════════════════════════════════════════════════════════════════════
//   El encargo pedía dos —`ACERA` y `EJE`— y dejaba proponer un tercero. Hacen
//   falta DOS más, y los dos salen de que el grafo puede no poder contestar:
//
//     ACERA          las dos puntas en acera/peatonal/paso Y ni una arista del
//                    camino es eje de calzada.  ⇒ el enlace se anda por sitios
//                    donde el mapa distingue los dos lados.
//     EJE            alguna punta o algún tramo va por eje de calzada.
//                    ⇒ el enlace PUEDE estar cruzando y no hay forma de saberlo.
//     SIN CAMINO     las dos paradas están en componentes distintas del grafo.
//                    ⛔ Es un RESULTADO, no un fallo: hay barrios incomunicados
//                    de verdad. H2·5 encontró 3 paradas fuera de la mayor.
//     ⭐ MISMA ARISTA las dos paradas enganchan a LA MISMA arista del grafo.
//                    ⛔ Y aquí pasan DOS cosas a la vez, las dos malas:
//                      1 · si esa arista es un eje, las dos paradas están «en la
//                        misma calle» para el grafo aunque en la calle haya una
//                        calzada entre ellas. El cruce no existe en el modelo.
//                      2 · ⛔⛔ y el METRAJE ES FALSO, medido: `rutaEntre` inserta
//                        DOS nodos temporales que **no se enlazan entre sí**
//                        (`src/grafo.js:227-228`), así que el camino tiene que
//                        salir a un extremo de la arista y volver. Medido sobre
//                        los 16 casos reales: mediana **+49,0 m**, máximo
//                        **+75,9 m**, y hasta **26,4×** (3,0 m reales servidos
//                        como 78,9 m).
//
//   ⚠️ Este cuarto valor NACIÓ MAL. Se definió como «MISMO PUNTO, camino < 1 m»,
//      y esa condición **no puede ocurrir nunca** por lo que se acaba de contar:
//      una parada contra SÍ MISMA da 15,70 m. Era un valor inalcanzable, o sea
//      una promesa. Se cambió por el que SÍ es detectable y SÍ es el caso real.
//      Ver bitácora.
//
//   ⚠️ Y es la ley 150 en su forma más pura: el modelo no representa la
//      diferencia, así que el instrumento **no puede** ponerse rojo sobre ella.
//      Lo único honesto es tener un valor que diga «aquí no sé».
//
// ⛔ ESTO NO CALCULA LOS 2.538 ENLACES. Corre sobre una MUESTRA declarada.
//
//   node tools/grafo/veredicto-enlace.js [--muestra N]

'use strict';

const A = require('../../src/alarma');
const R = require('../../src/ruta');
const G = require('../../src/grafo');
const { cargar } = require('../gtfs/feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));

/** Las clases de arista que NO distinguen los dos lados de la calle. */
const ES_EJE = new Set(['eje-de-calzada', 'eje-con-acera-declarada']);

/** El radio del pre-filtro, de §4 del diseño. */
const RADIO_M = 300;

/**
 * ⭐ La distancia REAL entre dos enganches de la misma arista, andando POR la
 *    arista. Es lo que `rutaEntre` no puede dar, y se calcula igual que
 *    `insertar` calcula su `antes` (`src/grafo.js:204-206`).
 * ⛔ NO se usa para corregir el metraje: se usa para MEDIR cuánto se infla. El
 *    arreglo, si lo hay, es de H1 y no de esta tanda.
 */
function alLargoDeLaArista(e, p) {
  let a = 0;
  for (let k = 0; k < p.seg; k++) {
    a += Math.hypot(e.pts[k + 1][0] - e.pts[k][0], e.pts[k + 1][1] - e.pts[k][1]);
  }
  a += p.t * Math.hypot(e.pts[p.seg + 1][0] - e.pts[p.seg][0], e.pts[p.seg + 1][1] - e.pts[p.seg][1]);
  return a;
}

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? Number(process.argv[i + 1]) : d;
};
const TAM_MUESTRA = arg('--muestra', 300);

const R_TIERRA = 6371000;
const RAD = Math.PI / 180;
const recta = (a, b) => {
  const x = (b.lon - a.lon) * RAD * Math.cos((a.lat + b.lat) / 2 * RAD);
  const y = (b.lat - a.lat) * RAD;
  return Math.hypot(x, y) * R_TIERRA;
};

raya();
log('EL VEREDICTO POR ENLACE — definido aquí, probado sobre una MUESTRA');
raya();

const g = R.construir(R.ZONA_TERMINO);
const comp = g.comp.comp;

const { stops, modo, lineasDe } = cargar();
const P = stops.filter((s) => modo.get(s.stop_id) === 'bus').map((s) => ({
  id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
  lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
  lineas: lineasDe.get(s.stop_id) || new Set(),
}));

// ⭐ el enganche de cada parada, UNA vez. Es el mismo `engancharPunto` del motor.
for (const p of P) {
  const e = R.engancharPunto(g, p.lat, p.lon, 'parada');
  p.eng = e;
  p.precision = g.aristas[e.arista].precision;
  p.comp = comp[g.aristas[e.arista].a];
}

// ── los pares candidatos, con el mismo criterio de `pares-candidatos.js` ─────
const pares = [];
for (let i = 0; i < P.length; i++) {
  for (let j = i + 1; j < P.length; j++) {
    if (recta(P[i], P[j]) > RADIO_M) continue;
    let aporta = false;
    for (const x of P[j].lineas) if (!P[i].lineas.has(x)) { aporta = true; break; }
    if (!aporta) for (const x of P[i].lineas) if (!P[j].lineas.has(x)) { aporta = true; break; }
    if (aporta) pares.push([i, j]);
  }
}
log('   paradas de bus ........................... ' + P.length);
log('   pares candidatos (bus×bus, ≤' + RADIO_M + ' m, con línea nueva) ... ' + pares.length);

// ⭐⭐ LA MUESTRA, Y SU CRITERIO — declarado, determinista y NO aleatorio.
//   Se toma 1 de cada K recorriendo la lista en el orden en que salen los pares,
//   que es el orden de `stops.txt`. ⛔ No se eligen «los interesantes»: elegir la
//   muestra mirando el resultado es fabricar el resultado.
const K = Math.max(1, Math.floor(pares.length / TAM_MUESTRA));
const muestra = pares.filter((_, i) => i % K === 0);
log('   ⭐ muestra: 1 de cada ' + K + ' ⇒ ' + muestra.length + ' pares');
log('      criterio: determinista, sobre el orden de stops.txt. NO aleatoria y NO elegida.');

// ── el veredicto ─────────────────────────────────────────────────────────────
function veredicto(a, b) {
  if (a.comp !== b.comp) return { v: 'SIN CAMINO', metros: null, ejes: 0, total: 0 };
  const r = G.rutaEntre(g, a.eng, b.eng);
  if (!r || !r.encontrada) return { v: 'SIN CAMINO', metros: null, ejes: 0, total: 0 };
  if (a.eng.arista === b.eng.arista) {
    const e = g.aristas[a.eng.arista];
    const verdad = Math.abs(alLargoDeLaArista(e, a.eng) - alLargoDeLaArista(e, b.eng));
    return { v: 'MISMA ARISTA', metros: r.metros, verdad, infla: r.metros - verdad,
      ejes: 0, total: r.aristas.length, precision: e.precision };
  }
  const puntasEje = ES_EJE.has(a.precision) || ES_EJE.has(b.precision);
  let ejes = 0;
  for (const ia of r.aristas) if (ES_EJE.has(g.aristas[ia].precision)) ejes++;
  const v = (puntasEje || ejes > 0) ? 'EJE' : 'ACERA';
  return { v, metros: r.metros, ejes, total: r.aristas.length, puntasEje };
}

const res = [];
for (const [i, j] of muestra) res.push({ a: P[i], b: P[j], ...veredicto(P[i], P[j]) });

// ── el reparto ───────────────────────────────────────────────────────────────
const cuenta = {};
for (const r of res) cuenta[r.v] = (cuenta[r.v] || 0) + 1;
log('');
raya();
log('EL REPARTO MEDIDO');
raya();
for (const k of ['ACERA', 'EJE', 'SIN CAMINO', 'MISMA ARISTA']) {
  const n = cuenta[k] || 0;
  log('   ' + k.padEnd(14) + String(n).padStart(6) + '   '
    + (100 * n / res.length).toFixed(1).padStart(6) + ' %');
}

// ⭐ el desglose del EJE: ¿es por las puntas o por el camino? No es lo mismo.
const ejes = res.filter((r) => r.v === 'EJE');
const soloCamino = ejes.filter((r) => !r.puntasEje);
log('');
log('   ⭐ de los EJE, por qué lo son:');
log('      alguna PUNTA en eje ................... ' + (ejes.length - soloCamino.length));
log('      ⚠️ puntas en acera y el CAMINO se mete . ' + soloCamino.length);
log('         ⇒ esos NO se pueden ver mirando solo las paradas. Es lo que justifica');
log('           que el veredicto sea del ENLACE y no de la parada.');

// ⭐ distribución de la fracción de camino que va por eje. Distribución, no media.
const frac = res.filter((r) => r.total > 0 && r.v !== 'SIN CAMINO')
  .map((r) => r.ejes / r.total).sort((a, b) => a - b);
const pc = (q) => (100 * frac[Math.min(frac.length - 1, Math.floor(frac.length * q))]).toFixed(0) + ' %';
log('');
log('   ⭐ fracción de ARISTAS del camino que son eje de calzada:');
log('      p10 ' + pc(0.10) + ' · p25 ' + pc(0.25) + ' · p50 ' + pc(0.50)
  + ' · p75 ' + pc(0.75) + ' · p90 ' + pc(0.90));
const puros0 = frac.filter((x) => x === 0).length;
const puros1 = frac.filter((x) => x === 1).length;
log('      caminos SIN ni una arista de eje ...... ' + puros0 + ' de ' + frac.length);
log('      caminos ENTEROS por eje ............... ' + puros1 + ' de ' + frac.length);
log('      ⇒ ' + (100 * (puros0 + puros1) / frac.length).toFixed(0)
  + ' % de los caminos son PUROS (todo o nada) ⇒ '
  + ((puros0 + puros1) / frac.length > 0.5 ? 'reparto BIMODAL' : 'reparto MEZCLADO'));

// ── ⭐⭐⭐ EL CASO LÍMITE, Y NO ERA EL QUE H2·5 CREÍA ─────────────────────────
const mismaAr = res.filter((r) => r.v === 'MISMA ARISTA');
log('');
raya();
log('⭐⭐⭐ LAS DOS PUNTAS EN LA MISMA ARISTA — y el metraje que sirve el motor');
raya();
log('   encontrados .............................. ' + mismaAr.length + ' de ' + res.length);
log('');
log('   el motor   la verdad   se infla   el par');
for (const r of mismaAr.slice(0, 10)) {
  log('   ' + r.metros.toFixed(1).padStart(7) + ' m' + r.verdad.toFixed(1).padStart(11) + ' m'
    + ('+' + r.infla.toFixed(1)).padStart(10) + ' m   "' + r.a.code + '" ' + r.a.nombre.slice(0, 22)
    + ' × "' + r.b.code + '" ' + r.b.nombre.slice(0, 22));
}
log('');
log('   ⛔ H2·5 avisó de «dos andenes enfrentados colapsan y el enlace mide 0 m».');
log('     Medido: NO PASA. `rutaEntre` inserta dos nodos temporales que no se');
log('     enlazan entre sí, así que el camino sale a un extremo de la arista y');
log('     vuelve. Una parada contra SÍ MISMA da 15,70 m, no 0.');
log('   ⇒ ⭐ El peligro no era un cero: es un número CORTO, CREÍBLE y MAYOR que la');
log('     verdad. Y un error con decimales se cree más que uno redondo.');

// ── ⭐⭐⭐ EL CRUCE INVISIBLE — el caso límite de verdad, y NO es el de 0 metros
// ⚠️ H2·5 avisó de «dos andenes enfrentados colapsan al mismo nodo ⇒ 0 m». Medido,
//    no pasa: `engancharPunto` proyecta sobre la arista, así que dos andenes
//    enfrentados caen en el MISMO eje pero en puntos distintos, y el camino sale
//    de ~10-20 m ANDANDO A LO LARGO DEL EJE.
// ⛔ Y eso es PEOR que un 0, porque tiene pinta de medida buena: dice «15 m» y en
//    la calle hay una calzada en medio que el grafo no representa.
const CRUCE_INVISIBLE_M = 40;
const invisibles = res.filter((r) => r.v === 'EJE' && r.metros !== null
  && r.metros < CRUCE_INVISIBLE_M && r.total > 0 && r.ejes === r.total);
log('');
raya();
log('⭐⭐⭐ EL CRUCE INVISIBLE — enlaces CORTOS y ENTEROS por eje de calzada');
raya();
log('   enlaces por debajo de ' + CRUCE_INVISIBLE_M + ' m con el camino 100 % eje ... '
  + invisibles.length + ' de ' + res.length
  + '   (' + (100 * invisibles.length / res.length).toFixed(1) + ' %)');
for (const r of invisibles.slice(0, 12)) {
  log('      ' + r.metros.toFixed(1).padStart(6) + ' m   "' + r.a.code + '" ' + r.a.nombre.slice(0, 28)
    + '   ×   "' + r.b.code + '" ' + r.b.nombre.slice(0, 28));
}
log('');
log('   ⛔ Estos son los que la tesis del hito no puede presumir de resolver: el');
log('     motor contesta un número corto y correcto PARA SU GRAFO, y el grafo no');
log('     sabe que ahí se cruza. Un radio a vuelo de pájaro daría lo mismo.');

log('');
raya();
log('⭐⭐ UN TERCER CAMINO PARA UNA CIFRA — reproducir no es verificar (ley 149)');
raya();
// La fracción de aristas-eje del conjunto de caminos se puede obtener de dos
// formas independientes: sumando por enlace (arriba) o contando aristas sueltas.
let sumaEjes = 0; let sumaTotal = 0;
for (const r of res) { sumaEjes += r.ejes; sumaTotal += r.total; }
const global = sumaEjes / sumaTotal;
const mediaDeFracciones = frac.reduce((s, x) => s + x, 0) / frac.length;
log('   fracción GLOBAL (todas las aristas juntas) ..... ' + (100 * global).toFixed(1) + ' %');
log('   media de las fracciones POR ENLACE ............. ' + (100 * mediaDeFracciones).toFixed(1) + ' %');
log('   ⇒ son medidas DISTINTAS y no tienen por qué coincidir: la primera pesa por');
log('     longitud de camino, la segunda da a cada enlace el mismo voto.');
log('   ⭐ lo que SÍ tiene que cumplirse: las dos entre 0 y 1, y el mismo lado del 50 %');
A.exige(global >= 0 && global <= 1 && mediaDeFracciones >= 0 && mediaDeFracciones <= 1,
  'alguna de las dos fracciones se sale de [0,1]: hay un recuento de aristas mal.');

// ⭐ y el positivo de control del veredicto: TIENE que saber decir ACERA y EJE.
log('');
log('   ⭐ POSITIVO DE CONTROL DEL VEREDICTO (ley 4):');
log('      ¿sabe decir ACERA? ....... ' + ((cuenta.ACERA || 0) > 0 ? '✅ ' + cuenta.ACERA : '⛔ NUNCA'));
log('      ¿sabe decir EJE? ......... ' + ((cuenta.EJE || 0) > 0 ? '✅ ' + cuenta.EJE : '⛔ NUNCA'));
A.exige((cuenta.ACERA || 0) > 0 && (cuenta.EJE || 0) > 0,
  'el veredicto solo emite un valor: un clasificador que nunca dice una de sus clases es '
  + 'indistinguible de uno que no clasifica.');

// ── ⭐⭐⭐ LA CONTRAPRUEBA: los CUATRO veredictos tienen que poder salir ───────
// ⛔ Sobre la muestra solo se han visto dos —ACERA y EJE—. Un clasificador con
//    cuatro valores del que solo se han observado dos tiene DOS PROMESAS dentro.
//    Aquí se provocan los otros dos a propósito, con casos elegidos para eso.
log('');
raya();
log('⭐⭐⭐ CONTRAPRUEBA — provocar los DOS veredictos que la muestra no ha visto');
raya();

// SIN CAMINO · H2·5 midió tres paradas fuera de la componente mayor.
const fuera = P.filter((p) => p.comp !== comp[g.aristas[P[0].eng.arista].a]
  && P.some((q) => q.comp !== p.comp));
const aislada = P.find((p) => {
  const otras = P.filter((q) => q.comp !== p.comp);
  return otras.length > 0 && P.filter((q) => q.comp === p.comp).length < 20;
});
const central = P.find((p) => p.comp !== aislada.comp);
const vSin = veredicto(aislada, central);
log('   SIN CAMINO — "' + aislada.code + '" ' + aislada.nombre.slice(0, 26)
  + ' (comp ' + aislada.comp + ')');
log('                × "' + central.code + '" ' + central.nombre.slice(0, 26)
  + ' (comp ' + central.comp + ')');
log('                ⇒ ' + vSin.v + (vSin.v === 'SIN CAMINO' ? '   ✅ visto' : '   ⛔ NO SALE'));
A.exige(vSin.v === 'SIN CAMINO',
  'el veredicto SIN CAMINO no se puede provocar ni con dos paradas de componentes distintas: '
  + 'es un valor que el clasificador declara y no sabe emitir.');

// MISMA ARISTA · una parada contra SÍ MISMA es el caso extremo: enganche idéntico.
// ⭐ Y de paso deja a la vista lo que el motor hace con él.
const vMismo = veredicto(P[0], P[0]);
log('   MISMA ARISTA — "' + P[0].code + '" ' + P[0].nombre.slice(0, 26) + ' contra SÍ MISMA');
log('                ⇒ ' + vMismo.v + '   el motor dice ' + vMismo.metros.toFixed(2)
  + ' m · la verdad es ' + vMismo.verdad.toFixed(2) + ' m'
  + (vMismo.v === 'MISMA ARISTA' ? '   ✅ visto' : '   ⛔ NO SALE'));
A.exige(vMismo.v === 'MISMA ARISTA',
  'el veredicto MISMA ARISTA no sale ni con una parada contra sí misma. Si ese caso no lo '
  + 'produce, no lo produce nada, y el valor sobra de la definición.');
A.exige(vMismo.verdad < 0.01,
  'una parada contra sí misma debería dar 0 m de distancia real a lo largo de la arista.');
log('                ⛔ y ahí está el defecto en su forma más pura: la verdad es CERO');
log('                  y el motor sirve ' + vMismo.metros.toFixed(2) + ' m. Ver bitácora.');

log('');
log('   ⇒ ⭐ los CUATRO valores se han visto salir. Ninguno es una promesa.');
log('   ⚠️ Con su matiz honesto: ACERA y EJE salieron SOLOS sobre la muestra;');
log('     SIN CAMINO y MISMA ARISTA hubo que ir a buscarlos. Que existan no dice');
log('     nada de su frecuencia — dice que el clasificador sabe emitirlos.');

log('');
raya();
log(A.cierre('EL VEREDICTO POR ENLACE'));
