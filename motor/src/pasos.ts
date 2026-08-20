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
 * ⭐ NIVEL 1 — el perfil, cuando distingue MÁS que el tipo de OSM.
 *
 * El exportador del grafo trae su propio `p`, y en cuatro casos sabe algo que
 * `highway` no dice. El ejemplo que lo justifica: una acera y un paso de
 * peatones son **los dos** `highway=footway` en OSM —10.005 y 9.365 aristas
 * mudas—, y no se anda igual por uno que por otro. Ahí manda el perfil.
 *
 * [PROPIO] Las redacciones son mías; la idea de nombrar por tipo es de
 * Valhalla. Van con artículo y en singular para encajar detrás de «hacia».
 *
 * **Lo que ya NO está aquí es `eje-de-calzada`.** Ese perfil no distingue: le
 * caen 46.643 aristas que son calzada de verdad, carril bici, camino de tierra
 * y vial de servicio, todo junto. Decirlo «la calzada» era la entrada nº7 de
 * la bitácora — una afirmación falsa en pantalla, no un hueco de información.
 * Cuando el perfil es genérico, decide el tipo real: nivel 2.
 */
const POR_PERFIL: Readonly<Record<string, string>> = {
  acera: 'la acera',
  'paso-de-peatones': 'el paso de peatones',
  escaleras: 'las escaleras',
  peatonal: 'la zona peatonal',
};

/**
 * ⭐ NIVEL 2 — el tipo REAL de OSM, que es quien manda cuando el perfil no
 * distingue.
 *
 * [DOC Valhalla] La doctrina, de sus notas de versión: *«a generic description
 * will be used… when a walkway, cycleway or trail is unnamed»*. El tipo real,
 * no una etiqueta de conveniencia.
 *
 * **Están los 27 valores de `highway` que trae el grafo**, contados sobre
 * `app/data/grafo-visor.js`; ninguno se queda sin traducción. Los grupos:
 *
 * - **La jerarquía viaria** —`motorway`…`residential`, sus `_link` y
 *   `busway`— sí es calzada, y se dice «la calzada». Ahí la palabra siempre
 *   fue cierta y no se toca.
 * - **Lo que NO es calzada y lo decía**: `cycleway` (2.183 aristas mudas,
 *   90 km), `track` (6.521, 1.928 km), `service` (7.563, 338 km), `path`
 *   (2.632, 301 km). Son los cuatro que arreglan el fallo.
 * - **Lo peatonal** —`footway`, `steps`, `pedestrian`, `corridor`,
 *   `living_street`—: hoy casi nunca llegan aquí, porque su perfil ya es fino
 *   y los caza el nivel 1. Están igualmente, y no es adorno: si el exportador
 *   cambiara de criterio, la palabra correcta ya está puesta en vez de
 *   aparecer un hueco.
 * - **Lo que no se puede andar** —`construction`, `proposed`, `raceway`,
 *   `services`, `rest_area`—: llevan `a=0` y no entran en la red, así que no
 *   pueden salir en un paso. Se traducen igual, porque «no puede pasar» y «no
 *   está previsto» no son lo mismo, y el día que pase se leerá algo cierto.
 */
const POR_HIGHWAY: Readonly<Record<string, string>> = {
  // La jerarquía viaria: aquí «calzada» siempre fue verdad.
  motorway: 'la calzada',
  trunk: 'la calzada',
  primary: 'la calzada',
  secondary: 'la calzada',
  tertiary: 'la calzada',
  unclassified: 'la calzada',
  residential: 'la calzada',
  motorway_link: 'la calzada',
  trunk_link: 'la calzada',
  primary_link: 'la calzada',
  secondary_link: 'la calzada',
  tertiary_link: 'la calzada',
  busway: 'la calzada',
  // Los cuatro que no lo eran, y que son este encargo.
  cycleway: 'el carril bici',
  track: 'el camino',
  service: 'el vial de servicio',
  path: 'la senda',
  // Lo peatonal. Se dice «la calle residencial» y no «la zona peatonal» para
  // `living_street`: por una calle de convivencia pasan coches despacio, y
  // llamarla peatonal invitaría a andar por el medio.
  living_street: 'la calle residencial',
  footway: 'la acera',
  steps: 'las escaleras',
  pedestrian: 'la zona peatonal',
  corridor: 'el pasaje',
  // Lo que hoy no rutea. Ver arriba.
  construction: 'el tramo en obras',
  proposed: 'el tramo proyectado',
  raceway: 'el circuito',
  services: 'el área de servicio',
  rest_area: 'el área de descanso',
};

/** Si no hay ni perfil fino ni tipo conocido, se dice esto y no se calla. */
const TIPO_DESCONOCIDO = 'el camino';

/**
 * Cómo se llama un tramo que OSM no nombró. **Dos niveles, en este orden.**
 *
 * Primero el perfil, si es de los que distinguen; si no, el tipo real; y si
 * tampoco, el genérico. Nunca devuelve vacío: un paso sin «hacia» dónde no es
 * un paso.
 */
export function nombreGenerico(perfil: string, highway: string | undefined): string {
  const fino = POR_PERFIL[perfil];
  if (fino !== undefined) {
    return fino;
  }
  return (highway !== undefined ? POR_HIGHWAY[highway] : undefined) ?? TIPO_DESCONOCIDO;
}

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

/**
 * ⭐ Por debajo de cuántos metros un tramo deja de ser un paso.
 *
 * Un cruce de verdad son siete piezas de red —baja de la acera, cruza, sube,
 * bordea, vuelve a cruzar— y quien anda percibe UNA maniobra. Escribirlas
 * todas no es ser preciso: es ser ilegible.
 *
 * [DOC] La doctrina es de las dos implementaciones de referencia. OSRM colapsa
 * las instrucciones de los cruces segregados *«donde los humanos solo perciben
 * una maniobra»*, y Valhalla reduce la lista de maniobras a una concisa. Lo que
 * ninguna de las dos regala es el número, porque depende del callejero.
 *
 * **25 m sale del dato, no de la barriga.** Medidos los pasos intermedios de
 * 363 rutas reales de 1-2 km —6.443 pasos—, el histograma cada 5 m es:
 *
 *      0- 5 m  1274  ###################################################
 *      5-10 m  1021  #########################################
 *     10-15 m   535  #####################
 *     15-20 m   325  #############
 *     20-25 m   264  ###########
 *     25-30 m   191  ########        ← el suelo del valle
 *     30-35 m   198  ########        ← y aquí ya sube: empieza la meseta
 *     35-40 m   158  ######
 *     40-45 m   131  #####
 *     45-50 m   138  ######
 *
 * No es una curva que baja sin más: **baja hasta los 25-30 m y ahí para**. Lo
 * de la izquierda es la población de trozos de cruce; lo de la derecha, una
 * meseta plana de 100-200 por tramo que son los pasos de verdad. El corte se
 * pone en el borde del valle, no dentro de la meseta.
 *
 * A ese corte le caen el 53,1% de los pasos intermedios, y esa cifra tan gorda
 * es justamente el síntoma: la mitad de lo que se escribía no era una maniobra.
 */
export const UMBRAL_MICRO_M = 25;

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

/** Cómo se nombra un tramo: el de OSM si lo hay, y si no el de su tipo real. */
function nombreDe(red: RedEnMemoria, tramo: Tramo): string {
  return (
    red.nombreDeWay.get(tramo.way) ??
    nombreGenerico(tramo.perfil, red.tipoDeWay.get(tramo.way))
  );
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
 * Un tramo reducido a lo que la fusión necesita: cómo se llama, cuánto mide, y
 * con qué rumbo se entra y se sale de él.
 *
 * Se baja a esta forma llana para que la fusión sea una función **pura y
 * probable con ángulos inventados**: la regla de qué se funde y qué giro sale
 * es delicada, y comprobarla exigiendo una ruta de Zaragoza que la dispare
 * sería comprobarla a medias.
 */
export interface TramoLlano {
  readonly nombre: string;
  /** Si `nombre` viene de OSM (true) o es el nombre de su tipo (false). */
  readonly conNombre: boolean;
  readonly metros: number;
  readonly entrada: number;
  readonly salida: number;
}

/** Lo que sobrevive a la fusión: un paso, con su giro ya combinado. */
export interface TramoFundido {
  readonly nombre: string;
  readonly conNombre: boolean;
  readonly metros: number;
  readonly giro: Giro;
  /** El rumbo de entrada del que manda: de ahí sale el cardinal del arranque. */
  readonly entrada: number;
  /**
   * El rumbo con el que se SALE de esta maniobra.
   *
   * La primera pasada no lo necesitaba para nada de puertas afuera y no lo
   * publicaba. La segunda —`colapsarManiobras`— sí: sin él no se puede medir
   * el ángulo combinado a través de lo que se suprime, y medirlo es lo único
   * que impide que colapsar se coma un giro de verdad.
   */
  readonly salida: number;
}

/**
 * ⭐ Funde los tramos insignificantes y **recalcula el giro con el ángulo
 * combinado**.
 *
 * Las reglas, todas declaradas:
 *
 * **1 · A cuál se funde: al ANTERIOR.** Sus metros se suman a él y su paso
 * desaparece. El porqué es de quien anda: el nombre de un tramo se anuncia al
 * entrar en él, y en un trozo de cruce de seis metros nadie te anuncia nada —
 * sigues andando desde la instrucción anterior hasta la siguiente de verdad.
 * Los metros no se pierden nunca: se suman.
 *
 * **2 · El giro sale del ÁNGULO COMBINADO.** Y esta es la pieza que impide que
 * fundir se coma un giro: el giro que se anuncia para el tramo siguiente se
 * mide entre el rumbo con el que se SALÍA del tramo anterior y el rumbo con el
 * que se ENTRA en el siguiente — saltándose el que se ha fundido. Si entre A y
 * B hay noventa grados repartidos en dos trozos de cruce, el resultado sigue
 * siendo noventa grados. Se clasifica con los mismos umbrales de `turn.cc`, que
 * no se tocan.
 *
 * **3 · El nombre lo pone el DOMINANTE.** Si lo que se funde mide más que lo
 * que llevaba el tramo que lo absorbe, se queda con su nombre, su rumbo de
 * salida y su rumbo de entrada. Es raro —solo pasa entre dos trozos cortos—
 * pero si pasa, manda el largo.
 *
 * **4 · Si el combinado da «recto» y el nombre coincide, DESAPARECE en el
 * vecino**; si el nombre cambia, se queda como «Continúa hacia X», que es un
 * paso legítimo: la calle cambia de nombre sin que tuerzas. Es la misma regla
 * que ya unía los *ways* de una misma calle, aplicada ahora también después de
 * fundir.
 *
 * **5 · El primero NUNCA desaparece, pero si es él el insignificante, TRAGA
 * HACIA DELANTE.** Un arranque no se puede fundir con lo de atrás porque no hay
 * nada atrás; lo que no puede ser es que quede un paso de tres metros. Así que
 * cuando el arranque mide menos que el umbral, se come al siguiente y —por la
 * regla 3— se queda con su nombre: «Sal de X y dirígete hacia el norte **por
 * Calle Larga**» en vez de «dirígete hacia el norte · 3 m» y luego «continúa
 * hacia Calle Larga». Se corta solo: en cuanto traga uno, ya pasa del umbral.
 *
 * La llegada tampoco se funde, pero esa ni pasa por aquí: se escribe aparte.
 */
export function fundirMicroTramos(tramos: readonly TramoLlano[]): readonly TramoFundido[] {
  const salen: {
    nombre: string;
    conNombre: boolean;
    metros: number;
    metrosPropios: number;
    giro: Giro;
    entrada: number;
    salida: number;
  }[] = [];

  for (const tramo of tramos) {
    const ultimo = salen[salen.length - 1];
    if (!ultimo) {
      salen.push({
        nombre: tramo.nombre,
        conNombre: tramo.conNombre,
        metros: tramo.metros,
        metrosPropios: tramo.metros,
        giro: 'salida',
        entrada: tramo.entrada,
        salida: tramo.salida,
      });
      continue;
    }

    // EL ÁNGULO COMBINADO: del rumbo con el que se salía de lo último que se
    // anunció, al rumbo con el que se entra en esto. Lo fundido queda en medio
    // y no cuenta.
    const giro = giroDe(ultimo.salida, tramo.entrada);
    const esMicro = tramo.metros < UMBRAL_MICRO_M;
    const esLaMisma = giro === 'recto' && tramo.nombre === ultimo.nombre;
    // El arranque no se funde hacia atrás porque no hay atrás: traga hacia
    // delante. Regla 5.
    const arranqueInsignificante = salen.length === 1 && ultimo.metros < UMBRAL_MICRO_M;

    if (esMicro || esLaMisma || arranqueInsignificante) {
      ultimo.metros += tramo.metros;
      if (tramo.metros > ultimo.metrosPropios) {
        ultimo.nombre = tramo.nombre;
        ultimo.conNombre = tramo.conNombre;
        ultimo.metrosPropios = tramo.metros;
        ultimo.entrada = tramo.entrada;
        ultimo.salida = tramo.salida;
      }
      continue;
    }

    salen.push({
      nombre: tramo.nombre,
      conNombre: tramo.conNombre,
      metros: tramo.metros,
      metrosPropios: tramo.metros,
      giro,
      entrada: tramo.entrada,
      salida: tramo.salida,
    });
  }

  return salen.map(({ nombre, conNombre, metros, giro, entrada, salida }) => ({
    nombre,
    conNombre,
    metros,
    giro,
    entrada,
    salida,
  }));
}

/** Los tres giros que NO son una maniobra: se sigue por donde se iba. */
const GIROS_SUAVES: ReadonlySet<Giro> = new Set<Giro>([
  'recto',
  'ligera-derecha',
  'ligera-izquierda',
]);

const esSuave = (giro: Giro): boolean => GIROS_SUAVES.has(giro);

/**
 * ⭐ Si dos maniobras son **la misma calle**, que no es lo mismo que llamarse
 * igual.
 *
 * `«la calzada»` y `«la acera»` no son nombres: son el hueco de OpenStreetMap
 * dicho por su tipo, y el 60% de las aristas lo lleva. Dos tramos sin nombre
 * seguidos se «llaman igual» siempre, y colapsarlos por eso juntaría dos calles
 * distintas que OSM no nombró — perdiendo el giro que hay entre ellas.
 *
 * [DOC OSRM] No es una precaución mía: es lo primero que hace su `haveSameName`
 * en `collapsing_utility.hpp`, con el comentario delante.
 *
 *     const auto has_name_or_ref = [](auto const &step)
 *     { return !step.name.empty() || !step.ref.empty(); };
 *
 *     // make sure empty is not involved
 *     if (!has_name_or_ref(lhs) || !has_name_or_ref(rhs))
 *     {
 *         return false;
 *     }
 *
 * Vacío contra vacío es **false**, no true. `conNombre` es exactamente ese
 * `has_name_or_ref`: dice si el nombre viene de OSM o es el de su tipo.
 *
 * Ojo: esto NO deshace la unión de tramos sin nombre que sigue recto
 * (`unirLasQueSonLaMisma` y la regla 4 de la fusión). Aquello une lo que
 * enfila igual; esto es lo que colapsaría a través de un giro, y ahí sin
 * nombre no hay derecho.
 */
function sonLaMismaCalle(a: Maniobra, b: Maniobra): boolean {
  return a.conNombre && b.conNombre && a.nombre === b.nombre;
}

/**
 * ⭐ Cuánto puede medir un nombre que interrumpe para que se le absorba.
 *
 * [DOC OSRM] **105 m, y el número es suyo**: es `NAME_SEGMENT_CUTOFF_LENGTH`,
 * de `include/engine/guidance/collapsing_utility.hpp`, leída de la fuente:
 *
 *     const constexpr double MAX_COLLAPSE_DISTANCE = 30.0;
 *     // a bit larger than 100 to avoid oscillation in tests
 *     const constexpr double NAME_SEGMENT_CUTOFF_LENGTH = 105.0;
 *
 * El comentario es de ellos y explica los cinco metros de más: el número que se
 * quiere decir es 100, y el sobrante evita que un tramo que mide justo 100
 * oscile entre absorberse y no absorberse.
 *
 * Y de paso, una corroboración que vale la pena anotar: `MAX_COLLAPSE_DISTANCE`
 * son **30 m**, y el umbral de micro-tramos de la pasada anterior —medido aquí
 * sobre 6.443 pasos de Zaragoza, sin mirar a OSRM— salió **25**. Dos caminos
 * distintos para llegar al mismo sitio.
 */
export const CORTE_DE_NOMBRE_M = 105;

/** La forma mutable con la que se trabaja dentro del colapso. */
type Maniobra = {
  nombre: string;
  conNombre: boolean;
  metros: number;
  giro: Giro;
  entrada: number;
  salida: number;
};

/**
 * Absorbe `comido` dentro de `crece`: los metros se suman y la salida pasa a
 * ser la del comido.
 *
 * **Ni el `giro` ni la `entrada` de `crece` se tocan, y eso es la clave del
 * ángulo combinado.** El giro de una maniobra se midió contra la SALIDA de la
 * que la precede; como absorber solo alarga la salida hacia delante, la
 * maniobra que venga después sigue midiendo su giro desde el sitio correcto,
 * sin recalcular nada. Lo que desaparece son los giros de en medio, y por eso
 * arriba se comprueba antes que sumados no den una maniobra de verdad.
 */
function absorber(crece: Maniobra, comido: Maniobra): void {
  crece.metros += comido.metros;
  crece.salida = comido.salida;
}

/**
 * ⭐ LA SEGUNDA PASADA: el colapso a nivel de MANIOBRA.
 *
 * La primera pasada (`fundirMicroTramos`) quita los trocitos de red que nadie
 * percibe. Esta quita las maniobras que sí miden, pero que **no son maniobras**:
 * son la misma calle contada dos veces. Las dos implementaciones de referencia
 * hacen las dos pasadas, en este orden — OSRM llama primero a
 * `collapseTurnInstructions` y después a `suppressShortNameSegments`
 * (`route_api.hpp`), y el orden importa.
 *
 * **Regla A — mismo nombre + giro suave se funden.** [DOC OSRM] En
 * `suppressShortNameSegments` la primera rama es `if (haveSameName(previous,
 * current)) suppress(previous, current);` — **sin umbral de distancia
 * ninguno**: mismo nombre, se suprime. Y solo entra ahí lo que es
 * `TurnType::NewName`, o sea un cambio de nombre sin giro; aquí el equivalente
 * es exigir que el giro sea suave. Valhalla lo dice desde el otro lado: no
 * repetir la instrucción de continuar por una variante leve del mismo nombre.
 *
 * **Regla B — la interrupción corta se absorbe.** [DOC OSRM] La segunda rama
 * suma los metros del nombre nuevo mientras el paso siguiente sea silencioso, y
 * si el total queda por debajo de `NAME_SEGMENT_CUTOFF_LENGTH` lo suprime
 * contra el anterior.
 *
 * **Dónde este colapso es MÁS ESTRECHO que el de OSRM, y por qué.** OSRM
 * absorbe cualquier segmento de nombre corto contra el paso anterior, se llame
 * como se llame el que viene después. Aquí se exige además que **los dos
 * vecinos se llamen igual** — que sea de verdad una interrupción y no un
 * cambio de calle. Es lo que fijó el encargo, y ensancharlo no es decisión de
 * este código: con la regla ancha, «Plaza Basilio Paraíso · 62 m» desaparecería
 * de la ruta de Antonio, y esa plaza tiene nombre porque la gente la usa para
 * orientarse.
 *
 * **La salvaguarda, que es lo que hay que mirar si algún día esto miente.** Un
 * giro de verdad en la misma calle SE ANUNCIA: la regla A no se aplica si el
 * giro no es suave. Y en la regla B no basta con que los dos giros suprimidos
 * sean suaves por separado — dos «ligeramente a la derecha» de 30° suman una
 * derecha de 60°—, así que se mide **el ángulo combinado a través de lo que se
 * suprime** y solo se colapsa si TAMBIÉN es suave.
 *
 * Se repite hasta que una vuelta no cambie nada: absorber crea vecindades
 * nuevas —A·B·A·A acaba en una sola A— y una sola pasada las dejaría a medias.
 * Termina siempre, porque cada vuelta que hace algo acorta la lista.
 */
export function colapsarManiobras(
  entrada: readonly TramoFundido[],
): readonly TramoFundido[] {
  let actual: Maniobra[] = entrada.map((m) => ({ ...m }));
  for (;;) {
    const siguiente = unaVueltaDeColapso(actual);
    if (siguiente.length === actual.length) {
      return siguiente;
    }
    actual = siguiente;
  }
}

/** Una pasada de izquierda a derecha. Devuelve la lista, más corta o igual. */
function unaVueltaDeColapso(maniobras: readonly Maniobra[]): Maniobra[] {
  const salen: Maniobra[] = [];
  for (let i = 0; i < maniobras.length; i++) {
    const maniobra = maniobras[i]!;
    const ultimo = salen[salen.length - 1];
    if (!ultimo) {
      salen.push({ ...maniobra });
      continue;
    }

    // ── Regla A ────────────────────────────────────────────────────────────
    // El giro de `maniobra` YA es el ángulo entre la salida de `ultimo` y su
    // entrada, así que preguntarle si es suave es preguntar por el combinado.
    if (sonLaMismaCalle(ultimo, maniobra) && esSuave(maniobra.giro)) {
      absorber(ultimo, maniobra);
      continue;
    }

    // ── Regla B ────────────────────────────────────────────────────────────
    // Los dos VECINOS tienen que ser la misma calle con nombre; el que
    // interrumpe puede no tener ninguno —el caso típico es justo ese, un
    // tramo peatonal sin nombre partiendo un paseo en dos—.
    const despues = maniobras[i + 1];
    if (
      despues &&
      sonLaMismaCalle(ultimo, despues) &&
      maniobra.metros < CORTE_DE_NOMBRE_M &&
      esSuave(maniobra.giro) &&
      esSuave(despues.giro) &&
      // ⭐ El ángulo combinado a través de la interrupción entera. Sin esto,
      // dos suaves del mismo signo se comerían un giro de verdad.
      esSuave(giroDe(ultimo.salida, despues.entrada))
    ) {
      absorber(ultimo, maniobra);
      absorber(ultimo, despues);
      i++;
      continue;
    }

    salen.push({ ...maniobra });
  }
  return salen;
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

  // Se bajan a la forma llana —nombre, metros y los dos rumbos— y se funden
  // los insignificantes. A partir de aquí ya no hay geometría: hay maniobras.
  const llanos: TramoLlano[] = tramos.map((tramo) => ({
    nombre: nombreDe(red, tramo),
    conNombre: red.nombreDeWay.has(tramo.way),
    metros: tramo.metros,
    entrada: rumboDeEntrada(tramo.g),
    salida: rumboDeSalida(tramo.g),
  }));
  // DOS PASADAS, y en este orden — el mismo que OSRM: primero se quitan los
  // trocitos que nadie percibe, y sobre lo que queda se colapsa lo que no es
  // una maniobra sino la misma calle contada dos veces.
  const maniobras = colapsarManiobras(fundirMicroTramos(llanos));

  const pasos: Paso[] = [];

  // ── El arranque, con su cardinal ─────────────────────────────────────────
  const primero = maniobras[0]!;
  const cardinal = CARDINALES[Math.round(primero.entrada / 45) % 8]!;
  pasos.push({
    giro: 'salida',
    // El origen habla municipal: se sale del portal que el usuario eligió. Y
    // el «por X» solo si hay nombre de verdad: «dirígete hacia el sur por la
    // acera» no dice nada que el cardinal no dijera ya.
    texto:
      `Sal de ${nombreOrigen} y dirígete hacia el ${cardinal}` +
      (primero.conNombre ? ` por ${primero.nombre}` : ''),
    metros: metrosParaLeer(primero.metros),
  });

  // ── Un paso por cada maniobra que ha sobrevivido ─────────────────────────
  for (let k = 1; k < maniobras.length; k++) {
    const maniobra = maniobras[k]!;
    pasos.push({
      giro: maniobra.giro,
      texto: `${COMO_SE_DICE[maniobra.giro]} hacia ${maniobra.nombre}`,
      metros: metrosParaLeer(maniobra.metros),
    });
  }

  // ── El cierre: de qué lado queda la puerta ───────────────────────────────
  //
  // Se mide sobre el ÚLTIMO TRAMO DE VERDAD, no sobre la última maniobra: de
  // qué lado cae una puerta es geometría, y si el último trozo se fundió sigue
  // siendo por donde se llega.
  const ultimo = tramos[tramos.length - 1]!;
  pasos.push({
    giro: 'llegada',
    texto: `${nombreDestino} está a la ${ladoDelDestino(ultimo.g, puertaDestino)}`,
    metros: 0,
  });

  return pasos;
}
