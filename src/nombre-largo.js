// ⭐⭐ TANDA 21 · B · EL NOMBRE BUENO ES EL LARGO — el reconocedor, y su medida.
//
//   node src/nombre-largo.js
//
// > *«Si tienes un Poeta María Zambrano y luego un Calle María Zambrano o
// >  M. Zambrano, ¿sabes entender que todo es el mismo nombre?»* — Antonio
// > *«Si es título grande, se deja el grande.»*
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ ES ESTO Y QUÉ NO ES
// ═════════════════════════════════════════════════════════════════════════════
//   ⭐ Es un **RECONOCEDOR**: contesta *¿son estos dos nombres la misma vía?*
//   ⛔ NO es un emparejador aproximado. No busca «el más parecido», no calcula
//     distancias de edición y no elige entre candidatos que no se contienen. El
//     emparejamiento aproximado ya falló en el 29,6 % del dataset heredado y en
//     este proyecto está prohibido.
//
//   ⛔ Y NO CAMBIA NINGÚN NOMBRE DEL GRAFO. D0 sigue mandando: el nombre lo pone
//     OSM donde OSM lo tiene. Esto solo decide si **dos nombres que ya existen**
//     son el mismo, que es lo que hacía falta para no contar como fallo un
//     acierto.
//
// ═════════════════════════════════════════════════════════════════════════════
// LA REGLA, Y POR QUÉ ES ÉSTA
// ═════════════════════════════════════════════════════════════════════════════
//   **Una versión corta es un RECORTE de la larga; nunca al revés.**
//
//   ⛔ Por eso NO se quitan títulos. Una lista de títulos (`poeta`, `doctor`,
//     `general`…) es una lista que alguien escribe mirando los casos que le
//     molestan, y entonces *Santa Cruz* se convierte en *Cruz* y ya son dos
//     calles distintas confundidas. **Aquí no se quita nada: se comprueba que las
//     palabras del corto aparecen SEGUIDAS Y EN ORDEN dentro del largo.**
//
//   ⚠️ Y el recorte tiene que ser CONTIGUO. `maria zambrano` está dentro de
//     `poeta maria zambrano`; `garcia arista` NO está dentro de
//     `garcia sanchez arista` — y no lo está a propósito.
//
//   ⚠️ AMBIGUO ES UN RESULTADO (B2). Si un corto cabe dentro de DOS largos
//     distintos, **no se elige ninguno**. Elegir el largo cuando hay dos largos
//     posibles es tirar una moneda, y este proyecto ya se ha comido tres veces el
//     problema del nombre repetido (las ocho PLAZA ESPAÑA, ley 41).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LO QUE ESTA REGLA **NO** CAZA, Y SE DICE ANTES DE MEDIR NADA
// ═════════════════════════════════════════════════════════════════════════════
//   **Las abreviaturas.** `M. Zambrano` normaliza a `m zambrano`, y `m` no es
//   `maria`: la contención no lo ve. Antonio lo puso en el ejemplo y **esta regla
//   no lo resuelve.**
//   ⇒ Cazarlo pediría una segunda regla —«una palabra de una letra casa con
//     cualquier palabra que empiece por ella»— que abre la puerta a que
//     `m zambrano` case también con `manuel zambrano`. **No se hace**, se mide
//     cuántos casos hay y se deja escrito.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?»
// ═════════════════════════════════════════════════════════════════════════════
//   B3 · «con la regla nueva no se rompe ningún emparejamiento que hoy funciona»
//        ⚠️ **PASA POR CONSTRUCCIÓN**: la regla es `igual || contiene`, así que
//        solo puede AÑADIR. Decirlo como logro sería tramposo. ⇒ se comprueba
//        igualmente —un mecanismo vale más que mi lectura— y se declara que su
//        valor es futuro. **Lo que de verdad hay que probar es lo contrario: que
//        los emparejamientos NUEVOS sean ciertos**, y para eso hay un testigo que
//        la regla no puede ver: **la GEOMETRÍA**. Un portal que ahora concuerda
//        está enganchado a esa línea a X metros. Si los nuevos aciertos están tan
//        pegados como los viejos, son la misma calle; si están a 60 m, no.
//   B1 · el recuento de recortes dentro del propio callejero puede salir alto sin
//        significar nada. ⇒ va con su CONTROL NEGATIVO: el mismo test sobre
//        parejas de vías al azar. La tanda 17 lo midió en 3 de 19.992 (0,0 %).

'use strict';
const P = require('./portales');

const palabras = (n) => String(n || '').split(' ').filter(Boolean);

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ UNA RESTRICCIÓN QUE ESCRIBÍ, MEDÍ Y RETIRÉ — y por qué está aquí escrita
// ═════════════════════════════════════════════════════════════════════════════
//   La segunda versión de esta regla exigía que el recorte fuera un **SUFIJO**:
//   en castellano el título va delante («**Poeta** María Zambrano»), así que la
//   forma corta es el final de la larga. Y lo que se añade **por detrás** parecía
//   no ser un título sino un distintivo: `Calle Mayor` contra `Calle Mayor GRP`,
//   que **`src/direccion.js` declara desde la tanda 6 que son dos calles**.
//
//   ⛔ **Y ESTABA MAL.** Lo dijo el dato al clasificar qué se perdía: de los 3.644
//   emparejamientos que la restricción tiraba, casi todos son el **código de
//   barrio rural** que el callejero pega detrás — `MVR` (Movera), `MNZ`
//   (Monzalbarba), `GRP` (Garrapinillos), `SJN`, `CST`, `SIS`, `MNT`, `CRT`…
//
//        «mayor» ⊂ «mayor mvr»   ← es LA MISMA Calle Mayor, la de Movera
//
//   ⭐⭐ `direccion.js` tiene razón **para su pregunta y no para ésta**, y son
//   distintas:
//     · el GEOCODIFICADOR pregunta *«¿qué calle quiere decir este texto?»* — y
//       ahí «Calle Mayor» a secas es AMBIGUA: hay siete en el término. No se
//       puede unir.
//     · este RECONOCEDOR pregunta *«estos dos nombres, pegados a la MISMA
//       geometría, ¿son la misma calle?»* — y ahí sí: el portal está a 5 m de esa
//       línea, y la línea es la Calle Mayor de Movera.
//
//   ⇒ **La regla se queda ANCHA** (recorte contiguo en cualquier posición), la
//     variante de sufijo se mide entera y se publica al lado, y queda escrito
//     ⛔⛔ **ESTO NUNCA RESUELVE UN TEXTO A UNA CALLE.** Solo compara dos nombres
//     que la geometría ya ha puesto en el mismo sitio. (bitácora nº102)

/** ⭐ LA REGLA: `corto` aparece seguido y en orden dentro de `largo`. */
function recorteDe(corto, largo) {
  const a = palabras(corto), b = palabras(largo);
  if (!a.length || a.length >= b.length) return false;
  for (let i = 0; i + a.length <= b.length; i++) {
    let ok = true;
    for (let j = 0; j < a.length; j++) if (a[j] !== b[i + j]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}

/** La variante SUFIJO — ⛔ medida, NO aplicada. `corto` es el final de `largo`. */
function sufijoDe(corto, largo) {
  const a = palabras(corto), b = palabras(largo);
  if (!a.length || a.length >= b.length) return false;
  const d = b.length - a.length;
  for (let j = 0; j < a.length; j++) if (a[j] !== b[d + j]) return false;
  return true;
}

/** La relación entre dos núcleos. */
function relacion(a, b) {
  if (!a || !b) return 'sin-nombre';
  if (a === b) return 'igual';
  if (recorteDe(a, b)) return 'a-recorte-de-b';
  if (recorteDe(b, a)) return 'b-recorte-de-a';
  return 'distintos';
}

/** ⭐ ¿Son la misma vía? Es la pregunta que sustituye a `a === b`. */
function mismaVia(a, b) {
  const r = relacion(a, b);
  return r === 'igual' || r === 'a-recorte-de-b' || r === 'b-recorte-de-a';
}

/** El más largo de los dos — «si es título grande, se deja el grande». */
const elLargo = (a, b) => (palabras(a).length >= palabras(b).length ? a : b);

/**
 * ⭐ La forma larga de un núcleo dentro de un catálogo.
 * ⚠️ AMBIGUO es un resultado: si cabe en dos largos, no se elige (B2).
 * @returns {{estado:'igual'|'unico'|'ambiguo'|'ninguno', nucleo?, candidatos?}}
 */
function largoDe(corto, catalogo) {
  if (!corto) return { estado: 'ninguno' };
  const cand = [];
  for (const k of catalogo) {
    if (k === corto) return { estado: 'igual', nucleo: k };
    if (recorteDe(corto, k)) cand.push(k);
  }
  if (!cand.length) return { estado: 'ninguno' };
  if (cand.length > 1) return { estado: 'ambiguo', candidatos: cand };
  return { estado: 'unico', nucleo: cand[0] };
}

/** La variante SUFIJO de `mismaVia` — ⛔ medida, NO aplicada. */
const mismaViaSufijo = (a, b) => !!a && !!b && (a === b || sufijoDe(a, b) || sufijoDe(b, a));

module.exports = { recorteDe, sufijoDe, relacion, mismaVia, mismaViaSufijo,
  elLargo, largoDe, palabras };

// ═════════════════════════════════════════════════════════════════════════════
// LA MEDIDA
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const D = require('./direccion');
  const A = require('./alarma');
  const H = require('./heredar-nombre');
  const { rng } = require('./sin-vigilancia');
  const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  log('='.repeat(110));
  log('B0 · ⭐ LOS CONTROLES DE LA REGLA — antes de aplicarla a nada');
  log('='.repeat(110));
  {
    // ⭐ POSITIVOS: los tres casos que la tanda 17 dejó escritos en su informe.
    //    ⛔ No los elijo yo: están publicados en `docs/H1-NOMBRAR-ACERAS.md` §C4b.
    const POS = [
      ['leon felipe', 'poeta leon felipe'],
      ['gabriel celaya', 'poeta gabriel celaya'],
      ['juan jose rivas', 'doctor juan jose rivas'],
      ['garcia arista', 'gregorio garcia arista'],
      ['lozano monzon', 'doctor ricardo lozano monzon'],
    ];
    // ⛔ NEGATIVOS: casos que NO se pueden confundir, y que atacan la regla.
    const NEG = [
      ['cruz', 'santa cruz', '⚠️ el aviso de Antonio (B3): «Cruz» y «Santa Cruz» — la regla SÍ los une'],
      ['garcia arista', 'garcia sanchez arista', 'recorte NO contiguo: no vale'],
      ['jilgueros', 'gorriones', 'nada que ver'],
      ['m zambrano', 'poeta maria zambrano', '⛔ la abreviatura: la regla NO la caza, y va dicho'],
      ['mayor', 'mayor grp', '⭐⭐ el distintivo POR DETRÁS: `direccion.js` dice desde la tanda 6 que son DOS calles'],
      ['sargento juan abril', 'juan abril', 'el largo pasado como corto: el orden de los argumentos no manda'],
    ];
    log('');
    log('   POSITIVOS — sacados del informe de la tanda 17, no elegidos por mí (ley 17)');
    let posOk = 0;
    for (const [a, b] of POS) {
      const ok = mismaVia(a, b);
      if (ok) posOk++;
      log('   ' + (ok ? '✅' : '⛔') + '  «' + a + '»  vs  «' + b + '»');
    }
    A.exige(posOk === POS.length, `la regla no reconoce ${POS.length - posOk} de los ${POS.length} casos publicados en la tanda 17`);
    log('');
    log('   NEGATIVOS Y CASOS BORDE — lo que las DOS reglas hacen, digan lo que digan');
    log('   ' + 'REGLA (ancha)'.padStart(16) + 'sufijo'.padStart(10) + '   caso');
    for (const [a, b, nota] of NEG) {
      log('   ' + (mismaVia(a, b) ? '🔗 UNE' : '❌ separa').padStart(16)
        + (mismaViaSufijo(a, b) ? '🔗 UNE' : '❌ separa').padStart(10)
        + '   «' + a + '»  vs  «' + b + '»   ' + nota);
    }
    log('');
    log('   ⚠️⚠️ «cruz» / «santa cruz» LA REGLA LOS UNE, y hay que decirlo alto: es el riesgo que');
    log('      Antonio señaló en B3, y **ninguna de las dos variantes lo resuelve** —«Santa» va');
    log('      delante, como un título—. La defensa NO es una excepción escrita a mano —eso es');
    log('      la lista de títulos con otro nombre— sino que:');
    log('        (1) el corto tiene que EXISTIR como vía para que la unión pase (B2);');
    log('        (2) si cabe en dos largos, es AMBIGUO y no se une;');
    log('        (3) ⭐ y donde de verdad se usa, la GEOMETRÍA ya dice que es la misma línea:');
    log('            el portal está enganchado a ella. Se mide abajo (B3).');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B1 · EL CATÁLOGO — ¿cuántas vías del callejero son recorte de otra?');
  log('='.repeat(110));
  const vias = P.cargarVias();
  const nucleos = [...new Set([...vias.values()].map((v) => v.nucleo).filter((x) => x))];
  {
    log('');
    di('vías del callejero · núcleos distintos', `${vias.size} · ${nucleos.length}`);
    let cortos = 0, ambiguos = 0, unicos = 0;
    const ejAmb = [], ejUni = [];
    for (const n of nucleos) {
      const r = largoDe(n, nucleos.filter((k) => k !== n));
      if (r.estado === 'ninguno' || r.estado === 'igual') continue;
      cortos++;
      if (r.estado === 'ambiguo') { ambiguos++; if (ejAmb.length < 5) ejAmb.push([n, r.candidatos]); }
      else { unicos++; if (ejUni.length < 6) ejUni.push([n, r.nucleo]); }
    }
    di('núcleos que son recorte de OTRO del catálogo', `${cortos}  (${pct(cortos, nucleos.length)})`);
    di('   …con UN solo largo posible', unicos);
    di('   ⚠️ …con DOS o más → AMBIGUO, no se elige (B2)', ambiguos);
    log('');
    for (const [n, l] of ejUni) log('      🔗 «' + n + '»  →  «' + l + '»');
    for (const [n, c] of ejAmb) log('      ⚠️ «' + n + '»  cabe en ' + c.length + ': ' + c.slice(0, 3).map((x) => '«' + x + '»').join(' · '));

    // ⭐ CONTROL NEGATIVO — el mismo test sobre parejas AL AZAR.
    log('');
    log('   ⭐ CONTROL NEGATIVO: el mismo test sobre 20.000 parejas de vías AL AZAR.');
    log('      Si la regla uniera muchas al azar, no estaría reconociendo nada: estaría');
    log('      emparejando. La tanda 17 midió 3 de 19.992 con el mismo control.');
    const r = rng(20260804);
    let une = 0, N = 20000;
    for (let k = 0; k < N; k++) {
      const a = nucleos[Math.floor(r() * nucleos.length)];
      const b = nucleos[Math.floor(r() * nucleos.length)];
      if (a !== b && mismaVia(a, b)) une++;
    }
    di('   parejas al azar que la regla une', `${une} de ${N}  (${pct(une, N)})`);
    A.exige(une / N < 0.01, `la regla une el ${pct(une, N)} de las parejas al azar: es un emparejador, no un reconocedor`);
    global._B1 = { cortos, unicos, ambiguos, azar: une };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B3 · ⭐⭐ SOBRE EL TESTIGO DEL ENGANCHE — ¿cuántos emparejamientos cambian?');
  log('='.repeat(110));
  log('   La salvaguarda 1 del enganche compara el `codigoVia` municipal del portal con el');
  log('   nombre que OSM le pone a la línea a la que se enganchó. ⛔ MARCA, no corrige.');
  log('   ⚠️ Que la regla no rompa nada PASA POR CONSTRUCCIÓN —`igual || contiene` solo puede');
  log('      añadir—. Se comprueba igual, y lo que de verdad se mide es si los NUEVOS son');
  log('      ciertos, con un testigo que la regla no puede ver: **la distancia de enganche**.');
  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales;
  {
    let concuerda = 0, discorda = 0, nuevos = 0, rotos = 0;
    const dNuevos = [], dViejos = [], dSiguen = [];
    const ej = [];
    for (const o of portales) {
      if (o.codigoVia_estado !== 'concuerda' && o.codigoVia_estado !== 'DISCORDA') continue;
      const antes = o.codigoVia_estado === 'concuerda';
      const ahora = mismaVia(o.via.nucleo, o.nucleoOsm);
      if (antes) { concuerda++; dViejos.push(o.d); if (!ahora) rotos++; }
      else {
        discorda++;
        if (ahora) { nuevos++; dNuevos.push(o.d); if (ej.length < 8) ej.push(o); }
        else dSiguen.push(o.d);
      }
    }
    const rep = (l) => {
      const s = l.slice().sort((a, b) => a - b);
      const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN);
      return `${q(0.5).toFixed(1)} m · ${q(0.9).toFixed(1)} m`;
    };
    log('');
    di('portales comparables (los dos nombres existen)', concuerda + discorda);
    di('   concordaban con la regla vieja (`a === b`)', `${concuerda}  (${pct(concuerda, concuerda + discorda)})`);
    di('   discordaban', discorda);
    log('');
    di('⭐ pasan de DISCORDA a concuerda con la regla nueva', `${nuevos}  (${pct(nuevos, discorda)} de los discordantes)`);
    di('⛔ pasan de concuerda a DISCORDA (tiene que ser 0)', rotos + (rotos === 0 ? '   ✅' : '   ⛔ LA REGLA ROMPE'));
    A.exige(rotos === 0, `la regla rompe ${rotos} emparejamientos que hoy funcionan`);
    di('⭐ concordancia total: antes → después',
      `${pct(concuerda, concuerda + discorda)}  →  ${pct(concuerda + nuevos, concuerda + discorda)}`);
    {
      // ⛔ la variante SUFIJO, medida y NO aplicada — y con ella la CLASIFICACIÓN
      //    de lo que se perdería, que es lo que decidió no aplicarla (ley 29).
      let nS = 0;
      const solo = [];
      for (const o of portales) {
        if (o.codigoVia_estado !== 'DISCORDA') continue;
        if (!mismaVia(o.via.nucleo, o.nucleoOsm)) continue;
        if (mismaViaSufijo(o.via.nucleo, o.nucleoOsm)) nS++; else solo.push(o);
      }
      log('');
      di('⛔ la variante SUFIJO (no aplicada) añadiría', `${nS}  →  ${pct(concuerda + nS, concuerda + discorda)}`);
      log('   ⭐⭐ Y LO QUE TIRARÍA, CLASIFICADO ANTES DE CONTARLO (ley 29) — es lo que decidió');
      log('      no aplicarla. Las palabras que sobran por detrás, agrupadas:');
      const extra = new Map();
      for (const o of solo) {
        const a = palabras(o.via.nucleo), b = palabras(o.nucleoOsm);
        const l = a.length >= b.length ? a : b, c = a.length >= b.length ? b : a;
        const cola = l.slice(l.length - (l.length - c.length)).join(' ');
        const k = /^[a-z]{3}$/.test(cola) ? 'un código de barrio rural de 3 letras' : '«' + cola + '»';
        if (!extra.has(k)) extra.set(k, 0);
        extra.set(k, extra.get(k) + 1);
      }
      log('');
      for (const [k, v] of [...extra.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
        log('      ' + String(v).padStart(6) + '  la cola es ' + k);
      }
      log('');
      log('      ⇒ ⭐ `MVR` Movera · `MNZ` Monzalbarba · `GRP` Garrapinillos · `SJN` San Juan ·');
      log('        `CST` Casetas · `SIS` Santa Isabel… **es la MISMA Calle Mayor, la de Movera.**');
      log('        `direccion.js` tiene razón para SU pregunta —«¿qué calle quiere decir este');
      log('        texto?», y ahí «Calle Mayor» es ambigua— y no para ésta, que compara dos');
      log('        nombres que la geometría ya ha puesto en el mismo sitio.');
      global._SUF = { nS, solo: solo.length };
    }
    log('');
    log('   ⭐⭐ EL TESTIGO QUE LA REGLA NO PUEDE VER — la distancia de enganche (mediana · p90)');
    log('      Si los nuevos aciertos fueran calles equivocadas, estarían LEJOS de su línea.');
    di('   los que ya concordaban', rep(dViejos));
    di('   ⭐ los que la regla nueva añade', rep(dNuevos));
    di('   los que SIGUEN discordando', rep(dSiguen));
    log('');
    for (const o of ej) {
      log('      🔗 ' + String(Math.round(o.d) + ' m').padStart(6) + '  municipal: '
        + String(o.via.nombre).slice(0, 40).padEnd(42) + 'OSM: ' + o.nombreOsm);
    }
    global._B3 = { concuerda, discorda, nuevos, rotos, dNuevos, dViejos, dSiguen };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B4 · ⭐⭐ SOBRE EL PATRÓN DE VERDAD DEL MÉTODO — ¿cuánto sube el acierto?');
  log('='.repeat(110));
  log('   El patrón de verdad: se tapa el nombre de una línea que SÍ lo tiene y se mira si el');
  log('   método lo adivina. La tanda 17 publicó 76,7 % por arista y 80,9 % por way, y midió');
  log('   que el 56,8 % de los «fallos» eran la misma calle con otro nombre.');
  {
    const nombreArista = g.aristas.map((e) => g.nombres.get(e.way) || null);
    const nucleoArista = nombreArista.map((n) => P.nucleo(n));
    const enganchados = portales.filter((o) => o.enganchado);
    const proy = enganchados.map(H.proyectar);

    // ⭐ las dos unidades, porque las dos se publicaron
    const porArista = H.agrupar(proy);
    const gruposWay = new Map();
    enganchados.forEach((o, k) => {
      const w = g.aristas[o.arista].way;
      if (!gruposWay.has(w)) gruposWay.set(w, []);
      gruposWay.get(w).push(proy[k]);
    });
    const decWay = new Map();

    const verdad = [];
    for (let i = 0; i < g.aristas.length; i++) if (nucleoArista[i]) verdad.push(i);

    const medir = (decisionDe) => {
      let ac = 0, fa = 0, acLargo = 0, noOp = 0;
      const ejemplos = [];
      for (const i of verdad) {
        const d = decisionDe(i);
        if (!d || d.estado !== 'NOMBRADA') { noOp++; continue; }
        if (d.nombre === nucleoArista[i]) { ac++; continue; }
        if (mismaVia(d.nombre, nucleoArista[i])) {
          acLargo++;
          if (ejemplos.length < 6) ejemplos.push([nombreArista[i], d.nombre]);
        } else fa++;
      }
      return { ac, fa, acLargo, noOp, op: ac + fa + acLargo, ejemplos };
    };

    const A1 = medir((i) => H.decidir(porArista.get(i)));
    const W1 = medir((i) => {
      const w = g.aristas[i].way;
      if (!decWay.has(w)) decWay.set(w, H.decidir(gruposWay.get(w)));
      return decWay.get(w);
    });

    log('');
    log('   ' + 'unidad'.padEnd(12) + 'opina'.padStart(9) + 'acierto EXACTO'.padStart(17)
      + '+ misma vía, otro nombre'.padStart(26) + '⭐ acierto CON LA REGLA'.padStart(25));
    for (const [n, m] of [['arista', A1], ['⭐ way', W1]]) {
      log('   ' + n.padEnd(12) + String(m.op).padStart(9)
        + `${m.ac} (${pct(m.ac, m.op)})`.padStart(17)
        + `${m.acLargo} (${pct(m.acLargo, m.op)})`.padStart(26)
        + pct(m.ac + m.acLargo, m.op).padStart(25));
    }
    log('');
    log('   ⭐ los que dejan de contar como fallo, uno a uno:');
    for (const [v, m] of W1.ejemplos) log('      VERDAD: ' + String(v).slice(0, 40).padEnd(42) + 'MÉTODO: ' + m);
    log('');
    log('   ⚠️ Y sigue siendo un TECHO, no una estimación: las aristas CON nombre no son una');
    log('      muestra al azar de las que no lo tienen (§C2 de la tanda 17). ⛔ Lo que la regla');
    log('      cambia es qué se cuenta como fallo, no de dónde sale la muestra.');
    global._B4 = { A1, W1 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('='.repeat(110));
  log('B5 · ⛔ LO QUE LA REGLA NO CAZA — las abreviaturas, contadas');
  log('='.repeat(110));
  log('   `M. Zambrano` normaliza a `m zambrano`, y `m` no es `maria`. Antonio lo puso en el');
  log('   ejemplo y esta regla NO lo resuelve. ⇒ se cuenta cuántos hay y se deja escrito.');
  {
    const conInicial = (n) => palabras(n).some((p) => p.length === 1);
    const viasAbrev = nucleos.filter(conInicial);
    const osm = new Set();
    for (const [, n] of g.nombres) { const nu = P.nucleo(n); if (nu) osm.add(nu); }
    const osmAbrev = [...osm].filter(conInicial);
    log('');
    di('núcleos del callejero con alguna palabra de UNA letra', `${viasAbrev.length} de ${nucleos.length}  (${pct(viasAbrev.length, nucleos.length)})`);
    di('núcleos de OSM con alguna palabra de UNA letra', `${osmAbrev.length} de ${osm.size}  (${pct(osmAbrev.length, osm.size)})`);
    log('');
    for (const n of viasAbrev.slice(0, 8)) log('      ⛔ «' + n + '»');
    log('');
    log('   ⚠️ Casi todas son ordinales romanos («juan carlos i», «alfonso i»), no abreviaturas');
    log('      de nombre propio. ⛔ Y ésos NO se deben tocar: «Alfonso I» y «Alfonso» son dos');
    log('      calles distintas de Zaragoza. **Una regla de iniciales las uniría.**');
    global._B5 = { viasAbrev: viasAbrev.length, osmAbrev: osmAbrev.length };
  }

  log('');
  log('='.repeat(110));
  log(A.cierre('EL NOMBRE LARGO'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
