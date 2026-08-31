/**
 * LOS TRAMOS DE UN VIAJE QUE CAMBIA DE VEHÍCULO POR EL CAMINO.
 *
 * Hasta el 30/08 una ruta era **una** ruta: un Dijkstra, una lista de pasos, un
 * total. Desde la casilla 5 hay viajes de tres tramos —rodar, aparcar, andar—
 * y desde la 6 otros tres —andar, pedalear, andar—, y este fichero es lo que
 * los junta sin que la respuesta deje de ser un `Trayecto` de los de siempre.
 *
 * Se llama `Etapa` y no `Tramo` a propósito: `Tramo` ya es, dentro de
 * `pasos.ts`, el grupo de aristas que comparten nombre. Dos cosas distintas no
 * pueden llamarse igual en el mismo motor.
 *
 * ── Lo que hace y lo que NO hace ────────────────────────────────────────────
 *
 * **No hay algoritmo nuevo.** Cada etapa se calcula con el Dijkstra que ya
 * existía —el del peatón o el de la rueda, cada uno con su red y su cuaderno— y
 * se narra con `escribirPasos`. Lo único que se estrena son las **costuras**
 * (ver `Costuras` en `pasos.ts`): que el segundo tramo no vuelva a decir «Sal
 * de…» y que el primero no diga «has llegado» donde solo se aparca.
 *
 * [DOC OpenTripPlanner] es su patrón entero: `BICYCLE_PARK` *«deja la bicicleta
 * y anda hasta el destino»* y el modo de alquiler *«anda al punto, pedalea al
 * punto de devolución, anda el resto»*. [DOC OSRM] pone el cambio de vehículo
 * como **paso propio** con su campo `mode`, y eso es lo que son los hitos.
 */

import type {
  Aviso,
  Paso,
  TipoDeRuta,
  TramoDelViaje,
  Trayecto,
  Vertice,
  LineaDelViaje,
} from '@desplazame/tipos';
import type { Motor } from './trayecto.ts';
import { enganchar } from './proyeccion.ts';
import { calcularRuta, geometriaDe, geometriaPorModo, type Ruta } from './ruta.ts';
import {
  admiteComoPuerta,
  calcularRutaRodando,
  segundosDeLosTrozos,
  segundosRodando,
} from './rodando.ts';
import type { ModoDeRueda } from './rueda.ts';
import type { RedDeLaRueda } from './red-rueda.ts';
import { comoSePresenta, escribirPasos, type Costuras, type Empuje } from './pasos.ts';
import { aparcabicisCercanos, type Aparcabici } from './aparcabicis.ts';
import { metrosEntre } from './cercano.ts';

/**
 * Velocidad a pie para derivar la duración: **5,0 km/h**. La misma que usa el
 * trayecto del peatón, y vive aquí porque ahora la necesitan los dos.
 *
 * [PROPIO, y declarado como tal en el contrato] Es la velocidad de manual, no
 * una medida.
 */
export const VELOCIDAD_MS = 5000 / 3600;

/**
 * Una hora en local y al minuto: «11:56». La usan los hitos que llevan dato
 * vivo, para decir **de cuándo** es el número que enseñan.
 *
 * ⚠️ Vive aquí y no en cada viaje porque el formato es el mismo, pero **la
 * hora que se le pasa no lo es**, y eso lo decide quien llama: el BiZi dice la
 * que la API declara para esa estación [DOC GBFS, `last_reported` va por
 * estación], y el bus dice la de nuestra propia lectura, porque Avanza no
 * fecha sus minutos. Un número sin fecha envejece sin avisar.
 */
export function alMinuto(cuando: Date): string {
  return cuando.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Un punto del viaje, con cómo se llama. Lo resuelve `trayecto.ts`. */
export interface Extremo {
  readonly lon: number;
  readonly lat: number;
  /** Lo que se escribe en el paso de salida o de llegada. */
  readonly nombre: string;
}

/**
 * ⭐ Un sub-tramo de una etapa: **índices LOCALES y cifras SIN redondear**.
 *
 * Las dos cosas son a propósito. Los índices son locales porque una etapa no
 * sabe en qué parte del viaje va a caer —eso lo decide `juntar`—, y las cifras
 * van crudas porque redondearlas aquí haría que la suma de las partes no diera
 * el total: el redondeo se hace **una sola vez y por fronteras**, al final.
 */
/** Los cuatro hitos que un tramo puede cerrar, o ninguno. Ver el contrato. */
export type HitoDeTramo = 'coge' | 'aparca' | 'sube' | 'baja' | null;

export interface TramoDeEtapa {
  readonly comoSeVa: 'andando' | 'rodando' | 'montado';
  readonly desde: number;
  readonly hasta: number;
  readonly metros: number;
  readonly segundos: number;
  /** Solo cuando se va `montado`: qué línea. Ver el contrato. */
  readonly linea?: LineaDelViaje;
}

/** Un tramo ya calculado y ya narrado. Lo que se suma para hacer el viaje. */
export interface Etapa {
  readonly pasos: readonly Paso[];
  /** En `[lat, lon]`, ya dada la vuelta: el contrato la quiere así. */
  readonly geometria: readonly Vertice[];
  readonly metros: number;
  readonly segundos: number;
  /**
   * ⭐ Cómo se recorre esta etapa por dentro. Una etapa a pie trae uno solo;
   * una rodando trae tantos como veces se baje uno del vehículo.
   */
  readonly tramos: readonly TramoDeEtapa[];
  /** El hito en el que muere la etapa, si muere en uno. Lo pone quien la pide. */
  readonly hito?: NonNullable<HitoDeTramo>;
}

/**
 * ⭐ CUÁNTOS APARCABICIS SE PRUEBAN antes de rendirse.
 *
 * El más cercano **en línea recta** puede no ser el más cercano por la red —al
 * otro lado del río, dentro de un recinto cerrado, en la acera de enfrente de
 * una autovía—, y también puede no tener enganche a la red de la rueda. Cuando
 * el primero no da camino se prueba el siguiente.
 *
 * Cinco y no uno porque uno deja el modo a merced de un solo punto; cinco y no
 * cincuenta porque cada intento son dos Dijkstra y el quinto ya está, medido
 * sobre el censo, mucho más lejos que el primero.
 */
const CANDIDATOS = 5;

/**
 * ⭐ CUÁNTO SE PUEDE ANDAR desde el aparcabicis hasta la puerta: **500 m**.
 *
 * [PROPIO, y con los números delante, porque sin este tope el remate produce
 * un absurdo.] Medido sobre los 46.150 portales del censo contra los 1.914
 * aparcabicis entrantes, el más cercano queda a:
 *
 *     p50 84 m · p90 883 m · p95 2.008 m · p99 5.656 m · máximo 11.641 m
 *
 * Para el portal típico el aparcabicis está en la puerta —**el 58,2 % lo tiene
 * a menos de 100 m**— pero la cola es larguísima: en los barrios rurales § 1.9
 * simplemente no llega. **Sin tope, una ruta a un portal de esa cola diría
 * "pedalea 7 km hasta el aparcabicis y anda 5 km hasta tu casa"**, que no es
 * una ruta, es una broma.
 *
 * 500 m son **6 minutos** a los 5,0 km/h de la casa, y dejan con remate al
 * **86,3 % de los portales**. Lo que queda fuera no se maquilla: la ruta va
 * hasta la puerta y **un aviso dice a cuántos metros estaba el más cercano**,
 * para que quien lo lea decida por su cuenta.
 *
 * El tope se mide sobre los METROS ANDADOS de verdad, no sobre la línea recta:
 * la recta solo sirve para no probar candidatos que no pueden caber.
 */
const MAXIMO_ANDANDO_M = 500;

/** Calcula el tramo ANDANDO entre dos puntos, o `null` si no hay camino. */
export function etapaAndando(
  motor: Motor,
  origen: Extremo,
  destino: Extremo,
  costuras?: Costuras,
): Etapa | null {
  const eo = enganchar(motor.red, motor.rejilla, origen.lon, origen.lat);
  const ed = enganchar(motor.red, motor.rejilla, destino.lon, destino.lat);
  if (!eo || !ed) {
    return null;
  }
  const ruta = calcularRuta(
    motor.red,
    motor.cuaderno,
    eo,
    [origen.lon, origen.lat],
    ed,
    [destino.lon, destino.lat],
  );
  if (!ruta) {
    return null;
  }
  const geometria = geometriaDe(ruta).map(([lon, lat]) => [lat, lon] as Vertice);
  const segundos = ruta.metros / VELOCIDAD_MS;
  return {
    pasos: escribirPasos(
      motor.red,
      ruta,
      origen.nombre,
      destino.nombre,
      [destino.lon, destino.lat],
      undefined,
      costuras,
    ),
    geometria,
    metros: ruta.metros,
    segundos,
    // Andando no hay nada que partir: se va a pie de punta a punta.
    tramos: [
      {
        comoSeVa: 'andando',
        desde: 0,
        hasta: Math.max(0, geometria.length - 1),
        metros: ruta.metros,
        segundos,
      },
    ],
  };
}

/** Calcula el tramo RODANDO entre dos puntos, o `null` si no hay camino. */
export function etapaRodando(
  motor: Motor,
  modo: ModoDeRueda,
  origen: Extremo,
  destino: Extremo,
  tipo: TipoDeRuta | undefined,
  empuje: Empuje,
  costuras?: Costuras,
): Etapa | null {
  const red = motor.redRueda;
  const admitida = (arista: number): boolean => admiteComoPuerta(red, arista, modo);
  const eo = enganchar(red, motor.rejillaRueda, origen.lon, origen.lat, admitida);
  const ed = enganchar(red, motor.rejillaRueda, destino.lon, destino.lat, admitida);
  if (!eo || !ed) {
    return null;
  }
  const trazado: Ruta | null = calcularRutaRodando(
    red,
    motor.cuadernoRueda,
    modo,
    eo,
    [origen.lon, origen.lat],
    ed,
    [destino.lon, destino.lat],
    tipo,
  );
  if (!trazado) {
    return null;
  }
  // ⭐ La geometría y sus cortes salen de la MISMA vuelta, así que el corte no
  // puede derivar de los puntos. Ver `geometriaPorModo`.
  const rodado = loRodado(red, trazado, modo, tipo, empuje);
  return {
    pasos: escribirPasos(
      red,
      trazado,
      origen.nombre,
      destino.nombre,
      [destino.lon, destino.lat],
      empuje,
      costuras,
    ),
    geometria: rodado.geometria,
    metros: trazado.metros,
    // El reloj no lleva la preferencia dentro: `segundosRodando` la divide.
    segundos: segundosRodando(red, trazado, modo, tipo),
    tramos: rodado.tramos,
  };
}

/**
 * ⭐ Los sub-tramos de una etapa rodada, uno por cada vez que se cambia de
 * manera de ir.
 *
 * **El empujado sale como `andando`, y no es una licencia**: quien lleva el
 * vehículo en la mano es peatón [RGC art. 121.2] y va a paso de peatón. [DOC
 * OSRM] su respuesta hace lo mismo — el tramo desmontado es un modo propio
 * dentro de la ruta en bici—. La consecuencia buena es que quien pinta no
 * necesita saber que el empuje existe.
 *
 * Los metros y los segundos de cada trozo salen de **las mismas funciones** que
 * los del total, sobre la rebanada que le toca: si salieran de otra cuenta
 * parecida, un día dejarían de sumar y nadie sabría cuál de las dos mentía.
 */
export function loRodado(
  red: RedDeLaRueda,
  trazado: Ruta,
  modo: ModoDeRueda,
  tipo: TipoDeRuta | undefined,
  empuje: Empuje,
): { readonly geometria: readonly Vertice[]; readonly tramos: readonly TramoDeEtapa[] } {
  const troceada = geometriaPorModo(trazado, empuje.esEmpuje);
  return {
    geometria: troceada.puntos.map(([lon, lat]) => [lat, lon] as Vertice),
    tramos: tramosDeLoRodado(red, trazado, modo, tipo, troceada),
  };
}

function tramosDeLoRodado(
  red: RedDeLaRueda,
  trazado: Ruta,
  modo: ModoDeRueda,
  tipo: TipoDeRuta | undefined,
  troceada: ReturnType<typeof geometriaPorModo>,
): readonly TramoDeEtapa[] {
  if (troceada.cortes.length === 0) {
    // Una ruta sin trozos —los dos extremos en la misma arista— no tiene nada
    // que partir. Se devuelve un tramo que cubre lo que haya, y no cero: el
    // contrato exige al menos uno.
    return [
      {
        comoSeVa: 'rodando',
        desde: 0,
        hasta: Math.max(0, troceada.puntos.length - 1),
        metros: trazado.metros,
        segundos: segundosRodando(red, trazado, modo, tipo),
      },
    ];
  }
  return troceada.cortes.map((corte) => {
    const rebanada = trazado.trozos.slice(corte.primerTrozo, corte.ultimoTrozo + 1);
    return {
      comoSeVa: corte.empujando ? ('andando' as const) : ('rodando' as const),
      desde: corte.desde,
      hasta: corte.hasta,
      metros: rebanada.reduce((s, t) => s + t.metros, 0),
      segundos: segundosDeLosTrozos(red, rebanada, modo, tipo),
    };
  });
}

/**
 * Junta las etapas en un `Trayecto`: los pasos en fila, la geometría cosida y
 * los totales sumados.
 *
 * **La geometría se cose sin repetir el punto de unión**: la última coordenada
 * de una etapa y la primera de la siguiente son la misma —el hito—, porque las
 * dos rutas llevan dibujado su conector hasta el punto exacto.
 */
export function juntar(
  trayecto: Omit<Trayecto, 'pasos' | 'geometria' | 'metros' | 'segundos' | 'tramos'>,
  etapas: readonly Etapa[],
): Trayecto {
  const pasos: Paso[] = [];
  const geometria: Vertice[] = [];
  const crudos: (TramoDeEtapa & { hito: HitoDeTramo })[] = [];
  for (const etapa of etapas) {
    pasos.push(...etapa.pasos);
    // ⭐ El desplazamiento de índices: la etapa que no es la primera comparte su
    // vértice 0 con el último de la anterior —por eso se pega con `slice(1)`—,
    // así que su índice local `i` cae en `base + i`.
    const base = geometria.length === 0 ? 0 : geometria.length - 1;
    geometria.push(...(geometria.length === 0 ? etapa.geometria : etapa.geometria.slice(1)));
    etapa.tramos.forEach((t, k) => {
      crudos.push({
        ...t,
        desde: base + t.desde,
        hasta: base + t.hasta,
        // ⚠️ El hito muere al final de la ETAPA, así que solo lo lleva su
        // último sub-tramo. Los cortes de dentro —dejar de empujar— no son
        // hitos y no llevan icono.
        hito: k === etapa.tramos.length - 1 ? (etapa.hito ?? null) : null,
      });
    });
  }

  const { tramos, metros, segundos } = redondearTramos(crudos);
  return { ...trayecto, pasos, geometria, metros, segundos, tramos };
}

/**
 * ⭐ EL REDONDEO DE LOS TRAMOS, **por fronteras acumuladas y no uno a uno**.
 *
 * Redondeando cada parte por su cuenta, la suma de lo que se lee en pantalla
 * podría no dar el total de la cabecera — hasta un metro por tramo, y un viaje
 * en BiZi tiene cinco—. Aquí se redondea el ACUMULADO en cada frontera y se
 * resta el anterior, así que la resta telescopa y **la suma de las partes es
 * exactamente el total**, sin corregir nada a mano después.
 *
 * ⚠️ **El total se devuelve desde aquí, y es `Math.round` de la suma CRUDA**,
 * no la suma de las partes ya redondeadas. La diferencia parece nula —con este
 * redondeo dan lo mismo— y no lo es: si el total se calculara sumando las
 * partes, «las partes suman el total» sería verdad haga lo que haga esta
 * función, y la juez que lo vigila no podría fallar nunca. Se descubrió
 * mutándola: con el redondeo ingenuo, la juez seguía en verde.
 *
 * `hito` viaja como venga: no es una cifra y no se toca.
 */
export function redondearTramos(
  crudos: readonly (TramoDeEtapa & { readonly hito: HitoDeTramo })[],
): { readonly tramos: readonly TramoDelViaje[]; readonly metros: number; readonly segundos: number } {
  let metros = 0;
  let segundos = 0;
  let metrosPuestos = 0;
  let segundosPuestos = 0;
  const tramos = crudos.map((t) => {
    metros += t.metros;
    segundos += t.segundos;
    const hastaAqui = Math.round(metros);
    const hastaAquiS = Math.round(segundos);
    const suyos = hastaAqui - metrosPuestos;
    const suyosS = hastaAquiS - segundosPuestos;
    metrosPuestos = hastaAqui;
    segundosPuestos = hastaAquiS;
    return {
      comoSeVa: t.comoSeVa,
      desde: t.desde,
      hasta: t.hasta,
      metros: suyos,
      segundos: suyosS,
      hito: t.hito,
      // La línea solo viaja si la hay: un `linea: undefined` en el JSON de la
      // respuesta diría «hay línea y está vacía», y no es lo mismo que no haber.
      ...(t.linea ? { linea: t.linea } : {}),
    };
  });
  return { tramos, metros: Math.round(metros), segundos: Math.round(segundos) };
}

/**
 * ⭐ EL HITO DEL APARCABICIS: «Aparca en el aparcabicis de X — 10 anclajes».
 *
 * ⚠️ **Dice anclajes, no huecos, y la diferencia es toda la honradez de este
 * paso.** § 1.9 publica la CAPACIDAD del soporte —cuántas bicis caben—, no la
 * disponibilidad. [DOC OTP 2] su capa de *vehicle parking* filtra por
 * disponibilidad **cuando el feed la trae**; este no la trae, así que aquí no
 * se filtra ni se promete. Un «quedan 3 huecos» sería inventado.
 *
 * `metros: 0` porque un hito no abre tramo: es una parada. Los metros del
 * paseo que viene después los lleva el paso que lo abre, como siempre.
 */
function hitoDeAparcabicis(motor: Motor, donde: Aparcabici): Paso {
  const via = comoSePresenta(donde.via, true, motor.red.articulosPropios);
  const partes = [
    { papel: 'accion' as const, texto: 'Aparca' },
    { papel: 'texto' as const, texto: ' en el aparcabicis de ' },
    { papel: 'via' as const, texto: via },
    {
      papel: 'texto' as const,
      texto: donde.anclajes === 1 ? ' — 1 anclaje' : ` — ${donde.anclajes} anclajes`,
    },
  ];
  return {
    giro: 'aparca',
    texto: partes.map((p) => p.texto).join(''),
    metros: 0,
    partes,
  };
}

/** Un aparcabicis convertido en extremo, con el nombre que se leerá. */
function comoExtremo(donde: Aparcabici): Extremo {
  return { lon: donde.lon, lat: donde.lat, nombre: `el aparcabicis de ${donde.via}` };
}

/**
 * ⭐ EL REMATE DE LOS PRIVADOS: rodar hasta el aparcabicis, aparcar, y andar.
 *
 * Devuelve `null` cuando **no hay remate posible** —ningún aparcabicis cerca
 * del destino, o ninguno con camino—, y entonces quien llama sigue con la ruta
 * de siempre hasta la puerta y lo dice. No lanza y no decide avisos: eso es de
 * `trayecto.ts`, que es quien sabe redactarlos.
 *
 * El patín remata **igual que la bici**: la Ordenanza no le da un régimen de
 * estacionamiento propio, así que aparca donde aparca una bicicleta.
 */
export function remataEnAparcabicis(
  motor: Motor,
  modo: ModoDeRueda,
  origen: Extremo,
  destino: Extremo,
  tipo: TipoDeRuta | undefined,
  empuje: Empuje,
): { trayecto: Trayecto; donde: Aparcabici } | null {
  const candidatos = aparcabicisCercanos(
    motor.aparcabicis,
    destino.lon,
    destino.lat,
    CANDIDATOS,
  );
  for (const donde of candidatos) {
    // La recta solo poda: si ni en línea recta cabe, andando tampoco.
    if (metrosEntre(destino.lat, destino.lon, donde.lat, donde.lon) > MAXIMO_ANDANDO_M) {
      continue;
    }
    const parada = comoExtremo(donde);
    const rodando = etapaRodando(motor, modo, origen, parada, tipo, empuje, {
      cierre: hitoDeAparcabicis(motor, donde),
    });
    if (!rodando) {
      continue;
    }
    const andando = etapaAndando(motor, parada, destino, { apertura: 'Sigue a pie' });
    if (!andando || andando.metros > MAXIMO_ANDANDO_M) {
      continue;
    }
    return {
      // El tramo que se rueda MUERE en el aparcabicis: ahí va el icono. Y el
      // que se anda muere en el portal, que ya lleva su chincheta de destino.
      trayecto: juntar({ modo, avisos: [] }, [{ ...rodando, hito: 'aparca' }, andando]),
      donde,
    };
  }
  return null;
}

/**
 * A cuántos metros en línea recta queda el aparcabicis más cercano al destino.
 * Es lo que el aviso dice cuando no hay remate: un número, no una excusa.
 */
export function aQueDistanciaElAparcabicis(motor: Motor, destino: Extremo): number | null {
  const [cerca] = aparcabicisCercanos(motor.aparcabicis, destino.lon, destino.lat, 1);
  return cerca ? Math.round(metrosEntre(destino.lat, destino.lon, cerca.lat, cerca.lon)) : null;
}

/** El aviso que se da cuando el remate no cabe. Sin maquillar. */
export function avisoSinAparcabicis(destino: Extremo, metros: number | null): Aviso {
  return {
    texto:
      metros === null
        ? `No conocemos ningún aparcabicis cerca de ${destino.nombre}: la ruta llega hasta la puerta.`
        : `El aparcabicis más cercano a ${destino.nombre} está a ${metros.toLocaleString('es-ES')} m, ` +
          `más de los ${MAXIMO_ANDANDO_M} que tiene sentido andar: la ruta llega hasta la puerta.`,
  };
}
