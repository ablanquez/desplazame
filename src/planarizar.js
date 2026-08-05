// EL PLANARIZADO — convierte un montón de líneas en una red.
//
// Aplica las decisiones del diseño, y cada una lleva su etiqueta al lado para que
// se pueda auditar qué regla actuó en cada punto:
//
//   D1 · UNIR POR DEFECTO. No unir SOLO con evidencia positiva de desnivel.
//        C1 · precedencia del nodo: si dos vías comparten nodo OSM, se conectan
//             y ninguna señal lo contradice. En OSM el nodo ES la topología.
//        C2 · evidencia: bridge / tunnel / layer distinto, o salto de velocidad
//             >= 50 ENTRE DOS VÍAS RODADAS.
//        La jerarquía NO vota.
//   D2 · toda unión sin evidencia se marca `unido-por-defecto` y SE CUENTA.
//   D4 · la precisión es un CAMPO por arista, desde aquí hasta la interfaz.
//   D5 · tolerancia 2,0 m para soldar puntas sueltas. Techo duro 5 m.
//
// ⚠️ Dos trampas de formato que ya mordieron y van explícitas:
//    · `layer` NO es entero: existe "-1.5". parseInt lo trunca o lo tira.
//    · `tunnel=building_passage` NO es un túnel: es un pasaje bajo un edificio
//      y a pie se pasa. Tratarlo como desnivel cortaría un camino real.

'use strict';
const { dist, corteSegmentos } = require('./geo');
const { porEtiqueta } = require('./condicionales');

const TOLERANCIA_PUNTA = 2.0;      // D5
const TECHO_PUNTA = 5.0;           // D5 · techo duro
const SALTO_VELOCIDAD = 50;        // D1 · C2

// Vías por las que NO circula tráfico rodado. Define quién es "rodada" en C2.
const NO_RODADAS = new Set(['footway', 'path', 'steps', 'pedestrian', 'cycleway',
  'bridleway', 'corridor', 'via_ferrata']);

const esRodada = (t) => !NO_RODADAS.has(t.highway);

// ═════════════════════════════════════════════════════════════════════════════
// LA REGLA DE TRANSITABILIDAD  —  sustituye a la lista, por la ley 40
// ═════════════════════════════════════════════════════════════════════════════
//
// ⛔ Lo que había antes era una LISTA: `!PROHIBIDAS_A_PIE.has(highway) && foot!=='no'
//    && highway!=='construction'`. `construction` entró porque en el casco había 117
//    y me las encontré de frente; `proposed` no entró porque allí había cero. Y al
//    planarizar la ciudad aparecieron 178 aristas —13,8 km— de calles sin construir
//    por las que el motor dejaba andar, 23 de ellas único paso a 82 nodos.
//    Una lista de los casos que aparecieron no es una regla: es un inventario, y se
//    queda corta en cuanto cambia la muestra. Ver bitácora nº62.
//
// ⭐ Se sustituye por TRES PREGUNTAS INDEPENDIENTES, cada una contestable mirando el
//    dato y cada una contada por separado:
//
//      G1 · ¿EXISTE HOY?            estado de la vía
//      G2 · ¿ES UNA VÍA POR LA QUE ANDA GENTE?   tipo de vía
//      G3 · ¿LO PROHÍBE EL DATO?    acceso
//
// ⭐⭐ Y G2 es una lista POSITIVA, no negativa, por el coste asimétrico del error:
//     excluir de más pierde un atajo; incluir de más manda a alguien a un
//     descampado. Una lista negativa FALLA ABIERTA —un valor nuevo de OSM pasa a
//     ser andable sin que nadie lo decida—; una positiva FALLA CERRADA y además
//     `valoresDesconocidos()` los saca por pantalla. Un valor nuevo no puede
//     colarse en silencio nunca más.

/** Estados del ciclo de vida de OSM: lo que ya no está o todavía no está. */
const ESTADOS_MUERTOS = ['construction', 'proposed', 'planned', 'razed', 'abandoned',
  'disused', 'demolished', 'dismantled', 'removed'];

/**
 * G2 · Tipos de vía por los que anda gente. LISTA POSITIVA.
 * Incluye el viario ordinario aunque no tenga acera declarada: sin acera se anda
 * igual, y eso lo dice D4 con `eje-de-calzada`, no este filtro.
 */
const VIARIO_ANDABLE = new Set([
  // peatonal puro
  'footway', 'path', 'steps', 'pedestrian', 'living_street', 'corridor',
  // viario ordinario
  'residential', 'service', 'track', 'unclassified',
  'tertiary', 'secondary', 'primary',
  'tertiary_link', 'secondary_link', 'primary_link',
  // compartidas
  'cycleway',
  // ⚠️ el ascensor SÍ se anda —es una conexión vertical real— pero es un paso
  //    condicional: puede estar averiado o cerrado. Se marca en `condicional()`.
  'elevator',
]);

/**
 * G2 · Lo que NO se anda, y por qué. Está enumerado a propósito aunque la lista
 * que manda sea la positiva: así `valoresDesconocidos()` distingue "sabemos que
 * no" de "no lo habíamos visto nunca", que son cosas distintas.
 */
const VIARIO_NO_ANDABLE = {
  motorway: 'autovía · prohibido a pie',
  motorway_link: 'enlace de autovía · prohibido a pie',
  trunk: 'vía rápida · prohibido a pie',
  trunk_link: 'enlace de vía rápida · prohibido a pie',
  busway: 'calzada reservada a autobuses · no es para andar',
  raceway: 'circuito · recinto cerrado',
  services: 'área de servicio de autovía · solo se llega por autovía',
  rest_area: 'área de descanso de autovía · solo se llega por autovía',
  construction: 'no existe todavía · en obras',
  proposed: 'no existe todavía · proyectada',
  planned: 'no existe todavía · planificada',
  razed: 'ya no existe',
  abandoned: 'ya no existe',
  disused: 'ya no existe',
};

/**
 * G1 · ¿Existe hoy la vía?
 *
 * ⚠️ La ambigüedad es real y se resolvió MIRANDO LOS DIEZ CASOS, no por regla a
 *    ciegas. Lo que decide es EL TIPO PRINCIPAL, no cualquier etiqueta suelta:
 *
 *    · `highway=construction` / `footway=construction` ⇒ NO EXISTE. El tipo lo
 *      declara: la vía ES una obra. (4 pasos de peatones en obras del centro.)
 *    · `disused=yes` como bandera suelta ⇒ NO EXISTE.
 *    · `construction=residential` SOBRE `highway=residential` ⇒ SÍ EXISTE. Son
 *      las tres de Calle de Pedro III (El Grande), con `surface=asphalt`,
 *      `maxspeed=30` y acera separada: la calle está ahí. La etiqueta suelta
 *      habla de una recalificación, no de un solar.
 *    · `abandoned:highway=tertiary` SOBRE `highway=track` ⇒ SÍ EXISTE. Los
 *      prefijos `X:highway` describen OTRO TIEMPO VERBAL de algo que sí está hoy.
 */
function existeHoy(t) {
  if (ESTADOS_MUERTOS.includes(t.highway)) return false;
  if (ESTADOS_MUERTOS.includes(t.footway)) return false;
  for (const k of ESTADOS_MUERTOS) if (t[k] === 'yes') return false;
  return true;
}

/**
 * G3 · ¿Lo prohíbe el dato explícitamente?
 *
 * ⛔ Solo lo inequívoco: `foot=no` (a pie no) y `access=no` (nadie).
 *
 * ⚠️ `foot=use_sidepath` NO entra, y no por gusto: excluirlo quita 3.434 aristas
 *    y **crea 15 componentes nuevas**. La etiqueta significa "usa la acera de al
 *    lado", y eso solo es aplicable si la acera de al lado ESTÁ EN EL GRAFO. Que
 *    aparezcan componentes al aplicarla demuestra que en 15 sitios no está.
 * ⚠️ `access=private` tampoco: crea 29 componentes. Y además es otra categoría —
 *    "un sitio por el que no se anda" no es "un sitio por el que se puede pero no
 *    siempre". Los dos casos quedan medidos y reportados: la decisión no es mía.
 */
function prohibidoPorElDato(t) {
  return t.foot === 'no' || t.access === 'no';
}

/**
 * Los valores de `highway` que no están ni en la lista positiva ni en la negativa.
 * ⭐ Un valor nuevo de OSM cae aquí, NO se anda, y sale por pantalla. Ésa es la
 *    diferencia entre una regla y una lista.
 */
function valoresDesconocidos(ways) {
  const m = new Map();
  for (const w of ways) {
    const h = (w.tags || {}).highway;
    if (h === undefined) { m.set('(SIN highway)', (m.get('(SIN highway)') || 0) + 1); continue; }
    if (VIARIO_ANDABLE.has(h) || VIARIO_NO_ANDABLE[h]) continue;
    m.set(h, (m.get(h) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/** Por qué no se anda por aquí. `null` si sí se anda. Para contar y explicar. */
function porQueNoSeAnda(t) {
  if (!existeHoy(t)) return 'no existe hoy';
  if (!VIARIO_ANDABLE.has(t.highway)) {
    return VIARIO_NO_ANDABLE[t.highway] || 'valor de highway DESCONOCIDO';
  }
  if (prohibidoPorElDato(t)) return t.foot === 'no' ? 'foot=no' : 'access=no';
  return null;
}

const transitableAPie = (t) => porQueNoSeAnda(t) === null;

/** ⚠️ float, no int: existe layer="-1.5". Un valor no numérico cuenta como 0. */
function nivel(t) {
  if (t.layer === undefined) return 0;
  const v = parseFloat(t.layer);
  return Number.isFinite(v) ? v : 0;
}
const esPuente = (t) => t.bridge !== undefined && t.bridge !== 'no';
/** ⚠️ building_passage NO entra: a pie se pasa por debajo del edificio. */
const esTunel = (t) => ['yes', 'culvert', 'passage'].includes(t.tunnel);

function velocidad(t) {
  if (!t.maxspeed) return null;
  const v = parseInt(String(t.maxspeed).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(v) ? v : null;
}

/**
 * D1 aplicada a un cruce geométrico SIN nodo compartido.
 * Devuelve {conectar:boolean, motivo:string}.
 */
function decidirCruce(ta, tb) {
  if (nivel(ta) !== nivel(tb)) return { conectar: false, motivo: 'layer-distinto' };
  if (esPuente(ta) !== esPuente(tb)) return { conectar: false, motivo: 'bridge' };
  if (esTunel(ta) !== esTunel(tb)) return { conectar: false, motivo: 'tunnel' };
  if (esRodada(ta) && esRodada(tb)) {
    const va = velocidad(ta), vb = velocidad(tb);
    if (va !== null && vb !== null && Math.abs(va - vb) >= SALTO_VELOCIDAD) {
      return { conectar: false, motivo: 'salto-velocidad' };
    }
  }
  // D2 · no hay evidencia positiva: se une, y se marca.
  return { conectar: true, motivo: 'unido-por-defecto' };
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ TANDA 26 · «SIN NOMBRE» Y «NO TIENE NOMBRE» NO SON LO MISMO
// ═════════════════════════════════════════════════════════════════════════════
//   > *«Si un paso de cebra es un paso de cebra y no tiene nombre, no lo tendrá
//   >  que tener ninguno, digo yo.»* — Antonio
//
//   Una **acera sin nombre** es información que falta: es un problema.
//   Un **paso de cebra sin nombre** no es un problema: es así.
//   ⇒ Meterlos en el mismo saco hace que el mapa **exagere el problema**.
//
//   ⭐ Y el porqué no es estadístico, es de definición: **un paso de cebra no es de
//     ninguna calle, es del CRUCE.** El que cruza de Rodrigo Rebolledo a Salvador
//     Minguijón está entre las dos y no pertenece a ninguna: ponerle una sería
//     elegir, y elegir es inventar.
//
//   ⛔ ESTO NO DICE «no se sabe su nombre». Dice **«esta pregunta no aplica aquí»**.
//     Por eso vive al lado de `precision()` —es semántica de D4, no del redactor ni
//     del modelo— y por eso la leen los dos desde aquí en vez de copiarla (ley 56).
//
//   ⚠️ SOLO LOS PASOS, y las escaleras NO, aunque el relato también las cuente
//      solas. Medido en la tanda 26: de los 75 ways de escalera que OSM nombra,
//      **73 llevan el nombre de una calle que sale de su propio extremo** —el
//      mapeador las trata como el tramo escalonado de esa calle—, y de las que se
//      pueden decidir por sus extremos, 89 unen la MISMA calle contra 29 que unen
//      dos distintas. ⇒ una escalera SÍ suele ser de una calle. **Decide Antonio.**
//
//   ⛔ Lo que trae OSM se respeta SIEMPRE: es dato ajeno. Esto solo impide que lo
//     pongamos NOSOTROS.
const SIN_NOMBRE_POR_DEFINICION = new Set(['paso-de-peatones']);

// ⭐⭐ TANDA 27 · LA ISLETA ENTRA, y no cabía en la lista de arriba: **el criterio
//    no es la precisión D4, es la ETIQUETA.** Una `footway=traffic_island` tiene
//    precisión `peatonal` —igual que una calle peatonal de verdad—, así que la
//    lista de precisiones no la alcanzaba y la regla de la tanda 26 la dejó fuera.
//
//    Y es exactamente el mismo caso: **la isleta es el trocito que queda EN MEDIO
//    del paso de cebra.** Si el paso no es de ninguna de las dos calles, el refugio
//    del medio tampoco. Medido en la tanda 26: 674 aristas, 369 con nombre puesto
//    por nosotros.
//
//    ⚠️ Y por eso esto pasa de ser una LISTA a ser una FUNCIÓN de las etiquetas: hay
//       formas que se reconocen por D4 y otras que no. Quien pregunte, que pregunte
//       aquí — ⛔ y que no copie la condición (ley 56).
const FOOTWAY_SIN_NOMBRE = new Set(['traffic_island']);

/**
 * ⭐ ¿Es esta línea de las que **NO TIENEN** nombre, en vez de las que no se lo
 * sabemos? ⛔ El único sitio donde se decide.
 * @param {object} t etiquetas de OSM del way
 */
function sinNombrePorDefinicion(t) {
  const tt = t || {};
  if (SIN_NOMBRE_POR_DEFINICION.has(precision(tt))) return true;
  if (FOOTWAY_SIN_NOMBRE.has(tt.footway)) return true;
  return false;
}

/** D4 · la precisión con la que sabemos por dónde se anda en esta arista. */
function precision(t) {
  if (t.footway === 'crossing' || t.highway === 'crossing') return 'paso-de-peatones';
  if (t.footway === 'sidewalk') return 'acera';
  if (t.highway === 'steps') return 'escaleras';
  if (['footway', 'pedestrian', 'path', 'living_street'].includes(t.highway)) return 'peatonal';
  if (t.sidewalk && !['no', 'none', 'separate'].includes(t.sidewalk)) return 'eje-con-acera-declarada';
  return 'eje-de-calzada';
}

// ─────────────────────────────────────────────────────────────────────────────

function planarizar(ways, opciones = {}) {
  const tol = opciones.tolerancia ?? TOLERANCIA_PUNTA;
  const cont = {
    waysEntrada: ways.length,
    nodosOsmUsados: 0, nodosCompartidos: 0,
    cortesGeometricos: 0, cortesConectados: 0, cortesNoConectados: 0,
    porMotivo: {}, unidoPorDefecto: 0,
    puntasSoldadas: 0, distanciasPuntas: [],
    precision: {}, aristas: 0, nodos: 0, particiones: 0,
    puntasFueraDeTecho: 0,
  };

  // ── 1 · nodos OSM y cuántos ways los usan. Aquí vive D1·C1. ────────────────
  const uso = new Map();
  for (const w of ways) for (const n of w.nodes) uso.set(n, (uso.get(n) || 0) + 1);
  cont.nodosOsmUsados = uso.size;
  cont.nodosCompartidos = [...uso.values()].filter((v) => v >= 2).length;

  // ── 2 · puntos de corte por way ────────────────────────────────────────────
  // cortes[i] = Map(clave -> {idx, t, punto, nodoOsm|null})
  const cortes = ways.map(() => []);
  for (let i = 0; i < ways.length; i++) {
    const w = ways[i];
    for (let k = 0; k < w.nodes.length; k++) {
      if (uso.get(w.nodes[k]) >= 2) {
        cortes[i].push({ idx: k, t: 0, p: w.pts[k], nodo: w.nodes[k] });
      }
    }
  }

  // ── 3 · cruces geométricos sin nodo compartido. Aquí vive D1·C2 y D2. ──────
  const CELDA = 100;
  const rejilla = new Map();
  const meter = (i, s) => {
    const [a, b] = [ways[i].pts[s], ways[i].pts[s + 1]];
    const x0 = Math.floor(Math.min(a[0], b[0]) / CELDA), x1 = Math.floor(Math.max(a[0], b[0]) / CELDA);
    const y0 = Math.floor(Math.min(a[1], b[1]) / CELDA), y1 = Math.floor(Math.max(a[1], b[1]) / CELDA);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = x + ',' + y;
      if (!rejilla.has(k)) rejilla.set(k, []);
      rejilla.get(k).push([i, s]);
    }
  };
  for (let i = 0; i < ways.length; i++) for (let s = 0; s + 1 < ways[i].pts.length; s++) meter(i, s);

  const vistos = new Set();
  const noConectados = [];
  const porDefecto = [];
  for (const lista of rejilla.values()) {
    for (let a = 0; a < lista.length; a++) for (let b = a + 1; b < lista.length; b++) {
      const [i, s] = lista[a], [j, u] = lista[b];
      if (i === j) continue;
      const clave = i < j ? `${i}:${s}:${j}:${u}` : `${j}:${u}:${i}:${s}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      // si comparten nodo OSM en ese punto, D1·C1 ya lo resolvió arriba
      const ns = new Set([ways[i].nodes[s], ways[i].nodes[s + 1]]);
      if (ns.has(ways[j].nodes[u]) || ns.has(ways[j].nodes[u + 1])) continue;
      const c = corteSegmentos(ways[i].pts[s], ways[i].pts[s + 1], ways[j].pts[u], ways[j].pts[u + 1]);
      if (!c) continue;
      cont.cortesGeometricos++;
      const d = decidirCruce(ways[i].tags || {}, ways[j].tags || {});
      cont.porMotivo[d.motivo] = (cont.porMotivo[d.motivo] || 0) + 1;
      if (d.conectar) {
        cont.cortesConectados++;
        cont.unidoPorDefecto++;                                  // D2
        cortes[i].push({ idx: s, t: c.t, p: c.p, nodo: null, defecto: true });
        cortes[j].push({ idx: u, t: c.u, p: c.p, nodo: null, defecto: true });
        // D2 exige un contador; para poder MIRARLOS hace falta además el sitio.
        porDefecto.push({ wayA: ways[i].id, wayB: ways[j].id, p: c.p,
          nombreA: (ways[i].tags || {}).name || null, nombreB: (ways[j].tags || {}).name || null,
          hwA: (ways[i].tags || {}).highway, hwB: (ways[j].tags || {}).highway });
      } else {
        cont.cortesNoConectados++;
        noConectados.push({ wayA: ways[i].id, wayB: ways[j].id, motivo: d.motivo, p: c.p,
          nombreA: (ways[i].tags || {}).name || null, nombreB: (ways[j].tags || {}).name || null,
          hwA: (ways[i].tags || {}).highway, hwB: (ways[j].tags || {}).highway });
      }
    }
  }

  // ── 4 · partir cada way en sus cortes ─────────────────────────────────────
  const nodos = [];                       // {x,y}
  const indicePorClave = new Map();       // clave espacial/osm -> id de nodo
  const claveOsm = (n) => 'n' + n;
  const claveXY = (p) => `p${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`;
  function nodoDe(p, nodoOsm) {
    const k = nodoOsm !== null && nodoOsm !== undefined ? claveOsm(nodoOsm) : claveXY(p);
    if (indicePorClave.has(k)) return indicePorClave.get(k);
    const id = nodos.length;
    nodos.push({ x: p[0], y: p[1], osm: nodoOsm ?? null });
    indicePorClave.set(k, id);
    return id;
  }

  const aristas = [];
  for (let i = 0; i < ways.length; i++) {
    const w = ways[i], t = w.tags || {};
    const pr = precision(t), pie = transitableAPie(t), sinNom = sinNombrePorDefinicion(t);
    // ⭐ B4 · el paso condicional EXISTE y se anda: es terreno, y se construye.
    //    Es un CAMPO de la arista, como la precisión de D4 — no una exclusión del
    //    grafo. Separar "existe" de "se puede pasar ahora" es la misma decisión.
    //
    // ⭐⭐ DECISIÓN NUEVA DE ANTONIO (tanda 12): antes se ignoraban para calcular.
    //    La primera consecuencia real medida fue que **la Estación de Delicias
    //    quedaba sin acceso a pie**, y eso no es un atajo perdido: es un destino
    //    mayor inalcanzable. Ahora **se USAN y se AVISA**, porque la app no tiene
    //    que decidir por el usuario si el edificio está abierto — tiene que
    //    decirle que no lo sabe. Ignorarlo en silencio es fingir que el camino no
    //    existe, que es tan falso como fingir que está abierto.
    //
    // ⭐ C3 · Y el MOTIVO viaja como campo desde aquí hasta la salida, igual que
    //    la precisión: sin él el aviso solo podría decir "puede estar cerrado",
    //    que no le sirve a nadie.
    const et = porEtiqueta(t);
    const cond = !!(et && et.firme);
    const condVia = cond ? et.via : null;
    // el horario declarado, TAL CUAL viene en OSM. No se interpreta ni se traduce.
    const condHorario = cond && t.opening_hours ? t.opening_hours : null;
    // posiciones de corte ordenadas a lo largo del way, con extremos incluidos
    const marcas = [{ idx: 0, t: 0, p: w.pts[0], nodo: w.nodes[0] },
      ...cortes[i],
      { idx: w.pts.length - 1, t: 0, p: w.pts[w.pts.length - 1], nodo: w.nodes[w.nodes.length - 1] }];
    marcas.sort((a, b) => (a.idx - b.idx) || (a.t - b.t));
    // deduplicar marcas en la misma posición
    const limpio = [];
    for (const m of marcas) {
      const ult = limpio[limpio.length - 1];
      if (ult && ult.idx === m.idx && Math.abs(ult.t - m.t) < 1e-9) {
        if (m.nodo != null) ult.nodo = m.nodo;
        if (m.defecto) ult.defecto = true;
        continue;
      }
      limpio.push({ ...m });
    }
    if (limpio.length > 2) cont.particiones += limpio.length - 2;

    for (let m = 0; m + 1 < limpio.length; m++) {
      const A = limpio[m], B = limpio[m + 1];
      // reconstruir la polilínea entre las dos marcas
      const puntos = [A.p];
      for (let k = A.idx + 1; k <= B.idx; k++) {
        if (k === B.idx && B.t === 0) break;
        puntos.push(w.pts[k]);
      }
      puntos.push(B.p);
      let L = 0;
      for (let k = 0; k + 1 < puntos.length; k++) L += dist(puntos[k], puntos[k + 1]);
      if (L < 1e-6) continue;
      const na = nodoDe(A.p, A.nodo), nb = nodoDe(B.p, B.nodo);
      if (na === nb) continue;
      aristas.push({
        a: na, b: nb, largo: L, way: w.id, highway: t.highway,
        // ⭐ TANDA 26/27 · viaja como CAMPO desde aquí, igual que la precisión: el
        //   redactor y el mapa lo necesitan y no tienen las etiquetas a mano.
        precision: pr, nombreNoAplica: sinNom, pie, condicional: cond, condVia, condHorario,
        // el edificio que atraviesa se rellena después, en `condicionales.nombrar()`:
        // aquí solo se sabe lo que dicen las etiquetas del propio way.
        condEdificio: null, condMirado: null,
        unidoPorDefecto: !!(A.defecto || B.defecto),
        pts: puntos,
      });
      cont.precision[pr] = (cont.precision[pr] || 0) + 1;
    }
  }

  // ── 5 · D5 · soldar puntas sueltas ────────────────────────────────────────
  const grado = new Array(nodos.length).fill(0);
  for (const e of aristas) { grado[e.a]++; grado[e.b]++; }
  const puntas = [];
  for (let i = 0; i < nodos.length; i++) if (grado[i] === 1) puntas.push(i);
  const rej2 = new Map();
  const kxy = (n) => `${Math.floor(n.x / 10)},${Math.floor(n.y / 10)}`;
  for (let i = 0; i < nodos.length; i++) {
    const k = kxy(nodos[i]);
    if (!rej2.has(k)) rej2.set(k, []);
    rej2.get(k).push(i);
  }
  const soldadura = new Map();                 // nodo -> nodo destino
  const puntasLejos = [];                      // 2-5 m: contadas y localizadas, no soldadas
  for (const p of puntas) {
    const n = nodos[p];
    let mejor = null, md = Infinity;
    const cx = Math.floor(n.x / 10), cy = Math.floor(n.y / 10);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      for (const q of (rej2.get(x + ',' + y) || [])) {
        if (q === p || soldadura.has(q)) continue;
        const d = Math.hypot(n.x - nodos[q].x, n.y - nodos[q].y);
        if (d > 0 && d < md) { md = d; mejor = q; }
      }
    }
    if (mejor !== null && md <= tol) {
      soldadura.set(p, mejor);
      cont.puntasSoldadas++;
      cont.distanciasPuntas.push(Math.round(md * 100) / 100);
    } else if (mejor !== null && md <= TECHO_PUNTA) {
      cont.puntasFueraDeTecho++;                // entre 2 y 5 m: NO se sueldan, se cuentan
      puntasLejos.push({ p: [n.x, n.y], q: [nodos[mejor].x, nodos[mejor].y], d: Math.round(md * 100) / 100 });
    }
  }
  const resolver = (i) => (soldadura.has(i) ? soldadura.get(i) : i);
  // ⚠️ Soldar cambia la IDENTIDAD del nodo; si no se mueve también la GEOMETRÍA,
  //    el grafo dice "unido" y el dibujo enseña dos líneas separadas hasta 2 m.
  //    Pasó: 20 nodos con dos coordenadas, la peor a 1,90 m. Lo cazó el exportador
  //    del visor, no ningún contador. Se mueve el extremo y se recalcula el largo
  //    —hasta 2 m por arista soldada— para que topología y dibujo digan lo mismo.
  //    Ver bitácora nº53.
  for (const e of aristas) {
    if (soldadura.has(e.a)) { e.a = soldadura.get(e.a); e.pts[0] = [nodos[e.a].x, nodos[e.a].y]; }
    if (soldadura.has(e.b)) { e.b = soldadura.get(e.b); e.pts[e.pts.length - 1] = [nodos[e.b].x, nodos[e.b].y]; }
    let L = 0;
    for (let k = 0; k + 1 < e.pts.length; k++) L += dist(e.pts[k], e.pts[k + 1]);
    e.largo = L;
  }

  cont.aristas = aristas.length;
  cont.nodos = new Set(aristas.flatMap((e) => [e.a, e.b])).size;

  return { nodos, aristas, contadores: cont, noConectados, porDefecto, puntasLejos };
}

module.exports = { planarizar, decidirCruce, precision, nivel, esPuente, esTunel,
  velocidad, esRodada, transitableAPie, porQueNoSeAnda, existeHoy, prohibidoPorElDato,
  valoresDesconocidos, VIARIO_ANDABLE, VIARIO_NO_ANDABLE, ESTADOS_MUERTOS,
  TOLERANCIA_PUNTA, TECHO_PUNTA, SIN_NOMBRE_POR_DEFINICION, FOOTWAY_SIN_NOMBRE,
  sinNombrePorDefinicion };
