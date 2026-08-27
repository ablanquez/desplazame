/**
 * EL TRAYECTO: lo que `POST /api/ruta` contesta.
 *
 * Aquí no hay algoritmo. Es la pieza que junta las otras cuatro —callejero,
 * proyección, ruta y pasos— y decide **qué se contesta cuando algo no sale**.
 * Esa es su razón de existir: que el servidor no tenga que saber nada de
 * enganches ni de componentes conexas para poder dar una respuesta honrada.
 *
 * **Nunca lanza y nunca devuelve un error HTTP.** Un origen que no existe, un
 * barrio que es una isla o un modo que todavía no se atiende son `Trayecto`s
 * con los pasos vacíos y un `Aviso` que dice qué ha pasado. Es la misma
 * escuela de `/api/portal-cercano`: una respuesta bien formada vale más que un
 * 400, porque la pantalla puede enseñarla.
 */

import type {
  Aviso,
  ExtremoDeRuta,
  ExtremoPortal,
  Modo,
  PeticionDeRuta,
  Trayecto,
  Vertice,
} from '@desplazame/tipos';
import type { CallejeroEnMemoria } from './callejero.ts';
import type { SitiosEnMemoria } from './sitios.ts';
import type { PortalesEnMemoria, PortalSituado } from './portales.ts';
import type { RedEnMemoria } from './red.ts';
import { enganchar, type Rejilla } from './proyeccion.ts';
import { calcularRuta, geometriaDe, type Cuaderno } from './ruta.ts';
import { escribirPasos } from './pasos.ts';

/**
 * Velocidad a pie para derivar la duración: **5,0 km/h**.
 *
 * [PROPIO, y declarado como tal en el contrato] Es la velocidad de manual, no
 * una medida: aquí no se ha cronometrado a nadie andando por Zaragoza. No
 * entran cuestas, ni semáforos, ni el rato que se tarda en cruzar. Si algún
 * día se mide de verdad, este es el sitio.
 */
const VELOCIDAD_MS = 5000 / 3600;

/** Los modos que hoy sabe calcular el motor. */
const MODOS_ATENDIDOS: readonly Modo[] = ['andando'];

/** Un trayecto vacío con su explicación. Es la respuesta a todo lo que falla. */
function conAviso(modo: Modo, texto: string): Trayecto {
  return { modo, pasos: [], geometria: [], avisos: [{ texto }], metros: 0, segundos: 0 };
}

/** Cómo se nombra una vía: «CALLE BURGOS [CASETAS]». `null` si no se conoce. */
function nombreDeLaVia(callejero: CallejeroEnMemoria, codigo: string): string | null {
  const via = callejero.sugeribles.find((s) => s.via.codigo === codigo)?.via;
  if (!via) {
    return null;
  }
  return via.nucleo ? `${via.limpio} [${via.nucleo}]` : via.limpio;
}

/** Cómo se nombra una dirección municipal: «CALLE BURGOS [CASETAS] 4». */
function comoSeLee(callejero: CallejeroEnMemoria, portal: PortalSituado): string {
  const nombre = nombreDeLaVia(callejero, portal.via);
  return nombre ? `${nombre} ${portal.numero}` : portal.numero;
}

/** Lo que hace falta tener cargado para poder contestar. */
export interface Motor {
  readonly red: RedEnMemoria;
  readonly rejilla: Rejilla;
  readonly portales: PortalesEnMemoria;
  readonly callejero: CallejeroEnMemoria;
  readonly sitios: SitiosEnMemoria;
  readonly cuaderno: Cuaderno;
}

/**
 * ⭐ UN EXTREMO YA RESUELTO: un punto y cómo se llama.
 *
 * Es lo único que el cálculo necesita de un extremo, y por eso los dos —el
 * portal y el sitio— acaban en la misma forma. A partir de aquí **no hay dos
 * caminos**: la rejilla engancha una coordenada, el Dijkstra une dos nodos y
 * `pasos.ts` escribe un nombre. Que el destino fuera una dirección o una
 * farmacia deja de importar en cuanto se resuelve, que es como debe ser
 * [DOC Nominatim: geocodificar y enrutar son dos oficios].
 */
interface Extremo {
  readonly lon: number;
  readonly lat: number;
  /** Lo que se escribe en el paso de salida o de llegada. */
  readonly nombre: string;
}

/**
 * ⭐ Resuelve un extremo dado por DIRECCIÓN, que desde el 27/08 son dos casos.
 *
 * ── El caso de siempre ──────────────────────────────────────────────────────
 * `portal` es un código del censo (`Portales.104742`): se busca, se comprueba
 * que de verdad es de la vía que dicen, y ese es el punto.
 *
 * ── ⭐ Y LA VÍA SIN PORTAL, sin tocar el contrato ───────────────────────────
 * Las 619 vías que se resuelven por su punto medio **no tienen ningún código de
 * portal que mandar**, porque no tienen ninguna puerta que nombrar. Y el
 * contrato pide dos códigos, no uno.
 *
 * La salida es decir en voz alta lo que ya es verdad: **el punto de esa vía se
 * identifica con el código de la vía**, así que viaja el mismo código en las
 * dos casillas — `{ via: '23125', portal: '23125' }` es el PUENTE DE PIEDRA.
 * No se inventa un código nuevo, no se hace opcional un campo, y la pantalla no
 * compone nada: manda dos veces el único código que le dieron.
 *
 * Y no es una convención suelta de este sitio: es exactamente lo que el motor
 * ya hace con `foco`, donde un código puede ser un portal, un sitio o —desde
 * hoy— una vía, y quien lo convierte en un punto es siempre el motor. **El
 * mismo código resuelve al mismo punto viaje por donde viaje**, que es la
 * propiedad que hace que esto no sea un truco.
 *
 * La comprobación cruzada del contrato sigue viva y sigue distinguiendo los tres
 * casos: un portal que no es de su vía, un punto de vía puesto en la vía
 * equivocada, y un código que no conocemos.
 */
function resolverDireccion(motor: Motor, punto: ExtremoPortal): Extremo | Aviso {
  const portal = motor.portales.donde.get(punto.portal);
  if (portal) {
    if (portal.via !== punto.via) {
      return {
        texto: `El portal ${punto.portal} no es de la vía ${punto.via}: es de la ${portal.via}.`,
      };
    }
    return { lon: portal.lon, lat: portal.lat, nombre: comoSeLee(motor.callejero, portal) };
  }

  const medio = motor.callejero.puntoDeVia.get(punto.portal);
  if (medio) {
    if (punto.portal !== punto.via) {
      return {
        texto:
          `El punto de la vía ${punto.portal} no es de la vía ${punto.via}: ` +
          'una vía sin portales viaja con su propio código en las dos casillas.',
      };
    }
    // Sin número: no hay ninguno que decir, y ponerle uno sería inventarlo. El
    // paso de salida dirá «PUENTE DE PIEDRA», que es toda la dirección que hay.
    return {
      lon: medio.lon,
      lat: medio.lat,
      nombre: nombreDeLaVia(motor.callejero, punto.via) ?? punto.via,
    };
  }

  return { texto: `No conocemos ningún portal con el código ${punto.portal}.` };
}

/**
 * ⭐ Resuelve un extremo, sea de la clase que sea.
 *
 * Un sitio que no está en el índice se contesta con un aviso y no con un
 * error: puede ser un código inventado, pero **también puede ser uno de los
 * que no tienen coordenada** (regla B), y esos no están. En los dos casos la
 * respuesta honesta es la misma — no se puede ir ahí— y el motivo no cambia
 * lo que la pantalla tiene que enseñar.
 */
function resolverExtremo(motor: Motor, extremo: ExtremoDeRuta): Extremo | Aviso {
  if ('sitio' in extremo) {
    const sitio = motor.sitios.donde.get(extremo.sitio);
    if (!sitio) {
      return { texto: `No conocemos ningún sitio con el código ${extremo.sitio}.` };
    }
    // 🔒 `presentacion`, nunca el título del dato: ahí va el nombre de la
    // persona titular en 274 de las 313 farmacias. Ver § 1.16 del notices.
    return { lon: sitio.lon, lat: sitio.lat, nombre: sitio.presentacion };
  }
  return resolverDireccion(motor, extremo);
}

const esAvisoExtremo = (x: Extremo | Aviso): x is Aviso =>
  (x as Aviso).texto !== undefined && (x as Extremo).lon === undefined;

/** Calcula el trayecto. Nunca lanza. */
export function calcularTrayecto(motor: Motor, peticion: PeticionDeRuta | null): Trayecto {
  if (!peticion) {
    return conAviso(
      'andando',
      'La petición no trae un origen y un destino con su vía y su portal.',
    );
  }
  const { modo } = peticion;

  if (!MODOS_ATENDIDOS.includes(modo)) {
    // Se contesta con el modo que pidieron, no con «andando»: la respuesta
    // dice para qué modo NO hay ruta, que es lo que la pantalla tiene que
    // enseñar. Los otros tres son los puntos 9 y 10 del plan.
    return conAviso(modo, `Todavía no calculamos rutas en modo «${modo}». Solo andando.`);
  }

  const origen = resolverExtremo(motor, peticion.origen);
  if (esAvisoExtremo(origen)) {
    return { ...conAviso(modo, origen.texto) };
  }
  const destino = resolverExtremo(motor, peticion.destino);
  if (esAvisoExtremo(destino)) {
    return { ...conAviso(modo, destino.texto) };
  }

  const engancheOrigen = enganchar(motor.red, motor.rejilla, origen.lon, origen.lat);
  if (!engancheOrigen) {
    return conAviso(
      modo,
      `${origen.nombre} no tiene ninguna calle andable cerca en ` +
        'nuestro mapa: desde ahí no podemos calcular una ruta.',
    );
  }
  const engancheDestino = enganchar(motor.red, motor.rejilla, destino.lon, destino.lat);
  if (!engancheDestino) {
    return conAviso(
      modo,
      `${destino.nombre} no tiene ninguna calle andable cerca en ` +
        'nuestro mapa: hasta ahí no podemos calcular una ruta.',
    );
  }

  const ruta = calcularRuta(
    motor.red,
    motor.cuaderno,
    engancheOrigen,
    [origen.lon, origen.lat],
    engancheDestino,
    [destino.lon, destino.lat],
  );
  if (!ruta) {
    return conAviso(
      modo,
      `No hay forma de ir andando de ${origen.nombre} a ` +
        `${destino.nombre} por las calles que conocemos.`,
    );
  }

  const pasos = escribirPasos(
    motor.red,
    ruta,
    origen.nombre,
    destino.nombre,
    [destino.lon, destino.lat],
  );

  // La geometría se da la vuelta AQUÍ y solo aquí: el grafo va [lon, lat] y el
  // contrato [lat, lon].
  const geometria: Vertice[] = geometriaDe(ruta).map(([lon, lat]) => [lat, lon]);

  return {
    modo,
    pasos,
    geometria,
    avisos: [],
    metros: Math.round(ruta.metros),
    segundos: Math.round(ruta.metros / VELOCIDAD_MS),
  };
}
