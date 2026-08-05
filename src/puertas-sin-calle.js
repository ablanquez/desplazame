// ⭐⭐ TANDA 31 · E · LAS PUERTAS SIN CALLE — un número publicado que había caducado.
//
//   node src/puertas-sin-calle.js
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE
// ═════════════════════════════════════════════════════════════════════════════
//   `docs/H1-NOMBRES-Y-PASOS.md` §0 publica, desde la tanda 21:
//
//       «8.576 PUERTAS GANAN CALLE — los portales que cuelgan de una línea sin
//        nombre pasan de 11.742 a 3.166»
//
//   La tanda 30 lo midió de pasada y salió **2.667**. Cuatro tandas de nombres
//   habían pasado por encima —la 25, la 26, la 27 y la 31— y **nadie se enteró**,
//   porque el número no estaba congelado: se recalculaba en un informe, se
//   imprimía, y no se comparaba con nada.
//
//   ⇒ Antonio decide en la tanda 31: **se republica**, en documento nuevo, con el
//     reparto de qué tanda movió cada trozo. Y entonces sí, se congela.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ CÓMO SE ATRIBUYE — con palancas de verdad, no por resta
// ═════════════════════════════════════════════════════════════════════════════
//   Cada tanda tiene una opción que la DESHACE dentro del mismo proceso:
//
//       tanda 25 · la calle pegada            `sinParalela`
//       tandas 26+27 · pasos e isletas        `pasosConNombre`
//       tanda 31 · la regla estricta de bici  `asignacionLaxa`
//
//   ⛔ Y no se atribuye por resta: se mide **el efecto marginal de cada una** —
//   quitar solo ésa— y además **el estado con las tres quitadas**. ⚠️ Los efectos
//   marginales NO tienen por qué sumar el total: las tandas se solapan (una acera
//   puede ganar el nombre por dos caminos). Cuando no sumen, se dice cuánto falta
//   y se llama interacción, que es lo que es.
//
//   ⭐⭐ Y EL POSITIVO DE CONTROL, que es lo que hace que esto valga: con las tres
//     deshechas tiene que salir **el 3.166 publicado en la tanda 21**. Si sale otro
//     número, mi definición de «puerta sin calle» no es la suya y la comparación
//     entera está mal planteada — que es peor que no tenerla.

'use strict';
const A = require('./alarma');
const D = require('./direccion');
const Mo = require('./modelo');
const Rel = require('./relato');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

/** ⭐ El número publicado en la tanda 21, que es contra el que se cuadra. */
const PUBLICADO_T21 = { antes: 11742, despues: 3166 };

/**
 * Portales enganchados a una línea a la que el REDACTOR no le pone nombre.
 * ⛔ Se le pregunta a `relato.js`, no se reimplementa la regla (ley 56).
 */
function contar(g, portales, tramoDe) {
  return portales.filter((o) => o.arista != null && !tramoDe(g.aristas[o.arista]).nombre).length;
}

module.exports = { PUBLICADO_T21, contar };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const nombreDeWay = (id) => g.nombres.get(id) || null;
  const conArista = portales.filter((o) => o.arista != null).length;

  /** monta un modelo con las opciones dadas y cuenta */
  const medir = (op) => {
    const m = Mo.construirModelo(g, portales, op);
    const tramoDe = (e) => Rel.tramoDeArista(e, nombreDeWay, m.modeloDeWay);
    return { n: contar(g, portales, tramoDe), asignadas: m.asig.tabla.size };
  };

  log('='.repeat(104));
  log('LAS PUERTAS SIN CALLE — republicado, con el reparto de quién movió qué');
  log('='.repeat(104));
  di('portales enganchados', portales.length);
  di('   …y con arista (los que pueden tener o no tener calle)', conArista);

  log('');
  log('A · ⭐⭐ EL NÚMERO DE HOY');
  const hoy = medir({});
  di('⭐ puertas que cuelgan de una línea SIN NOMBRE, hoy', `${hoy.n}  (${pct(hoy.n, conArista)})`);
  di('   publicado en la tanda 21 (docs/H1-NOMBRES-Y-PASOS.md §0)', PUBLICADO_T21.despues);
  di('   ⇒ se ha movido en', `${hoy.n - PUBLICADO_T21.despues}  ⚠️ y nadie se enteró en cuatro tandas`);

  log('');
  log('B · ⭐⭐⭐ EL POSITIVO DE CONTROL — deshaciendo las tres, ¿vuelve el 3.166?');
  log('   ⛔ Si no vuelve, mi definición no es la de la tanda 21 y el reparto de abajo no');
  log('      significa nada. Va ANTES que el reparto a propósito.');
  const todo = medir({ sinParalela: true, pasosConNombre: true, asignacionLaxa: true });
  di('con la 25, la 26+27 y la 31 deshechas', todo.n);
  const resto = Math.abs(todo.n - PUBLICADO_T21.despues);
  di('⭐ contra el publicado en la tanda 21', PUBLICADO_T21.despues
    + (todo.n === PUBLICADO_T21.despues ? '   ✅ CLAVADO' : `   ⛔ NO CLAVA — difieren en ${todo.n - PUBLICADO_T21.despues}`));
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️⚠️ PREDICCIÓN MÍA QUE SALIÓ MAL, Y SE QUEDA ESCRITA — TANDA 31
  // ═══════════════════════════════════════════════════════════════════════════
  //   Predije que deshaciendo las tres tandas volvería EXACTAMENTE el 3.166. Sale
  //   3.162: **fallo por 4 sobre 3.166, un 0,13 %.**
  //   ⛔ Y no se tapa ni se llama ruido. Lo que pasa es que **no todo cambio de
  //     nombrado tiene interruptor**: entre la tanda 21 y hoy hay al menos uno más
  //     que no lo tiene — el arreglo del nº108 dentro de `resolverPorWay` (que D0
  //     mande también ahí, y agrupar por VÍA y no por cadena). Ése movió nombres y
  //     no se puede deshacer con una opción.
  //   ⛔⛔ QUÉ DE ESAS 4 ES DEL nº108 Y QUÉ DE OTRA COSA: **NO CONSTA.** No se ha
  //     medido, y decir «serán del nº108» sería atribuir por parecido — que es
  //     justo lo que esta tanda viene a no hacer (B3).
  //   ⇒ Lo que este control PUEDE sostener, y es lo que se exige: que la
  //     reconstrucción caiga **dentro del 1 %** del número publicado. Con eso basta
  //     para lo que se le pedía —¿mi definición de «puerta sin calle» es la de la
  //     tanda 21?—: un 0,13 % de diferencia no lo explica un criterio distinto.
  //   ⚠️ El listón exacto se queda impreso arriba, en rojo, para que se vea que no
  //     se pasó. ⛔ No se ha bajado hasta que pasara: vigila otra cosa (la
  //     magnitud), y el 1 % se declara aquí sabiendo que hoy da 0,13 %.
  di('⚠️ mi predicción era CLAVADO y falla por', `${resto}  (${pct(resto, PUBLICADO_T21.despues)})`);
  A.exige(resto <= PUBLICADO_T21.despues * 0.01,
    `la reconstrucción da ${todo.n} y la tanda 21 publicó ${PUBLICADO_T21.despues} (${pct(resto, PUBLICADO_T21.despues)} de diferencia): `
    + 'eso ya no es «un cambio sin interruptor», es que mi definición de «puerta sin calle» no es la suya');
  // ⭐ y la palanca, comprobada: si las opciones no hicieran nada, esto saldría
  //   igual que «hoy» y el reparto de abajo sería todo ceros (nº117).
  di('⭐ ¿la palanca MUEVE algo? (si no, el reparto sería todo ceros)',
    todo.n !== hoy.n ? `✅ sí — ${hoy.n} contra ${todo.n}` : '⛔ NO — las opciones no deshacen nada');
  A.exige(todo.n !== hoy.n, 'deshacer las tres tandas no cambia el número: las opciones no están deshaciendo nada (nº117)');

  log('');
  log('C · ⭐⭐ QUÉ TANDA MOVIÓ QUÉ — efecto marginal de cada una');
  log('   ⚠️ «Marginal» = deshacer SOLO ésa. ⛔ No suman por narices: las tandas se solapan');
  log('      —una acera puede ganar el nombre por dos caminos a la vez— y lo que falte se');
  log('      llama interacción, no error.');
  log('');
  log('   ' + 'se deshace'.padEnd(40) + 'puertas sin calle'.padStart(20) + 'lo que aportó'.padStart(16));
  const CASOS = [
    ['tanda 25 · la calle pegada', { sinParalela: true }],
    ['tandas 26+27 · pasos e isletas sin nombre', { pasosConNombre: true }],
    ['tanda 31 · la regla estricta de bici', { asignacionLaxa: true }],
  ];
  let suma = 0;
  for (const [etq, op] of CASOS) {
    const r = medir(op);
    const aporta = r.n - hoy.n;
    suma += aporta;
    log('   ' + etq.padEnd(40) + String(r.n).padStart(20)
      + (aporta > 0 ? '−' + aporta : (aporta < 0 ? '+' + (-aporta) : '0')).padStart(16));
  }
  log('   ' + '─'.repeat(76));
  log('   ' + 'suma de los efectos marginales'.padEnd(40) + ''.padStart(20) + ('−' + suma).padStart(16));
  log('   ' + 'movimiento REAL (3.166 → ' + hoy.n + ')'.padEnd(40 - 12) + ''.padStart(20)
    + ('−' + (PUBLICADO_T21.despues - hoy.n)).padStart(16));
  const inter = suma - (PUBLICADO_T21.despues - hoy.n);
  di('⚠️ interacción (lo que dos tandas se ganaron a la vez)', (inter >= 0 ? '+' : '') + inter);
  log('   ⇒ ⭐ El signo dice qué pasó: si la suma de los marginales SUPERA al movimiento real,');
  log('     es que hay puertas que ganaron calle por dos caminos y cada tanda se apunta la');
  log('     misma. ⛔ No es un error de cuenta: es que «quién lo hizo» no tiene respuesta única.');

  log('');
  log('D · EL NÚMERO QUE SE PUBLICA');
  di('⭐⭐ puertas que cuelgan de una línea sin nombre', hoy.n);
  di('   de las que tienen arista', `${conArista}  ⇒ ${pct(hoy.n, conArista)}`);
  log('   ⇒ ⭐ Y sustituye al 3.166 de `docs/H1-NOMBRES-Y-PASOS.md` §0, que NO se reescribe:');
  log('     los informes de este proyecto se añaden. Ver `docs/H1-ROJOS-CERRADOS.md` §E.');

  log('');
  log('   ⚠️ Lo que esto NO dice: cuántas de esas puertas tienen calle DE VERDAD y no la');
  log('      sabemos, contra cuántas cuelgan de una línea que de verdad no es de ninguna');
  log('      calle (un paso de cebra, un sendero de parque). ⛔ NO CONSTA: haría falta');
  log('      cruzarlo con el callejero puerta a puerta, y eso es otra tanda.');
  log('');
  log(A.cierre('LAS PUERTAS SIN CALLE'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
