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
 *
 * ⚠️ **Todavía sin avisos**: la Zona de Bajas Emisiones entra en el commit de al
 *    lado, que es el que trae su letra oficial y el campo del contrato en el que
 *    viaja. Aquí `avisos` va vacío a propósito, no por olvido.
 */

import type { Paso, Trayecto, Vertice } from '@desplazame/tipos';
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
import { escribirPasos } from './pasos.ts';
import type { Extremo } from './etapas.ts';

/** Un punto en `[lon, lat]`, como el grafo. */
type Punto = readonly [number, number];

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
  const red = servida.comoRed;
  const cocinada = servida.cocinada;
  const conectorOrigen = conector(puntoOrigen, [origen.lon, origen.lat]);
  const conectorDestino = conector([destino.lon, destino.lat], puntoDestino);

  const salidas = salidasDelCoche(servida, origen);
  const llegadas = llegadasDelCoche(servida, destino);
  if (salidas.length === 0 || llegadas.length === 0) {
    return null;
  }
  /** Por arista de llegada, la puerta: dos enganches no caen en la misma. */
  const alFinal = new Map<number, PuertaDeCoche>();
  for (const llegada of llegadas) {
    alFinal.set(llegada.arista, llegada);
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
    const hastaAlli = metrosHastaElEnganche(red, remate.enganche);
    if (hastaAlli < desdeAqui) {
      continue;
    }
    const trozo = trozoEntreDosEnganches(red, salida.enganche, remate.enganche);
    return {
      metros: trozo.metros,
      trozos: trozo.metros === 0 ? [] : [trozo],
      conectorOrigen,
      conectorDestino,
      trivial: true,
      nodosVisitados: 0,
      segundos: segundosDeUnTrecho(servida, salida.arista, trozo.metros),
    };
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

  let mejorTotal = Infinity;
  let mejorLlegada = -1;
  let mejorAntes = -1;
  let aristasVisitadas = 0;

  while (monticulo.tamano > 0) {
    const sacado = monticulo.sacar()!;
    const [arista, coste] = sacado;
    if (coste >= mejorTotal) {
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
        const total = hastaElCruce + remate.segundos;
        if (total < mejorTotal) {
          mejorTotal = total;
          mejorLlegada = siguiente;
          mejorAntes = arista;
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
  segundos += remate.segundos;
  trozos.push(remate.trozo);

  let metros = 0;
  for (const trozo of trozos) {
    metros += trozo.metros;
  }

  return {
    metros,
    trozos,
    conectorOrigen,
    conectorDestino,
    trivial: false,
    nodosVisitados: aristasVisitadas,
    segundos,
  };
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
 * ⭐ EL VIAJE EN COCHE, de punta a punta.
 *
 * Un solo tramo, `comoSeVa: 'rodando'`. Y eso **no es un campo nuevo**: el
 * contrato separa la bici, el patín y la BiZi por `Trayecto.modo`, no por el
 * tramo — los tres son `rodando`—, y el criterio de `montado` está escrito y es
 * explícito: *«quien va montado no elige el camino, lo elige la línea»*, y se
 * pinta del color de esa línea. El conductor elige el camino y no hay línea.
 */
export function viajeEnCoche(
  servida: RedDeCocheServida,
  origen: Extremo,
  destino: Extremo,
): Trayecto {
  const engancheOrigen = enganchar(servida.comoRed, servida.rejilla, origen.lon, origen.lat);
  if (!engancheOrigen) {
    return conAviso(
      `${origen.nombre} no tiene cerca ninguna calle por la que pueda circular un ` +
        'coche en nuestro mapa: desde ahí no podemos calcular una ruta en coche.',
    );
  }
  const engancheDestino = enganchar(servida.comoRed, servida.rejilla, destino.lon, destino.lat);
  if (!engancheDestino) {
    return conAviso(
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
    return conAviso(
      `No hay forma de ir en coche de ${origen.nombre} a ${destino.nombre} ` +
        'por las calles que conocemos.',
    );
  }

  const pasos: readonly Paso[] = escribirPasos(
    servida.comoRed,
    ruta,
    origen.nombre,
    destino.nombre,
    [destino.lon, destino.lat],
  );

  // La geometría se da la vuelta AQUÍ y solo aquí: la red va [lon, lat] y el
  // contrato [lat, lon].
  const geometria: Vertice[] = geometriaDe(ruta).map(([lon, lat]) => [lat, lon]);
  const metros = Math.round(ruta.metros);
  const segundos = Math.round(ruta.segundos);

  return {
    modo: 'coche',
    pasos,
    geometria,
    avisos: [],
    metros,
    segundos,
    // Un solo tramo, y cubre la geometría entera: en coche no hay costuras.
    tramos: [
      {
        comoSeVa: 'rodando',
        desde: 0,
        hasta: Math.max(0, geometria.length - 1),
        metros,
        segundos,
        hito: null,
      },
    ],
  };
}
