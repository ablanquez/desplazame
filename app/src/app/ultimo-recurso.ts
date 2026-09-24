import { DOCUMENT } from '@angular/common';
import { ErrorHandler, Injectable, inject } from '@angular/core';

/**
 * ⭐ LO QUE SE LEE CUANDO NO SE PUEDE LEER NADA MÁS. Texto firmado por Antonio.
 *
 * Dice **tres** cosas y ninguna de más: que ha fallado, qué puede hacer quien
 * lo lee ahora mismo, y qué hacer si eso no basta. No pide un informe, no
 * nombra un error y no promete que ya está arreglado.
 */
export const TEXTO_DE_ULTIMO_RECURSO =
  'Algo ha fallado al arrancar el buscador. Recarga la página; si sigue pasando, vuelve en un rato.';

/** La marca del elemento que se pinta. La usa la jueza, y evita pintar dos. */
export const MARCA_DE_ULTIMO_RECURSO = 'desplazame-ultimo-recurso';

/**
 * ⭐ LA PANTALLA DE ÚLTIMO RECURSO (B-3, 24/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ EL HALLAZGO ERA QUE ESTO NO SE PODÍA NI PROBAR. La auditoría buscó cómo
 *  disparar una pantalla de error de último recurso y **no encontró ninguna**:
 *  no había `ErrorHandler` propio ni ruta de error, así que si la aplicación
 *  reventaba al arrancar lo que quedaba era **la misma página en blanco** que
 *  sin JavaScript. El marco dice que ese hecho ES el hallazgo, y lo era.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── ⚠️ POR QUÉ NO PINTA ANTE CUALQUIER ERROR, que sería lo fácil ────────────
 *
 * Porque `ErrorHandler` recibe **todos** los errores de la aplicación, no solo
 * los del arranque: un fallo pasajero dentro de un componente ya montado entra
 * por aquí igual. Pintar esta pantalla en ese caso **borraría una página que
 * estaba funcionando** y convertiría un tropiezo en una caída — el remedio
 * peor que la enfermedad.
 *
 * Así que la condición es concreta y comprobable: **solo si no se ha pintado
 * nada todavía**. Si `<app-root>` está vacío, el arranque no llegó; si tiene
 * algo dentro, la aplicación vive y este error se registra y se deja pasar.
 *
 * ── Por qué es HTML a mano y no un componente ───────────────────────────────
 *
 * Porque esto corre justamente cuando Angular no ha podido montar nada. Un
 * componente necesitaría lo que acaba de fallar. Son tres nodos del DOM y unos
 * estilos en línea: sin hoja, sin plantilla y sin nada que pueda faltar.
 *
 * ⚠️ Y los colores van a mano por lo mismo: los tokens viven en `styles.css`, y
 *    si el arranque falló no hay garantía de que esa hoja esté. Se usan los
 *    `color-scheme` del navegador para que se vea en claro y en oscuro.
 */
@Injectable()
export class UltimoRecurso implements ErrorHandler {
  private readonly doc = inject(DOCUMENT);

  handleError(error: unknown): void {
    // ⚠️ El motivo técnico NO se pierde: va a la consola, que es donde lo busca
    //    quien va a arreglarlo. Lo que no hace es salir a la pantalla.
    console.error(error);
    if (this.laAplicacionYaPinta()) {
      return;
    }
    this.pintar();
  }

  /** ¿Hay algo montado? `<app-root>` con contenido es que el arranque llegó. */
  private laAplicacionYaPinta(): boolean {
    const raiz = this.doc.querySelector('app-root');
    return !!raiz && raiz.childNodes.length > 0;
  }

  private pintar(): void {
    // Dos errores seguidos no pintan dos pantallas.
    if (this.doc.querySelector(`[data-marca="${MARCA_DE_ULTIMO_RECURSO}"]`)) {
      return;
    }
    const caja = this.doc.createElement('div');
    caja.setAttribute('data-marca', MARCA_DE_ULTIMO_RECURSO);
    // ⚠️ `role="alert"` para que un lector de pantalla lo cante al aparecer: es
    //    lo único que hay en la página, y quien no ve la pantalla no tiene otra
    //    forma de enterarse de que ya no va a llegar nada más.
    caja.setAttribute('role', 'alert');
    caja.setAttribute(
      'style',
      'margin: 2rem auto; max-width: 34rem; padding: 0 1rem;' +
        'font-family: system-ui, sans-serif; line-height: 1.5; color-scheme: light dark;',
    );
    const parrafo = this.doc.createElement('p');
    parrafo.textContent = TEXTO_DE_ULTIMO_RECURSO;
    caja.appendChild(parrafo);
    (this.doc.body ?? this.doc.documentElement).appendChild(caja);
  }
}
