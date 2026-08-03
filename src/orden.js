// A · ⭐⭐ EL ORDEN DE LOS NÚMEROS — «si tengo Paseo Pamplona 5, sé que estará
//     entre el 3 y el 7». Idea de Antonio, tanda 15.
//
// ⛔⛔ ESTE MÓDULO DETECTA. NO MUEVE NADA. Ni un portal, ni en una copia que
//     sobreviva a la función que la creó. Mover sería otra decisión y no está
//     tomada — y además cambiaría D0, que dice que el dato de contraste
//     **verifica, no decide**.
//
// ═════════════════════════════════════════════════════════════════════════════
// EL MÉTODO, ESCRITO ANTES DE EJECUTARLO
// ═════════════════════════════════════════════════════════════════════════════
//
// 1 · ⭐⭐ EL TEST ES **LOCAL**, NO GLOBAL. La idea de Antonio no dice «los
//     portales están ordenados a lo largo de la calle»: dice «el 5 está ENTRE el
//     3 y el 7». Eso es una **intercalación**, y se mide en el plano:
//
//         B(a,p,b) = ( |a→p| + |p→b| ) / |a→b|
//
//     Si p está entre a y b, B ≈ 1. Si p se ha ido a otro sitio, B crece sin tope.
//
//     ⭐ POR QUÉ ASÍ Y NO PROYECTANDO SOBRE UN EJE: porque una vía real se parte
//       en decenas de aristas al planarizar, tuerce, y a veces es una L. Un eje
//       principal (PCA) se rompe en la primera curva; la intercalación local no,
//       porque solo mira tres portales seguidos. **Ésa es la razón de elegirlo, y
//       de paso resuelve el caso «vía partida en varias aristas» sin tratarlo.**
//
// 2 · ⭐⭐⭐ SE MIDE **DOS VECES**, Y AHÍ ESTÁ TODO EL VALOR:
//       · `Bportal`   — sobre las coordenadas del AYUNTAMIENTO (`p.m`)
//       · `Benganche` — sobre los puntos donde el motor engancha (`p.q`)
//     La primera dice **cuánto de desordenada viene ya la calle**; la segunda,
//     lo que hace el motor. Es la ley 48 —medir la variable *antes* de que el
//     proceso investigado actúe— pero **gratis**, porque las dos coordenadas
//     están en el mismo fichero desde la tanda 11.
//
// 3 · ⛔ EL UMBRAL **NO SALE DE LOS ENGANCHES**. Sale del **p99 de `Bportal`**
//     sobre todos los tríos: *«el enganche está fuera de orden si está más
//     desordenado que el 99 % de los portales reales»*. El calibrador es el
//     Ayuntamiento, que no sabe nada de nuestro motor.
//     ⚠️ Si lo sacara del grupo BUENOS, **su tasa de falsa alarma sería del 1 %
//        POR CONSTRUCCIÓN** y no mediría nada. Ésa es la trampa obvia y va
//        cerrada desde la primera línea.
//
// 4 · ⭐ EL ESQUEMA DE NUMERACIÓN —par/impar o correlativo— **se decide con las
//     coordenadas del Ayuntamiento, NUNCA con los enganches**. Se prueban las dos
//     cadenas sobre `p.m` y se queda la más ordenada. ⛔ Esa elección no puede
//     sesgar el detector porque no toca `q` ni una vez. (Los correlativos existen
//     y están medidos: Torres de San Lamberto, Polígono San Valero — tanda 4.)
//
// 5 · LOS CASOS RAROS, tratados y CONTADOS, no barridos:
//       · ⛔⛔ `n` REPETIDO — y esto NO es un detalle, es el límite estructural de la
//         idea. **18,5 % de los portales comparten número con otro de su misma
//         vía.** En la Avenida de la Ilustración hay **1.469 portales y 22
//         números**: el «31» son **147 portales**. Un número que aparece 147 veces
//         **no es una posición**, y «el 5 está entre el 3 y el 7» deja de
//         significar nada.
//         ⇒ un número repetido **no puede ser un nodo de la cadena**: se descarta
//           y se cuenta. ⛔ La primera versión se quedaba con «el primero que
//           encontrara», o sea con **uno arbitrario de 147** — y eso no es
//           colapsar: es tirar una moneda y llamarla medición.
//       · tríos con |a→b| < 10 m → se descartan: el cociente es ruido, no señal.
//       · vías de un solo lado → las cubre la elección de esquema.
//       · portales con letra o `bis` → `sortNumber` ya los ordena; son 2.626.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ LA TRAMPA QUE VA A TENER, DICHA ANTES DE ESCRIBIRLO
// ═════════════════════════════════════════════════════════════════════════════
//   **Si un portal está mal y sus vecinos también, TODOS «concuerdan» estando
//   TODOS mal.** La intercalación es invariante a mover el trío entero: si a, p y
//   b se desplazan juntos, B no cambia ni un decimal. Eso es aritmética, no una
//   sospecha — y por eso la contraprueba del fallo correlacionado **no es una
//   comprobación más: es la que define para qué sirve esto**.

'use strict';

/** Distancia euclídea entre dos puntos en metros. */
const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const MIN_AB = 10;        // m — por debajo de esto el cociente es ruido
const MIN_CADENA = 5;     // portales por cadena; con 5 salen 3 tríos

/**
 * Cadenas de una vía: los portales ordenados por número, en el esquema que mejor
 * describa **las coordenadas del Ayuntamiento**.
 * @returns {{esquema:'par/impar'|'correlativa'|null, cadenas:Array<Array>, motivo:string}}
 */
function cadenas(portales) {
  // ⛔ un número que aparece más de una vez NO tiene posición: fuera de la cadena.
  const cuenta = new Map();
  for (const p of portales) cuenta.set(p.n, (cuenta.get(p.n) || 0) + 1);
  const únicos = portales.filter((p) => cuenta.get(p.n) === 1).sort((a, b) => a.n - b.n);
  const repetidos = portales.length - únicos.length;
  if (únicos.length < MIN_CADENA) {
    return { esquema: null, cadenas: [], repetidos,
      motivo: repetidos > portales.length / 2
        ? `${repetidos} de ${portales.length} portales comparten número: la numeración no localiza`
        : 'menos de ' + MIN_CADENA + ' números únicos' };
  }

  const impar = únicos.filter((p) => p.n % 2 === 1);
  const par = únicos.filter((p) => p.n % 2 === 0);
  const opciones = [
    { esquema: 'par/impar', cadenas: [impar, par].filter((c) => c.length >= MIN_CADENA) },
    { esquema: 'correlativa', cadenas: [únicos] },
  ];

  let mejor = null;
  for (const o of opciones) {
    const t = o.cadenas.flatMap((c) => triples(c, (p) => p.m));
    if (t.length < 3) continue;
    const v = t.map((x) => x.B).sort((a, b) => a - b);
    const med = v[Math.floor(v.length / 2)];
    if (!mejor || med < mejor.med) mejor = { ...o, med, nTriples: t.length };
  }
  if (!mejor) return { esquema: null, cadenas: [], repetidos, motivo: 'ninguna cadena llega a 3 tríos' };
  return { esquema: mejor.esquema, cadenas: mejor.cadenas, repetidos,
    medianaPortal: mejor.med, motivo: 'ok' };
}

/**
 * Tríos consecutivos de una cadena, con su intercalación.
 * `coord(p)` decide sobre QUÉ se mide: `p.m` (el Ayuntamiento) o `p.q` (el motor).
 */
function triples(cadena, coord) {
  const out = [];
  for (let i = 1; i + 1 < cadena.length; i++) {
    const a = cadena[i - 1], p = cadena[i], b = cadena[i + 1];
    const xa = coord(a), xp = coord(p), xb = coord(b);
    if (!xa || !xp || !xb) continue;
    const ab = d2(xa, xb);
    if (ab < MIN_AB) continue;                  // ruido, no señal — se cuenta aparte
    out.push({ a, p, b, B: (d2(xa, xp) + d2(xp, xb)) / ab, ab });
  }
  return out;
}

/**
 * Evalúa una vía entera. Devuelve un registro por portal con las DOS medidas.
 * @returns {Array<{p, Bportal, Benganche, a, b, prediccion, dPrediccion}>}
 */
function evaluar(portales) {
  const c = cadenas(portales);
  if (!c.esquema) return { esquema: null, motivo: c.motivo, repetidos: c.repetidos || 0, filas: [], cortos: 0 };
  const filas = [];
  // ⭐ los tríos que se caen por |a→b| < MIN_AB se CUENTAN, no se barren: es una
  //    pérdida de cobertura y tiene que salir en el informe.
  let cortos = 0;
  for (const cad of c.cadenas) {
    for (let i = 1; i + 1 < cad.length; i++) {
      if (d2(cad[i - 1].m, cad[i + 1].m) < MIN_AB) cortos++;
    }
  }
  for (const cad of c.cadenas) {
    const tp = triples(cad, (p) => p.m);
    const te = triples(cad, (p) => p.q);
    const porId = new Map();
    for (const t of tp) porId.set(t.p.id, { tp: t });
    for (const t of te) {
      const v = porId.get(t.p.id);
      if (v) v.te = t; else porId.set(t.p.id, { te: t });
    }
    for (const [, v] of porId) {
      if (!v.tp || !v.te) continue;             // solo donde las dos medidas existen
      const t = v.te;
      // ⭐ DÓNDE DEBERÍA ESTAR: interpolación por número entre los enganches de sus
      //    dos vecinos. ⚠️ Vale exactamente lo que valgan esos dos vecinos — si
      //    ellos también están mal, la predicción está mal. Se publica con ese aviso.
      const f = (t.p.n - t.a.n) / (t.b.n - t.a.n);
      const pred = [t.a.q[0] + f * (t.b.q[0] - t.a.q[0]), t.a.q[1] + f * (t.b.q[1] - t.a.q[1])];
      filas.push({ p: v.tp.p, Bportal: v.tp.B, Benganche: v.te.B, a: t.a, b: t.b,
        ab: t.ab, prediccion: pred, dPrediccion: d2(t.p.q, pred) });
    }
  }
  return { esquema: c.esquema, motivo: 'ok', medianaPortal: c.medianaPortal,
    repetidos: c.repetidos || 0, cortos, filas };
}

module.exports = { cadenas, triples, evaluar, d2, MIN_AB, MIN_CADENA };
