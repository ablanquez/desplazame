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
// El vértice lo define el contrato, no este componente: es la misma forma que
// el motor devolverá en la geometría de un trayecto.
import type { Vertice } from '@desplazame/tipos';
import { svgDeCapa, type Clase } from './iconos';

export type { Vertice };

/** Zaragoza, y un zoom que enseña la ciudad entera. */
const CENTRO: L.LatLngTuple = [41.6488, -0.8891];
const ZOOM = 12;

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
 * · Las **tres figuras de sitio** —cruz verde, cruz azul y la H en su cuadrado—
 *   no señalan con ningún borde: son marcas, y van centradas en su punto,
 *   `[16, 16]`. Con `Record<Clase, …>` las cuatro son obligatorias, así que una
 *   clase nueva no puede colarse sin que alguien decida por dónde agarra.
 */
const LADO_DEL_MARCADOR = 32;
const ANCLAJE: Readonly<Record<Clase, L.PointTuple>> = {
  via: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR],
  farmacia: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  'centro-salud': [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
  hospital: [LADO_DEL_MARCADOR / 2, LADO_DEL_MARCADOR / 2],
};

/**
 * Atribución de OpenStreetMap. Es obligación de la ODbL, no cortesía, y la
 * palabra «colaboradores» NO es opcional: el ejemplo oficial de Leaflet la
 * omite, y omitirla es incumplir.
 */
const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a>';

/**
 * El mapa.
 *
 * Pinta el mapa base de OpenStreetMap y **una sola cosa encima**: el TRAZADO de
 * la ruta, cuando lo hay. El alto del lienzo es parámetro.
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
  private linea?: L.Polyline;
  private marcas: L.Marker[] = [];

  constructor() {
    // [DOC] Angular: «Use afterNextRender to read or write the DOM once, for
    // example to initialize a non-Angular library.» Leaflet toca el DOM por su
    // cuenta, así que no puede montarse antes de que el lienzo exista.
    afterNextRender(() => {
      this.mapa = L.map(this.lienzo().nativeElement).setView(CENTRO, ZOOM);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: ATRIBUCION,
      }).addTo(this.mapa);
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
      this.pintarTrazado();
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
      this.marcas = [];
    });
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
  private pintarTrazado(): void {
    if (!this.mapa) {
      return;
    }

    this.linea?.remove();
    this.linea = undefined;
    // Los marcadores se quitan SIEMPRE antes de volver a ponerlos. Sin esto,
    // cada ruta nueva deja los dos de la anterior encima del mapa.
    for (const marca of this.marcas) {
      marca.remove();
    }
    this.marcas = [];

    const vertices = this.trazado();
    if (vertices.length === 0) {
      this.mapa.setView(CENTRO, ZOOM);
      return;
    }

    const puntos: L.LatLngTuple[] = vertices.map(([lat, lon]) => [lat, lon]);
    this.linea = L.polyline(puntos, {
      color: '#b45309',
      weight: 5,
      dashArray: '10 8',
    }).addTo(this.mapa);

    this.marcar(vertices[0]!, this.capaOrigen(), 'origen');
    this.marcar(vertices[vertices.length - 1]!, this.capaDestino(), 'destino');

    // El encuadre. [DOC] Leaflet: «fitBounds(bounds, options): Sets a map view
    // that contains the given geographical bounds with the maximum zoom level
    // possible», y `padding` es «Equivalent of setting both top left and bottom
    // right padding to the same value». Sin holgura, los dos extremos de la
    // ruta —que son justo los que se quieren ver— quedan tocando el borde.
    this.mapa.fitBounds(this.linea.getBounds(), { padding: HOLGURA_DEL_ENCUADRE });
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
        html: svgDeCapa(capa, papel, LADO_DEL_MARCADOR),
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
}
