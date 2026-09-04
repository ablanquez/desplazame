/**
 * ⭐ EL VIAJE EN COCHE (2/09, punto 12 casilla 1b).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA BÚSQUEDA VA POR TRANSICIONES, NO POR NODOS. Y no es una preferencia.
 *
 *  Una restricción de giro no prohíbe un nodo ni una arista: prohíbe **pasar
 *  de una a otra**. Un Dijkstra que guarda el mejor coste POR NODO no puede
 *  respetarla — cuando llega al cruce ya ha olvidado por dónde entró, y la
 *  única pregunta que la restricción hace es justo ésa.
 *
 *  [DOC GraphHopper] lo dice con todas las letras: las restricciones de giro
 *  *«requieren recorrido edge-based del grafo»*. OSRM hace lo mismo: su grafo
 *  de consulta es de aristas, y las prohibiciones viven en las transiciones.
 *
 *  Así que el estado de la búsqueda **es una arista dirigida** —«acabo de
 *  recorrer ésta y estoy en su final»— y el coste de pasar a la siguiente lo
 *  da `costeDeTransicion` de la casilla 1a: `null` si está vetada, y si no la
 *  sigmoide del ángulo, los 2 s del semáforo y los 20 de la media vuelta.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── Los VETOS prohíben; las PENALIZACIONES encarecen ────────────────────────
 *
 * Las dos cosas viajan por el mismo sitio y **no son la misma**: `null` cierra
 * el paso y un número lo cobra. Convertir un veto en una penalización muy
 * grande parece equivalente y no lo es — un giro prohibido dejaría de estarlo
 * en cuanto la alternativa fuera peor, que es exactamente lo que pasa al fondo
 * de un callejón. Y convertir una penalización en veto amputa rutas legales.
 * La contraprueba del encargo muerde por los dos lados.
 *
 * ── El enganche, como todos los modos de la casa ────────────────────────────
 *
 * El portal se proyecta a su arista RODABLE más cercana. Lo que cambia respecto
 * del peatón es que aquí la arista **tiene sentido**: por eso se prueban las
 * dos gemelas —la ida y la vuelta de la misma calle— y no se sale nunca por el
 * sentido prohibido. Es la versión dirigida de las «cuatro combinaciones».
 *
 * ── El tiempo que se publica ────────────────────────────────────────────────
 *
 * Es el de la red **más las transiciones**, y esa suma es fiel a la fuente: en
 * `car.lua` la sigmoide y el semáforo se suman a `turn.duration`, no solo al
 * peso. Aquí no hay nada como el factor de preferencia de la rueda —que sí hay
 * que quitar antes de publicar—: todo lo que se suma son segundos que se tardan.
 */

import type {
  Aviso,
  ParteDelPaso,
  Paso,
  TipoDeAparcamiento,
  Trayecto,
  Vertice,
} from '@desplazame/tipos';
import {
  Monticulo,
  conector,
  geometriaPorModo,
  trozoDelEnganche,
  trozoEntero,
  trozoEntreDosEnganches,
  type Ruta,
  type TrozoDeRuta,
} from './ruta.ts';
import {
  enganchar,
  metrosDeLaGeometria,
  metrosHastaElEnganche,
  type Enganche,
} from './proyeccion.ts';
import { costeDeTransicion } from './red-coche.ts';
import type { RedDeCocheServida } from './coche.ts';
import { comoSePresenta, escribirPasos } from './pasos.ts';
import { etapaAndando, juntar, type Etapa, type Extremo } from './etapas.ts';
import type { Costuras } from './pasos.ts';
import type { Motor } from './trayecto.ts';
import { PESO_DE_ANDAR } from './viaje-bus.ts';
import {
  dondeAparcarCerca,
  elAparcamiento,
  type DondeAparcar,
} from './aparcamiento.ts';
import { losParkingsDeLaFase1, type ParkingCocinado } from './parkings-zbe.ts';

/** Un punto en `[lon, lat]`, como el grafo. */
type Punto = readonly [number, number];

/**
 * ⭐ LA LETRA DE LA ZONA DE BAJAS EMISIONES, y **avisa: no veta**.
 *
 * La app no sabe qué distintivo lleva el coche de quien pregunta, y no hay
 * forma de que lo sepa. Así que la ruta **se devuelve igual** y lo que se hace
 * es contar la norma con su condición delante, que es componer sin prometer
 * [D-G]. Vetar sería decidir por el usuario que su coche no puede pasar;
 * callar sería mandarlo a una multa.
 *
 * ── De dónde sale, palabra por palabra ──────────────────────────────────────
 *
 * De la **FAQ oficial del Ayuntamiento de Zaragoza**, leída el **2/09/2026**:
 * `https://www.zaragoza.es/sede/portal/movilidad/bajas-emisiones/faq`
 *
 *   · *«de aplicación de lunes a viernes de 8:00 a 20:00 horas»* → el horario.
 *   · *«B, C, ECO o CERO: libre acceso, circulación y estacionamiento sin
 *     necesidad de registrarse»* → los cuatro que circulan libres.
 *   · Los **sin distintivo** necesitan autorización.
 *   · Las sanciones se aplican **desde el 12/12/2025**, y la **Fase 1** es la
 *     vigente — que es la que trae marcada la geometría del WFS (§ 1.30).
 *
 * ⚠️ Lo que aquí NO se dice es a quién le toca: eso es justo lo que no se sabe.
 */
export const AVISO_ZBE =
  'La ruta atraviesa la Zona de Bajas Emisiones: de lunes a viernes de 8:00 a 20:00 ' +
  'los vehículos sin distintivo necesitan autorización; B, C, ECO y CERO circulan libres';

/**
 * El cuaderno del Dijkstra del coche. **Va por ARISTA**, no por nodo, porque el
 * estado de esta búsqueda es una arista. Se reserva una vez y se reutiliza: el
 * motor atiende de uno en uno.
 */
export interface CuadernoDeCoche {
  readonly coste: Float64Array;
  readonly sello: Int32Array;
  readonly deArista: Int32Array;
  readonly cerrada: Int32Array;
  consulta: number;
}

export function cuadernoDeCoche(cuantasAristas: number): CuadernoDeCoche {
  return {
    coste: new Float64Array(cuantasAristas),
    sello: new Int32Array(cuantasAristas),
    deArista: new Int32Array(cuantasAristas),
    cerrada: new Int32Array(cuantasAristas),
    consulta: 0,
  };
}

let cuaderno: CuadernoDeCoche | null = null;

/** El cuaderno de esta red, creado la primera vez y reutilizado después. */
function elCuaderno(servida: RedDeCocheServida): CuadernoDeCoche {
  const cuantas = servida.cocinada.aristas.length;
  if (cuaderno === null || cuaderno.coste.length !== cuantas) {
    cuaderno = cuadernoDeCoche(cuantas);
  }
  return cuaderno;
}

/**
 * ⭐ EL MISMO ENGANCHE, VISTO DESDE LA GEMELA.
 *
 * La gemela lleva la geometría **exactamente al revés** —el cocinado la crea
 * con `[...trozo].reverse()`—, así que un punto que en una cae en el segmento
 * `s` con fracción `f`, en la otra cae en el `n − 2 − s` con `1 − f`. El punto
 * proyectado y los metros del conector son los mismos: es el mismo sitio de la
 * misma calle, mirado desde el otro sentido.
 */
function enLaGemela(vertices: number, enganche: Enganche, gemela: number): Enganche {
  return {
    arista: gemela,
    segmento: vertices - 2 - enganche.segmento,
    fraccion: 1 - enganche.fraccion,
    lon: enganche.lon,
    lat: enganche.lat,
    metros: enganche.metros,
    // El nodo es un índice global: vale igual en las dos.
    nodo: enganche.nodo,
  };
}

/**
 * Una puerta del coche: por qué arista se sale o se entra, dónde exactamente,
 * y a qué precio.
 */
interface PuertaDeCoche {
  readonly arista: number;
  /** El punto de ESA arista por el que se empieza o se acaba. */
  readonly enganche: Enganche;
  /** El trecho que se recorre de ella, ya en el sentido de la marcha. */
  readonly trozo: TrozoDeRuta;
  readonly segundos: number;
}

/** Los segundos de recorrer `metros` de una arista, a su propia velocidad. */
function segundosDeUnTrecho(
  servida: RedDeCocheServida,
  arista: number,
  metros: number,
): number {
  const a = servida.cocinada.aristas[arista]!;
  const largo = metrosDeLaGeometria(servida.comoRed.aristas[arista]!.g);
  if (largo <= 0 || a.segundos <= 0) {
    return 0;
  }
  // Proporcional a lo que se recorre, con la velocidad que el cocinado ya le
  // puso a ESA arista. Cobrarle la arista entera a un trecho recortado fue el
  // ×1,667 de la entrada nº9 de la bitácora.
  return a.segundos * (metros / largo);
}

/**
 * ⭐ QUÉ ARISTAS NO SE PUEDEN PISAR EN ESTE VIAJE, si alguna.
 *
 * Devuelve `true` para lo que está cerrado. `undefined` es «nada cerrado», que
 * es el viaje de la casilla 1b: **la función ni se llama**, así que la búsqueda
 * de siempre no paga ni una comprobación de más.
 *
 * Hoy solo lo usa la Zona de Bajas Emisiones, y solo cuando quien pregunta dice
 * que su coche NO puede entrar y el reloj cae dentro de la franja. Ver
 * `vetoDeLaZbe`.
 */
export type AristaVetada = (arista: number) => boolean;

/**
 * ⭐ EL PESTILLO: un conjunto de aristas **del que no se sale**.
 *
 * Devuelve `true` para las aristas de dentro. Entrar está permitido; volver a
 * salir, no — la búsqueda prohíbe la transición «de dentro a fuera» y ninguna
 * otra.
 *
 * ── Por qué esto y no un veto ni una penalización ───────────────────────────
 *
 * El caso es el remate en un aparcamiento público de la Zona de Bajas
 * Emisiones. El aparcamiento **está dentro**, así que llegar a su puerta pisa
 * aristas de la zona por fuerza: vetarlas dejaría el destino incomunicado.
 * Encarecerlas tampoco vale — una penalización lo bastante grande para que no
 * se atraviese es un veto disfrazado, y una lo bastante pequeña para no serlo
 * no impide el atajo—.
 *
 * Lo que la norma permite es **entrar hacia el aparcamiento**, y lo que prohíbe
 * es **atravesar de paso**. Eso no es una cuestión de precio: es una cuestión
 * de forma del camino, y por eso se prohíbe la forma. Con el pestillo puesto,
 * todo camino o no entra, o entra una vez y **termina dentro** — y el único
 * final que la búsqueda acepta es el aparcamiento.
 *
 * ⚠️ **Vale porque la marca es de la arista, no del camino.** «Estar dentro» se
 *    lee de la propia arista que se acaba de recorrer, así que no hace falta
 *    duplicar el estado del Dijkstra: sigue siendo una arista dirigida.
 */
export type Pestillo = (arista: number) => boolean;

/** Las dos caras de un enganche: la arista en la que cayó y su reverso. */
function lasDosCaras(servida: RedDeCocheServida, enganche: Enganche): Enganche[] {
  const caras = [enganche];
  const gemela = servida.gemela[enganche.arista]!;
  if (gemela >= 0) {
    caras.push(enLaGemela(servida.comoRed.aristas[enganche.arista]!.g.length, enganche, gemela));
  }
  return caras;
}

/** El enganche que representa **el principio** de una arista: su nodo `desde`. */
function porElPrincipio(servida: RedDeCocheServida, arista: number): Enganche {
  const g = servida.comoRed.aristas[arista]!.g;
  return {
    arista,
    segmento: 0,
    fraccion: 0,
    lon: g[0]![0],
    lat: g[0]![1],
    metros: 0,
    nodo: servida.cocinada.aristas[arista]!.desde,
  };
}

/** Y el que representa **el final**: su nodo `hasta`. */
function porElFinal(servida: RedDeCocheServida, arista: number): Enganche {
  const g = servida.comoRed.aristas[arista]!.g;
  return {
    arista,
    segmento: g.length - 2,
    fraccion: 1,
    lon: g[g.length - 1]![0],
    lat: g[g.length - 1]![1],
    metros: 0,
    nodo: servida.cocinada.aristas[arista]!.hasta,
  };
}

/**
 * Por dónde ARRANCA el viaje.
 *
 * Enganchado por dentro de una calle, sus dos caras — porque una arista
 * dirigida solo se recorre en su sentido, y quien quiera el otro lo tiene en la
 * gemela. Enganchado a un cruce, todas las que salen de él, enteras.
 */
function salidasDelCoche(
  servida: RedDeCocheServida,
  enganche: Enganche,
  vetada?: AristaVetada,
): PuertaDeCoche[] {
  const donde: Enganche[] =
    enganche.nodo !== null
      ? (servida.cocinada.salidas.get(enganche.nodo) ?? []).map((i) => porElPrincipio(servida, i))
      : lasDosCaras(servida, enganche);
  // ⚠️ El veto se aplica TAMBIÉN aquí y no solo al relajar: una puerta vetada
  //    metería el viaje en la zona antes de que el Dijkstra empezara.
  return donde
    .filter((cara) => !vetada?.(cara.arista))
    .map((cara) => {
    const trozo = trozoDelEnganche(servida.comoRed, cara, true, true);
    return {
      arista: cara.arista,
      enganche: cara,
      trozo,
      segundos: segundosDeUnTrecho(servida, cara.arista, trozo.metros),
    };
  });
}

/** Por dónde TERMINA: las aristas que dejan en la puerta del destino. */
function llegadasDelCoche(
  servida: RedDeCocheServida,
  enganche: Enganche,
  vetada?: AristaVetada,
): PuertaDeCoche[] {
  const donde: Enganche[] =
    enganche.nodo !== null
      ? (servida.entradas.get(enganche.nodo) ?? []).map((i) => porElFinal(servida, i))
      : lasDosCaras(servida, enganche);
  return donde
    .filter((cara) => !vetada?.(cara.arista))
    .map((cara) => {
    const trozo = trozoDelEnganche(servida.comoRed, cara, false, false);
    return {
      arista: cara.arista,
      enganche: cara,
      trozo,
      segundos: segundosDeUnTrecho(servida, cara.arista, trozo.metros),
    };
  });
}

/** Una ruta de coche ya resuelta: los trozos, y lo que costó de verdad. */
export interface RutaDeCoche extends Ruta {
  /** Segundos de la red MÁS las transiciones. Ver la cabecera. */
  readonly segundos: number;
}

/**
 * ⭐ UN DESTINO DE LA BÚSQUEDA, con lo que cuesta lo que venga DESPUÉS de él.
 *
 * `extra` son segundos que se suman al comparar y que **no se conducen**: es el
 * paseo desde el aparcamiento hasta la puerta, ya multiplicado por lo malo que
 * es andar. Con un solo destino vale `0` y la comparación es la de siempre.
 */
export interface DestinoDelCoche {
  readonly enganche: Enganche;
  readonly punto: Punto;
  readonly extra: number;
}

/** Una ruta ya resuelta, con cuál de los destinos ganó. */
export interface RutaAlDestino extends RutaDeCoche {
  /** El índice dentro de `destinos`. Con uno solo, siempre `0`. */
  readonly cual: number;
  /** Lo que costó comparar: conducir MÁS el `extra` del que ganó. */
  readonly total: number;
}

/**
 * ⭐ LA BÚSQUEDA, y **acepta varios destinos de una sola pasada**.
 *
 * Uno solo es el viaje de la casilla 1b. Varios son los aparcamientos
 * candidatos de la 2, y hacerlo en una pasada es la diferencia entre una
 * respuesta y una espera: cuarenta búsquedas punto a punto serían cuarenta
 * Dijkstras del coche, y aquí es **uno**.
 *
 * Lo que se minimiza es `conducir + extra`, así que la comparación es la del
 * *car-to-park*: el aparcamiento que gana no es el más cercano al destino ni el
 * más cercano al origen, es el que **hace el viaje entero más barato**.
 *
 * ⚠️ **Con un solo destino, el caso trivial devuelve ahí mismo** — como hacía
 *    antes de existir esto—: el trecho directo por la misma calle es óptimo y
 *    no hay con qué compararlo. Con varios no se puede parar, porque otro
 *    candidato puede salir más barato aunque a éste se llegue de una tacada.
 */
function buscarEnCoche(
  servida: RedDeCocheServida,
  origen: Enganche,
  puntoOrigen: Punto,
  destinos: readonly DestinoDelCoche[],
  vetada?: AristaVetada,
  pestillo?: Pestillo,
): RutaAlDestino | null {
  const red = servida.comoRed;
  const cocinada = servida.cocinada;
  const unoSolo = destinos.length === 1;
  const conectorOrigen = conector(puntoOrigen, [origen.lon, origen.lat]);
  const conectorDe = (cual: number): readonly Punto[] =>
    conector([destinos[cual]!.enganche.lon, destinos[cual]!.enganche.lat], destinos[cual]!.punto);

  let mejorTotal = Infinity;
  let mejorLlegada = -1;
  let mejorAntes = -1;
  let mejorCual = -1;
  /** El trecho directo que va ganando, si alguno gana. */
  let trivial: { readonly trozo: TrozoDeRuta; readonly arista: number; readonly cual: number } | null =
    null;

  // ── ⭐ LOS DOS EN EL MISMO CRUCE: no hay nada que conducir ────────────────
  //
  // ⚠️ **Entrada nº30 de `docs/BITACORA.md`.** El caso trivial de abajo busca
  //    una arista que sea a la vez salida y llegada, y dos enganches pegados al
  //    MISMO NODO no comparten ninguna: las salidas son las que salen de él y
  //    las llegadas las que llegan a él. Sin este corte, la búsqueda tenía que
  //    irse del cruce y volver — 635 m para ir de CAMINO ABEJAR 71 TV C9 al
  //    C11, que están a 45,9 m—, o contestar que no había camino cuando el nodo
  //    no tiene por dónde volver. Son **672 nodos** con más de un portal pegado.
  for (let cual = 0; cual < destinos.length; cual++) {
    const d = destinos[cual]!;
    if (origen.nodo === null || d.enganche.nodo !== origen.nodo) {
      continue;
    }
    if (unoSolo) {
      return {
        metros: 0,
        trozos: [],
        conectorOrigen,
        conectorDestino: conectorDe(cual),
        trivial: true,
        nodosVisitados: 0,
        segundos: 0,
        cual,
        total: d.extra,
      };
    }
    if (d.extra < mejorTotal) {
      mejorTotal = d.extra;
      mejorCual = cual;
      trivial = { trozo: { arista: -1, metros: 0, g: [] }, arista: -1, cual };
    }
  }

  const salidas = salidasDelCoche(servida, origen, vetada);
  if (salidas.length === 0) {
    return null;
  }

  /**
   * Por arista de llegada, el remate más barato que la usa.
   *
   * ⚠️ Dos candidatos pueden caer en la MISMA arista —dos tramos de bordillo de
   *    la misma calle lo hacen a menudo—, y entonces manda el que salga más
   *    barato de aquí en adelante. El otro no se pierde: es que ese trozo de
   *    calle ya está representado por el mejor de los dos.
   */
  const alFinal = new Map<number, { puerta: PuertaDeCoche; cual: number; extra: number }>();
  for (let cual = 0; cual < destinos.length; cual++) {
    const d = destinos[cual]!;
    for (const llegada of llegadasDelCoche(servida, d.enganche, vetada)) {
      const ya = alFinal.get(llegada.arista);
      if (!ya || llegada.segundos + d.extra < ya.puerta.segundos + ya.extra) {
        alFinal.set(llegada.arista, { puerta: llegada, cual, extra: d.extra });
      }
    }
  }
  if (alFinal.size === 0) {
    return null;
  }

  // ── EL CASO TRIVIAL: los dos en la misma arista, y en el sentido bueno ────
  //
  // El trecho directo entre las dos proyecciones. Con el grafo dirigido hay que
  // mirarlo por las DOS caras: una calle de doble sentido siempre tiene una en
  // la que el destino queda por delante. En la de sentido único, si el destino
  // queda detrás no hay atajo que valga y se sigue al Dijkstra, que sabe dar la
  // vuelta a la manzana.
  for (const salida of salidas) {
    const remate = alFinal.get(salida.arista);
    if (!remate) {
      continue;
    }
    const desdeAqui = metrosHastaElEnganche(red, salida.enganche);
    const hastaAlli = metrosHastaElEnganche(red, remate.puerta.enganche);
    if (hastaAlli < desdeAqui) {
      continue;
    }
    const trozo = trozoEntreDosEnganches(red, salida.enganche, remate.puerta.enganche);
    const segundos = segundosDeUnTrecho(servida, salida.arista, trozo.metros);
    if (unoSolo) {
      return {
        metros: trozo.metros,
        trozos: trozo.metros === 0 ? [] : [trozo],
        conectorOrigen,
        conectorDestino: conectorDe(remate.cual),
        trivial: true,
        nodosVisitados: 0,
        segundos,
        cual: remate.cual,
        total: segundos + remate.extra,
      };
    }
    if (segundos + remate.extra < mejorTotal) {
      mejorTotal = segundos + remate.extra;
      mejorCual = remate.cual;
      trivial = { trozo, arista: salida.arista, cual: remate.cual };
    }
  }

  /**
   * ⭐ LA COTA que permite parar: **lo menos que puede costar lo que viene
   * después de cualquier destino todavía sin resolver**.
   *
   * Sacar una arista que ya cuesta `mejorTotal − esto` significa que ni el
   * candidato con el paseo más barato podría mejorar lo que ya se tiene. Es la
   * misma idea que el `break` de la búsqueda de un solo destino, con el paseo
   * dentro; sin ella, cuarenta candidatos obligarían a barrer la ciudad entera.
   */
  let cotaExtra = Infinity;
  for (const d of destinos) {
    cotaExtra = Math.min(cotaExtra, d.extra);
  }

  // ── Dijkstra POR TRANSICIONES, con las aristas de salida ya dentro ────────
  const libreta = elCuaderno(servida);
  libreta.consulta++;
  const marca = libreta.consulta;
  const monticulo = new Monticulo();
  const primeras = new Map<number, PuertaDeCoche>();
  for (const salida of salidas) {
    primeras.set(salida.arista, salida);
    if (libreta.sello[salida.arista] !== marca || libreta.coste[salida.arista]! > salida.segundos) {
      libreta.sello[salida.arista] = marca;
      libreta.coste[salida.arista] = salida.segundos;
      libreta.deArista[salida.arista] = -1;
      monticulo.meter(salida.arista, salida.segundos);
    }
  }

  let aristasVisitadas = 0;

  while (monticulo.tamano > 0) {
    const sacado = monticulo.sacar()!;
    const [arista, coste] = sacado;
    if (coste + cotaExtra >= mejorTotal) {
      // Lo que queda cuesta al menos esto: ya no puede mejorar la llegada.
      break;
    }
    if (libreta.cerrada[arista] === marca) {
      continue;
    }
    if (libreta.sello[arista] !== marca || coste > libreta.coste[arista]!) {
      continue;
    }
    libreta.cerrada[arista] = marca;
    aristasVisitadas++;

    for (const siguiente of cocinada.salidas.get(cocinada.aristas[arista]!.hasta) ?? []) {
      // ⭐ Y el veto del VIAJE, que es otra cosa que el de la relation: aquél
      //    prohíbe un giro, éste prohíbe una calle entera para este coche.
      if (vetada?.(siguiente)) {
        continue;
      }
      /**
       * ⭐ EL PESTILLO: de dentro **solo se sale para rematar**, y ahí se acaba.
       *
       * La transición prohibida es dentro → fuera, y con ella se cae la única
       * forma que tenía el camino de atravesar la zona en vez de entrar en ella.
       *
       * ⚠️ **Con una excepción, y está medida.** La puerta de un aparcamiento
       *    puede caer en una arista que NO está marcada aunque el aparcamiento
       *    sí esté dentro: `Puerta Cinegia` engancha a **58,6 m**, en Plaza
       *    España, a una arista de fuera a la que solo se llega desde dentro.
       *    Con el pestillo a secas ese aparcamiento se quedaba **sin ruta** y
       *    desaparecía del reparto — y es el que deja el paseo más corto de los
       *    cuatro. Salir para terminar no es atravesar: no hay «después».
       *
       *    Por eso se permite el salto **solo si `siguiente` remata**, y por eso
       *    de esa arista **no se sigue conduciendo** (el `continue` de abajo).
       *    Sin ese segundo corte, un remate de fuera sería un puente para cruzar
       *    la zona y seguir, que es justo lo que esto prohíbe.
       */
      const saliendo = pestillo !== undefined && pestillo(arista) && !pestillo(siguiente);
      if (saliendo && !alFinal.has(siguiente)) {
        continue;
      }
      // ⭐ AQUÍ es donde el veto prohíbe y la penalización cobra: `null` es que
      //    no se puede, y un número es lo que cuesta.
      const transicion = costeDeTransicion(cocinada, arista, siguiente);
      if (transicion === null) {
        continue;
      }
      const hastaElCruce = coste + transicion;

      // ⭐ LA LLEGADA SE MIRA EN LA RELAJACIÓN, no al cerrar la arista, y por un
      //    caso concreto: la arista de llegada puede ser también una de SALIDA
      //    con el destino DETRÁS del origen. Su coste ya lo puso la semilla, así
      //    que ninguna relajación lo mejoraría y al cerrarla se leería el coste
      //    de la semilla — que no es el de haber dado la vuelta a la manzana.
      //    Mirándolo aquí, cada camino que entra en ella se evalúa por lo que
      //    de verdad costó llegar.
      const remate = alFinal.get(siguiente);
      if (remate) {
        const total = hastaElCruce + remate.puerta.segundos + remate.extra;
        if (total < mejorTotal) {
          mejorTotal = total;
          mejorLlegada = siguiente;
          mejorAntes = arista;
          mejorCual = remate.cual;
          trivial = null;
        }
      }

      // ⭐ Y si se ha salido de la zona, aquí se acaba el viaje: ver arriba.
      if (saliendo) {
        continue;
      }

      if (libreta.cerrada[siguiente] === marca) {
        continue;
      }
      const nuevo = hastaElCruce + cocinada.aristas[siguiente]!.segundos;
      if (libreta.sello[siguiente] !== marca || nuevo < libreta.coste[siguiente]!) {
        libreta.sello[siguiente] = marca;
        libreta.coste[siguiente] = nuevo;
        libreta.deArista[siguiente] = arista;
        monticulo.meter(siguiente, nuevo);
      }
    }
  }

  // ⭐ Si el que gana es un trecho directo, se devuelve ése: la búsqueda no lo
  //    mejoró y rehacer el camino desde la semilla no tendría de dónde.
  if (trivial) {
    const segundos =
      trivial.arista < 0 ? 0 : segundosDeUnTrecho(servida, trivial.arista, trivial.trozo.metros);
    return {
      metros: trivial.trozo.metros,
      trozos: trivial.trozo.metros === 0 ? [] : [trivial.trozo],
      conectorOrigen,
      conectorDestino: conectorDe(trivial.cual),
      trivial: true,
      nodosVisitados: aristasVisitadas,
      segundos,
      cual: trivial.cual,
      total: mejorTotal,
    };
  }

  if (mejorLlegada < 0) {
    return null;
  }

  // ── Deshacer el camino: de la última arista hacia atrás hasta la semilla ──
  const alReves: number[] = [];
  let cual = mejorAntes;
  for (;;) {
    alReves.push(cual);
    const antes = libreta.deArista[cual]!;
    if (antes < 0) {
      break;
    }
    cual = antes;
  }

  const primera = primeras.get(alReves[alReves.length - 1]!);
  if (!primera) {
    return null;
  }
  const remate = alFinal.get(mejorLlegada)!;

  const trozos: TrozoDeRuta[] = [primera.trozo];
  let segundos = primera.segundos;
  for (let k = alReves.length - 2; k >= 0; k--) {
    const esta = alReves[k]!;
    trozos.push(trozoEntero(red, esta, cocinada.aristas[esta]!.desde));
    segundos += costeDeTransicion(cocinada, alReves[k + 1]!, esta) ?? 0;
    segundos += cocinada.aristas[esta]!.segundos;
  }
  segundos += costeDeTransicion(cocinada, alReves[0]!, mejorLlegada) ?? 0;
  segundos += remate.puerta.segundos;
  trozos.push(remate.puerta.trozo);

  let metros = 0;
  for (const trozo of trozos) {
    metros += trozo.metros;
  }

  return {
    metros,
    trozos,
    conectorOrigen,
    conectorDestino: conectorDe(mejorCual),
    trivial: false,
    nodosVisitados: aristasVisitadas,
    segundos,
    cual: mejorCual,
    total: mejorTotal,
  };
}

/**
 * Calcula la ruta en coche entre dos enganches. `null` si no hay camino.
 *
 * Como en los demás modos, `null` no es un error: es el resultado para dos
 * puntos que el coche no comunica.
 */
export function calcularRutaEnCoche(
  servida: RedDeCocheServida,
  origen: Enganche,
  puntoOrigen: Punto,
  destino: Enganche,
  puntoDestino: Punto,
  /** Lo que este viaje no puede pisar. Ver `AristaVetada`. */
  vetada?: AristaVetada,
): RutaDeCoche | null {
  return buscarEnCoche(
    servida,
    origen,
    puntoOrigen,
    [{ enganche: destino, punto: puntoDestino, extra: 0 }],
    vetada,
  );
}

/**
 * ⭐ EL MEJOR APARCAMIENTO, de una sola búsqueda: la ruta hasta él y cuál es.
 *
 * `paseos` son los segundos de andar desde cada candidato hasta la puerta, y
 * entran **multiplicados por lo malo que es andar** [OTP `walkReluctance`, el
 * 4,0 que la casa ya usa en el bus desde el 31/08]. Esa multiplicación es toda
 * la decisión: sin ella el motor aparcaría en el primer hueco de la ciudad y
 * mandaría a andar un kilómetro.
 */
export function rutaAlMejorAparcamiento(
  servida: RedDeCocheServida,
  origen: Enganche,
  puntoOrigen: Punto,
  candidatos: readonly { readonly enganche: Enganche; readonly punto: Punto }[],
  paseos: readonly number[],
  vetada?: AristaVetada,
  pestillo?: Pestillo,
): RutaAlDestino | null {
  if (candidatos.length === 0) {
    return null;
  }
  return buscarEnCoche(
    servida,
    origen,
    puntoOrigen,
    candidatos.map((c, k) => ({ ...c, extra: PESO_DE_ANDAR * (paseos[k] ?? 0) })),
    vetada,
    pestillo,
  );
}

/** Un trayecto vacío con su explicación, como en el resto de los modos. */
function conAviso(texto: string): Trayecto {
  return {
    modo: 'coche',
    pasos: [],
    geometria: [],
    avisos: [{ texto }],
    metros: 0,
    segundos: 0,
    tramos: [],
  };
}

/**
 * ⭐ LOS AVISOS DEL VIAJE — hoy, uno: la Zona de Bajas Emisiones.
 *
 * Va **en el doble sitio** [GOV.UK, el patrón de los desvíos]: arriba en el
 * resumen único, y junto al paso por el que se entra. Aquí se dice una sola
 * vez, con `paso` puesto, y quien pinta lo pone en los dos — que es exactamente
 * lo que el contrato estrena hoy para no tener que adivinarlo leyendo el texto.
 *
 * El paso es **el que cubre el primer trozo dentro de la zona**, no el que
 * empieza en él: se entra en mitad de una calle, y el paso que lo cuenta es el
 * que se está siguiendo. La llegada se queda fuera de la búsqueda a propósito:
 * no abre ningún tramo, así que no se «entra» en ella.
 */
export function avisosDeLaZbe(
  servida: RedDeCocheServida,
  trozos: readonly TrozoDeRuta[],
  aperturas: readonly number[],
  zbe: EstadoDeLaZbe,
): readonly Aviso[] {
  const paso = pasoDelPrimerTrozoEnLaZbe(servida, trozos, aperturas);
  if (paso === null) {
    // ⭐ Y si NO la pisa habiéndose pedido evitarla, se dice: quien preguntó
    //    tomó una decisión y tiene derecho a saber que se ha respetado.
    return zbe.noEntra && zbe.enVigor ? [{ texto: AVISO_ZBE_EVITADA }] : [];
  }
  // ⭐ Se dijo que el coche no entra y la ruta entra igual: entonces es que la
  //    zona no está en vigor ahora, y lo que hay que contar es el reloj.
  const texto = zbe.noEntra && !zbe.enVigor ? avisoDelRelojDeLaZbe(zbe.cuando) : AVISO_ZBE;
  return [{ texto, paso }];
}

/**
 * El índice del paso que cubre **el primer trozo que cae dentro de la zona**, o
 * `null` si la ruta no la pisa.
 *
 * Se saca aparte porque el remate en un aparcamiento público lo necesita igual y
 * con la misma regla: el paso que lo cuenta es el que se está siguiendo cuando
 * se entra, no el que empieza ahí. Sumar los `metros` redondeados de los pasos
 * para deducirlo es lo que dio el error de 6,9 m; por eso `escribirPasos`
 * devuelve las aperturas.
 */
function pasoDelPrimerTrozoEnLaZbe(
  servida: RedDeCocheServida,
  trozos: readonly TrozoDeRuta[],
  aperturas: readonly number[],
): number | null {
  const primero = trozos.findIndex((t) => servida.cocinada.aristas[t.arista]!.zbe);
  if (primero < 0) {
    return null;
  }
  let paso = 0;
  const cuantos = Math.max(1, aperturas.length - 1);
  for (let k = 0; k < cuantos; k++) {
    if (aperturas[k]! <= primero) {
      paso = k;
    }
  }
  return paso;
}

/**
 * ⭐ CUÁNDO ESTÁ EN VIGOR LA ZONA DE BAJAS EMISIONES.
 *
 * [FAQ oficial del Ayuntamiento, leída el 2/09/2026] *«de aplicación de lunes a
 * viernes de 8:00 a 20:00 horas»*. Fuera de esa franja **no hay nada que
 * vetar**, y vetar igualmente sería inventarse una restricción.
 *
 * ⚠️ **Por el reloj de la calle, no por UTC.** A las 00:30 de Zaragoza en UTC
 *    todavía es el día anterior, y el mismo cuidado tiene `hoyEnGtfs` para el
 *    día de servicio del bus. Es el patrón de `operaEl`: la fecha entra como
 *    parámetro para que una juez pueda mentirle al reloj sin esperar al martes.
 */
export const ZBE_DESDE_H = 8;
export const ZBE_HASTA_H = 20;

export function laZbeEstaEnVigor(cuando: Date): boolean {
  const dia = cuando.getDay();
  // 0 es domingo y 6 sábado: la franja es de lunes a viernes.
  if (dia === 0 || dia === 6) {
    return false;
  }
  const hora = cuando.getHours() + cuando.getMinutes() / 60;
  return hora >= ZBE_DESDE_H && hora < ZBE_HASTA_H;
}

/** ⭐ Lo que se veta cuando el coche no puede entrar: las aristas de la zona. */
export function vetoDeLaZbe(servida: RedDeCocheServida): AristaVetada {
  return (arista: number): boolean => servida.cocinada.aristas[arista]!.zbe === true;
}

/**
 * ⭐ EL AVISO DE LA RUTA BUSCADA **SIN ENTRAR** en la zona.
 *
 * No es el mismo que el de la que la atraviesa: aquél informa de una norma,
 * éste confirma que se ha respetado lo que quien pregunta contestó.
 *
 * ⚠️ **Y NO DICE «RODEA», que es lo que decía y era falso.** Medido el 3/09
 *    sobre 200 peticiones: con el veto puesto, el aviso salía en **178 de 178**
 *    rutas — también en `PEDRO LAPUYADE 3 → CAMINO DE EN MEDIO 120`, que se va
 *    al otro extremo de la ciudad y no se acerca al casco—. Decirle a alguien
 *    que su ruta rodea algo que no tenía por delante es una molestia pequeña y
 *    una mentira entera. Lo que SÍ es cierto siempre es que se ha buscado con
 *    la zona cerrada, y eso es lo que dice.
 *
 * Saber si además ha habido rodeo de verdad costaría **una segunda búsqueda**
 * —la misma ruta sin el veto, para compararlas—, y eso no lo pide nadie
 * todavía. Queda escrito por si algún día lo pide.
 */
export const AVISO_ZBE_EVITADA =
  'Esta ruta se ha buscado sin entrar en la Zona de Bajas Emisiones, porque el vehículo no ' +
  'puede: de lunes a viernes de 8:00 a 20:00 los vehículos sin distintivo necesitan autorización';

/**
 * ⭐ EL AVISO DEL REMATE EN UN APARCAMIENTO PÚBLICO (3/09, casilla 2-bis).
 *
 * ── Por qué existe, y por qué no es un rodeo ────────────────────────────────
 *
 * La respuesta anterior a un destino de dentro era «no hay forma de llegar sin
 * entrar». Es verdad **a medias**, y la mitad que falta es la que importa: la
 * norma municipal permite entrar precisamente para ir a un aparcamiento
 * público. Callarla es lo que hace la industria —[TomTom SDK, literal] *«la
 * evitación no está garantizada si no existe ruta alternativa»*, y entra en la
 * zona sin decir nada—; aquí la alternativa **es legal y se ofrece**.
 *
 * ── De dónde sale, palabra por palabra ──────────────────────────────────────
 *
 * Del **trámite municipal 42155** («Zona de Bajas Emisiones: registro»),
 * `https://www.zaragoza.es/sede/servicio/tramite/42155`, **leído el
 * 03/09/2026** (ver § 1.32). Entre los casos que pueden obtener autorización
 * registral figura, literal:
 *
 *   *«Vehículos que accedan a estacionamientos públicos con sistema de control
 *   de acceso conectado.»*
 *
 * Y los otros que el aviso enumera son de la misma lista: *«Vehículo asociado a
 * plaza de garajes dentro de la ZBE»*, *«Vehículo con tarjeta de residente de
 * estacionamiento regulado dentro de la ZBE»*, *«Vehículo Transporta Persona
 * con Movilidad Reducida PMR»*.
 *
 * ⚠️ **Lo que el aviso NO dice, porque el dato no lo sabe.** Ni que ese
 *    aparcamiento tenga «sistema de control de acceso conectado» —el catálogo
 *    55 no trae ese campo—, ni que siga abierto: sus filas están selladas en
 *    **2013-07-08**. Por eso la frase describe **la norma**, no promete la
 *    plaza, y dice «con registro municipal», que es lo que hay que hacer.
 */
export function avisoDelRemateEnParking(nombre: string): string {
  return (
    'Tu destino queda dentro de la Zona de Bajas Emisiones. Sin distintivo solo se puede entrar ' +
    'con autorización (residentes, plaza de garaje, PMR, o acceso a aparcamiento público ' +
    `conectado — con registro municipal). Esta ruta remata en el aparcamiento público ${nombre}.`
  );
}

/** Y el hito, con la misma cautela: la norma, nunca la promesa de la plaza. */
export function textoDeAparcarEnParking(nombre: string): string {
  return (
    `Aparca en el aparcamiento público ${nombre} — la ZBE permite el acceso a ` +
    'aparcamientos públicos conectados, con registro municipal'
  );
}

/** Y cuando no hay forma de llegar sin entrar: se dice, y no se entra. */
export const AVISO_ZBE_SIN_RUTA =
  'No hay forma de llegar en coche sin entrar en la Zona de Bajas Emisiones, y de lunes a ' +
  'viernes de 8:00 a 20:00 los vehículos sin distintivo necesitan autorización';

/**
 * ⭐ Y EL DEL RELOJ: se dijo que el coche no puede entrar, pero **ahora la zona
 * no está en vigor**, así que no se ha vetado nada y la ruta la atraviesa.
 *
 * Dice la hora que se ha mirado. Sin ella, quien lo lea no sabe si el motor ha
 * mirado el reloj o se lo ha saltado.
 */
export function avisoDelRelojDeLaZbe(cuando: Date): string {
  const dos = (n: number): string => String(n).padStart(2, '0');
  return (
    'La ruta atraviesa la Zona de Bajas Emisiones, pero ahora no está en vigor: se aplica de ' +
    `lunes a viernes de ${ZBE_DESDE_H}:00 a ${ZBE_HASTA_H}:00, y son las ` +
    `${dos(cuando.getHours())}:${dos(cuando.getMinutes())} del ${DIAS[cuando.getDay()]!}`
  );
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;

/**
 * ⚠️ **CUÁNTOS APARCAMIENTOS SE PRUEBAN: 40. Y es RENDIMIENTO, no un radio.**
 *
 * No hay ninguna distancia a partir de la cual un aparcamiento «no existe»:
 * quien elige es el coste. Lo que hay es un límite a cuántos se calculan, y es
 * exactamente el papel de los 40 postes candidatos del bus desde el 31/08
 * —[DOC OTP2] *«el límite de acceso es de rendimiento»*, y [OTP #3555] recomienda
 * *«limitar el número de aparcamientos»* por lo mismo—.
 *
 * Cada candidato cuesta **un Dijkstra del peatón** —los metros del paseo son
 * metros andados de verdad, nunca en recta—; conducir hasta los cuarenta, en
 * cambio, cuesta **una sola** búsqueda del coche. Ver `buscarEnCoche`.
 */
export const APARCAMIENTOS_CANDIDATOS = 40;

/** ⭐ EL HITO: «Aparca en CALLE X: zona azul (rotación)». */
function hitoDeAparcar(motor: Motor, donde: DondeAparcar): Paso {
  const partes: ParteDelPaso[] = [{ papel: 'accion', texto: 'Aparca' }];
  if (donde.via !== null && donde.via.trim() !== '') {
    partes.push(
      { papel: 'texto', texto: ' en ' },
      { papel: 'via', texto: comoSePresenta(donde.via, true, motor.red.articulosPropios) },
    );
  }
  // ⚠️ Y detrás, lo que el DATO dice de ese sitio y nada más: ni tarifa ni
  //    franja en el regulado —el censo no las trae—, y el horario de la PMR tal
  //    cual viene. Ver la cabecera de `aparcamiento.ts`.
  partes.push({ papel: 'texto', texto: `: ${donde.detalle}` });
  return {
    giro: 'aparca',
    texto: partes.map((x) => x.texto).join(''),
    // Un hito no abre tramo: es una parada. Los metros del paseo los lleva el
    // paso que lo abre, como en el aparcabicis y en la estación de BiZi.
    metros: 0,
    partes,
  };
}

/**
 * ⭐ EL HITO DEL APARCAMIENTO PÚBLICO, con la norma detrás y ninguna promesa.
 *
 * El nombre va con `papel: 'via'` como el de una estación de BiZi o el de un
 * poste: es **la cosa que se nombra**, y la pantalla ya sabe destacarla.
 */
function hitoDeAparcarEnParking(nombre: string): Paso {
  const partes: ParteDelPaso[] = [
    { papel: 'accion', texto: 'Aparca' },
    { papel: 'texto', texto: ' en el aparcamiento público ' },
    { papel: 'via', texto: nombre },
    {
      papel: 'texto',
      texto:
        ' — la ZBE permite el acceso a aparcamientos públicos conectados, con registro municipal',
    },
  ];
  return {
    giro: 'aparca',
    texto: partes.map((x) => x.texto).join(''),
    metros: 0,
    partes,
  };
}

/**
 * ⭐ LOS SEGUNDOS DE CADA TROZO, con la transición que lleva hasta él.
 *
 * Se calcula **con la misma fórmula con la que se armó `ruta.segundos`** —el
 * primero y el último son trechos parciales del enganche, los de en medio son
 * aristas enteras, y cada uno paga la transición por la que se llegó—, así que
 * la suma de todos es exactamente el total. Si saliera de otra cuenta parecida,
 * un día dejarían de sumar y nadie sabría cuál de las dos miente.
 */
function segundosPorTrozo(servida: RedDeCocheServida, ruta: RutaDeCoche): readonly number[] {
  const cocinada = servida.cocinada;
  const cuantos = ruta.trozos.length;
  return ruta.trozos.map((trozo, k) => {
    const propio =
      k === 0 || k === cuantos - 1
        ? segundosDeUnTrecho(servida, trozo.arista, trozo.metros)
        : cocinada.aristas[trozo.arista]!.segundos;
    const antes = k === 0 ? 0 : (costeDeTransicion(cocinada, ruta.trozos[k - 1]!.arista, trozo.arista) ?? 0);
    return propio + antes;
  });
}

/**
 * La etapa que se conduce, ya narrada y **partida por la Zona de Bajas
 * Emisiones** (3/09, casilla 3-bis).
 *
 * ⭐ **El corte lo da el motor y sale de la MARCA de la arista**, no de cruzar
 * la línea con el polígono. Las dos preguntas no dan lo mismo: la cocina marca
 * una arista por su punto medio (§ 1.30), así que las calles del borde —Coso,
 * Echegaray, César Augusto— entran y salen del polígono sin estar marcadas.
 * Medido el 3/09: la ruta a `CALLE CASTA ÁLVAREZ 41` entra **cuatro veces** en
 * el polígono y pisa **una sola racha** de aristas marcadas.
 *
 * Y se usa `geometriaPorModo`, que es la misma máquina con la que la rueda
 * separa lo empujado: el corte sale **de la misma vuelta que construye los
 * puntos**, así que no puede derivar de ellos. Ver su cabecera.
 */
export function etapaEnCoche(
  servida: RedDeCocheServida,
  ruta: RutaDeCoche,
  origen: Extremo,
  destino: Extremo,
  costuras?: Costuras,
): { readonly etapa: Etapa; readonly aperturas: readonly number[] } {
  const aperturas: number[] = [];
  const pasos = escribirPasos(
    servida.comoRed,
    ruta,
    origen.nombre,
    destino.nombre,
    [destino.lon, destino.lat],
    undefined,
    costuras,
    aperturas,
  );
  const troceada = geometriaPorModo(
    ruta,
    (arista) => servida.cocinada.aristas[arista]!.zbe === true,
  );
  const geometria: Vertice[] = troceada.puntos.map(([lon, lat]) => [lat, lon]);
  const porTrozo = segundosPorTrozo(servida, ruta);
  return {
    etapa: {
      pasos,
      geometria,
      metros: ruta.metros,
      segundos: ruta.segundos,
      tramos:
        troceada.cortes.length === 0
          ? // Una ruta sin trozos —los dos extremos en el mismo cruce— no tiene
            // nada que partir, y el contrato exige al menos un tramo.
            [
              {
                comoSeVa: 'rodando' as const,
                desde: 0,
                hasta: Math.max(0, geometria.length - 1),
                metros: ruta.metros,
                segundos: ruta.segundos,
                zbe: false,
              },
            ]
          : troceada.cortes.map((corte) => ({
              // En coche no hay empuje ni cambio de vehículo: se conduce todo, y
              // lo que cambia entre un corte y otro no es la manera sino el sitio.
              comoSeVa: 'rodando' as const,
              desde: corte.desde,
              hasta: corte.hasta,
              metros: ruta.trozos
                .slice(corte.primerTrozo, corte.ultimoTrozo + 1)
                .reduce((suma, t) => suma + t.metros, 0),
              segundos: porTrozo
                .slice(corte.primerTrozo, corte.ultimoTrozo + 1)
                .reduce((suma, x) => suma + x, 0),
              zbe: corte.marcado,
            })),
    },
    aperturas,
  };
}

/** Lo que se puede pedir además de ir de un sitio a otro. */
export interface OpcionesDelCoche {
  /** Dónde dejar el coche. Sin esto, la ruta llega hasta la puerta (1b). */
  readonly aparcamiento?: TipoDeAparcamiento;
  /** Si el coche puede entrar en la ZBE. Sin esto, se avisa y no se veta. */
  readonly puedeEntrarEnLaZbe?: boolean;
  /** El reloj con el que se mira la franja. Se inyecta para poder mentirle. */
  readonly cuando?: Date;
}

/**
 * ⭐ EL VIAJE EN COCHE, de punta a punta.
 *
 * Sin `aparcamiento`, **un solo tramo** `comoSeVa: 'rodando'` hasta la puerta,
 * que es lo que hacía la casilla 1b y sigue saliendo al byte. Con él, **dos**:
 * se conduce hasta el mejor sitio de ese tipo y se anda el resto [DOC OTP2,
 * *car-to-park*].
 *
 * Y `rodando` **no es un campo nuevo**: el contrato separa la bici, el patín y
 * la BiZi por `Trayecto.modo`, no por el tramo — los tres son `rodando`—, y el
 * criterio de `montado` está escrito y es explícito: *«quien va montado no
 * elige el camino, lo elige la línea»*. El conductor elige y no hay línea. El
 * hito de dejar el coche es `aparca`, **el mismo que el de la bici**: es el
 * mismo suceso para quien pinta.
 */
export function viajeEnCoche(
  servida: RedDeCocheServida,
  motor: Motor,
  origen: Extremo,
  destino: Extremo,
  opciones?: OpcionesDelCoche,
): Trayecto {
  const cuando = opciones?.cuando ?? new Date();
  const enVigor = laZbeEstaEnVigor(cuando);
  const noEntra = opciones?.puedeEntrarEnLaZbe === false;
  // ⭐ Se veta **solo si las dos cosas**: que el coche no pueda entrar y que la
  //    zona esté en vigor. Fuera de la franja no hay nada que vetar.
  const vetada = noEntra && enVigor ? vetoDeLaZbe(servida) : undefined;
  const sinRuta = (texto: string): Trayecto => conAviso(texto);

  /**
   * ⭐ UN EXTREMO QUE CAE DENTRO DE LA ZONA se dice, no se disimula.
   *
   * ⚠️ Y hay que mirarlo **sobre el enganche SIN filtrar**. Con el filtro
   *    puesto, un portal del casco engancharía a la primera calle de fuera que
   *    pillara —hasta 250 m—, y la respuesta sería una ruta que deja a alguien
   *    en el borde de la zona sin decirle que su portal está dentro. Eso no es
   *    una ruta: es una ruta a otro sitio.
   */
  const dentroDeLaZona = (donde: Extremo): boolean => {
    if (!vetada) {
      return false;
    }
    const crudo = enganchar(servida.comoRed, servida.rejilla, donde.lon, donde.lat);
    return crudo !== null && vetada(crudo.arista);
  };
  if (dentroDeLaZona(origen)) {
    // Del origen no hay remate posible: el coche ya está dentro, y sacarlo sin
    // pisar la zona es justo lo que no se puede.
    return sinRuta(`${AVISO_ZBE_SIN_RUTA}. ${origen.nombre} queda dentro de la zona.`);
  }

  const engancheOrigen = enganchar(
    servida.comoRed,
    servida.rejilla,
    origen.lon,
    origen.lat,
    vetada && ((arista: number): boolean => !vetada(arista)),
  );
  if (!engancheOrigen) {
    return sinRuta(
      vetada
        ? AVISO_ZBE_SIN_RUTA
        : `${origen.nombre} no tiene cerca ninguna calle por la que pueda circular un ` +
            'coche en nuestro mapa: desde ahí no podemos calcular una ruta en coche.',
    );
  }

  /**
   * ⭐ EL DESTINO DENTRO DE LA ZONA: **se remata en un aparcamiento público**.
   *
   * Hasta la casilla 2 esto contestaba «no hay forma de llegar sin entrar». Era
   * verdad y era corto: la ordenanza deja entrar precisamente para ir a un
   * aparcamiento público conectado [§ 1.32], así que la ruta existe y se da.
   *
   * ⚠️ **Manda sobre `aparcamiento`.** Si además se pidió bordillo de un tipo,
   *    no se mira: los bordillos de dentro están vetados —aparcar ahí es la
   *    sanción por estar— y los de fuera dejarían el coche antes de la zona sin
   *    contar que la alternativa legal existía.
   *
   * El `vetada &&` de delante no es defensivo: `dentroDeLaZona` ya devuelve
   * `false` sin veto. Está para que el tipo llegue estrechado a la función, que
   * lo necesita **no como veto sino como pestillo**.
   */
  if (vetada && dentroDeLaZona(destino)) {
    const alParking = viajeAlParkingDeLaZbe(
      servida,
      motor,
      origen,
      destino,
      engancheOrigen,
      vetada,
    );
    if (alParking) {
      return alParking;
    }
    // Sin ningún aparcamiento público al que llegar Y desde el que andar, se
    // vuelve a la respuesta honrada de la casilla 2.
    return sinRuta(`${AVISO_ZBE_SIN_RUTA}. ${destino.nombre} queda dentro de la zona.`);
  }

  if (opciones?.aparcamiento) {
    const conParking = viajeConAparcamiento(
      servida,
      motor,
      origen,
      destino,
      engancheOrigen,
      opciones.aparcamiento,
      vetada,
      { enVigor, noEntra, cuando },
    );
    if (conParking) {
      return conParking;
    }
    // Sin sitio donde dejar el coche del tipo pedido, la ruta no se maquilla:
    // se cae al viaje hasta la puerta y **se dice** por qué, más abajo.
  }

  const engancheDestino = enganchar(
    servida.comoRed,
    servida.rejilla,
    destino.lon,
    destino.lat,
    vetada && ((arista: number): boolean => !vetada(arista)),
  );
  if (!engancheDestino) {
    return sinRuta(
      vetada
        ? AVISO_ZBE_SIN_RUTA
        : `${destino.nombre} no tiene cerca ninguna calle por la que pueda circular un ` +
            'coche en nuestro mapa: hasta ahí no podemos calcular una ruta en coche.',
    );
  }

  const ruta = calcularRutaEnCoche(
    servida,
    engancheOrigen,
    [origen.lon, origen.lat],
    engancheDestino,
    [destino.lon, destino.lat],
    vetada,
  );
  if (!ruta) {
    return sinRuta(
      vetada
        ? AVISO_ZBE_SIN_RUTA
        : `No hay forma de ir en coche de ${origen.nombre} a ${destino.nombre} ` +
            'por las calles que conocemos.',
    );
  }

  const { etapa, aperturas } = etapaEnCoche(servida, ruta, origen, destino);
  return juntar(
    {
      modo: 'coche',
      avisos: avisosDeLaZbe(servida, ruta.trozos, aperturas, { enVigor, noEntra, cuando }),
    },
    [etapa],
  );
}

/** Lo que hace falta saber del reloj y del distintivo para redactar el aviso. */
interface EstadoDeLaZbe {
  readonly enVigor: boolean;
  readonly noEntra: boolean;
  readonly cuando: Date;
}

/**
 * ⭐ EL VIAJE CON APARCAMIENTO: conducir, dejar el coche, y andar.
 *
 * Devuelve `null` cuando no hay ningún sitio de ese tipo al que se pueda
 * conducir Y desde el que se pueda andar. No decide avisos ni maquilla nada:
 * quien llama se cae al viaje hasta la puerta.
 */
function viajeConAparcamiento(
  servida: RedDeCocheServida,
  motor: Motor,
  origen: Extremo,
  destino: Extremo,
  engancheOrigen: Enganche,
  tipo: TipoDeAparcamiento,
  vetada: AristaVetada | undefined,
  zbe: EstadoDeLaZbe,
): Trayecto | null {
  const candidatos = dondeAparcarCerca(
    elAparcamiento(),
    tipo,
    destino.lon,
    destino.lat,
    APARCAMIENTOS_CANDIDATOS,
  );

  const utiles: { readonly donde: DondeAparcar; readonly enganche: Enganche; readonly paseo: number }[] =
    [];
  for (const donde of candidatos) {
    const enCoche = enganchar(servida.comoRed, servida.rejilla, donde.lon, donde.lat);
    if (!enCoche) {
      continue;
    }
    // ⭐ **Y LA ZONA SE VETA TAMBIÉN COMO SITIO DONDE APARCAR.** Vetarla solo en
    //    la búsqueda dejaría al coche aparcado dentro después de haberla
    //    rodeado, que es peor que no haberla rodeado: la sanción es por estar.
    //
    // ⚠️ **Medido: hoy esto es REDUNDANTE, y se queda.** La contraprueba del
    //    encargo —vetar solo la búsqueda— no consigue aparcar dentro, porque
    //    para llegar a un bordillo de la zona hay que pisar una arista de la
    //    zona y la relajación no deja. Se escribe igual por dos razones: dice
    //    la intención en el sitio donde alguien la buscaría, y el día que el
    //    veto de la búsqueda se afloje —una ZBE con excepciones por calle, por
    //    ejemplo— esto sigue siendo verdad sin que nadie tenga que acordarse.
    if (vetada && vetada(enCoche.arista)) {
      continue;
    }
    const parada: Extremo = { lon: donde.lon, lat: donde.lat, nombre: nombreDelSitio(donde) };
    const aPie = etapaAndando(motor, parada, destino, { apertura: 'Sal andando' });
    if (!aPie) {
      continue;
    }
    utiles.push({ donde, enganche: enCoche, paseo: aPie.segundos });
  }
  if (utiles.length === 0) {
    return null;
  }

  const mejor = rutaAlMejorAparcamiento(
    servida,
    engancheOrigen,
    [origen.lon, origen.lat],
    utiles.map((u) => ({ enganche: u.enganche, punto: [u.donde.lon, u.donde.lat] as Punto })),
    utiles.map((u) => u.paseo),
    vetada,
  );
  if (!mejor) {
    return null;
  }
  const gana = utiles[mejor.cual]!;
  const parada: Extremo = {
    lon: gana.donde.lon,
    lat: gana.donde.lat,
    nombre: nombreDelSitio(gana.donde),
  };
  const { etapa, aperturas } = etapaEnCoche(servida, mejor, origen, parada, {
    cierre: hitoDeAparcar(motor, gana.donde),
  });
  const aPie = etapaAndando(motor, parada, destino, { apertura: 'Sal andando' });
  if (!aPie) {
    return null;
  }
  return juntar(
    {
      modo: 'coche',
      avisos: avisosDeLaZbe(servida, mejor.trozos, aperturas, zbe),
    },
    // El tramo que se conduce MUERE en el aparcamiento: ahí va el icono. El que
    // se anda muere en el portal, que ya lleva su chincheta de destino.
    [{ ...etapa, hito: 'aparca' }, aPie],
  );
}

/**
 * ⭐ EL REMATE EN UN APARCAMIENTO PÚBLICO DE LA ZONA (3/09, casilla 2-bis).
 *
 * Conducir hasta el mejor **por coste** de los aparcamientos públicos que caen
 * dentro de la fase 1, dejar el coche, y andar el resto. La elección es la misma
 * del *car-to-park* de la casilla 2 —conducir más andar por `PESO_DE_ANDAR`—, y
 * los candidatos son **los cuatro**: no hace falta acotar por cercanía porque
 * cuatro caben enteros.
 *
 * ── La geometría manda, y hay que decirla ───────────────────────────────────
 *
 * El aparcamiento **está dentro de la zona**: llegar a su puerta pisa aristas de
 * la ZBE, y eso es exactamente lo que la excepción permite. Lo que no se puede
 * es **atravesarla de paso**, y por eso la búsqueda va con `Pestillo` y no con
 * veto: se entra una vez, y de dentro ya no se sale. Ver `Pestillo`.
 *
 * ⚠️ **Lo que NO se promete.** Ni que el aparcamiento siga abierto —el catálogo
 *    55 sella sus filas en 2013— ni que tenga el «sistema de control de acceso
 *    conectado» que la norma pide: ese campo no existe en el dato. El aviso
 *    cuenta la norma y manda al registro municipal; no vende la plaza.
 *
 * Devuelve `null` si no hay ninguno al que se pueda conducir y desde el que se
 * pueda andar hasta el portal — y entonces quien llama contesta lo de antes.
 */
function viajeAlParkingDeLaZbe(
  servida: RedDeCocheServida,
  motor: Motor,
  origen: Extremo,
  destino: Extremo,
  engancheOrigen: Enganche,
  enLaZona: AristaVetada,
): Trayecto | null {
  const utiles: {
    readonly parking: ParkingCocinado;
    readonly enganche: Enganche;
    readonly paseo: number;
  }[] = [];
  for (const parking of losParkingsDeLaFase1()) {
    // ⭐ Sin filtro: la arista del aparcamiento ES de la zona, y eso es el caso.
    const enCoche = enganchar(servida.comoRed, servida.rejilla, parking.lon, parking.lat);
    if (!enCoche) {
      continue;
    }
    const aPie = etapaAndando(motor, extremoDelParking(parking), destino, {
      apertura: 'Sal andando',
    });
    if (!aPie) {
      continue;
    }
    utiles.push({ parking, enganche: enCoche, paseo: aPie.segundos });
  }
  if (utiles.length === 0) {
    return null;
  }

  const mejor = rutaAlMejorAparcamiento(
    servida,
    engancheOrigen,
    [origen.lon, origen.lat],
    utiles.map((u) => ({
      enganche: u.enganche,
      punto: [u.parking.lon, u.parking.lat] as Punto,
    })),
    utiles.map((u) => u.paseo),
    // Ninguna calle cerrada —al aparcamiento hay que entrar— y el pestillo
    // puesto: entrar, sí; atravesar, no.
    undefined,
    enLaZona,
  );
  if (!mejor) {
    return null;
  }

  const gana = utiles[mejor.cual]!;
  const parada = extremoDelParking(gana.parking);
  const { etapa, aperturas } = etapaEnCoche(servida, mejor, origen, parada, {
    cierre: hitoDeAparcarEnParking(gana.parking.nombre),
  });
  const aPie = etapaAndando(motor, parada, destino, { apertura: 'Sal andando' });
  if (!aPie) {
    return null;
  }
  const paso = pasoDelPrimerTrozoEnLaZbe(servida, mejor.trozos, aperturas);
  const aviso: Aviso =
    paso === null
      ? { texto: avisoDelRemateEnParking(gana.parking.nombre) }
      : { texto: avisoDelRemateEnParking(gana.parking.nombre), paso };
  return juntar({ modo: 'coche', avisos: [aviso] }, [{ ...etapa, hito: 'aparca' }, aPie]);
}

/** Cómo se nombra un aparcamiento público en los pasos y en los extremos. */
function extremoDelParking(parking: ParkingCocinado): Extremo {
  return {
    lon: parking.lon,
    lat: parking.lat,
    nombre: `el aparcamiento público ${parking.nombre}`,
  };
}

/** Cómo se llama el sitio donde se deja el coche, para los pasos. */
function nombreDelSitio(donde: DondeAparcar): string {
  return donde.via !== null && donde.via.trim() !== ''
    ? `el aparcamiento de ${donde.via}`
    : 'el aparcamiento';
}
