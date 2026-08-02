# Los portales como testigos

**Fecha:** 2026-08-02 · **Tanda 4** · Documento de medición, no de diseño.

Todo el proyecto había tratado los 46.150 portales del Ayuntamiento como **destinos**: puntos que
al final se enganchan a un grafo que viene de otro sitio. Antonio propuso el papel contrario —
**testigos: puntos que dicen dónde hay ciudad**— y cuatro usos derivados de él. Yo descarté la idea
demasiado rápido y él tuvo que insistir.

Esta tanda mide los cuatro. **Cero peticiones de red**: todo sale de datos ya en disco.

> **⚠️ Aviso de lectura.** Dos de los cuatro usos funcionan mejor de lo que yo sostenía, uno no
> funciona, y uno funciona a medias. Y **el instrumento con el que se midieron tuvo un fallo grave
> que pasó todas las contrapruebas del método** (bitácora nº38). Está contado en §0 antes que
> ningún resultado, porque los números de este documento son los de *después* de arreglarlo.

---

## 0 · Antes de nada: el instrumento estuvo roto y las contrapruebas lo firmaron

Al construir el emparejador agrupé la geometría de OSM **por el valor de `name`**. OSM tiene
**siete** objetos llamados *Plaza de España* en el término de Zaragoza. Mi agrupador los cosió en
un único objeto que se extendía 20 km, y cinco vías municipales distintas emparejaron con él.

La ley nº36 de ayer —*el nombre no es un identificador, es una etiqueta que se repite*— la aprendí
en el callejero municipal y **la volví a incumplir al día siguiente, aplicada a OSM**.

Lo que importa para leer el resto del documento es **qué dio verde mientras el fallo estaba vivo**:

```
                                     EMPAREJADA
señal (portales reales)                86,1 %
portales +2 km al norte                21,3 %
nubes teletransportadas al azar         6,0 %
```

La contraprueba de desplazamiento —la ley mayor de la tanda anterior, obligatoria por método— se
hunde 4× y 14×, **y firma un instrumento con cinco plazas fusionadas dentro**. No es mala suerte:
es estructural. **Desplazar 2 km no acerca dos homónimos que están a 20 km.** La contraprueba de
desplazamiento comprueba que el instrumento sabe *dónde* está una cosa; **no comprueba que sepa
*cuántas* cosas hay**.

Lo cazó el banco de pruebas que el briefing dejaba puesto —*"las ocho Plaza España: ¿la nube las
distingue?"*—, no el total, que era bueno y nunca habría delatado a 5 vías de 2.731.

**Arreglo:** el candidato pasa a ser un **grupo de ways del mismo nombre espacialmente encadenados**
(unión por nodo compartido o extremos a ≤150 m). Un nombre puede dar varios objetos.

```
candidatos por nombre .......... 4.384
candidatos por objeto .......... 4.936
nombres con más de un objeto ...   344
   Calle Mayor 13 · Calle Miguel Servet 9 · Francisco de Goya 7 · Plaza de España 7 ·
   Ramón y Cajal 7 · Moncayo 6 · Zaragoza 6 · Huesca 6 · San Jorge 6 · Tenor Fleta 6
```

Las tres pasadas se repitieron enteras. **Todos los números de este documento son posteriores.**

---

## 1 · El dato, antes de medir nada con él

| | |
|---|---:|
| portales | **46.150** |
| códigos de vía distintos | 2.731 |
| portales cuyo `codigoVia` cruza con el callejero | **46.150 (100,00 %)** |
| vías del callejero **sin ningún portal** | **628 de 3.359 (18,7 %)** |

El vínculo portal→vía **viene dado**, no hay que adivinarlo. Eso hace que todo lo de esta tanda mida
la relación *municipal↔OSM*, nunca *portal↔calle municipal*.

**Y hay un límite duro antes de empezar: sobre 628 vías el método no puede opinar nunca.** No es un
resultado, es el tamaño del universo.

### El umbral se fija con una propiedad física, no con el resultado

Distancia de cada portal a **su propio** eje municipal — barrido completo, n = 46.124:

```
min 0,00   p25 5,09   MEDIANA 7,18   p75 13,63   p90 40,25   p95 80,08   p99 198,13   max 10.581
   ≤ 10 m: 66,4 %      ≤ 20 m: 81,2 %      ≤ 25 m: 84,6 %      ≤ 30 m: 86,8 %
```

**R = 25 m.** Sale del p85 de esta distribución, que no depende de OSM en absoluto y por tanto **no
se puede retocar para que el resultado quede bonito**. Fijado antes de la primera medición.

### ⚠️ Y una anomalía del propio callejero que hay que declarar

```
10.582 m   CAMINO SAN LAMBERTO ---GRP        nº 20
 4.195 m   PLAZA MISIONERAS DE NTRA.SRA.DEL PILAR
 3.238 m   CARRETERA AUTOVÍA DE MADRID       nº 46I
 3.097 m   CARRETERA AUTOVÍA DE LOGROÑO      nº 157
```

**1.747 portales (3,8 %) están a más de 100 m de la geometría de su propia vía**, repartidos en
**121 vías**. `codigoVia` cruza al 100 % como *clave*, pero **no garantiza que el portal esté sobre
su calle**. En autovías es esperable (el punto kilométrico); en `CAMINO SAN LAMBERTO ---GRP` a 10 km
es, casi seguro, otra homonimia dentro del propio dato municipal. `CAUSA NO CONFIRMADA`.

---

## 2 · A) El emparejador por nube

### A1 · El método

1. Cada portal emite **dos votos** al objeto OSM más cercano dentro de 25 m:
   - **`voto_nom`** → al eje **con nombre** más cercano.
   - **`voto_any`** → al objeto OSM más cercano, tenga nombre o no.
   
   ⚠️ Los dos votos existen por una razón declarada **antes** de medir: con `sidewalk=separate` la
   acera va mapeada como *footway* sin nombre y queda **más cerca del portal que la calzada**. Un
   solo voto habría hundido el emparejador en los barrios con aceras separadas.
2. La vía se clasifica por el **consenso** = votos del ganador / portales totales de la vía:

```
n < 3 portales                       -> SIN OPINIÓN (muestra insuficiente)
consenso >= 0,50 y ganador >= 3      -> EMPAREJADA
0,25 <= consenso < 0,50              -> DUDOSA
2º candidato >= 0,8 x el ganador     -> DUDOSA (empate)
consenso <  0,25                     -> NO EMPAREJADA
```

**En ningún momento se compara el texto municipal con el texto de OSM.** El `name` de OSM se usa
solo para agrupar geometría en un objeto y para saber que un way es un eje de calle, no una acera.

### A2/A3 · Las contrapruebas van primero

Sobre las 2.303 vías con ≥3 portales:

| | EMPAREJADA | DUDOSA | NO EMPAREJADA |
|---|---:|---:|---:|
| **señal** (portales reales) | **1.982 (86,1 %)** | 189 | 132 |
| ⭐ portales **+2 km al norte** | 490 (**21,3 %**) | 630 | 1.183 |
| ⭐ nubes **teletransportadas al azar** | 139 (**6,0 %**) | 185 | 1.979 |

La línea base al azar **no es aleatoria a lo bruto**: cada nube se teletransporta **entera**,
conservando su forma exacta, a un punto al azar del término (semilla `20260802`). Sigue siendo una
nube de portales; solo está donde no toca.

**El instrumento se hunde: 86,1 → 21,3 → 6,0.**

> ⚠️ **Y una advertencia que hay que leer junto al número.** A nivel de **portal suelto** la señal
> no discrimina nada: el 85,3 % de los portales reales tiene un eje con nombre a ≤25 m, y **con los
> portales movidos 2 km sigue siendo el 40,5 %**. En una ciudad, casi cualquier punto tiene una
> calle al lado. **Lo que discrimina no es la proximidad: es la coherencia de la nube entera.**

### A4 · Barrido completo, 3.359 vías

```
EMPAREJADA        1.982   (59,0 %)
DUDOSA              189   ( 5,6 %)
NO EMPAREJADA       132   ( 3,9 %)
SIN OPINIÓN         428   (12,7 %)   1-2 portales: la nube no es nube
SIN PORTALES        628   (18,7 %)   el método no puede opinar
────────────────────────────────
TOTAL             3.359            ✅ suma exacta
```

### A5 · Contra el resultado de la tanda 3

Los tres grupos publicados ayer se reconstruyen exactos (2.514 / 590 / 255) antes de comparar.

| grupo de la tanda 3 | EMPAREJADA | DUDOSA | NO EMP. | SIN OP. | SIN PORT. |
|---|---:|---:|---:|---:|---:|
| **2.514** casaban por nombre y tenían geometría | 1.671 | 135 | 42 | 308 | 358 |
| **590** con geometría, **nombre no resuelto** | **273** | 33 | 63 | 72 | 149 |
| **255** "no existe en OSM" | 38 | 21 | 27 | 48 | 121 |

**De las 590 que el texto no supo resolver, la nube resuelve 273.** Ésa es la aportación neta.

#### ⚠️⚠️ Las 48 del hueco duro: **aguantan**

```
EMPAREJADA      2      DUDOSA      4      NO EMPAREJADA  13
SIN OPINIÓN     6      SIN PORTALES  23
```

**23 de las 48 no tienen ni un solo portal.** Y la lista dice por sí sola qué son:

```
CALLE MANUEL FRAGA IRIBARNE      CALLE GREGORIO PECES BARBA     BULEVAR DEL CIUDADANO
CALLE FERNANDO GARCÍA MERCADAL   CALLE ALBERTO RABADÁ           CALLE LOS RAQUEROS
CALLE ALFONSO II / III / IV DE ARAGÓN        CALLE JAIME II DE ARAGÓN
```

Valdespartera, Arcosur, Parque Venecia. ⭐ **Dos fuentes independientes —OSM y el padrón municipal
de portales— dicen lo mismo sin haberse consultado: ahí todavía no hay ciudad.** Y confirma con dato
la sospecha que la tanda 3 dejó abierta sobre las cuatro `ALFONSO/JAIME … DE ARAGÓN` consecutivas:
son calles planificadas, no calles que OSM se haya dejado.

**Las 2 que ahora aparecen, verificadas una a una:**

| | portales → esa geometría OSM | veredicto |
|---|---|---|
| `CALLE TRASMOZ` → *Calle de Trasmoz* | mediana **5 m**, **1 solo segmento** | existe **un trozo**; el criterio publicado exigía ≥50 % del eje |
| `CAMINO FUENTE DE LA SALUD` → *Camino Fuente de la Salud* | mediana **35 m**, máx 93 m | emparejamiento flojo (consenso 0,50) |

**El hueco duro no se desmonta.** A lo sumo una de las 48 pasa de "no existe" a "existe un trozo".
**No propongo cambiar el número publicado** (§F2).

### A5c · Las contradicciones, que es lo valioso

De las 1.671 vías que **ambos** métodos emparejan, coinciden **1.668 (99,8 %)**. Discrepan **3**, y
se verificaron midiendo la distancia de los portales al objeto que eligió cada método:

| vía municipal | el TEXTO eligió | la NUBE eligió |
|---|---|---|
| `CAMINO LAS MONJAS` (n=12) | *Camino de Las Monjas* → **278 m** | *Barrio Clavería* → **5 m** |
| `CALLE BIEL` (n=38) | *Calle de Biel* → 57 m | *Urbanización La Carrasca* → **8 m** |
| `CALLE EL QUITASOL` (n=23) | *Calle El Quitasol* → 34 m | *Paseo de la Nevada* → **7 m** |

**`CAMINO LAS MONJAS` es una colisión del emparejador de texto**: el nombre casaba y el objeto está
a 278 metros. Es exactamente lo que Antonio predijo que la nube cazaría. Los otros dos no son
errores del texto: son casos donde **el portal da a un vial interior que OSM nombra de otra manera**.

### A6 · Las ocho Plaza España

```
cod 10800  PLAZA ESPAÑA          EMPAREJADA  n= 8 cons 0,50  Plaza de España #6
cod 10820  PLAZA ESPAÑA ---ALF   DUDOSA      n= 7 cons 0,43  Calle Barrio Alto #1
cod 10840  PLAZA ESPAÑA ---CRT   EMPAREJADA  n=11 cons 0,55  Plaza de España #5
cod 10860  PLAZA ESPAÑA ---CST   EMPAREJADA  n= 6 cons 1,00  Plaza de España #1
cod 10880  PLAZA ESPAÑA ---GRP   EMPAREJADA  n=12 cons 0,83  Plaza de España #4
cod 10900  PLAZA ESPAÑA ---MNZ   DUDOSA      n= 9 cons 0,44  Calle de Enmedio #1
cod 10920  PLAZA ESPAÑA ---PÑF   EMPAREJADA  n= 6 cons 0,83  Plaza de España #3
cod 10940  PLAZA ESPAÑA ---SJN   EMPAREJADA  n= 9 cons 0,89  Calle del Doctor Palomar
```

**Ocho objetos OSM distintos para ocho vías.** El caso que tumbó el emparejador de texto —donde
*PLAZA ESPAÑA ---GRP* casaba con *Avenida de España*— la nube lo resuelve sin mirar una sola letra.

⚠️ **Pero tres de las ocho emparejan con una calle, no con una plaza** (---ALF, ---MNZ, ---SJN). No
es un error de la nube: **es que esas plazas no existen como eje en OSM**, están mapeadas como área
o no están, y los portales votan a la calle que las bordea. Es el problema de las plazas que la
tanda 3 dejó abierto, visto desde el otro lado. **Y es un falso positivo estructural del método:**
cuando el objeto correcto no existe, la nube empareja con el vecino en vez de callarse.

### A7 · Veredicto

```
resuelven los DOS ......... 1.703  (50,7 %)
solo el TEXTO ..............  892  (26,6 %)
solo la NUBE ...............  279  ( 8,3 %)
ninguno ....................  485  (14,4 %)
──────────────────────────────────────────
UNIÓN ..................... 2.874  (85,6 %)     texto solo 77,3 %   nube sola 59,0 %
```

Muestra de las que **solo** resuelve la nube:

```
CALLE DAVID FAHRENHEIT             -> Calle David Farenheit      (errata en OSM)
CALLE POETA GABRIEL CELAYA         -> Calle de Gabriel Celaya    (tratamiento omitido)
CALLE MAYOR ---JSL                 -> Calle Mayor #12            (homónimo resuelto por posición)
PLAZA SANTIAGO SAS                 -> Plaza de Sas
CALLE MALPICA II ( J)              -> Calle J #3
⚠️ CALLE MIGUEL ALLUÉ SALVADOR      -> Calle de Lola de Ávila     ← sospechoso, sin verificar
⚠️ CALLE MOSÉN PRIMITIVO OLIVER     -> Calle La Granja            ← sospechoso, sin verificar
```

> **A7 · La nube es COMPLEMENTARIA del nombre, no mejor: sola llega al 59,0 % y el texto al 77,3 %,
> pero juntos al 85,6 %, y la nube resuelve 279 vías que el texto no toca —incluidas erratas de OSM
> y homónimos— a cambio de no poder opinar sobre las 1.056 vías con menos de 3 portales.**

⚠️ **Las 279 no están verificadas una a una.** Al menos dos de la muestra de 12 huelen a error.

---

## 3 · B) La cobertura medida con portales

### B1 · Nubes sin nada de OSM encima

Vías con ≥3 portales y **ninguno** a ≤25 m de **ninguna** geometría OSM: **10**.

```
CALLE TOMILLO (SJN) n=12     CAMINO TORRE ESCOLAPIOS (MVR) n=11    CALLE EL CISTER n=9
CALLE CIUDAD TRANSPORTE (A) n=7   CALLE EL CUARTAL (SJN) n=6       CAMINO DEL MONTÓN n=5
PLAZA TENIENTE POLANCO n=5   CAMINO LA PURÍSIMA (MNT) n=5
CAMINO DEL PASO A SAN LÁZARO (MVR) n=4      CAMINO HUEGA (SIS) n=3
```

⚠️ Este número solo vale como **cota**, no como medida: el criterio *"hay algo de OSM a 25 m"* es
laxo —con los portales movidos 2 km, el 40,5 % seguía teniendo algo cerca—. Pero al revés sí es
duro: **si ni con criterio laxo hay nada, el hueco es seguro.**

### B2 · Al revés: OSM sin ningún portal cerca

Criterio: ningún punto muestreado del way tiene un portal a <50 m.

```
highway              con      SIN     km con    km SIN
residential         4.135    2.514     591,6     393,2
footway             4.102      481     290,0      34,7
motorway               50      484      32,9     286,6
track                 111      333      54,4     375,0
path                   19      201       4,0     137,8
trunk                 214      324      42,3      73,2
unclassified          134      354      73,5     104,6
pedestrian            839      108      70,4      10,1
⛔ SIN TAGS EN DISCO  18.599   16.956   1.187,7   3.966,9
```

**No se asume que "sin portal" = "no transitable".** La clasificación por tipo dice lo contrario:
`motorway` (286 km), `track` (375 km) y `path` (137 km) son la mayor parte del viario sin portales,
y son exactamente lo que se espera —autovías, pistas agrícolas, senderos—. `pedestrian` y `footway`
casi siempre tienen portales cerca: son calles peatonales del casco, no descampados.

⛔ **Y el límite del dato:** el crudo de nombres solo trae los ways **con `name`**, así que
**`NO CONSTA` el `highway` de 35.555 ways de 55.452**. Resolverlo exige una petición de red, que
esta tanda tiene prohibida. **B2 queda cojo y se declara cojo.**

### B3 · ⭐ La discrepancia con el 4,11 % de ayer

De las 10 vías de B1, **7 ya estaban en las 48**. Las otras **3 son nuevas**:

```
cod 31945  CALLE TOMILLO                  n=12   tanda 3: cobertura 1,00, cubo 'ENCONTRADA'
cod 40040  CAMINO DEL PASO A SAN LÁZARO   n= 4   tanda 3: cobertura 1,00, cubo 'ENCONTRADA'
cod 23750  PLAZA TENIENTE POLANCO         n= 5   tanda 3: cobertura 0,00, cubo 'NO ENCONTRADA'
```

**`CALLE TOMILLO` es la que no se puede promediar.** La tanda 3 la dio **100 % cubierta** por eje, y
sus **12 portales no tienen ni una geometría de OSM a 25 m**. Las dos medidas no pueden ser
correctas a la vez: o el eje municipal de Tomillo está encima de otra calle de OSM que no es
Tomillo, o los portales están donde el eje no está. **`CAUSA NO CONFIRMADA`** — hace falta mirar el
caso concreto, y esta tanda no lo hace.

**Los dos métodos coinciden en el orden de magnitud** (48 vs 10 vías duras) y **la discrepancia es
de 3 vías**. No cambia el 4,11 %; sí añade tres casos a revisar.

---

## 4 · C) El verificador de cruces — **no funciona**

### C1/C2 · Primera versión: el hueco alrededor del cruce

Cruces conocidos = nodos de OSM compartidos por ≥2 ways con **nombres distintos**: **11.562**.
Se mide la distancia al portal más cercano, **solo en zona urbana** (hay un portal a <60 m; fuera
de eso la señal no aplica). Control: puntos del eje que **no** son cruce y están a >40 m de uno.

```
                                    n      p25   MEDIANA   p75    p90
hueco en CRUCES conocidos         3.000    10,7    16,3    25,9   39,4
⭐ CONTROL: puntos que NO son cruce 3.000   11,2    21,4    33,8   45,7

umbral 'hueco >= 20 m' -> avisa en 38,0 % de los cruces  y en 52,9 % de los NO cruces  (razón 0,72)
umbral 'hueco >= 30 m' -> avisa en 19,2 % de los cruces  y en 31,5 % de los NO cruces  (razón 0,61)
```

⛔ **La señal existe y va al revés.** Los cruces tienen **menos** hueco de portales que el tramo
medio, no más. La razón es geométrica y evidente en cuanto se mira: **en un cruce confluyen cuatro
esquinas, y las esquinas tienen portal**. En medio de un tramo hay dos fachadas; en un cruce, cuatro.

> ⚠️ **Y aquí me corrijo a mí mismo con precisión.** Yo había dicho que los cruces no salen de los
> portales *"porque no hay puertas en un cruce"*. **Eso es falso: hay más puertas que en ningún otro
> sitio.** Acerté el veredicto con el argumento equivocado, que es peor que equivocarse: si el
> argumento hubiera sido correcto, la primera medición habría dado señal.

### C v3 · La versión que Antonio describió, y que yo no había medido

La primera versión no era la idea. La idea era el hueco **a lo largo de una misma calle**: la
numeración se interrumpe donde la cruza otra, porque ahí está la boca. Medido sobre 14.204 huecos
entre portales consecutivos en 600 calles al azar (semilla `20260802`):

```
línea base: el 27,2 % de TODOS los huecos tiene un cruce a <=20 m de su punto medio

 tamaño del hueco        n      cruce a <=20 m
 0-15 m               5.325         23,3 %
 15-25 m              3.160         21,1 %
 25-40 m              2.015         29,4 %
 40-60 m              1.425         37,2 %
 60-100 m             1.072         42,9 %
 100+ m               1.207         31,3 %
```

**Hay señal, y es real**: un hueco de 60-100 m cae sobre un cruce el 42,9 % de las veces contra el
27,2 % de línea base. Pero **1,58× no es un guardián**: significa **57 % de falsos avisos**. Y los
huecos de más de 100 m *bajan* al 31,3 %, porque ya no son cruces sino saltos a otra parte de la
calle.

### C3 · Veredicto

> **C3 · No sirve como guardián independiente del planarizado: en zona urbana un hueco grande de
> numeración cae sobre un cruce el 42,9 % de las veces contra un 27,2 % de azar —señal real pero
> 1,58×—, y la primera versión de la idea sale directamente invertida porque en las esquinas hay
> más portales, no menos.**

### C4 · Y dónde no funcionaría ni aunque funcionase

Calles sin portales (628 vías), plazas mapeadas como área, viales de servicio, polígonos
industriales con numeración correlativa, y **todo el término fuera de la zona urbana**, donde la
distancia al portal más cercano satura y deja de medir nada.

**El problema de fondo sigue en pie: el planarizado saldrá de OSM y todo lo que tenemos para
vigilarlo también.** Los portales eran la única fuente independiente a mano y **no valen para esto**.

---

## 5 · D) ⭐⭐ El lado de la calle — el diseño lo daba por imposible y **se puede**

`P4.3` del documento de diseño dice que no se puede saber de qué lado de la calle está un portal.
**Se puede, en la mayoría de las calles, y con margen sobre el azar.**

**Unidad de medida: el WAY de OSM, no la calle.** El sentido de digitalización de un way es
arbitrario; una calle partida en varios ways invertiría el signo. Dentro de un way la orientación
es única, así que el signo es comparable sin ninguna suposición.

### El control que faltaba

```
ways con >=6 portales:                                     2.086
... y AMBAS paridades presentes:                           1.409
... y ADEMÁS AMBOS lados ocupados  (⇐ universo válido):    1.289     21.140 portales
```

⚠️ Los **120 ways descartados** tienen todos los portales a un mismo lado, y por tanto **dan acierto
1,00 con cualquier asignación de paridades**. No son aciertos: son la pregunta mal hecha. Enseñados
aparte, como control de que el control funciona:

```
los 120 descartados:   señal media 1,000    ⭐ barajado media 1,000    ← acierto sin mérito
```

### D1/D2 · La medida

Regla: a cada paridad se le asigna su signo mayoritario; acierto = fracción de portales consistente.
**Línea base = el mismo cálculo con las paridades barajadas** (semilla `20260802`) — no una moneda,
sino este mismo instrumento sobre un dato al que se le ha quitado la información.

```
n = 1.289 ways, 21.140 portales

                                 media   mediana   >=0,90   >=0,95   =1,00
SEÑAL (paridad real)             0,972    1,000    89,5 %   83,2 %   79,9 %
⭐ LÍNEA BASE (barajada)          0,681    0,667     4,3 %    2,3 %    2,0 %
```

**89,5 % contra 4,3 %.** Y la señal no se apoya en la mediana: **el 79,9 % de los ways acierta el
100 % de sus portales**, contra un 2,0 % barajado.

### D3 · Dónde falla — exactamente donde el briefing predijo

```
way 613953707   0,50  n=16  URBANIZACIÓN TORRES DE SAN LAMBERTO  números: 24,32,32,33,33,34,35,35
way 1239949571  0,50  n= 8  URBANIZACIÓN TORRES DE SAN LAMBERTO  números: 34,34,35,35,36,36,37,37
way 42388713    0,56  n=34  POLÍGONO SAN VALERO                  números: 2,3,4,5,6,7,8,9,10
way 48528039    0,60  n=10  CALLE LUESIA                         números: 1,3,4,9,11,21,25,27,29
```

**Numeración correlativa, no par/impar.** Seis de los doce peores son la misma urbanización. Es un
modo de fallo **reconocible desde el propio dato** —si los números consecutivos alternan paridad en
el mismo lado, la regla no aplica—, así que se puede detectar sin saber la respuesta.

### D4 · Veredicto

```
umbral   ways fiables       portales cubiertos    | barajado
0,80     1.242 (96,4 %)     20.521 (97,1 %)       | 230 (17,8 %)
0,90     1.154 (89,5 %)     19.621 (92,8 %)       |  55 ( 4,3 %)
0,95     1.073 (83,2 %)     18.299 (86,6 %)       |  30 ( 2,3 %)
1,00     1.030 (79,9 %)     16.545 (78,3 %)       |  26 ( 2,0 %)
```

> **D4 · Sí se puede decir de qué lado está un portal, y el umbral es 0,95 por way: cubre el 83,2 %
> de los ways y el 86,6 % de los portales evaluables con un 2,3 % de línea base, y en el 16,8 %
> restante la app tiene que callarse — porque decir la acera equivocada es peor que no decirla.**

⚠️ **D5 · Dependencia declarada:** esto presupone que la calle **ya está emparejada** con su eje de
OSM (§A). Sobre una vía mal emparejada, el lado se calcula contra el eje equivocado y el resultado
es basura con buena pinta. **El lado no se puede usar en vías `DUDOSA` ni `NO EMPAREJADA`.**

---

## 6 · E) ⚠️ Generar el eje uniendo portales — **me equivoqué**

Yo sostenía que unir los portales daría *"un zigzag de acera a acera y por dentro de las manzanas en
las curvas"*. Barrido de **200 calles al azar** (semilla `20260802`), comparando el trazado generado
contra el eje real de OSM:

```
                              calles   error mediana    p90      máx    | calles con error medio <10 m
E1  unir TODOS en orden         200         5,9 m     26,4 m   284,8 m  |          78 %
E2  promediar por paridad       168         1,3 m     17,1 m   126,9 m  |          88 %
```

**E1 tenía parte de razón: el zigzag existe** —máximo 284,8 m, p90 de 26 m, un cuarto de las calles
con error medio de más de 10 m, que es la acera de enfrente—. **Pero la mediana es de 5,9 m**, mucho
mejor de lo que yo afirmaba.

**E2 —la versión sensata, que Antonio insinuó y yo ni consideré— da 1,3 m de error mediano.** En
calles urbanas normales el error es de decímetros:

```
CALLE ARZOBISPO APAOLAZA  n=33  E1 5,9 m -> E2 0,2 m
CALLE RÍO CINCA           n=32  E1 5,4 m -> E2 0,6 m
CALLE PRIVILEGIO UNIÓN    n=36  E1 4,6 m -> E2 0,6 m
CAMINO COPAO              n=16  E1 43,2 m -> E2 14,9 m     ← camino rural, sigue mal
```

⚠️ **Contador honesto: E2 solo se puede calcular en 168 de 200 calles (84 %)**, porque hacen falta
≥2 pares y ≥2 impares. **Y las 32 que quedan fuera no son al azar: son justo las de numeración
correlativa o de un solo lado**, es decir, las difíciles. El 1,3 m está medido sobre el subconjunto
fácil y hay que leerlo así.

### E3 · En las 48 del hueco duro, donde no hay OSM

Ahí no hay eje de OSM contra el que comparar, así que se compara con el **eje municipal**, que sí
existe. De las 48, **11 tienen ≥6 portales**:

```
CALLE BRAZAL PELEGRÍN ---SIS   n=33   E1  4,1 m   E2  0,1 m
CALLE ALDEA DE SIEST           n=10   E1  3,6 m   E2  3,9 m
CAMINO TORRE ESCOLAPIOS        n=11   E1  4,7 m   E2  3,9 m
CALLE SANTA ÁGUEDA             n= 9   E1  3,7 m   E2  5,2 m
CALLE CIUDAD TRANSPORTE  (A)   n= 7   E1 15,3 m   E2  1,5 m
CALLE GASPAR DE PEX            n=30   E1 27,2 m   E2 13,6 m
                              ⇒ 9 de 11 con E1 < 10 m,  6 de 11 con E2 < 10 m
```

**Sí: en las calles del hueco duro, un eje sacado de portales reproduce el eje municipal dentro del
ancho de la calle en 9 de 11 casos.** Con el coste dicho en voz alta: **ese eje no tiene cruces, ni
sentido de circulación, ni nivel, ni conexión con nada**. Es una línea, no viario.

### E4 · Veredicto

> **E4 · ⚠️ ME EQUIVOQUÉ: unir los portales por paridad y promediar los dos hilos reproduce el eje
> de OSM con 1,3 m de error mediano en el 84 % de las calles donde se puede calcular —no el zigzag
> inservible que yo afirmé—, aunque unirlos todos en bruto sí zigzaguea (p90 de 26 m, máximo 285 m)
> y ningún eje generado trae cruces, sentido ni nivel.**

**Sirve para verificar y, en el hueco duro, como último recurso. No para generar el grafo.**

---

## 7 · F) Qué cambia en lo ya decidido

**F1 · La salvaguarda de D0 (enganche por proximidad + `codigoVia`): NO cambia, y ahora tiene una
segunda pata.** El enganche sigue siendo por proximidad; lo que cambia es que la **verificación** de
que una vía municipal corresponde a una geometría de OSM ya no depende solo del nombre. Son
complementarios (85,6 % la unión contra 77,3 % el texto solo), no sustitutos.

**F2 · El número de cobertura de la tanda 3: NO cambia.** Las 48 aguantan; a lo sumo una pasa a
"existe un trozo". Aparecen 3 casos nuevos a revisar, que van a la lista de pendientes, no al
número. **No propongo tocar `COBERTURA-OSM-VS-CALLEJERO.md`** — y si se tocara, sería en un
documento nuevo, no reescribiendo aquél.

**F3 · P4.3 del diseño ("de qué lado está el portal: no se puede saber"): SÍ cambia, y es la
decisión que hay que tomar.** Se puede, con 0,95 de fiabilidad por way, en el 83,2 % de los ways y
el 86,6 % de los portales evaluables. ⚠️ **No lo corrijo yo:** el diseño es registro histórico y la
corrección va en documento nuevo, cuando Antonio lo decida.

**F4 · Lo que NO cambia, dicho también** — porque un hallazgo que lo cambia todo es sospechoso:
- **D1 y las reglas de niveles**: intactas. Los portales no dicen nada del nivel.
- **El motor de rutas es código propio**: nada de esta tanda lo toca.
- **El planarizado sigue saliendo de OSM**, y sigue **sin guardián independiente** (§C3).
- **Las plazas siguen sin resolverse.** Esta tanda las vuelve a encontrar por el otro lado: tres de
  las ocho Plaza España emparejan con una calle porque la plaza no existe como eje.
- **628 vías sin portales**: para ellas, nada de esto existe.

**F5 · Qué habría que volver a medir con el grafo delante**
1. Las **279** que solo resuelve la nube, una a una — al menos dos de doce huelen a error.
2. `CALLE TOMILLO`: los dos métodos se contradicen y uno de los dos está mal.
3. El lado de la calle **después** del planarizado, cuando los ways estén partidos en los cruces:
   la unidad de medida cambia y el 89,5 % hay que volver a sacarlo.
4. Si las plazas se resuelven como área, rehacer A6: probablemente sube el consenso de las ocho.

---

## 8 · G) Qué no he mirado, y por qué

- ⛔ **El `highway` de 35.555 ways de 55.452.** El crudo de nombres solo trae los que tienen `name`.
  Saberlo exige red, prohibida esta tanda. **B2 queda cojo y se declara cojo.**
- **Las 279 "solo la nube"** no están verificadas una a una. Solo se miraron 12 al azar.
- **La contraprueba de desplazamiento se hizo solo hacia el norte.** Un solo rumbo. Si hubiera un
  sesgo direccional (el Ebro corre este-oeste), no lo vería.
- **Las plazas mapeadas como área**: mi geometría son ways de `highway`. Un `pedestrian` cerrado o
  un `landuse` no entran. Es justo lo que hace fallar A6 en tres casos.
- **Los 26 portales cuya vía no tiene geometría** en el WFS.
- **Si los portales tienen fecha o vigencia**: el dataset no trae campo de fecha, así que **no se
  sabe de cuándo es** ni si incluye promociones sin construir. `NO CONSTA`.
- **El nivel**: un portal es un punto en planta. No dice si está en un puente, un túnel o a cota.
- **Nada de tiempo real**, que está fuera de la v1 por decisión previa.

---

## 9 · Trazas

| dato | dónde | publicado |
|---|---|---|
| 46.150 portales | `…/ZGZ RADAR REACT/…/portales-zaragoza.json` | **NO** — dataset heredado, solo lectura; la decisión de publicarlo no está tomada |
| geometría OSM (55.452 ways) | `data/exploracion/2026-08-02_osm_overpass_zaragoza-termino_geometria.json` | **NO** — 34 MB, ver `COBERTURA-OSM-VS-CALLEJERO.md` §E |
| tags OSM (19.897 ways con nombre) | `data/exploracion/2026-08-02_osm_overpass_zaragoza-termino_nombres.json` | sí |
| callejero municipal (3.359 vías) | `data/exploracion/2026-08-02_wfs_urbanismo-Vias_completa-4326.json` | sí |

Los dos crudos de OSM llevan el **mismo sello**: `2026-08-02T14:36:18Z`, y cruzan por `id`.
Scripts de medición: desechables, fuera del repositorio. Semilla de todo muestreo: `20260802`.
Proyección: equirectangular local centrada en 41,65° N, **en metros**.

⚠️ **Esta tanda no hizo ninguna petición de red.** Todo sale de datos que ya estaban en disco.
