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

/**
 * ⭐ LAS TRES ELECCIONES POSIBLES (20/09, la tanda de flecos).
 *
 * ⚠️ **`sistema` NO ES «ninguna de las dos»: es una elección, y distinta.**
 *    Quien la pone está pidiendo algo que ni «claro» ni «oscuro» dan — que la
 *    página siga al aparato, y que lo siga EN VIVO—. Con dos estados esa
 *    petición no se podía expresar: se tenía al arrancar, por no haber elegido
 *    nunca, y se perdía para siempre en cuanto alguien tocaba el conmutador.
 *    No había camino de vuelta, y ése es el defecto que el tercer estado cierra.
 */
export type EleccionDeTema = 'claro' | 'oscuro' | 'sistema';

/** Lo que el almacenamiento guarda, que es la capa 3 del CSS y no nuestro nombre. */
const EN_EL_ALMACEN: Readonly<Record<EleccionDeTema, string | null>> = {
  claro: 'light',
  oscuro: 'dark',
  sistema: null,
};

/** Y la vuelta: lo guardado, leído como elección. Basura y vacío son `sistema`. */
function eleccionGuardada(): EleccionDeTema {
  try {
    const guardada = localStorage.getItem(LLAVE_DEL_TEMA);
    if (guardada === 'dark') return 'oscuro';
    if (guardada === 'light') return 'claro';
  } catch {
    // Modo privado: el almacén lanza. Sin elección guardada, manda el sistema.
  }
  return 'sistema';
}

@Injectable({ providedIn: 'root' })
export class Tema {
  private readonly esOscuro = signal(temaDelDocumento());

  /** `true` si el tema que ha ganado es el oscuro. */
  readonly oscuro = this.esOscuro.asReadonly();

  private readonly eleccion = signal<EleccionDeTema>(eleccionGuardada());

  /**
   * ⭐ LA ELECCIÓN, que NO es lo mismo que el tema.
   *
   * `oscuro()` dice qué se está pintando; `elegida()` dice qué pidió la persona.
   * Con «sistema» puesto, `oscuro()` va cambiando con el aparato y `elegida()`
   * se queda quieta — y esa distinción es todo el tercer estado.
   */
  readonly elegida = this.eleccion.asReadonly();

  /**
   * ⭐ ESTAMPA LA ELECCIÓN: la capa 3 del CSS y el almacenamiento.
   *
   * ⚠️ **«Sistema» BORRA, no escribe.** Y no es una forma de hablar: la capa 2
   *    de `styles.css` —`prefers-color-scheme` sobre `:root:not([data-theme])`—
   *    solo manda MIENTRAS NO HAY ATRIBUTO. Escribir ahí el tema del sistema
   *    dejaría la página clavada en el que hubiera en ese momento y el aparato
   *    podría cambiar sin que nadie le hiciera caso. Devolver el mando es
   *    quitar el atributo y quitar la llave; lo demás ya está escrito en el CSS.
   *
   * ⚠️ La señal del TEMA se vuelve a LEER del documento en vez de darle el valor
   *    que se acaba de pedir. Con hoja de estilos delante, lo que ha ganado lo
   *    dice `color-scheme` computado, no nuestra intención: si algún día la capa
   *    3 dejara de aplicarse, esto lo delataría en vez de taparlo. Y con
   *    «sistema» es la única forma de saberlo, porque la respuesta la tiene el
   *    aparato.
   */
  elegir(cual: EleccionDeTema): void {
    if (typeof document === 'undefined') {
      return;
    }
    const valor = EN_EL_ALMACEN[cual];
    if (valor === null) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', valor);
    }
    try {
      if (valor === null) {
        localStorage.removeItem(LLAVE_DEL_TEMA);
      } else {
        localStorage.setItem(LLAVE_DEL_TEMA, valor);
      }
    } catch {
      // ⚠️ En modo privado el almacenamiento LANZA. La elección vale para esta
      //    pestaña y no sobrevive a la recarga: es lo único que se puede hacer,
      //    y es mejor que quedarse sin conmutar.
    }
    this.eleccion.set(cual);
    this.esOscuro.set(temaDelDocumento());
  }

  constructor() {
    if (typeof document === 'undefined') {
      return;
    }
    // ⚠️ Se releen LAS DOS señales, y la de la elección no es de adorno: la
    //    jueza P26 y el propio arnés escriben `data-theme` a mano, y sin esto el
    //    grupo de radios se quedaría enseñando una elección que ya no es la que
    //    manda. Lo que el documento dice, manda.
    const releer = (): void => {
      this.esOscuro.set(temaDelDocumento());
      this.eleccion.set(
        document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'oscuro'
          : document.documentElement.getAttribute('data-theme') === 'light'
            ? 'claro'
            : 'sistema',
      );
    };
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
