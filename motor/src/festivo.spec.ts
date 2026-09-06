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
import { servirOperativa } from './patron-operativo.ts';
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
    const delFestivo = conCapa.avisos.filter((a) => a.texto.includes('cuadro web de Avanza'));
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
      delFestivo.some((a) => a.texto.includes('línea 35')) &&
        delFestivo.some((a) => a.texto.includes('línea 22')),
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

  /** ⭐ El aviso dice la línea, la ventana, la frecuencia y de quién es el dato. */
  test('⭐ el aviso nombra la fuente y la hora', () => {
    const c = comoSiLoHubieraLeido('35', '0', DOMINGO, CUADRO_35_DOMINGO);
    const texto = avisoDelFestivo(c);
    assert.ok(texto.includes('línea 35'));
    assert.ok(texto.includes('07:00–01:20'));
    assert.ok(texto.includes('cada 10 min'));
    assert.ok(texto.includes('el calendario del feed no trae el festivo de esta línea'));
    assert.ok(/Fuente: Avanza, \d{1,2}:\d{2}/.test(texto), `sin hora: ${texto}`);
  });
});
