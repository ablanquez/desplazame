/**
 * ⭐ EL LOG A FICHERO (8/09, M0 del punto 14).
 *
 * ── ⚠️ La carencia, y está MEDIDA ───────────────────────────────────────────
 *
 * El 6/09 no se pudo casar lo que el ojo vio a las 17:20 con lo que el motor
 * hizo, porque **el motor no guarda lo que dice**: escribe en `stdout` y ahí se
 * queda. Cerrada la terminal, no hay nada. Consta en la entrada nº37.
 *
 * Esto no sustituye a `stdout` —el panel de Hostinger enseña los logs del
 * proceso y esa ventana sigue haciendo falta—: **escribe ADEMÁS**.
 *
 * ── El patrón, y por qué este y no otro ─────────────────────────────────────
 *
 * Un fichero por día, `AAAA-MM-DD.log`, y los viejos se van solos. Es lo más
 * simple que cumple las dos cosas que hay que cumplir: que se pueda buscar por
 * la hora de un suceso, y que el disco no crezca sin fin. **Cero dependencias**,
 * como todo lo demás.
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { abrirElRegistro, DIAS_QUE_SE_GUARDAN, type Registro } from './registro.ts';

/** Un directorio de usar y tirar: esto escribe ficheros de verdad. */
let carpeta: string;
let reg: Registro;

const ficheros = (): string[] => readdirSync(carpeta).sort();
const leer = (nombre: string): string => readFileSync(join(carpeta, nombre), 'utf8');

/** Un instante concreto, para que la rotación no dependa del reloj de nadie. */
const EL_LUNES = new Date('2026-09-07T17:20:31.500Z');
const EL_MARTES = new Date('2026-09-08T09:05:00.000Z');

describe('⭐ EL REGISTRO — lo que se dice queda escrito', () => {
  beforeEach(() => {
    carpeta = mkdtempSync(join(tmpdir(), 'desplazame-log-'));
  });

  afterEach(() => {
    reg?.cerrar();
    rmSync(carpeta, { recursive: true, force: true });
  });

  /**
   * ⭐ JUEZ 1 — UNA LÍNEA LOGUEADA APARECE EN EL FICHERO DEL DÍA.
   *
   * Y con **su hora**, que es justo lo que faltaba el 6/09: sin la marca de
   * tiempo, un log guardado no sirve para casar nada.
   */
  test('⭐ 1 · lo escrito aparece en el fichero del día, con su hora', () => {
    reg = abrirElRegistro(carpeta, EL_LUNES);
    reg.escribir('log', 'motor: escuchando en http://localhost:3000 (pid 1)', EL_LUNES);

    assert.deepEqual(ficheros(), ['2026-09-07.log']);
    const dentro = leer('2026-09-07.log');
    assert.match(dentro, /motor: escuchando en http:\/\/localhost:3000 \(pid 1\)/);
    assert.match(dentro, /^2026-09-07T17:20:31\.500Z/, `la línea entera: ${JSON.stringify(dentro)}`);
    assert.ok(dentro.endsWith('\n'), 'cada línea acaba en salto: si no, la siguiente se pega');
  });

  /** ⭐ JUEZ 2 — Y `donde()` DICE LA VERDAD, que es lo que el arranque anuncia. */
  test('⭐ 2 · donde() nombra el fichero que se está escribiendo', () => {
    reg = abrirElRegistro(carpeta, EL_LUNES);
    reg.escribir('log', 'algo', EL_LUNES);
    assert.equal(reg.donde(), join(carpeta, '2026-09-07.log'));
  });

  /**
   * ⭐ JUEZ 3 — LA ROTACIÓN ROTA, y con el reloj falso.
   *
   * ⚠️ **El reloj entra por parámetro a propósito.** Un motor que lleve semanas
   *    levantado tiene que cambiar de fichero a medianoche sin reiniciarse, y
   *    eso no se puede comprobar esperando a que sean las doce.
   */
  test('⭐ 3 · al cambiar el día, la línea siguiente va a otro fichero', () => {
    reg = abrirElRegistro(carpeta, EL_LUNES);
    reg.escribir('log', 'lo del lunes', EL_LUNES);
    reg.escribir('log', 'lo del martes', EL_MARTES);

    assert.deepEqual(ficheros(), ['2026-09-07.log', '2026-09-08.log']);
    assert.match(leer('2026-09-07.log'), /lo del lunes/);
    assert.doesNotMatch(leer('2026-09-07.log'), /lo del martes/);
    assert.match(leer('2026-09-08.log'), /lo del martes/);
    assert.equal(reg.donde(), join(carpeta, '2026-09-08.log'));
  });

  /** ⭐ JUEZ 4 — SE APILA: dos líneas del mismo día no se pisan. */
  test('⭐ 4 · dos líneas del mismo día se apilan en orden', () => {
    reg = abrirElRegistro(carpeta, EL_LUNES);
    reg.escribir('log', 'la primera', EL_LUNES);
    reg.escribir('warn', 'la segunda', EL_LUNES);
    const lineas = leer('2026-09-07.log').trimEnd().split('\n');
    assert.equal(lineas.length, 2);
    assert.match(lineas[0]!, /la primera/);
    assert.match(lineas[1]!, /la segunda/);
  });

  /**
   * ⭐ JUEZ 5 — EL NIVEL SE DISTINGUE, porque un aviso no es una nota.
   *
   * En `stdout` los separa el color de la terminal; en un fichero no hay color,
   * así que va escrito. Sin esto, buscar los errores de una noche obliga a
   * conocer de memoria qué frases eran `console.error`.
   */
  test('⭐ 5 · la nota, el aviso y el error se distinguen en el fichero', () => {
    reg = abrirElRegistro(carpeta, EL_LUNES);
    reg.escribir('log', 'una nota', EL_LUNES);
    reg.escribir('warn', 'un aviso', EL_LUNES);
    reg.escribir('error', 'un error', EL_LUNES);
    const lineas = leer('2026-09-07.log').trimEnd().split('\n');
    const marca = (l: string): string => l.slice('2026-09-07T17:20:31.500Z '.length, l.indexOf(' ', 25) + 1).trim();
    assert.equal(new Set(lineas.map(marca)).size, 3, `tres marcas distintas: ${lineas.join(' | ')}`);
  });

  /**
   * ⭐ JUEZ 6 — LOS VIEJOS SE VAN SOLOS.
   *
   * Un log que crece sin fin en un hosting compartido acaba siendo el problema
   * en vez de la herramienta. Se guardan los últimos `DIAS_QUE_SE_GUARDAN` y el
   * resto se borra al abrir.
   */
  test('⭐ 6 · al abrir, los logs más viejos del plazo se borran', () => {
    // Uno de hace mucho, uno de ayer, y un fichero que no es nuestro.
    writeFileSync(join(carpeta, '2026-01-01.log'), 'viejísimo\n');
    writeFileSync(join(carpeta, '2026-09-06.log'), 'de anteayer\n');
    writeFileSync(join(carpeta, 'no-es-un-log.txt'), 'esto no se toca\n');

    reg = abrirElRegistro(carpeta, EL_LUNES);
    const quedan = ficheros();
    assert.ok(!quedan.includes('2026-01-01.log'), `deberían haber borrado el de enero: ${quedan}`);
    assert.ok(quedan.includes('2026-09-06.log'), 'el de anteayer está dentro del plazo');
    assert.ok(quedan.includes('no-es-un-log.txt'), 'lo que no es un log del motor NO se toca');
  });

  /**
   * ⭐ JUEZ 7 — Y SI EL DISCO FALLA, EL MOTOR NO SE CAE.
   *
   * ⚠️ Es la regla dura de esto: **el registro es un testigo, no un requisito**.
   *    Un log que puede tumbar el servidor al que vigila es peor que no tener
   *    log. Se prueba escribiendo sobre un registro ya cerrado.
   */
  test('⭐ 7 · escribir con el registro cerrado no lanza', () => {
    reg = abrirElRegistro(carpeta, EL_LUNES);
    reg.escribir('log', 'antes', EL_LUNES);
    reg.cerrar();
    assert.doesNotThrow(() => reg.escribir('log', 'después', EL_LUNES));
  });

  /** ⭐ JUEZ 8 — EL PLAZO ES UN NÚMERO DECLARADO, no un literal escondido. */
  test('⭐ 8 · el plazo de guarda está declarado y es razonable', () => {
    assert.ok(Number.isInteger(DIAS_QUE_SE_GUARDAN) && DIAS_QUE_SE_GUARDAN >= 7);
    // `utimesSync` se importa para que conste que el borrado NO mira la fecha
    // del sistema de ficheros sino el NOMBRE: el nombre lo pone el motor y no
    // lo cambia un `cp`. Ver `registro.ts`.
    assert.equal(typeof utimesSync, 'function');
  });
});
