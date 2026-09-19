import { Component, inject } from '@angular/core';
import { Capas } from './capas';
import { MapaDeCapas } from './mapa-de-capas';

/**
 * El visor de capas: el instrumento con el que se verificó cada conjunto que
 * entró en el proyecto, a ventana casi completa.
 *
 * Existe porque verificar un dato geográfico en un lienzo de 22 rem no es
 * verificarlo: el estacionamiento regulado, las zonas, las PMR —y la morada,
 * que trabajará en 2027— hay que poder mirarlas encima de la calle, con zoom,
 * no adivinarlas en una miniatura debajo de un formulario.
 *
 * ⚠️ **NO ES PRODUCTO, y desde el 19/09 tampoco es público.** Vivió como
 *    pestaña de la app hasta el 22/08; se retiró entonces reservándolo para la
 *    intranet, y aquí vuelve con la firma de Antonio: **alcance B, acceso
 *    solo-local**. Esta página **no viaja en el dist de producción** — la
 *    configuración `production` reemplaza el fichero de rutas de intranet por
 *    uno vacío, y una jueza lo comprueba sobre el dist construido.
 *
 * [OWASP ASVS 2.32 · DevGuide] una interfaz de administración no debe ser
 * accesible a partes no confiables; el extremo fuerte de esa recomendación es
 * que no sea accesible desde internet, y eso es exactamente lo firmado.
 *
 * No duplica el mapa público: es otro componente, `MapaDeCapas`, y lo es por
 * peso — ver la cabecera de ese fichero.
 */
@Component({
  selector: 'app-visor',
  imports: [MapaDeCapas],
  templateUrl: './visor.html',
  styleUrl: './visor.css',
})
export class Visor {
  private readonly capas = inject(Capas);

  /**
   * El mapa llena la caja, y la caja la mide el CSS de esta página. No es
   * `100dvh` a secas: hay que descontar la cabecera.
   */
  protected readonly alto = '100%';

  constructor() {
    // La descarga la pide LA PÁGINA, no el mapa: así una prueba puede montar el
    // mapa sin que se dispare ni una petición. `cargar()` es idempotente.
    this.capas.cargar();
  }
}
