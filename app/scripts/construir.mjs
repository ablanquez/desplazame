/**
 * construir — EL GUARDIÁN DE BUILD ATÓMICO: construye a un temporal y solo
 * PUBLICA si la build ha salido entera.
 *
 * Nace del punto que la tanda 5 dejó en la cola con prioridad alta:
 * *«⚠️ build fallida BORRA dist → 404 en producción»*.
 *
 * POR QUÉ HACE FALTA (y no es una precaución teórica)
 *   · La documentación de Angular lo dice de frente: `ng build` y `ng serve`
 *     **vacían la carpeta de salida antes de construir**. O sea que el riesgo no
 *     es un fallo raro: es comportamiento documentado. Una build que se cae a
 *     mitad —un presupuesto superado, un error de tipos, un Ctrl-C— deja
 *     `app/dist/` vacío o a medias.
 *   · Y aquí `app/dist/` **está versionado** (ver `app/README.md`: el CLI de
 *     Angular no corre en el panel de Hostinger) y **el `git push` ES el
 *     despliegue** (auto-deploy por cron desde `main`). Un `dist` a medias
 *     empujado es un 404 en producción.
 *   · La salida es configurable por la vía oficial —`outputPath` del builder,
 *     `--output-path` en el CLI—, así que el temporal NO exige tocar
 *     `angular.json` de forma permanente. Se pasa por la línea de órdenes.
 *
 * LA MECÁNICA DEL SWAP, dicha como es
 *   `fs.rename` de Node es un envoltorio de `rename(2)`, y `rename(2)` tiene dos
 *   límites que mandan en el diseño de este guion:
 *     1. Solo funciona **dentro del mismo sistema de ficheros** (entre volúmenes
 *        da `EXDEV`). Por eso el temporal va **HERMANO** del `dist`:
 *        `<dist>-tmp` al lado de `<dist>`, nunca en `%TEMP%`.
 *     2. **No reemplaza un directorio que no esté vacío** (`ENOTEMPTY`). Por eso
 *        el reemplazo son **DOS renombrados**:
 *              paso 1:  dist      → dist-anterior
 *              paso 2:  dist-tmp  → dist
 *   ⚠️ Entre los dos pasos hay una VENTANA en la que `dist` no existe. Va dicha,
 *      no fingida: esto **no es atomicidad**, es un diseño declarado. Dura lo que
 *      tarda un renombrado de directorio en el mismo volumen (microsegundos), y
 *      `dist-anterior` **se conserva hasta el final** justamente para poder
 *      deshacer si el paso 2 falla. Si algo revienta ahí, se restaura y se dice.
 *
 * QUÉ HACE, en orden
 *   0. Prepara el terreno: si un intento anterior dejó restos, los retira —y si
 *      los dejó en el estado de la ventana (`dist` ausente y `dist-anterior`
 *      presente), RESCATA el anterior antes de nada.
 *   1. Construye **al temporal hermano**, con la vía oficial.
 *   2. Verifica: salida 0 · `index.html` · un bundle `main-*.js` · y que el
 *      `index.html` lo NOMBRE (un bundle que nadie carga no es una build).
 *   3. Swap por los dos renombrados, con restauración automática si falla el 2.
 *   4. Escribe LA MARCA `<dist>/.build-ok` —fecha, bundle, sha256 y cuántos
 *      ficheros— y borra el respaldo.
 *
 * ⚠️ La marca vive en la RAÍZ del `dist`, no dentro de `browser/`: lo que el
 *    motor sirve a la web es `dist/desplazame/browser/`, así que desde fuera no
 *    se puede leer. Es una marca para nosotros, no un fichero de la app.
 *
 * QUÉ **NO** HACE — los límites, dichos y no escondidos:
 *   · No despliega, no hace commit y no empuja. El `push` es de Antonio, a mano.
 *   · No comprueba que la app FUNCIONE: eso son las diez suites del arnés.
 *   · No protege de un `ng build` lanzado a mano por fuera de este guion. Para
 *     eso está `--comprobar`, que es la comprobación previa al commit del
 *     `dist`, y la jueza `app/src/app/construir.spec.ts`, que la corre sola
 *     contra el `dist` real en cada batería de unidad.
 *
 * CÓDIGOS DE SALIDA (la ley de los códigos: cualquier fallo sale ≠ 0)
 *      0  todo bien
 *      1  la build falló .......................... dist ANTERIOR intacto
 *      2  la build salió 0 pero no dejó build ..... dist ANTERIOR intacto
 *      3  el primer renombrado falló ............. dist ANTERIOR intacto
 *      4  el segundo renombrado falló → RESTAURADO  dist ANTERIOR intacto
 *      5  falló el segundo Y la restauración ...... ESTADO ROTO, con las rutas
 *      6  la build SÍ está puesta, pero el respaldo no se deja borrar
 *      7  no se pudo preparar el terreno .......... dist ANTERIOR intacto
 *     10  --comprobar: no hay dist
 *     11  --comprobar: no hay marca (`.build-ok`)
 *     12  --comprobar: la marca está incompleta o ilegible
 *     13  --comprobar: el bundle que nombra la marca no está
 *     14  --comprobar: el sha256 del bundle no cuadra con la marca
 *     15  --comprobar: el index.html no nombra ese bundle
 *     16  --comprobar: hay restos de un swap a medias al lado
 *     17  la INTRANET se ha colado en el dist (visor, panel o dato sin
 *         publicar) — al construir, antes del swap; y en --comprobar
 *
 * USO
 *   node scripts/construir.mjs                  → construye y publica
 *   node scripts/construir.mjs --comprobar      → ¿el dist lleva su marca?
 *   node scripts/construir.mjs --dist <ruta>    → otro dist (la jueza)
 *   node scripts/construir.mjs --orden <g.mjs>  → un guion de Node que hace de
 *                                                 build y escribe en `$SALIDA`
 *                                                 (la vía de la contraprueba:
 *                                                 así el fallo y el éxito son
 *                                                 deterministas y baratos)
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Lo que hay dentro del `dist`: el proyecto y, dentro, la raíz que se sirve. */
const SUBRUTA = 'desplazame/browser';
const MARCA = '.build-ok';

const argumentos = process.argv.slice(2);
const valorDe = (bandera) => {
  const i = argumentos.indexOf(bandera);
  return i >= 0 ? argumentos[i + 1] : undefined;
};

const DIST = (valorDe('--dist') ?? join(APP, 'dist')).split('\\').join('/');
/** Los dos hermanos, EN EL MISMO VOLUMEN — la condición de `rename(2)`. */
const TMP = DIST + '-tmp';
const ANTERIOR = DIST + '-anterior';
const ORDEN = valorDe('--orden');

const decir = (linea) => console.log(linea);

/**
 * Borrado con reintentos. Windows deniega el borrado de un directorio que
 * alguien acaba de soltar (el antivirus, el indexador, un `node` que aún no ha
 * cerrado su descriptor), y el reintento lo resuelve casi siempre. La espera es
 * BLOQUEANTE a propósito: este guion es síncrono de punta a punta.
 */
function borrar(ruta) {
  for (let intento = 1; intento <= 12; intento++) {
    try {
      rmSync(ruta, { recursive: true, force: true, maxRetries: 3, retryDelay: 80 });
      if (!existsSync(ruta)) return true;
    } catch {
      /* se reintenta */
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 120);
  }
  return !existsSync(ruta);
}

/** El renombrado, en UNA línea y con su número de paso: la jueza sabotea ESTA. */
const renombrar = (origen, destino, paso) => renameSync(origen, destino);

const shaDe = (ruta) => createHash('sha256').update(readFileSync(ruta)).digest('hex');

/** Cuántos ficheros cuelgan de un directorio, contando los de dentro. */
function contarFicheros(dir) {
  let cuantos = 0;
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    cuantos += statSync(ruta).isDirectory() ? contarFicheros(ruta) : 1;
  }
  return cuantos;
}

/** El bundle versionado de una raíz servida: `main-<hash>.js`. */
function bundleDe(raiz) {
  if (!existsSync(raiz)) return undefined;
  return readdirSync(raiz).find((n) => /^main-[A-Za-z0-9]+\.js$/.test(n));
}

function salir(codigo, motivo) {
  decir(motivo);
  process.exit(codigo);
}

// ═══════════════════════════════════════════════════════════════════════════
//  LA INTRANET NO VIAJA — el invariante que compra la firma del 19/09
// ═══════════════════════════════════════════════════════════════════════════
//
// Antonio firmó ACCESO SOLO-LOCAL: el visor de capas y el panel de frescura no
// se despliegan. El mecanismo es el `fileReplacements` de `angular.json`, que
// en la configuración `production` cambia `rutas-intranet.ts` por el vacío; sin
// esos `loadComponent`, el constructor no ve las importaciones y **los trozos
// no se generan**.
//
// ⚠️ Pero un mecanismo no es una garantía: basta con que alguien construya con
//    otra configuración, o le quite el reemplazo sin darse cuenta, para que la
//    intranet entera acabe en el dist que se empuja —y el push ES el
//    despliegue—. Nadie lo notaría: la app pública seguiría funcionando igual.
//
// Por eso esto no mira el código fuente ni la configuración: **abre el dist
// CONSTRUIDO y busca los rastros dentro**. Se comprueba lo que se publica, no
// lo que se quiso publicar.
//
// [OWASP ASVS 2.32] las interfaces administrativas no deben ser accesibles a
// partes no confiables; el extremo fuerte —el de la DevGuide— es que no lo sean
// desde internet. Esto es lo que lo hace comprobable en vez de opinable.

/**
 * Los selectores que Angular deja escritos en el paquete de cada componente.
 * Si alguno aparece en un `.js` del dist, esa página se ha construido dentro.
 */
const RASTROS_DE_INTRANET = ['app-visor', 'app-mapa-de-capas', 'app-panel'];

/**
 * Lo ÚNICO que puede vivir en `<raiz>/data/`: la ZBE, que la pinta el buscador
 * y es pública desde el 2/09. Los otros 17 ficheros —40,72 MiB, el grafo y los
 * portales entre ellos— son los que alimentan el visor, y no se publican.
 */
const DATOS_QUE_SI_VIAJAN = new Set(['2026-09-02_wfs_movilidad-MU1_ZBE.json']);

/** Todos los ficheros que cuelgan de un directorio, con su ruta relativa. */
function ficherosDe(dir, prefijo = '') {
  if (!existsSync(dir)) return [];
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...ficherosDe(ruta, prefijo + nombre + '/'));
    else salida.push({ rel: prefijo + nombre, ruta });
  }
  return salida;
}

/**
 * ¿Se ha colado la intranet en este dist? Devuelve la lista de hallazgos —vacía
 * si está limpio—. No sale del guion: quien llama decide con qué código morir.
 */
function rastrosDeIntranetEn(raiz) {
  const hallazgos = [];

  for (const { rel, ruta } of ficherosDe(raiz)) {
    if (!rel.endsWith('.js')) continue;
    const texto = readFileSync(ruta, 'utf8');
    for (const rastro of RASTROS_DE_INTRANET) {
      if (texto.includes(rastro)) hallazgos.push(`«${rastro}» dentro de ${rel}`);
    }
  }

  for (const { rel } of ficherosDe(join(raiz, 'data'))) {
    if (!DATOS_QUE_SI_VIAJAN.has(rel)) hallazgos.push(`dato que no debe publicarse: data/${rel}`);
  }

  return hallazgos;
}

// ═══════════════════════════════════════════════════════════════════════════
//  --comprobar — LA NEGATIVA: un dist sin su marca completa no se empuja
// ═══════════════════════════════════════════════════════════════════════════

if (argumentos.includes('--comprobar')) {
  decir(`comprobando la marca de ${DIST}`);

  if (!existsSync(DIST)) salir(10, `✖ NO HAY dist en ${DIST}`);
  if (existsSync(TMP) || existsSync(ANTERIOR)) {
    salir(
      16,
      `✖ HAY RESTOS DE UN SWAP A MEDIAS al lado del dist:` +
        `${existsSync(TMP) ? `\n   ${TMP}` : ''}${existsSync(ANTERIOR) ? `\n   ${ANTERIOR}` : ''}` +
        `\n   Una build se quedó a mitad. Revísalo antes de commitear nada.`,
    );
  }

  const rutaMarca = join(DIST, MARCA);
  if (!existsSync(rutaMarca)) {
    salir(
      11,
      `✖ EL DIST NO LLEVA MARCA (${MARCA}): no lo ha construido este guardián, ` +
        `así que nadie puede decir que la build salió entera.\n` +
        `   Reconstruye con: npm run construir --workspace desplazame`,
    );
  }

  let marca;
  try {
    marca = JSON.parse(readFileSync(rutaMarca, 'utf8'));
  } catch (error) {
    salir(12, `✖ LA MARCA NO SE DEJA LEER: ${error.message}`);
  }
  for (const campo of ['fecha', 'bundle', 'sha256', 'ficheros']) {
    if (marca[campo] === undefined) salir(12, `✖ LA MARCA ESTÁ INCOMPLETA: le falta «${campo}»`);
  }

  const raiz = join(DIST, SUBRUTA);
  const bundle = join(raiz, marca.bundle);
  if (!existsSync(bundle)) salir(13, `✖ LA MARCA NOMBRA UN BUNDLE QUE NO ESTÁ: ${marca.bundle}`);

  const sha = shaDe(bundle);
  if (sha !== marca.sha256) {
    salir(
      14,
      `✖ EL SHA256 DEL BUNDLE NO CUADRA CON LA MARCA\n` +
        `   marca : ${marca.sha256}\n   ahora : ${sha}`,
    );
  }

  const indice = readFileSync(join(raiz, 'index.html'), 'utf8');
  if (!indice.includes(marca.bundle)) {
    salir(15, `✖ EL index.html NO NOMBRA el bundle de la marca (${marca.bundle})`);
  }

  const rastros = rastrosDeIntranetEn(raiz);
  if (rastros.length > 0) {
    salir(
      17,
      `✖ LA INTRANET SE HA COLADO EN EL DIST — y el push es el despliegue:\n` +
        rastros.map((r) => `   · ${r}`).join('\n') +
        `\n   Firmado el 19/09: acceso SOLO-LOCAL. Construye con` +
        ` \`npm run construir\` (production), no con \`--configuration local\`.`,
    );
  }

  decir(
    `✔ marca completa · ${marca.bundle} · sha ${sha.slice(0, 12)}… · ` +
      `${marca.ficheros} ficheros · construido ${marca.fecha}`,
  );
  decir(`✔ sin rastro de intranet: ni visor, ni panel, ni dato sin publicar`);
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
//  construir — el camino entero
// ═══════════════════════════════════════════════════════════════════════════

decir(`⚙️  construyendo a ${TMP} (hermano de ${DIST}, mismo volumen)`);

// ── 0 · el terreno ─────────────────────────────────────────────────────────
// El estado de la ventana: `dist` ausente y respaldo presente. Es exactamente
// lo que deja un corte de luz entre los dos renombrados, y se rescata.
if (!existsSync(DIST) && existsSync(ANTERIOR)) {
  try {
    renombrar(ANTERIOR, DIST, 0);
    decir(`⚠️  RESCATADO: había un dist a medias de un intento anterior — ${ANTERIOR} → ${DIST}`);
  } catch (error) {
    salir(7, `✖ NO SE PUDO RESCATAR ${ANTERIOR} → ${DIST}: ${error.message}`);
  }
}
for (const resto of [TMP, ANTERIOR]) {
  if (existsSync(resto) && !borrar(resto)) {
    salir(7, `✖ NO SE PUEDE RETIRAR EL RESTO ${resto} — el dist de ahora NO se ha tocado`);
  }
}

// ── 1 · la build, al temporal ──────────────────────────────────────────────
const salidaDeBuild = ORDEN
  ? spawnSync(process.execPath, [ORDEN], { stdio: 'inherit', env: { ...process.env, SALIDA: TMP } })
  : spawnSync(
      process.execPath,
      [
        // Por el fichero del CLI y con ESTE Node, no por `npx`: `npx.cmd` sin
        // shell revienta con EINVAL en Windows [lección de comprobar-tipos.mjs].
        createRequire(join(APP, 'package.json')).resolve('@angular/cli/bin/ng.js'),
        'build',
        // La vía OFICIAL para mover la salida, sin tocar angular.json.
        '--output-path',
        join(TMP, 'desplazame'),
      ],
      { stdio: 'inherit', cwd: APP },
    );

if (salidaDeBuild.status !== 0) {
  borrar(TMP);
  salir(
    1,
    `✖ LA BUILD FALLÓ (salida ${salidaDeBuild.status}). El dist de ahora sigue INTACTO: ${DIST}`,
  );
}

// ── 2 · la verificación ────────────────────────────────────────────────────
const raizNueva = join(TMP, SUBRUTA);
const faltan = [];
if (!existsSync(join(raizNueva, 'index.html'))) faltan.push('index.html');
const bundleNuevo = bundleDe(raizNueva);
if (!bundleNuevo) faltan.push('el bundle versionado main-*.js');
if (!faltan.length && !readFileSync(join(raizNueva, 'index.html'), 'utf8').includes(bundleNuevo)) {
  faltan.push(`el index.html no nombra ${bundleNuevo}`);
}
if (faltan.length) {
  borrar(TMP);
  salir(
    2,
    `✖ LA BUILD SALIÓ 0 PERO NO ESTÁ ENTERA — falta: ${faltan.join(' · ')}. ` +
      `El dist de ahora sigue INTACTO: ${DIST}`,
  );
}

// ⭐ Y LA INTRANET, ANTES DEL SWAP (19/09). Se mira el dist RECIÉN construido
//    mientras todavía está en el temporal: si se ha colado el visor o el panel,
//    el dist bueno **ni se toca**. Es la misma ley que el resto del guardián —
//    una build sucia no sustituye a una limpia.
const rastrosNuevos = rastrosDeIntranetEn(raizNueva);
if (rastrosNuevos.length > 0) {
  borrar(TMP);
  salir(
    17,
    `✖ LA BUILD LLEVA LA INTRANET DENTRO, y el push es el despliegue:\n` +
      rastrosNuevos.map((r) => `   · ${r}`).join('\n') +
      `\n   El dist de ahora sigue INTACTO: ${DIST}`,
  );
}

// ── 3 · el swap: dos renombrados, con el respaldo conservado ───────────────
const habiaDist = existsSync(DIST);
if (habiaDist) {
  try {
    renombrar(DIST, ANTERIOR, 1);
  } catch (error) {
    borrar(TMP);
    salir(3, `✖ NO SE PUDO APARTAR EL DIST (${DIST} → ${ANTERIOR}): ${error.message}. Sigue INTACTO.`);
  }
}
// ⚠️ LA VENTANA: aquí `dist` no existe. Dura un renombrado.
try {
  renombrar(TMP, DIST, 2);
} catch (error) {
  const fallo = error.message;
  if (habiaDist) {
    try {
      renombrar(ANTERIOR, DIST, 3);
      borrar(TMP);
      salir(
        4,
        `✖ EL SEGUNDO RENOMBRADO FALLÓ (${TMP} → ${DIST}): ${fallo}\n` +
          `   RESTAURADO el dist anterior desde ${ANTERIOR}: está como estaba, al byte.`,
      );
    } catch (otro) {
      salir(
        5,
        `✖✖ ESTADO ROTO — falló el segundo renombrado Y la restauración.\n` +
          `   el nuevo está en : ${TMP}\n   el anterior en   : ${ANTERIOR}\n` +
          `   el dist debería ir en: ${DIST}\n   swap: ${fallo}\n   restauración: ${otro.message}`,
      );
    }
  }
  salir(3, `✖ NO SE PUDO PONER EL DIST NUEVO (${TMP} → ${DIST}): ${fallo}. No había dist previo.`);
}

// ── 4 · la marca, y a barrer ───────────────────────────────────────────────
const raizPuesta = join(DIST, SUBRUTA);
const marca = {
  fecha: new Date().toISOString(),
  bundle: bundleNuevo,
  sha256: shaDe(join(raizPuesta, bundleNuevo)),
  ficheros: contarFicheros(DIST),
};
writeFileSync(join(DIST, MARCA), JSON.stringify(marca, null, 2) + '\n');

decir(
  `✔ PUBLICADO ${DIST}\n` +
    `   bundle   : ${marca.bundle} (${statSync(join(raizPuesta, marca.bundle)).size} bytes)\n` +
    `   sha256   : ${marca.sha256}\n` +
    `   ficheros : ${marca.ficheros}\n` +
    `   marca    : ${MARCA} · ${marca.fecha}`,
);

if (habiaDist && !borrar(ANTERIOR)) {
  salir(
    6,
    `⚠️  LA BUILD SÍ ESTÁ PUESTA, pero el respaldo no se deja borrar: ${ANTERIOR}\n` +
      `   Bórralo a mano antes de commitear, o el árbol no queda limpio.`,
  );
}
process.exit(0);
