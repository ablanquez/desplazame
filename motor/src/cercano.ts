/**
 * El portal más cercano a un punto: lo que `GET /api/portal-cercano` sirve al
 * botón «Mi ubicación».
 *
 * Es el primer sitio del motor que necesita las DOS cargas a la vez —los
 * portales para las coordenadas, el callejero para poder decir de qué vía es—,
 * y por eso vive en su propio fichero en vez de en cualquiera de los dos.
 *
 * **El umbral no está aquí.** Este módulo contesta cuál es el más cercano y a
 * cuántos metros, aunque el punto esté en Madrid. Quién decide si eso vale es
 * la pantalla, que es donde se le puede explicar al usuario por qué no vale.
 */

import type { PortalCercano, Via } from '@desplazame/tipos';
import type { CallejeroEnMemoria } from './callejero.ts';
import type { PortalesEnMemoria } from './portales.ts';

/**
 * Radio medio de la Tierra en metros — el valor de la IUGG para el radio
 * medio aritmético, que es el que la fórmula del haversine pide cuando se
 * quiere una distancia y no una precisión geodésica.
 */
const RADIO_TIERRA_M = 6371008.8;

const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

/**
 * Distancia en línea recta sobre la esfera, en metros.
 *
 * Haversine, no Vincenty: para distancias urbanas de unos cientos de metros el
 * error de tomar la Tierra como esfera está muy por debajo del error del propio
 * GPS, y aquí lo que se compara son portales entre sí — el que gane, ganaría
 * igual con cualquiera de las dos fórmulas.
 */
export function metrosEntre(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const dLat = aRadianes(latB - latA);
  const dLon = aRadianes(lonB - lonA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(latA)) * Math.cos(aRadianes(latB)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(a));
}

/** Una latitud y una longitud que existen de verdad. */
function coordenadaSana(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * El portal del censo que cae más cerca del punto, con su vía y su distancia.
 *
 * Barre los 46.150 uno a uno. **Medido: 1 ms.** No hay índice espacial ni falta
 * —a esa escala montarlo costaría más de lo que ahorra—, y si algún día el
 * censo creciera un orden de magnitud, este comentario es el sitio donde
 * mirarlo.
 *
 * Devuelve `null` cuando el punto no es un punto: sin coordenadas, con letras
 * en vez de números, o con valores fuera del planeta. Es una respuesta bien
 * formada, no un error, igual que la lista vacía de `/api/vias`.
 */
export function portalCercano(
  portales: PortalesEnMemoria,
  callejero: CallejeroEnMemoria,
  lat: number,
  lon: number,
): PortalCercano | null {
  if (!coordenadaSana(lat, lon)) {
    return null;
  }

  let mejor = null as (typeof portales.situados)[number] | null;
  let mejorMetros = Infinity;
  for (const situado of portales.situados) {
    const metros = metrosEntre(lat, lon, situado.lat, situado.lon);
    if (metros < mejorMetros) {
      mejorMetros = metros;
      mejor = situado;
    }
  }
  if (!mejor) {
    return null;
  }

  const via = viaDe(callejero, mejor.via);
  if (!via) {
    // Un portal cuya vía no está entre las sugeribles no se puede ofrecer: la
    // pantalla no podría fijarla, y devolver media dirección sería peor que no
    // devolver ninguna. No debería pasar —toda vía con portal es sugerible—,
    // pero si pasa, se calla en vez de mentir.
    return null;
  }

  return {
    via,
    portal: { codigo: mejor.codigo, numero: mejor.numero },
    // Redondeado al metro: los decímetros de un haversine sobre una posición
    // de GPS son precisión fingida.
    metros: Math.round(mejorMetros),
  };
}

/** La vía sugerible que tiene ese código, si la hay. */
function viaDe(callejero: CallejeroEnMemoria, codigo: string): Via | null {
  return callejero.sugeribles.find((indexada) => indexada.via.codigo === codigo)?.via ?? null;
}
