/**
 * EL COSTE DE LA RUEDA: la ruta de la bici, el patín y la BiZi.
 *
 * Es el hermano de `ruta.ts` y comparte con él la topología entera —el
 * montículo, las cuatro combinaciones, el caso trivial y el recorte de la
 * geometría por el enganche, que se importan de allí y no se copian—. Lo que
 * cambia es **qué se minimiza** y **quién puede pasar**:
 *
 * | | peatón (`ruta.ts`) | rueda (aquí) |
 * |---|---|---|
 * | objetivo | metros | **segundos** |
 * | sentido | ninguno: se anda en los dos | **se respeta en calzada** |
 * | acceso | por tipo, al construir la red | por tipo **y por modo** |
 * | preferencia | ninguna (retirada el 22/08) | **al carril bici** |
 *
 * ## La fórmula, y sus tres factores
 *
 *     segundos = metros ÷ min(velocidad_del_modo, techo_legal) × factor
 *
 * - **La velocidad del modo** es la de crucero de `rueda.ts`: 18 la bici, 20
 *   la BiZi, 18 el patín, y 5 km/h en un paso que se cruza empujando.
 * - **El techo legal** es el de la vía, donde consta: el municipal manda y
 *   OSM rellena. La bici no supera el límite de la vía, así que se toma el
 *   **mínimo de los dos** — y donde no consta ninguno, la velocidad de crucero
 *   sola, sin inventar un genérico.
 * - **El factor** es la preferencia al carril bici: multiplica el tiempo de lo
 *   que lleva tráfico, con los valores de OSRM. Ver `rueda.ts`.
 *
 * ⭐ **Y los metros que se contestan son los metros que son.** El factor pesa
 * en el montículo y en ningún sitio más: la respuesta dice la distancia real
 * de la ruta elegida, no una distancia ponderada. Un motor que prefiere puede
 * dar un camino más largo; lo que no puede es mentir sobre cuánto mide.
 *
 * ## El sentido, sin cirugía en el grafo
 *
 * El grafo es no dirigido y **sigue siéndolo**: el CSR mete las dos medias
 * aristas. Lo que se hace es mirar, al relajar, si el salto va de `desde` a
 * `hasta` o al revés — dato que la media arista ya lleva—, y descartar el que
 * el sentido prohíbe. No hace falta rehacer nada.
 *
 * Donde sí hay que tener cuidado es en **las puertas del enganche**: en una
 * calle de sentido único no se puede salir hacia el extremo prohibido ni
 * llegar por él, y una puerta que no se filtre ahí se salta el sentido antes
 * de que el Dijkstra empiece.
 */

import {
  Monticulo,
  conector,
  trozoDelEnganche,
  trozoEntero,
  trozoEntreDosEnganches,
  type Cuaderno,
  type Puerta,
  type Ruta,
  type TrozoDeRuta,
} from './ruta.ts';
import {
  metrosDeLaGeometria,
  metrosHastaElEnganche,
  type Enganche,
} from './proyeccion.ts';
import type { RedDeLaRueda } from './red-rueda.ts';
import { VELOCIDAD_EMPUJANDO_KMH, VELOCIDAD_KMH, type ModoDeRueda } from './rueda.ts';

/** Un punto en `[lon, lat]`, como el grafo. */
type Punto = readonly [number, number];

/** De km/h a m/s, que es en lo que se divide. */
const AMS = 1000 / 3600;

/**
 * ⭐ Si un modo puede ENTRAR en una arista. El sentido va aparte.
 *
 * Las tres tablas de la casilla 2, aplicadas: la de la bici ya está resuelta
 * al construir la red —lo que no puede pisar no llegó a entrar—, así que aquí
 * solo queda lo que distingue a los otros dos:
 *
 * - **patín** — su lista cerrada, precalculada arista a arista [art. 56].
 * - **BiZi** — la de la bici **más el término municipal**: su contrato prohíbe
 *   iniciar, finalizar o circular fuera del término. Es la única celda que la
 *   distingue de la bici, y la casilla 2 lo verificó contra las normas del
 *   servicio: ninguna otra restricción DE VÍA.
 */
export function admite(red: RedDeLaRueda, arista: number, modo: ModoDeRueda): boolean {
  if (modo === 'patin') {
    return red.accesoPatin[arista] === 1;
  }
  if (modo === 'bizi') {
    return red.enElTermino[arista] === 1;
  }
  return true;
}

/**
 * ⭐ Si una arista puede ser **PUERTA**: por dónde una ruta empieza o acaba.
 *
 * Es `admite` **menos las aristas de empuje**, y la diferencia importa tanto
 * que hace falta una función aparte.
 *
 * ── El fallo que evita, medido ──────────────────────────────────────────────
 *
 * El 30/08, al abrir lo peatonal al empuje, la rejilla pasó a tener 33.770
 * aceras y zonas peatonales dentro. Y una acera está **más cerca de un portal
 * que la calzada** —es la de su puerta—, así que el enganche empezó a caer
 * ahí: **1.371 de 3.000 portales, el 45,7 %**. Cada ruta arrancaba y terminaba
 * empujando por la acera de su propio portal.
 *
 * El efecto no era cosmético: movía los extremos del problema. La ruta de la
 * juez 4 —`Portales.120344 → Portales.110047` en bici— pasó de **1.565 m y
 * 344 s** a **1.733,8 m y 477 s**, que con un Dijkstra por tiempo solo puede
 * significar una cosa: no era la misma pregunta.
 *
 * ⭐ Y la cabecera de `red-rueda.ts` lo tenía escrito desde la casilla 3, como
 * una de las dos razones de que la rueda tenga red propia: *«con ellas dentro,
 * el enganche de un portal caería en la acera de su puerta y la ruta empezaría
 * prohibida»*. El empuje reabre esa puerta a propósito, y por eso hay que
 * volver a cerrarla **en el enganche y solo ahí**.
 *
 * ── El modelo, que es el de la calle ────────────────────────────────────────
 *
 * Se sale de casa **a la calzada** —el conector de la puerta ya lleva ahí, y
 * no se cobra— y, si por el camino compensa, se baja uno del vehículo. Lo que
 * no pasa es empezar el viaje andando por la acera porque el algoritmo la
 * tenía más a mano. El empuje se gana en mitad de la ruta compitiendo en
 * tiempo; no se regala en las puntas.
 *
 * ── Y cierra SOLO lo que el empuje abrió ────────────────────────────────────
 *
 * Mira `soloEmpujando`, no `empujando`, y la diferencia también está medida.
 * Los **10.450 pasos de cebra** se cruzan empujando desde la casilla 3 y
 * **valían como puerta**; meterlos en esta regla les cerraba una que ya tenían,
 * y eso **empeoraba 16 de 200 rutas de bici** —hasta 154 s en una— comparadas
 * contra un clon de HEAD. Un encargo que abre algo no puede cerrar de paso lo
 * que no le habían pedido.
 */
export function admiteComoPuerta(
  red: RedDeLaRueda,
  arista: number,
  modo: ModoDeRueda,
): boolean {
  return red.soloEmpujando[arista] === 0 && admite(red, arista, modo);
}

/**
 * Si se puede recorrer una arista **en ese sentido**.
 *
 * `haciaDelante` es ir de `desde` a `hasta`, que es el sentido en que OSM
 * dibujó el *way* — el que `oneway=yes` permite.
 */
export function permiteElSentido(
  red: RedDeLaRueda,
  arista: number,
  haciaDelante: boolean,
): boolean {
  const s = red.sentido[arista]!;
  return s === 0 || (haciaDelante ? s === 1 : s === -1);
}

/**
 * ⭐ Los segundos de recorrer unos metros de una arista.
 *
 * Se le pasan los metros y no se leen de la arista porque **el primer y el
 * último trozo van recortados** por el enganche: cobrar la arista entera
 * cuando solo se recorre un tercio fue el ×1,667 de la bitácora nº9.
 */
export function segundosDe(
  red: RedDeLaRueda,
  arista: number,
  modo: ModoDeRueda,
  metros: number,
): number {
  // Quien empuja es peatón y va a 5 km/h: el techo de la vía no le afecta,
  // porque no está circulando. El FACTOR sí, y no es una contradicción — no
  // mide la vía, mide la preferencia, y el empuje tiene que competir en tiempo
  // y no en gusto. Ver `FACTOR_DEL_EMPUJE`, que lleva la medida de lo que
  // pasaba sin él. Como en todo lo demás, `segundosRodando` lo vuelve a
  // dividir para que el tiempo que se dice sea el de verdad.
  if (red.empujando[arista] === 1) {
    return (metros / (VELOCIDAD_EMPUJANDO_KMH * AMS)) * red.factor[arista]!;
  }
  const techo = red.limiteKmh[arista]!;
  const kmh = techo > 0 ? Math.min(VELOCIDAD_KMH[modo], techo) : VELOCIDAD_KMH[modo];
  return (metros / (kmh * AMS)) * red.factor[arista]!;
}

/**
 * Las una o dos puertas de un enganche, **ya filtradas por el sentido**.
 *
 * Es `puertasDe` de `ruta.ts` con la condición que el peatón no necesita:
 *
 * - **Saliendo** hacia `hasta` se recorre la arista hacia delante; hacia
 *   `desde`, hacia atrás.
 * - **Llegando**, es al revés: estar en `hasta` y bajar a la proyección es ir
 *   hacia atrás; estar en `desde` y subir a ella, hacia delante.
 *
 * Si el sentido cierra las dos, la lista queda vacía y arriba eso es «no hay
 * ruta» — que es la verdad: a esa puerta no se llega en ese vehículo.
 */
function puertasDeLaRueda(
  red: RedDeLaRueda,
  enganche: Enganche,
  saliendo: boolean,
): readonly Puerta[] {
  const arista = red.aristas[enganche.arista]!;
  const vale = (haciaElFinal: boolean): boolean =>
    permiteElSentido(red, enganche.arista, saliendo ? haciaElFinal : !haciaElFinal);

  if (enganche.nodo !== null) {
    const haciaElFinal = enganche.nodo === arista.hasta;
    // Con el `node_snap` puesto ya se está en el cruce: no se recorre nada de
    // esta arista, así que el sentido no la afecta.
    return [{ nodo: enganche.nodo, metros: 0, haciaElFinal }];
  }
  const hastaAqui = metrosHastaElEnganche(red, enganche);
  const largo = metrosDeLaGeometria(arista.g);
  const puertas: Puerta[] = [];
  if (vale(false)) {
    puertas.push({ nodo: arista.desde, metros: hastaAqui, haciaElFinal: false });
  }
  if (vale(true)) {
    puertas.push({ nodo: arista.hasta, metros: Math.max(0, largo - hastaAqui), haciaElFinal: true });
  }
  return puertas;
}

/**
 * Calcula la ruta rodando entre dos enganches. `null` si no hay camino.
 *
 * Como en el peatón, `null` no es un error: es el resultado para dos puntos
 * que ese vehículo no comunica. Arriba se convierte en un `Aviso`.
 */
export function calcularRutaRodando(
  red: RedDeLaRueda,
  cuaderno: Cuaderno,
  modo: ModoDeRueda,
  origen: Enganche,
  puntoOrigen: Punto,
  destino: Enganche,
  puntoDestino: Punto,
): Ruta | null {
  const conectorOrigen = conector(puntoOrigen, [origen.lon, origen.lat]);
  const conectorDestino = conector([destino.lon, destino.lat], puntoDestino);

  // ── El caso trivial: la misma arista, y solo si el sentido lo permite ─────
  // El atajo del peatón vale «siempre» porque su grafo no tiene sentido. Aquí
  // hay que mirarlo: en una calle de dirección única, ir a la puerta de atrás
  // significa dar la vuelta a la manzana, y devolver el trozo directo sería
  // mandar a contramano los pocos metros que más se notan.
  if (origen.arista === destino.arista) {
    const desdeAqui = metrosHastaElEnganche(red, origen);
    const hastaAlli = metrosHastaElEnganche(red, destino);
    const haciaDelante = hastaAlli >= desdeAqui;
    if (permiteElSentido(red, origen.arista, haciaDelante)) {
      const trozo = trozoEntreDosEnganches(red, origen, destino);
      return {
        metros: trozo.metros,
        trozos: trozo.metros === 0 ? [] : [trozo],
        conectorOrigen,
        conectorDestino,
        trivial: true,
        nodosVisitados: 0,
      };
    }
    // Y si no lo permite, se sigue al Dijkstra, que sabe dar la vuelta.
  }

  // ── Dijkstra por TIEMPO, con las puertas del origen ya dentro ─────────────
  const salidas = puertasDeLaRueda(red, origen, true);
  const llegadas = puertasDeLaRueda(red, destino, false);
  if (salidas.length === 0 || llegadas.length === 0) {
    return null;
  }

  // El coste de una puerta se mide con la MISMA vara que el de una arista
  // entera: sus metros, convertidos a segundos por la velocidad de SU arista.
  const costeDePuerta = (enganche: Enganche, puerta: Puerta): number =>
    segundosDe(red, enganche.arista, modo, puerta.metros);

  cuaderno.consulta++;
  const marca = cuaderno.consulta;
  const monticulo = new Monticulo();
  for (const salida of salidas) {
    const coste = costeDePuerta(origen, salida);
    if (cuaderno.sello[salida.nodo] !== marca || cuaderno.coste[salida.nodo]! > coste) {
      cuaderno.sello[salida.nodo] = marca;
      cuaderno.coste[salida.nodo] = coste;
      cuaderno.deArista[salida.nodo] = -1;
      cuaderno.deNodo[salida.nodo] = -1;
      monticulo.meter(salida.nodo, coste);
    }
  }

  const buscados = new Set(llegadas.map((l) => l.nodo));
  const resueltos = new Set<number>();
  const cerrado = new Set<number>();
  let nodosVisitados = 0;

  while (monticulo.tamano > 0) {
    const sacado = monticulo.sacar()!;
    const [nodo, coste] = sacado;
    if (cerrado.has(nodo)) {
      continue;
    }
    if (cuaderno.sello[nodo] !== marca || coste > cuaderno.coste[nodo]!) {
      continue;
    }
    cerrado.add(nodo);
    nodosVisitados++;

    if (buscados.has(nodo)) {
      resueltos.add(nodo);
      if (resueltos.size === buscados.size) {
        break;
      }
    }

    for (let k = red.inicio[nodo]!; k < red.inicio[nodo + 1]!; k++) {
      const vecino = red.salidaVecino[k]!;
      if (cerrado.has(vecino)) {
        continue;
      }
      const arista = red.salidaArista[k]!;
      // ⭐ Las dos puertas que el peatón no tiene: el modo y el sentido.
      if (!admite(red, arista, modo)) {
        continue;
      }
      const a = red.aristas[arista]!;
      if (!permiteElSentido(red, arista, a.desde === nodo)) {
        continue;
      }
      const nuevo = coste + segundosDe(red, arista, modo, a.metros);
      if (cuaderno.sello[vecino] !== marca || nuevo < cuaderno.coste[vecino]!) {
        cuaderno.sello[vecino] = marca;
        cuaderno.coste[vecino] = nuevo;
        cuaderno.deArista[vecino] = arista;
        cuaderno.deNodo[vecino] = nodo;
        monticulo.meter(vecino, nuevo);
      }
    }
  }

  // ── Cuál de las combinaciones ganó ────────────────────────────────────────
  let mejorLlegada: Puerta | null = null;
  let mejorTotal = Infinity;
  for (const llegada of llegadas) {
    if (cuaderno.sello[llegada.nodo] !== marca) {
      continue;
    }
    const total = cuaderno.coste[llegada.nodo]! + costeDePuerta(destino, llegada);
    if (total < mejorTotal) {
      mejorTotal = total;
      mejorLlegada = llegada;
    }
  }
  if (!mejorLlegada) {
    return null;
  }

  // ── Deshacer el camino ────────────────────────────────────────────────────
  const alReves: { arista: number; hastaNodo: number }[] = [];
  let nodo = mejorLlegada.nodo;
  while (cuaderno.deArista[nodo] !== -1) {
    alReves.push({ arista: cuaderno.deArista[nodo]!, hastaNodo: nodo });
    nodo = cuaderno.deNodo[nodo]!;
  }
  const nodoSalida = nodo;
  const salida = salidas.find((s) => s.nodo === nodoSalida)!;

  const trozos: TrozoDeRuta[] = [];
  const primero = trozoDelEnganche(red, origen, salida.haciaElFinal, true);
  if (primero.g.length > 1) {
    trozos.push(primero);
  }
  for (let k = alReves.length - 1; k >= 0; k--) {
    const paso = alReves[k]!;
    const a = red.aristas[paso.arista]!;
    trozos.push(trozoEntero(red, paso.arista, a.desde === paso.hastaNodo ? a.hasta : a.desde));
  }
  // La negación que aquí NO va: ver la entrada nº6 de la bitácora, en el
  // mismo sitio de `ruta.ts`. `haciaElFinal` dice por qué extremo de SU arista
  // está la puerta, no en qué sentido se anda.
  const ultimo = trozoDelEnganche(red, destino, mejorLlegada.haciaElFinal, false);
  if (ultimo.g.length > 1) {
    trozos.push(ultimo);
  }

  // ⭐ Los METROS se recuentan sobre los trozos elegidos, no salen del
  // montículo: lo que el montículo lleva son segundos ponderados por el
  // factor, y publicarlos como distancia sería publicar una distancia que no
  // existe. Los segundos se devuelven aparte, en `segundosRodando`.
  let metros = 0;
  for (const trozo of trozos) {
    metros += trozo.metros;
  }

  return {
    metros,
    trozos,
    conectorOrigen,
    conectorDestino,
    trivial: false,
    nodosVisitados,
  };
}

/**
 * ⭐ Los segundos REALES de una ruta ya calculada, sin el factor.
 *
 * El coste del montículo lleva la preferencia dentro, y esa preferencia es una
 * forma de elegir camino, **no una predicción de lo que se tarda**: decir que
 * ir por una avenida cuesta el doble de tiempo del que cuesta sería mentirle
 * al reloj de quien pedalea.
 *
 * Así que la duración se vuelve a sumar sobre los trozos elegidos con las
 * velocidades y los techos legales, y sin multiplicar por nada. Es la misma
 * distinción que hacen los motores entre el *coste* que guía la búsqueda y el
 * *tiempo* que se publica.
 */
export function segundosRodando(red: RedDeLaRueda, ruta: Ruta, modo: ModoDeRueda): number {
  let segundos = 0;
  for (const trozo of ruta.trozos) {
    // El paso que se cruza empujando no lleva factor —su `h` es `footway`, que
    // no está en la lista de tráfico—, así que dividir por 1 no le hace nada y
    // no hace falta un caso aparte.
    segundos += segundosDe(red, trozo.arista, modo, trozo.metros) / red.factor[trozo.arista]!;
  }
  return segundos;
}
