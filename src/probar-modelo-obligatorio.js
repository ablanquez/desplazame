// ⛔⛔ TANDA 23 · QUE EL MODELO NO PUEDA VOLVER A NO CARGARSE.
//
//   node src/probar-modelo-obligatorio.js
//
// ═════════════════════════════════════════════════════════════════════════════
// QUÉ PASÓ, Y POR QUÉ ESTO EXISTE
// ═════════════════════════════════════════════════════════════════════════════
//   `node src/ruta.js "…" "…"` imprimía esto **y seguía**:
//
//     ⚠️  sin modelo de vía·forma·papel: The "path" argument must be of type
//         string … Received undefined
//
//   y devolvía la ruta con las aceras como «un tramo sin nombre», como si el
//   método de la tanda 21 no existiera. **Código de salida 0.** Es la ley 44 en su
//   forma más cara: un `⚠️` impreso no es un fallo, es texto.
//
//   La causa: **dependencia circular**. `modelo.js` hace `require('./ruta')` para
//   coger `CRUDO`; cuando `ruta.js` corre como programa, su bloque `require.main`
//   se ejecutaba ANTES de asignar `module.exports`, así que modelo.js recibía `{}`
//   y `CRUDO` salía `undefined`. Node lo estaba avisando y nadie lo leyó:
//     `Warning: Accessing non-existent property 'ZONA_TERMINO' … circular dependency`
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ «¿PUEDE ESTO PASAR (O FALLAR) SIN QUE NADA FUNCIONE?»
// ═════════════════════════════════════════════════════════════════════════════
// 1 · «los exports están arriba» ⚠️ es una comprobación de ORDEN sobre el propio
//     fichero. Puede parecer floja, pero **el orden ERA el fallo**: quien mueva esa
//     línea otra vez vuelve a romperlo. ⇒ se guarda lo que se arregló.
// 2 · «si el modelo no carga, para» ⚠️ **no vale mirarlo a ojo**: hay que ROMPERLO
//     a propósito. Se rompe desde fuera, con un `--require` que hace fallar a
//     `construirModelo`, ⛔ sin tocar una línea del código de producción.
// 3 · «el modelo SÍ entra» ⚠️ y esto es lo que la ejecución rota no comprobaba: se
//     exige que el texto lleve un nombre que **solo** puede venir del modelo.
//     Sin esto, todo lo anterior podría estar verde con el modelo vacío.
// 4 · el barrido de los demás consumidores, y se aborta cada uno en cuanto se
//     sabe el veredicto: interesa el ciclo, no el resultado.

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('./alarma');

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(52)} ${v}`);
const T0 = Date.now();
const RUTA_JS = path.join(__dirname, 'ruta.js');

// ⭐ La ruta de prueba es la que lo destapó. ⛔ No la elijo yo (ley 17).
const ORIGEN = 'Salvador Minguijón 2';
const DESTINO = 'Salvador Minguijón 40';

function correr(args, opciones = {}) {
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 600000, ...opciones });
  return { codigo: r.status, salida: (r.stdout || '') + (r.stderr || '') };
}

/**
 * ⛔⛔ `NODE_OPTIONS` SE COME LAS BARRAS INVERTIDAS, y eso dejó esta prueba entera
 * en verde sin probar nada (bitácora nº106). Con `--require "C:\Users\…"` Node
 * recibe `C:UsersORDENA~1…` y muere con MODULE_NOT_FOUND **antes de arrancar** —
 * o sea, código 1 y ninguna ruta impresa: exactamente lo que la contraprueba
 * esperaba ver. ⇒ la ruta del precargado va con barras normales, SIEMPRE.
 */
const precargar = (f) => `--require "${f.split(path.sep).join('/')}"`;

/** ⭐ Y que el precargado se ha cargado DE VERDAD no se supone: se comprueba. */
function precargadoVivo(f) {
  const r = correr(['-e', 'process.exit(global.__SONDA_VIVA ? 0 : 9)'],
    { env: { ...process.env, NODE_OPTIONS: precargar(f) } });
  return r.codigo === 0;
}

log('='.repeat(96));
log('1 · ⭐ LA CAUSA RAÍZ, GUARDADA — los exports de `ruta.js` van ANTES del bloque CLI');
log('='.repeat(96));
{
  const src = fs.readFileSync(RUTA_JS, 'utf8');
  const iExp = src.indexOf('\nmodule.exports =');
  const iCli = src.indexOf('\nif (require.main === module) {');
  di('línea de `module.exports`', iExp >= 0 ? 'encontrada' : '⛔ NO ESTÁ');
  di('línea de `require.main`', iCli >= 0 ? 'encontrada' : '⛔ NO ESTÁ');
  di('⭐ ¿los exports van ANTES?', iExp >= 0 && iCli >= 0 && iExp < iCli ? '✅ sí' : '⛔ NO — el ciclo vuelve');
  A.exige(iExp >= 0 && iCli >= 0 && iExp < iCli,
    '`module.exports` de ruta.js está DESPUÉS del bloque `require.main`: la dependencia circular vuelve a dejar `CRUDO` undefined');
  log('');
  log('   ⚠️ Es una comprobación de ORDEN, y parece floja. **El orden era el fallo.**');
  log('      Quien mueva esa línea otra vez rompe el modelo en silencio, igual que antes.');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('2 · ⭐⭐ EL MODELO SÍ ENTRA — el positivo de control, y va ANTES del rojo');
log('='.repeat(96));
log('   ⚠️ Sin esto, lo de abajo podría salir verde con el modelo vacío: bastaría con');
log('      que `construirModelo` devolviera algo. ⇒ se exige que el TEXTO lleve un nombre');
log('      que solo puede venir del modelo.');
let salidaBuena = '';
{
  const r = correr([RUTA_JS, ORIGEN, DESTINO]);
  salidaBuena = r.salida;
  di('código de salida', r.codigo + (r.codigo === 0 ? '  ✅' : '  ⛔'));
  A.exige(r.codigo === 0, `la ruta de control sale en ${r.codigo}`);
  const sinAviso = !/sin modelo de v/.test(r.salida);
  di('⭐ NO imprime «sin modelo de vía·forma·papel»', sinAviso ? '✅' : '⛔ SIGUE ROTO');
  A.exige(sinAviso, 'la ruta sigue avisando de que no hay modelo');
  const sinCiclo = !/circular dependency/.test(r.salida);
  di('⭐ NO hay aviso de dependencia circular de Node', sinCiclo ? '✅' : '⛔ EL CICLO SIGUE');
  A.exige(sinCiclo, 'Node sigue avisando de la dependencia circular');
  // ⭐ el positivo de control DE VERDAD: un nombre que solo puede venir del modelo
  const conNombre = /Por Calle Salvador Minguijón/.test(r.salida);
  di('⭐⭐ la acera sale NOMBRADA (venía «sin nombre»)', conNombre ? '✅ «Por Calle Salvador Minguijón»' : '⛔ sigue sin nombre');
  A.exige(conNombre, 'la acera de la ruta de control sigue saliendo sin nombre: el modelo no llega al redactor');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('3 · ⛔⛔ SI EL MODELO NO CARGA, **PARA** — provocado a propósito');
log('='.repeat(96));
log('   Se rompe desde FUERA, con un `--require` que hace fallar a `construirModelo`.');
log('   ⛔ No se toca una línea del código de producción: si hubiera que tocarlo para');
log('      poder probarlo, la prueba estaría probando otro programa.');
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-modelo-'));
  const romper = path.join(tmp, 'romper.js');
  fs.writeFileSync(romper, `
    global.__SONDA_VIVA = true;
    const Module = require('module');
    const orig = Module.prototype.require;
    Module.prototype.require = function (id) {
      const m = orig.apply(this, arguments);
      if (/[\\\\/]modelo$/.test(id) || id === './modelo') {
        return Object.assign({}, m, { construirModelo() {
          throw new Error('ROTO A PROPÓSITO: así fallaba con CRUDO undefined');
        } });
      }
      return m;
    };
  `);
  // ⭐ EL POSITIVO DE CONTROL DE LA PRUEBA: que el precargado se cargue.
  const vivo = precargadoVivo(romper);
  di('⭐ ¿el precargado se ha cargado de verdad?', vivo ? '✅ sí' : '⛔ NO — la contraprueba no probaría nada');
  A.exige(vivo, 'el precargado que rompe el modelo no llega a cargarse: la contraprueba sería falsa');
  const r = correr([RUTA_JS, ORIGEN, DESTINO], { env: { ...process.env, NODE_OPTIONS: precargar(romper) } });
  fs.rmSync(tmp, { recursive: true, force: true });
  di('código de salida con el modelo roto', r.codigo + (r.codigo !== 0 ? '  ✅ PARA' : '  ⛔ SIGUE'));
  const sinRuta = !/TOTAL/.test(r.salida);
  di('⭐ y NO imprime ninguna ruta', sinRuta ? '✅' : '⛔ imprime una ruta sin modelo');
  const motivo = /ROTO A PROPÓSITO/.test(r.salida);
  di('⭐ y el motivo es EL NUESTRO, no otro', motivo ? '✅ «ROTO A PROPÓSITO»' : '⛔ muere por otra cosa');
  A.exige(motivo, 'ruta.js muere por otra razón que no es el modelo roto: la contraprueba no prueba lo que dice');
  A.exige(r.codigo !== 0, 'con el modelo roto, `ruta.js` sigue devolviendo la ruta y saliendo en 0');
  A.exige(sinRuta, 'con el modelo roto, `ruta.js` imprime una ruta igualmente');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('4 · ⭐ EL PORTERO DE `construirModelo` — que el error diga QUÉ mirar');
log('='.repeat(96));
{
  const Mo = require('./modelo');
  const casos = [
    ['sin grafo', () => Mo.construirModelo(null, [])],
    ['sin portales', () => Mo.construirModelo({ aristas: [], zona: {} }, null)],
  ];
  for (const [etq, f] of casos) {
    let msg = null;
    try { f(); } catch (e) { msg = e.message; }
    di(etq, msg ? '✅ lanza: «' + msg.slice(0, 52) + '…»' : '⛔ NO lanza');
    A.exige(!!msg, `construirModelo no protesta con ${etq}`);
  }
  log('');
  log('   ⚠️ El caso que de verdad pasó —`CRUDO` undefined— no se puede provocar desde');
  log('      aquí sin reproducir el ciclo entero, y el ciclo ya no existe. Lo que sí se');
  log('      guarda es su causa (§1) y su consecuencia (§3).');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(96));
log('5 · ⭐⭐ ¿A QUIÉN MÁS LE PASABA? — los demás que cargan el modelo');
log('='.repeat(96));
log('   Cada uno se ejecuta con un `--require` que mira lo que `modelo.js` recibe de');
log('   `./ruta` y **aborta en el acto**: interesa el ciclo, no el resultado.');
{
  const CONSUMIDORES = ['ruta.js', 'rutas-antonio.js', 'modelo.js', 'modelo-rutas.js',
    'donde-falta.js', 'exportar-nombres.js', 'exportar-nombre-simple.js',
    // ⭐ TANDA 25 · éste entra por el ciclo al revés: su informe pide `./modelo`, y
    //   `modelo.js` pide `./calle-pegada` de vuelta. Por eso sus `module.exports`
    //   están ARRIBA, y por eso está en esta lista.
    'calle-pegada.js',
    // ⭐ TANDA 26 · el mismo día que nace, no cuando falle (ley del nº109).
    'paso-de-cebra.js'];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-ciclo-'));
  const sonda = path.join(tmp, 'sonda.js');
  const buzon = path.join(tmp, 'veredicto.txt').replace(/\\/g, '/');
  // ⚠️ El veredicto va a un FICHERO y no a stdout: `process.stdout.write` seguido de
  //    `process.exit()` pierde la salida cuando stdout es una tubería, y la primera
  //    versión de esta sonda daba «no llegó a cargar el modelo» en los siete —
  //    incluidos los que sí cargan. **La sonda mentía en la dirección tranquilizadora.**
  fs.writeFileSync(sonda, `
    global.__SONDA_VIVA = true;
    const fs = require('fs');
    const Module = require('module');
    const orig = Module.prototype.require;
    Module.prototype.require = function (id) {
      const m = orig.apply(this, arguments);
      if (id === './ruta' && /modelo\\.js$/.test(this.filename || '')) {
        fs.writeFileSync(${JSON.stringify(buzon)},
          (typeof m.CRUDO === 'string' && m.CRUDO ? 'ok' : 'UNDEFINED')
          + '|' + ((process.mainModule && process.mainModule.filename) || '?'));
        process.exit(0);
      }
      return m;
    };
  `);
  log('');
  const vivoS = precargadoVivo(sonda);
  di('⭐ ¿la sonda se carga de verdad?', vivoS ? '✅ sí' : '⛔ NO — la tabla de abajo no valdría nada');
  A.exige(vivoS, 'la sonda no llega a cargarse: el barrido no puede opinar');
  log('');
  log('   ' + 'script'.padEnd(30) + 'CRUDO'.padStart(14) + '¿pasaba por el ciclo?'.padStart(24));
  const expuestos = [];
  for (const f of CONSUMIDORES) {
    const args = [path.join(__dirname, f)];
    if (f === 'ruta.js') args.push(ORIGEN, DESTINO);
    if (f === 'rutas-antonio.js') args.push('--modelo');
    if (fs.existsSync(buzon)) fs.rmSync(buzon);
    correr(args, { env: { ...process.env, NODE_OPTIONS: precargar(sonda) } });
    const bruto = fs.existsSync(buzon) ? fs.readFileSync(buzon, 'utf8').trim() : null;
    const [v, principal] = bruto ? bruto.split('|') : [null, null];
    const ok = v === 'ok';
    // ⭐⭐ LA COLUMNA QUE CONTESTA «¿A QUIÉN MÁS LE PASABA?», y vale con el ciclo ya
    //    arreglado: el ciclo mordía SOLO cuando `modelo.js` se cargaba desde dentro
    //    del bloque `require.main` de `ruta.js`. Eso es una CONDICIÓN, no un
    //    síntoma: se puede medir hoy y decir qué habría pasado ayer.
    // ⚠️ el separador puede ser `\` o `/`: en Windows es `\`, y una barra de menos
    //    aquí dejaba la columna entera diciendo «no» — que es la respuesta cómoda.
    const expuesto = !!principal && path.basename(principal) === 'ruta.js';
    log('   ' + f.padEnd(30) + String(v || '(no carga el modelo)').padStart(14)
      + (expuesto ? 'SÍ' : 'no').padStart(24) + '   ' + (ok ? '✅' : v ? '⛔' : '⚠️'));
    A.exige(v !== null, `${f} no llega a cargar el modelo: la sonda no puede opinar`);
    if (v) A.exige(ok, `${f}: modelo.js recibe CRUDO ${v}`);
    if (expuesto) expuestos.push(f);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

log('');
log(A.cierre('EL MODELO ES OBLIGATORIO'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
