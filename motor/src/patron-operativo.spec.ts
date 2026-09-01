/**
 * ⭐ LAS JUECES DEL PATRÓN OPERATIVO (31/08).
 *
 * ⚠️ **CERO RED.** El recorrido de hoy es el HTML **medido** de la línea 29
 * sentido −2, y las coordenadas de sus dos postes provisionales son las que el
 * `marcadorParada` de Avanza dio hoy, copiadas aquí. Lo que se rutea es el
 * callejero del repositorio.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { cargarGrafo } from './grafo.ts';
import { cargarRed, type RedEnMemoria } from './red.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarPortales } from './portales.ts';
import { entornoDe } from './gacetero.ts';
import { cargarRedDeLaRueda } from './red-rueda.ts';
import { elFeedQueSeSirve } from './feed.ts';
import { andarConElPeaton, cocinar, type PatronBus, type RedDeBus } from './red-bus.ts';
import { buscarViaje, lineaDelViaje, postesCerca } from './viaje-bus.ts';
import { compararRecorrido, oficialDe, type Veredicto } from './desvios.ts';
import { leerPostes } from './recorrido.ts';
import { metrosEntre } from './cercano.ts';
import type { Motor } from './trayecto.ts';
import { olvidarDesvios, TTL_DESVIOS_MS } from './desvios.ts';
import {
  aplicarDesvios,
  avisoDeDesvio,
  laOperativa,
  refrescarYServir,
  idDeProvisional,
  patronOperativo,
  rodarConLaRueda,
  velocidadComercial,
  type RodarEntre,
} from './patron-operativo.ts';

/** El recorrido MEDIDO de la 29 sentido −2, el 31/08 a las 16:52. */
const RECORRIDO_29 = "\t\t<option value=\"posteDefault\">Seleccionar poste</option>\n\t\t<option id=\"posteValue\" value=\"219\">219 - Hospital Royo Villanova</option>\n\t\t<option id=\"posteValue\" value=\"529\">529 - Jes\u00fas Y Mar\u00eda n.\u00ba 89</option>\n\t\t<option id=\"posteValue\" value=\"528\">528 - Jes\u00fas Y Mar\u00eda n.\u00ba 61</option>\n\t\t<option id=\"posteValue\" value=\"346\">346 - Cristo Rey n.\u00ba 23</option>\n\t\t<option id=\"posteValue\" value=\"347\">347 - Cristo Rey n.\u00ba 77</option>\n\t\t<option id=\"posteValue\" value=\"883\">883 - Camino de Los Molinos n.\u00ba 150</option>\n\t\t<option id=\"posteValue\" value=\"898\">898 - Camino de Los Molinos n.\u00ba 165</option>\n\t\t<option id=\"posteValue\" value=\"365\">365 - Bernardo Ramazzini n.\u00ba 5</option>\n\t\t<option id=\"posteValue\" value=\"1203\">1203 - Bernardo Ramazzini / Maz</option>\n\t\t<option id=\"posteValue\" value=\"36\">36 - Av. Academia General Militar / Maz (Dir. Centro)</option>\n\t\t<option id=\"posteValue\" value=\"33\">33 - Av. Academia General Militar n.\u00ba 37</option>\n\t\t<option id=\"posteValue\" value=\"3508\">3508 - Av. Academia General Militar n.\u00ba 7</option>\n\t\t<option id=\"posteValue\" value=\"216\">216 - Av. Salvador Allende n.\u00ba 107</option>\n\t\t<option id=\"posteValue\" value=\"215\">215 - Av. Salvador Allende n.\u00ba 85</option>\n\t\t<option id=\"posteValue\" value=\"212\">212 - Av. Salvador Allende n.\u00ba 67</option>\n\t\t<option id=\"posteValue\" value=\"3012\">3012 - Av. Salvador Allende n.\u00ba 33</option>\n\t\t<option id=\"posteValue\" value=\"210\">210 - Av. Salvador Allende n.\u00ba 5</option>\n\t\t<option id=\"posteValue\" value=\"811\">811 - Valle de Broto n.\u00ba 18 / Av. Salvador Allende</option>\n\t\t<option id=\"posteValue\" value=\"131\">131 - Av. de Los Pirineos / Valle Broto</option>\n\t\t<option id=\"posteValue\" value=\"124\">124 - Av. de Los Pirineos / Colegio</option>\n\t\t<option id=\"posteValue\" value=\"659\">659 - P. Echegaray Y Caballero / Plaza del Pilar</option>\n\t\t<option id=\"posteValue\" value=\"654\">654 - P. Echegaray y Caballero n.\u00ba 112</option>\n\t\t<option id=\"posteValue\" value=\"1285\">1285 - Asalto / Centro de Historias</option>\n\t\t<option id=\"posteValue\" value=\"585\">585 - Miguel Servet n.\u00ba 28</option>\n\t\t<option id=\"posteValue\" value=\"284\">284 - Camino de Las Torres n.\u00ba 10</option>\n";

/**
 * ⭐ Las coordenadas de sus dos postes provisionales, **medidas** el 31/08 del
 * `marcadorParada` de su feed de llegadas. Es la técnica de ZetaBus para los
 * postes que solo existen en Avanza.
 */
const DONDE_ESTAN = new Map<number, { lat: number; lon: number }>([
  [654, { lat: 41.655688, lon: -0.875058 }],
  [1285, { lat: 41.650768, lon: -0.87008 }],
]);

let red: RedDeBus;
let peaton: RedEnMemoria;
let rodar: RodarEntre;
let andar: ReturnType<typeof andarConElPeaton>;
let laVeintinueve: PatronBus;
let motorDeLaRueda: Motor;
let veredicto: Veredicto;

const soloLa29 = (linea: string, direccion: string): Veredicto | null =>
  linea === '29' && direccion === '1' ? veredicto : null;

describe('⭐ EL PATRÓN OPERATIVO — la ruta de hoy con su traza', () => {
  before(async () => {
    peaton = cargarRed(cargarGrafo());
    andar = andarConElPeaton(peaton, cargarRejilla(peaton), cuadernoPara(peaton));
    const portales = cargarPortales();
    const rueda = cargarRedDeLaRueda(cargarGrafo(), peaton, entornoDe(portales));
    const rejillaRueda = cargarRejilla(rueda);
    const cuadernoRueda = cuadernoPara(rueda);
    rodar = rodarConLaRueda(rueda, rejillaRueda, cuadernoRueda);
    // ⭐ Lo MÍNIMO que `refrescarYServir` toca: la rueda y nada más. Va con un
    //    `as` declarado, como el motor mínimo de `viaje-bus.spec.ts`.
    motorDeLaRueda = { redRueda: rueda, rejillaRueda, cuadernoRueda } as unknown as Motor;
    red = (await cocinar(elFeedQueSeSirve().ruta, andar)).red;
    laVeintinueve = red.patrones.find(
      (p) => lineaDelViaje(red, p).corto === '29' && p.direccion === '1' && p.principal,
    )!;
    veredicto = compararRecorrido(
      oficialDe(red, laVeintinueve),
      leerPostes(RECORRIDO_29).map((p) => ({ poste: p.poste, nombre: p.nombre })),
    );
  });

  /**
   * ⭐ JUEZ 1 — EL SALTO NUEVO SE RECONSTRUYE SOBRE EL CALLEJERO.
   *
   * [gtfs.org, *producing data*; el mapper de Friburgo; `pfaedle`] el patrón es
   * **camino mínimo entre paradas consecutivas y concatenar**. Lo que se compra
   * aquí es que el camino es un CAMINO: más metros que la cuerda —porque rodea
   * manzanas— y más de dos puntos —porque dobla esquinas—. Una recta cumpliría
   * lo contrario en las dos cosas.
   */
  test('⭐ 1 · los saltos nuevos de la 29 se rutean, y no en línea recta', () => {
    assert.equal(veredicto.tipo, 'comparado');
    if (veredicto.tipo !== 'comparado') return;

    const op = aplicarDesvios(red, soloLa29, DONDE_ESTAN, rodar)!;
    assert.equal(op.cuentas.patrones, 1, 'un patrón operativo: el de la 29 dir 1');
    assert.ok(op.cuentas.saltosNuevos > 0, 'y tiene saltos que el feed no tenía');
    assert.equal(op.cuentas.reconstruidos, op.cuentas.saltosNuevos, 'todos ruteados');
    assert.equal(op.cuentas.rectas, 0, 'ninguno cayó a recta');
    // ⚠️ Y CERO postes nuevos: las dos paradas provisionales de la 29 —P.
    // Echegaray y Asalto/Centro de Historias— **sí están en el GTFS**; lo que no
    // estaban es en ESTE patrón. Provisional no es lo mismo que desconocida, y
    // la cuenta solo sube con las que el feed no tiene.
    assert.equal(op.cuentas.provisionales, 0);
    assert.equal(op.cuentas.sinCoordenada, 0);

    const hoy = op.red.patrones.find((p) => p.id === `${laVeintinueve.id}#hoy`)!;
    assert.ok(hoy, 'el patrón operativo tiene id propio [OTP2: recorrido distinto = patrón nuevo]');
    assert.equal(hoy.paradas.length, 25, 'la secuencia de hoy');

    // Los saltos que el feed YA tenía conservan su traza del asfalto.
    const heredados = hoy.saltos.filter((s) => laVeintinueve.saltos.some((o) => o.traza === s.traza));
    assert.ok(heredados.length > 0, 'los tramos que no cambiaron se conservan tal cual');

    // ⭐ Y LOS NUEVOS SON CAMINOS: más metros que la cuerda y más de dos puntos.
    const porId = new Map(op.red.paradas.map((p) => [p.id, p]));
    let mirados = 0;
    hoy.saltos.forEach((s, k) => {
      if (laVeintinueve.saltos.some((o) => o.traza === s.traza)) return;
      mirados++;
      const a = porId.get(hoy.paradas[k]!)!;
      const b = porId.get(hoy.paradas[k + 1]!)!;
      const cuerda = metrosEntre(a.lat, a.lon, b.lat, b.lon);
      assert.ok(s.metros >= cuerda - 0.5, `salto ${k}: ${s.metros.toFixed(0)} m para ${cuerda.toFixed(0)} de cuerda`);
      assert.ok(s.traza.length > 2, `salto ${k} tiene ${s.traza.length} puntos: eso es una recta, no un camino`);
      assert.equal(s.recta, false);
      // Y su tiempo sale de la velocidad comercial del patrón, no de un manual.
      const v = velocidadComercial(laVeintinueve)!;
      assert.equal(s.tipico, Math.round(s.metros / v));
    });
    assert.equal(mirados, op.cuentas.saltosNuevos);
  });

  /**
   * ⭐ JUEZ 2 — NADIE SUBE NI BAJA EN UN POSTE SUPRIMIDO.
   *
   * [OTP2] una parada por la que hoy no se pasa es `SKIPPED`. Y vale **para
   * todos los patrones de esa línea y sentido**: si el autobús no pasa por la
   * calle, no pasa tampoco para un refuerzo.
   *
   * Las tres de la 29 hoy: `Don Jaime I / Plaza De La Seo`, `Coso N.º 80` y
   * `Plaza San Miguel`.
   */
  test('⭐ 2 · en un poste suprimido no se sube ni se baja', () => {
    const op = aplicarDesvios(red, soloLa29, DONDE_ESTAN, rodar);
    assert.equal(op.suprimidas.size, 3);
    const porId = new Map(red.paradas.map((p) => [p.id, p]));
    const nombres = [...op.suprimidas].map((id) => porId.get(id)!.nombre).sort();
    assert.deepEqual(nombres, ['Coso N.º 80', 'Don Jaime I / Plaza De La Seo', 'Plaza San Miguel']);

    // Ninguna suprimida sale como acceso, aunque esté al lado.
    const una = porId.get([...op.suprimidas][0]!)!;
    const cerca = postesCerca(op.red, andar, una.lon, una.lat, op.suprimidas);
    assert.equal(cerca.some((a) => op.suprimidas.has(a.parada)), false, 'ni de acceso');

    // Y la búsqueda no la usa ni de subida ni de bajada: se pide un viaje que
    // pasa justo por ahí y se comprueba que ninguna etapa la toca.
    const viaje = buscarViaje({
      red: op.red,
      fecha: '20260907',
      acceso: postesCerca(op.red, andar, una.lon, una.lat, op.suprimidas),
      salida: postesCerca(op.red, andar, 41.64286, -0.861986, op.suprimidas).length > 0
        ? postesCerca(op.red, andar, -0.861986, 41.64286, op.suprimidas)
        : [],
    });
    if (viaje) {
      for (const m of viaje.montados) {
        assert.equal(op.suprimidas.has(m.desde), false, 'se subió en una suprimida');
        assert.equal(op.suprimidas.has(m.hasta), false, 'se bajó en una suprimida');
      }
    }
  });

  /**
   * ⭐ JUEZ 3 — LA RECTA DE RESERVA: solo si el grafo no conecta, y **se cuenta**.
   *
   * [OTP #2987] la recta vale como reserva **declarada**, nunca silenciosa. Se
   * compra con un `RodarEntre` que se niega a rutear: entonces —y solo
   * entonces— salen rectas, van marcadas y el contador las ve.
   *
   * Medido sobre la red entera el 31/08: **72 saltos nuevos, 72 ruteados, 0
   * rectas**. El callejero conecta todo lo que hoy hacía falta.
   */
  test('⭐ 3 · sin grafo que conecte, recta — marcada y contada', () => {
    const nuncaConecta: RodarEntre = () => null;
    const op = aplicarDesvios(red, soloLa29, DONDE_ESTAN, nuncaConecta);
    assert.ok(op.cuentas.saltosNuevos > 0);
    assert.equal(op.cuentas.rectas, op.cuentas.saltosNuevos, 'todas de reserva');
    assert.equal(op.cuentas.reconstruidos, 0);

    const hoy = op.red.patrones.find((p) => p.id === `${laVeintinueve.id}#hoy`)!;
    const deReserva = hoy.saltos.filter((s) => s.recta);
    assert.equal(deReserva.length, op.cuentas.rectas);
    for (const s of deReserva) {
      assert.equal(s.traza.length, 2, 'una recta son dos puntos');
    }
    // Y con el callejero de verdad, ninguna.
    assert.equal(aplicarDesvios(red, soloLa29, DONDE_ESTAN, rodar).cuentas.rectas, 0);
  });

  /**
   * ⭐ JUEZ 4 — SIN SABER, LA RED DEL FEED Y CERO AVISOS.
   *
   * **No saber no es no haberlo.** Si la capa no trae nada —el motor acaba de
   * arrancar, la fuente está caída, el veredicto es `indeterminado`— se sirve la
   * red cocinada tal cual y **no se avisa de ningún desvío**. Avisar de un
   * desvío que no se ha podido comprobar es inventarlo.
   */
  test('⭐ 4 · sin veredicto, la red del feed intacta y ni un aviso', () => {
    const aOscuras = aplicarDesvios(red, () => null, DONDE_ESTAN, rodar);
    assert.equal(aOscuras.red.paradas.length, red.paradas.length);
    assert.equal(aOscuras.red.patrones.length, red.patrones.length);
    assert.equal(aOscuras.suprimidas.size, 0);
    assert.equal(aOscuras.desviadas.length, 0);
    assert.equal(aOscuras.cuentas.patrones, 0);

    // Y un indeterminado tampoco toca nada.
    const sinSaber = aplicarDesvios(
      red,
      () => ({ tipo: 'indeterminado', motivo: 'la fuente no contesta' }),
      DONDE_ESTAN,
      rodar,
    );
    assert.equal(sinSaber.suprimidas.size, 0);
    assert.equal(sinSaber.desviadas.length, 0);

    // Y un diff VACÍO —la ruta restaurada— tampoco: se auto-apaga.
    const restaurada = aplicarDesvios(
      red,
      (l, d) =>
        l === '29' && d === '1'
          ? compararRecorrido(oficialDe(red, laVeintinueve), oficialDe(red, laVeintinueve))
          : null,
      DONDE_ESTAN,
      rodar,
    );
    assert.equal(restaurada.desviadas.length, 0);
    assert.equal(restaurada.suprimidas.size, 0);
  });

  /**
   * ⭐ JUEZ 5 — EL AVISO, con sus nombres y en una frase que se lee.
   *
   * Es el texto que va arriba y al lado del hito [GOV.UK, doble sitio], y lo
   * escribe el motor entero: la pantalla no compone nada.
   */
  test('⭐ 5 · el aviso dice la línea, las que se saltan y las provisionales', () => {
    const op = aplicarDesvios(red, soloLa29, DONDE_ESTAN, rodar);
    assert.equal(op.desviadas.length, 1);
    const texto = avisoDeDesvio(op.desviadas[0]!);
    assert.equal(
      texto,
      'La línea 29 va hoy desviada: no para en Don Jaime I / Plaza De La Seo, Coso N.º 80, ' +
        'Plaza San Miguel: para provisionalmente en P. Echegaray Y Caballero N.º 112, ' +
        'Asalto / Centro De Historias.',
    );
    // Las dos provisionales de la 29 están en el GTFS, así que no entra ninguna
    // parada nueva a la red.
    assert.equal(op.red.paradas.filter((p) => p.id.startsWith('AVZ')).length, 0);
  });

  /**
   * ⭐ JUEZ 6 — UN POSTE QUE **SOLO EXISTE EN AVANZA** entra con su coordenada.
   *
   * Los hay: ZetaBus mantiene un fichero con nueve. Aquí no se hereda ese
   * fichero —se heredaría una foto de otro día— sino **la técnica**: la
   * coordenada sale del `marcadorParada` del feed de llegadas de ese poste.
   *
   * ⚠️ Y sin coordenada **se cae y se cuenta** [regla B: sin coordenada no
   * existe]. Mejor un recorrido con un hueco declarado que un punto inventado.
   */
  test('⭐ 6 · un poste que solo existe en Avanza entra; sin coordenada, se cae y se cuenta', () => {
    assert.equal(veredicto.tipo, 'comparado');
    if (veredicto.tipo !== 'comparado') return;

    // Se le añade a la ruta de hoy un poste que el GTFS no conoce, en medio.
    const inventado = { poste: 99001, nombre: 'Poste provisional de obras' };
    const conNuevo: Veredicto = {
      ...veredicto,
      real: [veredicto.real[0]!, inventado, ...veredicto.real.slice(1)],
      hacia: [...veredicto.hacia, inventado],
    };
    const donde = new Map(DONDE_ESTAN);
    donde.set(99001, { lat: 41.6553, lon: -0.8762 });

    const con = aplicarDesvios(red, (l, d) => (l === '29' && d === '1' ? conNuevo : null), donde, rodar);
    assert.equal(con.cuentas.provisionales, 1);
    assert.equal(con.cuentas.sinCoordenada, 0);
    const nueva = con.red.paradas.find((p) => p.id === idDeProvisional(99001))!;
    assert.ok(nueva, 'la parada provisional entra en la red');
    assert.equal(nueva.nombre, 'Poste provisional de obras', 'con el nombre que da Avanza hoy');
    assert.equal(nueva.codigo, 'PA99001');
    assert.equal(nueva.lat, 41.6553);
    const hoy = con.red.patrones.find((p) => p.id === `${laVeintinueve.id}#hoy`)!;
    assert.equal(hoy.paradas[1], idDeProvisional(99001), 'y en su sitio de la secuencia');

    // ⚠️ Y SIN COORDENADA se cae del recorrido, y la cuenta lo dice.
    const sin = aplicarDesvios(red, (l, d) => (l === '29' && d === '1' ? conNuevo : null), DONDE_ESTAN, rodar);
    assert.equal(sin.cuentas.provisionales, 0);
    assert.equal(sin.cuentas.sinCoordenada, 1, 'se cuenta, no se calla');
    assert.equal(
      sin.red.paradas.filter((p) => p.id.startsWith('AVZ')).length,
      0,
      'sin coordenada no existe',
    );
  });

  /**
   * ⭐ JUEZ 7 — DOS PASES SEGUIDOS DEJAN LA MISMA RED. **La que faltaba.**
   *
   * ═══════════════════════════════════════════════════════════════════════════
   *  ⚠️ Y hace falta que sea sobre `refrescarYServir`, no sobre `aplicarDesvios`:
   *    el fallo del 1/09 no estaba en aplicar, estaba en **de dónde salían los
   *    veredictos al aplicar**. Lo destapó la contraprueba — mutar
   *    `refrescarYServir` para que volviera a leer de la caché **no ponía roja
   *    ninguna juez**, porque las que había le pasaban los veredictos a mano.
   *
   *  El caso: el segundo pase llega a `TTL − 10 s` del primero, encuentra la capa
   *  fresca por unos segundos, no visita la fuente ni una vez... y para cuando
   *  termina, la capa ha caducado. Si aplicara lo que la capa tenga entonces,
   *  aplicaría **cero**. Medido antes de arreglarlo: 23 detectados, 4 aplicados.
   * ═══════════════════════════════════════════════════════════════════════════
   */
  test('⭐ 7 · un segundo pase a TTL − 10 s deja la red igual que el primero', async () => {
    olvidarDesvios();

    /** La fuente de mentira: cada sentido pierde su primera parada → desviado. */
    const fuente: typeof fetch = (async (
      _url: string,
      opciones?: { body?: string },
    ): Promise<Response> => {
      const cuerpo = new URLSearchParams(opciones?.body ?? '');
      const linea = cuerpo.get('selectLinea');
      if (!linea) {
        return new Response('<input id="avz_bus_ajax_nonce" value="fingido" />', { status: 200 });
      }
      const sentido = cuerpo.get('selectSentido');
      const patron = red.patrones.find(
        (x) =>
          x.principal &&
          x.modo === 'bus' &&
          lineaDelViaje(red, x).corto === linea &&
          (x.direccion === '0' ? '-1' : '-2') === sentido,
      );
      if (!patron) {
        return new Response('', { status: 200 });
      }
      return new Response(
        oficialDe(red, patron)
          .slice(1)
          .map((q) => `<option value="${q.poste}">${q.poste} - ${q.nombre}</option>`)
          .join(''),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    // El día de más servicio del calendario: uno en el que de verdad circulan.
    const cuando = Object.entries(red.porFecha).sort((a, b) => b[1].length - a[1].length)[0]![0];

    const T0 = 1_700_000_000_000;
    let reloj = T0;
    const uno = await refrescarYServir(motorDeLaRueda, red, cuando, fuente, 0, () => reloj);
    const primera = [...(laOperativa()?.suprimidas ?? [])].sort();
    assert.ok(uno.deLaFuente.desviados > 0, 'la fuente de mentira tiene que dar desvíos');
    assert.ok(primera.length > 0, 'el primer pase tiene que suprimir algo');

    // ⭐ EL SEGUNDO PASE, justo antes de que caduque la capa del primero.
    reloj = T0 + TTL_DESVIOS_MS - 10_000;
    const dos = await refrescarYServir(motorDeLaRueda, red, cuando, fuente, 0, () => reloj);
    const segunda = [...(laOperativa()?.suprimidas ?? [])].sort();

    assert.equal(dos.deLaFuente.desviados, uno.deLaFuente.desviados, 'detecta los mismos');
    // ⭐ Y APLICA LOS MISMOS: es lo que se perdía.
    assert.equal(
      dos.deLaRed.patrones,
      uno.deLaRed.patrones,
      `el segundo pase aplicó ${dos.deLaRed.patrones} de los ${dos.deLaFuente.desviados} que detectó`,
    );
    assert.deepEqual(segunda, primera, 'el segundo pase perdió supresiones que el primero sí puso');
  });

});
