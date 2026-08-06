# H1 · LA ACERA EQUIVOCADA

*Tanda 32 · 2026-08-06 · Antonio pidió la ruta 1 sobre el mapa y vio que arrancaba en la acera de
enfrente y mucho antes. ⛔ Esta tanda audita y mide. No arregla nada.*

> **Este documento se AÑADE, no reescribe nada.** No cambia ningún número publicado: los 21
> congelados salen intactos.

```
node src/acera-equivocada.js      # todo lo de aquí  (A · B · C · D · E)
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐⭐ Antonio tiene razón, y el mecanismo NO es el que parecía** | Pedir **Avenida Cataluña 78** devuelve el portal **77**. Y **el 78 no existe en el callejero**: el geocodificador cae al número más cercano **sin mirar la paridad**. |
| **⭐⭐ el desplazamiento, medido** | El par más próximo en número —el **74**— está a **258 m** del 77 que te da. Ahí están los «~200 m» que Antonio estimó a ojo. |
| **⛔⛔ y no es el enganche** | El portal 77 engancha **a 1,82 m** de una acera que OSM llama «Avenida de Cataluña». El enganche es correcto. **Lo que falla es a QUÉ PORTAL te manda el buscador.** |
| **⭐ los tres testigos, ciegos — confirmado** | `codigoVia` concuerda · la nube concuerda · la calle pegada es la misma avenida. **Los tres miran la CALLE, y las dos aceras son la misma calle.** |
| **⚠️ el que SÍ avisó** | El geocodificador: *«el número 78 no existe; el más cercano es el 77»*. ⭐⭐ **Pero «cercano» ahí es EN NÚMERO, y se lee como EN LA CALLE.** El aviso dice la verdad de una cosa y el lector entiende otra. |
| **⭐⭐ enganche a la acera contraria: 76 portales** | 0,8 % de los 10.055 decidibles. **Línea base con paridades barajadas: 12,1 % (×15).** El método separa; el número es pequeño de verdad. |
| **⚠️⚠️ el desplazamiento por hueco de numeración: 12.610 casos urbanos** | Mediana **51 m**, p90 **252 m**, máx **3.459 m**. **6.380 (50,6 %) desplazan más de 50 m.** |
| **⭐⭐⭐ las dianas de Antonio** | Cataluña **166 m** de desfase mediano entre hilos, Madrid **574 m** — cazadas. ⛔ Pero **por enganche NO**: en las dos, **cero aristas de acera llevan las dos paridades**. |
| **⭐⭐ las siete rutas** | **3 de los 10 extremos con portal cambian de paridad.** La ruta 1 daría **−254,8 m (−8,3 %)**. ✅ **La nº7 —la que calibra los ~6 km/h— tiene sus dos extremos EXACTOS.** |
| **⛔ lo que sale mal (mío)** | nº128 (escribí la prueba de aceptación sobre mi hipótesis y declaró falso que el instrumento no valía), nº129 (publiqué una mediana con carreteras dentro y doce filas de la misma autovía), nº130 (cero vías urbanas: comparaba palabras contra códigos de dos letras). |

---

## A · ⭐⭐ EL CASO CONCRETO — Avenida Cataluña 78

```
   lo que se pide                        Avenida Cataluña 78
   ⭐⭐ lo que devuelve el geocodificador  el portal nº77   (estado: numero-aproximado)
      y lo dice                          ✅ «el número 78 no existe en el callejero;
                                             el más cercano es el 77»
   ⛔ ¿cambia de PARIDAD?                 ⛔ SÍ — 78 es par y el 77 es impar

   A1 · el enganche del portal que devuelve   arista 73171 a 1,82 m
        la arista                             way 1083203719 · footway · acera
                                              · «Avenida de Cataluña»
        ⭐ ¿está el 78 en el callejero?        ⛔ NO — por eso cae al 77
        ⭐⭐ el par más próximo (nº74)          a 258 m del nº77 que te da
        ⭐⭐ el siguiente (nº72)                a 271 m
```

⭐⭐⭐ **Las dos mitades de lo que Antonio vio, separadas:**

- *«lo marca en la acera contraria»* → **cierto, y lo hace el geocodificador**: el 77 es impar y el 78
  par. ⛔ No lo hace el enganche: el 77 está bien colgado, a 1,82 m de su acera.
- *«además está mucho antes»* → **cierto, y son 258 m**: la distancia entre el 77 y el par más próximo
  en número.

### A2 · Y el arranque de la ruta NO se desvía del portal que se usa

⛔ Aquí hay una trampa que conviene desactivar: **la ruta arranca en la proyección sobre la arista, no
en un nodo.** Se comprueba en `grafo.insertar()`, que mete el nodo temporal exactamente en `q`. ⇒ la
distancia del portal a su arranque **es la distancia de enganche**, y la mediana de todo el callejero
es **5,3 m**.

⇒ **El desplazamiento de 258 m no lo produce la geometría: lo produce haber elegido otro portal.**

### A3 · ⚠️ ¿Podía haberlo dicho alguno de los tres testigos? — **ninguno**

```
   testigo 1 · el `codigoVia` municipal      concuerda    ⛔ dice que está bien
   testigo 2 · el consenso de la nube        concuerda    ⛔ dice que está bien
   testigo 3 · la calle pegada               la avenida se llama igual por los dos lados
```

⭐ **La predicción del encargo se cumple.** Y el porqué es estructural, no un descuido: **los tres
miran la CALLE, y las dos aceras son la misma calle.**

⭐⭐ **El que sí avisó fue un cuarto que no estaba en la lista: el geocodificador.** Y su aviso es
técnicamente cierto y prácticamente engañoso — *«el más cercano es el 77»*, donde **cercano es en
número**. Ésa es la frase que hay que arreglar aunque no se toque nada más.

---

## B · ⭐⭐⭐ ¿CUÁNTOS PORTALES ESTÁN EN LA ACERA EQUIVOCADA?

### B1 · Los dos hilos, y lo que no encaja

```
   vías con DOS HILOS claros (≥5 de cada paridad)      965  (35,4 %)
   ⚠️ vías de UN SOLO LADO (toda una paridad)          793  (29,1 %)
   ⚠️ vías con pocos de alguna paridad                 969  (35,5 %)
   ⚠️ vías con algún número REPETIDO dentro de sí      539  (19,8 %)
```

⛔ Las tres últimas **no se fuerzan**: numeración correlativa en vez de par/impar, calles de un solo
lado, bloques que comparten número. **Van a NO DECIDIBLE, que es un resultado.**

### B2 · El veredicto sobre los 46.026 enganchados

```
   CORRECTO                        9979    21,7 %
   ⛔ LADO-CONTRARIO                 76     0,2 %
   NO-DECIDIBLE                   35971    78,2 %

   ⚠️ POR QUÉ NO SE PUEDE DECIDIR
      la-arista-es-un-EJE                   24879    54,1 %
      la-arista-no-tiene-paridad-dominante  11092    24,1 %

   ⭐ sobre los DECIDIBLES                    76 de 10055   0,8 %
```

⭐⭐ **El freno más importante, declarado antes de medir: un eje de calzada NO tiene lado.** En una
calle dibujada por su eje, los portales de las dos aceras cuelgan de la misma línea y **ninguno está
enfrente**: no hay dos aceras que elegir. Son el **54,1 %**. Contarlos habría inflado el número con
casos que no son el fallo.

#### ⭐⭐⭐ Y la línea base, que es lo que hace que un 0,8 % signifique algo

```
   el método, tal cual                76 de 10055     0,8 %
   ⛔ con las paridades BARAJADAS     597 de  4931    12,1 %      ⇒ ×15
```

Si el método estuviera ciego, barajar las paridades daría lo mismo. Da **quince veces más**. ⇒ **el
0,8 % es un número pequeño de verdad, no una medida que no ve.**

### B3 · ⭐ ¿Cuánto desvía el enganche? — casi nada, y el porqué

```
   distancia portal → arranque de su ruta   mediana    p90     máx
   todos los enganchados                        5,3   17,7   119,2
   ⛔ los del LADO CONTRARIO                     3,7   11,8    20,2
```

⇒ ⭐ **Estar enfrente NO desplaza a lo largo de la calle: obliga a cruzar.** El daño de este mecanismo
es real pero pequeño y local.

### B3b · ⭐⭐⭐ El desplazamiento de verdad — el número que no existe

```
   ⭐⭐ EL DENOMINADOR — sobre las 965 vías con dos hilos
   números que se pueden pedir                  150947
      …que EXISTEN en el callejero               27815  (18,4 %)
      …que son HUECO                            123132  (81,6 %)
   ⭐ …y de los huecos, los que te CAMBIAN DE ACERA
                                                 66973  (54,4 % de los huecos)

   huecos que cambian de paridad     cuántos  mediana    p90      máx
   TODOS                               66973      126    171    18633
   ⭐ solo vías URBANAS                 12610       51    252     3459
   ⚠️ el resto (caminos, carreteras…)   54363      171    171    18633

   ⛔ urbanos que desplazan más de 50 m    6380  (50,6 %)
   ⛔ …más de 200 m                        1758  (13,9 %)
```

⚠️⚠️ **La fila de arriba es mía, no del dato:** la primera versión publicó los 66.973 juntos, con
mediana 126 m y máximo 18.633 m, y las «doce peores» eran **la Autovía de Logroño doce veces**
(bitácora nº129). Una carretera numerada cada kilómetro **no tiene «la acera de enfrente»**.

**Las 12 vías urbanas con el peor salto** — una por vía, no doce de la misma:

```
   vía                              pides  te da  el suyo   metros   huecos así
   AVENIDA MOVERA ---MVR               53     60       77     3459    253
   AVENIDA MONTAÑANA                  944    943      942     1845    385
   AVENIDA ALCALDE GÓMEZ LAGUNA       122    151      160     1492     63
   CALLE BARI                          26     25       28     1074     30
   PASEO ECHEGARAY Y CABALLERO        221    250      115      860    121
   CALLE FRAY JULIÁN GARCÉS           105    108       53      843     44
   CALLE COMERCIO                      88     89       80      818     43
   AVENIDA DIAGONAL PLAZA              37     40       19      797     16
   CALLE MARÍA ZAMBRANO                13     14        5      785     31
   PASEO DE LA RIBERA                  33     40       51      785     23
   AVENIDA ZARAGOZA ---SJN            132    141       88      779     53
   CALLE MIGUEL SERVET                198    199      204      759    112
```

### B4 · ⚠️ Dónde se concentra — las 20 peores por desfase entre hilos

```
   vía                                   portales  mediana    p90      máx  enfrente
   CARRETERA COGULLADA                        102     3369   3441     3506      0
   CARRETERA AUTOVÍA DE LOGROÑO                26     1758   4417    18633      0
   DISEMINADO PEÑAFLOR                         10     1181   1466     1466      0
   CAMINO LA TORRE NUEVA ---GRP                28      626    688      731      0
   CAMINO PINSEQUE                            136      617   1523     2065      0
   AVENIDA ALCALDE FRANCISCO CABALLERO         38      591    718      744      0
   CAMINO TORRE PEIRADE                        38      580    672      710      0
   ⭐ AVENIDA MADRID                          147      574    649      691      0
   CARRETERA AEROPUERTO                        55      573    790     1230      0
   CALLE MATILDE SANGÜESA CASTAÑOSA            20      523    692      713      0
   AVENIDA ESTUDIANTES                         20      490    539      547      0
   PASEO ECHEGARAY Y CABALLERO                 44      449    671      860      0
   … (20 filas en la salida del script)
```

⭐ **La columna «enfrente» sale 0 en las veinte.** El desfase entre hilos y el enganche a la acera
contraria son **dos fenómenos distintos y no coinciden en las mismas calles.**

⭐⭐ **304 de 965 vías (31,5 %) tienen los dos hilos desfasados más de 50 m; 144 más de 100 m.**

---

## C · ⭐⭐⭐ LAS DIANAS — y el resultado no es el que se esperaba

```
   AVENIDA CATALUÑA   (a) enfrente: 0 de 66  ⛔ NO   (b) desfase mediano: 166 m  ✅ LA CAZA
     ⚠️ aristas de ACERA con las DOS paridades: 0 de 35 ⇒ el enganche NO PUEDE estar enfrente
   AVENIDA MADRID     (a) enfrente: 0 de 94  ⛔ NO   (b) desfase mediano: 574 m  ✅ LA CAZA
     ⚠️ aristas de ACERA con las DOS paridades: 0 de 48 ⇒ el enganche NO PUEDE estar enfrente
```

⭐⭐⭐ **Antonio dijo DOS cosas y no son la misma**, y ésta es la lección de la tanda:

- *«lo marca en la acera contraria»* → eso es §B2, y en estas dos avenidas **no ocurre**: cada acera
  lleva **solo** su paridad, y el enganche es correcto en los 66 y los 94.
- *«ni de coña coincide una acera con la de enfrente»* → eso es el **desfase**, y sale **166 m y
  574 m**. **Cazado, y clavado con lo que él describió.**

⚠️⚠️ **Yo escribí la prueba de aceptación sobre la primera** —mi explicación del mecanismo— y el
script declaró en rojo *«el instrumento no vale»*, **que era falso** (bitácora nº128). El instrumento
funcionaba; lo que fallaba era la hipótesis a la que lo había atado.

### C3 · Y el dato encuentra las demás

**304 vías** con desfase mediano > 50 m entre sus hilos. Antonio se acordaba de una; el dato las saca
solas.

---

## D · ⭐⭐ LAS SIETE RUTAS

```
    ruta  extremo                         estado             pides→da  paridad   el de SU paridad
       1  O Avenida Cataluña 78           numero-aproximado     78→77  ⛔ CAMBIA  nº74 a 258 m
       1  D Avenida Pablo Gargallo 16     numero-aproximado     16→15  ⛔ CAMBIA  nº36 a 114 m
       2  O Calle Manifestación 6         exacto                  6→6    ok
       2  D Calle Don Jaime I 17          exacto                17→17    ok
       3  O Cantando Bajo la Lluvia 6     numero-aproximado      6→10    ok
       3  D Hospital Clínico Lozano Blesa POI (edificio)
       4  O Centro Etopía                 POI (edificio)
       4  D Estación Delicias             POI (edificio)
       5  O Principado de Morea 14        exacto                14→14    ok
       5  D C.C. Utrillas                 POI (edificio)
       6  O Calle Francisco de Quevedo 1  exacto                  1→1    ok
       6  D Calle Matadero 1              numero-aproximado       1→2  ⛔ CAMBIA  nº3 a 10 m
       7  O Calle El Coloso 2             exacto                  2→2    ok
       7  D Calle Valle de Zuriza 48      exacto                48→48    ok

   ⛔ extremos que CAMBIAN DE PARIDAD    3 de 10 con portal   (4 son POI)
```

### D2 · Qué pasaría — ⛔ calculado, no aplicado

```
   ruta 1 · HOY (nº77 → nº15)                    3086,9 m   ⭐ publicado 3086,9
   ruta 1 · con la paridad pedida (nº74 → nº36)  2832,1 m   ⇒ −254,8 m  (−8,3 %)
   ruta 6 · HOY (nº1 → nº2)                       523,4 m   ⭐ publicado 523,4
   ruta 6 · con la paridad pedida (→ nº3)         520,2 m
   ⭐⭐ ¿el «hoy» reproduce lo publicado?          ✅ 3086,9 y 523,4 clavados
```

⭐ **Ese cuadre es lo que hace que la sección valga**: si el «hoy» calculado aquí no reprodujera lo
publicado, estaría midiendo otra cosa.

### ⭐⭐⭐ La ruta 7 está limpia

**Los dos extremos son `exacto`.** `Calle El Coloso 2` y `Calle Valle de Zuriza 48` existen los dos en
el callejero. ⇒ **la calibración de ~6 km/h de toda la tabla, medida contra los 2.600 m del GPS, no
está en cuestión.**

⚠️ La ruta 1 sí: **la que está en la tabla de Antonio como «Avenida Cataluña 78 → Pablo Gargallo 16»
está medida entre el 77 y el 15.** Y es la única de las siete sin banda declarada (`NO CONSTA`), así
que no había nada que pudiera cazarlo.

---

## E · ⭐ LA SOLUCIÓN — propuesta y medida. ⛔ NO APLICADA

**Son DOS reglas, porque son dos mecanismos.**

### E1a · El enganche al hilo de su paridad — ⚠️ y el número dice que NO

```
   (a) portales que se moverían de arista            17 de 76
       ⚠️ …y los que NO tienen arista de su paridad   59
       distancia a la arista de SU acera    mediana 84,9   p90 268,0   máx 307,0
```

⛔⛔ **La regla del encargo, medida, sale mal.** De los 76 enganchados enfrente, **59 no tienen
ninguna arista de su paridad en su vía** —no hay adónde moverlos— y los **17** que sí la tienen la
tienen a **84,9 m de mediana**, contra los 3,7 m de hoy. **Moverlos los alejaría veinte veces más.**

⇒ ⭐ **Mi recomendación: no aplicar E1a.** El enganche por proximidad está haciendo lo correcto en
casi todos los casos, y el remedio es peor. Lo que sí vale es **marcarlos**: 76 portales sobre los que
el motor podría decir *«ojo, este portal cuelga de la acera de enfrente»*.

### E1b · ⭐⭐ La paridad en el geocodificador — ésta sí

`direccion.resolver()` prefiere el número más cercano **de su misma paridad**; si no hay, cae al de
hoy **y lo dice**.

```
   huecos urbanos que hoy te cambian de acera        12610
   ⭐ …y de ellos, los que desplazan más de 50 m       6380
```

⭐ Es barata y **no toca el grafo ni el enganche**: es una línea en el geocodificador. Y arregla
exactamente el caso que Antonio vio.

⚠️ **Y lo que NO resuelve, dicho:** pedir el 78 te daría el 74 o el 84, que **siguen sin ser el 78**.
Lo honesto sería **interpolar sobre el hilo par** —el 78 va entre el 74 y el 84—, y eso es otra tanda.

⭐⭐ **Y lo más barato de todo, que se puede hacer hoy: cambiar la frase del aviso.** Hoy dice *«el más
cercano es el 77»*. Debería decir **de qué acera es y a cuánto está**: *«el 78 no existe; te llevo al
77, que es de la acera de enfrente y está a 258 m del 74»*.

### E3 · ⭐⭐ La salvaguarda que falta

*«Un portal cuyo enganche queda lejos de los vecinos de SU MISMA PARIDAD es sospechoso, aunque el
nombre cuadre.»*

```
   distancia del enganche al del vecino de su paridad   mediana 11   p90 35   máx 11166
   ⭐ listón (p99 de la propia distribución)             182 m
   ⭐⭐ portales que señalaría                            328  (0,7 %)
      …de los 76 del LADO CONTRARIO, cuántos señala también   2 de 76
```

⚠️ **Los dos testigos se solapan en 2 de 76, y eso NO es un fallo: miran cosas distintas.** §B2 caza
«cuelga de la acera de enfrente»; E3 caza «el enganche da un salto respecto a sus vecinos», que
incluye fondos de patio, torres retranqueadas y numeración desordenada. **Hacen falta los dos.**

⛔ **Y sobre el patrón de verdad que proponía el encargo** —*«las aceras que OSM sí nombra y que
tienen portales de una sola paridad»*— **lo rebato: es circular con §B2.** Mi método decide la paridad
de una arista contando sus portales; si el patrón de verdad se define como «aristas con portales de
una sola paridad», estaría comprobando el método consigo mismo. **E3 no es circular**: usa la
continuidad de la numeración, no la paridad dominante.

---

## LAS SIETE RUTAS Y LOS NÚMEROS CONGELADOS

**Idénticas al milímetro** (3086,9 · 598,1 · 3704,9 · 505,9 · 477,4 · 523,4 · 2528,9) y **74/74
pasos**. **Los 21 números congelados, intactos.** ⭐ Y tenían que estarlo: esta tanda no toca ni un
fichero de producción — el único cambio fuera del script nuevo es una línea en
`probar-modelo-obligatorio.js` para meterlo en el barrido del ciclo.

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que alguno de los tres testigos pudiera haber cazado el caso de Antonio** — **ninguno**, y está
  exigido en rojo: si alguno lo señalara, el diagnóstico de esta tanda estaría mal.
- **Que el enganche estuviera mal en las dianas de Antonio** — **no**: 0 de 66 y 0 de 94, y el motivo
  medido (cero aristas de acera con las dos paridades).
- **Que el método estuviera ciego** — **no**: la línea base barajada da ×15.
- **Que la ruta 7 tuviera un extremo aproximado** — **no**: los dos exactos. La calibración está a
  salvo.
- **Que la regla del hilo mejorara el enganche** — ⛔ **no**: 59 de 76 no tienen adónde ir y los 17
  restantes quedarían a 84,9 m.

## LO QUE NO SE HA COMPROBADO

- **Si el portal está físicamente en la acera que dice el callejero.** Todo esto compara el enganche
  contra **la paridad de sus vecinos**, que es un testigo del dato, no del terreno. Para saber la
  verdad hay que mirar la calle. **NO CONSTA.**
- **Cuántas de las 46.026 direcciones se piden de verdad.** El 44,4 % de «lo pedible» cae en un hueco
  que cambia de acera, pero **no sabemos qué pide la gente**: puede que casi siempre pidan números que
  existen. Sin esa distribución, el daño real **NO CONSTA**.
- **Los 35.971 NO DECIDIBLES.** El 54,1 % son ejes de calzada, donde la pregunta no aplica; del
  24,1 % restante —aristas sin paridad dominante— no se sabe.
- **Si mover el geocodificador a la paridad correcta mejora o empeora.** Se mide cuánto cambia, no si
  el resultado es mejor: **eso necesita un patrón de verdad que no existe.**

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **La paridad en el geocodificador** (E1b) | ⭐ medido, decide Antonio |
| 2 | **La frase del aviso** —«el más cercano» es en número | ⭐ lo más barato, sin tocar |
| 3 | **Interpolar sobre el hilo** en vez de saltar al vecino | propuesto, no medido |
| 4 | **Marcar los 76 del lado contrario** en vez de moverlos | ⛔ mover sale peor: medido |
| 5 | **La ruta 1 de la tabla** está medida entre el 77 y el 15 | ⚠️ decide Antonio |
| 6 | **La contradicción P4.1 ↔ adenda §A1** (`codigoVia` manda / por proximidad) | sigue sin reconciliar |
| 7 | **El nombre prestado** (tanda 31) · **365 `cycleway`** · **escaleras** · **parques** | ⛔ pendientes |
