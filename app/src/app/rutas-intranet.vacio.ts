import type { Routes } from '@angular/router';

/**
 * ⭐ LA INTRANET, EN PRODUCCIÓN: **nada**.
 *
 * Este fichero sustituye a `rutas-intranet.ts` en la configuración
 * `production` de `angular.json`, por `fileReplacements` [angular.dev · *Build
 * environments*: «replaces any file in the TypeScript program with a
 * target-specific version»].
 *
 * Que esté vacío no es dejadez: es **el mecanismo**. Sin los `loadComponent`
 * del fichero de verdad, el constructor de paquetes no ve ninguna importación
 * hacia `Visor` ni hacia `Panel`, y por eso sus trozos **no se generan**. El
 * dist de producción no los contiene porque nunca existieron en él.
 *
 * ⚠️ **Tiene que seguir exportando lo mismo y con la misma forma.** Si alguien
 *    le cambia el nombre a la constante, `rutas.ts` deja de compilar en
 *    producción — y eso es bueno: el fallo sale en la construcción, no en el
 *    navegador de nadie.
 *
 * Quien quiera abrir el visor o el panel: `npm run local`, que es la
 * configuración que NO hace este reemplazo. Ver `app/README.md`.
 */
export const RUTAS_DE_INTRANET: Routes = [];
