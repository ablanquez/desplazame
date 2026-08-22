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

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: L.Map;
  private linea?: L.Polyline;

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

    // El encuadre. [DOC] Leaflet: «fitBounds(bounds, options): Sets a map view
    // that contains the given geographical bounds with the maximum zoom level
    // possible», y `padding` es «Equivalent of setting both top left and bottom
    // right padding to the same value». Sin holgura, los dos extremos de la
    // ruta —que son justo los que se quieren ver— quedan tocando el borde.
    this.mapa.fitBounds(this.linea.getBounds(), { padding: HOLGURA_DEL_ENCUADRE });
  }
}
