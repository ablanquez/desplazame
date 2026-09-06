/**
 * ⭐ LA CAPA DEL FESTIVO (6/09): el cuadro web suple el calendario que el feed calla.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  EL HUECO, MEDIDO. El único GTFS de los urbanos de Zaragoza que existe —el
 *  del NAP, ficha 1176, publicado el 30/06/2026— trae para **siete líneas**
 *  (22, 23, 31, 33, 34, 35, 39) un cuadro de curso con **tipos de día `L` y
 *  `S` y ninguno `F`**. Resultado: el domingo 6/09 esas siete tienen **cero
 *  viajes** en el feed, mientras que hasta el 30/08 —con el cuadro de verano,
 *  que sí tenía `F`— circulaban los nueve domingos seguidos.
 *
 *  Y en la calle circulan: la web del operador da para el 35 en domingo
 *  **07:00 → 01:20** y *«domingos y festivos: 10 min»*. Las siete tienen
 *  cuadro de domingo. La sonda del 6/09 lo midió una por una.
 *
 *  No hay fuente mejor a la que ir: el NAP re-bajado hoy es **byte a byte** el
 *  del 23/06, Transitland baja de ese mismo fichero y no tiene nada posterior
 *  al 30/06, y el Ayuntamiento no publica GTFS. Así que o se suple, o esas
 *  siete líneas no existen los domingos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── QUÉ MODELO SE USA, y es vocabulario GTFS nativo ─────────────────────────
 *
 * Servicio **por frecuencia** [`frequencies.txt` con `exact_times=0`: *«el
 * headway entre viajes»*, GTFS Best Practices] dentro de la ventana
 * `primera → última`, más una excepción de servicio añadido [`calendar_dates`
 * con `exception_type=1`]. No hay que inventar nada: **la espera media por
 * frecuencia ES el modelo del motor desde la casilla 8** —`E[W] = H/2`—, así
 * que un cuadro web encaja en la búsqueda sin tocarla.
 *
 * ── LA ARQUITECTURA: capa suplementaria, no copia ───────────────────────────
 *
 * [DOC OpenTripPlanner] el feed estático *«no recoge los cambios»*; lo que los
 * recoge es una capa encima. El precedente de la casa es `patron-operativo.ts`:
 * la red cocinada **no se toca**, se compone una encima y el día que la
 * observación caduque basta con dejar de aplicarla. Aquí igual — y con una
 * frontera aún más estrecha: **la capa solo habla donde el feed calla**.
 *
 * ── LA VENTANA, medida ──────────────────────────────────────────────────────
 *
 * ⚠️ El cuadro web **no es un calendario**: es una ventana rodante. Medido día
 * a día el 6/09 sobre el 35: de **hoy a +9 días** hay cuadro; el −1, el −2 y
 * del +10 en adelante devuelven la página **vacía** (150.503 B, cero horas).
 * Por eso `VENTANA_DIAS` es 9 y no un número redondo: es lo que hay.
 *
 * ── EL MUDO HONESTO ─────────────────────────────────────────────────────────
 *
 * Si la web no contesta, o contesta sin cuadro, **manda el feed**: la línea se
 * queda sin servicio, que es lo que el calendario dice. No saber no es saber lo
 * contrario, y una línea inventada mandaría a alguien a una parada vacía.
 */
import type { PatronBus, RedDeBus } from './red-bus.ts';
import { SENTIDO_DE } from './recorrido.ts';

/** La página del cuadro. La misma que ya da el nonce a `recorrido.ts`. */
export const URL_HORARIOS = 'https://zaragoza.avanzagrupo.com/lineas-y-horarios/';

/**
 * ⭐ HASTA DÓNDE LLEGA LA VENTANA, en días desde hoy. **Medido, no elegido.**
 *
 * Sonda del 6/09 sobre el 35 sentido −1, día a día: `+0` a `+9` traen cuadro
 * (13 a 26 horas según el día); `−1`, `−2` y de `+10` a `+15` devuelven la
 * misma página vacía de 150.503 bytes y **cero horas**.
 */
export const VENTANA_DIAS = 9;

/**
 * TTL de un cuadro en la capa: **6 horas**.
 *
 * Más largo que el de los desvíos (1 h) a propósito: un desvío aparece y
 * desaparece durante el día, y un cuadro de horarios es el horario publicado
 * —cambia cuando el operador cambia el cuadro, no cada hora—. Y más corto que
 * el día entero para que un cambio del operador entre sin reiniciar el motor.
 */
export const TTL_FESTIVO_MS = 6 * 60 * 60_000;

/** Lo que se espera entre dos peticiones a la web. Ver el volumen en la ficha. */
export const PAUSA_FESTIVO_MS = 800;

/**
 * ⭐ EL TIPO DE DÍA, y **no se deduce del día de la semana**.
 *
 * La página web da los tres tipos de una vez —*«laborables: 6, sábados: 9,
 * domingos y festivos: 10 min»*— y **no marca cuál aplica** a la fecha pedida:
 * medido, la línea sale idéntica para el lunes 7 y para el domingo 13. Así que
 * hay que decidirlo aquí.
 *
 * Y se decide con el dato, no con el calendario gregoriano: **el propio GTFS
 * dice qué día es**, en la letra que sus `service_id` llevan en la posición 7
 * (`029005F`, `035510L`, `022507S`). Medido el 6/09 sobre el feed servido:
 *
 * ```
 *   20260905 sáb   209 servicios   S=208  ?=1
 *   20260906 dom   198 servicios   F=197  I=1
 *   20260907 lun   318 servicios   L=317  ?=1
 * ```
 *
 * ⚠️ **Por MAYORÍA, y con mínimo.** Hay fechas con uno o dos servicios sueltos
 * —el 9/10 tiene exactamente uno, con letra `B`— que son los **196 huérfanos**
 * sin ni un viaje que la ficha § 1.7 ya documenta. Tomar «la letra que haya»
 * convertiría esas fechas en un tipo de día inventado.
 *
 * ⭐ Y esto es lo que hace que un **festivo entre semana** salga bien: el 12 de
 * octubre no es domingo, pero si el operador lo declara con servicios `F`, aquí
 * sale `F`. Deducirlo del día de la semana habría dado `L` y una frecuencia
 * casi el doble de densa que la real.
 */
export type TipoDeDia = 'L' | 'S' | 'F';

/** El mínimo de servicios para que la mayoría signifique algo. */
export const MINIMO_PARA_MAYORIA = 10;

export function tipoDeDiaDe(red: RedDeBus, fecha: string): TipoDeDia | null {
  const servicios = red.porFecha[fecha] ?? [];
  if (servicios.length < MINIMO_PARA_MAYORIA) {
    return null;
  }
  const cuenta = new Map<string, number>();
  for (const s of servicios) {
    const letra = s[6];
    if (letra === 'L' || letra === 'S' || letra === 'F') {
      cuenta.set(letra, (cuenta.get(letra) ?? 0) + 1);
    }
  }
  let mejor: TipoDeDia | null = null;
  let cuantos = 0;
  for (const [letra, n] of cuenta) {
    if (n > cuantos) {
      cuantos = n;
      mejor = letra as TipoDeDia;
    }
  }
  // Mayoría de verdad: más de la mitad de los servicios del día.
  return cuantos * 2 > servicios.length ? mejor : null;
}

/** Cómo se llama cada tipo de día en la frase de la web. */
export const ROTULO_DEL_TIPO: Readonly<Record<TipoDeDia, string>> = {
  L: 'laborables',
  S: 'sábados',
  F: 'domingos y festivos',
};

/** El cuadro de una línea y un sentido en una fecha, leído de la web. */
export interface CuadroDelDia {
  /** El corto de la línea, como lo dice la pantalla: `35`. */
  readonly linea: string;
  /** La dirección **del feed** (`0` o `1`), no la de la web. */
  readonly direccion: string;
  /** `AAAAMMDD`. */
  readonly fecha: string;
  readonly tipo: TipoDeDia;
  /** Segundos entre vehículos: la frecuencia del tipo de día, en segundos. */
  readonly intervaloS: number;
  /** `HH:MM` de la primera salida del sentido en esa fecha. */
  readonly primera: string;
  /** `HH:MM` de la última. Puede ser de madrugada: `01:20`. */
  readonly ultima: string;
  /** Cuándo se leyó, para el TTL y para decirlo en el aviso. */
  readonly cuando: number;
}

/** Lo que se saca de la página, antes de saber de qué línea es. */
export interface LoLeidoDelCuadro {
  readonly intervaloS: number;
  readonly primera: string;
  readonly ultima: string;
}

/**
 * ⭐ EL PARSEO DEL CUADRO. Tres anclajes, y los tres son marcado medido.
 *
 * ⚠️ **La cicatriz que rompe a un parser ingenuo**: las celdas de hora se
 * abren con `<td>` y se cierran con `</th>` —`<td>07:00</th>`—, así que un
 * `/<td>(.*?)<\/td>/` no encuentra ni una. Se lee por el contenido, no por el
 * par de etiquetas.
 *
 * `null` si falta cualquiera de las tres cosas: **media lectura no es un
 * cuadro**. Fuera de la ventana la página viene sin tablas, y ese es
 * exactamente el caso que tiene que devolver `null`.
 */
export function leerCuadro(html: string, tipo: TipoDeDia): LoLeidoDelCuadro | null {
  const frase = /Frecuencia media:([^<]{0,200})/.exec(html)?.[1];
  if (!frase) {
    return null;
  }
  const rotulo = ROTULO_DEL_TIPO[tipo];
  const minutos = new RegExp(`${rotulo}\\s*:\\s*(\\d{1,3})`, 'i').exec(frase)?.[1];
  if (!minutos) {
    return null;
  }
  const horas = (cual: 'primeras' | 'ultimas'): string[] => {
    const i = html.indexOf(`aria-describedby="table-horarios-${cual}-desc"`);
    if (i < 0) {
      return [];
    }
    const fin = html.indexOf('</table>', i);
    const tabla = html.slice(i, fin < 0 ? i + 4000 : fin);
    return [...tabla.matchAll(/<td>\s*([0-2]\d:[0-5]\d)\s*<\/t[dh]>/gi)].map((m) => m[1]!);
  };
  const primeras = horas('primeras');
  const ultimas = horas('ultimas');
  if (primeras.length === 0 || ultimas.length === 0) {
    return null;
  }
  const intervaloS = Number(minutos) * 60;
  if (!Number.isFinite(intervaloS) || intervaloS <= 0) {
    return null;
  }
  return { intervaloS, primera: primeras[0]!, ultima: ultimas[ultimas.length - 1]! };
}

// ── LA CONSULTA ──────────────────────────────────────────────────────────────

/**
 * ⭐ EL POST, **pelado**: ni nonce ni cookies. Medido el 6/09.
 *
 * Las cuatro combinaciones —con/sin nonce × con/sin cookies— devuelven los
 * **mismos 153.346 bytes** y el mismo cuadro. Así que no se pide un nonce que
 * no hace falta: es una visita menos a la web del operador por cada pasada.
 *
 * ⚠️ **Y tiene que ser POST.** Por `GET` con `times-date` en la query la página
 * contesta 200 y **el cuadro de hoy**, ignorando la fecha: medido, el lunes 14,
 * el sábado 19 y el 25 de diciembre devolvían los tres el cuadro del día en que
 * se preguntó. Lo que hace que la fecha cuente es `times-date-submit`.
 */
export async function pedirCuadro(
  linea: string,
  direccion: string,
  fecha: string,
  tipo: TipoDeDia,
  pedir: typeof fetch = fetch,
): Promise<CuadroDelDia | null> {
  const sentido = SENTIDO_DE[direccion];
  if (!sentido) {
    return null;
  }
  const iso = `${fecha.slice(0, 4)}-${fecha.slice(4, 6)}-${fecha.slice(6, 8)}`;
  const url = `${URL_HORARIOS}?selectLinea=${encodeURIComponent(linea)}&selectSentido=${encodeURIComponent(sentido)}`;
  const cuerpo = new URLSearchParams({
    selectLinea: linea,
    selectSentido: sentido,
    'times-date': iso,
    'times-date-submit': 'Cambiar',
    _wp_http_referer: '/lineas-y-horarios/',
  });
  let html: string;
  try {
    const r = await pedir(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: cuerpo.toString(),
    });
    if (!r.ok) {
      return null;
    }
    html = await r.text();
  } catch {
    // ⭐ EL MUDO HONESTO: la web no contesta, y eso no es «no hay servicio».
    return null;
  }
  // ⚠️ Y se comprueba que la página contesta de LA FECHA PEDIDA. Si el eco no
  //    cuadra, se descarta: es el caso del GET, que devuelve el cuadro de hoy
  //    con cara de haber entendido la pregunta.
  const eco = /id="times-date"[^>]*value="(\d{4}-\d{2}-\d{2})"/.exec(html)?.[1];
  if (eco !== iso) {
    return null;
  }
  const leido = leerCuadro(html, tipo);
  return leido ? { linea, direccion, fecha, tipo, ...leido, cuando: Date.now() } : null;
}

// ── LA CAPA SERVIDA ──────────────────────────────────────────────────────────

const capa = new Map<string, CuadroDelDia>();
const enVuelo = new Map<string, Promise<CuadroDelDia | null>>();

export const claveDelCuadro = (linea: string, direccion: string, fecha: string): string =>
  `${linea}|${direccion}|${fecha}`;

/** Mete un cuadro en la capa. Lo usan el refresco y las jueces. */
export function servirCuadro(c: CuadroDelDia): void {
  capa.set(claveDelCuadro(c.linea, c.direccion, c.fecha), c);
}

/** Vacía la capa. Solo para las jueces y la contraprueba. */
export function olvidarElFestivo(): void {
  capa.clear();
  enVuelo.clear();
}

/**
 * Lo que la capa sabe **sin salir a la red**, si no ha caducado. `null` es «no
 * consta», y arriba eso significa que manda el feed.
 */
export function cuadroServido(
  linea: string,
  direccion: string,
  fecha: string,
  ahora: number = Date.now(),
): CuadroDelDia | null {
  const suyo = capa.get(claveDelCuadro(linea, direccion, fecha));
  if (!suyo || ahora - suyo.cuando >= TTL_FESTIVO_MS) {
    return null;
  }
  return suyo;
}

/** Cuántas visitas ha hecho la capa a la web. Para las jueces del single-flight. */
let visitas = 0;
export const visitasAlCuadro = (): number => visitas;
export const olvidarLasVisitas = (): void => {
  visitas = 0;
};

/**
 * ⭐ TRAE EL CUADRO: de la capa si está fresco, y si no, a la web. Con
 * **single-flight**, como el desvío, el poste y el BiZi.
 */
export function traerCuadro(
  linea: string,
  direccion: string,
  fecha: string,
  tipo: TipoDeDia,
  pedir: typeof fetch = fetch,
  ahora: () => number = Date.now,
): Promise<CuadroDelDia | null> {
  const clave = claveDelCuadro(linea, direccion, fecha);
  const fresco = cuadroServido(linea, direccion, fecha, ahora());
  if (fresco) {
    return Promise.resolve(fresco);
  }
  const yendo = enVuelo.get(clave);
  if (yendo) {
    return yendo;
  }
  const vuelo = (async (): Promise<CuadroDelDia | null> => {
    visitas++;
    const c = await pedirCuadro(linea, direccion, fecha, tipo, pedir);
    if (c) {
      servirCuadro(c);
    }
    return c;
  })().finally(() => {
    enVuelo.delete(clave);
  });
  enVuelo.set(clave, vuelo);
  return vuelo;
}

// ── QUÉ HACE FALTA SUPLIR ────────────────────────────────────────────────────

/** Una línea y un sentido a los que el feed no da ni un viaje en esa fecha. */
export interface HuecoDelCalendario {
  readonly linea: string;
  readonly direccion: string;
  readonly patron: PatronBus;
}

/**
 * ⭐ LOS HUECOS de una fecha: los sentidos **principales** cuyo patrón no tiene
 * ni un viaje ese día.
 *
 * ⚠️ **Solo los principales, y es una decisión.** El cuadro web dice «la línea
 * 35 pasa cada 10 minutos», no «el refuerzo 35|0|3 pasa cada 10 minutos».
 * Extenderlo a los refuerzos sería multiplicar el servicio por el número de
 * patrones que el feed tenga: la misma línea contada tres veces.
 */
export function huecosDelCalendario(
  red: RedDeBus,
  fecha: string,
  cortoDe: (patron: PatronBus) => string,
): readonly HuecoDelCalendario[] {
  const hoy = new Set(red.porFecha[fecha] ?? []);
  const fuera: HuecoDelCalendario[] = [];
  for (const patron of red.patrones) {
    if (patron.modo !== 'bus' || !patron.principal) {
      continue;
    }
    if (patron.servicios.some((s) => hoy.has(s))) {
      continue;
    }
    fuera.push({ linea: cortoDe(patron), direccion: patron.direccion, patron });
  }
  return fuera;
}

/** Las fechas de la ventana: hoy y los `VENTANA_DIAS` siguientes, en `AAAAMMDD`. */
export function laVentana(hoy: Date): readonly string[] {
  const fechas: string[] = [];
  for (let k = 0; k <= VENTANA_DIAS; k++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + k);
    fechas.push(
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return fechas;
}

/** ¿Cae esta fecha dentro de la ventana que la web sabe contestar? */
export function dentroDeLaVentana(fecha: string, hoy: Date): boolean {
  return laVentana(hoy).includes(fecha);
}

/** Lo que una pasada del refresco ha hecho. */
export interface CuentasDelFestivo {
  readonly fecha: string;
  /** Sentidos principales sin ni un viaje en el feed. */
  readonly huecos: number;
  /** De ésos, cuántos ha contestado la web con cuadro. */
  readonly suplidos: number;
  /** Y cuántos se quedan mudos: manda el feed. */
  readonly mudos: number;
  readonly ms: number;
}

/**
 * ⭐ EL REFRESCO: una pasada por la fecha que haga falta.
 *
 * ⚠️ **Nadie la espera.** Como el de desvíos: lo corre el fondo y la búsqueda
 * lee lo que haya. Si no hay nada, el feed manda y no se avisa de nada — que es
 * exactamente la conducta de antes de que esto existiera.
 */
export async function refrescarElFestivo(
  red: RedDeBus,
  fecha: string,
  cortoDe: (patron: PatronBus) => string,
  pedir: typeof fetch = fetch,
  pausaMs = PAUSA_FESTIVO_MS,
  ahora: () => number = Date.now,
): Promise<CuentasDelFestivo> {
  const t0 = ahora();
  const tipo = tipoDeDiaDe(red, fecha);
  const huecos = huecosDelCalendario(red, fecha, cortoDe);
  if (!tipo) {
    // Sin saber qué día es no se pide nada: la frase de la web trae los tres
    // tipos y elegir uno a ciegas sería inventarse la frecuencia.
    return { fecha, huecos: huecos.length, suplidos: 0, mudos: huecos.length, ms: ahora() - t0 };
  }
  let suplidos = 0;
  for (const h of huecos) {
    const c = await traerCuadro(h.linea, h.direccion, fecha, tipo, pedir, ahora);
    if (c) {
      suplidos++;
    }
    if (pausaMs > 0) {
      await new Promise((sigue) => setTimeout(sigue, pausaMs));
    }
  }
  return {
    fecha,
    huecos: huecos.length,
    suplidos,
    mudos: huecos.length - suplidos,
    ms: ahora() - t0,
  };
}

/**
 * ⭐ EL AVISO, con la fuente dicha. Es el mismo trato que la DGT y el vivo: un
 * dato que no viene del feed se dice de dónde viene.
 */
export function avisoDelFestivo(c: CuadroDelDia): string {
  const hora = new Date(c.cuando).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    `El horario de la línea ${c.linea} hoy sale del cuadro web de Avanza ` +
    `(el calendario del feed no trae el festivo de esta línea): ` +
    `${c.primera}–${c.ultima}, cada ${Math.round(c.intervaloS / 60)} min — ` +
    `Fuente: Avanza, ${hora}.`
  );
}
