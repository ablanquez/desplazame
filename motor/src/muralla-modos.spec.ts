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

  test('⭐ 13 · los 160 trayectos de los ocho modos, al byte', () => {
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
          EL_RELOJ,
          null,
          null,
        );
        if (t.avisos.length > 0) {
          conAviso++;
        }
        if (t.geometria.length > 0) {
          conRuta++;
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

    // ⚠️ Antes del sello, la prueba de que la muralla no está vacía: si un día
    //    los 160 trayectos salieran todos con aviso y sin geometría, el sha
    //    seguiría cuadrando consigo mismo y no estaría comprando nada.
    assert.ok(conRuta >= 120, `solo ${conRuta} de 160 trayectos traen geometría`);
    assert.ok(conAviso >= 20, `solo ${conAviso} de 160 traen aviso: faltan los modos vivos`);

    assert.equal(
      huella.digest('hex'),
      '9622430b20469b9a339ac923fcffc80a8877396c09e32abf189eb5c5d43e06c4',
      'los ocho modos han cambiado de respuesta: si es a propósito, se recalcula CON LA RAZÓN escrita',
    );
  });
});
