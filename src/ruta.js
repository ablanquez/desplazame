// El comando de interrogación del motor. SOLO LA FORMA.
//
// ⭐ Por qué existe desde el primer día (idea de Antonio): un motor que solo se
//    prueba a través de la pantalla entrega cada fallo mezclado con fallos de
//    interfaz, y no se sabe cuál es cuál. Esto no es comodidad de desarrollo: es
//    la diferencia entre depurar el motor y depurar la aplicación.
//
// ⛔ NO es una API HTTP, ni tiene opciones, ni formatea bonito. Eso se construiría
//    para un motor que todavía no sabemos cómo será.
// ⭐ Devuelve JSON, no prosa: lo que contesta en texto no se puede comprobar solo.
//
//   node src/ruta.js <latO> <lonO> <latD> <lonD>

'use strict';
const path = require('path');
const { aMetros, aGrados } = require('./geo');
const osm = require('./osm');
const { planarizar } = require('./planarizar');
const G = require('./grafo');
const P = require('./portales');
const C = require('./condicionales');

const CRUDO = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_overpass_zaragoza-highway_geom-y-tags.json');

// La zona del primer grafo. Casco antiguo de Zaragoza.
//
// ⚠️ AMPLIADA respecto al primer intento, y por un motivo medido, no estético:
//    el bbox inicial (S 41.648 O -0.888 N 41.660 E -0.869) NO contenía la ventana
//    del crudo `casco-highway.json` de la tanda 3, que llega hasta O -0.8935.
//    De los 10 cruces de control, 7 caían fuera — y el control positivo daba
//    "3 de 10" cuando en realidad era "3 de 3". Es el error nº18 del proyecto
//    ("la misma zona del casco eran dos rectángulos distintos") por segunda vez.
//    Esta zona CONTIENE aquélla, así que todo lo medido antes es comparable.
//    La contención se comprueba en tiempo de ejecución, no se da por buena.
const ZONA_CASCO = { sur: 41.648, oeste: -0.8945, norte: 41.6615, este: -0.869 };

// EL TÉRMINO MUNICIPAL COMPLETO.
//
// ⛔ NO es el bbox del dato tal como vino. El crudo trae CUATRO Zaragozas
//    —España, Costa Rica y Zaragoza de Puebla (México)— porque
//    `area["name"="Zaragoza"]` devuelve un CONJUNTO de áreas, no un área.
//    Son 398 ways de 48.211: invisibles en el volumen, y mueven el bbox
//    18.000 km. Ver bitácora nº57.
//
// ⭐ Éste es el bbox del cúmulo español, con 50 m de holgura. Ningún way queda
//    a caballo de esta caja (comprobado: 0), así que el recorte es limpio y no
//    parte nada por la mitad. La exclusión se IMPRIME en el censo de cúmulos,
//    no se hace en silencio.
const ZONA_TERMINO = { sur: 41.4011, oeste: -1.2199, norte: 41.982, este: -0.6541 };

// La ventana del crudo de la tanda 3, para comprobar la contención.
const ZONA_TANDA3 = { sur: 41.65502, oeste: -0.89354, norte: 41.66034, este: -0.88177 };
function contiene(a, b) {
  return a.sur <= b.sur && a.oeste <= b.oeste && a.norte >= b.norte && a.este >= b.este;
}

// ⭐ Ley 37: la contención se comprueba EN EJECUCIÓN, no mirando los números.
//    Si el término no contuviera al casco, todo lo comparado contra la línea
//    base de la tanda 8 sería incomparable — y no se notaría.
if (!contiene(ZONA_TERMINO, ZONA_CASCO) || !contiene(ZONA_TERMINO, ZONA_TANDA3)) {
  throw new Error('ZONA_TERMINO no contiene al casco: la comparación con la tanda 8 no vale');
}

// ═════════════════════════════════════════════════════════════════════════════
// A2 · LA PUERTA DEL GRAFO — la zona es OBLIGATORIA, y todo grafo se DECLARA
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ Esta función tenía `zona = ZONA_CASCO` por defecto. El comando con el que se
//    interroga el motor —`node src/ruta.js lat lon lat lon`— llamaba a
//    `construir()` sin argumento, así que **contestaba rutas de ciudad con el
//    grafo del casco antiguo y no lo decía**. No fallaba: contestaba.
//
// ⭐ El fallo NO es que ruta.js estuviera mal apuntado. El fallo es que un
//    parámetro por defecto es una decisión que nadie tomó y que nadie ve, y había
//    tres llamadas apoyadas en ella. Por eso el arreglo es de clase:
//      1 · sin zona, esto REVIENTA. No hay valor por defecto que decida por nadie.
//      2 · todo grafo construido se DECLARA por stderr, siempre, sin escotilla.
//          Va por stderr y no por stdout para no ensuciar el JSON del motor.
//      3 · `src/auditoria-grafo.js` comprueba que nadie se salte esta puerta.
//    (1) y (2) no dependen de que nadie se acuerde de nada: eso es la ley 37.
const ZONAS = { casco: ZONA_CASCO, termino: ZONA_TERMINO };
const nombreDeZona = (z) => Object.keys(ZONAS).find((k) => ZONAS[k] === z
  || JSON.stringify(ZONAS[k]) === JSON.stringify(z)) || 'a-medida';

function declarar(g, opciones) {
  const z = g.zona;
  process.stderr.write(
    `⚑ GRAFO · zona=${nombreDeZona(z)}  S ${z.sur} O ${z.oeste} N ${z.norte} E ${z.este}`
    + `  (${g.areaKm2.toFixed(0)} km²)\n`
    + `⚑ sello=${g.sello}  nodos=${g.contadores.nodos}  aristas=${g.contadores.aristas}`
    + `  a-pie=${g.aristasAPie}  componentes=${g.comp.n}  mayor=${Math.max(...g.comp.tamanos)}`
    + `  pasos-condicionales=${g.condicionales.dentro ? 'DENTRO' : 'fuera'}`
    + ` (${g.condicionales.aristas} aristas, ${g.condicionales.conNombre} con el sitio identificado)\n`);
}

function construir(zona, opciones = {}) {
  if (!zona || ['sur', 'oeste', 'norte', 'este'].some((k) => typeof zona[k] !== 'number')) {
    throw new Error('⛔ construir() EXIGE la zona explícita. Antes tenía ZONA_CASCO por '
      + 'defecto y `src/ruta.js` contestaba rutas de ciudad con el grafo del casco sin '
      + 'decirlo (bitácora nº69). Zonas: ' + Object.keys(ZONAS).join(' · '));
  }
  const { sello, ways } = osm.cargar(CRUDO);
  const recorte = osm.proyectar(osm.recortar(ways, zona));
  const { nodos, aristas, contadores, noConectados, porDefecto, puntasLejos } = planarizar(recorte, opciones);

  // ⭐⭐ C · LOS PASOS CONDICIONALES ENTRAN EN EL CÁLCULO. Decisión nueva de
  //    Antonio en la tanda 12: antes se ignoraban «porque son raros», y la primera
  //    consecuencia real medida fue que la Estación de Delicias quedaba sin acceso
  //    a pie. Se usan y se AVISA, con el nombre del sitio.
  // ⛔ Se pueden dejar fuera con `{ sinCondicionales: true }` — para medir la
  //    diferencia, que es lo que hace el informe. Pero lo que contesta una ruta
  //    los lleva dentro.
  const sinCond = opciones.sinCondicionales === true;
  // el nombre de lo que atraviesa cada paso condicional: campo, no consulta suelta
  const nombrados = C.nombrar(aristas, aGrados);

  const { ady, usadas } = G.adyacencia(nodos, aristas, true, sinCond);
  const comp = G.componentes(nodos, ady);
  // ⭐ el nombre de cada way, UNA vez y desde el mismo recorte que produjo el grafo.
  //    Antes cada consumidor releía los 37 MB del crudo por su cuenta para sacar lo
  //    mismo — y releer un dato es la forma barata de que dos copias divergan.
  const nombres = new Map();
  for (const w of recorte) if (w.tags && w.tags.name) nombres.set(w.id, w.tags.name);

  const g = { sello, zona, nodos, aristas, ady, comp, contadores, noConectados, porDefecto,
    puntasLejos, aristasAPie: usadas, areaKm2: osm.areaKm2(zona), nombres,
    condicionales: { ...nombrados, aristas: aristas.filter((e) => e.condicional).length, dentro: !sinCond } };
  declarar(g, opciones);
  return g;
}

// ═════════════════════════════════════════════════════════════════════════════
// A4 · EL UMBRAL DE ENGANCHE — de dónde sale, y qué cuesta
// ═════════════════════════════════════════════════════════════════════════════
// ⭐ MEDIDO, no puesto a ojo. Sobre los 46.150 portales reales del callejero
//    municipal, la distancia de cada uno a la arista transitable más cercana:
//        mediana 5,3 m · p90 18,0 m · p99 65,2 m · p99,9 174,6 m · MÁXIMO 303,1 m
//
//    ⇒ X = 350 m. El criterio es **no rechazar ninguna dirección real de
//      Zaragoza**: 350 queda por encima del peor portal que existe (303,1 m), con
//      holgura. Lo que cuesta: deja pasar cualquier punto hasta 350 m, así que no
//      es un detector fino, es un tope.
//    ⇒ Y a 65,2 m (el p99) se AVISA sin parar: por encima de ahí el punto está en
//      el 1 % peor del callejero, y eso el usuario tiene derecho a saberlo.
//
// ⚠️ El caso que lo motivó —un enganche de 512 m— tenía DOS causas, no una: el
//    grafo equivocado (casco) Y el enganche al NODO en vez de a la arista. Al nodo
//    el máximo real es 566,6 m, así que 512 m **también cabía en el grafo bueno**.
//    Arreglar solo la zona habría dejado el segundo vivo.
const MAX_ENGANCHE_M = 350;
const AVISO_ENGANCHE_M = 65;

/** Índice de aristas a pie, cacheado en el grafo: construirlo cuesta y se repite. */
function indice(g) {
  if (!g._idxAristas) g._idxAristas = P.indexarAristas(g.aristas, (e) => e.pie);
  return g._idxAristas;
}

/**
 * Engancha un punto a la ARISTA transitable más cercana.
 * ⛔ PARA si no hay ninguna dentro de MAX_ENGANCHE_M. No es un aviso: es que ese
 *    punto no está en este grafo, y contestar una ruta desde otro sitio sería
 *    contestar otra pregunta.
 */
function engancharPunto(g, lat, lon, etiqueta) {
  const m = aMetros(lon, lat);
  const { mejor } = P.engancharUno(m, g.aristas, indice(g), () => '', MAX_ENGANCHE_M);
  if (!mejor) {
    throw new Error(`⛔ FUERA DEL GRAFO · el ${etiqueta} (${lat}, ${lon}) no tiene ninguna `
      + `arista transitable a menos de ${MAX_ENGANCHE_M} m. O el punto está fuera de la zona `
      + `del grafo (zona=${nombreDeZona(g.zona)}), o ahí no hay calle mapeada. `
      + `No se contesta una ruta desde otro sitio.`);
  }
  return { arista: mejor.i, seg: mejor.k, t: mejor.t, q: mejor.q, d: mejor.d, lat, lon, m };
}

function resolver(g, latO, lonO, latD, lonD) {
  const o = engancharPunto(g, latO, lonO, 'origen');
  const d = engancharPunto(g, latD, lonD, 'destino');

  // Lo que NO sabemos se dice, no se calla. Tres estados, no dos.
  const avisos = [];
  if (o.d > AVISO_ENGANCHE_M) avisos.push({ tipo: 'origen-lejos', metros: Math.round(o.d),
    dice: `el origen está a ${Math.round(o.d)} m de la calle más cercana (el 99 % del callejero está a menos de ${AVISO_ENGANCHE_M} m)` });
  if (d.d > AVISO_ENGANCHE_M) avisos.push({ tipo: 'destino-lejos', metros: Math.round(d.d),
    dice: `el destino está a ${Math.round(d.d)} m de la calle más cercana (el 99 % del callejero está a menos de ${AVISO_ENGANCHE_M} m)` });

  const cO = g.comp.comp[g.aristas[o.arista].a], cD = g.comp.comp[g.aristas[d.arista].a];
  if (cO !== cD) {
    return { encontrada: false, motivo: 'componentes-distintas', avisos,
      componenteOrigen: cO, componenteDestino: cD };
  }

  const ruta = G.rutaEntre(g, o, d);
  if (!ruta.encontrada) return { encontrada: false, motivo: ruta.motivo, avisos };

  // ── las DOS rectas, que no son la misma pregunta ──────────────────────────
  // `lineaRecta` va entre los puntos PEDIDOS: es la de la tabla de Antonio.
  // `rectaEnganchada` va entre los puntos donde el motor entra al grafo: es la
  // única con la que el rodeo tiene sentido físico, porque la ruta empieza y
  // acaba ahí. Compararlas al revés fue el fallo nº58.
  const recta = Math.hypot(o.m[0] - d.m[0], o.m[1] - d.m[1]);
  const rectaEng = Math.hypot(o.q[0] - d.q[0], o.q[1] - d.q[1]);
  const rodeoFisico = ruta.metros / rectaEng;

  // ⭐ A3 · UN RODEO FÍSICO POR DEBAJO DE 1 ES IMPOSIBLE, NO IMPROBABLE.
  //    Ninguna ruta sobre el terreno puede medir menos que la línea recta entre
  //    sus propios extremos. Si sale, el grafo tiene una arista que teletransporta
  //    o una longitud mal calculada — y devolverlo dentro de un JSON con
  //    `encontrada: true` es publicar un imposible con cara de resultado.
  if (rectaEng > 0.01 && rodeoFisico < 0.999) {
    throw new Error(`⛔⛔ IMPOSIBLE FÍSICO · la ruta mide ${ruta.metros.toFixed(1)} m entre dos `
      + `puntos separados ${rectaEng.toFixed(1)} m en línea recta (rodeo ${rodeoFisico.toFixed(3)}). `
      + `El grafo está roto: hay una arista que teletransporta o una longitud mal medida. `
      + `Esto NO es un aviso.`);
  }

  const porDefecto = ruta.pasos.filter((p) => p.unidoPorDefecto).length;
  const conPrecisionBaja = ruta.pasos.filter((p) => p.precision === 'eje-de-calzada').length;

  // ⭐⭐ C2 · el aviso de cada paso condicional, CON EL NOMBRE DEL SITIO, tal como
  //    lo vería un usuario. Uno por tramo, no uno genérico para toda la ruta: si
  //    la ruta cruza dos edificios, el usuario tiene derecho a saber cuáles.
  const nombreDeWay = (id) => (g.nombres && g.nombres.get(id)) || null;
  for (const p of ruta.pasos) {
    if (!p.condicional) continue;
    avisos.push({ tipo: 'paso-condicional', metros: Math.round(p.metros),
      via: p.condVia, dice: C.aviso(p, nombreDeWay) });
  }

  return {
    encontrada: true,
    metros: ruta.metros,
    lineaRecta: Math.round(recta * 10) / 10,
    rodeo: Math.round((ruta.metros / recta) * 1000) / 1000,
    rectaEnganchada: Math.round(rectaEng * 10) / 10,
    rodeoFisico: Math.round(rodeoFisico * 1000) / 1000,
    engancheOrigen: Math.round(o.d * 10) / 10,
    engancheDestino: Math.round(d.d * 10) / 10,
    aristas: ruta.aristas.length,
    // D2 y D4 viajan hasta aquí, que es el punto entero de que nazcan en el planarizado
    pasosPorDefecto: porDefecto,
    pasosSinAceraConocida: conPrecisionBaja,
    avisos,
    pasos: ruta.pasos,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ LOS EXPORTS VAN **ANTES** DEL BLOQUE DE LÍNEA DE ÓRDENES, Y NO ES ESTILO
// ═════════════════════════════════════════════════════════════════════════════
//   Estaban debajo, y eso rompió el modelo en silencio durante dos tandas
//   (bitácora nº105).
//
//   `src/modelo.js` hace `require('./ruta')` para coger `CRUDO` y `ZONA_TERMINO`.
//   Cuando este fichero se ejecuta como programa —`node src/ruta.js …`—, el bloque
//   de abajo corre **antes** de que `module.exports` esté asignado. Si desde ahí se
//   pide `./modelo`, modelo.js recibe un `{}` vacío: **`CRUDO` sale `undefined`** y
//   el modelo revienta con un error de `path` que no dice nada del ciclo.
//
//   ⇒ Con los exports arriba, cualquiera que entre por el ciclo encuentra el objeto
//     ya completo. ⛔ NO se mueve el bloque de abajo ni se cambia ningún require:
//     lo que se arregla es EL ORDEN, que es lo que estaba mal.
//   ⚠️ Node ya lo estaba diciendo, y nadie lo leyó:
//        Warning: Accessing non-existent property 'ZONA_TERMINO' of module exports
//        inside circular dependency
module.exports = { construir, resolver, engancharPunto, declarar, nombreDeZona,
  ZONAS, ZONA_CASCO, ZONA_TERMINO, ZONA_TANDA3, contiene, CRUDO,
  MAX_ENGANCHE_M, AVISO_ENGANCHE_M };

if (require.main === module) {
  const arg = process.argv.slice(2);
  // ⭐ TANDA 16 · por defecto contesta en TEXTO, porque esto lo lee una persona en
  //    una terminal. ⛔ El JSON NO se elimina —sirve para otras cosas—: sale con
  //    `--json`, byte a byte como antes.
  const quiereJson = arg.includes('--json');
  for (let i = arg.length - 1; i >= 0; i--) if (arg[i] === '--json' || arg[i] === '--texto') arg.splice(i, 1);
  const zonaPedida = ZONAS[arg[0]] ? arg.shift() : 'termino';
  const USO = 'uso:  node src/ruta.js [casco|termino] <latO> <lonO> <latD> <lonD>\n'
    + '      node src/ruta.js [casco|termino] "Coso 33" "Calle Alfonso I 10"\n'
    + '      añade --json para la salida de máquina (la de siempre)';

  let coords = null, direcciones = null;
  if (arg.length === 4 && arg.every((x) => Number.isFinite(Number(x)))) coords = arg.map(Number);
  else if (arg.length === 2) direcciones = arg;
  else { console.error(USO); process.exit(2); }

  try {
    // ⛔ la zona SIEMPRE explícita, también aquí. Por defecto el término, que es
    //    la ciudad — pero es una elección escrita, no un parámetro invisible.
    const g = construir(ZONAS[zonaPedida]);
    let salida;
    let etqO = null, etqD = null;
    let ctxDir = null;        // ⭐ el contexto del geocodificador, si lo hubo: trae los portales

    if (coords) {
      salida = resolver(g, coords[0], coords[1], coords[2], coords[3]);
      etqO = coords[0] + ', ' + coords[1];
      etqD = coords[2] + ', ' + coords[3];
    } else {
      // ⭐ A5 · UN SOLO GEOCODIFICADOR. El mismo módulo `direccion.js` que usan las
      //    siete rutas de Antonio. Dos caminos de código desde el mismo dato
      //    divergen — es la forma exacta de los fallos nº63 y nº67.
      const D = require('./direccion');
      const ctx = D.abrir(g, CRUDO);
      ctxDir = ctx;
      const a = D.punto(direcciones[0], ctx), b = D.punto(direcciones[1], ctx);
      for (const [q, p] of [[direcciones[0], a], [direcciones[1], b]]) {
        if (!p) { console.error(`⛔ no se puede resolver la dirección "${q}"`); process.exit(3); }
      }
      salida = { ...resolver(g, a.lat, a.lon, b.lat, b.lon),
        origen: { consulta: direcciones[0], estado: a.estado, lat: a.lat, lon: a.lon, aviso: a.aviso || null },
        destino: { consulta: direcciones[1], estado: b.estado, lat: b.lat, lon: b.lon, aviso: b.aviso || null } };
      etqO = direcciones[0];
      etqD = direcciones[1];
    }

    if (quiereJson) {
      console.log(JSON.stringify({
        sello: g.sello, zona: nombreDeZona(g.zona), bbox: g.zona,
        grafo: { nodos: g.contadores.nodos, aristas: g.contadores.aristas,
          componentes: g.comp.n, mayor: Math.max(...g.comp.tamanos) },
        ...salida,
      }, null, 2));
    } else {
      // ⛔ el MISMO redactor que usan las siete rutas y el visor. Una sola forma
      //    de contar un tramo en todo el proyecto (fuente única).
      const Rel = require('./relato');
      const nombreDeWay = (id) => (g.nombres && g.nombres.get(id)) || null;
      // ⭐⭐ TANDA 21 · EL MODELO YA NO ES UNA CAPA DE PRUEBA: entra en la ruta que
      //    escribe una persona en la terminal. Trae los nombres deducidos de los
      //    portales (marcados) y el papel a pie. ⛔ NO toca el cálculo: `salida` ya
      //    está resuelta cuando esto se monta.
      //    ⚠️ Cuesta ~10 s y necesita los portales enganchados, así que solo se
      //    monta cuando los hay — con `--coords` no se enganchan y se dice.
      // ⛔⛔ SI EL MODELO NO CARGA, ESTO **PARA**. No sigue sin él.
      //    Antes había aquí un `try/catch` que imprimía un aviso y continuaba, y
      //    el resultado salía con las aceras «sin nombre» como si el método de la
      //    tanda 21 no existiera. **Un resultado calculado sin modelo no es un
      //    resultado degradado: es OTRO resultado**, y sale con el mismo aspecto.
      //    ⚠️ Es la ley 44 con la forma más cara: un `⚠️` impreso y código 0.
      //    ⇒ el error sube al `catch` de fuera, que sale en 1 (bitácora nº105).
      let modeloDeWay = null;
      if (ctxDir && !process.argv.includes('--sin-modelo')) {
        const Mo = require('./modelo');
        modeloDeWay = Mo.construirModelo(g, ctxDir.enganche.portales.filter((o) => o.enganchado)).modeloDeWay;
      }
      console.log(Rel.texto(salida, { origen: etqO, destino: etqD, nombreDeWay,
        rodeo: salida.rodeo, engancheOrigen: salida.engancheOrigen,
        engancheDestino: salida.engancheDestino, modelo: modeloDeWay }));
      // los avisos que no son de tramo (enganche lejos, dirección dudosa)
      for (const av of (salida.avisos || [])) {
        if (av.tipo === 'paso-condicional') continue;   // ya salen tramo a tramo
        console.log('   ⚠️  ' + av.dice);
      }
      for (const [q, p] of [['origen', salida.origen], ['destino', salida.destino]]) {
        if (p && p.aviso) console.log('   ⚠️  el ' + q + ': ' + p.aviso);
      }
      if (!salida.encontrada) process.exitCode = 4;
    }
  } catch (e) {
    // ⭐ A3/A4 · en rojo y con código de salida distinto de 0. Un imposible físico
    //    o un punto fuera del grafo NO salen dentro de un JSON con encontrada:true.
    console.error(e.message);
    process.exit(1);
  }
}
