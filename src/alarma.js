// ⛔⛔ LA ALARMA — que un fallo detectado NO pueda terminar en verde.
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE, con su caso
// ═════════════════════════════════════════════════════════════════════════════
//   La ruta de cordura `Puerta del Carmen → Magdalena` estuvo **DOS TANDAS rota**,
//   publicada en `H1-PRIMER-GRAFO.md` §C4d como correcta. El verificador la
//   detectaba. **Imprimía `⛔ componentes-distintas` en pantalla** y el bucle hacía
//   `continue`. El proceso terminaba en 0.
//
//   ⇒ **Un `⛔` impreso no es un fallo: es texto.** Si el proceso acaba en 0, el
//     fallo no existe para nada ni nadie que no lea la salida entera a mano.
//   ⇒ Y `continue` es la forma más barata de convertir un fallo en una línea de
//     informe.
//
// ═════════════════════════════════════════════════════════════════════════════
// DOS CLASES DE FALLO, Y NO SE TRATAN IGUAL
// ═════════════════════════════════════════════════════════════════════════════
//   · `imposible()` — IMPOSIBILIDAD FÍSICA: un rodeo por debajo de 1, una
//     distancia negativa, una suma que no cuadra. **Lanza en el acto.** No tiene
//     sentido seguir midiendo con un instrumento que acaba de decir un absurdo.
//
//   · `fallo()` — FALLO DE EXPECTATIVA: una ruta de cordura que no se resuelve,
//     un contador fuera de banda. **Se anota y se sigue**, porque el resto del
//     informe sigue siendo útil y porque hay que ver TODOS los fallos, no solo el
//     primero — pero **el proceso ya no puede terminar en 0**.
//
// ⭐ Y eso último es el mecanismo, no la disciplina (ley 37): el gancho de salida
//    se instala solo al primer `fallo()`, y a partir de ahí **ningún camino del
//    código puede devolver 0**. No hay que acordarse de nada al final.
//
// ⚠️ LO QUE ESTO NO PUEDE GARANTIZAR, dicho antes de que nadie lo suponga: un
//    script que detecte algo y lo imprima con `console.log` sin avisar a la
//    alarma sigue pudiendo salir en verde. Eso no lo caza ningún mecanismo
//    automático — lo caza `src/probar-paradas.js`, que ejecuta todo y compara la
//    salida con el código, y aun así solo caza lo que lleve la marca.

'use strict';

const MARCA_FALLO = '⛔ FALLO ·';
const MARCA_IMPOSIBLE = '⛔⛔ IMPOSIBLE ·';

const fallos = [];
let instalado = false;

function instalar() {
  if (instalado) return;
  instalado = true;
  process.on('exit', (codigo) => {
    if (!fallos.length) return;
    process.stderr.write('\n' + '='.repeat(80) + '\n');
    process.stderr.write(`⛔ ${fallos.length} FALLO(S) DETECTADO(S) — el proceso NO puede terminar en verde.\n`);
    for (const f of fallos) process.stderr.write('   · ' + f.texto + '\n');
    process.stderr.write('='.repeat(80) + '\n');
    // ⭐ esto es lo que hace que sea un mecanismo: aunque el script termine
    //    normalmente, el código de salida deja de ser 0.
    if (codigo === 0) process.exitCode = 1;
  });
}

/** Fallo de expectativa: se anota, se sigue midiendo, pero el proceso sale en rojo. */
function fallo(texto, datos = null) {
  instalar();
  fallos.push({ texto, datos });
  console.log(`   ${MARCA_FALLO} ${texto}`);
  return false;
}

/** Imposibilidad física: lanza en el acto. Seguir no tiene sentido. */
function imposible(texto, datos = null) {
  instalar();
  const e = new Error(`${MARCA_IMPOSIBLE} ${texto}`);
  e.imposible = true;
  e.datos = datos;
  throw e;
}

/**
 * `exige(condición, texto)` — la forma corta. Devuelve la condición para poder
 * seguir usándola en un `if`, pero **el fallo ya está anotado**.
 * ⚠️ Devolver el booleano es a propósito: la tentación es escribir
 *    `if (!ok) { log('⛔ …'); continue; }`, y así el `continue` sigue existiendo
 *    pero el proceso ya no puede salir en 0.
 */
function exige(condicion, texto, datos = null) {
  if (condicion) return true;
  fallo(texto, datos);
  return false;
}

/** ¿Cuántos fallos van? Para que un informe pueda cerrarse diciéndolo. */
const cuenta = () => fallos.length;
const lista = () => fallos.slice();

/** Línea de cierre para los informes: dice el veredicto Y deja el código en rojo. */
function cierre(etiqueta = 'VERIFICACIÓN') {
  if (!fallos.length) return `   ⇒ ✅ ${etiqueta}: sin fallos. (código de salida 0)`;
  return `   ⇒ ⛔ ${etiqueta}: ${fallos.length} FALLO(S). El proceso saldrá en rojo.`;
}

module.exports = { fallo, imposible, exige, cuenta, lista, cierre,
  MARCA_FALLO, MARCA_IMPOSIBLE };
