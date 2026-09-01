/**
 * ⭐ LO QUE AVANZA DICE DE UN POSTE AHORA MISMO.
 *
 * ── Por qué, y qué manda ────────────────────────────────────────────────────
 *
 * El principio de GTFS-Realtime: **lo real desplaza a lo programado**. Nuestra
 * espera es una estimación —`H/2` sobre el horario publicado—, y si Avanza dice
 * que el próximo llega en 7 minutos, **ese número sustituye a la estimación**
 * para el primer vehículo del viaje.
 *
 * ── La forma, MEDIDA una vez contra el servidor ─────────────────────────────
 *
 * `POST https://gps.avanzabus.com/index.php/zaragoza/fRefrescaEmpresaExternos`
 * con `poste=<n>&coche=0` — `coche=0` es «todos», que es lo que manda su propia
 * web [ZetaBus, `poste.ts`]. Medido el 31/08 contra el poste 1000:
 *
 * ```
 * http=200 · Content-Type: text/html; charset=UTF-8 · 2.927 bytes
 * ```
 *
 * ⚠️ **Y a pesar del `text/html`, el cuerpo es JSON.** Un objeto con dos claves:
 *
 *   · `maquinas` — un objeto indexado por número. El `0` es **la parada misma**
 *     (su `title` es el nombre del poste); los demás son vehículos, y su `title`
 *     es **`"053 4937"`**: línea y coche, separados por un espacio y **sin una
 *     sola etiqueta HTML por medio**.
 *   · `tablatiempos` — un trozo de HTML con `<strong>053<i…></i>MIRALBUENO</strong>`
 *     y un enlace por coche: `…/fParadas/1000/4937">4937 [0 mins]`.
 *
 * ⚠️ **La cicatriz de ZetaBus, comprobada aquí:** el `.text` de ese `<strong>`
 * devuelve `053MIRALBUENO` **pegado**, porque el `<i>` no aporta texto. Un regex
 * que parta por espacios se come el destino o se lleva la línea de propina. Por
 * eso **la línea NO se saca de ahí**: se saca de `maquinas[i].title`, que es
 * JSON y no tiene el problema. Cero dependencias y cero parser de HTML.
 *
 * ── ⭐ EL REGALO: la fuente trae su propio contador de control ──────────────
 *
 * El mismo hecho —«el coche 4937 viene hacia aquí»— viaja por **dos caminos
 * independientes** dentro de la misma respuesta: los `title` de `maquinas` y los
 * `[N mins]` de `tablatiempos`. [L1: un extractor necesita un contador
 * INDEPENDIENTE, y contar con el mismo método con el que extraes no verifica
 * nada.] Aquí no hay que inventárselo: **se cruzan los dos y, si no cuadran, no
 * se dice nada** — se cae al plan D-G, que es lo honrado cuando la fuente se
 * contradice.
 */

/** El endpoint, el mismo que ZetaBus usa en producción. */
// ⚠️ `Response.text()` ignora el charset declarado [WHATWG Fetch]. Ver `texto.ts`.
import { textoDe } from './texto.ts';

export const URL_POSTE = 'https://gps.avanzabus.com/index.php/zaragoza/fRefrescaEmpresaExternos';

/**
 * ⭐ EL TOPE: **4 segundos**, y el número no es mío.
 *
 * ⚠️ Eran 3.000 hasta el 31/08, y se quedón cortos: medida la latencia real
 * contra el mismo endpoint, el poste 532 (Jorge Cocci 17) da **mediana 2.139 ms
 * y máximo 2.838** en cinco llamadas seguidas, y hasta **2.736** con dos
 * peticiones en paralelo. Margen de 200 ms. Antonio vio la línea 30 marcada
 * como «muda» en ese poste mientras la web de Avanza contestaba con **cuatro
 * coches**: no era la fuente, era el tope.
 *
 * Los 4.000 son los de **ZetaBus**, que lleva meses en producción contra este
 * mismo servidor [`003_ZETABUS/src/sources/avanza/transporte.ts:157`].
 */
export const ESPERA_MS = 4000;

/**
 * ⭐ Y UN REINTENTO, con **300 ms** de espera entre los dos [ZetaBus,
 * `transporte.ts:159` y `:172` — *«una petición a Avanza, con timeout duro y un
 * reintento»*].
 *
 * Uno, no tres: la pantalla está esperando, y el peor caso son 8,3 s. El
 * indicador de espera existe justamente para ese rato.
 */
export const BACKOFF_MS = 300;
export const REINTENTOS = 1;

export interface LlegadaViva {
  /** El nombre corto de la línea, ya normalizado: `053` llega como `53`. */
  readonly linea: string;
  /** Minutos hasta que llegue, tal como Avanza los da. */
  readonly minutos: number;
  /** El coche, que es lo que permite cruzar los dos canales. */
  readonly coche: string;
}

export interface LecturaDePoste {
  readonly poste: number;
  /** El nombre que Avanza le da al poste. Sirve para comprobar que es el suyo. */
  readonly nombre: string;
  readonly llegadas: readonly LlegadaViva[];
  readonly cuando: Date;
}

/**
 * ⭐ Normaliza el nombre de una línea para poder cruzarla con el feed.
 *
 * Avanza escribe `053` y el GTFS escribe `53`. Se quitan los ceros de delante
 * **solo si lo que queda sigue siendo algo**: `N7` y `Ci1` no se tocan, y un
 * hipotético `000` no se convierte en cadena vacía.
 */
export function normalizarLinea(linea: string): string {
  const limpio = linea.trim();
  const sinCeros = limpio.replace(/^0+/, '');
  return sinCeros.length > 0 ? sinCeros : limpio;
}

/**
 * Lee la respuesta medida y saca las llegadas, **o `null` si no se puede fiar**.
 *
 * `null` no es «no hay buses»: es «no lo sabemos», y se dice distinto. Devuelve
 * `null` cuando el cuerpo no es el JSON esperado o cuando **los dos canales no
 * cuadran**.
 */
export function leerRespuesta(poste: number, cuerpo: string, cuando: Date): LecturaDePoste | null {
  let json: { maquinas?: Record<string, unknown>; tablatiempos?: unknown };
  try {
    json = JSON.parse(cuerpo) as typeof json;
  } catch {
    return null;
  }
  const maquinas = json.maquinas;
  if (!maquinas || typeof maquinas !== 'object') {
    return null;
  }

  // ── Canal 1: los `title` de `maquinas`, que son JSON puro ─────────────────
  let nombre = '';
  const porCoche = new Map<string, string>();
  for (const [clave, valor] of Object.entries(maquinas)) {
    const title = (valor as { title?: unknown })?.title;
    if (typeof title !== 'string') {
      continue;
    }
    const m = /^(\S+)\s+(\d+)$/.exec(title.trim());
    if (m) {
      porCoche.set(m[2]!, normalizarLinea(m[1]!));
    } else if (clave === '0') {
      // El índice 0 es la parada: su `title` es el nombre del poste.
      nombre = title.trim();
    }
  }

  // ── Canal 2: los `[N mins]` de `tablatiempos` ─────────────────────────────
  const tabla = typeof json.tablatiempos === 'string' ? json.tablatiempos : '';
  const minutosDe = new Map<string, number>();
  for (const m of tabla.matchAll(/(\d+)\s*\[(\d+)\s*mins?\]/g)) {
    minutosDe.set(m[1]!, Number(m[2]));
  }

  // ── El cruce. Si los dos canales no hablan de los mismos coches, se calla ──
  if (porCoche.size !== minutosDe.size) {
    return null;
  }
  const llegadas: LlegadaViva[] = [];
  for (const [coche, linea] of porCoche) {
    const minutos = minutosDe.get(coche);
    if (minutos === undefined) {
      // Un coche en un canal y no en el otro: la fuente se contradice.
      return null;
    }
    llegadas.push({ linea, minutos, coche });
  }
  llegadas.sort((a, b) => a.minutos - b.minutos || a.coche.localeCompare(b.coche));
  return { poste, nombre, llegadas, cuando };
}

/**
 * ⭐ LAS CONSULTAS EN VUELO, **una por poste**.
 *
 * Es el mismo single-flight del BiZi [request coalescing; `singleflight` de Go],
 * con una diferencia: allí hay **una** consulta posible y aquí hay una **por
 * poste**, así que la clave es el poste. Un `Generar` que suba dos veces en el
 * mismo poste —ida y vuelta de un transbordo, por ejemplo— hace **una** visita.
 *
 * ⚠️ Y sigue **sin ser una caché**: en cuanto la consulta termina, su hueco se
 * suelta y la siguiente vuelve a salir a la red. La frescura por `Generar` es la
 * conducta firmada.
 */
const enVuelo = new Map<number, Promise<LecturaDePoste | null>>();

/** Cuántas consultas se han hecho de verdad. Para poder contarlas en las jueces. */
let visitas = 0;

export function visitasHechas(): number {
  return visitas;
}

export function reiniciarVisitas(): void {
  visitas = 0;
  reintentos = 0;
}

/** Una sola petición, con su tope duro. `null` es «no lo sabemos». */
async function unaVez(poste: number, pedir: typeof fetch): Promise<LecturaDePoste | null> {
  try {
    const r = await pedir(URL_POSTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ poste: String(poste), coche: '0' }).toString(),
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (!r.ok) {
      // ⚠️ Un 500, un 403 del cortafuegos o un 302 a mantenimiento NO son «no
      // hay autobuses»: son «no lo sabemos». Se dicen distinto [ZetaBus].
      return null;
    }
    return leerRespuesta(poste, await textoDe(r), new Date());
  } catch {
    // Red caída, tiempo agotado, cuerpo ilegible. Todos son lo mismo desde
    // aquí: la fuente no ha contestado.
    return null;
  }
}

/** Cuántos reintentos se han gastado. Para poder contarlos en las jueces. */
let reintentos = 0;

export function reintentosHechos(): number {
  return reintentos;
}

/**
 * La consulta con su reintento [ZetaBus]. Una **visita** es un poste
 * preguntado, no una petición HTTP: el reintento va dentro y se cuenta aparte.
 */
async function consultar(poste: number, pedir: typeof fetch): Promise<LecturaDePoste | null> {
  visitas++;
  for (let intento = 0; ; intento++) {
    const lectura = await unaVez(poste, pedir);
    if (lectura || intento >= REINTENTOS) {
      return lectura;
    }
    reintentos++;
    await new Promise((sigue) => setTimeout(sigue, BACKOFF_MS));
  }
}

export function llegadasDelPoste(
  poste: number,
  pedir: typeof fetch = fetch,
): Promise<LecturaDePoste | null> {
  const yendo = enVuelo.get(poste);
  if (yendo) {
    return yendo;
  }
  const vuelo = consultar(poste, pedir).finally(() => {
    if (enVuelo.get(poste) === vuelo) {
      enVuelo.delete(poste);
    }
  });
  enVuelo.set(poste, vuelo);
  return vuelo;
}

/**
 * ⭐ LO QUE AVANZA DICE DE **UNA LÍNEA** EN UN POSTE — y son CUATRO estados.
 *
 * Aplastar esto a «hay minutos / no hay minutos» sería mentir en tres de los
 * cuatro casos, y los tres se leen distinto en pantalla:
 *
 *   · `llega` — la línea está en el poste y faltan N minutos. **Manda sobre el
 *     horario** [GTFS-Realtime].
 *   · `ausente` — la fuente contestó, y en su lista **esa línea no está**. Eso
 *     es un hecho de ahora mismo, no un fallo: se dice y se sigue con la
 *     estimación del horario.
 *   · `mudo` — no contestó, o se contradijo. **No lo sabemos**, que es el plan
 *     D-G. ⚠️ Confundirlo con `ausente` sería convertir un fallo de red en
 *     «esa línea no pasa», que es justo la mentira que ZetaBus nos enseñó a no
 *     cometer.
 *   · `sinFuente` — ni se preguntó, porque Avanza **no cubre este poste**: el
 *     tranvía no tiene `stop_code` de los suyos. No hay nada que avisar; lo
 *     que falta no es el dato, es la fuente.
 */
export type EstadoVivo =
  | { readonly clase: 'llega'; readonly minutos: number; readonly cuando: Date }
  | { readonly clase: 'ausente'; readonly cuando: Date }
  | { readonly clase: 'mudo' }
  | { readonly clase: 'sinFuente' };

/**
 * Lee una lectura de poste buscando UNA línea. `corto` es el nombre del feed
 * (`53`), y se normaliza el de Avanza (`053`) para poder cruzarlos.
 *
 * De los coches de esa línea se queda con **el primero que llega**, que es el
 * que se va a coger.
 */
export function estadoVivoDe(lectura: LecturaDePoste | null, corto: string): EstadoVivo {
  if (!lectura) {
    return { clase: 'mudo' };
  }
  const suyas = lectura.llegadas.filter((l) => l.linea === normalizarLinea(corto));
  if (suyas.length === 0) {
    return { clase: 'ausente', cuando: lectura.cuando };
  }
  return {
    clase: 'llega',
    minutos: Math.min(...suyas.map((l) => l.minutos)),
    cuando: lectura.cuando,
  };
}

/**
 * ⭐ LA COORDENADA DE UN POSTE, del mismo feed de llegadas.
 *
 * `maquinas["0"]` es **la parada misma**, y trae sus `coordenadas`. Es la
 * técnica con la que ZetaBus fabricó su fichero de los nueve postes que solo
 * existen en Avanza [`003_ZETABUS/data/postes-solo-barrido-coordenadas.json`]:
 * *«del feed de LLEGADAS por poste, que devuelve el marcadorParada»*.
 *
 * Hace falta para las paradas **provisionales** de un desvío: existen hoy, el
 * GTFS no las conoce, y sin coordenada no se pueden pintar ni rutear — regla B
 * de la casa, **sin coordenada no existe**.
 */
export function coordenadaDe(cuerpo: string): { readonly lat: number; readonly lon: number } | null {
  let json: { maquinas?: Record<string, unknown> };
  try {
    json = JSON.parse(cuerpo) as typeof json;
  } catch {
    return null;
  }
  const parada = json.maquinas?.['0'] as { coordenadas?: Record<string, unknown> } | undefined;
  const punto = parada?.coordenadas?.['0'] as { LAT?: unknown; LON?: unknown } | undefined;
  const lat = Number(punto?.LAT);
  const lon = Number(punto?.LON);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
    return null;
  }
  return { lat, lon };
}

/** La coordenada de un poste, preguntando. `null` si no se sabe. */
export async function coordenadaDelPoste(
  poste: number,
  pedir: typeof fetch = fetch,
): Promise<{ readonly lat: number; readonly lon: number } | null> {
  try {
    const r = await pedir(URL_POSTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ poste: String(poste), coche: '0' }).toString(),
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    return r.ok ? coordenadaDe(await textoDe(r)) : null;
  } catch {
    return null;
  }
}

/** El número de poste que Avanza entiende, sacado del `stop_code` del feed. */
export function posteDeCodigo(codigo: string): number | null {
  const m = /^PA0*(\d+)$/.exec(codigo.trim());
  return m ? Number(m[1]) : null;
}
