/**
 * ⭐ EL RECORRIDO QUE LA LÍNEA ESTÁ HACIENDO HOY.
 *
 * ── De dónde sale, y por qué de ahí ─────────────────────────────────────────
 *
 * `admin-ajax.php` con `action=get_stops_list` devuelve **la secuencia ordenada
 * de postes de un sentido con el desvío ya aplicado**. Es el desplegable de
 * postes de la propia web de Avanza: ellos lo usan para que elijas parada;
 * nosotros, para saber por dónde va el autobús esta mañana.
 *
 * ⭐ **Todo este fichero es precedente propio, heredado de ZetaBus**, que lo
 * lleva en producción [`003_ZETABUS/src/sources/avanza/recorrido.ts`]. No se
 * reinventa: se copia lo aprendido, cicatriz por cicatriz, y se cita.
 *
 * ── Las tres cicatrices, todas de allí ──────────────────────────────────────
 *
 * 1. ⚠️ **EL NONCE.** Desde julio de 2026 Avanza exige un nonce de WordPress:
 *    `get_stops_list` sin él responde **403 con el cuerpo vacío**. Vive en el
 *    HTML de `/lineas-y-horarios/` como `<input id="avz_bus_ajax_nonce">`, tiene
 *    validez de unas 12 h, y **se re-scrapea, nunca se cablea**.
 *
 * 2. ⚠️ **UNA LISTA VACÍA NO ES «NO HAY PARADAS».** Es «no he podido leerla». Si
 *    se devolviera vacía en silencio, el diff daría **todas** las paradas de la
 *    línea por suprimidas. Aquí se lanza.
 *
 * 3. ⚠️ **NADA DE REGEX A CIEGAS.** La regla de ZetaBus es *«HTML, no regex»*,
 *    y su razón exacta: *«el día que metan un `<optgroup>`, o cambien el
 *    atributo, el regex devuelve MENOS PARADAS. Y menos paradas significa
 *    PARADAS SUPRIMIDAS QUE NO EXISTEN. Un regex mal puesto aquí no rompe la
 *    pantalla: la llena de desvíos inventados.»*
 *
 *    ⚠️ **Y aquí no hay parser de HTML que valga**, porque en esta casa las
 *    dependencias son cero. Así que el peligro se ataca por donde de verdad
 *    duele: **el fallo silencioso**. Se cuentan los `<option` que hay en el
 *    texto y se comparan con los que se han sabido leer; si no cuadran, se
 *    lanza. [L1: un extractor necesita un contador INDEPENDIENTE.] Y un
 *    `<optgroup>` o un `<select>` por medio —lo que ZetaBus temía— se rechaza
 *    de frente en vez de leerse a medias.
 */

/** El endpoint, el mismo que ZetaBus usa en producción. */
// ⚠️ `Response.text()` ignora el charset declarado [WHATWG Fetch]. Ver `texto.ts`.
import { textoDe } from './texto.ts';

export const URL_AJAX = 'https://zaragoza.avanzagrupo.com/wp-admin/admin-ajax.php';

/** La página de la que sale el nonce. Sin él, 403 con cuerpo vacío. */
export const URL_NONCE = 'https://zaragoza.avanzagrupo.com/lineas-y-horarios/';

/** El campo oculto donde vive. */
export const CAMPO_NONCE = 'avz_bus_ajax_nonce';

/**
 * TTL del nonce en memoria: **30 minutos**, muy por debajo de su validez real
 * (~12 h). Y si Avanza lo rotara antes, el primer 403 lo invalida y se re-pide.
 */
export const TTL_NONCE_MS = 30 * 60_000;

/** Lo que Avanza llama sentido. Se traduce a `direction_id` aparte. */
export type SentidoAvanza = '-1' | '-2';

/**
 * ⭐ SENTIDO DE AVANZA → `direction_id` DEL GTFS. **Medido, no elegido.**
 *
 * [ZetaBus, `desvios.ts:187-199`] el solape se midió antes de decidirlo:
 * línea 21 sentido −1 solapa **91 %** con `dir 0` y 6 % con `dir 1`; sentido −2,
 * **93 %** con `dir 1`. Y los extremos se invierten —el primer poste de −1 es el
 * último de −2—, que es la confirmación independiente.
 *
 * ⚠️ Si esto estuviera al revés, **todos** los diffs saldrían llenos de desvíos
 * inventados y con una pinta perfectamente razonable.
 */
export const SENTIDO_DE: Readonly<Record<string, SentidoAvanza>> = { '0': '-1', '1': '-2' };

export interface PosteDelRecorrido {
  readonly poste: number;
  readonly nombre: string;
}

/** No se ha podido leer el recorrido. **No es «no hay desvío».** */
export class RecorridoIlegible extends Error {
  /**
   * El status HTTP cuando el motivo fue uno. El 403 es el del nonce caducado.
   *
   * ⚠️ Va como campo y se asigna a mano, **no como parámetro del constructor**:
   * un `readonly status` en la lista de parámetros no es un tipo, es azúcar que
   * GENERA código, y Node ejecuta este TypeScript **borrando tipos, sin
   * compilar**. `tsc` lo daba por bueno y Node se negaba a cargar el fichero.
   * Ver `erasableSyntaxOnly` en los dos `tsconfig.json`.
   */
  readonly status: number | undefined;

  constructor(motivo: string, detalle?: string, status?: number) {
    super(`No se puede leer el recorrido: ${motivo}${detalle ? ` · ${detalle}` : ''}`);
    this.name = 'RecorridoIlegible';
    this.status = status;
  }
}

/** El `<option>` de relleno que encabeza el desplegable. No es una parada. */
const RELLENO = 'postedefault';

/** Los atributos de una etiqueta, sin montar un árbol: `value="284"` → `284`. */
function atributo(etiqueta: string, nombre: string): string | null {
  const m = new RegExp(`\\b${nombre}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(etiqueta);
  return m ? (m[2] ?? m[3] ?? '') : null;
}

/**
 * ⭐ LEE LOS POSTES, y **cuenta lo que no ha leído**.
 *
 * La lectura es tonta a propósito —troceo por `<option` y `</option>`—; lo que
 * la hace segura es el recuento: si el texto trae 26 `<option` y salen 24
 * postes, se lanza. Un desvío inventado por leer de menos es exactamente el
 * modo de fallo que ZetaBus documentó, y la única defensa contra él es que
 * **el número no cuadre y se note**.
 */
export function leerPostes(html: string): readonly PosteDelRecorrido[] {
  const trozo = html.trim();
  if (trozo === '') {
    // Vacío = ese sentido no existe (las circulares solo tienen uno), o la
    // petición era errónea. Quien llama decide; aquí no se inventa nada.
    return [];
  }
  // ⚠️ Lo que ZetaBus temía, rechazado de frente en vez de leído a medias.
  if (/<optgroup|<select/i.test(trozo)) {
    throw new RecorridoIlegible(
      'la respuesta trae <optgroup> o <select>',
      'la estructura ha cambiado: leerla con el lector de hoy daría MENOS postes, y menos postes son desvíos inventados',
    );
  }
  if (!trozo.startsWith('<')) {
    throw new RecorridoIlegible('la respuesta no parece HTML', `empieza por: "${trozo.slice(0, 50)}"`);
  }

  const cuantasEtiquetas = (trozo.match(/<option\b/gi) ?? []).length;
  if (cuantasEtiquetas === 0) {
    throw new RecorridoIlegible('no hay ni un <option>', 'la estructura de la respuesta ha cambiado');
  }

  const postes: PosteDelRecorrido[] = [];
  let leidas = 0;
  for (const cacho of trozo.split(/<option\b/i).slice(1)) {
    leidas++;
    const cierre = cacho.indexOf('>');
    if (cierre < 0) {
      throw new RecorridoIlegible('un <option> sin cerrar la etiqueta');
    }
    const valor = (atributo('<option' + cacho.slice(0, cierre), 'value') ?? '').trim();
    if (valor.toLowerCase() === RELLENO) {
      continue;
    }
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) {
      throw new RecorridoIlegible(`un <option> tiene un poste ilegible: "${valor}"`);
    }
    // «1297 - Cosuenda / Paseo de Longares» → nos quedamos con el nombre.
    const texto = cacho
      .slice(cierre + 1)
      .replace(/<\/option>[\s\S]*$/i, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    postes.push({ poste: n, nombre: texto.replace(/^\d+\s*-\s*/, '') });
  }

  // ⭐ EL CONTADOR INDEPENDIENTE. Sin esto, leer de menos es silencioso.
  if (leidas !== cuantasEtiquetas) {
    throw new RecorridoIlegible(
      `el texto trae ${cuantasEtiquetas} <option> y se han recorrido ${leidas}`,
      'leer de menos aquí se convierte en paradas suprimidas que no existen',
    );
  }
  if (postes.length === 0) {
    throw new RecorridoIlegible(
      'el desplegable trae opciones pero ninguna es un poste',
      'si esto se devolviera vacío en silencio, el diff daría TODAS las paradas por suprimidas',
    );
  }
  return postes;
}

/** Saca el nonce del campo oculto de la página. Lanza si no está. */
export function leerNonceDe(html: string): string {
  const m = /<input[^>]*\bid\s*=\s*["']avz_bus_ajax_nonce["'][^>]*>/i.exec(html);
  const valor = m ? atributo(m[0], 'value') : null;
  if (!valor) {
    throw new RecorridoIlegible(
      'no está el nonce en la página',
      `falta el campo ${CAMPO_NONCE} — ¿Avanza cambió la página?`,
    );
  }
  return valor.trim();
}

/** El nonce vivo del proceso, con su caducidad. */
let nonce = { valor: '', expira: 0 };

/** ⚠️ Nunca se imprime ni se guarda en disco: vive en memoria y caduca. */
export async function obtenerNonce(
  pedir: typeof fetch = fetch,
  ahora: () => number = Date.now,
): Promise<string> {
  if (nonce.valor && ahora() < nonce.expira) {
    return nonce.valor;
  }
  const r = await pedir(URL_NONCE);
  if (!r.ok) {
    throw new RecorridoIlegible(`la página del nonce respondió HTTP ${r.status}`, URL_NONCE, r.status);
  }
  nonce = { valor: leerNonceDe(await textoDe(r)), expira: ahora() + TTL_NONCE_MS };
  return nonce.valor;
}

export function invalidarNonce(): void {
  nonce = { valor: '', expira: 0 };
}

/** Una lectura: la petición con su nonce. Lanza `RecorridoIlegible`. */
export async function leerRecorrido(
  linea: string,
  sentido: SentidoAvanza,
  elNonce: string,
  pedir: typeof fetch = fetch,
): Promise<readonly PosteDelRecorrido[]> {
  const r = await pedir(URL_AJAX, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'get_stops_list',
      selectLinea: linea,
      selectSentido: sentido,
      nonce: elNonce,
    }).toString(),
  });
  if (!r.ok) {
    throw new RecorridoIlegible(
      `la fuente ha respondido con HTTP ${r.status}`,
      `línea ${linea}, sentido ${sentido}`,
      r.status,
    );
  }
  return leerPostes(await textoDe(r));
}

/**
 * ⭐ LA LECTURA DE VERDAD: con el nonce memoizado y **un** reintento si caducó.
 *
 * El TTL de 30 min vive dentro de la validez del nonce, pero si Avanza lo rotara
 * antes, el cacheado empezaría a dar 403. Al primer 403 se invalida, se re-pide
 * una vez y se reintenta. Si el fresco **también** da 403, sube el error — y
 * arriba eso es `indeterminado`, que es lo honrado: no es «no hay desvío».
 */
export async function recorridoDeHoy(
  linea: string,
  sentido: SentidoAvanza,
  pedir: typeof fetch = fetch,
  ahora: () => number = Date.now,
): Promise<readonly PosteDelRecorrido[]> {
  try {
    return await leerRecorrido(linea, sentido, await obtenerNonce(pedir, ahora), pedir);
  } catch (e) {
    if (e instanceof RecorridoIlegible && e.status === 403) {
      invalidarNonce();
      return await leerRecorrido(linea, sentido, await obtenerNonce(pedir, ahora), pedir);
    }
    throw e;
  }
}
