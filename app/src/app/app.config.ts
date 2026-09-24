import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { rutas } from './rutas';
import { UltimoRecurso } from './ultimo-recurso';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ⭐ LA PANTALLA DE ÚLTIMO RECURSO (B-3, 24/09). Sin esto, un fallo de
    //    arranque dejaba la misma página en blanco que no tener JavaScript, y
    //    la auditoría no encontró forma de dispararla porque no existía. El
    //    porqué entero —y por qué NO pinta ante cualquier error— en su fichero.
    { provide: ErrorHandler, useClass: UltimoRecurso },
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
