/**
 * mantener-datos — EL CRON EDUCADO: preguntar por el dato sin bajarlo dos veces,
 * y no dar por bueno ningún «job OK» que no traiga una huella detrás.
 *
 * Es el punto del PLAN «el mantenimiento de datos (el cron educado)», y se
 * ejecuta a mano igual que por cron:
 *
 *     npm run mantener-datos                 → la pasada entera
 *     npm run mantener-datos -- --seco       → pregunta y NO escribe nada
 *     npm run mantener-datos -- --solo <n>   → un solo conjunto, por su `name`
 *     npm run mantener-datos -- --forzar     → mira aunque no toque por cadencia
 *
 * Y para la jueza, que levanta su propia fuente en 127.0.0.1: `--raiz <dir>`
 * (otro repositorio de juguete), `--ahora <fecha>` (fingir el día, para poder
 * pararse en el borde exacto de una cadencia) y `--pausa <ms>`.
 *
 * ── DE DÓNDE SALE CADA DECISIÓN ────────────────────────────────────────────
 *
 * El manifiesto (`datapackage.json`) es la única verdad, y sirve para dos cosas
 * a la vez: **pintar el panel de frescura** y **planificar esta pasada**. De él
 * salen, conjunto a conjunto:
 *   · `peticion` — cómo se vuelve a pedir. **No se inventa**: o la guardan sus
 *     propias cabeceras de descarga, o consta en THIRD-PARTY-NOTICES.md. Un
 *     conjunto sin `peticion` NO SE VIGILA, y se dice, que es distinto de
 *     vigilarlo mal.
 *   · `vigilanciaDias` — cada cuánto toca mirarlo, con `vigilanciaFuente`
 *     diciendo de dónde sale ese número (del origen, o de la casa).
 *   · `hash` y `bytes` — la huella con la que se decide si CAMBIÓ.
 *   · `validadores` — lo que el servidor emitió la última vez (ETag y/o
 *     Last-Modified), para poder preguntar condicionalmente.
 *
 * ── EL GET CONDICIONAL, Y LO QUE SE MIDIÓ DE VERDAD ────────────────────────
 *
 * [MDN, GET condicional] se guardan los validadores que emitió el servidor y se
 * pregunta con `If-None-Match` / `If-Modified-Since`; si no hay cambio contesta
 * **304 sin cuerpo**. Si van los dos, **`If-None-Match` tiene precedencia** y el
 * de fecha se ignora salvo que el servidor no soporte ETag — por eso se mandan
 * los dos y decide el servidor.
 *
 * ⚠️ Y AQUÍ NO SIRVE CASI NUNCA, medido el 19/09/2026 contra las fuentes de
 *    verdad (una petición por fuente, con User-Agent identificable):
 *      · IDEZar GeoServer WFS (8 capas) → **ni ETag ni Last-Modified**.
 *      · API de equipamientos de zaragoza.es (16 conjuntos) → emite
 *        `Last-Modified`, **pero en CEST** —RFC 9110 exige GMT— y **no lo
 *        honra**: con su propia fecha, con esa misma fecha bien formada en GMT y
 *        con una fecha futura, las tres veces contestó **200 con el cuerpo
 *        entero**. Un validador decorativo.
 *      · Overpass API → sin validadores.
 *      · NAP → su API no publica huella de fichero (buscado en las dos
 *        definiciones OpenAPI); su cambio se detecta por `fechaActualizacion`, y
 *        de eso ya se encarga `motor/src/renovar-feed.ts`.
 *    La evidencia está en el checkpoint. Conclusión: **el mecanismo real aquí es
 *    el «304 casero»** —bajar y comparar la HUELLA— y el condicional se manda
 *    igual, porque es gratis y porque el día que una fuente empiece a emitir
 *    validadores esto se entera solo (y lo apunta en `validadores`).
 *
 * ── LA HUELLA ES DEL DATO, NO DE LA RESPUESTA ──────────────────────────────
 *
 * ⚠️ Lección de la primera pasada real (19/09, bitácora del mismo día): el WFS
 *    de GeoServer **sella cada respuesta con la hora de esa petición**
 *    (`"timeStamp": "2026-09-19T08:52:12.577Z"`), así que el sha256 del cuerpo
 *    no puede repetirse jamás y los tres primeros conjuntos salieron
 *    «actualizados» con el dato idéntico —2.158 elementos, byte a byte los
 *    mismos—. Un cron así reescribiría el dato cada noche mintiendo en la fecha
 *    de cambio.
 *    Por eso cada conjunto puede declarar `camposVolatiles` (con su fuente): los
 *    campos de primer nivel que el servidor añade **por el hecho de contestar**
 *    y que NO son dato. La comparación se hace sin ellos, contra el fichero que
 *    hay; si lo único que cambia es el sello, **no se toca nada**.
 *
 * ⚠️ Y LA MISMA ENFERMEDAD CON OTRA CARA, medida en esa misma pasada: la API de
 *    equipamientos de zaragoza.es devuelve **los arrays en otro orden** cada vez
 *    (el campo `type` de cada ficha), con el dato idéntico. Seis conjuntos
 *    salieron «actualizados» sin haber cambiado nada. Contra eso,
 *    `ordenVolatil` (con su fuente): la comparación se hace sobre una forma
 *    CANÓNICA —claves ordenadas y arrays ordenados—, que solo se usa para
 *    comparar; lo que se guarda, si hay que guardar, es el cuerpo tal cual vino.
 *
 * ── EL CAMBIO QUE SE VE Y NO SE TOMA ───────────────────────────────────────
 *
 * Un dato nuevo puede mover letra firmada: el 19/09, el censo de aparcamiento
 * de la primera pasada subía la zona azul de 664 a 676 tramos y ponía en rojo
 * 8 juezas del motor. Entrar ese dato **es una decisión**, no una tarea de
 * mantenimiento. Para eso está `cambioNoTomado` en el manifiesto: se apunta la
 * huella que se vio, la fecha y **por qué no se tomó**. Mientras la fuente siga
 * dando exactamente esa huella, el conjunto sale `sin-cambio` diciendo que hay
 * un cambio esperando; si la fuente cambia OTRA VEZ, la nota ya no vale y el
 * conjunto vuelve a cantar. Lo que no se hace nunca es tomarlo en silencio.
 *
 * ── LEY Nº10: LA FRESCURA ES LA HUELLA, NO EL «JOB OK» ─────────────────────
 *
 * Un 200 no es un cambio, y un cron que termina sin error no es un dato fresco.
 * Lo único que dice que algo cambió es que **el sha256 del fichero sea otro**.
 * Por eso cada conjunto acaba la pasada en uno de tres estados, con su fecha:
 *      sin-cambio   · se preguntó y el dato es el mismo (304 o huella igual)
 *      actualizado  · la huella cambió; el fichero nuevo está puesto
 *      fallido      · no se pudo saber, y se dice por qué. El dato viejo, intacto
 *
 * ── EL SWAP, COMO EL DEL GUARDIÁN DE BUILD ─────────────────────────────────
 *
 * Lo nuevo se baja a un TEMPORAL hermano (`<fichero>.tmp`), se valida, y solo
 * entonces se sustituye: el viejo a `<fichero>.anterior`, el nuevo a su sitio,
 * y el respaldo se borra al final. Si el segundo renombrado falla, se restaura.
 * `rename(2)` solo funciona dentro del mismo sistema de ficheros: por eso el
 * temporal es HERMANO y no vive en %TEMP%.
 *
 * ── CORTESÍA ───────────────────────────────────────────────────────────────
 *
 * User-Agent identificable con contacto [el precedente OSMF de la casa], una
 * pausa entre peticiones a la misma casa, reintentos con espera creciente y tope
 * por fuente. ⚠️ Medido el 19/09: tras ~8 peticiones en 4 minutos, los dos
 * servidores municipales dejaron de aceptar conexiones (`UND_ERR_CONNECT_TIMEOUT`)
 * mientras Overpass seguía contestando — o sea que la pausa no es cortesía
 * decorativa: sin ella la pasada se queda sin fuente a media tarea.
 *
 * CÓDIGOS DE SALIDA (la ley de los códigos)
 *      0  la pasada terminó y ningún conjunto quedó en «fallido»
 *      1  algún conjunto acabó FALLIDO — el detalle, escrito
 *      2  el manifiesto no se deja leer o no cuadra consigo mismo
 *      3  no se pudo escribir el manifiesto (la pasada se deshace sola)
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..').split('\\').join('/') + '/';
const MANIFIESTO = RAIZ + 'datapackage.json';
/** La copia que se sirve al navegador. Dos ficheros, una sola verdad. */
const COPIA_SERVIDA = RAIZ + 'app/public/datapackage.json';

/** [OSMF, Tile Usage Policy] quien pide se identifica y deja dónde escribirle. */
const USER_AGENT =
  'Desplazame-mantenimiento/1.0 (+https://github.com/ablanquez/desplazame; mantenimiento de datos abiertos, contacto: ablanquez@gmail.com)';

/** Cortesía entre peticiones a la misma casa. Medido: sin esto, se cierra. */
const PAUSA_POR_DEFECTO_MS = 3_000;
/** Tres intentos, esperando 2 s, 8 s y 32 s. Tope por conjunto. */
const INTENTOS = 3;
const ESPERA_BASE_MS = 2_000;
const ESPERA_MS = 120_000;

const argumentos = process.argv.slice(2);
const SECO = argumentos.includes('--seco');
/** Mirar aunque no toque por cadencia. Para una pasada a mano con motivo. */
const FORZAR = argumentos.includes('--forzar');
const SOLO = argumentos.includes('--solo') ? argumentos[argumentos.indexOf('--solo') + 1] : undefined;
/** Para la jueza: una raíz distinta y una hora fingida, sin tocar el código. */
const RAIZ_DE_PRUEBA = argumentos.includes('--raiz') ? argumentos[argumentos.indexOf('--raiz') + 1] : undefined;
/** La jueza levanta su propia fuente en 127.0.0.1: ahí la cortesía sobra. */
const PAUSA_MS = argumentos.includes('--pausa')
  ? Number(argumentos[argumentos.indexOf('--pausa') + 1])
  : PAUSA_POR_DEFECTO_MS;
const AHORA = argumentos.includes('--ahora')
  ? new Date(argumentos[argumentos.indexOf('--ahora') + 1])
  : new Date();

const BASE = (RAIZ_DE_PRUEBA ?? RAIZ).split('\\').join('/').replace(/\/?$/, '/');
const RUTA_MANIFIESTO = RAIZ_DE_PRUEBA ? BASE + 'datapackage.json' : MANIFIESTO;
const RUTA_COPIA = RAIZ_DE_PRUEBA ? BASE + 'app/public/datapackage.json' : COPIA_SERVIDA;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const esFichero = (r) => !/^(https?:\/\/|\/api\/)/.test(r.path);
const DIA = 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════
//  El manifiesto
// ═══════════════════════════════════════════════════════════════════════════

let paquete;
try {
  paquete = JSON.parse(readFileSync(RUTA_MANIFIESTO, 'utf8'));
  if (!Array.isArray(paquete.resources) || paquete.resources.length === 0) {
    throw new Error('el manifiesto no trae `resources`');
  }
} catch (error) {
  console.error(`✖ EL MANIFIESTO NO SE DEJA LEER (${RUTA_MANIFIESTO}): ${error.message}`);
  process.exit(2);
}

/** ¿Le toca? Vencido = nunca comprobado, o hace más de `vigilanciaDias`. */
function vencido(r) {
  if (FORZAR) return { toca: true, porque: 'a la fuerza (--forzar)' };
  if (!r.comprobadoEl) return { toca: true, porque: 'nunca se ha comprobado' };
  const dias = Math.floor((AHORA.getTime() - Date.parse(r.comprobadoEl)) / DIA);
  return dias >= r.vigilanciaDias
    ? { toca: true, porque: `${dias} días desde la última comprobación (vigilancia: ${r.vigilanciaDias})` }
    : { toca: false, porque: `comprobado hace ${dias} día(s); toca a los ${r.vigilanciaDias}` };
}

// ═══════════════════════════════════════════════════════════════════════════
//  La petición: condicional siempre que haya con qué, y con reintentos
// ═══════════════════════════════════════════════════════════════════════════

async function pedir(url, validadores) {
  const cabeceras = { 'User-Agent': USER_AGENT };
  // [MDN] se mandan los DOS y decide el servidor: con ambos, `If-None-Match`
  // tiene precedencia y la fecha se ignora salvo que no soporte ETag.
  if (validadores?.etag) cabeceras['If-None-Match'] = validadores.etag;
  if (validadores?.lastModified) cabeceras['If-Modified-Since'] = validadores.lastModified;

  let ultimo;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    if (intento > 1) {
      const espera = ESPERA_BASE_MS * 4 ** (intento - 2);
      console.log(`     reintento ${intento}/${INTENTOS} tras ${espera / 1000} s — ${ultimo}`);
      await dormir(espera);
    }
    try {
      const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(ESPERA_MS) });
      const emitidos = {
        etag: r.headers.get('etag'),
        lastModified: r.headers.get('last-modified'),
        medidoEl: AHORA.toISOString(),
      };
      if (r.status === 304) return { estado: 304, emitidos };
      if (!r.ok) {
        ultimo = `HTTP ${r.status} ${r.statusText}`;
        // Un 4xx no se arregla reintentando: es una petición que ya no vale.
        if (r.status >= 400 && r.status < 500) return { fallo: ultimo, emitidos };
        continue;
      }
      const cuerpo = Buffer.from(await r.arrayBuffer());
      return { estado: 200, cuerpo, emitidos, tipo: r.headers.get('content-type') ?? '' };
    } catch (error) {
      // El porqué, hasta el fondo: `fetch failed` a secas no dice nada, y lo
      // que hace falta para un parte honrado es el código de socket.
      ultimo = `${error.name}: ${error.cause?.code ?? error.cause?.errors?.[0]?.code ?? error.cause?.message ?? error.message}`;
    }
  }
  return { fallo: ultimo };
}

/**
 * Lo mínimo que se le exige a lo que llega ANTES de dejarlo entrar:
 *   · que no venga vacío ni ridículamente corto para lo que sustituye,
 *   · y que sea del mismo tipo que lo que hay (un JSON que parsea, si lo era).
 * No valida el contenido: eso es de cada conjunto y de sus juezas.
 */
function valida(cuerpo, ruta, bytesDeclarados) {
  if (cuerpo.length === 0) return 'llega vacío';
  // Una caída de la fuente suele llegar como una página de error de 1 kB con
  // un 200 encima. Contra eso, el suelo: la mitad de lo que ya teníamos.
  const suelo = Math.floor((bytesDeclarados ?? 0) / 2);
  if (suelo > 0 && cuerpo.length < suelo) {
    return `llega con ${cuerpo.length} bytes y lo que sustituye pesa ${bytesDeclarados} (suelo: ${suelo})`;
  }
  if (ruta.endsWith('.json')) {
    try {
      JSON.parse(cuerpo.toString('utf8'));
    } catch (error) {
      return `no es JSON válido: ${error.message.slice(0, 80)}`;
    }
  }
  return null;
}

/**
 * LA FORMA CANÓNICA: el mismo dato escrito siempre igual — claves ordenadas y
 * arrays ordenados—. Solo sirve para COMPARAR: ordenar un array cambiaría el
 * sentido de un dato donde el orden signifique algo, así que esto nunca se
 * escribe a disco y solo se usa donde el conjunto lo declara.
 */
function canonico(valor) {
  if (Array.isArray(valor)) return valor.map(canonico).map((x) => JSON.stringify(x)).sort();
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, canonico(valor[k])]));
  }
  return valor;
}

/**
 * EL DATO SIN ENVOLTORIO, tal y como el conjunto manda mirarlo: sin los campos
 * que el servidor pone por contestar y, si el orden no es dato, en forma
 * canónica. `null` si ese conjunto no declara nada de eso, o si no es JSON.
 */
function desenvuelto(texto, recurso) {
  const volatiles = recurso.camposVolatiles ?? [];
  if (!volatiles.length && !recurso.ordenVolatil) return null;
  try {
    const objeto = JSON.parse(texto);
    for (const campo of volatiles) delete objeto[campo];
    return JSON.stringify(recurso.ordenVolatil ? canonico(objeto) : objeto);
  } catch {
    return null;
  }
}

/**
 * LA HUELLA CON LA QUE SE COMPARA: la del dato desenvuelto donde lo haya, y la
 * del cuerpo entero donde no. ⚠️ No es la que se declara en el manifiesto —esa
 * es la del FICHERO tal cual se guarda—: es la que permite comparar dos
 * respuestas de una fuente que nunca contesta dos veces igual.
 */
function huellaComparable(texto, recurso) {
  const limpio = desenvuelto(texto, recurso);
  return 'sha256:' + createHash('sha256').update(limpio ?? texto).digest('hex');
}

/**
 * ¿Es el mismo dato que el que ya está en disco, mirándolo como el conjunto
 * manda? Devuelve el porqué si lo es, o `null` si de verdad ha cambiado (o si
 * no se puede comparar así).
 */
function mismoDato(cuerpo, ruta, recurso) {
  if (!existsSync(ruta)) return null;
  const nuevo = desenvuelto(cuerpo.toString('utf8'), recurso);
  if (nuevo === null) return null;
  if (nuevo !== desenvuelto(readFileSync(ruta, 'utf8'), recurso)) return null;
  const motivos = [
    recurso.camposVolatiles?.length ? `el sello de la respuesta (${recurso.camposVolatiles.join(', ')})` : '',
    recurso.ordenVolatil ? 'el orden en que vienen los arrays' : '',
  ].filter(Boolean);
  return motivos.join(' y ');
}

/**
 * EL SWAP, el mismo patrón que el guardián de build: temporal HERMANO, respaldo
 * conservado, y restauración si el segundo renombrado falla.
 */
const renombrar = (origen, destino, paso) => renameSync(origen, destino);

function publicar(ruta, cuerpo) {
  const tmp = ruta + '.tmp';
  const anterior = ruta + '.anterior';
  for (const resto of [tmp, anterior]) if (existsSync(resto)) rmSync(resto, { force: true });

  writeFileSync(tmp, cuerpo);
  const habia = existsSync(ruta);
  if (habia) renombrar(ruta, anterior, 1);
  try {
    renombrar(tmp, ruta, 2);
  } catch (error) {
    if (habia) {
      renombrar(anterior, ruta, 3);
      rmSync(tmp, { force: true });
      throw new Error(`el swap falló y se RESTAURÓ el fichero anterior: ${error.message}`);
    }
    throw error;
  }
  if (habia) rmSync(anterior, { force: true });
}

// ═══════════════════════════════════════════════════════════════════════════
//  La pasada
// ═══════════════════════════════════════════════════════════════════════════

const informe = [];
let huboCambio = false;

console.log(`mantener-datos · ${AHORA.toISOString()} · ${BASE}${SECO ? ' · EN SECO (no escribe)' : ''}`);
console.log('');

for (const r of paquete.resources) {
  if (SOLO && r.name !== SOLO) continue;

  // Los que no son fichero de este repositorio no tienen copia que envejezca.
  if (!esFichero(r)) {
    informe.push({ name: r.name, estado: 'no-vigilable', porque: 'fuente viva: se consulta y no se copia' });
    continue;
  }
  if (!r.peticion) {
    informe.push({
      name: r.name,
      estado: 'no-vigilable',
      porque: 'NO CONSTA cómo se vuelve a pedir: ni sus cabeceras guardadas ni el notices traen la petición',
    });
    continue;
  }

  const cuando = vencido(r);
  if (!cuando.toca) {
    informe.push({ name: r.name, estado: 'sin-cambio', porque: `no tocaba: ${cuando.porque}`, fecha: r.comprobadoEl });
    continue;
  }

  console.log(`  · ${r.name} — ${cuando.porque}`);
  await dormir(PAUSA_MS);
  const respuesta = await pedir(r.peticion, r.validadores);

  if (respuesta.fallo) {
    // ⭐ El fallo se GUARDA junto al conjunto, no solo se imprime: un parte que
    //    se va con la terminal deja al conjunto en silencio hasta la próxima.
    //    `comprobadoEl` NO se toca: no se ha podido comprobar nada.
    if (!SECO) r.ultimoIntento = { fecha: AHORA.toISOString(), fallo: respuesta.fallo };
    informe.push({ name: r.name, estado: 'fallido', porque: respuesta.fallo, fecha: AHORA.toISOString() });
    console.log(`     ✖ FALLIDO: ${respuesta.fallo} — el dato de ahora sigue INTACTO`);
    continue;
  }

  // Los validadores que haya emitido se guardan SIEMPRE, conteste lo que conteste.
  const validadores = respuesta.emitidos;

  if (respuesta.estado === 304) {
    if (!SECO) {
      r.comprobadoEl = AHORA.toISOString();
      r.validadores = validadores;
    }
    informe.push({ name: r.name, estado: 'sin-cambio', porque: '304 del servidor', fecha: AHORA.toISOString() });
    console.log('     304 — sin cambio');
    continue;
  }

  const problema = valida(respuesta.cuerpo, r.path, r.bytes);
  if (problema) {
    informe.push({ name: r.name, estado: 'fallido', porque: `lo que llega no vale: ${problema}`, fecha: AHORA.toISOString() });
    console.log(`     ✖ FALLIDO: ${problema} — el dato de ahora sigue INTACTO`);
    continue;
  }

  // ⭐ LEY Nº10: el 200 no decide nada. Decide la HUELLA.
  const huella = 'sha256:' + createHash('sha256').update(respuesta.cuerpo).digest('hex');
  if (r.hash && huella === r.hash) {
    if (!SECO) {
      r.comprobadoEl = AHORA.toISOString();
      r.validadores = validadores;
    }
    informe.push({
      name: r.name,
      estado: 'sin-cambio',
      porque: `200, pero la huella es la misma (el 304 casero): ${respuesta.cuerpo.length} bytes`,
      fecha: AHORA.toISOString(),
    });
    console.log(`     200 · huella idéntica — sin cambio (${respuesta.cuerpo.length} bytes bajados en balde: la fuente no sabe decir 304)`);
    continue;
  }

  // ⭐ Y SI LO ÚNICO QUE CAMBIA ES CÓMO VIENE ENVUELTO, no hay cambio.
  //    Se compara contra EL FICHERO QUE HAY, no contra la huella declarada: la
  //    huella declarada es la del fichero entero, envoltorio incluido.
  const soloElEnvoltorio = mismoDato(respuesta.cuerpo, BASE + r.path, r);
  if (soloElEnvoltorio) {
    if (!SECO) {
      r.comprobadoEl = AHORA.toISOString();
      r.validadores = validadores;
    }
    informe.push({
      name: r.name,
      estado: 'sin-cambio',
      porque: `200, y lo único que cambia es ${soloElEnvoltorio}`,
      fecha: AHORA.toISOString(),
    });
    console.log(`     200 · solo cambia ${soloElEnvoltorio} — sin cambio, el fichero NO se toca`);
    continue;
  }

  // ⭐ ¿Es un cambio que YA se vio y se decidió no tomar? Entonces no es noticia.
  //    Se compara con la huella COMPARABLE: una fuente que sella la hora no
  //    devuelve dos veces el mismo cuerpo ni cuando el dato es idéntico.
  if (r.cambioNoTomado?.huella === huellaComparable(respuesta.cuerpo.toString('utf8'), r)) {
    if (!SECO) {
      r.comprobadoEl = AHORA.toISOString();
      r.validadores = validadores;
    }
    informe.push({
      name: r.name,
      estado: 'sin-cambio',
      porque: `hay cambio ESPERANDO desde ${r.cambioNoTomado.fecha}, y no se toma: ${r.cambioNoTomado.porque}`,
      fecha: AHORA.toISOString(),
    });
    console.log(`     200 · cambio VISTO y NO TOMADO (${r.cambioNoTomado.fecha}) — el fichero NO se toca`);
    continue;
  }

  if (SECO) {
    informe.push({
      name: r.name,
      estado: 'actualizado',
      porque: `EN SECO: la huella cambiaría a ${huella.slice(0, 19)}… (${respuesta.cuerpo.length} bytes)`,
      fecha: AHORA.toISOString(),
    });
    console.log(`     200 · HUELLA DISTINTA — en seco no se escribe`);
    huboCambio = true;
    continue;
  }

  try {
    publicar(BASE + r.path, respuesta.cuerpo);
  } catch (error) {
    informe.push({ name: r.name, estado: 'fallido', porque: `no se pudo publicar: ${error.message}`, fecha: AHORA.toISOString() });
    console.log(`     ✖ FALLIDO al publicar: ${error.message}`);
    continue;
  }

  const antes = r.hash;
  r.hash = huella;
  r.bytes = statSync(BASE + r.path).size;
  r.descargadoEl = AHORA.toISOString(); // la fecha de CAMBIO
  r.comprobadoEl = AHORA.toISOString(); // la fecha de COMPROBACIÓN: son dos
  r.validadores = validadores;
  huboCambio = true;
  informe.push({
    name: r.name,
    estado: 'actualizado',
    porque: `huella ${String(antes).slice(7, 19)}… → ${huella.slice(7, 19)}… · ${r.bytes} bytes`,
    fecha: r.descargadoEl,
  });
  console.log(`     ✔ ACTUALIZADO · ${r.bytes} bytes · huella nueva`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  El manifiesto, a disco — las dos copias o ninguna
// ═══════════════════════════════════════════════════════════════════════════

if (!SECO) {
  const texto = JSON.stringify(paquete, null, 2) + '\n';
  try {
    publicar(RUTA_MANIFIESTO, Buffer.from(texto, 'utf8'));
    publicar(RUTA_COPIA, Buffer.from(texto, 'utf8'));
  } catch (error) {
    console.error(`✖ NO SE PUDO ESCRIBIR EL MANIFIESTO: ${error.message}`);
    process.exit(3);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  El parte: TODO conjunto sale nombrado. Ninguno en silencio.
// ═══════════════════════════════════════════════════════════════════════════

const cuenta = (e) => informe.filter((i) => i.estado === e).length;
console.log('\n═══ EL PARTE ═══');
for (const i of informe) {
  const marca = { actualizado: '⭐', 'sin-cambio': '·', fallido: '✖', 'no-vigilable': '–' }[i.estado];
  console.log(`${marca} ${i.name.padEnd(28)} ${i.estado.padEnd(13)} ${i.porque}`);
}
console.log(
  `\n${informe.length} conjuntos · ${cuenta('actualizado')} actualizados · ${cuenta('sin-cambio')} sin cambio · ` +
    `${cuenta('fallido')} fallidos · ${cuenta('no-vigilable')} no vigilables`,
);
if (huboCambio && !SECO) {
  console.log('\n⚠️  HAY DATO NUEVO: el manifiesto ya lo dice. Falta mirar qué mueve —la batería entera— y commitear.');
}
process.exit(cuenta('fallido') > 0 ? 1 : 0);
