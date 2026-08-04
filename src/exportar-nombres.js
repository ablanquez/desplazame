// ⭐⭐ TANDA 20 · C · EL DATO DEL MAPA DE TRES COLORES — vuelca, no recalcula.
//
//   node src/exportar-nombres.js
//
// ⛔⛔ LA CLASIFICACIÓN NO SE HACE AQUÍ. Sale de `src/donde-falta.js` (`clasificar`),
//     que es la misma que produce la tabla de A2. **Si el mapa clasificara por su
//     cuenta, divergiría de la tabla** — y este proyecto ya tiene ese fallo con
//     nombre y apellidos: el nº68 fueron dos copias del mismo cálculo.
//
// ⚠️ Sale como `.js` con `window.NOMBRES = …` y no como `.json`, por lo mismo que
//    `src/exportar.js`: un HTML abierto con doble clic no puede hacer `fetch` de un
//    fichero local (CORS con `file://`). Un `<script src>` sí carga.
//
// ⚠️ EL NOMBRE DEDUCIDO VIAJA, Y VIAJA MARCADO. El método de portales de la tanda
//    17 se ejecuta aquí **solo para enseñarlo en el globo**: qué nombre saldría si
//    se aplicara. ⛔ No se escribe en el grafo, no se usa para colorear, no se
//    cuenta en ninguna tabla. Es la respuesta a «¿y esto de qué calle es?» cuando
//    Antonio pinche una línea, con su aviso al lado.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ «¿PUEDE ESTO PASAR SIN QUE NADA FUNCIONE?»
// ═════════════════════════════════════════════════════════════════════════════
//   El cuadre de abajo compara lo exportado con lo clasificado. ⚠️ Y **pasaría por
//   construcción**, porque lo exportado sale de lo clasificado: es un cuadre de
//   transporte, no de método. Su valor es cazar una pérdida por el camino (un
//   filtro, un `continue`, un redondeo que colapse dos categorías), que es
//   exactamente lo que cazó el descuadre de nodos del nº53.
//   ⇒ Lo que SÍ prueba algo se hace en `src/probar-visor-nombres.js`: meter una
//     línea falsa y ver que aparece, y quitarla y ver que desaparece.

'use strict';
const fs = require('fs');
const path = require('path');
const { aGrados } = require('./geo');
const DF = require('./donde-falta');
const H = require('./heredar-nombre');
const P = require('./portales');
const D = require('./direccion');
const F = require('./forma');
const A = require('./alarma');
const AB = require('./asignar-bici');
const Mo = require('./modelo');
const osm = require('./osm');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');
const { ZONAS } = require('./ciudad');

const SALIDA = path.join(__dirname, '..', 'tools', 'nombres-visor.js');
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const pg = (p) => { const g = aGrados(p[0], p[1]); return [r6(g[0]), r6(g[1])]; };

/** Códigos de categoría, en el mismo orden que `DF.CATEGORIAS`. */
const K = { 'con-nombre': 0, 'sin-nombre-con-portales': 1, 'sin-nombre-sin-portales': 2 };

function construirSalida() {
  const g = construir(ZONA_TERMINO);
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const tags = new Map();
  for (const w of osm.recortar(osm.cargar(CRUDO).ways, ZONA_TERMINO)) tags.set(w.id, w.tags || {});
  const vias = P.cargarVias();
  const asig = AB.asignar(g, AB.cargarCapa().lineas, (w) => F.plataforma(tags.get(w)),
    { idx: AB.indexar(g.aristas) });
  const M = Mo.aplicar(g, tags, asig.tabla, vias);
  const C = DF.clasificar(g, portales, M);

  // ⚠️ INFORMATIVO — el método de la tanda 17, ejecutado y NO aplicado.
  const dec = H.decidirTodas(H.agrupar(portales.map(H.proyectar)));

  // ⚠️ TEXTOS EN UN BOTE, y las aristas guardan el índice. No es una optimización
  //    caprichosa: 41.930 nombres repetidos pesan más que la geometría, y un
  //    fichero que el navegador no traga es un instrumento que no existe.
  //    ⛔ Nada se pierde: es la misma cadena, referenciada.
  const bote = [];
  const enBote = new Map();
  const meter = (s) => {
    if (s == null) return -1;
    if (!enBote.has(s)) { enBote.set(s, bote.length); bote.push(s); }
    return enBote.get(s);
  };

  const aristas = C.map((r) => {
    const e = g.aristas[r.i];
    const o = { i: r.i, g: e.pts.map(pg), k: K[r.categoria], m: Math.round(r.largo * 10) / 10 };
    if (r.nPortales) o.p = r.nPortales;
    if (r.categoria !== 'con-nombre') {
      // lo que hace falta para contestar «¿y esto qué es?» al pinchar
      o.t = meter(r.plataforma);
      o.c = meter(r.precision);
      o.w = r.way;
      if (r.vias.length) o.v = r.vias.slice(0, 4).map((x) => [meter(x.nombre), x.n]);
      const d = dec.get(r.i);
      // ⛔ marcado como DEDUCIDO y NO APLICADO; el visor lo repite en el globo
      if (d && d.estado === 'NOMBRADA') o.d = [meter(d.nombre), d.apoyo, d.votos];
      else if (d) o.d = [-1, 0, d.votos];
    } else {
      o.n = meter(r.nombre);
      o.f = meter(r.fuente);
    }
    return o;
  });

  // C5 · los PORTALES de las líneas sin nombre — dónde hay puertas sin calle
  const sinNombre = new Set(C.filter((r) => r.categoria === 'sin-nombre-con-portales').map((r) => r.i));
  const puntos = portales.filter((o) => sinNombre.has(o.arista)).map((o) => ({
    g: [r6(o.lon), r6(o.lat)],
    v: meter((o.via && o.via.nombre) || null),
    n: o.numero,
    a: o.arista,
    d: Math.round(o.d * 10) / 10,
  }));

  const cuentas = {};
  for (const k of DF.CATEGORIAS) {
    const l = C.filter((r) => r.categoria === k);
    cuentas[k] = { aristas: l.length, metros: Math.round(l.reduce((s, r) => s + r.largo, 0)) };
  }

  return {
    g, C,
    salida: {
      sello: g.sello, zona: g.zona, generado: 'src/exportar-nombres.js',
      categorias: DF.CATEGORIAS,
      contadores: {
        aristas: g.aristas.length, nodos: g.contadores.nodos,
        portalesEnganchados: portales.length,
        portalesSinCalle: puntos.length,
        cuentas,
      },
      zonas: ZONAS.map((z) => ({ n: z.n, b: z.b })),
      textos: bote,
      aristas, portales: puntos,
    },
  };
}

if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(52)} ${v}`);
  const T0 = Date.now();
  const { g, C, salida } = construirSalida();

  // ── la reproyección, ANTES de escribir nada (igual que en `exportar.js`) ────
  const { aMetros } = require('./geo');
  let peor = 0;
  for (const n of g.nodos) {
    const gr = aGrados(n.x, n.y);
    const v = aMetros(gr[0], gr[1]);
    peor = Math.max(peor, Math.hypot(n.x - v[0], n.y - v[1]));
  }

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, 'window.NOMBRES = ' + JSON.stringify(salida) + ';\n', 'utf8');
  const bytes = fs.statSync(SALIDA).size;

  log('='.repeat(96));
  log('C · EL DATO DEL MAPA DE TRES COLORES');
  log('='.repeat(96));
  log('');
  di('reproyección · error máximo ida y vuelta', (peor * 1000).toFixed(3) + ' mm  ' + (peor < 0.01 ? '✅' : '⛔'));
  A.exige(peor < 0.01, `la reproyección tiene ${peor.toFixed(3)} m de error`);

  log('');
  log('   ⭐ EL CUADRE — lo exportado contra lo clasificado. ⚠️ Pasa por construcción (lo');
  log('      exportado SALE de lo clasificado); su valor es cazar una pérdida por el camino.');
  log('');
  log('   ' + 'categoría'.padEnd(34) + 'exportado'.padStart(12) + 'clasificado'.padStart(14) + 'metros'.padStart(12));
  let ok = true;
  for (const k of DF.CATEGORIAS) {
    const a = salida.aristas.filter((x) => x.k === DF.CATEGORIAS.indexOf(k)).length;
    const b = C.filter((r) => r.categoria === k).length;
    if (a !== b) ok = false;
    log('   ' + k.padEnd(34) + String(a).padStart(12) + String(b).padStart(14)
      + String(salida.contadores.cuentas[k].metros).padStart(12) + '   ' + (a === b ? '✅' : '⛔'));
  }
  log('   ' + '─'.repeat(72));
  const suma = DF.CATEGORIAS.reduce((s, k) => s + salida.contadores.cuentas[k].aristas, 0);
  log('   ' + 'SUMA'.padEnd(34) + String(suma).padStart(12) + String(g.aristas.length).padStart(14)
    + '   ' + (suma === g.aristas.length ? '✅ ninguna arista fuera' : '⛔ FALTAN ARISTAS'));
  A.exige(ok && suma === g.aristas.length, 'el exportado no cuadra con la clasificación');

  log('');
  di('vértices exportados', salida.aristas.reduce((s, a) => s + a.g.length, 0)
    + '   (sin simplificar: el dibujo ES el grafo)');
  const vG = g.aristas.reduce((s, e) => s + e.pts.length, 0);
  A.exige(salida.aristas.reduce((s, a) => s + a.g.length, 0) === vG,
    'se han perdido vértices al exportar: el dibujo ya no es el grafo');
  di('⭐ portales de líneas sin nombre (capa 4)', salida.contadores.portalesSinCalle);
  {
    // ⭐ contador independiente: los portales de la capa tienen que ser exactamente
    //    los que la tabla de A4 atribuye a «las que duelen».
    const esperado = C.filter((r) => r.categoria === 'sin-nombre-con-portales')
      .reduce((s, r) => s + r.nPortales, 0);
    di('   …esperado por el contador de A4', esperado + (esperado === salida.contadores.portalesSinCalle ? '   ✅' : '   ⛔'));
    A.exige(esperado === salida.contadores.portalesSinCalle,
      `la capa de portales lleva ${salida.contadores.portalesSinCalle} y A4 cuenta ${esperado}`);
  }
  di('nombres DEDUCIDOS que viajan (informativos)', salida.aristas.filter((a) => a.d && a.d[0] >= 0).length
    + '   ⛔ NO aplicados: solo salen en el globo, con su aviso');
  log('');
  di('tools/nombres-visor.js', (bytes / 1048576).toFixed(2) + ' MB');
  di('sello del dato', salida.sello);
  log('');
  log(A.cierre('EXPORTADO DEL MAPA DE NOMBRES'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}

module.exports = { construirSalida, SALIDA, K };
