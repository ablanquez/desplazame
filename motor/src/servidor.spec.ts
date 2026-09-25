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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Salud } from '@desplazame/tipos';
import { diasHastaCaducidad, elFeedQueSeSirve, estadoDeCaducidad } from './feed.ts';
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
const {
  atenderPeticion,
  elPuertoYSuOrigen,
  PUERTO,
  RAIZ_DE_LA_APP,
  hayAppConstruida,
  servirDeLaApp,
} = await import('./servidor.ts');

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
      end(cuerpo?: string | Buffer) {
        escrito.cuerpo = typeof cuerpo === 'string' ? cuerpo : (cuerpo?.toString('utf8') ?? '');
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
  /**
   * ⭐ JUEZ 1b — Y `/api/salud` DICE LA CADUCIDAD DEL FEED QUE SE ESTÁ SIRVIENDO.
   *
   * ── ⚠️ Por qué hace falta ────────────────────────────────────────────────
   *
   * El panel de frescura lee `datapackage.json`, y esa fila apunta a la
   * **semilla** del repositorio. El motor sirve el **vivo**, que el cron renueva
   * cada noche. Hoy coinciden —medido: el mismo sha256— pero son **dos verdades
   * para la misma pregunta**, y en cuanto entre un feed nuevo la pantalla
   * seguiría enseñando la caducidad de la semilla.
   *
   * Aquí se publica la operativa: la del zip que de verdad se está sirviendo,
   * calculada por el mismo `estadoDeCaducidad` que el arranque grita y que el
   * aviso de la pantalla usa. **Una sola verdad, un solo sitio de donde sale.**
   */
  test('⭐ 1b · /api/salud publica el sello, el vencimiento y el estado del feed servido', async () => {
    const r = await pedir('GET', '/api/salud');
    const salud = JSON.parse(r.cuerpo) as Salud;

    assert.ok(salud.feed, 'la salud tiene que traer el feed servido');
    assert.equal(typeof salud.feed.sello, 'string');
    assert.ok(salud.feed.sello.length > 0, 'el sello es el feed_version del zip servido');
    assert.match(salud.feed.vence, /^\d{8}$|^$/, `vence en AAAAMMDD o vacío: «${salud.feed.vence}»`);
    assert.ok(
      ['vigente', 'aviso', 'caducado'].includes(salud.feed.estado),
      `estado inesperado: ${salud.feed.estado}`,
    );

    // ⭐ Y no es un texto suelto: cuadra con la función que lo decide todo.
    const servido = elFeedQueSeSirve();
    assert.equal(salud.feed.sello, servido.info?.feedVersion ?? '');
    assert.equal(salud.feed.vence, servido.info?.feedEndDate ?? '');
    assert.equal(
      salud.feed.estado,
      estadoDeCaducidad(diasHastaCaducidad(servido.info?.feedEndDate ?? '', new Date())),
    );
  });

  test('⭐ 2 · una ruta que no existe da 404 con su explicación', async () => {
    const r = await pedir('GET', '/api/no-existe-esto');
    assert.equal(r.codigo, 404);
    assert.match(JSON.parse(r.cuerpo).error, /no hay nada en GET \/api\/no-existe-esto/);
  });

  /**
   * ⭐ JUEZ 3 — EL PUERTO SALE DEL ENTORNO, CON EL 3000 DE DEFECTO, Y LA VACÍA
   *    NO ES UNA VARIABLE PUESTA.
   *
   * [12factor.net/config] la configuración no vive en el código, y su *port
   * binding* dice que el hosting asigna el puerto por la variable `PORT`. Lo
   * que se compra aquí es el defecto: sin `PORT`, **3000**, que es la rutina
   * local de siempre y no puede cambiar sin que alguien se entere.
   *
   * ⛔ **ACTA (E-1, T4 25/09). Aquí ponía `assert.equal(PUERTO, suyo ===
   *    undefined ? 3000 : Number(suyo))`, y eso no compraba nada**: calculaba
   *    lo esperado **con la misma expresión que vigilaba**, leyendo el mismo
   *    `process.env` — la tautología que el §4·C nombra, `expect(CONSTANTE)` en
   *    vez del cableado—. Con `PORT=''` la fórmula daba `0` y el código daba
   *    `0`: los dos de acuerdo, y el motor escuchando **donde nadie lo busca**.
   *    Por eso el agujero llegó vivo hasta la auditoría con esta juez en verde.
   *
   * Ahora se compran las **tres ramas** contra la función que decide, con
   * valores escritos a mano y no leídos del entorno:
   *
   *   · vacía (y a espacios) → **3000**, y dicho «defecto»
   *   · número              → ese número, y dicho «entorno»
   *   · basura              → `NaN`, que es lo que hace que el `listen` muera
   *                           **RUIDOSAMENTE**. Eso se compra aquí también: es
   *                           la mitad buena de la historia y no se puede
   *                           perder al arreglar la otra.
   *
   * Y que el valor exportado **sale de esa función** lo compra la juez 5, que
   * arranca un motor de verdad con su `PORT` y lee la línea del arranque.
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
  /**
   * ⛔ ACTA DEL SKIP HONESTO (D-1·2 de la auditoría de cierre, T4 25/09).
   *
   * Esta juez necesita `motor/dist/servidor.js` —lo que `arranque.cjs` requiere—
   * y ese fichero **lo produce `npm run build` y el `.gitignore` lo excluye**
   * (línea 7): **un clon nunca lo trae**. Hasta hoy eso era un `ROJO` con
   * `ERR_MODULE_NOT_FOUND` en la cara de cualquiera que clonara y corriera
   * `npm run probar`, y el rojo **no era suyo**.
   *
   * ── LA ELECCIÓN, MEDIDA ANTES DE ELEGIR ─────────────────────────────────
   *
   * El encargo permitía construir el puente aquí dentro **si era barato y sin
   * efectos**. Se midió: `npm run build --workspace @desplazame/motor` tarda
   * **1,6 s en frío** y 3,0 s con `dist` ya hecho. **Barato sí. Sin efectos
   * NO**, por dos razones:
   *
   * 1. Escribe **106 ficheros y 1,7 MB en `motor/dist`**, que es el artefacto
   *    que el puente de Hostinger sirve. Una prueba de unidad que reconstruye
   *    el artefacto de despliegue **pisa lo que el operador tenga ahí**, sin
   *    pedir permiso y sin decirlo.
   * 2. Y la peor: una prueba que se construye su propio prerrequisito **no
   *    puede volver a avisar de que falta**. El dato que D-1 quiere en pantalla
   *    —que el paso del build existe y el README de la raíz no lo nombra— se
   *    perdería para siempre detrás de un verde. Es el «verde prestado» del
   *    §4·C, que la propia regla pone por debajo del skip: *«un skipped honesto
   *    > un rojo por entorno > un verde prestado»*.
   *
   * Así que se salta **diciendo el paso exacto**, que es lo único que hacía
   * falta. Con el `dist` hecho —la máquina de Antonio, el servidor— corre igual
   * que siempre: esto no relaja la juez, le pone un porqué.
   *
   * ⚠️ **Y queda dicho lo que esta juez mide, porque no es obvio:** el puente
   *    requiere `dist/servidor.js`, o sea el **artefacto EMITIDO**, no el
   *    fuente. Eso es lo correcto —es lo que Hostinger ejecuta—, pero significa
   *    que **una ley nueva del fuente no se puede comprar aquí**: con un `dist`
   *    de ayer, esta juez daría rojo por un cambio de hoy que está bien. Las
   *    leyes del arranque se compran contra el fuente, y de eso se encargan las
   *    juezas 13 a 15. Descubierto al intentar justo eso (T4, E-1).
   */
  const PUENTE_EMITIDO = fileURLToPath(new URL('../dist/servidor.js', import.meta.url));
  const SIN_PUENTE = !existsSync(PUENTE_EMITIDO);

  test('⭐ 5 · un lanzador que hace require() del puente lo pone a escuchar', {
    skip: SIN_PUENTE
      ? 'necesita motor/dist — npm run build --workspace @desplazame/motor'
      : false,
  }, async () => {
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

  // ══ LA PORTADA ═══════════════════════════════════════════════════════════
  //
  // ⭐ EL MOTOR SIRVE LA APP (8/09, LA PORTADA paso 1).
  //
  // [angular.dev/tools/cli/deployment, literal] *«ng build genera los
  // artefactos en dist/… copia este directorio al servidor y configura el
  // servidor para servirlo»* y *«si la app usa el router, el servidor debe
  // devolver index.html cuando se le pida un fichero que no tiene»*.
  //
  // ⚠️ En Hostinger el `.htaccess` de `public_html` enruta TODO a la app de
  //    Node, así que los estáticos NO los sirve Apache: los sirve este motor.
  //    No es una comodidad, es la única puerta que hay.

  /** Un fichero de verdad del dist, con su nombre hasheado del build. */
  const unJsDelDist = (): string =>
    readdirSync(RAIZ_DE_LA_APP).find((f) => f.endsWith('.js'))!;

  /** ⭐ JUEZ 6 — LA RAÍZ DEVUELVE EL `index.html`. */
  test('⭐ 6 · GET / devuelve el index.html, con su MIME', async () => {
    const r = await pedir('GET', '/');
    assert.equal(r.codigo, 200);
    assert.match(r.cabeceras['Content-Type'] ?? '', /^text\/html/);
    assert.match(r.cuerpo, /<app-root><\/app-root>/, 'tiene que ser el index de Angular');
  });

  /**
   * ⭐ JUEZ 7 — Y UNA RUTA HONDA TAMBIÉN: el deep link.
   *
   * Es la frase de Angular al pie de la letra: el servidor no tiene ese
   * fichero, y aun así devuelve el index para que el router del navegador
   * resuelva. Sin esto, recargar en `/panel` da 404.
   */
  test('⭐ 7 · una ruta honda que no es un fichero devuelve el index', async () => {
    const r = await pedir('GET', '/una/ruta/honda');
    assert.equal(r.codigo, 200);
    assert.match(r.cabeceras['Content-Type'] ?? '', /^text\/html/);
    assert.match(r.cuerpo, /<app-root><\/app-root>/);
  });

  /** ⭐ JUEZ 8 — UN FICHERO DE VERDAD SALE ENTERO Y CON SU MIME. */
  test('⭐ 8 · un .js del dist sale con su contenido y su MIME', async () => {
    const nombre = unJsDelDist();
    const r = await pedir('GET', `/${nombre}`);
    assert.equal(r.codigo, 200, `pedido /${nombre}`);
    assert.match(r.cabeceras['Content-Type'] ?? '', /^text\/javascript/);
    assert.equal(r.cuerpo, readFileSync(join(RAIZ_DE_LA_APP, nombre), 'utf8'));
  });

  /**
   * ⭐ JUEZ 9 — Y EL JSON DEL DATO SALE COMO JSON.
   *
   * ⚠️ **No es un extra.** La pantalla pide `data/…ZBE.json` para pintar la
   *    Zona de Bajas Emisiones y `datapackage.json` para el panel. Si esas dos
   *    cayeran en el `index.html` del deep link, el `fetch` recibiría HTML y la
   *    zona no se pintaría — con 200 y sin ruido.
   */
  test('⭐ 9 · el datapackage.json sale con MIME de json, no como index', async () => {
    const r = await pedir('GET', '/datapackage.json');
    assert.equal(r.codigo, 200);
    assert.match(r.cabeceras['Content-Type'] ?? '', /^application\/json/);
    assert.doesNotMatch(r.cuerpo, /<app-root>/, 'no puede ser el index disfrazado');
    JSON.parse(r.cuerpo);
  });

  /** ⭐ JUEZ 10 — `/api/*` INTACTO: la portada no se come la API. */
  test('⭐ 10 · /api/salud sigue contestando su JSON, no el index', async () => {
    const r = await pedir('GET', '/api/salud');
    assert.equal(r.codigo, 200);
    assert.match(r.cabeceras['Content-Type'] ?? '', /^application\/json/);
    assert.equal((JSON.parse(r.cuerpo) as { ok: boolean }).ok, true);
    // Y lo que no existe bajo /api sigue siendo un 404 honesto, no el index.
    const no = await pedir('GET', '/api/no-existe-esto');
    assert.equal(no.codigo, 404);
  });

  /**
   * ⭐ JUEZ 11 — EL PATH TRAVERSAL MUERE EN 404.
   *
   * ⚠️ Servir ficheros por su ruta es la puerta clásica: `../../` saca del dist
   *    y llega a `.env.local`. Se comprueba con la ruta cruda Y con la
   *    codificada, porque `%2e%2e` es lo mismo para quien lo intenta.
   */
  test('⭐ 11 · salirse del dist con ../ da 404 y no lee nada', async () => {
    for (const ruta of [
      '/../../motor/.env.local',
      '/..%2f..%2fmotor%2f.env.local',
      '/%2e%2e/%2e%2e/package.json',
      '/../package.json',
      '/..%5c..%5cmotor%5c.env.local',
    ]) {
      const r = await pedir('GET', ruta);
      assert.equal(r.codigo, 404, `${ruta} tenía que dar 404 y dio ${r.codigo}`);
      assert.doesNotMatch(r.cuerpo, /NAP_API_KEY|"workspaces"/, `${ruta} filtró contenido`);
    }
  });

  /**
   * ⭐ JUEZ 12 — SIN DIST, EL MOTOR NO INVENTA NADA.
   *
   * Un clon recién hecho puede no tener la app construida. Entonces
   * `servirDeLaApp` dice que no ha atendido —y el 404 honesto de siempre se
   * queda—, y `hayAppConstruida` es lo que el arranque mira para avisar.
   */
  test('⭐ 12 · sin dist, no se sirve nada y el arranque puede avisar', () => {
    assert.equal(hayAppConstruida(RAIZ_DE_LA_APP), true, 'aquí SÍ está construida');
    const inventada = join(RAIZ_DE_LA_APP, 'no-existe-este-dist');
    assert.equal(hayAppConstruida(inventada), false);

    let toco = false;
    const respuesta = {
      writeHead: () => {
        toco = true;
        return respuesta;
      },
      end: () => {
        toco = true;
        return respuesta;
      },
    };
    const atendida = servirDeLaApp(
      { method: 'GET', url: '/', headers: {} } as unknown as IncomingMessage,
      respuesta as unknown as ServerResponse,
      inventada,
    );
    assert.equal(atendida, false, 'sin dist no puede decir que atendió');
    assert.equal(toco, false, 'y no puede haber escrito nada en la respuesta');
  });

  test('⭐ 3 · sin PORT, con PORT vacía y con PORT basura: las tres ramas', () => {
    // Ausente y vacía son la MISMA cosa, y la vacía es la que se colaba.
    assert.deepEqual(elPuertoYSuOrigen(undefined), { puerto: 3000, origen: 'defecto' });
    assert.deepEqual(elPuertoYSuOrigen(''), { puerto: 3000, origen: 'defecto' });
    assert.deepEqual(elPuertoYSuOrigen('   '), { puerto: 3000, origen: 'defecto' });

    // Un número es un número, y se dice de dónde viene.
    assert.deepEqual(elPuertoYSuOrigen('8080'), { puerto: 8080, origen: 'entorno' });
    assert.deepEqual(elPuertoYSuOrigen(' 4200 '), { puerto: 4200, origen: 'entorno' });

    // Y la basura sigue dando NaN, que es lo que mata al `listen` a gritos.
    const basura = elPuertoYSuOrigen('no-soy-un-puerto');
    assert.equal(basura.origen, 'entorno', 'mal configurada NO es lo mismo que no configurada');
    assert.ok(Number.isNaN(basura.puerto), `la basura tiene que dar NaN: ${basura.puerto}`);
    assert.throws(
      () => createServer().listen(basura.puerto),
      /ERR_SOCKET_BAD_PORT/,
      'un puerto que no es número tiene que morir RUIDOSAMENTE, no arrancar mudo',
    );

    // ⚠️ Y el otro lado de la moneda, que es de donde salía el fallo: el 0 que
    //    daba la vacía es un puerto PERFECTAMENTE LEGAL para Node —«dame
    //    cualquiera libre»—, y por eso el arranque no se quejaba.
    assert.doesNotThrow(() => {
      const s = createServer();
      s.listen(0, () => s.close());
    }, 'listen(0) es legal: por eso la cadena vacía era un fallo MUDO');

    assert.ok(Number.isFinite(PUERTO) && PUERTO >= 0, `el puerto tiene que ser un número: ${PUERTO}`);
  });

  // ══ LAS DOS VARIABLES A MEDIAS, LEÍDAS EN UN ARRANQUE DE VERDAD ══════════
  //
  // ⭐ E-1 y E-2 de la auditoría de cierre (T4 25/09). Las dos preguntas son la
  //    misma: **qué dice el motor cuando el entorno está a medias**. Un hijo
  //    solo, con `PORT` y `DESPLAZAME_REGEN_TOKEN` **puestas y vacías** —que es
  //    lo que queda cuando alguien las borra a medias en el panel de un
  //    hosting—, y dos juezas leyendo su banner.
  //
  // ⚠️ `DESPLAZAME_SIN_ARRANCAR=1`: aquí no se abre ningún puerto. Con `PORT`
  //    vacía el motor caería al 3000 y se llevaría por delante el motor que
  //    Antonio tenga levantado. Se lee lo que DICE, no lo que escucha.
  //
  // ⚠️ Y el vaciado gana al fichero: `.env.local` puede traer un token bueno,
  //    pero lo que ya está en el entorno MANDA —es la semántica del cargador—,
  //    así que esta jueza mide igual en la máquina de Antonio y en un clon.
  // ⚠️ **Contra el FUENTE, no contra el `dist`**, que es la diferencia con la
  //    juez 5: esto son leyes del arranque de hoy, y el artefacto emitido puede
  //    ser de ayer. Un hijo por entorno, reutilizado por las juezas que lo
  //    comparten, para no pagar dos veces el arranque.
  const bannersPedidos = new Map<string, Promise<string>>();
  const elBannerCon = (variables: Record<string, string>): Promise<string> => {
    const clave = JSON.stringify(variables);
    const yaPedido = bannersPedidos.get(clave);
    if (yaPedido) return yaPedido;
    const pedido = new Promise<string>((listo, falla) => {
      const entrada = new URL('./servidor.ts', import.meta.url).href;
      const hijo = spawn(process.execPath, ['-e', 'import(process.argv[1]);', entrada], {
        // `DESPLAZAME_SIN_ARRANCAR` va SIEMPRE: aquí no se abre ningún puerto.
        env: { ...process.env, ...variables, DESPLAZAME_SIN_ARRANCAR: '1' },
      });
      let salida = '';
      const reloj = setTimeout(() => {
        hijo.kill();
        falla(new Error(`el arranque no dijo lo suyo en 120 s:\n${salida.slice(-800)}`));
      }, 120_000);
      const mirar = (t: Buffer): void => {
        salida += t.toString();
        // Se espera a la línea del FEED, que va DESPUÉS de las dos que aquí se
        // juzgan: esperar a la última de ellas se arriesga a cortar el hijo
        // entre dos `console.log` y perder justo la línea nueva.
        if (/motor: feed GTFS/.test(salida)) {
          clearTimeout(reloj);
          hijo.kill();
          listo(salida);
        }
      };
      hijo.stdout.on('data', mirar);
      hijo.stderr.on('data', mirar);
      // Si se muere antes de decirlo, las juezas fallan enseñando lo que dijo.
      hijo.on('close', () => {
        clearTimeout(reloj);
        listo(salida);
      });
    });
    bannersPedidos.set(clave, pedido);
    return pedido;
  };

  /**
   * ⭐ JUEZ 13 — CON `PORT` VACÍA, EL ARRANQUE DICE **3000 (DEFECTO)**.
   *
   * La juez 3 compra la regla; ésta compra que el motor la **aplica y la
   * cuenta**. Antes de esto, `PORT=''` dejaba al motor escuchando en un puerto
   * aleatorio del sistema y su banner no lo mencionaba: la única forma de
   * enterarse era que nadie contestara donde tocaba.
   */
  test('⭐ 13 · con PORT vacía, el arranque cae al 3000 y lo DICE', async () => {
    const dicho = await elBannerCon({ PORT: '', DESPLAZAME_REGEN_TOKEN: '' });
    assert.match(
      dicho,
      /motor: puerto 3000 \(defecto\)/,
      `una PORT vacía tiene que caer al 3000 y decirlo: ${dicho.slice(-600)}`,
    );
  });

  /**
   * ⭐ JUEZ 14 — CON `PORT` DE VERDAD, EL ARRANQUE DICE EL NÚMERO Y **«ENTORNO»**.
   *
   * La otra mitad de la misma línea, y la que ata el valor exportado al
   * entorno: sin ella, `elPuertoYSuOrigen` podría estar perfecta y no estar
   * cableada a nada. No se puede comprar en la juez 5 —aquélla arranca el
   * `dist`, que puede ser de ayer—, así que se compra aquí, contra el fuente.
   */
  test('⭐ 14 · con PORT puesta, el arranque dice ese puerto y de dónde sale', async () => {
    const dicho = await elBannerCon({ PORT: '9099' });
    assert.match(
      dicho,
      /motor: puerto 9099 \(entorno\)/,
      `el puerto del entorno tiene que salir dicho y nombrado: ${dicho.slice(-600)}`,
    );
  });

  /**
   * ⭐ JUEZ 15 — SIN TOKEN, EL ARRANQUE **NOMBRA LA CAPACIDAD APAGADA**.
   *
   * El motor ya decía *«sin .env.local […]; manda el entorno»* —cierto y
   * suficiente para un humano atento—, pero no nombraba **qué deja de
   * funcionar**: el endpoint de renovación quedaba muerto y solo se sabía
   * llamándolo. Esa línea se queda; esta juez compra la que faltaba.
   *
   * ⚠️ Se compra el TEXTO, con el nombre de la variable y el mínimo dentro,
   *    porque es lo que alguien va a buscar en el log de un panel remoto. Y no
   *    se compra ningún valor de ningún secreto: aquí no hay ninguno.
   */
  test('⭐ 15 · sin token válido, el arranque nombra la renovación APAGADA', async () => {
    const dicho = await elBannerCon({ PORT: '', DESPLAZAME_REGEN_TOKEN: '' });
    assert.match(
      dicho,
      /motor: renovación del feed: APAGADA \(sin DESPLAZAME_REGEN_TOKEN o de menos de 32 caracteres\)/,
      `el arranque tiene que nombrar la capacidad apagada: ${dicho.slice(-600)}`,
    );
    // Y la línea de siempre SIGUE ahí: esto añade, no sustituye.
    assert.match(dicho, /motor: (sin \.env\.local|\.env\.local aporta)/, 'la línea del cargador se queda');
  });
});
