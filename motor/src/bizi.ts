/**
 * EL BiZi: las 276 estaciones de bici pública, y **cuántas bicis hay ahora**.
 *
 * Son dos cosas de dos sitios distintos, y el fichero las tiene separadas a
 * propósito porque tienen dos vidas distintas:
 *
 * 1. **EL INVENTARIO** (§ 1.8 del notices) — dónde está cada estación, cómo se
 *    llama y cuántos anclajes tiene. Vive en el repositorio, en las seis
 *    páginas tal y como el WFS las sirvió, y **no caduca**. Se carga una vez al
 *    arrancar, como el grafo.
 * 2. **LA DISPONIBILIDAD** — cuántas bicis y cuántos anclajes libres tiene cada
 *    estación **en este segundo**. No está en el repositorio y no puede estar:
 *    la sirve en vivo la API de la sede de zaragoza.es y cambia cada minuto.
 *
 * ── ⭐ Por qué la disponibilidad se pide EN CADA RUTA y no se cachea ────────
 *
 * [DOC GBFS, la especificación de referencia de la bici pública] `station_status`
 * es el feed **dinámico**: `num_bikes_available` y `num_docks_available` por
 * estación, con su `last_reported`, y se consume en vivo. [DOC OTP] filtra las
 * estaciones **por disponibilidad en el momento de planificar**, excluyendo las
 * llenas y las vacías. Guardar la respuesta y reutilizarla en la siguiente ruta
 * sería contestar con un número que ya no es cierto — y el número es justo lo
 * que se enseña.
 *
 * ⚠️ **La API de la sede NO es GBFS**, y eso está sondeado y declarado: es un
 * formato propio, sin clave, paginado, con los campos `bicisDisponibles`,
 * `anclajesDisponibles`, `estado` y `lastUpdated`. El mapeo con GBFS está en la
 * tabla de abajo, campo a campo, para que se vea qué es equivalencia y qué es
 * traducción nuestra.
 *
 * ── ⚠️ EL CAMPO ROTO, y por qué se usa `estado` y no `estadoEstacion` ───────
 *
 * `estadoEstacion` apunta a una URI del vocabulario de datos abiertos… y en las
 * **276 de 276** apunta a `…/no-operativa`. Sondeado el 28/08 y **vuelto a
 * sondear el 30/08**: sigue igual. La misma estación trae a la vez
 * `estado: "IN_SERVICE"`, ese `estadoEstacion` que dice no-operativa, y una
 * descripción que dice «Estado: Operativa». Tres afirmaciones y al menos dos
 * falsas. **Se usa `estado`**, que es el único que discrimina — el 30/08 daba
 * 275 `IN_SERVICE` y 1 `MAINTENANCE`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dentroDelEntorno, type Entorno } from './gacetero.ts';
import { metrosEntre } from './cercano.ts';

/**
 * Las seis páginas del WFS, **tal y como se descargaron**. No se juntan en un
 * fichero: juntarlas sería fabricar uno que nadie publicó. Se unen al leer.
 */
const PAGINAS = [0, 50, 100, 150, 200, 250].map((n) =>
  fileURLToPath(new URL(`../../app/data/2026-08-02_wfs_bizi_pag${n}.json`, import.meta.url)),
);

/**
 * ⭐ LA API VIVA de la sede de zaragoza.es. Sin clave, con CORS abierto.
 *
 * `rows=300` porque el defecto es 50 y las estaciones son 276: sin el
 * parámetro haría falta paginar seis veces para lo mismo. Sondeado el 30/08:
 * 200 en 0,35 s, 248 kB, `totalCount` 276 y 276 devueltas.
 */
const API = 'https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/estacion-bicicleta.json?rows=300';

/**
 * ⭐ Cuánto se espera a la API antes de darla por callada: **3 s**.
 *
 * Sondeada el 30/08 contestó en **0,35 s**, así que 3 s son casi diez veces su
 * tiempo medido. Más sería tener a alguien mirando una pantalla parada por un
 * servicio que ya se sabe que no va a contestar; menos sería declarar caída una
 * API que solo iba lenta. Cuando salta, la ruta **sigue saliendo**: con el
 * inventario y con su aviso. Ver `disponibilidadDeBiZi`.
 */
const ESPERA_MS = 3000;

/** Una estación del inventario: lo que no cambia. */
export interface EstacionBiZi {
  /** El número de estación, que es como se la conoce en la calle. */
  readonly numero: number;
  /** Cómo se llama: «Comuneros: Minguijón». Es lo que dice el hito. */
  readonly nombre: string;
  readonly lon: number;
  readonly lat: number;
  /** Cuántos anclajes tiene en total. Capacidad, no disponibilidad. */
  readonly anclajes: number;
}

export interface BiZiEnMemoria {
  readonly estaciones: readonly EstacionBiZi[];
  /** Por número, que es la clave con la que casa la API viva. */
  readonly porNumero: ReadonlyMap<number, EstacionBiZi>;
  readonly anclajes: number;
  /** ⚠️ Las que se caen por la regla B o por la frontera. */
  readonly sinCoordenada: number;
  readonly fueraDelEntorno: number;
  readonly cargadoEnMs: number;
}

/** Lo que la API viva dice de UNA estación, ahora mismo. */
export interface EstadoDeEstacion {
  /** `num_bikes_available` de GBFS. */
  readonly bicis: number;
  /** `num_docks_available` de GBFS. */
  readonly anclajesLibres: number;
  /** `IN_SERVICE` o `MAINTENANCE`. El equivalente de `is_renting`/`is_installed`. */
  readonly enServicio: boolean;
  /** `last_reported` de GBFS, **por estación**: la hora de ESTE dato. */
  readonly cuando: Date;
}

/** Lo que se sabe de la disponibilidad, o el silencio de la API. */
export interface Disponibilidad {
  /** Por número de estación. Vacío nunca: si no hay datos, esto es `null`. */
  readonly porNumero: ReadonlyMap<number, EstadoDeEstacion>;
  /** Cuántas estaciones vinieron, y cuántas en mantenimiento. */
  readonly total: number;
  readonly enMantenimiento: number;
  readonly enMs: number;
}

/** Un rasgo del WFS del inventario, de lo que aquí se mira. */
interface RasgoCrudo {
  readonly geometry: { readonly coordinates: readonly number[] } | null;
  readonly properties: {
    readonly numero: number;
    readonly nombre: string;
    readonly anclajes_bicicletas: number;
  };
}

/**
 * Carga las 276 estaciones de las seis páginas.
 *
 * Se comprueba la coordenada con el mismo rectángulo del gacetero que se aplica
 * a los aparcabicis y por lo mismo: **una coordenada publicada no se cree, se
 * comprueba**. Y se comprueba que no haya dos con el mismo número, porque el
 * número es la clave con la que luego casa la API viva: si se repitiera, la
 * disponibilidad de una estación acabaría contada en otra.
 */
export function cargarBiZi(entorno: Entorno): BiZiEnMemoria {
  const principio = performance.now();
  const estaciones: EstacionBiZi[] = [];
  const porNumero = new Map<number, EstacionBiZi>();
  let anclajes = 0;
  let sinCoordenada = 0;
  let fueraDelEntorno = 0;

  for (const pagina of PAGINAS) {
    const crudo = JSON.parse(readFileSync(pagina, 'utf8')) as {
      readonly features: readonly RasgoCrudo[];
    };
    for (const rasgo of crudo.features) {
      const c = rasgo.geometry?.coordinates;
      if (!c || c.length < 2 || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) {
        sinCoordenada++;
        continue;
      }
      const lon = c[0]!;
      const lat = c[1]!;
      if (!dentroDelEntorno(entorno, lon, lat)) {
        fueraDelEntorno++;
        continue;
      }
      const p = rasgo.properties;
      const estacion: EstacionBiZi = {
        numero: p.numero,
        nombre: p.nombre,
        lon,
        lat,
        anclajes: p.anclajes_bicicletas ?? 0,
      };
      if (porNumero.has(estacion.numero)) {
        // Dos estaciones con el mismo número romperían el cruce con la API
        // viva. No pasa —comprobado: 276 números distintos— y si pasara, esta
        // línea es la que hay que mirar.
        continue;
      }
      porNumero.set(estacion.numero, estacion);
      estaciones.push(estacion);
      anclajes += estacion.anclajes;
    }
  }

  return {
    estaciones,
    porNumero,
    anclajes,
    sinCoordenada,
    fueraDelEntorno,
    cargadoEnMs: performance.now() - principio,
  };
}

/** Un rasgo de la API viva, de lo que aquí se mira. */
interface RasgoVivo {
  readonly title?: string;
  readonly estado?: string;
  readonly bicisDisponibles?: number;
  readonly anclajesDisponibles?: number;
  readonly lastUpdated?: string;
}

/**
 * ⭐ El número de estación que abre el `title` de la API viva: «193- Pza. La
 * Ermita» → 193.
 *
 * Es la única clave que las dos fuentes comparten. Comprobado el 30/08: **las
 * 276 traen número legible y las 276 casan con el inventario**, sin sobras ni
 * faltas por ninguno de los dos lados.
 */
function numeroDe(title: string | undefined): number | null {
  const m = /^\s*(\d+)/.exec(title ?? '');
  return m ? Number(m[1]) : null;
}

/**
 * ⭐ PREGUNTA A LA API VIVA. Devuelve `null` si calla, y **nunca lanza**.
 *
 * Que devuelva `null` en vez de propagar el fallo es la decisión de diseño de
 * esta función: quien la llama tiene que poder seguir dando una ruta. El plan
 * D-G está firmado desde el 28/08 — *componer sin prometer*—: con la API caída
 * se rutea con el inventario, se avisa de que la disponibilidad no está
 * verificada, y **los hitos salen sin número y sin hora**. Nunca se inventa un
 * «quedan 3 bicis».
 *
 * ⚠️ **Una estación en `MAINTENANCE` puede venir SIN los campos de
 * disponibilidad**, y eso es de hoy: el 30/08 la estación 276 (Acuario
 * Zaragoza) llegaba sin `bicisDisponibles`, sin `anclajesDisponibles` y sin
 * `description`. Por eso se leen con comprobación y no con un `??` que los
 * pondría a cero — un cero significaría «no quedan bicis», y lo que pasa es que
 * no se sabe.
 */
async function consultarLaSede(): Promise<Disponibilidad | null> {
  const principio = performance.now();
  try {
    const respuesta = await fetch(API, { signal: AbortSignal.timeout(ESPERA_MS) });
    if (!respuesta.ok) {
      return null;
    }
    const cuerpo = (await respuesta.json()) as { readonly result?: readonly RasgoVivo[] };
    const filas = cuerpo.result;
    if (!Array.isArray(filas) || filas.length === 0) {
      return null;
    }
    const porNumero = new Map<number, EstadoDeEstacion>();
    let enMantenimiento = 0;
    for (const fila of filas) {
      const numero = numeroDe(fila.title);
      if (numero === null) {
        continue;
      }
      // `estado` y no `estadoEstacion`: ver la cabecera del fichero.
      const enServicio = fila.estado === 'IN_SERVICE';
      if (!enServicio) {
        enMantenimiento++;
      }
      if (
        typeof fila.bicisDisponibles !== 'number' ||
        typeof fila.anclajesDisponibles !== 'number'
      ) {
        // Sin cifras no hay estado que publicar. La estación existe en el
        // inventario; simplemente no se puede decir qué tiene.
        continue;
      }
      const cuando = new Date(fila.lastUpdated ?? '');
      porNumero.set(numero, {
        bicis: fila.bicisDisponibles,
        anclajesLibres: fila.anclajesDisponibles,
        enServicio,
        cuando: Number.isNaN(cuando.getTime()) ? new Date() : cuando,
      });
    }
    if (porNumero.size === 0) {
      return null;
    }
    return {
      porNumero,
      total: filas.length,
      enMantenimiento,
      enMs: performance.now() - principio,
    };
  } catch {
    // Red caída, DNS, TLS, tiempo agotado, JSON roto. Todos son lo mismo desde
    // aquí: la API no ha contestado, y la ruta sale igual.
    //
    // 🔴 **Y «JSON roto» incluye el cuerpo VACÍO, que se vio el 30/08 por la
    // tarde**: la sede contestaba `200 OK` con `Content-Length: 0`, tres veces
    // seguidas, cuando por la mañana devolvía 247.955 bytes. Un 200 no
    // garantiza un cuerpo, así que `respuesta.ok` no basta y el `json()` es
    // quien lo caza — lanzando aquí dentro, que es donde tiene que caer.
    return null;
  }
}

/**
 * ⭐ LA CONSULTA EN VUELO, si hay una. `null` en cuanto se resuelve.
 *
 * Es **una sola** variable y no un mapa por clave porque **solo hay una
 * consulta posible**: la petición a la sede no lleva ni un parámetro nuestro
 * —es siempre el mismo URL con `rows=300`—, así que dos peticiones
 * concurrentes son necesariamente idénticas y la clave sobraría.
 */
let enVuelo: Promise<Disponibilidad | null> | null = null;

/**
 * ⭐ LA DISPONIBILIDAD VIVA, con **single-flight** (30/08).
 *
 * ── El patrón, con su nombre ────────────────────────────────────────────────
 *
 * **Single-flight**, o *request coalescing*: fusionar las peticiones
 * concurrentes **idénticas** en una sola ejecución real. La primera sale a la
 * red; las que llegan mientras está en el aire se enganchan a su promesa y
 * comparten la respuesta. La implementación canónica es el paquete
 * `singleflight` de Go (`golang.org/x/sync`), y Varnish y Nginx lo traen de
 * serie para lo cacheable.
 *
 * ── ⚠️ Y esto NO es una caché ───────────────────────────────────────────────
 *
 * La propia doctrina separa las dos cosas, y aquí es lo que más importa:
 * **single-flight deduplica solo lo que está EN VUELO**. En cuanto la primera
 * termina, `enVuelo` se suelta y una consulta idéntica posterior **vuelve a
 * salir a la red**. Entre un `Generar` y el siguiente no queda memoria de nada.
 *
 * Eso deja intacta la conducta firmada: [DOC GBFS] `station_status` es el feed
 * **dinámico** y se consulta en cada ruta pedida. Lo único que colapsa es el
 * **triplete de la precarga** —las tres rutas del **mismo** viaje, que salen a
 * la vez con un `forkJoin`— y colapsarlo es exactamente lo que
 * [CycleStreets] hace con las tres del mismo viaje: son una pregunta, no tres.
 *
 * ── Lo que se gana, además de la visita ─────────────────────────────────────
 *
 * Las tres rutas del trío pasan a hablar **del mismo momento**. Antes cada una
 * traía su propia foto de la disponibilidad, y entre la primera y la tercera la
 * sede podía haber cambiado de opinión: la rápida decía «3 bicis» y la
 * tranquila «2», para el mismo viaje y la misma estación.
 */
export function disponibilidadDeBiZi(): Promise<Disponibilidad | null> {
  if (enVuelo !== null) {
    return enVuelo;
  }
  const vuelo = consultarLaSede().finally(() => {
    // ⚠️ **Soltar es la mitad del patrón.** Si esta línea no estuviera, la
    // primera respuesta se quedaría pegada para siempre y esto sería una caché
    // eterna: el segundo `Generar` contestaría con los números del primero.
    // La comparación es por si acaso: solo la bandera de ESTE vuelo se borra.
    if (enVuelo === vuelo) {
      enVuelo = null;
    }
  });
  enVuelo = vuelo;
  return vuelo;
}

/**
 * ⭐ LAS ESTACIONES MÁS CERCANAS A UN PUNTO **que sirven para lo que se pide**.
 *
 * `pide` es lo que hace de esto el filtro por disponibilidad de [DOC OTP]: al
 * coger se piden bicis, al dejar se piden anclajes libres. Una estación llena
 * no sirve para devolver y una vacía no sirve para coger, aunque sea la de la
 * puerta.
 *
 * Sin disponibilidad —API callada— **no se filtra nada**: se devuelven las más
 * cercanas del inventario, y quien compone la ruta pondrá el aviso. Filtrar sin
 * dato sería filtrar por lo que se supone.
 */
export function estacionesCercanas(
  bizi: BiZiEnMemoria,
  vivo: Disponibilidad | null,
  lon: number,
  lat: number,
  pide: 'bicis' | 'anclajes',
  cuantas: number,
): readonly EstacionBiZi[] {
  const sirve = (e: EstacionBiZi): boolean => {
    if (!vivo) {
      return true;
    }
    const estado = vivo.porNumero.get(e.numero);
    if (!estado || !estado.enServicio) {
      return false;
    }
    return pide === 'bicis' ? estado.bicis > 0 : estado.anclajesLibres > 0;
  };
  return bizi.estaciones
    .filter(sirve)
    .map((e) => ({ e, m: metrosEntre(lat, lon, e.lat, e.lon) }))
    .sort((a, b) => a.m - b.m)
    .slice(0, cuantas)
    .map((x) => x.e);
}
