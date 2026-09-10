import { Component } from '@angular/core';

/**
 * ⭐ LA PÁGINA DE CRÉDITOS (10/09, remate 2 de la tanda 3).
 *
 * ── Por qué la atribución deja de vivir pegada al mapa ──────────────────────
 *
 * Porque la ley pide **citar**, no pide **apelotonar**. [Ley 37/2007] obliga a
 * citar la fuente y la fecha de actualización; lo que no dice en ninguna parte
 * es que las cuatro fichas tengan que caber en una línea de diez píxeles al pie
 * de una pantalla. El patrón normativo es el contrario: [RD 1495/2011] pide el
 * aviso legal **accesible de forma permanente, fácil y directa**, que es como
 * lo resuelven todos los portales públicos — un enlace fijo a una página que lo
 * cuenta entero.
 *
 * ⚠️ **Con UNA excepción, y no es negociable: la atribución de OpenStreetMap.**
 *    Su política de teselas exige que se vea **claramente sobre el mapa**, sin
 *    esconderla detrás de un enlace ni de un despliegue de interfaz. Por eso esa
 *    —y sólo esa— se queda en la franja del pie, junto a Leaflet, y desde ahí
 *    sale la puerta a esta página.
 *
 * ── ⭐ DE DÓNDE SALE CADA PALABRA DE AQUÍ, que es lo que la hace fiable ──────
 *
 * **De ningún sitio nuevo.** Los cuatro titulares y sus fórmulas son, letra por
 * letra, los que llevaba el pie desde el 1/09, y cada uno tiene detrás su ficha
 * medida en `THIRD-PARTY-NOTICES.md` — con su licencia leída, su fecha y su
 * atribución exigida. Lo único que cambia es la **estructura**: lo que era una
 * línea corrida es aquí una sección por fuente.
 *
 * ⚠️ Redacción legal nueva **no se inventa**. Lo que esta página dice que exige
 *    una licencia, lo exige esa licencia y está transcrito en su ficha.
 *
 * ── Y por qué se carga aparte ───────────────────────────────────────────────
 *
 * `loadComponent` en las rutas, como `/panel` y `/identidad`: ni su código ni su
 * plantilla viajan en el paquete de la portada. Es la ley del 22/08 —la raíz en
 * frío no baja lo que no usa— y tiene su guardián en `app.spec.ts`.
 */
@Component({
  selector: 'app-creditos',
  templateUrl: './creditos.html',
  styleUrl: './creditos.css',
})
export class Creditos {}
