import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { rutas } from './rutas';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Lo pide `httpResource`, que es con lo que el autocompletar habla con el
    // motor. En desarrollo la petición va a `/api/vias` y el proxy de
    // `ng serve` la lleva al 3000.
    provideHttpClient(),
    // [DOC] Angular: «Sets up providers necessary to enable Router
    // functionality for the application.» Es todo lo que hace falta para dos
    // páginas: ni estrategia de precarga, ni rutas perezosas, ni scroll.
    provideRouter(rutas),
  ],
};
