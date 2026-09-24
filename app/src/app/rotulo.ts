import { inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/**
 * ⭐ EL RÓTULO DE CADA PÁGINA: su `<title>` y su `<meta description>` (B-1, 24/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ QUÉ ESTABA MAL. Las cinco páginas compartían **un solo** `<title>` —el
 *  `Desplázame` que el andamiaje puso en `index.html`— y **ninguna** tenía
 *  descripción: medido, `document.title` idéntico en las cinco y
 *  `meta[name=description]` a `null` en todas. El `<h1>` sí distinguía cada
 *  página; el título, no.
 *
 *  Lo que eso cuesta, y no es teórico: con cinco pestañas abiertas todas se
 *  llaman igual, un marcador no dice a qué apunta, el historial no se puede
 *  leer, y en un resultado de buscador `/creditos` sale con el mismo rótulo
 *  que la portada y **sin la línea de debajo**, que es la descripción.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Se usan los servicios oficiales —`Title` y `Meta` de `@angular/platform-browser`,
 * que el hallazgo censó como **ausentes del proyecto entero**— y no un `document.title`
 * a mano: son los que Angular expone para esto y los que funcionan igual el día
 * que la página se sirva renderizada desde el servidor.
 *
 * ⚠️ `updateTag` y no `addTag`: con `addTag` cada navegación entre páginas
 *    **añadiría otra** `<meta name="description">` y el documento acabaría con
 *    cuatro. `updateTag` busca por el selector y reemplaza, que es lo que hace
 *    falta en una aplicación de una sola página.
 *
 * ⚠️ Se llama desde el CONSTRUCTOR de cada página, no desde la ruta: `inject`
 *    necesita contexto de inyección. Y vive aquí, en una función, para que el
 *    mecanismo esté escrito una vez — los TEXTOS, en cambio, van en cada
 *    página, porque son contenido suyo.
 */
export function rotular(titulo: string, descripcion: string): void {
  inject(Title).setTitle(titulo);
  inject(Meta).updateTag({ name: 'description', content: descripcion });
}
