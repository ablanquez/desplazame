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

describe('⭐ DÓNDE SE DEJA EL COCHE — los cuatro montones', () => {
  before(() => {
    inventario = cargarAparcamiento();
  });

  /**
   * ⭐ EL REPARTO, contra las cifras que § 1.11 y § 1.13 declaran.
   *
   * No son números redondos elegidos por gusto: son los del fichero que está en
   * el repositorio, con su sha256 en la ficha.
   *
   * ⚠️ ACTA DE RE-FIRMA (19/09/2026). La cabecera avisaba de que este reparto
   *    «va a caducar de golpe el día que el Ayuntamiento amplíe la zona azul», y
   *    ese día ha llegado: el cron educado trajo el censo del 19/09 y Antonio
   *    decidió entrarlo. Las cifras de agosto eran **664, 495, 6.204 y 1.226**.
   *    El movimiento, trazado al dato y no supuesto — casando los tramos por
   *    CONTENIDO, porque la fuente ha renumerado la capa entera:
   *      · estacionamientos: entran 262 tramos y salen 229 (7.391 → 7.424)
   *          ESRO  +91 −79 → 664 + 12 = **676**
   *          ESRE  +49 −43 → 495 +  6 = **501**
   *          LIBRE +120 −107 → 6.204 + 13 = **6.217**
   *          sin `tipo_actual` +2 −0 → 28 + 2 = **30**
   *      · reservas: entran 32 `14_PMR` y salen 22 → 1.226 + 10 = **1.236**
   *    Ni un movimiento sin su entrada en el censo municipal.
   */
  test('⭐ los cuatro montones son 676, 501, 6.217 y 1.236', () => {
    assert.equal(inventario.azul.length, 676, 'la zona azul son los ESRO');
    assert.equal(inventario.naranja.length, 501, 'la zona naranja son los ESRE');
    assert.equal(inventario.gratuito.length, 6217, 'el gratuito son los LIBRE');
    assert.equal(inventario.pmr.length, 1236, 'las PMR en vigor');
    // ⭐ Y CADA MONTÓN ES DE SU CLASE ENTERO, no «de su clase el que ganó»: es
    //    lo que el reparto por nombre promete, y lo que el ternario con `else`
    //    no podía prometer. Ver `dondeAparcarCerca`.
    assert.equal(inventario.azul.every((t) => t.clase === 'ESRO'), true);
    assert.equal(inventario.naranja.every((t) => t.clase === 'ESRE'), true);
    assert.equal(inventario.gratuito.every((t) => t.clase === 'LIBRE'), true);
    // Y ningún tramo está en dos montones: 676 + 501 + 6.217 ids distintos.
    const todos = [...inventario.azul, ...inventario.naranja, ...inventario.gratuito];
    assert.equal(new Set(todos.map((t) => t.id)).size, 676 + 501 + 6217);
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
  /**
   * ⚠️ ACTA DE RE-FIRMA (19/09/2026): eran **28** y el censo nuevo trae **30**.
   *    Los dos que entran vienen sin `tipo_actual`, igual que los 28 de antes:
   *    el censo sigue callando qué son, y por eso siguen fuera de los tres
   *    montones. Lo que cambia es la cuenta, no la ley.
   */
  test('⭐ 3 · los 30 tramos sin clasificar no salen en ninguno de los tres', () => {
    assert.equal(inventario.sinClasificar, 30);
    const sinTipo = crudo('2026-08-18_wfs_movilidad-MU1_estacionamientos_calle.json').features.filter(
      (f) => f.properties['tipo_actual'] === null || f.properties['tipo_actual'] === undefined,
    );
    assert.equal(sinTipo.length, 30, 'el fichero tiene que traer 30 sin `tipo_actual`');
    const dentro = new Set([
      ...inventario.azul.map((t) => t.id),
      ...inventario.naranja.map((t) => t.id),
      ...inventario.gratuito.map((t) => t.id),
    ]);
    for (const f of sinTipo) {
      assert.equal(dentro.has(f.id), false, `el tramo ${f.id} no tiene tipo y está en un montón`);
    }
    // Y la cuenta cierra: 7.424 del fichero = 676 + 501 + 6.217 + 30.
    assert.equal(
      inventario.azul.length + inventario.naranja.length + inventario.gratuito.length + 30,
      7424,
    );
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
    // ⚠️ ACTA DE RE-FIRMA (19/09/2026): las **158 retiradas y denegadas NO se
    //    mueven** —el error caro sigue midiendo exactamente lo mismo—, y las
    //    «otras que dicen PMR general» pasan de **2 a 3**: el censo nuevo trae
    //    una reserva más de `10_E.S.PMR` con ese SUBTIPO. Es el mismo caso que
    //    § 1.13 deja fuera a propósito, con un ejemplar más. Y el descuento de
    //    las PMR en vigor pasa de 1.226 a 1.236, como arriba.
    assert.equal(retiradasODenegadas, 158, 'las retiradas y denegadas que dicen PMR general');
    assert.equal(otrasQueDicenPmr, 3, 'las de 10_E.S.PMR, que § 1.13 deja fuera a propósito');
    assert.equal(inventario.reservasNoPmr, reservas.length - 1236);
  });

  /**
   * ⭐ EL HORARIO DE LAS PMR SE ENSEÑA **TAL CUAL**, sin normalizar.
   *
   * Son 106 formas distintas entre las 1.236 y ninguna se interpreta: quien
   * unifique `PERMANENTE`, `Permanente` y `permanente` habrá acertado tres
   * veces y tendrá 103 cadenas más esperándole, entre ellas `n/a` y
   * `VER OBSERVACIONES`.
   *
   * ⚠️ ACTA DE RE-FIRMA (19/09/2026): eran **104** y son **106**. Entran cuatro
   *    formas nuevas —`08:15 a 09:15 y 13:45 a 17:45 `, `8-21 h. Lu-Do`,
   *    `9:30 a 20 h.` y `De 8 a 21 h. de Lu. a Do.`— y desaparecen dos —`8-21
   *    h. ` y `De 8 a 21 h. de Lu. a Vi.`—: 104 + 4 − 2 = 106. Dos de las que
   *    entran son las de al lado con el día corregido (`Lu. a Vi.` → `Lu. a
   *    Do.`), que es justo la clase de arreglo que esta juez existe para no
   *    tener que adivinar.
   */
  test('⭐ el horario de la PMR viaja literal, con sus 106 formas', () => {
    const formas = new Set(inventario.pmr.map((p) => p.horario));
    assert.equal(formas.size, 106, 'las formas distintas que trae el censo');
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
  test('⭐ la azul y la naranja no dicen precio ni horario: el censo no los trae', () => {
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
    const esro = inventario.azul[0]!;
    const [suyo] = dondeAparcarCerca(inventario, 'azul', esro.g[0]![0], esro.g[0]![1], 1);
    // ⭐ La palabra es la del REGLAMENTO, no una traducción nuestra: el
    //    Reglamento Municipal del Servicio de Estacionamiento Regulado escribe
    //    «los sectores ESRE ("zona naranja") como en los de rotación, ESRO
    //    ("zona azul")». Ver `detalleDelTramo`.
    assert.equal(suyo!.detalle, 'zona azul (rotación)');
    // Y la sigla ya NO encabeza la frase: quien aparca no tiene por qué
    // traducir un código del censo para saber de qué acera se le habla.
    assert.equal(suyo!.detalle.includes('ESRO'), false);
    const esre = inventario.naranja[0]!;
    const [deResidentes] = dondeAparcarCerca(inventario, 'naranja', esre.g[0]![0], esre.g[0]![1], 1);
    assert.equal(deResidentes!.detalle, 'zona naranja (residentes)');
    // ⭐ Y **pedirle a un montón el sitio del otro no lo da**: el punto de un
    //    ESRO preguntado a la naranja contesta un ESRE, y al revés. Es la
    //    separación mirada desde el otro lado que la juez 1 del viaje.
    assert.equal(deResidentes!.id !== suyo!.id, true);
    const [alRevés] = dondeAparcarCerca(inventario, 'naranja', esro.g[0]![0], esro.g[0]![1], 1);
    assert.equal(alRevés!.detalle, 'zona naranja (residentes)');
    assert.equal(inventario.azul.some((t) => t.id === alRevés!.id), false);
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
    for (const tipo of ['azul', 'naranja', 'gratuito', 'discapacitado'] as const) {
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
