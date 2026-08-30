/**
 * ⭐ LAS CORRECCIONES DE SENTIDO: lo que OSM dice y el terreno desmiente.
 *
 * Un `oneway` mal puesto es el peor error posible de este motor, porque **no se
 * ve**: la ruta sale, tiene sus metros y sus pasos, y manda a alguien a
 * contramano por una calle. Ni el grafo ni la Ordenanza pueden cazarlo — los
 * dos dicen lo que OSM les dijo—, y por eso hace falta una lista escrita a
 * mano y un procedimiento para llenarla.
 *
 * ── El procedimiento, que no es nuestro ─────────────────────────────────────
 *
 * Es el patrón **Cygnus** [Telenav]: conflar el dato abierto de la
 * administración local contra OSM, sacar una lista de diferencias, y **darla a
 * verificar — nunca subirla a ciegas**. La clase de error tiene nombre propio
 * en el ecosistema: [DOC ImproveOSM, *TrafficFlowDirection*] busca vías que *«o
 * deberían ser oneway y no lo son, o son oneway en el sentido equivocado»*, y
 * declara un **6 % de falsos positivos** sobre 67.000 detecciones — por eso
 * **la verificación humana es siempre obligatoria** [QA wiki: el detector marca
 * potenciales; quien confirma es el ojo del que conoce la calle].
 *
 * La sonda vive en el scratchpad y saca la lista; **aquí solo entra lo que
 * Antonio ha confirmado**. Una fila de este fichero es una calle que alguien ha
 * mirado.
 *
 * ⚠️ **Y «mirado» quiere decir que ha dicho LA DIRECCIÓN.** La primera fila que
 * tuvo esta tabla se escribió el 29/08 sobre una queja —«esta ruta sube la
 * calle al revés»— dando por supuesto hacia dónde iba la calle. Iba al otro
 * lado: OSM tenía razón y la corrección invirtió un dato bueno. Una queja dice
 * que algo está mal; **solo el ojo dice hacia dónde va la calle**, y sin esa
 * frase no se escribe una fila. Ver la entrada del 30/08 de `docs/BITACORA.md`.
 *
 * ── Lo que la sonda NO puede ver, y es justo lo que más duele ───────────────
 *
 * El contraste municipal×OSM compara `doble_sent` (que dice SI/NO, no la
 * dirección) contra `oneway` (que sí dice la dirección). Donde **las dos
 * fuentes dicen «sentido único» pero en direcciones contrarias**, el contraste
 * las ve de acuerdo y calla: son **1.185 vías, 7.846 aristas y 299,8 km** en
 * los que esta sonda es ciega. Ahí solo caza el ojo —o, algún día, las trazas
 * del GTFS del punto 10—. La primera fila de esta tabla es exactamente uno de
 * esos casos, y la encontró Antonio mirando una ruta.
 *
 * ── Las tres cerraduras, calcadas de `correcciones.ts` ──────────────────────
 *
 * 1. **Se escribe contra lo que OSM dice HOY.** Si § 1.21 se vuelve a
 *    descargar y ese *way* ya no dice lo que decía, la corrección se escribió
 *    mirando otra cosa: **el motor no arranca**. Es el deshielo — quien
 *    actualice el dato tiene que volver a mirar el caso, y si OSM ya lo arregló,
 *    la fila se borra.
 * 2. **El *way* tiene que existir en el fichero.** Un id que ya no está es una
 *    corrección que no corrige nada, y también revienta el arranque.
 * 3. **Se declara entera** —fuente, fecha y motivo— y sale en el log de
 *    arranque. Una corrección en silencio sería inventarse el dato.
 */

/** Lo que un `oneway` puede valer después de corregirlo. */
export type SentidoCorregido =
  /** Sentido único, en el sentido en que OSM dibujó la línea. */
  | 'yes'
  /** Sentido único, **al revés** del dibujo. Es la clase Siresa. */
  | '-1'
  /** Los dos sentidos: el `oneway` sobraba. */
  | 'no';

export interface CorreccionDeSentido {
  /** El *way* de OpenStreetMap, tal y como se mira en `osm.org/way/…`. */
  readonly way: number;
  /**
   * ⭐ Lo que el tag `oneway` de § 1.21 vale **hoy** para ese *way*, o
   * `undefined` si no lo trae. Es la cerradura nº1: se compara al arrancar, y
   * si no cuadra, el motor no abre el puerto.
   */
  readonly osmDiceHoy: string | undefined;
  /** Lo que debe valer. */
  readonly correccion: SentidoCorregido;
  /** Quién lo dice y cómo lo comprobó. Sin esto es un valor puesto un día. */
  readonly fuente: string;
  /** Cuándo se verificó, en ISO. */
  readonly fecha: string;
  /** Qué estaba mal, en una línea. */
  readonly motivo: string;
}

/**
 * ⭐ LA TABLA, HOY **VACÍA**. Y vacía es un estado legítimo, no un pendiente.
 *
 * Tuvo una fila —la Calle Monasterio de Siresa, `way 24433275`, corregida a
 * `-1` el 29/08— y **estaba mal**: el 30/08 Antonio precisó la dirección sobre
 * el terreno —*sentido único **hacia** el Doctor Iranzo; no se entra desde
 * él*— y eso es exactamente lo que OSM ya decía con su `oneway=yes`. La
 * corrección invertía un dato correcto, y durante un día el motor solo dejó
 * recorrer esa calle en el sentido que la señal prohíbe.
 *
 * [CycleStreets] la *repair table* es una tabla **mantenida**: corrige el dato
 * malo, y **se retira cuando el testimonio que la sostenía cae**. Eso es lo que
 * se hizo — no se ajustó el valor, se quitó la fila.
 *
 * ⚠️ **Lo que NO se retira es el mecanismo.** Las tres cerraduras, el deshielo
 * y el log de arranque siguen enteros, probados con una fila de mentira en
 * `sentidos.spec.ts`, para que la próxima corrección nazca con su caducidad
 * puesta. Y la lista de la sonda tiene 434 candidatos: ninguno verificado, y
 * ninguno entra hasta que un ojo diga **la dirección**, no la queja.
 */
export const SENTIDOS_CORREGIDOS: readonly CorreccionDeSentido[] = [];

/**
 * El `oneway` corregido de un *way*, o `undefined` si no está en la tabla.
 *
 * ⚠️ **Lanza** si la corrección ya no cuadra con lo que el fichero dice: es la
 * cerradura nº1, y reventar el arranque es lo correcto — una corrección que se
 * escribió mirando otro dato no es una corrección, es un valor a ciegas.
 */
export function sentidoCorregidoDe(
  way: number,
  tagDeHoy: string | undefined,
  existeElWay: boolean,
): SentidoCorregido | undefined {
  const fila = SENTIDOS_CORREGIDOS.find((c) => c.way === way);
  if (!fila) {
    return undefined;
  }
  if (!existeElWay) {
    throw new Error(
      `corrección de sentido caducada: el way ${way} ya no está en § 1.21. ` +
        `Se corrigió el ${fila.fecha} (${fila.motivo}). Revísalo y borra la fila.`,
    );
  }
  if (tagDeHoy !== fila.osmDiceHoy) {
    throw new Error(
      `corrección de sentido caducada: el way ${way} decía oneway=${fila.osmDiceHoy} ` +
        `cuando se corrigió el ${fila.fecha} y ahora dice oneway=${tagDeHoy}. ` +
        'Si OSM ya lo ha arreglado, borra la fila; si no, vuelve a mirarlo.',
    );
  }
  return fila.correccion;
}
