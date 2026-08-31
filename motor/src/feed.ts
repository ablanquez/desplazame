/**
 * ⭐ EL FEED GTFS QUE SE SIRVE: cuál es, qué versión trae y cuánto le queda.
 *
 * ── El relevo: una semilla fechada y un vivo que la releva ──────────────────
 *
 * En `app/data/` conviven dos ficheros, y **no son lo mismo**:
 *
 *   · **La SEMILLA** — `2026-08-10_nap_gtfs-ficha1176.zip`. Está en git, en el
 *     manifiesto (`datapackage.json`) con sus bytes y su `sha256` **verificado
 *     sobre un clon**, y con su ficha en el notices. **No se toca nunca.** Es lo
 *     que hace que un clon limpio arranque sin pedirle nada a nadie — la ley de
 *     casa, ya probada.
 *   · **EL VIVO** — `nap_gtfs-ficha1176.vivo.zip`. Lo escribe el cron nocturno,
 *     está **ignorado por git** y **fuera del manifiesto**, y **releva** a la
 *     semilla en cuanto existe.
 *
 * ⚠️ **Por qué relevo y no sobrescribir la semilla**, que es lo que se pensó
 * primero: la semilla es un recurso **declarado y con guardián**. Dos pruebas
 * vivas —`manifiesto.spec.ts` en la interfaz y `datos-de-la-rueda.spec.ts` en el
 * motor— recalculan su `sha256` y sus bytes en cada suite. Sobrescribirla las
 * pondría rojas la primera noche que el cron corriera, y dejaría cinco campos
 * del manifiesto mintiendo (`bytes`, `hash`, `caducaEl`, `modified`,
 * `descargadoEl`). Medido antes de escribir esto, y decidido por Antonio el
 * 31/08. Con el relevo, el manifiesto sigue diciendo la verdad y el dato sigue
 * siendo el de hoy.
 *
 * [GTFS Best Practices] *«el dato se publica en iteraciones de modo que un único
 * fichero en una ubicación estable contiene siempre la última descripción
 * oficial del servicio»*. La ubicación estable es el vivo; la semilla es el
 * suelo del que se parte.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

/** La semilla: en git, en el manifiesto, jamás tocada por el cron. */
export const SEMILLA = fileURLToPath(
  new URL('../../app/data/2026-08-10_nap_gtfs-ficha1176.zip', import.meta.url),
);

/** El vivo: lo escribe el cron, ignorado por git y fuera del manifiesto. */
export const VIVO = fileURLToPath(
  new URL('../../app/data/nap_gtfs-ficha1176.vivo.zip', import.meta.url),
);

/** El registro de lo que el vivo es. Junto a él, y también ignorado. */
export const REGISTRO = fileURLToPath(
  new URL('../../app/data/nap_gtfs-ficha1176.registro.json', import.meta.url),
);

/**
 * ⭐ EL UMBRAL, y es del validador canónico, no nuestro.
 *
 * [MobilityData GTFS Validator] cubrir **≥30 días** es lo ideal; **caducar en
 * ≤7 días es AVISO**. Aquí solo se codifica el aviso: los 30 son una
 * recomendación sobre quien publica, no una regla que podamos comprobar sobre
 * un feed ya publicado.
 */
export const DIAS_DE_AVISO = 7;

export interface FeedInfo {
  readonly feedVersion: string;
  readonly feedStartDate: string;
  readonly feedEndDate: string;
}

export type EstadoDeCaducidad = 'vigente' | 'aviso' | 'caducado';

/**
 * ⭐ UN LECTOR DE ZIP DE CASA, porque las dependencias son CERO.
 *
 * Lee el directorio central del final del fichero y saca un miembro por su
 * nombre. Soporta los dos métodos que un zip normal usa: `0` (guardado tal
 * cual) y `8` (deflate), que es el de este feed.
 *
 * No pretende ser un descompresor general: pretende sacar `feed_info.txt` de
 * 244 bytes de dentro de 6,6 MB sin traerse una librería para ello.
 */
export function delZip(zip: Buffer, nombre: string): Buffer | null {
  const buscado = Buffer.from(nombre, 'utf8');
  // El fin del directorio central (`PK\x05\x06`) vive en los últimos 22 bytes,
  // más el comentario. Se busca hacia atrás, que es donde está.
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) !== 0x0605_4b50) {
      continue;
    }
    let donde = zip.readUInt32LE(i + 16);
    const cuantos = zip.readUInt16LE(i + 10);
    for (let k = 0; k < cuantos; k++) {
      const largoNombre = zip.readUInt16LE(donde + 28);
      const largoExtra = zip.readUInt16LE(donde + 30);
      const largoComentario = zip.readUInt16LE(donde + 32);
      const suNombre = zip.subarray(donde + 46, donde + 46 + largoNombre);
      if (suNombre.equals(buscado)) {
        const metodo = zip.readUInt16LE(donde + 10);
        const comprimido = zip.readUInt32LE(donde + 20);
        const local = zip.readUInt32LE(donde + 42);
        // La cabecera LOCAL tiene sus propios largos: los del directorio
        // central no valen aquí, y confundirlos desplaza el corte.
        const lNombre = zip.readUInt16LE(local + 26);
        const lExtra = zip.readUInt16LE(local + 28);
        const inicio = local + 30 + lNombre + lExtra;
        const datos = zip.subarray(inicio, inicio + comprimido);
        return metodo === 0 ? Buffer.from(datos) : inflateRawSync(datos);
      }
      donde += 46 + largoNombre + largoExtra + largoComentario;
    }
    return null;
  }
  return null;
}

/**
 * `feed_info.txt` de un zip de GTFS, o `null` si no lo trae.
 *
 * `feed_info.txt` es **opcional** en la referencia, así que su ausencia no es un
 * zip roto: es un feed que no dice su versión. Se devuelve `null` y quien
 * llame decide, en vez de inventarse una cadena vacía que parecería un dato.
 */
export function leerFeedInfo(zip: Buffer): FeedInfo | null {
  const crudo = delZip(zip, 'feed_info.txt');
  if (!crudo) {
    return null;
  }
  const lineas = crudo.toString('utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length > 0);
  if (lineas.length < 2) {
    return null;
  }
  const cabecera = lineas[0]!.split(',').map((c) => c.trim());
  const valores = lineas[1]!.split(',').map((c) => c.trim());
  const campo = (n: string): string => {
    const i = cabecera.indexOf(n);
    return i === -1 ? '' : (valores[i] ?? '');
  };
  return {
    feedVersion: campo('feed_version'),
    feedStartDate: campo('feed_start_date'),
    feedEndDate: campo('feed_end_date'),
  };
}

/**
 * ⭐ CUÁNTOS DÍAS LE QUEDAN AL FEED. Función pura, y el dato de la casilla 4.
 *
 * `fin` viene en el formato de GTFS —`AAAAMMDD`, ocho dígitos— y el día del
 * `feed_end_date` **cuenta como cubierto**: la referencia lo define como «la
 * última fecha para la que el feed da servicio», así que el mismo día quedan 0
 * días y todavía sirve. Un día después, −1: caducado.
 *
 * Se compara a mediodía UTC de las dos fechas para que el cambio de día no
 * dependa de la hora a la que se pregunte ni del horario de verano.
 */
export function diasHastaCaducidad(fin: string, hoy: Date): number {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(fin.trim());
  if (!m) {
    return Number.NaN;
  }
  const final = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  const ahora = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), 12);
  return Math.round((final - ahora) / 86_400_000);
}

/** Vigente, en aviso o caducado, según el umbral del validador. */
export function estadoDeCaducidad(dias: number): EstadoDeCaducidad {
  if (Number.isNaN(dias) || dias < 0) {
    return 'caducado';
  }
  return dias <= DIAS_DE_AVISO ? 'aviso' : 'vigente';
}

export const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

/**
 * ⭐ ESCRITURA ATÓMICA: a un temporal y renombrar, nunca directo sobre el bueno.
 *
 * ⚠️ Es la guarda que ZetaBus aprendió a golpes y aquí se copia entera: esto
 * corre **cada noche**, y un `writeFileSync` interrumpido a media escritura
 * destruiría el único zip que había — justo el respaldo del que depende todo lo
 * demás. Con temporal + `rename`, o está el viejo entero o está el nuevo
 * entero, nunca medio fichero.
 */
export function guardarAtomico(destino: string, bytes: Buffer): void {
  const temporal = `${destino}.${process.pid}.tmp`;
  try {
    writeFileSync(temporal, bytes);
    renameSync(temporal, destino);
  } catch (e) {
    try {
      unlinkSync(temporal);
    } catch {
      // Si ni el temporal se puede borrar, no hay nada mejor que hacer aquí:
      // lo que importa es que el destino no se ha tocado.
    }
    throw e;
  }
}

export interface FeedServido {
  readonly ruta: string;
  readonly esSemilla: boolean;
  readonly bytes: number;
  readonly info: FeedInfo | null;
}

/**
 * ⭐ CUÁL DE LOS DOS SE SIRVE: el vivo si existe y se puede leer; si no, la
 * semilla.
 *
 * ⚠️ Y «si se puede leer» se comprueba de verdad, no por `existsSync`: un vivo
 * a medio escribir o corrupto **no releva a nadie**. Antes de preferirlo hay
 * que poder sacarle su `feed_info`; si no sale, se cae a la semilla y se sigue.
 * Un fichero que existe no es un fichero que sirve.
 */
export function elFeedQueSeSirve(): FeedServido {
  if (existsSync(VIVO)) {
    try {
      const bytes = readFileSync(VIVO);
      const info = leerFeedInfo(bytes);
      if (info) {
        return { ruta: VIVO, esSemilla: false, bytes: bytes.length, info };
      }
    } catch {
      // El vivo no se deja leer. No es motivo para no arrancar: para eso está
      // la semilla, y el log de abajo dirá cuál se está sirviendo.
    }
  }
  const bytes = readFileSync(SEMILLA);
  return { ruta: SEMILLA, esSemilla: true, bytes: bytes.length, info: leerFeedInfo(bytes) };
}

/** Días desde que se escribió un fichero, o `null` si no se puede saber. */
export function edadEnDias(ruta: string, hoy: Date): number | null {
  try {
    return Math.floor((hoy.getTime() - statSync(ruta).mtimeMs) / 86_400_000);
  } catch {
    return null;
  }
}
