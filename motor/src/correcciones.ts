/**
 * ⭐ LAS CORRECCIONES MANUALES DE SITIOS: lo que el proceso no puede arreglar.
 *
 * La validación espacial (`gacetero.ts`) caza la coordenada rota y, cuando la
 * dirección resuelve, la vuelve a situar sola. Pero hay un resto que no puede
 * resolver por sí misma: una coordenada mala **cuya dirección no da un portal**
 * —«s/n», o una calle que no casa—. Ahí el motor no tiene contra qué medir y lo
 * único honrado que sabe hacer es dejar el sitio fuera del índice.
 *
 * Ese resto es exactamente **la lista de confirmación manual**, y su método
 * está documentado: es lo que se hizo con la base sanitaria de Kenia [Frontiers
 * in Public Health, 2022], donde las coordenadas que el proceso automático no
 * podía arreglar se le mandaban **a quien conoce el terreno** y volvían
 * confirmadas. Aquí ese alguien es Antonio, y esta es la lista de vuelta.
 *
 * ── Por qué es un fichero y no un parche ────────────────────────────────────
 *
 * Es el patrón de las **cinco correcciones declaradas del callejero** (§ 1.3),
 * el único dato del repositorio que no está tal cual: se corrigen «está mal y
 * punto», una a una, con la evidencia delante y escritas donde se puedan leer.
 * Lo que aquí cambia respecto de aquellas es **dónde** se aplica: el fichero
 * municipal de equipamientos **no se toca**. Se corrige al cargar, en memoria,
 * que es el precedente que ya sentó la validación espacial.
 *
 * ── Las tres cerraduras ─────────────────────────────────────────────────────
 *
 * Una corrección a mano es la puerta más peligrosa de todo esto: es un número
 * escrito por una persona que se salta al dato. Así que lleva tres candados, y
 * los tres **revientan el arranque** en vez de dejar pasar algo dudoso:
 *
 * 1. **Se escribe contra una coordenada municipal concreta.** Si el fichero
 *    cambia y ya no dice lo que decía, la corrección se escribió mirando otra
 *    cosa y deja de valer. Que el motor no arranque es lo correcto: quien
 *    actualice el dato tiene que volver a mirar el caso.
 * 2. **La corrección pasa los dos cheques.** Frontera y distancia, los mismos
 *    que el resto. Un dato de fuera no entra por una puerta de servicio.
 * 3. **Se declara entera** —fuente y motivo— y sale en el log de arranque y en
 *    la ficha. Una corrección en silencio sería inventarse el dato.
 */

import type { Veredicto } from './gacetero.ts';

export interface CorreccionDeSitio {
  /** El código del sitio, `CentrosSalud.9090`. */
  readonly codigo: string;
  /** La coordenada buena, la confirmada. */
  readonly lon: number;
  readonly lat: number;
  /**
   * Y la que trae el fichero municipal **hoy**. Va aquí para dos cosas: para
   * poder enseñar de dónde viene el arreglo, y para que la corrección caduque
   * sola el día que el origen publique otra — ver la cerradura nº1.
   */
  readonly lonMunicipal: number;
  readonly latMunicipal: number;
  /** Quién lo dice y cómo lo comprobó. Sin esto, es un número puesto un día. */
  readonly fuente: string;
  /** Qué estaba mal. */
  readonly motivo: string;
}

/**
 * ⭐ LA LISTA. Hoy, una.
 *
 * **`CentrosSalud.9090` — Centro de Salud Fernando El Católico.** El fichero
 * municipal lo sitúa en `lon −8,184875`, que es **Portugal**, a unos 610 km
 * (§ 1.17). El cheque de frontera lo caza, y el rescate por callejero no puede
 * salvarlo porque su dirección es «C/ Domingo Miral, s/n» y sin número no hay
 * portal que devolverle: se quedaba fuera del índice y no se podía elegir.
 *
 * La coordenada de abajo la confirmó Antonio sobre el terreno el 24/08. Y el
 * propio callejero la respalda sin que nadie se lo pidiera: cae a **9 m del
 * portal 11 de CALLE DOMINGO MIRAL**, que es justo la calle que el registro
 * municipal declara. La ida y vuelta, que con la coordenada publicada era
 * imposible, ahora cierra.
 */
export const CORRECCIONES_DE_SITIOS: readonly CorreccionDeSitio[] = [
  {
    codigo: 'CentrosSalud.9090',
    lat: 41.6402816,
    lon: -0.9011954,
    latMunicipal: 41.542372909710075,
    lonMunicipal: -8.184875254157216,
    fuente: 'confirmación manual de Antonio, Google Maps, 24/08/2026',
    motivo: 'frontera: la coordenada municipal cae en Portugal',
  },
];

const PORCODIGO = new Map(CORRECCIONES_DE_SITIOS.map((c) => [c.codigo, c]));

/** La corrección de un sitio, si la hay. */
export function correccionDe(codigo: string): CorreccionDeSitio | null {
  return PORCODIGO.get(codigo) ?? null;
}

/**
 * Cerradura nº1: la corrección se escribió mirando ESTA coordenada municipal.
 *
 * Si el Ayuntamiento publica otra, la corrección ya no describe lo que hay y
 * hay que volver a mirar el caso. Revienta el arranque a propósito — dejarlo
 * pasar sería aplicar a ciegas un número escrito para otro dato.
 */
export function exigirQueSigaValiendo(
  correccion: CorreccionDeSitio,
  lonMunicipal: number,
  latMunicipal: number,
): void {
  if (lonMunicipal !== correccion.lonMunicipal || latMunicipal !== correccion.latMunicipal) {
    throw new Error(
      `La corrección de ${correccion.codigo} se escribió contra ` +
        `[${correccion.lonMunicipal}, ${correccion.latMunicipal}] y el fichero municipal dice ` +
        `ahora [${lonMunicipal}, ${latMunicipal}]. El dato ha cambiado: hay que volver a ` +
        'mirar el caso antes de seguir corrigiéndolo.',
    );
  }
}

/**
 * Cerradura nº2: la coordenada corregida pasa los mismos dos cheques.
 *
 * Ni frontera ni distancia se le perdonan por venir de una persona. Que salga
 * «rescatada» tampoco vale: significaría que el callejero y la mano dicen cosas
 * distintas, y eso es un caso para mirar, no para elegir uno de los dos.
 */
export function exigirQuePaseLosCheques(
  correccion: CorreccionDeSitio,
  veredicto: Veredicto,
): void {
  if (veredicto.estado !== 'sana') {
    throw new Error(
      `La corrección de ${correccion.codigo} —[${correccion.lon}, ${correccion.lat}]— no pasa la ` +
        `validación espacial: sale «${veredicto.estado}». Una coordenada puesta a mano entra por ` +
        'la misma puerta que las demás o no entra.',
    );
  }
}
