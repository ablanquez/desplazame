import { Component, inject, signal } from '@angular/core';
// El contrato manda: los tipos vienen del paquete compartido, no de copias
// locales. Si el motor cambia la forma, esta pantalla deja de compilar.
import type { Modo, Paso, Portal, Via, Vertice } from '@desplazame/tipos';
import { Capas } from './capas';
import { Mapa } from './mapa';
import { AutocompletarVia } from './autocompletar-via';
import { SelectorPortal } from './selector-portal';

/**
 * ANDAMIO. Respuesta falsa y fija: no sale de ningún motor ni de ningún dato.
 * Existe para poder ver funcionar la pantalla entera antes de que exista el
 * motor, y se retira en el punto 6 del plan cuando el motor real la sustituya.
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
