import type { Routes } from '@angular/router';
import { Buscador } from './buscador';
import { RUTAS_DE_INTRANET } from './rutas-intranet';

/**
 * La página, el comodín — y, si la construcción es local, la intranet.
 *
 * [DOC] Angular declara la ruta por defecto con la cadena vacía: «This
 * configuration displays HomePage when users visit the root URL». El buscador
 * está en la raíz desde el principio y ahí sigue.
 *
 * ⭐ **LO PÚBLICO Y LO QUE NO LO ES, SEPARADOS EN DOS FICHEROS** (19/09).
 *
 * Lo que se lee aquí es la app pública: la portada, la identidad, los créditos
 * y el comodín. Lo de la intranet —el visor de capas y el panel de frescura—
 * entra por `RUTAS_DE_INTRANET`, y **ese fichero lo reemplaza la configuración
 * `production` por uno vacío**. En el dist desplegado esta lista tiene cuatro
 * entradas; en la construcción local, seis.
 *
 * ⚠️ Por qué así y no con un `if` de entorno: un `if` deja el código dentro del
 *    paquete y solo lo esquiva al correr. Esto lo deja FUERA — el constructor
 *    no ve la importación, y el trozo no se genera. Es la diferencia entre
 *    «no se enseña» y «no está», y lo firmado es lo segundo.
 *
 * Quien escriba `/visor` o `/panel` en producción cae en el comodín, o sea, en
 * el buscador: ni pantalla en blanco ni 404. Tiene jueza en `app.spec.ts`.
 */
export const rutas: Routes = [
  { path: '', component: Buscador },
  /**
   * ⭐ La página de identidad visual, y **por la misma puerta que el panel**.
   *
   * `loadComponent` otra vez: ni su código ni su plantilla viajan en el
   * paquete de la portada. Es lo que deja intacta la ley del 22/08 —la raíz en
   * frío no baja nada— mientras esta página crece con muestras, tablas y una
   * letra propia.
   *
   * Tampoco hay barra de navegación que lleve hasta aquí: se llega por la URL.
   * Nace **sin tocar la portada**, que es como nació el panel de frescura y por
   * la misma razón — el sitio donde el ojo comprueba no puede ser el producto.
   */
  { path: 'identidad', loadComponent: () => import('./identidad').then((m) => m.Identidad) },
  /**
   * ⭐ La página de créditos y fuentes, y **por la misma puerta que las otras
   * dos**.
   *
   * `loadComponent`: la portada no baja ni su código ni su plantilla. Es la
   * misma ley del 22/08 y tiene el mismo guardián en `app.spec.ts`.
   *
   * ⚠️ **Y ésta SÍ tiene enlace**, que es lo que la distingue de `/panel` y de
   *    `/identidad`. Uno solo, y en la franja del pie: *«Leaflet | ©
   *    colaboradores de OpenStreetMap · Créditos»*. Un aviso legal al que sólo
   *    se llega escribiendo la URL no está *«accesible de forma permanente,
   *    fácil y directa»* [RD 1495/2011], que es justo lo que se le exige.
   */
  { path: 'creditos', loadComponent: () => import('./creditos').then((m) => m.Creditos) },
  /**
   * ⭐ Y LA INTRANET, que en producción es una lista VACÍA.
   *
   * Va **antes del comodín** y después de todo lo público: el comodín se come
   * lo que quede, así que cualquier ruta declarada tiene que estar por encima
   * de él. Cuando esta lista viene vacía, `/visor` y `/panel` caen al comodín
   * exactamente igual que cualquier otra dirección que no existe.
   */
  ...RUTAS_DE_INTRANET,
  // Una dirección que no existe no puede dejar la pantalla en blanco.
  { path: '**', redirectTo: '' },
];
