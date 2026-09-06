/**
 * ⭐ EL VIAJE EN BUS Y TRANVÍA: la búsqueda por rondas sobre la red cocinada.
 *
 * ── El algoritmo, con su nombre ─────────────────────────────────────────────
 *
 * **RAPTOR** [Delling, Pajor y Werneck, 2012; es el de OTP2]: se busca **por
 * rondas**, y **la ronda `k` son `k` vehículos**. En cada ronda se recorre cada
 * patrón **una sola vez**, desde su primera parada marcada, mejorando las de
 * más adelante; después viene la **fase de transbordos a pie**. Y el viaje se
 * parte como parte OTP2: **acceso andando → transporte → salida andando**.
 *
 * ── La variante de casa, y va DECLARADA ─────────────────────────────────────
 *
 * ⚠️ **Aquí no se casan horas** [firmas 6 y 7]: no se pregunta «¿a qué hora
 * sales?», así que no hay horario contra el que encajar. El coste de un camino
 * es, en segundos:
 *
 *     andar + Σ( espera + saltos típicos ) + Σ( transbordo a pie + 120 s )
 *
 * y el orden entre caminos es **lexicográfico**, no una suma ponderada:
 *
 *   1. **Menos vehículos** [firma 6, y es absoluta: un vehículo lento gana a
 *      dos rápidos].
 *   2. **Menos tramos de tranvía** al empate [firma 3].
 *   3. **Menos tiempo**.
 *
 * Es el frente de Pareto de RAPTOR **colapsado a las firmas de la casa**: donde
 * RAPTOR devolvería el abanico para que elija quien pregunta, aquí las firmas
 * ya han elegido.
 *
 * ⚠️ **Y el colapso tiene un coste que se dice**: por cada parada y ronda se
 * guarda **una sola etiqueta**, la mejor por `(tranvías, tiempo)`. En teoría eso
 * puede descartar un camino que pague un tranvía de más al principio para
 * ahorrarse dos al final. En esta ciudad **hay una sola línea de tranvía**, así
 * que ese caso no existe hoy; el día que haya dos, esto hay que volver a
 * mirarlo. Preferimos decirlo a llamarlo óptimo.
 *
 * ── La espera ───────────────────────────────────────────────────────────────
 *
 * `E[W] = H/2`, la suposición canónica para llegadas aleatorias a un servicio
 * frecuente [Dial 1967 · Clerq 1972 · Wirasinghe 1980]. `H` es el intervalo
 * medio **de hoy**: la franja de servicio de hoy entre los viajes de hoy, del
 * cocinado.
 *
 * ⚠️ **Se degrada con intervalos largos** —por encima de 10-12 minutos la gente
 * deja de llegar al azar y empieza a mirar el horario—, así que **viaja como
 * estimación y con su `~`**. Y si Avanza dice cuántos minutos falta de verdad,
 * ese dato **sustituye** al `H/2` del primer vehículo: lo real desplaza a lo
 * programado, que es el principio de GTFS-Realtime.
 */
import type { AQuienPreguntar, LineaDelViaje, Paso, PosteVivo, Vertice } from '@desplazame/tipos';
import type { Aviso, Trayecto } from '@desplazame/tipos';
import { etapaAndando, juntar, type Etapa, type Extremo } from './etapas.ts';
import { comoSeDiceElProximo, comoSeDiceLoVivo, ESTE_POSTE } from './poste-vivo.ts';
import {
  estadoVivoDe,
  llegadasDelPoste,
  nombrarPoste,
  posteDeCodigo,
  type EstadoVivo,
} from './avanza.ts';
import { enganchar } from './proyeccion.ts';
import { calcularRuta } from './ruta.ts';
import type { Motor } from './trayecto.ts';
import type { AndarEntre } from './red-bus.ts';
import { operaEl, type ModoDeRed, type PatronBus, type RedDeBus } from './red-bus.ts';
import { avisoDelFestivo, cuadroServido, ventanaDelCuadro, type CuadroDelDia } from './festivo.ts';

/**
 * ⭐ HASTA DÓNDE SE BUSCA UN POSTE. **Un tope de RENDIMIENTO, no un veto.**
 *
 * ⚠️ **Los 500/800 m por modo se retiran** (31/08). Eran una frontera: un poste
 * a 501 m no existía para el motor, dijera lo que dijera el resto del viaje. Y
 * eso no es lo que hace un router. [DOC OTP2] el límite de acceso y salida es
 * **de rendimiento** —su consejo es *ponerlo alto*, y su defecto son **4 horas**—
 * y **quien decide es `walkReluctance`**: andar 530 m no está prohibido, cuesta
 * 1.526 de peso, y el viaje se lleva ese coste a la comparación como cualquier
 * otro.
 *
 * El caso que lo pidió: la línea 44 pasa a **530 m andando** del portal de
 * Antonio. Con el veto no existía; ahora entra y compite.
 *
 * Aquí el tope se pone en **30 minutos andando** —no las 4 horas de OTP, que
 * son para una región entera con tren; esto es una ciudad de 20 km de lado—.
 * [PROPIO, declarado.]
 */
export const TOPE_DE_ACCESO_S = 30 * 60;

/**
 * ⚠️ Y EL OTRO TOPE, que es el que de verdad manda: **40 postes candidatos**.
 *
 * Es rendimiento puro y va medido. Cada candidato cuesta **un Dijkstra del
 * peatón**, porque los metros de acceso son metros andando de verdad, nunca en
 * recta. Medido el 31/08 desde tres portales:
 *
 * ```
 * tope 2500 m: 181 postes en recta (barrio)  →  202 ms
 *              438 postes en recta (centro)  → 1602 ms   ← por extremo
 * ```
 *
 * Tres segundos y pico de Dijkstras por «Generar» no los paga nadie. OTP no
 * tiene este problema porque hace **una** búsqueda callejera hacia fuera y
 * recoge las paradas que alcanza; aquí la primitiva es punto a punto, así que
 * el tope va en el número de candidatos. Se cogen los 40 más cercanos **en
 * recta** —que es gratis— y a esos se les anda.
 *
 * 40 cubre más de 1.100 m en cualquiera de los tres portales medidos, muy por
 * encima de lo que nadie anda hasta un bus. Si algún día la primitiva del
 * peatón sepa alcanzar muchos destinos de una vez, este tope sobra.
 */
export const POSTES_CANDIDATOS = 40;

/**
 * Los 500 y 800 m de antes **siguen citados a propósito**: son el estándar de
 * planeamiento —la distancia que se acepta al planificar una red de paradas—,
 * y no eran un mal número. Lo que eran es un número de PLANEAMIENTO usado como
 * regla de ROUTER, y eso sí estaba mal.
 */
export const ESTANDAR_DE_PLANEAMIENTO_M: Readonly<Record<ModoDeRed, number>> = {
  bus: 500,
  tram: 800,
};

/**
 * ⭐ TOPE DE RONDAS = 3 vehículos. [PROPIO declarado.]
 *
 * RAPTOR no tiene tope natural: se para cuando una ronda no mejora nada. Aquí se
 * pone uno porque **esto es una ciudad de 45 líneas**, no una red nacional: un
 * viaje urbano con cuatro vehículos no lo hace nadie — se va andando, en bici o
 * en taxi. Y un tope pequeño mantiene la búsqueda barata sin perder nada que se
 * fuera a usar.
 */
export const RONDAS = 3;

/** 5 km/h, la misma velocidad a pie que todo lo demás de la casa. */
export const VELOCIDAD_PEATON_MS = 5000 / 3600;

/** Los 120 s que cuesta un transbordo, además de andarlo. [OTP `transferSlack`.] */
export const PENALIZACION_TRANSBORDO_S = 120;

/**
 * ⭐ LO MALO QUE ES ANDAR, COMPARADO CON IR SENTADO. **4,0** [OTP2].
 *
 * [DOC OpenTripPlanner, `walkReluctance`] es *«el multiplicador de lo malo que
 * es andar frente a ir en transporte el mismo tiempo»*. El defecto de OTP1 era
 * **2,0** y el de la configuración actual de OTP2 es **4,0**; de 10 a 20 es
 * «no quiero andar». Se toma el 4,0, que es el defecto vigente, y queda dicho
 * que el 2,0 es la alternativa documentada si el ojo la prefiere.
 *
 * ⚠️ **Esto pesa la BÚSQUEDA, no el reloj.** Los segundos que se contestan son
 * los de verdad —ver `reconstruir`—: andar diez minutos sigue tardando diez
 * minutos aunque para elegir camino cuenten como cuarenta.
 */
export const PESO_DE_ANDAR = 4;

/**
 * ⭐ LO QUE CUESTA SUBIRSE A UN VEHÍCULO. **600** de peso ≈ 10 minutos [OTP].
 *
 * [DOC OpenTripPlanner, `walkBoardCost`] *«evita transbordos innecesarios»*, y es
 * *«el coste percibido usual de usar un vehículo»*: la molestia de esperar sin
 * saber, de identificar el bus, de subir y validar.
 *
 * ⭐ **Y es lo que sustituye a la firma 6.** [DOC OTP, literal] *«no optimizamos
 * por menos transbordos: lleva a resultados absurdos»* —su ejemplo es Nueva
 * York—. Así que «menos vehículos» deja de ser una llave absoluta y pasa a ser
 * una **preferencia fuerte**: un segundo vehículo tiene que ahorrar **más de 600
 * de peso** para entrar. Con el peso de andar en 4, eso son más de diez minutos
 * de viaje o dos minutos y medio de paseo.
 */
export const COSTE_DE_SUBIR = 600;

/**
 * Lo que pesa esperar: **1,0**, tal cual [OTP `waitReluctance`].
 *
 * ⚠️ Y su advertencia, que es la razón de que no se toque: subirlo hace que el
 * planificador *«ande por la línea para evitar esperar»* — empieza a proponer
 * paseos largos hasta la parada siguiente con tal de no quedarse quieto.
 */
export const PESO_DE_ESPERAR = 1;

/**
 * ⚠️ **LA PREFERENCIA POR MODO, RETIRADA** (31/08). Tranvía = **1,0**.
 *
 * [DOC OTP, `transitReluctanceForMode`] la preferencia por modo existe y se
 * expresa con un peso, no con un veto — pero **su ejemplo va al revés del
 * nuestro**: trae `RAIL 0,85`, es decir, el tren se PREFIERE. La doctrina no
 * trae ningún número para penalizar el tranvía, y la firma 3 no tenía más
 * apoyo que la costumbre. Se retira por falta de soporte documentado; el par de
 * Asín y Palacios se vuelve a medir y se enseña con la firma fuera.
 */
export const PESO_POR_MODO: Readonly<Record<ModoDeRed, number>> = { bus: 1, tram: 1 };

/** Lo que pesa andar `metros`: los segundos de verdad, por `PESO_DE_ANDAR`. */
export function pesoDeAndar(metros: number): number {
  return (PESO_DE_ANDAR * metros) / VELOCIDAD_PEATON_MS;
}

/** Una parada alcanzable a pie desde un extremo, con lo que cuesta llegar. */
export interface Acceso {
  readonly parada: string;
  readonly metros: number;
}

/** Un tramo montado del resultado: en qué te subes, dónde y hasta dónde. */
export interface TramoMontado {
  readonly patron: PatronBus;
  readonly desde: string;
  readonly hasta: string;
  /** Índices dentro de `patron.paradas`. */
  readonly iDesde: number;
  readonly iHasta: number;
  /** Segundos de espera estimados: `H/2` del patrón hoy. */
  readonly espera: number;
  /** Segundos rodando, sumando los saltos típicos. */
  readonly rodando: number;
}

export interface Viaje {
  readonly accesoAndando: Acceso;
  readonly salidaAndando: Acceso;
  /** Los tramos montados, en orden. Uno por vehículo. */
  readonly montados: readonly TramoMontado[];
  /** Los transbordos a pie entre montados: `montados.length - 1` de ellos. */
  readonly transbordos: readonly { readonly desde: string; readonly hasta: string; readonly metros: number }[];
  readonly segundos: number;
  readonly vehiculos: number;
  readonly tranvias: number;
}

/** Los segundos que tiene un día. Un día de SERVICIO de GTFS puede pasarse. */
export const SEGUNDOS_DEL_DIA = 86_400;

/**
 * ⭐ LA VENTANA DE SERVICIO de un patrón en una fecha, con su intervalo.
 *
 * `primera` y `ultima` son la salida del primer poste en segundos desde la
 * medianoche del **día de servicio**, y **pueden pasar de 86.400**: medido en
 * este feed, **352 de las 3.361** entradas de `porServicio` lo hacen y la más
 * tardía es 97.020 —las 26:57—. Es la convención del día de servicio: un viaje
 * de la Ci1 a las 24:18 pertenece al día ANTERIOR, no a la madrugada de hoy.
 *
 * ⚠️ **El dato llevaba cocinado desde el principio y se tiraba.** `porServicio`
 *    lo guarda desde `red-bus.ts`, e `intervaloDeHoy` leía `primera` y `ultima`
 *    solo para dividir. Ver la entrada del 6/09 en `docs/BITACORA.md`.
 */
export interface VentanaDeServicio {
  readonly primera: number;
  readonly ultima: number;
  /** El `H` de `E[W] = H/2`: la franja del día entre sus viajes. */
  readonly intervalo: number;
}

export function ventanaDe(
  patron: PatronBus,
  red: RedDeBus,
  fecha: string,
): VentanaDeServicio | null {
  const deHoy = new Set(red.porFecha[fecha] ?? []);
  let viajes = 0;
  let primera = Number.POSITIVE_INFINITY;
  let ultima = Number.NEGATIVE_INFINITY;
  for (const [servicio, datos] of Object.entries(patron.porServicio)) {
    if (!deHoy.has(servicio)) {
      continue;
    }
    viajes += datos.viajes;
    primera = Math.min(primera, datos.primera);
    ultima = Math.max(ultima, datos.ultima);
  }
  if (viajes < 2 || !Number.isFinite(primera)) {
    // ⭐ AQUÍ, Y SOLO AQUÍ, HABLA LA CAPA DEL FESTIVO (6/09).
    //
    // El feed no da ni un viaje de este patrón hoy. Si la capa tiene el cuadro
    // web de esa línea y ese sentido para esta fecha, entra; si no, sigue
    // valiendo el `null` de siempre y la línea no existe hoy. Ver `festivo.ts`.
    //
    // ⚠️ **La frontera es estrecha a propósito**: la capa no puede pisar un
    //    día que el feed SÍ trae, porque ahí nunca se la pregunta. El día que
    //    el operador publique el festivo del curso, esto deja de dispararse solo.
    //
    // ⭐ Y el cuadro web trae **también las dos puntas**, así que una línea
    //    suplida tiene ventana igual que una del feed: no hay dos reglas.
    const suyo = cuadroDelFestivo(patron, red, fecha);
    if (suyo === null) {
      return null;
    }
    const puntas = ventanaDelCuadro(suyo);
    return puntas === null ? null : { ...puntas, intervalo: suyo.intervaloS };
  }
  // La franja va de la primera salida a la última: entre N salidas hay N−1
  // huecos, y dividir por N daría un intervalo más corto del que hay.
  return { primera, ultima, intervalo: (ultima - primera) / (viajes - 1) };
}

/** La fecha del día anterior, en `AAAAMMDD`. */
export function elDiaAntes(fecha: string): string {
  const anno = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(4, 6));
  const dia = Number(fecha.slice(6, 8));
  const d = new Date(anno, mes - 1, dia - 1);
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}`;
}

/**
 * Los segundos transcurridos del día, en hora **LOCAL** —igual que `hoyEnGtfs`,
 * y por lo mismo: el día de servicio es el del reloj de la calle—.
 */
export function segundosDelDia(cuando: Date): number {
  return cuando.getHours() * 3600 + cuando.getMinutes() * 60 + cuando.getSeconds();
}

/**
 * ⭐ EL INTERVALO DE HOY de un patrón, en segundos. `null` si hoy no opera o si
 * hoy solo hace un viaje —con un solo viaje no hay intervalo que promediar—.
 *
 * Es el `H` que se enseña como *frecuencia teórica*. **No mira la hora**: la
 * frecuencia de una línea es la que es, se pregunte cuando se pregunte. Quien
 * mira la hora es `esperaEstimada`.
 */
export function intervaloDeHoy(patron: PatronBus, red: RedDeBus, fecha: string): number | null {
  return ventanaDe(patron, red, fecha)?.intervalo ?? null;
}

/**
 * El intervalo que la capa del festivo suple para este patrón, o `null`.
 *
 * ⚠️ **Solo el patrón PRINCIPAL de cada sentido.** El cuadro web dice lo que
 *    hace la línea, no lo que hace cada uno de sus refuerzos; dárselo a todos
 *    sería contar la misma línea tantas veces como patrones tenga.
 */
export function circulaHoy(
  red: RedDeBus,
  patron: PatronBus,
  fecha: string,
  ahora: number | null = null,
): boolean {
  return esperaEstimada(patron, red, fecha, ahora) !== null;
}

function cuadroDelFestivo(patron: PatronBus, red: RedDeBus, fecha: string): CuadroDelDia | null {
  if (patron.modo !== 'bus' || !patron.principal) {
    return null;
  }
  return cuadroServido(lineaDelViaje(red, patron).corto, patron.direccion, fecha);
}

/**
 * ⭐ LA ESPERA en un patrón, **mirando la hora**. `null` = hoy no se puede
 * abordar, y quien llame lo trata como que la línea no existe.
 *
 * Sin `ahora` se comporta como antes del 6/09: `H/2` si hay ventana. Con `ahora`
 * —segundos del día de servicio— sigue la letra de `frequencies.txt`, donde
 * `start_time` es *«la hora a la que el servicio comienza»*, `end_time` aquella
 * en que *«cambia de frecuencia o cesa»*, y el headway vale **durante el
 * intervalo**:
 *
 * · **dentro de la ventana** → `H/2`, el modelo de siempre.
 * · **antes de la primera** → la espera es hasta la primera, no `H/2`: el primer
 *   vehículo sale a esa hora y no antes. **No se veta**: se pone el precio y que
 *   el coste decida —a las 06:30 esperar al de las 07:00 puede compensar—.
 * · **pasada la última** → por hoy ha cesado.
 *
 * ⭐ **Y siempre se mira TAMBIÉN EL DÍA DE AYER**, sumando 86.400. Es la
 * convención del día de servicio: a las 00:10 el último Ci1 de ayer —que en el
 * feed sale a las 24:18— todavía está en la calle, y para el viajero de las
 * 00:10 ese autobús existe. Se devuelve **la menor** de las dos esperas: son dos
 * servicios de verdad y se coge el que antes pase.
 *
 * ⚠️ **No se inventa una espera por defecto.** Sin intervalo —un solo viaje, o
 *    ninguno— sigue siendo `null`: decir «~10 min» sobre un patrón que hace un
 *    viaje al día sería una cifra fabricada.
 */
export function esperaEstimada(
  patron: PatronBus,
  red: RedDeBus,
  fecha: string,
  ahora: number | null = null,
): number | null {
  const hoy = ventanaDe(patron, red, fecha);
  if (ahora === null) {
    return hoy === null ? null : Math.round(hoy.intervalo / 2);
  }
  const opciones: number[] = [];
  if (hoy !== null) {
    if (ahora < hoy.primera) {
      opciones.push(hoy.primera - ahora);
    } else if (ahora <= hoy.ultima) {
      opciones.push(Math.round(hoy.intervalo / 2));
    }
  }
  const ayer = ventanaDe(patron, red, elDiaAntes(fecha));
  if (ayer !== null) {
    const tarde = ahora + SEGUNDOS_DEL_DIA;
    if (tarde >= ayer.primera && tarde <= ayer.ultima) {
      opciones.push(Math.round(ayer.intervalo / 2));
    }
  }
  return opciones.length > 0 ? Math.min(...opciones) : null;
}

/**
 * Los segundos de rodar desde el principio del patrón hasta cada parada.
 *
 * Es lo que permite comparar dos subidas distintas sin recorrer los saltos otra
 * vez: rodar de `a` a `b` es `acumulado[b] − acumulado[a]`, y esa resta es la
 * que hace que el mínimo corrido de la fase de patrones funcione.
 */
function acumuladoDe(patron: PatronBus): number[] {
  const a = [0];
  for (let k = 0; k < patron.saltos.length; k++) {
    a.push(a[k]! + (patron.saltos[k]?.tipico ?? 0));
  }
  return a;
}

/** Los segundos típicos entre dos índices de un patrón, sumando sus saltos. */
export function rodandoEntre(patron: PatronBus, desde: number, hasta: number): number {
  let s = 0;
  for (let i = desde; i < hasta; i++) {
    s += patron.saltos[i]?.tipico ?? 0;
  }
  return s;
}

/** Índices para no recorrer 170 patrones y 10.588 transbordos en cada paso. */
export interface Indices {
  /** `stop_id` → los patrones que la tocan, con el índice de la parada dentro. */
  readonly porParada: Map<string, readonly { patron: PatronBus; i: number }[]>;
  /** `stop_id` → a qué otras paradas se anda, con sus metros. */
  readonly aPie: Map<string, readonly { hasta: string; metros: number }[]>;
}

export function indexar(
  red: RedDeBus,
  fecha: string,
  suprimidas?: ReadonlySet<string>,
  /** Segundos del día de servicio. `null` = sin reloj, como antes del 6/09. */
  ahora: number | null = null,
): Indices {
  const porParada = new Map<string, { patron: PatronBus; i: number }[]>();
  for (const patron of red.patrones) {
    // ⭐ Solo lo que OPERA HOY. Un patrón que no circula no es una opción, y
    // meterlo en la búsqueda sería ofrecer un bus que no existe.
    //
    // ⚠️ **Y aquí es donde la capa del festivo tiene que entrar, no más
    //    abajo.** El índice se construye ANTES de que nadie pregunte por la
    //    espera, así que un patrón filtrado aquí no llega nunca a
    //    `esperaEstimada` —y suplirle el intervalo no servía de nada—.
    //    Medido el 6/09: con el cuadro servido, `intervaloDeHoy` daba 600 s
    //    para el 35 y el viaje seguía saliendo por los búhos.
    //
    // ⭐ Y DESDE EL 6/09 TAMBIÉN LA HORA. Un patrón cuyo servicio ya cesó
    //    —o que aún no ha empezado y no llega— no entra en el índice: los nueve
    //    búhos van de 01:00 a 06:33 y competían a mediodía. Ver `esperaEstimada`.
    if (!circulaHoy(red, patron, fecha, ahora)) {
      continue;
    }
    patron.paradas.forEach((parada, i) => {
      if (suprimidas?.has(parada)) {
        // Hoy no se para aquí: no es sitio donde subirse.
        return;
      }
      const suyos = porParada.get(parada);
      if (suyos) {
        suyos.push({ patron, i });
      } else {
        porParada.set(parada, [{ patron, i }]);
      }
    });
  }
  const aPie = new Map<string, { hasta: string; metros: number }[]>();
  for (const t of red.transbordos) {
    const suyos = aPie.get(t.desde);
    if (suyos) {
      suyos.push({ hasta: t.hasta, metros: t.metros });
    } else {
      aPie.set(t.desde, [{ hasta: t.hasta, metros: t.metros }]);
    }
  }
  return { porParada, aPie };
}

/** Lo que se sabe de una parada en una ronda. */
interface Etiqueta {
  readonly coste: number;
  readonly tranvias: number;
  /** Cómo se llegó, para poder reconstruir el viaje. */
  readonly como:
    | { readonly clase: 'acceso'; readonly metros: number }
    | {
        readonly clase: 'montado';
        readonly patron: PatronBus;
        readonly desde: string;
        readonly iDesde: number;
        readonly iHasta: number;
        readonly espera: number;
        readonly rodando: number;
      }
    | { readonly clase: 'aPie'; readonly desde: string; readonly metros: number };
  readonly anterior: string | null;
  readonly ronda: number;
}

/**
 * ¿Es `a` mejor que `b`? **Menos coste, y ya.**
 *
 * ⚠️ Hasta el 31/08 esto era un orden lexicográfico —vehículos, luego tranvías,
 * luego tiempo— y ahora es una sola resta, porque **las preferencias se han
 * metido dentro del coste**: cada vehículo suma `COSTE_DE_SUBIR` y cada metro
 * andado pesa `PESO_DE_ANDAR`. [DOC OTP] *«no optimizamos por menos transbordos:
 * lleva a resultados absurdos»* — una llave lexicográfica no se puede negociar,
 * y un peso sí.
 */
function esMejor(a: Etiqueta, b: Etiqueta): boolean {
  return a.coste < b.coste;
}

export interface Peticion {
  readonly red: RedDeBus;
  readonly fecha: string;
  readonly acceso: readonly Acceso[];
  readonly salida: readonly Acceso[];
  /**
   * ⭐ Los postes por los que hoy NO se pasa. [OTP2: parada suprimida =
   * `SKIPPED`.] No se sube ni se baja en ellos, y **en ningún patrón**: si el
   * autobús no pasa por la calle, no pasa para ningún refuerzo.
   */
  readonly suprimidas?: ReadonlySet<string>;
  /**
   * ⭐ LA HORA, en segundos del día de servicio. Ausente es **sin reloj**: la
   * conducta de antes del 6/09, que es la que compran las jueces que no lo
   * pasan. Ver `esperaEstimada`.
   */
  readonly ahora?: number | null;
}

/**
 * ⭐ LA BÚSQUEDA. Devuelve el mejor viaje por el orden de la casa, o `null`.
 *
 * Las rondas se recorren en orden y **se devuelve la primera que llega**: como
 * la ronda `k` son `k` vehículos y el primer criterio es «menos vehículos», en
 * cuanto una ronda da solución las siguientes ya no pueden ganar. Dentro de la
 * ronda sí se compara por `(tranvías, tiempo)`.
 */
export function buscarViaje(p: Peticion): Viaje | null {
  const { red, fecha } = p;
  const ahora = p.ahora ?? null;
  const indices = indexar(red, fecha, p.suprimidas, ahora);

  // Ronda 0: lo que se alcanza andando desde el origen.
  const mejor = new Map<string, Etiqueta>();
  let frontera = new Set<string>();
  for (const a of p.acceso) {
    const etiqueta: Etiqueta = {
      coste: pesoDeAndar(a.metros),
      tranvias: 0,
      como: { clase: 'acceso', metros: a.metros },
      anterior: null,
      ronda: 0,
    };
    const previa = mejor.get(a.parada);
    if (!previa || esMejor(etiqueta, previa)) {
      mejor.set(a.parada, etiqueta);
      frontera.add(a.parada);
    }
  }
  if (frontera.size === 0) {
    return null;
  }

  const alSalir = new Map(p.salida.map((s) => [s.parada, s.metros]));
  /** El mejor viaje visto en CUALQUIER ronda, por coste total con salida. */
  let campeon: { parada: string; metros: number; coste: number } | null = null;

  for (let ronda = 1; ronda <= RONDAS; ronda++) {
    const nuevas = new Map<string, Etiqueta>();

    // ── Fase de patrones: cada uno UNA vez, con la subida RECONSIDERADA ─────
    //
    // ⭐ [RAPTOR, la regla de «coger un vehículo anterior»] al recorrer un patrón
    // no basta con subirse en la primera parada marcada: en cada parada hay que
    // volver a preguntarse si conviene subir **ahí**. En el RAPTOR de libro la
    // etiqueta es una HORA de llegada y subirse antes nunca empeora, así que la
    // pregunta se hace al revés —¿llego aquí antes de lo que llegaría el viaje
    // que traigo?—. Aquí la etiqueta es un COSTE y no hay horas: subirse antes
    // **cuesta más rodar**, así que la regla hay que traducirla.
    //
    // ⚠️ Y traducirla mal cuesta caro: hasta el 31/08 esto se subía en la
    // primera parada marcada y ahí se quedaba. En el caso del ojo eso significaba
    // **andar 478 m hasta Ramazzini** (índice 8 del patrón `29|1|1`) para coger la
    // misma línea, en la misma dirección, que pasaba por un poste **a 60 m**
    // (índice 10) — 418 m de más andando y 87 s de más rodando. Ver la entrada
    // del 31/08 de `docs/BITACORA.md`.
    //
    // La traducción es un **mínimo corrido**: si `acumulado[k]` son los segundos
    // de rodar desde el principio del patrón hasta `k`, el coste de llegar a `k`
    // subiéndose en cualquier `k' <= k` es
    //
    //     min_{k' <= k} ( coste[k'] + espera − acumulado[k'] )  +  acumulado[k]
    //
    // y ese mínimo se lleva en una variable mientras se recorre el patrón. Una
    // sola pasada, y la subida se reconsidera en **cada** parada.
    const yaVisto = new Set<string>();
    for (const parada of frontera) {
      for (const { patron } of indices.porParada.get(parada) ?? []) {
        if (yaVisto.has(patron.id)) {
          continue;
        }
        yaVisto.add(patron.id);
        const espera = esperaEstimada(patron, red, fecha, ahora);
        if (espera === null) {
          // Sin intervalo no se puede estimar la espera y no se inventa una.
          continue;
        }
        const acumulado = acumuladoDe(patron);

        /** El mejor «coste de ir montado, descontando lo ya rodado» visto hasta aquí. */
        let mejorSubida = Number.POSITIVE_INFINITY;
        let iSubida = -1;
        let subida: Etiqueta | null = null;

        for (let k = 0; k < patron.paradas.length; k++) {
          // ¿Conviene subir AQUÍ? Solo con etiqueta de la ronda anterior: subirse
          // dos veces en la misma ronda sería contar un vehículo de menos.
          const suya = mejor.get(patron.paradas[k]!);
          if (suya && suya.ronda === ronda - 1) {
            // ⭐ Aquí entran los dos pesos de la subida: el coste de usar un
            // vehículo y la espera con su peso 1.
            const candidato =
              suya.coste + COSTE_DE_SUBIR + PESO_DE_ESPERAR * espera - acumulado[k]!;
            if (candidato < mejorSubida) {
              mejorSubida = candidato;
              iSubida = k;
              subida = suya;
            }
          }
          // ¿Y bajarse aquí? Solo si nos hemos subido en alguna parada ANTERIOR.
          if (!subida || iSubida < 0 || k <= iSubida) {
            continue;
          }
          const destino = patron.paradas[k]!;
          if (p.suprimidas?.has(destino)) {
            // Ni sitio donde bajarse.
            continue;
          }
          const etiqueta: Etiqueta = {
            coste: mejorSubida + PESO_POR_MODO[patron.modo] * acumulado[k]!,
            tranvias: subida.tranvias + (patron.modo === 'tram' ? 1 : 0),
            como: {
              clase: 'montado',
              patron,
              desde: patron.paradas[iSubida]!,
              iDesde: iSubida,
              iHasta: k,
              espera,
              rodando: acumulado[k]! - acumulado[iSubida]!,
            },
            anterior: patron.paradas[iSubida]!,
            ronda,
          };
          const previa = nuevas.get(destino) ?? mejor.get(destino);
          if (!previa || esMejor(etiqueta, previa)) {
            nuevas.set(destino, etiqueta);
          }
        }
      }
    }

    // ── Fase de transbordos a pie ───────────────────────────────────────────
    for (const [parada, etiqueta] of [...nuevas]) {
      for (const { hasta, metros } of indices.aPie.get(parada) ?? []) {
        const aPie: Etiqueta = {
          coste: etiqueta.coste + pesoDeAndar(metros) + PENALIZACION_TRANSBORDO_S,
          tranvias: etiqueta.tranvias,
          como: { clase: 'aPie', desde: parada, metros },
          anterior: parada,
          ronda,
        };
        const previa = nuevas.get(hasta) ?? mejor.get(hasta);
        if (!previa || esMejor(aPie, previa)) {
          nuevas.set(hasta, aPie);
        }
      }
    }

    for (const [parada, etiqueta] of nuevas) {
      mejor.set(parada, etiqueta);
    }
    frontera = new Set(nuevas.keys());

    // ⭐ ¿SE LLEGA YA? Se apunta el mejor de ESTA ronda y **se sigue buscando**.
    //
    // ⚠️ Hasta el 31/08 aquí se devolvía la primera ronda que llegara, porque
    // «menos vehículos» era una llave absoluta. Ya no: la preferencia vive en
    // el `COSTE_DE_SUBIR`, así que una ronda más puede ganar — si ahorra más de
    // 600 de peso por cada vehículo que añade. [DOC OTP] *«no optimizamos por
    // menos transbordos: lleva a resultados absurdos»*.
    for (const [parada, metros] of alSalir) {
      const etiqueta = mejor.get(parada);
      if (!etiqueta || etiqueta.como.clase === 'acceso') {
        continue;
      }
      const coste = etiqueta.coste + pesoDeAndar(metros);
      if (!campeon || coste < campeon.coste) {
        campeon = { parada, metros, coste };
      }
    }
    if (frontera.size === 0) {
      // Una ronda que no mejoró nada no va a mejorar la siguiente.
      break;
    }
  }
  // El campeón se reconstruye desde `mejor`, que a estas alturas tiene la mejor
  // etiqueta de cada parada: si una ronda posterior mejoró esa parada, el
  // campeón se actualizó con ella en la vuelta correspondiente.
  return campeon ? reconstruir(mejor, campeon.parada, campeon.metros, p) : null;
}

/**
 * Deshace las etiquetas hasta el origen y arma el viaje en orden.
 *
 * ⚠️ **Y funde el paseo que no lleva a ningún vehículo.** RAPTOR hace su fase de
 * transbordos a pie después de cada ronda, sin saber todavía si esa ronda va a
 * ser la última. Cuando lo es, el último «transbordo» no lleva a subirse a
 * nada: es **el principio del paseo final**. Dejarlo como transbordo producía
 * dos tramos andando seguidos —470 m y luego 427— con **120 s de penalización
 * de cambio de vehículo metidos en medio sin cambiar de vehículo**. Se vio
 * mirando el caso del ojo, que para eso se mira.
 *
 * Lo mismo por el otro lado: un paseo antes del primer montado es acceso, no
 * transbordo.
 */
function reconstruir(
  mejor: Map<string, Etiqueta>,
  destino: string,
  metrosDeSalida: number,
  p: Peticion,
): Viaje | null {
  let metrosSalida = metrosDeSalida;
  // Dónde se baja de verdad del último vehículo: si detrás hubo paseo, no es
  // `destino`. Se va corrigiendo al deshacer la cadena.
  let paradaDeSalida = destino;
  const montados: TramoMontado[] = [];
  const transbordos: { desde: string; hasta: string; metros: number }[] = [];
  let acceso: Acceso | null = null;
  let aqui: string | null = destino;
  let coste = metrosSalida / VELOCIDAD_PEATON_MS;
  let tranvias = 0;
  let guardia = 0;

  while (aqui && guardia++ < 50) {
    const etiqueta: Etiqueta | undefined = mejor.get(aqui);
    if (!etiqueta) {
      return null;
    }
    if (etiqueta.como.clase === 'acceso') {
      acceso = { parada: aqui, metros: etiqueta.como.metros };
      coste += etiqueta.como.metros / VELOCIDAD_PEATON_MS;
      break;
    }
    if (etiqueta.como.clase === 'aPie') {
      if (montados.length === 0) {
        // Todavía no hemos visto ningún montado yendo hacia atrás: este paseo
        // está DESPUÉS del último vehículo, así que es salida y no transbordo.
        // Sus metros se suman al paseo final y **no lleva penalización**.
        metrosSalida += etiqueta.como.metros;
        coste += etiqueta.como.metros / VELOCIDAD_PEATON_MS;
        paradaDeSalida = etiqueta.como.desde;
      } else {
        transbordos.unshift({ desde: etiqueta.como.desde, hasta: aqui, metros: etiqueta.como.metros });
        coste += etiqueta.como.metros / VELOCIDAD_PEATON_MS + PENALIZACION_TRANSBORDO_S;
      }
    } else {
      const m = etiqueta.como;
      montados.unshift({
        patron: m.patron,
        desde: m.desde,
        hasta: aqui,
        iDesde: m.iDesde,
        iHasta: m.iHasta,
        espera: m.espera,
        rodando: m.rodando,
      });
      coste += m.espera + m.rodando;
      if (m.patron.modo === 'tram') {
        tranvias++;
      }
    }
    aqui = etiqueta.anterior;
  }
  if (!acceso || montados.length === 0) {
    return null;
  }
  return {
    accesoAndando: acceso,
    salidaAndando: { parada: paradaDeSalida, metros: metrosSalida },
    montados,
    transbordos,
    segundos: Math.round(coste),
    vehiculos: montados.length,
    tranvias,
  };
}

/** La línea del contrato, sacada de la cocinada. */
export function lineaDelViaje(red: RedDeBus, patron: PatronBus): LineaDelViaje {
  const l = red.lineas.find((x) => x.id === patron.linea);
  return {
    id: patron.linea,
    corto: l?.corto ?? patron.linea,
    largo: l?.largo ?? '',
    color: l?.color ?? '000000',
    colorTexto: l?.colorTexto ?? 'FFFFFF',
    modo: patron.modo,
  };
}

// ── LA COMPOSICIÓN: del viaje encontrado al trayecto del contrato ────────────

/** Metros en línea recta entre dos puntos. Bastan para medir un tramo montado. */
function metrosEntre(aLon: number, aLat: number, bLon: number, bLat: number): number {
  return Math.hypot((bLon - aLon) * 82500, (bLat - aLat) * 111320);
}

/**
 * ⭐ CÓMO SE DICE LO QUE SE VA A ESPERAR: **la frecuencia teórica, siempre**.
 *
 * `cada 8 min`. Es la cabecera `H` del patrón HOY —lo que la cocina ya calcula—
 * y es **el lenguaje del servicio**: [Google Transit Partners] los servicios de
 * frecuencia se describen por su *headway*, «pasan cada 5-15 minutos», no por
 * una espera concreta.
 *
 * ⚠️ **Y HASTA EL 2/09 ESTA FRASE TAMBIÉN DECÍA EL MINUTO VIVO** —`próximo en 5
 *    min (dato de las 18:32)`— cuando lo había. Ya no, y no es una pérdida:
 *    **es que se decía DOS VECES**. Desde el 1/09 el mismo minuto está en la
 *    región `role="status"` del botón «Próximo bus», tres palabras más a la
 *    derecha, y ahí es donde tiene que estar por una razón que la frase del
 *    paso no puede cumplir: **la región se refresca al pulsar y la frase no**.
 *    Con las dos, la primera pulsación dejaba la pantalla diciendo «próximo en
 *    5 min» en el paso y «próximo en 2 min» en la región, un minuto al lado del
 *    otro, y el viejo con la misma pinta de nuevo.
 *
 *    Así que el dato vivo tiene **una sola voz** —la región— y el paso se queda
 *    con lo que no caduca: cada cuánto pasa esa línea. No son el mismo dato.
 *
 * ⚠️ **Y esto es solo el TEXTO.** El reloj del viaje sigue usando el minuto
 * vivo cuando lo hay, y en su ausencia `E[W] = H/2` [Dial 1967 · Clerq 1972 ·
 * Wirasinghe 1980], que es la espera media de quien llega al azar. Decir «cada
 * 8 min» y sumar 4 no es una contradicción: son dos preguntas distintas —cada
 * cuánto pasa, y cuánto se espera de media—.
 *
 * ⚠️ Y la convención alternativa queda citada y **no aplicada**: [Google
 * Transit] para un servicio de frecuencia, tomar la cabecera **entera** como
 * espera de peor caso. Duplicaría los tiempos de todos los viajes; si algún día
 * se quiere el peor caso en vez de la media, el sitio es `esperaEstimada`.
 *
 * `null` cuando no hay intervalo: mejor callar que inventar.
 */
function comoSeEspera(intervalo: number | null): string | null {
  return intervalo === null ? null : `frecuencia teórica: cada ${Math.round(intervalo / 60)} min`;
}

/**
 * ⭐ CUÁNTAS PARADAS SE VA DENTRO, dicho como lo dice todo el mundo.
 *
 * [Google Directions API, `transit_details.num_stops`] *«el número de paradas
 * de este paso; incluye la de llegada, pero no la de salida»* — su ejemplo
 * literal: se sale de A, se pasa por B y por C, se llega a D, **son 3**. Sobre
 * el patrón de hoy eso es exactamente `iHasta − iDesde`.
 *
 * ⚠️ Y es propiedad **del paso de transporte**, no del viaje: cada vehículo
 * cuenta las suyas. Por eso lo dicen tanto el `sube` como el `transborda`, y en
 * el segundo son las del que se COGE.
 *
 * `null` si no hay ninguna que contar: no se escribe «0 paradas».
 */
function comoSeCuentan(paradas: number): string | null {
  if (paradas <= 0) {
    return null;
  }
  return paradas === 1 ? '1 parada' : `${paradas} paradas`;
}

/**
 * ⭐ EL PASO DE SUBIR.
 *
 * `aQuien` es a quién le pregunta el botón «Próximo bus» por este vehículo, y
 * es `null` cuando no hay fuente —el tranvía—: sin eso la pantalla no pinta el
 * botón, que es como se evita un botón que solo pueda contestar «no lo sé».
 */
export function pasoDeSubir(
  linea: LineaDelViaje,
  poste: string,
  paradas: number,
  intervalo: number | null,
  vivo?: EstadoVivo | null,
  aQuien?: AQuienPreguntar | null,
): Paso {
  const partes = [
    { papel: 'accion' as const, texto: 'Sube' },
    { papel: 'texto' as const, texto: ' a la línea ' },
    { papel: 'via' as const, texto: linea.corto },
    { papel: 'texto' as const, texto: ' en el poste ' },
    { papel: 'via' as const, texto: poste },
  ];
  // Primero cuánto se va dentro, después cada cuánto pasa: la cuenta es fija
  // y la espera es la parte que el dato vivo sustituye, así que cierra la frase.
  const cuantas = comoSeCuentan(paradas);
  if (cuantas !== null) {
    partes.push({ papel: 'texto' as const, texto: ` — ${cuantas}` });
  }
  const espera = comoSeEspera(intervalo);
  if (espera !== null) {
    partes.push({ papel: 'texto' as const, texto: ` — ${espera}` });
  }
  return {
    giro: 'sube',
    texto: partes.map((x) => x.texto).join(''),
    metros: 0,
    partes,
    ...conElVivoDelGenerar(aQuien, vivo, linea.corto),
  };
}

/**
 * Los dos campos que el paso lleva **para el botón**: a quién preguntar y lo
 * que el Generar ya trajo.
 *
 * ⚠️ Van juntos porque se deciden juntos: sin `aQuien` no hay botón, y sin
 *    botón no hay región donde poner el dato. Y ninguno de los dos se escribe
 *    cuando no lo hay — `undefined` no viaja en el JSON, así que un paso de
 *    tranvía sale del motor exactamente igual que antes de existir esto.
 */
function conElVivoDelGenerar(
  aQuien: AQuienPreguntar | null | undefined,
  vivo: EstadoVivo | null | undefined,
  corto: string,
): { aQuienPreguntar?: AQuienPreguntar; vivo?: PosteVivo } {
  if (!aQuien) {
    return {};
  }
  const dicho = vivo ? comoSeDiceLoVivo(vivo, corto, ESTE_POSTE) : null;
  return { aQuienPreguntar: aQuien, ...(dicho ? { vivo: dicho } : {}) };
}

/**
 * ⭐ EL TRANSBORDO EN EL MISMO POSTE: **un acto, un paso**.
 *
 * [Referencia GTFS, `transfers.txt`] el transbordo es un elemento de primera
 * clase entre dos rutas en una parada —*«recommended transfer point between
 * routes»*— y en la misma parada `from_stop_id = to_stop_id`. Así que se narra
 * como lo que es y no como tres cosas: hasta el 31/08 esto salía en pantalla
 * como **«Baja» · «es el mismo portal del que sales» · «Sube»**, tres pasos y
 * un paseo de cero metros para decir *cámbiate de autobús aquí*.
 *
 * ⚠️ Con paseo entre dos postes distintos **no** es esto: ahí sí se baja, se
 * anda y se sube, y son tres pasos porque son tres cosas.
 *
 * La redacción es de casa [PROPIO]: la GTFS da el concepto, no las palabras.
 */
export function pasoDeTransbordo(
  poste: string,
  deLa: LineaDelViaje,
  aLa: LineaDelViaje,
  paradas: number,
  intervalo: number | null,
  vivo?: EstadoVivo | null,
  aQuien?: AQuienPreguntar | null,
): Paso {
  const partes = [
    { papel: 'texto' as const, texto: 'En el poste ' },
    { papel: 'via' as const, texto: poste },
    { papel: 'accion' as const, texto: ', transborda' },
    { papel: 'texto' as const, texto: ' de la línea ' },
    { papel: 'via' as const, texto: deLa.corto },
    { papel: 'texto' as const, texto: ' a la línea ' },
    { papel: 'via' as const, texto: aLa.corto },
  ];
  // Las paradas que se cuentan son las del vehículo que se COGE, igual que la
  // frecuencia: el que se deja ya se ha ido y su cuenta la dijo su propio paso.
  const cuantas = comoSeCuentan(paradas);
  if (cuantas !== null) {
    partes.push({ papel: 'texto' as const, texto: ` — ${cuantas}` });
  }
  const espera = comoSeEspera(intervalo);
  if (espera !== null) {
    // La frecuencia que importa es la del que se coge, no la del que se deja.
    partes.push({
      papel: 'texto' as const,
      texto: ` — ${espera.replace('frecuencia teórica:', `frecuencia teórica de la ${aLa.corto}:`)}`,
    });
  }
  return {
    giro: 'transborda',
    texto: partes.map((x) => x.texto).join(''),
    metros: 0,
    partes,
    // La línea por la que se pregunta es la que se COGE, igual que la
    // frecuencia y que las paradas: la que se deja ya se ha ido.
    ...conElVivoDelGenerar(aQuien, vivo, aLa.corto),
  };
}

export function pasoDeBajar(poste: string): Paso {
  const partes = [
    { papel: 'accion' as const, texto: 'Baja' },
    { papel: 'texto' as const, texto: ' en el poste ' },
    { papel: 'via' as const, texto: poste },
  ];
  return { giro: 'baja', texto: partes.map((x) => x.texto).join(''), metros: 0, partes };
}

/**
 * ⭐ LA ETAPA MONTADA: el trecho que se va dentro del vehículo.
 *
 * ⭐ **Su geometría es la del ASFALTO** desde la casilla 4 (31/08): la
 * concatenación de las trazas de sus saltos, que la cocina corta de `shapes.txt`
 * proyectando cada parada sobre la traza [DOC OTP, `TripPattern`: la geometría
 * de un patrón es la concatenación de las de sus saltos]. Hasta ayer era una
 * recta de poste a poste, que se pintaba cortando esquinas por encima de las
 * manzanas. Y los metros son los de esa traza, no los de la cuerda.
 *
 * ⚠️ **Y la geometría empieza y acaba en el POSTE, no en la traza.** Una parada
 * está hasta 40 m fuera del asfalto por el que pasa su autobús —medido: mediana
 * 5,4 m, la peor 40,9—, así que si el tramo montado empezara en el pie de la
 * proyección, la línea a pie acabaría en el poste y la del bus arrancaría unos
 * metros más allá: un hueco a la vista. Se cosen con ese trocito, que es lo que
 * de verdad hay entre el poste y la calzada. **No suma metros**: los que se
 * dicen son los del asfalto, y lo andado hasta el poste ya lo contó su etapa.
 */
/** Cómo se monta este vehículo, y cómo se sale de él. */
export interface ComoSeMonta {
  /** `E[W] = H/2`: lo que suma al RELOJ. */
  readonly espera: number | null;
  /** `H`, la cabecera de hoy: lo que se DICE. Ver `comoSeEspera`. */
  readonly intervalo: number | null;
  /** Lo que Avanza diga, si se sabe. Solo del primer vehículo. */
  readonly vivo?: EstadoVivo | null;
  /** Si se llega a él **transbordando en el mismo poste**, de qué línea. */
  readonly transbordandoDe?: LineaDelViaje;
  /** Si se sale de él transbordando en el mismo poste: entonces no hay «Baja». */
  readonly acabaEnTransbordo?: boolean;
}

export function etapaMontada(red: RedDeBus, montado: TramoMontado, como: ComoSeMonta): Etapa {
  const { espera, intervalo, vivo } = como;
  const porId = new Map(red.paradas.map((p) => [p.id, p]));
  const linea = lineaDelViaje(red, montado.patron);
  const primera = porId.get(montado.patron.paradas[montado.iDesde]!);
  const ultima = porId.get(montado.patron.paradas[montado.iHasta]!);
  const geometria: Vertice[] = primera ? [[primera.lat, primera.lon]] : [];
  let metros = 0;
  for (let k = montado.iDesde; k < montado.iHasta; k++) {
    const salto = montado.patron.saltos[k];
    if (!salto) {
      continue;
    }
    // La costura entre saltos es el MISMO punto en los dos, así que el primero
    // de cada uno se descarta —salvo que el anterior no dejara nada—.
    for (const punto of salto.traza) {
      const antes = geometria[geometria.length - 1];
      if (!antes || antes[0] !== punto[0] || antes[1] !== punto[1]) {
        geometria.push(punto);
      }
    }
    metros += salto.metros;
  }
  if (ultima) {
    const antes = geometria[geometria.length - 1];
    if (!antes || antes[0] !== ultima.lat || antes[1] !== ultima.lon) {
      geometria.push([ultima.lat, ultima.lon]);
    }
  }
  // ⭐ Y EL TOTAL USA EL MINUTO VIVO cuando lo hay. Enseñar «próximo en 5 min»
  // en la región y seguir sumando los 4,5 de la estimación dejaría la pantalla
  // diciendo una cosa y la cabecera otra — y quien lee se fía de la cabecera.
  //
  // ⚠️ Desde el 2/09 el minuto ya **no está en la frase del paso** —está solo
  //    en la región del botón—, pero sigue estando aquí: lo que se quitó fue la
  //    repetición del texto, no el dato. El reloj nunca lo dijo dos veces.
  // ⚠️ Y los 120 s del transbordo [OTP `transferSlack`] se suman AQUÍ cuando se
  // llega transbordando en el mismo poste: antes vivían en la etapa a pie de
  // cero metros, que ha dejado de existir. El total del viaje no se mueve.
  const segundos =
    (vivo?.clase === 'llega' ? vivo.minutos * 60 : (espera ?? 0)) +
    montado.rodando +
    (como.transbordandoDe ? PENALIZACION_TRANSBORDO_S : 0);
  /**
   * ⭐ EL POSTE SE NOMBRA CON SU NÚMERO [referencia GTFS, `stop_code`: el de la
   * señal y los sistemas de información]. Ver `nombrarPoste` en `avanza.ts`: un
   * solo sitio decide el formato, para que la subida, el transbordo, la bajada
   * y los avisos digan el poste **igual**.
   */
  const comoSeLlama = (id: string): string => {
    const suya = porId.get(id);
    return suya ? nombrarPoste(suya.codigo, suya.nombre) : id;
  };
  const dondeSube = comoSeLlama(montado.desde);
  /**
   * ⭐ A QUIÉN LE PREGUNTA EL BOTÓN por este vehículo, o `null` si a nadie.
   *
   * El número sale del `stop_code` por `posteDeCodigo`, que es el mismo camino
   * por el que el Generar decide a quién preguntar: si de aquí sale `null` —el
   * tranvía— tampoco había a quién preguntar entonces. Un solo sitio decide qué
   * postes cubre Avanza, y por eso el botón y el Generar no se pueden desalinear.
   */
  const suPoste = porId.get(montado.desde);
  const numero = suPoste ? posteDeCodigo(suPoste.codigo) : null;
  const aQuien: AQuienPreguntar | null =
    numero === null ? null : { poste: numero, linea: linea.corto };
  // ⭐ Las paradas de ESTE vehículo, sobre el patrón que recorre HOY: si la
  // línea va desviada, el patrón es el operativo y la cuenta sale de él, así
  // que las paradas que se dicen son las que de verdad se van a pasar.
  const paradas = montado.iHasta - montado.iDesde;
  return {
    pasos: [
      como.transbordandoDe
        ? pasoDeTransbordo(
            dondeSube,
            como.transbordandoDe,
            linea,
            paradas,
            intervalo,
            vivo,
            aQuien,
          )
        : pasoDeSubir(linea, dondeSube, paradas, intervalo, vivo, aQuien),
      // Si de aquí se transborda en el mismo poste, el «Baja» lo dice el paso
      // de transbordo del siguiente: no se baja para volver a subir.
      ...(como.acabaEnTransbordo
        ? []
        : [pasoDeBajar(comoSeLlama(montado.hasta))]),
    ],
    geometria,
    metros,
    segundos,
    tramos: [
      {
        comoSeVa: 'montado',
        desde: 0,
        hasta: Math.max(0, geometria.length - 1),
        metros,
        segundos,
        linea,
      },
    ],
    // Si acaba en transbordo, el icono del poste es el de subirse al siguiente.
    hito: como.acabaEnTransbordo ? 'sube' : 'baja',
  };
}

/**
 * ⭐ LOS POSTES A LOS QUE SE LLEGA ANDANDO, con sus metros de verdad.
 *
 * Dos filtros y ninguno es un veto de modo:
 *
 *   1. **Los 40 más cercanos en recta** —`POSTES_CANDIDATOS`—, que es el tope
 *      de rendimiento: la recta es gratis y el Dijkstra no.
 *   2. **Los que caen dentro de `TOPE_DE_ACCESO_S` andando de verdad.**
 *
 * Quien decide cuál se usa no es esto: es el coste, con `PESO_DE_ANDAR`.
 */
export function postesCerca(
  red: RedDeBus,
  andar: AndarEntre,
  lon: number,
  lat: number,
  /** Los postes por los que hoy no se pasa: no valen ni de acceso ni de salida. */
  suprimidas?: ReadonlySet<string>,
): Acceso[] {
  const tope = TOPE_DE_ACCESO_S * VELOCIDAD_PEATON_MS;
  const candidatos = red.paradas
    .map((p) => ({ p, recta: metrosEntre(lon, lat, p.lon, p.lat) }))
    .filter((x) => x.recta <= tope)
    .sort((a, b) => a.recta - b.recta)
    .slice(0, POSTES_CANDIDATOS);

  const salida: Acceso[] = [];
  for (const { p } of candidatos) {
    if (suprimidas?.has(p.id)) {
      continue;
    }
    const m = andar(lon, lat, p.lon, p.lat);
    if (m !== null && m <= tope) {
      salida.push({ parada: p.id, metros: Math.round(m) });
    }
  }
  return salida;
}

/**
 * ⭐ A QUÉ POSTE SE PREGUNTA EN EL GENERAR: **al primero, y a ninguno más** (1/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  Hasta hoy se preguntaba a **todos** los postes de subida, con este
 *  argumento: que la línea 42 no esté pasando ahora es un hecho de la calle
 *  aunque hasta su poste falten cuarenta minutos. **Y era media razón.**
 *
 *  La regla de casa —la de la 3b— dice que **el dato vivo sustituye la espera
 *  del PRIMER vehículo**: «próximo en 3 min» en un poste al que se llega dentro
 *  de cuarenta minutos es un número cierto sobre un autobús que no se va a
 *  coger. De los demás nunca se dijo el minuto, así que consultarlos solo
 *  producía **avisos** — y un aviso de que la 30 «no anuncia ningún próximo»
 *  en un poste al que faltan cuarenta minutos no es una noticia: es ruido en
 *  la cabecera, justo encima de lo que sí hay que leer.
 *
 *  Y cuesta. Cada poste son hasta **8,4 s** medidos —4.000 ms de tope, 300 de
 *  espera y otros 4.000 del reintento— dentro del Generar, que es donde [NN/g]
 *  pone el límite de la atención en 10 s.
 *
 *  Lo que quiera saberse de los demás postes se pide **a petición**, con su
 *  botón, cuando quien mira lo quiere: `GET /api/poste-vivo`. Es la misma
 *  regla del BiZi —frescura por petición— aplicada al bus.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El tranvía sale de aquí como `sinFuente` y no como `mudo`: su `stop_code` no
 * es de los que Avanza entiende, así que no es que no lo sepamos — es que no
 * hay a quién preguntar, y eso no se avisa.
 */
export async function preguntarPorLaPrimeraSubida(
  red: RedDeBus,
  montados: readonly TramoMontado[],
  pedir: typeof fetch = fetch,
): Promise<EstadoVivo> {
  const primero = montados[0];
  if (!primero) {
    return { clase: 'sinFuente' };
  }
  const parada = new Map(red.paradas.map((p) => [p.id, p])).get(primero.desde);
  const poste = parada ? posteDeCodigo(parada.codigo) : null;
  if (poste === null) {
    return { clase: 'sinFuente' };
  }
  const corto = lineaDelViaje(red, primero.patron).corto;
  return estadoVivoDe(await llegadasDelPoste(poste, pedir), corto);
}

/**
 * ⭐ UN VIAJE YA BUSCADO, listo para componerse **con o sin** lo que diga la calle.
 *
 * Las dos formas salen de la MISMA búsqueda: buscar es lo caro —170 patrones,
 * tres rondas— y componer es barato. Por eso esto no es un `async` que se coma
 * la cadena entera: `trayecto()` es lo de siempre, síncrono y sin red, y
 * `conElVivo()` es lo mismo después de preguntar. La muralla del peatón no se
 * entera de que existe una API.
 *
 * `conElVivo` es `null` cuando no hay viaje que enriquecer.
 */
export interface ViajeEnBusPreparado {
  /** El trayecto con la espera del horario publicado. Es lo que sale si nadie pregunta. */
  readonly trayecto: () => Trayecto;
  /** El mismo viaje, con lo que Avanza diga de sus postes de subida. */
  readonly conElVivo: ((pedir?: typeof fetch) => Promise<Trayecto>) | null;
}

/**
 * ⭐ EL VIAJE EN BUS O TRANVÍA, entero: de los dos extremos al `Trayecto`.
 *
 * Y cuando no hay viaje **se dice por qué**, con la cifra delante: sin postes
 * cerca es una cosa, sin servicio hoy es otra, y no encontrar combinación es una
 * tercera. Un «no hay ruta» a secas obliga a adivinar cuál de las tres.
 */
export function prepararViajeEnBus(
  motor: Motor,
  red: RedDeBus,
  origen: Extremo,
  destino: Extremo,
  fecha: string,
  /** Lo que la ruta operativa de hoy dice, si se sabe. Ver `patron-operativo.ts`. */
  desvios?: {
    readonly suprimidas: ReadonlySet<string>;
    /** Los avisos, cada uno con la línea Y LA DIRECCIÓN a la que pertenece. */
    readonly avisos: readonly {
      readonly linea: string;
      readonly direccion: string;
      readonly texto: string;
    }[];
  },
  /**
   * ⭐ LA HORA, en segundos del día de servicio (6/09). `null` = sin reloj, que
   * es la conducta de antes y la que compran las jueces que no lo pasan. Quien
   * lo trae de producción es `porModo` con el `cuando` que ya recibía. Va al
   * final **a propósito**: así ninguna llamada de antes cambia de significado.
   */
  ahora: number | null = null,
): ViajeEnBusPreparado {
  /** Un trayecto sin ruta, con el motivo delante. */
  const sinViaje = (texto: string): ViajeEnBusPreparado => ({
    trayecto: () => juntar({ modo: 'bus', avisos: [{ texto }] }, []),
    conElVivo: null,
  });
  const andar: AndarEntre = (aLon, aLat, bLon, bLat) => {
    const eo = enganchar(motor.red, motor.rejilla, aLon, aLat);
    const ed = enganchar(motor.red, motor.rejilla, bLon, bLat);
    if (!eo || !ed) {
      return null;
    }
    const r = calcularRuta(motor.red, motor.cuaderno, eo, [aLon, aLat], ed, [bLon, bLat]);
    return r ? r.metros : null;
  };

  const acceso = postesCerca(red, andar, origen.lon, origen.lat, desvios?.suprimidas);
  const salida = postesCerca(red, andar, destino.lon, destino.lat, desvios?.suprimidas);
  const aPie = andar(origen.lon, origen.lat, destino.lon, destino.lat);
  const enKm = aPie === null ? null : (aPie / 1000).toFixed(1).replace('.', ',');

  if (acceso.length === 0 || salida.length === 0) {
    const cual = acceso.length === 0 ? 'el origen' : 'el destino';
    return sinViaje(
      `No hay ningún poste de bus ni de tranvía a menos de ` +
        `${Math.round(TOPE_DE_ACCESO_S / 60)} minutos andando de ${cual}` +
        (enKm ? `: andando son ${enKm} km.` : '.'),
    );
  }

  const viaje = buscarViaje({ red, fecha, ahora, acceso, salida, suprimidas: desvios?.suprimidas });
  if (!viaje) {
    const hoy = red.patrones.some((p) => operaEl(red, p, fecha));
    return sinViaje(
      hoy
        ? `Sin bus razonable entre esos dos puntos${enKm ? `: andando son ${enKm} km.` : '.'}`
        : 'Ese día el horario publicado no tiene servicio: el feed del operador no llega hasta ahí.',
    );
  }

  const porId = new Map(red.paradas.map((x) => [x.id, x]));
  const comoExtremo = (id: string): Extremo => {
    const p = porId.get(id)!;
    return { lon: p.lon, lat: p.lat, nombre: p.nombre };
  };
  /**
   * El poste, con su número, igual que en los hitos. Ver `nombrarPoste`: si el
   * paso dice «poste 33 · Av. Academia» y el aviso dijera solo «Av. Academia»,
   * nadie los casaría de un vistazo — y la regla del doble sitio [GOV.UK] pide
   * exactamente que digan lo mismo.
   */
  const nombreDelPoste = (id: string): string => {
    const suya = porId.get(id);
    return suya ? nombrarPoste(suya.codigo, suya.nombre) : id;
  };

  /**
   * ⭐ LOS AVISOS DE LO VIVO, y **cada uno nombra su poste**.
   *
   * No es adorno: es lo que permite ponerlo al lado de SU hito y no de otro
   * [GOV.UK, resumen arriba **y** mensaje junto a lo afectado, con el mismo
   * texto]. Un «la línea no está pasando» genérico, con dos transbordos en la
   * lista, obliga a adivinar de cuál habla — y *«general errors are not
   * helpful»*.
   */
  const avisosDeLoVivo = (vivo: EstadoVivo): Aviso[] => {
    // ⚠️ **Un solo vehículo: el primero.** Es a quien se le pregunta, y por eso
    //    es el único que puede tener aviso. Hasta el 1/09 esto recorría todos
    //    los montados y fabricaba un aviso por cada uno; los de los demás
    //    hablaban de postes a los que faltaban cuarenta minutos. Ver
    //    `preguntarPorLaPrimeraSubida`.
    const m = viaje.montados[0];
    if (!m) {
      return [];
    }
    const corto = lineaDelViaje(red, m.patron).corto;
    // ⚠️ **El poste va NOMBRADO** aquí, y no «este poste». Este aviso vive en la
    //    cabecera, lejos de los pasos: sin el nombre habría que adivinar de cuál
    //    habla [GOV.UK, *«general errors are not helpful»*]. La respuesta del
    //    endpoint, que se pinta DENTRO del paso, dice «este» — y las dos frases
    //    salen del mismo sitio, `comoSeDiceLoVivo`, cambiando solo eso.
    const dicho = comoSeDiceLoVivo(vivo, corto, `el poste ${nombreDelPoste(m.desde)}`);
    // `llega` no es un aviso: es la buena noticia, y ya la dice el paso.
    return dicho && dicho.clase !== 'llega' ? [{ texto: dicho.texto }] : [];
  };

  /**
   * Compone el viaje. Con `vivo` a `null` sale la versión del horario.
   *
   * ⚠️ **El dato vivo es el del PRIMER vehículo, y solo suyo.** Para los
   * siguientes se dice `~H/2`, y no es pereza: «próximo en 3 min» en un poste
   * al que se llega dentro de cuarenta minutos es un número cierto sobre un
   * autobús que no se va a coger. Desde el 1/09 **tampoco se les pregunta**:
   * lo suyo se pide a petición con `GET /api/poste-vivo`.
   */
  const componer = (loVivo: EstadoVivo | null): Trayecto => {
    // ⭐ EL AVISO DEL DESVÍO va PRIMERO: condiciona todo lo que se lee debajo,
    // y solo se escribe el de las líneas que este viaje usa — avisar de la 38
    // en un viaje que va en la 29 sería ruido.
    // ⚠️ Por línea **Y DIRECCIÓN**: una línea puede ir desviada en los dos
    // sentidos con dos desvíos distintos, y meter el del sentido contrario es
    // ruido — nombra paradas por las que este viaje no pasa.
    const usadas = new Set(
      viaje.montados.map((m) => `${lineaDelViaje(red, m.patron).corto}|${m.patron.direccion}`),
    );
    const delDesvio = (desvios?.avisos ?? []).filter((a) =>
      usadas.has(`${a.linea}|${a.direccion}`),
    );
    const cabecera = {
      modo: 'bus' as const,
      avisos: [
        ...delDesvio.map((a) => ({ texto: a.texto })),
        ...(loVivo ? avisosDeLoVivo(loVivo) : []),
      ],
    };
    const perdido = (texto: string): Trayecto => juntar({ modo: 'bus', avisos: [{ texto }] }, []);

    const etapas: Etapa[] = [];
    const primera = etapaAndando(motor, origen, comoExtremo(viaje.montados[0]!.desde));
    if (!primera) {
      return perdido('No hay camino a pie hasta el poste donde habría que subir.');
    }
    etapas.push({ ...primera, hito: 'sube' });

    for (let i = 0; i < viaje.montados.length; i++) {
      const m = viaje.montados[i]!;
      const anterior = viaje.montados[i - 1];
      const siguiente = viaje.montados[i + 1];
      // ⭐ ¿Se cambia de vehículo SIN MOVERSE? Entonces es un solo acto, y ni
      // hay etapa a pie ni hay «Baja» y «Sube» [GTFS `transfers.txt`].
      const llegaTransbordando = anterior !== undefined && anterior.hasta === m.desde;
      const saleTransbordando = siguiente !== undefined && m.hasta === siguiente.desde;
      etapas.push(
        etapaMontada(red, m, {
          espera: esperaEstimada(m.patron, red, fecha, ahora),
          intervalo: intervaloDeHoy(m.patron, red, fecha),
          vivo: i === 0 ? loVivo : null,
          ...(llegaTransbordando ? { transbordandoDe: lineaDelViaje(red, anterior.patron) } : {}),
          acabaEnTransbordo: saleTransbordando,
        }),
      );
      if (siguiente && !saleTransbordando) {
        const aPieEntre = etapaAndando(motor, comoExtremo(m.hasta), comoExtremo(siguiente.desde));
        if (!aPieEntre) {
          return perdido('No hay camino a pie para el transbordo que hacía falta.');
        }
        // ⚠️ Los 120 s del transbordo [OTP] se suman AQUÍ, sobre lo que cuesta
        // andarlo: son el rato de bajarse, orientarse y esperar a que el de
        // enfrente abra la puerta, y no dependen de la distancia.
        etapas.push({
          ...aPieEntre,
          segundos: aPieEntre.segundos + PENALIZACION_TRANSBORDO_S,
          tramos: aPieEntre.tramos.map((t) => ({
            ...t,
            segundos: t.segundos + PENALIZACION_TRANSBORDO_S,
          })),
          hito: 'sube',
        });
      }
    }

    const ultima = etapaAndando(motor, comoExtremo(viaje.salidaAndando.parada), destino);
    if (!ultima) {
      return perdido('No hay camino a pie desde el último poste hasta el destino.');
    }
    etapas.push(ultima);

    return conElAvisoDelFestivo(juntar(cabecera, etapas), red, viaje.montados, fecha);
  };

  return {
    trayecto: () => componer(null),
    conElVivo: async (pedir: typeof fetch = fetch) =>
      componer(await preguntarPorLaPrimeraSubida(red, viaje.montados, pedir)),
  };
}

/**
 * ⭐ EL AVISO DEL FESTIVO, y en los DOS SITIOS.
 *
 * Arriba con los demás, y **colgado del paso en el que se sube a esa línea**
 * [GOV.UK: el aviso al lado de lo que afecta, y también en la cabecera]. Es el
 * mismo trato que el desvío y que la Zona de Bajas Emisiones.
 *
 * ⚠️ **Y dice la fuente.** Un horario que no viene del feed no puede
 *    presentarse como si viniera: la casa ya lo hace con la DGT y con el minuto
 *    vivo, y aquí pesa más todavía —porque el feed dice que esta línea hoy no
 *    circula, y la pantalla va a decir lo contrario—.
 *
 * El anclaje del paso es `a la línea X ` con el espacio detrás, que sirve para
 * los dos textos que suben a un vehículo —«Sube **a la línea 35 en** el
 * poste…» y «…transborda de la línea 29 **a la línea Ci1 ·**…»— y no
 * confunde la 3 con la 35.
 */
function conElAvisoDelFestivo(
  trayecto: Trayecto,
  red: RedDeBus,
  montados: readonly { readonly patron: PatronBus }[],
  fecha: string,
): Trayecto {
  const nuevos: Aviso[] = [];
  const yaDicho = new Set<string>();
  for (const m of montados) {
    const corto = lineaDelViaje(red, m.patron).corto;
    const clave = `${corto}|${m.patron.direccion}`;
    if (yaDicho.has(clave)) {
      continue;
    }
    yaDicho.add(clave);
    // ⚠️ **Solo si la capa ha suplido de verdad.** Tener el cuadro en la
    //    caché no basta: si el feed trae el servicio de ese día, el horario
    //    que se está usando es el del feed y decir que sale de la web sería
    //    mentira. Lo cazó la juez 4 —el viaje del lunes no cambiaba ni un
    //    metro y le salía un aviso de la nada—.
    if (operaEl(red, m.patron, fecha)) {
      continue;
    }
    const suyo = cuadroServido(corto, m.patron.direccion, fecha);
    if (!suyo) {
      continue;
    }
    const paso = trayecto.pasos.findIndex(
      (p) =>
        (p.giro === 'sube' || p.giro === 'transborda') && p.texto.includes(`a la línea ${corto} `),
    );
    nuevos.push(
      paso >= 0
        ? { texto: avisoDelFestivo(suyo), paso }
        : { texto: avisoDelFestivo(suyo) },
    );
  }
  return nuevos.length === 0
    ? trayecto
    : { ...trayecto, avisos: [...trayecto.avisos, ...nuevos] };
}

/**
 * El viaje en bus **sin preguntar a nadie**: el del horario publicado.
 *
 * Es la puerta síncrona, la que usa `calcularTrayecto` y la que usan las
 * jueces que no quieren saber nada de una API. Ver `prepararViajeEnBus`.
 */
export function viajeEnBus(
  motor: Motor,
  red: RedDeBus,
  origen: Extremo,
  destino: Extremo,
  fecha: string,
  /** Segundos del día de servicio, o `null` para buscar sin reloj. */
  ahora: number | null = null,
): Trayecto {
  return prepararViajeEnBus(motor, red, origen, destino, fecha, undefined, ahora).trayecto();
}
