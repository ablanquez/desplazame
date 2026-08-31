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
import type { LineaDelViaje, Paso, Vertice } from '@desplazame/tipos';
import type { Aviso, Trayecto } from '@desplazame/tipos';
import { alMinuto, etapaAndando, juntar, type Etapa, type Extremo } from './etapas.ts';
import {
  estadoVivoDe,
  llegadasDelPoste,
  posteDeCodigo,
  type EstadoVivo,
} from './avanza.ts';
import { enganchar } from './proyeccion.ts';
import { calcularRuta } from './ruta.ts';
import type { Motor } from './trayecto.ts';
import type { AndarEntre } from './red-bus.ts';
import { operaEl, type ModoDeRed, type PatronBus, type RedDeBus } from './red-bus.ts';

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

/**
 * ⭐ EL INTERVALO DE HOY de un patrón, en segundos. `null` si hoy no opera o si
 * hoy solo hace un viaje —con un solo viaje no hay intervalo que promediar—.
 */
export function intervaloDeHoy(patron: PatronBus, red: RedDeBus, fecha: string): number | null {
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
    return null;
  }
  // La franja va de la primera salida a la última: entre N salidas hay N−1
  // huecos, y dividir por N daría un intervalo más corto del que hay.
  return (ultima - primera) / (viajes - 1);
}

/**
 * La espera estimada en un patrón hoy: `H/2`.
 *
 * Sin intervalo que calcular —un solo viaje, o ninguno— se devuelve `null` y
 * quien llame decide. **No se inventa una espera por defecto**: decir «~10 min»
 * sobre un patrón que hace un viaje al día sería una cifra fabricada.
 */
export function esperaEstimada(patron: PatronBus, red: RedDeBus, fecha: string): number | null {
  const h = intervaloDeHoy(patron, red, fecha);
  return h === null ? null : Math.round(h / 2);
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

export function indexar(red: RedDeBus, fecha: string, suprimidas?: ReadonlySet<string>): Indices {
  const porParada = new Map<string, { patron: PatronBus; i: number }[]>();
  for (const patron of red.patrones) {
    // ⭐ Solo lo que OPERA HOY. Un patrón que no circula no es una opción, y
    // meterlo en la búsqueda sería ofrecer un bus que no existe.
    if (!operaEl(red, patron, fecha)) {
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
  const indices = indexar(red, fecha, p.suprimidas);

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
        const espera = esperaEstimada(patron, red, fecha);
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
 * ⭐ CÓMO SE DICE LO QUE SE VA A ESPERAR, y son dos cosas distintas.
 *
 * · Con **dato vivo**: `próximo en 5 min (dato de las 18:32)`. Lo real desplaza
 *   a lo programado [GTFS-Realtime], y va con su hora porque un «en 5 min» sin
 *   fecha envejece sin que se note.
 * · Sin él: **la frecuencia teórica**, `cada 8 min`. Es la cabecera `H` del
 *   patrón HOY —lo que la cocina ya calcula— y es **el lenguaje del servicio**:
 *   [Google Transit Partners] los servicios de frecuencia se describen por su
 *   *headway*, «pasan cada 5-15 minutos», no por una espera concreta.
 *
 * ⚠️ **Y esto es solo el TEXTO.** El reloj del viaje sigue sumando `E[W] = H/2`
 * [Dial 1967 · Clerq 1972 · Wirasinghe 1980], que es la espera media de quien
 * llega al azar. Decir «cada 8 min» y sumar 4 no es una contradicción: son dos
 * preguntas distintas —cada cuánto pasa, y cuánto se espera de media—.
 *
 * ⚠️ Y la convención alternativa queda citada y **no aplicada**: [Google
 * Transit] para un servicio de frecuencia, tomar la cabecera **entera** como
 * espera de peor caso. Duplicaría los tiempos de todos los viajes; si algún día
 * se quiere el peor caso en vez de la media, el sitio es `esperaEstimada`.
 *
 * `null` cuando no hay ni una cosa ni la otra: mejor callar que inventar.
 */
function comoSeEspera(intervalo: number | null, vivo?: EstadoVivo | null): string | null {
  if (vivo?.clase === 'llega') {
    return `próximo en ${vivo.minutos} min (dato de las ${alMinuto(vivo.cuando)})`;
  }
  return intervalo === null ? null : `frecuencia teórica: cada ${Math.round(intervalo / 60)} min`;
}

/** ⭐ EL PASO DE SUBIR. */
export function pasoDeSubir(
  linea: LineaDelViaje,
  poste: string,
  intervalo: number | null,
  vivo?: EstadoVivo | null,
): Paso {
  const partes = [
    { papel: 'accion' as const, texto: 'Sube' },
    { papel: 'texto' as const, texto: ' a la línea ' },
    { papel: 'via' as const, texto: linea.corto },
    { papel: 'texto' as const, texto: ' en el poste ' },
    { papel: 'via' as const, texto: poste },
  ];
  const espera = comoSeEspera(intervalo, vivo);
  if (espera !== null) {
    partes.push({ papel: 'texto' as const, texto: ` — ${espera}` });
  }
  return { giro: 'sube', texto: partes.map((x) => x.texto).join(''), metros: 0, partes };
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
  intervalo: number | null,
  vivo?: EstadoVivo | null,
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
  const espera = comoSeEspera(intervalo, vivo);
  if (espera !== null) {
    // La frecuencia que importa es la del que se coge, no la del que se deja.
    partes.push({
      papel: 'texto' as const,
      texto: ` — ${espera.replace('frecuencia teórica:', `frecuencia teórica de la ${aLa.corto}:`)}`,
    });
  }
  return { giro: 'transborda', texto: partes.map((x) => x.texto).join(''), metros: 0, partes };
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
  // ⭐ Y EL TOTAL TAMBIÉN CAMBIA, no solo el texto. Enseñar «próximo en 5 min»
  // y seguir sumando los 4,5 de la estimación dejaría el paso diciendo una cosa
  // y la cabecera otra — y quien lee se fía de la cabecera.
  // ⚠️ Y los 120 s del transbordo [OTP `transferSlack`] se suman AQUÍ cuando se
  // llega transbordando en el mismo poste: antes vivían en la etapa a pie de
  // cero metros, que ha dejado de existir. El total del viaje no se mueve.
  const segundos =
    (vivo?.clase === 'llega' ? vivo.minutos * 60 : (espera ?? 0)) +
    montado.rodando +
    (como.transbordandoDe ? PENALIZACION_TRANSBORDO_S : 0);
  const dondeSube = porId.get(montado.desde)?.nombre ?? montado.desde;
  return {
    pasos: [
      como.transbordandoDe
        ? pasoDeTransbordo(dondeSube, como.transbordandoDe, linea, intervalo, vivo)
        : pasoDeSubir(linea, dondeSube, intervalo, vivo),
      // Si de aquí se transborda en el mismo poste, el «Baja» lo dice el paso
      // de transbordo del siguiente: no se baja para volver a subir.
      ...(como.acabaEnTransbordo
        ? []
        : [pasoDeBajar(porId.get(montado.hasta)?.nombre ?? montado.hasta)]),
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
 * ⭐ A QUÉ POSTES SE PREGUNTA: a **todos** los de subida, y a la vez.
 *
 * Y hay dos decisiones dentro que se dicen en voz alta:
 *
 * 1. **Se pregunta por todos los vehículos, no solo por el primero.** Que la
 *    línea 42 no esté pasando ahora por su poste es un hecho de la calle
 *    aunque hasta ahí falten cuarenta minutos — puede que haya terminado su
 *    servicio del día. Callarlo sería esconder lo único que la fuente sabe.
 * 2. **Salen todas antes de que vuelva ninguna.** El `map` no lleva `await`
 *    por medio a propósito: el single-flight de `avanza.ts` deduplica lo que
 *    está **en vuelo**, así que preguntar en fila india lo dejaría inútil. Es
 *    lo que compra la juez 13.
 *
 * El tranvía sale de aquí como `sinFuente` y no como `mudo`: su `stop_code` no
 * es de los que Avanza entiende, así que no es que no lo sepamos — es que no
 * hay a quién preguntar, y eso no se avisa.
 */
export async function preguntarPorLasSubidas(
  red: RedDeBus,
  montados: readonly TramoMontado[],
  pedir: typeof fetch = fetch,
): Promise<readonly EstadoVivo[]> {
  const porId = new Map(red.paradas.map((p) => [p.id, p]));
  return Promise.all(
    montados.map((m): Promise<EstadoVivo> => {
      const parada = porId.get(m.desde);
      const poste = parada ? posteDeCodigo(parada.codigo) : null;
      if (poste === null) {
        return Promise.resolve<EstadoVivo>({ clase: 'sinFuente' });
      }
      const corto = lineaDelViaje(red, m.patron).corto;
      return llegadasDelPoste(poste, pedir).then((lectura) => estadoVivoDe(lectura, corto));
    }),
  );
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

  const viaje = buscarViaje({ red, fecha, acceso, salida, suprimidas: desvios?.suprimidas });
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
  const nombreDelPoste = (id: string): string => porId.get(id)?.nombre ?? id;

  /**
   * ⭐ LOS AVISOS DE LO VIVO, y **cada uno nombra su poste**.
   *
   * No es adorno: es lo que permite ponerlo al lado de SU hito y no de otro
   * [GOV.UK, resumen arriba **y** mensaje junto a lo afectado, con el mismo
   * texto]. Un «la línea no está pasando» genérico, con dos transbordos en la
   * lista, obliga a adivinar de cuál habla — y *«general errors are not
   * helpful»*.
   */
  const avisosDeLoVivo = (vivas: readonly EstadoVivo[]): Aviso[] => {
    const avisos: Aviso[] = [];
    viaje.montados.forEach((m, i) => {
      const estado = vivas[i];
      const corto = lineaDelViaje(red, m.patron).corto;
      const poste = nombreDelPoste(m.desde);
      if (estado?.clase === 'ausente') {
        // ⚠️ **Lo que la fuente dice, no lo que parece.** [GTFS-Realtime] una
        // entidad AUSENTE del feed en vivo significa **sin información en tiempo
        // real**, no «sin servicio». Hasta el 31/08 esto decía «no está prestando
        // servicio ahora», que es una conclusión —y puede ser falsa: el bus
        // puede venir con el GPS mudo—. Ahora dice quién calla y qué calla.
        //
        // El poste va NOMBRADO donde el texto diría «este poste»: es lo que
        // permite poner el aviso al lado de SU hito [GOV.UK, doble sitio].
        avisos.push({
          texto:
            `Avanza no anuncia ningún próximo de la línea ${corto} en el poste ${poste} ` +
            'ahora mismo — la espera sale del horario publicado.',
        });
      } else if (estado?.clase === 'mudo') {
        // ⚠️ Las mismas palabras que el BiZi —«disponibilidad no verificada»—
        // porque es la misma condición: se ha preguntado y no se sabe. Y no es
        // lo mismo que `ausente`, donde la fuente contestó.
        avisos.push({
          texto:
            `No hemos podido preguntar cuándo pasa la línea ${corto} por el poste ${poste}: ` +
            'disponibilidad no verificada.',
        });
      }
    });
    return avisos;
  };

  /**
   * Compone el viaje. Con `vivas` a `null` sale la versión del horario.
   *
   * ⚠️ **El dato vivo solo sustituye la espera del PRIMER vehículo.** Para los
   * siguientes se sigue diciendo `~H/2`, y no es pereza: «próximo en 3 min» en
   * un poste al que se llega dentro de cuarenta minutos es un número cierto
   * sobre un autobús que no se va a coger. Lo que sí viaja de esos postes es
   * el aviso, que habla de la línea y no del coche.
   */
  const componer = (vivas: readonly EstadoVivo[] | null): Trayecto => {
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
        ...(vivas ? avisosDeLoVivo(vivas) : []),
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
          espera: esperaEstimada(m.patron, red, fecha),
          intervalo: intervaloDeHoy(m.patron, red, fecha),
          vivo: i === 0 ? (vivas?.[0] ?? null) : null,
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

    return juntar(cabecera, etapas);
  };

  return {
    trayecto: () => componer(null),
    conElVivo: async (pedir: typeof fetch = fetch) =>
      componer(await preguntarPorLasSubidas(red, viaje.montados, pedir)),
  };
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
): Trayecto {
  return prepararViajeEnBus(motor, red, origen, destino, fecha).trayecto();
}
