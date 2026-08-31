/**
 * ⭐ LAS JUECES DE LA RUTA OPERATIVA DE HOY (31/08).
 *
 * ⚠️ **CERO RED**, y los fixtures están **MEDIDOS**: son las dos respuestas que
 * `get_stops_list` dio hoy para la línea 29, copiadas byte a byte —2.005 y
 * 2.144 bytes—. No son un HTML que yo imagine que Avanza manda: es el que mandó.
 *
 * 🔒 **El nonce no aparece por ninguna parte.** Ni en los fixtures, ni en las
 * jueces, ni en el scratchpad: se pidió, se usó en memoria y se borró.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { elFeedQueSeSirve } from './feed.ts';
import { cocinar, type PatronBus, type RedDeBus } from './red-bus.ts';
import { lineaDelViaje } from './viaje-bus.ts';
import {
  claveDe,
  compararRecorrido,
  desvioServido,
  oficialDe,
  olvidarDesvios,
  servirDesvio,
  traerDesvio,
  TTL_DESVIOS_MS,
  UMBRAL_ABSURDO,
  visitasAlRecorrido,
  type ParadaDelDiff,
} from './desvios.ts';
import {
  invalidarNonce,
  leerNonceDe,
  leerPostes,
  RecorridoIlegible,
  SENTIDO_DE,
} from './recorrido.ts';

/**
 * ⭐ LAS DOS RESPUESTAS DE `get_stops_list`, MEDIDAS el 31/08/2026 a las 16:52.
 *
 *   · **29 sentido −1**, 2.005 bytes, 23 postes. Sin desvío contra el GTFS.
 *   · **29 sentido −2**, 2.144 bytes, 25 postes. **Desviada**: el GTFS tiene 26.
 *
 * Traen el `<option value="posteDefault">` de relleno que encabeza el
 * desplegable, y el texto en la forma `«284 - Camino de Las Torres n.º 10»`.
 */
const RECORRIDO_29_MENOS_1 = "\t\t<option value=\"posteDefault\">Seleccionar poste</option>\n\t\t<option id=\"posteValue\" value=\"284\">284 - Camino de Las Torres n.\u00ba 10</option>\n\t\t<option id=\"posteValue\" value=\"889\">889 - Concepci\u00f3n / Miguel Servet</option>\n\t\t<option id=\"posteValue\" value=\"744\">744 - Plaza San Miguel</option>\n\t\t<option id=\"posteValue\" value=\"340\">340 - Coso n.\u00ba 188</option>\n\t\t<option id=\"posteValue\" value=\"1246\">1246 - P. Echegaray y Caballero / Puente de Piedra</option>\n\t\t<option id=\"posteValue\" value=\"1247\">1247 - Pso. Echegaray y Caballero / Puente de Santiago</option>\n\t\t<option id=\"posteValue\" value=\"126\">126 - Av. de Los Pirineos / Tv Arag\u00f3n</option>\n\t\t<option id=\"posteValue\" value=\"816\">816 - Valle de Broto / Parque del T\u00edo Jorge</option>\n\t\t<option id=\"posteValue\" value=\"217\">217 - Av. Salvador Allende / Bomberos</option>\n\t\t<option id=\"posteValue\" value=\"3010\">3010 - Av. Salvador Allende / Juslibol</option>\n\t\t<option id=\"posteValue\" value=\"218\">218 - Av. Salvador Allende / del Somport</option>\n\t\t<option id=\"posteValue\" value=\"213\">213 - Av. Salvador Allende Fte. n.\u00ba 85</option>\n\t\t<option id=\"posteValue\" value=\"214\">214 - Av. Salvador Allende / San Juan de La Pe\u00f1a</option>\n\t\t<option id=\"posteValue\" value=\"28\">28 - Av. Academia General Militar n.\u00ba 2</option>\n\t\t<option id=\"posteValue\" value=\"29\">29 - Av. Academia General Militar n.\u00ba 14</option>\n\t\t<option id=\"posteValue\" value=\"31\">31 - Av. Academia General Militar n.\u00ba 54</option>\n\t\t<option id=\"posteValue\" value=\"34\">34 - Av. Academia General Militar / Maz</option>\n\t\t<option id=\"posteValue\" value=\"32\">32 - Av. Academia General Militar / Cristo Rey</option>\n\t\t<option id=\"posteValue\" value=\"366\">366 - Autov\u00eda de Huesca / Pasarela</option>\n\t\t<option id=\"posteValue\" value=\"527\">527 - Jes\u00fas Y Mar\u00eda n.\u00ba 15</option>\n\t\t<option id=\"posteValue\" value=\"346\">346 - Cristo Rey n.\u00ba 23</option>\n\t\t<option id=\"posteValue\" value=\"347\">347 - Cristo Rey n.\u00ba 77</option>\n\t\t<option id=\"posteValue\" value=\"219\">219 - Hospital Royo Villanova</option>\n";
const RECORRIDO_29_MENOS_2 = "\t\t<option value=\"posteDefault\">Seleccionar poste</option>\n\t\t<option id=\"posteValue\" value=\"219\">219 - Hospital Royo Villanova</option>\n\t\t<option id=\"posteValue\" value=\"529\">529 - Jes\u00fas Y Mar\u00eda n.\u00ba 89</option>\n\t\t<option id=\"posteValue\" value=\"528\">528 - Jes\u00fas Y Mar\u00eda n.\u00ba 61</option>\n\t\t<option id=\"posteValue\" value=\"346\">346 - Cristo Rey n.\u00ba 23</option>\n\t\t<option id=\"posteValue\" value=\"347\">347 - Cristo Rey n.\u00ba 77</option>\n\t\t<option id=\"posteValue\" value=\"883\">883 - Camino de Los Molinos n.\u00ba 150</option>\n\t\t<option id=\"posteValue\" value=\"898\">898 - Camino de Los Molinos n.\u00ba 165</option>\n\t\t<option id=\"posteValue\" value=\"365\">365 - Bernardo Ramazzini n.\u00ba 5</option>\n\t\t<option id=\"posteValue\" value=\"1203\">1203 - Bernardo Ramazzini / Maz</option>\n\t\t<option id=\"posteValue\" value=\"36\">36 - Av. Academia General Militar / Maz (Dir. Centro)</option>\n\t\t<option id=\"posteValue\" value=\"33\">33 - Av. Academia General Militar n.\u00ba 37</option>\n\t\t<option id=\"posteValue\" value=\"3508\">3508 - Av. Academia General Militar n.\u00ba 7</option>\n\t\t<option id=\"posteValue\" value=\"216\">216 - Av. Salvador Allende n.\u00ba 107</option>\n\t\t<option id=\"posteValue\" value=\"215\">215 - Av. Salvador Allende n.\u00ba 85</option>\n\t\t<option id=\"posteValue\" value=\"212\">212 - Av. Salvador Allende n.\u00ba 67</option>\n\t\t<option id=\"posteValue\" value=\"3012\">3012 - Av. Salvador Allende n.\u00ba 33</option>\n\t\t<option id=\"posteValue\" value=\"210\">210 - Av. Salvador Allende n.\u00ba 5</option>\n\t\t<option id=\"posteValue\" value=\"811\">811 - Valle de Broto n.\u00ba 18 / Av. Salvador Allende</option>\n\t\t<option id=\"posteValue\" value=\"131\">131 - Av. de Los Pirineos / Valle Broto</option>\n\t\t<option id=\"posteValue\" value=\"124\">124 - Av. de Los Pirineos / Colegio</option>\n\t\t<option id=\"posteValue\" value=\"659\">659 - P. Echegaray Y Caballero / Plaza del Pilar</option>\n\t\t<option id=\"posteValue\" value=\"654\">654 - P. Echegaray y Caballero n.\u00ba 112</option>\n\t\t<option id=\"posteValue\" value=\"1285\">1285 - Asalto / Centro de Historias</option>\n\t\t<option id=\"posteValue\" value=\"585\">585 - Miguel Servet n.\u00ba 28</option>\n\t\t<option id=\"posteValue\" value=\"284\">284 - Camino de Las Torres n.\u00ba 10</option>\n";

/** La página del nonce, reducida a lo que importa. El valor es de mentira. */
const PAGINA_CON_NONCE =
  '<form><input type="hidden" id="avz_bus_ajax_nonce" name="nonce" value="1234abcd" /></form>';

let red: RedDeBus;
let laVeintinueve: (direccion: string) => PatronBus;

describe('⭐ LA RUTA OPERATIVA DE HOY — lector y diff', () => {
  before(async () => {
    red = (await cocinar(elFeedQueSeSirve().ruta, null)).red;
    laVeintinueve = (direccion) =>
      red.patrones.find(
        (p) => lineaDelViaje(red, p).corto === '29' && p.direccion === direccion && p.principal,
      )!;
  });

  /**
   * ⭐ JUEZ 1 — EL DIFF DE LA 29, con la respuesta medida.
   *
   * `29` dirección 1 —sentido `-2` de Avanza— **va desviada hoy**: el GTFS le da
   * 26 postes y la ruta operativa 25. Fuera **433, 1293 y 745**; provisionales
   * **654 y 1285**. Las cifras salen de la respuesta de arriba, no de mi cabeza.
   *
   * ⚠️ Y la traducción de sentido va comprada aquí porque **si estuviera al
   * revés, todos los diffs saldrían llenos de desvíos inventados** y con una
   * pinta perfectamente razonable [ZetaBus la midió por solape: 91-93 %].
   */
  test('⭐ 1 · la 29 dir 1 está desviada: fuera 433/1293/745, provisionales 654/1285', () => {
    assert.equal(SENTIDO_DE['1'], '-2', 'dirección 1 es el sentido −2 de Avanza');
    assert.equal(SENTIDO_DE['0'], '-1');

    const postes = leerPostes(RECORRIDO_29_MENOS_2);
    assert.equal(postes.length, 25, 'los postes que trae la respuesta medida');
    assert.equal(postes[0]!.nombre.length > 0, true, 'y cada uno con su nombre');

    const v = compararRecorrido(
      oficialDe(red, laVeintinueve('1')),
      postes.map((p) => ({ poste: p.poste, nombre: p.nombre })),
    );
    assert.equal(v.tipo, 'comparado');
    if (v.tipo !== 'comparado') return;
    assert.equal(v.hayDesvio, true);
    assert.equal(v.oficiales, 26);
    assert.equal(v.reales, 25);
    assert.deepEqual(v.fuera.map((p) => p.poste), [433, 1293, 745]);
    assert.deepEqual(v.hacia.map((p) => p.poste), [654, 1285]);

    // ⭐ Y EL OTRO SENTIDO NO ESTÁ DESVIADO: 23 y 23, diff vacío. Si el lector o
    // la traducción fallaran, este también saldría desviado.
    const otro = compararRecorrido(
      oficialDe(red, laVeintinueve('0')),
      leerPostes(RECORRIDO_29_MENOS_1).map((p) => ({ poste: p.poste, nombre: p.nombre })),
    );
    assert.equal(otro.tipo, 'comparado');
    if (otro.tipo !== 'comparado') return;
    assert.equal(otro.hayDesvio, false, 'el sentido −1 de la 29 no está desviado hoy');
    assert.equal(otro.oficiales, 23);
    assert.equal(otro.reales, 23);
  });

  /**
   * ⭐ JUEZ 2 — EL LECTOR SE QUEJA EN VOZ ALTA, que es lo único que lo salva.
   *
   * [ZetaBus, la regla del fichero] *«el día que metan un `<optgroup>`, o cambien
   * el atributo, el regex devuelve MENOS PARADAS. Y menos paradas significa
   * PARADAS SUPRIMIDAS QUE NO EXISTEN.»* Sin parser de HTML —dependencias cero—
   * la defensa es el **contador independiente** [L1]: los `<option` que hay
   * contra los que se han leído.
   */
  test('⭐ 2 · leer de menos no es posible en silencio: se cuenta y se lanza', () => {
    // Un <optgroup> por medio: se rechaza de frente, no se lee a medias.
    assert.throws(
      () => leerPostes('<optgroup label="ida">' + RECORRIDO_29_MENOS_2 + '</optgroup>'),
      RecorridoIlegible,
    );
    // Un value que no es un poste: se lanza en vez de saltárselo.
    assert.throws(() => leerPostes('<option value="ochenta">80 - Nada</option>'), RecorridoIlegible);
    // Sin ni un <option>: se lanza.
    assert.throws(() => leerPostes('<p>mantenimiento</p>'), RecorridoIlegible);
    assert.throws(() => leerPostes('<option value="posteDefault">Seleccionar</option>'), RecorridoIlegible);
    // ⚠️ Y una respuesta VACÍA no lanza: es «ese sentido no existe» (las
    // circulares solo tienen uno). Quien llama decide.
    assert.deepEqual(leerPostes(''), []);

    // El nonce se lee del campo oculto, y si no está, se lanza.
    assert.equal(leerNonceDe(PAGINA_CON_NONCE), '1234abcd');
    assert.throws(() => leerNonceDe('<form></form>'), RecorridoIlegible);
  });

  /**
   * ⭐ JUEZ 3 — EL FRENO DE MANO: más de la mitad fuera no es un desvío.
   *
   * *«Preferimos decir NO LO SÉ a tachar treinta paradas que siguen ahí.»* Un
   * desvío de obras quita tres paradas, cinco, ocho. No quita el 70 % de la
   * línea: si el diff dice eso, lo que ha pasado es que la lectura salió a
   * medias — y sin este freno la pantalla tacharía media línea con toda la
   * coherencia visual del mundo.
   */
  test('⭐ 3 · con más de la mitad de las paradas fuera, indeterminado', () => {
    assert.equal(UMBRAL_ABSURDO, 0.5);
    const oficial: ParadaDelDiff[] = Array.from({ length: 10 }, (_, i) => ({
      poste: i + 1,
      nombre: `poste ${i + 1}`,
    }));

    // Seis de diez fuera: por encima del umbral → no se tacha nada.
    const roto = compararRecorrido(oficial, oficial.slice(0, 4));
    assert.equal(roto.tipo, 'indeterminado');
    if (roto.tipo === 'indeterminado') {
      assert.match(roto.motivo, /60 %/);
      assert.match(roto.motivo, /lectura rota/);
    }

    // Cinco de diez: justo en el umbral, y el umbral NO se pasa → sí se compara.
    const justo = compararRecorrido(oficial, oficial.slice(0, 5));
    assert.equal(justo.tipo, 'comparado');

    // Y una lista vacía tampoco tacha la línea entera.
    assert.equal(compararRecorrido(oficial, []).tipo, 'indeterminado');
    assert.equal(compararRecorrido([], oficial).tipo, 'indeterminado');
  });

  /**
   * ⭐ JUEZ 4 — SE AUTO-APAGA: diff vacío, cero avisos.
   *
   * No hay lista de desvíos que mantener ni fecha que vigilar. El día que Avanza
   * restaure la ruta, las dos listas coinciden y el aviso desaparece **solo**.
   * *«Un sistema que hay que acordarse de apagar acaba mintiendo — siempre.»*
   */
  test('⭐ 4 · cuando la ruta se restaura, el desvío se apaga solo', () => {
    const oficial = oficialDe(red, laVeintinueve('1'));
    const v = compararRecorrido(oficial, oficial);
    assert.equal(v.tipo, 'comparado');
    if (v.tipo !== 'comparado') return;
    assert.equal(v.hayDesvio, false);
    assert.equal(v.fuera.length, 0);
    assert.equal(v.hacia.length, 0);
    assert.equal(v.reordenado, false);

    // Y el reordenado sí es desvío: mismas paradas, otro orden.
    const alReves = compararRecorrido(oficial, [...oficial].reverse());
    assert.equal(alReves.tipo, 'comparado');
    if (alReves.tipo === 'comparado') {
      assert.equal(alReves.hayDesvio, true);
      assert.equal(alReves.reordenado, true);
      assert.equal(alReves.fuera.length, 0, 'no falta ninguna: solo cambió el orden');
    }
  });

  /**
   * ⭐ JUEZ 5 — TTL DE UNA HORA Y SINGLE-FLIGHT, **y aparte de lo vivo**.
   *
   * ⚠️ [ZetaBus, `motor.ts:32-34`] *«si este TTL de 1 h tocara la caché de las
   * LLEGADAS, la pantalla diría 'llega en 2 min' con datos de hace una hora»*.
   * Aquí van por construcción en dos sitios: los minutos de Avanza **no se
   * cachean nunca** —se preguntan en cada `Generar`— y esto se cachea una hora.
   */
  test('⭐ 5 · el recorrido se guarda una hora, y dos peticiones a la vez son una', async () => {
    assert.equal(TTL_DESVIOS_MS, 3_600_000);
    olvidarDesvios();
    invalidarNonce();

    let reloj = 1_000_000;
    const ahora = () => reloj;
    const pedir = (async (url: string) => {
      await new Promise((r) => setTimeout(r, 5));
      return new Response(String(url).includes('lineas-y-horarios') ? PAGINA_CON_NONCE : RECORRIDO_29_MENOS_2, {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const patron = laVeintinueve('1');
    const [a, b] = await Promise.all([
      traerDesvio(red, patron, '29', pedir, ahora),
      traerDesvio(red, patron, '29', pedir, ahora),
    ]);
    assert.equal(visitasAlRecorrido(), 1, `dos a la vez hicieron ${visitasAlRecorrido()} visitas`);
    assert.equal(a, b, 'las dos comparten la MISMA observación');
    assert.equal(a.veredicto.tipo, 'comparado');

    // Dentro de la hora: de la capa, sin salir a la red.
    reloj += TTL_DESVIOS_MS - 1;
    await traerDesvio(red, patron, '29', pedir, ahora);
    assert.equal(visitasAlRecorrido(), 1, 'dentro de la hora no se vuelve a preguntar');
    assert.ok(desvioServido('29', '1', reloj), 'y sigue servido');

    // Pasada la hora: caduca y se vuelve a preguntar.
    reloj += 2;
    assert.equal(desvioServido('29', '1', reloj), null, 'caducado');
    await traerDesvio(red, patron, '29', pedir, ahora);
    assert.equal(visitasAlRecorrido(), 2);
  });

  /**
   * ⭐ JUEZ 6 — EL 403 DEL NONCE: uno se perdona, dos son indeterminado.
   *
   * El nonce caduca (~12 h) y el memoizado puede quedarse viejo. Al primer 403
   * se invalida, se re-pide y se reintenta **una** vez. Si el fresco también da
   * 403, sube — y arriba eso es `indeterminado`, **no** «no hay desvío».
   */
  test('⭐ 6 · un 403 se perdona una vez; si persiste, indeterminado', async () => {
    olvidarDesvios();
    invalidarNonce();
    const patron = laVeintinueve('1');

    // Primero: el ajax da 403 una vez y luego contesta.
    let ajax = 0;
    const flaquea = (async (url: string) => {
      if (String(url).includes('lineas-y-horarios')) {
        return new Response(PAGINA_CON_NONCE, { status: 200 });
      }
      ajax++;
      return ajax === 1
        ? new Response('', { status: 403 })
        : new Response(RECORRIDO_29_MENOS_2, { status: 200 });
    }) as unknown as typeof fetch;
    const bien = await traerDesvio(red, patron, '29', flaquea);
    assert.equal(bien.veredicto.tipo, 'comparado', 'el reintento con nonce fresco funcionó');
    assert.equal(ajax, 2);

    // Y ahora el 403 persistente: indeterminado, y NO «sin desvío».
    olvidarDesvios();
    invalidarNonce();
    const siempre403 = (async (url: string) =>
      String(url).includes('lineas-y-horarios')
        ? new Response(PAGINA_CON_NONCE, { status: 200 })
        : new Response('', { status: 403 })) as unknown as typeof fetch;
    const mal = await traerDesvio(red, patron, '29', siempre403);
    assert.equal(mal.veredicto.tipo, 'indeterminado');
    if (mal.veredicto.tipo === 'indeterminado') {
      assert.match(mal.veredicto.motivo, /403/);
    }
  });

  /**
   * ⭐ JUEZ 7 — AQUÍ NO ENTRA NI UN DATO VIVO, y lo dice la firma.
   *
   * Deducir un desvío de «ese poste lleva callado toda la mañana» es
   * inventárselo: un poste callado puede ser un desvío, pueden ser las cuatro de
   * la mañana, o puede ser un poste que Avanza no tiene dado de alta — y la API
   * devuelve **lo mismo en los tres casos**. `compararRecorrido` recibe dos
   * listas de postes y **nada más**: no hay por dónde colar una llegada.
   */
  test('⭐ 7 · el diff no mira lo vivo: no puede, por la forma de su firma', async () => {
    const fuente = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./desvios.ts', import.meta.url), 'utf8'),
    );
    assert.ok(
      !/from '\.\/avanza\.ts'[\s\S]*llegadasDelPoste/.test(fuente),
      'desvios.ts no puede importar el canal de llegadas',
    );
    assert.ok(!fuente.includes('llegadasDelPoste'), 'ni nombrarlo');
    assert.equal(claveDe('29', '1'), '29|1');

    // Y la firma: dos listas y nada más. Se compra llamándola con lo mínimo.
    const v = compararRecorrido([{ poste: 1, nombre: 'a' }], [{ poste: 1, nombre: 'a' }]);
    assert.equal(v.tipo, 'comparado');

    // La capa admite una observación puesta a mano, sin red.
    olvidarDesvios();
    servirDesvio({ linea: '99', direccion: '0', veredicto: { tipo: 'indeterminado', motivo: 'a mano' }, cuando: Date.now() });
    assert.equal(desvioServido('99', '0')?.veredicto.tipo, 'indeterminado');
    assert.equal(visitasAlRecorrido(), 0, 'y no se ha salido a la red ni una vez');
  });
});
