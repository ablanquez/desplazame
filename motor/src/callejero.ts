/**
 * El callejero: la tabla código↔nombre de vía, y qué vías se pueden sugerir.
 *
 * El censo municipal de portales no trae ni un nombre de calle: solo
 * `codigoVia`. Sin esta tabla no hay autocompletar posible.
 *
 * **Solo se sugiere lo cumplible**, y desde el 27/08 eso es bastante más que
 * antes. Hasta ese día se ofrecían solo las vías con algún portal municipal;
 * las otras 628 —el PUENTE DE PIEDRA, la PLAZA CÉSAR AUGUSTO, el PARQUE JOSÉ
 * ANTONIO LABORDETA— no se podían ni escribir, porque un parque no tiene
 * portales y sugerirlo era prometer una dirección irresoluble.
 *
 * ⭐ Ya no lo es: una vía sin portales se resuelve por **el punto medio de su
 * geometría** en la capa municipal de ejes (§ 1.15), que es la respuesta
 * documentada de Pelias a una dirección sin número. Cumplible sigue
 * significando lo mismo —que se pueda situar—; lo que ha cambiado es de dónde
 * sale el punto cuando no hay puerta.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Via } from '@desplazame/tipos';
import type { PortalesEnMemoria } from './portales.ts';
import { metrosPlanos } from './proyeccion.ts';
import { puntosMediosDeVia, type PuntoDeVia } from './ejes.ts';

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

/**
 * ⭐ LAS PALABRAS VACÍAS: las que NO deciden si una calle casa (30/08).
 *
 * Antonio escribió «rodrigo rebolledo» y no encontró **Calle Rodrigo de
 * Rebolledo**, porque el casado pedía la consulta entera como subcadena
 * literal y entre las dos palabras hay un ` de ` que nadie teclea. No es un
 * caso raro: **1.076 de las 3.350 vías llevan partícula en medio**, y en
 * **673** de ellas quitarla daba una consulta que no encontraba nada.
 *
 * [Pelias] el **`StopWordClassifier`** es una pieza con nombre propio de su
 * analizador de consultas, listada entre sus *word classifiers* oficiales: el
 * casado **no debe depender de la preposición**. El mecanismo es doctrina; la
 * lista concreta en castellano es **[PROPIO declarado]**, y es corta a
 * propósito — solo artículos, las dos preposiciones que de verdad aparecen en
 * los nombres de calle, y la conjunción de los nombres dobles («Francisco
 * Cantín **y** Gamboa»).
 *
 * ⚠️ **Vacía es «no decide», NO «no se enseña».** El nombre se pinta entero y
 * sin tocar: «CALLE RODRIGO DE REBOLLEDO» se lee con su «de», porque lo que se
 * normaliza es una copia para comparar y jamás el dato. Ver `Via.nombre`.
 */
export const PALABRAS_VACIAS: ReadonlySet<string> = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'el',
  'y',
]);

/**
 * El mismo texto sin las palabras que no deciden. Devuelve `''` si no queda
 * nada, y ese vacío es significativo: ver la guarda de `buscar`.
 *
 * Se parte por espacios porque `normalizar` ya ha dejado el texto en
 * minúsculas y sin acentos, y los nombres del callejero separan sus palabras
 * con espacios simples. No se toca la puntuación: aquí no hay.
 */
export function sinVacias(norma: string): string {
  return norma
    .split(' ')
    .filter((palabra) => palabra.length > 0 && !PALABRAS_VACIAS.has(palabra))
    .join(' ');
}

/** Una vía sugerible, con su nombre normalizado guardado para no rehacerlo. */
interface ViaIndexada {
  readonly via: Via;
  readonly norma: string;
  /**
   * ⭐ Y el mismo nombre **sin las partículas**, para que la preposición no
   * esconda la calle. Se guarda hecho porque `buscar` recorre las 3.350 en
   * cada tecla y el nombre de una vía no cambia en toda la vida del proceso.
   */
  readonly nucleoBuscable: string;
}

export interface CallejeroEnMemoria {
  /** Todas las vías del callejero: N. */
  readonly vias: number;
  /**
   * ⭐ Las que se sugieren: M. **Las que tienen portal MÁS las que se resuelven
   * por su punto medio.** El reparto exacto está en `porPuntoMedio`.
   */
  readonly sugeribles: readonly ViaIndexada[];
  /** Cuántas de `sugeribles` entran por su punto medio, sin ningún portal. */
  readonly porPuntoMedio: number;
  /**
   * Y las que se quedan fuera, con los dos motivos separados porque son dos
   * cosas distintas: una vía del callejero que la capa de ejes **no conoce**, y
   * una que sí conoce pero **trae la multilínea vacía**.
   */
  readonly sinEje: number;
  readonly sinGeometria: number;
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
  /**
   * ⭐ El punto de las vías SIN PORTAL, y solo de esas.
   *
   * Es su punto de resolución: por dónde se entra a la red cuando alguien la
   * elige, y desde dónde se mide su distancia al foco. Aquí no está ninguna de
   * las 2.731 con portal, **y no es por ahorrar memoria**: donde hay puertas
   * manda la puerta, y tener el punto medio a mano invitaría a usarlo en un
   * sitio donde hay un dato mejor.
   */
  readonly puntoDeVia: ReadonlyMap<string, PuntoDeVia>;
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

  /**
   * ⭐ El punto medio de cada vía de la capa de ejes. Se lee aquí y **se suelta
   * al salir**: de los 3,4 MB solo sobreviven los puntos de las que no tienen
   * portal. Cuesta 22 ms medidos —6 de leer, 16 de parsear—, y es la segunda
   * lectura del fichero en el arranque: la primera la hace la herencia de
   * nombre por vecindad, que quiere el índice espacial y no los puntos. Se
   * pagan los 22 ms antes que atar dos módulos que no se necesitan.
   */
  const medios = puntosMediosDeVia();

  const sugeribles: ViaIndexada[] = [];
  const puntoDeVia = new Map<string, PuntoDeVia>();
  let porPuntoMedio = 0;
  let sinEje = 0;
  let sinGeometria = 0;
  for (const cruda of vias) {
    const codigo = String(cruda.codigoVia);
    // Cuántos portales tiene, contados de verdad sobre el censo municipal. El
    // callejero también lo declara en `numPortales` y coincide en las 3.359 —
    // pero manda lo contado, que es lo que se va a poder elegir.
    const cuantos = portales.porVia.get(codigo)?.length ?? 0;
    /**
     * ⭐ SIN PORTALES, el punto medio de su geometría — y si tampoco lo hay,
     * fuera y contada. **NO CONSTA antes que inventar**: una vía que la capa de
     * ejes no conoce, o que llega con la multilínea vacía, no se puede situar, y
     * sugerirla sería volver a prometer lo que no se puede cumplir.
     */
    if (cuantos === 0) {
      if (!medios.has(codigo)) {
        sinEje++;
        continue;
      }
      const medio = medios.get(codigo);
      if (!medio) {
        sinGeometria++;
        continue;
      }
      puntoDeVia.set(codigo, medio);
      porPuntoMedio++;
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
      nucleoBuscable: sinVacias(normalizar(cruda.nombrePublico)),
    });
  }
  sugeribles.sort((a, b) => a.via.nombre.localeCompare(b.via.nombre, 'es'));

  return {
    vias: vias.length,
    sugeribles,
    porPuntoMedio,
    sinEje,
    sinGeometria,
    portales: portales.total,
    censo: portales,
    puntoDeVia,
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
 *
 * ⭐ **Y las que no tienen portal se miden por su punto medio** (27/08). No es
 * una regla nueva ni una excepción: es EL MISMO punto por el que esa vía se
 * resuelve cuando alguien la elige, así que la distancia que se dice aquí es la
 * distancia a donde de verdad va a caer la ruta. Que en una calle larga el
 * punto medio mienta sigue siendo verdad — pero es que ahí no hay nada mejor
 * que mirar, y el aviso del párrafo de arriba es contra elegirlo **teniendo**
 * portales, no contra usarlo cuando es lo único que hay.
 *
 * Nunca devuelve `Infinity` para una vía sugerible: por construcción todas
 * tienen o portales o punto medio, y hay un guardián que lo comprueba sobre las
 * 3.350. Si lo devolviera, el comparador restaría `Infinity - Infinity` y el
 * orden se volvería `NaN` — silencioso y sin rojo.
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
  if (mejor === Infinity) {
    const medio = callejero.puntoDeVia.get(via);
    return medio ? metrosPlanos(foco.lon, foco.lat, medio.lon, medio.lat) : Infinity;
  }
  return mejor;
}

/**
 * Busca por subcadena, no por prefijo: quien escribe «goya» espera encontrar
 * «AVENIDA DE GOYA» y «PASEO DE GOYA». Pero las que EMPIEZAN por lo escrito
 * van primero, porque con un tope de 10 el orden alfabético a secas escondería
 * lo más obvio.
 *
 * ── ⭐ Y LAS PARTÍCULAS NO DECIDEN (30/08) ──────────────────────────────────
 *
 * La subcadena sola pedía la consulta **entera y contigua**, así que «rodrigo
 * rebolledo» no encontraba «Calle Rodrigo de Rebolledo». Desde hoy se compara
 * también contra el nombre sin sus palabras vacías. Ver `PALABRAS_VACIAS`.
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

  /**
   * ⭐ LA CONSULTA SIN SUS PARTÍCULAS, y la guarda que la acompaña.
   *
   * ⚠️ Si lo escrito es **solo** palabras vacías —«de», «la», «de la»—, esto
   * queda en blanco, y una cadena vacía es subcadena de todo: la puerta
   * abierta al callejero entero. Por eso el camino de las vacías **solo se
   * abre cuando queda algo**, y quien escriba «de» sigue teniendo la búsqueda
   * literal de siempre con su tope de diez.
   */
  const nucleo = sinVacias(norma);
  const usarNucleo = nucleo.length > 0;

  const casan: { readonly via: Via; readonly empieza: boolean }[] = [];
  for (const indexada of callejero.sugeribles) {
    // ⭐ Los dos caminos, y el literal va primero: **este cambio solo AÑADE**.
    // Lo que casaba ayer casa hoy exactamente igual y en la misma capa de
    // orden; lo que se gana es la calle que la preposición escondía.
    //
    // Y una consulta de una sola palabra no puede cambiar de resultado por
    // aquí: quitar vacías no crea letras nuevas ni junta palabras sin espacio,
    // así que solo aparecen coincidencias **con espacio en medio**. Es la
    // razón por la que «goya», «mayor» y «calle» dan lo mismo que ayer.
    const empiezaLiteral = indexada.norma.startsWith(norma);
    const empiezaNucleo = usarNucleo && indexada.nucleoBuscable.startsWith(nucleo);
    if (empiezaLiteral || empiezaNucleo) {
      casan.push({ via: indexada.via, empieza: true });
    } else if (indexada.norma.includes(norma) || (usarNucleo && indexada.nucleoBuscable.includes(nucleo))) {
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
