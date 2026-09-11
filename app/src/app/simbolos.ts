import { Component, input } from '@angular/core';

/**
 * ⭐ LOS SÍMBOLOS DE MATERIAL, AUTOALOJADOS (10/09, punto 15 · tanda 4).
 *
 * ── De dónde salen, y por qué no hay CDN ────────────────────────────────────
 *
 * Del repositorio oficial **`google/material-design-icons`**, Apache 2.0, uno a
 * uno y en su versión *outlined*. Los ficheros originales viven en
 * `app/simbolos/` con su licencia y sus sha256 — ficha § 1.38 del notices.
 *
 * ⚠️ **La fuente variable oficial existe y NO se usa.** Trae miles de símbolos
 *    en ~100 KB, y esta app se mide contra un presupuesto de portada que ya
 *    está en 521 kB. Para un censo corto, el SVG por icono es la vía magra:
 *    pesa lo que pesan nueve `path` y no baja nada de ningún tercero — la
 *    doctrina de Múnich que sacó a Inter del CDN de Google ni se roza aquí.
 *
 * ── ⭐ POR QUÉ EL `d` ESTÁ ESCRITO DOS VECES, Y POR QUÉ NO ES UNA COPIA SUELTA
 *
 * El dibujo vive en el `.svg` original **y** en esta tabla, porque inyectarlo
 * en línea es lo único que deja al icono heredar el color del texto
 * (`currentColor`): un `<img>` no se puede repintar, y los chips cambian de
 * tinta con su estado. Un `<img>` por icono serían además otras tantas peticiones.
 *
 * ⚠️ Dos copias del mismo dato es exactamente lo que `contraste.ts` cuenta que
 *    salió mal —cuatro copias de una fórmula, y la cuarta no era igual—, así
 *    que aquí la copia **tiene portero**: `simbolos.spec.ts` abre los nueve
 *    ficheros y compara su `d` con el de esta tabla, carácter a carácter. Si
 *    alguien retoca uno de los dos lados, la suite se pone roja.
 *
 * ── El `viewBox` ────────────────────────────────────────────────────────────
 *
 * `0 -960 960 960` en todos, verificado al generarlos: es la rejilla de
 * Material Symbols, y va aquí una sola vez en lugar de repetida en cada uno.
 */
export const REJILLA = '0 -960 960 960';

/** El nombre oficial del símbolo en el repositorio de Google. */
export type NombreDeSimbolo =
  | 'directions_walk'
  | 'directions_bus'
  | 'pedal_bike'
  | 'electric_scooter'
  | 'two_wheeler'
  | 'directions_car'
  | 'my_location'
  | 'swap_vert'
  | 'hourglass_empty'
  // ⭐ LOS TRES DE LA BARRA DE PESTAÑAS (11/09, tanda de móvil).
  | 'search'
  | 'route'
  | 'map';

/**
 * El trazado de cada símbolo, **copiado literal** de su `.svg` de
 * `app/simbolos/`. Quien toque uno tiene que tocar el otro: hay jueza.
 */
export const SIMBOLOS: Readonly<Record<NombreDeSimbolo, string>> = {
  // el chip de Andando
  directions_walk:
    'm280-40 112-564-72 28v136h-80v-188l202-86q14-6 29.5-7t29.5 4q14 5 26.5 14t20.5 23l40 64q26 42 70.5 69T760-520v80q-70 0-125-29t-94-74l-25 123 84 80v300h-80v-260l-84-64-72 324h-84Zm260-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z',
  // el chip de Bus / Tranvía
  directions_bus:
    'M240-120q-17 0-28.5-11.5T200-160v-82q-18-20-29-44.5T160-340v-380q0-83 77-121.5T480-880q172 0 246 37t74 123v380q0 29-11 53.5T760-242v82q0 17-11.5 28.5T720-120h-40q-17 0-28.5-11.5T640-160v-40H320v40q0 17-11.5 28.5T280-120h-40Zm242-640h224-448 224Zm158 280H240h480-80Zm-400-80h480v-120H240v120Zm100 240q25 0 42.5-17.5T400-380q0-25-17.5-42.5T340-440q-25 0-42.5 17.5T280-380q0 25 17.5 42.5T340-320Zm280 0q25 0 42.5-17.5T680-380q0-25-17.5-42.5T620-440q-25 0-42.5 17.5T560-380q0 25 17.5 42.5T620-320ZM258-760h448q-15-17-64.5-28.5T482-800q-107 0-156.5 12.5T258-760Zm62 480h320q33 0 56.5-23.5T720-360v-120H240v120q0 33 23.5 56.5T320-280Z',
  // el chip de Bici
  pedal_bike:
    'M200-160q-85 0-142.5-57.5T0-360q0-85 58.5-142.5T200-560q77 0 129.5 46T396-400h26l-72-200h-70v-80h200v80h-44l14 40h192l-58-160H480v-80h104q26 0 46.5 14t29.5 38l68 186h32q83 0 141.5 58.5T960-362q0 84-58 143t-142 59q-72 0-126.5-45T564-320H396q-14 69-68 114.5T200-160Zm0-80q41 0 70.5-22.5T312-320H200v-80h112q-12-36-41.5-58T200-480q-51 0-85.5 34.5T80-360q0 50 34.5 85t85.5 35Zm308-160h56q5-23 13.5-43t22.5-37H478l30 80Zm252 160q51 0 85.5-35t34.5-85q0-51-34.5-85.5T760-480h-4l40 106-76 28-38-106q-20 17-31 40t-11 52q0 50 34.5 85t85.5 35ZM196-360Zm564 0Z',
  // el chip de Patín (VMP)
  electric_scooter:
    'M200-240q-50 0-85-35t-35-85q0-50 35-85t85-35q39 0 69.5 22.5T312-400h212q11-68 56.5-119T692-590l-56-250H480v-80h156q27 0 49.5 17.5T714-858l76 338h-30q-66 0-113 47t-47 113v40H312q-12 35-42.5 57.5T200-240Zm0-80q17 0 28.5-11.5T240-360q0-17-11.5-28.5T200-400q-17 0-28.5 11.5T160-360q0 17 11.5 28.5T200-320Zm560 80q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T800-360q0-17-11.5-28.5T760-400q-17 0-28.5 11.5T720-360q0 17 11.5 28.5T760-320ZM520-40 280-160h160v-80l240 120H520v80ZM200-360Zm560 0Z',
  // el chip de Moto
  two_wheeler:
    'M160-200q-66 0-113-47T0-360q0-57 36.5-101t93.5-55l-28-24H0v-60h180l100 60 160-60h126l-62-80H400v-80h142l84 108 134-68v120h-92l70 92q15-6 30.5-9t31.5-3q66 0 113 47t47 113q0 66-47 113t-113 47q-66 0-113-47t-47-113q0-27 9.5-52.5T676-460l-20-24-136 204H400l-80-70q-5 63-51 106.5T160-200Zm0-80q33 0 56.5-23.5T240-360q0-33-23.5-56.5T160-440q-33 0-56.5 23.5T80-360q0 33 23.5 56.5T160-280Zm294-240-144 54 144-54h130-130Zm346 240q33 0 56.5-23.5T880-360q0-33-23.5-56.5T800-440q-33 0-56.5 23.5T720-360q0 33 23.5 56.5T800-280Zm-322-80 106-160H454l-144 54 120 106h48Z',
  // el chip de Coche
  directions_car:
    'M240-200v40q0 17-11.5 28.5T200-120h-40q-17 0-28.5-11.5T120-160v-320l84-240q6-18 21.5-29t34.5-11h440q19 0 34.5 11t21.5 29l84 240v320q0 17-11.5 28.5T800-120h-40q-17 0-28.5-11.5T720-160v-40H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z',
  // el botón «Mi ubicación» (la diana)
  my_location:
    'M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Zm0-80Z',
  // el botón de invertir origen y destino
  swap_vert:
    'M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287h-80ZM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56L600-80Z',
  // el aviso de que la consulta a la DGT tarda
  hourglass_empty:
    'M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Z',
  // la pestaña «Buscador» de la barra de móvil
  search:
    'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z',
  // la pestaña «Ruta» de la barra de móvil
  route:
    'M360-120q-66 0-113-47t-47-113v-327q-35-13-57.5-43.5T120-720q0-50 35-85t85-35q50 0 85 35t35 85q0 39-22.5 69.5T280-607v327q0 33 23.5 56.5T360-200q33 0 56.5-23.5T440-280v-400q0-66 47-113t113-47q66 0 113 47t47 113v327q35 13 57.5 43.5T840-240q0 50-35 85t-85 35q-50 0-85-35t-35-85q0-39 22.5-70t57.5-43v-327q0-33-23.5-56.5T600-760q-33 0-56.5 23.5T520-680v400q0 66-47 113t-113 47ZM240-680q17 0 28.5-11.5T280-720q0-17-11.5-28.5T240-760q-17 0-28.5 11.5T200-720q0 17 11.5 28.5T240-680Zm480 480q17 0 28.5-11.5T760-240q0-17-11.5-28.5T720-280q-17 0-28.5 11.5T680-240q0 17 11.5 28.5T720-200ZM240-720Zm480 480Z',
  // la pestaña «Mapa» de la barra de móvil
  map:
    'm600-120-240-84-186 72q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v560q0 13-7.5 23T812-192l-212 72Zm-40-98v-468l-160-56v468l160 56Zm80 0 120-40v-474l-120 46v468Zm-440-10 120-46v-468l-120 40v474Zm440-458v468-468Zm-320-56v468-468Z',
};

/**
 * ⭐ Un símbolo, en línea y del color del texto que lo rodea.
 *
 * ⚠️ **`aria-hidden` SIEMPRE, y no es descuido.** [DISEÑO: los emojis se van, el
 *    texto se queda] cada icono de esta app viaja al lado de su etiqueta
 *    visible, o dentro de un control que ya trae `aria-label`. Un icono que se
 *    anunciara además por su cuenta diría el nombre dos veces.
 *
 * `focusable="false"` porque Internet Explorer daba foco a los `<svg>` y algún
 * lector todavía lo hereda; `fill="currentColor"` es lo que hace que el chip
 * activo lo pinte con su `-text` y el inactivo con su `-strong`, sin una sola
 * regla de color aquí dentro.
 */
@Component({
  selector: 'app-simbolo',
  template: `
    <svg
      class="simbolo"
      [attr.viewBox]="rejilla"
      [attr.width]="lado()"
      [attr.height]="lado()"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="trazado()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    .simbolo {
      display: block;
    }
  `,
})
export class Simbolo {
  readonly nombre = input.required<NombreDeSimbolo>();
  /** El lado en píxeles. 20 es el de la referencia para chips y botones. */
  readonly lado = input(20);

  protected readonly rejilla = REJILLA;

  protected trazado(): string {
    return SIMBOLOS[this.nombre()];
  }
}
