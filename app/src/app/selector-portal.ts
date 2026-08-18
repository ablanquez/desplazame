import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { httpResource } from '@angular/common/http';
import type { Portal, Via } from '@desplazame/tipos';

/**
 * Cuántos portales se enseñan de golpe. Medido sobre el censo: la mediana de
 * una vía es 9 y el percentil 95 es 51, así que con 50 se ve la vía ENTERA en
 * el 95% de los casos. Las 137 que se pasan (el 5%) se recortan y lo dicen —
 * para esas está el filtro, que es justo para lo que sirve escribir aquí.
 */
const VISIBLES = 50;

/**
 * El campo de portal: se ELIGE de los portales reales de la vía, no se
 * escribe.
 *
 * Es la misma ley de la entrada nº4 de la bitácora, aplicada desde el
 * nacimiento en vez de a posteriori: **la validación mira el código**. Aquí
 * ni siquiera hace falta descubrirlo — un portal tecleado a mano podía no
 * existir (el 99999 en una calle de 31), y de una lista no se puede elegir lo
 * que no está.
 *
 * [DOC] Por qué un combobox y no un `<select>` nativo. La guía de ARIA define
 * el combobox como *«an input widget that has an associated popup. The popup
 * enables users to choose a value for the input from a collection»*, y lo
 * separa del listbox precisamente por poder filtrar: *«If the combobox is
 * editable, the popup is displayed only if a certain number of characters are
 * typed…»*. El dato obliga a esa capacidad: la vía más larga —AVENIDA DE LA
 * ILUSTRACIÓN— tiene **1.469 portales**, y 137 vías pasan de 50. Un `<select>`
 * nativo no se filtra, así que ahí no serviría.
 *
 * [PROPIO] Pero a diferencia de las calles, aquí el desplegable **se abre al
 * entrar, sin escribir nada**: con una mediana de 9 portales lo normal es
 * querer verlos y señalar. Escribir es el atajo del caso largo, no el peaje
 * del caso corto.
 *
 * Se pide la vía entera de una vez y se filtra en local: son 67 KB en el peor
 * caso y evita una ida y vuelta al motor por cada tecla.
 */
@Component({
  selector: 'app-selector-portal',
  templateUrl: './selector-portal.html',
  styleUrl: './selector-portal.css',
})
export class SelectorPortal {
  readonly campo = input.required<string>();
  readonly etiqueta = input.required<string>();

  /** La vía ya fijada. Sin ella este campo no tiene de qué hablar. */
  readonly via = input<Via | null>(null);

  /** El portal elegido, o null mientras no se haya elegido ninguno. */
  readonly seleccion = output<Portal | null>();

  protected readonly texto = signal('');
  protected readonly abierto = signal(false);
  protected readonly activo = signal(-1);

  /** Lo que separa «escrito» de «elegido», igual que en el campo de calle. */
  private readonly elegido = signal<Portal | null>(null);
  private readonly tocado = signal(false);

  constructor() {
    // Cambiar de calle TIRA el portal: el 12 de una calle no es el 12 de la
    // otra, y dejarlo puesto sería dejar fijado un código que ya no pertenece
    // a la dirección que se está componiendo.
    effect(() => {
      this.via();
      untracked(() => {
        this.texto.set('');
        this.elegido.set(null);
        this.tocado.set(false);
        this.activo.set(-1);
        this.abierto.set(false);
        this.seleccion.emit(null);
      });
    });
  }

  /**
   * Los portales de la vía. Sin vía se devuelve `undefined`, que es como se le
   * dice a `httpResource` que no hay nada que pedir: así el campo deshabilitado
   * no molesta al motor.
   */
  protected readonly portales = httpResource<readonly Portal[]>(() => {
    const via = this.via();
    return via ? `/api/portales?via=${encodeURIComponent(via.codigo)}` : undefined;
  });

  /** Hay vía fijada: el campo se puede usar. */
  protected readonly listo = computed(() => this.via() !== null);

  private readonly todos = computed<readonly Portal[]>(() => this.portales.value() ?? []);

  /**
   * Lo que se enseña: los portales de la vía, filtrados por lo escrito.
   *
   * El filtro es por subcadena y sin distinguir mayúsculas, porque los números
   * traen letras («22B», «71 TV C2») y quien escribe «22» espera ver el 22 y
   * el 22B.
   */
  protected readonly lista = computed<readonly Portal[]>(() => {
    const escrito = this.texto().trim().toLowerCase();
    const todos = this.todos();
    const casan = escrito
      ? todos.filter((p) => p.numero.toLowerCase().includes(escrito))
      : todos;
    return casan.slice(0, VISIBLES);
  });

  /** Cuántos se han quedado fuera del recorte. Se dice, no se esconde. */
  protected readonly recortados = computed(() => {
    const escrito = this.texto().trim().toLowerCase();
    const casan = escrito
      ? this.todos().filter((p) => p.numero.toLowerCase().includes(escrito)).length
      : this.todos().length;
    return Math.max(0, casan - VISIBLES);
  });

  protected readonly hayQueMostrar = computed(() => this.abierto() && this.listo());

  /** Hay texto pero no hay portal elegido: borrador, y no vale. */
  private readonly esBorrador = computed(
    () => this.texto().trim() !== '' && this.elegido() === null,
  );

  /** Se enseña al salir, no mientras se teclea. Igual que el campo de calle. */
  protected readonly marcado = computed(() => this.tocado() && this.esBorrador());

  protected alEscribir(valor: string): void {
    this.texto.set(valor);
    this.abierto.set(true);
    this.activo.set(-1);
    this.elegido.set(null);
    this.seleccion.emit(null);
  }

  protected elegir(portal: Portal): void {
    this.elegido.set(portal);
    this.texto.set(portal.numero);
    this.seleccion.emit(portal);
    this.abierto.set(false);
    this.activo.set(-1);
  }

  protected alTeclear(evento: KeyboardEvent): void {
    const total = this.lista().length;
    if (evento.key === 'Escape') {
      this.abierto.set(false);
      this.activo.set(-1);
      return;
    }
    if (evento.key === 'ArrowDown' && total > 0) {
      evento.preventDefault();
      this.abierto.set(true);
      this.activo.set((this.activo() + 1) % total);
      return;
    }
    if (evento.key === 'ArrowUp' && total > 0) {
      evento.preventDefault();
      this.activo.set((this.activo() - 1 + total) % total);
      return;
    }
    if (evento.key === 'Enter' && this.activo() >= 0) {
      evento.preventDefault();
      const portal = this.lista()[this.activo()];
      if (portal) {
        this.elegir(portal);
      }
    }
  }

  protected alSalir(): void {
    this.tocado.set(true);
    setTimeout(() => this.abierto.set(false), 150);
  }
}
