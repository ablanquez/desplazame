// ⚠️ Estos tres son de Node, y **existen en tiempo de ejecución**: las pruebas
// corren sobre Node. Lo que no existe son sus TIPOS — el proyecto no trae
// `@types/node` porque **las dependencias son CERO**, y traerlo para una sola
// prueba sería pagar una dependencia por una comodidad.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, statSync, existsSync } from 'node:fs';
// @ts-expect-error — idem
import { createHash } from 'node:crypto';

/**
 * ⭐ EL GUARDIÁN DEL MANIFIESTO: que lo que declara sea verdad HOY.
 *
 * `datapackage.json` es un documento **declarativo**: lo escribe una persona y
 * lo leen otras piezas. Un documento así se pudre en silencio — alguien cambia
 * un fichero de datos, nadie toca el manifiesto, y el panel sigue enseñando una
 * huella que ya no es de nadie.
 *
 * Esto lo impide: **recalcula el sha256 de cada fichero y lo compara**. No es
 * una prueba de forma, es una prueba de verdad.
 *
 * [DOC Frictionless Data, Data Package v1] La forma también se comprueba, pero
 * solo lo que el perfil `data-package` exige: `resources`, y en cada uno `name`
 * con su patrón y `path`. **La validación completa contra el JSON Schema
 * oficial no vive aquí**: exigiría traer un validador de JSON Schema, y las
 * dependencias son CERO. Se hace fuera, con el schema bajado de
 * `specs.frictionlessdata.io`, y su resultado va en el checkpoint.
 */
/** `process` es de Node y tampoco está tipado aquí. Solo se usa `cwd()`. */
declare const process: { cwd(): string };

const RAIZ = ((): string => {
  // Se busca **subiendo hasta dar con el manifiesto**, y no se calcula desde
  // `import.meta.url` porque en el empaquetado de las pruebas esa URL no es de
  // esquema `file:`. Subir funciona se lance desde donde se lance.
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/datapackage.json')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro datapackage.json subiendo desde ' + process.cwd());
})();

interface Recurso {
  readonly name: string;
  readonly path: string;
  readonly title: string;
  readonly bytes: number;
  readonly hash: string;
  readonly modified?: string;
  readonly modifiedFuente?: string;
  readonly descargadoEl?: string;
  readonly accrualPeriodicity?: string;
  readonly periodicidadFuente?: string;
  readonly caducaEl?: string;
  readonly caducidadFuente?: string;
}

const paquete = JSON.parse(readFileSync(RAIZ + 'datapackage.json', 'utf8')) as {
  name: string;
  profile: string;
  resources: Recurso[];
};

/** El sha256 de un fichero del repositorio, recalculado ahora mismo. */
const huella = (rel: string): string =>
  'sha256:' + createHash('sha256').update(readFileSync(RAIZ + rel)).digest('hex');

describe('⭐ EL MANIFIESTO — datapackage.json dice la verdad', () => {
  it('sigue el perfil `data-package` y trae recursos', () => {
    expect(paquete.profile).toBe('data-package');
    expect(paquete.resources.length).toBeGreaterThan(0);
  });

  it('⭐ la huella de CADA fichero, recalculada, casa con la declarada', () => {
    // Si esto enrojece, o el dato cambió sin avisar o el manifiesto miente.
    // Las dos cosas son noticia, y ninguna se arregla tocando esta prueba.
    const mienten = paquete.resources
      .map((r) => ({ r, real: huella(r.path) }))
      .filter(({ r, real }) => real !== r.hash)
      .map(({ r, real }) => r.path + ': declara ' + r.hash.slice(0, 22) + '… y es ' + real.slice(0, 22) + '…');
    expect(mienten).toEqual([]);
  });

  it('⭐ los bytes declarados son los del fichero', () => {
    const mienten = paquete.resources
      .filter((r) => statSync(RAIZ + r.path).size !== r.bytes)
      .map((r) => r.path + ': declara ' + r.bytes + ' y mide ' + statSync(RAIZ + r.path).size);
    expect(mienten).toEqual([]);
  });

  it('cada recurso trae lo que el estándar exige: `name` con su patrón, y `path`', () => {
    // [DOC Frictionless] name: «^([-a-z0-9._/])+$» · y oneOf(name+path, name+data).
    for (const r of paquete.resources) {
      expect(r.name).toMatch(/^([-a-z0-9._/])+$/);
      expect(r.path).toBeTruthy();
      expect(r.hash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(Number.isInteger(r.bytes)).toBe(true);
    }
  });

  it('los `name` no se repiten: son la clave', () => {
    const nombres = paquete.resources.map((r) => r.name);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('⭐ TODA regla de caducidad viene con su fuente escrita', () => {
    // Es la regla firmada: un umbral sin fuente no existe. Si alguien añade una
    // periodicidad «porque parece razonable», esto se pone rojo.
    const sinFuente = paquete.resources.filter(
      (r) =>
        (r.accrualPeriodicity !== undefined && !r.periodicidadFuente) ||
        (r.caducaEl !== undefined && !r.caducidadFuente) ||
        (r.modified !== undefined && !r.modifiedFuente),
    );
    expect(sinFuente.map((r) => r.name)).toEqual([]);
  });

  it('⭐ la copia que se sirve es IDÉNTICA a la de la raíz, byte a byte', () => {
    // ⚠️ El manifiesto vive DOS veces, y hay que saber por qué.
    //
    // El canónico está en la raíz del repositorio, que es donde [DOC
    // Frictionless Data] coloca el descriptor: «a Data Package descriptor
    // (datapackage.json) in the root». Pero Angular **no copia assets de fuera
    // de su workspace** —«The .. asset path must be within the workspace
    // root»—, así que para que el navegador pueda pedirlo hay una copia en
    // `app/public/`, que es la carpeta que el build sí publica.
    //
    // Dos ficheros iguales son dos verdades esperando a separarse. Esto lo
    // impide: si alguien toca uno y no el otro, ROJO. La duplicación no
    // desaparece, pero deja de ser silenciosa.
    const raiz = readFileSync(RAIZ + 'datapackage.json');
    const servido = readFileSync(RAIZ + 'app/public/datapackage.json');
    expect(servido.equals(raiz)).toBe(true);
  });

  it('⭐ y lo que no consta se OMITE: ningún campo de frescura vacío', () => {
    // La ausencia ES el resultado. Un `modified: null` o `""` sería rellenar el
    // hueco con humo, que es justo lo que el panel viene a evitar.
    for (const r of paquete.resources) {
      for (const c of ['modified', 'descargadoEl', 'accrualPeriodicity', 'caducaEl'] as const) {
        if (c in r) expect(r[c]).toBeTruthy();
      }
    }
  });
});
