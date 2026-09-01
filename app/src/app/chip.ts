import type { LineaDelViaje } from '@desplazame/tipos';
import { contraste, AA_TEXTO } from './contraste';

/**
 * ⭐ DE QUÉ COLOR VA EL CHIP DE UNA LÍNEA. **Y esto es sistema, no estética.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  HEREDADO DE ZETABUS (`src/components/ChipLinea.tsx`), con su doctrina entera
 *  porque es la que resuelve el problema que tenemos:
 *
 *      EL COLOR      →  ¿QUÉ línea es?     (IDENTIDAD)
 *      LA INVERSIÓN  →  ¿es NOCTURNA?      (CATEGORÍA)
 *
 *  Un búho: fondo azul noche + el número EN EL COLOR DE LA LÍNEA. Invertido.
 *  Se distingue de un vistazo sin leer nada, y **sin gastar un color** — que es
 *  justo lo que no sobra en esta red: de nuestras 53 líneas, la mitad larga cae
 *  en la franja rojo / ámbar / verde. Si la categoría gastara un color, se
 *  comería el presupuesto entero de la identidad.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⭐ **EL PROBLEMA, MEDIDO SOBRE NUESTRO COCINADO** (`app/data/…cocinado.json`):
 *
 *      27 DE 53 CHIPS ESTÁN POR DEBAJO DE WCAG AA obedeciendo al feed.
 *
 *      línea 33 · #C5CE00 + blanco →  1,72:1   (en negro: 12,2:1)
 *      línea 43 · #F8AD07 + blanco →  1,91:1
 *      línea 59 · #A5C715 + blanco →  1,95:1
 *      línea TRA · #00CC00 + blanco →  2,18:1
 *
 *  El `route_text_color` del feed **no está calculado**: la 29 sale en negro y
 *  las demás en blanco porque alguien lo decidió línea a línea.
 *
 * ⚠️ **Y NO SE ARREGLA CALCULANDO EL TONO DEL NÚMERO.** Esa fue la primera vía
 *    de ZetaBus —su `textoLegible()`, que respeta el color del feed si pasa AA y
 *    si no cae al que más contraste da—, y **la retiraron con su razón escrita**:
 *    daba legibilidad y rompía la marca, porque *«la 29 salía en negro entre 30
 *    blancos y parecía un error»*. Aquí no se usa, y por eso no está copiada.
 *
 * ⚠️ **Ni oscureciendo el fondo.** También lo midieron: *«COLAPSABA 20 pares de
 *    diurnas — la 25 y la 28 caían a distancia 4»*. La paleta del operador tiene
 *    ~20 claras agrupadas por tono, y bajarlas todas a la misma luminancia las
 *    vuelve **el mismo color**. La identidad se perdería para salvar el texto.
 *
 * ⇒ LA VÍA QUE QUEDA, y es la que Antonio eligió allí: **el color de línea no se
 *   toca; el número es blanco con un TRAZO NEGRO**. El contraste lo da el
 *   contorno, no el fondo. Y es la técnica que la propia WCAG admite: *«el color
 *   de un contorno o borde puede usarse como primer plano al medir»*.
 */

/** El azul noche de los búhos. Medido por ZetaBus en la web de Avanza: rgb(28, 26, 66). */
export const NOCHE = '1C1A42';

/** Blanco y negro, los dos únicos tonos que puede tomar un número. */
export const BLANCO = 'FFFFFF';
export const NEGRO = '000000';

/**
 * ⭐ ¿Es una línea nocturna? **Por el nombre, y nada más** [ZetaBus,
 * `src/engine/grupos.ts`: `if (/^N/i.test(s)) return 'buho'`].
 *
 * Vive aquí, y no en la plantilla, para que **haya un solo sitio que lo decida**.
 * Si el chip de la leyenda y el del paso lo dedujeran cada uno por su cuenta,
 * bastaría con que uno se despistase para que una N7 saliera de diurna en un
 * sitio y de búho en otro.
 *
 * ⚠️ Y no se pregunta por el horario ni por el `route_id`: se pregunta por el
 *    `shortName`, que es el dato que ya viaja en cada chip. Allí eso tenía un
 *    precio medido —preguntarlo a la topología arrastraba 1,9 MB de GTFS al
 *    navegador—; aquí el motivo es el mismo aunque el precio sea otro.
 */
export const esBuho = (corto: string): boolean => /^N/i.test(corto);

/** Cómo se viste un chip: fondo, número, y si es de los que invierten. */
export interface TonosDeChip {
  readonly fondo: string;
  readonly texto: string;
  readonly buho: boolean;
}

/**
 * ⭐ LOS TONOS DE UN CHIP. Un solo sitio los decide, para los dos chips que hay.
 *
 * ⚠️ El `colorTexto` que manda el feed **no se mira**: para las diurnas la regla
 *    es de marca (blanco siempre) y para los búhos el número es el color de la
 *    línea. El campo sigue en el contrato porque es el dato del operador y no se
 *    borra por no usarlo — pero aquí no decide nada.
 */
export function tonosDeChip(linea: Pick<LineaDelViaje, 'corto' | 'color'>): TonosDeChip {
  if (esBuho(linea.corto)) {
    // ⭐ NOCTURNAS: fondo noche + número en el color de la línea, **con la red
    //    de ZetaBus por si un búho no se leyera sobre el azul**. Los siete
    //    nuestros pasan (el peor, la N4, a 4,70:1), pero si mañana entrara un
    //    búho azul oscuro su chip sería ilegible y nadie se enteraría. NO llevan
    //    contorno: su número no es blanco, y un trazo negro sobre el azul noche
    //    no ayudaría a nada.
    const suyo = contraste(NOCHE, linea.color);
    if (suyo >= AA_TEXTO) {
      return { fondo: NOCHE, texto: linea.color, buho: true };
    }
    const blanco = contraste(NOCHE, BLANCO);
    return { fondo: NOCHE, texto: blanco >= contraste(NOCHE, NEGRO) ? BLANCO : NEGRO, buho: true };
  }
  // ⭐ DIURNAS: color de línea INTACTO + número blanco. El contorno lo pone el
  //    CSS del chip, y es lo que hace que ese blanco se lea sobre cualquier tono.
  return { fondo: linea.color, texto: BLANCO, buho: false };
}

/** ¿Este número lleva contorno? Sí cuando es blanco. Un solo sitio decide. */
export const llevaContorno = (texto: string): boolean => texto.toUpperCase() === BLANCO;

/**
 * ⭐ LA GARANTÍA DEL CONTORNO, y es una cuenta, no una esperanza.
 *
 * El número lleva **relleno blanco y trazo negro**: sobre un fondo claro manda
 * el trazo, sobre uno oscuro manda el relleno. Así que lo que hay que comprobar
 * es `max(contraste(blanco, fondo), contraste(negro, fondo))`, y esa función
 * **tiene suelo**: su mínimo cae donde blanco y negro empatan, en 4,58:1 — por
 * encima de AA para **cualquier color imaginable**. Nunca hay un número ilegible.
 */
export const legiblePorContorno = (fondo: string): number =>
  Math.max(contraste(BLANCO, fondo), contraste(NEGRO, fondo));
