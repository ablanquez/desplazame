/**
 * comprobar-tipos — compila la interfaz con los DOS tsconfig que de verdad
 * tienen ficheros dentro, y declara **cuántos ha mirado cada uno**.
 *
 * Nace de la entrada nº12 de docs/BITACORA.md: durante tres checkpoints escribí
 * «tsc limpio» apoyándome en `tsc --noEmit -p tsconfig.json`, y ese fichero es
 * un **fichero solución** —`files: []` más `references`—, así que compilaba
 * **cero ficheros** y salía con código 0. La interfaz estaba rota a propósito y
 * el comprobador decía que no.
 *
 * De ahí la ley de la entrada: **un comando que termina en silencio no es un
 * verde hasta que se le ha visto contar lo que ha mirado.** Por eso este guion
 * no se limita a llamar al compilador: le pide el censo con `--listFiles`, lo
 * imprime, y **se pone rojo si el censo es cero**. Un verde sin censo no vale.
 *
 * QUÉ COMPRUEBA (y con qué código sale si falla)
 *   1. Que el compilador se puede EJECUTAR ..................... 3
 *   2. `tsconfig.app.json` — la aplicación:
 *      · censo de 0 ficheros ....... 2
 *      · errores de tipos .......... 1
 *   3. `tsconfig.spec.json` — las pruebas: lo mismo
 *
 * `tsconfig.json` NO se comprueba aquí a propósito: no tiene nada dentro. Si
 * alguien le añadiera ficheros algún día, tendría que entrar en la lista de
 * abajo — y hasta entonces su censo seguiría siendo el cero que lo delata.
 *
 * ⚠️ Al compilador se le llama por su fichero y con este mismo Node, no por
 * `npx`: `spawnSync('npx.cmd', …)` sin shell revienta con **EINVAL** en Windows
 * y devuelve una salida vacía, que es otra vez un silencio con pinta de verde.
 * Se vio al escribir este guion, y por eso el paso 1 existe.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const TSC = createRequire(join(APP, 'package.json')).resolve('typescript/bin/tsc');

/** Los proyectos que compilan algo. El día que haya un tercero, va aquí. */
const PROYECTOS = ['tsconfig.app.json', 'tsconfig.spec.json'];

const correr = (args) =>
  spawnSync(process.execPath, [TSC, ...args], { cwd: APP, encoding: 'utf8' });

console.log('comprobar-tipos · la interfaz, con censo\n');

let codigo = 0;
for (const proyecto of PROYECTOS) {
  // El censo primero: si sale 0, lo demás da igual — un compilador sin nada que
  // compilar termina en verde y no ha mirado nada.
  const censo = correr(['--noEmit', '-p', proyecto, '--listFiles']);
  if (censo.error || censo.status === null) {
    console.error(`  MAL  no se ha podido EJECUTAR el compilador: ${censo.error?.code ?? '?'}`);
    console.error(`       ${TSC}`);
    codigo = 3;
    break;
  }
  const ficheros = (censo.stdout ?? '').split('\n').filter((l) => l.trim() !== '').length;

  if (ficheros === 0) {
    console.error(`  MAL  ${proyecto}: censo de 0 ficheros — no está compilando NADA.`);
    console.error('       Un `tsc` que no mira nada sale en verde igual. Ver BITACORA nº12.');
    codigo = codigo || 2;
    continue;
  }

  const compila = correr(['--noEmit', '-p', proyecto]);
  const salida = ((compila.stdout ?? '') + (compila.stderr ?? '')).trim();
  if (salida !== '') {
    console.error(`  MAL  ${proyecto}: ${ficheros} ficheros mirados, y con errores:\n`);
    console.error(salida);
    codigo = codigo || 1;
    continue;
  }
  console.log(`  OK   ${proyecto.padEnd(20)} limpio · ${ficheros} ficheros mirados`);
}

if (codigo === 0) {
  console.log('\nVERDE: la interfaz compila, y consta cuántos ficheros se han mirado.');
} else {
  console.error('\nROJO: ver arriba.');
}
process.exitCode = codigo;
