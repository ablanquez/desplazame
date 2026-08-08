# H1 · PONER LOS NOMBRES Y SIMPLIFICAR EL ITINERARIO

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 3 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `11.742` | **2.669** | `docs/H1-ROJOS-CERRADOS.md §E1` · 2026-08-05 |
> | `3.166` | **2.669** | `docs/H1-ROJOS-CERRADOS.md §E1` · 2026-08-05 |
> | `6 km/h` | **5,0 km/h** | `docs/H1-VELOCIDAD-ESTANDAR.md §0` · 2026-08-08 |
>
> <sub>las puertas que cuelgan de una línea sin nombre · la velocidad con la que se calculan los tiempos — era la de UNA persona</sub>
<!-- SUPERADOS:FIN -->

*Tanda 21 · 2026-08-04 · cinco cosas decididas por Antonio, aplicadas.*

> ⛔⛔ **El cálculo de rutas NO se toca.** Ni costes, ni transitabilidad, ni enganche, ni tolerancia,
> ni el planarizado. **Las siete rutas salen idénticas al milímetro** — metros, aristas y nodos —
> entre las dos ejecuciones y contra lo publicado en la tanda 16. Lo que cambia es el REDACTOR.

> **Este documento se AÑADE, no reescribe nada.**

```
node src/nombre-largo.js       # B · el reconocedor del nombre largo, y su medida
node src/modelo.js             # A · el método de portales, ya aplicado
node src/pasos.js              # C5 y E2 · pasos antes/después y el aviso de bicis
node src/rutas-antonio.js --aristas --modelo    # las siete, con el texto nuevo
node src/modelo-rutas.js       # el guardián: las siete idénticas
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ 8.576 PUERTAS GANAN CALLE** | Los portales que cuelgan de una línea sin nombre pasan de **11.742 a 3.166**: del **25,5 %** de las puertas de Zaragoza al **6,9 %**. ⚠️ La tanda 20 predijo 8.289 midiendo por arista; **por way salen 8.576**, que es lo que §B3b de la tanda 17 dijo que pasaría. |
| **⭐⭐ EL ITINERARIO TIENE UN CUARTO MENOS DE PASOS** | Las siete rutas: **110 → 82** pasos (**−25 %**). La nº7 de **20 a 12**; la nº3 de **31 a 21**; la nº4 de 11 a 7. |
| **⭐ Y EL NOMBRE LARGO SUBE EL ACIERTO 13 PUNTOS** | El método acierta **76,7 % → 89,7 %** por arista y **80,9 % → 92,3 %** por way. El testigo del enganche pasa de **73,7 % a 87,8 %** de concordancia, con **0 emparejamientos rotos**. |
| **⭐⭐ Y DE PASO SE ARREGLAN LAS MAYÚSCULAS SIN INVENTAR NADA** | Cuando un paso funde «Avenida de San Juan de la Peña» (OSM) con «AVENIDA SAN JUAN DE LA PEÑA» (deducida), **manda OSM (D0)** — se elige entre dos cadenas reales, no se escribe ninguna. |
| **✅ EL AVISO DE BICIS ES RARO** | Sale en **5 de los 82 pasos (6,1 %)**. El listón se declaró antes de mirarlo: más de la mitad y dejaría de informar. ⚠️ La muestra es de siete rutas del Actur y el centro: **no es una tasa de Zaragoza**. |
| **⛔ FUERA LA CLASIFICACIÓN DEL CARRIL** | *«el Ayuntamiento sitúa este carril bici EN LA CALZADA»* se va del texto. El dato **se queda en el modelo** para H2. |
| **⚠️ lo que sale mal (mío), 1** | Bitácora nº102: **restringí el reconocedor de nombres usando una decisión escrita para otra pregunta**, y le puse un `A.exige` que defendía el error. |
| **⚠️ lo que sale mal (mío), 2** | Bitácora nº103: **la expectativa del guardián estaba escrita como lista y caducó**. Se puso roja porque el proyecto mejoró. |
| **⚠️⚠️ lo que sale mal (mío), 3** | Bitácora nº104: **excluí de la absorción justo el ejemplo que Antonio había puesto** —el cruce— y luego la racha se comía a su propio cierre. **Lo cazó la curva de sensibilidad, no el resultado.** |

---

## A · EL MÉTODO DE LOS PORTALES, APLICADO

> *«Tenemos una línea que no tiene nombre de vía, pero por proximidad tiene varios portales con
> nombre de vía. ¿Conclusión? Tenemos un nombre de vía para esa línea.»*

**La unidad es el WAY** (A1) — no es una elección de hoy: la tanda 17 §B3b midió que multiplica la
cobertura por **2,4** y sube el acierto **4 puntos**, con el mismo patrón de verdad y los mismos
umbrales (3 votos · 2/3).

```
   fuente del nombre           aristas      metros        %
   (sin vía)                     53932  3631.55 km   54.6 %
   osm                           40420  2508.88 km   40.9 %
   ⭐ portales                    2912   240.38 km    2.9 %      ⛔ `declarada: false`
   municipal-bici                 1510   119.18 km    1.5 %

   resultado del método, por WAY      ways
   NOMBRADA                           4304
   ⚠️ AMBIGUA                          161      ⛔ no se nombra (A3)
   MUDA                               3821
```

### ⭐⭐ El número que manda no es el de líneas: es el de puertas

```
                          aristas    metros      PORTALES sin calle
   ANTES (tanda 20)          3867   370,87 km    11.742   (25,5 % de 46.026)
   ⭐ DESPUÉS (tanda 21)     2161   174,76 km     3.166   ( 6,9 %)
   ⇒ ganan calle                                 8.576 puertas
```

⚠️ **AMBIGUA sigue siendo un resultado** (A3): 161 ways tienen portales de varias vías y ninguna
domina. Una acera de esquina no es de ninguna calle en exclusiva. **Ahí no se nombra.**

⚠️ **El paso que casi se cuela** (bitácora nº101): `heredar-nombre.js` devuelve un **núcleo
normalizado**, no un nombre. Aquí se recupera el nombre real **del portal que votó** —⛔ no de un
índice por núcleo, que uniría homónimos (ley 41)— y entre los votantes se coge **el más largo**, que
es lo que pide §B.

---

## B · EL NOMBRE BUENO ES EL LARGO

> *«Si tienes un Poeta María Zambrano y luego un Calle María Zambrano o M. Zambrano, ¿sabes entender
> que todo es el mismo nombre?» «Si es título grande, se deja el grande.»*

**La regla, y por qué es ésta:** una versión corta es un **recorte contiguo** de la larga. ⛔ **No se
quitan títulos** — una lista de títulos (`poeta`, `doctor`, `general`…) es una lista que alguien
escribe mirando los casos que le molestan, y entonces *Santa Cruz* se convierte en *Cruz*. Se
comprueba que las palabras del corto aparecen **seguidas y en orden** dentro del largo.

⚠️ **AMBIGUO es un resultado** (B2): si un corto cabe en dos largos, no se elige ninguno.

### B0 · Los controles, antes de aplicarla a nada

**Positivos** — ⭐ los cinco están publicados en `docs/H1-NOMBRAR-ACERAS.md` §C4b, escritos en la
tanda 17: no los elijo yo (ley 17). Los cinco pasan ✅.

**Negativos y casos borde**, y aquí está lo que hay que mirar:

| | REGLA | variante sufijo | caso |
|---|---|---|---|
| ⚠️ | 🔗 UNE | 🔗 UNE | `cruz` vs `santa cruz` — **el aviso de Antonio (B3)** |
| | ❌ separa | ❌ separa | `garcia arista` vs `garcia sanchez arista` — recorte no contiguo |
| ⛔ | ❌ separa | ❌ separa | `m zambrano` vs `poeta maria zambrano` — **la abreviatura NO se caza** |
| | 🔗 UNE | ❌ separa | `mayor` vs `mayor grp` — ver abajo |

⚠️⚠️ **`cruz` / `santa cruz` la regla los une, y hay que decirlo alto.** Ninguna variante lo resuelve:
«Santa» va delante, como un título. La defensa no es una excepción escrita a mano —eso es la lista de
títulos con otro nombre— sino que **(1)** el corto tiene que existir como vía, **(2)** si cabe en dos
largos es ambiguo, y **(3)** ⭐ donde de verdad se usa, **la geometría ya dice que es la misma línea**.

### B3 · Cuántos emparejamientos cambian, y si los nuevos son ciertos

```
   portales comparables (los dos nombres existen)             34084
      concordaban con la regla vieja (`a === b`)              25120  (73,7 %)
      discordaban                                              8964

   ⭐ pasan de DISCORDA a concuerda                            4812  (53,7 % de los discordantes)
   ⛔ pasan de concuerda a DISCORDA (tiene que ser 0)             0   ✅
   ⭐ concordancia total: antes → después              73,7 %  →  87,8 %
```

⚠️ **Que no rompa nada PASA POR CONSTRUCCIÓN** —`igual || contiene` solo puede añadir— y decirlo como
logro sería tramposo. **Lo que de verdad hay que probar es que los nuevos sean ciertos**, y para eso
hay un testigo que la regla no puede ver: **la distancia de enganche.**

```
   distancia de enganche (mediana · p90)
      los que ya concordaban                5,3 m · 12,9 m
      ⭐ los que la regla nueva añade        6,0 m · 18,9 m
      los que SIGUEN discordando           10,2 m · 32,2 m
```

⇒ **Los nuevos están tan pegados a su línea como los viejos.** Si fueran calles equivocadas estarían
lejos.

### B4 · Cuánto sube el acierto del método

| unidad | opina | acierto EXACTO | + misma vía, otro nombre | ⭐ **acierto con la regla** |
|---|---:|---:|---:|---:|
| arista | 3.781 | 2.901 (76,7 %) | 491 (13,0 %) | **89,7 %** |
| **⭐ way** | 8.962 | 7.249 (80,9 %) | 1.019 (11,4 %) | **92,3 %** |

⚠️ Sigue siendo un **techo**, no una estimación: las aristas con nombre no son una muestra al azar de
las que no lo tienen (§C2 de la tanda 17). **Lo que la regla cambia es qué se cuenta como fallo.**

### ⛔ Lo que la regla NO caza

**Las abreviaturas.** `M. Zambrano` normaliza a `m zambrano`, y `m` no es `maria`. Antonio lo puso en
el ejemplo y **esta regla no lo resuelve**. Medido: 54 de 3.263 núcleos del callejero (1,7 %) y 79 de
3.066 de OSM (2,6 %) tienen alguna palabra de una letra — **y casi todas son ordinales romanos**
(`juan carlos i`, `alfonso i`, `alfonso v aragon`). ⛔ Una regla de iniciales uniría «Alfonso I» con
«Alfonso», **que son dos calles de Zaragoza**.

### ⚠️⚠️ La restricción que escribí, medí y retiré — bitácora nº102

La segunda versión exigía que el recorte fuera un **sufijo**, porque en castellano el título va
delante y porque `direccion.js` declara desde la tanda 6 que «Calle Mayor» y «Calle Mayor GRP» son
dos calles. **Estaba mal**, y lo dijo la clasificación de lo que tiraba:

```
   3368  la cola es un CÓDIGO DE BARRIO RURAL de 3 letras   ← MVR, MNZ, GRP, SJN, CST, SIS, MNT…
    102  la cola es «10»
     47  la cola es «caballero»
```

**`MAYOR MVR` es la Calle Mayor de Movera** — la misma que OSM llama «Calle Mayor». `direccion.js`
tiene razón **para su pregunta y no para ésta**: el geocodificador pregunta *«¿qué calle quiere decir
este texto?»* y ahí «Calle Mayor» es ambigua; este reconocedor pregunta *«estos dos nombres, pegados
a la MISMA geometría, ¿son la misma calle?»*.

⇒ La regla vuelve a ser ancha, la variante de sufijo se publica al lado (77,1 % en vez de 87,8 %), y
queda escrito ⛔⛔ **que este reconocedor NUNCA resuelve un texto a una calle.**

---

## C · EL ITINERARIO SE AGRUPA POR VÍA

> *«Si estoy en Avenida de la Academia o en Avenida San Juan de la Peña, ¿por qué lo repites 300
> veces? Se pone una con todos los metros y punto.»*

**Tenía razón y era un fallo de producto.** Se agrupaba por *nombre + precisión + **avisos***, así que
**un cambio de aviso partía la avenida en tres**. ⇒ ahí se coló un criterio NUESTRO —la clasificación
municipal del carril— en una decisión que es del que anda.

⭐ **«La misma vía» lo decide §B**: por eso «Avenida de San Juan de la Peña» (OSM) y «AVENIDA SAN JUAN
DE LA PEÑA» (deducida) son **un solo paso**, y «Calle Oliván Bayle» y «CALLE FRANCISCO OLIVÁN BAYLE»
también.

⛔ **Qué NO se funde nunca**, y la línea es **física, no de longitud**:
- unas **ESCALERAS** — son un esfuerzo y una barrera de accesibilidad;
- un tramo **CONDICIONAL** — puede estar cerrado.

**Cruzar se atraviesa; subir unas escaleras o encontrarse una puerta cerrada, no.**

### C5 · Cuántos pasos tenía cada ruta y cuántos tiene ahora

⭐ **Tres columnas y no dos**, para aislar lo que hace C de lo que hace A:

| ruta | tramos de OSM | vieja | solo C | **C + A** | C reduce | A añade |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 61 | 27 | 22 | **22** | −5 | +0 |
| 2 | 15 | 9 | 9 | **9** | 0 | +0 |
| 3 | 54 | 31 | 21 | **21** | −10 | +0 |
| 4 | 21 | 11 | 7 | **7** | −4 | +0 |
| 5 | 6 | 4 | 3 | **4** | −1 | +1 |
| 6 | 11 | 9 | 8 | **7** | −1 | −1 |
| 7 | 29 | 19 | 11 | **12** | −8 | +1 |
| **TOTAL** | 197 | **110** | 81 | **82** | **−29** | +1 |

⚠️ La columna «vieja» es la **REGLA** de la tanda 20 aplicada a los tramos de hoy, para que la
comparación aísle el agrupador. La salida real de la tanda 20 daba 27·9·31·11·3·8·20 = **109**.

⚠️ **Que A AÑADA pasos no es un fallo de C**: es lo que pasa cuando una parte de un tramo gana nombre
y la otra no. *«Un tramo sin nombre de 108 m»* se parte en *«una acera que parece de Principado de
Morea, 30 m»* + *«un tramo sin nombre, 78 m»*. **Más pasos y más información.** ⛔ Fundirlos sería
ponerle a los 78 m un nombre que nadie ha deducido para ellos.

⭐⭐ **Y el cuadre al lado**, porque bajar no puede significar borrar: la suma de los pasos da los
metros de la ruta en las siete ✅.

### C2 · De qué depende el umbral de «corto»

El umbral **no me lo invento**: es el **p99 de la longitud de una arista `paso-de-peatones` en
Zaragoza** —**13,3 m** sobre las 10.494 que hay—, o sea **lo que mide cruzar una calle aquí**.

```
   p50  3,9 m  ·  p75  5,5 m  ·  p90  7,4 m  ·  p95  9,0 m  ·  ⭐ p99 13,3 m  ·  máx 51,5 m
```

⚠️ **La magnitud sale del dato; la elección del percentil es MÍA.** Por eso va la curva entera:

| ruta | 0 m (base) | 7,4 m | 9,0 m | **13,3 m** | 20 m | 30 m | 50 m |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 27 | 25 | 25 | **22** | 22 | 22 | 22 |
| 2 | 9 | 9 | 9 | **9** | 9 | 9 | 9 |
| 3 | 31 | 21 | 21 | **21** | 15 | 15 | 15 |
| 4 | 11 | 11 | 7 | **7** | 7 | 7 | 7 |
| 5 | 4 | 4 | 4 | **4** | 4 | 4 | 4 |
| 6 | 9 | 7 | 7 | **7** | 7 | 7 | 7 |
| 7 | 18 | 12 | 12 | **12** | 12 | 12 | 12 |
| **TOTAL** | **109** | 89 | 85 | **82** | 76 | 76 | 76 |

⇒ **El resultado no cuelga del percentil**: entre 13,3 m y 30 m hay 6 pasos de diferencia sobre 82.

⭐⭐ **Y la monotonía se comprueba RUTA POR RUTA**, no sobre el total: absorber interrupciones más
largas no puede producir más pasos. **Ahí estaba el fallo nº104 y el total lo tapaba.**

### C3 · Lo que se ha tragado — porque agrupar es borrar

**16 interrupciones absorbidas en las siete rutas (80 m).** Las de la nº7 son literalmente las que
Antonio nombró:

```
   ruta nº7:   4 m  «Calle de Juslibol»    dentro de «Avenida de San Juan de la Peña»
               6 m  «CALLE PEÑA OROEL»     dentro de «Avenida de San Juan de la Peña»
               6 m  «sin nombre»           dentro de «Calle Oliván Bayle»
   ruta nº3:   7 m  «Avenida de la Ilustración»  dentro de «Glorieta de Manuel Albar»
               6 m · 2 m · 3 m  «sin nombre»     dentro de «Avenida del Alcalde Gómez Laguna»
```

⛔ **No se pierden**: viajan en `comido` dentro del paso que se los tragó.

---

## D · FUERA LA CLASIFICACIÓN DEL CARRIL

> *«Lo de las advertencias de carril bici en acera y todo eso me sobra.»*

**Y tiene razón.** A quien va andando le da igual cómo clasifique el Ayuntamiento el carril: es un
detalle administrativo que nos sirvió **a nosotros** para entender el dato. ⭐ Es el mismo error de la
tanda anterior con otra piel: contarle al peatón algo que es del otro modo.

⛔ Se van del texto los dos avisos (*«EN LA CALZADA»*, *«SOBRE LA ACERA»*). **El dato se queda en
`forma.ciclista`**: lo necesita la bici en H2.

⭐ **Y lo que SÍ se queda es que por ahí pasan bicis** — eso no es clasificación, es que conviene ir
atento.

### D3 · Cómo se dice un nombre DEDUCIDO

| lo que hay | cómo se dice |
|---|---|
| acera deducida | «Por **una acera que parece de** X» |
| zona peatonal deducida | «Por **una zona peatonal que parece de** X» |
| lo demás deducido | «Por **lo que parece** X» |

+ su aviso, una vez: *«el nombre no lo dice el mapa: lo deduzco de los portales que dan a esta
línea»*.

⭐ **Y si un paso funde un trozo deducido con otro que OSM sí nombra, manda OSM (D0)** y el paso deja
de ser deducido. Sale en **3 de los 82 pasos (95 m)** — menos de lo que el modelo nombra, y es
correcto: **el nombre deducido solo se dice cuando es lo único que hay.**

### D4 · Las mayúsculas, resueltas sin tocarlas

⛔ No se inventa ninguna. Lo que pasa es que **al agrupar por vía hay dos cadenas reales para el mismo
paso** —la de OSM y la del callejero— y **se elige la de OSM (D0)**. Por eso la ruta 7 ya no dice
«AVENIDA SAN JUAN DE LA PEÑA» al lado de «Avenida de San Juan de la Peña»: dice **una sola vez**
«Avenida de San Juan de la Peña».
⚠️ Donde OSM no tiene nombre, el municipal sigue saliendo en mayúsculas. **Sigue sin haber fuente con
el nombre en formato normal** (medido en la tanda 20 §D4: dos fuentes, ocho campos, cero).

---

## E · EL AVISO DE BICIS

> *«Ese se mantiene siempre que sea verdad que en muy pocas calles pasa eso.»*

⚠️ **El número solo significa algo DESPUÉS de agrupar**: antes de C salía en 4 de los 20 tramos de la
ruta 7, pero los tramos eran trocitos.

| ruta | pasos | con aviso | % | metros con bicis | % de la ruta |
|---:|---:|---:|---:|---:|---:|
| 1 | 22 | 0 | 0,0 % | 0 m | 0,0 % |
| 2 | 9 | 0 | 0,0 % | 0 m | 0,0 % |
| 3 | 21 | 0 | 0,0 % | 0 m | 0,0 % |
| 4 | 7 | 0 | 0,0 % | 0 m | 0,0 % |
| 5 | 4 | 0 | 0,0 % | 0 m | 0,0 % |
| 6 | 7 | 1 | 14,3 % | 221 m | 42,2 % |
| 7 | 12 | 4 | 33,3 % | 1,36 km | 53,9 % |
| **TOTAL** | **82** | **5** | **6,1 %** | 1,58 km | 13,9 % |

⭐ **El listón se declaró antes de mirarlo:** más de la mitad de los pasos y dejaría de significar
nada. Sale en el **6,1 %** ⇒ **es raro, y por eso informa.**

⚠️ **Y la muestra es de siete rutas del Actur y el centro**, no de la ciudad. En un barrio sin carril
bici saldría 0; en el Actur, más. **No es una tasa de Zaragoza.**

---

## ⭐⭐ LAS SIETE RUTAS, IDÉNTICAS AL MILÍMETRO

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

⚠️ **La expectativa del texto ya no se escribe a mano** (bitácora nº103): el texto de una ruta tiene
que cambiar **si y solo si** alguno de los ways que pisa gana vía por el modelo. Cambian **1, 5, 6 y
7** y son exactamente las que deben ✅. **Y ahora puede fallar en las dos direcciones.**

### La ruta 7 con el texto nuevo — de 20 pasos a 12

```
     Calle El Coloso 2  →  Calle Valle de Zuriza 48
     ──────────────────────────────────────────────
     2,53 km · unos 25 min · rodeo 1,06
     ⚠️ el tiempo es una estimación a 6 km/h, la velocidad de Antonio calibrada sobre
        UN solo trayecto. No es un dato del motor.
     enganche: 8 m en el origen, 16 m en el destino

       1. ◦ Por Calle de El Coloso (eje de calzada)                 28 m
       2. ◦ Por la acera de AVENIDA ACADEMIA GENERAL MILITAR       509 m   · 2 tramos de OSM
           ⚠️  por aquí pasan bicis: conviene ir atento
       3. ◦ Por Avenida de San Juan de la Peña (eje de calzada)  1,53 km   · 11 tramos de OSM
           ⚠️  por aquí pasan bicis: conviene ir atento   (766 m de los 1,53 km)
       4. ◦ Por Calle Oliván Bayle                                 114 m   · 4 tramos de OSM
           ⚠️  por aquí pasan bicis: conviene ir atento   (5 m de los 114 m)
       5. ◦ Por un tramo sin nombre (eje de calzada)                13 m
       6. ◦ Por Calle Matilde Sangüesa Castañosa (calzada con acera declarada)    15 m
       7. ◦ Por un tramo sin nombre (eje de calzada)                 9 m
       8.   Por un tramo sin nombre (calle peatonal)                52 m
       9.   Por la zona peatonal de CALLE AZUCARERA                 84 m   · 3 tramos de OSM
           ⚠️  por aquí pasan bicis: conviene ir atento
      10.   Por un tramo sin nombre (calle peatonal)                34 m
      11. ◦ Por Calle Caminos del Norte (calzada con acera declarada)    31 m
      12. ◦ Por Calle del Valle de Zuriza (calzada con acera declarada)   107 m   · 2 tramos de OSM

           TOTAL                                                2,53 km

      ◦  2,35 km del recorrido (el 93 %, repartidos por 9 de los 12 pasos) van por el EJE DE LA
         CALZADA: ahí no tengo la acera dibujada, así que los metros pueden bailar.
```

⭐ **El paso 3 son 1,53 km de una sola avenida**, con **11 tramos de OSM** fundidos dentro, el cruce
de Juslibol y el de Peña Oroel absorbidos, y el aviso de bicis **con sus 766 m al lado** en vez de
partiendo la avenida en tres.

⚠️ **Y una cosa que el agrupado se lleva por delante, dicha:** el paso 2 funde 427 m que el municipal
declara *sobre acera* con 82 m que declara *en calzada*, y los cuenta todos como «la acera de». Es
el precio de agrupar; el detalle está en `candidatos` y `comido`, y ⛔ **no se le cuenta al peatón por
decisión de §D**.

---

## ⚠️ QUÉ SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

| se buscó | resultado |
|---|---|
| **que el nombre largo rompiera emparejamientos que hoy funcionan** | ⛔ **0 de 25.120** — y pasa por construcción, y se dice |
| **que los nuevos emparejamientos fueran calles equivocadas** | ⛔ **no**: están a 6,0 m de mediana de su línea, como los viejos |
| **que la regla uniera nombres al azar** | ⛔ **1 de 20.000** parejas (0,0 %) |
| **una forma de cazar `M. Zambrano`** | ⛔ **NO la hay sin romper «Alfonso I» vs «Alfonso»**. Se declara |
| **que el resultado dependiera del umbral de «corto»** | ⛔ **no**: 6 pasos de 82 entre 13,3 m y 30 m |
| **que alguna ruta se moviera** | ⛔ **ninguna**: las siete al decimal, y contra la tanda 16 |

## ⚠️ QUÉ **NO** SE HA COMPROBADO

- **Que ninguno de los 2.912 nombres deducidos sea correcto sobre el terreno.** El 89,7 % es contra
  OSM, no contra la calle. Nadie ha ido a mirar.
- **Que el agrupado por vía sea el que un peatón querría.** Se ha comprobado que no borra metros y
  que baja el número de pasos; **si 12 pasos es lo cómodo para la ruta 7 lo dice Antonio**.
- **El aviso de bicis fuera de estas siete rutas.** 6,1 % es de esta muestra, no de Zaragoza.
- **Las 161 AMBIGUA.** Se cuentan y no se miran una a una.
- **Que `nombre-largo` no una dos calles reales** en algún caso como `cruz`/`santa cruz`. Se declara
  el riesgo, se acota con B2 y con la geometría, **no se descarta**.

## LOS ROJOS QUE QUEDAN VIVOS

| script | qué declara |
|---|---|
| `asignar-bici.js` | tanda 19 · el desplazamiento no se hunde en aristas |
| `modelo.js` | tanda 19 · la familia de choque `corridor` no predicha |
| `modelo-rutas.js` | tanda 19 · San Juan de la Peña sin asignación propia |
| `donde-falta.js` | tanda 20 · mis dos predicciones de B2 fallaron |
| `nombrar-aceras.js` | tanda 17 · el barajado local se hundió ×2,58 y el invariante pedía ×3 |

⛔ **Ninguno se ha arreglado**, y el de `nombrar-aceras.js` **sigue vivo aunque el método ya se
aplique**: es la contraprueba de la tanda 17 con su umbral declarado, y aplicar el método no la
cambia. ⚠️ **Eso hay que decirlo en voz alta: el método que hoy nombra 2.912 aristas arrastra una
contraprueba que no pasó su propio listón**, y el listón no se ha movido (bitácora nº93).

---

## LO QUE ESTA TANDA DEJA DECIDIDO Y LO QUE NO

**Decidido y aplicado:** el método de portales está en el motor de nombres, marcado; el nombre largo
reconoce variantes; el itinerario se agrupa por vía; la clasificación del carril salió del texto; el
aviso de bicis se queda y está medido.

**Sin decidir, y son de Antonio:**
1. **¿12 pasos es lo cómodo para la ruta 7?** Si sobran, el umbral a 20 m la deja igual pero baja las
   otras (82 → 76 en total).
2. Los cuatro rojos vivos.
3. **`cruz` / `santa cruz`**: la regla los une. Si eso molesta, la alternativa **no** es una lista de
   títulos — sería medir la distancia entre las nubes de portales de las dos vías.
