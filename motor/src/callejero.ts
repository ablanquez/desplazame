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
import { metrosPlanos } from './proyeccion.ts';

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
  /**
   * ⭐ El censo entero, la MISMA referencia que ya se recibe al cargar.
   *
   * No duplica nada y hace falta para una sola cosa: medir a qué distancia
   * está una vía de un punto. Se guarda aquí en vez de pasarlo por parámetro
   * a `buscar` porque el callejero **ya depende** de los portales —sin ellos no
   * sabría cuáles son sugeribles— y añadirlo a la firma de la búsqueda sería
   * pedirle a quien la llama que arrastre un dato que el callejero ya tiene.
   */
  readonly censo: PortalesEnMemoria;
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
    censo: portales,
    cargadoEnMs: performance.now() - principio,
  };
}

/** Con menos de esto no se sugiere: una letra casaría con media ciudad. */
export const MINIMO = 2;

/** Cuántas sugerencias devuelve como mucho. */
export const LIMITE = 10;

/** Un punto al que acercar las sugerencias. [DOC Pelias: `focus.point`] */
export interface Foco {
  readonly lon: number;
  readonly lat: number;
}

/**
 * ⭐ A qué distancia está una VÍA de un punto: **la de su portal más cercano**.
 *
 * Una calle no es un punto, así que hay que elegir cuál de los suyos la
 * representa, y se elige el más cercano al foco en vez de un centroide **porque
 * las calles largas mienten en el centro**: la Avenida de Cataluña mide
 * kilómetros y su punto medio no dice nada de si tienes un portal suyo al lado.
 * Con el más cercano, «esta calle está a X metros» significa lo que parece.
 *
 * No inventa geometría: usa los portales del censo, que es el dato que ya
 * decide qué vías se sugieren.
 */
function metrosALaVia(callejero: CallejeroEnMemoria, via: string, foco: Foco): number {
  let mejor = Infinity;
  for (const p of callejero.censo.porVia.get(via) ?? []) {
    const situado = callejero.censo.donde.get(p.codigo);
    if (!situado) {
      continue;
    }
    const m = metrosPlanos(foco.lon, foco.lat, situado.lon, situado.lat);
    if (m < mejor) {
      mejor = m;
    }
  }
  return mejor;
}

/**
 * Busca por subcadena, no por prefijo: quien escribe «goya» espera encontrar
 * «AVENIDA DE GOYA» y «PASEO DE GOYA». Pero las que EMPIEZAN por lo escrito
 * van primero, porque con un tope de 10 el orden alfabético a secas escondería
 * lo más obvio.
 *
 * ── ⭐ EL FOCO (27/08), que completa el patrón ──────────────────────────────
 *
 * `foco` es **opcional** y es el punto del otro extremo, cuando ya está
 * resuelto — el mismo criterio y el mismo parámetro que en `/api/sitios` desde
 * la tanda 1. Con foco, **lo cercano sube; nada se descarta**: es literalmente
 * lo que hace Pelias en su autocompletar —«promociona los resultados cercanos a
 * lo alto de la lista, sin dejar de mostrar los de más lejos»— y lo que traen
 * Photon (`lat`/`lon`), Google Places (*location bias*) y Geoapify
 * (`proximity`).
 *
 * El caso que lo pedía es el nuestro y está documentado igual fuera: TriMet, en
 * Portland, pidió esto mismo para las «direcciones ambiguas **entre pueblos**»
 * (pelias#569). Aquí son las **siete Calles Mayor** de Zaragoza —la del centro
 * y las de La Cartuja, Garrapinillos, Juslibol, Montañana, Miralbueno y
 * Villarrapa—: quien empieza una ruta en Garrapinillos y escribe «mayor» quiere
 * la suya, y hasta hoy le salía la sexta.
 *
 * ⚠️ **Los corchetes del núcleo NO se van.** `CALLE MAYOR [GARRAPINILLOS]`
 * sigue diciendo cuál es cuál (18/08): el foco **reordena**, y el marcador
 * **identifica**. Son dos trabajos distintos y hacen falta los dos — el orden
 * ayuda a quien mira la lista de arriba abajo, y el corchete es lo que deja
 * elegir sin equivocarse.
 *
 * ⚠️ Y el orden se calcula **antes** del tope, no después. Con «mayor» casan
 * **22 vías** y se enseñan diez: ordenar después de cortar dejaría fuera
 * justamente la que el foco tenía que subir.
 */
export function buscar(
  callejero: CallejeroEnMemoria,
  consulta: string,
  foco: Foco | null = null,
): readonly Via[] {
  const norma = normalizar(consulta);
  if (norma.length < MINIMO) {
    return [];
  }

  const casan: { readonly via: Via; readonly empieza: boolean }[] = [];
  for (const indexada of callejero.sugeribles) {
    if (indexada.norma.startsWith(norma)) {
      casan.push({ via: indexada.via, empieza: true });
    } else if (indexada.norma.includes(norma)) {
      casan.push({ via: indexada.via, empieza: false });
    }
  }

  const cerca = new Map<string, number>();
  if (foco) {
    for (const { via } of casan) {
      cerca.set(via.codigo, metrosALaVia(callejero, via.codigo, foco));
    }
  }

  /**
   * ⭐ EL ORDEN, por capas, y es el mismo que el de los sitios:
   *
   * 1. **La coincidencia**: lo que empieza por lo escrito, antes. El foco nunca
   *    se pone por delante — estar al lado no convierte una coincidencia peor
   *    en una mejor, que es la regla ya firmada en `sugerirSitios`.
   * 2. **El foco**, si lo hay: a igualdad de coincidencia, lo cercano sube.
   * 3. **Alfabético por el nombre**, que es el orden con el que `sugeribles` ya
   *    viene ordenado. Sin foco, esta capa sola reproduce **exactamente** la
   *    lista de siempre, y hay un guardián que lo comprueba.
   */
  casan.sort((a, b) => {
    if (a.empieza !== b.empieza) {
      return a.empieza ? -1 : 1;
    }
    if (foco) {
      const porCerca = cerca.get(a.via.codigo)! - cerca.get(b.via.codigo)!;
      if (porCerca !== 0) {
        return porCerca;
      }
    }
    return a.via.nombre.localeCompare(b.via.nombre, 'es');
  });
  return casan.slice(0, LIMITE).map(({ via }) => via);
}
