// ⚠️ Módulos de Node: existen en tiempo de ejecución (las pruebas corren sobre
// Node) pero NO tienen tipos aquí — el proyecto no trae `@types/node` porque
// las dependencias son CERO. Misma costura que `manifiesto.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
// @ts-expect-error — idem
import { spawnSync } from 'node:child_process';
// @ts-expect-error — idem
import { createHash } from 'node:crypto';
// @ts-expect-error — idem
import { tmpdir } from 'node:os';

/**
 * ⭐ LA JUEZA DEL GUARDIÁN DE BUILD ATÓMICO (18/09, punto de la cola con
 *    prioridad alta desde la tanda 5 del PLAN: «⚠️ build fallida BORRA dist →
 *    404 en producción»).
 *
 * QUÉ VIGILA, y por qué cada cosa:
 *
 *   1. Que una build FALLIDA no toque **ni un byte** del `dist` anterior. Esto
 *      no es una precaución teórica: la documentación de Angular dice que
 *      `ng build` **vacía la carpeta de salida antes de construir**, así que un
 *      fallo a mitad deja el `dist` vacío o a medias — y aquí el `dist` está
 *      versionado y el `git push` ES el despliegue, o sea 404 en producción.
 *      Se mide con la HUELLA del árbol (sha256 de nombre+tamaño+sha de cada
 *      fichero): antes == después, o rojo.
 *
 *   2. Que una build que sale 0 **pero no deja el bundle versionado** tampoco
 *      se publique. Salir 0 no es haber construido.
 *
 *   3. Que una build BUENA deje el `dist` nuevo **con su marca** (`.build-ok`)
 *      y sin restos del swap.
 *
 *   4. LA CONTRAPRUEBA DEL PROPIO SWAP: el segundo renombrado forzado a fallar
 *      **en una copia del guion** —nunca en el guion de verdad, que no se rompe
 *      para ver el rojo— tiene que RESTAURAR el `dist` anterior y decirlo.
 *
 *   5. Que `--comprobar` sepa negarse: sin marca, con marca que no cuadra con
 *      el bundle, o con restos de un swap a medias.
 *
 *   6. Y LA NEGATIVA DE VERDAD, sobre el `dist` REAL de este repositorio: el
 *      que está versionado tiene que llevar su marca completa. Es la comprobación
 *      previa al commit del `dist` [la letra del PLAN: «el paso de push local
 *      debe negarse a empujar un dist sin su marca de build completa»], y vive
 *      aquí porque aquí se ejecuta sola en cada batería.
 *
 * ⚠️ La build de verdad NO se lanza desde esta jueza: tarda medio minuto y no
 *    es lo que se juzga. Lo que se juzga es el GUARDIÁN, y por eso el guion
 *    acepta `--orden <guion.mjs>` — un guion de Node que hace de build y escribe
 *    en `$SALIDA` lo que se le diga—. Así el fallo, el éxito y el bundle ausente
 *    son deterministas y baratos.
 */
declare const process: {
  cwd(): string;
  execPath: string;
  env: Record<string, string | undefined>;
};

const RAIZ = ((): string => {
  // Subiendo hasta dar con el manifiesto, como en `manifiesto.spec.ts`: en el
  // empaquetado de las pruebas `import.meta.url` no es de esquema `file:`.
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/datapackage.json')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro datapackage.json subiendo desde ' + process.cwd());
})();

const GUION = RAIZ + 'app/scripts/construir.mjs';

/** sha256 de un fichero, en hexadecimal. */
const shaDe = (ruta: string): string =>
  createHash('sha256').update(readFileSync(ruta)).digest('hex');

/**
 * LA HUELLA de un árbol: cada fichero con su ruta relativa, su tamaño y su
 * sha256, ordenados, y un sha256 de todo eso. Dos árboles con la misma huella
 * son el mismo árbol **al byte**; uno vacío tiene la suya propia, distinta de
 * la de «no existe».
 */
function huella(dir: string): string {
  if (!existsSync(dir)) return '(no existe)';
  const filas: string[] = [];
  const recorrer = (d: string, prefijo: string): void => {
    for (const nombre of readdirSync(d).sort()) {
      const ruta = d + '/' + nombre;
      if (statSync(ruta).isDirectory()) recorrer(ruta, prefijo + nombre + '/');
      else filas.push(prefijo + nombre + ':' + statSync(ruta).size + ':' + shaDe(ruta));
    }
  };
  recorrer(dir, '');
  return createHash('sha256').update(filas.join('\n')).digest('hex');
}

/** Un banco de pruebas: carpeta temporal con un `dist` anterior dentro. */
function bancoConDistAnterior(): { base: string; dist: string } {
  const base = mkdtempSync(tmpdir() + '/jueza-construir-').split('\\').join('/');
  const dist = base + '/dist';
  mkdirSync(dist + '/desplazame/browser', { recursive: true });
  writeFileSync(
    dist + '/desplazame/browser/index.html',
    '<!doctype html><html><body><app-root></app-root><script src="main-VIEJO000.js"></script></body></html>',
  );
  writeFileSync(dist + '/desplazame/browser/main-VIEJO000.js', 'console.log("el de ayer");\n');
  writeFileSync(dist + '/desplazame/browser/styles-VIEJO000.css', 'body{color:#000}\n');
  writeFileSync(dist + '/.build-ok', JSON.stringify({ fecha: '2026-09-17T00:00:00.000Z', bundle: 'main-VIEJO000.js' }));
  return { base, dist };
}

/** Un guion de Node que hace de build: escribe en `$SALIDA` lo que se le pida. */
function ordenQueEscribe(base: string, nombre: string, cuerpo: string): string {
  const ruta = base + '/' + nombre;
  writeFileSync(ruta, cuerpo);
  return ruta;
}

const BUILD_BUENA = `
import { mkdirSync, writeFileSync } from 'node:fs';
const salida = process.env.SALIDA + '/desplazame/browser';
mkdirSync(salida, { recursive: true });
writeFileSync(salida + '/main-NUEVO111.js', 'console.log("el de hoy");\\n');
writeFileSync(salida + '/styles-NUEVO111.css', 'body{color:#fff}\\n');
writeFileSync(salida + '/index.html', '<!doctype html><html><body><app-root></app-root><script src="main-NUEVO111.js"></script></body></html>');
`;

const BUILD_SIN_BUNDLE = `
import { mkdirSync, writeFileSync } from 'node:fs';
const salida = process.env.SALIDA + '/desplazame/browser';
mkdirSync(salida, { recursive: true });
writeFileSync(salida + '/index.html', '<!doctype html><html><body>a medias</body></html>');
`;

const BUILD_QUE_FALLA = `
console.error('me caigo a mitad, como la build de la tanda 5');
process.exit(1);
`;

interface Salida {
  readonly codigo: number;
  readonly texto: string;
}

/** Lanza el guardián (o una copia suya) y devuelve código y salida junta. */
function correr(guion: string, argumentos: readonly string[]): Salida {
  const r = spawnSync(process.execPath, [guion, ...argumentos], { encoding: 'utf8' });
  return { codigo: r.status, texto: (r.stdout ?? '') + (r.stderr ?? '') };
}

describe('⭐ EL GUARDIÁN DE BUILD ATÓMICO — una build fallida no toca el dist', () => {
  it('el guion existe y se deja llamar', () => {
    expect(existsSync(GUION)).toBe(true);
  });

  it('BUILD QUE FALLA: el dist anterior queda INTACTO AL BYTE y sale ≠ 0', () => {
    const { base, dist } = bancoConDistAnterior();
    const antes = huella(dist);
    const orden = ordenQueEscribe(base, 'build-que-falla.mjs', BUILD_QUE_FALLA);

    const { codigo, texto } = correr(GUION, ['--dist', dist, '--orden', orden]);

    expect(codigo).not.toBe(0);
    expect(huella(dist)).toBe(antes);
    // Ni restos del intento: ni el temporal ni el respaldo se quedan.
    expect(existsSync(dist + '-tmp')).toBe(false);
    expect(existsSync(dist + '-anterior')).toBe(false);
    expect(texto).toMatch(/intacto/i);
    rmSync(base, { recursive: true, force: true });
  });

  it('BUILD QUE SALE 0 SIN BUNDLE: tampoco se publica, y el dist sigue intacto', () => {
    const { base, dist } = bancoConDistAnterior();
    const antes = huella(dist);
    const orden = ordenQueEscribe(base, 'build-sin-bundle.mjs', BUILD_SIN_BUNDLE);

    const { codigo, texto } = correr(GUION, ['--dist', dist, '--orden', orden]);

    expect(codigo).not.toBe(0);
    expect(huella(dist)).toBe(antes);
    expect(existsSync(dist + '-tmp')).toBe(false);
    expect(texto).toMatch(/main-\*\.js|bundle/i);
    rmSync(base, { recursive: true, force: true });
  });

  it('BUILD BUENA: el dist nuevo entra con su marca, y no queda ni temporal ni respaldo', () => {
    const { base, dist } = bancoConDistAnterior();
    const orden = ordenQueEscribe(base, 'build-buena.mjs', BUILD_BUENA);

    const { codigo } = correr(GUION, ['--dist', dist, '--orden', orden]);

    expect(codigo).toBe(0);
    expect(existsSync(dist + '/desplazame/browser/main-NUEVO111.js')).toBe(true);
    expect(existsSync(dist + '/desplazame/browser/main-VIEJO000.js')).toBe(false);
    expect(existsSync(dist + '-tmp')).toBe(false);
    expect(existsSync(dist + '-anterior')).toBe(false);

    const marca = JSON.parse(readFileSync(dist + '/.build-ok', 'utf8'));
    expect(marca.bundle).toBe('main-NUEVO111.js');
    expect(marca.sha256).toBe(shaDe(dist + '/desplazame/browser/main-NUEVO111.js'));
    expect(String(marca.fecha)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(marca.ficheros).toBe(3);

    // Y su propia comprobación previa dice que sí.
    expect(correr(GUION, ['--comprobar', '--dist', dist]).codigo).toBe(0);
    rmSync(base, { recursive: true, force: true });
  });

  it('CONTRAPRUEBA DEL SWAP: con el segundo renombrado saboteado EN COPIA, restaura y lo dice', () => {
    const { base, dist } = bancoConDistAnterior();
    const antes = huella(dist);
    const orden = ordenQueEscribe(base, 'build-buena.mjs', BUILD_BUENA);

    // El sabotaje va sobre una COPIA del guion: el código real no se rompe
    // nunca para ver el rojo.
    const copia = base + '/construir-saboteado.mjs';
    copyFileSync(GUION, copia);
    const fuente = readFileSync(copia, 'utf8');
    const LINEA = 'const renombrar = (origen, destino, paso) => renameSync(origen, destino);';
    expect(fuente).toContain(LINEA); // si el guion cambia de forma, esto se entera
    writeFileSync(
      copia,
      fuente.replace(
        LINEA,
        "const renombrar = (origen, destino, paso) => { if (paso === 2) throw new Error('SABOTAJE DE LA JUEZA'); return renameSync(origen, destino); };",
      ),
    );

    const { codigo, texto } = correr(copia, ['--dist', dist, '--orden', orden]);

    expect(codigo).not.toBe(0);
    expect(huella(dist)).toBe(antes); // restaurado al byte
    expect(existsSync(dist + '-anterior')).toBe(false);
    expect(texto).toMatch(/restaurad/i);
    rmSync(base, { recursive: true, force: true });
  });

  it('COMPROBAR: sin marca, con marca que no cuadra, y con restos de un swap a medias, se niega', () => {
    const { base, dist } = bancoConDistAnterior();

    // (a) sin marca
    rmSync(dist + '/.build-ok');
    expect(correr(GUION, ['--comprobar', '--dist', dist]).codigo).not.toBe(0);

    // (b) con marca cuyo sha no cuadra con el bundle
    writeFileSync(
      dist + '/.build-ok',
      JSON.stringify({
        fecha: '2026-09-18T00:00:00.000Z',
        bundle: 'main-VIEJO000.js',
        sha256: '0'.repeat(64),
        ficheros: 3,
      }),
    );
    const mentira = correr(GUION, ['--comprobar', '--dist', dist]);
    expect(mentira.codigo).not.toBe(0);
    expect(mentira.texto).toMatch(/sha|huella/i);

    // (c) con la marca buena, pero con restos de un swap a medias al lado
    writeFileSync(
      dist + '/.build-ok',
      JSON.stringify({
        fecha: '2026-09-18T00:00:00.000Z',
        bundle: 'main-VIEJO000.js',
        sha256: shaDe(dist + '/desplazame/browser/main-VIEJO000.js'),
        ficheros: 3,
      }),
    );
    expect(correr(GUION, ['--comprobar', '--dist', dist]).codigo).toBe(0);
    mkdirSync(dist + '-tmp', { recursive: true });
    const restos = correr(GUION, ['--comprobar', '--dist', dist]);
    expect(restos.codigo).not.toBe(0);
    expect(restos.texto).toMatch(/-tmp|a medias/i);

    rmSync(base, { recursive: true, force: true });
  });

  it('EL DIST REAL DEL REPOSITORIO lleva su marca completa — la negativa antes del commit', () => {
    const { codigo, texto } = correr(GUION, ['--comprobar', '--dist', RAIZ + 'app/dist']);
    expect(texto).toBeTruthy();
    expect(codigo).toBe(0);
  });
});
