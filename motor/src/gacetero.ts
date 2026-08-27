/**
 * ⭐ LA VALIDACIÓN ESPACIAL: una coordenada publicada no se cree, se comprueba.
 *
 * El dato municipal de equipamientos trae coordenadas rotas **demostradas**: un
 * centro de salud en Portugal (§ 1.17) y cuatro farmacias desplazadas todas por
 * el mismo vector (§ 1.16). La regla B no las caza — coordenada tienen; lo que
 * no tienen es sentido —, así que hace falta otra puerta antes del índice.
 *
 * No es un problema nuestro ni de esta ciudad. [Frontiers in Public Health,
 * 2022] documenta lo mismo en las listas sanitarias oficiales de Kenia: se
 * publican **sin proceso de verificación de coordenadas**, y quien las usa se
 * encuentra puntos en el mar y datums cruzados. Es exactamente nuestro Portugal
 * y nuestro desvío repetido.
 *
 * ── LOS DOS CHEQUES, y por qué son dos ──────────────────────────────────────
 *
 * Es la doctrina de control de calidad de geocodificación [Spatial Eye], que
 * separa dos comprobaciones porque cazan cosas distintas:
 *
 * 1. **FRONTERA** — *boundary check*: lo que cae fuera del área esperada. Caza
 *    el error grosero: un signo cambiado, un datum equivocado, un registro de
 *    otra provincia. Va a las tres categorías.
 * 2. **DISTANCIA** — *distance validation*: lo que está irrazonablemente lejos
 *    de donde debería. Caza el error fino, el que se ve bien en el mapa hasta
 *    que se compara con algo. Y aquí ese «algo» es **la propia dirección que el
 *    registro declara**: es la ida y vuelta —*round-trip QA*—, geocodificar lo
 *    que el dato dice de sí mismo y mirar si cae donde dice.
 *
 * ── ⭐ EL RESCATE, y por qué el callejero es la autoridad ────────────────────
 *
 * Encontrar la rota no arregla nada: hay que decidir qué se hace con ella. Lo
 * que se hace es **volver a situarla por su dirección**, contra un gacetero
 * autoritativo. Es el método del inventario panafricano de hospitales [Lancet
 * Global Health], que geocodificó sus listas contra los **gaceteros digitales
 * nacionales** en vez de fiarse de las coordenadas que venían; y es lo que
 * Google llama corregir el conjunto reprocesándolo por dirección.
 *
 * **Nuestro gacetero es el callejero municipal**: sus vías y sus 46.150
 * portales con coordenada, del mismo Ayuntamiento que publica los
 * equipamientos y con mucha más vigilancia encima. Si el registro dice «C/ La
 * Caza, 11» y el censo sabe dónde está el 11 de La Caza, esa es mejor
 * coordenada que la publicada.
 *
 * **Y el fichero municipal NO se edita.** Todo esto pasa al cargar, en memoria.
 * Es el precedente de la casa —la herencia de nombre por vecindad hace lo mismo
 * con el grafo— y la norma de siempre: el dato entra como vino.
 *
 * ── Lo que NO se valida, y está firmado ─────────────────────────────────────
 *
 * **Los hospitales no pasan por el cheque de distancia.** Un hospital no es una
 * puerta: es un recinto con varias. El Miguel Servet queda a 169 m del portal
 * que su dirección declara y **eso no es un error** — es otra de sus entradas.
 * [Nominatim #536] describe justo este caso, y su arreglo documentado son las
 * entradas `entrance=*` de OpenStreetMap, que aquí no están. La partición
 * chicos/recintos la firmó Antonio el 24/08; el arreglo del recinto, no: sigue
 * siendo parlamento pendiente y no se implementa por iniciativa propia.
 */

import { normalizar, type CallejeroEnMemoria } from './callejero.ts';
import { metrosEntre } from './cercano.ts';
import type { PortalesEnMemoria, PortalSituado } from './portales.ts';
import { RADIO_MAXIMO_M } from './proyeccion.ts';

/**
 * ⭐ **Desde cuántos metros una coordenada está mal. FIRMADO por Antonio,
 * 24/08.**
 *
 * Dos apoyos, y ninguno es un gusto. La literatura de calidad de
 * geocodificación sitúa en torno a los **50 m** el error que merece corrección
 * — por debajo se discute la precisión, por encima se discute la dirección. Y
 * nuestra propia distribución lo acompaña: de los 201 equipamientos cuya
 * dirección casa, la **mediana es 1 m** y el p90 son **11 m**.
 *
 * ⚠️ Lo que la distribución NO tiene es un vacío limpio detrás del umbral. Al
 * firmarlo se citaba «sanos 0-10 m, vacío hasta 236», y medido con este
 * emparejador el escalón no existe: hay casos en 24, 25, 38, 40, 42 y 45 m
 * por debajo, y en 52, 76 y 110 por encima. El umbral corta un continuo, no un
 * hueco. Se aplica el firmado y se dice lo que se ve.
 */
export const UMBRAL_DE_DESVIO_M = 50;

/**
 * Cuánto se ensancha el rectángulo de los portales para dar el entorno.
 *
 * Es `RADIO_MAXIMO_M`, el radio con el que un punto se engancha a la red: más
 * allá de él no hay ruta posible ni hay nada que rescatar, así que ensanchar
 * más sería dejar pasar coordenadas que después no valdrían para nada. Y
 * ensanchar algo hace falta: un equipamiento puede estar legítimamente unos
 * metros fuera del último portal del censo.
 */
export const MARGEN_DEL_ENTORNO_M = RADIO_MAXIMO_M;

/** El rectángulo dentro del cual una coordenada de Zaragoza puede caer. */
export interface Entorno {
  readonly lonMin: number;
  readonly lonMax: number;
  readonly latMin: number;
  readonly latMax: number;
}

export interface Gacetero {
  /**
   * ⭐ El entorno **sale del dato, no de un rectángulo escrito a mano**, y esa
   * es la diferencia entre cazar el error por construcción y cazarlo por
   * suerte: son los cuatro extremos de los 46.150 portales del censo con su
   * margen, así que cubre el término entero —barrios rurales incluidos— y
   * cualquier coordenada de otra provincia queda fuera por fuerza.
   */
  readonly entorno: Entorno;
  /**
   * El nombre de cada vía **sin su palabra de tipo** → los códigos que lo
   * llevan. Es una lista y no un código suelto a propósito: si un nombre lo
   * llevan dos vías, la dirección es ambigua y no se resuelve.
   */
  readonly viasPorNombre: ReadonlyMap<string, readonly string[]>;
  /**
   * Y al revés: el código de vía → su nombre tal y como se lee. No lo usa el
   * emparejador; lo usa quien tiene que **declarar** un rescate, que no puede
   * decir «se ha movido a la vía 7045» y quedarse tan ancho.
   */
  readonly nombreDeVia: ReadonlyMap<string, string>;
  readonly portales: PortalesEnMemoria;
  readonly cargadoEnMs: number;
}

/**
 * Las palabras con las que empieza un nombre de vía del callejero.
 *
 * Medido sobre las 3.359: los **30 códigos `tipoVia`** del fichero se
 * corresponden con estas 30 palabras, y solo **una** vía no empieza por la
 * suya. Se quita para comparar porque el equipamiento escribe su tipo de otra
 * manera —«C/» donde el callejero pone «CALLE»— y comparar los tipos entre sí
 * sería mantener una tabla de equivalencias que nadie ha publicado.
 */
const TIPOS_DEL_CALLEJERO = new Set([
  'andador', 'avenida', 'bulevar', 'barrio', 'callejon', 'calle', 'camino',
  'carrera', 'carretera', 'diseminado', 'embarcadero', 'glorieta', 'grupo',
  'jardines', 'lago', 'patio', 'poligono', 'pasaje', 'plaza', 'parque',
  'paseo', 'puente', 'rincon', 'ronda', 'replaceta', 'rotonda', 'soto',
  'travesia', 'urbanizacion', 'via',
]);

/**
 * Y las abreviaturas con las que lo escribe el dato de equipamientos, sacadas
 * de las 386 direcciones que hay: `c/` en 235, `avda.` en 64, `pº` en 26…
 * Incluye las que solo aparecen una vez, porque quitarlas cuesta lo mismo.
 */
const TIPOS_DEL_EQUIPAMIENTO = new Set([
  'c/', 'calle', 'avda.', 'avda', 'avenida', 'pº', 'pº.', 'p°', 'p.º', 'paseo',
  'pza.', 'pza', 'plaza', 'ctra.', 'carretera', 'camino', 'cmno.', 'cº', 'via',
  'ronda', 'andador', 'travesia', 'urb.', 'urbanizacion', 'gta.', 'glorieta',
]);

/** Normaliza y aplasta los blancos: el dato viene con comas sueltas y dobles. */
const paraComparar = (texto: string): string => normalizar(texto).replace(/\s+/g, ' ');

/** Le quita la palabra de tipo a un nombre, si la lleva. */
function sinElTipo(nombre: string, tipos: ReadonlySet<string>): string {
  const trozos = nombre.split(' ');
  return trozos.length > 1 && tipos.has(trozos[0]!) ? trozos.slice(1).join(' ') : nombre;
}

export function cargarGacetero(
  portales: PortalesEnMemoria,
  callejero: CallejeroEnMemoria,
): Gacetero {
  const principio = performance.now();

  let lonMin = Infinity;
  let lonMax = -Infinity;
  let latMin = Infinity;
  let latMax = -Infinity;
  for (const p of portales.situados) {
    if (p.lon < lonMin) lonMin = p.lon;
    if (p.lon > lonMax) lonMax = p.lon;
    if (p.lat < latMin) latMin = p.lat;
    if (p.lat > latMax) latMax = p.lat;
  }
  // El margen va en metros y el rectángulo en grados. El de latitud es
  // constante; el de longitud se estrecha con el coseno, así que se calcula a
  // la latitud del propio rectángulo y no a una de referencia.
  const gradosLat = MARGEN_DEL_ENTORNO_M / 111132;
  const gradosLon = gradosLat / Math.cos((((latMin + latMax) / 2) * Math.PI) / 180);

  const viasPorNombre = new Map<string, string[]>();
  const nombreDeVia = new Map<string, string>();
  // Solo las vías CON portal, que son las que el callejero indexa. Una vía sin
  // portales no puede dar una coordenada, así que no es candidata ni sirve para
  // hacer ambigua a otra.
  for (const { via } of callejero.sugeribles) {
    nombreDeVia.set(via.codigo, via.limpio);
    const nombre = sinElTipo(paraComparar(via.limpio), TIPOS_DEL_CALLEJERO);
    const suyas = viasPorNombre.get(nombre);
    if (suyas) {
      suyas.push(via.codigo);
    } else {
      viasPorNombre.set(nombre, [via.codigo]);
    }
  }

  return {
    entorno: {
      lonMin: lonMin - gradosLon,
      lonMax: lonMax + gradosLon,
      latMin: latMin - gradosLat,
      latMax: latMax + gradosLat,
    },
    viasPorNombre,
    nombreDeVia,
    portales,
    cargadoEnMs: performance.now() - principio,
  };
}

/** El cheque de frontera: ¿cae este punto donde puede caer un punto de aquí? */
export function dentroDelEntorno(entorno: Entorno, lon: number, lat: number): boolean {
  return (
    lon >= entorno.lonMin && lon <= entorno.lonMax && lat >= entorno.latMin && lat <= entorno.latMax
  );
}

/**
 * ⭐ EL EMPAREJADOR, y es **estricto o nada**.
 *
 * Devuelve el portal del censo que una dirección escrita nombra, o `null`. Y
 * `null` mucho más a menudo de lo que parecería razonable: de las 386
 * direcciones de equipamientos casan **201**. Eso es deliberado y es la lección
 * de la tanda anterior, donde un emparejador flojo casó «mina» con CONTAMINA,
 * «mayor» con CASAMAYOR y «Pza. Santo Domingo» con CALLE ISABEL SANTO DOMINGO
 * —13.680 m de mentira—. **Mejor fuera que mal rescatada**: lo que no casa se
 * queda sin validar, que es como estaba antes de existir esto.
 *
 * Tres exigencias, y dos son de unicidad:
 *
 * 1. **El nombre, entero e idéntico** una vez quitada la palabra de tipo. Ni
 *    subcadenas ni parecidos: «de navarra» casa con «de navarra» y con nada
 *    más. Esto **no se toca**: es lo que impide el fantasma de «mina» ↔
 *    CONTAMINA.
 *
 *    ⭐ **Pero que dos vías lo lleven ya NO descarta (27/08).** Hay 125 nombres
 *    con dos o más vías —AVENIDA AMÉRICA y CALLE AMÉRICA, AVENIDA MADRID y
 *    CALLE MADRID— y hasta hoy ahí no se adivinaba y se dejaba pasar. Ahora se
 *    desambigua por **cercanía**: gana la vía que tenga un portal más cerca de
 *    la coordenada que el Ayuntamiento publica.
 *
 *    No es un invento: es lo que hace cualquier geocodificador con un topónimo
 *    repetido. [DOC Google Geocoding] usa `bounds`/`region` como *location
 *    bias* justamente para eso, y [DOC Pelias] `focus.point` sube lo cercano —
 *    el mismo `focus` que este proyecto ya usa en `/api/sitios`. Y la doctrina
 *    de calidad lo dice más fuerte: ante un homónimo, **el clasificador
 *    geográfico manda sobre el de cadenas**, porque la similitud de nombres es
 *    justo la señal que produce el falso positivo. El caso de manual es el de
 *    los dos St. Paul a 400 km, que se casan solos si nadie mira el mapa.
 * 2. **Un solo portal** con ese número en esa vía. San Juan de la Peña 181 son
 *    **23 portales** —bloques y escaleras de la misma dirección— repartidos a
 *    más de 50 m unos de otros: elegir uno sería elegir a suertes, y una
 *    farmacia sana se movería por culpa del sorteo.
 * 3. **Una sola manera de partir la dirección**, y la parte el callejero. En
 *    «C/ 14 de Septiembre, 4» hay dos números y solo uno deja un nombre que
 *    exista; en «Avda. Puente del Pilar 31, local 6», igual. Se prueban todos
 *    los cortes y vale si **exactamente uno** resuelve. Si resuelven dos, la
 *    dirección no dice cuál es y no se rescata nada.
 */
export function portalDeLaDireccion(
  gacetero: Gacetero,
  calle: string,
  lon: number,
  lat: number,
): PortalSituado | null {
  // Lo que va entre paréntesis es apostilla del que escribe —«(Bº Santa
  // Isabel)», «(La Cartuja Baja)»— y no forma parte de la dirección.
  const escrita = paraComparar(calle.replace(/\([^)]*\)/g, ' '));

  let hallado: PortalSituado | null = null;
  for (const corte of escrita.matchAll(/\d+/g)) {
    const numero = corte[0];
    const nombre = sinElTipo(
      escrita.slice(0, corte.index).replace(/[\s,.-]+$/, ''),
      TIPOS_DEL_EQUIPAMIENTO,
    );
    if (nombre === '') {
      continue;
    }
    const vias = gacetero.viasPorNombre.get(nombre);
    if (!vias || vias.length === 0) {
      continue;
    }
    // ⭐ Y si son varias, **manda la geografía**: la que tenga un portal más
    // cerca del punto publicado. Ver la cabecera.
    let via: string;
    if (vias.length === 1) {
      via = vias[0]!;
    } else {
      const cercana = laMasCercana(gacetero, vias, lon, lat);
      if (metrosALaVia(gacetero, cercana, lon, lat) > UMBRAL_DE_DESVIO_M) { continue; }
      via = cercana;
    }
    // El número del censo trae cola —«181 BL1-3», «71 TV C2»—, así que se
    // compara por sus dígitos de cabeza; y tiene que haber uno solo.
    const suyos = (gacetero.portales.porVia.get(via) ?? []).filter(
      (p) => /^\d+/.exec(p.numero)?.[0] === numero,
    );
    if (suyos.length !== 1) {
      continue;
    }
    if (hallado) {
      // Dos cortes distintos resuelven: la dirección es ambigua de verdad.
      return null;
    }
    hallado = gacetero.portales.donde.get(suyos[0]!.codigo) ?? null;
  }
  return hallado;
}

/**
 * ⭐ A cuántos metros está un punto de la VÍA ENTERA: su portal más cercano.
 *
 * No de un número concreto, sino de cualquier puerta de esa calle. Es la
 * medida que le faltaba al rescate, y la que separa las dos cosas que hasta el
 * 27/08 se confundían: **un punto que está en otra parte de la ciudad** y **un
 * punto que está en su calle pero no en el número que su dirección declara**.
 * El segundo no es un error que arreglar.
 */
export function metrosALaVia(gacetero: Gacetero, via: string, lon: number, lat: number): number {
  let mejor = Infinity;
  for (const p of gacetero.portales.porVia.get(via) ?? []) {
    const situado = gacetero.portales.donde.get(p.codigo);
    if (!situado) {
      continue;
    }
    const m = metrosEntre(lat, lon, situado.lat, situado.lon);
    if (m < mejor) {
      mejor = m;
    }
  }
  return mejor;
}

/** De varias vías homónimas, la que tiene un portal más cerca del punto. */
function laMasCercana(
  gacetero: Gacetero,
  vias: readonly string[],
  lon: number,
  lat: number,
): string {
  let ganadora = vias[0]!;
  let mejor = Infinity;
  for (const via of vias) {
    const m = metrosALaVia(gacetero, via, lon, lat);
    if (m < mejor) {
      mejor = m;
      ganadora = via;
    }
  }
  return ganadora;
}

/** Qué se hace con una coordenada publicada. */
export type Veredicto =
  | { readonly estado: 'sana' }
  | {
      readonly estado: 'rescatada';
      readonly porQue: 'frontera' | 'distancia';
      readonly portal: PortalSituado;
      readonly metros: number;
    }
  | { readonly estado: 'invalida'; readonly porQue: 'frontera' };

/**
 * ⭐ EL VEREDICTO de una coordenada. Los dos cheques, en su orden.
 *
 * `mideLaDistancia` es la partición firmada: `false` en los hospitales, que son
 * recintos con varias puertas y para los que estar lejos de una dirección no es
 * un error. La frontera, en cambio, se le pasa a todo el mundo: un recinto
 * grande sigue sin poder estar en Portugal.
 *
 * Y una coordenada rota **que no se puede rescatar es una coordenada que no
 * hay**: se le aplica la regla B —fuera del índice, contada y declarada— porque
 * el punto que trae es peor que ninguno. La lista de esas es la que va a
 * confirmación manual, que es lo que hicieron con la base de Kenia: mandársela
 * a quien conoce el terreno.
 */
export function validar(
  gacetero: Gacetero,
  lon: number,
  lat: number,
  calle: string,
  mideLaDistancia: boolean,
): Veredicto {
  const portal = portalDeLaDireccion(gacetero, calle, lon, lat);

  if (!dentroDelEntorno(gacetero.entorno, lon, lat)) {
    return portal
      ? {
          estado: 'rescatada',
          porQue: 'frontera',
          portal,
          metros: metrosEntre(lat, lon, portal.lat, portal.lon),
        }
      : { estado: 'invalida', porQue: 'frontera' };
  }
  if (!mideLaDistancia || !portal) {
    return { estado: 'sana' };
  }
  const metros = metrosEntre(lat, lon, portal.lat, portal.lon);
  if (metros <= UMBRAL_DE_DESVIO_M) {
    return { estado: 'sana' };
  }

  /**
   * ⭐ LA PRECONDICIÓN DEL RESCATE (27/08, cierre de la nº13).
   *
   * Estar lejos del NÚMERO que la dirección declara no basta para mover nada.
   * Lo que hay que preguntar es si el punto está lejos de **su calle entera**:
   * si hay una puerta de esa misma vía a menos de 50 m, el punto ya está donde
   * dice que está, y lo único que discrepa es el portal — que es el caso
   * Miguel Servet a escala de portal, y no es un fallo.
   *
   * Medido antes de escribirlo: **22 de los 29 rescates** que el motor hacía el
   * 27/08 movían coordenadas que ya tenían una puerta a 50 m o menos. Es la ley
   * que salió de la entrada de la bitácora: **hay que medir la ida y la
   * vuelta**, no solo cuánto se mueve algo.
   */
  const aLaVia = metrosALaVia(gacetero, portal.via, lon, lat);
  if (aLaVia <= UMBRAL_DE_DESVIO_M) {
    return { estado: 'sana' };
  }
  return { estado: 'rescatada', porQue: 'distancia', portal, metros };
}
