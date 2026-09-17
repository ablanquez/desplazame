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
  | 'map'
  // ⭐ LA PINTURA DEL RESULTADO (12/09, tanda 5). Los doce primeros son las
  //    maniobras del timeline —la familia `turn_*` oficial más las cuatro
  //    que no son un giro—, y los tres últimos, la cabecera, el aviso y el
  //    error. Las otras tres maniobras (`coge`, `sube`, `baja`) reusan los
  //    iconos de modo que ya estaban: no se baja un dibujo que ya se tiene.
  | 'straight'
  | 'turn_left'
  | 'turn_right'
  | 'turn_slight_left'
  | 'turn_slight_right'
  | 'turn_sharp_left'
  | 'turn_sharp_right'
  | 'u_turn_left'
  | 'trip_origin'
  | 'flag'
  | 'local_parking'
  | 'transfer_within_a_station'
  | 'arrow_forward'
  | 'warning'
  | 'cloud_off'
  // ⭐ LA VUELTA DESDE CRÉDITOS (12/09). Es el último carácter que quedaba
  //    haciendo de icono en toda la app: un `←` de texto en el enlace de
  //    volver. Lo destapó el barrido de la P15 al ampliarse fuera del
  //    buscador, y se baja en vez de dejarle una excepción a la jueza —una
  //    jueza con una excepción declarada vale menos que una sin ninguna.
  | 'arrow_back'
  // ⭐ LOS DOS DEL CONMUTADOR (16/09, tanda 6 · parte 3). Son **dos dibujos y
  //    no dos tintas** a propósito: el estado del interruptor no puede decirse
  //    solo con color [WCAG 1.4.1]. El sol cuando el oscuro está apagado, la
  //    luna cuando está puesto — el icono acompaña a `aria-checked`, no lo
  //    sustituye. Bajados el 16/09 de la misma URL que los otros veintiocho.
  | 'light_mode'
  | 'dark_mode';

/**
 * El trazado de cada símbolo, **copiado literal** de su `.svg` de
 * `app/simbolos/`. Quien toque uno tiene que tocar el otro: hay jueza.
 */
export const SIMBOLOS: Readonly<Record<NombreDeSimbolo, string>> = {
  // el chip de Andando
  directions_walk:
    'm298-96 93-476-79 34v106h-72v-154l185-78q10-4 19.5-6t18.5-2q26 0 46 11.5t34 31.5l9 13q23 35 51.5 73.5T720-504v72q-65 0-115.5-24T527-522l-21 114 70 70v242h-72v-215l-73-56-62 271h-71Zm230-600q-35 0-59.5-24.5T444-780q0-35 24.5-59.5T528-864q35 0 59.5 24.5T612-780q0 35-24.5 59.5T528-696Z',
  // el chip de Bus / Tranvía
  directions_bus:
    'M264-144q-10.2 0-17.1-6.9-6.9-6.9-6.9-17.1v-85q-23-19-35.5-47T192-360v-360q0-72 58-108t230-36q171 0 229.5 36T768-720v360q0 32-12.5 60T720-253v85q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9h-48q-10.2 0-17.1-6.9-6.9-6.9-6.9-17.1v-48H336v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9h-48Zm218.18-600H692 269h213.18ZM624-480H264h432-72Zm-360-72h432v-120H264v120Zm96 216q20 0 34-14t14-34q0-20-14-34t-34-14q-20 0-34 14t-14 34q0 20 14 34t34 14Zm240 0q20 0 34-14t14-34q0-20-14-34t-34-14q-20 0-34 14t-14 34q0 20 14 34t34 14ZM269-744h423q-20-29-66-38.5T480-792q-93 0-140.5 10T269-744Zm67.06 456h288.22Q654-288 675-309.15T696-360v-120H264v120q0 30 21.17 51 21.16 21 50.89 21Z',
  // el chip de Bici
  pedal_bike:
    'M192-192q-81 0-136.5-55.5T0-384q0-79 53-135.5T192-576q69 0 121.5 44.5T380-420h47l-74-204h-65v-72h192v72h-50l17 48h204l-62-168H480v-72h108.8q27.2 0 42.7 12 15.5 12 25.5 36l70.04 192H760q81 0 140 55.5T959-384q0 79.84-56 135.92Q847-192 768-192q-69 0-122.5-44T579-348H380q-14 69-66.5 112.5T192-192Zm0-72q37 0 68.5-21.5T306-348H192v-72h114q-11-37-44-60.5T192-504q-50 0-85 35.5T72-384q0 50 35 85t85 35Zm312-156h76q5-23 14.5-44t24.5-40H473l31 84Zm263.5 156q49.5 0 85-35.5t35.5-84.01q0-49.49-38.5-87.99Q811-510 755-502q-1 0 0 0l41 114-68 24-40-109q-19.05 17-29.52 40Q648-410 648-384q0 50 35 85t84.5 35ZM192-381Zm570 5Z',
  // el chip de Patín (VMP)
  electric_scooter:
    'M216-264q-50 0-85-35t-35-85q0-50 35-85.5t85-35.5q39 0 71 23.5t43 61.5h178q10-72 59.5-125.5T689-617l-56-247H480v-72h152.59Q659-936 678-921.5q19 14.5 25 41.5l74 328h-33q-70 0-119 49t-49 119v36H330q-12 38-43.5 61T216-264Zm0-72q20.4 0 34.2-13.8Q264-363.6 264-384q0-20.4-13.8-34.2Q236.4-432 216-432q-20.4 0-34.2 13.8Q168-404.4 168-384q0 20.4 13.8 34.2Q195.6-336 216-336Zm528 72q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-72q20.4 0 34.2-13.8Q792-363.6 792-384q0-20.4-13.8-34.2Q764.4-432 744-432q-20.4 0-34.2 13.8Q696-404.4 696-384q0 20.4 13.8 34.2Q723.6-336 744-336ZM528-72 288-192h144v-96l240 120H528v96ZM216-384Zm528 0Z',
  // el chip de Moto
  two_wheeler:
    'M168-192q-70 0-119-49T0-360q0-64 41.5-112T146-526l-50-50H0v-48h156l132 106 144-58h155l-95-120H384v-72h142l109 137 133-89v144h-89l49 61q16-5 31.5-9t32.5-4q70 0 119 49t49 119q0 70-49 119t-119 49q-70 0-119-49t-49-119q0-32 12-61t33-53l-17-21-124 207H384l-50-50q-8 63-55.5 104.5T168-192Zm0-72q40 0 68-28t28-68q0-40-28-68t-68-28q-40 0-68 28t-28 68q0 40 28 68t68 28Zm278-240-126 50 126-50h128-128Zm346 240q40 0 68-28t28-68q0-40-28-68t-68-28q-40 0-68 28t-28 68q0 40 28 68t68 28Zm-305-96 87-144H446l-126 50 94 94h73Z',
  // el chip de Coche
  directions_car:
    'M240-216v48q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9h-48q-10.2 0-17.1-6.9-6.9-6.9-6.9-17.1v-312l78-195q7-21 25.6-33t41.4-12h382q22.8 0 41.4 12 18.6 12 25.6 33l78 195v312q0 10.2-6.9 17.1-6.9 6.9-17.1 6.9h-48q-10.2 0-17.1-6.9-6.9-6.9-6.9-17.1v-48H240Zm1-312h478l-48-120H289l-48 120Zm-25 72v168-168Zm96 132q20 0 34-14t14-34q0-20-14-34t-34-14q-20 0-34 14t-14 34q0 20 14 34t34 14Zm336 0q20 0 34-14t14-34q0-20-14-34t-34-14q-20 0-34 14t-14 34q0 20 14 34t34 14Zm-432 36h528v-168H216v168Z',
  // el botón «Mi ubicación» (la diana)
  my_location:
    'M444-48v-98q-121-14-202.5-96T146-444H48v-72h98q14-120 95.5-202T444-814v-98h72v98q121 14 202.5 96T814-516h98v72h-98q-14 120-95.5 202T516-146v98h-72Zm36-168q110 0 187-77t77-187q0-110-77-187t-187-77q-110 0-187 77t-77 187q0 110 77 187t187 77Zm0-120q-60 0-102-42t-42-102q0-60 42-102t102-42q60 0 102 42t42 102q0 60-42 102t-102 42Zm0-65q32.59 0 55.79-23.21Q559-447.41 559-480t-23.21-55.79Q512.59-559 480-559t-55.79 23.21Q401-512.59 401-480t23.21 55.79Q447.41-401 480-401Zm1-80Z',
  // el botón de invertir origen y destino
  swap_vert:
    'M324-432v-294L219-621l-51-51 192-192 192 192-51 51-105-105v294h-72ZM600-96 408-288l51-51 105 105v-294h72v294l105-105 51 51L600-96Z',
  // el aviso de que la consulta a la DGT tarda
  hourglass_empty:
    'M324-168h312v-120q0-65-45.5-110.5T480-444q-65 0-110.5 45.5T324-288v120Zm156-348q65 0 110.5-45.5T636-672v-120H324v120q0 65 45.5 110.5T480-516ZM192-96v-72h60v-120q0-59 28-109.5t78-82.5q-49-32-77.5-82.5T252-672v-120h-60v-72h576v72h-60v120q0 59-28.5 109.5T602-480q50 32 78 82.5T708-288v120h60v72H192Z',
  // la pestaña «Buscador» de la barra de móvil
  search:
    'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z',
  // la pestaña «Ruta» de la barra de móvil
  route:
    'M360-120q-66 0-113-47t-47-113v-327q-35-13-57.5-43.5T120-720q0-50 35-85t85-35q50 0 85 35t35 85q0 39-22.5 69.5T280-607v327q0 33 23.5 56.5T360-200q33 0 56.5-23.5T440-280v-400q0-66 47-113t113-47q66 0 113 47t47 113v327q35 13 57.5 43.5T840-240q0 50-35 85t-85 35q-50 0-85-35t-35-85q0-39 22.5-70t57.5-43v-327q0-33-23.5-56.5T600-760q-33 0-56.5 23.5T520-680v400q0 66-47 113t-113 47ZM240-680q17 0 28.5-11.5T280-720q0-17-11.5-28.5T240-760q-17 0-28.5 11.5T200-720q0 17 11.5 28.5T240-680Zm480 480q17 0 28.5-11.5T760-240q0-17-11.5-28.5T720-280q-17 0-28.5 11.5T680-240q0 17 11.5 28.5T720-200ZM240-720Zm480 480Z',
  // la pestaña «Mapa» de la barra de móvil
  map:
    'm600-120-240-84-186 72q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v560q0 13-7.5 23T812-192l-212 72Zm-40-98v-468l-160-56v468l160 56Zm80 0 120-40v-474l-120 46v468Zm-440-10 120-46v-468l-120 40v474Zm440-458v468-468Zm-320-56v468-468Z',
  // la maniobra «recto»
  straight:
    'M444-144v-534l-57 57-51-51 144-144 144 144-51 51-57-57v534h-72Z',
  // la maniobra «izquierda»
  turn_left:
    'M576-192v-337H282l57 57-51 51-144-144 144-144 51 51-57 57h294.24q29.6 0 50.68 21.15T648-529v337h-72Z',
  // la maniobra «derecha»
  turn_right:
    'M312-192v-337q0-29.7 21.08-50.85Q354.16-601 383.76-601H678l-57-57 51-51 144 144-144 144-51-51 57-57H383.76v337H312Z',
  // la maniobra «ligera-izquierda»
  turn_slight_left:
    'M528-192v-261L336-645v81h-72v-204h204v72h-81l192 192q10.04 10.17 15.52 23.59Q600-467 600-453.21V-192h-72Z',
  // la maniobra «ligera-derecha»
  turn_slight_right:
    'M360-192v-261.21q0-13.79 5.48-27.2Q370.96-493.83 381-504l192-192h-81v-72h204v204h-72v-81L432-453v261h-72Z',
  // la maniobra «cerrada-izquierda»
  turn_sharp_left:
    'M624-144v-240H336q-29 0-50.5-21.06-21.5-21.07-21.5-50.65V-678l-57 57-51-51 144-144 144 144-51 51-57-57v221.94h288q29.7 0 50.85 21.03Q696-414 696-384v240h-72Z',
  // la maniobra «cerrada-derecha»
  turn_sharp_right:
    'M264-144v-240q0-29.7 21.15-50.85Q306.3-456 336-456h288v-222l-57 57-51-51 144-144 144 144-51 51-57-57v222.29q0 29.58-21.5 50.65Q653-384 624-384H336v240h-72Z',
  // la maniobra «media-vuelta»
  u_turn_left:
    'M624-144v-408q0-60-42-102t-102-42q-60 0-102 42t-42 102v126l57-57 51 51-144 144-144-144 51-51 57 57v-126q0-90 63-153t153-63q90 0 153 63t63 153v408h-72Z',
  // la maniobra «salida»
  trip_origin:
    'M480-96q-78.72 0-148.8-30.24-70.08-30.24-122.4-82.56-52.32-52.32-82.56-122.4Q96-401.28 96-480q0-79.68 30.24-149.28T208.8-751.2q52.32-52.32 122.4-82.56Q401.28-864 480-864q79.68 0 149.28 30.24T751.2-751.2q52.32 52.32 82.56 121.92Q864-559.68 864-480q0 78.72-30.24 148.8-30.24 70.08-82.56 122.4-52.32 52.32-121.92 82.56Q559.68-96 480-96Zm0-144q100 0 170-70t70-170q0-100-70-170t-170-70q-100 0-170 70t-70 170q0 100 70 170t170 70Z',
  // la maniobra «llegada»
  flag:
    'M192-144v-672h336l24 96h216v384H528l-24-96H264v288h-72Zm300-431Zm92 167h112v-240H496l-24-96H264v240h296l24 96Z',
  // la maniobra «aparca»
  local_parking:
    'M288-144v-672h264q90 0 153 63t63 153q0 90-63 153t-153 63H432v240H288Zm144-384h120q29.7 0 50.85-21.21 21.15-21.21 21.15-51T602.85-651Q581.7-672 552-672H432v144Z',
  // la maniobra «transborda»
  transfer_within_a_station:
    'm106-120 93-476-79 34v106H48v-154l185-78q38-16 70.5-3t52.5 45l12 20q20 34 50 66t110 32v72q-59 0-108.5-26T337-552l-23 120 70 70v242h-72v-213l-76-75-57 288h-73Zm230-600q-35 0-59.5-24.5T252-804q0-35 24.5-59.5T336-888q35 0 59.5 24.5T420-804q0 35-24.5 59.5T336-720ZM720-96l-34-34 38-38H528v-48h196l-38-38 34-34 96 96-96 96Zm-96-144-96-96 96-96 34 34-38 38h196v48H620l38 38-34 34Z',
  // la flecha origen→destino de la cabecera
  arrow_forward:
    'M630-444H192v-72h438L429-717l51-51 288 288-288 288-51-51 201-201Z',
  // el aviso ámbar del viaje
  warning:
    'm48-144 432-720 432 720H48Zm127-72h610L480-724 175-216Zm304.79-48q15.21 0 25.71-10.29t10.5-25.5q0-15.21-10.29-25.71t-25.5-10.5q-15.21 0-25.71 10.29t-10.5 25.5q0 15.21 10.29 25.71t25.5 10.5ZM444-384h72v-192h-72v192Zm36-86Z',
  // la vuelta al buscador desde la página de créditos
  arrow_back:
    'm330-444 201 201-51 51-288-288 288-288 51 51-201 201h438v72H330Z',
  // el estado de error del resultado
  cloud_off:
    'M818-56 703-171H248q-88 0-148-59T40-377q0-80 50.5-134T217-577q2-14 6.5-31.5T236-640L70-806l42-42L861-99l-43 43ZM248-231h397L285-591q-11 15-14.5 34t-3.5 37h-19q-62 0-105 39.5t-43 101q0 61.5 43 105T248-231Zm216-181Zm390 210-47-47q25-17 39-38t14-50q0-43-31-73.5T755-441h-67v-81q0-88-61-147.5T478.47-729q-28.47 0-60.97 9T358-691l-42-42q36-29 77.5-42.5T478-789q111 0 190.5 79T748-520v21q72-1 122 45t50 117q0 35-16.5 73.5T854-202ZM583-470Z',
  // el conmutador con el oscuro APAGADO — el sol
  light_mode:
    'M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z',
  // el conmutador con el oscuro PUESTO — la luna
  dark_mode:
    'M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z',
};

/**
 * ⭐ QUÉ INSTANCIA ÓPTICA GUARDA EL CATÁLOGO DE CADA SÍMBOLO (18/09, el remate).
 *
 * [DOC OFICIAL, Material Symbols] **solo las instancias de 20 y 24 px están
 * alineadas a la retícula**; para cualquier otro tamaño se usa el eje óptico y
 * no el escalado. Por debajo de 20 el eje no baja más, así que **el suelo es la
 * instancia de 20**.
 *
 * El censo del 17/09 contó a qué tamaño se pinta cada símbolo, y el catálogo se
 * puso en consecuencia: **de cada uno se guarda la instancia que de verdad se
 * pinta**, no una instancia de referencia y luego un escalado.
 *
 * · **24 símbolos** solo se pintan por debajo de 20 px —los chips, los quince
 *   giros, los avisos, las flechas— y guardan su `opsz20`.
 * · **`cloud_off`** solo se pinta a 48, y guarda su `opsz48`.
 * · Los cinco restantes se pintan a 24 y guardan la instancia por defecto, que
 *   es la que el nombre sin sufijo identifica en el repositorio oficial.
 * · **`route` es el único que se pinta a DOS tamaños** —24 en la barra y 48 en
 *   el vacío—, y por eso es el único que necesita una segunda tabla.
 *
 * ⚠️ **El nombre del fichero dice qué instancia es**, y por eso hay sufijo: un
 *    `warning.svg` que por dentro fuera el de 20 sería una trampa esperando a
 *    quien lo abriera. La jueza compara el fichero con la entrada usando este
 *    mismo mapa, así que no pueden separarse.
 */
export const SUFIJO: Readonly<Partial<Record<NombreDeSimbolo, '_20px' | '_48px'>>> = {
  my_location: '_20px',
  swap_vert: '_20px',
  directions_walk: '_20px',
  directions_bus: '_20px',
  pedal_bike: '_20px',
  electric_scooter: '_20px',
  two_wheeler: '_20px',
  directions_car: '_20px',
  trip_origin: '_20px',
  straight: '_20px',
  turn_slight_right: '_20px',
  turn_right: '_20px',
  turn_sharp_right: '_20px',
  u_turn_left: '_20px',
  turn_sharp_left: '_20px',
  turn_left: '_20px',
  turn_slight_left: '_20px',
  local_parking: '_20px',
  transfer_within_a_station: '_20px',
  flag: '_20px',
  hourglass_empty: '_20px',
  warning: '_20px',
  arrow_forward: '_20px',
  arrow_back: '_20px',
  cloud_off: '_48px',
};

/** El fichero de `app/simbolos/` donde vive el trazado de este símbolo. */
export function ficheroDe(nombre: NombreDeSimbolo): string {
  return nombre + (SUFIJO[nombre] ?? '');
}

/**
 * ⭐ EL EJE ÓPTICO, Y POR QUÉ HAY UNA SEGUNDA TABLA (17/09, la identidad).
 *
 * [DOC OFICIAL, Material Symbols] la familia tiene cuatro ejes —relleno, peso,
 * grado y **tamaño óptico**— y del óptico existen **cuatro instancias: 20, 24,
 * 40 y 48**. Verificado contra el repositorio el 17/09: `symbols/web/route/
 * materialsymbolsoutlined/` trae 168 ficheros, y entre ellos `route_20px.svg`,
 * `route_24px.svg`, `route_40px.svg` y `route_48px.svg`.
 *
 * ⚠️ **Y no son el mismo dibujo escalado.** El trazado de `route` mide 594
 *    caracteres a 24 y 741 a 48: son dos dibujos distintos, pensados uno para
 *    cada tamaño. Escalar el de 24 hasta 48 engorda los trazos al doble, que es
 *    justo lo que el eje existe para evitar.
 *
 * ⚠️ POR QUÉ SOLO DOS ENTRADAS AQUÍ, Y NO UNA TABLA ENTERA POR TAMAÑO. El censo
 *    del 17/09 contó dónde se pinta cada símbolo: **dos usos a 48 px** —el
 *    `cloud_off` del error y el `route` del vacío— y todo lo demás por debajo de
 *    24. Los de 48 escalaban al doble y aquí se corrigen. Los de 14, 16 y 18 px
 *    **no tienen instancia exacta** —el eje no baja de 20— y su arreglo es otro:
 *    pasar a `opsz20` los símbolos que solo se pintan por debajo de 20. Son
 *    **24 ficheros**, y el precio está MEDIDO, no estimado: sus trazados pasan
 *    de 5.930 a 6.422 caracteres, **+492 (≈ 0,48 kB)**. Es barato, y aun así no
 *    se hace aquí: cambia lo que se pinta en casi toda la app, y la regla que lo
 *    justificaría es del §39, que todavía es un borrador sin firmar.
 *
 * La regla, escrita una vez: **la instancia igual o la inmediatamente menor**.
 */
export const SIMBOLOS_48: Readonly<Partial<Record<NombreDeSimbolo, string>>> = {
  // el vacío del resultado: «todavía no hay pasos»
  route:
    'M355-120q-65 0-110-45.53T200-275v-349q-35-13-57.5-41.26-22.5-28.27-22.5-64.41Q120-776 152.5-808t78-32q45.5 0 77.5 32.14t32 78.05q0 35.81-22.5 64.31T260-624v349q0 39.19 27.5 67.09Q315-180 355.5-180t67.5-27.91q27-27.9 27-67.09v-410q0-65 45-110t110-45q65 0 110 45t45 110v349q35 13 57.5 41.36Q840-266.27 840-230q0 45-32.08 77.5Q775.83-120 730-120q-45 0-77.5-32.5T620-230q0-36.3 22.5-65.15Q665-324 700-336v-349q0-40-27.5-67.5T605-780q-40 0-67.5 27.5T510-685v410q0 63.94-45 109.47T355-120ZM230.5-680q20.5 0 35-15t14.5-35.5q0-20.5-14.37-35Q251.25-780 230-780q-20 0-35 14.37-15 14.38-15 35.63 0 20 15 35t35.5 15Zm500 500q20.5 0 35-15t14.5-35.5q0-20.5-14.37-35Q751.25-280 730-280q-20 0-35 14.37-15 14.38-15 35.63 0 20 15 35t35.5 15ZM230-730Zm500 500Z',
};

/**
 * El trazado que le toca a un símbolo para el lado con que se va a pintar.
 *
 * ⚠️ Con `>= 48` y no `=== 48`: si mañana alguien pinta a 64, la instancia
 *    menor sigue siendo la de 48 y es la que menos miente.
 */
export function trazadoPara(nombre: NombreDeSimbolo, lado: number): string {
  if (lado >= 48 && SIMBOLOS_48[nombre]) {
    return SIMBOLOS_48[nombre];
  }
  return SIMBOLOS[nombre];
}

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
    // ⚠️ El dibujo depende del LADO, no solo del nombre: ver `trazadoPara`.
    return trazadoPara(this.nombre(), this.lado());
  }
}
