/**
 * ⭐ LA RED DEL COCHE (2/09, punto 12 casilla 1a): el viario rodable de OSM
 * convertido en grafo dirigido, con las restricciones de giro aplicadas y los
 * costes de `car.lua` de OSRM.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ **NO SE COCINA SOBRE EL GRAFO DE § 1.4**, y eso es una decisión de
 *     Antonio del 2/09 tomada con el censo delante. Aquel grafo es el del
 *     PEATÓN: no trae ids de nodo y no pone vértice en todos los cruces de
 *     OSM, así que las restricciones habría que casarlas por coordenada y solo
 *     casaban **876 de 1.283 (68,3 %)**. Con el viario descargado con
 *     `out geom` —que trae `nodes` (ids), `geometry` y `tags` juntos— casan
 *     **1.240 de 1.283 (96,6 %)** y por id, sin adivinar nada.
 *
 *     Es además la doctrina de OSRM: se construye desde las *ways* de OSM.
 *     Y no toca ni al peatón, ni a la rueda, ni al bus: son redes distintas
 *     sobre ficheros distintos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── De dónde sale cada número ───────────────────────────────────────────────
 *
 * **Todo lo que pesa está copiado de `car.lua`, no recordado.** El fichero es
 * público y la copia se hizo el 02/09/2026 de:
 *
 *   https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/profiles/car.lua
 *   https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/profiles/lib/obstacles.lua
 *
 * Cada constante lleva debajo la línea de la que sale. Aproximar la sigmoide
 * —«se parece a una rampa»— habría sido inventarse el perfil de OSRM con su
 * nombre puesto.
 */
/** La versión del cocinado. Sube cuando cambia la FORMA, no el dato. */
export const FORMATO_DE_LA_RED_DE_COCHE = 1;

/**
 * ⭐ LA TABLA `speeds.highway` DE `car.lua`, EN km/h. **Copiada, línea a línea:**
 *
 * ```lua
 *     speeds = Sequence {
 *       highway = {
 *         motorway        = 90,
 *         motorway_link   = 45,
 *         trunk           = 85,
 *         trunk_link      = 40,
 *         primary         = 65,
 *         primary_link    = 30,
 *         secondary       = 55,
 *         secondary_link  = 25,
 *         tertiary        = 40,
 *         tertiary_link   = 20,
 *         unclassified    = 25,
 *         residential     = 25,
 *         living_street   = 10,
 *         service         = 15,
 *         -- winter highway types (OSM highway=winter_road / highway=ice_road)
 *         winter_road     = 20,
 *         ice_road        = 15
 *       }
 * ```
 *
 * ⚠️ `winter_road` e `ice_road` se copian **aunque en Zaragoza no haya ni una**:
 *    la tabla es de OSRM y se trae entera. Recortarla sería empezar a tener una
 *    tabla propia con el nombre de otro.
 */
export const VELOCIDAD_KMH: Readonly<Record<string, number>> = {
  motorway: 90,
  motorway_link: 45,
  trunk: 85,
  trunk_link: 40,
  primary: 65,
  primary_link: 30,
  secondary: 55,
  secondary_link: 25,
  tertiary: 40,
  tertiary_link: 20,
  unclassified: 25,
  residential: 25,
  living_street: 10,
  service: 15,
  winter_road: 20,
  ice_road: 15,
};

/** `default_speed = 10` en `car.lua`. Lo que no está en la tabla. */
export const VELOCIDAD_POR_DEFECTO = 10;

/** `turn_penalty = 7.5` en `car.lua`. El techo de la sigmoide. */
export const PENALIZACION_DE_GIRO = 7.5;

/** `turn_bias = 1.075` en `car.lua`. Asimetría izquierda/derecha. */
export const SESGO_DE_GIRO = 1.075;

/**
 * `duration = profile.properties.traffic_signal_penalty or 2` en
 * `lib/obstacles.lua`. El perfil del coche **no lo declara**, así que rige el
 * `or 2`: **dos segundos**.
 */
export const PENALIZACION_DE_SEMAFORO = 2;

/** `u_turn_penalty = 20` en `car.lua`, dentro de `properties`. */
export const PENALIZACION_DE_MEDIA_VUELTA = 20;

/**
 * ⭐ LA SIGMOIDE DE `car.lua`, copiada de `process_turn`:
 *
 * ```lua
 *   -- Use a sigmoid function to return a penalty that maxes out at turn_penalty
 *   -- over the space of 0-180 degrees.  Values here were chosen by fitting
 *   -- the function to some turn penalty samples from real driving.
 *   if turn.angle >= 0 then
 *     turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 / turn_bias) *  turn.angle/180 - 6.5*turn_bias)))
 *   else
 *     turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 * turn_bias) * -turn.angle/180 - 6.5/turn_bias)))
 *   end
 * ```
 *
 * El ángulo va en grados y con signo: **positivo a un lado, negativo al otro**,
 * y las dos ramas no son simétricas porque `turn_bias` entra dividiendo en una
 * y multiplicando en la otra. Ésa es toda la gracia de la fórmula y es la razón
 * de copiarla en vez de aproximarla.
 *
 * ⚠️ `is_left_hand_driving` es `false` en España, así que `turn_bias` entra tal
 *    cual (en `car.lua`: `left_hand_driving = false`).
 */
export function penalizacionDeGiro(anguloGrados: number): number {
  const sesgo = SESGO_DE_GIRO;
  if (anguloGrados >= 0) {
    return PENALIZACION_DE_GIRO / (1 + Math.exp(-((13 / sesgo) * (anguloGrados / 180) - 6.5 * sesgo)));
  }
  return PENALIZACION_DE_GIRO / (1 + Math.exp(-((13 * sesgo) * (-anguloGrados / 180) - 6.5 / sesgo)));
}

/**
 * ⭐ LOS TIPOS DE VÍA POR LOS QUE EL COCHE RUEDA.
 *
 * Es el filtro de la descarga, escrito aquí también porque el cocinado no debe
 * fiarse de que el fichero venga filtrado: si mañana se descarga con otra
 * consulta, esto sigue diciendo la verdad.
 *
 * ⚠️ **Fuera `pedestrian`, `footway`, `cycleway`, `path`, `steps`, `track`**:
 *    no son calzada de coche. `service` SÍ entra —son accesos, aparcamientos y
 *    calles interiores— y es el 21,5 % del viario.
 */
export const RODABLES: ReadonlySet<string> = new Set([
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'living_street',
  'service',
  'motorway_link',
  'trunk_link',
  'primary_link',
  'secondary_link',
  'tertiary_link',
]);

/** Los valores de `access` que cierran el paso. [wiki OSM, `access`] */
const CERRADO: ReadonlySet<string> = new Set(['no', 'private', 'customers', 'delivery', 'agricultural', 'forestry']);

export type Etiquetas = Readonly<Record<string, string>>;

/**
 * ⭐ ¿PUEDE EL COCHE? **La jerarquía de OSM, de lo específico a lo general.**
 *
 * [wiki OSM, *Key:access*] el modo más específico gana: `motorcar` pisa a
 * `motor_vehicle`, y `motor_vehicle` pisa a `vehicle` y a `access`. Mirar solo
 * `access` dejaría pasar el coche por 487 vías que declaran `motor_vehicle`.
 *
 * Y **la ausencia no cierra**: una vía sin ninguna de las cuatro etiquetas es
 * transitable. Eso es lo que dice el wiki y lo que hace `car.lua`.
 */
export function puedeElCoche(tags: Etiquetas): boolean {
  for (const clave of ['motorcar', 'motor_vehicle', 'vehicle', 'access']) {
    const v = tags[clave];
    if (v !== undefined) {
      return !CERRADO.has(v);
    }
  }
  return true;
}

/** En qué sentidos se puede recorrer una vía **en coche**. */
export type Sentido = 'ambos' | 'directo' | 'inverso';

/**
 * ⭐ EL SENTIDO, con semántica DE COCHE.
 *
 * ⚠️ **Las excepciones `oneway:bicycle` NO se miran aquí**, y es la diferencia
 *    con la red de la rueda: aquellas 18 vías de contraflujo ciclista son de
 *    sentido único **para el coche**. Aplicar la excepción de la bici al coche
 *    sería mandarlo a contramano por una calle donde solo la bici puede.
 *
 * `-1` es «al revés de como está dibujada la línea» y **se respeta, no se
 * repara**: tratarlo como `yes` mandaría por esas vías en dirección contraria.
 * [Es la misma lectura que § 1.21 dejó escrita para la rueda.]
 *
 * `junction=roundabout` implica sentido único aunque no lo diga [wiki OSM].
 */
export function sentidoDelCoche(tags: Etiquetas): Sentido {
  const v = tags['oneway'];
  if (v === '-1' || v === 'reverse') {
    return 'inverso';
  }
  if (v === 'yes' || v === 'true' || v === '1') {
    return 'directo';
  }
  if (v === 'no' || v === 'false' || v === '0') {
    return 'ambos';
  }
  if (tags['junction'] === 'roundabout' || tags['junction'] === 'circular') {
    return 'directo';
  }
  return 'ambos';
}

/**
 * ⭐ LA VELOCIDAD DE UNA VÍA, en km/h: la tabla de `car.lua` **con el
 * `maxspeed` de la vía como TOPE cuando existe**.
 *
 * En `car.lua` son dos manejadores encadenados —`WayHandlers.speed` y detrás
 * `WayHandlers.maxspeed`—, y ése es el orden: primero el tipo, después la
 * señal. Aquí se hace igual, y el tope **solo baja**: una `residential` con
 * `maxspeed=50` sigue a 25, porque la tabla dice cómo se circula de verdad,
 * no cuánto deja la señal.
 *
 * ⚠️ `maxspeed` viene sucio: `50`, `50 mph`, `ES:urban`, `walk`, `none`. Lo que
 *    no sea un número limpio **no se usa**, y eso es callar en vez de inventar.
 */
export function velocidadDe(tags: Etiquetas): number {
  const base = VELOCIDAD_KMH[tags['highway'] ?? ''] ?? VELOCIDAD_POR_DEFECTO;
  const crudo = tags['maxspeed'];
  if (crudo === undefined) {
    return base;
  }
  const mph = /^(\d+(?:\.\d+)?)\s*mph$/i.exec(crudo);
  if (mph) {
    return Math.min(base, Number(mph[1]) * 1.609344);
  }
  const kmh = /^(\d+(?:\.\d+)?)(\s*km\/h)?$/i.exec(crudo.trim());
  if (kmh) {
    const n = Number(kmh[1]);
    return n > 0 ? Math.min(base, n) : base;
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
//  EL DATO CRUDO, tal y como Overpass lo manda
// ─────────────────────────────────────────────────────────────────────────────

export interface WayCruda {
  readonly type: 'way';
  readonly id: number;
  readonly nodes: readonly number[];
  readonly geometry: readonly { readonly lat: number; readonly lon: number }[];
  readonly tags?: Etiquetas;
}

export interface MiembroCrudo {
  readonly type: 'way' | 'node' | 'relation';
  readonly ref: number;
  readonly role: string;
}

export interface RelacionCruda {
  readonly type: 'relation';
  readonly id: number;
  readonly members: readonly MiembroCrudo[];
  readonly tags?: Etiquetas;
}

export interface NodoCrudo {
  readonly type: 'node';
  readonly id: number;
  readonly lat: number;
  readonly lon: number;
  readonly tags?: Etiquetas;
}

// ─────────────────────────────────────────────────────────────────────────────
//  LA RED COCINADA
// ─────────────────────────────────────────────────────────────────────────────

/** Una arista dirigida: de un cruce al siguiente, por una vía. */
export interface AristaDeCoche {
  readonly i: number;
  /** Índices de nodo (no ids de OSM: el índice es la posición en `nodos`). */
  readonly desde: number;
  readonly hasta: number;
  /** El *way* de OSM del que sale. Es la clave con la que casan las relations. */
  readonly way: number;
  readonly h: string;
  readonly metros: number;
  readonly segundos: number;
  /** Si la arista cae DENTRO de la Zona de Bajas Emisiones (fase 1). */
  readonly zbe: boolean;
  /** La polilínea, en `[lat, lon]` como el contrato. */
  readonly g: readonly (readonly [number, number])[];
}

export interface ContadoresDeCoche {
  readonly waysLeidas: number;
  readonly waysRodables: number;
  readonly waysCerradas: number;
  readonly nodos: number;
  readonly aristas: number;
  readonly sentidoUnico: number;
  readonly sentidoInverso: number;
  readonly enZbe: number;
  readonly semaforosCasados: number;
  readonly semaforosSueltos: number;
  readonly restriccionesLeidas: number;
  readonly restriccionesAplicadas: number;
  readonly restriccionesViaWay: number;
  readonly restriccionesFuera: number;
  readonly restriccionesExentas: number;
  readonly restriccionesCondicionales: number;
  readonly vetos: number;
  readonly ms: number;
  readonly kb: number;
  readonly heapMb: number;
}

export interface RedDeCoche {
  readonly formato: number;
  /** El `timestamp_osm_base` del viario: la fecha del dato. */
  readonly sello: string;
  /** `[lat, lon]` por índice. */
  readonly nodos: readonly (readonly [number, number])[];
  readonly aristas: readonly AristaDeCoche[];
  /** Por nodo, las aristas que SALEN de él. */
  readonly salidas: ReadonlyMap<number, readonly number[]>;
  /** Nodos con semáforo, por índice. La transición por ellos cuesta 2 s. */
  readonly conSemaforo: ReadonlySet<number>;
  /** Transiciones vetadas, como `«aristaEntrada>aristaSalida»`. */
  readonly vetadas: ReadonlySet<string>;
  readonly contadores: ContadoresDeCoche;
}

/** Metros entre dos puntos por haversine. La misma que el resto de la casa. */
function metrosEntre(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * ⭐ EL ÁNGULO DE UN GIRO, en grados y CON SIGNO, como lo quiere la sigmoide.
 *
 * 0 es seguir recto; positivo y negativo son los dos lados. Se mide entre el
 * rumbo de entrada y el de salida, y se normaliza a (−180, 180].
 */
export function anguloDeGiro(
  entrada: readonly [number, number],
  vertice: readonly [number, number],
  salida: readonly [number, number],
): number {
  const rumbo = (a: readonly [number, number], b: readonly [number, number]): number =>
    (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  let d = rumbo(vertice, salida) - rumbo(entrada, vertice);
  while (d <= -180) d += 360;
  while (d > 180) d -= 360;
  return d;
}

/** Si un punto cae dentro de un anillo, por el algoritmo del rayo. */
function dentroDelAnillo(lon: number, lat: number, anillo: readonly (readonly number[])[]): boolean {
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i] as [number, number];
    const [xj, yj] = anillo[j] as [number, number];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}

/** Si un punto cae dentro de un MultiPolygon de GeoJSON. */
export function dentroDeLaZbe(
  lon: number,
  lat: number,
  poligonos: readonly (readonly (readonly (readonly number[])[])[])[],
): boolean {
  for (const poligono of poligonos) {
    if (poligono.length === 0) continue;
    if (dentroDelAnillo(lon, lat, poligono[0]!)) {
      let enHueco = false;
      for (let k = 1; k < poligono.length; k++) {
        if (dentroDelAnillo(lon, lat, poligono[k]!)) enHueco = true;
      }
      if (!enHueco) return true;
    }
  }
  return false;
}

export interface CrudoParaCocinar {
  readonly viario: { readonly elements: readonly WayCruda[]; readonly osm3s?: { readonly timestamp_osm_base?: string } };
  readonly restricciones: { readonly elements: readonly (RelacionCruda | NodoCrudo)[] };
  readonly semaforos: { readonly elements: readonly NodoCrudo[] };
  /** El GeoJSON de la ZBE. Solo se usa la **fase 1**, que es la vigente. */
  readonly zbe: { readonly features: readonly { readonly properties: Etiquetas; readonly geometry: { readonly type: string; readonly coordinates: unknown } }[] };
}

/**
 * ⭐ LA COCINA.
 *
 * Un solo recorrido por cada fichero y ni un array intermedio de los grandes:
 * es el precedente del punto 10 —streaming, determinista, formato versionado—
 * y aquí importa por lo mismo, que son 20 MB de viario.
 *
 * ── Qué se cocina y qué NO ──────────────────────────────────────────────────
 *
 * Se cocinan **los VETOS**, que son dato: qué transición no se puede hacer.
 * **NO se cocinan las penalizaciones**, que son una FÓRMULA: precalcular el
 * coste de cada par de aristas de cada cruce multiplicaría el fichero por el
 * grado medio al cuadrado para guardar algo que `penalizacionDeGiro` calcula en
 * un microsegundo. El dato al fichero; la fórmula, función.
 */
export function cocinarRedDeCoche(crudo: CrudoParaCocinar): RedDeCoche {
  const principio = performance.now();

  // ── 1 · Los nodos que hacen de CRUCE ──────────────────────────────────────
  //
  // Una way se parte donde comparte nodo con otra, y en sus dos puntas. Partirla
  // en cada nodo daría 174.893 aristas por sentido para nada: entre dos cruces
  // no hay ninguna decisión que tomar.
  const vecesVisto = new Map<number, number>();
  const rodables: WayCruda[] = [];
  let waysCerradas = 0;
  for (const w of crudo.viario.elements) {
    const tags = w.tags ?? {};
    if (!RODABLES.has(tags['highway'] ?? '')) continue;
    if (!puedeElCoche(tags)) {
      waysCerradas++;
      continue;
    }
    rodables.push(w);
    for (const n of w.nodes) vecesVisto.set(n, (vecesVisto.get(n) ?? 0) + 1);
  }

  /**
   * ⭐ Y **EL SEMÁFORO TAMBIÉN PARTE**, que se descubrió midiendo (2/09).
   *
   * En OSM el `highway=traffic_signals` va donde está el poste, no en el centro
   * geométrico del cruce: **1.298 de los 1.360 de Zaragoza caen en un nodo
   * INTERIOR de una sola vía**, y solo 28 en un nodo compartido. Partiendo solo
   * por los cruces, la penalización de 2 s de `car.lua` no se habría podido
   * cobrar nunca — el nodo del semáforo no sería el final de ninguna arista, y
   * `costeDeTransicion` no pasaría por él.
   *
   * Lo cazó la juez 6, en rojo, con «semáforos casados: 26».
   */
  const conSemaforoOsm = new Set<number>(crudo.semaforos.elements.map((n) => n.id));

  const esCorte = (id: number, w: WayCruda, k: number): boolean =>
    k === 0 ||
    k === w.nodes.length - 1 ||
    (vecesVisto.get(id) ?? 0) > 1 ||
    conSemaforoOsm.has(id);

  // ── 2 · La ZBE, fase 1 ────────────────────────────────────────────────────
  const fase1 = crudo.zbe.features.find((f) => f.properties['fase'] === 'FASE 1');
  const poligonosZbe = (fase1?.geometry.coordinates ?? []) as readonly (readonly (readonly (readonly number[])[])[])[];

  // ── 3 · Nodos y aristas ───────────────────────────────────────────────────
  const indiceDeNodo = new Map<number, number>();
  const nodos: [number, number][] = [];
  const guardarNodo = (id: number, lat: number, lon: number): number => {
    const ya = indiceDeNodo.get(id);
    if (ya !== undefined) return ya;
    const i = nodos.length;
    nodos.push([lat, lon]);
    indiceDeNodo.set(id, i);
    return i;
  };

  const aristas: AristaDeCoche[] = [];
  const salidas = new Map<number, number[]>();
  /** Por way, sus aristas — para casar las relations. */
  const aristasDeWay = new Map<number, number[]>();
  let sentidoUnico = 0;
  let sentidoInverso = 0;
  let enZbe = 0;

  const anadir = (
    desde: number,
    hasta: number,
    way: number,
    h: string,
    g: [number, number][],
    kmh: number,
    zbe: boolean,
  ): void => {
    let metros = 0;
    for (let k = 1; k < g.length; k++) {
      metros += metrosEntre(g[k - 1]![0], g[k - 1]![1], g[k]![0], g[k]![1]);
    }
    const i = aristas.length;
    aristas.push({
      i,
      desde,
      hasta,
      way,
      h,
      metros: Math.round(metros * 10) / 10,
      segundos: Math.round(((metros / 1000 / kmh) * 3600) * 10) / 10,
      zbe,
      g,
    });
    if (zbe) enZbe++;
    const s = salidas.get(desde);
    if (s) s.push(i);
    else salidas.set(desde, [i]);
    const w = aristasDeWay.get(way);
    if (w) w.push(i);
    else aristasDeWay.set(way, [i]);
  };

  for (const w of rodables) {
    const tags = w.tags ?? {};
    const h = tags['highway']!;
    const kmh = velocidadDe(tags);
    const sentido = sentidoDelCoche(tags);
    if (sentido === 'directo') sentidoUnico++;
    if (sentido === 'inverso') sentidoInverso++;

    let desdeId = w.nodes[0]!;
    let trozo: [number, number][] = [[w.geometry[0]!.lat, w.geometry[0]!.lon]];
    for (let k = 1; k < w.nodes.length; k++) {
      const id = w.nodes[k]!;
      const p = w.geometry[k];
      if (!p) break;
      trozo.push([p.lat, p.lon]);
      if (!esCorte(id, w, k)) continue;
      const a = guardarNodo(desdeId, trozo[0]![0], trozo[0]![1]);
      const b = guardarNodo(id, p.lat, p.lon);
      const medio = trozo[Math.floor(trozo.length / 2)]!;
      const zbe = dentroDeLaZbe(medio[1], medio[0], poligonosZbe);
      if (sentido !== 'inverso') anadir(a, b, w.id, h, trozo, kmh, zbe);
      if (sentido !== 'directo') anadir(b, a, w.id, h, [...trozo].reverse(), kmh, zbe);
      desdeId = id;
      trozo = [[p.lat, p.lon]];
    }
  }

  // ── 4 · Los semáforos ─────────────────────────────────────────────────────
  const conSemaforo = new Set<number>();
  let semaforosSueltos = 0;
  for (const n of crudo.semaforos.elements) {
    const i = indiceDeNodo.get(n.id);
    if (i === undefined) semaforosSueltos++;
    else conSemaforo.add(i);
  }

  // ── 5 · Las restricciones ─────────────────────────────────────────────────
  //
  // ⚠️ [OSRM, palabra de su desarrollador] las PENALIZACIONES no prohíben; lo
  //    que prohíbe son las RELATIONS. Por eso esto veta transiciones y no las
  //    encarece: encarecer un giro prohibido dejaría al router mandarte por él
  //    cuando le saliera barato.
  const relaciones = crudo.restricciones.elements.filter(
    (e): e is RelacionCruda => e.type === 'relation',
  );
  const nodosDeRelacion = new Map<number, NodoCrudo>();
  for (const e of crudo.restricciones.elements) {
    if (e.type === 'node') nodosDeRelacion.set(e.id, e);
  }

  const vetadas = new Set<string>();
  let aplicadas = 0;
  let viaWay = 0;
  let fuera = 0;
  let exentas = 0;
  let condicionales = 0;

  /** Las aristas de un way que TERMINAN en un nodo. */
  const entrandoA = (way: number, nodo: number): number[] =>
    (aristasDeWay.get(way) ?? []).filter((i) => aristas[i]!.hasta === nodo);
  /** Las que SALEN de él. */
  const saliendoDe = (way: number, nodo: number): number[] =>
    (aristasDeWay.get(way) ?? []).filter((i) => aristas[i]!.desde === nodo);

  for (const rel of relaciones) {
    const tags = rel.tags ?? {};
    const tipo = tags['restriction'];
    if (!tipo) {
      fuera++;
      continue;
    }
    const from = rel.members.filter((m) => m.role === 'from');
    const to = rel.members.filter((m) => m.role === 'to');
    const via = rel.members.filter((m) => m.role === 'via');

    // ⚠️ La via-WAY es más compleja que el via-nodo [wiki OSM]: se cuenta y se
    //    declara, no se adivina. Son 11 en Zaragoza.
    if (via.some((m) => m.type === 'way')) {
      viaWay++;
      continue;
    }
    if (from.length !== 1 || to.length !== 1 || via.length !== 1) {
      fuera++;
      continue;
    }

    // ⭐ `except` EXIME AL QUE NOMBRA, no al coche. Una `except=bicycle` sigue
    //    prohibiendo el giro al coche; solo una que nombre a un vehículo NUESTRO
    //    —`motorcar`, `motor_vehicle`— lo exime. Es la juez 3.
    const except = (tags['except'] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    if (except.includes('motorcar') || except.includes('motor_vehicle')) {
      exentas++;
      continue;
    }
    if (Object.keys(tags).some((k) => k.endsWith(':conditional'))) {
      // ⚠️ [PROPIO, conservador y declarado] una condicional que veta solo unas
      //    franjas se aplica **como incondicional**: mejor no mandar por donde a
      //    esa hora no se puede, que mandar y que no se pueda. Se cuentan.
      condicionales++;
    }

    const nodoVia = nodosDeRelacion.get(via[0]!.ref);
    const iVia = indiceDeNodo.get(via[0]!.ref);
    if (iVia === undefined || !nodoVia) {
      fuera++;
      continue;
    }
    const entradas = entrandoA(from[0]!.ref, iVia);
    const salidasDelTo = saliendoDe(to[0]!.ref, iVia);
    if (entradas.length === 0 || salidasDelTo.length === 0) {
      fuera++;
      continue;
    }

    const esOnly = tipo.startsWith('only_');
    if (esOnly) {
      // ⭐ `only_*`: el `to` es el ÚNICO permitido desde ese `from`. Se vetan
      //    **las demás** salidas del cruce, no la suya.
      const permitidas = new Set(salidasDelTo);
      for (const e of entradas) {
        for (const s of salidas.get(iVia) ?? []) {
          if (!permitidas.has(s)) vetadas.add(`${e}>${s}`);
        }
      }
    } else {
      for (const e of entradas) {
        for (const s of salidasDelTo) vetadas.add(`${e}>${s}`);
      }
    }
    aplicadas++;
  }

  const ms = performance.now() - principio;
  const red: RedDeCoche = {
    formato: FORMATO_DE_LA_RED_DE_COCHE,
    sello: crudo.viario.osm3s?.timestamp_osm_base ?? '',
    nodos,
    aristas,
    salidas,
    conSemaforo,
    vetadas,
    contadores: {
      waysLeidas: crudo.viario.elements.length,
      waysRodables: rodables.length,
      waysCerradas,
      nodos: nodos.length,
      aristas: aristas.length,
      sentidoUnico,
      sentidoInverso,
      enZbe,
      semaforosCasados: conSemaforo.size,
      semaforosSueltos,
      restriccionesLeidas: relaciones.length,
      restriccionesAplicadas: aplicadas,
      restriccionesViaWay: viaWay,
      restriccionesFuera: fuera,
      restriccionesExentas: exentas,
      restriccionesCondicionales: condicionales,
      vetos: vetadas.size,
      ms: Math.round(ms),
      kb: 0,
      heapMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };
  return red;
}

/**
 * ⭐ EL COSTE DE PASAR DE UNA ARISTA A OTRA, en segundos — o `null` si la
 * transición está VETADA.
 *
 * Aquí se junta todo lo de `car.lua`: la sigmoide del ángulo, los 2 s del
 * semáforo y los 20 de la media vuelta.
 *
 * ⚠️ **LA LIMITACIÓN DE LA MEDIA VUELTA SE HEREDA ESCRITA.** Esto detecta la
 *    media vuelta **directa** —volver por la misma arista— y nada más. Entre
 *    calzadas separadas, dar la vuelta son dos giros a la izquierda y OSRM
 *    tampoco lo ve como media vuelta: es su *issue* **#4368**, y aquí se copia
 *    la limitación en vez de inventarse una mejora que nadie ha medido.
 */
export function costeDeTransicion(red: RedDeCoche, entrada: number, salida: number): number | null {
  if (red.vetadas.has(`${entrada}>${salida}`)) {
    return null;
  }
  const a = red.aristas[entrada];
  const b = red.aristas[salida];
  if (!a || !b || a.hasta !== b.desde) {
    return null;
  }
  const vertice = red.nodos[a.hasta]!;
  const antes = a.g[a.g.length - 2] ?? a.g[0]!;
  const despues = b.g[1] ?? b.g[0]!;
  let coste = penalizacionDeGiro(anguloDeGiro(antes, vertice, despues));
  if (a.way === b.way && a.desde === b.hasta) {
    coste += PENALIZACION_DE_MEDIA_VUELTA;
  }
  if (red.conSemaforo.has(a.hasta)) {
    coste += PENALIZACION_DE_SEMAFORO;
  }
  return coste;
}
