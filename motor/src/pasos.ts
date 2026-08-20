/**
 * LOS PASOS: la ruta, escrita.
 *
 * El formato es el de Google Maps, decidido por Antonio con la captura
 * delante: un arranque con el punto cardinal, un paso por cada giro con «hacia
 * dónde» y los metros del tramo, y un cierre que dice de qué lado queda el
 * portal.
 *
 * Tres reglas mandan aquí, y las tres vienen de la doctrina del punto 7:
 *
 * **1 · Un tramo es un `w`.** Las aristas del grafo son trocitos —la mediana
 * es de 19 m—, así que un paso por arista sería un paso cada veinte metros.
 * Se agrupan las consecutivas que comparten `w`, el id de *way* de OSM: mismo
 * *way*, misma calle, un solo paso.
 *
 * **2 · Lo innombrado habla POR TIPO.** El 60% de las aristas no tiene nombre
 * en OSM, y no es que falte: las aceras y los pasos de peatones no lo llevan.
 * Ahí entra `p`, el tipo propio del grafo, exactamente como Valhalla dice
 * *«onto the walkway»* o *«onto the crosswalk»* cuando no hay nombre.
 *
 * **3 · Los extremos hablan MUNICIPAL.** El nombre de OSM y el del callejero
 * discrepan en el 19,4% de los portales (§ 1.14 del notices). En medio manda
 * OSM, que es de quien es la red; pero el origen y el destino los eligió el
 * usuario de NUESTRO callejero, con su código, y ahí se le dice el nombre que
 * él leyó. Decirle otro sería contradecir su propio formulario.
 */

import type { RedEnMemoria } from './red.ts';
import type { Giro, Paso } from '@desplazame/tipos';
import { metrosPlanos } from './proyeccion.ts';
import type { Ruta, TrozoDeRuta } from './ruta.ts';

type Punto = readonly [number, number];

/**
 * Cómo se llama un tramo que no tiene nombre, según su tipo.
 *
 * [PROPIO] Las redacciones son mías; lo que no es mío es la idea de nombrar
 * por tipo, que es de Valhalla. Van en artículo y en singular para que encajen
 * detrás de «hacia»: «hacia el paso de peatones», «hacia las escaleras».
 *
 * `eje-de-calzada` sin nombre es una calle que OSM no nombró, y se dice «la
 * calzada» y no «la calle sin nombre»: lo segundo describe nuestro dato, no lo
 * que la persona tiene delante.
 */
const POR_TIPO: Readonly<Record<string, string>> = {
  acera: 'la acera',
  'paso-de-peatones': 'el paso de peatones',
  escaleras: 'las escaleras',
  peatonal: 'la zona peatonal',
  'eje-de-calzada': 'la calzada',
  'eje-con-acera-declarada': 'la calzada',
};

/** Si aparece un tipo que no está en la tabla, se dice esto y no se calla. */
const TIPO_DESCONOCIDO = 'el camino';

/**
 * Los ocho rumbos. El corte está cada 45°, así que cada uno abarca ±22,5°.
 */
const CARDINALES = [
  'norte',
  'noreste',
  'este',
  'sureste',
  'sur',
  'suroeste',
  'oeste',
  'noroeste',
] as const;

/**
 * Cuántos metros se miran hacia atrás y hacia delante para calcular el ángulo
 * de un giro.
 *
 * [PROPIO] Si se tomaran solo los dos vértices pegados al cruce, un segmento
 * de 30 cm —y los hay— daría un rumbo con el ruido de la digitalización
 * dentro. Mirando 20 m el rumbo es el de la calle, que es lo que la persona
 * percibe al llegar a la esquina.
 */
const MIRADA_M = 20;

/** Grados de un rumbo, 0 = norte, creciendo hacia el este. */
function rumbo(desde: Punto, hasta: Punto): number {
  const dx = (hasta[0] - desde[0]) * Math.cos((41.65 * Math.PI) / 180);
  const dy = hasta[1] - desde[1];
  const grados = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (grados + 360) % 360;
}

/** El rumbo con el que se SALE de un tramo, mirando sus últimos metros. */
function rumboDeSalida(g: readonly Punto[]): number {
  const fin = g[g.length - 1]!;
  for (let k = g.length - 2; k >= 0; k--) {
    if (metrosPlanos(g[k]![0], g[k]![1], fin[0], fin[1]) >= MIRADA_M) {
      return rumbo(g[k]!, fin);
    }
  }
  return rumbo(g[0]!, fin);
}

/** El rumbo con el que se ENTRA en un tramo, mirando sus primeros metros. */
function rumboDeEntrada(g: readonly Punto[]): number {
  const principio = g[0]!;
  for (let k = 1; k < g.length; k++) {
    if (metrosPlanos(principio[0], principio[1], g[k]![0], g[k]![1]) >= MIRADA_M) {
      return rumbo(principio, g[k]!);
    }
  }
  return rumbo(principio, g[g.length - 1]!);
}

/**
 * Clasifica un giro por su ángulo.
 *
 * [DOC Valhalla] Los cortes son los de `valhalla/baldr/turn.cc`, leídos de la
 * fuente y no aproximados: **0-10 recto · 11-44 ligera derecha · 45-135
 * derecha · 136-159 cerrada derecha · 160-200 media vuelta · 201-224 cerrada
 * izquierda · 225-315 izquierda · 316-349 ligera izquierda · 350-359 recto**.
 *
 * El ángulo es `(rumbo de salida − rumbo de entrada + 360) mod 360`, que es
 * como lo calcula `GetTurnDegree`: creciendo se gira a la derecha.
 */
export function giroDe(entrada: number, salida: number): Giro {
  const grados = Math.round((salida - entrada + 360) % 360) % 360;
  if (grados <= 10 || grados >= 350) return 'recto';
  if (grados <= 44) return 'ligera-derecha';
  if (grados <= 135) return 'derecha';
  if (grados <= 159) return 'cerrada-derecha';
  if (grados <= 200) return 'media-vuelta';
  if (grados <= 224) return 'cerrada-izquierda';
  if (grados <= 315) return 'izquierda';
  return 'ligera-izquierda';
}

/** Cómo se escribe cada giro, delante del «hacia X». */
const COMO_SE_DICE: Readonly<Record<Giro, string>> = {
  salida: 'Dirígete',
  recto: 'Continúa',
  'ligera-derecha': 'Gira ligeramente a la derecha',
  derecha: 'Gira a la derecha',
  'cerrada-derecha': 'Gira bruscamente a la derecha',
  'media-vuelta': 'Da media vuelta',
  'cerrada-izquierda': 'Gira bruscamente a la izquierda',
  izquierda: 'Gira a la izquierda',
  'ligera-izquierda': 'Gira ligeramente a la izquierda',
  llegada: 'Has llegado',
};

/** Un tramo: una o más aristas seguidas del mismo *way*. */
interface Tramo {
  readonly way: number;
  readonly perfil: string;
  readonly metros: number;
  readonly g: readonly Punto[];
}

/** Junta las aristas consecutivas que comparten `w`. */
function agrupar(red: RedEnMemoria, trozos: readonly TrozoDeRuta[]): readonly Tramo[] {
  const tramos: { way: number; perfil: string; metros: number; g: Punto[] }[] = [];
  for (const trozo of trozos) {
    const arista = red.aristas[trozo.arista]!;
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.way === arista.way) {
      ultimo.metros += trozo.metros;
      // El primer punto del trozo es el último del anterior: no se repite.
      ultimo.g.push(...trozo.g.slice(1));
      continue;
    }
    tramos.push({
      way: arista.way,
      perfil: arista.perfil,
      metros: trozo.metros,
      g: [...trozo.g],
    });
  }
  return tramos;
}

/** Cómo se nombra un tramo: el de OSM si lo hay, y si no el de su tipo. */
function nombreDe(red: RedEnMemoria, tramo: Tramo): string {
  return red.nombreDeWay.get(tramo.way) ?? POR_TIPO[tramo.perfil] ?? TIPO_DESCONOCIDO;
}

/**
 * Une los tramos seguidos que **se llaman igual y no tuercen**.
 *
 * OSM parte una calle en muchos *ways*: Calle de Pedro Lapuyade son tres, y
 * agrupando solo por `w` salían tres pasos diciendo la misma frase —«Continúa
 * hacia Calle de Pedro Lapuyade»— con 8, 87 y 210 metros. Medido en la ruta
 * PEDRO LAPUYADE 3 → CAMINO DE EN MEDIO 120: **13 de sus 50 pasos eran eso**.
 *
 * [DOC] No es un adorno: es lo que hacen las dos implementaciones de
 * referencia. OSRM lo llama *collapsing* de maniobras y Valhalla combina
 * maniobras contiguas cuando el nombre no cambia y no hay giro. El plan del
 * punto 7 fijó que **mismo `w` es el mismo tramo**, que sigue siendo cierto;
 * lo que no decidió es qué pasa con dos *ways* que son la misma calle, y este
 * es ese hueco.
 *
 * Las dos condiciones van juntas a propósito. Solo por nombre se unirían dos
 * aceras distintas que forman una esquina, y se perdería el giro; solo por
 * «recto» se uniría una calle con la siguiente cuando enfilan igual, y se
 * perdería el cambio de calle.
 */
function unirLasQueSonLaMisma(red: RedEnMemoria, tramos: readonly Tramo[]): readonly Tramo[] {
  const unidos: { way: number; perfil: string; metros: number; g: Punto[] }[] = [];
  for (const tramo of tramos) {
    const ultimo = unidos[unidos.length - 1];
    if (
      ultimo &&
      nombreDe(red, ultimo) === nombreDe(red, tramo) &&
      giroDe(rumboDeSalida(ultimo.g), rumboDeEntrada(tramo.g)) === 'recto'
    ) {
      ultimo.metros += tramo.metros;
      ultimo.g.push(...tramo.g.slice(1));
      continue;
    }
    unidos.push({ way: tramo.way, perfil: tramo.perfil, metros: tramo.metros, g: [...tramo.g] });
  }
  return unidos;
}

/**
 * [PROPIO] Los metros se redondean **al metro** en los tramos y **a la
 * decena** a partir de 100 m. Un paso que dijera «447 m» estaría fingiendo una
 * precisión que ni el grafo ni las piernas tienen; «450 m» es lo que dice
 * Google y es lo que se puede sostener.
 */
export function metrosParaLeer(metros: number): number {
  return metros < 100 ? Math.round(metros) : Math.round(metros / 10) * 10;
}

/** De qué lado queda el portal al final: producto vectorial y ya. */
function ladoDelDestino(ultimoTramo: readonly Punto[], puerta: Punto): 'derecha' | 'izquierda' {
  const fin = ultimoTramo[ultimoTramo.length - 1]!;
  const entrada = ultimoTramo.length > 1 ? ultimoTramo[ultimoTramo.length - 2]! : fin;
  const coseno = Math.cos((41.65 * Math.PI) / 180);
  const dx1 = (fin[0] - entrada[0]) * coseno;
  const dy1 = fin[1] - entrada[1];
  const dx2 = (puerta[0] - fin[0]) * coseno;
  const dy2 = puerta[1] - fin[1];
  // Con x al este e y al norte, el producto vectorial positivo es giro
  // antihorario, o sea: a la izquierda de quien avanza.
  return dx1 * dy2 - dy1 * dx2 > 0 ? 'izquierda' : 'derecha';
}

/**
 * Escribe los pasos de una ruta.
 *
 * `nombreOrigen` y `nombreDestino` son los MUNICIPALES —«CALLE BURGOS 4»—, y
 * son lo único que se dice en los extremos. Ver la regla 3 de arriba.
 */
export function escribirPasos(
  red: RedEnMemoria,
  ruta: Ruta,
  nombreOrigen: string,
  nombreDestino: string,
  puertaDestino: Punto,
): readonly Paso[] {
  const tramos = unirLasQueSonLaMisma(red, agrupar(red, ruta.trozos));

  // Una ruta trivial de cero metros: no hay nada que andar y se dice.
  if (tramos.length === 0) {
    return [
      {
        giro: 'llegada',
        texto: `${nombreDestino} es el mismo portal del que sales.`,
        metros: 0,
      },
    ];
  }

  const pasos: Paso[] = [];

  // ── El arranque, con su cardinal ─────────────────────────────────────────
  const primero = tramos[0]!;
  const cardinal = CARDINALES[Math.round(rumboDeEntrada(primero.g) / 45) % 8]!;
  const nombrePrimero = red.nombreDeWay.get(primero.way);
  pasos.push({
    giro: 'salida',
    // El origen habla municipal: se sale del portal que el usuario eligió.
    texto:
      `Sal de ${nombreOrigen} y dirígete hacia el ${cardinal}` +
      (nombrePrimero ? ` por ${nombrePrimero}` : ''),
    metros: metrosParaLeer(primero.metros),
  });

  // ── Un paso por cada cambio de tramo ─────────────────────────────────────
  for (let k = 1; k < tramos.length; k++) {
    const antes = tramos[k - 1]!;
    const ahora = tramos[k]!;
    const giro = giroDe(rumboDeSalida(antes.g), rumboDeEntrada(ahora.g));
    pasos.push({
      giro,
      texto: `${COMO_SE_DICE[giro]} hacia ${nombreDe(red, ahora)}`,
      metros: metrosParaLeer(ahora.metros),
    });
  }

  // ── El cierre: de qué lado queda la puerta ───────────────────────────────
  const ultimo = tramos[tramos.length - 1]!;
  pasos.push({
    giro: 'llegada',
    texto: `${nombreDestino} está a la ${ladoDelDestino(ultimo.g, puertaDestino)}`,
    metros: 0,
  });

  return pasos;
}
