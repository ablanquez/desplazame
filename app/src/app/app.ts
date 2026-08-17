import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Mapa, type Vertice } from './mapa';

/** Los cuatro modos de transporte. Excluyentes: solo uno puede estar activo. */
export type Modo = 'andando' | 'bus' | 'bici' | 'coche';

/** Un paso de las indicaciones. */
export interface Paso {
  readonly texto: string;
  readonly detalle: string;
}

/**
 * ANDAMIO. Respuesta falsa y fija: no sale de ningún motor ni de ningún dato.
 * Existe para poder ver funcionar la pantalla entera antes de que exista el
 * motor, y se retira en el punto 6 del plan cuando el motor real la sustituya.
 */
const RUTA_DE_PRUEBA: readonly Paso[] = [
  { texto: 'Anda 150 m hasta la parada de prueba', detalle: '2 min' },
  { texto: 'Coge la línea de prueba y bájate en la tercera parada', detalle: '8 min' },
  { texto: 'Anda 200 m hasta el portal de destino', detalle: '3 min' },
];

/** ANDAMIO. El trazado que acompaña a RUTA_DE_PRUEBA: tampoco lo calcula nadie. */
const TRAZADO_DE_PRUEBA: readonly Vertice[] = [
  [41.6561, -0.8773],
  [41.6516, -0.879],
  [41.6468, -0.883],
  [41.6425, -0.8865],
];

/**
 * ANDAMIO DE VERIFICACIÓN. El navegador se baja los 46.150 portales enteros
 * (10,3 MB) solo para poder verlos sembrados en el mapa. En el punto 5 esto se
 * retira: el motor los tendrá en memoria y el navegador pedirá `/api/vias`, no
 * el fichero. La correa que lo sirve es la entrada `data` de `angular.json`.
 */
const PORTALES = '/datos/2026-05-13_zgzradar_callejero-portales-zaragoza.json';

/** Un portal, tal y como viene en el fichero municipal. */
interface PortalCrudo {
  readonly coordLat: number;
  readonly coordLon: number;
}

/**
 * ANDAMIO DE VERIFICACIÓN, como el de los portales. El fichero del grafo es un
 * `.js` de una sola línea (`window.GRAFO = {…};`) que se copió tal cual del
 * archivo: se pide como TEXTO y se le quita el prefijo en memoria. **Nunca se
 * carga como script.** En el punto 6 esto se retira: el grafo vivirá en el
 * motor y el navegador no se lo bajará.
 */
const GRAFO = '/datos/grafo-visor.js';
const GRAFO_PREFIJO = 'window.GRAFO = ';

/** Una arista: `g` son sus vértices, y vienen en [lon, lat]. */
interface AristaCruda {
  readonly g: readonly (readonly [number, number])[];
}

/**
 * ANDAMIO DE VERIFICACIÓN, como los otros dos. GeoJSON del WFS municipal: cada
 * rasgo es un MultiLineString, así que un rasgo puede traer varios tramos.
 * También en [lon, lat].
 */
const CARRILES = '/datos/2026-08-04_wfs_movilidad-MU2_carriles_bici.json';

interface CarrilCrudo {
  readonly geometry: { readonly coordinates: readonly (readonly (readonly [number, number])[])[] };
}

@Component({
  selector: 'app-root',
  imports: [FormsModule, Mapa],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** El orden en que se pintan los botones. */
  protected readonly modos: ReadonlyArray<{ id: Modo; etiqueta: string }> = [
    { id: 'andando', etiqueta: 'Andando' },
    { id: 'bus', etiqueta: 'Bus / tranvía' },
    { id: 'bici', etiqueta: 'Bici' },
    { id: 'coche', etiqueta: 'Coche' },
  ];

  protected calleOrigen = '';
  protected portalOrigen = '';
  protected calleDestino = '';
  protected portalDestino = '';

  /** Andando por defecto. */
  protected readonly modo = signal<Modo>('andando');

  /** Los pasos pintados. Vacío hasta que se genera. */
  protected readonly pasos = signal<readonly Paso[]>([]);

  /** Con qué modo se generó lo que hay en pantalla. */
  protected readonly modoGenerado = signal<Modo | null>(null);

  /** El trazado que se pinta en el mapa. Vacío hasta que se genera. */
  protected readonly trazado = signal<readonly Vertice[]>([]);

  /** Los portales, una vez descargados. Vacío mientras tanto. */
  protected readonly portales = signal<readonly Vertice[]>([]);

  /** Las aristas del grafo, una vez descargadas. Vacío mientras tanto. */
  protected readonly grafo = signal<readonly (readonly Vertice[])[]>([]);

  /** Los tramos de carril bici, una vez descargados. */
  protected readonly carriles = signal<readonly (readonly Vertice[])[]>([]);

  constructor() {
    this.cargarPortales();
    this.cargarGrafo();
    this.cargarCarriles();
  }

  /** Aplana los MultiLineString a tramos sueltos, que es lo que se pinta. */
  private async cargarCarriles(): Promise<void> {
    try {
      const respuesta = await fetch(CARRILES);
      if (!respuesta.ok) {
        console.error(`carriles: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly CarrilCrudo[] };
      this.carriles.set(
        crudo.features.flatMap((f) =>
          f.geometry.coordinates.map((tramo) => tramo.map(([lon, lat]) => [lat, lon] as Vertice)),
        ),
      );
    } catch (e) {
      console.error('carriles: no se pudieron cargar', e);
    }
  }

  /**
   * Pide el grafo como texto, le quita el prefijo de asignación y se queda
   * SOLO con las aristas: el enganche portal→arista y la auditoría que
   * también viajan en el fichero ni se leen ni se pintan.
   */
  private async cargarGrafo(): Promise<void> {
    try {
      const respuesta = await fetch(GRAFO);
      if (!respuesta.ok) {
        console.error(`grafo: el servidor respondió ${respuesta.status}`);
        return;
      }
      const texto = await respuesta.text();
      if (!texto.startsWith(GRAFO_PREFIJO)) {
        console.error('grafo: el fichero no empieza por el prefijo esperado');
        return;
      }
      const crudo = JSON.parse(texto.slice(GRAFO_PREFIJO.length).replace(/;\s*$/, '')) as {
        readonly aristas: readonly AristaCruda[];
      };
      this.grafo.set(
        crudo.aristas.map((a) => a.g.map(([lon, lat]) => [lat, lon] as Vertice)),
      );
    } catch (e) {
      console.error('grafo: no se pudo cargar', e);
    }
  }

  private async cargarPortales(): Promise<void> {
    try {
      const respuesta = await fetch(PORTALES);
      if (!respuesta.ok) {
        console.error(`portales: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudos = (await respuesta.json()) as readonly PortalCrudo[];
      this.portales.set(crudos.map((p) => [p.coordLat, p.coordLon] as Vertice));
    } catch (e) {
      console.error('portales: no se pudieron cargar', e);
    }
  }

  protected elegirModo(modo: Modo): void {
    this.modo.set(modo);
  }

  protected etiquetaDe(modo: Modo): string {
    return this.modos.find((m) => m.id === modo)?.etiqueta ?? modo;
  }

  /** Pinta la ruta de prueba. Con algún campo vacío no hace nada. */
  protected generarRuta(): void {
    if (!this.sePuedeGenerar()) {
      return;
    }
    this.modoGenerado.set(this.modo());
    this.pasos.set(RUTA_DE_PRUEBA);
    this.trazado.set(TRAZADO_DE_PRUEBA);
  }

  /** Única validación de este punto: los cuatro campos rellenos. */
  protected sePuedeGenerar(): boolean {
    return (
      this.calleOrigen.trim() !== '' &&
      this.portalOrigen.trim() !== '' &&
      this.calleDestino.trim() !== '' &&
      this.portalDestino.trim() !== ''
    );
  }
}
