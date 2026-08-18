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
import type { PortalesEnMemoria } from './portales.ts';

const CALLEJERO = fileURLToPath(
  new URL('../../app/data/2026-05-13_zgzradar_callejero-vias-zaragoza.json', import.meta.url),
);

/** Una vía tal y como viene en el callejero. Solo lo que aquí se mira. */
interface ViaCruda {
  readonly codigoVia: string;
  readonly nombrePublico: string;
  readonly tipoVia: string;
  readonly numPortales: number;
  readonly barrioRuralLabel?: string;
}

/**
 * El marcador de núcleo que arrastran 256 vías: ` ---CST`, ` ---PÑF`…
 * Comprobado sobre las 3.359: **siempre al final, siempre precedido de un
 * espacio, nunca dos en el mismo nombre**. Por eso el corte es seguro.
 */
const MARCADOR = / ---[A-ZÁÉÍÓÚÑ0-9]+$/;

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

/**
 * Recibe los portales YA cargados en vez de volver a leer sus 10 MB. Antes
 * este fichero parseaba el censo entero solo para contar y tiraba el
 * resultado; ahora lo carga `portales.ts`, una vez, y aquí solo se cuenta
 * sobre lo que ya está en memoria.
 */
export function cargarCallejero(portales: PortalesEnMemoria): CallejeroEnMemoria {
  const principio = performance.now();

  const vias = JSON.parse(readFileSync(CALLEJERO, 'utf8')) as readonly ViaCruda[];

  const sugeribles: ViaIndexada[] = [];
  for (const cruda of vias) {
    const codigo = String(cruda.codigoVia);
    // Cuántos portales tiene, contados de verdad sobre el censo municipal. El
    // callejero también lo declara en `numPortales` y coincide en las 3.359 —
    // pero manda lo contado, que es lo que se va a poder elegir.
    const cuantos = portales.porVia.get(codigo)?.length;
    if (!cuantos) {
      continue;
    }
    sugeribles.push({
      via: {
        codigo,
        // El nombre se guarda TAL CUAL viene, con su marcador: es el dato.
        nombre: cruda.nombrePublico,
        // Y ya interpretado, que es lo que se enseña. El corte lo hace el
        // motor aquí y solo aquí: la interfaz no parsea nombres.
        limpio: cruda.nombrePublico.replace(MARCADOR, ''),
        nucleo: cruda.barrioRuralLabel ? cruda.barrioRuralLabel.toUpperCase() : null,
        tipo: cruda.tipoVia,
        portales: cuantos,
      },
      norma: normalizar(cruda.nombrePublico),
    });
  }
  sugeribles.sort((a, b) => a.via.nombre.localeCompare(b.via.nombre, 'es'));

  return {
    vias: vias.length,
    sugeribles,
    portales: portales.total,
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
