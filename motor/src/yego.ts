/**
 * ⭐ LA FLOTA VIVA DE YeGo (4/09, punto 13 casilla 2).
 *
 * Dónde está cada moto compartida **en este momento**, cuál se puede coger y
 * cuánta autonomía le queda. No rutea nada —eso es `viaje-yego.ts`—: habla con
 * el feed, lo lee, lo guarda el rato que el propio feed dice, y sabe decir
 * cuáles quedan cerca de un punto.
 *
 * La ficha entera de la fuente está en **§ 1.34** del notices: qué publica, qué
 * trae de roto, y por qué la licencia es un `NO CONSTA` con nombre y apellidos.
 *
 * ── ⭐ AQUÍ SE CACHEA, Y CON LA BiZi NO. No es una excepción ────────────────
 *
 * `bizi.ts` lleva escrito desde el 30/08 por qué la disponibilidad se pide **en
 * cada ruta**: la sede no dice cada cuánto se actualiza, y guardar un «quedan 3
 * bicis» es guardar una promesa que puede ser falsa antes de pintarse.
 *
 * Con YeGo la respuesta es la contraria **porque la fuente es distinta**, no
 * porque nos convenga:
 *
 *   · **El feed declara su propia frescura**: `ttl: 240` en los seis feeds. La
 *     especificación GBFS lo pone justamente para esto — es el operador
 *     diciendo cada cuánto tiene sentido volver.
 *   · **Y se comprobó que es verdad**: tres lecturas separadas 20 s el 5/09
 *     devolvieron **el mismo `last_updated`**. Pedirlo antes no trae dato nuevo;
 *     trae otra vez los mismos 59 kB y se los cobra al operador.
 *   · **Y la edad se enseña.** Un dato guardado sin decir de cuándo es sería la
 *     mentira que la BiZi evita. Aquí se dice: «datos de YeGo de hace X min».
 *
 * ⚠️ **Lo que NO se cachea es el silencio.** Si YeGo no contesta, la siguiente
 *    consulta vuelve a preguntar. Guardar un fallo cuatro minutos dejaría la
 *    aplicación muda por un corte de red de un segundo.
 *
 * ── ⚠️ Y la hora del dato es la del FEED, no la de cada moto ────────────────
 *
 * `free_bike_status` trae `last_reported` por vehículo, y **no vale**: § 1.34 lo
 * mide — las 166 motos traen el mismo valor al segundo, idéntico al
 * `last_updated` del sobre. Es el sello del volcado, no la hora en que reportó
 * cada una. Así que la única edad que se puede decir con verdad es la del feed,
 * y es la que se guarda.
 */

import { metrosEntre } from './cercano.ts';

/** El feed que el motor pide. Los otros cinco se leyeron una vez, en § 1.34. */
export const URL_FLOTA =
  'https://services.rideyego.com/gbfs/2-3/zaragoza/es/free_bike_status';

/**
 * ⭐ LO QUE EL PROPIO FEED DICE QUE DURA: **240 segundos**.
 *
 * No es un número nuestro. Viene en `ttl`, en los seis feeds, y es el contrato
 * de frescura que el operador publica. Se respeta tal cual en vez de elegir uno
 * más corto «por si acaso»: elegirlo nosotros sería no creerle al que lo sabe.
 */
export const TTL_S = 240;

/**
 * ⭐ EL TOPE: **4 segundos**, los mismos que Avanza.
 *
 * El feed son 59 kB y contesta rápido, pero el número no se pone por lo que
 * suele tardar: se pone por lo que se está dispuesto a esperar con una pantalla
 * delante. Es el de `avanza.ts`, que lleva medido desde el 31/08.
 */
export const ESPERA_MS = 4000;

/** Y un reintento con 300 ms de espera, como Avanza. El peor caso son 8,3 s. */
export const BACKOFF_MS = 300;
export const REINTENTOS = 1;

/**
 * ⭐ EL TIPO QUE SE USA, y **se selecciona por el id, nunca por `form_factor`**.
 *
 * ⚠️ § 1.34 mide por qué: los `form_factor` de `vehicle_types` están **cruzados**
 *    con sus propios nombres — la «Bicicleta eléctrica» se declara `scooter` y
 *    el «Patinete eléctrico» se declara `bicycle`—. Solo `yego_scooter` tiene el
 *    suyo bien (`moped`). Hoy la flota de Zaragoza es **166 de 166
 *    `yego_scooter`**, así que el defecto no muerde; el día que YeGo suelte
 *    bicis o patinetes aquí, seleccionar por la forma cogería el vehículo
 *    equivocado. El id no miente.
 */
export const TIPO_QUE_SE_USA = 'yego_scooter';

/**
 * ⭐ EL TECHO DE UN CICLOMOTOR: **45 km/h**.
 *
 * No es una elección: es la categoría. Un ciclomotor de dos ruedas es **L1e-B**
 * [Reglamento (UE) 168/2013, anexo I], definido por *«velocidad máxima por
 * construcción ≤ 45 km/h»*, y el Reglamento General de Circulación le pone el
 * mismo techo — [RGC art. 48, tabla de velocidades máximas: los ciclomotores,
 * 45 km/h en cualquier vía—]. Y **YeGo lo declara él mismo**: `vehicle_types`
 * publica `max_permitted_speed: 45` para el `yego_scooter`.
 *
 * Se usa para **capar la red del coche**, no para sustituirla: ver
 * `viaje-yego.ts`. Una calle de 50 se recorre a 45; una de 30, a 30.
 */
export const TOPE_KMH = 45;

/** Una moto compartida, reducida a lo que el motor mira. */
export interface MotoDeYego {
  /** El `bike_id` del feed. ⛔ Es un UUID **rotado por privacidad** [GBFS 2.3]. */
  readonly id: string;
  readonly lon: number;
  readonly lat: number;
  /** `current_range_meters`: lo que le queda de batería, en metros. */
  readonly autonomiaM: number;
  /** `current_fuel_percent` ×100, o `null` si no lo trae. Solo para contarlo. */
  readonly bateriaPct: number | null;
}

export interface FlotaViva {
  /** Las que se pueden coger: ni reservadas, ni deshabilitadas, ni de otro tipo. */
  readonly motos: readonly MotoDeYego[];
  /** El `last_updated` del feed. **La hora del dato**, y la única fiable. */
  readonly cuando: Date;
  /** Cuántos vehículos traía el feed en total, viables o no. Para declararlo. */
  readonly total: number;
}

/** Un vehículo del feed, de lo que aquí se mira. */
interface VehiculoCrudo {
  readonly bike_id?: unknown;
  readonly lat?: unknown;
  readonly lon?: unknown;
  readonly is_reserved?: unknown;
  readonly is_disabled?: unknown;
  readonly vehicle_type_id?: unknown;
  readonly current_range_meters?: unknown;
  readonly current_fuel_percent?: unknown;
}

/**
 * ⭐ LEE EL FEED, o `null` si no se puede fiar.
 *
 * Sin `last_updated` **no vale**, aunque venga la lista entera: sin hora del
 * dato no hay edad que decir, y decir una edad inventada es peor que no decir
 * ninguna. Es la misma cautela que el BiZi tiene con las cifras que faltan.
 */
export function leerFlota(cuerpo: unknown): FlotaViva | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null;
  }
  const sobre = cuerpo as { readonly last_updated?: unknown; readonly data?: unknown };
  if (typeof sobre.last_updated !== 'number' || !Number.isFinite(sobre.last_updated)) {
    return null;
  }
  const datos = sobre.data;
  if (typeof datos !== 'object' || datos === null) {
    return null;
  }
  const lista = (datos as { readonly bikes?: unknown }).bikes;
  if (!Array.isArray(lista)) {
    return null;
  }
  const motos: MotoDeYego[] = [];
  for (const crudo of lista as readonly VehiculoCrudo[]) {
    if (crudo.vehicle_type_id !== TIPO_QUE_SE_USA) {
      continue;
    }
    // ⭐ Los dos campos de la especificación que dicen si se puede coger. Un
    //    `undefined` **no se trata como `false`**: si el feed no lo dice, no se
    //    sabe, y una moto que no se sabe si está libre no se ofrece.
    if (crudo.is_reserved !== false || crudo.is_disabled !== false) {
      continue;
    }
    if (typeof crudo.lon !== 'number' || typeof crudo.lat !== 'number') {
      continue;
    }
    // Sin autonomía declarada no se puede comprobar que llegue, y suponerle una
    // sería exactamente el fallo que la juez de la autonomía persigue.
    if (typeof crudo.current_range_meters !== 'number') {
      continue;
    }
    motos.push({
      id: String(crudo.bike_id ?? ''),
      lon: crudo.lon,
      lat: crudo.lat,
      autonomiaM: crudo.current_range_meters,
      bateriaPct:
        typeof crudo.current_fuel_percent === 'number' ? crudo.current_fuel_percent : null,
    });
  }
  return { motos, cuando: new Date(sobre.last_updated * 1000), total: lista.length };
}

/** Una moto candidata, con lo lejos que quedó en recta del punto que se pidió. */
export interface MotoCerca extends MotoDeYego {
  /**
   * Metros en línea recta. **Solo para podar y para poder declararlo**: lo que
   * decide es el coste. Mismo papel que `enRecta` en los aparcamotos.
   */
  readonly enRecta: number;
}

/**
 * ⭐ LAS `cuantas` MOTOS MÁS CERCANAS EN RECTA a un punto.
 *
 * ⚠️ **La recta solo PODA, y el número es de RENDIMIENTO.** No es un radio: no
 *    hay ninguna distancia a partir de la cual una moto «no existe». Quien elige
 *    es el coste —andar hasta ella más rodar hasta el destino—, y esta lista
 *    solo evita hacer ese cálculo 138 veces. Mismo papel y misma razón que los
 *    40 aparcamotos del remate y los 40 postes del bus.
 */
export function motosCerca(
  flota: FlotaViva,
  lon: number,
  lat: number,
  cuantas: number,
): readonly MotoCerca[] {
  return flota.motos
    .map((m) => ({ ...m, enRecta: metrosEntre(lat, lon, m.lat, m.lon) }))
    .sort((a, b) => a.enRecta - b.enRecta)
    .slice(0, cuantas);
}

/**
 * ⭐ CÓMO SE DICE LA EDAD DEL DATO. La mitad que hace honesta a la caché.
 *
 * Por debajo del minuto **no se redondea a «hace 1 min»**, que sería inflar
 * cinco segundos hasta sesenta: se dice «hace menos de 1 min», que es verdad y
 * es igual de corto. Es la misma regla que `comoSeLeeLaDuracion` en la pantalla.
 *
 * ⚠️ Y un reloj que fuera para atrás —el del servidor contra el del feed— no
 *    produce «hace -2 min»: se corta en cero. Un desfase de relojes no es una
 *    noticia que darle a nadie.
 */
export function edadEnPalabras(cuando: Date, ahora: Date = new Date()): string {
  const segundos = Math.max(0, (ahora.getTime() - cuando.getTime()) / 1000);
  if (segundos < 60) {
    return 'hace menos de 1 min';
  }
  return `hace ${Math.floor(segundos / 60)} min`;
}

/** Quién sale a la red. Se inyecta para que las jueces no toquen YeGo. */
export type Pedir = (url: string) => Promise<{ readonly ok: boolean; readonly cuerpo: unknown }>;

/** La de verdad: `fetch` con el tope duro, como Avanza y como la BiZi. */
const porLaRed: Pedir = async (url) => {
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MS) });
    if (!respuesta.ok) {
      return { ok: false, cuerpo: null };
    }
    return { ok: true, cuerpo: await respuesta.json() };
  } catch {
    // ⚠️ Se traga TODO, y a propósito: `AbortSignal.timeout` lanza
    //    `TimeoutError`, un DNS caído lanza otra cosa, y un cuerpo que no es
    //    JSON lanza una tercera. Para quien llama son la misma noticia — «no se
    //    ha podido preguntar»— y el viaje se ofrece igual sin el vivo.
    return { ok: false, cuerpo: null };
  }
};

/** Lo guardado, con hasta cuándo vale. `null` mientras no se ha pedido nada. */
let guardada: { readonly flota: FlotaViva; readonly hasta: number } | null = null;

/** El vuelo en curso, si lo hay. Es el *single-flight*, igual que en la BiZi. */
let enVuelo: Promise<FlotaViva | null> | null = null;

/**
 * ⭐ Tira lo guardado. **Solo para las jueces**, que si no se contaminan entre
 * sí: la caché es de módulo y sobrevive de un `test` al siguiente.
 */
export function olvidarLaFlota(): void {
  guardada = null;
  enVuelo = null;
}

/** Una pasada al feed, con su reintento. `null` si no hay nada de fiar. */
async function consultarAYego(pedir: Pedir): Promise<FlotaViva | null> {
  for (let intento = 0; ; intento++) {
    const respuesta = await pedir(URL_FLOTA);
    const flota = respuesta.ok ? leerFlota(respuesta.cuerpo) : null;
    if (flota || intento >= REINTENTOS) {
      return flota;
    }
    await new Promise((sigue) => setTimeout(sigue, BACKOFF_MS));
  }
}

/**
 * ⭐ LA FLOTA, con caché de `ttl` y *single-flight*.
 *
 * Los dos mecanismos se suman y no son el mismo: **la caché evita las consultas
 * que llegan DESPUÉS** y el single-flight **las que llegan A LA VEZ**. Sin el
 * segundo, diez rutas simultáneas con la caché fría harían diez peticiones.
 *
 * ⚠️ **El silencio no se guarda**: cuando no hay flota, `guardada` se queda como
 *    estaba y la siguiente consulta vuelve a salir. Ver la cabecera.
 */
export async function laFlotaViva(pedir: Pedir = porLaRed): Promise<FlotaViva | null> {
  const ahora = Date.now();
  if (guardada !== null && ahora < guardada.hasta) {
    return guardada.flota;
  }
  if (enVuelo !== null) {
    return enVuelo;
  }
  const vuelo = consultarAYego(pedir)
    .then((flota) => {
      if (flota) {
        guardada = { flota, hasta: Date.now() + TTL_S * 1000 };
      }
      return flota;
    })
    .finally(() => {
      // Solo la bandera de ESTE vuelo se borra: si otro entró por medio, es suyo.
      if (enVuelo === vuelo) {
        enVuelo = null;
      }
    });
  enVuelo = vuelo;
  return vuelo;
}
