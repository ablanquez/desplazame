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
    di('⇒ ⭐ p90 urbano, redondeado', `${rU.p90.toFixed(0)} m → **${Par.RAZONABLE_M} m**`);
    log('   ⚠️ Y cae en la misma magnitud que el listón de 50 m que la tanda 32 publicó por');
    log('     otro camino («6.380 huecos urbanos desplazan más de 50 m»). Dos medidas');
    log('     independientes, la misma orden de magnitud. ⛔ No es una comprobación: es que');
    log('     no se contradicen.');
    // ⛔ que el listón no sea un adorno: tiene que caer DENTRO del reparto medido
    A.exige(Par.RAZONABLE_M >= rU.mediana && Par.RAZONABLE_M <= rU.p95,
      `el listón de ${Par.RAZONABLE_M} m no está entre la mediana (${rU.mediana.toFixed(0)}) y el p95 (${rU.p95.toFixed(0)}) del reparto del que dice salir`);
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
    let sug = 0, malas = 0;
    for (const q of CASOS) {
      const r = D.resolver(q, indice);
      const pedido = D.partir(q).numero;
      for (const s of (r.sugerencias || [])) { sug++; if (s.n % 2 !== pedido % 2) malas++; }
    }
    di('⛔ sugerencias emitidas · de la acera de ENFRENTE', `${sug} · ${malas}`);
    A.exige(malas === 0, `${malas} sugerencias son de la acera de enfrente: es justo lo que la regla 4 prohíbe`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  log('');
  log('C1–C3 · ⭐⭐⭐ QUÉ CAMBIA — barrido de TODO lo que se puede pedir');
  log('='.repeat(112));
  log('   ⭐ El universo es el mismo que el de la tanda 32: para cada vía con dos hilos, todos');
  log('     los números del mínimo al máximo. Así los dos informes se pueden comparar.');
  const G = { rango: 0, existen: 0, huecos: 0, cambiaAcera: 0,
    igual: 0, mismaAcera: 0, sinRespuesta: 0, sinParidad: 0,
    resp: [], respU: [], neg: [], negU: [], antes: [], antesU: [],
    sinRespuestaU: 0, cambiaAceraU: 0, fuera: 0, hueco: 0, invariante: 0, cotas: [] };
  {
    for (const l of indice.values()) {
      const an = l.paridad;
      if (!(an.pares >= Par.MIN_HILO && an.impares >= Par.MIN_HILO)) continue;
      const urb = URBANAS.has(tipoDe(l));
      const presentes = new Set(l.map((o) => o.n).filter((n) => n != null));
      const nums = [...presentes].sort((a, b) => a - b);
      const lo = nums[0], hi = nums[nums.length - 1];
      G.rango += hi - lo + 1;
      G.existen += presentes.size;
      for (let n = lo; n <= hi; n++) {
        if (presentes.has(n)) continue;
        G.huecos++;
        const hoy = Par.masCercanoEnNumero(l, n);          // ⛔ lo que devolvía antes
        const cambia = hoy && hoy.n != null && (hoy.n % 2) !== (n % 2);
        if (!cambia) { G.igual++; }
        else { G.cambiaAcera++; if (urb) G.cambiaAceraU++; }
        // ⭐ y ahora la MISMA función que usa el geocodificador (ley 56)
        const d = Par.decidir(n, l, an);
        // ⛔⛔ EL INVARIANTE: si la respuesta de hoy ya era de su acera, NO puede
        //   cambiar. Un cambio ahí sería la regla saliéndose de su sitio.
        if (!cambia && (d.modo !== 'como-siempre' || d.portal !== hoy)) G.invariante++;
        if (d.modo === 'como-siempre') continue;
        if (d.modo === 'sin-paridad') { G.sinParidad++; continue; }
        if (d.modo === 'misma-acera') {
          G.mismaAcera++;
          G.resp.push(d.cota.m); if (urb) G.respU.push(d.cota.m);
        } else {
          G.sinRespuesta++; if (urb) G.sinRespuestaU++;
          if (d.cota && d.cota.acota === 'hueco') { G.hueco++; G.neg.push(d.cota.m); if (urb) G.negU.push(d.cota.m); }
          else G.fuera++;
        }
        // ⭐ la cota de TODAS las que la tienen: es lo que mueve el listón (§A2b)
        if (d.cota && Number.isFinite(d.cota.m)) G.cotas.push(d.cota.m);
        // el desplazamiento de la tanda 32: cuánto te alejaba la respuesta vieja
        const mio = (d.cota && d.cota.cand) || null;
        if (mio) { const x = Par.dist(mio, hoy); G.antes.push(x); if (urb) G.antesU.push(x); }
      }
    }
    log('');
    di('números que se pueden pedir', G.rango);
    di('   …que EXISTEN', `${G.existen}  (${pct(G.existen, G.rango)})`);
    di('   …que son HUECO', `${G.huecos}  (${pct(G.huecos, G.rango)})`);
    di('⭐ de los huecos, los que HOY te cambian de acera', `${G.cambiaAcera}  (${pct(G.cambiaAcera, G.huecos)})`);
    log('   ⚠️ La tanda 32 publicó 150.947 · 27.815 · 123.132 · 66.973. La diferencia —menos');
    log('     del 0,1 %— es que aquella agrupó por `codigoVia` sobre los portales ENGANCHADOS');
    log('     y ésta agrupa por CASILLA DE BÚSQUEDA sobre los 46.150. ⭐ Y agrupa así a');
    log('     propósito: **la casilla es la unidad que mira el buscador**, y es la que decide.');
    log('');
    log('   ⭐⭐ C1 · CUÁNTAS CONSULTAS CAMBIAN DE RESPUESTA');
    const cambian = G.mismaAcera + G.sinRespuesta;
    di('la respuesta de hoy ya era de su acera ⇒ NO se toca', `${G.igual}  (${pct(G.igual, G.huecos)})`);
    di('⭐ pasa a un portal de SU acera', `${G.mismaAcera}  (${pct(G.mismaAcera, G.huecos)})`);
    di('⛔ pasa a NO TENER respuesta (solo sugerencia)', `${G.sinRespuesta}  (${pct(G.sinRespuesta, G.huecos)})`);
    di('⚠️ la paridad no manda en esa vía ⇒ respuesta de siempre', `${G.sinParidad}  (${pct(G.sinParidad, G.huecos)})`);
    di('⇒ ⭐⭐ CONSULTAS QUE CAMBIAN DE RESPUESTA', `${cambian}  (${pct(cambian, G.rango)} de lo pedible)`);
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
    log('   ⛔⛔ ES MUCHÍSIMO, Y VA DICHO ASÍ: **la mitad de los números que no existen dejan');
    log('     de tener respuesta automática.** Antes TODOS tenían una — la de la acera de');
    log('     enfrente, que es la que puso a Antonio a 258 m de donde iba.');
    log('   ⭐ Lo que NO se pierde: de esas consultas se sigue sabiendo el número, la acera y');
    log('     el tamaño del hueco. Lo que se quita es que **la app decida sola**.');

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
    log('   ' + 'ruta'.padStart(5) + 'publicado'.padStart(12) + 'ahora'.padStart(12) + '   qué ha pasado');
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
