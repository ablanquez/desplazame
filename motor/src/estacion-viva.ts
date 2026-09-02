/**
 * ⭐ LA ESTACIÓN VIVA **A PETICIÓN** (2/09): `GET /api/estacion-viva?estacion=N&pide=bicis`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  Es `poste-vivo.ts` calcado, y calcado a propósito: la pregunta es la misma
 *  —«¿cuánto hay AHORA?»— hecha a otra fuente. Lo que se hereda entero:
 *
 *   1. **Frescura por petición, nunca caché.** Cada pulsación vuelve a
 *      preguntar de verdad. Un «8 bicis» guardado de hace cuarenta segundos es
 *      peor que no tenerlo, porque parece de ahora. La respuesta va con
 *      `Cache-Control: no-store` para que tampoco lo guarde el navegador.
 *   2. **Single-flight**, y aquí **ya estaba hecho**: `disponibilidadDeBiZi()`
 *      lo lleva dentro desde el 30/08, y con una sola variable en vuelo en vez
 *      de un mapa por clave — porque la petición a la sede no lleva ni un
 *      parámetro nuestro, así que dos consultas concurrentes son forzosamente
 *      idénticas. Esto no añade nada: se apoya en aquello.
 *   3. **Idempotente**: un GET que no cambia nada.
 *   4. **El D-G del Ayuntamiento** [firmado el 28/08]: si la fuente calla, se
 *      contesta igual y se dice que no se sabe. Componer sin prometer.
 *
 *  ── La diferencia con el poste, y es de fondo ──────────────────────────────
 *
 *  Allí el botón **no existe** cuando no hay fuente: el tranvía no tiene
 *  `stop_code` de los que Avanza entiende, así que un botón suyo solo podría
 *  contestar «no lo sé». Aquí la fuente **siempre existe** —la sede—, y que hoy
 *  no conteste es un `mudo`, no una ausencia de fuente. Por eso los dos hitos
 *  de la BiZi llevan siempre su botón.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { alMinuto } from './etapas.ts';
import { disponibilidadDeBiZi, type Disponibilidad, type EstadoDeEstacion } from './bizi.ts';
import type { EstacionViva, QueSePide } from '@desplazame/tipos';

/**
 * Cómo se nombra la estación **dentro de la respuesta del endpoint**: «esta».
 *
 * ⚠️ El mismo argumento que `ESTE_POSTE`: esto se pinta **dentro del propio
 *    hito**, tres palabras debajo de un texto que ya dice de qué estación
 *    habla. Repetir el nombre ahí sería ruido. El aviso del Generar, que vive
 *    en la cabecera y lejos de los pasos, sí la nombra entera.
 */
export const ESTA_ESTACION = 'esta estación';

/** Cómo se dice una cantidad con su singular. «1 bici», «8 bicis». */
export function conUnidad(cuantos: number, singular: string, plural: string): string {
  return `${cuantos} ${cuantos === 1 ? singular : plural}`;
}

/**
 * ⭐ LA CIFRA DE UNA ESTACIÓN, **en un solo sitio** — «8 bicis disponibles».
 *
 * La dicen dos bocas: el hito que compone el Generar (`viaje-bizi.ts`) y la
 * respuesta de este endpoint. Por eso vive aquí y no en ninguna de las dos: dos
 * copias serían dos sitios donde cambiar una palabra, y la que se olvidara
 * sería la que leyera alguien. Es la misma decisión que `comoSeDiceElProximo`.
 */
export function laCifra(estado: EstadoDeEstacion, pide: QueSePide): string {
  return pide === 'bicis'
    ? conUnidad(estado.bicis, 'bici disponible', 'bicis disponibles')
    : conUnidad(estado.anclajesLibres, 'anclaje libre', 'anclajes libres');
}

/** Lo que se está preguntando, dicho para meterlo en una frase. */
function loQueSePregunta(pide: QueSePide): string {
  return pide === 'bicis' ? 'cuántas bicis hay' : 'cuántos anclajes libres hay';
}

/** Y lo que faltaría, si faltara. Para el «no es falta de X». */
function loQueNoFalta(pide: QueSePide): string {
  return pide === 'bicis' ? 'bicis' : 'anclajes libres';
}

/**
 * ⭐ LA FRASE DE CADA ESTADO, y los tres se separan a propósito.
 *
 * `vivo` es lo que la sede contestó —o `null` si no contestó—, y la estación es
 * la que se preguntó. De ahí salen las tres:
 *
 * · Hay dato → la cifra con **la hora de ESE dato**, no la de la consulta.
 * · La sede contesta pero no trae esa estación → `ausente`. [GTFS-Realtime]
 *   ausente es «sin información», no «sin servicio»: decir «0 bicis» aquí sería
 *   inventarse un número que nadie ha publicado.
 * · La sede no contesta → `mudo`, con las palabras del D-G.
 */
export function comoSeDiceLaEstacion(
  vivo: Disponibilidad | null,
  estacion: number,
  pide: QueSePide,
  donde: string,
): EstacionViva {
  if (vivo === null) {
    return {
      clase: 'mudo',
      texto:
        `No hemos podido preguntar ${loQueSePregunta(pide)} en ${donde} ahora mismo: ` +
        'disponibilidad no verificada.',
    };
  }
  const estado = vivo.porNumero.get(estacion);
  if (!estado) {
    return {
      clase: 'ausente',
      texto:
        `El Ayuntamiento contesta, pero ahora mismo no publica ${donde} — ` +
        `es falta de información, no de ${loQueNoFalta(pide)}.`,
    };
  }
  return { clase: 'hay', texto: `${laCifra(estado, pide)} a las ${alMinuto(estado.cuando)}` };
}

/** Lo que el servidor tiene que contestar: un código y un cuerpo. */
export interface RespuestaDeLaEstacion {
  readonly codigo: number;
  readonly cuerpo: EstacionViva | { readonly error: string };
}

/**
 * ⭐ EL ENDPOINT, sin `node:http` alrededor — por eso se puede juzgar.
 *
 * Los dos parámetros llegan **crudos de la URL** y se validan aquí, igual que
 * en el poste y por lo mismo: `Number('')` vale 0 y `Number('  3 ')` vale 3, así
 * que una `estacion` que falta o que trae basura colaría como legítima si se
 * dejara al constructor decidir. Se exige lo que es: **dígitos y nada más**.
 *
 * Y `pide` se exige **exacto**. Un `pide=bicicletas` no es «casi bicis»: es una
 * petición mal escrita, y contestar bicis a eso sería adivinar.
 *
 * ⚠️ Una estación que no existe **no es un 400**: es un `ausente`, porque desde
 *    aquí no se distingue de una que existe y hoy no viene en la respuesta —y
 *    el inventario no se consulta, que sería otra fuente y otra latencia—.
 *    El 400 es para la petición mal escrita, que es un fallo de quien pregunta.
 */
export async function atenderEstacionViva(
  crudaEstacion: string | null,
  crudoPide: string | null,
  consultar: () => Promise<Disponibilidad | null> = disponibilidadDeBiZi,
): Promise<RespuestaDeLaEstacion> {
  const estacion = (crudaEstacion ?? '').trim();
  const pide = (crudoPide ?? '').trim();
  if (!/^\d+$/.test(estacion) || Number(estacion) <= 0) {
    return { codigo: 400, cuerpo: { error: 'Falta «estacion», o no es un número de estación.' } };
  }
  if (pide !== 'bicis' && pide !== 'anclajes') {
    return { codigo: 400, cuerpo: { error: 'Falta «pide», que vale «bicis» o «anclajes».' } };
  }
  const vivo = await consultar();
  return {
    codigo: 200,
    cuerpo: comoSeDiceLaEstacion(vivo, Number(estacion), pide, ESTA_ESTACION),
  };
}
