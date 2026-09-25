/**
 * ⭐ LA ENTRADA DE LA BATERÍA — las diez suites de pantalla, desde el repositorio.
 *
 * Uso:  npm run bateria                      · las diez, en orden
 *       npm run bateria -- pintura           · solo esa
 *       npm run bateria -- --url=https://…   · contra el dist o contra producción
 *       npm run bateria:pintura              · lo mismo, con su atajo
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ POR QUÉ EXISTE ESTE FICHERO (C-5 de la auditoría de cierre, 24/09).
 *
 *  Las diez suites son el guardián más caro y más completo de la casa —unas
 *  1.500 juezas— y **no se lanzaban desde ningún script del repositorio**: el
 *  lanzador vivía fuera. Quien clonaba tenía la documentación pero no el
 *  instrumento, y lo reconstruía a mano; equivocar una convención da fallos
 *  que parecen del producto (`EISDIR` al guardar una captura donde se esperaba
 *  una carpeta, `Illegal invocation` por apuntar a donde no hay nada).
 *
 *  ⚠️ **Aquí NO se rediseña cómo cada suite recibe sus argumentos.** Cada una
 *     los pide como los pide hoy y este fichero se los da: la tabla de abajo
 *     ES ese conocimiento, escrito una vez y en el repositorio, que es lo que
 *     el hallazgo pedía. Cambiar las convenciones sería otra tanda.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── Lo que hace falta tener levantado ───────────────────────────────────────
 *
 * El motor (`npm start --prefix motor`, puerto 3000) y la interfaz
 * (`npm start --prefix app`, puerto 4200). Las suites conducen un Chrome de
 * verdad por CDP; no hay dependencia que instalar.
 *
 * ⚠️ **EL DEFECTO ES `localhost` Y NO `127.0.0.1`, y está MEDIDO** (24/09).
 *
 *    El README avisa —con razón— de que en Windows `localhost` resuelve antes a
 *    `[::1]` y de que ahí puede escuchar otro proceso. Pero al montar esta
 *    entrada se midió lo que hace `ng serve` de verdad, y es lo contrario de lo
 *    que uno supondría:
 *
 *      TCP  [::1]:4200   LISTENING          ← lo único que hay
 *      curl http://localhost:4200/  → 200
 *      curl http://127.0.0.1:4200/  → 000   ← no contesta NADIE
 *
 *    El servidor de desarrollo de Angular **solo se ata al loopback de IPv6**,
 *    así que un lanzador con `127.0.0.1` por defecto no habría funcionado nunca
 *    contra `ng serve`. El aviso del README sigue siendo bueno donde nació:
 *    cuando se mide **un dist servido por otro proceso**, ahí sí conviene fijar
 *    `--url=http://127.0.0.1:PUERTO` para no medir un `ng serve` olvidado.
 *
 * ⚠️ **Van de una en una, nunca en paralelo.** `perfilesResiduales()` cuenta el
 *    directorio de perfiles de Chrome al acabar: dos suites a la vez se
 *    contarían los perfiles la una a la otra y las dos darían rojo.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E2E = join(RAIZ, 'app', 'e2e');

/**
 * ⭐ `MOTOR_LOG` — Y LO QUE SE APRENDIÓ AL INTENTAR RELLENARLO (24/09).
 *
 * `bizi-y-resumen` no da por caliente la capa de desvíos: **le pide al log del
 * motor que lo diga**, y sin `MOTOR_LOG` se pone roja con un «NO SE PUEDE
 * SABER» en vez de fingir. Bien por ella.
 *
 * ⚠️ **Y NO vale el log diario del repositorio**, aunque sea lo primero que uno
 *    prueba. Medido: la suite busca `/^motor: (ruta operativa de hoy|…) — /`,
 *    anclado al principio de la línea, y `motor/src/registro.ts` escribe en
 *    `motor/logs/<día>.log` con su marca delante:
 *
 *      2026-09-24T14:34:10.849Z I motor: ruta operativa de hoy — 74 sentidos …
 *      ^^^^^^^^^^^^^^^^^^^^^^^^^^^                               el ancla no llega
 *
 *    Con ese prefijo el patrón **no puede casar nunca**, y apuntar ahí da un
 *    «⏱ TIEMPO AGOTADO» a los dos minutos que parece del producto y no lo es.
 *    Se intentó, se midió y se descarta.
 *
 * Así que `MOTOR_LOG` es **una captura de la salida estándar del motor**, tal
 * cual la escupe: `npm start --prefix motor > motor.log`. Se pasa con
 * `--motor-log=RUTA`, o ya puesto en el entorno. Sin ella, la suite dice «NO SE
 * PUEDE SABER», que es su comportamiento honesto y está bien así.
 */
/**
 * ⭐ LAS DIEZ, CON SU CONVENCIÓN. Seis formas distintas, y son las de hoy.
 *
 * · `url`      dónde espera la dirección: `argv` (segundo argumento) o el
 *              nombre de la variable de entorno que lee.
 * · `segundo`  qué es su segundo argumento: `carpeta` (de capturas), `png`
 *              (el nombre del fichero), `caso` (las cuatro casillas del viaje,
 *              y entonces la captura va detrás, en su `argv[6]`) o nada.
 *
 * El orden es el de esta lista: primero las estructurales y baratas, y al final
 * las que salen a fuentes vivas y tardan más. **Es una decisión de aquí**, no
 * un orden heredado de ningún sitio.
 */
const SUITES = [
  { nombre: 'esqueleto', url: 'argv', segundo: 'carpeta' },
  { nombre: 'dos-filas', url: 'argv', segundo: 'png' },
  { nombre: 'identidad', url: 'argv', segundo: 'carpeta' },
  { nombre: 'creditos', url: 'argv', segundo: null },
  { nombre: 'pantalla', url: 'DESPLAZAME_URL', segundo: 'caso' },
  { nombre: 'pintura', url: 'argv', segundo: 'carpeta' },
  { nombre: 'bizi-y-resumen', url: 'APP', segundo: 'carpeta-primera', motorLog: true },
  { nombre: 'proximo-bus', url: 'APP', segundo: 'caso' },
  { nombre: 'moto', url: 'argv', segundo: 'png' },
  { nombre: 'yego', url: 'argv', segundo: 'png' },
];

/** El caso de ejemplo de las dos que conducen un viaje. El de su documentación. */
// ⚠️ LAS CUATRO CASILLAS ENTERAS, Y NO DOS (25/09, T4). Son exactamente los
//    valores que estas dos suites ponen por defecto —no cambia lo que miden—,
//    pero hay que escribirlas para poder darles lo que va DETRÁS: su `argv[6]`,
//    que es dónde dejan la captura. Con dos argumentos, ese sitio quedaba vacío
//    y la imagen caía en el directorio desde el que se lanzó la batería: la raíz
//    del repositorio. Lo avisaba la propia cabecera de `proximo-bus.mjs` —«una
//    imagen suelta ahí se cuela en el siguiente git add sin que nadie la
//    mire»— y esta entrada lo hacía igual. Cazado corriéndola: apareció
//    `proximo-bus.png` sin rastrear en la raíz.
const CASO = ['COLOSO', '2', 'CALLE OVIEDO', '5'];

function comoSeLlama(suite, url, capturas) {
  const args = [join(E2E, `${suite.nombre}.mjs`)];
  const env = { ...process.env };
  if (suite.url === 'argv') {
    args.push(url);
  } else {
    // ⚠️ `pantalla` y `proximo-bus` leen la URL del entorno a propósito: su
    //    `argv[2]` ya es la VÍA del caso. Está dicho en su cabecera.
    env[suite.url] = suite.url === 'APP' ? url.replace(/\/*$/, '/') : url;
  }
  if (suite.motorLog && MOTOR_LOG) env['MOTOR_LOG'] = MOTOR_LOG;
  if (suite.segundo === 'carpeta') args.push(capturas);
  else if (suite.segundo === 'carpeta-primera') args.push(capturas);
  else if (suite.segundo === 'png') args.push(join(capturas, `${suite.nombre}.png`));
  else if (suite.segundo === 'caso') args.push(...CASO, join(capturas, `${suite.nombre}.png`));
  return { args, env };
}

function correr(suite, url, capturas) {
  const { args, env } = comoSeLlama(suite, url, capturas);
  return new Promise((listo) => {
    const t0 = Date.now();
    const hijo = spawn(process.execPath, args, { env, stdio: 'inherit' });
    hijo.on('close', (codigo) => listo({ codigo: codigo ?? 1, ms: Date.now() - t0 }));
  });
}

// ── Los argumentos de ESTE guion ───────────────────────────────────────────
const sueltos = process.argv.slice(2);
const conValor = (nombre, porDefecto) => {
  const a = sueltos.find((x) => x.startsWith(`--${nombre}=`));
  return a ? a.slice(nombre.length + 3) : porDefecto;
};
const URL_BASE = conValor('url', 'http://localhost:4200');
const CAPTURAS = resolve(RAIZ, conValor('capturas', join('app', 'e2e', 'capturas')));
// La captura de `stdout` del motor, si la hay. Ver `MOTOR_LOG` arriba.
const MOTOR_LOG = conValor('motor-log', process.env['MOTOR_LOG'] ?? null);
const pedidas = sueltos.filter((x) => !x.startsWith('--'));

const elegidas = pedidas.length
  ? pedidas.map((n) => {
      const s = SUITES.find((x) => x.nombre === n);
      if (!s) {
        console.error(`No existe la suite «${n}». Son: ${SUITES.map((x) => x.nombre).join(', ')}`);
        process.exit(2);
      }
      return s;
    })
  : SUITES;

mkdirSync(CAPTURAS, { recursive: true });
console.log(`batería · ${elegidas.length} suite(s) · contra ${URL_BASE}`);
console.log(`capturas en ${CAPTURAS}\n`);

const resultados = [];
for (const suite of elegidas) {
  console.log(`\n══════════ ${suite.nombre} ══════════`);
  resultados.push({ nombre: suite.nombre, ...(await correr(suite, URL_BASE, CAPTURAS)) });
}

console.log('\n══════════ RESUMEN ══════════');
for (const r of resultados) {
  console.log(`  ${r.codigo === 0 ? '✔' : '✖'} ${r.nombre.padEnd(16)} ${(r.ms / 1000).toFixed(1)} s`);
}
const rojas = resultados.filter((r) => r.codigo !== 0);
console.log(
  rojas.length === 0
    ? `\n✅ ${resultados.length}/${resultados.length} suites en verde`
    : `\n❌ ${rojas.length} en rojo: ${rojas.map((r) => r.nombre).join(', ')}`,
);
process.exitCode = rojas.length === 0 ? 0 : 1;
