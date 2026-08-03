// A · `entrance=*` — SI EL DATO DICE DÓNDE SE ENTRA, SE ENTRA POR AHÍ.
//
// ⭐ Decisión nueva de Antonio (tanda 14). El orden es:
//      entrada PRINCIPAL → entrada CUALQUIERA (avisando de que no es la principal)
//      → punto de PERÍMETRO más barato por ruta → ⛔ NUNCA el centroide.
//
// ⭐ POR QUÉ SE USA AUNQUE SOLO ESTÉ EN EL 3,9 % DE LOS EDIFICIOS: porque donde
//    está, **es la puerta de verdad**. Calcular un punto propio teniendo el dato es
//    preferir nuestra estimación a la información. No arregla el caso general —el
//    96,1 % sigue con el perímetro— pero arregla el caso concreto donde alguien se
//    plantaría delante de una pared. Y hay uno medido: la Estación de Delicias
//    ruteaba a 25,8 m de su `entrance=main` (tanda 13, D3).
//
// ═════════════════════════════════════════════════════════════════════════════
// LA CLASIFICACIÓN — antes de contar (ley 29), y con el motivo de cada corte
// ═════════════════════════════════════════════════════════════════════════════
//   Los 2.085 nodos con `entrance=*` del término, tal como vienen:
//      yes 1707 · main 295 · service 24 · garage 22 · emergency 16 · exit 11
//      shop 4 · gate 2 · staircase 2 · no 1 · secondary 1
//
//   ⭐ `main` es la principal. Es la única que el dato declara como tal.
//   ⭐ `yes`, `secondary`, `staircase`, `shop` son accesos de PERSONA por los que
//      se puede entrar, pero el dato NO dice que sean la principal ⇒ se usan **con
//      aviso**. Una `yes` puede ser una puerta lateral perfectamente buena o una de
//      servicio que nadie etiquetó mejor: el dato no distingue, y el aviso tampoco
//      pretende distinguir — dice exactamente lo que se sabe.
//   ⛔ NO SE USAN, y cada una por su motivo, no por parecerse entre ellas:
//        · `no`        — el dato declara que **no es una entrada**. Usarla sería
//                        contradecir la única cosa que el mapa afirma de ese nodo.
//        · `exit`      — es SALIDA. Se sale, no se entra.
//        · `emergency` — salida de emergencia: por definición no se abre desde
//                        fuera. Mandar a alguien ahí es mandarlo a una pared.
//        · `service`   — acceso de servicio: es del personal, no del que llega.
//        · `garage`    — es para el coche, y esto es un motor a pie.
//      Son 74 nodos de 2.085 (3,5 %). ⚠️ Se CUENTAN y se declaran; no desaparecen.
//
// ⚠️⚠️ EL CABO QUE NO SE PUEDE CERRAR, dicho antes de que nadie lo suponga:
//    **una entrada declarada puede estar cerrada al público.** Un portón que solo
//    se abre de día, una puerta de un edificio que cambió de uso, una entrada que
//    existía cuando alguien la mapeó. `entrance=*` dice *«aquí hay una puerta»*, no
//    *«aquí se puede pasar ahora»*. Con este dato no hay forma de saber lo segundo:
//    **NO CONSTA**, y no por falta de método sino por falta de dato. Es exactamente
//    el mismo límite que tienen los pasos condicionales, y se declara igual.
//
// ⛔ Y esto NO es la capa municipal corrigiendo el enganche (D0 sigue intacta):
//    `entrance` es OSM, la misma fuente de la que sale el grafo. No se está
//    metiendo un dato ajeno a decidir; se está usando el dato propio que ya estaba
//    y que no se había pedido.

'use strict';
const fs = require('fs');
const path = require('path');
const { aMetros } = require('./geo');

const FICHERO = path.join(__dirname, '..', 'data', 'fuentes',
  '2026-08-03_overpass_zaragoza-entrance-nodos.json');

// ⭐ Las tres clases, escritas como listas explícitas y NO como "todo lo que no
//    sea X". Un `default` invisible es una decisión que nadie tomó — es la forma
//    del fallo nº69 —, así que un valor nuevo que aparezca mañana en OSM cae en
//    `desconocida` y sale contado aparte, no colado por la puerta de atrás.
const PRINCIPAL = new Set(['main']);
const PERSONA = new Set(['yes', 'secondary', 'staircase', 'shop', 'gate']);
const DESCARTADA = new Map([
  ['no', 'el dato declara que NO es una entrada'],
  ['exit', 'es salida, no entrada'],
  ['emergency', 'salida de emergencia: no se abre desde fuera'],
  ['service', 'acceso de servicio: no es para quien llega'],
  ['garage', 'es para el coche, y esto es un motor a pie'],
]);

/** `main` | `persona` | `descartada` | `desconocida` */
function clase(tipo) {
  if (PRINCIPAL.has(tipo)) return 'main';
  if (PERSONA.has(tipo)) return 'persona';
  if (DESCARTADA.has(tipo)) return 'descartada';
  return 'desconocida';
}

let _cache = null;

/**
 * Carga los nodos `entrance=*`, proyectados a metros y clasificados.
 * @returns {{porNodo:Map, sello, n, porTipo:Map, control:{farmacias:number}}}
 */
function cargar(ruta = FICHERO) {
  if (_cache) return _cache;
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const porNodo = new Map();
  const porTipo = new Map();
  for (const e of d.elements) {
    const t = (e.tags || {}).entrance;
    if (!t) continue;
    porTipo.set(t, (porTipo.get(t) || 0) + 1);
    porNodo.set(e.id, { id: e.id, lat: e.lat, lon: e.lon, tipo: t, clase: clase(t),
      m: aMetros(e.lon, e.lat) });
  }
  // ⭐ POSITIVO DE CONTROL de la propia descarga: la consulta pedía además las
  //    farmacias. Si salieran 0, un cero de entradas sería indistinguible de un
  //    fichero roto. No lo elige quien mide: venía en la consulta de la tanda 13.
  const farmacias = d.elements.filter((e) => (e.tags || {}).amenity === 'pharmacy').length;
  _cache = { porNodo, porTipo, n: porNodo.size, sello: d.osm3s && d.osm3s.timestamp_osm_base,
    control: { farmacias, elementos: d.elements.length }, ruta };
  return _cache;
}

/**
 * Las entradas de un edificio, **emparejadas por ID DE NODO** — identidad, no
 * proximidad. Es el único eje que no admite tolerancia: una entrada a 3 m puede
 * ser del edificio de al lado.
 * @param {number[]} nodos  la lista `w.nodes` del way del edificio
 * @returns {{principales:[], persona:[], descartadas:[], desconocidas:[]}}
 */
function deEdificio(nodos, E) {
  const r = { principales: [], persona: [], descartadas: [], desconocidas: [] };
  if (!nodos) return r;
  for (const n of nodos) {
    const e = E.porNodo.get(n);
    if (!e) continue;
    if (e.clase === 'main') r.principales.push(e);
    else if (e.clase === 'persona') r.persona.push(e);
    else if (e.clase === 'descartada') r.descartadas.push(e);
    else r.desconocidas.push(e);
  }
  return r;
}

/**
 * ⭐ LA REGLA, en un sitio y solo en uno.
 * Devuelve qué entradas se usan y en qué nivel del orden estamos.
 * @returns {{nivel:'principal'|'cualquiera'|'perimetro', usar:[], aviso:string|null}}
 */
function elegir(acc) {
  if (acc.principales.length) {
    return { nivel: 'principal', usar: acc.principales, aviso: null };
  }
  if (acc.persona.length) {
    // ⛔ NO se inventa el nombre de nada: el aviso dice el tipo tal cual viene del
    //    dato y no una interpretación. Si OSM pone `yes`, el aviso dice `yes`.
    const tipos = [...new Set(acc.persona.map((e) => e.tipo))].join(', ');
    return { nivel: 'cualquiera', usar: acc.persona,
      aviso: `se te lleva a una entrada del edificio, pero el mapa no dice que sea la principal `
        + `(entrance=${tipos}). Puede ser una puerta lateral.` };
  }
  return { nivel: 'perimetro', usar: [], aviso: null };
}

module.exports = { cargar, deEdificio, elegir, clase, FICHERO,
  PRINCIPAL, PERSONA, DESCARTADA };
