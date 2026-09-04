/**
 * ⭐ LOS APARCAMOTOS, COCINADOS DE LA SEDE (4/09, punto 13 casilla 1).
 *
 * Donde se deja la moto. No rutea nada —eso es `viaje-moto.ts`—: coge el
 * directorio de la sede electrónica y lo deja en un fichero pequeño, ordenado y
 * determinista, con lo único que el motor necesita para elegir sitio.
 *
 * ── Por qué la SEDE y no el WFS, y qué cuesta ───────────────────────────────
 *
 * El Ayuntamiento publica los aparcamotos **por dos puertas que no coinciden**,
 * y § 1.10 ya lo midió el 18/08: el WFS `movilidad:MU2_motos` trae **2.146**
 * soportes y 11.715 plazas, y este directorio de la sede **2.115** y 11.543.
 * Aquella ficha se quedó con el WFS. **Esta casilla cambia de puerta**, por
 * decisión de este encargo, y la razón declarada es la frescura: la sede lleva
 * `Last-Modified` y un `lastUpdated` por registro, y el WFS no publica ninguna
 * marca temporal —§ 1.10 lo dice: *«Frescura: NO CONSTA»*—.
 *
 * ⚠️ **Y el cambio de puerta cuesta 32 soportes, medidos el 4/09.** El cruce por
 *    vecino más próximo vuelve a dar lo mismo que el 18/08: 2.114 casan a menos
 *    de 20 m, **32 están solo en el WFS**, **1 solo en la sede** (`MANUEL
 *    LASALA, F 44`, id 1198) y 7 aparecen movidos entre 1,2 y 14,9 m. Así que
 *    este fichero **no ofrece** esos 32 sitios a nadie. Va dicho aquí y en la
 *    ficha, no escondido: es el precio de la puerta que se ha elegido.
 *
 * ⚠️ **Y `lastUpdated` NO es cuándo cambió el soporte.** Medido el 4/09: los
 *    2.115 registros llevan una marca del **3/09 entre las 23:13:30 y las
 *    23:15:16** —106 segundos para el catálogo entero, 107 valores distintos—.
 *    Eso es el sello de un volcado nocturno de la tabla, no el historial de cada
 *    plaza. Se guarda porque es lo que el origen da y porque dice cuándo se
 *    republicó; **no se puede leer como «este aparcamoto se tocó ayer»**.
 *
 * ── Determinista, como el cocinado de los parkings ──────────────────────────
 *
 * Mismo dato dentro, mismos bytes fuera: se ordena por `id`, las claves van en
 * orden fijo y **no se mira el reloj**. Un cocinado que se sellara con la hora
 * saldría distinto cada vez y el `git diff` dejaría de servir para ver si el
 * dato ha cambiado.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Un aparcamoto, ya reducido a lo que el motor mira. */
export interface AparcamotoCocinado {
  /** El `id` de la sede, como texto. Es lo que las jueces citan. */
  readonly id: string;
  /**
   * La dirección tal como la sede la escribe: `"CALANDA, 9"` — calle y portal,
   * en mayúsculas y sin tipo de vía. **Va verbatim.** El motor la presenta con
   * `comoSePresenta`, que es el mismo trato que el bordillo del coche recibe
   * para su `direccion`, y no una interpretación nueva.
   */
  readonly via: string;
  readonly plazas: number;
  readonly lon: number;
  readonly lat: number;
  /** ⚠️ Cuándo se volcó la tabla, no cuándo cambió el soporte. Ver la cabecera. */
  readonly lastUpdated: string;
}

export interface AparcamotosCocinados {
  /** De dónde salió, para que la procedencia viaje con el dato. */
  readonly fuente: string;
  readonly aparcamotos: readonly AparcamotoCocinado[];
}

/**
 * ⚠️ **El servicio TOPA EN 500 FILAS**, aunque se le pidan 3.000: medido el
 *    4/09, `rows=3000` contesta `"rows":500`. Así que se baja por páginas y el
 *    cocinado recibe las cinco.
 */
export const FUENTE_DE_LOS_APARCAMOTOS =
  'https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/equipamiento/' +
  'aparcamiento-moto.json?srsname=wgs84&start=<N>&rows=500';

/** Lo que la sede manda, de lo que aquí se mira. */
export interface PaginaDeLaSede {
  readonly totalCount?: number;
  readonly result?: readonly {
    readonly id?: number;
    readonly description?: string | null;
    readonly plazas?: number | null;
    readonly lastUpdated?: string | null;
    readonly geometry?: { readonly coordinates?: readonly number[] };
  }[];
}

/**
 * ⭐ EL COCINADO. Una pasada por las páginas, y lo que no tiene sitio no entra.
 *
 * Una ficha sin coordenada no es un sitio donde dejar la moto, y una sin plazas
 * declaradas tampoco se inventa. Medido el 4/09: **ninguna de las 2.115** cae
 * por ninguno de los dos motivos, y por eso el filtro se ve aquí en vez de
 * darse por supuesto.
 */
export function cocinarAparcamotos(
  paginas: readonly PaginaDeLaSede[],
): AparcamotosCocinados {
  const aparcamotos: AparcamotoCocinado[] = [];
  const vistos = new Set<number>();
  for (const pagina of paginas) {
    for (const fila of pagina.result ?? []) {
      const punto = fila.geometry?.coordinates;
      if (fila.id === undefined || !punto || punto.length < 2) {
        continue;
      }
      if (typeof fila.plazas !== 'number') {
        continue;
      }
      // Las páginas se piden por `start`, y pedirlas dos veces es un error de
      // quien llama, no un aparcamoto duplicado. Se queda la primera.
      if (vistos.has(fila.id)) {
        continue;
      }
      vistos.add(fila.id);
      aparcamotos.push({
        id: String(fila.id),
        via: (fila.description ?? '').trim(),
        plazas: fila.plazas,
        lon: punto[0]!,
        lat: punto[1]!,
        lastUpdated: (fila.lastUpdated ?? '').trim(),
      });
    }
  }
  // Por `id` NUMÉRICO: el de la sede es un id de tabla con huecos, y ordenarlo
  // como texto pondría el 1000 antes que el 2.
  aparcamotos.sort((a, b) => Number(a.id) - Number(b.id));
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

/**
 * Ejecutado a mano: `node src/cocinar-aparcamotos.ts <p0.json> <p500.json> …`.
 *
 * Las páginas crudas NO viven en el repo —son una descarga, y aquí solo entra
 * dato declarado con ficha—: se bajan de `FUENTE_DE_LOS_APARCAMOTOS` cambiando
 * `<N>` por 0, 500, 1000, 1500 y 2000, y se pasan por ruta.
 */
function main(argv: readonly string[]): void {
  const rutas = argv.slice(2);
  if (rutas.length === 0) {
    console.error('uso: node src/cocinar-aparcamotos.ts <pagina0.json> <pagina500.json> …');
    console.error(`     las páginas se bajan de ${FUENTE_DE_LOS_APARCAMOTOS}`);
    process.exitCode = 1;
    return;
  }
  const paginas = rutas.map((r) => JSON.parse(readFileSync(r, 'utf8')) as PaginaDeLaSede);
  const declarado = paginas[0]?.totalCount;
  const cocinado = cocinarAparcamotos(paginas);
  writeFileSync(DESTINO, comoSeGuarda(cocinado));
  const plazas = cocinado.aparcamotos.reduce((suma, a) => suma + a.plazas, 0);
  console.log(
    `${cocinado.aparcamotos.length} aparcamotos · ${plazas} plazas · ` +
      `la sede declara ${declarado ?? 'NO CONSTA'}`,
  );
  if (declarado !== undefined && declarado !== cocinado.aparcamotos.length) {
    console.log('⚠️ el total declarado NO coincide con lo cocinado: faltan páginas o hay filas sin sitio');
  }
  console.log(`escrito ${DESTINO}`);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv);
}
