import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Lo pide `httpResource`, que es con lo que el autocompletar habla con el
    // motor. En desarrollo la petición va a `/api/vias` y el proxy de
    // `ng serve` la lleva al 3000.
    provideHttpClient(),
  ],
};
