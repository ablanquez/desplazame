import { Component, computed, input } from '@angular/core';
import type { TipoDeSitio } from '@desplazame/tipos';

/**
 * ⭐ LOS ICONOS DE CAPA: qué clase de sitio es cada extremo, dicho sin leer.
 *
 * Un buscador que ofrece calles y farmacias en la misma lista tiene que
 * distinguirlas ANTES de que se lea el texto, porque el texto de las dos
 * empieza igual de a menudo por la misma palabra. Hasta el 23/08 la única seña
 * era el `data-capa` del `<li>` —invisible— y un fondo apenas distinto.
 *
 * **Son cuatro formas y cuatro colores, dibujados a mano en SVG.** Ni una
 * dependencia: la regla del repositorio es cero, y una familia de iconos entera
 * para traer cuatro figuras sería pagar cientos de kB por lo que cabe en cinco
 * `<path>`. Es la misma decisión que las flechas de los pasos, que son Unicode.
 *
 * LAS FORMAS — cuatro, y ninguna inventada de cero
 * · **Chincheta** — una dirección: calle y portal. Es la forma con la que
 *   cualquier mapa dice «este punto exacto», y su punta ES la coordenada.
 * · **Cruz verde** — una farmacia. En España la cruz verde es la señal de
 *   farmacia en la calle, así que no hay nada que aprender.
 * · **H blanca en cuadrado azul** — un hospital. Es la **señal S-23** del
 *   catálogo español, y la misma que se usa en media Europa: quien conduce por
 *   Zaragoza la lleva vista mil veces.
 * · **Cruz azul** — un centro de salud. [PROPIO, y firmado como tal] Aquí la
 *   doctrina no da una señal hecha, así que se COMPONE con dos piezas que sí lo
 *   están: la cruz sanitaria y el azul médico. Las otras dos cruces posibles
 *   estaban ocupadas o vetadas — la **roja** es emblema protegido por los
 *   Convenios de Ginebra y usarla de adorno es exactamente lo que prohíben; la
 *   **verde** ya es la farmacia.
 *
 * Y la separación hospital/centro de salud no es capricho: **OSM la hace**
 * —`amenity=hospital` es el que ingresa, `amenity=clinic`/`doctors` el de
 * consulta externa— y quien busca una cosa no quiere la otra.
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
 * · **Un solo azul para las dos clases sanitarias**, por lo mismo: lo que
 *   separa un hospital de un centro de salud es la forma —H en cuadrado contra
 *   cruz—, no un tono. Dos azules parecidos se leerían como un error de
 *   imprenta y no dirían nada [#2787: la forma distingue, no solo el color].
 * · Los cuatro contrastan con el mapa —OSM es beige, blanco y verde pálido— y con
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

/** La cruz sanitaria: brazos iguales, como la de la calle. */
export const CAMINO_CRUZ = 'M9.4 2.4h5.2v6.8h6.8v5.2h-6.8v6.8H9.4v-6.8H2.6V9.2h6.8z';

/** El cuadrado de la señal S-23, con la esquina apenas redondeada. */
export const CAMINO_CUADRADO =
  'M3.5 2.5h17a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1z';

/** La H de la S-23, que va BLANCA encima del cuadrado. */
export const CAMINO_H = 'M7.5 6.5h2.5v4.25h4V6.5h2.5v11h-2.5v-4.25h-4V17.5H7.5z';

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
 * ⭐ EL AZUL de lo sanitario, uno solo para hospitales y centros de salud.
 *
 * `#0d47a1`. Elegido por contraste y medido, no a ojo: **8,63:1 sobre blanco**
 * y **7,52:1 sobre el beige de las teselas de OSM** (`#f2efe9`), muy por encima
 * del 4,5:1 que pide WCAG para texto normal — y un icono pequeño necesita más
 * margen que un texto, no menos. Es además el azul de señal de tráfico, que es
 * de donde viene la H.
 */
export const AZUL = '#0d47a1';

/** Azul: un hospital [señal S-23]. */
export const COLOR_HOSPITAL = AZUL;
/** Azul: un centro de salud [PROPIO — ver la cabecera]. */
export const COLOR_CENTRO_SALUD = AZUL;

/**
 * Gris: una chincheta que **todavía no tiene papel**.
 *
 * Es el de las sugerencias. No es un color de relleno: decir «verde» ahí sería
 * afirmar que lo que se está mirando va al origen, y eso no se sabe hasta que
 * se pulsa.
 */
export const COLOR_NEUTRO = '#44403c';

/**
 * ⭐ QUÉ SE DIBUJA. **No es lo mismo que la capa del autocompletar.**
 *
 * El autocompletar tiene DOS capas —calles y sitios, que son dos índices
 * distintos [DOC Pelias: `layers`]— y eso es lo que dice su `data-capa`. Pero
 * los sitios son de tres clases y cada una tiene su dibujo, así que aquí hace
 * falta un valor más fino. Son dos preguntas distintas: «¿de qué índice salió?»
 * y «¿qué es?».
 *
 * El día que entre una cuarta clase de sitio, `TipoDeSitio` crece en el
 * contrato y **las tablas de aquí dejan de compilar** en vez de pintar un
 * hueco: es la mecánica de `Record<Giro, string>` en las flechas de los pasos.
 */
export type Clase = 'via' | TipoDeSitio;
/**
 * Qué papel hace en la ruta — y `ninguno`, que no es un hueco sino un estado:
 * una sugerencia de la lista no es origen ni destino todavía.
 */
export type Papel = 'origen' | 'destino' | 'ninguno';

/**
 * El color de un icono.
 *
 * **Un sitio lleva el color de su clase, y el papel no lo toca**: una farmacia
 * es verde y un hospital azul lo mismo en el origen que en el destino, porque
 * son lo que son y no cambian de identidad al cruzarlos con el ⇅. Solo la
 * chincheta —que no es nada por sí misma— se pinta según el papel, y sin papel
 * va gris.
 *
 * `Record<Clase, …>` y no un `if` encadenado: obliga a que estén las cuatro.
 */
const COLOR_DE_CLASE: Readonly<Record<TipoDeSitio, string>> = {
  farmacia: COLOR_SITIO,
  'centro-salud': COLOR_CENTRO_SALUD,
  hospital: COLOR_HOSPITAL,
};

export function colorDeCapa(clase: Clase, papel: Papel): string {
  if (clase !== 'via') {
    return COLOR_DE_CLASE[clase];
  }
  if (papel === 'origen') {
    return COLOR_ORIGEN;
  }
  return papel === 'destino' ? COLOR_DESTINO : COLOR_NEUTRO;
}

/**
 * La figura de una clase: su camino, y **qué lleva encima**.
 *
 * El hospital es el único de dos piezas —el cuadrado y la H blanca—, y por eso
 * esto no puede ser un solo `path`. La chincheta lleva su hueco blanco; la cruz
 * no lleva nada.
 */
export type Encima = 'circulo' | 'hache' | 'nada';

const FIGURA: Readonly<Record<Clase, { readonly camino: string; readonly encima: Encima }>> = {
  via: { camino: CAMINO_CHINCHETA, encima: 'circulo' },
  farmacia: { camino: CAMINO_CRUZ, encima: 'nada' },
  'centro-salud': { camino: CAMINO_CRUZ, encima: 'nada' },
  hospital: { camino: CAMINO_CUADRADO, encima: 'hache' },
};

/** El camino de la figura de una clase. */
export function caminoDeCapa(clase: Clase): string {
  return FIGURA[clase].camino;
}

/** Qué va dibujado ENCIMA de la figura, en blanco. */
export function encimaDe(clase: Clase): Encima {
  return FIGURA[clase].encima;
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
export function svgDeCapa(clase: Clase, papel: Papel, lado: number): string {
  const encima = encimaDe(clase);
  const arriba =
    encima === 'circulo'
      ? '<circle cx="12" cy="9" r="2.9" fill="#ffffff"></circle>'
      : encima === 'hache'
        ? `<path d="${CAMINO_H}" fill="#ffffff"></path>`
        : '';
  return (
    `<svg viewBox="0 0 24 24" width="${lado}" height="${lado}" ` +
    `data-icono="${clase}" data-papel="${papel}" aria-hidden="true" focusable="false">` +
    `<path d="${caminoDeCapa(clase)}" fill="${colorDeCapa(clase, papel)}" ` +
    `stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"></path>${arriba}</svg>`
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
      [attr.data-icono]="clase()"
      [attr.data-papel]="papel()"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="camino()" [attr.fill]="color()" />
      @if (encima() === 'circulo') {
        <circle cx="12" cy="9" r="2.9" fill="#ffffff" />
      } @else if (encima() === 'hache') {
        <path [attr.d]="CAMINO_H" fill="#ffffff" />
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
  readonly clase = input.required<Clase>();
  /**
   * Obligatorio, sin valor por defecto. Un defecto aquí sería elegir un color
   * por quien no lo ha dicho, y el color es justo lo que distingue de dónde a
   * dónde: la lista del campo de origen pinta chinchetas azules y la del
   * destino, magentas, porque eso es lo que va a salir en el mapa al elegirlas.
   */
  readonly papel = input.required<Papel>();
  readonly lado = input(16);

  protected readonly camino = computed(() => caminoDeCapa(this.clase()));
  protected readonly color = computed(() => colorDeCapa(this.clase(), this.papel()));
  protected readonly encima = computed(() => encimaDe(this.clase()));
  protected readonly CAMINO_H = CAMINO_H;
}
