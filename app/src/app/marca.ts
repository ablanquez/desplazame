import { Component, input } from '@angular/core';

/**
 * ⭐ **LA GOTA DE LA MARCA, como constante y no como literal de plantilla**
 *    (21/09, remate 2 del puntero).
 *
 * Es el mismo trazado de siempre, byte a byte: lo único que cambia es que ya no
 * vive suelto dentro del `d=` de la plantilla, sino en un sitio que **se puede
 * importar**. Lo pidió el mapa: por orden de Antonio el puntero del paso es el
 * pin de esta marca, y la casa tiene escrito que un dibujo compartido **no se
 * copia: se importa** —es la misma regla con la que los hitos del mapa toman
 * sus caminos de `SIMBOLOS`—. Un sexto sitio con esta cadena escrita a mano
 * sería un dibujo más que mantener a juego, y el día que la marca cambie se
 * quedaría atrás sin que nadie lo note.
 *
 * ⚠️ `sistema-de-iconos.spec.ts` sigue siendo el portero: comprueba que los
 *    cuatro ficheros de `app/marca/` dibujan ESTA gota y no otra. Lo único que
 *    se le movió es de dónde la lee.
 */
export const GOTA_DE_LA_MARCA =
  'M16 3a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8Zm0 11.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z';

/**
 * ⭐ **DÓNDE ESTÁ LA PUNTA DE LA GOTA**, en unidades de la rejilla de 32.
 *
 * Medido sobre el propio trazado, no a ojo: la gota arranca en `M16 3` —arriba
 * del todo, centrada— y baja hasta `8 12 8 12s8-6.5 8-12`, o sea hasta
 * `y = 3 + 12 + 8 = 23`, y lo hace **en x = 16**, que es el eje de simetría del
 * dibujo. La caja de la gota va de x 8 a x 24 y de y 3 a y 23.
 *
 * Quien la use como chincheta de un mapa necesita este punto exacto: [DOC
 * Leaflet] `iconAnchor` es *«the coordinates of the "tip" of the icon»*, y
 * anclar por el centro dejaría la coordenada media gota por encima de donde el
 * ojo ve la punta.
 */
export const PUNTA_DE_LA_GOTA = { x: 16, y: 23 } as const;

/**
 * ⭐ LA MARCA — el símbolo de Desplázame (18/09, el remate de la identidad).
 *
 * ── Qué es, y por qué NO vive en `app/simbolos/` ────────────────────────────
 *
 * Es **marca, no icono del set**. El §5 firma Material Symbols como familia
 * única **para la interfaz** —acciones, modos, maniobras, controles—, y un
 * logotipo no se toma prestado de una familia de iconos de sistema: no dice
 * «esto hace tal cosa», dice «esto es Desplázame». Por eso sus ficheros viven
 * en `app/marca/`, con su propia ficha, y por eso `sistema-de-iconos.spec.ts`
 * lo reconoce como **cuarto sitio declarado** que puede escribir un `<svg>`.
 *
 * ── La letra del §4 ─────────────────────────────────────────────────────────
 *
 * «Símbolo geométrico simple, reconocible a 16 px», que evoque *ruta/
 * movimiento*, en azul primario. Este es el candidato B de los tres que se
 * pintaron el 17/09 —la gota sobre la traza—, **elegido por Antonio con las
 * tres tallas y los dos temas delante**.
 *
 * ⚠️ **El hueco de la gota es un CALADO de verdad** —una sola ruta con
 *    `fill-rule="evenodd"`—, no un disco del color del fondo. Un tapón pintado
 *    se delata en cuanto la marca cae sobre una tarjeta, sobre la página o
 *    sobre una tesela; el calado vale sobre las tres.
 *
 * ⚠️ **Rejilla 32 y trazo 4**: a 16 px eso son 2 px reales, el suelo por debajo
 *    del cual un trazo se difumina. Nada de detalle interior — se probó con las
 *    tres tallas delante y la variante con dos codos se descartó por empastarse.
 *
 * ⚠️ `currentColor` en las dos piezas: la marca se pinta con el azul del tema
 *    —`#2563eb` en claro, `#93c5fd` en oscuro—, y **en oscuro no hay blanco
 *    puro** [§36].
 *
 * ⚠️ `aria-hidden`, como todo dibujo de esta casa: el nombre lo dice el `<h1>`
 *    que lo acompaña. Decirlo dos veces es el fallo que el triaje del W3C
 *    describe.
 */
@Component({
  selector: 'app-marca',
  template: `
    <svg
      class="marca"
      viewBox="0 0 32 32"
      [attr.width]="lado()"
      [attr.height]="lado()"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        fill="currentColor"
        [attr.d]="gota"
      />
      <path
        d="M4 28h24"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
      />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      color: var(--primary);
    }
    .marca {
      display: block;
    }
  `,
})
export class Marca {
  /** El lado en píxeles. 30 es el del montaje que se eligió. */
  readonly lado = input(30);

  /** El trazado de la gota, el mismo que importa el mapa. Ver arriba. */
  protected readonly gota = GOTA_DE_LA_MARCA;
}
