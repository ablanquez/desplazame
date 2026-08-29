/**
 * LA RED DE LA RUEDA: el grafo convertido en algo por lo que se puede pedalear,
 * **con la capa de dato pegada a cada arista**.
 *
 * Es la hermana de `red.ts`, y es una red APARTE y no un filtro sobre aquella.
 * La razón está medida y es doble:
 *
 * 1. **La red del peatón NO tiene carriles bici.** Los cerró su tabla de
 *    acceso el 21/08 —4.675 aristas, 191,5 km—, que es justo la
 *    infraestructura que la bici prefiere. Rutear la bici por la red del
 *    peatón sería rutearla por donde no puede ir y sin lo que sí es suyo.
 * 2. **Y tiene 16.816 aceras que la rueda no puede pisar** [ORD art. 50.6].
 *    Con ellas dentro, el enganche de un portal caería en la acera de su
 *    puerta y la ruta empezaría prohibida.
 *
 * Compartir una red y filtrar al relajar no valía: el filtro no toca la
 * **rejilla**, así que el portal seguiría enganchando a la acera. Se paga una
 * segunda red y se declara lo que cuesta en el arranque.
 *
 * ⭐ **El peatón no se entera de que esto existe.** No se le cambia una línea:
 * su red, su rejilla, su Dijkstra y sus pruebas siguen donde estaban. Lo único
 * que se le ha hecho es sacarle a una función el tejido de nodos y adyacencia
 * (`tejerLaRed`, en `red.ts`) para no copiarlo aquí — misma operación, mismo
 * resultado, y los 313 guardianes delante.
 *
 * ## La capa de dato: cuatro cosas por arista, y ninguna se supone
 *
 * - **SENTIDO** — de `oneway` / `oneway:bicycle` de OSM (§ 1.21).
 * - **TECHO LEGAL** — de `limite_vel` municipal (§ 1.22) y, donde el municipal
 *   calla, de `maxspeed` de OSM. Con la fuente contada por arista.
 * - **ACCESO POR MODO** — bici, patín y BiZi, las tres tablas de la casilla 2.
 * - **FACTOR** — la preferencia al carril bici, de `rueda.ts`.
 *
 * Se calculan **una vez, al cargar**, y viven en arrays planos indexados por
 * arista: son ~48.000 aristas y consultarlas en cada relajación del Dijkstra
 * tiene que costar una lectura de array, no una búsqueda en un `Map`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AristaCruda, GrafoEnMemoria } from './grafo.ts';
import { tejerLaRed, type RedEnMemoria } from './red.ts';
import type { Entorno } from './gacetero.ts';
import { dentroDelEntorno } from './gacetero.ts';
import { cargarJerarquia, type JerarquiaEnMemoria } from './jerarquia.ts';
import { SENTIDOS_CORREGIDOS, sentidoCorregidoDe } from './sentidos-corregidos.ts';
import {
  ACCESO_RODANDO,
  DEFECTO_PLATAFORMA_KMH,
  DEFECTO_UN_CARRIL_KMH,
  DEFECTO_VARIOS_CARRILES_KMH,
  FACTOR_DE_TRAFICO,
  PERFILES_VETADOS,
  PERFIL_DE_CRUCE,
  UN_CARRIL_POR_TIPO,
  carrilesPorSentidoDeOsm,
  factorDe,
  puedeRodar,
} from './rueda.ts';

/** Las etiquetas del viario de OSM (§ 1.21). Vive en `motor/data/`. */
const VIARIO = fileURLToPath(
  new URL('../data/2026-08-28_osm_overpass_zaragoza-bbox_viario-etiquetas.json', import.meta.url),
);

/** Lo que el fichero de etiquetas trae, de lo que aquí se mira. */
interface RespuestaOverpass {
  readonly elements: readonly {
    readonly id: number;
    readonly tags?: Readonly<Record<string, string>>;
  }[];
}

/**
 * ⭐ De dónde salió el techo legal de una arista, **en capas**.
 *
 * Las dos primeras son **dato expreso** —la señal—, y mandan siempre. Las
 * cuatro siguientes son el **defecto legal del art. 50 RGC**, que solo entra
 * donde no hay señal. Que cada una tenga su código es lo que permite decir en
 * el arranque cuántas aristas debe su límite a qué, y distinguir «lo dice el
 * Ayuntamiento» de «lo dice la ley porque nadie ha dicho otra cosa».
 */
export const SIN_FUENTE = 0;
export const FUENTE_MUNICIPAL = 1;
export const FUENTE_OSM = 2;
/** Defecto 20: plataforma única [RGC 50.a], por `plataforma=SI` de MU1. */
export const DEFECTO_PLATAFORMA = 3;
/** Defecto 30: un carril por sentido [RGC 50.b], contado con `lanes` de OSM. */
export const DEFECTO_UN_CARRIL = 4;
/** Defecto 50: dos o más carriles por sentido [RGC 50.c], con `lanes` de OSM. */
export const DEFECTO_VARIOS_CARRILES = 5;
/** Defecto 30 por TIPO de vía. [PROPIO-por-tipo]: la capa menos apoyada. */
export const DEFECTO_POR_TIPO = 6;

/** Lo que la red de la rueda cuenta de sí misma al levantarse. */
export interface CuentasDeLaRueda {
  /** Aristas que la tabla de acceso dejó fuera, por tipo. */
  readonly cerradasPorTipo: ReadonlyMap<string, number>;
  /** De esas, cuántas cayeron por no tener fila en la tabla. Tiene que ser 0. */
  readonly sinFilaEnLaTabla: number;
  /**
   * ⚠️ Cuántas cerró **el veto de `p=acera` por sí solo**: aristas cuyo `h`
   * habría dejado entrar y que son acera. Hoy vale 0 y la fila está igual: el
   * día que suba, será que el dato trajo una acera con tipo de calzada.
   */
  readonly cerradasSoloPorPerfil: number;
  /** Aristas con sentido único, por su procedencia. */
  readonly sentidoPorTag: number;
  readonly sentidoAlReves: number;
  readonly sentidoPorRotonda: number;
  readonly contraflujo: number;
  /**
   * ⭐ Aristas cuyo sentido lo pone **una corrección verificada a mano**, no el
   * fichero. Es la cifra que hay que poder mirar: cuanto más suba, más está
   * este motor sosteniéndose sobre una lista escrita a mano.
   */
  readonly sentidoCorregido: number;
  readonly sinSentido: number;
  /** Aristas con techo legal EXPRESO — la señal. */
  readonly limiteMunicipal: number;
  readonly limiteOsm: number;
  /**
   * ⭐ Y las que lo tienen por el **defecto legal del art. 50 RGC**, capa a
   * capa. `defectoPorTipo` va aparte del resto porque es la única
   * [PROPIO-por-tipo]: las otras tres salen de un atributo de la vía.
   */
  readonly defectoPlataforma: number;
  readonly defectoUnCarril: number;
  readonly defectoVariosCarriles: number;
  readonly defectoPorTipo: number;
  readonly limiteAOscuras: number;
  /** Aristas cuyo `maxspeed` de OSM no es un número limpio: NO CONSTA. */
  readonly maxspeedIlegible: number;
  /** Aristas por las que puede ir el patín, y las que no. */
  readonly accesoPatin: number;
  /**
   * ⚠️ De las que NO puede pisar, **cuántas lo son porque la jerarquía
   * municipal no llega hasta ellas** y cuántas porque el dato municipal dice
   * que no. Son dos cosas muy distintas: la primera es un hueco de cobertura
   * —MU1 cubre 2.049 vías de las 3.359 del callejero— y la segunda es la ley.
   */
  readonly patinSinJerarquia: number;
  readonly patinConJerarquiaQueNoCumple: number;
  /**
   * ⚠️ **En cuántos trozos queda la red del patín**, y cuánto pesa el mayor.
   *
   * La red del peatón y la de la bici se apoyan en `c=0`, la componente mayor
   * del grafo, así que son conexas por construcción. La del patín **no**: su
   * lista cerrada la parte en islas separadas por las avenidas de más de 30.
   * Que la cifra salga en cada arranque es lo que impide que un modo que no
   * puede ir a ninguna parte parezca que funciona.
   */
  readonly componentesDelPatin: number;
  readonly nodosEnLaMayorDelPatin: number;
  /**
   * ⚠️ Y los nodos que **no tocan ni una arista** del patín, contados aparte.
   * La primera versión de este recuento los metía dentro de «trozos» y daba
   * 22.981, que suena a red rota en veintitrés mil pedazos cuando lo que hay
   * son 1.920 trozos de verdad y 21.061 nodos sueltos. Un número que asusta de
   * más miente igual que uno que tranquiliza de más.
   */
  readonly nodosSueltosDelPatin: number;
  /** Aristas dentro del término, por la frontera de la validación espacial. */
  readonly enElTermino: number;
  /** Pasos de peatones: los que se cruzan empujando y los que dan continuidad. */
  readonly pasosEmpujando: number;
  readonly pasosConContinuidad: number;
  /** Aristas con factor de preferencia distinto de 1. */
  readonly conFactor: number;
  /** Kilómetros de la red, para poder decir de qué tamaño es. */
  readonly km: number;
}

/**
 * La red de la rueda: **es una `RedEnMemoria`** —para que la rejilla, el
 * enganche y la narración funcionen sin saber que existe la bici— más la capa
 * de dato por arista.
 */
export interface RedDeLaRueda extends RedEnMemoria {
  /**
   * ⭐ El sentido de cada arista: **`0` los dos · `1` de `desde` a `hasta` ·
   * `-1` de `hasta` a `desde`**.
   *
   * Y `desde`→`hasta` es **el sentido en que OSM dibujó el way**, que es lo
   * que `oneway` significa. Que el grafo lo conserve no se supone: se ha
   * comprobado sobre el dato con dos medidas independientes, y están en la
   * cabecera de `sentidoDeLosWays`.
   */
  readonly sentido: Int8Array;
  /** El techo legal de cada arista, en km/h. **`0` es NO CONSTA.** */
  readonly limiteKmh: Float32Array;
  /** De dónde salió ese techo: una de las siete capas de arriba. */
  readonly fuenteLimite: Uint8Array;
  /**
   * ⭐ Cuántos carriles por sentido tiene la vía, o `0` si NO CONSTA. Sale del
   * `lanes` de OSM y, donde no está, del defecto por tipo. Lo necesita el
   * patín: **vía pacificada** es un carril por sentido Y 30 km/h o menos
   * [ORD art. 15.2.a.ii], y sin los carriles esa pregunta no se puede hacer.
   */
  readonly carrilesPorSentido: Uint8Array;
  /** El multiplicador de tiempo de cada arista. 1 donde no hay tráfico. */
  readonly factor: Float32Array;
  /** Si el patín puede entrar (`1`) o no (`0`). La bici puede en todas. */
  readonly accesoPatin: Uint8Array;
  /** Si la arista cae entera dentro del término municipal. Lo mira la BiZi. */
  readonly enElTermino: Uint8Array;
  /** Si hay que cruzarla **con el vehículo en la mano** [ORD art. 54.4]. */
  readonly empujando: Uint8Array;
  readonly jerarquia: JerarquiaEnMemoria;
  readonly cuentas: CuentasDeLaRueda;
}

/**
 * ⭐ EL SENTIDO DE CADA *WAY*, y por qué se puede confiar en la dirección.
 *
 * `oneway=yes` quiere decir «solo en el sentido en que la línea está
 * dibujada». Aplicarlo exige que **el orden de los vértices de nuestro grafo
 * sea el orden de OSM**, y eso no venía escrito en ninguna parte: el fichero
 * del grafo lo exportó el proyecto anterior y no trae leyenda. Aplicarlo sin
 * comprobarlo habría mandado a la bici en dirección contraria por 984 km sin
 * que nada se pusiera rojo.
 *
 * Se ha comprobado con dos medidas, y las dos salen limpias:
 *
 * 1. **Las rotondas.** En España se circula por ellas en sentido antihorario,
 *    y OSM dibuja `junction=roundabout` en el sentido de la marcha. De las
 *    rotondas del grafo que cierran en un solo *way*, **112 de 112 giran
 *    antihorario**, cero horario. Es una brújula del dato contra sí mismo.
 * 2. **El encadenado.** De los 22.999 *ways* partidos en más de una arista,
 *    **22.999 encadenan cabeza con cola** en orden de índice, sin una sola
 *    inversión.
 *
 * ── Lo que se lee, etiqueta por etiqueta ────────────────────────────────────
 *
 * - `oneway=yes` → adelante · `oneway=-1` → al revés (**8 *ways*, y no se
 *   aplastan a `yes`**: significan lo contrario y repararlos mandaría por ahí
 *   en dirección contraria).
 * - ⭐ `junction=roundabout` **sin `oneway`** → adelante. Es la implicación
 *   documentada de OSM —una rotonda es de sentido único por definición— y la
 *   aplican los tres motores. No es opcional: **1.390 de las 1.393 aristas de
 *   rotonda del subgrafo útil NO llevan el tag `oneway`**, así que leer solo el
 *   tag dejaría la ciudad entera de rotondas abierta en los dos sentidos.
 *   `junction=circular` NO la lleva —tampoco en OSM—, y aquí tampoco.
 * - ⭐ `oneway:bicycle=no` → **los dos sentidos** aunque la calle sea de uno.
 *   Es el CONTRAFLUJO de [DOC CycleStreets]: `oneway=yes` más etiqueta de
 *   contraflujo se importa **bidireccional para la bici**. Son 18 reales,
 *   ruido estadístico sobre 65.223, y por eso tienen guardián propio desde el
 *   28/08.
 * - `oneway:bicycle=yes` → adelante, mande lo que mande `oneway`. Son 2.
 */
function sentidoDeLosWays(tags: ReadonlyMap<number, Readonly<Record<string, string>>>): Map<
  number,
  {
    readonly sentido: -1 | 0 | 1;
    readonly porQue: 'tag' | 'reves' | 'rotonda' | 'contraflujo' | 'corregido';
  }
> {
  const fuera = new Map<
    number,
    { sentido: -1 | 0 | 1; porQue: 'tag' | 'reves' | 'rotonda' | 'contraflujo' | 'corregido' }
  >();

  // ⭐ LAS CORRECCIONES VERIFICADAS, antes que nada y por encima de todo.
  //
  // Van primero porque son lo único de esta función que no sale del fichero:
  // son calles que alguien ha ido a mirar. Y llevan su cerradura dentro — si
  // § 1.21 ya no dice lo que decía cuando se escribieron, `sentidoCorregidoDe`
  // lanza y el motor no abre el puerto. Ver `sentidos-corregidos.ts`.
  for (const fila of SENTIDOS_CORREGIDOS) {
    const suyo = tags.get(fila.way);
    const corregido = sentidoCorregidoDe(fila.way, suyo?.['oneway'], suyo !== undefined);
    if (corregido !== undefined) {
      fuera.set(fila.way, {
        sentido: corregido === 'yes' ? 1 : corregido === '-1' ? -1 : 0,
        porQue: 'corregido',
      });
    }
  }

  for (const [way, t] of tags) {
    if (fuera.has(way)) {
      continue;
    }
    const bici = t['oneway:bicycle'];
    if (bici === 'no') {
      fuera.set(way, { sentido: 0, porQue: 'contraflujo' });
      continue;
    }
    if (bici === 'yes') {
      fuera.set(way, { sentido: 1, porQue: 'tag' });
      continue;
    }
    const uno = t['oneway'];
    if (uno === 'yes') {
      fuera.set(way, { sentido: 1, porQue: 'tag' });
    } else if (uno === '-1') {
      fuera.set(way, { sentido: -1, porQue: 'reves' });
    } else if (uno === undefined && t['junction'] === 'roundabout') {
      fuera.set(way, { sentido: 1, porQue: 'rotonda' });
    }
  }
  return fuera;
}

/**
 * El `maxspeed` de OSM leído como número, o `0` si no se puede.
 *
 * **No se adivina.** El dato de Zaragoza trae solo cifras limpias —30, 50, 20,
 * 10, 40, 15…—, pero `maxspeed` admite `«walk»`, `«ES:urban»` y `«30 mph»`, y
 * un `parseInt` sobre «30 mph» daría 30 km/h para una vía de 48. Lo que no
 * casa entero con una cifra es NO CONSTA, y se cuenta.
 */
function limiteDeOsm(valor: string | undefined): number {
  if (valor === undefined || !/^\d+$/.test(valor)) {
    return 0;
  }
  const n = Number(valor);
  return n > 0 ? n : 0;
}

/**
 * Levanta la red de la rueda sobre el grafo ya cargado y la red del peatón.
 *
 * Recibe la del peatón **para no volver a leer los nombres**: `nombreDeWay`,
 * `tipoDeWay`, `nombreHeredado` y los artículos propios van por *way*, no por
 * arista, así que valen igual para las dos redes y volver a construirlos sería
 * volver a leer 5 MB y a cruzar 26.008 *ways* para llegar al mismo `Map`.
 *
 * ⚠️ Y con una consecuencia que se dice antes de que nadie la descubra: la
 * herencia de nombre municipal se cruzó sobre las aristas **del peatón**, así
 * que los *ways* que solo existen en la red de la rueda —los carriles bici—
 * **no tienen nombre heredado**. Narrarán por su tipo («el carril bici»), que
 * es lo que ya hacían antes del 20/08. Arreglarlo es de la casilla 5, que es
 * la que se ocupa de la narración de la rueda.
 */
export function cargarRedDeLaRueda(
  memoria: GrafoEnMemoria,
  peaton: RedEnMemoria,
  entorno: Entorno,
): RedDeLaRueda {
  const principio = performance.now();

  // ── 1 · El subgrafo por el que la rueda puede ir ──────────────────────────
  // Mismo orden que en la red del peatón, y por lo mismo: `cerradasPorTipo`
  // cuenta solo lo que la tabla quita de lo que **iba a entrar**, no lo que ya
  // sobraba por `a` o por `c`. Sin ese orden, la cifra mezclaría tres motivos.
  const utiles: AristaCruda[] = [];
  const cerradasPorTipo = new Map<string, number>();
  let sinFilaEnLaTabla = 0;
  let cerradasSoloPorPerfil = 0;
  for (const cruda of memoria.grafo.aristas) {
    if (cruda.a !== 1 || cruda.c !== 0) {
      continue;
    }
    if (!puedeRodar(cruda.h, cruda.p)) {
      cerradasPorTipo.set(cruda.h, (cerradasPorTipo.get(cruda.h) ?? 0) + 1);
      if (!(cruda.h in ACCESO_RODANDO)) {
        sinFilaEnLaTabla++;
      }
      // El veto del perfil, aislado: aristas que `h` habría dejado pasar.
      if (PERFILES_VETADOS.has(cruda.p) && ACCESO_RODANDO[cruda.h] === true) {
        cerradasSoloPorPerfil++;
      }
      continue;
    }
    utiles.push(cruda);
  }

  const tejido = tejerLaRed(utiles);
  const { aristas, nodos } = tejido;

  // ── 2 · Las etiquetas de OSM, por way ─────────────────────────────────────
  const crudo = JSON.parse(readFileSync(VIARIO, 'utf8')) as RespuestaOverpass;
  const tags = new Map<number, Readonly<Record<string, string>>>();
  for (const elemento of crudo.elements) {
    if (elemento.tags) {
      tags.set(elemento.id, elemento.tags);
    }
  }
  const sentidoDeWay = sentidoDeLosWays(tags);

  // ── 3 · La jerarquía municipal, proyectada por la vecindad doctrinada ─────
  const jerarquia = cargarJerarquia({ aristas });

  // ── 4 · La capa de dato, arista a arista ──────────────────────────────────
  const sentido = new Int8Array(aristas.length);
  const limiteKmh = new Float32Array(aristas.length);
  const fuenteLimite = new Uint8Array(aristas.length);
  const carrilesPorSentido = new Uint8Array(aristas.length);
  const factor = new Float32Array(aristas.length);
  const accesoPatin = new Uint8Array(aristas.length);
  const enElTermino = new Uint8Array(aristas.length);
  const empujando = new Uint8Array(aristas.length);

  let sentidoPorTag = 0;
  let sentidoAlReves = 0;
  let sentidoPorRotonda = 0;
  let contraflujo = 0;
  let sentidoCorregido = 0;
  let limiteMunicipal = 0;
  let limiteOsm = 0;
  let defectoPlataforma = 0;
  let defectoUnCarril = 0;
  let defectoVariosCarriles = 0;
  let defectoPorTipo = 0;
  let maxspeedIlegible = 0;
  let conFactor = 0;
  let km = 0;

  for (let k = 0; k < aristas.length; k++) {
    const arista = aristas[k]!;
    const t = tags.get(arista.way) ?? {};
    const tipo = peaton.tipoDeWay.get(arista.way) ?? '';
    km += arista.metros / 1000;

    // — El sentido —
    const suyo = sentidoDeWay.get(arista.way);
    if (suyo) {
      sentido[k] = suyo.sentido;
      if (suyo.porQue === 'tag' && suyo.sentido !== 0) sentidoPorTag++;
      else if (suyo.porQue === 'reves') sentidoAlReves++;
      else if (suyo.porQue === 'rotonda') sentidoPorRotonda++;
      else if (suyo.porQue === 'contraflujo') contraflujo++;
      else if (suyo.porQue === 'corregido') sentidoCorregido++;
    }

    // ⭐ — EL TECHO LEGAL, EN CUATRO CAPAS Y POR ESE ORDEN —
    //
    // 1 y 2 · **EL DATO EXPRESO, que es la señal, y manda siempre.** Es la
    //   regla (1) del parlamento del 29/08: `maxspeed` de OSM se define como
    //   el límite LEGAL, y quien emite el límite urbano es el Ayuntamiento;
    //   MU1 es su registro. Donde los dos hablan y discrepan —el 17,5 %
    //   medido—, gana el municipal. Donde el municipal calla, OSM rellena.
    //
    // 3 y 4 · **EL DEFECTO LEGAL del art. 50 RGC**, y solo donde no hay señal.
    //   Un límite genérico rige sin que nadie lo señalice, así que dejar la
    //   arista «a oscuras» no era neutral: era ignorar la ley que sí aplica.
    //   Plataforma única → 20 · un carril por sentido → 30 · dos o más → 50,
    //   con los carriles del `lanes` de OSM y, donde tampoco está, con el
    //   defecto por tipo, que va contado aparte por ser el menos apoyado.
    //
    // Y lo que **sigue a oscuras** se queda a oscuras: sin `lanes`, sin
    // plataforma y sin un tipo del que se pueda deducir el carril, no hay
    // regla del artículo que aplicar — y son sobre todo caminos rurales, que
    // ni siquiera son vía urbana.
    const suVia = jerarquia.porWay.get(arista.way);
    const carrilesOsm = carrilesPorSentidoDeOsm(
      t['lanes'],
      t['oneway'] === 'yes' || t['oneway'] === '-1',
    );
    if (suVia && suVia.limiteKmh > 0) {
      limiteKmh[k] = suVia.limiteKmh;
      fuenteLimite[k] = FUENTE_MUNICIPAL;
      limiteMunicipal++;
      carrilesPorSentido[k] = carrilesOsm;
    } else {
      const deOsm = limiteDeOsm(t['maxspeed']);
      if (t['maxspeed'] !== undefined && deOsm === 0) {
        maxspeedIlegible++;
      }
      if (deOsm > 0) {
        limiteKmh[k] = deOsm;
        fuenteLimite[k] = FUENTE_OSM;
        limiteOsm++;
        carrilesPorSentido[k] = carrilesOsm;
      } else if (suVia?.zona20) {
        // [RGC 50.a] plataforma única. La zona 20 de MU1 es exactamente eso.
        limiteKmh[k] = DEFECTO_PLATAFORMA_KMH;
        fuenteLimite[k] = DEFECTO_PLATAFORMA;
        defectoPlataforma++;
        carrilesPorSentido[k] = carrilesOsm || 1;
      } else if (carrilesOsm === 1) {
        // [RGC 50.b] un único carril por sentido.
        limiteKmh[k] = DEFECTO_UN_CARRIL_KMH;
        fuenteLimite[k] = DEFECTO_UN_CARRIL;
        defectoUnCarril++;
        carrilesPorSentido[k] = 1;
      } else if (carrilesOsm >= 2) {
        // [RGC 50.c] dos o más carriles por sentido.
        limiteKmh[k] = DEFECTO_VARIOS_CARRILES_KMH;
        fuenteLimite[k] = DEFECTO_VARIOS_CARRILES;
        defectoVariosCarriles++;
        carrilesPorSentido[k] = carrilesOsm;
      } else if (UN_CARRIL_POR_TIPO.has(tipo)) {
        // [PROPIO-por-tipo] la calle de barrio, el vial de servicio y la de
        // convivencia no son vías de dos calzadas. Ver `rueda.ts`.
        limiteKmh[k] = DEFECTO_UN_CARRIL_KMH;
        fuenteLimite[k] = DEFECTO_POR_TIPO;
        defectoPorTipo++;
        carrilesPorSentido[k] = 1;
      } else {
        fuenteLimite[k] = SIN_FUENTE;
        carrilesPorSentido[k] = carrilesOsm;
      }
    }

    // — El factor de preferencia —
    factor[k] = factorDe(tipo);
    if (factor[k] !== 1) {
      conFactor++;
    }

    // — El acceso del patín: la lista cerrada del art. 56 —
    accesoPatin[k] = puedeElPatin(
      tipo,
      arista.perfil,
      suVia,
      limiteKmh[k]!,
      carrilesPorSentido[k]!,
    )
      ? 1
      : 0;

    // — El término municipal, para la BiZi —
    // Entera dentro, no su punto medio: una arista que cruza la frontera se
    // recorre por los dos lados, así que se queda fuera. Es el lado seguro.
    let dentro = true;
    for (const punto of arista.g) {
      if (!dentroDelEntorno(entorno, punto[0], punto[1])) {
        dentro = false;
        break;
      }
    }
    enElTermino[k] = dentro ? 1 : 0;
  }

  // ── 5 · Los pasos de peatones y la continuidad ciclista ───────────────────
  // [ORD art. 54.4] «con la bicicleta o VMP en la mano, excepto cuando dicho
  // paso dé continuidad a dos tramos de vías ciclistas». La excepción se
  // evalúa sobre la topología ya tejida: un paso da continuidad cuando SUS DOS
  // extremos tocan una arista `h=cycleway`. Va después del CSR porque antes no
  // se sabe qué toca qué.
  const tocaCarril = new Uint8Array(nodos);
  for (const arista of aristas) {
    if (peaton.tipoDeWay.get(arista.way) === 'cycleway') {
      tocaCarril[arista.desde] = 1;
      tocaCarril[arista.hasta] = 1;
    }
  }
  let pasosEmpujando = 0;
  let pasosConContinuidad = 0;
  for (let k = 0; k < aristas.length; k++) {
    const arista = aristas[k]!;
    if (arista.perfil !== PERFIL_DE_CRUCE) {
      continue;
    }
    if (tocaCarril[arista.desde] === 1 && tocaCarril[arista.hasta] === 1) {
      pasosConContinuidad++;
    } else {
      empujando[k] = 1;
      pasosEmpujando++;
    }
  }

  let accesoPatinTotal = 0;
  let patinSinJerarquia = 0;
  let patinConJerarquiaQueNoCumple = 0;
  for (let k = 0; k < aristas.length; k++) {
    if (accesoPatin[k] === 1) {
      accesoPatinTotal++;
    } else if (jerarquia.porWay.has(aristas[k]!.way)) {
      patinConJerarquiaQueNoCumple++;
    } else {
      patinSinJerarquia++;
    }
  }

  // ⚠️ En cuántos trozos queda la red del patín. Un recorrido en anchura sobre
  // el CSR mirando solo sus aristas: barato, y lo único que dice si el modo
  // puede llegar a alguna parte.
  const componente = new Int32Array(nodos).fill(-1);
  let componentesDelPatin = 0;
  let nodosEnLaMayorDelPatin = 0;
  let nodosSueltosDelPatin = 0;
  const pila: number[] = [];
  let siguiente = 0;
  for (let n = 0; n < nodos; n++) {
    if (componente[n] !== -1) {
      continue;
    }
    const id = siguiente++;
    componente[n] = id;
    pila.length = 0;
    pila.push(n);
    let cuantos = 0;
    while (pila.length > 0) {
      const x = pila.pop()!;
      cuantos++;
      for (let k = tejido.inicio[x]!; k < tejido.inicio[x + 1]!; k++) {
        if (accesoPatin[tejido.salidaArista[k]!] === 0) {
          continue;
        }
        const v = tejido.salidaVecino[k]!;
        if (componente[v] === -1) {
          componente[v] = id;
          pila.push(v);
        }
      }
    }
    // Un nodo que no toca ninguna arista del patín no es un «trozo de red»:
    // se cuenta aparte para que la cifra de trozos signifique lo que dice.
    if (cuantos === 1) {
      nodosSueltosDelPatin++;
    } else {
      componentesDelPatin++;
      if (cuantos > nodosEnLaMayorDelPatin) {
        nodosEnLaMayorDelPatin = cuantos;
      }
    }
  }
  let enElTerminoTotal = 0;
  for (const v of enElTermino) {
    enElTerminoTotal += v;
  }
  let sinSentido = 0;
  for (const s of sentido) {
    if (s === 0) sinSentido++;
  }

  return {
    ...tejido,
    // Los cruces por *way* se prestan enteros de la red del peatón: van por
    // way y no por arista, así que valen igual para las dos redes.
    nombreDeWay: peaton.nombreDeWay,
    tipoDeWay: peaton.tipoDeWay,
    nombreHeredado: peaton.nombreHeredado,
    herencias: peaton.herencias,
    articulosPropios: peaton.articulosPropios,
    cerradasPorTipo,
    sinFilaEnLaTabla,
    sentido,
    limiteKmh,
    fuenteLimite,
    carrilesPorSentido,
    factor,
    accesoPatin,
    enElTermino,
    empujando,
    jerarquia,
    cuentas: {
      cerradasPorTipo,
      sinFilaEnLaTabla,
      cerradasSoloPorPerfil,
      sentidoPorTag,
      sentidoAlReves,
      sentidoPorRotonda,
      contraflujo,
      sentidoCorregido,
      sinSentido,
      limiteMunicipal,
      limiteOsm,
      defectoPlataforma,
      defectoUnCarril,
      defectoVariosCarriles,
      defectoPorTipo,
      limiteAOscuras:
        aristas.length -
        limiteMunicipal -
        limiteOsm -
        defectoPlataforma -
        defectoUnCarril -
        defectoVariosCarriles -
        defectoPorTipo,
      maxspeedIlegible,
      accesoPatin: accesoPatinTotal,
      patinSinJerarquia,
      patinConJerarquiaQueNoCumple,
      componentesDelPatin,
      nodosEnLaMayorDelPatin,
      nodosSueltosDelPatin,
      enElTermino: enElTerminoTotal,
      pasosEmpujando,
      pasosConContinuidad,
      conFactor,
      km,
    },
    cargadoEnMs: performance.now() - principio,
  };
}

/**
 * ⭐ LA TABLA DEL PATÍN, evaluada arista a arista.
 *
 * No es una tabla por tipo como la de la bici, y por eso no vive en
 * `rueda.ts`: es una **jerarquía más una lista cerrada**, y la lista se
 * pregunta al dato municipal.
 *
 * [ORD art. 56.2.c, literal] *«Los VMP circularán **obligatoriamente** por
 * carriles bici o vías ciclistas o lugares específicos destinados a la
 * circulación de bicicletas»*.
 *
 * [ORD art. 56.3, literal] *«**Cuando no exista vía ciclista** los VMP podrán
 * circular por la calzada en los siguientes casos y lugares: a) Ciclo-carriles
 * o carriles calmados señalizados. b) Vías pacificadas o vías de zonas 30.
 * c) Vías de zonas 20 y vías o zonas residenciales. d) Calles con más de un
 * carril de circulación con una limitación de velocidad máxima para todos
 * ellos de 30 km/h o inferior… e) Zonas verdes… g) [prohibido] vías o zonas
 * peatonales»*.
 *
 * ⚠️ **La casilla 0 decía «patín solo ≤30» y el texto dice otra cosa**: la
 * calzada es SUBSIDIARIA, no alternativa; lo que la abre son **categorías
 * declaradas**, no un número; y el único apartado que menciona los 30 exige
 * **más de un carril**. La casilla 2 lo corrigió con el articulado delante, y
 * esto implementa el texto, no el resumen.
 *
 * ⭐ Los dos huecos, **cerrados por doctrina** en la casilla 2: el `track`
 * rural (H1) y los 30 tramos a ≤30 de un solo carril y sin categoría (H2) se
 * quedan **fuera**. Es el defecto de una lista cerrada: lo no enumerado no
 * está: las tablas codifican la regla escrita, no analogías.
 *
 * ⚠️ Y el apartado e), **zonas verdes**, NO se implementa: exige un ancho de
 * vía de 3 m [art. 50.11] que no tenemos en ninguna fuente —`width` en 610 de
 * los 65.223 *ways*—. Hueco H5, declarado no modelable.
 *
 * ── ⭐ LA VÍA PACIFICADA DERIVADA (29/08, tarde) ────────────────────────────
 *
 * `pacificada=SI` de MU1 no es la única forma de ser vía pacificada: es la
 * forma de **estar fichada** como tal. La Ordenanza la DEFINE en el
 * art. 15.2.a.ii —*«todas aquellas vías de un carril de circulación por
 * sentido y en las que la limitación genérica de velocidad es 30 km/h»*—, y esa
 * definición calca el límite genérico del [LEY RGC art. 50.b]. Así que una
 * calle de barrio sin señal **es pacificada por ley**, la haya fichado el
 * Ayuntamiento o no, y el art. 56.3.b se la abre al VMP.
 *
 * Aquí se evalúa esa definición sobre el **límite efectivo** —expreso si lo
 * hay, defecto legal si no— y sobre los **carriles por sentido**. Las dos
 * condiciones, no una: una avenida de 30 con dos carriles por sentido no es
 * pacificada, y para esa está el 56.3.d, que sigue exigiendo dato municipal.
 *
 * Y el orden importa: **el dato expreso sigue mandando**. Una `residential`
 * señalizada a 50 tiene límite efectivo 50 y NO es pacificada, aunque el
 * defecto por tipo le hubiera dado 30 de no haber señal.
 */
function puedeElPatin(
  highway: string,
  perfil: string,
  via: { readonly pacificada: boolean; readonly zona30: boolean; readonly zona20: boolean;
    readonly residencial: boolean; readonly ciclocarril: boolean;
    readonly multicarrilCalmado: boolean } | undefined,
  limiteEfectivoKmh: number,
  carrilesPorSentido: number,
): boolean {
  // Cruzar un paso con el vehículo en la mano es de peatón, y el 54.4 nombra
  // «la bicicleta o VMP»: los dos cruzan igual.
  if (perfil === PERFIL_DE_CRUCE) {
    return true;
  }
  // 56.2.c — su vía obligatoria.
  if (highway === 'cycleway') {
    return true;
  }
  // 56.3.c — «vías o zonas residenciales». `living_street` ES una calle
  // residencial: es la definición del tag, no una analogía nuestra.
  if (highway === 'living_street') {
    return true;
  }
  // ⭐ 56.3.b vía la DEFINICIÓN del art. 15.2.a.ii: un carril por sentido y
  // 30 km/h o menos. Va antes de mirar MU1 porque no lo necesita — es lo que
  // le abre la calle de barrio que el Ayuntamiento no ha fichado.
  if (carrilesPorSentido === 1 && limiteEfectivoKmh > 0 && limiteEfectivoKmh <= 30) {
    return true;
  }
  if (!via) {
    return false;
  }
  return (
    via.ciclocarril || // 56.3.a
    via.pacificada ||
    via.zona30 || // 56.3.b, fichada
    via.zona20 ||
    via.residencial || // 56.3.c
    via.multicarrilCalmado // 56.3.d
  );
}

/** Los tipos con factor, para que las pruebas puedan nombrarlos sin copiarlos. */
export const TIPOS_CON_FACTOR = Object.keys(FACTOR_DE_TRAFICO);
