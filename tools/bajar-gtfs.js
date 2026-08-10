// ⭐⭐⭐ H2 · TANDA 1 · BAJAR LA FICHA 1176 DEL NAP — con código de 004.
//
//   node tools/bajar-gtfs.js            # las cuatro sondas, sin guardar nada
//   node tools/bajar-gtfs.js --guardar  # además, guarda el crudo de la 1176
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ POR QUÉ ESTO **NO** VIVE EN `src/`
// ═════════════════════════════════════════════════════════════════════════════
//   `src/` es el universo de la batería: `probar-paradas.js --todo` ejecuta TODOS
//   los `.js` de esa carpeta, en orden alfabético, y compara el resultado con una
//   tabla declarada. Meter aquí un script que sale a la red significaría:
//     · que la batería depende de que el NAP esté vivo y de que haya clave;
//     · que un invariante del proyecto deja de ser reproducible sin internet;
//     · y una fila nueva en una tabla que esta tanda tiene prohibido mover.
//   ⇒ El descargador vive fuera. **Un invariante no puede depender de un tercero.**
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LA CLAVE NO SE IMPRIME NUNCA
// ═════════════════════════════════════════════════════════════════════════════
//   El repositorio es público desde el commit 1. De la clave salen por pantalla
//   **su longitud y su forma**, nada más. Ni entera, ni truncada, ni en un
//   fichero, ni en un mensaje de error. `.env.local` está cubierto por
//   `.gitignore:28` y eso se comprobó **con un fichero real** antes de que aquí
//   hubiera ninguna clave (bitácora del 10/08).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐ LAS TRES LEYES QUE GOBIERNAN ESTE FICHERO
// ═════════════════════════════════════════════════════════════════════════════
//   LEY 34 · LÍNEA BASE PRIMERO. **Un 200 no es un dato.** Antes de creerse la
//     respuesta buena hay que ver qué contesta el servicio cuando la petición es
//     mala, y de tres formas distintas — si contestara lo mismo a las cuatro, el
//     200 de la buena no probaría nada:
//        S1 · SIN clave        ⇒ ¿exige clave, o el 401 es decorativo?
//        S2 · clave INVENTADA  ⇒ ¿comprueba la clave, o solo que exista la cabecera?
//        S3 · ficha que NO existe ⇒ ¿distingue fichas, o sirve lo mismo a todo?
//        S4 · la 1176
//   LEY 21 · EL SELLO DE FECHA. Se imprimen las cabeceras de fecha y de caché de
//     CADA respuesta. Una réplica es otra fuente y puede servir datos de hace
//     meses con un 200 impecable.
//   LEY 20 · SI EL SERVIDOR EXPLICA SU PROPIO FALLO, eso es una AFIRMACIÓN SUYA.
//     El cuerpo de una respuesta de error se transcribe entre comillas y se
//     etiqueta como lo que es: lo que el servidor dice de sí mismo.
//
// ⛔ Cero dependencias, como todo el proyecto. `node:https` y nada más.

'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const A = require('../src/alarma');

const RAIZ = path.join(__dirname, '..');
const HOY = new Date().toISOString().slice(0, 10);
const FICHA = 1176;
const HOST = 'nap.transportes.gob.es';
const RUTA = (id) => `/api/Fichero/download/${id}`;
const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(34)} ${v}`);

// ── .env.local · lector mínimo. ⛔ El valor no sale de esta función ──────────
function clave() {
  const f = path.join(RAIZ, '.env.local');
  if (!fs.existsSync(f)) return { hay: false, porque: 'no existe ' + f };
  const txt = fs.readFileSync(f, 'utf8');
  const m = txt.split(/\r?\n/)
    .filter((l) => /^\s*NAP_API_KEY\s*=/.test(l))
    .map((l) => l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, ''));
  if (!m.length) return { hay: false, porque: 'el fichero existe y NO tiene NAP_API_KEY' };
  if (m.length > 1) return { hay: false, porque: `NAP_API_KEY aparece ${m.length} veces: no se adivina cuál` };
  if (!m[0]) return { hay: false, porque: 'NAP_API_KEY está pero vacía' };
  return { hay: true, v: m[0] };
}

/** La FORMA de la clave, nunca la clave. Sirve para saber si la pegaron entera. */
function forma(v) {
  return {
    largo: v.length,
    uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v),
    espacios: /\s/.test(v),
    comillas: /["']/.test(v),
  };
}

/**
 * Una petición. Devuelve {status, cabeceras, cuerpo:Buffer, redirige}.
 * ⛔ NO sigue redirecciones a otro host en silencio: las devuelve para que se
 *   digan en voz alta. Un redirect a otra máquina es otra fuente (ley 21).
 */
function pedir(ruta, cabeceras) {
  return new Promise((res, rej) => {
    const req = https.request({ host: HOST, path: ruta, method: 'GET',
      headers: { 'User-Agent': 'desplazame/0.1 (+https://github.com/ablanquez/desplazame)',
        'Accept': '*/*', ...cabeceras } }, (r) => {
      const trozos = [];
      r.on('data', (d) => trozos.push(d));
      r.on('end', () => res({ status: r.statusCode, cabeceras: r.headers, cuerpo: Buffer.concat(trozos) }));
    });
    req.on('error', rej);
    req.setTimeout(120000, () => { req.destroy(new Error('tiempo agotado a los 120 s')); });
    req.end();
  });
}

const CAB_INTERES = ['date', 'last-modified', 'etag', 'age', 'expires', 'cache-control',
  'x-cache', 'via', 'server', 'content-type', 'content-length', 'content-disposition', 'location'];

function contar(et, r) {
  log('');
  log('   ' + '─'.repeat(96));
  log('   ' + et);
  di('estado HTTP', r.status);
  for (const c of CAB_INTERES) if (r.cabeceras[c] !== undefined) di('  ' + c, r.cabeceras[c]);
  di('bytes recibidos', r.cuerpo.length);
  di('sha256', crypto.createHash('sha256').update(r.cuerpo).digest('hex'));
  const zip = r.cuerpo.length >= 4 && r.cuerpo[0] === 0x50 && r.cuerpo[1] === 0x4b;
  di('¿empieza por PK (es un zip)?', zip ? '✅ sí' : '⛔ no');
  // ⭐ LEY 20 · lo que el servidor dice de sí mismo va entre comillas y etiquetado
  if (!zip && r.cuerpo.length) {
    const t = r.cuerpo.toString('utf8').replace(/\s+/g, ' ').trim().slice(0, 300);
    log('   ⚠️ EL SERVIDOR SE EXPLICA — y esto es una AFIRMACIÓN SUYA, no un hecho comprobado:');
    log('      «' + t + '»');
  }
  return { zip };
}

(async () => {
  log('='.repeat(104));
  log('H2 · TANDA 1 · LA FICHA ' + FICHA + ' DEL NAP — cuatro sondas, y la buena es la última');
  log('='.repeat(104));

  const k = clave();
  di('fichero de entorno', '.env.local (⛔ gitignoreado, comprobado con fichero real)');
  if (!k.hay) {
    di('NAP_API_KEY', '⛔ NO DISPONIBLE');
    log('   ⇒ ' + k.porque);
    log('');
    log('   ⛔ PARADA. La clave la pega Antonio en `004/.env.local`, en una línea:');
    log('        NAP_API_KEY=⟨el valor, que este script nunca imprime⟩');
    A.fallo('no hay NAP_API_KEY en .env.local: no se puede pedir nada al NAP');
    return;
  }
  const f = forma(k.v);
  di('NAP_API_KEY', '✅ presente');
  di('  longitud', f.largo + ' caracteres');
  di('  ¿tiene forma de UUID?', f.uuid ? '✅ sí' : '⚠️ NO — puede estar recortada o llevar sobras');
  di('  ¿lleva espacios o comillas?', (f.espacios || f.comillas) ? '⚠️ SÍ — sospechoso' : 'no');

  // ── S1 · SIN clave ────────────────────────────────────────────────────────
  const s1 = await pedir(RUTA(FICHA), {});
  contar('S1 · la ficha ' + FICHA + ' SIN cabecera ApiKey   ⇒ ¿de verdad exige clave?', s1);

  // ── S2 · clave inventada, con la MISMA forma que la buena ─────────────────
  // ⛔ inventada de un literal fijo: no se deriva de la real ni por asomo.
  const s2 = await pedir(RUTA(FICHA), { ApiKey: '00000000-0000-4000-8000-000000000000' });
  contar('S2 · la ficha ' + FICHA + ' con una clave INVENTADA con forma de UUID'
    + '\n        ⇒ ¿comprueba la clave, o solo que la cabecera exista?', s2);

  // ── S3 · una ficha que no existe ──────────────────────────────────────────
  const s3 = await pedir(RUTA(999999), { ApiKey: k.v });
  contar('S3 · la ficha 999999 (que no debería existir) CON la clave buena'
    + '\n        ⇒ ¿distingue una ficha de otra, o sirve lo mismo a todo?', s3);

  // ── S4 · la buena ─────────────────────────────────────────────────────────
  const s4 = await pedir(RUTA(FICHA), { ApiKey: k.v });
  const v4 = contar('⭐ S4 · LA FICHA ' + FICHA + ' CON LA CLAVE BUENA', s4);

  log('');
  log('   ' + '═'.repeat(96));
  log('   ⭐⭐ LA LÍNEA BASE, JUNTA — un 200 solo vale si las otras tres NO lo dan');
  log('   ' + 'sonda'.padEnd(46) + 'estado'.padStart(8) + 'bytes'.padStart(12) + '   ¿zip?');
  for (const [et, r] of [['S1 · sin clave', s1], ['S2 · clave inventada', s2],
    ['S3 · ficha inexistente', s3], ['S4 · la 1176 con la clave buena', s4]]) {
    const z = r.cuerpo.length >= 4 && r.cuerpo[0] === 0x50 && r.cuerpo[1] === 0x4b;
    log('   ' + et.padEnd(46) + String(r.status).padStart(8)
      + String(r.cuerpo.length).padStart(12) + '   ' + (z ? '✅' : '—'));
  }
  const discrimina = s4.status === 200 && v4.zip
    && !(s1.status === 200) && !(s2.status === 200) && !(s3.status === 200 && s3.cuerpo.length === s4.cuerpo.length);
  log('');
  di('⇒ ¿el servicio DISCRIMINA?', discrimina ? '✅ sí — el 200 de S4 significa algo'
    : '⛔ NO CONCLUYENTE — mirar la tabla de arriba antes de creerse nada');

  if (!process.argv.includes('--guardar')) {
    log('');
    log('   ⚠️ Nada guardado. Con `--guardar` se escribe el crudo en data/exploracion/.');
    return;
  }
  if (!v4.zip) {
    A.fallo('S4 no ha devuelto un zip: no se guarda nada y no se sigue');
    return;
  }
  // ⛔ LEY 11 · el crudo se guarda TAL CUAL. Las cabeceras van APARTE, no dentro.
  const base = path.join(RAIZ, 'data', 'exploracion', `${HOY}_nap_gtfs-ficha${FICHA}`);
  fs.writeFileSync(base + '.zip', s4.cuerpo);
  fs.writeFileSync(base + '.cabeceras.txt',
    `# respuesta de https://${HOST}${RUTA(FICHA)}\n`
    + `# capturada ${new Date().toISOString()}\n`
    + `# estado ${s4.status}\n`
    + `# sha256 ${crypto.createHash('sha256').update(s4.cuerpo).digest('hex')}\n`
    + Object.entries(s4.cabeceras).map(([a, b]) => `${a}: ${b}`).join('\n') + '\n', 'utf8');
  log('');
  di('⭐ crudo guardado', path.relative(RAIZ, base + '.zip').replace(/\\/g, '/'));
  di('   cabeceras, aparte', path.relative(RAIZ, base + '.cabeceras.txt').replace(/\\/g, '/'));
  log('   ⛔ El zip NO se edita. Las cabeceras van en su propio fichero para no tocarlo (ley 11).');
})().catch((e) => { A.fallo('la descarga ha reventado: ' + e.message); });
