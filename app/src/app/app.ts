import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * La cáscara: la barra que lleva de una página a la otra y el hueco donde el
 * router monta la que toque. No tiene estado ni lógica — el buscador vive en
 * `Buscador` y el visor en `Visor`.
 *
 * [DOC] Angular: «To display child routes, the parent component includes its
 * own `<router-outlet>`.» Las rutas se declaran en `rutas.ts` y se enchufan con
 * `provideRouter` en `app.config.ts`.
 */
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
