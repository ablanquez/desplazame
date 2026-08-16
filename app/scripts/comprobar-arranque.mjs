/**
 * comprobar-arranque — verifica que el servidor de desarrollo que contesta es
 * el de AHORA, no uno anterior que se quedó vivo en el puerto.
 *
 * Nace de la entrada nº2 de docs/BITACORA.md: un `curl` devolvía 200 mientras
 * el servidor recién lanzado había muerto («Port 4200 is already in use») y
 * contestaba el proceso anterior, con la configuración vieja. Un código de
 * estado dice que ALGUIEN contesta; no dice QUIÉN ni CON QUÉ.
 *
 * QUÉ COMPRUEBA (y con qué código sale si falla)
 *   1. Que alguien contesta en el puerto ....................... 1
 *      y que lo que devuelve es la aplicación (lleva <app-root>)  2
 *   2. QUIÉN: el PID que está escuchando ....................... 3
 *   3. Que ese proceso arrancó DESPUÉS de la última modificación
 *      de los ficheros que solo se leen al arrancar ............ 4
 *      (angular.json, package.json, package-lock.json). El
 *      recargado en caliente NO los aplica: un servidor anterior
 *      a ellos sirve configuración caducada. Es el fallo nº2.
 *   4. Que los recursos que el propio HTML anuncia se sirven ... 5
 *   5. Si los nombres traen hash de contenido —lo que hace
 *      `ng build` de serie—, que ese fichero esté en dist/ ..... 6
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
 * Uso:  npm run comprobar-arranque  [puerto]
 * Sale con 0 si todo está bien; distinto de 0, con el motivo escrito.
 */

import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PUERTO = Number(process.argv[2] ?? 4200);
const BASE = `http://localhost:${PUERTO}`;
const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Ficheros que solo se leen al arrancar: el recargado en caliente no los aplica. */
const SOLO_AL_ARRANCAR = ['angular.json', 'package.json', 'package-lock.json'];

const DIST = join(RAIZ, 'dist', 'desplazame', 'browser');

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
  // 1 · ¿Contesta alguien, y contesta la aplicación?
  const portada = await pedir('/');
  if (portada.estado !== 200) {
    mal(
      1,
      `nadie contesta en el puerto ${PUERTO} (estado ${portada.estado})`,
      portada.error ?? 'el servidor no está levantado',
    );
  }
  if (!portada.cuerpo.includes('<app-root>')) {
    mal(2, `algo contesta en el puerto ${PUERTO}, pero no es Desplázame`, 'no aparece <app-root>');
  }
  bien('contesta 200 y trae <app-root>');

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
