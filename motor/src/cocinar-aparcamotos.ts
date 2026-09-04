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
   * ⚠️ **6 de los 2.146 lo traen vacío**, y § 1.10 los declara: son los mismos
   *    que llevan los 2 códigos de vía huérfanos. Aquí quedan como `""` y el
   *    motor los nombra «el aparcamiento de motos», sin calle.
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
    aparcamotos.push({
      id: rasgo.id,
      via: (rasgo.properties.Nombre_calle ?? '').trim(),
      portal: (rasgo.properties.Portal ?? '').trim(),
      plazas: rasgo.properties.Numero_plazas,
      lon: punto[0]!,
      lat: punto[1]!,
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
  console.log(
    `${cocinado.aparcamotos.length} aparcamotos · ${plazas} plazas · ` +
      `${sinVia} sin nombre de calle · de ${capa.features?.length ?? 0} rasgos`,
  );
  console.log(`escrito ${DESTINO}`);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
