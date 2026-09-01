/**
 * ⭐ EL DIFF DE DESVÍOS.
 *
 * ```
 *     GTFS            (lo que la línea DEBERÍA hacer)
 *   − get_stops_list  (lo que la línea ESTÁ haciendo hoy)
 *   ────────────────────────────────────────────────────
 *   = EL DESVÍO
 * ```
 *
 * ⭐ **Heredado de ZetaBus** [`003_ZETABUS/src/engine/desvios.ts`], que lo lleva
 * en producción. Se copia la doctrina entera, incluidos los frenos, porque los
 * frenos son lo que costó descubrir.
 *
 * ── ⭐ Y LO QUE LO HACE HONESTO: SE AUTO-APAGA ──────────────────────────────
 *
 * No hay ninguna lista de desvíos que mantener, ni fecha de vigencia que
 * vigilar. El día que Avanza restaure la ruta, `get_stops_list` vuelve a
 * coincidir con el GTFS, el diff sale vacío y el aviso desaparece **solo**.
 * *«Un sistema que hay que acordarse de apagar acaba mintiendo — siempre.»*
 *
 * ── ⚠️ LA ASIMETRÍA, y se dice en voz alta ──────────────────────────────────
 *
 * ```
 * DESVÍO DE RUTA       el autobús NO PASA por la calle
 *                      → la ruta operativa CAMBIA → get_stops_list lo refleja
 *                      → DETECTABLE. Es esto.
 *
 * SUPRESIÓN DE PARADA  el autobús PASA pero NO PARA
 *                      → la ruta operativa NO cambia → sigue listando la parada
 *                      → NO DETECTABLE. POR NINGUNA FUENTE.
 * ```
 *
 * Está comprobado en la auditoría de ZetaBus: con el comunicado de Avanza
 * diciendo **por escrito** que las líneas 29 y 39 hacen *«su recorrido habitual
 * pero sin realizar parada»* en el poste 744, la API viva seguía anunciando
 * «039 VADORREY, 0 minutos». Ponen el cartel en la marquesina y no desconectan
 * el poste.
 *
 * ⇒ **Esto detecta desvíos. NO detecta supresiones. Y lo dice.**
 *
 * ── ⚠️ Y AQUÍ NO ENTRA NI UN DATO VIVO ──────────────────────────────────────
 *
 * La tentación de deducir un desvío de «ese poste lleva callado toda la mañana»
 * es enorme y es un error: un poste callado puede ser un desvío, pueden ser las
 * cuatro de la mañana, o puede ser un poste que Avanza no tiene dado de alta —
 * y la API devuelve **lo mismo en los tres casos**. `compararRecorrido` recibe
 * dos listas de postes y nada más: no hay por dónde colar una llegada.
 */
import type { PatronBus, RedDeBus } from './red-bus.ts';
import { operaEl } from './red-bus.ts';
import { posteDeCodigo } from './avanza.ts';
import { recorridoDeHoy, SENTIDO_DE, type PosteDelRecorrido } from './recorrido.ts';

export interface ParadaDelDiff {
  readonly poste: number;
  readonly nombre: string;
}

export type Veredicto =
  | {
      readonly tipo: 'comparado';
      readonly hayDesvio: boolean;
      /** ⭐ La ruta que el autobús hace HOY, en orden. Es la que manda. */
      readonly real: readonly ParadaDelDiff[];
      /** En el GTFS y NO en la de hoy → el autobús ya no pasa. Se tacha. */
      readonly fuera: readonly ParadaDelDiff[];
      /** En la de hoy y NO en el GTFS → parada provisional del desvío. */
      readonly hacia: readonly ParadaDelDiff[];
      /** Mismas paradas, distinto orden. Pasa al cambiar el sentido de giro. */
      readonly reordenado: boolean;
      readonly oficiales: number;
      readonly reales: number;
    }
  /** ⚠️ NO se puede comparar. Y «no se puede» NO ES «no hay desvío». */
  | { readonly tipo: 'indeterminado'; readonly motivo: string };

/**
 * ⚠️ EL FRENO DE MANO. Si la ruta de hoy se ha «comido» más de esta fracción de
 * las paradas oficiales, **eso no es un desvío: es una lectura rota**.
 *
 * Un desvío de obras quita tres paradas, cinco, ocho. No quita el 70 % de la
 * línea. Y sin este freno el modo de fallo es el peor de todos: la pantalla
 * tacharía media línea con toda la coherencia visual del mundo, y quien la lee
 * se creería que su parada ha desaparecido.
 *
 * **Preferimos decir «no lo sé» a tachar treinta paradas que siguen ahí.**
 */
export const UMBRAL_ABSURDO = 0.5;

/** Compara las dos rutas. **Función pura**: dos listas de postes y nada más. */
export function compararRecorrido(
  oficial: readonly ParadaDelDiff[],
  real: readonly ParadaDelDiff[],
): Veredicto {
  if (oficial.length === 0) {
    return { tipo: 'indeterminado', motivo: 'el GTFS no da paradas para este sentido' };
  }
  // ⚠️ Una lista real VACÍA no significa «han quitado todas las paradas»:
  // significa que no hemos podido leerla.
  if (real.length === 0) {
    return {
      tipo: 'indeterminado',
      motivo:
        'la ruta de hoy ha llegado vacía. No se compara: daría TODAS las paradas ' +
        'por suprimidas, que es justo la mentira que esto evita.',
    };
  }

  const enOficial = new Map(oficial.map((p) => [p.poste, p]));
  const enReal = new Map(real.map((p) => [p.poste, p]));
  const fuera = oficial.filter((p) => !enReal.has(p.poste));
  const hacia = real.filter((p) => !enOficial.has(p.poste));

  const desaparecidas = fuera.length / oficial.length;
  if (desaparecidas > UMBRAL_ABSURDO) {
    return {
      tipo: 'indeterminado',
      motivo:
        `la ruta de hoy no incluye el ${Math.round(desaparecidas * 100)} % de las paradas ` +
        `oficiales (${fuera.length} de ${oficial.length}). Eso no es un desvío: es una ` +
        'lectura rota. No se tacha nada.',
    };
  }

  // Reordenado: mismas paradas, otro orden. Se mira SOLO sobre las comunes.
  const comunOficial = oficial.filter((p) => enReal.has(p.poste)).map((p) => p.poste);
  const comunReal = real.filter((p) => enOficial.has(p.poste)).map((p) => p.poste);
  const reordenado = comunOficial.join('>') !== comunReal.join('>');

  return {
    tipo: 'comparado',
    hayDesvio: fuera.length > 0 || hacia.length > 0 || reordenado,
    real,
    fuera,
    hacia,
    reordenado,
    oficiales: oficial.length,
    reales: real.length,
  };
}

/** La ruta oficial de un patrón, en postes de Avanza. */
export function oficialDe(red: RedDeBus, patron: PatronBus): ParadaDelDiff[] {
  const porId = new Map(red.paradas.map((p) => [p.id, p]));
  const salida: ParadaDelDiff[] = [];
  for (const id of patron.paradas) {
    const p = porId.get(id);
    const poste = p ? posteDeCodigo(p.codigo) : null;
    if (p && poste !== null) {
      salida.push({ poste, nombre: p.nombre });
    }
  }
  return salida;
}

/** Lo observado de un sentido, con cuándo se observó. */
export interface DesvioDeSentido {
  readonly linea: string;
  readonly direccion: string;
  readonly veredicto: Veredicto;
  readonly cuando: number;
}

/**
 * ⭐ LA CAPA DE DESVÍOS, **con su propia caché y su propio TTL de 1 hora**.
 *
 * ⚠️ Va aparte de todo lo vivo **por construcción**, no por disciplina: si este
 * TTL tocara la caché de las llegadas, la pantalla diría «llega en 2 min» con
 * un dato de hace una hora [ZetaBus, `motor.ts:32-34`]. Aquí el dato vivo de
 * Avanza no se cachea en absoluto —se pregunta en cada `Generar`— y esto se
 * cachea una hora. Son dos cosas distintas y viven en dos sitios distintos.
 */
export const TTL_DESVIOS_MS = 60 * 60_000;

const capa = new Map<string, DesvioDeSentido>();
const enVuelo = new Map<string, Promise<DesvioDeSentido>>();
let visitas = 0;

export function visitasAlRecorrido(): number {
  return visitas;
}

export function olvidarDesvios(): void {
  capa.clear();
  enVuelo.clear();
  visitas = 0;
}

export const claveDe = (linea: string, direccion: string): string => `${linea}|${direccion}`;

/**
 * Lo que se sabe del sentido, **sin salir a la red**: lo que haya en la capa y
 * no esté caducado. `null` es «no consta», y arriba eso es el recorrido oficial.
 */
export function desvioServido(
  linea: string,
  direccion: string,
  ahora: number = Date.now(),
): DesvioDeSentido | null {
  const suyo = capa.get(claveDe(linea, direccion));
  if (!suyo || ahora - suyo.cuando >= TTL_DESVIOS_MS) {
    return null;
  }
  return suyo;
}

/** Mete una observación en la capa. La usa el refresco y las jueces. */
export function servirDesvio(d: DesvioDeSentido): void {
  capa.set(claveDe(d.linea, d.direccion), d);
}

/**
 * ⭐ TRAE EL SENTIDO: de la capa si está fresco, y si no, a la fuente.
 *
 * Con **single-flight**: dos peticiones a la vez del mismo sentido hacen una
 * sola visita. Es el mismo patrón del BiZi y del poste, con la clave puesta
 * donde aquí toca.
 */
export function traerDesvio(
  red: RedDeBus,
  patron: PatronBus,
  linea: string,
  pedir: typeof fetch = fetch,
  ahora: () => number = Date.now,
): Promise<DesvioDeSentido> {
  const clave = claveDe(linea, patron.direccion);
  const fresco = desvioServido(linea, patron.direccion, ahora());
  if (fresco) {
    return Promise.resolve(fresco);
  }
  const yendo = enVuelo.get(clave);
  if (yendo) {
    return yendo;
  }
  const sentido = SENTIDO_DE[patron.direccion];
  const vuelo = (async (): Promise<DesvioDeSentido> => {
    visitas++;
    let veredicto: Veredicto;
    if (!sentido) {
      veredicto = { tipo: 'indeterminado', motivo: `la dirección ${patron.direccion} no tiene sentido de Avanza` };
    } else {
      try {
        const hoy = await recorridoDeHoy(linea, sentido, pedir, ahora);
        veredicto = compararRecorrido(
          oficialDe(red, patron),
          hoy.map((p: PosteDelRecorrido) => ({ poste: p.poste, nombre: p.nombre })),
        );
      } catch (e) {
        // ⚠️ «No he podido leerlo» y «no hay desvío» son cosas distintas, y
        // confundirlas tacharía la línea entera.
        veredicto = {
          tipo: 'indeterminado',
          motivo: `no se ha podido leer la ruta de hoy: ${(e as Error).message}`,
        };
      }
    }
    const observado: DesvioDeSentido = { linea, direccion: patron.direccion, veredicto, cuando: ahora() };
    servirDesvio(observado);
    return observado;
  })().finally(() => {
    if (enVuelo.get(clave) === vuelo) {
      enVuelo.delete(clave);
    }
  });
  enVuelo.set(clave, vuelo);
  return vuelo;
}

/**
 * ⭐ LO QUE UN PASE DE REFRESCO **HA LEÍDO**, para que quien lo aplique no tenga
 * que volver a pedirlo.
 *
 * ⚠️ **Nace de un fallo del 1/09.** El refresco leía los 64 sentidos y luego
 * `aplicarDesvios` los volvía a pedir a la caché — que puede caducar **mientras
 * el pase corre**, porque el pase tarda de 17 a 36 segundos y el TTL era el
 * mismo que el periodo del refresco. Resultado medido: 23 desvíos detectados y
 * **4** aplicados, y un viaje que mandaba subir donde el autobús no para.
 *
 * Un pase entrega lo suyo. No hay ventana entre leer y aplicar porque no hay
 * segunda lectura.
 */
export type LoLeido = ReadonlyMap<string, Veredicto>;

export interface CuentasDeDesvios {
  readonly sentidos: number;
  readonly desviados: number;
  readonly indeterminados: number;
  readonly ms: number;
}

/**
 * ⭐ EL PRECALENTADO: trae los sentidos de las líneas que operan hoy.
 *
 * ⚠️ **Con pausa entre peticiones.** Son medio centenar, y la fuente es de otro:
 * ZetaBus aparcó su «barrido de línea» justo por saturar Avanza. Aquí van de una
 * en una con un respiro entre medias, y quien busca una ruta **nunca espera a
 * esto**: la búsqueda lee la capa y, si no hay nada, usa el recorrido oficial.
 */
export async function refrescarDesvios(
  red: RedDeBus,
  fecha: string,
  pedir: typeof fetch = fetch,
  pausaMs = 250,
  ahora: () => number = Date.now,
): Promise<CuentasDeDesvios & { readonly leido: LoLeido }> {
  /** ⭐ Lo que este pase ha visto, con su clave. Ver `LoLeido`. */
  const leido = new Map<string, Veredicto>();
  const t0 = ahora();
  let desviados = 0;
  let indeterminados = 0;
  let sentidos = 0;
  for (const patron of red.patrones) {
    if (!patron.principal || patron.modo !== 'bus' || !operaEl(red, patron, fecha)) {
      continue;
    }
    const linea = red.lineas.find((l) => l.id === patron.linea)?.corto ?? patron.linea;
    sentidos++;
    const d = await traerDesvio(red, patron, linea, pedir, ahora);
    leido.set(claveDe(linea, patron.direccion), d.veredicto);
    if (d.veredicto.tipo === 'indeterminado') {
      indeterminados++;
    } else if (d.veredicto.hayDesvio) {
      desviados++;
    }
    if (pausaMs > 0) {
      await new Promise((sigue) => setTimeout(sigue, pausaMs));
    }
  }
  return { sentidos, desviados, indeterminados, ms: ahora() - t0, leido };
}
