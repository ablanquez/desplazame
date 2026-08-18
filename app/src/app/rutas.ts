import type { Routes } from '@angular/router';
import { Buscador } from './buscador';
import { Visor } from './visor';

/**
 * Las dos páginas.
 *
 * [DOC] Angular declara la ruta por defecto con la cadena vacía: «This
 * configuration displays HomePage when users visit the root URL». El buscador
 * se queda donde estaba —la raíz—, así que ninguna dirección de hoy cambia.
 *
 * [PROPIO] El visor va en `/visor`: es el nombre de la página en español y de
 * una palabra, igual que el resto del código.
 */
export const rutas: Routes = [
  { path: '', component: Buscador },
  { path: 'visor', component: Visor },
  // Una dirección que no existe no puede dejar la pantalla en blanco.
  { path: '**', redirectTo: '' },
];
