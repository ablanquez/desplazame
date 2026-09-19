// ⚠️ Node en tiempo de ejecución, sin tipos: las dependencias son CERO y
// `@types/node` no entra por una prueba. Misma costura que `manifiesto.spec.ts`
// y `construir.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
// @ts-expect-error — idem
import { spawn } from 'node:child_process';
// @ts-expect-error — idem
import { createHash } from 'node:crypto';
// @ts-expect-error — idem
import { tmpdir } from 'node:os';
// @ts-expect-error — idem
import { createServer } from 'node:http';

/**
 * ⭐ LA JUEZA DEL CRON EDUCADO (19/09) — `scripts/mantener-datos.mjs`.
 *
 * QUÉ VIGILA, y por qué cada cosa:
 *
 *   1. LOS TRES ESTADOS, y que **ninguno se quede en silencio**: cada conjunto
 *      del manifiesto sale del parte como `sin-cambio`, `actualizado`,
 *      `fallido` o `no-vigilable` con su porqué. Un conjunto que no aparece es
 *      un conjunto que nadie mira y nadie echa de menos.
 *
 *   2. LAS DOS FECHAS, que son distintas y la confusión es el fallo clásico de
 *      un cron: `comprobadoEl` (se miró) y `descargadoEl` (cambió). Un 304
 *      mueve la primera y **no toca la segunda**.
 *
 *   3. LA LEY Nº10 — la frescura es la HUELLA, no el «job OK»: con un 200 que
 *      trae exactamente el mismo cuerpo, el veredicto es **sin cambio**.
 *
 *   4. QUE UN FALLO NO SE LLEVE EL DATO POR DELANTE: con la fuente caída, o
 *      contestando una página de error con un 200 encima, el fichero de ahora
 *      queda **intacto al byte** y la salida es ≠ 0.
 *
 *   5. EL SWAP: cuando sí hay dato nuevo, entra entero y no deja restos
 *      (`.tmp`, `.anterior`), y el manifiesto y su copia servida siguen siendo
 *      el mismo byte.
 *
 *   6. Y SOBRE EL MANIFIESTO REAL: todo conjunto vigilado declara su petición
 *      con fuente y su cadencia con fuente. Una regla sin fuente no existe.
 *
 * ⚠️ Las fuentes de verdad NO se tocan aquí. La jueza levanta **su propio
 *    servidor** en el 127.0.0.1 y le hace decir 304, 200-igual, 200-nuevo,
 *    200-basura o nada. Así el camino del 304, el del swap y el del fallo son
 *    deterministas, no dependen de que el Ayuntamiento esté de buenas, y no le
 *    cuestan una sola petición a nadie.
 */
declare const process: {
  cwd(): string;
  execPath: string;
  env: Record<string, string | undefined>;
};

const RAIZ = ((): string => {
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/datapackage.json')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro datapackage.json subiendo desde ' + process.cwd());
})();

const GUION = RAIZ + 'scripts/mantener-datos.mjs';

const sha = (b: unknown): string => 'sha256:' + createHash('sha256').update(b).digest('hex');
const shaDeFichero = (ruta: string): string => sha(readFileSync(ruta));

const VIEJO = '{"dato":"el de ayer","filas":[1,2,3,4,5,6,7,8,9,10]}';
const NUEVO = '{"dato":"el de hoy","filas":[1,2,3,4,5,6,7,8,9,10,11]}';

/**
 * ⭐ Y EL MISMO DATO SELLADO, que es como contesta una fuente DE VERDAD.
 *
 * [bitácora 19/09] GeoServer pone en cada respuesta la hora de ESA petición, así
 * que dos respuestas idénticas nunca son iguales al byte. Una jueza cuya fuente
 * de mentira contesta dos veces lo mismo compra un caso que no existe.
 */
const sellado = (cuerpo: string, hora: string) =>
  JSON.stringify({ timeStamp: hora, ...JSON.parse(cuerpo) });
const VIEJO_SELLADO = sellado(VIEJO, '2026-09-01T00:00:00.000Z');
const NUEVO_SELLADO = sellado(NUEVO, '2026-10-01T09:00:00.000Z');

/** Un repositorio de juguete: su manifiesto, su copia servida y un dato. */
function banco(peticion: string, extra: Record<string, unknown> = {}) {
  const base = mkdtempSync(tmpdir() + '/jueza-cron-').split('\\').join('/') + '/';
  mkdirSync(base + 'app/data', { recursive: true });
  mkdirSync(base + 'app/public', { recursive: true });
  writeFileSync(base + 'app/data/conjunto.json', VIEJO);
  const paquete = {
    name: 'de-juguete',
    profile: 'data-package',
    resources: [
      {
        name: 'conjunto',
        path: 'app/data/conjunto.json',
        title: 'El conjunto de juguete',
        bytes: VIEJO.length,
        hash: sha(VIEJO),
        descargadoEl: '2026-09-01T00:00:00.000Z',
        peticion,
        peticionFuente: 'la jueza',
        vigilanciaDias: 30,
        vigilanciaFuente: 'la jueza',
        ...extra,
      },
      // Uno que NO se vigila: tiene que salir nombrado igual, con su porqué.
      { name: 'sin-peticion', path: 'app/data/otro.json', title: 'Sin petición declarada' },
    ],
  };
  const texto = JSON.stringify(paquete, null, 2) + '\n';
  writeFileSync(base + 'datapackage.json', texto);
  writeFileSync(base + 'app/public/datapackage.json', texto);
  return base;
}

const manifiestoDe = (base: string) => JSON.parse(readFileSync(base + 'datapackage.json', 'utf8'));
const recursoDe = (base: string) => manifiestoDe(base).resources[0];

interface Salida {
  readonly codigo: number;
  readonly texto: string;
}

/**
 * ⚠️ ASÍNCRONO, Y NO ES UN CAPRICHO: con `spawnSync` esto se colgaba para
 *    siempre. La fuente de mentira vive en ESTE mismo proceso, y un `spawnSync`
 *    bloquea el bucle de eventos — o sea que el servidor no podía contestarle
 *    al hijo mientras el padre lo esperaba. Un abrazo mortal de manual, y el
 *    síntoma era una suite que nunca terminaba.
 */
function correr(base: string, guion = GUION, mas: readonly string[] = []): Promise<Salida> {
  // `--pausa 0`: la cortesía es para las casas de fuera, y aquí la fuente la
  // levanta la propia jueza en 127.0.0.1.
  return new Promise((listo) => {
    const hijo = spawn(process.execPath, [guion, '--raiz', base, '--pausa', '0', ...mas]);
    let texto = '';
    hijo.stdout.on('data', (t: unknown) => (texto += String(t)));
    hijo.stderr.on('data', (t: unknown) => (texto += String(t)));
    hijo.on('close', (codigo: number) => listo({ codigo, texto }));
  });
}

/** Un servidor que contesta lo que se le mande, y cuenta lo que le piden. */
async function fuente(responder: (peticion: unknown, respuesta: unknown) => void) {
  const servidor = createServer(responder);
  await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
  const puerto = servidor.address().port;
  return {
    url: `http://127.0.0.1:${puerto}/conjunto.json`,
    cerrar: () => new Promise<void>((listo) => servidor.close(() => listo())),
  };
}

describe('⭐ EL CRON EDUCADO — los tres estados, las dos fechas y la ley nº10', () => {
  it('el guion existe', () => {
    expect(existsSync(GUION)).toBe(true);
  });

  it('304: sin cambio · mueve la fecha de COMPROBACIÓN y NO la de cambio', async () => {
    let pedidas = 0;
    let condicional = '';
    const f = await fuente((pet: any, res: any) => {
      pedidas++;
      condicional = `${pet.headers['if-none-match'] ?? '—'} | ${pet.headers['if-modified-since'] ?? '—'}`;
      res.writeHead(304).end();
    });
    const base = banco(f.url, {
      validadores: { etag: '"abc"', lastModified: 'Mon, 08 Jun 2026 12:06:36 GMT', medidoEl: '2026-09-01T00:00:00.000Z' },
    });
    const antes = shaDeFichero(base + 'app/data/conjunto.json');

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(pedidas).toBe(1);
    // Preguntó CONDICIONALMENTE, con los dos validadores guardados [MDN].
    expect(condicional).toBe('"abc" | Mon, 08 Jun 2026 12:06:36 GMT');
    expect(texto).toMatch(/sin-cambio/);
    const r = recursoDe(base);
    expect(r.comprobadoEl).toBe('2026-10-01T09:00:00.000Z');
    expect(r.descargadoEl).toBe('2026-09-01T00:00:00.000Z'); // ⭐ intacta: no cambió
    expect(shaDeFichero(base + 'app/data/conjunto.json')).toBe(antes);
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('200 con el MISMO cuerpo: la huella manda — sin cambio (el 304 casero) [ley nº10]', async () => {
    const f = await fuente((_p: any, res: any) => res.writeHead(200, { 'content-type': 'application/json' }).end(VIEJO));
    const base = banco(f.url);

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(texto).toMatch(/huella es la misma|huella idéntica/);
    const r = recursoDe(base);
    expect(r.comprobadoEl).toBe('2026-10-01T09:00:00.000Z');
    expect(r.descargadoEl).toBe('2026-09-01T00:00:00.000Z');
    expect(r.hash).toBe(sha(VIEJO));
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('200 con cuerpo NUEVO: swap, las dos fechas, huella y bytes nuevos, y sin restos', async () => {
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'application/json', etag: '"nuevo-1"' }).end(NUEVO),
    );
    const base = banco(f.url);

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(texto).toMatch(/ACTUALIZADO/);
    expect(readFileSync(base + 'app/data/conjunto.json', 'utf8')).toBe(NUEVO);
    const r = recursoDe(base);
    expect(r.hash).toBe(sha(NUEVO));
    expect(r.bytes).toBe(NUEVO.length);
    expect(r.descargadoEl).toBe('2026-10-01T09:00:00.000Z'); // ⭐ ahora SÍ: cambió
    expect(r.comprobadoEl).toBe('2026-10-01T09:00:00.000Z');
    expect(r.validadores.etag).toBe('"nuevo-1"'); // lo que emitió, guardado junto al conjunto
    // Ni restos del swap, ni las dos copias del manifiesto separadas.
    expect(existsSync(base + 'app/data/conjunto.json.tmp')).toBe(false);
    expect(existsSync(base + 'app/data/conjunto.json.anterior')).toBe(false);
    expect(readFileSync(base + 'app/public/datapackage.json', 'utf8')).toBe(
      readFileSync(base + 'datapackage.json', 'utf8'),
    );
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  // ⚠️ 60 s de presupuesto: este caso REINTENTA de verdad (2 s + 8 s de espera
  //    creciente, más lo que tarde el sistema en decir que no hay nadie).
  it('LA FUENTE CAÍDA: fallido con su porqué, salida ≠ 0 y el dato viejo INTACTO AL BYTE', async () => {
    // Un puerto que no escucha: el fallo de red, sembrado.
    const base = banco('http://127.0.0.1:1/conjunto.json');
    const antes = shaDeFichero(base + 'app/data/conjunto.json');
    const manifiestoAntes = readFileSync(base + 'datapackage.json', 'utf8');

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);

    expect(codigo).not.toBe(0);
    expect(texto).toMatch(/fallido/);
    expect(texto).toMatch(/INTACTO/);
    expect(shaDeFichero(base + 'app/data/conjunto.json')).toBe(antes);
    // Y el manifiesto no se inventa una comprobación que no pudo hacer.
    expect(JSON.parse(manifiestoAntes).resources[0].comprobadoEl).toBeUndefined();
    expect(recursoDe(base).comprobadoEl).toBeUndefined();
    rmSync(base, { recursive: true, force: true });
  }, 60_000);

  it('200 CON BASURA (la página de error de la fuente): fallido, y el dato sigue siendo el de antes', async () => {
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'text/html' }).end('<html>Servicio no disponible</html>'),
    );
    const base = banco(f.url);
    const antes = shaDeFichero(base + 'app/data/conjunto.json');

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).not.toBe(0);
    expect(texto).toMatch(/no vale|no es JSON/);
    expect(shaDeFichero(base + 'app/data/conjunto.json')).toBe(antes);
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('LO QUE NO ESTÁ VENCIDO no se pide: cortesía, no pereza', async () => {
    let pedidas = 0;
    const f = await fuente((_p: any, res: any) => {
      pedidas++;
      res.writeHead(200).end(NUEVO);
    });
    const base = banco(f.url, { comprobadoEl: '2026-09-25T00:00:00.000Z' });

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(pedidas).toBe(0);
    expect(texto).toMatch(/no tocaba/);
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('⭐ NINGUNO EN SILENCIO: cada conjunto del manifiesto sale en el parte con su estado', async () => {
    const f = await fuente((_p: any, res: any) => res.writeHead(304).end());
    const base = banco(f.url);

    const { texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    const parte = texto.slice(texto.indexOf('═══ EL PARTE ═══'));
    for (const nombre of ['conjunto', 'sin-peticion']) {
      expect(parte).toMatch(new RegExp(`\\b${nombre}\\b\\s+(sin-cambio|actualizado|fallido|no-vigilable)`));
    }
    // El que no se puede vigilar lo dice, en vez de callarse.
    expect(parte).toMatch(/sin-peticion\s+no-vigilable\s+NO CONSTA/);
    expect(texto).toMatch(/2 conjuntos/);
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('⭐ EL SELLO DE LA RESPUESTA NO ES UN CAMBIO: mismo dato con otra hora dentro → sin cambio', async () => {
    // La fuente contesta el mismo dato con el sello de HOY, como el WFS real.
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'application/json' }).end(sellado(VIEJO, '2026-10-01T09:00:00.000Z')),
    );
    const base = banco(f.url, { camposVolatiles: ['timeStamp'], camposVolatilesFuente: 'la jueza' });
    // El fichero que hay lleva el sello viejo: al byte, son distintos.
    writeFileSync(base + 'app/data/conjunto.json', VIEJO_SELLADO);
    const antes = shaDeFichero(base + 'app/data/conjunto.json');

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(texto).toMatch(/solo cambia el sello de la respuesta \(timeStamp\)/);
    // Y el fichero NO se toca: ni un byte, ni una fecha de cambio nueva.
    expect(shaDeFichero(base + 'app/data/conjunto.json')).toBe(antes);
    const r = recursoDe(base);
    expect(r.descargadoEl).toBe('2026-09-01T00:00:00.000Z');
    expect(r.comprobadoEl).toBe('2026-10-01T09:00:00.000Z');
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('⭐ …pero un dato que SÍ cambia, sellado igual, entra', async () => {
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'application/json' }).end(NUEVO_SELLADO),
    );
    const base = banco(f.url, { camposVolatiles: ['timeStamp'], camposVolatilesFuente: 'la jueza' });
    writeFileSync(base + 'app/data/conjunto.json', VIEJO_SELLADO);

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(texto).toMatch(/ACTUALIZADO/);
    expect(readFileSync(base + 'app/data/conjunto.json', 'utf8')).toBe(NUEVO_SELLADO);
    expect(recursoDe(base).descargadoEl).toBe('2026-10-01T09:00:00.000Z');
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('⭐ EL ORDEN DE LOS ARRAYS TAMPOCO ES UN CAMBIO, donde el conjunto lo declara', async () => {
    // Como contesta la API de equipamientos: el mismo dato con el array al revés.
    const DESORDENADO = JSON.stringify({ dato: 'el de ayer', filas: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] });
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'application/json' }).end(DESORDENADO),
    );
    const base = banco(f.url, { ordenVolatil: true, ordenVolatilFuente: 'la jueza' });
    const antes = shaDeFichero(base + 'app/data/conjunto.json');

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(texto).toMatch(/el orden en que vienen los arrays/);
    expect(shaDeFichero(base + 'app/data/conjunto.json')).toBe(antes);
    expect(recursoDe(base).descargadoEl).toBe('2026-09-01T00:00:00.000Z');
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('CONTRAPRUEBA DEL ORDEN: sin declararlo, ese mismo caso canta «actualizado»', async () => {
    const DESORDENADO = JSON.stringify({ dato: 'el de ayer', filas: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] });
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'application/json' }).end(DESORDENADO),
    );
    const base = banco(f.url); // ← sin `ordenVolatil`

    const { texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(texto).toMatch(/ACTUALIZADO/);
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('CONTRAPRUEBA DEL SELLO: sin `camposVolatiles` declarados, el mismo caso canta «actualizado» — que es el fallo del 19/09', async () => {
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'application/json' }).end(sellado(VIEJO, '2026-10-01T09:00:00.000Z')),
    );
    const base = banco(f.url); // ← sin declarar el campo volátil
    writeFileSync(base + 'app/data/conjunto.json', VIEJO_SELLADO);

    const { texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(texto).toMatch(/ACTUALIZADO/);
    expect(recursoDe(base).descargadoEl).toBe('2026-10-01T09:00:00.000Z');
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('⭐ UN CAMBIO VISTO Y DECLARADO NO TOMADO no se toma, y se sigue diciendo', async () => {
    const f = await fuente((_p: any, res: any) =>
      res.writeHead(200, { 'content-type': 'application/json' }).end(NUEVO),
    );
    const base = banco(f.url, {
      cambioNoTomado: {
        fecha: '2026-09-19',
        huella: sha(NUEVO),
        porque: 'mueve censos firmados y lo decide Antonio',
      },
    });
    const antes = shaDeFichero(base + 'app/data/conjunto.json');

    const { codigo, texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(codigo).toBe(0);
    expect(texto).toMatch(/cambio ESPERANDO desde 2026-09-19/);
    expect(texto).toMatch(/mueve censos firmados/);
    expect(shaDeFichero(base + 'app/data/conjunto.json')).toBe(antes);
    expect(recursoDe(base).descargadoEl).toBe('2026-09-01T00:00:00.000Z');
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('⭐ …pero si la fuente cambia OTRA VEZ, la nota deja de valer y el conjunto canta', async () => {
    const OTRO = '{"dato":"el de pasado mañana","filas":[1,2,3]}';
    const f = await fuente((_p: any, res: any) => res.writeHead(200).end(OTRO));
    const base = banco(f.url, {
      cambioNoTomado: { fecha: '2026-09-19', huella: sha(NUEVO), porque: 'lo decide Antonio' },
    });

    const { texto } = await correr(base, GUION, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    expect(texto).toMatch(/ACTUALIZADO/);
    expect(readFileSync(base + 'app/data/conjunto.json', 'utf8')).toBe(OTRO);
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('CONTRAPRUEBA: un guion saboteado EN COPIA que publica sin mirar la huella, cazado', async () => {
    const f = await fuente((_p: any, res: any) => res.writeHead(200).end(VIEJO));
    const base = banco(f.url);

    // El sabotaje: se le quita la ley nº10 (la comparación de huellas) a una
    // COPIA. El guion de verdad no se toca jamás para ver el rojo.
    const copia = base + 'saboteado.mjs';
    copyFileSync(GUION, copia);
    const LINEA = '  if (r.hash && huella === r.hash) {';
    const fuenteDelGuion = readFileSync(copia, 'utf8');
    expect(fuenteDelGuion).toContain(LINEA);
    writeFileSync(copia, fuenteDelGuion.replace(LINEA, '  if (false) {'));

    const { texto } = await correr(base, copia, ['--ahora', '2026-10-01T09:00:00.000Z']);
    await f.cerrar();

    // Sin la ley nº10, un cuerpo idéntico se publica como si fuera nuevo y la
    // fecha de CAMBIO miente. Esto es justo lo que la jueza compra arriba.
    expect(texto).toMatch(/ACTUALIZADO/);
    expect(recursoDe(base).descargadoEl).toBe('2026-10-01T09:00:00.000Z');
    rmSync(base, { recursive: true, force: true });
  }, 20_000);

  it('⭐ EL MANIFIESTO REAL: todo conjunto vigilado trae su petición y su cadencia CON FUENTE', () => {
    const paquete = JSON.parse(readFileSync(RAIZ + 'datapackage.json', 'utf8')) as {
      resources: readonly Record<string, unknown>[];
    };
    const vigilados = paquete.resources.filter((r) => r['peticion'] !== undefined);
    expect(vigilados.length).toBeGreaterThan(0);
    const sinFuente = vigilados
      .filter(
        (r) =>
          !r['peticionFuente'] ||
          typeof r['vigilanciaDias'] !== 'number' ||
          !r['vigilanciaFuente'],
      )
      .map((r) => r['name']);
    expect(sinFuente).toEqual([]);
    // Y la petición es una URL de verdad, no un apunte.
    const noUrl = vigilados.filter((r) => !/^https:\/\//.test(String(r['peticion']))).map((r) => r['name']);
    expect(noUrl).toEqual([]);
    // Y si un conjunto declara que algo de su respuesta es volátil, dice POR QUÉ:
    // una regla sin fuente no existe, y ésta decide si un cambio cuenta o no.
    const volatilSinFuente = paquete.resources
      .filter(
        (r) =>
          (r['camposVolatiles'] !== undefined && !r['camposVolatilesFuente']) ||
          (r['ordenVolatil'] !== undefined && !r['ordenVolatilFuente']),
      )
      .map((r) => r['name']);
    expect(volatilSinFuente).toEqual([]);
  });

  it('⭐ Y TRAS LA PASADA REAL, ninguno vigilado se queda sin fecha de comprobación', () => {
    const paquete = JSON.parse(readFileSync(RAIZ + 'datapackage.json', 'utf8')) as {
      resources: readonly Record<string, unknown>[];
    };
    const sinComprobar = paquete.resources
      .filter((r) => r['peticion'] !== undefined && !r['comprobadoEl'])
      .map((r) => r['name']);
    expect(sinComprobar).toEqual([]);
  });
});
