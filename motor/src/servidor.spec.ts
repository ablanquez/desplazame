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
import type { Salud } from '@desplazame/tipos';
import { atenderPeticion, PUERTO } from './servidor.ts';

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
  test('⭐ 3 · sin PORT en el entorno, el puerto es 3000', () => {
    const suyo = process.env['PORT'];
    assert.equal(PUERTO, suyo === undefined ? 3000 : Number(suyo));
    assert.ok(Number.isFinite(PUERTO) && PUERTO >= 0, `el puerto tiene que ser un número: ${PUERTO}`);
  });
});
