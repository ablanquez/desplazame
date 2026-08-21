/**
 * EL CONTRATO entre el motor y la interfaz.
 *
 * Este fichero no emite nada: son tipos y solo tipos. Se consume con
 * `import type`, así que desaparece al compilar y no llega al navegador ni al
 * servidor. Su única función es que **no haya dos copias del contrato**: el
 * motor y la interfaz miran el mismo fichero, enlazado por el symlink del
 * workspace. Si el motor cambia aquí la forma de una respuesta, la interfaz
 * deja de compilar. Eso es a propósito.
 *
 * Regla de crecimiento: **el contrato crece cuando el motor lo pide**, no
 * antes. Lo que hoy no se puede derivar de la pantalla ni de CLAUDE.md se
 * queda escrito como NO CONSTA, no se rellena con lo probable.
 */

/**
 * Los cuatro modos de transporte. Excluyentes: solo uno a la vez.
 * Derivado de la pantalla, que ya los maneja como estos cuatro literales.
 */
export type Modo = 'andando' | 'bus' | 'bici' | 'coche';

/**
 * Un punto del mapa: **latitud y longitud, en ese orden** (EPSG:4326, el CRS
 * de todos los datos del repositorio).
 *
 * No está en la lista de CLAUDE.md, pero «geometría» necesita un punto con
 * el que expresarse. El orden [lat, lon] es el que la pantalla ya usa —y el
 * contrario al de los ficheros GeoJSON, que vienen [lon, lat]: la inversión
 * ocurre al leer el dato, no aquí.
 */
export type Vertice = readonly [number, number];

/**
 * La clase de giro de un paso. **La pantalla dibuja la flecha a partir de
 * esto**, no del texto: parsear una frase para saber si va una flecha a la
 * derecha sería atarse a la redacción.
 *
 * [DOC Valhalla] Los nueve del medio son los que clasifica
 * `valhalla/baldr/turn.cc` por el ángulo entre tramos, leídos de la fuente:
 * 0-10 recto · 11-44 ligera derecha · 45-135 derecha · 136-159 cerrada
 * derecha · 160-200 media vuelta · 201-224 cerrada izquierda · 225-315
 * izquierda · 316-349 ligera izquierda · 350-359 recto.
 *
 * `salida` y `llegada` no son giros: son el primer paso y el último, que en el
 * formato de Google llevan icono propio.
 */
export type Giro =
  | 'salida'
  | 'recto'
  | 'ligera-derecha'
  | 'derecha'
  | 'cerrada-derecha'
  | 'media-vuelta'
  | 'cerrada-izquierda'
  | 'izquierda'
  | 'ligera-izquierda'
  | 'llegada';

/**
 * Un paso de las indicaciones escritas.
 *
 * `metros` son los del TRAMO QUE ESTE PASO ABRE, no los acumulados: es lo que
 * hace el formato de Google —«Gira a la derecha hacia Av. Goya · 450 m»—. El
 * paso de llegada lleva 0, porque no abre nada.
 *
 * Vienen redondeados desde el motor: al metro por debajo de 100, y a la decena
 * por encima. Un «447 m» fingiría una precisión que ni el grafo ni las piernas
 * tienen.
 *
 * **Lo que ya NO lleva es `detalle`.** Era un texto libre que el andamio
 * rellenaba con «2 min», y el motor de verdad no manda texto formateado: manda
 * el dato —`giro` y `metros`— y la pantalla decide cómo escribirlo. Aquella
 * duda quedó anotada como NO CONSTA en el punto 4; el punto 7 la resuelve.
 */
export interface Paso {
  readonly giro: Giro;
  readonly texto: string;
  readonly metros: number;
  /**
   * El mismo texto, **partido y marcado**, para que la pantalla pueda destacar
   * lo que hay que destacar sin volver a leer la frase.
   *
   * El formato objetivo es el de Google Maps, donde **la acción y el nombre de
   * la vía van en negrita** y el resto no. Eso podría resolverse mandando HTML
   * dentro de `texto`, y **no se hace**: el motor no decide con qué etiqueta se
   * pinta nada, y una cadena con `<strong>` dentro obliga a la interfaz a
   * confiar en ella o a escaparla. Aquí van los trozos **con su papel**, y
   * quien pinta elige la etiqueta.
   *
   * **`texto` sigue existiendo y sigue siendo la verdad**: es exactamente la
   * concatenación de las partes, y quien no quiera pintar nada lo usa tal cual.
   */
  readonly partes: readonly ParteDelPaso[];
}

/** Qué papel hace un trozo de la frase de un paso. */
export type PapelDeParte =
  /** «Gira a la derecha», «Continúa», «Sal de» — lo que hay que hacer. */
  | 'accion'
  /** El nombre de la vía. Solo cuando es un nombre de verdad: un tramo que se
   * narra por su tipo —«la acera»— no lo lleva, porque destacarlo lo haría
   * parecer un nombre. */
  | 'via'
  /** Lo que pega los otros dos: preposiciones, cardinales, el lado del portal. */
  | 'texto';

/** Un trozo de la frase de un paso, con su papel. */
export interface ParteDelPaso {
  readonly papel: PapelDeParte;
  readonly texto: string;
}

/**
 * Algo que quien busca la ruta tiene que saber: un corte, un tramo sin
 * carril, un dato que caducó.
 *
 * NO CONSTA todo lo demás: si un aviso lleva gravedad, categoría, o de qué
 * dato viene. CLAUDE.md solo lo nombra, y la pantalla hoy solo pinta texto.
 * Se queda en lo mínimo que un aviso necesita para poder mostrarse.
 */
export interface Aviso {
  readonly texto: string;
}

/**
 * A quién se le pide una ruta: `POST /api/ruta` recibe esto.
 *
 * **Por CÓDIGOS, como todo el formulario.** No van coordenadas ni nombres: van
 * el código de vía y el de portal que la pantalla fijó al elegir de la lista.
 * Es la ley de la entrada nº4 llevada hasta el final del tubo — si aquí se
 * aceptara texto, todo el cuidado del formulario no habría servido de nada.
 *
 * La vía viaja además del portal aunque el portal ya la determine: es lo que
 * permite contestar «esa vía no existe» distinto de «ese portal no existe», y
 * es una comprobación cruzada gratis.
 */
export interface PeticionDeRuta {
  readonly origen: { readonly via: string; readonly portal: string };
  readonly destino: { readonly via: string; readonly portal: string };
  readonly modo: Modo;
}

/**
 * Lo que devuelve `POST /api/ruta`: **pasos, geometría y avisos**, y desde el
 * punto 7 también los totales.
 *
 * `metros` es la distancia de red que se anda. **No incluye los conectores**
 * —el trocito entre la puerta y la calzada—, porque esos se andan de todos
 * modos salga uno por donde salga, y sumarlos sería cobrar por cruzar el
 * portal. Sí van dibujados en `geometria`, para que la línea salga de la
 * puerta y no del medio de la calle.
 *
 * `segundos` es **DERIVADO, no medido**: `metros / 5,0 km/h`. Nadie ha
 * cronometrado a nadie andando por Zaragoza; 5 km/h es la velocidad a pie de
 * manual, y va en el contrato dicha como lo que es para que la pantalla no la
 * enseñe como una promesa. No entran cuestas, semáforos ni esperas.
 *
 * `geometria` va en `[lat, lon]`, como todo `Vertice` — y **al revés que el
 * grafo**, que viene en `[lon, lat]`. La vuelta se da una sola vez, al escribir
 * la respuesta.
 *
 * Si no hay ruta, `pasos` y `geometria` vienen vacíos y el porqué está en
 * `avisos`. Una respuesta vacía bien formada, nunca un error.
 */
export interface Trayecto {
  readonly modo: Modo;
  readonly pasos: readonly Paso[];
  readonly geometria: readonly Vertice[];
  readonly avisos: readonly Aviso[];
  readonly metros: number;
  readonly segundos: number;
}

/**
 * Una vía que se puede sugerir al escribir la dirección: lo que devuelve
 * `GET /api/vias?q=…`.
 *
 * `nombre` viene **tal cual está en el callejero municipal**, sin maquillar:
 * en mayúsculas, y con el marcador de núcleo (`CALLE BURGOS ---CST`) si lo
 * trae. Se conserva porque es el dato.
 *
 * `limpio` y `nucleo` son ese mismo nombre **ya interpretado**, que es lo que
 * se enseña: `CALLE BURGOS` y `CASETAS`. El marcador es críptico y no debe
 * salir a pantalla, pero **tampoco puede perderse**: hay 52 nombres que se
 * repiten entre la ciudad y los barrios rurales, y el núcleo es lo único que
 * los distingue. `nucleo` es `null` en las vías de Zaragoza ciudad.
 *
 * El corte del sufijo y la búsqueda del núcleo los hace **el motor, en un
 * único sitio**: la interfaz no parsea nombres.
 *
 * La normalización (minúsculas, sin acentos) es solo para COMPARAR dentro del
 * motor; no sale al contrato.
 *
 * `portales` es cuántos portales tiene, contados sobre el censo municipal. No
 * es decoración: solo se sugieren vías con al menos uno, porque sugerir una
 * vía sin portales sería prometer una dirección que no se puede resolver.
 */
export interface Via {
  readonly codigo: string;
  readonly nombre: string;
  readonly limpio: string;
  readonly nucleo: string | null;
  readonly tipo: string;
  readonly portales: number;
}

/**
 * Un portal concreto de una vía: lo que devuelve `GET /api/portales?via=…`.
 *
 * `codigo` es el `portalId` del censo municipal (`Portales.96724`). Es lo que
 * la pantalla fija al elegir y lo que `/api/ruta` recibirá para saber de qué
 * puerta se habla — la ley de la entrada nº4 de la bitácora, desde el
 * nacimiento: **se elige un código, no se escribe un texto**.
 *
 * `numero` es el `displayNumber` del censo, TAL CUAL: es lo único que se
 * pinta. No siempre es un número —hay `9-11`, `1DP`, `71 TV C2`, `BL0 ESC1`—,
 * y por eso es `string` y no `number`. El municipio ya lo trae escrito para
 * leerse; aquí no se maquilla.
 *
 * **No lleva coordenadas a propósito.** El motor las tiene en memoria
 * indexadas por este mismo código, así que mandarlas al navegador sería
 * enviar 46.150 pares que nadie pinta. Cuando `/api/ruta` exista, pedirá el
 * código y las buscará él.
 */
export interface Portal {
  readonly codigo: string;
  readonly numero: string;
}

/**
 * Lo que devuelve `GET /api/portal-cercano?lat=&lon=`: el portal del censo que
 * cae más cerca de un punto, con **la vía a la que pertenece** y **a cuántos
 * metros está**.
 *
 * Lleva la `Via` y el `Portal` **enteros, y no sus códigos**, a propósito: son
 * exactamente las dos piezas que la pantalla fija cuando alguien elige a mano,
 * así que el botón «Mi ubicación» puede meterlas por el mismo camino en vez de
 * abrir uno paralelo. El formulario no se entera de que hubo GPS.
 *
 * `metros` es la distancia en línea recta —haversine—, no andando. Va en la
 * respuesta porque **quien decide si vale es la pantalla, no el motor**: el
 * motor contesta cuál es el más cercano aunque esté en la otra punta, y el
 * umbral se aplica arriba, donde se puede explicar al usuario.
 *
 * Sin `lat`/`lon`, o con valores que no son números o se salen de rango:
 * `null`, que es una respuesta bien formada y no un error — igual que la lista
 * vacía de `/api/vias`.
 */
export interface PortalCercano {
  readonly via: Via;
  readonly portal: Portal;
  readonly metros: number;
}

/**
 * Lo que el motor lleva de portales, y lo que le costó ponerlos en memoria.
 *
 * `total` tiene que coincidir con `SaludCallejero.portales`: son el mismo
 * censo contado una sola vez, porque el callejero ya no lo lee por su cuenta
 * —los recibe cargados—. Que aparezcan dos veces no es descuido: la guardia
 * comprueba que los dos números concuerdan, y así la redundancia trabaja.
 *
 * `vias` es cuántas vías tienen al menos un portal, y por la misma razón debe
 * coincidir con `SaludCallejero.sugeribles`.
 */
export interface SaludPortales {
  readonly total: number;
  readonly vias: number;
  readonly cargadoEnMs: number;
}

/**
 * Lo que el motor lleva del callejero, y lo que le costó cargarlo.
 *
 * Los dos números que importan y que llevan dos puntos del plan esperándose:
 * `vias` es el callejero entero, `sugeribles` las que tienen portal. **La que
 * se publica es `sugeribles`**: es lo único que el buscador puede cumplir.
 */
export interface SaludCallejero {
  readonly vias: number;
  readonly sugeribles: number;
  readonly portales: number;
  readonly cargadoEnMs: number;
}

/**
 * Lo que el motor lleva del grafo en memoria, y lo que le costó ponerlo ahí.
 *
 * Los tres recuentos salen del objeto cargado, no de una constante escrita a
 * mano: `aristas` y `vertices` se cuentan de verdad; `nodos` es el único que
 * el fichero solo declara —el grafo no trae lista de nodos, solo el contador—.
 * Sirven para que la guardia pueda distinguir un motor con el grafo cargado
 * de uno que arrancó sin él.
 */
export interface SaludGrafo {
  readonly nodos: number;
  readonly aristas: number;
  readonly vertices: number;
  readonly cargadoEnMs: number;
}

/**
 * Lo que el motor lleva de RED ROUTABLE, que no es lo mismo que el grafo.
 *
 * El grafo son 98.774 aristas sueltas sin nodos; la red es el subgrafo por el
 * que de verdad se puede andar, ya con su adyacencia reconstruida. Que los dos
 * aparezcan en la salud no es redundancia: **`aristas` aquí tiene que ser
 * MENOR que `SaludGrafo.aristas`**, y si algún día coincidieran sería que el
 * filtro de andable y componente dejó de aplicarse. La guardia lo comprueba.
 *
 * `nombres` es cuántos nombres de vía de OSM hay cargados (§ 1.14 del
 * notices): sin ellos las rutas se calculan igual, pero los pasos salen mudos.
 *
 * `heredados` es cuántos *ways* mudos han cogido su nombre del callejero
 * municipal por vecindad (§ 1.15). Es un número distinto y hace falta: un
 * motor puede tener los 19.897 nombres de OSM y no haber cruzado los ejes, y
 * entonces contesta rutas correctas con dos tercios de los pasos mudos. Sin
 * este campo, la guardia no sabría distinguir los dos casos.
 */
export interface SaludRed {
  readonly aristas: number;
  readonly nodos: number;
  readonly nombres: number;
  readonly heredados: number;
  /**
   * Cuántas aristas dejó fuera la **tabla de acceso del peatón**, sobre las que
   * ya habían pasado `a=1 ∧ c=0`. Hoy son todas `h=cycleway`.
   *
   * Se publica porque es el precio de la tabla, y un precio que no se ve no se
   * puede vigilar: si un día subiera sin que nadie hubiera cambiado la tabla,
   * sería el dato el que cambió.
   */
  readonly cerradas: number;
  readonly celdas: number;
  readonly cargadoEnMs: number;
}

/**
 * Lo que devuelve `GET /api/salud`. No sale de CLAUDE.md: es el primer
 * endpoint del motor y su forma la fija el encargo que lo pidió.
 *
 * `arrancado` es ISO 8601, la misma marca que la guardia de arranque usa
 * para saber si un servidor está caducado.
 */
export interface Salud {
  readonly ok: boolean;
  readonly pid: number;
  readonly arrancado: string;
  readonly grafo: SaludGrafo;
  readonly red: SaludRed;
  readonly callejero: SaludCallejero;
  readonly portales: SaludPortales;
}
