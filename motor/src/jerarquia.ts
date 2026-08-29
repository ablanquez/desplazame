/**
 * LA JERARQUÍA VIARIA MUNICIPAL, proyectada sobre las aristas de la red.
 *
 * Es el dato que descargó la casilla 1 del punto 9 (§ 1.22 del notices):
 * `MU1_jerarquia_viaria`, 3.644 tramos con el **límite de velocidad**, el
 * número de carriles, y las categorías que la Ordenanza usa por su nombre
 * —`pacificada`, `calle_z30`, `plataforma`, `residencia`, `carril_bus`—. Sin
 * él, la lista cerrada del art. 56.3 no se puede evaluar: dice «vías
 * pacificadas», no «vías a 30».
 *
 * ## El camino del dato, en dos saltos y ninguno inventado
 *
 * **1 · Del tramo a la vía, por `codigo`.** MU1 enumera TRAMOS («de Asalto a
 * Aznar Molina»), no vías, y sus 2.049 códigos casan **2.049 de 2.049** con el
 * callejero municipal — medido, sin un huérfano.
 *
 * **2 · De la vía a la arista, por la vecindad ya doctrinada.** Es exactamente
 * el cruce de `ejes.ts` —muestreo cada 15 m, radio 25 m, cobertura mínima del
 * 50 % y la puerta de la disputa—, el mismo que da nombre municipal a los
 * *ways* mudos desde el 20/08. No se escribe un cruce nuevo: se llama al que
 * ya está medido, y por eso este fichero no tiene geometría propia.
 *
 * ## ⚠️ LA COSTURA DEL SALTO 1: una vía puede no ser homogénea
 *
 * Y no es raro: medido sobre los 2.049 códigos, **246 tienen tramos con
 * `limite_vel` distinto** entre sí, 302 con distinto número de carriles y 185
 * con distinta `pacificada`. Proyectar «a la vía» obliga a decidir qué se hace
 * con eso, porque el dato no trae una respuesta.
 *
 * **Se toma el criterio MÁS RESTRICTIVO, campo a campo**, y no es una
 * preferencia estética: es el mismo lado seguro de `andando.ts` y de
 * `rueda.ts` —«lo que no está en la tabla, no pasa»—. En concreto:
 *
 * - `limiteKmh` es **el más bajo** de los que sus tramos declaran. Un techo
 *   que sobra no manda a nadie a ningún sitio; un techo que falta, sí.
 * - Las categorías que ABREN la calzada al patín (pacificada, zona 30, zona
 *   20, residencial, ciclo-carril, multicarril calmado) exigen que **TODOS**
 *   los tramos las lleven. Con que uno no la lleve, la vía no la tiene.
 * - Las que CIERRAN —hoy el carril bus— basta con que **UNO** la lleve.
 *
 * No se inventa ningún valor: los que salen son valores que el propio dato
 * declara, elegidos por la regla de arriba.
 *
 * ## Lo que este fichero NO hace
 *
 * No decide accesos: devuelve el dato municipal por arista y se va. Quién
 * puede entrar lo dicen las tablas de `rueda.ts` y las aplica `red-rueda.ts`.
 * Y **no toca al peatón**: nadie de su camino de código importa esto.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cargarEjes, casar } from './ejes.ts';

/** La capa municipal. Vive en `motor/data/`: no lo sirve el navegador. */
const JERARQUIA = fileURLToPath(
  new URL('../data/2026-08-28_idezar_wfs_movilidad-MU1_jerarquia_viaria.json', import.meta.url),
);

type Punto = readonly [number, number];

/** Lo que MU1 trae de cada tramo, de lo que aquí se mira. */
interface TramoCrudo {
  readonly codigo: number | null;
  readonly limite_vel: number | null;
  readonly pacificada: string | null;
  readonly calle_z30: string | null;
  readonly residencia: string | null;
  readonly plataforma: string | null;
  readonly carril_bus: number | null;
  readonly carril_vh: string | null;
  readonly observacio: string | null;
}

/**
 * Lo que la jerarquía municipal sabe de UNA vía, ya agregado por la regla del
 * más restrictivo.
 */
export interface JerarquiaDeVia {
  readonly codigo: string;
  /** Cuántos tramos de MU1 la componen. */
  readonly tramos: number;
  /**
   * El límite de velocidad más bajo que declaran sus tramos, en km/h.
   * **`0` es NO CONSTA**, no «cero kilómetros por hora»: 400 tramos lo traen a
   * 0 y 395 de ellos son peatonales. Un 0 no recorta ninguna velocidad.
   */
  readonly limiteKmh: number;
  /** [ORD art. 56.3.b] Vía pacificada: un carril por sentido y 30 km/h. */
  readonly pacificada: boolean;
  /** [ORD art. 56.3.b] Zona 30 delimitada. */
  readonly zona30: boolean;
  /** [ORD art. 56.3.c] Zona 20 — la plataforma única del dato municipal. */
  readonly zona20: boolean;
  /** [ORD art. 56.3.c] Vía o zona residencial. */
  readonly residencial: boolean;
  /** [ORD art. 56.3.a] Ciclo-carril señalizado, dicho en `observacio`. */
  readonly ciclocarril: boolean;
  /** [ORD art. 56.3.d] Más de un carril **y** límite ≤ 30 km/h. */
  readonly multicarrilCalmado: boolean;
  /** [ORD art. 50.6] Carril reservado al transporte público. */
  readonly carrilBus: boolean;
}

/** La jerarquía cargada y proyectada, con lo que costó y con sus cuentas. */
export interface JerarquiaEnMemoria {
  /** Por código de vía municipal: 2.049 entradas. */
  readonly porVia: ReadonlyMap<string, JerarquiaDeVia>;
  /** Por *way* de OSM, que es lo que la arista lleva encima. */
  readonly porWay: ReadonlyMap<number, JerarquiaDeVia>;
  readonly tramos: number;
  /** Tramos sin `codigo`: hueco del dato, no fallo nuestro. */
  readonly tramosSinCodigo: number;
  /** Vías de MU1 cuyo código no tiene eje con el que casar. */
  readonly viasSinEje: number;
  /** *Ways* que se han intentado casar. */
  readonly waysMirados: number;
  /** De esos, cuántos casaron con una vía **que MU1 conoce**. */
  readonly waysConJerarquia: number;
  /** Y cuántos casaron con una vía de la que MU1 no dice nada. */
  readonly waysConViaSinJerarquia: number;
  /** Cuántos no casaron con ninguna vía (sin eje cerca, disputa, cobertura). */
  readonly waysSinVia: number;
  readonly cargadoEnMs: number;
}

/** «SI» → true. Cualquier otra cosa —«NO», `null`, vacío— es false. */
function esSi(valor: string | null): boolean {
  return valor === 'SI';
}

/**
 * ⭐ Si un tramo tiene **más de un carril de circulación**.
 *
 * `carril_vh` no es un número: el dato trae `"1"`, `"2_3"`, `"1_2_1"`, `"2+2"`,
 * `"1,2"` y también `"Q"`, `"NO"` y `"SI"`. Se leen **todas** las cifras que
 * contiene y se mira la mayor, que es lo que el art. 56.3.d pregunta —«calles
 * con más de un carril»—. Lo que no trae ninguna cifra es NO CONSTA, y NO
 * CONSTA cierra: el patín no baja a una calzada por un dato que no está.
 */
function masDeUnCarril(carril: string | null): boolean {
  if (!carril) {
    return false;
  }
  let mayor = 0;
  for (const trozo of carril.match(/\d+/g) ?? []) {
    mayor = Math.max(mayor, Number(trozo));
  }
  return mayor > 1;
}

/** Si `observacio` declara que el tramo es un ciclo-carril. */
function esCiclocarril(observacio: string | null): boolean {
  return observacio !== null && /ciclo\s*-?\s*carril/i.test(observacio);
}

/** Agrega los tramos de una vía por la regla del más restrictivo. */
function agregar(codigo: string, tramos: readonly TramoCrudo[]): JerarquiaDeVia {
  let limiteKmh = 0;
  for (const t of tramos) {
    const v = t.limite_vel;
    // El 0 es NO CONSTA y no compite: un tramo peatonal no le pone techo de
    // 0 km/h a la vía entera.
    if (v !== null && v > 0 && (limiteKmh === 0 || v < limiteKmh)) {
      limiteKmh = v;
    }
  }
  return {
    codigo,
    tramos: tramos.length,
    limiteKmh,
    pacificada: tramos.every((t) => esSi(t.pacificada)),
    zona30: tramos.every((t) => esSi(t.calle_z30)),
    zona20: tramos.every((t) => esSi(t.plataforma)),
    residencial: tramos.every((t) => esSi(t.residencia)),
    ciclocarril: tramos.every((t) => esCiclocarril(t.observacio)),
    multicarrilCalmado: tramos.every(
      (t) =>
        masDeUnCarril(t.carril_vh) &&
        t.limite_vel !== null &&
        t.limite_vel > 0 &&
        t.limite_vel <= 30,
    ),
    carrilBus: tramos.some((t) => t.carril_bus === 1),
  };
}

/** Lo mínimo que la proyección necesita de la red: sus aristas. */
interface LoQueSeProyecta {
  readonly aristas: readonly {
    readonly way: number;
    readonly g: readonly Punto[];
  }[];
}

/**
 * ⭐ Carga MU1 y lo proyecta sobre los *ways* de una red.
 *
 * El índice de ejes se construye aquí dentro y **muere aquí dentro**, igual
 * que en `heredarNombres`: lo único que sale es el `Map` de *way* a jerarquía.
 */
export function cargarJerarquia(red: LoQueSeProyecta): JerarquiaEnMemoria {
  const principio = performance.now();

  // ── 1 · Del tramo a la vía, por código ────────────────────────────────────
  const crudo = JSON.parse(readFileSync(JERARQUIA, 'utf8')) as {
    readonly features: readonly { readonly properties: TramoCrudo }[];
  };
  const porCodigo = new Map<string, TramoCrudo[]>();
  let tramosSinCodigo = 0;
  for (const rasgo of crudo.features) {
    const p = rasgo.properties;
    if (p.codigo === null || p.codigo === undefined) {
      tramosSinCodigo++;
      continue;
    }
    const clave = String(p.codigo);
    const ya = porCodigo.get(clave);
    if (ya) {
      ya.push(p);
    } else {
      porCodigo.set(clave, [p]);
    }
  }
  const porVia = new Map<string, JerarquiaDeVia>();
  for (const [codigo, tramos] of porCodigo) {
    porVia.set(codigo, agregar(codigo, tramos));
  }

  // ── 2 · De la vía a la arista, por la vecindad doctrinada ─────────────────
  const indice = cargarEjes();
  const codigosConEje = new Set(indice.datos.codigo);
  let viasSinEje = 0;
  for (const codigo of porVia.keys()) {
    if (!codigosConEje.has(codigo)) {
      viasSinEje++;
    }
  }

  // Las geometrías de cada way, juntas. No se cosen ni se ordenan: son votos,
  // y un voto no sabe de orden.
  const geometrias = new Map<number, Punto[][]>();
  for (const arista of red.aristas) {
    const ya = geometrias.get(arista.way);
    if (ya) {
      ya.push(arista.g as Punto[]);
    } else {
      geometrias.set(arista.way, [arista.g as Punto[]]);
    }
  }

  const porWay = new Map<number, JerarquiaDeVia>();
  let waysConViaSinJerarquia = 0;
  let waysSinVia = 0;
  for (const [way, partes] of geometrias) {
    const casacion = casar(indice, partes);
    if (!casacion.herencia) {
      waysSinVia++;
      continue;
    }
    const jerarquia = porVia.get(casacion.herencia.codigo);
    if (jerarquia) {
      porWay.set(way, jerarquia);
    } else {
      waysConViaSinJerarquia++;
    }
  }

  return {
    porVia,
    porWay,
    tramos: crudo.features.length,
    tramosSinCodigo,
    viasSinEje,
    waysMirados: geometrias.size,
    waysConJerarquia: porWay.size,
    waysConViaSinJerarquia,
    waysSinVia,
    cargadoEnMs: performance.now() - principio,
  };
}
