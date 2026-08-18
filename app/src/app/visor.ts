import { Component, inject } from '@angular/core';
import { Capas } from './capas';
import { Mapa } from './mapa';

/**
 * El visor: el mismo mapa y las mismas capas que el buscador, pero a ventana
 * casi completa.
 *
 * Existe porque verificar un dato geográfico en un lienzo de 22 rem no es
 * verificarlo: las capas que entran de aquí en adelante —aparcamotos,
 * estacionamiento regulado, zonas, PMR— hay que poder mirarlas encima de la
 * calle, con zoom, no adivinarlas en una miniatura debajo de un formulario.
 *
 * No duplica nada: el mapa es el MISMO componente y las capas son las MISMAS
 * del servicio. Lo único que cambia es el alto, que es un parámetro, y que
 * aquí no hay trayecto que dibujar.
 *
 * Es una herramienta de verificación, no producto. Cuando el andamio se retire
 * en el punto 6, esta página se va con él.
 */
@Component({
  selector: 'app-visor',
  imports: [Mapa],
  templateUrl: './visor.html',
  styleUrl: './visor.css',
})
export class Visor {
  private readonly capas = inject(Capas);

  /**
   * El mapa llena la caja, y la caja la mide el CSS de esta página. No es
   * `100dvh` a secas: hay que descontar la barra de navegación.
   */
  protected readonly alto = '100%';

  constructor() {
    // Si se entró por aquí, las capas todavía no están pedidas. Si se llegó
    // desde el buscador, esta llamada no hace nada: `cargar()` es idempotente
    // y el servicio sobrevive a la navegación.
    this.capas.cargar();
  }
}
