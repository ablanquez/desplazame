import { Component, computed, input } from '@angular/core';

/**
 * ⭐ LOS ICONOS DE CAPA: qué clase de sitio es cada extremo, dicho sin leer.
 *
 * Un buscador que ofrece calles y farmacias en la misma lista tiene que
 * distinguirlas ANTES de que se lea el texto, porque el texto de las dos
 * empieza igual de a menudo por la misma palabra. Hasta el 23/08 la única seña
 * era el `data-capa` del `<li>` —invisible— y un fondo apenas distinto.
 *
 * **Son dos formas y tres colores, dibujados a mano en SVG.** Ni una
 * dependencia: la regla del repositorio es cero, y una familia de iconos entera
 * para traer dos figuras sería pagar cientos de kB por lo que cabe en dos
 * `<path>`. Es la misma decisión que las flechas de los pasos, que son Unicode.
 *
 * LAS FORMAS
 * · **Chincheta** — una dirección: calle y portal. Es la forma con la que
 *   cualquier mapa dice «este punto exacto», y su punta ES la coordenada.
 * · **Cruz** — una farmacia. En España la cruz verde es la señal de farmacia en
 *   la calle, así que no hay nada que aprender.
 *
 * LOS COLORES, y por qué estos
 * · La chincheta va en **dos colores según el papel**: azul el origen, magenta
 *   el destino. Es la única pieza que distingue de dónde a dónde, y en el mapa
 *   hace falta: dos chinchetas del mismo color son dos puntos, no un trayecto.
 * · La cruz va **verde en los dos extremos**, y es una decisión de Antonio
 *   (23/08): el tipo ya la distingue, y una farmacia de un color en el origen y
 *   de otro en el destino sería inventarle dos identidades a la misma cosa.
 * · Los tres contrastan con el mapa —OSM es beige, blanco y verde pálido— y con
 *   la línea de la ruta, que es naranja quemado `#b45309`.
 *
 * ⚠️ **LÍMITE, dicho y no escondido:** azul y magenta se distinguen mal con
 * protanopia, donde el magenta tira a azulado. No es el par ideal, y aquí el
 * papel se sostiene además por la POSICIÓN —el origen es la primera línea del
 * itinerario— y por el `data-papel` que leen las pruebas. Afinarlo no entra
 * hoy; queda escrito para cuando entre.
 */

/** La chincheta: gota con la punta abajo, hueca en el centro. */
export const CAMINO_CHINCHETA =
  'M12 1.6c-4.1 0-7.4 3.3-7.4 7.4 0 5.5 7.4 13.4 7.4 13.4s7.4-7.9 7.4-13.4c0-4.1-3.3-7.4-7.4-7.4z';

/** La cruz de farmacia: brazos iguales, como la de la calle. */
export const CAMINO_CRUZ = 'M9.4 2.4h5.2v6.8h6.8v5.2h-6.8v6.8H9.4v-6.8H2.6V9.2h6.8z';

/** Azul: el ORIGEN cuando es una dirección. */
export const COLOR_ORIGEN = '#1d4ed8';
/** Magenta: el DESTINO cuando es una dirección. */
export const COLOR_DESTINO = '#be185d';
/** Verde de farmacia. El mismo en los dos extremos, a propósito. */
export const COLOR_SITIO = '#15803d';

/** De qué capa es un extremo. Los mismos dos valores que usa el autocompletar. */
export type Capa = 'via' | 'sitio';
/** Qué papel hace en la ruta. */
export type Papel = 'origen' | 'destino';

/**
 * El color de un icono, que depende de la capa y —solo si es una dirección—
 * del papel. Un sitio no mira el papel: ver arriba.
 */
export function colorDeCapa(capa: Capa, papel: Papel): string {
  if (capa === 'sitio') {
    return COLOR_SITIO;
  }
  return papel === 'origen' ? COLOR_ORIGEN : COLOR_DESTINO;
}

/** El camino de la figura de una capa. */
export function caminoDeCapa(capa: Capa): string {
  return capa === 'sitio' ? CAMINO_CRUZ : CAMINO_CHINCHETA;
}

/**
 * El MISMO icono, como cadena, para quien no puede usar una plantilla de
 * Angular: los marcadores de Leaflet, que quieren HTML hecho.
 *
 * Comparte los caminos y los colores con el componente de abajo —las constantes
 * son las mismas—, así que no hay dos dibujos que mantener a la par. Lo único
 * que añade es el **borde blanco**: sobre el mapa, una figura de color plano se
 * confunde con el fondo en cuanto cae sobre un parque o una manzana oscura.
 */
export function svgDeCapa(capa: Capa, papel: Papel, lado: number): string {
  const hueco =
    capa === 'via' ? '<circle cx="12" cy="9" r="2.9" fill="#ffffff"></circle>' : '';
  return (
    `<svg viewBox="0 0 24 24" width="${lado}" height="${lado}" ` +
    `data-icono="${capa}" data-papel="${papel}" aria-hidden="true" focusable="false">` +
    `<path d="${caminoDeCapa(capa)}" fill="${colorDeCapa(capa, papel)}" ` +
    `stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"></path>${hueco}</svg>`
  );
}

/**
 * El icono como componente, para las plantillas.
 *
 * `aria-hidden` en los dos sitios donde se usa: el icono repite lo que el texto
 * ya dice —«Farmacia · …», «CALLE BURGOS 2»—, y a quien escucha la pantalla no
 * se le lee dos veces la misma cosa. Es la misma regla que la flecha del paso.
 */
@Component({
  selector: 'app-icono-capa',
  template: `
    <svg
      class="icono-capa"
      viewBox="0 0 24 24"
      [attr.width]="lado()"
      [attr.height]="lado()"
      [attr.data-icono]="capa()"
      [attr.data-papel]="papel()"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="camino()" [attr.fill]="color()" />
      @if (capa() === 'via') {
        <circle cx="12" cy="9" r="2.9" fill="#ffffff" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      flex: none;
    }
  `,
})
export class IconoCapa {
  readonly capa = input.required<Capa>();
  /**
   * Obligatorio, sin valor por defecto. Un defecto aquí sería elegir un color
   * por quien no lo ha dicho, y el color es justo lo que distingue de dónde a
   * dónde: la lista del campo de origen pinta chinchetas azules y la del
   * destino, magentas, porque eso es lo que va a salir en el mapa al elegirlas.
   */
  readonly papel = input.required<Papel>();
  readonly lado = input(16);

  protected readonly camino = computed(() => caminoDeCapa(this.capa()));
  protected readonly color = computed(() => colorDeCapa(this.capa(), this.papel()));
}
