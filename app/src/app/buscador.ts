import { Component, inject, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
// El contrato manda: los tipos vienen del paquete compartido, no de copias
// locales. Si el motor cambia la forma, esta pantalla deja de compilar.
import type { Modo, Paso, Portal, PortalCercano, Via, Vertice } from '@desplazame/tipos';
import { HttpClient } from '@angular/common/http';
import { Capas } from './capas';
import { Mapa } from './mapa';
import { AutocompletarVia, comoSeVeLaVia } from './autocompletar-via';
import { SelectorPortal } from './selector-portal';

/**
 * ANDAMIO. Respuesta falsa y fija: no sale de ningún motor ni de ningún dato.
 * Existe para poder ver funcionar la pantalla entera antes de que exista el
 * motor, y se retira en el punto 7 del plan cuando el motor real la sustituya.
 */
const RUTA_DE_PRUEBA: readonly Paso[] = [
  { texto: 'Anda 150 m hasta la parada de prueba', detalle: '2 min' },
  { texto: 'Coge la línea de prueba y bájate en la tercera parada', detalle: '8 min' },
  { texto: 'Anda 200 m hasta el portal de destino', detalle: '3 min' },
];

/** ANDAMIO. El trazado que acompaña a RUTA_DE_PRUEBA: tampoco lo calcula nadie. */
const TRAZADO_DE_PRUEBA: readonly Vertice[] = [
  [41.6561, -0.8773],
  [41.6516, -0.879],
  [41.6468, -0.883],
  [41.6425, -0.8865],
];

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

@Component({
  selector: 'app-buscador',
  imports: [Mapa, AutocompletarVia, SelectorPortal],
  templateUrl: './buscador.html',
  styleUrl: './buscador.css',
})
export class Buscador {
  /**
   * Las capas de verificación no las carga ya esta pantalla: viven en un
   * servicio de aplicación porque el mapa las pinta desde donde sea que se le
   * monte. Aquí solo se pide que estén; el servicio se encarga de bajarlas una
   * sola vez.
   */
  private readonly capas = inject(Capas);

  /**
   * Para preguntarle al motor por el portal más cercano.
   *
   * Aquí no vale `httpResource`, que es lo que usan los dos campos: aquel pide
   * solo cuando cambia una señal, y esto es un botón — se pregunta cuando se
   * pulsa, una vez, y con unas coordenadas que no existían un instante antes.
   */
  private readonly http = inject(HttpClient);

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

  /** Los pasos pintados. Vacío hasta que se genera. */
  protected readonly pasos = signal<readonly Paso[]>([]);

  /** Con qué modo se generó lo que hay en pantalla. */
  protected readonly modoGenerado = signal<Modo | null>(null);

  /** El trazado que se pinta en el mapa. Vacío hasta que se genera. */
  protected readonly trazado = signal<readonly Vertice[]>([]);

  constructor() {
    this.capas.cargar();
  }

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
  protected alElegirVia(lado: Lado, via: Via | null): void {
    lado.via.set(via);
    lado.portalTexto.set('');
    lado.portal.set(null);
    lado.portalTocado.set(false);
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
    intercambiar(this.origen.calle, this.destino.calle);
    intercambiar(this.origen.via, this.destino.via);
    intercambiar(this.origen.calleTocada, this.destino.calleTocada);
    intercambiar(this.origen.portalTexto, this.destino.portalTexto);
    intercambiar(this.origen.portal, this.destino.portal);
    intercambiar(this.origen.portalTocado, this.destino.portalTocado);
  }

  /**
   * 📍 Rellena el ORIGEN con donde está quien mira la pantalla.
   *
   * El permiso lo pide el propio navegador al llamar [DOC MDN], así que aquí
   * no hay que preguntar nada antes. Exige contexto seguro: en local vale
   * `localhost`; en producción hará falta https, y eso es una casilla del
   * punto 12, no de aquí.
   *
   * Va SOLO en origen. Para el otro lado está el ⇅: se pone la ubicación en
   * origen y se invierte.
   */
  protected miUbicacion(): void {
    this.avisoUbicacion.set(null);

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

    this.origen.calle.set(comoSeVeLaVia(cercano.via));
    this.origen.via.set(cercano.via);
    this.origen.calleTocada.set(false);
    this.origen.portalTexto.set(cercano.portal.numero);
    this.origen.portal.set(cercano.portal);
    this.origen.portalTocado.set(false);
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

  /** Pinta la ruta de prueba. Con algún campo vacío no hace nada. */
  protected generarRuta(): void {
    if (!this.sePuedeGenerar()) {
      return;
    }
    this.modoGenerado.set(this.modo());
    this.pasos.set(RUTA_DE_PRUEBA);
    this.trazado.set(TRAZADO_DE_PRUEBA);
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
  protected sePuedeGenerar(): boolean {
    return (
      this.origen.via() !== null &&
      this.origen.portal() !== null &&
      this.destino.via() !== null &&
      this.destino.portal() !== null
    );
  }
}
