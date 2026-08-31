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
 * **2 · Lo innombrado habla POR HERENCIA, y si no, POR TIPO.** El 60% de las
 * aristas no tiene nombre en OSM, y no es que falte: las aceras y los carriles
 * bici no lo llevan. Pero una acera va pegada a su calle, y esa calle sí tiene
 * nombre en el callejero municipal — así que primero se pregunta al vecino
 * (`ejes.ts`, la herencia por vecindad) y solo si nadie contesta se habla por
 * tipo, exactamente como Valhalla dice *«onto the walkway»* cuando no hay
 * nombre. Son **tres niveles**, y están escritos abajo en `comoSeLlama`.
 *
 * **3 · Los extremos hablan MUNICIPAL, y todo se ESCRIBE igual.** El registro
 * municipal publica en mayúscula administrativa y OSM en caso mixto; mezclados
 * en la misma lista, la ruta parece escrita por dos personas. La última línea
 * de este fichero recompone (`comoSePresenta`) — **el dato no se toca**. El nombre de OSM y el del callejero
 * discrepan en el 19,4% de los portales (§ 1.14 del notices). En medio manda
 * OSM, que es de quien es la red; pero el origen y el destino los eligió el
 * usuario de NUESTRO callejero, con su código, y ahí se le dice el nombre que
 * él leyó. Decirle otro sería contradecir su propio formulario.
 */

import type { RedEnMemoria } from './red.ts';
import type { Giro, ParteDelPaso, Paso } from '@desplazame/tipos';
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
 * ⭐ Los dos perfiles que narran POR TIPO SIEMPRE, hereden lo que hereden.
 *
 * Un **paso de peatones** CRUZA la calle: no pertenece a ella. La herencia por
 * vecindad le va a dar el nombre de la calzada que atraviesa —es la más
 * cercana, y en eso no se equivoca—, pero decirle a quien anda «continúa por
 * Avenida de Navarra» mientras cruza Navarra es peor que no decirle nada: le
 * quita justo el aviso que necesita. Lo mismo unas **escaleras**: lo que
 * importa de unas escaleras es que son escaleras.
 *
 * [DOC Valhalla] Es su nivel 1 y ya estaba vivo: cuando el tipo dice más que
 * el nombre, manda el tipo. Aquí solo se hace explícito que la herencia **no**
 * lo desactiva. El veto es de la narración, no del cruce: `ejes.ts` los casa
 * igual, para que su medición sea completa y comparable.
 */
export const NARRAN_SIEMPRE_POR_TIPO: ReadonlySet<string> = new Set([
  'paso-de-peatones',
  'escaleras',
]);

/**
 * ⭐ Las 30 palabras de tipo de vía, **sacadas del censo municipal**.
 *
 * No están escritas de cabeza: son el cruce `tipo_via` → primera palabra de
 * `nombre_publico` sobre las 3.358 vías con nombre de § 1.15, y el cruce sale
 * limpio — **cada uno de los 30 tipos usa exactamente una palabra**, sin una
 * sola excepción. Van ya normalizadas (mayúsculas, sin tildes), que es la
 * forma en la que se comparan.
 *
 * **Las de OSM que no están aquí se quedan dentro del núcleo a propósito**
 * —`Autovía`, `Autopista`, `Corredor`, `Senda`, `Paso`—: no aparecen en el
 * censo, así que quitarlas sería inventarse la lista. El efecto de dejarlas es
 * conservador: dos nombres casan de menos, nunca de más.
 */
export const PALABRAS_DE_TIPO: ReadonlySet<string> = new Set([
  'CALLE', 'CAMINO', 'PLAZA', 'AVENIDA', 'ANDADOR', 'PARQUE', 'PASEO',
  'GLORIETA', 'JARDINES', 'DISEMINADO', 'PUENTE', 'CALLEJON', 'TRAVESIA',
  'CARRETERA', 'URBANIZACION', 'POLIGONO', 'RONDA', 'VIA', 'GRUPO', 'PASAJE',
  'ROTONDA', 'EMBARCADERO', 'CARRERA', 'RINCON', 'BULEVAR', 'LAGO', 'SOTO',
  'BARRIO', 'PATIO', 'REPLACETA',
]);

/** Las partículas que unen el nombre y que cada registro pone donde quiere. */
const PARTICULAS: ReadonlySet<string> = new Set(['DE', 'DEL', 'LA', 'LAS', 'EL', 'LOS', 'Y']);

/**
 * ⭐ EL NÚCLEO de un nombre de calle: lo que queda cuando se le quita todo lo
 * que cada registro escribe a su manera.
 *
 * El problema que resuelve, con la ruta de Antonio delante: el carril bici
 * hereda **«AVENIDA SAN JUAN DE LA PEÑA»** del callejero municipal y la
 * calzada de al lado trae **«Avenida de San Juan de la Peña»** de OSM. Son la
 * misma avenida y la ruta las anunciaba dos veces seguidas — medido antes de
 * esto: **el 54,8 % de las rutas** lo hacía, y el 6,5 % de los pasos.
 *
 * [DOC OSRM] No es una idea nueva: su `requiresNameAnnounced` **descompone** el
 * nombre y compara el núcleo, precisamente para que un cambio de prefijo o
 * sufijo de tipo —«Avenida»— no cuente como cambio de calle.
 *
 * [DOC Karlsruhe / Streetmangler] Y la razón de que haya dos grafías es
 * conocida: cuando las calles y las direcciones viven en registros distintos,
 * la búsqueda se rompe. Aquí el registro canónico es **el municipal**, que es
 * el de nuestras direcciones y el que el usuario acaba de leer en el
 * formulario.
 *
 * Cuatro pasos, y este es el orden:
 *
 * 1. **Mayúsculas y sin tildes**, y todo lo que no sea letra o número pasa a
 *    ser un espacio — eso colapsa de paso los **espacios dobles** que traen 20
 *    vías del WFS (§ 1.15).
 * 2. **Fuera la palabra de tipo, TODAS las veces que encabeza.** Una sola vez
 *    no basta: el municipal trae 21 nombres que la repiten —`CAMINO CAMINO DE
 *    LAS TORRES`—, y quitando una sola no casaría nunca con el `Camino de las
 *    Torres` de OSM.
 * 3. **Fuera las partículas**, que es donde los dos registros más difieren
 *    (`AVENIDA MADRID` contra `Avenida de Madrid`).
 * 4. Lo que queda, unido por espacios simples.
 *
 * ⚠️ **Y hay un efecto que conviene tener delante:** quitar la palabra de tipo
 * hace que **`RONDA HISPANIDAD` y `VÍA HISPANIDAD` den el mismo núcleo**, y son
 * dos vías municipales distintas con dos códigos distintos. Es la contrapartida
 * de la doctrina, está fijada en una prueba para que nadie la descubra por
 * sorpresa, y solo puede actuar entre dos tramos **contiguos** de una ruta.
 */
export function nucleoDe(nombre: string): string {
  const palabras = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((palabra) => palabra !== '');
  let k = 0;
  while (k < palabras.length && PALABRAS_DE_TIPO.has(palabras[k]!)) {
    k++;
  }
  return palabras
    .slice(k)
    .filter((palabra) => !PARTICULAS.has(palabra))
    .join(' ');
}

/** Cómo se llama un tramo, y de qué registro viene ese nombre. */
export interface Denominacion {
  readonly nombre: string;
  /** Si es un nombre de verdad o el hueco dicho por su tipo. */
  readonly conNombre: boolean;
  /** Si viene del callejero MUNICIPAL (heredado) y no de OSM. */
  readonly esMunicipal: boolean;
  /**
   * ⭐ Si lo que se pisa es **carril bici**, y por eso el nombre se viste:
   * «el carril bici de Avenida de Casablanca» en vez de «Avenida de
   * Casablanca» a secas.
   *
   * Hace falta porque el nombre de un carril bici **es el de la calle a la que
   * acompaña** — medido sobre el dato: de los 780 *ways* de carril con `name`
   * propio de OSM los más repetidos son «Avenida de Casablanca», «Vía
   * Hispanidad», «Avenida de Madrid», y los 579 que heredan del municipal
   * traen «RONDA HISPANIDAD», «AVENIDA CATALUÑA». Ninguno se llama a sí mismo
   * carril. Sin el vestido, la indicación manda a la calzada de una avenida a
   * quien va por su carril, que es justo lo que hay que distinguir.
   *
   * **Solo se pone cuando el tramo entero es carril**: al fundirse con la
   * calzada de la misma avenida el campo se apaga (ver `absorber` y
   * `unirLasQueSonLaMisma`), porque entonces lo que se recorre son las dos
   * cosas y decir «el carril bici de X» durante 400 m de calzada sería mentir.
   *
   * `false` en todo lo del peatón: su red no tiene carriles bici — se los cierra
   * su tabla de acceso—, así que ni uno solo de sus tramos puede encenderlo.
   */
  readonly esCarrilBici: boolean;
}

/**
 * ⭐ Si dos tramos son **la misma calle**, que no es lo mismo que llamarse
 * igual ni que llamarse parecido.
 *
 * Dos condiciones, y las dos hacen falta:
 *
 * **1 · Los dos tienen nombre de verdad.** [DOC OSRM] Es lo primero que hace
 * su `haveSameName` en `collapsing_utility.hpp`, con el comentario delante:
 *
 *     // make sure empty is not involved
 *     if (!has_name_or_ref(lhs) || !has_name_or_ref(rhs))
 *     {
 *         return false;
 *     }
 *
 * `«la calzada»` y `«la acera»` no son nombres: son el hueco de OSM dicho por
 * su tipo. Vacío contra vacío es **false**, no true.
 *
 * **2 · Sus núcleos coinciden, y no están vacíos.** Un núcleo vacío —un nombre
 * que es solo tipo y partículas— **no casa con nada, ni consigo mismo**: si
 * casara, dos calles sin nada que decir se fundirían por no decir nada.
 */
export function esLaMismaCalle(a: Denominacion, b: Denominacion): boolean {
  if (!a.conNombre || !b.conNombre) {
    return false;
  }
  const nucleo = nucleoDe(a.nombre);
  return nucleo !== '' && nucleo === nucleoDe(b.nombre);
}

/**
 * ⭐ De dos denominaciones EQUIVALENTES, la que se escribe.
 *
 * [DOC Karlsruhe] Manda el **municipal**: es el registro de nuestras
 * direcciones, y es el nombre que el usuario leyó al elegir el portal. Si
 * ninguna de las dos lo es —dos grafías de OSM, o dos genéricos— se queda la
 * que ya estaba anunciada, que es la primera.
 */
function canonico(yaEstaba: Denominacion, llega: Denominacion): Denominacion {
  return !yaEstaba.esMunicipal && llega.esMunicipal ? llega : yaEstaba;
}

/**
 * ⭐ Un número romano ENTERO, del I al MMMCMXCIX.
 *
 * [DOC RAE] Los números romanos se escriben **siempre en mayúsculas**, así que
 * son la excepción al caso mixto: «Calle Alfonso I», no «Calle Alfonso i».
 *
 * La expresión está **anclada por los dos lados y con un mirar-adelante** que
 * exige al menos una letra romana: sin el ancla, `CIVIL` casaría con su `C`
 * inicial y saldría «Calle Guardia CIVIL». Con ella, `CIVIL` se rechaza entero
 * —después de `IV` no puede venir una `L`— y no hace falta ninguna excepción
 * para él. Comprobado sobre los 3.358 nombres del censo: **de los tokens de
 * solo letras romanas, la expresión no rechaza ninguno que sí sea un número.**
 */
const ROMANO = /^(?=[MDCLXVI])M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/**
 * ⭐ Las palabras que la expresión acepta y que **no son un número**.
 *
 * Medido sobre los 3.358 nombres con nombre del censo municipal: de todos los
 * tokens que `ROMANO` acepta, **uno solo no numera nada** — `MI`, que aparece
 * en `CALLE MI TÍO` y en `CALLE TODO SOBRE MI MADRE`. Como romano vale 1001, y
 * no hay rey, papa ni siglo 1001 en un callejero.
 *
 * No es ambigua, y por eso no hubo que parar: en esos dos nombres `MI` es el
 * posesivo y en ningún otro sitio del censo aparece.
 *
 * `DI` y `MIX` también validan, y **no están en el censo**: queda anotado como
 * dato, no como excepción — meterlos sin haberlos visto sería inventarse la
 * lista.
 */
export const NO_SON_ROMANOS: ReadonlySet<string> = new Set(['MI']);

/**
 * ⭐ Las partículas AL ESCRIBIR. **Es una lista distinta de la del núcleo, y
 * tiene que serlo.**
 *
 * `PARTICULAS` —siete palabras— decide **qué calles son la misma**, y ampliarla
 * cambiaría las comparaciones. Esta decide **cómo se escribe un nombre**, y ahí
 * el criterio es el del IGN: *artículos, preposiciones, pronombres y
 * conjunciones* en minúscula cuando no abren el nombre.
 *
 * Están la lista de artículos, la de preposiciones y la de conjunciones. De
 * las 18 que el censo usa de verdad, **16 caen aquí**; las otras dos se dejan
 * fuera a propósito y con la medición delante:
 *
 * - **`BAJO`** aparece 3 veces y en 2 es un adjetivo, no una preposición:
 *   `CALLE BARRIO BAJO` y `CAMINO BAJO DE LA TORRE DEL RIMELICO`. Solo
 *   `CALLE CANTANDO BAJO LA LLUVIA` la usa como preposición.
 * - **`AL`** aparece 3 veces y en 2 no es la contracción: `JARDINES AL ÁNDALUS`
 *   y `ANDADOR ABÚ YA'FAR AL-MUQTADIR` llevan el artículo árabe pegado al
 *   nombre. Solo `CALLE AL ESTE DEL EDÉN` es la contracción.
 *
 * Dos contra dos en las dos, y se falla del lado que no toca un nombre propio.
 * `DEL`, que es la misma clase de contracción, sí entra: sus 163 apariciones
 * son todas preposición más artículo.
 *
 * Los **pronombres** que el IGN nombra no aparecen en el censo salvo `LO`, que
 * ya está aquí como artículo neutro. No se meten los demás: `SE`, `LE` y `QUE`
 * son homógrafos de nada en un callejero, y una lista que no se ha medido es
 * una lista inventada.
 */
export const PARTICULAS_AL_ESCRIBIR: ReadonlySet<string> = new Set([
  // Artículos
  'EL', 'LA', 'LOS', 'LAS', 'LO', 'UN', 'UNA', 'UNOS', 'UNAS',
  // Preposiciones, y la contracción `DEL`
  'A', 'ANTE', 'CON', 'CONTRA', 'DE', 'DEL', 'DESDE', 'DURANTE', 'EN', 'ENTRE',
  'HACIA', 'HASTA', 'MEDIANTE', 'PARA', 'POR', 'SEGUN', 'SIN', 'SOBRE', 'TRAS',
  // Conjunciones
  'Y', 'E', 'NI', 'O', 'U',
]);

/**
 * ⭐ Los artículos que **son parte del nombre propio** y por eso van altos.
 *
 * [DOC IGN] Las directrices toponímicas declaran la excepción con sus propios
 * ejemplos: **El Escorial**, **La Laguna**. El artículo sube cuando pertenece
 * al topónimo en vez de acompañarlo.
 *
 * Lo que no dan es cómo distinguirlos, y del dato municipal no sale: el censo
 * escribe TODO en mayúscula, así que `CALLE EL COLOSO` y `CALLE LA FUENTE` se
 * ven iguales. **La señal la pone OpenStreetMap**, que escribe en caso mixto y
 * decide en cada calle: «Calle de **El** Coloso» —el cuadro de Goya— frente a
 * «Calle de **la** Fuente». La red cruza los dos ficheros por núcleo al
 * arrancar y deja aquí el resultado.
 *
 * Medido: **252 núcleos** llevan artículo alto en OSM y le afectan a **142
 * nombres municipales**; otros **327** con artículo intermedio no tienen
 * equivalente y van con la regla general.
 *
 * ⚠️ Y trae la errata de OSM dentro, que es el precio de fiarse de él: entre
 * los 142 hay media docena donde el alto es discutible —«Calle de Alfonso X
 * **El** Sabio», «Pedro II **El** Católico», «Martín **El** Humano»—, que la
 * RAE escribiría con minúscula por ser apodos. No se corrigen aquí: se
 * declaran, porque enmendar a OSM a mano es empezar otra lista.
 */
export type ArticulosPropios = ReadonlyMap<string, ReadonlySet<string>>;

/** El nombre de la CALLE dentro de una dirección: sin el núcleo ni el portal. */
function soloLaVia(nombre: string): string {
  let queda = nombre.replace(/\s*\[[^\]]*\]/gu, '');
  for (;;) {
    const corto = queda.replace(/\s+\S*\p{N}\S*$/u, '');
    if (corto === queda) {
      return queda;
    }
    queda = corto;
  }
}

/** Quita tildes y sube a mayúsculas, solo para COMPARAR. */
const paraComparar = (palabra: string): string =>
  palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

/**
 * ⭐ CÓMO SE ESCRIBE UN NOMBRE EN LA PANTALLA. **El dato no se toca: esto es
 * presentación, y vive solo en la última línea de la narración.**
 *
 * El callejero municipal publica en **mayúscula administrativa** —`AVENIDA SAN
 * JUAN DE LA PEÑA`—, que es como se escribe un registro y no como se lee una
 * indicación. OpenStreetMap publica en caso mixto. Mezclados en la misma lista,
 * la ruta parece escrita por dos personas.
 *
 * Tres reglas, y las tres con su fuente:
 *
 * 1. **[DOC IGN, Directrices toponímicas]** las palabras significativas llevan
 *    mayúscula inicial y **las partículas van en minúscula** — salvo si abren
 *    el nombre, que entonces son la primera palabra. La lista de partículas es
 *    la misma que usa el núcleo, y no es casualidad: son las mismas.
 * 2. **[DOC RAE]** los números romanos, en mayúsculas. Ver `ROMANO`.
 * 3. **[DOC OSM ES] sin abreviaturas** — y eso corta por los dos lados. Aquí
 *    no se abrevia nada; pero **tampoco se desabrevia**: el censo escribe
 *    `NTRA. SRA.` y desplegarlo sería inventarse el dato en vez de presentarlo.
 *    Abreviar o no es decisión de quien escribe el callejero, no nuestra.
 *
 * Lo que **no** es una palabra se queda donde está: el marcador de núcleo rural
 * (`---CST`), los números de portal, los paréntesis que el propio dato trae.
 *
 * `esMunicipal` decide si se recompone siempre o solo cuando hace falta. Un
 * nombre de OSM ya viene legible y **no se toca**; solo se recompone si llega
 * en mayúsculas plenas —en el fichero de § 1.14 son **tres de 4.384**—. Un
 * nombre municipal se recompone siempre, y eso además deja legible la única
 * vía del censo con la vocal acentuada en minúscula (`ANDADOR ABOGACíA…`, la
 * suciedad de origen declarada en § 1.3), sin tocar el fichero.
 *
 * `propios` es el cruce de artículos que son nombre propio (ver arriba). Sin
 * él, la regla general: el artículo intermedio baja.
 */
export function comoSePresenta(
  nombre: string,
  esMunicipal: boolean,
  propios?: ArticulosPropios,
): string {
  const enMayusculasPlenas = /\p{Lu}/u.test(nombre) && !/\p{Ll}/u.test(nombre);
  if (!esMunicipal && !enMayusculasPlenas) {
    return nombre;
  }
  // ⭐ Se trocea en PALABRAS DE VERDAD, no por espacios. Entrada nº8 de la
  // bitácora: partiendo solo por espacios, el token de `(GP-F II)` era `II)`
  // —con el paréntesis dentro—, y `II)` no valida como número romano, así que
  // el romano salía «Ii)». El dato real pega los signos a las palabras: el
  // paréntesis, el corchete del núcleo rural y **el punto de las abreviaturas
  // que el censo escribe sin espacio** (`NTRA.SRA.DEL AGUA`).
  //
  // `split` con grupo de captura devuelve alternando palabra y separador, y
  // los separadores se conservan tal cual: nada se pierde ni se mueve.
  // Los artículos que este nombre concreto escribe altos, si es que alguno.
  // La clave se busca por el nombre de la VÍA, no por la dirección entera: un
  // extremo llega como «CALLE EL COLOSO 2» y su núcleo llevaría el número
  // dentro, así que no casaría nunca con el `COLOSO` del cruce — y la cabecera
  // diría «Calle el Coloso 2» mientras el paso siguiente dice «Calle de El
  // Coloso». Se quitan el núcleo rural entre corchetes y los trozos finales
  // que llevan cifra, que son del portal y no de la calle.
  //
  // ⚠️ No cubre los números de portal con espacios dentro —«71 TV C2», que el
  // censo trae—: ahí solo se quita el último trozo. El efecto es que ese
  // extremo se queda con la regla general del artículo, no que se rompa nada.
  const altos = propios?.get(nucleoDe(soloLaVia(nombre)));

  let esLaPrimera = true;
  // `suelto` dice si el trozo es TODO su token, es decir si va entre espacios.
  const recomponer = (trozo: string, suelto: boolean): string => {
    // Un trozo sin letras —un número de portal, un signo, un espacio— se copia
    // tal cual: no hay nada que capitalizar, y tampoco consume el turno de la
    // primera palabra.
    if (!/\p{L}/u.test(trozo)) {
      return trozo;
    }
    const comparable = paraComparar(trozo);
    const abreElNombre = esLaPrimera;
    esLaPrimera = false;
    if (ROMANO.test(comparable) && !NO_SON_ROMANOS.has(comparable)) {
      return comparable;
    }
    const enMinusculas = trozo.toLocaleLowerCase('es-ES');
    // ⭐ La partícula baja si no abre el nombre y no es parte de un nombre
    // propio. Y si mide UNA SOLA LETRA, además tiene que ir **suelta**: `A.`
    // en «Tomás A. Édison» y `(E)` en «Ciudad Transporte (E)» son la misma
    // letra que la preposición y la conjunción, y lo único que las distingue
    // es que no van solas en su token. Medido en el censo: 5 iniciales `A.`,
    // 1 `E.`, y las etiquetas `(A)`, `(E)`, `(O)`.
    //
    // La exigencia se limita a las de una letra a propósito: `NTRA.SRA.DEL
    // AGUA` lleva un `DEL` pegado a dos abreviaturas, y ese sí es la partícula.
    const esUnaLetra = comparable.length === 1;
    if (
      !abreElNombre &&
      (suelto || !esUnaLetra) &&
      PARTICULAS_AL_ESCRIBIR.has(comparable) &&
      !altos?.has(comparable)
    ) {
      return enMinusculas;
    }
    return enMinusculas.charAt(0).toLocaleUpperCase('es-ES') + enMinusculas.slice(1);
  };

  return nombre
    .split(' ')
    .map((token) =>
      // El MARCADOR DE NÚCLEO RURAL (`---CST`, `---PÑF`) lleva letras, pero es
      // un código del censo y no una palabra: recomponerlo daría `---Cst`. Son
      // 256 vías las que lo arrastran (§ 1.3), y se dice tal cual viene.
      token.startsWith('---')
        ? token
        : ((trozos) =>
            trozos.map((trozo) => recomponer(trozo, trozos.length === 1)).join(''))(
            token.split(/([^\p{L}\p{N}]+)/u),
          ),
    )
    .join(' ');
}

/**
 * ⭐ Lo que va entre el giro y el nombre: **«hacia» o «para seguir por»**.
 *
 * Una calle puede torcer sin dejar de ser ella misma. En CALLE ABEDUL 1 →
 * CALLE ALFARERÍA 6 hay dos pasos seguidos por Calle Monasterio de Nuestra
 * Señora de los Ángeles —se sale de ella y se vuelve a entrar—, y el segundo
 * decía «Gira a la derecha **hacia** Calle Monasterio…». Ese «hacia» promete
 * una calle nueva, y no la hay: es una mentira pequeña y sistemática.
 *
 * [DOC Valhalla] Su fórmula para esto es **«Turn right to stay on X»**: el giro
 * se anuncia —hay que girar— pero el nombre no se presenta como si fuera nuevo.
 * Aquí se dice «Gira a la derecha **para seguir por** X».
 *
 * **Solo con nombre, que es como lo hace Valhalla**: por una acera anónima no
 * se «sigue», porque no había nada en lo que seguir. Sale gratis:
 * `esLaMismaCalle` ya exige nombre en los dos lados —el `has_name_or_ref` de
 * OSRM—, así que dos genéricos seguidos nunca casan y se quedan con «hacia».
 *
 * En la práctica solo la disparan los giros DE VERDAD: un giro suave por la
 * misma calle ya lo funde la regla A del colapso, y nunca llega hasta aquí.
 */
export function comoSeEnlaza(
  anterior: Denominacion | undefined,
  actual: Denominacion,
): string {
  return anterior !== undefined && esLaMismaCalle(anterior, actual)
    ? ' para seguir por '
    : ' hacia ';
}

/** Lo que hace falta para saber cómo se llama un tramo. */
interface Denominador {
  readonly nombreDeWay: ReadonlyMap<number, string>;
  readonly nombreHeredado: ReadonlyMap<number, string>;
  readonly tipoDeWay: ReadonlyMap<number, string>;
}

/**
 * ⭐ CÓMO SE LLAMA UN TRAMO. **Tres niveles, y este es el orden.**
 *
 * 1. **El `name` de OSM**, si lo tiene. La red es suya y el way sabe cómo se
 *    llama. 40,0 % de las aristas del subgrafo útil.
 * 2. **El nombre MUNICIPAL heredado por vecindad** (`ejes.ts`), si el way es
 *    mudo y la herencia pasó las dos puertas de confianza. Otro 37,1 %.
 * 3. **El genérico por tipo real**, que nunca falla porque siempre hay tipo.
 *
 * `conNombre` dice si lo devuelto es un nombre de verdad o el hueco dicho por
 * su tipo, y es el `has_name_or_ref` de OSRM: de él dependen la unión de
 * tramos y el colapso de maniobras. **Un nombre municipal heredado ES un
 * nombre** — si no lo fuera, dos tramos de la misma avenida heredada no se
 * fundirían y la ruta diría dos veces lo mismo.
 *
 * `esMunicipal` dice de qué **registro** viene, y decide quién gana cuando dos
 * grafías de la misma calle se juntan: ver `canonico`.
 */
export function comoSeLlama(red: Denominador, way: number, perfil: string): Denominacion {
  // ⭐ Si es carril bici, para vestir el nombre. Da igual de qué registro
  // venga: los dos traen el nombre de la CALLE, no el del carril.
  const esCarrilBici = red.tipoDeWay.get(way) === 'cycleway';
  const osm = red.nombreDeWay.get(way);
  if (osm !== undefined) {
    return { nombre: osm, conNombre: true, esMunicipal: false, esCarrilBici };
  }
  if (!NARRAN_SIEMPRE_POR_TIPO.has(perfil)) {
    const heredado = red.nombreHeredado.get(way);
    if (heredado !== undefined) {
      return { nombre: heredado, conNombre: true, esMunicipal: true, esCarrilBici };
    }
  }
  return {
    nombre: nombreGenerico(perfil, red.tipoDeWay.get(way)),
    conNombre: false,
    esMunicipal: false,
    // Sin nombre no hay nada que vestir: el genérico ya dice «el carril bici».
    esCarrilBici: false,
  };
}

/**
 * ⭐ EL VESTIDO DEL CARRIL: qué se dice ANTES del nombre de la calle.
 *
 * Devuelve `'el carril bici de '` cuando hay que vestir y `''` cuando no, para
 * que el sitio que compone la frase solo tenga que concatenar.
 *
 * **El nombre de un carril bici es el de la calle a la que acompaña.** No es
 * una suposición: de los 780 *ways* de carril con `name` propio de OSM los más
 * repetidos son «Avenida de Casablanca», «Vía Hispanidad» y «Avenida de
 * Madrid», y los 579 que heredan del callejero municipal traen «RONDA
 * HISPANIDAD» o «AVENIDA CATALUÑA». **Ninguno se llama a sí mismo carril.**
 * Así que decir el nombre a secas manda a la calzada a quien va por el carril.
 *
 * [DOC Valhalla] es su misma escuela —*«a generic description will be used…
 * when a walkway, cycleway or trail is unnamed»*—, llevada un paso más allá:
 * cuando el carril **sí** tiene nombre, el tipo no sustituye al nombre, lo
 * acompaña. El vestido es [PROPIO] sobre herencia doctrinada.
 *
 * Va en `papel: 'texto'` y no dentro del `via`: lo que se destaca es el nombre
 * de la calle, que es lo que se busca con la vista en un cartel.
 */
function vestidoDeCarril(tramo: Denominacion): string {
  return tramo.esCarrilBici && tramo.conNombre ? 'el carril bici de ' : '';
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
  // ⭐ Los dos hitos. No son giros y no se usan por esta tabla —el texto entero
  // lo compone quien monta el trayecto de varios tramos, que es el único que
  // sabe cuántas bicis quedan y a qué hora—, pero están porque el `Record` los
  // exige y porque un hueco aquí sería un hueco que nadie ve.
  coge: 'Coge',
  aparca: 'Aparca',
  llegada: 'Has llegado',
  // ⭐ Y los dos del transporte con conductor (31/08). Tampoco se usan por
  // esta tabla: el paso de subir y el de bajar traen su frase entera, con la
  // línea y el poste dentro, y meterlos aquí sería partir en dos algo que se
  // escribe de una pieza.
  sube: '',
  baja: '',
  transborda: '',
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

/**
 * Un tramo: una o más aristas seguidas del mismo *way*, **ya con su nombre
 * puesto**.
 *
 * La denominación se resuelve aquí y no más tarde porque a partir de la unión
 * puede **cambiar**: cuando dos grafías de la misma calle se juntan, gana la
 * municipal (`canonico`), y eso hay que poder escribirlo en el tramo.
 */
/**
 * ⭐ CÓMO SE NARRA EL EMPUJE, o `undefined` si quien anda no empuja nada.
 *
 * Lo pasa la rueda; **el peatón manda `undefined` y no se entera de que esto
 * existe** — su narración sale por el mismo sitio y con las mismas letras que
 * antes del 30/08, y el sha256 de sus 391 rutas lo vigila.
 *
 * [DOC OSRM] su respuesta lleva un campo `mode` por paso y el tramo desmontado
 * es un modo propio; su suite tiene una prueba *«de todos los empujes y cambios
 * de modo»*. La razón no es de formato: **fundir el tramo que se empuja con el
 * que se rueda escribiría un paso que dice dos cosas a la vez**, y quien lo lee
 * no sabría dónde bajarse. Por eso el cambio de modo corta el tramo en las
 * cuatro pasadas de fusión, igual que lo corta un cambio de calle.
 */
export interface Empuje {
  /** Si esa arista se pisa con el vehículo en la mano. */
  readonly esEmpuje: (arista: number) => boolean;
  /** Cómo se dice: «con la bici en la mano», «con el patín en la mano». */
  readonly enLaMano: string;
}

/**
 * ⭐ LAS COSTURAS de un tramo que no va solo (30/08, casillas 5 y 6).
 *
 * Un trayecto de tres tramos —rodar, aparcar, andar— se calcula como tres rutas
 * y se narra como una. Si cada tramo escribiera su propio principio y su propio
 * final, la lista diría tres veces «Sal de…» y tres veces «… está a la
 * derecha». Estas dos costuras son lo que evita eso, y **nada más**: un tramo
 * sin costuras se narra exactamente igual que antes del 30/08.
 *
 * - `apertura` sustituye al «Sal de X y dirígete hacia el norte» del primer
 *   paso por un verbo de continuación —«Sigue a pie», «Pedalea»—, porque de
 *   donde se sale ya lo dijo el hito anterior.
 * - `cierre` sustituye al paso de llegada por el HITO: «Aparca en el
 *   aparcabicis de X — 10 anclajes». El destino de este tramo no es el destino
 *   del viaje, así que decir «está a la derecha» sería decir que se ha llegado.
 *
 * [DOC OSRM] es su campo `mode` por paso llevado a la letra: el cambio de
 * vehículo es una maniobra propia, no una nota al pie del paso anterior.
 */
export interface Costuras {
  /** El verbo con el que arranca este tramo, si no es el primero del viaje. */
  readonly apertura?: string;
  /** El paso que cierra este tramo, si no es el último del viaje: el hito. */
  readonly cierre?: Paso;
}

interface Tramo extends Denominacion {
  readonly way: number;
  /** Si el tramo se recorre EMPUJANDO. Ver `Empuje`. */
  readonly empujando: boolean;
  readonly perfil: string;
  readonly metros: number;
  readonly g: readonly Punto[];
  /**
   * El NODO por el que se entra en este tramo, que es la frontera con el
   * anterior. `null` en el primero, que no tiene nada detrás.
   *
   * Existe por los combines de odin: dos de sus tres condiciones preguntan por
   * el cruce —cuántas salidas tiene, si alguna se llama igual— y esas
   * preguntas no se le pueden hacer a una lista de nombres y ángulos.
   */
  readonly nodoEntrada: number | null;
  /** La primera arista del tramo: la que SALE del nodo de entrada. */
  readonly aristaEntrada: number;
  /** La última: la que LLEGA al nodo de entrada del siguiente. */
  readonly aristaSalida: number;
}

/** La forma mutable con la que se agrupa y se une. */
type TramoEnObra = {
  way: number;
  empujando: boolean;
  perfil: string;
  metros: number;
  g: Punto[];
  nombre: string;
  conNombre: boolean;
  esMunicipal: boolean;
  esCarrilBici: boolean;
  nodoEntrada: number | null;
  aristaEntrada: number;
  aristaSalida: number;
};

/**
 * ⭐ EL NODO por el que se SALE de un trozo, o `null` si el trozo va recortado.
 *
 * El grafo no viene con nodos —`red.ts` los reconstruye por coincidencia
 * EXACTA de coordenada— y el trozo de ruta no los lleva: lleva su geometría ya
 * puesta en el sentido de la marcha. Así que se pregunta por el mismo criterio
 * con el que se construyeron: si el último vértice del trozo es el primero de
 * la arista, se sale por `desde`; si es el último, por `hasta`.
 *
 * Un trozo RECORTADO por el enganche del destino no termina en ningún nodo, y
 * ahí la respuesta es `null` — que es la verdad, no un fallo.
 *
 * Verificado sobre 56.566 trozos de 300 rutas: **todos los que no son el
 * último de su ruta resuelven, y el nodo que devuelven es extremo de la arista
 * siguiente en los 56.276 casos. Cero excepciones.**
 */
function nodoDeSalida(red: RedEnMemoria, trozo: TrozoDeRuta): number | null {
  const arista = red.aristas[trozo.arista]!;
  const fin = trozo.g[trozo.g.length - 1]!;
  const primero = arista.g[0]!;
  const ultimo = arista.g[arista.g.length - 1]!;
  if (fin[0] === ultimo[0] && fin[1] === ultimo[1]) {
    return arista.hasta;
  }
  if (fin[0] === primero[0] && fin[1] === primero[1]) {
    return arista.desde;
  }
  return null;
}

/**
 * Junta las aristas consecutivas que comparten `w` **y modo**.
 *
 * ⭐ El modo entra en la condición el 30/08: dos aristas del mismo *way* pueden
 * ser una de calzada y otra de acera —el perfil es de la arista, no del *way*—,
 * y juntarlas escribiría un paso que se rueda y se empuja a la vez.
 */
function agrupar(
  red: RedEnMemoria,
  trozos: readonly TrozoDeRuta[],
  empuje?: Empuje,
): readonly Tramo[] {
  const tramos: TramoEnObra[] = [];
  // El nodo por el que se salió de lo anterior es por el que se entra en lo
  // que venga. En el primer tramo no hay nada detrás: `null`.
  let frontera: number | null = null;
  for (const trozo of trozos) {
    const arista = red.aristas[trozo.arista]!;
    const ultimo = tramos[tramos.length - 1];
    const salida = nodoDeSalida(red, trozo);
    const empujando = empuje !== undefined && empuje.esEmpuje(trozo.arista);
    if (ultimo && ultimo.way === arista.way && ultimo.empujando === empujando) {
      ultimo.metros += trozo.metros;
      // El primer punto del trozo es el último del anterior: no se repite.
      ultimo.g.push(...trozo.g.slice(1));
      ultimo.aristaSalida = trozo.arista;
    } else {
      tramos.push({
        way: arista.way,
        empujando,
        perfil: arista.perfil,
        metros: trozo.metros,
        g: [...trozo.g],
        ...comoSeLlama(red, arista.way, arista.perfil),
        nodoEntrada: frontera,
        aristaEntrada: trozo.arista,
        aristaSalida: trozo.arista,
      });
    }
    frontera = salida;
  }
  return tramos;
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
 *
 * **«Se llaman igual» son dos cosas, y las dos valen aquí.** La misma cadena
 * —que es lo que hace que dos trozos de acera sin nombre se unan yendo recto—
 * o el mismo **núcleo**, que es lo que hace que la avenida heredada del
 * municipal y la misma avenida nombrada por OSM dejen de anunciarse dos veces.
 * Cuando se unen por núcleo, el nombre que sobrevive lo decide `canonico`.
 */
function unirLasQueSonLaMisma(tramos: readonly Tramo[]): readonly Tramo[] {
  const unidos: TramoEnObra[] = [];
  for (const tramo of tramos) {
    const ultimo = unidos[unidos.length - 1];
    const equivalente = ultimo !== undefined && esLaMismaCalle(ultimo, tramo);
    if (
      ultimo &&
      // ⭐ Nunca a través del cambio rodando↔empujando: ver `Empuje`.
      ultimo.empujando === tramo.empujando &&
      (ultimo.nombre === tramo.nombre || equivalente) &&
      giroDe(rumboDeSalida(ultimo.g), rumboDeEntrada(tramo.g)) === 'recto'
    ) {
      ultimo.metros += tramo.metros;
      ultimo.g.push(...tramo.g.slice(1));
      // La frontera de ENTRADA no se toca: unir alarga hacia delante, y por
      // donde se entró sigue siendo por donde se entró. La de salida sí avanza.
      ultimo.aristaSalida = tramo.aristaSalida;
      // ⭐ El vestido de carril bici solo sobrevive si lo eran LOS DOS: es la
      // fusión que junta el carril con la calzada de su misma avenida, y
      // llamar «el carril bici de X» a un tramo que ya es medio calzada sería
      // decirle a quien pedalea que siga por donde ya no va.
      ultimo.esCarrilBici = ultimo.esCarrilBici && tramo.esCarrilBici;
      if (equivalente) {
        const gana = canonico(ultimo, tramo);
        ultimo.nombre = gana.nombre;
        ultimo.esMunicipal = gana.esMunicipal;
      }
      continue;
    }
    unidos.push({
      way: tramo.way,
      empujando: tramo.empujando,
      perfil: tramo.perfil,
      metros: tramo.metros,
      g: [...tramo.g],
      nombre: tramo.nombre,
      conNombre: tramo.conNombre,
      esMunicipal: tramo.esMunicipal,
      esCarrilBici: tramo.esCarrilBici,
      nodoEntrada: tramo.nodoEntrada,
      aristaEntrada: tramo.aristaEntrada,
      aristaSalida: tramo.aristaSalida,
    });
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
 * ⭐ EL CRUCE por el que se entra en una maniobra, reducido a las dos preguntas
 * que los combines de odin le hacen.
 *
 * [DOC Valhalla odin, `IsNextManeuverObvious()`] Su criterio para saber si un
 * «Continúa» hace falta decirlo NO está en la lista de maniobras: está en el
 * cruce. Pregunta si desde ahí se puede hacer otra cosa que seguir, y si hay
 * alguna otra rama que se llame igual —que es cuando seguir deja de ser obvio,
 * porque hay dos calles del mismo nombre y hay que elegir—.
 *
 * Se resuelve **antes** de bajar a la forma llana, que es donde todavía hay red
 * y geometría. Así la fusión y el colapso siguen siendo funciones puras sobre
 * nombres, metros y ángulos: en las pruebas la encrucijada se inventa igual que
 * se inventan los rumbos.
 */
export interface Encrucijada {
  /**
   * Cuántas salidas transitables tiene el cruce **sin contar aquella por la
   * que se llegó**. Si vale 1, la única cosa que se puede hacer es seguir.
   *
   * `null` es **NO CONSTA**, no cero: el primer tramo de una ruta no tiene
   * cruce detrás, y un tramo recortado por el enganche no termina en un nodo.
   */
  readonly salidas: number | null;
  /**
   * Si alguna rama del cruce que **no es** ni por la que se llega ni por la que
   * se sigue lleva el mismo nombre que este tramo. Cuando la hay, seguir deja
   * de ser obvio: hay dos maneras de seguir «por la misma calle».
   */
  readonly otraDelMismoNombre: boolean;
}

/**
 * Lo que se sabe de un cruce que no se ha podido mirar: **nada, y por el lado
 * que no habilita**. Con `salidas` a NO CONSTA no dispara la primera condición
 * y con la otra rama declarada presente no dispara la tercera.
 */
export const SIN_ENCRUCIJADA: Encrucijada = { salidas: null, otraDelMismoNombre: true };

/**
 * Un tramo reducido a lo que la fusión necesita: cómo se llama, cuánto mide, y
 * con qué rumbo se entra y se sale de él.
 *
 * Se baja a esta forma llana para que la fusión sea una función **pura y
 * probable con ángulos inventados**: la regla de qué se funde y qué giro sale
 * es delicada, y comprobarla exigiendo una ruta de Zaragoza que la dispare
 * sería comprobarla a medias.
 */
export interface TramoLlano extends Denominacion {
  readonly metros: number;
  readonly entrada: number;
  readonly salida: number;
  /** Si se recorre EMPUJANDO. `false` en todo lo del peatón. Ver `Empuje`. */
  readonly empujando: boolean;
  /** El cruce por el que se entra. Ver `Encrucijada`. */
  readonly encrucijada: Encrucijada;
}

/** Lo que sobrevive a la fusión: un paso, con su giro ya combinado. */
export interface TramoFundido extends Denominacion {
  readonly metros: number;
  readonly giro: Giro;
  /** Si se recorre EMPUJANDO. `false` en todo lo del peatón. Ver `Empuje`. */
  readonly empujando: boolean;
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
  /**
   * El cruce por el que se entra en la maniobra.
   *
   * Es el del primer tramo que la formó, y no hay que recalcularlo: fundir y
   * absorber alargan **hacia delante**, así que por donde se entró no cambia.
   * La única excepción es la regla del dominante, y ahí viaja con él — si el
   * nombre pasa a ser el suyo, su cruce es el que corresponde a ese nombre.
   */
  readonly encrucijada: Encrucijada;
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
    esMunicipal: boolean;
    esCarrilBici: boolean;
    metros: number;
    metrosPropios: number;
    giro: Giro;
    entrada: number;
    salida: number;
    empujando: boolean;
    encrucijada: Encrucijada;
  }[] = [];

  for (const tramo of tramos) {
    const ultimo = salen[salen.length - 1];
    if (!ultimo) {
      salen.push({
        nombre: tramo.nombre,
        conNombre: tramo.conNombre,
        esMunicipal: tramo.esMunicipal,
        metros: tramo.metros,
        metrosPropios: tramo.metros,
        giro: 'salida',
        entrada: tramo.entrada,
        salida: tramo.salida,
        empujando: tramo.empujando,
        esCarrilBici: tramo.esCarrilBici,
        encrucijada: tramo.encrucijada,
      });
      continue;
    }

    // EL ÁNGULO COMBINADO: del rumbo con el que se salía de lo último que se
    // anunció, al rumbo con el que se entra en esto. Lo fundido queda en medio
    // y no cuenta.
    const giro = giroDe(ultimo.salida, tramo.entrada);
    const esMicro = tramo.metros < UMBRAL_MICRO_M;
    // Se calcula ANTES de tocar nada: en cuanto `ultimo` cambia de nombre, ya
    // no se puede preguntar si eran equivalentes.
    const equivalente = esLaMismaCalle(ultimo, tramo);
    const esLaMisma = giro === 'recto' && (tramo.nombre === ultimo.nombre || equivalente);
    // El arranque no se funde hacia atrás porque no hay atrás: traga hacia
    // delante. Regla 5.
    const arranqueInsignificante = salen.length === 1 && ultimo.metros < UMBRAL_MICRO_M;
    // ⭐ Y NADA se funde a través del cambio rodando↔empujando, ni aunque mida
    // dos metros: el aviso de bajarse del vehículo es justo lo que no se puede
    // perder por insignificante. Ver `Empuje`.
    const mismoModo = ultimo.empujando === tramo.empujando;

    if (mismoModo && (esMicro || esLaMisma || arranqueInsignificante)) {
      ultimo.metros += tramo.metros;
      if (tramo.metros > ultimo.metrosPropios) {
        ultimo.metrosPropios = tramo.metros;
        ultimo.entrada = tramo.entrada;
        ultimo.salida = tramo.salida;
        // La regla del dominante manda sobre los RUMBOS siempre, pero sobre el
        // NOMBRE solo cuando son calles distintas: entre dos grafías de la
        // misma calle decide el registro, no los metros. Si no, la misma
        // avenida saldría municipal en un paso y de OSM en el siguiente según
        // qué trozo midiera más.
        if (!equivalente) {
          ultimo.nombre = tramo.nombre;
          ultimo.conNombre = tramo.conNombre;
          ultimo.esMunicipal = tramo.esMunicipal;
          // Y su cruce con él: una encrucijada dice algo del nombre que la
          // acompaña —si alguna otra rama se llama igual—, así que dejar la
          // vieja pegada a un nombre nuevo sería dejar una respuesta a una
          // pregunta que ya no se hizo.
          ultimo.encrucijada = tramo.encrucijada;
        }
      }
      // La misma regla que arriba: el vestido solo sobrevive si lo eran los dos.
      ultimo.esCarrilBici = ultimo.esCarrilBici && tramo.esCarrilBici;
      if (equivalente) {
        const gana = canonico(ultimo, tramo);
        ultimo.nombre = gana.nombre;
        ultimo.esMunicipal = gana.esMunicipal;
      }
      continue;
    }

    salen.push({
      nombre: tramo.nombre,
      conNombre: tramo.conNombre,
      esMunicipal: tramo.esMunicipal,
      esCarrilBici: tramo.esCarrilBici,
      metros: tramo.metros,
      metrosPropios: tramo.metros,
      giro,
      entrada: tramo.entrada,
      salida: tramo.salida,
      empujando: tramo.empujando,
      encrucijada: tramo.encrucijada,
    });
  }

  return salen.map(
    ({
      nombre,
      conNombre,
      esMunicipal,
      esCarrilBici,
      metros,
      giro,
      entrada,
      salida,
      empujando,
      encrucijada,
    }) => ({
      nombre,
      conNombre,
      esMunicipal,
      esCarrilBici,
      metros,
      giro,
      entrada,
      salida,
      empujando,
      encrucijada,
    }),
  );
}

/** Los tres giros que NO son una maniobra: se sigue por donde se iba. */
const GIROS_SUAVES: ReadonlySet<Giro> = new Set<Giro>([
  'recto',
  'ligera-derecha',
  'ligera-izquierda',
]);

const esSuave = (giro: Giro): boolean => GIROS_SUAVES.has(giro);

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

/**
 * ⭐ Cuánto puede medir un «Continúa» para que valga la pena preguntarse si es
 * OBVIO. **0,6 km, y el número es de odin**: es `kShortContinueThreshold`,
 * leída de la fuente de `maneuversbuilder.cc`.
 *
 * Aquí hace **dos** trabajos, y conviene no confundirlos:
 *
 * 1. Es el umbral de la segunda condición, tal cual lo usa odin: un continue
 *    corto encajado entre dos maniobras que no son continues.
 * 2. **[PROPIO]** Es también la cota de lo que puede desaparecer. Odin absorbe
 *    el continue dentro de la maniobra anterior y —cuando esta no tiene
 *    nombre— le deja el suyo; el que se queda sin línea propia es el genérico
 *    de delante. Si ese genérico es LARGO, era la única seña de un tramo
 *    grande y callarlo empobrece la ruta. Medido sobre 387 rutas: sin esta
 *    cota, **2 de 89** absorciones mienten, y la peor dice **«Camino El
 *    Pollero · 1.300 m»** cuando 1.262,6 de esos metros son un camino que no
 *    se llama así. Con la cota, esos dos se quedan como estaban — y las 87
 *    que quedan son las que de verdad no pierden nada.
 *
 * El número se reutiliza porque es el que odin da para «un continue corto», y
 * no porque venga bien: inventar un segundo umbral cuando ya hay uno medido
 * para la misma pregunta sería añadir una constante sin fuente.
 */
export const CONTINUE_CORTO_M = 600;

/**
 * ⭐ Los dos genéricos que **no se combinan con nada**, ni por delante ni por
 * detrás.
 *
 * [DOC Valhalla odin] Veta la combinación de tramos con `trail_type` distinto y
 * la de las escaleras. Aquí valen las dos vetas y por la misma razón, que es la
 * de la **entrada nº7 de la bitácora**: cuando un paso se llama por su TIPO, el
 * tipo es toda la información que lleva, y fundir dos tipos distintos en uno
 * escribe una vía que no existe. Lo que allí decía «la calzada» sobre 1.270 m
 * de carril bici es exactamente lo que pasaría aquí.
 *
 * Las escaleras y el paso de peatones van además en su propia lista porque la
 * regla general no basta con ellos:
 *
 * - **Las escaleras** son la maniobra, no el camino. Fundirlas con lo de al
 *   lado —aunque lo de al lado también fueran escaleras— borra el aviso de que
 *   hay que subir, que es lo único que quien anda necesita saber ahí.
 * - **El paso de peatones** [DOC Valhalla `narrativebuilder.cc`, línea 4701]
 *   tiene fraseo PROPIO en odin, con su índice de diccionario aparte
 *   (`pedestrian_crossing`): no es un giro más, y por eso no se combina con sus
 *   vecinos. Su micro-fusión por debajo de 25 m sigue viva y no se toca — esa
 *   es otra pasada y otra pregunta.
 *
 * Se leen de `POR_PERFIL` y no se escriben otra vez: si algún día se cambia la
 * redacción, esta lista la sigue sola.
 */
const NO_SE_COMBINAN: ReadonlySet<string> = new Set([
  POR_PERFIL['escaleras']!,
  POR_PERFIL['paso-de-peatones']!,
]);

/** Si una maniobra es de las que no se combinan. Ver `NO_SE_COMBINAN`. */
const seCombina = (m: { nombre: string; conNombre: boolean }): boolean =>
  m.conNombre || !NO_SE_COMBINAN.has(m.nombre);

/** La forma mutable con la que se trabaja dentro del colapso. */
type Maniobra = {
  nombre: string;
  conNombre: boolean;
  esMunicipal: boolean;
  esCarrilBici: boolean;
  metros: number;
  giro: Giro;
  entrada: number;
  salida: number;
  empujando: boolean;
  encrucijada: Encrucijada;
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
  // El canónico ANTES de sumar nada, que es cuando todavía se puede preguntar
  // si eran la misma calle: si lo eran, el que se escribe es el municipal.
  if (esLaMismaCalle(crece, comido)) {
    const gana = canonico(crece, comido);
    crece.nombre = gana.nombre;
    crece.esMunicipal = gana.esMunicipal;
  }
  crece.metros += comido.metros;
  crece.salida = comido.salida;
  // ⭐ Y el vestido de carril bici solo sobrevive si lo eran los dos. Es la
  // misma regla de las dos pasadas anteriores, y aquí es donde más falta hace:
  // la regla C de odin absorbe el tramo de calzada que sigue al carril cuando
  // la maniobra es obvia, y sin esto el paso resultante seguiría diciendo «el
  // carril bici de X» con media avenida dentro.
  crece.esCarrilBici = crece.esCarrilBici && comido.esCarrilBici;
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
 * **Regla B — el segmento corto se absorbe, sea de quien sea.** [DOC OSRM] La
 * segunda rama de `suppressShortNameSegments` suprime contra el paso anterior
 * todo segmento de nombre nuevo que quede por debajo de
 * `NAME_SEGMENT_CUTOFF_LENGTH`, **sin exigir que los dos vecinos se llamen
 * igual**. Es la regla ancha, y es la que está viva aquí.
 *
 * El caso que la pedía: EL COLOSO 2 → VALLE DE ZURIZA 1 decía «Gira a la
 * derecha hacia AVENIDA ACADEMIA GENERAL MILITAR · 430 m», luego «Continúa
 * hacia **el carril bici · 82 m**», y luego «Continúa hacia AVENIDA SAN JUAN DE
 * LA PEÑA · 1.660 m». Esos 82 m son el trozo de carril que ninguna de las dos
 * avenidas reclama —queda en disputa al heredar—, y partir dos avenidas por él
 * no informa de nada: se anda seguido.
 *
 * **Y absorbe UNO, no dos.** La versión estrecha se comía el corto y el que
 * venía detrás de una vez, porque los dos vecinos eran la misma calle. Ahora se
 * absorbe solo el corto y el siguiente se procesa en su turno **con su giro
 * intacto** —que se midió contra la salida del corto, y esa salida es ya la del
 * que ha crecido—. Si además resulta ser la misma calle que el anterior, la
 * regla A lo junta en la vuelta siguiente. Termina igual y no se pierde ningún
 * giro por el camino.
 *
 * ⚠️ **Lo que la regla ancha se lleva por delante, y hay que saberlo:** los
 * nombres cortos con valor de referencia. «Plaza Basilio Paraíso · 62 m»
 * desaparece de la ruta larga, y esa plaza tiene nombre porque la gente la usa
 * para orientarse. Es el precio declarado de seguir a OSRM.
 *
 * **Regla C — UNNAMED STRAIGHT** y **regla D — el CONTINUE OBVIO** son las de
 * odin, y están escritas abajo con su cita y su medición. Van DESPUÉS de A y B
 * porque A y B son el colapso de OSRM, que ya vivía aquí; el orden dentro de
 * la vuelta no decide el resultado —el bucle itera hasta que nada cambia— pero
 * sí el orden de lectura, y así se lee cada capa con su fuente detrás.
 *
 * ── Y la (b) de odin, que ya estaba viva antes de este encargo ───────────────
 *
 * De las tres reglas de `Combine()`, la segunda —**SAME-BASE STRAIGHT**: recta
 * más nombre base común— **no se implementó aquí porque ya estaba**. Es la
 * regla A de arriba y `unirLasQueSonLaMisma` más abajo, las dos apoyadas en
 * `esLaMismaCalle`, que compara **núcleos** y no cadenas — que es exactamente
 * el «common base name» de odin. Medido sobre los pasos ya escritos de 387
 * rutas, antes y después de este encargo: **cero** parejas seguidas con el
 * mismo núcleo y giro suave se quedan sin fundir. No había hueco que tapar, y
 * añadir una cuarta regla que hiciera lo mismo habría sido escribir dos veces
 * la misma verdad.
 *
 * ── ⚠️ Nuestro «Continúa» NO es el `kContinue` de Valhalla ──────────────────
 *
 * Es el hallazgo que decide el alcance de la regla D, y conviene tenerlo
 * delante: **de los 1.511 «Continúa» que quedan en 387 rutas, CERO son la
 * misma calle que la maniobra anterior** —eran 1.627 y cero antes de este
 * encargo: la proporción no la mueven los combines—. No puede ser de otra
 * manera, porque los que lo eran los fundió la regla A antes de llegar aquí.
 * Así que cuando esta lista dice «Continúa», la calle está CAMBIANDO de nombre
 * sin que tuerzas, que en Valhalla no es `kContinue` sino un nombre nuevo, y
 * odin **no lo suprime**.
 *
 * Aplicarle igualmente la regla ancha de `IsNextManeuverObvious()` se midió
 * antes de decidir: **1.099 nombres de calle desaparecerían**, 237 de ellos en
 * tramos de más de 600 m, con casos como «Avenida de Cataluña · 2.971 m»
 * absorbida dentro de «Paseo de la Ribera». Eso no es ser conciso: es callar la
 * única seña de tres kilómetros. Por eso la regla D vive solo en su mitad que
 * HEREDA — la que sustituye un genérico por un nombre de verdad—, y la ancha
 * queda documentada y fuera, con sus números, para que la decisión sea de
 * quien la lea y no del silencio.
 *
 * ── Lo que tampoco entra, y por qué ────────────────────────────────────────
 *
 * [DOC Valhalla odin] Su **multi-cue verbal** —encadenar dos instrucciones en
 * un mismo aviso hablado cuando la segunda llega en menos de 13 s— **no se
 * implementa**, y no por falta de doctrina: es una regla de la capa de VOZ,
 * que decide cuándo se dice algo por un altavoz mientras alguien camina. Esta
 * lista se lee en una pantalla, entera y de una vez; el tiempo entre dos pasos
 * no significa nada aquí. Queda declarado para que nadie lo busque creyendo
 * que se olvidó.
 *
 * **Las salvaguardas, que es lo que hay que mirar si algún día esto miente.**
 * Un giro de verdad SE ANUNCIA: ni la regla A ni la B se aplican si el giro no
 * es suave, y la C y la D exigen «recto» a secas, que es más estrecho todavía.
 * Y en la B no basta con que los giros sean suaves por separado —dos
 * «ligeramente a la derecha» de 30° suman una derecha de 60°—, así que se mide
 * **el ángulo combinado a través de lo que se suprime** y solo se colapsa si
 * TAMBIÉN es suave. El arranque nunca desaparece, y el último tampoco: sin
 * nadie detrás no hay ángulo combinado que comprobar, y se deja. **La llegada
 * no pasa por aquí**: se escribe aparte, en `escribirPasos`, así que el destino
 * no se combina nunca — que es el tercer veto de odin, cumplido por
 * construcción y no por una condición que alguien pueda borrar.
 *
 * Se repite hasta que una vuelta no cambie nada: absorber crea vecindades
 * nuevas —A·B·A·A acaba en una sola A— y una sola pasada las dejaría a medias.
 * Termina siempre, porque cada vuelta que hace algo acorta la lista.
 *
 * ⭐ **Y esa repetición no es teórica: se ve en el dato.** Los combines nuevos
 * quitan 116 pasos de 9.348 en 387 rutas, y **114 son disparos directos: los
 * otros 2 son de segunda vuelta**. El caso, entero: SAGRADA 24 → TORRE SILLERO
 * 26 decía «Camino Antiguo de Alfocea · 1.630 m», «el camino · 570 m», «Camino
 * Antiguo de Alfocea · 400 m». La regla D absorbe el tercero en el segundo y le
 * deja su nombre; entonces el primero y el segundo son la misma calle en línea
 * recta, y **la regla A los junta en la vuelta siguiente**: un solo paso de
 * 2.610 m. Un disparo, dos pasos menos.
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

    // ⭐ NINGUNA regla cruza el cambio rodando↔empujando. Es el cuarto veto,
    // hermano de los tres de odin, y por la misma razón que el de las
    // escaleras: lo que el paso dice no es por dónde se va, es **cómo** — y
    // fundirlo con el de al lado borra el aviso de bajarse. Ver `Empuje`.
    const mismoModo = ultimo.empujando === maniobra.empujando;

    // ── Regla A ────────────────────────────────────────────────────────────
    // El giro de `maniobra` YA es el ángulo entre la salida de `ultimo` y su
    // entrada, así que preguntarle si es suave es preguntar por el combinado.
    if (mismoModo && esLaMismaCalle(ultimo, maniobra) && esSuave(maniobra.giro)) {
      absorber(ultimo, maniobra);
      continue;
    }

    // ── Regla B, la ANCHA ──────────────────────────────────────────────────
    // No se exige que los vecinos casen: basta con que el de en medio sea
    // corto y con que no haya un giro de verdad ni dentro ni a través de él.
    // `despues` tiene que EXISTIR —es quien pone el otro extremo del ángulo
    // combinado—, así que el último paso nunca se absorbe.
    const despues = maniobras[i + 1];
    if (
      despues &&
      mismoModo &&
      // La absorbida y la de después también tienen que ir en el mismo modo:
      // la regla B se come el de en medio, y comerse un empuje lo borraría.
      maniobra.empujando === despues.empujando &&
      // ⭐ Y de nombre DISTINTO a sus dos vecinos. Contra el de atrás ya lo
      // garantiza la regla A, que va antes; contra el de delante hay que
      // decirlo: si el corto es la misma calle que lo que viene, no es una
      // interrupción — es su primer trozo, y absorberlo hacia atrás le
      // regalaría sus metros a la calle anterior. Se deja pasar y la regla A
      // los junta en la vuelta siguiente, que es donde le tocan.
      !esLaMismaCalle(maniobra, despues) &&
      maniobra.metros < CORTE_DE_NOMBRE_M &&
      esSuave(maniobra.giro) &&
      esSuave(despues.giro) &&
      // ⭐ El ángulo combinado a través de la interrupción entera. Sin esto,
      // dos suaves del mismo signo se comerían un giro de verdad.
      esSuave(giroDe(ultimo.salida, despues.entrada))
    ) {
      absorber(ultimo, maniobra);
      // `despues` NO se salta: se procesa en su turno. Su giro se midió contra
      // la salida del corto, que acaba de pasar a ser la de `ultimo`, así que
      // sigue anunciando el ángulo correcto.
      continue;
    }

    // ── Regla C — UNNAMED STRAIGHT ─────────────────────────────────────────
    // [DOC Valhalla odin, `Combine()`] «Combine unnamed straight maneuvers».
    // Dos maniobras seguidas sin nombre propio y en línea recta son una.
    //
    // **Y tienen que decir LO MISMO**, que es donde el calco se convierte en
    // traducción. En Valhalla lo que compara son atributos del tramo —el
    // `trail_type`, el `travel_type`— y su veto es que sean distintos. Aquí un
    // tramo sin nombre se llama POR SU TIPO, así que el genérico ES el
    // atributo: dos genéricos distintos son dos tipos distintos, y ese es
    // justo el caso que el veto prohíbe. «La calzada» de 373 m seguida de «el
    // vial de servicio» de 297 m no son 670 m de calzada.
    //
    // Que la regla A no llegue aquí no es un descuido suyo: exige
    // `esLaMismaCalle`, que exige nombre en los dos lados —el
    // `has_name_or_ref` de OSRM— y devuelve false para dos huecos. Y
    // `fundirMicroTramos` sí junta dos genéricos iguales y rectos, pero solo
    // los que ya estaban seguidos ANTES de colapsar; los que quedan pegados
    // después de que el colapso se lleve lo de en medio no los vuelve a mirar
    // nadie. Este es ese hueco, y en el dato aparece: 27 casos en 387 rutas,
    // el mayor **«el camino» de 6.234 m seguido de otro de 1.263 m**.
    if (
      mismoModo &&
      !ultimo.conNombre &&
      !maniobra.conNombre &&
      ultimo.nombre === maniobra.nombre &&
      maniobra.giro === 'recto' &&
      seCombina(ultimo) &&
      seCombina(maniobra)
    ) {
      absorber(ultimo, maniobra);
      continue;
    }

    // ── Regla D — el CONTINUE OBVIO que deja su nombre ─────────────────────
    // [DOC Valhalla odin, `IsNextManeuverObvious()`, líneas 618-632] Un
    // «Continúa» que no se puede desobedecer no es una instrucción: se absorbe
    // en la maniobra anterior, y **si esa no tenía nombre y la absorbida sí,
    // hereda el nombre**.
    //
    // ⚠️ **Aquí solo vive esa mitad, la que hereda, y el motivo está medido.**
    // La regla ancha —absorber el continue también cuando el de delante ya
    // tiene nombre— se probó sobre 387 rutas: se llevaría por delante **1.099
    // nombres de calle**, 237 de ellos en tramos de más de 600 m, con casos
    // como **«Avenida de Cataluña · 2.971 m» tragada por «Paseo de la
    // Ribera»**. La razón por la que allí no vale y en odin sí está en la
    // cabecera de `colapsarManiobras`: nuestro «Continúa» y el `kContinue` de
    // Valhalla no son la misma maniobra. Antonio tiene los números.
    //
    // En esta mitad no se pierde nada: lo que desaparece es un genérico —un
    // hueco de OSM dicho por su tipo— y lo que sobrevive es un nombre de
    // calle. La información no se pierde, cambia de sitio [GUIA L59].
    //
    // Las tres condiciones son las de odin y basta con UNA:
    const despuesDelObvio = maniobras[i + 1];
    if (
      mismoModo &&
      maniobra.giro === 'recto' &&
      !ultimo.conNombre &&
      maniobra.conNombre &&
      // La cota de lo que desaparece. Ver `CONTINUE_CORTO_M`.
      ultimo.metros < CONTINUE_CORTO_M &&
      seCombina(ultimo) &&
      seCombina(maniobra) &&
      // ① Del cruce no sale nada más que seguir: obedecer no es una decisión.
      (maniobra.encrucijada.salidas === 1 ||
        // ② Un continue CORTO encajado entre dos maniobras que no lo son.
        (maniobra.metros < CONTINUE_CORTO_M &&
          ultimo.giro !== 'recto' &&
          (despuesDelObvio === undefined || despuesDelObvio.giro !== 'recto')) ||
        // ③ Ninguna otra rama del cruce se llama igual: no hay dos maneras de
        //    seguir «por esa calle», así que decirlo no desambigua nada.
        !maniobra.encrucijada.otraDelMismoNombre)
    ) {
      const nombre = maniobra.nombre;
      const esMunicipal = maniobra.esMunicipal;
      absorber(ultimo, maniobra);
      // La herencia. Va DESPUÉS de absorber porque `absorber` mira si las dos
      // eran la misma calle, y un genérico no es la misma calle que nadie.
      ultimo.nombre = nombre;
      ultimo.conNombre = true;
      ultimo.esMunicipal = esMunicipal;
      ultimo.encrucijada = maniobra.encrucijada;
      continue;
    }

    salen.push({ ...maniobra });
  }
  return salen;
}

/**
 * ⭐ LA TERCERA PASADA: **un solo registro por calle en toda la lista.**
 *
 * Las dos pasadas anteriores juntan lo que se puede juntar, y al juntarlo el
 * `canonico` deja escrito el nombre municipal. Pero hay pasos que **no se
 * juntan y hacen bien en no juntarse**: si entre dos tramos de Paseo Cuéllar
 * hay un giro de verdad, ese giro se anuncia — es la salvaguarda del colapso, y
 * quitarla dejaría a quien anda sin la única instrucción que necesitaba.
 *
 * El resultado era que la misma calle salía dos veces en la lista, una vez
 * «PASEO CUÉLLAR» y otra «Paseo Cuéllar». Medido sobre 400 rutas después del
 * colapso: **el 23,0 % de las rutas** seguía haciéndolo, y **97 de los 102
 * casos** eran exactamente ese, con un giro de verdad en medio.
 *
 * Así que esto no funde nada —el número de pasos no cambia— y solo decide
 * **cuál de los dos nombres ciertos se escribe**: si en algún punto de la ruta
 * esa calle apareció con su nombre municipal, ese se usa en todos.
 *
 * [DOC Karlsruhe / Streetmangler] El registro canónico es el municipal: es el
 * de nuestras direcciones y el que el usuario leyó al elegir el portal. Una
 * lista que alterna registros es la misma incoherencia que allí rompe la
 * búsqueda, aquí puesta delante de los ojos.
 *
 * **Lo que NO hace, y es a propósito:** un nombre que solo existe en OSM se
 * queda tal cual. Aquí no se traduce nada; solo se elige entre dos formas que
 * la ruta ya tenía.
 *
 * ⚠️ Va un paso más allá de la letra del encargo, que pedía el canónico
 * «cuando hay equivalentes en el tramo fundido». Sin esta pasada, «un solo
 * registro por calle» no se cumple en el 23 % de las rutas, y era el criterio
 * de HECHO. Queda declarado por si se quiere la versión corta: es borrar esta
 * función y su llamada.
 */
export function unificarElRegistro(
  maniobras: readonly TramoFundido[],
): readonly TramoFundido[] {
  const municipal = new Map<string, string>();
  for (const maniobra of maniobras) {
    if (!maniobra.conNombre || !maniobra.esMunicipal) {
      continue;
    }
    const nucleo = nucleoDe(maniobra.nombre);
    if (nucleo !== '') {
      municipal.set(nucleo, maniobra.nombre);
    }
  }
  if (municipal.size === 0) {
    return maniobras;
  }
  return maniobras.map((maniobra) => {
    // Un genérico no se renombra jamás: «la acera» no es una calle, y que su
    // texto casara con algo sería casualidad, no identidad.
    if (!maniobra.conNombre || maniobra.esMunicipal) {
      return maniobra;
    }
    const gana = municipal.get(nucleoDe(maniobra.nombre));
    return gana === undefined ? maniobra : { ...maniobra, nombre: gana, esMunicipal: true };
  });
}

/**
 * ⭐ Mira el CRUCE por el que se entra en un tramo y contesta las dos preguntas
 * de odin. Ver `Encrucijada`.
 *
 * `salidas` sale del grado del nodo en la CSR menos uno: la red guarda una
 * media arista por cada rama, y una de esas ramas es por la que se ha llegado.
 * Lo que queda son las opciones de verdad.
 *
 * `otraDelMismoNombre` recorre las ramas saltándose las dos de la ruta —por la
 * que se llega y por la que se sigue— y compara por **núcleo**, no por cadena:
 * la rama puede venir de OSM y el tramo del callejero municipal, y `AVENIDA
 * NAVARRA` y `Avenida de Navarra` tienen que contar como la misma. Es el mismo
 * `nucleoDe` que decide si dos tramos son la misma calle, reutilizado y no
 * reinventado.
 *
 * Un tramo genérico —sin nombre de verdad— no puede tener «otra rama del mismo
 * nombre»: no hay nombre que repetir. Se contesta `false`, que es lo cierto.
 */
function encrucijadaDe(
  red: RedEnMemoria,
  nodo: number | null,
  aristaQueLlega: number,
  aristaQueSigue: number,
  denominacion: Denominacion,
): Encrucijada {
  if (nodo === null) {
    return SIN_ENCRUCIJADA;
  }
  const primera = red.inicio[nodo]!;
  const ultima = red.inicio[nodo + 1]!;
  const nucleo = denominacion.conNombre ? nucleoDe(denominacion.nombre) : '';
  let otraDelMismoNombre = false;
  if (nucleo !== '') {
    for (let k = primera; k < ultima; k++) {
      const cual = red.salidaArista[k]!;
      if (cual === aristaQueLlega || cual === aristaQueSigue) {
        continue;
      }
      const rama = red.aristas[cual]!;
      const suya = comoSeLlama(red, rama.way, rama.perfil);
      if (suya.conNombre && nucleoDe(suya.nombre) === nucleo) {
        otraDelMismoNombre = true;
        break;
      }
    }
  }
  return { salidas: ultima - primera - 1, otraDelMismoNombre };
}

/**
 * ⭐ Arma un paso a partir de sus PARTES, y compone el texto plano con ellas.
 *
 * El texto no se escribe aparte: se **deriva** de las partes concatenándolas.
 * Así el contrato —«`texto` es exactamente la unión de `partes`»— no puede
 * romperse por descuido al tocar una de las dos, porque solo hay una.
 */
function pasoDe(giro: Giro, metros: number, partes: readonly ParteDelPaso[]): Paso {
  return { giro, texto: partes.map((parte) => parte.texto).join(''), metros, partes };
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
  /** Cómo se narra el empuje, si el modo empuja. El peatón no manda nada. */
  empuje?: Empuje,
  /** Cómo se cose con los tramos de al lado, si el viaje tiene más de uno. */
  costuras?: Costuras,
): readonly Paso[] {
  const tramos = unirLasQueSonLaMisma(agrupar(red, ruta.trozos, empuje));

  // Una ruta trivial de cero metros: no hay nada que andar y se dice.
  if (tramos.length === 0) {
    return [
      pasoDe('llegada', 0, [
        { papel: 'via', texto: comoSePresenta(nombreDestino, true, red.articulosPropios) },
        { papel: 'texto', texto: ' es el mismo portal del que sales.' },
      ]),
    ];
  }

  // Se bajan a la forma llana —nombre, metros y los dos rumbos— y se funden
  // los insignificantes. A partir de aquí ya no hay geometría: hay maniobras.
  const llanos: TramoLlano[] = tramos.map((tramo, k) => ({
    nombre: tramo.nombre,
    conNombre: tramo.conNombre,
    esMunicipal: tramo.esMunicipal,
    esCarrilBici: tramo.esCarrilBici,
    empujando: tramo.empujando,
    metros: tramo.metros,
    entrada: rumboDeEntrada(tramo.g),
    salida: rumboDeSalida(tramo.g),
    // El cruce se resuelve AQUÍ, que es la última línea donde todavía hay red:
    // a partir del renglón siguiente solo hay nombres, metros y ángulos.
    encrucijada: encrucijadaDe(
      red,
      tramo.nodoEntrada,
      tramos[k - 1]?.aristaSalida ?? -1,
      tramo.aristaEntrada,
      tramo,
    ),
  }));
  // TRES PASADAS, y en este orden. Las dos primeras son las de OSRM: se quitan
  // los trocitos que nadie percibe, y sobre lo que queda se colapsa lo que no
  // es una maniobra sino la misma calle contada dos veces. La tercera no junta
  // nada: solo deja **un solo registro por calle** en lo que ha sobrevivido.
  const maniobras = unificarElRegistro(colapsarManiobras(fundirMicroTramos(llanos)));

  const pasos: Paso[] = [];

  // ── El arranque, con su cardinal ─────────────────────────────────────────
  const primero = maniobras[0]!;
  const cardinal = CARDINALES[Math.round(primero.entrada / 45) % 8]!;
  // El origen habla municipal: se sale del portal que el usuario eligió. Y el
  // «por X» solo si hay nombre de verdad: «dirígete hacia el sur por la acera»
  // no dice nada que el cardinal no dijera ya.
  // ⭐ Si el tramo viene de un hito, no se «sale» de ningún sitio: se sigue.
  // Ver `Costuras`.
  const arranque: ParteDelPaso[] = costuras?.apertura
    ? [
        { papel: 'accion', texto: costuras.apertura },
        { papel: 'texto', texto: ` hacia el ${cardinal}` },
      ]
    : [
        { papel: 'accion', texto: 'Sal de' },
        { papel: 'texto', texto: ' ' },
        { papel: 'via', texto: comoSePresenta(nombreOrigen, true, red.articulosPropios) },
        { papel: 'texto', texto: ` y dirígete hacia el ${cardinal}` },
      ];
  if (primero.conNombre) {
    arranque.push(
      { papel: 'texto', texto: ' por ' + vestidoDeCarril(primero) },
      {
        papel: 'via',
        texto: comoSePresenta(primero.nombre, primero.esMunicipal, red.articulosPropios),
      },
    );
  }
  // ⭐ Y si ya el primer tramo se empuja, se dice desde el principio.
  if (primero.empujando && empuje) {
    arranque.push({ papel: 'texto', texto: `, ${empuje.enLaMano}` });
  }
  pasos.push(pasoDe('salida', metrosParaLeer(primero.metros), arranque));

  // ── Un paso por cada maniobra que ha sobrevivido ─────────────────────────
  for (let k = 1; k < maniobras.length; k++) {
    const maniobra = maniobras[k]!;
    const partes: ParteDelPaso[] = [
      { papel: 'accion', texto: COMO_SE_DICE[maniobra.giro] },
      {
        papel: 'texto',
        texto: comoSeEnlaza(maniobras[k - 1], maniobra) + vestidoDeCarril(maniobra),
      },
      {
        // Un tramo que se narra por su tipo —«la acera»— no lleva `via`:
        // destacarlo lo haría parecer un nombre, y no lo es.
        papel: maniobra.conNombre ? 'via' : 'texto',
        texto: comoSePresenta(maniobra.nombre, maniobra.esMunicipal, red.articulosPropios),
      },
    ];
    // ⭐ EL EMPUJE SE DICE AL ENTRAR EN ÉL, y solo ahí: cuando el paso anterior
    // ya empujaba no hace falta repetirlo — el tramo es uno, y lo que el
    // siguiente paso anuncia es que se vuelve a rodar. Es lo que el encargo
    // llama «al entrar se dice; al volver a rodar, se retoma».
    if (empuje && maniobra.empujando && !maniobras[k - 1]!.empujando) {
      partes.push({ papel: 'texto', texto: `, ${empuje.enLaMano}` });
    }
    pasos.push(pasoDe(maniobra.giro, metrosParaLeer(maniobra.metros), partes));
  }

  // ── El cierre: de qué lado queda la puerta ───────────────────────────────
  //
  // Se mide sobre el ÚLTIMO TRAMO DE VERDAD, no sobre la última maniobra: de
  // qué lado cae una puerta es geometría, y si el último trozo se fundió sigue
  // siendo por donde se llega.
  const ultimo = tramos[tramos.length - 1]!;
  // ⭐ Y si este tramo no acaba el viaje, lo que va aquí es el HITO: dónde se
  // aparca o dónde se coge la bici. Ver `Costuras`.
  pasos.push(
    costuras?.cierre ??
      pasoDe('llegada', 0, [
        { papel: 'via', texto: comoSePresenta(nombreDestino, true, red.articulosPropios) },
        { papel: 'texto', texto: ` está a la ${ladoDelDestino(ultimo.g, puertaDestino)}` },
      ]),
  );

  return pasos;
}
