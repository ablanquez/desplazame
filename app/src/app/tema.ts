import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * ⭐ EL TEMA EFECTIVO, PARA QUIEN NO PINTA CON CSS (15/09, tanda 6 · parte 2).
 *
 * Los tokens resuelven el tema solos: `styles.css` lo decide en tres capas
 * —claro de partida, `prefers-color-scheme`, y `data-theme`, que manda—. Pero
 * hay piezas que no se pintan con CSS: **la tesela del mapa es una URL**, y su
 * atribución, un texto que Leaflet escribe. Esas necesitan saber el tema en
 * TypeScript, y cambiar cuando cambia.
 *
 * ⚠️ NO SE VUELVE A ESCRIBIR LA PRIORIDAD AQUÍ. Cada capa de `styles.css` fija
 *    también `color-scheme`, así que el valor computado de `color-scheme` en
 *    `<html>` YA ES el tema que ganó. Leerlo es leer el contrato, no copiarlo:
 *    una segunda copia de «elección > sistema > claro» es justo lo que la nº43
 *    enseñó a no tener.
 *
 * ⚠️ Cuándo se vuelve a leer: cuando cambia el atributo `data-theme` de
 *    `<html>` —el conmutador de la parte 3 y la jueza P26 lo tocan ahí— y
 *    cuando el sistema cambia de modo. El cambio llega a la señal, y la señal a
 *    quien la lea, **sin recargar la página**.
 *
 * ⚠️ Sin hoja de estilos (las pruebas de unidad, que no aplican CSS) el valor
 *    computado viene vacío y se lee el atributo, que es la capa que manda.
 */
@Injectable({ providedIn: 'root' })
export class Tema {
  private readonly esOscuro = signal(temaDelDocumento());

  /** `true` si el tema que ha ganado es el oscuro. */
  readonly oscuro = this.esOscuro.asReadonly();

  constructor() {
    if (typeof document === 'undefined') {
      return;
    }
    const releer = (): void => this.esOscuro.set(temaDelDocumento());
    const vigia = new MutationObserver(releer);
    vigia.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const sistema = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    sistema?.addEventListener('change', releer);
    inject(DestroyRef).onDestroy(() => {
      vigia.disconnect();
      sistema?.removeEventListener('change', releer);
    });
  }
}

function temaDelDocumento(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const raiz = document.documentElement;
  const esquema = getComputedStyle(raiz).colorScheme;
  if (esquema === 'dark' || esquema === 'light') {
    return esquema === 'dark';
  }
  return raiz.getAttribute('data-theme') === 'dark';
}
