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
  TipoDeRuta,
  Trayecto,
  Vertice,
} from '@desplazame/tipos';
import type { CallejeroEnMemoria } from './callejero.ts';
import type { SitiosEnMemoria } from './sitios.ts';
import type { PortalesEnMemoria, PortalSituado } from './portales.ts';
import type { RedEnMemoria } from './red.ts';
import type { RedDeLaRueda } from './red-rueda.ts';
import type { AparcabicisEnMemoria } from './aparcabicis.ts';
import type { BiZiEnMemoria, Disponibilidad } from './bizi.ts';
import { enganchar, type Enganche, type Rejilla } from './proyeccion.ts';
import { calcularRuta, geometriaDe, type Cuaderno, type Ruta } from './ruta.ts';
import {
  admiteComoPuerta,
  calcularRutaRodando,
  segundosRodando,
} from './rodando.ts';
import { esDeLaRueda, type ModoDeRueda } from './rueda.ts';
import { escribirPasos, type Empuje } from './pasos.ts';
import {
  VELOCIDAD_MS,
  aQueDistanciaElAparcabicis,
  avisoSinAparcabicis,
  remataEnAparcabicis,
  type Extremo,
} from './etapas.ts';
import { viajeEnBiZi } from './viaje-bizi.ts';

/**
 * Los modos que hoy sabe calcular el motor. **Cuatro desde el 29/08**: al
 * andando se le suman los tres de la rueda. Faltan `bus` (punto 10) y `coche`
 * (punto 11), y a esos se les sigue contestando con su Aviso honrado.
 */
const MODOS_ATENDIDOS: readonly Modo[] = ['andando', 'bici', 'patin', 'bizi'];

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
  /**
   * ⭐ La red de la rueda, con su rejilla y su cuaderno propios (29/08).
   *
   * Van aparte de las del peatón y no es duplicación: son **otro subgrafo**
   * —con carriles bici y sin aceras—, así que sus nodos son otros, su rejilla
   * indexa otros segmentos y el cuaderno del Dijkstra tiene que tener el
   * tamaño de SUS nodos. Compartirlos sería enganchar la bici a la acera.
   */
  readonly redRueda: RedDeLaRueda;
  readonly rejillaRueda: Rejilla;
  readonly cuadernoRueda: Cuaderno;
  /**
   * ⭐ Los aparcabicis municipales (§ 1.9), para el remate de los privados.
   *
   * No van dentro de la red y no es un descuido: **no son parte del grafo**,
   * son puntos que se enganchan a él como se engancha un portal. Meterlos en la
   * red obligaría a levantarla otra vez cada vez que el inventario cambie.
   */
  readonly aparcabicis: AparcabicisEnMemoria;
  /**
   * ⭐ El inventario de estaciones BiZi (§ 1.8). **Solo el inventario**: la
   * disponibilidad en vivo no vive aquí ni puede, porque cambia cada minuto.
   * Se pide en cada ruta y viaja como parámetro. Ver `bizi.ts`.
   */
  readonly bizi: BiZiEnMemoria;
}

/**
 * ⭐ UN EXTREMO YA RESUELTO: un punto y cómo se llama. Vive en `etapas.ts`,
 * que es quien lo consume desde que un viaje puede tener tres tramos.
 *
 * Es lo único que el cálculo necesita de un extremo, y por eso los dos —el
 * portal y el sitio— acaban en la misma forma. A partir de aquí **no hay dos
 * caminos**: la rejilla engancha una coordenada, el Dijkstra une dos nodos y
 * `pasos.ts` escribe un nombre. Que el destino fuera una dirección o una
 * farmacia deja de importar en cuanto se resuelve, que es como debe ser
 * [DOC Nominatim: geocodificar y enrutar son dos oficios].
 */

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

/**
 * Calcula el trayecto. Nunca lanza.
 *
 * ⭐ `vivo` es la disponibilidad de las estaciones BiZi **que ya ha pedido
 * quien llama**, o `null` si la API calló. Se recibe y no se pide, por dos
 * razones que van juntas:
 *
 * 1. **Esto sigue siendo síncrono.** Pedirla aquí obligaría a hacer `async`
 *    toda la cadena —incluidas las rutas a pie, que no tienen nada que ver con
 *    el BiZi— y a que cada prueba del peatón esperara a una red.
 * 2. **Se puede mentir a propósito.** Las jueces de la estación vacía y de la
 *    API caída pasan una disponibilidad de mentira, que es la única forma de
 *    probar el filtro sin depender de cuántas bicis haya hoy en la calle.
 *
 * `undefined` y `null` valen lo mismo: nadie preguntó, o preguntó y no hubo
 * respuesta. En los dos casos la ruta sale con el aviso de D-G.
 */
export function calcularTrayecto(
  motor: Motor,
  peticion: PeticionDeRuta | null,
  vivo?: Disponibilidad | null,
): Trayecto {
  if (!peticion) {
    return conAviso(
      'andando',
      'La petición no trae un origen y un destino con su vía y su portal.',
    );
  }
  // `modo` es opcional en el contrato desde el 29/08, y el defecto es el modo
  // que existía cuando era obligatorio. `leerPeticion` ya lo rellena; se
  // vuelve a rellenar aquí porque a esta función también se la llama con una
  // petición construida a mano, y un defecto que solo vive en el lector es un
  // defecto que la mitad de las llamadas no tiene.
  const modo: Modo = peticion.modo ?? 'andando';

  if (!MODOS_ATENDIDOS.includes(modo)) {
    // Se contesta con el modo que pidieron, no con «andando»: la respuesta
    // dice para qué modo NO hay ruta, que es lo que la pantalla tiene que
    // enseñar. Los dos que faltan son los puntos 10 y 11 del plan.
    //
    // La lista de los que SÍ se calculan se compone de `MODOS_ATENDIDOS` y no
    // se escribe a mano: hasta hoy decía «Solo andando», y el día que entró la
    // rueda esa frase se quedó mintiendo sin que nada se pusiera rojo.
    return conAviso(
      modo,
      `Todavía no calculamos rutas en modo «${modo}». Solo ${MODOS_ATENDIDOS.join(', ')}.`,
    );
  }

  const origen = resolverExtremo(motor, peticion.origen);
  if (esAvisoExtremo(origen)) {
    return { ...conAviso(modo, origen.texto) };
  }
  const destino = resolverExtremo(motor, peticion.destino);
  if (esAvisoExtremo(destino)) {
    return { ...conAviso(modo, destino.texto) };
  }

  // ⭐ LA BIFURCACIÓN, y va aquí a propósito: los dos extremos se resuelven
  // igual para todos los modos —una dirección es una dirección— y a partir de
  // este punto **el peatón no vuelve a cruzarse con la rueda**. Ni comparte
  // red, ni rejilla, ni cuaderno, ni una línea de este fichero: lo de abajo es
  // exactamente lo que había el 28/08.
  // ⭐ EL BiZi VA POR SU CAMINO (30/08, casilla 6): no es una ruta, son tres
  // tramos con dos estaciones por el medio, y la elección de esas estaciones
  // depende de un dato que ni siquiera está en este proceso.
  if (modo === 'bizi') {
    return viajeEnBiZi(
      motor,
      origen,
      destino,
      peticion.ruta,
      empujeDe('bizi', motor.redRueda),
      vivo ?? null,
    );
  }
  if (esDeLaRueda(modo)) {
    return trayectoRodando(motor, modo, origen, destino, peticion.ruta);
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

/**
 * ⭐ EL TRAYECTO RODANDO: bici, patín o BiZi.
 *
 * Es la hermana de lo de arriba y hace los mismos cuatro pasos —enganchar,
 * rutear, redactar, dar la vuelta a la geometría—, pero con la red de la
 * rueda y diciendo lo que hay que decir en cada modo. No se ha metido dentro
 * del camino del peatón con un `if` por medio: las redes son otras, los avisos
 * son otros, y mezclarlas habría dejado al peatón atado a la rueda.
 *
 * Tres cosas que no se ven a simple vista y son las que hacen que esto sea
 * correcto:
 *
 * 1. **El enganche filtra por modo** [DOC Valhalla, Loki]. Sin eso, un patín
 *    engancharía a la avenida de 50 por la que no puede circular y la ruta
 *    empezaría prohibida.
 * 2. **Los metros son los metros.** Vienen recontados sobre los trozos, no del
 *    montículo, que lleva segundos ponderados por la preferencia.
 * 3. **Los segundos NO llevan la preferencia dentro.** Se vuelven a sumar sin
 *    factor: preferir es una forma de elegir camino, no una predicción de lo
 *    que se tarda.
 */
function trayectoRodando(
  motor: Motor,
  modo: ModoDeRueda,
  origen: Extremo,
  destino: Extremo,
  /** Qué clase de ruta se pide. El patín lo ignora: ver `calibradoDe`. */
  ruta: TipoDeRuta | undefined,
): Trayecto {
  const red = motor.redRueda;
  // ⭐ La PUERTA no es lo mismo que lo que se puede pisar: por una acera se
  // puede pasar empujando, pero una ruta no empieza ni acaba ahí. Ver
  // `admiteComoPuerta`, que lleva el porqué medido.
  const admitida = (arista: number): boolean => admiteComoPuerta(red, arista, modo);

  const engancheOrigen: Enganche | null = enganchar(
    red,
    motor.rejillaRueda,
    origen.lon,
    origen.lat,
    admitida,
  );
  if (!engancheOrigen) {
    return conAviso(
      modo,
      `${origen.nombre} no tiene cerca ninguna calle por la que ` +
        `${comoSeMueve(modo)} en nuestro mapa: desde ahí no podemos calcular una ruta.`,
    );
  }
  const engancheDestino: Enganche | null = enganchar(
    red,
    motor.rejillaRueda,
    destino.lon,
    destino.lat,
    admitida,
  );
  if (!engancheDestino) {
    return conAviso(
      modo,
      `${destino.nombre} no tiene cerca ninguna calle por la que ` +
        `${comoSeMueve(modo)} en nuestro mapa: hasta ahí no podemos calcular una ruta.`,
    );
  }

  // ⭐ EL REMATE (30/08, casilla 5): la bici y el patín no acaban pedaleando en
  // la puerta — se aparcan y se anda el resto.
  //
  // [DOC OTP, `BICYCLE_PARK`] *«deja la bicicleta y anda hasta el destino»*.
  // Va ANTES de calcular la ruta directa y no después: si el remate sale, esa
  // ruta directa no se llega a pedir, y son dos Dijkstra menos.
  //
  // La BiZi no pasa por aquí: no se aparca en un aparcabicis, se devuelve en su
  // estación, y eso es la casilla 6.
  if (modo !== 'bizi') {
    const rematada = remataEnAparcabicis(motor, modo, origen, destino, ruta, empujeDe(modo, red));
    if (rematada) {
      return rematada.trayecto;
    }
  }

  const trazado: Ruta | null = calcularRutaRodando(
    red,
    motor.cuadernoRueda,
    modo,
    engancheOrigen,
    [origen.lon, origen.lat],
    engancheDestino,
    [destino.lon, destino.lat],
    ruta,
  );
  if (!trazado) {
    return conAviso(
      modo,
      `No hay forma de ir de ${origen.nombre} a ${destino.nombre} ` +
        `${comoSeMueve(modo)} por las calles que conocemos.`,
    );
  }

  const pasos = escribirPasos(
    red,
    trazado,
    origen.nombre,
    destino.nombre,
    [destino.lon, destino.lat],
    // ⭐ Cómo se narra el tramo que se empuja. El peatón no manda esto y su
    // narración no cambia ni una letra: ver `Empuje` en `pasos.ts`.
    empujeDe(modo, red),
  );
  const geometria: Vertice[] = geometriaDe(trazado).map(([lon, lat]) => [lat, lon]);

  return {
    modo,
    pasos,
    geometria,
    // ⚠️ Si el modo remataba y ha llegado hasta aquí, es que NO había
    // aparcabicis que valiera. Se dice, con el número: la ruta acaba en la
    // puerta y quien la lee sabe por qué.
    avisos:
      modo === 'bizi'
        ? []
        : [avisoSinAparcabicis(destino, aQueDistanciaElAparcabicis(motor, destino))],
    metros: Math.round(trazado.metros),
    // ⭐ El reloj es el de siempre: el tipo de ruta cambia el PESO, no la
    // velocidad. `segundosRodando` divide el factor del calibrado que se usó,
    // así que lo que se contesta son los segundos reales de esta ruta.
    segundos: Math.round(segundosRodando(red, trazado, modo, ruta)),
  };
}

/**
 * ⭐ CÓMO SE DICE QUE SE VA EMPUJANDO, por modo.
 *
 * [ORD art. 54.4, literal] *«deberán cruzar con la bicicleta o VMP en la
 * mano»*: la Ordenanza da la fórmula hecha y aquí se usa la suya, cambiando
 * «VMP» por la palabra que el botón de la pantalla enseña — el texto es para
 * quien va por la calle, no para quien redacta la ordenanza.
 *
 * La BiZi es una bici y se dice bici: quien la lleva no piensa en el nombre
 * del servicio mientras la empuja.
 */
const EN_LA_MANO: Readonly<Record<ModoDeRueda, string>> = {
  bici: 'con la bici en la mano',
  bizi: 'con la bici en la mano',
  patin: 'con el patín en la mano',
};

/** El empuje de un modo, listo para pasárselo a la narración. */
function empujeDe(modo: ModoDeRueda, red: RedDeLaRueda): Empuje {
  return { esEmpuje: (arista) => red.empujando[arista] === 1, enLaMano: EN_LA_MANO[modo] };
}

/**
 * Cómo se dice el verbo de cada modo dentro de un aviso.
 *
 * Va aquí y no en la pantalla porque el aviso es una frase entera que compone
 * el motor —como «no hay forma de ir andando»—, y partirla para que la
 * interfaz meta el verbo obligaría a la interfaz a saber conjugar.
 */
function comoSeMueve(modo: ModoDeRueda): string {
  return modo === 'patin' ? 'circular en patinete' : 'ir en bici';
}
