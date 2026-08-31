/**
 * ⭐ LA RENOVACIÓN DEL FEED: preguntar al NAP y bajar solo si cambió.
 *
 * ── Por qué existe, y por qué es camino crítico ─────────────────────────────
 *
 * El censo del 31/08 lo midió: el bus del feed que hay **acaba el 05/10**, el
 * tranvía aguanta hasta el 09, y del **10/10 no queda ni un viaje** — el Pilar
 * incluido. Sin renovación automática no hay modo bus en octubre.
 *
 * ── Detectar por FECHA, no bajando ──────────────────────────────────────────
 *
 * [GTFS Best Practices] el servidor debe reportar la fecha de modificación para
 * que el consumidor no transfiera lo que no ha cambiado. En el NAP esa fecha es
 * **`fechaActualizacion`** del `GetList`, y viene acompañada de una huella
 * gratis: `tamanio`, `numeroViajes`, `numeroRutas` y `numeroParadas`.
 *
 * ⚠️ **Y no hay nada mejor: NO CONSTA.** Buscado en las dos definiciones
 * OpenAPI del NAP (v1 y v2) por `hash`, `sha`, `md5`, `checksum`, `etag` y
 * `feed_version`: **ninguno aparece**. La API no ofrece huella criptográfica del
 * fichero, así que la fecha más los cuatro números es todo lo que hay para
 * decidir sin descargar 6,6 MB.
 *
 * ── El esquema, LEÍDO antes de codificar contra él ──────────────────────────
 *
 * De `https://nap.transportes.gob.es/api/swagger/v1/swagger.json`:
 *
 *   · `GET /api/Fichero/GetList` → `FicheroListAPI { conjuntosDatoDto[], filesNum }`
 *     y cada `ConjuntoDatoAPI` trae `ficherosDto[]` de `FicheroAPI`.
 *   · `GET /api/Fichero/downloadLink/{ficheroId}` → **`{"type": "string"}`**.
 *     O sea: la definición dice que devuelve **un string pelado**, no un objeto.
 *     ⚠️ Existe además un `FicheroDescargaEnlaceDto {enlaceDescarga,
 *     nombreFichero, tieneError}` en la lista de esquemas, pero **esa ruta no lo
 *     declara**. Como no consta cuál sirve de verdad, aquí se aceptan **las
 *     dos formas** y se dice cuál llegó — que es más barato que equivocarse.
 *   · `GET /api/Fichero/download/{id}` está **DEPRECATED** en la propia
 *     definición. Es la que usa ZetaBus; aquí se usa `downloadLink`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  edadEnDias,
  guardarAtomico,
  leerFeedInfo,
  REGISTRO,
  sha256,
  VIVO,
} from './feed.ts';

/** El fichero del NAP que es nuestro feed: «Transporte urbano de Zaragoza». */
export const FICHERO = 1176;

export const BASE = 'https://nap.transportes.gob.es';

/** Generoso para 6,6 MB y corto frente a «nunca». El precedente de ZetaBus. */
export const ESPERA_MS = 60_000;

/** Un zip truncado empieza por `PK` igual que uno entero: la firma no basta. */
export const SUELO_BYTES = 1_000_000;

/** `FicheroAPI` del OpenAPI v1, con los campos que aquí se usan. */
export interface FicheroDelNap {
  readonly ficheroId: number;
  readonly fechaActualizacion: string;
  readonly tamanio: number;
  readonly numeroViajes: number;
  readonly numeroRutas: number;
  readonly numeroParadas: number;
  readonly fechaDesde: string;
  readonly fechaHasta: string;
}

/** Lo que queda escrito junto al vivo: qué es exactamente el zip que hay. */
export interface Registro {
  readonly nap: FicheroDelNap;
  readonly sha256: string;
  readonly feedVersion: string;
  readonly feedEndDate: string;
  readonly bytes: number;
  readonly descargadoEl: string;
}

/** Todo lo que la renovación toca del mundo, para poder probarla SIN RED. */
export interface Mundo {
  readonly clave: string | undefined;
  readonly pedir: typeof fetch;
  readonly registroPrevio: Registro | null;
  readonly hayZip: boolean;
  readonly edadEnDias: number | null;
  readonly guardar: (bytes: Buffer, registro: Registro) => void;
  readonly ahora: Date;
  readonly recocinar: () => void;
}

export type Renovacion =
  | { readonly clase: 'sin-cambios'; readonly fecha: string }
  | { readonly clase: 'renovado'; readonly registro: Registro }
  | { readonly clase: 'sigue-el-viejo'; readonly motivo: string; readonly dias: number | null };

/**
 * ⚠️ Lo que NO se tapa con el zip viejo: falta la clave, o el NAP la rechaza.
 * «Una caída del NAP es ajena y pasajera; una clave que falta o caducada es un
 * build mal configurado» — y tragárselo dejaría el despliegue congelado para
 * siempre en el zip que hubiera, sin que nadie se entere nunca.
 */
export class ErrorDeConfiguracion extends Error {}

/** Los cinco números que hacen la huella. Iguales los cinco = el mismo feed. */
function elMismo(a: FicheroDelNap, b: FicheroDelNap): boolean {
  return (
    a.fechaActualizacion === b.fechaActualizacion &&
    a.tamanio === b.tamanio &&
    a.numeroViajes === b.numeroViajes &&
    a.numeroRutas === b.numeroRutas &&
    a.numeroParadas === b.numeroParadas
  );
}

/** Busca el fichero 1176 dentro de la anidación de `FicheroListAPI`. */
function elNuestro(lista: unknown): FicheroDelNap | null {
  const conjuntos = (lista as { conjuntosDatoDto?: unknown[] })?.conjuntosDatoDto;
  if (!Array.isArray(conjuntos)) {
    return null;
  }
  for (const c of conjuntos) {
    const ficheros = (c as { ficherosDto?: unknown[] })?.ficherosDto;
    if (!Array.isArray(ficheros)) {
      continue;
    }
    for (const f of ficheros) {
      const uno = f as Partial<FicheroDelNap>;
      if (uno.ficheroId === FICHERO && typeof uno.fechaActualizacion === 'string') {
        return {
          ficheroId: uno.ficheroId,
          fechaActualizacion: uno.fechaActualizacion,
          tamanio: Number(uno.tamanio ?? 0),
          numeroViajes: Number(uno.numeroViajes ?? 0),
          numeroRutas: Number(uno.numeroRutas ?? 0),
          numeroParadas: Number(uno.numeroParadas ?? 0),
          fechaDesde: String(uno.fechaDesde ?? ''),
          fechaHasta: String(uno.fechaHasta ?? ''),
        };
      }
    }
  }
  return null;
}

/**
 * El enlace que `downloadLink` devuelve.
 *
 * ⚠️ Su esquema declara **`{"type": "string"}`** — un string pelado—, pero en la
 * lista de esquemas existe además un `FicheroDescargaEnlaceDto` con
 * `enlaceDescarga`. Como la ruta no declara ese objeto, **no consta** cuál
 * llega de verdad, así que se aceptan los dos y no se supone ninguno.
 */
function elEnlace(cuerpo: unknown): string | null {
  if (typeof cuerpo === 'string' && cuerpo.length > 0) {
    return cuerpo;
  }
  const obj = cuerpo as { enlaceDescarga?: unknown; data?: { enlaceDescarga?: unknown } };
  const directo = obj?.enlaceDescarga;
  if (typeof directo === 'string' && directo.length > 0) {
    return directo;
  }
  const dentro = obj?.data?.enlaceDescarga;
  return typeof dentro === 'string' && dentro.length > 0 ? dentro : null;
}

export async function renovarFeed(m: Mundo): Promise<Renovacion> {
  // ── 1 · LA CLAVE, antes que nada y sin tocar la red ────────────────────────
  //
  // ⚠️ Se comprueba aquí, antes del primer `fetch`, y falla CERRADO haya zip o
  // no. Es el precedente de ZetaBus con su razón entera: una caída del NAP es
  // ajena y pasajera, pero una clave que falta es un despliegue mal configurado
  // — y taparlo con el zip viejo lo dejaría congelado en él para siempre sin
  // que nadie se entere nunca.
  const clave = m.clave?.trim();
  if (!clave) {
    throw new ErrorDeConfiguracion(
      `Falta ${'NAP_API_KEY'}. Se para aquí aunque ya haya un zip: una clave que ` +
        'falta es configuración, no meteorología. Ponla en .env.local (local) o en ' +
        'el panel de Hostinger (producción).',
    );
  }

  // ── 2 · LA PREGUNTA: qué dice el NAP que tiene ────────────────────────────
  const cabeceras = { ApiKey: clave };
  let lista: unknown;
  try {
    const r = await m.pedir(`${BASE}/api/Fichero/GetList`, {
      headers: cabeceras,
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    // ⚠️ 401/403 tampoco se tapa: misma razón que la clave ausente.
    if (r.status === 401 || r.status === 403) {
      throw new ErrorDeConfiguracion(
        `El NAP rechaza la ApiKey (${r.status}). No es una caída: es una clave ` +
          'inválida o caducada, así que NO se sigue con el zip que hubiera.',
      );
    }
    if (!r.ok) {
      return sigueElViejo(m, `El NAP respondió ${r.status}.`);
    }
    lista = await r.json();
  } catch (e) {
    if (e instanceof ErrorDeConfiguracion) {
      throw e;
    }
    return sigueElViejo(m, `No se ha podido preguntar al NAP: ${(e as Error).message}`);
  }

  const suyo = elNuestro(lista);
  if (!suyo) {
    return sigueElViejo(m, `El NAP no trae el fichero ${FICHERO} en su lista.`);
  }

  // ── 3 · ¿HA CAMBIADO? Por fecha y por los cuatro números ──────────────────
  //
  // Sin registro previo no se puede comparar, y entonces se baja: lo que hay es
  // la semilla del repo, que por definición no es lo que el NAP tenga hoy.
  if (m.registroPrevio && elMismo(m.registroPrevio.nap, suyo)) {
    return { clase: 'sin-cambios', fecha: suyo.fechaActualizacion };
  }

  // ── 4 · EL ENLACE, y luego los bytes ──────────────────────────────────────
  let bytes: Buffer;
  try {
    const r = await m.pedir(`${BASE}/api/Fichero/downloadLink/${FICHERO}`, {
      headers: cabeceras,
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (r.status === 401 || r.status === 403) {
      throw new ErrorDeConfiguracion(`El NAP rechaza la ApiKey al pedir el enlace (${r.status}).`);
    }
    if (!r.ok) {
      return sigueElViejo(m, `El NAP no da enlace de descarga (${r.status}).`);
    }
    const enlace = elEnlace(await r.json());
    if (!enlace) {
      return sigueElViejo(m, 'El NAP contestó al downloadLink sin un enlace dentro.');
    }
    const z = await m.pedir(enlace, { signal: AbortSignal.timeout(ESPERA_MS) });
    if (!z.ok) {
      return sigueElViejo(m, `La descarga del zip respondió ${z.status}.`);
    }
    bytes = Buffer.from(await z.arrayBuffer());
  } catch (e) {
    if (e instanceof ErrorDeConfiguracion) {
      throw e;
    }
    return sigueElViejo(m, `No se ha podido descargar del NAP: ${(e as Error).message}`);
  }

  // ── 5 · LAS DOS GUARDAS, y ninguna sobra ──────────────────────────────────
  //
  // ⚠️ El NAP devuelve `200` con una página de error cuando algo va mal, así
  // que `ok` no basta: un zip empieza por `PK`.
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    return sigueElViejo(
      m,
      `La respuesta del NAP no es un ZIP (${bytes.length} bytes, no empieza por PK).`,
    );
  }
  // ⚠️ Y un zip truncado empieza por `PK` igual que uno entero: la firma sola
  // dejaría pasar media descarga.
  if (bytes.length < SUELO_BYTES) {
    return sigueElViejo(
      m,
      `El ZIP del NAP viene corto: ${(bytes.length / 1e6).toFixed(2)} MB, y este pesa ~6,6 MB.`,
    );
  }

  // ── 6 · EL REGISTRO, que es lo que mañana permitirá comparar ──────────────
  //
  // `feed_info.txt` es OPCIONAL en la referencia. Si no viene, se registran
  // cadenas vacías y no una fecha inventada: `diasHastaCaducidad('')` da `NaN`
  // y `estadoDeCaducidad` lo llama **caducado**, que es el lado seguro — un
  // feed que no dice hasta cuándo vale no se presume vigente.
  const info = leerFeedInfo(bytes);
  const registro: Registro = {
    nap: suyo,
    sha256: sha256(bytes),
    feedVersion: info?.feedVersion ?? '',
    feedEndDate: info?.feedEndDate ?? '',
    bytes: bytes.length,
    descargadoEl: m.ahora.toISOString(),
  };
  m.guardar(bytes, registro);
  // ⭐ La costura con la casilla 3: hoy no hace nada, y está declarado.
  m.recocinar();
  return { clase: 'renovado', registro };
}

/**
 * El NAP no ha podido servirnos. Si hay zip se sigue con él **diciendo su
 * edad**; si no lo hay, no queda nada que servir y eso sí es morir.
 */
function sigueElViejo(m: Mundo, motivo: string): Renovacion {
  if (!m.hayZip) {
    throw new Error(
      `${motivo} Y no hay ningún zip con el que seguir: no se arranca con datos vacíos.`,
    );
  }
  return { clase: 'sigue-el-viejo', motivo, dias: m.edadEnDias };
}

// ── EL ENDPOINT DEL CRON ─────────────────────────────────────────────────────

/**
 * ⭐ EL NOMBRE DE LA VARIABLE, y de dónde sale.
 *
 * ZetaBus usa `ZETABUS_REGEN_TOKEN` para lo mismo (su README, «El cron
 * nocturno»). Aquí se llama `DESPLAZAME_REGEN_TOKEN`: mismo mecanismo, nombre
 * propio, porque son dos despliegues distintos en el mismo hosting y compartir
 * el nombre de una variable de entorno es pedir que un día se pisen.
 */
export const VARIABLE_DEL_TOKEN = 'DESPLAZAME_REGEN_TOKEN';

/** Por debajo de esto no es un secreto, es una contraseña de juguete. */
export const LARGO_MINIMO_DEL_TOKEN = 32;

export interface EstadoDelCron {
  enCurso: boolean;
}

export interface Respuesta {
  readonly codigo: number;
  readonly cuerpo: unknown;
  readonly arranca: boolean;
}

/**
 * ⭐ QUIÉN PUEDE DISPARAR LA RENOVACIÓN, y en qué orden se comprueba.
 *
 * El patrón entero es el de ZetaBus, que ya vive en el mismo hosting:
 *
 * 1. **`503` si el token no está configurado** —o es más corto que
 *    `LARGO_MINIMO_DEL_TOKEN`—: **falla cerrado y no ejecuta nada**. Un
 *    endpoint que dispara un trabajo sin secreto configurado es un endpoint
 *    abierto, y prefiere no existir a existir sin llave.
 * 2. **`401` si el que llega no es el suyo.**
 * 3. **`409` si ya hay uno corriendo**, para que dos crones solapados no
 *    lancen dos descargas a la vez.
 * 4. **`202` y a trabajar de fondo**: el cron no espera a que termine, así que
 *    no lo mata ningún timeout intermedio del hosting.
 *
 * ⚠️ **El token viaja en la CABECERA, jamás en la URL.** La razón, literal de
 * ZetaBus: la URL **se queda en los logs**. Por eso esta función solo mira la
 * cabecera y no recibe la `URL` siquiera — no puede leerla ni por descuido.
 */
export function atenderRenovacion(
  configurado: string | undefined,
  cabecera: string | undefined,
  estado: EstadoDelCron,
): Respuesta {
  const secreto = configurado?.trim() ?? '';
  if (secreto.length < LARGO_MINIMO_DEL_TOKEN) {
    return {
      codigo: 503,
      cuerpo: {
        error:
          `Sin ${VARIABLE_DEL_TOKEN} configurado (o de menos de ` +
          `${LARGO_MINIMO_DEL_TOKEN} caracteres) esto no se ejecuta.`,
      },
      arranca: false,
    };
  }
  if ((cabecera ?? '') !== `Bearer ${secreto}`) {
    return { codigo: 401, cuerpo: { error: 'Autorización incorrecta.' }, arranca: false };
  }
  if (estado.enCurso) {
    return { codigo: 409, cuerpo: { error: 'Ya hay una renovación en curso.' }, arranca: false };
  }
  return { codigo: 202, cuerpo: { aceptado: true }, arranca: true };
}

// ── LA COSTURA CON LA CASILLA 3 ──────────────────────────────────────────────

/**
 * ⭐ EL GANCHO DE RECOCINAR, **hoy vacío y a propósito**.
 *
 * La casilla 3 cocina la red del bus a partir del feed. Esa cocina **no existe
 * todavía**, y no se inventa aquí: lo que esta casilla deja es el zip nuevo en
 * su sitio y **el sitio donde la 3 se engancha**, declarado, para que ese día
 * sea añadir el cuerpo y no buscar dónde.
 *
 * ⚠️ No devuelve nada ni promete nada. Cuando la 3 llegue, aquí irá el
 * recocinado y este comentario se va con él.
 */
export function recocinar(): void {
  // Vacío a propósito. Ver arriba.
}

// ── LA CLAVE ─────────────────────────────────────────────────────────────────

/** Dónde vive la clave en local. En Hostinger la pone el panel. */
export const FICHERO_DE_ENTORNO = fileURLToPath(new URL('../../.env.local', import.meta.url));

/**
 * ⭐ UN LECTOR DE `.env.local` DE CASA, porque las dependencias son CERO.
 *
 * ZetaBus usa `dotenv` para esto; aquí no entra una dependencia por catorce
 * líneas. Lee `CLAVE=valor` por línea, ignora vacías y comentarios, y quita
 * unas comillas envolventes si las hay.
 *
 * ⚠️ **Lo que ya está en el entorno MANDA.** En Hostinger la clave la pone el
 * panel y no hay fichero; si algún día hubiera los dos, gana el del panel — que
 * es la semántica de dotenv de siempre y evita que un fichero olvidado en un
 * despliegue pise la configuración de verdad.
 *
 * ⚠️ Y **no devuelve el valor de nada**: rellena `process.env` y calla. Aquí no
 * se imprime una clave ni por accidente.
 */
export function cargarEntornoLocal(ruta = FICHERO_DE_ENTORNO): readonly string[] {
  let crudo: string;
  try {
    crudo = readFileSync(ruta, 'utf8');
  } catch {
    return [];
  }
  const puestas: string[] = [];
  for (const linea of crudo.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (limpia.length === 0 || limpia.startsWith('#')) {
      continue;
    }
    const corte = limpia.indexOf('=');
    if (corte <= 0) {
      continue;
    }
    const nombre = limpia.slice(0, corte).trim();
    const valor = limpia.slice(corte + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[nombre] === undefined) {
      process.env[nombre] = valor;
      // Se anota el NOMBRE, jamás el valor.
      puestas.push(nombre);
    }
  }
  return puestas;
}

// ── EL MUNDO DE VERDAD ───────────────────────────────────────────────────────

/** El registro que hay junto al vivo, o `null` si no hay ninguno todavía. */
export function registroGuardado(): Registro | null {
  try {
    return JSON.parse(readFileSync(REGISTRO, 'utf8')) as Registro;
  } catch {
    // No existe, o no se deja leer. Las dos cosas significan lo mismo aquí: no
    // hay con qué comparar, así que la próxima vuelta descarga.
    return null;
  }
}

/**
 * El `Mundo` contra el que corre la renovación de verdad.
 *
 * ⚠️ **La clave se lee de `process.env` y no se guarda, no se imprime y no se
 * devuelve.** Entra por aquí y sale por la cabecera `ApiKey`; en ningún punto
 * de este fichero se escribe en un log ni en el registro.
 */
export function elMundoDeVerdad(ahora = new Date()): Mundo {
  return {
    clave: process.env['NAP_API_KEY'],
    pedir: fetch,
    registroPrevio: registroGuardado(),
    hayZip: existsSync(VIVO),
    edadEnDias: edadEnDias(VIVO, ahora),
    guardar: (bytes, registro) => {
      // ⚠️ Primero el zip y después el registro, y no al revés: si el proceso
      // muere entre los dos, un registro sin su zip mentiría (diría que hay un
      // feed nuevo que no está), mientras que un zip sin registro solo hace que
      // la próxima vuelta vuelva a descargar. El error barato es el segundo.
      guardarAtomico(VIVO, bytes);
      writeFileSync(REGISTRO, JSON.stringify(registro, null, 2) + '\n', 'utf8');
    },
    ahora,
    recocinar,
  };
}
