/**
 * LOS APARCABICIS: dónde se deja la bici propia, y cómo se dice dónde está.
 *
 * Es la otra mitad del modo BICI. Las estaciones de § 1.8 son la bici pública;
 * esto son los **2.158 soportes municipales** donde dejar la tuya, con su tipo,
 * su vía y su número de anclajes (§ 1.9 del notices, capa
 * `movilidad:MU2_aparcabicis` del WFS de IDEZar).
 *
 * ── Por qué existe: la ruta no acaba pedaleando en la puerta ────────────────
 *
 * [DOC OpenTripPlanner, `BICYCLE_PARK`] su modo de bici propia *«deja la
 * bicicleta y anda hasta el destino»*, y su capa de *vehicle parking* de OTP 2
 * pide justo estos tres requisitos: **aparcamientos con capacidad declarada**,
 * **entradas enganchadas a la red** y **filtro por disponibilidad**. Los dos
 * primeros los cumple este dato; el tercero **no se puede cumplir y se dice**:
 * § 1.9 es un inventario ESTÁTICO, no trae huecos libres en vivo, y prometer
 * sitio sería inventarlo.
 *
 * ── ⭐ QUÉ ENTRA, y por qué el «Cerrado» se queda fuera ─────────────────────
 *
 * El campo `tipo_aparcamiento` reparte los 2.158 así, contado sobre el fichero:
 *
 * | estado | puntos | anclajes | |
 * |---|---|---|---|
 * | `Abierto` | 1.906 | 11.895 | ✅ entra |
 * | `Cerrado` | 238 | 2.404 | ❌ fuera |
 * | `Vigilado` | 8 | 222 | ✅ entra |
 * | `Sin servicio` | 2 | 10 | ❌ fuera |
 * | `Proyecto` | 4 | 13 | ❌ fuera |
 *
 * `Proyecto` y `Sin servicio` se caen solos: uno no existe todavía y el otro no
 * funciona. `Vigilado` entra porque es un aparcamiento mejor, no peor.
 *
 * ⚠️ **`Cerrado` fuera es [PROPIO], y por el lado seguro.** La capa no publica
 * qué significa: puede ser «cerrado al público» —clausurado— o «cerrado» como
 * forma del soporte, un módulo con cerramiento frente a las U invertidas. **La
 * semántica NO CONSTA**, y son 238 puntos con 2.404 anclajes. Mandar a alguien
 * a dejar la bici en un sitio que a lo mejor está clausurado es peor que
 * mandarlo doscientos metros más allá.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { CallejeroEnMemoria } from './callejero.ts';
import { normalizar } from './callejero.ts';
import { dentroDelEntorno, type Entorno } from './gacetero.ts';
import { metrosEntre } from './cercano.ts';

/** El dato vive en `app/data/`, como el resto del municipal que sirve la app. */
const FICHERO = fileURLToPath(
  new URL('../../app/data/2026-08-17_wfs_movilidad-MU2_aparcabicis.json', import.meta.url),
);

/**
 * ⭐ LOS ESTADOS QUE ENTRAN. Ver la cabecera para el porqué de cada uno y, en
 * particular, para el de los 238 «Cerrado» que se quedan fuera.
 */
export const ESTADOS_QUE_ENTRAN: ReadonlySet<string> = new Set(['Abierto', 'Vigilado']);

/** Un rasgo del WFS, de lo que aquí se mira. */
interface RasgoCrudo {
  readonly geometry: { readonly type: string; readonly coordinates: readonly number[] } | null;
  readonly properties: {
    readonly tipo_aparcamiento: string;
    readonly anclajes: number | null;
    readonly tipo_via: string;
    readonly nombre_reducido: string;
  };
}

/** Un aparcabicis donde de verdad se puede dejar la bici. */
export interface Aparcabici {
  readonly lon: number;
  readonly lat: number;
  /**
   * Cuántos anclajes tiene. **Es capacidad, no disponibilidad**: dice cuántas
   * bicis caben, no cuántos huecos quedan. La narración lo dice con esas
   * palabras a propósito.
   */
  readonly anclajes: number;
  /**
   * Cómo se dice dónde está: «AVENIDA LOGROÑO [CASETAS]». Sale del callejero
   * municipal cuando la vía casa, y del propio dato cuando no. Ver `nombreDe`.
   */
  readonly via: string;
  /** Si el nombre viene del callejero (`true`) o del `nombre_reducido` del dato. */
  readonly viaDelCallejero: boolean;
}

export interface AparcabicisEnMemoria {
  /** Los 2.158 del fichero, entren o no. */
  readonly total: number;
  /** Los que entran, ya filtrados y con coordenada sana. */
  readonly entrantes: readonly Aparcabici[];
  /** Cuántos hay de cada `tipo_aparcamiento`, para poder declararlo al arrancar. */
  readonly porEstado: ReadonlyMap<string, number>;
  /** Anclajes que suman los entrantes. */
  readonly anclajes: number;
  /** De los entrantes, cuántos han podido nombrar su vía con el callejero. */
  readonly conViaDelCallejero: number;
  /** ⚠️ Los que se caen por la regla B o por la frontera. Tiene que ser bajo. */
  readonly sinCoordenada: number;
  readonly fueraDelEntorno: number;
  readonly cargadoEnMs: number;
}

/**
 * ⭐ CÓMO SE NOMBRA LA VÍA DE UN APARCABICIS, y por qué hacen falta dos vueltas.
 *
 * El dato trae `tipo_via` con el **mismo código de dos letras que el callejero**
 * (`AV`, `CL`, `PS`, `AN`…) y `nombre_reducido`, que es el nombre **sin la
 * palabra del tipo**: «LOGROÑO  ---CST» donde el callejero dice «AVENIDA
 * LOGROÑO ---CST».
 *
 * Se busca en el callejero por las dos formas —el nombre entero y el nombre sin
 * su primera palabra— porque el reducido a veces conserva el tipo y a veces no.
 * **Casan 2.060 de los 2.158, el 95,5 %**, medido sobre el fichero.
 *
 * Los 98 que no casan son el campo haciendo honor a su nombre: vienen
 * **abreviados** —«MTRIO. N. S. LOS ÁNGELES», «SAN JUAN B. DE LA SALLE», «J. L.
 * NATIVIDAD CEBRIÁN»—. Ahí **se usa el reducido tal cual**: es el dato, se lee,
 * y desabreviarlo sería inventárselo — la misma regla que `comoSePresenta`
 * aplica al `NTRA. SRA.` del censo.
 */
function nombreDe(
  indice: ReadonlyMap<string, string>,
  tipo: string,
  reducido: string,
): { via: string; delCallejero: boolean } {
  const norma = normalizar(reducido).replace(/\s+/g, ' ');
  const entero = indice.get(tipo + '|' + norma);
  if (entero !== undefined) {
    return { via: entero, delCallejero: true };
  }
  return { via: reducido.replace(/\s+/g, ' ').trim(), delCallejero: false };
}

/** Cómo se nombra una vía del callejero: «AVENIDA LOGROÑO [CASETAS]». */
function comoSeLee(limpio: string, nucleo: string | null): string {
  return nucleo ? `${limpio} [${nucleo}]` : limpio;
}

/**
 * Carga el inventario, lo filtra y le pone nombre a cada uno.
 *
 * El `entorno` es el mismo rectángulo del gacetero —los cuatro extremos de los
 * 46.150 portales con su margen—, y se aplica por la misma razón: **una
 * coordenada publicada no se cree, se comprueba** (§ el centro de salud en
 * Portugal). Que hoy no caiga ninguno no lo hace decorativo: lo hace vigilado.
 */
export function cargarAparcabicis(
  callejero: CallejeroEnMemoria,
  entorno: Entorno,
): AparcabicisEnMemoria {
  const principio = performance.now();
  const crudo = JSON.parse(readFileSync(FICHERO, 'utf8')) as {
    readonly features: readonly RasgoCrudo[];
  };

  // El índice del callejero, por tipo y por las dos formas del nombre.
  const indice = new Map<string, string>();
  for (const { via } of callejero.sugeribles) {
    const legible = comoSeLee(via.limpio, via.nucleo);
    const norma = normalizar(via.nombre).replace(/\s+/g, ' ');
    const clave = via.tipo + '|' + norma;
    if (!indice.has(clave)) {
      indice.set(clave, legible);
    }
    // Y sin la palabra del tipo, que es la forma en la que viene el reducido.
    const sinTipo = norma.split(' ').slice(1).join(' ');
    const claveCorta = via.tipo + '|' + sinTipo;
    if (sinTipo !== '' && !indice.has(claveCorta)) {
      indice.set(claveCorta, legible);
    }
  }

  const entrantes: Aparcabici[] = [];
  const porEstado = new Map<string, number>();
  let anclajes = 0;
  let conViaDelCallejero = 0;
  let sinCoordenada = 0;
  let fueraDelEntorno = 0;

  for (const rasgo of crudo.features) {
    const p = rasgo.properties;
    porEstado.set(p.tipo_aparcamiento, (porEstado.get(p.tipo_aparcamiento) ?? 0) + 1);
    if (!ESTADOS_QUE_ENTRAN.has(p.tipo_aparcamiento)) {
      continue;
    }
    // Regla B: sin coordenada no existe. Y sin anclajes tampoco se puede
    // narrar el hito, así que el `null` del único rasgo que lo trae vale 0 y
    // se cuenta como lo que es — pero el punto sigue sirviendo para aparcar.
    const c = rasgo.geometry?.coordinates;
    if (!c || c.length < 2 || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) {
      sinCoordenada++;
      continue;
    }
    const lon = c[0]!;
    const lat = c[1]!;
    if (!dentroDelEntorno(entorno, lon, lat)) {
      fueraDelEntorno++;
      continue;
    }
    const { via, delCallejero } = nombreDe(indice, p.tipo_via, p.nombre_reducido);
    if (delCallejero) {
      conViaDelCallejero++;
    }
    const cuantos = p.anclajes ?? 0;
    anclajes += cuantos;
    entrantes.push({ lon, lat, anclajes: cuantos, via, viaDelCallejero: delCallejero });
  }

  return {
    total: crudo.features.length,
    entrantes,
    porEstado,
    anclajes,
    conViaDelCallejero,
    sinCoordenada,
    fueraDelEntorno,
    cargadoEnMs: performance.now() - principio,
  };
}

/**
 * ⭐ LOS APARCABICIS MÁS CERCANOS A UN PUNTO, en orden.
 *
 * Es el patrón de `portalCercano` del punto 8: **haversine sobre la lista
 * entera**, sin índice espacial. Son 1.914 puntos y el barrido cuesta lo que
 * cuesta recorrer un array de 1.914 posiciones; montar una rejilla para eso
 * costaría más de lo que ahorra, igual que con los 46.150 portales.
 *
 * Devuelve **varios y no uno** porque el más cercano en línea recta puede no
 * ser el más cercano por la red, o puede estar al otro lado de un río. Quien
 * compone la ruta prueba en orden y se queda con el primero que da camino; ver
 * `CANDIDATOS` en `etapas.ts`.
 */
export function aparcabicisCercanos(
  inventario: AparcabicisEnMemoria,
  lon: number,
  lat: number,
  cuantos: number,
): readonly Aparcabici[] {
  return [...inventario.entrantes]
    .map((a) => ({ a, m: metrosEntre(lat, lon, a.lat, a.lon) }))
    .sort((x, y) => x.m - y.m)
    .slice(0, cuantos)
    .map((x) => x.a);
}
