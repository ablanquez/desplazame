/**
 * ⭐ EL BANCO DE SENTIDOS (29/08): un juez, un deshielo y nueve testigos.
 *
 * Tres clases de prueba viven aquí, y conviene no confundirlas:
 *
 * 1. **EL JUEZ de la corrección de Siresa.** Verde porque la corrección está
 *    puesta. Si alguien la quita, se pone rojo.
 * 2. **EL GUARDIÁN DEL DESHIELO.** Comprueba que § 1.21 **sigue diciendo lo
 *    que decía** cuando la corrección se escribió. El día que OSM arregle la
 *    calle y se vuelva a descargar el fichero, este se pone rojo y la fila de
 *    la tabla hay que **borrarla**, no actualizarla: la corrección habrá dejado
 *    de hacer falta.
 * 3. ⚠️ **LOS TESTIGOS**, y estos son al revés que todo lo demás de la casa:
 *    **documentan la conducta de HOY, que se sospecha equivocada**, y están
 *    escritos **para caerse** el día que la corrección llegue. Un testigo en
 *    verde no es una buena noticia: es la foto de un candidato que sigue sin
 *    verificar. Es el patrón del Andrés Oliván — el testigo de la bitácora
 *    nº14, que documenta un fallo vivo hasta que se arregla.
 *
 * ── De dónde salen los testigos ─────────────────────────────────────────────
 *
 * De la **sonda-Cygnus** del 29/08 [patrón Telenav: conflar el dato abierto
 * local contra OSM y **dar la lista a verificar, nunca subirla a ciegas**;
 * ImproveOSM declara un 6 % de falsos positivos en esta misma clase de
 * detección]. La sonda cruza `doble_sent` de MU1 contra `oneway` de OSM vía a
 * vía y saca 434 candidatos en cuatro clases; la lista entera vive en el
 * scratchpad y es la mesa de Antonio.
 *
 * **Ninguno de estos nueve está verificado.** No se corrige ni uno hasta que
 * Antonio los mire: aquí solo se deja constancia de qué hace el motor hoy con
 * ellos, con su número, para que el día del arreglo se vea exactamente qué
 * cambió.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRedDeLaRueda, type RedDeLaRueda } from './red-rueda.ts';
import { cargarRejilla, enganchar, type Rejilla } from './proyeccion.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { entornoDe } from './gacetero.ts';
import { cuadernoPara, type Ruta } from './ruta.ts';
import { admiteComoPuerta, calcularRutaRodando } from './rodando.ts';
import { SENTIDOS_CORREGIDOS, sentidoCorregidoDe } from './sentidos-corregidos.ts';

let rueda: RedDeLaRueda;
let rejilla: Rejilla;
let portales: PortalesEnMemoria;
let peaton: RedEnMemoria;

type Punto = [number, number];

/** Las aristas de un *way*, en orden de índice. */
function aristasDe(way: number): number[] {
  const ks: number[] = [];
  for (let k = 0; k < rueda.aristas.length; k++) {
    if (rueda.aristas[k]!.way === way) ks.push(k);
  }
  return ks;
}

function rodar(a: Punto, b: Punto): Ruta | null {
  const eo = enganchar(rueda, rejilla, a[0], a[1], (x) => admiteComoPuerta(rueda, x, 'bici'));
  const ed = enganchar(rueda, rejilla, b[0], b[1], (x) => admiteComoPuerta(rueda, x, 'bici'));
  if (!eo || !ed) return null;
  return calcularRutaRodando(rueda, cuadernoPara(rueda), 'bici', eo, a, ed, b);
}

/** Las dos puntas de un *way*, para recorrerlo entero en los dos sentidos. */
function puntasDe(way: number): readonly [Punto, Punto] {
  const ks = aristasDe(way);
  const primera = rueda.aristas[ks[0]!]!;
  const ultima = rueda.aristas[ks[ks.length - 1]!]!;
  return [primera.g[0] as Punto, ultima.g[ultima.g.length - 1] as Punto];
}

describe('⭐ LOS SENTIDOS: la corrección de Siresa y el banco de testigos', () => {
  before(() => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    portales = cargarPortales();
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    rejilla = cargarRejilla(rueda);
  });

  /**
   * ⭐ EL JUEZ DE SIRESA — la corrección hace lo que dice.
   *
   * `way 24433275`, Calle Monasterio de Siresa, 10 aristas y 414,1 m. OSM la
   * dibuja hacia el Doctor Iranzo y la etiqueta `oneway=yes`; **el sentido de
   * circulación es el contrario**, verificado por Antonio sobre el terreno el
   * 29/08 a raíz de mirar esta misma ruta.
   *
   * Antes de la corrección, `COLOSO 2 → LEOPOLDO ROMEO 27` en bici medía
   * **4.806,8 m y subía Siresa hacia Iranzo en tres trozos: 130,1 m a
   * contramano**. Después midió 4.804,6 m y **no la pisa**.
   *
   * ⚠️ **Y desde el 30/08 mide 4.551 m**, que los bajó el empuje: la ruta
   * cruza el Camino de las Torres con la bici en la mano en vez de rodearlo.
   * Lo que esta juez compra no cambia —que Siresa no se pisa hacia Iranzo, y
   * eso se sigue comprobando arista a arista—; lo que cambia es la ruta
   * alrededor, y su cifra se mueve con ella.
   */
  test('⭐ el juez de Siresa: la ruta COLOSO→ROMEO ya no la recorre hacia Iranzo', () => {
    const ks = aristasDe(24433275);
    assert.equal(ks.length, 10, 'la Calle Monasterio de Siresa tiene 10 aristas');
    for (const k of ks) {
      assert.equal(rueda.sentido[k], -1, `la arista ${k} tiene que ir al revés del dibujo`);
    }

    const origen = portales.donde.get('Portales.93310')!;
    const destino = portales.donde.get('Portales.79358')!;
    const ruta = rodar([origen.lon, origen.lat], [destino.lon, destino.lat])!;
    assert.ok(ruta, 'la ruta del ojo de Antonio tiene que existir');

    const porSiresa = ruta.trozos.filter((t) => rueda.aristas[t.arista]!.way === 24433275);
    assert.deepEqual(porSiresa, [], 'la ruta NO puede volver a pisar Siresa hacia Iranzo');
    assert.equal(Math.round(ruta.metros), 4551);

    // Y el volcado del final, para que el cambio se pueda leer y no solo contar.
    const nombres = ruta.trozos
      .slice(-6)
      .map((t) => rueda.nombreDeWay.get(rueda.aristas[t.arista]!.way) ?? '(mudo)');
    assert.deepEqual(new Set(nombres), new Set(['Calle del Doctor Iranzo', 'Calle de Leopoldo Romeo']));
  });

  /**
   * ⭐ EL GUARDIÁN DEL DESHIELO — la corrección caduca sola.
   *
   * Comprueba, contra el fichero de § 1.21, que el *way* corregido **sigue
   * diciendo lo que decía**. Es la cerradura nº1 de `correcciones.ts` calcada:
   * una corrección se escribe mirando un dato concreto, y si ese dato cambia,
   * la corrección se escribió mirando otra cosa.
   *
   * ⚠️ El día que esto se ponga rojo, **la fila se borra**, no se actualiza: si
   * OSM ya dice `-1`, la corrección sobra; si dice otra cosa, hay que volver a
   * mirar la calle. Y el motor tampoco arrancaría — `sentidoCorregidoDe` lanza
   * antes de abrir el puerto.
   */
  test('⭐ el deshielo: § 1.21 sigue diciendo lo que decía cuando se corrigió', () => {
    const fichero = fileURLToPath(
      new URL('../data/2026-08-28_osm_overpass_zaragoza-bbox_viario-etiquetas.json', import.meta.url),
    );
    const elementos = JSON.parse(readFileSync(fichero, 'utf8')).elements as {
      id: number;
      tags?: Record<string, string>;
    }[];
    const porId = new Map(elementos.map((w) => [w.id, w.tags ?? {}]));

    assert.equal(SENTIDOS_CORREGIDOS.length, 1, 'solo Siresa está verificada');
    for (const c of SENTIDOS_CORREGIDOS) {
      const tags = porId.get(c.way);
      assert.ok(tags, `el way ${c.way} tiene que seguir en § 1.21`);
      assert.equal(
        tags['oneway'],
        c.osmDiceHoy,
        `el way ${c.way} ya no dice lo que decía: la corrección hay que BORRARLA o revisarla`,
      );
      // Y el arranque no debe lanzar mientras eso se cumpla.
      assert.equal(sentidoCorregidoDe(c.way, tags['oneway'], true), c.correccion);
    }
    // Y al revés: si el fichero dijera ya lo corregido, el motor tiene que
    // reventar en vez de aplicar una corrección que sobra.
    assert.throws(() => sentidoCorregidoDe(24433275, '-1', true), /caducada/);
    assert.throws(() => sentidoCorregidoDe(24433275, 'yes', false), /caducada/);
  });

  /**
   * ⚠️ LOS TESTIGOS DE LA CLASE A — «MU1 dice sentido único y OSM no lo dice».
   *
   * Estas siete calles las declara el Ayuntamiento de **un solo sentido**
   * (`doble_sent=NO` en MU1) y **ningún *way* de OSM lleva `oneway`**. Hoy la
   * bici las remonta en los dos sentidos, y por eso ida y vuelta miden lo
   * mismo. Si Antonio confirma que el municipal tiene razón, la vuelta pasará a
   * costar un rodeo y **esta prueba se caerá**.
   *
   * Son la clase A1 de la sonda: **71 vías, 223 aristas, 8,5 km** en total.
   */
  test('⚠️ TESTIGO A · siete calles que MU1 dice de un sentido y la bici remonta hoy', () => {
    const CASOS: readonly { way: number; via: string; metros: number; ida: number }[] = [
      { way: 49359902, via: 'Calle La Cometa', metros: 194.2, ida: 289.9 },
      { way: 49359905, via: 'Calle El Pescadoret', metros: 155.2, ida: 155.2 },
      { way: 24320054, via: 'Calle de las Madres de la Plaza de Mayo', metros: 230.1, ida: 230.1 },
      { way: 36112019, via: 'Calle de la Isla de Malta', metros: 125.4, ida: 125.4 },
      { way: 49359908, via: 'Calle El Sueño', metros: 45.8, ida: 45.8 },
      { way: 49359896, via: 'Calle Josefa Bayeu', metros: 135.1, ida: 135.1 },
      { way: 124408532, via: 'Calle de Antonín Dvořák', metros: 256.5, ida: 256.5 },
    ];
    for (const c of CASOS) {
      const ks = aristasDe(c.way);
      assert.ok(ks.length > 0, `${c.via}: el way ${c.way} tiene que estar en la red`);
      const metros = ks.reduce((s, k) => s + rueda.aristas[k]!.metros, 0);
      assert.ok(Math.abs(metros - c.metros) < 0.5, `${c.via}: ${metros.toFixed(1)} m`);
      // ⚠️ HOY: abiertas en los dos sentidos.
      for (const k of ks) {
        assert.equal(rueda.sentido[k], 0, `${c.via}: hoy la arista ${k} no tiene sentido`);
      }
      const [a, b] = puntasDe(c.way);
      const ida = rodar(a, b)!;
      const vuelta = rodar(b, a)!;
      assert.ok(Math.abs(ida.metros - c.ida) < 1, `${c.via}: ida ${ida.metros.toFixed(1)} m`);
      assert.ok(
        Math.abs(ida.metros - vuelta.metros) < 1,
        `${c.via}: hoy la vuelta cuesta lo mismo que la ida (${vuelta.metros.toFixed(1)})`,
      );
    }
  });

  /**
   * ⚠️ LOS TESTIGOS DE LA CLASE B — «OSM dice sentido único y MU1 dice doble».
   *
   * Aquí es al revés: OSM las etiqueta `oneway=yes` y el Ayuntamiento las
   * declara de **doble sentido**. Hoy la bici las rodea. Si el municipal tiene
   * razón, el rodeo desaparecerá y **esta prueba se caerá**.
   *
   * ⚠️ Y esta clase tiene un falso positivo de manual que la sonda ya aparta:
   * **la avenida de doble calzada**, que OSM parte en dos *ways* de sentido
   * único opuestos y MU1 llama —con razón— de doble sentido. Son **156 vías y
   * 145,2 km**, el 98 % de los metros de la clase. Estos dos casos son de la
   * clase B2, la que queda después de apartarlas: **25 vías, 56 aristas,
   * 1,8 km**.
   */
  test('⚠️ TESTIGO B · dos calles que MU1 dice de doble sentido y la bici rodea hoy', () => {
    const CASOS: readonly { way: number; via: string; ida: number; vuelta: number }[] = [
      // 15,5 m de calle que obligan a un rodeo de 554: es el más gordo del lote.
      { way: 24381157, via: 'Calle de Santiago Guallar', ida: 15.5, vuelta: 554.2 },
      { way: 35994309, via: 'Calle de Gran Turismo', ida: 144.6, vuelta: 277.0 },
    ];
    for (const c of CASOS) {
      const ks = aristasDe(c.way);
      assert.ok(ks.length > 0, `${c.via}: el way ${c.way} tiene que estar en la red`);
      for (const k of ks) {
        assert.equal(rueda.sentido[k], 1, `${c.via}: hoy la arista ${k} es de sentido único`);
      }
      const [a, b] = puntasDe(c.way);
      const ida = rodar(a, b)!;
      const vuelta = rodar(b, a)!;
      assert.ok(Math.abs(ida.metros - c.ida) < 1, `${c.via}: ida ${ida.metros.toFixed(1)} m`);
      assert.ok(
        Math.abs(vuelta.metros - c.vuelta) < 1,
        `${c.via}: hoy la vuelta rodea (${vuelta.metros.toFixed(1)} m)`,
      );
      assert.ok(vuelta.metros > ida.metros, `${c.via}: el rodeo tiene que costar`);
    }
  });

  /**
   * ⚠️ Y LA CIFRA QUE MÁS IMPORTA: dónde la sonda es CIEGA.
   *
   * El contraste municipal×OSM no puede ver una inversión, porque `doble_sent`
   * dice **si** hay sentido único y `oneway` dice **cuál** — donde las dos
   * fuentes coinciden en que lo hay, el contraste calla aunque apunten a lados
   * contrarios. **Siresa vivía justo ahí**, y la encontró un ojo mirando una
   * ruta, no esta sonda.
   *
   * Esta prueba no compra una conducta: fija el TAMAÑO del punto ciego, para
   * que nadie lea los 434 candidatos como si fueran todo lo que hay.
   *
   * Lo que el motor puede contar por sí solo son **16.504 aristas de calzada de
   * sentido único con jerarquía municipal detrás**: el universo entero donde una
   * inversión puede esconderse. La sonda afina más —de esas, en **1.185 vías,
   * 7.846 aristas y 299,8 km** las dos fuentes dicen «único» y por tanto el
   * contraste calla—, pero para separarlas hace falta `doble_sent`, que la
   * jerarquía en memoria no lleva: se agrega por vía y aquí no se usa para
   * nada. La cifra fina vive en la sonda, con su comando; esta prueba fija la
   * gruesa, que es la que puede vigilar.
   */
  test('⚠️ el punto ciego: 16.504 aristas de sentido único donde una inversión podría esconderse', () => {
    const CALZADA = new Set([
      'residential', 'unclassified', 'tertiary', 'secondary', 'primary',
      'service', 'living_street', 'primary_link', 'secondary_link', 'tertiary_link',
    ]);
    let aristas = 0;
    let metros = 0;
    for (let k = 0; k < rueda.aristas.length; k++) {
      const a = rueda.aristas[k]!;
      const tipo = rueda.tipoDeWay.get(a.way);
      if (!tipo || !CALZADA.has(tipo)) continue;
      if (!rueda.jerarquia.porWay.has(a.way)) continue;
      if (rueda.sentido[k] === 0) continue;
      aristas++;
      metros += a.metros;
    }
    assert.equal(aristas, 16504);
    assert.ok(Math.abs(metros / 1000 - 628.3) < 1, `${(metros / 1000).toFixed(1)} km`);
  });
});
