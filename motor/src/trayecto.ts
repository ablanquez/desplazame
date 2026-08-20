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

import type { Aviso, Modo, PeticionDeRuta, Trayecto, Vertice } from '@desplazame/tipos';
import type { CallejeroEnMemoria } from './callejero.ts';
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

/** Cómo se nombra una dirección municipal: «CALLE BURGOS [CASETAS] 4». */
function comoSeLee(callejero: CallejeroEnMemoria, portal: PortalSituado): string {
  const via = callejero.sugeribles.find((s) => s.via.codigo === portal.via)?.via;
  if (!via) {
    return portal.numero;
  }
  const nombre = via.nucleo ? `${via.limpio} [${via.nucleo}]` : via.limpio;
  return `${nombre} ${portal.numero}`;
}

/** Lo que hace falta tener cargado para poder contestar. */
export interface Motor {
  readonly red: RedEnMemoria;
  readonly rejilla: Rejilla;
  readonly portales: PortalesEnMemoria;
  readonly callejero: CallejeroEnMemoria;
  readonly cuaderno: Cuaderno;
}

/**
 * Lee la petición sin fiarse de nada de lo que trae.
 *
 * Llega de fuera, así que puede ser cualquier cosa: `null`, una lista, un
 * objeto sin campos, o campos que no son cadenas. Devuelve `null` si no es una
 * petición, y arriba eso se convierte en un aviso — no en un 400.
 */
export function leerPeticion(cuerpo: unknown): PeticionDeRuta | null {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return null;
  }
  const bruto = cuerpo as Record<string, unknown>;
  const punto = (nombre: string): { via: string; portal: string } | null => {
    const valor = bruto[nombre];
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const { via, portal } = valor as Record<string, unknown>;
    if (typeof via !== 'string' || typeof portal !== 'string' || via === '' || portal === '') {
      return null;
    }
    return { via, portal };
  };
  const origen = punto('origen');
  const destino = punto('destino');
  const modo = bruto['modo'];
  if (!origen || !destino || typeof modo !== 'string') {
    return null;
  }
  return { origen, destino, modo: modo as Modo };
}

/** Busca un portal y comprueba que de verdad es de la vía que dicen. */
function resolver(
  motor: Motor,
  punto: { readonly via: string; readonly portal: string },
): PortalSituado | Aviso {
  const portal = motor.portales.donde.get(punto.portal);
  if (!portal) {
    return { texto: `No conocemos ningún portal con el código ${punto.portal}.` };
  }
  if (portal.via !== punto.via) {
    return {
      texto: `El portal ${punto.portal} no es de la vía ${punto.via}: es de la ${portal.via}.`,
    };
  }
  return portal;
}

const esAviso = (x: PortalSituado | Aviso): x is Aviso =>
  (x as Aviso).texto !== undefined && (x as PortalSituado).codigo === undefined;

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

  const origen = resolver(motor, peticion.origen);
  if (esAviso(origen)) {
    return { ...conAviso(modo, origen.texto) };
  }
  const destino = resolver(motor, peticion.destino);
  if (esAviso(destino)) {
    return { ...conAviso(modo, destino.texto) };
  }

  const engancheOrigen = enganchar(motor.red, motor.rejilla, origen.lon, origen.lat);
  if (!engancheOrigen) {
    return conAviso(
      modo,
      `${comoSeLee(motor.callejero, origen)} no tiene ninguna calle andable cerca en ` +
        'nuestro mapa: desde ahí no podemos calcular una ruta.',
    );
  }
  const engancheDestino = enganchar(motor.red, motor.rejilla, destino.lon, destino.lat);
  if (!engancheDestino) {
    return conAviso(
      modo,
      `${comoSeLee(motor.callejero, destino)} no tiene ninguna calle andable cerca en ` +
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
      `No hay forma de ir andando de ${comoSeLee(motor.callejero, origen)} a ` +
        `${comoSeLee(motor.callejero, destino)} por las calles que conocemos.`,
    );
  }

  const pasos = escribirPasos(
    motor.red,
    ruta,
    comoSeLee(motor.callejero, origen),
    comoSeLee(motor.callejero, destino),
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
