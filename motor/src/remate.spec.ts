/**
 * ⭐ LAS JUECES DEL REMATE DE LOS PRIVADOS (30/08, punto 9, casilla 5).
 *
 * Una ruta de bici no acaba pedaleando en el portal: **acaba aparcando**. Desde
 * hoy la bici y el patín ruedan hasta el aparcabicis municipal más cercano al
 * destino, se narra dónde se deja el vehículo y cuántos anclajes tiene, y el
 * resto se anda.
 *
 * [DOC OpenTripPlanner, `BICYCLE_PARK`] *«deja la bicicleta y anda hasta el
 * destino»*; su capa de *vehicle parking* de OTP 2 pide aparcamientos **con
 * capacidad declarada** y **enganchados a la red**, que es lo que § 1.9 da.
 * [DOC OSRM] el cambio de vehículo es un **paso propio**, con su campo `mode`.
 *
 * ⚠️ **Lo que este remate NO promete: que quede hueco.** § 1.9 publica la
 * capacidad del soporte, no su disponibilidad en vivo. El hito dice «5
 * anclajes» y no «5 huecos libres», y esa palabra es la diferencia entre el
 * dato y un invento.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRedDeLaRueda, type RedDeLaRueda } from './red-rueda.ts';
import { cargarRejilla, enganchar } from './proyeccion.ts';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { entornoDe } from './gacetero.ts';
import { calcularRuta, cuadernoPara } from './ruta.ts';
import { admiteComoPuerta, calcularRutaRodando, segundosRodando } from './rodando.ts';
import { cargarAparcabicis, ESTADOS_QUE_ENTRAN } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import { VELOCIDAD_MS } from './etapas.ts';
import type { ModoDeRueda } from './rueda.ts';
import type { Paso, Trayecto } from '@desplazame/tipos';

let motor: Motor;
let rueda: RedDeLaRueda;
let peaton: RedEnMemoria;
let portales: PortalesEnMemoria;

type Punto = [number, number];

/** El caso del ojo de Antonio: COLOSO 2 → LEOPOLDO ROMEO 27. */
const COLOSO = 'Portales.93310';
const ROMEO = 'Portales.79358';

function extremo(codigo: string): { via: string; portal: string } {
  const p = portales.donde.get(codigo)!;
  assert.ok(p, `no existe el portal ${codigo}`);
  return { via: p.via, portal: p.codigo };
}

function donde(codigo: string): Punto {
  const p = portales.donde.get(codigo)!;
  return [p.lon, p.lat];
}

function viaje(modo: ModoDeRueda, a: string, b: string): Trayecto {
  return calcularTrayecto(motor, { origen: extremo(a), destino: extremo(b), modo });
}

/** El hito de aparcar de un trayecto, o `undefined` si no remata. */
function hito(t: Trayecto): Paso | undefined {
  return t.pasos.find((p) => p.giro === 'aparca');
}

/** El punto del aparcabicis que el hito nombra, buscado entre los entrantes. */
function paradaDelHito(t: Trayecto): Punto {
  const h = hito(t);
  assert.ok(h, 'este trayecto no remata en ningún aparcabicis');
  // Se busca por el nombre de la vía tal y como el hito lo escribe, y se coge
  // el que esté más cerca del final de la geometría: puede haber varios
  // soportes en la misma calle.
  const fin = t.geometria[t.geometria.length - 1]!;
  const candidatos = motor.aparcabicis.entrantes.filter((a) =>
    h.texto.toUpperCase().includes(a.via.split(' [')[0]!.replace(/^\S+\s/, '')),
  );
  assert.ok(candidatos.length > 0, `el hito nombra un aparcabicis desconocido: «${h.texto}»`);
  let mejor = candidatos[0]!;
  let m = Infinity;
  for (const a of candidatos) {
    const d = (a.lat - fin[0]) ** 2 + (a.lon - fin[1]) ** 2;
    if (d < m) {
      m = d;
      mejor = a;
    }
  }
  return [mejor.lon, mejor.lat];
}

/** La ruta rodando entre dos puntos, pelada. */
function rodar(modo: ModoDeRueda, a: Punto, b: Punto) {
  const ad = (x: number): boolean => admiteComoPuerta(rueda, x, modo);
  const eo = enganchar(rueda, motor.rejillaRueda, a[0], a[1], ad);
  const ed = enganchar(rueda, motor.rejillaRueda, b[0], b[1], ad);
  return eo && ed ? calcularRutaRodando(rueda, cuadernoPara(rueda), modo, eo, a, ed, b) : null;
}

/** El paseo a pie entre dos puntos. */
function andar(a: Punto, b: Punto) {
  const eo = enganchar(peaton, motor.rejilla, a[0], a[1]);
  const ed = enganchar(peaton, motor.rejilla, b[0], b[1]);
  return eo && ed ? calcularRuta(peaton, motor.cuaderno, eo, a, ed, b) : null;
}

describe('⭐ EL REMATE DEL APARCABICIS (30/08)', () => {
  before(() => {
    const memoria = cargarGrafo();
    peaton = cargarRed(memoria);
    portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    rueda = cargarRedDeLaRueda(memoria, peaton, entornoDe(portales));
    motor = {
      red: peaton,
      rejilla: cargarRejilla(peaton),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(peaton),
      redRueda: rueda,
      rejillaRueda: cargarRejilla(rueda),
      cuadernoRueda: cuadernoPara(rueda),
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi: cargarBiZi(entornoDe(portales)),
    };
  });

  /**
   * ⭐ JUEZ 1 — EL CASO DEL OJO, EN BICI: tres tramos y las cuentas cuadran.
   *
   * `COLOSO 2 → LEOPOLDO ROMEO 27` remata en **el aparcabicis de Calle
   * Monasterio de la Rábida, 5 anclajes**, y desde ahí se andan 52 m. Medido el
   * 30/08: **4.587 m y 970 s en 14 pasos**.
   *
   * Lo que la juez comprueba es que **el total es la suma de sus tramos**, y
   * los dos tramos se vuelven a calcular aquí por su cuenta —el pedaleo hasta
   * el soporte con el motor de la rueda, el paseo con el del peatón— en vez de
   * leerlos de la respuesta. Cuadrar la respuesta consigo misma no demostraría
   * nada; cuadrarla contra dos cálculos independientes, sí.
   */
  test('⭐ 1 · el caso del ojo en BICI remata en su aparcabicis y el total cuadra', () => {
    const t = viaje('bici', COLOSO, ROMEO);
    assert.equal(t.avisos.length, 0, 'tiene que haber ruta');

    // ── Los tres tramos, en el orden en que se leen ──────────────────────────
    const h = hito(t);
    assert.ok(h, 'la ruta de bici tiene que rematar en un aparcabicis');
    assert.match(h.texto, /^Aparca en el aparcabicis de .+ — \d+ anclajes?$/, h.texto);
    assert.equal(h.metros, 0, 'un hito no abre tramo: es una parada');

    const k = t.pasos.indexOf(h);
    assert.ok(k > 0, 'antes del hito tiene que haber tramo rodando');
    assert.equal(t.pasos[0]!.giro, 'salida');
    assert.ok(k < t.pasos.length - 1, 'después del hito tiene que haber tramo andando');
    assert.match(
      t.pasos[k + 1]!.texto,
      /^Sigue a pie hacia el /,
      'el tramo andando arranca con su propio verbo, no con otro «Sal de»',
    );
    assert.equal(t.pasos[t.pasos.length - 1]!.giro, 'llegada');
    // Y una sola salida y una sola llegada en todo el viaje.
    assert.equal(t.pasos.filter((p) => p.giro === 'llegada').length, 1);

    // ── Los metros y los minutos, tramo a tramo y en total ──────────────────
    const parada = paradaDelHito(t);
    const pedaleo = rodar('bici', donde(COLOSO), parada)!;
    const paseo = andar(parada, donde(ROMEO))!;
    assert.ok(pedaleo && paseo, 'los dos tramos tienen que poder calcularse por separado');

    assert.equal(t.metros, Math.round(pedaleo.metros + paseo.metros), 'los metros cuadran');
    assert.equal(
      t.segundos,
      Math.round(segundosRodando(rueda, pedaleo, 'bici') + paseo.metros / VELOCIDAD_MS),
      'los segundos cuadran: el pedaleo con su reloj y el paseo a 5,0 km/h',
    );
    // Las cifras medidas, para que el día que se muevan se sepa cuánto.
    assert.equal(t.metros, 4587, 'los metros del caso del ojo en bici, medidos el 30/08');
    assert.equal(t.segundos, 970);
    assert.equal(Math.round(paseo.metros), 52, 'lo que se anda desde el aparcabicis');
  });

  /**
   * ⭐ JUEZ 2 — EL PATÍN REMATA IGUAL.
   *
   * La Ordenanza **no le da al VMP un régimen de estacionamiento propio**: su
   * art. 56 regula por dónde circula, no dónde se deja. Así que aparca donde
   * aparca una bicicleta, en el mismo soporte y con la misma frase.
   *
   * El patín va por otro camino que la bici —lleva el calibrado fuerte por el
   * art. 56.2.c— y aun así **acaba en el mismo aparcabicis**, porque el soporte
   * se elige por su distancia al DESTINO y no por el camino que se traiga.
   * Medido: **4.869 m y 1.019 s en 15 pasos**, con los mismos 52 m a pie.
   *
   * ⭐ Eran 4.867 hasta el 30/08 por la tarde: **+2,200 m** de retirar la
   * corrección invertida de la Calle Monasterio de Siresa, cuadrados arista a
   * arista en `empuje.spec.ts`. El patín vuelve a bajar Siresa hacia el Doctor
   * Iranzo, que es su sentido legal, en vez de rodearla por Silvestre Pérez.
   */
  test('⭐ 2 · el PATÍN remata en el mismo aparcabicis y con la misma frase', () => {
    const enBici = viaje('bici', COLOSO, ROMEO);
    const enPatin = viaje('patin', COLOSO, ROMEO);
    assert.equal(enPatin.avisos.length, 0, 'tiene que haber ruta');

    const hb = hito(enBici);
    const hp = hito(enPatin);
    assert.ok(hp, 'el patín también remata: la Ordenanza no le da otro sitio donde dejarlo');
    assert.equal(hp.texto, hb!.texto, 'el mismo soporte y la misma frase que la bici');

    // Y el camino SÍ es otro: si fuera el mismo, la juez no probaría nada.
    assert.notEqual(enPatin.metros, enBici.metros);
    assert.equal(enPatin.metros, 4869, 'los metros del caso del ojo en patín, medidos el 30/08');
    // ⭐ Y +1 s, que también cuadra: rodando pasa de 983,3145 a 983,7545 s
    // —**+0,4400 exactos**—, y 2,200 m ÷ 0,4400 s = **5,000 m/s**, que es el
    // crucero del patín (18 km/h) clavado. El paseo del remate no se mueve
    // —mismo aparcabicis, mismos 52 m—, así que ese 0,44 es todo el cambio del
    // total, y le basta para cruzar la frontera del redondeo.
    assert.equal(enPatin.segundos, 1020);
  });

  /**
   * ⭐ JUEZ 3 — SE ELIGE EL MÁS CERCANO **ENTRANTE**, no el más cercano.
   *
   * El caso: `Portales.120525` (CARRETERA AEROPUERTO 19). Su aparcabicis más
   * cercano **de todos** es uno en Manuel Calvo a **156 m**… y es `Cerrado`,
   * cuya semántica NO CONSTA en la capa. El más cercano de los que entran es
   * el de `PARAÍSO ---MRL`, a **168 m**.
   *
   * Sin filtro, el hito mandaría a Manuel Calvo. Con filtro, manda a Paraíso y
   * paga 12 m. Es la diferencia entre un dato usado y un dato leído.
   *
   * Y no es un caso raro: **2.506 portales del censo tienen como más cercano
   * absoluto un aparcabicis que no entra**, medido sobre el fichero.
   */
  test('⭐ 3 · el aparcabicis elegido entra: los Cerrado y Proyecto no salen', () => {
    const t = viaje('bici', COLOSO, 'Portales.120525');
    const h = hito(t);
    assert.ok(h, 'tiene que rematar');
    assert.match(h.texto, /Paraíso/, `el hito ha elegido uno que no entra: «${h.texto}»`);
    assert.doesNotMatch(h.texto, /Manuel Calvo/, `«${h.texto}» es el Cerrado de 156 m`);

    // Y la regla general: en el inventario cargado no hay ni uno solo que no
    // entre. Si algún día se relajara el filtro, esta línea lo dice sin
    // depender de que un portal concreto siga donde está.
    assert.equal(
      motor.aparcabicis.entrantes.length,
      1914,
      'los entrantes son Abierto (1.906) + Vigilado (8), contados sobre el fichero',
    );
    for (const estado of ['Cerrado', 'Sin servicio', 'Proyecto']) {
      assert.equal(
        ESTADOS_QUE_ENTRAN.has(estado),
        false,
        `«${estado}» no puede entrar: su semántica NO CONSTA o el punto no existe`,
      );
    }
  });

  /**
   * ⭐ JUEZ 3 bis — DONDE NO HAY APARCABICIS, SE DICE, CON EL NÚMERO.
   *
   * ⚠️ Esta juez sale de un **absurdo cazado midiendo**, antes de publicarlo.
   * Contra los 46.150 portales, el aparcabicis entrante más cercano queda a
   * p50 84 m… pero a **p99 5.656 m y máximo 11.641**. Sin tope, una ruta a
   * `CALLE SAN MARCOS [TORRECILLA DE VALMADRID] 2` habría dicho «pedalea hasta
   * el aparcabicis y anda 11,6 km hasta tu casa».
   *
   * Con tope, la ruta llega hasta la puerta —como antes de esta casilla— y **un
   * aviso dice a cuántos metros estaba el más cercano**, que es el número con
   * el que quien lo lee puede decidir por su cuenta.
   */
  test('⭐ 3 bis · sin aparcabicis cerca, la ruta llega a la puerta y lo dice', () => {
    const t = viaje('bici', COLOSO, 'Portales.124514');
    assert.equal(hito(t), undefined, 'aquí no puede haber remate: no hay dónde');
    assert.equal(t.avisos.length, 1, 'y tiene que decirse');
    assert.match(t.avisos[0]!.texto, /aparcabicis más cercano/);
    assert.match(t.avisos[0]!.texto, /11\.641 m/, 'el aviso lleva el número, no una excusa');
    assert.match(t.avisos[0]!.texto, /llega hasta la puerta/);
    // Y la ruta existe: el aviso no es un error.
    assert.ok(t.pasos.length > 2 && t.metros > 0);
  });
});
