// Vuelca LAS SIETE RUTAS YA CALCULADAS a un fichero pintable.
//
// ⛔ NO las recalcula con reglas propias: usa las MISMAS funciones que
//    `rutas-antonio.js` —`puntoDe`, `accesoA`, `rutaAEdificio`, `rutaEntre`— y el
//    MISMO redactor (`relato.js`). Un exportador que decide por su cuenta produce
//    un mapa que enseña otra ruta que la terminal, y entonces no se sabe cuál de
//    las dos es el motor. Es la forma exacta del fallo nº68.
//
// ⚠️ Sale como .js con `window.RUTAS = …` y no como .json, por lo mismo que el
//    grafo: un HTML abierto con doble clic no puede hacer `fetch` de un fichero
//    local — el navegador lo bloquea por CORS con `file://`.
//
//   node src/exportar-rutas.js

'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./portales');
const D = require('./direccion');
const G = require('./grafo');
const T = require('./tabla-rutas');
const Co = require('./condicionales');
const Pu = require('./puerta');
const En = require('./entradas');
const Rel = require('./relato');
const A = require('./alarma');
const { puntoDe } = require('./rutas-antonio');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { aGrados, dist } = require('./geo');

const SALIDA = path.join(__dirname, '..', 'tools', 'rutas-visor.js');
const gr = (m) => { const q = aGrados(m[0], m[1]); return [Math.round(q[1] * 1e6) / 1e6, Math.round(q[0] * 1e6) / 1e6]; };

// ⭐ Un color por ruta. Se eligen distinguibles entre sí Y sobre el gris del fondo
//    de OSM. ⛔ No es una decisión de marca: es que dos rutas del mismo color en
//    el casco son una sola ruta para el ojo.
const COLORES = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#008080', '#9a6324'];

function exportar() {
  const tabla = T.leer();
  const lectura = T.informe(tabla);
  if (!lectura.cuadra) throw new Error('⛔ la lectura de RUTAS-CONOCIDAS.md no cuadra: no se exporta nada');

  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const Ent = En.cargar();

  const rutas = [];
  for (const ru of tabla.rutas) {
    const a = puntoDe(ru.o, ctx, g), b = puntoDe(ru.d, ctx, g);
    if (!a || !b) { rutas.push({ n: ru.n, o: ru.o, d: ru.d, encontrada: false, motivo: 'sin-direccion' }); continue; }

    // ⛔ EXACTAMENTE la misma cadena de decisiones que `rutas-antonio.js`
    const aP = a.tipo === 'POI' ? Pu.accesoA(a, g, ctx.eng, null, Ent) : a;
    const bP = b.tipo === 'POI' ? Pu.accesoA(b, g, ctx.eng, null, Ent) : b;
    let res = null, bFin = bP;
    if (bP.puerta) {
      const poli = Pu.edificioDe(b.m, Co.edificios());
      const rr = Pu.rutaAEdificio(G, g, aP, poli, ctx.eng, Ent);
      if (rr.encontrada) { res = rr; bFin = rr.puerta; }
    }
    if (!res) res = G.rutaEntre(g, aP, bFin);
    if (!res.encontrada) { rutas.push({ n: ru.n, o: ru.o, d: ru.d, encontrada: false, motivo: res.motivo }); continue; }

    const recta = dist(aP.m, bFin.m);
    const rodeo = res.metros / recta;
    const ts = Rel.tramos(res, ctx.nombreDeWay);
    const geo = Rel.geometria(g, aP, bFin, res);

    // ⭐ la geometría se agrupa con los MISMOS cortes que el relato: cada tramo
    //    del texto es exactamente una polilínea del mapa. Si no, pinchar un tramo
    //    en el mapa daría el texto de otro.
    const lineas = ts.map((t) => {
      let l = [];
      for (const i of t.pasos) {
        const x = geo[i] || [];
        if (l.length && x.length && Math.hypot(l[l.length - 1][0] - x[0][0], l[l.length - 1][1] - x[0][1]) < 1e-6) {
          l = l.concat(x.slice(1));
        } else l = l.concat(x);
      }
      return l;
    });

    rutas.push({
      n: ru.n, o: ru.o, d: ru.d, encontrada: true,
      metros: res.metros, recta: Math.round(recta * 10) / 10,
      rodeo: Math.round(rodeo * 1000) / 1000,
      rodeoMax: ru.rodeoMax, banda: ru.banda, minutos: Math.round(Rel.minutos(res.metros)),
      color: COLORES[(ru.n - 1) % COLORES.length],
      // los cuatro puntos que hacen ver un enganche malo de un vistazo
      origenPedido: gr(aP.m), origenEnganche: gr(aP.q), dOrigen: Math.round(aP.d * 10) / 10,
      destinoPedido: gr(bFin.m), destinoEnganche: gr(bFin.q), dDestino: Math.round(bFin.d * 10) / 10,
      tramos: ts.map((t, i) => ({
        n: t.n, frase: t.frase, metros: t.metros, tipo: t.tipo, precision: t.precision,
        ways: t.ways, condicional: t.condicional, unidoPorDefecto: t.unidoPorDefecto,
        avisos: t.avisos,
        // ⭐ CONTADOR INDEPENDIENTE: los metros de la GEOMETRÍA, medidos sobre lo
        //    que se va a pintar. Si no cuadran con los del motor, el visor está
        //    dibujando otra cosa — y eso es lo que hay que poder ver.
        metrosPintados: Math.round(Rel.largoDe(lineas[i]) * 10) / 10,
        g: Rel.aWgs(lineas[i]),
      })),
    });
  }

  const salida = 'window.RUTAS = ' + JSON.stringify({
    sello: g.sello, zona: g.zona,
    grafo: { nodos: g.contadores.nodos, aristas: g.contadores.aristas },
    velocidadKmh: Rel.VELOCIDAD_KMH,
    rutas,
  }) + ';\n';
  fs.writeFileSync(SALIDA, salida);
  return { salida: SALIDA, bytes: Buffer.byteLength(salida), rutas };
}

if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(46)} ${v}`);
  const T0 = Date.now();
  const r = exportar();
  log('='.repeat(96));
  log('EXPORTADO · tools/rutas-visor.js');
  di('tamaño', (r.bytes / 1024).toFixed(1) + ' kB');
  di('rutas', r.rutas.length);
  log('');
  log('   ⭐⭐ EL CUADRE — metros PINTADOS contra metros CALCULADOS, ruta por ruta');
  log('   ⛔ Si esto no cuadra, lo que Antonio vea después está contaminado y no vale.');
  log('   ' + 'nº'.padEnd(4) + 'calculados'.padStart(12) + 'pintados'.padStart(12)
    + 'dif'.padStart(9) + 'tramos'.padStart(9) + '   ');
  for (const x of r.rutas) {
    if (!x.encontrada) { log('   ' + String(x.n).padEnd(4) + '⛔ ' + x.motivo); continue; }
    const pint = x.tramos.reduce((s, t) => s + t.metrosPintados, 0);
    const dif = pint - x.metros;
    const ok = Math.abs(dif) < 1.0;
    log('   ' + String(x.n).padEnd(4) + `${x.metros.toFixed(1)} m`.padStart(12)
      + `${pint.toFixed(1)} m`.padStart(12) + `${dif >= 0 ? '+' : ''}${dif.toFixed(2)}`.padStart(9)
      + String(x.tramos.length).padStart(9) + '   ' + (ok ? '✅' : '⛔ NO CUADRA'));
    A.exige(ok, `la ruta nº${x.n} se pinta con ${pint.toFixed(1)} m y el motor calculó ${x.metros.toFixed(1)} m`);
    // ⭐ y el segundo cuadre, que es otro: la suma de los TRAMOS del relato
    const sumaT = x.tramos.reduce((s, t) => s + t.metros, 0);
    A.exige(Math.abs(sumaT - x.metros) < 0.5,
      `la ruta nº${x.n}: los tramos del relato suman ${sumaT.toFixed(1)} m y el motor ${x.metros.toFixed(1)} m`);
  }
  log('');
  log(A.cierre('EXPORTACIÓN DE RUTAS'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { exportar, COLORES, SALIDA };
