/**
 * ⭐ LA MURALLA DE LOS OCHO MODOS (6/09).
 *
 * ── Qué es y por qué existe ─────────────────────────────────────────────────
 *
 * No es una prueba de que las rutas sean buenas: es **una prueba de que no se
 * han movido**. Un solo sha256 sobre **160 trayectos** —20 pares de portales
 * por los ocho modos que el contrato admite— con sus metros, sus segundos, el
 * texto de todos sus pasos, sus avisos y su geometría a siete decimales.
 *
 * La escribe el encadenado de los saltos reconstruidos [entrada nº33 de
 * `docs/BITACORA.md`], que toca `buscarEnCoche` —la búsqueda que comparten el
 * **coche** y la **moto**— y `patronOperativo` —el **bus**—. Un cambio ahí que
 * se escapara a otro modo no lo veía nadie: cada modo tiene sus jueces, y
 * ninguna mira a las de al lado.
 *
 * ⚠️ **Esta juez DEBE ponerse roja el día que alguien cambie un modo a
 *    propósito.** Cuando pase, se recalcula y se cambia el número **con la
 *    razón escrita** — nunca porque estorbe. Es el mismo trato que la muralla
 *    del peatón (`⭐ 11` de `rueda.spec.ts`), que lleva ahí desde el 29/08.
 *
 * ── Lo que se congela y lo que no ───────────────────────────────────────────
 *
 * Todo lo vivo se pasa en `null` **a propósito**: sin disponibilidad de BiZi,
 * sin flota ni área de YeGo, sin desvíos servidos y con **el reloj clavado**
 * —que la Zona de Bajas Emisiones lo mira—. Así la cifra depende solo del
 * código y de los datos del repositorio. Los dos modos que dependen de una
 * fuente viva quedan comprados por su **respuesta sin fuente**, que también es
 * una conducta y también se puede romper sin querer.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { Modo } from '@desplazame/tipos';
import { cargarGrafo } from './grafo.ts';
import { cargarRed } from './red.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarPortales } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { entornoDe } from './gacetero.ts';
import { cargarRedDeLaRueda } from './red-rueda.ts';
import { cargarAparcabicis } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { elFeedQueSeSirve } from './feed.ts';
import { andarConElPeaton, cocinar, servirEstaRed } from './red-bus.ts';
import { servirOperativa } from './patron-operativo.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import { leerPeticion } from './peticion.ts';

/** Los ocho modos del contrato, en el orden en que `Modo` los declara. */
const LOS_OCHO: readonly Modo[] = [
  'andando',
  'bus',
  'bici',
  'patin',
  'bizi',
  'coche',
  'moto',
  'yego',
];

/**
 * ⭐ EL RELOJ CLAVADO: martes 2 de septiembre de 2026, 10:00.
 *
 * Dentro de la franja de la ZBE —laborable, entre las 8 y las 20—, que es el
 * caso que más código toca del coche y de la moto. Con `new Date()` esta juez
 * daría una cifra los martes por la mañana y otra los domingos.
 */
const EL_RELOJ = new Date(2026, 8, 2, 10, 0, 0, 0);

let motor: Motor;

describe('⭐ LA MURALLA DE LOS OCHO MODOS', () => {
  before(async () => {
    const red = cargarRed(cargarGrafo());
    const portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    const redRueda = cargarRedDeLaRueda(cargarGrafo(), red, entornoDe(portales));
    motor = {
      red,
      rejilla: cargarRejilla(red),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(red),
      redRueda,
      rejillaRueda: cargarRejilla(redRueda),
      cuadernoRueda: cuadernoPara(redRueda),
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi: cargarBiZi(entornoDe(portales)),
    };
    // ⭐ El bus necesita su red COCINADA servida, y **sin desvíos encima**: lo
    //    que se congela es el feed, que es lo único reproducible. Los desvíos
    //    vienen de una fuente viva y cambian cada hora.
    const cocinada = await cocinar(
      elFeedQueSeSirve().ruta,
      andarConElPeaton(red, cargarRejilla(red), cuadernoPara(red)),
    );
    servirEstaRed(cocinada.red);
    servirOperativa(null);
  });

/**
 * ⭐ EL SELLO DE LOS OCHO MODOS con el reloj clavado del martes.
 *
 * ⚠️ **Recalculado el 6/09, y la razón es que antes estaba mal.** Valía
 *    `9622430b…`, y aquel sello se había calculado con el bus mirando el
 *    calendario de la pared en vez de `EL_RELOJ`: sus 16 pares con bus eran los
 *    del día en que se corrió la suite. Tres de ellos montaban una línea de
 *    madrugada a las 10:00 de un martes —`42+N4`, `21+N4` y `N5+32+28`— y este
 *    sha los compraba. Ver la entrada del 6/09 en `docs/BITACORA.md`.
 */
const SELLO_DE_LOS_OCHO = '8d9e1857949fdda21d8bed31e1f6e50185ebd5ef41f2bc553c9d73650087243f';

/**
 * ⭐ Y EL SELLO DE LOS SIETE QUE NO SON BUS, para la juez 7.
 *
 * Se ha calculado **sobre el código de antes del arreglo y sobre el de después**,
 * y da lo mismo las dos veces: el reloj se enchufó solo en la rama del bus.
 */
const SELLO_SIN_BUS = '03a7bf6eb67be4be01b80c8e265f2f5921c15e199b6ec0b1ee962f40648a0967';

/** Lo que un pase de la muralla deja: su huella y sus tres cuentas. */
interface LoSellado {
  readonly huella: string;
  readonly conRuta: number;
  readonly conAviso: number;
  readonly conBuho: number;
}

/**
 * Un pase entero de la muralla con el reloj que se le dé.
 *
 * `soloEstos` deja fuera modos del sello —pero **no del cálculo**: los 160
 * trayectos se piden igual, para que el generador de azar avance lo mismo y los
 * veinte pares sean los veinte pares.
 */
function sellar(reloj: Date, soloEstos: (modo: Modo) => boolean = () => true): LoSellado {
  // El mismo generador de la muralla del peatón: barato, y el número no
  // depende de la versión de Node.
  let semilla = 20260906;
  const azar = (): number => {
    semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
    return semilla / 0x7fffffff;
  };
  const s = motor.portales.situados;
  const huella = createHash('sha256');
  let conRuta = 0;
  let conAviso = 0;
  let conBuho = 0;

  for (let n = 0; n < 20; n++) {
    const A = s[Math.floor(azar() * s.length)]!;
    const B = s[Math.floor(azar() * s.length)]!;
    for (const modo of LOS_OCHO) {
      const t = calcularTrayecto(
        motor,
        leerPeticion({
          origen: { via: A.via, portal: A.codigo },
          destino: { via: B.via, portal: B.codigo },
          modo,
        }),
        null,
        reloj,
        null,
        null,
      );
      if (!soloEstos(modo)) {
        continue;
      }
      if (t.avisos.length > 0) {
        conAviso++;
      }
      if (t.geometria.length > 0) {
        conRuta++;
      }
      if (t.tramos.some((x) => /^N\d/.test(x.linea?.corto ?? ''))) {
        conBuho++;
      }
      huella.update(
        `${modo}|${t.metros.toFixed(6)}|${t.segundos}|` +
          t.pasos.map((p) => `${p.giro}~${p.metros}~${p.texto}`).join('#') +
          '|' +
          t.avisos.map((a) => a.texto).join('#') +
          '|' +
          t.tramos.map((x) => `${x.comoSeVa}:${x.desde}-${x.hasta}:${x.linea?.corto ?? ''}`).join(',') +
          '|' +
          t.geometria.map((p) => p[0].toFixed(7) + ',' + p[1].toFixed(7)).join(' ') +
          '\n',
      );
    }
  }
  return { huella: huella.digest('hex'), conRuta, conAviso, conBuho };
}

  test('⭐ 13 · los 160 trayectos de los ocho modos, al byte', () => {
    const { huella, conRuta, conAviso, conBuho } = sellar(EL_RELOJ);

    // ⚠️ Antes del sello, la prueba de que la muralla no está vacía: si un día
    //    los 160 trayectos salieran todos con aviso y sin geometría, el sha
    //    seguiría cuadrando consigo mismo y no estaría comprando nada.
    assert.ok(conRuta >= 120, `solo ${conRuta} de 160 trayectos traen geometría`);
    assert.ok(conAviso >= 20, `solo ${conAviso} de 160 traen aviso: faltan los modos vivos`);

    // ⭐ NI UN BÚHO. El sello anterior compraba tres —`42+N4`, `21+N4` y
    //    `N5+32+28`— porque el bus no miraba la hora. Ver la juez 6.
    assert.equal(conBuho, 0, `${conBuho} trayectos montan una línea de madrugada a las 10:00`);

    assert.equal(
      huella,
      SELLO_DE_LOS_OCHO,
      'los ocho modos han cambiado de respuesta: si es a propósito, se recalcula CON LA RAZÓN escrita',
    );
  });

  /**
   * ⭐ JUEZ 6 — EL RELOJ CLAVADO MANDA, Y LA PARED NO.
   *
   * La juez 13 promete desde que nació no dar «una cifra los martes por la
   * mañana y otra los domingos», y hasta el 6/09 **para el bus daba exactamente
   * eso**: `porModo` recibía `cuando` y llamaba a `new Date()` igual. Medido, sus
   * 16 pares con bus cambiaban los 16 entre el domingo y el lunes, así que el
   * sello se habría puesto rojo solo al día siguiente de calcularlo.
   *
   * Se compra por los dos lados: **dos relojes distintos dan sellos distintos**
   * —luego manda el parámetro—, y el del martes es el que la juez 13 sella
   * —luego no depende de cuándo se corra la suite—.
   */
  test('⭐ 6 · el sello lo fija EL_RELOJ, no el día en que se corra la suite', () => {
    const delMartes = sellar(EL_RELOJ);
    const delDomingo = sellar(new Date(2026, 8, 6, 10, 0, 0, 0));
    assert.equal(delMartes.huella, SELLO_DE_LOS_OCHO, 'el martes es el que la juez 13 compra');
    assert.notEqual(
      delDomingo.huella,
      delMartes.huella,
      'dos relojes tienen que dar dos sellos: si dan el mismo, el reloj no ha llegado al bus',
    );
    // ⭐ Y a las 10:00 no circula un búho **ningún día**: cambia el viaje, no la
    //    regla. Que el domingo diera cero por casualidad y el martes también no
    //    prueba nada por separado; lo que prueba es que los dos sellos difieran.
    assert.equal(delMartes.conBuho, 0, 'el martes a las 10:00 no circula ningún búho');
    assert.equal(delDomingo.conBuho, 0, 'y el domingo a las 10:00 tampoco');
  });

  /**
   * ⭐ JUEZ 7 — LOS OTROS SIETE MODOS, AL BYTE.
   *
   * El reloj se ha enchufado **solo en la rama del bus**. Andando, bici, patín,
   * BiZi, coche, moto y YeGo tienen que salir exactamente igual que antes del
   * 6/09, y este sha se calculó sobre el código de antes y sobre el de después:
   * **`03a7bf6e…` las dos veces**.
   */
  test('⭐ 7 · los siete modos que no son bus no se han movido', () => {
    assert.equal(sellar(EL_RELOJ, (m) => m !== 'bus').huella, SELLO_SIN_BUS);
  });
});
