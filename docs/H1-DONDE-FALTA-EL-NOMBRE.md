# H1 · ¿DÓNDE FALTA EL NOMBRE, DE VERDAD?

*Tanda 20 · 2026-08-04 · se mide y se pinta. **No se deduce ni se aplica ningún nombre.***

> ⛔⛔ **El método de portales de la tanda 17 sigue siendo capa de prueba.** Aquí se mide **dónde
> haría falta**, no se aplica. Ningún nombre se escribe en el grafo. El cálculo de rutas no se toca:
> lo único que cambia es el REDACTOR.

> **Este documento se AÑADE, no reescribe nada.**

```
node src/donde-falta.js              # A · B · el veredicto · la recomendación · las mayúsculas
node src/exportar-nombres.js         # el dato del mapa  (14 MB, gitignoreado)
node src/probar-visor-nombres.js     # las comprobaciones del mapa, sin navegador
tools/visor-nombres.html             # el mapa: doble clic
node src/modelo-rutas.js             # el guardián de las siete rutas
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ LA PREGUNTA DE ANTONIO CAMBIA EL TAMAÑO DEL PROBLEMA** | Medido sobre las 98.774 líneas, el 57,5 % no tiene nombre y suena a catástrofe. Medido **sobre las líneas por las que hay portales**, el que falta es **el 33,7 %**. Son problemas distintos. |
| **⭐⭐ SU HIPÓTESIS SE CUMPLE** | Las líneas con portales llevan nombre **×1,69** más a menudo (66,3 % contra 39,3 %). Y **no lo explica el tipo de vía**: sobrevive en momios en **8 de las 9 plataformas** y en **las 8 ventanas** del eje densidad. |
| **⚠️⚠️ PERO NO RESUELVE EL PROBLEMA** | **3.867 líneas · 370,87 km · y 11.742 PORTALES** —el **25,5 % de las puertas de Zaragoza**— cuelgan de una línea sin nombre. **Una de cada cuatro puertas no tiene calle que decir.** |
| **⭐ Y NO ESTÁN APILADAS** | 1.137 vías implicadas; las 20 primeras solo concentran el **18,2 %**. ⚠️ No es el caso de la Avenida de la Ilustración —aunque ella sale la primera otra vez, con **11,87 km y 1.147 portales**. **Es un proyecto, no una tarde.** |
| **⭐⭐ LA RECOMENDACIÓN, CON EL NÚMERO DELANTE** | El método de portales nombraría **1.292 líneas (33,4 %)** — pocas. Pero **8.289 de los 11.742 portales: el 70,6 % de las puertas afectadas**. **Nombra pocas líneas y son las que tienen la gente.** ⇒ **sí merece la pena.** |
| **⛔ EL FALLO DE PRODUCTO, ARREGLADO** | Andando **no se va «por el carril bici»**. `SUSTANTIVO` pierde esa entrada y entra `comoSeAnda()`: sobre acera → «por la acera de X»; en calzada → «por X» y se dice dónde va el carril. |
| **✅ LAS SIETE RUTAS, INTACTAS** | Metros, aristas y nodos idénticos entre las dos ejecuciones y contra lo publicado en la tanda 16. Textos 1 a 5 byte a byte; cambian la 6 y la 7. |
| **⚠️ lo que sale mal (mío), 1** | Bitácora nº97: **comparé dos porcentajes con una razón cuyo TECHO no había calculado.** Decía que en `calzada` la relación «se aplana» (×1,14) cuando el máximo aritmético posible ahí es ×1,26. |
| **⚠️ lo que sale mal (mío), 2** | Bitácora nº98: **el contador independiente del visor acusó al visor, y el que contaba mal era él.** |
| **⚠️⚠️ lo que sale mal (mío), 3** | Bitácora nº100: **el aviso nuevo se hereda del way igual que el nombre**, y un aviso que cita al Ayuntamiento afirma más que un nombre. **No se arregla: es diseño y decide Antonio.** |

---

## A0 · ⛔⛔ LA CONTRAPRUEBA QUE VA ANTES QUE NINGÚN NÚMERO

**Si el enganche prefiriera aristas con nombre, la tanda entera se autoconfirmaría**: las líneas con
portales tendrían nombre porque el enganche las eligió por tenerlo.

⛔ Y eso **no se resuelve leyendo el código** — eso es una opinión sobre un fichero. Se reejecuta el
enganche entero con **los nombres tapados** y se compara portal a portal:

```
   portales comparados                                        46150
   ⭐ misma arista con los nombres tapados                     46150  (100,0 %)
      distintas                                               0   ✅ el enganche NO mira el nombre
```

⚠️ **Ese 100,0 % es redondo, y hay que decir por qué lo es**: `engancharUno()` usa el nombre **solo**
para detectar la segunda vía más cercana (el empate), nunca para elegir la mejor. El resultado era
predecible leyendo el código. **Lo que aporta la contraprueba no es la sorpresa: es que ahora es un
mecanismo y no mi lectura** (ley 37).

⭐ **Y con su rojo visto antes de fiarse de él** — un comparador que no ha dicho nunca que no, no ha
dicho que sí:

```
   enganche con el radio cambiado a 40 m · portales que cambian   942   ✅ el comparador sabe decir no
```

---

## A1 · QUÉ ES «UNA LÍNEA CON PORTAL»

**La definición principal NO tiene radio mío:** «con portal» = **el enganche de ese portal cayó en
esa arista**. Es la relación que el motor ya calculó, leída al revés — la misma de la tanda 17.

⚠️ **Lo que sí arrastra, declarado:** el techo del enganche (**120 m**) y el filtro `e.pie` —un
portal solo se engancha a una arista transitable a pie—. De ahí sale el álgebra 4.

```
   portales del padrón · enganchados                          46150 · 46026
   ⭐ Σ portales colgados de las aristas                       46026   ✅ (álgebra 2)
   aristas CON portal                                         11464  (11,6 % de 98.774)
      cota dura: ≤ portales enganchados                       46026   ✅ (álgebra 3)
   aristas NO transitables a pie                              4204
      …de ellas, con portal                                   0       ✅ (álgebra 4)
```

**Qué significa «pegado», medido:** mediana **5,3 m** · p90 **17,7 m** · p99 **55,8 m** · máx 119,2 m.

**Reparto de portales por arista** — para que se vea que «con portal» no es una etiqueta vacía:

| portales | aristas | metros | portales |
|---|---:|---:|---:|
| 1 | 4.272 | 298,58 km | 4.272 |
| 2 | 1.998 | 153,28 km | 3.996 |
| 3–5 | 2.964 | 277,46 km | 11.117 |
| 6–10 | 1.328 | 178,07 km | 9.992 |
| 11–20 | 659 | 94,49 km | 9.440 |
| 21–50 | 235 | 46,46 km | 6.643 |
| 51+ | 8 | 3,67 km | 566 |

### La segunda cuenta, la ancha — y va como CURVA porque aquí sí hay un radio

| radio | aristas con portal | % | metros | % |
|---|---:|---:|---:|---:|
| 5 m | 8.817 | 8,9 % | 598,57 km | 9,2 % |
| 10 m | 21.229 | 21,5 % | 1.116,70 km | 17,2 % |
| **20 m ⭐ p90** | **40.763** | **41,3 %** | **1.717,29 km** | **26,4 %** |
| 30 m | 51.951 | 52,6 % | 2.084,96 km | 32,1 % |
| 60 m | 67.427 | 68,3 % | 2.681,39 km | 41,3 % |

⛔ **Ninguna de estas es la cuenta principal.** El p90 va señalado porque es el único valor de la
lista que sale de una medición y no de mi cabeza.

---

## A2 · ⭐⭐ EL NÚMERO PRINCIPAL

### En aristas

| | CON nombre | SIN nombre | total | % con nombre |
|---|---:|---:|---:|---:|
| **⭐ CON portales** | **7.597** | **3.867** | 11.464 | **66,3 %** |
| SIN portales | 34.333 | 52.977 | 87.310 | 39,3 % |
| **TOTAL** | 41.930 | 56.844 | **98.774** | 42,5 % |

**Las cuatro celdas suman 98.774 exactas** ✅ (álgebra 1).

### En metros — porque una arista es una unidad arbitraria

| | CON nombre | SIN nombre | total | % con nombre |
|---|---:|---:|---:|---:|
| **⭐ CON portales** | **681,14 km** | **370,87 km** | 1.052,02 km | **64,7 %** |
| SIN portales | 1.946,91 km | 3.501,05 km | 5.447,96 km | 35,7 % |
| **TOTAL** | 2.628,05 km | 3.871,92 km | **6.499,98 km** | 40,4 % |

### Y quitando lo que no necesita nombre (ley 29)

Un paso de peatones y unas escaleras se cuentan *«Cruzas por un paso de peatones»* / *«Subes o bajas
unas escaleras»*: **el nombre no les hace falta en ninguna ciudad.** Son 11.303 aristas (54,88 km).

| | CON nombre | SIN nombre | % con nombre |
|---|---:|---:|---:|
| ⭐ CON portales | 7.586 | 3.796 | **66,6 %** |
| SIN portales | 33.156 | 42.933 | 43,6 % |

⇒ **La costura anti-fallo NO se dispara.** No sale que «casi todas las líneas con portales ya tienen
nombre»: **un tercio no lo tiene.**

---

## A3 · DE DÓNDE VIENE EL NOMBRE

| fuente | con portales | sin portales | total | metros |
|---|---:|---:|---:|---:|
| `osm` | 7.525 | 32.895 | 40.420 | 2.508,88 km |
| `municipal-bici` (tanda 19) | **72** | 1.438 | 1.510 | 119,18 km |
| (ninguna) | 3.867 | 52.977 | 56.844 | 3.871,92 km |

⚠️ **La vía municipal de la tanda 19 casi no mueve el número principal**: sin ella serían 7.525 en
vez de 7.597. ⇒ **la capa de carriles bici cubre 333 km de una ciudad de 6.500: nunca iba a
nombrarlo todo**, y el número lo dice en vez de sugerirlo.

---

## A4 · ⭐⭐ LAS QUE DUELEN

```
   aristas                                    3.867  (3,9 %)
   metros                                     370,87 km  (5,7 %)
   ⭐ PORTALES colgados de ellas               11.742  (25,5 % de los 46.026)
```

⭐⭐ **El número que mide el problema no es el de líneas: es el de puertas.** **Una de cada cuatro
puertas de Zaragoza cuelga de una línea sin nombre.**

### Clasificadas antes de contarlas (ley 29)

| plataforma | aristas | metros | portales | % de su plataforma |
|---|---:|---:|---:|---:|
| acera | 1.632 | 115,46 km | 5.132 | 9,7 % |
| **pista** | 368 | **112,37 km** | 1.236 | 4,9 % |
| calzada | 463 | 62,08 km | 2.617 | 1,6 % |
| plataforma-peatonal | 811 | 40,86 km | 1.642 | 4,7 % |
| vial-de-servicio | 468 | 33,97 km | 912 | 5,3 % |
| camino | 31 | 3,69 km | 57 | 1,0 % |
| carril-bici | 23 | 1,79 km | 69 | 0,5 % |
| escaleras · paso de peatones | 71 | 654 m | 77 | — |

⚠️⚠️ **Y aquí hay un matiz que cambia la lectura:** `pista` + `camino` son **116,06 km — el 31 % de
los metros que duelen** con solo 1.293 portales. **Son caminos rurales con diseminados.** «Con
portal» no equivale exactamente a «ciudad consolidada»: en el campo también hay puertas, pero muy
pocas por kilómetro. **En aceras y plataformas peatonales están 2.443 líneas y 6.774 puertas en
156 km.** Ésa es la parte urbana del problema.

### Por zona (⚠️ las ventanas son NUESTRAS, no administrativas)

| zona | aristas | metros | portales | % de las que tienen portal |
|---|---:|---:|---:|---:|
| casco histórico | 193 | 8,75 km | 391 | 16,2 % |
| ensanche (Gran Vía · Sagasta) | 288 | 18,87 km | 809 | 39,5 % |
| periferia · Valdespartera | 24 | 1,65 km | 69 | 14,0 % |
| **periferia · Actur-Rey Fernando** | **391** | 24,77 km | 917 | **41,2 %** |
| polígono · Malpica-Santa Isabel | 44 | 7,97 km | 108 | 17,3 % |
| **polígono · PLAZA** | 99 | 15,10 km | 202 | **47,6 %** |
| rural · Movera | 57 | 8,15 km | 182 | 41,3 % |
| rural · Garrapinillos | 52 | 14,45 km | 239 | 26,5 % |
| *las 8 ventanas juntas* | 1.148 | | | |
| *FUERA de las 8 ventanas* | **2.719** | | | ⚠️ las ventanas no cubren el término |

⭐ **Positivo de control de las ventanas** (un cero es indistinguible de una ventana mal puesta):
Calle del Coso aparece dentro del casco histórico ✅.

⚠️ **El casco es el mejor (16,2 %) y el Actur el peor de la ciudad (41,2 %).** Y el Actur es
precisamente donde vive Antonio y donde está la ruta nº7.

---

## A5 · ⭐⭐ ¿APILADAS O REPARTIDAS?

⚠️ **Cómo se atribuye, dicho antes del resultado:** una arista cuenta para **todas** las vías que
tengan algún portal encima. ⛔ **No se elige la mayoritaria — eso sería nombrarla**, y esta tanda no
nombra nada. La columna suma un **×1,08** más que el total, y 159 aristas (4,1 %) tienen portales de
más de una vía.

```
   vías distintas implicadas                                  1137
   metros atribuidos · metros reales           399,36 km · 370,87 km   (×1,08)
```

| # | vía (nombre municipal) | metros | aristas | portales |
|---:|---|---:|---:|---:|
| 1 | **AVENIDA DE LA ILUSTRACIÓN** | **11,87 km** | 122 | **1.147** |
| 2 | CAMINO PUENTE CLAVERÍA | 5,36 km | 15 | 99 |
| 3 | CAMINO BÁRBOLES | 5,33 km | 16 | 41 |
| 4 | VÍA HISPANIDAD | 5,08 km | 96 | 196 |
| 5 | CAMINO PINSEQUE | 3,89 km | 15 | 55 |
| 6 | CARRETERA AUTOVÍA DE LOGROÑO | 3,25 km | 20 | 23 |
| 7 | CARRETERA AEROPUERTO | 3,22 km | 27 | 38 |
| 8 | CAMINO LANCIS | 3,17 km | 6 | 7 |
| 9 | CAMINO LAS REVUELTAS | 3,02 km | 5 | 23 |
| 10 | CAMINO VISTABELLA ---VNO | 2,99 km | 10 | 27 |
| 11 | DISEMINADO DISEMINADO PEÑAFLOR | 2,89 km | 5 | 6 |
| 12 | CAMINO CASETÓN DE LA VIRGEN | 2,83 km | 1 | 1 |
| 13 | CAMINO BARRIO DEL CAÑÓN | 2,76 km | 11 | 48 |
| 14 | AVENIDA CESÁREO ALIERTA | 2,69 km | 42 | 77 |
| 15 | **AVENIDA SAN JUAN DE LA PEÑA** | 2,64 km | 34 | **212** |
| 16 | CAMINO LUGARICO DE CERDÁN | 2,43 km | 9 | 50 |
| 17 | CAMINO CORBERA ALTA | 2,41 km | 4 | 4 |
| 18 | CAMINO PEÑAFLOR A VILLAMAYOR | 2,33 km | 3 | 5 |
| 19 | CAMINO ALTO DE LA TORRE DEL HOSPITAL | 2,32 km | 5 | 56 |
| 20 | CAMINO DEL CUENCO | 2,23 km | 11 | 23 |

### La curva de concentración, que es lo que contesta la pregunta

| las N primeras vías | % de los metros |
|---|---:|
| 5 | 7,9 % |
| 10 | 11,8 % |
| **20** | **18,2 %** |
| 50 | 31,3 % |
| 100 | 45,2 % |
| 200 | 62,8 % |

⚠️ **LÍNEA BASE:** si los metros se repartieran por igual entre las 1.137 vías, las 20 primeras se
llevarían el **1,8 %**. Se llevan el 18,2 % ⇒ **hay concentración (×10), pero no es la de la tanda
14.** Allí 267 de 565 portales eran de una sola vía. **Aquí no.**

⇒ **VEREDICTO: REPARTIDAS.** Hacen falta **100 vías para cubrir la mitad** de los metros. **Es un
proyecto, no una tarde** — y por eso importa que haya un método automático.

⚠️ Y la cabecera de la tabla dice algo más: **doce de las veinte son `CAMINO`, `CARRETERA` o
`DISEMINADO`** — el problema rural que ya se veía en A4. Las urbanas de verdad son la Ilustración,
Vía Hispanidad, Cesáreo Alierta y San Juan de la Peña.

---

## A6 · ¿Y EN LAS SIETE RUTAS?

| ruta | m sin nombre | de ellos CON portales | % | portales |
|---:|---:|---:|---:|---:|
| 1 | 296 | 106 | 36,0 % | 3 |
| 2 | 0 | 0 | — | 0 |
| 3 | 695 | **0** | **0,0 %** | 0 |
| 4 | 589 | 177 | 30,1 % | 2 |
| 5 | 382 | 256 | 67,1 % | 4 |
| 6 | 412 | 188 | 45,7 % | 10 |
| 7 | 935 | 497 | 53,2 % | 19 |
| **TOTAL** | **3.308** | **1.225** | **37,0 %** | 38 |

⚠️ «sin nombre» aquí **ya cuenta la vía municipal de la tanda 19 como nombre** (por eso 3.308 y no
3.851).

⚠️ **La ruta 3 es el caso interesante: 695 m sin nombre y CERO portales.** Es *Cantando Bajo la
Lluvia 6 → Hospital Clínico Lozano Blesa*, y sus metros sin nombre son casi todos **plataforma
peatonal**:

```
   513 m   plataforma-peatonal · highway=footway
   107 m   calzada · highway=residential
    55 m   vial de servicio · highway=service
    21 m   acera · highway=footway
```

⇒ **La idea de Antonio dice ahí lo correcto**: son andadores y recintos sin ninguna puerta del padrón
dando a ellos, y **el método de portales no puede ni opinar**. ⛔ No significa que dé igual saber cómo
se llaman: significa que **esos no se arreglan con portales.**

---

## B · LA HIPÓTESIS DE ANTONIO

> *«habrá que mirar si las que no tienen nombre precisamente son las que no están junto a portales»*

### B1 · Contra su línea base

Si tener nombre y tener portales fueran **independientes**, E = N(nombre)·N(portal)/N.

| celda | observado | esperado | obs/esp |
|---|---:|---:|---:|
| con portal ∧ CON nombre | 7.597 | 4.867 | **×1,56** |
| con portal ∧ SIN nombre | 3.867 | 6.597 | ×0,59 |
| sin portal ∧ CON nombre | 34.333 | 37.063 | ×0,93 |
| sin portal ∧ SIN nombre | 52.977 | 50.247 | ×1,05 |

```
   % con nombre entre las que TIENEN portal      66,3 %
   % con nombre entre las que NO tienen portal   39,3 %
   ⭐ razón                                       ×1,69
```

### B2 · ⚠️⚠️ El confusor: el tipo de vía (ley 48)

**Las aceras están donde hay portales por definición**, y son de las que menos nombre llevan. Así que
la comparación se repite **dentro de cada plataforma**.

⚠️⚠️ **Y AQUÍ ME EQUIVOQUÉ, Y ESTÁ ESCRITO ANTES DE EJECUTAR.** Mi predicción era: *«en `acera` se
aplana o se invierte; en `calzada` aguanta»*. **Salió al revés en las dos**, y las dos fallas ponen
el script en rojo. Bitácora nº97.

| plataforma | aristas | con portal | sin portal | razón | **techo** | **momios** |
|---|---:|---:|---:|---:|---:|---:|
| calzada | 29.431 | 90,2 % | 79,4 % | ×1,14 | **×1,26** | **×2,38** |
| plataforma-peatonal | 17.128 | 56,1 % | 21,2 % | ×2,64 | ×4,71 | ×4,73 |
| acera | 16.857 | 55,0 % | 36,6 % | ×1,50 | ×2,73 | ×2,11 |
| paso-de-peatones | 10.494 | 10,0 % | 10,5 % | **×0,95** | ×9,53 | **×0,95** |
| vial-de-servicio | 8.810 | 17,6 % | 9,9 % | ×1,78 | ×10,13 | ×1,95 |
| pista | 7.488 | 21,5 % | 12,9 % | ×1,68 | ×7,78 | ×1,86 |
| carril-bici | 4.675 | 80,7 % | 70,9 % | ×1,14 | ×1,41 | ×1,71 |
| camino | 3.081 | 20,5 % | 15,9 % | ×1,29 | ×6,27 | ×1,36 |
| escaleras | 810 | 18,8 % | 10,4 % | ×1,80 | ×9,60 | ×1,99 |

⭐⭐ **LAS DOS ÚLTIMAS COLUMNAS SON POST-HOC, y van declaradas como tales.** La razón cruda `a/b` está
acotada por `1/b`: con un 79,4 % de base, `calzada` **no puede pasar de ×1,26** ni con el efecto
máximo. Su ×1,14 no es «casi nada»: es el **52 % del recorrido que la aritmética permite**. ⛔ La
razón cruda **se queda** en la tabla; no se sustituye, que sería ajustar el instrumento al resultado
(nº88, nº91).

```
   con la razón cruda      SOBREVIVE en 6 de 9 plataformas
   ⭐ en momios            SOBREVIVE en 8 de 9   (solo `paso-de-peatones` es plana de verdad)
```

⭐ Y `paso-de-peatones` plana **tiene sentido físico**: un paso de cebra no lleva nombre lo tenga o
no la calle. Es el control nulo que la tabla no pidió y salió solo.

### B2b · ⚠️⚠️ El segundo confusor, y es el literal de la ley 48: **la geografía**

B2 controla el tipo de vía. **No controla dónde está la línea** — y las dos cosas podrían
correlacionar solo porque las dos pasan en la ciudad.

| ventana | aristas | con portal | sin portal | razón | techo | momios |
|---|---:|---:|---:|---:|---:|---:|
| casco histórico | 6.984 | 83,8 % | 52,3 % | ×1,60 | ×1,91 | ×4,71 |
| ensanche | 5.918 | 60,5 % | 46,9 % | ×1,29 | ×2,13 | ×1,74 |
| Valdespartera | 1.445 | 86,0 % | 57,3 % | ×1,50 | ×1,75 | ×4,56 |
| Actur-Rey Fernando | 9.054 | 58,8 % | 45,0 % | ×1,31 | ×2,22 | ×1,75 |
| Malpica-Santa Isabel | 1.309 | 82,7 % | 39,1 % | ×2,12 | ×2,56 | ×7,45 |
| PLAZA | 2.910 | 52,4 % | 18,0 % | ×2,91 | ×5,55 | ×5,01 |
| Movera | 728 | 58,7 % | 35,8 % | ×1,64 | ×2,80 | ×2,55 |
| Garrapinillos | 489 | 73,5 % | 33,1 % | ×2,22 | ×3,02 | ×5,60 |

**Sobrevive en las 8 de 8.**

⚠️ **Lo que esto NO descarta:** dentro de una ventana de 2 km² sigue habiendo manzana y descampado.
El control es más fino que el bruto, **no perfecto**.

### B3 · ⭐⭐ EL VEREDICTO, EN UNA FRASE

> **SE CUMPLE, y no lo explica el tipo de vía ni la geografía — pero no resuelve el problema: un
> tercio de las líneas con portales sigue sin nombre, y de ellas cuelgan 11.742 puertas.**

---

## C · EL MAPA — `tools/visor-nombres.html`

Doble clic. Leaflet por CDN, sin servidor, como los otros dos visores. El dato lo genera
`src/exportar-nombres.js` (**14 MB, gitignoreado** como los otros derivados; la regla se probó con
`git check-ignore` y con su positivo de control).

⛔ **La clasificación NO se hace en el mapa:** sale de `src/donde-falta.js`, la misma función que
produce la tabla de A2. Si el mapa clasificara por su cuenta, divergiría de la tabla — que es el
fallo nº68 con otra ropa.

**TRES colores, no dos:**

| | |
|---|---|
| 🔴 **rojo gordo** | sin nombre **y con portales** — 3.867 líneas · 371 km · **11.742 puertas** |
| 🔵 azul flojo | con nombre — 41.930 líneas |
| ⬜ gris casi invisible | sin nombre y **sin** portales — 52.977 líneas · 3.501 km |

⚠️ **Si los dos últimos se mezclaran, las 52.977 del monte taparían a las 3.867 de la ciudad**, que
son las que se viene a ver. **Al abrir solo se enciende la capa roja.**

Al pinchar una línea: qué es, cuántos portales tiene, de qué vía son esos portales, y **qué nombre
saldría si se dedujera** — ⛔ **INFORMATIVO y NO APLICADO**, con ese aviso en el propio globo. Y una
capa aparte con **los 11.742 portales** de esas líneas: dónde hay puerta y no hay calle.

### C7 · Las comprobaciones, antes de que nadie mire

```
node src/probar-visor-nombres.js
```

⭐⭐ **DOS contadores independientes**, y ésa es la respuesta a la ley 52: el que el visor publica de
sí mismo (`CUENTA`) **prueba que el visor sabe contar, no que pinte**. El segundo lo lleva el Leaflet
falso y no pasa por el visor.

```
   capa                               visor     arnés      dato
   con-nombre                         41930     41930     41930   ✅
   sin-nombre-con-portales             3867      3867      3867   ✅
   sin-nombre-sin-portales            52977     52977     52977   ✅
   portales                           11742     11742     11742   ✅
   las tres categorías suman                    98774 de 98774    ✅
```

**La contraprueba de la línea falsa:**

```
   dato                                   visor     arnés
   real                                    3867      3867
   real + 1 línea INVENTADA                3868      3868   ✅ se ve
   real otra vez (la falsa quitada)        3867      3867   ✅ desaparece
   ⭐ una línea falsa CON NOMBRE no se cuela en la capa roja   ✅
```

Y el recorte por zona no esconde el denominador: con el casco encendido dice **«193 de 3.867»**.

⚠️ **Lo que esto NO comprueba:** que se vea bien (colores, orden de capas, rendimiento con 98.774
líneas). **Eso solo lo ve un ojo delante del navegador.** Y **el fondo no verifica**: es OSM, la
misma fuente a la que le faltan estos nombres — **no puede desmentirse a sí mismo.**

⚠️ Bitácora nº98: la primera ejecución de este arnés acusó al visor de duplicarlo todo. **El que
contaba mal era el arnés.**

---

## D · EL ARREGLO DEL TEXTO — acera, no carril bici

> **«Si vamos andando NO PODEMOS IR POR UN CARRIL BICI. Tendrás que decir POR ACERA.»**

**Tenía razón, y era un fallo de producto dentro de la mejora que la tanda 19 celebró.** Bitácora
nº99: el modelo tenía `F.papel(forma, 'pie')` y **el redactor no lo usaba** — tenía su propia tabla
con una entrada `'carril-bici': 'el carril bici de'` que no distingue modo ninguno.

`SUSTANTIVO` pierde esa entrada y entra `comoSeAnda(forma)`, que dice **solo lo que el Ayuntamiento
declara** en `tipo_carri`:

| lo que hay | lo que dice el texto | y su aviso |
|---|---|---|
| plataforma de andar (acera, peatonal…) | «Por **la acera de** X» | si lleva carril encima: *por aquí pasan bicis* |
| carril bici **SOBRE LA ACERA** | ⭐ «Por **la acera de** X» | *el Ayuntamiento lo declara sobre la acera: se anda por ella compartiendo con las bicis* |
| carril bici **EN LA CALZADA** | «Por X» *(sin sustantivo)* | *el Ayuntamiento lo sitúa EN LA CALZADA, no sobre la acera* |
| senda ciclable | «Por X» | *se comparte con bicicletas* |
| carril bici **sin dato municipal** | «Por X» | ⛔ *no consta si va sobre la acera o en la calzada* |

⭐ **Y con eso el texto ya distingue sobre acera de en calzada** — el segundo defecto que la tanda 19
declaró y no tocó, y que es justo la información que resolvió la discrepancia de la tanda 18.

⚠️ **LA TENSIÓN QUE ESTO DEJA A LA VISTA, y se declara en vez de esconderse:** cuando OSM dibuja el
carril y el municipal dice que va sobre la acera, la frase dice «la acera de X» **mientras D4 sigue
marcando ese tramo con ◦** («solo tengo el eje de la calzada»). ⛔ **D4 no se toca.** El aviso lo
explica.

### D4 · ⛔ Las mayúsculas: NO CONSTA, y no por falta de método

| fuente | campos de nombre | con mayúsculas y minúsculas |
|---|---|---:|
| callejero del padrón (`vias-zaragoza.json`, 3.359 vías) | `nombre` · `nombreCompleto` · `nombrePublico` · `nombrePublicoNorm` | **0 · 0 · 0 · 0** |
| callejero del WFS de urbanismo (3.359 vías) | `nombre` · `nombre_completo` · `nombre_reducido` · `nombre_publico` | **0 · 0 · 0 · 0** |

⭐ **Positivo de control del buscador:** el mismo buscador SÍ ve minúsculas en los campos `…Norm`,
3.359 de 3.359 ✅. **No es un buscador roto: es que el dato no lo trae.**

⇒ **Dos fuentes municipales independientes, ocho campos de nombre, y ninguno en formato normal.**
Reconstruirlo a mano exige decidir «de», «la», «San», «D'Anglade» y los romanos: **eso es escribir el
nombre, no leerlo.** ⛔ Se declara y se deja.
⚠️ Y una pista de por dónde no ir: una vía trae **«ABOGACíA»**, con la í minúscula — un artefacto de
codificación del origen. **El dato ni siquiera es consistente en su propia mayúscula.**

### D5 · Las siete rutas

```
    ruta   metros sin modelo   metros con modelo   aristas   idénticas   publicado tanda 16
       1              3086.9              3086.9       107           ✅   3086.9  ✅
       2               598.1               598.1        23           ✅   598.1  ✅
       3              3704.9              3704.9        94           ✅   3704.9  ✅
       4               505.9               505.9        26           ✅   505.9  ✅
       5               477.4               477.4        20           ✅   477.4  ✅
       6               523.4               523.4        19           ✅   523.4  ✅
       7              2528.9              2528.9        69           ✅   2528.9  ✅
```

**Textos 1 a 5 IDÉNTICOS. Cambian la 6 y la 7.** Y la salida **sin** `--modelo` sigue siendo idéntica
—`diff` limpio salvo la línea del cronómetro— a la capturada **antes** de tocar `relato.js`.

#### Ruta 6 · antes y después

```
ANTES     3. ◦ Por el carril bici de POLÍGONO MIGUEL SERVET           221 m

DESPUÉS   3. ◦ Por POLÍGONO MIGUEL SERVET (eje de calzada)            221 m
              ⚠️  el Ayuntamiento sitúa este carril bici EN LA CALZADA, no sobre la acera
```

#### Ruta 7 · el bloque que importa

```
ANTES      2. ◦ Por el carril bici de AVENIDA ACADEMIA GENERAL MILITAR   509 m  · 2 tramos de OSM
           3. ◦ Por el carril bici de AVENIDA SAN JUAN DE LA PEÑA        760 m

DESPUÉS    2. ◦ Por la acera de AVENIDA ACADEMIA GENERAL MILITAR         427 m
               ⚠️  aquí el Ayuntamiento declara el carril bici SOBRE LA ACERA, así que se
                   anda por ella compartiendo con las bicis — aunque OSM solo dibuje la
                   franja del carril
           3. ◦ Por AVENIDA ACADEMIA GENERAL MILITAR (eje de calzada)     82 m
               ⚠️  el Ayuntamiento sitúa este carril bici EN LA CALZADA, no sobre la acera
           4. ◦ Por AVENIDA SAN JUAN DE LA PEÑA (eje de calzada)         760 m
               ⚠️  el Ayuntamiento sitúa este carril bici EN LA CALZADA, no sobre la acera
```

⭐ **Los 509 m de Academia General Militar se PARTEN en 427 + 82** porque son **dos ways de OSM con
asignación municipal distinta**: uno sobre acera y otro en calzada. Antes se fundían en un tramo
porque decían lo mismo. **Es información nueva, no ruido.**

⚠️⚠️ **Y EL PROBLEMA NUEVO, bitácora nº100:** el aviso del tramo 4 —*«el Ayuntamiento sitúa este
carril bici EN LA CALZADA»*— **habla de los 760 m que no tienen asignación propia** (el rojo de la
tanda 19). Hasta hoy el way solo prestaba un NOMBRE; ahora presta **una cita a una fuente sobre unos
metros concretos**. ⛔ **No se arregla**: arreglarlo exige que el redactor distinga arista de way o un
umbral de cobertura, **y las dos cosas son diseño** (nº96). **Decide Antonio.**

---

## R · ⚠️ LA RECOMENDACIÓN — ¿hace falta el método de los portales?

⛔ **Esto no nombra nada.** Se ejecuta `heredar-nombre.js` sobre «las que duelen» **solo para contar**
cuántas tendrían votos bastantes.

| resultado del método | aristas | metros | portales | % |
|---|---:|---:|---:|---:|
| **NOMBRADA** | **1.292** | 170,56 km | **8.289** | 33,4 % |
| AMBIGUA | 27 | 4,93 km | 222 | 0,7 % |
| MUDA | 2.548 | 195,39 km | 3.231 | 65,9 % |

⭐⭐ **SÍ MERECE LA PENA, y el número que lo dice no es el de líneas:**

```
   ⭐ portales que dejarían de colgar de una línea sin nombre   8.289 de 11.742   (70,6 %)
```

**Nombra pocas líneas (33,4 %) y son las que tienen la gente.** Las 2.548 MUDAS son aristas de uno o
dos portales: **3.231 puertas entre todas las 2.548.**

⚠️ **Y el descuento honesto:** el acierto del método no es del 100 %. La tanda 17 lo midió en
**76,7 %** por arista sobre el patrón de verdad, **con techo declarado**. ⇒ cobertura × acierto ≈
**131 km de los 371 que duelen**. El número de arriba es **cobertura posible, no aciertos**.

⚠️ Y las mejoras del método ya identificadas en la tanda 17 —paridad, normalizador, agrupación por
way— **no están medidas aquí**: esto es el método tal como quedó.

---

## ⚠️ QUÉ SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

| se buscó | resultado |
|---|---|
| **que el enganche prefiriera aristas con nombre** (la autoconfirmación) | ⛔ **NO existe**: 46.150 de 46.150 idénticos con los nombres tapados |
| **una fuente municipal con el nombre en mayúsculas y minúsculas** | ⛔ **NO existe**: 2 fuentes, 8 campos, 0 |
| **que «las que duelen» estuvieran apiladas** en pocas vías | ⛔ **NO lo están**: 1.137 vías, las 20 primeras solo el 18,2 % |
| **que la hipótesis se explicara por el tipo de vía** | ⛔ **NO**: sobrevive en momios en 8 de 9 plataformas |
| **que se explicara por la geografía** | ⛔ **NO**: sobrevive en las 8 de 8 ventanas |
| **que casi todas las líneas con portales ya tuvieran nombre** | ⛔ **NO**: un tercio no lo tiene |

## ⚠️ QUÉ **NO** SE HA COMPROBADO

- **Que ninguna clasificación sea correcta sobre el terreno.** «Sin nombre» significa *el dato no lo
  dice*, no *no tiene nombre*. Nadie ha ido a mirar ninguna de las 3.867.
- **Que el mapa se vea bien.** Solo se ha comprobado que pinta lo que dice pintar.
- **El aviso «se comparte con bicicletas» en líneas que SÍ tienen nombre en OSM.** Hoy el modelo solo
  habla donde OSM se calla. De las **313 líneas de andar con carril bici municipal encima**, **218 no
  tienen nombre en OSM y SÍ llevan el aviso**; las **95 que sí lo tienen se quedan sin él**. ⛔
  Extenderlo exige una resolución `ciclista`→way que **no está en ningún diseño aprobado**, y la
  bitácora nº96 dice que eso es diseño y no impresión. **No se ha hecho, y se dice el número.**
- **El eje TIEMPO.** Los portales son del padrón; el grafo, del sello de OSM del 3 de agosto. No se ha
  medido cuánto se separan.
- **Que la ventana de 2 km² sea un control de geografía suficiente.** No lo es del todo, y se dice.

## LOS DIEZ EJES

| eje | ¿tocado? |
|---|---|
| **posición** | ⭐ sí — la curva de radio, y la distancia de enganche con su reparto |
| **vecindad** | ⭐ sí — la definición entera («qué portales le dan a esta línea») |
| **identidad** | ⭐ sí — A0: la misma arista con y sin nombres |
| **correspondencia** | ⭐ sí — el cuadre de las cuatro celdas y el del visor, dos contadores |
| **umbral/cola** | ⭐ sí — el techo de la razón (nº97) y el reparto de portales por arista |
| **escala** | ⭐ sí — aristas **y** metros **y** portales en todas las tablas |
| **densidad** | ⭐ sí — A4 y B2b por las ocho ventanas |
| **agregación** | ⭐ sí — A5, con su doble recuento declarado |
| **semántica** | ⭐ sí — B2 por plataforma; D, el papel por modo |
| **dirección** | ⛔ **NO** — nada de esta tanda depende del sentido de la línea |

## LOS ROJOS QUE QUEDAN VIVOS

| script | qué declara |
|---|---|
| `donde-falta.js` | ⭐ **NUEVO** · mis dos predicciones de B2 fallaron (nº97) |
| `asignar-bici.js` | tanda 19 · el desplazamiento no se hunde en aristas |
| `modelo.js` | tanda 19 · la familia de choque `corridor` no predicha |
| `modelo-rutas.js` | tanda 19 · San Juan de la Peña sin asignación propia — ⚠️ **y ahora más caro**, nº100 |

⛔ **Ninguno se ha arreglado.** Los tres de la tanda 19 son decisiones de Antonio.

---

## LO QUE ESTA TANDA DEJA DECIDIDO Y LO QUE NO

**Decidido por el dato:**
- La pregunta útil es la de Antonio, y su definición de ciudad —*donde no hay puntos no es ciudad
  consolidada*— **no necesita control** porque no tiene umbral.
- El problema del nombre **es real y es de tamaño medio**: 25,5 % de las puertas, repartido en más de
  mil vías.
- **El método de portales cubriría el 70,6 % de esas puertas.**

**Sin decidir, y son de Antonio:**
1. ¿Se aplica el método de portales? (con su 76,7 % de acierto y sus mejoras sin medir)
2. Los tres rojos de la tanda 19 — y el cuarto asunto que nº100 pone encima: **si el texto puede
   heredar del way una CITA, y no solo un nombre.**
3. Si el aviso de «se comparte con bicicletas» debe llegar también a las **95 líneas** que tienen
   carril bici municipal encima **y** nombre en OSM.
