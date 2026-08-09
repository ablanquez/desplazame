# H1 · LAS ISLETAS, Y LA TEORÍA DE LOS PARQUES

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 3 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `51.556` | **51.493** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `4.405` | **4.424** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `36.050` | **36.113** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
>
> <sub>las líneas CON nombre del mapa · las verdes SIN el listón de 1 ha · las líneas a las que el motor les ve falta de nombre</sub>
<!-- SUPERADOS:FIN -->

*Tanda 27 · 2026-08-05 · idea de Antonio: «hay muchas manchas rojas en la ciudad que son parques o
zonas verdes grandes».*

> **Este documento se AÑADE, no reescribe nada.** Actualiza el reparto azul/rojo/gris publicado en
> `docs/H1-PASOS-DE-CEBRA.md` (§A) y **no aplica nada de los parques** (§D).

```
node src/paso-de-cebra.js      # §A · las isletas, aplicadas
node src/parques.js            # §B · §C · §D — ⛔ solo mide
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐ las isletas, aplicadas** | **51.556 azules · 36.050 rojas · 11.168 grises.** 369 isletas pierden el nombre que les habíamos puesto. |
| **⭐ ¿hay capa municipal de parques?** | **Sí, y no donde se dijo.** `idezar_base:ZonasVerdesPrincipales_carto1000_2012`, 1.175 filas, 9,82 km². ⛔ **Sin nombre y sin tipo.** El workspace `medioambiente` **no tiene ni una** capa de parques. |
| **⭐⭐ ¿cuántas rojas son de parque?** | **4.055 (142,05 km) con el municipal · 4.405 (160,72 km) con OSM** — el **11,2 %** y el **12,2 %** de las 36.050. |
| **⚠️⚠️ y el aviso que manda** | **1.020 líneas que HOY TIENEN NOMBRE caerían dentro** con el municipal, **1.661** con OSM. De ellas **181 y 220 son `acera`**. **El criterio de «dentro» SÍ se lleva aceras del borde.** |
| **⚠️ los dos testigos discrepan mucho** | Solo el **22,0 %** de lo verde lo dicen los dos. No es que uno mienta: **miden cosas distintas.** |
| **⭐ mi recomendación** | **NO pintarlos de gris.** Un paso se reconoce por su etiqueta; un sendero por *dónde está*, y ese «dónde» sale de una capa sin nombre, sin tipo, de 2012 y que discrepa de OSM. **Propongo un color propio en el mapa, sin tocar el modelo.** Decide Antonio. |
| **⛔ lo que sale mal (mío)** | nº113: casi publico como «inventado por nosotros» lo que declara el Ayuntamiento (544 → **237**). nº114: **dos de las seis peticiones gastadas en errores 504** por empezar por la consulta más grande. |

---

## A · LAS ISLETAS — aplicado

> La tanda 26 dejó el hallazgo sin aplicar: la isleta es **el trocito que queda en medio del paso de
> cebra**, y el modelo la clasifica como `peatonal`, así que la regla de los pasos no la tocó.

### A1 · Por qué no cabía en la regla de ayer

⭐ **El criterio no era la precisión D4, era la etiqueta.** Una `footway=traffic_island` tiene
precisión `peatonal`, igual que una calle peatonal de verdad. ⇒ `SIN_NOMBRE_POR_DEFINICION` pasa de
ser una **lista de precisiones** a ser una **función de las etiquetas**, `sinNombrePorDefinicion(t)`,
declarada en el mismo sitio: `planarizar.js`, al lado de `precision()`.

⭐ Y el resultado **viaja como campo de la arista** (`e.nombreNoAplica`), igual que la precisión,
porque el redactor y el mapa no tienen las etiquetas a mano.

### A2 · Las dos familias, contadas por separado

```
   familia                                 aristas     metros   de OSM   DEDUCIDO
   paso de cebra · `footway=crossing`        10494   46,55 km     1101       3786
   ⭐ isleta · `footway=traffic_island`         674    3,56 km       52        369
   ─────────────────────────────────────────────────────────────────────────────
   SIN NOMBRE POR DEFINICIÓN                 11168   50,10 km     1153       4155
```

### A2b · El reparto nuevo

```
   categoría                     antes    ahora   metros ahora
   AZULES · con nombre           56864    51556     3052,13 km
   ⭐ ROJAS · LE FALTA            41910    36050     3397,75 km
   ⭐ GRISES · no aplica              —    11168        50,10 km
```

⭐ **Rojas de verdad: 36.050.** El mapa exageraba el problema en **5.860 líneas, un 14,0 %**.

### A3 · Que no se lleve nada que no sea eso

```
   aristas SIN NOMBRE POR DEFINICIÓN            11168
   líneas pintadas de GRIS                      11168
   ⛔ las que NO salen grises                        0   ✅
   ⛔ grises que SÍ podrían tener nombre             0   ✅
```

Las **dos direcciones**, no una: *«todas las que no tienen nombre son grises»* y *«todas las grises
son de ésas»* son afirmaciones distintas, y con una sola el gris podría estar llevándose media ciudad
sin que se viera.

### A4 · ⭐ Y un agujero que se tapó de paso

Hasta hoy, **cuatro ficheros armaban a mano** el objeto que se le pasa a `Rel.tramo()`. Al necesitar
`tramo()` un campo más, esos cuatro se habrían quedado incompletos **sin que nada fallara**: la
isleta se habría pintado azul. Es la forma exacta del fallo nº107. ⇒ ahora hay **un solo sitio** que
proyecta una arista a tramo, `Rel.tramoDeArista()`.

---

## B · ¿HAY DATO MUNICIPAL DE PARQUES?

### B1 · Buscado en el `GetCapabilities` que ya estaba en disco — cero peticiones

⭐ **Positivo de control del buscador antes de afirmar ningún cero**, sobre las mismas 178 capas:
`carril/bici` → 13 · `vias/callejero` → 17 · `acera` → 3. El buscador funciona.

⛔⛔ **Y la hipótesis de dónde mirar era falsa, y hay que decirlo:** el workspace `medioambiente`
tiene 39 capas y **ninguna es de parques** — son 26 de ruido, más emisiones, contenedores, fuentes de
agua potable y plantación. Los 51 descartes de la tanda 0.D no escondían nada de esto.

⭐ Están en **`idezar_base`**, y son cartografía base:

```
   idezar_base:ZonasVerdesPrincipales_carto1000_2012        ⭐ la que sirve
   idezar_base:ZonasVerdesSecundarias_carto500_n50_2019     ⛔ no sirve, ver abajo
   idezar_base:zona_verde_juegos_infantiles_2022
   idezar_base:EXPO_ZonaVerde_carto2004_2009 · EXPO_ParqueMetropolitano_carto2004_2009
   idezar_base:AcerasZonasVerdes_* · PBandVerde_PavimentoTF_20170
```

### B2 · Qué trae — y lo que NO trae

```
   ZonasVerdesPrincipales_carto1000_2012
      1.175 filas (todas MultiPolygon) → 1.235 polígonos · 9,82 km²
      ⛔ atributos: `GEODB_OID` y `NAME`. Y `NAME` vale 0 en las 1.175 filas: CERO valores
        distintos. Es geometría pura: no dice qué parque es, ni de qué tipo, ni su nombre.
      mediana 962 m² · p90 1,42 ha · máx 69,62 ha
```

⚠️ **Y la capa `Secundarias` no es un inventario de parques**, aunque lo parezca por el nombre: son
**38.854 polígonos con atributos de dibujo CAD** (`IGDS_COLOR`, `IGDS_LEVEL`, `IGDS_WEIGH`…), con
**mediana 0 m²** y 35.235 de menos de 100 m². Son parterres, alcorques y trocitos de dibujo. ⛔ Se
descarta, y con su medida delante.

### B3 · El segundo testigo: OSM

```
   3.402 polígonos (+ los anillos `outer` de 240 relaciones) · 9,55 km² · 199 con nombre
      leisure=park              385     6,66 km²
      landuse=grass            2593     2,34 km²
      leisure=garden            406    48,08 ha
      landuse=recreation_ground  13     4,97 ha
```

⚠️ De las relaciones se cogen los `outer` y **se ignoran los `inner`**: eso cuenta los agujeros como
parque. Va declarado porque no es gratis.

### B4 · ⭐⭐ Los dos testigos, cruzados

Rejilla de puntos cada 25 m sobre el bbox común:

```
   puntos                              227.502
   ⭐ los DOS dicen que es verde          4.414   (22,0 % de lo verde)
   solo el MUNICIPAL                     8.848   (44,1 %)
   solo OSM                              6.797   (33,9 %)
```

⚠️ **Discrepan, y bastante.** No es un fallo de ninguna: **miden cosas distintas.** El municipal es
cartografía base de 2012 restringida al suelo urbano; OSM incluye `landuse=grass` de sotos, medianas
y descampados que nadie llamaría parque. ⇒ **todo lo que sigue va medido con las dos por separado**,
nunca con la unión.

---

## C · ¿CUÁNTAS ROJAS SON DE PARQUE?

### C1 · El criterio de «dentro», declarado antes de medir

Los **mismos cinco puntos** de `calle-pegada.js` —10 · 30 · 50 · 70 · 90 % de la longitud— y **los
cinco dentro**. ⛔ No me invento ni el muestreo ni el listón: los hereda de la tanda 25, donde se
fijaron para otra pregunta (ley 17). Y los extremos se evitan por el mismo motivo que allí: en una
línea que sale del parque, **el extremo cae justo en el borde**.

```
   listón                    MUNICIPAL              OSM
   1 de 5 puntos dentro    4922  180,91 km      4958  183,16 km
   3 de 5                  4593  163,66 km      4787  175,07 km
   4 de 5                  4373  154,63 km      4663  169,78 km
   ⭐ los 5                 4055  142,05 km      4405  160,72 km
                          (11,2 % de las rojas) (12,2 %)
```

⭐⭐ **Entre 4.055 y 4.405 líneas rojas están dentro de una zona verde: el 11–12 % de las 36.050, y
entre 142 y 161 km.** La teoría de Antonio es correcta y tiene tamaño.

⚠️ Mira la diferencia entre «1 de 5» y «los 5»: **es el modo de fallo entero.** Con «basta rozar»
entrarían 553 líneas más solo en OSM, y muchas de ésas son la acera del borde. **El listón no es un
detalle: es la separación.**

### C2 · ⭐⭐⭐ SENDEROS INTERIORES CONTRA ACERAS DEL BORDE

Se separa con **dos señales independientes**, y se publican las dos.

**(a) El daño directo — cuántas líneas que HOY TIENEN NOMBRE caerían dentro.** No es una heurística:
es la cuenta exacta de lo que se rompería.

```
   MUNICIPAL   1020 líneas  (44,12 km)      OSM   1661 líneas  (67,05 km)
      peatonal          560   23,25 km         peatonal         1052   41,78 km
      eje-de-calzada    265   13,54 km         eje-de-calzada    352   18,71 km
      ⚠️ acera          181    7,21 km         ⚠️ acera          220    6,18 km
      escaleras          14      116 m         escaleras          35      312 m
```

⚠️⚠️ **La costura del encargo se dispara: el criterio de «dentro» SÍ se lleva aceras del borde.**
181 y 220 aceras con nombre, más 265 y 352 ejes de calzada — que son calles enteras. **Si esto se
aplicara sin separar, se le quitaría el nombre a calles que sí lo tienen.**

**(b) La distancia de la roja al borde del parque que la contiene:**

```
   fuente        rojas dentro   mediana      p10   ≤5 m del borde
   MUNICIPAL             4055    23,7 m    3,9 m     499  (12,3 %)
   OSM                   4405    25,0 m    3,6 m     588  (13,3 %)
```

⇒ La mediana está a ~24 m del borde: **el grueso de las rojas de dentro son senderos interiores de
verdad.** Pero un 12–13 % está a menos de 5 m, y ésas pueden ser la acera perimetral **aunque los
cinco puntos caigan dentro**: el polígono suele incluir el paseo de contorno.

### C3 · ⭐⭐ El tamaño — un parque grande no es un jardín entre dos bloques

```
   MUNICIPAL                     rojas    metros   parques        OSM      rojas    metros  parques
   jardincillo < 2.000 m²           56     772 m        25                    74   1,50 km       28
   2.000 m² – 1 ha                 453  12,11 km        73                   538  13,74 km       82
   1 – 5 ha                       1333  39,68 km        52                  1384  43,62 km       54
   5 – 20 ha                      1947  63,94 km        29                  1144  43,46 km       17
   ⭐ ≥ 20 ha                       266  25,54 km         4                  1265  58,39 km        3
```

⭐ **La frontera existe y se ve.** Los jardincillos de menos de 2.000 m² aportan **56 líneas y 772
metros** con el municipal: nada. El 97 % de los metros está en parques de **1 ha para arriba**.

⇒ Si algún día se aplicara, **la frontera razonable está sobre 1 ha** — y por debajo de eso hay que
dejarlo en paz, porque ahí la acera que cruza un jardín de barrio **sí puede ser de la calle**.

### C4 · ⚠️ ¿Le hemos puesto nombre de calle a senderos de parque?

⛔ La pregunta literal no se puede contestar como está escrita: **una roja no tiene nombre, por
definición.** Lo que sí se puede medir —y es lo que preocupa— es cuántas líneas **dentro** de un
parque llevan hoy un nombre puesto por nosotros:

```
   MUNICIPAL   ⭐ lo DEDUCIMOS nosotros        237  (5,69 km)   pegada=229 · portales=5 · portales+pegada=3
               lo DECLARA el Ayuntamiento     307  (16,95 km)
   OSM         ⭐ lo DEDUCIMOS nosotros        409  (8,51 km)   pegada=361 · portales=27 · portales+pegada=21
               lo DECLARA el Ayuntamiento     234  (16,58 km)
```

⚠️ **Ese desglose es el que casi publico mal** (bitácora nº113): la primera versión sumaba las dos
filas y titulaba «544 líneas con un nombre que les hemos puesto nosotros». **307 de ellas las declara
el Ayuntamiento** — son carriles bici que atraviesan el parque y llevan `vias_codigo` municipal.

⇒ **No es el mismo caso que los pasos de cebra.** Allí eran 3.786 de 10.494 (36 %) y todos
inventados; aquí son 237 de 4.055 (5,8 %), y una parte de ellos son de verdad de la calle que bordea
el parque.

### C5 · Los sitios que Antonio ve rojos

```
   parque (nombre de OSM)                  superficie   rojas     metros   con nombre
   Parque Grande José Antonio Labordeta      44,42 ha     553   15,49 km          224
   Parque del Agua Luis Buñuel               1,25 km²     493   29,36 km          107
   Paseo del Canal                            2,35 ha       0        0 m           11
   ⚠️ Anillo Verde Oliver                     4,44 ha      19      148 m          131
```

⭐ **Parque Grande y Parque del Agua confirman la teoría**: 1.046 líneas rojas y 45 km de senderos
que no son de ninguna calle.

⚠️ **«Anillo Verde Oliver» es el contraejemplo y hay que mirarlo**: 19 rojas contra **131 con
nombre**. Ahí el polígono no es un parque: es una franja que envuelve calles enteras del barrio. **Si
la regla se aplicara, ese polígono solo se llevaría 131 calles por delante.**

⛔ **NO CONSTA** para **Miralbueno**, **Parque Venecia**, Delicias y Torre Ramona: **no hay en OSM
ningún polígono de zona verde con ese nombre**, y la capa municipal no trae nombres, así que tampoco
se puede buscar por ahí. No es que no haya parque: es que el dato no lo nombra.

---

## D · ⛔ LA RECOMENDACIÓN — y decide Antonio

### D1 · No pintarlos de gris. Sí darles color propio.

1. ⭐ **La teoría es correcta y el número la respalda.** 4.055–4.405 líneas y 142–161 km de rojo que
   no son un problema, concentrados en parques de 1 ha para arriba.
2. ⛔ **Pero un paso de cebra se reconoce por su ETIQUETA y un sendero por DÓNDE ESTÁ**, y ese
   «dónde» sale de una capa que **no tiene nombre, no tiene tipo, es de 2012 y coincide con OSM solo
   en el 22 % de lo verde**. Meter eso en `sinNombrePorDefinicion()` sería colgar una regla **de
   definición** de una fuente de calidad desconocida.
3. ⛔ **Y el daño está medido, no supuesto:** 1.020–1.661 líneas con nombre caerían dentro, 181–220
   de ellas aceras. En el Anillo Verde Oliver, 131 contra 19.

> ⭐ **Lo que sí propongo:** una **cuarta categoría en el mapa** —verde— que **no cambie el modelo ni
> el texto, solo el color**, y que diga *«esto está dentro de una zona verde»*. El nombre se sigue
> deduciendo igual y la línea sigue siendo roja para el motor; quien mire el mapa ve **por qué** esa
> mancha es roja sin que nadie afirme que no debe tener nombre. Es reversible, no toca `relato.js` y
> no puede romper una calle.

### D2 · ⚠️ Lo que NO se puede decidir con lo que hay

- **Cuál de las dos capas tiene razón** donde discrepan. Ninguna trae fecha de revisión por polígono
  ni tipo; la municipal ni siquiera trae nombre.
- **Dónde acaba el parque y empieza la acera.** El polígono no lo dice, y el criterio de los cinco
  puntos **acota** el error: no lo elimina. El 12–13 % a menos de 5 m del borde es la zona gris.
- **Si un `landuse=grass` de OSM es un parque o una mediana de avenida.** No hay dato que lo separe.
- **Cuántas rojas hay en Miralbueno o Parque Venecia**: los polígonos no están nombrados en ninguna
  de las dos fuentes.

---

## LAS SIETE RUTAS

**Idénticas al milímetro** (3086,9 · 598,1 · 3704,9 · 505,9 · 477,4 · 523,4 · 2528,9) y contra lo
publicado en la tanda 16. Único rojo vivo del guardián: el declarado de la tanda 19.

Y el mapa contra el motor: **0 discrepancias** sobre las 98.774 líneas, con su rojo visto dos veces
(11.674 con la regla por arista, 11.168 con las dos categorías).

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Una capa municipal de parques en `medioambiente`** — **no hay ninguna**, con el positivo de
  control del buscador delante.
- **Nombre o tipo en la capa municipal** — **no hay**: `NAME` tiene cero valores distintos.
- **Que el gris se llevara algo que no fuera paso o isleta** — **0**, en las dos direcciones.
- **Miralbueno y Parque Venecia en las fuentes** — **no están nombrados en ninguna**.
- **Que las dos fuentes de parques coincidieran** — **no**: solo el 22,0 %.

## LO QUE NO SE HA COMPROBADO

- **Que los polígonos estén bien dibujados.** Nadie ha ido a mirar; las dos fuentes discrepan y no
  hay forma de arbitrar.
- **Si los senderos del Parque Grande tienen nombre en la realidad.** Algunos paseos de parque sí lo
  tienen («Paseo de los Bearneses»); no se ha medido cuántos.
- **El efecto sobre el texto de las rutas** de una hipotética regla de parques: no se ha aplicado, así
  que no hay texto que medir.
- **La superficie real de los agujeros de las relaciones de OSM**, que aquí cuentan como parque.

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **La cuarta categoría «zona verde» en el mapa** | propuesta, ⛔ no aplicada. Decide Antonio |
| 2 | **La frontera de 1 ha** para separar parque de jardincillo | medida, no aplicada |
| 3 | **El 12–13 % de rojas a menos de 5 m del borde** | es la zona gris del criterio; no se puede resolver con estos datos |
| 4 | **Las 29 escaleras que unen dos calles distintas** (tanda 26) | sigue abierto |
| 5 | **365 `cycleway` con el nombre de la avenida paralela** (tanda 17) | sigue abierto |
