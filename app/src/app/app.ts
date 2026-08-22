import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * La cáscara: el hueco donde el router monta la página. No tiene estado ni
 * lógica — el buscador vive en `Buscador`.
 *
 * **Tuvo una barra de navegación** con dos pestañas, Buscador y Visor de capas.
 * Se fue con el visor el 22/08: con una sola página, una barra de un solo
 * enlace es un adorno que no lleva a ninguna parte. Vuelve cuando haya a dónde.
 *
 * [DOC] Angular: «To display child routes, the parent component includes its
 * own `<router-outlet>`.» Las rutas se declaran en `rutas.ts` y se enchufan con
 * `provideRouter` en `app.config.ts`.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
