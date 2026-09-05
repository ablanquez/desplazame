/**
 * ⭐ LOS APARCAMOTOS, COCINADOS DEL WFS (4/09, punto 13 casilla 1).
 *
 * Donde se deja la moto. No rutea nada —eso es `viaje-moto.ts`—: coge la capa
 * municipal que ya está en el repositorio con su ficha (§ 1.10) y la deja en un
 * fichero pequeño, ordenado y determinista, con lo único que el motor mira.
 *
 * ── Manda el WFS, y es doctrina de procedencia ──────────────────────────────
 *
 * El Ayuntamiento publica los aparcamotos **por dos puertas que no coinciden**:
 * la capa `movilidad:MU2_motos` del GeoServer de IDEZar —**2.146** soportes y
 * 11.715 plazas— y el directorio de la sede electrónica —**2.115** y 11.543—.
 *
 * Manda la **capa del GIS**, que es donde el dato vive, y no el directorio, que
 * es donde se publica una copia. Es la misma regla que esta casa ya aplicó en
 * § 1.6 con los postes —mandó el `MU3` del WFS— y la que dice que entre una
 * fuente original y una derivada se toma la original.
 *
 * ⚠️ **Y lo medido el 4/09 apunta al mismo sitio.** El directorio de la sede
 *    lleva `Last-Modified` de anoche y un `lastUpdated` por registro, y eso
 *    parece frescura hasta que se miran los números: **los 2.115 registros
 *    llevan una marca del 3/09 entre las 23:13:30 y las 23:15:16** —el catálogo
 *    entero sellado en 106 segundos—. Es el sello de un **volcado nocturno de la
 *    tabla**, no el historial de cada plaza. Y en 17 días **ninguna de las dos
 *    fuentes ha cambiado de contenido**: el WFS servido el 4/09 trae los mismos
 *    2.146 rasgos que la copia del 18/08 —firma idéntica sobre `id`, geometría y
 *    propiedades—, y la sede sigue en 2.115. Así que lo que respira cada noche
 *    en la sede son las marcas de tiempo, no los aparcamotos.
 *
 * El precio de esta puerta está declarado en la ficha: **1 soporte** que la sede
 * tiene y el WFS no.
 *
 * ── ⭐ Y LOS 6 NOMBRES QUE FALTAN, POR CONFLACIÓN DE ATRIBUTOS (4/09) ───────
 *
 * La capa deja **6 rasgos sin `Nombre_calle`**, y el listado de la sede sí los
 * nombra. Desde el 4/09 ese hueco se rellena, y no es un cambio de fuente: es
 * una **conflación de atributos** [OSM wiki: *«combinar fuentes solapadas para
 * retener el dato preciso»*; Hootenanny/NGA: *«mantener la procedencia de
 * geometría y atributos en los rasgos combinados»*, el flujo
 * *Differential-With-Tags* — añadir a un rasgo existente el atributo que le
 * falta, casado uno a uno].
 *
 * **La doctrina de procedencia no se toca**, y conviene ver por qué no:
 *
 *   · **Quién manda sigue siendo el WFS.** El catálogo son sus 2.146 rasgos,
 *     con su geometría, sus plazas y sus portales. La sede no añade ni un
 *     soporte —el que solo ella tiene sigue fuera— ni corrige ninguno.
 *   · **Lo que entra es UN atributo, donde FALTA.** Seis nombres de calle en
 *     seis registros que no tienen ninguno. Rellenar «todo lo que case» sería
 *     otra cosa: la sede casa con 2.114 de los 2.146, y aceptar sus nombres en
 *     todos sería sustituir el catálogo por el de la otra puerta sin decirlo.
 *   · **Y se dice quién lo trajo**, registro a registro: `nombreDe: 'sede'`.
 *     Una conflación sin procedencia es exactamente la mezcla silenciosa que
 *     la regla de casa prohíbe; con ella, cualquiera puede contar cuántos
 *     campos no son del origen y de dónde salieron.
 *
 * El casado es **uno a uno y a milímetros** — ver `CONFLADOS`.
 *
 * ── Lo que NO entra en el cocinado, y por qué ───────────────────────────────
 *
 *   · **`Codigo_calle`** — el enganche al callejero de § 1.3, que casa 2.140 de
 *     los 2.146. Hoy no hace falta: el nombre de la vía viene en la misma fila.
 *   · **`Fecha_instalacion`** — solo en 616 de los 2.146, y con **una fecha
 *     imposible** que § 1.10 declara (`0203-10-20` en AV TENOR FLETA 134).
 *     Guardar una columna rota al 71 % vacía es invitar a que alguien ordene
 *     por ella.
 *   · **`Poligono`** — en 33 de 2.146, y es el distrito, no un dato del sitio.
 *
 * ⚠️ **Y con el WFS se pierde la marca temporal por registro.** § 1.10 lo dice
 *    literal: *«Frescura: NO CONSTA»* — la capa no publica cuándo se actualizó.
 *    Lo que se pierde es una marca que, medida, decía cuándo se volcó la tabla y
 *    no cuándo cambió la plaza; pero se pierde, y va dicho.
 *
 * ── Determinista, como el cocinado de los parkings ──────────────────────────
 *
 * Mismo dato dentro, mismos bytes fuera: se ordena por el número del `id`, las
 * claves van en orden fijo y **no se mira el reloj**. Un cocinado que se sellara
 * con la hora saldría distinto cada vez y el `git diff` dejaría de servir para
 * ver si el dato ha cambiado.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Un aparcamoto, ya reducido a lo que el motor mira. */
export interface AparcamotoCocinado {
  /** El `id` del WFS, tal cual: `"MU2_motos.1"`. Es lo que las jueces citan. */
  readonly id: string;
  /**
   * `Nombre_calle` **verbatim**, en mayúsculas y sin el tipo de vía: `"PREDICADORES"`.
   *
   * ⚠️ **6 de los 2.146 lo traen vacío en el origen**, y § 1.10 los declara: son
   *    los mismos que llevan los 2 códigos de vía huérfanos. Desde el 4/09 esos
   *    seis salen con el nombre que da la sede, por conflación de atributos, y
   *    **lo dicen en `nombreDe`**. Ver `CONFLADOS`.
   *
   * El `Tipo_via` (`CL`, `AV`, `PS`…) **no se guarda**: expandir la abreviatura
   * sería inventarse una tabla que este repositorio no tiene, y el nombre solo
   * ya identifica la calle en la frase.
   */
  readonly via: string;
  /** `Portal` verbatim: `"28"`, `"s/n"`, `"88 DP"`. Vacío en 8 de los 2.146. */
  readonly portal: string;
  readonly plazas: number;
  readonly lon: number;
  readonly lat: number;
  /**
   * ⭐ DE DÓNDE SALIÓ EL NOMBRE DE LA VÍA, **cuando no es del WFS**.
   *
   * Ausente en 2.140 de los 2.146 —ahí el nombre es del origen y no hay nada
   * que declarar— y `'sede'` en los 6 conflados. Es la mitad que convierte
   * esto en conflación declarada en vez de una mezcla silenciosa de dos
   * puertas [Hootenanny/NGA: *«mantener la procedencia … en los rasgos
   * combinados»*].
   *
   * ⚠️ **Va en el registro y no en una nota aparte** a propósito: el dato
   *    viaja al motor, y la procedencia tiene que viajar con él. Una tabla en
   *    el notices se queda en el repositorio; esto llega hasta donde llegue el
   *    aparcamoto.
   */
  readonly nombreDe?: 'sede';
}

/** Un nombre que la sede da y el WFS no, con lo que hace falta para casarlo. */
export interface Conflado {
  /** El rasgo del WFS al que le falta el nombre. */
  readonly id: string;
  /** El nombre que la sede le da, **verbatim** y sin el portal. */
  readonly via: string;
  /** El portal que la sede da. **Tiene que coincidir con el del WFS**. */
  readonly portal: string;
  /** Las plazas que la sede declara. **También tienen que coincidir**. */
  readonly plazas: number;
  /** La coordenada de la SEDE, contra la que se mide el casado. */
  readonly lon: number;
  readonly lat: number;
}

/**
 * ⭐ LOS 6 NOMBRES QUE ENTRAN DE LA SEDE, uno a uno y con qué casarlos.
 *
 * Medido el 4/09 contra el listado de la sede (2.115 registros, bajados el
 * mismo día): los seis rasgos que el WFS deja sin `Nombre_calle` tienen cada
 * uno **un registro de la sede a menos de 7 milímetros**, y no uno cualquiera:
 * el portal y las plazas coinciden también, carácter a carácter.
 *
 * | WFS | sede | distancia | plazas | portal |
 * |---|---|---|---|---|
 * | `MU2_motos.138` | 150 · `DE RANILLAS, S/N` | 0,0033 m | 15 | `S/N` |
 * | `MU2_motos.171` | 185 · `DE RANILLAS, S/N` | 0,0041 m | 20 | `S/N` |
 * | `MU2_motos.172` | 186 · `DE RANILLAS, S/N` | 0,0033 m | 20 | `S/N` |
 * | `MU2_motos.173` | 187 · `DE RANILLAS, S/N` | 0,0019 m | 20 | `S/N` |
 * | `MU2_motos.222` | 266 · `DE RANILLAS, S/N` | 0,0065 m | 8 | `S/N` |
 * | `MU2_motos.1483` | 1655 · `GRUPO ARZOBISPO DOMENECH, 23` | 0,0047 m | 4 | `23` |
 *
 * ⚠️ **El portal NO se rellena: ya lo trae el WFS**, y es la corroboración del
 *    casado. Los seis tienen `Portal` en el origen —cinco `S/N` y uno `23`— y
 *    es exactamente el que la sede escribe tras la coma. Lo único que falta y
 *    lo único que entra es **el nombre de la calle**.
 *
 * ⚠️ **La tabla vive aquí y no en un fichero de datos** porque no es un dato:
 *    es el RESULTADO de un cruce, con seis filas, y escribirlo es lo que lo
 *    hace auditable. Meter el listado entero de la sede en `app/data/` para
 *    sacar seis nombres sería traerse la puerta que la doctrina descartó, y
 *    encima obligaría al cocinado a leer dos catálogos para tapar seis huecos.
 *
 * ⚠️ Y el casado **se comprueba en cada cocinado**, no se da por hecho. Si el
 *    WFS mueve uno de los seis, le cambia el portal o le cambia las plazas, el
 *    relleno **se apaga solo** para ése: vale más un sitio sin nombre que un
 *    sitio con el nombre de otro.
 */
export const CONFLADOS: readonly Conflado[] = [
  { id: 'MU2_motos.138', via: 'DE RANILLAS', portal: 'S/N', plazas: 15, lon: -0.8823684219244057, lat: 41.65932238688491 },
  { id: 'MU2_motos.171', via: 'DE RANILLAS', portal: 'S/N', plazas: 20, lon: -0.8967995728328523, lat: 41.67032589732411 },
  { id: 'MU2_motos.172', via: 'DE RANILLAS', portal: 'S/N', plazas: 20, lon: -0.8970603652236163, lat: 41.67029599640652 },
  { id: 'MU2_motos.173', via: 'DE RANILLAS', portal: 'S/N', plazas: 20, lon: -0.8969785087823561, lat: 41.670054205346126 },
  { id: 'MU2_motos.222', via: 'DE RANILLAS', portal: 'S/N', plazas: 8, lon: -0.8981100664511863, lat: 41.67247811008692 },
  { id: 'MU2_motos.1483', via: 'GRUPO ARZOBISPO DOMENECH', portal: '23', plazas: 4, lon: -0.8881610666709993, lat: 41.64359613768448 },
];

/**
 * ⭐ CUÁNTO SE ACEPTA DE SEPARACIÓN AL CASAR: **un metro**.
 *
 * Los seis casan a milímetros —de 0,0019 a 0,0065 m—, así que esto no es una
 * tolerancia: es holgura frente al redondeo de coordenadas, con tres órdenes
 * de magnitud de margen. Un aparcamoto que se moviera de verdad se saldría de
 * aquí y perdería su nombre, que es lo que tiene que pasar.
 */
export const CASADO_A_LO_SUMO_M = 1;

/** Metros entre dos puntos, en el plano local. Basta para casar soportes. */
function metrosEntre(ax: number, ay: number, bx: number, by: number): number {
  const dy = (ay - by) * 111320;
  const dx = (ax - bx) * 111320 * Math.cos(((ay + by) / 2) * (Math.PI / 180));
  return Math.hypot(dx, dy);
}

export interface AparcamotosCocinados {
  /** De dónde salió, para que la procedencia viaje con el dato. */
  readonly fuente: string;
  readonly aparcamotos: readonly AparcamotoCocinado[];
}

/** El fichero de § 1.10, que ya está en el repositorio con su sha256. */
export const FICHERO_DEL_WFS = '2026-08-18_wfs_movilidad-MU2_motos.json';

export const FUENTE_DE_LOS_APARCAMOTOS =
  'https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0' +
  '&request=GetFeature&typeNames=movilidad:MU2_motos&outputFormat=application/json' +
  '&srsName=EPSG:4326';

/** Lo que el WFS manda, de lo que aquí se mira. */
export interface RasgoDelWfs {
  readonly id?: string;
  readonly geometry?: { readonly coordinates?: readonly number[] };
  readonly properties?: {
    readonly Nombre_calle?: string | null;
    readonly Portal?: string | null;
    readonly Numero_plazas?: number | null;
  };
}

export interface CapaDeMotos {
  readonly features?: readonly RasgoDelWfs[];
}

/** El número del `id` del WFS: `"MU2_motos.1483"` → 1483. Para ordenar. */
function numeroDelId(id: string): number {
  const n = Number(id.slice(id.lastIndexOf('.') + 1));
  return Number.isFinite(n) ? n : 0;
}

/**
 * ⭐ EL COCINADO. Una pasada por la capa, y lo que no tiene sitio no entra.
 *
 * Un rasgo sin coordenada no es un sitio donde dejar la moto, y uno sin plazas
 * declaradas tampoco se inventa. Medido el 4/09: **ninguno de los 2.146** cae
 * por ninguno de los dos motivos, y por eso el filtro se ve aquí en vez de darse
 * por supuesto.
 */
export function cocinarAparcamotos(capa: CapaDeMotos): AparcamotosCocinados {
  const aparcamotos: AparcamotoCocinado[] = [];
  const vistos = new Set<string>();
  for (const rasgo of capa.features ?? []) {
    const punto = rasgo.geometry?.coordinates;
    if (rasgo.id === undefined || !punto || punto.length < 2) {
      continue;
    }
    if (typeof rasgo.properties?.Numero_plazas !== 'number') {
      continue;
    }
    if (vistos.has(rasgo.id)) {
      continue;
    }
    vistos.add(rasgo.id);
    const lon = punto[0]!;
    const lat = punto[1]!;
    const plazas = rasgo.properties.Numero_plazas;
    const portal = (rasgo.properties.Portal ?? '').trim();
    const suyo = (rasgo.properties.Nombre_calle ?? '').trim();
    // ⭐ LA CONFLACIÓN, y **solo donde falta el nombre**. Ver `CONFLADOS`: el
    //    rasgo tiene que estar a 1 m o menos del punto de la sede y coincidirle
    //    el portal y las plazas. Con cualquiera de las tres cosas distinta, no
    //    se rellena: vale más un sitio sin nombre que un sitio mal nombrado.
    const deLaSede =
      suyo === ''
        ? CONFLADOS.find(
            (c) =>
              c.id === rasgo.id &&
              c.portal === portal &&
              c.plazas === plazas &&
              metrosEntre(c.lon, c.lat, lon, lat) <= CASADO_A_LO_SUMO_M,
          )
        : undefined;
    aparcamotos.push({
      id: rasgo.id,
      via: deLaSede ? deLaSede.via : suyo,
      portal,
      plazas,
      lon,
      lat,
      // La marca solo existe donde hay algo que declarar: 6 de 2.146.
      ...(deLaSede ? { nombreDe: 'sede' as const } : {}),
    });
  }
  // Por el NÚMERO del id, no por su texto: como texto, `MU2_motos.10` iría antes
  // que `MU2_motos.9`.
  aparcamotos.sort((a, b) => numeroDelId(a.id) - numeroDelId(b.id));
  return { fuente: FUENTE_DE_LOS_APARCAMOTOS, aparcamotos };
}

/** El fichero, escrito siempre igual: una ficha por línea y salto de línea final. */
export function comoSeGuarda(cocinado: AparcamotosCocinados): string {
  const filas = cocinado.aparcamotos.map((a) => `  ${JSON.stringify(a)}`);
  return (
    '{\n' +
    `  "fuente": ${JSON.stringify(cocinado.fuente)},\n` +
    '  "aparcamotos": [\n' +
    filas.join(',\n') +
    '\n  ]\n}\n'
  );
}

const DESTINO = fileURLToPath(new URL('../../app/data/aparcamotos.json', import.meta.url));
const ORIGEN = fileURLToPath(new URL(`../../app/data/${FICHERO_DEL_WFS}`, import.meta.url));

/**
 * Ejecutado a mano: `node src/cocinar-aparcamotos.ts`.
 *
 * **No baja nada**: la capa ya está en el repositorio con su ficha y su sha256
 * (§ 1.10), así que el cocinado se puede repetir sin red y da lo mismo siempre.
 */
function main(): void {
  const capa = JSON.parse(readFileSync(ORIGEN, 'utf8')) as CapaDeMotos;
  const cocinado = cocinarAparcamotos(capa);
  writeFileSync(DESTINO, comoSeGuarda(cocinado));
  const plazas = cocinado.aparcamotos.reduce((suma, a) => suma + a.plazas, 0);
  const sinVia = cocinado.aparcamotos.filter((a) => a.via === '').length;
  const conflados = cocinado.aparcamotos.filter((a) => a.nombreDe !== undefined).length;
  console.log(
    `${cocinado.aparcamotos.length} aparcamotos · ${plazas} plazas · ` +
      `${sinVia} sin nombre de calle · ${conflados} con el nombre de la sede · ` +
      `de ${capa.features?.length ?? 0} rasgos`,
  );
  console.log(`escrito ${DESTINO}`);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
