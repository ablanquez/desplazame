// ⚠️ Estos tres son de Node, y **existen en tiempo de ejecución**: las pruebas
// corren sobre Node. Lo que no existe son sus TIPOS — el proyecto no trae
// `@types/node` porque **las dependencias son CERO**, y traerlo para una sola
// prueba sería pagar una dependencia por una comodidad.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
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
  /**
   * ⚠️ **OPCIONALES, y no por comodidad.** [Data Package v1] `bytes` y `hash`
   *    no son obligatorios, y los tres ficheros que el cron renueva cada noche
   *    —el zip vivo, su cocinado y su registro— **no tienen huella estable**:
   *    declarar una sería declarar una mentira con fecha. Lo que no consta se
   *    omite; es la misma regla que el resto del manifiesto.
   */
  readonly bytes?: number;
  readonly hash?: string;
  readonly modified?: string;
  readonly modifiedFuente?: string;
  readonly descargadoEl?: string;
  readonly accrualPeriodicity?: string;
  readonly periodicidadFuente?: string;
  readonly caducaEl?: string;
  readonly caducidadFuente?: string;
  /** Cada cuanto se consulta una fuente VIVA. Propiedad nuestra: el estandar calla. */
  readonly cadencia?: string;
  readonly cadenciaFuente?: string;
}

const paquete = JSON.parse(readFileSync(RAIZ + 'datapackage.json', 'utf8')) as {
  name: string;
  profile: string;
  resources: Recurso[];
};

/** El sha256 de un fichero del repositorio, recalculado ahora mismo. */
const huella = (rel: string): string =>
  'sha256:' + createHash('sha256').update(readFileSync(RAIZ + rel)).digest('hex');

/**
 * ⭐ LO QUE VIVE EN `data/` Y **NO** ES UN CONJUNTO — la exclusión, declarada.
 *
 * ⚠️ Va aquí, donde la juez que barre la lee, y con su razón escrita. Una
 *    exclusión sin motivo es un agujero con permiso.
 */
/**
 * ⭐ LOS QUE PUEDEN NO TRAER `hash` NI `bytes` — y por qué cada uno.
 *
 * [Data Package v1] los dos campos son OPCIONALES. Aquí se usa esa puerta solo
 * para lo que **no tiene huella estable**, que es una verdad del dato y no una
 * comodidad nuestra: declarar un sha256 de algo que cambia cada noche es
 * declarar una mentira con fecha de caducidad.
 */
const PUEDEN_NO_TENER_HUELLA: readonly string[] = [
  // Los renueva el cron nocturno: su huella cambia con cada renovación.
  'gtfs-vivo',
  'gtfs-cocinado',
  'gtfs-registro',
  // Y las seis que se CONSULTAN: no hay fichero que medir. [Data Package v1] el
  // `path` «puede ser una URL http completamente cualificada» —recursos remotos
  // de primera clase—, y un recurso remoto no tiene bytes en este repositorio.
  'bizi-disponibilidad',
  'poste-vivo',
  'ruta-operativa',
  'yego-flota',
  'festivo-cuadro',
  'dgt-distintivo',
];

const NO_SON_CONJUNTOS: readonly { readonly patron: RegExp; readonly porque: string }[] = [
  {
    patron: /_cabeceras\.txt$/,
    porque:
      'la captura de las cabeceras HTTP de la descarga. Es la PRUEBA de una fila ' +
      '—el `date`, el `content-type`, el estado— y no un conjunto de datos: ' +
      'declararla como recurso sería declarar el recibo como si fuera la compra.',
  },
];

describe('⭐ EL MANIFIESTO — datapackage.json dice la verdad', () => {
  it('sigue el perfil `data-package` y trae recursos', () => {
    expect(paquete.profile).toBe('data-package');
    expect(paquete.resources.length).toBeGreaterThan(0);
  });

  it('⭐ la huella de CADA fichero, recalculada, casa con la declarada', () => {
    // Si esto enrojece, o el dato cambió sin avisar o el manifiesto miente.
    // Las dos cosas son noticia, y ninguna se arregla tocando esta prueba.
    const mienten = paquete.resources
      .filter((r) => r.hash !== undefined)
      .map((r) => ({ r, real: huella(r.path) }))
      .filter(({ r, real }) => real !== r.hash)
      .map(({ r, real }) => r.path + ': declara ' + (r.hash ?? '').slice(0, 22) + '… y es ' + real.slice(0, 22) + '…');
    expect(mienten).toEqual([]);
  });

  it('⭐ los bytes declarados son los del fichero', () => {
    const mienten = paquete.resources
      .filter((r) => r.bytes !== undefined && statSync(RAIZ + r.path).size !== r.bytes)
      .map((r) => r.path + ': declara ' + r.bytes + ' y mide ' + statSync(RAIZ + r.path).size);
    expect(mienten).toEqual([]);
  });

  it('cada recurso trae lo que el estándar exige: `name` con su patrón, y `path`', () => {
    // [DOC Frictionless] name: «^([-a-z0-9._/])+$» · y oneOf(name+path, name+data).
    for (const r of paquete.resources) {
      expect(r.name).toMatch(/^([-a-z0-9._/])+$/);
      expect(r.path).toBeTruthy();
      // ⚠️ `hash` y `bytes` son OPCIONALES en la spec, así que aquí se compra el
      //    FORMATO de los que están, no su presencia. Quién puede faltar se
      //    compra abajo, con nombre y apellidos.
      if (r.hash !== undefined) expect(r.hash).toMatch(/^sha256:[0-9a-f]{64}$/);
      if (r.bytes !== undefined) expect(Number.isInteger(r.bytes)).toBe(true);
    }
  });

  /**
   * ⭐ Y QUIÉN PUEDE NO TENER HUELLA ESTÁ ESCRITO, uno a uno.
   *
   * ⚠️ Hacer opcional un campo es abrir una puerta, y una puerta sin portero se
   *    cruza sola: mañana alguien quita un `hash` que estorba y nadie se entera.
   *    La spec permite omitirlos; esta casa exige decir **por qué** en cada caso.
   */
  it('⭐ solo pueden faltar hash y bytes donde está declarado por qué', () => {
    const sinHuella = paquete.resources
      .filter((r) => r.hash === undefined || r.bytes === undefined)
      .map((r) => r.name)
      .sort();
    expect(sinHuella).toEqual([...PUEDEN_NO_TENER_HUELLA].sort());
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
        (r.modified !== undefined && !r.modifiedFuente) ||
        (r.cadencia !== undefined && !r.cadenciaFuente),
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

  /**
   * ⭐ LAS RUTAS: relativas y POSIX, o una URL entera. Nada más.
   *
   * [Data Package v1, literal] el `path` «puede ser una URL http completamente
   * cualificada o una ruta POSIX relativa», y **las rutas absolutas y las que
   * llevan `..` están PROHIBIDAS por seguridad** — un descriptor que apunte
   * fuera de su paquete es un descriptor que puede sacar ficheros de donde no
   * debe. Aquí se compra la prohibición, no se confía en ella.
   */
  it('⭐ ningún `path` es absoluto ni se sale del paquete con `..`', () => {
    const malos = paquete.resources
      .filter((r) => {
        if (/^https?:\/\//.test(r.path)) return false;
        return r.path.startsWith('/') || /^[A-Za-z]:/.test(r.path) || r.path.split('/').includes('..');
      })
      .map((r) => r.name + ' → ' + r.path);
    expect(malos).toEqual([]);
  });

  /**
   * ⭐ LAS VIVAS SE DECLARAN COMO REMOTAS, Y CON SU CADENCIA.
   *
   * Las seis fuentes que se consultan y no se copian tenían ficha en el notices
   * y **ninguna fila aquí**, así que el panel no podía enseñarlas: `resources[]`
   * parecía una lista de ficheros. La spec dice que no lo es.
   */
  it('⭐ toda fuente remota trae cadencia y no finge tener fichero', () => {
    const remotas = paquete.resources.filter((r) => /^https?:\/\//.test(r.path));
    expect(remotas.length).toBeGreaterThan(0);
    for (const r of remotas) {
      expect(r.cadencia, r.name).toBeTruthy();
      expect(r.cadenciaFuente, r.name).toBeTruthy();
      expect(r.hash, r.name).toBeUndefined();
      expect(r.bytes, r.name).toBeUndefined();
    }
  });

  /**
   * ⭐ Y AL REVÉS: DEL DISCO AL MANIFIESTO — la dirección que faltaba.
   *
   * ── ⚠️ La tercera vez de la misma enfermedad ──────────────────────────────
   *
   * Las jueces de arriba recorren `resources[]` y comprueban que lo declarado
   * es verdad. Ninguna preguntaba lo contrario: **si todo lo real está
   * declarado**. Y esa es la dirección por la que un manifiesto envejece solo —
   * alguien añade un conjunto, nadie toca el manifiesto, y nada se pone rojo.
   *
   * Medido el 8/09: **nueve conjuntos reales sin declarar**, y entre ellos el
   * viario del coche entero (19,5 MB, entró el 2/09) y la Zona de Bajas
   * Emisiones. La suite, verde.
   *
   * Es la MISMA forma de fallo que la nº39 (la cabecera del notices contaba sus
   * fichas pero nadie contaba las del README) y la nº40 (el `.gitattributes`
   * tenía la lección y no la carpeta nueva): **una regla escrita como
   * enumeración solo cubre la lista del día que se escribió**. Tercera vez.
   */
  it('⭐ y AL REVÉS: todo fichero de datos tiene fila o exclusión declarada', () => {
    const declarados = new Set(paquete.resources.map((r) => r.path));
    // ⚠️ Sin normalizar barras a propósito: el manifiesto declara sus rutas
    //    en POSIX —lo exige la spec de Data Package— y aquí se componen igual.
    const huerfanos: string[] = [];
    for (const dir of ['app/data', 'motor/data']) {
      for (const f of readdirSync(RAIZ + dir) as string[]) {
        const rel = dir + '/' + f;
        if (!statSync(RAIZ + rel).isFile()) continue;
        if (declarados.has(rel)) continue;
        if (NO_SON_CONJUNTOS.some((x) => x.patron.test(f))) continue;
        huerfanos.push(rel);
      }
    }
    expect(huerfanos).toEqual([]);
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
