/**
 * ⭐ EL VIAJE EN MOTO COMPARTIDA (4/09, punto 13 casilla 2).
 *
 * Andar hasta una moto de YeGo que esté libre, rodar con ella hasta el destino,
 * y dejarla ahí. Dos tramos y dos hitos, y ninguna pieza nueva del contrato: el
 * `coge` y el `aparca` son los que la BiZi estrenó el 30/08.
 *
 * ── En qué se parece a la BiZi y en qué no ──────────────────────────────────
 *
 * Se parece en la forma —andar, montar, y una fuente viva que puede callarse— y
 * se diferencia en lo único que importa para el cálculo: **la BiZi va a
 * estaciones y esto va a vehículos sueltos**. GBFS lo llama *free-floating*, y
 * § 1.34 lo mide: YeGo no publica `station_information` ni `station_status`.
 * De ahí salen las dos diferencias de verdad:
 *
 *   · **No hay estación de vuelta**, así que **no hay tercer tramo**: la moto se
 *     deja en el destino [`return_constraint: "free_floating"`]. La BiZi tiene
 *     que ir a un anclaje y luego seguir a pie; aquí se llega y se llega.
 *   · **Cada moto es única**: dos motos a diez metros son dos candidatas
 *     distintas, con **autonomías distintas**. La estación de BiZi es un sitio;
 *     esto es un inventario.
 *
 * ── ⭐ Y la elección es POR COSTE, no por cercanía ───────────────────────────
 *
 * `andar × PESO_DE_ANDAR + rodar`, que es la misma cuenta con la que el coche
 * elige bordillo [OTP `walkReluctance` 4,0]. La moto más cercana no es la mejor:
 * una a 140 m que deja el viaje por un rodeo pierde contra una a 400 m que sale
 * a la vía rápida. Sin el peso, el motor mandaría a andar un kilómetro para
 * ahorrarse dos minutos de rodar.
 *
 * ⚠️ **Y esto cuesta N búsquedas del coche, no una.** El coche hace UNA para sus
 *    40 aparcamientos porque todos cuelgan del mismo origen; aquí el origen de
 *    lo rodado **es cada moto**, así que hay que buscar desde cada una. Por eso
 *    las candidatas son `MOTOS_CANDIDATAS` y no cuarenta: el número es de
 *    rendimiento y va medido.
 *
 * ── ⭐ La autonomía: una moto sin batería para tu viaje no es una opción ─────
 *
 * `current_range_meters` existe para esto, y se usa dos veces:
 *
 *   1. **Antes de buscar**, como criba gratis: si la recta de la moto al destino
 *      ya pasa de su autonomía, por carretera será más y no llega. Es una cota
 *      inferior, así que descartar ahí no puede equivocarse.
 *   2. **Después de buscar**, con los metros de verdad: si la ruta se pasa, esa
 *      moto se cae y gana la siguiente.
 *
 * ── ⭐ Capada a 45 km/h, y no es una preferencia ────────────────────────────
 *
 * La flota son ciclomotores **L1e-B** [Reglamento (UE) 168/2013, anexo I:
 * *«velocidad máxima por construcción ≤ 45 km/h»*], y el RGC les pone el mismo
 * techo. YeGo lo declara además en su propio feed: `max_permitted_speed: 45`.
 *
 * Se aplica **capando la red, no la búsqueda**: ver `comoLaVeUnCiclomotor`. Un
 * parámetro nuevo en el Dijkstra del coche habría sido tocar el corazón por el
 * que pasan los otros siete modos; una vista de la red no toca a nadie.
 *
 * ── ⭐ Y la ZBE no se le pregunta a nadie ───────────────────────────────────
 *
 * La flota es 100 % eléctrica y **el feed lo declara él mismo**: `eco_label` con
 * `eco_sticker: "distintivo_ambiental_0"` en los tres tipos, `g_CO2_KM: 0`. Un
 * CERO entra libre [FAQ de la sede], así que aquí no hay distintivo que
 * preguntar ni zona que vetar: se entra.
 *
 * ⚠️ **Pero el aviso y el corte rojo se quedan**, y no es contradictorio: son
 *    informativos. Quien mira tiene derecho a saber que su ruta cruza la Zona de
 *    Bajas Emisiones aunque a él le dejen pasar — es la misma noticia que recibe
 *    un coche con etiqueta C.
 *
 * ── ⭐ El geofencing: se lee, y no restringe ────────────────────────────────
 *
 * § 1.34 lo mide entero. YeGo publica **una zona con diez polígonos** llamada
 * `"no go zone"` cuyas reglas dicen `ride_allowed: true` y
 * `ride_through_allowed: true`. El nombre y las reglas se contradicen, y el dato
 * desempata: **161 de las 166 motos están aparcadas dentro** de esas manchas, 98
 * en la que cubre el centro. Son el **área de servicio**, no una prohibición.
 *
 * Así que mandan las reglas —que es lo que la especificación pide— y **no hay
 * ninguna restricción que aplicar al final del viaje**. Y no se inventa la de al
 * lado: GBFS 2.3 no tiene `global_rules` —llegó en la 3.0—, así que del «fuera
 * de las manchas» el feed **no dice nada**, y lo que no está en el dato es
 * `NO CONSTA`.
 */

import type { Aviso, Paso, Trayecto } from '@desplazame/tipos';
import { metrosEntre } from './cercano.ts';
import type { RedDeCocheServida } from './coche.ts';
import { etapaAndando, juntar, type Extremo } from './etapas.ts';
import { enganchar, type Enganche } from './proyeccion.ts';
import type { Motor } from './trayecto.ts';
import { PESO_DE_ANDAR } from './viaje-bus.ts';
import {
  avisosDeLaZbe,
  calcularRutaEnCoche,
  etapaEnCoche,
  laZbeEstaEnVigor,
  type RutaDeCoche,
} from './viaje-coche.ts';
import {
  edadEnPalabras,
  motosCerca,
  TOPE_KMH,
  type FlotaViva,
  type MotoCerca,
} from './yego.ts';

/**
 * ⭐ CUÁNTAS MOTOS SE MIRAN: **ocho**.
 *
 * Menos que los 40 candidatos del coche, y por una razón medida: **cada
 * candidata cuesta una búsqueda entera del coche**, no una parada de un Dijkstra
 * compartido. A ~8 ms la búsqueda y ~2 ms el paseo, ocho candidatas son ~80 ms
 * de motor — el mismo orden que la BiZi, que paga ~88 ms de mediana.
 *
 * ⚠️ **No es un radio.** No hay distancia a la que una moto deje de existir: hay
 *    un límite a cuántas se calculan, y quien elige entre ellas es el coste.
 *    Misma doctrina que los 40 del coche y los 40 postes del bus.
 */
export const MOTOS_CANDIDATAS = 8;

/**
 * ⭐ LA RED DEL COCHE, VISTA POR UN CICLOMOTOR: los tiempos capados a 45 km/h.
 *
 * ── Por qué se capa el TIEMPO y no la velocidad ─────────────────────────────
 *
 * La arista cocinada no guarda su `kmh`: guarda los `segundos` que ya salieron
 * de dividir. Derivar la velocidad para volver a multiplicarla arrastraría el
 * redondeo dos veces. El tiempo mínimo a 45 es exacto —`metros / 45 km/h`— y el
 * `Math.max` hace justo lo que se quiere decir: **el tope solo baja la
 * velocidad, nunca la sube**. Una calle de 30 se sigue recorriendo a 30.
 *
 * Es la misma forma que `velocidadDe` usa en la cocina del viario para el
 * `maxspeed` de la señal: *«el tope solo baja»*.
 *
 * ── Y por qué una VISTA de la red, y no un parámetro en la búsqueda ─────────
 *
 * Por el corazón del coche pasan los otros siete modos, y su sello lo vigila una
 * juez. Meterle un parámetro de coste habría sido tocarlo para todos con la
 * esperanza de que el valor por defecto no cambiara nada; una copia de las
 * aristas con otro `segundos` **no lo toca**, y la muralla se cumple por
 * construcción en vez de por cuidado.
 *
 * Se calcula **una vez** y se guarda: son ~89.000 aristas, y hacerlo en cada
 * ruta sería pagar el grafo entero por viaje.
 */
let capada: RedDeCocheServida | null = null;

export function comoLaVeUnCiclomotor(servida: RedDeCocheServida): RedDeCocheServida {
  if (capada !== null) {
    return capada;
  }
  const minimo = (metros: number): number => (metros / 1000 / TOPE_KMH) * 3600;
  capada = {
    ...servida,
    cocinada: {
      ...servida.cocinada,
      aristas: servida.cocinada.aristas.map((a) => ({
        ...a,
        segundos: Math.max(a.segundos, minimo(a.metros)),
      })),
    },
  };
  return capada;
}

/** Solo para las jueces: la vista se guarda y hay que poder tirarla. */
export function olvidarLaRedCapada(): void {
  capada = null;
}

/** Un trayecto vacío con su explicación, como en el resto de los modos. */
function sinRuta(avisos: readonly Aviso[]): Trayecto {
  return { modo: 'yego', pasos: [], geometria: [], avisos, metros: 0, segundos: 0, tramos: [] };
}

/**
 * ⭐ CÓMO SE NOMBRA UNA MOTO: **por su batería, no por su identificador**.
 *
 * ⛔ El `bike_id` es un UUID rotado por privacidad [GBFS 2.3] y **no se enseña**:
 *    a quien busca una ruta no le dice nada, y publicarlo sería exponer el único
 *    campo que el operador se molesta en rotar. Lo que sirve es cuánto le queda.
 */
export function nombreDeLaMoto(moto: MotoCerca): string {
  const km = Math.round(moto.autonomiaM / 1000);
  return `la moto de YeGo (${km} km de autonomía)`;
}

/** El hito de coger: cierra el paseo, en el vértice donde está la moto. */
function hitoDeCoger(moto: MotoCerca): Paso {
  return {
    giro: 'coge',
    metros: 0,
    texto: `Coge ${nombreDeLaMoto(moto)}`,
    partes: [
      { papel: 'accion', texto: 'Coge' },
      { papel: 'texto', texto: ' la moto de YeGo ' },
      { papel: 'via', texto: `(${Math.round(moto.autonomiaM / 1000)} km de autonomía)` },
    ],
  };
}

/**
 * Y el de dejarla, que cierra el viaje.
 *
 * ⭐ **«Déjala donde puedas aparcar»**, y esa cautela es del dato: § 1.34 mide
 * que el geofencing publicado **no restringe nada**, así que el motor no puede
 * decir «déjala aquí mismo» con la autoridad del feed — pero tampoco puede
 * inventarse una prohibición. Lo honrado es no prometer la plaza.
 */
function hitoDeDejarla(destino: Extremo): Paso {
  return {
    giro: 'aparca',
    metros: 0,
    texto: `Deja la moto en ${destino.nombre}, donde esté permitido aparcar`,
    partes: [
      { papel: 'accion', texto: 'Deja la moto' },
      { papel: 'texto', texto: ' en ' },
      { papel: 'via', texto: destino.nombre },
      { papel: 'texto', texto: ', donde esté permitido aparcar' },
    ],
  };
}

/** Una candidata que ya ha pasado por el Dijkstra, con lo que cuesta entera. */
interface Calculada {
  readonly moto: MotoCerca;
  readonly paseo: number;
  readonly ruta: RutaDeCoche;
  /** `andar × PESO_DE_ANDAR + rodar`. Lo que decide. */
  readonly coste: number;
}

export interface OpcionesDeYego {
  readonly cuando?: Date;
  /** Para poder mentirle al reloj en las jueces, como en el coche y el bus. */
  readonly ahora?: Date;
}

/**
 * ⭐ EL VIAJE EN MOTO COMPARTIDA: andar hasta ella, rodar, y dejarla.
 *
 * `flota` es `null` cuando YeGo no ha contestado, y entonces **no hay viaje que
 * ofrecer**: al revés que la BiZi, aquí la fuente viva no es un adorno sobre un
 * inventario — es el inventario. Sin ella no se sabe dónde hay una sola moto.
 */
export function viajeEnYego(
  servida: RedDeCocheServida,
  motor: Motor,
  origen: Extremo,
  destino: Extremo,
  flota: FlotaViva | null,
  opciones?: OpcionesDeYego,
): Trayecto {
  const ahora = opciones?.ahora ?? new Date();
  // ⚠️ EL MUDO HONESTO, y aquí es más duro que en la BiZi. Allí el inventario de
  //    estaciones está en el repositorio y se rutea igual sin el vivo; aquí las
  //    motos **solo existen en el feed**. Sin feed no hay nada que ofrecer, y
  //    decirlo es lo único honrado — inventarse una moto sería lo contrario.
  if (!flota) {
    return sinRuta([
      {
        texto:
          'No hemos podido preguntarle a YeGo dónde hay motos ahora mismo. ' +
          'Sin ese dato no se puede calcular la ruta: inténtalo en un momento.',
      },
    ]);
  }
  const edad = edadEnPalabras(flota.cuando, ahora);
  // El aviso de la edad va SIEMPRE, salga o no salga viaje: es la mitad que hace
  // honesta a la caché de 240 s. Ver `yego.ts`.
  const deLaEdad: Aviso = {
    texto: `Motos de YeGo: ${flota.motos.length} libres, datos de ${edad}.`,
  };

  const candidatas = motosCerca(flota, origen.lon, origen.lat, MOTOS_CANDIDATAS);
  if (candidatas.length === 0) {
    return sinRuta([
      deLaEdad,
      { texto: `No hay ninguna moto de YeGo libre cerca de ${origen.nombre}.` },
    ]);
  }

  const red = comoLaVeUnCiclomotor(servida);
  const engancheDestino = enganchar(red.comoRed, red.rejilla, destino.lon, destino.lat);
  if (!engancheDestino) {
    return sinRuta([
      deLaEdad,
      {
        texto:
          `${destino.nombre} no tiene cerca ninguna calle por la que pueda circular una ` +
          'moto en nuestro mapa: hasta ahí no podemos calcular una ruta en YeGo.',
      },
    ]);
  }

  const calculadas: Calculada[] = [];
  let algunaSinAutonomia = false;
  for (const moto of candidatas) {
    // ⭐ (1) LA CRIBA GRATIS: la recta es una cota inferior de lo que se rodará.
    //    Si ya se pasa de la autonomía en línea recta, por carretera será más.
    if (metrosEntre(moto.lat, moto.lon, destino.lat, destino.lon) > moto.autonomiaM) {
      algunaSinAutonomia = true;
      continue;
    }
    const punto: Extremo = { lon: moto.lon, lat: moto.lat, nombre: nombreDeLaMoto(moto) };
    const aPie = etapaAndando(motor, origen, punto, { cierre: hitoDeCoger(moto) });
    if (!aPie) {
      continue;
    }
    const enLaMoto: Enganche | null = enganchar(red.comoRed, red.rejilla, moto.lon, moto.lat);
    if (!enLaMoto) {
      continue;
    }
    const ruta = calcularRutaEnCoche(
      red,
      enLaMoto,
      [moto.lon, moto.lat],
      engancheDestino,
      [destino.lon, destino.lat],
    );
    if (!ruta) {
      continue;
    }
    // ⭐ (2) Y CON LOS METROS DE VERDAD. La criba de arriba deja pasar rutas que
    //    dan un rodeo; ésta es la que cuenta.
    if (ruta.metros > moto.autonomiaM) {
      algunaSinAutonomia = true;
      continue;
    }
    calculadas.push({
      moto,
      paseo: aPie.segundos,
      ruta,
      coste: PESO_DE_ANDAR * aPie.segundos + ruta.segundos,
    });
  }

  if (calculadas.length === 0) {
    return sinRuta([
      deLaEdad,
      {
        texto: algunaSinAutonomia
          ? `A ninguna de las motos de YeGo que hay cerca de ${origen.nombre} le queda ` +
            `batería para llegar hasta ${destino.nombre}.`
          : `No hay forma de ir en YeGo de ${origen.nombre} a ${destino.nombre} por las ` +
            'calles que conocemos.',
      },
    ]);
  }

  // ⭐ EL COSTE MANDA. `paseo` y `ruta.segundos` ya están, así que esto es una
  //    comparación y no otra búsqueda.
  const gana = calculadas.reduce((mejor, x) => (x.coste < mejor.coste ? x : mejor));

  const punto: Extremo = {
    lon: gana.moto.lon,
    lat: gana.moto.lat,
    nombre: nombreDeLaMoto(gana.moto),
  };
  const aPie = etapaAndando(motor, origen, punto, { cierre: hitoDeCoger(gana.moto) });
  if (!aPie) {
    return sinRuta([
      deLaEdad,
      { texto: `No se puede andar desde ${origen.nombre} hasta la moto en nuestro mapa.` },
    ]);
  }
  const { etapa, aperturas } = etapaEnCoche(red, gana.ruta, punto, destino, {
    apertura: 'Arranca',
    cierre: hitoDeDejarla(destino),
  });

  /**
   * ⭐ EL AVISO DE LA ZONA, **informativo y sin veto**.
   *
   * La flota es CERO y entra libre, así que no hay nada que esquivar. Pero la
   * ruta puede cruzar la Zona de Bajas Emisiones, y quien mira tiene derecho a
   * saberlo — es la misma noticia que recibe un coche con etiqueta C. Por eso
   * `noEntra: false`: se cuenta la norma, no una restricción que no le aplica.
   */
  const deLaZona = avisosDeLaZbe(red, gana.ruta.trozos, aperturas, {
    enVigor: laZbeEstaEnVigor(opciones?.cuando ?? ahora),
    noEntra: false,
    cuando: opciones?.cuando ?? ahora,
  });

  /**
   * ⭐ Y EL `paso` DEL AVISO SE DESPLAZA POR EL PASEO. Sin esto, mal.
   *
   * ⚠️ **Encontrado midiendo el 5/09, y era un fallo de verdad**: el aviso de la
   *    Zona de Bajas Emisiones salía con `paso: 5`, que en este viaje es el hito
   *    de **coger la moto** — un paso del paseo, donde no se entra en ninguna
   *    zona. La pantalla lo habría pintado ahí.
   *
   *    La causa es de nacimiento y no se ve hasta que un modo la pisa:
   *    `avisosDeLaZbe` numera los pasos **de la etapa que se conduce**, porque en
   *    el coche y en la moto privada esa etapa es la primera y los dos índices
   *    coinciden. Aquí **va detrás del paseo**, así que hay que sumarle los pasos
   *    que van antes. `juntar` concatena y no toca los avisos — y hace bien: no
   *    tiene por qué saber a qué etapa se refería cada uno.
   *
   * ⚠️ Y **no había juez que lo cazara**: ninguna miraba el `paso` de este aviso.
   *    Era zona sin vigilar, no un verde mentiroso. Ahora la hay.
   */
  const antesDeRodar = aPie.pasos.length;
  const conSuPaso: readonly Aviso[] = deLaZona.map((a) =>
    a.paso === undefined ? a : { ...a, paso: a.paso + antesDeRodar },
  );

  return juntar({ modo: 'yego', avisos: [deLaEdad, ...conSuPaso] }, [
    // El paseo MUERE en la moto: ahí va el icono de coger.
    { ...aPie, hito: 'coge' },
    // Y lo rodado muere en el destino, que ya lleva su chincheta.
    { ...etapa, hito: 'aparca' },
  ]);
}
