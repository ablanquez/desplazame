// ⭐⭐⭐ H2a · TANDA 9 · EL GUARDIÁN DE VIGENCIA — el que compara la fecha con HOY
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE, Y POR QUÉ NO BASTABA EL QUE YA HABÍA
// ═════════════════════════════════════════════════════════════════════════════
//   `tools/gtfs/enlaces.js` ya exige que la caducidad **VIAJE DENTRO** del
//   artefacto (`feed.fin === '20261005'`). Eso comprueba que el dato está.
//   ⛔ **No comprueba que no haya pasado.** El 6 de octubre de 2026 ese `A.exige`
//   seguirá en verde, con un feed muerto dentro y el motor sirviendo transbordos
//   con cara de acertar.
//
//   ⇒ **Todo dato con caducidad necesita DOS guardianes: uno de FORMA (¿está la
//     fecha?) y uno de VIGENCIA (¿ha pasado?).** Éste es el segundo (ley 163).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ LO QUE HACE RARO A ESTE INSTRUMENTO, DECLARADO ANTES DE USARLO
// ═════════════════════════════════════════════════════════════════════════════
//   **Su veredicto cambia sin que cambie el dato.** Todos los demás instrumentos
//   de este proyecto son función del fichero; éste es función del fichero Y DEL
//   RELOJ. Consecuencias, dichas y no escondidas:
//
//   1 · **Un reloj mal puesto produce un veredicto falso**, y no hay forma de
//       saberlo desde dentro. Lo único que se puede hacer es **cotejar el reloj
//       con algo del propio repositorio** —aquí, la fecha del ZIP— y avisar si el
//       reloj va por detrás. Eso caza el caso «el reloj se ha ido atrás», que es
//       el que produce un falso «todavía vigente». ⛔ NO caza el caso contrario.
//   2 · ⭐⭐ **Y por eso el veredicto NO SE PUEDE CONGELAR EN EL ARTEFACTO.** Lo
//       que viaja dentro son **las fechas y la regla**; el estado hay que
//       recalcularlo en el momento de servir. Un `estado: "dentro-del-periodo"`
//       horneado el 11 de agosto seguiría diciendo lo mismo en noviembre.
//
//   node tools/gtfs/vigencia.js              — con el reloj del sistema
//   node tools/gtfs/vigencia.js --hoy 20261006   — con el reloj movido (nace rojo)

'use strict';

const fs = require('fs');
const A = require('../../src/alarma');
const { abrirZip, tabla, RUTA_FEED } = require('./feed');

const log = (s) => process.stdout.write(s + '\n');
const raya = (c = '=') => log(c.repeat(100));
const di = (k, v) => log('   ' + String(k).padEnd(50) + ' ' + v);

// ═════════════════════════════════════════════════════════════════════════════
// LOS ESTADOS, Y LA LEY 157 PASADA A CADA NOMBRE
//
//   La prueba: *¿puede un lector que solo ve la etiqueta concluir algo que el
//   instrumento no sabe?*
//
//   sin-empezar                 hoy es anterior a `feed_start_date`
//   dentro-del-periodo          ⚠️ se llamó `vigente` y NO PASA: «vigente» se lee
//                               como «el dato es correcto», y esto solo dice que
//                               el periodo DECLARADO por el editor incluye hoy.
//                               Un feed puede estar dentro de su periodo y tener
//                               la red mal.
//   se-acaba                    dentro del periodo y con pocos días por delante.
//                               ⛔ NO es lo mismo que estar fuera: el dato sigue
//                               siendo el bueno. Lo que dice es «hay que ir a
//                               buscar el siguiente».
//   fuera-del-periodo-declarado ⚠️ se llamó `caducado` y NO PASA: «caducado» se
//                               lee como «esto ya no sirve», y lo que se sabe es
//                               que **el editor declaró un periodo y ha
//                               terminado**. El fichero puede seguir describiendo
//                               bien la red o no: eso no lo sabe nadie sin mirar.
//   NO CONSTA                   `feed_info.txt` no trae fecha de fin.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ EL LISTÓN DE «SE ACABA», Y NO ESTÁ MEDIDO: ES UNA DECISIÓN.
 * 30 días es el orden de magnitud de una tanda de este proyecto — descargar,
 * medir el diff, decidir qué se recalcula y recalcularlo. ⛔ No sale de ningún
 * dato: sale de cuánto se tarda en reaccionar, y eso no se ha cronometrado.
 * Se escribe aquí, no se ajusta luego.
 */
const DIAS_AVISO = 30;

/** `20261005` → Date en UTC, sin depender de la zona horaria del que ejecuta. */
function aFecha(yyyymmdd) {
  const s = String(yyyymmdd);
  if (!/^\d{8}$/.test(s)) return null;
  return new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
}
const DIA_MS = 86400000;
const dias = (a, b) => Math.round((b - a) / DIA_MS);

/**
 * ⭐ EL VEREDICTO, COMO FUNCIÓN PURA. Recibe la fecha, no la lee del reloj: por
 * eso se puede probar con el reloj movido, y por eso puede nacer roja.
 */
function vigencia(inicio, fin, hoy, diasAviso = DIAS_AVISO) {
  const f0 = aFecha(inicio), f1 = aFecha(fin), h = aFecha(hoy);
  if (!h) return { estado: 'NO CONSTA', motivo: 'la fecha de referencia no es AAAAMMDD' };
  if (!f1) return { estado: 'NO CONSTA', motivo: 'feed_info.txt no trae feed_end_date' };
  if (f0 && h < f0) {
    return { estado: 'sin-empezar', quedan: dias(h, f0),
      dice: `El periodo declarado por el editor empieza el ${inicio} y hoy es ${hoy}.` };
  }
  const quedan = dias(h, f1);
  if (quedan < 0) {
    return { estado: 'fuera-del-periodo-declarado', quedan,
      dice: `⛔ El editor declaró que estos datos cubren hasta el ${fin}, y ese periodo terminó `
        + `hace ${-quedan} días. ⚠️ No significa que la red haya cambiado: significa que NADIE `
        + 'garantiza ya que esto sea la red de hoy.' };
  }
  if (quedan <= diasAviso) {
    return { estado: 'se-acaba', quedan,
      dice: `⚠️ El periodo declarado por el editor termina el ${fin}: quedan ${quedan} días. `
        + 'Los datos siguen siendo los buenos; hay que ir a buscar la versión siguiente.' };
  }
  return { estado: 'dentro-del-periodo', quedan,
    dice: `El periodo declarado por el editor (${inicio}–${fin}) incluye hoy. Quedan ${quedan} días. `
      + '⚠️ Esto NO dice que la red sea correcta: dice que el editor no ha declarado que haya dejado de serlo.' };
}

/**
 * ⭐⭐ QUÉ ESTADO ES UN FALLO, Y POR QUÉ SOLO UNO.
 * ⛔ `se-acaba` NO es un fallo: **el dato sigue siendo el bueno**. Convertirlo en
 *    rojo pondría la batería en rojo durante 30 días seguidos, y un rojo que dura
 *    un mes enseña a ignorarlo — que es exactamente cómo se pierde un guardián.
 * ⚠️ Y el coste de esa decisión, declarado: **`se-acaba` avisa y no obliga.** Si
 *    nadie lee la salida, el aviso no sirve de nada y el 6 de octubre se entera
 *    uno por el rojo, no por el aviso. Se acepta a sabiendas.
 */
const esFallo = (estado) => estado === 'fuera-del-periodo-declarado';

module.exports = { vigencia, esFallo, aFecha, dias, DIAS_AVISO };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
  const hoyArg = arg('--hoy');
  const hoyReloj = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const HOY = hoyArg || hoyReloj;

  raya();
  log('EL GUARDIÁN DE VIGENCIA — ¿ha pasado la fecha, no solo está la fecha?');
  raya();

  const z = abrirZip();
  const fi = tabla(z['feed_info.txt'])[0];
  di('feed', RUTA_FEED.replace(/\\/g, '/').split('/').slice(-2).join('/'));
  di('feed_version', fi.feed_version);
  di('periodo declarado', fi.feed_start_date + ' – ' + fi.feed_end_date);
  di('fecha de referencia', HOY + (hoyArg ? '   ⚠️ FORZADA con --hoy' : '   (el reloj del sistema)'));
  di('listón de «se acaba»', DIAS_AVISO + ' días   ⚠️ DECIDIDO, no medido — ver la cabecera');

  // ── ⭐ EL COTEJO DEL RELOJ, que es lo único que se puede hacer desde dentro ──
  // Si el reloj va por DETRÁS de la fecha del propio fichero descargado, está mal
  // puesto — y ése es justo el sentido del error que produce un falso «todavía
  // vigente». ⛔ El sentido contrario (reloj adelantado) no lo caza nada.
  const mtimeZip = fs.statSync(RUTA_FEED).mtime.toISOString().slice(0, 10).replace(/-/g, '');
  const relojAtras = HOY < mtimeZip;
  di('el ZIP se descargó el', mtimeZip);
  di('⇒ ¿el reloj va por detrás del fichero?', relojAtras
    ? '⛔ SÍ — el reloj está mal puesto y el veredicto de abajo NO VALE'
    : '✅ no');
  if (!hoyArg) {
    A.exige(!relojAtras, 'el reloj del sistema es anterior a la fecha del ZIP descargado: está mal '
      + 'puesto, y con él un feed caducado puede salir vigente');
  }

  log('');
  raya('─');
  log('EL VEREDICTO');
  raya('─');
  const v = vigencia(fi.feed_start_date, fi.feed_end_date, HOY);
  di('estado', v.estado);
  di('días hasta el fin del periodo', v.quedan === undefined ? 'NO CONSTA' : v.quedan);
  log('');
  log('   ⭐ EL AVISO, TAL COMO TIENE QUE VERLO QUIEN CONSULTA:');
  log('      ' + (v.dice || v.motivo));

  // ⛔ EL GUARDIÁN. Un feed fuera de su periodo no puede terminar en verde.
  //    ⚠️ `se-acaba` avisa y NO falla: ver `esFallo` arriba, con su coste.
  A.exige(!esFallo(v.estado), `el feed está en estado «${v.estado}»: ${v.dice || v.motivo}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ LA PROVOCACIÓN — este guardián nace rojo y se enseña rojo (ley 156)
  //   Un guardián de fecha probado solo con la fecha de hoy es una promesa: hoy
  //   pasa, y el día que importe nadie habrá visto nunca su rojo.
  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  raya('─');
  log('LA PROVOCACIÓN — los cuatro estados, con el reloj movido a propósito');
  raya('─');
  log('   ' + 'fecha simulada'.padEnd(18) + 'estado'.padEnd(30) + 'quedan');
  const CASOS = ['20260601', '20260624', '20260920', '20261005', '20261006', '20261231'];
  const vistos = new Set();
  for (const d of CASOS) {
    const r = vigencia(fi.feed_start_date, fi.feed_end_date, d);
    vistos.add(r.estado);
    log('   ' + d.padEnd(18) + r.estado.padEnd(30) + (r.quedan === undefined ? '—' : r.quedan));
  }
  const rSin = vigencia(fi.feed_start_date, null, '20260811');
  vistos.add(rSin.estado);
  log('   ' + '(sin fecha fin)'.padEnd(18) + rSin.estado.padEnd(30) + '—');
  log('');
  // ⭐ los CINCO estados tienen que haberse visto. Uno que nunca sale no existe.
  for (const e of ['sin-empezar', 'dentro-del-periodo', 'se-acaba', 'fuera-del-periodo-declarado', 'NO CONSTA']) {
    const ok = vistos.has(e);
    log('   ' + (ok ? '✅' : '⛔') + ' ' + e.padEnd(32)
      + (ok ? 'provocado' : 'NUNCA SE HA VISTO — no es un estado, es una promesa'));
    A.exige(ok, `el estado «${e}» no se ha podido provocar ni a propósito`);
  }
  log('');
  log('   ⭐ Y el día exacto: el 20261005 todavía es «se-acaba» y el 20261006 ya no.');
  const ultimo = vigencia(fi.feed_start_date, fi.feed_end_date, '20261005');
  const primero = vigencia(fi.feed_start_date, fi.feed_end_date, '20261006');
  A.exige(ultimo.estado !== 'fuera-del-periodo-declarado' && primero.estado === 'fuera-del-periodo-declarado',
    'la frontera del periodo no está donde debe: el último día declarado ya sale fuera, o el '
    + 'primero de después sale dentro');
  di('20261005 · 20261006', ultimo.estado + '  ·  ' + primero.estado + '   ✅ la frontera está donde debe');

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  raya('─');
  log('⭐⭐ DÓNDE VIVE EL AVISO — y por qué NO puede congelarse (ley 161)');
  raya('─');
  log('   El artefacto NO puede llevar el estado horneado: un «dentro-del-periodo»');
  log('   calculado hoy seguiría diciendo lo mismo en noviembre. ⇒ Lo que viaja son');
  log('   **las fechas y la REGLA**, y quien sirva el dato recalcula:');
  log('');
  const bloque = {
    inicio: fi.feed_start_date,
    fin: fi.feed_end_date,
    caduca: fi.feed_end_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
    reglaDiasAviso: DIAS_AVISO,
    comoSeEvalua: 'compara la fecha de HOY con `fin`. Si hoy > fin ⇒ fuera-del-periodo-declarado; '
      + `si faltan ${DIAS_AVISO} días o menos ⇒ se-acaba; si no ⇒ dentro-del-periodo.`,
    aviso: '⛔ NO se hornea el estado: depende del reloj, no del dato. Quien sirva esto lo recalcula.',
  };
  log('   artefacto.feed.vigencia = ' + JSON.stringify(bloque, null, 2).split('\n').join('\n   '));

  log('');
  raya();
  log(A.cierre('LA VIGENCIA DEL FEED'));
}
