/**
 * EL VIAJE EN BiZi: andar hasta una estación, pedalear hasta otra, andar el resto.
 *
 * Vive aparte de `etapas.ts` —que es la maquinaria común de los viajes de
 * varios tramos— porque esto es **una política, no una mecánica**: qué estación
 * sirve, con qué filtro, qué se dice en cada hito y cuándo avisa del abono.
 *
 * [DOC OpenTripPlanner, modo de alquiler] *«anda al punto, pedalea al punto de
 * devolución, anda el resto»*, con las estaciones **filtradas por
 * disponibilidad en el momento de planificar**: las llenas no valen para dejar
 * la bici y las vacías no valen para cogerla. [DOC GBFS] esa disponibilidad es
 * el feed dinámico `station_status`, con su marca de tiempo **por estación**.
 */

import type { Aviso, Paso, Trayecto, TipoDeRuta } from '@desplazame/tipos';
import type { Motor } from './trayecto.ts';
import type { Empuje } from './pasos.ts';
import {
  etapaAndando,
  etapaRodando,
  juntar,
  type Extremo,
} from './etapas.ts';
import {
  estacionesCercanas,
  type Disponibilidad,
  type EstacionBiZi,
  type EstadoDeEstacion,
} from './bizi.ts';

/**
 * ⭐ CUÁNTAS ESTACIONES SE PRUEBAN por cada extremo.
 *
 * Más que los aparcabicis —diez y no cinco— porque aquí el filtro es más duro:
 * no basta con que la estación exista y tenga camino, tiene que **tener bicis**
 * (al coger) o **anclajes libres** (al dejar). El 30/08, en una consulta real,
 * 45 de las 276 estaban a cero bicis y 6 a cero anclajes; con un filtro así,
 * quedarse en cinco candidatas deja el modo colgando de muy poco.
 */
const ESTACIONES_CANDIDATAS = 10;

/**
 * ⭐ EL TRAMO INCLUIDO DEL ABONO: **30 minutos**.
 *
 * [FIRMADO por Antonio el 28/08, plan D-G] Si el pedaleo estimado lo supera, se
 * dice — *«supera el tramo incluido del abono»*— y **no se inventa un precio**:
 * lo que cueste el exceso está en las tarifas oficiales, cambia cuando el
 * Ayuntamiento quiere, y no está en ningún dato de este repositorio.
 *
 * El aviso se calcula sobre el tramo que se PEDALEA, no sobre el viaje: los
 * paseos hasta las estaciones no van en el abono.
 */
const TRAMO_DEL_ABONO_S = 30 * 60;

/** Cómo se dice una cantidad con su singular. «1 bici», «8 bicis». */
function conUnidad(cuantos: number, singular: string, plural: string): string {
  return `${cuantos} ${cuantos === 1 ? singular : plural}`;
}

/**
 * La hora de un dato vivo, en local y al minuto: «11:56».
 *
 * ⚠️ Es la hora que la API declara **para esa estación**, no la de la consulta.
 * [DOC GBFS] `last_reported` va por estación y no por feed, y el 30/08 la
 * respuesta real traía **seis marcas distintas** entre sus 276 filas. Decir la
 * hora del dato es enseñar la verdad del feed; decir la de la consulta sería
 * fingir que todas se midieron a la vez.
 */
function alMinuto(cuando: Date): string {
  return cuando.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Lo común a los dos hitos de estación. */
function hitoDeEstacion(
  verbo: 'Coge' | 'Deja',
  enlace: string,
  estacion: EstacionBiZi,
  estado: EstadoDeEstacion | null,
  cifra: (e: EstadoDeEstacion) => string,
): Paso {
  const partes = [
    { papel: 'accion' as const, texto: verbo },
    { papel: 'texto' as const, texto: enlace },
    { papel: 'via' as const, texto: estacion.nombre },
  ];
  if (estado) {
    partes.push({
      papel: 'texto' as const,
      texto: ` — ${cifra(estado)} a las ${alMinuto(estado.cuando)}`,
    });
  }
  return {
    giro: verbo === 'Coge' ? 'coge' : 'aparca',
    texto: partes.map((p) => p.texto).join(''),
    metros: 0,
    partes,
  };
}

/**
 * ⭐ EL HITO DE COGER LA BICI.
 *
 * Con dato vivo: «Coge una bici en la estación X — 8 bicis disponibles a las
 * 11:56». Sin él —API callada—: «Coge una bici en la estación X», **sin número
 * y sin hora**. Es el plan D-G firmado: componer sin prometer.
 */
function hitoDeCoger(estacion: EstacionBiZi, estado: EstadoDeEstacion | null): Paso {
  return hitoDeEstacion('Coge', ' una bici en la estación ', estacion, estado, (e) =>
    conUnidad(e.bicis, 'bici disponible', 'bicis disponibles'),
  );
}

/** ⭐ EL HITO DE DEJARLA, con los anclajes libres en vez de las bicis. */
function hitoDeDejar(estacion: EstacionBiZi, estado: EstadoDeEstacion | null): Paso {
  return hitoDeEstacion('Deja', ' la bici en la estación ', estacion, estado, (e) =>
    conUnidad(e.anclajesLibres, 'anclaje libre', 'anclajes libres'),
  );
}

/** Una estación convertida en extremo, con el nombre que se leerá. */
function estacionComoExtremo(e: EstacionBiZi): Extremo {
  return { lon: e.lon, lat: e.lat, nombre: `la estación ${e.nombre}` };
}

/** Un trayecto de BiZi vacío, con los avisos que se hayan juntado. */
function sinViajeEnBiZi(previos: readonly Aviso[], nuevos: readonly Aviso[]): Trayecto {
  return {
    modo: 'bizi',
    pasos: [],
    geometria: [],
    avisos: [...previos, ...nuevos],
    metros: 0,
    segundos: 0,
    tramos: [],
  };
}

/**
 * ⭐ EL VIAJE EN BiZi: andar a la estación, pedalear a la otra, andar el resto.
 *
 * [DOC OpenTripPlanner, modo de alquiler] *«anda al punto, pedalea al punto de
 * devolución, anda el resto»*. [DOC OTP + GBFS] la estación de origen tiene que
 * tener **bicis** y la de destino **anclajes libres**, filtrado con el feed
 * dinámico en el momento de planificar — las llenas y las vacías se excluyen.
 *
 * `vivo` es la respuesta de la API de la sede, o `null` si calló. **Se recibe,
 * no se pide**: quien la pide es el servidor, y así esta función se puede
 * probar con una disponibilidad de mentira sin tocar la red — que es justo lo
 * que hacen las jueces de la estación vacía y de la API caída.
 *
 * Devuelve siempre un `Trayecto`: si no hay estaciones que valgan, uno con su
 * aviso. Nunca lanza.
 */
export function viajeEnBiZi(
  motor: Motor,
  origen: Extremo,
  destino: Extremo,
  tipo: TipoDeRuta | undefined,
  empuje: Empuje,
  vivo: Disponibilidad | null,
): Trayecto {
  const avisos: Aviso[] = [];
  // ⚠️ D-G, firmado el 28/08: con la API callada se rutea igual —el inventario
  // dice dónde están las estaciones— pero **no se promete disponibilidad**. El
  // aviso va el primero, antes que cualquier otro, porque condiciona todo lo
  // que se lee debajo.
  if (!vivo) {
    avisos.push({
      texto:
        'No hemos podido preguntar cuántas bicis hay ahora mismo: ' +
        'disponibilidad no verificada.',
    });
  }

  const desde = estacionesCercanas(
    motor.bizi,
    vivo,
    origen.lon,
    origen.lat,
    'bicis',
    ESTACIONES_CANDIDATAS,
  );
  const hasta = estacionesCercanas(
    motor.bizi,
    vivo,
    destino.lon,
    destino.lat,
    'anclajes',
    ESTACIONES_CANDIDATAS,
  );
  if (desde.length === 0 || hasta.length === 0) {
    return sinViajeEnBiZi(avisos, [
      {
        texto:
          desde.length === 0
            ? `No hay ninguna estación con bicis cerca de ${origen.nombre}.`
            : `No hay ninguna estación con anclajes libres cerca de ${destino.nombre}.`,
      },
    ]);
  }

  // ⚠️ La misma estación para los dos extremos no es un viaje: es un paseo con
  // una bici por el medio. Se dice, y lo que se da es la ruta a pie, que es la
  // verdad de ese caso.
  if (desde[0]!.numero === hasta[0]!.numero) {
    avisos.push({
      texto:
        'La estación más cercana al origen y la más cercana al destino son la misma ' +
        `(${desde[0]!.nombre}): a esa distancia se llega andando.`,
    });
    const aPie = etapaAndando(motor, origen, destino);
    return aPie
      ? juntar({ modo: 'bizi', avisos }, [aPie])
      : sinViajeEnBiZi(avisos, [{ texto: 'Y tampoco hay camino a pie entre esos dos puntos.' }]);
  }

  for (const salida of desde) {
    for (const llegada of hasta) {
      if (salida.numero === llegada.numero) {
        continue;
      }
      const puntoSalida = estacionComoExtremo(salida);
      const puntoLlegada = estacionComoExtremo(llegada);
      const aLaEstacion = etapaAndando(motor, origen, puntoSalida, {
        cierre: hitoDeCoger(salida, vivo?.porNumero.get(salida.numero) ?? null),
      });
      if (!aLaEstacion) {
        continue;
      }
      const pedaleo = etapaRodando(motor, 'bizi', puntoSalida, puntoLlegada, tipo, empuje, {
        apertura: 'Pedalea',
        cierre: hitoDeDejar(llegada, vivo?.porNumero.get(llegada.numero) ?? null),
      });
      if (!pedaleo) {
        continue;
      }
      const alDestino = etapaAndando(motor, puntoLlegada, destino, { apertura: 'Sigue a pie' });
      if (!alDestino) {
        continue;
      }
      // ⭐ EL AVISO DE LOS 30, sobre el PEDALEO y no sobre el viaje: los paseos
      // hasta las estaciones no van en el abono.
      if (pedaleo.segundos > TRAMO_DEL_ABONO_S) {
        avisos.push({
          texto:
            `El trayecto pedaleando pasa de 30 minutos (${Math.round(pedaleo.segundos / 60)}): ` +
            'supera el tramo incluido del abono.',
        });
      }
      // ⭐ Los dos hitos, cada uno en el tramo que muere en su estación: se
      // coge la bici donde acaba el paseo de ida y se deja donde acaba el
      // pedaleo. Quien pinta pone el icono en `geometria[tramo.hasta]`, que es
      // el vértice que cae a 0,0 m de la estación.
      return juntar({ modo: 'bizi', avisos }, [
        { ...aLaEstacion, hito: 'coge' },
        { ...pedaleo, hito: 'aparca' },
        alDestino,
      ]);
    }
  }

  return sinViajeEnBiZi(avisos, [
    {
      texto:
        `No hay forma de ir en BiZi de ${origen.nombre} a ${destino.nombre}: ` +
        'ninguna pareja de estaciones cercanas se conecta por nuestro mapa.',
    },
  ]);
}
