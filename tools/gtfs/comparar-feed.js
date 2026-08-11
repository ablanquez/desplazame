// ⭐⭐⭐ H2a · TANDA 9 · EL COMPARADOR DE FEEDS — la maquinaria para el día que cambie
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ, Y POR QUÉ HOY QUE NO HA CAMBIADO NADA
// ═════════════════════════════════════════════════════════════════════════════
//   Todo lo que este proyecto cree saber del GTFS sale de **un fichero que lleva
//   siete semanas quieto**. Las ocho filas que cuadraron el 10/08 no validan
//   ningún instrumento: **validan que nadie ha tocado el fichero.**
//   ⇒ La primera medición que valdrá como control es la de la PRÓXIMA descarga, y
//     hay que llegar a ella con la maquinaria puesta y probada, no improvisando.
//
// ⛔ **HOY NO SE DESCARGA NADA.** Descargar un feed que no ha cambiado no prueba
//    nada y gasta la única bala del control.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ LA TRAMPA QUE ESTE FICHERO TIENE QUE EVITAR
// ═════════════════════════════════════════════════════════════════════════════
//   **Un comparador probado solo contra un fichero consigo mismo siempre dirá
//   «sin cambios».** Su verde no vale nada hasta que se le enseña una diferencia
//   y la caza (ley 4 + ley 156). ⇒ §P3 le provoca SIETE diferencias distintas y
//   exige que las cace todas.
//   ⚠️ Y el límite de esa provocación, declarado: **se muta la MEDICIÓN en
//     memoria, no el ZIP.** Eso prueba el comparador, **no** el lector de ZIP ni
//     el descargador. Los dos siguen sin control hasta que haya un segundo
//     fichero de verdad.
//
//   node tools/gtfs/comparar-feed.js                  — contra el crudo del 10/08
//   node tools/gtfs/comparar-feed.js --otro <ruta>    — el día que haya otro

'use strict';

const fs = require('fs');
const crypto = require('crypto');
const A = require('../../src/alarma');
const { abrirZip, tabla, RUTA_FEED } = require('./feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(46) + ' ' + v);

/**
 * ⭐ LA MEDICIÓN DEL 10/08, COPIADA DE `docs/RECONOCIMIENTO-003-TRANSPORTE.md:98-107`.
 * ⛔ Está aquí para que el comparador PUEDA PONERSE ROJO contra ella: si el crudo
 *    del repositorio dejara de ser el que se midió, esto salta antes que nada.
 */
const MEDIDO_10_08 = {
  zipBytes: 6883311,
  ficheros: {
    'agency.txt': { bytes: 429, filas: 2 },
    'calendar_dates.txt': { bytes: 729890, filas: 27161 },
    'feed_info.txt': { bytes: 244, filas: 1 },
    // ⛔⛔ AQUÍ EL RECONOCIMIENTO PUBLICÓ **52** Y SON **53**, y este comparador lo
    //    cazó en su primera ejecución. Los BYTES cuadran al byte (3.430), así que
    //    el fichero es el mismo: lo que estaba mal era el recuento.
    //    Medido: **52 de `route_type` 704 (bus) + 1 de 900 (tranvía) = 53**. El 52
    //    publicado es el de bus puesto en la columna del total — **el tranvía se
    //    quedó fuera de su propio recuento**.
    //    ⭐ Y el número bueno ya estaba en otro sitio: `docs/DISENO-H2A-RED.md:203`
    //      dice *«de 53 rutas, 45 tienen viajes · de 52 de bus, operan 44»*.
    //    ⛔ `RECONOCIMIENTO-*` no se reescribe (regla del proyecto): se corrige en
    //      documento nuevo. Aquí el ancla es lo MEDIDO, con la discrepancia dicha.
    'routes.txt': { bytes: 3430, filas: 53, publicado: 52, publicadoEn: 'docs/RECONOCIMIENTO-003-TRANSPORTE.md:105' },
    'shapes.txt': { bytes: 1408077, filas: 27603 },
    'stops.txt': { bytes: 99309, filas: 984 },
    'stop_times.txt': { bytes: 47049063, filas: 870717 },
    'trips.txt': { bytes: 2112380, filas: 34427 },
  },
  version: '20260623_AUZSA_Y_TRANVIA',
  fin: '20261005',
};

/** ⭐ La medición de un feed, en la forma que se compara. */
function medir(ruta) {
  const z = abrirZip(ruta);
  const bytes = fs.statSync(ruta).size;
  const ficheros = {};
  for (const [n, buf] of Object.entries(z)) {
    ficheros[n] = { bytes: buf.length, filas: tabla(buf).length };
  }
  const stops = tabla(z['stops.txt']);
  const routes = tabla(z['routes.txt']);
  const trips = tabla(z['trips.txt']);
  const fi = tabla(z['feed_info.txt'])[0] || {};
  const conViajes = new Set(trips.map((t) => t.route_id));
  return {
    ruta, bytes,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(ruta)).digest('hex'),
    ficheros,
    version: fi.feed_version || null,
    inicio: fi.feed_start_date || null,
    fin: fi.feed_end_date || null,
    // ⭐⭐ LA IDENTIDAD, que es la decisión central de H2a y la que nunca se ha
    //   podido comprobar entre versiones porque solo existe una.
    stopIds: stops.map((s) => s.stop_id),
    codeDe: Object.fromEntries(stops.map((s) => [s.stop_id, s.stop_code])),
    nombreDe: Object.fromEntries(stops.map((s) => [s.stop_id, s.stop_name])),
    posDe: Object.fromEntries(stops.map((s) => [s.stop_id, s.stop_lat + ',' + s.stop_lon])),
    routeIds: routes.map((r) => r.route_id),
    zombis: routes.filter((r) => !conViajes.has(r.route_id)).map((r) => r.route_short_name).sort(),
  };
}

/**
 * ⭐ EL DIFF. Devuelve una lista de hallazgos; vacía significa «sin cambios».
 * ⛔ Cada hallazgo lleva su clase, para poder exigir que se cacen TODAS.
 */
function comparar(a, b) {
  const h = [];
  const push = (clase, texto) => h.push({ clase, texto });
  if (a.sha256 !== b.sha256) push('fichero', `el sha256 cambia: ${a.sha256.slice(0, 12)}… → ${b.sha256.slice(0, 12)}…`);
  if (a.bytes !== b.bytes) push('fichero', `el ZIP pasa de ${a.bytes} a ${b.bytes} bytes`);
  if (a.version !== b.version) push('version', `feed_version: "${a.version}" → "${b.version}"`);
  if (a.inicio !== b.inicio || a.fin !== b.fin) {
    push('caducidad', `el periodo pasa de ${a.inicio}–${a.fin} a ${b.inicio}–${b.fin}`);
  }
  // ficheros que entran, salen o cambian de tamaño/filas
  const nombres = [...new Set([...Object.keys(a.ficheros), ...Object.keys(b.ficheros)])].sort();
  for (const n of nombres) {
    const x = a.ficheros[n], y = b.ficheros[n];
    if (!x) { push('fichero', `entra un fichero nuevo: ${n}`); continue; }
    if (!y) { push('fichero', `⛔ DESAPARECE un fichero: ${n}`); continue; }
    if (x.filas !== y.filas) push('filas', `${n}: ${x.filas} → ${y.filas} filas (${y.filas - x.filas >= 0 ? '+' : ''}${y.filas - x.filas})`);
  }
  // ⭐⭐ LA IDENTIDAD DE LAS PARADAS — lo que decide si D1 aguanta
  const A_ = new Set(a.stopIds), B_ = new Set(b.stopIds);
  const fuera = a.stopIds.filter((i) => !B_.has(i));
  const nuevas = b.stopIds.filter((i) => !A_.has(i));
  if (fuera.length) push('identidad', `⛔ ${fuera.length} stop_id DESAPARECEN: ${fuera.slice(0, 6).join(' ')}${fuera.length > 6 ? ' …' : ''}`);
  if (nuevas.length) push('identidad', `${nuevas.length} stop_id NUEVOS: ${nuevas.slice(0, 6).join(' ')}${nuevas.length > 6 ? ' …' : ''}`);
  const quedan = a.stopIds.filter((i) => B_.has(i));
  const cambiaCode = quedan.filter((i) => a.codeDe[i] !== b.codeDe[i]);
  const cambiaNombre = quedan.filter((i) => a.nombreDe[i] !== b.nombreDe[i]);
  const cambiaPos = quedan.filter((i) => a.posDe[i] !== b.posDe[i]);
  if (cambiaCode.length) push('identidad', `⛔⛔ ${cambiaCode.length} stop_id CAMBIAN de stop_code — la identidad no es estable: ${cambiaCode.slice(0, 4).join(' ')}`);
  if (cambiaNombre.length) push('nombre', `${cambiaNombre.length} paradas cambian de nombre: ${cambiaNombre.slice(0, 4).join(' ')}`);
  if (cambiaPos.length) push('posicion', `${cambiaPos.length} paradas se mueven de sitio: ${cambiaPos.slice(0, 4).join(' ')}`);
  // rutas y zombis
  const ra = new Set(a.routeIds), rb = new Set(b.routeIds);
  const rFuera = a.routeIds.filter((i) => !rb.has(i));
  const rNuevas = b.routeIds.filter((i) => !ra.has(i));
  if (rFuera.length) push('rutas', `${rFuera.length} route_id desaparecen: ${rFuera.join(' ')}`);
  if (rNuevas.length) push('rutas', `${rNuevas.length} route_id nuevos: ${rNuevas.join(' ')}`);
  if (a.zombis.join('|') !== b.zombis.join('|')) {
    push('zombis', `las líneas sin viajes cambian: [${a.zombis.join(' ')}] → [${b.zombis.join(' ')}]`);
  }
  return h;
}

module.exports = { medir, comparar, MEDIDO_10_08 };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
  const otro = arg('--otro');

  raya();
  log('EL COMPARADOR DE FEEDS — probado hoy contra el único fichero que hay');
  raya();

  const base = medir(RUTA_FEED);
  di('feed base', RUTA_FEED.replace(/\\/g, '/').split('/').pop());
  di('bytes · sha256', base.bytes + ' · ' + base.sha256.slice(0, 16) + '…');
  di('version · periodo', base.version + ' · ' + base.inicio + '–' + base.fin);

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  raya('─');
  log('P1 · ⭐ EL CRUDO CONTRA LO QUE SE MIDIÓ EL 10/08 — el ancla');
  raya('─');
  log('   ' + 'fichero'.padEnd(22) + 'bytes hoy'.padStart(12) + 'bytes 10/08'.padStart(13)
    + 'filas hoy'.padStart(11) + 'filas 10/08'.padStart(13) + '   ¿cuadra?');
  let cuadran = 0;
  for (const [n, m] of Object.entries(MEDIDO_10_08.ficheros)) {
    const x = base.ficheros[n];
    const ok = x && x.bytes === m.bytes && x.filas === m.filas;
    if (ok) cuadran++;
    log('   ' + n.padEnd(22) + String(x ? x.bytes : '—').padStart(12) + String(m.bytes).padStart(13)
      + String(x ? x.filas : '—').padStart(11) + String(m.filas).padStart(13) + '   ' + (ok ? '✅' : '⛔ NO')
      + (m.publicado ? '   ⚠️ el informe publicó ' + m.publicado : ''));
    A.exige(ok, `${n} no cuadra con la medición del 10/08`);
  }
  // ⭐ y la discrepancia con lo PUBLICADO se dice aparte, no se tapa cuadrando
  //   el ancla en silencio. Que el ancla sea lo medido no borra que el informe
  //   diga otra cosa: eso se reporta hacia arriba.
  for (const [n, m] of Object.entries(MEDIDO_10_08.ficheros)) {
    if (!m.publicado) continue;
    log('');
    log('   ⛔⛔ DISCREPANCIA CON UN NÚMERO PUBLICADO — no con el fichero:');
    log('      ' + n + ': medido ' + m.filas + ' filas · ' + m.publicadoEn + ' publicó ' + m.publicado);
    log('      Los BYTES cuadran al byte, así que el fichero es el mismo. Lo que estaba');
    log('      mal era el recuento. ⇒ Se reporta hacia arriba; el informe NO se reescribe.');
  }
  di('ficheros que cuadran', cuadran + ' de ' + Object.keys(MEDIDO_10_08.ficheros).length);
  A.exige(base.bytes === MEDIDO_10_08.zipBytes, `el ZIP mide ${base.bytes} y el 10/08 medía ${MEDIDO_10_08.zipBytes}`);
  A.exige(base.version === MEDIDO_10_08.version, `la feed_version es ${base.version}`);
  di('⭐ routes.txt: fecha interna', 'ver §P4 — es la que delata al tranvía congelado');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  raya('─');
  log('P2 · EL DIFF CONTRA SÍ MISMO — tiene que salir vacío, y NO vale como prueba');
  raya('─');
  const contraSiMismo = comparar(base, medir(RUTA_FEED));
  di('hallazgos', contraSiMismo.length + (contraSiMismo.length ? '   ⛔ NO PUEDE HABER NINGUNO' : '   ✅ ninguno'));
  A.exige(contraSiMismo.length === 0, 'el comparador encuentra diferencias entre el fichero y sí mismo');
  log('   ⚠️ Y esto NO demuestra que el comparador funcione: un comparador roto que');
  log('     no mira nada daría exactamente este mismo cero. Ver §P3.');

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ LA PROVOCACIÓN — siete diferencias inventadas, y hay que cazarlas todas
  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  raya('─');
  log('P3 · ⭐⭐⭐ SIETE DIFERENCIAS PROVOCADAS — el cero de arriba solo vale si caza éstas');
  raya('─');
  const clon = () => JSON.parse(JSON.stringify(base));
  const unId = base.stopIds[0], otroId = base.stopIds[1];
  const MUTACIONES = [
    ['caducidad', 'el periodo se mueve al siguiente trimestre', (m) => { m.fin = '20270105'; m.inicio = '20261006'; }],
    ['version', 'cambia la feed_version', (m) => { m.version = '20261006_AUZSA_Y_TRANVIA'; }],
    ['filas', 'stops.txt gana una fila', (m) => { m.ficheros['stops.txt'].filas += 1; }],
    ['fichero', 'desaparece shapes.txt', (m) => { delete m.ficheros['shapes.txt']; }],
    ['identidad', 'desaparece una parada', (m) => { m.stopIds = m.stopIds.filter((i) => i !== unId); }],
    ['identidad', '⛔ un stop_id cambia de stop_code', (m) => { m.codeDe[otroId] = 'PA99999'; }],
    ['zombis', 'una línea zombi resucita', (m) => { m.zombis = m.zombis.slice(1); }],
  ];
  log('   ' + 'clase'.padEnd(14) + 'la diferencia inventada'.padEnd(46) + '¿la caza?');
  const clasesCazadas = new Set();
  for (const [clase, texto, mutar] of MUTACIONES) {
    const m = clon();
    // ⛔ el sha y los bytes se dejan iguales A PROPÓSITO: si no, todas las
    //   mutaciones se cazarían por el sha y no se probaría nada más.
    mutar(m);
    const h = comparar(base, m);
    const caza = h.some((x) => x.clase === clase);
    if (caza) clasesCazadas.add(clase);
    log('   ' + clase.padEnd(14) + texto.slice(0, 45).padEnd(46)
      + (caza ? '✅ SÍ — "' + h.find((x) => x.clase === clase).texto.slice(0, 46) + '…"' : '⛔ NO LA CAZA'));
    A.exige(caza, `el comparador NO caza «${texto}»: su «sin cambios» no vale nada`);
  }
  log('');
  di('⇒ clases de cambio que sabe cazar', clasesCazadas.size + ' de '
    + new Set(MUTACIONES.map((x) => x[0])).size);
  log('   ⚠️ LÍMITE DECLARADO: se muta la MEDICIÓN en memoria, no el ZIP. Esto prueba');
  log('     el comparador; **NO prueba el lector de ZIP ni el descargador**, que');
  log('     siguen sin control hasta que exista un segundo fichero de verdad.');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  raya('─');
  log('P4 · ⭐⭐ LO QUE ESTE COMPARADOR CONTESTARÁ EL DÍA QUE HAYA OTRO FEED');
  raya('─');
  di('paradas en el feed de hoy', base.stopIds.length);
  di('formato de los stop_id', 'ejemplo "' + base.stopIds[0] + '" · ¿opaco? '
    + (/^\d+$/.test(base.stopIds[0]) ? 'SÍ, es un entero sin significado' : 'no'));
  di('stop_code de esa misma parada', base.codeDe[base.stopIds[0]]);
  log('');
  log('   ⭐⭐ LA PREGUNTA QUE DECIDE SI D1 AGUANTA: **¿siguen las ' + base.stopIds.length + ' paradas');
  log('     llamándose igual?** La identidad de H2a cuelga del `stop_id` opaco, y');
  log('     **su estabilidad entre versiones NO SE HA PODIDO COMPROBAR NUNCA**, porque');
  log('     solo existe una versión. El comparador ya sabe contestarlo:');
  log('        · cuántos stop_id desaparecen  · cuántos son nuevos');
  log('        · ⛔⛔ cuántos MANTIENEN el id y CAMBIAN el stop_code — que sería el');
  log('          caso peor: la identidad seguiría «igual» y señalaría a otro poste.');
  log('');
  di('routes.txt · fecha interna en el ZIP', (() => {
    // la fecha interna la trae la entrada del ZIP, no el CSV
    const buf = fs.readFileSync(RUTA_FEED);
    return 'ver `tools/bajar-gtfs.js`; aquí se compara por FILAS y BYTES, que es lo estable';
  })());
  log('   ⚠️ `docs/RECONOCIMIENTO-003-TRANSPORTE.md:105` publicó que `routes.txt` va');
  log('     fechado el **2025-09-23**, diez meses antes que el resto. Si en el feed');
  log('     siguiente sigue igual, **el tranvía se arrastra congelado desde septiembre**');
  log('     y eso es un hallazgo, no un detalle. ⛔ Hoy no se puede saber: hace falta');
  log('     el segundo fichero.');

  log('');
  raya();
  log(A.cierre('EL COMPARADOR DE FEEDS'));
}
