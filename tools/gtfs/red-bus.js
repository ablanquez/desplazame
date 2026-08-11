// ⭐⭐ LA RED DE BUS — rutas, sentidos y secuencias, según §2 del diseño de H2a.
//
// ⛔ NO CALCULA NINGÚN TRANSBORDO. Esto arma la red que circula; el enlace a pie
//    entre paradas es otra tanda y otro fichero.
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ **NO** GUARDA, QUE ES LA MITAD DEL MODELO
// ═════════════════════════════════════════════════════════════════════════════
//   · ni un horario, ni una frecuencia, ni una hora. `stop_times.txt` entra para
//     derivar secuencias y terminales, y **sus horas no sobreviven**.
//   · el número de poste NO es la identidad: es un atributo, y viene de
//     `identidad.js`, que es el único sitio que sabe cómo se escribe.
//   · ningún nombre «arreglado». Los del GTFS están rotos en el 80,4 % y es CON
//     PÉRDIDA: de `Iii` no se vuelve a `III`. Se guarda el del feed, marcado.
//
// ⚠️ EL TERMINAL VARIABLE ENTRA COMO DATO Y NADA MÁS. `determinante` es una
//    ETIQUETA, no una condición evaluable: H2a no mira el reloj. Su única
//    consecuencia es que se imprime.
//
//   node tools/gtfs/red-bus.js            el informe
//   node tools/gtfs/red-bus.js --tamano   + el peso del artefacto

'use strict';

const A = require('../../src/alarma');
const { cargar } = require('./feed');
const { posteDeAvanza } = require('./identidad');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));

/** `route_type` extendido: 704 = Local Bus Service. ⛔ El tranvía (900) es H2·8. */
const TIPO_BUS = '704';

/**
 * ⭐ Los dos sentidos con terminal condicional, MEDIDOS en la tanda 3 sobre este
 *    mismo feed, no heredados de nadie. Son 2 de 74.
 * ⚠️ Se declaran aquí y el programa los COMPRUEBA contra lo que sale del feed: si
 *    la cuota se mueve, sale en rojo. Una lista escrita a mano que nadie contrasta
 *    es una lista que envejece en silencio.
 */
const CONDICIONALES = [
  { linea: '23', dir: '0', cuotaMin: 0.28, cuotaMax: 0.36, determinante: 'HORA' },
  { linea: '44', dir: '0', cuotaMin: 0.35, cuotaMax: 0.43, determinante: 'DÍA' },
];

/** Las que la tanda 3 midió sin ni un viaje. Se DECLARAN para poder contrastarlas. */
const ZOMBIS_ESPERADAS = ['CEM', 'CE', 'LAN', 'EM1', 'EM2', 'V1', 'ES3', 'V4'];

const { stops, routes, trips, feedInfo, modo } = cargar();

// ── las paradas, con su poste como ATRIBUTO ──────────────────────────────────
const paradaDe = new Map();
for (const s of stops) {
  paradaDe.set(s.stop_id, {
    id: s.stop_id,
    nombre: s.stop_name,
    lat: Number.parseFloat(s.stop_lat),
    lon: Number.parseFloat(s.stop_lon),
    modo: modo.get(s.stop_id) || '?',
    poste: posteDeAvanza(s.stop_code),
    codigo: s.stop_code,
    nombreProc: 'gtfs-sin-corregir',
  });
}

raya();
log('LA RED DE BUS — feed ' + (feedInfo[0] ? feedInfo[0].feed_version : '?'));
raya();

// ── el filtro de zombis, CONTRA trips.txt y con su cifra ─────────────────────
const conViajes = new Set(trips.map((t) => t.route_id));
const deBus = routes.filter((r) => r.route_type === TIPO_BUS);
const vivas = deBus.filter((r) => conViajes.has(r.route_id));
const zombis = deBus.filter((r) => !conViajes.has(r.route_id));

log('   rutas en routes.txt ...................... ' + routes.length);
log('   de ellas, de BUS (route_type ' + TIPO_BUS + ') ......... ' + deBus.length);
log('   ⛔ descartadas por NO tener ni un viaje ... ' + zombis.length);
for (const r of zombis) {
  log('        ' + r.route_id.padEnd(5) + r.route_short_name.padEnd(6) + r.route_long_name.slice(0, 52));
}
log('   ⇒ RUTAS QUE ENTRAN EN LA RED ............. ' + vivas.length);

// ⭐ El filtro se contrasta contra lo medido en la tanda 3. ⛔ La lista NO decide
//   nada: decide `trips.txt`. La lista solo sirve para que un cambio se note.
const nombresZombis = zombis.map((r) => r.route_short_name).sort();
const esperadas = ZOMBIS_ESPERADAS.slice().sort();
const igual = nombresZombis.length === esperadas.length
  && nombresZombis.every((x, i) => x === esperadas[i]);
log('');
log('   ⭐ contraste con lo medido en H2·3: ' + (igual ? '✅ las mismas ocho' : '⛔ HA CAMBIADO'));
if (!igual) {
  log('      ahora:    ' + nombresZombis.join(' '));
  log('      entonces: ' + esperadas.join(' '));
}
A.exige(igual, 'las rutas sin viajes ya no son las ocho medidas en H2·3. Puede ser un hallazgo '
  + 'bueno —una línea que revive— pero no se sigue sin mirarlo.');

// ── sentidos y secuencias ────────────────────────────────────────────────────
// ⭐ EL VIAJE CANÓNICO NO ES EL MÁS LARGO. 003 se quedaba con el de más paradas y
//    por eso NO PODÍA VER un terminal variable: lo colapsaba. Aquí la secuencia
//    del sentido es la del terminal MAYORITARIO, y la minoritaria se declara.
const rutaViva = new Map(vivas.map((r) => [r.route_id, r]));
const viajesDe = new Map();
for (const t of trips) {
  if (!rutaViva.has(t.route_id)) continue;
  const k = t.route_id + '|' + (t.direction_id === '1' ? '1' : '0');
  if (!viajesDe.has(k)) viajesDe.set(k, []);
  viajesDe.get(k).push(t);
}

// secuencia y terminal de cada viaje, en una pasada por stop_times
const { abrirZip } = require('./feed');
const zip = abrirZip();
const lineas = zip['stop_times.txt'].toString('utf8').split(/\r?\n/);
const cab = lineas[0].split(',');
const iT = cab.indexOf('trip_id');
const iS = cab.indexOf('stop_id');
const iQ = cab.indexOf('stop_sequence');
const secuenciaDe = new Map();
for (let k = 1; k < lineas.length; k++) {
  const l = lineas[k];
  if (!l) continue;
  const c = l.split(',');
  let a = secuenciaDe.get(c[iT]);
  if (!a) { a = []; secuenciaDe.set(c[iT], a); }
  a.push([Number.parseInt(c[iQ], 10), c[iS]]);
}
for (const a of secuenciaDe.values()) a.sort((x, y) => x[0] - y[0]);

const sentidos = [];
for (const [k, vs] of viajesDe) {
  const [routeId, dir] = k.split('|');
  const cuenta = new Map();
  for (const t of vs) {
    const s = secuenciaDe.get(t.trip_id);
    if (!s || !s.length) continue;
    const fin = s[s.length - 1][1];
    cuenta.set(fin, (cuenta.get(fin) || 0) + 1);
  }
  const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
  const mayoritario = orden[0][0];
  // la secuencia del sentido = la del viaje MÁS LARGO **entre los que acaban en
  // el terminal mayoritario**. Así no se cuela la variante corta ni la larga de
  // otro destino.
  let mejor = null;
  for (const t of vs) {
    const s = secuenciaDe.get(t.trip_id);
    if (!s || !s.length || s[s.length - 1][1] !== mayoritario) continue;
    if (!mejor || s.length > mejor.length) mejor = s;
  }
  sentidos.push({
    lineaId: routeId,
    corta: rutaViva.get(routeId).route_short_name,
    dir: Number(dir),
    rotulo: vs[0].trip_headsign || '',
    paradas: mejor.map((x) => x[1]),
    viajes: vs.length,
    terminal: {
      mayoritario,
      cuota: Math.round(1000 * orden[0][1] / vs.length) / 1000,
      segundo: orden[1] ? orden[1][0] : null,
      cuotaSegundo: orden[1] ? Math.round(1000 * orden[1][1] / vs.length) / 1000 : 0,
      determinante: 'NO CONSTA',
    },
  });
}

// ⭐ el determinante, solo donde está MEDIDO. Los demás, NO CONSTA — que aquí
//   significa «no se ha medido», no «no lo tiene».
for (const c of CONDICIONALES) {
  const s = sentidos.find((x) => x.corta === c.linea && x.dir === Number(c.dir));
  A.exige(!!s, `el sentido condicional ${c.linea} s${c.dir} no existe en esta red.`);
  if (!s) continue;
  s.terminal.determinante = c.determinante;
  const q = s.terminal.cuotaSegundo;
  // ⭐⭐ PUERTA 3 · L4 · EL AVISO VIAJA CON EL SENTIDO, EN CASTELLANO.
  //   La cuota ya estaba —`cuotaSegundo: 0.32`—, pero un número no avisa a nadie:
  //   quien lea la lista de paradas de este sentido dará por hecho que todos los
  //   viajes las hacen. **El «sí» falso manda a alguien a esperar un autobús que
  //   no viene.** ⛔ El aviso no sustituye a la cuota: la acompaña.
  s.terminal.aviso = `⚠️ El ${(100 * q).toFixed(0)} % de los viajes de este sentido NO acaba en `
    + `"${s.terminal.mayoritario}" sino en "${s.terminal.segundo}". Depende de `
    + (c.determinante === 'HORA' ? 'LA HORA' : 'EL DÍA DE LA SEMANA')
    + '. ⛔ Las paradas de más allá del terminal corto NO se sirven en todos los viajes.';
  A.exige(q >= c.cuotaMin && q <= c.cuotaMax,
    `la cuota del segundo terminal de ${c.linea} s${c.dir} es ${(100 * q).toFixed(1)} % y se `
    + `declaró entre ${100 * c.cuotaMin} % y ${100 * c.cuotaMax} %. O el feed cambió o la medida `
    + 'de H2·3 no era lo que creíamos.');
}
// ⛔ Y el guardián del propio aviso: un sentido condicional SIN aviso escrito es
//   un sentido que viaja mudo. Se exige que los dos lo lleven y que nombre el
//   segundo terminal, que es el dato que evita la espera inútil.
for (const c of CONDICIONALES) {
  const s = sentidos.find((x) => x.corta === c.linea && x.dir === Number(c.dir));
  if (!s) continue;
  A.exige(!!s.terminal.aviso && s.terminal.aviso.includes(String(s.terminal.segundo)),
    `el sentido condicional ${c.linea} s${c.dir} viaja sin aviso legible, o su aviso no nombra el `
    + 'segundo terminal. Una cuota sola no avisa a nadie.');
}
// ⭐ LEY 156 · y que el guardián sepa ponerse rojo: se le enseña un sentido mudo.
{
  const mudo = { terminal: { aviso: null, segundo: 'X' } };
  const caza = !(mudo.terminal.aviso && mudo.terminal.aviso.includes('X'));
  log('   ⭐ provocado: un sentido condicional SIN aviso ⇒ ' + (caza ? '✅ lo caza' : '⛔ NO lo caza'));
  A.exige(caza, 'el guardián del aviso no caza un sentido mudo: su verde no vale');
}

const usadas = new Set(sentidos.flatMap((s) => s.paradas));
log('');
raya();
log('LOS SENTIDOS');
raya();
log('   sentidos ................................. ' + sentidos.length);
log('   viajes que los sostienen ................. ' + sentidos.reduce((a, s) => a + s.viajes, 0));
log('   paradas usadas por la red de bus ......... ' + usadas.size);
log('   paradas con poste ........................ '
  + [...usadas].filter((id) => paradaDe.get(id).poste !== null).length);

log('');
log('   ⚠️ LOS SENTIDOS CON TERMINAL CONDICIONAL — se marcan porque D5 lo exige');
for (const s of sentidos.filter((x) => x.terminal.determinante !== 'NO CONSTA')) {
  log('      línea ' + s.corta + ' s' + s.dir + '   ' + s.viajes + ' viajes');
  log('         mayoritario  ' + (100 * s.terminal.cuota).toFixed(1).padStart(5) + ' %   '
    + paradaDe.get(s.terminal.mayoritario).nombre);
  log('         segundo      ' + (100 * s.terminal.cuotaSegundo).toFixed(1).padStart(5) + ' %   '
    + paradaDe.get(s.terminal.segundo).nombre + '   ⇒ determinante ' + s.terminal.determinante);
}

// ⭐ la distribución de la cuota del segundo terminal, para que se vea que estos
//   dos no son un caso cualquiera. ⛔ Distribución, no media.
const cuotas = sentidos.map((s) => s.terminal.cuotaSegundo).sort((a, b) => b - a);
log('');
log('   ⭐ cuota del SEGUNDO terminal, los 6 mayores de los ' + sentidos.length + ' sentidos:');
log('      ' + cuotas.slice(0, 6).map((x) => (100 * x).toFixed(1) + ' %').join('  ·  '));
log('   sentidos con UN SOLO terminal ............ ' + cuotas.filter((x) => x === 0).length);
log('   con el segundo por encima del 10 % ....... ' + cuotas.filter((x) => x >= 0.10).length);

// ── el artefacto, y su tamaño, que es lo que decidirá el stack ───────────────
const artefacto = {
  feed: feedInfo[0] ? {
    version: feedInfo[0].feed_version,
    inicio: feedInfo[0].feed_start_date,
    fin: feedInfo[0].feed_end_date,
    editor: feedInfo[0].feed_publisher_name,
  } : null,
  paradas: [...usadas].map((id) => paradaDe.get(id)),
  lineas: vivas.map((r) => ({
    id: r.route_id, corta: r.route_short_name, larga: r.route_long_name,
    modo: 'bus', operador: r.agency_id, color: r.route_color || null,
  })),
  sentidos,
};

// ⛔ EL BLOQUE `feed` NO ES DECORATIVO: la licencia del NAP obliga a conservar SIN
//    ALTERAR la metainformación de fecha. Si el artefacto se lo come, 004
//    incumple la licencia Y pierde la caducidad. Un fallo, dos consecuencias.
A.exige(!!artefacto.feed && !!artefacto.feed.version && !!artefacto.feed.inicio
  && !!artefacto.feed.fin && !!artefacto.feed.editor,
  'el artefacto no lleva los cuatro campos de feed_info. La licencia del NAP exige conservar '
  + 'la metainformación de fecha sin alterar, y sin ella se pierde además la caducidad.');

log('');
raya();
log('EL ARTEFACTO — el tamaño es lo que decidirá el stack, y por eso se mide');
raya();
const json = JSON.stringify(artefacto);
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
log('   paradas ' + artefacto.paradas.length + ' · líneas ' + artefacto.lineas.length
  + ' · sentidos ' + artefacto.sentidos.length);
log('   JSON compacto ............................ ' + kb(Buffer.byteLength(json)));
log('   de eso, las SECUENCIAS de parada ......... '
  + kb(Buffer.byteLength(JSON.stringify(sentidos.map((s) => s.paradas)))));
log('   ⚠️ contra el crudo: stop_times.txt son 47.049.063 B ⇒ reducción '
  + Math.round(47049063 / Buffer.byteLength(json)) + '×');
if (process.argv.includes('--tamano')) {
  log('   comprimido (gzip) ........................ '
    + kb(require('zlib').gzipSync(json).length));
}

log('');
raya();
log(A.cierre('LA RED DE BUS'));

module.exports = { artefacto, paradaDe, sentidos };
