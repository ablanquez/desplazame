/**
 * ⭐ EL LOG A FICHERO (8/09, M0 del punto 14).
 *
 * ── ⚠️ La carencia, y está medida ───────────────────────────────────────────
 *
 * El 6/09 no se pudo casar lo que el ojo vio a las 17:20 con lo que el motor
 * hizo, porque **el motor no guardaba nada de lo que decía**: escribía en
 * `stdout` y ahí moría. Cerrada la terminal, no había con qué reconstruir.
 * Consta en la entrada nº37 de `docs/BITACORA.md`.
 *
 * ── Lo que esto NO es ───────────────────────────────────────────────────────
 *
 * No sustituye a `stdout`. El panel de Hostinger enseña los logs del proceso y
 * esa ventana sigue haciendo falta: esto escribe **además**, no en vez.
 *
 * ── Por qué un fichero por día y no otra cosa ───────────────────────────────
 *
 * Es el patrón más simple que cumple las dos cosas que hay que cumplir: que se
 * pueda ir a la hora de un suceso, y que el disco no crezca sin fin. Rotar por
 * tamaño obliga a numerar, a renombrar en cadena y a decidir qué pasa si el
 * proceso muere a mitad; rotar por día es un nombre y ya. **Cero dependencias**,
 * como todo lo demás de esta casa.
 *
 * ⚠️ **LAS HORAS VAN EN UTC, igual que todo lo que el motor ya imprime**
 *    —`arrancado a las …Z`, el `arrancado` de `/api/salud`, los sellos de los
 *    datos—. Tener dos convenciones de hora dentro del mismo fichero sería
 *    peor que la molestia de restar el huso: quien lea el log en Zaragoza tiene
 *    que hacer +2 en verano. Está dicho aquí a propósito, porque el caso que
 *    hizo falta el 6/09 era justo «las 17:20» de un reloj de pared.
 *
 * ⚠️ **Y ES UN TESTIGO, NO UN REQUISITO.** Nada de aquí puede tumbar el motor
 *    al que vigila: si el disco está lleno o el permiso falla, se pierde la
 *    línea y se sigue. Un log que mata al servidor es peor que no tener log.
 */
import { closeSync, mkdirSync, openSync, readdirSync, unlinkSync, writeSync } from 'node:fs';
import { format } from 'node:util';
import { join } from 'node:path';

/**
 * ⭐ CUÁNTOS DÍAS SE GUARDAN.
 *
 * Dos semanas: da margen para mirar «lo del fin de semana pasado» sin que un
 * hosting compartido acabe con un directorio de miles de ficheros. No hay dato
 * externo que fije este número — es una decisión de casa, y por eso se declara
 * en vez de esconderse dentro del borrado.
 */
export const DIAS_QUE_SE_GUARDAN = 14;

export type Nivel = 'log' | 'warn' | 'error';

/**
 * La marca de nivel, escrita.
 *
 * En la terminal los separa el color; en un fichero no hay color. Sin esto,
 * buscar los errores de una noche obligaría a saberse de memoria qué frases
 * eran `console.error`.
 */
const MARCAS: Readonly<Record<Nivel, string>> = { log: 'I', warn: 'W', error: 'E' };

/** El día de una fecha en UTC, `AAAA-MM-DD`, que es el nombre del fichero. */
function elDia(cuando: Date): string {
  return cuando.toISOString().slice(0, 10);
}

export interface Registro {
  /** El fichero al que se está escribiendo ahora mismo. */
  donde(): string;
  escribir(nivel: Nivel, texto: string, cuando: Date): void;
  cerrar(): void;
}

/**
 * ⭐ BORRA LOS LOGS PASADOS DE PLAZO, **POR EL NOMBRE Y NO POR LA FECHA DEL
 *    SISTEMA DE FICHEROS**.
 *
 * ⚠️ La `mtime` de un fichero la cambia cualquier cosa —un `cp`, un despliegue,
 *    un respaldo restaurado— y entonces el borrado tiraría de lo que no toca o
 *    guardaría lo que ya no vale. El nombre lo pone este módulo y no lo cambia
 *    nadie: `2026-09-07.log` es del 7 de septiembre y punto.
 *
 * Y solo toca lo que casa con ese patrón exacto: lo que haya en la carpeta y no
 * sea un log del motor no es asunto suyo.
 */
function tirarLosViejos(dir: string, hoy: Date, dias: number): void {
  const corte = new Date(hoy.getTime() - dias * 86_400_000).toISOString().slice(0, 10);
  for (const nombre of readdirSync(dir)) {
    const m = /^(\d{4}-\d{2}-\d{2})\.log$/.exec(nombre);
    if (m && m[1]! < corte) {
      try {
        unlinkSync(join(dir, nombre));
      } catch {
        // Un fichero que no se deja borrar no es motivo para no arrancar.
      }
    }
  }
}

/**
 * ⭐ ABRE EL REGISTRO, y de paso hace la limpieza del plazo.
 *
 * `hoy` entra por parámetro —no se pide al sistema— para que la rotación se
 * pueda comprobar sin esperar a medianoche. Es el mismo trato que el reloj del
 * viaje en bus recibió el 6/09: si la hora la pide la función, nadie puede
 * juzgarla.
 */
export function abrirElRegistro(
  dir: string,
  hoy: Date,
  dias: number = DIAS_QUE_SE_GUARDAN,
): Registro {
  mkdirSync(dir, { recursive: true });
  try {
    tirarLosViejos(dir, hoy, dias);
  } catch {
    // Si ni se puede listar la carpeta, se escribe igual: el testigo importa
    // más que la limpieza.
  }

  /** El fichero abierto y de qué día es. `null` mientras no se escriba nada. */
  let abierto: { readonly dia: string; readonly fd: number } | null = null;
  let cerrado = false;

  const soltar = (): void => {
    if (abierto) {
      try {
        closeSync(abierto.fd);
      } catch {
        // Ya estaba cerrado o el descriptor no vale: no hay nada mejor que hacer.
      }
      abierto = null;
    }
  };

  return {
    donde: () => join(dir, `${abierto?.dia ?? elDia(hoy)}.log`),

    escribir(nivel, texto, cuando) {
      if (cerrado) {
        return;
      }
      try {
        const dia = elDia(cuando);
        // ⭐ AQUÍ ROTA: cambió el día, se suelta el de ayer y se abre el de hoy.
        //    Un motor que lleve semanas levantado tiene que cruzar la medianoche
        //    él solo, sin que nadie lo reinicie.
        if (abierto?.dia !== dia) {
          soltar();
          abierto = { dia, fd: openSync(join(dir, `${dia}.log`), 'a') };
        }
        writeSync(abierto.fd, `${cuando.toISOString()} ${MARCAS[nivel]} ${texto}\n`);
      } catch {
        // Disco lleno, permiso denegado, descriptor caído: se pierde la línea y
        // el motor sigue. Ver la cabecera — testigo, no requisito.
      }
    },

    cerrar() {
      cerrado = true;
      soltar();
    },
  };
}

/**
 * ⭐ ENGANCHA LA CONSOLA AL REGISTRO, **SIN QUITARLE NADA A `stdout`**.
 *
 * Se envuelven `log`, `warn` y `error`: cada una llama a la de siempre —el
 * panel de Hostinger sigue viendo lo mismo que veía— y además escribe la línea
 * en el fichero del día.
 *
 * ⚠️ **El formateo lo hace `node:util`, no nosotros.** `console.log('a %s', b)`
 *    y `console.log(objeto)` tienen reglas que ya están escritas y que un
 *    `args.join(' ')` de andar por casa rompe en cuanto alguien loguea un
 *    objeto. `format` es exactamente lo que la consola usa por dentro.
 *
 * Devuelve la función que lo deshace: sin eso, una prueba que enganche deja la
 * consola tocada para todo lo que venga después.
 */
export function engancharLaConsola(reg: Registro, reloj: () => Date = () => new Date()): () => void {
  const previas = { log: console.log, warn: console.warn, error: console.error };
  const envolver =
    (nivel: Nivel) =>
    (...args: unknown[]): void => {
      previas[nivel](...args);
      reg.escribir(nivel, formatear(args), reloj());
    };
  console.log = envolver('log');
  console.warn = envolver('warn');
  console.error = envolver('error');
  return () => {
    console.log = previas.log;
    console.warn = previas.warn;
    console.error = previas.error;
  };
}

/**
 * Lo que la consola imprimiría, en una línea.
 *
 * Es `format` de `node:util` tal cual —lo mismo que `console.log` usa por
 * dentro—, así que `console.log('a %s', b)` y `console.log(objeto)` salen en el
 * fichero como salen en la terminal. Un `args.join(' ')` de andar por casa se
 * rompe en cuanto alguien loguea un objeto, y aquí hay 111 llamadas.
 */
function formatear(args: readonly unknown[]): string {
  return format(...args);
}
