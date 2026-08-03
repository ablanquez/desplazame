// A1 · ⛔⛔ ¿QUÉ SCRIPTS DETECTAN UN FALLO Y SIGUEN?
//
// ⭐ Por qué esto existe, y por qué va primero en la tanda 13: la ruta de cordura
//    `Puerta del Carmen → Magdalena` estuvo **DOS TANDAS rota**, publicada en
//    `H1-PRIMER-GRAFO.md` §C4d como correcta, con el `⛔` **impreso en pantalla**
//    y el proceso terminando en 0. **El instrumento ya lo había detectado.**
//    Nadie leyó la línea.
//
// ⇒ **Un `⛔` impreso no es un fallo: es texto.** Si el proceso acaba en 0, el
//   fallo no existe para nada que no sea un ojo humano leyendo la salida entera.
//
// ⚠️ ESTA AUDITORÍA ES EN EJECUCIÓN, NO ESTÁTICA, y no por gusto: el símbolo `⛔`
//    aparece en estos ficheros tanto para declarar un fallo detectado como para
//    escribir prosa ("⛔ NO se copian los portales"). Contar símbolos daría un
//    número inflado. Lo único que separa las dos cosas es **qué código de salida
//    los acompaña**, y eso solo se sabe ejecutando.
//
//   node src/auditoria-paradas.js
//   node src/auditoria-paradas.js --rapido     (salta los que tardan más de 60 s)

'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DIR = __dirname;
const YO = path.basename(__filename);

// ⚠️ se excluyen los que NO son ejecutables (módulos puros) — se detecta mirando si
//    tienen `require.main === module` o si su cuerpo se ejecuta al cargarse.
const MODULOS = new Set(['geo.js', 'grafo.js', 'osm.js', 'planarizar.js', 'portales.js',
  'enganche.js', 'condicionales.js', 'direccion.js', 'limite.js', 'rios.js', 'alarma.js']);

// ⚠️ estos tardan mucho. Se declaran, no se esconden: `--rapido` los salta Y LO DICE.
const LENTOS = new Set(['exportar.js', 'verificar-ciudad.js', 'ciudad.js', 'informe-portales.js',
  'sin-vigilancia.js', 'rutas-antonio.js', 'puerta.js', 'informe-condicionales.js',
  'caminos.js', 'transitabilidad.js', 'probar-visor.js', 'probar-guardianes.js']);

const rapido = process.argv.includes('--rapido');
const FICHEROS = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== YO && !MODULOS.has(f)).sort();

const L = [];
L.push('='.repeat(108));
L.push('A1 · ⛔⛔ ¿QUÉ SCRIPTS DETECTAN UN FALLO Y SIGUEN?  — auditoría EN EJECUCIÓN');
L.push('   se ejecuta cada script, se mira su salida y se compara con su CÓDIGO DE SALIDA.');
L.push('');
L.push('   ' + 'fichero'.padEnd(26) + 'salida'.padEnd(9) + 'líneas ⛔'.padEnd(11)
  + 'segundos'.padEnd(10) + 'veredicto');
L.push('   ' + '─'.repeat(103));

const filas = [];
for (const f of FICHEROS) {
  if (rapido && LENTOS.has(f)) {
    filas.push({ f, saltado: true });
    L.push('   ' + f.padEnd(26) + '(saltado por --rapido, NO por estar bien)');
    continue;
  }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(DIR, f)], { encoding: 'utf8', timeout: 900000 });
  const seg = (Date.now() - t0) / 1000;
  const salida = (r.stdout || '') + (r.stderr || '');
  const codigo = r.status === null ? 'timeout' : r.status;
  // se guardan las líneas con ⛔ para poder CLASIFICARLAS a mano: prosa o fallo.
  const lineas = salida.split(/\r?\n/).filter((l) => l.includes('⛔'));
  const sospechoso = lineas.length > 0 && codigo === 0;
  filas.push({ f, codigo, lineas, seg, sospechoso });
  L.push('   ' + f.padEnd(26) + String(codigo).padEnd(9) + String(lineas.length).padEnd(11)
    + seg.toFixed(1).padEnd(10)
    + (sospechoso ? '⚠️ imprime ⛔ y sale en 0 — hay que mirarlas'
      : lineas.length ? '✅ imprime ⛔ y NO sale en 0' : '· sin ⛔ en la salida'));
}

L.push('');
L.push('   ⚠️ "imprime ⛔ y sale en 0" NO significa todavía "avisa y sigue": el símbolo también');
L.push('      se usa como prosa. Las líneas van abajo, una a una, para clasificarlas.');

L.push('');
L.push('='.repeat(108));
L.push('LAS LÍNEAS, PARA CLASIFICARLAS — clasificar antes de contar (ley 29)');
for (const r of filas) {
  if (r.saltado || !r.lineas || !r.lineas.length) continue;
  L.push('');
  L.push(`   ── ${r.f}   (código de salida ${r.codigo})`);
  for (const l of r.lineas.slice(0, 14)) L.push('      ' + l.trim().slice(0, 100));
  if (r.lineas.length > 14) L.push(`      ⟨${r.lineas.length - 14} líneas más⟩`);
}

const sosp = filas.filter((r) => r.sospechoso);
L.push('');
L.push('   ' + '─'.repeat(103));
L.push('   scripts ejecutados                      ' + filas.filter((r) => !r.saltado).length);
L.push('   saltados por --rapido                   ' + filas.filter((r) => r.saltado).length);
L.push('   ⚠️ con ⛔ en la salida y código 0         ' + sosp.length
  + (sosp.length ? '   (' + sosp.map((r) => r.f).join(', ') + ')' : ''));
console.log(L.join('\n'));
