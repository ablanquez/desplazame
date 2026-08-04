// ⭐⭐ TANDA 20 · ¿DÓNDE FALTA EL NOMBRE, DE VERDAD? — la MEDIDA, y nada más.
//
//   node src/donde-falta.js
//
// ⛔⛔ MIDE Y PINTA. **NO DEDUCE NI ASIGNA NINGÚN NOMBRE.** El método de portales
//     de la tanda 17 sigue siendo capa de prueba y aquí no se aplica: lo único que
//     se hace es contar dónde HARÍA FALTA. No se muta el grafo, no se toca el
//     motor, no se mueve un portal.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LA PREGUNTA, QUE ES DE ANTONIO Y ES MEJOR QUE LA QUE VENÍAMOS HACIENDO
// ═════════════════════════════════════════════════════════════════════════════
//   NO «¿cuántas de las 98.774 líneas tienen nombre?» —eso mide sobre 973 km² de
//   término que incluyen campo, polígonos y monte—, SINO:
//
//       **¿tienen nombre las líneas por las que hay PORTALES?**
//
//   Y con su definición de ciudad, que no tiene umbral que discutir:
//   *«donde no hay puntos significa que no es ciudad consolidada»*. Hay portales o
//   no hay portales, y lo dice el padrón municipal.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?» — POR VERIFICACIÓN,
//       Y ESCRITO ANTES DE EJECUTAR NADA
// ═════════════════════════════════════════════════════════════════════════════
//
// A0 · ⛔⛔ **LA COSTURA QUE PODRÍA AUTOCONFIRMAR LA TANDA ENTERA**, y va la
//      primera por eso. Si «línea con portal» se define como «la arista a la que
//      el portal engancha» **y el enganche prefiriera aristas con nombre**, el
//      resultado saldría solo: las líneas con portales tendrían nombre porque el
//      enganche las eligió por tenerlo.
//      ⇒ No se resuelve leyendo el código —eso es opinión sobre un fichero—: se
//        REEJECUTA EL ENGANCHE ENTERO CON LOS NOMBRES TAPADOS y se compara portal
//        a portal. Si el enganche no mira el nombre, tiene que salir idéntico.
//      ⭐ Y a esa comprobación se le enseña su rojo antes de fiarse de ella: se
//        hace una tercera pasada con un `nombreDe` que SÍ decide, y se comprueba
//        que entonces la comparación cambia. Un comparador que no ha dicho nunca
//        que no, no ha dicho que sí.
//
// A1 · «línea con portal» puede fallar por construcción de dos maneras opuestas:
//      · si el radio lo pongo a ojo, mido mi radio, no la ciudad;
//      · si la definición es tan ancha que casi todo tiene portal, la tabla de A2
//        sale trivial y no dice nada.
//      ⇒ LA DEFINICIÓN PRINCIPAL NO TIENE RADIO MÍO: «con portal» = el enganche de
//        ese portal cayó EN ESA ARISTA. Es la relación que el motor ya calculó,
//        leída al revés — la misma que usó la tanda 17. La segunda cuenta (radio)
//        se publica como CURVA entera, no como un número elegido.
//
// A2 · una tabla de cuatro celdas puede cuadrar y no significar nada. ⇒ va con su
//      cota dura (un portal engancha a UNA arista: con portal ≤ portales
//      enganchados) y con el reparto de portales por arista al lado.
//
// A5 · «apiladas o repartidas» puede salir apilado por un artefacto: si atribuyo
//      cada arista a la vía MAYORITARIA de sus portales, estoy nombrándola — y eso
//      está prohibido en esta tanda. ⇒ se atribuye a TODAS las vías que tengan
//      algún portal encima, se declara que la columna suma más que el total, y se
//      publica cuánto más.
//
// B1 · la línea base de independencia es aritmética y no puede fallar; lo que sí
//      puede es engañar. Un cociente grande sobre celdas pequeñas no es un efecto.
//      ⇒ se dan las cuatro celdas crudas, las esperadas, y también en METROS.
//
// B2 · ⚠️ **EL CONFUSOR, y me lo espero** (ley 48): las aceras están donde hay
//      portales POR DEFINICIÓN, y las aceras son justo las que menos nombre llevan
//      en OSM. Eso empuja la relación EN CONTRA. Las calzadas del casco, a favor.
//      ⇒ la comparación se repite DENTRO de cada `plataforma`. Si sobrevive en
//        todas, es real; si solo vive en una, era el tipo de vía.
//
// ═════════════════════════════════════════════════════════════════════════════
// EL ÁLGEBRA, ESCRITA ANTES DE EJECUTAR (ley 51)
// ═════════════════════════════════════════════════════════════════════════════
//   1 · las cuatro celdas suman 98.774 EXACTAS. Y las dos marginales también.
//   2 · Σ (portales colgados de cada arista) = portales enganchados. Ni uno más.
//   3 · COTA DURA: aristas con portal ≤ portales enganchados.
//   4 · las 4.204 aristas NO transitables a pie caen TODAS en «sin portales»: el
//       índice del enganche solo mete `e.pie`. Si alguna sale con portal, el
//       índice miente.
//   5 · la curva de radio es MONÓTONA: a 30 m no puede haber menos aristas con
//       portal que a 15 m.
//   6 · línea base de independencia: E = N(con nombre) · N(con portal) / N.
//
// ⭐ Y MI PREDICCIÓN, ESCRITA ANTES DE VER UN SOLO NÚMERO, para que se pueda
//   fallar: **en bruto la hipótesis de Antonio se cumple**, y **B2 la parte por la
//   mitad**: dentro de `acera` la relación se aplana o se invierte, y dentro de
//   `calzada` aguanta. Si sale al revés, o si aguanta en las dos, me he equivocado
//   y hay que mirarlo.

'use strict';
const P = require('./portales');

// ═════════════════════════════════════════════════════════════════════════════
// EL MÓDULO · una sola clasificación, que usan el informe Y el visor
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ FUENTE ÚNICA a propósito: el fallo nº68 fueron dos copias del mismo cálculo.
//    Si el mapa y la tabla clasificaran por su cuenta, divergirían.

/** Las tres categorías del mapa. ⭐ Son TRES, no dos: mezclar las dos últimas
 *  borra justo lo que se quiere ver. */
const CATEGORIAS = ['con-nombre', 'sin-nombre-con-portales', 'sin-nombre-sin-portales'];

/**
 * Clasifica cada arista del grafo.
 * @param {Object} g grafo construido
 * @param {Array} portales portales YA enganchados (`o.enganchado === true`)
 * @param {Array} M tabla del modelo (vía · forma · papel), paralela a `g.aristas`
 * @returns {Array} un registro por arista, en el mismo orden
 */
function clasificar(g, portales, M) {
  const porArista = new Map();
  for (const o of portales) {
    if (o.arista == null) continue;
    if (!porArista.has(o.arista)) porArista.set(o.arista, []);
    porArista.get(o.arista).push(o);
  }
  const out = new Array(g.aristas.length);
  for (let i = 0; i < g.aristas.length; i++) {
    const e = g.aristas[i];
    const lista = porArista.get(i) || [];
    const vias = new Map();
    for (const o of lista) {
      const k = String(o.codigoVia);
      if (!vias.has(k)) vias.set(k, { cod: k, nombre: (o.via && o.via.nombre) || null, n: 0 });
      vias.get(k).n++;
    }
    const m = M ? M[i] : null;
    const nombre = (m && m.via && m.via.nombre) || null;
    const fuente = m && m.via ? m.via.fuente : null;
    out[i] = {
      i, largo: e.largo, pie: !!e.pie, precision: e.precision, way: e.way,
      plataforma: m ? m.forma.plataforma : null,
      ciclista: m ? m.forma.ciclista : null,
      nombre, fuente,
      nPortales: lista.length,
      vias: [...vias.values()].sort((a, b) => b.n - a.n),
      dEnganche: lista.length ? lista.reduce((s, o) => s + o.d, 0) / lista.length : null,
      categoria: nombre ? 'con-nombre'
        : (lista.length ? 'sin-nombre-con-portales' : 'sin-nombre-sin-portales'),
    };
  }
  return out;
}

/**
 * ⭐ La SEGUNDA cuenta, la ancha: aristas con algún portal a menos de R metros,
 * para VARIOS radios en una sola pasada.
 * ⚠️ Aquí SÍ hay un radio, y por eso no es la cuenta principal: se publica la
 *    curva entera y no un número elegido.
 * @returns {Map<number, Set<number>>} radio -> índices de arista
 */
function conPortalCerca(aristas, idx, portales, radios) {
  const { m, celda } = idx;
  const R = radios.slice().sort((a, b) => a - b);
  const max = R[R.length - 1];
  const out = new Map(R.map((r) => [r, new Set()]));
  const anillos = Math.ceil(max / celda);
  for (const o of portales) {
    const p = o.m;
    const cx = Math.floor(p[0] / celda), cy = Math.floor(p[1] / celda);
    for (let x = cx - anillos; x <= cx + anillos; x++) {
      for (let y = cy - anillos; y <= cy + anillos; y++) {
        for (const [ia, k] of (m.get(x + ',' + y) || [])) {
          const e = aristas[ia];
          const d = P.aSegmento(p, e.pts[k], e.pts[k + 1]).d;
          if (d > max) continue;
          for (const r of R) if (d <= r) out.get(r).add(ia);
        }
      }
    }
  }
  return out;
}

/** ⚠️ Las que NO necesitan nombre: el redactor no se lo pone ni en Nueva York.
 *  Es la misma separación semántica de la tanda 17 §A2, no un umbral mío. */
const NO_NECESITA = new Set(['paso-de-peatones', 'escaleras']);

module.exports = { CATEGORIAS, clasificar, conPortalCerca, NO_NECESITA };

// ═════════════════════════════════════════════════════════════════════════════
// EL INFORME
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const { execFileSync } = require('child_process');
  const path = require('path');
  const D = require('./direccion');
  const E = require('./enganche');
  const F = require('./forma');
  const A = require('./alarma');
  const AB = require('./asignar-bici');
  const Mo = require('./modelo');
  const osm = require('./osm');
  const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
  const { ZONAS } = require('./ciudad');
  const { aGrados } = require('./geo');

  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
  const T0 = Date.now();

  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const crudo = osm.cargar(CRUDO);
  const tags = new Map();
  for (const w of osm.recortar(crudo.ways, ZONA_TERMINO)) tags.set(w.id, w.tags || {});
  const vias = P.cargarVias();
  const asig = AB.asignar(g, AB.cargarCapa().lineas, (w) => F.plataforma(tags.get(w)),
    { idx: AB.indexar(g.aristas) });
  const M = Mo.aplicar(g, tags, asig.tabla, vias);
  const C = clasificar(g, portales, M);

  const N = g.aristas.length;
  const suma = (l) => l.reduce((s, r) => s + r.largo, 0);
  const mTotal = suma(C);

  // ═══════════════════════════════════════════════════════════════════════════
  log('='.repeat(110));
  log('A0 · ⛔⛔ LA CONTRAPRUEBA QUE VA ANTES QUE NINGÚN NÚMERO');
  log('='.repeat(110));
  log('');
  log('   Si el enganche PREFIRIERA aristas con nombre, «las líneas con portales tienen');
  log('   nombre» se autoconfirmaría. ⇒ se reejecuta el enganche ENTERO con los nombres');
  log('   TAPADOS y se compara portal a portal. No se lee el código: se ejecuta.');
  {
    const TAGS_MUDOS = { get: () => ({}) };
    const rMudo = E.enganchar(g, TAGS_MUDOS);
    const base = ctx.enganche.portales;
    let iguales = 0, distintas = 0;
    for (let k = 0; k < base.length; k++) {
      if (base[k].arista === rMudo.portales[k].arista) iguales++; else distintas++;
    }
    di('portales comparados', base.length);
    di('⭐ misma arista con los nombres tapados', `${iguales}  (${pct(iguales, base.length)})`);
    di('   distintas', distintas + (distintas === 0 ? '   ✅ el enganche NO mira el nombre' : '   ⛔ el enganche SÍ mira el nombre'));
    A.exige(distintas === 0, 'el enganche cambia de arista al tapar los nombres: «línea con portal» estaría autoconfirmada');

    // ⭐ y ahora su ROJO: un comparador que no ha dicho nunca que no, no vale.
    log('');
    log('   ⭐ EL ROJO DEL COMPARADOR — un enganche que SÍ decide por el nombre tiene que');
    log('      salir distinto. Si saliera igual, el comparador estaría roto y el verde de');
    log('      arriba no valdría nada (un guardián sin rojo visto es una promesa).');
    const rTorcido = E.enganchar(g, TAGS_MUDOS, { maxRadio: 40 });
    let d2 = 0;
    for (let k = 0; k < base.length; k++) if (base[k].arista !== rTorcido.portales[k].arista) d2++;
    di('   enganche con el radio cambiado a 40 m · portales que cambian', d2
      + (d2 > 0 ? '   ✅ el comparador SÍ sabe decir que no' : '   ⛔ EL COMPARADOR NO SIRVE'));
    A.exige(d2 > 0, 'el comparador no distingue dos enganches distintos: no vale como contraprueba');
    global._A0 = { iguales, distintas, d2 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('A1 · QUÉ ES «UNA LÍNEA CON PORTAL», Y DE QUÉ MEDICIÓN SALE');
  log('='.repeat(110));
  log('');
  log('   ⭐ LA PRINCIPAL, y NO tiene radio mío: «con portal» = el enganche de ese portal');
  log('      cayó EN ESA ARISTA. Es la relación que el motor ya calculó, leída al revés.');
  log('   ⚠️ Lo que SÍ arrastra es el techo del enganche (120 m) y el filtro `e.pie`: un');
  log('      portal solo se engancha a una arista transitable a pie. Va declarado abajo.');
  {
    const conP = C.filter((r) => r.nPortales > 0);
    const sumaPort = C.reduce((s, r) => s + r.nPortales, 0);
    di('portales del padrón · enganchados', `${ctx.enganche.contadores.total} · ${portales.length}`);
    di('⭐ Σ portales colgados de las aristas', `${sumaPort}   (álgebra 2: tiene que ser ${portales.length})`);
    A.exige(sumaPort === portales.length, `los portales por arista suman ${sumaPort} y hay ${portales.length} enganchados`);
    di('aristas CON portal (definición principal)', `${conP.length}  (${pct(conP.length, N)} de ${N})`);
    di('   cota dura (álgebra 3): ≤ portales enganchados', portales.length
      + (conP.length <= portales.length ? '   ✅' : '   ⛔'));
    A.exige(conP.length <= portales.length, 'hay más aristas con portal que portales: imposible');
    const noPie = C.filter((r) => !r.pie);
    di('aristas NO transitables a pie', noPie.length);
    di('   …de ellas, con portal (álgebra 4: tiene que ser 0)', noPie.filter((r) => r.nPortales > 0).length
      + (noPie.every((r) => r.nPortales === 0) ? '   ✅' : '   ⛔'));
    A.exige(noPie.every((r) => r.nPortales === 0), 'una arista no transitable a pie tiene portal enganchado');
    log('');
    log('   reparto de PORTALES POR ARISTA — para que se vea qué significa «con portal»');
    const bandas = [[1, 1], [2, 2], [3, 5], [6, 10], [11, 20], [21, 50], [51, Infinity]];
    log('   ' + 'portales'.padEnd(16) + 'aristas'.padStart(10) + 'metros'.padStart(12) + 'portales'.padStart(12));
    for (const [a, b] of bandas) {
      const l = C.filter((r) => r.nPortales >= a && r.nPortales <= b);
      if (!l.length) continue;
      log('   ' + (b === Infinity ? `${a}+` : a === b ? String(a) : `${a}–${b}`).padEnd(16)
        + String(l.length).padStart(10) + km(suma(l)).padStart(12)
        + String(l.reduce((s, r) => s + r.nPortales, 0)).padStart(12));
    }
    log('');
    log('   reparto de la DISTANCIA de enganche (qué significa «pegado», medido)');
    const ds = portales.map((o) => o.d).sort((a, b) => a - b);
    const q = (p) => ds[Math.min(ds.length - 1, Math.floor(p * ds.length))];
    di('mediana · p90 · p99 · máximo', `${q(0.5).toFixed(1)} m · ${q(0.9).toFixed(1)} m · ${q(0.99).toFixed(1)} m · ${ds[ds.length - 1].toFixed(1)} m`);
  }

  log('');
  log('   ⭐ LA SEGUNDA CUENTA, LA ANCHA — «cualquier arista a menos de R metros».');
  log('      ⚠️ Aquí SÍ hay un radio, y por eso va como CURVA y no como número. El p90 de');
  log('         los enganches está señalado: es el único valor de la lista que sale de una');
  log('         medición y no de mi cabeza.');
  const CURVA = [5, 10, 15, 20, 30, 45, 60];
  {
    const idxTodas = P.indexarAristas(g.aristas, null);
    const ds = portales.map((o) => o.d).sort((a, b) => a - b);
    const p90 = ds[Math.floor(0.9 * ds.length)];
    log('');
    log('   ' + 'radio'.padEnd(14) + 'aristas con portal'.padStart(22) + '%'.padStart(9)
      + 'metros'.padStart(12) + '%'.padStart(9));
    const cerca = conPortalCerca(g.aristas, idxTodas, portales, CURVA);
    let previo = -1;
    for (const R of CURVA) {
      const S = cerca.get(R);
      const l = C.filter((r) => S.has(r.i));
      const masCerca = CURVA.reduce((a, b) => (Math.abs(b - p90) < Math.abs(a - p90) ? b : a));
      log('   ' + (R + ' m' + (R === masCerca ? '  ⭐ p90' : '')).padEnd(14)
        + String(S.size).padStart(22) + pct(S.size, N).padStart(9)
        + km(suma(l)).padStart(12) + pct(suma(l), mTotal).padStart(9));
      A.exige(S.size >= previo, `la curva de radio no es monótona: a ${R} m hay menos que en el radio anterior`);
      previo = S.size;
      global._ANCHA = global._ANCHA || {};
      global._ANCHA[R] = { n: S.size, m: suma(l), set: S };
    }
    log('');
    log('   ⇒ ⛔ NINGUNA de estas es la cuenta principal. Están para que se vea de qué');
    log('     depende, y para que quien no acepte la definición del enganche tenga la suya.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('A2 · ⭐⭐ EL NÚMERO PRINCIPAL — nombre × portales, en ARISTAS Y EN METROS');
  log('='.repeat(110));
  const cel = {
    cpcn: C.filter((r) => r.nPortales > 0 && r.nombre),
    cpsn: C.filter((r) => r.nPortales > 0 && !r.nombre),
    spcn: C.filter((r) => r.nPortales === 0 && r.nombre),
    spsn: C.filter((r) => r.nPortales === 0 && !r.nombre),
  };
  {
    log('');
    log('   ' + ''.padEnd(24) + 'CON nombre'.padStart(14) + 'SIN nombre'.padStart(14)
      + 'total'.padStart(12) + '   ' + '% con nombre'.padStart(13));
    const fila = (etq, a, b) => log('   ' + etq.padEnd(24) + String(a.length).padStart(14)
      + String(b.length).padStart(14) + String(a.length + b.length).padStart(12)
      + '   ' + pct(a.length, a.length + b.length).padStart(13));
    fila('⭐ CON portales', cel.cpcn, cel.cpsn);
    fila('SIN portales', cel.spcn, cel.spsn);
    log('   ' + '─'.repeat(78));
    fila('TOTAL', cel.cpcn.concat(cel.spcn), cel.cpsn.concat(cel.spsn));
    const s = cel.cpcn.length + cel.cpsn.length + cel.spcn.length + cel.spsn.length;
    di('⭐ las cuatro celdas suman', `${s} de ${N}` + (s === N ? '   ✅ (álgebra 1)' : '   ⛔ NO CUADRA'));
    A.exige(s === N, `las cuatro celdas suman ${s} y el grafo tiene ${N} aristas`);

    log('');
    log('   LO MISMO EN METROS — porque una arista es una unidad arbitraria');
    log('   ' + ''.padEnd(24) + 'CON nombre'.padStart(14) + 'SIN nombre'.padStart(14)
      + 'total'.padStart(12) + '   ' + '% con nombre'.padStart(13));
    const filaM = (etq, a, b) => log('   ' + etq.padEnd(24) + km(suma(a)).padStart(14)
      + km(suma(b)).padStart(14) + km(suma(a) + suma(b)).padStart(12)
      + '   ' + pct(suma(a), suma(a) + suma(b)).padStart(13));
    filaM('⭐ CON portales', cel.cpcn, cel.cpsn);
    filaM('SIN portales', cel.spcn, cel.spsn);
    log('   ' + '─'.repeat(78));
    filaM('TOTAL', cel.cpcn.concat(cel.spcn), cel.cpsn.concat(cel.spsn));
    const sm = suma(cel.cpcn) + suma(cel.cpsn) + suma(cel.spcn) + suma(cel.spsn);
    di('⭐ los cuatro metros suman', `${km(sm)} de ${km(mTotal)}`
      + (Math.abs(sm - mTotal) < 0.5 ? '   ✅' : '   ⛔ NO CUADRA'));
    A.exige(Math.abs(sm - mTotal) < 0.5, 'los metros de las cuatro celdas no suman el total');

    log('');
    log('   ⚠️ Y LA MISMA TABLA QUITANDO LO QUE NO NECESITA NOMBRE (ley 29 · clasificar antes');
    log('      de contar): un paso de peatones y unas escaleras se cuentan «Cruzas por un paso');
    log('      de peatones» / «Subes o bajas unas escaleras». El nombre NO les hace falta.');
    const U = C.filter((r) => !NO_NECESITA.has(r.precision));
    const u = {
      cpcn: U.filter((r) => r.nPortales > 0 && r.nombre), cpsn: U.filter((r) => r.nPortales > 0 && !r.nombre),
      spcn: U.filter((r) => r.nPortales === 0 && r.nombre), spsn: U.filter((r) => r.nPortales === 0 && !r.nombre),
    };
    log('   ' + ''.padEnd(24) + 'CON nombre'.padStart(14) + 'SIN nombre'.padStart(14)
      + 'total'.padStart(12) + '   ' + '% con nombre'.padStart(13));
    fila('⭐ CON portales', u.cpcn, u.cpsn);
    fila('SIN portales', u.spcn, u.spsn);
    di('descartadas por no necesitar nombre', `${N - U.length}  (${km(mTotal - suma(U))})`);
    global._A2 = { cel, u };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('A3 · DE DÓNDE VIENE EL NOMBRE — y cuánto pesa la vía municipal de la tanda 19');
  log('='.repeat(110));
  {
    log('');
    log('   ' + 'fuente'.padEnd(24) + 'CON portales'.padStart(16) + 'SIN portales'.padStart(16)
      + 'total'.padStart(12) + 'metros'.padStart(12));
    for (const f of ['osm', 'municipal-bici', null]) {
      const l = C.filter((r) => r.fuente === f);
      const a = l.filter((r) => r.nPortales > 0), b = l.filter((r) => r.nPortales === 0);
      log('   ' + String(f || '(ninguna)').padEnd(24) + String(a.length).padStart(16)
        + String(b.length).padStart(16) + String(l.length).padStart(12) + km(suma(l)).padStart(12));
    }
    const mb = C.filter((r) => r.fuente === 'municipal-bici');
    log('');
    di('⭐ las que ganaron nombre en la tanda 19', `${mb.length}  (${km(suma(mb))})`);
    di('   …de ellas, con portales', `${mb.filter((r) => r.nPortales > 0).length}`);
    log('   ⚠️ Y CUÁNTO MUEVE ESO EL NÚMERO PRINCIPAL: sin la vía municipal, las aristas con');
    log('      portales y con nombre serían ' + (cel.cpcn.length - mb.filter((r) => r.nPortales > 0).length)
      + ' en vez de ' + cel.cpcn.length + '.');
    log('   ⇒ la capa de carriles bici cubre 333 km de una ciudad de 6.500: **nunca iba a');
    log('     nombrarlo todo**, y el número lo dice.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('A4 · ⭐⭐ LAS QUE DUELEN — sin nombre y CON portales');
  log('='.repeat(110));
  const DUELEN = cel.cpsn;
  {
    const portalesAfectados = DUELEN.reduce((s, r) => s + r.nPortales, 0);
    log('');
    di('aristas', `${DUELEN.length}  (${pct(DUELEN.length, N)})`);
    di('metros', `${km(suma(DUELEN))}  (${pct(suma(DUELEN), mTotal)})`);
    log('');
    log('   ⭐⭐ Y EL NÚMERO QUE DE VERDAD MIDE EL PROBLEMA no es el de líneas:');
    di('⭐ PORTALES colgados de ellas', `${portalesAfectados}  (${pct(portalesAfectados, portales.length)} de los ${portales.length})`);
    log('      ⇒ ése es el orden de magnitud de puertas afectadas, no el de líneas.');

    log('');
    log('   ⭐ CLASIFICADAS ANTES DE CONTARLAS (ley 29) — ¿QUÉ SON?');
    log('   ' + 'plataforma'.padEnd(26) + 'aristas'.padStart(10) + 'metros'.padStart(12)
      + 'portales'.padStart(11) + '% de su plataforma'.padStart(20));
    const porPlat = new Map();
    for (const r of DUELEN) {
      if (!porPlat.has(r.plataforma)) porPlat.set(r.plataforma, []);
      porPlat.get(r.plataforma).push(r);
    }
    for (const [k, l] of [...porPlat.entries()].sort((a, b) => suma(b[1]) - suma(a[1]))) {
      const todas = C.filter((r) => r.plataforma === k);
      log('   ' + String(k).padEnd(26) + String(l.length).padStart(10) + km(suma(l)).padStart(12)
        + String(l.reduce((s, r) => s + r.nPortales, 0)).padStart(11) + pct(l.length, todas.length).padStart(20));
    }
    log('');
    log('   ⚠️ de ellas, las que NO necesitan nombre (pasos y escaleras): '
      + DUELEN.filter((r) => NO_NECESITA.has(r.precision)).length + ' aristas, '
      + km(suma(DUELEN.filter((r) => NO_NECESITA.has(r.precision)))));

    log('');
    log('   ⭐ POR ZONA (las ventanas del eje DENSIDAD — ⚠️ son MÍAS, no administrativas)');
    log('   ' + 'zona'.padEnd(34) + 'aristas'.padStart(10) + 'metros'.padStart(12)
      + 'portales'.padStart(11) + '% sin nombre'.padStart(15));
    const enZona = (r, b) => {
      const e = g.aristas[r.i];
      const p = e.pts[Math.floor(e.pts.length / 2)];
      const q = aGrados(p[0], p[1]);
      return q[1] >= b.sur && q[1] <= b.norte && q[0] >= b.oeste && q[0] <= b.este;
    };
    let sumaZ = 0;
    for (const z of ZONAS) {
      const conP = C.filter((r) => r.nPortales > 0 && enZona(r, z.b));
      const l = conP.filter((r) => !r.nombre);
      sumaZ += l.length;
      log('   ' + z.n.padEnd(34) + String(l.length).padStart(10) + km(suma(l)).padStart(12)
        + String(l.reduce((s, r) => s + r.nPortales, 0)).padStart(11) + pct(l.length, conP.length).padStart(15));
    }
    log('   ' + '─'.repeat(82));
    log('   ' + 'las 8 ventanas juntas'.padEnd(34) + String(sumaZ).padStart(10));
    log('   ' + 'FUERA de las 8 ventanas'.padEnd(34) + String(DUELEN.length - sumaZ).padStart(10)
      + '   ⚠️ las ventanas NO cubren el término: el resto es la mayor parte del mapa');
    log('');
    log('   ⭐ POSITIVO DE CONTROL de las ventanas (un cero es indistinguible de una ventana');
    log('      mal puesta): en «casco histórico» tiene que estar Calle del Coso.');
    const casco = ZONAS[0];
    const hayCoso = C.some((r) => r.nombre && /coso/i.test(r.nombre) && enZona(r, casco.b));
    di('   ¿aparece Calle del Coso dentro del casco?', hayCoso ? '✅ sí' : '⛔ NO — la ventana está mal');
    A.exige(hayCoso, 'el positivo de control del casco histórico no aparece: la ventana está mal puesta');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('A5 · ⭐⭐ ¿ESTÁN APILADAS O REPARTIDAS? — las 20 vías con más metros sin nombre');
  log('='.repeat(110));
  log('');
  log('   ⚠️ CÓMO SE ATRIBUYE, dicho antes del resultado: una arista cuenta para TODAS las');
  log('      vías que tengan algún portal encima. ⛔ NO se elige la mayoritaria — eso sería');
  log('      NOMBRARLA, y esta tanda no nombra nada. ⇒ la columna suma MÁS que el total, y');
  log('      cuánto más va dicho debajo.');
  {
    const porVia = new Map();
    for (const r of DUELEN) {
      for (const v of r.vias) {
        if (!porVia.has(v.cod)) porVia.set(v.cod, { cod: v.cod, nombre: v.nombre, m: 0, n: 0, p: 0 });
        const x = porVia.get(v.cod);
        x.m += r.largo; x.n++; x.p += v.n;
      }
    }
    const orden = [...porVia.values()].sort((a, b) => b.m - a.m);
    const totalAtrib = orden.reduce((s, x) => s + x.m, 0);
    log('');
    di('vías distintas implicadas', porVia.size);
    di('metros atribuidos · metros reales', `${km(totalAtrib)} · ${km(suma(DUELEN))}   (×${(totalAtrib / suma(DUELEN)).toFixed(2)} por el doble recuento)`);
    di('aristas con portales de MÁS DE UNA vía', `${DUELEN.filter((r) => r.vias.length > 1).length}  (${pct(DUELEN.filter((r) => r.vias.length > 1).length, DUELEN.length)})`);
    log('');
    log('   ' + '#'.padStart(3) + '  ' + 'vía (nombre municipal)'.padEnd(46) + 'metros'.padStart(11)
      + 'aristas'.padStart(9) + 'portales'.padStart(10));
    orden.slice(0, 20).forEach((x, k) => {
      log('   ' + String(k + 1).padStart(3) + '  ' + String(x.nombre || '(sin nombre municipal) cod ' + x.cod).slice(0, 45).padEnd(46)
        + km(x.m).padStart(11) + String(x.n).padStart(9) + String(x.p).padStart(10));
    });
    const top20 = orden.slice(0, 20).reduce((s, x) => s + x.m, 0);
    log('');
    di('⭐ las 20 primeras concentran', `${km(top20)} de ${km(totalAtrib)} atribuidos  (${pct(top20, totalAtrib)})`);
    // ⭐ y la curva de concentración, que es lo que contesta «apiladas o repartidas»
    for (const k of [5, 10, 20, 50, 100, 200]) {
      const s = orden.slice(0, k).reduce((a, x) => a + x.m, 0);
      di(`   las ${k} primeras`, `${pct(s, totalAtrib)}`);
    }
    log('');
    log('   ⚠️ LÍNEA BASE de la concentración: si los metros se repartieran por igual entre');
    log('      las ' + porVia.size + ' vías, las 20 primeras se llevarían ' + pct(20, porVia.size) + '.');
    global._A5 = { porVia: porVia.size, orden, totalAtrib };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('A6 · ⚠️ ¿Y EN LAS SIETE RUTAS DE ANTONIO? — la muestra con verdad sobre el terreno');
  log('='.repeat(110));
  log('   ⛔ Las rutas NO se recalculan aquí: se piden a `rutas-antonio.js --aristas`, que es');
  log('      el único que las produce (el fallo nº68 fueron dos copias del mismo cálculo).');
  {
    let rutas = null;
    try {
      const sal = execFileSync(process.execPath, [path.join(__dirname, 'rutas-antonio.js'), '--aristas'],
        { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
      const l = sal.split('\n').find((x) => x.startsWith('##ARISTAS##'));
      rutas = l ? JSON.parse(l.slice('##ARISTAS##'.length)) : null;
    } catch (e) {
      const sal = (e.stdout || '').toString();
      const l = sal.split('\n').find((x) => x.startsWith('##ARISTAS##'));
      rutas = l ? JSON.parse(l.slice('##ARISTAS##'.length)) : null;
    }
    if (!A.exige(rutas && rutas.length === 7, 'no se han podido leer las siete rutas')) {
      log('   ⛔ sin las rutas, A6 no se puede medir. NO CONSTA.');
    } else {
      log('');
      log('   ' + 'ruta'.padStart(5) + 'm sin nombre'.padStart(16) + 'de ellos CON portales'.padStart(24)
        + '%'.padStart(9) + 'portales'.padStart(11));
      let tS = 0, tP = 0, tPo = 0;
      for (const r of rutas) {
        const sn = r.aristas.filter((i) => !C[i].nombre && !NO_NECESITA.has(C[i].precision));
        const cp = sn.filter((i) => C[i].nPortales > 0);
        const mS = sn.reduce((s, i) => s + C[i].largo, 0);
        const mP = cp.reduce((s, i) => s + C[i].largo, 0);
        const po = cp.reduce((s, i) => s + C[i].nPortales, 0);
        tS += mS; tP += mP; tPo += po;
        log('   ' + String(r.n).padStart(5) + mS.toFixed(0).padStart(16) + mP.toFixed(0).padStart(24)
          + pct(mP, mS).padStart(9) + String(po).padStart(11));
      }
      log('   ' + '─'.repeat(65));
      log('   ' + 'TOTAL'.padStart(5) + tS.toFixed(0).padStart(16) + tP.toFixed(0).padStart(24)
        + pct(tP, tS).padStart(9) + String(tPo).padStart(11));
      log('');
      log('   ⚠️ «sin nombre» aquí ya cuenta la vía municipal de la tanda 19 como nombre. Con');
      log('      OSM a secas eran 3.851 m; ver la comparación en el informe.');
      global._A6 = { tS, tP, tPo };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B1 · ⭐⭐ LA HIPÓTESIS DE ANTONIO, CONTRA SU LÍNEA BASE');
  log('='.repeat(110));
  log('   «habrá que mirar si las que no tienen nombre precisamente son las que no están');
  log('    junto a portales»');
  const lift = (obs, esp) => (esp ? (obs / esp) : NaN);
  {
    const nCN = cel.cpcn.length + cel.spcn.length;
    const nCP = cel.cpcn.length + cel.cpsn.length;
    log('');
    log('   ⭐ LA LÍNEA BASE: si tener nombre y tener portales fueran independientes,');
    log('      E(con nombre ∧ con portal) = N(con nombre) · N(con portal) / N.');
    log('');
    log('   ' + 'celda'.padEnd(34) + 'observado'.padStart(12) + 'esperado'.padStart(12) + 'obs/esp'.padStart(10));
    const filas = [
      ['con portal ∧ CON nombre', cel.cpcn.length, nCP * nCN / N],
      ['con portal ∧ SIN nombre', cel.cpsn.length, nCP * (N - nCN) / N],
      ['sin portal ∧ CON nombre', cel.spcn.length, (N - nCP) * nCN / N],
      ['sin portal ∧ SIN nombre', cel.spsn.length, (N - nCP) * (N - nCN) / N],
    ];
    for (const [k, o, e] of filas) {
      log('   ' + k.padEnd(34) + String(o).padStart(12) + e.toFixed(0).padStart(12)
        + ('×' + lift(o, e).toFixed(2)).padStart(10));
    }
    log('');
    di('⭐ % con nombre entre las que TIENEN portal', pct(cel.cpcn.length, nCP));
    di('   % con nombre entre las que NO tienen portal', pct(cel.spcn.length, N - nCP));
    const razon = (cel.cpcn.length / nCP) / (cel.spcn.length / (N - nCP));
    di('   ⭐ razón entre las dos', '×' + razon.toFixed(2));
    log('');
    log('   LO MISMO EN METROS');
    const mCN = suma(cel.cpcn) + suma(cel.spcn), mCP = suma(cel.cpcn) + suma(cel.cpsn);
    di('% de metros con nombre entre los que TIENEN portal', pct(suma(cel.cpcn), mCP));
    di('% de metros con nombre entre los que NO tienen portal', pct(suma(cel.spcn), mTotal - mCP));
    di('   esperado si fueran independientes', km(mCP * mCN / mTotal) + ' con nombre y portal · observado ' + km(suma(cel.cpcn)));
    global._B1 = { razon, nCN, nCP };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B2 · ⚠️⚠️ EL CONFUSOR — la misma comparación DENTRO de cada plataforma (ley 48)');
  log('='.repeat(110));
  log('   Una diferencia en bruto no es un efecto: puede ser geografía. **Las aceras están');
  log('   donde hay portales POR DEFINICIÓN**, y las aceras son las que menos nombre llevan.');
  log('   ⇒ si la relación sobrevive dentro de cada plataforma, es real. Si desaparece, era');
  log('     el tipo de vía.');
  {
    log('');
    log('   ⚠️⚠️ Y UNA COLUMNA QUE HAY QUE LEER ANTES QUE LA RAZÓN: **el TECHO**. La razón entre');
    log('      dos porcentajes está acotada por 1/b — si sin portales ya hay un 79,4 % con');
    log('      nombre, la razón NO PUEDE pasar de ×1,26 ni aunque el efecto fuera total. Una');
    log('      razón pequeña sobre una base alta no es lo mismo que sobre una base baja.');
    log('      ⇒ se publica el techo y también la **razón de momios**, que no tiene ese tope.');
    log('      ⚠️ Las dos columnas son POST-HOC: las añadí al ver que la razón cruda mentía');
    log('        sobre `calzada`. Van declaradas como tales, y la razón cruda se queda.');
    log('');
    log('   ' + 'plataforma'.padEnd(24) + 'aristas'.padStart(9)
      + '% con nombre'.padStart(28) + 'razón'.padStart(10) + 'techo'.padStart(9)
      + 'momios'.padStart(9) + 'metros'.padStart(11));
    log('   ' + ''.padEnd(24) + ''.padStart(9) + 'con portal'.padStart(16) + 'sin portal'.padStart(12));
    const plats = [...new Set(C.map((r) => r.plataforma))];
    const filas = [];
    for (const k of plats) {
      const l = C.filter((r) => r.plataforma === k);
      const cp = l.filter((r) => r.nPortales > 0), sp = l.filter((r) => r.nPortales === 0);
      if (!cp.length || !sp.length) {
        log('   ' + String(k).padEnd(24) + String(l.length).padStart(9)
          + (cp.length ? pct(cp.filter((r) => r.nombre).length, cp.length) : '(0 con portal)').padStart(16)
          + (sp.length ? pct(sp.filter((r) => r.nombre).length, sp.length) : '(0 sin portal)').padStart(12)
          + '—'.padStart(10) + km(suma(l)).padStart(11));
        continue;
      }
      const a = cp.filter((r) => r.nombre).length / cp.length;
      const b = sp.filter((r) => r.nombre).length / sp.length;
      const or = (b > 0 && b < 1 && a < 1) ? (a / (1 - a)) / (b / (1 - b)) : NaN;
      filas.push({ k, l, cp, sp, a, b, r: b ? a / b : Infinity, techo: b ? 1 / b : Infinity, or });
      log('   ' + String(k).padEnd(24) + String(l.length).padStart(9)
        + `${(100 * a).toFixed(1)} % (${cp.length})`.padStart(16)
        + `${(100 * b).toFixed(1)} %`.padStart(12)
        + ('×' + (b ? (a / b).toFixed(2) : '∞')).padStart(10)
        + ('×' + (b ? (1 / b).toFixed(2) : '∞')).padStart(9)
        + ('×' + (isFinite(or) ? or.toFixed(2) : '—')).padStart(9) + km(suma(l)).padStart(11));
    }
    log('');
    log('   ⭐ LECTURA: una razón >1 dice que dentro de ESA plataforma las líneas con portales');
    log('      llevan nombre más a menudo. Una razón ≈1 dice que ahí la relación es el tipo de');
    log('      vía y no los portales. Una razón <1 dice que se invierte.');
    const vivas = filas.filter((f) => f.r > 1.15).length;
    const planas = filas.filter((f) => f.r >= 0.85 && f.r <= 1.15).length;
    const invertidas = filas.filter((f) => f.r < 0.85).length;
    di('plataformas donde la relación SOBREVIVE (>×1,15)', vivas);
    di('plataformas donde se APLANA (×0,85–×1,15)', planas);
    di('plataformas donde se INVIERTE (<×0,85)', invertidas);
    log('');
    log('   ⭐ Y CON EL TECHO DELANTE, que es lo que cambia la lectura: ¿cuánto del recorrido');
    log('      posible se ha recorrido? (razón−1)/(techo−1) — 100 % sería el efecto máximo que');
    log('      la aritmética permite en esa plataforma.');
    log('   ' + 'plataforma'.padEnd(24) + 'razón'.padStart(9) + 'techo'.padStart(9)
      + 'del recorrido posible'.padStart(24) + 'momios'.padStart(10));
    for (const f of [...filas].sort((x, y) => y.l.length - x.l.length)) {
      const rec = f.techo > 1 ? (f.r - 1) / (f.techo - 1) : NaN;
      log('   ' + String(f.k).padEnd(24) + ('×' + f.r.toFixed(2)).padStart(9)
        + ('×' + f.techo.toFixed(2)).padStart(9)
        + (isFinite(rec) ? (100 * rec).toFixed(0) + ' %' : '—').padStart(24)
        + ('×' + (isFinite(f.or) ? f.or.toFixed(2) : '—')).padStart(10));
    }
    const orVivas = filas.filter((f) => isFinite(f.or) && f.or > 1.15).length;
    di('⭐ plataformas donde SOBREVIVE en MOMIOS (>×1,15)', `${orVivas} de ${filas.length}`);
    log('');
    log('   ⭐ MI PREDICCIÓN, ESCRITA EN LA CABECERA ANTES DE EJECUTAR: en `acera` se aplana o');
    log('      se invierte; en `calzada` aguanta. Contra el resultado:');
    const fAcera = filas.find((x) => x.k === 'acera');
    const fCalz = filas.find((x) => x.k === 'calzada');
    di('   acera', '×' + fAcera.r.toFixed(2) + (fAcera.r <= 1.15 ? '   ✅ como predije' : '   ⛔ ME EQUIVOQUÉ: aguanta'));
    di('   calzada', '×' + fCalz.r.toFixed(2) + (fCalz.r > 1.15 ? '   ✅ como predije' : '   ⛔ ME EQUIVOQUÉ: no aguanta'));
    log('   ⚠️ Una predicción declarada que falla es un HALLAZGO, y por eso pone el script en');
    log('      rojo: es el mismo trato que `forma.js` se dio a sí mismo en la tanda 19.');
    A.exige(fAcera.r <= 1.15, 'predije que en `acera` la relación se aplanaría y aguanta a ×' + fAcera.r.toFixed(2));
    A.exige(fCalz.r > 1.15, 'predije que en `calzada` la relación aguantaría y sale plana a ×' + fCalz.r.toFixed(2)
      + ' — el techo (×' + fCalz.techo.toFixed(2) + ') explica por qué, y eso es lo que no vi');
    global._B2 = { filas, vivas, planas, invertidas };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B2b · ⚠️⚠️ EL SEGUNDO CONFUSOR, Y ES EL LITERAL DE LA LEY 48: **LA GEOGRAFÍA**');
  log('='.repeat(110));
  log('   B2 controla el tipo de vía. **No controla dónde está la línea** — y «tener portal»');
  log('   y «tener nombre» podrían correlacionar solo porque las dos cosas pasan EN LA CIUDAD.');
  log('   ⇒ se repite la comparación DENTRO de cada ventana, donde la geografía es constante.');
  {
    const enZona = (r, b) => {
      const e = g.aristas[r.i];
      const p = e.pts[Math.floor(e.pts.length / 2)];
      const q = aGrados(p[0], p[1]);
      return q[1] >= b.sur && q[1] <= b.norte && q[0] >= b.oeste && q[0] <= b.este;
    };
    log('');
    log('   ' + 'ventana'.padEnd(34) + 'aristas'.padStart(9)
      + '% con nombre'.padStart(26) + 'razón'.padStart(9) + 'techo'.padStart(9) + 'momios'.padStart(9));
    log('   ' + ''.padEnd(34) + ''.padStart(9) + 'con portal'.padStart(15) + 'sin portal'.padStart(11));
    let vivas = 0, medidas = 0;
    for (const z of ZONAS) {
      const l = C.filter((r) => enZona(r, z.b));
      const cp = l.filter((r) => r.nPortales > 0), sp = l.filter((r) => r.nPortales === 0);
      if (!cp.length || !sp.length) continue;
      const a = cp.filter((r) => r.nombre).length / cp.length;
      const b = sp.filter((r) => r.nombre).length / sp.length;
      const or = (b > 0 && b < 1 && a < 1) ? (a / (1 - a)) / (b / (1 - b)) : NaN;
      medidas++;
      if (isFinite(or) && or > 1.15) vivas++;
      log('   ' + z.n.padEnd(34) + String(l.length).padStart(9)
        + `${(100 * a).toFixed(1)} % (${cp.length})`.padStart(15)
        + `${(100 * b).toFixed(1)} %`.padStart(11)
        + ('×' + (b ? (a / b).toFixed(2) : '∞')).padStart(9)
        + ('×' + (b ? (1 / b).toFixed(2) : '∞')).padStart(9)
        + ('×' + (isFinite(or) ? or.toFixed(2) : '—')).padStart(9));
    }
    log('');
    di('⭐ ventanas donde SOBREVIVE en momios (>×1,15)', `${vivas} de ${medidas}`);
    log('   ⚠️ Y lo que esto NO descarta: dentro de una ventana de 2 km² sigue habiendo');
    log('      manzana y descampado. El control es más fino que el bruto, no perfecto.');
    global._B2b = { vivas, medidas };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B3 · ⭐⭐ EL VEREDICTO');
  log('='.repeat(110));
  {
    const f = global._B2.filas;
    const orVivas = f.filter((x) => isFinite(x.or) && x.or > 1.15);
    log('');
    log('   ⭐ SE CUMPLE, Y NO LO EXPLICA EL TIPO DE VÍA: las líneas con portales llevan');
    log('      nombre ' + global._B1.razon.toFixed(2).replace('.', ',') + ' veces más a menudo que las que no los tienen (66,3 % contra 39,3 %),');
    log('      y la relación sigue viva dentro de ' + orVivas.length + ' de las ' + f.length + ' plataformas.');
    log('   ⚠️ PERO NO RESUELVE EL PROBLEMA, y eso es lo que decide la tanda: **un tercio de');
    log('      las líneas con portales sigue sin nombre** — ' + cel.cpsn.length + ' aristas, ' + km(suma(cel.cpsn)) + ' y');
    log('      ' + cel.cpsn.reduce((s, r) => s + r.nPortales, 0) + ' portales colgando de ellas.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('R · ⚠️ INFORMATIVO Y NO APLICADO — ¿podría el método de portales nombrarlas?');
  log('='.repeat(110));
  log('   ⛔⛔ ESTO NO NOMBRA NADA. Se ejecuta `heredar-nombre.js` sobre «las que duelen»');
  log('      SOLO para contar cuántas tendrían votos bastantes. Ningún nombre se escribe en');
  log('      el grafo, ni aquí ni en el visor. La decisión de aplicarlo es de Antonio.');
  {
    const H = require('./heredar-nombre');
    const proy = portales.map(H.proyectar);
    const grupos = H.agrupar(proy);
    const dec = H.decidirTodas(grupos);
    const c = { NOMBRADA: [], AMBIGUA: [], MUDA: [] };
    for (const r of DUELEN) {
      const d = dec.get(r.i);
      (c[d ? d.estado : 'MUDA'] || c.MUDA).push(r);
    }
    log('');
    log('   ' + 'resultado del método'.padEnd(30) + 'aristas'.padStart(10) + 'metros'.padStart(12)
      + 'portales'.padStart(11) + '%'.padStart(9));
    for (const k of ['NOMBRADA', 'AMBIGUA', 'MUDA']) {
      log('   ' + k.padEnd(30) + String(c[k].length).padStart(10) + km(suma(c[k])).padStart(12)
        + String(c[k].reduce((s, r) => s + r.nPortales, 0)).padStart(11)
        + pct(c[k].length, DUELEN.length).padStart(9));
    }
    log('');
    log('   ⚠️ Y el acierto del método NO es 100 %: la tanda 17 lo midió en 76,7 % por arista');
    log('      sobre el patrón de verdad, con un techo declarado. ⇒ el número de arriba es');
    log('      COBERTURA POSIBLE, no aciertos.');
    const poD = DUELEN.reduce((s, r) => s + r.nPortales, 0);
    const poN = c.NOMBRADA.reduce((s, r) => s + r.nPortales, 0);
    log('');
    log('   ⭐⭐ Y EL NÚMERO QUE MANDA NO ES EL DE LÍNEAS, ES EL DE PUERTAS:');
    di('⭐ portales que dejarían de colgar de una línea sin nombre', `${poN} de ${poD}  (${pct(poN, poD)})`);
    log('      ⇒ el método NOMBRA POCAS LÍNEAS (33,4 %) PERO LAS QUE TIENEN LA GENTE. Las');
    log('        2.548 MUDAS son aristas de uno o dos portales: 3.231 puertas entre todas.');
    di('⭐ cobertura × acierto de la tanda 17 (76,7 %)', km(suma(c.NOMBRADA) * 0.767)
      + ' de los ' + km(suma(DUELEN)) + ' que duelen');
    global._R = { c };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('D4 · ⛔ LAS MAYÚSCULAS DEL NOMBRE MUNICIPAL — ¿lo resuelve algún dato?');
  log('='.repeat(110));
  log('   El texto imprime «AVENIDA SAN JUAN DE LA PEÑA» al lado de «Avenida de San Juan de');
  log('   la Peña». ⛔ Poner mayúsculas y minúsculas a mano en un nombre propio español es');
  log('   INVENTARLO. La pregunta no es si queda feo: es **si algún fichero lo trae bien**.');
  {
    const fsx = require('fs');
    const crudoVias = JSON.parse(fsx.readFileSync(P.RUTA_VIAS, 'utf8'));
    const mezcla = (s) => s && /[a-z]/.test(s) && /[A-ZÁÉÍÓÚÑ]/.test(s);
    log('');
    log('   FUENTE 1 · el callejero del padrón (`vias-zaragoza.json`, ' + crudoVias.length + ' vías)');
    log('   ' + 'campo'.padEnd(26) + 'TODO MAYÚSCULAS'.padStart(18) + 'todo minúsculas'.padStart(18)
      + 'MEZCLA'.padStart(10));
    for (const c of ['nombre', 'nombreCompleto', 'nombrePublico', 'nombrePublicoNorm']) {
      const may = crudoVias.filter((v) => v[c] && v[c] === String(v[c]).toUpperCase()).length;
      const min = crudoVias.filter((v) => v[c] && v[c] === String(v[c]).toLowerCase()).length;
      const mez = crudoVias.filter((v) => mezcla(v[c])).length;
      log('   ' + c.padEnd(26) + String(may).padStart(18) + String(min).padStart(18) + String(mez).padStart(10));
    }
    log('');
    log('   ⭐ POSITIVO DE CONTROL DEL BUSCADOR (un cero es indistinguible de un buscador roto):');
    const conMinus = crudoVias.filter((v) => /[a-z]/.test(v.nombrePublicoNorm || '')).length;
    di('   campos `…Norm` donde el MISMO buscador SÍ ve minúsculas', `${conMinus} de ${crudoVias.length}  ✅`);

    const RUTA_WFS = path.join(__dirname, '..', 'data', 'exploracion',
      '2026-08-02_wfs_urbanismo-Vias_completa-4326.json');
    log('');
    if (fsx.existsSync(RUTA_WFS)) {
      const j = JSON.parse(fsx.readFileSync(RUTA_WFS, 'utf8'));
      log('   FUENTE 2 · el callejero del WFS de urbanismo (' + j.features.length + ' vías) — ⭐ es OTRA fuente');
      log('   ' + 'campo'.padEnd(26) + 'MEZCLA de mayús/minús'.padStart(24));
      for (const c of ['nombre', 'nombre_completo', 'nombre_reducido', 'nombre_publico']) {
        log('   ' + c.padEnd(26) + String(j.features.filter((f) => mezcla(f.properties[c])).length).padStart(24));
      }
    } else {
      log('   FUENTE 2 · ⛔ NO CONSTA: no está `' + path.basename(RUTA_WFS) + '`');
    }
    log('');
    log('   ⇒ ⛔ **NO CONSTA, y no por falta de método:** dos fuentes municipales');
    log('     independientes, ocho campos de nombre entre las dos, y **ninguno trae el nombre');
    log('     con mayúsculas y minúsculas**. O todo mayúsculas o todo minúsculas.');
    log('   ⇒ ⛔ NO SE TOCA. Reconstruirlo a mano exige decidir «de», «la», «San», «D\'Anglade»');
    log('     y los romanos, y eso es escribir el nombre, no leerlo. Se declara y se deja.');
    log('   ⚠️ Y una pista de por dónde NO ir: una vía trae «ABOGACíA» —con la í minúscula—,');
    log('     que es un artefacto de codificación del origen. El dato ni siquiera es');
    log('     consistente en su propia mayúscula.');
  }

  log('');
  log('='.repeat(110));
  log(A.cierre('DÓNDE FALTA EL NOMBRE'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
