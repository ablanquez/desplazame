import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

/** Un vértice del trazado: latitud y longitud. */
export type Vertice = readonly [number, number];

/** Zaragoza, y un zoom que enseña la ciudad entera. */
const CENTRO: L.LatLngTuple = [41.6488, -0.8891];
const ZOOM = 12;

/**
 * Atribución de OpenStreetMap. Es obligación de la ODbL, no cortesía, y la
 * palabra «colaboradores» NO es opcional: el ejemplo oficial de Leaflet la
 * omite, y omitirla es incumplir.
 */
const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a>';

/**
 * Atribución del dato municipal. La exige la licencia de reutilización del
 * Ayuntamiento (Ley 37/2007), literal, y va colgada de la capa de portales:
 * Leaflet la enseña solo mientras esa capa está encendida, que es justo cuando
 * el dato se está mostrando.
 */
const ATRIBUCION_PORTALES = 'Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa {
  /** Vértices a pintar. Vacío = sin línea. */
  readonly trazado = input<readonly Vertice[]>([]);

  /** Portales a sembrar. Vacío = sin capa. */
  readonly portales = input<readonly Vertice[]>([]);

  /** Aristas del grafo: cada una, su lista de vértices. Vacío = sin capa. */
  readonly grafo = input<readonly (readonly Vertice[])[]>([]);

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: L.Map;
  private linea?: L.Polyline;
  private capaPortales?: L.LayerGroup;
  private capaGrafo?: L.Polyline;
  private control?: L.Control.Layers;

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
      this.pintarPortales();
      this.pintarGrafo();
    });

    // Redibuja cuando cambia el trazado. Si el mapa aún no existe, no hace
    // nada: lo pinta el propio afterNextRender al terminar de montarlo.
    effect(() => {
      this.trazado();
      this.pintarTrazado();
    });

    effect(() => {
      this.portales();
      this.pintarPortales();
    });

    effect(() => {
      this.grafo();
      this.pintarGrafo();
    });
  }

  /**
   * Pinta la red del grafo. Las 98.774 aristas van en UNA sola polilínea:
   * [DOC] los tipos de Leaflet declaran
   * `polyline(latlngs: LatLngExpression[] | LatLngExpression[][])` — un array
   * de arrays es una multi-polilínea en un único objeto. Una capa y un dibujo,
   * en vez de 98.774 capas.
   */
  private pintarGrafo(): void {
    if (!this.mapa) {
      return;
    }

    this.capaGrafo?.remove();
    this.capaGrafo = undefined;

    const aristas = this.grafo();
    if (aristas.length === 0) {
      this.refrescarControl();
      return;
    }

    const comienzo = performance.now();
    this.capaGrafo = L.polyline(
      aristas.map((a) => a.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: '#15803d',
        weight: 1,
        opacity: 0.7,
        interactive: false,
      },
    ).addTo(this.mapa);

    console.info(
      `mapa: ${aristas.length} aristas pintadas en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /** Un solo control de capas, rehecho con las capas que existan ahora. */
  private refrescarControl(): void {
    this.control?.remove();
    this.control = undefined;
    if (!this.mapa) {
      return;
    }

    const capas: Record<string, L.Layer> = {};
    if (this.capaPortales) {
      capas[`Portales (${this.portales().length.toLocaleString('es-ES')})`] = this.capaPortales;
    }
    if (this.capaGrafo) {
      capas[`Grafo peatonal/ciclable (${this.grafo().length.toLocaleString('es-ES')})`] =
        this.capaGrafo;
    }
    if (Object.keys(capas).length > 0) {
      this.control = L.control.layers(undefined, capas).addTo(this.mapa);
    }
  }

  /**
   * Siembra los portales y los deja apagables con el control de capas de
   * Leaflet. Una sola capa: la anterior se quita antes de poner la nueva.
   */
  private pintarPortales(): void {
    if (!this.mapa) {
      return;
    }

    this.capaPortales?.remove();
    this.capaPortales = undefined;

    const puntos = this.portales();
    if (puntos.length === 0) {
      this.refrescarControl();
      return;
    }

    // [DOC] Leaflet: «preferCanvas — Whether Paths should be rendered on a
    // Canvas renderer. By default, all Paths are rendered in a SVG renderer.»
    // Con SVG, 46.150 portales serían 46.150 nodos del DOM. Aquí el canvas va
    // por CAPA y no en todo el mapa a propósito: la polilínea sigue en SVG, que
    // es lo que las pruebas pueden mirar bajo jsdom —jsdom no da contexto 2D—.
    const lienzoCanvas = L.canvas();

    const comienzo = performance.now();
    this.capaPortales = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 1.5,
          stroke: false,
          fillColor: '#1d4ed8',
          fillOpacity: 0.6,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_PORTALES },
    ).addTo(this.mapa);

    this.refrescarControl();

    console.info(
      `mapa: ${puntos.length} portales sembrados en ${Math.round(performance.now() - comienzo)} ms`,
    );
  }

  /** Una sola línea: la anterior se quita antes de poner la nueva. */
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

    // Discontinua y en el naranja del aviso: la línea es de prueba, y se ve.
    const puntos: L.LatLngTuple[] = vertices.map(([lat, lon]) => [lat, lon]);
    this.linea = L.polyline(puntos, {
      color: '#b45309',
      weight: 5,
      dashArray: '10 8',
    }).addTo(this.mapa);
    this.mapa.fitBounds(this.linea.getBounds(), { padding: [30, 30] });
  }
}
