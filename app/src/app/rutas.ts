import type { Routes } from '@angular/router';
import { Buscador } from './buscador';

/**
 * La página, y el comodín.
 *
 * [DOC] Angular declara la ruta por defecto con la cadena vacía: «This
 * configuration displays HomePage when users visit the root URL». El buscador
 * está en la raíz desde el principio y ahí sigue.
 *
 * **Hubo una segunda, `/visor`**, que era el instrumento con el que se
 * verificaba cada dato que entraba. Se retiró el 22/08: no es producto de la
 * app pública y **se reserva para la intranet, punto 14 del plan**. Su código
 * no está comentado, está borrado — vive en la historia de git, que es donde
 * el punto 14 lo va a buscar. Quien escriba hoy `/visor` cae en el comodín.
 */
export const rutas: Routes = [
  { path: '', component: Buscador },
  /**
   * ⭐ El panel de frescura de los datos, y **se carga aparte a propósito**.
   *
   * `loadComponent` en vez de `component`: así ni el código del panel ni su
   * plantilla viajan en el paquete de la portada, y el manifiesto que lee se
   * pide **solo cuando alguien entra aquí**. Es lo que mantiene en pie la ley
   * del 22/08 — la raíz en frío no baja un solo byte de datos—, que tiene su
   * propio guardián en `app.spec.ts`.
   *
   * No hay barra de navegación que lleve hasta aquí: se llega por la URL. Es
   * pública, y dónde acaba viviendo se decide en la intranet (punto 14).
   */
  { path: 'panel', loadComponent: () => import('./panel').then((m) => m.Panel) },
  // Una dirección que no existe no puede dejar la pantalla en blanco.
  { path: '**', redirectTo: '' },
];
