// LAS COMPROBACIONES DEL VISOR DE RUTAS, antes de que Antonio mire nada.
//
// ⭐ El visor es un instrumento y los instrumentos mienten. Lo que hay que
//    descartar es que **filtre en silencio** o que **pinte otra cosa que la
//    calculada**: las dos producen un «se ve bien» falso, y ésta es la primera vez
//    que alguien mira el producto principal dibujado.
//
// ⚠️ No hay navegador aquí. Se ejecuta el script del HTML en Node contra un
//    Leaflet simulado que CUENTA. Eso descarta que reviente y que se pierda algo
//    por el camino. ⛔ Lo que NO puede descartar: que se vea bien (CSS, orden de
//    capas, colores indistinguibles, tiles). Eso lo dice un ojo, y se declara.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ ¿PUEDE ESTO PASAR O FALLAR SIN QUE NADA FUNCIONE? — escrito ANTES
// ═════════════════════════════════════════════════════════════════════════════
// V0 · ⚠️⚠️ **EL SIMULADOR ES UN INSTRUMENTO** (ley 52). Un Leaflet falso que no
//      registrara nada daría 0 pintados, y si yo esperase 0 pasaría. ⇒ antes de
//      usarlo se le pasa un guion sintético con un número CONOCIDO de polilíneas
//      y se comprueba que cuenta exactamente ése. Sin eso, todo lo de abajo es aire.
//
// V1 · el cuadre metros pintados / calculados **puede pasar por construcción**: los
//      dos números salen del MISMO fichero. ⇒ el contador de verdad se recalcula
//      llamando a `exportar()` en memoria, que vuelve a construir el grafo y a
//      resolver las siete. Eso además caza un `rutas-visor.js` viejo, que es un
//      fallo real y silencioso.
//
// V2 · la contraprueba del tramo falso **puede fallar sin que nada esté mal** si lo
//      que meto no cumple el formato. ⇒ el tramo falso se construye copiando uno
//      real y cambiándole solo lo justo, y se comprueba en los dos sentidos:
//      aparece al meterlo y desaparece al quitarlo.

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const A = require('./alarma');

const HTML = path.join(__dirname, '..', 'tools', 'visor-rutas.html');
const DATOS = path.join(__dirname, '..', 'tools', 'rutas-visor.js');

/** Leaflet simulado: no dibuja, cuenta. */
function leafletFalso(reg) {
  const capa = (tipo) => (...args) => {
    const o = {
      _tipo: tipo, _args: args,
      addTo(d) { (d._items || (d._items = [])).push(o); reg.push({ tipo, args, destino: d._nombre || 'mapa' }); return o; },
      bindPopup(h) { o._popup = h; return o; },
      setStyle() { return o; },
      getBounds() { return { _b: true }; },
    };
    return o;
  };
  const L = {
    tileLayer: capa('tile'),
    polyline: capa('polyline'),
    circleMarker: capa('circleMarker'),
    marker: capa('marker'),
    rectangle: capa('rectangle'),
    layerGroup: () => {
      const g = { _nombre: 'grupo', _items: [], addTo(d) { reg.push({ tipo: 'grupo', destino: 'mapa' }); return g; } };
      return g;
    },
    DomUtil: { create: () => ({ innerHTML: '', querySelector: () => null }) },
    DomEvent: { disableClickPropagation: () => {} },
  };
  L._m = { _nombre: 'mapa', setView: () => L._m, fitBounds: () => L._m, on: () => L._m, removeLayer: () => L._m };
  L.map = () => L._m;
  L.control = () => { const c = { onAdd: null, addTo() { if (c.onAdd) c.onAdd({}); return c; } }; return c; };
  return L;
}

function ejecutar(datosJs) {
  const html = fs.readFileSync(HTML, 'utf8');
  const bloques = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1]);
  const codigo = bloques[bloques.length - 1];
  const reg = [];
  const ctx = {
    window: {},
    document: { body: {}, getElementById: () => ({}), querySelector: () => null,
      addEventListener: () => {} },
    console: { log: () => {} },
  };
  ctx.L = leafletFalso(reg);
  vm.createContext(ctx);
  vm.runInContext(datosJs, ctx);
  vm.runInContext(codigo, ctx);
  return { reg, R: ctx.window.RUTAS, V: ctx.window.VISOR };
}

const log = console.log;
const di = (k, v) => log(`   ${String(k).padEnd(52)} ${v}`);
const T0 = Date.now();

// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(100));
log('V0 · ⭐⭐ EL SIMULADOR ES UN INSTRUMENTO — se verifica ANTES de usarlo (ley 52)');
log('   Un Leaflet falso que no registrara nada daría 0 pintados. Si yo esperase 0,');
log('   pasaría. Se le pasa un guion con un número CONOCIDO y se comprueba.');
{
  const reg = [];
  const L = leafletFalso(reg);
  const ctx = { L, window: {}, document: { addEventListener: () => {} }, console: { log: () => {} } };
  vm.createContext(ctx);
  // 5 polilíneas al mapa, 3 a un grupo, 2 circleMarker. Números elegidos a mano.
  vm.runInContext(`
    const m = L.map('x');
    for (let i = 0; i < 5; i++) L.polyline([[0,0],[1,1]]).addTo(m);
    const g = L.layerGroup();
    for (let i = 0; i < 3; i++) L.polyline([[0,0],[1,1]]).addTo(g);
    for (let i = 0; i < 2; i++) L.circleMarker([0,0]).addTo(g);
  `, ctx);
  const pol = reg.filter((r) => r.tipo === 'polyline').length;
  const cm = reg.filter((r) => r.tipo === 'circleMarker').length;
  di('polilíneas registradas (esperadas 8)', pol + (pol === 8 ? '  ✅' : '  ⛔'));
  di('círculos registrados (esperados 2)', cm + (cm === 2 ? '  ✅' : '  ⛔'));
  A.exige(pol === 8 && cm === 2, 'el Leaflet simulado no cuenta lo que se le pinta: nada de lo de abajo vale');
  // ⭐ y el negativo: lo que NO se pinta no se cuenta
  const antes = reg.length;
  vm.runInContext('L.polyline([[0,0],[1,1]]);', ctx);   // sin addTo
  di('una polilínea creada y NO añadida', (reg.length - antes) + '  ' + (reg.length === antes ? '✅ no la cuenta' : '⛔ cuenta de más'));
  A.exige(reg.length === antes, 'el simulador cuenta cosas que no se han añadido al mapa');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('V1 · ¿EJECUTA EL VISOR CON EL FICHERO REAL?');
if (!fs.existsSync(DATOS)) {
  A.fallo('no existe tools/rutas-visor.js — hay que ejecutar `node src/exportar-rutas.js` antes');
  log(A.cierre('VISOR DE RUTAS'));
  process.exit(1);
}
const datos = fs.readFileSync(DATOS, 'utf8');
di('tamaño de tools/rutas-visor.js', (Buffer.byteLength(datos) / 1024).toFixed(1) + ' kB');
let r;
try {
  r = ejecutar(datos);
  log('   ✅ el script del visor se ejecuta sin lanzar con los datos reales');
} catch (e) {
  A.fallo('el visor de rutas revienta: ' + e.message);
  log(A.cierre('VISOR DE RUTAS'));
  process.exit(1);
}
const R = r.R, V = r.V;
if (!V) { A.fallo('el visor no expone window.VISOR: no se puede comprobar'); process.exit(1); }

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('V2 · ⭐⭐ EL CUADRE — lo PINTADO contra lo CALCULADO, ruta por ruta');
log('   ⛔ Y el contador de la derecha NO sale del fichero: se recalcula llamando al');
log('      motor en memoria. Comparar el fichero consigo mismo no demuestra nada, y');
log('      de paso esto caza un `rutas-visor.js` viejo, que es un fallo silencioso.');
const { exportar } = require('./exportar-rutas');
const fresco = exportar();
log('');
log('   ' + 'nº'.padEnd(4) + 'tramos pintados'.padStart(17) + 'metros pintados'.padStart(17)
  + '   ' + 'motor (recalculado)'.padStart(20) + '   dif');
let cuadraTodo = true;
for (const ru of R.rutas) {
  const c = V.CUENTA.porRuta[ru.n];
  const f = fresco.rutas.find((x) => x.n === ru.n);
  if (!ru.encontrada || !f || !f.encontrada) {
    log('   ' + String(ru.n).padEnd(4) + '⛔ sin camino'); continue;
  }
  const dif = c.metrosPintados - f.metros;
  const ok = Math.abs(dif) < 1.0 && c.tramos === f.tramos.length;
  if (!ok) cuadraTodo = false;
  log('   ' + String(ru.n).padEnd(4) + String(c.tramos).padStart(17)
    + `${c.metrosPintados.toFixed(1)} m`.padStart(17)
    + '   ' + `${f.metros.toFixed(1)} m · ${f.tramos.length} tramos`.padStart(20)
    + '   ' + `${dif >= 0 ? '+' : ''}${dif.toFixed(2)}`.padStart(7) + '  ' + (ok ? '✅' : '⛔'));
  A.exige(ok, `la ruta nº${ru.n}: el visor pinta ${c.metrosPintados.toFixed(1)} m en ${c.tramos} tramos y el motor da ${f.metros.toFixed(1)} m en ${f.tramos.length}`);
}
log('');
di('⇒ ¿cuadran las siete?', cuadraTodo ? '✅ SÍ — lo pintado es lo calculado' : '⛔ NO — parar aquí');
di('tramos pintados en total', V.CUENTA.tramos);
di('   de ellos, destacados por llevar aviso', V.CUENTA.avisos);
di('marcas de origen y destino', V.CUENTA.marcas + '   (esperadas ' + (2 * R.rutas.filter((x) => x.encontrada).length) + ')');
A.exige(V.CUENTA.marcas === 2 * R.rutas.filter((x) => x.encontrada).length,
  'no se pinta un origen y un destino por cada ruta resuelta');
di('líneas portal→enganche dibujadas', V.CUENTA.enganches);

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('V3 · ⭐ CONTRAPRUEBA: SE PLANTA UN TRAMO FALSO Y TIENE QUE VERSE');
log('   Un visor que se traga en silencio lo que no entiende es peor que no tenerlo.');
{
  const base = JSON.parse(datos.replace(/^window\.RUTAS = /, '').replace(/;\s*$/, ''));
  const r1 = base.rutas.find((x) => x.encontrada);
  const antes = V.CUENTA.tramos;
  // ⛔ el tramo falso se copia de uno REAL y solo se le cambia lo justo: si lo
  //    inventara entero, un fallo de formato se leería como «el visor filtra».
  const falso = JSON.parse(JSON.stringify(r1.tramos[0]));
  falso.n = 999;
  falso.frase = 'TRAMO FALSO DE PRUEBA';
  falso.metros = 1234.5;
  falso.g = [[41.60, -0.95], [41.70, -0.82]];
  falso.metrosPintados = 1234.5;
  r1.tramos.push(falso);
  const conFalso = 'window.RUTAS = ' + JSON.stringify(base) + ';';
  const r2 = ejecutar(conFalso);
  di('tramos pintados SIN el falso', antes);
  di('tramos pintados CON el falso', r2.V.CUENTA.tramos);
  const seVe = r2.V.CUENTA.tramos === antes + 1;
  di('  ⇒', seVe ? '✅ SE VE, y el contador lo declara' : '⛔ NO SE VE — el visor filtra en silencio');
  A.exige(seVe, 'el tramo falso no aparece: el visor filtra en silencio');
  // y desaparece al quitarlo
  r1.tramos.pop();
  const r3 = ejecutar('window.RUTAS = ' + JSON.stringify(base) + ';');
  di('tramos pintados tras BORRARLO', r3.V.CUENTA.tramos);
  const borrado = r3.V.CUENTA.tramos === antes;
  di('  ⇒', borrado ? '✅ ya no está' : '⛔ sigue ahí');
  A.exige(borrado, 'el tramo falso sigue pintándose después de borrarlo');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('V4 · ⭐ EL TEXTO DEL MAPA ES EL TEXTO DE LA TERMINAL');
log('   No «parecido»: la misma cadena. Salen los dos de `src/relato.js`.');
{
  // ⛔⛔ «la frase existe y no está vacía» NO es una comprobación: pasaría con
  //    cualquier texto. Se comparan las CADENAS, una a una, en dos frentes:
  //      (1) el fichero que va a leer el navegador contra el motor recalculado
  //      (2) la frase del mapa contra la línea que imprime la terminal
  //    El (1) caza un `rutas-visor.js` viejo; el (2), que alguien redacte aparte.
  const Rel = require('./relato');
  const enDisco = JSON.parse(datos.replace(/^window\.RUTAS = /, '').replace(/;\s*$/, ''));
  let n1 = 0, ok1 = 0, primeraDif = null;
  for (const ru of fresco.rutas) {
    if (!ru.encontrada) continue;
    const d = enDisco.rutas.find((x) => x.n === ru.n);
    if (!d || !d.encontrada) continue;
    for (let i = 0; i < ru.tramos.length; i++) {
      n1++;
      const a = ru.tramos[i], b = d.tramos[i];
      const igual = b && a.frase === b.frase && a.metros === b.metros
        && a.avisos.join('|') === (b.avisos || []).join('|');
      if (igual) ok1++;
      else if (!primeraDif) primeraDif = `ruta ${ru.n} tramo ${i + 1}: «${a.frase}» contra «${b ? b.frase : '—'}»`;
    }
  }
  di('(1) frases del fichero == frases del motor recalculado', `${ok1} de ${n1}`
    + (ok1 === n1 ? '  ✅' : '  ⛔ ' + primeraDif));
  A.exige(ok1 === n1, 'el fichero del visor no dice lo mismo que el motor: está viejo o alguien lo edita a mano');

  // ⭐⭐ (2) LA COMPARACIÓN DURA, y ésta sí puede fallar: se calcula la ruta nº2
  //    **desde el motor**, se genera **el texto que vería la terminal**, y se
  //    busca dentro cada frase del FICHERO DEL MAPA. Si el visor redactara por su
  //    cuenta —o si el fichero fuera de otro día— alguna frase no estaría.
  //    ⛔ Comparar el fichero consigo mismo sería trivialmente cierto: eso no es
  //       una comprobación, es un espejo. (Lo escribí así primero.)
  {
    const D = require('./direccion');
    const G = require('./grafo');
    const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
    const gg = construir(ZONA_TERMINO);
    const cc = D.abrir(gg, CRUDO);
    // ⛔ TANDA 24 · la terminal de esta comparación tiene que llevar el MISMO modelo
    //    que el exportador. Si uno lo lleva y el otro no, esto comparaba dos textos
    //    distintos y salía verde porque los dos estaban igual de incompletos.
    const Mo = require('./modelo');
    const modeloDeWay = Mo.construirModelo(gg, cc.enganche.portales.filter((o) => o.enganchado)).modeloDeWay;
    const a = D.punto('Calle Manifestación 6', cc), b = D.punto('Calle Don Jaime I 17', cc);
    const res = G.rutaEntre(gg, a, b);
    const terminal = Rel.texto(res, { origen: 'Calle Manifestación 6', destino: 'Calle Don Jaime I 17',
      nombreDeWay: cc.nombreDeWay, rodeo: res.metros / Math.hypot(a.m[0] - b.m[0], a.m[1] - b.m[1]),
      engancheOrigen: a.d, engancheDestino: b.d, modelo: modeloDeWay });
    const d2 = enDisco.rutas.find((x) => x.n === 2);
    let dentro = 0, ausente = null;
    for (const t of d2.tramos) {
      if (terminal.includes(t.frase)) dentro++;
      else if (!ausente) ausente = t.frase;
    }
    di('(2) frases del MAPA presentes en el TEXTO de la terminal', `${dentro} de ${d2.tramos.length}`
      + (dentro === d2.tramos.length ? '  ✅' : '  ⛔ falta: ' + ausente));
    A.exige(dentro === d2.tramos.length, 'una frase del mapa no aparece en el texto de la terminal: hay dos redactores');
    // ⭐ POSITIVO DE CONTROL de esta comprobación: una frase que NO existe tiene
    //    que dar negativo. Si diera positivo, `includes` estaría roto y el ✅ de
    //    arriba no valdría nada.
    const inventada = 'Por Calle Que No Existe De Prueba (acera)';
    di('   ⭐ control: una frase inventada, ¿aparece?', terminal.includes(inventada)
      ? '⛔ SÍ — la comprobación está rota' : '✅ NO — la comprobación distingue');
    A.exige(!terminal.includes(inventada), 'la comprobación de frases da positivo con una frase inventada');
  }
  di('   redactor único usado por los dos', 'relato.tramo() · tramos() · geometria() · minutos()');
}

// ═════════════════════════════════════════════════════════════════════════════
log('');
log('V5 · ⚠️ LO QUE ESTO **NO** DEMUESTRA');
log('   · que se vea bien: colores distinguibles, capas tapándose, tamaño de los');
log('     círculos, legibilidad de la leyenda. Eso solo lo dice un ojo delante del');
log('     navegador, y no lo tengo.');
log('   · que el fondo de OSM coincida con el grafo: es la MISMA fuente, así que si');
log('     una calle está mal, estará igual de mal en los dos. **El fondo sitúa, no');
log('     verifica.**');
log('   · que la ruta sea la que andaría una persona. Eso es exactamente lo que');
log('     Antonio tiene que contestar mirándolo.');

log('');
log(A.cierre('VISOR DE RUTAS'));
di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
