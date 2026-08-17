/**
 * El callejero: la tabla código↔nombre de vía, y qué vías se pueden sugerir.
 *
 * El censo municipal de portales no trae ni un nombre de calle: solo
 * `codigoVia`. Sin esta tabla no hay autocompletar posible.
 *
 * **Solo se sugiere lo cumplible.** De las vías del callejero, únicamente las
 * que tienen algún portal municipal — sugerir una vía sin portales sería
 * prometer una dirección que el punto 6 no va a poder resolver.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Via } from '@desplazame/tipos';

const CALLEJERO = fileURLToPath(
  new URL('../../app/data/2026-05-13_zgzradar_callejero-vias-zaragoza.json', import.meta.url),
);
const PORTALES = fileURLToPath(
  new URL('../../app/data/2026-05-13_zgzradar_callejero-portales-zaragoza.json', import.meta.url),
);

/** Una vía tal y como viene en el callejero. Solo lo que aquí se mira. */
interface ViaCruda {
  readonly codigoVia: string;
  readonly nombrePublico: string;
  readonly tipoVia: string;
  readonly numPortales: number;
}

/** Un portal municipal. Solo lo que aquí se mira. */
interface PortalCrudo {
  readonly codigoVia: string;
}

/**
 * Normaliza para COMPARAR, nunca para mostrar: minúsculas y sin acentos.
 * `NFD` separa la vocal de su tilde y se borran las marcas combinantes, así
 * que «Ávila» y «AVILA» casan, y «Ñ» casa con «N».
 *
 * El callejero ya trae un campo `nombrePublicoNorm` con su propia
 * normalización, pero aquí se normaliza a mano y por los dos lados —lo que
 * se busca y lo que se compara— para que la regla sea una sola y esté a la
 * vista. Comprobado: esta función y el campo del origen coinciden en las
 * 3.359 vías.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Una vía sugerible, con su nombre normalizado guardado para no rehacerlo. */
interface ViaIndexada {
  readonly via: Via;
  readonly norma: string;
}

export interface CallejeroEnMemoria {
  /** Todas las vías del callejero: N. */
  readonly vias: number;
  /** Las que tienen portal, las únicas que se sugieren: M. */
  readonly sugeribles: readonly ViaIndexada[];
  readonly portales: number;
  readonly cargadoEnMs: number;
}

export function cargarCallejero(): CallejeroEnMemoria {
  const principio = performance.now();

  const vias = JSON.parse(readFileSync(CALLEJERO, 'utf8')) as readonly ViaCruda[];
  const portales = JSON.parse(readFileSync(PORTALES, 'utf8')) as readonly PortalCrudo[];

  // Cuántos portales tiene cada vía, contados de verdad sobre el censo
  // municipal. El callejero también lo declara en `numPortales` y coincide en
  // las 3.359 — pero manda lo contado, que es lo que el punto 6 va a resolver.
  const porVia = new Map<string, number>();
  for (const portal of portales) {
    const codigo = String(portal.codigoVia);
    porVia.set(codigo, (porVia.get(codigo) ?? 0) + 1);
  }

  const sugeribles: ViaIndexada[] = [];
  for (const cruda of vias) {
    const codigo = String(cruda.codigoVia);
    const cuantos = porVia.get(codigo);
    if (!cuantos) {
      continue;
    }
    sugeribles.push({
      // El nombre se devuelve TAL CUAL viene, sin maquillar.
      via: { codigo, nombre: cruda.nombrePublico, tipo: cruda.tipoVia, portales: cuantos },
      norma: normalizar(cruda.nombrePublico),
    });
  }
  sugeribles.sort((a, b) => a.via.nombre.localeCompare(b.via.nombre, 'es'));

  return {
    vias: vias.length,
    sugeribles,
    portales: portales.length,
    cargadoEnMs: performance.now() - principio,
  };
}

/** Con menos de esto no se sugiere: una letra casaría con media ciudad. */
export const MINIMO = 2;

/** Cuántas sugerencias devuelve como mucho. */
export const LIMITE = 10;

/**
 * Busca por subcadena, no por prefijo: quien escribe «goya» espera encontrar
 * «AVENIDA DE GOYA» y «PASEO DE GOYA». Pero las que EMPIEZAN por lo escrito
 * van primero, porque con un tope de 10 el orden alfabético a secas escondería
 * lo más obvio.
 */
export function buscar(callejero: CallejeroEnMemoria, consulta: string): readonly Via[] {
  const norma = normalizar(consulta);
  if (norma.length < MINIMO) {
    return [];
  }

  const empiezan: Via[] = [];
  const contienen: Via[] = [];
  for (const indexada of callejero.sugeribles) {
    if (indexada.norma.startsWith(norma)) {
      empiezan.push(indexada.via);
    } else if (indexada.norma.includes(norma)) {
      contienen.push(indexada.via);
    }
  }
  return [...empiezan, ...contienen].slice(0, LIMITE);
}
