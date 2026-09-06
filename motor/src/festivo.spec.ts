/**
 * ⭐ LAS JUECES DE LA CAPA DEL FESTIVO (6/09).
 *
 * ⚠️ **CERO RED.** Los tres cuadros son **trozos REALES** de las páginas que la
 * sonda del 6/09 guardó enteras, recortados desde el anclaje que el parser
 * busca —`<label for="times-date">`— hasta el `</table>` de las últimas
 * salidas. No hay ni un byte compuesto: es la ley de la entrada nº32 de
 * `docs/BITACORA.md`, la del *fixture* de la DGT que copiaba el texto medido y
 * se inventaba el envoltorio.
 *
 * El fallo que estas jueces vigilan es de los que no se ven: una capa que
 * suple un calendario puede **pisar un día que el feed sí trae** sin que nadie
 * se entere, porque el viaje sigue saliendo. Por eso la juez 4 es un sello.
 *
 * ⭐ ── LA REGLA DE CASA (6/09) ───────────────────────────────────
 *
 * **Una juez que compra un viaje concreto de un día concreto lo monta sobre la
 * red OPERATIVA —`aplicarDesvios` con el recorrido de ese día—, o declara en su
 * propio comentario por qué la red pelada le vale.**
 *
 * Sale de la entrada nº36 de `docs/BITACORA.md`, que es la tercera del mismo
 * día sobre la misma forma de equivocarse. La juez 4 de la ventana horaria
 * montaba sobre la red del feed y sellaba un `29+38` que **baja en el poste
 * 1293 · Coso 80 y sube en el 334 · Coso 55**, dos postes que hoy no pisa nadie
 * porque el Coso está en obras. Con 603 jueces en verde.
 *
 * El porqué es de manual: [GTFS Trip Modifications] *«el consumidor debe
 * comportarse como si el estático hubiera sido modificado»*, **y una juez
 * también es un consumidor**. Una que se construye a mano el mundo que debería
 * vigilar no vigila: imita, y lo imitado cuadra siempre.
 *
 * ⚠️ **«Declarar» no es una salida fácil, es una obligación de escribir.** Vale
 *    para las jueces que compran una RELACIÓN —«con la capa cambia y sin ella
 *    no», «con reloj sale igual que sin él», «dos consultas son dos visitas»—,
 *    porque esa relación se sostiene sobre cualquier red mientras sea la misma
 *    en los dos lados. No vale para las que compran un itinerario.
 */
import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cargarGrafo } from './grafo.ts';
import { cargarRed } from './red.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { cargarPortales } from './portales.ts';
import { cargarCallejero } from './callejero.ts';
import { cargarSitios } from './sitios.ts';
import { entornoDe } from './gacetero.ts';
import { cargarRedDeLaRueda } from './red-rueda.ts';
import { cargarAparcabicis } from './aparcabicis.ts';
import { cargarBiZi } from './bizi.ts';
import { elFeedQueSeSirve } from './feed.ts';
import { andarConElPeaton, cocinar, type PatronBus, type RedDeBus } from './red-bus.ts';
import { lineaDelViaje, viajeEnBus, intervaloDeHoy } from './viaje-bus.ts';
import {
  aplicarDesvios,
  aristaDeLaTraza,
  avisoDeDesvio,
  rodarConElCoche,
  servirOperativa,
  type RedConDesvios,
} from './patron-operativo.ts';
import { cargarRedDeCoche } from './coche.ts';
import { claveDe, oficialDe, refrescarDesvios, olvidarDesvios } from './desvios.ts';
import { invalidarNonce } from './recorrido.ts';
import { prepararViajeEnBus } from './viaje-bus.ts';
import type { Motor } from './trayecto.ts';
import type { Extremo } from './etapas.ts';
import {
  leerCuadro,
  pedirCuadro,
  traerCuadro,
  servirCuadro,
  cuadroServido,
  olvidarElFestivo,
  visitasAlCuadro,
  olvidarLasVisitas,
  tipoDeDiaDe,
  huecosDelCalendario,
  laVentana,
  dentroDeLaVentana,
  refrescarElFestivo,
  avisoDelFestivo,
  VENTANA_DIAS,
  type CuadroDelDia,
} from './festivo.ts';

/** El domingo del caso. Dentro del calendario del feed y de la ventana medida. */
const DOMINGO = '20260913';
/** Y el lunes de al lado, que el feed SÍ trae entero. */
const LUNES = '20260914';

/** CALLE EL COLOSO 2 y AVENIDA ALCALDE GÓMEZ LAGUNA 38. */
const COLOSO = 'Portales.93310';
const LAGUNA = 'Portales.92683';

/**
 * ⭐ EL CUADRO REAL DEL 35, sentido −1, domingo 13/09. Bytes de la página.
 *
 * Trae lo que el parser necesita y en el orden en que está: el eco de la fecha,
 * la frase de las tres frecuencias y las dos tablas. Y trae **la cicatriz**:
 * las celdas se abren con `<td>` y se cierran con `</th>`.
 */
const CUADRO_35_DOMINGO = "<label for=\"times-date\" >Fecha: </label>\n\t\t\t\t\t\t<input type=\"date\" id=\"times-date\" name=\"times-date\" value=\"2026-09-13\" form=\"lines-form\">\n\t\t\t\t\t\t<input class=\"button-red\" style=\"padding: 6px 1rem;background-color: var(--wp--preset--color--secondary);color: var(--wp--preset--color--background);border-radius: 8px;border: none;cursor: pointer;font-size:1rem;\" type=\"submit\" name =\"times-date-submit\" value=\"Cambiar\" form=\"lines-form\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<p style=\"text-align:left;\">Frecuencia media: laborables: 6, sábados: 9, domingos y festivos: 10 min. </p>\n\t\t\t\t\t<div class=\"container-horarios-table\" style=\"width: 100%;\">\n\t\t\t\t\t\t<h3 style=\"color: var(--wp--preset--color--primary);\">Primeras salidas</h3>\n\t\t\t\t\t\t<p id=\"table-horarios-primeras-desc\" aria-hidden=\"true\">\n  Cada fila presenta una de las primeras salidas en la fecha seleccionada. En cada fila se presenta la hora de salida y el sentido del bus.\n  </p>\n\t\t\t\t\t\t<table class=\"table-horarios\" style=\"margin-right: 0;\" aria-describedby=\"table-horarios-primeras-desc\">\n\t\t\t\t\t\t\t<caption class=\"visually-hidden\">Primeras salidas</caption>\n\t\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<th>Hora</th>\n\t\t\t\t\t\t\t\t\t<th>Desde</th>\n\t\t\t\t\t\t\t\t\t<th>Hasta</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t\t<tbody>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:00</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:35</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:59</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>08:29</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>08:49</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>09:02</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</tbody>\n\t\t\t\t\t\t</table>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"container-horarios-table\" style=\"width: 100%;\">\n\t\t\t\t\t\t<h3 style=\"color: var(--wp--preset--color--primary);\">Últimas salidas</h3>\n\t\t\t\t\t\t<p id=\"table-horarios-ultimas-desc\" aria-hidden=\"true\">\n  Cada fila presenta una de las últimas salidas en la fecha seleccionada. En cada fila se presenta la hora de salida y el sentido del bus.\n  </p>\n\t\t\t\t\t\t<table class=\"table-horarios\" aria-describedby=\"table-horarios-ultimas-desc\">\n\t\t\t\t\t\t\t<caption class=\"visually-hidden\">Últimas salidas</caption>\n\t\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<th>Hora</th>\n\t\t\t\t\t\t\t\t\t<th>Desde</th>\n\t\t\t\t\t\t\t\t\t<th>Hasta</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t\t<tbody>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>23:11</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>23:31</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>23:45</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>P. MINA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>00:00</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>00:19</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>PLAZA ARAGON</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>00:35</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>P. MINA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>01:20</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>PLAZA ARAGON</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</tbody>\n\t\t\t\t\t\t</table>";

/** El de la 22, mismo sentido y misma fecha. */
const CUADRO_22_DOMINGO = "<label for=\"times-date\" >Fecha: </label>\n\t\t\t\t\t\t<input type=\"date\" id=\"times-date\" name=\"times-date\" value=\"2026-09-13\" form=\"lines-form\">\n\t\t\t\t\t\t<input class=\"button-red\" style=\"padding: 6px 1rem;background-color: var(--wp--preset--color--secondary);color: var(--wp--preset--color--background);border-radius: 8px;border: none;cursor: pointer;font-size:1rem;\" type=\"submit\" name =\"times-date-submit\" value=\"Cambiar\" form=\"lines-form\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<p style=\"text-align:left;\">Frecuencia media: laborables: 8, sábados: 10, domingos y festivos: 11 min. </p>\n\t\t\t\t\t<div class=\"container-horarios-table\" style=\"width: 100%;\">\n\t\t\t\t\t\t<h3 style=\"color: var(--wp--preset--color--primary);\">Primeras salidas</h3>\n\t\t\t\t\t\t<p id=\"table-horarios-primeras-desc\" aria-hidden=\"true\">\n  Cada fila presenta una de las primeras salidas en la fecha seleccionada. En cada fila se presenta la hora de salida y el sentido del bus.\n  </p>\n\t\t\t\t\t\t<table class=\"table-horarios\" style=\"margin-right: 0;\" aria-describedby=\"table-horarios-primeras-desc\">\n\t\t\t\t\t\t\t<caption class=\"visually-hidden\">Primeras salidas</caption>\n\t\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<th>Hora</th>\n\t\t\t\t\t\t\t\t\t<th>Desde</th>\n\t\t\t\t\t\t\t\t\t<th>Hasta</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t\t<tbody>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>06:28</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>06:56</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:23</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:49</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>08:14</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>08:33</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</tbody>\n\t\t\t\t\t\t</table>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"container-horarios-table\" style=\"width: 100%;\">\n\t\t\t\t\t\t<h3 style=\"color: var(--wp--preset--color--primary);\">Últimas salidas</h3>\n\t\t\t\t\t\t<p id=\"table-horarios-ultimas-desc\" aria-hidden=\"true\">\n  Cada fila presenta una de las últimas salidas en la fecha seleccionada. En cada fila se presenta la hora de salida y el sentido del bus.\n  </p>\n\t\t\t\t\t\t<table class=\"table-horarios\" aria-describedby=\"table-horarios-ultimas-desc\">\n\t\t\t\t\t\t\t<caption class=\"visually-hidden\">Últimas salidas</caption>\n\t\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<th>Hora</th>\n\t\t\t\t\t\t\t\t\t<th>Desde</th>\n\t\t\t\t\t\t\t\t\t<th>Hasta</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t\t<tbody>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>22:34</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>22:54</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>23:16</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>23:38</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>00:00</th>\n\t\t\t\t\t\t\t\t\t<td>LAS FUENTES</th>\n\t\t\t\t\t\t\t\t\t<td>BOMBARDA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</tbody>\n\t\t\t\t\t\t</table>";

/**
 * ⭐ Y LA PÁGINA DE FUERA DE LA VENTANA, también real: el 35 pedido para el
 * **+14**. Contesta 200 con 150.503 bytes, **repite bien la fecha** y trae la
 * frase de las frecuencias — y **no trae ni una tabla**.
 *
 * ⚠️ Es el fixture que hacía falta y no estaba, y lo destapó la contraprueba:
 *    con un cuerpo cualquiera, `pedirCuadro` moría antes, en el eco de la
 *    fecha, y la juez 2 creía estar comprando «sin tablas no hay cuadro»
 *    cuando compraba otra cosa. Un mudo que INVENTABA servicio pasaba entera.
 */
const CUADRO_35_FUERA_DE_VENTANA = "<label for=\"times-date\" >Fecha: </label>\n\t\t\t\t\t\t<input type=\"date\" id=\"times-date\" name=\"times-date\" value=\"2026-09-20\" form=\"lines-form\">\n\t\t\t\t\t\t<input class=\"button-red\" style=\"padding: 6px 1rem;background-color: var(--wp--preset--color--secondary);color: var(--wp--preset--color--background);border-radius: 8px;border: none;cursor: pointer;font-size:1rem;\" type=\"submit\" name =\"times-date-submit\" value=\"Cambiar\" form=\"lines-form\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<p style=\"text-align:left;\">Frecuencia media: laborables: 6, sábados: 9, domingos y festivos: 10 min. </p>\n\t\t\t\t\t<div class=\"container-horarios-table\" style=\"width: 100%;\">\n\t\t\t\t\t\t<h3 style=\"color: var(--wp--preset--color--primary);\">Primeras salidas</h3>\n\t\t\t\t\t\t<p style=\"font-size: 14px; text-align:left; width:258px;\">Sin datos para la fecha seleccionada</p>\n\t\t\t\t\t</div>";

/** Y el del 35 en LABORABLE, para la juez 4: el día que el feed sí trae. */
const CUADRO_35_LUNES = "<label for=\"times-date\" >Fecha: </label>\n\t\t\t\t\t\t<input type=\"date\" id=\"times-date\" name=\"times-date\" value=\"2026-09-07\" form=\"lines-form\">\n\t\t\t\t\t\t<input class=\"button-red\" style=\"padding: 6px 1rem;background-color: var(--wp--preset--color--secondary);color: var(--wp--preset--color--background);border-radius: 8px;border: none;cursor: pointer;font-size:1rem;\" type=\"submit\" name =\"times-date-submit\" value=\"Cambiar\" form=\"lines-form\">\n\t\t\t\t\t</div>\n\t\t\t\t\t<p style=\"text-align:left;\">Frecuencia media: laborables: 6, sábados: 9, domingos y festivos: 10 min. </p>\n\t\t\t\t\t<div class=\"container-horarios-table\" style=\"width: 100%;\">\n\t\t\t\t\t\t<h3 style=\"color: var(--wp--preset--color--primary);\">Primeras salidas</h3>\n\t\t\t\t\t\t<p id=\"table-horarios-primeras-desc\" aria-hidden=\"true\">\n  Cada fila presenta una de las primeras salidas en la fecha seleccionada. En cada fila se presenta la hora de salida y el sentido del bus.\n  </p>\n\t\t\t\t\t\t<table class=\"table-horarios\" style=\"margin-right: 0;\" aria-describedby=\"table-horarios-primeras-desc\">\n\t\t\t\t\t\t\t<caption class=\"visually-hidden\">Primeras salidas</caption>\n\t\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<th>Hora</th>\n\t\t\t\t\t\t\t\t\t<th>Desde</th>\n\t\t\t\t\t\t\t\t\t<th>Hasta</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t\t<tbody>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>05:00</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>05:30</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>05:55</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>06:13</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>06:30</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>06:46</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:01</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:10</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>07:18</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</tbody>\n\t\t\t\t\t\t</table>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"container-horarios-table\" style=\"width: 100%;\">\n\t\t\t\t\t\t<h3 style=\"color: var(--wp--preset--color--primary);\">Últimas salidas</h3>\n\t\t\t\t\t\t<p id=\"table-horarios-ultimas-desc\" aria-hidden=\"true\">\n  Cada fila presenta una de las últimas salidas en la fecha seleccionada. En cada fila se presenta la hora de salida y el sentido del bus.\n  </p>\n\t\t\t\t\t\t<table class=\"table-horarios\" aria-describedby=\"table-horarios-ultimas-desc\">\n\t\t\t\t\t\t\t<caption class=\"visually-hidden\">Últimas salidas</caption>\n\t\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<th>Hora</th>\n\t\t\t\t\t\t\t\t\t<th>Desde</th>\n\t\t\t\t\t\t\t\t\t<th>Hasta</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t\t<tbody>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>21:52</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>21:59</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>22:05</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>22:13</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>22:28</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>23:05</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>23:44</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>SEMINARIO</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>00:02</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>P. MINA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t\t<td>00:42</th>\n\t\t\t\t\t\t\t\t\t<td>PARQUE GOYA</th>\n\t\t\t\t\t\t\t\t\t<td>P. MINA</th>\n\t\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t</tbody>\n\t\t\t\t\t\t</table>";


let motor: Motor;
let red: RedDeBus;
let coloso: Extremo;
let laguna: Extremo;

/** Un `fetch` de mentira que contesta con el trozo real que se le diga. */
function laWebContesta(porLinea: Readonly<Record<string, string>>): {
  readonly pedir: typeof fetch;
  readonly visitas: () => number;
} {
  let n = 0;
  const pedir = (async (url: string | URL | Request, init?: RequestInit) => {
    n++;
    const u = String(url);
    const linea = /selectLinea=([^&]+)/.exec(u)?.[1] ?? '';
    const cuerpo = String(init?.body ?? '');
    const fecha = /times-date=([\d-]+)/.exec(cuerpo)?.[1] ?? '';
    const suyo = porLinea[`${linea}|${fecha}`] ?? porLinea[linea];
    if (suyo === undefined) {
      return new Response('sin cuadro', { status: 200 });
    }
    return new Response(suyo, { status: 200 });
  }) as unknown as typeof fetch;
  return { pedir, visitas: () => n };
}

/** El cuadro ya leído, como lo dejaría una pasada del refresco. */
function comoSiLoHubieraLeido(
  linea: string,
  direccion: string,
  fecha: string,
  html: string,
): CuadroDelDia {
  const leido = leerCuadro(html, 'F')!;
  return { linea, direccion, fecha, tipo: 'F', ...leido, cuando: Date.now() };
}

/**
 * ⭐ ¿Es éste el aviso de la capa del festivo?
 *
 * ⚠️ Se reconoce por su FORMA —`Línea X hoy: … (Fuente: Avanza, HH:MM)`— y no
 *    por un trozo de prosa. La frase se acortó el 6/09 y cuatro jueces buscaban
 *    «cuadro web de Avanza», que ya no está: si se hubiera dejado así, habrían
 *    dado por «no hay aviso» en vez de por «el aviso cambió».
 */
const esDelFestivo = (a: { readonly texto: string }): boolean =>
  /^Línea .+ hoy: /.test(a.texto) && a.texto.includes('Fuente: Avanza,');

/** Las líneas por las que un trayecto va montado, en orden. */
const lineasDe = (t: { readonly tramos: readonly { readonly linea?: { readonly corto: string } }[] }) =>
  t.tramos.map((x) => x.linea?.corto).filter((x): x is string => !!x);

describe('⭐ LA CAPA DEL FESTIVO — el cuadro web suple al calendario', () => {
  before(async () => {
    const peaton = cargarRed(cargarGrafo());
    const portales = cargarPortales();
    const callejero = cargarCallejero(portales);
    const redRueda = cargarRedDeLaRueda(cargarGrafo(), peaton, entornoDe(portales));
    motor = {
      red: peaton,
      rejilla: cargarRejilla(peaton),
      portales,
      callejero,
      sitios: cargarSitios(portales, callejero),
      cuaderno: cuadernoPara(peaton),
      redRueda,
      rejillaRueda: cargarRejilla(redRueda),
      cuadernoRueda: cuadernoPara(redRueda),
      aparcabicis: cargarAparcabicis(callejero, entornoDe(portales)),
      bizi: cargarBiZi(entornoDe(portales)),
    };
    red = (
      await cocinar(
        elFeedQueSeSirve().ruta,
        andarConElPeaton(peaton, cargarRejilla(peaton), cuadernoPara(peaton)),
      )
    ).red;
    servirOperativa(null);
    const donde = (codigo: string, nombre: string): Extremo => {
      const p = portales.situados.find((s) => s.codigo === codigo)!;
      return { lat: p.lat, lon: p.lon, nombre };
    };
    coloso = donde(COLOSO, 'Calle El Coloso 2');
    laguna = donde(LAGUNA, 'Avenida Alcalde Gómez Laguna 38');
  });

  beforeEach(() => {
    olvidarElFestivo();
    olvidarLasVisitas();
  });

  /**
   * ⭐ JUEZ 1 — EL CASO DEL 6/09.
   *
   * `CALLE EL COLOSO 2 → AV. ALCALDE GÓMEZ LAGUNA 38` en domingo. El 35 sale
   * del **mismo poste que el 29** —el 33, a 60 m—, y con la 22 enlaza en
   * `720 · Plaza de España` sin andar ni un metro. Medido el 6/09: en laborable
   * ese viaje son **54,0 min** contra los **65,7** de la mejor alternativa de
   * dos vehículos, y el buscador no lo daba porque el feed dice que el 35 y la
   * 22 no circulan en domingo.
   *
   * Se compra **la ida y la vuelta**: con la capa sale por 35+22 y con su
   * aviso; sin ella, por otras líneas. Si solo se comprara lo primero, un
   * buscador que diera 35+22 siempre pasaría igual.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra una RELACIÓN —con la capa el 35 aparece, sin ella no— y las dos mitades
 * se miden sobre la misma red. **Lo que esta juez NO compra es que el viaje sea
 * transitable hoy**: eso lo compra la juez 1 del describe de abajo, sobre la
 * operativa, y es la que cazó el transbordo imposible del poste 720 [nº34].
 */
  test('⭐ 1 · en domingo, con la capa el viaje sale por el 35 y la 22, y lo dice', () => {
    const sinCapa = viajeEnBus(motor, red, coloso, laguna, DOMINGO);
    const lineasSin = lineasDe(sinCapa);
    assert.ok(lineasSin.length > 0, 'sin la capa tiene que haber viaje: no se compara con la nada');
    assert.ok(
      !lineasSin.includes('35'),
      `sin la capa el 35 no puede aparecer, y apareció: ${lineasSin.join('+')}`,
    );

    servirCuadro(comoSiLoHubieraLeido('35', '0', DOMINGO, CUADRO_35_DOMINGO));
    servirCuadro(comoSiLoHubieraLeido('22', '0', DOMINGO, CUADRO_22_DOMINGO));

    const conCapa = viajeEnBus(motor, red, coloso, laguna, DOMINGO);
    const lineasCon = lineasDe(conCapa);
    assert.deepEqual(
      lineasCon,
      ['35', '22'],
      `con la capa el viaje tenía que ir por 35+22 y fue por ${lineasCon.join('+') || '(nada)'}`,
    );
    assert.ok(
      conCapa.segundos < sinCapa.segundos,
      `y tiene que ser mejor: ${(conCapa.segundos / 60).toFixed(1)} min contra ${(sinCapa.segundos / 60).toFixed(1)}`,
    );

    // ⭐ Y LO DICE, en los dos sitios: arriba y colgado del paso de subir.
    const delFestivo = conCapa.avisos.filter(esDelFestivo);
    assert.equal(delFestivo.length, 2, 'un aviso por cada línea suplida');
    for (const a of delFestivo) {
      assert.ok(a.texto.includes('Fuente: Avanza'), 'el aviso dice de quién es el dato');
      assert.ok(typeof a.paso === 'number', 'y cuelga del paso en el que se sube a esa línea');
      const paso = conCapa.pasos[a.paso!]!;
      assert.ok(
        paso.giro === 'sube' || paso.giro === 'transborda',
        `el aviso cuelga de un paso de «${paso.giro}», que no es una subida`,
      );
    }
    assert.ok(
      delFestivo.some((a) => a.texto.startsWith('Línea 35 hoy:')) &&
        delFestivo.some((a) => a.texto.startsWith('Línea 22 hoy:')),
      'y nombra las dos líneas',
    );
  });

  /**
   * ⭐ JUEZ 2 — EL MUDO NO INVENTA.
   *
   * Si la web no contesta —o contesta sin cuadro, que es lo que hace fuera de
   * su ventana—, la línea se queda **como el feed diga**: sin servicio. No
   * saber no es saber lo contrario, y un servicio inventado manda a alguien a
   * una marquesina vacía.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra una AUSENCIA —la línea no aparece—, y un desvío no hace aparecer a
 * quien no circula.
 */
  test('⭐ 2 · una línea sin cuadro web sigue sin servicio', async () => {
    const el35 = red.patrones.find(
      (p) => lineaDelViaje(red, p).corto === '35' && p.principal && p.direccion === '0',
    )!;
    assert.equal(intervaloDeHoy(el35, red, DOMINGO), null, 'de partida, el feed no da nada');

    // ⭐ LA PÁGINA VACÍA DE VERDAD: 200, la fecha bien repetida, la frase de
    //    las frecuencias… y ni una tabla. Es la respuesta que el operador da
    //    fuera de su ventana, y la que un mudo mal escrito convertiría en
    //    servicio inventado.
    // ⚠️ Y se le pide **la fecha que esa página contesta** —el +14—, no otra:
    //    con otra,  moriría antes en el eco y la juez volvería a
    //    comprar lo que no cree comprar. Es el mismo tropiezón, dos veces.
    const FUERA = '20260920';
    const { pedir } = laWebContesta({ '35': CUADRO_35_FUERA_DE_VENTANA });
    const nada = await pedirCuadro('35', '0', FUERA, 'F', pedir);
    assert.equal(nada, null, 'sin tablas no hay cuadro que servir');
    assert.equal(cuadroServido('35', '0', FUERA), null, 'y no se guarda nada');

    // Y con un cuerpo que ni siquiera repite la fecha, también `null` —pero por
    // otra puerta, la del eco—. Las dos se compran, que no son la misma.
    const { pedir: raro } = laWebContesta({});
    assert.equal(await pedirCuadro('35', '0', DOMINGO, 'F', raro), null);
    assert.equal(cuadroServido('35', '0', DOMINGO), null);
    assert.equal(intervaloDeHoy(el35, red, DOMINGO), null, 'y la línea sigue sin circular');

    // Y si la red se cae del todo, lo mismo: `null`, no una excepción.
    const seCae = (async () => {
      throw new Error('la red no va');
    }) as unknown as typeof fetch;
    assert.equal(await pedirCuadro('35', '0', DOMINGO, 'F', seCae), null);
    assert.equal(intervaloDeHoy(el35, red, DOMINGO), null);

    const viaje = viajeEnBus(motor, red, coloso, laguna, DOMINGO);
    assert.ok(!lineasDe(viaje).includes('35'), 'y el viaje no se va por una línea que no circula');
  });

  /**
   * ⭐ JUEZ 3 — FUERA DE LA VENTANA MANDA EL FEED.
   *
   * La ventana es **de hoy a +9 días**, medida día a día el 6/09: el −1 y del
   * +10 en adelante la web devuelve la página vacía. Así que a +10 no hay nada
   * que suplir, y preguntar sería gastar una visita para nada.
   */
  test('⭐ 3 · fuera de la ventana no se suple: manda el feed a secas', () => {
    const hoy = new Date(2026, 8, 6);
    const ventana = laVentana(hoy);
    assert.equal(ventana.length, VENTANA_DIAS + 1, 'hoy y los nueve siguientes');
    assert.equal(ventana[0], '20260906');
    assert.equal(ventana[ventana.length - 1], '20260915');
    assert.ok(dentroDeLaVentana('20260913', hoy), 'el domingo del caso está dentro');
    assert.ok(!dentroDeLaVentana('20260916', hoy), 'el +10 está fuera');
    assert.ok(!dentroDeLaVentana('20260905', hoy), 'y el de ayer también');

    // ⭐ Y lo que la web contesta fuera de la ventana, con sus bytes: frase de
    //    frecuencias sí, tablas no. De ahí no sale un cuadro.
    assert.ok(
      CUADRO_35_FUERA_DE_VENTANA.includes('Frecuencia media'),
      'la página de fuera de ventana trae la frase…',
    );
    assert.ok(
      !CUADRO_35_FUERA_DE_VENTANA.includes('table-horarios-primeras-desc'),
      '…y no trae las tablas',
    );
    assert.equal(leerCuadro(CUADRO_35_FUERA_DE_VENTANA, 'F'), null);
  });

  /**
   * ⭐ JUEZ 4 — EL SELLO: LA CAPA NO PISA UN DÍA QUE EL FEED SÍ TRAE.
   *
   * Es la juez que de verdad importa, porque el fallo que vigila **no se ve**:
   * un viaje que sale por una frecuencia inventada sale igual de bien en la
   * pantalla. El sello es el sha256 del viaje entero en laborable —metros,
   * segundos, líneas, pasos y avisos—, y se comprueba **con la capa cargada de
   * cuadros del 35**: si alguno se colara, el número cambia.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: compra que dos cálculos sobre la MISMA red den lo mismo. Es un sello de
 * no-cambio, no un itinerario.
 */
  test('⭐ 4 · el laborable no cambia ni un byte, con la capa llena', () => {
    const sello = (): string => {
      const t = viajeEnBus(motor, red, coloso, laguna, LUNES);
      const h = createHash('sha256');
      h.update(
        `${t.metros}|${t.segundos}|${lineasDe(t).join('+')}|` +
          t.pasos.map((p) => `${p.giro}~${p.metros}~${p.texto}`).join('#') +
          '|' +
          t.avisos.map((a) => `${a.paso ?? '-'}~${a.texto}`).join('#'),
      );
      return h.digest('hex');
    };
    const limpio = sello();

    // Ahora se le mete a la capa el cuadro del 35 PARA ESE MISMO LUNES.
    servirCuadro(comoSiLoHubieraLeido('35', '0', LUNES, CUADRO_35_LUNES));
    servirCuadro(comoSiLoHubieraLeido('35', '1', LUNES, CUADRO_35_LUNES));
    servirCuadro(comoSiLoHubieraLeido('22', '0', LUNES, CUADRO_22_DOMINGO));
    assert.notEqual(cuadroServido('35', '0', LUNES), null, 'la capa está cargada de verdad');

    assert.equal(
      sello(),
      limpio,
      'la capa ha tocado un día que el feed sí trae: donde el calendario habla, ella calla',
    );
  });

  /**
   * ⭐ JUEZ 5 — DOS BÚSQUEDAS SEGUIDAS SON UNA SOLA VISITA.
   *
   * Caché con TTL **y** single-flight, como el desvío, el poste y el BiZi. Las
   * dos cosas se compran por separado: primero dos preguntas **a la vez** —que
   * es lo que el single-flight resuelve— y luego una **después** —que es lo que
   * resuelve la caché—.
   */
  test('⭐ 5 · dos preguntas simultáneas hacen UNA visita, y la de después ninguna', async () => {
    const { pedir, visitas } = laWebContesta({ '35': CUADRO_35_DOMINGO });

    const [a, b] = await Promise.all([
      traerCuadro('35', '0', DOMINGO, 'F', pedir),
      traerCuadro('35', '0', DOMINGO, 'F', pedir),
    ]);
    assert.ok(a && b, 'las dos tienen que traer cuadro');
    assert.equal(visitas(), 1, 'dos preguntas a la vez, UNA visita a la web');
    assert.equal(visitasAlCuadro(), 1);

    const c = await traerCuadro('35', '0', DOMINGO, 'F', pedir);
    assert.ok(c);
    assert.equal(visitas(), 1, 'y la de después sale de la caché');

    // ⚠️ Y el otro sentido es otra clave: no se le puede dar el cuadro del −1.
    await traerCuadro('35', '1', DOMINGO, 'F', pedir);
    assert.equal(visitas(), 2, 'el sentido contrario es otra pregunta');
  });

  /**
   * ⭐ JUEZ 6 — LA MURALLA DE LOS OCHO MODOS.
   *
   * No se copia aquí: es la `⭐ 13` de `motor/src/muralla-modos.spec.ts` y corre
   * en la misma suite. Lo que sí se compra aquí es **la condición que la hace
   * válida para esta capa**: con la capa vacía —que es como la muralla corre—
   * el bus contesta exactamente lo que contestaba, porque `cuadroServido`
   * devuelve `null` y `intervaloDeHoy` cae en su rama de siempre.
   */
  test('⭐ 6 · con la capa vacía el motor es el de antes (la muralla sigue valiendo)', () => {
    olvidarElFestivo();
    const el35 = red.patrones.find(
      (p) => lineaDelViaje(red, p).corto === '35' && p.principal && p.direccion === '0',
    )!;
    const el29 = red.patrones.find(
      (p) => lineaDelViaje(red, p).corto === '29' && p.principal && p.direccion === '1',
    )!;
    assert.equal(cuadroServido('35', '0', DOMINGO), null, 'la capa está vacía');
    assert.equal(intervaloDeHoy(el35, red, DOMINGO), null, 'y el 35 no circula, como siempre');
    assert.ok(
      (intervaloDeHoy(el29, red, DOMINGO) ?? 0) > 0,
      'mientras que el 29, que el feed sí trae, sigue circulando',
    );
  });

  // ── Las piezas sueltas, que también son suyas ─────────────────────────────

  /**
   * ⭐ EL TIPO DE DÍA sale del GTFS, no del calendario gregoriano.
   *
   * Medido el 6/09 sobre el feed servido: sábado `S=208`, domingo `F=197`,
   * lunes `L=317`. Y una fecha con un servicio huérfano suelto no es un tipo de
   * día: es un huérfano.
   */
  test('⭐ el tipo de día lo dice el propio feed, por mayoría', () => {
    assert.equal(tipoDeDiaDe(red, '20260905'), 'S', 'sábado');
    assert.equal(tipoDeDiaDe(red, '20260906'), 'F', 'domingo');
    assert.equal(tipoDeDiaDe(red, '20260907'), 'L', 'lunes');
    assert.equal(tipoDeDiaDe(red, '20261009'), null, 'un día de un solo servicio huérfano: no consta');
    assert.equal(tipoDeDiaDe(red, '20990101'), null, 'y una fecha sin nada, tampoco');
  });

  /** ⭐ El parser, sobre los bytes de verdad. */
  test('⭐ el parser lee la frecuencia del tipo que toca y las dos puntas', () => {
    const dom = leerCuadro(CUADRO_35_DOMINGO, 'F');
    assert.deepEqual(dom, { intervaloS: 600, primera: '07:00', ultima: '01:20' });
    // La MISMA página, preguntada por otro tipo de día, da otra frecuencia: la
    // frase trae las tres y elegir mal es el error que hay que poder cometer.
    assert.equal(leerCuadro(CUADRO_35_DOMINGO, 'L')?.intervaloS, 360);
    assert.equal(leerCuadro(CUADRO_35_DOMINGO, 'S')?.intervaloS, 540);
    assert.deepEqual(leerCuadro(CUADRO_22_DOMINGO, 'F'), {
      intervaloS: 660,
      primera: '06:28',
      ultima: '00:00',
    });
    // Y una página sin tablas —la de fuera de ventana— no es media lectura.
    assert.equal(leerCuadro('<p>Frecuencia media: laborables: 6 min.</p>', 'F'), null);
    assert.equal(leerCuadro('nada de nada', 'F'), null);
  });

  /**
   * ⭐ LOS HUECOS y el refresco entero, con el `fetch` de mentira.
   *
   * Se compra la cuenta: cuántos sentidos principales no tienen ni un viaje ese
   * domingo, cuántos contesta la web y cuántos se quedan mudos.
   */
  test('⭐ el refresco cuenta huecos, suplidos y mudos', async () => {
    const cortoDe = (p: PatronBus) => lineaDelViaje(red, p).corto;
    const huecos = huecosDelCalendario(red, DOMINGO, cortoDe);
    const lineas = new Set(huecos.map((h) => h.linea));
    assert.deepEqual(
      [...lineas].sort(),
      ['22', '23', '31', '33', '34', '35', '39', '44'],
      'las siete líneas del hueco de curso, y la 44',
    );
    // ⚠️ **Y son 15, no 14.** Las siete van con sus dos sentidos; la **44**
    //    aporta UNO SOLO — tiene un sentido con servicio ese domingo y el otro
    //    sin él. Se compra el número medido, no el que uno esperaría: si algún
    //    día la 44 entera se cayera, esta juez lo diría.
    assert.equal(huecos.length, 15);
    assert.equal(huecos.filter((h) => h.linea === '44').length, 1, 'la 44, un solo sentido');

    const { pedir, visitas } = laWebContesta({ '35': CUADRO_35_DOMINGO, '22': CUADRO_22_DOMINGO });
    const cuentas = await refrescarElFestivo(red, DOMINGO, cortoDe, pedir, 0);
    assert.equal(cuentas.huecos, 15);
    assert.equal(cuentas.suplidos, 4, 'el 35 y la 22, sus dos sentidos cada una');
    assert.equal(cuentas.mudos, 11, 'y las demás se quedan como el feed las dejó');
    assert.equal(visitas(), 15, 'una visita por hueco, ni una más');
  });

  /**
   * ⭐ LA FRASE, CORTA Y ENTERA (6/09).
   *
   *     Línea 35 hoy: 07:00–01:20, cada ~10 min (Fuente: Avanza, 16:27)
   *
   * Se compran las dos mitades: **que esté todo lo que hace falta** —línea,
   * ventana, frecuencia y la atribución con su hora— y **que NO esté la tripa**
   * que se quitó. Sin lo segundo, un día alguien vuelve a explicar el feed en un
   * aviso y nadie se entera [GTFS-RT Best Practices: *«sé conciso»*].
   */
  test('⭐ la frase del festivo es corta, y no ha perdido la fuente', () => {
    const corto = avisoDelFestivo(comoSiLoHubieraLeido('35', '0', DOMINGO, CUADRO_35_DOMINGO));

    // Lo que TIENE que estar.
    assert.ok(corto.startsWith('Línea 35 hoy: '), `no empieza por la línea: ${corto}`);
    assert.ok(/\d{1,2}:\d{2}–\d{1,2}:\d{2}/.test(corto), `sin la ventana: ${corto}`);
    assert.ok(/cada ~\d+ min/.test(corto), `sin la frecuencia aproximada: ${corto}`);
    assert.ok(/\(Fuente: Avanza, \d{1,2}:\d{2}\)$/.test(corto), `sin la atribución al final: ${corto}`);

    // Y lo que NO puede volver: la fontanería, palabra por palabra.
    for (const tripa of [
      'sale del cuadro web',
      'el calendario del feed',
      'no trae el festivo',
      'de esta línea',
    ]) {
      assert.ok(!corto.includes(tripa), `la tripa vieja ha vuelto: «${tripa}» en ${corto}`);
    }

    // ⚠️ Y un tope, que es el punto de todo esto. La de antes medía 161.
    assert.ok(corto.length <= 70, `${corto.length} caracteres, y el tope son 70: ${corto}`);
  });

  // ⚠️ Aquí vivía «el aviso nombra la fuente y la hora», y se ha BORRADO el
  //    6/09: compraba, entre otras cosas, que el aviso incluyera «el calendario
  //    del feed no trae el festivo de esta línea» —justo la tripa que la frase
  //    corta quita—. La juez de arriba compra todo lo que ésta compraba (línea,
  //    ventana, frecuencia, fuente con hora) y además que esa tripa NO vuelva.
  //    Dejarla habría sido tener dos jueces peleadas por el mismo texto.
});

/**
 * ⭐ EL RECORRIDO REAL DE LA 22 SENTIDO −1, el domingo 6/09/2026.
 *
 * Los **31 postes enteros** que `admin-ajax.php?action=get_stops_list` contestó,
 * copiados uno a uno y sin recortar [la ley de la entrada nº32]. El feed trae
 * **33** para ese mismo sentido, y la diferencia son las obras del Coso:
 *
 * · **fuera hoy:** `790`, `788`, `787` (San Vicente de Paúl), **`720 · Plaza De
 *   España`** y `710` (Plaza Aragón / Capitanía)
 * · **nuevos hoy:** `1248` (P. de La Mina), `634` y `632` (P. de La Constitución)
 *
 * ⚠️ El `720` es el poste del parlamento: es donde el viaje suplido mandaba
 *    transbordar del 35 a la 22, y la 22 **hoy no pasa por ahí**.
 */
const RECORRIDO_22_HOY: readonly { readonly poste: number; readonly nombre: string }[] = [
  { poste: 755, nombre: "Rodrigo Rebolledo / Fray Luis Urbano" },
  { poste: 754, nombre: "Rodrigo Rebolledo n.º 33" },
  { poste: 753, nombre: "Rodrigo Rebolledo n.º 7" },
  { poste: 532, nombre: "Jorge Cocci n.º 17" },
  { poste: 3031, nombre: "Jorge Cocci n.º 3" },
  { poste: 3032, nombre: "Asalto / Edificio Trovador" },
  { poste: 660, nombre: "P. Echegaray Y Caballero / Puente del Pilar" },
  { poste: 1248, nombre: "P. de La Mina n.º 15" },
  { poste: 634, nombre: "P. de La Constitución n.º 33 / Plaza de Los Sitios" },
  { poste: 632, nombre: "P. de La Constitución n.º 11 / Plaza Aragón" },
  { poste: 682, nombre: "P. Pamplona / Puerta del Carmen" },
  { poste: 674, nombre: "P. Mª Agustín n.º 12 / C.M.E. Ramón Y Cajal" },
  { poste: 675, nombre: "P. María Agustín n.º 26 / Edif. Pignatelli" },
  { poste: 51, nombre: "Anselmo Clavé / Correos" },
  { poste: 52, nombre: "Anselmo Clavé / Santander" },
  { poste: 795, nombre: "Santander n.º 34" },
  { poste: 435, nombre: "Duquesa Villahermosa n.º 10" },
  { poste: 436, nombre: "Duquesa Villahermosa n.º 42" },
  { poste: 442, nombre: "Duquesa Villahermosa n.º 109 / Vía Univérsitas" },
  { poste: 852, nombre: "Vía Univérsitas n.º 17" },
  { poste: 133, nombre: "Av. Gómez Laguna n.º 6" },
  { poste: 134, nombre: "Av. Gómez Laguna n.º 20" },
  { poste: 137, nombre: "Av. Gómez Laguna n.º 48" },
  { poste: 3051, nombre: "Vía Hispanidad n.º 56" },
  { poste: 822, nombre: "Vía Hispanidad / Villa de Andorra" },
  { poste: 826, nombre: "Vía Hispanidad n.º 80" },
  { poste: 829, nombre: "Vía Hispanidad n.º 100 / Los Enlaces" },
  { poste: 3044, nombre: "Vía Hispanidad / Brea de Aragón" },
  { poste: 3045, nombre: "Vía Hispanidad / Miguel Labordeta" },
  { poste: 750, nombre: "Ramón J. Sender n.º 4" },
  { poste: 857, nombre: "Vicente Blanco / Centro Comercial" },
];

/** Los postes por los que la 22 SÍ pasa hoy, para preguntarle a un transbordo. */
const PISA_HOY = new Set(RECORRIDO_22_HOY.map((p) => p.poste));

/**
 * ⭐ `Paseo de La Mina 15`, al lado del poste `1248`.
 *
 * Es el portal que hace falta para la juez 4: el `1248` **no está en el patrón
 * del feed para la 22** —la 22 pasaba por San Vicente de Paúl y Plaza de
 * España—. Existe en su recorrido **solo hoy**, porque el desvío lo trajo.
 */
const MINA = 'Portales.79294';

describe('⭐ LA CAPA DEL FESTIVO SOBRE EL PATRÓN OPERATIVO — el desvío primero', () => {
  let compuesta: RedConDesvios;
  let mina: Extremo;

  /**
   * ⭐ LA FUENTE DE MENTIRA, con la forma de la de verdad.
   *
   * A la 22 sentido −1 le contesta **el recorrido real de hoy**; a todo lo demás,
   * su propia secuencia oficial —o sea, «sin desvío»—. Así la única línea
   * desviada de la red compuesta es la del caso, y lo que cambie se le puede
   * atribuir a ella.
   *
   * 🔒 El nonce es inventado: aquí no hay ninguno de verdad, ni lo habrá.
   */
  const laFuenteDeHoy: typeof fetch = (async (
    _url: string,
    opciones?: { body?: string },
  ): Promise<Response> => {
    const cuerpo = new URLSearchParams(opciones?.body ?? '');
    const linea = cuerpo.get('selectLinea');
    if (!linea) {
      return new Response('<input id="avz_bus_ajax_nonce" value="fingido" />', { status: 200 });
    }
    const sentido = cuerpo.get('selectSentido');
    const postes =
      linea === '22' && sentido === '-1'
        ? RECORRIDO_22_HOY
        : oficialDe(
            red,
            red.patrones.find(
              (x) =>
                x.principal &&
                x.modo === 'bus' &&
                lineaDelViaje(red, x).corto === linea &&
                (x.direccion === '0' ? '-1' : '-2') === sentido,
            )!,
          );
    return new Response(
      postes.map((q) => `<option value="${q.poste}">${q.poste} - ${q.nombre}</option>`).join(''),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  /**
   * ⭐ Y LA OPERATIVA SE COMPONE **COMO EN PRODUCCIÓN**, no a mano.
   *
   * ⚠️ Es la diferencia entre una juez que vigila y una que acompaña. Si aquí
   *    se le pasara a `aplicarDesvios` un veredicto de la 22 escrito en el
   *    propio test, estas jueces darían verde **aunque el refresco no
   *    preguntara por ella nunca** — que es exactamente el fallo del 6/09.
   *    Mandando el refresco, quien decide a quién se pregunta es el código de
   *    producción, y su filtro queda comprado de paso.
   */
  before(async () => {
    const p = motor.portales.situados.find((s) => s.codigo === MINA)!;
    mina = { lat: p.lat, lon: p.lon, nombre: 'Paseo de La Mina 15' };
    const coche = cargarRedDeCoche();
    const rodar = rodarConElCoche(coche);
    olvidarDesvios();
    invalidarNonce();
    const { leido } = await refrescarDesvios(red, DOMINGO, laFuenteDeHoy, 0);
    compuesta = aplicarDesvios(
      red,
      (linea, direccion) => leido.get(claveDe(linea, direccion)) ?? null,
      new Map(),
      rodar,
      (traza, saliendo) => aristaDeLaTraza(coche, traza, saliendo),
    );
  });

  beforeEach(() => {
    olvidarElFestivo();
    olvidarDesvios();
    servirOperativa(null);
  });

  /** El viaje del caso, montado sobre la red que se le pase. */
  const elCaso = (deQueRed: RedDeBus, conDesvios?: Parameters<typeof prepararViajeEnBus>[5]) =>
    prepararViajeEnBus(motor, deQueRed, coloso, laguna, DOMINGO, conDesvios).trayecto();

  /** Los cuadros del 35 y de la 22, como si la web ya los hubiera contestado. */
  const conLaCapaLlena = (): void => {
    servirCuadro(comoSiLoHubieraLeido('35', '0', DOMINGO, CUADRO_35_DOMINGO));
    servirCuadro(comoSiLoHubieraLeido('22', '0', DOMINGO, CUADRO_22_DOMINGO));
  };

  /** El poste en el que un trayecto cambia de la 35 a la 22, si lo hay. */
  const posteDelTransbordo = (t: { readonly pasos: readonly { readonly giro: string; readonly texto: string }[] }) => {
    const paso = t.pasos.find((p) => p.giro === 'transborda' && /línea 22/.test(p.texto));
    const m = paso ? /poste (\d+)/.exec(paso.texto) : null;
    return m ? Number(m[1]) : null;
  };

  /**
   * ⭐ JUEZ 1 — EL CASO DEL OJO.
   *
   * Con la capa del festivo llena Y el desvío de hoy aplicado, el viaje **no
   * puede** mandar transbordar en un poste que la 22 hoy no pisa. Se compra la
   * ida y la vuelta: sobre la red del feed el transbordo cae en el `720` —que
   * es el fallo— y sobre la operativa, o cae en un poste de los de hoy, o no
   * hay transbordo a la 22 en absoluto.
   */
  test('⭐ 1 · el transbordo a la 22 cae donde la 22 pasa HOY, no donde el feed cree', () => {
    conLaCapaLlena();

    // (i) Sobre la red del FEED —lo que había—: el transbordo va al 720.
    const conElFeed = elCaso(red);
    assert.deepEqual(lineasDe(conElFeed), ['35', '22'], 'el caso del ojo va por 35+22');
    assert.equal(
      posteDelTransbordo(conElFeed),
      720,
      'sobre la red del feed el transbordo cae en el 720: si no, esta juez ya no vigila nada',
    );
    assert.ok(!PISA_HOY.has(720), 'y el 720 no está en el recorrido de hoy');

    // (ii) Sobre la OPERATIVA: o cae donde la 22 pasa hoy, o no hay 22.
    servirOperativa(compuesta);
    const conElDesvio = elCaso(compuesta.red, {
      suprimidas: compuesta.suprimidas,
      avisos: compuesta.desviadas.map((x) => ({
        linea: x.linea,
        direccion: x.direccion,
        texto: avisoDeDesvio(x),
      })),
    });
    const poste = posteDelTransbordo(conElDesvio);
    if (poste !== null) {
      assert.ok(
        PISA_HOY.has(poste),
        `el transbordo a la 22 cae en el poste ${poste}, que hoy no pisa`,
      );
    }
    // Y suba donde suba: en la red que la búsqueda usó, la 22 ya no para ahí.
    const suPatron = compuesta.red.patrones.find(
      (p) => p.principal && lineaDelViaje(compuesta.red, p).corto === '22' && p.direccion === '0',
    )!;
    const susPostes = suPatron.paradas.map(
      (id) => compuesta.red.paradas.find((x) => x.id === id)?.codigo ?? id,
    );
    assert.ok(
      !susPostes.some((c) => /0*720$/.test(c)),
      `la 22 de la operativa sigue parando en el 720: ${susPostes.join(',')}`,
    );
    assert.equal(suPatron.paradas.length, RECORRIDO_22_HOY.length, 'y son los 31 de hoy');
  });

  /**
   * ⭐ JUEZ 2 — EL REFRESCO PREGUNTA POR LAS SUPLIDAS.
   *
   * Es la juez del arreglo de verdad: antes del 6/09 `refrescarDesvios` filtraba
   * por `operaEl`, y los sentidos que la capa del festivo suple son **justo** los
   * que ese predicado deja fuera. Nunca se preguntaba por ellos, así que nunca
   * había veredicto, así que se usaba el patrón del feed en silencio.
   */
  test('⭐ 2 · el refresco de desvíos pregunta TAMBIÉN por los huecos del calendario', async () => {
    const preguntadas: string[] = [];
    const pedir: typeof fetch = (async (_url: string, opciones?: { body?: string }) => {
      // ⚠️ El cuerpo se lee con `URLSearchParams`, que es como el motor lo
      //    escribe. Un `exec` a mano sobre la cadena ya falló una vez aquí
      //    —buscaba `line=` y el campo se llama `selectLinea`— y la juez daba
      //    rojo por su propia culpa, no por la del código.
      const linea = new URLSearchParams(opciones?.body ?? '').get('selectLinea');
      if (linea) {
        preguntadas.push(linea);
      }
      return new Response('<input id="avz_bus_ajax_nonce" value="fingido" />', { status: 200 });
    }) as unknown as typeof fetch;

    const huecos = huecosDelCalendario(red, DOMINGO, (p) => lineaDelViaje(red, p).corto);
    assert.ok(huecos.length > 0, 'el domingo tiene que tener huecos, o no hay nada que probar');

    const c = await refrescarDesvios(red, DOMINGO, pedir, 0);

    // Se pregunta por TODOS los huecos, uno por uno y con su nombre.
    for (const h of huecos) {
      assert.ok(
        preguntadas.includes(h.linea),
        `el refresco no preguntó por la línea ${h.linea}, que hoy es un hueco del calendario`,
      );
    }
    // Y siguen entrando las que el feed sí trae: esto suma, no sustituye.
    assert.ok(c.sentidos > huecos.length, `${c.sentidos} sentidos no puede ser solo los huecos`);
  });

  /**
   * ⭐ JUEZ 3 — DONDE NO HAY DESVÍO, NO CAMBIA NADA.
   *
   * La 22 es la única con veredicto en esta red compuesta. El 35 —suplido
   * igual, y sin desvío hoy— tiene que salir con **su patrón oficial, id
   * incluido**: componer una capa no es reescribir la red.
   */
  test('⭐ 3 · una línea suplida SIN desvío monta sobre su patrón oficial', () => {
    const suyoEnElFeed = red.patrones.filter(
      (p) => p.modo === 'bus' && lineaDelViaje(red, p).corto === '35',
    );
    const suyoEnLaOperativa = compuesta.red.patrones.filter(
      (p) => p.modo === 'bus' && lineaDelViaje(compuesta.red, p).corto === '35',
    );
    assert.ok(suyoEnElFeed.length > 0, 'el 35 tiene que estar en el feed');
    assert.deepEqual(
      suyoEnLaOperativa.map((p) => p.id),
      suyoEnElFeed.map((p) => p.id),
      'sin desvío, el 35 conserva sus patrones y sus ids',
    );
    assert.deepEqual(suyoEnLaOperativa, suyoEnElFeed, 'y no solo el id: el patrón entero');
    // Y la 22, que sí lo tiene, cambia de id —es OTRO patrón—.
    const la22 = compuesta.red.patrones.find(
      (p) => p.principal && lineaDelViaje(compuesta.red, p).corto === '22' && p.direccion === '0',
    )!;
    assert.ok(la22.id.endsWith('#hoy'), `la 22 tenía que estar rehecha y su id es ${la22.id}`);
  });

  /**
   * ⭐ JUEZ 4 — LOS DOS AVISOS CONVIVEN.
   *
   * Son de dos capas distintas y cuentan dos cosas distintas: *«hoy no para
   * en…»* lo pone el desvío, *«el horario sale del cuadro web»* lo pone el
   * festivo. Que una línea lleve las dos cosas a la vez no es un caso raro: es
   * el caso de hoy.
   */
  test('⭐ 4 · el aviso del desvío y el del festivo salen los dos, en el mismo viaje', () => {
    conLaCapaLlena();
    servirOperativa(compuesta);
    const conDesvios = {
      suprimidas: compuesta.suprimidas,
      avisos: compuesta.desviadas.map((x) => ({
        linea: x.linea,
        direccion: x.direccion,
        texto: avisoDeDesvio(x),
      })),
    };

    // (i) EL CASO DEL OJO, medido: **ya no gana la 22**. Quitado el transbordo
    //     imposible del 720, el buscador se va por otro lado. Lleva su aviso
    //     del festivo —el 35 sigue suplido— y **ninguno de desvío**, porque
    //     ninguna de las líneas que monta va desviada. Eso no es un olvido: es
    //     lo correcto, y se compra para que un aviso de más también cante.
    const delOjo = elCaso(compuesta.red, conDesvios);
    assert.ok(
      !lineasDe(delOjo).includes('22'),
      'con el desvío aplicado el caso del ojo ya no puede ir por la 22',
    );
    assert.ok(
      delOjo.avisos.some(esDelFestivo),
      'pero sigue suplido, y lo tiene que decir',
    );
    assert.equal(
      delOjo.avisos.filter((a) => a.texto.includes('va hoy desviada')).length,
      0,
      'y sin aviso de desvío: ninguna de sus líneas va desviada',
    );

    // (ii) Y DONDE SÍ CONVIVEN: la 22 es hoy las dos cosas a la vez —suplida
    //      por la capa del festivo y desviada por las obras—. Se sube en
    //      `Paseo de La Mina 15`, que es un poste que **el feed no tiene para
    //      la 22**: existe hoy porque el desvío lo trajo. Un viaje así no
    //      puede llevar un aviso sin el otro.
    const t = prepararViajeEnBus(motor, compuesta.red, mina, laguna, DOMINGO, conDesvios).trayecto();
    const lineas = lineasDe(t);
    assert.ok(lineas.includes('22'), `este viaje tenía que ir en la 22 y fue por ${lineas.join('+')}`);
    const delFestivo = t.avisos.filter(esDelFestivo);
    const delDesvio = t.avisos.filter((a) => a.texto.includes('va hoy desviada'));
    assert.ok(delFestivo.length > 0, 'falta el aviso del festivo');
    assert.ok(delDesvio.length > 0, 'falta el aviso del desvío');
    assert.ok(
      delFestivo.some((a) => a.texto.startsWith('Línea 22 hoy:')),
      'el del festivo tiene que nombrar a la 22, que es la suplida',
    );
    assert.ok(
      delDesvio.some((a) => a.texto.includes('línea 22') && a.texto.includes('720')),
      'y el del desvío tiene que nombrar a la 22 y el poste que hoy se salta',
    );
  });

  /**
   * ⭐ JUEZ 5 — EL LABORABLE AL BYTE.
   *
   * El sello de la juez 4 de la mañana, otra vez y con el desvío encima: un día
   * que el feed cubre entero no se entera de nada de esto. Ni una capa, ni un
   * aviso, ni un metro.
   *
 * ℹ️ **La red pelada le vale** [REGLA DE CASA]: y aquí es **a propósito**: el laborable tiene que salir igual aunque la
 * operativa esté servida, y para verlo hay que pedirlo sobre la red del feed.
 */
  test('⭐ 5 · el laborable no cambia ni un byte, con las dos capas llenas', () => {
    const aSecas = prepararViajeEnBus(motor, red, coloso, laguna, LUNES).trayecto();
    conLaCapaLlena();
    servirOperativa(compuesta);
    const conTodo = prepararViajeEnBus(motor, red, coloso, laguna, LUNES).trayecto();
    assert.equal(
      createHash('sha256').update(JSON.stringify(conTodo)).digest('hex'),
      createHash('sha256').update(JSON.stringify(aSecas)).digest('hex'),
      'el laborable tenía que salir idéntico',
    );
    assert.equal(
      conTodo.avisos.filter(esDelFestivo).length,
      0,
      'y sin un solo aviso del festivo',
    );
  });
});
