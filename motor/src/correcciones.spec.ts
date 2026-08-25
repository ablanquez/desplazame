/**
 * Las correcciones manuales: la tabla declarada y sus tres candados.
 *
 * Lo que la corrección le hace al índice se juzga en `sitios.spec.ts`, y lo que
 * le hace a una ruta, en `trayecto.spec.ts`. Aquí se juzgan las cerraduras, que
 * son lo que impide que una coordenada escrita a mano entre sin mirar.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CORRECCIONES_DE_SITIOS,
  correccionDe,
  exigirQuePaseLosCheques,
  exigirQueSigaValiendo,
  type CorreccionDeSitio,
} from './correcciones.ts';
import type { Veredicto } from './gacetero.ts';
import type { PortalSituado } from './portales.ts';

/** El portal que un veredicto de rescate trae. Cualquiera vale para esto. */
const UN_PORTAL: PortalSituado = {
  codigo: 'Portales.98467',
  numero: '11',
  via: '7045',
  lon: -0.924971,
  lat: 41.616909,
};

describe('Las correcciones manuales', () => {
  test('⭐ LA TABLA: hoy una, y va declarada entera', () => {
    // Una corrección sin fuente escrita es un número que alguien puso un día.
    // Esto no comprueba el formato: comprueba que están los cuatro datos que
    // hacen auditable la corrección —qué, a dónde, desde dónde y quién lo dice—.
    assert.equal(CORRECCIONES_DE_SITIOS.length, 1);
    const c = CORRECCIONES_DE_SITIOS[0]!;
    assert.equal(c.codigo, 'CentrosSalud.9090');
    assert.equal(c.lat, 41.6402816);
    assert.equal(c.lon, -0.9011954);
    assert.equal(c.latMunicipal, 41.542372909710075);
    assert.equal(c.lonMunicipal, -8.184875254157216);
    assert.equal(c.fuente, 'confirmación manual de Antonio, Google Maps, 24/08/2026');
    assert.equal(c.motivo, 'frontera: la coordenada municipal cae en Portugal');
  });

  test('la corrección se busca por código, y lo que no está devuelve null', () => {
    assert.equal(correccionDe('CentrosSalud.9090')?.lat, 41.6402816);
    assert.equal(correccionDe('Farmacias.8691'), null);
    assert.equal(correccionDe('no existe'), null);
  });

  /** Una corrección de laboratorio, para probar los candados sin tocar la real. */
  const DE_MENTIRA: CorreccionDeSitio = {
    codigo: 'Laboratorio.1',
    lon: -0.9,
    lat: 41.65,
    lonMunicipal: -8,
    latMunicipal: 41.5,
    fuente: 'la prueba',
    motivo: 'la prueba',
  };

  test('⭐ CANDADO 1: si el fichero municipal ya no dice lo mismo, no se arranca', () => {
    // Una corrección se escribe mirando UNA coordenada concreta. Si el origen
    // publica otra, se escribió mirando otra cosa y deja de valer: que el motor
    // no arranque es lo correcto, porque quien actualice el dato tiene que
    // volver a mirar el caso en vez de heredar un número a ciegas.
    assert.doesNotThrow(() => exigirQueSigaValiendo(DE_MENTIRA, -8, 41.5));
    assert.throws(
      () => exigirQueSigaValiendo(DE_MENTIRA, -8.0001, 41.5),
      /se escribió contra .* y el fichero municipal dice ahora/s,
    );
    // Y también si lo que cambia es la latitud, no solo la longitud.
    assert.throws(() => exigirQueSigaValiendo(DE_MENTIRA, -8, 41.6), /Laboratorio\.1/);
  });

  test('⭐ CANDADO 2: una corrección que no pasa los dos cheques, tampoco', () => {
    // Ni frontera ni distancia se le perdonan por venir de una persona.
    const sana: Veredicto = { estado: 'sana' };
    const invalida: Veredicto = { estado: 'invalida', porQue: 'frontera' };
    const rescatada: Veredicto = {
      estado: 'rescatada',
      porQue: 'distancia',
      portal: UN_PORTAL,
      metros: 300,
    };
    assert.doesNotThrow(() => exigirQuePaseLosCheques(DE_MENTIRA, sana));
    assert.throws(() => exigirQuePaseLosCheques(DE_MENTIRA, invalida), /no pasa la validación/);
    // ⭐ «Rescatada» también revienta, y esa es la parte que menos se ve: si el
    // callejero y la mano dicen cosas distintas, eso es un caso para mirar y no
    // una votación que gane uno de los dos.
    assert.throws(() => exigirQuePaseLosCheques(DE_MENTIRA, rescatada), /sale «rescatada»/);
  });
});
