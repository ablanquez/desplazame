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
import { contraste, AA_GRAFICO, TIERRA_OSM } from './contraste';
// El vértice lo define el contrato, no este componente: es la misma forma que
// el motor devolverá en la geometría de un trayecto.
import type { TramoDelViaje, Vertice } from '@desplazame/tipos';
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
  andando: { color: '#b45309', weight: 5, dashArray: '10 8' },
  rodando: { color: '#2563eb', weight: 5 },
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
 * El vestido de un tramo, con el color de su línea cuando lo trae.
 *
 * [DOC] Leaflet: `color` es *«stroke color»* de la polilínea, y se pasa por
 * opciones —no por CSS— porque lo que hay debajo es un `<path>` de SVG con su
 * atributo `stroke`. El `#` se pone aquí: el feed publica `F5C100`, sin
 * almohadilla [referencia GTFS, `route_color`].
 */
function vestidoDe(tramo: TramoDelViaje): L.PolylineOptions {
  const base = VESTIDO[tramo.comoSeVa];
  return tramo.linea ? { ...base, color: `#${tramo.linea.color}` } : base;
}

/** Cuánto asoma el ribete por cada lado de la línea, en píxeles. */
export const ASOMA_EL_RIBETE = 2;

/**
 * ⭐ EL RIBETE BAJO LA LÍNEA, o `null` si esta línea no lo necesita.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  [WCAG 1.4.11 AA · W3C *Understanding Non-text Contrast*] un gráfico que
 *  transporta información necesita **3:1** contra lo que tiene al lado — y una
 *  polilínea de ruta es exactamente eso: si no se distingue del plano, el plano
 *  no dice por dónde se va.
 *
 *  ⛔ Y 23 de las nuestras no llegan. Medido en pantalla, la 44 (`#27A737`) sale
 *    a **2,74:1** sobre la tierra de OSM. La 29 (`#F5C100`) y la N7 (`#FFEB3D`),
 *    que son amarillos, peor.
 *
 *  ⇒ **EL COLOR DE LA LÍNEA NO SE TOCA.** Es la identidad de Avanza: quien
 *    conoce la ciudad reconoce su línea por el tono, y repintarla sería resolver
 *    un problema de accesibilidad rompiendo la información que el color lleva.
 *    Se pinta **una segunda polilínea debajo, más ancha**, que asoma 2 px por
 *    cada lado. La WCAG lo admite en sus propias palabras: *«un halo puede
 *    usarse como fondo»* al medir — así que lo que tiene que cumplir 3:1 no es
 *    la línea contra el plano, sino **el ribete contra el plano** y **la línea
 *    contra el ribete**.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **Y el tono se CALCULA, no se fija.** Se prueban el negro y el blanco y gana
 *    el que deja mejor el PEOR de sus dos contrastes — porque un ribete que se
 *    ve sobre el plano pero se confunde con la línea no es un ribete, es una
 *    línea más gorda. Sobre la tierra clara de OSM sale negro siempre, pero eso
 *    es el resultado de la cuenta y no una decisión escrita a mano: el día que
 *    el teselado cambie a un fondo oscuro, esta función cambia sola.
 *
 * ⚠️ Y devuelve `null` cuando la línea **ya llega**. El ámbar del a-pie (4,38:1)
 *    y el azul de la rueda (4,50:1) pasan de sobra, así que se quedan **al byte**
 *    como estaban: no se engorda lo que no hace falta engordar.
 */
export function ribeteDe(color: string): string | null {
  const suyo = contraste(color, TIERRA_OSM);
  if (suyo >= AA_GRAFICO) {
    return null;
  }
  const candidatos = ['000000', 'FFFFFF'];
  let gana = candidatos[0]!;
  let mejor = -1;
  for (const c of candidatos) {
    // El peor de los dos: contra el plano, y contra la propia línea.
    const suPeor = Math.min(contraste(c, TIERRA_OSM), contraste(c, color));
    if (suPeor > mejor) {
      mejor = suPeor;
      gana = c;
    }
  }
  return gana;
}

/**
 * ⭐ EL GLIFO DE CADA HITO, y son los MISMOS que la lista de pasos.
 *
 * Que el mapa y las indicaciones usen el mismo carácter no es coquetería: quien
 * lee «🅿 Aparca en el aparcabicis de…» tiene que poder buscar esa misma marca
 * en el plano sin traducir nada. `🅿` es la P de aparcamiento encerrada, que es
 * la señal que hay en la calle; `🚲` es el vehículo que se toma.
 *
 * `Record` exhaustivo por la misma razón de siempre: si el contrato añadiera un
 * hito, esta tabla dejaría de compilar en vez de dibujar un hueco.
 */
const GLIFO: Readonly<Record<NonNullable<TramoDelViaje['hito']>, string>> = {
  coge: '🚲',
  aparca: '🅿',
  // Los dos del poste. Mismos caracteres que la lista de pasos, por lo mismo de
  // siempre: quien lee «🚌 Sube a la 39…» busca esa marca en el plano.
  sube: '🚌',
  baja: '🚏',
};

/** El lado del icono de hito. Más pequeño que la chincheta: es una marca. */
const LADO_DEL_HITO = 24;

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
  private lineas: L.Polyline[] = [];
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

    const vertices = this.trazado();
    if (vertices.length === 0) {
      this.mapa.setView(CENTRO, ZOOM);
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
      const vestido = vestidoDe(tramo);
      const ribete = tramo.linea ? ribeteDe(tramo.linea.color) : null;
      if (ribete !== null) {
        this.lineas.push(
          L.polyline(trozo, {
            ...vestido,
            color: `#${ribete}`,
            weight: (vestido.weight ?? 5) + 2 * ASOMA_EL_RIBETE,
          }).addTo(this.mapa),
        );
      }
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
    if (todo) {
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
        html: `<span class="hito" aria-hidden="true">${GLIFO[hito]}</span>`,
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
