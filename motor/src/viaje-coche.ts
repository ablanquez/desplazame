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
  geometriaDe,
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
function salidasDelCoche(servida: RedDeCocheServida, enganche: Enganche): PuertaDeCoche[] {
  const donde: Enganche[] =
    enganche.nodo !== null
      ? (servida.cocinada.salidas.get(enganche.nodo) ?? []).map((i) => porElPrincipio(servida, i))
      : lasDosCaras(servida, enganche);
  return donde.map((cara) => {
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
function llegadasDelCoche(servida: RedDeCocheServida, enganche: Enganche): PuertaDeCoche[] {
  const donde: Enganche[] =
    enganche.nodo !== null
      ? (servida.entradas.get(enganche.nodo) ?? []).map((i) => porElFinal(servida, i))
      : lasDosCaras(servida, enganche);
  return donde.map((cara) => {
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

  const salidas = salidasDelCoche(servida, origen);
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
    for (const llegada of llegadasDelCoche(servida, d.enganche)) {
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
): RutaDeCoche | null {
  return buscarEnCoche(servida, origen, puntoOrigen, [
    { enganche: destino, punto: puntoDestino, extra: 0 },
  ]);
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
): RutaAlDestino | null {
  if (candidatos.length === 0) {
    return null;
  }
  return buscarEnCoche(
    servida,
    origen,
    puntoOrigen,
    candidatos.map((c, k) => ({ ...c, extra: PESO_DE_ANDAR * (paseos[k] ?? 0) })),
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
export function avisosDelCoche(
  servida: RedDeCocheServida,
  trozos: readonly TrozoDeRuta[],
  aperturas: readonly number[],
): readonly Aviso[] {
  const primero = trozos.findIndex((t) => servida.cocinada.aristas[t.arista]!.zbe);
  if (primero < 0) {
    return [];
  }
  let paso = 0;
  const cuantos = Math.max(1, aperturas.length - 1);
  for (let k = 0; k < cuantos; k++) {
    if (aperturas[k]! <= primero) {
      paso = k;
    }
  }
  return [{ texto: AVISO_ZBE, paso }];
}

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

/** ⭐ EL HITO: «Aparca en CALLE X: zona regulada (ESRO)». */
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

/** La etapa que se conduce, ya narrada y con sus tramos. */
function etapaEnCoche(
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
  const geometria: Vertice[] = geometriaDe(ruta).map(([lon, lat]) => [lat, lon]);
  return {
    etapa: {
      pasos,
      geometria,
      metros: ruta.metros,
      segundos: ruta.segundos,
      // En coche no hay empuje ni cambio de vehículo: un solo sub-tramo.
      tramos: [
        {
          comoSeVa: 'rodando',
          desde: 0,
          hasta: Math.max(0, geometria.length - 1),
          metros: ruta.metros,
          segundos: ruta.segundos,
        },
      ],
    },
    aperturas,
  };
}

/** Lo que se puede pedir además de ir de un sitio a otro. */
export interface OpcionesDelCoche {
  /** Dónde dejar el coche. Sin esto, la ruta llega hasta la puerta (1b). */
  readonly aparcamiento?: TipoDeAparcamiento;
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
  const sinRuta = (texto: string): Trayecto => conAviso(texto);

  const engancheOrigen = enganchar(
    servida.comoRed,
    servida.rejilla,
    origen.lon,
    origen.lat,
  );
  if (!engancheOrigen) {
    return sinRuta(
      `${origen.nombre} no tiene cerca ninguna calle por la que pueda circular un ` +
        'coche en nuestro mapa: desde ahí no podemos calcular una ruta en coche.',
    );
  }

  if (opciones?.aparcamiento) {
    const conParking = viajeConAparcamiento(
      servida,
      motor,
      origen,
      destino,
      engancheOrigen,
      opciones.aparcamiento,
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
  );
  if (!engancheDestino) {
    return sinRuta(
      `${destino.nombre} no tiene cerca ninguna calle por la que pueda circular un ` +
        'coche en nuestro mapa: hasta ahí no podemos calcular una ruta en coche.',
    );
  }

  const ruta = calcularRutaEnCoche(
    servida,
    engancheOrigen,
    [origen.lon, origen.lat],
    engancheDestino,
    [destino.lon, destino.lat],
  );
  if (!ruta) {
    return sinRuta(
      `No hay forma de ir en coche de ${origen.nombre} a ${destino.nombre} ` +
        'por las calles que conocemos.',
    );
  }

  const { etapa, aperturas } = etapaEnCoche(servida, ruta, origen, destino);
  return juntar(
    {
      modo: 'coche',
      avisos: avisosDelCoche(servida, ruta.trozos, aperturas),
    },
    [etapa],
  );
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
      avisos: avisosDelCoche(servida, mejor.trozos, aperturas),
    },
    // El tramo que se conduce MUERE en el aparcamiento: ahí va el icono. El que
    // se anda muere en el portal, que ya lleva su chincheta de destino.
    [{ ...etapa, hito: 'aparca' }, aPie],
  );
}

/** Cómo se llama el sitio donde se deja el coche, para los pasos. */
function nombreDelSitio(donde: DondeAparcar): string {
  return donde.via !== null && donde.via.trim() !== ''
    ? `el aparcamiento de ${donde.via}`
    : 'el aparcamiento';
}
