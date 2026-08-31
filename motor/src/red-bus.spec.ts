/**
 * ⭐ LAS JUECES DE LA COCINA DE LA RED DE BUS (31/08).
 *
 * ⚠️ **La cocina de verdad se ejecuta una sola vez** y las diez jueces la miran:
 * son 1,5 s y 170 patrones, y cocinarla por juez sería medio minuto de suite
 * para mirar el mismo objeto. Los transbordos, que son lo caro (3,7 s con el
 * peatón cargado), se prueban aparte con un peatón de mentira — así la juez de
 * la `F` dice exactamente lo que quiere decir sin arrastrar 68.649 nodos.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { elFeedQueSeSirve } from './feed.ts';
import {
  calcularTransbordos,
  cocinar,
  enSegundos,
  MAXIMO_TRANSBORDO_M,
  mediana,
  MODO_POR_TIPO,
  operaEl,
  partirCsv,
  servirEstaRed,
  laRedDeBus,
  type Cocinado,
  type ParadaBus,
  type PatronBus,
  type RedDeBus,
} from './red-bus.ts';

let cocinado: Cocinado;
let red: RedDeBus;

describe('⭐ LA COCINA DE LA RED DE BUS Y TRANVÍA', () => {
  before(async () => {
    cocinado = await cocinar(elFeedQueSeSirve().ruta, null);
    red = cocinado.red;
  });

  /**
   * ⭐ JUEZ 1 — CADA VIAJE ESTÁ EN EXACTAMENTE UN PATRÓN.
   *
   * La partición tiene que cerrar: **34.427 viajes** repartidos entre los
   * patrones, ni uno perdido ni uno contado dos veces. Si la clave del patrón
   * se rompiera, esta suma dejaría de dar.
   */
  test('⭐ 1 · los 34.427 viajes se reparten entre los patrones, sin perder ni repetir', () => {
    const suma = red.patrones.reduce((n, p) => n + p.viajes, 0);
    assert.equal(suma, 34_427, 'la partición de viajes en patrones no cierra');
    assert.equal(red.patrones.length, 170);
    // Y ningún patrón vacío: un patrón sin viajes no es un patrón.
    assert.equal(red.patrones.filter((p) => p.viajes === 0).length, 0);
  });

  /**
   * ⭐ JUEZ 2 — LA CLAVE DEL PATRÓN ES LA SECUENCIA.
   *
   * [OTP] *«mismo grupo de trips de una ruta, misma dirección, que paran en la
   * MISMA secuencia de paradas»*. Aquí se compra por los dos lados: **no hay dos
   * patrones con la misma (línea, dirección, secuencia)** —si los hubiera, la
   * agrupación estaría partiendo lo que es uno—, y **dentro de una misma línea y
   * dirección hay secuencias distintas** —si no las hubiera, estaría juntando lo
   * que son varios—.
   */
  test('⭐ 2 · la clave es la secuencia: ni se parte lo mismo ni se junta lo distinto', () => {
    const claves = red.patrones.map((p) => `${p.linea}|${p.direccion}|${p.paradas.join('>')}`);
    assert.equal(new Set(claves).size, claves.length, 'hay dos patrones con la MISMA secuencia');

    // Y la línea 39 tiene ocho patrones distintos, de secuencias distintas.
    const l39 = red.lineas.find((l) => l.corto === '39')!;
    const suyos = red.patrones.filter((p) => p.linea === l39.id);
    assert.equal(suyos.length, 8, 'la 39 tiene ocho patrones');
    assert.equal(new Set(suyos.map((p) => p.paradas.join('>'))).size, 8, 'y las ocho secuencias distintas');

    // Un patrón con una parada MÁS es otro patrón: se comprueba que ninguno de
    // los ocho es prefijo-igual de otro por accidente de la agrupación.
    const largos = suyos.map((p) => p.paradas.length).sort((a, b) => a - b);
    assert.deepEqual(largos, [8, 9, 12, 13, 13, 14, 22, 30]);
  });

  /**
   * ⭐ JUEZ 3 — LOS SALTOS: mediana ≤ máximo, ninguno negativo, y los búhos
   * restan bien.
   *
   * El salto típico es la **mediana** [PROPIO declarado] porque los refuerzos y
   * los búhos meten valores raros; el **máximo** se guarda para no prometer.
   * Y las horas de más de 24:00:00 no se normalizan: la resta funciona igual
   * [referencia GTFS], que es lo que esta juez comprueba sobre un búho de
   * verdad.
   */
  test('⭐ 3 · los saltos: mediana ≤ máximo, ninguno negativo, y un búho resta bien', () => {
    let saltos = 0;
    for (const p of red.patrones) {
      assert.equal(p.saltos.length, p.paradas.length - 1, `${p.id}: un salto por tramo`);
      for (const s of p.saltos) {
        assert.ok(s.tipico >= 0, `${p.id}: salto típico negativo (${s.tipico})`);
        assert.ok(s.maximo >= s.tipico, `${p.id}: máximo ${s.maximo} < típico ${s.tipico}`);
        saltos++;
      }
    }
    assert.equal(saltos, 3362, 'los saltos totales de la red');

    // ⭐ Y LA MEDIANA NO ES EL MÁXIMO, que es lo que hace que esta juez muerda.
    // Sin esta línea, poner el máximo como típico pasaría tan campante: la
    // comprobación `maximo >= tipico` la cumple también la igualdad.
    // Medido: en 126 de los 170 patrones hay al menos un salto donde el típico
    // es ESTRICTAMENTE menor que el máximo.
    const conDiferencia = red.patrones.filter((p) => p.saltos.some((s) => s.maximo > s.tipico));
    assert.equal(conDiferencia.length, 126, 'la mediana se está pareciendo demasiado al máximo');

    // El caso desplegado, la 39 en su patrón principal de vuelta: 45,0 minutos
    // de recorrido típico contra 58,6 del peor viaje. Prometer los 58,6 sería
    // asustar; prometer solo los 45 sin guardar el otro sería no avisar.
    const l39b = red.lineas.find((l) => l.corto === '39')!;
    const principal = red.patrones.find(
      (p) => p.linea === l39b.id && p.principal && p.direccion === '1',
    )!;
    assert.equal(principal.saltos.reduce((n, s) => n + s.tipico, 0), 2700);
    assert.equal(principal.saltos.reduce((n, s) => n + s.maximo, 0), 3517);

    // La resta con horas de después de medianoche, que es donde se rompería.
    assert.equal(enSegundos('25:10:00') - enSegundos('24:55:00'), 900);
    assert.equal(enSegundos('27:35:40') - enSegundos('23:59:00'), 13_000);
    // Y la mediana toma un valor que EXISTIÓ, no un promedio inventado.
    assert.equal(mediana([60, 60, 600]), 60);
    assert.equal(mediana([10, 20]), 10);

    // El patrón de un búho —la N7, que sale a la una— tiene saltos sanos.
    const n7 = red.lineas.find((l) => l.corto === 'N7');
    if (n7) {
      const suyos = red.patrones.filter((p) => p.linea === n7.id);
      assert.ok(suyos.length > 0);
      for (const p of suyos) {
        for (const s of p.saltos) {
          assert.ok(s.tipico >= 0 && s.tipico < 3600, `${p.id}: salto de búho absurdo (${s.tipico} s)`);
        }
      }
    }
  });

  /**
   * ⭐ JUEZ 4 — `operaEl`, con el método Alternate y el agujero de octubre.
   *
   * El censo lo midió y aquí se compra: un lunes normal la red opera, y **el
   * 12/10, el Pilar, NO opera ni un patrón** porque el feed se queda a cero el
   * día 10. Es el dato que hace de esta casilla camino crítico.
   */
  test('⭐ 4 · operaEl: un día normal sí, el Pilar NO, y una zombi nunca', () => {
    // Lunes 5 de octubre de 2026: el último día del bus.
    const elLunes = red.patrones.filter((p) => operaEl(red, p, '20261005'));
    assert.ok(elLunes.length > 0, 'el 05/10 tiene que operar la red');

    // ⚠️ El 12/10, el Pilar: NI UN PATRÓN.
    const elPilar = red.patrones.filter((p) => operaEl(red, p, '20261012'));
    assert.deepEqual(elPilar, [], 'el feed se queda a cero el 10/10: el Pilar no está');
    // Ni el 10 ni el 11.
    assert.equal(red.patrones.filter((p) => operaEl(red, p, '20261010')).length, 0);

    // Del 06 al 09 solo el tranvía, que es lo que el censo midió.
    const elSeis = red.patrones.filter((p) => operaEl(red, p, '20261006'));
    assert.ok(elSeis.length > 0);
    assert.deepEqual([...new Set(elSeis.map((p) => p.modo))], ['tram'], 'del 06 al 09 solo el tranvía');

    // Una zombi no tiene patrones, así que no opera nunca por construcción.
    const zombis = red.lineas.filter((l) => l.patrones === 0);
    assert.equal(zombis.length, 8);
    for (const z of zombis) {
      assert.equal(red.patrones.filter((p) => p.linea === z.id).length, 0);
    }
    // Una fecha que no está en el calendario no opera: no se inventa.
    assert.equal(red.patrones.filter((p) => operaEl(red, p, '20990101')).length, 0);
  });

  /**
   * ⭐ JUEZ 5 — LA TABLA DE MODOS, y que un tipo desconocido PARA.
   *
   * El feed usa los **extendidos**: `704` para las 52 de bus y `900` para el
   * tranvía. ⚠️ Y lo que esta juez compra de verdad es lo otro: que un
   * `route_type` que no esté en la tabla **revienta la cocina** en vez de
   * colarse como bus «porque casi todo es bus».
   */
  test('⭐ 5 · 704→bus, 900→tram, y un route_type desconocido PARA', () => {
    assert.equal(MODO_POR_TIPO['704'], 'bus');
    assert.equal(MODO_POR_TIPO['900'], 'tram');
    assert.equal(MODO_POR_TIPO['0'], 'tram');
    assert.equal(MODO_POR_TIPO['3'], 'bus');
    assert.equal(MODO_POR_TIPO['999'], undefined, 'un tipo inventado no puede tener modo');

    const modos = new Set(red.lineas.map((l) => l.modo));
    assert.deepEqual([...modos].sort(), ['bus', 'tram']);
    assert.equal(red.lineas.filter((l) => l.modo === 'tram').length, 1, 'solo el tranvía');
    assert.equal(red.lineas.filter((l) => l.modo === 'bus').length, 52);

    // Y las paradas heredan el modo de los patrones que las tocan: las 50 del
    // tranvía son las de `stop_code` numérico, que es la guarda del censo.
    const deTranvia = red.paradas.filter((p) => p.modos.includes('tram'));
    assert.equal(deTranvia.length, 50);
    assert.ok(
      deTranvia.every((p) => /^\d+$/.test(p.codigo)),
      'las del tranvía son las de código numérico',
    );
  });

  /**
   * ⭐ JUEZ 6 — LOS TRANSBORDOS SON POR EL PEATÓN, no en línea recta.
   *
   * ⚠️ **Y la diferencia no es cosmética.** Medido sobre el feed real: de los
   * **7.992** pares que en línea recta quedan a ≤500 m, solo **5.294 (66 %)**
   * siguen estando a ≤500 m **andando**. Los otros 2.698 tienen un río, una vía
   * del tren o una manzana en medio.
   *
   * El caso que esta juez usa es real y es el más brutal del feed:
   * «P. Isabel La Católica N.º 3» y «Vía Ibérica / Hospital Militar» están a
   * **414 m en recta y a 3.055 m andando** — la Vía Ibérica en medio. Con un
   * peatón de mentira que devuelve la recta, ese par entraría.
   */
  test('⭐ 6 · un par a 414 m en recta y 3.055 andando NO es transbordo', () => {
    const isabel: ParadaBus = {
      id: '17181', codigo: 'PA17181', nombre: 'P. Isabel La Católica N.º 3',
      lat: 41.6446, lon: -0.9096, modos: ['bus'],
    };
    const iberica: ParadaBus = {
      id: '17576', codigo: 'PA17576', nombre: 'Vía Ibérica / Hospital Militar',
      lat: 41.6412, lon: -0.9083, modos: ['bus'],
    };
    // Con el peatón de verdad (de mentira aquí, pero devolviendo lo MEDIDO):
    const conRodeo = calcularTransbordos([isabel, iberica], () => 3055);
    assert.deepEqual(conRodeo, [], 'a 3.055 m andando no hay transbordo que valga');

    // Y uno que sí: 240 m andando entra, con los dos sentidos.
    const cerca = calcularTransbordos([isabel, iberica], () => 240);
    assert.equal(cerca.length, 2, 'los transbordos van en los dos sentidos');
    assert.deepEqual(cerca.map((t) => t.metros), [240, 240]);
    assert.deepEqual(
      cerca.map((t) => `${t.desde}->${t.hasta}`).sort(),
      ['17181->17576', '17576->17181'],
    );

    // El umbral es el umbral: 500 entra, 501 no.
    assert.equal(calcularTransbordos([isabel, iberica], () => MAXIMO_TRANSBORDO_M).length, 2);
    assert.equal(calcularTransbordos([isabel, iberica], () => MAXIMO_TRANSBORDO_M + 1).length, 0);
    // Y sin camino a pie tampoco: `null` no es «cerca».
    assert.equal(calcularTransbordos([isabel, iberica], () => null).length, 0);
  });

  /**
   * ⭐ JUEZ 7 — EL PRINCIPAL ES EL DE MÁS PARADAS DE SU (LÍNEA, DIRECCIÓN).
   *
   * Es el que la casilla 4 dibujará. [ZetaBus] un refuerzo pintado sería un
   * recorrido truncado — «los viajes cortos son refuerzos y variantes, y darían
   * un recorrido truncado».
   */
  test('⭐ 7 · el principal es el de más paradas de su línea y dirección', () => {
    const porLineaDireccion = new Map<string, PatronBus[]>();
    for (const p of red.patrones) {
      const k = `${p.linea}|${p.direccion}`;
      (porLineaDireccion.get(k) ?? porLineaDireccion.set(k, []).get(k)!).push(p);
    }
    for (const [k, suyos] of porLineaDireccion) {
      const principales = suyos.filter((p) => p.principal);
      assert.equal(principales.length, 1, `${k}: tiene que haber UN principal`);
      const masParadas = Math.max(...suyos.map((p) => p.paradas.length));
      assert.equal(
        principales[0]!.paradas.length,
        masParadas,
        `${k}: el principal no es el de más paradas`,
      );
    }
    // El caso desplegado: la 39, con sus dos principales de 22 y 30 paradas.
    const l39 = red.lineas.find((l) => l.corto === '39')!;
    const suyos = red.patrones.filter((p) => p.linea === l39.id && p.principal);
    assert.deepEqual(suyos.map((p) => p.paradas.length).sort((a, b) => a - b), [22, 30]);
  });

  /**
   * ⭐ JUEZ 8 — LA COCINA ES DETERMINISTA.
   *
   * Dos pasadas sobre el mismo zip tienen que dar **el mismo fichero**, byte a
   * byte. Sin esto, el cocinado no se puede comparar, ni cachear, ni verificar:
   * un `Map` recorrido en otro orden bastaría para que el `sha256` bailara sin
   * que nada haya cambiado.
   */
  test('⭐ 8 · dos cocinas del mismo zip dan el mismo sha256', async () => {
    const otra = await cocinar(elFeedQueSeSirve().ruta, null);
    const huella = (r: RedDeBus): string =>
      createHash('sha256').update(JSON.stringify(r)).digest('hex');
    assert.equal(huella(otra.red), huella(red), 'la cocina no es determinista');
  });

  /**
   * ⭐ JUEZ 9 — RECOCINAR SUSTITUYE LA REFERENCIA, y lo anterior no se muta.
   *
   * [PROPIO declarado] el relevo en caliente es un cambio de referencia a un
   * objeto nuevo. Lo que importa es que **el viejo se queda como estaba**: una
   * petición que lo estuviera leyendo sigue leyendo una red coherente en vez de
   * encontrarse la mitad cambiada debajo.
   */
  test('⭐ 9 · servir una red nueva no toca la anterior', () => {
    servirEstaRed(red);
    const antes = laRedDeBus();
    assert.equal(antes, red);
    const fotoPatrones = antes!.patrones.length;
    const fotoParadas = antes!.paradas.length;

    const otra: RedDeBus = { ...red, patrones: [], paradas: [] };
    servirEstaRed(otra);

    assert.equal(laRedDeBus(), otra, 'la referencia tiene que haber cambiado');
    assert.notEqual(laRedDeBus(), antes);
    // Y la de antes, intacta: nadie la ha vaciado por el camino.
    assert.equal(antes!.patrones.length, fotoPatrones);
    assert.equal(antes!.paradas.length, fotoParadas);

    servirEstaRed(red);
  });

  /**
   * ⭐ JUEZ 10 — EL PARTIDOR DE CSV ENTIENDE LAS COMILLAS.
   *
   * ⚠️ Sale de un fallo cazado durante la construcción, antes de que hubiera
   * ninguna prueba: **934 de las 984 filas de `stops.txt` traen comillas**, y un
   * `split(',')` dejaba los nombres como `"Gran Vía"`, con las comillas dentro
   * del dato. [RFC 4180] un campo puede ir entrecomillado y una comilla dentro
   * se escribe doblada.
   */
  test('⭐ 10 · el CSV se parte respetando comillas, y ningún nombre las arrastra', () => {
    assert.deepEqual(partirCsv('a,b,c'), ['a', 'b', 'c']);
    assert.deepEqual(partirCsv('"a","b"'), ['a', 'b']);
    assert.deepEqual(partirCsv('1,"Gran Vía",3'), ['1', 'Gran Vía', '3']);
    // Una coma DENTRO de un campo entrecomillado no parte el campo.
    assert.deepEqual(partirCsv('1,"Uno, y dos",3'), ['1', 'Uno, y dos', '3']);
    // Y una comilla doblada es una comilla literal.
    assert.deepEqual(partirCsv('"di ""hola"""'), ['di "hola"']);

    // Sobre el dato de verdad: ni un nombre con comillas.
    const sucias = red.paradas.filter((p) => p.nombre.includes('"'));
    assert.deepEqual(sucias, [], 'hay nombres arrastrando comillas del CSV');
    assert.equal(red.paradas.find((p) => p.id === '0101')?.nombre, 'Avenida de la Academia');
  });
});
