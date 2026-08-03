# H1 · EL GRAFO DE LA CIUDAD ENTERA

**Fecha:** 2026-08-03 · **Sello del dato:** `2026-08-03T08:19:51Z` (calles) ·
`2026-08-03T10:37:31Z` (ríos) · `2026-08-03T10:49:51Z` (límite municipal)

Registro histórico. Se añade, no se reescribe.

> **Qué corrige de un documento anterior.** `docs/H1-PRIMER-GRAFO.md:43` publica
> *"ways 48.211, todos con tags y con geometría"*. Ese número es correcto como recuento del
> fichero, pero **incluye 398 ways que no están en Zaragoza**: la consulta pedía
> `area["name"="Zaragoza"]["admin_level"="8"]` y eso casó **cuatro municipios homónimos**
> —España, Costa Rica y Zaragoza de Puebla (México)—. El recuento del término es **47.813**.
> Aquel documento no se toca: es registro de lo que se supo el 3 de agosto por la mañana.
> Ver bitácora nº57.

---

## 0 · LO QUE HAY QUE MIRAR PRIMERO

| | |
|---|---|
| ⭐⭐⭐ **¿Parten los ríos el grafo?** | **NO.** 36 de 36 pares sorteados cruzan el Ebro, el Huerva y el Gállego. 28 de 32 puentes con nombre son cruzables a pie sin rodeo; **los 4 que no son autovías**, correctamente excluidas. |
| ⚠️⚠️ **`eje-de-calzada` se dispara fuera del centro** | 22,6 % en el casco → **47,2 %** en la ciudad, y **89,7 % en PLAZA**. Toca D4 y la promesa de nivel 2. **Costura disparada: hay que decidir.** |
| ⚠️⚠️ **3 barrios del término, incomunicados en el grafo** | Peñaflor de Gállego (294 nodos, 317 calles con nombre) y dos más. Causa medida: **la carretera que lleva a ellos pasa por otro municipio y no está en la descarga.** |
| ⛔ **13,8 km de calles que no existen, andables** | 178 aristas `highway=proposed`, **23 de ellas único paso**. En el casco había 0. **NO arreglado: cambiar el filtro rompería la comparación de esta tanda.** Lo decide Antonio. |
| ✅ **`unido-por-defecto` NO se dispara** | 0,84 → **1,15 por 1.000 aristas**. D1 aguanta. No hace falta revisarla por cuarta vez. |
| ⚠️ **320 pasos condicionales** | No las decenas que se suponían. Pero tampoco los 1.650 que salían antes de clasificar: 1.226 de aquéllos eran **accesos privados, que son otra cosa**. |
| ✅ **Las tres contrapruebas, en rojo** | Incluida la de borrar una unión que separa **196 nodos**, no una arista colgante. |

---

## 1 · A · LA DESCARGA Y EL PLANARIZADO

### A1 · El crudo, y las cuatro Zaragozas

**No hizo falta descargar las calles otra vez:** la petición de la tanda 8 ya era del término
completo (`area[...]`), y solo se había recortado al casco para planarizar. Sello
`2026-08-03T08:19:51Z`, instancia `overpass-api.de` (la principal, no una réplica).

Pero medido antes de usarlo, el bbox del fichero salió así:

```
bbox del dato  S 10.018188  O -98.272155  N 41.981504  E -0.65456
superficie del bbox  27.013.502 km²        ⛔ el término mide 973,8
```

Un término municipal de 27 millones de km², y con el alto **negativo**. Censo de cúmulos:

```
 45.766 ways   41.650, -0.890    Zaragoza (España)
  2.047 ways   41.686, -1.039    Zaragoza (España, mitad oeste)
    299 ways   10.042, -84.436   Zaragoza (Costa Rica)
     99 ways   19.320, -98.262   Zaragoza de Puebla (México)
```

⭐ **El fallo SUMA, no resta.** `area[...]->.a; way[highway](area.a)` devuelve la **unión** de las
cuatro áreas, así que ninguna calle de Zaragoza falta: sobran 398 de otro continente. Por eso la
descarga sigue sirviendo y no se repitió.

El crudo **no se toca** —es evidencia—. Se define `ZONA_TERMINO` como el bbox del cúmulo español y
se recorta con él, **imprimiendo el censo al lado** para que la exclusión sea declarada:

```
⇒ se recorta a ZONA_TERMINO   S 41.4011 O -1.2199 N 41.982 E -0.6541   (2.989 km²)
  ways que quedan   47.813   (excluidos 398 de otro continente)
  ⭐ ways partidos por el recorte   0  ✅ el corte es limpio
```

**Contención comprobada EN EJECUCIÓN** (ley 37): `src/ruta.js` lanza una excepción al cargarse si
`ZONA_TERMINO` no contiene `ZONA_CASCO` y `ZONA_TANDA3`. Su rojo se ha provocado:

```
verde: el guardián NO salta con el término real            OK
ROJO PROVOCADO: ZONA_TERMINO no contiene al casco…   ✅ el guardián corta
```

### A2 · Volumen de entrada

```
peso del fichero        35,7 MB
ways (geometría >=2)    48.211   ⭐ contador independiente sobre el texto: 48.211 ✅
ways tras el recorte    47.813
referencias a nodo     331.274   ·   nodos OSM distintos  252.981
ways sin tag highway         0
carga + parse             0,2 s
```

### A3 · El planarizado, con las MISMAS reglas

D1, D2, D4 y D5 **sin tocar ni un umbral**. Ni la tolerancia de 2,0 m, ni el techo de 5 m, ni el
salto de velocidad de 50.

```
[0,2 s ·  132 MB]  crudo cargado
[0,3 s ·  167 MB]  recortado y proyectado: 47.813 ways
[7,8 s · 1.172 MB] PLANARIZADO: 68.649 nodos, 98.774 aristas
[7,9 s]            componentes: 169   mayor 65.933
pico de memoria (rss)  871 MB
```

**No hizo falta trocear** —y por tanto no hay bordes internos artificiales—. Cabe en el heap por
defecto de Node (4.288 MB en esta máquina): los tres comandos de la tanda pasan sin
`--max-old-space-size`. **Comprobado, no supuesto.**

---

## 2 · B · LOS CONTADORES — CASCO (línea base) vs CIUDAD

```
                                           CASCO        CIUDAD
  superficie del bbox (km²)                 3,24          2.989   ×923
  ways de entrada                          3.838         47.813   ×12,5

  B1 · el grafo
  nodos                                    5.121         68.649   ×13,4
  aristas                                  7.175         98.774   ×13,8
  particiones (cortes de way)              3.345         51.079
  nodos OSM compartidos (D1·C1)            4.783         64.505
  tiempo de planarizado (s)                  1,4            6,5
```

**La diferencia explicada, no solo mostrada:** el grafo crece ×13,8 mientras la superficie crece
×923. No es contradictorio: el bbox del término es en su mayor parte **campo**. Las aristas por
ways de entrada son 1,87 en el casco y 2,07 en la ciudad — **prácticamente lo mismo**, que es lo que
tenía que pasar si el planarizado se comporta igual: parte cada way en el mismo número de trozos.

### B2 · ⭐ `unido-por-defecto` (D2) — ¿aguanta D1?

```
  casos                                        6           114   ×19,0
  por km² de bbox                          1,854         0,038
  por 1.000 aristas                         0,84          1,15
  por 1.000 ways de entrada                 1,56          2,38
```

⚠️ **"por km²" aquí no dice nada** y se publica solo para que se vea por qué: el bbox del término
es 923 veces mayor y casi todo campo, así que la densidad por superficie cae por el denominador, no
por el fenómeno. **La medida buena es por 1.000 aristas: 0,84 → 1,15.** Sube un 37 %, no se dispara.

**⇒ La costura NO se dispara. D1 no hay que revisarla por cuarta vez.**

⭐ **Clasificados por causa aparente ANTES de dar el número** (ley 29), porque en el casco 4 de 6
eran unas obras:

```
                              casco   ciudad
  servicio o pista                0       60
  peatonal × rodada               0       22
  peatonal × peatonal             2       12
  obras (highway=construction)    4       12
  RODADA × RODADA                 0        8
```

⭐ **Los 8 `RODADA × RODADA` son la clase que en el casco valía 0, y mirarlos destapó el hallazgo
más grave de la tanda:** siete de los ocho son `highway=proposed` — calles proyectadas. Ver §5.

### B3 · No unidos por evidencia — ¿cambia el reparto?

```
                        casco             ciudad
  layer-distinto     38 (77,6 %)     1.334 (87,5 %)
  bridge              5 (10,2 %)        59 ( 3,9 %)
  tunnel              0 ( 0,0 %)        17 ( 1,1 %)
  unido-por-defecto   6 (12,2 %)       114 ( 7,5 %)
  cortes geométricos totales   49         1.524
```

**Sí cambia, y en la dirección esperable:** `layer` sube del 77,6 % al 87,5 % y `bridge` baja del
10,2 % al 3,9 %. En el casco los desniveles son los puentes del Ebro, que están etiquetados como
puentes; en la ciudad dominan los **enlaces de autovía y las rotondas a distinto nivel**, que se
etiquetan con `layer`. ⭐ Y aparecen **17 túneles**, que en el casco eran 0.

### B4 · ⭐ Puntas (D5) — ¿se queda corta la tolerancia de 2,0 m?

```
  soldadas (<=2,0 m)                          22           121
  2-5 m SIN soldar                            51           488

  reparto de las 2-5 m en la ciudad:
     2,0-2,5: 71   2,5-3,0: 103   3,0-3,5: 80   3,5-4,0: 79   4,0-4,5: 82   4,5-5,0: 73
  ⇒ ¿pico justo por encima de 2,0 m?   71 de 488 (15 %)
```

**No hay pico.** Si el reparto fuera uniforme se esperaría el 17 %; hay un 15 %, o sea **menos**.
Si D5 estuviera cortando por la mitad un grupo real de puntas "casi tocándose", el primer cajón
sería el más gordo — y es de los pequeños. **D5 no se queda corta: no hay nada esperando justo
detrás del umbral.**

### B5 · ⭐⭐ Reparto de precisión (D4) — ⚠️⚠️ COSTURA DISPARADA

```
                              casco        ciudad
  eje-de-calzada             22,6 %        47,2 %    46.665 aristas
  peatonal                   30,6 %        21,8 %    21.530
  acera                      25,3 %        17,1 %    16.858
  paso-de-peatones           14,7 %        10,6 %    10.494
  eje-con-acera-declarada     5,3 %         2,4 %     2.418
  escaleras                   1,6 %         0,8 %       809
```

**El `eje-de-calzada` se duplica.** Casi la mitad de la ciudad es "sé que hay calle, no sé por dónde
se anda ni por dónde se cruza". Y no está repartido: ver §4 (eje densidad).

⚠️ **Esto toca D4 y su promesa.** Con el 22,6 % del casco, marcar en rojo lo impreciso era señalar
una minoría. Con el 47,2 %, **la advertencia se convierte en el estado normal de media ciudad**, y
una advertencia que sale siempre deja de leerse. **Lo apunto y paro: la decisión de invertir el
criterio —destacar lo bueno en vez de advertir lo malo— no es mía.**

### B6 · ⭐ Pasos condicionales — clasificados antes de contar

```
  PASO CONDICIONAL · tunnel=building_passage     27         96
  PASO CONDICIONAL · covered=yes                 27        179
  PASO CONDICIONAL · indoor=yes                  15         52
  PASO CONDICIONAL · highway=corridor             2         17
  PASO CONDICIONAL · con opening_hours            0          4
  ─────────────────────────────────────────────────────────────
  ACCESO RESTRINGIDO · access=private            29      1.108
  ACCESO RESTRINGIDO · access=customers          18        109
  ACCESO RESTRINGIDO · foot=private/customers     0         15

  ⇒ PASOS CONDICIONALES (ways distintos)   320 de 47.813  (0,67 %)
  ⇒ accesos restringidos (otra cosa)     1.226
  ⭐ positivo de control (highway=footway)  21.738  ✅
  ⭐ control negativo (tag inventado)            0  ✅ no inventa positivos
```

⚠️ **Sumarlo todo daba 1.650 y una decisión equivocada.** Un paso condicional es un sitio por el que
**se puede** andar pero no siempre; un `access=private` es un sitio por el que **no se anda**. Son
cosas distintas y el número honesto es **320**.

**⚠️ Aun así, 320 no son "decenas".** La decisión de ignorarlos se tomó suponiendo que eran raros.
Son el 0,67 % de los ways y **96 son pasajes bajo edificio**. Lo reporto: no es una emergencia, pero
la premisa de "son raros" no se sostiene tal cual.

### B7 · El eje ESCALA

```
                                  casco        ciudad
  aristas de menos de   5 m      34,0 %        20,6 %
  aristas de menos de  10 m      51,4 %        35,8 %
  aristas de menos de  25 m      69,5 %        55,8 %
  aristas de menos de 100 m      95,5 %        86,0 %
  mediana (m)                       9,4          19,2
  arista más larga (m)            1.751        11.631
```

**Ya no es "la mitad por debajo de 10 m": es un tercio.** La mediana se dobla. Es coherente: el
casco es todo aceras y pasos de peatones troceados cada pocos metros; la ciudad incluye carreteras
y caminos que pasan kilómetros sin cruzarse con nada. La arista de **11.631 m** es una `tertiary`
sin nombre con 288 vértices al sur del término (41,428 · −0,884): 11 km de carretera de estepa sin
un solo cruce. **No es un fallo, es la estepa.**

---

## 3 · C · LA VERIFICACIÓN

### C1 · ⭐⭐⭐ LOS RÍOS

⭐ **Los puntos no se eligen a dedo** (ley 26): se sortean con **semilla 20260803** entre los nodos
urbanos ribereños (≥25 vecinos en 150 m, a ≤1.500 m del río), y **la pertenencia a un margen se
decide contando cortes con la geometría real del río** —descargada aparte, con bbox y no con
nombre, precisamente para no repetir el fallo de los homónimos—. Un número impar de cortes = orillas
opuestas. No hace falta inventarse un eje ni orientar nada.

⭐ **Positivo de control del detector, antes de cualquier cero:**

```
Pilar → Arrabal (orillas OPUESTAS)   1 corte   ✅ impar
Pilar → San Miguel (MISMA orilla)    0 cortes  ✅ par
```

```
RÍO EBRO      24.056 nodos ribereños   ⇒ 12 de 12 pares con camino  ✅  rodeos 1,08 – 1,43
RÍO HUERVA    26.923 nodos ribereños   ⇒ 12 de 12 pares con camino  ✅  rodeos 1,12 – 1,34
RÍO GÁLLEGO    5.564 nodos ribereños   ⇒ 12 de 12 pares con camino  ✅  rodeos 1,14 – 1,34
```

**⇒ NINGUNA ORILLA QUEDA INCOMUNICADA.** La costura de mayor impacto del proyecto no se dispara.

**C1b · Cada puente con nombre, uno a uno.** 32 puentes distintos (nombre × río) sobre los tres
ríos, sacados **del dato** y no de mi memoria:

```
⇒ puentes cruzables a pie sin rodeo   28 de 32
  los que no, y por qué:
    ✅ prohibido a pie por D4, el rodeo es CORRECTO: Autovía Mudéjar | Gállego      rodeo 24,4
    ✅ prohibido a pie por D4, el rodeo es CORRECTO: Autovía del Nordeste | Ebro    rodeo  3,6
    ✅ prohibido a pie por D4, el rodeo es CORRECTO: Autovía del Nordeste | Gállego rodeo  7,8
    ✅ prohibido a pie por D4, el rodeo es CORRECTO: Cuarto Cinturón | Ebro         rodeo 21,7
  ⇒ rodeos SIN explicar   0  ✅ todos son autovías
```

Puente de Piedra 1,00 · Puente de Santiago 1,00 · Puente del Pilar 1,19 · Tercer Milenio 1,00 ·
La Almozara 1,00 · La Unión 1,00 · Giménez Abad 1,28 · Pasarela del Voluntariado 1,04 ·
Puente peatonal del Río Gállego 1,00.

### C2 · ⭐ COMPONENTES CONEXAS — clasificadas antes de contarlas

```
componentes            169
la mayor            65.933 nodos  (96,04 % del grafo)
las demás suman      2.716 nodos
nodos aislados       1.773   (existen en el terreno, no participan de la red a pie)
```

⭐ **DOS EJES, no uno.** Un solo eje mezclaba *qué es* con *por qué está suelto* y la segunda se
comía a la primera: clasificó a Peñaflor entero —294 nodos, 317 calles con nombre— como "artefacto
del límite". Ver bitácora nº60.

**QUÉ SON:**
```
  79  islote de geometría (<200 m)
  48  pistas y caminos sin nombre
  29  tejido de OTRO municipio que asoma al término
   9  unas pocas calles con nombre
   3  ⚠️ TEJIDO URBANO DEL TÉRMINO
```

**POR QUÉ ESTÁN SUELTAS:**
```
  73  hueco de mapeado (5-50 m del continente)
  32  el límite municipal corta el dato (<300 m del borde)
  30  aislada de verdad, lejos del continente y del borde
  23  está FUERA del término (cola de un way que se sale)
   6  menos de la mitad cae dentro: es de otro municipio
   4  toca casi el continente (<5 m): defecto de mapeado
```

El "borde" **no es el rectángulo**: es el límite municipal (rel `345740`, INE `50297`, 3.130
segmentos), descargado y comprobado con 8 controles en los dos sentidos —cuatro puntos fuera **por
construcción** y calles sacadas **del propio crudo por su nombre**, ninguno de mi memoria.

#### ⚠️⚠️ LAS 3 COMPONENTES DE TEJIDO URBANO DEL TÉRMINO — hay que avisar

```
comp  40 ·  294 nodos ·  19.112 m · 317 calles con nombre
       Calle Entrada | Calle de Abril | Calle de Febrero
       41.76682,-0.88154      dentro del término: 100 %
       causa: el límite municipal corta el dato

comp  69 ·   16 nodos ·   2.235 m ·  10 calles con nombre
       Avenida Zaragoza | Calle Mayor | Calle Escuelas
       41.74134,-1.07744      dentro del término: 94 %
       causa: el límite municipal corta el dato

comp  19 ·   25 nodos ·   2.028 m ·  20 calles con nombre
       Avenida de la Muralla de Santa Fe | Calle Monasterio | Calle Pastriz
       41.57802,-0.95339      dentro del término: 100 %
       causa: el límite municipal corta el dato
```

**Las tres son barrios rurales del término al que se llega cruzando otro municipio.** La causa está
medida y es la descarga, no el planarizado. **Pero que la causa esté explicada no hace que se pueda
llegar:** hoy el motor diría "no hay camino" a cualquiera que vaya a Peñaflor. **Se reporta hacia
arriba: la decisión de ampliar la descarga más allá del término es de Antonio.**

Las 20 mayores están listadas una a una en la salida de `node src/verificar-ciudad.js`.

### C3 · ⭐⭐ LAS TRES CONTRAPRUEBAS

**[1] Borrar una unión que junta dos partes grandes.**
⚠️ **No al azar entre articulaciones**: 4.606 de 6.176 son colgantes y la prueba pasaría por
construcción (ley 35). Se calcula, en el mismo recorrido de Tarjan, **cuántos nodos quedan a cada
lado**, y se elige el caso más exigente.

```
aristas de articulación   6.176   ·   colgantes 4.606   ·   que parten >=100 nodos: 5
⇒ elegida: lado menor 196 nodos
  arista 8329 · way 40762875 · residential · 12,4 m · Avenida de la Constitución · 41,72047 −1,02527
  componentes   antes: 169     después: 170
  mayor         antes: 65.933  después: 65.737   (pierde 196 nodos)
  ⇒ ✅ ROJO
```

**[2] Forzar un cruce falso.**
```
unido-por-defecto  114 → 125     ⇒ ✅ ROJO: D2 lo caza y lo cuenta
⭐ control complementario, el mismo cruce con bridge+layer=1:
no-conectados     1.410 → 1.412  ⇒ ✅ D1 lo separa por evidencia positiva
```

**[3] Mover el dato 2 km.**
```
nodos 68.649 → 68.649 · aristas 98.774 → 98.774 · cortes 1.524 → 1.524 · D2 114 → 114
⇒ ✅ invariante a la traslación
```
⚠️ **Y una invarianza puede pasar por construcción**: si el planarizado no mirase la geometría, el
resultado sería idéntico igualmente. Así que se añade **la contraprueba de la contraprueba** —
deformar el dato con un zigzag de 30 m:
```
aristas 98.774 → 405.623   cortes 1.524 → 159.222
⇒ ✅ el planarizado SÍ reacciona a la geometría: la invarianza de arriba significa algo
```

### C5 · Rutas de cordura

15 travesías de más de 3 km sorteadas con semilla 20260803.
```
con camino               15 de 15
⛔ rodeos imposibles (<1)   0  ✅
rodeo mediano            1,16     ·   rodeo peor 1,22
la más larga: 10,43 km recta → 11,59 km (rodeo 1,11)
```

### C6 · ⭐ Cuenta a mano — los 10 cruces conocidos

Salen **del crudo de la tanda 3** (otro fichero, otra fecha, otra consulta), no de una lista escrita
hoy (ley 17).

```
⇒ 10 de 10 cruces CONSTRUIDOS a 0,00 m de su sitio    (casco tanda 8: 10 de 10)
⇒  9 de 10 utilizables A PIE                          (casco tanda 8:  8 de 10)
```

**Ninguno se perdió al escalar**, y uno **ganó** paso a pie: en el grafo de la ciudad tiene vecinas
que en el recorte del casco caían fuera.

---

## 4 · C4 · ⭐ EL EJE DENSIDAD — el que no se había medido nunca

⚠️ Los bboxes son **ventanas mías** para comparar tejidos urbanos, **no límites administrativos**.

```
 zona                             aristas    km²   ar/km²  calzada   acera peatonal  pasos  D2
 casco histórico                     6.984    3,2    2.158    22,2%   30,6%    30,5%  15,0%   6
 ensanche (Gran Vía · Sagasta)       5.918    2,3    2.538    27,8%   33,5%    17,3%  19,8%   0
 periferia · Actur-Rey Fernando      9.054    6,4    1.424    33,4%   22,5%    31,7%  11,9%   0
 periferia · Valdespartera           1.445    4,5      320    50,9%   15,8%    25,7%   7,0%   0
 rural · Garrapinillos                 489   14,0       35    74,4%   18,6%     3,1%   3,9%   0
 rural · Movera                        728    8,1       90    80,2%    9,8%     7,6%   2,5%   0
 polígono · Malpica-Santa Isabel     1.309    9,3      140    81,8%    3,0%    12,1%   2,9%   0
 polígono · PLAZA                    2.910   33,7       86    89,7%    0,0%     9,6%   0,6%   4
```

⭐ **Positivos de control de las ventanas:** casco → ¿está `Calle del Coso`? ✅ · ensanche → ¿está
`Gran Vía`? ✅. ⚠️ **Las seis ventanas restantes NO están verificadas por nombre: se declara.**

**⇒ El planarizado se comporta igual en todas; lo que cambia es el MAPEADO de OSM.** La cadena va
de 22 % de `eje-de-calzada` en el casco a 90 % en PLAZA, monótona y sin sorpresas: cuanto más lejos
del centro, menos aceras dibujadas. **En PLAZA hay un 0,0 % de acera y un 0,6 % de pasos de
peatones: 33,7 km² de polígono donde el grafo no sabe por dónde se anda, solo por dónde se
conduce.**

⚠️ Esto **no es un fallo del grafo ni de D4**: es el estado de OSM fuera del centro. Pero cambia lo
que la aplicación puede prometer, y por eso está aquí y no en una nota al pie.

---

## 5 · ⛔ EL HALLAZGO QUE NO SE HA ARREGLADO A PROPÓSITO

**13,8 km de calles que todavía no existen, y por las que el grafo deja andar.**

```
highway            ciudad: aristas / a pie / metros     casco
proposed              178 /   178 /  13.805 m           0 / 0
construction          693 /     0 /  49.981 m         117 / 0

de las 178, ARTICULACIONES (único paso): 23
si se quitaran: mayor 65.933 → 65.851  ⇒ 82 nodos se quedarían sin conexión
```

`transitableAPie()` excluye `motorway`, `trunk`, `foot=no` y `construction`. **No excluye
`proposed`** — y no por criterio, sino porque **en el casco no había ni una**. `construction` sí
entró, porque en el casco había 117 y me las encontré de frente.

**⛔ NO se ha tocado.** El briefing lo prohíbe expresamente y con razón: cambiar la regla y la
escala a la vez invalidaría toda la tabla casco-vs-ciudad de esta tanda. **Queda medido,
localizado y reportado. La decisión es de Antonio.** Ver bitácora nº62.

---

## 6 · D · EL VISOR

**Se adaptó al volumen recortando LO QUE PINTA, nunca el grafo.**

```
aristas exportadas    98.774 de 98.774   ⇒ NINGUNA fuera
vértices exportados  378.222             ⇒ SIN simplificar: el dibujo es el grafo
peso                  16,91 MB
```

⛔ **No se simplificó la geometría.** Douglas-Peucker a 1 m ahorraba el 22 % de los vértices a
cambio de mover el dibujo hasta un metro — y este instrumento existe justamente para cazar
desajustes de ese tamaño (los 20 nodos de la tanda 9 estaban a 1,90 m).

Lo que se recorta es **cuántas se pintan a la vez**: selector de zona (la ciudad entera o cada una
de las 8 ventanas del eje densidad) y **capas perezosas** (una capa no se construye hasta que se
enciende). Y para que el recorte no pueda mentir, **el panel enseña siempre "pintadas N de M"**.

**D2 · El cuadre contra el grafo, antes de mirar nada:**
```
aristas                            98.774 = 98.774   ✅
unido-por-defecto                     114 =    114   ✅
no conectados por evidencia         1.410 =  1.410   ✅
puntas 2-5 m sin soldar               488 =    488   ✅
componentes                           169 =    169   ✅
vértices de geometría             378.222 = 378.222  ✅
nodos                              68.639 ≠ 68.649   ⚠️ −10
```

⭐ **Los 10 de menos no se explican con una nota: se demuestran.** En la tanda 9 esta misma
diferencia salió de **+21** y "es el redondeo" era una explicación plausible **y falsa** —eran
nodos en dos sitios a la vez—. Lo que la desmintió fue el **signo**. Ahora el exportador localiza
cada colisión y mide su separación real:

```
pares de nodos en la misma casilla  11   ·   separación peor  4,99 cm
⇒ ✅ todas por debajo de la casilla del redondeo (11 cm): es redondeo, comprobado
```

Y el guardián **se para** si aparece un exportado con MÁS nodos que el grafo, o una colisión a más
de 12 cm. Su rojo se ha provocado rompiendo el redondeo a propósito:
```
casillas 13.227 ⇒ diferencia 55.422 · separación peor 136 m
⛔ hay colisiones a más de 12 cm: NO es el redondeo. PARAR.   ✅ sale con código 1
```

**D3 · La arista falsa:** 98.774 → **98.775** al plantarla → **98.774** al borrarla. ✅

**D1/D4 · Las capas.** Comprobado contra un Leaflet simulado, con la ciudad entera y **todas** las
capas encendidas:
```
capa 1 · aristas por precisión              98.774 = 98.774  ✅
capa 2 · aristas por componente             98.774 = 98.774  ✅
capa 2 · círculos de islitas                   168 =    168  ✅
capa 3 · unido-por-defecto                     114 =    114  ✅
capa 4 · no unidos por evidencia             1.410 =  1.410  ✅
capa 5 · puntas 2-5 m                          488 =    488  ✅
capa 6 · zonas del eje densidad (NUEVA)          8 =      8  ✅
capa 7 · límite municipal (NUEVA)            3.130 =  3.130  ✅
```

⚠️ **Lo que esta prueba NO puede decir:** si el navegador aguanta 99.000 líneas. No tengo navegador.
Por eso el visor abre en **modo lienzo**, con dos capas y con selector de zona — y si aun así va
lento, **se recorta la zona, no el grafo**.

---

## 7 · ⭐ D5 · LO QUE SOLO ANTONIO PUEDE JUZGAR

En orden de **lo que más cambia si está mal**.

**1. ⛔ Las calles `proposed` — es una decisión, no una revisión.**
¿Se excluyen del enrutador a pie las 178 aristas `highway=proposed` (13,8 km)? Hoy se puede andar
por ellas y **23 son el único paso a 82 nodos**. Yo no lo toco por orden expresa. Un sitio para
mirarlo: `41.66513,-0.84760`.

**2. ⛔ Los 3 barrios incomunicados.** ¿Se amplía la descarga más allá del término municipal para
que Peñaflor y compañía conecten? Es cambiar el alcance del dato, no el código.
· Peñaflor de Gállego `41.76682,-0.88154`
· `41.74134,-1.07744` (Avenida Zaragoza · Calle Mayor)
· `41.57802,-0.95339` (Avenida de la Muralla de Santa Fe)

**3. ⚠️ El 47,2 % de `eje-de-calzada`.** ¿Se le da la vuelta a D4 —destacar lo bueno en vez de
advertir lo malo— ahora que la advertencia sale en media ciudad? Míralo en el visor con la zona
`polígono · PLAZA`: **todo rojo, 0,0 % de acera**. La pregunta concreta: **andando por ahí, ¿tú
tendrías dudas de por dónde se pasa, o el rojo está exagerando?**

**4. Los 8 `unido-por-defecto` RODADA × RODADA**, que son los únicos que no tienen explicación
peatonal. Siete llevan `proposed`, así que la pregunta es la nº1; el que no:
`41.67401,-0.94503` (Camino Nuevo × una vía proyectada).

**5. Las puntas de 5 m.** Las cuatro peores, ¿son calles que continúan?
`41.63662,-0.87441` (4,98 m) · `41.63544,-0.86487` (4,96 m) · `41.65121,-0.88324` (4,94 m) ·
`41.64598,-0.92139` (4,94 m).

**6. Los 96 `tunnel=building_passage`.** ¿Alguno de los que conozcas está cerrado de noche o los
fines de semana? Si la respuesta es sí en varios, la decisión de ignorar los pasos condicionales
hay que reabrirla.

**7. Y la que ni el grafo ni el fondo pueden contestar, porque los dos salen de OSM:**
**¿hay alguna calle dibujada donde no hay calle, o falta alguna que sepas que existe?** Con
`eje-de-calzada` al 47 %, esta pregunta vale más fuera del centro que dentro.

---

## 8 · E · QUÉ HE BUSCADO A PROPÓSITO Y NO HE ENCONTRADO

- **Un pico de puntas justo por encima de 2,0 m.** Lo busqué porque habría significado que D5 se
  queda corta. **15 % donde el azar daría 17 %: no está.**
- **Una orilla incomunicada.** 36 pares al azar, tres ríos. **No está.**
- **Una componente urbana aislada sin explicación.** Las 3 que hay tienen la misma causa medida y
  es la descarga. **No hay ninguna sin explicar.**
- **Que `unido-por-defecto` se disparase.** Sube un 37 % por arista. **No se dispara.**
- **Que el planarizado se comportase distinto por zonas.** Los ratios aristas/way son iguales; lo
  que cambia es el mapeado de OSM. **El proceso no cambia de comportamiento.**
- **Un `out geom` con la forma del `out body`.** No aplica: los tres crudos de esta tanda son
  `out geom`. Comprobado, no supuesto.

### Lo que NO he comprobado, y por qué

- **Que el visor abra y se vea bien en un navegador.** No tengo navegador. Lo que sí está probado es
  que ejecuta, que no filtra en silencio y que sus cuentas cuadran. **El rendimiento con 99.000
  líneas es `NO CONSTA`: no se puede saber desde aquí.**
- **Que las 6 ventanas del eje densidad sin control positivo estén donde creo.** Solo dos —casco y
  ensanche— tienen su calle de control. Las otras seis **están declaradas como no verificadas**.
- **Los 168 islotes uno a uno.** Están listados los 20 mayores. Los 148 restantes están clasificados
  por regla, no mirados. **Agrupar es borrar, y aquí he agrupado 148.** Se dice.
- **Que el término municipal esté cubierto por completo.** El dato llega hasta donde llega el área
  de Overpass; **no he comprobado que no falte ninguna calle del término**, solo que las que hay
  están bien construidas. Es otra pregunta y necesita el callejero municipal.

### Los diez ejes: cuáles he tocado

| eje | ¿verificado? | cómo |
|---|---|---|
| **posición** | ✅ | reproyección ida y vuelta, 0,096 mm sobre 68.787 nodos |
| **vecindad** | ✅ | cortes geométricos, nodos compartidos, componentes |
| **dirección** | ⚠️ parcial | no hay sentidos de circulación todavía (es a pie) |
| **identidad** | ✅ | el cuadre nodos/aristas, y las 11 colisiones medidas una a una |
| **correspondencia** | ✅ | los 10 cruces de la tanda 3, y los 32 puentes con nombre |
| **umbral / cola** | ✅ | el reparto de puntas 2-5 m, buscando el pico que no está |
| **escala** | ✅ | B7, y la comparación casco-vs-ciudad entera |
| **densidad** | ✅ **estreno** | C4, ocho ventanas de tejido urbano distinto |
| **agregación** | ✅ | los 1.650 pasos condicionales que eran 320, y los 45 "trozos urbanos" que eran 3 |
| **semántica** | ⚠️ **es el que falla** | `proposed` estaba en el dato, se leía bien, y significaba algo que el filtro no sabía |

### Qué no he comprobado de mi propia conclusión

Digo que **ningún río parte el grafo**. Lo he probado con 36 pares sorteados y 32 puentes. **No he
probado que no exista un punto concreto de una orilla desde el que no se pueda cruzar** — el sorteo
cubre el tejido urbano ribereño, no cada esquina. Un barrio muy pequeño y muy pegado al río podría
estar mal y salir por debajo del muestreo. **Para afirmarlo del todo habría que comprobar la
conectividad de todos los nodos ribereños contra la componente mayor, y no lo he hecho.**

---

## 9 · TRAZA

```
node src/ciudad.js              contadores casco-vs-ciudad y eje densidad
node src/verificar-rios.js      C1 · los ríos y los 32 puentes
node src/verificar-ciudad.js    C2, C3, C5, C6
node src/exportar.js            vuelca el grafo al visor, con el cuadre
node src/probar-visor.js        el visor contra un Leaflet simulado
tools/visor-grafo.html          doble clic
```

Fallos de esta tanda en `docs/BITACORA.md`: **nº57 a nº62**.
