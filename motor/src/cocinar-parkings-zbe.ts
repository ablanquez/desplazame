/**
 * ⭐ LA COCINA DE LOS APARCAMIENTOS PÚBLICOS Y LA ZBE (3/09, punto 12,
 * casilla 2-bis).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  EL CRUCE SE HACE AL COCINAR, NO AL CONTESTAR. Y no es una optimización.
 *
 *  [DOC OTP] los aparcamientos que valen son los *«presentes en el fichero de
 *  entrada al construir el grafo»*: se leen una vez, se resuelven una vez, y
 *  la búsqueda no vuelve a preguntar. Aquí igual — y con más razón, porque lo
 *  que se cruza es geometría municipal contra geometría municipal y ninguna de
 *  las dos cambia entre dos peticiones.
 *
 *  Así que este fichero se ejecuta **a mano**, escribe `app/data/
 *  parkings-zbe.json`, y el motor solo lo lee. Cero consultas en caliente.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── Qué entra y qué sale ────────────────────────────────────────────────────
 *
 * Entra el **directorio del catálogo 55** del Ayuntamiento —«Aparcamientos
 * Públicos», 41 fichas con nombre, horario y punto en WGS84— y la **capa de la
 * ZBE** (§ 1.30), la misma que marca las aristas del coche. Sale una lista con
 * las dos banderas calculadas: `dentroDeFase1` y `dentroDeFase2`.
 *
 * El punto-en-polígono es `dentroDeLaZbe` de `red-coche.ts` — **el mismo que
 * marca las aristas**. Dos algoritmos para la misma pregunta acabarían dando
 * dos respuestas distintas en el borde, y el borde es justo donde importa.
 *
 * ── Determinista, y por eso NO LLEVA RELOJ ──────────────────────────────────
 *
 * Es la ley del punto 10 y la juez 8 de `red-coche.spec.ts`: dos cocinas, el
 * mismo fichero. Ordenado por `id`, con las claves siempre en el mismo orden y
 * **sin fecha de generación dentro** — una fecha ahí haría que el mismo dato
 * diera dos ficheros distintos. Cuándo se cocinó lo dice su ficha del notices,
 * que es donde se mira la procedencia.
 *
 * ⚠️ **Lo que este fichero NO sabe.** El catálogo 55 no dice si un aparcamiento
 *    tiene «sistema de control de acceso conectado», que es la condición que
 *    pone la norma (§ 1.32). Sella sus filas en **2013-07-08**: dice DÓNDE
 *    están, no que sigan abiertos ni que estén conectados. Eso no se rellena.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dentroDeLaZbe } from './red-coche.ts';

/** Una ficha del directorio del catálogo 55, con lo poco que se le pide. */
interface FilaDelDirectorio {
  readonly id: number;
  readonly title?: string;
  readonly horario?: string;
  readonly geometry?: { readonly type?: string; readonly coordinates?: readonly number[] };
}

export interface DirectorioCrudo {
  readonly totalCount?: number;
  readonly result?: readonly FilaDelDirectorio[];
}

/** La capa de la ZBE, tal y como la sirve el WFS municipal. */
export interface ZbeCruda {
  readonly features: readonly {
    readonly properties: Record<string, string>;
    readonly geometry: { readonly coordinates: unknown };
  }[];
}

/** Un aparcamiento público ya cruzado con las dos fases. */
export interface ParkingCocinado {
  readonly id: number;
  readonly nombre: string;
  readonly lon: number;
  readonly lat: number;
  /** Tal cual lo publica el catálogo. `null` si esa ficha no lo trae. */
  readonly horario: string | null;
  readonly dentroDeFase1: boolean;
  readonly dentroDeFase2: boolean;
}

export interface ParkingsZbe {
  /** De dónde salió el directorio, para que la procedencia viaje con el dato. */
  readonly fuente: string;
  /** Y con qué capa se cruzó. */
  readonly zbe: string;
  readonly parkings: readonly ParkingCocinado[];
}

export const FUENTE_DEL_DIRECTORIO =
  'https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/equipamiento/' +
  'aparcamiento-publico.json?srsname=wgs84&start=0&rows=500';

export const FICHERO_DE_LA_ZBE = '2026-09-02_wfs_movilidad-MU1_ZBE.json';

/** El polígono de una fase, o `[]` si esa fase no está en la capa. */
function poligonosDeLaFase(
  zbe: ZbeCruda,
  fase: string,
): readonly (readonly (readonly (readonly number[])[])[])[] {
  const cual = zbe.features.find((f) => f.properties['fase'] === fase);
  return (cual?.geometry.coordinates ?? []) as readonly (readonly (readonly (readonly number[])[])[])[];
}

/**
 * ⭐ EL CRUCE. Una pasada por el directorio, dos preguntas por ficha.
 *
 * Las fichas sin punto **no entran**: un aparcamiento sin coordenada no se
 * puede cruzar con un polígono, y meterlo con `false` en las dos banderas sería
 * decir que está fuera cuando lo que pasa es que no se sabe.
 */
export function cocinarParkingsZbe(crudo: DirectorioCrudo, zbe: ZbeCruda): ParkingsZbe {
  const fase1 = poligonosDeLaFase(zbe, 'FASE 1');
  const fase2 = poligonosDeLaFase(zbe, 'FASE 2');

  const parkings: ParkingCocinado[] = [];
  for (const fila of crudo.result ?? []) {
    const punto = fila.geometry?.coordinates;
    if (!punto || punto.length < 2) {
      continue;
    }
    const lon = punto[0]!;
    const lat = punto[1]!;
    parkings.push({
      id: fila.id,
      nombre: (fila.title ?? '').trim(),
      lon,
      lat,
      horario: fila.horario === undefined ? null : fila.horario,
      dentroDeFase1: dentroDeLaZbe(lon, lat, fase1),
      dentroDeFase2: dentroDeLaZbe(lon, lat, fase2),
    });
  }
  // Por `id`, que es la única clave estable del catálogo: el orden en que el
  // servicio devuelve las filas no lo es.
  parkings.sort((a, b) => a.id - b.id);

  return { fuente: FUENTE_DEL_DIRECTORIO, zbe: FICHERO_DE_LA_ZBE, parkings };
}

/** El fichero, escrito siempre igual: una ficha por línea y salto de línea final. */
export function comoSeGuarda(cocinado: ParkingsZbe): string {
  const filas = cocinado.parkings.map((p) => `  ${JSON.stringify(p)}`);
  return (
    '{\n' +
    `  "fuente": ${JSON.stringify(cocinado.fuente)},\n` +
    `  "zbe": ${JSON.stringify(cocinado.zbe)},\n` +
    '  "parkings": [\n' +
    filas.join(',\n') +
    '\n  ]\n}\n'
  );
}

const DESTINO = fileURLToPath(new URL('../../app/data/parkings-zbe.json', import.meta.url));
const ZBE = fileURLToPath(new URL(`../../app/data/${FICHERO_DE_LA_ZBE}`, import.meta.url));

/**
 * Ejecutado a mano: `node src/cocinar-parkings-zbe.ts <directorio-crudo.json>`.
 *
 * El crudo NO vive en el repo — es una descarga, y aquí solo entra dato
 * declarado con ficha. Se baja de `FUENTE_DEL_DIRECTORIO` y se pasa por ruta.
 */
function main(argv: readonly string[]): void {
  const crudo = argv[2];
  if (!crudo) {
    console.error('uso: node src/cocinar-parkings-zbe.ts <directorio-crudo.json>');
    console.error(`     el crudo se baja de ${FUENTE_DEL_DIRECTORIO}`);
    process.exitCode = 1;
    return;
  }
  const cocinado = cocinarParkingsZbe(
    JSON.parse(readFileSync(crudo, 'utf8')) as DirectorioCrudo,
    JSON.parse(readFileSync(ZBE, 'utf8')) as ZbeCruda,
  );
  writeFileSync(DESTINO, comoSeGuarda(cocinado));
  const enF1 = cocinado.parkings.filter((p) => p.dentroDeFase1).length;
  const soloF2 = cocinado.parkings.filter((p) => !p.dentroDeFase1 && p.dentroDeFase2).length;
  console.log(
    `${cocinado.parkings.length} aparcamientos · ${enF1} en la fase 1 · ${soloF2} solo en la 2 · ` +
      `${cocinado.parkings.length - enF1 - soloF2} fuera`,
  );
  console.log(`escrito ${DESTINO}`);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv);
}
