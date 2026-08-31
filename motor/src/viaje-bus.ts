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
 * ⭐ HASTA DÓNDE SE BUSCA UN POSTE, por modo. **Firma 4.**
 *
 * Es un **radio de búsqueda, no una frontera**: si no hay poste dentro, no hay
 * viaje en bus y se dice; no se estira el radio «por esta vez».
 *
 * El tranvía tiene más porque tiene menos paradas y más capacidad: andar 800 m
 * hasta un tranvía que pasa cada 5 minutos es un trato que la gente hace, y
 * andar 800 m hasta un bus que pasa cada 20 no.
 */
export const RADIO_M: Readonly<Record<ModoDeRed, number>> = { bus: 500, tram: 800 };

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

/** Los 120 s que cuesta un transbordo, además de andarlo. [OTP.] */
export const PENALIZACION_TRANSBORDO_S = 120;

/** 5 km/h, la misma velocidad a pie que todo lo demás de la casa. */
export const VELOCIDAD_PEATON_MS = 5000 / 3600;

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

export function indexar(red: RedDeBus, fecha: string): Indices {
  const porParada = new Map<string, { patron: PatronBus; i: number }[]>();
  for (const patron of red.patrones) {
    // ⭐ Solo lo que OPERA HOY. Un patrón que no circula no es una opción, y
    // meterlo en la búsqueda sería ofrecer un bus que no existe.
    if (!operaEl(red, patron, fecha)) {
      continue;
    }
    patron.paradas.forEach((parada, i) => {
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

/** ¿Es `a` mejor que `b` por el orden de la casa, a igualdad de vehículos? */
function mejorAlEmpate(a: Etiqueta, b: Etiqueta): boolean {
  if (a.tranvias !== b.tranvias) {
    return a.tranvias < b.tranvias;
  }
  return a.coste < b.coste;
}

export interface Peticion {
  readonly red: RedDeBus;
  readonly fecha: string;
  readonly acceso: readonly Acceso[];
  readonly salida: readonly Acceso[];
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
  const indices = indexar(red, fecha);

  // Ronda 0: lo que se alcanza andando desde el origen.
  const mejor = new Map<string, Etiqueta>();
  let frontera = new Set<string>();
  for (const a of p.acceso) {
    const etiqueta: Etiqueta = {
      coste: a.metros / VELOCIDAD_PEATON_MS,
      tranvias: 0,
      como: { clase: 'acceso', metros: a.metros },
      anterior: null,
      ronda: 0,
    };
    const previa = mejor.get(a.parada);
    if (!previa || mejorAlEmpate(etiqueta, previa)) {
      mejor.set(a.parada, etiqueta);
      frontera.add(a.parada);
    }
  }
  if (frontera.size === 0) {
    return null;
  }

  const alSalir = new Map(p.salida.map((s) => [s.parada, s.metros]));

  for (let ronda = 1; ronda <= RONDAS; ronda++) {
    const nuevas = new Map<string, Etiqueta>();

    // ── Fase de patrones: cada uno UNA vez, desde su primera parada marcada ──
    const yaVisto = new Set<string>();
    for (const parada of frontera) {
      for (const { patron, i } of indices.porParada.get(parada) ?? []) {
        if (yaVisto.has(patron.id)) {
          continue;
        }
        yaVisto.add(patron.id);
        // Dónde subirse: la parada marcada más temprana del patrón.
        let iSubida = -1;
        let subida: Etiqueta | null = null;
        for (let k = 0; k < patron.paradas.length; k++) {
          const suya = mejor.get(patron.paradas[k]!);
          if (suya && suya.ronda === ronda - 1) {
            iSubida = k;
            subida = suya;
            break;
          }
        }
        if (!subida || iSubida < 0) {
          continue;
        }
        const espera = esperaEstimada(patron, red, fecha);
        if (espera === null) {
          // Sin intervalo no se puede estimar la espera y no se inventa una.
          continue;
        }
        void i;
        for (let k = iSubida + 1; k < patron.paradas.length; k++) {
          const destino = patron.paradas[k]!;
          const rodando = rodandoEntre(patron, iSubida, k);
          const etiqueta: Etiqueta = {
            coste: subida.coste + espera + rodando,
            tranvias: subida.tranvias + (patron.modo === 'tram' ? 1 : 0),
            como: {
              clase: 'montado',
              patron,
              desde: patron.paradas[iSubida]!,
              iDesde: iSubida,
              iHasta: k,
              espera,
              rodando,
            },
            anterior: patron.paradas[iSubida]!,
            ronda,
          };
          const previa = nuevas.get(destino) ?? mejor.get(destino);
          if (!previa || mejorAlEmpate(etiqueta, previa)) {
            nuevas.set(destino, etiqueta);
          }
        }
      }
    }

    // ── Fase de transbordos a pie ───────────────────────────────────────────
    for (const [parada, etiqueta] of [...nuevas]) {
      for (const { hasta, metros } of indices.aPie.get(parada) ?? []) {
        const aPie: Etiqueta = {
          coste: etiqueta.coste + metros / VELOCIDAD_PEATON_MS + PENALIZACION_TRANSBORDO_S,
          tranvias: etiqueta.tranvias,
          como: { clase: 'aPie', desde: parada, metros },
          anterior: parada,
          ronda,
        };
        const previa = nuevas.get(hasta) ?? mejor.get(hasta);
        if (!previa || mejorAlEmpate(aPie, previa)) {
          nuevas.set(hasta, aPie);
        }
      }
    }

    for (const [parada, etiqueta] of nuevas) {
      mejor.set(parada, etiqueta);
    }
    frontera = new Set(nuevas.keys());
    if (frontera.size === 0) {
      break;
    }

    // ¿Se llega ya? Si sí, esta ronda es la de menos vehículos posible.
    let ganador: { etiqueta: Etiqueta; parada: string; metros: number } | null = null;
    for (const [parada, metros] of alSalir) {
      const etiqueta = nuevas.get(parada) ?? mejor.get(parada);
      if (!etiqueta || etiqueta.como.clase === 'acceso') {
        continue;
      }
      const conSalida: Etiqueta = {
        ...etiqueta,
        coste: etiqueta.coste + metros / VELOCIDAD_PEATON_MS,
      };
      if (!ganador || mejorAlEmpate(conSalida, { ...ganador.etiqueta, coste: ganador.etiqueta.coste + ganador.metros / VELOCIDAD_PEATON_MS })) {
        ganador = { etiqueta, parada, metros };
      }
    }
    if (ganador) {
      return reconstruir(mejor, ganador.parada, ganador.metros, p);
    }
  }
  return null;
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
 * ⭐ EL PASO DE SUBIR y el de BAJAR.
 *
 * La espera va con su `~` porque **es una estimación** —`H/2`, y la suposición
 * se degrada con intervalos largos—, y el número que se dice es el de hoy. Sin
 * intervalo que calcular no se escribe espera ninguna: mejor callar que
 * inventar un «~10 min» que no sale de ningún sitio.
 */
export function pasoDeSubir(
  linea: LineaDelViaje,
  poste: string,
  espera: number | null,
  vivo?: EstadoVivo | null,
): Paso {
  const partes = [
    { papel: 'accion' as const, texto: 'Sube' },
    { papel: 'texto' as const, texto: ` a la ${linea.modo === 'tram' ? 'línea' : 'línea'} ` },
    { papel: 'via' as const, texto: linea.corto },
    { papel: 'texto' as const, texto: ' en el poste ' },
    { papel: 'via' as const, texto: poste },
  ];
  if (vivo?.clase === 'llega') {
    // ⭐ El dato vivo **sustituye** a la estimación, no se suma a ella: son dos
    // respuestas a la misma pregunta y la de la calle gana. Y va con su hora
    // porque un «en 5 min» sin fecha envejece sin que se note.
    partes.push({
      papel: 'texto' as const,
      texto: ` — próximo en ${vivo.minutos} min (dato de las ${alMinuto(vivo.cuando)})`,
    });
  } else if (espera !== null) {
    partes.push({ papel: 'texto' as const, texto: ` — ~${Math.round(espera / 60)} min de espera` });
  }
  return { giro: 'sube', texto: partes.map((x) => x.texto).join(''), metros: 0, partes };
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
 * ⚠️ **Su geometría son los POSTES, no la traza del vehículo.** El feed trae la
 * traza (`shape_id` por patrón, y la cocina los guarda), pero los puntos de esa
 * traza no están cocinados todavía: eso es dato del pintado y lo pide la casilla
 * 4. Mientras tanto, la línea se dibuja poste a poste — que es una recta entre
 * paradas consecutivas y **no el recorrido real**. Los metros que se dicen salen
 * de esa misma poligonal, así que son coherentes con lo que se pinta; lo que no
 * son es los metros exactos del asfalto. Queda dicho y no maquillado.
 */
export function etapaMontada(
  red: RedDeBus,
  montado: TramoMontado,
  espera: number | null,
  vivo?: EstadoVivo | null,
): Etapa {
  const porId = new Map(red.paradas.map((p) => [p.id, p]));
  const linea = lineaDelViaje(red, montado.patron);
  const geometria: Vertice[] = [];
  let metros = 0;
  for (let k = montado.iDesde; k <= montado.iHasta; k++) {
    const parada = porId.get(montado.patron.paradas[k]!);
    if (!parada) {
      continue;
    }
    if (geometria.length > 0) {
      const antes = geometria[geometria.length - 1]!;
      metros += metrosEntre(antes[1], antes[0], parada.lon, parada.lat);
    }
    geometria.push([parada.lat, parada.lon]);
  }
  // ⭐ Y EL TOTAL TAMBIÉN CAMBIA, no solo el texto. Enseñar «próximo en 5 min»
  // y seguir sumando los 4,5 de la estimación dejaría el paso diciendo una cosa
  // y la cabecera otra — y quien lee se fía de la cabecera.
  const segundos = (vivo?.clase === 'llega' ? vivo.minutos * 60 : (espera ?? 0)) + montado.rodando;
  return {
    pasos: [
      pasoDeSubir(linea, porId.get(montado.desde)?.nombre ?? montado.desde, espera, vivo),
      pasoDeBajar(porId.get(montado.hasta)?.nombre ?? montado.hasta),
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
    hito: 'baja',
  };
}

/** Los postes a los que se llega andando desde un punto, cada uno con su radio. */
export function postesCerca(
  red: RedDeBus,
  andar: AndarEntre,
  lon: number,
  lat: number,
): Acceso[] {
  const salida: Acceso[] = [];
  for (const p of red.paradas) {
    const radio = RADIO_M[p.modos.includes('tram') ? 'tram' : 'bus'];
    if (metrosEntre(lon, lat, p.lon, p.lat) > radio) {
      continue;
    }
    const m = andar(lon, lat, p.lon, p.lat);
    if (m !== null && m <= radio) {
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

  const acceso = postesCerca(red, andar, origen.lon, origen.lat);
  const salida = postesCerca(red, andar, destino.lon, destino.lat);
  const aPie = andar(origen.lon, origen.lat, destino.lon, destino.lat);
  const enKm = aPie === null ? null : (aPie / 1000).toFixed(1).replace('.', ',');

  if (acceso.length === 0 || salida.length === 0) {
    const cual = acceso.length === 0 ? 'el origen' : 'el destino';
    return sinViaje(
      `No hay ningún poste de bus a menos de ${RADIO_M.bus} m de ${cual} ` +
        `(ni de tranvía a ${RADIO_M.tram} m)` +
        (enKm ? `: andando son ${enKm} km.` : '.'),
    );
  }

  const viaje = buscarViaje({ red, fecha, acceso, salida });
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
        avisos.push({
          texto:
            `La línea ${corto} no está prestando servicio ahora en el poste ${poste}: ` +
            'la espera que se dice sale del horario publicado.',
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
    const cabecera = { modo: 'bus' as const, avisos: vivas ? avisosDeLoVivo(vivas) : [] };
    const perdido = (texto: string): Trayecto => juntar({ modo: 'bus', avisos: [{ texto }] }, []);

    const etapas: Etapa[] = [];
    const primera = etapaAndando(motor, origen, comoExtremo(viaje.montados[0]!.desde));
    if (!primera) {
      return perdido('No hay camino a pie hasta el poste donde habría que subir.');
    }
    etapas.push({ ...primera, hito: 'sube' });

    for (let i = 0; i < viaje.montados.length; i++) {
      const m = viaje.montados[i]!;
      etapas.push(
        etapaMontada(red, m, esperaEstimada(m.patron, red, fecha), i === 0 ? (vivas?.[0] ?? null) : null),
      );
      const siguiente = viaje.montados[i + 1];
      if (siguiente) {
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
