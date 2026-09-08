/**
 * ⭐ LA PRIMERA JUEZ DE `servidor.ts` (8/09) — y lo que compra es que SE PUEDE.
 *
 * ── ⚠️ Por qué esto no existía ──────────────────────────────────────────────
 *
 * Hasta hoy `servidor.ts` **no exportaba nada**: cero exports, medido en el
 * censo pre-despliegue. Todo el enrutado, los códigos de estado, las cabeceras
 * `no-store` y el orden del arranque estaban sin una sola juez — la zona sin
 * vigilar más grande del repositorio— y no por descuido: **no había por dónde
 * cogerlos**. El manejador vivía dentro del `createServer` y el `listen` corría
 * al importar el módulo, así que cualquier prueba que lo tocara abría el puerto
 * 3000 y disparaba los refrescos contra Avanza.
 *
 * Las dos cosas que lo hacen posible se hicieron hoy y son pequeñas: el
 * manejador tiene nombre y se exporta, y el `listen` solo corre si este módulo
 * es la entrada. Es el mismo movimiento del 7/09 con `atenderYEscribir` —el
 * arreglo no escribe la prueba, la **hace posible**—, y es la ley de la nº38:
 * cuando una prueba «no se puede escribir», la pregunta no es cómo saltarse al
 * guardián, sino qué le falta al código para que esa prueba sea escribible.
 *
 * ⚠️ **Esto NO es la suite del servidor.** Es una juez de humo: entra por la
 *    puerta y comprueba que la puerta existe. La suite entera —los tres
 *    verbos, los 404, el `no-store` de los cuatro del vivo, el cuerpo máximo,
 *    el token del cron— queda para su momento, y ahora tiene dónde vivir.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import type { Salud } from '@desplazame/tipos';
/**
 * ⭐ LA VARIABLE VA ANTES QUE EL IMPORT, Y POR ESO EL IMPORT ES DINÁMICO (8/09).
 *
 * ⚠️ **Un `import` estático no vale aquí.** En ESM los imports se evalúan
 *    ANTES que cualquier línea del módulo, así que un `process.env[...] = '1'`
 *    escrito arriba correría **después** de que `servidor.ts` ya hubiera
 *    decidido si arranca —y esta suite abriría el 3000 y dispararía los
 *    refrescos contra Avanza en cada pasada—.
 *
 * Desde que el guardián se invirtió —el panel de Hostinger importa el entry y
 * no admite el `require.main === module`—, **arrancar es lo normal y no
 * arrancar es lo que se pide**. Quien lo pide es esta línea, y nadie más.
 */
process.env['DESPLAZAME_SIN_ARRANCAR'] = '1';
const { atenderPeticion, PUERTO } = await import('./servidor.ts');

/** Lo que el manejador escribe, sin sockets: código, cabeceras y cuerpo. */
interface LoEscrito {
  codigo: number;
  cabeceras: Record<string, string>;
  cuerpo: string;
}

/**
 * Un par petición/respuesta de mentira. Solo tiene lo que el manejador usa —
 * `method`, `url`, `headers`, `writeHead` y `end`—, y con `as` declarado: no
 * hace falta un socket para comprobar qué contesta.
 */
function pedir(metodo: string, ruta: string): Promise<LoEscrito> {
  return new Promise((listo) => {
    const escrito: LoEscrito = { codigo: 0, cabeceras: {}, cuerpo: '' };
    const respuesta = {
      writeHead(codigo: number, cabeceras?: Record<string, string>) {
        escrito.codigo = codigo;
        escrito.cabeceras = cabeceras ?? {};
        return respuesta;
      },
      end(cuerpo?: string) {
        escrito.cuerpo = cuerpo ?? '';
        listo(escrito);
        return respuesta;
      },
    };
    const peticion = { method: metodo, url: ruta, headers: {} };
    atenderPeticion(peticion as unknown as IncomingMessage, respuesta as unknown as ServerResponse);
  });
}

describe('⭐ EL SERVIDOR — la puerta, atendida sin abrir ningún puerto', () => {
  /**
   * ⭐ JUEZ 1 — `/api/salud` CONTESTA, Y LO HACE EL MANEJADOR EXPORTADO.
   *
   * Se elige `/api/salud` porque es síncrona, no sale a la red y dice lo que
   * el motor tiene cargado: si contesta con sus cifras, el módulo entero se ha
   * levantado bien.
   */
  test('⭐ 1 · GET /api/salud lo atiende el manejador, sin listen y sin socket', async () => {
    const r = await pedir('GET', '/api/salud');
    assert.equal(r.codigo, 200);
    assert.match(r.cabeceras['Content-Type'] ?? '', /application\/json/);

    const salud = JSON.parse(r.cuerpo) as Salud;
    assert.equal(salud.ok, true);
    assert.equal(salud.pid, process.pid, 'contesta ESTE proceso, no otro que estuviera vivo');
    // Y las cifras del arranque están, que es lo que hace útil a esta ruta.
    assert.ok(salud.grafo.nodos > 60_000, `el grafo cargado: ${salud.grafo.nodos} nodos`);
    assert.ok(salud.portales.total > 40_000, `los portales: ${salud.portales.total}`);
  });

  /**
   * ⭐ JUEZ 2 — LO QUE NO EXISTE DA 404, Y LO DICE.
   *
   * La otra mitad de «la puerta existe»: que hay un final del enrutado y que no
   * se cae por él en silencio.
   */
  test('⭐ 2 · una ruta que no existe da 404 con su explicación', async () => {
    const r = await pedir('GET', '/api/no-existe-esto');
    assert.equal(r.codigo, 404);
    assert.match(JSON.parse(r.cuerpo).error, /no hay nada en GET \/api\/no-existe-esto/);
  });

  /**
   * ⭐ JUEZ 3 — EL PUERTO SALE DEL ENTORNO, CON EL 3000 DE DEFECTO.
   *
   * [12factor.net/config] la configuración no vive en el código, y su *port
   * binding* dice que el hosting asigna el puerto por la variable `PORT`. Lo
   * que se compra aquí es el defecto: sin `PORT`, **3000**, que es la rutina
   * local de siempre y no puede cambiar sin que alguien se entere.
   */
  /**
   * ⭐ JUEZ 4 — IMPORTAR EL MÓDULO **ARRANCA EL SERVIDOR**, que es lo que el
   *    panel de Hostinger exige (8/09).
   *
   * ── ⚠️ De dónde sale esta juez ──────────────────────────────────────────
   *
   * El primer despliegue dio **503**: `dist/` estaba, `logs/` no se había
   * creado, y el motor no escuchaba. La causa la dice el propio preload del
   * panel, literal:
   *
   * > *«Entry file uses "if (require.main === module)" to guard
   * > server.listen() — remove that condition, it is not supported on
   * > Hostinger Node.js hosting»*
   *
   * Su lanzador **IMPORTA** el entry en vez de ejecutarlo —vive en
   * `LSNODE_SOCKET` / `global.LsNode`—, así que el guardián de toda la vida
   * («corre esto solo si me han lanzado a mí») veía «no soy la entrada» y se
   * callaba. Cargaba 68.649 nodos para no escuchar en ningún puerto.
   *
   * ⚠️ **Por eso esto se comprueba con un HIJO y no importando aquí.** Lo que
   *    hay que comprar es la conducta del lanzador —importar el módulo—, y en
   *    este proceso el módulo ya está importado con `DESPLAZAME_SIN_ARRANCAR`
   *    puesta. El hijo se lanza **sin** esa variable y con `PORT=0` (puerto
   *    efímero: no pisa el 3000 de nadie).
   */
  test('⭐ 4 · un lanzador que IMPORTA el módulo lo pone a escuchar', async () => {
    const entrada = new URL('./servidor.ts', import.meta.url).href;
    const guion = [
      'const m = await import(process.argv[1]);',
      'const listo = () => {',
      "  console.log('ARRANCADO ' + m.servidor.address().port);",
      '  m.servidor.close();',
      '  process.exit(0);',
      '};',
      'if (m.servidor.listening) { listo(); } else { m.servidor.once("listening", listo); }',
    ].join('\n');

    const sinLaVariable: NodeJS.ProcessEnv = { ...process.env, PORT: '0' };
    delete sinLaVariable['DESPLAZAME_SIN_ARRANCAR'];

    const dicho = await new Promise<string>((listo, falla) => {
      const hijo = spawn(process.execPath, ['--input-type=module', '-e', guion, entrada], {
        env: sinLaVariable,
      });
      let salida = '';
      const reloj = setTimeout(() => {
        hijo.kill();
        falla(new Error(`el hijo no arrancó en 180 s. Lo que dijo:
${salida.slice(-800)}`));
      }, 180_000);
      hijo.stdout.on('data', (t: Buffer) => {
        salida += t.toString();
      });
      hijo.stderr.on('data', (t: Buffer) => {
        salida += t.toString();
      });
      hijo.on('close', () => {
        clearTimeout(reloj);
        listo(salida);
      });
    });

    assert.match(
      dicho,
      /ARRANCADO \d+/,
      `importar el módulo tiene que dejarlo escuchando. Lo que dijo el hijo:
${dicho.slice(-1200)}`,
    );
    // Y el puerto es el del entorno, no un 3000 escrito a mano: con PORT=0 el
    // sistema da uno libre, así que cualquier número > 0 prueba las dos cosas.
    const puerto = Number(/ARRANCADO (\d+)/.exec(dicho)![1]);
    assert.ok(puerto > 0, `puerto efímero de verdad: ${puerto}`);
  });

  /**
   * ⭐ JUEZ 5 — Y CON `require()`, QUE ES LO QUE EL LANZADOR HACE DE VERDAD.
   *
   * ── ⚠️ El segundo 503, y su frase ────────────────────────────────────────
   *
   * Invertir el guardián no bastó. El `stderr.log` del servidor, literal:
   *
   * > *«ERR_REQUIRE_ASYNC_MODULE: require() cannot be used on an ESM graph with
   * > top-level await. USE IMPORT() INSTEAD — From
   * > /usr/local/lsws/fcgi-bin/lsnode.js Requiring …/motor/dist/servidor.js»*
   *
   * `lsnode` no importa el entry: lo **requiere**. Y este motor tiene top-level
   * await a conciencia — medido con `--experimental-print-required-tla`, es
   * `await cocinarYServir(…)` en la 894 del emitido: la red de bus cocinada
   * ANTES de escuchar, para no contestar «no hay red» a quien llegue primero.
   *
   * `motor/arranque.cjs` es el puente que el propio error de Node dicta. Esta
   * juez compra **la conducta exacta del lanzador**: un hijo que hace
   * `require()` del puente —no `import()`— y acaba escuchando.
   *
   * ⚠️ Y no se compra por el log: se le pregunta. **El pid que dice el arranque
   *    tiene que ser el pid que contesta `/api/salud`**, que es la regla de casa
   *    para no medir contra un proceso que no es el que se cree.
   */
  test('⭐ 5 · un lanzador que hace require() del puente lo pone a escuchar', async () => {
    const puente = fileURLToPath(new URL('../arranque.cjs', import.meta.url));
    const puerto = await new Promise<number>((listo) => {
      const s = createServer();
      s.listen(0, () => {
        const suyo = (s.address() as AddressInfo).port;
        s.close(() => listo(suyo));
      });
    });

    const sinLaVariable: NodeJS.ProcessEnv = { ...process.env, PORT: String(puerto) };
    delete sinLaVariable['DESPLAZAME_SIN_ARRANCAR'];

    const hijo = spawn(process.execPath, ['-e', 'require(process.argv[1]);', puente], {
      env: sinLaVariable,
    });
    let salida = '';
    try {
      const dicho = await new Promise<string>((listo, falla) => {
        const reloj = setTimeout(
          () => falla(new Error(`el puente no arrancó en 180 s:\n${salida.slice(-800)}`)),
          180_000,
        );
        const mirar = (t: Buffer): void => {
          salida += t.toString();
          if (/escuchando en http:/.test(salida)) {
            clearTimeout(reloj);
            listo(salida);
          }
        };
        hijo.stdout.on('data', mirar);
        hijo.stderr.on('data', mirar);
        hijo.on('close', () => {
          clearTimeout(reloj);
          falla(new Error(`el puente murió sin escuchar:\n${salida.slice(-800)}`));
        });
      });

      const suPid = /escuchando en http:[^ ]+ \(pid (\d+)\)/.exec(dicho);
      assert.ok(suPid, `el arranque tiene que decir su pid: ${dicho.slice(-400)}`);

      // ⭐ Y contesta de verdad, no solo lo dice.
      const salud = (await (await fetch(`http://localhost:${puerto}/api/salud`)).json()) as {
        readonly ok: boolean;
        readonly pid: number;
      };
      assert.equal(salud.ok, true);
      assert.equal(salud.pid, Number(suPid[1]), 'el pid del log tiene que ser el pid que contesta');
    } finally {
      hijo.kill();
    }
  });

  test('⭐ 3 · sin PORT en el entorno, el puerto es 3000', () => {
    const suyo = process.env['PORT'];
    assert.equal(PUERTO, suyo === undefined ? 3000 : Number(suyo));
    assert.ok(Number.isFinite(PUERTO) && PUERTO >= 0, `el puerto tiene que ser un número: ${PUERTO}`);
  });
});
