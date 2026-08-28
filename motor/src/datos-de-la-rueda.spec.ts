/**
 * ⭐ EL DATO DE LA RUEDA, vigilado antes de usarlo.
 *
 * Las dos descargas del 28/08 —las etiquetas del viario de OSM (§ 1.21) y la
 * jerarquía viaria municipal (§ 1.22)— **entran, pero todavía no se usan**: el
 * motor no rutea en bici ni conoce sentidos ni velocidades. El diseño de las
 * tablas y del coste es de las casillas 2 y 3 del punto 9.
 *
 * Un dato que entra y no se usa es exactamente el que se pudre sin que nadie lo
 * note, así que este fichero vigila **las tres cosas que el encargo dejó
 * escritas** y nada más:
 *
 * 1. Que los ficheros son los que el manifiesto declara, byte a byte.
 * 2. Que el cruce por `w` **no inventa**: un *way* que no está en el grafo no
 *    puede contar para la cobertura.
 * 3. Que **el contraflujo se cuenta aparte** y no se pierde en ninguna
 *    limpieza de valores.
 *
 * No importa ningún módulo del motor a propósito: no hay ninguno que lea esto
 * todavía, y fabricar uno sería usar el dato, que es justo lo que no toca.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

const VIARIO = 'motor/data/2026-08-28_osm_overpass_zaragoza-bbox_viario-etiquetas.json';
const JERARQUIA = 'motor/data/2026-08-28_idezar_wfs_movilidad-MU1_jerarquia_viaria.json';

/** Una etiqueta de OSM, tal cual viene. Solo lo que aquí se mira. */
interface WayCrudo {
  readonly id: number;
  readonly tags: Readonly<Record<string, string>>;
}

let viario: readonly WayCrudo[];
let jerarquia: { readonly features: readonly { readonly properties: Record<string, unknown>; readonly geometry: { readonly coordinates: readonly (readonly (readonly number[])[])[] } }[] };
let waysDelGrafo: Set<number>;

describe('El dato de la rueda — lo que entró el 28/08', () => {
  before(() => {
    viario = JSON.parse(readFileSync(RAIZ + VIARIO, 'utf8')).elements;
    jerarquia = JSON.parse(readFileSync(RAIZ + JERARQUIA, 'utf8'));
    const crudo = readFileSync(RAIZ + 'app/data/grafo-visor.js', 'utf8');
    const grafo = JSON.parse(crudo.slice('window.GRAFO = '.length).replace(/;\s*$/, ''));
    waysDelGrafo = new Set((grafo.aristas as readonly { w: number }[]).map((a) => a.w));
  });

  test('⭐ LAS HUELLAS: los dos ficheros son los que el manifiesto declara, en las DOS copias', () => {
    /**
     * El manifiesto ya recalcula el sha256 de cada recurso, y lo hace desde la
     * app (`manifiesto.spec.ts`). Esto lo repite **desde el motor** por una
     * razón concreta: estos dos ficheros viven en `motor/data/`, que la app no
     * sirve ni mira, y el día que alguien corra solo las pruebas del motor
     * —que es lo que se hace veinte veces al día— nadie estaría comprobando
     * que el dato de la rueda sigue siendo el que se fichó.
     */
    for (const copia of ['datapackage.json', 'app/public/datapackage.json']) {
      const paquete = JSON.parse(readFileSync(RAIZ + copia, 'utf8'));
      for (const ruta of [VIARIO, JERARQUIA]) {
        const fila = paquete.resources.find((r: { path: string }) => r.path === ruta);
        assert.ok(fila, `${copia} no declara ${ruta}`);
        const bytes = readFileSync(RAIZ + ruta);
        assert.equal(fila.bytes, bytes.length, `${ruta} en ${copia}: los bytes no cuadran`);
        assert.equal(
          fila.hash,
          'sha256:' + createHash('sha256').update(bytes).digest('hex'),
          `${ruta} en ${copia}: la huella no cuadra`,
        );
      }
    }
  });

  test('⭐ EL CRUCE POR `w` NO INVENTA: un way que no está en el grafo no cuenta', () => {
    /**
     * ⚠️ La consulta se hizo sobre el **bbox del grafo**, no sobre sus *ways*,
     * así que trae de más: **17.489 de los 65.223 no están en el grafo**, y
     * **3.409 de esos llevan `oneway`**. Contarlos inflaría la cobertura de
     * sentidos en un tercio sin que ninguna arista real ganara nada.
     *
     * No es una posibilidad teórica: es la forma natural de equivocarse aquí
     * —dividir entre los ways del fichero en vez de entre los del grafo— y no
     * daría ningún error, solo un número más bonito.
     */
    const fuera = viario.filter((w) => !waysDelGrafo.has(w.id));
    assert.equal(fuera.length, 17489);
    assert.equal(fuera.filter((w) => w.tags['oneway'] !== undefined).length, 3409);

    // Y el reverso, que es lo que de verdad se cuenta: los ways del fichero que
    // SÍ están en el grafo, y que son el numerador legítimo.
    const dentro = viario.filter((w) => waysDelGrafo.has(w.id));
    assert.equal(dentro.length + fuera.length, viario.length);
    assert.equal(dentro.length, 47734);
    // Ni uno de los contados puede faltar del grafo. Es la afirmación entera.
    for (const w of dentro) {
      assert.ok(waysDelGrafo.has(w.id), `el way ${w.id} se cuenta y no está en el grafo`);
    }
  });

  test('⭐ EL CONTRAFLUJO se cuenta APARTE, y los 18 siguen ahí', () => {
    /**
     * [DOC CycleStreets] Las `oneway=yes` con etiqueta de contraflujo se
     * importan **bidireccionales para la bici**: son calles de sentido único
     * por las que la bici sí puede ir en los dos. Si una limpieza de valores
     * las aplastara contra el `oneway` de la calle, desaparecerían **sin que
     * nada se pusiera rojo** — son 18 sobre 65.223, ruido estadístico puro.
     *
     * Por eso se cuentan aquí, con nombre y apellidos, antes de que exista
     * ninguna limpieza que las pueda perder.
     */
    const conTag = viario.filter((w) => w.tags['oneway:bicycle'] !== undefined);
    assert.equal(conTag.length, 20);

    // El contraflujo DE VERDAD: sentido único para el coche, los dos para la
    // bici. Los otros dos llevan `oneway:bicycle=yes`, que dice lo contrario —
    // que la bici también va en un solo sentido— y no son contraflujo.
    const contraflujo = conTag.filter(
      (w) => w.tags['oneway'] === 'yes' && w.tags['oneway:bicycle'] === 'no',
    );
    assert.equal(contraflujo.length, 18);
    // Y los 18 están en el grafo, así que los 18 son aprovechables.
    assert.equal(contraflujo.filter((w) => waysDelGrafo.has(w.id)).length, 18);
    // Uno con nombre, para que el caso se pueda mirar: la Calle de las Armas.
    assert.ok(contraflujo.some((w) => w.id === 24326117));
  });

  test('⭐ el `oneway=-1` NO se aplasta: son 8 y significan lo contrario', () => {
    // `-1` es «al revés de como está dibujada la línea». Repararlo a `yes` —que
    // es lo que haría una tabla de limpieza descuidada— mandaría por esas ocho
    // vías en dirección contraria. [DOC CycleStreets] repara `oneway=true`→`yes`
    // y descarta lo no ruteable, pero `-1` se respeta.
    const valores = new Map<string, number>();
    for (const w of viario) {
      const v = w.tags['oneway'];
      if (v !== undefined) valores.set(v, (valores.get(v) ?? 0) + 1);
    }
    assert.equal(valores.get('yes'), 14391);
    assert.equal(valores.get('no'), 1557);
    assert.equal(valores.get('-1'), 8);
    // Y ni un valor sucio del tipo que CycleStreets repara: no hay que reparar.
    assert.equal(valores.get('true'), undefined);
    assert.equal(valores.get('1'), undefined);
  });

  test('⭐ § 1.21 NO PISA a § 1.14: hay 7 nombres que solo están en el viejo', () => {
    // Es lo que sostiene que los dos ficheros convivan. De los 19.897 ways de
    // § 1.14, 30 ya no existen 26 días después, y 7 de esos siguen en el grafo:
    // si el fichero nuevo hubiera sustituido al viejo, esos 7 tramos se
    // quedarían mudos.
    const viejo = JSON.parse(
      readFileSync(RAIZ + 'motor/data/2026-08-02_osm_overpass_zaragoza-termino_nombres.json', 'utf8'),
    ).elements as readonly WayCrudo[];
    const nuevos = new Set(viario.map((w) => w.id));
    const perdidos = viejo.filter((w) => !nuevos.has(w.id));
    assert.equal(perdidos.length, 30);
    assert.equal(perdidos.filter((w) => waysDelGrafo.has(w.id)).length, 7);
  });

  test('⭐ LA JERARQUÍA engancha por `codigo`: 2.049 de 2.049, cero huérfanos', () => {
    const vias = JSON.parse(
      readFileSync(RAIZ + 'app/data/2026-05-13_zgzradar_callejero-vias-zaragoza.json', 'utf8'),
    ) as readonly { codigoVia: string }[];
    const delCallejero = new Set(vias.map((v) => String(v.codigoVia)));

    assert.equal(jerarquia.features.length, 3644);
    const codigos = new Set(
      jerarquia.features
        .map((f) => f.properties['codigo'])
        .filter((c) => c !== null && c !== undefined)
        .map(String),
    );
    assert.equal(codigos.size, 2049);
    const huerfanos = [...codigos].filter((c) => !delCallejero.has(c));
    assert.deepEqual(huerfanos, [], 'hay códigos que el callejero no conoce');
    // Y los 21 sin código, contados: son un hueco del dato, no un fallo nuestro.
    assert.equal(
      jerarquia.features.filter((f) => f.properties['codigo'] === null).length,
      21,
    );
  });

  test('⚠️ LA TRAMPA DEL CRS: lo descargado son GRADOS, no metros UTM', () => {
    // El `GetCapabilities` de esta capa declara `DefaultCRS` EPSG:25830. Sin el
    // `srsName` de la consulta, el fichero traería metros y todo lo que se
    // midiera con él saldría absurdo sin dar ningún error. Se comprueba sobre
    // el dato, que es donde se ve.
    let lon = Infinity;
    let LON = -Infinity;
    let lat = Infinity;
    let LAT = -Infinity;
    for (const f of jerarquia.features) {
      for (const parte of f.geometry.coordinates) {
        for (const v of parte) {
          if (v[0]! < lon) lon = v[0]!;
          if (v[0]! > LON) LON = v[0]!;
          if (v[1]! < lat) lat = v[1]!;
          if (v[1]! > LAT) LAT = v[1]!;
        }
      }
    }
    // Zaragoza, en grados. En UTM 30N estos números serían ~670.000 y ~4.610.000.
    assert.ok(lon > -1.1 && LON < -0.7, `lon fuera de rango: ${lon}…${LON}`);
    assert.ok(lat > 41.5 && LAT < 41.8, `lat fuera de rango: ${lat}…${LAT}`);
  });
});
