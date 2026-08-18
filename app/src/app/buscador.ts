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

  /** Lo escrito en los campos de calle, que el autocompletar mantiene. */
  protected readonly calleOrigen = signal('');
  protected readonly calleDestino = signal('');

  /** La vía elegida de la lista. Guarda el CÓDIGO, no solo el texto. */
  protected readonly viaOrigen = signal<Via | null>(null);
  protected readonly viaDestino = signal<Via | null>(null);

  /**
   * El portal elegido de la lista de la vía. Guarda el CÓDIGO, no el número
   * escrito — como la vía, y por la misma razón: un `12` tecleado no
   * identifica ninguna puerta, y podía no existir.
   */
  protected readonly portalOrigen = signal<Portal | null>(null);
  protected readonly portalDestino = signal<Portal | null>(null);

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
      this.viaOrigen() !== null &&
      this.portalOrigen() !== null &&
      this.viaDestino() !== null &&
      this.portalDestino() !== null
    );
  }
}
