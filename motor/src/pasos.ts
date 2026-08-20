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
  const osm = red.nombreDeWay.get(way);
  if (osm !== undefined) {
    return { nombre: osm, conNombre: true, esMunicipal: false };
  }
  if (!NARRAN_SIEMPRE_POR_TIPO.has(perfil)) {
    const heredado = red.nombreHeredado.get(way);
    if (heredado !== undefined) {
      return { nombre: heredado, conNombre: true, esMunicipal: true };
    }
  }
  return {
    nombre: nombreGenerico(perfil, red.tipoDeWay.get(way)),
    conNombre: false,
    esMunicipal: false,
  };
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

/**
 * Un tramo: una o más aristas seguidas del mismo *way*, **ya con su nombre
 * puesto**.
 *
 * La denominación se resuelve aquí y no más tarde porque a partir de la unión
 * puede **cambiar**: cuando dos grafías de la misma calle se juntan, gana la
 * municipal (`canonico`), y eso hay que poder escribirlo en el tramo.
 */
interface Tramo extends Denominacion {
  readonly way: number;
  readonly perfil: string;
  readonly metros: number;
  readonly g: readonly Punto[];
}

/** La forma mutable con la que se agrupa y se une. */
type TramoEnObra = {
  way: number;
  perfil: string;
  metros: number;
  g: Punto[];
  nombre: string;
  conNombre: boolean;
  esMunicipal: boolean;
};

/** Junta las aristas consecutivas que comparten `w`. */
function agrupar(red: RedEnMemoria, trozos: readonly TrozoDeRuta[]): readonly Tramo[] {
  const tramos: TramoEnObra[] = [];
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
      ...comoSeLlama(red, arista.way, arista.perfil),
    });
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
      (ultimo.nombre === tramo.nombre || equivalente) &&
      giroDe(rumboDeSalida(ultimo.g), rumboDeEntrada(tramo.g)) === 'recto'
    ) {
      ultimo.metros += tramo.metros;
      ultimo.g.push(...tramo.g.slice(1));
      if (equivalente) {
        const gana = canonico(ultimo, tramo);
        ultimo.nombre = gana.nombre;
        ultimo.esMunicipal = gana.esMunicipal;
      }
      continue;
    }
    unidos.push({
      way: tramo.way,
      perfil: tramo.perfil,
      metros: tramo.metros,
      g: [...tramo.g],
      nombre: tramo.nombre,
      conNombre: tramo.conNombre,
      esMunicipal: tramo.esMunicipal,
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
}

/** Lo que sobrevive a la fusión: un paso, con su giro ya combinado. */
export interface TramoFundido extends Denominacion {
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
    esMunicipal: boolean;
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
        esMunicipal: tramo.esMunicipal,
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
    // Se calcula ANTES de tocar nada: en cuanto `ultimo` cambia de nombre, ya
    // no se puede preguntar si eran equivalentes.
    const equivalente = esLaMismaCalle(ultimo, tramo);
    const esLaMisma = giro === 'recto' && (tramo.nombre === ultimo.nombre || equivalente);
    // El arranque no se funde hacia atrás porque no hay atrás: traga hacia
    // delante. Regla 5.
    const arranqueInsignificante = salen.length === 1 && ultimo.metros < UMBRAL_MICRO_M;

    if (esMicro || esLaMisma || arranqueInsignificante) {
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
        }
      }
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
      metros: tramo.metros,
      metrosPropios: tramo.metros,
      giro,
      entrada: tramo.entrada,
      salida: tramo.salida,
    });
  }

  return salen.map(({ nombre, conNombre, esMunicipal, metros, giro, entrada, salida }) => ({
    nombre,
    conNombre,
    esMunicipal,
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
  esMunicipal: boolean;
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
  // El canónico ANTES de sumar nada, que es cuando todavía se puede preguntar
  // si eran la misma calle: si lo eran, el que se escribe es el municipal.
  if (esLaMismaCalle(crece, comido)) {
    const gana = canonico(crece, comido);
    crece.nombre = gana.nombre;
    crece.esMunicipal = gana.esMunicipal;
  }
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
 * **Las salvaguardas, que es lo que hay que mirar si algún día esto miente.**
 * Un giro de verdad SE ANUNCIA: ni la regla A ni la B se aplican si el giro no
 * es suave. Y en la B no basta con que los giros sean suaves por separado —dos
 * «ligeramente a la derecha» de 30° suman una derecha de 60°—, así que se mide
 * **el ángulo combinado a través de lo que se suprime** y solo se colapsa si
 * TAMBIÉN es suave. El arranque nunca desaparece, y el último tampoco: sin
 * nadie detrás no hay ángulo combinado que comprobar, y se deja.
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
    if (esLaMismaCalle(ultimo, maniobra) && esSuave(maniobra.giro)) {
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
): readonly Paso[] {
  const tramos = unirLasQueSonLaMisma(agrupar(red, ruta.trozos));

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
  const llanos: TramoLlano[] = tramos.map((tramo) => ({
    nombre: tramo.nombre,
    conNombre: tramo.conNombre,
    esMunicipal: tramo.esMunicipal,
    metros: tramo.metros,
    entrada: rumboDeEntrada(tramo.g),
    salida: rumboDeSalida(tramo.g),
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
  const arranque: ParteDelPaso[] = [
    { papel: 'accion', texto: 'Sal de' },
    { papel: 'texto', texto: ' ' },
    { papel: 'via', texto: comoSePresenta(nombreOrigen, true, red.articulosPropios) },
    { papel: 'texto', texto: ` y dirígete hacia el ${cardinal}` },
  ];
  if (primero.conNombre) {
    arranque.push(
      { papel: 'texto', texto: ' por ' },
      {
        papel: 'via',
        texto: comoSePresenta(primero.nombre, primero.esMunicipal, red.articulosPropios),
      },
    );
  }
  pasos.push(pasoDe('salida', metrosParaLeer(primero.metros), arranque));

  // ── Un paso por cada maniobra que ha sobrevivido ─────────────────────────
  for (let k = 1; k < maniobras.length; k++) {
    const maniobra = maniobras[k]!;
    pasos.push(
      pasoDe(maniobra.giro, metrosParaLeer(maniobra.metros), [
        { papel: 'accion', texto: COMO_SE_DICE[maniobra.giro] },
        { papel: 'texto', texto: comoSeEnlaza(maniobras[k - 1], maniobra) },
        {
          // Un tramo que se narra por su tipo —«la acera»— no lleva `via`:
          // destacarlo lo haría parecer un nombre, y no lo es.
          papel: maniobra.conNombre ? 'via' : 'texto',
          texto: comoSePresenta(maniobra.nombre, maniobra.esMunicipal, red.articulosPropios),
        },
      ]),
    );
  }

  // ── El cierre: de qué lado queda la puerta ───────────────────────────────
  //
  // Se mide sobre el ÚLTIMO TRAMO DE VERDAD, no sobre la última maniobra: de
  // qué lado cae una puerta es geometría, y si el último trozo se fundió sigue
  // siendo por donde se llega.
  const ultimo = tramos[tramos.length - 1]!;
  pasos.push(
    pasoDe('llegada', 0, [
      { papel: 'via', texto: comoSePresenta(nombreDestino, true, red.articulosPropios) },
      { papel: 'texto', texto: ` está a la ${ladoDelDestino(ultimo.g, puertaDestino)}` },
    ]),
  );

  return pasos;
}
