/**
 * ⭐ EL POSTE VIVO **A PETICIÓN** (1/09): `GET /api/poste-vivo?poste=N&linea=L`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  El Generar pregunta a Avanza por **un solo poste**, el primero de subida
 *  [ver `preguntarPorLaPrimeraSubida`]. De los demás no se dice el minuto —
 *  «próximo en 3 min» en un poste al que se llega dentro de cuarenta es un
 *  número cierto sobre un autobús que no se va a coger— y desde hoy tampoco se
 *  les pregunta: cada poste cuesta hasta **8,4 s** medidos dentro de un Generar
 *  que [NN/g] ya tiene apretado contra el límite de 10 s de la atención.
 *
 *  Así que lo que quiera saberse de ellos se pide **cuando quien mira lo
 *  quiere**, con su botón. Eso convierte la consulta en una **acción iniciada
 *  por el usuario**, y eso arrastra dos reglas de casa:
 *
 *   1. **Frescura por petición, nunca caché.** Es la regla del BiZi: cada
 *      pulsación vuelve a preguntar de verdad. Un minuto guardado de hace
 *      cuarenta segundos es peor que no tenerlo, porque parece de ahora.
 *      `llegadasDelPoste` no guarda nada — solo deduplica lo que está **en
 *      vuelo**—, y la respuesta va con `Cache-Control: no-store` para que
 *      tampoco lo guarde el navegador.
 *   2. **Single-flight por poste.** Dos pulsaciones a la vez, o dos pestañas,
 *      comparten una sola visita. Es lo que compra la juez 13.
 *
 *  Y es **idempotente**: un GET que no cambia nada, así que se puede repetir.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { alMinuto } from './etapas.ts';
import { estadoVivoDe, llegadasDelPoste, type EstadoVivo } from './avanza.ts';
import type { PosteVivo } from '@desplazame/tipos';

/**
 * Cómo se nombra el poste **dentro de la respuesta del endpoint**: «este».
 *
 * ⚠️ Y no es una pereza. El aviso del Generar va en la cabecera, lejos de los
 *    pasos, y por eso nombra el poste entero —«el poste 33 · Av. Academia
 *    General Militar N.º 37»—: sin el nombre habría que adivinar de cuál de
 *    los tres habla [GOV.UK, *«general errors are not helpful»*]. Esta
 *    respuesta, en cambio, se pinta **dentro del propio paso**, tres palabras
 *    debajo de un texto que ya dice qué poste es. Repetirlo ahí sería ruido.
 */
export const ESTE_POSTE = 'este poste';

/** «próximo en 5 min (dato de las 18:32)» — la frase del dato vivo. */
export function comoSeDiceElProximo(minutos: number, cuando: Date): string {
  return `próximo en ${minutos} min (dato de las ${alMinuto(cuando)})`;
}

/**
 * ⭐ LA FRASE DE CADA ESTADO, **en un solo sitio**.
 *
 * Los mismos tres textos se dicen en dos lugares —los avisos del Generar y la
 * respuesta de este endpoint— y por eso se componen aquí: dos copias serían dos
 * sitios donde cambiar una coma, y la que se olvidara sería la que leyera
 * alguien. Lo único que cambia entre los dos usos es **cómo se nombra el
 * poste**, y eso entra por parámetro.
 *
 * `null` para `sinFuente`: no hay nada que decir de un poste que Avanza no
 * cubre — lo que falta no es el dato, es la fuente, y eso no se avisa.
 */
export function comoSeDiceLoVivo(
  estado: EstadoVivo,
  corto: string,
  donde: string,
): PosteVivo | null {
  if (estado.clase === 'llega') {
    return { clase: 'llega', texto: comoSeDiceElProximo(estado.minutos, estado.cuando) };
  }
  if (estado.clase === 'ausente') {
    // ⚠️ **Lo que la fuente dice, no lo que parece.** [GTFS-Realtime] una
    // entidad AUSENTE del feed en vivo significa **sin información en tiempo
    // real**, no «sin servicio».
    return {
      clase: 'ausente',
      texto:
        `Avanza no anuncia ningún próximo de la línea ${corto} en ${donde} ` +
        'ahora mismo — la espera sale del horario publicado.',
    };
  }
  if (estado.clase === 'mudo') {
    // ⚠️ Las mismas palabras que el BiZi —«disponibilidad no verificada»—
    // porque es la misma condición: se ha preguntado y no se sabe.
    return {
      clase: 'mudo',
      texto:
        `No hemos podido preguntar cuándo pasa la línea ${corto} por ${donde}: ` +
        'disponibilidad no verificada.',
    };
  }
  return null;
}

/** Lo que el servidor tiene que contestar: un código y un cuerpo. */
export interface RespuestaDelPoste {
  readonly codigo: number;
  readonly cuerpo: PosteVivo | { readonly error: string };
}

/**
 * ⭐ EL ENDPOINT, sin `node:http` alrededor — por eso se puede juzgar.
 *
 * Los dos parámetros llegan **crudos de la URL**, que es como llegan de verdad,
 * y se validan aquí: `Number('')` vale 0 y `Number('  3 ')` vale 3, así que un
 * `poste` que falta o que trae basura colaría como un poste legítimo si se
 * dejara al constructor decidir. Se exige lo que es: **dígitos y nada más**.
 *
 * Un poste que no existe en Avanza **no es un 400**: es un `mudo`, porque la
 * fuente contesta algo que no cuadra y eso es exactamente «no lo sabemos». El
 * 400 es para la petición mal escrita, que es un fallo de quien pregunta.
 */
export async function atenderPosteVivo(
  crudoPoste: string | null,
  crudaLinea: string | null,
  pedir: typeof fetch = fetch,
): Promise<RespuestaDelPoste> {
  const poste = (crudoPoste ?? '').trim();
  const linea = (crudaLinea ?? '').trim();
  if (!/^\d+$/.test(poste) || Number(poste) <= 0) {
    return { codigo: 400, cuerpo: { error: 'Falta «poste», o no es un número de poste.' } };
  }
  if (linea === '') {
    return { codigo: 400, cuerpo: { error: 'Falta «linea».' } };
  }
  const estado = estadoVivoDe(await llegadasDelPoste(Number(poste), pedir), linea);
  const dicho = comoSeDiceLoVivo(estado, linea, ESTE_POSTE);
  if (!dicho) {
    // `estadoVivoDe` nunca devuelve `sinFuente` —eso lo decide quien mira el
    // `stop_code`, antes de llegar aquí—, así que esto no debería pasar. Si
    // pasara, se dice que no se sabe y no se inventa una cuarta cosa.
    return { codigo: 200, cuerpo: { clase: 'mudo', texto: 'No hemos podido preguntar.' } };
  }
  return { codigo: 200, cuerpo: dicho };
}
