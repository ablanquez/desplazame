/**
 * Los portales: el censo municipal entero, en memoria y agrupado por vía.
 *
 * Hasta ahora el motor leía este fichero solo para CONTAR y tiraba el
 * resultado. Ahora se queda: es la carga compartida que faltaba. Quien lo lee
 * es este fichero y nadie más — el callejero recibe los portales ya cargados
 * en vez de volver a parsear los 10 MB por su cuenta.
 *
 * Lo que se sirve son `codigo` y `numero`. Las coordenadas se guardan aparte,
 * indexadas por código, porque `/api/ruta` (punto 6) las va a necesitar y el
 * navegador no: mandarlas sería enviar 46.150 pares que nadie pinta.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Portal } from '@desplazame/tipos';

const PORTALES = fileURLToPath(
  new URL('../../app/data/2026-05-13_zgzradar_callejero-portales-zaragoza.json', import.meta.url),
);

/**
 * Un portal tal y como viene en el censo. Trae once campos; aquí se miran
 * cinco. Los otros —`numero`, `numeroPolicia`, `bloqueEscalera`,
 * `calificacion`, `letra`— no se tocan: no los pinta nadie y el punto 6 no
 * los ha pedido. Están en el fichero, que es donde tienen que estar.
 */
interface PortalCrudo {
  readonly portalId: string;
  readonly codigoVia: string;
  readonly displayNumber: string;
  readonly sortNumber: number;
  readonly coordLat: number;
  readonly coordLon: number;
}

/** Dónde está un portal. Todavía no se sirve: la querrá `/api/ruta`. */
export interface Situacion {
  readonly lat: number;
  readonly lon: number;
}

export interface PortalesEnMemoria {
  /** Cuántos portales hay en el censo. */
  readonly total: number;
  /** Los portales de cada vía, YA en orden natural y listos para servir. */
  readonly porVia: ReadonlyMap<string, readonly Portal[]>;
  /** Dónde cae cada portal, por su código. Para el punto 6. */
  readonly donde: ReadonlyMap<string, Situacion>;
  readonly cargadoEnMs: number;
}

/**
 * El orden en que una persona espera leer un callejero: 1, 2, 3, 10 — nunca
 * 1, 10, 2.
 *
 * **Primero manda `sortNumber`**, que es el número de orden que pone el propio
 * municipio. No lo invento yo: viene en el dato. Y hace bien su trabajo hasta
 * en el caso raro — los 117 portales sin número («BL0 ESC1») traen `sortNumber`
 * 99999, que es el máximo, así que caen al final solos. No se limpia nada.
 *
 * **Pero `sortNumber` no basta**: en 540 de las 2.731 vías con portal hay
 * empates, porque es solo la parte numérica. `71 TV`, `71 TV C2` y `71 TV C11`
 * valen los tres 71. El desempate va por `displayNumber`.
 *
 * [DOC] Y ese desempate se hace con colación numérica, que el estándar da de
 * serie: la opción `numeric` de `Intl.Collator` es *«Whether numeric collation
 * should be used, such that "1" < "2" < "10"»*, y **`the default is false`** —
 * por eso se pide explícitamente. Sin ella, `71 TV C11` se colaría delante de
 * `71 TV C2`, que es exactamente el fallo que este orden viene a evitar.
 */
export function ordenNatural(a: PortalCrudo, b: PortalCrudo): number {
  return (
    a.sortNumber - b.sortNumber ||
    a.displayNumber.localeCompare(b.displayNumber, 'es', { numeric: true })
  );
}

export function cargarPortales(): PortalesEnMemoria {
  const principio = performance.now();

  const crudos = JSON.parse(readFileSync(PORTALES, 'utf8')) as readonly PortalCrudo[];

  const agrupados = new Map<string, PortalCrudo[]>();
  const donde = new Map<string, Situacion>();
  for (const crudo of crudos) {
    const via = String(crudo.codigoVia);
    const suyos = agrupados.get(via);
    if (suyos) {
      suyos.push(crudo);
    } else {
      agrupados.set(via, [crudo]);
    }
    donde.set(crudo.portalId, { lat: crudo.coordLat, lon: crudo.coordLon });
  }

  // Se ordena AQUÍ, una vez al arrancar, y no en cada petición: el orden es
  // una propiedad del dato cargado, no del momento en que alguien pregunta.
  const porVia = new Map<string, readonly Portal[]>();
  for (const [via, suyos] of agrupados) {
    suyos.sort(ordenNatural);
    porVia.set(
      via,
      suyos.map((crudo) => ({ codigo: crudo.portalId, numero: crudo.displayNumber })),
    );
  }

  return { total: crudos.length, porVia, donde, cargadoEnMs: performance.now() - principio };
}

/**
 * Los portales de una vía. Vía desconocida o sin código: lista vacía, que es
 * una respuesta bien formada y no un error — igual que `/api/vias`.
 */
export function portalesDe(
  portales: PortalesEnMemoria,
  codigo: string,
): readonly Portal[] {
  return portales.porVia.get(codigo.trim()) ?? [];
}
