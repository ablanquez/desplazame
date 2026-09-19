import type { Routes } from '@angular/router';

/**
 * ⭐ LAS RUTAS DE LA INTRANET — **y este fichero NO viaja a producción**
 *    (19/09, fase 2 del punto de la intranet).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ **CÓMO DESAPARECE, que es lo que hay que entender antes de tocar esto.**
 *
 *  [angular.dev · *Build environments*] «`fileReplacements` … replaces any file
 *  in the TypeScript program with a target-specific version», y «any option
 *  that the build supports can be overridden in a build configuration».
 *
 *  La configuración `production` de `angular.json` **reemplaza este fichero por
 *  `rutas-intranet.vacio.ts`**, que devuelve una lista vacía. Con la lista
 *  vacía, los `loadComponent` de abajo no existen: el constructor de paquetes
 *  no ve importación alguna hacia `Visor` ni hacia `Panel`, **y sus trozos no
 *  se generan siquiera**. No es que se generen y no se sirvan: no se generan.
 *
 *  Y `defaultConfiguration` es `production`, así que **un `ng build` a secas ya
 *  sale limpio**. Para que salga sucio hay que pedirlo a mano.
 *
 *  La red que lo sostiene, por si algún día alguien cambia el mecanismo sin
 *  darse cuenta: `no-viaja.spec.ts` abre el dist CONSTRUIDO y comprueba que no
 *  hay rastro del visor, ni del panel, ni de los ficheros de datos. La corre
 *  `npm run comprobar-dist`, que es lo que el guardián de build ya ejecutaba.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **POR QUÉ SOLO-LOCAL, firmado por Antonio el 19/09.** [OWASP ASVS 2.32] pide
 * que las interfaces administrativas no sean accesibles a partes no confiables,
 * y su extremo fuerte —el que recoge la DevGuide— es que no sean accesibles
 * desde internet. Aquí eso sale gratis: esta herramienta tiene un solo usuario
 * y ese usuario tiene el repositorio en su disco.
 *
 * Y a cambio el invariante es **comprobable**, que es lo que «está protegido en
 * producción» nunca llega a ser: eso solo se sabe yendo a mirar.
 */
export const RUTAS_DE_INTRANET: Routes = [
  /**
   * ⭐ EL VISOR DE CAPAS. Las catorce de verificación y la morada.
   *
   * `loadComponent`, como las otras tres páginas que nacieron sin tocar la
   * portada. Aquí además **es lo que hace posible el fileReplacements**: con
   * `component` el visor se importaría de forma estática y viajaría en el
   * paquete de la portada, que es justo lo que la fase 1 midió y descartó.
   */
  { path: 'visor', loadComponent: () => import('./visor').then((m) => m.Visor) },

  /**
   * ⭐ EL PANEL DE FRESCURA — **mudado aquí el 19/09; nació público el 23/08**.
   *
   * Lo apalabraron el PLAN —*«instrumento ahora, mudanza a la intranet
   * después»*— y el propio `rutas.ts`, que llevaba escrito *«es pública, y
   * dónde acaba viviendo se decide en la intranet»*. Ésta es esa decisión.
   *
   * ⚠️ **Lo que se pierde, dicho en el parlamento y firmado:** ya no se puede
   *    mirar la frescura escribiendo `/panel` en producción. Se pierde la
   *    comodidad, **no la verdad**: `app/dist` va versionado y el push es el
   *    despliegue, así que el manifiesto que lee este panel en local y el que
   *    viaja a producción son el mismo fichero después de cada push.
   *
   * ⚠️ **Y qué ve ahora quien abra `/panel` en producción:** el motor sirve el
   *    `index.html` de respaldo —es una SPA, cualquier ruta lo recibe—, Angular
   *    arranca, no encuentra `panel` en su tabla y **el comodín `**` lo lleva
   *    al buscador**. Ni pantalla en blanco ni 404: la portada. Medido, no
   *    supuesto — tiene su jueza en `app.spec.ts`.
   */
  { path: 'panel', loadComponent: () => import('./panel').then((m) => m.Panel) },
];
