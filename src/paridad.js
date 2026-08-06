// ⭐⭐⭐ TANDA 33 · DOS ACERAS, DOS CALLES — la regla de la paridad.
//
// ═════════════════════════════════════════════════════════════════════════════
// LA DECISIÓN DE ANTONIO
// ═════════════════════════════════════════════════════════════════════════════
//   > *«La acera par por un lado, la acera impar por otro. A efectos de
//   >  entenderme, es COMO SI FUESEN DOS CALLES DIFERENTES QUE NO GUARDAN
//   >  RELACIÓN — precisamente para evitar lo que ha pasado con Avenida
//   >  Cataluña.»*
//
//   ⭐ El fallo de fondo, en una frase: **LA CERCANÍA NUMÉRICA NO ES CERCANÍA
//     FÍSICA.** El 78 de Avenida Cataluña no existe, el geocodificador caía al 77
//     —la acera de enfrente— y el par más próximo estaba a 258 m.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ EL ALCANCE, DECLARADO ANTES DE ESCRIBIR NADA
// ═════════════════════════════════════════════════════════════════════════════
//   Esta regla **solo se mete donde la paridad es el problema**: cuando la
//   respuesta de hoy CAMBIA DE ACERA. Si el número más cercano ya era de la
//   paridad pedida, la respuesta es la de siempre, byte a byte.
//
//   ⚠️ No es una cautela decorativa: sin ese candado, la regla de la distancia se
//     habría llevado por delante el origen de la RUTA 3 —«Cantando Bajo la Lluvia
//     6», que no existe y cae al 10, **los dos pares**—. Una ruta moviéndose sin
//     que su extremo cambie de acera es la señal de que el cambio se ha salido de
//     su sitio. ⇒ está escrito como invariante y se comprueba en
//     `src/medir-paridad.js` §C1: **el conjunto de consultas que cambian de
//     respuesta ⊆ el conjunto de consultas cuya respuesta de hoy cambia de acera.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ DÓNDE LA PARIDAD **NO** SIGNIFICA ACERA — y no se fuerza
// ═════════════════════════════════════════════════════════════════════════════
//   1 · **Numeración correlativa** (1,2,3,4… seguidos por el mismo lado). Se
//       detecta por geometría, no por lista de nombres: ver `formaDeVia()`.
//   2 · **Vías de un solo lado**: si no hay ni un portal de la paridad pedida,
//       no hay adónde ir. Se cae a la respuesta de siempre y se dice.
//   3 · **Números repetidos** dentro de la misma vía: son coincidencia EXACTA, y
//       la regla ni los ve.
//   4 · **Letras, `bis` y rangos**: el número de orden ya trae la paridad. ⚠️ 26
//       portales de 46.150 declaran un rango que cruza paridad (`11-12`); ahí la
//       paridad del rango es la del primer número y no se puede hacer más.

'use strict';

// ── LOS LISTONES, y de dónde sale cada uno ───────────────────────────────────

/**
 * ⭐⭐ «RAZONABLEMENTE CERCA», EN METROS.
 *
 * ⛔ No se mide en números de portal: entre el 78 y el 80 puede haber diez metros
 *    o doscientos, y eso es justo lo que hizo fallar al geocodificador.
 *
 * ⭐ De dónde sale: de la SEPARACIÓN ENTRE PORTALES CONSECUTIVOS DE LA MISMA
 *   ACERA en vías urbanas — **30.283 pares medidos: mediana 14 m, p75 24 m,
 *   p90 52 m, p95 91 m**. Se redondea a 50.
 * ⚠️ TANDA 36 · esta línea decía «30.239 pares, p75 23, p90 48, p95 82» y **no era
 *   lo que publicó `docs/H1-PARIDAD.md` §A2**, que ya traía 30.283 · 24 · 52 · 91 —
 *   lo mismo que sale hoy, con el mismo bucle de medida y desde el mismo commit.
 *   ⛔ **De dónde salieron esos cuatro números NO CONSTA:** ninguna variante del
 *     código del repositorio los reproduce (bitácora nº144). Salieron de un
 *     borrador y se quedaron viviendo en prosa tres tandas, porque **ningún
 *     guardián los comparaba con nada** — el que vigila el listón lee el reparto
 *     MEDIDO, no el escrito aquí.
 *   ⇒ el reparto entero pasa a estar exigido en `medir-paridad.js` §A2.
 *   El criterio en una frase: *no se da por buena una respuesta cuyo error
 *   posible sea mayor que la distancia típica entre dos portales seguidos de esa
 *   misma acera.* O sea: **como mucho, el portal de al lado.**
 * ⚠️ Y coincide con el listón de 50 m que la tanda 32 ya publicó por otro camino
 *   («6.380 huecos urbanos desplazan más de 50 m»). Son dos medidas
 *   independientes que caen en la misma magnitud.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * ⚠️⚠️⚠️ ESTE NÚMERO SE HA MOVIDO DOS VECES. LAS DOS VAN ESCRITAS AQUÍ.
 * ═════════════════════════════════════════════════════════════════════════════
 *   **50 → 100 (tanda 34) → 50 (tanda 36).** Y no es una indecisión: es que el
 *   dato sobre el que se decidió la primera mudanza resultó ser un artefacto.
 *
 *   · **50 (tanda 33)** — de la medida de arriba: el p90 de la separación entre
 *     portales seguidos de la misma acera. *Como mucho, el portal de al lado.*
 *
 *   · **100 (tanda 34)** — ⛔ NO de un percentil. La tanda 33 publicó el dial del
 *     coste de cada listón, y el argumento fue **el acantilado**: entre 50 y 100
 *     las contestadas se multiplicaban por siete (4.562 → 31.411).
 *
 *   · **50 (tanda 36)** — ⭐⭐⭐ **el acantilado era el centinela 99999.** La tanda
 *     35 lo apagó y volvió a medir el dial sobre el universo limpio: 4.562 a 50 m
 *     y **6.421** a 100 ⇒ **×1,4**, no ×7. Los 4.562 son idénticos en los dos
 *     porque toda la contaminación estaba en esa banda.
 *     ⇒ **la razón para estar en 100 no existía**, y Antonio devuelve el listón a
 *       donde lo puso la medida. Ver `docs/H1-TOPE-ADELANTO.md` §B3.
 *
 *   ⭐ Y el argumento de fondo, que es de diseño y no de medida: **con el listón
 *     bajo no te quedas sin nada — te sale la SUGERENCIA.** *«Se dice que no se
 *     tiene y se sugiere.»* A 50 m el buscador contesta; a más, pregunta. Y eso
 *     es más honesto que llevarte a 100 m sin avisar.
 *
 * ⛔ Los otros dos listones NO se tocan: `ENFRENTE_M` 150, `ADELANTO_M` 20.
 */
const RAZONABLE_M = 50;

/**
 * ⭐⭐ TANDA 34 · EL RADIO PARA OFRECER LA ACERA DE ENFRENTE.
 *
 *   > *«Se puede comunicar con la acera de enfrente si está en un radio de 100
 *   >  metros, que eso por su lat-lon se puede saber.»*
 *   > *«Lo puedes subir a 150 metros porque pueden ser avenidas muy anchas.»*
 *
 * ⭐ Esto **no rompe la regla de la tanda 33: la afina.** Entonces se dijo *«el de
 *   enfrente, si se lo das, corremos el riesgo de que no esté ni remotamente
 *   cerca»* — y con la lat-lon **se puede saber si lo está**. Es exactamente la
 *   lección del fallo: *la cercanía numérica no es cercanía física, pero la
 *   física sí se mide.*
 *
 * ⚠️ Y que el de enfrente tenga MÁS margen que el propio no es una incoherencia:
 *   compensa que **cruzar una avenida ancha es poco camino aunque los metros
 *   digan mucho**.
 *
 * ⛔ DESDE DÓNDE SE MIDE ESE RADIO, que es lo que decide si el listón vale:
 *   **desde el portal que se ofrecería de su propia acera** (el más cercano en
 *   número). Es la misma distancia que la tanda 32 publicó —*«el par más próximo
 *   (nº74) a 258 m del nº77 que te da»*— así que los tres informes hablan del
 *   mismo número. ⇒ en Avenida Cataluña el 77 queda a 258 m del 74 y **no entra**.
 */
const ENFRENTE_M = 150;

/**
 * ⭐⭐⭐ TANDA 35 · EL TOPE DE ADELANTO — cuánto puede estar CALLE ABAJO.
 *
 *   > **Antonio:** *«CRUZAR TE MUEVE DE LADO, NO HACIA DELANTE.»*
 *
 * ⭐ Y ése es el porqué geométrico de todo esto: un portal a 100 m calle abajo no
 *   es tu vecino aunque esté en la otra acera. El radio de 150 m no distingue las
 *   dos cosas —la tanda 34 midió que **el 68,9 % de lo que dejaba pasar era
 *   desfase, no ancho**, y que bajar el radio no lo arreglaba: ni a 25 m—.
 *
 * ⛔ De dónde salen los 20: del dial medido en `docs/H1-LISTONES.md` §B3.
 *      ≤ 10 m → 6,6 % de desfase, pero solo 1.601 sugerencias
 *      ≤ 20 m → 28,3 % de desfase, con 2.982 de las 3.340 buenas conservadas
 *      ≤ 40 m → 45,6 %
 *   Antonio elige 20. ⚠️ Es una decisión sobre cuánto desfase se tolera a cambio
 *   de cuánta cobertura, no un percentil — igual que los 100 m de su acera.
 */
const ADELANTO_M = 20;

/** Portales de una paridad para hablar de «hilo». Heredado de la tanda 32. */
const MIN_HILO = 5;

/**
 * ⭐ Ángulo por debajo del cual un trío (n, n+1, n+2) va «calle adelante».
 *
 * Se mide el ángulo entre el vector n→n+1 y el vector n→n+2:
 *   · **par/impar**: n+1 está enfrente y n+2 calle adelante ⇒ ángulo grande.
 *   · **correlativa**: n+1 y n+2 van los dos calle adelante ⇒ ángulo ~0°.
 */
const ANG_CORRELATIVA = 45;

/**
 * ⚠️⚠️ CUÁNTOS TRÍOS Y QUÉ FRACCIÓN — y por qué tan alto.
 *
 * ⛔ La primera versión usaba la MEDIANA del ángulo con 5 tríos, calibrada contra
 *   cuatro casos conocidos: Polígono San Valero (0°) y Torres de San Lamberto
 *   (35°) dentro, Avenida Cataluña (167°) y Avenida Madrid (178°) fuera. **Pasó
 *   los cuatro** — y clasificó **Avenida Pablo Gargallo como correlativa** con 9
 *   tríos y mediana 13°, que es falso. Lo cazó el banco de las siete rutas.
 *
 * ⭐ Al mirar el reparto se ve por qué: **los ángulos son BIMODALES incluso en las
 *   avenidas normales**. Cataluña tiene 12 tríos por debajo de 20° y 16 por
 *   encima de 87°; Madrid, 14 y 30. La mediana de una bimodal no dice de qué lado
 *   está la vía: dice cuál de los dos montones es más gordo. ⇒ se pasa a la
 *   FRACCIÓN de tríos que van calle adelante, que es lo que se quería medir.
 *
 * ⚠️ Y el corte es alto **a propósito**, por la asimetría del daño:
 *   · declarar correlativa una vía que NO lo es → se repite el fallo original,
 *     sin cota (258 m en Avenida Cataluña).
 *   · declarar par/impar una vía correlativa → el error lo acota `RAZONABLE_M`,
 *     50 m, o se convierte en sugerencia.
 *   ⇒ ante la duda, **paridad**. Y la duda se declara: `no-verificable`.
 *
 * ⛔ EL LÍMITE, DICHO: con 0,90 el método caza **Polígono San Valero (0,98)** y
 *   **NO caza Urbanización Torres de San Lamberto (0,65)**, que es el otro caso
 *   conocido. Torres tiene la numeración mezclada de verdad —sus 51 tríos van de
 *   1° a 180°— y la geometría no la separa. **NO CONSTA**: no se fuerza.
 */
const MIN_TRIOS = 15;
const FRAC_CORRELATIVA = 0.90;

const dist = (a, b) => Math.hypot(a.m[0] - b.m[0], a.m[1] - b.m[1]);
const esPar = (n) => n % 2 === 0;
const acera = (n) => (esPar(n) ? 'pares' : 'impares');

/**
 * ⭐⭐ La FORMA de numeración de una vía, medida sobre su propia geometría.
 * @returns {'par-impar'|'correlativa'|'un-solo-lado'|'no-verificable'}
 */
function formaDeVia(lista) {
  const pares = lista.filter((o) => o.n != null && esPar(o.n));
  const impares = lista.filter((o) => o.n != null && !esPar(o.n));
  if (!pares.length || !impares.length) return { forma: 'un-solo-lado', angulo: null, trios: 0, pares: pares.length, impares: impares.length };

  // el ángulo entre (n→n+1) y (n→n+2), portal a portal
  const by = new Map();
  for (const o of lista) if (o.n != null && !by.has(o.n)) by.set(o.n, o);
  const angs = [];
  for (const [n, o] of by) {
    const a = by.get(n + 1), b = by.get(n + 2);
    if (!a || !b) continue;
    const v1 = [a.m[0] - o.m[0], a.m[1] - o.m[1]];
    const v2 = [b.m[0] - o.m[0], b.m[1] - o.m[1]];
    const L1 = Math.hypot(v1[0], v1[1]), L2 = Math.hypot(v2[0], v2[1]);
    if (L1 < 1 || L2 < 1) continue;                 // portales encimados: no dicen nada
    const c = (v1[0] * v2[0] + v1[1] * v2[1]) / (L1 * L2);
    angs.push(Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI);
  }
  const s = angs.slice().sort((a, b) => a - b);
  const frac = angs.length ? angs.filter((x) => x < ANG_CORRELATIVA).length / angs.length : null;
  const base = { trios: angs.length, pares: pares.length, impares: impares.length, frac,
    angulo: s.length ? s[Math.floor(s.length / 2)] : null };
  // ⚠️ sin tríos suficientes no se puede medir. Se declara —no se supone— y se
  //   aplica la paridad, que es el lado seguro de la asimetría de arriba.
  if (angs.length < MIN_TRIOS) return { forma: 'no-verificable', ...base };
  return { forma: frac >= FRAC_CORRELATIVA ? 'correlativa' : 'par-impar', ...base };
}

/** Analiza una vía entera. Se calcula una vez y se guarda. */
function analizar(lista) {
  const f = formaDeVia(lista);
  return { ...f, dosHilos: f.pares >= MIN_HILO && f.impares >= MIN_HILO,
    aplicaParidad: f.forma === 'par-impar' || f.forma === 'no-verificable' };
}

/**
 * El más cercano EN NÚMERO sobre toda la lista.
 * ⛔ Es lo que hacía —y sigue haciendo donde no manda la paridad— el
 *    geocodificador de siempre. Se deja idéntico a propósito: cualquier
 *    diferencia aquí movería respuestas que esta tanda NO debe tocar.
 */
function masCercanoEnNumero(lista, numero) {
  // ⚠️ TANDA 35 · los portales SIN número pedible (bloques, letras) traen `n: null`
  //   desde `construirIndice`. Antes esto hacía `(o.n || 0)`, o sea que un portal
  //   sin número competía como si fuera el nº0 — y ganaba en cuanto se pidiera un
  //   número bajo. Se saltan. ⛔ Y devuelve `null` si no queda ninguno: hay dos
  //   urbanizaciones enteras que son solo bloques.
  let mejor = null;
  for (const o of lista) {
    if (o.n == null) continue;
    if (!mejor || Math.abs(o.n - numero) < Math.abs(mejor.n - numero)) mejor = o;
  }
  return mejor;
}

/**
 * ⭐⭐ LA COTA DEL ERROR, en metros, sin interpolar.
 *
 * El número pedido no existe, así que **no tiene sitio**: lo único honesto es
 * decir dentro de qué tramo tendría que caer y cuánto mide ese tramo.
 *   · entre dos portales de su acera  → la cota es lo que miden esos dos
 *   · un solo paso fuera del extremo  → la cota es lo que mide el hueco de al lado
 *   · más de un paso fuera            → **no se puede acotar sin interpolar**, y
 *                                        hoy no se interpola (⛔ es otra tanda)
 */
function cota(numero, mismos) {
  if (!mismos.length) return null;
  let ant = null, sig = null;
  for (const o of mismos) {
    if (o.n < numero && (!ant || o.n > ant.n)) ant = o;
    if (o.n > numero && (!sig || o.n < sig.n)) sig = o;
  }
  if (ant && sig) {
    const cand = (numero - ant.n) <= (sig.n - numero) ? ant : sig;
    return { m: dist(ant, sig), acota: 'hueco', ant, sig, cand };
  }
  const extremo = ant || sig;
  const pasos = Math.abs(extremo.n - numero) / 2;
  if (pasos <= 1) {
    // el vecino de dentro, para saber cuánto mide un paso AQUÍ
    let vec = null;
    for (const o of mismos) {
      if (o.n === extremo.n) continue;
      if (ant ? o.n < extremo.n : o.n > extremo.n) {
        if (!vec || Math.abs(o.n - extremo.n) < Math.abs(vec.n - extremo.n)) vec = o;
      }
    }
    return { m: vec ? dist(extremo, vec) : Infinity, acota: 'un-paso', cand: extremo, vec, pasos };
  }
  return { m: Infinity, acota: 'fuera-del-tramo', cand: extremo, pasos };
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ TANDA 34 · ¿150 m ES ANCHO O ES DESFASE? — la comprobación que no se salta
// ═════════════════════════════════════════════════════════════════════════════
//   Un número de metros **no distingue dos cosas opuestas**:
//     · ANCHO   — el de enfrente está CRUZANDO la calle. Legítimo: es la misma
//                 altura de la vía y cruzar es poco camino.
//     · DESFASE — el de enfrente está CALLE ABAJO. Es el fallo de Avenida
//                 Cataluña otra vez, con 150 m en vez de 258.
//
//   ⇒ Se separan por GEOMETRÍA: se descompone el vector que va del portal propio
//     al de enfrente en sus dos componentes respecto al EJE DE LA VÍA.
//
// ⚠️⚠️ Y EL CRITERIO NO SE CALIBRA CONTRA CASOS CONOCIDOS. Es la ley de ayer
//   (nº132): *un listón calibrado contra N casos acierta en los N casos; eso no
//   es una comprobación, es la definición de calibrar.* ⇒ el corte es **45°**,
//   que es el punto medio geométrico entre «perpendicular» y «calle adelante»:
//   ancho si la componente TRANSVERSAL manda, desfase si manda la LONGITUDINAL.
//   ⛔ No se ha mirado ninguna avenida para elegirlo, y la sensibilidad a 30° y
//     60° va impresa en el informe para que se vea que no está pegado al borde.

/** Corte, en grados, entre «cruzando» y «calle adelante». 45° = punto medio. */
const ANGULO_ANCHO = 45;

/**
 * ⭐ EL EJE LOCAL DE LA VÍA, sin tocar el grafo.
 *
 * El hilo de una acera **va por la acera**, así que la dirección entre el portal
 * anterior y el siguiente de la MISMA paridad es la dirección de la calle ahí.
 * ⛔ No se usa el grafo a propósito: `direccion.resolver()` no lo tiene, y una
 *   regla que solo se pueda comprobar con el grafo cargado no se comprueba.
 * ⚠️ `medir-paridad.js` calcula ADEMÁS el eje desde la geometría de la arista y
 *   compara los dos: dos testigos independientes (ley 60). Si no concordaran,
 *   esta clasificación no valdría y habría que decirlo.
 *
 * @returns {[number,number]|null} unitario, o null si no hay con qué medirlo
 */
function ejeLocal(ref, mismos) {
  const orden = mismos.slice().sort((a, b) => a.n - b.n);
  const i = orden.findIndex((o) => o === ref);
  if (i < 0) return null;
  const a = orden[i - 1] || ref;
  const b = orden[i + 1] || ref;
  if (a === b) return null;                        // hilo de un solo portal
  const v = [b.m[0] - a.m[0], b.m[1] - a.m[1]];
  const L = Math.hypot(v[0], v[1]);
  if (L < 1) return null;                          // portales encimados: no dicen nada
  return [v[0] / L, v[1] / L];
}

/**
 * ⭐⭐ Descompone el vector `ref → otro` en LARGO (calle adelante) y ANCHO
 * (cruzando), con el ángulo respecto al eje.
 * @returns {{d, largo, ancho, grados, clase}} — clase ∈ 'ancho'|'desfase'|'NO CONSTA'
 */
function descomponer(ref, otro, eje) {
  const v = [otro.m[0] - ref.m[0], otro.m[1] - ref.m[1]];
  const d = Math.hypot(v[0], v[1]);
  if (!eje) return { d, largo: null, ancho: null, grados: null, clase: 'NO CONSTA' };
  const largo = Math.abs(v[0] * eje[0] + v[1] * eje[1]);
  const ancho = Math.abs(v[0] * eje[1] - v[1] * eje[0]);   // el perpendicular
  const grados = Math.atan2(ancho, largo) * 180 / Math.PI;
  return { d, largo, ancho, grados, clase: grados >= ANGULO_ANCHO ? 'ancho' : 'desfase' };
}

/**
 * ⭐⭐⭐ EL ÚNICO SITIO DONDE NACE UNA SUGERENCIA — y por qué existe esta función.
 *
 * ⛔⛔ `enfrente` NO se pasa por parámetro: **se deduce de la paridad pedida**, y
 *   se escribe DESPUÉS del `...extra`, así que quien llame no puede pisarla ni
 *   olvidarla. Una sugerencia sin marca deja de ser representable.
 *
 * ⚠️ Existe porque la marca ya se perdió dos veces en dos días: el nº134 se comió
 *   `motivo` y el nº137 se comió `enfrente`, **con la ley del nº134 ya escrita y
 *   describiendo exactamente eso**. ⇒ *una ley escrita no protege; protege el
 *   mecanismo* (ley 37). Esto es el mecanismo.
 */
function sugerencia(portal, pedido, extra = {}) {
  return { ...extra, portal, n: portal.n, acera: acera(portal.n),
    enfrente: esPar(portal.n) !== esPar(pedido) };
}

/**
 * ⭐⭐ LOS CANDIDATOS DE LA ACERA DE ENFRENTE.
 *
 * ⛔ Candidato **por número**, aceptado **por metros**: el número es lo que hace
 *   que ese portal tenga algo que ver con lo que se ha pedido; la distancia es lo
 *   único que dice si además está donde parece. Ofrecer un impar cualquiera que
 *   caiga a menos de 150 m sería ofrecer otra dirección distinta.
 * ⚠️ Se miran los DOS que rodean al número pedido —el anterior y el siguiente de
 *   la otra paridad—, no solo el más cercano: en un hueco grande el de detrás
 *   puede estar lejos y el de delante al lado.
 */
function deEnfrente(numero, lista, ref, radio = ENFRENTE_M, adelanto = ADELANTO_M) {
  if (!ref) return [];
  const otros = lista.filter((o) => o.n != null && esPar(o.n) !== esPar(numero));
  if (!otros.length) return [];
  let ant = null, sig = null;
  for (const o of otros) {
    if (o.n <= numero && (!ant || o.n > ant.n)) ant = o;
    if (o.n >= numero && (!sig || o.n < sig.n)) sig = o;
  }
  const eje = ejeLocal(ref, lista.filter((o) => o.n != null && esPar(o.n) === esPar(numero)));
  const out = [];
  for (const o of [ant, sig]) {
    if (!o || out.some((x) => x.portal === o)) continue;
    const g = descomponer(ref, o, eje);
    if (g.d > radio) continue;
    // ⭐⭐⭐ TANDA 35 · EL TOPE DE ADELANTO. Cruzar te mueve de LADO.
    // ⛔ Sin eje no se puede saber cuánto adelanta ⇒ **no se ofrece**. Antes esto
    //   pasaba porque `clase` quedaba en 'NO CONSTA' y el portal salía igual: un
    //   `NO CONSTA` que se ofrece es un sí disfrazado.
    if (g.largo == null || g.largo > adelanto) continue;
    out.push(sugerencia(o, numero, { metros: Math.round(g.d),
      largo: g.largo, ancho: g.ancho, grados: g.grados, clase: g.clase,
      motivo: 'la acera de ENFRENTE: hay que cruzar' }));
  }
  // ⭐ el más cerca primero, que es lo que va a ver quien pulse el botón
  return out.sort((a, b) => a.metros - b.metros);
}

/**
 * ⭐⭐⭐ LA REGLA. Decide qué contestar a un número que NO existe en la vía.
 *
 * @param {number} numero  el pedido
 * @param {Array}  lista   los portales de la vía (ordenados por número)
 * @param {Object} an      lo que devuelve `analizar(lista)`
 * @returns {{modo, portal, sugerencias, cota, aviso}}
 *   modo ∈ 'misma-acera'        · hay respuesta y es de su acera
 *          'sin-numero-cerca'   · NO SE TIENE. Solo sugerencia.
 *          'sin-paridad'        · la paridad no manda aquí (correlativa/un lado)
 *          'como-siempre'       · la respuesta de hoy ya era de su acera
 */
function decidir(numero, lista, an) {
  const hoy = masCercanoEnNumero(lista, numero);
  // ⚠️ TANDA 35 · una vía sin ni un portal numerado (dos urbanizaciones enteras son
  //   solo bloques). `direccion.resolver()` lo caza antes, pero esto se llama desde
  //   los medidores y no puede reventar aquí.
  if (!hoy) {
    return { modo: 'sin-numeros', portal: null, sugerencias: [], cota: null,
      aviso: 'esta vía no va por números de portal: sus accesos son bloques o letras' };
  }
  // ⛔ EL CANDADO: si la respuesta de siempre ya es de la acera pedida, no se toca.
  if (hoy && hoy.n != null && esPar(hoy.n) === esPar(numero)) {
    return { modo: 'como-siempre', portal: hoy, sugerencias: [], cota: null,
      aviso: `el ${numero} no existe · te dejo en el ${hoy.n}, el más cercano de su misma acera` };
  }
  const mismos = lista.filter((o) => o.n != null && esPar(o.n) === esPar(numero));

  if (!mismos.length) {
    return { modo: 'sin-paridad', portal: hoy, sugerencias: [], cota: null, motivo: 'un-solo-lado',
      aviso: `esta vía solo tiene números ${acera(hoy.n)} · el ${numero} no existe y te dejo en el ${hoy.n}` };
  }
  if (!an.aplicaParidad) {
    // ⚠️ el texto sale de la FORMA medida, no de una sola redacción: `un-solo-lado`
    //   solo llega aquí por caminos raros —lo normal es que lo coja el candado de
    //   arriba—, y si llegara diría algo falso.
    const porque = an.forma === 'correlativa'
      ? 'en esta vía los números van seguidos, no por aceras'
      : `en esta vía los ${acera(hoy.n)} y los ${acera(numero)} no van por aceras separadas`;
    return { modo: 'sin-paridad', portal: hoy, sugerencias: [], cota: null, motivo: an.forma,
      aviso: `${porque} · el ${numero} no existe y te dejo en el ${hoy.n}` };
  }

  const c = cota(numero, mismos);
  if (c && c.m <= RAZONABLE_M) {
    return { modo: 'misma-acera', portal: c.cand, sugerencias: [], cota: c,
      aviso: `el ${numero} no existe · te dejo en el ${c.cand.n}, en su acera, la de los ${acera(numero)}`
        + ` · el ${numero} caería como mucho a ${Math.round(c.m)} m` };
  }

  // ⛔ NO SE TIENE. Se sugiere.
  // ⭐⭐ TANDA 34 · Y LA ACERA DE ENFRENTE VUELVE, PERO MEDIDA. Hasta ayer no se
  //   ofrecía nunca, porque *«se parece en número y no está donde parece»*. Ahora
  //   se ofrece **solo si está a menos de `ENFRENTE_M` de verdad**, y va marcada.
  // ⛔⛔ EL ORDEN NO COMPITE POR DISTANCIA: primero TODAS las de su acera, y solo
  //   después la de enfrente — **aunque la de enfrente esté más cerca en metros**.
  //   Cruzar cuesta un semáforo y un rodeo hasta el paso, y eso no está en la
  //   línea recta entre dos portales.
  // ⭐ A3 · lo que el botón necesita: el número, DE QUÉ ACERA, y a qué distancia.
  // ⚠️ La distancia es ENTRE LAS DOS SUGERENCIAS, y se dice: el número pedido no
  //   tiene sitio, así que no hay ninguna distancia «hasta él» que medir. Lo que
  //   sí se puede medir es el tamaño del hueco en el que caería.
  // ⛔ Cuando solo hay una sugerencia —el número queda fuera del tramo numerado—
  //   no hay hueco y `metros` viene a **null**. NO CONSTA, no un cero.
  const sug = [];
  if (c) {
    // ⛔ TODAS pasan por `sugerencia()`, también las propias: si la de su acera se
    //   montara a mano, el día que alguien copie esa línea para otra cosa la marca
    //   volvería a faltar. El mecanismo solo protege si no tiene puerta de atrás.
    for (const o of [c.ant, c.sig, c.cand].filter(Boolean)) {
      if (!sug.some((x) => x.portal === o)) sug.push(sugerencia(o, numero));
    }
    for (const s of sug) {
      const otro = sug.find((x) => x !== s);
      s.metros = otro ? Math.round(dist(s.portal, otro.portal)) : null;
      s.motivo = otro ? 'un extremo del hueco' : 'fuera del tramo numerado: no hay hueco que medir';
    }
  }
  const enfrente = c ? deEnfrente(numero, lista, c.cand) : [];
  for (const e of enfrente) sug.push(e);           // ⛔ SIEMPRE detrás. Ver arriba.

  let aviso;
  if (c && c.acota === 'hueco') {
    aviso = `el ${numero} no existe · en su acera, la de los ${acera(numero)}, los más cercanos son`
      + ` el ${c.ant.n} y el ${c.sig.n}, y entre ellos hay ${Math.round(c.m)} m`;
  } else {
    const arranca = c.cand.n > numero ? 'empiezan en el' : 'acaban en el';
    aviso = `el ${numero} no existe · en esta vía los ${acera(numero)} ${arranca} ${c.cand.n}`
      + `, ${c.pasos} números más ${c.cand.n > numero ? 'adelante' : 'atrás'}`;
  }
  if (enfrente.length) {
    aviso += ` · enfrente tienes el ${enfrente.map((e) => e.n).join(' y el ')}`
      + ` a ${enfrente.map((e) => e.metros).join(' y ')} m, cruzando`;
  }
  return { modo: 'sin-numero-cerca', portal: null, sugerencias: sug, cota: c, aviso };
}

module.exports = { RAZONABLE_M, ENFRENTE_M, ADELANTO_M, MIN_HILO, ANG_CORRELATIVA,
  MIN_TRIOS, FRAC_CORRELATIVA, ANGULO_ANCHO,
  formaDeVia, analizar, masCercanoEnNumero, cota, decidir, acera, esPar, dist,
  ejeLocal, descomponer, deEnfrente, sugerencia };
