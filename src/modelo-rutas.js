// ⭐⭐ TANDA 19 · D · LAS SIETE RUTAS — el control que no se rompe.
//
//   node src/modelo-rutas.js
//
// ⛔⛔ EL MODELO NO TOCA EL CÁLCULO. Entra por `Rel.texto({modelo})` y solo habla
//     donde OSM se calla. Esto lo comprueba, no lo promete.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?»
// ═════════════════════════════════════════════════════════════════════════════
// D1 · «las siete rutas idénticas» ⚠️ **PUEDE PASAR POR CONSTRUCCIÓN**: si el
//      modelo no entra en el cálculo, salen idénticas hiciera lo que hiciera. ⇒ se
//      dice, y se hacen TRES comprobaciones que sí pueden fallar:
//        (1) las dos ejecuciones —con y sin `--modelo`— tienen que dar la MISMA
//            lista de aristas y los MISMOS metros con decimal. Si el modelo se
//            colara en el cálculo, esto lo caza.
//        (2) los metros contra los PUBLICADOS en la tanda 16, que son un patrón
//            externo y anterior a esta tanda. Si el grafo se hubiera movido por
//            cualquier otra razón, esto lo caza.
//        (3) el TEXTO de las rutas 1 a 5 tiene que ser idéntico entre las dos
//            ejecuciones. **Ése es el que de verdad puede fallar**, porque
//            `relato.js` SÍ se ha tocado en esta tanda.
//      ⚠️ Lo que esto NO comprueba: que la salida sin `--modelo` sea idéntica a la
//      de ANTES de tocar `relato.js`. Eso se comprobó a mano con `md5sum` contra
//      una captura hecha antes del primer cambio, y el informe lo dice — pero la
//      captura vivía fuera del repositorio y no se puede repetir desde aquí.
//
// D4 · «cuántos metros sin nombre quedan» ⚠️ se mide sobre las aristas que PISA la
//      ruta, no sobre los ways enteros (bitácora nº94).

'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const A = require('./alarma');
const F = require('./forma');
const AB = require('./asignar-bici');
const Mo = require('./modelo');
const P = require('./portales');
const osm = require('./osm');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(56)} ${v}`);
const km = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m');
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');

// ⭐ PATRÓN EXTERNO: los metros publicados en `docs/H1-VER-RUTAS.md` (tanda 16),
//    escritos antes de que esta tanda existiera. No los elijo yo (ley 17).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ TANDA 33 · DOS DE ESTOS NÚMEROS SE HAN MOVIDO, Y ES UNA DECISIÓN
// ═════════════════════════════════════════════════════════════════════════════
//   La regla de la paridad (`src/paridad.js`) cambió lo que contesta el buscador
//   a un número que no existe. Dos rutas lo notan, **y las dos por su extremo**:
//
//   · **nº1 · `Avenida Cataluña 78` → `Avenida Pablo Gargallo 16`.** Los DOS
//     extremos dejan de resolverse: el 78 cae en un hueco de 175 m entre el 74 y
//     el 84, y los pares de Pablo Gargallo empiezan en el 36. ⇒ la ruta pasa a
//     **sugerencia** y ya no tiene metros. Los 3.086,9 m publicados estaban
//     medidos **entre el 77 y el 15** —la acera de enfrente en los dos extremos—,
//     que es justo el fallo que Antonio encontró. ⛔ No se sustituye por otro
//     número: aceptando las sugerencias daría 2.832,1 m, pero eso ya no es «la
//     ruta nº1», es otra consulta.
//   · **nº6 · `Calle Matadero 1`.** El 1 no existe; antes caía en el 2 —enfrente—
//     y ahora en el 3, a un paso de 23 m. **523,4 → 520,2 m.**
//
//   ⛔ Las otras cinco no se mueven ni un milímetro, y la **nº7 —la que calibra
//     los ~6 km/h— tiene sus dos extremos exactos**. Eso se comprueba abajo.
//   ⚠️ Actualizar estos números NO es un trámite: es aceptar que el banco de
//     pruebas mide otra cosa que antes. Queda escrito aquí y en
//     `docs/H1-PARIDAD.md` §C4. ⛔ `data/pruebas/RUTAS-CONOCIDAS.md` no se toca:
//     es de Antonio.
//
// ⭐⭐⭐ TANDA 6 · ENTRA LA Nº8, y con ella una consecuencia que se dice en voz
//   alta: **al entrar aquí, la nº8 pasa a ser COSTURA DE PARADA como las demás.**
//   Desde hoy, si sus metros se mueven, este guardián se pone rojo y el trabajo
//   para. No es un número de adorno: es un invariante más, con el mismo peso que
//   los seis de arriba.
//   ⚠️ Y sus metros son los del **portal 1** de Padre Arrupe, con el destino
//     resuelto `exacto`. Con el texto anterior —que llevaba un paréntesis detrás
//     del número— el buscador leía `numero-aproximado` y caía en el portal 6:
//     6.446,6 m en vez de 6.366,1. **80,5 m de diferencia, en silencio.**
const PUBLICADOS = { 2: 598.1, 3: 3704.9, 4: 505.9, 5: 477.4, 6: 520.2, 7: 2528.9, 8: 6366.1 };

/** ⭐ Las que YA NO se resuelven, con el motivo. Es una expectativa, no un hueco. */
const A_SUGERENCIA = { 1: 'los dos extremos caen en un hueco de su propia acera (tanda 33)' };

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ TANDA 31 · Y LOS PASOS DEL ITINERARIO, QUE TAMBIÉN ESTABAN PUBLICADOS
// ═════════════════════════════════════════════════════════════════════════════
//   `docs/H1-NOMBRES-Y-PASOS.md` §0 publica «EL ITINERARIO TIENE UN CUARTO MENOS
//   DE PASOS: las siete rutas, 110 → 82». **Hoy son 74**, y nadie se enteró: las
//   tandas 25, 26, 27 y 31 han seguido fundiendo pasos al poner nombres, y ese
//   número se recalculaba, se imprimía y no se comparaba con nada — exactamente lo
//   que le pasó a las «3.166 puertas» (§E de la tanda 31).
//   ⇒ Se republica en `docs/H1-ROJOS-CERRADOS.md` §E y se congela AQUÍ, que es el
//     sitio donde ya se ejecutan las siete rutas: congelarlo en otro fichero
//     obligaría a correrlas dos veces.
//   ⚠️ Y envejecerá, como todos: el día que una tanda funda un paso más, esto se
//     pone rojo y hay que republicarlo. Eso es el objetivo, no el defecto.
//
// ⚠️⚠️ TANDA 33 · Y HA ENVEJECIDO, EXACTAMENTE COMO SE DIJO. **74 → 56.** No es que
//   se hayan fundido pasos: es que **la ruta nº1 ya no se resuelve** y sus 18 pasos
//   no existen. ⇒ el número se republica en `docs/H1-PARIDAD.md` §C4 con su motivo.
//   ⛔ Se actualiza porque la causa está identificada y es la decisión de esta
//     tanda. Si el motivo fuera «ha salido otro número», NO se tocaría.
//
// ⭐⭐⭐ TANDA 6 · **56 → 83**, y esta vez la causa NO es que se fundan pasos ni
//   que se pierda una ruta: es que **entra la nº8**, que son 6,4 km y 27 pasos
//   ella sola. ⇒ el número se republica en `docs/H1-REPUBLICACIONES.md` §F con
//   su puntero, y **entonces** se actualiza aquí — publicar primero, congelar
//   después, que es el orden que manda `numeros-congelados.js`.
//   ⚠️ Y sigue envejeciendo igual que antes: el día que una tanda funda un paso,
//     esto se pone rojo. Eso es el objetivo.
const PASOS_PUBLICADOS = 83;

/** Ejecuta `rutas-antonio.js` y devuelve {texto, aristas}. */
function correr(flags) {
  let salida = '';
  try {
    salida = execFileSync(process.execPath, [path.join(__dirname, 'rutas-antonio.js'), '--aristas', ...flags],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    // ⚠️ sale en ROJO a propósito: la nº4 tiene el rodeo declarado fuera de banda
    salida = (e.stdout || '').toString();
  }
  const l = salida.split('\n').find((x) => x.startsWith('##ARISTAS##'));
  return { salida, aristas: l ? JSON.parse(l.slice('##ARISTAS##'.length)) : null };
}

/** Extrae el bloque «LA RUTA, SALTO A SALTO» de cada ruta. */
function bloques(salida) {
  const lineas = salida.split('\n');
  const out = new Map();
  let ruta = null, dentro = false, buf = [];
  for (const x of lineas) {
    const m = x.match(/^RUTA (\d+) ·/);
    if (m) { ruta = Number(m[1]); }
    if (x.includes('LA RUTA, SALTO A SALTO')) { dentro = true; buf = []; continue; }
    if (dentro) {
      if (x.includes('⛔ Lo que este motor NO sabe')) { dentro = false; out.set(ruta, buf.join('\n')); continue; }
      buf.push(x);
    }
  }
  return out;
}

const T0 = Date.now();
log('='.repeat(110));
log('D · LAS SIETE RUTAS DE ANTONIO — el control que no se rompe');
log('='.repeat(110));

// ⚠️ TANDA 21 · el modelo se monta con `Mo.construirModelo`, que es lo que usa
//    `rutas-antonio.js`. ⛔ Si aquí se montara distinto, este guardián estaría
//    midiendo un modelo que nadie imprime — que es el fallo nº68 con otra ropa.
const g = construir(ZONA_TERMINO);
const Dir = require('./direccion');
const ctxG = Dir.abrir(g, CRUDO);
const mod = Mo.construirModelo(g, ctxG.enganche.portales.filter((o) => o.enganchado));
const { M, tags } = mod;

const sin = correr([]);
const con = correr(['--modelo']);

log('');
log('D1 · ⭐⭐⭐ ¿ES LA MISMA RUTA?');
log('   ⚠️ Esto PUEDE PASAR POR CONSTRUCCIÓN: el modelo no entra en el cálculo, así que');
log('      saldrían idénticas hiciera lo que hiciera. ⇒ van tres comprobaciones que SÍ');
log('      pueden fallar, y la tercera es la que de verdad arriesga.');
A.exige(!!sin.aristas && !!con.aristas, 'no se ha podido leer `##ARISTAS##` de alguna de las dos ejecuciones');
{
  log('');
  log('   (1) las dos ejecuciones, ruta por ruta');
  log('   ' + 'ruta'.padStart(5) + 'metros sin modelo'.padStart(20) + 'metros con modelo'.padStart(20)
    + 'aristas'.padStart(10) + 'idénticas'.padStart(12) + '   publicado tanda 16');
  for (const r of sin.aristas) {
    const c = con.aristas.find((x) => x.n === r.n);
    const mismasAristas = c && JSON.stringify(c.aristas) === JSON.stringify(r.aristas);
    const mismosMetros = c && c.metros === r.metros;
    const pub = PUBLICADOS[r.n];
    const okPub = pub != null && Math.abs(r.metros - pub) < 0.05;
    log('   ' + String(r.n).padStart(5) + r.metros.toFixed(1).padStart(20) + (c ? c.metros.toFixed(1) : '—').padStart(20)
      + String(r.aristas.length).padStart(10) + (mismasAristas && mismosMetros ? '✅' : '⛔').padStart(12)
      + '   ' + (pub == null ? 'NO DEBERÍA RESOLVERSE' : pub.toFixed(1) + (okPub ? '  ✅' : '  ⛔ SE HA MOVIDO')));
    A.exige(mismasAristas && mismosMetros, `la ruta nº${r.n} cambia entre las dos ejecuciones: el modelo se ha colado en el cálculo`);
    A.exige(okPub, `la ruta nº${r.n} da ${r.metros} y lo publicado es ${pub == null ? 'que NO se resuelve' : pub}`);
  }
  // ⭐⭐ Y EL LADO CONTRARIO: las que tienen que seguir SIN resolverse. ⛔ Sin esto,
  //   revertir la paridad en silencio dejaría este guardián en verde — que es la
  //   forma exacta del fallo nº105: un testigo que no depende de lo que vigila.
  log('');
  for (const [n, porque] of Object.entries(A_SUGERENCIA)) {
    const vuelve = sin.aristas.some((x) => x.n === Number(n));
    di(`   ⭐ la ruta nº${n} NO debe resolverse`, vuelve ? '⛔ VUELVE A RESOLVERSE' : '✅ sigue en sugerencia');
    A.exige(!vuelve, `la ruta nº${n} vuelve a resolverse y lo publicado es que no: ${porque}. `
      + 'O se ha revertido la regla de la paridad, o el callejero ha ganado ese portal. Las dos cosas son una decisión, no un trámite');
  }
}
{
  log('');
  log('   (3) ⭐ EL TEXTO — la comprobación que de verdad puede fallar, porque `relato.js` SÍ');
  log('       se ha tocado.');
  log('   ⚠️⚠️ TANDA 21 · LA EXPECTATIVA YA NO SE ESCRIBE A MANO. Hasta hoy decía «solo cambian');
  log('       la 6 y la 7», y al aplicar el método de portales se puso roja — porque la lista');
  log('       era mía, no del dato. ⛔ Actualizar la lista habría sido ajustar el instrumento');
  log('       al resultado. ⇒ **la expectativa se DERIVA**: el texto de una ruta tiene que');
  log('       cambiar SI Y SOLO SI alguno de los ways que pisa gana vía por el modelo.');
  const bSin = bloques(sin.salida), bCon = bloques(con.salida);
  // ⚠️ TANDA 33 · son SEIS, no siete: la nº1 pasó a sugerencia y no tiene texto.
  //   ⛔ El número se deriva de `A_SUGERENCIA` en vez de escribirse a mano, para que
  //     el día que la nº1 vuelva no haya que acordarse de tocar dos sitios.
  //
  // ⭐⭐⭐ TANDA 6 · Y EL `7` TAMBIÉN ERA UN LITERAL, con el mismo fallo dentro.
  //   Derivar de `A_SUGERENCIA` arreglaba una mitad y dejaba la otra escrita a
  //   mano: **cuántas rutas hay**. Entró la nº8 y esto se puso rojo diciendo que
  //   faltaban bloques, cuando lo que sobraba era una expectativa vieja.
  //   ⇒ Es el MISMO fallo que la tanda 2·bis quitó de `donde-falta.js` §A6 y de
  //     `pasos.js` §C5, y sobrevivía aquí: **no se copia el número de rutas, se
  //     le pregunta al banco de pruebas** (ley 56).
  const TR = require('./tabla-rutas').leer();
  const ESPERADOS = TR.rutas.length - Object.keys(A_SUGERENCIA).length;
  A.exige(bSin.size === ESPERADOS && bCon.size === ESPERADOS,
    `no se han extraído los ${ESPERADOS} bloques de texto (${bSin.size} / ${bCon.size})`);

  // ── ⭐⭐ TANDA 31 · LOS PASOS, CONGELADOS ──────────────────────────────────
  {
    const pasosDe = (b) => (b.match(/^\s+\d+\.\s/gm) || []).length;
    const porRuta = [...bCon.entries()].sort((a, b) => a[0] - b[0]).map(([n, b]) => [n, pasosDe(b)]);
    const total = porRuta.reduce((s, x) => s + x[1], 0);
    log('');
    log('   ⭐⭐ PASOS DEL ITINERARIO (congelado en la tanda 31)');
    log('      ' + porRuta.map(([n, p]) => `${n}:${p}`).join(' · '));
    di('   pasos en las siete, con modelo', `${total} / ${PASOS_PUBLICADOS}`
      + (total === PASOS_PUBLICADOS ? '   ✅' : '   ⛔ SE HA MOVIDO'));
    A.exige(total === PASOS_PUBLICADOS,
      `las siete rutas salen en ${total} pasos y lo publicado son ${PASOS_PUBLICADOS}: `
      + 'el itinerario ha cambiado de forma. Si es a propósito, se republica y se actualiza; si no, es un hallazgo');
    // ⭐ y que la cuenta no pase por vacío: si el extractor dejara de encontrar
    //   pasos, `total` sería 0 y solo saltaría por el número, sin decir por qué.
    A.exige(porRuta.every(([, p]) => p > 0),
      'alguna ruta sale con CERO pasos: el extractor de pasos no está leyendo el texto');
  }
  log('');
  log('   ' + 'ruta'.padStart(5) + 'texto'.padStart(16) + '   qué pasa');
  const cambian = [];
  for (const n of [...bSin.keys()].sort((a, b) => a - b)) {
    const igual = bSin.get(n) === bCon.get(n);
    if (!igual) cambian.push(n);
    log('   ' + String(n).padStart(5) + (igual ? 'IDÉNTICO' : 'CAMBIA').padStart(16)
      + '   ' + (igual ? 'ninguna vía municipal nueva' : 'gana vía declarada por el Ayuntamiento'));
  }
  log('');
  // ⭐ la expectativa, DERIVADA del modelo y no de una lista
  const deben = [];
  for (const r of con.aristas) {
    const gana = r.aristas.some((i) => {
      if (g.nombres.get(g.aristas[i].way)) return false;   // OSM ya lo nombra
      const d = mod.deWay.get(g.aristas[i].way);
      return !!(d && d.via && d.via.nombre);
    });
    if (gana) deben.push(r.n);
  }
  deben.sort((a, b) => a - b);
  log('');
  di('⭐ rutas cuyo texto cambia', cambian.join(', '));
  di('   …y las que DEBEN cambiar según el modelo', deben.join(', '));
  A.exige(JSON.stringify(cambian) === JSON.stringify(deben),
    `cambian las rutas ${cambian.join(',')} y el modelo dice que deben cambiar ${deben.join(',')}`);
  log('   ⇒ ⚠️ Y esto NO pasa por construcción: una ruta que gana vía y NO cambia de texto');
  log('     significaría que el modelo se monta y no llega al redactor, y una que cambia sin');
  log('     ganarla, que `relato.js` se ha movido por otra razón. Las dos son fallo.');
  global._BLOQ = { bSin, bCon };
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('B5 · ⭐⭐ EL TRAMO DE LA RUTA 7 — el único sitio con verdad sobre el terreno');
log('='.repeat(110));
log('   Antonio: «En San Juan de la Peña NO está a la misma cota. En Avenida de la Academia');
log('   General Militar SÍ.» ⇒ tiene que salir San Juan de la Peña «calzada» y Academia');
log('   General Militar «acera».');
{
  const r7 = con.aristas.find((x) => x.n === 7);
  const WAYS = [354344721, 475881583];
  const idx = r7.aristas.filter((i) => WAYS.includes(g.aristas[i].way));
  di('aristas de esos dos ways que PISA la ruta nº7', `${idx.length}  (${km(idx.reduce((s, i) => s + g.aristas[i].largo, 0))})`);
  log('   ⛔ sobre lo que pisa la ruta, no sobre el way entero (bitácora nº94).');
  log('');
  const c = new Map();
  for (const i of idx) {
    const m = M[i];
    const k = (m.forma.ciclista || '(sin ciclista)') + '  ·  ' + (m.via ? m.via.nombre : 'SIN VÍA')
      + '  ·  ' + (m.forma.ciclistaTipo || '—');
    if (!c.has(k)) c.set(k, { n: 0, m: 0 });
    const v = c.get(k); v.n++; v.m += g.aristas[i].largo;
  }
  log('   ' + 'ciclista · vía · tipo literal del municipal'.padEnd(74) + 'aristas'.padStart(8) + 'metros'.padStart(10));
  for (const [k, v] of [...c.entries()].sort((a, b) => b[1].m - a[1].m)) {
    log('   ' + k.slice(0, 73).padEnd(74) + String(v.n).padStart(8) + km(v.m).padStart(10));
  }
  const hayAGM = [...c.keys()].some((k) => /ACADEMIA GENERAL MILITAR/.test(k) && /carril-sobre-acera/.test(k));
  const haySJP = [...c.keys()].some((k) => /SAN JUAN DE LA PEÑA/.test(k) && /carril-en-calzada/.test(k));
  log('');
  di('⭐ Academia General Militar sale «sobre acera»', hayAGM ? '✅ sí' : '⛔ NO');
  di('⭐ San Juan de la Peña sale «en calzada»', haySJP ? '✅ sí' : '⛔ NO — sobre lo que se anda, NO');
  A.exige(hayAGM && haySJP, 'sobre las aristas que PISA la ruta 7, San Juan de la Peña no sale como «carril en calzada»: los metros que se andan no tienen asignación propia');

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️⚠️⚠️ Y AQUÍ ESTÁ EL PORQUÉ, QUE ES EL HALLAZGO DE LA TANDA
  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('   ⚠️⚠️ ¿POR QUÉ? — porque el WAY sí lo tiene, pero en OTRO TROZO. Y el texto se lo');
  log('      presta. Esto hay que verlo entero antes de creerse ninguna frase:');
  for (const W of WAYS) {
    const enRuta = r7.aristas.filter((i) => g.aristas[i].way === W);
    const todas = [];
    for (let i = 0; i < g.aristas.length; i++) if (g.aristas[i].way === W) todas.push(i);
    const conVia = todas.filter((i) => M[i].via);
    const enRutaConVia = enRuta.filter((i) => M[i].via);
    const solapan = enRuta.filter((i) => conVia.includes(i)).length;
    log('');
    log('      way ' + W);
    di('         aristas del way · las que pisa la ruta', `${todas.length} · ${enRuta.length}`);
    di('         aristas del way CON asignación municipal', `${conVia.length}  (${km(conVia.reduce((s, i) => s + g.aristas[i].largo, 0))})`);
    di('         ⭐ …de las que pisa la ruta', `${enRutaConVia.length}  (${km(enRutaConVia.reduce((s, i) => s + g.aristas[i].largo, 0))})`);
    di('         ⚠️ ¿solapan los dos trozos?', solapan === 0 ? '⛔ NO: son trozos DISJUNTOS del mismo way' : `${solapan} aristas`);
  }
  log('');
  log('   ⇒ ⛔⛔ EL WAY 475881583 TIENE 783 m ASIGNADOS A SAN JUAN DE LA PEÑA **Y NO SON LOS');
  log('     760 m QUE ANTONIO ANDUVO**: son el trozo de al lado. La regla de resolución a way');
  log('     (2/3 de los metros con vía) extiende el nombre al way entero, y por eso el texto');
  log('     dice «el carril bici de Avenida de San Juan de la Peña» en unos metros que NO');
  log('     tienen asignación propia.');
  log('   ⚠️ NO es un error de emparejamiento: ahí la asignación sale AMBIGUA —el carril y la');
  log('     calzada de la misma avenida son dos candidatas compatibles y cercanas— y la regla');
  log('     hace lo correcto: NO asignar. Lo que discute es si el TEXTO puede heredar del way.');
  log('   ⛔ Se deja como está y se mide cuánto pesa (abajo). Decide Antonio.');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('D4 · CUÁNTOS METROS SIN NOMBRE QUEDAN EN LAS SIETE');
log('='.repeat(110));
log('   ⛔ Medido sobre las aristas que PISA cada ruta. Y con la vía resuelta a WAY, que es');
log('      como el texto la usa — no a arista, que daría un número mejor y falso.');
{
  const deWay = Mo.resolverPorWay(g, M);
  const NO = new Set(['paso-de-peatones', 'escaleras']);
  let tS = 0, tG = 0;
  log('');
  log('   ' + 'ruta'.padStart(5) + 'm sin nombre (OSM)'.padStart(22) + 'm que gana vía municipal'.padStart(28) + '%'.padStart(9));
  for (const r of con.aristas) {
    const sn = r.aristas.filter((i) => !g.nombres.get(g.aristas[i].way) && !NO.has(g.aristas[i].precision));
    const gan = sn.filter((i) => deWay.get(g.aristas[i].way));
    const mS = sn.reduce((s, i) => s + g.aristas[i].largo, 0);
    const mG = gan.reduce((s, i) => s + g.aristas[i].largo, 0);
    tS += mS; tG += mG;
    log('   ' + String(r.n).padStart(5) + mS.toFixed(0).padStart(22) + mG.toFixed(0).padStart(28) + pct(mG, mS).padStart(9));
  }
  log('   ' + '─'.repeat(62));
  log('   ' + 'TOTAL'.padStart(5) + tS.toFixed(0).padStart(22) + tG.toFixed(0).padStart(28) + pct(tG, tS).padStart(9));
  log('');
  // ⚠️⚠️ EL DESCUENTO HONESTO: ¿cuántos de esos metros tienen asignación PROPIA?
  log('');
  log('   ⚠️⚠️ Y EL DESCUENTO QUE HAY QUE HACERLE A ESE NÚMERO: la vía se resuelve por WAY, así');
  log('      que un trozo sin asignación propia hereda el nombre del resto de su way.');
  log('   ' + 'ruta'.padStart(5) + 'm nombrados'.padStart(16) + 'con asignación PROPIA'.padStart(24)
    + 'heredados del way'.padStart(20));
  let hP = 0, hH = 0;
  for (const r of con.aristas) {
    const sn = r.aristas.filter((i) => !g.nombres.get(g.aristas[i].way) && !NO.has(g.aristas[i].precision));
    const gan = sn.filter((i) => deWay.get(g.aristas[i].way));
    const propia = gan.filter((i) => M[i].via);
    const mG = gan.reduce((s, i) => s + g.aristas[i].largo, 0);
    const mP = propia.reduce((s, i) => s + g.aristas[i].largo, 0);
    hP += mP; hH += mG - mP;
    if (!mG) continue;
    log('   ' + String(r.n).padStart(5) + mG.toFixed(0).padStart(16) + mP.toFixed(0).padStart(24)
      + (mG - mP).toFixed(0).padStart(20));
  }
  log('   ' + '─'.repeat(64));
  log('   ' + 'TOTAL'.padStart(5) + (hP + hH).toFixed(0).padStart(16) + hP.toFixed(0).padStart(24) + hH.toFixed(0).padStart(20));
  log('   ⇒ ⭐ EL NÚMERO CONSERVADOR ES ' + hP.toFixed(0) + ' m (' + pct(hP, tS) + '), no ' + (hP + hH).toFixed(0) + '.');
  log('     La diferencia son metros que el texto nombra heredando del way. **Ninguno de los');
  log('     dos está mal; hay que decir cuál se cita.**');
  log('');
  log('   ⭐ COMPARACIÓN con lo que había:');
  log('      · sin nada                     3.851 m sin nombre');
  log('      · método de portales (tanda 17) 1.159 m nombrados (30,1 %) — ⚠️ DEDUCIDOS');
  log('      · ⭐ este modelo               ' + tG.toFixed(0) + ' m nombrados (' + pct(tG, tS) + ') — ⭐ DECLARADOS por el Ayuntamiento');
  log('   ⛔ Y no se suman: el método de portales sigue SIN aplicarse.');
  global._D4 = { tS, tG };
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(110));
log('D2 · EL TEXTO, ANTES Y DESPUÉS — solo las dos que cambian');
log('='.repeat(110));
{
  const { bSin, bCon } = global._BLOQ;
  for (const n of [6, 7]) {
    log('');
    log('   ── RUTA Nº' + n + ' · ANTES ' + '─'.repeat(80));
    log(bSin.get(n).replace(/\n+$/, ''));
    log('   ── RUTA Nº' + n + ' · DESPUÉS ' + '─'.repeat(78));
    log(bCon.get(n).replace(/\n+$/, ''));
  }
}

log('');
log(A.cierre('LAS SIETE RUTAS'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
