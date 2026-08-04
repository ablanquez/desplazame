// ⭐⭐ TANDA 19 · VÍA · FORMA · PAPEL — el modelo, y NADA MÁS que el modelo.
//
// ⛔⛔ ESTE MÓDULO NO TOCA EL MOTOR. No muta el grafo, no decide transitabilidad,
//     no cambia costes. Añade información al lado; `transitableAPie()` sigue
//     mandando sin enterarse de que esto existe.
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ `forma` SON DOS CAMPOS Y NO UN ENUM
// ═════════════════════════════════════════════════════════════════════════════
//   «Acera con carril bici» no es un valor hermano de «acera»: es acera **más
//   algo encima**. Meterlos en el mismo enumerado multiplica valores y vuelve a
//   esconder que la línea es dos cosas — que es justo el error que esta tanda
//   viene a corregir (Antonio: *«una acera que comparte carril bici es una acera
//   en el contexto de caminar y es un carril bici en el contexto de ir en
//   bici»*).
//
//     forma = { plataforma, ciclista }
//
//   · `plataforma` — de qué está hecha la línea. Sale SOLO de OSM.
//   · `ciclista`   — qué infraestructura ciclista lleva encima. Sale SOLO del
//                    municipal, y es `null` cuando no hay.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ POR QUÉ `plataforma` NO COPIA EL ORDEN DE `precision()` — Y QUÉ ESPERO
// ═════════════════════════════════════════════════════════════════════════════
//   `precision` (D4) es EPISTÉMICA: *¿con qué precisión sé por dónde se anda?*
//   `plataforma` es FÍSICA: *¿qué es esta línea?*
//   No son el mismo hecho, así que conviven — pero para que no diverjan en
//   silencio hay un INVARIANTE que las compara contra la tabla `ADMISIBLE`.
//
//   ⛔ Y ese invariante solo vale si `plataforma` se escribe **desde la pregunta
//     física, con su propio orden**. Si copiara el orden de `precision()`,
//     pasaría por construcción y no probaría nada (ley 35).
//
//   ⚠️⚠️ POR ESO **NO ESPERO CERO CHOQUES**, y lo digo ANTES de ejecutar. El
//   álgebra aprobada en A5 decía «0 choques»; escribiendo `plataforma` de verdad
//   aparte, predigo **choques en exactamente dos familias, y en ninguna más**:
//
//     1 · `highway=living_street` — `precision()` lo mete con los peatonales,
//         como si supiéramos por dónde va el peatón. **Físicamente es una
//         CALZADA**: una calle donde el coche va despacio, no una plataforma
//         peatonal. ⇒ yo digo `calzada`, D4 dice `peatonal`.
//     2 · `highway=steps` que además es `footway=crossing` — un paso de peatones
//         escalonado. `precision()` mira el cruce primero; **físicamente lo que
//         hay son escaleras**, y «cruce» es un papel, no un material.
//         ⇒ yo digo `escaleras`, D4 dice `paso-de-peatones`.
//
//   ⇒ Si sale un choque de una TERCERA familia, es un hallazgo y hay que mirarlo.
//     Si salen CERO, es que me he copiado sin darme cuenta y el invariante no
//     vale.

'use strict';

// ── PLATAFORMA · nueve valores, y ninguno es «otros» ────────────────────────
// El último —`calzada`— es una regla real, la misma que hoy es el caso por
// defecto de D4, no un cajón de sastre.
const PLATAFORMAS = ['escaleras', 'paso-de-peatones', 'acera', 'carril-bici',
  'camino', 'pista', 'vial-de-servicio', 'plataforma-peatonal', 'calzada'];

/**
 * ⭐ De qué está hecha esta línea. ORDEN PROPIO, de lo más específico
 * físicamente a lo más genérico. ⛔ No mira `precision()`.
 */
function plataforma(t) {
  t = t || {};
  // 1 · unas escaleras son escaleras aunque además crucen una calle
  if (t.highway === 'steps') return 'escaleras';
  // 2 · un paso de peatones es una franja pintada sobre la calzada
  if (t.footway === 'crossing' || t.highway === 'crossing' || t.path === 'crossing') return 'paso-de-peatones';
  // 3 · una acera es una acera, la dibuje OSM como footway o como lo que sea
  if (t.footway === 'sidewalk') return 'acera';
  // 4 · un carril bici es su propia franja
  if (t.highway === 'cycleway') return 'carril-bici';
  // 5 · un camino de tierra o senda
  if (t.highway === 'path') return 'camino';
  // 6 · una pista agrícola o forestal
  if (t.highway === 'track') return 'pista';
  // 7 · un vial de servicio: es calzada, pero de otra clase
  if (t.highway === 'service') return 'vial-de-servicio';
  // 8 · plataforma por la que se anda sin coches
  if (t.highway === 'footway' || t.highway === 'pedestrian' || t.highway === 'corridor') return 'plataforma-peatonal';
  // 9 · todo lo demás es calzada. `living_street` INCLUIDO: es una calle donde el
  //     coche va despacio, no una plataforma peatonal.
  return 'calzada';
}

// ── CICLISTA · seis valores + null ──────────────────────────────────────────
// Sale del `tipo_carri` del municipal, que en la tanda 18 salió relleno en el
// 100 % de sus 733 features. ⛔ La traducción es literal, no interpretativa.
const CICLISTA = ['carril-en-calzada', 'carril-sobre-acera', 'senda-ciclable',
  'calle-calmada', 'en-obras', 'no-municipal'];

function ciclistaDe(tipoCarri) {
  const s = String(tipoCarri || '');
  if (/acera/i.test(s)) return 'carril-sobre-acera';
  if (/calzada/i.test(s)) return 'carril-en-calzada';
  if (/senda/i.test(s)) return 'senda-ciclable';
  if (/calmado/i.test(s)) return 'calle-calmada';
  if (/construc/i.test(s)) return 'en-obras';
  if (/no municipal/i.test(s)) return 'no-municipal';
  return null;
}

// ── EL INVARIANTE · qué precisión puede llevar cada plataforma ──────────────
// ⚠️ Esta tabla la escribo yo, y por eso va con el porqué de cada fila: es lo
//    único que permite rebatirla.
const ADMISIBLE = {
  // sé exactamente por dónde se cruza
  'paso-de-peatones': ['paso-de-peatones'],
  // sé exactamente por dónde se anda: la línea ES la acera
  'acera': ['acera'],
  // idem
  'escaleras': ['escaleras'],
  // la línea es la franja de la bici; por dónde va el peatón NO lo sé
  'carril-bici': ['eje-de-calzada', 'eje-con-acera-declarada'],
  // se anda por toda la plataforma; la línea es su eje y basta
  'plataforma-peatonal': ['peatonal'],
  // un camino se anda entero: no hay acera que buscar
  'camino': ['peatonal'],
  // una pista es rodada; la acera no existe
  'pista': ['eje-de-calzada', 'eje-con-acera-declarada'],
  'vial-de-servicio': ['eje-de-calzada', 'eje-con-acera-declarada'],
  'calzada': ['eje-de-calzada', 'eje-con-acera-declarada'],
};

const coherente = (plat, prec) => (ADMISIBLE[plat] || []).includes(prec);

// ═════════════════════════════════════════════════════════════════════════════
// EL PAPEL · función pura de la forma. ⛔ NO SE GUARDA.
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ Y NO DECIDE QUIÉN PASA. La transitabilidad la sigue decidiendo
//     `transitableAPie()` sin tocar. Que el papel a pie de un carril segregado
//     diga «esto es para bicis» y el motor siga mandando ahí al peatón es una
//     CONTRADICCIÓN DECLARADA: Antonio confirmó a pie que por el carril del
//     Actur se anda, así que resolverla movería rutas. Se declara, no se arregla.
const A_PIE = {
  'acera': 'acera',
  'calzada': 'eje de calzada, la acera no está dibujada',
  'carril-bici': 'carril bici — se comparte con bicicletas',
  'plataforma-peatonal': 'zona peatonal',
  'camino': 'camino',
  'pista': 'pista',
  'vial-de-servicio': 'vial de servicio',
  'paso-de-peatones': 'paso de peatones',
  'escaleras': 'escaleras',
};

function papel(forma, modo) {
  const plat = forma.plataforma, cic = forma.ciclista || null;
  if (modo === 'pie') {
    return { rol: A_PIE[plat] || plat,
      // el aviso NO cambia el papel: dice con quién se comparte
      comparte: cic === 'carril-sobre-acera' || plat === 'carril-bici' ? 'bicicletas' : null };
  }
  if (modo === 'bici') {
    if (plat === 'escaleras') return { rol: '⛔ no se circula en bici', comparte: null };
    if (plat === 'carril-bici') return { rol: 'carril bici', comparte: null };
    if (cic === 'carril-sobre-acera') return { rol: 'acera compartida', comparte: 'peatones' };
    if (cic === 'carril-en-calzada') return { rol: 'carril bici en calzada', comparte: null };
    if (cic === 'senda-ciclable') return { rol: 'senda ciclable', comparte: 'peatones' };
    if (cic === 'calle-calmada') return { rol: 'calle calmada, se comparte con el tráfico', comparte: 'coches' };
    if (cic === 'en-obras') return { rol: '⛔ en obras', comparte: null };
    if (plat === 'paso-de-peatones') return { rol: 'paso de peatones', comparte: 'peatones' };
    // ⛔ sin dato municipal NO se inventa: no consta que se pueda ni que no
    return { rol: 'NO CONSTA', comparte: null };
  }
  throw new Error('modo desconocido: ' + modo);
}

// ── cómo se cuenta cada plataforma en castellano, para el texto ─────────────
// ⛔ Es una traducción, no una interpretación.
const EN_TEXTO = {
  'carril-bici': 'el carril bici de',
  'acera': 'la acera de',
  'plataforma-peatonal': 'la zona peatonal de',
  'camino': 'el camino de',
  'pista': 'la pista de',
  'vial-de-servicio': 'el vial de servicio de',
  'calzada': null,          // «Por Calle Mayor», sin sustantivo
  'escaleras': null,
  'paso-de-peatones': null,
};

module.exports = { PLATAFORMAS, CICLISTA, ADMISIBLE, plataforma, ciclistaDe,
  coherente, papel, A_PIE, EN_TEXTO };
