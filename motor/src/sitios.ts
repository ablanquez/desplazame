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
  /** La presentación normalizada, para comparar sin acentos ni mayúsculas. */
  readonly comparable: string;
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
      comparable: normalizar(presentacion),
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
 * Las sugerencias para lo que se lleva escrito.
 *
 * Casa contra la **presentación entera** —categoría y dirección—, así que
 * «farmacia» las trae todas y «navarra» trae las de esa calle. Es la misma
 * comparación que el callejero: normalizada, sin acentos ni mayúsculas.
 *
 * Por debajo de `MINIMO_SITIOS` letras devuelve vacío: eso no es una búsqueda,
 * es alguien empezando a escribir.
 */
export function sugerirSitios(sitios: SitiosEnMemoria, consulta: string): readonly Sitio[] {
  const q = normalizar(consulta);
  if (q.length < MINIMO_SITIOS) {
    return [];
  }
  const salen: Sitio[] = [];
  for (const s of sitios.indice) {
    if (!s.comparable.includes(q)) {
      continue;
    }
    salen.push({ codigo: s.codigo, presentacion: s.presentacion, categoria: s.categoria });
    if (salen.length === LIMITE_SITIOS) {
      break;
    }
  }
  return salen;
}
