# Inventario: las catorce capas y la morada

Qué es cada capa, qué fichero pinta, si ese fichero **sigue en el repositorio
con su ficha**, y con qué pincel se pintaba.

Las cifras de la columna «trae hoy» están **medidas contra los ficheros de
hoy**, no copiadas del código viejo. Importa porque tres conjuntos se
re-firmaron ayer (18-19/09) con dato municipal nuevo, y el visor pintaría eso.

## La tabla

| # | capa | qué pinta | ficha en `datapackage.json` de hoy | trae hoy | pincel (`mapa.ts` viejo) | color |
|---:|---|---|---|---:|---|---|
| 1 | Portales | los portales del callejero, sembrados | `callejero-portales` ✔ | 46.150 | `pintarPortales` 916 | `#1d4ed8` |
| 2 | Grafo peatonal/ciclable | las aristas del grafo | `grafo-peatonal` ✔ | 98.774 | `pintarGrafo` 809 | `#15803d` |
| 3 | Carriles bici | los tramos del WFS municipal | `carriles-bici` ✔ | 733 rasgos | `pintarCarriles` 769 | `#db2777` |
| 4 | Postes de bus | el censo municipal de paradas | `postes-bus` ✔ | 944 | `pintarPostes` 727 | `#dc2626` |
| 5 | Trazados de bus | `shapes.txt` del GTFS, agrupado | `gtfs-shapes` ✔ | 89 trazados | `pintarTrazados` 689 | `#7c3aed` |
| 6 | Tranvía | los del GTFS con `route_id` 210 | `gtfs-shapes` ✔ *(mismo fichero)* | 2 de los 89 | `pintarTranvia` 655 | `#111827` |
| 7 | Paradas de tranvía | `stops.txt`, las que **no** llevan `PA…` | `gtfs-stops` ✔ | 50 de 984 | `pintarParadasTranvia` 612 | `#111827` |
| 8 | Estaciones BiZi | las seis páginas del WFS, unidas | `bizi-pag0…250` ✔ *(seis fichas)* | 276 | `pintarBizi` 570 | `#54A097` |
| 9 | Aparcabicis | descarga propia del WFS | `aparcabicis` ✔ | 2.158 | `pintarAparcabicis` 527 | `#eab308` |
| 10 | Aparcamotos | segunda descarga propia | `aparcamotos` ✔ | 2.146 | `pintarAparcamotos` 482 | `#6b8e23` |
| 11 | Regulado ESRO (rotación) | la zona azul | `regulado-tramos` ✔ ⚠️ | **676** | `pintarRegulado` 423 | `#0284c7` |
| 12 | Regulado ESRE (residentes) | el de residentes | `regulado-tramos` ✔ ⚠️ | **501** | `pintarRegulado` 423 | `#f97316` |
| 13 | **La morada**: ¿ampliación? | los `LIBRE` de zona sin polígono | `regulado-tramos` ✔ ⚠️ | **2.860** | `pintarAmpliacion` 368 | `#a21caf` |
| 14 | Zonas reguladas | los 13 perímetros, rotulados | `regulado-zonas` ✔ | 13 | `pintarZonas` 313 | `#334155` |
| 15 | Reservas PMR | solo las **vigentes** | `reservas-espacio` ✔ ⚠️ | **1.236** | `pintarPmr` 261 | `#ec4899` |

Son **quince señales**: las catorce capas de verificación y, con casilla propia,
la vista de cotejo de la ampliación —la morada, fila 13—. ⚠️ El pincel 11 y el
12 son **el mismo método**: `pintarRegulado` monta las dos polilíneas en un solo
grupo, así que en el control de casillas ESRO y ESRE **no se encienden por
separado** — van juntos bajo «Regulado ESRO+ESRE».

**Ningún conjunto ha desaparecido ni ha cambiado de forma.** Los 17 ficheros que
el visor pide siguen en `app/data/` con su ficha en el manifiesto: 40,72 MiB.

## Lo que ha cambiado desde agosto: el censo re-firmado ⚠️

Tres fichas se re-firmaron ayer con dato municipal del 19/09, y **dos de ellas
las pinta el visor**. El nombre del fichero no cambió —lleva la fecha de la
primera descarga—, así que las URLs del código viejo siguen valiendo; **lo que
ya no vale es la prosa**, que lleva escritas las cifras de agosto.

| dice el código viejo | mide hoy | dónde está escrito |
|---|---|---|
| 7.391 tramos de bordillo | **7.424** | `capas.ts:110` y `capas.spec.ts:145` |
| ESRO 664 · ESRE 495 | **676 · 501** | por la cuenta, no escrito |
| 6.204 LIBRE · 28 sin clasificar | **6.217 · 30** | `capas.ts:105` y `capas.spec.ts:145` |
| «solo se pintan 1.159» | **1.177** | `capas.ts:104` |
| «1.157 de los 1.159» en zona con polígono | **1.173 de 1.177** | `capas.ts:122` |
| 2.636 reservas · 1.226 PMR | **2.656 · 1.236** | `capas.ts:139` |
| 1.384 con `SUBTIPO: PMR general` | **1.395** | `capas.ts:143` |
| «158 de ellos retiradas o denegadas» | **158**, clavadas *(84 + 74)* | `capas.ts:144` |
| 5.049 tramos LIBRES con zona reguladora | **5.059** | `capas.ts:131` |

⭐ **Y la morada aguanta.** Con el filtro exacto del código viejo —`LIBRE`, con
zona, distinta de 0, y sin polígono publicado— salen **los mismos 2.860 tramos y
las mismas 19 zonas** (14, 15, 16, 18, 21, 22, 25, 26, 27, 29, 32, 33, 34, 37,
39, 40, 43, 46, 47). Solo las plazas se mueven: **21.268 → 21.273**, cinco más.

Eso es un dato para el cotejo de 2027, no una anécdota: el censo creció en 33
tramos y la hipótesis de la ampliación **no se descolocó**. La separación limpia
que la sostiene —esas 19 zonas no cobran ni un tramo, y las 13 con polígono se
llevan 1.173 de los 1.177 de pago— sigue en pie con el dato nuevo.

⚠️ Sigue siendo **una lectura nuestra: el WFS no dice nada**. Se pinta para
cotejarla contra los planos que tiene Antonio; se retira o se consolida cuando
el cotejo diga.

## Los guardianes que vienen con las capas

⭐ **`capas.spec.ts` no ha caducado.** Sus diez juezas montan datos de mentira
—uno o dos rasgos hechos a mano— en vez de leer los ficheros de verdad, así que
**el censo nuevo no las mueve**: lo que vigilan son las reglas, no las cuentas.

Y las reglas que vigilan son las caras de pagar:

- el regulado se corta por `tipo_actual` y **solo** por ahí (`zona_reguladora`
  es un perímetro geográfico: **5.059** tramos LIBRES lo llevan hoy, y filtrar
  por ahí pintaría de pago 5.059 bordillos gratuitos);
- las PMR se cortan por `TIPO`, **no** por `SUBTIPO`: hoy hay **1.395** que
  dicen `PMR general`, y **158** de ellas son reservas **retiradas (84) o
  denegadas (74)** — más otras 3 que son `10_E.S.PMR`;
- lo que se cobra hoy y lo que solo se cotea **no se mezclan**;
- y pedir dos veces no vuelve a bajarse nada.

`visor.spec.ts` son otras siete, y ésas sí dependen del control de casillas:
que estén las catorce, cada una con su nombre y su cuenta, ninguna encendida al
abrir, y que las manchas vayan por debajo de los bordillos.
