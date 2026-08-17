/**
 * EL CONTRATO entre el motor y la interfaz.
 *
 * Este fichero no emite nada: son tipos y solo tipos. Se consume con
 * `import type`, así que desaparece al compilar y no llega al navegador ni al
 * servidor. Su única función es que **no haya dos copias del contrato**: el
 * motor y la interfaz miran el mismo fichero, enlazado por el symlink del
 * workspace. Si el motor cambia aquí la forma de una respuesta, la interfaz
 * deja de compilar. Eso es a propósito.
 *
 * Regla de crecimiento: **el contrato crece cuando el motor lo pide**, no
 * antes. Lo que hoy no se puede derivar de la pantalla ni de CLAUDE.md se
 * queda escrito como NO CONSTA, no se rellena con lo probable.
 */

/**
 * Los cuatro modos de transporte. Excluyentes: solo uno a la vez.
 * Derivado de la pantalla, que ya los maneja como estos cuatro literales.
 */
export type Modo = 'andando' | 'bus' | 'bici' | 'coche';

/**
 * Un punto del mapa: **latitud y longitud, en ese orden** (EPSG:4326, el CRS
 * de todos los datos del repositorio).
 *
 * No está en la lista de CLAUDE.md, pero «geometría» necesita un punto con
 * el que expresarse. El orden [lat, lon] es el que la pantalla ya usa —y el
 * contrario al de los ficheros GeoJSON, que vienen [lon, lat]: la inversión
 * ocurre al leer el dato, no aquí.
 */
export type Vertice = readonly [number, number];

/**
 * Un paso de las indicaciones escritas.
 *
 * `texto` es la instrucción y `detalle` lo que la acompaña (hoy, en la
 * pantalla, el tiempo: «2 min»). Es la forma que la pantalla ya maneja.
 *
 * NO CONSTA si el motor debe mandar `detalle` ya formateado o mandar metros
 * y segundos y que la pantalla decida cómo escribirlos. Hoy la pantalla
 * recibe texto hecho porque los pasos son de mentira; cuando el motor los
 * calcule de verdad, esa decisión se toma y este tipo cambia.
 */
export interface Paso {
  readonly texto: string;
  readonly detalle: string;
}

/**
 * Algo que quien busca la ruta tiene que saber: un corte, un tramo sin
 * carril, un dato que caducó.
 *
 * NO CONSTA todo lo demás: si un aviso lleva gravedad, categoría, o de qué
 * dato viene. CLAUDE.md solo lo nombra, y la pantalla hoy solo pinta texto.
 * Se queda en lo mínimo que un aviso necesita para poder mostrarse.
 */
export interface Aviso {
  readonly texto: string;
}

/**
 * Lo que devuelve `POST /api/ruta`: según CLAUDE.md, **pasos, geometría y
 * avisos**. El modo va dentro porque la respuesta tiene que decir para cuál
 * se calculó — la pantalla ya lo enseña junto a los pasos.
 *
 * NO CONSTA si el trayecto debe traer totales (distancia, duración). La
 * pantalla no los enseña y CLAUDE.md no los menciona: no se añaden «por si
 * acaso».
 */
export interface Trayecto {
  readonly modo: Modo;
  readonly pasos: readonly Paso[];
  readonly geometria: readonly Vertice[];
  readonly avisos: readonly Aviso[];
}

/**
 * Una vía que se puede sugerir al escribir la dirección: lo que devuelve
 * `GET /api/vias?q=…`.
 *
 * `nombre` viene **tal cual está en el callejero municipal**, sin maquillar:
 * en mayúsculas, y con el marcador de núcleo (`CALLE BURGOS ---CST`) si lo
 * trae. Se conserva porque es el dato.
 *
 * `limpio` y `nucleo` son ese mismo nombre **ya interpretado**, que es lo que
 * se enseña: `CALLE BURGOS` y `CASETAS`. El marcador es críptico y no debe
 * salir a pantalla, pero **tampoco puede perderse**: hay 52 nombres que se
 * repiten entre la ciudad y los barrios rurales, y el núcleo es lo único que
 * los distingue. `nucleo` es `null` en las vías de Zaragoza ciudad.
 *
 * El corte del sufijo y la búsqueda del núcleo los hace **el motor, en un
 * único sitio**: la interfaz no parsea nombres.
 *
 * La normalización (minúsculas, sin acentos) es solo para COMPARAR dentro del
 * motor; no sale al contrato.
 *
 * `portales` es cuántos portales tiene, contados sobre el censo municipal. No
 * es decoración: solo se sugieren vías con al menos uno, porque sugerir una
 * vía sin portales sería prometer una dirección que no se puede resolver.
 */
export interface Via {
  readonly codigo: string;
  readonly nombre: string;
  readonly limpio: string;
  readonly nucleo: string | null;
  readonly tipo: string;
  readonly portales: number;
}

/**
 * Lo que el motor lleva del callejero, y lo que le costó cargarlo.
 *
 * Los dos números que importan y que llevan dos puntos del plan esperándose:
 * `vias` es el callejero entero, `sugeribles` las que tienen portal. **La que
 * se publica es `sugeribles`**: es lo único que el buscador puede cumplir.
 */
export interface SaludCallejero {
  readonly vias: number;
  readonly sugeribles: number;
  readonly portales: number;
  readonly cargadoEnMs: number;
}

/**
 * Lo que el motor lleva del grafo en memoria, y lo que le costó ponerlo ahí.
 *
 * Los tres recuentos salen del objeto cargado, no de una constante escrita a
 * mano: `aristas` y `vertices` se cuentan de verdad; `nodos` es el único que
 * el fichero solo declara —el grafo no trae lista de nodos, solo el contador—.
 * Sirven para que la guardia pueda distinguir un motor con el grafo cargado
 * de uno que arrancó sin él.
 */
export interface SaludGrafo {
  readonly nodos: number;
  readonly aristas: number;
  readonly vertices: number;
  readonly cargadoEnMs: number;
}

/**
 * Lo que devuelve `GET /api/salud`. No sale de CLAUDE.md: es el primer
 * endpoint del motor y su forma la fija el encargo que lo pidió.
 *
 * `arrancado` es ISO 8601, la misma marca que la guardia de arranque usa
 * para saber si un servidor está caducado.
 */
export interface Salud {
  readonly ok: boolean;
  readonly pid: number;
  readonly arrancado: string;
  readonly grafo: SaludGrafo;
  readonly callejero: SaludCallejero;
}
