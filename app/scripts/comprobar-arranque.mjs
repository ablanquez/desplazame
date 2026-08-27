/**
 * comprobar-arranque — verifica que el servidor de desarrollo que contesta es
 * el de AHORA, no uno anterior que se quedó vivo en el puerto.
 *
 * Nace de la entrada nº2 de docs/BITACORA.md: un `curl` devolvía 200 mientras
 * el servidor recién lanzado había muerto («Port 4200 is already in use») y
 * contestaba el proceso anterior, con la configuración vieja. Un código de
 * estado dice que ALGUIEN contesta; no dice QUIÉN ni CON QUÉ.
 *
 * Vale para las DOS piezas: la interfaz (por defecto, 4200) y el motor
 * (`motor`, 3000). Lo que comprueba cambia según cuál.
 *
 * QUÉ COMPRUEBA (y con qué código sale si falla)
 *   1. Que alguien contesta en el puerto ....................... 1
 *      · interfaz: que devuelve la aplicación (lleva <app-root>)   2
 *      · motor: que `/api/salud` cumple el contrato `Salud`        2
 *        y que lleva EL GRAFO cargado, con los recuentos de este
 *        repositorio — no solo que respire ................... 7
 *        y EL CALLEJERO, con su cifra sugerible .............. 8
 *        y LOS PORTALES enteros, concordando con el callejero  9
 *   2. QUIÉN: el PID que está escuchando ....................... 3
 *   3. Que ese proceso arrancó DESPUÉS de la última modificación
 *      de los ficheros que solo se leen al arrancar ............ 4
 *      · interfaz: angular.json, package.json, package-lock.json
 *        — el recargado en caliente NO los aplica.
 *      · motor: sus FUENTES (package.json, tsconfig.json y TODOS
 *        los .ts de src/) y ADEMÁS el fichero del grafo, que lee una
 *        sola vez al arrancar. Node ejecuta el TypeScript
 *        directamente y no recarga nada: tocar el servidor —o el
 *        dato— sin reiniciarlo deja corriendo el de antes. Es el
 *        fallo nº2 con otro disfraz.
 *   4. (solo interfaz) Que los recursos que el HTML anuncia se sirven .. 5
 *   5. (solo interfaz) Si los nombres traen hash de contenido —lo que
 *      hace `ng build` de serie—, que ese fichero esté en dist/ ....... 6
 *
 * QUÉ **NO** PUEDE DETECTAR — los límites, dichos y no escondidos:
 *   · `ng serve` NO pone hash de contenido en los nombres (comprobado: sirve
 *     `main.js`, no `main-XXXXXXXX.js`), así que en desarrollo la
 *     comprobación 5 no se puede hacer y la identidad se apoya en la 3. La 5
 *     solo muerde sirviendo una build de producción.
 *   · No detecta un servidor viejo si NO ha cambiado ninguno de esos tres
 *     ficheros: si solo cambió el código fuente, el recargado en caliente lo
 *     aplica y el servidor viejo es, de hecho, correcto.
 *   · No comprueba que la pantalla se PINTE. Sirve JavaScript, no lo ejecuta:
 *     un fallo en tiempo de ejecución pasa por aquí en verde.
 *   · No comprueba la red externa (las teselas de OpenStreetMap).
 *   · Lee el PID con `netstat -ano` y la hora con PowerShell: **solo Windows**.
 *
 * Uso:  npm run comprobar-arranque            → la interfaz, 4200
 *       npm run comprobar-arranque -- motor   → el motor, 3000
 * Sale con 0 si todo está bien; distinto de 0, con el motivo escrito.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dos perfiles. Sin argumentos, la interfaz en el 4200; con `motor`, el motor
 * en el 3000. Se puede forzar otro puerto detrás:
 *   npm run comprobar-arranque                 → interfaz, 4200
 *   npm run comprobar-arranque -- 4300         → interfaz, 4300
 *   npm run comprobar-arranque -- motor        → motor, 3000
 *   npm run comprobar-arranque -- motor 3001   → motor, 3001
 */
const ES_MOTOR = process.argv[2] === 'motor';
const PUERTO = Number(ES_MOTOR ? (process.argv[3] ?? 3000) : (process.argv[2] ?? 4200));
const BASE = `http://localhost:${PUERTO}`;
const APP = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const RAIZ = ES_MOTOR ? join(APP, '..', 'motor') : APP;

/**
 * Ficheros que solo se leen al arrancar. Para la interfaz son los de
 * configuración, porque el recargado en caliente no los aplica. Para el motor
 * son **sus fuentes**: Node ejecuta el TypeScript directamente y NO recarga en
 * caliente, así que tocar el servidor y no reiniciarlo deja corriendo el de
 * antes — el fallo de la entrada nº2 con otro disfraz.
 */
const SOLO_AL_ARRANCAR = ES_MOTOR
  ? [
      'package.json',
      'tsconfig.json',
      // Todas sus fuentes, no solo el servidor: el fichero que se olvida de
      // la lista es el que un día se toca sin reiniciar.
      ...readdirSync(join(RAIZ, 'src'))
        .filter((f) => f.endsWith('.ts'))
        .map((f) => join('src', f)),
      // Y los DATOS que lee al arrancar: los lee una sola vez, así que si
      // alguno cambia, el motor sirve el de antes hasta que se reinicie.
      join('..', 'app', 'data', 'grafo-visor.js'),
      join('..', 'app', 'data', '2026-05-13_zgzradar_callejero-vias-zaragoza.json'),
      join('..', 'app', 'data', '2026-05-13_zgzradar_callejero-portales-zaragoza.json'),
      // Los nombres de vía de OSM (§ 1.14). Viven en `motor/data/` y no en
      // `app/data/`, y el motor los lee al arrancar: si cambian, el que está
      // en marcha sirve los de antes.
      join('..', 'motor', 'data', '2026-08-02_osm_overpass_zaragoza-termino_nombres.json'),
      // Y los ejes de vía municipales (§ 1.15), de donde salen los nombres que
      // OSM no da. Mismo trato: se leen al arrancar y una sola vez.
      join('..', 'motor', 'data', '2026-08-20_idezar_wfs_urbanismo-vias_ejes.json'),
    ]
  : ['angular.json', 'package.json', 'package-lock.json'];

const DIST = join(APP, 'dist', 'desplazame', 'browser');

/**
 * Lo que el grafo tiene que traer si de verdad está cargado. Son los
 * recuentos verificados en el punto 4 sobre el fichero que hay en el
 * repositorio, y están escritos aquí a propósito: un motor que conteste con
 * otros números no está sirviendo ESTE grafo. Si algún día el grafo se
 * regenera, estos tres números cambian con él — y que la guardia se ponga
 * roja hasta que alguien los actualice es justo lo que se quiere.
 */
const GRAFO_ESPERADO = { nodos: 68649, aristas: 98774, vertices: 378222 };

/**
 * Y lo que tiene que traer el callejero. `sugeribles` es el número que se
 * publica, y desde el 27/08 son DOS cosas sumadas: las **2.731 con portal** y
 * las **619 que se resuelven por el punto medio** de su geometría en la capa de
 * ejes municipales. `porPuntoMedio` es la segunda mitad, y va aquí para que la
 * suma se pueda cuadrar en vez de creérsela.
 *
 * Las **9** que faltan para las 3.359 son las que no se pueden situar de
 * ninguna manera: **1** que la capa de ejes no conoce —GLORIETA LAS BANDERAS,
 * cod. 3410, y el desfase está contado en § 1.15 de las fichas— y **8** que
 * llegan con la multilínea vacía, los `DISEMINADO`.
 */
const CALLEJERO_ESPERADO = { vias: 3359, sugeribles: 3350, porPuntoMedio: 619, portales: 46150 };

/**
 * Y lo que tiene que traer LA RED ROUTABLE, que no es el grafo.
 *
 * El grafo son aristas sueltas; la red es el subgrafo andable con sus nodos ya
 * reconstruidos. Un motor puede tener el grafo cargado y no saber rutear, y
 * hasta el punto 7 eso era exactamente lo que pasaba — por eso hace falta una
 * comprobación propia y no vale con mirar el grafo.
 *
 * `aristas` 89.047 es el subgrafo `a=1 ∧ c=0` **y permitido al peatón**: sobre
 * las 93.503 de antes, la tabla de acceso de `andando.ts` cierra 4.456 de
 * carril bici. `cerradas` es esa cifra, y va aquí porque una red que encoge sin
 * que nadie lo note es justo lo que la tabla no quiere ser.
 *
 * `nodos` 64.274 es lo que sale de juntar coordenadas. Antes de la tabla eran
 * 65.697, diez menos que los 65.707 que el fichero declara, y esos diez siguen
 * sin CONSTAR; los otros 1.423 los cierra la tabla. `nombres` 19.897 es el
 * fichero de § 1.14 entero, que no depende de la red.
 *
 * `heredados` 18.779 son los *ways* mudos que cogen su nombre del callejero
 * municipal por vecindad (§ 1.15). Va aquí y no como adorno: es el número que
 * distingue un motor que cruzó los ejes de uno que arrancó sin ellos, y ese
 * segundo contesta rutas correctas con dos tercios de los pasos mudos — que
 * es justo la clase de fallo que no se ve mirando si el motor responde.
 */
const RED_ESPERADA = {
  aristas: 89047,
  nodos: 64274,
  nombres: 19897,
  heredados: 18779,
  cerradas: 4456,
};

/**
 * Y lo que tienen que traer los portales, ahora que el motor los carga
 * enteros y no solo los cuenta. `total` es el censo municipal completo;
 * `vias` es en cuántas vías se reparten.
 *
 * Además se comprueba que CONCUERDAN con lo que declara el callejero: son el
 * mismo censo contado una sola vez, así que `portales.total` tiene que valer
 * lo mismo que `callejero.portales`, y `portales.vias` lo mismo que
 * `callejero.sugeribles` **menos `callejero.porPuntoMedio`**. Si un día dejaran
 * de coincidir, es que alguien volvió a contar por su cuenta.
 *
 * ⭐ Esa resta es la comprobación, y no una forma rebuscada de escribir 2.731:
 * cuadra que la partición **cierre** —que toda vía sugerible sea o de portal o
 * de punto medio, y ninguna de las dos ni de ninguna—, que es justo lo que un
 * total suelto ya no puede decir.
 */
const PORTALES_ESPERADO = { total: 46150, vias: 2731 };

/**
 * Rojo. Lanza en vez de salir: `process.exit()` con peticiones a medio cerrar
 * revienta libuv en Windows y devuelve 127 en lugar del código de este fallo.
 */
class Rojo extends Error {
  constructor(codigo, texto, detalle) {
    super(texto);
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

const bien = (texto) => console.log(`  OK   ${texto}`);
const nota = (texto) => console.log(`  --   ${texto}`);

function mal(codigo, texto, detalle) {
  throw new Rojo(codigo, texto, detalle);
}

async function pedir(ruta) {
  try {
    const r = await fetch(BASE + ruta, { signal: AbortSignal.timeout(8000) });
    return { estado: r.status, cuerpo: await r.text() };
  } catch (e) {
    return { estado: 0, cuerpo: '', error: e.message };
  }
}

async function comprobar() {
  // 1 · ¿Contesta alguien, y contesta lo que tiene que contestar?
  const ruta = ES_MOTOR ? '/api/salud' : '/';
  const portada = await pedir(ruta);
  if (portada.estado !== 200) {
    mal(
      1,
      `nadie contesta en el puerto ${PUERTO} (estado ${portada.estado})`,
      portada.error ?? `${ES_MOTOR ? 'el motor' : 'el servidor'} no está levantado`,
    );
  }
  if (ES_MOTOR) {
    let salud;
    try {
      salud = JSON.parse(portada.cuerpo);
    } catch {
      mal(2, `algo contesta en el puerto ${PUERTO}, pero no devuelve JSON`, portada.cuerpo.slice(0, 80));
    }
    if (salud.ok !== true || typeof salud.pid !== 'number' || typeof salud.arrancado !== 'string') {
      mal(2, 'contesta JSON, pero no tiene la forma de Salud', portada.cuerpo.slice(0, 120));
    }
    bien(`/api/salud contesta 200 y cumple el contrato (pid ${salud.pid})`);

    // 1b · ¿Lleva el grafo cargado, y es ESTE grafo?
    // Es la comprobación que separa un motor útil de uno que solo respira.
    const g = salud.grafo;
    if (!g || typeof g.aristas !== 'number' || typeof g.nodos !== 'number') {
      mal(7, 'el motor contesta pero NO declara grafo: arrancó sin cargarlo', portada.cuerpo.slice(0, 160));
    }
    for (const [campo, esperado] of Object.entries(GRAFO_ESPERADO)) {
      if (g[campo] !== esperado) {
        mal(
          7,
          `el grafo cargado no es el de este repositorio: ${campo} = ${g[campo]}`,
          `esperado ${esperado}, verificado en el punto 4 sobre app/data/grafo-visor.js`,
        );
      }
    }
    bien(
      `lleva el grafo: ${g.aristas} aristas · ${g.nodos} nodos · ${g.vertices} vértices ` +
        `(cargado en ${g.cargadoEnMs} ms)`,
    );

    // 1b bis · ¿Sabe RUTEAR, o solo tiene el grafo en un cajón?
    const r = salud.red;
    if (!r || typeof r.aristas !== 'number' || typeof r.nodos !== 'number') {
      mal(
        7,
        'el motor lleva el grafo pero NO declara red: no puede calcular rutas',
        portada.cuerpo.slice(0, 200),
      );
    }
    for (const [campo, esperado] of Object.entries(RED_ESPERADA)) {
      if (r[campo] !== esperado) {
        mal(
          7,
          `la red levantada no es la de este repositorio: ${campo} = ${r[campo]}`,
          `esperado ${esperado}, medido en el punto 7 sobre el subgrafo a=1 ∧ c=0`,
        );
      }
    }
    // La red tiene que ser MENOR que el grafo: si coincidieran, es que el
    // filtro de andable y componente dejó de aplicarse y las rutas podrían
    // meter a alguien por una autopista o por una isla.
    if (r.aristas >= g.aristas) {
      mal(
        7,
        'la red tiene tantas aristas como el grafo: el filtro andable no se aplica',
        `red ${r.aristas} · grafo ${g.aristas}`,
      );
    }
    bien(
      `sabe rutear: ${r.aristas} aristas andables · ${r.nodos} nodos · ` +
        `${r.nombres} nombres + ${r.heredados} heredados · ${r.celdas} celdas ` +
        `(levantado en ${r.cargadoEnMs} ms)`,
    );

    // 1c · ¿Lleva el callejero, y es ESTE?
    const c = salud.callejero;
    if (
      !c ||
      typeof c.sugeribles !== 'number' ||
      typeof c.vias !== 'number' ||
      typeof c.porPuntoMedio !== 'number'
    ) {
      mal(8, 'el motor contesta pero NO declara callejero: arrancó sin cargarlo', portada.cuerpo.slice(0, 200));
    }
    for (const [campo, esperado] of Object.entries(CALLEJERO_ESPERADO)) {
      if (c[campo] !== esperado) {
        mal(
          8,
          `el callejero cargado no es el de este repositorio: ${campo} = ${c[campo]}`,
          `esperado ${esperado}, medido en el cruce callejero↔portales`,
        );
      }
    }
    bien(
      `lleva el callejero: ${c.vias} vías, ${c.sugeribles} sugeribles ` +
        `(${c.sugeribles - c.porPuntoMedio} con portal · ${c.porPuntoMedio} por punto medio), ` +
        `${c.portales} portales (cargado en ${c.cargadoEnMs} ms)`,
    );

    // 1d · ¿Lleva los portales ENTEROS, y son los de este censo?
    // Contarlos ya no basta: ahora se sirven uno a uno y hay que saber que
    // están en memoria, no solo que alguien los contó al arrancar.
    const p = salud.portales;
    if (!p || typeof p.total !== 'number' || typeof p.vias !== 'number') {
      mal(
        9,
        'el motor contesta pero NO declara portales: arrancó sin cargarlos',
        portada.cuerpo.slice(0, 240),
      );
    }
    for (const [campo, esperado] of Object.entries(PORTALES_ESPERADO)) {
      if (p[campo] !== esperado) {
        mal(
          9,
          `los portales cargados no son los de este repositorio: ${campo} = ${p[campo]}`,
          `esperado ${esperado}, contado sobre app/data/…callejero-portales-zaragoza.json`,
        );
      }
    }
    if (p.total !== c.portales || p.vias !== c.sugeribles - c.porPuntoMedio) {
      mal(
        9,
        'los portales y el callejero NO concuerdan: alguien está contando dos veces',
        `portales ${p.total}/${p.vias} · callejero ${c.portales}/` +
          `${c.sugeribles}−${c.porPuntoMedio}=${c.sugeribles - c.porPuntoMedio}`,
      );
    }
    bien(
      `lleva los portales: ${p.total} en ${p.vias} vías (cargado en ${p.cargadoEnMs} ms) ` +
        `y concuerdan con el callejero`,
    );
  } else {
    if (!portada.cuerpo.includes('<app-root>')) {
      mal(2, `algo contesta en el puerto ${PUERTO}, pero no es Desplázame`, 'no aparece <app-root>');
    }
    bien('contesta 200 y trae <app-root>');
  }

  // 2 · ¿Quién contesta?
  let pid;
  try {
    const salida = execSync(`netstat -ano | findstr :${PUERTO}`, { encoding: 'utf8' });
    pid = salida
      .split('\n')
      .find((l) => /LISTENING/i.test(l))
      ?.trim()
      .split(/\s+/)
      .pop();
  } catch {
    pid = undefined;
  }
  if (!pid) {
    mal(3, 'no se pudo averiguar QUIÉN escucha en el puerto', 'netstat no devolvió un PID');
  }
  bien(`escucha el PID ${pid}`);

  // 3 · ¿Arrancó después de la última configuración?
  let arranque;
  try {
    arranque = new Date(
      execSync(
        `powershell -NoProfile -Command "(Get-Process -Id ${pid}).StartTime.ToString('o')"`,
        { encoding: 'utf8' },
      ).trim(),
    );
  } catch {
    mal(3, `no se pudo averiguar cuándo arrancó el PID ${pid}`);
  }

  for (const fichero of SOLO_AL_ARRANCAR) {
    const ruta = join(RAIZ, fichero);
    if (!existsSync(ruta)) continue;
    const tocado = statSync(ruta).mtime;
    if (tocado > arranque) {
      mal(
        4,
        `el servidor arrancó ANTES de que cambiara ${fichero}: sirve configuración vieja`,
        `${fichero} tocado a las ${tocado.toISOString()} · PID ${pid} arrancó a las ${arranque.toISOString()}`,
      );
    }
  }
  bien(`arrancó (${arranque.toISOString()}) después de ${SOLO_AL_ARRANCAR.join(', ')}`);

  // El motor termina aquí: no sirve HTML ni tiene bundles que comprobar.
  if (ES_MOTOR) {
    return;
  }

  // 4 · ¿Sirve de verdad lo que su propio HTML anuncia?
  // Set: el HTML de producción referencia la hoja de estilos dos veces (la
  // segunda dentro de <noscript>); no hay que comprobarla ni contarla dos veces.
  const anunciados = [
    ...new Set(
      [...portada.cuerpo.matchAll(/(?:src|href)="\/?((?:main|styles)[^"]*\.(?:js|css))"/g)].map(
        (m) => m[1],
      ),
    ),
  ];

  if (anunciados.length === 0) {
    mal(5, 'el HTML servido no anuncia ni main*.js ni styles*.css');
  }

  for (const recurso of anunciados) {
    const r = await pedir('/' + recurso);
    if (r.estado !== 200 || r.cuerpo.length === 0) {
      mal(5, `el HTML anuncia ${recurso} pero el servidor no lo sirve`, `estado ${r.estado}`);
    }
    bien(`sirve ${recurso} (${r.cuerpo.length} bytes)`);
  }

  // 5 · Hash de contenido: solo existe en build de producción.
  const conHash = anunciados.filter((r) => /-[A-Z0-9]{8}\.(js|css)$/.test(r));
  if (conHash.length === 0) {
    nota('sin hash de contenido en los nombres: es `ng serve`.');
    nota('la identidad la avala la comprobación 3, no un hash.');
  } else {
    for (const recurso of conHash) {
      if (!existsSync(join(DIST, recurso))) {
        mal(6, `sirve ${recurso}, que NO está en dist/: es de otra build`);
      }
      bien(`${recurso} coincide con la build de dist/`);
    }
  }
}

console.log(`comprobar-arranque · ${BASE}\n`);

try {
  await comprobar();
  console.log('\nVERDE: contesta la aplicación, se sabe quién, y no es un servidor caducado.');
} catch (e) {
  if (!(e instanceof Rojo)) throw e;
  console.error(`  MAL  ${e.message}`);
  if (e.detalle) console.error(`       ${e.detalle}`);
  console.error(`\nROJO: ${e.message}`);
  process.exitCode = e.codigo;
}
