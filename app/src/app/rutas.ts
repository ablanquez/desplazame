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
  // Una dirección que no existe no puede dejar la pantalla en blanco.
  { path: '**', redirectTo: '' },
];
