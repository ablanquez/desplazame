# H1 · VÍA · FORMA · PAPEL — el modelo de datos

*Tanda 19 · 2026-08-04 · a partir de Antonio: «una acera que comparte carril bici es una acera en el
contexto de caminar y es un carril bici en el contexto de ir en bici».*

> ⛔⛔ **El grafo peatonal no se ha tocado.** Ni el planarizado, ni el enganche, ni la
> transitabilidad, ni D0–D5, ni los costes. El modelo se aplica **al lado** y hay un hash del grafo
> que lo comprueba. Las siete rutas dan lo mismo al decimal.

> **Este documento se AÑADE, no reescribe nada.**

```
node src/asignar-bici.js     # B · la asignación y sus contrapruebas
node src/modelo.js           # C · el modelo aplicado a las 98.774 aristas
node src/modelo-rutas.js     # D · las siete rutas y el texto antes/después
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ Las siete rutas, idénticas** | Metros y lista de aristas **iguales al decimal** entre las dos ejecuciones y contra lo publicado en la tanda 16. El texto de las rutas **1 a 5 es byte a byte el mismo**; cambian la 6 y la 7, que es lo aprobado. |
| **⭐⭐ El caso de Antonio, hecho dato** | La ruta 7 ahora dice **«Por el carril bici de AVENIDA ACADEMIA GENERAL MILITAR»** y **«Por el carril bici de AVENIDA SAN JUAN DE LA PEÑA»** donde antes decía «un tramo sin nombre». |
| **⭐ B5 sale a nivel de arista** | Academia General Militar = **`carril-sobre-acera`**; San Juan de la Peña = **`carril-en-calzada`**. Exactamente lo que Antonio anduvo. |
| **⛔ B5 NO sale sobre lo que se anda** | Los 760 m de San Juan de la Peña que pisa la ruta **no tienen asignación propia**: el way la tiene **en el trozo de al lado**, y el texto hereda. `modelo-rutas.js` en rojo. |
| **⚠️⚠️ La contraprueba de desplazamiento falla en una unidad** | Metros ×3,5 ✅, **aristas ×1,8 ⛔**. Causa localizada: el paso 1 de mi regla asigna sin comprobar compatibilidad. **No se ha tocado.** Bitácora nº95. |
| **⭐ El invariante encontró cosas de verdad** | `living_street` (1.343 aristas) y un `steps`+`sidewalk` chocan con D4; y una tercera familia **que no predije** (`corridor`, 22 aristas). |
| **⚠️ Desviación del álgebra de A5** | 3.557 aristas con `ciclista` (A5 decía 6.075) y 1.510 ganan vía (A5 decía 2.632). **Es un hallazgo, no un ajuste**: A5 se calculó con la regla ingenua de la tanda 18. |

---

## A · EL DISEÑO (aprobado antes de implementar)

### A1 · `forma` son DOS campos

`forma = { plataforma, ciclista }`. Meterlos en un solo enumerado multiplicaría valores y volvería a
esconder que la línea es dos cosas.

**`plataforma`** — de qué está hecha la línea. Sale **solo de OSM**, con su propio orden de reglas,
de lo más específico físicamente a lo más genérico. **Nueve valores y ningún cajón de «otros»**: el
último, `calzada`, es una regla real (la misma que hoy es el caso por defecto de D4).

**`ciclista`** — qué infraestructura ciclista lleva encima. Sale **solo del municipal**: `null` ·
`carril-en-calzada` · `carril-sobre-acera` · `senda-ciclable` · `calle-calmada` · `en-obras` ·
`no-municipal`.

### A2 · La vía, con la procedencia pegada

`via = { nombre, codigoVia, fuente, declarada }`, por orden: **`osm`** → **`municipal-bici`** →
⛔ `portales` (el método de la tanda 17, **que sigue sin aplicarse**).
⭐ **D0 se respeta**: si OSM tiene nombre, manda OSM; el código municipal viaja al lado y la
discordancia **se cuenta, no se corrige**.

### A3 · El papel se deduce, no se guarda

`papel(forma, modo)` es una función pura. ⛔⛔ **Y no decide quién pasa**: la transitabilidad la sigue
decidiendo `transitableAPie()`, sin tocar.

⚠️ **Contradicción declarada y no resuelta:** el papel a pie de un carril segregado dirá *«esto es
para bicis»* y el motor seguirá mandando ahí al peatón, porque `cycleway` está en la lista positiva
con el comentario `// compartidas` **y Antonio confirmó a pie que ahí se anda**. Resolverla movería
rutas. Se queda declarada.

### A4 · D4 no se toca

`precision` es **epistémica** (*¿con qué precisión sé por dónde se anda?*), `plataforma` es **física**
(*¿qué es esta línea?*). Conviven, con un **invariante ejecutable** que las compara contra una tabla
de precisiones admisibles.
⛔ Y derivar la precisión hoy exigiría tocar `planarizar.js`, que está prohibido.

---

## B · LA ASIGNACIÓN — y las contrapruebas van delante

### B1–B2 · La regla, escrita antes de ejecutarla

Se muestrea la línea municipal cada 10 m. Candidatos: ways con un segmento a **≤15 m** y rumbo a
**≤30°** (los mismos números de la tanda 18).

1. **un solo way** → ASIGNADA · `univoca`
2. varios → filtro por `tipo_carri` (si dice «acera», solo plataformas de andar; si «calzada», las
   de rodar). Si queda uno → ASIGNADA · `tipo`
3. siguen varios, pero el más cercano está **≥5 m** más cerca → ASIGNADA · `margen`
4. siguen varios y empatados → ⛔ **AMBIGUA. No se asigna.**
5. el filtro deja cero → ⛔ **sin plataforma compatible. No se asigna.**

⚠️ El margen de 5 m es mío, con su porqué (un carril sobre acera está a menos de media acera de su
eje; la acera de enfrente está al otro lado de una calzada de 7–12 m) y **con su curva publicada**.

### B4a · ⚠️⚠️ La contraprueba de desplazamiento — falla en una unidad

```
   unidad                                            REAL       DESPLAZADA 2 km    razón
   metros municipales asignados        212.43 km (63.7 %)     60.55 km (18.1 %)     ×3.5
   ⭐ ARISTAS del grafo asignadas                     3557                  1930     ×1.8
   ⛔ FALLO · las aristas asignadas no se hunden al desplazar
```

⭐ **Se mide en las dos unidades por la bitácora nº94**, donde esta misma contraprueba funcionaba
perfectamente sobre la geometría equivocada. Y el rojo sale justo en la unidad del resultado.

**Abierto (post-hoc, sin tocar la regla):**

```
   desplazamiento              metros asignados   aristas   razón aristas
   2 km este                  60.55 km (18.1 %)      1930            ×1.8
   2 km oeste                 63.14 km (18.9 %)      2007            ×1.8
   2 km norte                 58.78 km (17.6 %)      1853            ×1.9
   2 km sur                   64.55 km (19.3 %)      2089            ×1.7
   5 km este                  36.84 km (11.0 %)      1096            ×3.2
```

```
   metros municipales por arista asignada         mediana       p90
   REAL                                              24 m     134 m
   DESPLAZADA 2 km                                   20 m      67 m
```

⇒ ⭐ **El número de aristas asignadas no es una medida discriminante; los metros sí.** El
desplazamiento produce muchas aristas con migajas encima. Y eso **obliga a leer los contadores de C
con cuidado**.

**La causa, localizada:** de los puntos que la capa desplazada consigue asignar, **5.180 entran por
`univoca`** — y el paso 1 de mi regla asigna sin comprobar la compatibilidad. **Bitácora nº95.**

**La alternativa, medida y NO aplicada:**

```
   regla                              metros   aristas   desplazada: metros  aristas  razón
   DECLARADA (la que se aplica)    212.43 km      3557             60.55 km     1930   ×1.8
   ⭐ estricta (NO se aplica)       207.30 km      3472             34.14 km     1095   ×3.2
```

⭐ En el dato REAL las dos reglas dan casi lo mismo: **85 aristas de diferencia (2,4 %)** y el acierto
contra OSM sube del 69,0 % al 70,5 %. **El agujero solo se abre donde no hay señal.** Decide Antonio.

### B4b · Identidad — las tres verdes, con el álgebra escrita antes

| experimento | esperado | resultado |
|---|---|---|
| duplicar cada línea municipal | IDÉNTICO | ✅ idéntico |
| partir cada línea en dos | IDÉNTICO | ✅ idéntico |
| ⭐ intercambiar `acera` ↔ `calzada` | **TIENE que cambiar** | ✅ cambian **1.919 de 3.557 (53,9 %)** |

⇒ El tercero es el que demuestra que el `tipo_carri` **está desempatando de verdad** y el paso 2 no
es decorativo.

### B4c · Patrón de verdad — la regla dura aplicada al caso fácil

Los puntos que a 15 m tienen **una sola** candidata se reevalúan a **30 m**, donde aparecen más. La
regla completa tiene que recuperar el mismo way. ⚠️ Y solo cuentan los que **de verdad** se
complicaron: si al abrir el radio no apareciera ningún candidato nuevo, la prueba sería vacía y
saldría 100 %.

```
   puntos unívocos a 15 m (la verdad, fijada por la geometría)  7987
   ⭐ …que a 30 m pasan a tener VARIAS candidatas               3365  (42.1 %)
   de ésos · ACIERTA el mismo way                              2756  (81.9 %)
   de ésos · FALLA                                               85  ( 2.5 %)
   de ésos · no opina (ambigua o sin compatible)                524  (15.6 %)
   ⭐⭐ ACIERTO CUANDO OPINA                              2756 de 2841  (97.0 %)
```

### B3 · Tres resultados, no dos

```
   resultado                               metros        %    puntos        %
   ASIGNADA · unívoca                    70.73 km   21.2 %      7987   20.2 %
   ASIGNADA · desempatada por tipo       61.24 km   18.3 %      7040   17.8 %
   ASIGNADA · desempatada por margen     80.46 km   24.1 %      8971   22.7 %
   ⛔ AMBIGUA · no se asigna             115.18 km   34.5 %     14408   36.5 %
   ⛔ sin plataforma compatible            4.58 km    1.4 %       723    1.8 %
   ⛔ sin ninguna candidata a 15 m         1.53 km    0.5 %       370    0.9 %
   ⭐ ASIGNADAS en total                 212.43 km  (63.7 %)   ·   3.557 aristas
```

⭐ **El 34,5 % de los metros queda AMBIGUO y no se asigna.** La costura pedía sospechar si no salía
ninguna ambigua: salen 115 km. ⛔ Elegir entre dos aceras equidistantes sería inventar.

**La curva del margen**, que es mi mando:

```
   margen           asignadas (m)    ambiguas (m)   aristas
   0.5 m                322.39 km         5.23 km      5730
   2 m                  302.50 km        25.12 km      5314
   5 m                  212.43 km       115.18 km      3557   ⭐
   10 m                 151.09 km       176.52 km      2254
   ∞ (sin margen)       131.97 km       195.65 km      1871
```

### B5 · ⭐⭐ El tramo de la ruta 7 — el único sitio con verdad sobre el terreno

**A nivel de arista, sobre el way entero, sale exactamente lo que Antonio anduvo:**

| way | metros | ciclista | vía |
|---|---:|---|---|
| 354344721 | 533 m | **`carril-sobre-acera`** | AVENIDA ACADEMIA GENERAL MILITAR |
| 475881583 | 794 m | **`carril-en-calzada`** | AVENIDA SAN JUAN DE LA PEÑA |

> *«En San Juan de la Peña no está a la misma cota. En Avenida de la Academia General Militar sí.»*

⛔⛔ **PERO sobre las 16 aristas que PISA la ruta, no:**

```
   ciclista · vía · tipo literal del municipal                       aristas    metros
   (sin ciclista)  ·  SIN VÍA  ·  —                                       12     766 m
   carril-sobre-acera  ·  AVENIDA ACADEMIA GENERAL MILITAR  ·  Bidir.      4     421 m
```

```
      way 475881583
         aristas del way · las que pisa la ruta          35 · 11
         aristas del way CON asignación municipal        16  (809 m)
         ⭐ …de las que pisa la ruta                       0  (0 m)
         ⚠️ ¿solapan los dos trozos?     ⛔ NO: son trozos DISJUNTOS del mismo way
```

⇒ **El way tiene 794 m asignados a San Juan de la Peña y no son los 760 m que Antonio anduvo: son el
trozo de al lado.** El texto los nombra porque la resolución a way (2/3 de los metros con vía)
extiende el nombre al way entero.

⚠️ **No es un error de emparejamiento**: ahí la asignación sale **AMBIGUA** —el carril y la calzada de
la misma avenida son dos candidatas compatibles y cercanas— y la regla hace lo correcto: no asignar.
Lo que se discute es si el **texto** puede heredar del way. ⛔ Se deja como está y se mide cuánto
pesa. **Bitácora nº96.**

### B6 · Las aceras con bici que OSM no declara

```
   aristas de andar con `carril-sobre-acera` encima      17  (915 m)
      ways de OSM implicados                             17
      …de ellos, con `bicycle=*` en OSM                   3  (17.6 %)
```

⭐ **Sí las recoge.** ⚠️ Y salen menos que en la tanda 18 (1,30 km, 59 ways) por un motivo sano: allí
se cogía la candidata más cercana siempre; aquí el 34,5 % queda ambiguo y no se asigna.

---

## C · EL MODELO APLICADO

### C3 · ⭐⭐ El grafo peatonal no cambia

```
   nodos · aristas · componentes · a pie            68649 · 98774 · 170 · 94570
   hash del grafo ANTES                             9bcfc71704e48f42d6242f6025431ff1
   hash del grafo DESPUÉS                           9bcfc71704e48f42d6242f6025431ff1   ✅ idéntico
```

⚠️ **Eso pasa por construcción y hay que decirlo**: `aplicar()` no escribe en `g`. Su valor es
**futuro** — el día que alguien meta un `e.forma = …` en un bucle, esto lo caza. ⭐ Y para que pruebe
algo hoy, **se le enseña su rojo**: un grafo con una arista movida **1 mm** da otro hash. ✅

### INV · ⭐⭐ El invariante `plataforma` ↔ `precision`

⛔ **No se esperaba cero**, y estaba predicho en `src/forma.js` **antes** de ejecutar: choques en
`living_street` y en `steps`+`crossing`, y en ninguna otra familia. **Cero choques habría significado
que copié el orden de `precision()` y que el invariante no vale nada** (ley 35).

```
   aristas con choque                                       1366  (1.4 %)

   familia del choque                                            aristas      metros
   calzada ⇄ peatonal   (highway=living_street)                     1343    63.64 km
   plataforma-peatonal ⇄ eje-de-calzada   (highway=corridor)          22       950 m
   escaleras ⇄ acera   (highway=steps footway=sidewalk)                1         6 m
```

- **`living_street` (1.343 aristas, 63,6 km)** — D4 lo mete con los peatonales, como si supiéramos
  por dónde va el peatón. **Físicamente es una calzada** donde el coche va despacio. **Predicho.**
- **`steps`+`sidewalk` (1 arista, 6 m)** — el way 1314200369: `footway=sidewalk` + `highway=steps` +
  `step_count=6`. Un tramo de acera que son seis peldaños. **De la familia predicha** (steps), aunque
  yo dije «steps+crossing» y salió «steps+sidewalk».
- ⛔ **`corridor` (22 aristas, 950 m) — NO PREDICHA, y es un hallazgo.** Un `highway=corridor` es un
  pasillo dentro de un edificio: se anda por todo él. D4 le da `eje-de-calzada`, es decir *«no sé por
  dónde se anda»*. **Se reporta hacia arriba y no se corrige.**

⇒ El invariante se queda **en rojo** por esa tercera familia. Es exactamente para lo que servía.

### Los dos casos borde que pidió Antonio

```
   aristas `highway=cycleway`                                 4675
      …con precisión `eje-con-acera-declarada` (las 4 del borde)  4
      ⭐ ¿siguen coherentes?   ✅ sí — `carril-bici` admite las dos precisiones

   aristas `footway=sidewalk`                                16858
      …con plataforma `acera`                                16857
      …con precisión `acera`                                 16858   ✅ todas
```

⭐ **Lo que protege el texto es la precisión, y está intacta: 16.858 de 16.858.** La excepción es de
mi lectura física (la escalera de arriba), no de D4.

### C2 · Los contadores

```
   plataforma                  aristas      metros        %
   calzada                       29431  2075.71 km   31.9 %
   plataforma-peatonal           17128   500.84 km    7.7 %
   acera                         16857   525.76 km    8.1 %
   paso-de-peatones              10494    46.55 km    0.7 %
   vial-de-servicio               8810   395.70 km    6.1 %
   pista                          7488  2359.24 km   36.3 %
   carril-bici                    4675   191.47 km    2.9 %
   camino                         3081   396.37 km    6.1 %
   escaleras                       810     8.34 km    0.1 %
   ⭐ suma  98.774 de 98.774 · sin cajón «otros»
```

```
   ciclista                    aristas      metros   apoyo mediano
   carril-en-calzada              1011    47.35 km            14 m
   carril-sobre-acera              942    74.59 km            25 m
   calle-calmada                   891    43.52 km            26 m
   senda-ciclable                  703    84.43 km            48 m
   en-obras                          8       978 m            17 m
   no-municipal                      2       877 m            28 m
```

⚠️⚠️ **DESVIACIÓN DEL ÁLGEBRA DE A5, y es un hallazgo:** **3.557** aristas con `ciclista` frente a las
6.075 previstas. Los 6.075 salían de la regla **ingenua** de la tanda 18 —«la candidata más cercana,
siempre»—, que es justo lo que B se ha negado a hacer. Con tres resultados, el 34,5 % de los metros
queda ambiguo. **El número tenía que bajar.**

### El caso que motivó la tanda

```
   aristas con papel a pie Y papel en bici                    16882  (373.92 km)
      …el papel en bici sale de la PLATAFORMA                 13337  (124.07 km)  — ya pasaba antes
      ⭐ …el papel en bici lo trae el DATO MUNICIPAL            3545  (249.85 km)  — es lo nuevo
```

⭐⭐ **«Una acera que comparte carril bici» aparece de dos maneras, y la segunda es la gorda:**

| | aristas | metros |
|---|---:|---:|
| (a) OSM dibujó la **acera** y el municipal le pone carril encima | 313 | 19,26 km |
| (b) OSM dibujó el **carril** y el municipal dice que va **sobre la acera** | 886 | 68,91 km |

⇒ En **(b)** el motor ya mandaba ahí al peatón —`cycleway` está en la lista positiva «compartidas»—
**pero nadie sabía por qué**. Ahora el dato lo dice: va sobre la acera.

### La vía

```
   fuente del nombre           aristas      metros        %
   (sin vía)                     56844  3871.92 km   57.5 %
   osm                           40420  2508.88 km   40.9 %
   municipal-bici                 1510   119.18 km    1.5 %
```

⚠️ **1.510 ganan vía** frente a las 2.632 de A5 — misma causa que arriba.

**⭐⭐⭐ El termómetro que la regla no puede ver:** donde OSM SÍ tiene nombre, la asignación le pega un
`vias_codigo` igual. La regla **no mira** el nombre de OSM. ⇒ que coincidan o no es un patrón de
verdad independiente (ley 17):

```
   cómo se asignó                   aristas    coincide con OSM
   univoca                              279         96 (34.4 %)
   tipo                                 587        442 (75.3 %)
   margen                              1172        869 (74.1 %)
   ⭐ TOTAL                              2038       1407 (69.0 %)
```

⚠️ **No es «el acierto» a secas**: parte de las discordancias son el callejero y OSM llamando distinto
a la misma calle (la tanda 17 midió que eso era el 56,8 % de sus fallos). Es una **cota inferior**.
⭐ Y lo que sí dice sin ambigüedad: **`univoca` es el peor de los tres**, que es la segunda medida
independiente apuntando al agujero de la bitácora nº95.

---

## D · LAS SIETE RUTAS

### D1 · ⭐⭐⭐ Es la misma ruta

⚠️ **Puede pasar por construcción** —el modelo no entra en el cálculo— y por eso van tres
comprobaciones que **sí** pueden fallar:

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

**(3) El texto — la que de verdad arriesga**, porque `relato.js` sí se ha tocado:

```
    ruta           texto   qué pasa
       1        IDÉNTICO   ninguna vía municipal nueva
       2        IDÉNTICO   ninguna vía municipal nueva
       3        IDÉNTICO   ninguna vía municipal nueva
       4        IDÉNTICO   ninguna vía municipal nueva
       5        IDÉNTICO   ninguna vía municipal nueva
       6          CAMBIA   gana vía declarada por el Ayuntamiento
       7          CAMBIA   gana vía declarada por el Ayuntamiento
```

⭐ Y además, **fuera del script**: la salida de `rutas-antonio.js` **sin** `--modelo` se comparó con
`md5sum` contra una captura hecha **antes** de tocar `relato.js`. Única diferencia: la línea del
cronómetro (18,7 s → 19,4 s). ⚠️ Esa comparación **no es repetible desde el repositorio**: la captura
vivía en el scratchpad.

### D3 · La ruta 7 entera, con el texto nuevo

```
     Calle El Coloso 2  →  Calle Valle de Zuriza 48
     ──────────────────────────────────────────────
     2,53 km · unos 25 min · rodeo 1,06
     enganche: 8 m en el origen, 16 m en el destino

       1. ◦ Por Calle de El Coloso (eje de calzada)                 28 m
       2. ◦ Por el carril bici de AVENIDA ACADEMIA GENERAL MILITAR   509 m   · 2 tramos de OSM
       3. ◦ Por el carril bici de AVENIDA SAN JUAN DE LA PEÑA      760 m
       4. ◦ Por Calle de Juslibol (eje de calzada)                   4 m
       5. ◦ Por Avenida de San Juan de la Peña (eje de calzada)    753 m   · 6 tramos de OSM
       6. ◦ Por el carril bici de CALLE PEÑA OROEL                   6 m
       7. ◦ Por Avenida de San Juan de la Peña (eje de calzada)     11 m   · 2 tramos de OSM
       8. ◦ Por Calle Oliván Bayle (eje de calzada)                 98 m
       9. ◦ Por un tramo sin nombre (eje de calzada)                 6 m
      10. ◦ Por el carril bici de CALLE FRANCISCO OLIVÁN BAYLE       5 m
      11.   Por Calle Oliván Bayle (calle peatonal)                  5 m
      12. ◦ Por un tramo sin nombre (eje de calzada)                13 m
      13. ◦ Por Calle Matilde Sangüesa Castañosa (calzada con acera declarada)    15 m
      14. ◦ Por un tramo sin nombre (eje de calzada)                 9 m
      15.   Por un tramo sin nombre (calle peatonal)                52 m
      16.   Por la zona peatonal de CALLE AZUCARERA                 84 m   · 3 tramos de OSM
      17.   Por un tramo sin nombre (calle peatonal)                34 m
      18. ◦ Por Calle Caminos del Norte (calzada con acera declarada)    31 m
      19. ◦ Por Calle del Valle de Zuriza (calzada con acera declarada)   107 m   · 2 tramos de OSM
```

⚠️⚠️ **Dos defectos visibles a simple vista, y ninguno se ha arreglado:**

1. **El nombre municipal viene en MAYÚSCULAS** y el de OSM en minúsculas, así que la misma avenida
   aparece dos veces con dos grafías: *«AVENIDA SAN JUAN DE LA PEÑA»* (tramo 3) y *«Avenida de San
   Juan de la Peña»* (tramos 5 y 7). ⛔ Convertirla es una decisión de presentación y **poner
   mayúsculas y minúsculas a mano en un nombre propio español es inventarlo**.
2. **El texto dice «el carril bici de» en los dos casos** —tramos 2 y 3— y el municipal distingue que
   uno va **sobre la acera** y el otro **en la calzada**. El dato está en `ciclista`; el texto no lo
   cuenta. **Es justo la información que resolvió la discrepancia de la tanda 18.**

### D4 · Cuántos metros sin nombre quedan

```
    ruta    m sin nombre (OSM)    m que gana vía municipal        %
       1                   296                           0    0.0 %
       3                   695                           0    0.0 %
       4                   589                           0    0.0 %
       5                   382                           0    0.0 %
       6                   412                         221   53.6 %
       7                  1478                        1364   92.3 %
   TOTAL                  3851                        1585   41.2 %
```

⚠️⚠️ **Y su descuento**, porque la vía se resuelve por way:

```
    ruta     m nombrados   con asignación PROPIA   heredados del way
       6             221                       0                 221
       7            1364                     543                 821
   TOTAL            1585                     543                1042
```

⇒ ⭐ **El número conservador es 543 m (14,1 %), no 1.585 (41,2 %).** Ninguno de los dos está mal; hay
que decir cuál se cita.

**Comparación:**

| | metros nombrados | naturaleza |
|---|---:|---|
| sin nada | 0 de 3.851 | |
| método de portales (tanda 17) | 1.159 (30,1 %) | ⚠️ **deducidos** |
| este modelo · heredando del way | 1.585 (41,2 %) | ⭐ **declarados** |
| este modelo · solo asignación propia | 543 (14,1 %) | ⭐ **declarados**, conservador |

⛔ **Y no se suman**: el método de portales sigue sin aplicarse.

---

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que el modelo mutara el grafo** — no: hash idéntico, y al hash se le vio el rojo.
- **Que alguna de las siete rutas se moviera** — no: idénticas al decimal y contra la tanda 16.
- **Que el texto de las rutas 1 a 5 cambiara** — no: idéntico.
- **Que no saliera ninguna ambigua** (la costura) — salen **115 km, el 34,5 %**.
- **Que el `tipo_carri` no estuviera desempatando** — sí lo hace: intercambiarlo mueve el 53,9 %.
- **Que el patrón de verdad fuera vacío** — no: el 42,1 % de los unívocos se complica de verdad.
- **Un cajón «otros» que se comiera más del 10 %** — no existe ningún cajón.

## LO QUE NO SE HA COMPROBADO

- **Que ninguna asignación sea correcta sobre el terreno**, salvo el tramo de la ruta 7. El
  termómetro del 69 % es contra OSM, no contra la calle.
- **Que la salida sin `--modelo` sea idéntica a la de antes de tocar `relato.js` de forma
  repetible**: se comprobó con `md5sum` contra una captura del scratchpad, y esa captura no está en
  el repositorio.
- **El papel en bici no se ha usado para nada.** No hay red ciclable ni rutas en bici: eso es H2.
- **El invariante compara contra una tabla que escribí yo** (`ADMISIBLE`). Si la tabla fuera
  demasiado permisiva, habría choques que no se ven.
- **`en-obras` y `no-municipal`** (10 aristas) se guardan pero nadie ha mirado qué son.

## LOS DIEZ EJES

| eje | ¿tocado? |
|---|---|
| posición | ⭐ sí — la asignación por proximidad y su desplazamiento en cinco direcciones |
| vecindad | ⭐⭐ sí — cuántos ways compiten, que es el problema entero |
| dirección | ⭐ sí — el paralelismo ≤30° es condición de la regla |
| identidad | ⭐⭐ sí — duplicar, partir e intercambiar `tipo_carri` |
| correspondencia | ⭐⭐ sí — el termómetro contra el `name` de OSM |
| umbral/cola | ⭐ sí — la curva del margen y la del radio |
| escala | ⭐⭐ sí — arista contra way, y es de donde sale la bitácora nº96 |
| densidad | ⛔ **no** — no se ha mirado el reparto de la asignación por zona |
| agregación | ⭐⭐ sí — `resolverPorWay` y su descuento en D4 |
| semántica | ⭐⭐ sí — es la tanda entera: plataforma, ciclista y papel |
