// B1 · LEER LAS BANDAS DE `data/pruebas/RUTAS-CONOCIDAS.md`.
//
// ⛔ Antes estaban COPIADAS dentro de `src/rutas-antonio.js`. Antonio publicó la
//    v2 de la tabla (velocidad recalibrada a ~6 km/h, rodeo como columna
//    principal) y el código siguió imprimiendo las de la v1: decía *"350–450 m"*
//    donde el documento decía 450–550, y con eso declaró **0 de 5 en banda**
//    cuando la cuenta buena eran 3 de 5. **Dos copias del mismo dato divergen, y
//    ya divergieron.**
//
// ⭐ Así que la tabla se LEE. El fichero es de Antonio y no se toca ni para
//    anotar un resultado.
//
// ⚠️ Leer Markdown escrito a mano es frágil, y aquí eso importa más de lo normal:
//    si el parser se equivoca en silencio, el veredicto de las siete rutas se
//    calcula contra una banda inventada — que es EXACTAMENTE el fallo que esto
//    viene a arreglar. Por eso:
//      · lo que entiende se IMPRIME, para poder contrastarlo con el documento
//      · lo que NO entiende se marca `NO CONSTA`, nunca se rellena
//      · y si el número de filas no es el que declara el propio fichero, PARA.

'use strict';
const fs = require('fs');
const path = require('path');

const TABLA = path.join(__dirname, '..', 'data', 'pruebas', 'RUTAS-CONOCIDAS.md');

/** Quita la decoración de Markdown y deja el texto desnudo. */
function limpio(s) {
  return String(s)
    .replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '')
    .replace(/[⭐⚠️⛔✅❌]/gu, '')
    .replace(/\s+/g, ' ').trim();
}

const numero = (s) => Number(String(s).replace(',', '.'));

/**
 * Un rango tipo `~450–550 m` o `2,4–2,6 km`, devuelto SIEMPRE en metros.
 * ⚠️ La tabla usa raya larga (–), coma decimal y dos unidades. Cualquier cosa que
 *    no case con eso vuelve como null: `NO CONSTA` es una respuesta.
 */
function rango(celda) {
  const t = limpio(celda);
  if (!t || /NO CONSTA|medir/i.test(t)) return null;
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*[–—-]\s*(\d+(?:[.,]\d+)?)\s*(km|m)\b/i);
  if (!m) return null;
  const f = /km/i.test(m[3]) ? 1000 : 1;
  return [numero(m[1]) * f, numero(m[2]) * f];
}

/** Un valor suelto con unidad: `454 m`, `2.380 m`, `2,6 km`. */
function medida(celda) {
  const t = limpio(celda);
  if (!t || /NO CONSTA|medir/i.test(t)) return null;
  const m = t.match(/(\d+(?:\.\d{3})*(?:,\d+)?|\d+(?:[.,]\d+)?)\s*(km|m)\b/i);
  if (!m) return null;
  const crudo = m[1].includes('.') && m[1].includes(',') ? m[1].replace(/\./g, '')
    : (/^\d+\.\d{3}$/.test(m[1]) ? m[1].replace('.', '') : m[1]);
  return numero(crudo) * (/km/i.test(m[2]) ? 1000 : 1);
}

/** El tope de rodeo: `≤ 1,45`. */
function tope(celda) {
  const t = limpio(celda);
  const m = t.match(/[≤<=]+\s*(\d+(?:[.,]\d+)?)/);
  return m ? numero(m[1]) : null;
}

/** Los minutos declarados: `~5 min`, `~25 min`. */
function minutos(celda) {
  const t = limpio(celda);
  if (!t || /NO CONSTA/i.test(t)) return null;
  const m = t.match(/(\d+)\s*min/i);
  return m ? Number(m[1]) : null;
}

/**
 * Lee la tabla. Devuelve {rutas, filasDeclaradas, version, avisos}.
 * ⛔ No corrige nada del fichero ni lo escribe. Solo lee.
 */
function leer(ruta = TABLA) {
  const txt = fs.readFileSync(ruta, 'utf8');
  const lineas = txt.split(/\r?\n/);
  const avisos = [];

  // la cabecera de la tabla buena: la que tiene origen y destino
  let i = lineas.findIndex((l) => /^\|\s*#\s*\|/.test(l) && /origen/i.test(l) && /destino/i.test(l));
  if (i === -1) {
    throw new Error('⛔ NO SE ENCUENTRA LA TABLA en ' + ruta + '. No se inventa una banda: se para.');
  }
  const cabecera = lineas[i].split('|').map(limpio).filter((x, k, a) => k > 0 && k < a.length - 1);
  const col = (re) => cabecera.findIndex((c) => re.test(c));
  const cO = col(/origen/i), cD = col(/destino/i), cR = col(/recta/i),
    cB = col(/banda/i), cRod = col(/rodeo/i), cT = col(/tiempo/i), cCaso = col(/caso|prueba/i);
  for (const [n, k] of [['origen', cO], ['destino', cD], ['banda', cB], ['rodeo', cRod]]) {
    if (k === -1) throw new Error(`⛔ falta la columna "${n}" en la tabla. Se para: sin ella no hay veredicto.`);
  }

  const rutas = [];
  for (let j = i + 2; j < lineas.length; j++) {          // +2: se salta la fila de guiones
    const l = lineas[j];
    if (!/^\s*\|/.test(l)) break;
    const c = l.split('|').map((x) => x).filter((x, k, a) => k > 0 && k < a.length - 1);
    const n = Number(limpio(c[0]));
    if (!Number.isFinite(n)) continue;
    const r = {
      n,
      o: limpio(c[cO]),
      d: limpio(c[cD]),
      rectaDeclarada: cR === -1 ? null : medida(c[cR]),
      banda: rango(c[cB]),
      rodeoMax: tope(c[cRod]),
      min: cT === -1 ? null : minutos(c[cT]),
      caso: cCaso === -1 ? '' : limpio(c[cCaso]),
      bandaCruda: limpio(c[cB]),
      rodeoCrudo: limpio(c[cRod]),
    };
    if (!r.o || !r.d) { avisos.push(`fila ${n}: origen o destino vacíos`); continue; }
    // ⚠️ el rodeo es la columna que MANDA en la v2. Si no se ha entendido, no hay
    //    veredicto posible para esa fila, y se dice.
    if (r.rodeoMax === null) avisos.push(`fila ${n}: no se entiende el tope de rodeo ("${r.rodeoCrudo}")`);
    if (r.banda === null && !/NO CONSTA/i.test(r.bandaCruda)) {
      avisos.push(`fila ${n}: no se entiende la banda de distancia ("${r.bandaCruda}")`);
    }
    rutas.push(r);
  }

  // ⭐ CUADRE CONTRA EL PROPIO FICHERO: la sección "Estado" declara cuántas filas
  //    reales hay. Si lo leído no coincide, el parser se ha comido algo — y un
  //    parser que se come filas en silencio es peor que no tener parser.
  const mEstado = txt.match(/Filas reales:\s*\*{0,2}(\d+)/i);
  const filasDeclaradas = mEstado ? Number(mEstado[1]) : null;
  const mVer = txt.match(/\*\*(v\d)\s*\(([^)]+)\)/);
  const version = mVer ? `${mVer[1]} (${mVer[2]})` : 'NO CONSTA';

  return { rutas, filasDeclaradas, version, avisos, ruta };
}

/** Comprueba el cuadre y devuelve el texto del informe de lectura. */
function informe(t) {
  const L = [];
  const di = (k, v) => L.push(`   ${String(k).padEnd(40)} ${v}`);
  L.push('B1 · ⭐ LAS BANDAS SE LEEN DE LA TABLA DE ANTONIO, no están copiadas en el código');
  di('fichero', path.relative(path.join(__dirname, '..'), t.ruta).replace(/\\/g, '/'));
  di('versión declarada', t.version);
  di('filas leídas · filas que declara el fichero', `${t.rutas.length} · ${t.filasDeclaradas === null ? 'NO CONSTA' : t.filasDeclaradas}`);
  const cuadra = t.filasDeclaradas === null || t.rutas.length === t.filasDeclaradas;
  // ⚠️⚠️ TANDA 6 · EL MENSAJE DIAGNOSTICABA AL REVÉS, y esto es un arreglo
  //   DECLARADO FUERA DEL ALCANCE de su tanda.
  //   Decía «el parser se ha comido filas» y daba por hecho que el equivocado era
  //   el instrumento. El 9 de agosto entró la ruta nº8 en la tabla, el recuento de
  //   la cabecera se quedó en 7, y el guardián paró el motor entero **acusando al
  //   parser de haberse comido una fila que había leído perfectamente**.
  //   ⇒ Un aviso que nombra una sola causa manda a mirar donde no es. Las dos
  //     causas son igual de probables y las dos se nombran.
  //   ⛔ La lógica NO cambia: sigue parando exactamente igual. Solo deja de
  //     señalar a un culpable que puede ser el inocente.
  di('⇒ ¿cuadra?', cuadra ? '✅ sí'
    : '⛔ NO — el documento y el parser no cuentan lo mismo. PARAR.');
  if (!cuadra) {
    L.push('      ⚠️ Y puede ser por DOS motivos opuestos. Hay que mirar los dos:');
    L.push('         · el parser se está comiendo filas de la tabla, o');
    L.push('         · la tabla ha ganado (o perdido) filas y el recuento de la');
    L.push('           cabecera —«Filas reales: N»— se quedó sin actualizar.');
    L.push('      ⭐ Abajo va lo que se ha leído: contarlo contra el documento');
    L.push('         distingue los dos casos en diez segundos.');
  }
  L.push('');
  L.push('   ⭐ ESTO ES LO QUE HE ENTENDIDO. Se imprime para poder contrastarlo con el documento:');
  L.push('   ' + 'nº'.padEnd(4) + 'origen → destino'.padEnd(52) + 'banda (m)'.padEnd(16)
    + 'rodeo máx'.padEnd(11) + 'recta decl.'.padEnd(12) + 'min');
  for (const r of t.rutas) {
    L.push('   ' + String(r.n).padEnd(4) + (r.o + ' → ' + r.d).slice(0, 51).padEnd(52)
      + (r.banda ? `${r.banda[0]}–${r.banda[1]}` : 'NO CONSTA').padEnd(16)
      + (r.rodeoMax === null ? 'NO CONSTA' : '≤ ' + r.rodeoMax.toFixed(2)).padEnd(11)
      + (r.rectaDeclarada === null ? '—' : r.rectaDeclarada + ' m').padEnd(12)
      + (r.min === null ? '—' : r.min));
  }
  if (t.avisos.length) {
    L.push('');
    for (const a of t.avisos) L.push('   ⚠️ ' + a);
  }
  return { texto: L.join('\n'), cuadra };
}

module.exports = { leer, informe, TABLA, limpio, rango, medida, tope, minutos };

if (require.main === module) {
  const t = leer();
  const r = informe(t);
  console.log('='.repeat(104));
  console.log(r.texto);
  if (!r.cuadra) process.exit(1);
}
