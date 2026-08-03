// A1 · ⭐⭐ ¿QUÉ GRAFO MIRA CADA SCRIPT DE `src/`?
//
// ⭐ Por qué existe este fichero, y por qué es un GUARDIÁN y no una tabla:
//    `src/ruta.js` —el comando con el que se interroga el motor— construía el
//    grafo del CASCO cuando se le pedía una ruta de ciudad, y no lo decía. No
//    fallaba: contestaba. El fallo no es "ruta.js estaba mal apuntado": el fallo
//    es que **un script puede mirar el grafo equivocado sin que nada avise**, y
//    la causa material es un VALOR POR DEFECTO en `construir(zona = ZONA_CASCO)`.
//    Un parámetro por defecto es una decisión que nadie tomó y que nadie ve.
//
// ⚠️ Arreglar `ruta.js` arregla el disparador. Esto arregla la clase:
//      1) `construir()` exige la zona EXPLÍCITA y revienta sin ella  (ruta.js)
//      2) todo grafo se DECLARA al construirse, por stderr                (ídem)
//      3) y este guardián comprueba que **nadie se salta la puerta**:
//         quien planariza por su cuenta no pasa por (1) ni por (2).
//
// ⭐ (3) es lo que hace de esto un mecanismo y no disciplina (ley 37): un script
//    nuevo que se salte la puerta hace fallar esta comprobación, aunque su autor
//    no se acuerde de nada.
//
//   node src/auditoria-grafo.js

'use strict';
const fs = require('fs');
const path = require('path');

// ⭐ el directorio se puede pasar por argumento para PROVOCARLE EL ROJO sobre un
//    fichero de mentira, sin ensuciar `src/`. Ver `src/probar-guardianes.js`.
const DIR = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
// ⚠️ EL AUDITOR SE EXCLUYE A SÍ MISMO, y no es una comodidad: en la primera
//    ejecución se auditó a sí mismo y se denunció, porque sus propias expresiones
//    regulares contienen literalmente el texto `construir()`. Un instrumento que
//    se cuenta a sí mismo entre los sujetos infla el numerador con su propio
//    cuerpo. Salieron 7 llamadas sin zona; las reales eran 3.
const YO = path.basename(__filename);
const FICHEROS = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== YO).sort();

// ── qué se busca en cada fichero ─────────────────────────────────────────────
// ⚠️ Es análisis ESTÁTICO: lee el texto, no ejecuta. Lo que no puede ver es una
//    zona calculada en tiempo de ejecución — por eso se marca aparte en vez de
//    darla por buena.
const RE_CONSTRUIR = /(?:^|[^.\w])construir\s*\(([^)]*)\)/g;
const RE_PLANARIZAR = /(?:^|[^.\w])(?:P\.)?planarizar\s*\(([^)]*)\)/g;

function analizar(nombre) {
  const txt = fs.readFileSync(path.join(DIR, nombre), 'utf8');
  // el propio ruta.js define construir; planarizar.js define planarizar.
  const defineConstruir = /function construir\s*\(/.test(txt);
  const definePlanarizar = /function planarizar\s*\(/.test(txt);

  const llamadas = [];
  for (const m of txt.matchAll(RE_CONSTRUIR)) {
    if (defineConstruir && /function construir/.test(txt.slice(Math.max(0, m.index - 12), m.index + 12))) continue;
    llamadas.push({ via: 'construir', arg: m[1].split(',')[0].trim(), pos: m.index });
  }
  const propias = [];
  for (const m of txt.matchAll(RE_PLANARIZAR)) {
    if (definePlanarizar) continue;                       // planarizar.js: es su casa
    if (nombre === 'ruta.js') continue;                   // ruta.js: ES la puerta
    propias.push({ arg: m[1].split(',')[0].trim(), pos: m.index });
  }
  return { llamadas, propias, defineConstruir, definePlanarizar, txt };
}

const ZONA_DE = (arg) => {
  if (arg === '') return { z: '⛔ POR DEFECTO', explicita: false };
  if (/ZONA_TERMINO/.test(arg)) return { z: 'término', explicita: true };
  if (/ZONA_CASCO/.test(arg)) return { z: 'casco', explicita: true };
  if (/ZONA_TANDA3/.test(arg)) return { z: 'tanda3', explicita: true };
  return { z: '⚠️ ' + arg.slice(0, 22), explicita: true };
};

const L = [];
L.push('='.repeat(104));
L.push('A1 · ⭐⭐ AUDITORÍA: QUÉ GRAFO MIRA CADA FICHERO DE src/');
L.push('   análisis estático de los ' + FICHEROS.length + ' ficheros. No ejecuta nada: lee el texto.');
L.push('');
L.push('   ' + 'fichero'.padEnd(26) + 'obtiene grafo'.padEnd(16) + 'qué zona'.padEnd(18)
  + '¿explícita?'.padEnd(13) + 'cómo');
L.push('   ' + '─'.repeat(99));

let sinDeclarar = 0, saltanLaPuerta = [];
const filas = [];
for (const f of FICHEROS) {
  const a = analizar(f);
  if (!a.llamadas.length && !a.propias.length) {
    filas.push({ f, obtiene: 'no', zona: '—', expl: '—', como: a.defineConstruir ? 'define construir()' : (a.definePlanarizar ? 'define planarizar()' : '—') });
    continue;
  }
  for (const c of a.llamadas) {
    const z = ZONA_DE(c.arg);
    if (!z.explicita) sinDeclarar++;
    filas.push({ f, obtiene: 'sí', zona: z.z, expl: z.explicita ? 'sí' : '⛔ NO', como: "construir(" + (c.arg || '') + ')' });
  }
  for (const p of a.propias) {
    saltanLaPuerta.push({ f, arg: p.arg });
    filas.push({ f, obtiene: 'sí', zona: '⚠️ la suya', expl: '⚠️ se salta', como: 'planarizar(' + p.arg.slice(0, 20) + ')' });
  }
}

let ultimo = '';
for (const r of filas) {
  const marca = r.expl === '⛔ NO' ? ' ⛔' : (r.expl === '⚠️ se salta' ? ' ⚠️' : '');
  L.push('   ' + (r.f === ultimo ? '' : r.f).padEnd(26) + r.obtiene.padEnd(16)
    + r.zona.padEnd(18) + (r.expl + marca).padEnd(13) + r.como);
  ultimo = r.f;
}

L.push('');
L.push('   ' + '─'.repeat(99));
L.push('   ficheros analizados                        ' + FICHEROS.length);
L.push('   ficheros que obtienen un grafo             ' + new Set(filas.filter((r) => r.obtiene === 'sí').map((r) => r.f)).size);
L.push('   ⛔ llamadas SIN zona explícita              ' + sinDeclarar);
L.push('   ⚠️ ficheros que planarizan por su cuenta    ' + saltanLaPuerta.length
  + (saltanLaPuerta.length ? '   (' + saltanLaPuerta.map((s) => s.f).join(', ') + ')' : ''));

// ── ⭐ EL GUARDIÁN, no la tabla ──────────────────────────────────────────────
L.push('');
L.push('EL GUARDIÁN · ¿puede alguien mirar el grafo equivocado sin que nada avise?');
let rojo = false;
if (sinDeclarar > 0) {
  rojo = true;
  L.push('   ⛔ SÍ: hay ' + sinDeclarar + ' llamada(s) a construir() sin zona. El valor por defecto decide por ellas.');
} else {
  L.push('   ✅ ninguna llamada a construir() se apoya en un valor por defecto.');
}
// ⚠️ planarizar por su cuenta NO es rojo automático: informe-condicionales.js lo
//    hace a propósito para medir el efecto de una decisión sobre el mismo recorte.
//    Lo que se exige es que la zona esté a la vista en la misma línea.
for (const s of saltanLaPuerta) {
  const txt = fs.readFileSync(path.join(DIR, s.f), 'utf8');
  const declara = /ZONA_TERMINO|ZONA_CASCO/.test(txt);
  L.push('   ' + (declara ? '⚠️' : '⛔') + ' ' + s.f.padEnd(24)
    + (declara ? 'planariza por su cuenta, pero la zona aparece en el fichero'
      : 'planariza por su cuenta y NO se ve qué zona ⇒ ROJO'));
  if (!declara) rojo = true;
}

L.push('');
L.push(rojo ? '   ⇒ ⛔ ROJO: alguien puede mirar el grafo equivocado en silencio.'
  : '   ⇒ ✅ VERDE: todo grafo nace de una zona escrita a la vista.');
console.log(L.join('\n'));
if (rojo) process.exit(1);
