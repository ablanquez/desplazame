# H1 · LA CALLE QUE VA PEGADA

*Tanda 25 · 2026-08-04 · idea de Antonio: «además del portal, ¿no puede comprobar que tiene otra
línea en paralelo a nada de distancia que tiene el nombre, y compararlo contra los portales?».*

> **Este documento se AÑADE, no reescribe nada.** Corrige dos cosas de informes anteriores y lo dice
> donde toca: el reparto azul/rojo de la tanda 22–24 (§E) y el grosor con que se pintó (§E4).

```
node src/calle-pegada.js          # todo lo de aquí  (A · B · C · D · E)
node src/exportar-nombre-simple.js && node src/probar-visor-nombre-simple.js
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ Antonio tenía razón, y está MEDIDO** | **Un portal con respaldo paralelo acierta el 99,4 %. Tres portales solos, el 86,9 %.** Dos fuentes coincidiendo no son tres votos de la misma. |
| **⭐⭐ y cuando los dos testigos coinciden, el acierto es del 100 %** | 802 casos del patrón de verdad, sin un solo fallo. |
| **⭐ el segundo testigo solo, contra el patrón de verdad** | **93,4 % cuando opina**, con un 39,5 % de cobertura, contra un **23,2 %** del azar entre las vías cercanas. |
| **⚠️⚠️ y el umbral de distancia NO es lo que decide** | La calle propia está a **5,61 m** de mediana y **la ajena a 6,85 m**: las dos distribuciones se solapan. Lo que decide es **ir pegada en TODOS los puntos**, que es exactamente el «por varios puntos» de Antonio. |
| **⭐ los dos testigos son independientes, medido** | De los **198 portales que sabemos mal enganchados**, la paralela opina en 67 y **en 0 repite su error**. |
| **⭐⭐ el mapa** | **45.597 → 56.864 azules** · **53.177 → 41.910 rojas**. 11.330 líneas ganan nombre (187,73 km) y **511 puertas ganan calle**. |
| **⭐ Salvador Minguijón** | Sus **17 aceras** pasan de **7 con nombre a 17**. Y el nombre que se imprime es el de OSM —«Calle Salvador Minguijón»—, no el municipal en mayúsculas. |
| **⛔ lo que sale mal (mío)** | Bitácora nº108: **el segundo testigo le quitó el nombre a 176 líneas que lo tenían**, y yo publiqué el número con la causa equivocada al lado. Y nº109: volví a escribir `module.exports` al final en el fichero que cierra el ciclo. |

---

## LA IDEA, Y POR QUÉ ES MEJOR QUE LA MÍA

Yo venía proponiendo **heredar el nombre de la línea vecina**, y eso es peligroso: una acera puede
estar entre dos calles, o pegada a la equivocada, y heredar sería **OSM contra OSM**.

⭐⭐ La versión de Antonio no hereda: **cruza DOS TESTIGOS INDEPENDIENTES.**

```
   testigo 1 · los PORTALES que dan a la línea      →  `codigoVia` del AYUNTAMIENTO
   testigo 2 · la CALLE PEGADA a lo largo           →  `name` de OSM

   los dos dicen lo mismo  → se nombra
   discrepan               → ⛔ NO se nombra
```

Y eso resuelve el problema del umbral de tres portales —el que dejaba rojas las aceras de Salvador
Minguijón, que tienen uno o dos cada una— **sin bajar el listón a ciegas**: se baja *solo* cuando hay
una segunda fuente confirmando. §C2 lo mide y sale mejor que el listón alto.

---

## A · CUÁNTO SEPARAN DE VERDAD — medido antes de poner ningún umbral

⛔ El umbral no se pone a ojo. Se miden las **dos** distribuciones que tendría que separar, sobre las
**3.179 aceras de OSM que SÍ llevan nombre** (`footway=sidewalk` con `name`).

⚠️ Y el estadístico no es la media, porque la regla exige que la calle esté al lado **en todos los
puntos**: de A1 manda **el PEOR de los cinco puntos**; de A2, el mejor —una calle ajena que se acerca
en un punto ya es capaz de ganar ahí—.

### A1 · la acera y SU calle (el peor de los 5 puntos) · n = 3.161

```
   p10 1,96 m   mediana 5,61 m   p75 7,96 m   ⭐ p90 10,79 m   p95 13,61 m   máx 45,20 m
   ⚠️ aceras con nombre descartadas (su calle no está a ≤60 m en algún punto)    18
```

### A2 · la calle con OTRO nombre (el mejor de los 5 puntos) · n = 3.128

```
   p01 0,12 m   p05 0,32 m   p10 1,08 m   mediana 6,85 m   p90 18,75 m   máx 59,24 m
   sin ninguna otra calle a ≤60 m                                              33
```

### ⚠️⚠️ LAS DOS SE SOLAPAN, Y ESO HAY QUE DECIRLO ANTES QUE NADA

```
   aceras donde la propia gana a la ajena por distancia    1818 de 3161   (57,5 %)
```

**La calle propia está a 5,61 m de mediana y la ajena a 6,85 m.** ⇒ ⛔ **un umbral de distancia no
distingue una cosa de la otra.** En el **42,5 %** de las aceras hay una calle ajena más cerca —en
algún punto— que la suya en su peor punto. En las calles estrechas el método **no puede** decidir por
distancia.

⭐ **Y no lo hace.** Lo que decide es ir pegada **en todos los puntos**, que es literalmente lo que
dijo Antonio: *«si por VARIOS puntos se llevan 2-3 metros»*. El radio es un **control de cobertura**,
no un discriminador.

### A3 · el umbral, y de dónde sale

```
   regla escrita ANTES de ejecutar:  ceil(p90 de A1)      11 m
   ⭐ RADIO declarado en el módulo                         11 m   ✅ cuadra
```

⭐ Y el informe **vuelve a derivarlo y lo exige** cada vez que corre: si el dato cambia, esto se pone
en rojo solo. Mecanismo, no disciplina (ley 37).

---

## B · EL MÉTODO, ESCRITO ANTES DE EJECUTARLO

`src/calle-pegada.js`. Tres mandos, los tres declarados:

- **PUNTOS · cinco, y ninguno en los extremos** (10 · 30 · 50 · 70 · 90 % de la longitud). ⭐ Los
  extremos son **nodos de cruce**: muestrear en la punta elegiría sistemáticamente la transversal.
  ⭐ El muestreo va por longitud acumulada, así que **no depende del orden** de las aristas del way.
- **RADIO · 11 m**, derivado en §A1.
- **ACUERDO · unanimidad.** ⛔ Y la regla no es «la más cercana en cada punto» sino **«la vía está
  dentro del radio en TODOS los puntos, y es la ÚNICA que lo está»**, por dos motivos:
  1. §A2 acaba de enseñar que la distancia no ordena bien;
  2. ⭐ en una esquina o un chaflán hay **dos** calles paralelas, y eso **tiene que salir AMBIGUO**.

⚠️ **La regla se cambió después de §A y antes de medir ninguna cobertura ni ningún acierto**, y la
variante descartada se publica con sus números más abajo. Se dice porque cambiar una regla después de
ver un resultado es lo que este proyecto tiene prohibido; cambiarla después de medir la *entrada*, y
publicando la descartada, es otra cosa — pero la frontera es fina y por eso va escrita.

### Tres resultados, no dos

```
   resultado        ways      metros
   PEGADA           7573   295,43 km
   AMBIGUA          5875    34,22 km      ⭐ las esquinas
   SUELTA          17367  3675,18 km
```

⭐ **La costura del encargo:** *«si no sale ninguna AMBIGUA, sospecha — las esquinas existen»*. Salen
**5.875**, y el guardián se pone en rojo si algún día salen cero.

### La variante descartada, con sus números

```
   «la más cercana en cada punto»    PEGADA 11293 (270,59 km) · AMBIGUA 7807 · SUELTA 11715
   ⚠️ y su acierto contra el patrón de verdad: 90,1 % opinando sobre 5.490
   ⭐ la regla aplicada:                        93,4 % opinando sobre 6.695
```

⇒ **la aplicada gana en las dos cosas a la vez**, acierto y cobertura. No es un intercambio.

### Curvas de sensibilidad

```
   radio          PEGADA   AMBIGUA    SUELTA          puntos    PEGADA   AMBIGUA    SUELTA
      6 m           7303      2322     21190             3        7713      6005     17097
      8 m           7774      3921     19120          ⭐ 5        7573      5875     17367
   ⭐ 11 m           7573      5875     17367             9        7546      5871     17398
      15 m          7341      7583     15891
      20 m          7371      9020     14424
```

⭐ **Ni el radio ni el número de puntos mandan mucho**: entre 3 y 9 puntos hay 167 ways de diferencia
sobre 47.758. **El que manda es exigir la unanimidad.**

---

## D · CONTRA EL PATRÓN DE VERDAD

### La garantía de que no se contesta sola

`decidir()` recibe **la geometría** del way y el índice de líneas con nombre, y **el way evaluado se
excluye de los candidatos**. Su nombre no entra por ningún parámetro: no se puede leer lo que no
llega. ⭐ Y encima un **cepo** sobre el lector de nombres, **al que se le ve el rojo primero**:

```
   ⭐ el cepo salta cuando se le provoca (su ROJO, visto)   ✅ sí
   evaluación completa con el cepo puesto                  ✅ no leyó ni una vez el nombre tapado
```

### D1 · Los tres cubos

```
   cubo                             ways        %
   ACIERTA                          6250   36,9 %
   FALLA                             445    2,6 %
   NO OPINA · ambigua               2173   12,8 %
   NO OPINA · suelta                8075   47,7 %

   ⭐⭐ ACIERTO CUANDO OPINA        6250 de 6695   (93,4 %)
      COBERTURA                                     39,5 %
```

### D2 · La línea base

```
   vías distintas a menos de 100 m (media)                 6,1
   ⭐ ACIERTO DEL AZAR entre las vías cercanas   3794 de 16328   (23,2 %)
```

Sin esta línea, un 93,4 % no se sabe si es alto o si es lo que sale solo.

### D3 · ⚠️⚠️ El sesgo, y el confusor buscado

**El sesgo, declarado:** una acera **con** nombre está en una calle que alguien se molestó en mapear
bien. ⇒ **el 93,4 % es un TECHO, no una estimación.**

**El confusor propio de §D:** ¿y si acertara porque el vecino es la **continuación** del propio way,
otro trozo de la misma calle pegado por la punta? Se separa:

```
   el vecino que gana…                    ways   acierto
   …TOCA al way evaluado                  3182    89,2 %
   ⭐ …NO lo toca en ningún nodo           3513    97,1 %
```

⭐ **El caso limpio acierta MÁS, no menos.** El método no vive de las continuaciones; los que tocan
son en buena parte calles que **cruzan**, y ahí es donde falla.

### D4 · De qué depende — y la predicción que se cumplió

```
   longitud del way           ways    opina  cobertura   acierto
   1 · < 25 m                 4483     2038     45,5 %    89,2 %
   2 · 25–50 m                2850     1265     44,4 %    85,8 %
   3 · 50–100 m               3680     1511     41,1 %    97,5 %
   4 · 100–250 m              3723     1392     37,4 %    99,7 %
   5 · ≥ 250 m                2207      489     22,2 %    99,4 %
```

⭐ **Esto estaba escrito en el módulo antes de medirlo:** *«en una línea CORTA los cinco puntos caen
casi encima: el test es más flojo ahí»*. Y sale: **85,8 % en las de 25–50 m contra 99,7 % en las de
100–250 m.** Las líneas cortas son donde el «en varios puntos» no puede hacer su trabajo, porque los
cinco puntos son casi el mismo punto.

Diez fallos, sin elegirlos:

```
    27 m   VERDAD serrano sanz               MÉTODO fernando catolico
    28 m   VERDAD tomas breton               MÉTODO fernando catolico
    51 m   VERDAD madrid                     MÉTODO hispanidad
    17 m   VERDAD hispanidad                 MÉTODO rotonda ciudad toulouse
    14 m   VERDAD martina bescos garcia      MÉTODO san juan bosco
    18 m   VERDAD luis bermejo               MÉTODO isabel catolica
    36 m   VERDAD constitucion               MÉTODO mina
    55 m   VERDAD maestro estremiana         MÉTODO cuellar
    18 m   VERDAD san antonio abad           MÉTODO rioja
    27 m   VERDAD poeta rosalia castro       MÉTODO gertrudis gomez avellaneda
```

**Todos cortos.** Son trocitos de esquina que van pegados a la transversal tanto como a la suya.

---

## C · LOS DOS TESTIGOS, CRUZADOS

### C1 · El cruce donde se aplica (las líneas SIN nombre)

```
   concuerdan          518
   discrepan            29
   solo el portal      652
   solo la paralela   7026
   ninguno           22590

   ⭐⭐ CUANDO OPINAN LOS DOS, ¿CONCUERDAN?     518 de 547   (94,7 %)
```

⇒ **Ése es el número que dice si la idea es fiable**, y dice que sí: dos fuentes distintas —el
callejero municipal y el `name` de OSM— coinciden **19 de cada 20**. ⛔ Y las 29 que discrepan **no se
nombran**.

### ⚠️ Pero «discrepan» no es una sola cosa (ley 29)

```
   ⛔ no tienen nada que ver                      21   72,4 %
   comparten alguna palabra larga                 6   20,7 %
   las MISMAS palabras en otro orden              2    6,9 %

   · «jorge coci»                contra  «jorge cocci»
   · «herrerin jaime ballesteros» contra «jaime ballesteros herrerin»
   ⭐ CONTROL · el mismo test sobre 20.000 parejas de vías AL AZAR:   68   (0,3 %)
```

**8 de las 29 son la misma calle escrita de otra manera** — una errata y un cambio de orden—, y el
control dice que eso no sale por casualidad. ⛔ **No se toca el normalizador ni el reconocedor para
absorberlas**: sería un emparejador aproximado, y eso ya falló en el 29,6 % del dataset heredado. Se
mide, se dice cuánto pesa, y la línea se queda sin nombre. **Cabo abierto.**

### C2 · ⭐⭐ El acierto de cada celda — lo que FIJA la regla

Sobre el patrón de verdad, con el nombre tapado:

```
   celda                                                 ways   acierto   ¿se aplica?
   PARALELA SOLA · ningún portal                         5090    91,7 %   SÍ
   SOLO PORTALES · ≥3 votos, lo de la tanda 21           2264    86,9 %   SÍ (ya estaba)
   CONCUERDAN · ≥3 portales + paralela                    802   100,0 %   ⭐ SÍ
   ⭐ PARALELA + 1-2 portales que CONFIRMAN                677    99,4 %   ⭐ SÍ
   ⛔ PARALELA con la mayoría de portales EN CONTRA         87    86,2 %   ⛔ NO
```

⭐⭐ **La fila que da la razón a Antonio:** *«UN portal + una calle paralela que se llama igual es más
fiable que TRES portales solos»* → **99,4 % contra 86,9 %.** No es una opinión: es el patrón de
verdad.

⭐⭐ **Y la de arriba del todo, la que sorprende:** cuando los dos testigos coinciden, **802 de 802**.
Ni un fallo.

**La regla aplicada, escrita antes:**

```
   1 · los dos opinan y COINCIDEN                        → se nombra (basta 1 portal)
   2 · los dos opinan y DISCREPAN                        → ⛔ NO se nombra
   3 · solo la paralela, y la MAYORÍA de portales dice otra cosa  → ⛔ NO se nombra
   4 · solo la paralela, sin portales que la contradigan → se nombra
   5 · solo los portales (≥3, 2/3)                       → se nombra, COMO HASTA HOY
```

⭐ Y cuando los dos coinciden, **el nombre que se imprime es el de OSM**: D0 manda. De paso el texto
sale con mayúsculas y minúsculas **sin que nadie las invente**, porque se elige entre dos cadenas
reales.

### ⚠️ Y cuando discrepan, ¿quién miente?

```
   n = 39   ·   tiene razón EL PORTAL   6      tiene razón LA PARALELA   32      ninguno   1
```

**Miente más el portal.** Pero en 1 de las 39 se equivocan los dos, y 39 casos no son una muestra
para cambiar una regla. ⇒ **una discrepancia no se resuelve eligiendo: se calla.**

### C3 · ⭐⭐⭐ EL CONFUSOR — ¿concuerdan porque aciertan o porque beben de lo mismo?

Los portales enganchan **por proximidad**, y la proximidad es justo lo que mide la paralela. Si un
portal está mal enganchado, ¿arrastra también a la paralela? Se cogen los que **sabemos** mal
enganchados —los 198 con firma y los 23 imputables de la tanda 14—, con su positivo de control:

```
   ⭐ positivo de control · con firma 198 (la tanda 14 publicó 198) · imputables 23 (publicó 23)  ✅

   los 198 con firma     la paralela opina 67     ⛔ repite el error 0     ⭐ dice otra cosa 67
   los 23 imputables     la paralela opina  2     ⛔ repite el error 0     ⭐ dice otra cosa  2
```

⭐⭐ **CERO.** Y el cero tiene su positivo al lado: la paralela **sí opina ahí** (67 veces), así que no
es el cero de un buscador roto.

⚠️ **Lo que esto NO dice:** que sean independientes ante *cualquier* fallo. Dice que lo son ante los
fallos de enganche **que sabemos detectar**. Un modo de fallo que moviera a la vez los portales y la
geometría de OSM no lo vería nadie desde aquí.

---

## E · APLICADO — qué gana el grafo

⛔ El «antes» no se lee de un fichero viejo: se monta el modelo **con y sin** el segundo testigo en el
mismo proceso y se comparan. Un número copiado no es un testigo (es la ley de la tanda 24).

```
   LÍNEAS CON NOMBRE — lo que dice EL REDACTOR de cada arista
   antes de la tanda 25                       45597   (2893,10 km)
   ⭐ ahora                                    56864   (3076,92 km)
   ROJAS · sin nombre — antes / ahora         53177 / 41910
   ⭐ ganan nombre                             11330   (187,73 km)
   ⚠️ lo PIERDEN — los dos testigos discrepan     63   (3,92 km)

   portales colgando de una línea SIN nombre  3162 → 2651
   ⭐ puertas que ganan calle                   511
```

⚠️ **El «antes» no es el 45.593 de la tanda 24**: son **45.597**, cuatro más, porque el arreglo de
`resolverPorWay` (bitácora nº108) también mejora la línea base. Se dice para que los dos números se
puedan comparar sin sorpresa.

### De qué son las 11.330 que ganan nombre

```
   highway                                    precisión (D4)
   footway            9263   135,82 km        paso-de-peatones   3786    18,36 km
   service             775    15,68 km        acera              3388    89,33 km
   cycleway            365     6,91 km        peatonal           2303    31,93 km
   steps               191     1,16 km        eje-de-calzada     1654    46,73 km
   residential         169     3,03 km        escaleras           190     1,16 km
   path                 95     1,67 km        eje-con-acera-decl.   9     0,23 km
   …y track (campo)     31     0,54 km
```

⭐ **El 82 % son `footway`: aceras.** Es exactamente el caso que Antonio señaló, y **no** se ha ido a
llenar de nombres el campo: solo 31 `track`, medio kilómetro.

⚠️ **Y 365 `cycleway`, que es el cabo nº2 abierto desde la tanda 17.** El texto que sale es *«Por lo
que parece Ronda Hispanidad»*, *«Por lo que parece Avenida de la Expo 2008»*. **No es falso** —esa
línea va físicamente pegada a esa avenida y el `◦` avisa de que solo se tiene el eje—, pero tampoco
dice que sea un carril bici. Va declarado, no resuelto.

### E3 · ⭐⭐ SALVADOR MINGUIJÓN — la calle con la que Antonio destapó la tanda 24

```
   el EJE · ways con nombre en OSM · aristas      3 · 29     ⭐ azules desde siempre
   las ACERAS que reciben portales de esa calle       17
   ⭐ …con nombre ANTES / AHORA                     7 / 17
```

Y la ruta, en la terminal:

```
   ANTES   1. ◦ Por Calle Salvador Minguijón      450 m   · 4 tramos de OSM
           …y las aceras como «un tramo sin nombre»
   AHORA   1. ◦ Por Calle Salvador Minguijón      503 m   · 12 tramos de OSM
```

**Un solo paso.** Y con el nombre de OSM, no con el municipal en mayúsculas.

### E4 · ⚠️ EL GROSOR TAMBIÉN ERA UNA AFIRMACIÓN

En la tanda 22 pinté el rojo a `weight 2,2 / opacity 0,9` y el azul a `1,4 / 0,55` —*«que canten»*—.
**Eso hizo que Calle Salvador Minguijón se leyera ROJA teniendo su eje entero AZUL**: doce aceras
rojas gruesas tapan un eje azul fino y translúcido. El dato estaba bien; **el dibujo decía algo que
nadie había medido**.

⇒ **Los dos se pintan igual**: `weight 1,8 / opacity 0,75`. Si una categoría se ve más, que sea
porque hay más.

### E5 · La ruta nº7, con el texto nuevo

```
    1. ◦ Por Calle de El Coloso (eje de calzada)                 28 m
    2. ◦ Por la acera de AVENIDA ACADEMIA GENERAL MILITAR       509 m   · 2 tramos de OSM
    3. ◦ Por Avenida de San Juan de la Peña (eje de calzada)  1,53 km   · 11 tramos de OSM
    4. ◦ Por Calle Oliván Bayle                                 126 m   · 5 tramos de OSM
    5. ◦ Por Calle Matilde Sangüesa Castañosa                    15 m
    6. ◦ Por un tramo sin nombre (eje de calzada)                 9 m
    7.   Por un tramo sin nombre (calle peatonal)                52 m
    8.   Por la zona peatonal de CALLE AZUCARERA                 84 m   · 3 tramos de OSM
    9.   Por un tramo sin nombre (calle peatonal)                34 m
   10. ◦ Por Calle Caminos del Norte                             31 m
   11. ◦ Por Calle del Valle de Zuriza                          107 m   · 2 tramos de OSM
        TOTAL                                                 2,53 km
```

⭐ **Las siete rutas, idénticas al milímetro** (3086,9 · 598,1 · 3704,9 · 505,9 · 477,4 · 523,4 ·
2528,9) y contra lo publicado en la tanda 16. El único rojo vivo del guardián es el declarado de la
tanda 19 (San Juan de la Peña sobre lo que pisa la ruta).

### E6 · Y el aviso dice AHORA cuál testigo habló

⛔ Decir *«lo deduzco de los portales»* cuando el nombre sale de la calle pegada sería contar una
procedencia falsa — y la procedencia es justo lo que ese aviso existe para contar.

```
   portales          «…lo deduzco de los portales que dan a esta línea»
   portales+pegada   «…lo deducen a la vez los portales de esta línea y la calle que va pegada»
   pegada            «…lo deduzco de la calle con nombre que va pegada a esta línea»
```

---

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que el método leyera el nombre que se le tapaba** (el espejo del nº92) — **no**: garantía
  estructural más un cepo al que se le vio el rojo primero, y 0 lecturas en 16.943 evaluaciones.
- **Que los dos testigos bebieran de lo mismo** (§C3) — **no**: 0 de 198 y 0 de 23.
- **Que no saliera ninguna AMBIGUA** (la costura del encargo) — **salen 5.875**.
- **Que el acierto viniera de las continuaciones del propio way** — **no**: el caso limpio acierta
  más (97,1 % contra 89,2 %).
- **Que el umbral mandara mucho** — **no**: entre 6 y 20 m la cobertura casi no se mueve. Lo que
  manda es la unanimidad.

## LO QUE NO SE HA COMPROBADO

- **Que ninguno de los 11.330 nombres sea correcto sobre el terreno.** Nadie ha ido a mirar. Todo se
  mide contra OSM y contra el callejero, las dos fuentes que ya se usaban.
- **El fallo correlacionado**: si un modo de fallo moviera a la vez los portales y la geometría de
  OSM, este trabajo no lo vería.
- **Que el sesgo de §D3 sea solo el declarado.** Se declara el techo; no se acota reponderando, como
  sí hizo la tanda 17 §C3.
- **Que el texto de las 365 `cycleway` no moleste.** Es una decisión de producto y la tiene Antonio.

## LOS DIEZ EJES

| eje | ¿tocado? |
|---|---|
| posición | ⭐⭐ sí — es la pregunta entera: a qué distancia va la línea de al lado |
| vecindad | ⭐⭐ sí — el «en todos los puntos» es una condición de vecindad sostenida |
| dirección | ⭐ **implícita, y es el hallazgo**: si la distancia se mantiene a lo largo, van paralelas. No hace falta medir ángulos |
| identidad | ⭐⭐ sí — de qué calle es esta línea |
| correspondencia | ⭐⭐ sí — es el cruce entero (§C) |
| umbral/cola | ⭐ sí — §A entera, y la curva de §B |
| escala | ⭐ sí — el acierto por banda de longitud (§D4) |
| densidad | ⚠️ **no** — no se ha mirado por zona, como sí hizo la tanda 17 |
| agregación | ⭐⭐ sí — y ahí estaba el fallo nº108 (`resolverPorWay`) |
| semántica | ⭐ sí — el reparto por `highway` y por D4 de lo que gana nombre (§E) |

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **8 de 29 discrepancias son la misma calle escrita distinto** (`jorge coci`/`jorge cocci`) | medido con su control (0,3 %); ⛔ **no** tocado: sería un emparejador aproximado |
| 2 | **365 `cycleway` ganan el nombre de la avenida paralela** — el cabo nº2 de la tanda 17 | declarado, no resuelto: decide Antonio |
| 3 | **El método no opina en el 60,5 %** — sobre todo líneas sueltas en el campo y el polígono | es el límite de la idea, no un fallo |
| 4 | **Las líneas de menos de 50 m aciertan 8 puntos menos** | medido y declarado; se podría exigir longitud mínima, pero sería un umbral más |
| 5 | **`exportar-nombres.js` y `donde-falta.js` (tanda 20)** siguen contando por arista y sin deducciones | igual que en la tanda 24: cambiarlos reescribiría una medición publicada. Decide Antonio |
