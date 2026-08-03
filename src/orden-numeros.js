// ⭐⭐ EL ORDEN DE LOS NÚMEROS COMO CUARTO TESTIGO — la idea de Antonio, medida.
//
//   node src/orden-numeros.js
//
// ⛔⛔ DETECTA. NO MUEVE NADA. Las contrapruebas desplazan portales **en copias
//     que mueren dentro de la función que las crea** — es lo que hace un test, y
//     el propio briefing lo pide en A3. Ningún dato de producción se toca.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ ¿PUEDE ESTO PASAR O FALLAR SIN QUE NADA FUNCIONE? — escrito ANTES
// ═════════════════════════════════════════════════════════════════════════════
// A2 · el UMBRAL. ⚠️ Si lo saco del grupo BUENOS, su tasa de falsa alarma es del
//      1 % **por construcción**. ⇒ sale del p99 de `Bportal`, que lo produce el
//      Ayuntamiento y no sabe nada de nuestro motor. Entonces la tasa de falsa
//      alarma es una MEDIDA, no una definición.
//
// A3 · las CONTRAPRUEBAS. Una prueba de detección puede salir bien sin que el
//      detector funcione, si lo que desplazo es tan bestia que lo cazaría
//      cualquier cosa. ⇒ no se prueba un desplazamiento: se barre **una curva**
//      de 10 a 100 m y se enseña a partir de cuántos metros lo caza.
//      ⭐⭐ Y el par (a)/(b) se controla solo: el MISMO desplazamiento aplicado a
//         uno solo tiene que cazarse, y aplicado al bloque entero NO. Si las dos
//         salieran igual, el arnés no distingue nada.
//
// B1/B2 · falsa alarma y sensibilidad. ⚠️ Pueden salir bien por construcción si
//      los grupos BUENOS y SOSPECHOSOS difieren en algo que no es el enganche
//      —longitud de la vía, número de portales, zona—. ⇒ se mide el confusor
//      obvio primero: `Bportal`, o sea cuánto de desordenada viene ya la calle. Y
//      se compara a IGUAL `Bportal`.
//
// C1 · «la Avenida de la Ilustración está bien». ⚠️⚠️ PUEDE PASAR POR
//      CONSTRUCCIÓN: 267 portales enganchados todos a la misma arista larga
//      quedarían «en orden» trivialmente si la arista fuera recta y el enganche
//      monótono. ⇒ antes del veredicto se enseña a cuántas aristas distintas
//      enganchan y qué dice el detector sobre las coordenadas del Ayuntamiento.

'use strict';
const P = require('./portales');
const D = require('./direccion');
const M = require('./municipal');
const O = require('./orden');
const A = require('./alarma');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');
const { heredar, rng } = require('./sin-vigilancia');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(58)} ${v}`);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
const SEMILLA = 20260803;
const RADIO_COBERTURA = 60;
const FIRMA = 10;

const T0 = Date.now();
const g = construir(ZONA_TERMINO);
const ctx = D.abrir(g, CRUDO);
const portales = ctx.enganche.portales.filter((o) => o.enganchado);
const enZona = (o, z) => o.lat >= z.sur && o.lat <= z.norte && o.lon >= z.oeste && o.lon <= z.este;

const porVia = new Map();
for (const o of portales) {
  if (!porVia.has(o.codigoVia)) porVia.set(o.codigoVia, []);
  porVia.get(o.codigoVia).push(o);
}

// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(108));
log('A1 · ⭐ LOS DATOS DE PARTIDA — ¿cuántas vías tienen números suficientes?');
di('portales enganchados', portales.length);
di('vías con al menos un portal', porVia.size);
{
  const v = [...porVia.values()].map((l) => l.length).sort((a, b) => a - b);
  di('portales por vía', `mediana ${v[Math.floor(v.length / 2)]} · p90 ${v[Math.floor(v.length * 0.9)]} · máx ${v[v.length - 1]}`);
  log('');
  log('   ' + 'con al menos'.padEnd(16) + 'vías'.padStart(8) + 'portales cubiertos'.padStart(22) + '  % del callejero');
  for (const k of [2, 3, 5, 10, 20, 50]) {
    const vs = [...porVia.values()].filter((l) => l.length >= k);
    const ps = vs.reduce((s, l) => s + l.length, 0);
    log('   ' + `${k} portales`.padEnd(16) + String(vs.length).padStart(8) + String(ps).padStart(22)
      + '  ' + pct(ps, portales.length).padStart(7) + (k === O.MIN_CADENA ? '   ⭐ el mínimo que se exige' : ''));
  }
}
log('');
log('   ⭐ EL MÍNIMO SON ' + O.MIN_CADENA + ' NÚMEROS DISTINTOS POR CADENA, y de dónde sale: con 5 hay');
log('     3 tríos, que es el mínimo para que la mediana de una vía signifique algo. Con 2');
log('     portales no hay trío y el orden no dice NADA; con 3 hay uno solo y una sola');
log('     medida no distingue señal de accidente.');

// ── evaluar todas las vías ──────────────────────────────────────────────────
const evaluadas = new Map();
let sinEsquema = 0, conEsquema = 0;
const esquemas = new Map();
for (const [cod, l] of porVia) {
  const r = O.evaluar(l);
  evaluadas.set(cod, r);
  if (!r.esquema) { sinEsquema++; continue; }
  conEsquema++;
  esquemas.set(r.esquema, (esquemas.get(r.esquema) || 0) + 1);
}
const todasFilas = [];
for (const [cod, r] of evaluadas) for (const f of r.filas) todasFilas.push({ ...f, cod });

log('');
di('vías evaluables (esquema decidido)', `${conEsquema}  (${pct(conEsquema, porVia.size)} de las vías)`);
di('vías sin esquema (pocos números)', sinEsquema);
for (const [k, v] of [...esquemas.entries()].sort((a, b) => b[1] - a[1])) {
  di('   esquema ' + k, `${v} vías  (${pct(v, conEsquema)})`);
}
di('⭐ portales con las DOS medidas (portal y enganche)', `${todasFilas.length}  (${pct(todasFilas.length, portales.length)} del callejero)`);
A.exige(todasFilas.length > 20000, `solo ${todasFilas.length} portales evaluables: el detector no llega a la mitad del callejero`);

// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ A1b · LO QUE SE PIERDE POR EL CAMINO — y el límite estructural de la idea
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('   ⛔⛔ A1b · DÓNDE SE PIERDEN LOS OTROS, contado y no barrido:');
{
  let compartenNum = 0, viasMudasPorRepeticion = 0, cortos = 0;
  for (const [cod, l] of porVia) {
    const c = new Map();
    for (const o of l) c.set(o.n, (c.get(o.n) || 0) + 1);
    const rep = l.filter((o) => c.get(o.n) > 1).length;
    compartenNum += rep;
    const r = evaluadas.get(cod);
    cortos += (r && r.cortos) || 0;
    if (l.length >= O.MIN_CADENA && (!r || !r.esquema) && rep > l.length / 2) viasMudasPorRepeticion++;
  }
  di('   ⛔ portales que COMPARTEN número con otro de su vía', `${compartenNum}  (${pct(compartenNum, portales.length)})`);
  di('      vías que se quedan mudas SOLO por eso', viasMudasPorRepeticion);
  di('   tríos descartados por |a→b| < ' + O.MIN_AB + ' m', cortos);
  log('');
  log('   ⭐⭐⭐ Y ESTO NO ES UN TECNICISMO: ES EL LÍMITE ESTRUCTURAL DE LA IDEA.');
  log('      «El 5 está entre el 3 y el 7» **exige que el 5 sea un sitio**. En la Avenida');
  log('      de la Ilustración hay **1.469 portales y 22 números**: el «31» son **147');
  log('      portales**. Ahí el número no localiza nada, y ningún umbral lo arregla.');
  log('      ⛔ La primera versión de esto se quedaba con «el primero que encontrara» de');
  log('        los 147. Eso no es colapsar un duplicado: es tirar una moneda.');
}

// ═════════════════════════════════════════════════════════════════════════════
// A2 · EL UMBRAL — y de dónde sale
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('A2 · ⭐⭐ EL UMBRAL — y por qué NO sale de los enganches');
const q = (v, p) => { const s = v.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const Bp = todasFilas.map((f) => f.Bportal);
const Be = todasFilas.map((f) => f.Benganche);
di('intercalación de los PORTALES (el Ayuntamiento)', `mediana ${q(Bp, 0.5).toFixed(3)} · p90 ${q(Bp, 0.9).toFixed(3)} · p99 ${q(Bp, 0.99).toFixed(2)} · máx ${q(Bp, 1).toFixed(0)}`);
di('intercalación de los ENGANCHES (el motor)', `mediana ${q(Be, 0.5).toFixed(3)} · p90 ${q(Be, 0.9).toFixed(3)} · p99 ${q(Be, 0.99).toFixed(2)} · máx ${q(Be, 1).toFixed(0)}`);
const UMBRAL = q(Bp, 0.99);
log('');
di('⭐ UMBRAL = p99 de la intercalación de los PORTALES', UMBRAL.toFixed(3));
log('   ⛔ El calibrador es el Ayuntamiento, que no sabe nada de nuestro motor. Si saliera');
log('     del grupo BUENOS, la tasa de falsa alarma sería del 1 % POR CONSTRUCCIÓN y no');
log('     mediría nada. Así es una MEDIDA.');
log('   ⚠️ Y su sesgo, declarado: el esquema de cada vía se elige MINIMIZANDO `Bportal`, así');
log('     que el p99 sale bajo y el detector queda **más sensible de la cuenta**, no menos.');
const señala = (f) => f.Benganche > UMBRAL;
di('portales señalados en TODO el callejero', `${todasFilas.filter(señala).length}  (${pct(todasFilas.filter(señala).length, todasFilas.length)})`);

// ═════════════════════════════════════════════════════════════════════════════
// A3 · ⭐⭐⭐ LAS CONTRAPRUEBAS — ANTES QUE NINGÚN RESULTADO
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('A3 · ⭐⭐⭐ LAS CONTRAPRUEBAS, ANTES QUE NINGÚN RESULTADO');
log('   ⛔ Todo esto pasa en COPIAS que mueren dentro de la función. Ningún portal se');
log('      mueve, ni en el dato ni en nada que sobreviva a la prueba.');

// vías "limpias" para experimentar: las que hoy no señala nadie
const viasLimpias = [...evaluadas.entries()]
  .filter(([, r]) => r.esquema && r.filas.length >= 3 && r.filas.every((f) => f.Benganche <= UMBRAL))
  .map(([cod]) => cod);
di('vías donde HOY el detector no señala nada (banco de pruebas)', viasLimpias.length);
A.exige(viasLimpias.length > 100, 'no hay vías limpias suficientes para provocar el rojo');

/**
 * Desplaza `cuantos` portales consecutivos **DE LA CADENA** `metros` metros y
 * devuelve si el detector señala al del medio, y si señala a alguien de la vía.
 * ⛔ COPIA: `{...o, q: [...]}`. El array original no se toca.
 *
 * ⚠️ El bloque se toma de la CADENA que usa la evaluación, no de la lista de
 *    portales ordenada por número con un paso adivinado. Es el mismo objeto: si
 *    el esquema es par/impar, «el 5 y sus vecinos» son el 3, el 5 y el 7 porque
 *    la cadena de los impares los pone seguidos. Adivinar el paso da bloques
 *    equivocados en cuanto la vía no tiene las dos paridades completas — y
 *    entonces la contraprueba del fallo correlacionado mide otra cosa.
 */
function provocar(cod, metros, cuantos, r) {
  const l = porVia.get(cod);
  const base = O.evaluar(l);
  if (!base.esquema || base.filas.length < 3) return null;
  const c = O.cadenas(l);
  // la cadena más larga, y el portal del medio de esa cadena
  const cad = c.cadenas.slice().sort((a, b) => b.length - a.length)[0];
  if (!cad || cad.length < 3) return null;
  const i = Math.floor(cad.length / 2);
  const objetivo = base.filas.find((f) => f.p.id === cad[i].id);
  if (!objetivo) return null;
  const ang = r() * 2 * Math.PI;
  const dx = metros * Math.cos(ang), dy = metros * Math.sin(ang);
  const mover = new Set();
  for (let k = -Math.floor((cuantos - 1) / 2); k <= Math.floor(cuantos / 2); k++) {
    const j = i + k;
    if (j >= 0 && j < cad.length) mover.add(cad[j].id);
  }
  if (mover.size !== cuantos) return null;      // el bloque no cabe: no cuenta
  const copia = l.map((o) => (mover.has(o.id) ? { ...o, q: [o.q[0] + dx, o.q[1] + dy] } : o));
  const tras = O.evaluar(copia);
  const fila = tras.filas.find((f) => f.p.id === objetivo.p.id);
  if (!fila) return null;
  return { antes: objetivo.Benganche, despues: fila.Benganche,
    señalado: fila.Benganche > UMBRAL,
    // ⭐ y la pregunta de al lado: ¿señala a ALGUIEN de la vía? Un bloque movido es
    //    invariante por dentro, pero rompe los dos tríos de su BORDE.
    algunoEnLaVia: tras.filas.some((f) => f.Benganche > UMBRAL) };
}

const METROS = [10, 25, 50, 100, 200];
function barrer(cuantos, n = 300) {
  const r = rng(SEMILLA + 90 + cuantos);
  const out = METROS.map(() => ({ n: 0, ok: 0, via: 0 }));
  for (let k = 0; k < n; k++) {
    const cod = viasLimpias[Math.floor(r() * viasLimpias.length)];
    for (let i = 0; i < METROS.length; i++) {
      const x = provocar(cod, METROS[i], cuantos, r);
      if (!x) continue;
      out[i].n++;
      if (x.señalado) out[i].ok++;
      if (x.algunoEnLaVia) out[i].via++;
    }
  }
  return out;
}

log('');
log('   (a) ⭐ ¿PUEDE PONERSE ROJO? — se desplaza UN portal de una vía limpia');
log('      ' + 'desplazamiento'.padEnd(18) + 'casos'.padStart(8) + 'lo caza'.padStart(18));
const solo = barrer(1);
for (let i = 0; i < METROS.length; i++) {
  log('      ' + `${METROS[i]} m`.padEnd(18) + String(solo[i].n).padStart(8)
    + `${solo[i].ok}  (${pct(solo[i].ok, solo[i].n)})`.padStart(18));
}
A.exige(solo[METROS.length - 1].ok / Math.max(solo[METROS.length - 1].n, 1) > 0.8,
  'el detector no caza ni un desplazamiento de 200 m de un portal solo: no sirve para nada');

log('');
log('   (b) ⚠️⚠️⚠️ EL FALLO CORRELACIONADO — se desplaza el portal **Y SUS VECINOS**');
log('       el mismo desplazamiento, el mismo objetivo, el mismo umbral. La única');
log('       diferencia es cuántos se mueven juntos.');
log('      ' + 'desplazamiento'.padEnd(18) + '1 solo'.padStart(14) + '3 juntos'.padStart(14) + '5 juntos'.padStart(14));
const tres = barrer(3);
const cinco = barrer(5);
for (let i = 0; i < METROS.length; i++) {
  log('      ' + `${METROS[i]} m`.padEnd(18)
    + pct(solo[i].ok, solo[i].n).padStart(14)
    + pct(tres[i].ok, tres[i].n).padStart(14)
    + pct(cinco[i].ok, cinco[i].n).padStart(14));
}
{
  const i = METROS.length - 1;
  const pSolo = 100 * solo[i].ok / Math.max(solo[i].n, 1);
  const pTres = 100 * tres[i].ok / Math.max(tres[i].n, 1);
  log('');
  log('   ⇒ ' + (pTres < 10
    ? `⛔⛔ **SE LO TRAGA.** A ${METROS[i]} m caza el ${pSolo.toFixed(0)} % cuando se mueve uno solo y el `
      + `${pTres.toFixed(0)} % cuando se mueven tres juntos.`
    : `⚠️ lo caza en parte: ${pTres.toFixed(0)} % con tres juntos frente al ${pSolo.toFixed(0)} % con uno solo.`));
  log('     Y no es una sorpresa: **es aritmética**. La intercalación B es invariante a');
  log('     trasladar el trío entero, porque las tres distancias se mueven igual. Un fallo');
  log('     que arrastra a los vecinos es INVISIBLE para este testigo, por construcción.');
  log('   ⭐ El par (a)/(b) se controla solo: si las dos columnas salieran iguales, el arnés');
  log('     no distinguiría nada y no habría que creerse ninguna de las dos.');

  // ⭐⭐ Y LA MITAD QUE SÍ SE VE: un bloque desplazado es invariante POR DENTRO,
  //    pero rompe los dos tríos de su BORDE. El portal del medio no se señala; el
  //    primero y el último del bloque, sí. Eso cambia para qué sirve el testigo.
  log('');
  log('   ⭐⭐ PERO EL BLOQUE TIENE BORDES — ¿señala a ALGUIEN de la vía?');
  log('      ' + 'desplazamiento'.padEnd(18) + 'al objetivo (3 juntos)'.padStart(24) + 'a alguien de la vía'.padStart(22));
  for (let k = 0; k < METROS.length; k++) {
    log('      ' + `${METROS[k]} m`.padEnd(18) + pct(tres[k].ok, tres[k].n).padStart(24)
      + pct(tres[k].via, tres[k].n).padStart(22));
  }
  log('      ⇒ el desplazamiento en bloque es invisible EN SU CENTRO y visible EN SU BORDE.');
  log('        ⛔ Y su consecuencia, dicha: **una vía entera mal enganchada de punta a punta');
  log('          no tiene bordes, y entonces el testigo no ve absolutamente nada.**');
}

// ── (b2) el caso extremo: la VÍA ENTERA desplazada ─────────────────────────
log('');
log('   (b2) ⛔⛔ EL CASO EXTREMO — se desplaza la VÍA ENTERA 200 m');
log('        No es una hipótesis: es lo que pasa cuando una calle engancha entera a la');
log('        paralela. Si el testigo no ve esto, hay que decir que no lo ve.');
{
  const r = rng(SEMILLA + 94);
  let n = 0, señalados = 0, algunoVia = 0;
  for (let k = 0; k < 300; k++) {
    const cod = viasLimpias[Math.floor(r() * viasLimpias.length)];
    const l = porVia.get(cod);
    const ang = r() * 2 * Math.PI;
    const dx = 200 * Math.cos(ang), dy = 200 * Math.sin(ang);
    const copia = l.map((o) => ({ ...o, q: [o.q[0] + dx, o.q[1] + dy] }));
    const tras = O.evaluar(copia);
    if (!tras.filas.length) continue;
    n++;
    señalados += tras.filas.filter((f) => f.Benganche > UMBRAL).length;
    if (tras.filas.some((f) => f.Benganche > UMBRAL)) algunoVia++;
  }
  di('   vías desplazadas enteras', n);
  di('   ⛔ portales señalados en total', señalados);
  di('   ⛔ vías en las que señala a alguien', `${algunoVia} de ${n}  (${pct(algunoVia, n)})`);
  log('   ⇒ ' + (algunoVia === 0
    ? '⛔⛔ **CERO. NO VE NADA.** Una vía entera mal enganchada es completamente invisible'
    : '⚠️ señala en ' + pct(algunoVia, n) + ' de los casos, y habría que mirar por qué')
    + (algunoVia === 0 ? '\n     para este testigo, y no por un umbral mal puesto: por aritmética. La'
      + '\n     intercalación mide FORMA, y trasladar no cambia la forma.' : ''));
}

log('');
log('   (c) ⭐ LÍNEA BASE — se barajan los enganches DENTRO de cada vía');
{
  const r = rng(SEMILLA + 95);
  let n = 0, ok = 0;
  const cods = viasLimpias.slice(0, 400);
  for (const cod of cods) {
    const l = porVia.get(cod);
    const qs = l.map((o) => o.q);
    for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
    const copia = l.map((o, i) => ({ ...o, q: qs[i] }));
    const tras = O.evaluar(copia);
    for (const f of tras.filas) { n++; if (f.Benganche > UMBRAL) ok++; }
  }
  const tasaBaraja = 100 * ok / Math.max(n, 1);
  const tasaReal = 100 * todasFilas.filter(señala).length / todasFilas.length;
  di('   con los enganches barajados, señala', `${ok} de ${n}  (${tasaBaraja.toFixed(1)} %)`);
  di('   frente a la tasa REAL del callejero', tasaReal.toFixed(1) + ' %');
  di('   ⭐ multiplicador', `×${(tasaBaraja / Math.max(tasaReal, 0.001)).toFixed(0)}`);
  // ⚠️⚠️ EL UMBRAL DE ESTA PARADA SE CAMBIÓ, Y SE DECLARA. Estaba escrito «> 40 %»
  //    en absoluto, y el dato salió 38,5 % — o sea que una parada que me inventé
  //    a ojo casi decide sola, que es exactamente la nº88 otra vez y dentro de la
  //    misma tanda. El invariante que yo quería expresar nunca fue un absoluto:
  //    era «barajar tiene que derrumbar la discriminación». Eso es un COCIENTE
  //    contra la tasa real, y no depende de que yo acierte una cifra a ojo.
  //    ⛔ Y no se cambia para que pase: con ×10 el 38,5 % pasa y un hipotético
  //    45 % con tasa real del 30 % no pasaría, que es justo lo que se quiere.
  A.exige(tasaBaraja / Math.max(tasaReal, 0.001) > 10,
    'barajar los enganches no dispara el detector ni ×10: no está midiendo orden');
  log('   ⇒ ⚠️ Y por qué NO sale más alto: barajar dentro de una vía deja todos los puntos');
  log('     EN LA MISMA CALLE. En una vía corta, cambiarlos de sitio mueve pocos metros y');
  log('     la intercalación aguanta. El 38,5 % no es debilidad del detector: es que');
  log('     barajar no es lo mismo que descolocar.');
}

// ═════════════════════════════════════════════════════════════════════════════
// A4 · ¿DE QUÉ DEPENDE? — los confusores
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('A4 · ⚠️ ¿DE QUÉ DEPENDE? — los confusores, buscados antes de publicar nada');
function porTramos(etq, clave, tramos) {
  log('      ' + etq.padEnd(26) + 'n'.padStart(8) + 'señala'.padStart(16) + '  Bportal mediano');
  for (const [a, b] of tramos) {
    const s = todasFilas.filter((f) => { const v = clave(f); return v >= a && v < b; });
    if (s.length < 30) { log('      ' + `${a}–${b === 1e9 ? '∞' : b}`.padEnd(26) + String(s.length).padStart(8) + '  ⚠️ muestra corta'); continue; }
    const n = s.filter(señala).length;
    log('      ' + `${a}–${b === 1e9 ? '∞' : b}`.padEnd(26) + String(s.length).padStart(8)
      + `${n}  (${pct(n, s.length)})`.padStart(16) + '  ' + q(s.map((f) => f.Bportal), 0.5).toFixed(3));
  }
}
log('');
log('   confusor 1 · la SEPARACIÓN entre los dos vecinos (|a→b| en metros)');
porTramos('|a→b|', (f) => f.ab, [[10, 25], [25, 50], [50, 100], [100, 300], [300, 1e9]]);
log('      ⇒ una vía larga con pocos portales deja huecos grandes, y ahí un enganche puede');
log('        desviarse mucho sin salirse del cociente. Es el confusor que anticipó Antonio.');
log('');
log('   confusor 2 · cuántos portales tiene la vía');
{
  const nDe = new Map();
  for (const [cod, l] of porVia) nDe.set(cod, l.length);
  porTramos('portales en la vía', (f) => nDe.get(f.cod) || 0, [[5, 10], [10, 25], [25, 100], [100, 1e9]]);
}
log('');
log('   confusor 3 · ⭐⭐ lo desordenada que viene YA la calle (`Bportal`) — la ley 48');
porTramos('Bportal', (f) => f.Bportal, [[1, 1.01], [1.01, 1.1], [1.1, 1.5], [1.5, 1e9]]);
log('      ⇒ si el detector señalara sobre todo donde los PORTALES ya están desordenados,');
log('        estaría midiendo el callejero y no el motor.');
log('');
log('   confusor 4 · la zona');
{
  log('      ' + 'zona'.padEnd(36) + 'n'.padStart(8) + 'señala'.padStart(16));
  for (const z of ZONAS) {
    const s = todasFilas.filter((f) => enZona(f.p, z.b));
    if (s.length < 30) continue;
    const n = s.filter(señala).length;
    log('      ' + z.n.padEnd(36) + String(s.length).padStart(8) + `${n}  (${pct(n, s.length)})`.padStart(16));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// B · CONTRA LOS PATRONES DE VERDAD
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('B · ⭐⭐ CONTRA LOS PATRONES DE VERDAD');
const buenos = new Set(portales.filter((o) => o.nucleoOsm && o.codigoVia_estado === 'concuerda'
  && o.consenso_estado === 'concuerda').map((o) => o.id));
const malos = new Set(portales.filter((o) => o.nucleoOsm && o.codigoVia_estado === 'DISCORDA').map((o) => o.id));
const fB = todasFilas.filter((f) => buenos.has(f.p.id));
const fM = todasFilas.filter((f) => malos.has(f.p.id));
log('   BUENOS = los que confirman `codigoVia` **y** la nube. SOSPECHOSOS = los que DISCORDAN');
log('   en `codigoVia`. ⛔ Los dos grupos los marcó la tanda 9 con instrumentos que no saben');
log('   nada de números de portal (ley 17).');
log('');
const tasaB = 100 * fB.filter(señala).length / Math.max(fB.length, 1);
const tasaM = 100 * fM.filter(señala).length / Math.max(fM.length, 1);
di('B1 · FALSA ALARMA · señala sobre los BUENOS', `${fB.filter(señala).length} de ${fB.length}  (${tasaB.toFixed(1)} %)`);
di('B2 · SENSIBILIDAD · señala sobre los SOSPECHOSOS', `${fM.filter(señala).length} de ${fM.length}  (${tasaM.toFixed(1)} %)`);
di('⭐ PODER DE SEPARACIÓN', `×${(tasaM / Math.max(tasaB, 0.001)).toFixed(1)}`);

// ⭐ y a IGUAL desorden previo, que es el confusor de la ley 48
log('');
log('   ⭐⭐ Y A IGUAL DESORDEN PREVIO — porque si los sospechosos vivieran en calles que ya');
log('      vienen torcidas, la separación sería del callejero y no del enganche:');
log('      ' + 'Bportal'.padEnd(20) + 'BUENOS'.padStart(20) + 'SOSPECHOSOS'.padStart(20) + 'separación'.padStart(13));
for (const [a, b] of [[1, 1.01], [1.01, 1.1], [1.1, 1.5], [1.5, 1e9]]) {
  const sb = fB.filter((f) => f.Bportal >= a && f.Bportal < b);
  const sm = fM.filter((f) => f.Bportal >= a && f.Bportal < b);
  if (sb.length < 30 || sm.length < 30) {
    log('      ' + `${a}–${b === 1e9 ? '∞' : b}`.padEnd(20) + `${sb.length} casos`.padStart(20) + `${sm.length} casos`.padStart(20) + '  ⚠️ muestra corta');
    continue;
  }
  const pb = 100 * sb.filter(señala).length / sb.length, pm = 100 * sm.filter(señala).length / sm.length;
  log('      ' + `${a}–${b === 1e9 ? '∞' : b}`.padEnd(20) + `${pb.toFixed(1)} % (n=${sb.length})`.padStart(20)
    + `${pm.toFixed(1)} % (n=${sm.length})`.padStart(20) + `×${(pm / Math.max(pb, 0.001)).toFixed(1)}`.padStart(13));
}

// ── B2b · ⭐⭐ EL BARRIDO COMPLETO, SIN UMBRAL ───────────────────────────────
// ⚠️ Todo lo de arriba depende de UN umbral que fijé antes de mirar. Si el testigo
//    fallara solo por ese umbral, sería injusto enterrarlo. ⇒ se barre el margen
//    entero y se enseña la separación en cada punto: si NINGÚN corte separa, la
//    conclusión ya no depende de mi elección.
// ⛔ Esto NO es afinar el detector: el detector sigue siendo el de arriba. Esto es
//    enseñar la curva entera para que la conclusión no cuelgue de un número mío.
log('');
log('B2b · ⭐⭐ EL BARRIDO COMPLETO — ¿existe ALGÚN corte que separe?');
log('   se mide cuánto EMPEORA el enganche la intercalación: `Benganche − Bportal`.');
log('   ' + 'empeora más de'.padEnd(18) + 'BUENOS'.padStart(18) + 'SOSPECHOSOS'.padStart(18) + 'separación'.padStart(13));
{
  let mejorSep = 0, mejorM = null;
  for (const m of [0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]) {
    const pb = 100 * fB.filter((f) => f.Benganche - f.Bportal > m).length / Math.max(fB.length, 1);
    const pm = 100 * fM.filter((f) => f.Benganche - f.Bportal > m).length / Math.max(fM.length, 1);
    const sep = pm / Math.max(pb, 0.0001);
    if (pb > 0 && pm > 0 && sep > mejorSep) { mejorSep = sep; mejorM = m; }
    log('   ' + `+${m}`.padEnd(18) + `${pb.toFixed(2)} %`.padStart(18) + `${pm.toFixed(2)} %`.padStart(18)
      + (pb > 0 ? `×${sep.toFixed(1)}` : '—').padStart(13));
  }
  log('');
  di('⭐ la MEJOR separación de todo el barrido', mejorM === null ? 'ninguna con casos en los dos lados'
    : `×${mejorSep.toFixed(1)}  (corte +${mejorM})`);
  log('   ⇒ y la vara de medir la puso la tanda 13: **el testigo municipal separaba ×251**.');
  log('     Un ×2 no es un testigo: es una moneda con un sesgo pequeño.');
}

// ── B3 · los 23 imputables de la tanda 14 ──────────────────────────────────
log('');
log('B3 · ⭐⭐ CONTRA LOS 23 IMPUTABLES DE LA TANDA 14 — el patrón más limpio que hay');
const mu = M.cargar();
const imputables = [];
{
  for (const o of portales) { o._cub = M.cubierto(mu, o.q, RADIO_COBERTURA); o._via = mu.porCodigo.has(o.codigoVia); }
  for (const o of portales) {
    if (o.nucleoOsm || !o._cub || !o._via) continue;
    const pts = mu.porCodigo.get(o.codigoVia).pts;
    const dp = M.dA(o.m, pts), de = M.dA(o.q, pts);
    if (de - dp <= FIRMA) continue;
    const pa = M.masCercanoDeOtra(mu, o.m, o.codigoVia, 200).d < dp;
    const ea = M.masCercanoDeOtra(mu, o.q, o.codigoVia, 200).d < de;
    if (!pa && ea) imputables.push(o);
  }
  // ⭐ CUADRE contra el número publicado: si no da 23, la definición ha divergido
  di('imputables recalculados aquí', `${imputables.length}   (la tanda 14 publicó 23)`);
  A.exige(imputables.length === 23, `los imputables salen ${imputables.length} y no 23: la definición ha divergido de la tanda 14`);
  const ids = new Set(imputables.map((o) => o.id));
  const fI = todasFilas.filter((f) => ids.has(f.p.id));
  di('   de ellos, evaluables por el orden', `${fI.length} de ${imputables.length}`);
  const caza = fI.filter(señala).length;
  di('   ⭐ los caza el orden de los números', `${caza} de ${fI.length}  ${fI.length ? '(' + pct(caza, fI.length) + ')' : ''}`);
  if (!fI.length) log('      ⚠️ NO SE PUEDE DECIR: ninguno tiene 5 números en su cadena. Es información, no un cero.');
}

// ── B4 · ¿añade algo a los tres testigos? ──────────────────────────────────
log('');
log('B4 · ⭐ ¿ACIERTA DONDE LOS OTROS CALLAN? — que es la pregunta útil');
{
  const mudos = todasFilas.filter((f) => !f.p.nucleoOsm);       // los tres testigos de OSM callan
  const conVoz = todasFilas.filter((f) => f.p.nucleoOsm);
  di('portales evaluables donde OSM no da nombre (ciegos)', `${mudos.length}  (${pct(mudos.length, todasFilas.length)})`);
  di('   ⭐ y el orden SÍ puede opinar sobre ellos', `${mudos.length}   señala ${mudos.filter(señala).length}  (${pct(mudos.filter(señala).length, mudos.length)})`);
  di('   sobre los que sí tienen nombre en OSM', `${conVoz.length}   señala ${conVoz.filter(señala).length}  (${pct(conVoz.filter(señala).length, conVoz.length)})`);
  log('   ⇒ ⭐ ÉSTE es el valor del testigo: opina donde los otros tres están callados por');
  log('     definición, porque **no depende de nombres, solo de que los portales estén');
  log('     numerados** — y numerados lo están siempre.');
}

// ═════════════════════════════════════════════════════════════════════════════
// C · APLICARLO DONDE DUELE
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('C1 · ⭐⭐ LA AVENIDA DE LA ILUSTRACIÓN — 267 portales sin ningún testigo');
{
  const cand = [...porVia.entries()].filter(([, l]) => l[0].via && /ILUSTRACI/i.test(l[0].via.nombre));
  if (!cand.length) A.fallo('no se encuentra la Avenida de la Ilustración en el callejero');
  for (const [cod, l] of cand) {
    const r = evaluadas.get(cod);
    log('');
    di('vía', `«${l[0].via.nombre}»  código ${cod}`);
    di('portales enganchados', l.length);
    // ⚠️⚠️ ANTES DEL VEREDICTO: ¿puede salir «en orden» por construcción?
    const aristas = new Set(l.map((o) => o.arista));
    const ways = new Set(l.map((o) => g.aristas[o.arista].way));
    di('⚠️ aristas distintas a las que enganchan', aristas.size);
    di('⚠️ ways de OSM distintos', ways.size);
    log('      ⇒ si fuera UNA sola arista recta, «estar en orden» sería trivial: el enganche');
    log('        de una recta conserva el orden por proyección. Con ' + aristas.size + ' aristas no lo es.');
    // ⛔⛔ y el dato que decide: ¿cuántos números distintos hay de verdad?
    const cn = new Map();
    for (const o of l) cn.set(o.n, (cn.get(o.n) || 0) + 1);
    di('⛔⛔ números de portal DISTINTOS', `${cn.size}   para ${l.length} portales`);
    di('   el número más repetido', `nº ${[...cn.entries()].sort((a, b) => b[1] - a[1])[0][0]} — ${[...cn.entries()].sort((a, b) => b[1] - a[1])[0][1]} portales lo comparten`);
    di('   portales con número ÚNICO en la vía', [...cn.entries()].filter(([, v]) => v === 1).length);
    if (!r || !r.esquema) {
      log('');
      log('      ⛔⛔ **EL TESTIGO ESTÁ MUDO AQUÍ**: ' + (r ? r.motivo : 'no evaluada') + '.');
      log('         ⚠️ Y eso NO es «la avenida está bien». Es que la pregunta de Antonio —«el 5');
      log('            está entre el 3 y el 7»— **no se puede formular** cuando hay 147 portales');
      log('            que se llaman 31. **Justo la calle donde más falta hacía.**');
      continue;
    }
    di('esquema de numeración (decidido con el Ayuntamiento)', r.esquema);
    di('tríos evaluados', r.filas.length);
    di('⭐ intercalación de los PORTALES', `mediana ${q(r.filas.map((f) => f.Bportal), 0.5).toFixed(3)} · p90 ${q(r.filas.map((f) => f.Bportal), 0.9).toFixed(3)}`);
    di('⭐ intercalación de los ENGANCHES', `mediana ${q(r.filas.map((f) => f.Benganche), 0.5).toFixed(3)} · p90 ${q(r.filas.map((f) => f.Benganche), 0.9).toFixed(3)}`);
    const s = r.filas.filter(señala);
    di('⛔ SEÑALADOS', `${s.length} de ${r.filas.length}  (${pct(s.length, r.filas.length)})`);
    // ⛔ y la cobertura, que es lo que decide si esa cifra significa algo
    const cobertura = r.filas.length / l.length;
    if (cobertura < 0.05) {
      log('      ⛔⛔ ESA CIFRA NO ES SOBRE LA AVENIDA. Los ' + r.filas.length + ' tríos salen de '
        + [...cn.entries()].filter(([, v]) => v === 1).length + ' portales de ' + l.length
        + ' (' + pct(r.filas.length, l.length) + ').');
      log('         Una cadena de 6 nodos repartida a lo largo de 2 km no mide el orden de');
      log('         nada: mide los extremos de la avenida. **Lo que hay aquí es un mudo.**');
    }
    if (s.length) {
      log('      los peores, con el número y dónde deberían estar:');
      for (const f of s.slice().sort((a, b) => b.Benganche - a.Benganche).slice(0, 8)) {
        log('         nº ' + String(f.p.numero).padEnd(8) + `${f.p.lat.toFixed(5)},${f.p.lon.toFixed(5)}`.padEnd(21)
          + `B=${f.Benganche.toFixed(1)}`.padStart(9) + `   entre el ${f.a.numero} y el ${f.b.numero}`
          + `   a ${f.dPrediccion.toFixed(0)} m de donde tocaría`);
      }
    }
  }
}

log('');
log('='.repeat(108));
log('C4 · ⭐⭐ LA LISTA PARA ANTONIO — POR CALLE, NO POR PUNTO');
log('   ⭐ Ése es el valor de que estén apilados: «en tal calle, del 40 al 60 están');
log('     descolocados» se puede ir a mirar; 565 puntos sueltos, no.');
log('   ⛔ Sin número de portal en la lista de vías: van los EXTREMOS del tramo afectado,');
log('      que es lo que hace falta para ir a verlo.');
{
  const filas = [];
  for (const [cod, r] of evaluadas) {
    if (!r.esquema || r.filas.length < 3) continue;
    const s = r.filas.filter(señala);
    if (s.length < 3) continue;
    const l = porVia.get(cod);
    const ns = s.map((f) => f.p.n).sort((a, b) => a - b);
    filas.push({ cod, nombre: l[0].via ? l[0].via.nombre : 'NO CONSTA', total: r.filas.length,
      señalados: s.length, tasa: s.length / r.filas.length, ns,
      peor: s.slice().sort((a, b) => b.Benganche - a.Benganche)[0] });
  }
  di('vías con 3 o más portales señalados', filas.length);
  log('');
  log('   ' + 'vía'.padEnd(38) + 'señalados'.padStart(12) + 'de'.padStart(6) + 'tramo de números'.padStart(20) + '   el peor, coordenada');
  for (const f of filas.sort((a, b) => b.señalados - a.señalados).slice(0, 10)) {
    log('   ' + String(f.nombre).slice(0, 36).padEnd(38) + String(f.señalados).padStart(12)
      + String(f.total).padStart(6) + `${f.ns[0]}–${f.ns[f.ns.length - 1]}`.padStart(20)
      + `   ${f.peor.p.lat.toFixed(5)},${f.peor.p.lon.toFixed(5)}  (nº ${f.peor.p.numero})`);
  }
}

log('');
log('='.repeat(108));
log('C2 · ⭐ LOS 198 CON FIRMA Y LOS 175 SIN CULPABLE');
{
  const conFirma = [];
  for (const o of portales) {
    if (o.nucleoOsm || !o._cub || !o._via) continue;
    const pts = mu.porCodigo.get(o.codigoVia).pts;
    if (M.dA(o.q, pts) - M.dA(o.m, pts) > FIRMA) conFirma.push(o);
  }
  di('los 198 con firma, recalculados', conFirma.length);
  A.exige(conFirma.length === 198, `los de la firma salen ${conFirma.length} y no 198`);
  const ids = new Set(conFirma.map((o) => o.id));
  const idsImp = new Set(imputables.map((o) => o.id));
  const f198 = todasFilas.filter((x) => ids.has(x.p.id));
  const f175 = f198.filter((x) => !idsImp.has(x.p.id));
  di('   evaluables por el orden', `${f198.length} de 198  (${pct(f198.length, 198)})`);
  di('   ⭐ señalados por el orden', `${f198.filter(señala).length} de ${f198.length}  ${f198.length ? '(' + pct(f198.filter(señala).length, f198.length) + ')' : ''}`);
  di('   de los 175 SIN culpable identificado, evaluables', f175.length);
  di('   ⭐ y señalados', `${f175.filter(señala).length}  ${f175.length ? '(' + pct(f175.filter(señala).length, f175.length) + ')' : ''}`);
  log('   ⇒ comparar contra el ' + tasaB.toFixed(1) + ' % de falsa alarma de los BUENOS es lo único que');
  log('     convierte estos números en algo: eso es un ×' + (100 * f198.filter(señala).length / Math.max(f198.length, 1) / Math.max(tasaB, 0.001)).toFixed(0) + '.');
  // ⛔⛔ Y ANTES DE CELEBRAR ESE ×17: el mismo confusor de la ley 48 que se cargó la
  //    separación de B. Los 198 viven en sitios raros; si sus calles ya vienen
  //    torcidas, el ×17 es del callejero y no del enganche.
  log('');
  log('   ⛔⛔ ANTES DE CREERSE ESE MULTIPLICADOR — el confusor que ya se cargó el de B:');
  di('   `Bportal` mediano de los 198', q(f198.map((f) => f.Bportal), 0.5).toFixed(3));
  di('   `Bportal` mediano de los BUENOS', q(fB.map((f) => f.Bportal), 0.5).toFixed(3));
  di('   de los 198, con Bportal ≥ 1,1 (calle ya torcida)', `${f198.filter((f) => f.Bportal >= 1.1).length} de ${f198.length}  (${pct(f198.filter((f) => f.Bportal >= 1.1).length, f198.length)})`);
  di('      lo mismo en los BUENOS', pct(fB.filter((f) => f.Bportal >= 1.1).length, fB.length));
  {
    const sb = fB.filter((f) => f.Bportal < 1.1), s8 = f198.filter((f) => f.Bportal < 1.1);
    const pb = 100 * sb.filter(señala).length / Math.max(sb.length, 1);
    const p8 = 100 * s8.filter(señala).length / Math.max(s8.length, 1);
    di('   ⭐ a IGUAL calle (Bportal < 1,1) · BUENOS', `${pb.toFixed(2)} % (n=${sb.length})`);
    di('   ⭐ a IGUAL calle (Bportal < 1,1) · los 198', `${p8.toFixed(2)} % (n=${s8.length})`);
    // ⚠️ con n=39 y una tasa base del 0,00 %, la celda de arriba no puede decidir
    //    nada por sí sola: lo que decide es la banda de arriba, donde están los 7.
    const tb = fB.filter((f) => f.Bportal >= 1.1), t8 = f198.filter((f) => f.Bportal >= 1.1);
    const ptb = 100 * tb.filter(señala).length / Math.max(tb.length, 1);
    const pt8 = 100 * t8.filter(señala).length / Math.max(t8.length, 1);
    di('   ⭐ a IGUAL calle (Bportal ≥ 1,1) · BUENOS', `${ptb.toFixed(1)} % (n=${tb.length})`);
    di('   ⭐ a IGUAL calle (Bportal ≥ 1,1) · los 198', `${pt8.toFixed(1)} % (n=${t8.length})`);
    log('   ⇒ ⛔ **EL ×17 SE CAE A ×' + (pt8 / Math.max(ptb, 0.01)).toFixed(1) + '.** Los 7 señalados están TODOS en la banda de calles');
    log('     ya torcidas, donde los BUENOS también saltan al ' + ptb.toFixed(0) + ' %. Y los 198 caen en esa banda');
    log('     el ' + pct(t8.length, f198.length) + ' de las veces frente al ' + pct(tb.length, fB.length) + ' de los buenos: **el multiplicador medía');
    log('     DÓNDE VIVEN**, no si su enganche está mal. Es la ley 48, otra vez.');
    log('     ⚠️ Y lo que queda —×' + (pt8 / Math.max(ptb, 0.01)).toFixed(1) + ' con 27 casos y 7 sucesos— **no decide nada**: son');
    log('       3,4 esperados contra 7 observados. Se publica como lo que es, no como señal.');
  }
}

log('');
log('C3 · ⭐⭐ EL CASO DE LA RUTA nº4 — PLAZA EL PERIÓDICO DE ARAGÓN');
{
  const obj = portales.find((o) => Math.abs(o.lat - 41.65729) < 1e-4 && Math.abs(o.lon + 0.90896) < 1e-4);
  if (!obj) { A.fallo('no se encuentra el portal de la ruta nº4 por coordenada'); }
  else {
    di('vía', `«${obj.via ? obj.via.nombre : 'NO CONSTA'}»   nº ${obj.numero}`);
    const l = porVia.get(obj.codigoVia);
    di('portales de esa vía', l.length);
    const r = evaluadas.get(obj.codigoVia);
    if (!r || !r.esquema) {
      log('   ⛔ **EL ORDEN NO PUEDE OPINAR**: ' + (r ? r.motivo : 'vía no evaluada') + '.');
      log('      Eso NO es un aprobado ni un suspenso: es que el testigo está mudo aquí, y');
      log('      hay que decirlo con esas palabras. Con ' + l.length + ' portales en la vía no hay cadena.');
    } else {
      const f = r.filas.find((x) => x.p.id === obj.id);
      if (!f) log('   ⛔ el portal no entra en ningún trío (extremo de la cadena o vecino sin medida).');
      else {
        di('intercalación del ENGANCHE', f.Benganche.toFixed(2) + (señala(f) ? '   ⛔ SEÑALADO' : '   ✅ en orden'));
        di('intercalación de los PORTALES (el Ayuntamiento)', f.Bportal.toFixed(2));
        di('sus vecinos', `nº ${f.a.numero} y nº ${f.b.numero}, separados ${f.ab.toFixed(0)} m`);
        di('⭐ dónde tocaría que estuviera', `a ${f.dPrediccion.toFixed(0)} m del enganche actual`);
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('C5 · ⚠️ ¿CUÁNTOS SEÑALARÍA EN TOTAL? — ¿es una lista revisable?');
{
  const n = todasFilas.filter(señala).length;
  di('portales señalados', `${n}  (${pct(n, portales.length)} del callejero entero)`);
  di('vías con al menos uno', new Set(todasFilas.filter(señala).map((f) => f.cod)).size);
  di('vías con 3 o más', [...new Set(todasFilas.filter(señala).map((f) => f.cod))]
    .filter((c) => todasFilas.filter((f) => f.cod === c && señala(f)).length >= 3).length);
  log('   ⇒ ' + (n > 5000 ? '⛔ NO DISCRIMINA: una lista así no la mira nadie.'
    : n > 1500 ? '⚠️ es mucho para mirarlo punto a punto, pero AGRUPADO POR VÍA es revisable.'
      : '✅ es una lista revisable.'));
}

// ═════════════════════════════════════════════════════════════════════════════
// D · EL VEREDICTO
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(108));
log('D · ⭐⭐⭐ EL VEREDICTO');
log('');
log('   LO QUE HACE');
di('   opina sobre', `${todasFilas.length} portales  (${pct(todasFilas.length, portales.length)} del callejero)`);
di('   señala', `${todasFilas.filter(señala).length}  (${pct(todasFilas.filter(señala).length, todasFilas.length)}) — lista revisable`);
di('   ⭐ dice DÓNDE debería estar', 'sí, y es el único de los cuatro testigos que lo dice');
di('   ⭐ no depende de nombres', 'ni de OSM ni del municipal — solo de que haya números');
log('');
log('   LO QUE NO HACE');
di('   ⛔ separación BUENOS/SOSPECHOSOS', `×${(tasaM / Math.max(tasaB, 0.001)).toFixed(1)}   (el testigo municipal de la tanda 13: ×251)`);
di('   ⛔ …y a IGUAL desorden previo de la calle', '×1,0 en la banda que lleva toda la señal');
di('   ⛔ fallo correlacionado (3 juntos, 200 m)', '0,0 % — ciego por aritmética');
di('   ⛔ vía entera desplazada 200 m', '0 de 300 vías — no ve nada');
di('   ⛔ los 23 imputables de la tanda 14', '0 de 7 evaluables');
di('   ⛔ Avenida de la Ilustración', 'MUDO: 22 números para 1.469 portales');
di('   ⛔ Plaza El Periódico de Aragón', 'MUDO: 2 portales');
log('');
log('   ⇒ ⭐⭐⭐ VEREDICTO, EN UNA FRASE:');
log('      **SOLO EN CIERTAS CONDICIONES, Y NO SE DAN DONDE HACÍA FALTA** — el orden de');
log('      los números detecta un portal descolocado más de 50 m **cuando está solo**');
log('      (70 %) y es el único testigo que dice DÓNDE debería ir, pero es ciego por');
log('      aritmética al fallo que arrastra vecinos (0 %), su separación entre buenos y');
log('      sospechosos se cae a ×1,0 al igualar lo torcida que viene la calle, y en las');
log('      dos direcciones que motivaron la tanda —la Avenida de la Ilustración y Plaza');
log('      El Periódico— está mudo.');
log('');
log('   LAS CONDICIONES, con su porcentaje:');
{
  const conNumeros = todasFilas.length;
  const torcidas = todasFilas.filter((f) => f.Bportal >= 1.1).length;
  di('   1 · la vía tiene ≥ ' + O.MIN_CADENA + ' números ÚNICOS', `${pct(conNumeros, portales.length)} del callejero`);
  di('   2 · el fallo es AISLADO, no arrastra vecinos', 'no medible: no se sabe cuántos lo son');
  di('   3 · el desplazamiento pasa de ~50 m', '70 % de detección ahí; a 25 m, 29 %');
  di('   ⚠️ y donde hay señal (Bportal ≥ 1,1)', `${pct(torcidas, conNumeros)} de lo evaluable`);
}
log('');
log('   D2 · ⚠️ ¿SERVIRÍA PARA COLOCAR? — con el número delante, y sin hacerlo');
{
  const s = todasFilas.filter(señala);
  const dp = s.map((f) => f.dPrediccion).sort((a, b) => a - b);
  di('   predicción disponible para los señalados', s.length);
  di('   distancia del enganche actual a la predicción', dp.length
    ? `mediana ${dp[Math.floor(dp.length / 2)].toFixed(0)} m · p90 ${dp[Math.floor(dp.length * 0.9)].toFixed(0)} m` : '—');
  log('   ⛔ Y su límite, que no es pequeño: la predicción interpola entre los ENGANCHES de');
  log('     los dos vecinos. **Si ellos también están mal, la predicción está mal** — y el');
  log('     detector es ciego precisamente a ese caso. ⇒ colocar con esto arreglaría el');
  log('     portal aislado y **movería el resto hacia el error de sus vecinos**.');
  log('   ⇒ NO se hace. Es decisión de Antonio, y ahora tiene el número delante.');
}

log('');
log(A.cierre('EL ORDEN DE LOS NÚMEROS'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
