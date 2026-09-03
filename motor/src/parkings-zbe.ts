/**
 * ⭐ LOS APARCAMIENTOS PÚBLICOS DE LA ZBE, LEÍDOS UNA VEZ (3/09, punto 12,
 * casilla 2-bis).
 *
 * Aquí no se cruza nada: el cruce con los polígonos ya está hecho y guardado
 * —`cocinar-parkings-zbe.ts`, y su fichero en `app/data/parkings-zbe.json`—.
 * Esto solo lo carga la primera vez que hace falta y lo deja en memoria, como
 * el resto del dato del motor.
 *
 * ── Por qué solo importan cuatro ────────────────────────────────────────────
 *
 * De los 41, **4 caen dentro de la fase 1**, que es la vigente. Los 7 que solo
 * caen dentro de la fase 2 **no se usan**: esa fase no está en vigor, y tratar
 * hoy como restringido lo que no lo está sería inventarse una norma. El día que
 * entre, la bandera ya está en el fichero.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ParkingCocinado, ParkingsZbe } from './cocinar-parkings-zbe.ts';

export type { ParkingCocinado } from './cocinar-parkings-zbe.ts';

const FICHERO = fileURLToPath(new URL('../../app/data/parkings-zbe.json', import.meta.url));

let cargados: readonly ParkingCocinado[] | null = null;

/** Los 41 del catálogo 55, con sus dos banderas. Se lee una sola vez. */
export function losParkingsDeLaZbe(): readonly ParkingCocinado[] {
  if (cargados === null) {
    const crudo = JSON.parse(readFileSync(FICHERO, 'utf8')) as ParkingsZbe;
    cargados = crudo.parkings;
  }
  return cargados;
}

/** Los que están dentro de la **fase 1**, que es la única en vigor. */
export function losParkingsDeLaFase1(): readonly ParkingCocinado[] {
  return losParkingsDeLaZbe().filter((p) => p.dentroDeFase1);
}
