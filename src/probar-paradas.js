// A3 · ⛔⛔ LOS ROJOS DE LA ALARMA, PROVOCADOS — y el invariante sobre todo `src/`.
//
// ⭐ El invariante que se defiende, y que la tanda 12 no defendía:
//       si la salida declara un fallo, el código de salida NO puede ser 0.
//
// ⚠️ Y el invariante se comprueba sobre la MARCA de la alarma (`⛔ FALLO ·`,
//    `⛔⛔ IMPOSIBLE ·`), no sobre el símbolo `⛔` suelto. El símbolo se usa
//    también como prosa —"⛔ NO se copian los portales"— y contarlo daría un
//    número inflado: en la primera auditoría salieron 10 sospechosos y, al
//    clasificar las líneas a mano, **solo uno era un fallo de verdad**.
//
//   node src/probar-paradas.js
//   node src/probar-paradas.js --todo    (además, ejecuta todos los scripts de src/)

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('./alarma');

const L = [];
const di = (k, v) => L.push(`   ${String(k).padEnd(58)} ${v}`);
let todo = true;
const exige = (etq, ok, detalle) => {
  if (!ok) todo = false;
  di(etq, (ok ? '✅' : '⛔ NO PASA') + (detalle ? '   ' + detalle : ''));
};

/** Ejecuta un trozo de código en un proceso nuevo y devuelve {codigo, salida}. */
function correr(codigo) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-parada-'));
  const f = path.join(tmp, 'prueba.js');
  fs.writeFileSync(f, codigo.replace('<<ALARMA>>', JSON.stringify(path.join(__dirname, 'alarma.js'))));
  const r = spawnSync(process.execPath, [f], { encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return { codigo: r.status, salida: (r.stdout || '') + (r.stderr || '') };
}

L.push('='.repeat(100));
L.push('A3 · ⛔⛔ LOS DOS TIPOS DE PARADA, PROVOCADOS');

// ── P1 · fallo de expectativa: se anota, se sigue, y el proceso sale en rojo ──
L.push('');
L.push('P1 · FALLO DE EXPECTATIVA — una ruta de cordura que no se resuelve');
L.push('   el script sigue midiendo (hay que ver TODOS los fallos, no solo el primero)');
L.push('   pero ya no puede terminar en 0.');
{
  const r = correr(`
    const A = require(<<ALARMA>>);
    A.fallo('ruta de cordura SIN RESOLVER: Puerta del Carmen -> Magdalena');
    A.fallo('otra más, para ver que se ven las dos');
    console.log('EL-SCRIPT-SIGUE-Y-TERMINA-NORMALMENTE');
  `);
  exige('rojo: código de salida distinto de 0', r.codigo === 1, 'código ' + r.codigo);
  exige('  y el script SÍ siguió hasta el final', r.salida.includes('EL-SCRIPT-SIGUE-Y-TERMINA-NORMALMENTE'));
  exige('  y se ven LOS DOS fallos, no solo el primero',
    (r.salida.match(/⛔ FALLO ·/g) || []).length === 2);
  // ⭐ positivo de control: sin fallo, el mismo camino de código sale en 0
  const c = correr(`
    const A = require(<<ALARMA>>);
    A.exige(true, 'esto no debería anotarse');
    console.log('SIN-FALLOS');
  `);
  exige('positivo de control: sin fallos sale en 0', c.codigo === 0, 'código ' + c.codigo);
}

// ── P2 · imposibilidad física: lanza en el acto ──────────────────────────────
L.push('');
L.push('P2 · IMPOSIBILIDAD FÍSICA — un rodeo por debajo de 1');
L.push('   no se anota: se lanza. Seguir midiendo con un instrumento que acaba de');
L.push('   decir un absurdo no tiene sentido.');
{
  const r = correr(`
    const A = require(<<ALARMA>>);
    A.imposible('la ruta mide 1.0 m entre dos puntos separados 2744 m');
    console.log('ESTO-NO-SE-TIENE-QUE-VER');
  `);
  exige('rojo: código de salida distinto de 0', r.codigo !== 0, 'código ' + r.codigo);
  exige('  y el script NO siguió', !r.salida.includes('ESTO-NO-SE-TIENE-QUE-VER'));
  exige('  y la marca IMPOSIBLE está en la salida', r.salida.includes(A.MARCA_IMPOSIBLE));
}

// ── P3 · el caso real que costó dos tandas ───────────────────────────────────
L.push('');
L.push('P3 · ⭐⭐ EL CASO REAL — la ruta de cordura del casco que estuvo rota dos tandas');
L.push('   `Puerta del Carmen → Magdalena`, publicada en H1-PRIMER-GRAFO §C4d como');
L.push('   correcta, daba `⛔ componentes-distintas` y el proceso salía en 0.');
{
  // ⭐ se comprueba de verdad: se le quitan los pasos condicionales al grafo del
  //    casco —que es lo que la rompió en la tanda 11— y tiene que salir en ROJO.
  const r = correr(`
    const A = require(<<ALARMA>>);
    const R = require(${JSON.stringify(path.join(__dirname, 'ruta.js'))});
    const g = R.construir(R.ZONA_CASCO, { sinCondicionales: true });
    let res;
    try { res = R.resolver(g, 41.6503, -0.8843, 41.6540, -0.8722); }
    catch (e) { res = { encontrada: false, motivo: e.message.slice(0, 40) }; }
    A.exige(res.encontrada, 'ruta de cordura SIN RESOLVER: Puerta del Carmen -> Magdalena (' + res.motivo + ')');
    console.log('el informe termina igual, pero el proceso no puede salir en verde');
  `);
  exige('con los pasos condicionales FUERA, la ruta se rompe y PARA', r.codigo === 1, 'código ' + r.codigo);
  const l = (r.salida.split('\n').find((x) => x.includes('⛔ FALLO ·')) || '').trim();
  if (l) L.push('      ' + l.slice(0, 96));
  // ⭐ POSITIVO DE CONTROL: con la decisión de la tanda 12 puesta, la misma ruta va
  const c = correr(`
    const A = require(<<ALARMA>>);
    const R = require(${JSON.stringify(path.join(__dirname, 'ruta.js'))});
    const g = R.construir(R.ZONA_CASCO);
    const res = R.resolver(g, 41.6503, -0.8843, 41.6540, -0.8722);
    A.exige(res.encontrada, 'no debería fallar');
    console.log('METROS=' + res.metros);
  `);
  exige('positivo de control: con los pasos DENTRO, la misma ruta resuelve', c.codigo === 0,
    (c.salida.match(/METROS=[\d.]+/) || [''])[0]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ EL VEREDICTO SOBRE UN SCRIPT, EN UNA FUNCIÓN — para poder PROBARLO
// ═══════════════════════════════════════════════════════════════════════════════
//   Hasta hoy esto vivía suelto dentro del bucle de P4, así que **no había forma
//   de enseñarle un rojo sin ejecutar los 58 scripts** (media hora larga). Sacarlo
//   aquí es lo que permite que `P5` le dé casos de mentira y compruebe que
//   distingue lo que dice distinguir.
// ⚠️ No es una reescritura: la regla de la tanda 33 —*un fallo declarado no puede
//    salir en 0*— y la del script que se muere mudo siguen dentro, y siguen
//    siendo las primeras.
function juzgar(real, esperado) {
  // 1 · el que se muere mudo. Regla de la tanda 33, intacta y la primera.
  if (real.revienta && !real.declara) return { ok: false, v: '⛔ SE ESTRELLA SIN DECIR NADA' };
  // 2 · ⚠️ el recuento se lee de la línea que imprime `alarma.js` AL SALIR. Si un
  //     script imprime la MARCA de un fallo y no llega a imprimir el recuento, es
  //     que se murió antes del gancho: el número no vale, y callarlo sería contar
  //     con un instrumento roto.
  if (real.declara && real.fallos === 0) return { ok: false, v: '⛔ DECLARA Y NO DICE CUÁNTOS' };
  // 3 · el invariante original: un fallo declarado no puede salir en 0.
  if (real.fallos > 0 && real.status === 0) return { ok: false, v: '⛔ DECLARA UN FALLO Y SALE EN 0' };
  // 4 · ⭐⭐⭐ LO QUE ESTA TANDA AÑADE: el RECUENTO contra lo esperado.
  //     Mundo cerrado: lo que no está en `DECLARADOS` debe declarar 0.
  if (real.fallos !== esperado.n) return { ok: false, v: `⛔ DECLARA ${real.fallos} Y SE ESPERABAN ${esperado.n}` };
  // 5 · el código de salida solo se EXIGE a los de la tabla: son los únicos de
  //     los que hay escrita una decisión sobre en qué deben salir.
  if (esperado.declarado && real.status !== esperado.cod) {
    return { ok: false, v: `⛔ SALE EN ${real.status} Y SE ESPERABA ${esperado.cod}` };
  }
  // 6 · ⚠️ el que sale en rojo SIN declarar nada no se da por bueno ni por malo:
  //     se NOMBRA. Meterlo en la tabla sería aceptar como esperado justo lo que
  //     esta tanda viene a destapar — un guardián callado. La tabla es para rojos
  //     DECLARADOS, no para rojos silenciosos. Decide Antonio.
  if (real.fallos === 0 && real.status !== 0) {
    return { ok: true, hallazgo: true, v: `⚠️ SALE EN ${real.status} SIN DECLARAR NADA` };
  }
  return { ok: true, v: '✅' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ LOS ROJOS DECLARADOS — cuántos fallos debe declarar cada uno, y por qué
// ═══════════════════════════════════════════════════════════════════════════════
//   ⛔⛔ MUNDO CERRADO: **todo lo que no esté aquí debe declarar 0 fallos.** No
//     hay tercera opción, y por eso un rojo nuevo no puede colarse.
//
// ⭐ Y cada fila lleva CUATRO campos, no dos. La CLASE es la que importa:
//    sin ella, esta tabla no distingue un rojo que debe seguir rojo de uno que
//    **se pudrió** — y esta comprobación existe porque dos llevaban dos días
//    podridos sin que nadie lo viera.
//
//      declarado a propósito · el guardián tiene razón y su código dice que se
//                              deja así hasta que lo decida Antonio
//      fuera de banda        · el motor da un número que el banco de pruebas no
//                              acepta, y está publicado
//      expectativa caducada  · ⚠️ el dato cambió y NADIE actualizó la
//                              comprobación. **Éste no es un rojo: es un
//                              instrumento muerto que sigue diciendo algo.**
const DECLARADOS = {
  'modelo-rutas.js': { n: 1, cod: 1, desde: '2026-08-04 · e39e98a',
    clase: 'declarado a propósito',
    texto: 'San Juan de la Peña no sale como «carril en calzada»' },
  'auditoria-guardianes.js': { n: 1, cod: 1, desde: '2026-08-05 · 398bcc7',
    clase: 'declarado a propósito',
    texto: 'el control NEGATIVO del clasificador falla' },
  'rutas-antonio.js': { n: 1, cod: 1, desde: '2026-08-03 · e264d90',
    clase: 'fuera de banda',
    texto: 'la ruta nº4 se sale del rodeo aceptable' },
  'donde-falta.js': { n: 1, cod: 1, desde: '2026-08-06 · c6f7f41',
    clase: 'expectativa caducada',
    texto: 'no se han podido leer las siete rutas' },
  'pasos.js': { n: 1, cod: 1, desde: '2026-08-06 · c6f7f41',
    clase: 'expectativa caducada',
    texto: 'no se han podido leer las siete rutas de `rutas-antonio.js --pasos`' },
};
const SIN_DECLARAR = { n: 0, cod: 0, declarado: false };
const hallazgos = [];
const esperadoDe = (f) => (DECLARADOS[f] ? { ...DECLARADOS[f], declarado: true } : SIN_DECLARAR);

/** El recuento que imprime `alarma.js` al salir. 0 si no hay línea. */
const RE_CUENTA = /⛔ (\d+) FALLO\(S\) DETECTADO\(S\)/;
const cuentaDe = (salida) => { const m = salida.match(RE_CUENTA); return m ? Number(m[1]) : 0; };

// ── P4 · el invariante sobre todo src/ ───────────────────────────────────────
if (process.argv.includes('--todo')) {
  L.push('');
  L.push('P4 · ⭐ EL INVARIANTE SOBRE TODO `src/` — ejecuta todos los scripts');
  const MODULOS = new Set(['geo.js', 'grafo.js', 'osm.js', 'planarizar.js', 'portales.js',
    'enganche.js', 'condicionales.js', 'direccion.js', 'limite.js', 'rios.js', 'alarma.js',
    path.basename(__filename), 'auditoria-paradas.js']);
  const fics = fs.readdirSync(__dirname).filter((f) => f.endsWith('.js') && !MODULOS.has(f)).sort();
  for (const f of fics) {
    const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 900000 });
    const salida = (r.stdout || '') + (r.stderr || '');
    const declara = salida.includes(A.MARCA_FALLO) || salida.includes(A.MARCA_IMPOSIBLE);
    // ⛔⛔ TANDA 33 · EL AGUJERO QUE TENÍA ESTE INVARIANTE, Y CÓMO SE VIO.
    //   La condición era `!declara || status !== 0`: *«un fallo declarado no puede
    //   salir en 0»*. Es **una sola dirección**. ⇒ un script que se ESTRELLA no
    //   declara nada, sale en 1, y la condición lo da por bueno.
    //   Pasó de verdad: al cambiar el contrato de `direccion.resolver()` —el portal
    //   puede venir a null—, `acera-equivocada.js` reventó con un `TypeError`, y
    //   **la batería recorrió los 56 scripts y terminó en ✅ código 0**.
    // ⭐ La marca: Node imprime su epílogo (`Node.js vXX`) tras una excepción no
    //   capturada. Es específica de «se ha muerto», no de «ha salido en 1».
    // ⚠️ Y solo cuenta si NO declara nada: `A.imposible()` también revienta, pero
    //   ésa es la forma correcta de morirse y deja su marca escrita.
    const revienta = /\nNode\.js v\d/.test(r.stderr || '');
    const fallos = cuentaDe(salida);
    const esperado = esperadoDe(f);
    const j = juzgar({ declara, fallos, status: r.status, revienta }, esperado);
    if (!j.ok) todo = false;
    if (j.hallazgo) hallazgos.push({ f, cod: r.status });
    // ⭐ la columna del RECUENTO, que es lo que antes no se veía: «1 de 1» dice
    //   algo que «DECLARA FALLO» no dice — que el número sigue siendo el mismo.
    L.push('   ' + f.padEnd(26) + 'código ' + String(r.status).padEnd(6)
      + (String(fallos) + ' de ' + esperado.n).padStart(8) + '  '
      + (declara ? 'declara  ' : revienta ? '⛔ muere ' : 'sin fallo') + '  ' + j.v);
  }

  // ── el resumen de la tabla, y la clase de cada rojo ────────────────────────
  L.push('');
  L.push('   ⭐⭐ LOS ROJOS DECLARADOS — y de qué clase es cada uno');
  for (const [f, d] of Object.entries(DECLARADOS)) {
    L.push('      ' + f.padEnd(26) + String(d.n).padStart(2) + '  '
      + d.clase.padEnd(24) + 'desde ' + d.desde);
  }
  const podridos = Object.entries(DECLARADOS).filter(([, d]) => d.clase === 'expectativa caducada');
  if (podridos.length) {
    L.push('');
    L.push('   ⚠️⚠️ ' + podridos.length + ' de ellos NO son rojos: son INSTRUMENTOS MUERTOS.');
    L.push('      Su expectativa caducó y nadie la actualizó, así que no miden nada y');
    L.push('      siguen diciendo algo. ⇒ ' + podridos.map(([f]) => f).join(' · '));
  }
  if (hallazgos.length) {
    L.push('');
    L.push('   ⚠️⚠️ HALLAZGO · sale(n) en rojo SIN declarar nada, y eso no está decidido:');
    for (const h of hallazgos) L.push('      ' + h.f.padEnd(26) + 'código ' + h.cod);
    L.push('      ⛔ NO se meten en la tabla: aceptarlos como esperado sería aceptar');
    L.push('         un guardián callado, que es lo que esta comprobación destapa.');
  }
} else {
  L.push('');
  L.push('P4 · ⚠️ el invariante sobre todo `src/` NO se ha ejecutado (falta `--todo`).');
  L.push('   ⛔ y eso NO significa que pase: significa que no se ha mirado.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// P5 · ⭐⭐⭐ ¿SABE ESTA BATERÍA CONTAR? — el veredicto, contra casos de mentira
// ═══════════════════════════════════════════════════════════════════════════════
//   ⛔⛔ Lo que se comprueba aquí NO es que los scripts pasen: es que **el
//     veredicto sepa distinguir**. Un script que declara UN fallo y uno que
//     declara SIETE tienen que dar líneas distintas. Si dan la misma, cinco rojos
//     permanentes son cinco vendas: uno de ellos podría ganar un segundo fallo y
//     nadie se enteraría nunca.
//
//   ⭐ Los casos son de MENTIRA a propósito, y por eso esto tarda milisegundos:
//     el veredicto vive en `juzgar()`, así que se le pueden enseñar situaciones
//     sin ejecutar los 58 scripts. Es lo mismo que hacen P1/P2/P3 con sus
//     ficheros temporales, aplicado a una decisión en vez de a un proceso.
//
//   ⚠️ Y lo que esto NO prueba, dicho antes de que nadie lo suponga: que el
//     recuento que se le pasa a `juzgar()` sea el de verdad. Eso lo prueba P4
//     ejecutando, y el control es que los cinco rojos declarados salgan con su
//     número. Aquí solo se prueba la DECISIÓN.
L.push('');
L.push('='.repeat(100));
L.push('P5 · ⭐⭐⭐ ¿SABE ESTA BATERÍA CONTAR? — el veredicto contra casos de mentira');
{
  const esperado1 = { n: 1, cod: 1, declarado: true };
  const uno = { declara: true, fallos: 1, status: 1, revienta: false };
  const siete = { declara: true, fallos: 7, status: 1, revienta: false };
  const v1 = juzgar(uno, esperado1);
  const v7 = juzgar(siete, esperado1);

  di('un rojo declarado que declara 1 (lo esperado)', v1.v);
  di('el MISMO que declara 7', v7.v);
  exige('el veredicto los distingue', v1.v !== v7.v,
    v1.v === v7.v ? `los dos dicen «${v1.v}»` : '');
  exige('y el de 7 NO puede salir en verde', !v7.ok);

  // ⭐ positivo de control: el de 1 SÍ tiene que pasar. Sin esto, un `juzgar`
  //   que dijera «rojo» a todo aprobaría las dos comprobaciones de arriba.
  di('positivo de control: el de 1 pasa', v1.ok ? '✅ verde' : '⛔ falla también lo bueno');
  if (!v1.ok) todo = false;

  // ⭐⭐ Y el otro lado, que es el que hace falta HOY: un script que NO está en la
  //   tabla y de pronto declara un fallo. Es cómo entraría un rojo nuevo.
  L.push('');
  const nuevo = juzgar({ declara: true, fallos: 1, status: 1, revienta: false }, SIN_DECLARAR);
  di('un script SIN rojo declarado que declara 1', nuevo.v);
  exige('un rojo NUEVO no puede pasar por bueno', !nuevo.ok);

  // ⭐ y el que se muere mudo, que ya se vigilaba desde la tanda 33
  const muerto = juzgar({ declara: false, fallos: 0, status: 1, revienta: true }, SIN_DECLARAR);
  di('un script que se estrella sin decir nada', muerto.v);
  exige('el que se muere mudo sigue sin pasar', !muerto.ok);
}

L.push('');
L.push(todo ? '   ⇒ ✅ UN FALLO DETECTADO YA NO PUEDE TERMINAR EN VERDE.'
  : '   ⇒ ⛔ HAY UN CAMINO POR EL QUE UN FALLO SIGUE SALIENDO EN 0.');
console.log(L.join('\n'));
if (!todo) process.exit(1);
