/**
 * ⭐ EL RELOJ DE ZARAGOZA (8/09, entrada nº41).
 *
 * ── ⚠️ De dónde sale este módulo ────────────────────────────────────────────
 *
 * De un fallo que **el portátil no podía ver**. En producción —Fráncfort, UTC—
 * el minuto vivo del poste enseñaba «13:53» a quien vive a las 15:53, y en
 * local salía bien porque esta máquina va en hora de Madrid: los dos husos
 * coincidían por casualidad de desarrollo. Las suites, 646/646 en verde.
 *
 * Y el BiZi acertaba **por dos errores que se anulaban**: su `lastUpdated` se
 * parseaba 2 h adelantado y luego se pintaba en UTC, así que el texto salía
 * bien con la fecha mal —y cualquier edad calculada sobre ella se equivocaba—.
 * Por eso las dos mitades viven aquí juntas: arreglar solo una rompe la otra.
 *
 * ── La doctrina, y es de fuera ──────────────────────────────────────────────
 *
 * · **Se almacena UTC; se localiza SOLO al presentar**, convirtiendo en el
 *   momento de pintar y no antes.
 * · **Zona IANA, nunca desfase fijo.** Un `+2` escrito a mano muere el último
 *   domingo de octubre, y vuelve a morir en marzo. Aquí se usa
 *   `Europe/Madrid` y el desfase lo calcula el sistema para cada instante.
 * · **Nunca se asume UTC en silencio ante un timestamp entrante ambiguo**: se
 *   captura el huso de la fuente. La sede del BiZi habla hora española [§ 1.23]
 *   y lo dice en ningún sitio, así que lo decimos nosotros.
 *
 * ⚠️ **Y el comportamiento de la app es el de Zaragoza entera**, no el de quien
 *    mira: la Zona de Bajas Emisiones ya va «por el reloj de la calle». Un
 *    horario de autobús es de la ciudad; enseñárselo en la hora del navegador
 *    de alguien que está de viaje sería peor, no mejor.
 *
 * Sin dependencias: `Intl` lo trae Node.
 */

/** [IANA tz database] La zona de la ciudad. Nunca un desfase escrito a mano. */
export const ZONA_DE_ZARAGOZA = 'Europe/Madrid';

/**
 * El reloj de pared de Zaragoza, descompuesto en piezas.
 *
 * `hourCycle: 'h23'` y no `hour12: false`: con el segundo, algunas versiones de
 * ICU devuelven «24» para la medianoche y la aritmética se va un día entero.
 */
const RELOJ = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_DE_ZARAGOZA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/**
 * Cuánto va Zaragoza por delante de UTC **en ese instante**, en milisegundos.
 *
 * Se pregunta al sistema en vez de saberlo: en agosto son 2 h (CEST) y en
 * diciembre 1 (CET), y quién decide dónde está la frontera es la base de datos
 * de husos, que se actualiza sola con Node.
 */
function desfaseEn(instante: Date): number {
  const p: Record<string, string> = {};
  for (const x of RELOJ.formatToParts(instante)) {
    p[x.type] = x.value;
  }
  const comoSiEseRelojFueraUTC = Date.UTC(
    Number(p['year']),
    Number(p['month']) - 1,
    Number(p['day']),
    Number(p['hour']),
    Number(p['minute']),
    Number(p['second']),
  );
  return comoSiEseRelojFueraUTC - instante.getTime();
}

/**
 * ⭐ UN TIMESTAMP DE LA SEDE, QUE HABLA HORA ESPAÑOLA, COMO EL INSTANTE QUE ES.
 *
 * ⚠️ `new Date('2026-08-30T12:48:00')` **no vale**, y ese era el fallo: un ISO
 *    sin marca de huso lo parsea ECMAScript en el huso DEL PROCESO. En Madrid
 *    daba el instante correcto y en producción daba uno **2 h en el futuro**,
 *    sin error y sin ruido.
 *
 * Se resuelve en dos pasadas porque el desfase depende del instante y el
 * instante es justo lo que se está calculando: la primera aproxima, la segunda
 * evalúa el desfase ya en el candidato. Con eso, las dos horas repetidas de la
 * madrugada de octubre caen en la primera —la interpretación habitual— y
 * ninguna fecha se va de día.
 *
 * Devuelve una fecha inválida si el crudo no tiene la forma esperada: quien
 * llama decide qué hacer, que es lo que ya hacía.
 */
export function cuandoDeLaSede(crudo: string | undefined): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec((crudo ?? '').trim());
  if (!m) {
    return new Date(Number.NaN);
  }
  const comoSiFueraUTC = Date.UTC(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6] ?? 0),
  );
  const aproximado = comoSiFueraUTC - desfaseEn(new Date(comoSiFueraUTC));
  return new Date(comoSiFueraUTC - desfaseEn(new Date(aproximado)));
}
