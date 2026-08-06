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
const CENTINELA = 9999;
const esCentinela = (n) => n != null && n >= CENTINELA;
/** ¿La casilla tiene algún portal con número centinela? */
const conCentinela = (l) => l.some((o) => esCentinela(o.n));

/** Mediana, p90 y máximo. Misma forma que en la tanda 32. */
function reparto(v) {
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, p25: q(0.25), mediana: q(0.5), p75: q(0.75), p90: q(0.9), p95: q(0.95), max: s[s.length - 1] };
}

module.exports = { reparto, URBANAS };

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
    di('⇒ ⭐ p90 urbano', `${rU.p90.toFixed(0)} m   —— era de aquí de donde salían los 50 de la tanda 33`);
    di('⭐⭐ TANDA 34 · el listón aplicado', `**${Par.RAZONABLE_M} m** — decisión de Antonio, no un percentil`);
    log('   ⚠️⚠️ Y ESTE GUARDIÁN SALTÓ AL SUBIRLO, que es lo que tenía que hacer. Exigía que');
    log('     el listón cayera entre la mediana y el p95 del reparto de arriba —de donde');
    log('     salía—, y 100 > 91. **El rojo era cierto: los 100 ya no salen de ahí.**');
    log('   ⇒ ⭐ Se reescribe con la procedencia NUEVA. Los 100 salen del DIAL que la tanda 33');
    log('     publicó midiendo el coste de cada listón, y Antonio eligió sobre ese dato. ⇒ lo');
    log('     que se puede exigir es que **el dial acertara**: aquel informe predijo 31.411');
    log('     consultas contestadas con el listón a 100, y se comprueba abajo, en §C1.');
    log('   ⛔ Lo que NO se disimula: 100 m está por encima del p90 de la separación entre');
    log('     portales seguidos (' + rU.p90.toFixed(0) + ' m). La respuesta ya no es «el de al lado»: es «el de la');
    log('     manzana». Ése es el precio, y lo que compra está contado en §A4.');
    A.exige(Par.RAZONABLE_M >= rU.p75,
      `el listón de ${Par.RAZONABLE_M} m está por debajo del p75 (${rU.p75.toFixed(0)} m) de la separación entre portales seguidos: sería más estricto que el propio dato`);
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
    // ⛔⛔ LA COMPROBACIÓN QUE HACE QUE ESTO VALGA: ninguna sugerencia puede ser de
    //   la acera de enfrente. Es la regla 4 de Antonio, y es la que evita repetir
    //   el fallo con otro nombre.
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
  const nuevo = () => ({ rango: 0, existen: 0, huecos: 0, cambiaAcera: 0,
    igual: 0, mismaAcera: 0, sinRespuesta: 0, sinParidad: 0,
    resp: [], respU: [], neg: [], negU: [], antes: [], antesU: [],
    sinRespuestaU: 0, cambiaAceraU: 0, fuera: 0, hueco: 0, invariante: 0, cotas: [],
    // ── TANDA 34 · lo que recupera cada listón, por separado ─────────────────
    gana50a100: 0, conEnfrente: 0, conEnfrenteHueco: 0, conEnfrenteFuera: 0,
    mudas: 0, mudasAntes: 0, dEnfrente: [], enfrenteEsUnica: 0 });
  // ⭐⭐ DOS UNIVERSOS A LA VEZ: `G` es el de las tandas 32 y 33 —centinela dentro,
  //   para que el cuadre entre informes siga valiendo— y `GL` es el LIMPIO, sin las
  //   vías que llegan al 99999. ⛔ Si solo se publicara el limpio, no habría forma
  //   de saber si los números de ayer eran otra medida o un error de hoy.
  const G = nuevo(), GL = nuevo();
  let viasSucias = 0;
  {
    for (const l of indice.values()) {
      const an = l.paridad;
      if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
      const urb = URBANAS.has(tipoDe(l));
      const sucia = conCentinela(l);
      if (sucia) viasSucias++;
      const B = sucia ? [G] : [G, GL];
      const inc = (k, v = 1) => { for (const b of B) b[k] += v; };
      const mete = (k, v) => { for (const b of B) b[k].push(v); };
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
          // ⭐ A4 · las que el listón de 100 le quita al de 50 de la tanda 33
          if (d.cota.m > 50) inc('gana50a100');
        } else {
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
    log('');
    log('   ⛔⛔ EL CENTINELA — lo primero, porque cambia el denominador de tres tandas');
    di('vías con algún portal en el centinela 99999 («BL0», «BL1»…)', viasSucias);
    di('⛔ números «pedibles» que aporta ese centinela', `${G.rango - GL.rango}  (${pct(G.rango - GL.rango, G.rango)} de lo pedible)`);
    log('     Son bloques SIN número de portal, y el callejero los marca con 99999. Las');
    log('     tandas 32, 33 y 34 los han contado como si fueran un portal más, así que el');
    log('     universo de una vía iba de 1 a 99999. ⚠️ Ningún CASO medido era falso; lo que');
    log('     estaba mal es **todo porcentaje cuyo denominador fuera «lo pedible»**.');
    log('');
    log('   ' + 'universo'.padEnd(34) + 'pedibles'.padStart(11) + 'existen'.padStart(10)
      + 'huecos'.padStart(10) + 'cambian de acera'.padStart(19));
    for (const [et, X] of [['el de las tandas 32 y 33', G], ['⭐ LIMPIO, sin el centinela', GL]]) {
      log('   ' + et.padEnd(34) + String(X.rango).padStart(11) + String(X.existen).padStart(10)
        + String(X.huecos).padStart(10) + `${X.cambiaAcera}  ${pct(X.cambiaAcera, X.huecos)}`.padStart(19));
    }
    log('   ⚠️ La tanda 32 publicó 150.947 · 27.815 · 123.132 · 66.973 — la fila de arriba, con');
    log('     menos del 0,1 % de diferencia (agrupó por `codigoVia` sobre los enganchados y');
    log('     esto agrupa por CASILLA DE BÚSQUEDA sobre los 46.150). ⭐ El cuadre entre tandas');
    log('     seguía saliendo perfecto **sobre el mismo artefacto**: dos medidas de acuerdo no');
    log('     son dos medidas correctas.');
    A.exige(G.rango > GL.rango, 'el universo limpio y el sucio son iguales: o el centinela ya no está, o el filtro no filtra');
    A.exige(GL.rango > 0, 'el universo limpio ha salido vacío: el filtro se lo ha comido todo');
    log('');
    log('   ⭐⭐ C1 · CUÁNTAS CONSULTAS CAMBIAN DE RESPUESTA');
    const cambian = G.mismaAcera + G.sinRespuesta;
    log('   ' + ''.padEnd(50) + 'con centinela'.padStart(20) + '⭐ LIMPIO'.padStart(20));
    const dosFilas = (et, k) => log('   ' + et.padEnd(50)
      + `${G[k]}  ${pct(G[k], G.huecos)}`.padStart(20) + `${GL[k]}  ${pct(GL[k], GL.huecos)}`.padStart(20));
    dosFilas('la respuesta de hoy ya era de su acera ⇒ NO se toca', 'igual');
    dosFilas('⭐ pasa a un portal de SU acera', 'mismaAcera');
    dosFilas('⛔ pasa a NO TENER respuesta (solo sugerencia)', 'sinRespuesta');
    dosFilas('⚠️ la paridad no manda ⇒ respuesta de siempre', 'sinParidad');
    log('   ' + '⇒ ⭐⭐ CONSULTAS QUE CAMBIAN DE RESPUESTA'.padEnd(51)
      + `${cambian}  ${pct(cambian, G.rango)}`.padStart(20)
      + `${GL.mismaAcera + GL.sinRespuesta}  ${pct(GL.mismaAcera + GL.sinRespuesta, GL.rango)}`.padStart(20));
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
    log('   ⭐⭐ EL CUADRE: la fila de arriba tiene que reproducir la tanda 32 —mediana 126 m');
    log('     todas, 51 m urbanas—. Si no lo hiciera, este barrido estaría midiendo otra cosa.');
    A.exige(rA && Math.abs(rA.mediana - 126) < 6 && rAU && Math.abs(rAU.mediana - 51) < 6,
      `el «antes» da ${rA ? rA.mediana.toFixed(0) : '—'} / ${rAU ? rAU.mediana.toFixed(0) : '—'} y la tanda 32 publicó 126 / 51: este barrido no mide lo mismo`);
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
    log('   ⭐ (1) SU ACERA, de 50 a 100 m — devuelve RESPUESTA automática');
    di('   consultas contestadas ahora', G.mismaAcera);
    di('   …de ellas, las que el listón de 50 rechazaba', `${G.gana50a100}   ⭐ eso es lo que recupera`);
    di('   ⭐⭐ ¿lo predijo el dial de la tanda 33? (decía 31.411 a 100 m)',
      G.mismaAcera === 31411 ? '✅ 31.411 clavadas' : `⛔ NO — salen ${G.mismaAcera}`);
    // ⭐⭐ ESTE ES EL CUADRE QUE SOSTIENE LA DECISIÓN: Antonio eligió 100 mirando un
    //   dial. Si el dial no acertara, la decisión se tomó sobre un número falso.
    A.exige(G.mismaAcera === 31411,
      `el dial de la tanda 33 predijo 31.411 contestadas con el listón a 100 m y salen ${G.mismaAcera}: `
      + 'la decisión de subirlo se tomó mirando un número que no era. Si el callejero ha cambiado, se republica el dial');
    log('');
    log('   ⭐ (2) ENFRENTE, hasta ' + Par.ENFRENTE_M + ' m — NO devuelve respuesta: devuelve una OPCIÓN marcada');
    log('   ⛔ Y AQUÍ EL CENTINELA SE NOTABA MÁS QUE EN NINGÚN SITIO: sin limpiarlo, **una');
    log('     sola vía —el Grupo M. Andrea Casamayor— aportaba 25.012 de las sugerencias**, y');
    log('     el reparto de distancias salía «mediana 126 · p75 126 · p90 126». ⭐ Lo cazó lo');
    log('     redondo del número, no una comprobación.');
    log('   ' + ''.padEnd(58) + 'con centinela'.padStart(16) + '⭐ LIMPIO'.padStart(16));
    const dos = (et, k, den) => log('   ' + et.padEnd(58)
      + `${G[k]}  ${den ? pct(G[k], G[den]) : ''}`.padStart(16)
      + `${GL[k]}  ${den ? pct(GL[k], GL[den]) : ''}`.padStart(16));
    dos('   sin respuesta que ganan alguna sugerencia de enfrente', 'conEnfrente', 'sinRespuesta');
    dos('      …con hueco propio medible', 'conEnfrenteHueco');
    dos('      …fuera del tramo de su acera', 'conEnfrenteFuera');
    dos('   ⭐⭐ …y en cuántas es la ÚNICA alternativa', 'enfrenteEsUnica');
    log('');
    log('   ' + 'distancia al portal de enfrente ofrecido'.padEnd(50)
      + 'n'.padStart(9) + 'med'.padStart(8) + 'p75'.padStart(8) + 'p90'.padStart(8) + 'máx'.padStart(9));
    for (const [et, X] of [['   con el centinela dentro', G], ['   ⭐ LIMPIO', GL]]) {
      const r = reparto(X.dEnfrente);
      if (r) log('   ' + et.padEnd(50) + String(r.n).padStart(9) + r.mediana.toFixed(0).padStart(8)
        + r.p75.toFixed(0).padStart(8) + r.p90.toFixed(0).padStart(8) + r.max.toFixed(0).padStart(9));
    }
    log('');
    di('⚠️ consultas que se quedan MUDAS (sin respuesta y sin ninguna sugerencia)', `${G.mudas} · limpio ${GL.mudas}`);
    di('   …y las que se quedarían sin el listón de enfrente', `${G.mudasAntes} · limpio ${GL.mudasAntes}`);
    log('   ⭐ Lo que NO se pierde en las demás: se sigue sabiendo el número, la acera, el');
    log('     tamaño del hueco y —si la hay— la de enfrente CON SU MARCA. Lo que se quita es');
    log('     que **la app decida sola**.');

    // ── A2b · ⭐⭐ LA SENSIBILIDAD DEL LISTÓN — el dial, sin elegirlo yo ────────
    log('');
    log('   ⭐⭐ A2b · SI EL LISTÓN FUERA OTRO — el dial, para que se pueda mover con datos');
    log('   ' + 'listón'.padStart(9) + 'contestadas'.padStart(14) + 'sin respuesta'.padStart(15)
      + '   error máximo que se acepta');
    for (const u of [25, 50, 100, 200, 400]) {
      const si = G.cotas.filter((x) => x <= u).length;
      const no = G.mismaAcera + G.hueco - si;
      log('   ' + (u + ' m').padStart(9) + String(si).padStart(14) + String(no + G.fuera).padStart(15)
        + '   ' + (u === Par.RAZONABLE_M ? '⭐ el aplicado' : ''));
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
