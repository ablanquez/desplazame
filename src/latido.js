// ⭐⭐⭐ TANDA 3 · EL LATIDO — que un número publicado sepa si su productor sigue
//     vivo. ⛔ Y que dejar de medir sea ROJO, aunque el proceso salga en 0 y la
//     salida sea perfectamente legítima.
//
//   node src/latido.js            # A · ejecuta los productores y compara
//   node src/latido.js --probar   # B · la contraprueba, con el caso del 6 de agosto
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE — y esta vez el caso es de este mes y está atado
// ═════════════════════════════════════════════════════════════════════════════
//   `docs/H1-DONDE-FALTA-EL-NOMBRE.md` §A6 publica que la ruta 6 tiene **412 m**
//   sin nombre. Hoy son **438**. El número no lo movió nadie: se quedó viejo.
//
//   El 6 de agosto (`c6f7f41`) el proyecto decidió que la ruta nº1 no debe
//   resolverse. §A6 exigía siete rutas, dejó de poder medir, y desde entonces
//   imprimió `⛔ sin las rutas, A6 no se puede medir. NO CONSTA.` durante dos
//   días. ⇒ **el 412 perdió a su único contradictor y nadie se enteró.**
//
//   ⛔⛔ Y NINGÚN CONTADOR LO HABRÍA VISTO. Aquel día `donde-falta.js` declaraba
//     su fallo y salía en 1, exactamente como se esperaba de él. La batería decía
//     `1 de 1 ✅`. Imprimir `NO CONSTA` **es una salida legítima**: no es una
//     excepción, no es un código raro, no es un silencio. Es un instrumento
//     educado diciendo que no sabe.
//
//   ⭐ Ley 111: lo que hay que vigilar no es el número publicado, es que su
//     instrumento siga vivo. Ley 112: eso no lo contesta un contador — lo
//     contesta comparar la salida de un instrumento con otra cosa.
//
//   ⚠️ Y está medido en esta misma tanda, provocándolo: con §D4 mudo y
//     `modelo-rutas.js` en la tabla de rojos declarados, la batería dio
//     `1 de 1 ✅` con el productor del 438 muerto. La puerta sigue abierta y es
//     ésta.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LA MARCA QUE NO SALE ES ROJA POR SÍ SOLA — decisión de Antonio
// ═════════════════════════════════════════════════════════════════════════════
//   No basta con que el valor impreso difiera del publicado. **Si la sección no
//   aparece, es rojo.** Si borrar la marca dejara esto en verde, lo construido
//   sería un contador con más pasos, que es justo lo que la ley 112 prohíbe.
//   ⇒ hay tres veredictos, no dos: MUDO · DERIVA · VIVO.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ Y LAS EXPRESIONES ADMITEN UN SOLO DÍGITO — decisión de Antonio
// ═════════════════════════════════════════════════════════════════════════════
//   El censo v2 de la auditoría no puede ver un cero: su expresión de cifras
//   exige dos dígitos o más, y en sus 2.360 marcas no hay un solo token de un
//   dígito. En un proyecto cuya regla 2 dice que **todo cero se demuestra con un
//   positivo de control**, una marca ciega al cero es una marca inútil justo
//   donde más falta hace.
//   ⇒ `(\d+)` y no `(\d{2,})`. Y no se promete: la fila de la ruta 2 vale CERO y
//     está en la tabla de abajo como positivo de control de esa propiedad.
//
// ⚠️ LO QUE ESTO NO CUBRE, dicho antes de que nadie lo suponga: **cuatro
//   números**, los que esta tanda ha medido y atado. No es el censo de lo
//   publicado y no pretende serlo. Ampliarlo es decidir qué se ejecuta en cada
//   pasada, y eso cuesta minutos de reloj — es una decisión, no un trámite.

'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const A = require('./alarma');

const RAIZ = path.join(__dirname, '..');
const log = console.log;

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LA TABLA — un número publicado, su documento, y QUIÉN LO PRODUCE
// ═════════════════════════════════════════════════════════════════════════════
//   seccion · el trozo de la salida del productor donde vive el número. ⛔ Si
//             esto no casa, el veredicto es MUDO y es ROJO. No se busca el
//             número por todo el fichero: un número suelto en otra sección no
//             prueba que la sección siga midiendo.
//   marca   · dentro de esa sección, de dónde se saca el valor. `(\d+)`, que
//             admite un dígito y por tanto admite el cero.
const NUMEROS = [
  { id: 'A6 · ruta 6', publicado: '412', doc: 'docs/H1-DONDE-FALTA-EL-NOMBRE.md §A6',
    productor: 'donde-falta.js', que: 'los metros sin nombre de la ruta 6',
    seccion: /A6 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*6\s+(\d+)\s/m },

  { id: 'D4 · ruta 6', publicado: '412', doc: 'docs/H1-MODELO-VIA-FORMA-PAPEL.md §D4',
    productor: 'modelo-rutas.js', que: 'los metros sin nombre de la ruta 6, por WAY',
    seccion: /D4 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*6\s+(\d+)\s/m },

  // ⭐ POSITIVO DE CONTROL · el MISMO productor y la MISMA sección, otra fila.
  //   Si esto no saliera VIVO, el rojo de arriba no probaría nada: sería el
  //   lector el que está roto, no el número.
  { id: 'A6 · ruta 3', publicado: '695', doc: 'docs/H1-DONDE-FALTA-EL-NOMBRE.md §A6',
    productor: 'donde-falta.js', que: 'los metros sin nombre de la ruta 3',
    seccion: /A6 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*3\s+(\d+)\s/m },

  // ⭐⭐ EL CERO · la ruta 2 no tiene un solo metro sin nombre, y está publicado.
  //   Es el positivo de control de que esta marca VE UN CERO — la propiedad que
  //   al censo v2 le falta.
  { id: 'A6 · ruta 2', publicado: '0', doc: 'docs/H1-DONDE-FALTA-EL-NOMBRE.md §A6',
    productor: 'donde-falta.js', que: 'los metros sin nombre de la ruta 2 — un CERO publicado',
    seccion: /A6 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*2\s+(\d+)\s/m },
];

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL VEREDICTO — función pura, para que la contraprueba pueda alimentarla
//       con salidas de verdad sin ejecutar nada (ley 56: no se copia la regla)
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @param {string} salida lo que imprimió el productor
 * @param {Object} n la fila de NUMEROS
 * @returns {{estado: 'MUDO'|'DERIVA'|'VIVO', hoy: ?string, v: string}}
 */
function juzgar(salida, n) {
  const bloque = (salida.match(n.seccion) || [])[0];
  // 1 · ⛔⛔ LA MARCA QUE NO SALE ES ROJA POR SÍ SOLA. Va la primera a propósito.
  if (!bloque) return { estado: 'MUDO', hoy: null, v: '⛔ EL PRODUCTOR NO EMITE ESTA SECCIÓN' };
  const m = bloque.match(n.marca);
  if (!m) return { estado: 'MUDO', hoy: null, v: '⛔ LA SECCIÓN SALE PERO SIN EL DATO' };
  // 2 · el valor. ⚠️ se compara como TEXTO normalizado: '0' es un valor, no un vacío.
  const hoy = m[1];
  if (hoy !== n.publicado.replace(/\./g, '')) {
    return { estado: 'DERIVA', hoy, v: '⛔ PUBLICADO ' + n.publicado + ' · HOY ' + hoy };
  }
  return { estado: 'VIVO', hoy, v: '✅' };
}

/** Ejecuta un productor una sola vez por pasada. ⚠️ Sale en rojo a propósito
 *  en varios casos: se le coge la salida igual. */
const cache = new Map();
function correr(productor) {
  if (cache.has(productor)) return cache.get(productor);
  let salida = '';
  try {
    salida = execFileSync(process.execPath, [path.join(__dirname, productor)],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    salida = ((e.stdout || '') + (e.stderr || '')).toString();
  }
  cache.set(productor, salida);
  return salida;
}

// ═════════════════════════════════════════════════════════════════════════════
// B · LA CONTRAPRUEBA — ⛔ y el caso NO es inventado: es el 6 de agosto
// ═════════════════════════════════════════════════════════════════════════════
//   `MUDO_6AGO` es literalmente lo que §A6 imprime cuando no puede medir. Se
//   capturó hoy provocándolo —una línea con interruptor de entorno, revertida— y
//   es el mismo camino de código que corrió del 6 al 8 de agosto.
const MUDO_6AGO = [
  '==============================================================================================================',
  'A6 · ⚠️ ¿Y EN LAS SIETE RUTAS DE ANTONIO? — la muestra con verdad sobre el terreno',
  '==============================================================================================================',
  '   ⛔ Las rutas NO se recalculan aquí: se piden a `rutas-antonio.js --aristas`, que es',
  '      el único que las produce (el fallo nº68 fueron dos copias del mismo cálculo).',
  '   ⛔ FALLO · no se ha podido leer NINGUNA ruta de `rutas-antonio.js --aristas`',
  '   ⛔ sin las rutas, A6 no se puede medir. NO CONSTA.',
  '',
].join('\n');

/** La sección viva de hoy, para el positivo de control de la contraprueba. */
const VIVO_HOY = [
  'A6 · ⚠️ ¿Y EN LAS SIETE RUTAS DE ANTONIO?',
  '    ruta    m sin nombre    de ellos CON portales        %   portales',
  '       2               0                       0        —          0',
  '       3             695                       0     0,0 %         0',
  '       6             438                     207    47,4 %        11',
  '   ─────────────────────────────────────────────────────────────────',
  '   TOTAL            3039                    1137    37,4 %        36',
].join('\n');

function probar() {
  log('');
  log('='.repeat(104));
  log('B · ⭐⭐⭐ LA CONTRAPRUEBA — ¿HABRÍA CAZADO EL 412 EL 6 DE AGOSTO?');
  log('='.repeat(104));
  const a6 = NUMEROS.find((n) => n.id === 'A6 · ruta 6');
  const r3 = NUMEROS.find((n) => n.id === 'A6 · ruta 3');
  const r2 = NUMEROS.find((n) => n.id === 'A6 · ruta 2');

  // ── B1 · el caso real: §A6 mudo, con el proceso saliendo como se esperaba ──
  const j6 = juzgar(MUDO_6AGO, a6);
  log('   B1 · §A6 imprimiendo `NO CONSTA`, como del 6 al 8 de agosto');
  log('        el latido dice                                 ' + j6.estado + '   ' + j6.v);
  A.exige(j6.estado === 'MUDO',
    'el latido NO caza el caso del 6 de agosto: el mecanismo no sirve');
  log('        ⭐ y aquel día `donde-falta.js` declaraba 1 fallo y salía en 1,');
  log('           que es EXACTAMENTE lo que se esperaba de él. Ningún contador');
  log('           tenía nada que decir. Este sí.');

  // ── B2 · positivo de control: con la sección viva, NO grita ────────────────
  const jv = juzgar(VIVO_HOY, r3);
  log('');
  log('   B2 · positivo de control — la misma sección VIVA, fila de la ruta 3');
  log('        el latido dice                                 ' + jv.estado + '   ' + jv.v);
  A.exige(jv.estado === 'VIVO',
    'el latido grita también cuando el productor está vivo: no distingue nada');

  // ── B3 · ⭐⭐ EL CERO — la propiedad que al censo v2 le falta ───────────────
  const jc = juzgar(VIVO_HOY, r2);
  log('');
  log('   B3 · ⭐⭐ el CERO — la ruta 2 publica 0 m y el productor emite 0');
  log('        el latido dice                                 ' + jc.estado + '   ' + jc.v
    + '   (leyó «' + jc.hoy + '»)');
  A.exige(jc.estado === 'VIVO' && jc.hoy === '0',
    'la marca no sabe leer un cero: hereda el punto ciego del censo v2');

  // ── B4 · y el cero NO se confunde con «no sale» ────────────────────────────
  const jSin = juzgar(VIVO_HOY.replace(/^ +2 +0 +0 +— +0$/m, '       2      —      —   —   —'), r2);
  log('');
  log('   B4 · …y un CERO no es lo mismo que UNA SECCIÓN SIN EL DATO');
  log('        con la fila sin cifra, el latido dice          ' + jSin.estado + '   ' + jSin.v);
  A.exige(jSin.estado === 'MUDO',
    'el latido confunde un cero con un dato ausente: los dos leerían igual');

  // ── B5 · la deriva, que es la otra mitad ───────────────────────────────────
  const jd = juzgar(VIVO_HOY, a6);
  log('');
  log('   B5 · la DERIVA — la sección emite, pero otro número');
  log('        el latido dice                                 ' + jd.estado + '   ' + jd.v);
  A.exige(jd.estado === 'DERIVA', 'el latido no distingue una deriva de un latido sano');
}

// ═════════════════════════════════════════════════════════════════════════════
// A · LA PASADA
// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(104));
log('EL LATIDO · ¿SIGUE VIVO EL PRODUCTOR DE CADA NÚMERO PUBLICADO?');
log('='.repeat(104));
log('   números vigilados                            ' + NUMEROS.length);
log('   productores que hay que ejecutar             '
  + new Set(NUMEROS.map((n) => n.productor)).size + '   ⚠️ esto cuesta minutos de reloj, y por eso');
log('                                                    la tabla es corta y se declara corta.');
log('');
log('   ' + 'número'.padEnd(14) + 'publicado'.padStart(11) + 'hoy'.padStart(8)
  + '  ' + 'productor'.padEnd(18) + 'veredicto');

const mudos = [], derivas = [];
for (const n of NUMEROS) {
  const j = juzgar(correr(n.productor), n);
  if (j.estado === 'MUDO') mudos.push({ n, j });
  if (j.estado === 'DERIVA') derivas.push({ n, j });
  log('   ' + n.id.padEnd(14) + n.publicado.padStart(11) + String(j.hoy == null ? '—' : j.hoy).padStart(8)
    + '  ' + n.productor.padEnd(18) + j.v);
}

log('');
log('   ⛔ productores MUDOS (la sección ya no sale)  ' + mudos.length);
for (const { n } of mudos) {
  log('      ' + n.id.padEnd(14) + n.doc);
  log('      ' + ' '.repeat(14) + '⇒ ' + n.que + ' — NO TIENE QUIEN LO SOSTENGA');
}
A.exige(mudos.length === 0, mudos.length + ' número(s) publicado(s) cuyo productor ha dejado de emitir su sección');

log('');
log('   ⛔ números con DERIVA (emite, y dice otra cosa) ' + derivas.length);
for (const { n, j } of derivas) {
  log('      ' + n.id.padEnd(14) + n.doc);
  log('      ' + ' '.repeat(14) + '⇒ publicado ' + n.publicado + ' · hoy ' + j.hoy
    + '   (' + n.que + ')');
}
A.exige(derivas.length === 0, derivas.length + ' número(s) publicado(s) que su propio productor ya no confirma');

// ⚠️ y el documento tiene que existir: un puntero a un fichero que no está es
//   la misma mentira con otra ropa.
const rotos = NUMEROS.filter((n) => !fs.existsSync(path.join(RAIZ, n.doc.split(' ')[0])));
log('');
log('   documentos citados que NO existen              ' + rotos.length);
A.exige(rotos.length === 0, rotos.length + ' número(s) apuntan a un documento que no existe');

if (process.argv.includes('--probar')) probar();

log('');
log(A.cierre('EL LATIDO'));
