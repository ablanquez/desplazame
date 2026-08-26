import { Component, computed, inject, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
// El contrato manda: los tipos vienen del paquete compartido, no de copias
// locales. Si el motor cambia la forma, esta pantalla deja de compilar.
import type {
  Giro,
  Modo,
  PeticionDeRuta,
  Portal,
  PortalCercano,
  Trayecto,
  Via,
  ExtremoDeRuta,
  Sitio,
} from '@desplazame/tipos';
import { HttpClient } from '@angular/common/http';
import { Mapa } from './mapa';
import { AutocompletarVia, comoSeVeLaVia } from './autocompletar-via';
import { SelectorPortal } from './selector-portal';
import { IconoCapa, type Clase } from './iconos';

/**
 * ⭐ EL MAPEO GIRO → FLECHA. Diez giros, diez glifos, y ni una dependencia.
 *
 * **La flecha sale del `giro`, nunca del `texto`.** Es lo que el contrato dice
 * de `Giro` —*«la pantalla dibuja la flecha a partir de esto»*— y la razón es
 * que parsear la frase para ver si lleva la palabra «derecha» ataría el icono a
 * la redacción de los pasos: cambiar «Gira a la derecha» por «Tuerce a la
 * derecha» dejaría el mapa de flechas roto sin que nada se pusiera rojo.
 *
 * **Son caracteres, no imágenes y no una librería de iconos.** El repositorio
 * no añade dependencias, y aquí no hacía falta ninguna: Unicode trae la familia
 * entera de flechas con codo. Los tres tamaños de giro se leen por dónde apunta
 * la PUNTA, contando que se va hacia arriba: 45° (`↗`), 90° (`↱`), y más de 135°
 * la punta ya baja (`⬎`), que es doblarse sobre uno mismo. La media vuelta es el
 * gancho `↩`. Y la salida y la llegada no son giros —lo dice el contrato—, así
 * que llevan marca propia: el punto de partida y la bandera, como en la captura
 * de Google.
 *
 * `Record<Giro, string>` no es adorno de tipos: **obliga a que estén los diez**.
 * Si el motor añadiera un giro al contrato —una rotonda, por ejemplo—, esta
 * tabla dejaría de compilar en vez de pintar un hueco en blanco.
 */
const FLECHAS: Readonly<Record<Giro, string>> = {
  salida: '◉',
  recto: '↑',
  'ligera-derecha': '↗',
  derecha: '↱',
  'cerrada-derecha': '⬎',
  'media-vuelta': '↩',
  'cerrada-izquierda': '⬐',
  izquierda: '↰',
  'ligera-izquierda': '↖',
  llegada: '⚑',
};

/**
 * Cómo se dice la velocidad con la que el motor deriva la duración.
 *
 * **Va escrita al lado del tiempo, siempre**, y esa es toda su razón de ser: el
 * contrato dice de `Trayecto.segundos` que es *«DERIVADO, no medido»* —
 * `metros / 5,0 km/h`, sin cuestas, sin semáforos y sin esperas—. Un «4 min» a
 * secas se leería como una promesa cronometrada, y aquí no se ha cronometrado a
 * nadie andando por Zaragoza.
 *
 * Si el motor cambiara su velocidad, esta cadena se quedaría mintiendo: el
 * número vive en `motor/src/trayecto.ts` (`VELOCIDAD_MS`) y aquí solo se
 * REPITE. No hay forma de atarlos sin meter el número en el contrato, y meterlo
 * sería que la pantalla recalculara lo que el motor ya calculó.
 */
const VELOCIDAD_DICHA = '5 km/h';

/**
 * ⭐ EL UMBRAL DE PRECISIÓN: cuánto radio de confianza se acepta.
 *
 * [DOC MDN] `coords.accuracy` es *«a strictly positive double representing the
 * accuracy, with a 95% confidence level, of the latitude and longitude,
 * expressed in meters»*. No es un adorno: es lo único que separa un GPS de un
 * reposicionamiento por IP, que puede clavar el centro de la ciudad con un
 * radio de kilómetros y llegar aquí con la misma cara que una posición buena.
 *
 * 100 m es un corte GRUESO a propósito, y **no está medido aquí**: no se puede
 * medir desde el proyecto, porque depende del aparato de quien lo use. Lo que
 * sí se sabe es que la trilateración por wifi de un portátil se mueve en
 * decenas de metros y el reposicionamiento por IP en kilómetros — dos órdenes
 * de magnitud entre uno y otro, así que el corte no necesita ser fino. Y
 * pasarse sale barato: el campo queda editable a mano.
 */
const PRECISION_MAXIMA_M = 100;

/**
 * ⭐ EL UMBRAL DE DISTANCIA: cuán lejos puede quedar el portal más cercano para
 * que decir «estás en él» siga siendo verdad.
 *
 * MEDIDO sobre el censo, no supuesto. Desde puntos de calle de Zaragoza el
 * portal más cercano queda a: Paseo Independencia 8 m, Plaza España 12 m,
 * Casetas 22 m, Plaza del Pilar 42 m, Estación Delicias 78 m, recinto Expo
 * 100 m. 150 m los acepta todos con holgura.
 *
 * **Lo que este número NO hace, y hay que decirlo: no comprueba si estás en
 * Zaragoza.** Se midió si podía, y no puede. El Polígono PLAZA está en
 * Zaragoza y su portal más cercano queda a 1.423 m — más lejos que el centro
 * de Utebo, que no lo está (1.387 m). La ventana está invertida y no hay corte
 * que separe los dos grupos; un rectángulo tampoco sirve, porque Utebo,
 * Cuarte, Villanueva de Gállego y María de Huerva caen dentro del que abarca
 * el censo.
 *
 * Por eso el mensaje habla de la distancia al portal y NO del término
 * municipal: decir «no estás en Zaragoza» sería decírselo a alguien parado en
 * Movera (853 m) o en Juslibol (662 m), que sí lo están.
 */
const DISTANCIA_MAXIMA_M = 150;

/**
 * Con qué se le pide la posición al navegador. Las tres opciones, declaradas.
 *
 * [DOC MDN] `maximumAge: 0` significa que *«the device cannot use a cached
 * position and must attempt to retrieve the real current position»*. Es el
 * valor por defecto y se escribe igual, porque aquí es una decisión: una
 * posición guardada de otro barrio rellenaría una dirección equivocada sin que
 * nada lo delatara.
 *
 * [DOC MDN] `timeout` por defecto es `Infinity`, y entonces *«getCurrentPosition()
 * won't return until the position is available»*. Un botón que se queda
 * pensando para siempre no es un botón: 10 segundos y se dice que no se pudo.
 *
 * [DOC MDN] `enableHighAccuracy: true` pide que *«the application would like to
 * receive the best possible results»*, a cambio de *«slower response times or
 * increased power consumption»*. Se paga: lo que se está buscando es un portal
 * concreto, no un barrio.
 */
const OPCIONES_UBICACION: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/** [DOC MDN] Los tres códigos de `GeolocationPositionError`, con su número. */
const PERMISO_DENEGADO = 1;
const POSICION_NO_DISPONIBLE = 2;
const SE_AGOTO_EL_TIEMPO = 3;

/**
 * Un mensaje por cada fallo tipado, en ámbar y en cristiano.
 *
 * Ninguno se disculpa ni echa la culpa: dicen qué ha pasado, qué se puede
 * hacer al respecto si se puede, y que la calle siempre se puede escribir a
 * mano — que es la salida que nunca falla.
 */
const MENSAJES_DE_FALLO: Readonly<Record<number, string>> = {
  [PERMISO_DENEGADO]:
    'Sin permiso de ubicación. Puedes dárselo al navegador en el candado de la ' +
    'barra de direcciones, o escribir la calle a mano.',
  [POSICION_NO_DISPONIBLE]:
    'El navegador no ha podido averiguar dónde estás. Inténtalo otra vez, o ' +
    'escribe la calle a mano.',
  [SE_AGOTO_EL_TIEMPO]:
    'Se ha tardado demasiado en localizarte. Inténtalo otra vez, o escribe la ' +
    'calle a mano.',
};

/**
 * El estado de UN lado de la dirección: su calle y su portal, cada uno con lo
 * escrito, lo elegido y si ya se salió de él.
 *
 * **Vive aquí, en el padre, y no dentro de cada campo.** Los campos siguen
 * siendo quienes lo escriben cuando el usuario teclea o pulsa una sugerencia
 * —el camino de `elegir()` no se toca, que es la ley de la entrada nº4—, pero
 * quien lo GUARDA es la pantalla. Hizo falta porque hay dos gestos que fijan
 * una dirección sin que nadie teclee: invertir origen⇄destino y «Mi
 * ubicación». Con el estado encerrado en el campo no había puerta por donde
 * entrar —medido: su API pública era `['constructor']`—, y rellenar solo el
 * texto habría sido el fallo de la nº4 con otro disfraz.
 */
function ladoVacio() {
  return {
    /**
     * ⭐ QUÉ SE ESTÁ BUSCANDO en este lado: una dirección o una categoría de
     * sitio. Lo elige el desplegable que hay delante del cajetín.
     *
     * **`via` por defecto** —«Dirección»— y es [PROPIO] declarado: abrir la
     * pantalla tiene que comportarse como se comportaba ayer. Quien nunca toque
     * el desplegable no se entera de que existe.
     *
     * Es el mismo tipo que usan los iconos, y no una copia: lo que el campo
     * BUSCA y lo que el icono DIBUJA son la misma pregunta —«¿qué clase de cosa
     * es esto?»— y tenerlo dos veces sería tenerlo mal una de las dos.
     */
    tipo: signal<Clase>('via'),
    /** Lo escrito en el campo de calle. */
    calle: signal(''),
    /** La vía elegida de la lista. Guarda el CÓDIGO, no solo el texto. */
    via: signal<Via | null>(null),
    /** Si ya se salió del campo de calle: antes de eso no se regaña. */
    calleTocada: signal(false),
    /** Lo escrito en el campo de portal, que es filtro y es lo que se lee. */
    portalTexto: signal(''),
    /**
     * El portal elegido de la lista de la vía. Guarda el CÓDIGO, no el número
     * escrito — como la vía, y por la misma razón: un `12` tecleado no
     * identifica ninguna puerta, y podía no existir.
     */
    portal: signal<Portal | null>(null),
    /** Si ya se salió del campo de portal. */
    portalTocado: signal(false),
    /**
     * ⭐ El SITIO elegido en este lado, o `null` si aquí hay una dirección.
     *
     * Vive **dentro del lado** y no suelto, y esa es toda la mecánica de la
     * simetría del 23/08: el ⇅ intercambia lados enteros, así que el sitio
     * cruza con lo demás **sin una sola línea que hable de él**. Cuando estuvo
     * fuera —un día— el botón tenía que decidir qué hacer con él, que es
     * justamente la decisión que no había que tomar.
     *
     * Un lado tiene vía+portal **o** sitio, nunca las dos: elegir una cosa
     * apaga la otra.
     */
    sitio: signal<Sitio | null>(null),
  };
}

/** Un lado del formulario, ya montado. */
type Lado = ReturnType<typeof ladoVacio>;

/** Cambia de sitio los valores de dos señales. Sin mirar lo que llevan. */
function intercambiar<T>(a: WritableSignal<T>, b: WritableSignal<T>): void {
  const guardado = a();
  a.set(b());
  b.set(guardado);
}

/**
 * Lo que hay pintado abajo: **el trayecto que contestó el motor, y las dos
 * direcciones tal como estaban cuando se pidió**.
 *
 * Las direcciones se guardan aquí en vez de leerse del formulario a propósito.
 * Después de generar, el formulario sigue vivo: se puede cambiar una calle sin
 * volver a pulsar, y entonces la cabecera diría de dónde a dónde va una ruta
 * que no es la que está en el mapa. Guardándolas con el resultado, lo que se
 * lee arriba y lo que se ve abajo son siempre la misma cosa.
 *
 * Y por eso es UNA señal y no cuatro: cuatro señales pueden quedarse a medio
 * actualizar; un objeto entero, no.
 */
interface Resultado {
  readonly origen: string;
  readonly destino: string;
  /**
   * ⭐ De qué clase era cada extremo **cuando se pidió la ruta**.
   *
   * Se guarda aquí por el mismo motivo que los nombres, y no es un detalle: si
   * el icono se leyera del formulario, cambiar el destino a una farmacia
   * después de generar pondría una cruz verde en el mapa de una ruta que va a
   * un portal. La cabecera, los marcadores y los pasos cuentan siempre la
   * misma ruta porque salen todos del mismo objeto.
   */
  readonly capaOrigen: Clase;
  readonly capaDestino: Clase;
  readonly trayecto: Trayecto;
}

/** Cómo se escribe una dirección municipal completa: «CALLE BURGOS [CASETAS] 4». */
function comoSeLeeLaDireccion(via: Via, portal: Portal): string {
  return `${comoSeVeLaVia(via)} ${portal.numero}`;
}

/**
 * Los metros como se leen, no como se guardan.
 *
 * Por debajo del kilómetro, tal cual vienen: el motor ya los redondea —al metro
 * hasta 100, a la decena por encima—, así que aquí no se vuelve a tocar. Por
 * encima, en kilómetros con un decimal, que es como se dice una distancia larga
 * a pie: «3,5 km», no «3.482 m».
 */
function comoSeLeenLosMetros(metros: number): string {
  if (metros < 1000) {
    return `${metros} m`;
  }
  return `${(metros / 1000).toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

/**
 * La duración, **dicha como lo que es**: una división, no un cronómetro.
 *
 * Por debajo del minuto no se redondea a «~1 min», que sería inflar siete
 * segundos hasta sesenta: se dice «menos de 1 min», que es verdad y es igual de
 * corto. El porqué del «a 5 km/h» está en `VELOCIDAD_DICHA`.
 */
function comoSeLeeLaDuracion(segundos: number): string {
  if (segundos < 60) {
    return `menos de 1 min a ${VELOCIDAD_DICHA}`;
  }
  return `~${Math.round(segundos / 60)} min a ${VELOCIDAD_DICHA}`;
}

@Component({
  selector: 'app-buscador',
  imports: [Mapa, AutocompletarVia, SelectorPortal, IconoCapa],
  templateUrl: './buscador.html',
  styleUrl: './buscador.css',
})
export class Buscador {
  /**
   * Para preguntarle al motor por el portal más cercano.
   *
   * Aquí no vale `httpResource`, que es lo que usan los dos campos: aquel pide
   * solo cuando cambia una señal, y esto es un botón — se pregunta cuando se
   * pulsa, una vez, y con unas coordenadas que no existían un instante antes.
   */
  private readonly http = inject(HttpClient);

  /**
   * Qué lado pulsó «Mi ubicación». La geolocalización contesta por retrollamada
   * y el motor por HTTP, así que entre la pulsación y el relleno hay dos saltos
   * y nadie más lleva el dato.
   */
  private pidioUbicacion: Lado | null = null;

  /** Se está esperando a la posición o al motor: el botón no se repulsa. */
  protected readonly buscandoUbicacion = signal(false);

  /** Lo último que salió mal con la ubicación, para decirlo en ámbar. */
  protected readonly avisoUbicacion = signal<string | null>(null);

  /**
   * El orden en que se pintan los botones, y su texto.
   *
   * La `etiqueta` es lo ÚNICO visible, y sale por dos sitios: el botón y la
   * línea «Modo:» del resultado. El `id` es del contrato (`Modo`) y no se
   * toca: la rueda pequeña comparte la red ciclista, así que el patinete va
   * por el mismo modo `bici` — lo que cambia es que ahora se dice.
   *
   * **La palabra que va tras la barra lleva mayúscula en los dos botones que
   * la tienen**, y es una decisión de peso visual, no un despiste: la norma
   * pediría minúscula. En el README, que es prosa y no botón, va en minúscula.
   *
   * Y el de la bici no dice «VMP»: eso es jerga de ordenanza, y el botón habla
   * el idioma de quien lo pulsa.
   */
  protected readonly modos: ReadonlyArray<{ id: Modo; etiqueta: string }> = [
    { id: 'andando', etiqueta: 'Andando' },
    { id: 'bus', etiqueta: 'Bus / Tranvía' },
    { id: 'bici', etiqueta: 'Bici / Patinete' },
    { id: 'coche', etiqueta: 'Coche' },
  ];

  /** Los dos lados de la dirección. Misma forma, mismo trato. */
  protected readonly origen = ladoVacio();
  protected readonly destino = ladoVacio();

  /** Andando por defecto. */
  protected readonly modo = signal<Modo>('andando');

  /** Lo que contestó el motor la última vez. `null` mientras no se ha pedido. */
  protected readonly resultado = signal<Resultado | null>(null);

  /** Se está esperando al motor: el botón lo dice y no se repulsa. */
  protected readonly generando = signal(false);

  /** Lo que salió mal al pedir la ruta, para decirlo en ámbar. */
  protected readonly avisoRuta = signal<string | null>(null);

  /**
   * El trazado que se pinta en el mapa: **el del resultado, y nada más**.
   *
   * Derivado, no guardado aparte. Así no puede pasar que el mapa enseñe la
   * línea de una ruta y la lista los pasos de otra: si no hay resultado —o si
   * el que hay no trae geometría, como una isla del grafo— el mapa se queda
   * limpio solo.
   */
  protected readonly trazado = computed(() => this.resultado()?.trayecto.geometria ?? []);

  /**
   * El usuario ha elegido —o ha deshecho— la calle de un lado.
   *
   * Se cuelga de `(seleccionChange)`, y eso es **el camino del usuario**: el
   * campo solo emite cuando lo cambia quien teclea o quien pulsa la lista.
   * Cuando el cambio viene de esta misma clase (invertir, «Mi ubicación») el
   * campo NO emite, así que este método no corre. Medido antes de escribirlo:
   * escribir desde el padre da 0 avisos; escribir desde el hijo da 1.
   *
   * [DOC] Los tipos instalados lo dicen de una forma que se presta a leerlo al
   * revés: *«Whenever its value is updated, it emits to the output»*
   * (`@angular/core`, `ModelSignal`). El «its value is updated» es el hijo
   * escribiendo, no el padre atando la entrada — y esa diferencia, que la
   * frase no separa, es la que hay medida arriba.
   *
   * Esa asimetría es la que sostiene el botón de invertir, y es la razón de
   * que la atadura de la plantilla vaya DESAZUCARADA —`[seleccion]` más
   * `(seleccionChange)`— en vez de `[(seleccion)]`. [DOC] Angular da la forma
   * larga por uso legítimo: la corta es azúcar de las dos, y cuál se usa queda
   * *«up to the consumer»*. **No se "simplifique" a `[(…)]`**: con el azúcar el
   * padre no se entera de quién escribió, y invertir se autodestruye.
   *
   * Cambiar de calle TIRA el portal: el 12 de una calle no es el 12 de la
   * otra, y dejarlo puesto sería dejar fijado un código que ya no pertenece a
   * la dirección que se está componiendo. La regla estaba dentro del selector
   * de portal y ha subido aquí entera.
   */
  /**
   * ⭐ Al elegir un SITIO como destino.
   *
   * Apaga la vía y el portal del destino, porque elegir un sitio es elegir
   * OTRA COSA: dejar los restos de una dirección a medias haría que «Generar»
   * mandara una mezcla de las dos. Y al revés lo hace `alElegirVia`, que ya
   * limpiaba el portal cuando cambia la calle.
   */
  /**
   * ⭐ Al elegir un SITIO en un lado.
   *
   * Solo fija el sitio, y eso es **todo lo que hace falta**: para llegar a la
   * lista hay que haber tecleado, y teclear ya suelta la vía —`alEscribir` del
   * autocompletar pone la selección a `null`, y eso llega aquí como
   * `alElegirVia(lado, null)`, que limpia el portal y su texto—. La casilla de
   * portal se apaga sola por no tener vía, que es la regla del portal
   * condicional cumpliéndose sin una línea que hable de ella.
   *
   * Aquí hubo cuatro líneas más que repetían esa limpieza. Se quitaron el
   * 23/08: la contraprueba las mutó una a una y **las 98 pruebas seguían
   * verdes**, porque ningún gesto de una persona puede llegar a ellas. Código
   * que ninguna prueba puede tocar es código que nadie va a mantener.
   */
  protected alElegirSitio(lado: Lado, sitio: Sitio | null): void {
    lado.sitio.set(sitio);
  }

  /**
   * ⭐ Al cambiar el TIPO de un lado: se limpia el lado entero.
   *
   * Cambiar de carril es empezar la pregunta. Sin esto quedaría una farmacia
   * resuelta bajo la etiqueta «Dirección» —o una calle bajo «Hospitales»—, y no
   * sería solo feo: **«Generar» seguiría desbloqueado** y mandaría al motor un
   * extremo que no es el que se lee en la pantalla. Es la ley de la entrada nº4
   * otra vez, con el disfraz del 24/08.
   *
   * Se limpia TODO, incluidos los «tocado»: quien acaba de cambiar de tipo no
   * ha tenido tiempo de equivocarse todavía, y regañarle por un campo vacío que
   * él no ha vaciado sería regañarle por lo que hemos hecho nosotros.
   */
  protected alCambiarTipo(lado: Lado, tipo: Clase): void {
    lado.tipo.set(tipo);
    lado.calle.set('');
    lado.via.set(null);
    lado.calleTocada.set(false);
    lado.portalTexto.set('');
    lado.portal.set(null);
    lado.portalTocado.set(false);
    lado.sitio.set(null);
  }

  /**
   * ⭐ LO QUE DICE CADA OPCIÓN del desplegable, y **en qué orden se lee**.
   *
   * `Dirección` va **la primera y aparte**: es el defecto —lo que busca casi
   * todo el mundo— y además no es de la misma clase que las otras. Las otras
   * son categorías de sitio; esta es la calle y el portal de siempre. [GOV.UK
   * Design System] el ejemplo canónico de su `Select` es justo esto, un filtro
   * con su defecto marcado al principio.
   *
   * **Las demás van alfabéticas por su etiqueta** [PROPIO — la doctrina no dice
   * nada del orden de un filtro y aquí no hay ninguna jerarquía que respetar:
   * ninguna categoría es más importante que otra]. Hasta el 25/08 salían **en
   * el orden en que fueron llegando al proyecto** —farmacias, hospitales,
   * centros de salud, bibliotecas—, que es una historia nuestra y no le dice
   * nada a quien mira la lista.
   *
   * ⭐ **Y el orden no se escribe: se calcula.** La lista de abajo puede ir
   * como sea, porque `ordenadas` la ordena al construirla — así la categoría
   * que entre mañana **cae sola en su sitio** y nadie tiene que acordarse de
   * colocarla. Se ordena con `localeCompare('es')` y no comparando cadenas a
   * pelo, porque «Centros» y «Farmacias» se separan igual pero una «Ó» o una
   * «Ñ» no: el orden de un alfabeto lo decide su idioma, no su tabla de
   * códigos.
   */
  private static ordenadas(
    resto: ReadonlyArray<{ id: Clase; etiqueta: string }>,
  ): ReadonlyArray<{ id: Clase; etiqueta: string }> {
    return [...resto].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
  }

  protected readonly tipos: ReadonlyArray<{ id: Clase; etiqueta: string }> = [
    { id: 'via', etiqueta: 'Dirección' },
    ...Buscador.ordenadas([
      { id: 'farmacia', etiqueta: 'Farmacias' },
      { id: 'hospital', etiqueta: 'Hospitales' },
      { id: 'centro-salud', etiqueta: 'Centros de Salud' },
      { id: 'biblioteca', etiqueta: 'Bibliotecas' },
    ]),
  ];

  protected alElegirVia(lado: Lado, via: Via | null): void {
    lado.via.set(via);
    lado.portalTexto.set('');
    lado.portal.set(null);
    lado.portalTocado.set(false);
    // Elegir una calle apaga el sitio que hubiera: son las dos maneras de decir
    // a dónde, y no pueden estar puestas a la vez.
    if (via) {
      lado.sitio.set(null);
    }
  }

  /**
   * ⇅ Intercambia origen y destino, enteros.
   *
   * Cada lado viaja con TODO su estado: el texto, el código y si estaba
   * marcado. Un borrador cruza siendo borrador y sigue marcado al otro lado —
   * inventarle una vía porque «ya estaba escrito» sería justo el fallo de la
   * entrada nº4, y borrarlo por estar a medias sería tirarle al usuario lo que
   * había escrito.
   *
   * Nada de esto pasa por `alElegirVia`: se escriben las señales del padre
   * directamente, así que los campos NO emiten y la regla del portal no se
   * dispara. Es el reverso exacto del camino del usuario, y por eso invertir
   * no se deshace a sí mismo.
   *
   * Con este botón, «mi ubicación como destino» no necesita botón propio: se
   * pone en origen y se invierte.
   */
  protected invertir(): void {
    // ⭐ El TIPO primero, que desde el 24/08 es lo que decide qué casillas hay.
    // Cruzando el texto sin el tipo, el otro lado se quedaría con una farmacia
    // escrita bajo la etiqueta «Dirección» y con una casilla de número que no
    // le corresponde.
    intercambiar(this.origen.tipo, this.destino.tipo);
    intercambiar(this.origen.calle, this.destino.calle);
    intercambiar(this.origen.via, this.destino.via);
    intercambiar(this.origen.calleTocada, this.destino.calleTocada);
    intercambiar(this.origen.portalTexto, this.destino.portalTexto);
    intercambiar(this.origen.portal, this.destino.portal);
    intercambiar(this.origen.portalTocado, this.destino.portalTocado);
    // Y el sitio, que es un campo más del lado desde el 23/08.
    intercambiar(this.origen.sitio, this.destino.sitio);
  }

  /**
   * 📍 Rellena el ORIGEN con donde está quien mira la pantalla.
   *
   * El permiso lo pide el propio navegador al llamar [DOC MDN], así que aquí
   * no hay que preguntar nada antes. Exige contexto seguro: en local vale
   * `localhost`; en producción hará falta https, y eso es una casilla del
   * punto 12, no de aquí.
   *
   * ⚠️ Estuvo **solo en el origen** hasta el 24/08, con el argumento de que
   * para el otro lado ya estaba el ⇅. Antonio lo corrigió: dar dos pasos para
   * algo que cabe en uno no es economía, es un acertijo. Ahora está en los dos,
   * con los mismos umbrales y los mismos mensajes.
   */
  protected miUbicacion(lado: Lado): void {
    this.avisoUbicacion.set(null);
    // ⭐ Se apunta a QUIÉN lo pidió: hasta el 24/08 solo lo tenía el origen y
    // el destino se llenaba con el ⇅. Ahora está en los dos, así que la
    // respuesta —que llega dos saltos después— tiene que saber dónde caer.
    this.pidioUbicacion = lado;

    // Sin contexto seguro la API ni siquiera existe. Un botón que no hace nada
    // y no dice por qué es peor que no tener botón.
    if (!navigator.geolocation) {
      this.avisoUbicacion.set(
        'Este navegador no da la ubicación en esta página: hace falta una ' +
          'conexión segura (https). Escribe la calle a mano.',
      );
      return;
    }

    this.buscandoUbicacion.set(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => this.conLaPosicion(posicion),
      (fallo) => this.sinPosicion(fallo),
      OPCIONES_UBICACION,
    );
  }

  /**
   * Ya hay posición. Primera comprobación: **la precisión**.
   *
   * Va antes de preguntar al motor a propósito. Con un radio de kilómetros el
   * motor contestaría igual —siempre hay un portal más cercano— y contestaría
   * que estás a 30 m de un portal que no es el tuyo. El error no se vería por
   * ningún lado: ese es justo el caso que hay que cortar aquí.
   */
  private conLaPosicion(posicion: GeolocationPosition): void {
    const { latitude, longitude, accuracy } = posicion.coords;

    if (accuracy > PRECISION_MAXIMA_M) {
      this.buscandoUbicacion.set(false);
      this.avisoUbicacion.set(
        `Solo sabemos dónde estás con un margen de ${Math.round(accuracy)} metros, ` +
          'y con eso no se acierta un portal. Escribe la calle a mano.',
      );
      return;
    }

    this.http
      .get<PortalCercano | null>(`/api/portal-cercano?lat=${latitude}&lon=${longitude}`)
      .subscribe({
        next: (cercano) => this.conElPortal(cercano),
        error: () => {
          this.buscandoUbicacion.set(false);
          this.avisoUbicacion.set('No se pudo preguntar al motor. ¿Está arrancado?');
        },
      });
  }

  /**
   * Ya está el portal. Segunda comprobación: **la distancia**.
   *
   * Y si pasa, se rellena POR CÓDIGO: la vía entera y el portal entero, tal y
   * como habrían quedado si se hubieran elegido de sus listas. El formulario ni
   * se entera de que ha habido GPS —`sePuedeGenerar()` sigue mirando los cuatro
   * códigos y nada más—, y el texto que se escribe es el mismo que escribiría
   * el desplegable, porque lo pinta la misma función.
   *
   * Ni aquí ni en el aviso se nombra Zaragoza: ver `DISTANCIA_MAXIMA_M`.
   */
  private conElPortal(cercano: PortalCercano | null): void {
    this.buscandoUbicacion.set(false);

    if (!cercano) {
      // El motor dice que no sabe. Pasa si la vía del portal más cercano no es
      // sugerible, que no debería ocurrir — pero si ocurre, se calla en vez de
      // rellenar media dirección.
      this.avisoUbicacion.set(
        'No hemos podido situarte con lo que sabemos de la ciudad. Escribe la ' +
          'calle a mano.',
      );
      return;
    }

    if (cercano.metros > DISTANCIA_MAXIMA_M) {
      this.avisoUbicacion.set(
        `El portal más cercano está a ${cercano.metros} metros. Desde ahí no ` +
          'podemos decir en qué puerta estás. Escribe la calle a mano.',
      );
      return;
    }

    const lado = this.pidioUbicacion;
    if (!lado) {
      return;
    }

    // ⭐ Y EL TIPO SE PONE EN «DIRECCIÓN». Una ubicación ES una dirección: lo
    // que devuelve `/api/portal-cercano` es una vía y un portal, y meterlos en
    // un campo que dice «Hospitales» sería escribir una cosa bajo la etiqueta
    // de otra. Cambiar el tipo aquí es además lo que hace aparecer la casilla
    // del número, sin la cual el portal recién resuelto no se vería.
    lado.tipo.set('via');
    lado.sitio.set(null);

    lado.calle.set(comoSeVeLaVia(cercano.via));
    lado.via.set(cercano.via);
    lado.calleTocada.set(false);
    lado.portalTexto.set(cercano.portal.numero);
    lado.portal.set(cercano.portal);
    lado.portalTocado.set(false);
  }

  /** No hay posición, y la API dice por qué. Se traduce y se enseña. */
  private sinPosicion(fallo: GeolocationPositionError): void {
    this.buscandoUbicacion.set(false);
    this.avisoUbicacion.set(
      MENSAJES_DE_FALLO[fallo.code] ??
        'No se ha podido saber dónde estás. Escribe la calle a mano.',
    );
  }

  protected elegirModo(modo: Modo): void {
    this.modo.set(modo);
  }

  protected etiquetaDe(modo: Modo): string {
    return this.modos.find((m) => m.id === modo)?.etiqueta ?? modo;
  }

  /** La flecha de un paso. Sale del `giro`, nunca del texto: ver `FLECHAS`. */
  protected flechaDe(giro: Giro): string {
    return FLECHAS[giro];
  }

  protected readonly enMetros = comoSeLeenLosMetros;
  protected readonly enTiempo = comoSeLeeLaDuracion;

  /**
   * ⭐ Le pide la ruta al motor. Con algún campo vacío no hace nada.
   *
   * **Esto es `HttpClient.post`, y no `httpResource`.** Los dos campos del
   * formulario usan `httpResource` porque son LECTURAS que se rehacen solas
   * cuando cambia lo escrito. Esto no: es una ACCIÓN que dispara un botón, una
   * vez, cuando quien mira decide.
   *
   * [DOC] Los tipos instalados dicen que `httpResource` *«makes a **reactive**
   * HTTP request and exposes the request status and response value as a
   * `WritableResource`»*, y que su método *«defaults to GET if not specified»* —
   * o sea que **técnicamente sabría hacer un POST**. Lo que no encaja no es el
   * verbo: es el «reactive». Un recurso se rehace solo cuando cambia una señal
   * de las que lee, y aquí las señales que habría que leer son los cuatro
   * campos: tocar un portal dispararía una ruta que nadie ha pedido, y pulsar
   * «Generar» dos veces con los mismos campos no dispararía ninguna. [PROPIO]
   * Por eso va por el mismo camino que «Mi ubicación», que es la otra acción de
   * esta pantalla.
   *
   * Lo primero que hace es **tirar el resultado anterior**. No es cosmética:
   * mientras se espera, el mapa no puede seguir enseñando la línea de la ruta
   * de antes como si fuera esta.
   */
  protected generarRuta(): void {
    if (this.generando()) {
      return;
    }
    // ⭐ Los DOS extremos, por la misma función: la simetría del 23/08 aquí es
    // que no hay dos caminos que mantener a la par.
    const origen = this.extremoDe(this.origen);
    const destino = this.extremoDe(this.destino);
    if (!origen || !destino) {
      return;
    }

    // CÓDIGOS, que es lo único que viaja. Es la ley de la entrada nº4 llegando
    // al final del tubo: el formulario lleva desde el punto 4 negándose a
    // desbloquear con texto, y sería tirarlo todo mandar aquí los nombres. El
    // motor tampoco los aceptaría — los rechaza en `leerPeticion`. Un sitio
    // viaja igual: por su código, nunca por su presentación.
    const peticion: PeticionDeRuta = { origen, destino, modo: this.modo() };

    this.avisoRuta.set(null);
    this.resultado.set(null);
    this.generando.set(true);

    this.http.post<Trayecto>('/api/ruta', peticion).subscribe({
      next: (trayecto) => {
        this.generando.set(false);
        this.resultado.set({
          origen: this.comoSeLee(this.origen),
          destino: this.comoSeLee(this.destino),
          capaOrigen: this.capaDe(this.origen),
          capaDestino: this.capaDe(this.destino),
          trayecto,
        });
      },
      // Que el motor no conteste no es lo mismo que no haber ruta: cuando no
      // hay ruta, el motor contesta un trayecto vacío con su aviso y eso entra
      // por arriba. Aquí solo se cae cuando no hay nadie al otro lado.
      error: () => {
        this.generando.set(false);
        this.avisoRuta.set('No se pudo preguntar al motor. ¿Está arrancado?');
      },
    });
  }

  /**
   * Cuándo se puede generar: **los cuatro códigos**. Dos vías elegidas de su
   * lista y dos portales elegidos de la suya. Ni un texto.
   *
   * Mirar el texto era el fallo de la entrada nº4 de la bitácora: se escribía
   * cualquier cosa, se salía con Tab, y el botón se desbloqueaba sin que
   * hubiera detrás ninguna vía real. El texto no identifica una calle —hay 52
   * nombres repetidos entre la ciudad y los barrios rurales— ni una puerta
   * —un «12» tecleado podía no existir en una calle de 31 portales—; los
   * códigos sí.
   */
  /**
   * ⭐ Un lado, convertido en el extremo que viaja: **códigos y nada más**.
   *
   * Es la ley de la entrada nº4 llegando al final del tubo: el formulario lleva
   * desde el punto 4 negándose a desbloquear con texto, y sería tirarlo todo
   * mandar aquí los nombres. Un sitio viaja igual, por su código y nunca por su
   * presentación.
   */
  private extremoDe(lado: Lado): ExtremoDeRuta | null {
    const sitio = lado.sitio();
    if (sitio) {
      return { sitio: sitio.codigo };
    }
    const via = lado.via();
    const portal = lado.portal();
    return via && portal ? { via: via.codigo, portal: portal.codigo } : null;
  }

  /**
   * Cómo se lee un lado en la cabecera del resultado.
   *
   * Un sitio ya viene con su nombre **compuesto por el motor** —«Farmacia ·
   * calle»— y no se recompone aquí: la pantalla no fabrica nombres, y menos
   * uno cuyo dato crudo lleva el nombre de una persona.
   */
  /**
   * ⭐ El código de un lado para usarlo como FOCO del otro, o `null`.
   *
   * Es la misma pregunta que `extremoDe` —«¿qué hay elegido aquí?»— pero para
   * ORDENAR la lista del lado contrario, no para pedir una ruta. Por eso
   * devuelve un código suelto y no un extremo: al motor le da igual de qué
   * clase sea el punto desde el que se mide.
   *
   * Un lado a medias —calle sin portal— vale `null`: sin portal no hay punto,
   * y la calle entera no es un sitio desde el que medir.
   */
  protected focoDe(lado: Lado): string | null {
    const sitio = lado.sitio();
    if (sitio) {
      return sitio.codigo;
    }
    return lado.portal()?.codigo ?? null;
  }

  /**
   * De qué clase es un lado: la misma pregunta que responde `extremoDe`, pero
   * para pintar en vez de para viajar. Un lado con sitio es de la capa
   * `sitio`; cualquier otro, una dirección.
   */
  private capaDe(lado: Lado): Clase {
    return lado.sitio()?.tipo ?? 'via';
  }

  private comoSeLee(lado: Lado): string {
    const sitio = lado.sitio();
    return sitio ? sitio.presentacion : comoSeLeeLaDireccion(lado.via()!, lado.portal()!);
  }

  protected sePuedeGenerar(): boolean {
    // ⭐ LA REGLA DEL PORTAL CONDICIONAL (19/08), en los DOS lados. Un sitio
    // trae su propia coordenada, así que no hay portal que exigirle — y
    // exigírselo dejaría el botón apagado para siempre, porque esa casilla ni
    // siquiera se puede rellenar. Un lado con sitio ya está completo.
    return this.estaListo(this.origen) && this.estaListo(this.destino);
  }

  /** Un lado está listo si tiene un sitio, o la pareja vía+portal entera. */
  private estaListo(lado: Lado): boolean {
    return lado.sitio() !== null || (lado.via() !== null && lado.portal() !== null);
  }
}
