// ⭐⭐⭐ TANDA 29 · ¿QUÉ COMPROBACIÓN HA VISTO SU ROJO? — la auditoría de los
//     instrumentos. ⛔ NO ARREGLA NADA.
//
//   node src/auditoria-guardianes.js            # el censo y la clasificación
//   node src/auditoria-guardianes.js --mutar    # + provocar rojos de verdad (lento)
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE
// ═════════════════════════════════════════════════════════════════════════════
//   **Cinco tandas seguidas con el arnés mintiendo** —nº98, nº101, nº106, nº108,
//   nº115— y **cuatro de las cinco DABAN VERDE**. No fallaban: daban por bueno lo
//   que no habían probado.
//
//   ⇒ La pregunta no es «¿cuántas comprobaciones están rotas?». Es:
//     **«¿cuántas de las que están en verde no han probado nada?»**
//
//   ⭐ Y la separa una prueba muy simple: **una contraprueba solo vale si alguien
//     le ha visto el ROJO.** Si nunca se ha puesto roja, no sabemos si puede.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ ESTE FICHERO ES TAMBIÉN UN INSTRUMENTO, Y TAMBIÉN MIENTE
// ═════════════════════════════════════════════════════════════════════════════
//   Todo lo de aquí se apoya en dos cosas, y las dos pueden fallar:
//
//   1 · **El extractor** (§A1) lee el código con expresiones regulares. Si se
//       dejara comprobaciones fuera, el censo saldría corto **y parecería
//       tranquilizador**. ⇒ lleva positivo de control: tiene que reproducir el
//       recuento de `grep -c`, que es un contador INDEPENDIENTE.
//   2 · **El clasificador del «rojo visto»** (§A2) es TEXTUAL: busca marcas en el
//       código. ⛔ Eso es una heurística, no una medida, y se declara. ⇒ §B la
//       verifica **provocando rojos de verdad**, y no solo en las que dice SOLO
//       VERDE: también en las que dice ROJO VISTO, porque un clasificador se
//       puede equivocar en las dos direcciones.
//
//   ⚠️ Y si la auditoría sale limpia, **sospecha del auditor**: van treinta y tres
//      tandas con algo torcido en las treinta y tres.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const A = require('./alarma');

const SRC = __dirname;
const RAIZ = path.join(__dirname, '..');

// ── qué ficheros ejecuta la batería (los MISMOS que `probar-paradas.js`) ─────
// ⛔ No se copia la lista: se lee del propio `probar-paradas.js`, que es quien la
//   declara. Copiarla crearía un segundo camino que diverge (ley 56).
function modulosDeLaBateria() {
  const s = fs.readFileSync(path.join(SRC, 'probar-paradas.js'), 'utf8');
  const m = /const MODULOS = new Set\(\[([\s\S]*?)\]\);/.exec(s);
  if (!m) return null;
  const out = new Set();
  for (const x of m[1].match(/'[^']+'/g) || []) out.add(x.slice(1, -1));
  out.add('probar-paradas.js');
  out.add('auditoria-paradas.js');
  return out;
}

// ── §A1 · EL CENSO ───────────────────────────────────────────────────────────

const TIPOS = ['exige', 'fallo', 'imposible'];

/** Todas las llamadas a la alarma de un fichero, con su línea y su mensaje. */
function comprobacionesDe(fichero) {
  const src = fs.readFileSync(path.join(SRC, fichero), 'utf8');
  const lineas = src.split('\n');
  const out = [];
  for (let i = 0; i < lineas.length; i++) {
    for (const t of TIPOS) {
      const rx = new RegExp('A\\.' + t + '\\(', 'g');
      let m;
      while ((m = rx.exec(lineas[i]))) {
        // el mensaje: la primera cadena entre comillas simples o backticks que
        // aparece a partir de aquí, dentro de las 6 líneas siguientes
        let texto = '';
        for (let k = i; k < Math.min(lineas.length, i + 6) && !texto; k++) {
          const c = /['`]([^'`]{12,})['`]/.exec(k === i ? lineas[k].slice(m.index) : lineas[k]);
          if (c) texto = c[1];
        }
        out.push({ fichero, linea: i + 1, tipo: t, texto: texto || '(sin mensaje legible)' });
      }
    }
  }
  return out;
}

// ── §A1b · LAS DECORATIVAS ───────────────────────────────────────────────────
// ⚠️ Ley 44: **un `⛔` impreso no es un fallo, es texto.** Una línea que imprime
//    un veredicto y NO avisa a la alarma deja pasar el proceso en verde. Aquí se
//    cuentan: no todas son un problema —muchas son informativas— pero la que
//    afirma algo y no puede parar el proceso es una comprobación decorativa.
function decorativasDe(fichero) {
  const src = fs.readFileSync(path.join(SRC, fichero), 'utf8');
  const lineas = src.split('\n');
  const out = [];
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (!/'[^']*⛔[^']*'/.test(l) && !/'[^']*✅[^']*'/.test(l)) continue;
    if (/^\s*\/\//.test(l)) continue;                     // comentario
    if (!/\?|:/.test(l)) continue;                        // no es un ternario de veredicto
    // ⭐ ¿hay un `A.exige` en las 4 líneas de alrededor?
    let cerca = false;
    for (let k = Math.max(0, i - 4); k <= Math.min(lineas.length - 1, i + 4); k++) {
      if (/A\.(exige|fallo|imposible)\(/.test(lineas[k])) { cerca = true; break; }
    }
    if (!cerca) out.push({ fichero, linea: i + 1, texto: l.trim().slice(0, 96) });
  }
  return out;
}

// ── §A2 · EL CLASIFICADOR TEXTUAL DEL «ROJO VISTO» ───────────────────────────
// ⛔⛔ ESTO ES UNA HEURÍSTICA, NO UNA MEDIDA, y por eso va declarado aquí y
//    verificado en §B. Marca ROJO VISTO cuando cerca de la comprobación hay
//    evidencia escrita de que alguien la puso roja a propósito.
const MARCAS = [
  /su ROJO, visto/i, /ROJO.{0,20}VISTO/i, /se le provoca/i, /a prop[oó]sito/i,
  /contraprueba/i, /positivo de control/i, /control negativo/i, /cepo/i,
  /tiene que (fallar|ponerse roja|saltar)/i, /la caza/i,
];
function evidenciaCerca(fichero, linea, radio = 14) {
  const lineas = fs.readFileSync(path.join(SRC, fichero), 'utf8').split('\n');
  // ⚠️ UNA SOLA CORRECCIÓN, Y ES PRINCIPIADA, NO UN AJUSTE: la CABECERA del fichero
  //   —todo lo anterior a `'use strict'`— habla del fichero entero, no de ninguna
  //   comprobación concreta. Contarla como evidencia marcaba de «rojo visto» a
  //   cualquier `A.exige` de un fichero cuya cabecera mencionara «contraprueba», y
  //   así este mismo fichero se autocertificaba. ⛔ Si con esto el control negativo
  //   sigue fallando, el clasificador NO vale, se dice, y no se toca más.
  let cab = lineas.findIndex((l) => /^'use strict'/.test(l));
  if (cab < 0) cab = 0;
  const a = Math.max(cab, linea - 1 - radio), b = Math.min(lineas.length, linea - 1 + radio);
  const trozo = lineas.slice(a, b).join('\n');
  return MARCAS.some((rx) => rx.test(trozo));
}

module.exports = { comprobacionesDe, decorativasDe, evidenciaCerca, modulosDeLaBateria, MARCAS };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(62)} ${v}`);
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '—');
  const T0 = Date.now();

  const MODULOS = modulosDeLaBateria();
  A.exige(MODULOS && MODULOS.size > 5, 'no se ha podido leer la lista MODULOS de probar-paradas.js: el censo no sabría qué ejecuta la batería');
  const todos = fs.readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();
  const ejecutables = todos.filter((f) => !MODULOS.has(f));

  log('='.repeat(112));
  log('¿QUÉ COMPROBACIÓN HA VISTO SU ROJO? — auditoría de los instrumentos');
  log('='.repeat(112));
  di('ficheros `.js` en src/', todos.length);
  di('   …que la batería EJECUTA como script', ejecutables.length);
  di('   …que son módulos y no se ejecutan solos', MODULOS.size);

  // ── A1 · el censo, con su positivo de control ──────────────────────────────
  log('');
  log('A1 · ⭐ EL CENSO — todas las llamadas a la alarma');
  log('='.repeat(112));
  const censo = [];
  for (const f of todos) censo.push(...comprobacionesDe(f));
  log('');
  log('   ⭐⭐ POSITIVO DE CONTROL DEL EXTRACTOR, antes de fiarse de un solo número:');
  log('      el censo tiene que reproducir lo que cuenta `grep -o`, que es un contador');
  log('      INDEPENDIENTE de este código (ley 55).');
  {
    const g = spawnSync('bash', ['-c',
      `grep -o "A\\.exige(\\|A\\.fallo(\\|A\\.imposible(" ${JSON.stringify(SRC.split(path.sep).join('/'))}/*.js | wc -l`],
    { encoding: 'utf8' });
    const n = parseInt((g.stdout || '0').trim(), 10);
    di('   el extractor encuentra', censo.length);
    di('   `grep -o | wc -l` encuentra', Number.isFinite(n) ? n : '⚠️ NO CONSTA (no hay bash)');
    if (Number.isFinite(n) && n > 0) {
      di('   ⭐ ¿cuadran?', censo.length === n ? '✅ sí' : `⛔ NO — el extractor se deja ${n - censo.length}`);
      A.exige(censo.length === n, `el extractor cuenta ${censo.length} y grep cuenta ${n}: el censo está incompleto`);
    } else {
      log('      ⚠️ NO CONSTA: sin `bash` no hay contador independiente y el censo va sin verificar.');
      A.fallo('el censo no tiene contador independiente: no se puede afirmar que esté completo');
    }
  }
  log('');
  log('   ' + 'fichero'.padEnd(34) + 'exige'.padStart(8) + 'fallo'.padStart(8) + 'imposible'.padStart(11));
  const porFichero = new Map();
  for (const c of censo) {
    if (!porFichero.has(c.fichero)) porFichero.set(c.fichero, { exige: 0, fallo: 0, imposible: 0 });
    porFichero.get(c.fichero)[c.tipo]++;
  }
  for (const [f, v] of [...porFichero.entries()].sort((a, b) => (b[1].exige + b[1].fallo + b[1].imposible) - (a[1].exige + a[1].fallo + a[1].imposible))) {
    log('   ' + f.padEnd(34) + String(v.exige).padStart(8) + String(v.fallo).padStart(8) + String(v.imposible).padStart(11));
  }
  di('⭐ TOTAL', censo.length);
  di('   ficheros CON alguna comprobación', porFichero.size);
  di('   ⚠️ ficheros ejecutables SIN NINGUNA', ejecutables.filter((f) => !porFichero.has(f)).length);
  for (const f of ejecutables.filter((f) => !porFichero.has(f))) log('      · ' + f);

  // ── A1b · las decorativas ──────────────────────────────────────────────────
  log('');
  log('A1b · ⚠️⚠️ LAS DECORATIVAS — imprimen un veredicto y NO avisan a la alarma');
  log('='.repeat(112));
  log('   Ley 44: **un `⛔` impreso no es un fallo, es texto.** Si el proceso acaba en 0, el');
  log('   fallo no existe para nadie que no lea la salida entera a mano. Aquí van las líneas');
  log('   que imprimen ✅/⛔ sin ningún `A.exige` a menos de cuatro líneas.');
  const deco = [];
  for (const f of todos) deco.push(...decorativasDe(f));
  log('');
  di('líneas que imprimen un veredicto sin alarma cerca', deco.length);
  {
    const c = new Map();
    for (const d of deco) c.set(d.fichero, (c.get(d.fichero) || 0) + 1);
    for (const [f, v] of [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
      log('      ' + String(v).padStart(4) + '  ' + f);
    }
  }
  log('   ⚠️ ⛔ NO todas son un problema: muchas son informativas («⭐ suman 98.774 ✅»), y esa');
  log('      distinción NO la sabe hacer una expresión regular. **Este número es un TECHO, no');
  log('      un recuento de fallos** — y se dice antes de que nadie lo lea como tal.');
  log('   ⇒ lo que sí es objetivo: cada una de ésas **no puede poner el proceso en rojo**.');

  // ── A2 · la clasificación ──────────────────────────────────────────────────
  log('');
  log('A2 · ⭐⭐ ¿SE LE HA VISTO EL ROJO? — clasificación TEXTUAL (heurística, ver §B)');
  log('='.repeat(112));
  log('   ⛔ Esto NO es una medida: es un buscador de marcas en el código. Marca ROJO VISTO');
  log('      cuando a menos de 14 líneas hay evidencia escrita de que alguien la puso roja.');
  log('   ⇒ §B lo verifica provocando rojos DE VERDAD, y no solo en las SOLO VERDE: también');
  log('     en las que dice ROJO VISTO, porque un clasificador falla en las dos direcciones.');
  for (const c of censo) c.evidencia = evidenciaCerca(c.fichero, c.linea);
  const conEv = censo.filter((c) => c.evidencia).length;
  log('');
  di('⭐ con evidencia escrita de contraprueba cerca', `${conEv}   (${pct(conEv, censo.length)})`);
  di('⚠️ SIN evidencia — sospechosas por definición', `${censo.length - conEv}   (${pct(censo.length - conEv, censo.length)})`);
  log('');
  log('   ⭐ POSITIVO DE CONTROL DEL CLASIFICADOR: tiene que marcar las que sabemos que SÍ');
  log('      tienen su rojo visto y escrito. Se comprueba con tres conocidas:');
  {
    const CONOCIDAS = [
      ['probar-visor-nombre-simple.js', /sin colapsar el verde no hay discrepancias/],
      ['modelo.js', /el hash no distingue un grafo mutado/],
      ['probar-modelo-obligatorio.js', /el precargado que rompe el modelo no llega a cargarse/],
    ];
    let ok = 0;
    for (const [f, rx] of CONOCIDAS) {
      const c = censo.find((x) => x.fichero === f && rx.test(x.texto));
      const v = c ? c.evidencia : null;
      log('      ' + f.padEnd(36) + (c ? (v ? '✅ la marca' : '⛔ NO la marca') : '⛔ NI LA ENCUENTRA'));
      if (c && v) ok++;
    }
    A.exige(ok === CONOCIDAS.length, `el clasificador solo reconoce ${ok} de 3 comprobaciones con rojo visto conocido: no vale`);
    log('      ⇒ y el NEGATIVO: una comprobación sin ninguna marca alrededor NO debe salir marcada.');
    const limpia = censo.find((x) => x.fichero === 'auditoria-guardianes.js' && /lista MODULOS/.test(x.texto));
    const negOk = !!limpia && !limpia.evidencia;
    log('      ' + 'la de este mismo fichero (sin contraprueba)'.padEnd(36)
      + (limpia ? (limpia.evidencia ? '⛔ la marca y no debería' : '✅ no la marca') : '⚠️ no encontrada'));
    // ⛔⛔ ESTO ES UN `A.exige` Y NO UN AVISO, A PROPÓSITO: en la primera versión era
    //   una línea impresa, salió ⛔ **y el proceso terminó en verde**. Es la ley 44
    //   dentro de la auditoría que viene a buscar exactamente eso (bitácora nº116).
    A.exige(negOk, 'el control NEGATIVO del clasificador falla: marca como «rojo visto» algo que no lo tiene');
  }

  log('');
  log('   ' + 'fichero'.padEnd(34) + 'total'.padStart(7) + 'con marca'.padStart(11) + 'SIN marca'.padStart(11));
  const filas = [];
  for (const [f] of porFichero) {
    const l = censo.filter((c) => c.fichero === f);
    filas.push([f, l.length, l.filter((c) => c.evidencia).length]);
  }
  for (const [f, n, e] of filas.sort((a, b) => (b[1] - b[2]) - (a[1] - a[2]))) {
    log('   ' + f.padEnd(34) + String(n).padStart(7) + String(e).padStart(11)
      + String(n - e).padStart(11) + (n - e > 6 ? '   ⚠️' : ''));
  }

  log('');
  log('   ⛔⛔ VEREDICTO SOBRE EL CLASIFICADOR: **NO VALE, y se deja roto a propósito.**');
  log('      Su control negativo falla y NO se toca más: ajustarlo hasta que pase sería');
  log('      ajustar el instrumento al resultado, que es lo que este proyecto tiene prohibido.');
  log('      ⭐ Y el porqué es interesante: la comprobación que se le da como negativo SÍ tiene');
  log('        un «positivo de control» catorce líneas más abajo… **pero es el de OTRA cosa.**');
  log('        ⇒ **la proximidad no implica que la marca hable de ESA comprobación.** Una');
  log('          heurística de cercanía no puede distinguir «tiene contraprueba» de «vive en un');
  log('          barrio donde las hay».');
  log('   ⇒ ⭐ La tabla de arriba se queda como **lista de sospechosas a mutar**, no como');
  log('     clasificación. Lo que clasifica de verdad es §B, y se ejecuta con `--mutar`.');

  if (process.argv.includes('--mutar')) mutar(log, di, censo);
  else {
    log('');
    log('   ⚠️ §B NO SE HA EJECUTADO. Corre `node src/auditoria-guardianes.js --mutar` para');
    log('      provocar los rojos de verdad. Sin eso, esta salida es un censo, no una auditoría.');
  }

  log('');
  log(A.cierre('AUDITORÍA DE GUARDIANES'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

// ═════════════════════════════════════════════════════════════════════════════
// §B · ⭐⭐⭐ PROVOCARLES EL ROJO — la única medida de verdad de esta tanda
// ═════════════════════════════════════════════════════════════════════════════
//   Se rompe a propósito lo que cada comprobación vigila y se mira si se pone
//   roja. ⛔ Desde FUERA, con un `--require`: no se toca una línea de producción.
//
//   ⭐⭐ Y ANTES DE FIARSE DE NINGÚN ROJO, LAS CUATRO TRAMPAS QUE YA NOS HAN PILLADO:
//     1 · ¿la palanca está CONECTADA? → el preload escribe en un fichero-testigo
//         **cuántas veces parcheó de verdad**. Cero parches = la mutación no ocurrió
//         y el resultado no dice nada (nº106).
//     2 · ¿el proceso llega a ejecutar lo que se prueba, o muere antes? → **el
//         reloj**: se compara con el tiempo de la ejecución BASE del mismo script.
//         Siete scripts de 20-60 s acabando en 14 segundos fue lo que delató el nº106.
//     3 · ¿el rojo es el SUYO? → se exige el mensaje concreto, no «salió en rojo».
//     4 · ¿había línea base? → cada objetivo se ejecuta primero SIN mutar, y sus
//         fallos son los ROJOS VIVOS: los que ya estaban ahí no cuentan como cazados.
function mutar(log, di, censo) {
  const PRE = path.join(os.tmpdir(), 'desplazame-mut-' + process.pid);
  fs.mkdirSync(PRE, { recursive: true });
  const preload = path.join(PRE, 'mut.js');
  const testigo = path.join(PRE, 'testigo.txt').split(path.sep).join('/');
  // ⛔⛔ LA MUTACIÓN SE HACE SOBRE EL **FUENTE**, NO SOBRE LOS EXPORTS — nº117.
  //   La primera versión parcheaba el objeto que devuelve `require`. **Cinco de diez
  //   mutaciones no ocurrieron**, y por un motivo que ahora parece obvio: un módulo
  //   llama a sus propias funciones POR NOMBRE, no a través de su objeto exportado.
  //   `planarizar.js` usa `sinNombrePorDefinicion(t)`, no `exports.sinNombre…`, así
  //   que cambiar el export no cambia nada — **y el script salía «no salta nada»,
  //   que se lee como un hallazgo cuando es un instrumento roto.**
  //   ⇒ se intercepta `Module._extensions['.js']` y se reescribe el CÓDIGO antes de
  //     compilarlo. Y la marca se pone **al compilar**, no al invocar: así distingue
  //     «el parche se instaló» de «el parche se ejecutó», que no es lo mismo.
  fs.writeFileSync(preload, `
    global.__MUT_VIVA = true;
    const fs = require('fs');
    const path = require('path');
    const Module = require('module');
    const CUAL = process.env.MUT_CUAL || '';
    let n = 0;
    const marca = (q) => { n++; try { fs.appendFileSync(${JSON.stringify(testigo)}, q + '\\n'); } catch (e) {} };
    // fichero → [buscar, poner]
    const CAMBIOS = {
      'sin-noaplica':    ['planarizar.js', 'function sinNombrePorDefinicion(t) {', 'function sinNombrePorDefinicion(t) { return false;'],
      'hash-constante':  ['modelo.js',     'function hashGrafo(g) {',              'function hashGrafo(g) { return "siempre-el-mismo";'],
      'resolver-vacio':  ['modelo.js',     'function resolverPorWay(g, M) {',      'function resolverPorWay(g, M) { return new Map();'],
      'paralela-muda':   ['calle-pegada.js','function escanear(idx, g, p, radio, wayExcluido, nucleoDeWay, nombreDeWay) {',
                                            'function escanear(idx, g, p, radio, wayExcluido, nucleoDeWay, nombreDeWay) { return new Map();'],
      'sin-liston':      ['parques.js',    'return indexar(cargarOsm().filter((P) => P.area >= MIN_AREA));',
                                            'return indexar(cargarOsm());'],
      'geo-escalado':    ['geo.js',        'return [x, y];', 'return [x * 1.5, y * 1.5];'],
      'nucleo-constante':['portales.js',   "return palabras.join(' ');", 'return palabras.length ? "siempre lo mismo" : "";'],
    };
    const orig = Module._extensions['.js'];
    Module._extensions['.js'] = function (mod, filename) {
      const c = CAMBIOS[CUAL];
      if (c && path.basename(filename) === c[0]) {
        let src = fs.readFileSync(filename, 'utf8');
        if (src.includes(c[1])) { src = src.replace(c[1], c[2]); marca(c[0]); }
        else marca('⛔ PATRON NO ENCONTRADO en ' + c[0]);
        return mod._compile(src, filename);
      }
      return orig(mod, filename);
    };
    if (CUAL === 'exports-al-final') {
      const rl = fs.readFileSync;
      fs.readFileSync = function (f, o) {
        const s = rl.apply(this, arguments);
        if (typeof f === 'string' && /ruta\\.js$/.test(f) && typeof s === 'string' && s.includes('module.exports')) {
          marca('ruta.js');
          const i = s.indexOf('\\nmodule.exports =');
          const j = s.indexOf(';', i);
          return s.slice(0, i) + s.slice(j + 1) + '\\n' + s.slice(i, j + 1) + '\\n';
        }
        return s;
      };
    }
  `);
  const precargar = (f) => `--require "${f.split(path.sep).join('/')}"`;
  const correr = (script, env) => {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [path.join(SRC, script)],
      { encoding: 'utf8', timeout: 900000, env: { ...process.env, ...env } });
    return { codigo: r.status, salida: (r.stdout || '') + (r.stderr || ''), s: (Date.now() - t0) / 1000 };
  };
  const fallosDe = (salida) => (salida.match(/⛔ FALLO · [^\n]+/g) || []).map((x) => x.replace('⛔ FALLO · ', '').trim());

  log('');
  log('B · ⭐⭐⭐ LOS ROJOS PROVOCADOS');
  log('='.repeat(112));

  // ── B0 · la palanca, comprobada antes de usarla ────────────────────────────
  log('');
  log('   B0 · ⭐ ¿ESTÁ CONECTADA LA PALANCA? — antes de fiarse de ningún rojo (ley 58)');
  {
    const r = spawnSync(process.execPath, ['-e', 'process.exit(global.__MUT_VIVA ? 0 : 9)'],
      { encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: precargar(preload) } });
    di('   el precargado se carga de verdad', r.status === 0 ? '✅ sí' : '⛔ NO — nada de lo de abajo valdría');
    A.exige(r.status === 0, 'el precargado del mutador no se carga: todos los rojos de §B serían falsos');
  }

  // ── B1 · la línea base ─────────────────────────────────────────────────────
  const MUTACIONES = [
    ['geo-escalado', 'calle-pegada.js', /el RADIO del módulo/, 'el umbral de 11 m sale del dato (informe tanda 25 §A3)'],
    ['nucleo-constante', 'calle-pegada.js', /no sale ni una AMBIGUA/, 'que el método produce ambiguas (costura del encargo)'],
    ['paralela-muda', 'calle-pegada.js', /no sale ni una AMBIGUA/, 'que el segundo testigo habla'],
    ['sin-noaplica', 'paso-de-cebra.js', /ningún paso de cebra tenía nombre deducido/, 'los 4.155 pasos e isletas con nombre nuestro'],
    ['sin-noaplica', 'exportar-nombre-simple.js', /./, 'el reparto 51.556/32.258/3.792/11.168'],
    ['sin-liston', 'exportar-nombre-simple.js', /./, 'la decisión «listón 1 ha» (tanda 28)'],
    ['resolver-vacio', 'modelo-rutas.js', /./, 'las siete rutas y su texto (D1)'],
    ['resolver-vacio', 'probar-modelo-obligatorio.js', /sigue saliendo sin nombre|acera de la ruta de control/, 'que el modelo llega al redactor'],
    ['hash-constante', 'modelo.js', /el hash no distingue un grafo mutado/, 'que el modelo no muta el grafo'],
    ['exports-al-final', 'probar-modelo-obligatorio.js', /module\.exports.*DESPU|dependencia circular/, 'la causa raíz del nº105'],
  ];
  const objetivos = [...new Set(MUTACIONES.map((m) => m[1]))];
  log('');
  log('   B1 · ⭐ LA LÍNEA BASE — cada objetivo SIN mutar. Sus fallos son los ROJOS VIVOS:');
  log('        los que ya estaban ahí no cuentan como cazados.');
  const base = new Map();
  for (const o of objetivos) {
    const r = correr(o, {});
    base.set(o, r);
    log('      ' + o.padEnd(34) + `código ${r.codigo}`.padStart(11) + `${r.s.toFixed(1)} s`.padStart(10)
      + '   ' + (fallosDe(r.salida).length ? '⛔ ' + fallosDe(r.salida).length + ' rojo(s) vivo(s)' : '✅ limpio'));
    for (const f of fallosDe(r.salida)) log('         · ' + f.slice(0, 92));
  }

  // ── B2 · las mutaciones ────────────────────────────────────────────────────
  log('');
  log('   B2 · ⭐⭐ LAS MUTACIONES — se rompe, y se mira si canta');
  log('');
  log('   ' + 'mutación'.padEnd(20) + 'objetivo'.padEnd(32) + 'parches'.padStart(9)
    + 'seg'.padStart(8) + 'rojos nuevos'.padStart(14) + '   veredicto');
  const resultados = [];
  for (const [cual, script, rx, sostiene] of MUTACIONES) {
    try { fs.rmSync(path.join(PRE, 'testigo.txt')); } catch (e) { /* no existía */ }
    const r = correr(script, { NODE_OPTIONS: precargar(preload), MUT_CUAL: cual });
    let parches = 0, roto = false;
    try {
      const t = fs.readFileSync(path.join(PRE, 'testigo.txt'), 'utf8').trim().split(/\r?\n/).filter(Boolean);
      parches = t.length;
      roto = t.some((x) => x.includes('PATRON NO ENCONTRADO'));
    } catch (e) { parches = 0; }
    const b = base.get(script);
    const viejos = new Set(fallosDe(b.salida));
    const nuevos = fallosDe(r.salida).filter((f) => !viejos.has(f));
    const suyo = nuevos.some((f) => rx.test(f));
    // ⭐ EL RELOJ: si el script tarda menos de la mitad que su base, murió antes de
    //   llegar a lo que se prueba, y su «rojo» no dice nada (nº106).
    const reloj = r.s >= b.s * 0.5;
    let v;
    if (!parches) v = '⛔⛔ LA MUTACIÓN NO OCURRIÓ — no dice nada';
    else if (roto) v = '⛔⛔ EL PATRÓN A MUTAR YA NO EXISTE — el mutador está caduco';
    else if (!reloj) v = '⚠️ murió pronto (' + r.s.toFixed(0) + 's vs ' + b.s.toFixed(0) + 's base): no vale';
    else if (suyo) v = '✅ ROJO PROVOCADO, y es el suyo';
    else if (nuevos.length) v = '⚠️ salta OTRA cosa, no la esperada';
    else v = '⛔ NO SALTA NADA';
    log('   ' + cual.padEnd(20) + script.padEnd(32) + String(parches).padStart(9)
      + r.s.toFixed(1).padStart(8) + String(nuevos.length).padStart(14) + '   ' + v);
    if (nuevos.length) for (const f of nuevos.slice(0, 3)) log('      ' + ' '.repeat(50) + '· ' + f.slice(0, 84));
    resultados.push({ cual, script, sostiene, parches, nuevos, suyo, v, s: r.s, base: b.s });
  }

  log('');
  log('   ⭐⭐ LO QUE SOSTIENE CADA UNA — la columna que convierte esto en algo útil');
  log('      *«si esta comprobación no probara nada, ¿qué nos habríamos creído?»*');
  log('');
  for (const x of resultados) {
    const ok = x.suyo && x.parches;
    log('   ' + (ok ? '✅' : '⛔') + ' ' + (x.cual + ' → ' + x.script).padEnd(52) + x.sostiene);
  }
  const cazadas = resultados.filter((x) => x.suyo && x.parches).length;
  const mudas = resultados.filter((x) => x.parches && !x.nuevos.length);
  log('');
  di('⭐ mutaciones que provocaron SU rojo', `${cazadas} de ${resultados.length}`);
  di('⛔ mutaciones que NO hicieron saltar NADA', mudas.length);
  for (const x of mudas) log('      ⛔ ' + (x.cual + ' → ' + x.script).padEnd(52) + 'sostenía: ' + x.sostiene);
  A.exige(resultados.every((x) => x.parches > 0),
    'alguna mutación no llegó a aplicarse: su resultado no dice nada y la auditoría estaría midiendo el vacío');
  global._MUT = resultados;
  try { fs.rmSync(PRE, { recursive: true, force: true }); } catch (e) { /* da igual */ }
}
