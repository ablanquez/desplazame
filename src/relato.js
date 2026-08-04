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
//     · **Qué ES la línea, siempre**: «por el carril bici de X», «por la acera de
//       X». Eso sale de la PLATAFORMA, no de qué fichero trajo el nombre.
//     · `osm` y `municipal-bici` se cuentan IGUAL: los dos son declarados, y al
//       usuario no le importa de qué capa salió.
//     · ⭐ Solo lo DEDUCIDO llevaría marca — y hoy no hay nada deducido: el método
//       de portales de la tanda 17 sigue sin aplicarse.
//   ⇒ La procedencia exacta se guarda en el dato, para nosotros. No se imprime.
const SUSTANTIVO = {
  'carril-bici': 'el carril bici de',
  'acera': 'la acera de',
  'plataforma-peatonal': 'la zona peatonal de',
  'camino': 'el camino de',
  'pista': 'la pista de',
  'vial-de-servicio': 'el vial de servicio de',
};

function tramo(p, nombreDeWay, n, modelo) {
  let nombre = nombreDeWay ? nombreDeWay(p.way) : null;
  const tipo = TIPO[p.precision] || p.precision;
  // ⭐ el modelo solo habla donde OSM se calla
  let deModelo = null;
  if (!nombre && modelo) {
    const m = modelo(p.way);
    if (m && m.via && m.via.nombre) { deModelo = m; nombre = m.via.nombre; }
  }
  const avisos = [];
  const ap = avisoPrecision(p.precision);
  if (ap) avisos.push(ap);
  if (p.condicional) avisos.push(avisoCondicional(p));
  if (p.unidoPorDefecto) avisos.push('este empalme se unió por defecto: nada decía que no se pudiera pasar, pero tampoco que sí (D2)');
  // ⭐ el «qué hace» sale del tipo, no de un giro que no sé
  let frase;
  if (p.precision === 'paso-de-peatones') frase = 'Cruzas por un paso de peatones';
  else if (p.precision === 'escaleras') frase = 'Subes o bajas unas escaleras';
  else if (nombre) frase = 'Por ' + nombre;
  else frase = 'Por un tramo sin nombre';
  if (nombre && p.precision !== 'paso-de-peatones' && p.precision !== 'escaleras') {
    // ⭐ si el nombre lo trae el modelo, el sustantivo dice QUÉ ES la línea y el
    //    tipo de D4 sobraría: «por el carril bici de X (eje de calzada)» son dos
    //    formas de contar lo mismo, y la segunda es la que menos se entiende.
    //    ⚠️ El aviso de precisión NO se pierde: sigue en el `◦` y en su nota.
    const sus = deModelo ? SUSTANTIVO[deModelo.forma.plataforma] : null;
    if (sus) frase = 'Por ' + sus + ' ' + nombre;
    else frase += ' (' + tipo + ')';
  } else if (!nombre && p.precision !== 'paso-de-peatones' && p.precision !== 'escaleras') {
    frase += ' (' + tipo + ')';
  } else if (nombre) {
    frase += ' de ' + nombre;
  }
  return { n, nombre, tipo, frase, metros: p.metros, precision: p.precision,
    condicional: !!p.condicional, unidoPorDefecto: !!p.unidoPorDefecto, avisos,
    way: p.way, highway: p.highway,
    // ⭐ el dato completo viaja, aunque no se imprima: fuente del nombre y forma
    via: deModelo ? deModelo.via : (nombre ? { nombre, fuente: 'osm', declarada: true } : null),
    forma: deModelo ? deModelo.forma : null };
}

/**
 * Los tramos de una ruta ya calculada.
 *
 * ⚠️ AGRUPAR ES BORRAR, y aquí se agrupa — así que hay que decir exactamente qué.
 *    `rutaEntre` corta por `way` de OSM, y una calle real son varios ways: la nº2
 *    de Antonio salía con «Por Calle Pedro Atarés 26 m» y «Por Calle Pedro Atarés
 *    16 m» seguidos, que para quien anda es un solo tramo.
 * ⇒ Se funden los tramos consecutivos **idénticos en todo lo que se cuenta**:
 *   mismo nombre, mismo tipo, mismos avisos. ⛔ Lo PARECIDO no se funde: dos
 *   tramos de la misma calle con precisión distinta siguen separados, porque esa
 *   diferencia es justo lo que hay que ver.
 * ⭐ Y el número de ways fundidos VIAJA en el tramo (`ways`), así que la fusión no
 *   puede esconder nada: quien quiera el detalle lo tiene contado.
 */
function tramos(ruta, nombreDeWay, modelo) {
  const sueltos = ruta.pasos.map((p, i) => ({ ...tramo(p, nombreDeWay, 0, modelo), pasos: [i] }));
  const out = [];
  for (const t of sueltos) {
    const u = out[out.length - 1];
    const mismo = u && u.nombre === t.nombre && u.precision === t.precision
      && u.condicional === t.condicional && u.unidoPorDefecto === t.unidoPorDefecto
      && u.avisos.join('|') === t.avisos.join('|');
    if (mismo) {
      u.metros = Math.round((u.metros + t.metros) * 10) / 10;
      u.pasos.push(...t.pasos);
      u.ways = (u.ways || 1) + 1;
    } else {
      out.push({ ...t, ways: 1 });
    }
  }
  out.forEach((t, i) => { t.n = i + 1; });
  return out;
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
  let nEje = 0, mEje = 0;
  for (const t of ts) {
    const marca = SOLO_EJE.has(t.precision) ? ' ◦' : '  ';
    if (SOLO_EJE.has(t.precision)) { nEje++; mEje += t.metros; }
    L.push('   ' + (String(t.n) + '.').padStart(anchoN + 1) + marca + ' '
      + t.frase.padEnd(52) + m(t.metros).padStart(8)
      + (t.ways > 1 ? '   · ' + t.ways + ' tramos de OSM' : ''));
    for (const a of t.avisos) {
      if (SOLO_EJE.has(t.precision) && a === avisoPrecision(t.precision)) continue;
      L.push('   ' + ' '.repeat(anchoN + 1) + '  ⚠️  ' + a);
    }
  }
  L.push('');
  L.push('   ' + ' '.repeat(anchoN + 1) + '  ' + 'TOTAL'.padEnd(52) + m(res.metros).padStart(8));
  if (nEje) {
    L.push('');
    L.push('   ◦  ' + nEje + ' de los ' + ts.length + ' tramos (' + m(mEje) + ', el '
      + Math.round(100 * mEje / res.metros) + ' % del recorrido) van por el EJE DE LA CALZADA:');
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

module.exports = { texto, tramos, tramo, geometria, largoDe, aWgs, minutos,
  VELOCIDAD_KMH, TIPO, avisoPrecision, avisoCondicional };
