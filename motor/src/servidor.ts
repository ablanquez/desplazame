/**
 * El motor de Desplázame.
 *
 * Carga el grafo y el callejero UNA vez al arrancar y los deja en memoria;
 * después abre el puerto. Todavía no calcula rutas —eso es el punto 6—, pero
 * ya sugiere vías y dice en `/api/salud` con qué dato lo hace.
 *
 * **El puerto no abre hasta que todo está cargado.** Es la decisión declarada:
 * así no existe el instante en que el motor contesta a medio cargar, y la
 * guardia no puede darle verde a un motor incompleto.
 *
 * No se compila: Node 24 ejecuta TypeScript directamente borrando los tipos.
 */

import { createServer } from 'node:http';
import type { Salud } from '@desplazame/tipos';
import { cargarGrafo } from './grafo.ts';
import { buscar, cargarCallejero, LIMITE, MINIMO } from './callejero.ts';
import { cargarPortales, portalesDe } from './portales.ts';

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

// Los portales van ANTES que el callejero: el callejero cuenta sobre ellos.
console.log('motor: cargando los portales…');
const portales = cargarPortales();
console.log(
  `motor: portales en memoria — ${portales.total} portales en ${portales.porVia.size} vías ` +
    `· ${portales.cargadoEnMs.toFixed(0)} ms`,
);

console.log('motor: cargando el callejero…');
const callejero = cargarCallejero(portales);
console.log(
  `motor: callejero en memoria — ${callejero.vias} vías, de las que ` +
    `${callejero.sugeribles.length} tienen portal y se sugieren ` +
    `(${callejero.portales} portales) · ${callejero.cargadoEnMs.toFixed(0)} ms`,
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

  const url = new URL(peticion.url ?? '/', `http://localhost:${PUERTO}`);

  if (peticion.method === 'GET' && url.pathname === '/api/salud') {
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
      callejero: {
        vias: callejero.vias,
        sugeribles: callejero.sugeribles.length,
        portales: callejero.portales,
        cargadoEnMs: Math.round(callejero.cargadoEnMs),
      },
      portales: {
        total: portales.total,
        vias: portales.porVia.size,
        cargadoEnMs: Math.round(portales.cargadoEnMs),
      },
    };
    json(200, salud);
    return;
  }

  if (peticion.method === 'GET' && url.pathname === '/api/vias') {
    // Sin `q`, o con menos de MINIMO letras, se devuelve lista vacía: es una
    // respuesta bien formada, no un error. Quien escribe todavía no ha dicho
    // bastante como para sugerirle nada.
    json(200, buscar(callejero, url.searchParams.get('q') ?? ''));
    return;
  }

  if (peticion.method === 'GET' && url.pathname === '/api/portales') {
    // Se devuelven TODOS los portales de la vía, no una página: la mediana es
    // 9 y el peor caso 1.469, que en este contrato son unos 66 KB. Una sola
    // petición al fijar la calle deja a la pantalla filtrando en local, sin
    // ida y vuelta por cada tecla. Sin `via`, o con una que no existe: lista
    // vacía, respuesta bien formada — como `/api/vias`.
    json(200, portalesDe(portales, url.searchParams.get('via') ?? ''));
    return;
  }

  json(404, { error: `no hay nada en ${peticion.method} ${peticion.url}` });
});

servidor.listen(PUERTO, () => {
  console.log(`motor: escuchando en http://localhost:${PUERTO} (pid ${process.pid})`);
  console.log(`motor: /api/vias sugiere desde ${MINIMO} letras, hasta ${LIMITE} resultados`);
  console.log(`motor: arrancado a las ${ARRANCADO}`);
});
