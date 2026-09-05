/**
 * ⭐ LOS APARCAMOTOS, LEÍDOS UNA VEZ (4/09, punto 13 casilla 1).
 *
 * Aquí no se cocina nada: la capa municipal ya está reducida y ordenada
 * —`cocinar-aparcamotos.ts`, y su fichero en `app/data/aparcamotos.json`—. Esto
 * solo lo carga la primera vez que hace falta y lo deja en memoria, como el
 * resto del dato del motor.
 *
 * ⚠️ **La moto NO elige tipo.** El coche pregunta dónde quiere dejarlo —azul,
 *    naranja, PMR o gratuito— porque en calzada hay cuatro montones distintos
 *    con cuatro reglas distintas. La moto tiene uno: **el aparcamoto**, y en él
 *    no se paga [Reglamento Municipal del SER, `zaragoza.es/sede/servicio/
 *    normativa/13291`: las motocicletas están exentas de la tasa]. Así que no
 *    hay pregunta que hacer ni parámetro que leer — ver `viaje-moto.ts`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { metrosEntre } from './cercano.ts';
import type { AparcamotoCocinado, AparcamotosCocinados } from './cocinar-aparcamotos.ts';

export type { AparcamotoCocinado } from './cocinar-aparcamotos.ts';

const FICHERO = fileURLToPath(new URL('../../app/data/aparcamotos.json', import.meta.url));

let cargados: readonly AparcamotoCocinado[] | null = null;

/** Los 2.146 de la capa, ordenados por su `id`. Se lee una sola vez. */
export function losAparcamotos(): readonly AparcamotoCocinado[] {
  if (cargados === null) {
    const crudo = JSON.parse(readFileSync(FICHERO, 'utf8')) as AparcamotosCocinados;
    cargados = crudo.aparcamotos;
  }
  return cargados;
}

/** Un aparcamoto candidato, con lo lejos que quedó del punto que se preguntó. */
export interface AparcamotoCerca extends AparcamotoCocinado {
  /**
   * Metros en línea recta al punto que se pidió. **Solo para podar y para poder
   * declararlo**: lo que decide es el coste, no esto. Es exactamente el papel
   * que la recta tiene en `dondeAparcarCerca` para el coche.
   */
  readonly enRecta: number;
}

/**
 * ⭐ LOS `cuantos` APARCAMOTOS MÁS CERCANOS EN RECTA a un punto.
 *
 * ⚠️ **La recta solo PODA, y el número es de RENDIMIENTO.** No es un radio: no
 *    hay ninguna distancia a partir de la cual un aparcamoto «no existe». Quien
 *    elige es el coste —conducir más andar por su peso—, y esta lista solo evita
 *    hacer ese cálculo 2.146 veces. Mismo papel y misma razón que los 40
 *    candidatos del coche y que los 40 postes del bus.
 */
export function aparcamotosCerca(
  lon: number,
  lat: number,
  cuantos: number,
): readonly AparcamotoCerca[] {
  return losAparcamotos()
    .map((a) => ({ ...a, enRecta: metrosEntre(lat, lon, a.lat, a.lon) }))
    .sort((a, b) => a.enRecta - b.enRecta)
    .slice(0, cuantos);
}
