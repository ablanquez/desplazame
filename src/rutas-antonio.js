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
const En = require('./entradas');
const Rel = require('./relato');
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
  // ⭐ A · las entradas declaradas. La regla de qué se usa y con qué orden vive en
  //    `src/entradas.js`; aquí solo se pasan.
  const Ent = En.cargar();

  // ⭐⭐ TANDA 19 · `--modelo` — OPT-IN, y solo afecta al TEXTO.
  // ⛔ Sin el flag NO se construye nada y la salida es la de siempre, byte a byte.
  //    Eso se comprueba en `src/modelo-rutas.js` D1 contra una captura hecha ANTES
  //    de tocar `relato.js`. El CÁLCULO no lo toca ni con el flag puesto: el
  //    modelo entra por `Rel.texto({modelo})` y solo habla donde OSM se calla.
  let modeloDeWay = null;
  if (process.argv.includes('--modelo')) {
    // ⭐⭐ FUENTE ÚNICA: el modelo entero lo monta `modelo.js`. Aquí solo se pide.
    // ⛔ Desde la TANDA 21 incluye la TERCERA fuente de nombre —el método de los
    //    portales, por way y marcado `declarada: false`—. Sigue sin tocar el
    //    cálculo: entra por `Rel.texto({modelo})` y solo cambia el TEXTO.
    const Mo = require('./modelo');
    modeloDeWay = Mo.construirModelo(g, ctx.enganche.portales.filter((o) => o.enganchado)).modeloDeWay;
    process.stderr.write('⚑ MODELO · vía·forma·papel ACTIVO (con el método de portales) — solo el TEXTO\n');
  }

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
    if (!a || !b) {
      log('   ⛔ NO SE PUEDE RESOLVER LA DIRECCIÓN');
      // ⭐⭐ TANDA 33 · y se dice POR QUÉ y QUÉ SE OFRECE. Un «no se puede» a secas
      //    es indistinguible de un fallo del buscador; la sugerencia es el dato que
      //    la interfaz va a poner en el botón, y aquí se enseña tal cual.
      for (const [q, txt, p] of [['origen', ru.o, a], ['destino', ru.d, b]]) {
        if (p || POI[txt]) continue;
        const res = D.resolver(txt, ctx.indice);
        log('   ' + q.padEnd(9) + String(res.estado).padEnd(20) + (res.aviso || ''));
        // ⛔⛔ TANDA 34 · LA DE ENFRENTE TIENE QUE DECIR QUE LO ES. Cruzar cuesta un
        //    semáforo y un rodeo hasta el paso, y eso no está en la línea recta.
        //    ⚠️ La primera versión de esta línea imprimía las cinco iguales y llamaba
        //    «el hueco mide» a la distancia hasta el portal de la otra acera, que es
        //    otra cosa (bitácora nº139).
        for (const s of (res.sugerencias || [])) {
          log('   ' + ''.padEnd(9) + (s.enfrente ? '⛔ ENFRENTE   ' : '⭐ su acera   ')
            + `nº${s.n} · acera de los ${s.acera}`
            + (s.metros == null ? ''
              : s.enfrente ? ` · a ${s.metros} m, CRUZANDO (${Math.round(s.ancho)} m de calle`
                + ` y ${Math.round(s.largo)} m calle abajo)`
                : ` · el hueco mide ${s.metros} m`));
        }
      }
      resultados.push({ ru, ok: false, motivo: 'sin-direccion' }); continue;
    }
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
    // ⭐⭐ TANDA 14 · se calculan LAS DOS versiones del punto de acceso —con y sin
    //    `entrance=*`— porque el efecto hay que VERLO, no anunciarlo. Es la misma
    //    razón por la que la tanda 12 calculó centro y perímetro a la vez (ley 19:
    //    cambiar dos cosas a la vez hace imposible saber cuál operó).
    const aSin = a.tipo === 'POI' ? Pu.accesoA(a, g, ctx.eng) : a;
    const bSin = b.tipo === 'POI' ? Pu.accesoA(b, g, ctx.eng) : b;
    const aP = a.tipo === 'POI' ? Pu.accesoA(a, g, ctx.eng, null, Ent) : a;
    const bP = b.tipo === 'POI' ? Pu.accesoA(b, g, ctx.eng, null, Ent) : b;
    if (a.tipo === 'POI' || b.tipo === 'POI') {
      log('');
      log('   ⭐ D · DESTINO EDIFICIO: se rutea a la PUERTA, no al centro');
      for (const [q, p] of [['origen', aP], ['destino', bP]]) {
        if (p.tipo !== 'POI') continue;
        if (!p.puerta) { log('   ' + q.padEnd(9) + '⚠️ SIN PUERTA, se queda en el punto: ' + p.motivo); continue; }
        log('   ' + q.padEnd(9) + `«${p.puerta.nombre || 'edificio sin nombre en OSM'}»  `
          + `centro a ${p.puerta.dCentro.toFixed(1)} m de la calle → puerta a ${p.puerta.dPuerta.toFixed(1)} m`
          + `   [${p.puerta.nivel}] ${p.motivo}`);
        if (p.puerta.aviso) log('             ⚠️  ' + p.puerta.aviso);
      }
    }
    const hayPuerta = !!(aP.puerta || bP.puerta);

    const resCentro = G.rutaEntre(g, a, b);
    const rectaCentro = dist(a.m, b.m);
    // ⭐ la cuarta lectura: la ENTRADA DECLARADA, cuando el dato la trae.
    let resRuta = null, bR = null, resSin = null, bSinR = null;
    if (bP.puerta) {
      const poli = Pu.edificioDe(b.m, Co.edificios());
      const r3 = Pu.rutaAEdificio(G, g, aSin, poli, ctx.eng);          // [3] tanda 12
      if (r3.encontrada) { resSin = r3; bSinR = r3.puerta; }
      const rr = Pu.rutaAEdificio(G, g, aP, poli, ctx.eng, Ent);       // [4] tanda 14
      if (rr.encontrada) { resRuta = rr; bR = rr.puerta; }
    }
    const res = resRuta || (hayPuerta ? G.rutaEntre(g, aP, bP) : resCentro);
    const bFin = bR || bP;
    const recta = resRuta ? dist(aP.m, bR.m) : (hayPuerta ? dist(aP.m, bP.m) : rectaCentro);
    if (hayPuerta) {
      const resPer = G.rutaEntre(g, aSin, bSin);
      const rectaPer = dist(aSin.m, bSin.m);
      di('  [1] al CENTRO del edificio', resCentro.encontrada
        ? `${resCentro.metros.toFixed(0)} m · recta ${rectaCentro.toFixed(0)} m · rodeo ${(resCentro.metros / rectaCentro).toFixed(2)}`
        : '⛔ NO HAY CAMINO');
      di('  [2] al perímetro más cerca de LA CALLE', resPer.encontrada
        ? `${resPer.metros.toFixed(0)} m · recta ${rectaPer.toFixed(0)} m · rodeo ${(resPer.metros / rectaPer).toFixed(2)}`
        : '⛔ NO HAY CAMINO');
      di('  [3] al perímetro más barato POR RUTA (tanda 12)', resSin
        ? `${resSin.metros.toFixed(0)} m · recta ${dist(aSin.m, bSinR.m).toFixed(0)} m · rodeo ${(resSin.metros / dist(aSin.m, bSinR.m)).toFixed(2)}`
          + `   (${resSin.nCandidatos} candidatas)`
        : '— (no aplica: el destino no es un edificio)');
      di('  [4] ⭐⭐ a la ENTRADA DECLARADA (tanda 14)', resRuta
        ? `${resRuta.metros.toFixed(0)} m · recta ${recta.toFixed(0)} m · rodeo ${(resRuta.metros / recta).toFixed(2)}`
          + `   [${resRuta.nivel}] ${resRuta.nCandidatos} candidatas`
        : '— (no aplica)');
      if (resSin && resRuta) {
        const dm = resRuta.metros - resSin.metros;
        const dp = Math.hypot(bSinR.m[0] - bR.m[0], bSinR.m[1] - bR.m[1]);
        di('  ⇒ [4] frente a [3]', `${dm >= 0 ? '+' : ''}${dm.toFixed(0)} m · el punto de llegada se mueve ${dp.toFixed(1)} m`
          + (dp < 0.5 ? '   ⇒ no cambia nada' : ''));
      }
      log('   ⇒ manda [4] cuando el dato trae entrada; si no, [3]. ⛔ nunca el centro.');
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

    // ⭐⭐ TANDA 16 · LA RUTA CONTADA, con el MISMO redactor que `ruta.js` y que el
    //    visor. ⛔ No hay un segundo redactor: si esto y la terminal dijeran cosas
    //    distintas, una de las dos estaría mintiendo y no se sabría cuál.
    log('');
    log('   ⭐⭐ LA RUTA, SALTO A SALTO');
    log(Rel.texto(res, { origen: ru.o, destino: ru.d, nombreDeWay: ctx.nombreDeWay,
      rodeo, engancheOrigen: aP.d, engancheDestino: bFin.d, modelo: modeloDeWay })
      .split('\n').map((x) => '   ' + x).join('\n'));
    // ⭐ CUADRE ENTRE LAS DOS TABLAS. Arriba está `porTramos` —el desglose de
    //    metros por arista— y aquí el relato, que agrupa. Los dos leen los mismos
    //    `res.pasos`, así que no pueden divergir… **mientras alguien no cambie uno
    //    de los dos.** Esto lo convierte en mecanismo y no en confianza (ley 37).
    {
      const sumaRelato = Rel.tramos(res, ctx.nombreDeWay, modeloDeWay).reduce((s, t) => s + t.metros, 0);
      const sumaPasos = res.pasos.reduce((s, p) => s + p.metros, 0);
      Al.exige(Math.abs(sumaRelato - sumaPasos) < 0.5,
        `la ruta nº${ru.n}: el relato suma ${sumaRelato.toFixed(1)} m y el desglose ${sumaPasos.toFixed(1)} m`);
    }

    const nombres = [];
    for (const ia of res.aristas) {
      const n = ctx.nombreDeWay(g.aristas[ia].way);
      if (n && nombres[nombres.length - 1] !== n) nombres.push(n);
    }
    log('   por: ' + (nombres.join(' → ').slice(0, 300) || '(tramos sin nombre)'));
    resultados.push({ ru, ok: true, metros: res.metros, recta, rodeo, dentroRodeo, dentroBanda,
      nombres, aristas: res.aristas, pasos: res.pasos, a: aP, b: bFin, cond, sinCond, resCentro, rectaCentro, hayPuerta,
      resSin, bSinR, aSin, nivel: resRuta ? resRuta.nivel : null });
  }

  // ── A4 · LAS SIETE, ANTES Y DESPUÉS DE `entrance=*` ───────────────────────
  // ⭐⭐ ¿Puede esta tabla salir bien sin que nada funcione? SÍ, de una forma: si
  //    ninguna ruta tocara un edificio con entrada declarada, saldrían siete filas
  //    idénticas y parecería que «no rompe nada» cuando en realidad no se ha
  //    probado nada. ⇒ por eso la columna «nivel» sale SIEMPRE, y las filas que no
  //    aplican se marcan como tales. Cuatro rutas sin POI son el CONTROL NULO de
  //    esta tabla: tienen que quedar clavadas al metro.
  log('');
  log('='.repeat(104));
  log('A4 · ⭐⭐ LAS SIETE, ANTES Y DESPUÉS DE `entrance=*`');
  log('   ' + 'nº'.padEnd(4) + 'antes [3]'.padStart(12) + 'ahora [4]'.padStart(12) + 'Δ m'.padStart(9)
    + 'rodeo'.padStart(9) + 'tope'.padStart(8) + '  nivel        el punto de llegada');
  {
    let cambiadas = 0, nulas = 0;
    for (const x of resultados) {
      if (!x.ok) { log('   ' + String(x.ru.n).padEnd(4) + '⛔ no resuelta'); continue; }
      if (!x.resSin || !x.b || !x.bSinR) {
        nulas++;
        log('   ' + String(x.ru.n).padEnd(4) + `${x.metros.toFixed(0)} m`.padStart(12) + `${x.metros.toFixed(0)} m`.padStart(12)
          + '0'.padStart(9) + x.rodeo.toFixed(2).padStart(9)
          + (x.ru.rodeoMax === null ? 'NO CONSTA' : '≤' + x.ru.rodeoMax.toFixed(2)).padStart(8)
          + '  —            no hay edificio de por medio ⇒ CONTROL NULO');
        continue;
      }
      const dm = x.metros - x.resSin.metros;
      const dp = Math.hypot(x.bSinR.m[0] - x.b.m[0], x.bSinR.m[1] - x.b.m[1]);
      if (dp > 0.5) cambiadas++;
      log('   ' + String(x.ru.n).padEnd(4) + `${x.resSin.metros.toFixed(0)} m`.padStart(12)
        + `${x.metros.toFixed(0)} m`.padStart(12) + `${dm >= 0 ? '+' : ''}${dm.toFixed(0)}`.padStart(9)
        + x.rodeo.toFixed(2).padStart(9)
        + (x.ru.rodeoMax === null ? 'NO CONSTA' : '≤' + x.ru.rodeoMax.toFixed(2)).padStart(8)
        + '  ' + String(x.nivel || '—').padEnd(13) + `se mueve ${dp.toFixed(1)} m`);
    }
    log('');
    di('rutas cuyo punto de llegada se mueve', cambiadas);
    di('⭐ CONTROL NULO · rutas sin edificio, clavadas al metro', nulas);
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

  // ⭐ `--aristas` · una línea más al final con los índices de arista de cada ruta.
  //    ⛔ Existe para que NADIE tenga que recalcular las siete por su cuenta: una
  //    segunda copia del cálculo es exactamente la forma del fallo nº68 (medir una
  //    cosa y que el motor use otra). Sin el flag, la salida es idéntica byte a byte.
  if (process.argv.includes('--aristas')) {
    log('##ARISTAS## ' + JSON.stringify(resultados.filter((x) => x.ok)
      .map((x) => ({ n: x.ru.n, metros: x.metros, aristas: x.aristas }))));
  }

  // ⭐⭐ TANDA 21 · `--pasos` · el desglose que mide C y E, preguntado AQUÍ.
  // ⛔ Existe por lo mismo que `--aristas`: para que nadie recalcule las siete por
  //    su cuenta. Lo único que hace es pedirle al MISMO redactor la misma ruta con
  //    varias configuraciones — la vieja (línea base) y la nueva a varios umbrales.
  if (process.argv.includes('--pasos')) {
    const UMBRALES = [0, 7.4, 9.0, 13.3, 20, 30, 50];
    const salida = resultados.filter((x) => x.ok).map((x) => {
      const viejo = Rel.tramos(x, ctx.nombreDeWay, modeloDeWay, { viejo: true });
      const nuevo = Rel.tramos(x, ctx.nombreDeWay, modeloDeWay);
      const sinModelo = Rel.tramos(x, ctx.nombreDeWay, null);
      return {
        n: x.ru.n, metros: x.metros, tramosOsm: x.pasos.length,
        viejo: viejo.length,
        soloC: sinModelo.length,           // agrupado por vía pero SIN nombres nuevos
        nuevo: nuevo.length,
        curva: UMBRALES.map((u) => Rel.tramos(x, ctx.nombreDeWay, modeloDeWay, { corto: u }).length),
        umbrales: UMBRALES,
        conBici: nuevo.filter((t) => t.avisos.some((a) => a.texto === Rel.AVISO_BICIS)).length,
        metrosBici: Math.round(nuevo.reduce((s, t) =>
          s + (t.avisos.find((a) => a.texto === Rel.AVISO_BICIS) || { metros: 0 }).metros, 0)),
        conDeducido: nuevo.filter((t) => t.deducida).length,
        metrosDeducidos: Math.round(nuevo.filter((t) => t.deducida).reduce((s, t) => s + t.metros, 0)),
        comidos: nuevo.flatMap((t) => t.comido.map((c) => ({
          en: t.nombre, nombre: c.nombre, metros: Math.round(c.metros * 10) / 10 }))),
        pasos: nuevo.map((t) => ({ frase: t.frase, metros: t.metros, ways: t.ways })),
      };
    });
    log('##PASOS## ' + JSON.stringify(salida));
  }

  log('');
  log(Al.cierre('BANCO DE PRUEBAS DE ANTONIO'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { POI, puntoDe, porTramos };
