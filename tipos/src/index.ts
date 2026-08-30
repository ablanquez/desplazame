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
 * Los modos de transporte. Excluyentes: solo uno a la vez.
 *
 * Nacieron cuatro, derivados de la pantalla. **Son seis desde el 29/08**, y el
 * contrato crece porque el motor lo pide: la casilla 2 del punto 9 demostró
 * que la bici, el patín y la BiZi **no comparten tabla de acceso** —el VMP va
 * obligatoriamente por vía ciclista y solo baja a la calzada en la lista
 * cerrada del art. 56.3; la BiZi lleva encima el ámbito municipal de su
 * contrato—, así que meterlos en un solo `bici` obligaría a recortarle al
 * ciclista o a mentirle al patinetero.
 *
 * ⚠️ **La pantalla todavía enseña cuatro botones**, y es a propósito: el
 * selector a seis es la casilla 4. Que la lista de `modos` del buscador sea un
 * subconjunto no rompe nada —no es un `Record` exhaustivo—, y el día que se
 * amplíe no habrá que tocar el contrato.
 */
export type Modo = 'andando' | 'bus' | 'bici' | 'patin' | 'bizi' | 'coche';

/**
 * ⭐ QUÉ CLASE DE RUTA se quiere, cuando el modo admite elegir.
 *
 * El trío es el de [DOC CycleStreets, API oficial], que ofrece exactamente
 * estos tres —*«minimizar tiempo · evitar tráfico · el compromiso entre
 * ambos»*— y **recomienda el equilibrado como defecto de la interfaz**:
 * *«práctica, equilibra velocidad y agrado»*. Su `fastest` es para el
 * *«ciclista confiado»* y su `quietest` es *«más agradable, a menudo menos
 * directa»*.
 *
 * Tienen un cuarto, `shortest`, y **lo desaconsejan**. No está aquí: este
 * motor minimiza tiempo desde la casilla 3, y que ellos desaconsejen la
 * distancia es el aval de esa decisión.
 *
 * ⚠️ **Solo lo usan `bici` y `bizi`.** El `patin` lo ignora —su vía ciclista
 * es OBLIGATORIA [ORD art. 56.2.c], no una preferencia— y los demás modos no
 * lo miran. El motor no falla si llega en una petición de andando: sobra.
 */
export type TipoDeRuta =
  /** Minimizar tiempo, sin preferencias. El «fastest» de CycleStreets. */
  | 'rapida'
  /** El compromiso, y el defecto. Es el calibrado firmado en la casilla 3. */
  | 'equilibrada'
  /** Evitar el tráfico aunque cueste. El «quietest». */
  | 'tranquila';

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
 *
 * ⭐ **Y desde el 30/08 hay dos más que tampoco son giros: `coge` y `aparca`.**
 * Son los HITOS de un trayecto que cambia de vehículo por el camino — dejar la
 * bici en el aparcabicis y seguir a pie, coger una BiZi en su estación, dejarla
 * en la de destino—, y el contrato crece porque el motor lo pide: la casilla 5
 * parte la ruta de la bici en tres tramos y la 6 hace lo mismo con la BiZi.
 *
 * [DOC OSRM] su respuesta lleva un **campo `mode` por paso** y el cambio de
 * modo es un paso propio, con una suite entera *«de todos los empujes y cambios
 * de modo»*. Aquí no se estrena un campo: el cambio de modo **es** la maniobra,
 * y por eso viaja donde ya viajaba la clase de maniobra.
 *
 * Que vayan aquí y no en un campo aparte tiene además una consecuencia buscada:
 * la tabla de iconos de la pantalla es un `Record<Giro, string>` y **deja de
 * compilar** hasta que alguien les dibuje uno. Es la misma mecánica que cazó
 * las tres clases de sitio de educación el 27/08.
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
  /** Se coge el vehículo: la BiZi de su estación. Empieza a rodar. */
  | 'coge'
  /** Se deja: la bici propia en el aparcabicis, la BiZi en su anclaje. */
  | 'aparca'
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
/**
 * Un extremo elegido por dirección: la vía y el portal, los dos códigos.
 *
 * ⭐ **Y `portal` puede ser el código de la propia vía** (27/08). Las 619 vías
 * sin ningún portal —el PUENTE DE PIEDRA, la PLAZA CÉSAR AUGUSTO— se resuelven
 * por el punto medio de su geometría, y ese punto **no tiene código de portal
 * porque no hay ninguna puerta que nombrar**. Así que se identifica con el
 * código de la vía, y viaja el mismo en las dos casillas:
 * `{ via: '23125', portal: '23125' }`.
 *
 * Esto **no cambia la forma del contrato** y es a propósito: no se hace
 * opcional un campo, no se añade una tercera clase de extremo y la pantalla no
 * compone ningún código — manda dos veces el único que le dieron. Y no es una
 * excepción de aquí: en `foco` un código ya puede ser un portal, un sitio o una
 * vía, y quien lo convierte en punto es siempre el motor. **El mismo código
 * resuelve al mismo punto viaje por donde viaje.**
 *
 * La comprobación cruzada sigue haciendo su trabajo: el motor distingue «ese
 * portal no es de esa vía» de «ese punto de vía no es de esa vía» y de «ese
 * código no lo conocemos».
 */
export interface ExtremoPortal {
  readonly via: string;
  readonly portal: string;
}

/**
 * Un extremo elegido por su NOMBRE: solo el código del sitio.
 *
 * No lleva vía ni portal, y no es un olvido: **un sitio trae su propia
 * coordenada**, que es justo lo que hace que la casilla de portal se apague en
 * la pantalla (la regla del portal condicional, 19/08). Pedirle un portal a un
 * hospital sería pedirle un dato que no tiene.
 */
export interface ExtremoSitio {
  readonly sitio: string;
}

/**
 * Un extremo de la ruta: **o una dirección, o un sitio**.
 *
 * La unión obliga a la pantalla a decidir cuál manda antes de llamar, que es
 * exactamente lo que se quería: si mañana se añade un tercer modo de elegir
 * destino, esto deja de compilar hasta que alguien lo mire.
 */
export type ExtremoDeRuta = ExtremoPortal | ExtremoSitio;

export interface PeticionDeRuta {
  /**
   * ⭐ Los DOS extremos admiten las dos clases, y son simétricos.
   *
   * Nacieron asimétricos —el sitio solo valía de destino— y duró un día:
   * Antonio lo corrigió el 23/08 con la app delante, y el argumento no era de
   * gusto sino de mecánica. El botón ⇅ **cruza los dos lados enteros** desde el
   * punto 6; invertir hacia un origen que no admite sitios lo dejaba tonto,
   * teniendo que decidir qué tirar. Dos campos que se intercambian tienen que
   * aceptar lo mismo, o el intercambio no es tal.
   */
  readonly origen: ExtremoDeRuta;
  readonly destino: ExtremoDeRuta;
  /**
   * ⭐ **OPCIONAL desde el 29/08**, y `andando` cuando falta.
   *
   * Era obligatorio y una petición sin él no era una petición. Al entrar los
   * modos de la rueda se abre, y el defecto es el modo que ya existía: quien
   * pedía rutas antes las sigue pidiendo igual, y quien no dice nada recibe lo
   * que recibía. **Compatibilidad hacia atrás, no comodidad.**
   *
   * Ojo con la diferencia que el lector sí distingue: `modo` **ausente** es el
   * defecto; `modo` **presente y que no es una cadena** sigue sin ser una
   * petición. Un `7` ahí es un cliente roto, no un cliente antiguo.
   */
  readonly modo?: Modo;
  /**
   * ⭐ **OPCIONAL desde el 30/08**, y `equilibrada` cuando falta.
   *
   * Misma ley que `modo` el 29/08: quien pedía rutas antes las sigue pidiendo
   * igual y recibe **lo que recibía** — el calibrado de la casilla 3 es
   * exactamente el defecto, así que la compatibilidad es total y no aproximada.
   *
   * Lo miran `bici` y `bizi`. El `patin` lo ignora por ley [ORD art. 56.2.c] y
   * los demás modos no tienen ruta que calibrar.
   */
  readonly ruta?: TipoDeRuta;
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
  /**
   * ⭐ **Los TRAMOS del viaje** (30/08), en el orden en que se recorren.
   *
   * El contrato crece porque el motor lo pide, y esta vez lo pidió **el
   * pintado**: desde que un viaje puede cambiar de vehículo por el camino, la
   * pantalla necesita dibujar cada tramo con su trazo —el a-pie discontinuo, el
   * rodando sólido— y poner un icono donde se aparca o se coge la bici. Con una
   * `geometria` plana eso no se podía: **la coordenada del hito viaja** —hay un
   * vértice exactamente encima, a 0,0 m del dato— pero no se podía decir CUÁL.
   *
   * Derivarlo tampoco valía, y está medido: la única derivación posible —sumar
   * los `metros` de los pasos— falla porque esos metros vienen **redondeados a
   * propósito**. En el caso `COLOSO 2 → LEOPOLDO ROMEO 27` en BiZi la suma
   * deriva **10 m** y pone el corte en el vértice 198 cuando el bueno es el
   * 200: **6,9 m** de error, con el icono cayendo en mitad de la calle.
   *
   * **Siempre hay al menos uno.** Una ruta a pie de las de siempre trae un solo
   * tramo que cubre la geometría entera; que sea obligatorio y no opcional es a
   * propósito, para que quien pinta tenga un único camino y no dos.
   */
  readonly tramos: readonly TramoDelViaje[];
}

/**
 * ⭐ UN TRAMO DEL VIAJE: un trecho que se recorre **de una sola manera**.
 *
 * [DOC OpenTripPlanner / Digitransit] su itinerario es una lista de `legs`, y
 * cada *leg* lleva su `mode`. Esto es eso mismo: la respuesta ya venía partida
 * por dentro —andar hasta la estación, pedalear, andar el resto— y lo único que
 * cambia es que ahora se publica.
 *
 * ⭐ **Y el tramo que se EMPUJA es `andando`**, no un tercer estado. Quien lleva
 * el vehículo en la mano es peatón [RGC art. 121.2] y va a paso de peatón, así
 * que decir que va rodando sería falso. [DOC OSRM] su respuesta hace lo mismo:
 * el tramo desmontado es **un modo propio** dentro de la ruta en bici, con su
 * suite de pruebas de cambios de modo. La consecuencia buena es que quien pinta
 * **no necesita saber que el empuje existe**: pinta lo que va a pie de una
 * manera y lo que va sobre ruedas de otra.
 */
export interface TramoDelViaje {
  /** Cómo se recorre este trecho. El empujado es `andando`: se va a pie. */
  readonly comoSeVa: 'andando' | 'rodando';
  /**
   * Índice del **primer** vértice de este tramo dentro de `Trayecto.geometria`,
   * y del **último**. Los dos son inclusivos y **el último de un tramo es el
   * primero del siguiente**: el vértice de la costura pertenece a los dos, para
   * que las líneas pintadas se toquen en vez de dejar un hueco.
   *
   * El primer tramo empieza en `0` y el último acaba en `geometria.length − 1`.
   */
  readonly desde: number;
  readonly hasta: number;
  /**
   * Los metros y los segundos de ESTE tramo, ya redondeados. **Suman
   * exactamente `Trayecto.metros` y `Trayecto.segundos`**: se redondean por
   * fronteras acumuladas, no uno a uno, para que lo que se lee en pantalla
   * cuadre al sumarlo.
   */
  readonly metros: number;
  readonly segundos: number;
  /**
   * ⭐ El HITO en el que muere este tramo, o `null` si solo cambia la manera de
   * ir.
   *
   * Va aquí y no se deduce, y esa es la diferencia entre pintar y adivinar: en
   * un viaje en BiZi hay costuras de dos clases —donde se coge la bici y donde
   * se deja de empujar—, y por `comoSeVa` son idénticas. Quien pinta pone el
   * icono donde esto no es `null`, en `geometria[hasta]`, que es el vértice que
   * cae **a 0,0 m** de la estación o del aparcabicis.
   *
   * Son los mismos dos valores que `Giro` usa para los pasos del hito, y es a
   * propósito: el mismo suceso se llama igual en los dos sitios.
   */
  readonly hito: 'coge' | 'aparca' | null;
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
 * es decoración, y desde el 27/08 dice **más** que un recuento: **`0` significa
 * que esta vía no tiene ninguna puerta que elegir**, y es lo que la pantalla
 * mira para no enseñar la casilla del Nº — el revelado condicional de GOV.UK,
 * el mismo que ya se aplica a los sitios.
 *
 * Antes, `0` no llegaba nunca: solo se sugerían vías con portal, porque
 * sugerir una sin ellos era prometer una dirección irresoluble. Ya no lo es —
 * esas vías se resuelven por el punto medio de su geometría—, así que el `0`
 * viaja y hay que saber leerlo.
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
 * Un SITIO que se puede elegir como destino por su nombre: lo que devuelve
 * `GET /api/sitios?q=…`.
 *
 * [DOC Pelias] Un sitio es una **capa aparte** de las calles —`layers`, y
 * `venue` es la de los establecimientos—: una calle y un local no son la misma
 * clase de cosa aunque se escriban en la misma casilla. Por eso viaja en su
 * propio tipo y la pantalla puede distinguirlos a la vista.
 *
 * `presentacion` es **lo único que se lee**, y viene compuesto por el motor:
 * «Farmacia · Avda. de Navarra, 65». No es el título del dato — ese trae, en
 * 274 de las 313 farmacias, el nombre de la persona titular, y **no sale del
 * motor**. Se cuenta en la ficha de § 1.16 y se queda ahí. La interfaz no
 * compone nombres ni parsea direcciones: lee lo que le dan.
 *
 * `categoria` va aparte de la presentación para que la pantalla pueda agrupar
 * o poner un icono el día que haya más de una, sin volver a partir el texto.
 *
 * ⭐ **Solo se sugieren sitios CON coordenada.** «Sin coordenada no existe»: un
 * destino que no se puede situar no se puede enrutar. Los que no la traen se
 * cuentan en `/api/salud` y no llegan nunca a esta lista.
 */
/**
 * ⭐ QUÉ CLASE DE SITIO ES. La clave de máquina, no la etiqueta.
 *
 * Va aparte de `categoria` a propósito: `categoria` es **lo que se lee**
 * —«Centro de salud»— y puede cambiar de redacción cualquier día; esto es lo
 * que la pantalla usa para **elegir el icono**, y atar un dibujo a un texto
 * visible sería atarlo a la redacción. La unión obliga además a que, el día que
 * entre una clase nueva, la tabla de iconos deje de compilar en vez de pintar
 * un hueco — la misma mecánica que `Record<Giro, string>` en las flechas. Y
 * cumplió: la cuarta, `biblioteca` (25/08), no compiló hasta tener su dibujo, y
 * las tres de educación (27/08) volvieron a no compilar las tres a la vez.
 *
 * ⭐ **Y la partición de educación en TRES no es nuestra**: es la de la
 * taxonomía de OpenStreetMap [Education features], firmada por Antonio el
 * 25/08. `amenity=school` cubre de los ~6 a los ~18 años y mete **varios
 * niveles en un solo elemento** —por eso los 62 centros que hacen colegio e
 * instituto a la vez no se parten en dos—, `amenity=kindergarten` es el
 * preescolar (y `preschool` quedó obsoletado a su favor), y
 * `amenity=university` es el campus terciario. La FP va con los institutos
 * porque en España vive en los IES y los CIFP.
 */
export type TipoDeSitio =
  | 'farmacia'
  | 'centro-salud'
  | 'hospital'
  | 'biblioteca'
  | 'colegio'
  | 'guarderia'
  | 'universidad';

export interface Sitio {
  /** `Farmacias.8691`, con el mismo patrón que el código de portal. */
  readonly codigo: string;
  /**
   * Lo que se enseña. **No se compone igual en las tres clases**, y es
   * decisión de presentación, no de dato:
   *
   * · farmacia → «Farmacia · Avda. de Navarra, 65». El título del dato lleva
   *   el nombre de la persona titular y NO sale de aquí (§ 1.16).
   * · centro de salud y hospital → «Hospital Universitario Miguel Servet ·
   *   Avda. Isabel La Católica, 3». Aquí el título es institucional —el nombre
   *   del edificio— y es justo lo que alguien escribe para buscarlo (§ 1.18).
   */
  readonly presentacion: string;
  /**
   * Como se lee: «Farmacia», «Centro de salud», «Hospital», «Biblioteca»,
   * «Colegio o instituto», «Guardería», «Universidad».
   */
  readonly categoria: string;
  /** De qué clase es, para el icono. Ver `TipoDeSitio`. */
  readonly tipo: TipoDeSitio;
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
 * coincidir con `SaludCallejero.sugeribles` **menos
 * `SaludCallejero.porPuntoMedio`**: hasta el 27/08 era `sugeribles` a secas,
 * porque entonces sugerible y con-portal eran la misma cosa.
 */
export interface SaludPortales {
  readonly total: number;
  readonly vias: number;
  readonly cargadoEnMs: number;
}

/**
 * Lo que el motor lleva del callejero, y lo que le costó cargarlo.
 *
 * `vias` es el callejero entero y `sugeribles` lo que el buscador puede
 * cumplir. **La que se publica es `sugeribles`**.
 *
 * ⭐ `porPuntoMedio` parte esa cifra en sus dos mitades (27/08), y el contrato
 * crece porque el motor lo pide: desde que las vías sin portal entran,
 * `sugeribles` ya no significa «las que tienen portal» y **la guardia se quedó
 * sin poder cuadrar la redundancia**. Con esto vuelve a poder:
 * `sugeribles − porPuntoMedio` tiene que valer exactamente
 * `SaludPortales.vias`, y esa resta comprueba que la partición cierra.
 *
 * La diferencia `vias − sugeribles` son las que se quedan fuera por no poderse
 * situar: sin eje en la capa municipal, o con la multilínea vacía.
 */
export interface SaludCallejero {
  readonly vias: number;
  readonly sugeribles: number;
  readonly porPuntoMedio: number;
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
