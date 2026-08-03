# H1 · LOS PORTALES ENTRAN EN EL GRAFO

**Fecha:** 2026-08-03 · **Sellos:** calles `2026-08-03T08:19:51Z` · edificios
`2026-08-03T12:30:06Z` · POI `2026-08-03T12:48:20Z` · portales del callejero municipal
(46.150, leídos donde están, **sin copiar**)

Registro histórico. Se añade, no se reescribe.

> **Correcciones a documentos anteriores** (no se tocan; se corrigen aquí):
> 1. `docs/H1-GRAFO-CIUDAD.md` §B6 publica **320 pasos condicionales**. De aquellos, **179 son
>    `covered=yes`**, que significa *"tiene techo"* y no *"no siempre abierto"*: 65 son surtidores
>    de gasolinera. Los firmes son **151 ways**.
> 2. **El briefing de esta tanda dice que el Pasaje Palafox NO estaba entre los 96
>    `building_passage`. Sí estaba** — sus tres ways lo llevan. Lo que sí es cierto es que además
>    tiene una punta sin soldar de 4,94 m: las dos cosas a la vez.
> 3. `docs/DISEÑO-H1-GRAFO.md` §P4.1 dice *"manda el código. **Siempre**"*; la adenda §A1 dice
>    *"el enganche sigue siendo **por proximidad**"* con el código como salvaguarda. **Se ha
>    seguido la adenda**, por ser posterior y explícita. Conviene reconciliarlo.

---

## 0 · LO QUE HAY QUE MIRAR PRIMERO

| | |
|---|---|
| ⚠️⚠️⚠️ **Las siete rutas: 0 de 5 en banda** | **Y tres de esas bandas son físicamente imposibles**: la línea recta ya supera su tope. No es el motor: es la conversión tiempo→distancia de la tabla, que supuso 4,5–5 km/h. El nº7 —el único con tiempo real— exige **5,7 km/h solo para la línea recta**. |
| ⚠️⚠️ **La ruta 4 dice NO HAY CAMINO** | El centro de la estación de Delicias **solo es alcanzable por un pasillo interior**, que es un paso condicional. Es la respuesta correcta a la pregunta que se hizo — y la pregunta usa el CENTRO del edificio, no su puerta. |
| ✅ **El nº1 cruza por el Puente de Piedra** | Que es por donde cruza Antonio. Y hay tres puentes posibles. |
| ✅ **Las tres contrapruebas, en rojo** | Desplazamiento: el acierto cae a **0,00 %**. Identidad: una calle gemela a 12 m se lleva 432 portales. Y el enganche real acierta **6,1× el azar**. |
| ⚠️ **Discordancia por los DOS testigos: 6,01 %** | Frente al 3,5 % de la tanda 4. Por encima, y se dice. El bruto (19,6 %) **no es el comparable**: la mitad es mi normalizador contra los sufijos de barrio del callejero. |
| ⛔ **13,8 km de calles inexistentes, fuera** | La lista se convirtió en regla. Y al hacerlo apareció algo mayor: **24 km con `access=no`** por los que también se andaba. |

---

## 1 · A · LA REGLA DE TRANSITABILIDAD

### A1 · Los 28 valores de `highway`, con la lista completa delante

47.813 ways del término. **No una selección.**

```
21738 footway ✅   5761 residential ✅   4470 service ✅    3621 track ✅
 1581 path ✅      1503 cycleway ✅      1307 tertiary ✅   1277 pedestrian ✅
 1089 secondary ✅ 1086 primary ✅        764 steps ✅       715 unclassified ✅
  685 living_street ✅  551 trunk ⛔      495 motorway_link ⛔  460 motorway ⛔
  285 construction ⛔   167 trunk_link ⛔   71 primary_link ✅   61 proposed ⛔
   57 secondary_link ✅  37 tertiary_link ✅  17 corridor ✅      5 raceway ⛔
    5 services ⛔          2 rest_area ⛔      2 elevator ✅       1 busway ⛔
```

### A2 · La regla: tres puertas independientes

⛔ **Lo que había era una LISTA**: `!PROHIBIDAS.has(highway) && foot!=='no' && highway!=='construction'`.
`construction` entró porque en el casco había 117 y me las encontré de frente; `proposed` no entró
porque allí había cero (ley 40).

```
G1 · ¿EXISTE HOY?                        estado de la vía
G2 · ¿ES UNA VÍA POR LA QUE ANDA GENTE?  tipo de vía — LISTA POSITIVA
G3 · ¿LO PROHÍBE EL DATO?                foot=no · access=no
```

⭐⭐ **G2 es positiva por el coste asimétrico del error.** Excluir de más pierde un atajo; incluir
de más manda a alguien a un descampado. Una lista negativa **falla abierta** —un valor nuevo de OSM
se vuelve andable sin que nadie lo decida—; una positiva **falla cerrada**, y
`valoresDesconocidos()` los saca por pantalla. **Hoy hay 0.**

**Los diez casos ambiguos se miraron uno a uno**, no se reglaron a ciegas. Lo que decide es **el
tipo principal**, no cualquier etiqueta suelta:

| caso | decisión | por qué |
|---|---|---|
| `highway=construction`, `footway=construction` | ⛔ no existe | el tipo lo declara: la vía **es** una obra |
| `disused=yes` suelto | ⛔ no existe | |
| `construction=residential` sobre `highway=residential` | ✅ existe | son las 3 de Calle de Pedro III, con `surface=asphalt`, `maxspeed=30` y acera separada. **La calle está ahí** |
| `abandoned:highway=tertiary` sobre `highway=track` | ✅ existe | los prefijos `X:highway` describen **otro tiempo verbal** de algo que sí está |

**⛔ Lo que NO entra en G3, y no por gusto sino por medida:**

```
+ foot=use_sidepath   quita 3.434 aristas   componentes 170 → 185  (+15)
+ access=private      quita 2.144 aristas   componentes 170 → 199  (+29)
```

*"Usa la acera de al lado"* solo es aplicable **si la acera de al lado está en el grafo**. Que
aparezcan 15 islas al aplicarla demuestra que en 15 sitios no está. Quedan medidas y reportadas:
**la decisión no es mía.**

### A3 · Los 82 nodos cuyo único paso era una `proposed`

```
componentes                169 → 170   (+1)
componente mayor        65.933 → 65.707   (−226)
nodos aislados            1.773 → 1.977   (+204)
```

⭐ **Quitando solo `proposed`, la mayor queda en 65.851: exactamente los −82 que predijo la tanda
10** sin que la regla existiera. Dos tandas, dos instrumentos, el mismo número.

Los 226 que salen de la componente mayor: 176 quedan aislados, 24 forman una componente nueva de
viales `service` cerrados (41,666 · −1,014), y el resto se reparte en grupos de 2 y 3.

⚠️ **Es lo que tiene que pasar.** Si el único paso a un sitio era una calle sin construir, ese sitio
**no es alcanzable andando**. El motor decía que sí.

### A4 · El delta contra la tanda 10, por motivo

```
   284  SE QUITA · access=no                             23,95 km
   188  SE QUITA · no existe hoy                         13,91 km
    19  SE QUITA · área de servicio de autovía            1,84 km
     8  SE QUITA · circuito                               1,73 km
     6  SE QUITA · área de descanso de autovía            1,11 km
     1  SE QUITA · calzada reservada a autobuses          0,03 km
⭐ contador independiente: suma 506 = diferencia de aristas 506  ✅
```

⚠️ **El motivo mayoritario no era el que yo iba a arreglar.** Ver bitácora nº63.

---

## 2 · B · LOS PASOS CONDICIONALES

### B1 · Tres vías, y el positivo de control

El **Pasaje Palafox** (41.65121, −0.88324) aparece por **dos** vías: etiqueta
(`tunnel=building_passage`, sus tres ways) y nombre. ✅

### B2 · Cuántos hay, y por qué solo se excluye una parte

```
   271  ⚠️ indicio · geometría
   171  ⚠️ indicio · covered=yes
    96  ✅ FIRME  · tunnel=building_passage
    35  ✅ FIRME  · indoor=yes
    31  ⚠️ indicio · nombre
    17  ✅ FIRME  · highway=corridor
     2  ✅ FIRME  · highway=elevator
     1  ✅ FIRME  · opening_hours
⇒ 512 ways señalados · 151 EXCLUIDOS (firmes) · 361 solo MARCADOS
```

⭐⭐ **FIRME es lo que implica atravesar algo que tiene dueño y puerta.** Se excluye lo firme porque
excluir es una acción, y una acción se toma con evidencia, no con indicios.

**Por qué cada indicio se queda fuera de la exclusión:**

- **`covered=yes` (179)**: significa *"tiene techo"*. 65 son `service` —surtidores de gasolinera y
  un McAuto—, hay pasos de peatones con marquesina, y 2 son el Puente del Tercer Milenio. **Un paso
  de peatones cubierto no cierra por la noche.** Corrige los 320 de la tanda 10.
- **El nombre**: en el callejero de Zaragoza **"Pasaje" es un TIPO DE VÍA**, como Calle o Andador.
  `Pasaje de Coimbra` es `highway=residential`: pasan coches. ⛔ Y **no se propaga por nombre desde
  una etiqueta**: probado, y se llevaba **el Paseo de Sagasta entero (393 ways)** porque una de sus
  aceras tiene una marquesina.
- **La geometría (173 exclusivos)**: es la única vía que puede encontrar un paso que nadie ha
  etiquetado, y por eso existe. Pero validada contra los 73 `building_passage` conocidos:

```
los detecta la geometría   26 de 73  (36 % de recall)
no detecta:  Pasaje del Comercio · Pasaje de la Industria · Pasaje Miraflores
línea base (tramos peatonales cualesquiera del centro): 1,20 %   ⇒ 29,7× el azar
sus aciertos más profundos:  260 m "dentro de un edificio"  ⬅ es una plaza
```

⭐ **29,7× el azar mide que la señal existe, no que sirva para decidir.** Con una base del 1,2 %,
30× sigue siendo un tercio de acierto. **Marca dónde mirar; no corta aristas.**

⚠️ Y la vía geométrica **solo opera en el centro denso** (bbox 41,62–41,69 · −0,935 a −0,84), que es
donde se descargaron los 11.857 polígonos de edificio. **Fuera de ahí un cero significaría "no se ha
mirado", no "no hay".**

### B3 · Los falsos positivos

17 ways casan **solo** por nombre. De ellos, 5 son `residential`/`living_street` —pasan coches—:
`Pasaje de Coimbra` (×3), `Pasaje del Vado`, `Pasaje Maestro Chueca`.

⭐ Y el patrón que **no** se usó: `arco` casa con *"Calle Manolita Marco"*, *"Mosén Félix Marco"* y
*"Ricardo del Arco"* — 17 ways, apellidos. **Se descartó antes de contar, no después de mirar los
aciertos.**

### B4 · Excluidos del cálculo

```
aristas de pasos condicionales firmes   189
componentes                             170 → 184   (+14)
componente mayor                     65.707 → 65.580   (−127)
⭐ de ellas ARTICULACIÓN (único paso)     44
```

⭐ **El paso condicional es un CAMPO de la arista** (`e.condicional`), como la precisión de D4 — no
una exclusión del grafo. Sigue siendo terreno porque existe; lo que hace `adyacencia()` es no
dárselo al enrutador.

Los 44 que son único paso incluyen el **Pasaje Palafox**, el **Pasaje del Comercio** y el pasaje del
**Paseo de Sagasta 9**. ⚠️ Si el único acceso a un portal es un pasaje que cierra, ese portal **no
siempre es alcanzable**. Decirlo es el trabajo.

---

## 3 · C · CAMINOS DE TIERRA — inventario, ⛔ sin penalizar

```
highway=track           7.474 aristas   2.352,0 km    7,9 %
highway=path            3.055 aristas     391,9 km    3,2 %
⇒ track o path         10.529 aristas   2.743,9 km   11,1 %
⭐ camino Y superficie blanda   789        177,3 km    0,8 %
⚠️ camino SIN surface declarada 9.393    2.502,6 km    9,9 %   ⬅ no se sabe
⭐ camino CON alumbrado            71          3,2 km    0,1 %
```

**Dónde están** (el número que impide una decisión global):

```
 zona                             aristas  caminos      %  blandos      %
 casco histórico                     6.773      28    0,4       81    1,2
 ensanche                            5.828      25    0,4      117    2,0
 periferia · Actur                   8.793     228    2,6      186    2,1
 periferia · Valdespartera           1.354      22    1,6        1    0,1
 polígono · PLAZA                    2.729     249    9,1       10    0,4
 rural · Movera                        686      58    8,5       18    2,6
 polígono · Malpica                  1.132     165   14,6       11    1,0
 rural · Garrapinillos                 486     100   20,6       57   11,7
```

⭐⭐ **Y el número que decide:**

```
aristas de articulación (a pie)        6.216
de ellas, caminos (track/path)         1.589   (25,6 %)
```

**1.589 sitios donde el único paso es un camino.** Penalizarlos mucho no los quita del grafo: los
hace inalcanzables en la práctica. **En Garrapinillos el camino ES la calle.**

⛔ **No se ha tocado nada.** Se decide cuando exista el coste.

---

## 4 · D · EL ENGANCHE

### D2 · P4.5 resuelta: se GUARDA LA POSICIÓN, no se parte la arista

1. ⭐⭐ **Un enganche malo no debe corromper el terreno.** Partir mete el error DENTRO del grafo: un
   portal mal enganchado parte una calle donde no es, y a partir de ahí lo hereda todo.
2. ⭐ **Todo lo verificado sigue valiendo.** Partir cambiaría nodos, aristas, componentes y
   longitudes, y dejaría incomparables las tandas 8 y 10.
3. ⭐ **Es reversible.** Cambiar el criterio mañana no obliga a reconstruir el grafo.

Coste: **2 nodos temporales por consulta**, no 46.150 permanentes.

### D3 · Los contadores

```
enganchados CLAROS      38.948
enganchados DUDOSOS      7.078      ⬅ criterio medible, no cajón vago
NO enganchados             124      (>120 m de toda arista a pie)
⭐ suma                  46.150      ✅ exactos

distancia:  mediana 5,3 m · p90 17,7 m · p99 55,8 m · máximo 119,2 m
0-2m:4.979  2-5m:16.390  5-10m:15.003  10-20m:5.943  20-50m:3.107  >50m:604
```

**Dudoso** = la segunda calle distinta está a menos de 3 m de la primera —el enganche no lo decidió
la geometría, lo decidió el ruido— **o** los dos testigos discrepan.

**Los lejanos, clasificados antes del número:**
```
347  lejos de una calle CON nombre
226  lejos de una arista SIN nombre
124  sin arista a pie a menos de 120 m
 31  lejos, y la arista es peatonal
```

### D3b · ⭐⭐ La discordancia, y por qué el bruto engaña

```
codigoVia:  concuerda 25.037 (54,3 %) · osm-sin-nombre 11.942 (25,9 %) · DISCORDA 9.047 (19,6 %)
   de los DISCORDA, uno contiene al otro   4.944
   nombres REALMENTE distintos             4.103  (8,89 %)

nube:       concuerda 30.547 (66,2 %) · osm-sin-nombre 7.171 · nube-no-opina 5.476 · DISCORDA 2.956 (6,4 %)

⭐⭐ DISCORDANTES POR LOS DOS TESTIGOS      2.775  (6,01 %)
```

Los 4.944 son **el callejero municipal añadiendo sufijos de barrio rural**: `CALLE MAYOR GRP` es la
Calle Mayor de Garrapinillos. ⛔ **No se corrigen con una lista de sufijos**: `EBRO`, `LUNA` y `CRUZ`
también van al final y son parte del nombre. Hacer esa lista sería repetir la ley 40.

⭐ **El 6,01 % es el comparable con el 3,5 % de la tanda 4**, porque es el único que no depende de mi
normalizador. **Está por encima y se dice.**

⚠️ **La nube no opina sobre 805 vías** (5.476 portales). La adenda §A1 exige decirlo: ahí la
verificación es **más débil**, y eso no puede quedar escondido en un porcentaje global.

### D3c · Por zona

```
 zona                          portales  mediana    p90   >50m  discordan-2
 casco histórico                   3.948     3,1    7,7      0     2,8 %
 ensanche                          2.649     3,9    8,3      7     2,0 %
 periferia · Actur                 2.433     6,6   20,3      0     8,1 %
 periferia · Valdespartera           695     9,7   15,4     25     3,5 %
 polígono · Malpica                1.472     7,0   20,6     15     5,5 %
 polígono · PLAZA                    559    11,2   42,1     51     4,8 %
 rural · Movera                      753    10,5   29,4     11    10,1 %
 rural · Garrapinillos             1.134     6,6   33,9     63    17,0 %
```

**No engancha igual.** La mediana se dobla del casco a Movera y la discordancia se multiplica por
seis en Garrapinillos — que es justo donde el callejero usa los sufijos de barrio.

### D4 · El lado de la calle, remedido sobre el grafo planarizado

```
aristas con >=4 portales evaluables   3.863
  RODADAS (tienen lado)               2.107
  PEATONALES (no hay lado)            1.756   ⬅ excluidas del número

RODADAS         >=0,95: 76,0 %    =1,00: 75,3 %    portales cubiertos 77,0 %
⛔ línea base MALA (paridades barajadas)   30,5 %   ⬅ no destruye la señal
⭐ LÍNEA BASE BUENA (lado a cara o cruz)    4,5 %
⇒ 16,9× el azar
```

⭐ **La adenda midió 89,5 % sobre ways enteros; sobre aristas planarizadas es 76,0 %.** Baja al
partir, exactamente como la adenda avisaba. Y la línea base buena da **4,5 %** contra el **4,3 %**
que midió la adenda por otro camino: dos instrumentos, el mismo azar.

**D5** · Descartando las aristas con algún portal doblemente discordante (372), quedan **1.735
aristas donde el lado sí se puede usar**, y ahí el **84,7 %** pasa el 0,95.

---

## 5 · E · LA VERIFICACIÓN

### E1 · ⭐⭐ Contraprueba del desplazamiento — los portales 2 km al noreste

```
                            MOVIDOS 2 km      reales
enganchados                       36.916      46.026
codigoVia concuerda                    0      25.037
   en %                            0,00 %     54,25 %
consenso concuerda                 9.153      30.547
distancia mediana (m)               16,6         5,3

⇒ el acierto del código cae al 0,0 %   ✅ SE HUNDE
```

**El enganche mide correspondencia, no densidad urbana.**

### E2 · ⭐⭐ Contraprueba de identidad — la que siempre falta

El desplazamiento mueve **todo** a la vez, así que es ciego al eje IDENTIDAD. Se planta una **calle
gemela a 12 m** de la Avenida de la Ilustración (1.469 portales, 161 aristas):

```
portales que se van a la GEMELA   432 de 1.469
de los que se van, los marca el codigoVia   472
⇒ ✅ el enganche distingue dos ejes a 12 m, y la salvaguarda lo canta
```

### E3 · Línea base del enganche

```
acierto de un enganche AL AZAR entre las aristas de la misma zona    9,0 %
acierto del enganche REAL                                           54,4 %
⇒ 6,1× el azar
```

### E4 · La cola

Los 50 peores —mayor distancia y mayor discordancia— están listados en la salida de
`node src/informe-portales.js`, con dirección y coordenada. ⚠️ **46.150 casos no se verifican a mano:
se verifican con un instrumento, y el instrumento es lo que hay que verificar a mano.**

---

## 6 · ⭐⭐⭐ E5 · LAS SIETE RUTAS DE ANTONIO

⛔ `data/pruebas/RUTAS-CONOCIDAS.md` **no se ha tocado.** Los resultados van aquí.

| # | calculado | banda | recta | rodeo | ¿en banda? |
|---|---:|---:|---:|---:|---|
| 1 | 3.087 m | `NO CONSTA` | 2.641 m | 1,17 | — |
| 2 | 598 m | 350–450 | 454 m | 1,32 | ⛔ larga por 148 m |
| 3 | 3.731 m | 2.900–3.400 | 3.000 m | 1,24 | ⛔ larga por 331 m |
| 4 | **NO HAY CAMINO** | 350–450 | 351 m | — | ⛔ |
| 5 | 477 m | 350–450 | 348 m | 1,37 | ⛔ larga por 27 m |
| 6 | 523 m | 350–450 | 484 m | 1,08 | ⛔ larga por 73 m |
| 7 | 2.529 m | 1.800–2.100 | 2.380 m | 1,06 | ⛔ larga por 429 m |

**7 de 7 direcciones resueltas · 0 rodeos imposibles · 0 de 5 en banda.**

### ⚠️⚠️ Cero de cinco, y todas largas. Eso no es ruido: es un sesgo.

**Y el diagnóstico no usa mi motor.** La línea recta es el mínimo físico absoluto:

```
   nº   recta   banda        ¿alcanzable?     km/h que exige la RECTA
   2     454   350-450      ⛔ IMPOSIBLE      5,4
   3    3000   2900-3400    ✅ sí             4,5
   4     351   350-450      ✅ sí             4,2
   5     348   350-450      ✅ sí             4,2
   6     484   350-450      ⛔ IMPOSIBLE      5,8
   7    2380   1800-2100    ⛔ IMPOSIBLE      5,7
```

**En tres de las seis, la línea recta ya supera el tope de la banda.** Ningún motor puede entrar.

Y la tabla lo explica en un aviso que escribió Antonio: *"LA DISTANCIA ESPERADA ESTÁ DERIVADA DEL
TIEMPO, NO ESTIMADA APARTE… a ≈4,5–5 km/h"*. ⭐ **El nº7 lo fija**, porque es el único con tiempo
real de repetición: solo la recta ya obliga a **5,71 km/h**, y por la calle son **6,07**. La banda
se calculó suponiendo 4,3–5,0.

⛔ **No se ha tocado ningún umbral para que entren en banda.** La corrección, si la hay, es de la
conversión tiempo→distancia — y esa tabla la escribe Antonio.

### Las tres preguntas concretas

**⭐ nº1 · ¿POR QUÉ PUENTE CRUZA?**
```
Avenida de Cataluña → Calle Carmen Serna Montalvo → Avenida de Cataluña →
Plaza de Wolfang Amadeus Mozart → Avenida de Cataluña → Paseo de la Ribera →
PUENTE DE PIEDRA → Paseo de Echegaray y Caballero → Plaza de Europa
```
**✅ COINCIDE con lo que hace Antonio.** Y había tres puentes posibles.

**⭐ nº6 · ¿SE DISPARA LA DISCORDANCIA?** No. Los dos portales nº1 en esquina se enganchan a aceras
**sin nombre** en OSM, a 3,9 m y 2,7 m — con la segunda calle a 9,6 m y 5,5 m. Ninguno de los dos
testigos puede opinar (`osm-sin-nombre` / `nube-no-opina`), así que **la salvaguarda se calla**, que
es lo correcto: no hay discordancia porque no hay con qué compararlo. **La esquina no engañó al
enganche.**

**⭐ nº4 · ¿LLEGA A DELICIAS?** **No.** El centro de la estación se engancha a un `highway=corridor`
a 31 m, y con los pasos condicionales fuera **no hay camino**. Con ellos abiertos: 900 m, rodeo 2,57.
Desde cualquier punto del perímetro exterior de la estación: 767–879 m.

⚠️ **Dos causas, y las dos son declaradas, no fallos del grafo:**
1. **Se rutea al CENTRO del edificio, no a su puerta.** Para un edificio del tamaño de Delicias eso
   son cientos de metros. Lo mismo, en menor grado, en la nº3 (hospital, enganche a 45,8 m) y la
   nº5 (centro comercial, 28,7 m).
2. El acceso que queda es **un pasillo interior**, y por decisión de Antonio los pasos condicionales
   no se usan para calcular.

**⇒ Es el caso que da la medida del coste de ignorar los pasos condicionales.** No es un bug: es el
precio, y ahora tiene número.

---

## 7 · F · QUÉ HE BUSCADO A PROPÓSITO Y NO HE ENCONTRADO

- **Un valor de `highway` desconocido por la regla.** Es el punto entero de la lista positiva.
  **0 hoy** — pero el contador queda puesto para el día que OSM invente uno.
- **Que el enganche siguiera acertando con los portales movidos 2 km.** Cae al **0,00 %**.
- **Que el enganche no distinguiera una calle gemela a 12 m.** Se lleva 432 portales: sí distingue.
- **Un paso condicional que la búsqueda no encontrara siendo el positivo de control.** El Pasaje
  Palafox aparece por dos vías.
- **Una ruta más corta que la línea recta.** 0 de 7.
- **Que las siete rutas fallaran por el motor.** Tres de las bandas son inalcanzables **por
  geometría**, con el motor apagado.

### Lo que NO he comprobado, y por qué

- **Que los 173 candidatos de la vía geométrica sean pasos reales.** No están validados uno a uno;
  el detector tiene un 36 % de recall y no se ha medido su precisión. **Se marcan, no se excluyen.**
- **Que la vía geométrica no pierda pasos fuera del centro.** Solo hay edificios descargados del
  centro denso. Fuera de ahí es `NO CONSTA`.
- **Que los 2.775 doblemente discordantes sean errores.** Están marcados y listados; **ninguno se ha
  mirado sobre el terreno**. Podrían ser portales con entrada por otra vía, que es un caso legítimo.
- **La precisión del lado de la calle contra la realidad.** Se ha medido la consistencia
  paridad↔lado, que es otra cosa: **una calle numerada al revés de forma consistente daría 1,00**.
- **Que las 124 direcciones sin enganche no tengan calle.** Solo que no hay ninguna arista andable a
  menos de 120 m.

### Los diez ejes

| eje | ¿verificado? | cómo |
|---|---|---|
| **posición** | ✅ | reproyección ida y vuelta; distancias portal→arista |
| **vecindad** | ✅ | la segunda calle más cercana, que define "dudoso" |
| **dirección** | ⚠️ parcial | el lado de la calle es media respuesta; no hay sentidos |
| **identidad** | ✅ | la calle gemela a 12 m — **el eje que suele faltar** |
| **correspondencia** | ✅ **el eje de esta tanda** | dos testigos independientes, y el desplazamiento |
| **umbral / cola** | ✅ | los 50 peores ordenados por gravedad; el reparto de distancias |
| **escala** | ✅ | 46.150 portales, tiempo y memoria |
| **densidad** | ✅ | el enganche por zona: no engancha igual en el casco que en Movera |
| **agregación** | ✅ | 19,6 % → 8,89 % → 6,01 %; y los 320 pasos que eran 151 |
| **semántica** | ⚠️ **el que sigue fallando** | `covered` significa "techo", no "horario". Es el segundo tropiezo semántico seguido |

### Qué no he comprobado de mi propia conclusión

Digo que **el enganche mide correspondencia** porque se hunde al desplazar y distingue una gemela a
12 m. **No he comprobado que acierte la calle correcta en los casos donde los dos testigos callan**
— y son **11.942 portales (25,9 %)** donde OSM no da nombre. Ahí el enganche puede estar
equivocándose sistemáticamente sin que ninguna de las dos salvaguardas pueda enterarse, y **ninguna
contraprueba de esta tanda cubre ese hueco.** Es el sitio por donde entraría el fallo invisible.

---

## 8 · TRAZA

```
node src/transitabilidad.js       A · la regla, y el delta contra la tanda 10
node src/informe-condicionales.js B · los pasos condicionales por tres vías
node src/caminos.js               C · el inventario de caminos
node src/informe-portales.js      D + E1..E4 · el enganche y sus contrapruebas
node src/rutas-antonio.js         E5 · las siete rutas
node src/exportar.js              vuelca grafo + portales al visor, con su cuadre
node src/probar-visor.js          el visor contra un Leaflet simulado
```

Fallos de esta tanda en `docs/BITACORA.md`: **nº63 a nº68**.
