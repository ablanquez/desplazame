import { Component, computed, input } from '@angular/core';

/**
 * ⭐ LOS ICONOS DE CAPA: qué clase de sitio es cada extremo, dicho sin leer.
 *
 * Un buscador que ofrece calles y farmacias en la misma lista tiene que
 * distinguirlas ANTES de que se lea el texto, porque el texto de las dos
 * empieza igual de a menudo por la misma palabra. Hasta el 23/08 la única seña
 * era el `data-capa` del `<li>` —invisible— y un fondo apenas distinto.
 *
 * **Son dos formas y tres colores, dibujados a mano en SVG.** Ni una
 * dependencia: la regla del repositorio es cero, y una familia de iconos entera
 * para traer dos figuras sería pagar cientos de kB por lo que cabe en dos
 * `<path>`. Es la misma decisión que las flechas de los pasos, que son Unicode.
 *
 * LAS FORMAS
 * · **Chincheta** — una dirección: calle y portal. Es la forma con la que
 *   cualquier mapa dice «este punto exacto», y su punta ES la coordenada.
 * · **Cruz** — una farmacia. En España la cruz verde es la señal de farmacia en
 *   la calle, así que no hay nada que aprender.
 *
 * LOS COLORES, que NO se eligen aquí: se copian
 * · **VERDE el origen, ROJO el destino** [osm.org, convención de sus
 *   marcadores de ruta]. Nacieron azul y magenta el 23/08 y eso era invento
 *   mío: dos colores que contrastaban, elegidos sin fuente. Duraron unas horas.
 * · La chincheta de una SUGERENCIA no lleva ninguno de los dos: va **neutra**,
 *   porque en la lista todavía no es origen ni destino — se convierte en uno u
 *   otro al elegirla, y adelantarlo sería pintar de verde algo que va a acabar
 *   en el destino la mitad de las veces.
 * · La cruz va **verde en los dos papeles** —decisión de Antonio, 23/08—, y
 *   comparte el verde del origen a propósito: no son dos verdes parecidos, es
 *   el mismo. Lo que separa una farmacia de un origen no es el color sino la
 *   FORMA, que es justo el segundo diferenciador que pide la doctrina.
 * · Los tres contrastan con el mapa —OSM es beige, blanco y verde pálido— y con
 *   la línea de la ruta, que es naranja quemado `#b45309`.
 *
 * ⚠️ **EL LÍMITE, dicho y no escondido.** Verde contra rojo es el par que peor
 * se distingue con protanopia y deuteranopia — el más extendido de los dos
 * problemas. La doctrina lo sabe y lo contesta con una segunda seña que no sea
 * color [issue #2787 de osm.org]: aquí esa seña existe en el ITINERARIO, donde
 * la salida y la llegada llevan `◉` y `⚑` además del icono. **En el MAPA no**:
 * dos chinchetas solo se diferencian por el color, y una forma distinta por
 * papel —la bandera a cuadros de la llegada— está ANOTADA para el punto 13, no
 * hecha hoy. Queda escrito aquí para que no se dé por resuelto lo que no lo
 * está.
 */

/** La chincheta: gota con la punta abajo, hueca en el centro. */
export const CAMINO_CHINCHETA =
  'M12 1.6c-4.1 0-7.4 3.3-7.4 7.4 0 5.5 7.4 13.4 7.4 13.4s7.4-7.9 7.4-13.4c0-4.1-3.3-7.4-7.4-7.4z';

/** La cruz de farmacia: brazos iguales, como la de la calle. */
export const CAMINO_CRUZ = 'M9.4 2.4h5.2v6.8h6.8v5.2h-6.8v6.8H9.4v-6.8H2.6V9.2h6.8z';

/**
 * ⭐ EL VERDE, uno solo, y compartido a sabiendas.
 *
 * Lo llevan **el origen de la ruta** [osm.org] y **la farmacia** [la cruz verde
 * es la señal de farmacia en España y en media Europa]. Son dos convenciones
 * distintas que aterrizan en el mismo color, y en vez de inventar dos verdes
 * parecidos —que se leerían como un error de imprenta— se declara uno.
 *
 * La consecuencia hay que decirla entera: en el mapa, **una cruz verde puede
 * ser el origen o el destino**, y quien lo desempata es la otra chincheta —si
 * es verde, la farmacia es el destino; si es roja, es el origen—. Con farmacia
 * en los dos extremos no hay desempate. Antonio lo dio por bueno el 23/08.
 */
export const VERDE = '#1a7f37';

/** Verde: el ORIGEN de la ruta [osm.org]. */
export const COLOR_ORIGEN = VERDE;
/** Rojo: el DESTINO de la ruta [osm.org]. */
export const COLOR_DESTINO = '#c1121f';
/** Verde: una farmacia, en cualquier papel. */
export const COLOR_SITIO = VERDE;
/**
 * Gris: una chincheta que **todavía no tiene papel**.
 *
 * Es el de las sugerencias. No es un color de relleno: decir «verde» ahí sería
 * afirmar que lo que se está mirando va al origen, y eso no se sabe hasta que
 * se pulsa.
 */
export const COLOR_NEUTRO = '#44403c';

/** De qué capa es un extremo. Los mismos dos valores que usa el autocompletar. */
export type Capa = 'via' | 'sitio';
/**
 * Qué papel hace en la ruta — y `ninguno`, que no es un hueco sino un estado:
 * una sugerencia de la lista no es origen ni destino todavía.
 */
export type Papel = 'origen' | 'destino' | 'ninguno';

/**
 * El color de un icono. Un sitio es verde siempre; una dirección depende de su
 * papel, y sin papel es gris.
 */
export function colorDeCapa(capa: Capa, papel: Papel): string {
  if (capa === 'sitio') {
    return COLOR_SITIO;
  }
  if (papel === 'origen') {
    return COLOR_ORIGEN;
  }
  return papel === 'destino' ? COLOR_DESTINO : COLOR_NEUTRO;
}

/** El camino de la figura de una capa. */
export function caminoDeCapa(capa: Capa): string {
  return capa === 'sitio' ? CAMINO_CRUZ : CAMINO_CHINCHETA;
}

/**
 * El MISMO icono, como cadena, para quien no puede usar una plantilla de
 * Angular: los marcadores de Leaflet, que quieren HTML hecho.
 *
 * Comparte los caminos y los colores con el componente de abajo —las constantes
 * son las mismas—, así que no hay dos dibujos que mantener a la par. Lo único
 * que añade es el **borde blanco**: sobre el mapa, una figura de color plano se
 * confunde con el fondo en cuanto cae sobre un parque o una manzana oscura.
 */
export function svgDeCapa(capa: Capa, papel: Papel, lado: number): string {
  const hueco =
    capa === 'via' ? '<circle cx="12" cy="9" r="2.9" fill="#ffffff"></circle>' : '';
  return (
    `<svg viewBox="0 0 24 24" width="${lado}" height="${lado}" ` +
    `data-icono="${capa}" data-papel="${papel}" aria-hidden="true" focusable="false">` +
    `<path d="${caminoDeCapa(capa)}" fill="${colorDeCapa(capa, papel)}" ` +
    `stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"></path>${hueco}</svg>`
  );
}

/**
 * El icono como componente, para las plantillas.
 *
 * `aria-hidden` en los dos sitios donde se usa: el icono repite lo que el texto
 * ya dice —«Farmacia · …», «CALLE BURGOS 2»—, y a quien escucha la pantalla no
 * se le lee dos veces la misma cosa. Es la misma regla que la flecha del paso.
 */
@Component({
  selector: 'app-icono-capa',
  template: `
    <svg
      class="icono-capa"
      viewBox="0 0 24 24"
      [attr.width]="lado()"
      [attr.height]="lado()"
      [attr.data-icono]="capa()"
      [attr.data-papel]="papel()"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="camino()" [attr.fill]="color()" />
      @if (capa() === 'via') {
        <circle cx="12" cy="9" r="2.9" fill="#ffffff" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      flex: none;
    }
  `,
})
export class IconoCapa {
  readonly capa = input.required<Capa>();
  /**
   * Obligatorio, sin valor por defecto. Un defecto aquí sería elegir un color
   * por quien no lo ha dicho, y el color es justo lo que distingue de dónde a
   * dónde: la lista del campo de origen pinta chinchetas azules y la del
   * destino, magentas, porque eso es lo que va a salir en el mapa al elegirlas.
   */
  readonly papel = input.required<Papel>();
  readonly lado = input(16);

  protected readonly camino = computed(() => caminoDeCapa(this.capa()));
  protected readonly color = computed(() => colorDeCapa(this.capa(), this.papel()));
}
