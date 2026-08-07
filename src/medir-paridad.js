// ⭐⭐⭐ TANDA 33 · QUÉ CAMBIA AL APLICAR LA PARIDAD — y qué NO arregla.
//
//   node src/medir-paridad.js            (§A, §B, §C1–C3, §D · sin grafo)
//   node src/medir-paridad.js --rutas    (+ §C4 · las siete rutas, con grafo)
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ EL SESGO DE ESTA TANDA, DECLARADO ANTES DE MEDIR
// ═════════════════════════════════════════════════════════════════════════════
//   La regla se acaba de aplicar y **eso empuja a que el resultado salga bonito**.
//   Y aquí hay una trampa concreta, que va dicha antes que ningún número:
//
//   ⛔⛔ «CUÁNTO ACERCA» ES UN PASE POR CONSTRUCCIÓN. La tanda 32 midió el
//     desplazamiento como *la distancia entre lo que te daba el buscador y el
//     portal de tu paridad más cercano en número*. La regla nueva devuelve
//     exactamente ese portal. ⇒ el desplazamiento baja a CERO **porque la
//     respuesta nueva es la vara con la que se midió el error viejo**, no porque
//     nada haya mejorado. Publicar ese cero como logro sería mentir con
//     aritmética correcta.
//
//   ⇒ Lo que sí se mide, y no es tautológico:
//     · el ERROR QUE QUEDA — el hueco en el que el número pedido puede caer
//     · cuántas consultas **se quedan sin respuesta** (§C3), que es el coste
//     · que el cambio **no se sale de su sitio** (§C1, el invariante)

'use strict';
const A = require('./alarma');
const D = require('./direccion');
const P = require('./portales');
const Par = require('./paridad');

const URBANAS = new Set(['CL', 'AV', 'PS', 'PL', 'GL', 'RD', 'TR', 'CJ', 'PJ', 'AN', 'VI']);

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ TANDA 34 · EL CENTINELA — y el 66,2 % del universo que se lo llevaba
// ═════════════════════════════════════════════════════════════════════════════
//   117 portales del callejero traen `sortNumber = 99999`. Su número crudo es
//   `"BL0"`, `"BL1"`, `"BL2"`… — **son bloques sin número de portal**, y 99999 es
//   el centinela con el que el callejero dice «no tiene».
//
//   ⛔⛔ LAS TANDAS 32, 33 Y 34 LO HAN CONTADO COMO SI FUERA UN PORTAL. El universo
//     «lo que se puede pedir» va del número mínimo al máximo de cada vía, así que
//     en las **3 vías** afectadas iba de 1 a 99999. ⇒ de las 151.026 consultas
//     pedibles, **99.998 (66,2 %) son una sola vía contando hasta el centinela**.
//   ⚠️ No invalida ningún CASO medido —los huecos reales siguen siendo reales—,
//     pero sí **todos los porcentajes cuyo denominador era «lo pedible»**.
//
//   ⇒ Aquí se mide **las dos cosas**: el universo de la tanda 32 —para que los
//     tres informes se puedan comparar y para que el cuadre siga valiendo— y el
//     universo LIMPIO, que es el que dice algo. ⛔ El centinela NO se quita del
//     buscador: qué hacer con 117 portales que no tienen número es una decisión,
//     y no es mía (§D4).
// ⭐⭐ TANDA 35 · YA NO SE FILTRA AQUÍ: el centinela se apaga en `construirIndice`,
//   que es donde nace el índice del buscador, y la definición vive en
//   `portales.js` (`P.CENTINELA` / `P.numeroPedible`). ⛔ Este medidor no tiene su
//   propia copia del criterio: si la tuviera, podría limpiar cosas distintas que
//   el buscador y volveríamos a medir un mundo que nadie consulta (ley 56).
//   ⇒ lo que queda aquí es la LÍNEA BASE histórica, para poder republicar.
const PUBLICADO_32 = { rango: 150947, existen: 27815, huecos: 123132, cambiaAcera: 66973 };

/** Mediana, p90 y máximo. Misma forma que en la tanda 32. */
function reparto(v) {
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, p25: q(0.25), mediana: q(0.5), p75: q(0.75), p90: q(0.9), p95: q(0.95), max: s[s.length - 1] };
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ EL BARRIDO, EXPORTADO — ⛔ para que nadie lo escriba dos veces
// ═════════════════════════════════════════════════════════════════════════════
//   `numeros-congelados.js` congela varios de estos números, y si los midiera por
//   su cuenta habría **dos caminos de código desde el mismo dato** — que es la
//   forma exacta de los fallos nº63, nº67 y nº107. ⇒ se llama a esta función.
// ⚠️ Y no lleva ni un `console.log`: lo que se imprime lo decide quien la llama.
function barrer(indice, tipoDe) {
  const nuevo = () => ({ rango: 0, existen: 0, huecos: 0, cambiaAcera: 0,
    igual: 0, mismaAcera: 0, sinRespuesta: 0, sinParidad: 0,
    resp: [], respU: [], neg: [], negU: [], antes: [], antesU: [],
    sinRespuestaU: 0, cambiaAceraU: 0, fuera: 0, hueco: 0, invariante: 0, cotas: [],
    // ── TANDA 34 · lo que recupera cada listón, por separado ─────────────────
    // ⭐⭐ TANDA 36 · el contador se da la vuelta con el listón. Antes era
    //   `gana50a100` —lo que el listón alto AÑADÍA—; ahora el listón está en 50 y
    //   lo que hay que contar es **lo que se pierde respecto a 100**, que es la
    //   cifra sobre la que se decide. ⛔ Se cuenta AQUÍ, en el barrido, y además
    //   sale del dial por otro camino: dos cuentas independientes del mismo número
    //   (y §A4 exige que coincidan). Un contador viejo con nombre viejo habría
    //   seguido imprimiendo un 0 perfectamente cierto y perfectamente inútil.
    pierde100a50: 0, conEnfrente: 0, conEnfrenteHueco: 0, conEnfrenteFuera: 0,
    mudas: 0, mudasAntes: 0, dEnfrente: [], enfrenteEsUnica: 0 });
  // ⭐⭐ TANDA 35 · UN SOLO UNIVERSO, y es el limpio, porque el índice ya lo es.
  //   La tanda 34 llevaba dos —el inflado y el limpio— para poder comparar mientras
  //   el centinela seguía dentro del buscador. Ahora está apagado en `construirIndice`
  //   ⇒ lo que se mide es lo que se consulta, que es la única forma de que un número
  //   signifique algo. La línea base histórica se imprime aparte, en `PUBLICADO_32`.
  const G = nuevo();
  let sinNumeroEnIndice = 0, viasSinNumeros = 0;
  {
    for (const l of indice.values()) {
      sinNumeroEnIndice += l.filter((o) => o.n == null).length;
      if (!l.some((o) => o.n != null)) viasSinNumeros++;
      const an = l.paridad;
      if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
      const urb = URBANAS.has(tipoDe(l));
      const inc = (k, v = 1) => { G[k] += v; };
      const mete = (k, v) => { G[k].push(v); };
      const presentes = new Set(l.map((o) => o.n).filter((n) => n != null));
      const nums = [...presentes].sort((a, b) => a - b);
      const lo = nums[0], hi = nums[nums.length - 1];
      inc('rango', hi - lo + 1);
      inc('existen', presentes.size);
      for (let n = lo; n <= hi; n++) {
        if (presentes.has(n)) continue;
        inc('huecos');
        const hoy = Par.masCercanoEnNumero(l, n);          // ⛔ lo que devolvía antes
        const cambia = hoy && hoy.n != null && (hoy.n % 2) !== (n % 2);
        if (!cambia) inc('igual');
        else { inc('cambiaAcera'); if (urb) inc('cambiaAceraU'); }
        // ⭐ y ahora la MISMA función que usa el geocodificador (ley 56)
        const d = Par.decidir(n, l, an);
        // ⛔⛔ EL INVARIANTE: si la respuesta de hoy ya era de su acera, NO puede
        //   cambiar. Un cambio ahí sería la regla saliéndose de su sitio.
        if (!cambia && (d.modo !== 'como-siempre' || d.portal !== hoy)) inc('invariante');
        if (d.modo === 'como-siempre') continue;
        if (d.modo === 'sin-paridad') { inc('sinParidad'); continue; }
        if (d.modo === 'misma-acera') {
          inc('mismaAcera');
          mete('resp', d.cota.m); if (urb) mete('respU', d.cota.m);
        } else {
          // ⭐⭐ A2 · TANDA 36 · las que el listón de 50 le quita al de 100.
          //   ⛔ Va en la rama de «sin respuesta» a propósito: son consultas que HOY
          //     no se contestan y que con 100 sí se contestarían. Esto es lo que se
          //     pierde, medido, no previsto.
          if (d.cota && Number.isFinite(d.cota.m) && d.cota.m <= 100) inc('pierde100a50');
          inc('sinRespuesta'); if (urb) inc('sinRespuestaU');
          const esHueco = d.cota && d.cota.acota === 'hueco';
          if (esHueco) { inc('hueco'); mete('neg', d.cota.m); if (urb) mete('negU', d.cota.m); }
          else inc('fuera');
          // ⭐⭐ A4 · y lo que recupera el listón de ENFRENTE, que no es respuesta:
          //   es una opción donde a veces no había ninguna. Se cuentan las dos cosas.
          const enf = d.sugerencias.filter((s) => s.enfrente);
          const propias = d.sugerencias.filter((s) => !s.enfrente);
          if (enf.length) {
            inc('conEnfrente');
            if (esHueco) inc('conEnfrenteHueco'); else inc('conEnfrenteFuera');
            for (const e of enf) mete('dEnfrente', e.metros);
            // ⛔ el caso que de verdad importa: la única alternativa que hay
            if (propias.length <= 1) inc('enfrenteEsUnica');
          }
          // ⚠️ y las que se quedan MUDAS: sin respuesta y sin ninguna sugerencia
          if (!d.sugerencias.length) inc('mudas');
          if (!propias.length) inc('mudasAntes');
        }
        // ⭐ la cota de TODAS las que la tienen: es lo que mueve el listón (§A2b)
        if (d.cota && Number.isFinite(d.cota.m)) mete('cotas', d.cota.m);
        // el desplazamiento de la tanda 32: cuánto te alejaba la respuesta vieja
        const mio = (d.cota && d.cota.cand) || null;
        if (mio) { const x = Par.dist(mio, hoy); mete('antes', x); if (urb) mete('antesU', x); }
      }
    }
  }
  return { G, sinNumeroEnIndice, viasSinNumeros };
}

module.exports = { reparto, URBANAS, barrer };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  const ps = P.cargarPortales();
  const vias = P.cargarVias();
  const indice = D.construirIndice(ps, vias);
  const nombreDe = (l) => {
    const s = new Set(l.map((o) => (vias.get(o.codigoVia) || {}).nombre).filter(Boolean));
    return [...s].join(' + ');
  };
  const tipoDe = (l) => String((vias.get(l[0].codigoVia) || {}).tipoVia || '').toUpperCase().trim();

  log('='.repeat(112));
  log('⭐⭐⭐ TANDA 33 · DOS ACERAS, DOS CALLES — qué cambia al aplicar la paridad');
  log('='.repeat(112));
  di('portales del callejero', ps.length);
  di('casillas del índice de búsqueda (por núcleo de vía)', indice.size);
  di('⭐ «razonablemente cerca», declarado', Par.RAZONABLE_M + ' m');
  di('⭐ correlativa: tríos mínimos · fracción', `${Par.MIN_TRIOS} · ${Par.FRAC_CORRELATIVA}`);

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('A2 · ⭐⭐ ¿QUÉ ES «RAZONABLEMENTE CERCA»? — en METROS, y de dónde sale');
  log('='.repeat(112));
  log('   ⛔ No se mide en números de portal: entre el 78 y el 80 puede haber diez metros');
  log('     o doscientos, y eso es exactamente lo que hizo fallar al buscador.');
  log('   ⭐ El criterio: **como mucho, el portal de al lado de su misma acera.** ⇒ el listón');
  log('     es la separación típica entre dos portales consecutivos de la misma acera.');
  {
    const sepU = [], sepT = [];
    for (const l of indice.values()) {
      for (const par of [0, 1]) {
        const h = l.filter((o) => o.n != null && o.n % 2 === par).sort((a, b) => a.n - b.n);
        for (let i = 1; i < h.length; i++) {
          if (h[i].n === h[i - 1].n) continue;          // repetidos: un 0 espurio
          const d = Par.dist(h[i - 1], h[i]);
          sepT.push(d);
          if (URBANAS.has(tipoDe(l))) sepU.push(d);
        }
      }
    }
    const rT = reparto(sepT), rU = reparto(sepU);
    log('');
    log('   ' + 'separación entre portales consecutivos de la MISMA acera'.padEnd(56)
      + 'n'.padStart(9) + 'p25'.padStart(7) + 'med'.padStart(7) + 'p75'.padStart(7)
      + 'p90'.padStart(7) + 'p95'.padStart(7));
    for (const [et, r] of [['todas las vías', rT], ['⭐ solo vías urbanas (CL AV PS PL GL RD TR CJ PJ AN VI)', rU]]) {
      log('   ' + et.padEnd(56) + String(r.n).padStart(9) + r.p25.toFixed(0).padStart(7)
        + r.mediana.toFixed(0).padStart(7) + r.p75.toFixed(0).padStart(7)
        + r.p90.toFixed(0).padStart(7) + r.p95.toFixed(0).padStart(7));
    }
    di('⇒ ⭐ p90 urbano', `${rU.p90.toFixed(0)} m   —— de aquí salen los 50, y aquí vuelven`);
    di('⭐⭐ TANDA 36 · el listón aplicado', `**${Par.RAZONABLE_M} m**`);
    log('   ⚠️⚠️ ESTE NÚMERO SE HA MOVIDO DOS VECES: 50 → 100 (tanda 34) → 50 (tanda 36).');
    log('     Subió porque el dial decía que entre 50 y 100 las contestadas se multiplicaban');
    log('     por siete. ⭐⭐⭐ **Ese acantilado era el centinela 99999**: limpio, el salto es');
    log('     ×1,4 (§A4). ⇒ la razón para estar en 100 no existía, y el listón vuelve a donde');
    log('     lo puso la medida — al p90 de ' + rU.p90.toFixed(0) + ' m del reparto de arriba.');
    log('   ⭐ Y lo que se pierde no se pierde: se convierte en SUGERENCIA. A ' + Par.RAZONABLE_M + ' m el');
    log('     buscador contesta; a más, pregunta. El coste va contado en §C3 y §A4.');
    // ⭐⭐ EL GUARDIÁN VUELVE A SER DE DOS LADOS, que es como nació. La tanda 34 tuvo
    //   que abrirlo por arriba porque 100 se salía del reparto del que decía venir —y
    //   el rojo era cierto—. Con el listón otra vez en su procedencia, **se puede
    //   volver a exigir las dos cosas**: ni más estricto que el dato ni por encima de
    //   él. ⛔ Y se deja escrito que se abrió, para que abrirlo otra vez cueste.
    A.exige(Par.RAZONABLE_M >= rU.p75 && Par.RAZONABLE_M <= rU.p95,
      `el listón de ${Par.RAZONABLE_M} m se sale del reparto del que dice venir (p75 ${rU.p75.toFixed(0)} m · p95 ${rU.p95.toFixed(0)} m): `
      + 'o se cambia la procedencia escrita en `paridad.js`, o el número no sale de aquí');
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐⭐ Y EL REPARTO DEL QUE SALE, EXIGIDO — no solo el listón (bitácora nº144)
    // ═══════════════════════════════════════════════════════════════════════
    //   El guardián de arriba compara el listón con el reparto **medido hoy**. Si el
    //   reparto se moviera entero, el listón seguiría cayendo dentro y no saltaría
    //   nada: *la comprobación distingue los extremos y no el medio* (ley 61).
    //   ⛔ Y eso no es hipotético: el comentario de `paridad.js` llevaba tres tandas
    //     diciendo «p90 48 · p95 82» mientras `docs/H1-PARIDAD.md` §A2 publicaba
    //     52 y 91 — y nadie se enteró, porque este número **no estaba en la tabla de
    //     congelados y ningún guardián lo miraba**.
    //   ⇒ se congela AQUÍ, que es donde se mide, contra lo publicado en la tanda 33.
    //   ⭐ Su rojo se ha visto: poniéndole los números del propio comentario viejo,
    //     salta y nombra p90 y p95 con los dos valores.
    {
      const PUB_33 = { n: 30283, p75: 24, p90: 52, p95: 91 };
      const sale = { n: rU.n, p75: Math.round(rU.p75), p90: Math.round(rU.p90), p95: Math.round(rU.p95) };
      const mal = Object.keys(PUB_33).filter((k) => PUB_33[k] !== sale[k]);
      di('⭐ ¿el reparto sigue siendo el que publicó la tanda 33?',
        mal.length ? '⛔ se mueve: ' + mal.join(', ') : `✅ n ${sale.n} · p75 ${sale.p75} · p90 ${sale.p90} · p95 ${sale.p95}`);
      A.exige(mal.length === 0,
        'el reparto del que sale el listón se ha movido en ' + mal.join(', ')
        + `: publicado n ${PUB_33.n} · p75 ${PUB_33.p75} · p90 ${PUB_33.p90} · p95 ${PUB_33.p95}, `
        + `ahora n ${sale.n} · p75 ${sale.p75} · p90 ${sale.p90} · p95 ${sale.p95} `
        + '(docs/H1-PARIDAD.md §A2). Si es a propósito se republica; si no, es un hallazgo');
    }
    global._P90 = rU.p90;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('A1 · ⚠️ DÓNDE LA PARIDAD **NO** SIGNIFICA ACERA — clasificar antes de contar');
  log('='.repeat(112));
  const clas = new Map();
  for (const l of indice.values()) {
    const f = l.paridad.forma;
    if (!clas.has(f)) clas.set(f, []);
    clas.get(f).push(l);
  }
  {
    log('');
    for (const [k, v] of [...clas.entries()].sort((a, b) => b[1].length - a[1].length)) {
      log('   ' + k.padEnd(26) + String(v.length).padStart(8) + pct(v.length, indice.size).padStart(10)
        + '   ' + (k === 'par-impar' ? 'la regla APLICA'
          : k === 'correlativa' ? '⛔ la regla NO aplica: se cae a la respuesta de siempre'
            : k === 'un-solo-lado' ? '⛔ no hay adónde ir: se cae a la respuesta de siempre'
              : '⚠️ menos de ' + Par.MIN_TRIOS + ' tríos: NO SE PUEDE MEDIR. Se aplica la paridad, y se dice.'));
    }
    log('');
    log('   ⭐⭐ LOS CUATRO CASOS CONOCIDOS — el control. Van antes que ningún porcentaje.');
    log('   ' + 'vía'.padEnd(44) + 'forma'.padEnd(18) + 'tríos'.padStart(7)
      + 'frac<45°'.padStart(10) + '   lo que se sabía');
    const CONOCIDAS = [
      ['san valero', 'correlativa', 'tanda 4: numeración correlativa'],
      ['torres san lamberto', 'correlativa', 'tanda 4: numeración correlativa'],
      ['cataluna', 'par-impar', 'diana de Antonio: dos aceras desfasadas'],
      ['madrid', 'par-impar', 'diana de Antonio: dos aceras desfasadas'],
    ];
    let aciertos = 0;
    for (const [nu, esperado, porque] of CONOCIDAS) {
      const l = indice.get(nu);
      if (!l) { A.fallo(`no se encuentra «${nu}» en el índice: el control no se puede correr`); continue; }
      const p = l.paridad;
      const ok = p.forma === esperado;
      if (ok) aciertos++;
      log('   ' + nombreDe(l).slice(0, 42).padEnd(44) + p.forma.padEnd(18) + String(p.trios).padStart(7)
        + (p.frac == null ? '—' : p.frac.toFixed(2)).padStart(10) + '   ' + (ok ? '✅ ' : '⛔ ') + porque);
    }
    // ⭐⭐⭐ EL EXIGE VA SOBRE LAS DOS DIANAS, no sobre las cuatro — y se dice por qué.
    //   Si Avenida Cataluña o Avenida Madrid salieran «correlativas», la regla NO se
    //   aplicaría justo donde Antonio vio el fallo, y todo lo demás sobra.
    for (const nu of ['cataluna', 'madrid']) {
      const l = indice.get(nu);
      A.exige(l && l.paridad.forma === 'par-impar',
        `«${nu}» no sale par/impar (${l ? l.paridad.forma : 'no está'}): la regla no se aplicaría en la vía donde Antonio vio el fallo`);
    }
    log('');
    log('   ⛔ EL LÍMITE, DICHO: de los dos casos correlativos conocidos, el método caza UNO.');
    di('   Polígono San Valero', `frac ${indice.get('san valero').paridad.frac.toFixed(2)}  ✅ cazada`);
    di('   Urbanización Torres de San Lamberto', `frac ${indice.get('torres san lamberto').paridad.frac.toFixed(2)}  ⛔ NO cazada`);
    log('     Sus 51 tríos van de 1° a 180°: la numeración está mezclada de verdad y la');
    log('     geometría no la separa. **NO CONSTA** — y no se fuerza a mano.');
    log('   ⚠️ El precio de no cazarla está acotado: en una vía correlativa tratada como');
    log('     par/impar el error lo tapa el listón de ' + Par.RAZONABLE_M + ' m o se convierte en sugerencia.');
    log('     El precio del error contrario NO está acotado: son los 258 m de Avenida Cataluña.');
    log('     ⇒ ante la duda, paridad. Y la duda se declara.');
  }
  {
    // ── los otros tres casos que no encajan, con su número ──────────────────
    log('');
    log('   ⚠️ LOS OTROS TRES QUE NO ENCAJAN — y qué hace la regla con cada uno');
    let viasRep = 0, excedentes = 0;
    for (const l of indice.values()) {
      const ns = l.map((o) => o.n).filter((n) => n != null);
      const r = ns.length - new Set(ns).size;
      if (r > 0) viasRep++;
      excedentes += r;
    }
    di('vías con algún número REPETIDO dentro de sí', `${viasRep} de ${indice.size}  (${pct(viasRep, indice.size)})`);
    di('   portales excedentes por repetición', `${excedentes}  (${pct(excedentes, ps.length)} de los ${ps.length})`);
    log('     ⇒ **la regla ni los ve**: un número repetido es coincidencia EXACTA y se');
    log('       resuelve antes de llegar a la paridad. Cuál de los hermanos se elige no lo');
    log('       toca esta tanda.');
    log('   ⚠️ EL ENCARGO CITA UN 18,4 % «que repite número dentro de su propia vía». Medido');
    log(`     aquí sale ${pct(viasRep, indice.size)} de vías / ${pct(excedentes, ps.length)} de portales — ninguno de los dos es`);
    log('     18,4 %. El 18,4 % de la tanda 32 era OTRA cosa: «de lo pedible, el 18,4 %');
    log('     existe» (§B3b). Se dice para que no se arrastre un número con la etiqueta');
    log('     cambiada. ⛔ No es una corrección del encargo: es que son dos números distintos.');
    const conLetra = ps.filter((p) => !/^\s*\d+\s*$/.test(String(p.numero)));
    const rangos = ps.filter((p) => /^\d+\s*-\s*\d+/.test(String(p.numero)));
    const cruzan = rangos.filter((p) => { const m = String(p.numero).match(/^(\d+)\s*-\s*(\d+)/); return (+m[1]) % 2 !== (+m[2]) % 2; });
    log('');
    di('portales con LETRA, `bis` o RANGO', `${conLetra.length}  (${pct(conLetra.length, ps.length)})`);
    di('   …de ellos, rangos tipo `9-11`', rangos.length);
    di('   ⛔ …rangos que CRUZAN paridad (`11-12`)', `${cruzan.length}   ej.: ` + cruzan.slice(0, 4).map((p) => p.numero).join(', '));
    log('     ⇒ el número de orden ya trae la paridad, así que letras y `bis` no molestan.');
    log('       Los ' + cruzan.length + ' rangos que cruzan se quedan con la paridad del primer número, y no');
    log('       se puede hacer más: el dato dice que el portal es los dos a la vez.');
    // ⚠️ una casilla del índice puede llevar DOS vías distintas
    let mezcla = 0;
    for (const l of indice.values()) if (new Set(l.map((o) => o.codigoVia)).size > 1) mezcla++;
    log('');
    di('⚠️ casillas del índice que MEZCLAN más de una vía', `${mezcla}  (${pct(mezcla, indice.size)})`);
    log('     «CALLE SAN VALERO» y «POLÍGONO SAN VALERO» comparten núcleo y caen en la misma');
    log('     casilla. ⛔ Es anterior a esta tanda y no se arregla aquí, pero se declara: en');
    log('     esas ' + mezcla + ' casillas la forma de numeración se mide sobre las dos vías juntas.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('A3 + B · ⭐⭐ QUÉ CONTESTA AHORA — el caso de Antonio, con el aviso entero');
  log('='.repeat(112));
  {
    const CASOS = ['Avenida Cataluña 78', 'Avenida Cataluña 77', 'Avenida Pablo Gargallo 16',
      'Calle Matadero 1', 'Cantando Bajo la Lluvia 6', 'Urbanización Torres de San Lamberto 7',
      'Polígono San Valero 47', 'Avenida Madrid 251'];
    for (const q of CASOS) {
      const r = D.resolver(q, indice);
      log('');
      log('   ' + q);
      di('   estado', r.estado + (r.paridad ? '   [' + r.paridad + ' · vía ' + r.forma + ']' : ''));
      di('   respuesta', r.portal ? 'portal nº' + r.portal.n : '⛔ NO SE TIENE — solo sugerencia');
      if (r.aviso) log('      aviso    «' + r.aviso + '»');
      if (r.sugerencias) for (const s of r.sugerencias) {
        log('      ⭐ sugerencia  nº' + String(s.n).padEnd(6) + 'acera de los ' + s.acera.padEnd(9)
          + (s.metros == null ? 'NO CONSTA la distancia: ' + s.motivo : s.metros + ' m ' + s.motivo));
      }
    }
    // ⛔⛔ LA COMPROBACIÓN CAMBIA CON LA REGLA, Y SE DICE.
    //   La tanda 33 exigía **cero** sugerencias de enfrente. La 34 las admite, así
    //   que esa comprobación ya no vale — pero **no se borra: se sustituye por la
    //   que guarda la regla nueva**, que es más exigente porque son tres cosas:
    //     1 · toda sugerencia de la otra paridad va MARCADA `enfrente`
    //     2 · y a menos de `ENFRENTE_M` de la de su acera
    //     3 · y SIEMPRE detrás de todas las propias (el orden de A2)
    //   ⭐ Y se barre el callejero entero, no los ocho casos de arriba: una regla
    //     comprobada sobre los ejemplos que uno elige no está comprobada.
    let sug = 0, sinMarca = 0, lejos = 0, desordenadas = 0, conEnf = 0;
    for (const l of indice.values()) {
      const an = l.paridad;
      if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
      const presentes = new Set(l.map((o) => o.n).filter((n) => n != null));
      const nums = [...presentes].sort((a, b) => a - b);
      for (let n = nums[0]; n <= nums[nums.length - 1]; n++) {
        if (presentes.has(n)) continue;
        const d = Par.decidir(n, l, an);
        let vistoEnfrente = false;
        for (const s of d.sugerencias) {
          sug++;
          const otraParidad = (s.n % 2) !== (n % 2);
          if (otraParidad !== !!s.enfrente) sinMarca++;
          if (s.enfrente) {
            conEnf++;
            vistoEnfrente = true;
            if (s.metros > Par.ENFRENTE_M) lejos++;
          } else if (vistoEnfrente) desordenadas++;      // una propia DESPUÉS de una de enfrente
        }
      }
    }
    log('');
    di('sugerencias emitidas en todo el callejero', sug);
    di('   …de la acera de ENFRENTE', conEnf);
    di('⛔ (1) de otra paridad SIN la marca `enfrente` (o al revés)', sinMarca);
    di('⛔ (2) de enfrente a más de ' + Par.ENFRENTE_M + ' m', lejos);
    di('⛔ (3) una propia colocada DESPUÉS de una de enfrente', desordenadas);
    A.exige(sinMarca === 0, `${sinMarca} sugerencias no llevan la marca que les toca: cruzar dejaría de verse`);
    A.exige(lejos === 0, `${lejos} sugerencias de enfrente pasan de ${Par.ENFRENTE_M} m: el radio no se está aplicando`);
    A.exige(desordenadas === 0, `${desordenadas} sugerencias propias van detrás de una de enfrente: el orden de A2 no se respeta`);
    // ⭐ y que no pase por vacío: si no hubiera NINGUNA de enfrente, los tres ceros
    //   de arriba serían ciertos y no significarían nada.
    A.exige(conEnf > 0, 'CERO sugerencias de enfrente en todo el callejero: los tres ceros de arriba no prueban nada');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('C1–C3 · ⭐⭐⭐ QUÉ CAMBIA — barrido de TODO lo que se puede pedir');
  log('='.repeat(112));
  log('   ⭐ El universo es el mismo que el de la tanda 32: para cada vía con dos hilos, todos');
  log('     los números del mínimo al máximo. Así los dos informes se pueden comparar.');
  const { G, sinNumeroEnIndice, viasSinNumeros } = barrer(indice, tipoDe);
  {
    log('');
    log('   ⛔⛔ EL CENTINELA, APAGADO — y los números que sostenía, republicados');
    di('portales sin número pedible en el índice (bloques, letras)', sinNumeroEnIndice);
    di('   …y vías que son SOLO eso', `${viasSinNumeros}   (Alameda y Parque Roma: 38 y 43 accesos)`);
    log('     ⭐ Siguen en el índice y siguen enganchados al grafo: lo único que han');
    log('       perdido es el número con el que se les podía pedir. Una consulta sin');
    log('       número los sigue encontrando.');
    A.exige(sinNumeroEnIndice > 0,
      'CERO portales sin número en el índice: el centinela no se está apagando y este barrido mide el universo inflado');
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐⭐ EL MECANISMO CONTRA LA CLASE, NO CONTRA EL CASO
    // ═══════════════════════════════════════════════════════════════════════
    //   Apagar el 99999 arregla ESTE centinela. No arregla el siguiente —un 9999,
    //   un 0, un 8888—, y un centinela nuevo volvería a inflar el universo sin que
    //   nadie se enterara, porque **el síntoma no es el valor: es que una vía se
    //   lleve un rango absurdo**. ⇒ se imprimen SIEMPRE las cinco vías con el rango
    //   más grande. Con eso, un centinela de cualquier valor se ve a la primera.
    // ⚠️ Esto es lo que faltaba en las tandas 32, 33 y 34: la tabla existía, pero
    //   agregada. Un máximo por vía habría cantado desde el primer día.
    log('');
    log('   ⭐⭐ LAS CINCO VÍAS CON EL RANGO MÁS GRANDE — el detector de centinelas');
    {
      // ⚠️ SOBRE LA MISMA POBLACIÓN QUE EL UNIVERSO — las vías con dos hilos. La
      //   primera versión barría el índice entero y señalaba carreteras que ni
      //   siquiera entran en la cuenta: un detector que mira otra población que la
      //   que vigila señala cosas que no importan (bitácora nº140).
      const rangos = [];
      let maxN = 0;
      for (const l of indice.values()) {
        const an = l.paridad;
        if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
        const ns = l.map((o) => o.n).filter((n) => n != null);
        if (!ns.length) continue;
        const lo = Math.min(...ns), hi = Math.max(...ns);
        if (hi > maxN) maxN = hi;
        rangos.push({ l, r: hi - lo + 1, lo, hi, portales: ns.length, k: (hi - lo + 1) / ns.length });
      }
      rangos.sort((a, b) => b.k - a.k);
      log('   ' + 'vía'.padEnd(46) + 'rango'.padStart(9) + 'de'.padStart(8) + 'a'.padStart(8)
        + 'portales'.padStart(10) + '  nº por portal');
      for (const x of rangos.slice(0, 5)) {
        log('   ' + nombreDe(x.l).slice(0, 44).padEnd(46) + String(x.r).padStart(9)
          + String(x.lo).padStart(8) + String(x.hi).padStart(8) + String(x.portales).padStart(10)
          + '  ' + x.k.toFixed(1));
      }
      const ks = rangos.map((x) => x.k).sort((a, b) => a - b);
      di('números pedibles por portal (mediana · p99 · máximo)',
        `${ks[Math.floor(ks.length / 2)].toFixed(1)} · ${ks[Math.floor(0.99 * ks.length)].toFixed(1)} · ${ks[ks.length - 1].toFixed(1)}`);
      di('⭐ el número de portal más alto del universo', maxN);
      // ⛔ (1) el centinela por su VALOR: un número imposible.
      //   ⚠️⚠️ ARREGLOS 1 · ESTE GUARDIÁN COMPARABA CONTRA EL NÚMERO EQUIVOCADO.
      //     Decía `maxN < P.CENTINELA` y `P.CENTINELA` valía **9999**, que no es el
      //     centinela: es el TECHO de lo pedible. El mensaje llegaba a imprimir «el
      //     centinela declarado es 9999», que es falso. Ahora son dos exigencias,
      //     porque son dos cosas:
      A.exige(maxN < P.TECHO_PEDIBLE,
        `hay un portal con número ${maxN} en el universo y el techo de lo pedible es ${P.TECHO_PEDIBLE}: `
        + 'o el filtro no filtra, o el callejero ha estrenado otro valor imposible');
      // ⛔ (1b) ⭐⭐ LO QUE EL TECHO TIRA EN SILENCIO. Un portal con número real
      //   entre el techo y el centinela desaparecería del buscador sin que nadie
      //   se enterase. Hoy son 0 —medido— y por eso hace falta el guardián: un
      //   cero sin vigilancia es un cero que nadie volverá a mirar.
      {
        // ⛔ se lee el CRUDO a propósito: `cargarPortales()` ya aplica el techo, y
        //   preguntarle a la función filtrada si el filtro tira algo daría 0 siempre.
        const crudos = JSON.parse(require('fs').readFileSync(P.RUTA_PORTALES, 'utf8'))
          .map((x) => Number(x.sortNumber));
        const franja = crudos.filter((n) => n >= P.TECHO_PEDIBLE && n < P.CENTINELA_CALLEJERO);
        // ⭐ positivo de control: sin él, un 0 es indistinguible de una lista vacía.
        //   ⚠️ Y NO puede depender de `TECHO_PEDIBLE`: la primera versión contaba
        //     «los que están por debajo del techo» y al provocarle el rojo al
        //     guardián **saltó también el control**, que es justo lo que un control
        //     no debe hacer. Cuenta el fichero, no el filtro.
        A.exige(crudos.length > 46000,
          `el crudo de portales trae ${crudos.length} registros: el cero de abajo no probaría nada`);
        A.exige(franja.length === 0,
          `hay ${franja.length} portales con número entre el techo (${P.TECHO_PEDIBLE}) y el `
          + `centinela del callejero (${P.CENTINELA_CALLEJERO}): son números REALES y el techo los `
          + 'está tirando en silencio');
      }
      // ⛔ (2) el centinela por su FORMA, que es lo que caza a uno de otro valor.
      //   ⭐ El listón se declara con los dos anclajes medidos, no a ojo:
      //     · el peor caso REAL de Zaragoza es DISEMINADO PEÑAFLOR, con 63,8
      //       números por portal — numeración rural dispersa, no un centinela;
      //     · el artefacto del 99999 daba 99.999/47 ≈ **2.128**.
      //   ⇒ 500 está a ×8 del caso real y a ÷4 del artefacto. Los dos márgenes van
      //     escritos para que se vea que no está pegado a ninguno.
      const LISTON_K = 500;
      const absurdas = rangos.filter((x) => x.k > LISTON_K);
      di(`⚠️ vías con más de ${LISTON_K} números pedibles por portal`, absurdas.length
        + (absurdas.length ? '   ⇒ ' + absurdas.slice(0, 3).map((x) => nombreDe(x.l).slice(0, 30)).join(' · ') : '   ✅ ninguna'));
      A.exige(absurdas.length === 0,
        `${absurdas.length} vías pasan de ${LISTON_K} números pedibles por portal: es la forma de un centinela `
        + 'de otro valor, y hasta que se declare no se puede contar como consultas');
      // ⚠️ Y lo que SÍ hay y es real, dicho con su tamaño: la numeración dispersa.
      const dispersas = rangos.filter((x) => x.k > 30);
      const suman = dispersas.reduce((s, x) => s + x.r, 0);
      di('⚠️ vías de numeración DISPERSA (>30 nº por portal), que son reales',
        `${dispersas.length}   aportan ${suman} pedibles  (${pct(suman, G.rango)})`);
      log('     Son diseminados y carreteras: numeración kilométrica de verdad. ⛔ No se');
      log('     quitan —existen— pero su peso va dicho, que es lo que faltó con el centinela.');
    }
    log('');
    log('   ' + 'universo'.padEnd(40) + 'pedibles'.padStart(11) + 'existen'.padStart(10)
      + 'huecos'.padStart(10) + 'cambian de acera'.padStart(19));
    log('   ' + '⛔ el que publicaron las tandas 32 y 33'.padEnd(41) + String(PUBLICADO_32.rango).padStart(11)
      + String(PUBLICADO_32.existen).padStart(10) + String(PUBLICADO_32.huecos).padStart(10)
      + `${PUBLICADO_32.cambiaAcera}  ${pct(PUBLICADO_32.cambiaAcera, PUBLICADO_32.huecos)}`.padStart(19));
    log('   ' + '⭐ EL BUENO (tanda 35)'.padEnd(41) + String(G.rango).padStart(11)
      + String(G.existen).padStart(10) + String(G.huecos).padStart(10)
      + `${G.cambiaAcera}  ${pct(G.cambiaAcera, G.huecos)}`.padStart(19));
    di('⇒ lo que sobraba', `${PUBLICADO_32.rango - G.rango} consultas  (${pct(PUBLICADO_32.rango - G.rango, PUBLICADO_32.rango)} de lo publicado)`);
    log('   ⚠️ Y NO coincide con las 51.028 que la tanda 34 llamó «limpio»: aquella EXCLUÍA');
    log('     la vía entera, y el Grupo Casamayor tiene 26 portales bien numerados que ahora');
    log('     vuelven a contar. ⇒ apagar el centinela y quitar la vía **no son lo mismo**, y');
    log('     el bueno es éste: el que ve el buscador.');
    A.exige(G.rango < PUBLICADO_32.rango,
      `el universo sale ${G.rango} y lo publicado eran ${PUBLICADO_32.rango}: si no ha bajado, el centinela sigue dentro`);
    log('');
    log('   ⭐⭐ C1 · CUÁNTAS CONSULTAS CAMBIAN DE RESPUESTA');
    const cambian = G.mismaAcera + G.sinRespuesta;
    const unaFila = (et, k) => log('   ' + et.padEnd(56) + `${G[k]}`.padStart(10) + pct(G[k], G.huecos).padStart(10));
    unaFila('la respuesta de hoy ya era de su acera ⇒ NO se toca', 'igual');
    unaFila('⭐ pasa a un portal de SU acera', 'mismaAcera');
    unaFila('⛔ pasa a NO TENER respuesta (solo sugerencia)', 'sinRespuesta');
    unaFila('⚠️ la paridad no manda ⇒ respuesta de siempre', 'sinParidad');
    log('   ' + '⇒ ⭐⭐ CONSULTAS QUE CAMBIAN DE RESPUESTA'.padEnd(57)
      + `${cambian}`.padStart(10) + pct(cambian, G.rango).padStart(10) + '  de lo pedible');
    log('');
    log('   ⛔⛔ EL INVARIANTE — el cambio no puede salirse de su sitio');
    di('consultas cuya respuesta de hoy YA era de su acera y aun así cambian', G.invariante);
    A.exige(G.invariante === 0,
      `${G.invariante} consultas cambian sin que su respuesta de hoy cambiara de acera: la regla se ha salido de la paridad`);
    A.exige(cambian <= G.cambiaAcera,
      `cambian ${cambian} respuestas y solo ${G.cambiaAcera} cambiaban de acera: el cambio afecta a consultas que no le tocan`);
    log('   ⇒ ⭐ Es la costura del encargo, escrita como comprobación: *«alguna ruta cambia sin');
    log('     que su extremo cambie de paridad → PARA»*. Aquí se comprueba sobre las ' + G.rango);
    log('     consultas, no sobre las catorce de las rutas.');

    log('');
    log('   ⭐⭐ C2 · CUÁNTO ACERCA — ⛔ y por qué el titular fácil sería una trampa');
    const rA = reparto(G.antes), rAU = reparto(G.antesU);
    log('   ' + ''.padEnd(56) + 'n'.padStart(9) + 'med'.padStart(8) + 'p75'.padStart(8) + 'p90'.padStart(8) + 'máx'.padStart(9));
    const fila = (et, r) => log('   ' + et.padEnd(56) + (r ? String(r.n) : '—').padStart(9)
      + (r ? r.mediana.toFixed(0) : '—').padStart(8) + (r ? r.p75.toFixed(0) : '—').padStart(8)
      + (r ? r.p90.toFixed(0) : '—').padStart(8) + (r ? r.max.toFixed(0) : '—').padStart(9));
    fila('lo que te alejaba la acera de enfrente (tanda 32) · todas', rA);
    fila('   …urbanas', rAU);
    fila('⭐ el error que QUEDA en las que SÍ se contestan · todas', reparto(G.resp));
    fila('   …urbanas', reparto(G.respU));
    fila('⛔ el hueco de las que se RECHAZAN · todas', reparto(G.neg));
    fila('   …urbanas', reparto(G.negU));
    log('');
    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️⚠️ TANDA 35 · ESTE CUADRE ERA UNO DE LOS DOS QUE ESTABAN DE ACUERDO
    //   SOBRE EL ARTEFACTO — y al apagar el centinela se puso rojo, que es lo que
    //   tenía que hacer. Exigía reproducir **126 m** de mediana, y esos 126 los
    //   levantaba la vía del centinela: sin ella salen **75**.
    //   ⭐ La fila URBANA no se movió (54 frente a 51): el centinela vivía en un
    //     GRUPO, no en una vía urbana. ⇒ los números urbanos de las tandas 32 a 34
    //     nunca estuvieron contaminados, y eso también hay que decirlo.
    //   ⛔ Y lo que sustituye al cuadre NO es una validación: es un freno de
    //     deriva. Comparar el script contra una constante sacada del propio script
    //     no demuestra que el número sea correcto —solo que no se ha movido solo—.
    //     El número correcto es el que se publica hoy en `docs/H1-TOPE-ADELANTO.md`
    //     y se congela en `numeros-congelados.js`.
    log('   ⚠️ EL CUADRE CONTRA LA TANDA 32 SE RETIRA: sus 126 m los levantaba el centinela.');
    log('     Lo que queda es un FRENO DE DERIVA contra lo republicado hoy —75 m todas, 54 m');
    log('     urbanas—, y ⛔ eso no valida nada: solo impide que se mueva sin que nadie se entere.');
    A.exige(rA && Math.abs(rA.mediana - 75) < 6 && rAU && Math.abs(rAU.mediana - 54) < 6,
      `el «antes» da ${rA ? rA.mediana.toFixed(0) : '—'} / ${rAU ? rAU.mediana.toFixed(0) : '—'} y la tanda 35 republicó 75 / 54: `
      + 'si es a propósito se republica con su motivo escrito; si no, es un hallazgo');
    log('   ⛔ Y la primera fila NO «baja a cero porque la regla funcione»: la respuesta nueva');
    log('     ES el portal con el que la tanda 32 midió el error viejo. Misma vara. ⇒ el número');
    log('     que vale es el de en medio: **lo que sigue sin saberse aun contestando bien**.');

    log('');
    log('   ⚠️⚠️⚠️ C3 · EL COSTE — cuántas consultas SE QUEDAN SIN RESPUESTA');
    di('⛔ sin respuesta (solo sugerencia)', `${G.sinRespuesta}  (${pct(G.sinRespuesta, G.rango)} de lo pedible · ${pct(G.sinRespuesta, G.huecos)} de los huecos)`);
    di('   …de los que HOY cambian de acera', `${pct(G.sinRespuesta, G.cambiaAcera)}`);
    di('   …en vías urbanas', `${G.sinRespuestaU}  (${pct(G.sinRespuestaU, G.cambiaAceraU)} de los urbanos que cambian de acera)`);
    di('   ⭐ por hueco demasiado grande (> ' + Par.RAZONABLE_M + ' m)', `${G.hueco}  (${pct(G.hueco, G.sinRespuesta)})`);
    di('   ⚠️ por caer FUERA del tramo numerado de su acera', `${G.fuera}  (${pct(G.fuera, G.sinRespuesta)})`);
    log(`   ⛔ SIGUE SIENDO MUCHO, Y VA DICHO ASÍ: **${pct(G.sinRespuesta, G.huecos)} de los números que no`);
    log('     existen no tienen respuesta automática.** Antes de la tanda 33 TODOS tenían una');
    log('     — la de la acera de enfrente, que es la que puso a Antonio a 258 m de donde iba.');
    log(`   ⚠️ Y el motivo ha cambiado de sitio: con el listón a ${Par.RAZONABLE_M} m, el ${pct(G.fuera, G.sinRespuesta)} de las que`);
    log('     se quedan sin respuesta ya NO es por hueco grande, sino por caer FUERA del tramo');
    log('     numerado de su acera. ⛔ Eso no lo arregla subir más el listón (§A2b).');

    // ═══════════════════════════════════════════════════════════════════════
    log('');
    log('   ⭐⭐ A4 · QUÉ RECUPERA CADA LISTÓN, POR SEPARADO');
    log('   ' + '─'.repeat(104));
    log('   ⛔ Son dos cosas distintas y no se suman: uno devuelve RESPUESTAS y el otro');
    log('     devuelve OPCIONES. Mezclarlos daría un titular más grande y más falso.');
    log('');
    log('   ⭐ (1) SU ACERA, de vuelta a ' + Par.RAZONABLE_M + ' m — devuelve RESPUESTA automática');
    di('   consultas contestadas ahora', G.mismaAcera);
    di('   ⭐⭐ …y las que se PIERDEN respecto al listón de 100', `${G.pierde100a50}`);
    // ⭐⭐⭐ LA RESTA, IMPRESA. Es la ley nº142, escrita ayer y aplicada hoy: *la
    //   cifra que entra en una decisión es la del texto, no la de la tabla.* ⇒ el
    //   informe no puede pedirle a nadie que reste dos columnas a mano.
    log('   ' + 'listón'.padEnd(24) + 'contestadas'.padStart(14) + '   ');
    log('   ' + '100 m (tanda 34-35)'.padEnd(24) + String(G.mismaAcera + G.pierde100a50).padStart(14));
    log('   ' + ('⭐ ' + Par.RAZONABLE_M + ' m (tanda 36)').padEnd(24) + String(G.mismaAcera).padStart(14));
    log('   ' + '⇒ se pierden'.padEnd(24) + String(G.pierde100a50).padStart(14)
      + `   (${pct(G.pierde100a50, G.mismaAcera + G.pierde100a50)} de las que contestaba el listón alto)`);
    log('   ⚠️ La tanda 35 previó 1.859. ⛔ Era una PREVISIÓN y se comprueba aquí, porque la');
    log('     anterior —las «358 perdidas» del tope de adelanto— falló por un factor de tres.');
    // ⭐ DOS CAMINOS PARA EL MISMO NÚMERO, y se exige que coincidan: el contador del
    //   barrido cuenta consulta a consulta; el dial lo saca del reparto de cotas. Si
    //   discreparan, uno de los dos está midiendo otra cosa.
    {
      const porDial = G.cotas.filter((x) => x <= 100).length - G.cotas.filter((x) => x <= Par.RAZONABLE_M).length;
      di('   ⭐ ¿lo dice también el dial, por su cuenta?',
        porDial === G.pierde100a50 ? `✅ ${porDial} = ${G.pierde100a50}` : `⛔ NO — ${porDial} frente a ${G.pierde100a50}`);
      A.exige(porDial === G.pierde100a50,
        `el contador dice que se pierden ${G.pierde100a50} y el dial ${porDial}: uno de los dos no mide lo que dice`);
    }
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐⭐⭐ TANDA 35 · EL SEGUNDO CUADRE QUE ESTABA DE ACUERDO SOBRE EL ARTEFACTO
    // ═══════════════════════════════════════════════════════════════════════
    //   La tanda 34 celebró que el dial de la 33 predijera **31.411 clavadas** con
    //   el listón a 100 m. Y era cierto — **porque el dial también se midió sobre
    //   el universo inflado**. Sin el centinela salen **6.421**.
    //
    //   ⚠️⚠️ Y NO ES SOLO UN NÚMERO MÁS PEQUEÑO: es el argumento de la decisión.
    //     El dial de la 33 decía 4.562 a 50 m y 31.411 a 100 ⇒ **×6,9**, y ese
    //     «acantilado» fue lo que llevó a subir el listón. Limpio: 4.562 y 6.421
    //     ⇒ **×1,4**. Los 4.562 son IDÉNTICOS en los dos, porque toda la
    //     contaminación estaba en la banda de 50 a 100.
    //   ⇒ ⭐ **El acantilado era el artefacto.** Subir el listón sigue recuperando
    //     consultas, pero siete veces menos de las que decía el dato que se miró.
    // ⭐⭐⭐ TANDA 36 · Y ÉSA ES LA DECISIÓN DE HOY: si la razón para subir a 100 era
    //   el acantilado, y el acantilado no existe, **el listón vuelve a 50**.
    log('   ⛔⛔ EL DIAL DE LA TANDA 33 ESTABA INFLADO — y era el argumento para subir:');
    const cien = G.mismaAcera + G.pierde100a50;
    log('   ' + 'listón'.padEnd(24) + 'dial de la tanda 33'.padStart(22) + 'limpio (tandas 35-36)'.padStart(22));
    log('   ' + '50 m   ⭐ el aplicado'.padEnd(24) + '4.562'.padStart(22) + String(G.mismaAcera).padStart(22));
    log('   ' + '100 m'.padEnd(24) + '31.411'.padStart(22) + String(cien).padStart(22)
      + `   ⇒ ×${(31411 / Math.max(1, cien)).toFixed(1)} de diferencia`);
    log('   ' + '⇒ el salto de 50 a 100'.padEnd(24) + '×6,9'.padStart(22)
      + `×${(cien / Math.max(1, G.mismaAcera)).toFixed(1)}`.padStart(22) + '   ⭐⭐ el acantilado era el centinela');
    // ⛔⛔ EL CUADRE QUE NO SE RETIRA, y es el que más dice hoy: la tanda 35 midió y
    //   congeló **6.421 contestadas a 100 m**. Ese número no depende del listón que
    //   se aplique —se reconstruye sumando lo que hoy se contesta y lo que hoy se
    //   pierde—, así que sigue siendo exigible. ⭐ Y hace algo más: **demuestra que
    //   la resta de arriba es la buena**, porque si `pierde100a50` estuviera mal la
    //   suma no daría 6.421.
    A.exige(cien === 6421,
      `contestadas a 50 m (${G.mismaAcera}) + perdidas respecto a 100 (${G.pierde100a50}) = ${cien}, `
      + 'y la tanda 35 congeló 6.421 contestadas a 100 m: o el listón mide otra cosa, o la resta está mal');
    log('');
    log('   ⭐ (2) ENFRENTE, ≤' + Par.ENFRENTE_M + ' m de radio Y ≤' + Par.ADELANTO_M + ' m calle abajo');
    log('        — NO devuelve respuesta: devuelve una OPCIÓN marcada');
    const una = (et, k, den) => log('   ' + et.padEnd(58)
      + `${G[k]}`.padStart(10) + (den ? pct(G[k], G[den]) : '').padStart(10));
    una('   sin respuesta que ganan alguna sugerencia de enfrente', 'conEnfrente', 'sinRespuesta');
    una('      …con hueco propio medible', 'conEnfrenteHueco');
    una('      …fuera del tramo de su acera', 'conEnfrenteFuera');
    una('   ⭐⭐ …y en cuántas es la ÚNICA alternativa', 'enfrenteEsUnica');
    {
      const r = reparto(G.dEnfrente);
      log('');
      log('   ' + 'distancia al portal de enfrente ofrecido'.padEnd(50)
        + 'n'.padStart(9) + 'med'.padStart(8) + 'p75'.padStart(8) + 'p90'.padStart(8) + 'máx'.padStart(9));
      if (r) log('   ' + ''.padEnd(50) + String(r.n).padStart(9) + r.mediana.toFixed(0).padStart(8)
        + r.p75.toFixed(0).padStart(8) + r.p90.toFixed(0).padStart(8) + r.max.toFixed(0).padStart(9));
    }
    log('');
    di('⚠️ consultas que se quedan MUDAS (sin respuesta y sin ninguna sugerencia)', G.mudas);
    di('   …y las que se quedarían sin el listón de enfrente', G.mudasAntes);
    log('   ⭐ Lo que NO se pierde en las demás: se sigue sabiendo el número, la acera, el');
    log('     tamaño del hueco y —si la hay— la de enfrente CON SU MARCA. Lo que se quita es');
    log('     que **la app decida sola**.');

    // ── A2b · ⭐⭐ LA SENSIBILIDAD DEL LISTÓN — el dial, sin elegirlo yo ────────
    log('');
    log('   ⭐⭐ A3 · EL DIAL ENTERO, SOBRE EL UNIVERSO LIMPIO — ⛔ éste es el que hay que');
    log('     mirar: el que publicó la tanda 33 llevaba el centinela dentro (§A4).');
    // ⛔ El denominador es el mismo en todas las filas —las consultas que la regla
    //   llega a evaluar— y no cambia con el listón: lo único que se mueve es dónde
    //   cae el corte. Así las dos columnas suman siempre lo mismo y se puede leer
    //   la fila de al lado sin rehacer ninguna cuenta.
    const evaluadas = G.mismaAcera + G.sinRespuesta;
    log('   ' + 'listón'.padStart(9) + 'contestadas'.padStart(14) + 'sin respuesta'.padStart(15)
      + '        %'.padStart(11) + '   error máximo que se acepta');
    for (const u of [25, 50, 75, 100, 150, 200]) {
      const si = G.cotas.filter((x) => x <= u).length;
      log('   ' + (u + ' m').padStart(9) + String(si).padStart(14) + String(evaluadas - si).padStart(15)
        + pct(si, evaluadas).padStart(11)
        + '   ' + (u === Par.RAZONABLE_M ? '⭐ el aplicado' : ''));
    }
    // ⭐⭐ QUE EL DIAL MIDA LA REGLA, y no una versión suya: la fila del listón
    //   aplicado tiene que dar exactamente lo que devuelve `decidir()`. Es la ley
    //   del nº141 —*un dial que no reproduce la regla mide otra cosa*— puesta como
    //   comprobación en vez de como frase.
    {
      const enLaFila = G.cotas.filter((x) => x <= Par.RAZONABLE_M).length;
      di('⭐ ¿la fila del listón aplicado da lo que contesta el buscador?',
        enLaFila === G.mismaAcera ? `✅ ${enLaFila} = ${G.mismaAcera}` : `⛔ NO — ${enLaFila} frente a ${G.mismaAcera}`);
      A.exige(enLaFila === G.mismaAcera,
        `el dial dice ${enLaFila} contestadas con el listón aplicado y el buscador contesta ${G.mismaAcera}: el dial no mide la regla`);
    }
    log('   ⛔ Las ' + G.fuera + ' que caen fuera del tramo no se arreglan subiendo el listón: no hay');
    log('     hueco que medir. Ésas solo las movería la interpolación (§D2).');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('D · ⚠️ LO QUE ESTO **NO** ARREGLA');
  log('='.repeat(112));
  log('   D1 · **El 78 sigue sin existir.** Llevarte al 74 es la acera correcta, pero no el');
  log('        portal que pediste. Ninguna regla de paridad puede inventar un portal.');
  log('');
  log('   D2 · ⭐ LO HONESTO SERÍA INTERPOLAR sobre el hilo de su paridad: si el 74 y el 84');
  log('        están, el 78 va entre medias. ⛔ NO se hace hoy — es otra tanda. Su tamaño:');
  {
    // ¿a cuántas consultas afectaría? A las que hoy se quedan sin respuesta POR
    // hueco grande —ahí la interpolación daría un punto— y a las que sí responden
    // pero con un hueco mayor que la separación típica.
    di('   consultas que hoy se quedan sin respuesta por hueco grande', G.hueco);
    di('   ⛔ …y las que caen fuera del tramo: la interpolación NO las salva', G.fuera);
    di('   consultas respondidas cuyo error sigue por encima de 25 m', G.resp.filter((x) => x > 25).length);
    log('        ⇒ ⭐ La interpolación es la única que puede bajar el error de las ' + G.hueco + ' de');
    log('          arriba de «un hueco entero» a «unos metros». Es el trabajo pendiente más');
    log('          grande que deja esta tanda, y tiene su número.');
  }
  log('');
  log('   D3 · ⚠️ Los 76 portales enganchados a la acera contraria SIGUEN AHÍ. Se decidió en');
  log('        la tanda 32: marcarlos, no moverlos —59 no tienen adónde ir y los 17 que sí');
  log('        quedarían veinte veces más lejos—. ⛔ Esta tanda no toca el enganche.');

  // ═══════════════════════════════════════════════════════════════════════════
  if (process.argv.includes('--rutas')) {
    log('');
    log('C4 · ⭐⭐⭐ LAS SIETE RUTAS, UNA A UNA');
    log('='.repeat(112));
    const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
    const Gr = require('./grafo');
    const T = require('./tabla-rutas');
    const POI = require('./rutas-antonio').POI;
    const g = construir(ZONA_TERMINO);
    const ctx = D.abrir(g, CRUDO);
    const t = T.leer();
    // ⚠️ Éstos son los metros que publicó la TANDA 16, y se dejan como estaban a
    //   propósito: la columna mide **el desplazamiento acumulado desde entonces**.
    //   ⛔ No confundir con `PUBLICADOS` de `modelo-rutas.js`, que es otra cosa —lo
    //     que el guardián EXIGE hoy, con la nº6 ya actualizada a 520,2 en la tanda
    //     33—. No son dos copias del mismo dato: son dos preguntas distintas, y por
    //     eso cada una vive donde se contesta.
    const PUBLICADO = { 1: 3086.9, 2: 598.1, 3: 3704.9, 4: 505.9, 5: 477.4, 6: 523.4, 7: 2528.9 };
    const pt = (o) => ({ arista: o.arista, seg: o.seg, t: o.t, q: o.q, d: o.d });
    const mts = (a, b) => { const r = Gr.rutaEntre(g, pt(a), pt(b)); return r.encontrada ? r.metros : null; };
    // el enganchado que corresponde a un portal crudo del índice
    const engDe = (o) => ctx.enganche.portales.find((e) => e.id === o.id) || null;

    log('');
    log('   ' + 'ruta'.padStart(5) + '  ' + 'extremo'.padEnd(36) + 'estado'.padEnd(19) + 'da'.padStart(7) + '   qué pasa');
    const est = new Map();
    for (const r of t.rutas) {
      const fila = { n: r.n, ext: [] };
      for (const [et, txt] of [['O', r.o], ['D', r.d]]) {
        if (POI[txt]) { log('   ' + String(r.n).padStart(5) + '  ' + (et + ' ' + txt).padEnd(36) + 'POI (edificio) — sin portal ni paridad'); fila.ext.push({ et, poi: true }); continue; }
        const res = D.resolver(txt, ctx.indice);
        const sug = (res.sugerencias || []).map((s) => 'nº' + s.n).join(' / ');
        log('   ' + String(r.n).padStart(5) + '  ' + (et + ' ' + txt).padEnd(36) + String(res.estado).padEnd(19)
          + (res.portal ? 'nº' + res.portal.n : '—').padStart(7) + '   '
          + (res.estado === 'exacto' ? 'intacta'
            : res.estado === 'sin-numero-cerca' ? '⛔ PASA A SUGERENCIA: ' + sug
              : '⭐ ' + res.paridad + ' → ' + res.aviso));
        fila.ext.push({ et, res, txt });
      }
      est.set(r.n, fila);
    }

    log('');
    log('   ⭐⭐ LOS METROS — ⛔ solo se calcula; `RUTAS-CONOCIDAS.md` no se toca');
    log('   ' + 'ruta'.padStart(5) + 'tanda 16'.padStart(12) + 'ahora'.padStart(12) + '   qué ha pasado');
    let movidas = 0, sinResolver = 0;
    for (const r of t.rutas) {
      const fila = est.get(r.n);
      const pub = PUBLICADO[r.n];
      const exts = fila.ext.filter((x) => !x.poi);
      const rotos = exts.filter((x) => x.res.estado === 'sin-numero-cerca');
      if (rotos.length) {
        sinResolver++;
        // ⭐ y cuánto mediría SI se aceptaran las sugerencias (que es lo que hará
        //   el usuario al pulsar el botón). ⛔ Solo se calcula.
        const puntos = [];
        let ok = true;
        for (const [i, txt] of [[0, r.o], [1, r.d]]) {
          if (POI[txt]) { ok = false; break; }
          const res = D.resolver(txt, ctx.indice);
          const p = res.portal || ((res.sugerencias || [])[0] || {}).portal;
          const e = p ? engDe(p) : null;
          if (!e) { ok = false; break; }
          puntos.push({ e, n: p.n });
        }
        const m = ok ? mts(puntos[0].e, puntos[1].e) : null;
        log('   ' + String(r.n).padStart(5) + pub.toFixed(1).padStart(12) + '⛔ SUGERENCIA'.padStart(14)
          + '   ' + rotos.map((x) => x.et).join('+') + ' sin respuesta'
          + (m != null ? `  ·  aceptando la 1ª sugerencia (nº${puntos[0].n} → nº${puntos[1].n}): ${m.toFixed(1)} m  (${(m - pub).toFixed(1)} m, ${(100 * (m - pub) / pub).toFixed(1)} %)` : ''));
        continue;
      }
      // se resuelve: se mide
      const pa = fila.ext[0].poi ? null : D.resolver(r.o, ctx.indice).portal;
      const pb = fila.ext[1].poi ? null : D.resolver(r.d, ctx.indice).portal;
      if (!pa || !pb) {
        log('   ' + String(r.n).padStart(5) + pub.toFixed(1).padStart(12) + '(POI)'.padStart(12)
          + '   un extremo es un edificio: la mide `rutas-antonio.js`, no esto');
        continue;
      }
      const m = mts(engDe(pa), engDe(pb));
      const mov = Math.abs(m - pub) > 0.05;
      if (mov) movidas++;
      log('   ' + String(r.n).padStart(5) + pub.toFixed(1).padStart(12) + m.toFixed(1).padStart(12)
        + '   ' + (mov ? `⭐ SE MUEVE ${(m - pub).toFixed(1)} m  (${fila.ext.map((x) => x.et + ':nº' + x.res.portal.n).join(' → ')})` : '✅ idéntica'));
      // ⛔⛔ LA COSTURA: la ruta 7 calibra los ~6 km/h. Si se mueve, hay que parar.
      if (r.n === 7) {
        A.exige(!mov, `la RUTA 7 se ha movido (${pub} → ${m.toFixed(1)}): calibra los ~6 km/h de toda la tabla. PARAR.`);
      }
      // ⛔ y ninguna ruta puede moverse si sus dos extremos son EXACTOS
      const todosExactos = exts.every((x) => x.res.estado === 'exacto');
      A.exige(!(todosExactos && mov),
        `la ruta nº${r.n} se mueve y sus dos extremos son EXACTOS: el cambio se ha salido del buscador`);
    }
    log('');
    di('rutas que pasan a SUGERENCIA', sinResolver);
    di('rutas que se mueven pero se resuelven', movidas);
    log('   ⇒ ⭐⭐ La ruta 7 tiene sus dos extremos EXACTOS —`El Coloso 2` y `Valle de Zuriza 48`—');
    log('     y no se mueve. **La calibración de los ~6 km/h no está en cuestión.**');
  } else {
    log('');
    log('   ⚠️ §C4 (las siete rutas) NO se ha corrido: hace falta `--rutas` porque construye');
    log('     el grafo. **Esto no es un verde: es una sección no ejecutada.**');
  }

  log('');
  log(A.cierre('LA PARIDAD'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
