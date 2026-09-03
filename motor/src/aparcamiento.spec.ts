/**
 * ⭐ LOS TRES MONTONES DONDE SE DEJA EL COCHE (3/09, punto 12 casilla 2).
 *
 * ⚠️ **CERO RED.** Los dos censos están en el repositorio desde el 18/08 con su
 *    ficha (§ 1.11 y § 1.13), y las cifras que estas jueces compran son las que
 *    esas fichas declaran. Si el fichero cambia, esto se pone rojo — que es
 *    exactamente lo que se quiere: el reparto ESRO/ESRE/LIBRE **va a caducar de
 *    golpe** el día que el Ayuntamiento amplíe la zona azul, y § 1.11 lo avisa.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  TIPO_PMR,
  cargarAparcamiento,
  dondeAparcarCerca,
  puntoMasCercanoDeLaLinea,
  type AparcamientoEnMemoria,
} from './aparcamiento.ts';

let inventario: AparcamientoEnMemoria;

/** El crudo, para poder comprar lo que se quedó fuera y no solo lo que entró. */
const crudo = (fichero: string): { features: { id: string; properties: Record<string, unknown> }[] } =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../../app/data/${fichero}`, import.meta.url)), 'utf8'),
  ) as { features: { id: string; properties: Record<string, unknown> }[] };

describe('⭐ DÓNDE SE DEJA EL COCHE — los tres montones', () => {
  before(() => {
    inventario = cargarAparcamiento();
  });

  /**
   * ⭐ EL REPARTO, contra las cifras que § 1.11 y § 1.13 declaran.
   *
   * No son números redondos elegidos por gusto: son los del fichero que está en
   * el repositorio, con su sha256 en la ficha.
   */
  test('⭐ los tres montones son 1.159, 6.204 y 1.226', () => {
    assert.equal(inventario.regulado.length, 1159, 'el regulado son 664 ESRO + 495 ESRE');
    assert.equal(inventario.regulado.filter((t) => t.clase === 'ESRO').length, 664);
    assert.equal(inventario.regulado.filter((t) => t.clase === 'ESRE').length, 495);
    assert.equal(inventario.gratuito.length, 6204, 'el gratuito son los LIBRE');
    assert.equal(inventario.gratuito.every((t) => t.clase === 'LIBRE'), true);
    assert.equal(inventario.pmr.length, 1226, 'las PMR en vigor');
  });

  /**
   * ⭐ JUEZ 3 DEL ENCARGO — LOS 28 SIN CLASIFICAR NO ESTÁN EN NINGÚN MONTÓN.
   *
   * El censo no dice qué son. Meterlos en `gratuito` porque «no son regulado»
   * sería leer un silencio como un permiso, y son **226 plazas**.
   *
   * Se compra por sus **ids reales**, no por el recuento: un contador cuadra
   * igual si se cae uno de los nulos y entra uno de los buenos.
   */
  test('⭐ 3 · los 28 tramos sin clasificar no salen en ninguno de los tres', () => {
    assert.equal(inventario.sinClasificar, 28);
    const sinTipo = crudo('2026-08-18_wfs_movilidad-MU1_estacionamientos_calle.json').features.filter(
      (f) => f.properties['tipo_actual'] === null || f.properties['tipo_actual'] === undefined,
    );
    assert.equal(sinTipo.length, 28, 'el fichero tiene que traer 28 sin `tipo_actual`');
    const dentro = new Set([
      ...inventario.regulado.map((t) => t.id),
      ...inventario.gratuito.map((t) => t.id),
    ]);
    for (const f of sinTipo) {
      assert.equal(dentro.has(f.id), false, `el tramo ${f.id} no tiene tipo y está en un montón`);
    }
    // Y la cuenta cierra: 7.391 del fichero = 1.159 + 6.204 + 28.
    assert.equal(inventario.regulado.length + inventario.gratuito.length + 28, 7391);
  });

  /**
   * ⭐ Y EL FILTRO DE LAS PMR ES `TIPO`, NO `SUBTIPO`. § 1.13 lo cuenta con los
   * números: **158 reservas RETIRADAS o DENEGADAS dicen `SUBTIPO: 'PMR general'`**.
   *
   * Es el error más caro de este fichero: manda a alguien con tarjeta PMR a una
   * plaza que se quitó o que nunca se concedió.
   */
  test('⭐ ni una PMR retirada ni denegada entra en el montón', () => {
    const reservas = crudo('2026-08-18_wfs_movilidad-MU1_reservas.json').features;
    const dentro = new Set(inventario.pmr.map((p) => p.id));
    let retiradasODenegadas = 0;
    let otrasQueDicenPmr = 0;
    for (const f of reservas) {
      const tipo = f.properties['TIPO'];
      if (tipo === TIPO_PMR) {
        continue;
      }
      assert.equal(dentro.has(f.id), false, `la reserva ${f.id} es ${String(tipo)} y ha entrado`);
      if (f.properties['SUBTIPO'] !== 'PMR general') {
        continue;
      }
      if (tipo === 'RETIRADA' || tipo === 'DENEGADA') {
        retiradasODenegadas++;
      } else {
        otrasQueDicenPmr++;
      }
    }
    // ⚠️ **158 son las RETIRADAS y DENEGADAS**, que es la cifra que § 1.13
    //    declara y la que duele. Y hay **2 más** que también dirían «PMR
    //    general» sin serlo —las de `10_E.S.PMR`—, así que por `SUBTIPO` se
    //    colarían **160**. La juez cuenta las dos cosas por separado porque son
    //    dos cosas: una plaza retirada y un tipo mezclado no son lo mismo.
    assert.equal(retiradasODenegadas, 158, 'las retiradas y denegadas que dicen PMR general');
    assert.equal(otrasQueDicenPmr, 2, 'las de 10_E.S.PMR, que § 1.13 deja fuera a propósito');
    assert.equal(inventario.reservasNoPmr, reservas.length - 1226);
  });

  /**
   * ⭐ EL HORARIO DE LAS PMR SE ENSEÑA **TAL CUAL**, sin normalizar.
   *
   * Son 104 formas distintas entre las 1.226 y ninguna se interpreta: quien
   * unifique `PERMANENTE`, `Permanente` y `permanente` habrá acertado tres
   * veces y tendrá 101 cadenas más esperándole, entre ellas `n/a` y
   * `VER OBSERVACIONES`.
   */
  test('⭐ el horario de la PMR viaja literal, con sus 104 formas', () => {
    const formas = new Set(inventario.pmr.map((p) => p.horario));
    assert.equal(formas.size, 104, 'las formas distintas que trae el censo');
    assert.equal(formas.has('PERMANENTE'), true);
    assert.equal(formas.has('Permanente'), true, 'no se ha unificado la mayúscula');
    assert.equal(formas.has('permanente'), true);
    assert.equal(formas.has('VER OBSERVACIONES'), true, 'ni se ha tirado lo que no es un horario');
    // Y el detalle que se enseña lo lleva dentro, sin tocar.
    const conVerObservaciones = inventario.pmr.find((p) => p.horario === 'VER OBSERVACIONES')!;
    const [suyo] = dondeAparcarCerca(
      inventario,
      'discapacitado',
      conVerObservaciones.lon,
      conVerObservaciones.lat,
      1,
    );
    assert.equal(suyo!.id, conVerObservaciones.id);
    assert.equal(suyo!.detalle, 'plaza PMR (horario: VER OBSERVACIONES)');
  });

  /**
   * ⭐ Y LO QUE EL DATO NO DA, NO SE DICE: ni tarifa ni franja en el regulado.
   *
   * § 1.11 no trae ninguna de las dos, así que ninguna puede aparecer en un
   * texto. Esta juez es la que la contraprueba «tarifa inventada» muerde.
   */
  test('⭐ el regulado no dice precio ni horario: el censo no los trae', () => {
    const campos = new Set<string>();
    for (const f of crudo('2026-08-18_wfs_movilidad-MU1_estacionamientos_calle.json').features.slice(
      0,
      200,
    )) {
      for (const k of Object.keys(f.properties)) {
        campos.add(k);
      }
    }
    for (const prohibido of ['tarifa', 'precio', 'horario', 'importe', 'euros']) {
      assert.equal(
        [...campos].some((c) => c.toLowerCase().includes(prohibido)),
        false,
        `el censo trae un campo «${prohibido}»: habría que decidir si se enseña`,
      );
    }
    const esro = inventario.regulado.find((t) => t.clase === 'ESRO')!;
    const [suyo] = dondeAparcarCerca(inventario, 'regulado', esro.g[0]![0], esro.g[0]![1], 1);
    assert.equal(suyo!.detalle, 'zona regulada (ESRO)');
    for (const inventado of ['€', 'euro', 'hora', ':', 'tarifa']) {
      assert.equal(
        suyo!.detalle.toLowerCase().includes(inventado),
        false,
        `«${suyo!.detalle}» promete un ${inventado} que el dato no da`,
      );
    }
  });

  /**
   * ⭐ EL PUNTO DE UN TRAMO ES EL MÁS CERCANO AL DESTINO, no su primer vértice.
   *
   * Un bordillo mide 24,6 m de mediana pero los hay de 424: parar siempre en la
   * punta metería cientos de metros de paseo que nadie tiene que andar.
   */
  test('⭐ un tramo se aparca por su punto más cercano, no por su punta', () => {
    // Una línea recta de un grado, y un punto justo enfrente de su mitad.
    const recta = [
      [-0.9, 41.6],
      [-0.8, 41.6],
    ] as const;
    const medio = puntoMasCercanoDeLaLinea(recta, -0.85, 41.61);
    assert.ok(Math.abs(medio.lon + 0.85) < 1e-9, `salió en ${medio.lon}`);
    assert.equal(medio.lat, 41.6);
    // Y fuera del segmento se recorta a la punta: el punto tiene que caer
    // DENTRO, como en `enganchar`.
    const antes = puntoMasCercanoDeLaLinea(recta, -0.95, 41.6);
    assert.equal(antes.lon, -0.9);
  });

  /**
   * ⭐ Y LOS CANDIDATOS SALEN ORDENADOS POR CERCANÍA, que es lo único que la
   * recta decide: **podar**. Quien elige es el coste, y eso pasa en el viaje.
   */
  test('⭐ los candidatos vienen del más cercano al más lejano', () => {
    for (const tipo of ['regulado', 'gratuito', 'discapacitado'] as const) {
      const lista = dondeAparcarCerca(inventario, tipo, -0.8779, 41.656, 20);
      assert.equal(lista.length, 20, `${tipo}: no hay 20 candidatos en el centro`);
      for (let k = 1; k < lista.length; k++) {
        assert.ok(
          lista[k]!.enRecta >= lista[k - 1]!.enRecta,
          `${tipo}: el candidato ${k} está más cerca que el ${k - 1}`,
        );
      }
      assert.equal(new Set(lista.map((x) => x.id)).size, 20, `${tipo}: hay repetidos`);
      assert.equal(lista.every((x) => x.tipo === tipo), true);
    }
  });
});
