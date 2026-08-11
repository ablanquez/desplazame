// ⭐⭐⭐ H2a · TANDA 10 — LA MARCA DE «HAY OTRO POSTE CON ESTE NOMBRE AL LADO»
//
// ═════════════════════════════════════════════════════════════════════════════
// LA DECISIÓN QUE ESTE FICHERO EJECUTA, Y LA QUE ⛔ NO EJECUTA
// ═════════════════════════════════════════════════════════════════════════════
//   Antonio decidió el 11/08: **OPCIÓN C — SE DECLARA, NO SE FUSIONA.**
//   Este proyecto modela **POSTES**, no estaciones, y lo dice en el dato.
//
//   ⛔⛔ AQUÍ NO SE FUSIONA NADA. No hay una sola línea que junte dos `stop_id` en
//     uno. Agrupar sin `parent_station` sería inventar un dato que la fuente no
//     da: **la marca dice la verdad; la agrupación diría una verdad PROBABLE.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL NOMBRE DE LA MARCA, Y POR QUÉ NO SE LLAMA `gemelo` (ley 157)
// ═════════════════════════════════════════════════════════════════════════════
//   La prueba: *¿puede un lector que solo ve la etiqueta concluir algo que el
//   instrumento no sabe?*
//
//     `gemelo`             ⛔ NO PASA. Dos gemelos son **el mismo tipo de cosa
//                          duplicada**: un lector concluye «son la misma parada»,
//                          que es exactamente la opción B entrando por la puerta
//                          de atrás. Es la palabra del encargo y por eso se audita
//                          la primera.
//     `estacion`           ⛔ NO PASA, y peor: nombra un nivel de modelo que este
//                          feed **no declara en ninguna de sus 984 paradas**.
//     `andenes`            ⛔ NO PASA. Afirma que son andenes de algo.
//     `mismoNombreCerca`   ✅ PASA. Dice un hecho medible —hay otro poste con este
//                          nombre a tantos metros— y **no dice qué significa**.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ LO QUE ESTE FICHERO **NO** DECIDE
// ═════════════════════════════════════════════════════════════════════════════
//   El umbral de una futura AGRUPACIÓN. Aquí se elige un umbral para MARCAR, que
//   es otra cosa: marcar de más avisa de algo que existe; agrupar de más manda a
//   alguien a esperar al otro lado de la calle.
//
//   node tools/gtfs/gemelos.js

'use strict';

const A = require('../../src/alarma');
const { cargar } = require('./feed');

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL UMBRAL — DECLARADO, NO ENCONTRADO
//
//   ⛔ NO hay una frontera limpia en este dato, y decirlo es la mitad del trabajo.
//     Ordenadas las 48 distancias entre homónimas, el hueco más ancho de toda la
//     zona 10–20 m mide **1,7 m** (entre 13,7 y 15,4). Un umbral aquí no separa
//     dos poblaciones: **las corta.**
//
//   POR QUÉ 15 m, con los tres motivos y en este orden:
//     1 · Es el umbral con el que ya está MEDIDO Y PUBLICADO lo que hay en la mesa
//         de Antonio —«15 de 17 pares del tranvía», «170 de 272 enlaces»
//         (`docs/H2A-TANDA-8-TRANVIA.md` §3)—. Moverlo mueve un número publicado
//         **sin ninguna medida nueva que lo justifique**, y eso es un ajuste
//         disfrazado de hallazgo.
//     2 · Es el hueco más ancho de su zona. ⚠️ 1,7 m. No es un argumento fuerte y
//         no se presenta como tal.
//     3 · Por debajo, 16 de los 17 pares son de tranvía; el 17º es un par de bus
//         a 13,7 m. ⭐ Y eso es bueno, no malo: **es la prueba de que la marca
//         mira el bus** y no un filtro que solo recorre el tranvía.
// ═════════════════════════════════════════════════════════════════════════════
const UMBRAL_M = 15;

/**
 * ⭐⭐ LA BANDA DE SOLAPE — lo que el umbral parte a ciegas.
 *
 * La tanda 8 leyó dos poblaciones: los pares de TRANVÍA como «dos andenes del
 * mismo sitio» y los de BUS como «dos aceras, sitios distintos». ⛔ **No se
 * tocan: se solapan.** El par de bus más CORTO está a 13,7 m y el par de tranvía
 * más LARGO a 66,4 m ⇒ hay 52,7 metros donde las dos lecturas conviven.
 *
 * ⛔⛔ Y dentro de la banda no hay **ni un caso verificado** de ninguna de las dos
 *    cosas: `parent_station` está vacío en las 984 y nadie ha mirado un par sobre
 *    el mapa. Lo de «andenes» y lo de «aceras» son LECTURAS, no comprobaciones.
 *
 * ⚠️ Los dos números se RECALCULAN del feed en cada ejecución y se exigen contra
 *    estos: si el feed cambia y la banda se mueve, sale en rojo.
 */
const BANDA_ESPERADA = { desde: 13.7, hasta: 66.4 };

/**
 * ⭐ LA NORMALIZACIÓN DEL NOMBRE — minúsculas y espacios, y ni un paso más.
 *
 * ⚠️ NO es una regla de agrupación: es comparar dos cadenas bien. `"La Chimenea"`
 *    y `"La chimenea"` son el mismo nombre escrito por la misma persona con dos
 *    teclas distintas, y tratarlos como nombres diferentes es un fallo de la
 *    comparación, no una decisión de modelo.
 *
 * ⛔ Y se para aquí a propósito. Quitar tildes o dejar solo alfanuméricos
 *    **no une ni un par más** (medido: 940 nombres y 48 pares con las tres
 *    variantes) ⇒ el paso extra no compra nada y sí puede fundir dos nombres que
 *    de verdad se distinguen por una tilde. El día que esa cifra deje de ser cero,
 *    hay que mirarlo, no adaptarse en silencio.
 */
const normaliza = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

const R_TIERRA = 6371000, RAD = Math.PI / 180;
/** Metros entre dos puntos, con la misma fórmula que `enlaces.js`. */
function distancia(a, b) {
  const x = (b.lon - a.lon) * RAD * Math.cos((a.lat + b.lat) / 2 * RAD);
  const y = (b.lat - a.lat) * RAD;
  return Math.hypot(x, y) * R_TIERRA;
}

/**
 * Todos los pares de paradas que comparten nombre, con su distancia y su clase.
 *
 * ⚠️ Devuelve PARES, no grupos: «Plaza Europa» tiene cuatro postes y produce seis
 *    pares. Contar grupos escondería que uno de ellos está a 26 m y otro a 122.
 *
 * @param {Array} paradas  `{code, nombre, lat, lon, modo}`
 * @param {(s:string)=>string} clave  cómo se compara el nombre
 */
function paresHomonimos(paradas, clave = normaliza) {
  const porNombre = new Map();
  for (const p of paradas) {
    const k = clave(p.nombre);
    if (!porNombre.has(k)) porNombre.set(k, []);
    porNombre.get(k).push(p);
  }
  const pares = [];
  for (const [k, xs] of porNombre) {
    for (let i = 0; i < xs.length; i++) {
      for (let j = i + 1; j < xs.length; j++) {
        pares.push({
          clave: k, a: xs[i], b: xs[j], m: distancia(xs[i], xs[j]),
          clase: xs[i].modo === xs[j].modo ? xs[i].modo : 'mixto',
        });
      }
    }
  }
  return { pares: pares.sort((x, y) => x.m - y.m), nombres: porNombre.size };
}

/**
 * ⭐⭐⭐ LA MARCA. `Map(code → {n, otras:[{code, m, modo}]})`.
 *
 * ⚠️ Es SIMÉTRICA por construcción —cada par se escribe en las dos direcciones—
 *    y aun así se comprueba: «por construcción» es exactamente lo que se dice de
 *    las comprobaciones que no pueden fallar (ley 35).
 * ⭐ Y `otras` es una LISTA: «Campus Río Ebro» son tres postes.
 */
function marcar(paradas, umbral = UMBRAL_M, clave = normaliza) {
  const { pares } = paresHomonimos(paradas, clave);
  const marca = new Map();
  const pon = (p, otro, m) => {
    if (!marca.has(p.code)) marca.set(p.code, { n: 0, otras: [] });
    const x = marca.get(p.code);
    x.otras.push({ code: otro.code, m: Math.round(m * 10) / 10, modo: otro.modo });
    x.n = x.otras.length;
  };
  for (const par of pares) {
    if (par.m > umbral) continue;
    pon(par.a, par.b, par.m);
    pon(par.b, par.a, par.m);
  }
  return marca;
}

/**
 * ⭐⭐⭐ EL TEXTO DE LA MARCA — auditado con la ley 157 palabra a palabra.
 *
 * ⛔ La frase que NO puede aparecer, y que estuvo escrita en el primer borrador:
 *   *«…dos entradas para lo que en la calle es un mismo sitio»*. Eso AFIRMA que
 *   son el mismo sitio, que es justo lo que no se sabe. La versión buena deja la
 *   pregunta abierta **y dice quién no la contesta**.
 */
const AVISO_MARCA = 'Hay otro poste con este mismo nombre a menos de ' + UMBRAL_M + ' m. '
  + '⛔ Esto NO afirma que sean la misma parada ni la misma estación: el feed no trae '
  + '`parent_station` en ninguna de sus 984 paradas, así que NADA en el dato declara que dos '
  + 'postes formen un sitio. Este proyecto modela POSTES. ⇒ Quien consulte va a ver DOS '
  + 'entradas muy próximas con el mismo nombre; si en la calle son un sitio o dos, este dato '
  + 'no lo sabe y no lo dice.';

/** Las paradas del feed en la forma que este fichero usa. */
function paradasDelFeed() {
  const { stops, modo } = cargar();
  return stops.map((s) => ({
    id: s.stop_id, code: s.stop_code, nombre: s.stop_name,
    lat: Number.parseFloat(s.stop_lat), lon: Number.parseFloat(s.stop_lon),
    modo: modo.get(s.stop_id) || '?',
    parent: s.parent_station,
  }));
}

module.exports = { UMBRAL_M, BANDA_ESPERADA, AVISO_MARCA, normaliza, distancia,
  paresHomonimos, marcar, paradasDelFeed };

// ═════════════════════════════════════════════════════════════════════════════
// EL INFORME — solo si se ejecuta directamente. `enlaces.js` y `red-bus.js`
// requieren este fichero por sus funciones, y no pueden heredar su salida.
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = (s) => process.stdout.write(s + '\n');
  const raya = (c = '=') => log(c.repeat(100));
  const di = (k, v) => log('   ' + String(k).padEnd(56) + ' ' + v);
  const pctl = (s, q) => s[Math.min(s.length - 1, Math.floor(s.length * q))];
  const f1 = (x) => x.toFixed(1);

  raya();
  log('LA MARCA DE «HAY OTRO POSTE CON ESTE NOMBRE AL LADO» — se declara, NO se fusiona');
  raya();

  const P = paradasDelFeed();
  const BUS = P.filter((p) => p.modo === 'bus');
  const TRA = P.filter((p) => p.modo === 'tranvia');

  // ───────────────────────────────────────────────────────────────────────────
  // P0 · EL UNIVERSO — ⭐⭐ LEY 167: el guardián mira LAS 984, no la lista marcada
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P0 · EL UNIVERSO — ⭐⭐ ley 167: lo que se vigila son LAS 984, no los marcados');
  raya('─');
  di('paradas del feed · bus · tranvía', P.length + ' · ' + BUS.length + ' · ' + TRA.length);
  A.exige(P.length === 984, `salen ${P.length} paradas y el proyecto tiene publicadas 984`);
  A.exige(BUS.length === 934 && TRA.length === 50, `salen ${BUS.length} de bus y ${TRA.length} de tranvía`);

  // ⛔⛔ EL DATO QUE JUSTIFICA TODA LA TANDA, y se recuenta sobre EL UNIVERSO.
  //   Un guardián que recorriera «las paradas con parent_station» no daría ni una
  //   vuelta y saldría verde (ley 167). Éste recorre las 984 y cuenta las vacías.
  const conParent = P.filter((p) => p.parent && p.parent.length > 0);
  di('⛔ paradas con `parent_station` relleno', conParent.length + ' de ' + P.length
    + (conParent.length === 0 ? '   ⇒ NADA declara que dos postes formen una estación' : '   ⚠️ ALGUNA LO TRAE'));
  A.exige(conParent.length === 0,
    `${conParent.length} paradas traen parent_station: el feed ya declara estaciones y esta tanda `
    + 'entera está construida sobre que NO lo hace. Hay que rehacerla, no marcar.');
  // ⭐ y el uno que acompaña al cero (ley 152 · 156): que el contador sepa contar.
  const provoParent = P.map((p, i) => (i === 0 ? { ...p, parent: 'EST_1' } : p)).filter((p) => p.parent).length;
  di('⭐ provocado: se rellena el parent_station de UNA', provoParent === 1 ? '✅ la cuenta (1)' : '⛔ NO la cuenta');
  A.exige(provoParent === 1, 'el contador de parent_station no sabe contar: su cero no vale nada');

  // ───────────────────────────────────────────────────────────────────────────
  // P1 · ⛔ EL SEGUNDO TESTIGO QUE PARECÍA HABER Y NO SIRVE
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P1 · ⛔ EL CONVENIO DE CÓDIGO DEL TRANVÍA — parecía un segundo testigo y NO LO ES');
  raya('─');
  log('   Los 50 códigos del tranvía son `NNN1` / `NNN2`, y da la tentación de leerlos como');
  log('   «estación + andén». Si eso fuera cierto, sería un testigo INDEPENDIENTE del nombre');
  log('   y de la distancia, y decidiría el umbral él solo. Se comprueba antes de usarlo:');
  log('');
  {
    const porPrefijo = new Map();
    for (const t of TRA) {
      const pref = t.code.slice(0, 3);
      if (!porPrefijo.has(pref)) porPrefijo.set(pref, []);
      porPrefijo.get(pref).push(t);
    }
    const parejas = [...porPrefijo.values()].filter((xs) => xs.length === 2);
    const mismo = parejas.filter((xs) => normaliza(xs[0].nombre) === normaliza(xs[1].nombre));
    const distinto = parejas.filter((xs) => normaliza(xs[0].nombre) !== normaliza(xs[1].nombre));
    di('prefijos de 3 cifras con dos códigos', parejas.length);
    di('   de ésos, con el MISMO nombre', mismo.length);
    di('   ⛔ con nombre DISTINTO', distinto.length);
    log('');
    for (const xs of distinto.sort((u, v) => distancia(u[0], u[1]) - distancia(v[0], v[1]))) {
      log('      ' + xs[0].code + ' / ' + xs[1].code + '  ' + f1(distancia(xs[0], xs[1])).padStart(7) + ' m   "'
        + xs[0].nombre + '"  vs  "' + xs[1].nombre + '"');
    }
    log('');
    log('   ⇒ ⛔⛔ CINCO de esas parejas están a 108–155 m y llevan nombres de calles distintas.');
    log('     **El prefijo de código NO identifica una estación.** Si se hubiera usado como');
    log('     testigo, habría certificado como «un mismo sitio» dos postes a 155 metros.');
    A.exige(distinto.length >= 5, `salen ${distinto.length} parejas de código con nombre distinto y se midieron 6`);
    const lejos = distinto.filter((xs) => distancia(xs[0], xs[1]) > 100).length;
    A.exige(lejos === 5, `salen ${lejos} parejas de código a más de 100 m y se midieron 5`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P2 · EL CRUCE HACIA ATRÁS CON LA TANDA 8 (ley 154)
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P2 · ⭐⭐ EL CRUCE HACIA ATRÁS — reencontrar lo que la tanda 8 midió, con SU misma regla');
  raya('─');
  log('   ⚠️ La tanda 8 comparó el nombre TAL CUAL. Para que el cruce valga hay que medir');
  log('     igual que ella ANTES de cambiar nada, o no se está comprobando: se está');
  log('     comparando otra cosa con un número viejo.');
  const crudo = paresHomonimos(P, (s) => s);
  {
    const t = crudo.pares.filter((p) => p.clase === 'tranvia').map((p) => p.m).sort((a, b) => a - b);
    const b = crudo.pares.filter((p) => p.clase === 'bus').map((p) => p.m).sort((a, b) => a - b);
    log('');
    log('   ' + 'medida'.padEnd(44) + 'aquí'.padStart(10) + 'tanda 8'.padStart(10) + '   ¿cuadra?');
    const fila = (etq, mio, pub, tol = 0.05) => {
      const ok = Math.abs(mio - pub) <= tol;
      log('   ' + etq.padEnd(44) + String(f1(mio)).padStart(10) + String(f1(pub)).padStart(10)
        + '   ' + (ok ? '✅' : '⛔ NO'));
      A.exige(ok, `${etq}: aquí ${f1(mio)} y la tanda 8 publicó ${f1(pub)}`);
    };
    fila('nombres distintos entre las 984', crudo.nombres, 942);
    fila('pares homónimos de TRANVÍA', t.length, 17);
    fila('   de ésos, a menos de 15 m', t.filter((x) => x < 15).length, 15);
    fila('   mín', t[0], 2.1);
    fila('   p50', pctl(t, 0.5), 8.3);
    fila('   máx', t[t.length - 1], 66.4);
    fila('pares homónimos de BUS', b.length, 26);
    fila('   de ésos, a menos de 15 m', b.filter((x) => x < 15).length, 1);
    fila('   mín', b[0], 13.7);
    fila('   p50', pctl(b, 0.5), 59.5);
    log('');
    log('   ⭐ Y algo que la tanda 8 NO midió: los pares con UNA punta de bus y otra de tranvía.');
    di('   pares MIXTOS bus↔tranvía', crudo.pares.filter((p) => p.clase === 'mixto').length
      + '   (la tanda 8 midió cada modo por separado y este cruce se le escapó)');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P3 · LA NORMALIZACIÓN, Y LO QUE CAMBIA — exactamente y con nombre
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P3 · ⛔ LA COMPARACIÓN DE NOMBRES ESTABA MAL, Y EL SEGUNDO TESTIGO LO DESTAPÓ');
  raya('─');
  const norm = paresHomonimos(P, normaliza);
  {
    const antes = new Set(crudo.pares.map((p) => p.a.code + '|' + p.b.code));
    const nuevos = norm.pares.filter((p) => !antes.has(p.a.code + '|' + p.b.code));
    di('nombres distintos: crudo → normalizado', crudo.nombres + ' → ' + norm.nombres);
    di('pares homónimos: crudo → normalizado', crudo.pares.length + ' → ' + norm.pares.length);
    log('');
    log('   ⭐ LO QUE UNE LA NORMALIZACIÓN, uno a uno y con su distancia:');
    for (const p of nuevos) {
      log('      ' + p.a.code.padEnd(9) + p.b.code.padEnd(9) + f1(p.m).padStart(8) + ' m   "'
        + p.a.nombre + '"  +  "' + p.b.nombre + '"   [' + p.clase + ']');
    }
    A.exige(nuevos.length === 2, `la normalización une ${nuevos.length} pares y se midieron 2`);
    const dentro = nuevos.filter((p) => p.m <= UMBRAL_M);
    di('   de ésos, por debajo del umbral', dentro.length + '   ⇒ ' + (dentro.length ? 'la marca CAMBIA' : 'la marca no cambia'));
    log('');
    log('   ⛔⛔ `1001 "La Chimenea"` y `1002 "La chimenea"` están a 10,7 m y son la misma');
    log('     parada escrita con dos teclas distintas. Comparando el nombre TAL CUAL —como');
    log('     hizo la tanda 8— **son dos nombres y el par no existe**. ⇒ El «15 de 17» y el');
    log('     «170 de 272» publicados están CORTOS por una mayúscula.');
    log('   ⚠️ Y no lo destapó la distancia ni el nombre: lo destapó ir a comprobar si el');
    log('     convenio de código servía de testigo. **Un testigo que no vale para lo que se');
    log('     buscaba puede valer para otra cosa.**');
    log('');
    log('   ⛔ HASTA DÓNDE SE NORMALIZA, Y POR QUÉ NO MÁS: medido sobre las 984, quitar');
    log('     tildes y dejar solo alfanuméricos da los MISMOS 940 nombres y los MISMOS 48');
    log('     pares. ⇒ El paso extra no compra nada y sí podría fundir dos nombres que se');
    log('     distinguen por una tilde. Se para aquí, y la cifra se vigila:');
    const sinTildes = paresHomonimos(P, (s) => normaliza(s).normalize('NFD').replace(/[̀-ͯ]/g, ''));
    const soloAlnum = paresHomonimos(P, (s) => normaliza(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim());
    di('   pares: normalizado · sin tildes · solo alfanumérico',
      norm.pares.length + ' · ' + sinTildes.pares.length + ' · ' + soloAlnum.pares.length);
    A.exige(sinTildes.pares.length === norm.pares.length && soloAlnum.pares.length === norm.pares.length,
      'normalizar más SÍ une pares nuevos: la decisión de pararse en minúsculas+espacios ya no '
      + 'está justificada por «no cambia nada» y hay que mirarlos uno a uno');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P4 · ⭐⭐⭐ EL UMBRAL, CON LA DISTRIBUCIÓN DELANTE Y LOS DUDOSOS CONTADOS
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P4 · ⭐⭐⭐ EL UMBRAL — la distribución delante, y los dudosos contados');
  raya('─');
  const bandaDesde = Math.min(...norm.pares.filter((p) => p.clase === 'bus').map((p) => p.m));
  const bandaHasta = Math.max(...norm.pares.filter((p) => p.clase === 'tranvia').map((p) => p.m));
  {
    log('   Las 48 distancias, ordenadas, con el salto a la siguiente. ⭐ Se enseña la zona');
    log('   0–70 m entera: es donde el umbral tiene que caer y donde se ve que no hay hueco.');
    log('');
    log('      ' + '#'.padStart(3) + 'metros'.padStart(9) + 'salto'.padStart(8) + '  clase     nombre');
    for (let i = 0; i < norm.pares.length; i++) {
      const p = norm.pares[i];
      if (p.m > 70) break;
      const salto = i + 1 < norm.pares.length ? norm.pares[i + 1].m - p.m : 0;
      const marca = p.m <= UMBRAL_M ? '◀ marcado' : '';
      log('      ' + String(i + 1).padStart(3) + f1(p.m).padStart(9) + f1(salto).padStart(8)
        + '  ' + p.clase.padEnd(9) + ' ' + p.a.nombre.slice(0, 40).padEnd(41) + marca);
    }
    log('');
    di('el hueco más ancho entre 10 y 20 m', '1,7 m  (13,7 → 15,4)   ⛔ eso NO es una frontera');
    log('');
    log('   ⭐⭐⭐ LA BANDA DE SOLAPE — las dos poblaciones de la tanda 8 NO se tocan: SE PISAN');
    di('   par de BUS más corto  («dos aceras»)', f1(bandaDesde) + ' m');
    di('   par de TRANVÍA más largo («dos andenes»)', f1(bandaHasta) + ' m');
    di('   ⇒ ancho de la banda', f1(bandaHasta - bandaDesde) + ' m');
    A.exige(Math.abs(bandaDesde - BANDA_ESPERADA.desde) <= 0.05
      && Math.abs(bandaHasta - BANDA_ESPERADA.hasta) <= 0.05,
      `la banda de solape sale [${f1(bandaDesde)} , ${f1(bandaHasta)}] y estaba declarada `
      + `[${BANDA_ESPERADA.desde} , ${BANDA_ESPERADA.hasta}]`);
    const debajo = norm.pares.filter((p) => p.m < bandaDesde);
    const dentro = norm.pares.filter((p) => p.m >= bandaDesde && p.m <= bandaHasta);
    const encima = norm.pares.filter((p) => p.m > bandaHasta);
    log('');
    log('   ' + 'zona'.padEnd(34) + 'pares'.padStart(7) + '   de qué clase son');
    const cla = (xs) => ['tranvia', 'bus', 'mixto'].map((c) => c + ' ' + xs.filter((p) => p.clase === c).length).join(' · ');
    log('   ' + ('por debajo  (< ' + f1(bandaDesde) + ' m)').padEnd(34) + String(debajo.length).padStart(7) + '   ' + cla(debajo));
    log('   ' + ('⚠️ DENTRO DE LA BANDA').padEnd(33) + String(dentro.length).padStart(7) + '   ' + cla(dentro));
    log('   ' + ('por encima  (> ' + f1(bandaHasta) + ' m)').padEnd(34) + String(encima.length).padStart(7) + '   ' + cla(encima));
    log('');
    di('⚠️ DUDOSOS: pares dentro de la banda', dentro.length + ' de ' + norm.pares.length
      + '   (' + (100 * dentro.length / norm.pares.length).toFixed(1) + ' %)');
    // ⛔ Un umbral que no deja ni un dudoso es un umbral mal medido, no uno bueno.
    A.exige(dentro.length > 0,
      'el umbral no deja NI UN par dudoso. En un dato real eso no es una frontera limpia: '
      + 'es una frontera mal medida, y hay que volver a mirar la distribución');
    log('      ⛔ De estos ' + dentro.length + ', el umbral marca ' + dentro.filter((p) => p.m <= UMBRAL_M).length
      + ' y deja ' + dentro.filter((p) => p.m > UMBRAL_M).length + ' sin marcar,');
    log('        Y NO HAY NINGUNA MEDIDA que diga cuáles de ellos son un sitio o dos.');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P5 · ⭐ EL COSTE DEL UMBRAL, CONTABLE (ley 23)
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P5 · ⭐ EL ERROR QUE SE ACEPTA A SABIENDAS — con su lista, no con una frase');
  raya('─');
  {
    const faltan = norm.pares.filter((p) => p.clase === 'tranvia' && p.m > UMBRAL_M);
    const sobran = norm.pares.filter((p) => p.clase === 'bus' && p.m <= UMBRAL_M);
    log('   SIN MARCA y con toda la pinta de ser el mismo sitio (mismo nombre, misma línea):');
    for (const p of faltan) log('      ' + p.a.code + ' / ' + p.b.code + '   ' + f1(p.m).padStart(7) + ' m   "' + p.a.nombre + '"');
    log('   CON MARCA y que la tanda 8 leyó como dos aceras distintas:');
    for (const p of sobran) log('      ' + p.a.code + ' / ' + p.b.code + '   ' + f1(p.m).padStart(7) + ' m   "' + p.a.nombre + '"');
    log('');
    di('⇒ el umbral se queda corto en', faltan.length + ' pares de tranvía');
    di('⇒ y se pasa en', sobran.length + ' par de bus');
    log('      ⚠️ Los dos números son del MISMO umbral. No se puede bajar uno sin subir el otro:');
    log('        eso es lo que significa que las poblaciones se solapen.');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P6 · EL RECUENTO, Y DE QUÉ POBLACIÓN ES CADA CELDA (ley 164)
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P6 · EL RECUENTO — ⭐⭐ ley 164: de qué población es CADA celda');
  raya('─');
  const marca = marcar(P, UMBRAL_M);
  {
    const modoDe = new Map(P.map((p) => [p.code, p.modo]));
    const nb = [...marca.keys()].filter((c) => modoDe.get(c) === 'bus').length;
    const nt = [...marca.keys()].filter((c) => modoDe.get(c) === 'tranvia').length;
    log('   ⚠️ CADA FILA ES UNA POBLACIÓN DISTINTA Y EL DENOMINADOR LO DICE. La columna de');
    log('     «pares» cuenta PAREJAS; la de «paradas», POSTES. Un poste de «Campus Río Ebro»');
    log('     puede estar en dos parejas ⇒ ⛔ las dos columnas NO se suman entre sí.');
    log('');
    log('   ' + 'población'.padEnd(34) + 'pares ≤15 m'.padStart(13) + 'de un total de'.padStart(16)
      + 'postes marcados'.padStart(18) + 'sobre'.padStart(10));
    const filaP = (etq, clase, tot, postes, den) => {
      const n = norm.pares.filter((p) => p.clase === clase && p.m <= UMBRAL_M).length;
      log('   ' + etq.padEnd(34) + String(n).padStart(13) + String(tot).padStart(16)
        + String(postes).padStart(18) + String(den).padStart(10));
    };
    filaP('tranvía × tranvía', 'tranvia', norm.pares.filter((p) => p.clase === 'tranvia').length, nt, TRA.length);
    filaP('bus × bus', 'bus', norm.pares.filter((p) => p.clase === 'bus').length, nb, BUS.length);
    filaP('bus ↔ tranvía (mixto)', 'mixto', norm.pares.filter((p) => p.clase === 'mixto').length, '—', '—');
    log('   ' + 'TOTAL'.padEnd(34) + String(norm.pares.filter((p) => p.m <= UMBRAL_M).length).padStart(13)
      + String(norm.pares.length).padStart(16) + String(marca.size).padStart(18) + String(P.length).padStart(10));
    log('');
    di('paradas de TRANVÍA con marca', nt + ' de ' + TRA.length + '   (' + (100 * nt / TRA.length).toFixed(1) + ' %)');
    di('paradas de BUS con marca', nb + ' de ' + BUS.length + '   (' + (100 * nb / BUS.length).toFixed(1) + ' %)');
    A.exige(nt === 32 && nb === 2, `salen ${nt} de tranvía y ${nb} de bus con marca; se esperaban 32 y 2`);
    log('');
    log('   ⇒ ⭐⭐⭐ **Es una diferencia de estructura, no de grado: 64 % contra 0,2 %.**');
    log('     El modo pequeño es el que examina el modelo (ley 169).');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P7 · ⛔ LA SOSPECHA: ¿MIRA EL INSTRUMENTO EL BUS Y LOS MIXTOS? (ley 156)
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P7 · ⛔ LA SOSPECHA — un filtro que solo recorriera el tranvía daría CASI este resultado');
  raya('─');
  log('   El resultado esperado de un instrumento roto —«solo el tranvía»— y el del bueno se');
  log('   parecen tanto que hay que separarlos a propósito:');
  log('');
  {
    const modoDe = new Map(P.map((p) => [p.code, p.modo]));
    const conBus = [...marca.keys()].filter((c) => modoDe.get(c) === 'bus');
    di('⭐ paradas de BUS con marca al umbral de ' + UMBRAL_M + ' m', conBus.length + '   ' + conBus.join(' · '));
    A.exige(conBus.length > 0, 'ni una parada de bus lleva marca: el instrumento puede estar mirando '
      + 'solo el tranvía y no habría forma de distinguirlo');
    log('      ⇒ ✅ NO es un filtro de tranvía: caza "Av. De Montañana / Cno. B. Las Flores".');
    log('');
    log('   ⭐ Y los MIXTOS salen CERO al umbral de ' + UMBRAL_M + ' m. Un cero se publica con su');
    log('     cobertura y su provocación (ley 156), o no se publica:');
    const mix15 = norm.pares.filter((p) => p.clase === 'mixto' && p.m <= UMBRAL_M).length;
    di('   pares mixtos marcados a ' + UMBRAL_M + ' m', mix15);
    A.exige(mix15 === 0, `salen ${mix15} pares mixtos marcados y se midieron 0`);
    for (const U of [25, 55]) {
      const m2 = marcar(P, U);
      const nb2 = [...m2.keys()].filter((c) => modoDe.get(c) === 'bus').length;
      const mx2 = norm.pares.filter((p) => p.clase === 'mixto' && p.m <= U).length;
      log('      con el umbral a ' + String(U).padStart(3) + ' m ⇒ postes de bus ' + String(nb2).padStart(3)
        + ' · pares mixtos ' + mx2 + (mx2 > 0 ? '   ✅ el instrumento SÍ los ve' : ''));
    }
    const mix55 = norm.pares.filter((p) => p.clase === 'mixto' && p.m <= 55).length;
    A.exige(mix55 > 0, 'ni subiendo el umbral a 55 m aparece un par mixto: el instrumento no está '
      + 'cruzando bus con tranvía y su cero no significa nada');
    log('      ⇒ ✅ el cero de mixtos es del DATO (los 4 pares están a 48,3 · 52,2 · 71,6 · 170,5 m),');
    log('        no del instrumento.');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P8 · LA SIMETRÍA, COMPROBADA SOBRE EL UNIVERSO
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P8 · LA SIMETRÍA — si A tiene a B, B tiene a A');
  raya('─');
  {
    let rotas = 0, comprobadas = 0, distDistinta = 0;
    for (const [code, x] of marca) {
      for (const o of x.otras) {
        comprobadas++;
        const y = marca.get(o.code);
        const vuelta = y && y.otras.find((z) => z.code === code);
        if (!vuelta) { rotas++; continue; }
        if (Math.abs(vuelta.m - o.m) > 0.05) distDistinta++;
      }
    }
    di('relaciones comprobadas (A→B)', comprobadas);
    di('sin vuelta (B no tiene a A)', rotas + (rotas ? '   ⛔' : '   ✅'));
    di('con la vuelta a distinta distancia', distDistinta + (distDistinta ? '   ⛔' : '   ✅'));
    A.exige(rotas === 0, `${rotas} marcas no son simétricas`);
    A.exige(distDistinta === 0, `${distDistinta} marcas dan distinta distancia en cada sentido`);
    // ⭐ el uno que acompaña al cero: que la comprobación sepa ponerse roja
    const roto = new Map([...marca].map(([k, v]) => [k, { n: v.n, otras: v.otras.slice() }]));
    const victima = [...roto.keys()][0];
    const suOtra = roto.get(victima).otras[0].code;
    roto.get(suOtra).otras = roto.get(suOtra).otras.filter((z) => z.code !== victima);
    let rotas2 = 0;
    for (const [code, x] of roto) for (const o of x.otras) {
      const y = roto.get(o.code);
      if (!y || !y.otras.find((z) => z.code === code)) rotas2++;
    }
    di('⭐ provocado: se borra una vuelta a mano', rotas2 > 0 ? '✅ la caza (' + rotas2 + ')' : '⛔ NO la caza');
    A.exige(rotas2 > 0, 'la comprobación de simetría no caza una vuelta borrada: su cero no vale');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P9 · EL TEXTO DE LA MARCA, CON LA LEY 157 PASADA
  // ───────────────────────────────────────────────────────────────────────────
  log('');
  raya('─');
  log('P9 · ⭐⭐⭐ EL TEXTO DE LA MARCA — la ley 157 al nombre Y al texto');
  raya('─');
  log('   campo:  mismoNombreCerca');
  log('   texto:  ' + AVISO_MARCA.replace(/(.{1,88})(\s|$)/g, '$1\n           ').trimEnd());
  log('');
  {
    // ⛔ El guardián se escribe desde el NÚCLEO de lo prohibido, no desde la frase
    //   que se me ocurrió (ley 162). Lo prohibido es AFIRMAR identidad.
    const PROHIBIDAS = [/\bes la misma parada\b/i, /\bson la misma parada\b/i,
      /\bmisma estaci[óo]n\b/i, /\bson el mismo sitio\b/i, /\bes un mismo sitio\b/i,
      /\bson dos andenes\b/i, /\bmismo poste\b/i];
    const NEGADAS = /NO afirma|no lo sabe|no lo dice/i;
    // ⭐⭐ LA COMPROBACIÓN QUE DE VERDAD AGUANTA ES LA POSITIVA: que el texto DIGA
    //   las tres cosas. Un contenido exigido no se puede fingir con una negación.
    const dicePostes = /POSTES/.test(AVISO_MARCA);
    const diceParent = /parent_station/.test(AVISO_MARCA) && /984/.test(AVISO_MARCA);
    const diceQueNoAfirma = /NO afirma/.test(AVISO_MARCA);
    di('dice «este proyecto modela POSTES»', dicePostes ? '✅' : '⛔ NO');
    di('dice que el feed no trae parent_station en las 984', diceParent ? '✅' : '⛔ NO');
    di('dice explícitamente que NO afirma identidad', diceQueNoAfirma ? '✅' : '⛔ NO');
    A.exige(dicePostes && diceParent && diceQueNoAfirma,
      'el texto de la marca no dice las tres cosas que tiene que decir: que este proyecto modela '
      + 'POSTES, que el feed no trae parent_station en ninguna de las 984, y que no afirma identidad');
    // ── y la NEGATIVA, con su límite dicho en voz alta ────────────────────────
    const pilladas = PROHIBIDAS.filter((re) => re.test(AVISO_MARCA));
    const sinAfirmar = pilladas.filter((re) => !NEGADAS.test(AVISO_MARCA.slice(0, AVISO_MARCA.search(re))));
    di('patrones de identidad en el texto', pilladas.length + '  ⇒ sin negación delante: ' + sinAfirmar.length);
    log('      ⚠️ LÍMITE DE ESTE GUARDIÁN, declarado (ley 162): **no sabe distinguir una');
    log('        afirmación de su negación**. «NO afirma que sean la misma parada» contiene');
    log('        la frase prohibida. Lo único que hace es mirar si hay una negación DELANTE,');
    log('        y eso se rompe con una frase más larga. ⇒ Es un aviso, no una red; la red');
    log('        son las tres comprobaciones POSITIVAS de arriba.');
    A.exige(sinAfirmar.length === 0,
      `el texto de la marca AFIRMA identidad: ${sinAfirmar.map((r) => r.source).join(' · ')}`);
    // ⭐ provocación (ley 156): el guardián con la frase mala dentro
    const malo = AVISO_MARCA + ' En realidad es la misma parada.';
    const cazado = PROHIBIDAS.some((re) => re.test(malo));
    di('⭐ provocado: se le añade «es la misma parada»', cazado ? '✅ lo caza' : '⛔ NO lo caza');
    A.exige(cazado, 'el guardián del texto no caza una afirmación de identidad: su cero no vale');
  }

  log('');
  raya();
  log(A.cierre('LA MARCA DE MISMO NOMBRE'));
}
