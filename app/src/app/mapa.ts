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
 * Ayuntamiento (Ley 37/2007), literal, y va colgada de CADA capa que enseñe
 * dato suyo —portales y carriles—: Leaflet la muestra mientras haya al menos
 * una encendida, que es justo cuando el dato se está mostrando.
 */
const ATRIBUCION_MUNICIPAL = 'Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)';

/**
 * Atribución del GTFS. La licencia de datos abiertos del MITMS exige «Powered
 * by MITRAMS» con enlace, citar la fuente, y decir si el dato es bruto o
 * procesado — aquí es bruto: se pintan los trazados tal como vienen.
 */
const ATRIBUCION_GTFS =
  'Trazados: GTFS de Avanza Zaragoza S.A.U. (dato bruto) · Powered by <a href="https://www.transportes.gob.es/" target="_blank" rel="noopener">MITRAMS</a>';

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

  /** Tramos de carril bici. Vacío = sin capa. */
  readonly carriles = input<readonly (readonly Vertice[])[]>([]);

  /** Postes de autobús. Vacío = sin capa. */
  readonly postes = input<readonly Vertice[]>([]);

  /** Trazados de línea del GTFS: cada uno, su lista de vértices. */
  readonly trazados = input<readonly (readonly Vertice[])[]>([]);

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: L.Map;
  private linea?: L.Polyline;
  private capaPortales?: L.LayerGroup;
  private capaGrafo?: L.Polyline;
  private capaCarriles?: L.Polyline;
  private capaPostes?: L.LayerGroup;
  private capaTrazados?: L.Polyline;
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
      this.pintarCarriles();
      this.pintarPostes();
      this.pintarTrazados();
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

    effect(() => {
      this.carriles();
      this.pintarCarriles();
    });

    effect(() => {
      this.postes();
      this.pintarPostes();
    });

    effect(() => {
      this.trazados();
      this.pintarTrazados();
    });
  }

  /**
   * Pinta los trazados de línea del GTFS, todos en una polilínea multi-tramo
   * como el grafo. Sin distinguir por línea: eso pide `trips`, y es del motor.
   * Lo que verifica esta capa es si los trazados calcan las avenidas.
   */
  private pintarTrazados(): void {
    if (!this.mapa) {
      return;
    }

    this.capaTrazados?.remove();
    this.capaTrazados = undefined;

    const lineas = this.trazados();
    if (lineas.length === 0) {
      this.refrescarControl();
      return;
    }

    const comienzo = performance.now();
    this.capaTrazados = L.polyline(
      lineas.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: '#7c3aed',
        weight: 2,
        opacity: 0.75,
        interactive: false,
        attribution: ATRIBUCION_GTFS,
      },
    ).addTo(this.mapa);

    console.info(
      `mapa: ${lineas.length} trazados pintados en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Siembra los postes de autobús. Son 944 —dos órdenes de magnitud menos que
   * los portales—, así que se pintan más grandes y con aro blanco: tienen que
   * distinguirse de los puntitos azules aunque estén encima.
   */
  private pintarPostes(): void {
    if (!this.mapa) {
      return;
    }

    this.capaPostes?.remove();
    this.capaPostes = undefined;

    const puntos = this.postes();
    if (puntos.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas();
    const comienzo = performance.now();
    this.capaPostes = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#dc2626',
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    ).addTo(this.mapa);

    console.info(
      `mapa: ${puntos.length} postes sembrados en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Pinta la red ciclable, encima del grafo y con la atribución municipal
   * colgada de la capa: si se apagan los portales y se dejan los carriles,
   * sigue habiendo dato del Ayuntamiento en pantalla.
   */
  private pintarCarriles(): void {
    if (!this.mapa) {
      return;
    }

    this.capaCarriles?.remove();
    this.capaCarriles = undefined;

    const tramos = this.carriles();
    if (tramos.length === 0) {
      this.refrescarControl();
      return;
    }

    const comienzo = performance.now();
    this.capaCarriles = L.polyline(
      tramos.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: '#db2777',
        weight: 2.5,
        opacity: 0.9,
        interactive: false,
        attribution: ATRIBUCION_MUNICIPAL,
      },
    ).addTo(this.mapa);

    console.info(
      `mapa: ${tramos.length} tramos de carril pintados en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
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
    if (this.capaCarriles) {
      capas[`Carriles bici (${this.carriles().length.toLocaleString('es-ES')})`] =
        this.capaCarriles;
    }
    if (this.capaPostes) {
      capas[`Postes de bus (${this.postes().length.toLocaleString('es-ES')})`] = this.capaPostes;
    }
    if (this.capaTrazados) {
      capas[`Trazados de líneas (${this.trazados().length.toLocaleString('es-ES')})`] =
        this.capaTrazados;
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
      { attribution: ATRIBUCION_MUNICIPAL },
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
