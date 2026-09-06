/**
 * ⭐ EL VIAJE EN MOTO (4/09, punto 13 casilla 1).
 *
 * ── Lo que la moto COMPARTE con el coche, y por qué ─────────────────────────
 *
 * **La red entera.** La misma cocinada de la casilla 1a: las mismas aristas, los
 * mismos sentidos únicos, las **1.378 transiciones vetadas** de las
 * restricciones de giro y las mismas penalizaciones y velocidades de `car.lua`.
 * No hay aquí una segunda red ni un segundo Dijkstra — `buscarEnCoche` es el de
 * siempre, y por eso la juez del `no_left_turn` 1211840 se puede correr en moto
 * palabra por palabra.
 *
 * ⚠️ **[PROPIO, declarado] Heredar las velocidades del coche es una decisión
 *    nuestra, no una fuente.** No existe un perfil de moto de referencia como el
 *    `car.lua` de OSRM o el `bicycle.lua` que esta casa ya usa. Lo que sí es
 *    comprobable es el marco: en urbano la moto legal circula por la misma
 *    calzada, con los mismos límites y los mismos giros prohibidos, y las zonas
 *    30 entran por el `maxspeed` de la vía como para cualquier otro vehículo.
 *    Así que la moto rueda como el coche **hasta que alguien mida otra cosa**, y
 *    eso queda escrito aquí en vez de disfrazarse de dato.
 *
 * ⚠️ **Y el carril bus tampoco es suyo.** La Ordenanza Municipal de Movilidad
 *    [OMUZ, `zaragoza.es/sede/servicio/normativa/13296`] reserva el carril bus, y
 *    donde las motos pueden usarlo es **donde está señalizado como multiuso**,
 *    no por defecto. Sin el dato de cuáles lo están, la moto no se cuela por
 *    ninguno: la red del coche no los trae y aquí no se le añaden.
 *
 * **Y la Zona de Bajas Emisiones, entera.** La ordenanza no distingue: *«todo
 * vehículo exhibirá el distintivo»*. Así que los dos parámetros del contrato son
 * los mismos, el veto se aplica igual y el aviso lo redacta la misma función.
 *
 * ── Lo que la moto NO comparte ──────────────────────────────────────────────
 *
 * **Dónde acaba.** El coche pregunta dónde dejarlo —zona azul, naranja, PMR o
 * gratuito— porque en calzada hay cuatro montones con cuatro reglas. La moto
 * tiene uno: **el aparcamoto**, y en él no se paga [Reglamento Municipal del
 * Servicio de Estacionamiento Regulado, `zaragoza.es/sede/servicio/normativa/
 * 13291`: las motocicletas están exentas de la tasa]. Así que **no hay pregunta
 * que hacer y no hay viaje de moto hasta la puerta**: siempre remata.
 *
 * Y siempre remata también porque la acera no vale: la OMUZ **art. 32** prohíbe
 * estacionar motocicletas en aceras y zonas peatonales *«cuando exista
 * estacionamiento reservado para ellas»*. Mandar a la puerta a quien va en moto
 * sería mandarle exactamente a donde la ordenanza no le deja dejarla.
 *
 * **Y la excepción del aparcamiento público NO se hereda.** Cuando el destino
 * del coche cae dentro de la ZBE, la ruta remata dentro: la ordenanza deja
 * entrar precisamente para ir a un estacionamiento público con control de acceso
 * conectado [§ 1.32]. **Un aparcamoto de calle no es eso.** Así que con el veto
 * puesto la zona se veta y ya está: los aparcamotos de dentro quedan
 * inalcanzables, y el coste elige el mejor **de fuera** y se anda el resto. Es
 * más simple que el caso del coche, y lo es porque la norma da menos.
 */

import type { Aviso, ParteDelPaso, Paso, Trayecto } from "@desplazame/tipos";
import { aparcamotosCerca, type AparcamotoCerca } from "./aparcamotos.ts";
import type { RedDeCocheServida } from "./coche.ts";
import { etapaAndando, juntar, type Extremo } from "./etapas.ts";
import type { Motor } from "./trayecto.ts";
import { comoSePresenta } from "./pasos.ts";
import { enganchar, type Enganche } from "./proyeccion.ts";

/** Un punto del mapa en el orden de los ficheros: `[lon, lat]`. */
type Punto = readonly [number, number];
import {
  AVISO_ZBE_SIN_RUTA,
  avisosDeLaZbe,
  etapaEnCoche,
  laZbeEstaEnVigor,
  rutaAlMejorAparcamiento,
  vetoDeLaZbe,
  type AristaVetada,
} from "./viaje-coche.ts";

/** Lo que se puede pedir además de ir de un sitio a otro. */
export interface OpcionesDeLaMoto {
  /**
   * Si la moto puede entrar en la ZBE. Sin esto, se avisa y no se veta — la
   * misma ley que el coche, y por la misma razón: la app no sabe qué distintivo
   * lleva.
   *
   * ⚠️ **La matrícula de la sede ya vale**: su formato `C0000XXX` es el del
   *    ciclomotor, y `distintivo.ts` lo acepta desde la casilla 3-bis. Así que
   *    quien va en moto puede contestar esta pregunta consultándola, igual que
   *    quien va en coche.
   */
  readonly puedeEntrarEnLaZbe?: boolean;
  /** El reloj con el que se mira la franja. Se inyecta para poder mentirle. */
  readonly cuando?: Date;
}

/**
 * ⚠️ **CUÁNTOS APARCAMOTOS SE PRUEBAN: 40. Y es RENDIMIENTO, no un radio.**
 *
 * Mismo número y misma razón que los 40 del coche y los 40 postes del bus: cada
 * candidato cuesta **un Dijkstra del peatón**, y conducir hasta los cuarenta
 * cuesta **una sola** búsqueda. No hay ninguna distancia a partir de la cual un
 * aparcamoto «no existe»: quien elige es el coste.
 */
export const APARCAMOTOS_CANDIDATOS = 40;

/**
 * ⭐ CÓMO SE LEE EL SITIO donde se deja la moto: **la calle y el portal**.
 *
 * El WFS los trae en dos campos, `Nombre_calle` en mayúsculas —`"PREDICADORES"`—
 * y `Portal` tal cual —`"28"`, `"s/n"`, `"88 DP"`—. Se juntan con un espacio,
 * que es **como esta casa escribe una dirección** en todas partes, y el nombre
 * pasa por `comoSePresenta`, que es el mismo trato que el bordillo del coche
 * recibe para su `direccion` del censo: de mayúsculas plenas a como se lee.
 *
 * ⚠️ **El `Tipo_via` no entra**, ni aquí ni en el cocinado: expandir `CL` a
 *    «Calle» sería inventarse una tabla que este repositorio no tiene.
 *
 * ⚠️ **Y desde el 4/09 no queda ninguno sin calle.** Los 6 que el WFS deja sin
 *    `Nombre_calle` —§ 1.10 los declara— se completan en el cocinado por
 *    **conflación de atributos** desde el listado de la sede, casados a
 *    milímetros y marcados con `nombreDe: 'sede'`. El camino del sitio sin
 *    nombre se queda escrito y vigilado: si el origen mueve uno de los seis, el
 *    relleno se apaga solo y esa frase vuelve a hacer falta. Un sitio sin
 *    nombre se dice sin nombre; ponerle el portal a secas sería peor que callar.
 */
export function nombreDelAparcamoto(a: AparcamotoCerca, motor: Motor): string {
  const suyo = comoSeLeeElSitio(a, motor);
  return suyo === null
    ? "el aparcamiento de motos"
    : `el aparcamiento de motos de ${suyo}`;
}

/**
 * ⭐ ¿DICE ESTE `Portal` QUE **NO HAY** PORTAL?
 *
 * `«s/n»` no es un número: es la convención con la que se **escribe** una
 * dirección postal cuando el edificio no tiene número. Como valor no dice nada
 * que no diga el hueco, y leído en voz alta —*«el aparcamiento de motos de De
 * Ranillas ese ene»*— es ruido. [OSM, `ES:Key:nohousenumber`, literal: *«No
 * añadas `addr:housenumber=s/n` o cosas similares»*: la ausencia se declara
 * como ausencia.]
 *
 * ⚠️ **El vocabulario está MEDIDO, no supuesto** (6/09, sobre los 2.146
 *    registros de `app/data/aparcamotos.json`). Las formas de la ausencia son
 *    exactamente tres, y se cuentan:
 *
 * | forma | registros |
 * |---|---|
 * | `S/N` | 473 |
 * | `s/n` | 23 |
 * | `SN` | 2 — los dos en `FLORENTINO BALLESTEROS`, que es calle |
 * | vacío | 8 — ya se callaban antes |
 *
 * **506 de 2.146, el 23,6 %.** Todo lo demás es designación de verdad y se dice
 * tal cual: los números, los `F 11` y `F-3` de las fincas, los `fnº 6`, los
 * tramos `18-28`, los `26DP` de los duplicados. Por eso el reconocedor es una
 * lista corta y no un `/^[sS]/`: quitarle el «F» a un `F 11` sería borrar dato.
 *
 * ⚠️ **Y el registro NO SE TOCA.** Esto decide qué se NARRA; `a.portal` sigue
 *    trayendo lo que el WFS dijo, byte a byte, para quien lo quiera mirar.
 */
function sinNumero(portal: string): boolean {
  const pelado = portal.trim().toUpperCase().replace(/[.\s]/g, "");
  return pelado === "" || pelado === "S/N" || pelado === "SN";
}

/** La calle presentada más el portal, o `null` si el WFS no da calle. */
function comoSeLeeElSitio(a: AparcamotoCerca, motor: Motor): string | null {
  const via = a.via.trim();
  if (via === "") {
    return null;
  }
  const comoSeVe = comoSePresenta(via, true, motor.red.articulosPropios);
  return sinNumero(a.portal) ? comoSeVe : `${comoSeVe} ${a.portal.trim()}`;
}

/**
 * ⭐ EL HITO: «Aparca en el aparcamiento de motos de Predicadores 28 (sin coste)».
 *
 * El «(sin coste)» no es una promesa nuestra: el Reglamento Municipal del SER
 * deja a las motocicletas **exentas de la tasa**, así que dejarla ahí no cuesta
 * dinero. Es la única cifra que se puede decir de un aparcamiento en esta
 * aplicación, y por eso se dice — del bordillo regulado se calla el precio
 * porque el censo no lo trae; aquí no hay precio que traer.
 *
 * ⚠️ Y **sin calle, el hito no la inventa**: dice «Aparca en el aparcamiento de
 *    motos (sin coste)» y ya está. Son 6 de los 2.146.
 */
function hitoDeAparcarLaMoto(a: AparcamotoCerca, motor: Motor): Paso {
  const suyo = comoSeLeeElSitio(a, motor);
  const partes: ParteDelPaso[] =
    suyo === null
      ? [
          { papel: "accion", texto: "Aparca" },
          { papel: "texto", texto: " en el aparcamiento de motos (sin coste)" },
        ]
      : [
          { papel: "accion", texto: "Aparca" },
          { papel: "texto", texto: " en el aparcamiento de motos de " },
          { papel: "via", texto: suyo },
          { papel: "texto", texto: " (sin coste)" },
        ];
  return {
    giro: "aparca",
    // Un hito no abre tramo: es una parada, como el aparcabicis y la estación.
    texto: partes.map((x) => x.texto).join(""),
    metros: 0,
    partes,
  };
}

/**
 * ⭐ EL AVISO CUANDO EL DESTINO CAE DENTRO Y LA MOTO NO PUEDE ENTRAR.
 *
 * El del coche dice que la ruta remata en un aparcamiento público **de dentro**,
 * porque la ordenanza lo permite. El de la moto dice lo contrario y es lo
 * honrado: se queda **fuera**, y desde ahí se anda. Quien pregunta merece saber
 * que su destino está dentro y que el último trecho es a pie.
 */
export function avisoDelRemateFueraDeLaZona(donde: string): string {
  return (
    "Tu destino queda dentro de la Zona de Bajas Emisiones. Sin distintivo solo se puede " +
    "entrar con autorización, y un aparcamiento de motos de calle no es de los que la " +
    `ordenanza deja entrar a usar: esta ruta remata en ${donde}, fuera de la zona, y el ` +
    "resto se anda."
  );
}

/** Un trayecto vacío con su explicación, como en el resto de los modos. */
function sinRuta(texto: string): Trayecto {
  return {
    modo: "moto",
    pasos: [],
    geometria: [],
    avisos: [{ texto }],
    metros: 0,
    segundos: 0,
    tramos: [],
  };
}

/**
 * ⭐ EL VIAJE EN MOTO, de punta a punta: conducir, dejarla, y andar.
 *
 * **Siempre son dos tramos** —o más, si la zona parte lo conducido—: no existe
 * el viaje de moto hasta la puerta. Ver la cabecera.
 */
export function viajeEnMoto(
  servida: RedDeCocheServida,
  motor: Motor,
  origen: Extremo,
  destino: Extremo,
  opciones?: OpcionesDeLaMoto,
): Trayecto {
  const cuando = opciones?.cuando ?? new Date();
  const enVigor = laZbeEstaEnVigor(cuando);
  const noEntra = opciones?.puedeEntrarEnLaZbe === false;
  // Se veta solo si las dos cosas, igual que el coche: fuera de la franja no hay
  // nada que vetar, y vetar igualmente sería inventarse una restricción.
  const vetada: AristaVetada | undefined =
    noEntra && enVigor ? vetoDeLaZbe(servida) : undefined;

  /**
   * Un extremo que cae dentro de la zona se mira **sobre el enganche SIN
   * filtrar**: con el filtro puesto engancharía a la primera calle de fuera que
   * pillara, y la respuesta sería una ruta a otro sitio. Es la misma cautela que
   * el coche, y por la misma razón.
   */
  const dentroDeLaZona = (donde: Extremo): boolean => {
    if (!vetada) {
      return false;
    }
    const crudo = enganchar(
      servida.comoRed,
      servida.rejilla,
      donde.lon,
      donde.lat,
    );
    return crudo !== null && vetada(crudo.arista);
  };
  if (dentroDeLaZona(origen)) {
    // Del origen no hay remate posible: la moto ya está dentro, y sacarla sin
    // pisar la zona es justo lo que no se puede.
    return sinRuta(
      `${AVISO_ZBE_SIN_RUTA}. ${origen.nombre} queda dentro de la zona.`,
    );
  }
  const destinoDentro = dentroDeLaZona(destino);

  const engancheOrigen = enganchar(
    servida.comoRed,
    servida.rejilla,
    origen.lon,
    origen.lat,
    vetada && ((arista: number): boolean => !vetada(arista)),
  );
  if (!engancheOrigen) {
    return sinRuta(
      vetada
        ? AVISO_ZBE_SIN_RUTA
        : `${origen.nombre} no tiene cerca ninguna calle por la que pueda circular una ` +
            "moto en nuestro mapa: desde ahí no podemos calcular una ruta en moto.",
    );
  }

  // ── Los candidatos: los 40 más cercanos EN RECTA al destino ───────────────
  const utiles: {
    readonly donde: AparcamotoCerca;
    readonly enganche: Enganche;
    readonly paseo: number;
  }[] = [];
  for (const donde of aparcamotosCerca(
    destino.lon,
    destino.lat,
    APARCAMOTOS_CANDIDATOS,
  )) {
    const enMoto = enganchar(
      servida.comoRed,
      servida.rejilla,
      donde.lon,
      donde.lat,
    );
    if (!enMoto) {
      continue;
    }
    // ⭐ **Y LA ZONA SE VETA TAMBIÉN COMO SITIO DONDE APARCAR.** Dejar la moto
    //    dentro después de haber rodeado la zona es peor que no haberla
    //    rodeado: la sanción es por estar, no por pasar.
    //
    // ⚠️ **Medido el 4/09: hoy esto es REDUNDANTE, y se queda** — exactamente
    //    lo mismo que le pasa al coche desde la casilla 2, y por la misma
    //    razón. La contraprueba del encargo —quitar este filtro— **no consigue
    //    aparcar dentro**: para llegar a un aparcamoto de la zona hay que pisar
    //    una arista de la zona, y el veto de la búsqueda no deja. Lo que sí
    //    consigue aparcar dentro es quitar **los dos** vetos, y eso es lo que la
    //    juez 3 caza.
    //
    //    Se escribe igual por dos razones: dice la intención en el sitio donde
    //    alguien la buscaría, y el día que el veto de la búsqueda se afloje
    //    —una ZBE con excepciones por calle, por ejemplo— esto sigue siendo
    //    verdad sin que nadie tenga que acordarse.
    if (vetada && vetada(enMoto.arista)) {
      continue;
    }
    const parada: Extremo = {
      lon: donde.lon,
      lat: donde.lat,
      nombre: nombreDelAparcamoto(donde, motor),
    };
    const aPie = etapaAndando(motor, parada, destino, {
      apertura: "Sal andando",
    });
    if (!aPie) {
      continue;
    }
    utiles.push({ donde, enganche: enMoto, paseo: aPie.segundos });
  }
  if (utiles.length === 0) {
    return sinRuta(
      vetada
        ? `${AVISO_ZBE_SIN_RUTA}. No hay ningún aparcamiento de motos fuera de la zona al que ` +
            `se pueda llegar y desde el que se pueda andar hasta ${destino.nombre}.`
        : `No hay ningún aparcamiento de motos cerca de ${destino.nombre} al que se pueda ` +
            "llegar en moto y desde el que se pueda andar hasta la puerta.",
    );
  }

  const mejor = rutaAlMejorAparcamiento(
    servida,
    engancheOrigen,
    [origen.lon, origen.lat],
    utiles.map((u) => ({
      enganche: u.enganche,
      punto: [u.donde.lon, u.donde.lat] as Punto,
    })),
    utiles.map((u) => u.paseo),
    vetada,
  );
  if (!mejor) {
    return sinRuta(
      vetada
        ? AVISO_ZBE_SIN_RUTA
        : `No hay forma de ir en moto de ${origen.nombre} a ${destino.nombre} por las calles ` +
            "que conocemos.",
    );
  }

  const gana = utiles[mejor.cual]!;
  const parada: Extremo = {
    lon: gana.donde.lon,
    lat: gana.donde.lat,
    nombre: nombreDelAparcamoto(gana.donde, motor),
  };
  const { etapa, aperturas } = etapaEnCoche(servida, mejor, origen, parada, {
    cierre: hitoDeAparcarLaMoto(gana.donde, motor),
  });
  const aPie = etapaAndando(motor, parada, destino, {
    apertura: "Sal andando",
  });
  if (!aPie) {
    return sinRuta(
      `No se puede andar desde ${parada.nombre} hasta ${destino.nombre} en nuestro mapa.`,
    );
  }

  /**
   * ⭐ EL AVISO. Dos casos, y el segundo es el que esta casilla estrena.
   *
   * Si el destino cae dentro y la moto no puede entrar, lo que hay que contar no
   * es que la ruta pise la zona —no la pisa— sino **que se queda fuera a
   * propósito y que el resto se anda**. Va sin `paso`: no hay ningún paso por el
   * que se entre, que es justamente lo que se está diciendo.
   */
  const avisos: readonly Aviso[] =
    vetada && destinoDentro
      ? [{ texto: avisoDelRemateFueraDeLaZona(parada.nombre) }]
      : avisosDeLaZbe(servida, mejor.trozos, aperturas, {
          enVigor,
          noEntra,
          cuando,
        });

  return juntar(
    { modo: "moto", avisos },
    // El tramo que se conduce MUERE en el aparcamoto: ahí va el icono. El que se
    // anda muere en el portal, que ya lleva su chincheta de destino.
    [{ ...etapa, hito: "aparca" }, aPie],
  );
}
