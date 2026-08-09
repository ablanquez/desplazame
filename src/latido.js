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
// ⭐⭐⭐ TANDA 6 · EL LATIDO LEE, YA NO RECITA
// ═════════════════════════════════════════════════════════════════════════════
//   Hasta hoy cada fila llevaba `publicado: '412'` — **un literal copiado a
//   mano**. Eso rompía la ley 105 justo aquí: el puntero (`superados.js`) MIDE
//   dónde aparece cada valor, y el latido RECITABA el que alguien tecleó.
//
//   ⛔ Y se vio en la primera republicación de verdad, la tanda 5: se publicó el
//     438 en un documento nuevo, se pusieron los punteros, se regeneraron las
//     cabeceras… **y el latido siguió en rojo**, porque nada de eso podía
//     alcanzarle. Ponerlo verde exigía editar su tabla a mano, que es
//     exactamente lo que la prueba de aceptación prohibía.
//
//   ⇒ Ahora el valor publicado **se lee del documento que lo publica**:
//       docParte · el trozo del DOCUMENTO donde vive la cifra
//       ancla    · dentro de ese trozo, de dónde se saca — `(\d+)`, que admite
//                  un dígito y por tanto admite el cero
//     Republicar = escribir el valor nuevo y apuntar `doc` ahí. **El verde llega
//     solo.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ SI ALGUIEN REFORMATEA UN DOCUMENTO REPUBLICADO, EL ANCLA DEJA DE CASAR
//      — Y ESO SALE COMO **MUDO**, QUE NO ES UN FALLO DEL LATIDO
// ═════════════════════════════════════════════════════════════════════════════
//   Va escrito aquí a propósito, para quien se lo encuentre dentro de tres
//   tandas y crea que el instrumento está roto. **No lo está: está avisando.**
//   Un ancla rota dice *«ya no sé de dónde sale este número»*, y eso es
//   exactamente lo que se quería poder decir. ⭐ Un ancla rota que avisa vale
//   más que un valor correcto que nadie sabe de dónde sale.
//   ⇒ El arreglo es **volver a anclar**, no quitar el ancla ni copiar la cifra.
//
//   ⛔ Y hay DOS silencios distintos, y los dos son MUDO y los dos son rojos:
//     · el PRODUCTOR dejó de emitir su sección  → el número no tiene quien lo
//       sostenga (el caso del 6 de agosto)
//     · el DOCUMENTO ya no deja encontrar la cifra → el número no tiene dónde
//       estar publicado
//   El veredicto dice cuál de los dos, porque el arreglo es distinto.
//
//   seccion · el trozo de la SALIDA DEL PRODUCTOR donde vive el número.
//   marca   · dentro de esa sección, de dónde se saca el valor.
const NUMEROS = [
  { id: 'A6 · ruta 6', doc: 'docs/H1-REPUBLICACIONES.md §A1',
    docParte: /### A1 ·[\s\S]*?(?=\n### |\n## )/, ancla: /→ \*\*`(\d+) m`\*\*/,
    productor: 'donde-falta.js', que: 'los metros sin nombre de la ruta 6',
    seccion: /A6 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*6\s+(\d+)\s/m },

  // ⭐⭐ MISMA cifra publicada, OTRO productor. No es una duplicación: es que un
  //   número publicado una vez lo confirman dos instrumentos independientes.
  { id: 'D4 · ruta 6', doc: 'docs/H1-REPUBLICACIONES.md §A1',
    docParte: /### A1 ·[\s\S]*?(?=\n### |\n## )/, ancla: /→ \*\*`(\d+) m`\*\*/,
    productor: 'modelo-rutas.js', que: 'los metros sin nombre de la ruta 6, por WAY',
    seccion: /D4 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*6\s+(\d+)\s/m },

  // ⭐ POSITIVO DE CONTROL · el MISMO productor y la MISMA sección, otra fila.
  //   Si esto no saliera VIVO, el rojo de arriba no probaría nada: sería el
  //   lector el que está roto, no el número.
  { id: 'A6 · ruta 3', doc: 'docs/H1-DONDE-FALTA-EL-NOMBRE.md §A6',
    docParte: /\| ruta \| m sin nombre[\s\S]*?\n\n/, ancla: /^\| 3 \| (\d+) \|/m,
    productor: 'donde-falta.js', que: 'los metros sin nombre de la ruta 3',
    seccion: /A6 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*3\s+(\d+)\s/m },

  // ⭐⭐ EL CERO · la ruta 2 no tiene un solo metro sin nombre, y está publicado.
  //   Es el positivo de control de que la marca Y EL ANCLA ven un cero — la
  //   propiedad que al censo v2 le falta, ahora comprobada en los dos lados.
  { id: 'A6 · ruta 2', doc: 'docs/H1-DONDE-FALTA-EL-NOMBRE.md §A6',
    docParte: /\| ruta \| m sin nombre[\s\S]*?\n\n/, ancla: /^\| 2 \| (\d+) \|/m,
    productor: 'donde-falta.js', que: 'los metros sin nombre de la ruta 2 — un CERO publicado',
    seccion: /A6 · [\s\S]*?TOTAL[^\n]*/, marca: /^\s*2\s+(\d+)\s/m },
];

/** Lo que dice HOY el documento que publica ese número. ⛔ Ya no se recita. */
function publicadoDe(n) {
  const f = path.join(RAIZ, n.doc.split(' ')[0]);
  if (!fs.existsSync(f)) return { v: null, por: 'el documento no existe' };
  const txt = fs.readFileSync(f, 'utf8');
  const parte = (txt.match(n.docParte) || [])[0];
  if (!parte) return { v: null, por: 'la sección del documento ya no casa' };
  const m = parte.match(n.ancla);
  if (!m) return { v: null, por: 'el ancla ya no encuentra la cifra' };
  return { v: m[1], por: null };
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL VEREDICTO — función pura, para que la contraprueba pueda alimentarla
//       con salidas de verdad sin ejecutar nada (ley 56: no se copia la regla)
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @param {string} salida lo que imprimió el productor
 * @param {Object} n la fila de NUMEROS
 * @returns {{estado: 'MUDO'|'DERIVA'|'VIVO', hoy: ?string, v: string}}
 */
function juzgar(salida, n, pub) {
  // 0 · ⚠️ EL LADO DEL DOCUMENTO. Si el ancla ya no casa, el número no tiene
  //   dónde estar publicado. Es MUDO y es rojo, y NO es un fallo del latido:
  //   es el aviso de que alguien reformateó el documento. Se vuelve a anclar.
  if (pub && pub.v == null) {
    return { estado: 'MUDO', hoy: null, pub: null,
      v: '⛔ EL DOCUMENTO NO DEJA LEER LA CIFRA — ' + pub.por };
  }
  const bloque = (salida.match(n.seccion) || [])[0];
  // 1 · ⛔⛔ LA MARCA QUE NO SALE ES ROJA POR SÍ SOLA. Va la primera a propósito.
  if (!bloque) return { estado: 'MUDO', hoy: null, v: '⛔ EL PRODUCTOR NO EMITE ESTA SECCIÓN' };
  const m = bloque.match(n.marca);
  if (!m) return { estado: 'MUDO', hoy: null, v: '⛔ LA SECCIÓN SALE PERO SIN EL DATO' };
  // 2 · el valor. ⚠️ se compara como TEXTO normalizado: '0' es un valor, no un vacío.
  //   ⭐ Y lo publicado NO se recita: viene de `publicadoDe()`, que lo ha leído
  //     del documento en esta misma pasada.
  const hoy = m[1];
  const publicado = pub.v.replace(/\./g, '');
  if (hoy !== publicado) {
    return { estado: 'DERIVA', hoy, pub: publicado,
      v: '⛔ EL DOCUMENTO DICE ' + publicado + ' · EL PRODUCTOR ' + hoy };
  }
  return { estado: 'VIVO', hoy, pub: publicado, v: '✅' };
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
  const j6 = juzgar(MUDO_6AGO, a6, publicadoDe(a6));
  log('   B1 · §A6 imprimiendo `NO CONSTA`, como del 6 al 8 de agosto');
  log('        el latido dice                                 ' + j6.estado + '   ' + j6.v);
  A.exige(j6.estado === 'MUDO',
    'el latido NO caza el caso del 6 de agosto: el mecanismo no sirve');
  log('        ⭐ y aquel día `donde-falta.js` declaraba 1 fallo y salía en 1,');
  log('           que es EXACTAMENTE lo que se esperaba de él. Ningún contador');
  log('           tenía nada que decir. Este sí.');

  // ── B2 · positivo de control: con la sección viva, NO grita ────────────────
  const jv = juzgar(VIVO_HOY, r3, publicadoDe(r3));
  log('');
  log('   B2 · positivo de control — la misma sección VIVA, fila de la ruta 3');
  log('        el latido dice                                 ' + jv.estado + '   ' + jv.v);
  A.exige(jv.estado === 'VIVO',
    'el latido grita también cuando el productor está vivo: no distingue nada');

  // ── B3 · ⭐⭐ EL CERO — la propiedad que al censo v2 le falta ───────────────
  const jc = juzgar(VIVO_HOY, r2, publicadoDe(r2));
  log('');
  log('   B3 · ⭐⭐ el CERO — la ruta 2 publica 0 m y el productor emite 0');
  log('        el latido dice                                 ' + jc.estado + '   ' + jc.v
    + '   (leyó «' + jc.hoy + '»)');
  A.exige(jc.estado === 'VIVO' && jc.hoy === '0',
    'la marca no sabe leer un cero: hereda el punto ciego del censo v2');

  // ── B4 · y el cero NO se confunde con «no sale» ────────────────────────────
  const jSin = juzgar(VIVO_HOY.replace(/^ +2 +0 +0 +— +0$/m, '       2      —      —   —   —'), r2, publicadoDe(r2));
  log('');
  log('   B4 · …y un CERO no es lo mismo que UNA SECCIÓN SIN EL DATO');
  log('        con la fila sin cifra, el latido dice          ' + jSin.estado + '   ' + jSin.v);
  A.exige(jSin.estado === 'MUDO',
    'el latido confunde un cero con un dato ausente: los dos leerían igual');

  // ── B5 · la deriva, que es la otra mitad ───────────────────────────────────
  //   ⚠️ TANDA 6 · ESTA PRUEBA HABÍA DEJADO DE PROBAR NADA, y se vio al cambiar
  //     el mecanismo: comparaba `VIVO_HOY` (438) contra el literal `412` que la
  //     tabla recitaba, así que la deriva la producía **el propio literal**. Con
  //     el valor leído del documento —que hoy dice 438— pasó a salir VIVO.
  //   ⇒ ahora la deriva se PROVOCA de verdad: se cambia el número que emite el
  //     productor, que es el único lado que puede derivar sin que nadie lo diga.
  const DERIVADO = VIVO_HOY.replace(/^ +6 +438/m, '       6             999');
  const jd = juzgar(DERIVADO, a6, publicadoDe(a6));
  log('');
  log('   B5 · la DERIVA — el documento dice una cosa y el productor emite otra');
  log('        el latido dice                                 ' + jd.estado + '   ' + jd.v);
  A.exige(jd.estado === 'DERIVA', 'el latido no distingue una deriva de un latido sano');

  // ── B6 · ⭐⭐ EL ANCLA ROTA — lo que pasa si alguien reformatea el documento ──
  //   ⛔ Y sale MUDO, no error. Es el aviso, no la avería. Ver la cabecera.
  log('');
  log('   B6 · ⭐⭐ el ANCLA ROTA — alguien reformatea el documento republicado');
  const jAncla = juzgar(VIVO_HOY, a6, { v: null, por: 'el ancla ya no encuentra la cifra' });
  log('        el latido dice                                 ' + jAncla.estado + '   ' + jAncla.v);
  A.exige(jAncla.estado === 'MUDO',
    'el latido no avisa cuando el documento deja de dejar leer la cifra publicada');
  log('        ⭐ y el arreglo es VOLVER A ANCLAR, no copiar la cifra a mano:');
  log('           un ancla rota que avisa vale más que un valor correcto del');
  log('           que nadie sabe de dónde sale.');

  // ── B7 · ⭐⭐⭐ LO QUE ESTA TANDA VIENE A PROBAR: republicar pone verde SOLO ──
  //   Se lee el documento de verdad, sin literales por medio. Si esto fallara,
  //   el mecanismo seguiría recitando.
  log('');
  log('   B7 · ⭐⭐⭐ ¿de dónde sale «lo publicado»?');
  const p6 = publicadoDe(a6);
  log('        `' + a6.doc + '` dice              ' + (p6.v == null ? '⛔ ' + p6.por : p6.v));
  A.exige(p6.v != null,
    'el valor publicado no se puede leer del documento: el latido volvería a recitar');
  log('        ⇒ ningún literal por medio: republicar lo alcanza.');
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
  // ⭐ lo publicado se LEE del documento en esta misma pasada. Si aquí hubiera
  //   un literal, republicar no podría alcanzarlo — y eso fue la tanda 5.
  const pub = publicadoDe(n);
  const j = juzgar(correr(n.productor), n, pub);
  if (j.estado === 'MUDO') mudos.push({ n, j });
  if (j.estado === 'DERIVA') derivas.push({ n, j });
  log('   ' + n.id.padEnd(14) + String(pub.v == null ? '—' : pub.v).padStart(11)
    + String(j.hoy == null ? '—' : j.hoy).padStart(8)
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
  log('      ' + ' '.repeat(14) + '⇒ el documento dice ' + j.pub + ' · el productor ' + j.hoy
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
