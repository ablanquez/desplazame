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

/**
 * ANDAMIO DE VERIFICACIÓN. GeoJSON del WFS municipal: cada rasgo es un Point.
 * También en [lon, lat]. **No trae las líneas que pasan por cada poste**: ese
 * dato no existe todavía en el repositorio (ver THIRD-PARTY-NOTICES § 1.5).
 */
const POSTES = '/datos/2026-08-10_wfs_movilidad-MU3_paradas_bus_unicas.json';

interface PosteCrudo {
  readonly geometry: { readonly coordinates: readonly [number, number] };
}

/**
 * ANDAMIO DE VERIFICACIÓN. `shapes.txt` extraído del ZIP del GTFS, tal cual:
 * CSV con `shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,...`. Aquí se
 * agrupa por trazado y se ordena por secuencia, que es lo mínimo para pintarlo.
 * El ZIP entero está en el repositorio; el navegador no lo abre —no hay
 * dependencia para eso— y por eso se sirve este miembro extraído.
 */
const TRAZADOS = '/datos/2026-08-10_nap_gtfs-ficha1176_shapes.txt';

/** Los trazados del tranvía (`route_id` 210). Comprobado: casan 2 de los 89. */
const ID_TRANVIA = /^210_/;

/**
 * ANDAMIO DE VERIFICACIÓN. `stops.txt` extraído del ZIP, tal cual. De sus 984
 * paradas solo se pintan las **50 del tranvía**: las que NO llevan `stop_code`
 * `PA…`. Las 934 de bus no se pintan desde aquí — los postes de bus salen del
 * censo municipal (§ 1.5 del notices), que es el que manda para eso.
 */
const PARADAS = '/datos/2026-08-10_nap_gtfs-ficha1176_stops.txt';
const CODIGO_BUS = /^PA/i;

/**
 * ANDAMIO DE VERIFICACIÓN. Las 276 estaciones BiZi vienen **repartidas en seis
 * páginas** porque así las sirvió el WFS, de 50 en 50, y así se copiaron: unir
 * los ficheros en disco sería derivar un fichero que nadie publicó. Se juntan
 * aquí, al leerlos.
 */
const BIZI = [0, 50, 100, 150, 200, 250].map(
  (p) => `/datos/2026-08-02_wfs_bizi_pag${p}.json`,
);

/** ANDAMIO DE VERIFICACIÓN. Los 2.158 aparcabicis, descarga propia del WFS. */
const APARCABICIS = '/datos/2026-08-17_wfs_movilidad-MU2_aparcabicis.json';

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

  /** Los postes de autobús, una vez descargados. */
  protected readonly postes = signal<readonly Vertice[]>([]);

  /** Los trazados de línea de BUS del GTFS, una vez descargados. */
  protected readonly trazados = signal<readonly (readonly Vertice[])[]>([]);

  /** Los trazados del TRANVÍA: otra red, otra agencia, capa aparte. */
  protected readonly tranvia = signal<readonly (readonly Vertice[])[]>([]);

  /** Las paradas del tranvía, del mismo GTFS. */
  protected readonly paradasTranvia = signal<readonly Vertice[]>([]);

  /** Las estaciones BiZi, unidas de sus seis páginas. */
  protected readonly estacionesBizi = signal<readonly Vertice[]>([]);

  /** Los aparcabicis. */
  protected readonly aparcabicis = signal<readonly Vertice[]>([]);

  constructor() {
    this.cargarPortales();
    this.cargarGrafo();
    this.cargarCarriles();
    this.cargarPostes();
    this.cargarTrazados();
    this.cargarParadasTranvia();
    this.cargarBizi();
    this.cargarAparcabicis();
  }

  private async cargarAparcabicis(): Promise<void> {
    try {
      const respuesta = await fetch(APARCABICIS);
      if (!respuesta.ok) {
        console.error(`aparcabicis: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly PosteCrudo[] };
      this.aparcabicis.set(
        crudo.features.map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          return [lat, lon] as Vertice;
        }),
      );
    } catch (e) {
      console.error('aparcabicis: no se pudieron cargar', e);
    }
  }

  private async cargarBizi(): Promise<void> {
    try {
      const paginas = await Promise.all(
        BIZI.map(async (url) => {
          const respuesta = await fetch(url);
          if (!respuesta.ok) {
            throw new Error(`${url} respondió ${respuesta.status}`);
          }
          return (await respuesta.json()) as { readonly features: readonly PosteCrudo[] };
        }),
      );
      this.estacionesBizi.set(
        paginas.flatMap((p) =>
          p.features.map((f) => {
            const [lon, lat] = f.geometry.coordinates;
            return [lat, lon] as Vertice;
          }),
        ),
      );
    } catch (e) {
      console.error('estaciones BiZi: no se pudieron cargar', e);
    }
  }

  private async cargarParadasTranvia(): Promise<void> {
    try {
      const respuesta = await fetch(PARADAS);
      if (!respuesta.ok) {
        console.error(`paradas de tranvía: el servidor respondió ${respuesta.status}`);
        return;
      }
      const lineas = (await respuesta.text()).split(/\r?\n/);
      const cabecera = this.campos(lineas[0]);
      const iCod = cabecera.indexOf('stop_code');
      const iLat = cabecera.indexOf('stop_lat');
      const iLon = cabecera.indexOf('stop_lon');
      if (iCod < 0 || iLat < 0 || iLon < 0) {
        console.error('paradas de tranvía: stops.txt no trae las columnas esperadas');
        return;
      }

      const paradas: Vertice[] = [];
      for (const linea of lineas.slice(1)) {
        if (!linea) continue;
        const c = this.campos(linea);
        if (CODIGO_BUS.test(c[iCod])) continue;
        paradas.push([Number(c[iLat]), Number(c[iLon])]);
      }
      this.paradasTranvia.set(paradas);
    } catch (e) {
      console.error('paradas de tranvía: no se pudieron cargar', e);
    }
  }

  /** Parte una línea CSV respetando las comillas: los nombres traen comas. */
  private campos(linea: string): string[] {
    const salida: string[] = [];
    let actual = '';
    let entreComillas = false;
    for (const c of linea) {
      if (c === '"') {
        entreComillas = !entreComillas;
      } else if (c === ',' && !entreComillas) {
        salida.push(actual);
        actual = '';
      } else {
        actual += c;
      }
    }
    salida.push(actual);
    return salida;
  }

  private async cargarTrazados(): Promise<void> {
    try {
      const respuesta = await fetch(TRAZADOS);
      if (!respuesta.ok) {
        console.error(`trazados: el servidor respondió ${respuesta.status}`);
        return;
      }
      const lineas = (await respuesta.text()).split(/\r?\n/);
      const cabecera = lineas[0].split(',');
      const iId = cabecera.indexOf('shape_id');
      const iLat = cabecera.indexOf('shape_pt_lat');
      const iLon = cabecera.indexOf('shape_pt_lon');
      const iSeq = cabecera.indexOf('shape_pt_sequence');
      if (iId < 0 || iLat < 0 || iLon < 0 || iSeq < 0) {
        console.error('trazados: shapes.txt no trae las columnas esperadas');
        return;
      }

      const porTrazado = new Map<string, { orden: number; punto: Vertice }[]>();
      for (const linea of lineas.slice(1)) {
        if (!linea) continue;
        const c = linea.split(',');
        const puntos = porTrazado.get(c[iId]) ?? [];
        puntos.push({ orden: Number(c[iSeq]), punto: [Number(c[iLat]), Number(c[iLon])] });
        porTrazado.set(c[iId], puntos);
      }

      // El tranvía es otra red y otra agencia: se separa para verlo como lo
      // que es. Son sus 2 trazados (`210_I`, `210_V`) frente a los 87 de bus,
      // que se llaman `Route_N` — el patrón del nombre los distingue sin
      // necesidad de `trips`. Esto NO distingue líneas de bus entre sí: eso
      // sigue siendo del motor.
      const ordenados = (puntos: { orden: number; punto: Vertice }[]) =>
        puntos.sort((a, b) => a.orden - b.orden).map((p) => p.punto);

      const bus: Vertice[][] = [];
      const tranvia: Vertice[][] = [];
      for (const [id, puntos] of porTrazado) {
        (ID_TRANVIA.test(id) ? tranvia : bus).push(ordenados(puntos));
      }
      this.trazados.set(bus);
      this.tranvia.set(tranvia);
    } catch (e) {
      console.error('trazados: no se pudieron cargar', e);
    }
  }

  private async cargarPostes(): Promise<void> {
    try {
      const respuesta = await fetch(POSTES);
      if (!respuesta.ok) {
        console.error(`postes: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly PosteCrudo[] };
      this.postes.set(
        crudo.features.map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          return [lat, lon] as Vertice;
        }),
      );
    } catch (e) {
      console.error('postes: no se pudieron cargar', e);
    }
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
