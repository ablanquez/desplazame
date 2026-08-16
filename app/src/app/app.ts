import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** Los cuatro modos de transporte. Excluyentes: solo uno puede estar activo. */
export type Modo = 'andando' | 'bus' | 'bici' | 'coche';

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

  protected elegirModo(modo: Modo): void {
    this.modo.set(modo);
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
