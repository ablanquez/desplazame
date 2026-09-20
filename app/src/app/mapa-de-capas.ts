import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import type { Vertice } from '@desplazame/tipos';
import { Capas } from './capas';
import { CENTRO, TESELA_CLARA, TESELA_OSCURA, ZOOM } from './mapa';
import { Tema } from './tema';

/**
 * ⭐ EL MAPA DE LAS CATORCE CAPAS — **y vive APARTE del mapa público** (19/09,
 *    intranet fase 2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ **POR QUÉ NO ESTÁ EN `mapa.ts`, que es donde estuvo hasta el 22/08.**
 *
 *  No es gusto ni orden: es una cadena de importaciones, medida en la fase 1.
 *
 *      rutas.ts → Buscador (la ruta '', EAGER) → buscador.ts → `import { Mapa }`
 *
 *  `Mapa` viaja en el paquete de la PORTADA porque el buscador lo importa. Y
 *  el `Mapa` de agosto hacía `inject(Capas)` en su línea 96. O sea: si estos
 *  catorce pinceles volvieran dentro de `mapa.ts`, **se irían a `main.js` con
 *  el servicio `Capas` detrás**, y la ruta perezosa de la intranet no ahorraría
 *  ni un byte. La carga perezosa no sirve de nada si el peso está en un fichero
 *  que la portada ya importa.
 *
 *  Por eso esto es un componente propio, y **solo lo importa la ruta perezosa
 *  de la intranet**. La portada no lo conoce.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lo ÚNICO que comparte con el mapa público son cuatro constantes —el centro,
 * el zoom y las dos teselas—, importadas y no copiadas a propósito: las teselas
 * llevan dentro **la atribución de la ODbL y la clave de CARTO**, y un valor
 * legal escrito dos veces es un valor que acaba divergiendo. Ver la nº43 y el
 * portero de `LLAVE_DEL_TEMA`, que es la misma lección.
 *
 * **Ninguna capa arranca encendida.** Se construyen las catorce y se registran
 * en el control, pero no se añaden al mapa: se encienden a mano, una a una. Con
 * catorce capas superpuestas —46.150 portales y 98.774 aristas entre ellas— el
 * mapa de partida era ilegible, y verificar es mirar una cosa cada vez.
 */

/**
 * Atribución del dato municipal. La exige la licencia de reutilización del
 * Ayuntamiento (Ley 37/2007), literal, y va colgada de CADA capa que enseñe
 * dato suyo: Leaflet la muestra mientras haya al menos una encendida, que es
 * justo cuando el dato se está mostrando.
 */
const ATRIBUCION_MUNICIPAL = 'Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)';

/**
 * Atribución del GTFS. La licencia de datos abiertos del MITMS exige «Powered
 * by MITRAMS» con enlace, citar la fuente, y decir si el dato es bruto o
 * procesado — aquí es bruto: se pintan los trazados tal como vienen.
 */
const ATRIBUCION_GTFS =
  'Trazados: GTFS de Avanza Zaragoza S.A.U. (dato bruto) · Powered by <a href="https://www.transportes.gob.es/" target="_blank" rel="noopener">MITRAMS</a>';

/**
 * Un panel propio para las manchas de zona, POR DEBAJO de todo lo demás.
 *
 * [DOC] Leaflet reparte sus capas en paneles por `zIndex`: `tilePane` 200 y
 * `overlayPane` 400 —«Pane for vectors (Paths, like Polylines and Polygons)»—.
 * Con 350, las manchas quedan encima del mapa base y **debajo de todos los
 * bordillos**, pase lo que pase con el orden en que se enciendan las casillas.
 */
const PANEL_MANCHAS = 'manchas';
const PANEL_MANCHAS_Z = '350';

/**
 * ⭐ LA PALETA, Y AHORA CON DOS TEMAS — medida, no supuesta (19/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  Los catorce colores nacieron en agosto contra UNA sola tesela, la clara de
 *  OpenStreetMap. Desde el 15/09 el mapa cambia de tesela con el tema, y el
 *  Dark Matter de CARTO va de `#262626` a `#000000`: **ocho de los catorce
 *  colores desaparecían encima**.
 *
 *  Así que cada capa se ha MEDIDO con `contraste.ts`, la función de la casa,
 *  contra el peor de los dos extremos de cada plano, y la vara es
 *  `AA_GRAFICO` = 3:1 [WCAG 1.4.11]. Seis capas han necesitado un tono propio
 *  para el oscuro; las otras ocho **se quedan con el de agosto, y aquí está la
 *  cifra que lo justifica**.
 *
 *  ┌──────────────────────┬──────────┬──────────┬────────┬────────┐
 *  │ capa                 │ claro    │ oscuro   │ c/claro│ c/osc. │
 *  ├──────────────────────┼──────────┼──────────┼────────┼────────┤
 *  │ portales             │ #1d4ed8  │ #818cf8  │  3,79  │  5,07  │
 *  │ grafo                │ #15803d  │ = agosto │  2,84  │  3,02  │
 *  │ carriles bici        │ #db2777  │ = agosto │  2,60  │  3,29  │
 *  │ postes de bus        │ #dc2626  │ = agosto │  2,73  │  3,13  │
 *  │ trazados de bus      │ #7c3aed  │ #a78bfa  │  3,22  │  5,56  │
 *  │ tranvía              │ #111827  │ #e5e7eb  │ 10,03  │ 12,22  │
 *  │ paradas de tranvía   │ #111827  │ #e5e7eb  │ 10,03  │ 12,22  │
 *  │ estaciones BiZi      │ #54A097  │ = agosto │  1,73  │  4,94  │
 *  │ aparcabicis          │ #eab308  │ = agosto │  1,08  │  7,89  │
 *  │ aparcamotos          │ #6b8e23  │ = agosto │  2,15  │  3,98  │
 *  │ regulado ESRO        │ #0284c7  │ = agosto │  2,32  │  3,70  │
 *  │ regulado ESRE        │ #f97316  │ = agosto │  1,59  │  5,40  │
 *  │ LA MORADA            │ #a21caf  │ #d946ef  │  3,58  │  4,38  │
 *  │ zonas reguladas      │ #334155  │ #94a3b8  │  5,86  │  5,90  │
 *  └──────────────────────┴──────────┴──────────┴────────┴────────┘
 *
 *  Cada tono nuevo **conserva la familia** del de agosto —índigo sigue siendo
 *  índigo, violeta violeta, la morada sigue morada y la pizarra pizarra—,
 *  porque el color es lo que el inventario usa para nombrar cada capa.
 *
 *  ⚠️ **LO QUE ESTA RONDA NO ARREGLA, Y SE DICE:** ocho capas **tampoco
 *     llegaban a 3:1 en el tema CLARO**, y eso ya era así en agosto (columna
 *     «c/claro»: el BiZi 1,73, los aparcabicis 1,08, el ESRE 1,59…). Tocar la
 *     paleta clara es rediseñar el trabajo de agosto y **no estaba firmado**:
 *     queda dicho, no hecho.
 *
 *  ⚠️ **Los AROS de los discos son otra medida, y sí pasan los dos temas.** El
 *     compañero de contraste de un aro no es el plano: es SU PROPIO RELLENO,
 *     que es lo que le da la forma. Medidos: postes 4,83 · paradas 17,74 en
 *     claro y 14,33 en oscuro · BiZi 3,06 · aparcamotos 3,81 · PMR 3,53 ·
 *     aparcabicis 4,73. Los siete por encima de 3:1.
 * ═══════════════════════════════════════════════════════════════════════════
 */
interface Paleta {
  readonly portales: string;
  readonly grafo: string;
  readonly carriles: string;
  readonly postes: string;
  readonly trazados: string;
  readonly tranvia: string;
  /** El relleno del disco de parada de tranvía. */
  readonly paradaTranvia: string;
  /** Y su aro: el contrario del relleno, para que la forma se lea en los dos temas. */
  readonly aroParadaTranvia: string;
  readonly bizi: string;
  readonly aparcabicis: string;
  readonly aroAparcabicis: string;
  readonly aparcamotos: string;
  readonly esro: string;
  readonly esre: string;
  readonly morada: string;
  readonly zonas: string;
  /** El aro blanco de los «sitios de parar». Ver la nota de los aros. */
  readonly aro: string;
}

const PALETA_CLARA: Paleta = {
  portales: '#1d4ed8',
  grafo: '#15803d',
  carriles: '#db2777',
  postes: '#dc2626',
  trazados: '#7c3aed',
  tranvia: '#111827',
  paradaTranvia: '#111827',
  aroParadaTranvia: '#ffffff',
  bizi: '#54A097',
  aparcabicis: '#eab308',
  aroAparcabicis: '#78350f',
  aparcamotos: '#6b8e23',
  esro: '#0284c7',
  esre: '#f97316',
  morada: '#a21caf',
  zonas: '#334155',
  aro: '#ffffff',
};

const PALETA_OSCURA: Paleta = {
  ...PALETA_CLARA,
  portales: '#818cf8',
  trazados: '#a78bfa',
  tranvia: '#e5e7eb',
  // ⚠️ El disco se INVIERTE: relleno claro y aro oscuro. Si solo se aclarara el
  //    relleno, el aro blanco de agosto se fundiría con él (1,24) y la parada
  //    perdería la forma que la separa de los postes de bus.
  paradaTranvia: '#e5e7eb',
  aroParadaTranvia: '#111827',
  morada: '#d946ef',
  zonas: '#94a3b8',
};

@Component({
  selector: 'app-mapa-de-capas',
  templateUrl: './mapa-de-capas.html',
  styleUrls: ['./mapa.css', './mapa-de-capas.css'],
})
export class MapaDeCapas {
  private readonly capas = inject(Capas);

  /** El tema que ha ganado. Ver `tema.ts`. */
  private readonly tema = inject(Tema);

  /**
   * El alto del lienzo, tal cual va al CSS. Leaflet exige una altura
   * DEFINIDA: si el contenedor no la tiene, el mapa se monta con 0 px de alto
   * y no se ve nada. El visor le pasa `100%` y le da la altura desde fuera.
   */
  readonly alto = input('22rem');

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: L.Map;

  /** La capa de teselas puesta, y de qué tema es. */
  private tesela?: { readonly capa: L.TileLayer; readonly oscura: boolean };

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

  /**
   * ⭐ LAS CATORCE POR SU CLAVE, rehecho en cada `refrescarControl` (20/09, H2).
   *
   * El control de Leaflet indexa por ROTULO —«Portales (46.150)»—, y ese
   * rótulo lleva dentro una cifra que cambia cada vez que el dato se renueva.
   * Un conjunto de encendidas guardado por rótulo se rompería el día que el
   * cron traiga un portal más. Por eso la clave es NUESTRA y es estable, y el
   * rótulo se queda para la vista.
   */
  private readonly puestas = new Map<string, L.Layer>();

  /**
   * Qué claves ya se han repuesto EN ESTE MONTAJE. Cada capa se repone una
   * sola vez, la primera en que existe.
   *
   * ⚠️ Y esto es lo que separa «reponer» de «imponer». `refrescarControl` se
   *    llama catorce veces mientras el dato va llegando; sin esta marca, una
   *    capa que quien mira acabara de APAGAR volvería a encenderse sola con el
   *    siguiente dato que entrase. Repone quien vuelve a la página, no el
   *    fichero que termina de bajarse.
   */
  private readonly yaRepuestas = new Set<string>();

  /** Los dos trozos del regulado, guardados para poder revestirlos sin rehacerlos. */
  private reguladoEsro?: L.Polyline;
  private reguladoEsre?: L.Polyline;

  /**
   * La paleta que toca ahora mismo.
   *
   * ⚠️ **`untracked`, Y NO ES ADORNO — esto costó un rojo en pantalla** (19/09).
   *
   * Este getter lo llaman los catorce `pintar*`, y los catorce viven dentro de
   * un `effect()` que escucha SU dato. Si aquí se leyera `tema.oscuro()` a
   * pelo, [DOC Angular] «the effect will re-run whenever any of the signals it
   * reads change» convertiría el tema en dependencia de los catorce: cambiar de
   * tesela **rehacía las catorce capas**, y rehacer una capa la construye
   * apagada.
   *
   * Se vio mirando, no razonando: con las catorce encendidas, un cambio de
   * tema las dejaba **todas apagadas**. Y el comentario de `revestir()` juraba
   * lo contrario, que es lo que hace falta para que un fallo así viva tranquilo.
   *
   * [DOC Angular, `untracked`] «read a signal without creating a dependency».
   * Quien SÍ depende del tema es un solo efecto, el de abajo, y lo que hace es
   * `revestir()`: cambiar el estilo en sitio, sin tocar qué está encendido.
   *
   * Su guardián: `mapa-de-capas.spec.ts`, que nació en rojo con este fallo.
   */
  private get paleta(): Paleta {
    return untracked(() => this.tema.oscuro()) ? PALETA_OSCURA : PALETA_CLARA;
  }

  constructor() {
    // [DOC] Angular: «Use afterNextRender to read or write the DOM once, for
    // example to initialize a non-Angular library.» Leaflet toca el DOM por su
    // cuenta, así que no puede montarse antes de que el lienzo exista.
    afterNextRender(() => {
      this.mapa = L.map(this.lienzo().nativeElement).setView(CENTRO, ZOOM);
      this.mapa.createPane(PANEL_MANCHAS).style.zIndex = PANEL_MANCHAS_Z;
      this.ponerTesela(this.tema.oscuro());
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

    // Cada capa se repinta cuando llega SU dato. Si el mapa aún no existe, no
    // hacen nada: los pinta el propio afterNextRender al terminar de montarlo.
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

    /**
     * ⭐ EL TEMA: la tesela cambia, y las capas se RE-VISTEN — no se rehacen.
     *
     * ⚠️ Y esa diferencia es la que importa. Rehacer una capa la quita del mapa
     *    y la vuelve a construir apagada: a quien tuviera encendido el regulado
     *    para mirarlo se le apagaría **solo por cambiar de tema**. [DOC Leaflet]
     *    `setStyle` cambia el aspecto de un `Path` en sitio, sin tocar si está
     *    puesto o no. Y con 46.150 portales, además, rehacer cuesta.
     */
    effect(() => {
      const oscuro = this.tema.oscuro();
      this.ponerTesela(oscuro);
      this.revestir();
    });

    // Y al morir, se desmonta. [DOC] Leaflet: «remove(): Destroys the map and
    // clears all related event listeners». Sin esto, cada ida y vuelta deja
    // atrás un mapa entero con sus escuchas y sus 46.150 marcadores.
    inject(DestroyRef).onDestroy(() => {
      // ⭐ Primero se apunta lo que estaba puesto y DESPUÉS se desmonta: con el
      //    mapa ya destruido no hay a quién preguntárselo. Ver `Capas`.
      this.apuntarLoQueQueda();
      this.mapa?.remove();
      this.mapa = undefined;
      this.tesela = undefined;
      this.control = undefined;
    });
  }

  /**
   * Pone la tesela del tema y quita la otra. Copiado en espíritu del mapa
   * público: la vieja se quita EN EL ACTO, porque esperar al `load` dejaría las
   * dos atribuciones juntas mientras tanto.
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
   * Re-viste las SEIS capas que cambian de tono con el tema. Las otras ocho no
   * se tocan: su color de agosto pasa la vara en los dos planos, y está medido
   * en la tabla de arriba.
   */
  private revestir(): void {
    // Las otras ocho —grafo, carriles, postes, BiZi, aparcabicis, aparcamotos,
    // ESRO y ESRE— no aparecen aquí A PROPÓSITO: su color de agosto pasa la
    // vara en los dos planos, y tocarlas sería trabajo sin motivo.
    const p = this.paleta;
    this.capaPortales?.eachLayer((c) =>
      (c as L.CircleMarker).setStyle({ fillColor: p.portales }),
    );
    this.capaTrazados?.setStyle({ color: p.trazados });
    this.capaTranvia?.setStyle({ color: p.tranvia });
    this.capaParadasTranvia?.eachLayer((c) =>
      (c as L.CircleMarker).setStyle({
        fillColor: p.paradaTranvia,
        color: p.aroParadaTranvia,
      }),
    );
    this.capaAmpliacion?.setStyle({ color: p.morada });
    this.capaZonas?.eachLayer((z) =>
      (z as L.Polygon).setStyle({ color: p.zonas, fillColor: p.zonas }),
    );
  }

  /**
   * Siembra las reservas PMR: **discos en rosa `#ec4899`**, con el aro blanco y
   * el radio 4 de los demás «sitios de parar».
   *
   * El rosa lo eligió Antonio por el logo de DFA. Ya había rosa en el mapa —los
   * carriles bici, `#db2777`—, así que se separan por dos cosas: el **tono**,
   * éste más claro y vivo, y sobre todo la **forma**, disco contra línea.
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

    const p = this.paleta;
    const lienzoCanvas = L.canvas();
    this.capaPmr = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: p.aro,
          weight: 1.5,
          fillColor: '#ec4899',
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    this.refrescarControl();
  }

  /**
   * Pinta las 13 manchas de zona regulada: **relleno muy tenue y borde fino**.
   *
   * Es capa de CONTEXTO, no de contenido: lo que se mira encima de ella son los
   * bordillos. Por eso va **acromática** —pizarra en claro, pizarra clara en
   * oscuro—, la única elección que no compite con el azul, el naranja ni el
   * morado, que se encienden juntas para comparar; con **relleno al 8 %**, que
   * tiñe sin ocultar, y **borde de 1,5** frente a los 3 de los bordillos.
   *
   * Y va en su propio panel, por debajo: ver `PANEL_MANCHAS`.
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

    const p = this.paleta;
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
            color: p.zonas,
            weight: 1.5,
            opacity: 0.8,
            fillColor: p.zonas,
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
   * ⚠️ **VISTA DE COTEJO, TEMPORAL — la morada.** Pinta los 2.860 tramos LIBRE
   * cuyo número de zona no tiene polígono publicado: la forma que tendría la
   * ampliación de zona azul/naranja, si la hipótesis es buena. **No es dato
   * nuevo**: sale del mismo fichero que el regulado. Se retira o se consolida
   * cuando el cotejo con los planos de Antonio diga — le toca en 2027.
   *
   * **Morada y discontinua.** El tono solo no basta —está entre el violeta de
   * los trazados y el rosa de los carriles—: el trazo discontinuo `6 5` es lo
   * que la separa de verdad, y además **significa** lo que es, una hipótesis y
   * no un hecho. Grosor 3, el del regulado: son el mismo tipo de cosa.
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

    this.capaAmpliacion = L.polyline(
      tramos.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: this.paleta.morada,
        weight: 3,
        opacity: 0.9,
        dashArray: '6 5',
        interactive: false,
        attribution: ATRIBUCION_MUNICIPAL,
      },
    );

    this.refrescarControl();
  }

  /**
   * Pinta el estacionamiento regulado: **ESRO en azul y ESRE en naranja**, las
   * dos clases dentro de UNA sola casilla — se encienden y se apagan juntas,
   * porque lo que se verifica es «dónde se paga», y el color de dentro dice de
   * qué manera se paga.
   *
   * **Los 6.217 tramos LIBRE y los 30 sin clasificar no se pintan.** No son
   * regulado, y pintarlos sería contestar otra pregunta.
   *
   * Grosor **3**: medio punto por encima de los carriles bici (2,5) para que se
   * lean como otra familia, y por debajo del tranvía (4).
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

    const p = this.paleta;
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

    this.reguladoEsro = L.polyline(aLeaflet(rotacion), { ...comun, color: p.esro });
    this.reguladoEsre = L.polyline(aLeaflet(residentes), { ...comun, color: p.esre });
    this.capaRegulado = L.layerGroup([this.reguladoEsro, this.reguladoEsre], {
      attribution: ATRIBUCION_MUNICIPAL,
    });

    this.refrescarControl();
  }

  /**
   * Siembra los aparcamotos: **disco relleno en verde oliva**, con el aro
   * blanco de los demás discos. Radio 4, el estándar de los discos, que lo deja
   * además un punto por encima de su hermano el aparcabicis, que va a 3 con aro
   * oscuro: tamaño, aro y tono, tres cosas separándolos.
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

    const p = this.paleta;
    const lienzoCanvas = L.canvas();
    this.capaAparcamotos = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: p.aro,
          weight: 1.5,
          fillColor: p.aparcamotos,
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    this.refrescarControl();
  }

  /**
   * Siembra los aparcabicis. Aquí ya NO quedaba hueco limpio de tono, así que
   * se distinguen por DOS cosas a la vez: el amarillo, el único tono que nadie
   * usaba, y la forma — más pequeños y con aro OSCURO, frente a los tres
   * «sitios de parar» que van a radio 4 con aro blanco. Son 2.158: si fueran
   * del mismo tamaño, taparían la ciudad.
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

    const p = this.paleta;
    const lienzoCanvas = L.canvas();
    this.capaAparcabicis = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 3,
          color: p.aroAparcabicis,
          weight: 1,
          fillColor: p.aparcabicis,
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
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

    const p = this.paleta;
    const lienzoCanvas = L.canvas();
    this.capaBizi = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: p.aro,
          weight: 1.5,
          fillColor: p.bizi,
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    this.refrescarControl();
  }

  /**
   * Siembra las paradas del tranvía. Mismo tamaño que los postes de bus, pero
   * en el acromático de su red en vez del rojo: el color dice de qué red es, y
   * el tamaño dice que es una parada.
   *
   * ⚠️ En oscuro el disco se INVIERTE —relleno claro, aro oscuro—: ver la nota
   *    de `PALETA_OSCURA`. La forma tiene que leerse en los dos temas.
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

    const p = this.paleta;
    const lienzoCanvas = L.canvas();
    this.capaParadasTranvia = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: p.aroParadaTranvia,
          weight: 1.5,
          fillColor: p.paradaTranvia,
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_GTFS },
    );

    this.refrescarControl();
  }

  /**
   * Pinta el tranvía. Los demás tonos ya ocupan el círculo; en vez de meterse
   * en un hueco cada vez más estrecho, éste sale del círculo: **acromático**,
   * no puede chocar con ningún tono. Y al doble de grosor, porque es la otra
   * red.
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
        color: this.paleta.tranvia,
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

    this.capaTrazados = L.polyline(
      lineas.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: this.paleta.trazados,
        weight: 2,
        opacity: 0.75,
        interactive: false,
        attribution: ATRIBUCION_GTFS,
      },
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

    const p = this.paleta;
    const lienzoCanvas = L.canvas();
    this.capaPostes = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 4,
          color: p.aro,
          weight: 1.5,
          fillColor: p.postes,
          fillOpacity: 1,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
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

    this.capaCarriles = L.polyline(
      tramos.map((t) => t.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: this.paleta.carriles,
        weight: 2.5,
        opacity: 0.9,
        interactive: false,
        attribution: ATRIBUCION_MUNICIPAL,
      },
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

    this.capaGrafo = L.polyline(
      aristas.map((a) => a.map(([lat, lon]) => [lat, lon] as L.LatLngTuple)),
      {
        renderer: L.canvas(),
        color: this.paleta.grafo,
        weight: 1,
        opacity: 0.7,
        interactive: false,
      },
    );

    this.refrescarControl();
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
    // Canvas renderer.» Con SVG, 46.150 portales serían 46.150 nodos del DOM.
    // El canvas va por CAPA y no en todo el mapa a propósito: la polilínea
    // sigue en SVG, que es lo que las pruebas pueden mirar bajo jsdom.
    const lienzoCanvas = L.canvas();
    this.capaPortales = L.layerGroup(
      puntos.map(([lat, lon]) =>
        L.circleMarker([lat, lon], {
          renderer: lienzoCanvas,
          radius: 1.5,
          stroke: false,
          fillColor: this.paleta.portales,
          fillOpacity: 0.6,
          interactive: false,
        }),
      ),
      { attribution: ATRIBUCION_MUNICIPAL },
    );

    this.refrescarControl();
  }

  /**
   * Un solo control de capas, rehecho con las capas que existan ahora — y
   * **repuesto lo que estuviera encendido antes de salir de la página**.
   */
  private refrescarControl(): void {
    this.control?.remove();
    this.control = undefined;
    this.puestas.clear();
    if (!this.mapa) {
      return;
    }

    const cuantos = (n: number): string => n.toLocaleString('es-ES');
    const capas: Record<string, L.Layer> = {};
    /** Una capa en el control: su clave estable, su rótulo con la cifra, y ella. */
    const anotar = (clave: string, rotulo: string, capa: L.Layer | undefined): void => {
      if (!capa) {
        return;
      }
      capas[rotulo] = capa;
      this.puestas.set(clave, capa);
    };

    anotar('portales', `Portales (${cuantos(this.capas.portales().length)})`, this.capaPortales);
    anotar(
      'grafo',
      `Grafo peatonal/ciclable (${cuantos(this.capas.grafo().length)})`,
      this.capaGrafo,
    );
    anotar('carriles', `Carriles bici (${cuantos(this.capas.carriles().length)})`, this.capaCarriles);
    anotar('postes', `Postes de bus (${cuantos(this.capas.postes().length)})`, this.capaPostes);
    anotar('trazados', `Trazados de bus (${cuantos(this.capas.trazados().length)})`, this.capaTrazados);
    anotar('tranvia', `Tranvía (${cuantos(this.capas.tranvia().length)})`, this.capaTranvia);
    anotar(
      'paradas-tranvia',
      `Paradas de tranvía (${cuantos(this.capas.paradasTranvia().length)})`,
      this.capaParadasTranvia,
    );
    anotar(
      'bizi',
      `Estaciones BiZi (${cuantos(this.capas.estacionesBizi().length)})`,
      this.capaBizi,
    );
    anotar(
      'aparcabicis',
      `Aparcabicis (${cuantos(this.capas.aparcabicis().length)})`,
      this.capaAparcabicis,
    );
    anotar(
      'aparcamotos',
      `Aparcamotos (${cuantos(this.capas.aparcamotos().length)})`,
      this.capaAparcamotos,
    );
    anotar(
      'regulado',
      `Regulado ESRO+ESRE (${cuantos(
        this.capas.reguladoRotacion().length + this.capas.reguladoResidentes().length,
      )})`,
      this.capaRegulado,
    );
    anotar(
      'ampliacion',
      `¿Ampliación? zonas sin activar (${cuantos(this.capas.ampliacionPrevista().length)})`,
      this.capaAmpliacion,
    );
    anotar('zonas', `Zonas reguladas (${cuantos(this.capas.zonasReguladas().length)})`, this.capaZonas);
    anotar('pmr', `Reservas PMR (${cuantos(this.capas.reservasPmr().length)})`, this.capaPmr);

    if (Object.keys(capas).length > 0) {
      this.control = L.control.layers(undefined, capas).addTo(this.mapa);
    }

    this.reponerEncendidas();
  }

  /**
   * ⭐ VUELVE A PONER LO QUE ESTABA PUESTO (20/09, H2 del ojo de Antonio).
   *
   * ⚠️ **`untracked`, y por la misma razón que la paleta.** Los catorce
   *    `pintar*` acaban aquí, y los catorce viven dentro de un `effect()`. Si
   *    esto leyera `encendidas()` a pelo, [DOC Angular] «the effect will re-run
   *    whenever any of the signals it reads change» convertiría el conjunto de
   *    encendidas en dependencia de los catorce efectos: encender UNA capa
   *    rehacía las catorce. Es el fallo del 19/09 otra vez, y se evita igual.
   *
   * [DOC Leaflet] `hasLayer` dice si una capa ya está en el mapa; poner la
   * misma dos veces no es un error, pero preguntarlo deja claro que esto no
   * pelea con quien acaba de pulsar la casilla.
   */
  private reponerEncendidas(): void {
    const mapa = this.mapa;
    if (!mapa) {
      return;
    }
    const recordadas = untracked(() => this.capas.encendidas());
    for (const [clave, capa] of this.puestas) {
      if (this.yaRepuestas.has(clave)) {
        continue;
      }
      this.yaRepuestas.add(clave);
      if (recordadas.has(clave) && !mapa.hasLayer(capa)) {
        mapa.addLayer(capa);
      }
    }
  }

  /**
   * Lo que estaba puesto al salir, al servicio. Se pregunta AL MAPA y no a una
   * lista que hubiera que mantener al día: la verdad de qué se ve la tiene
   * Leaflet, y copiarla en dos sitios es lo que hace que las dos se separen.
   */
  private apuntarLoQueQueda(): void {
    const mapa = this.mapa;
    if (!mapa) {
      return;
    }
    const vivas = new Set<string>();
    for (const [clave, capa] of this.puestas) {
      if (mapa.hasLayer(capa)) {
        vivas.add(clave);
      }
    }
    this.capas.recordar(vivas);
  }
}
