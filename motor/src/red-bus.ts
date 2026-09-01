/**
 * ⭐ LA COCINA DE LA RED DE BUS Y TRANVÍA: del feed crudo a lo que se rutea.
 *
 * ── Qué se cocina y por qué eso ─────────────────────────────────────────────
 *
 * [RAPTOR, Delling/Pajor/Werneck 2012 — el algoritmo de OTP2] la búsqueda por
 * transporte público necesita exactamente tres cosas: **las paradas `S`**, **las
 * rutas/patrones `R`** y **los transbordos a pie `F`**. Esta cocina produce esas
 * tres y nada más; la búsqueda es de la casilla 3b.
 *
 * ── La unidad: el TRIP PATTERN, y en GTFS hay que derivarlo ─────────────────
 *
 * [OTP, javadoc de `TripPattern`] un patrón es *«un grupo de trips de una ruta,
 * en la misma dirección, que paran en la MISMA secuencia de paradas»*. En GTFS
 * los patrones son **implícitos**: el consumidor los deriva agrupando los trips
 * por su secuencia [gtfs issue #1320]. Aquí la clave es exactamente
 * `(route_id, direction_id, secuencia ordenada de stop_id)` — la dirección sale
 * del orden, y los cortos y los desvíos salen como **patrones distintos**, que
 * es lo que son.
 *
 * ⚠️ **Y se conservan TODOS.** ZetaBus se queda con «el trip de más paradas» de
 * cada sentido, y hace bien: allí se **pinta** una línea, y un refuerzo pintado
 * es un recorrido truncado. Aquí se **rutea**, y para rutear un refuerzo es un
 * patrón legítimo — quien lo coja llega igual. El de más paradas se conserva
 * marcado como **principal**, que es lo que la casilla 4 querrá dibujar.
 *
 * ── En streaming, porque son 47 MB ─────────────────────────────────────────
 *
 * `stop_times.txt` pesa 45 MB descomprimido y **no se materializa**: se
 * descomprime en flujo y se procesa línea a línea. Es la lección de ZetaBus
 * («stop_times: SIN materializar»), y aquí además está medida: ver el log.
 */
import { createReadStream } from 'node:fs';
import { createInflateRaw } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { delZip } from './feed.ts';
import type { RedEnMemoria } from './red.ts';
import { enganchar, type Rejilla } from './proyeccion.ts';
import { calcularRuta, type Cuaderno } from './ruta.ts';
import type { Vertice } from '@desplazame/tipos';
import {
  cortar,
  MAXIMO_DESVIO_M,
  proyectarMonotono,
  rectaEntre,
  type Proyeccion,
  type Traza,
} from './trazas.ts';

export type ModoDeRed = 'bus' | 'tram';

/**
 * ⭐ `route_type` → modo, y es una TABLA, no un `if`.
 *
 * El feed usa los **tipos extendidos**: 52 rutas con `704` (*Local Bus
 * Service*) y 1 con `900` (*Tram Service*). ⚠️ **El `3` clásico no aparece en
 * este feed** —medido en el censo del 31/08—, así que quien filtre por
 * `route_type === 3` no encuentra un solo autobús. Se dejan puestos los básicos
 * de todos modos, porque cuestan una línea y el día que el feed cambie de
 * criterio no habrá que tocar nada.
 *
 * ⚠️ **Un `route_type` que no esté aquí PARA la cocina.** No se adivina y no se
 * ignora: una ruta cuyo modo no sabemos es una ruta que no sabemos pintar ni
 * cobrar ni explicar, y tragársela sería servirla como si la entendiéramos.
 */
export const MODO_POR_TIPO: Readonly<Record<string, ModoDeRed>> = {
  '0': 'tram', // Tram, Streetcar, Light rail
  '3': 'bus', // Bus
  '700': 'bus', // Bus Service
  '702': 'bus', // Express Bus
  '704': 'bus', // Local Bus Service   ← el de Zaragoza
  '715': 'bus', // Demand and Response Bus
  '900': 'tram', // Tram Service        ← el tranvía de Zaragoza
};

export interface ParadaBus {
  readonly id: string;
  /** ⭐ El puente hacia el MU3 municipal y hacia Avanza. Ver el censo. */
  readonly codigo: string;
  readonly nombre: string;
  readonly lat: number;
  readonly lon: number;
  readonly modos: readonly ModoDeRed[];
}

export interface LineaBus {
  readonly id: string;
  readonly corto: string;
  readonly largo: string;
  readonly color: string;
  readonly colorTexto: string;
  readonly modo: ModoDeRed;
  /** Cuántos patrones tiene. **Cero = zombi**: existe en `routes.txt` y no la usa ni un viaje. */
  readonly patrones: number;
}

export interface SaltoBus {
  /** La MEDIANA de los segundos entre esas dos paradas, sobre los trips del patrón. */
  readonly tipico: number;
  /** Y el MÁXIMO, para no prometer lo que no siempre pasa. */
  readonly maximo: number;
  /**
   * ⭐ LA TRAZA DEL ASFALTO entre las dos paradas, `[lat, lon]` (31/08).
   *
   * Es el trozo de `shapes.txt` que va de una parada a la siguiente, cortado
   * entre sus proyecciones. Ver `trazas.ts` para el porqué de la proyección
   * monótona. El primer punto de un salto es **exactamente** el último del
   * anterior: la concatenación no deja huecos.
   */
  readonly traza: readonly Vertice[];
  /** Metros **por el asfalto**, no en línea recta entre postes. */
  readonly metros: number;
  /** ⚠️ `true` si es la RECTA de reserva porque la parada no cabía en la traza. */
  readonly recta: boolean;
}

export interface PatronBus {
  /** ⭐ `ruta|dirección|n`, como OTP: concatena ruta, dirección y un ordinal. */
  readonly id: string;
  readonly linea: string;
  readonly direccion: string;
  readonly modo: ModoDeRed;
  /** La secuencia ORDENADA de `stop_id`. Es la clave del patrón. */
  readonly paradas: readonly string[];
  /** Cuántos trips lo recorren. */
  readonly viajes: number;
  /** Los `service_id` de esos trips, sin repetir. */
  readonly servicios: readonly string[];
  /**
   * ⭐ POR SERVICIO: cuántos viajes y entre qué horas, para poder calcular el
   * intervalo de un día concreto.
   *
   * Sin esto no hay espera que estimar: `E[W] = H/2` necesita **la H de HOY**,
   * y la H de hoy es la franja de servicio de hoy dividida entre los viajes de
   * hoy. Guardarlo por servicio y no por día cuesta unas 3.400 entradas en vez
   * de 34.427, y da exactamente lo mismo — un día es un conjunto de servicios.
   *
   * `primera` y `ultima` son la salida del **primer poste** del patrón, en
   * segundos desde medianoche del día de servicio (puede pasar de 86.400: son
   * los búhos).
   */
  readonly porServicio: Readonly<
    Record<string, { readonly viajes: number; readonly primera: number; readonly ultima: number }>
  >;
  /** Los `shape_id` de esos trips, sin repetir. Para el pintado de la casilla 4. */
  readonly formas: readonly string[];
  /** El de más paradas de su (línea, dirección): el que se dibuja. */
  readonly principal: boolean;
  /** Un salto por cada par consecutivo: `paradas.length - 1`. */
  readonly saltos: readonly SaltoBus[];
}

/**
 * ⭐ Un salto y un patrón **antes de vestirse con su traza**.
 *
 * Existen para que el orden no se pueda equivocar: `agruparEnPatrones` no puede
 * devolver un `PatronBus` porque todavía no ha visto `shapes.txt`, y quien
 * intente saltarse `vestirConTrazas` no compila.
 */
export type SaltoSinTraza = Omit<SaltoBus, 'traza' | 'metros' | 'recta'>;
export type PatronSinTraza = Omit<PatronBus, 'saltos'> & {
  readonly saltos: readonly SaltoSinTraza[];
};

export interface TransbordoBus {
  readonly desde: string;
  readonly hasta: string;
  /** Metros **andando de verdad**, por el motor del peatón. Nunca en línea recta. */
  readonly metros: number;
}

/**
 * ⭐ LA VERSIÓN DEL **FORMATO** del cocinado, y sube cuando cambia su forma.
 *
 * ⚠️ **Nace de un fallo real (31/08).** El cocinado en disco se servía con solo
 * comprobar el `feed_version`, y el día que los saltos ganaron su traza el motor
 * siguió arrancando con el fichero de ayer —sin trazas— mientras las 421 jueces
 * daban verde: ellas llaman a `cocinar()` y el producto arranca por
 * `cocinarYServir()`. Ver la entrada del 31/08 de `docs/BITACORA.md`.
 *
 * La versión del ORIGEN dice «el dato no ha cambiado». La del FORMATO dice «yo
 * sé escribirlo como lo lee el código de hoy». Hacen falta las dos.
 *
 *   1 — la cocina de la casilla 3a (paradas, líneas, patrones, saltos, fechas).
 *   2 — casilla 4: cada salto gana `traza`, `metros` y `recta`.
 *   3 — la red dice si se cocinó con el peatón (`conPeaton`).
 *   4 — los nombres se decodifican sin partir las tildes en la costura de los
 *       trozos del flujo. El dato de un cocinado 3 es el mismo salvo por los
 *       nombres rotos que se guardaron con él —«Plaza Arag��n»—, y esos no se
 *       arreglan releyendo el guardado: hay que volver a cocinar. Ver la entrada
 *       del 1/09 en `docs/BITACORA.md`.
 */
export const FORMATO_DEL_COCINADO = 4;

export interface RedDeBus {
  /** Ver `FORMATO_DEL_COCINADO`. Un cocinado sin él es de antes de que existiera. */
  readonly formato: number;
  /**
   * ⭐ ¿SE COCINÓ CON EL PEATÓN? Si no, **esta red no se puede servir**.
   *
   * ⚠️ **Nace de un fallo real (31/08), del mismo día que el `formato`.** Una
   * juez guardó en el fichero de producción una red cocinada con `andar = null`
   * —sin peatón, para no cargar 68.649 nodos— y el motor arrancó sirviendo
   * **0 transbordos**: con la `F` de RAPTOR vacía, ningún viaje puede cambiar
   * de vehículo andando. El formato cuadraba y el feed también, así que el
   * guardián de al lado no vio nada. Ver la entrada del 31/08 de la bitácora.
   *
   * Es la diferencia entre «sé leer este fichero» y «este fichero está
   * completo», y hacían falta las dos.
   */
  readonly conPeaton: boolean;
  readonly feedVersion: string;
  readonly paradas: readonly ParadaBus[];
  readonly lineas: readonly LineaBus[];
  readonly patrones: readonly PatronBus[];
  /** `AAAAMMDD` → los `service_id` que operan ese día [método Alternate]. */
  readonly porFecha: Readonly<Record<string, readonly string[]>>;
  readonly transbordos: readonly TransbordoBus[];
}

// ── LEER EL ZIP EN FLUJO ─────────────────────────────────────────────────────

interface Miembro {
  readonly inicio: number;
  readonly comprimido: number;
  readonly metodo: number;
}

/**
 * Dónde empieza un miembro dentro del zip, sin descomprimirlo.
 *
 * Se lee el directorio central —que vive al final— y de ahí el desplazamiento
 * de la cabecera local. Los largos de nombre y extra de la cabecera LOCAL no
 * son los del directorio central: confundirlos desplaza el corte y sale basura.
 */
export function localizar(zip: Buffer, nombre: string): Miembro | null {
  const buscado = Buffer.from(nombre, 'utf8');
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) !== 0x0605_4b50) {
      continue;
    }
    let donde = zip.readUInt32LE(i + 16);
    const cuantos = zip.readUInt16LE(i + 10);
    for (let k = 0; k < cuantos; k++) {
      const lNombre = zip.readUInt16LE(donde + 28);
      const lExtra = zip.readUInt16LE(donde + 30);
      const lComentario = zip.readUInt16LE(donde + 32);
      if (zip.subarray(donde + 46, donde + 46 + lNombre).equals(buscado)) {
        const local = zip.readUInt32LE(donde + 42);
        return {
          inicio: local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28),
          comprimido: zip.readUInt32LE(donde + 20),
          metodo: zip.readUInt16LE(donde + 10),
        };
      }
      donde += 46 + lNombre + lExtra + lComentario;
    }
    return null;
  }
  return null;
}

/**
 * ⭐ RECORRE UN MIEMBRO DEL ZIP LÍNEA A LÍNEA, sin materializarlo.
 *
 * El fichero se descomprime en flujo y se corta por saltos de línea sobre un
 * resto pequeño. Para `stop_times.txt` esto es la diferencia entre tener 45 MB
 * en el montón y no tenerlos.
 *
 * `alLeer` recibe los campos ya partidos con `partirCsv`, que **entiende las
 * comillas** — y hacen falta: **934 de las 984 filas de `stops.txt` traen
 * comillas** (medido el 31/08). Un corte por comas a secas dejaba los nombres
 * con las comillas puestas: `\"Gran Vía\"` en vez de `Gran Vía`.
 */
/**
 * ⭐ PARTE UNA LÍNEA DE CSV **respetando las comillas**.
 *
 * [RFC 4180, que es lo que GTFS sigue] un campo puede ir entre comillas, y una
 * comilla dentro de un campo entrecomillado se escribe **doblada**. Son las dos
 * reglas que hacen falta y no hay una tercera en este feed.
 *
 * ⚠️ **Esto empezó siendo un `split(',')` y estaba mal.** Miré `stop_times.txt`
 * —donde no hay ni una comilla en 870.717 filas— y di el fichero entero por
 * bueno. En `stops.txt` **934 de 984 filas las llevan**, así que los nombres
 * salían como `\"Gran Vía\"`. Lo cazó un volcado de transbordos, no una prueba:
 * no había ninguna todavía. Quince líneas cierran la clase entera de problema,
 * comas dentro del nombre incluidas.
 */
export function partirCsv(linea: string): string[] {
  const campos: string[] = [];
  let actual = '';
  let dentro = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]!;
    if (dentro) {
      if (c === '"') {
        // Una comilla doblada es una comilla literal; una sola, el cierre.
        if (linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          dentro = false;
        }
      } else {
        actual += c;
      }
    } else if (c === '"') {
      dentro = true;
    } else if (c === ',') {
      campos.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  campos.push(actual);
  return campos;
}

export async function porLineas(
  ruta: string,
  zip: Buffer,
  miembro: string,
  alLeer: (campos: readonly string[], cabecera: readonly string[]) => void,
): Promise<number> {
  const donde = localizar(zip, miembro);
  if (!donde) {
    throw new Error(`el zip no trae ${miembro}`);
  }
  const bruto = createReadStream(ruta, {
    start: donde.inicio,
    end: donde.inicio + donde.comprimido - 1,
  });
  const flujo = donde.metodo === 0 ? bruto : bruto.pipe(createInflateRaw());

  /**
   * ⭐ EL DECODIFICADOR ES UNO SOLO Y **GUARDA ESTADO ENTRE TROZOS**.
   *
   * ⚠️ Aquí vivía `trozo.toString('utf8')`, uno por trozo, y partía las tildes
   * que caían en la costura: un trozo del flujo corta por donde le toca, y
   * cuando el corte separa los dos bytes de una «ó» —`c3` y `b3`— cada mitad es
   * una secuencia inválida por su cuenta y sale un carácter de reemplazo. Salían
   * dos, y solo en **una** parada de 984: la 1312, «Plaza Aragón». Ver la
   * entrada del 1/09 en `docs/BITACORA.md`.
   *
   * `TextDecoder` con `{ stream: true }` es exactamente lo contrario: se guarda
   * los bytes que le sobran al final del trozo y los estrena con el siguiente.
   */
  const decodificador = new TextDecoder('utf-8');

  let resto = '';
  let cabecera: string[] | null = null;
  let filas = 0;
  for await (const trozo of flujo) {
    const texto = resto + decodificador.decode(trozo as Buffer, { stream: true });
    const lineas = texto.split('\n');
    resto = lineas.pop() ?? '';
    for (const cruda of lineas) {
      const linea = cruda.endsWith('\r') ? cruda.slice(0, -1) : cruda;
      if (linea.length === 0) {
        continue;
      }
      if (cabecera === null) {
        cabecera = partirCsv(linea.replace(/^﻿/, ''));
        continue;
      }
      const campos = partirCsv(linea);
      // ⚠️ La red de seguridad: si el número de campos no cuadra con la
      // cabecera, el partidor se ha equivocado y lo que venga detrás sería
      // basura silenciosa. Mejor parar aquí, con la línea delante.
      if (campos.length !== cabecera.length) {
        throw new Error(
          `${miembro}: una fila trae ${campos.length} campos y la cabecera ${cabecera.length}: ${linea.slice(0, 120)}`,
        );
      }
      alLeer(campos, cabecera);
      filas++;
    }
  }
  // ⚠️ Y se VACÍA el decodificador al cerrar el flujo. Si el fichero acabara a
  // mitad de una secuencia multibyte —un zip truncado—, esos bytes se quedarían
  // dentro y desaparecerían **en silencio**; así salen como carácter de
  // reemplazo, que es lo que la juez 13 sabe cazar.
  resto += decodificador.decode();

  const ultima = resto.endsWith('\r') ? resto.slice(0, -1) : resto;
  if (ultima.length > 0 && cabecera !== null) {
    const campos = partirCsv(ultima);
    if (campos.length !== cabecera.length) {
      throw new Error(`${miembro}: la última fila trae ${campos.length} campos y la cabecera ${cabecera.length}`);
    }
    alLeer(campos, cabecera);
    filas++;
  }
  return filas;
}

/** El índice de cada columna que interesa, resuelto una vez por fichero. */
function indices(cabecera: readonly string[], quiero: readonly string[]): number[] {
  return quiero.map((c) => {
    const i = cabecera.indexOf(c);
    if (i === -1) {
      throw new Error(`falta la columna ${c} (hay: ${cabecera.join(', ')})`);
    }
    return i;
  });
}

// ── LA COCINA ────────────────────────────────────────────────────────────────

/**
 * ⭐ SEGUNDOS DESDE MEDIANOCHE de una hora de GTFS.
 *
 * [Referencia GTFS] *«para horas tras la medianoche del día de servicio, el
 * valor supera 24:00:00»*. No se normaliza a 24 h y no se toca el día: se suman
 * las horas tal cual, así que `25:10:00` son 90.600 s y la resta con la parada
 * anterior sale bien sin ningún caso especial. El censo contó **15.661** horas
 * por encima de 24:00:00 en este feed, y la más tardía es `27:35:40`.
 */
export function enSegundos(hora: string): number {
  const p = hora.split(':');
  if (p.length !== 3) {
    return Number.NaN;
  }
  return Number(p[0]) * 3600 + Number(p[1]) * 60 + Number(p[2]);
}

/**
 * La MEDIANA de una lista de números. Con un número par de elementos se toma
 * **el de abajo** y no la media de los dos centrales: así el resultado es
 * siempre un valor que de verdad ocurrió, y no un promedio que no vio nadie.
 */
export function mediana(xs: readonly number[]): number {
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.floor((o.length - 1) / 2)] ?? 0;
}

export interface Crudo {
  readonly paradas: Map<string, { codigo: string; nombre: string; lat: number; lon: number }>;
  readonly rutas: Map<string, { corto: string; largo: string; color: string; texto: string; modo: ModoDeRed }>;
  readonly viajes: Map<string, { ruta: string; direccion: string; servicio: string; forma: string }>;
  readonly porFecha: Map<string, string[]>;
}

/** Lee del zip todo lo que NO es `stop_times`, que es lo pequeño. */
export async function leerLoPequeno(ruta: string, zip: Buffer): Promise<Crudo> {
  const paradas = new Map<string, { codigo: string; nombre: string; lat: number; lon: number }>();
  await porLineas(ruta, zip, 'stops.txt', (c, cab) => {
    const [id, cod, nom, lat, lon] = indices(cab, [
      'stop_id',
      'stop_code',
      'stop_name',
      'stop_lat',
      'stop_lon',
    ]);
    paradas.set(c[id!]!, {
      codigo: c[cod!]!,
      nombre: c[nom!]!,
      lat: Number(c[lat!]),
      lon: Number(c[lon!]),
    });
  });

  const rutas = new Map<string, { corto: string; largo: string; color: string; texto: string; modo: ModoDeRed }>();
  await porLineas(ruta, zip, 'routes.txt', (c, cab) => {
    const [id, corto, largo, tipo, color, texto] = indices(cab, [
      'route_id',
      'route_short_name',
      'route_long_name',
      'route_type',
      'route_color',
      'route_text_color',
    ]);
    const suTipo = c[tipo!]!;
    const modo = MODO_POR_TIPO[suTipo];
    if (!modo) {
      // ⚠️ Se PARA. Ver `MODO_POR_TIPO`: un modo que no sabemos no se adivina.
      throw new Error(
        `route_type ${suTipo} desconocido en la ruta ${c[id!]}: la tabla de modos no lo tiene. ` +
          'No se adivina — añádelo a MODO_POR_TIPO con su fuente o mira qué ha cambiado el feed.',
      );
    }
    rutas.set(c[id!]!, {
      corto: c[corto!]!,
      largo: c[largo!]!,
      color: c[color!]!,
      texto: c[texto!]!,
      modo,
    });
  });

  const viajes = new Map<string, { ruta: string; direccion: string; servicio: string; forma: string }>();
  await porLineas(ruta, zip, 'trips.txt', (c, cab) => {
    const [rid, sid, tid, dir, shp] = indices(cab, [
      'route_id',
      'service_id',
      'trip_id',
      'direction_id',
      'shape_id',
    ]);
    viajes.set(c[tid!]!, {
      ruta: c[rid!]!,
      direccion: c[dir!]!,
      servicio: c[sid!]!,
      forma: c[shp!]!,
    });
  });

  const porFecha = new Map<string, string[]>();
  await porLineas(ruta, zip, 'calendar_dates.txt', (c, cab) => {
    const [sid, fecha, tipo] = indices(cab, ['service_id', 'date', 'exception_type']);
    // ⭐ Método Alternate: solo el `1` añade servicio. El censo comprobó que en
    // este feed **no existe ni un `2`** — pero el `if` se queda, porque quitarlo
    // sería fiarse de una medida de hoy para un fichero que se renueva solo.
    if (c[tipo!] !== '1') {
      return;
    }
    const d = c[fecha!]!;
    const lista = porFecha.get(d);
    if (lista) {
      lista.push(c[sid!]!);
    } else {
      porFecha.set(d, [c[sid!]!]);
    }
  });

  return { paradas, rutas, viajes, porFecha };
}

// ── LOS PATRONES Y SUS SALTOS ────────────────────────────────────────────────

/**
 * ⭐ LAS DOS PASADAS SOBRE `stop_times`, y por qué son dos y con arrays tipados.
 *
 * No se puede vaciar cada trip al cambiar de `trip_id`: **164 de los 34.427
 * vienen en bloques NO contiguos** dentro del fichero (medido el 31/08), así que
 * un lector que asuma «todas las filas de un viaje seguidas» perdería trozos.
 * Y guardar 870.717 objetos JavaScript costaría cientos de megas.
 *
 * La salida es **tres `Int32Array` paralelos** de 870.717 posiciones —parada,
 * llegada y salida— más una tabla de desplazamientos por viaje: unos **10 MB**
 * en vez de cientos, y sin materializar los 45 MB del fichero.
 *
 *   · Pasada A: cuántas filas tiene cada viaje (para saber dónde empieza cada uno).
 *   · Pasada B: rellenar, y ordenar la rebanada de cada viaje por `stop_sequence`.
 */
export interface Tiempos {
  /** `trip_id` → su ordinal. */
  readonly deViaje: Map<string, number>;
  /** Dónde empieza cada viaje en los arrays. Largo: viajes + 1. */
  readonly desde: Int32Array;
  /** Ordinal de la parada, por fila. */
  readonly parada: Int32Array;
  readonly llegada: Int32Array;
  readonly salida: Int32Array;
  /** Ordinal de parada → `stop_id`. */
  readonly paradaDe: readonly string[];
}

export async function leerLosTiempos(ruta: string, zip: Buffer): Promise<Tiempos> {
  // ── Pasada A: contar filas por viaje ──────────────────────────────────────
  const deViaje = new Map<string, number>();
  const cuantas: number[] = [];
  await porLineas(ruta, zip, 'stop_times.txt', (c, cab) => {
    const [tid] = indices(cab, ['trip_id']);
    const t = c[tid!]!;
    let n = deViaje.get(t);
    if (n === undefined) {
      n = cuantas.length;
      deViaje.set(t, n);
      cuantas.push(0);
    }
    cuantas[n]!++;
  });

  const desde = new Int32Array(cuantas.length + 1);
  for (let i = 0; i < cuantas.length; i++) {
    desde[i + 1] = desde[i]! + cuantas[i]!;
  }
  const total = desde[cuantas.length]!;

  // ── Pasada B: rellenar ────────────────────────────────────────────────────
  const parada = new Int32Array(total);
  const llegada = new Int32Array(total);
  const salida = new Int32Array(total);
  const orden = new Int32Array(total);
  const puestas = new Int32Array(cuantas.length);
  const deParada = new Map<string, number>();
  const paradaDe: string[] = [];

  await porLineas(ruta, zip, 'stop_times.txt', (c, cab) => {
    const [tid, arr, dep, sid, seq] = indices(cab, [
      'trip_id',
      'arrival_time',
      'departure_time',
      'stop_id',
      'stop_sequence',
    ]);
    const v = deViaje.get(c[tid!]!)!;
    const i = desde[v]! + puestas[v]!++;
    const nombre = c[sid!]!;
    let ord = deParada.get(nombre);
    if (ord === undefined) {
      ord = paradaDe.length;
      deParada.set(nombre, ord);
      paradaDe.push(nombre);
    }
    parada[i] = ord;
    llegada[i] = enSegundos(c[arr!]!);
    salida[i] = enSegundos(c[dep!]!);
    orden[i] = Number(c[seq!]);
  });

  // ⚠️ Y se ordena cada rebanada por `stop_sequence`. Hoy el fichero ya viene
  // ordenado dentro de cada viaje —cero violaciones medidas—, pero los 164
  // viajes partidos en dos bloques hacen que confiar en el orden de llegada sea
  // una apuesta, y ordenar 34.427 rebanadas cortas no cuesta nada.
  for (let v = 0; v < cuantas.length; v++) {
    const a = desde[v]!;
    const b = desde[v + 1]!;
    const idx = Array.from({ length: b - a }, (_, k) => a + k);
    idx.sort((x, y) => orden[x]! - orden[y]!);
    const p = idx.map((i) => parada[i]!);
    const l = idx.map((i) => llegada[i]!);
    const t = idx.map((i) => salida[i]!);
    for (let k = 0; k < p.length; k++) {
      parada[a + k] = p[k]!;
      llegada[a + k] = l[k]!;
      salida[a + k] = t[k]!;
    }
  }

  return { deViaje, desde, parada, llegada, salida, paradaDe };
}

/**
 * ⭐ AGRUPA LOS VIAJES EN PATRONES y calcula sus saltos.
 *
 * La clave es `(route_id, direction_id, secuencia de stop_id)` [OTP]. Dos
 * viajes con la misma secuencia son el mismo patrón; **uno con una parada de
 * más es otro patrón**, que es justo lo que distingue un desvío de un refuerzo
 * de la línea entera.
 *
 * El **salto típico** de cada tramo es la **MEDIANA** de
 * `llegada[i+1] − salida[i]` sobre los viajes del patrón [PROPIO declarado].
 * Mediana y no media porque los búhos y los refuerzos meten valores raros, y la
 * mediana no se mueve por ellos; se guarda también el **máximo**, para poder
 * decir «suele tardar X, a veces Y» sin prometer.
 */
export function agruparEnPatrones(crudo: Crudo, tiempos: Tiempos): PatronSinTraza[] {
  const cajas = new Map<
    string,
    { linea: string; direccion: string; paradas: string[]; viajes: string[] }
  >();

  for (const [tid, v] of tiempos.deViaje) {
    const meta = crudo.viajes.get(tid);
    if (!meta) {
      throw new Error(`el viaje ${tid} tiene horarios pero no está en trips.txt`);
    }
    const a = tiempos.desde[v]!;
    const b = tiempos.desde[v + 1]!;
    const secuencia: string[] = [];
    for (let i = a; i < b; i++) {
      secuencia.push(tiempos.paradaDe[tiempos.parada[i]!]!);
    }
    const clave = `${meta.ruta}\u0000${meta.direccion}\u0000${secuencia.join('\u0001')}`;
    const caja = cajas.get(clave);
    if (caja) {
      caja.viajes.push(tid);
    } else {
      cajas.set(clave, {
        linea: meta.ruta,
        direccion: meta.direccion,
        paradas: secuencia,
        viajes: [tid],
      });
    }
  }

  // El ordinal por (línea, dirección), como OTP: ruta + dirección + n.
  const cuenta = new Map<string, number>();
  const patrones: PatronSinTraza[] = [];
  // Orden estable: por línea, dirección y luego por secuencia. Es lo que hace
  // que dos cocinas del mismo zip den el MISMO fichero (ver la juez del sha).
  const ordenadas = [...cajas.entries()].sort((x, y) => x[0].localeCompare(y[0]));

  for (const [, caja] of ordenadas) {
    const ruta = crudo.rutas.get(caja.linea);
    if (!ruta) {
      throw new Error(`el patrón cita la ruta ${caja.linea}, que no está en routes.txt`);
    }
    const llave = `${caja.linea}|${caja.direccion}`;
    const n = (cuenta.get(llave) ?? 0) + 1;
    cuenta.set(llave, n);

    // Los saltos: para cada tramo, todos los valores de sus viajes.
    const trozos: number[][] = Array.from({ length: caja.paradas.length - 1 }, () => []);
    const servicios = new Set<string>();
    const formas = new Set<string>();
    const porServicio: Record<string, { viajes: number; primera: number; ultima: number }> = {};
    for (const tid of caja.viajes) {
      const meta = crudo.viajes.get(tid)!;
      servicios.add(meta.servicio);
      if (meta.forma.length > 0) {
        formas.add(meta.forma);
      }
      const a = tiempos.desde[tiempos.deViaje.get(tid)!]!;
      // La salida del primer poste: es la hora a la que ese viaje empieza.
      const arranca = tiempos.salida[a]!;
      const suyo = porServicio[meta.servicio];
      if (suyo) {
        suyo.viajes++;
        suyo.primera = Math.min(suyo.primera, arranca);
        suyo.ultima = Math.max(suyo.ultima, arranca);
      } else {
        porServicio[meta.servicio] = { viajes: 1, primera: arranca, ultima: arranca };
      }
      for (let k = 0; k < trozos.length; k++) {
        // ⚠️ Sin normalizar las horas de más de 24:00:00: la resta funciona
        // igual y el día se atribuye al de servicio [referencia GTFS].
        trozos[k]!.push(tiempos.llegada[a + k + 1]! - tiempos.salida[a + k]!);
      }
    }

    patrones.push({
      id: `${caja.linea}|${caja.direccion}|${n}`,
      linea: caja.linea,
      direccion: caja.direccion,
      modo: ruta.modo,
      paradas: caja.paradas,
      viajes: caja.viajes.length,
      servicios: [...servicios].sort(),
      porServicio: Object.fromEntries(
        Object.entries(porServicio).sort((x, y) => x[0].localeCompare(y[0])),
      ),
      formas: [...formas].sort(),
      principal: false,
      saltos: trozos.map((xs) => ({ tipico: mediana(xs), maximo: Math.max(...xs) })),
    });
  }

  // ⭐ El PRINCIPAL de cada (línea, dirección): el de más paradas, que es el que
  // la casilla 4 dibujará. Un refuerzo pintado sería un recorrido truncado
  // [ZetaBus]. A igualdad de paradas gana el de más viajes, y luego el de id
  // menor: sin desempate, la cocina dejaría de ser determinista.
  const porLineaDireccion = new Map<string, PatronSinTraza[]>();
  for (const p of patrones) {
    const llave = `${p.linea}|${p.direccion}`;
    (porLineaDireccion.get(llave) ?? porLineaDireccion.set(llave, []).get(llave)!).push(p);
  }
  const conPrincipal: PatronSinTraza[] = [];
  for (const p of patrones) {
    const suyos = porLineaDireccion.get(`${p.linea}|${p.direccion}`)!;
    const mejor = [...suyos].sort(
      (a, b) =>
        b.paradas.length - a.paradas.length || b.viajes - a.viajes || a.id.localeCompare(b.id),
    )[0]!;
    conPrincipal.push({ ...p, principal: p.id === mejor.id });
  }
  return conPrincipal;
}

/**
 * ⭐ ¿OPERA ESTE PATRÓN EL DÍA `fecha`? Función pura sobre lo cocinado.
 *
 * [Método Alternate, ya verificado] un patrón opera en la fecha `D` si alguno de
 * sus `service_id` tiene una fila `(D, exception_type = 1)` en `calendar_dates`.
 * No hay `calendar.txt` en este feed y **no existe ni un `exception_type = 2`**
 * — medido en el censo.
 */
export function operaEl(red: RedDeBus, patron: PatronBus, fecha: string): boolean {
  const deEseDia = red.porFecha[fecha];
  if (!deEseDia || deEseDia.length === 0) {
    return false;
  }
  const hoy = new Set(deEseDia);
  return patron.servicios.some((s) => hoy.has(s));
}

// ── LOS TRANSBORDOS A PIE (la `F` de RAPTOR) ─────────────────────────────────

/**
 * ⭐ Hasta dónde se admite un transbordo a pie. **Firma 9 de la casa**, la
 * misma que el remate del aparcabicis y el BiZi: 500 m.
 */
export const MAXIMO_TRANSBORDO_M = 500;

/**
 * Lo que la cocina necesita del peatón: **metros andando de verdad** entre dos
 * puntos, o `null` si no hay camino.
 *
 * Se pasa como función y no se importa el motor del peatón aquí, para que las
 * jueces puedan cocinar con un peatón de mentira y sin cargar 68.649 nodos.
 */
export type AndarEntre = (
  aLon: number,
  aLat: number,
  bLon: number,
  bLat: number,
) => number | null;

/**
 * ⭐ LOS PARES DE PARADAS A ≤500 m **ANDANDO**, no en línea recta.
 *
 * [RAPTOR] la `F` de la búsqueda son los transbordos a pie entre paradas. Los
 * 120 s de penalización [OTP] **no se aplican aquí**: esto es geometría, y el
 * tiempo lo pone la búsqueda (casilla 3b).
 *
 * ⚠️ **La línea recta se usa SOLO para descartar**, nunca para decidir. Primero
 * el filtro barato —7.992 pares de los 483.336 posibles quedan a ≤500 m en
 * recta— y después el paseo de verdad sobre cada uno. Y la diferencia no es
 * cosmética: medido el 31/08 sobre una muestra de 300 candidatos, **solo el
 * 56 % sigue estando a ≤500 m cuando se anda**. Los otros tienen un río, una
 * vía o una manzana en medio, y prometerlos sería mandar a alguien a cruzar por
 * donde no se cruza.
 *
 * Se devuelven **los dos sentidos** de cada par: la búsqueda mira «desde esta
 * parada, a cuáles puedo andar», y tenerlo simétrico ahorra un índice inverso.
 */
export function calcularTransbordos(
  paradas: readonly ParadaBus[],
  andar: AndarEntre,
): TransbordoBus[] {
  const salida: TransbordoBus[] = [];
  for (let i = 0; i < paradas.length; i++) {
    const a = paradas[i]!;
    for (let j = i + 1; j < paradas.length; j++) {
      const b = paradas[j]!;
      // El filtro barato: si en recta ya se pasa, andando también.
      const dx = (b.lon - a.lon) * 82500;
      const dy = (b.lat - a.lat) * 111320;
      if (Math.hypot(dx, dy) > MAXIMO_TRANSBORDO_M) {
        continue;
      }
      const metros = andar(a.lon, a.lat, b.lon, b.lat);
      if (metros === null || metros > MAXIMO_TRANSBORDO_M) {
        continue;
      }
      const redondos = Math.round(metros);
      salida.push({ desde: a.id, hasta: b.id, metros: redondos });
      salida.push({ desde: b.id, hasta: a.id, metros: redondos });
    }
  }
  // Orden estable, para que dos cocinas del mismo zip den el mismo fichero.
  salida.sort((x, y) => x.desde.localeCompare(y.desde) || x.hasta.localeCompare(y.hasta));
  return salida;
}

// ── LAS TRAZAS DEL ASFALTO ───────────────────────────────────────────────────

/**
 * ⭐ `shapes.txt` en flujo: 27.603 filas, 89 trazas, 1,4 MB descomprimidos.
 *
 * Se lee con el mismo lector de líneas que el resto —nada de materializar el
 * fichero— y se ordena cada traza por `shape_pt_sequence`, que es lo único que
 * garantiza el orden: [referencia GTFS] la secuencia manda, no el orden de las
 * filas.
 */
export async function leerLasTrazas(ruta: string, zip: Buffer): Promise<Map<string, Traza>> {
  const bruto = new Map<string, { seq: number; punto: Vertice }[]>();
  await porLineas(ruta, zip, 'shapes.txt', (c, cab) => {
    const [id, lat, lon, seq] = indices(cab, [
      'shape_id',
      'shape_pt_lat',
      'shape_pt_lon',
      'shape_pt_sequence',
    ]);
    const clave = c[id!]!;
    const lista = bruto.get(clave) ?? bruto.set(clave, []).get(clave)!;
    lista.push({ seq: Number(c[seq!]), punto: [Number(c[lat!]), Number(c[lon!])] });
  });
  const trazas = new Map<string, Traza>();
  for (const [id, puntos] of bruto) {
    puntos.sort((a, b) => a.seq - b.seq);
    trazas.set(
      id,
      puntos.map((x) => x.punto),
    );
  }
  return trazas;
}

/** Lo que se sabe de un patrón después de casarlo con su traza. */
export interface Casada {
  readonly forma: string;
  readonly traza: Traza;
  readonly proyecciones: readonly Proyeccion[];
  /** El desvío de la parada que peor cae. Es lo que se compara con los 100 m. */
  readonly peor: number;
}

/**
 * ⭐ QUÉ TRAZA LE TOCA A UN PATRÓN, y **por qué no vale la primera**.
 *
 * 168 de los 170 patrones citan una sola forma y no hay nada que elegir. Los
 * otros dos —`210|0|10` y `210|0|11`, que citan `210_I` y `210_V`— sí, y ahí la
 * elección **no es cosmética**: con `210_I` la peor parada cae a **4.222 m** de
 * la traza y con `210_V` a **14 m**. Coger la primera por orden alfabético
 * habría metido 42 paradas por encima del límite de los 100 m.
 *
 * Así que se elige **la que mejor le queda**: la de menor desvío máximo, y al
 * empate la de identificador menor para que la cocina siga siendo determinista.
 * Si el patrón no cita ninguna forma que exista, se cae a la del **principal**
 * de su (línea, dirección) — hoy no hace falta con ningún patrón, y el camino
 * se deja porque el feed se renueva solo.
 */
export function casarConSuTraza(
  patron: PatronSinTraza,
  trazas: Map<string, Traza>,
  donde: Map<string, Vertice>,
  deReserva: readonly string[] = [],
): Casada | null {
  const paradas = patron.paradas.map((id) => donde.get(id)).filter((x): x is Vertice => !!x);
  if (paradas.length !== patron.paradas.length) {
    return null;
  }
  const candidatas = [...patron.formas, ...deReserva].filter((f) => trazas.has(f));
  const casadas = candidatas
    .map((forma) => {
      const traza = trazas.get(forma)!;
      const proyecciones = proyectarMonotono(traza, paradas);
      const peor = proyecciones.reduce((m, q) => Math.max(m, q.desvio), 0);
      return { forma, traza, proyecciones, peor };
    })
    .filter((x) => x.proyecciones.length === paradas.length)
    .sort((a, b) => a.peor - b.peor || a.forma.localeCompare(b.forma));
  return casadas[0] ?? null;
}

/** Lo que la cocina cuenta al vestir los saltos con su traza. */
export interface CuentasDeTraza {
  readonly puntos: number;
  readonly enRecta: number;
  readonly sinTraza: number;
  readonly peorDesvio: number;
  readonly kmDeAsfalto: number;
}

/**
 * ⭐ VISTE CADA SALTO CON SU TROZO DE ASFALTO.
 *
 * Un salto cae a **recta declarada** cuando cualquiera de sus dos paradas se
 * desvía más de `MAXIMO_DESVIO_M` de la traza: si la parada no está donde la
 * traza pasa, el trozo entre ellas no es el camino de ese autobús.
 */
export function vestirConTrazas(
  patrones: readonly PatronSinTraza[],
  trazas: Map<string, Traza>,
  donde: Map<string, Vertice>,
): { readonly patrones: PatronBus[]; readonly cuentas: CuentasDeTraza } {
  const principalDe = new Map<string, string[]>();
  for (const p of patrones) {
    if (p.principal) {
      principalDe.set(`${p.linea}|${p.direccion}`, [...p.formas]);
    }
  }
  let puntos = 0;
  let enRecta = 0;
  let sinTraza = 0;
  let peorDesvio = 0;
  let metrosDeAsfalto = 0;
  const vestidos = patrones.map((p) => {
    const casada = casarConSuTraza(p, trazas, donde, principalDe.get(`${p.linea}|${p.direccion}`) ?? []);
    const saltos = p.saltos.map((salto, k) => {
      const a = donde.get(p.paradas[k]!);
      const b = donde.get(p.paradas[k + 1]!);
      const cabe =
        casada !== null &&
        casada.proyecciones[k]!.desvio <= MAXIMO_DESVIO_M &&
        casada.proyecciones[k + 1]!.desvio <= MAXIMO_DESVIO_M;
      const trozo =
        cabe && casada
          ? cortar(casada.traza, casada.proyecciones[k]!, casada.proyecciones[k + 1]!)
          : a && b
            ? rectaEntre(a, b)
            : { geometria: [], metros: 0 };
      if (!cabe) {
        enRecta++;
      }
      puntos += trozo.geometria.length;
      metrosDeAsfalto += trozo.metros;
      return { ...salto, traza: trozo.geometria, metros: trozo.metros, recta: !cabe };
    });
    if (!casada) {
      sinTraza++;
    } else {
      peorDesvio = Math.max(peorDesvio, casada.peor);
    }
    return { ...p, saltos };
  });
  return {
    patrones: vestidos,
    cuentas: {
      puntos,
      enRecta,
      sinTraza,
      peorDesvio,
      kmDeAsfalto: metrosDeAsfalto / 1000,
    },
  };
}

// ── EL ORQUESTADOR ───────────────────────────────────────────────────────────

export interface Cuentas {
  readonly paradas: number;
  readonly lineas: number;
  readonly zombis: number;
  readonly patrones: number;
  readonly saltos: number;
  readonly transbordos: number;
  readonly fechas: number;
  /** ⭐ Los puntos de traza guardados, sumando todos los saltos. */
  readonly puntosDeTraza: number;
  /** Saltos que van en RECTA porque su parada no cabía en la traza. */
  readonly saltosEnRecta: number;
  /** Patrones sin ninguna traza que casar. */
  readonly patronesSinTraza: number;
  /** El desvío de la parada que peor cae, en metros. El tope es 100. */
  readonly peorDesvio: number;
  readonly kmDeAsfalto: number;
  readonly ms: number;
  readonly kb: number;
  readonly heapMb: number;
}

export interface Cocinado {
  readonly red: RedDeBus;
  readonly cuentas: Cuentas;
}

/**
 * ⭐ COCINA LA RED ENTERA del zip que se le dé.
 *
 * `andar` es el peatón. Si se pasa `null`, los transbordos salen vacíos y se
 * dice: es lo que permite cocinar en una prueba sin cargar la red del peatón.
 */
export async function cocinar(ruta: string, andar: AndarEntre | null): Promise<Cocinado> {
  const t0 = performance.now();
  const heapAntes = process.memoryUsage().heapUsed;
  const zip = readFileSync(ruta);

  const crudo = await leerLoPequeno(ruta, zip);
  const tiempos = await leerLosTiempos(ruta, zip);
  const enBruto = agruparEnPatrones(crudo, tiempos);
  // ⭐ Y aquí el asfalto (31/08, casilla 4): cada salto con su trozo de traza.
  const donde = new Map<string, Vertice>(
    [...crudo.paradas.entries()].map(([id, p]) => [id, [p.lat, p.lon] as Vertice]),
  );
  const vestidos = vestirConTrazas(enBruto, await leerLasTrazas(ruta, zip), donde);
  const patrones = vestidos.patrones;

  // Qué modos pasan por cada parada, de los patrones que la tocan.
  const modosDe = new Map<string, Set<ModoDeRed>>();
  for (const p of patrones) {
    for (const s of p.paradas) {
      (modosDe.get(s) ?? modosDe.set(s, new Set()).get(s)!).add(p.modo);
    }
  }
  const paradas: ParadaBus[] = [...crudo.paradas.entries()]
    .map(([id, p]) => ({
      id,
      codigo: p.codigo,
      nombre: p.nombre,
      lat: p.lat,
      lon: p.lon,
      modos: [...(modosDe.get(id) ?? [])].sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const cuantosPatrones = new Map<string, number>();
  for (const p of patrones) {
    cuantosPatrones.set(p.linea, (cuantosPatrones.get(p.linea) ?? 0) + 1);
  }
  const lineas: LineaBus[] = [...crudo.rutas.entries()]
    .map(([id, r]) => ({
      id,
      corto: r.corto,
      largo: r.largo,
      color: r.color,
      colorTexto: r.texto,
      modo: r.modo,
      patrones: cuantosPatrones.get(id) ?? 0,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const porFecha: Record<string, readonly string[]> = {};
  for (const [d, ss] of [...crudo.porFecha.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
    porFecha[d] = [...new Set(ss)].sort();
  }

  const transbordos = andar ? calcularTransbordos(paradas, andar) : [];

  const info = delZip(zip, 'feed_info.txt');
  let version = '';
  if (info) {
    const lineas = info.toString('utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length > 0);
    const cab = partirCsv(lineas[0] ?? '');
    const val = partirCsv(lineas[1] ?? '');
    version = val[cab.indexOf('feed_version')] ?? '';
  }

  const red: RedDeBus = {
    formato: FORMATO_DEL_COCINADO,
    conPeaton: andar !== null,
    feedVersion: version,
    paradas,
    lineas,
    patrones,
    porFecha,
    transbordos,
  };
  const ms = performance.now() - t0;
  const kb = Buffer.byteLength(JSON.stringify(red), 'utf8') / 1024;
  return {
    red,
    cuentas: {
      paradas: paradas.length,
      lineas: lineas.length,
      zombis: lineas.filter((l) => l.patrones === 0).length,
      patrones: patrones.length,
      saltos: patrones.reduce((n, p) => n + p.saltos.length, 0),
      transbordos: transbordos.length,
      fechas: Object.keys(porFecha).length,
      puntosDeTraza: vestidos.cuentas.puntos,
      saltosEnRecta: vestidos.cuentas.enRecta,
      patronesSinTraza: vestidos.cuentas.sinTraza,
      peorDesvio: vestidos.cuentas.peorDesvio,
      kmDeAsfalto: vestidos.cuentas.kmDeAsfalto,
      ms,
      kb,
      heapMb: (process.memoryUsage().heapUsed - heapAntes) / 1024 / 1024,
    },
  };
}

// ── EL PEATÓN DE VERDAD, Y EL PRODUCTO EN DISCO ──────────────────────────────

/**
 * ⭐ El `AndarEntre` que usa el motor del peatón de la casa.
 *
 * Es el mismo camino que cualquier ruta a pie del producto: enganchar los dos
 * extremos a la red y calcular. Si alguno no engancha, no hay transbordo — y no
 * se inventa uno en línea recta «porque estaban cerca».
 */
export function andarConElPeaton(
  peaton: RedEnMemoria,
  rejilla: Rejilla,
  cuaderno: Cuaderno,
): AndarEntre {
  return (aLon, aLat, bLon, bLat) => {
    const eo = enganchar(peaton, rejilla, aLon, aLat);
    const ed = enganchar(peaton, rejilla, bLon, bLat);
    if (!eo || !ed) {
      return null;
    }
    const r = calcularRuta(peaton, cuaderno, eo, [aLon, aLat], ed, [bLon, bLat]);
    return r ? r.metros : null;
  };
}

/** El cocinado en disco, junto al vivo. Ignorado por git: se regenera solo. */
export const COCINADO = fileURLToPath(
  new URL('../../app/data/nap_gtfs-ficha1176.cocinado.json', import.meta.url),
);

/**
 * ⭐ LA RED COCINADA QUE SE SIRVE, y el relevo cuando llega un zip nuevo.
 *
 * ⚠️ **Es una referencia que se sustituye, no un objeto que se muta.** Cuando
 * `recocinar()` termina, apunta al objeto nuevo y el viejo se queda como estaba
 * — cualquier petición que lo estuviera leyendo sigue leyendo una red coherente
 * hasta que acabe, en vez de encontrarse la mitad cambiada debajo.
 *
 * [PROPIO declarado] La alternativa documentada es **reiniciar el proceso**, que
 * es lo que hacen OTP y ZetaBus. Aquí se cambia en caliente porque el motor
 * sirve rutas a pie que no tienen por qué caerse cuando el bus se recocina, y
 * porque un cambio de referencia es una operación atómica en un solo hilo.
 */
let redServida: RedDeBus | null = null;

export function laRedDeBus(): RedDeBus | null {
  return redServida;
}

export function servirEstaRed(red: RedDeBus): void {
  redServida = red;
}

/** Lee el cocinado del disco, o `null` si no está o no se deja leer. */
/**
 * El cocinado de disco, o `null` si no hay o no se puede leer.
 *
 * La ruta es un parámetro con el valor de producción por defecto [ley nº17: un
 * defecto que producción usa necesita una juez que lo llame sin argumento], y
 * **leer no estropea nada**, así que esa juez existe.
 */
export function cocinadoGuardado(ruta: string = COCINADO): RedDeBus | null {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8')) as RedDeBus;
  } catch {
    return null;
  }
}

/**
 * ¿Sirve el cocinado que hay en disco para el feed que se está sirviendo?
 *
 * Cuatro condiciones y las cuatro hacen falta: **el formato** que este código
 * sabe leer, **el feed** que se está sirviendo, que **se cocinara con el
 * peatón** —sin él no hay transbordos y media red no se puede recorrer— y que
 * no esté vacío. Va en su propia función para que se pueda poner delante de una
 * juez sin arrancar el motor.
 */
export function sirveElGuardado(guardado: RedDeBus | null, feedVersion: string): boolean {
  return (
    guardado !== null &&
    guardado.formato === FORMATO_DEL_COCINADO &&
    guardado.conPeaton === true &&
    guardado.feedVersion === feedVersion &&
    guardado.patrones.length > 0
  );
}

/**
 * Guarda el cocinado. La ruta también es parámetro, y aquí sí importa:
 *
 * ⚠️ **Ninguna juez llama a este defecto**, y es a propósito. Escribir por él
 * es escribir el fichero que el producto lee al arrancar, y una juez que deja
 * el producto peor de lo que lo encontró no es una juez — el 31/08 una lo dejó
 * con **0 transbordos** y la suite entera siguió en verde. El defecto es el
 * MISMO `COCINADO` que lee `cocinadoGuardado`, y esa sí tiene juez sin
 * argumento: entre las dos queda clavado.
 */
export function guardarCocinado(red: RedDeBus, ruta: string = COCINADO): void {
  writeFileSync(ruta, JSON.stringify(red), 'utf8');
}

/**
 * ⭐ COCINA Y SIRVE, con el cocinado del disco como atajo.
 *
 * Al arrancar se usa el fichero cocinado si **`sirveElGuardado`** lo admite:
 * mismo feed, mismo FORMATO y no vacío. Comparar solo el feed dejó servir una
 * red de la forma de ayer con el código de hoy — ver la entrada del 31/08 de
 * `docs/BITACORA.md`.
 *
 * `recocinar()` (casilla 2) llama aquí después de traer un zip nuevo: cocina y
 * **sustituye la referencia**. Ver `servirEstaRed`.
 */
export async function cocinarYServir(
  ruta: string,
  feedVersion: string,
  andar: AndarEntre | null,
): Promise<{ readonly cuentas: Cuentas | null; readonly deDisco: boolean }> {
  const guardado = cocinadoGuardado();
  if (sirveElGuardado(guardado, feedVersion)) {
    servirEstaRed(guardado!);
    return { cuentas: null, deDisco: true };
  }
  const { red, cuentas } = await cocinar(ruta, andar);
  servirEstaRed(red);
  guardarCocinado(red);
  return { cuentas, deDisco: false };
}
