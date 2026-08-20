/**
 * LA RUTA: de un enganche a otro, por el camino más corto andando.
 *
 * Dijkstra unidireccional con montículo binario. **No hace falta más**, y no
 * es una corazonada: el bidireccional y las jerarquías de contracción existen
 * para grafos continentales, y esto es una ciudad de 93.503 aristas. La doc
 * del punto 7 lo dejó decidido; lo que aquí se hace es medirlo (ver
 * `ruta.spec.ts` y el checkpoint).
 *
 * Dos cosas que parecen detalles y son la diferencia entre una ruta y una
 * ruta ABSURDA:
 *
 * **1 · Las cuatro combinaciones.** Un portal no engancha a un nodo: engancha
 * a un punto DENTRO de una arista. Desde ahí se puede salir por cualquiera de
 * sus dos extremos, y al destino se puede llegar por cualquiera de los suyos.
 * Son 2×2 = cuatro caminos posibles, y el corto no siempre es el que sale por
 * el extremo más cercano — elegirlo a ojo hace dar la vuelta a la manzana.
 * Aquí se resuelven las cuatro **de una sola pasada**: el Dijkstra arranca con
 * los DOS nodos de origen ya en el montículo, cada uno con lo que cuesta
 * llegar a él por dentro de la arista, y al final se mira cuál de los dos
 * extremos del destino sale mejor sumando su propio trozo.
 *
 * **2 · El caso trivial.** Si los dos enganches caen en la MISMA arista, la
 * ruta es el trozo que hay entre ellos y no se toca el grafo. Pasar por
 * Dijkstra ahí obligaría a salir al extremo, recorrer la manzana y volver:
 * cientos de metros para ir a la puerta de al lado. En un grafo no dirigido
 * el trozo directo es siempre el más corto, así que el atajo no solo es más
 * barato, es que es la respuesta.
 */

import type { RedEnMemoria } from './red.ts';
import {
  metrosDeLaGeometria,
  metrosHastaElEnganche,
  metrosPlanos,
  type Enganche,
} from './proyeccion.ts';

/** Un punto en `[lon, lat]`, como el grafo. */
type Punto = readonly [number, number];

/**
 * Un trozo de la ruta que pertenece a una arista, ya en el sentido de la
 * marcha. La primera y la última pueden ir recortadas por el enganche.
 */
export interface TrozoDeRuta {
  /** Índice en `red.aristas`. */
  readonly arista: number;
  readonly metros: number;
  readonly g: readonly Punto[];
}

/** Una ruta calculada. Los conectores van aparte porque no son red. */
export interface Ruta {
  /** Metros de red. **No incluye los conectores**: ver `Conectores`. */
  readonly metros: number;
  readonly trozos: readonly TrozoDeRuta[];
  /** De la puerta de origen a su proyección. */
  readonly conectorOrigen: readonly Punto[];
  /** De la proyección del destino a su puerta. */
  readonly conectorDestino: readonly Punto[];
  /** Si se resolvió por el atajo de la misma arista. */
  readonly trivial: boolean;
  /** Cuántos nodos sacó el montículo. Para poder decir lo que costó. */
  readonly nodosVisitados: number;
}

// ── El montículo binario ─────────────────────────────────────────────────────
//
// Escrito a mano y con dos arrays planos en vez de objetos `{nodo, coste}`:
// una ruta larga saca decenas de miles de veces, y cada objeto sería basura
// que recoger. No hay `decrease-key`: se empuja el duplicado y se descarta al
// sacarlo si ya trae un coste peor. Es lo normal en Dijkstra sobre montículo
// binario, y ahorra el índice inverso.

class Monticulo {
  private readonly nodos: number[] = [];
  private readonly costes: number[] = [];

  get tamano(): number {
    return this.nodos.length;
  }

  meter(nodo: number, coste: number): void {
    this.nodos.push(nodo);
    this.costes.push(coste);
    let hijo = this.nodos.length - 1;
    while (hijo > 0) {
      const padre = (hijo - 1) >> 1;
      if (this.costes[padre]! <= this.costes[hijo]!) {
        break;
      }
      this.intercambiar(padre, hijo);
      hijo = padre;
    }
  }

  /** Saca el más barato. Devuelve `[nodo, coste]`, o `null` si está vacío. */
  sacar(): readonly [number, number] | null {
    if (this.nodos.length === 0) {
      return null;
    }
    const nodo = this.nodos[0]!;
    const coste = this.costes[0]!;
    const ultimoNodo = this.nodos.pop()!;
    const ultimoCoste = this.costes.pop()!;
    if (this.nodos.length > 0) {
      this.nodos[0] = ultimoNodo;
      this.costes[0] = ultimoCoste;
      let padre = 0;
      for (;;) {
        const izquierda = padre * 2 + 1;
        const derecha = izquierda + 1;
        let menor = padre;
        if (izquierda < this.nodos.length && this.costes[izquierda]! < this.costes[menor]!) {
          menor = izquierda;
        }
        if (derecha < this.nodos.length && this.costes[derecha]! < this.costes[menor]!) {
          menor = derecha;
        }
        if (menor === padre) {
          break;
        }
        this.intercambiar(padre, menor);
        padre = menor;
      }
    }
    return [nodo, coste];
  }

  private intercambiar(a: number, b: number): void {
    const n = this.nodos[a]!;
    this.nodos[a] = this.nodos[b]!;
    this.nodos[b] = n;
    const c = this.costes[a]!;
    this.costes[a] = this.costes[b]!;
    this.costes[b] = c;
  }
}

/**
 * Los arrays de trabajo del Dijkstra, reservados UNA vez.
 *
 * Reservar 65.697 huecos por petición sería medio megabyte de basura cada vez.
 * En su lugar se guarda un sello por nodo: si el sello no es el de esta
 * consulta, el nodo cuenta como no visitado. Limpiar es sumar uno a un
 * contador.
 */
export interface Cuaderno {
  readonly coste: Float64Array;
  readonly deArista: Int32Array;
  readonly deNodo: Int32Array;
  readonly sello: Int32Array;
  consulta: number;
}

export function cuadernoPara(red: RedEnMemoria): Cuaderno {
  return {
    coste: new Float64Array(red.nodos),
    deArista: new Int32Array(red.nodos),
    deNodo: new Int32Array(red.nodos),
    sello: new Int32Array(red.nodos),
    consulta: 0,
  };
}

/** Por dónde se puede entrar a la red desde un enganche, y a qué precio. */
interface Puerta {
  readonly nodo: number;
  readonly metros: number;
  /** Si se sale hacia el final de la arista (`true`) o hacia el principio. */
  readonly haciaElFinal: boolean;
}

/**
 * Las una o dos puertas de un enganche.
 *
 * Una sola si el `node_snap` actuó —ya se está en el cruce—; dos si se
 * enganchó por dentro de la arista, y esas dos son la mitad de las cuatro
 * combinaciones.
 */
function puertasDe(red: RedEnMemoria, enganche: Enganche): readonly Puerta[] {
  const arista = red.aristas[enganche.arista]!;
  if (enganche.nodo !== null) {
    return [{ nodo: enganche.nodo, metros: 0, haciaElFinal: enganche.nodo === arista.hasta }];
  }
  const hastaAqui = metrosHastaElEnganche(red, enganche);
  const largo = metrosDeLaGeometria(arista.g);
  return [
    { nodo: arista.desde, metros: hastaAqui, haciaElFinal: false },
    { nodo: arista.hasta, metros: Math.max(0, largo - hastaAqui), haciaElFinal: true },
  ];
}

/**
 * El trozo de la arista del enganche que se recorre, en el sentido de la
 * marcha.
 *
 * `saliendo` es para el origen (de la proyección al extremo) y su negación
 * para el destino (del extremo a la proyección).
 */
function trozoDelEnganche(
  red: RedEnMemoria,
  enganche: Enganche,
  haciaElFinal: boolean,
  saliendo: boolean,
): TrozoDeRuta {
  const arista = red.aristas[enganche.arista]!;
  const g = arista.g;
  const punto: Punto = [enganche.lon, enganche.lat];

  let trozo: Punto[];
  if (haciaElFinal) {
    // De la proyección al último vértice.
    trozo = [punto, ...g.slice(enganche.segmento + 1)];
  } else {
    // De la proyección al primero, andando hacia atrás.
    trozo = [punto, ...g.slice(0, enganche.segmento + 1).reverse()];
  }
  if (!saliendo) {
    trozo = trozo.slice().reverse();
  }
  return {
    arista: enganche.arista,
    metros: metrosDeLaGeometria(trozo),
    g: trozo,
  };
}

/** La geometría de una arista entera, puesta en el sentido de la marcha. */
function trozoEntero(red: RedEnMemoria, arista: number, desdeNodo: number): TrozoDeRuta {
  const a = red.aristas[arista]!;
  const g = a.desde === desdeNodo ? a.g : a.g.slice().reverse();
  return { arista, metros: a.metros, g };
}

/** El conector: de la puerta a la calzada. Dos puntos y ya. */
function conector(desde: Punto, hasta: Punto): readonly Punto[] {
  return metrosPlanos(desde[0], desde[1], hasta[0], hasta[1]) < 0.01 ? [] : [desde, hasta];
}

/**
 * Calcula la ruta entre dos enganches. `null` si no hay camino.
 *
 * `null` no es un error: es el resultado para dos puntos que no se comunican
 * andando. Arriba se convierte en un `Aviso`.
 */
export function calcularRuta(
  red: RedEnMemoria,
  cuaderno: Cuaderno,
  origen: Enganche,
  puntoOrigen: Punto,
  destino: Enganche,
  puntoDestino: Punto,
): Ruta | null {
  const conectorOrigen = conector(puntoOrigen, [origen.lon, origen.lat]);
  const conectorDestino = conector([destino.lon, destino.lat], puntoDestino);

  // ── El caso trivial: la misma arista ──────────────────────────────────────
  if (origen.arista === destino.arista) {
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

  // ── Dijkstra, con las dos puertas del origen ya dentro ────────────────────
  const salidas = puertasDe(red, origen);
  const llegadas = puertasDe(red, destino);

  cuaderno.consulta++;
  const marca = cuaderno.consulta;
  const monticulo = new Monticulo();
  for (const salida of salidas) {
    if (cuaderno.sello[salida.nodo] !== marca || cuaderno.coste[salida.nodo]! > salida.metros) {
      cuaderno.sello[salida.nodo] = marca;
      cuaderno.coste[salida.nodo] = salida.metros;
      cuaderno.deArista[salida.nodo] = -1;
      cuaderno.deNodo[salida.nodo] = -1;
      monticulo.meter(salida.nodo, salida.metros);
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
      // Se para cuando los DOS extremos del destino están resueltos: hasta
      // entonces no se sabe cuál de las cuatro combinaciones gana.
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
      const nuevo = coste + red.aristas[arista]!.metros;
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
    const total = cuaderno.coste[llegada.nodo]! + llegada.metros;
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
  // OJO con la negación que aquí NO va, y que estuvo puesta: `haciaElFinal`
  // dice por qué extremo de SU arista está esa puerta, no en qué sentido se
  // anda. Se llega a ese extremo y desde él se va a la proyección, así que el
  // trozo es el que hay entre la proyección y ESE extremo — el mismo que
  // describe la puerta. Con la negación se dibujaba el trozo del otro lado y
  // la línea saltaba 604,7 m. Entrada nº6 de la bitácora.
  const ultimo = trozoDelEnganche(red, destino, mejorLlegada.haciaElFinal, false);
  if (ultimo.g.length > 1) {
    trozos.push(ultimo);
  }

  return {
    metros: mejorTotal,
    trozos,
    conectorOrigen,
    conectorDestino,
    trivial: false,
    nodosVisitados,
  };
}

/** El trozo de arista que hay entre dos enganches de la MISMA arista. */
function trozoEntreDosEnganches(
  red: RedEnMemoria,
  origen: Enganche,
  destino: Enganche,
): TrozoDeRuta {
  const arista = red.aristas[origen.arista]!;
  const g = arista.g;
  const desdeAqui = metrosHastaElEnganche(red, origen);
  const hastaAlli = metrosHastaElEnganche(red, destino);

  const alDerecho = hastaAlli >= desdeAqui;
  const a = alDerecho ? origen : destino;
  const b = alDerecho ? destino : origen;

  const medio = g.slice(a.segmento + 1, b.segmento + 1);
  const trozo: Punto[] = [
    [a.lon, a.lat],
    ...medio,
    [b.lon, b.lat],
  ];
  const g2 = alDerecho ? trozo : trozo.slice().reverse();
  return {
    arista: origen.arista,
    metros: Math.abs(hastaAlli - desdeAqui),
    g: g2,
  };
}

/** Todos los puntos de la ruta, conectores incluidos, en `[lon, lat]`. */
export function geometriaDe(ruta: Ruta): readonly Punto[] {
  const puntos: Punto[] = [...ruta.conectorOrigen];
  for (const trozo of ruta.trozos) {
    for (const punto of trozo.g) {
      const ultimo = puntos[puntos.length - 1];
      if (ultimo && ultimo[0] === punto[0] && ultimo[1] === punto[1]) {
        continue;
      }
      puntos.push(punto);
    }
  }
  for (const punto of ruta.conectorDestino) {
    const ultimo = puntos[puntos.length - 1];
    if (ultimo && ultimo[0] === punto[0] && ultimo[1] === punto[1]) {
      continue;
    }
    puntos.push(punto);
  }
  return puntos;
}
