/**
 * ⭐ DÓNDE SE DEJA EL COCHE (3/09, punto 12 casilla 2): los tres montones.
 *
 * Es la pieza que le falta al *car-to-park* [DOC OTP2: *«conducir al
 * aparcamiento y andar el resto»*]. No rutea nada — eso es `viaje-coche.ts`—:
 * lee los dos censos municipales que ya están en el repositorio, los reparte en
 * los tres montones del contrato, y sabe decir cuáles quedan cerca de un punto.
 *
 * ── Los tres montones, y de qué campo sale cada uno ─────────────────────────
 *
 * | contrato | dato | filtro | cuántos |
 * |---|---|---|---|
 * | `regulado` | § 1.11, tramos de bordillo | `tipo_actual` ∈ {ESRO, ESRE} | 664 + 495 |
 * | `gratuito` | § 1.11, los mismos | `tipo_actual` = LIBRE | 6.204 |
 * | `discapacitado` | § 1.13, reservas | `TIPO` = `14_PMR` | 1.226 |
 *
 * 🚨 **LOS DOS FILTROS SON LOS QUE SON, y las dos fichas explican por qué.**
 *
 * En § 1.11 manda **`tipo_actual`** y no `zona_reguladora`: ese segundo campo es
 * un perímetro geográfico y **5.049 bordillos LIBRES lo llevan**, así que quien
 * filtre por él manda a pagar donde no se paga.
 *
 * En § 1.13 manda **`TIPO`** y no `SUBTIPO`: **1.384 registros dicen
 * `SUBTIPO: 'PMR general'` y solo 1.224 están en vigor** — los otros 158 son
 * reservas RETIRADAS o DENEGADAS. Mandar a alguien con tarjeta PMR a 158 plazas
 * que no existen es el error más caro que este fichero puede cometer, porque le
 * toca a quien menos puede permitirse el viaje en balde.
 *
 * ⚠️ **Y LOS 28 SIN CLASIFICAR NO ESTÁN EN NINGÚN MONTÓN.** El censo no dice qué
 *    son. No se les puede llamar gratuitos —«donde no hay regulado hay
 *    gratuito» vale para lo que el dato clasifica, no para lo que calla— ni
 *    regulados. Se cuentan, se declaran, y se quedan fuera.
 *
 * ── Lo que el dato NO da, no se dice ────────────────────────────────────────
 *
 * § 1.11 **no trae tarifa ni horario**: sus campos son `tipo_actual`,
 * `direccion`, `portal`, `forma_estacionar`, `longitud`, `plazas`,
 * `zona_reguladora`, `distrito`, `codigo` y `tipo_via`, y ninguno es un precio
 * ni una franja. Así que el paso dice «zona azul (rotación)» y **se calla lo
 * que costaría**, que es lo único honrado que se puede decir.
 *
 * El horario de las PMR sí viene, y viene sucio: **104 formas distintas** entre
 * las 1.226 —`PERMANENTE`, `Permanente`, `permanente`, `0-24`, `0-24 H.`,
 * `0 - 24`, `n/a`, `VER OBSERVACIONES`, `07,30 a 22,30`—. Se enseña **tal cual
 * viene**. Normalizarlo sería interpretar 104 cadenas que nadie ha auditado.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TipoDeAparcamiento } from '@desplazame/tipos';
import { metrosEntre } from './cercano.ts';
import { aPlano } from './proyeccion.ts';

/** Los dos ficheros viven en `app/data/`, como el resto del dato municipal. */
const TRAMOS = fileURLToPath(
  new URL('../../app/data/2026-08-18_wfs_movilidad-MU1_estacionamientos_calle.json', import.meta.url),
);
const RESERVAS = fileURLToPath(
  new URL('../../app/data/2026-08-18_wfs_movilidad-MU1_reservas.json', import.meta.url),
);

/** Un punto en `[lon, lat]`, como el resto de la casa. */
type Punto = readonly [number, number];

/** Las tres clases que el censo de § 1.11 sí clasifica. */
export type ClaseDeTramo = 'ESRO' | 'ESRE' | 'LIBRE';

/** ⭐ El filtro de § 1.13, y no `SUBTIPO`. Ver la cabecera. */
export const TIPO_PMR = '14_PMR';

/** Un tramo de bordillo del censo de estacionamiento en calzada (§ 1.11). */
export interface TramoDeAparcamiento {
  /** El `id` del WFS: `MU1_estacionamientos_calle.44455`. Se cita, no se compone. */
  readonly id: string;
  readonly clase: ClaseDeTramo;
  readonly direccion: string | null;
  readonly portal: string | null;
  readonly plazas: number | null;
  /** La polilínea del bordillo, en `[lon, lat]`. p50 dos vértices y 24,6 m. */
  readonly g: readonly Punto[];
}

/** Una reserva PMR del censo de reservas de espacio (§ 1.13). */
export interface PlazaPmr {
  /** El `id` del WFS: `MU1_reservas.42789`. */
  readonly id: string;
  readonly calle: string | null;
  readonly portal: string | null;
  readonly plazas: number | null;
  /** ⚠️ Texto libre en 104 formas. Se guarda **tal cual viene**. */
  readonly horario: string | null;
  readonly lon: number;
  readonly lat: number;
}

/** Los tres montones, con lo que se quedó fuera contado. */
export interface AparcamientoEnMemoria {
  /** ESRO + ESRE, en ese orden de lectura del fichero. */
  readonly regulado: readonly TramoDeAparcamiento[];
  readonly gratuito: readonly TramoDeAparcamiento[];
  readonly pmr: readonly PlazaPmr[];
  /** ⭐ Los 28 tramos con `tipo_actual` nulo. En ningún montón, y contados. */
  readonly sinClasificar: number;
  /** Las reservas del censo que no son PMR: 1.410 de taxi, hotel, retiradas… */
  readonly reservasNoPmr: number;
  readonly cargadoEnMs: number;
}

/** Lo que el WFS de tramos manda, de lo que aquí se mira. */
interface RasgoDeTramo {
  readonly id?: string;
  readonly geometry?: { readonly coordinates?: readonly (readonly Punto[])[] };
  readonly properties?: {
    readonly tipo_actual?: string | null;
    readonly direccion?: string | null;
    readonly portal?: string | null;
    readonly plazas?: number | null;
  };
}

/** Y lo que manda el de reservas. */
interface RasgoDeReserva {
  readonly id?: string;
  readonly geometry?: { readonly coordinates?: readonly number[] };
  readonly properties?: {
    readonly TIPO?: string | null;
    readonly NOMBRE_CALLE?: string | null;
    readonly PORTAL?: string | null;
    readonly PLAZAS?: number | null;
    readonly HORARIO?: string | null;
  };
}

const REGULADAS: ReadonlySet<string> = new Set(['ESRO', 'ESRE']);

/** Lee los dos censos y los reparte. **Una vez**, al arrancar. */
export function cargarAparcamiento(): AparcamientoEnMemoria {
  const principio = performance.now();

  const tramos = JSON.parse(readFileSync(TRAMOS, 'utf8')) as {
    readonly features?: readonly RasgoDeTramo[];
  };
  const regulado: TramoDeAparcamiento[] = [];
  const gratuito: TramoDeAparcamiento[] = [];
  let sinClasificar = 0;
  for (const rasgo of tramos.features ?? []) {
    const clase = rasgo.properties?.tipo_actual ?? null;
    // Una parte por MultiLineString en los 7.391, medido. Se toma la primera y
    // se comprueba: un tramo sin geometría no es un sitio donde dejar el coche.
    const g = rasgo.geometry?.coordinates?.[0];
    if (clase === null || clase === undefined || !g || g.length < 1 || !rasgo.id) {
      // ⭐ Los 28 sin clasificar caen aquí y NO se reparten. Ver la cabecera.
      sinClasificar++;
      continue;
    }
    if (clase !== 'ESRO' && clase !== 'ESRE' && clase !== 'LIBRE') {
      // Una clase que el censo no tenía el 18/08. No se adivina de qué montón
      // es: se cuenta con los que se quedan fuera y se declara.
      sinClasificar++;
      continue;
    }
    const tramo: TramoDeAparcamiento = {
      id: rasgo.id,
      clase,
      direccion: rasgo.properties?.direccion ?? null,
      portal: rasgo.properties?.portal ?? null,
      plazas: rasgo.properties?.plazas ?? null,
      g: g.map((p) => [p[0], p[1]] as Punto),
    };
    (REGULADAS.has(clase) ? regulado : gratuito).push(tramo);
  }

  const reservas = JSON.parse(readFileSync(RESERVAS, 'utf8')) as {
    readonly features?: readonly RasgoDeReserva[];
  };
  const pmr: PlazaPmr[] = [];
  let reservasNoPmr = 0;
  for (const rasgo of reservas.features ?? []) {
    const c = rasgo.geometry?.coordinates;
    if (rasgo.properties?.TIPO !== TIPO_PMR || !c || c.length < 2 || !rasgo.id) {
      reservasNoPmr++;
      continue;
    }
    pmr.push({
      id: rasgo.id,
      calle: rasgo.properties.NOMBRE_CALLE ?? null,
      portal: rasgo.properties.PORTAL ?? null,
      plazas: rasgo.properties.PLAZAS ?? null,
      horario: rasgo.properties.HORARIO ?? null,
      lon: c[0]!,
      lat: c[1]!,
    });
  }

  return {
    regulado,
    gratuito,
    pmr,
    sinClasificar,
    reservasNoPmr,
    cargadoEnMs: performance.now() - principio,
  };
}

/**
 * ⭐ EL INVENTARIO SERVIDO, como la red del coche: **una copia por proceso**.
 *
 * Se carga la primera vez que alguien lo pide y se queda. Va en una variable de
 * módulo y no dentro de `Motor` por lo mismo que la red del coche: solo lo mira
 * un modo, y meterlo dentro obligaría a que cada juez del peatón levantara dos
 * ficheros de censo para poder construir su motor de mentira.
 */
let servido: AparcamientoEnMemoria | null = null;

export function elAparcamiento(): AparcamientoEnMemoria {
  servido ??= cargarAparcamiento();
  return servido;
}

/**
 * ⭐ UN SITIO DONDE DEJAR EL COCHE, ya reducido a un punto y una frase.
 *
 * Los tramos **son la calle** y las plazas PMR son puntos junto a ella [DOC OTP
 * P+R: entrada conducible y salida andable conectadas], así que los dos acaban
 * en lo mismo: un punto al que se conduce y del que se anda.
 */
export interface DondeAparcar {
  /** El `id` del WFS del que sale. Es lo que las jueces citan. */
  readonly id: string;
  readonly tipo: TipoDeAparcamiento;
  readonly lon: number;
  readonly lat: number;
  /** La calle, tal como el censo municipal la escribe. Puede faltar. */
  readonly via: string | null;
  /**
   * Lo que el dato dice de este sitio, **sin interpretar**: la clase del
   * regulado, el horario literal de la PMR, o nada en el gratuito.
   */
  readonly detalle: string;
  /**
   * Metros en línea recta al punto que se pidió. **Solo para podar y para
   * poder declararlo**: lo que decide es el coste, no esto.
   */
  readonly enRecta: number;
}

/**
 * El punto de una polilínea más cercano a `(lon, lat)`, y a cuántos metros.
 *
 * Se proyecta sobre cada segmento en el plano local de la casa —a escala de
 * manzana la Tierra es plana, ver `proyeccion.ts`— y el parámetro sale igual en
 * el plano que en grados, porque la proyección es lineal en los dos ejes.
 */
export function puntoMasCercanoDeLaLinea(
  g: readonly Punto[],
  lon: number,
  lat: number,
): { readonly lon: number; readonly lat: number } {
  const primero = g[0]!;
  if (g.length === 1) {
    return { lon: primero[0], lat: primero[1] };
  }
  const [px, py] = aPlano(lon, lat);
  let mejor: Punto = primero;
  let mejorM = Infinity;
  for (let k = 0; k + 1 < g.length; k++) {
    const a = g[k]!;
    const b = g[k + 1]!;
    const [ax, ay] = aPlano(a[0], a[1]);
    const [bx, by] = aPlano(b[0], b[1]);
    const abx = bx - ax;
    const aby = by - ay;
    const largo2 = abx * abx + aby * aby;
    // El parámetro, recortado a [0,1]: el punto tiene que caer DENTRO del
    // segmento y no en su prolongación. Es la misma cuenta que `enganchar`.
    const t =
      largo2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * abx + (py - ay) * aby) / largo2));
    const m = Math.hypot(px - (ax + t * abx), py - (ay + t * aby));
    if (m < mejorM) {
      mejorM = m;
      // ⭐ Y se vuelve a GRADOS con el mismo `t`: la proyección de la casa es
      // lineal en los dos ejes, así que el parámetro vale igual en el plano y
      // en grados. Interpolar aquí evita tener que invertir la proyección.
      mejor = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    }
  }
  return { lon: mejor[0], lat: mejor[1] };
}

/**
 * Cómo se lee un tramo regulado o gratuito en el paso del hito.
 *
 * ⭐ **ZONA AZUL Y ZONA NARANJA, y la palabra no es nuestra: es la del
 * reglamento** (4/09). El Reglamento Municipal del Servicio de Estacionamiento
 * Regulado —el vigente, `zaragoza.es/sede/servicio/normativa/13291`— escribe la
 * equivalencia él mismo, literal:
 *
 *   *«los sectores ESRE ("zona naranja") como en los de rotación, ESRO ("zona
 *   azul")»*
 *
 * Así que lo que la gente dice **y** lo que la norma dice son lo mismo, y no
 * hay que elegir entre hablar claro y ser fiel.
 *
 * ⚠️ **Y la sigla se va de la frase.** Encabezaba —«zona regulada (ESRO)»— y
 *    eso obligaba a quien aparca a traducir un código del censo para entender
 *    de qué acera se le habla. La sigla sigue viva donde tiene sentido: en el
 *    `tipo_actual` del dato, en `ClaseDeTramo`, en la cabecera de este fichero y
 *    en el arranque del motor. En el paso, lo que se lee es la calle.
 *
 * ⚠️ Ni tarifa ni franja: el censo NO las trae. Ver la cabecera.
 */
function detalleDelTramo(clase: ClaseDeTramo): string {
  if (clase === 'ESRO') {
    return 'zona azul (rotación)';
  }
  if (clase === 'ESRE') {
    return 'zona naranja (residentes)';
  }
  // ⏳ La palabra del gratuito se afina en la demo: lo que el dato dice es que
  // ese bordillo no está regulado, no que aparcar allí sea gratis para siempre.
  return 'estacionamiento sin regulación';
}

/** Y una plaza PMR, con su horario **literal**. */
function detalleDeLaPmr(horario: string | null): string {
  const limpio = (horario ?? '').trim();
  if (limpio === '') {
    return 'plaza PMR (el censo no dice su horario)';
  }
  // Recortado y nada más: 104 formas distintas, ninguna interpretada.
  const corto = limpio.length > 40 ? `${limpio.slice(0, 39)}…` : limpio;
  return `plaza PMR (horario: ${corto})`;
}

/**
 * ⭐ LOS CANDIDATOS: los `cuantos` sitios de ese tipo más cercanos EN RECTA.
 *
 * ⚠️ **La recta solo PODA, y el número es de RENDIMIENTO.** No es un radio: no
 *    hay ninguna distancia a partir de la cual un aparcamiento «no existe».
 *    Quien elige es el coste —conducir más andar por su peso—, y esta lista
 *    solo evita hacer ese cálculo 6.204 veces. Es exactamente el papel que los
 *    40 postes candidatos tienen en el bus desde el 31/08, y por la misma
 *    razón: cada candidato cuesta un Dijkstra del peatón.
 */
export function dondeAparcarCerca(
  inventario: AparcamientoEnMemoria,
  tipo: TipoDeAparcamiento,
  lon: number,
  lat: number,
  cuantos: number,
): readonly DondeAparcar[] {
  if (tipo === 'discapacitado') {
    return [...inventario.pmr]
      .map((p) => ({ p, m: metrosEntre(lat, lon, p.lat, p.lon) }))
      .sort((a, b) => a.m - b.m)
      .slice(0, cuantos)
      .map(({ p, m }) => ({
        id: p.id,
        tipo,
        lon: p.lon,
        lat: p.lat,
        via: p.calle,
        detalle: detalleDeLaPmr(p.horario),
        enRecta: m,
      }));
  }
  const monton = tipo === 'regulado' ? inventario.regulado : inventario.gratuito;
  return monton
    .map((t) => {
      const q = puntoMasCercanoDeLaLinea(t.g, lon, lat);
      return { t, q, m: metrosEntre(lat, lon, q.lat, q.lon) };
    })
    .sort((a, b) => a.m - b.m)
    .slice(0, cuantos)
    .map(({ t, q, m }) => ({
      id: t.id,
      tipo,
      lon: q.lon,
      lat: q.lat,
      via: t.direccion,
      detalle: detalleDelTramo(t.clase),
      enRecta: m,
    }));
}
