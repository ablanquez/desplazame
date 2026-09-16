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
 *
 * ── ⭐ Y DESDE LA PARTE 3 (16/09) TAMBIÉN ESCRIBE ───────────────────────────
 *
 * `elegir` es el único sitio de la app que pone la capa 3. Escribir la capa 3
 * NO es repetir la prioridad: la prioridad la resuelven las tres capas del CSS,
 * y esto solo estampa la elección de una persona en la que manda.
 *
 * ⚠️ La otra mitad del mecanismo vive en el `<head>` del `index.html`, porque
 *    tiene que correr **antes del primer pintado** y ahí todavía no hay
 *    módulos. La llave del almacenamiento se escribe, por eso, en dos sitios —y
 *    lleva su portero en `tema.spec.ts`, que saca las dos y las compara.
 */

/**
 * ⭐ LA LLAVE DEL ALMACENAMIENTO, con el nombre de la app por delante.
 *
 * ⚠️ **Está escrita dos veces**: aquí y en el guion inline del `index.html`,
 *    que no puede importar nada porque corre antes de que existan los módulos.
 *    Si alguien renombra una y no la otra, la elección deja de sobrevivir a la
 *    recarga y **no se nota mirando la pantalla**. Por eso la jueza las compara.
 */
export const LLAVE_DEL_TEMA = 'desplazame:tema';

@Injectable({ providedIn: 'root' })
export class Tema {
  private readonly esOscuro = signal(temaDelDocumento());

  /** `true` si el tema que ha ganado es el oscuro. */
  readonly oscuro = this.esOscuro.asReadonly();

  /**
   * Estampa la elección: la capa 3 del CSS y el almacenamiento, en ese orden.
   *
   * ⚠️ La señal se vuelve a LEER del documento en vez de darle el valor que se
   *    acaba de pedir. Con hoja de estilos delante, lo que ha ganado lo dice
   *    `color-scheme` computado, no nuestra intención: si algún día la capa 3
   *    dejara de aplicarse, esto lo delataría en vez de taparlo.
   */
  elegir(oscuro: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    const cual = oscuro ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cual);
    try {
      localStorage.setItem(LLAVE_DEL_TEMA, cual);
    } catch {
      // ⚠️ En modo privado el almacenamiento LANZA. La elección vale para esta
      //    pestaña y no sobrevive a la recarga: es lo único que se puede hacer,
      //    y es mejor que quedarse sin conmutar.
    }
    this.esOscuro.set(temaDelDocumento());
  }

  /** Lo que hace el interruptor: al otro tema, y guardado. */
  alternar(): void {
    this.elegir(!this.esOscuro());
  }

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
