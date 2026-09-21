import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { REJILLA, SIMBOLOS, type NombreDeSimbolo } from './simbolos';
import {
  contraste,
  AA_GRAFICO,
  PLANO_MAS_CLARO,
  PLANO_MAS_OSCURO,
  PLANO_OSCURO_MAS_CLARO,
  PLANO_OSCURO_MAS_OSCURO,
} from './contraste';
import { Tema } from './tema';
// El vértice lo define el contrato, no este componente: es la misma forma que
// el motor devolverá en la geometría de un trayecto.
import type { TramoDelViaje, Vertice } from '@desplazame/tipos';
import { svgDeCapa, type Clase } from './iconos';

export type { Vertice };

/** Zaragoza, y un zoom que enseña la ciudad entera. */
export const CENTRO: L.LatLngTuple = [41.6488, -0.8891];
export const ZOOM = 12;

/**
 * Cuánto aire se le deja a la ruta al encuadrarla, en píxeles por lado.
 *
 * [PROPIO] 30 px. El lienzo del buscador mide 22 rem de alto —unos 350 px—, así
 * que los 60 px de holgura vertical se llevan un sexto: se nota, y es lo que
 * hace falta para que el portal de salida y el de llegada no queden pegados al
 * borde, que es justo donde el ojo los busca. Con menos no se separan; con más,
 * una ruta corta en el lienzo pequeño se queda sin sitio.
 */
const HOLGURA_DEL_ENCUADRE: L.PointTuple = [30, 30];

/**
 * ⭐ EL MARCADOR: cuánto mide y por dónde agarra el punto.
 *
 * 32 px de lado. Es el tamaño al que una chincheta de 24 unidades de dibujo se
 * lee sin acercarse y sigue dejando ver la calle de debajo; a 24 px la cruz de
 * farmacia pierde los brazos sobre un mapa con texto.
 *
 * **El anclaje es lo que no puede salir a ojo.** [DOC] Leaflet: `iconAnchor` es
 * *«the coordinates of the "tip" of the icon (relative to its top left
 * corner)»*, y ese punto es el que se posa sobre la coordenada. Los dos iconos
 * lo tienen en sitios distintos y por eso hay dos anclajes:
 *
 * · La **chincheta** señala con la PUNTA, que está abajo del todo: `[16, 32]`.
 *   Centrarla dejaría el punto real 16 px por encima de donde se ve la punta —
 *   media manzana de error a zoom de calle, y sin que nada lo delate.
 * · Las **figuras de sitio** —las dos cruces, la H en su cuadrado, el libro
 *   abierto, el lápiz con su manzana, el chupete y el birrete— no señalan con
 *   ningún borde: son marcas, y van centradas en su punto, `[16, 16]`. Con
 *   `Record<Clase, …>` están todas obligadas, así que una clase nueva no puede
 *   colarse sin que alguien decida por dónde agarra — y se ha cumplido dos
 *   veces: con bibliotecas (25/08) y con las tres de educación (27/08), que no
 *   compilaron hasta tener su fila.
 */
const LADO_DEL_MARCADOR = 32;
const ANCLAJE: Readonly<Record<Clase, L.PointTuple>> = {
  via: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR],
  farmacia: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  'centro-salud': [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  hospital: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  biblioteca: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  colegio: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  guarderia: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  universidad: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
};

/**
 * ⭐ CÓMO SE VISTE CADA TRAMO (30/08). Dos estilos que difieren **dos veces**:
 * en el trazo y en el color.
 *
 * [DOC Leaflet] `dashArray` es la opción de `L.Path` para los patrones simples
 * de trazo, que es justo lo que hace falta: una raya y un hueco.
 *
 * [WCAG 1.4.1, *Use of Color*] el color no puede ser el único medio de
 * transmitir una información. Aquí se cumple **de sobra**: el color distingue,
 * sí, pero el trazo distingue también y por su cuenta. Quien no separe el ámbar
 * del azul —o imprima esto en blanco y negro— sigue viendo un discontinuo y un
 * sólido. Quítese cualquiera de los dos y el otro basta.
 *
 * ⚠️ **Y el a-pie conserva el vestido de HOY, al píxel.** La línea única de
 * antes ya era `#b45309`, grosor 5 y `10 8` discontinuo, así que una ruta a pie
 * de las de siempre se pinta exactamente igual que ayer — y su juez de
 * no-regresión lo vigila. Lo que se estrena es el vestido del que va sobre
 * ruedas, no el del que anda.
 *
 * ── El azul, y por qué ESE azul ─────────────────────────────────────────────
 *
 * `#2563eb` [PROPIO, **firmado por Antonio el 30/08**: azul medio, «ni muy
 * oscuro ni muy claro»]. El valor exacto sale de medir, no de elegir a ojo:
 *
 *   - Su **luminancia relativa es 0,1532**, y la del ámbar que ya lleva la casa
 *     es **0,1591**. O sea: **el mismo peso visual**. Puestos uno al lado del
 *     otro, ninguno pesa más que el otro, que es lo que «medio» quiere decir
 *     aquí — un azul más oscuro (`#1d4ed8`, luminancia 0,1067) tira a marino y
 *     uno más claro (`#3b82f6`, 0,2355) a celeste.
 *   - **Contrasta 4,50 sobre la tierra de OSM** (`#f2efe9`) y 5,17 sobre la
 *     calzada blanca, algo **mejor** que el propio ámbar (4,38 y 5,02), que ya
 *     estaba aprobado y en uso. Sobre el agua (`#aad3df`) baja a 3,22, como le
 *     pasa al ámbar (3,13) — y por ahí no va ninguna ruta.
 */
const VESTIDO: Readonly<Record<TramoDelViaje['comoSeVa'], L.PolylineOptions>> = {
  /**
   * ⚠️ `dashOffset` y `lineCap` van ESCRITOS, y no es redundancia: el ribete se
   * construye con `{ ...vestido }`, así que lo que esté aquí lo hereda **por
   * construcción**. Un casing sólido debajo de un trazo discontinuo le
   * rellenaría los huecos y el a-pie dejaría de leerse como a-pie [WCAG 1.4.1:
   * el trazo es su segundo canal, el que sobrevive a un daltonismo].
   *
   * ⭐ **Y el `lineCap` es `butt`, no el `round` de Leaflet, y está MEDIDO.** Con
   * `round`, cada guión crece media anchura por cada extremo: el casing mide 9
   * px, así que cada guión suyo se alarga **4,5 px por lado** y se come un hueco
   * que mide 8. Recorrido el trazo píxel a píxel sobre la captura:
   *
   *     con `round` → 231 px de trazo · ámbar 154 · plano 56  → **24 %** de hueco
   *     con `butt`  → 231 px de trazo · ámbar 102 · plano 129 → **56 %** de hueco
   *
   * El patrón `10 8` da un 44 % en el ideal. Con `round` el a-pie se estaba
   * volviendo casi sólido; con `butt` los huecos vuelven.
   *
   * ⚠️ **Lo que cambia a la vista**: los extremos de cada guión pasan de
   * redondeados a rectos. Es el precio, y es menor que perder el discontinuo.
   */
  andando: { color: '#b45309', weight: 5, dashArray: '10 8', dashOffset: '0', lineCap: 'butt' },
  rodando: { color: '#2563eb', weight: 5, dashOffset: '0', lineCap: 'round' },
  /**
   * ⭐ EL MONTADO **NO TIENE COLOR PROPIO**, y por eso el de aquí no se usa.
   *
   * El de cada tramo sale de `tramo.linea.color`, que es el `route_color` que
   * el operador publica: la 29 es amarilla porque el feed dice que la 29 es
   * amarilla, y quien conoce la ciudad reconoce su línea por eso. Elegirlo
   * nosotros sería repintar la red.
   *
   * Este gris es lo que se pone cuando el tramo llega **sin línea** —una
   * respuesta vieja, un feed sin `route_color`—: sigue siendo sólido, que es
   * lo que lo distingue del a-pie y de la rueda, y no finge un color que no
   * hay. `weight` sí sale de aquí para todos: 6, un punto más gordo que los
   * demás, porque un vehículo compartido es el eje del viaje.
   */
  montado: { color: '#6b7280', weight: 6 },
};

/**
 * ⭐ EL ROJO DE LA ZONA DE BAJAS EMISIONES (3/09), medido con el instrumento.
 *
 * **Luminancia 0,1609**, que es el mismo peso visual que el azul de la rueda
 * (0,1532) y que el ámbar del a-pie (0,1591): puestos uno al lado del otro,
 * ninguno pesa más que el otro. Contra la tierra de OSM da **4,34:1** y contra
 * la calzada blanca **4,98**, en la misma horquilla que los otros dos.
 *
 * ⛔ **Y NO BASTA, y esto es lo importante.** Contra el azul de la rueda da
 *    **1,07:1**: para quien no distinga rojo de azul, los dos trazos son el
 *    mismo. [WCAG 1.4.1] el color no puede ser el único canal, así que la zona
 *    se dice **tres veces**: el polígono la dibuja, el aviso la nombra con
 *    palabras, y el propio corte parte la línea en dos donde empieza. Quitar
 *    cualquiera de los tres deja el rojo solo, y solo no vale.
 *
 * Como toda línea de esta pantalla, lleva su ribete: contra el peor color del
 * plano (`#f9b29c`) da 2,82:1, igual que el azul (2,92) y el ámbar (2,84).
 */
export const ROJO_DE_LA_ZONA = 'd32f2f';

/**
 * ⭐ EL BORDE DEL POLÍGONO, y **es el único trazo sin ribete de la pantalla**.
 *
 * ~~Puede permitírselo porque llega solo: `#b91c1c` da **3,66:1 contra el peor
 * color del plano** y **5,64 contra la tierra**, así que cumple el 3:1 de [WCAG
 * 1.4.11] sin que nadie le ponga nada debajo.~~
 *
 * ⛔ **No llegaba solo, y desde el remate de la tanda 6 · parte 2 lleva ribete EN
 *    CLARO.** El 3,66 era contra `#f9b29c`, el más oscuro del censo del lienzo
 *    ENTERO. Pero el borde del casco va por donde va el tranvía, que OSM pinta en
 *    `#787877`: es el 0,051 % del lienzo y el 4,6 % de lo que hay bajo el borde.
 *    Medido ahí en la P26, 1,46.
 *
 *    Se probó primero la regla del paso de familia: `#450a0a` (red-950) llegaba
 *    a 3,65 en 1920 y 1440. **En móvil daba 1,38**, porque allí el borde cruza
 *    además la letra de los rótulos (`#383837`). Bajo el borde conviven letra
 *    muy oscura, tranvía medio y calzada blanca, y **ningún color solo llega a
 *    3:1 contra los tres**: haría falta luminancia ≥ 0,217 por la letra, ≤ 0,029
 *    o ≥ 0,66 por el tranvía, y ≤ 0,30 por el blanco.
 *
 *    ⇒ Es el caso de las trazas, y se resuelve igual (decisión de Antonio, 15/09):
 *      **un ribete blanco debajo del borde**. El oscuro tiene su par propio
 *      (`BORDE_DE_LA_ZONA_EN_OSCURO`), llega solo y no lleva ribete.
 *
 *    ⚠️ Y con el ribete, `#b91c1c` TAMPOCO llegaba. La franja del ribete pisa el
 *       borde marrón de las calles, `rgb(199,155,78)`: el blanco da 2,55 contra
 *       él y el rojo 2,30 (P26, en los tres anchos). El par tiene que valer sobre
 *       CUALQUIER tesela, igual que el pin (`EN_EL_MAPA_CLARO` en `iconos.ts`):
 *       el blanco cubre las teselas de luminancia ≤ 0,30 y el borde cubre las
 *       demás si la suya es ≤ 0,0667. Paso mínimo de la familia que lo cumple:
 *       **`#7f1d1d`** (red-900, 0,055), contra su ribete 10,02.
 */
export const BORDE_DE_LA_ZONA = '7f1d1d';

/** El ribete del borde de la zona EN CLARO. Ver `BORDE_DE_LA_ZONA`. */
export const RIBETE_DEL_BORDE_DE_LA_ZONA = 'ffffff';

/**
 * ⭐ Y SU PAR EN OSCURO (15/09, tanda 6 · parte 2): el borde sobre Dark Matter.
 *
 * `#b91c1c` da **2,34:1 contra el más claro de la tesela oscura** (`#262626`):
 * lo que en claro se sostenía solo, en oscuro no llega. Por regla declarada, la
 * de los tokens del ámbar en la parte 1: **el paso mínimo de la misma familia
 * que llega a 3:1**, medido sobre lo pintado bajo el borde en la P26. No lleva
 * ribete: sigue siendo el único borde que no lo necesita.
 *
 * ⚠️ **El censo del plano entero no bastó, y la P26 lo cazó.** Contra `#262626`
 *    el paso siguiente, `#dc2626`, daba 3,13. Pero el borde del casco va por
 *    las rondas, y bajo él Dark Matter pinta sus calzadas `#444444`, que en el
 *    plano entero no llegan al 1 % y bajo el borde sí. Medido ahí, en los tres
 *    anchos: `#dc2626` **2,02** · `#ef4444` 2,59 · **`#f87171` 3,52**. El paso
 *    que llega es el red-400.
 */
export const BORDE_DE_LA_ZONA_EN_OSCURO = 'f87171';

/**
 * ⭐ EL RELLENO: un TINTE, no un bloque.
 *
 * Con `0,08` de opacidad, sobre la tierra de OSM el resultado es `#f0e0da`, que
 * da **1,12:1 contra la propia tierra** — se ve que hay algo y no se lee como
 * una mancha. Es deliberado: lo que tiene que leerse encima son las trazas, y
 * medido sobre esa mezcla el azul conserva **4,03:1** y el rojo **3,88**, los
 * dos por encima del 3:1.
 *
 * Un relleno más fuerte los bajaba: con `0,15` el rojo se queda en 3,49 sobre
 * la tierra teñida y en 2,39 sobre la primaria.
 */
export const RELLENO_DE_LA_ZONA = 0.08;
export const TINTA_DEL_RELLENO = 'd32f2f';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⭐ EL ÁREA DE SERVICIO DE YeGo (5/09), y **es una capa distinta de la ZBE**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Las dos son polígonos de contexto, las dos van debajo de las trazas, y **las
 * dos pueden estar en pantalla a la vez** — con «Pública YeGo» se pintan las
 * dos. Así que lo primero que hubo que medir no fue si el verde se ve: fue si se
 * distingue del rojo.
 *
 * ── ⛔ Y NO SE DISTINGUE POR EL COLOR. Ninguno lo haría ─────────────────────
 *
 * `#166534` contra el `#b91c1c` del borde de la ZBE da **1,10:1**. Y no es que
 * este verde sea mala elección: **no existe ningún color que llegue a 3:1
 * contra ese rojo** y que además se lea sobre el plano. La cuenta es cerrada —
 * para llegar a 3 haría falta una luminancia ≥ 0,384 (un tono casi blanco, que
 * se pierde sobre la calzada) o ≤ 0, que no existe. Medido con el instrumento,
 * no razonado. *
 * ⭐ **Por eso el segundo canal no es un adorno: es obligatorio** [WCAG 1.4.1,
 *    *el color no puede ser el único canal*]. El borde del área va **a rayas** y
 *    el de la Zona de Bajas Emisiones sigue continuo. Quien no distinga rojo de
 *    verde ve igual cuál es cuál — que es exactamente el mismo argumento que
 *    hace discontinuo el trazo del a-pie.
 *
 * ── Y lo que sí cumple, medido ──────────────────────────────────────────────
 *
 * **El borde `#166534`** [WCAG 1.4.11, 3:1 contra los adyacentes]: **6,21:1**
 * contra la tierra de OSM, **7,13** contra la calzada blanca y **4,03** contra
 * el peor color del plano (`#f9b29c`) — por encima del 3,66 que da el borde de
 * la ZBE, que ya estaba aprobado. Y como aquél, **va sin ribete**: no lo
 * necesita.
 *
 * **El relleno `#15803d` al 0,08**: sobre la tierra queda en `#e0e6db`, que da
 * **1,11:1** contra la propia tierra — se ve que hay algo y no se lee como una
 * mancha. Y lo que va encima sigue leyéndose: ámbar **3,95**, azul **4,06**,
 * rojo de la zona **3,91**.
 *
 * ⭐ **Y los dos rellenos ENCIMADOS también se midieron**, que es el caso que de
 *    verdad se ve en YeGo: `#dfd7cd`, y sobre él ámbar **3,52**, azul **3,63** y
 *    rojo **3,49**. Los tres siguen por encima del 3:1. Con un relleno más
 *    fuerte no lo estarían: es la misma razón por la que el de la ZBE es 0,08.
 */
export const BORDE_DEL_AREA = '166534';

/**
 * ⭐ Y SU PAR EN OSCURO (15/09): `#166534` da **2,12:1 contra `#262626`**. Mismo
 * paso mínimo de su familia verde que llega a 3:1 sobre lo pintado (P26), y las
 * rayas se quedan: son el canal que lo separa de la ZBE [WCAG 1.4.1].
 */
export const BORDE_DEL_AREA_EN_OSCURO = '15803d';
export const TINTA_DEL_AREA = '15803d';
export const RELLENO_DEL_AREA = 0.08;

/**
 * El patrón del borde del área, en píxeles [DOC SVG `stroke-dasharray`].
 *
 * ⚠️ Es **más corto que el `10 8` del a-pie**, y a propósito: aquél dibuja un
 *    recorrido y quiere leerse como pasos; éste dibuja un contorno y solo tiene
 *    que no confundirse con la línea continua de la Zona de Bajas Emisiones.
 */
export const RAYA_DEL_AREA = '6 4';

/** Un anillo del polígono: sus vértices en `[lat, lon]`, como el contrato. */
export type Anillo = readonly Vertice[];

/**
 * Una mancha del área: **el anillo exterior primero y sus huecos detrás**
 * [RFC 7946 § 3.1.6], que es además como Leaflet lo quiere — `L.polygon` lee el
 * primer anillo como contorno y los demás como agujeros.
 */
export type Mancha = readonly Anillo[];

/**
 * El vestido de un tramo, con el color de su línea cuando lo trae.
 *
 * [DOC] Leaflet: `color` es *«stroke color»* de la polilínea, y se pasa por
 * opciones —no por CSS— porque lo que hay debajo es un `<path>` de SVG con su
 * atributo `stroke`. El `#` se pone aquí: el feed publica `F5C100`, sin
 * almohadilla [referencia GTFS, `route_color`].
 */
function vestidoDe(tramo: TramoDelViaje): L.PolylineOptions {
  const base = VESTIDO[tramo.comoSeVa];
  if (tramo.linea) {
    return { ...base, color: `#${tramo.linea.color}` };
  }
  // ⭐ Y el trecho que va DENTRO de la zona, en rojo (3/09). El corte no se
  //    calcula aquí: viene en `TramoDelViaje.zbe`, que lo pone el motor con la
  //    marca de la arista. Ver el contrato y `ROJO_DE_LA_ZONA`.
  return tramo.zbe === true ? { ...base, color: `#${ROJO_DE_LA_ZONA}` } : base;
}

/** El nombre del panel donde vive el polígono de la zona. Ver dónde se crea. */
const PANE_ZONA = 'zbe';

/** Cuánto asoma el ribete por cada lado de la línea, en píxeles. */
export const ASOMA_EL_RIBETE = 2;

/**
 * ⭐ **EL PUNTERO DEL PASO: los candidatos de aspecto** (21/09, remate del 5b).
 *
 * ⚠️ **Esto sustituye al engrosado del trazo, por orden de Antonio.** El
 *    realce del 5b engordaba la rebanada de línea del paso [DOC Leaflet, su
 *    tutorial de interacción]. Con la captura delante, **no le gustó**. Su
 *    diseño, firmado: **como Google Maps — un PUNTERO en el punto de la
 *    maniobra**, y el engrosado fuera. El dato no cambia: el puntero se planta
 *    en el vértice `desde` del rango que el paso ya trae del motor.
 *
 * ⚠️ **EL ASPECTO NO ESTÁ DECIDIDO, y por eso esto es una TABLA.** Se pintan
 *    candidatos, Antonio elige mirando, y el elegido se fija en un remate
 *    corto. Es el método de la casa —el precedente de las bandas de cabecera:
 *    candidatos pintados delante—. La jueza P34 recorre esta tabla, así que
 *    elegir uno **no la reescribe**.
 *
 * ── De dónde sale cada color, y no hay ninguno inventado ───────────────
 *
 * · `tramo`  — el color del tramo que abre el paso: el ámbar del a-pie, el azul
 *              de la rueda, el del operador si va montado, el rojo de la Zona
 *              de Bajas Emisiones. El mismo `vestidoDe` que viste la línea.
 * · `ribete` — lo que `ribeteDe` calcula para ese color sobre ESTE plano: el
 *              mismo vecino que la línea ya lleva debajo desde el 1/09.
 * · `blanco` — `#ffffff`, que es el halo que los pines de la casa ya usan y
 *              que la P26 mide contra la tesela desde el 1/09.
 *
 * ── Cómo se mide el 1.4.11, con la vara que la casa ya tenía ────────────
 *
 * La doctrina está escrita en `ribeteDe` y es de esta casa: **el par tiene que
 * separarse del plano, y eso lo puede aportar cualquiera de los dos**. Así que
 * de cada candidato se miden dos cosas contra cada teselado: `borde/relleno`
 * —que el puntero se lea a sí mismo— y **lo que el par se separa del plano en
 * su caso más desfavorable**. La vara es `AA_GRAFICO`, 3:1. Las cifras van al
 * checkpoint, candidato a candidato.
 */
export type ClaveDePuntero = 'disco' | 'anillo' | 'diana';

/** De dónde sale una tinta. Ver la tabla: no hay una cuarta opción. */
export type TintaDelPuntero = 'tramo' | 'ribete' | 'blanco' | 'ninguno';

/** Un círculo del puntero. Un candidato son una o dos de éstas, de fuera a dentro. */
export interface CapaDePuntero {
  readonly radio: number;
  readonly grosor: number;
  readonly relleno: TintaDelPuntero;
  readonly borde: TintaDelPuntero;
}

export const PUNTEROS: Readonly<Record<ClaveDePuntero, readonly CapaDePuntero[]>> = {
  /**
   * **A · DISCO** — el color del tramo, con el mismo ribete que lleva su línea.
   * El más parco: no estrena ni una tinta, y el borde es el vecino que la casa
   * ya le calcula a ese color sobre ese plano.
   */
  disco: [{ radio: 7, grosor: 3, relleno: 'tramo', borde: 'ribete' }],
  /**
   * **B · ANILLO** — hueco y blanco por dentro, con el aro del color del tramo.
   * Es **el de Google Maps**, que es la referencia que Antonio nombró. Su
   * contorno exterior es el color del tramo, así que es el único de los tres
   * cuyo 1.4.11 depende de ese color y no de un ribete calculado: sus cifras
   * van dichas, no supuestas.
   */
  anillo: [{ radio: 7, grosor: 4, relleno: 'blanco', borde: 'tramo' }],
  /**
   * **C · DIANA** — un disco del ribete debajo y el color del tramo encima, sin
   * borde ninguno. El de fuera hace de halo, que es exactamente lo que los
   * pines de la casa ya hacen con su `#ffffff` desde el 1/09.
   */
  diana: [
    { radio: 9, grosor: 0, relleno: 'ribete', borde: 'ninguno' },
    { radio: 5, grosor: 0, relleno: 'tramo', borde: 'ninguno' },
  ],
};

/**
 * ⚠️ **EL QUE VIAJA HOY, Y ES PROVISIONAL.** Antonio no ha elegido todavía:
 *    esta tanda acaba en candidatos pintados, no en un puntero elegido. Va el
 *    primero de la tabla para que el producto no se quede sin gesto mientras
 *    tanto, y cambiar esta línea es todo lo que el remate corto tendrá que
 *    hacer — ni una jueza se mueve.
 */
export const PUNTERO_PUESTO: ClaveDePuntero = 'disco';

/** Los dos extremos de un plano: contra ellos se decide un ribete. */
export interface Plano {
  readonly masClaro: string;
  readonly masOscuro: string;
}

/** El teselado de OpenStreetMap, el del tema claro. Ver `contraste.ts`. */
export const PLANO_DE_OSM: Plano = { masClaro: PLANO_MAS_CLARO, masOscuro: PLANO_MAS_OSCURO };

/** Dark Matter de CARTO, el del tema oscuro. Ver `contraste.ts`. */
export const PLANO_DE_DARK_MATTER: Plano = {
  masClaro: PLANO_OSCURO_MAS_CLARO,
  masOscuro: PLANO_OSCURO_MAS_OSCURO,
};

/**
 * ⭐ EL RIBETE BAJO LA LÍNEA. **Lo lleva TODA línea de operador, siempre.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  [WCAG 1.4.11 AA · W3C *Understanding Non-text Contrast*] un gráfico que
 *  transporta información necesita **3:1 contra los colores ADYACENTES** — y esa
 *  palabra es la que decide esta función, porque una traza de bus no cruza un
 *  fondo: cruza el plano entero.
 *
 *  ⛔ **LA PRIMERA VERSIÓN DE ESTO SOLO PONÍA RIBETE SI LA LÍNEA NO LLEGABA A
 *    3:1 CONTRA LA TIERRA, y estaba mal por partida doble.** Lo cazó el ojo de
 *    Antonio el 1/09: *«la 21 sin reborde»*.
 *
 *    1. La 21 es `#978685` y da **3,02:1** contra la tierra. Pasaba el filtro
 *       **por dos centésimas**. Y con ella, 30 de las 53.
 *    2. Y el filtro preguntaba lo que no era. Censado el teselado real bajo un
 *       viaje de la 21, **la tierra es el 17,5 %** de lo que hay debajo, y
 *       contra 10 de los 14 colores más extendidos la 21 NO llega:
 *
 *           #f9b29c (la primaria naranja) → 1,96:1
 *           #c7c7b4 (industrial)          → 2,02:1
 *           #d1c6bd (edificado, 4,4 %)    → 2,07:1
 *           #fbd6a4 (la secundaria)       → 2,52:1
 *
 *  ⇒ Contra un plano de doce colores no hay «esta línea ya llega»: **hay líneas
 *    que llegan contra un trozo del plano**. El ribete convierte la pregunta en
 *    una que sí tiene respuesta, porque el vecino de la línea pasa a ser él.
 *
 *  ⇒ **Y EL COLOR DE LA LÍNEA SIGUE SIN TOCARSE.** Es la identidad de Avanza:
 *    quien conoce la ciudad reconoce su línea por el tono. Se pinta una segunda
 *    polilínea debajo, más ancha, que asoma 2 px por cada lado. La WCAG lo
 *    admite en sus palabras: *«un halo puede usarse como fondo»* al medir.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⭐ Y la uniformidad tiene además un precedente propio: es el argumento con el
 *    que ZetaBus decidió el chip —**todas las líneas del operador se visten
 *    igual**, porque una que se viste distinta se lee como un error y no como
 *    una categoría—. Ahí es doctrina de la casa, no criterio de la WCAG, y por
 *    eso se dice separado.
 *
 * ⚠️ **El tono se CALCULA, no se fija**, y son DOS condiciones, no una:
 *
 *    1. **La línea tiene que separarse de su ribete**, que es su vecino
 *       inmediato: un ribete que se confunde con la línea no es un ribete, es
 *       una línea más gorda.
 *    2. **El par tiene que separarse del plano** — y eso lo puede aportar
 *       cualquiera de los dos. Sobre un plano claro, un ribete negro lo aporta
 *       él; pero **una línea oscura lo aporta ella sola**, y entonces lo que le
 *       hace falta es un ribete CLARO que la perfile.
 *
 * ⭐ Y esa segunda condición no estaba en la primera cuenta, que pedía a los dos
 *    lo mismo. La cazó la juez de las 53: **la Ci2 (`#702283`, luminancia 0,062)
 *    daba 2,25:1 contra un ribete negro**. Con ella hay **nueve** líneas oscuras
 *    —Ci2, Ci3, Ci4, 34, 40, 52, 55, 57 y 60— que se ribetean en blanco y salen
 *    todas por encima de 4,05:1.
 *
 * Sobre este teselado, las 44 restantes salen en negro; pero es el resultado de
 * la cuenta y no una decisión escrita a mano: el día que OSM oscurezca su plano,
 * esta función cambia sola.
 *
 * ⭐ **Y ESE DÍA LLEGÓ CON EL TEMA OSCURO (15/09).** Sobre Dark Matter el plano
 *    es otro, y la misma cuenta con sus dos extremos (`PLANO_DE_DARK_MATTER`)
 *    viste de blanco lo que en claro iba de negro: el ámbar del a-pie, el azul
 *    de la rueda, el rojo de la zona. **Ni una línea cambia de color**: el
 *    route_color del feed sigue intacto, y lo único que se recalcula es su
 *    vecino.
 */
export function ribeteDe(color: string, plano: Plano = PLANO_DE_OSM): string {
  /** Lo que un color se separa del plano, en su caso más desfavorable. */
  const sobreElPlano = (c: string): number =>
    Math.min(contraste(c, plano.masClaro), contraste(c, plano.masOscuro));

  const candidatos = ['000000', 'FFFFFF'];
  let gana = candidatos[0]!;
  let mejor = -1;
  for (const c of candidatos) {
    // Del plano separa el que pueda: el ribete si es oscuro, la línea si lo es.
    const delPar = Math.max(sobreElPlano(c), sobreElPlano(color));
    const suPeor = Math.min(contraste(c, color), delPar);
    if (suPeor > mejor) {
      mejor = suPeor;
      gana = c;
    }
  }
  return gana;
}

/**
 * ⭐ EL SÍMBOLO DE CADA HITO, y son los MISMOS que la lista de pasos.
 *
 * Que el mapa y las indicaciones usen el mismo dibujo no es coquetería: quien
 * lee «Aparca en el aparcabicis de…» con la P del aparcamiento al lado tiene que
 * poder buscar esa misma marca en el plano sin traducir nada.
 *
 * ⚠️ **Aquí había cuatro caracteres Unicode** —`🚲 🅿 🚌 🚏`— y se van con la
 *    tanda 5, a la vez que los quince de la lista. Tenían que irse JUNTOS: la
 *    razón de esta tabla es que el plano y la lista digan lo mismo, así que
 *    dejar aquí un emoji mientras la lista dibuja un SVG habría roto justo lo
 *    que el guardián existe para proteger.
 *
 * `Record` exhaustivo por la misma razón de siempre: si el contrato añadiera un
 * hito, esta tabla dejaría de compilar en vez de dibujar un hueco.
 */
export const SIMBOLO_DEL_HITO: Readonly<
  Record<NonNullable<TramoDelViaje['hito']>, NombreDeSimbolo>
> = {
  coge: 'pedal_bike',
  aparca: 'local_parking',
  // Los dos del poste. Mismos nombres que la lista de pasos, por lo mismo de
  // siempre: quien lee «Sube a la 39…» busca esa marca en el plano.
  sube: 'directions_bus',
  baja: 'directions_walk',
};

/** El lado del icono de hito. Más pequeño que la chincheta: es una marca. */
const LADO_DEL_HITO = 24;

/**
 * Y el del dibujo DENTRO del disco. No es el mismo número: el disco mide 24 y
 * lleva 2 px de borde, así que un dibujo de 24 se comería el aro que lo hace
 * legible sobre cualquier tesela. 14 deja el aire que tenía el glifo.
 */
const LADO_DEL_DIBUJO = 14;

/**
 * Atribución de OpenStreetMap. Es obligación de la ODbL, no cortesía, y la
 * palabra «colaboradores» NO es opcional: el ejemplo oficial de Leaflet la
 * omite, y omitirla es incumplir.
 */
const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a>';

/**
 * ⭐ LA TESELA DE CADA TEMA (15/09, tanda 6 · parte 2).
 *
 * **Claro: la de OpenStreetMap de siempre**, tal cual. **Oscuro: Dark Matter de
 * CARTO**, que existe justo para esto: un plano apagado para que lo que va
 * encima se lea [DISEÑO § 33]. Un mapa blanco dentro del tema oscuro rompía la
 * luminancia baja que es la razón de ser del tema: medido, 0,70 de luminancia
 * media en el lienzo contra 0,013 de la tarjeta.
 *
 * [CARTO, *basemaps FAQ* y *basemap terms*, leídos el 15/09]
 * · Las raster siguen servidas **con key** (`?key=`). Sin ella salen con la
 *   marca «API KEY REQUIRED» cruzada; con ella, limpias (comprobado sobre una
 *   tesela del centro, guardada en el diagnóstico).
 * · Atribución **© OpenStreetMap + © CARTO**, visible mientras pinten sus
 *   teselas. Leaflet la cambia con la capa: la de cada capa se añade al
 *   ponerla y se quita al quitarla (`Control.Attribution`, `layeradd`/`remove`).
 * · Tope de 5 M de teselas al mes.
 * · Están en **retirada recomendada** hacia las vectoriales (MapLibre GL). La
 *   migración es un cambio de pila sin necesidad demostrada hoy: va al acta de
 *   THIRD-PARTY-NOTICES, no aquí.
 *
 * ⚠️ **LA KEY VA EN EL CÓDIGO DEL NAVEGADOR, y no puede ir en otro sitio**: la
 *    tesela la pide el navegador de quien mira, así que la URL con la key la
 *    ve cualquiera que abra las herramientas. Es una key de *basemaps* para
 *    uso en cliente, no un secreto de servidor.
 *
 * La palabra «colaboradores» sigue en la de CARTO por lo mismo que en la de OSM:
 * el dato debajo sigue siendo de OpenStreetMap, y la ODbL no cambia con quien
 * lo pinte.
 */
const CLAVE_CARTO = 'cb1_3lwh_1_86be5eb6855590e7c896dc90';

export const TESELA_CLARA = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  opciones: { maxZoom: 19, attribution: ATRIBUCION } satisfies L.TileLayerOptions,
};

export const TESELA_OSCURA = {
  url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${CLAVE_CARTO}`,
  opciones: {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution:
      ATRIBUCION +
      ' &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
  } satisfies L.TileLayerOptions,
};

/**
 * El mapa.
 *
 * Pinta el mapa base —OpenStreetMap con el tema claro, Dark Matter de CARTO con
 * el oscuro— y **una sola cosa encima**: el TRAZADO de la ruta, cuando lo hay.
 * El alto del lienzo es parámetro.
 *
 * **Tuvo catorce capas de verificación** —portales, grafo, carriles bici,
 * postes, trazados de bus, tranvía, BiZi, aparcabicis, aparcamotos, regulado,
 * ampliación, zonas y reservas PMR— con su control de casillas, que leía del
 * servicio `Capas`. Eran el instrumento con el que se verificaba cada dato que
 * entraba, y se fueron el 22/08 con el visor: **se reservan para la intranet,
 * punto 14 del plan**. No están comentadas, están borradas — 712 líneas que
 * vive la historia de git, que es donde el punto 14 las va a buscar.
 *
 * Lo que eso le quita a esta pantalla es peso, no función: montar el mapa ya no
 * baja ni un byte de `app/data/`.
 */
@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa {
  /** Vértices a pintar. Vacío = sin línea. */
  readonly trazado = input<readonly Vertice[]>([]);

  /**
   * ⭐ **CÓMO SE RECORRE CADA TRECHO**, para pintarlo con su trazo (30/08).
   *
   * Viene del contrato tal cual: cada tramo dice de qué vértice a qué vértice
   * va, cómo se va, y si muere en un hito. **Este componente no deriva nada**
   * —ni parte por metros ni busca costuras a ojo—: lee lo que el motor dice.
   *
   * Vacío es «no consta», y entonces se pinta **una sola línea con el vestido
   * del a-pie**, que es lo que había antes de que existieran los tramos.
   */
  readonly tramos = input<readonly TramoDelViaje[]>([]);

  /**
   * ⭐ **EL TRECHO QUE HAY QUE RESALTAR**, o `null` si ninguno (21/09, 5b).
   *
   * Los dos índices de un paso, tal como vienen del contrato: `Paso.desde` y
   * `Paso.hasta`, inclusivos, sobre el mismo `trazado` que ya se pinta. **Este
   * componente no sabe qué es un paso ni le hace falta**: recibe un rango y lo
   * engorda, igual que recibe tramos y los viste.
   *
   * ⚠️ Viene del contrato y no se deriva aquí, que es la misma ley del 30/08:
   *    acumular los `metros` de los pasos para adivinar dónde corta cada uno
   *    deriva —vienen redondeados a propósito—, y fue el error de 6,9 m que
   *    obligó a publicar los `tramos`.
   */
  readonly resaltado = input<{ readonly desde: number; readonly hasta: number } | null>(null);

  /**
   * ⭐ LA ZONA DE BAJAS EMISIONES, si hay que pintarla (3/09).
   *
   * Los anillos del polígono, en `[lat, lon]`. Vacío es «no la pintes», y es lo
   * que llega en todos los modos que no son coche: **el mapa no decide cuándo
   * se ve**, igual que no decide dónde se corta una traza. Quien lo usa se lo
   * da o no se lo da.
   *
   * [Patrón de serie] TomTom lo ofrece como «Mostrar en mapa → LEZ»: dibujar la
   * zona es la manera de que se entienda por qué la ruta hace lo que hace.
   */
  readonly zona = input<readonly Anillo[]>([]);

  /**
   * ⭐ EL ÁREA DE SERVICIO DE YeGo, si hay que pintarla (5/09).
   *
   * Las manchas donde el contrato del operador deja **terminar** un viaje. Vacío
   * es «no la pintes», y es lo que llega en los otros siete modos.
   *
   * ⚠️ Va **aparte de `zona`** y no en la misma lista, aunque las dos sean
   *    polígonos de contexto que viven en el mismo panel. Dos razones, y las dos
   *    de fondo: **son dos capas distintas con dos colores distintos** —juntarlas
   *    obligaría a llevar el color dentro del dato— y **`zona` es una lista de
   *    anillos y esto es una lista de MANCHAS**, cada una con sus huecos. Meter
   *    las manchas en `zona` aplanaría los huecos del centro y el mapa pintaría
   *    como área de servicio justo lo que está recortado de ella.
   */
  readonly area = input<readonly Mancha[]>([]);

  /**
   * El alto del lienzo, tal cual va al CSS. Leaflet exige una altura
   * DEFINIDA: si el contenedor no la tiene, el mapa se monta con 0 px de alto
   * y no se ve nada. Por defecto, el del formulario. El visor le pasa `100%`
   * y le da la altura desde fuera, con su propia caja flexible.
   */
  readonly alto = input('22rem');

  /**
   * ⭐ De qué CLASE es cada extremo de la ruta, para pintar su marcador.
   *
   * `null` es «no consta», y con «no consta» **no se pinta marcador**. No es
   * pereza: el icono dice qué clase de sitio hay ahí, y un icono elegido por
   * defecto diría una clase que nadie ha declarado. Quien no sabe, no dibuja.
   *
   * El punto sale de la geometría —el primer vértice y el último—, así que el
   * mapa no necesita coordenadas aparte: son las mismas que ya dibuja la línea,
   * y de ahí que no puedan discrepar.
   */
  readonly capaOrigen = input<Clase | null>(null);
  readonly capaDestino = input<Clase | null>(null);

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: L.Map;

  /** El tema que ha ganado. Ver `tema.ts`. */
  private readonly tema = inject(Tema);

  /** La capa de teselas puesta, y de qué tema es. */
  private tesela?: { readonly capa: L.TileLayer; readonly oscura: boolean };

  /** Con qué datos y en qué tema se pintó la última vez. Ver `pintarTrazado`. */
  private pintado?: { readonly datos: readonly unknown[]; readonly oscuro: boolean };

  /**
   * ⭐ «HE CAMBIADO DE TAMAÑO, VUELVE A MIRAR» (10/09, el esqueleto).
   *
   * [DOC Leaflet, `invalidateSize`] «Checks if the map container size changed
   * and updates the map if so — call it after you've changed the map size
   * dynamically.» Sin esta llamada, la mitad que antes no existía se queda en
   * **teselas grises**: Leaflet cree que el lienzo sigue midiendo lo de antes.
   *
   * ⚠️ Y SOLO HACE FALTA PARA EL PLEGADO DE LA COLUMNA, que es lo único que
   *    cambia el tamaño del CONTENEDOR. Los otros dos casos no lo necesitan:
   *
   *    · **El resize de ventana y la rotación los lleva Leaflet solo.** Su
   *      opción `trackResize` viene en `true` por defecto —«whether the map
   *      automatically handles browser window resize to update itself»— y este
   *      mapa se monta sin opciones, así que la conserva. Duplicarlo con un
   *      `ResizeObserver` propio sería poner un segundo mecanismo encima del
   *      nativo.
   *    · **Los dos estados de la hoja en móvil tampoco**: la hoja se superpone
   *      al mapa, que ocupa la pantalla entera por debajo. Su contenedor no
   *      cambia de tamaño, así que no hay nada que recalcular.
   *
   * Quien llama es el esqueleto, en `transitionend` — una vez, al terminar la
   * transición, y no a los N milisegundos de un número inventado.
   */
  revisarTamano(): void {
    this.mapa?.invalidateSize();
  }
  private lineas: L.Polyline[] = [];
  private marcas: L.Marker[] = [];
  /**
   * Los polígonos de contexto —la Zona de Bajas Emisiones y las manchas del área
   * de YeGo—, aparte: no se borran con las trazas por azar. Van juntos en una
   * lista porque **se quitan juntos**, que es lo único que esta lista decide;
   * cada uno se pinta con su color y su borde donde le toca.
   */
  private zonas: L.Polygon[] = [];
  /**
   * Los círculos del puntero, aparte de `lineas` **y por dos motivos**: se
   * ponen y se quitan con el ratón sin repintar la ruta entera —repintarla
   * volvería a encuadrar el mapa a cada pasada—, y **no entran en el
   * `fitBounds`**, que mira `lineas`: encuadrar por lo señalado daría un salto
   * de cámara cada vez que el ratón cruza un paso.
   *
   * [DOC Leaflet] el patrón de resaltado por punto es ése: el marcador se
   * **añade** al entrar y se **quita** al salir, no se esconde.
   */
  private realce: L.CircleMarker[] = [];

  constructor() {
    // [DOC] Angular: «Use afterNextRender to read or write the DOM once, for
    // example to initialize a non-Angular library.» Leaflet toca el DOM por su
    // cuenta, así que no puede montarse antes de que el lienzo exista.
    afterNextRender(() => {
      this.mapa = L.map(this.lienzo().nativeElement).setView(CENTRO, ZOOM);
      this.ponerTesela(this.tema.oscuro());
      // ⭐ EL PANEL DE LA ZONA, **entre las teselas y las trazas** [DOC Leaflet,
      //    *map panes*]: `tilePane` va en 200 y `overlayPane` —donde viven las
      //    polilíneas— en 400. En 350 el polígono tapa el plano y **nunca** una
      //    traza. Si compartiera panel con ellas, el orden lo decidiría quién se
      //    añadió antes, y eso cambia con cada ruta.
      const panel = this.mapa.createPane(PANE_ZONA);
      panel.style.zIndex = '350';
      this.pintarTrazado();
    });

    // Redibuja cuando cambia el trazado. Si el mapa aún no existe, no hace
    // nada: lo pinta el propio afterNextRender al terminar de montarlo.
    effect(() => {
      this.trazado();
      // Se leen para que el efecto dependa de ellas: cambiar de una dirección a
      // una farmacia sin mover la ruta tiene que repintar los marcadores.
      this.capaOrigen();
      this.capaDestino();
      // Y la zona: al pasar a coche aparece sin tocar la ruta.
      this.zona();
      // Y el área de YeGo, por lo mismo: aparece al elegir «Pública YeGo».
      this.area();
      // Y el tema: el ribete de cada línea y los bordes se deciden contra SU
      // plano, así que cambiar de tesela obliga a volver a vestirlas.
      this.tema.oscuro();
      this.pintarTrazado();
    });

    // ⭐ EL REALCE VA EN SU PROPIO EFECTO (21/09, 5b), no dentro de
    //    `pintarTrazado`: entrar y salir de un paso con el ratón no puede
    //    repintar la ruta entera ni volver a encuadrar el mapa. Lee también el
    //    trazado, los tramos y el tema porque de los tres depende lo que pinta.
    effect(() => {
      this.resaltado();
      this.trazado();
      this.tramos();
      this.tema.oscuro();
      this.pintarRealce();
    });

    // ⭐ LA TESELA SIGUE AL TEMA, EN CALIENTE (15/09). Sin recargar: se quita
    //    una capa y se pone la otra, y la atribución va con cada una.
    effect(() => {
      this.ponerTesela(this.tema.oscuro());
    });

    // Y al morir, se desmonta. Mientras hubo una sola pantalla esto no hacía
    // falta: el mapa nacía con la aplicación y moría con ella. Con el router
    // sí — el `RouterOutlet` destruye el componente cada vez que se sale de su
    // ruta—, y Leaflet no se entera solo: [DOC] «remove(): Destroys the map and
    // clears all related event listeners». Sin esto, cada ida y vuelta deja
    // atrás un mapa entero con sus escuchas de `window` y sus 46.150
    // marcadores, que nadie vuelve a mirar y nadie recoge.
    inject(DestroyRef).onDestroy(() => {
      this.mapa?.remove();
      this.mapa = undefined;
      this.tesela = undefined;
      this.pintado = undefined;
      this.marcas = [];
    });
  }

  /**
   * ⭐ PONE LA TESELA DEL TEMA, y quita la otra si estaba.
   *
   * [DOC Leaflet, `Control.Attribution`] al añadir una capa, su `attribution` se
   * suma al control (`layeradd`), y al quitarla se resta (`remove`). **Por eso la
   * atribución no se toca a mano**: viaja con su capa, y no puede quedarse la de
   * CARTO sobre las teselas de OSM ni al revés.
   *
   * ⚠️ La vieja se quita EN EL ACTO, no al cargar la nueva: esperar al `load`
   *    dejaría las dos atribuciones juntas mientras tanto, y para siempre si el
   *    mapa no está a la vista y nunca carga. Lo que asoma en ese hueco es el
   *    fondo del contenedor, y por eso ese fondo sale de un token (`mapa.css`):
   *    sin él, el `#ddd` de Leaflet sería un destello claro dentro del oscuro.
   */
  private ponerTesela(oscura: boolean): void {
    if (!this.mapa || this.tesela?.oscura === oscura) {
      return;
    }
    const cual = oscura ? TESELA_OSCURA : TESELA_CLARA;
    const nueva = L.tileLayer(cual.url, cual.opciones).addTo(this.mapa);
    this.tesela?.capa.remove();
    this.tesela = { capa: nueva, oscura };
  }

  /**
   * La ruta. Una sola línea: la anterior se quita antes de poner la nueva.
   *
   * **Naranja quemado `#b45309`, grosor 5, discontinua `10 8`** — los tres
   * valores de siempre, que se quedan. Nacieron para que se viera que la línea
   * era inventada, y ese motivo ya no existe; pero los otros dos que tenían sin
   * saberlo sí: el discontinuo es como se dibuja un recorrido A PIE —lo hace
   * Google Maps, que es el formato que imitan los pasos—, y es lo que separa la
   * ruta de las catorce capas de verificación, continuas todas menos la
   * hipótesis de la ampliación, que va morada y a grosor 3.
   *
   * Cambiar el color aquí obliga a repasar dos comentarios más: el de
   * `pintarRegulado` y el de `pintarAmpliacion`, que se apoyan en él.
   */
  /**
   * ⭐ **EL PUNTERO EN EL PUNTO DE LA MANIOBRA** (21/09, remate del 5b).
   *
   * [ANTONIO, con la captura delante] el engrosado del trazo **no le gustó**.
   * Su diseño: como Google Maps — al pasar por el paso, un puntero en el punto
   * de la maniobra. Aquí está, y **el dato es el mismo**: el vértice `desde`
   * del rango que el paso ya trae del motor desde el 5b. Ni el contrato ni los
   * rangos se han tocado.
   *
   * [DOC Leaflet] `L.circleMarker` es API de núcleo —*«like Circle, but with
   * a radius specified in screen pixels»*—, y eso es justo lo que hace falta:
   * un puntero que mide lo mismo con cualquier zoom. Un `L.circle` en metros
   * crecería y encogería, y a z12 sería un punto invisible.
   *
   * ⚠️ **Y AHORA EL PASO QUE CIERRA SÍ SEÑALA, que antes no podía.** La llegada
   *    y los hitos son degenerados —`desde === hasta`— y con el engrosado no
   *    había trecho que engordar, así que se quedaban a oscuras. Un PUNTO sí
   *    tienen: señalar dónde se aparca la bici o dónde está la puerta es
   *    exactamente lo que la orden pide —«un puntero en el punto de la
   *    maniobra»—, y la llegada es una maniobra. Es consecuencia del gesto
   *    nuevo, no un ensanche por mi cuenta, y va DICHO en el checkpoint.
   *
   * ⚠️ El color sale del TRAMO QUE ABRE EL PASO, no del primero de la lista: en
   *    la costura entre dos tramos el vértice pertenece a los dos —el solape de
   *    OSRM—, y el que vale es aquel hacia el que el paso camina.
   */
  private pintarRealce(): void {
    for (const circulo of this.realce) {
      circulo.remove();
    }
    this.realce = [];
    const rango = this.resaltado();
    const vertices = this.trazado();
    if (!this.mapa || !rango || vertices.length === 0) {
      return;
    }
    const donde = vertices[Math.min(Math.max(0, rango.desde), vertices.length - 1)];
    if (!donde) {
      return;
    }
    const plano = this.tema.oscuro() ? PLANO_DE_DARK_MATTER : PLANO_DE_OSM;
    const color = (vestidoDe(this.tramoQueAbre(rango.desde)).color ?? VESTIDO.andando.color!).replace('#', '');
    const tinta = (cual: TintaDelPuntero): string =>
      cual === 'tramo' ? `#${color}` : cual === 'ribete' ? `#${ribeteDe(color, plano)}` : '#ffffff';
    for (const capa of PUNTEROS[PUNTERO_PUESTO]) {
      const circulo = L.circleMarker([donde[0], donde[1]], {
        radius: capa.radio,
        fillColor: tinta(capa.relleno),
        fillOpacity: 1,
        stroke: capa.borde !== 'ninguno',
        color: capa.borde === 'ninguno' ? undefined : tinta(capa.borde),
        weight: capa.grosor,
        // No se pincha ni se arrastra: es un adorno que sigue al ratón, y si
        // capturara el puntero se comería el `mouseleave` del paso.
        interactive: false,
      }).addTo(this.mapa);
      circulo.bringToFront();
      this.realce.push(circulo);
    }
  }

  /**
   * El tramo que ABRE el paso que empieza en el vértice `v`.
   *
   * ⚠️ En la costura el vértice es de los dos tramos —el solape de OSRM—, y
   *    el bueno es hacia el que se camina: el que lo tiene como `desde`, o el
   *    que todavía no ha acabado en él. Coger el primero que lo contenga
   *    pintaría el puntero del color del tramo que se acaba de dejar.
   */
  private tramoQueAbre(v: number): TramoDelViaje {
    const tramos = this.tramos();
    return (
      tramos.find((t) => t.desde <= v && v < t.hasta) ??
      tramos.find((t) => t.desde <= v && v <= t.hasta) ??
      ({ comoSeVa: 'andando', desde: 0, hasta: 0, metros: 0, segundos: 0, hito: null } as TramoDelViaje)
    );
  }

  private pintarTrazado(): void {
    if (!this.mapa) {
      return;
    }

    for (const linea of this.lineas) {
      linea.remove();
    }
    this.lineas = [];
    // Los marcadores se quitan SIEMPRE antes de volver a ponerlos. Sin esto,
    // cada ruta nueva deja los dos de la anterior encima del mapa.
    for (const marca of this.marcas) {
      marca.remove();
    }
    this.marcas = [];
    for (const trozo of this.zonas) {
      trozo.remove();
    }
    this.zonas = [];

    // El plano sobre el que se viste todo: el del tema que ha ganado.
    const oscuro = this.tema.oscuro();
    const plano = oscuro ? PLANO_DE_DARK_MATTER : PLANO_DE_OSM;

    // ⭐ SI SOLO HA CAMBIADO EL TEMA, SE VUELVE A VESTIR PERO NO SE ENCUADRA
    //    (remate de la tanda 6 · parte 2, bitácora del 15/09). Quien ha movido el
    //    mapa y cambia de tema no tiene que perder lo que movió. Se comparan las
    //    MISMAS referencias que el `effect` lee: con cualquier dato nuevo —ruta,
    //    tramos, zona, área o extremos— se encuadra como siempre.
    const datos = [this.trazado(), this.tramos(), this.zona(), this.area(), this.capaOrigen(), this.capaDestino()] as const;
    const soloElTema =
      this.pintado !== undefined && this.pintado.oscuro !== oscuro && datos.every((d, i) => d === this.pintado!.datos[i]);
    this.pintado = { datos, oscuro };

    // ⭐ LA ZONA VA PRIMERO Y VA SIEMPRE QUE SE DÉ, haya ruta o no: quien elige
    //    «Coche» tiene que poder ver dónde está el casco **antes** de generar
    //    nada. Por eso se pinta antes del corte de «sin trazado».
    const anillos = this.zona();
    if (anillos.length > 0 && !oscuro) {
      // ⭐ EL RIBETE DEL BORDE, EN CLARO (remate de la tanda 6 · parte 2): debajo,
      //    por eso va primero. Sin relleno, 2 px más ancho por lado, y con la
      //    clase que lo separa del polígono. Ver `BORDE_DE_LA_ZONA`.
      this.zonas.push(
        L.polygon(
          anillos.map((anillo) => anillo.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
          {
            pane: PANE_ZONA,
            color: `#${RIBETE_DEL_BORDE_DE_LA_ZONA}`,
            weight: 2 + 2 * ASOMA_EL_RIBETE,
            fill: false,
            className: 'ribete-de-borde',
            interactive: false,
          },
        ).addTo(this.mapa),
      );
    }
    if (anillos.length > 0) {
      this.zonas.push(
        L.polygon(
          anillos.map((anillo) => anillo.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
          {
            pane: PANE_ZONA,
            color: `#${oscuro ? BORDE_DE_LA_ZONA_EN_OSCURO : BORDE_DE_LA_ZONA}`,
            weight: 2,
            fillColor: `#${TINTA_DEL_RELLENO}`,
            fillOpacity: RELLENO_DE_LA_ZONA,
            // ⚠️ **No intercepta el ratón.** Es un fondo, no un control: sin
            //    esto se come los clics y los arrastres del mapa que hay debajo,
            //    y el polígono cubre medio centro.
            interactive: false,
          },
        ).addTo(this.mapa),
      );
    }

    /**
     * ⭐ Y EL ÁREA DE SERVICIO, en el mismo panel y con la misma regla: va antes
     * del corte de «sin trazado», porque quien elige «Pública YeGo» tiene que
     * ver hasta dónde llega **antes** de pedir nada.
     *
     * ⚠️ Cada mancha es su propio `L.polygon` y **no se aplanan en uno solo**:
     *    con todos los anillos en una sola llamada, Leaflet leería el primero
     *    como contorno y los otros doce como agujeros suyos.
     */
    for (const mancha of this.area()) {
      this.zonas.push(
        L.polygon(
          mancha.map((anillo) => anillo.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
          {
            pane: PANE_ZONA,
            color: `#${oscuro ? BORDE_DEL_AREA_EN_OSCURO : BORDE_DEL_AREA}`,
            weight: 2,
            dashArray: RAYA_DEL_AREA,
            fillColor: `#${TINTA_DEL_AREA}`,
            fillOpacity: RELLENO_DEL_AREA,
            // Un fondo, no un control. Lo mismo que la zona de al lado.
            interactive: false,
          },
        ).addTo(this.mapa),
      );
    }

    const vertices = this.trazado();
    if (vertices.length === 0) {
      if (!soloElTema) {
        this.mapa.setView(CENTRO, ZOOM);
      }
      return;
    }

    const puntos: L.LatLngTuple[] = vertices.map(([lat, lon]) => [lat, lon]);
    // ⭐ UNA LÍNEA POR TRAMO. [DOC OTP] un itinerario es una lista de *legs*
    // con su modo, y esto es pintarlos como lo que son. Sin tramos —una
    // respuesta vieja, o una que no pudo dar ruta— se pinta la línea entera
    // con el vestido del a-pie, que es lo que había.
    const tramos = this.tramos();
    if (tramos.length === 0) {
      this.lineas.push(L.polyline(puntos, VESTIDO.andando).addTo(this.mapa));
    }
    for (const tramo of tramos) {
      // `hasta` es inclusivo y el vértice de la costura es de los dos tramos,
      // así que las líneas se tocan en vez de dejar un hueco entre ellas.
      const trozo = puntos.slice(tramo.desde, tramo.hasta + 1);
      if (trozo.length < 2) {
        continue;
      }
      // ⭐ EL RIBETE VA PRIMERO, que es lo que lo pone DEBAJO: Leaflet apila
      //    en el orden en que se añade. Ver `ribeteDe` para el porqué y el tono.
      //
      // ⭐ Y LO LLEVAN TODOS (1/09), no solo las líneas de operador. El ámbar del
      //    a-pie y el azul de la rueda parecían llegar por su cuenta —4,38:1 y
      //    4,50:1— porque se medían **contra la tierra**, que es el mismo error
      //    que dejó a la 21 sin el suyo. Contra el peor color del plano, la
      //    primaria naranja `#f9b29c`, dan **2,84:1** y **2,92:1**.
      //
      // ⚠️ El ribete se construye con `{ ...vestido }` y solo se le cambian el
      //    color y el grosor. Eso es lo que le hace heredar `dashArray`,
      //    `dashOffset` y `lineCap`: **el casing del a-pie es discontinuo**, con
      //    el mismo patrón. Uno sólido rellenaría los huecos y el trazo dejaría
      //    de distinguir al que anda del que va montado.
      const vestido = vestidoDe(tramo);
      const ribete = ribeteDe(vestido.color!.replace('#', ''), plano);
      this.lineas.push(
        L.polyline(trozo, {
          ...vestido,
          color: `#${ribete}`,
          weight: (vestido.weight ?? 5) + 2 * ASOMA_EL_RIBETE,
        }).addTo(this.mapa),
      );
      this.lineas.push(L.polyline(trozo, vestido).addTo(this.mapa));
    }

    this.marcar(vertices[0]!, this.capaOrigen(), 'origen');
    this.marcar(vertices[vertices.length - 1]!, this.capaDestino(), 'destino');
    // ⭐ Y los HITOS, en el vértice que el motor señala: el que cae **a 0,0 m**
    // de la estación o del aparcabicis. Ver `TramoDelViaje.hito`.
    for (const tramo of tramos) {
      if (tramo.hito !== null && vertices[tramo.hasta]) {
        this.marcarHito(vertices[tramo.hasta]!, tramo.hito);
      }
    }

    // El encuadre. [DOC] Leaflet: «fitBounds(bounds, options): Sets a map view
    // that contains the given geographical bounds with the maximum zoom level
    // possible», y `padding` es «Equivalent of setting both top left and bottom
    // right padding to the same value». Sin holgura, los dos extremos de la
    // ruta —que son justo los que se quieren ver— quedan tocando el borde.
    // El encuadre abarca TODAS las líneas: con una sola bastaba `getBounds`,
    // con varias hay que juntarlas o el mapa encuadraría solo la primera.
    const todo = this.lineas.reduce(
      (caja: L.LatLngBounds | null, linea) =>
        caja ? caja.extend(linea.getBounds()) : linea.getBounds(),
      null,
    );
    if (todo && !soloElTema) {
      this.mapa.fitBounds(todo, { padding: HOLGURA_DEL_ENCUADRE });
    }
  }

  /**
   * Un extremo, con el icono de su clase y su papel.
   *
   * [DOC] Leaflet: `divIcon` *«represents a lightweight icon for markers that
   * uses a simple `<div>` element instead of an image»*. Es lo que permite que
   * el marcador sea **el mismo SVG** que pinta la lista y el itinerario, en vez
   * de un PNG aparte que habría que mantener a juego a mano.
   *
   * `className: ''` a propósito: por defecto Leaflet le pone `leaflet-div-icon`,
   * que trae fondo blanco y borde gris — un recuadro alrededor de la chincheta.
   * Vacío, solo queda el dibujo.
   */
  private marcar(vertice: Vertice, capa: Clase | null, papel: 'origen' | 'destino'): void {
    if (!this.mapa || !capa) {
      return;
    }
    const [lat, lon] = vertice;
    const marca = L.marker([lat, lon], {
      icon: L.divIcon({
        // En claro, el tono del pin que llega sobre cualquier tesela. Ver `EN_EL_MAPA_CLARO`.
        html: svgDeCapa(capa, papel, LADO_DEL_MARCADOR, !this.tema.oscuro()),
        className: '',
        iconSize: [LADO_DEL_MARCADOR, LADO_DEL_MARCADOR],
        iconAnchor: ANCLAJE[capa],
      }),
      // El marcador no se pulsa: es una seña, no un botón. Y sin esto se lleva
      // el foco del teclado antes que los campos del formulario.
      keyboard: false,
      interactive: false,
    }).addTo(this.mapa);
    this.marcas.push(marca);
  }

  /**
   * ⭐ UN HITO: donde se coge o se deja el vehículo.
   *
   * Mismo `L.divIcon` que los extremos —*«a lightweight icon for markers that
   * uses a simple `<div>` element instead of an image»*— y por lo mismo: lo que
   * se dibuja es el mismo carácter que la lista de pasos escribe, así que no
   * hay dos cosas que mantener a juego.
   *
   * `iconAnchor` CENTRADO y no en la punta: esto no señala con ningún borde,
   * es una marca, igual que las figuras de sitio. El punto que se posa sobre la
   * coordenada es su centro.
   */
  private marcarHito(vertice: Vertice, hito: NonNullable<TramoDelViaje['hito']>): void {
    if (!this.mapa) {
      return;
    }
    const [lat, lon] = vertice;
    const marca = L.marker([lat, lon], {
      icon: L.divIcon({
        // ⚠️ Leaflet quiere HTML en crudo, así que aquí no puede entrar
        //    `app-simbolo`: el icono se compone a mano con el MISMO trazado que
        //    dibuja el componente —`SIMBOLOS`, la única fuente— y la misma
        //    rejilla. Lo que no se hace es copiar el trazado: se importa.
        html:
          `<span class="hito" aria-hidden="true">` +
          `<svg viewBox="${REJILLA}" width="${LADO_DEL_DIBUJO}" height="${LADO_DEL_DIBUJO}" ` +
          `fill="currentColor" focusable="false">` +
          `<path d="${SIMBOLOS[SIMBOLO_DEL_HITO[hito]]}"/></svg></span>`,
        className: '',
        iconSize: [LADO_DEL_HITO, LADO_DEL_HITO],
        iconAnchor: [LADO_DEL_HITO / 2, LADO_DEL_HITO / 2],
      }),
      keyboard: false,
      interactive: false,
    }).addTo(this.mapa);
    this.marcas.push(marca);
  }
}
