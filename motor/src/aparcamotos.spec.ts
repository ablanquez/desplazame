/**
 * ⭐ LOS APARCAMOTOS: el cocinado, y el cruce con la otra puerta municipal.
 *
 * El Ayuntamiento publica los aparcamotos por dos sitios que no coinciden, y
 * esta casilla se queda con **la capa del GIS**. Lo que aquí se compra es que
 * **la elección se nota y se puede contar**: cuántos hay, cuáles se quedan fuera
 * y cuál es el que se pierde.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  cocinarAparcamotos,
  comoSeGuarda,
  FICHERO_DEL_WFS,
  type CapaDeMotos,
} from './cocinar-aparcamotos.ts';
import { aparcamotosCerca, losAparcamotos, type AparcamotoCocinado } from './aparcamotos.ts';

const enElRepo = (fichero: string): string =>
  readFileSync(fileURLToPath(new URL(`../../app/data/${fichero}`, import.meta.url)), 'utf8');

interface RasgoCrudo {
  readonly id: string;
  readonly geometry: { readonly coordinates: readonly number[] };
  readonly properties: Record<string, unknown>;
}

let cocinados: readonly AparcamotoCocinado[];
let wfs: readonly RasgoCrudo[];

/**
 * ⭐ LOS 6 QUE EL PROPIO WFS DEJA SIN NOMBRE DE CALLE, citados por su id.
 *
 * § 1.10 los declara: son los mismos que llevan los 2 códigos de vía huérfanos
 * (25000 y 9740). No es un fallo del cocinado, es un agujero del origen — y se
 * escribe uno a uno para que el día que el origen lo tape, la juez avise.
 *
 * ⚠️ **Y los seis SÍ tienen nombre en la otra puerta**, medido el 4/09 casándolos
 *    por posición a 0,0 m: cinco son `DE RANILLAS, S/N` y el sexto `GRUPO
 *    ARZOBISPO DOMENECH, 23`. Es parte del precio de la puerta elegida, y está
 *    en la ficha § 1.33 con la tabla. **No se rellenan con el de la sede**:
 *    mezclar las dos puertas para tapar el hueco de una es lo que la doctrina de
 *    procedencia evita.
 */
const SIN_NOMBRE_DE_CALLE = [
  'MU2_motos.138',
  'MU2_motos.171',
  'MU2_motos.172',
  'MU2_motos.173',
  'MU2_motos.222',
  'MU2_motos.1483',
] as const;

/**
 * ⭐ EL ÚNICO QUE LA SEDE TIENE Y EL WFS NO: `MANUEL LASALA, F 44`, id 1198 de
 * la sede, 2 plazas.
 *
 * ⚠️ **Qué es exactamente: `NO CONSTA`.** Puede ser una **baja** que el WFS ya
 *    aplicó y la sede todavía no ha volcado, o un **alta** que solo existe en la
 *    tabla de la sede. Ninguna de las dos fuentes trae fecha de baja, y el WFS
 *    no publica marca temporal ninguna, así que no hay con qué decidirlo. Se
 *    declara sin elegir: es el precio conocido de la puerta elegida.
 */
const SOLO_EN_LA_SEDE_LON = -0.897_369_236_649_489_6;
const SOLO_EN_LA_SEDE_LAT = 41.637_489_368_322_406;

/** Metros entre dos puntos, en el plano local. Basta para casar soportes. */
function metros(ax: number, ay: number, bx: number, by: number): number {
  const dy = (ay - by) * 111320;
  const dx = (ax - bx) * 111320 * Math.cos(((ay + by) / 2) * (Math.PI / 180));
  return Math.hypot(dx, dy);
}

describe('⭐ LOS APARCAMOTOS — la capa maestra como fuente, y lo que cuesta', () => {
  before(() => {
    cocinados = losAparcamotos();
    wfs = (JSON.parse(enElRepo(FICHERO_DEL_WFS)) as { features: RasgoCrudo[] }).features;
  });

  /**
   * ⭐ EL COCINADO ES EL DEL WFS, y se distingue del otro **por el número**.
   *
   * 2.146 y 11.715 plazas son los de la capa; 2.115 y 11.543 los del directorio
   * de la sede. Que la cifra sea una y no la otra es lo que hace que la
   * contraprueba «la sede como fuente» tenga dónde morder.
   */
  test('⭐ 5a · el cocinado trae los 2.146 del WFS, no los 2.115 de la sede', () => {
    assert.equal(cocinados.length, 2146, 'la capa trae 2.146');
    assert.equal(
      cocinados.reduce((suma, a) => suma + a.plazas, 0),
      11715,
      'las plazas de la capa',
    );
    assert.notEqual(cocinados.length, 2115, 'ésos son los de la sede');
    assert.equal(cocinados.length, wfs.length, 'no se ha caído ninguno por el camino');

    // Todos con sitio y con plazas: el cocinado descarta los que no lo tengan, y
    // medido el 4/09 no descarta ninguno.
    assert.equal(cocinados.every((a) => Number.isFinite(a.lon) && Number.isFinite(a.lat)), true);
    assert.equal(cocinados.every((a) => a.plazas >= 1), true);
    // Ids únicos, y el fichero ordenado por el NÚMERO del id.
    assert.equal(new Set(cocinados.map((a) => a.id)).size, 2146);
    const numero = (id: string): number => Number(id.slice(id.lastIndexOf('.') + 1));
    for (let k = 1; k < cocinados.length; k++) {
      assert.ok(numero(cocinados[k]!.id) > numero(cocinados[k - 1]!.id), `desordenado en ${k}`);
    }
    // Y dentro del término municipal, como § 1.10 declara.
    for (const a of cocinados) {
      assert.ok(a.lat > 41.5 && a.lat < 41.8, `${a.id} fuera de Zaragoza: ${a.lat}`);
      assert.ok(a.lon > -1.2 && a.lon < -0.7, `${a.id} fuera de Zaragoza: ${a.lon}`);
    }
  });

  /**
   * ⭐ EL AGUJERO DEL ORIGEN SE COPIA, NO SE TAPA: los 6 sin nombre de calle.
   *
   * El cocinado no les inventa una vía ni los descarta. Son sitios reales donde
   * dejar la moto, y el motor los nombra «el aparcamiento de motos».
   */
  test('⭐ 5b · los 6 que el WFS deja sin calle salen con la calle vacía', () => {
    const sinVia = cocinados.filter((a) => a.via === '').map((a) => a.id);
    assert.deepEqual(sinVia.sort(), [...SIN_NOMBRE_DE_CALLE].sort());
    // Y siguen teniendo lo que importa: un punto y unas plazas.
    for (const id of SIN_NOMBRE_DE_CALLE) {
      const suyo = cocinados.find((a) => a.id === id)!;
      assert.ok(suyo.plazas >= 1, `${id} sin plazas`);
      assert.ok(Number.isFinite(suyo.lon) && Number.isFinite(suyo.lat), `${id} sin punto`);
    }
    // El portal sí falta en más: 8 de los 2.146, y también va vacío.
    assert.equal(cocinados.filter((a) => a.portal === '').length, 8);
  });

  /**
   * ⭐ Y LO QUE CUESTA LA PUERTA ELEGIDA: **un soporte**, y se puede señalar.
   *
   * El directorio de la sede tiene `MANUEL LASALA, F 44` con 2 plazas y el WFS
   * no lo tiene. Se compra por su POSICIÓN —no hay identificador común entre las
   * dos puertas— y lo que se compra es que **ahí no hay ningún aparcamoto** en
   * lo cocinado: el vecino más próximo queda a más de 30 m.
   *
   * ⚠️ Si algún día la capa lo publica, esta juez se pone roja y hay que venir a
   *    mirar. Eso es lo que se quiere: que el precio no se olvide.
   */
  test('⭐ 5c · el único que la sede tiene y la capa no, sigue sin estar', () => {
    let mejor = Infinity;
    for (const a of cocinados) {
      mejor = Math.min(mejor, metros(SOLO_EN_LA_SEDE_LON, SOLO_EN_LA_SEDE_LAT, a.lon, a.lat));
    }
    assert.ok(mejor > 30, `hay un aparcamoto a ${mejor.toFixed(1)} m: ¿lo han publicado ya?`);
  });

  /**
   * ⭐ EL COCINADO ES DETERMINISTA: mismo dato dentro, mismos bytes fuera.
   *
   * Se le dan los rasgos **en orden inverso** a propósito. Si el fichero
   * dependiera del orden en que llegan, el `git diff` dejaría de servir para ver
   * si el dato ha cambiado — que es justo para lo que se usa.
   */
  test('⭐ 5d · el cocinado no depende del orden de los rasgos ni del reloj', () => {
    const capa: CapaDeMotos = {
      features: [
        {
          id: 'MU2_motos.20',
          properties: { Nombre_calle: 'CALANDA', Portal: '9', Numero_plazas: 4 },
          geometry: { coordinates: [-0.9, 41.65] },
        },
        {
          id: 'MU2_motos.3',
          properties: { Nombre_calle: 'ARIAS', Portal: 's/n', Numero_plazas: 2 },
          geometry: { coordinates: [-0.91, 41.66] },
        },
        // Sin coordenada: no es un sitio donde dejar la moto.
        { id: 'MU2_motos.4', properties: { Nombre_calle: 'SIN SITIO', Numero_plazas: 1 } },
        // Sin plazas declaradas: no se inventa un número.
        {
          id: 'MU2_motos.5',
          properties: { Nombre_calle: 'SIN PLAZAS' },
          geometry: { coordinates: [-0.9, 41.6] },
        },
      ],
    };
    const alReves: CapaDeMotos = { features: [...(capa.features ?? [])].reverse() };
    assert.equal(comoSeGuarda(cocinarAparcamotos(capa)), comoSeGuarda(cocinarAparcamotos(alReves)));
    // Ordenado por el NÚMERO del id: como texto, el 20 iría antes que el 3.
    assert.deepEqual(cocinarAparcamotos(capa).aparcamotos.map((a) => a.id), [
      'MU2_motos.3',
      'MU2_motos.20',
    ]);
    // Y los dos que no tienen sitio o no tienen plazas se quedan fuera.
    assert.equal(cocinarAparcamotos(capa).aparcamotos.length, 2);
    assert.equal(comoSeGuarda(cocinarAparcamotos(capa)).endsWith('\n'), true, 'salto final');
  });

  /**
   * ⭐ Y LA PODA ES PODA, no un radio: ordena por recta y corta.
   *
   * Lo mismo que `dondeAparcarCerca` hace para el coche, y por lo mismo: cada
   * candidato le cuesta un Dijkstra del peatón a quien lo use.
   */
  test('⭐ 5e · los candidatos vienen del más cercano al más lejano', () => {
    const lista = aparcamotosCerca(-0.8779, 41.656, 40);
    assert.equal(lista.length, 40);
    for (let k = 1; k < lista.length; k++) {
      assert.ok(lista[k]!.enRecta >= lista[k - 1]!.enRecta, `el candidato ${k} está más cerca`);
    }
    assert.equal(new Set(lista.map((a) => a.id)).size, 40, 'hay repetidos');
    // Y pedir más de los que hay devuelve los que hay, sin inventar.
    assert.equal(aparcamotosCerca(-0.8779, 41.656, 99999).length, 2146);
  });
});
