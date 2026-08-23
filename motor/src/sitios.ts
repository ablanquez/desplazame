/**
 * LOS SITIOS: los destinos que se eligen por su NOMBRE y no por su portal.
 *
 * Un sitio es una **capa aparte** en la búsqueda. [DOC Pelias] su modelo lo
 * separa así —`layers`, y `venue` es la de los establecimientos—: una calle y
 * un local no son la misma clase de cosa aunque los dos se escriban en la
 * misma casilla. Aquí vale igual: el autocompletar del destino ofrece vías y
 * sitios, y quien mira sabe cuál es cuál.
 *
 * [DOC Nominatim] Y geocodificar no es enrutar: son dos oficios. Este fichero
 * hace el primero —de un texto a un punto— y ahí se acaba su trabajo. Del
 * punto en adelante manda el tubo del punto 7, el mismo por el que entra un
 * portal: la rejilla lo engancha a la red, el Dijkstra lo une y `pasos.ts` lo
 * escribe. **No hay un camino especial para los sitios**, y eso es lo que hace
 * que estrenar una categoría nueva sea cargar un fichero más.
 *
 * ── ⭐ LA REGLA B: sin coordenada no existe ─────────────────────────────────
 *
 * De las 313 farmacias, **3 no traen punto**. No entran al índice de
 * sugerencias y **no se pueden elegir**: un destino que no se sabe dónde está
 * no se puede enrutar, y ofrecerlo sería prometer una ruta que va a acabar en
 * un aviso. Es lo que hace un geocodificador — [DOC Pelias] indexa *venues*
 * con su punto, y sin punto no hay documento que indexar.
 *
 * **Pero no se borran ni se editan**: siguen en el fichero, se cuentan aquí y
 * el motor las declara al arrancar. La ausencia se dice; el dato no se toca.
 *
 * ── 🔒 Y el titular no sale de aquí ────────────────────────────────────────
 *
 * 274 de los 313 títulos traen el nombre de la persona titular. Es dato
 * registral abierto, pero republicarlo no hace falta para nada de lo que esta
 * pantalla hace. Así que **el `title` del dato no se usa para presentar**: la
 * presentación se compone con la categoría y la dirección, y el título con el
 * nombre se queda en el fichero, sin salir a la sugerencia, ni al paso de la
 * ruta, ni al log. Es el patrón de § 1.3: el dato entra como vino y quien lo
 * presenta decide qué se lee.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Sitio } from '@desplazame/tipos';
import { normalizar } from './callejero.ts';
import { metrosPlanos } from './proyeccion.ts';

/** El fichero de farmacias. Vive en `app/data/`, con su ficha en § 1.16. */
const FARMACIAS = fileURLToPath(
  new URL('../../app/data/2026-08-23_zgzapi_equipamiento-farmacias.json', import.meta.url),
);

/**
 * Cuántas sugerencias como mucho. [DOC Pelias] Su `size` por defecto es **10**,
 * y es el mismo número que ya usa el autocompletar de vías: una lista más larga
 * no se lee, se abandona.
 */
export const LIMITE_SITIOS = 10;

/** Desde cuántas letras se busca. El mismo mínimo que `/api/vias`. */
export const MINIMO_SITIOS = 2;

/**
 * Lo que el fichero de equipamientos trae por registro, de lo que aquí se mira.
 *
 * `title` está declarado y **a propósito no se lee**: es el campo que puede
 * llevar el nombre del titular. Se deja escrito para que quede claro que se
 * conoce y que la decisión de no usarlo es una decisión, no un descuido.
 */
interface EquipamientoCrudo {
  readonly id: number;
  readonly title?: string;
  readonly calle?: string;
  readonly geometry?: { readonly type: string; readonly coordinates?: readonly number[] };
}

/** Un sitio con su punto, listo para engancharlo a la red. */
export interface SitioSituado {
  /** `Farmacias.8691`, con el mismo patrón que `Portales.96724`. */
  readonly codigo: string;
  /** Lo que se lee en pantalla: «Farmacia · Avda. de Navarra, 65». */
  readonly presentacion: string;
  /** La categoría sola, para poder agrupar el día que haya varias. */
  readonly categoria: string;
  /** La dirección, tal y como la publica el Ayuntamiento. */
  readonly calle: string;
  readonly lat: number;
  readonly lon: number;
  /**
   * Los DOS campos contra los que se casa, ya normalizados: el nombre y la
   * calle, por separado y no pegados.
   *
   * Pegados eran uno solo —la presentación entera— y por eso «farmacia bretón»
   * no encontraba nada: entre las dos palabras que se escriben hay un «· C/
   * Tomás » que nadie teclea. Separados, cada palabra busca en los dos.
   */
  readonly comparableNombre: string;
  readonly comparableCalle: string;
  /**
   * Los mismos dos campos partidos en PALABRAS, para puntuar la relevancia.
   *
   * Se guardan hechos porque puntuar recorre las 310 en cada tecla, y partir
   * una cadena 620 veces por pulsación es trabajo que no cambia nunca: las
   * palabras de una farmacia son las mismas toda la vida del proceso.
   */
  readonly palabrasNombre: readonly string[];
  readonly palabrasCalle: readonly string[];
}

export interface SitiosEnMemoria {
  /** Cuántos trae el fichero. */
  readonly total: number;
  /** Cuántos tienen punto: los únicos que se pueden elegir. */
  readonly conCoordenada: number;
  /** Cuántos no lo tienen. Se cuentan y se declaran; no se sugieren. */
  readonly sinCoordenada: number;
  /** El índice de sugerencias. **Solo los que tienen punto** — regla B. */
  readonly indice: readonly SitioSituado[];
  /** Los mismos objetos, por su código. */
  readonly donde: ReadonlyMap<string, SitioSituado>;
  readonly cargadoEnMs: number;
}

/** La categoría de este fichero. Cuando haya varias, vendrá de una tabla. */
const CATEGORIA = 'Farmacia';

export function cargarSitios(): SitiosEnMemoria {
  const principio = performance.now();

  const crudo = JSON.parse(readFileSync(FARMACIAS, 'utf8')) as {
    readonly equipamiento?: readonly EquipamientoCrudo[];
  };
  const registros = crudo.equipamiento ?? [];

  const indice: SitioSituado[] = [];
  const donde = new Map<string, SitioSituado>();
  let sinCoordenada = 0;

  for (const r of registros) {
    const c = r.geometry?.coordinates;
    // ⭐ REGLA B. El fichero da `[lon, lat]`, como todo GeoJSON.
    if (!c || c.length < 2 || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) {
      sinCoordenada++;
      continue;
    }
    // La dirección viene ya presentable del Ayuntamiento —«C/ Tomás Bretón,
    // 36»—, así que no se reescribe: presentarla de otra manera sería editar el
    // dato. Si faltara, se dice.
    const calle = (r.calle ?? '').trim() || 'NO CONSTA';
    const presentacion = `${CATEGORIA} · ${calle}`;
    const sitio: SitioSituado = {
      codigo: `Farmacias.${r.id}`,
      presentacion,
      categoria: CATEGORIA,
      calle,
      lon: c[0]!,
      lat: c[1]!,
      comparableNombre: normalizar(CATEGORIA),
      comparableCalle: normalizar(calle),
      palabrasNombre: enPalabras(normalizar(CATEGORIA)),
      palabrasCalle: enPalabras(normalizar(calle)),
    };
    indice.push(sitio);
    donde.set(sitio.codigo, sitio);
  }

  return {
    total: registros.length,
    conCoordenada: indice.length,
    sinCoordenada,
    indice,
    donde,
    cargadoEnMs: performance.now() - principio,
  };
}

/**
 * Un texto partido en palabras: **por lo que no es letra ni número**.
 *
 * `\s+` no basta aquí. Una dirección viene con comas, barras y puntos —«C/
 * Doña Blanca de Navarra, 46-48»— y si «navarra,» se queda con la coma pegada,
 * entonces «navarra» no es la palabra entera y la puntuación decide el orden.
 *
 * Se exporta para que las pruebas puedan fabricar sitios de laboratorio **con
 * el mismo troceador que usa el índice de verdad**, en vez de con una copia
 * que se quedaría atrás en cuanto esto cambiara.
 */
export function enPalabras(texto: string): readonly string[] {
  return texto.split(/[^a-z0-9ñç]+/).filter((p) => p !== '');
}

/**
 * ⭐ CUÁNTO EXPLICA una palabra escrita a un campo. De mejor a peor.
 *
 * [DOC Pelias] Su constructor de consultas no puntúa igual una coincidencia
 * completa que una parcial: da más peso a lo que casa entero y menos a lo que
 * casa a trozos. Esta es esa idea con lo que aquí hay.
 *
 * La escala mira PALABRAS del campo, no la cadena entera, y ese es el detalle
 * que la hace útil: las direcciones vienen con el tipo delante —«C/ …», «Avda.
 * …»—, así que ningún campo empieza nunca por lo que la gente escribe. Contra
 * la cadena entera todo sería `DENTRO` y la escala no separaría nada.
 */
const EXACTA = 3;
const EMPIEZA_PALABRA = 2;
const DENTRO = 1;
const NADA = 0;

function cuantoExplica(palabrasDelCampo: readonly string[], escrita: string): number {
  let mejor = NADA;
  for (const palabra of palabrasDelCampo) {
    if (palabra === escrita) {
      // No hay nada mejor: se puede parar.
      return EXACTA;
    }
    if (palabra.startsWith(escrita)) {
      mejor = Math.max(mejor, EMPIEZA_PALABRA);
    } else if (palabra.includes(escrita)) {
      mejor = Math.max(mejor, DENTRO);
    }
  }
  return mejor;
}

/**
 * La relevancia de un sitio para lo escrito: **la suma de lo que explica cada
 * palabra**, cada una por su mejor campo.
 *
 * Se suma y no se promedia: quien escribe dos palabras que casan las dos a la
 * perfección ha dicho más que quien acierta una. Y cada palabra elige el campo
 * que mejor la explica —nombre o calle— porque quien escribe no sabe en cuál
 * cae cada una; es la misma razón por la que casan contra los dos.
 */
function relevancia(sitio: SitioSituado, palabras: readonly string[]): number {
  let total = 0;
  for (const p of palabras) {
    total += Math.max(cuantoExplica(sitio.palabrasNombre, p), cuantoExplica(sitio.palabrasCalle, p));
  }
  return total;
}

/**
 * ⭐ EL FOCO: el otro extremo del formulario, cuando ya está resuelto.
 *
 * [DOC Pelias] `focus.point.lat`/`focus.point.lon` *«will prioritize results
 * closer to the focus point»* — prioriza, **no filtra**: lo cercano sube y lo
 * lejano sigue estando. Aquí se cumple al pie de la letra porque la distancia
 * es un criterio de DESEMPATE, no un corte: nada se cae de la lista por lejos.
 *
 * Quién es el foco no lo decide el motor: lo manda la pantalla, y es el otro
 * extremo. Buscando el destino, el foco es el origen ya elegido — que es donde
 * está quien pregunta, y por eso «la farmacia» suele querer decir «la de al
 * lado de casa» y no la primera del callejero.
 */
export interface Foco {
  readonly lon: number;
  readonly lat: number;
}

/**
 * ⭐ LAS SUGERENCIAS: la consulta se **trocea en palabras**, y todas tienen que
 * casar, cada una contra el nombre O contra la calle.
 *
 * [DOC Pelias] Su analizador no busca la frase entera en un campo: **parte la
 * consulta y casa los trozos contra varios campos** —el nombre del sitio, la
 * calle, la localidad—, y por eso encuentra escribiendo como se habla. Aquí se
 * copia esa idea con los dos campos que hay.
 *
 * El caso que lo pedía es «farmacia bretón», que es como lo escribe cualquiera.
 * Contra la presentación entera —«Farmacia · C/ Tomás Bretón, 36»— no casaba
 * **nada**: la consulta no lleva el «· C/ Tomás » que hay entre las dos
 * palabras. El fallo no era del dato ni de quien escribe; era comparar una
 * frase pegada contra otra frase pegada.
 *
 * Las dos mitades de la regla, y por qué cada una:
 *
 * · **TODAS las palabras** (`every`), no alguna. Cada palabra que se añade es
 *   una condición más: quien escribe dos quiere **menos** resultados, no más.
 *   Con «alguna», «farmacia bretón» traería las 310 farmacias, y el segundo
 *   término —el único que distingue— no serviría de nada.
 *
 * · **Contra cualquiera de los dos campos** (`some`), no contra uno fijo. Quien
 *   escribe no sabe —ni tiene por qué— cuál de sus palabras es el nombre y cuál
 *   la calle, y exigirle el orden sería pedirle que conozca la forma del dato.
 *   Por eso «bretón farmacia» da exactamente lo mismo que «farmacia bretón».
 *
 * Se casa por `includes` y no por palabra entera: escribiendo se va por la
 * mitad —«farma», «bret»— y una búsqueda que solo responde a la palabra
 * terminada no sirve para sugerir mientras se teclea.
 *
 * Por debajo de `MINIMO_SITIOS` letras devuelve vacío: eso no es una búsqueda,
 * es alguien empezando a escribir. El corte se mide sobre la consulta entera,
 * no palabra a palabra — «a b» son dos letras escritas, y traería media ciudad.
 */
export function sugerirSitios(
  sitios: SitiosEnMemoria,
  consulta: string,
  foco: Foco | null = null,
): readonly Sitio[] {
  const q = normalizar(consulta);
  if (q.length < MINIMO_SITIOS) {
    return [];
  }
  // `\s+` y no un espacio suelto: se parte por CUALQUIER blanco y por rachas
  // enteras. Un tabulador pegado desde otro sitio parte igual que un espacio,
  // y «farmacia   bretón» no deja trozos vacíos por el camino.
  //
  // Aquí hubo un `.filter((p) => p !== '')` que se quitó el 23/08: la
  // contraprueba lo mutó y las 14 pruebas siguieron verdes. No filtraba nada
  // —`normalizar` ya recorta los extremos y `\s+` se traga las rachas, así que
  // un trozo vacío no puede salir— y aunque saliera, `''` casa con todo y con
  // `every` eso es no hacer nada. El comentario que lo acompañaba decía lo
  // contrario, y era falso.
  const palabras = q.split(/\s+/);

  // PRIMERO las que casan, TODAS. El corte viene después de ordenar, y esa es
  // la corrección de fondo del 23/08: antes se cortaba a diez mientras se
  // recorría el fichero, así que las diez que salían eran las diez primeras
  // del JSON del Ayuntamiento — no las diez mejores de nada. Sondeado antes de
  // tocarlo: «far» devolvía las posiciones 0..9 del fichero y tiraba 300.
  const casan = sitios.indice.filter((s) =>
    palabras.every((p) => s.comparableNombre.includes(p) || s.comparableCalle.includes(p)),
  );

  const puntos = new Map<string, number>();
  for (const s of casan) {
    puntos.set(s.codigo, relevancia(s, palabras));
  }
  const cerca = new Map<string, number>();
  if (foco) {
    for (const s of casan) {
      cerca.set(s.codigo, metrosPlanos(foco.lon, foco.lat, s.lon, s.lat));
    }
  }

  /**
   * ⭐ EL ORDEN, por capas y en este orden:
   *
   * 1. **La lengua** [Pelias]: lo que mejor explica lo escrito, primero.
   * 2. **El foco** [Pelias focus.point], si el otro extremo está resuelto: a
   *    igualdad de lengua, lo cercano sube. Nunca por delante de la lengua —
   *    estar al lado no convierte una coincidencia peor en una mejor.
   * 3. **Alfabético** por la dirección normalizada [PROPIO]. Aquí la doctrina
   *    calla: Pelias desempata con la importancia del sitio, y **nosotros no
   *    tenemos importancia** —el dato municipal no trae ni tamaño, ni visitas,
   *    ni jerarquía, y ninguna de las 310 es «más farmacia» que otra—. El
   *    factor NO se inventa: se declara ausente y se desempata por algo que sí
   *    consta. Se compara la forma normalizada, no la original, para que el
   *    orden no dependa del ICU de quien lo ejecute.
   * 4. **Por código**, que es único. La última capa existe para que el orden
   *    sea TOTAL: sin ella, dos direcciones idénticas quedarían empatadas y el
   *    orden del fichero se colaría por el hueco. Es lo que hace que la lista
   *    no baile entre teclas.
   */
  const ordenadas = [...casan].sort((a, b) => {
    const porLengua = puntos.get(b.codigo)! - puntos.get(a.codigo)!;
    if (porLengua !== 0) {
      return porLengua;
    }
    if (foco) {
      const porCerca = cerca.get(a.codigo)! - cerca.get(b.codigo)!;
      if (porCerca !== 0) {
        return porCerca;
      }
    }
    if (a.comparableCalle !== b.comparableCalle) {
      return a.comparableCalle < b.comparableCalle ? -1 : 1;
    }
    return a.codigo < b.codigo ? -1 : 1;
  });

  return ordenadas
    .slice(0, LIMITE_SITIOS)
    .map((s) => ({ codigo: s.codigo, presentacion: s.presentacion, categoria: s.categoria }));
}
