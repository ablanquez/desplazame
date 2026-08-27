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
 * **Son ocho formas y cuatro colores, dibujados a mano en SVG.** Ni una
 * dependencia: la regla del repositorio es cero, y una familia de iconos entera
 * para traer ocho figuras sería pagar cientos de kB por lo que cabe en unos
 * pocos `<path>`. Es la misma decisión que las flechas de los pasos, que son
 * Unicode.
 *
 * ⭐ **Cuatro colores para ocho formas, y eso es la doctrina, no un ahorro**:
 * el color dice de qué FAMILIA es —sanitario, cultura, educación— y la forma
 * dice qué es exactamente. Un tono por categoría daría ocho colores parecidos
 * que nadie sabría separar; ocho formas sí se separan [#2787].
 *
 * LAS FORMAS — cuatro, y ninguna inventada de cero
 * · **Chincheta** — una dirección: calle y portal. Es la forma con la que
 *   cualquier mapa dice «este punto exacto», y su punta ES la coordenada.
 * · **Cruz verde** — una farmacia. En España la cruz verde es la señal de
 *   farmacia en la calle, así que no hay nada que aprender.
 * · **H blanca en cuadrado azul** — un hospital. Es la **señal S-23** del
 *   catálogo español, y la misma que se usa en media Europa: quien conduce por
 *   Zaragoza la lleva vista mil veces.
 * · **Libro abierto** — una biblioteca [osm-carto y Maki dibujan lo mismo].
 * · **Lápiz y manzana** — un colegio o instituto [Maki `school`].
 * · **Birrete** — una universidad [Maki `college`].
 * · **Chupete** — una guardería. [PROPIO, y firmado como tal] Ni carto —que no
 *   trae iconos de educación— ni Maki ni Temaki dibujan una guardería: el hueco
 *   se comprobó antes de llenarlo.
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
 * ⭐ EL LIBRO ABIERTO: dos hojas simétricas que salen de un lomo central.
 *
 * **El libro abierto ES el glifo de biblioteca** en los dos mapas de
 * referencia: [osm-carto `symbols/amenity/library.svg`, 14×14] y [Maki
 * `icons/library.svg`, 15×15] dibujan lo mismo con la misma convención — dos
 * páginas que arrancan de un lomo. Lo que se adopta es **la convención, no el
 * fichero**: este camino está trazado aquí, en el mismo lienzo de 24×24 que los
 * otros tres, y no copiado de ninguno de ellos.
 *
 * Son **dos subcaminos**, uno por página, y el lomo es el hueco que queda entre
 * ellos — dos píxeles sin pintar en el centro. Pintarlo de blanco encima
 * habría hecho falta un `Encima` nuevo y, peor, un lomo blanco sobre el mapa se
 * ve como un corte; dejarlo sin pintar lo deja del color de lo que haya debajo,
 * que es lo que hacen los dos originales.
 */
/**
 * ⭐ EL LÁPIZ Y LA MANZANA: un colegio o un instituto.
 *
 * **Es el glifo de `school` de Maki**, leído de su fuente
 * (`maki/icons/school.svg`, 15×15): un lápiz en diagonal y una manzana con su
 * hoja. Lo que se adopta es **la convención, no el fichero** — este camino está
 * trazado aquí, en el lienzo de 24×24 de la casa, y los números no son los
 * suyos. Maki es CC0 y copiarlo sería lícito; no se copia igual, por lo mismo
 * que el libro de bibliotecas: un dibujo que no se ha trazado no se sabe
 * arreglar.
 *
 * Son **cinco subcaminos**: la goma, el cuerpo y la punta del lápiz, y la
 * manzana con su hoja, que ocupa la esquina de abajo a la derecha — el reparto
 * del original.
 *
 * ⚠️ **El lápiz va VERTICAL y ancho, y Maki lo pone en diagonal.** El primer
 * trazado lo puso en diagonal como el suyo y **a 14 px no se leía**: un lápiz
 * inclinado y estrecho, con el borde blanco de 1,4 que el marcador le pinta
 * encima, se queda en un pelo. La convención que se adopta es «lápiz y
 * manzana», no el ángulo.
 *
 * ⚠️ Y **hubo tres pasadas, mirándolo cada vez** en una hoja de contactos a 14,
 * 32 y 64 px sobre blanco y sobre el beige de las teselas. La segunda salió con
 * la manzana rota —una forma retorcida en vez de un círculo—, y la causa merece
 * quedar escrita porque volverá: **el camino se había partido en medio de un
 * número**. `'… 3.5 3' + '.3 0 …'` se concatena en `3.5 3.3 0`, que es otro
 * dibujo. Desde aquí, **cada subcamino va en una sola cadena** y las sumas solo
 * ocurren entre subcaminos, después de una `z`.
 *
 * Un tercer subcamino, el rabito de la manzana, se quitó: quedaba tapado por
 * ella y no se veía a ningún tamaño. Un trazo que no se ve no se deja puesto.
 */
export const CAMINO_COLEGIO =
  // el lápiz: goma, cuerpo y punta
  'M2.4 2.2h5.8v3.1H2.4z' +
  'M2.4 6.1h5.8v8.6H2.4z' +
  'M2.4 15.5h5.8l-2.9 4.3z' +
  // la manzana y su hoja
  'M16.4 8.9a6 6 0 1 1 0 12 6 6 0 0 1 0-12z' +
  'M17.2 7.6c.1-2.1 1.9-3.7 4-3.8.1 2.1-1.7 3.8-3.8 3.9z';

/**
 * ⭐ EL BIRRETE: una universidad.
 *
 * **Es el glifo de `college` de Maki**, leído de su fuente
 * (`maki/icons/college.svg`, 15×15): la tabla en rombo, la copa debajo y la
 * borla colgando. Trazado aquí, como el anterior.
 *
 * Son **cuatro subcaminos**: la tabla, la copa, el cordón de la borla y su
 * bola. La borla cuelga por la derecha —en Maki cae por la izquierda—, y el
 * cambio no es capricho: a la izquierda chocaría con el borde blanco que el
 * marcador del mapa le pone a la figura.
 */
export const CAMINO_UNIVERSIDAD =
  // la tabla, en rombo
  'M12 1.9 23 6.9 12 11.9 1 6.9z' +
  // la copa, que asoma por debajo
  'M6.1 9.2 12 11.9 17.9 9.2v4.5c0 2.1-2.6 3.5-5.9 3.5s-5.9-1.4-5.9-3.5z' +
  // el cordón de la borla y su bola
  'M20.3 8.1h1.9v5.6h-1.9z' +
  'M23.3 15.7a2.05 2.05 0 0 1-4.1 0 2.05 2.05 0 0 1 4.1 0z';

/**
 * ⭐ EL CHUPETE: una guardería. **PROPIO, y firmado como tal por Antonio.**
 *
 * Aquí no hay glifo que adoptar, y se comprobó antes de inventarlo: **ni
 * osm-carto —que no trae ningún icono de educación— ni Maki ni Temaki dibujan
 * una guardería**. `amenity=kindergarten` existe como tag y se pinta con el
 * mismo símbolo que la escuela o con nada. Así que el hueco es real y el dibujo
 * es de la casa, que es la misma situación que la cruz azul del centro de
 * salud.
 *
 * Un chupete son **tres subcaminos**: la anilla —un aro, con su agujero
 * trazado al revés para que el relleno lo respete—, el disco frontal y la
 * tetina. Se elige porque es la señal universal del bebé y porque su silueta
 * no se parece a ninguna de las otras seis a 14 px, que es el listón real.
 */
export const CAMINO_GUARDERIA =
  // la anilla: el aro exterior, y su agujero al revés para que se reste
  'M12 0.5a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6z' +
  'M12 2.6a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z' +
  // el disco frontal
  'M12 7.7c5 0 9 2.4 9 5.4s-4 5.4-9 5.4-9-2.4-9-5.4 4-5.4 9-5.4z' +
  // la tetina
  'M8.7 17.8h6.6c.5 2.1 1.4 2.9 1.4 4.1 0 2.1-2.1 3.2-4.7 3.2s-4.7-1.1-4.7-3.2c0-1.2.9-2 1.4-4.1z';

export const CAMINO_LIBRO =
  'M11 6.2C9.2 4.9 6.6 4.2 3 4.2v13.6c3.6 0 6.2.7 8 2z' +
  'M13 6.2c1.8-1.3 4.4-2 8-2v13.6c-3.6 0-6.2.7-8 2z';

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

/**
 * ⭐ EL MORADO de la cultura, que es la familia de las bibliotecas.
 *
 * **El color va por FAMILIA, no por categoría** — es la doctrina de las hojas
 * de estilo de osm-carto, que pinta los POI según a qué grupo pertenecen y no
 * uno a uno. Lo sanitario ya tiene su azul; la cultura estrena el suyo aquí, y
 * el día que entren museos o teatros lo comparten.
 *
 * **El tono concreto es PROPIO**, como el azul, y va medido y no a ojo:
 * `#6a1b9a` da **9,39:1 sobre blanco** y **8,18:1 sobre el beige de las teselas
 * de OSM** (`#f2efe9`). El mínimo documentado para un elemento que no es texto
 * es **3:1** [WCAG 2.2, 1.4.11 *Non-text Contrast*]; el listón de esta casa es
 * **≥7:1**, que es el precedente que dejó el azul sanitario con sus 8,63:1, y
 * es el que se aplica.
 *
 * ⚠️ **Y por eso no se usa el marrón de osm-carto.** Su color de turismo y
 * cultura es `#734a08`, que aquí da **7,74:1 sobre blanco pero 6,75:1 sobre el
 * beige**: se queda por debajo del listón de la casa justo en el fondo sobre el
 * que se va a ver. Además es un marrón oscuro y cálido, difícil de separar del
 * gris `#44403c` de las chinchetas sin papel a 14 px. Se declara la doctrina
 * (color por familia) y se cambia el tono, con la medida delante.
 */
export const MORADO = '#6a1b9a';

/** Morado: una biblioteca [familia cultura]. */
export const COLOR_BIBLIOTECA = MORADO;

/**
 * ⭐ EL MOSTAZA OSCURO de la educación, uno solo para las tres categorías.
 *
 * **El color va por FAMILIA**, la misma doctrina que el azul sanitario y el
 * morado de cultura: colegios, guarderías y universidades son una familia y
 * comparten tono. Lo que las separa es **la forma** —lápiz y manzana, chupete,
 * birrete—, que es el segundo diferenciador que pide la doctrina [#2787].
 *
 * **La familia cromática sí es de fuera**: osm-carto pinta los recintos
 * escolares de amarillo, y de ahí sale el mostaza. **El tono exacto es
 * PROPIO**, porque ese amarillo no aguanta el listón de la casa ni de lejos:
 * medido, `#8a6d00` da **4,92:1 sobre blanco** y **4,29:1 sobre el beige**. Hay
 * que oscurecerlo hasta que pase, y donde pasa es aquí.
 *
 * `#614800` da **8,62:1 sobre blanco** y **7,51:1 sobre el beige de las teselas
 * de OSM** (`#f2efe9`). El mínimo documentado para un elemento que no es texto
 * es **3:1** [WCAG 2.2, 1.4.11 *Non-text Contrast*]; el listón de esta casa es
 * **≥7:1**. Y el par que sale es **el mismo que el azul sanitario al
 * centésimo** —8,63 y 7,52—, que no se buscó: se eligió el tono más claro que
 * pasaba y cayó ahí. Firmado por Antonio el 25/08.
 *
 * ⚠️ **Un mostaza más vivo no cabía.** El más claro que aún pasa el listón es
 * `#654b00` (8,20 y 7,15), y de `#6b5000` para arriba ya se cae sobre el beige
 * —7,57 pero **6,60**—, que es exactamente por donde se cayó el marrón de
 * carto. Sobre el mapa, el fondo manda.
 */
export const MOSTAZA = '#614800';

/** Mostaza: un colegio o instituto [familia educación]. */
export const COLOR_COLEGIO = MOSTAZA;
/** Mostaza: una guardería [familia educación]. */
export const COLOR_GUARDERIA = MOSTAZA;
/** Mostaza: una universidad [familia educación]. */
export const COLOR_UNIVERSIDAD = MOSTAZA;

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
 * `Record<Clase, …>` y no un `if` encadenado: obliga a que estén todas.
 */
const COLOR_DE_CLASE: Readonly<Record<TipoDeSitio, string>> = {
  farmacia: COLOR_SITIO,
  'centro-salud': COLOR_CENTRO_SALUD,
  hospital: COLOR_HOSPITAL,
  biblioteca: COLOR_BIBLIOTECA,
  colegio: COLOR_COLEGIO,
  guarderia: COLOR_GUARDERIA,
  universidad: COLOR_UNIVERSIDAD,
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
  biblioteca: { camino: CAMINO_LIBRO, encima: 'nada' },
  colegio: { camino: CAMINO_COLEGIO, encima: 'nada' },
  guarderia: { camino: CAMINO_GUARDERIA, encima: 'nada' },
  universidad: { camino: CAMINO_UNIVERSIDAD, encima: 'nada' },
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
