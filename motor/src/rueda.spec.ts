/**
 * ⭐ LAS JUECES DE LA RUEDA (29/08, casilla 3 del punto 9).
 *
 * Cada una compra una pieza del coste, y las siete están elegidas del dato con
 * su caso escrito: un guardián que no nombra su caso se cae el día que la red
 * cambie y nadie sabrá si es que el caso desapareció o es que el motor
 * empeoró.
 *
 * ⚠️ **Y hay que decir cómo nacieron.** No se escribieron antes que el código:
 * el código estaba cuando se buscaron los casos, porque los casos hubo que
 * medirlos sobre la red ya construida —cuál es el par de portales donde la
 * preferencia cambia el camino no se puede saber sin la preferencia puesta—.
 * El rojo de cada una es su **contraprueba**: se mutó la pieza que compra y se
 * comprobó que muerde, una a una. Está en el checkpoint del 29/08, con la
 * cifra de cada mordisco.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRedDeLaRueda, DEFECTO_POR_TIPO, type RedDeLaRueda } from './red-rueda.ts';
import { cargarRejilla, enganchar, type Rejilla } from './proyeccion.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { entornoDe } from './gacetero.ts';
import { cargarAparcabicis } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { calcularRuta, cuadernoPara, geometriaDe, type Cuaderno, type Ruta } from './ruta.ts';
import { escribirPasos } from './pasos.ts';
import { admiteComoPuerta, calcularRutaRodando, segundosRodando } from './rodando.ts';
import { VELOCIDAD_KMH } from './rueda.ts';
import { MODOS_ATENDIDOS, calcularTrayecto, type Motor } from './trayecto.ts';
import { leerPeticion } from './peticion.ts';
import type { Modo } from '@desplazame/tipos';

let motor: Motor;
let rueda: RedDeLaRueda;
let peaton: RedEnMemoria;
let rejillaPeaton: Rejilla;
let portales: PortalesEnMemoria;
let cuaderno: Cuaderno;

type Punto = [number, number];

/** Dónde está un portal del censo, en `[lon, lat]` como el grafo. */
function donde(codigo: string): Punto {
  const p = portales.donde.get(codigo)!;
  assert.ok(p, `no existe el portal ${codigo}`);
  return [p.lon, p.lat];
}

/** El extremo de una petición, con su vía, a partir del código de portal. */
function extremo(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo)!;
  return { via: p.via, portal: p.codigo };
}

/** Una ruta rodando entre dos puntos sueltos, con el enganche filtrado. */
function rodar(
  modo: 'bici' | 'patin' | 'bizi',
  a: Punto,
  b: Punto,
  red: RedDeLaRueda = rueda,
): Ruta | null {
  const eo = enganchar(red, motor.rejillaRueda, a[0], a[1], (x) => admiteComoPuerta(red, x, modo));
  const ed = enganchar(red, motor.rejillaRueda, b[0], b[1], (x) => admiteComoPuerta(red, x, modo));
  if (!eo || !ed) {
    return null;
  }
  return calcularRutaRodando(red, cuadernoPara(red), modo, eo, a, ed, b);
}

/**
 * ⭐ Las aristas de un *way*, por su id de OSM y en el orden de la red.
 *
 * ⚠️ **Existe porque el 30/08 se cayeron seis jueces de golpe**, y ninguna por
 * un fallo: pinchaban el ÍNDICE de la arista —`rueda.aristas[7198]`—, y al
 * entrar las 33.770 aristas de empuje la red pasó de 58.914 a 92.684 y se
 * renumeró entera. Los guardianes seguían mirando, pero a otra calle.
 *
 * Un índice no es un nombre: es una posición en un array que cambia cada vez
 * que la red crece. El *way* de OSM sí lo es —se puede abrir en `osm.org/way/…`
 * y es el mismo mañana—, así que desde hoy los casos se anclan ahí.
 */
function aristasDe(way: number): number[] {
  const ks: number[] = [];
  for (let k = 0; k < rueda.aristas.length; k++) {
    if (rueda.aristas[k]!.way === way) ks.push(k);
  }
  return ks;
}

/** La arista de un *way* que mide lo que se dice. Los *ways* largos van partidos. */
function aristaDe(way: number, metros: number): number {
  const k = aristasDe(way).find((i) => Math.abs(rueda.aristas[i]!.metros - metros) < 0.5);
  assert.ok(k !== undefined, `no hay arista del way ${way} de ${metros} m`);
  return k;
}

/** Cuántos metros de una ruta van por carril bici de verdad (`h=cycleway`). */
function metrosDeCarril(ruta: Ruta): number {
  return ruta.trozos
    .filter((t) => rueda.tipoDeWay.get(rueda.aristas[t.arista]!.way) === 'cycleway')
    .reduce((s, t) => s + t.metros, 0);
}

describe('⭐ EL COSTE DE LA RUEDA (29/08)', () => {
  before(() => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    rejillaPeaton = cargarRejilla(peaton);
    portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    const rejillaRueda = cargarRejilla(rueda);
    cuaderno = cuadernoPara(rueda);
    motor = {
      red: peaton,
      rejilla: rejillaPeaton,
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(peaton),
      redRueda: rueda,
      rejillaRueda,
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi: cargarBiZi(entornoDe(portales)),
      cuadernoRueda: cuaderno,
    };
  });

  /**
   * ⭐ JUEZ 1 — LA PREFERENCIA AL CARRIL BICI CAMBIA EL CAMINO.
   *
   * El caso: **Portales.99126 → Portales.126086**. Elegido de un barrido de
   * 600 pares por ser de los que más carril ganan sin desviarse apenas.
   *
   * Se comparan **tres rutas en la misma prueba**, que es lo que hace que esto
   * pruebe algo:
   *
   * - la bici **con** la preferencia: 3.048,7 m, de los que **1.304,1 van por
   *   carril bici**;
   * - la misma red **con el factor a 1**: 2.986 m y **cero carril**;
   * - el peatón por su red: 2.986 m, y cero carril porque el suyo no lo tiene.
   *
   * Los 62 m de más —un 2,1 %— son lo que la preferencia cuesta, y los 1.304 m
   * de carril lo que compra. Sin ella la bici iría exactamente por donde va el
   * peatón, que es justo lo que Antonio no quería ver.
   *
   * ⚠️ **Las cifras se movieron el 30/08 con el empuje**, y a mejor: eran
   * 3.043 m y 1.101 de carril. Lo que cambia es que **9,8 m con la bici en la
   * mano** enlazan con 203 m más de carril bici que antes quedaban al otro
   * lado. La ruta cuesta 6 m más de recorrido y compra 203 de carril; es
   * exactamente lo que esta juez mide, así que sube.
   */
  test('⭐ 1 · la bici se va al carril y el peatón se queda donde iba', () => {
    const a = donde('Portales.99126');
    const b = donde('Portales.126086');

    const conPreferencia = rodar('bici', a, b)!;
    assert.ok(conPreferencia, 'la bici tiene que tener ruta');
    assert.equal(Math.round(conPreferencia.metros), 3049);
    assert.ok(
      metrosDeCarril(conPreferencia) > 1000,
      `esperaba más de 1.000 m de carril y son ${metrosDeCarril(conPreferencia).toFixed(0)}`,
    );

    // La MISMA red con el factor apagado. No es una red distinta: es esta con
    // la preferencia a 1, que es la única forma de aislar lo que compra.
    const sinPreferencia: RedDeLaRueda = {
      ...rueda,
      // ⭐ Los tres calibrados a 1: es lo que era «el factor» antes del 30/08.
      // Se tocan los tres porque `segundosDe` elige según el modo y el tipo, y
      // dejar uno vivo mediría otra cosa.
      factores: {
        rapida: new Float32Array(rueda.aristas.length).fill(1),
        equilibrada: new Float32Array(rueda.aristas.length).fill(1),
        tranquila: new Float32Array(rueda.aristas.length).fill(1),
      },
    };
    const plana = rodar('bici', a, b, sinPreferencia)!;
    assert.equal(Math.round(plana.metros), 2986);
    assert.equal(Math.round(metrosDeCarril(plana)), 0);

    // Y el peatón, por su red, que no tiene carriles: va por donde iba.
    const andando = calcularRuta(
      peaton,
      cuadernoPara(peaton),
      enganchar(peaton, rejillaPeaton, a[0], a[1])!,
      a,
      enganchar(peaton, rejillaPeaton, b[0], b[1])!,
      b,
    )!;
    assert.equal(Math.round(andando.metros), 2986);

    // El precio de preferir, dicho en la aserción y no solo en el comentario.
    const precio = conPreferencia.metros / plana.metros - 1;
    assert.ok(precio > 0 && precio < 0.05, `el rodeo es del ${(precio * 100).toFixed(1)} %`);
  });

  /**
   * ⭐ JUEZ 2 — EL CONTRAFLUJO: la bici sube por donde el coche no puede.
   *
   * El caso: **Avenida de Pirineos**, *way* 23134100, `oneway=yes` más
   * `oneway:bicycle=no` — una de las 18 de [DOC CycleStreets] que se importan
   * **bidireccionales para la bici**.
   *
   * ⚠️ Y de las 18 solo quedan 8 en la red de la rueda: **10 son
   * `h=pedestrian`** —Calle de las Armas, Cádiz, El Temple, San Eugenio…—, y
   * ahí la Ordenanza prohíbe la bici [art. 50.6] aunque OSM etiquete el
   * contraflujo. Donde la etiqueta y la ley discrepan, manda la ley.
   *
   * Se recorre el *way* **al revés de como está dibujado**: 63,2 m en 13 s. Con
   * el contraflujo aplastado contra el `oneway` de la calle, la misma vuelta
   * cuesta **169,7 m y 37 s**.
   *
   * ⚠️ **Eran 715,6 m hasta el 30/08**, y los bajó el empuje: aplastado el
   * contraflujo, ahora queda la salida de bajarse y andar 5,6 m por la acera en
   * vez de dar la vuelta a la manzana entera. La juez **no pierde su tesis** —el
   * contraflujo sigue ganando por 2,7 veces en metros y por 2,8 en tiempo—, y
   * gana precisión: ahora se compara contra la mejor alternativa que existe, no
   * contra la única que había.
   */
  test('⭐ 2 · el contraflujo: 63 m a contramano, 170 si se aplasta', () => {
    const [kPrimera, kUltima] = aristasDe(23134100);
    assert.equal(aristasDe(23134100).length, 2, 'la Avenida de Pirineos son dos aristas');
    const primera = rueda.aristas[kPrimera!]!;
    const ultima = rueda.aristas[kUltima!]!;
    // Las dos abiertas en los dos sentidos, pese a que la calle es de uno.
    assert.equal(rueda.sentido[kPrimera!], 0);
    assert.equal(rueda.sentido[kUltima!], 0);

    const desde = ultima.g[ultima.g.length - 1] as Punto;
    const hasta = primera.g[0] as Punto;
    const contramano = rodar('bici', desde, hasta)!;
    assert.ok(contramano, 'a contramano tiene que haber ruta: es contraflujo');
    assert.equal(Math.round(contramano.metros), 63);

    // Y si el contraflujo se aplastara contra el oneway de la calle, la vuelta
    // a la manzana. Es la contraprueba metida en la propia juez.
    const aplastado: RedDeLaRueda = { ...rueda, sentido: Int8Array.from(rueda.sentido) };
    aplastado.sentido[kPrimera!] = 1;
    aplastado.sentido[kUltima!] = 1;
    const rodeo = rodar('bici', desde, hasta, aplastado)!;
    assert.equal(Math.round(rodeo.metros), 170);
  });

  /**
   * ⭐ JUEZ 3 — EL SENTIDO: la vuelta no es la ida.
   *
   * El caso: **Portales.97463 ↔ Portales.110009**. Ida 1.559 m, vuelta
   * 2.017 m: 458 m de diferencia que son calles de dirección única que la bici
   * no remonta.
   *
   * Es la prueba de que el sentido se aplica de verdad y no solo se guarda: en
   * un grafo no dirigido las dos cifras serían idénticas, porque el camino más
   * corto de A a B lo es también de B a A.
   */
  test('⭐ 3 · una calle de sentido único no se remonta: ida 1.559, vuelta 2.017', () => {
    // ⚠️ Se miden las rutas RODADAS y no los trayectos enteros. Desde el
    // remate del aparcabicis (30/08, casilla 5) un trayecto de bici lleva
    // además el paseo desde el soporte hasta el portal, y ese paseo es
    // DISTINTO en cada sentido —son dos aparcabicis distintos—, así que
    // sumarlo metería en la resta algo que no es el sentido de la calle, que
    // es lo único que esta juez mide.
    const ida = rodar('bici', donde('Portales.97463'), donde('Portales.110009'))!;
    const vuelta = rodar('bici', donde('Portales.110009'), donde('Portales.97463'))!;
    assert.equal(Math.round(ida.metros), 1559);
    assert.equal(Math.round(vuelta.metros), 2017);
    assert.ok(
      vuelta.metros > ida.metros + 400,
      'la vuelta tiene que costar el sentido',
    );

    // Y el peatón, por la misma pareja, va y vuelve igual: su red no tiene
    // sentido y no lo ha ganado.
    const aPie = calcularTrayecto(motor, {
      origen: extremo('Portales.97463'),
      destino: extremo('Portales.110009'),
      modo: 'andando',
    });
    const aPieVuelta = calcularTrayecto(motor, {
      origen: extremo('Portales.110009'),
      destino: extremo('Portales.97463'),
      modo: 'andando',
    });
    assert.equal(aPie.metros, aPieVuelta.metros);
  });

  /**
   * ⭐ JUEZ 4 — EL PATÍN RODEA LO QUE LA BICI ATRAVIESA.
   *
   * El caso: **Portales.120344 → Portales.110047**. La bici va en 1.565 m
   * pisando la Avenida de Madrid; el patín no puede RODAR por ella —no está en
   * la lista cerrada del art. 56.3— y da **1.577,2 m**.
   *
   * ⭐ **Eran 1.972 m hasta el 30/08 por la mañana; el empuje los bajó a 1.577
   * cruzando 33,1 m con el patín en la mano; y por la tarde el selector de ruta
   * los devolvió a 1.972.** Los tres números son correctos y el último es el
   * mejor de los tres, aunque sea el más largo:
   *
   * | | metros | min | carril bici | metros de tráfico |
   * |---|---|---|---|---|
   * | con el calibrado de la bici | 1.577 | 6,7 | 381 | 113 `primary` + 86 `tertiary` |
   * | con el suyo (el fuerte) | **1.972** | 7,1 | **601** | **0** |
   *
   * El patín dejó de compartir calibrado con la bici porque su vía ciclista es
   * **OBLIGATORIA** [ORD art. 56.2.c] y la calzada solo subsidiaria [56.3]:
   * eso no es un gusto que se pueda elegir, es la jerarquía que manda la
   * Ordenanza. Con ella paga 395 m y compra **220 m más de carril bici y CERO
   * metros de vía con tráfico**. Que la cifra coincida con la de antes del
   * empuje es casualidad de la aritmética, no vuelta atrás: aquella iba por la
   * calzada y esta va por el carril.
   *
   * La tesis de la juez no se toca y es la de siempre: **el patín no RUEDA ni
   * un metro por donde no puede** — cero aristas vedadas, y se sigue
   * comprobando.
   *
   * Lo que la prueba mira no es solo la diferencia de metros: mira **que la
   * ruta del patín no pise ni una arista vedada**. Una ruta más larga podría
   * serlo por casualidad; cero aristas prohibidas no es casualidad.
   *
   * ⚠️ **Y esta juez NO ha quedado al byte**, aunque el mini-encargo del 29/08
   * por la tarde la pedía así. Cambian dos números y los dos cambian a mejor:
   *
   * - el patín pasa de **1.975 a 1.972 m** — 3 m de atajo;
   * - y lo que la bici le pisa de vedado, de **113 a 63 m**.
   *
   * El porqué es que **la Avenida de Madrid no es uniforme**, y hasta hoy la
   * tratábamos como si lo fuera. Sus cuatro tramos de esta ruta llevan los
   * cuatro `limite_vel = 30` del dato municipal, pero `lanes` de OSM dice que
   * dos tienen **dos carriles por sentido** y dos tienen **uno**. Y vía
   * pacificada [ORD art. 15.2.a.ii] es un carril por sentido **Y** 30 km/h: los
   * de un carril lo son y el patín puede pisarlos; los de dos, no.
   *
   * Así que no es que el defecto haya pisado a la señal —el 30 municipal manda
   * y se usa—: es que ahora se sabe **cuántos carriles** tiene cada tramo, y esa
   * es la otra mitad de la definición. Se dice, se cambian los números y se
   * escribe por qué.
   */
  test('⭐ 4 · el patín no rueda por la Avenida de Madrid: 1.565 vs 1.972 m', () => {
    const a = donde('Portales.120344');
    const b = donde('Portales.110047');

    const bici = rodar('bici', a, b)!;
    const patin = rodar('patin', a, b)!;
    assert.equal(Math.round(bici.metros), 1565);
    assert.equal(Math.round(patin.metros), 1972);

    const vedadasDeLaBici = bici.trozos.filter((t) => rueda.accesoPatin[t.arista] === 0);
    assert.ok(vedadasDeLaBici.length > 0, 'la bici tiene que pisar lo que el patín no puede');
    assert.equal(
      Math.round(vedadasDeLaBici.reduce((s, t) => s + t.metros, 0)),
      63,
      'los metros vedados que la bici sí pisa',
    );

    // ⭐ Y el porqué, en la aserción y no solo en el comentario: los dos tramos
    // vedados son los de DOS carriles por sentido, con el mismo 30 municipal
    // que los abiertos. Es la definición del art. 15.2.a.ii entera, no su
    // mitad de velocidad.
    for (const t of vedadasDeLaBici) {
      assert.equal(rueda.limiteKmh[t.arista], 30, 'el límite es 30 en los cuatro tramos');
      assert.equal(rueda.fuenteLimite[t.arista], 1, 'y lo dice el municipal');
      assert.ok(
        rueda.carrilesPorSentido[t.arista]! >= 2,
        'lo que veda no es la velocidad: son los carriles',
      );
    }

    // Y la del patín, ni uno. Esto es lo que de verdad se compra.
    assert.equal(patin.trozos.filter((t) => rueda.accesoPatin[t.arista] === 0).length, 0);
  });

  /**
   * ⭐ JUEZ 5 — LA BiZi NO SALE DEL TÉRMINO.
   *
   * El caso: la arista 22800, un tramo `tertiary` de **11,6 km sin nombre**
   * que sale del término por el sur. La bici lo recorre; la BiZi **ni siquiera
   * engancha ahí**, porque el filtro del enganche no le deja ver esa arista.
   *
   * ⚠️ Y aquí va un resultado que hay que decir aunque no luzca: **entre dos
   * direcciones del censo la frontera no cambia ninguna ruta**. Se barrieron
   * 600 pares al azar y los 160 portales más extremos del término, y **cero**
   * rutas de bici salen. Es lógico y conviene tenerlo escrito: la frontera es
   * el rectángulo de los propios portales, y las 954 aristas de fuera son
   * **863 `track` y 61 `path`** —caminos rurales de Valdevares, la carretera
   * de Zuera, Mediana— a los que ninguna dirección lleva.
   *
   * O sea: el veto está puesto y funciona, y hoy solo se puede ver donde la
   * ruta empieza fuera. Que la BiZi y la bici den lo mismo entre dos portales
   * **no es un fallo**: es que el contrato del servicio y el callejero
   * municipal cubren el mismo sitio.
   */
  test('⭐ 5 · la frontera del contrato BiZi veta 954 aristas, y se nota donde hay que notarlo', () => {
    const k = aristaDe(208770827, 11630.9);
    assert.equal(rueda.enElTermino[k], 0, 'el way 208770827 tiene que caer fuera del término');
    const arista = rueda.aristas[k]!;
    const p0 = arista.g[0] as Punto;
    const pN = arista.g[arista.g.length - 1] as Punto;

    // La bici la recorre entera.
    const bici = rodar('bici', p0, pN)!;
    assert.ok(bici, 'la bici sí puede ir por un camino rural de fuera');
    assert.equal(Math.round(bici.metros), 11631);

    // La BiZi no encuentra por dónde empezar: [DOC Valhalla, Loki] el filtro
    // de candidatos es del modelo de coste, y ese modelo no admite esa arista.
    assert.equal(
      enganchar(rueda, motor.rejillaRueda, p0[0], p0[1], (x) => admiteComoPuerta(rueda, x, 'bizi')),
      null,
    );
    assert.equal(rodar('bizi', p0, pN), null);

    // El recuento entero, para que la cifra no viva solo en un comentario.
    let fuera = 0;
    for (const v of rueda.enElTermino) {
      if (v === 0) fuera++;
    }
    assert.equal(fuera, 954);
  });

  /**
   * ⭐ JUEZ 6 — LAS VELOCIDADES: los minutos escalan como deben.
   *
   * El caso: **Portales.122563 → Portales.124841**, 1.870 m que la bici y la
   * BiZi recorren **por el mismo camino**. Si el camino es el mismo y ningún
   * techo legal muerde por debajo de 20, los segundos tienen que estar en la
   * razón exacta **20/18**, que es la de las dos velocidades de crucero.
   *
   * Se comprueba sobre los segundos SIN redondear: la respuesta los redondea
   * a entero y a 337 s eso ya mueve la razón en la tercera cifra.
   */
  test('⭐ 6 · la misma ruta en bici (18) y en BiZi (20): la razón es 20/18', () => {
    const a = donde('Portales.122563');
    const b = donde('Portales.124841');
    const bici = rodar('bici', a, b)!;
    const bizi = rodar('bizi', a, b)!;

    assert.equal(Math.round(bici.metros), 1870);
    assert.ok(
      Math.abs(bici.metros - bizi.metros) < 0.01,
      'para comparar velocidades el camino tiene que ser el mismo',
    );

    const sBici = segundosRodando(rueda, bici, 'bici');
    const sBizi = segundosRodando(rueda, bizi, 'bizi');
    const razon = sBici / sBizi;
    const esperada = VELOCIDAD_KMH.bizi / VELOCIDAD_KMH.bici;
    assert.ok(
      Math.abs(razon - esperada) < 1e-6,
      `razón ${razon.toFixed(6)}, esperaba ${esperada.toFixed(6)}`,
    );
    // ⚠️ **Y de punta a punta ya NO son 1.870 m**, desde la casilla 6: un
    // trayecto de BiZi son tres tramos —andar a la estación, pedalear a la
    // otra, andar el resto— y mide **2.382 m en 589 s**. La razón 20/18 que
    // esta juez mide vive en el tramo que se pedalea, que es el que se acaba
    // de comprobar arriba; aquí solo se fija que el viaje entero existe, es más
    // largo que el pedaleo pelado, y lleva sus dos hitos.
    const t = calcularTrayecto(motor, {
      origen: extremo('Portales.122563'),
      destino: extremo('Portales.124841'),
      modo: 'bizi',
    });
    assert.equal(t.metros, 2382);
    assert.equal(t.segundos, 589);
    assert.equal(t.pasos.filter((p) => p.giro === 'coge').length, 1);
    assert.equal(t.pasos.filter((p) => p.giro === 'aparca').length, 1);

    // ⭐ Y CADA HITO SABE A QUIÉN PREGUNTAR, Y QUÉ (2/09, punto 11).
    //
    // Es lo que hace que la pantalla pinte «Bicis ahora» donde se coge y
    // «Anclajes ahora» donde se deja. ⚠️ Y va aquí, sobre el trayecto REAL,
    // porque el fixture de la interfaz se lo escribe a mano: si el motor
    // cruzara las dos preguntas —anclajes donde se coge— la pantalla enseñaría
    // un número creíble contestando otra cosa, y ninguna juez de allí lo vería.
    const coge = t.pasos.find((p) => p.giro === 'coge')!;
    const deja = t.pasos.find((p) => p.giro === 'aparca')!;
    assert.equal(coge.aQueEstacion?.pide, 'bicis');
    assert.equal(deja.aQueEstacion?.pide, 'anclajes');
    assert.ok(
      typeof coge.aQueEstacion?.estacion === 'number' && coge.aQueEstacion.estacion > 0,
      'el hito de coger lleva el número de SU estación',
    );
    assert.notEqual(
      coge.aQueEstacion?.estacion,
      deja.aQueEstacion?.estacion,
      'y no es la misma en los dos: se coge en una y se deja en otra',
    );
  });

  /**
   * ⭐ JUEZ 7 — EL TECHO LEGAL MANDA SOBRE LA VELOCIDAD DE CRUCERO.
   *
   * El caso: **Calle José Espronceda**, arista 24919, 399,2 m con
   * `limite_vel = 10` km/h **del dato municipal** (fuente 1, no OSM). La bici
   * cruza a 18 de crucero, pero ahí no puede: 399,2 m a 10 km/h son **143,7 s**
   * y a 18 serían 79,8. Manda el 10.
   *
   * Es la regla (1) del parlamento del 29/08 en acto, y la que hace falta que
   * exista para que el modo tenga techo: sin ella la respuesta prometería un
   * tiempo que la ley no permite.
   */
  test('⭐ 7 · una vía a 10 con crucero 18: manda el 10 (143,7 s, no 79,8)', () => {
    const k = aristaDe(253503683, 399.2);
    assert.equal(rueda.limiteKmh[k], 10);
    assert.equal(rueda.fuenteLimite[k], 1, 'el 10 lo dice el municipal, no OSM');
    assert.equal(rueda.factores.equilibrada[k], 1, 'no es vía con tráfico: sin factor de por medio');

    const arista = rueda.aristas[k]!;
    const p0 = arista.g[0] as Punto;
    const pN = arista.g[arista.g.length - 1] as Punto;
    const ruta = rodar('bici', p0, pN)!;
    assert.equal(Math.round(ruta.metros), 399);

    const segundos = segundosRodando(rueda, ruta, 'bici');
    assert.ok(Math.abs(segundos - 143.7) < 0.5, `esperaba 143,7 s y son ${segundos.toFixed(1)}`);
    // Y lo que costaría sin techo, para que la diferencia esté escrita.
    assert.ok(Math.abs(ruta.metros / (18000 / 3600) - 79.8) < 0.5);
  });

  /**
   * ⭐ JUEZ 8 — LA ROTONDA ES DE SENTIDO ÚNICO AUNQUE NO LO DIGA.
   *
   * ⚠️ **Esta juez nació de una contraprueba que NO mordía.** Se mutó la
   * implicación de `junction=roundabout` —quitarla, y leer solo el tag
   * `oneway`— y las 322 pruebas restantes siguieron en verde: 1.390 aristas de
   * rotonda se habrían abierto en los dos sentidos sin que nada se pusiera
   * rojo. La pieza estaba puesta y sin vigilar.
   *
   * El caso: **RONDA FERROCARRIL**, *way* 44110520, cinco aristas y 349 m de
   * anillo, **sin tag `oneway`** — como 1.390 de las 1.393 aristas de rotonda
   * del subgrafo. Recorrer al revés el tramo del medio (25,5 m) cuesta
   * **548,0 m**, porque hay que salir y volver a entrar. Sin la implicación,
   * la bici cortaría por ahí en 25,5 m, a contramano de un anillo.
   */
  test('⭐ 8 · una rotonda sin tag `oneway` no se remonta: 548 m en vez de 25,5', () => {
    const anillo = aristasDe(44110520);
    assert.equal(anillo.length, 5, 'la rotonda son cinco aristas');
    for (const k of anillo) {
      assert.equal(rueda.sentido[k], 1, 'la rotonda va en el sentido en que está dibujada');
    }

    const medio = rueda.aristas[aristaDe(44110520, 25.5)]!;
    assert.ok(Math.abs(medio.metros - 25.5) < 0.5);
    const desde = medio.g[medio.g.length - 1] as Punto;
    const hasta = medio.g[0] as Punto;

    const conRegla = rodar('bici', desde, hasta)!;
    assert.equal(Math.round(conRegla.metros), 548);

    // Y sin la implicación, el atajo a contramano.
    const abierta: RedDeLaRueda = { ...rueda, sentido: Int8Array.from(rueda.sentido) };
    for (const k of anillo) {
      abierta.sentido[k] = 0;
    }
    const atajo = rodar('bici', desde, hasta, abierta)!;
    assert.equal(Math.round(atajo.metros), 26);

    // Y la cifra que hace que esto importe: cuántas aristas dependen de la
    // implicación y no de ningún tag.
    assert.equal(rueda.cuentas.sentidoPorRotonda, 1390);
  });

  /**
   * ⭐ JUEZ 9 — EL DEFECTO LEGAL LE ABRE AL PATÍN LA CALLE QUE NADIE FICHÓ.
   *
   * El caso: **Camino del Saso**, *way* 166001851, arista 19942, 1.410,3 m de
   * `h=residential`. **MU1 no la conoce** —no tiene `pacificada`, ni zona 30,
   * ni nada—, y hasta el 29/08 por la tarde el patín no podía pisarla.
   *
   * Ahora sí, y no por una analogía: sin límite expreso rige el **defecto del
   * art. 50.b RGC** —un carril por sentido → 30 km/h—, y una vía de un carril
   * por sentido a 30 **es vía pacificada por la definición del art. 15.2.a.ii**
   * de la Ordenanza, que el art. 56.3.b abre al VMP.
   *
   * La juez lo comprueba por los dos lados: que el techo sale de la capa que
   * dice, y que **cerrando esa arista el patín se queda sin ruta** — o sea,
   * que la calle no era prescindible.
   */
  test('⭐ 9 · una residential sin señal es pacificada por el art. 50.b RGC, y el patín la pisa', () => {
    const k = aristaDe(166001851, 1410.3);
    const arista = rueda.aristas[k]!;
    assert.equal(rueda.tipoDeWay.get(arista.way), 'residential');
    // Ni el Ayuntamiento ni OSM le ponen límite: el techo es el defecto legal.
    assert.equal(rueda.fuenteLimite[k], DEFECTO_POR_TIPO);
    assert.equal(rueda.limiteKmh[k], 30);
    assert.equal(rueda.carrilesPorSentido[k], 1);
    assert.equal(rueda.jerarquia.porWay.has(arista.way), false, 'MU1 no la cubre');
    assert.equal(rueda.accesoPatin[k], 1);

    const p0 = arista.g[0] as Punto;
    const pN = arista.g[arista.g.length - 1] as Punto;
    const patin = rodar('patin', p0, pN)!;
    assert.ok(patin, 'el patín tiene que poder recorrerla');
    assert.equal(Math.round(patin.metros), 1410);

    // Y si se le cierra, no hay por dónde: la calle no era prescindible.
    const cerrada: RedDeLaRueda = { ...rueda, accesoPatin: Uint8Array.from(rueda.accesoPatin) };
    cerrada.accesoPatin[k] = 0;
    assert.equal(rodar('patin', p0, pN, cerrada), null);
  });

  /**
   * ⭐ JUEZ 10 — Y LA SEÑAL SIGUE MANDANDO: una >30 expresa sigue vedada.
   *
   * El caso: **Avenida de Montañana**, arista 4446, 1.164,6 m con
   * `limite_vel = 50` **del dato municipal**. Es la otra mitad del defecto, y
   * la que impide que este encargo sea una puerta trasera: el defecto llena el
   * hueco, **no pisa a la señal**. Con dos carriles o con uno, un 50 expreso
   * deja fuera al patín.
   *
   * Y el recuento entero, para que la afirmación no dependa de una calle:
   * **5.544 aristas** tienen límite expreso de más de 30 y están vedadas.
   */
  test('⭐ 10 · una vía con 50 EXPRESO sigue vedada al patín, y son 5.544', () => {
    const k = aristaDe(31786791, 1164.6);
    assert.equal(rueda.limiteKmh[k], 50);
    assert.equal(rueda.fuenteLimite[k], 1, 'el 50 lo dice el municipal');
    assert.equal(rueda.accesoPatin[k], 0);

    let vedadasExpresas = 0;
    for (let i = 0; i < rueda.aristas.length; i++) {
      const f = rueda.fuenteLimite[i]!;
      if ((f === 1 || f === 2) && rueda.limiteKmh[i]! > 30 && rueda.accesoPatin[i] === 0) {
        vedadasExpresas++;
      }
    }
    assert.equal(vedadasExpresas, 5544);
  });

  /**
   * ⭐ JUEZ 11 — LA MURALLA DEL PEATÓN, EN UN SOLO NÚMERO.
   *
   * No es un recuento de pruebas: es **el sha256 de 391 rutas del peatón**
   * —sus metros, la lista de aristas, la geometría a siete decimales y el
   * texto de sus 9.346 pasos—. Si cualquier cosa de la rueda le rozara el
   * camino, esta cifra cambiaría.
   *
   * Se calculó por primera vez el 29/08 comparando el árbol de trabajo contra
   * un clon de HEAD, y salió idéntica. Aquí queda dentro de la suite para que
   * no haya que acordarse de comprobarlo a mano.
   *
   * ⚠️ Esta juez **debe** ponerse roja el día que alguien cambie el peatón a
   * propósito. Cuando eso pase, se recalcula y se cambia el número **con la
   * razón escrita**, nunca porque estorbe.
   */
  test('⭐ 11 · las 391 rutas del peatón, al byte', () => {
    let semilla = 20260829;
    const azar = (): number => {
      semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
      return semilla / 0x7fffffff;
    };
    const cuadernoPeaton = cuadernoPara(peaton);
    const huella = createHash('sha256');
    const s = portales.situados;
    for (let n = 0; n < 400; n++) {
      const A = s[Math.floor(azar() * s.length)]!;
      const B = s[Math.floor(azar() * s.length)]!;
      const a: Punto = [A.lon, A.lat];
      const b: Punto = [B.lon, B.lat];
      const eo = enganchar(peaton, rejillaPeaton, a[0], a[1]);
      const ed = enganchar(peaton, rejillaPeaton, b[0], b[1]);
      if (!eo || !ed) {
        huella.update('sin-enganche\n');
        continue;
      }
      const r = calcularRuta(peaton, cuadernoPeaton, eo, a, ed, b);
      if (!r) {
        huella.update('sin-ruta\n');
        continue;
      }
      const pasos = escribirPasos(peaton, r, A.codigo, B.codigo, b);
      huella.update(
        r.metros.toFixed(6) +
          '|' +
          r.trozos.map((t) => t.arista).join(',') +
          '|' +
          geometriaDe(r)
            .map((p) => p[0].toFixed(7) + ',' + p[1].toFixed(7))
            .join(' ') +
          '|' +
          pasos.map((p) => p.giro + '~' + p.metros + '~' + p.texto).join('#') +
          '\n',
      );
    }
    assert.equal(
      huella.digest('hex'),
      'e7d98ff6238d4317ba7f0cdfbb258fd2ccbcc481158393ec8da017dfd7775689',
    );
  });

  /**
   * ⭐ EL CONTRATO: `modo` es opcional y su ausencia es `andando`.
   *
   * Es la compatibilidad hacia atrás del 29/08, y la prueba distingue las dos
   * ausencias que el lector distingue: **no venir** es el defecto; **venir y no
   * ser una cadena** sigue sin ser una petición.
   */
  test('⭐ el `modo` que falta vale «andando»; el `modo` que es un 7, no', () => {
    const sinModo = calcularTrayecto(motor, {
      origen: extremo('Portales.99126'),
      destino: extremo('Portales.126086'),
    });
    assert.equal(sinModo.modo, 'andando');
    assert.equal(sinModo.metros, 2986);
    assert.equal(sinModo.avisos.length, 0);

    // Y en el lector, que es donde llega lo de fuera y donde la distinción
    // vive: sin `modo` es una petición con defecto; con un `modo` que no es
    // cadena, no es una petición.
    const cuerpo = { origen: extremo('Portales.99126'), destino: extremo('Portales.126086') };
    assert.equal(leerPeticion(cuerpo)?.modo, 'andando');
    assert.equal(leerPeticion({ ...cuerpo, modo: 'bici' })?.modo, 'bici');
    assert.equal(leerPeticion({ ...cuerpo, modo: 7 }), null);
    assert.equal(leerPeticion({ ...cuerpo, modo: null }), null);
  });

  /**
   * ⭐ **Y HOY NO QUEDA NINGUNO** (2/09). Eran tres el 28/08, dos desde la
   * rueda, uno desde que el bus tuvo su búsqueda el 31/08, y con la casilla 1b
   * del punto 12 el coche también rutea. Esta juez ya no puede comprar que
   * falte uno: compra que **no falte ninguno**, que es lo que sustituye a la
   * expectativa vieja sin dejar el hueco sin vigilar.
   *
   * Se recorre `Modo` del contrato a mano y a propósito: el día que el contrato
   * estrene un séptimo modo, esta juez se pone roja hasta que alguien decida si
   * se calcula o si se contesta con su aviso. Un `MODOS_ATENDIDOS.length === 6`
   * no cazaría eso.
   */
  test('⭐ ya no queda ningún modo del contrato sin ruta', () => {
    const delContrato: readonly Modo[] = ['andando', 'bus', 'bici', 'patin', 'bizi', 'coche'];
    for (const modo of delContrato) {
      assert.ok(
        MODOS_ATENDIDOS.includes(modo),
        `el modo «${modo}» del contrato no lo calcula nadie`,
      );
    }
    assert.equal(MODOS_ATENDIDOS.length, delContrato.length, 'sobra un modo en la lista');
    // Y el aviso de «todavía no» sigue vivo para el modo que no existe: es lo
    // que contesta a un cliente roto, y se compone de la lista, no a mano.
    const t = calcularTrayecto(motor, {
      origen: extremo('Portales.99126'),
      destino: extremo('Portales.126086'),
      modo: 'helicoptero' as Modo,
    });
    assert.equal(t.pasos.length, 0);
    assert.match(t.avisos[0]!.texto, /Todavía no calculamos rutas en modo «helicoptero»/);
    assert.match(t.avisos[0]!.texto, /andando, bici, patin, bizi, bus, coche/);
  });

  /**
   * ⭐ LA MURALLA DEL PEATÓN, dicha desde este lado.
   *
   * El encargo lo pide en voz alta: la rueda no puede tocar al peatón. Aquí se
   * comprueba lo que ninguna prueba del peatón puede comprobar sola — que las
   * dos redes **son objetos distintos** y no comparten ni nodos ni cuaderno—,
   * porque compartirlos sería justo la forma en que una acabaría moviendo a la
   * otra sin que nadie lo viera.
   */
  test('⭐ las dos redes son dos, y no se tocan', () => {
    assert.notEqual(rueda.aristas, peaton.aristas);
    assert.notEqual(rueda.nodos, peaton.nodos);
    assert.equal(peaton.aristas.length, 89047);
    // ⭐ 92.684 desde el 30/08: 58.914 que se ruedan más 33.770 que solo se
    // pisan EMPUJANDO —aceras y zonas peatonales, 1.016,4 km—. El peatón no se
    // mueve: sigue en sus 89.047.
    assert.equal(rueda.aristas.length, 92684);
    assert.equal(
      rueda.cuentas.empujando,
      33770,
      'las que solo se pisan con el vehículo en la mano',
    );
    // Lo que sí se presta, y es a propósito: los cruces por *way*, que no
    // dependen de qué subgrafo se ruteé.
    assert.equal(rueda.nombreDeWay, peaton.nombreDeWay);
    assert.equal(rueda.tipoDeWay, peaton.tipoDeWay);
    // El carril bici existe en una y no en la otra: es la razón de que sean dos.
    const carrilesRueda = rueda.aristas.filter(
      (a) => rueda.tipoDeWay.get(a.way) === 'cycleway',
    ).length;
    const carrilesPeaton = peaton.aristas.filter(
      (a) => peaton.tipoDeWay.get(a.way) === 'cycleway',
    ).length;
    assert.ok(carrilesRueda > 4000, `la rueda tiene ${carrilesRueda} aristas de carril`);
    assert.equal(carrilesPeaton, 0);
  });
});
