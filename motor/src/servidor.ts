/**
 * El motor de Desplázame.
 *
 * Carga el grafo UNA vez al arrancar y lo deja en memoria; después abre el
 * puerto. Todavía no calcula rutas —eso es el punto 6—, pero ya sostiene el
 * dato que las hará posibles, y lo dice en `/api/salud`.
 *
 * **El puerto no abre hasta que el grafo está.** Es la decisión declarada de
 * esta casilla: así no existe el instante en que el motor contesta a medio
 * cargar, y la guardia no puede darle verde a un motor incompleto. Si algún
 * día la carga tarda tanto que ese silencio inicial estorbe, se cambia por un
 * estado «cargando» — pero hoy tarda lo que tarda un parpadeo.
 *
 * No se compila: Node 24 ejecuta TypeScript directamente borrando los tipos.
 */

import { createServer } from 'node:http';
import type { Salud } from '@desplazame/tipos';
import { cargarGrafo } from './grafo.ts';

/** El puerto del motor. La interfaz le habla por el proxy de `ng serve`. */
const PUERTO = 3000;

console.log('motor: cargando el grafo…');
const memoria = cargarGrafo();
console.log(
  `motor: grafo en memoria — ${memoria.aristas} aristas · ${memoria.nodos} nodos · ` +
    `${memoria.vertices} vértices`,
);
console.log(
  `motor: leído en ${memoria.leidoEnMs.toFixed(0)} ms · parseado en ` +
    `${memoria.parseadoEnMs.toFixed(0)} ms · listo en ${memoria.cargadoEnMs.toFixed(0)} ms`,
);
const usoMemoria = process.memoryUsage();
console.log(
  `motor: memoria del proceso — rss ${(usoMemoria.rss / 1048576).toFixed(0)} MB · ` +
    `heap ${(usoMemoria.heapUsed / 1048576).toFixed(0)} MB`,
);

/** Cuándo arrancó este proceso. La guardia lo compara con las fuentes. */
const ARRANCADO = new Date().toISOString();

const servidor = createServer((peticion, respuesta) => {
  const json = (codigo: number, cuerpo: unknown): void => {
    respuesta.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
    respuesta.end(JSON.stringify(cuerpo));
  };

  if (peticion.method === 'GET' && peticion.url === '/api/salud') {
    const salud: Salud = {
      ok: true,
      pid: process.pid,
      arrancado: ARRANCADO,
      grafo: {
        nodos: memoria.nodos,
        aristas: memoria.aristas,
        vertices: memoria.vertices,
        cargadoEnMs: Math.round(memoria.cargadoEnMs),
      },
    };
    json(200, salud);
    return;
  }

  json(404, { error: `no hay nada en ${peticion.method} ${peticion.url}` });
});

servidor.listen(PUERTO, () => {
  console.log(`motor: escuchando en http://localhost:${PUERTO} (pid ${process.pid})`);
  console.log(`motor: arrancado a las ${ARRANCADO}`);
});
