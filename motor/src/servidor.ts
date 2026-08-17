/**
 * El motor de Desplázame.
 *
 * Hoy solo sabe decir que está vivo. No hay grafo, no hay rutas, no hay
 * datos: eso son las casillas siguientes del punto 5. Lo que sí hay desde
 * este primer endpoint es **el contrato vivo**: la respuesta está tipada
 * contra `@desplazame/tipos`, el mismo fichero que mira la interfaz.
 *
 * No se compila: Node 24 ejecuta TypeScript directamente borrando los tipos.
 * `npm start` es `node src/servidor.ts`, sin paso intermedio.
 */

import { createServer } from 'node:http';
import type { Salud } from '@desplazame/tipos';

/** El puerto del motor. La interfaz le habla por el proxy de `ng serve`. */
const PUERTO = 3000;

/** Cuándo arrancó este proceso. La guardia de arranque lo compara con las fuentes. */
const ARRANCADO = new Date().toISOString();

const servidor = createServer((peticion, respuesta) => {
  const json = (codigo: number, cuerpo: unknown): void => {
    respuesta.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
    respuesta.end(JSON.stringify(cuerpo));
  };

  if (peticion.method === 'GET' && peticion.url === '/api/salud') {
    const salud: Salud = { ok: true, pid: process.pid, arrancado: ARRANCADO };
    json(200, salud);
    return;
  }

  json(404, { error: `no hay nada en ${peticion.method} ${peticion.url}` });
});

servidor.listen(PUERTO, () => {
  console.log(`motor: escuchando en http://localhost:${PUERTO} (pid ${process.pid})`);
  console.log(`motor: arrancado a las ${ARRANCADO}`);
});
