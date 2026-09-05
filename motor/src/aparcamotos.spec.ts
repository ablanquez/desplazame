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
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  cocinarAparcamotos,
  comoSeGuarda,
  CONFLADOS,
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
 * ⭐ LOS 6 QUE EL WFS DEJA SIN NOMBRE DE CALLE, y **el nombre que ya llevan**.
 *
 * § 1.10 los declara: son los mismos que llevan los 2 códigos de vía huérfanos
 * (25000 y 9740). El agujero es del origen, no del cocinado.
 *
 * ⭐ **Y desde el 4/09 el hueco se rellena por CONFLACIÓN DE ATRIBUTOS** [OSM
 *    wiki: *«combinar fuentes solapadas para retener el dato preciso»*;
 *    Hootenanny/NGA: *«mantener la procedencia de geometría y atributos en los
 *    rasgos combinados»*, el flujo *Differential-With-Tags*]. El listado de la
 *    sede nombra estos seis, y **casan uno a uno a milímetros**: la geometría
 *    sigue siendo del WFS —la doctrina de procedencia no se toca— y lo único
 *    que entra de la otra puerta es **el atributo que falta**, marcado.
 *
 * ⚠️ Y se escriben uno a uno con su nombre para que el día que el origen tape
 *    el agujero por su cuenta —o mueva uno de los seis— esto se ponga rojo.
 */
const LOS_SEIS_CONFLADOS: ReadonlyArray<readonly [string, string]> = [
  ['MU2_motos.138', 'DE RANILLAS'],
  ['MU2_motos.171', 'DE RANILLAS'],
  ['MU2_motos.172', 'DE RANILLAS'],
  ['MU2_motos.173', 'DE RANILLAS'],
  ['MU2_motos.222', 'DE RANILLAS'],
  ['MU2_motos.1483', 'GRUPO ARZOBISPO DOMENECH'],
];

const SIN_NOMBRE_DE_CALLE = LOS_SEIS_CONFLADOS.map(([id]) => id);

/**
 * ⭐ EL SHA256 DEL COCINADO, para que un cambio del dato se vea de una vez.
 *
 * No es paranoia: el fichero se regenera con un script y **el `git diff` de
 * 2.146 líneas no se lee**. El sello sí. Medido el 4/09 tras la conflación.
 */
const SELLO_DEL_COCINADO = '5021e2b736d98a43adfdbaecea6a40672eb70239b2867e011afdf88ee43842b4';

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
   * ⭐ EL AGUJERO DEL ORIGEN SE TAPA POR CONFLACIÓN, y **se ve quién lo tapó**.
   *
   * Los 6 salen con su nombre de calle y con `nombreDe: 'sede'` puesto. La
   * marca no es decoración: es lo que hace que esto sea conflación declarada y
   * no una mezcla silenciosa de dos puertas — [Hootenanny/NGA] *«mantener la
   * procedencia de geometría y atributos en los rasgos combinados»*.
   *
   * ⚠️ **Y EXACTAMENTE ESOS SEIS**, ni uno más. Es la mitad que importa: el
   *    listado de la sede casa con 2.114 rasgos del WFS, y rellenar «todo lo
   *    que case» sería sustituir el catálogo entero por el de la otra puerta
   *    sin decirlo. Lo que entra es el atributo que **falta**, donde falta.
   */
  test('⭐ 5b · los 6 sin calle salen con su nombre y su marca de procedencia', () => {
    // Ya no queda ni uno sin calle.
    assert.deepEqual(cocinados.filter((a) => a.via === '').map((a) => a.id), []);

    for (const [id, via] of LOS_SEIS_CONFLADOS) {
      const suyo = cocinados.find((a) => a.id === id)!;
      assert.equal(suyo.via, via, `${id} no lleva su calle`);
      assert.equal(suyo.nombreDe, 'sede', `${id} sin marca de procedencia`);
      // Y siguen teniendo lo que ya tenían: su punto y sus plazas, del WFS.
      assert.ok(suyo.plazas >= 1, `${id} sin plazas`);
      assert.ok(Number.isFinite(suyo.lon) && Number.isFinite(suyo.lat), `${id} sin punto`);
    }

    // ⭐ NI UN SÉPTIMO. La marca está en seis registros y en seis nada más.
    const marcados = cocinados.filter((a) => a.nombreDe !== undefined).map((a) => a.id);
    assert.deepEqual([...marcados].sort(), [...SIN_NOMBRE_DE_CALLE].sort());
    assert.equal(marcados.length, 6);
    // Y el único valor posible de la marca es «sede»: no hay una tercera puerta.
    assert.deepEqual(
      [...new Set(cocinados.map((a) => a.nombreDe).filter((x) => x !== undefined))],
      ['sede'],
    );

    // ⚠️ **El portal NO se rellena con nada**: los 8 que el WFS deja vacíos
    //    siguen vacíos. La sede da el portal de los 6 conflados y COINCIDE con
    //    el que el WFS ya traía —es la corroboración del casado, no un relleno—.
    assert.equal(cocinados.filter((a) => a.portal === '').length, 8);
    for (const c of CONFLADOS) {
      assert.equal(cocinados.find((a) => a.id === c.id)!.portal, c.portal);
    }
  });

  /**
   * ⭐ 5f · EL CASADO ES UNO A UNO Y A MILÍMETROS, y se puede contar.
   *
   * La tabla de conflación lleva la coordenada de la sede, y el cocinado solo
   * rellena si el rasgo del WFS está **a 1 m o menos** de ella y además le
   * coinciden el portal y las plazas. Medido el 4/09: los seis casan entre
   * **0,0019 y 0,0065 m** — milímetros—, así que el margen de 1 m es holgura,
   * no tolerancia.
   *
   * ⚠️ Lo que compra esta juez es que **si el WFS mueve uno de los seis, el
   *    relleno se apaga solo** en vez de ponerle a un sitio el nombre de otro.
   */
  test('⭐ 5f · la tabla de conflación casa uno a uno, a milímetros del WFS', () => {
    assert.equal(CONFLADOS.length, 6);
    assert.equal(new Set(CONFLADOS.map((c) => c.id)).size, 6);
    for (const c of CONFLADOS) {
      const rasgo = wfs.find((r) => r.id === c.id)!;
      const [lon, lat] = rasgo.geometry.coordinates as readonly number[];
      const cuanto = metros(c.lon, c.lat, lon!, lat!);
      assert.ok(cuanto <= 0.01, `${c.id} casa a ${cuanto.toFixed(4)} m: ya no son milímetros`);
      // Y el WFS sigue sin darle nombre: si lo diera, el relleno sobraría.
      const suyo = rasgo.properties['Nombre_calle'];
      assert.ok(
        suyo === null || suyo === undefined || String(suyo).trim() === '',
        `${c.id} ya trae nombre en el WFS: la conflación sobra`,
      );
    }
  });

  /**
   * ⭐ 5g · EL SELLO DEL COCINADO, para que un cambio del dato no pase de largo.
   *
   * 2.146 líneas de `git diff` no las lee nadie. Un sha256 que cambia, sí.
   */
  test('⭐ 5g · el fichero cocinado es exactamente el sellado', () => {
    const bytes = readFileSync(
      fileURLToPath(new URL('../../app/data/aparcamotos.json', import.meta.url)),
    );
    assert.equal(createHash('sha256').update(bytes).digest('hex'), SELLO_DEL_COCINADO);
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
    // Y a un rasgo que NO está en la tabla de conflación no se le pone marca:
    // ninguno de estos dos lo está, y ninguno sale marcado.
    assert.deepEqual(
      cocinarAparcamotos(capa).aparcamotos.map((a) => a.nombreDe),
      [undefined, undefined],
    );
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
