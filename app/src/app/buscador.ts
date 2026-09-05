import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import type { ElementRef, WritableSignal } from '@angular/core';
// El contrato manda: los tipos vienen del paquete compartido, no de copias
// locales. Si el motor cambia la forma, esta pantalla deja de compilar.
import type {
  AQuienPreguntar,
  EstacionViva,
  PosteVivo,
  Aviso,
  Giro,
  LineaDelViaje,
  Modo,
  Paso,
  PeticionDeRuta,
  Portal,
  PortalCercano,
  DistintivoConsultado,
  TipoDeAparcamiento,
  TipoDeRuta,
  Trayecto,
  Via,
  ExtremoDeRuta,
  Sitio,
} from '@desplazame/tipos';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Mapa, type Vertice } from './mapa';
import { AutocompletarVia, comoSeVeLaVia } from './autocompletar-via';
import { SelectorPortal } from './selector-portal';
import { IconoCapa, type Clase } from './iconos';
import { llevaContorno, tonosDeChip, type TonosDeChip } from './chip';

/**
 * ⭐ EL MAPEO GIRO → FLECHA. Diez giros, diez glifos, y ni una dependencia.
 *
 * **La flecha sale del `giro`, nunca del `texto`.** Es lo que el contrato dice
 * de `Giro` —*«la pantalla dibuja la flecha a partir de esto»*— y la razón es
 * que parsear la frase para ver si lleva la palabra «derecha» ataría el icono a
 * la redacción de los pasos: cambiar «Gira a la derecha» por «Tuerce a la
 * derecha» dejaría el mapa de flechas roto sin que nada se pusiera rojo.
 *
 * **Son caracteres, no imágenes y no una librería de iconos.** El repositorio
 * no añade dependencias, y aquí no hacía falta ninguna: Unicode trae la familia
 * entera de flechas con codo. Los tres tamaños de giro se leen por dónde apunta
 * la PUNTA, contando que se va hacia arriba: 45° (`↗`), 90° (`↱`), y más de 135°
 * la punta ya baja (`⬎`), que es doblarse sobre uno mismo. La media vuelta es el
 * gancho `↩`. Y la salida y la llegada no son giros —lo dice el contrato—, así
 * que llevan marca propia: el punto de partida y la bandera, como en la captura
 * de Google.
 *
 * `Record<Giro, string>` no es adorno de tipos: **obliga a que estén todos**.
 * Si el motor añadiera un giro al contrato, esta tabla dejaría de compilar en
 * vez de pintar un hueco en blanco. **Y cumplió el 30/08**: al partirse la ruta
 * de la bici en tres tramos entraron `coge` y `aparca`, y lo primero que se
 * puso rojo fue esta línea.
 *
 * ⭐ Los dos hitos no son giros y no llevan flecha: llevan **la señal de lo que
 * pasa ahí**. `aparca` es la `P` de aparcamiento encerrada (`🅿`), que es el
 * símbolo que está en la calle; `coge` es la bicicleta (`🚲`), el vehículo que
 * se toma. Son caracteres, como el resto — sin dependencias.
 */
/**
 * ⭐ Por dónde se reconoce el aviso del plan D-G de BiZi.
 *
 * Es un trozo del texto que el motor escribe cuando la sede no contesta, y es
 * el trozo que **nombra la condición** —no el que cuenta la anécdota—, así que
 * sobrevive a un cambio de redacción en la primera mitad de la frase. Ver
 * `notaDelHito` para por qué esto se hace por texto y no por un campo.
 */
const MARCA_DE_DISPONIBILIDAD = 'disponibilidad no verificada';

/**
 * ⭐ Y la del bus: la línea que ahora mismo no está pasando por su poste.
 *
 * Es otra condición, no otra redacción de la misma. `MARCA_DE_DISPONIBILIDAD`
 * dice **no lo sabemos**; esta dice **la fuente contestó y no anuncia ninguno**.
 * Las dos piden nota junto al hito, y por eso viven juntas aquí.
 *
 * ⚠️ Y el trozo elegido es el del **verbo de la fuente**, no una conclusión: el
 * 31/08 este texto decía «no está prestando servicio ahora», que es lo que
 * parecía y no es lo que se sabe — [GTFS-Realtime] una entidad ausente del feed
 * en vivo significa **sin información en tiempo real**.
 */
const MARCA_DE_SIN_SERVICIO = 'no anuncia ningún próximo';

/**
 * ⭐ Y la del desvío: la línea que hoy no hace su recorrido de siempre.
 *
 * Es la tercera condición que pide nota junto al hito, y la más importante de
 * las tres: las otras dos hablan de **cuándo** pasa el autobús, y esta de **por
 * dónde**. Alguien que no la lea puede plantarse en una parada por la que hoy
 * no pasa nadie.
 */
const MARCA_DE_DESVIO = 'va hoy desviada';

/** Un aviso partido en lo que se ve siempre y lo que se ve si se pide. */
export interface EnDosNiveles {
  /** El hecho. Una frase, y siempre visible. */
  readonly hecho: string;
  /** El detalle, o `null` si este aviso no tiene nada que esconder. */
  readonly detalle: string | null;
}

/**
 * ⭐ EN QUÉ ANDA LA CONSULTA DE UN POSTE, para su región de estado.
 *
 * `tarda` es aparte de `cargando` a propósito: cargando se está desde el primer
 * milisegundo, y **decirlo** solo hace falta pasado un segundo [NN/g: por
 * debajo la respuesta se siente inmediata; por encima hay que indicar que se
 * trabaja]. Un indicador que parpadeara en cada consulta rápida sería ruido.
 */
interface LaConsultaViva {
  readonly cargando: boolean;
  readonly tarda: boolean;
  /** Lo que se lee en la región: el texto que compone el motor. */
  readonly texto: string;
}

/**
 * ⭐ CUÁNDO SE DICE QUE ESTÁ TARDANDO. [NN/g] el umbral es **un segundo**: por
 * debajo la respuesta se siente inmediata y avisar sobraría; por encima, sin
 * indicador, la pantalla parece rota. Avanza tarda entre 0 y 8,4 s medidos.
 */
export const CUANDO_SE_DICE_QUE_TARDA_MS = 1000;

/** Lo que se lee mientras se pregunta. Conciso: es un estado, no una frase. */
export const MIENTRAS_SE_PREGUNTA = 'Preguntando a Avanza…';

/**
 * ⭐ Y la de la BiZi (2/09), que nombra a OTRO (§ 1.23 del notices).
 *
 * No es un adorno: son dos fuentes distintas con dos regímenes distintos, y
 * quien espera tiene derecho a saber a quién se le está preguntando. Decir
 * «Preguntando a Avanza…» mientras se consulta la sede del Ayuntamiento sería
 * atribuir el dato a quien no es.
 */
export const MIENTRAS_SE_PREGUNTA_AL_AYUNTAMIENTO = 'Preguntando al Ayuntamiento…';


/**
 * ⭐ EL AVISO DE DESVÍO, PARTIDO EN DOS NIVELES.
 *
 * [GOV.UK, *progressive disclosure*] esconder detrás de un disparador lo que no
 * hace falta al cargar. Y sus dos límites son los que deciden **dónde** se
 * corta: *«no ocultes información importante que deba estar presente siempre»* y
 * *«úsalo cuando el detalle solo beneficie a un grupo pequeño»*. El hecho —«la
 * 35 va hoy desviada»— es de los primeros: quien no lo lea se planta en una
 * parada por la que hoy no pasa nadie. La lista de ocho postes es de los
 * segundos: solo le sirve a quien fuera a uno de ellos.
 *
 * ⚠️ **Y el corte va por la marca, no por el primer `: `.** Hay un poste que
 * lleva dos puntos en el nombre: `Av. Del Cierzo / Av: Cañones De Zaragoza` —una
 * errata de `Av.` que viene en el feed, medida: 1 de 984—. Partir por el primer
 * separador que apareciera le habría cortado el nombre por la mitad el día que
 * ese poste saliera en un desvío.
 *
 * ⚠️ Y esto vuelve a leer el texto del aviso, como `notaDelHito`, por lo mismo:
 * `Aviso` es `{ texto }` y nada más. El día que el contrato le dé categoría
 * —y partes—, esto se cuelga de ella y deja de mirar palabras.
 */
export function enDosNiveles(texto: string): EnDosNiveles {
  const i = texto.indexOf(MARCA_DE_DESVIO);
  if (i < 0) {
    return { hecho: texto, detalle: null };
  }
  const corte = i + MARCA_DE_DESVIO.length;
  const resto = texto.slice(corte).replace(/^:\s*/, '');
  if (resto === '' || resto === '.') {
    return { hecho: texto, detalle: null };
  }
  return {
    hecho: `${texto.slice(0, corte)}.`,
    // El motor junta sus dos listas con `: `, y aquí son dos miembros de la
    // misma enumeración, no una segunda frase: el punto y coma es su signo.
    detalle: resto.replace(': para provisionalmente en ', '; para provisionalmente en '),
  };
}

/**
 * ⭐ LOS CUATRO HITOS: los pasos que **prometen algo** — una bici que haya, un
 * anclaje libre, un bus que venga.
 *
 * Escrito UNA vez porque lo preguntan tres sitios: la nota ámbar de la
 * plantilla, el resumen de arriba y el reparto de avisos. Tres copias de la
 * misma lista serían tres sitios donde olvidarse de añadir el quinto.
 */
const HITOS: ReadonlySet<Giro> = new Set<Giro>(['coge', 'aparca', 'sube', 'transborda']);

function esHito(paso: Paso): boolean {
  return HITOS.has(paso.giro);
}

/**
 * El sitio del que habla un hito: su **última** parte `via`.
 *
 * `null` si el paso no es un hito. Los pasos de andar también traen `via` —el
 * nombre de la calle—, y una calle no es un sitio del que se avise.
 */
/**
 * ⭐ LA LÍNEA DE UN HITO: **a la que se sube**, no las que aparecen en su texto.
 *
 * ⚠️ En un transbordo hay **dos**: de la 35 a la 31. La del hito es la 31 — el
 * aviso de la 35 explica el tramo que se acaba de terminar, y ya sale pegado a
 * la subida de la 35. Colgarlo también aquí lo diría dos veces y en el sitio
 * equivocado. Por eso no vale con «alguna de sus líneas»: hay que decir cuál.
 *
 *   `sube`       → `Sube a la línea 29 en el poste X`     → la PRIMERA `via`
 *   `transborda` → `En el poste X, transborda de la 35 a la 31` → la ÚLTIMA
 */
function lineaDelHito(paso: Paso): string | null {
  const vias = paso.partes.filter((p) => p.papel === 'via');
  if (vias.length === 0) {
    return null;
  }
  if (paso.giro === 'sube') {
    return vias[0]!.texto;
  }
  if (paso.giro === 'transborda') {
    return vias[vias.length - 1]!.texto;
  }
  return null;
}

function sitioDelHito(paso: Paso): string | null {
  const vias = paso.partes.filter((p) => p.papel === 'via');
  if (vias.length === 0) {
    return null;
  }
  // ⚠️ En el paso de transbordo el poste va **el PRIMERO** —«En el poste X,
  // transborda de la A a la B»— y las dos últimas `via` son líneas. En los
  // demás hitos el sitio es la última. Es la única excepción y va escrita.
  if (paso.giro === 'transborda') {
    return vias[0]!.texto;
  }
  if (paso.giro !== 'coge' && paso.giro !== 'aparca' && paso.giro !== 'sube' && paso.giro !== 'baja') {
    return null;
  }
  return vias[vias.length - 1]!.texto;
}

/**
 * ⭐ CUÁNTO SE ESPERA ANTES DE DECIR QUE SE ESTÁ TRABAJANDO: **un segundo**.
 *
 * [Nielsen Norman Group] *«para retrasos de más de 1 segundo hay que indicar
 * que el sistema está trabajando; más aún si el tiempo es variable»*. Aquí lo
 * es: el Generar en bus paga una consulta a Avanza que tarda entre nada y tres
 * segundos, y a veces se agota. Los demás modos contestan en 20 ms y por eso
 * el aviso no llega a asomar — que es justo lo que se quiere: un indicador que
 * sale siempre no informa de nada.
 */
const MS_ANTES_DE_AVISAR = 1000;

const FLECHAS: Readonly<Record<Giro, string>> = {
  salida: '◉',
  recto: '↑',
  'ligera-derecha': '↗',
  derecha: '↱',
  'cerrada-derecha': '⬎',
  'media-vuelta': '↩',
  'cerrada-izquierda': '⬐',
  izquierda: '↰',
  'ligera-izquierda': '↖',
  coge: '🚲',
  aparca: '🅿',
  sube: '🚌',
  baja: '🚏',
  // ⭐ El transbordo en el mismo poste: **un acto**, no dos flechas. Las dos
  // puntas dicen de qué se baja y a qué se sube sin partir el paso en dos.
  transborda: '⇄',
  llegada: '⚑',
};

/**
 * ⭐ CÓMO SE DICE LA VELOCIDAD, **por modo** (30/08, casilla 5).
 *
 * Va escrita al lado del tiempo, y esa es toda su razón de ser: el contrato
 * dice de `Trayecto.segundos` que es *«DERIVADO, no medido»*. Un «4 min» a
 * secas se leería como una promesa cronometrada, y aquí no se ha cronometrado
 * a nadie.
 *
 * ── ⭐ Por qué la palabra «de crucero», y por qué andando no la lleva ───────
 *
 * Andando hay **una sola** velocidad y los minutos son exactamente
 * `metros / 5 km/h`: ahí «a 5 km/h» es la cuenta entera y no hace falta más.
 *
 * Sobre ruedas **no**, y por tres razones a la vez: el techo legal de cada vía
 * recorta la velocidad del modo, los tramos que se cruzan **con el vehículo en
 * la mano** van a 5, y desde el remate del aparcabicis el viaje acaba
 * **andando**. Poner «a 18 km/h» a secas al lado de los minutos sería
 * exactamente la mentira que el empuje obligó a quitar el 30/08 por la mañana.
 *
 * «De crucero» es lo que lo hace verdad: dice que 18 es la velocidad a la que
 * se va cuando se va, no la media del viaje. **Los minutos siguen siendo la
 * suma real**, calculada tramo a tramo por el motor.
 *
 * ⚠️ Los números viven en `motor/src/rueda.ts` (`VELOCIDAD_KMH`) y en
 * `motor/src/etapas.ts` (`VELOCIDAD_MS`), y aquí solo se REPITEN. No hay forma
 * de atarlos sin meterlos en el contrato, y meterlos sería que la pantalla
 * recalculara lo que el motor ya calculó. El `Record` exhaustivo es lo que
 * queda: el día que entre un modo nuevo, esta tabla deja de compilar.
 */
const VELOCIDAD_DICHA: Readonly<Record<Modo, string | null>> = {
  andando: 'a 5 km/h',
  bici: 'pedaleando a 18 km/h de crucero',
  bizi: 'pedaleando a 20 km/h de crucero',
  // El patín no se pedalea: se circula. La velocidad es la misma que la bici.
  patin: 'a 18 km/h de crucero',
  // Estos tres no llevan coletilla: el bus la lleva en su propio resumen, y el
  // coche y la moto no ruedan a una velocidad de crucero que se pueda decir en
  // una frase — su tiempo sale de las penalizaciones de cada giro y de cada
  // semáforo, no de una media.
  bus: null,
  coche: null,
  // ⭐ La moto entró en el contrato el 4/09 y **esta tabla dejó de compilar**,
  //    que es exactamente para lo que está: el `Record` exhaustivo obliga a
  //    pasar por aquí. Va como el coche porque rueda como el coche.
  moto: null,
  // ⭐ Y la compartida el mismo día, con la casilla 2. **Volvió a dejar de
  //    compilar**, que es la segunda vez que este `Record` hace su trabajo.
  //
  //    ⚠️ Aquí SÍ habría una cifra que decir —los ciclomotores van capados a
  //       **45 km/h** por construcción [L1e-B], y el motor lo aplica arista a
  //       arista—, y aun así se calla. Un «a 45 km/h de crucero» sería la misma
  //       mentira que el empuje obligó a quitar el 30/08: el viaje empieza
  //       **andando** hasta la moto, y ese tramo pesa. Los minutos siguen siendo
  //       la suma real, calculada tramo a tramo.
  yego: null,
};

/**
 * ⭐ EL UMBRAL DE PRECISIÓN: cuánto radio de confianza se acepta.
 *
 * [DOC MDN] `coords.accuracy` es *«a strictly positive double representing the
 * accuracy, with a 95% confidence level, of the latitude and longitude,
 * expressed in meters»*. No es un adorno: es lo único que separa un GPS de un
 * reposicionamiento por IP, que puede clavar el centro de la ciudad con un
 * radio de kilómetros y llegar aquí con la misma cara que una posición buena.
 *
 * 100 m es un corte GRUESO a propósito, y **no está medido aquí**: no se puede
 * medir desde el proyecto, porque depende del aparato de quien lo use. Lo que
 * sí se sabe es que la trilateración por wifi de un portátil se mueve en
 * decenas de metros y el reposicionamiento por IP en kilómetros — dos órdenes
 * de magnitud entre uno y otro, así que el corte no necesita ser fino. Y
 * pasarse sale barato: el campo queda editable a mano.
 */
const PRECISION_MAXIMA_M = 100;

/**
 * ⭐ EL UMBRAL DE DISTANCIA: cuán lejos puede quedar el portal más cercano para
 * que decir «estás en él» siga siendo verdad.
 *
 * MEDIDO sobre el censo, no supuesto. Desde puntos de calle de Zaragoza el
 * portal más cercano queda a: Paseo Independencia 8 m, Plaza España 12 m,
 * Casetas 22 m, Plaza del Pilar 42 m, Estación Delicias 78 m, recinto Expo
 * 100 m. 150 m los acepta todos con holgura.
 *
 * **Lo que este número NO hace, y hay que decirlo: no comprueba si estás en
 * Zaragoza.** Se midió si podía, y no puede. El Polígono PLAZA está en
 * Zaragoza y su portal más cercano queda a 1.423 m — más lejos que el centro
 * de Utebo, que no lo está (1.387 m). La ventana está invertida y no hay corte
 * que separe los dos grupos; un rectángulo tampoco sirve, porque Utebo,
 * Cuarte, Villanueva de Gállego y María de Huerva caen dentro del que abarca
 * el censo.
 *
 * Por eso el mensaje habla de la distancia al portal y NO del término
 * municipal: decir «no estás en Zaragoza» sería decírselo a alguien parado en
 * Movera (853 m) o en Juslibol (662 m), que sí lo están.
 */
const DISTANCIA_MAXIMA_M = 150;

/**
 * Con qué se le pide la posición al navegador. Las tres opciones, declaradas.
 *
 * [DOC MDN] `maximumAge: 0` significa que *«the device cannot use a cached
 * position and must attempt to retrieve the real current position»*. Es el
 * valor por defecto y se escribe igual, porque aquí es una decisión: una
 * posición guardada de otro barrio rellenaría una dirección equivocada sin que
 * nada lo delatara.
 *
 * [DOC MDN] `timeout` por defecto es `Infinity`, y entonces *«getCurrentPosition()
 * won't return until the position is available»*. Un botón que se queda
 * pensando para siempre no es un botón: 10 segundos y se dice que no se pudo.
 *
 * [DOC MDN] `enableHighAccuracy: true` pide que *«the application would like to
 * receive the best possible results»*, a cambio de *«slower response times or
 * increased power consumption»*. Se paga: lo que se está buscando es un portal
 * concreto, no un barrio.
 */
const OPCIONES_UBICACION: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/** [DOC MDN] Los tres códigos de `GeolocationPositionError`, con su número. */
const PERMISO_DENEGADO = 1;
const POSICION_NO_DISPONIBLE = 2;
const SE_AGOTO_EL_TIEMPO = 3;

/**
 * Un mensaje por cada fallo tipado, en ámbar y en cristiano.
 *
 * Ninguno se disculpa ni echa la culpa: dicen qué ha pasado, qué se puede
 * hacer al respecto si se puede, y que la calle siempre se puede escribir a
 * mano — que es la salida que nunca falla.
 */
const MENSAJES_DE_FALLO: Readonly<Record<number, string>> = {
  [PERMISO_DENEGADO]:
    'Sin permiso de ubicación. Puedes dárselo al navegador en el candado de la ' +
    'barra de direcciones, o escribir la calle a mano.',
  [POSICION_NO_DISPONIBLE]:
    'El navegador no ha podido averiguar dónde estás. Inténtalo otra vez, o ' +
    'escribe la calle a mano.',
  [SE_AGOTO_EL_TIEMPO]:
    'Se ha tardado demasiado en localizarte. Inténtalo otra vez, o escribe la ' +
    'calle a mano.',
};

/**
 * El estado de UN lado de la dirección: su calle y su portal, cada uno con lo
 * escrito, lo elegido y si ya se salió de él.
 *
 * **Vive aquí, en el padre, y no dentro de cada campo.** Los campos siguen
 * siendo quienes lo escriben cuando el usuario teclea o pulsa una sugerencia
 * —el camino de `elegir()` no se toca, que es la ley de la entrada nº4—, pero
 * quien lo GUARDA es la pantalla. Hizo falta porque hay dos gestos que fijan
 * una dirección sin que nadie teclee: invertir origen⇄destino y «Mi
 * ubicación». Con el estado encerrado en el campo no había puerta por donde
 * entrar —medido: su API pública era `['constructor']`—, y rellenar solo el
 * texto habría sido el fallo de la nº4 con otro disfraz.
 */
function ladoVacio() {
  return {
    /**
     * ⭐ QUÉ SE ESTÁ BUSCANDO en este lado: una dirección o una categoría de
     * sitio. Lo elige el desplegable que hay delante del cajetín.
     *
     * **`via` por defecto** —«Dirección»— y es [PROPIO] declarado: abrir la
     * pantalla tiene que comportarse como se comportaba ayer. Quien nunca toque
     * el desplegable no se entera de que existe.
     *
     * Es el mismo tipo que usan los iconos, y no una copia: lo que el campo
     * BUSCA y lo que el icono DIBUJA son la misma pregunta —«¿qué clase de cosa
     * es esto?»— y tenerlo dos veces sería tenerlo mal una de las dos.
     */
    tipo: signal<Clase>('via'),
    /** Lo escrito en el campo de calle. */
    calle: signal(''),
    /** La vía elegida de la lista. Guarda el CÓDIGO, no solo el texto. */
    via: signal<Via | null>(null),
    /** Si ya se salió del campo de calle: antes de eso no se regaña. */
    calleTocada: signal(false),
    /** Lo escrito en el campo de portal, que es filtro y es lo que se lee. */
    portalTexto: signal(''),
    /**
     * El portal elegido de la lista de la vía. Guarda el CÓDIGO, no el número
     * escrito — como la vía, y por la misma razón: un `12` tecleado no
     * identifica ninguna puerta, y podía no existir.
     */
    portal: signal<Portal | null>(null),
    /** Si ya se salió del campo de portal. */
    portalTocado: signal(false),
    /**
     * ⭐ El SITIO elegido en este lado, o `null` si aquí hay una dirección.
     *
     * Vive **dentro del lado** y no suelto, y esa es toda la mecánica de la
     * simetría del 23/08: el ⇅ intercambia lados enteros, así que el sitio
     * cruza con lo demás **sin una sola línea que hable de él**. Cuando estuvo
     * fuera —un día— el botón tenía que decidir qué hacer con él, que es
     * justamente la decisión que no había que tomar.
     *
     * Un lado tiene vía+portal **o** sitio, nunca las dos: elegir una cosa
     * apaga la otra.
     */
    sitio: signal<Sitio | null>(null),
  };
}

/** Un lado del formulario, ya montado. */
type Lado = ReturnType<typeof ladoVacio>;

/** Cambia de sitio los valores de dos señales. Sin mirar lo que llevan. */
function intercambiar<T>(a: WritableSignal<T>, b: WritableSignal<T>): void {
  const guardado = a();
  a.set(b());
  b.set(guardado);
}

/**
 * Lo que hay pintado abajo: **el trayecto que contestó el motor, y las dos
 * direcciones tal como estaban cuando se pidió**.
 *
 * Las direcciones se guardan aquí en vez de leerse del formulario a propósito.
 * Después de generar, el formulario sigue vivo: se puede cambiar una calle sin
 * volver a pulsar, y entonces la cabecera diría de dónde a dónde va una ruta
 * que no es la que está en el mapa. Guardándolas con el resultado, lo que se
 * lee arriba y lo que se ve abajo son siempre la misma cosa.
 *
 * Y por eso es UNA señal y no cuatro: cuatro señales pueden quedarse a medio
 * actualizar; un objeto entero, no.
 */
interface Resultado {
  readonly origen: string;
  readonly destino: string;
  /**
   * ⭐ De qué clase era cada extremo **cuando se pidió la ruta**.
   *
   * Se guarda aquí por el mismo motivo que los nombres, y no es un detalle: si
   * el icono se leyera del formulario, cambiar el destino a una farmacia
   * después de generar pondría una cruz verde en el mapa de una ruta que va a
   * un portal. La cabecera, los marcadores y los pasos cuentan siempre la
   * misma ruta porque salen todos del mismo objeto.
   */
  readonly capaOrigen: Clase;
  readonly capaDestino: Clase;
  /**
   * ⭐ Y **dónde se pidió aparcar cuando se pidió la ruta**, o `null`.
   *
   * Por el mismo motivo que las dos clases de arriba: si la sugerencia cruzada
   * leyera el formulario, cambiar el radio a mano después de generar pondría
   * junto al hito de una ruta de zona azul un botón que dice «Sugerir zona azul
   * cercana». La cabecera, los marcadores, los pasos y el atajo cuentan siempre
   * la misma ruta porque salen todos del mismo objeto.
   *
   * Es **lo que viajó**, no lo que el formulario tenía: sale de
   * `loDelVehiculo()`, que es la misma función que arma la petición, así que en
   * los otros seis modos vale `null` aunque el radio del coche se hubiera
   * quedado marcado — **la moto incluida**, que no elige dónde deja.
   */
  readonly aparcamiento: TipoDeAparcamiento | null;
  readonly trayecto: Trayecto;
}

/** Cómo se escribe una dirección municipal completa: «CALLE BURGOS [CASETAS] 4». */
function comoSeLeeLaDireccion(via: Via, portal: Portal): string {
  return `${comoSeVeLaVia(via)} ${portal.numero}`;
}

/**
 * Los metros como se leen, no como se guardan.
 *
 * Por debajo del kilómetro, tal cual vienen: el motor ya los redondea —al metro
 * hasta 100, a la decena por encima—, así que aquí no se vuelve a tocar. Por
 * encima, en kilómetros con un decimal, que es como se dice una distancia larga
 * a pie: «3,5 km», no «3.482 m».
 */
function comoSeLeenLosMetros(metros: number): string {
  if (metros < 1000) {
    return `${metros} m`;
  }
  return `${(metros / 1000).toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

/**
 * La duración, **dicha como lo que es**: una división, no un cronómetro.
 *
 * Por debajo del minuto no se redondea a «~1 min», que sería inflar siete
 * segundos hasta sesenta: se dice «menos de 1 min», que es verdad y es igual de
 * corto. El porqué de cada coletilla está en `VELOCIDAD_DICHA`.
 */
function comoSeLeeLaDuracion(segundos: number, modo: Modo = 'andando'): string {
  // ⭐ LA COLETILLA, POR MODO (30/08, casilla 5). Se cayó entera con el empuje
  // —«a 5 km/h» sobre ruedas era falso— y vuelve dicha como lo que es: la
  // velocidad de CRUCERO, no la media del viaje. Ver `VELOCIDAD_DICHA`.
  const dicha = VELOCIDAD_DICHA[modo];
  const coletilla = dicha === null ? '' : ` ${dicha}`;
  if (segundos < 60) {
    return `menos de 1 min${coletilla}`;
  }
  return `~${Math.round(segundos / 60)} min${coletilla}`;
}

/**
 * ⭐ LAS FAMILIAS DE LA PRIMERA FILA (2/09, punto 11).
 *
 * ⚠️ **Esto NO es del contrato y no debe llegar a serlo.** `Modo` es lo que el
 *    motor entiende y son siete; `Familia` es cómo se pregunta en la pantalla.
 *    Es una palabra de maquetación: si algún día se colara en
 *    `@desplazame/tipos`, el motor tendría que saber cómo está repartida una
 *    botonera, que es exactamente lo que no le importa.
 *
 * Los nombres que coinciden con un `Modo` lo hacen porque esas familias tienen
 * una sola opción, no porque sean lo mismo — la bici se pregunta en dos pasos.
 *
 * ⭐ **Y `moto` YA TIENE BOTÓN** (4/09, casilla 3). Entró en el tipo el mismo
 *    día que el contrato estrenó el séptimo modo —`familiaDe` es total sobre
 *    `Modo`— y estuvo unas horas sin fila: la primera enseñaba cinco de las
 *    seis. Ahora las seis están, y quien decide cuáles se pintan sigue siendo
 *    la lista `familias`, no este tipo — nadie itera una unión.
 */
type Familia = 'andando' | 'bus' | 'bici' | 'patin' | 'coche' | 'moto';

/**
 * ⭐ EL DISTINTIVO AMBIENTAL, y **es palabra de esta pantalla**, no del contrato.
 *
 * Al motor no le importa qué etiqueta lleva el coche: le importa **si puede
 * entrar en la Zona de Bajas Emisiones**, que es una sola pregunta de sí o no
 * —`puedeEntrarEnLaZbe`— y es lo único que viaja. La traducción de las seis
 * respuestas a esa pregunta vive aquí y en un solo sitio, la tabla
 * `distintivos`, para que no haya dos maneras de contestarla.
 *
 * ⚠️ Y `nolose` **no es un `false`**: es la ausencia del parámetro. Ver la tabla.
 */
type Distintivo = 'cero' | 'eco' | 'c' | 'b' | 'sin' | 'nolose';

/**
 * ⭐ SI EL COCHE SIN DISTINTIVO ESTÁ REGISTRADO EN LA ZBE.
 *
 * Los catorce casos del trámite 42155 —residente, plaza de garaje, local
 * comercial, PMR, matrícula extranjera, histórico, taxi adaptado…— caben en una
 * sola pregunta desde donde el motor mira: **si puede entrar o no**. Enumerarlos
 * en la pantalla sería pedirle a quien busca una ruta que se clasifique.
 */
type Autorizacion = 'si' | 'no';

/**
 * ⭐ POR DÓNDE SE RECONOCE UN AVISO DE LA ZONA DE BAJAS EMISIONES.
 *
 * Es la misma llave frágil que `MARCA_DE_DESVIO` y compañía, y por lo mismo:
 * `Aviso` es `{ texto, paso? }` y no trae categoría. Lo que **sí** trae desde la
 * casilla 1b es `paso`, y eso es lo que se usa para repartir; esta marca solo
 * decide si **añadir** el aviso positivo del distintivo, que es otra pregunta.
 */
const MARCA_DE_ZBE = 'Zona de Bajas Emisiones';

/**
 * ⭐ DÓNDE VIVE LA CAPA DE LA ZONA, servida como asset desde `app/data/`.
 *
 * Es el mismo fichero que el motor cocina y con el que marca las aristas
 * (§ 1.30). Se sirve **solo éste** de toda la carpeta: ver `angular.json`.
 */
const CAPA_DE_LA_ZBE = 'data/2026-09-02_wfs_movilidad-MU1_ZBE.json';

/**
 * ⭐ DE LA LETRA QUE LA DGT USA AL RADIO DE LA PANTALLA.
 *
 * Vivía dentro de `acabaLaDgt` cuando solo marcaba el radio. Desde el 4/09 la
 * región también lo mira —para decir «Distintivo ambiental CERO» con la misma
 * palabra que lleva el botón que se acaba de marcar—, así que sube aquí: dos
 * copias de esta tabla es exactamente la manera de que un día la región diga
 * una cosa y la botonera otra.
 */
const EL_RADIO_DE_LA_LETRA: Readonly<Record<string, Distintivo>> = {
  '0': 'cero',
  ECO: 'eco',
  C: 'c',
  B: 'b',
};

/** La hora de un instante ISO, para decir de cuándo es un dato de ahora. */
function horaDe(iso: string): string {
  const cuando = new Date(iso);
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${dos(cuando.getHours())}:${dos(cuando.getMinutes())}`;
}

/**
 * De qué familia es un modo. **La única línea donde vive el reparto**, y por
 * eso está fuera del componente: la usan la pantalla y sus jueces.
 *
 * ⭐ **Dos modos no se llaman como su familia**, y son los dos compartidos:
 * `bizi` es una bici y `yego` es una moto. No es casualidad — un sistema
 * compartido no es otro vehículo, es el mismo vehículo con otra manera de
 * conseguirlo, y por eso comparte botón con el privado.
 *
 * ⚠️ Esta función **dejó de compilar el 4/09** al entrar `yego` en el contrato,
 *    con `Type '"yego"' is not assignable to type 'Familia'`. Es la segunda vez
 *    que pasa —la primera fue con `moto`— y es exactamente para lo que el tipo
 *    es una unión cerrada: el día que entre un modo nuevo, alguien tiene que
 *    decidir en qué fila va en vez de que aparezca solo.
 */
function familiaDe(modo: Modo): Familia {
  if (modo === 'bizi') {
    return 'bici';
  }
  return modo === 'yego' ? 'moto' : modo;
}

@Component({
  selector: 'app-buscador',
  imports: [Mapa, AutocompletarVia, SelectorPortal, IconoCapa, NgTemplateOutlet],
  templateUrl: './buscador.html',
  styleUrl: './buscador.css',
})
export class Buscador {
  /**
   * Para preguntarle al motor por el portal más cercano.
   *
   * Aquí no vale `httpResource`, que es lo que usan los dos campos: aquel pide
   * solo cuando cambia una señal, y esto es un botón — se pregunta cuando se
   * pulsa, una vez, y con unas coordenadas que no existían un instante antes.
   */
  private readonly http = inject(HttpClient);

  /**
   * Qué lado pulsó «Mi ubicación». La geolocalización contesta por retrollamada
   * y el motor por HTTP, así que entre la pulsación y el relleno hay dos saltos
   * y nadie más lleva el dato.
   */
  private pidioUbicacion: Lado | null = null;

  /** Se está esperando a la posición o al motor: el botón no se repulsa. */
  protected readonly buscandoUbicacion = signal(false);

  /** Lo último que salió mal con la ubicación, para decirlo en ámbar. */
  protected readonly avisoUbicacion = signal<string | null>(null);

  /**
   * ⭐ LOS SIETE MODOS: su texto, y el porqué de cada uno.
   *
   * La `etiqueta` es lo ÚNICO visible, y desde el 2/09 sale por **un** sitio: la
   * línea «Modo:» del resultado. Quien pinta la primera fila es `familias`, y
   * quien pinta la segunda, `bicis`. El `id` es del contrato (`Modo`) y es lo
   * que viaja.
   *
   * ── Por qué seis, y por qué estos ───────────────────────────────────────
   *
   * Hasta el 30/08 eran cuatro, y **«Bici / Patinete» mandaba `bici` para los
   * dos**. Aquello era verdad mientras el motor tenía una sola rueda; desde la
   * casilla 3 tiene tres, porque **son tres tablas legales distintas**:
   *
   * - la **bici privada** puede ir por vía ciclista, calzada y calle
   *   residencial [ORD art. 56.2.c];
   * - el **patín (VMP)** solo por donde el art. 56.3 le deja, y en calzada
   *   únicamente si es vía pacificada — un carril por sentido **y** 30 km/h
   *   [ORD art. 15.2.a.ii], sobre el límite del art. 50 RGC;
   * - la **BiZi** es la bici, pero **no sale del término municipal**, porque la
   *   estación de vuelta está dentro.
   *
   * Un patinetero que pulsara el botón de la bici recibía una ruta legal para
   * la bici e ilegal para él. Eso es lo que cierra esta casilla.
   *
   * ── El orden y las palabras ─────────────────────────────────────────────
   *
   * El orden es el que firmó Antonio el 28/08 y no es alfabético: va de lo que
   * no lleva vehículo a lo que más ocupa — a pie, colectivo, las tres ruedas
   * (cada una con su tabla) y el coche.
   *
   * **La palabra que va tras la barra lleva mayúscula**, y es una decisión de
   * peso visual, no un despiste: la norma pediría minúscula. En el README, que
   * es prosa y no botón, va en minúscula.
   *
   * Y aquí **el patín SÍ dice «VMP»**, al revés de lo que se decidió el 18/08
   * para el botón viejo. Entonces se evitó la jerga porque el botón valía para
   * los dos vehículos y la palabra corriente bastaba; ahora hay que distinguir
   * tres ruedas a golpe de vista, y «VMP» es exactamente lo que dice la señal
   * de la calle y la Ordenanza. La jerga que el usuario ya ha visto en la vía
   * pública deja de ser jerga.
   *
   * ── `todavia`: los dos que no se le piden al motor ──────────────────────
   *
   * Bus y coche están en la pantalla desde el 18/08 por honestidad —el
   * producto los promete—, y no hay motor detrás: llegan con los puntos 10 y
   * 11 del plan. Su frase se escribe AQUÍ, y por eso no viajan.
   *
   * Es deliberado y tiene su prueba: pedirle al motor un modo que se sabe que
   * no calcula gastaba un viaje para traer un aviso, y con el motor caído ese
   * viaje contestaba «No se pudo preguntar al motor», que es falso — el coche
   * no dependería del motor ni estando arrancado. El día que el punto 10
   * aterrice, esta fila pierde su `todavia` y empieza a viajar como las demás.
   */
  protected readonly modos: ReadonlyArray<{
    id: Modo;
    etiqueta: string;
    /** Por qué no se le pide al motor, o `null` si sí se le pide. */
    todavia: string | null;
  }> = [
    { id: 'andando', etiqueta: 'Andando', todavia: null },
    // ⭐ El bus perdió su `todavia` el 31/08: el punto 10 aterrizó y viaja
    // como las demás. El coche sigue con el suyo hasta el punto 11.
    { id: 'bus', etiqueta: 'Bus / Tranvía', todavia: null },
    { id: 'bici', etiqueta: 'Bici privada', todavia: null },
    { id: 'patin', etiqueta: 'Patín (VMP)', todavia: null },
    { id: 'bizi', etiqueta: 'BiZi', todavia: null },
    // ⭐ La moto entró el 4/09 con la casilla 1 del punto 13: rueda por la red
    // del coche y remata siempre en un aparcamoto. Nació sin `todavia` — el
    // motor ya la sabía andar antes de que existiera su botón.
    { id: 'moto', etiqueta: 'Moto', todavia: null },
    // ⭐ Y la compartida, con la casilla 2 del mismo día. La etiqueta es la
    // marca a secas: en el resultado se lee «Modo: YeGo», y en la segunda fila
    // «Pública YeGo» — leídas en cadena con «Moto» de arriba, dicen lo que son.
    { id: 'yego', etiqueta: 'YeGo', todavia: null },
    // ⭐ Y el coche perdió el suyo el 3/09: el punto 12 aterrizó —casillas 1a,
    // 1b y 2— y viaja como las demás. Ya no queda ninguno con `todavia`; el
    // campo se queda porque el mecanismo sigue siendo el bueno para el próximo.
    { id: 'coche', etiqueta: 'Coche', todavia: null },
  ];

  /**
   * ⭐ LA PRIMERA FILA, QUE DESDE EL 2/09 YA NO ES LA LISTA DE MODOS (punto 11).
   *
   * Seis botones en una fila era uno más de los que el patrón aguanta —[DOC
   * sistemas de diseño · control segmentado] el rango es de **2 a 5 opciones
   * con etiqueta**—, y encima repartía mal: **«Bici privada» y «BiZi» son la
   * misma pregunta** —¿en qué te mueves? en bici— con dos respuestas a una
   * segunda pregunta —¿tuya o de la ciudad?—. Puestas al mismo nivel que
   * «Andando» y «Coche», obligaban a leer las seis para descubrir que dos eran
   * hermanas.
   *
   * Así que la fila baja a **CINCO**, que es el tope del patrón, y la segunda
   * pregunta se revela **solo cuando se ha contestado la primera** [DOC GOV.UK,
   * revelado condicional]: es el mismo mecanismo que el número de portal y que
   * «¿Qué ruta prefieres?», y el mismo argumento — lo que no aplica **no está**,
   * no está apagado.
   *
   * ⚠️ **Y el contrato NO se entera.** `Familia` es una palabra de esta
   *    pantalla y no existe en `@desplazame/tipos`: lo que viaja a `/api/ruta`
   *    sigue siendo `Modo`, y sigue siendo `bici` o `bizi` como el 30/08. El
   *    motor no se ha tocado.
   *
   * `porDefecto` es el modo con el que se ENTRA en la familia. Solo la bici
   * tiene dos, y entra por la privada: es la que no depende de que haya una
   * estación cerca ni una bici suelta en ella.
   *
   * ── ⭐ Y VUELVEN A SER SEIS (4/09, punto 13 casilla 3) ───────────────────
   *
   * La moto entra **entre el patín y el coche**, que es su sitio en el criterio
   * que ordena esta fila desde el 28/08: de lo que no lleva vehículo a lo que
   * más ocupa. Es el primer vehículo de motor, y el coche sigue cerrando.
   *
   * ⚠️ **Seis pasa de las cinco del patrón, y hay que decirlo.** [DOC sistemas
   *    de diseño · control segmentado] el rango es de 2 a 5 opciones con
   *    etiqueta, y **ese fue el argumento entero del 2/09** para bajar de seis a
   *    cinco llevándose las dos bicis a su propia fila. La sexta vuelve por
   *    decisión del encargo, no por descuido: la moto **no es la segunda mitad
   *    de ninguna otra pregunta** —no hay «¿qué moto?» que revelar—, así que
   *    partirla en dos filas habría sido inventar una pregunta para que cupiera.
   *
   *    Lo que hay que vigilar es la SÉPTIMA. La caja se dobla sola —`flex-wrap`,
   *    y a 360 px ya salían tres filas de dos—, así que el ancho no es el
   *    problema; el problema es que una fila de siete deja de leerse de un
   *    vistazo. La medida en Chrome está en `app/e2e/moto.mjs`.
   */
  protected readonly familias: ReadonlyArray<{
    id: Familia;
    etiqueta: string;
    porDefecto: Modo;
  }> = [
    { id: 'andando', etiqueta: 'Andando', porDefecto: 'andando' },
    { id: 'bus', etiqueta: 'Bus / Tranvía', porDefecto: 'bus' },
    { id: 'bici', etiqueta: 'Bici', porDefecto: 'bici' },
    { id: 'patin', etiqueta: 'Patín (VMP)', porDefecto: 'patin' },
    { id: 'moto', etiqueta: 'Moto', porDefecto: 'moto' },
    { id: 'coche', etiqueta: 'Coche', porDefecto: 'coche' },
  ];

  /**
   * ⭐ LA SEGUNDA FILA, y **sus dos ids SON los del contrato**, no una
   * traducción. Lo que se marca aquí es literalmente lo que se le manda al
   * motor; no hay tabla en medio que pueda desalinearse.
   *
   * Las etiquetas son cortas porque la primera fila ya ha dicho «Bici»: leídas
   * en cadena dan «Bici privada» y «Bici pública BiZi», que es como se llaman.
   * **«Pública» va delante de «BiZi»** porque es lo que distingue —la marca
   * sola no dice de quién es la bici a quien no la conozca—.
   */
  protected readonly bicis: ReadonlyArray<{ id: Modo; etiqueta: string }> = [
    { id: 'bici', etiqueta: 'Privada' },
    { id: 'bizi', etiqueta: 'Pública BiZi' },
  ];

  /**
   * ⭐ Y LA SEGUNDA FILA DE LA MOTO (4/09, punto 13 casilla 2), **con la misma
   * anatomía y por la misma razón**.
   *
   * `moto` y `yego` son la misma pregunta contestada dos veces —«¿en qué te
   * mueves?» en moto, «¿tuya o de la ciudad?»—, igual que las dos bicis.
   * Ponerlas al mismo nivel arriba subiría la primera fila a **siete**, que es
   * dos por encima del rango del control segmentado [DOC sistemas de diseño: de
   * 2 a 5 con etiqueta], y obligaría a leerlas todas para descubrir que dos son
   * hermanas — que es el fallo que el 2/09 se arregló con la bici.
   *
   * Las etiquetas son cortas porque la primera fila ya ha dicho «Moto»: leídas
   * en cadena dan «Moto privada» y «Moto pública YeGo». **«Pública» va delante
   * de «YeGo»** por lo mismo que va delante de «BiZi»: la marca sola no dice de
   * quién es la moto a quien no la conozca.
   *
   * Y **sus dos ids SON los del contrato**, sin tabla en medio que pueda mentir.
   */
  protected readonly motos: ReadonlyArray<{ id: Modo; etiqueta: string }> = [
    { id: 'moto', etiqueta: 'Privada' },
    { id: 'yego', etiqueta: 'Pública YeGo' },
  ];

  /**
   * ⭐ LA PREGUNTA DEL APARCAMIENTO, y **sus cuatro ids SON los del contrato**.
   *
   * Como los dos de la bici: lo que se marca aquí es literalmente lo que viaja
   * en `PeticionDeRuta.aparcamiento`, sin tabla en medio que pueda mentir. Y por
   * eso el id es `azul` y no `esro`: **la etiqueta y el valor dicen la misma
   * palabra**, que es la del Reglamento Municipal del SER —*«los sectores ESRE
   * ("zona naranja") como en los de rotación, ESRO ("zona azul")»*—.
   *
   * ⚠️ **Eran TRES hasta el 4/09**, con un «Regulado» que valía por las dos
   *    zonas. Y esa respuesta no servía: la azul se paga por horas y en la
   *    naranja **aparca quien vive allí**, así que la mitad de las veces mandaba
   *    a un forastero a una plaza de residente sin decírselo. Quien pregunta
   *    dónde dejar el coche no está preguntando por «lo regulado».
   */
  protected readonly aparcamientos: ReadonlyArray<{ id: TipoDeAparcamiento; etiqueta: string }> = [
    { id: 'azul', etiqueta: 'Zona azul' },
    { id: 'naranja', etiqueta: 'Zona naranja' },
    { id: 'discapacitado', etiqueta: 'Discapacitado' },
    { id: 'gratuito', etiqueta: 'Gratuito' },
  ];

  /**
   * ⭐ SIN NADA MARCADO, y eso es la respuesta por defecto: **no se aparca**.
   *
   * [GOV.UK] en una pregunta no se preinfluye. Marcar «Zona azul» de antemano le
   * pondría al viaje un remate que nadie ha pedido —y le cambiaría el destino
   * real, que pasaría a ser un bordillo—. Sin tocarlo, el parámetro **se omite**
   * y sale el viaje hasta la puerta, que es el de la casilla 1b.
   */
  protected readonly aparcamiento = signal<TipoDeAparcamiento | null>(null);

  /**
   * ⭐ LA PREGUNTA DEL DISTINTIVO, y su traducción a la única que el motor hace.
   *
   * `puedeEntrar` es lo que viaja: `true` para las cuatro etiquetas que [FAQ de
   * la sede, leída el 2/09] declara con *«libre acceso, circulación y
   * estacionamiento sin necesidad de registrarse»*, `false` para los que no
   * tienen ninguna, y **`null` para «No lo sé»: entonces el parámetro NO
   * VIAJA**.
   *
   * ⚠️ Traducir «No lo sé» a `false` sería decidir por quien no ha decidido, y
   *    encima por el lado caro: le mandaría a rodear la zona o a rematar en un
   *    aparcamiento público sin que su coche lo necesite. Omitirlo deja la
   *    conducta de siempre — el motor avisa de la norma y no veta nada—.
   *
   * ⚠️ Y son SEIS, que pasa de las cinco del control segmentado de arriba. No
   *    es el mismo patrón: aquello es una fila de modos, y esto es una pregunta
   *    con sus respuestas. [GOV.UK] para una lista corta van radios, y el
   *    desplegable es *«el último recurso»*.
   */
  protected readonly distintivos: ReadonlyArray<{
    id: Distintivo;
    etiqueta: string;
    /** Lo que se le manda al motor. `null` es «no se manda nada». */
    puedeEntrar: boolean | null;
  }> = [
    { id: 'cero', etiqueta: 'CERO', puedeEntrar: true },
    { id: 'eco', etiqueta: 'ECO', puedeEntrar: true },
    { id: 'c', etiqueta: 'C', puedeEntrar: true },
    { id: 'b', etiqueta: 'B', puedeEntrar: true },
    { id: 'sin', etiqueta: 'Sin etiqueta', puedeEntrar: false },
    { id: 'nolose', etiqueta: 'No lo sé', puedeEntrar: null },
  ];

  /** Tampoco viene marcado ninguno: es una pregunta, no un ajuste. */
  protected readonly distintivo = signal<Distintivo | null>(null);

  /**
   * ⭐ LA QUINTA PREGUNTA REVELADA, y **solo con «Sin etiqueta»** (3/09).
   *
   * A quien ha dicho que lleva una B, preguntarle si está registrado sería
   * ofrecerle un trámite que no existe para él: [§ 1.32, literal] *«Si su
   * vehículo tiene derecho a distintivo ambiental, NO NECESITA Y NO PUEDE
   * OBTENER autorización registral»*. Y a quien ha dicho «No lo sé» tampoco:
   * primero hay que saber si hace falta.
   */
  protected readonly autorizaciones: ReadonlyArray<{ id: Autorizacion; etiqueta: string }> = [
    { id: 'si', etiqueta: 'Sí' },
    { id: 'no', etiqueta: 'No' },
  ];

  /** Sin marcar, como las otras dos. Ver `loDelVehiculo` para qué manda el vacío. */
  protected readonly autorizacion = signal<Autorizacion | null>(null);

  /**
   * Quién ve la pregunta: **el vehículo de motor sin distintivo**, y nadie más.
   *
   * Cuelga de `preguntaLaZbe` y no de `eligeCoche` porque cuelga de la respuesta
   * anterior: quien ha dicho «Sin etiqueta» tiene la misma duda vaya en coche o
   * en moto, y el registro de la ZBE es el mismo trámite 42155 para los dos.
   */
  protected readonly preguntaAutorizacion = computed(
    () => this.preguntaLaZbe() && this.distintivo() === 'sin',
  );

  protected elegirAutorizacion(cual: Autorizacion): void {
    this.autorizacion.set(cual);
  }

  // ── ⭐ LA MATRÍCULA (3/09) ──────────────────────────────────────────────────
  //
  // ⛔ **No se guarda en ningún sitio.** Vive en una señal mientras la pantalla
  //    está abierta, viaja una vez a `/api/distintivo` y ya. Ni `localStorage`,
  //    ni la URL, ni el aviso: es un dato personal indirecto.

  protected readonly matricula = signal('');

  /** Lo último que la DGT contestó, o `null` si aún no se ha preguntado. */
  protected readonly loDeLaDgt = signal<DistintivoConsultado | null>(null);
  protected readonly consultandoDgt = signal(false);
  /** Solo para el indicador de espera: aparece si tarda más de un segundo. */
  protected readonly tardaLaDgt = signal(false);
  private relojDeLaDgt: ReturnType<typeof setTimeout> | null = null;

  protected escribirMatricula(valor: string): void {
    this.matricula.set(valor.toUpperCase());
  }

  /** Con el campo vacío no se pregunta: el botón no hace nada que contar. */
  protected readonly sePuedeConsultar = computed(() => this.matricula().trim() !== '');

  /**
   * ⭐ CADA PULSACIÓN CONSULTA, y es a propósito [el patrón del vivo, 1/09].
   *
   * No se cachea la respuesta ni se compara con la anterior: quien vuelve a
   * pulsar quiere saber **ahora**. El motor deduplica lo que esté en vuelo, que
   * es otra cosa que guardar.
   *
   * ⚠️ **El botón NO se deshabilita mientras carga**: `disabled` lo saca del
   *    orden de tabulación y quien navega con teclado pierde el sitio justo al
   *    pulsar. Sigue enfocable, y la región dice en qué estado está.
   */
  protected consultarDistintivo(): void {
    const matricula = this.matricula().trim();
    if (matricula === '') {
      return;
    }
    this.consultandoDgt.set(true);
    this.loDeLaDgt.set(null);
    if (this.relojDeLaDgt !== null) {
      clearTimeout(this.relojDeLaDgt);
    }
    this.tardaLaDgt.set(false);
    this.relojDeLaDgt = setTimeout(() => this.tardaLaDgt.set(true), 1000);

    this.http
      .get<DistintivoConsultado>('/api/distintivo', { params: { matricula } })
      .subscribe({
        next: (r) => this.acabaLaDgt(r),
        // ⚠️ El 400 del formato llega por aquí —es un error HTTP— y su cuerpo es
        //    una respuesta buena: se enseña igual. Lo que no se puede es callar.
        error: (fallo: { readonly error?: DistintivoConsultado }) =>
          this.acabaLaDgt(
            fallo.error && typeof fallo.error === 'object' && 'clase' in fallo.error
              ? fallo.error
              : {
                  clase: 'mudo',
                  texto: 'No se pudo preguntar a la DGT. Elige tu distintivo a mano.',
                  fuente: 'DGT',
                  cuando: new Date().toISOString(),
                },
          ),
      });
  }

  /**
   * ⭐ LO QUE LA RESPUESTA HACE EN LA PANTALLA.
   *
   * Con etiqueta o sin ella, **se marca el radio que toca**: es la respuesta a
   * la pregunta que hay en pantalla, y dejarla sin marcar obligaría a
   * contestarla dos veces. Con `noExiste`, `formato` o `mudo` **no se toca
   * nada**: no se sabe, y marcar cualquier cosa sería decidir por quien pregunta.
   */
  private acabaLaDgt(r: DistintivoConsultado): void {
    this.consultandoDgt.set(false);
    if (this.relojDeLaDgt !== null) {
      clearTimeout(this.relojDeLaDgt);
      this.relojDeLaDgt = null;
    }
    this.tardaLaDgt.set(false);
    this.loDeLaDgt.set(r);
    const cual = EL_RADIO_DE_LA_LETRA;
    if (r.clase === 'etiqueta' && r.distintivo && cual[r.distintivo]) {
      this.distintivo.set(cual[r.distintivo]!);
      this.autorizacion.set(null);
    } else if (r.clase === 'sinDistintivo') {
      this.distintivo.set('sin');
    }
  }

  /**
   * Lo que se lee en la región de estado, en una frase.
   *
   * ⭐ **LA LETRA, NO LA PROSA DE LA SEDE** (4/09, decisión del ojo en la demo).
   *
   * Aquí se pintaba el párrafo entero que la DGT devuelve, que es una retahíla
   * de 220 caracteres y **acaba dando una instrucción de SU página**:
   *
   *   *«El vehículo 0000BBM cumple con los requisitos para obtener el Distintivo
   *   Ambiental C. Pulsa en la imagen del distintivo para conocer la información
   *   contenida en la etiqueta y los vehículos que tienen derecho a su
   *   obtención.»*
   *
   * Aquí no hay ninguna imagen que pulsar. Esa segunda mitad no es el dato: es
   * la navegación de la web de donde salió, y reproducirla manda a quien lee a
   * buscar algo que no existe en esta pantalla.
   *
   * ⚠️ **Y esto NO afeita la atribución.** Lo que su aviso legal exige es la
   *    cita de la fuente, y la cita se queda: «(Fuente: DGT, 14:53)», con la
   *    hora en que se preguntó. Lo que se deja de pintar es su prosa, que no es
   *    lo mismo — **el dato es la letra**, y la letra se dice entera.
   *
   * ⚠️ Y **solo en las dos clases que traen letra**. `noExiste`, `formato` y
   *    `mudo` no traen ninguna: ahí lo único que hay que decir es lo que pasó, y
   *    eso ya lo dice el `texto` que el motor redacta —esas tres frases son
   *    nuestras, no de la sede—.
   *
   * La palabra del distintivo sale de `distintivos`, que es la misma lista que
   * pinta los botones: así la región y el botón marcado dicen «CERO» los dos.
   */
  protected readonly loDeLaDgtEnPalabras = computed<string>(() => {
    if (this.consultandoDgt()) {
      return 'Preguntando a la DGT…';
    }
    const r = this.loDeLaDgt();
    if (r === null) {
      return '';
    }
    const cita = `(Fuente: DGT, ${horaDe(r.cuando)})`;
    if (r.clase === 'etiqueta' && r.distintivo) {
      const suyo = this.distintivos.find((x) => x.id === EL_RADIO_DE_LA_LETRA[r.distintivo!]);
      if (suyo) {
        return `Distintivo ambiental ${suyo.etiqueta} ${cita}`;
      }
    }
    if (r.clase === 'sinDistintivo') {
      return `Sin distintivo ambiental ${cita}`;
    }
    return r.texto;
  });

  /**
   * ⭐ EL POLÍGONO DE LA ZONA, bajado UNA VEZ y solo cuando hace falta (3/09).
   *
   * Es **el mismo fichero** con el que el motor marca las aristas (§ 1.30), no
   * una copia: si se copiaran los 33 vértices aquí, el día que la capa cambie
   * el mapa pintaría una zona y el motor cortaría por otra.
   *
   * ⚠️ **Se pide al elegir un vehículo de motor, no al arrancar.** Son 2,9 kB,
   *    pero quien entra a mirar una ruta a pie no tiene por qué pagarlos — y el
   *    mapa nace antes de que se elija modo. Una vez pedido, se queda: el coche
   *    y la moto se lo encuentran traído el uno al otro.
   */
  private readonly zonaZbe = signal<readonly (readonly Vertice[])[]>([]);
  private pidiendoLaZona = false;

  /**
   * Lo que se le pasa al mapa: la zona **en los dos vehículos de motor**.
   *
   * ⭐ Y con la moto también, desde el 4/09: la Zona de Bajas Emisiones vale para
   * todo vehículo de motor [ordenanza], así que dibujársela al coche y
   * escondérsela a la moto sería enseñar media verdad a quien tiene el mismo
   * problema. La traza roja corta igual sin tocar nada — el corte viene en
   * `TramoDelViaje.zbe`, que lo pone el motor. Ver `Mapa.zona`.
   */
  protected readonly zonaDelMapa = computed<readonly (readonly Vertice[])[]>(() =>
    this.pintaLaZona() ? this.zonaZbe() : [],
  );

  /**
   * La trae la primera vez que se elige coche. Si falla, **no se avisa**: el
   * polígono es contexto, y una ruta sin él sigue siendo una ruta correcta —el
   * corte de la traza y el aviso siguen ahí, que son los otros dos canales—.
   */
  private traerLaZona(): void {
    if (this.pidiendoLaZona || this.zonaZbe().length > 0) {
      return;
    }
    this.pidiendoLaZona = true;
    this.http
      .get<{
        readonly features: readonly {
          readonly properties: Record<string, string>;
          readonly geometry: { readonly coordinates: readonly (readonly (readonly number[])[])[][] };
        }[];
      }>(CAPA_DE_LA_ZBE)
      .subscribe({
        next: (capa) => {
          const fase1 = capa.features.find((f) => f['properties']['fase'] === 'FASE 1');
          if (!fase1) {
            return;
          }
          // El WFS da `[lon, lat]`; el mapa quiere `[lat, lon]`, como el contrato.
          this.zonaZbe.set(
            fase1.geometry.coordinates.flatMap((poli) =>
              poli.map((anillo) => anillo.map(([lon, lat]) => [lat!, lon!] as Vertice)),
            ),
          );
        },
        error: () => {
          // Se deja pedir otra vez: puede haber sido un corte de red.
          this.pidiendoLaZona = false;
        },
      });
  }

  /** Los dos lados de la dirección. Misma forma, mismo trato. */
  protected readonly origen = ladoVacio();
  protected readonly destino = ladoVacio();

  /** Andando por defecto. */
  protected readonly modo = signal<Modo>('andando');

  /**
   * ⭐ EN QUÉ FAMILIA ESTAMOS, **derivado del modo y no guardado aparte**.
   *
   * Es la decisión que sostiene todo lo demás: **el estado sigue siendo UNO**,
   * `modo`, el que viaja al motor. La familia se calcula de él. Guardarla en su
   * propia señal habría creado dos verdades que hay que mantener de acuerdo, y
   * el día que se desincronizaran la pantalla enseñaría un botón marcado y
   * mandaría otro modo — sin que nada se pusiera rojo, porque las dos señales
   * serían coherentes cada una consigo misma.
   */
  protected readonly familia = computed<Familia>(() => familiaDe(this.modo()));

  /**
   * ⭐ LAS TRES CLASES DE RUTA, y el trío no es nuestro.
   *
   * [DOC CycleStreets, API oficial] ofrece exactamente estos tres —*«minimizar
   * tiempo · evitar tráfico · el compromiso entre ambos»*— y **recomienda el
   * equilibrado como defecto de la interfaz**: *«práctica, equilibra velocidad
   * y agrado»*. Su `fastest` es para el *«ciclista confiado»* y su `quietest`
   * es *«más agradable, a menudo menos directa»*.
   *
   * Las etiquetas son de una palabra a propósito: son tres y van en una fila,
   * y lo que las distingue se lee debajo, no dentro del botón.
   */
  protected readonly tiposDeRuta: ReadonlyArray<{ id: TipoDeRuta; etiqueta: string }> = [
    { id: 'rapida', etiqueta: 'Rápida' },
    { id: 'equilibrada', etiqueta: 'Equilibrada' },
    { id: 'tranquila', etiqueta: 'Tranquila' },
  ];

  /** Equilibrada por defecto, que es lo que CycleStreets recomienda poner. */
  protected readonly tipoDeRuta = signal<TipoDeRuta>('equilibrada');

  /**
   * ⭐ QUIÉN VE EL CAMPO: la bici y la BiZi, y nadie más.
   *
   * El **patín no elige** —su vía ciclista es OBLIGATORIA [ORD art. 56.2.c] y
   * la calzada solo subsidiaria [56.3]—, así que enseñarle el campo sería
   * ofrecerle desobedecer; el motor le pone el calibrado fuerte y ni mira lo
   * que le manden. Andando, bus y coche no tienen ruta que calibrar.
   *
   * Y **no está apagado: no está** [DOC GOV.UK, revelado condicional], que es
   * el mismo patrón y el mismo argumento que el número de portal.
   */
  protected readonly eligeRuta = computed(
    () => this.modo() === 'bici' || this.modo() === 'bizi',
  );

  /**
   * ⭐ QUIÉN VE LA PREGUNTA DEL APARCAMIENTO: **el coche, y nadie más**.
   *
   * Mismo patrón y mismo argumento que los otros revelados de esta pantalla
   * [DOC GOV.UK, revelado condicional]: lo que no aplica **no está**. Andando no
   * aparca un coche.
   *
   * ⚠️ **Y la moto tampoco la ve** (4/09, casilla 3), aunque sí vea la de la
   *    ZBE. No es un olvido: la moto **no elige dónde deja** — remata siempre en
   *    un aparcamoto, que es lo que manda el art. 32 de la OMUZ, y el motor
   *    ignora el parámetro si le llega. Enseñar «¿Dónde quieres aparcar?» a
   *    quien va en moto sería pedirle que elija algo a lo que no se le va a
   *    hacer caso, que es peor que no preguntar.
   */
  protected readonly eligeCoche = computed(() => this.modo() === 'coche');

  /**
   * ⭐ QUIÉN VE LA PREGUNTA DE LA ZBE: **los dos vehículos de motor** (4/09).
   *
   * El coche y la moto, y **es literalmente la misma pregunta**: el mismo grupo
   * de radios en el DOM, el mismo campo de matrícula, la misma región de estado
   * y las mismas señales detrás. Duplicarla para la moto habría sido tener dos
   * listas de seis etiquetas que un día dirían cosas distintas — es el
   * precedente de la lista única región/botones, y aquí pesa más todavía porque
   * lo que se contesta viaja al motor.
   *
   * Y la razón de que sea la misma no es de código: [OMUZ] la Zona de Bajas
   * Emisiones no distingue entre coche y moto — el distintivo, la matrícula y la
   * autorización registral son **el mismo trámite** para los dos. Lo que le
   * llega al motor también es lo mismo: un `puedeEntrarEnLaZbe` de sí o no.
   *
   * ⚠️ Lo que NO comparten es el aparcamiento. Ver `eligeCoche`.
   */
  protected readonly preguntaLaZbe = computed(
    () => this.modo() === 'coche' || this.modo() === 'moto',
  );

  /**
   * ⭐ QUIÉN VE LA SEGUNDA FILA DE LA MOTO: la familia moto, y nadie más.
   *
   * Mismo revelado condicional que «¿Qué bici?» [DOC GOV.UK], y por eso cuelga
   * de la FAMILIA y no del modo: estando en «Pública YeGo» la fila tiene que
   * seguir ahí, o no habría manera de volver a la privada.
   */
  protected readonly eligeMoto = computed(() => this.familia() === 'moto');

  /**
   * ⭐ A QUIÉN SE LE PINTA LA ZONA, que **no es lo mismo que a quién se le
   * pregunta** (4/09, casilla 2).
   *
   * Hasta hoy iban juntas porque coincidían: coche y moto privada ven el
   * polígono y contestan el distintivo. YeGo rompe el empate — **se le pinta la
   * zona y no se le pregunta nada**—, y confundir las dos habría escondido el
   * polígono justo al modo que más cruza el centro.
   *
   * Las dos preguntas y sus dos respuestas:
   *
   *   · *¿te afecta la ZBE?* → a todo vehículo de motor, YeGo incluido: se pinta.
   *   · *¿hay que preguntarte el distintivo?* → solo si no se sabe ya. Con YeGo
   *     **se sabe**: el feed declara `distintivo_ambiental_0` para la flota
   *     entera (§ 1.34), así que entra libre y no hay nada que preguntar.
   */
  protected readonly pintaLaZona = computed(() => this.familia() === 'moto' || this.eligeCoche());

  protected elegirAparcamiento(tipo: TipoDeAparcamiento): void {
    this.aparcamiento.set(tipo);
  }

  protected elegirDistintivo(cual: Distintivo): void {
    this.distintivo.set(cual);
  }

  /**
   * ⭐ LA ZONA CONTRARIA A LA QUE SE ESTÁ VIENDO, o `null` si no hay contraria.
   *
   * Las dos zonas del reglamento son **la misma pregunta con dos respuestas**:
   * quien busca sitio en la azul y no lo encuentra cerca tiene la naranja a una
   * calle, y al revés. Las otras dos no tienen contraria — una plaza PMR no
   * tiene «la de al lado de otro color» y el bordillo libre no es una zona—, así
   * que ahí esto vale `null` y el botón **no existe**, no está en gris [DOC
   * GOV.UK, revelado condicional: lo que no aplica no está].
   *
   * ⚠️ **Se lee del RESULTADO, no del formulario.** Ver `Resultado.aparcamiento`.
   */
  protected readonly laOtraZona = computed<'azul' | 'naranja' | null>(() => {
    const pedida = this.resultado()?.aparcamiento;
    if (pedida === 'azul') {
      return 'naranja';
    }
    return pedida === 'naranja' ? 'azul' : null;
  });

  /** Cómo se lee la otra zona en el botón: «zona naranja», «zona azul». */
  protected laOtraZonaEnPalabras(): string {
    return this.laOtraZona() === 'naranja' ? 'zona naranja' : 'zona azul';
  }

  /**
   * ⭐ EL ATAJO: marcar la otra zona **y generar de nuevo**. Nada más.
   *
   * Es literalmente lo que haría una persona con el ratón: bajar a la botonera,
   * marcar la otra opción y pulsar «Generar ruta». No hay estado propio, ni una
   * segunda manera de pedir una ruta, ni un resultado guardado — **generar no
   * cachea**: lo primero que hace `generarRuta` es tirar el resultado anterior,
   * y aquí eso no es un detalle sino la promesa entera. La ruta del bordillo
   * depende de qué tramo queda mejor por coste, y eso se le pregunta al motor,
   * no se recuerda.
   *
   * Por eso la botonera se mueve de verdad: quien mire abajo después de pulsar
   * verá marcada la zona que está viendo, no la que pidió hace un momento.
   */
  protected sugerirLaOtraZona(): void {
    const otra = this.laOtraZona();
    if (!otra) {
      return;
    }
    this.elFocoVuelveAlAtajo = true;
    this.elegirAparcamiento(otra);
    this.generarRuta();
  }

  /**
   * ⭐ Y EL FOCO VUELVE AL ATAJO cuando la ruta nueva está pintada.
   *
   * ⚠️ **Esto NO estaba en el encargo: lo encontró la juez 3.** Al comprarle
   *    también el foco —el botón se pulsa con el teclado— salió que
   *    `document.activeElement` acababa en el `<body>`. La causa es de la casa y
   *    es buena: lo primero que hace `generarRuta` es `resultado.set(null)` para
   *    no seguir enseñando la ruta de antes mientras se espera, y eso **destruye
   *    la lista de pasos entera**, con el botón dentro. «Generar ruta» no lo
   *    sufre porque vive fuera del resultado; este atajo vive dentro.
   *
   *    Quien navega con teclado pulsaba el atajo y se quedaba al principio de la
   *    página, sin saber que abajo había una ruta nueva [WCAG 2.4.3, orden del
   *    foco]. Devolverlo no es estado del atajo ni semántica nueva: es dejar el
   *    foco donde la persona lo puso.
   */
  private elFocoVuelveAlAtajo = false;

  private readonly atajo = viewChild<ElementRef<HTMLButtonElement>>('atajo');

  private readonly devolverElFoco = effect(() => {
    const boton = this.atajo();
    if (!boton || !this.elFocoVuelveAlAtajo) {
      return;
    }
    this.elFocoVuelveAlAtajo = false;
    boton.nativeElement.focus();
  });

  /**
   * ⭐ LO QUE EL VEHÍCULO DE MOTOR AÑADE A LA PETICIÓN — y **solo lo contestado**.
   *
   * Un campo sin contestar no viaja como `undefined`: **no viaja**. Es la misma
   * ley del contrato —los dos parámetros son opcionales y su ausencia es la
   * conducta de la casilla 1b— y la que hace que la muralla de los otros modos
   * se pueda comprar mirando las claves del cuerpo.
   *
   * ⚠️ **Y los dos parámetros no van juntos** (4/09). `puedeEntrarEnLaZbe` es de
   *    los dos vehículos; `aparcamiento` es **solo del coche**. El contrato dice
   *    que la moto no lo mira —y que si le llega lo ignora en vez de contestar
   *    con error—, pero eso no es razón para mandárselo: lo que no se ha
   *    preguntado no viaja, y la muralla se compra contando claves.
   */
  private loDelVehiculo(): Partial<PeticionDeRuta> {
    if (!this.preguntaLaZbe()) {
      return {};
    }
    // Solo el coche tiene esta pregunta en pantalla, así que solo del coche
    // sale una respuesta. Si el radio se quedó marcado de antes, no cuenta: no
    // se está preguntando.
    const donde = this.eligeCoche() ? this.aparcamiento() : null;
    const cual = this.distintivos.find((x) => x.id === this.distintivo());
    // ⭐ Y la autorización, que **solo puede darle la vuelta al «Sin etiqueta»**:
    //    quien está registrado sí entra. Sin contestarla manda lo que «Sin
    //    etiqueta» ya decía por su cuenta —`false`—, que no es preinfluir: es
    //    que la respuesta ya estaba dada y esto solo la refina.
    const puedeEntrar =
      cual?.id === 'sin' ? this.autorizacion() === 'si' : (cual?.puedeEntrar ?? null);
    return {
      ...(donde !== null ? { aparcamiento: donde } : {}),
      ...(puedeEntrar !== null ? { puedeEntrarEnLaZbe: puedeEntrar } : {}),
    };
  }

  /**
   * ⭐ EL AVISO POSITIVO DEL DISTINTIVO (3/09).
   *
   * [FAQ de la sede] *«B, C, ECO o CERO: libre acceso, circulación y
   * estacionamiento sin necesidad de registrarse»*. Quien ha dicho que tiene una
   * de las cuatro y ve una ruta que cruza la zona merece que se le conteste su
   * pregunta —«¿y yo puedo?»— en vez de leer la norma general y deducirlo.
   *
   * ⚠️ **Solo si la ruta PISA la zona.** Decírselo a quien va por Miralbueno
   *    sería ruido sobre algo que no va a ver, y el resumen de avisos vale
   *    justamente por ser corto.
   *
   * ⚠️ Y lo pone la PANTALLA, no el motor, porque el motor no sabe la etiqueta:
   *    solo le llegó un `puedeEntrarEnLaZbe: true`. Quien tiene el dato es quien
   *    hizo la pregunta.
   */
  private readonly avisoDelDistintivo = computed<Aviso | null>(() => {
    const trayecto = this.resultado()?.trayecto;
    if (!trayecto) {
      return null;
    }
    const cual = this.distintivos.find((x) => x.id === this.distintivo());
    // ⭐ Dos maneras de poder entrar, y cada una se dice con sus palabras: la
    //    etiqueta buena circula libre **sin registro**, y la autorización es
    //    justo lo contrario — se entra PORQUE hay registro—.
    const porLaEtiqueta = cual?.puedeEntrar === true;
    const porElRegistro = cual?.id === 'sin' && this.autorizacion() === 'si';
    if (!porLaEtiqueta && !porElRegistro) {
      return null;
    }
    const deLaZona = trayecto.avisos.find((a) => a.texto.includes(MARCA_DE_ZBE));
    if (!deLaZona) {
      return null;
    }
    const aviso: Aviso = {
      texto: porLaEtiqueta
        ? `Tu distintivo ${cual!.etiqueta} circula libre por la ZBE, sin registro`
        : 'Entras con tu autorización registrada en la ZBE',
    };
    // Va al mismo paso que el aviso que lo motiva: son la misma noticia contada
    // desde los dos lados, y separarlos mandaría a quien lea a dos sitios.
    return deLaZona.paso === undefined ? aviso : { ...aviso, paso: deLaZona.paso };
  });

  /**
   * Los avisos que se pintan: los del motor **más** el positivo del distintivo,
   * si toca. Es el único sitio donde se compone la lista, para que el resumen de
   * arriba y las notas de abajo no puedan discrepar.
   */
  protected readonly avisosDelViaje = computed<readonly Aviso[]>(() => {
    const trayecto = this.resultado()?.trayecto;
    if (!trayecto) {
      return [];
    }
    const positivo = this.avisoDelDistintivo();
    return positivo ? [...trayecto.avisos, positivo] : trayecto.avisos;
  });

  /**
   * ⭐ LAS TRES RUTAS YA TRAÍDAS, y para qué pregunta valen.
   *
   * Es el patrón del planificador de [DOC CycleStreets]: los tres tipos **del
   * mismo viaje**, y quien mira salta entre ellos sin replanificar. Que se
   * traigan con tres peticiones en paralelo es traducción nuestra y se declara
   * — a ~20 ms de Dijkstra cada una, las tres cuestan lo que esperar a una.
   *
   * La `clave` es la huella de la pregunta —los dos extremos y el modo—, y
   * está por una razón que no es de eficiencia: **tres rutas traídas para un
   * par de portales no valen para otro**. Sin ella, cambiar el destino y luego
   * el radio pintaría la ruta de una dirección con el nombre de otra.
   */
  private readonly trio = signal<{
    readonly clave: string;
    readonly rutas: ReadonlyMap<TipoDeRuta, Trayecto>;
  } | null>(null);

  /** Lo que contestó el motor la última vez. `null` mientras no se ha pedido. */
  protected readonly resultado = signal<Resultado | null>(null);

  /** Se está esperando al motor: el botón lo dice y no se repulsa. */
  protected readonly generando = signal(false);

  /** Lo que salió mal al pedir la ruta, para decirlo en ámbar. */
  protected readonly avisoRuta = signal<string | null>(null);

  /**
   * El trazado que se pinta en el mapa: **el del resultado, y nada más**.
   *
   * Derivado, no guardado aparte. Así no puede pasar que el mapa enseñe la
   * línea de una ruta y la lista los pasos de otra: si no hay resultado —o si
   * el que hay no trae geometría, como una isla del grafo— el mapa se queda
   * limpio solo.
   */
  protected readonly trazado = computed(() => this.resultado()?.trayecto.geometria ?? []);

  /**
   * ⭐ Y CÓMO SE RECORRE CADA TRECHO, para que el mapa lo pinte con su trazo.
   *
   * Sale del mismo sitio que la geometría —el resultado— y por la misma razón
   * que aquella: **no se compone aquí nada**. El motor dice de qué vértice a
   * qué vértice va cada tramo; la pantalla lo pinta. Derivarlo de los pasos era
   * imposible sin errar el corte, y está medido en el contrato.
   */
  protected readonly tramos = computed(() => this.resultado()?.trayecto.tramos ?? []);

  /**
   * ⭐ LA NOTA QUE VIAJA CON EL HITO, o `null` si no hay nada que avisar.
   *
   * ── Por qué existe, con la doctrina y con el caso ────────────────────────
   *
   * [GOV.UK, *error summary* + *error message*] cuando hay un problema se
   * enseñan **los dos**: el resumen en lo alto **y** el mensaje al lado de
   * cada respuesta afectada, **con el mismo texto**. Y el porqué de la mitad
   * de abajo, con sus palabras: *«general errors are not helpful»* — un aviso
   * general **no tiene sentido fuera de contexto**.
   *
   * El caso de Antonio es ese exactamente: leyó «Coge una bici en la estación
   * Tauromaquia» **quince pasos por debajo** del banner ámbar. El banner
   * estaba y estaba bien; lo que no viajaba con el paso era la advertencia, y
   * un hito solo promete un sitio donde coger una bici sin decir que no se
   * sabe si queda alguna.
   *
   * ── Se COPIA el aviso, no se reescribe ──────────────────────────────────
   *
   * Devuelve el `texto` del aviso **tal cual**, para que los dos sitios digan
   * lo mismo sin que nadie tenga que mantener dos frases a juego. Si el motor
   * cambia esas palabras, cambian en los dos a la vez.
   *
   * ⚠️ **Y se reconoce por el texto, que es lo único que hay.** `Aviso` es
   * `{ texto }` y nada más —sin categoría ni código—, así que no queda otra
   * manera de saber cuál de los avisos es este. Es frágil y se dice: el día
   * que el contrato dé categoría a los avisos, esto se cuelga de ella. Lo que
   * lo hace tolerable es que la propia regla del doble sitio **exige** que el
   * texto sea el mismo arriba y abajo, así que aquí el texto ya es la llave.
   */
  private readonly avisosDeHito = computed<readonly Aviso[]>(() =>
    (this.resultado()?.trayecto.avisos ?? []).filter(
      (a) =>
        a.texto.includes(MARCA_DE_DISPONIBILIDAD) ||
        a.texto.includes(MARCA_DE_SIN_SERVICIO) ||
        a.texto.includes(MARCA_DE_DESVIO),
    ),
  );

  /**
   * ⭐ QUÉ HITO SE QUEDA CON QUÉ AVISO — la regla, y va escrita.
   *
   * Con el BiZi bastaba con «hay aviso, hay nota»: era uno y valía para los
   * dos hitos. Con el bus ya no, porque **sus avisos son de un poste
   * concreto**: un viaje con transbordo tiene dos subidas, y colgar el mismo
   * aviso de las dos diría que ninguna de las dos líneas está pasando cuando
   * puede que sea solo una. [GOV.UK] *«general errors are not helpful»*.
   *
   * La regla es ésta, en dos líneas:
   *
   *   1. Un aviso vale para el hito **cuyo sitio nombra**.
   *   2. Un aviso que no nombra el sitio de **ningún** hito vale para todos
   *      —es el D-G del BiZi, que habla del viaje entero—.
   *
   * Y el sitio de un hito es **su última parte `via`**: en el BiZi es la
   * estación, y en el bus, donde la primera `via` es el número de la línea, es
   * el poste. Un `29` suelto casaría con medio texto; el nombre del poste, no.
   */
  /**
   * ⭐ EL INDICADOR DE QUE SE ESTÁ TRABAJANDO, o `null` mientras no toca.
   *
   * Guarda **el texto** y no un `true` a propósito: lo que se dice depende del
   * modo con el que se pulsó Generar, y ese modo puede haber cambiado en la
   * pantalla mientras la respuesta viene de camino.
   */
  protected readonly esperando = signal<string | null>(null);
  private relojDeEspera: ReturnType<typeof setTimeout> | null = null;

  private empiezaLaEspera(modo: Modo): void {
    this.acabaLaEspera();
    const texto =
      modo === 'bus'
        ? 'Preguntando a Avanza cuándo pasa el próximo…'
        : 'Calculando la ruta…';
    this.relojDeEspera = setTimeout(() => this.esperando.set(texto), MS_ANTES_DE_AVISAR);
  }

  private acabaLaEspera(): void {
    if (this.relojDeEspera !== null) {
      clearTimeout(this.relojDeEspera);
      this.relojDeEspera = null;
    }
    this.esperando.set(null);
  }

  /**
   * ⭐ LAS LÍNEAS DEL VIAJE, en orden, para la leyenda de la cabecera.
   *
   * Una por tramo montado: un viaje con transbordo enseña dos chips, y si se
   * repitiera la misma línea saldría dos veces — son dos vehículos.
   */
  protected readonly lineasDelViaje = computed<readonly LineaDelViaje[]>(() =>
    (this.resultado()?.trayecto.tramos ?? [])
      .filter((t) => t.comoSeVa === 'montado' && t.linea !== undefined)
      .map((t) => t.linea!),
  );

  /**
   * ⭐ QUÉ LÍNEA LE TOCA A CADA PASO DE SUBIR.
   *
   * El contrato no ata un paso con su tramo, y no hace falta: los pasos de
   * `sube` **solo los escribe la etapa montada**, uno por vehículo y en orden,
   * igual que los tramos `montado`. Así que el n-ésimo `sube` es el n-ésimo
   * montado. ⚠️ El paseo de un transbordo también acaba en un tramo con
   * `hito: 'sube'`, pero eso es un tramo, no un paso: no escribe ninguno.
   */
  protected readonly lineaPorPaso = computed<ReadonlyMap<number, readonly LineaDelViaje[]>>(() => {
    const trayecto = this.resultado()?.trayecto;
    const mapa = new Map<number, readonly LineaDelViaje[]>();
    if (!trayecto) {
      return mapa;
    }
    const lineas = this.lineasDelViaje();
    let k = 0;
    trayecto.pasos.forEach((paso, i) => {
      const linea = lineas[k];
      if (!linea) {
        return;
      }
      if (paso.giro === 'sube') {
        mapa.set(i, [linea]);
        k++;
      } else if (paso.giro === 'transborda') {
        // ⭐ DOS CHIPS: de la que se deja a la que se coge. El paso lo dice con
        // palabras —«de la 35 a la 39»— y los chips lo dicen con el color.
        const anterior = lineas[k - 1];
        mapa.set(i, anterior ? [anterior, linea] : [linea]);
        k++;
      }
    });
    return mapa;
  });

  /**
   * ⭐ QUÉ DETALLES ESTÁN DESPLEGADOS, por clave.
   *
   * ⚠️ Cada disparador lleva **su** clave, y por eso el banner y el hito no se
   * abren juntos aunque digan lo mismo: abrir uno y que se moviera otro quince
   * líneas más abajo, fuera de la vista, sería una sorpresa que nadie ha pedido.
   *
   * Y se vacía en cada Generar: los detalles de la ruta anterior no siguen
   * abiertos sobre una ruta que ya no es esa.
   */
  private readonly desplegados = signal<ReadonlySet<string>>(new Set());

  protected estaDesplegado(clave: string): boolean {
    return this.desplegados().has(clave);
  }

  protected alternarDetalle(clave: string): void {
    const ahora = new Set(this.desplegados());
    if (!ahora.delete(clave)) {
      ahora.add(clave);
    }
    this.desplegados.set(ahora);
  }

  /**
   * ⭐ EL VIVO A PETICIÓN, por paso: qué se ha preguntado y qué se sabe.
   *
   * ═══════════════════════════════════════════════════════════════════════════
   *  El Generar pregunta a Avanza **por un solo poste**, el primero: de los
   *  demás nunca se dijo el minuto, y consultarlos costaba hasta 8,4 s cada uno
   *  dentro de los 10 s que [NN/g] da de margen. Así que lo de los demás se pide
   *  **cuando quien mira lo quiere**, con su botón — una acción iniciada por el
   *  usuario, y por eso cada pulsación vuelve a preguntar de verdad: **nada se
   *  guarda aquí**. Es la regla del BiZi, y el motor la respalda con
   *  `Cache-Control: no-store`.
   *
   *  Se vacía en cada Generar, igual que `desplegados`: un «próximo en 3 min»
   *  de la ruta anterior sobre una ruta nueva sería un número cierto sobre otro
   *  viaje.
   * ═══════════════════════════════════════════════════════════════════════════
   */
  private readonly consultasVivas = signal<ReadonlyMap<number, LaConsultaViva>>(new Map());

  /** Los avisadores de «está tardando» en vuelo, para poder cancelarlos. */
  private readonly relojes = new Map<number, ReturnType<typeof setTimeout>>();

  protected consultando(i: number): boolean {
    return this.consultasVivas().get(i)?.cargando ?? false;
  }

  protected tardaLaConsulta(i: number): boolean {
    return this.consultasVivas().get(i)?.tarda ?? false;
  }

  /**
   * Lo que se lee en la región de un paso.
   *
   * ⚠️ **La región nace con lo que el Generar ya trajo** (`paso.vivo`), y solo
   *    del primer poste, que es al único al que se preguntó. Nacer vacía
   *    obligaría a pulsar para ver algo que ya se sabe, y peor: la primera
   *    pulsación no parecería cambiar nada.
   */
  protected loVivoDe(paso: Paso, i: number): string {
    const consulta = this.consultasVivas().get(i);
    return consulta ? consulta.texto : (paso.vivo?.texto ?? '');
  }

  /**
   * ⭐ PREGUNTAR POR EL PRÓXIMO, al pulsar.
   *
   * ⚠️ **El botón no se deshabilita mientras carga**: un `disabled` lo saca del
   *    orden de tabulación, y quien navega con teclado pierde el sitio justo
   *    cuando acaba de pulsar. Los clics de más se interceptan **aquí**, en
   *    vuelo, que es la variante «loading button» documentada: el botón sigue
   *    presente, enfocable y con su estado dicho.
   */
  /**
   * ⭐ QUÉ DICE EL BOTÓN DE UN PASO, o `null` si ese paso no lleva ninguno.
   *
   * Las tres etiquetas salen de **lo que el motor manda como dato**, nunca de
   * leer la frase del paso: `aQuienPreguntar` para el bus y `aQueEstacion` para
   * la BiZi. Un paso sin ninguno de los dos no pinta botón — el tranvía, y
   * cualquier paso de andar.
   *
   * ⚠️ Y son **un solo bloque de plantilla**, no dos. Duplicar la anatomía
   *    —botón + indicador + región `role="status"` con su `aria-busy`— sería
   *    duplicar cuatro promesas de accesibilidad en dos sitios que se separan.
   *    Lo único que cambia entre bus y bici es la etiqueta y a quién se le
   *    pregunta, y las dos cosas se deciden aquí.
   */
  protected etiquetaDelBotonVivo(paso: Paso): string | null {
    if (paso.aQuienPreguntar) {
      return 'Próximo bus';
    }
    if (paso.aQueEstacion) {
      return paso.aQueEstacion.pide === 'bicis' ? 'Bicis ahora' : 'Anclajes ahora';
    }
    return null;
  }

  /**
   * ⭐ PREGUNTAR, al pulsar — al bus o a la estación, según lo que traiga el paso.
   *
   * ⚠️ **El botón no se deshabilita mientras carga**: un `disabled` lo saca del
   *    orden de tabulación, y quien navega con teclado pierde el sitio justo
   *    cuando acaba de pulsar. Los clics de más se interceptan **aquí**, en
   *    vuelo, que es la variante «loading button» documentada: el botón sigue
   *    presente, enfocable y con su estado dicho.
   */
  protected pulsarVivo(paso: Paso, i: number): void {
    if (paso.aQuienPreguntar) {
      this.consultar(i, MIENTRAS_SE_PREGUNTA, '/api/poste-vivo', {
        poste: String(paso.aQuienPreguntar.poste),
        linea: paso.aQuienPreguntar.linea,
      });
      return;
    }
    if (paso.aQueEstacion) {
      this.consultar(i, MIENTRAS_SE_PREGUNTA_AL_AYUNTAMIENTO, '/api/estacion-viva', {
        estacion: String(paso.aQueEstacion.estacion),
        pide: paso.aQueEstacion.pide,
      });
    }
  }

  /**
   * La consulta viva de un paso, **con su ceremonia entera** — y una sola vez
   * escrita para las dos fuentes.
   *
   * `mientras` es lo único que cambia entre ellas de cara a quien espera: a
   * quién se le está preguntando.
   */
  private consultar(
    i: number,
    mientras: string,
    ruta: string,
    params: Record<string, string>,
  ): void {
    if (this.consultando(i)) {
      return;
    }
    // El inicio se ANUNCIA: la región recibe su texto antes que nada
    // [WCAG 4.1.3]. Y `aria-busy` pasa a `true` para que lo que venga después
    // —el indicador de que tarda— no se anuncie como un cambio más.
    this.ponerConsulta(i, { cargando: true, tarda: false, texto: mientras });
    clearTimeout(this.relojes.get(i));
    this.relojes.set(
      i,
      setTimeout(() => {
        if (this.consultando(i)) {
          this.ponerConsulta(i, { cargando: true, tarda: true, texto: mientras });
        }
      }, CUANDO_SE_DICE_QUE_TARDA_MS),
    );

    const acabar = (texto: string): void => {
      clearTimeout(this.relojes.get(i));
      this.relojes.delete(i);
      this.ponerConsulta(i, { cargando: false, tarda: false, texto });
    };
    this.http.get<PosteVivo | EstacionViva>(ruta, { params }).subscribe({
      next: (vivo) => acabar(vivo.texto),
      // ⚠️ Que el MOTOR no conteste no es lo mismo que la fuente callando, y se
      //    dice distinto: aquello lo cuenta el motor con sus palabras, esto es
      //    que no hay nadie a quien preguntárselo.
      error: () => acabar('No se pudo preguntar al motor. ¿Está arrancado?'),
    });
  }

  private ponerConsulta(i: number, estado: LaConsultaViva): void {
    const ahora = new Map(this.consultasVivas());
    ahora.set(i, estado);
    this.consultasVivas.set(ahora);
  }

  /**
   * ⭐ LOS TONOS DE UN CHIP, para la plantilla. Ver `chip.ts`.
   *
   * ⚠️ Va por aquí y no por `linea.colorTexto` **a propósito**, y esto era un
   * fallo de accesibilidad medido: obedeciendo al feed, **27 de las 53 líneas**
   * salían por debajo de 4,5:1 — la 33 a 1,72:1—, porque el `route_text_color`
   * del operador no está calculado. El campo sigue llegando en el contrato, que
   * es el dato de Avanza y no se borra; simplemente aquí no decide.
   */
  protected readonly tonosDe = tonosDeChip;
  protected readonly conContorno = llevaContorno;

  /** El aviso partido, para la plantilla. Ver `enDosNiveles`. */
  protected dosNiveles(texto: string): EnDosNiveles {
    return enDosNiveles(texto);
  }

  /**
   * ⭐ EL RESUMEN DE ARRIBA: una línea por aviso, y a qué paso lleva (2/09).
   *
   * [GOV.UK · error summary] una caja arriba que lista lo que pasa, con un
   * enlace por línea al sitio donde vive el detalle. Aquí ese sitio es **el
   * paso al que el aviso afecta**, y quién es se decide con la MISMA regla que
   * pinta la nota junto al hito —`notaDelHito`— y no con otra parecida: dos
   * reglas para el mismo reparto acabarían mandando el enlace a un paso y la
   * nota a otro, y nadie lo vería hasta que pasara.
   *
   * Por eso esto **invierte** la regla en vez de reescribirla: se recorre cada
   * hito, se le pregunta cuál es su nota, y de ahí sale el mapa
   * `texto del aviso → índice del paso`. Lo que no case con ningún hito sale
   * con `paso: null` y se pinta **sin enlace**.
   *
   * Y lo que se lee en el resumen es solo el **hecho** (`enDosNiveles(...).hecho`):
   * la lista de postes provisionales se queda abajo, junto al hito, que es a
   * donde lleva el enlace. Repetirla arriba sería el mismo texto dos veces.
   */
  protected readonly resumenDeAvisos = computed<
    readonly { readonly texto: string; readonly paso: number | null }[]
  >(() => {
    const trayecto = this.resultado()?.trayecto;
    if (!trayecto) {
      return [];
    }
    const donde = new Map<string, number>();
    trayecto.pasos.forEach((paso, i) => {
      if (!esHito(paso)) {
        return;
      }
      const nota = this.notaDelHito(paso);
      // El PRIMERO que se la queda, que es el que la pinta: `notaDelHito` puede
      // devolver el mismo aviso para dos hitos, y el enlace tiene que llevar a
      // uno solo.
      if (nota !== null && !donde.has(nota)) {
        donde.set(nota, i);
      }
    });
    return this.avisosDelViaje().map((a) => ({
      texto: enDosNiveles(a.texto).hecho,
      // ⭐ `Aviso.paso` MANDA, y el texto es solo la reserva (3/09).
      //
      // El motor sabe por qué paso se entra en la Zona de Bajas Emisiones —lo
      // calcula con las aperturas de `escribirPasos`, que es el único sitio
      // donde consta— y lo dice desde la casilla 1b. Adivinarlo aquí leyendo la
      // frase no solo era frágil: **era imposible**, porque ese paso no es un
      // hito y la regla del texto solo sabe de hitos.
      //
      // La reserva se queda para los avisos que NO traen `paso`: los del bus y
      // los del BiZi, que se reparten por el sitio que nombran.
      paso: a.paso ?? donde.get(a.texto) ?? null,
    }));
  });

  /**
   * ⭐ LA NOTA QUE LE TOCA A UN PASO, por su índice (3/09).
   *
   * Primero `Aviso.paso`, que es dato; y si ningún aviso lo trae, la regla de
   * siempre para los hitos. Los dos caminos devuelven el texto **tal cual**,
   * que es lo que hace que arriba y abajo digan lo mismo sin mantener dos
   * frases a juego.
   */
  protected notaDelPaso(indice: number, paso: Paso): string | null {
    const suyo = this.avisosDelViaje().find((a) => a.paso === indice);
    if (suyo) {
      return suyo.texto;
    }
    return esHito(paso) ? this.notaDelHito(paso) : null;
  }

  /** Si un paso es de los que prometen algo: los cuatro hitos. */
  protected esHito(paso: Paso): boolean {
    return esHito(paso);
  }

  protected notaDelHito(paso: Paso): string | null {
    const marcados = this.avisosDeHito();
    if (marcados.length === 0) {
      return null;
    }
    // ⭐ EL ORDEN DE LAS DOS REGLAS ES PARTE DE LA REGLA, y va primero **la
    // línea**. Se descubrió al revés el 31/08: el aviso de la 29 nombra
    // «Asalto / Centro De Historias» como parada provisional, y ese poste es
    // justo donde se sube a la 22 — así que la regla del sitio le colgaba al
    // hito de la 22 el desvío de la 29. Un aviso que empieza por «La línea 22»
    // es de la 22 y no hay nada que interpretar; el sitio, en cambio, lo pueden
    // nombrar dos avisos. Ver la entrada del 31/08 de `docs/BITACORA.md`.
    const suLinea = lineaDelHito(paso);
    const deSuLinea = suLinea
      ? marcados.find((a) => a.texto.startsWith(`La línea ${suLinea} `))
      : undefined;
    if (deSuLinea) {
      return deSuLinea.texto;
    }
    // Y si ningún aviso es de su línea, el que nombra su sitio.
    //
    // ⚠️ **Pero NUNCA uno de desvío**, y esto es la reapertura de la entrada del
    // 31/08: un desvío explica **una línea**, no un poste. El aviso de la 35
    // nombra `Av. Francisco De Goya N.º 83` entre sus paradas provisionales, y
    // ese poste es justo donde se sube a la **31**, que no va desviada — con la
    // regla del sitio abierta a los desvíos, la 31 se comía el aviso de la 35.
    //
    // El cierre anterior cambió el ORDEN de las dos reglas, y eso solo tapaba
    // los casos en que la línea del hito también iba desviada. La regla del
    // sitio no tenía que ir después: tenía que **no aplicar** a un desvío.
    const suyo = sitioDelHito(paso);
    const propio = suyo
      ? marcados.find((a) => !a.texto.includes(MARCA_DE_DESVIO) && a.texto.includes(suyo))
      : undefined;
    if (propio) {
      return propio.texto;
    }
    const sitios = (this.resultado()?.trayecto.pasos ?? [])
      .map((x) => sitioDelHito(x))
      .filter((x): x is string => x !== null);
    return (
      marcados.find(
        (a) => !a.texto.includes(MARCA_DE_DESVIO) && !sitios.some((s) => a.texto.includes(s)),
      )?.texto ?? null
    );
  }

  /**
   * El usuario ha elegido —o ha deshecho— la calle de un lado.
   *
   * Se cuelga de `(seleccionChange)`, y eso es **el camino del usuario**: el
   * campo solo emite cuando lo cambia quien teclea o quien pulsa la lista.
   * Cuando el cambio viene de esta misma clase (invertir, «Mi ubicación») el
   * campo NO emite, así que este método no corre. Medido antes de escribirlo:
   * escribir desde el padre da 0 avisos; escribir desde el hijo da 1.
   *
   * [DOC] Los tipos instalados lo dicen de una forma que se presta a leerlo al
   * revés: *«Whenever its value is updated, it emits to the output»*
   * (`@angular/core`, `ModelSignal`). El «its value is updated» es el hijo
   * escribiendo, no el padre atando la entrada — y esa diferencia, que la
   * frase no separa, es la que hay medida arriba.
   *
   * Esa asimetría es la que sostiene el botón de invertir, y es la razón de
   * que la atadura de la plantilla vaya DESAZUCARADA —`[seleccion]` más
   * `(seleccionChange)`— en vez de `[(seleccion)]`. [DOC] Angular da la forma
   * larga por uso legítimo: la corta es azúcar de las dos, y cuál se usa queda
   * *«up to the consumer»*. **No se "simplifique" a `[(…)]`**: con el azúcar el
   * padre no se entera de quién escribió, y invertir se autodestruye.
   *
   * Cambiar de calle TIRA el portal: el 12 de una calle no es el 12 de la
   * otra, y dejarlo puesto sería dejar fijado un código que ya no pertenece a
   * la dirección que se está componiendo. La regla estaba dentro del selector
   * de portal y ha subido aquí entera.
   */
  /**
   * ⭐ Al elegir un SITIO como destino.
   *
   * Apaga la vía y el portal del destino, porque elegir un sitio es elegir
   * OTRA COSA: dejar los restos de una dirección a medias haría que «Generar»
   * mandara una mezcla de las dos. Y al revés lo hace `alElegirVia`, que ya
   * limpiaba el portal cuando cambia la calle.
   */
  /**
   * ⭐ Al elegir un SITIO en un lado.
   *
   * Solo fija el sitio, y eso es **todo lo que hace falta**: para llegar a la
   * lista hay que haber tecleado, y teclear ya suelta la vía —`alEscribir` del
   * autocompletar pone la selección a `null`, y eso llega aquí como
   * `alElegirVia(lado, null)`, que limpia el portal y su texto—. La casilla de
   * portal se apaga sola por no tener vía, que es la regla del portal
   * condicional cumpliéndose sin una línea que hable de ella.
   *
   * Aquí hubo cuatro líneas más que repetían esa limpieza. Se quitaron el
   * 23/08: la contraprueba las mutó una a una y **las 98 pruebas seguían
   * verdes**, porque ningún gesto de una persona puede llegar a ellas. Código
   * que ninguna prueba puede tocar es código que nadie va a mantener.
   */
  protected alElegirSitio(lado: Lado, sitio: Sitio | null): void {
    lado.sitio.set(sitio);
  }

  /**
   * ⭐ Al cambiar el TIPO de un lado: se limpia el lado entero.
   *
   * Cambiar de carril es empezar la pregunta. Sin esto quedaría una farmacia
   * resuelta bajo la etiqueta «Dirección» —o una calle bajo «Hospitales»—, y no
   * sería solo feo: **«Generar» seguiría desbloqueado** y mandaría al motor un
   * extremo que no es el que se lee en la pantalla. Es la ley de la entrada nº4
   * otra vez, con el disfraz del 24/08.
   *
   * Se limpia TODO, incluidos los «tocado»: quien acaba de cambiar de tipo no
   * ha tenido tiempo de equivocarse todavía, y regañarle por un campo vacío que
   * él no ha vaciado sería regañarle por lo que hemos hecho nosotros.
   */
  protected alCambiarTipo(lado: Lado, tipo: Clase): void {
    lado.tipo.set(tipo);
    lado.calle.set('');
    lado.via.set(null);
    lado.calleTocada.set(false);
    lado.portalTexto.set('');
    lado.portal.set(null);
    lado.portalTocado.set(false);
    lado.sitio.set(null);
  }

  /**
   * ⭐ LO QUE DICE CADA OPCIÓN del desplegable, y **en qué orden se lee**.
   *
   * `Dirección` va **la primera y aparte**: es el defecto —lo que busca casi
   * todo el mundo— y además no es de la misma clase que las otras. Las otras
   * son categorías de sitio; esta es la calle y el portal de siempre. [GOV.UK
   * Design System] el ejemplo canónico de su `Select` es justo esto, un filtro
   * con su defecto marcado al principio.
   *
   * **Las demás van alfabéticas por su etiqueta** [PROPIO — la doctrina no dice
   * nada del orden de un filtro y aquí no hay ninguna jerarquía que respetar:
   * ninguna categoría es más importante que otra]. Hasta el 25/08 salían **en
   * el orden en que fueron llegando al proyecto** —farmacias, hospitales,
   * centros de salud, bibliotecas—, que es una historia nuestra y no le dice
   * nada a quien mira la lista.
   *
   * ⭐ **Y el orden no se escribe: se calcula.** La lista de abajo puede ir
   * como sea, porque `ordenadas` la ordena al construirla — así la categoría
   * que entre mañana **cae sola en su sitio** y nadie tiene que acordarse de
   * colocarla. Se ordena con `localeCompare('es')` y no comparando cadenas a
   * pelo, porque «Centros» y «Farmacias» se separan igual pero una «Ó» o una
   * «Ñ» no: el orden de un alfabeto lo decide su idioma, no su tabla de
   * códigos.
   *
   * **Y cumplió a la primera vez que hizo falta.** Las tres de educación
   * (27/08) se escribieron al final de la lista y salen donde les toca —
   * «Colegios e Institutos» entre Centros de Salud y Farmacias, «Guarderías»
   * entre Farmacias y Hospitales, «Universidades» al final—, sin tocar una
   * línea del orden. `localeCompare('es')` es además lo que coloca
   * «Guarderías» **antes** que «Hospitales» pese a la tilde.
   */
  private static ordenadas(
    resto: ReadonlyArray<{ id: Clase; etiqueta: string }>,
  ): ReadonlyArray<{ id: Clase; etiqueta: string }> {
    return [...resto].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
  }

  protected readonly tipos: ReadonlyArray<{ id: Clase; etiqueta: string }> = [
    { id: 'via', etiqueta: 'Dirección' },
    ...Buscador.ordenadas([
      { id: 'farmacia', etiqueta: 'Farmacias' },
      { id: 'hospital', etiqueta: 'Hospitales' },
      { id: 'centro-salud', etiqueta: 'Centros de Salud' },
      { id: 'biblioteca', etiqueta: 'Bibliotecas' },
      { id: 'colegio', etiqueta: 'Colegios e Institutos' },
      { id: 'guarderia', etiqueta: 'Guarderías' },
      { id: 'universidad', etiqueta: 'Universidades' },
    ]),
  ];

  protected alElegirVia(lado: Lado, via: Via | null): void {
    lado.via.set(via);
    lado.portalTexto.set('');
    lado.portal.set(null);
    lado.portalTocado.set(false);
    // Elegir una calle apaga el sitio que hubiera: son las dos maneras de decir
    // a dónde, y no pueden estar puestas a la vez.
    if (via) {
      lado.sitio.set(null);
    }
  }

  /**
   * ⇅ Intercambia origen y destino, enteros.
   *
   * Cada lado viaja con TODO su estado: el texto, el código y si estaba
   * marcado. Un borrador cruza siendo borrador y sigue marcado al otro lado —
   * inventarle una vía porque «ya estaba escrito» sería justo el fallo de la
   * entrada nº4, y borrarlo por estar a medias sería tirarle al usuario lo que
   * había escrito.
   *
   * Nada de esto pasa por `alElegirVia`: se escriben las señales del padre
   * directamente, así que los campos NO emiten y la regla del portal no se
   * dispara. Es el reverso exacto del camino del usuario, y por eso invertir
   * no se deshace a sí mismo.
   *
   * Con este botón, «mi ubicación como destino» no necesita botón propio: se
   * pone en origen y se invierte.
   */
  protected invertir(): void {
    // ⭐ El TIPO primero, que desde el 24/08 es lo que decide qué casillas hay.
    // Cruzando el texto sin el tipo, el otro lado se quedaría con una farmacia
    // escrita bajo la etiqueta «Dirección» y con una casilla de número que no
    // le corresponde.
    intercambiar(this.origen.tipo, this.destino.tipo);
    intercambiar(this.origen.calle, this.destino.calle);
    intercambiar(this.origen.via, this.destino.via);
    intercambiar(this.origen.calleTocada, this.destino.calleTocada);
    intercambiar(this.origen.portalTexto, this.destino.portalTexto);
    intercambiar(this.origen.portal, this.destino.portal);
    intercambiar(this.origen.portalTocado, this.destino.portalTocado);
    // Y el sitio, que es un campo más del lado desde el 23/08.
    intercambiar(this.origen.sitio, this.destino.sitio);
  }

  /**
   * 📍 Rellena el ORIGEN con donde está quien mira la pantalla.
   *
   * El permiso lo pide el propio navegador al llamar [DOC MDN], así que aquí
   * no hay que preguntar nada antes. Exige contexto seguro: en local vale
   * `localhost`; en producción hará falta https, y eso es una casilla del
   * punto 12, no de aquí.
   *
   * ⚠️ Estuvo **solo en el origen** hasta el 24/08, con el argumento de que
   * para el otro lado ya estaba el ⇅. Antonio lo corrigió: dar dos pasos para
   * algo que cabe en uno no es economía, es un acertijo. Ahora está en los dos,
   * con los mismos umbrales y los mismos mensajes.
   */
  protected miUbicacion(lado: Lado): void {
    this.avisoUbicacion.set(null);
    // ⭐ Se apunta a QUIÉN lo pidió: hasta el 24/08 solo lo tenía el origen y
    // el destino se llenaba con el ⇅. Ahora está en los dos, así que la
    // respuesta —que llega dos saltos después— tiene que saber dónde caer.
    this.pidioUbicacion = lado;

    // Sin contexto seguro la API ni siquiera existe. Un botón que no hace nada
    // y no dice por qué es peor que no tener botón.
    if (!navigator.geolocation) {
      this.avisoUbicacion.set(
        'Este navegador no da la ubicación en esta página: hace falta una ' +
          'conexión segura (https). Escribe la calle a mano.',
      );
      return;
    }

    this.buscandoUbicacion.set(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => this.conLaPosicion(posicion),
      (fallo) => this.sinPosicion(fallo),
      OPCIONES_UBICACION,
    );
  }

  /**
   * Ya hay posición. Primera comprobación: **la precisión**.
   *
   * Va antes de preguntar al motor a propósito. Con un radio de kilómetros el
   * motor contestaría igual —siempre hay un portal más cercano— y contestaría
   * que estás a 30 m de un portal que no es el tuyo. El error no se vería por
   * ningún lado: ese es justo el caso que hay que cortar aquí.
   */
  private conLaPosicion(posicion: GeolocationPosition): void {
    const { latitude, longitude, accuracy } = posicion.coords;

    if (accuracy > PRECISION_MAXIMA_M) {
      this.buscandoUbicacion.set(false);
      this.avisoUbicacion.set(
        `Solo sabemos dónde estás con un margen de ${Math.round(accuracy)} metros, ` +
          'y con eso no se acierta un portal. Escribe la calle a mano.',
      );
      return;
    }

    this.http
      .get<PortalCercano | null>(`/api/portal-cercano?lat=${latitude}&lon=${longitude}`)
      .subscribe({
        next: (cercano) => this.conElPortal(cercano),
        error: () => {
          this.buscandoUbicacion.set(false);
          this.avisoUbicacion.set('No se pudo preguntar al motor. ¿Está arrancado?');
        },
      });
  }

  /**
   * Ya está el portal. Segunda comprobación: **la distancia**.
   *
   * Y si pasa, se rellena POR CÓDIGO: la vía entera y el portal entero, tal y
   * como habrían quedado si se hubieran elegido de sus listas. El formulario ni
   * se entera de que ha habido GPS —`sePuedeGenerar()` sigue mirando los cuatro
   * códigos y nada más—, y el texto que se escribe es el mismo que escribiría
   * el desplegable, porque lo pinta la misma función.
   *
   * Ni aquí ni en el aviso se nombra Zaragoza: ver `DISTANCIA_MAXIMA_M`.
   */
  private conElPortal(cercano: PortalCercano | null): void {
    this.buscandoUbicacion.set(false);

    if (!cercano) {
      // El motor dice que no sabe. Pasa si la vía del portal más cercano no es
      // sugerible, que no debería ocurrir — pero si ocurre, se calla en vez de
      // rellenar media dirección.
      this.avisoUbicacion.set(
        'No hemos podido situarte con lo que sabemos de la ciudad. Escribe la ' +
          'calle a mano.',
      );
      return;
    }

    if (cercano.metros > DISTANCIA_MAXIMA_M) {
      this.avisoUbicacion.set(
        `El portal más cercano está a ${cercano.metros} metros. Desde ahí no ` +
          'podemos decir en qué puerta estás. Escribe la calle a mano.',
      );
      return;
    }

    const lado = this.pidioUbicacion;
    if (!lado) {
      return;
    }

    // ⭐ Y EL TIPO SE PONE EN «DIRECCIÓN». Una ubicación ES una dirección: lo
    // que devuelve `/api/portal-cercano` es una vía y un portal, y meterlos en
    // un campo que dice «Hospitales» sería escribir una cosa bajo la etiqueta
    // de otra. Cambiar el tipo aquí es además lo que hace aparecer la casilla
    // del número, sin la cual el portal recién resuelto no se vería.
    lado.tipo.set('via');
    lado.sitio.set(null);

    lado.calle.set(comoSeVeLaVia(cercano.via));
    lado.via.set(cercano.via);
    lado.calleTocada.set(false);
    lado.portalTexto.set(cercano.portal.numero);
    lado.portal.set(cercano.portal);
    lado.portalTocado.set(false);
  }

  /** No hay posición, y la API dice por qué. Se traduce y se enseña. */
  private sinPosicion(fallo: GeolocationPositionError): void {
    this.buscandoUbicacion.set(false);
    this.avisoUbicacion.set(
      MENSAJES_DE_FALLO[fallo.code] ??
        'No se ha podido saber dónde estás. Escribe la calle a mano.',
    );
  }

  protected elegirModo(modo: Modo): void {
    this.modo.set(modo);
  }

  /**
   * ⭐ Se elige una familia en la primera fila: se entra por su `porDefecto`.
   *
   * Dos conductas salen de aquí, y conviene no confundirlas:
   *
   * · **Repulsar la familia en la que ya estás NO te mueve.** Quien esté en
   *   «Pública BiZi» y pulse «Bici» sigue en BiZi — porque el control es un
   *   radio nativo y **un radio ya marcado no dispara `change`**, así que esta
   *   función ni se llama. Lo da el navegador, no una línea de aquí, y se
   *   escribe porque es la clase de cosa que alguien «arregla» sin saber que
   *   era intencionada.
   * · **Salir de la familia y volver SÍ te devuelve al defecto.** No hay dónde
   *   recordar la bici elegida: el estado es uno, `modo`, y al irse a
   *   `andando` la elección de dentro deja de existir. Es a propósito —
   *   guardarla exigiría una segunda señal viva mientras el modo dice otra
   *   cosa, que es la puerta a que el botón marcado y el modo que viaja dejen
   *   de coincidir—. El encargo dice «Privada por defecto» y aquí se aplica
   *   **cada vez que se entra**, que es lo único que no puede envejecer mal.
   */
  /**
   * ⭐ Al pasar a un vehículo de motor se pide el polígono. Va aquí y no en un
   * `effect` porque es **una acción del usuario**, como «Generar» o «Mi
   * ubicación»: un efecto que dispare peticiones al leer una señal es justo lo
   * que esta pantalla evita desde el punto 4. Ver el comentario de `generarRuta`.
   */
  protected elegirFamilia(familia: Familia): void {
    if (familia === 'coche' || familia === 'moto') {
      this.traerLaZona();
    }
    this.olvidarElVehiculo();
    const suya = this.familias.find((f) => f.id === familia);
    if (suya) {
      this.modo.set(suya.porDefecto);
    }
  }

  /**
   * ⭐ CAMBIAR DE FAMILIA DEVUELVE LAS RESPUESTAS DE LA ZBE A SIN-ELEGIR.
   *
   * [PROPIO, declarado en el encargo del 4/09] **cada vehículo el suyo**: la
   * etiqueta ambiental es del coche que se conduce, y quien pasa de su coche a
   * su moto está hablando de otro vehículo. Arrastrar la respuesta le mandaría
   * al motor un `puedeEntrarEnLaZbe` que nadie ha contestado para ESE vehículo,
   * que es exactamente lo que «nada preseleccionado» [GOV.UK] lleva prohibiendo
   * desde el 3/09 — y por el lado caro: le haría rodear la zona o rematar en un
   * aparcamiento que su vehículo no necesita.
   *
   * Las tres se borran a la vez porque **son una sola respuesta en tres cajas**:
   * dejar la matrícula puesta con el radio en blanco enseñaría un vehículo sin
   * respuesta, y dejar la región diciendo «Distintivo ambiental C» sería peor —
   * un dato de la DGT sobre una matrícula que ya no está en pantalla.
   *
   * ⚠️ **El radio del aparcamiento NO se toca**, y es a propósito: es una
   *    pregunta del coche y solo del coche, así que salir a otra familia y
   *    volver no cambia de vehículo respecto de ella. Es la conducta que tenía
   *    antes del 4/09 y no se altera de paso.
   *
   * ⛔ La matrícula se borra de la señal, que es el único sitio donde ha estado:
   *    no hay caché, ni URL, ni `localStorage` de donde borrarla.
   */
  private olvidarElVehiculo(): void {
    this.distintivo.set(null);
    this.autorizacion.set(null);
    this.matricula.set('');
    this.loDeLaDgt.set(null);
  }

  /**
   * ⭐ Se elige otra clase de ruta. **Y esto no pide nada al motor.**
   *
   * Es lo que compra la precarga: las tres ya están traídas, así que cambiar
   * de una a otra es leer del mapa y repintar. Es el gesto del planificador de
   * [DOC CycleStreets] — saltar entre los tres tipos del mismo viaje sin
   * replanificar.
   *
   * Si el trío **no vale para la pregunta de ahora** —porque se ha tocado un
   * extremo o el modo desde que se trajo— no se repinta nada: se queda lo que
   * hay y el radio solo apunta lo que se querrá al pulsar «Generar». Pintar la
   * ruta guardada de otra dirección sería la clase de mentira que este mapa
   * lleva evitando desde el punto 7.
   */
  protected elegirTipoDeRuta(tipo: TipoDeRuta): void {
    this.tipoDeRuta.set(tipo);
    const guardado = this.trio();
    if (!guardado || guardado.clave !== this.claveDeLaPregunta()) {
      return;
    }
    const trayecto = guardado.rutas.get(tipo);
    if (trayecto) {
      this.pinta(trayecto);
    }
  }

  /**
   * La huella de la pregunta que hay AHORA en el formulario: los dos extremos
   * y el modo. Es lo que decide si el trío guardado sigue valiendo.
   *
   * `null` cuando el formulario todavía no compone una pregunta entera; así no
   * puede casar por accidente con una clave guardada.
   */
  private claveDeLaPregunta(): string | null {
    const origen = this.extremoDe(this.origen);
    const destino = this.extremoDe(this.destino);
    if (!origen || !destino) {
      return null;
    }
    return JSON.stringify({ origen, destino, modo: this.modo() });
  }

  protected etiquetaDe(modo: Modo): string {
    return this.modos.find((m) => m.id === modo)?.etiqueta ?? modo;
  }

  /** La flecha de un paso. Sale del `giro`, nunca del texto: ver `FLECHAS`. */
  protected flechaDe(giro: Giro): string {
    return FLECHAS[giro];
  }

  protected readonly enMetros = comoSeLeenLosMetros;
  protected readonly enTiempo = comoSeLeeLaDuracion;

  /**
   * ⭐ Le pide la ruta al motor. Con algún campo vacío no hace nada.
   *
   * **Esto es `HttpClient.post`, y no `httpResource`.** Los dos campos del
   * formulario usan `httpResource` porque son LECTURAS que se rehacen solas
   * cuando cambia lo escrito. Esto no: es una ACCIÓN que dispara un botón, una
   * vez, cuando quien mira decide.
   *
   * [DOC] Los tipos instalados dicen que `httpResource` *«makes a **reactive**
   * HTTP request and exposes the request status and response value as a
   * `WritableResource`»*, y que su método *«defaults to GET if not specified»* —
   * o sea que **técnicamente sabría hacer un POST**. Lo que no encaja no es el
   * verbo: es el «reactive». Un recurso se rehace solo cuando cambia una señal
   * de las que lee, y aquí las señales que habría que leer son los cuatro
   * campos: tocar un portal dispararía una ruta que nadie ha pedido, y pulsar
   * «Generar» dos veces con los mismos campos no dispararía ninguna. [PROPIO]
   * Por eso va por el mismo camino que «Mi ubicación», que es la otra acción de
   * esta pantalla.
   *
   * Lo primero que hace es **tirar el resultado anterior**. No es cosmética:
   * mientras se espera, el mapa no puede seguir enseñando la línea de la ruta
   * de antes como si fuera esta.
   */
  protected generarRuta(): void {
    if (this.generando()) {
      return;
    }
    // ⭐ Los DOS extremos, por la misma función: la simetría del 23/08 aquí es
    // que no hay dos caminos que mantener a la par.
    const origen = this.extremoDe(this.origen);
    const destino = this.extremoDe(this.destino);
    if (!origen || !destino) {
      return;
    }

    // CÓDIGOS, que es lo único que viaja. Es la ley de la entrada nº4 llegando
    // al final del tubo: el formulario lleva desde el punto 4 negándose a
    // desbloquear con texto, y sería tirarlo todo mandar aquí los nombres. El
    // motor tampoco los aceptaría — los rechaza en `leerPeticion`. Un sitio
    // viaja igual: por su código, nunca por su presentación.
    const peticion: PeticionDeRuta = {
      origen,
      destino,
      modo: this.modo(),
      // ⭐ Y lo del vehículo de motor, **solo si se ha contestado**. Ver
      // `loDelVehiculo`.
      ...this.loDelVehiculo(),
    };

    this.avisoRuta.set(null);
    this.resultado.set(null);
    this.desplegados.set(new Set());
    // Lo vivo de la ruta anterior no sobrevive a la siguiente: un «próximo en
    // 3 min» que se quedara pegado sería un número cierto sobre otro viaje.
    for (const reloj of this.relojes.values()) {
      clearTimeout(reloj);
    }
    this.relojes.clear();
    this.consultasVivas.set(new Map());

    // ⭐ BUS Y COCHE NO SALEN DE AQUÍ (30/08). El motor no los calcula, así que
    // preguntárselo sería gastar un viaje para traer un «todavía no» — y con el
    // motor caído traería «no se pudo preguntar», que sería mentir sobre la
    // causa. La respuesta tiene la MISMA forma que la del motor: un trayecto
    // con su modo, cero pasos y un aviso ámbar, así que se pinta por el mismo
    // camino y no hay una segunda manera de enseñar lo mismo.
    const modo = this.modo();
    const todavia = this.modos.find((m) => m.id === modo)?.todavia;
    if (todavia) {
      this.pinta({
        modo,
        pasos: [],
        geometria: [],
        avisos: [{ texto: todavia }],
        metros: 0,
        segundos: 0,
        // Sin geometría no hay nada que pintar, así que no hay tramos. Es la
        // misma forma que el motor devuelve cuando no puede dar una ruta.
        tramos: [],
      });
      return;
    }

    this.generando.set(true);
    this.empiezaLaEspera(modo);
    this.trio.set(null);

    // ⭐ LA PRECARGA (30/08): en bici y BiZi se piden LAS TRES rutas de una vez.
    //
    // Es el patrón del planificador de [DOC CycleStreets]: los tres tipos del
    // MISMO viaje, y quien mira salta entre ellos sin replanificar. Las tres
    // peticiones en paralelo son traducción nuestra y se declaran: el motor
    // resuelve una ruta de bici en ~20 ms, así que las tres cuestan lo que
    // cuesta esperar a la más lenta, y a cambio cambiar de opción es instantáneo
    // y no depende de que el motor conteste otra vez.
    //
    // En los demás modos va UNA, como siempre: andando no elige, y el patín
    // tampoco —su vía ciclista es obligatoria [ORD art. 56.2.c]—, así que pedir
    // tres sería gastar dos Dijkstra para tirarlos.
    if (!this.eligeRuta()) {
      this.http.post<Trayecto>('/api/ruta', peticion).subscribe({
        next: (trayecto) => {
          this.generando.set(false);
          this.acabaLaEspera();
          this.pinta(trayecto);
        },
        error: () => this.noContesta(),
      });
      return;
    }

    const clave = this.claveDeLaPregunta();
    // Los tres que la pantalla ofrece, que es su propia lista: la interfaz no
    // importa nada del motor, y lo que se precarga es exactamente lo que se
    // puede elegir. Si un día se ofrecen dos, se piden dos.
    const tipos = this.tiposDeRuta.map((t) => t.id);
    forkJoin(
      tipos.map((tipo) => this.http.post<Trayecto>('/api/ruta', { ...peticion, ruta: tipo })),
    ).subscribe({
      next: (trayectos) => {
        this.generando.set(false);
        this.acabaLaEspera();
        const rutas = new Map<TipoDeRuta, Trayecto>();
        tipos.forEach((tipo, i) => rutas.set(tipo, trayectos[i]!));
        // La clave se guarda con el trío: es lo que dirá, más tarde, si estas
        // tres siguen siendo las de la pregunta que hay en pantalla.
        if (clave) {
          this.trio.set({ clave, rutas });
        }
        const elegida = rutas.get(this.tipoDeRuta());
        if (elegida) {
          this.pinta(elegida);
        }
      },
      error: () => this.noContesta(),
    });
  }

  /**
   * No hay nadie al otro lado. Es distinto de «no hay ruta», que llega dentro
   * de una respuesta bien formada con su aviso.
   */
  private noContesta(): void {
    this.generando.set(false);
    this.acabaLaEspera();
    this.avisoRuta.set('No se pudo preguntar al motor. ¿Está arrancado?');
  }

  /**
   * Un trayecto, en la pantalla, con los dos extremos tal y como se leen.
   *
   * Sale del `next` del motor y también del corte de bus y coche: es **el único
   * sitio** donde se compone un resultado, para que un trayecto que no viene
   * del motor no pueda pintarse de otra manera que uno que sí.
   */
  private pinta(trayecto: Trayecto): void {
    this.resultado.set({
      origen: this.comoSeLee(this.origen),
      destino: this.comoSeLee(this.destino),
      capaOrigen: this.capaDe(this.origen),
      capaDestino: this.capaDe(this.destino),
      aparcamiento: this.loDelVehiculo().aparcamiento ?? null,
      trayecto,
    });
  }

  /**
   * Cuándo se puede generar: **los cuatro códigos**. Dos vías elegidas de su
   * lista y dos portales elegidos de la suya. Ni un texto.
   *
   * Mirar el texto era el fallo de la entrada nº4 de la bitácora: se escribía
   * cualquier cosa, se salía con Tab, y el botón se desbloqueaba sin que
   * hubiera detrás ninguna vía real. El texto no identifica una calle —hay 52
   * nombres repetidos entre la ciudad y los barrios rurales— ni una puerta
   * —un «12» tecleado podía no existir en una calle de 31 portales—; los
   * códigos sí.
   */
  /**
   * ⭐ Un lado, convertido en el extremo que viaja: **códigos y nada más**.
   *
   * Es la ley de la entrada nº4 llegando al final del tubo: el formulario lleva
   * desde el punto 4 negándose a desbloquear con texto, y sería tirarlo todo
   * mandar aquí los nombres. Un sitio viaja igual, por su código y nunca por su
   * presentación.
   */
  private extremoDe(lado: Lado): ExtremoDeRuta | null {
    const sitio = lado.sitio();
    if (sitio) {
      return { sitio: sitio.codigo };
    }
    const via = lado.via();
    if (!via) {
      return null;
    }
    const portal = lado.portal();
    if (portal) {
      return { via: via.codigo, portal: portal.codigo };
    }
    /**
     * ⭐ LA VÍA SIN PORTALES (27/08). No hay puerta que nombrar —el PUENTE DE
     * PIEDRA no tiene ninguna—, así que **su propio código va en las dos
     * casillas** y el motor lo resuelve por el punto medio de su geometría.
     *
     * La pantalla NO compone un código: manda dos veces el único que le dieron
     * al elegir de la lista. Es la ley de la entrada nº4 intacta — de una lista
     * se elige, no se escribe—, y el contrato tampoco se mueve: `PeticionDeRuta`
     * sigue pidiendo `via` y `portal`, los dos, y los dos van.
     *
     * Y `portales === 0` no es una corazonada: es el dato del contrato, contado
     * por el motor sobre el censo municipal.
     */
    return via.portales === 0 ? { via: via.codigo, portal: via.codigo } : null;
  }

  /**
   * Cómo se lee un lado en la cabecera del resultado.
   *
   * Un sitio ya viene con su nombre **compuesto por el motor** —«Farmacia ·
   * calle»— y no se recompone aquí: la pantalla no fabrica nombres, y menos
   * uno cuyo dato crudo lleva el nombre de una persona.
   */
  /**
   * ⭐ El código de un lado para usarlo como FOCO del otro, o `null`.
   *
   * Es la misma pregunta que `extremoDe` —«¿qué hay elegido aquí?»— pero para
   * ORDENAR la lista del lado contrario, no para pedir una ruta. Por eso
   * devuelve un código suelto y no un extremo: al motor le da igual de qué
   * clase sea el punto desde el que se mide.
   *
   * Un lado a medias —calle sin portal— vale `null`: sin portal no hay punto,
   * y la calle entera no es un sitio desde el que medir.
   */
  protected focoDe(lado: Lado): string | null {
    const sitio = lado.sitio();
    if (sitio) {
      return sitio.codigo;
    }
    const portal = lado.portal();
    if (portal) {
      return portal.codigo;
    }
    // ⭐ Y una vía sin portales YA ES un punto: no está a medias, está entera.
    // El motor resuelve su código igual que el de un portal o el de un sitio,
    // así que sirve de foco como cualquier otro.
    const via = lado.via();
    return via && via.portales === 0 ? via.codigo : null;
  }

  /**
   * De qué clase es un lado: la misma pregunta que responde `extremoDe`, pero
   * para pintar en vez de para viajar. Un lado con sitio es de la capa
   * `sitio`; cualquier otro, una dirección.
   */
  private capaDe(lado: Lado): Clase {
    return lado.sitio()?.tipo ?? 'via';
  }

  private comoSeLee(lado: Lado): string {
    const sitio = lado.sitio();
    if (sitio) {
      return sitio.presentacion;
    }
    const portal = lado.portal();
    // Sin portal se lee la vía sola —«PUENTE DE PIEDRA»—, que es toda la
    // dirección que hay. Ponerle un número sería inventárselo.
    return portal ? comoSeLeeLaDireccion(lado.via()!, portal) : comoSeVeLaVia(lado.via()!);
  }

  protected sePuedeGenerar(): boolean {
    // ⭐ LA REGLA DEL PORTAL CONDICIONAL (19/08), en los DOS lados. Un sitio
    // trae su propia coordenada, así que no hay portal que exigirle — y
    // exigírselo dejaría el botón apagado para siempre, porque esa casilla ni
    // siquiera se puede rellenar. Un lado con sitio ya está completo.
    return this.estaListo(this.origen) && this.estaListo(this.destino);
  }

  /**
   * ⭐ Un lado está listo **si de él sale un extremo que mandar**, y se
   * pregunta con la MISMA función que lo compone.
   *
   * Antes era una lista aparte de condiciones —«un sitio, o la pareja vía+portal
   * entera»— y estaba condenada a separarse de `extremoDe`: al entrar las vías
   * sin portal (27/08) habría que acordarse de tocar las dos, y olvidar una
   * dejaba el botón apagado con un extremo perfectamente válido detrás, o
   * encendido sin nada que mandar. Una sola fuente no puede desincronizarse.
   */
  private estaListo(lado: Lado): boolean {
    return this.extremoDe(lado) !== null;
  }

  /**
   * ⭐ ¿Lleva este lado casilla de Nº? [DOC GOV.UK: conditional reveal]
   *
   * Sin vía elegida **sí**: es la casilla apagada que dice «Elige antes la
   * calle», y quitarla haría desaparecer la mitad del formulario mientras se
   * escribe. Con vía elegida, solo si esa vía tiene portales que ofrecer: el
   * PUENTE DE PIEDRA no tiene ninguno, y enseñar un desplegable vacío sería
   * pedir algo que no existe.
   */
  protected pideNumero(lado: Lado): boolean {
    const via = lado.via();
    return via === null || via.portales > 0;
  }
}
