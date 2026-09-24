/**
 * ⭐ EL CINTURÓN DEL HUSO: el motor arranca SIEMPRE en hora de Zaragoza (T1, 24/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ ESTO ES EL CINTURÓN, NO EL ARREGLO. El arreglo son las cuatro funciones
 *  que deciden —`hoyEnGtfs`, `segundosDelDia`, `laZbeEstaEnVigor`,
 *  `laVentana`—, que desde hoy resuelven el día civil y la hora de pared por
 *  `reloj.ts` y **ya no dependen de esta variable**. Esto es la segunda
 *  cuerda: lo que quede o lo que entre mañana leyendo el reloj del proceso
 *  —un `new Date().toString()` en un log, una función nueva— cae de pie.
 *
 *  Antonio fijó `TZ` en el panel de Hostinger el 24/09. Esto lo fija **en el
 *  repositorio**, que es lo que sobrevive a una migración de hosting, a un
 *  panel reseteado y a un clon limpio en otra máquina.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── ⚠️ POR QUÉ NO SE PONE EN EL `npm start`, que sería lo obvio ─────────────
 *
 * Porque `TZ=Europe/Madrid node src/servidor.ts` **no es multiplataforma**: esa
 * forma es sintaxis de shell POSIX, y npm ejecuta los scripts en `cmd.exe` en
 * Windows, donde `TZ=x node` no asigna nada — falla o arranca sin la variable.
 * O se mete una dependencia solo para eso, o se fija desde dentro. Se fija
 * desde dentro: **el motor no tiene dependencias y no va a estrenar una para
 * una asignación**.
 *
 * ── LA DOC QUE LO RESPALDA, y es la de Node, no la memoria ──────────────────
 *
 * [DOC Node, `cli.md`, sección `TZ`, bloque `changes`] — las dos entradas, una
 * por sistema, literales:
 *
 *   · **v13.0.0** (PR 20026): *«Changing the TZ variable using process.env.TZ =
 *     changes the timezone on POSIX systems.»*
 *   · **v16.2.0** (PR 38642): *«Changing the TZ variable using process.env.TZ =
 *     changes the timezone on Windows as well.»*
 *
 * O sea: asignar `process.env.TZ` **en caliente** cambia el huso del proceso en
 * los dos sistemas desde v16.2.0, y este repositorio declara
 * `engines: { node: ">=22" }` en la raíz y en el motor. **Los dos sistemas
 * quedan cubiertos por el mismo mecanismo**, sin hueco que declarar.
 *
 * Y del mismo sitio, lo que se le puede dar: *«it does support basic timezone
 * IDs (such as 'Etc/UTC', 'Europe/Paris', or 'America/New_York'). It may
 * support a few other abbreviations or aliases, but these are strongly
 * discouraged and not guaranteed.»* `Europe/Madrid` es un ID de la base IANA,
 * de los que la doc sí garantiza — y nunca un `+2`, por la doctrina de la nº41:
 * el mismo 12:48 de pared es 10:48Z en agosto y 11:48Z en diciembre.
 *
 * ── ⚠️ ESTE MÓDULO SOLO LO IMPORTA EL PUNTO DE ENTRADA ──────────────────────
 *
 * Nunca una pieza de biblioteca. Si `trayecto.ts` o `viaje-coche.ts` lo
 * arrastraran, el hijo en `TZ=UTC` de `huso.spec.ts` **se pondría en hora de
 * Madrid al importarlos** y la suite entera daría verde sin poder ver nada —
 * que es exactamente el fallo del 8/09 vuelto a montar, ahora dentro del
 * instrumento—. La juez 0 de esa suite lo caza: compra que el hijo sigue
 * diciendo `UTC`. Si algún día se rompe esa regla, esa juez se pone roja.
 */
import { ZONA_DE_ZARAGOZA } from './reloj.ts';

/** Lo que traía el entorno antes de que tocáramos nada. Se lee una vez. */
const LO_QUE_TRAIA_EL_ENTORNO = process.env['TZ'];

// ⭐ Y aquí se fija, antes de que nadie construya una fecha.
process.env['TZ'] = ZONA_DE_ZARAGOZA;

/**
 * La línea del arranque que declara en qué huso corre el motor.
 *
 * ⚠️ **No dice lo que se le ha pedido a Node: dice lo que Node contesta.** Se
 *    pregunta a `Intl` por el huso ya resuelto, porque una variable asignada y
 *    un huso aplicado no son la misma cosa — y el día que no lo sean, esta
 *    línea es la que lo enseña. Es la misma ley que la juez 0 de `huso.spec.ts`.
 */
export function elHusoDelProceso(): string {
  const resuelto = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const deDonde =
    LO_QUE_TRAIA_EL_ENTORNO === undefined
      ? 'el entorno no traía TZ'
      : LO_QUE_TRAIA_EL_ENTORNO === ZONA_DE_ZARAGOZA
        ? 'el entorno ya traía la misma'
        : `el entorno traía «${LO_QUE_TRAIA_EL_ENTORNO}» y manda el repositorio`;
  const pega = resuelto === ZONA_DE_ZARAGOZA ? '' : ` ⚠️ PERO Node resuelve «${resuelto}»`;
  return `motor: huso del proceso ${resuelto} — fijado a ${ZONA_DE_ZARAGOZA} (${deDonde})${pega}`;
}
