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
   * ⭐ Los nombres del callejero agrupados por su PRIMERA palabra.
   *
   * Es el índice que hace barata la búsqueda por subsecuencia (§ nº14): para
   * saber qué nombres del censo caben dentro de «doctor alejandro palomar» no
   * hace falta recorrer los 3.359, sino solo los que empiezan por «doctor»,
   * por «alejandro» o por «palomar». Sin esto, cada dirección compararía contra
   * el callejero entero y la carga se notaría.
   */
  readonly nombresPorPrimeraPalabra: ReadonlyMap<string, readonly string[]>;
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
  const nombresPorPrimeraPalabra = new Map<string, string[]>();
  const nombreDeVia = new Map<string, string>();
  /**
   * ⚠️ **Solo las vías CON portal**, y desde el 27/08 eso hay que filtrarlo a
   * mano: `sugeribles` ya no significa «con portal» — incluye las 619 que se
   * resuelven por su punto medio.
   *
   * El motivo de excluirlas no ha cambiado y es el de siempre: una vía sin
   * portales **no puede dar una coordenada de portal**, así que no es candidata.
   * Lo que este filtro protege es lo SEGUNDO que decía la línea de antes —**ni
   * sirve para hacer ambigua a otra**—, y ahí sí habría cambio: de los 617
   * nombres que traen las 619, **44 chocan con un nombre que ya tiene portal y
   * 36 rompen una clave que hoy es ÚNICA**. PLAZA LOS SITIOS y PUENTE LOS
   * SITIOS. CALLE DELICIAS y PARQUE DELICIAS. AVENIDA CÉSAR AUGUSTO y PLAZA
   * CÉSAR AUGUSTO. Con esas 36 dejando de ser únicas, el escalón 4 de
   * `portalDeLaDireccion` —«si ninguna candidata supera la guarda, se cae a la
   * clave exacta ÚNICA»— dejaría de encontrar una única, y ese escalón es lo
   * que sostiene los cuatro rescates del desvío del datum.
   *
   * ⚠️ **Medido, y hay que decirlo entero: HOY no cambia ni un rescate.** Con
   * filtro y sin él salen los mismos 16, uno a uno y con los mismos metros —
   * ninguna de las 386 direcciones de equipamientos nombra una de esas 36 por un
   * camino que llegue al escalón 4. Así que esto no arregla un fallo vivo: es
   * una precaución, y se declara como tal. Lo que la justifica es que la rotura
   * que evita no se vería —compila, no lanza, y el único síntoma sería un
   * número distinto en el log de arranque—, y que el dato de entrada cambia
   * cada vez que entra una tanda de sitios nueva.
   */
  for (const { via } of callejero.sugeribles) {
    if (via.portales === 0) {
      continue;
    }
    nombreDeVia.set(via.codigo, via.limpio);
    const nombre = sinElTipo(paraComparar(via.limpio), TIPOS_DEL_CALLEJERO);
    const suyas = viasPorNombre.get(nombre);
    if (suyas) {
      suyas.push(via.codigo);
    } else {
      viasPorNombre.set(nombre, [via.codigo]);
      const primera = nombre.split(' ')[0]!;
      const conEsa = nombresPorPrimeraPalabra.get(primera);
      if (conEsa) {
        conEsa.push(nombre);
      } else {
        nombresPorPrimeraPalabra.set(primera, [nombre]);
      }
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
    nombresPorPrimeraPalabra,
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
    const exactas = gacetero.viasPorNombre.get(nombre) ?? [];

    /**
     * ⭐ Y LAS CANDIDATAS POR SUBSECUENCIA (nº14). Un nombre del callejero que
     * quepa dentro del escrito también es candidato: «doctor palomar» dentro de
     * «doctor alejandro palomar». Se buscan por el índice de primera palabra
     * para no recorrer el callejero entero.
     */
    const palabras = nombre.split(' ');
    const porDentro: string[] = [];
    for (const palabra of palabras) {
      for (const otro of gacetero.nombresPorPrimeraPalabra.get(palabra) ?? []) {
        if (otro !== nombre && esSubsecuencia(otro.split(' '), palabras)) {
          porDentro.push(...(gacetero.viasPorNombre.get(otro) ?? []));
        }
      }
    }
    if (exactas.length === 0 && porDentro.length === 0) {
      continue;
    }

    /**
     * ⭐ LA ELECCIÓN, y su orden está declarado porque no es obvio.
     *
     * 1. **La guarda de cercanía se le pasa a TODAS las candidatas**, lleguen
     *    por clave exacta o por subsecuencia: una vía sin ninguna puerta a
     *    ≤50 m del punto no es la vía de ese punto. Es la regla de la nº13
     *    —la geo-similitud manda sobre la de cadenas— aplicada sin excepción.
     * 2. Entre las que la superan, **gana la clave exacta**: que el callejero
     *    escriba el nombre igual es una afirmación más fuerte que una
     *    subsecuencia, que es una inferencia nuestra.
     * 3. Y entre varias subsecuencias, **la más cercana**.
     *
     * ⚠️ 4. **Si NINGUNA la supera, se cae a la clave exacta única**, y esto es
     *    lo que protege el desvío del datum: las cuatro farmacias corridas 236 m
     *    están a 53-236 m de su propia vía, así que ninguna candidata pasaría la
     *    guarda y sin este escalón dejarían de rescatarse — que es justo lo que
     *    la validación espacial existe para hacer. La guarda decide **entre**
     *    candidatas; no es un veto sobre lo que el dato afirma por su nombre.
     */
    const cerca = (v: string): boolean =>
      metrosALaVia(gacetero, v, lon, lat) <= UMBRAL_DE_DESVIO_M;
    const exactasCerca = exactas.filter(cerca);
    const dentroCerca = porDentro.filter(cerca);

    let via: string;
    if (exactasCerca.length > 0) {
      via = exactasCerca.length === 1 ? exactasCerca[0]! : laMasCercana(gacetero, exactasCerca, lon, lat);
    } else if (dentroCerca.length > 0) {
      via = dentroCerca.length === 1 ? dentroCerca[0]! : laMasCercana(gacetero, dentroCerca, lon, lat);
    } else if (exactas.length === 1) {
      via = exactas[0]!;
    } else {
      continue;
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

/**
 * ⭐ ¿Son las palabras de `dentro` una SUBSECUENCIA de las de `fuera`?
 *
 * En orden, y sin exigir que vayan seguidas: `[doctor, palomar]` cabe dentro de
 * `[doctor, alejandro, palomar]`. Es lo que hace falta para el caso de la nº14,
 * donde el Ayuntamiento escribe la dirección con el nombre de pila —«Doctor
 * Alejandro Palomar»— y el callejero registra la calle sin él.
 *
 * ⚠️ **Compara PALABRAS ENTERAS, y por eso no reabre el fantasma de la tanda
 * 1**: «mina» no cabe dentro de «contamina», porque no son la misma palabra —
 * lo eran como subcadenas, que es lo que aquel emparejador flojo hacía y lo que
 * costó 13.680 m de mentira. Y se exigen **dos palabras como mínimo**: un
 * nombre de una sola cabría dentro de medio callejero.
 *
 * ⭐ **Se exporta para poder probarla sola, y hace falta.** La contraprueba lo
 * pidió: cambiándola para que comparase TROZOS en vez de palabras, **las 277
 * pruebas seguían verdes** — porque la guarda de cercanía descarta después las
 * candidatas absurdas que eso genera, y el resultado final no se mueve. La
 * guarda tapa el fallo, pero taparlo no es lo mismo que no tenerlo: el día que
 * la guarda cambie, esta regla tiene que seguir siendo la que es. Es el mismo
 * motivo por el que `enPalabras` y `sinRepetidos` están exportadas.
 */
export function esSubsecuencia(dentro: readonly string[], fuera: readonly string[]): boolean {
  if (dentro.length < 2) {
    return false;
  }
  let i = 0;
  for (const palabra of fuera) {
    if (i < dentro.length && dentro[i] === palabra) {
      i++;
    }
  }
  return i === dentro.length;
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
