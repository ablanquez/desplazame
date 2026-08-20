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
import { Capas } from './capas';

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
 * Atribución del dato municipal. La exige la licencia de reutilización del
 * Ayuntamiento (Ley 37/2007), literal, y va colgada de CADA capa que enseñe
 * dato suyo —portales y carriles—: Leaflet la muestra mientras haya al menos
 * una encendida, que es justo cuando el dato se está mostrando.
 */
const ATRIBUCION_MUNICIPAL = 'Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)';

/**
 * Un panel propio para las manchas de zona, POR DEBAJO de todo lo demás.
 *
 * [DOC] Leaflet reparte sus capas en paneles por `zIndex`: `tilePane` 200 y
 * `overlayPane` 400 —«Pane for vectors (Paths, like Polylines and Polygons)»—.
 * Con 350, las manchas quedan encima del mapa base y **debajo de todos los
 * bordillos**, pase lo que pase con el orden en que se enciendan las casillas.
 * Sin esto, encender las zonas después del regulado taparía justo lo que se
 * quiere comparar.
 */
const PANEL_MANCHAS = 'manchas';
const PANEL_MANCHAS_Z = '350';

/**
 * Atribución del GTFS. La licencia de datos abiertos del MITMS exige «Powered
 * by MITRAMS» con enlace, citar la fuente, y decir si el dato es bruto o
 * procesado — aquí es bruto: se pintan los trazados tal como vienen.
 */
const ATRIBUCION_GTFS =
  'Trazados: GTFS de Avanza Zaragoza S.A.U. (dato bruto) · Powered by <a href="https://www.transportes.gob.es/" target="_blank" rel="noopener">MITRAMS</a>';

/**
 * El mapa, uno solo para las dos páginas.
 *
 * Lo que cambia entre el buscador y el visor son DOS cosas, y las dos son
 * parámetro, no copia: el ALTO del lienzo y si hay o no TRAZADO que pintar. Las
 * catorce capas de verificación no se le pasan: las lee del servicio `Capas`, que
 * es donde viven, y así el bloque que las ata no se escribe dos veces —una por
 * página— ni hay que acordarse de dos sitios cada vez que entra una capa nueva.
 *
 * El servicio se lee, no se dispara: quien pide la descarga es la página, con
 * `capas.cargar()`. Montar este componente no baja ni un byte.
 *
 * **Ninguna capa de verificación arranca encendida.** Se construyen todas y se
 * registran en el control, pero no se añaden al mapa: se encienden a mano, una
 * a una. Con catorce capas superpuestas —46.150 portales y 98.774 aristas entre
 * ellas— el mapa de partida era ilegible, y verificar es mirar una cosa cada
 * vez. La única línea que sí se pinta sola es el TRAZADO, que no es una capa de
 * verificación ni tiene casilla: es el resultado de pulsar «Generar».
 */
@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa {
  private readonly capas = inject(Capas);

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
  private capaPortales?: L.LayerGroup;
  private capaGrafo?: L.Polyline;
  private capaCarriles?: L.Polyline;
  private capaPostes?: L.LayerGroup;
  private capaTrazados?: L.Polyline;
  private capaTranvia?: L.Polyline;
  private capaParadasTranvia?: L.LayerGroup;
  private capaBizi?: L.LayerGroup;
  private capaAparcabicis?: L.LayerGroup;
  private capaAparcamotos?: L.LayerGroup;
  private capaRegulado?: L.LayerGroup;
  private capaAmpliacion?: L.Polyline;
  private capaZonas?: L.LayerGroup;
  private capaPmr?: L.LayerGroup;
  private control?: L.Control.Layers;

  constructor() {
    // [DOC] Angular: «Use afterNextRender to read or write the DOM once, for
    // example to initialize a non-Angular library.» Leaflet toca el DOM por su
    // cuenta, así que no puede montarse antes de que el lienzo exista.
    afterNextRender(() => {
      this.mapa = L.map(this.lienzo().nativeElement).setView(CENTRO, ZOOM);
      this.mapa.createPane(PANEL_MANCHAS).style.zIndex = PANEL_MANCHAS_Z;
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
      this.pintarTranvia();
      this.pintarParadasTranvia();
      this.pintarBizi();
      this.pintarAparcabicis();
      this.pintarAparcamotos();
      this.pintarRegulado();
      this.pintarAmpliacion();
      this.pintarZonas();
      this.pintarPmr();
    });

    // Redibuja cuando cambia el trazado. Si el mapa aún no existe, no hace
    // nada: lo pinta el propio afterNextRender al terminar de montarlo.
    effect(() => {
      this.trazado();
      this.pintarTrazado();
    });

    effect(() => {
      this.capas.portales();
      this.pintarPortales();
    });

    effect(() => {
      this.capas.grafo();
      this.pintarGrafo();
    });

    effect(() => {
      this.capas.carriles();
      this.pintarCarriles();
    });

    effect(() => {
      this.capas.postes();
      this.pintarPostes();
    });

    effect(() => {
      this.capas.trazados();
      this.pintarTrazados();
    });

    effect(() => {
      this.capas.tranvia();
      this.pintarTranvia();
    });

    effect(() => {
      this.capas.paradasTranvia();
      this.pintarParadasTranvia();
    });

    effect(() => {
      this.capas.estacionesBizi();
      this.pintarBizi();
    });

    effect(() => {
      this.capas.aparcabicis();
      this.pintarAparcabicis();
    });

    effect(() => {
      this.capas.aparcamotos();
      this.pintarAparcamotos();
    });

    effect(() => {
      this.capas.reguladoRotacion();
      this.capas.reguladoResidentes();
      this.pintarRegulado();
    });

    effect(() => {
      this.capas.ampliacionPrevista();
      this.pintarAmpliacion();
    });

    effect(() => {
      this.capas.zonasReguladas();
      this.pintarZonas();
    });

    effect(() => {
      this.capas.reservasPmr();
      this.pintarPmr();
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
   * Siembra las reservas PMR: **discos en rosa `#ec4899`**, con el aro blanco y
   * el radio 4 de los demás «sitios de parar».
   *
   * El rosa lo eligió Antonio por el logo de DFA. Ya había rosa en el mapa —los
   * carriles bici, `#db2777`—, así que se separan por dos cosas: el **tono**,
   * éste más claro y vivo, y sobre todo la **forma**, disco contra línea. No es
   * el par peligroso que fueron los aparcabicis y los aparcamotos: allí eran dos
   * nubes de puntos iguales; aquí una es una red de líneas y la otra son 1.226
   * puntos.
   *
   * Esta capa es accesibilidad, no un extra: para quien conduce con tarjeta
   * PMR, dónde puede aparcar **es** la pregunta.
   */
  private pintarPmr(): void {
    if (!this.mapa) {
      return;
    }

    this.capaPmr?.remove();
    this.capaPmr = undefined;

    const puntos = this.capas.reservasPmr();
    if (puntos.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas();
    const comienzo = performance.now();
    this.capaPmr = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#ec4899',
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    console.info(
      `mapa: ${puntos.length} reservas PMR sembradas en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Pinta las 13 manchas de zona regulada: **relleno muy tenue y borde fino**.
   *
   * Es capa de CONTEXTO, no de contenido: lo que se mira encima de ella son los
   * bordillos. Por eso va en **pizarra `#334155`, acromática**, la única
   * elección que no compite con el azul, el naranja ni el morado — las tres se
   * encienden juntas para comparar—; con **relleno al 8 %**, que tiñe sin
   * ocultar, y **borde de 1,5** frente a los 3 de los bordillos.
   *
   * Y va en su propio panel, por debajo: ver `PANEL_MANCHAS`.
   *
   * El número de zona se rotula con una etiqueta fija en el centro de cada
   * mancha. Sale barato —son trece— y es justo el dato que hay que cruzar con
   * el `zona_reguladora` de los tramos.
   */
  private pintarZonas(): void {
    if (!this.mapa) {
      return;
    }

    this.capaZonas?.remove();
    this.capaZonas = undefined;

    const zonas = this.capas.zonasReguladas();
    if (zonas.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas({ pane: PANEL_MANCHAS });
    this.capaZonas = L.layerGroup(
      zonas.map((zona) =>
        L.polygon(
          zona.poligonos.map((pol) =>
            pol.map((anillo) => anillo.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
          ),
          {
            renderer: lienzoCanvas,
            pane: PANEL_MANCHAS,
            color: '#334155',
            weight: 1.5,
            opacity: 0.8,
            fillColor: '#334155',
            fillOpacity: 0.08,
            interactive: false,
          },
        ).bindTooltip(String(zona.numero), { permanent: true, direction: 'center' }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    this.refrescarControl();
  }

  /**
   * ⚠️ **VISTA DE COTEJO, TEMPORAL.** Pinta los 2.860 tramos LIBRE cuyo número
   * de zona no tiene polígono publicado — la forma que tendría la ampliación de
   * zona azul/naranja, si la hipótesis es buena. **No es dato nuevo**: sale del
   * mismo fichero que el regulado. Existe para cotejarla contra los planos de
   * la ampliación, y se retira o se consolida cuando ese cotejo diga.
   *
   * **Morado `#a21caf`, y discontinua.** El morado es el último hueco que
   * quedaba entre el violeta de los trazados de bus (`#7c3aed`) y el rosa de
   * los carriles (`#db2777`), así que el tono solo no basta: el trazo
   * discontinuo `6 5` es lo que la separa de verdad — y además **significa** lo
   * que es, una hipótesis y no un hecho. La otra línea discontinua del mapa es
   * la ruta, que va al triple de grosor y en naranja quemado, y solo aparece al
   * pulsar «Generar». Grosor 3, el del regulado: son el mismo tipo de cosa, un
   * bordillo.
   */
  private pintarAmpliacion(): void {
    if (!this.mapa) {
      return;
    }

    this.capaAmpliacion?.remove();
    this.capaAmpliacion = undefined;

    const tramos = this.capas.ampliacionPrevista();
    if (tramos.length === 0) {
      this.refrescarControl();
      return;
    }

    const comienzo = performance.now();
    this.capaAmpliacion = L.polyline(
      tramos.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: '#a21caf',
        weight: 3,
        opacity: 0.9,
        dashArray: '6 5',
        interactive: false,
        attribution: ATRIBUCION_MUNICIPAL,
      },
    );

    console.info(
      `mapa: ${tramos.length} tramos de la posible ampliación pintados en ` +
        `${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Pinta el estacionamiento regulado: **ESRO en azul y ESRE en naranja**, las
   * dos clases dentro de UNA sola casilla — se encienden y se apagan juntas,
   * porque lo que se verifica es «dónde se paga», y el color de dentro dice de
   * qué manera se paga.
   *
   * **Los 6.204 tramos LIBRE y los 28 sin clasificar no se pintan.** No son
   * regulado, y pintarlos sería contestar otra pregunta.
   *
   * Los tonos:
   * - **ESRO `#0284c7`**, un azul medio de señal. No es el de los portales
   *   (`#1d4ed8`, más índigo) ni celeste: se lee «zona azul» a la primera.
   * - **ESRE `#f97316`**, naranja vivo. ⚠️ Ya hay naranja en el mapa: la ruta
   *   (`#b45309`). Se separan por **tres** cosas a la vez — el tono
   *   (vivo contra quemado), el trazo (continuo contra discontinuo `10 8`) y el
   *   grosor (3 contra 5).
   *
   * Grosor **3**: medio punto por encima de los carriles bici (2,5) para que se
   * lean como otra familia, y por debajo del tranvía (4) y de la ruta (5).
   */
  private pintarRegulado(): void {
    if (!this.mapa) {
      return;
    }

    this.capaRegulado?.remove();
    this.capaRegulado = undefined;

    const rotacion = this.capas.reguladoRotacion();
    const residentes = this.capas.reguladoResidentes();
    if (rotacion.length === 0 && residentes.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas();
    const aLeaflet = (tramos: readonly (readonly Vertice[])[]) =>
      tramos.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple));
    const comun = {
      renderer: lienzoCanvas,
      weight: 3,
      opacity: 0.95,
      interactive: false,
      attribution: ATRIBUCION_MUNICIPAL,
    };

    const comienzo = performance.now();
    this.capaRegulado = L.layerGroup(
      [
        L.polyline(aLeaflet(rotacion), { ...comun, color: '#0284c7' }),
        L.polyline(aLeaflet(residentes), { ...comun, color: '#f97316' }),
      ],
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    console.info(
      `mapa: ${rotacion.length} tramos ESRO y ${residentes.length} ESRE pintados en ` +
        `${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Siembra los aparcamotos: **disco relleno en verde oliva**, con el aro
   * blanco de los demás discos.
   *
   * Nació como aro hueco en cian, para separarlo por forma de su hermano —los
   * aparcabicis son 2.158 puntos amarillos por la misma ciudad y éstos son
   * 2.146: mismo número, misma dispersión—. **Decisión de Antonio: sobra.**
   * Estas capas son verificación con fecha de caducidad —se van con el andamio
   * en el punto 6—, así que basta con distinguirlas hoy, y el oliva no choca ni
   * con el amarillo del hermano ni con el verde azulado del BiZi.
   *
   * Radio **4, el estándar de los discos** —el de los postes de bus, las
   * paradas de tranvía y las estaciones BiZi—, no el 5 que llevaba de aro:
   * relleno y a radio 5, una capa de 2.146 puntos taparía la ciudad. Y ese 4
   * lo deja además un punto por encima del hermano, que va a 3 con aro oscuro:
   * tamaño, aro y tono, tres cosas separándolos.
   */
  private pintarAparcamotos(): void {
    if (!this.mapa) {
      return;
    }

    this.capaAparcamotos?.remove();
    this.capaAparcamotos = undefined;

    const puntos = this.capas.aparcamotos();
    if (puntos.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas();
    const comienzo = performance.now();
    this.capaAparcamotos = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#6b8e23',
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    console.info(
      `mapa: ${puntos.length} aparcamotos sembrados en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Siembra los aparcabicis. Aquí ya NO quedaba hueco limpio de tono —los
   * siete colores en uso ocupan casi todo el círculo—, así que se distinguen
   * por DOS cosas a la vez: el amarillo, el único tono que nadie usaba, y la
   * forma: más pequeños y con aro OSCURO, frente a los tres «sitios de parar»
   * que van a radio 4 con aro blanco. Son 2.158, la capa más numerosa después
   * de los portales: si fueran del mismo tamaño, taparían la ciudad.
   */
  private pintarAparcabicis(): void {
    if (!this.mapa) {
      return;
    }

    this.capaAparcabicis?.remove();
    this.capaAparcabicis = undefined;

    const puntos = this.capas.aparcabicis();
    if (puntos.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas();
    const comienzo = performance.now();
    this.capaAparcabicis = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 3,
          color: '#78350f',
          weight: 1,
          fillColor: '#eab308',
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    console.info(
      `mapa: ${puntos.length} aparcabicis sembrados en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Siembra las estaciones BiZi. El tono NO sale de la paleta del mapa: es el
   * corporativo del servicio, para que se reconozcan de un vistazo. Si algún
   * día chocan con otra capa, lo que se ajusta es la forma —radio, aro—, no
   * el color.
   */
  private pintarBizi(): void {
    if (!this.mapa) {
      return;
    }

    this.capaBizi?.remove();
    this.capaBizi = undefined;

    const puntos = this.capas.estacionesBizi();
    if (puntos.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas();
    const comienzo = performance.now();
    this.capaBizi = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#54A097',
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    console.info(
      `mapa: ${puntos.length} estaciones BiZi sembradas en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Siembra las paradas del tranvía. Mismo tamaño que los postes de bus, pero
   * en el negro de su red en vez del rojo: el color dice de qué red es, y el
   * tamaño dice que es una parada.
   */
  private pintarParadasTranvia(): void {
    if (!this.mapa) {
      return;
    }

    this.capaParadasTranvia?.remove();
    this.capaParadasTranvia = undefined;

    const puntos = this.capas.paradasTranvia();
    if (puntos.length === 0) {
      this.refrescarControl();
      return;
    }

    const lienzoCanvas = L.canvas();
    const comienzo = performance.now();
    this.capaParadasTranvia = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#111827',
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_GTFS },
    );

    console.info(
      `mapa: ${puntos.length} paradas de tranvía sembradas en ${Math.round(performance.now() - comienzo)} ms`,
    );
    this.refrescarControl();
  }

  /**
   * Pinta el tranvía. Los seis colores en uso ya ocupan seis tonos del
   * círculo; en vez de meterse en un hueco cada vez más estrecho, éste sale
   * del círculo: casi negro, acromático, no puede chocar con ningún tono. Y
   * al doble de grosor, porque es la otra red.
   */
  private pintarTranvia(): void {
    if (!this.mapa) {
      return;
    }

    this.capaTranvia?.remove();
    this.capaTranvia = undefined;

    const lineas = this.capas.tranvia();
    if (lineas.length === 0) {
      this.refrescarControl();
      return;
    }

    this.capaTranvia = L.polyline(
      lineas.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: '#111827',
        weight: 4,
        opacity: 0.9,
        interactive: false,
        attribution: ATRIBUCION_GTFS,
      },
    );

    this.refrescarControl();
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

    const lineas = this.capas.trazados();
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
    );

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

    const puntos = this.capas.postes();
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
    );

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

    const tramos = this.capas.carriles();
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
    );

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

    const aristas = this.capas.grafo();
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
    );

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
      capas[`Portales (${this.capas.portales().length.toLocaleString('es-ES')})`] =
        this.capaPortales;
    }
    if (this.capaGrafo) {
      capas[`Grafo peatonal/ciclable (${this.capas.grafo().length.toLocaleString('es-ES')})`] =
        this.capaGrafo;
    }
    if (this.capaCarriles) {
      capas[`Carriles bici (${this.capas.carriles().length.toLocaleString('es-ES')})`] =
        this.capaCarriles;
    }
    if (this.capaPostes) {
      capas[`Postes de bus (${this.capas.postes().length.toLocaleString('es-ES')})`] =
        this.capaPostes;
    }
    if (this.capaTrazados) {
      capas[`Trazados de bus (${this.capas.trazados().length.toLocaleString('es-ES')})`] =
        this.capaTrazados;
    }
    if (this.capaTranvia) {
      capas[`Tranvía (${this.capas.tranvia().length.toLocaleString('es-ES')})`] = this.capaTranvia;
    }
    if (this.capaParadasTranvia) {
      capas[
        `Paradas de tranvía (${this.capas.paradasTranvia().length.toLocaleString('es-ES')})`
      ] = this.capaParadasTranvia;
    }
    if (this.capaBizi) {
      capas[`Estaciones BiZi (${this.capas.estacionesBizi().length.toLocaleString('es-ES')})`] =
        this.capaBizi;
    }
    if (this.capaAparcabicis) {
      capas[`Aparcabicis (${this.capas.aparcabicis().length.toLocaleString('es-ES')})`] =
        this.capaAparcabicis;
    }
    if (this.capaAparcamotos) {
      capas[`Aparcamotos (${this.capas.aparcamotos().length.toLocaleString('es-ES')})`] =
        this.capaAparcamotos;
    }
    if (this.capaRegulado) {
      const tramos =
        this.capas.reguladoRotacion().length + this.capas.reguladoResidentes().length;
      capas[`Regulado ESRO+ESRE (${tramos.toLocaleString('es-ES')})`] = this.capaRegulado;
    }
    if (this.capaAmpliacion) {
      const n = this.capas.ampliacionPrevista().length.toLocaleString('es-ES');
      capas[`¿Ampliación? zonas sin activar (${n})`] = this.capaAmpliacion;
    }
    if (this.capaZonas) {
      capas[`Zonas reguladas (${this.capas.zonasReguladas().length.toLocaleString('es-ES')})`] =
        this.capaZonas;
    }
    if (this.capaPmr) {
      capas[`Reservas PMR (${this.capas.reservasPmr().length.toLocaleString('es-ES')})`] =
        this.capaPmr;
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

    const puntos = this.capas.portales();
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
    );

    this.refrescarControl();

    console.info(
      `mapa: ${puntos.length} portales sembrados en ${Math.round(performance.now() - comienzo)} ms`,
    );
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
