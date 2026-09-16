import { Component, inject, input } from '@angular/core';
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
 * En dos sitios, y **nunca en los dos a la vez**: el cuarto hueco de la barra de
 * pestañas en móvil, y la cabecera del panel en escritorio. Cada variante se
 * apaga en el ancho de la otra; ver `styles.css`.
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
  template: `
    <button
      type="button"
      role="switch"
      [class]="variante() === 'barra' ? 'barra__boton conmutador--barra' : 'conmutador'"
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
  /** `barra` se calza el traje de las pestañas de móvil; `cabecera`, el de PC. */
  readonly variante = input<'barra' | 'cabecera'>('cabecera');

  protected readonly tema = inject(Tema);
}
