// ⭐⭐ EL RELATO DE UNA RUTA — la ÚNICA forma de contar un tramo en este proyecto.
//
// ⛔⛔ FUENTE ÚNICA. Lo usan `ruta.js` (terminal), `rutas-antonio.js` (las siete) y
//     el exportador del visor. **Si cada uno redactara lo suyo, divergirían** — y
//     este proyecto ya tiene dos casos de eso: las bandas copiadas (nº74) y los dos
//     motores de ruta (nº68). El texto que se lee en la terminal y el que sale al
//     pinchar un tramo en el mapa **son literalmente la misma cadena**.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ LA REGLA QUE GOBIERNA TODA LA REDACCIÓN
// ═════════════════════════════════════════════════════════════════════════════
//   **EL MOTOR SABE MENOS DE LO QUE UN TEXTO BONITO SUGIERE.**
//
//   ⛔ NO sabe si giras a izquierda o derecha. NO sabe cuántos semáforos hay. NO
//      sabe si la calle sube o baja. NO sabe si hay obras. Si el texto dijera
//      «gira a la derecha», estaría INVENTANDO — y un motor que inventa una vez
//      no se distingue de uno que inventa siempre.
//
//   ⇒ Cada frase dice SOLO lo que el grafo sabe: **por qué calle va, cuántos
//     metros, qué tipo de vía es, la precisión con la que lo sabe (D4), y si es
//     un paso condicional (con el nombre del sitio, si el dato lo trae).**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ LA ACERA: `NO CONSTA`, Y NO POR FALTA DE MÉTODO
// ═════════════════════════════════════════════════════════════════════════════
//   El encargo pedía decir «acera de los impares» cuando el lado esté
//   determinado. **Ese campo no existe en el dato.** Medido sobre el crudo:
//
//       ways con footway=sidewalk                              9.634
//       de ellos, con algo que diga el LADO                        0
//         (`sidewalk:side`, `side`, `is_sidepath:of:name`)
//       ⭐ POSITIVO DE CONTROL, con el MISMO buscador:
//          con `surface`  7.759      con `name`  3.179
//
//   ⇒ El buscador funciona; simplemente **el lado no está mapeado en Zaragoza**.
//     `precision: 'acera'` significa *«esta arista ES una acera»*, no *«es la
//     acera de los pares»*. ⛔ Decir un lado sería inventarlo, y decir la acera
//     equivocada es peor que no decirla. **Se calla, y se dice que se calla.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ EL TIEMPO ES UNA MAGNITUD DERIVADA (ley 45)
// ═════════════════════════════════════════════════════════════════════════════
//   Sale de dividir los metros por **~6 km/h**, que es la velocidad a la que anda
//   Antonio. ⛔ Y esa constante **cuelga de UN solo trayecto**: los ~25 min
//   declarados de la ruta nº7 sobre 2,4–2,6 km medidos (`RUTAS-CONOCIDAS.md` §v2).
//   Si esos 25 minutos fueran 22, todos los tiempos se mueven un 14 %.
//   ⇒ **No es un dato del motor: es una estimación, y va dicho en la cabecera.**

'use strict';
const { aGrados } = require('./geo');
const P = require('./portales');
const NL = require('./nombre-largo');
const PL = require('./planarizar');

const VELOCIDAD_KMH = 6;

/** Minutos estimados. ⚠️ derivada: arrastra el error de la constante. */
function minutos(metros) {
  return metros / (VELOCIDAD_KMH * 1000 / 60);
}

// ── cómo se llama en castellano cada valor de D4 ────────────────────────────
// ⛔ Es una traducción, no una interpretación: cada entrada dice lo mismo que la
//    etiqueta, en palabras que se entiendan sin haber leído el diseño.
const TIPO = {
  'acera': 'acera',
  'paso-de-peatones': 'paso de peatones',
  'peatonal': 'calle peatonal',
  'escaleras': 'escaleras',
  'eje-con-acera-declarada': 'calzada con acera declarada',
  'eje-de-calzada': 'eje de calzada',
};

/** El aviso de precisión, cuando solo se sabe el eje de la calzada. */
function avisoPrecision(p) {
  if (p === 'eje-de-calzada') {
    return 'de este tramo solo tengo el eje de la calzada, no la acera: los metros pueden bailar';
  }
  if (p === 'eje-con-acera-declarada') {
    return 'aquí hay acera declarada, pero no está dibujada: voy por el eje de la calzada';
  }
  return null;
}

/**
 * El aviso de un paso condicional, con el nombre del sitio si el dato lo trae.
 * ⛔ Si no hay nombre, se dice «un edificio». NO se inventa cuál.
 */
function avisoCondicional(p) {
  const sitio = p.condEdificio || null;
  const donde = sitio ? 'el interior de «' + sitio + '»' : 'el interior de un edificio';
  let t = 'este tramo cruza ' + donde + ', y puede estar cerrado a ciertas horas';
  if (p.condHorario) t += ' — el mapa dice ' + p.condHorario;
  else t += ' — no sé su horario';
  if (p.condVia === 'highway=elevator') t = 'este tramo usa un ascensor' + (sitio ? ' de «' + sitio + '»' : '') + ', y puede no estar en servicio';
  return t;
}

/**
 * Un tramo, tal como se cuenta. Devuelve DATOS, y el texto sale de ellos:
 * así el mapa y la terminal no pueden divergir aunque quieran.
 */
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ TANDA 19 · EL MODELO ENTRA POR AQUÍ, Y ENTRA **OPT-IN**
// ═════════════════════════════════════════════════════════════════════════════
//   `modelo` es una función `(wayId) -> {via, plataforma, ciclista} | null`.
//   ⛔ SIN ELLA, ESTE FICHERO SE COMPORTA BYTE A BYTE COMO ANTES. Eso no es una
//     promesa: `rutas-antonio.js` sin `--modelo` produce una salida que se
//     compara con la capturada antes de tocar nada (`src/modelo-rutas.js` D1).
//
//   ⭐ Y SOLO ACTÚA DONDE HOY DICE «un tramo sin nombre». Si OSM tiene nombre, no
//     se toca ni una letra — que es lo que mantiene idénticas las rutas 1 a 5.
//
//   ⚠️ QUÉ SE CUENTA Y QUÉ NO (corrección de Antonio):
//     · **Qué ES la línea, siempre**: «por la acera de X», «por la zona peatonal
//       de X». Eso sale de la PLATAFORMA, no de qué fichero trajo el nombre.
//       ⚠️ En la tanda 19 este ejemplo decía «por el carril bici de X». **Estaba
//       mal y lo corrigió Antonio**: ver el bloque de la tanda 20, más abajo.
//     · `osm` y `municipal-bici` se cuentan IGUAL: los dos son declarados, y al
//       usuario no le importa de qué capa salió.
//     · ⭐ Solo lo DEDUCIDO llevaría marca — y hoy no hay nada deducido: el método
//       de portales de la tanda 17 sigue sin aplicarse.
//   ⇒ La procedencia exacta se guarda en el dato, para nosotros. No se imprime.
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ TANDA 20 · EL TEXTO DE UNA RUTA **A PIE** CUENTA EL PAPEL **A PIE**
// ═════════════════════════════════════════════════════════════════════════════
//   Corrección de Antonio, y es un fallo de producto: *«si vamos andando NO
//   PODEMOS IR POR UN CARRIL BICI. Tendrás que decir POR ACERA.»*
//
//   La tanda 19 imprimía «Por el carril bici de Avenida de San Juan de la Peña»
//   **en una ruta a pie**. Eso es contarle al peatón el papel del modo
//   equivocado — exactamente lo contrario de lo que el modelo vino a arreglar.
//   ⇒ El sustantivo sale de la PLATAFORMA, y `carril-bici` NO tiene entrada aquí:
//     lo resuelve `comoSeAnda()`, que mira lo que el Ayuntamiento DECLARA.
const SUSTANTIVO = {
  'acera': 'la acera de',
  'plataforma-peatonal': 'la zona peatonal de',
  'camino': 'el camino de',
  'pista': 'la pista de',
  'vial-de-servicio': 'el vial de servicio de',
  // ⛔ 'carril-bici' NO ESTÁ, y no está a propósito.
};

/**
 * ⭐⭐ Qué es esta línea PARA QUIEN ANDA. Devuelve `{sustantivo, bici}`.
 *
 * ⛔ NO INVENTA. El sustantivo sale de la PLATAFORMA (OSM) y, donde el
 *    Ayuntamiento DECLARA que el carril va sobre la acera, de eso.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * ⛔⛔ TANDA 21 · D · FUERA LA CLASIFICACIÓN DEL CARRIL
 * ═════════════════════════════════════════════════════════════════════════════
 *   > *«Lo de las advertencias de carril bici en acera y todo eso me sobra.»*
 *
 *   La tanda 20 imprimía *«el Ayuntamiento sitúa este carril bici EN LA CALZADA»*.
 *   **A quien va andando le da igual cómo clasifique el Ayuntamiento el carril**:
 *   es un detalle administrativo que nos sirvió a NOSOTROS para entender el dato.
 *   ⭐ Es el mismo error de la tanda anterior con otra piel: contarle al peatón
 *     algo que es del otro modo.
 *   ⇒ **Los dos avisos de clasificación se van.** ⛔ El dato SE QUEDA en el modelo
 *     (`forma.ciclista`): lo necesita la bici en H2. Solo deja de contarse.
 *
 *   ⭐ Y lo que SÍ se queda es el aviso de que **por ahí pasan bicis** (§E): eso no
 *     es clasificación administrativa, es que conviene ir atento. Va con su
 *     medida al lado: si saliera en la mitad de los pasos dejaría de significar
 *     nada, y eso se cuenta en el informe.
 */
const AVISO_BICIS = 'por aquí pasan bicis: conviene ir atento';

function comoSeAnda(forma) {
  if (!forma) return { sustantivo: null, bici: false };
  const plat = forma.plataforma, cic = forma.ciclista || null;
  // 1 · la línea ES una plataforma de andar
  if (SUSTANTIVO[plat]) {
    return { sustantivo: SUSTANTIVO[plat],
      bici: cic === 'carril-sobre-acera' || cic === 'senda-ciclable' };
  }
  // 2 · la línea ES el carril bici. ⛔ Andando no se va «por el carril bici».
  if (plat === 'carril-bici') {
    // ⭐ el municipal DECLARA que va sobre la acera: decirlo no es deducir.
    if (cic === 'carril-sobre-acera') return { sustantivo: 'la acera de', bici: true };
    // ⛔ en calzada, senda o sin dato: NO CONSTA por dónde va la acera. Se dice la
    //    calle a secas. El `◦` de D4 ya avisa de que solo se tiene el eje.
    return { sustantivo: null, bici: true };
  }
  return { sustantivo: null, bici: false };
}

// ── el nombre DEDUCIDO se dice de otra manera (tanda 21 · A2/D3) ─────────────
// ⭐ El lector tiene derecho a saber que ese nombre no lo declara nadie: lo
//    deducimos de los portales que dan a esa línea, con un 89,7 % de acierto
//    medido. ⛔ Callarlo sería vender una deducción como un dato.
const SUSTANTIVO_DEDUCIDO = {
  'la acera de': 'una acera que parece de',
  'la zona peatonal de': 'una zona peatonal que parece de',
  'el camino de': 'un camino que parece de',
  'la pista de': 'una pista que parece de',
  'el vial de servicio de': 'un vial de servicio que parece de',
};
const AVISO_DEDUCIDO = 'el nombre no lo dice el mapa: lo deduzco de los portales que dan a esta línea';

// ⭐⭐ TANDA 25 · Y AHORA HAY DOS TESTIGOS, ASÍ QUE EL AVISO DICE CUÁL HABLÓ.
//   ⛔ Decir «lo deduzco de los portales» cuando el nombre sale de la calle que va
//     pegada sería contar una procedencia falsa — y la procedencia es justo lo que
//     este aviso existe para contar.
const AVISO_POR = {
  'portales': AVISO_DEDUCIDO,
  'portales+pegada': 'el nombre no lo dice el mapa: lo deducen a la vez los portales de esta línea y la calle que va pegada a ella',
  'pegada': 'el nombre no lo dice el mapa: lo deduzco de la calle con nombre que va pegada a esta línea',
};
const avisoDeducido = (via) => AVISO_POR[(via && via.testigos) || 'portales'] || AVISO_DEDUCIDO;
const esAvisoDeducido = (t) => Object.values(AVISO_POR).includes(t);

/** La frase de un paso, a partir de lo que se sabe de él. */
function fraseDe(t) {
  if (t.precision === 'paso-de-peatones') return 'Cruzas por un paso de peatones';
  if (t.precision === 'escaleras') return 'Subes o bajas unas escaleras';
  if (!t.nombre) return 'Por un tramo sin nombre' + (t.tipoUnico ? ' (' + t.tipo + ')' : '');
  const sus = t.deducida ? (SUSTANTIVO_DEDUCIDO[t.sustantivo] || null) : t.sustantivo;
  if (sus) return 'Por ' + sus + ' ' + t.nombre;
  if (t.deducida) return 'Por lo que parece ' + t.nombre;
  return 'Por ' + t.nombre + (t.tipoUnico ? ' (' + t.tipo + ')' : '');
}

function tramo(p, nombreDeWay, n, modelo) {
  let nombre = nombreDeWay ? nombreDeWay(p.way) : null;
  const tipo = TIPO[p.precision] || p.precision;
  // ⭐⭐ TANDA 26 · «sin nombre» y «no tiene nombre» no son lo mismo, y el que
  //   pregunta —el mapa— necesita distinguirlo.
  //   ⚠️ TANDA 27 · ya NO se deduce de la precisión aquí: la isleta es `peatonal`
  //      y aun así no tiene nombre, así que la condición mira las ETIQUETAS. Se
  //      decide UNA vez, en `planarizar.js`, y viaja como campo de la arista —
  //      igual que la precisión. ⛔ Aquí no se recalcula: se lee.
  const noAplica = !!p.nombreNoAplica;
  // ⭐ el modelo solo habla donde OSM se calla
  let deModelo = null;
  if (!nombre && modelo) {
    const m = modelo(p.way);
    if (m && m.via && m.via.nombre) { deModelo = m; nombre = m.via.nombre; }
  }
  const via = deModelo ? deModelo.via : (nombre ? { nombre, fuente: 'osm', declarada: true } : null);
  const deducida = !!(via && via.declarada === false);
  const anda = deModelo ? comoSeAnda(deModelo.forma) : { sustantivo: null, bici: false };
  const avisos = [];
  if (anda.bici) avisos.push(AVISO_BICIS);
  if (deducida) avisos.push(avisoDeducido(via));
  const ap = avisoPrecision(p.precision);
  if (ap) avisos.push(ap);
  if (p.condicional) avisos.push(avisoCondicional(p));
  if (p.unidoPorDefecto) avisos.push('este empalme se unió por defecto: nada decía que no se pudiera pasar, pero tampoco que sí (D2)');
  return { n, nombre, nucleo: P.nucleo(nombre), tipo, metros: p.metros, precision: p.precision,
    noAplica, sustantivo: anda.sustantivo, bici: anda.bici, deducida,
    condicional: !!p.condicional, unidoPorDefecto: !!p.unidoPorDefecto, avisos,
    way: p.way, highway: p.highway,
    frase: fraseDe({ precision: p.precision, nombre, sustantivo: anda.sustantivo,
      deducida, tipo, tipoUnico: true }),
    via, forma: deModelo ? deModelo.forma : null };
}

/**
 * ⭐⭐ EL TRAMO DE UNA ARISTA DEL GRAFO — el ÚNICO sitio donde una arista se
 * proyecta a un paso.
 *
 * ⛔ Hasta la tanda 27 cada llamador armaba el `{way, precision, metros}` a mano,
 *   en cuatro ficheros distintos. El día que `tramo()` necesitó un campo más
 *   —`nombreNoAplica`—, esos cuatro objetos se quedaron incompletos **y nadie
 *   habría fallado**: la isleta simplemente se habría pintado azul. Es la forma
 *   exacta del fallo nº107, que costó dos tandas.
 * ⇒ Se proyecta AQUÍ, y quien quiera el tramo de una arista llama a esto.
 */
const tramoDeArista = (e, nombreDeWay, modelo) => tramo(
  { way: e.way, precision: e.precision, metros: e.largo, nombreNoAplica: e.nombreNoAplica },
  nombreDeWay, 0, modelo);

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ TANDA 21 · C · EL ITINERARIO SE AGRUPA POR **VÍA**
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Si estoy en Avenida de la Academia o en Avenida San Juan de la Peña, ¿por
//   >  qué lo repites 300 veces? Se pone una con todos los metros y punto. Si se
//   >  hace un cruce como es con Calle Juslibol para pasar de acera, estás en San
//   >  Juan de la Peña igual, así que eso me sobra.»* — Antonio
//
//   **Tiene razón y era un fallo de producto.** Hasta la tanda 20 se agrupaba por
//   *nombre + precisión + avisos*, así que **un cambio de aviso partía la avenida
//   en tres**. ⇒ ahí se coló un criterio NUESTRO —la clasificación municipal del
//   carril— en una decisión que es del que anda.
//
//   ⭐ SE AGRUPA POR VÍA, y «la misma vía» lo decide `nombre-largo.js` (§B): por
//     eso «Avenida de San Juan de la Peña» (OSM) y «AVENIDA SAN JUAN DE LA PEÑA»
//     (deducida) son **un solo paso**, y «Calle Oliván Bayle» y «CALLE FRANCISCO
//     OLIVÁN BAYLE» también.
//
//   ⚠️ QUÉ **NO** SE FUNDE, y va dicho porque agrupar es borrar:
//     · un **paso de peatones** y unas **escaleras** son EVENTOS, no vías: van
//       aparte siempre. Fundirlos con la calle borraría lo único que el motor sabe
//       de ese punto.
//     · un tramo **condicional** —el que cruza el interior de un edificio y puede
//       estar cerrado— va aparte aunque sea de la misma vía. Puede estar cerrado,
//       y eso no es un matiz.
//
//   ⭐ Y NADA SE PIERDE: cada paso lleva dentro sus avisos CON SUS METROS, los ways
//     que fundió, las precisiones que mezcla y **lo que se tragó** (`comido`).
//
// ── el umbral de «corto», y de qué medición sale ─────────────────────────────
// ⚠️ C2 pide absorber los cruces cortos que interrumpen la misma calle. Eso
//    necesita un tamaño, y **el tamaño no me lo invento**: es el **p99 de la
//    longitud de una arista `paso-de-peatones` en Zaragoza**, medido sobre las
//    10.494 que hay en el grafo:
//
//        p50  3,9 m   ·   p75  5,5 m   ·   p90  7,4 m   ·   p95  9,0 m
//        ⭐ p99 13,3 m   ·   máx 51,5 m
//
//    O sea: **lo que mide cruzar una calle en esta ciudad.** ⚠️ La MAGNITUD sale
//    del dato; **la elección del percentil es MÍA** y va declarada. El informe
//    publica la curva de sensibilidad (cuántos pasos salen a 7,4 · 9,0 · 13,3 ·
//    20 · 30 · 50 m) para que se vea de qué depende.
const CORTO_M = 13.3;

/** La clave de agrupación. Los eventos y los condicionales van solos. */
function claveDe(t) {
  if (t.precision === 'paso-de-peatones') return '@paso';
  if (t.precision === 'escaleras') return '@escaleras';
  if (t.condicional) return '@cond:' + (t.nombre || '') + ':' + (t.way || '');
  return t.nucleo || '@sin-nombre';
}

const esEvento = (k) => k === '@paso' || k === '@escaleras' || k.startsWith('@cond:');

/** ¿Son el mismo paso? Misma clase, y la misma vía según §B. */
function mismoPaso(a, b) {
  if (esEvento(a.clave) || esEvento(b.clave)) return a.clave === b.clave;
  if (a.clave === '@sin-nombre' || b.clave === '@sin-nombre') {
    // ⚠️ dos sin nombre seguidos se funden solo si además comparten precisión: lo
    //    único que se puede decir de ellos es QUÉ SON.
    return a.clave === b.clave && a.precision === b.precision;
  }
  return NL.mismaVia(a.clave, b.clave);
}

/** Paso nuevo a partir de un tramo suelto. */
function nuevoPaso(t, i) {
  return { clave: claveDe(t), metros: t.metros, ways: 1, pasos: [i],
    precision: t.precision, precisiones: new Map([[t.precision, t.metros]]),
    condicional: t.condicional, unidoPorDefecto: t.unidoPorDefecto,
    avisos: t.avisos.map((a) => ({ texto: a, metros: t.metros, veces: 1 })),
    candidatos: [{ via: t.via, nombre: t.nombre, sustantivo: t.sustantivo,
      deducida: t.deducida, metros: t.metros }],
    comido: [], bici: t.bici, highway: t.highway, way: t.way };
}

/** Mete un tramo suelto dentro del paso `u`. ⛔ Nada se pierde: todo se acumula. */
function meter(u, t, i) {
  u.metros = Math.round((u.metros + t.metros) * 10) / 10;
  u.ways++;
  u.pasos.push(i);
  u.precisiones.set(t.precision, (u.precisiones.get(t.precision) || 0) + t.metros);
  u.unidoPorDefecto = u.unidoPorDefecto || t.unidoPorDefecto;
  u.bici = u.bici || t.bici;
  for (const a of t.avisos) {
    const y = u.avisos.find((x) => x.texto === a);
    if (y) { y.metros = Math.round((y.metros + t.metros) * 10) / 10; y.veces++; }
    else u.avisos.push({ texto: a, metros: t.metros, veces: 1 });
  }
  u.candidatos.push({ via: t.via, nombre: t.nombre, sustantivo: t.sustantivo,
    deducida: t.deducida, metros: t.metros });
}

/** Absorbe un paso entero dentro de `u`. `comido` = es una interrupción (C2/C3). */
function tragar(u, v, comido) {
  u.metros = Math.round((u.metros + v.metros) * 10) / 10;
  u.ways += v.ways;
  u.pasos.push(...v.pasos);
  for (const [k, m] of v.precisiones) u.precisiones.set(k, (u.precisiones.get(k) || 0) + m);
  u.unidoPorDefecto = u.unidoPorDefecto || v.unidoPorDefecto;
  u.bici = u.bici || v.bici;
  for (const a of v.avisos) {
    const y = u.avisos.find((x) => x.texto === a.texto);
    if (y) { y.metros = Math.round((y.metros + a.metros) * 10) / 10; y.veces += a.veces; }
    else u.avisos.push({ ...a });
  }
  u.comido.push(...v.comido);
  if (comido) {
    for (const c of v.candidatos) {
      u.comido.push({ nombre: c.nombre, metros: c.metros, precision: v.precision });
    }
  } else u.candidatos.push(...v.candidatos);
}

/**
 * ⭐ EL NOMBRE QUE SE IMPRIME de un paso que fundió varias fuentes.
 * ⛔ D0 manda: si alguna parte tiene nombre DECLARADO por OSM, ése se dice —y de
 *    paso el texto sale con mayúsculas y minúsculas **sin que nadie las invente**,
 *    porque se elige entre dos cadenas reales—. Luego el declarado por el
 *    Ayuntamiento. Y solo si TODO es deducido, se dice que lo es.
 */
function nombreDelPaso(u) {
  const conNombre = u.candidatos.filter((c) => c.nombre);
  if (!conNombre.length) return { nombre: null, deducida: false, sustantivo: null };
  // ⚠️ `calle-pegada` va la ÚLTIMA: es la fuente que no tiene ningún portal
  //    detrás, la de menor acierto medido de las que se aplican (91,7 %).
  for (const f of ['osm', 'municipal-bici', 'portales', 'calle-pegada']) {
    const l = conNombre.filter((c) => c.via && c.via.fuente === f);
    if (!l.length) continue;
    l.sort((a, b) => b.metros - a.metros);
    return { nombre: l[0].nombre, deducida: f === 'portales' || f === 'calle-pegada',
      sustantivo: l[0].sustantivo, fuente: f, via: l[0].via };
  }
  const l = conNombre.slice().sort((a, b) => b.metros - a.metros);
  return { nombre: l[0].nombre, deducida: !!l[0].deducida, sustantivo: l[0].sustantivo,
    via: l[0].via };
}

/**
 * Los pasos de una ruta ya calculada. ⭐ Agrupados por VÍA (§C).
 * @param {Object|number} [op] `{corto, viejo}` — o un número, que es `corto`.
 *   · `corto`: umbral de «interrupción corta» en metros (curva de sensibilidad).
 *   · `viejo`: ⭐ **LA LÍNEA BASE.** Reproduce la agrupación de la tanda 20 —fundir
 *     solo lo idéntico en nombre, precisión y avisos— para poder comparar contra
 *     ella sin fiarse de un fichero viejo. ⛔ No se usa para imprimir nada.
 */
function tramos(ruta, nombreDeWay, modelo, op) {
  const o = (op === undefined || op === null) ? {} : (typeof op === 'number' ? { corto: op } : op);
  const lim = o.corto === undefined ? CORTO_M : o.corto;
  const sueltos = ruta.pasos.map((p) => tramo(p, nombreDeWay, 0, modelo));

  // ── LÍNEA BASE · la agrupación de la tanda 20, para poder comparar ────────
  if (o.viejo) {
    const out = [];
    for (const t of sueltos) {
      const u = out[out.length - 1];
      const mismo = u && u.nombre === t.nombre && u.precision === t.precision
        && u.condicional === t.condicional && u.unidoPorDefecto === t.unidoPorDefecto
        && u.avisos.join('|') === t.avisos.join('|');
      if (mismo) { u.metros = Math.round((u.metros + t.metros) * 10) / 10; u.ways++; }
      else out.push({ ...t, ways: 1, tipos: [{ tipo: t.precision, metros: t.metros }] });
    }
    out.forEach((t, i) => { t.n = i + 1; });
    return out;
  }

  // ── 1 · fusión consecutiva POR VÍA ────────────────────────────────────────
  const uno = [];
  sueltos.forEach((t, i) => {
    const u = uno[uno.length - 1];
    if (u && mismoPaso(u, { clave: claveDe(t), precision: t.precision })) meter(u, t, i);
    else uno.push(nuevoPaso(t, i));
  });

  // ── 2 · absorber las interrupciones CORTAS entre dos trozos de la misma vía ─
  //
  //   ⭐⭐ SE ABSORBE UNA **RACHA**, no una sola pieza. Cruzar un cruce de verdad son
  //     varios trocitos seguidos —paso de peatones, isleta sin nombre, otro paso—, y
  //     absorber solo uno deja la avenida partida en cinco igual. Medido sobre la
  //     ruta nº3: «Gómez Laguna 26 m · paso 3 m · sin nombre 14 m · paso 8 m · sin
  //     nombre 4 m · paso 4 m · Gómez Laguna 1,56 km».
  //
  //   ⚠️ Y **el paso de peatones SÍ se absorbe** (bitácora nº104): lo excluí como
  //     «evento» y el ejemplo de Antonio era literalmente un cruce —*«si se hace un
  //     cruce como es con Calle Juslibol para pasar de acera, estás en San Juan de
  //     la Peña igual»*—. Cruzar es atravesar, no llegar a otro sitio.
  //
  //   ⛔ LO QUE **NO** SE ABSORBE NUNCA, y la línea es física, no de longitud:
  //     · unas **ESCALERAS** — son un esfuerzo y una barrera de accesibilidad;
  //     · un tramo **CONDICIONAL** — puede estar cerrado.
  //     Cruzar se atraviesa; subir y encontrarse una puerta cerrada, no.
  //
  //   ⚠️ Se repite hasta que no cambia nada: al absorber una racha, las vecinas
  //      pueden quedar pegadas y volverse fundibles.
  const absorbible = (x) => x.clave !== '@escaleras' && !x.clave.startsWith('@cond:')
    && x.metros <= lim;
  let lista = uno;
  for (let vuelta = 0; vuelta < 20; vuelta++) {
    let cambio = false;
    const out = [];
    for (let i = 0; i < lista.length; i++) {
      const a = out[out.length - 1], x = lista[i];
      if (a && !esEvento(a.clave) && a.clave !== '@sin-nombre' && absorbible(x)) {
        // ¿cuánto dura la racha de piezas absorbibles, y qué hay al otro lado?
        // ⚠️⚠️ LA RACHA SE PARA EN CUANTO APARECE LA MISMA VÍA (bitácora nº104): esa
        //    pieza es la que CIERRA, no parte de la interrupción. Sin esta condición
        //    la racha se tragaba el trozo de San Juan de la Peña de 11 m que tenía
        //    que cerrarla, seguía hasta Oliván Bayle —otra calle— y no absorbía
        //    nada. ⭐ Lo cazó la curva de sensibilidad: subir el umbral producía MÁS
        //    pasos, y eso es aritméticamente imposible si el algoritmo es correcto.
        let j = i;
        while (j < lista.length && absorbible(lista[j]) && !mismoPaso(a, lista[j])) j++;
        const b = lista[j];
        if (b && mismoPaso(a, b)) {
          for (let k = i; k < j; k++) tragar(a, lista[k], true);
          tragar(a, b, false);
          i = j;                   // `b` ya está dentro
          cambio = true;
          continue;
        }
      }
      out.push(x);
    }
    lista = out;
    if (!cambio) break;
  }

  // ── 3 · lo que se imprime ──────────────────────────────────────────────────
  lista.forEach((u, i) => {
    const n = nombreDelPaso(u);
    const prs = [...u.precisiones.entries()].sort((a, b) => b[1] - a[1]);
    u.n = i + 1;
    u.nombre = n.nombre;
    u.deducida = n.deducida;
    u.fuente = n.fuente || null;
    u.precision = prs[0][0];
    u.tipo = TIPO[u.precision] || u.precision;
    u.tipos = prs.map(([k, m]) => ({ tipo: k, metros: Math.round(m) }));
    // ⚠️ el `(tipo)` solo se imprime si el paso tiene UNA precisión. Si mezcla,
    //    decir una sola sería mentir por omisión: lo cuentan el `◦` y su nota.
    u.frase = fraseDe({
      precision: u.clave === '@paso' ? 'paso-de-peatones'
        : u.clave === '@escaleras' ? 'escaleras' : u.precision,
      nombre: n.nombre, sustantivo: n.sustantivo, deducida: n.deducida,
      tipo: u.tipo, tipoUnico: prs.length === 1 });
    // ⛔ el aviso de «deducido» solo se queda si el nombre que se imprime lo es —y
    //    solo el que corresponde a ESE nombre: un paso puede fundir trozos
    //    deducidos por testigos distintos, y contar los tres sería contar la
    //    procedencia de nombres que no se imprimen (tanda 25).
    const elMio = n.deducida ? avisoDeducido(n.via) : null;
    u.avisos = u.avisos.filter((a) => !esAvisoDeducido(a.texto) || a.texto === elMio);
    u.avisos.sort((a, b) => b.metros - a.metros);
  });
  return lista;
}

// ═════════════════════════════════════════════════════════════════════════════
// LA GEOMETRÍA — para el visor, y CORTADA donde de verdad empieza y acaba
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ Las aristas de los extremos están PARTIDAS por el nodo temporal del enganche.
//    Pintarlas enteras dibujaría la ruta llegando más lejos de donde llega, y ese
//    es justo el tipo de mentira que un visor no puede permitirse: el instrumento
//    tiene que enseñar lo que el motor calculó, no una aproximación cómoda.

/** Posición de un punto de enganche a lo largo de una arista, como escalar. */
const posDe = (pe) => pe.seg + pe.t;

/** Interpola un punto de la arista en la posición escalar `p`. */
function enPos(e, p) {
  const i = Math.max(0, Math.min(e.pts.length - 2, Math.floor(p)));
  const t = Math.max(0, Math.min(1, p - i));
  const a = e.pts[i], b = e.pts[i + 1];
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

/** El trozo de arista entre dos posiciones escalares, en ese orden. */
function trozo(e, p0, p1) {
  const out = [enPos(e, p0)];
  if (p1 >= p0) {
    for (let i = Math.ceil(p0); i <= Math.floor(p1); i++) out.push(e.pts[i]);
  } else {
    for (let i = Math.floor(p0); i >= Math.ceil(p1); i--) out.push(e.pts[i]);
  }
  out.push(enPos(e, p1));
  // se quitan los repetidos consecutivos (el corte puede caer sobre un vértice)
  const lim = [];
  for (const q of out) {
    const u = lim[lim.length - 1];
    if (!u || Math.hypot(u[0] - q[0], u[1] - q[1]) > 1e-9) lim.push(q);
  }
  return lim;
}

/**
 * Geometría por TRAMO, en metros. Necesita la secuencia de nodos de `rutaEntre`.
 * @returns {Array<Array<[number,number]>>} una polilínea por tramo
 */
function geometria(g, oP, dP, ruta) {
  const seq = ruta.nodos, ias = ruta.aristas;
  const nO = ruta.nodoOrigen, nD = ruta.nodoDestino;
  const porArista = [];
  for (let k = 0; k < ias.length; k++) {
    const e = g.aristas[ias[k]];
    const u = seq[k], v = seq[k + 1];
    const fin = e.pts.length - 1;
    const p0 = u === nO ? posDe(oP) : (u === nD ? posDe(dP) : (u === e.a ? 0 : fin));
    const p1 = v === nD ? posDe(dP) : (v === nO ? posDe(oP) : (v === e.a ? 0 : fin));
    porArista.push(trozo(e, p0, p1));
  }
  // se reagrupan por tramo, con los mismos cortes que hizo `rutaEntre`
  const out = [];
  let k = 0;
  for (const p of ruta.pasos) {
    let linea = [];
    for (let j = 0; j < p.aristas; j++, k++) {
      const t = porArista[k];
      if (!t) continue;
      if (linea.length && Math.hypot(linea[linea.length - 1][0] - t[0][0],
        linea[linea.length - 1][1] - t[0][1]) < 1e-6) linea = linea.concat(t.slice(1));
      else linea = linea.concat(t);
    }
    out.push(linea);
  }
  return out;
}

/** Longitud de una polilínea en metros — CONTADOR INDEPENDIENTE del de Dijkstra. */
function largoDe(linea) {
  let s = 0;
  for (let i = 1; i < linea.length; i++) s += Math.hypot(linea[i][0] - linea[i - 1][0], linea[i][1] - linea[i - 1][1]);
  return s;
}

const aWgs = (linea) => linea.map((p) => { const q = aGrados(p[0], p[1]); return [Math.round(q[1] * 1e6) / 1e6, Math.round(q[0] * 1e6) / 1e6]; });

// ═════════════════════════════════════════════════════════════════════════════
// EL TEXTO
// ═════════════════════════════════════════════════════════════════════════════
const m = (v) => (v >= 1000 ? (v / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(v) + ' m');

/**
 * La ruta entera, en texto plano y legible. ⛔ Sin llaves, sin comillas, sin
 * corchetes: esto lo lee una persona en una terminal.
 */
function texto(res, opciones = {}) {
  const { origen, destino, nombreDeWay, rodeo, engancheOrigen, engancheDestino, modelo } = opciones;
  const L = [];
  const tit = (origen || 'origen') + '  →  ' + (destino || 'destino');
  L.push('');
  L.push('  ' + tit);
  L.push('  ' + '─'.repeat(Math.max(20, tit.length)));

  if (!res || !res.encontrada) {
    L.push('');
    L.push('  ⛔ NO HAY CAMINO A PIE ENTRE ESOS DOS PUNTOS.');
    const mot = res && res.motivo;
    if (mot === 'componentes-distintas') {
      L.push('     El motivo: los dos extremos caen en trozos de red que no se tocan.');
      L.push('     O falta una calle en el mapa, o de verdad no se puede llegar andando.');
    } else if (mot === 'sin-camino') {
      L.push('     El motivo: hay red en los dos extremos, pero no hay forma de ir de una a otra.');
    } else if (mot) {
      L.push('     El motivo que da el motor: ' + mot);
    } else {
      L.push('     ⚠️ y el motor no dice por qué. Eso ya es un fallo en sí mismo.');
    }
    return L.join('\n');
  }

  const min = minutos(res.metros);
  L.push('  ' + m(res.metros) + ' · unos ' + Math.max(1, Math.round(min)) + ' min'
    + (rodeo != null ? ' · rodeo ' + rodeo.toFixed(2).replace('.', ',') : ''));
  L.push('  ⚠️ el tiempo es una estimación a 6 km/h, la velocidad de Antonio calibrada sobre');
  L.push('     UN solo trayecto. No es un dato del motor.');
  if (engancheOrigen != null || engancheDestino != null) {
    L.push('  enganche: ' + Math.round(engancheOrigen || 0) + ' m en el origen, '
      + Math.round(engancheDestino || 0) + ' m en el destino');
  }
  L.push('');

  const ts = tramos(res, nombreDeWay, modelo);
  const anchoN = String(ts.length).length;
  // ⚠️ El aviso de precisión se repite en casi todos los tramos de una ruta larga
  //    —doce veces la misma frase— y eso no informa: tapa. Se marca cada tramo con
  //    un símbolo y la frase entera va UNA vez al final, con cuántos tramos y
  //    cuántos metros afecta. ⛔ Nada se pierde: el recuento va al lado.
  const SOLO_EJE = new Set(['eje-de-calzada', 'eje-con-acera-declarada']);
  // ⚠️ Un paso puede MEZCLAR precisiones desde la tanda 21 (se agrupa por vía), así
  //    que el ◦ ya no puede salir de una sola: sale de los METROS que van por el
  //    eje dentro del paso. Y el recuento final se hace en metros, no en pasos.
  const mEjeDe = (t) => t.tipos.reduce((a, x) => a + (SOLO_EJE.has(x.tipo) ? x.metros : 0), 0);
  let nEje = 0, mEje = 0;
  for (const t of ts) {
    const me = mEjeDe(t);
    const marca = me > 0 ? ' ◦' : '  ';
    if (me > 0) { nEje++; mEje += me; }
    L.push('   ' + (String(t.n) + '.').padStart(anchoN + 1) + marca + ' '
      + t.frase.padEnd(52) + m(t.metros).padStart(8)
      + (t.ways > 1 ? '   · ' + t.ways + ' tramos de OSM' : ''));
    for (const a of t.avisos) {
      // el aviso de precisión va UNA vez al final, con su recuento (◦)
      if (a.texto === avisoPrecision('eje-de-calzada') || a.texto === avisoPrecision('eje-con-acera-declarada')) continue;
      // ⭐ y cada aviso dice A CUÁNTOS METROS del paso afecta: agrupar es borrar, y
      //    un aviso sin su parte de los metros es justo lo que se estaría borrando.
      const parte = (a.metros < t.metros - 0.5)
        ? '   (' + m(a.metros) + ' de los ' + m(t.metros) + ')' : '';
      L.push('   ' + ' '.repeat(anchoN + 1) + '  ⚠️  ' + a.texto + parte);
    }
  }
  L.push('');
  L.push('   ' + ' '.repeat(anchoN + 1) + '  ' + 'TOTAL'.padEnd(52) + m(res.metros).padStart(8));
  if (nEje) {
    L.push('');
    L.push('   ◦  ' + m(mEje) + ' del recorrido (el '
      + Math.round(100 * mEje / res.metros) + ' %, repartidos por ' + nEje + ' de los '
      + ts.length + ' pasos) van por el EJE DE LA CALZADA:');
    L.push('      ahí no tengo la acera dibujada, así que los metros pueden bailar.');
  }

  // ⭐ el cuadre, impreso: si la suma de los tramos no da el total, se ve aquí.
  const suma = ts.reduce((s, t) => s + t.metros, 0);
  if (Math.abs(suma - res.metros) > 0.5) {
    L.push('   ⛔ LOS TRAMOS NO SUMAN EL TOTAL: ' + suma.toFixed(1) + ' contra ' + res.metros);
  }

  // ⭐ lo que NO se dice, dicho una vez al final y no en cada tramo
  L.push('');
  L.push('   ⛔ Lo que este motor NO sabe, y por eso no lo dice: giros, semáforos, cuestas,');
  L.push('      obras, ni por cuál de las dos aceras vas. El lado de la acera no está en el');
  L.push('      dato: 0 de 9.634 aceras de Zaragoza lo declaran.');
  return L.join('\n');
}

module.exports = { texto, tramos, tramo, tramoDeArista, geometria, largoDe, aWgs, minutos,
  VELOCIDAD_KMH, TIPO, SUSTANTIVO, SUSTANTIVO_DEDUCIDO, comoSeAnda, fraseDe,
  claveDe, mismoPaso, nombreDelPaso, CORTO_M, AVISO_BICIS, AVISO_DEDUCIDO,
  AVISO_POR, avisoDeducido, esAvisoDeducido, avisoPrecision, avisoCondicional };
