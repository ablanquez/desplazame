/**
 * LOS EJES DE VÍA MUNICIPALES, y la herencia de nombre POR VECINDAD.
 *
 * El problema que resuelve, dicho con la ruta de Antonio delante: se anda
 * 1.270 m por el carril bici de la AVENIDA ACADEMIA GENERAL MILITAR y el paso
 * decía «hacia el carril bici». No es que el nombre falte por descuido — es
 * que **OpenStreetMap no etiqueta pertenencia en Zaragoza**: medido en
 * consulta, **0 de 26.008** ways mudos llevan `is_sidepath` o
 * `cycleway:name`. El nombre no está en el way, y no va a estar.
 *
 * Sí está en otro sitio: en la capa municipal de **ejes de vía** (§ 1.15 del
 * notices), 3.359 líneas con `codigo` y `nombre_publico` que cubren el término
 * entero. Una acera va pegada a su calle; un carril bici, también. Basta con
 * mirar quién tiene al lado.
 *
 * ## De dónde sale el mecanismo, regla por regla
 *
 * **Map-matching y copiar nombres.** [DOC Valhalla] Es su propia propuesta
 * para este problema exacto (*issue* #5587): casar la red sin nombre contra la
 * red con nombre y heredar. No se inventa aquí.
 *
 * **Asignación POR VECINDAD, no por rumbo.** [DOC] *«Voronoi polygons based on
 * road edges to assign each sidewalk link to its street segment»* — arXiv
 * 2009.12548, que lo describe como el método *widely used*. Y es el flujo GIS
 * estándar: densificar la línea y unirla a la más cercana, *«inherit the
 * attributes of the nearest»* (ESRI).
 *
 * **Puertas de confianza, y lo dudoso NO se auto-acepta.** [DOC OSRM] Su
 * *map matching* devuelve una `MatchingConfidence` justamente porque casar
 * puede salir mal. Aquí las puertas son dos y están medidas: **cobertura** y
 * **disputa**. Lo que no las pasa se queda con su nombre genérico, que es
 * verdad aunque diga poco.
 *
 * ## Lo que este módulo NO decide
 *
 * Los **pasos de peatones y las escaleras narran por su tipo SIEMPRE**, hereden
 * lo que hereden: un paso de cebra cruza la calzada, no pertenece a ella, y
 * decir «continúa por Avenida de Navarra» mientras se cruza Navarra sería peor
 * que no decir nada. Eso lo aplica `pasos.ts` —el veto es de la narración, no
 * del cruce— y aquí se cruzan igualmente para que la medición del cruce sea
 * completa y comparable.
 *
 * ## Qué sobrevive al arranque
 *
 * **El índice, no.** Se construye, se cruza y se suelta: lo que queda vivo es
 * un `Map` de *way* a nombre. Los 67.583 segmentos de eje y su rejilla son
 * andamio de arranque.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { aPlano } from './proyeccion.ts';

/** La capa municipal. Vive en `motor/data/`: no lo sirve el navegador. */
const EJES = fileURLToPath(
  new URL('../data/2026-08-20_idezar_wfs_urbanismo-vias_ejes.json', import.meta.url),
);

type Punto = readonly [number, number];

/**
 * ⭐ Cada cuántos metros se parte un tramo para que vote.
 *
 * [DOC ESRI] Es el paso de *densify* del flujo estándar: una línea se convierte
 * en puntos regulares y cada punto hereda del más cercano. Sin densificar, un
 * way de 300 m descrito con dos vértices votaría dos veces —sus puntas— y las
 * puntas de una acera son justo lo que cae en el cruce, en la esquina y al lado
 * de la calle equivocada.
 *
 * **15 m** porque es la mitad del ancho de una calle de manzana: por debajo se
 * multiplican las muestras sin cambiar el ganador, y por encima un chaflán de
 * 20 m dejaría de tener voz propia.
 */
export const PASO_DE_MUESTREO_M = 15;

/**
 * ⭐ Hasta dónde se busca eje. **Sale del dato, no de la barriga.**
 *
 * Medida en consulta la distancia real de los ways mudos al eje municipal más
 * cercano, la masa está en **6-10 m** —que es exactamente lo que hay de una
 * acera al centro de su calzada— y el histograma tiene un valle claro pasados
 * los 25 m. Ahí se corta: más allá ya no es la acera de esta calle, es la de la
 * de al lado.
 */
export const RADIO_M = 25;

/**
 * ⭐ PUERTA 1 — qué parte del way tiene que ver al ganador para que se le crea.
 *
 * Un way que roza una calle por una punta y sigue 200 m por el descampado no
 * pertenece a esa calle. La mitad es el corte: por debajo, lo que se sabe del
 * way es menos que lo que se ignora.
 */
export const COBERTURA_MINIMA = 0.5;

/**
 * ⭐ PUERTA 2 — cuándo hay DUDA, y la duda no hereda.
 *
 * Si un segundo eje **con otro nombre** se lleva el 80 % de los votos del
 * ganador, el way va entre dos calles y no se sabe de cuál es. El modo de
 * fallo documentado de OpenSidewalks es justo ese: heredar la calle de
 * enfrente. Antes que decir un nombre falso, se dice el genérico.
 *
 * Se compara por **nombre y no por código**: el callejero municipal parte
 * vías en varios códigos, y que las dos mitades de la misma calle se voten
 * entre ellas no es una duda.
 */
export const UMBRAL_DE_DISPUTA = 0.8;

/** Lado de la celda del índice, en metros. El mismo que la rejilla de la red. */
const CELDA_M = 100;

/** Cuántas celdas caben en una fila. Sobra para el término municipal. */
const ANCHO_REJILLA = 1 << 14;

/** Una vía municipal, reducida a lo que el cruce mira. */
export interface EjeCrudo {
  readonly codigo: string;
  /** `nombre_publico`. **Puede ser `null`**: una de las 3.359 lo trae vacío. */
  readonly nombre: string | null;
  /** Las partes de su multilínea, en `[lon, lat]` como el grafo. */
  readonly partes: readonly (readonly Punto[])[];
}

/** Un segmento de eje, ya en el plano local y en metros. */
interface Segmento {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly via: number;
}

/** El índice espacial de los ejes. Vive lo que dura el cruce. */
export interface IndiceDeEjes {
  readonly vias: number;
  /** Las partes de multilínea: los «tramos» que el fichero declara. */
  readonly tramos: number;
  readonly segmentos: number;
  /** Vías cuya multilínea viene vacía: los 18 DISEMINADOS. */
  readonly sinGeometria: number;
  /** Vías sin `nombre_publico`: no pueden prestar nada. */
  readonly sinNombre: number;
  readonly celdas: number;
  readonly cargadoEnMs: number;
  /** Interno del cruce; público para que las pruebas puedan mirarlo. */
  readonly datos: {
    readonly codigo: readonly string[];
    readonly nombre: readonly (string | null)[];
    readonly segs: readonly Segmento[];
    readonly rejilla: ReadonlyMap<number, readonly number[]>;
  };
}

function claveCelda(x: number, y: number): number {
  return y * ANCHO_REJILLA + x;
}

/**
 * Construye el índice a partir de las vías ya leídas.
 *
 * Se separa de `cargarEjes` para que las reglas se puedan comprobar con calles
 * inventadas de geometría redonda: una regla que solo se prueba cuando
 * Zaragoza la dispara está probada a medias.
 */
export function indexar(vias: readonly EjeCrudo[]): IndiceDeEjes {
  const principio = performance.now();

  const codigo: string[] = [];
  const nombre: (string | null)[] = [];
  const segs: Segmento[] = [];
  const rejilla = new Map<number, number[]>();
  let tramos = 0;
  let sinGeometria = 0;
  let sinNombre = 0;

  for (const via of vias) {
    const id = codigo.push(via.codigo) - 1;
    nombre.push(via.nombre);
    if (via.nombre === null) {
      sinNombre++;
    }
    if (via.partes.length === 0) {
      sinGeometria++;
      continue;
    }
    for (const parte of via.partes) {
      tramos++;
      for (let i = 1; i < parte.length; i++) {
        const [x1, y1] = aPlano(parte[i - 1]![0], parte[i - 1]![1]);
        const [x2, y2] = aPlano(parte[i]![0], parte[i]![1]);
        const k = segs.push({ x1, y1, x2, y2, via: id }) - 1;
        const cx0 = Math.floor(Math.min(x1, x2) / CELDA_M);
        const cx1 = Math.floor(Math.max(x1, x2) / CELDA_M);
        const cy0 = Math.floor(Math.min(y1, y2) / CELDA_M);
        const cy1 = Math.floor(Math.max(y1, y2) / CELDA_M);
        for (let cy = cy0; cy <= cy1; cy++) {
          for (let cx = cx0; cx <= cx1; cx++) {
            const clave = claveCelda(cx, cy);
            const lista = rejilla.get(clave);
            if (lista) {
              lista.push(k);
            } else {
              rejilla.set(clave, [k]);
            }
          }
        }
      }
    }
  }

  return {
    vias: codigo.length,
    tramos,
    segmentos: segs.length,
    sinGeometria,
    sinNombre,
    celdas: rejilla.size,
    cargadoEnMs: performance.now() - principio,
    datos: { codigo, nombre, segs, rejilla },
  };
}

/** Lo que el fichero del WFS trae, de lo que aquí se mira. */
interface RespuestaWfs {
  readonly features: readonly {
    readonly properties: {
      readonly codigo: number;
      readonly nombre_publico: string | null;
    };
    readonly geometry: { readonly coordinates: readonly (readonly Punto[])[] } | null;
  }[];
}

/** Lee la capa municipal del disco y la indexa. Una vez, al arrancar. */
export function cargarEjes(): IndiceDeEjes {
  const respuesta = JSON.parse(readFileSync(EJES, 'utf8')) as RespuestaWfs;
  return indexar(
    respuesta.features.map((f) => ({
      // El código viene numérico y se guarda como texto: es una etiqueta, no
      // una cantidad, y así casa con el `codigoVia` del callejero.
      codigo: String(f.properties.codigo),
      nombre: f.properties.nombre_publico,
      partes: f.geometry?.coordinates ?? [],
    })),
  );
}

/** Distancia en metros de un punto a un segmento, en el plano local. */
function distancia(px: number, py: number, s: Segmento): number {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const largo2 = dx * dx + dy * dy;
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / largo2));
  return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
}

/** Lo que un eje se lleva de un way. */
export interface Voto {
  readonly codigo: string;
  readonly nombre: string | null;
  readonly cobertura: number;
}

/** Por qué un way heredó, o por qué no. Para poder medir el cruce entero. */
export type Motivo =
  | 'hereda'
  | 'sin-muestras'
  | 'sin-eje'
  | 'poca-cobertura'
  | 'disputa'
  | 'eje-sin-nombre';

/** El resultado de casar un way contra los ejes. */
export interface Casacion {
  readonly muestras: number;
  /** La cobertura del más votado, aunque no herede. 0 si nadie lo vio. */
  readonly cobertura: number;
  /** El nombre que hereda, o `null` si alguna puerta lo paró. */
  readonly herencia: (Voto & { readonly nombre: string; readonly dmedia: number }) | null;
  /** El rival que abrió la duda, si la abrió. */
  readonly disputa: Voto | null;
  readonly motivo: Motivo;
}

const NADA: Casacion = {
  muestras: 0,
  cobertura: 0,
  herencia: null,
  disputa: null,
  motivo: 'sin-muestras',
};

/**
 * ⭐ Casa un way contra los ejes: lo muestrea, cuenta los votos y aplica las
 * dos puertas.
 *
 * `partes` son las geometrías del way —sus aristas del grafo, o las partes de
 * una multilínea—; no hace falta que vengan en orden ni cosidas, porque lo que
 * se cuenta son votos y un voto no sabe de orden.
 */
export function casar(indice: IndiceDeEjes, partes: readonly (readonly Punto[])[]): Casacion {
  const { segs, rejilla, codigo, nombre } = indice.datos;

  let muestras = 0;
  // vía → [votos, suma de distancias]. Array plano indexado por vía: son 3.359
  // y se recorre una vez por way, así que un Map por way costaría más.
  const votos = new Map<number, { n: number; dsum: number }>();

  for (const parte of partes) {
    for (let i = 1; i < parte.length; i++) {
      const [x1, y1] = aPlano(parte[i - 1]![0], parte[i - 1]![1]);
      const [x2, y2] = aPlano(parte[i]![0], parte[i]![1]);
      const largo = Math.hypot(x2 - x1, y2 - y1);
      if (largo === 0) {
        continue;
      }
      // Al menos UNA muestra por segmento: si no, un tramo de 4 m no votaría a
      // nadie y se quedaría mudo por no medir bastante.
      const cuantas = Math.max(1, Math.round(largo / PASO_DE_MUESTREO_M));
      for (let k = 0; k < cuantas; k++) {
        const t = (k + 0.5) / cuantas;
        const px = x1 + t * (x2 - x1);
        const py = y1 + t * (y2 - y1);
        muestras++;

        // ── El voto: UNO, y al más cercano ────────────────────────────────
        // No a todos los que caen dentro del radio. Es lo que hace que esto
        // sea una asignación de Voronoi y no un reparto: en una calle
        // estrecha, votar también a la de enfrente dispararía la disputa y
        // nadie heredaría nunca.
        let mejor = -1;
        let mejorD = RADIO_M;
        const cx0 = Math.floor((px - RADIO_M) / CELDA_M);
        const cx1 = Math.floor((px + RADIO_M) / CELDA_M);
        const cy0 = Math.floor((py - RADIO_M) / CELDA_M);
        const cy1 = Math.floor((py + RADIO_M) / CELDA_M);
        for (let cy = cy0; cy <= cy1; cy++) {
          for (let cx = cx0; cx <= cx1; cx++) {
            for (const s of rejilla.get(claveCelda(cx, cy)) ?? []) {
              const d = distancia(px, py, segs[s]!);
              if (d <= mejorD) {
                mejorD = d;
                mejor = segs[s]!.via;
              }
            }
          }
        }
        if (mejor < 0) {
          continue;
        }
        const ya = votos.get(mejor);
        if (ya) {
          ya.n++;
          ya.dsum += mejorD;
        } else {
          votos.set(mejor, { n: 1, dsum: mejorD });
        }
      }
    }
  }

  if (muestras === 0) {
    return NADA;
  }
  if (votos.size === 0) {
    return { muestras, cobertura: 0, herencia: null, disputa: null, motivo: 'sin-eje' };
  }

  // Gana el más votado; a igualdad de votos, el que va más pegado.
  const orden = [...votos].sort(
    (a, b) => b[1].n - a[1].n || a[1].dsum / a[1].n - b[1].dsum / b[1].n,
  );
  const [via, ganador] = orden[0]!;
  const cobertura = ganador.n / muestras;
  const nombreGanador = nombre[via]!;

  // ── PUERTA 2 · la disputa ────────────────────────────────────────────────
  // Se mira ANTES que la cobertura porque una duda es una duda aunque el way
  // apenas se haya dejado ver: no se hereda de ninguna de las dos.
  const rival = orden
    .slice(1)
    .find(([v, o]) => o.n >= UMBRAL_DE_DISPUTA * ganador.n && nombre[v] !== nombreGanador);
  if (rival) {
    return {
      muestras,
      cobertura,
      herencia: null,
      disputa: {
        codigo: codigo[rival[0]]!,
        nombre: nombre[rival[0]]!,
        cobertura: rival[1].n / muestras,
      },
      motivo: 'disputa',
    };
  }

  // ── PUERTA 1 · la cobertura ──────────────────────────────────────────────
  if (cobertura < COBERTURA_MINIMA) {
    return { muestras, cobertura, herencia: null, disputa: null, motivo: 'poca-cobertura' };
  }

  if (nombreGanador === null) {
    return { muestras, cobertura, herencia: null, disputa: null, motivo: 'eje-sin-nombre' };
  }

  return {
    muestras,
    cobertura,
    herencia: {
      codigo: codigo[via]!,
      nombre: nombreGanador,
      cobertura,
      dmedia: ganador.dsum / ganador.n,
    },
    disputa: null,
    motivo: 'hereda',
  };
}

/** Lo mínimo que el cruce necesita de la red: sus aristas y qué ya tiene nombre. */
interface LoQueElCruceMira {
  readonly aristas: readonly {
    readonly way: number;
    readonly metros: number;
    readonly g: readonly Punto[];
  }[];
  readonly nombreDeWay: ReadonlyMap<number, string>;
}

/** El cruce entero, con sus cuentas — que son las que se publican al medir. */
export interface Herencias {
  readonly nombreHeredado: ReadonlyMap<number, string>;
  /** *Ways* mudos del subgrafo útil: el universo de este cruce. */
  readonly mudos: number;
  /** Cuántos se quedaron sin heredar, y por qué. */
  readonly porMotivo: Readonly<Record<Motivo, number>>;
  /** Aristas y kilómetros que ganan nombre gracias a esto. */
  readonly aristasHeredadas: number;
  readonly kmHeredados: number;
  /** Percentiles de la distancia media al eje heredado, en metros. */
  readonly distancia: Readonly<Record<'p50' | 'p90' | 'p99' | 'max', number>>;
  readonly cargadoEnMs: number;
}

/** Un percentil sobre una lista YA ordenada. */
function percentil(ordenada: readonly number[], parte: number): number {
  if (ordenada.length === 0) {
    return 0;
  }
  return ordenada[Math.min(ordenada.length - 1, Math.floor(parte * ordenada.length))]!;
}

/**
 * ⭐ EL CRUCE: cada *way* mudo del subgrafo útil contra los ejes municipales.
 *
 * El índice se construye aquí dentro y **muere aquí dentro**: lo único que
 * sale es el `Map` de *way* a nombre, que es lo que la narración consulta.
 */
export function heredarNombres(red: LoQueElCruceMira): Herencias {
  const principio = performance.now();
  const indice = cargarEjes();

  // Las geometrías de cada way mudo, juntas. No se cosen ni se ordenan: son
  // votos, y un voto no sabe de orden.
  const geometrias = new Map<number, Punto[][]>();
  const metrosDe = new Map<number, number>();
  const aristasDe = new Map<number, number>();
  for (const arista of red.aristas) {
    if (red.nombreDeWay.has(arista.way)) {
      continue;
    }
    const ya = geometrias.get(arista.way);
    if (ya) {
      ya.push(arista.g as Punto[]);
    } else {
      geometrias.set(arista.way, [arista.g as Punto[]]);
    }
    metrosDe.set(arista.way, (metrosDe.get(arista.way) ?? 0) + arista.metros);
    aristasDe.set(arista.way, (aristasDe.get(arista.way) ?? 0) + 1);
  }

  const nombreHeredado = new Map<number, string>();
  const porMotivo: Record<Motivo, number> = {
    hereda: 0,
    'sin-muestras': 0,
    'sin-eje': 0,
    'poca-cobertura': 0,
    disputa: 0,
    'eje-sin-nombre': 0,
  };
  const distancias: number[] = [];
  let aristasHeredadas = 0;
  let metrosHeredados = 0;

  for (const [way, partes] of geometrias) {
    const casacion = casar(indice, partes);
    porMotivo[casacion.motivo]++;
    if (casacion.herencia) {
      nombreHeredado.set(way, casacion.herencia.nombre);
      distancias.push(casacion.herencia.dmedia);
      aristasHeredadas += aristasDe.get(way) ?? 0;
      metrosHeredados += metrosDe.get(way) ?? 0;
    }
  }

  distancias.sort((a, b) => a - b);
  return {
    nombreHeredado,
    mudos: geometrias.size,
    porMotivo,
    aristasHeredadas,
    kmHeredados: metrosHeredados / 1000,
    distancia: {
      p50: percentil(distancias, 0.5),
      p90: percentil(distancias, 0.9),
      p99: percentil(distancias, 0.99),
      max: distancias[distancias.length - 1] ?? 0,
    },
    cargadoEnMs: performance.now() - principio,
  };
}
