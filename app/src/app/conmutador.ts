import { Component, computed, inject, input } from '@angular/core';
import { Simbolo } from './simbolos';
import { Tema } from './tema';

/**
 * ⭐ EL CONMUTADOR DE TEMA (16/09, tanda 6 · parte 3).
 *
 * ── ⭐ ES UN INTERRUPTOR, Y ESO LO DECIDE EL APG ────────────────────────────
 *
 * [APG, *Switch Pattern*] un `switch` es un control de **efecto inmediato**, sin
 * «aplicar» ni confirmación — y el modo oscuro es el ejemplo canónico que la
 * propia guía usa. De ahí las tres piezas:
 *
 * · `<button type="button">` **de verdad**, no un `div` con `role`: Espacio y
 *   Enter los trae el elemento, y con ellos el foco y el orden de tabulación.
 * · `role="switch"` con **`aria-checked`**, que es quien dice el estado.
 * · Un **nombre estable** por `aria-label`.
 *
 * ⚠️ **EL NOMBRE NO CAMBIA CON EL ESTADO**, y es el error clásico de estos
 *    botones: «Activar modo oscuro» → «Desactivar modo oscuro». Quien navega
 *    por voz dice el nombre para pulsarlo, y quien navega por lista de
 *    controles lo busca por su nombre: si cambia al usarlo, el control se
 *    escapa cada vez. El nombre es «Modo oscuro» siempre; el estado lo lleva
 *    `aria-checked`, que para eso existe.
 *
 * ⚠️ Y EL ESTADO NO SE DICE SOLO CON COLOR [WCAG 1.4.1]: lo dicen el icono
 *    —sol o luna, dos dibujos distintos, no dos tintas— y `aria-checked`.
 *
 * ── Dónde se pinta ──────────────────────────────────────────────────────────
 *
 * En dos sitios de la app pública, y **nunca en los dos a la vez**: el cuarto
 * hueco de la barra de pestañas en móvil, y la cabecera del panel en
 * escritorio. Cada variante se apaga en el ancho de la otra; ver `styles.css`.
 *
 * ── ⭐ Y DESDE EL 20/09, UNA TERCERA: `suelta` ──────────────────────────────
 *
 * La pide la intranet. `/visor` y `/panel` no tienen barra de pestañas ni
 * cabecera del Buscador, así que con la variante de escritorio el conmutador
 * **desaparecía por debajo de 768** —`.conmutador` lo apaga ahí porque en móvil
 * manda el hueco de la barra— y esas dos páginas se quedaban otra vez sin
 * forma de cambiar de tema. Medido antes de tocar nada: `0×0 px · display
 * none` en los dos, a 390.
 *
 * ⚠️ **POR QUÉ EL ARREGLO VIVE AQUÍ Y NO EN LA HOJA GLOBAL**, que es la parte
 *    que importa. [DOC Angular · *Styling components*] la encapsulación
 *    emulada —la de serie— garantiza que los estilos de un componente no
 *    salgan de él, «sin embargo, los estilos GLOBALES definidos fuera de un
 *    componente SÍ pueden afectar a los elementos de dentro». Las dos mitades
 *    de esa frase mandan aquí:
 *
 *    · la segunda es la causa raíz de la colisión de `.panel` (bitácora del
 *      20/09): en una hoja global, el nombre de una clase es un identificador
 *      de TODA la aplicación, y una página nueva que lo reutilice hereda en
 *      silencio la maquetación de otra;
 *    · la primera es la que se aprovecha ahora: **un estilo declarado en este
 *      componente no puede tocar a nadie más**. Así que la tercera variante no
 *      añade ni una línea a `styles.css` —ni un nombre de la intranet a la
 *      hoja que SÍ viaja a producción— y no puede colisionar con nada.
 *
 * ⚠️ Y **no copia el vestido, lo hereda**: `suelta` lleva las DOS clases,
 *    `conmutador` —los 44×44, el radio, las tintas, el anillo de foco— y
 *    `conmutador--suelta`, que solo deshace el apagado por ancho. Un segundo
 *    juego de colores escrito a mano es justo lo que la casa no tiene.
 *
 * ⚠️ La posición en escritorio **NO CONSTA** en DISEÑO ni en la maqueta —el §35
 *    firma el conmutador y el §20 le guarda el hueco de móvil, pero de PC no
 *    dicen nada—. Se pinta donde la cabecera lo admite (arriba a la derecha,
 *    a la altura del `h1`) y va a capturas: la posición la ratifica un ojo, no
 *    se parlamenta a ciegas.
 */
@Component({
  selector: 'app-conmutador-de-tema',
  imports: [Simbolo],
  /**
   * ⚠️ UNA SOLA REGLA, Y ENCAPSULADA A PROPÓSITO. Lo único que la variante
   *    suelta necesita es deshacer el `display: none` que `.conmutador` trae de
   *    la hoja global por debajo de 768. Pesa (0,2,0) contra los (0,1,0) de
   *    aquélla —dentro y fuera de su `@media`—, así que gana por especificidad
   *    y no por orden de hojas, que es lo que no se deshace al reordenar.
   */
  styles: `
    .conmutador--suelta {
      display: inline-flex;
    }
  `,
  template: `
    <button
      type="button"
      role="switch"
      [class]="clase()"
      [attr.aria-checked]="tema.oscuro()"
      aria-label="Modo oscuro"
      (click)="tema.alternar()"
    >
      <app-simbolo [nombre]="tema.oscuro() ? 'dark_mode' : 'light_mode'" [lado]="24" />
      @if (variante() === 'barra') {
        <span class="barra__texto">Tema</span>
      }
    </button>
  `,
})
export class ConmutadorDeTema {
  /**
   * `barra` se calza el traje de las pestañas de móvil; `cabecera`, el de PC; y
   * `suelta`, el de una página que no tiene ni lo uno ni lo otro — la intranet.
   */
  readonly variante = input<'barra' | 'cabecera' | 'suelta'>('cabecera');

  /** El traje que toca. `suelta` hereda el de cabecera y le quita el apagado. */
  protected readonly clase = computed(() => {
    switch (this.variante()) {
      case 'barra':
        return 'barra__boton conmutador--barra';
      case 'suelta':
        return 'conmutador conmutador--suelta';
      default:
        return 'conmutador';
    }
  });

  protected readonly tema = inject(Tema);
}
