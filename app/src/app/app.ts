import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** Los cuatro modos de transporte. Excluyentes: solo uno puede estar activo. */
export type Modo = 'andando' | 'bus' | 'bici' | 'coche';

/** Un paso de las indicaciones. */
export interface Paso {
  readonly texto: string;
  readonly detalle: string;
}

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

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** El orden en que se pintan los botones. */
  protected readonly modos: ReadonlyArray<{ id: Modo; etiqueta: string }> = [
    { id: 'andando', etiqueta: 'Andando' },
    { id: 'bus', etiqueta: 'Bus / tranvía' },
    { id: 'bici', etiqueta: 'Bici' },
    { id: 'coche', etiqueta: 'Coche' },
  ];

  protected calleOrigen = '';
  protected portalOrigen = '';
  protected calleDestino = '';
  protected portalDestino = '';

  /** Andando por defecto. */
  protected readonly modo = signal<Modo>('andando');

  /** Los pasos pintados. Vacío hasta que se genera. */
  protected readonly pasos = signal<readonly Paso[]>([]);

  /** Con qué modo se generó lo que hay en pantalla. */
  protected readonly modoGenerado = signal<Modo | null>(null);

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
  }

  /** Única validación de este punto: los cuatro campos rellenos. */
  protected sePuedeGenerar(): boolean {
    return (
      this.calleOrigen.trim() !== '' &&
      this.portalOrigen.trim() !== '' &&
      this.calleDestino.trim() !== '' &&
      this.portalDestino.trim() !== ''
    );
  }
}
