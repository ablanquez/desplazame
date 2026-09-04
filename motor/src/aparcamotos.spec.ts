/**
 * ⭐ LOS APARCAMOTOS: el cocinado, y el cruce con la otra puerta municipal.
 *
 * El Ayuntamiento publica los aparcamotos por dos sitios que no coinciden, y
 * esta casilla eligió la sede. Lo que aquí se compra es que **la elección se
 * nota y se puede contar**: cuántos hay, cuáles se quedan fuera y cuáles gana.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  cocinarAparcamotos,
  comoSeGuarda,
  type PaginaDeLaSede,
} from './cocinar-aparcamotos.ts';
import { aparcamotosCerca, losAparcamotos, type AparcamotoCocinado } from './aparcamotos.ts';

const enElRepo = (fichero: string): string =>
  readFileSync(fileURLToPath(new URL(`../../app/data/${fichero}`, import.meta.url)), 'utf8');

/** El WFS del 18/08, que sigue en el repositorio con su ficha § 1.10. */
interface RasgoDelWfs {
  readonly id: string;
  readonly geometry: { readonly coordinates: readonly number[] };
  readonly properties: Record<string, unknown>;
}

let cocinados: readonly AparcamotoCocinado[];
let wfs: readonly RasgoDelWfs[];

/**
 * ⭐ LOS 32 QUE SOLO ESTÁN EN EL WFS, citados por su id (4/09).
 *
 * No es una lista de adorno: es **lo que cuesta la puerta elegida**. Cada uno de
 * estos es un sitio donde la moto podría aparcar y al que este motor no va a
 * mandar a nadie, porque el directorio de la sede no lo trae. Se escriben uno a
 * uno para que el día que la sede los publique la juez se ponga roja y alguien
 * tenga que venir a mirar — un recuento cuadraría igual con otros 32.
 */
const SOLO_EN_EL_WFS = [
  'MU2_motos.2053',
  'MU2_motos.2115',
  'MU2_motos.2116',
  'MU2_motos.2117',
  'MU2_motos.2118',
  'MU2_motos.2119',
  'MU2_motos.2120',
  'MU2_motos.2121',
  'MU2_motos.2122',
  'MU2_motos.2123',
  'MU2_motos.2124',
  'MU2_motos.2125',
  'MU2_motos.2126',
  'MU2_motos.2127',
  'MU2_motos.2128',
  'MU2_motos.2130',
  'MU2_motos.2131',
  'MU2_motos.2132',
  'MU2_motos.2133',
  'MU2_motos.2134',
  'MU2_motos.2135',
  'MU2_motos.2136',
  'MU2_motos.2137',
  'MU2_motos.2138',
  'MU2_motos.2139',
  'MU2_motos.2140',
  'MU2_motos.2141',
  'MU2_motos.2142',
  'MU2_motos.2143',
  'MU2_motos.2144',
  'MU2_motos.2145',
  'MU2_motos.2146',
] as const;

/** Y el ÚNICO que solo está en la sede: el WFS lo quitó y ella lo conserva. */
const SOLO_EN_LA_SEDE = '1198';

/** Metros entre dos puntos, en el plano local. Basta para casar soportes. */
function metros(ax: number, ay: number, bx: number, by: number): number {
  const dy = (ay - by) * 111320;
  const dx = (ax - bx) * 111320 * Math.cos(((ay + by) / 2) * (Math.PI / 180));
  return Math.hypot(dx, dy);
}

describe('⭐ LOS APARCAMOTOS — la sede como fuente, y lo que cuesta', () => {
  before(() => {
    cocinados = losAparcamotos();
    wfs = (JSON.parse(enElRepo('2026-08-18_wfs_movilidad-MU2_motos.json')) as {
      features: RasgoDelWfs[];
    }).features;
  });

  /**
   * ⭐ EL COCINADO ES EL DE LA SEDE, y se distingue del otro **por el número**.
   *
   * 2.115 y 11.543 plazas son los de la sede; 2.146 y 11.715 los del WFS. Que la
   * cifra sea una y no la otra es lo que hace que la contraprueba «el WFS como
   * fuente» tenga dónde morder.
   */
  test('⭐ 5a · el cocinado trae los 2.115 de la sede, no los 2.146 del WFS', () => {
    assert.equal(cocinados.length, 2115, 'la sede declara 2.115');
    assert.equal(
      cocinados.reduce((suma, a) => suma + a.plazas, 0),
      11543,
      'las plazas de la sede',
    );
    assert.equal(wfs.length, 2146, 'el WFS del repositorio sigue trayendo 2.146');
    assert.notEqual(cocinados.length, wfs.length);

    // Todos con sitio y con plazas: el cocinado descarta los que no lo tengan, y
    // medido el 4/09 no descarta ninguno.
    assert.equal(cocinados.every((a) => Number.isFinite(a.lon) && Number.isFinite(a.lat)), true);
    assert.equal(cocinados.every((a) => a.plazas >= 1), true);
    // Ids únicos, y el fichero ordenado por id numérico.
    assert.equal(new Set(cocinados.map((a) => a.id)).size, 2115);
    for (let k = 1; k < cocinados.length; k++) {
      assert.ok(Number(cocinados[k]!.id) > Number(cocinados[k - 1]!.id), `desordenado en ${k}`);
    }
    // Y dentro del término municipal, como el WFS de § 1.10.
    for (const a of cocinados) {
      assert.ok(a.lat > 41.5 && a.lat < 41.8, `${a.id} fuera de Zaragoza: ${a.lat}`);
      assert.ok(a.lon > -1.2 && a.lon < -0.7, `${a.id} fuera de Zaragoza: ${a.lon}`);
    }
  });

  /**
   * ⭐ EL CRUCE SEDE ↔ WFS, por vecino más próximo (4/09).
   *
   * No hay identificador común —los del WFS son correlativos de GeoServer y los
   * de la sede son ids de tabla con huecos—, así que se casan por posición, que
   * es como § 1.10 lo hizo el 18/08. Donde casan, la coordenada es prácticamente
   * la misma: **es el mismo dato de origen saliendo por dos puertas**.
   *
   * ⚠️ Y la diferencia son **altas y bajas**, no dos censos distintos: 32 que el
   *    WFS ya publicó y la sede todavía no, y 1 que el WFS quitó y la sede
   *    conserva. La lista de los 32 está arriba, uno a uno.
   */
  test('⭐ 5b · 2.114 casan, 32 solo en el WFS y 1 solo en la sede', () => {
    const CASAN_HASTA = 20;
    const usados = new Set<string>();
    const huerfanosDeLaSede: string[] = [];
    for (const a of cocinados) {
      let cual: RasgoDelWfs | null = null;
      let mejor = Infinity;
      for (const f of wfs) {
        const d = metros(a.lon, a.lat, f.geometry.coordinates[0]!, f.geometry.coordinates[1]!);
        if (d < mejor) {
          mejor = d;
          cual = f;
        }
      }
      if (cual && mejor <= CASAN_HASTA) {
        usados.add(cual.id);
      } else {
        huerfanosDeLaSede.push(a.id);
      }
    }
    const huerfanosDelWfs = wfs.filter((f) => !usados.has(f.id)).map((f) => f.id).sort();

    assert.equal(usados.size, 2114, 'los que casan a menos de 20 m');
    assert.deepEqual(huerfanosDelWfs, [...SOLO_EN_EL_WFS]);
    assert.deepEqual(huerfanosDeLaSede, [SOLO_EN_LA_SEDE]);
    // Y la cuenta cierra por los dos lados, que es lo que hace que el cruce sea
    // un cruce y no dos listas sueltas.
    assert.equal(usados.size + huerfanosDeLaSede.length, cocinados.length);
    assert.equal(usados.size + huerfanosDelWfs.length, wfs.length);
  });

  /**
   * ⭐ EL COCINADO ES DETERMINISTA: mismo dato dentro, mismos bytes fuera.
   *
   * Se le dan las páginas **en orden inverso** a propósito. Si el fichero
   * dependiera del orden en que llegan, el `git diff` dejaría de servir para ver
   * si el dato ha cambiado — que es justo para lo que se usa.
   */
  test('⭐ 5c · el cocinado no depende del orden de las páginas ni del reloj', () => {
    const paginas: PaginaDeLaSede[] = [
      {
        totalCount: 2,
        result: [
          {
            id: 20,
            description: 'CALANDA, 9',
            plazas: 4,
            lastUpdated: '2026-09-03T23:13:37',
            geometry: { coordinates: [-0.9, 41.65] },
          },
        ],
      },
      {
        result: [
          {
            id: 3,
            description: 'ARIAS, 24',
            plazas: 2,
            lastUpdated: '2026-09-03T23:14:00',
            geometry: { coordinates: [-0.91, 41.66] },
          },
          // Sin coordenada: no es un sitio donde dejar la moto.
          { id: 4, description: 'SIN SITIO', plazas: 1 },
          // Sin plazas declaradas: no se inventa un número.
          { id: 5, description: 'SIN PLAZAS', geometry: { coordinates: [-0.9, 41.6] } },
        ],
      },
    ];
    const derecho = comoSeGuarda(cocinarAparcamotos(paginas));
    const alReves = comoSeGuarda(cocinarAparcamotos([...paginas].reverse()));
    assert.equal(derecho, alReves);
    // Ordenado por id NUMÉRICO: como texto, el 20 iría antes que el 3.
    assert.deepEqual(cocinarAparcamotos(paginas).aparcamotos.map((a) => a.id), ['3', '20']);
    // Y los dos que no tienen sitio o no tienen plazas se quedan fuera.
    assert.equal(cocinarAparcamotos(paginas).aparcamotos.length, 2);
    assert.equal(derecho.endsWith('\n'), true, 'salto de línea final');
  });

  /**
   * ⭐ Y LA PODA ES PODA, no un radio: ordena por recta y corta.
   *
   * Lo mismo que `dondeAparcarCerca` hace para el coche, y por lo mismo: cada
   * candidato le cuesta un Dijkstra del peatón a quien lo use.
   */
  test('⭐ 5d · los candidatos vienen del más cercano al más lejano', () => {
    const lista = aparcamotosCerca(-0.8779, 41.656, 40);
    assert.equal(lista.length, 40);
    for (let k = 1; k < lista.length; k++) {
      assert.ok(lista[k]!.enRecta >= lista[k - 1]!.enRecta, `el candidato ${k} está más cerca`);
    }
    assert.equal(new Set(lista.map((a) => a.id)).size, 40, 'hay repetidos');
    // Y pedir más de los que hay devuelve los que hay, sin inventar.
    assert.equal(aparcamotosCerca(-0.8779, 41.656, 99999).length, 2115);
  });
});
