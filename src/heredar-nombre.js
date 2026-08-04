// ⭐⭐ ¿DE QUÉ CALLE ES ESTA ACERA? — el método, y NADA MÁS que el método.
//
// Idea de Antonio: *«si una línea la tenemos sin nombre, ¿no se puede deducir a
// partir de esos puntos el nombre de la vía?»* — los «puntos» son los PORTALES.
//
// ⛔⛔ ESTO NO TOCA EL MOTOR, NI CAMBIA NINGÚN NOMBRE. Es una capa de prueba: se
//     mide si la idea funciona, y ya. Aplicarla —si se aplica— es decisión de
//     Antonio y va DESPUÉS de la auditoría de H1.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LA GARANTÍA ESTRUCTURAL: ESTE MÓDULO NO PUEDE LEER EL NOMBRE DE OSM
// ═════════════════════════════════════════════════════════════════════════════
//   El patrón de verdad consiste en tapar el nombre de una arista que SÍ lo tiene
//   y ver si el método lo adivina. Eso se puede fingir de la forma más tonta del
//   mundo: leyendo el nombre que se supone tapado. Sería un espejo — exactamente
//   la forma del fallo nº92 de la tanda pasada.
//
//   ⇒ La defensa NO es acordarse de no hacerlo (eso es disciplina, no mecanismo,
//     ley 37). La defensa es que **este módulo recibe una PROYECCIÓN de cada
//     portal con tres campos y ninguno es el nombre de OSM**:
//         { arista, nucleoMunicipal, dEnganche }
//     `nucleoMunicipal` viene del `codigoVia` del Ayuntamiento — una fuente
//     distinta de OSM, que es justo lo que hace la idea de Antonio más fuerte que
//     la mía (heredar de la arista vecina, que es OSM contra OSM).
//     El campo `nucleoOsm` **no existe aquí**: no se puede leer lo que no llega.
//
//   ⭐ Y encima `src/nombrar-aceras.js` instala un cepo sobre `g.nombres.get`
//     mientras evalúa, y comprueba primero que el cepo salta. Dos cosas
//     independientes, porque una sola nunca se ha visto saltar.
//
// ═════════════════════════════════════════════════════════════════════════════
// LOS DOS ÚNICOS UMBRALES, FIJADOS ANTES DE VER UN SOLO RESULTADO
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ Si hubiera que moverlos, se declara el cambio y se repite la contraprueba
//    ENTERA. Afinar el umbral hasta que el acierto suba es ajustar el instrumento
//    al resultado — prohibido, y ya ha pasado dos veces en este proyecto (nº88,
//    nº91).
//
//   · MIN_PORTALES = 3 · ⭐ NO me lo invento: es el mismo listón que
//     `src/enganche.js` puso en la tanda 6 para el consenso de la nube —
//     *«el consenso NO opina si la vía tiene menos de 3 portales con nombre: con
//     uno o dos, "la mayoría" es una palabra grande para nada»*. Se reutiliza
//     porque la pregunta es idéntica (¿cuántos votos hacen una mayoría?) y porque
//     un umbral heredado de otra pregunta no está elegido para que salga bien
//     ésta (ley 17).
//
//   · ACUERDO = 2/3 · Éste SÍ lo elijo yo, y por eso va dicho: con el mínimo de
//     tres portales, 2/3 son «dos de tres» — la mayoría más floja que se admite.
//     ⚠️ Es una decisión mía y el informe publica la CURVA entera (acierto y
//     cobertura a 0,50 · 0,60 · 0,67 · 0,75 · 0,90 · 1,00) para que se vea de qué
//     depende. ⛔ Pero el número que se publica es el de 2/3, fijado antes.
//
// ⭐ LOS EMPATES NO NECESITAN REGLA APARTE, y eso es a propósito: un 2–2 da
//    acuerdo 0,50 y cae solo en AMBIGUA. Una regla extra para empates sería un
//    tercer umbral escondido.
//
// ═════════════════════════════════════════════════════════════════════════════
// TRES RESULTADOS, NO DOS
// ═════════════════════════════════════════════════════════════════════════════
//   · NOMBRADA — los portales están de acuerdo con margen suficiente
//   · AMBIGUA  — hay portales de varias vías y ninguna domina
//   · MUDA     — no hay portales bastantes con nombre municipal
//
//   ⚠️ AMBIGUA es un RESULTADO, no un problema. Una acera de esquina tiene
//      portales de dos calles y no es de ninguna en exclusiva. Un método que no
//      produjera ni una sola ambigua en una ciudad con esquinas estaría mal
//      planteado, no acertando.

'use strict';

const MIN_PORTALES = 3;
const ACUERDO = 2 / 3;

/**
 * La proyección de un portal que este módulo admite. ⛔ Tres campos. El nombre de
 * OSM no está, y no está a propósito.
 */
function proyectar(o) {
  return {
    arista: o.arista,
    nucleoMunicipal: (o.via && o.via.nucleo) || null,
    dEnganche: o.d,
  };
}

/** Agrupa proyecciones por arista. */
function agrupar(proyecciones) {
  const m = new Map();
  for (const p of proyecciones) {
    if (p.arista == null) continue;
    if (!m.has(p.arista)) m.set(p.arista, []);
    m.get(p.arista).push(p);
  }
  return m;
}

/**
 * La decisión sobre UNA arista, a partir de los portales que le dan.
 * @param {Array} lista proyecciones de esa arista
 * @param {Function} [nucleoDe] de dónde sale el nombre de cada portal. Se inyecta
 *   para poder BARAJARLO en la contraprueba sin tocar el método.
 */
function decidir(lista, nucleoDe = (p) => p.nucleoMunicipal) {
  const nucleos = (lista || []).map(nucleoDe).filter((x) => x);
  const n = nucleos.length;
  if (n < MIN_PORTALES) {
    return { estado: 'MUDA', nombre: null, acuerdo: null, votos: n,
      razon: `solo ${n} portal(es) con nombre municipal; hacen falta ${MIN_PORTALES}` };
  }
  const c = new Map();
  for (const k of nucleos) c.set(k, (c.get(k) || 0) + 1);
  const orden = [...c.entries()].sort((a, b) => b[1] - a[1]);
  const [lider, votos] = orden[0];
  const acuerdo = votos / n;
  if (acuerdo >= ACUERDO) {
    return { estado: 'NOMBRADA', nombre: lider, acuerdo, votos: n, apoyo: votos,
      distintos: c.size, segunda: orden[1] ? orden[1][0] : null };
  }
  return { estado: 'AMBIGUA', nombre: null, acuerdo, votos: n, distintos: c.size,
    candidatos: orden.slice(0, 3).map(([k, v]) => ({ nucleo: k, votos: v })) };
}

/** La decisión para TODAS las aristas de un grupo. Devuelve Map<arista, decisión>. */
function decidirTodas(grupos, nucleoDe) {
  const out = new Map();
  for (const [ia, lista] of grupos) out.set(ia, decidir(lista, nucleoDe));
  return out;
}

module.exports = { MIN_PORTALES, ACUERDO, proyectar, agrupar, decidir, decidirTodas };
