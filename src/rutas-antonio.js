// ⭐⭐⭐ LAS SIETE RUTAS DE ANTONIO.
//
// ⭐ Escritas ANTES de que existiera el enganche, a propósito, para que no
//    pudieran elegirse mirando qué salía bien (ley 17 y ley 22).
//
// ⛔ `data/pruebas/RUTAS-CONOCIDAS.md` NO SE TOCA. Se lee y se ejecuta. Los
//    resultados van en el informe, nunca en la tabla de Antonio — ni siquiera
//    para añadir una columna.
//
// ⛔ Y AHORA LAS BANDAS TAMPOCO SE COPIAN AQUÍ. Estuvieron copiadas, Antonio
//    publicó la v2 de la tabla, y este fichero siguió comparando contra la v1:
//    declaró **0 de 5 en banda** cuando la cuenta buena eran 3 de 5. Dos copias
//    del mismo dato divergen. Se leen con `src/tabla-rutas.js`.
//
// ⭐ EL CRITERIO PRINCIPAL DE LA v2 ES EL RODEO, no la distancia: *ruta ÷ recta*
//    no depende de lo rápido que ande nadie, y la banda de distancia sí (sale de
//    convertir un tiempo con una velocidad supuesta). La distancia se sigue
//    reportando, de apoyo.
//
//   node src/rutas-antonio.js

'use strict';
const osm = require('./osm');
const P = require('./portales');
const D = require('./direccion');
const G = require('./grafo');
const T = require('./tabla-rutas');
const Co = require('./condicionales');
const Pu = require('./puerta');
const Al = require('./alarma');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { aMetros, dist } = require('./geo');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(44)} ${v}`);

// ── LOS DESTINOS QUE NO SON UNA DIRECCIÓN ────────────────────────────────────
// ⚠️ Etopía, el Hospital Lozano Blesa, la estación de Delicias y el C.C. Utrillas
//    NO están en el callejero municipal ni en el crudo de viario: son edificios.
//    ⛔ NO se ponen sus coordenadas de memoria. Se descargaron por nombre
//    (`data/fuentes/2026-08-03_overpass_zaragoza-poi-rutas.json`, sello
//    2026-08-03T12:48:20Z) y aquí van con la etiqueta OSM que los identifica.
const POI = {
  'Hospital Clínico Lozano Blesa': { lat: 41.64321, lon: -0.90341, osm: 'amenity=hospital "Hospital Clínico Universitario Lozano Blesa"' },
  'Centro Etopía': { lat: 41.65935, lon: -0.90731, osm: 'building=yes "Etopia"' },
  'Estación Delicias': { lat: 41.65857, lon: -0.91139, osm: 'railway=station "Zaragoza-Delicias"' },
  'C.C. Utrillas': { lat: 41.64014, lon: -0.86815, osm: 'shop=mall "Alcampo Utrillas"  ⚠️ identificado así: es el único centro comercial llamado Utrillas del dato' },
};

/** Resuelve un texto a un punto sobre el grafo: portal del callejero o POI. */
function puntoDe(txt, ctx, g) {
  if (POI[txt]) {
    const p = POI[txt];
    const m = aMetros(p.lon, p.lat);
    const { mejor } = P.engancharUno(m, g.aristas, ctx.eng, () => '', 250);
    if (!mejor) return null;
    return { arista: mejor.i, seg: mejor.k, t: mejor.t, q: mejor.q, d: mejor.d,
      lat: p.lat, lon: p.lon, m, tipo: 'POI', osm: p.osm, estado: 'poi-por-nombre' };
  }
  return D.punto(txt, ctx);
}

/** La tabla de metros por tramo — A6: dónde se va el rodeo. */
function porTramos(pasos, nombreDeWay, tope = 12) {
  const L = [];
  const total = pasos.reduce((s, p) => s + p.metros, 0);
  L.push('   ' + 'm'.padStart(8) + '  ' + '%'.padStart(5) + '  ' + 'highway'.padEnd(14)
    + 'precisión'.padEnd(24) + 'calle');
  const ord = pasos.map((p, i) => ({ p, i })).sort((a, b) => b.p.metros - a.p.metros);
  const mostrados = new Set(ord.slice(0, tope).map((x) => x.i));
  let ocultos = 0, mOcultos = 0;
  for (let i = 0; i < pasos.length; i++) {
    const p = pasos[i];
    if (!mostrados.has(i)) { ocultos++; mOcultos += p.metros; continue; }
    L.push('   ' + p.metros.toFixed(1).padStart(8) + '  ' + (100 * p.metros / total).toFixed(1).padStart(5)
      + '  ' + String(p.highway).padEnd(14) + String(p.precision).padEnd(24)
      + (nombreDeWay(p.way) || '(sin nombre en OSM)')
      + (p.condicional ? '   ⚠️ PASO CONDICIONAL' : '') + (p.unidoPorDefecto ? '   ⚠️ D2' : ''));
  }
  // ⛔ nada se oculta en silencio: si se recorta, se dice cuánto se recorta
  if (ocultos) L.push('   ' + mOcultos.toFixed(1).padStart(8) + '  ' + (100 * mOcultos / total).toFixed(1).padStart(5)
    + `  ⟨${ocultos} tramos más, no mostrados⟩`);
  L.push('   ' + total.toFixed(1).padStart(8) + '  100.0  TOTAL');
  return L.join('\n');
}

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const T0 = Date.now();
  const tabla = T.leer();
  const lectura = T.informe(tabla);

  log('='.repeat(104));
  log(lectura.texto);
  if (!lectura.cuadra) { log('   ⛔ PARADA: la lectura de la tabla no cuadra.'); process.exit(1); }

  // ⭐ C · los pasos condicionales van DENTRO del cálculo (decisión de la tanda 12).
  //    Se construye TAMBIÉN el grafo sin ellos, no por gusto: es la única forma de
  //    separar "la ruta los usa" de "la ruta los NECESITA", que son dos cosas
  //    distintas y la ley 23 pide contarlas por separado.
  const g = construir(ZONA_TERMINO);
  const gSin = construir(ZONA_TERMINO, { sinCondicionales: true });
  const ctx = D.abrir(g, CRUDO);
  const ctxSin = { eng: P.indexarAristas(gSin.aristas, (e) => e.pie) };

  log('');
  log('='.repeat(104));
  log('LAS SIETE, UNA A UNA');
  di('grafo · portales enganchados', `${g.aristas.length} aristas · ${ctx.enganche.contadores.enganchados}`);
  di('vías en el índice de direcciones', ctx.indice.size);
  di('pasos condicionales', `⚠️ DENTRO del cálculo · ${g.condicionales.aristas} aristas, `
    + `${g.condicionales.conNombre} con el sitio identificado por nombre`);
  di('componentes con ellos · sin ellos', `${g.comp.n} · ${gSin.comp.n}`
    + `   (mayor ${Math.max(...g.comp.tamanos)} · ${Math.max(...gSin.comp.tamanos)})`);

  const resultados = [];
  for (const ru of tabla.rutas) {
    log('');
    log('─'.repeat(104));
    log(`RUTA ${ru.n} · ${ru.o}  →  ${ru.d}`);
    if (ru.caso) log(`   ${ru.caso}`);
    const a = puntoDe(ru.o, ctx, g), b = puntoDe(ru.d, ctx, g);
    if (!a || !b) { log('   ⛔ NO SE PUEDE RESOLVER LA DIRECCIÓN'); resultados.push({ ru, ok: false, motivo: 'sin-direccion' }); continue; }
    for (const [q, p] of [['origen', a], ['destino', b]]) {
      log('   ' + q.padEnd(9) + String(p.estado).padEnd(20) + 'enganche ' + p.d.toFixed(1) + ' m'
        + (p.tipo === 'POI' ? '   ⚠️ es un EDIFICIO: se rutea a su CENTRO, no a su puerta' : '')
        + (p.portal ? '   OSM "' + (p.portal.nombreOsm || '—') + '"  [' + p.portal.codigoVia_estado + '/' + p.portal.consenso_estado + ']' : ''));
    }

    // ── D · el destino que es un EDIFICIO se rutea a su PUERTA, no a su centro ──
    // ⭐ D3 · se calculan LAS DOS, porque el efecto hay que verlo, no anunciarlo:
    //    al mover el punto cambia la ruta Y cambia la línea recta, así que el
    //    rodeo se mueve por dos motivos a la vez y sin el antes no se separan.
    // ⛔ el motivo se dice SIEMPRE que el destino sea un POI, tenga puerta o no.
    //    En la primera versión, un POI sin edificio se saltaba el tratamiento en
    //    silencio y parecía que no era un edificio — y el C.C. Utrillas lo es.
    const aP = a.tipo === 'POI' ? Pu.accesoA(a, g, ctx.eng) : a;
    const bP = b.tipo === 'POI' ? Pu.accesoA(b, g, ctx.eng) : b;
    if (a.tipo === 'POI' || b.tipo === 'POI') {
      log('');
      log('   ⭐ D · DESTINO EDIFICIO: se rutea al PERÍMETRO, no al centro');
      for (const [q, p] of [['origen', aP], ['destino', bP]]) {
        if (p.tipo !== 'POI') continue;
        if (!p.puerta) { log('   ' + q.padEnd(9) + '⚠️ SIN PUERTA, se queda en el punto: ' + p.motivo); continue; }
        log('   ' + q.padEnd(9) + `«${p.puerta.nombre || 'edificio sin nombre en OSM'}»  `
          + `centro a ${p.puerta.dCentro.toFixed(1)} m de la calle → perímetro a ${p.puerta.dPuerta.toFixed(1)} m`);
      }
    }
    const hayPuerta = !!(aP.puerta || bP.puerta);

    const resCentro = G.rutaEntre(g, a, b);
    const rectaCentro = dist(a.m, b.m);
    // ⭐ la tercera lectura: la puerta elegida POR RUTA, no por cercanía a la calle
    let resRuta = null, bR = null;
    if (bP.puerta) {
      const poli = Pu.edificioDe(b.m, Co.edificios());
      const rr = Pu.rutaAEdificio(G, g, aP, poli, ctx.eng);
      if (rr.encontrada) { resRuta = rr; bR = rr.puerta; }
    }
    const res = resRuta || (hayPuerta ? G.rutaEntre(g, aP, bP) : resCentro);
    const bFin = bR || bP;
    const recta = resRuta ? dist(aP.m, bR.m) : (hayPuerta ? dist(aP.m, bP.m) : rectaCentro);
    if (hayPuerta) {
      const resPer = G.rutaEntre(g, aP, bP);
      const rectaPer = dist(aP.m, bP.m);
      di('  [1] al CENTRO del edificio', resCentro.encontrada
        ? `${resCentro.metros.toFixed(0)} m · recta ${rectaCentro.toFixed(0)} m · rodeo ${(resCentro.metros / rectaCentro).toFixed(2)}`
        : '⛔ NO HAY CAMINO');
      di('  [2] al perímetro más cerca de LA CALLE', resPer.encontrada
        ? `${resPer.metros.toFixed(0)} m · recta ${rectaPer.toFixed(0)} m · rodeo ${(resPer.metros / rectaPer).toFixed(2)}`
        : '⛔ NO HAY CAMINO');
      di('  [3] ⭐ al perímetro más barato POR RUTA', resRuta
        ? `${resRuta.metros.toFixed(0)} m · recta ${recta.toFixed(0)} m · rodeo ${(resRuta.metros / recta).toFixed(2)}`
          + `   (${resRuta.nCandidatos} puertas candidatas)`
        : '— (no aplica: el destino no es un edificio)');
      log('   ⇒ manda [3]: llegar a un edificio es tocar su perímetro por donde antes se llegue.');
    }
    if (!res.encontrada) {
      // ⛔ antes esto imprimía y seguía, y el proceso terminaba en 0.
      Al.fallo(`la ruta nº${ru.n} NO TIENE CAMINO: ${ru.o} → ${ru.d}`, { n: ru.n });
      log('   ⛔⛔ NO HAY CAMINO');
      resultados.push({ ru, ok: false, motivo: 'sin-camino', recta, a: aP, b: bFin });
      continue;
    }
    const rodeo = res.metros / recta;
    const dentroRodeo = ru.rodeoMax === null ? null : rodeo <= ru.rodeoMax;
    const dentroBanda = ru.banda === null ? null : (res.metros >= ru.banda[0] && res.metros <= ru.banda[1]);

    log('');
    di('⭐ RODEO (criterio principal)', rodeo.toFixed(2) + '   tope de Antonio '
      + (ru.rodeoMax === null ? 'NO CONSTA' : '≤ ' + ru.rodeoMax.toFixed(2))
      + '   ' + (dentroRodeo === null ? '' : dentroRodeo ? '✅ DENTRO' : '⛔ FUERA')
      + (rodeo < 0.999 ? '   ⛔⛔ IMPOSIBLE' : ''));
    di('distancia calculada (de apoyo)', res.metros.toFixed(0) + ' m'
      + '   banda ' + (ru.banda ? `${ru.banda[0]}–${ru.banda[1]} m` : 'NO CONSTA')
      + '   ' + (dentroBanda === null ? '' : dentroBanda ? '✅ dentro'
        : '⚠️ ' + (res.metros < ru.banda[0] ? 'corta' : 'larga') + ' por '
          + Math.abs(res.metros - (res.metros < ru.banda[0] ? ru.banda[0] : ru.banda[1])).toFixed(0) + ' m'));
    di('línea recta', recta.toFixed(0) + ' m'
      + (ru.rectaDeclarada ? `   (la tabla declara ${ru.rectaDeclarada} m)` : ''));
    // ── C · ¿usa pasos condicionales? ¿los NECESITA, o son atajo? ────────────
    // ⭐ se calcula para LAS SIETE, no solo para las que los usan: sin el
    //    contrafactual no se puede decir "no le afectan", solo "no aparecen".
    const cond = res.pasos.filter((p) => p.condicional);
    const re = (p) => {
      const x = P.engancharUno(p.m, gSin.aristas, ctxSin.eng, () => '', 350).mejor;
      return x ? { arista: x.i, seg: x.k, t: x.t, q: x.q, d: x.d, m: p.m } : null;
    };
    const a2 = re(aP), b2 = re(bFin);
    const rSin = (a2 && b2) ? G.rutaEntre(gSin, a2, b2) : { encontrada: false };
    const sinCond = rSin.encontrada ? rSin.metros : null;
    di('el mismo trayecto SIN pasos condicionales', rSin.encontrada
      ? `${rSin.metros.toFixed(0)} m  (${(rSin.metros - res.metros >= 0.5 ? '+' : '')}${(rSin.metros - res.metros).toFixed(0)} m)`
        + (Math.abs(rSin.metros - res.metros) < 0.5 ? '   ⇒ no le afectan' : '')
      : '⛔ NO HAY CAMINO   ⇒ LOS NECESITA');
    if (cond.length) {
      di('⚠️ pasos condicionales en la ruta', cond.length + ' tramos · '
        + cond.reduce((s, p) => s + p.metros, 0).toFixed(0) + ' m');
      log('');
      log('   ⭐⭐ EL AVISO, TAL COMO LO VERÍA UN USUARIO:');
      // ⚠️ se agrupan los avisos LITERALMENTE IDÉNTICOS —siete tramos del mismo
      //    pasillo dicen lo mismo siete veces— y se conserva el recuento y los
      //    metros. Agrupar lo idéntico no borra nada; agrupar lo parecido, sí.
      const porTexto = new Map();
      for (const p of cond) {
        const t = Co.aviso(p, ctx.nombreDeWay);
        if (!porTexto.has(t)) porTexto.set(t, { n: 0, m: 0 });
        const v = porTexto.get(t); v.n++; v.m += p.metros;
      }
      for (const [t, v] of porTexto) {
        log('      ⚠️  ' + t + `   (${v.m.toFixed(0)} m` + (v.n > 1 ? ` en ${v.n} tramos` : '') + ')');
      }
      log('');
      di('⭐ ¿los NECESITA o son un atajo?', rSin.encontrada
        ? `ATAJO — sin ellos también hay ruta: ${rSin.metros.toFixed(0)} m (+${(rSin.metros - res.metros).toFixed(0)} m, ${((rSin.metros / res.metros - 1) * 100).toFixed(1)} %)`
        : 'LOS NECESITA — sin ellos NO HAY CAMINO');
    }

    log('');
    log('   ⭐ A6 · DÓNDE SE VAN LOS METROS');
    log(porTramos(res.pasos, ctx.nombreDeWay));

    const nombres = [];
    for (const ia of res.aristas) {
      const n = ctx.nombreDeWay(g.aristas[ia].way);
      if (n && nombres[nombres.length - 1] !== n) nombres.push(n);
    }
    log('   por: ' + (nombres.join(' → ').slice(0, 300) || '(tramos sin nombre)'));
    resultados.push({ ru, ok: true, metros: res.metros, recta, rodeo, dentroRodeo, dentroBanda,
      nombres, aristas: res.aristas, pasos: res.pasos, a: aP, b: bFin, cond, sinCond, resCentro, rectaCentro, hayPuerta });
  }

  // ── las tres preguntas concretas ──────────────────────────────────────────
  log('');
  log('='.repeat(104));
  log('LAS TRES PREGUNTAS CONCRETAS');
  {
    const r1 = resultados.find((x) => x.ru.n === 1);
    log('');
    log('⭐ nº1 · ¿POR QUÉ PUENTE CRUZA?  (hay tres posibles)');
    if (r1 && r1.ok) {
      const puentes = r1.nombres.filter((n) => /puente|pasarela/i.test(n));
      di('puentes en la ruta', puentes.join(' · ') || '⚠️ ninguno con nombre');
      di('Antonio cruza por', 'el Puente de Piedra');
      di('⇒', puentes.some((p) => /piedra/i.test(p)) ? '✅ COINCIDE'
        : '⚠️ NO coincide — o el coste está mal, o hay un rodeo escondido');
    } else log('   ⛔ la ruta 1 no se resolvió');

    const r6 = resultados.find((x) => x.ru.n === 6);
    log('');
    log('⭐ nº6 · ¿SE DISPARA LA DISCORDANCIA DE `codigoVia`?  (los dos portales son el nº 1)');
    if (r6 && r6.ok) {
      for (const [k, p] of [['origen', r6.a], ['destino', r6.b]]) {
        if (!p.portal) continue;
        const o = p.portal;
        di(k + ': ' + (o.via ? o.via.nombre : '?') + ' ' + o.numero,
          'OSM "' + (o.nombreOsm || '—') + '"   codigoVia:' + o.codigoVia_estado + '   nube:' + o.consenso_estado);
        di('   distancia · segunda calle a', o.d.toFixed(1) + ' m · ' + (o.segundaD !== null ? o.segundaD.toFixed(1) + ' m ("' + o.segundaNucleo + '")' : '—'));
      }
      const mal = [r6.a, r6.b].filter((p) => p.portal && p.portal.codigoVia_estado === 'DISCORDA').length;
      di('⇒', mal ? '⚠️ ' + mal + ' de 2 marcados por el código — la salvaguarda ACTÚA y no corrige'
        : '✅ ninguno discorda: la esquina no engañó al enganche');
    } else log('   ⛔ la ruta 6 no se resolvió');

    const r4 = resultados.find((x) => x.ru.n === 4);
    log('');
    log('⭐ nº4 · ¿LLEGA A DELICIAS?  (la plataforma elevada, layer=2)');
    if (r4 && r4.ok) {
      di('rodeo · tope', r4.rodeo.toFixed(2) + ' · ≤ ' + r4.ru.rodeoMax);
      di('⇒', r4.dentroRodeo ? '✅ dentro del tope' : '⚠️ fuera del tope: hay que mirar por dónde');
    } else log('   ⛔ la ruta 4 no se resolvió: ' + (r4 ? r4.motivo : '?'));
  }

  // ── cordura y recuento ─────────────────────────────────────────────────────
  log('');
  log('='.repeat(104));
  log('CORDURA Y RECUENTO — ninguna ruta puede ser más corta que la línea recta');
  // ⛔ IMPOSIBILIDAD FÍSICA: se lanza en el acto, no se cuenta en una tabla.
  for (const x of resultados) {
    if (x.ok && x.rodeo < 0.999) {
      Al.imposible(`la ruta nº${x.ru.n} mide ${x.metros.toFixed(1)} m con una recta de ${x.recta.toFixed(1)} m`,
        { n: x.ru.n, metros: x.metros, recta: x.recta });
    }
  }
  const imposibles = resultados.filter((x) => x.ok && x.rodeo < 0.999);
  di('rutas resueltas', resultados.filter((x) => x.ok).length + ' de ' + tabla.rutas.length);
  di('⛔ con rodeo < 1 (imposible)', imposibles.length + (imposibles.length ? '  ⛔ EL GRAFO ESTÁ ROTO' : '  ✅'));
  const conRodeo = resultados.filter((x) => x.ok && x.ru.rodeoMax !== null);
  di('⭐ DENTRO DEL RODEO ACEPTABLE', conRodeo.filter((x) => x.dentroRodeo).length + ' de ' + conRodeo.length);
  for (const x of conRodeo.filter((x) => !x.dentroRodeo)) {
    // ⭐ FALLO DE EXPECTATIVA: el banco de pruebas de Antonio es una diana, y una
    //    diana fallada tiene que salir en rojo. Antes esto era una línea de aviso
    //    y el proceso terminaba en 0.
    Al.fallo(`la ruta nº${x.ru.n} se sale del rodeo aceptable: ${x.rodeo.toFixed(2)} frente a ≤ ${x.ru.rodeoMax}`,
      { n: x.ru.n, rodeo: x.rodeo, tope: x.ru.rodeoMax });
    log('      ⚠️ nº' + x.ru.n + ': rodeo ' + x.rodeo.toFixed(2) + ' frente a ≤ ' + x.ru.rodeoMax);
  }
  const conBanda = resultados.filter((x) => x.ok && x.ru.banda);
  di('dentro de la banda de distancia (apoyo)', conBanda.filter((x) => x.dentroBanda).length + ' de ' + conBanda.length);
  for (const x of conBanda.filter((x) => !x.dentroBanda)) {
    log('      ⚠️ nº' + x.ru.n + ': ' + x.metros.toFixed(0) + ' m frente a ' + x.ru.banda[0] + '–' + x.ru.banda[1]);
  }
  const conCond = resultados.filter((x) => x.ok && x.cond && x.cond.length);
  di('rutas que pasan por un paso condicional', conCond.length + (conCond.length ? '  (nº ' + conCond.map((x) => x.ru.n).join(', ') + ')' : ''));

  log('');
  log(Al.cierre('BANCO DE PRUEBAS DE ANTONIO'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { POI, puntoDe, porTramos };
