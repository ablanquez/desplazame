// Geometría: proyección y distancias.
//
// ⭐ TODO se mide en METROS, nunca en grados. Restar grados no es una distancia:
//    un grado de longitud en Zaragoza son ~83 km y uno de latitud ~111 km, así que
//    una diferencia "pequeña" en grados es distinta según la dirección.
//    Proyección: EPSG:25830 (UTM huso 30N, ETRS89), que es la que sirve el WFS
//    municipal — así los dos datos viven en el mismo marco sin conversiones ad hoc.

'use strict';

// Elipsoide GRS80 (ETRS89). Idéntico a WGS84 a efectos de este proyecto:
// la diferencia entre los dos marcos en la península es de ~1 cm/año acumulado
// desde 1989, muy por debajo de la tolerancia de 2,0 m de D5.
const A = 6378137.0;                 // semieje mayor
const F = 1 / 298.257222101;         // achatamiento
const E2 = F * (2 - F);              // excentricidad al cuadrado
const K0 = 0.9996;                   // factor de escala UTM
const HUSO = 30;
const LON0 = ((HUSO - 1) * 6 - 180 + 3) * Math.PI / 180;   // meridiano central: -3°
const FALSE_E = 500000.0;
const FALSE_N = 0.0;                 // hemisferio norte

const rad = (g) => g * Math.PI / 180;

/** WGS84/ETRS89 (grados) -> UTM 30N (metros). Serie clásica; error < 1 mm en la zona. */
function aMetros(lon, lat) {
  const phi = rad(lat), lam = rad(lon);
  const N = A / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = (E2 / (1 - E2)) * Math.cos(phi) ** 2;
  const Adif = Math.cos(phi) * (lam - LON0);

  const e4 = E2 * E2, e6 = e4 * E2;
  const M = A * (
    (1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
    - (3 * E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi)
    - (35 * e6 / 3072) * Math.sin(6 * phi)
  );

  const x = FALSE_E + K0 * N * (
    Adif + (1 - T + C) * Adif ** 3 / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * (E2 / (1 - E2))) * Adif ** 5 / 120
  );
  const y = FALSE_N + K0 * (
    M + N * Math.tan(phi) * (
      Adif ** 2 / 2 + (5 - T + 9 * C + 4 * C * C) * Adif ** 4 / 24
      + (61 - 58 * T + T * T + 600 * C - 330 * (E2 / (1 - E2))) * Adif ** 6 / 720
    )
  );
  return [x, y];
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Distancia de un punto a un segmento, y el parámetro t del pie de perpendicular. */
function distPuntoSegmento(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  const t = L2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
  return { d: Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)), t };
}

/**
 * Corte de dos segmentos ABIERTOS (sin contar los extremos compartidos).
 * Devuelve null si no se cortan, o {p, t, u} con el punto y los parámetros.
 * ⚠️ Se excluyen a propósito los cortes EN los extremos: ésos son nodos
 *    compartidos o puntas sueltas, y los tratan D1·C1 y D5 respectivamente.
 */
function corteSegmentos(p1, p2, p3, p4, eps = 1e-9) {
  const r = [p2[0] - p1[0], p2[1] - p1[1]];
  const s = [p4[0] - p3[0], p4[1] - p3[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < eps) return null;                 // paralelos o colineales
  const qp = [p3[0] - p1[0], p3[1] - p1[1]];
  const t = (qp[0] * s[1] - qp[1] * s[0]) / den;
  const u = (qp[0] * r[1] - qp[1] * r[0]) / den;
  const M = 1e-9;
  if (t <= M || t >= 1 - M || u <= M || u >= 1 - M) return null;
  return { p: [p1[0] + t * r[0], p1[1] + t * r[1]], t, u };
}

module.exports = { aMetros, dist, distPuntoSegmento, corteSegmentos, HUSO };
