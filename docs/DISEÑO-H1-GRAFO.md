# DISEÑO H1 · El grafo del terreno

**Fecha:** 2 de agosto de 2026 · **Estado:** propuesta para aprobar. **Nada de esto está
construido.**

Este documento responde a seis preguntas antes de escribir código: si hacen falta las dos redes,
qué se parte, cómo se distingue un cruce real de uno falso, cómo se cosen las fuentes, cómo se
engancha un portal y —la que más pesa— **cómo se demuestra que el resultado es una red y no un
dibujo bonito**.

No propone librerías ni stack: está escrito en términos de **operaciones y datos**, porque el
stack no está decidido y un diseño que lo presupone acaba recortándose para caber en él.

---

## 0 · La muestra, dicha antes que nada

Todo número de este documento sale de medir sobre los crudos de `data/exploracion/`. Ninguno es
una intuición. Pero la muestra es pequeña y **hereda su tamaño a todo lo que sostiene**:

| Fuente medida | Tamaño | % del total |
|---|---|---|
| Tramos municipales | **160 únicos** (12 ventanas, 11 con datos) | **4,4 %** de 3.644 |
| Extremos | 320 | — |
| Crudo de OSM | 309 ways, 1.045 nodos, ~0,22 km² | ⚠️ **no estimable**: no sabemos la superficie urbana total |
| Portales | 46.150 leídos; **807** dentro de las ventanas medidas | **1,7 %** |

⚠️ **Regla que se aplica en todo el documento:** cuando una cifra viene de los 160 tramos, lleva
al lado su 4,4 %. Un porcentaje sobre el 4,4 % de la red **no es un porcentaje de la red**.

**Cero peticiones de red.** Los portales se leyeron **en lectura pura** del dataset heredado, que
vive fuera de este repositorio; no se ha copiado ni un fichero.

---

## ⚠️ 0 bis · TRES CORRECCIONES A NÚMEROS YA PUBLICADOS

Al remedir para diseñar aparecieron tres discrepancias con `docs/INVENTARIO-FUENTES-ZARAGOZA.md`.
Los informes son registro histórico y no se reescriben; `DESPLAZAME-ESTADO.md` tiene otro escritor.
**La corrección vive aquí, que es documento nuevo, y está reportada hacia arriba.**

### C1 · Los "106 puntos de cruce" son **89**

```
pares de tramos que se cruzan  :  87   ✅ coincide con el informe
puntos SIN deduplicar          : 106   <- el numero publicado
puntos deduplicados a 0,01 m   :  89   <- puntos de cruce DISTINTOS
puntos deduplicados a 0,50 m   :  89   <- estable: no depende del umbral
```

Un cruce que cae sobre un vértice lo encuentran **los dos segmentos** que comparten ese vértice, y
el contador sumaba uno por cada pareja de segmentos. Es el fallo nº10 de la bitácora (el mismo
tramo contado 8 veces) una escala más abajo: ahora es el mismo **punto**.

**La conclusión del informe no cae:** la topología sigue estando en las intersecciones. Lo que
cambia es el tamaño del trabajo — **89 cortes, no 106**. Bitácora nº30.

### C2 · "La misma zona del casco" eran dos rectángulos que solapan un 21 %

```
ventana municipal (EPSG:25830) : X 675850..676250  Y 4613850..4614250   400 x 400 m
ventana OSM (declarada, 4326)  : X 675482..675971  Y 4613674..4614130   489 x 456 m
SOLAPE                          : 121 x 280 m = 33.832 m2  = 21 % de la municipal
```

Prueba directa: de los **514 vértices** de la geometría municipal del casco, sólo **27 (5,3 %)**
caen dentro de la caja OSM declarada.

⇒ **La frase "54 ways de calzada en OSM frente a 19 tramos municipales en una ventana equivalente"
no se sostiene**: son dos sitios distintos. En el terreno realmente común (0,034 km²) hay **5
tramos municipales y 26 ways de OSM (7 de calzada)** — muestra demasiado pequeña para concluir
nada sobre densidad.

⚠️ **Lo que NO cae:** que OSM tenga 115 aceras, 43 pasos y 26 escaleras y el municipal **cero** de
las tres. Ese contraste no depende del encuadre: cero es cero en cualquier ventana. Bitácora nº31.

*(La transformación entre sistemas se derivó del par de crudos `SINsrs`/`EPSG4326` —la misma
feature servida en metros y en grados—, con control: 119 puntos, error medio 0,29 m, máximo
1,46 m, ida y vuelta a 0,6 m.)*

### C3 · Los "4 tramos duplicados" son **2 pares**

El informe cuenta **coincidencias de extremo**, no pares de tramos. Los duplicados reales son dos:

```
fid  231 SAN BRUNO  ==  fid 2619 SAN BRUNO   (2 puntos, 20,4 m, geometria identica)
fid  251 ARIÑO      ==  fid 2798 ARIÑO       (4 puntos, 52,8 m, geometria identica)
```

Cada uno aporta `ini/ini` + `fin/fin` = 4 coincidencias, más una suelta (`DEÁN` fin = `SAN BRUNO`
fin, geometrías distintas: un fondo de saco real). 4 + 1 = 5 = 21 − 16. **Cuadra.** No es un
error: es una ambigüedad de unidades. Pero para el diseño importa la cifra correcta, porque son
**2 tramos a eliminar, no 4**.

---

## P0 · ⭐⭐ ¿HACEN FALTA LAS DOS REDES?

### P0.1 · Qué aporta el municipal que OSM no tenga

Medido sobre los 160 tramos:

| Aporta | Medición | Sustituible por OSM? |
|---|---|---|
| ⭐ **`codigo` de vía** = puente exacto con los 46.150 portales | 108 códigos distintos en la muestra; **101 tienen portales** | ❌ **No.** OSM no tiene el identificador municipal |
| Sentido de circulación | `doble_sent`: 49 SI / 111 NO | Parcialmente (`oneway`) |
| Límite de velocidad | 0/10/20/30/50/80/120, sin huecos | Parcialmente (`maxspeed`) |
| ⭐ Jerarquía viaria | 6 clases, **completa en los 160** | ❌ Aproximable, no idéntica |
| Peatonalidad | `06_Peatonal` en 35 (22 %), `plataforma=SI` en 55 | Sí (`pedestrian`) |
| ⭐ **Cobertura municipal verificada** | Valdespartera (periferia sur, 6 km) devuelve features | ⚠️ **NO MEDIDO** en OSM |
| Longitud declarada | cuadra con la geometría (±0,06 m, informe 0.D) | Calculable |

⚠️ **Trampa detectada al medir:** el campo `longitud` es la longitud de **la feature entera**, no
del trozo dentro de la ventana. Sumar `longitud` sobre una consulta por bbox da 72.874 m en un
cuadrado de 400×400 m. Cualquier estadística de densidad que use ese campo sale mal.

### P0.2 · Qué aporta OSM que el municipal no tenga

| Aporta | Medición (309 ways del casco) |
|---|---|
| ⭐ **Aceras como línea** | 115 `footway=sidewalk` · municipal: **0** |
| ⭐ **Pasos de peatones como línea** | 43 `footway=crossing` · municipal: **0** |
| ⭐ **Escaleras** | 26 `highway=steps` · municipal: **0** |
| Isletas | 6 `traffic_island` · municipal: **0** |
| ⭐⭐ **Nodalización por diseño** | 411 de 1.045 nodos compartidos por ≥2 ways (**39,3 %**); máximo 4 ways en un nodo |
| ⭐⭐ **Declara dónde NO se anda** | `foot=use_sidepath` en 32 y `foot=no` en 5, de 60 calzadas (**62 %**) |
| ⭐⭐ **Declara si su acera está aparte** | `sidewalk:*` en 48 de 60 calzadas (**80 %**); 40 dicen `separate` |
| Señal de nivel | ⚠️ **NO MEDIBLE AQUÍ** — ver P2.2 |

⚠️ **Matiz importante que el informe redondea:** el municipal no tiene *cero red peatonal*. Tiene
**35 tramos `06_Peatonal` (22 % de la muestra)** — calles peatonales enteras. Lo que no tiene es
**aceras, pasos y escaleras**. Son cosas distintas y la diferencia decide el nivel 2.

### P0.3 · ⭐ ¿Sólo OSM como geometría, y el municipal como atributos?

**Analizada en serio. La respuesta es NO, y el motivo es medible.**

El argumento a favor es real: elimina de raíz la duplicación, y OSM llega ya nodalizado. El
argumento en contra es **el puente de los portales**, y pesa más:

- Origen y destino de **toda** ruta son portales. Son 46.150 y **traen `codigoVia`**.
- Contra geometría municipal ese enganche es **un `JOIN` por identificador exacto**.
- Contra geometría OSM sería **emparejamiento por nombre y cercanía** — el mismo mecanismo que
  falló en el **29,6 %** del enriquecimiento territorial (bitácora nº2).

Y el emparejamiento por nombre está medido, en la misma ventana:

```
municipal: 'ALVAREZ CASTA'   'ABEN AIRE'   'ARMAS'
OSM      : 'CALLE DE CASTA ALVAREZ'   'CALLE DE AGUADORES'   'CALLE DE LAS ARMAS'
```

El municipal **invierte nombre y apellido**, trunca a la anchura del campo y omite el genérico.
De 20 palabras municipales, 9 aparecen en OSM. **No es un join: es un problema de normalización
con cola larga**, y su cola son justo los casos raros que nadie prueba.

**Qué se pierde al descartarlo:** la simplicidad. Con OSM sólo habría una geometría, un espacio de
nodos y ningún riesgo de duplicar. Se renuncia a eso a cambio de conservar la única unión exacta
del proyecto.

⚠️ **Y hay un segundo motivo, este NO MEDIDO:** no sabemos la cobertura de OSM en toda la ciudad.
Hemos visto 0,22 km² del casco antiguo — el barrio mejor mapeado de cualquier ciudad. Apostar la
geometría entera a OSM sin medir la periferia sería decidir sobre el mejor caso.

### P0.4 · ¿Sólo el municipal, renunciando al nivel 2?

**No es la decisión de Antonio** (el nivel 2 está cerrado en `DESPLAZAME-ESTADO.md` §5). Se
escribe el coste para que la alternativa quede documentada:

- Se gana: una sola fuente, sin ODbL, sin cosido, sin duplicación. El grafo se planariza y ya.
- Se pierde: **no sabe que hay que cruzar la calle.** La ruta acierta la calle y no el lado; los
  46.150 portales quedan pegados al eje de la calzada; y desaparece la escena que se entiende en
  veinte segundos —*te manda al paso de cebra*—, que es lo que hace la demo.
- Y se pierde la **única señal de nivel** disponible con cobertura: OSM (`bridge`, `layer`).

### P0.5 · ⭐ RECOMENDACIÓN

**Hacen falta las dos, con papeles distintos y sin solaparse.** No es "fusionar dos redes": es una
red con dos capas de origen y **una regla de precedencia**.

| Capa | Fuente | Papel |
|---|---|---|
| **Calzada** | Municipal | Geometría del grafo rodado, atributos, **y el ancla de los portales** |
| **Pie fino** | OSM | Aceras, pasos, escaleras. **Es donde anda el peatón** |
| **Nivel** | OSM (`bridge`/`layer`) + jerarquía municipal | Desambiguar cruces |

La duplicación se evita **con una regla, no con un borrado**: donde OSM declara acera separada, el
eje municipal **no es transitable a pie** — sólo sostiene el portal. Ver P3.1.

---

## P1 · QUÉ SE PARTE Y QUÉ NO

**Vocabulario, una vez:** *planarizar* es partir cada línea en sus cruces con otras para que
compartan un punto. *Coser* (o *soldar*) es acercar dos puntas sueltas hasta unirlas.

### P1.1 · Los casos que se ven igual en el dato y no son lo mismo

| Caso | Cómo se reconoce | Qué debe hacer el planarizado | Medido |
|---|---|---|---|
| **Cruce en X** | intersección con `t` interior en **ambos** | partir los dos | 89 puntos totales |
| **Cruce en T** | extremo de A sobre la línea de B | partir **sólo B**; el extremo de A se suelda | **8 extremos** a <2 m caen en medio de otro |
| **Punta con punta** | dos extremos a <tol | soldar, **no partir** | 23 extremos a <2 m caen cerca de otra punta |
| **Glorieta** | ⚠️ *ver abajo* | unir los arcos entre sí | **6 tramos** dicen `ROTONDA` |
| **Paso elevado** | intersección **sin** contacto real | ⛔ **NO partir** | ver P2 |
| **Calle sin salida** | extremo lejos de todo | dejar como está; es correcto | 35 extremos a >50 m |
| **Tramo que muere en nada** | idem, pero debería conectar | **no distinguible del anterior** | ⚠️ ver P5.1 |
| **Geometría duplicada** | dos tramos idénticos | eliminar uno **antes** de nada | **2 pares** (C3) |
| **Solape parcial** | comparten un trozo, no todo | ⚠️ **NO MEDIDO** | — |

⚠️ **Hallazgo sobre las glorietas: no son anillos.** De los 160 tramos, **cero tienen geometría
cerrada** (primer punto = último). Los seis que dicen `ROTONDA` son **arcos abiertos** de 58 a
108 m. Una glorieta llega al dato **partida en trozos que no se tocan**, y sin planarizar es un
callejón sin salida en mitad de la ciudad.

### P1.2 · ¿Se parte en toda intersección? — No. Tres excepciones

1. **Desnivel probable** (P2). Es la excepción cara.
2. **Intersección que ya cae sobre un extremo** existente (P1.3): no se parte, se funde.
3. **Tramos duplicados**: se elimina el duplicado antes, o el cruce se parte dos veces contra sí
   mismo.

### P1.3 · Cuando la intersección cae muy cerca de un extremo

**Medido**, distancia de cada uno de los 89 puntos de cruce al extremo más cercano de los dos
tramos implicados:

```
[ 0.00 ,  0.01) m : 36     <- ya coincide con un extremo
[ 0.01 ,  1.00) m :  0     <- ⭐ VACIO
[ 1.00 ,  2.00) m :  2
[ 2.00 ,  5.00) m :  1
[ 5.00 , 10.00) m :  0
[10.00 , 20.00) m :  6
[20.00 , 50.00) m :  2
[50.00 ,    inf) m : 42
```

⭐ **Hay un vacío perfecto entre 0,01 y 1,00 m.** No es un valle estrecho: **no hay ni un solo
punto**. Un cruce, o cae exactamente sobre un extremo, o cae a más de un metro.

**Regla:** si la intersección cae a **< 1 m** de un extremo, no se crea nodo nuevo: se **funde con
el extremo**. Entre 1 y 5 m hay 3 casos — se parte, y se marcan para revisión.

**Qué se pierde:** los 3 casos de 1–5 m pueden ser esquinas mal digitalizadas donde fundir sería
lo correcto. Se prefiere partir porque partir de más deja dos nodos cerca (feo y navegable) y
fundir de más suelda dos calles distintas (invisible y roto).

### P1.4 · ⭐ La tolerancia para las puntas sueltas

⚠️ **El informe 0.D midió extremo contra EXTREMO. Eso no ve las T**, que son la mitad de las
uniones de una ciudad. Medido extremo contra **LÍNEA** (320 extremos, 4,4 % de la red):

```
                     extremo->EXTREMO (0.D)   extremo->LINEA (esta tanda)
ya soldados (<0,01 m)     21 pares de 320          55 de 320  (17,2 %)
mediana                       15,00 m                   5,10 m
p25                            3,15 m                   1,66 m
```

Histograma extremo→línea:

```
[ 0.00,  0.01) m : 55  ###########################
[ 0.01,  0.50) m :  1                                <- ⭐ VALLE
[ 0.50,  1.00) m :  7  ###
[ 1.00,  2.00) m : 23  ###########
[ 2.00,  3.00) m : 20  ##########
[ 3.00,  5.00) m : 51  #########################
[ 5.00,  8.00) m : 57  ############################
```

| Tolerancia | Extremos que suelda | Total soldado |
|---:|---:|---:|
| 0,5 m | +1 | 17,5 % |
| **1,0 m** | **+8** | **19,7 %** |
| **2,0 m** | **+31** | **26,9 %** |
| 3,0 m | +51 | 33,1 % |
| 5,0 m | +102 | 49,1 % |

⭐ **La red está mejor conectada de lo que decía el informe**: 17,2 % de extremos ya tocan otra
línea, no 21 pares de 320. Lo que faltaba era mirar contra la línea, no contra la punta.

**Propuesta: 2,0 m**, la misma cifra del estado, pero **ahora con la medición que la sostiene** —
antes venía del histograma equivocado. Justificación: de los 31 extremos que recupera, **8 son T
reales** (caen en medio de otro tramo) y 23 son puntas contra puntas.

⚠️ **A partir de dónde empiezan los falsos positivos: NO MEDIDO, y no es medible con esta muestra**
—habría que saber cuáles *deben* unirse, que es justo lo que no se sabe—. Lo que sí acota por
arriba: en el casco las calles miden 8–15 m y la mediana extremo→línea es **5,10 m**. **Cualquier
tolerancia ≥5 m está soldando cosas a distancia de calle entera.** Techo duro: 5 m. Por debajo de
1 m el vacío del histograma dice que se recupera casi nada (+8).

### P1.5 · ⭐ El orden importa, y está DEMOSTRADO con casos

**Primero eliminar duplicados → luego partir en cruces → luego soldar puntas.** No es preferencia:
invertir los dos últimos pasos produce nodos de más, y hay **9 casos en los 160 tramos** donde
ocurre. El más limpio:

```
extremo FINAL de fid 920 (DEÁN)
   esta a 1,12 m de la linea de fid 2163 (PALAFOX, JOSE)
   y esa proyeccion cae a 0,62 m del cruce fid2163 x fid2620 (SAN BRUNO)
```

- **Soldar primero:** la punta de DEÁN se proyecta sobre PALAFOX y crea un nodo. Después, el cruce
  PALAFOX×SAN BRUNO crea **otro nodo a 62 cm del primero**. Dos nodos donde hay una esquina. El
  mapa se ve idéntico y el motor ve dos sitios.
- **Partir primero:** el cruce crea el nodo; la punta de DEÁN, a 1,28 m, cae dentro de tolerancia y
  **se suelda a ese nodo**. Un nodo, una esquina.

⭐ Y nótese que el caso de `SAN VOTO` × `ARIÑO` implica al **par duplicado** (fid 251 / fid 2798):
si los duplicados no se eliminan primero, la punta de SAN VOTO se suelda a **dos** líneas encima
la una de la otra. De ahí que la eliminación de duplicados vaya la primera.

---

## P2 · ⚠️ CRUCE REAL O CRUCE FALSO, SIN CAMPO DE NIVEL

### P2.1 · Qué señales existen

**En el municipal — no hay campo de nivel.** Confirmado: los 22 campos son `calle_2024, calle_z30,
capacidad, carril_bus, carril_vh, codigo, direccion, doble_sent, fid, limite_vel, longitud,
malla_basi, municipal, observacio, pacificada, plataforma, pma_12_5_1, pma_18, residencia, tipo,
tipo_via, tramo`. **Ninguno indica cota, puente ni túnel.**

Pero hay **tres señales indirectas**, y esto no estaba apuntado:

| Señal | Qué dice | Medido (89 cruces) |
|---|---|---|
| ⭐ **Salto de `limite_vel` ≥ 50** | una vía de 120 no cruza a nivel una de 50 | **16 puntos (18 %)** |
| **Jerarquía distinta** (`01_CINTURON`/`02_Penetracion` contra el resto) | cinturón contra calle | 8 puntos más |
| **`municipal`: SI contra NO** | vía del Estado contra vía urbana | coincide con las anteriores |

⚠️ **Y una señal falsa que parece buena:** 9 tramos llevan **"PUENTE"** en su campo `tramo`. **No
son puentes.** Dicen `DE PUENTE ALMOZARA A PICASSO`: el puente es el **punto de referencia**, no
el tramo. Adoptarla como regla marcaría como elevada una avenida que va a ras de suelo entre dos
puentes. Se descarta explícitamente para que nadie la redescubra dentro de seis meses.

**En OSM:** `bridge`, `tunnel`, `layer`, `level`. Es la señal buena — cuando existe.

### P2.2 · ⭐ Cobertura de esas señales en OSM: **NO MEDIDA, y este crudo no puede medirla**

```
bridge : presente en   0 de 309 ways (0,0 %)
tunnel : presente en   1 de 309 ways (0,3 %)
layer  : presente en   1 de 309 ways (0,3 %)
level  : presente en   4 de 309 ways (1,3 %)
```

⚠️ **Ese 0 % NO significa que OSM no etiquete puentes.** Significa que **en el casco antiguo de
Zaragoza no hay pasos elevados**, así que no hay nada que etiquetar. Es un cero indistinguible de
"no he medido nada" (ley nº4 del proyecto), y aquí se sabe *por qué* es cero, que es lo único que
lo salva.

**Qué medición lo resolvería:** una consulta Overpass sobre una ventana **con paso elevado
conocido** — el cruce `GRACIA, LUCIANO` × `MADRID, AUTOVÍA DE`, en 675450–675971 / 4613674–4614130
aproximadamente — y contar `bridge=yes` sobre los ways de la autovía. **Es una petición, y esta
tanda no hace peticiones.** Queda anotada como lo primero que debe medirse al abrir H1.

### P2.3 · Qué hacer con un cruce sin señal

| Opción | Coste |
|---|---|
| **Unir por defecto** | Inventa cruces. Un peatón "cruza" una autovía por donde no se puede. El fallo es **invisible**: la ruta existe, es corta y es falsa |
| **No unir por defecto** | Parte la ciudad. El fallo es **visible**: "no hay camino" donde sí lo hay. Y P5.1 lo caza automáticamente |
| ⭐ **Marcar como dudoso** | Ni une ni parte: crea el nodo **marcado**, y decide una segunda regla |

**Propuesta: la tercera, con la asimetría explícita.** Un cruce dudoso se une **sólo si ninguna de
las dos vías es rápida**; si una lo es, no se une y **se registra en la lista de dudosos**, que es
un artefacto del proceso y se publica.

El motivo de la asimetría: **los dos errores no cuestan lo mismo.** No unir de más produce un fallo
que un contador detecta (componentes conexas). Unir de más produce una ruta plausible y falsa que
**sólo detecta alguien que se pare a mirar ese cruce**. Entre un fallo ruidoso y uno silencioso,
este proyecto elige el ruidoso.

### P2.4 · ⭐ Cuántos cruces dudosos habría

Sobre los 89 puntos medidos (4,4 % de la red):

```
cruce urbano normal (ambas lentas, misma familia) : 55  (62 %)
SOSPECHOSO (salto de velocidad o jerarquia)       : 24  (27 %)
ambas rapidas (enlace o desnivel entre autovias)  : 10  (11 %)
```

⚠️ **Uno de cada tres cruces de la muestra necesita decisión.** Y el 27 % está inflado por la
jerarquía sola: `ALMOZARA (01_CINTURON, 50)` × `ATARÉS (03_Distribuidoras, 50)` es casi seguro una
glorieta a nivel, no un puente. **Con el salto de velocidad ≥50 solo, bajan a 16 (18 %)**, y esos
16 son todos del mismo tipo: 120 contra 50.

⚠️ **Extrapolar sería inventar.** El 4,4 % medido incluye a propósito dos ventanas de puente y una
de nudo, así que está **sesgado hacia el desnivel**. La cifra de ciudad completa es `NO CONSTA`.

### P2.5 · El banco de pruebas: ¿lo resolvería la regla?

```
fid 1322/1323  GRACIA, LUCIANO     tipo=03_Distribuidoras  vel=50   municipal=SI
fid 3318/3319  MADRID, AUTOVIA DE  tipo=01_CINTURON        vel=120  municipal=NO
4 puntos de cruce, los 4 EN MEDIO de ambos tramos (a 55-780 m de sus extremos)
```

**Sí, y por tres caminos independientes**: salto de velocidad 70, jerarquía distinta, y
`municipal` distinto. Los cuatro puntos se marcan como no unibles.

⚠️ Pero **acertar el caso que se usó para inventar la regla no es validarla.** El banco de pruebas
está sesgado por construcción: es el ejemplo que hizo pensar en la regla. **Lo que valida la regla
es el caso contrario**, y ése no lo tenemos: un paso elevado entre dos calles de la misma velocidad
y la misma jerarquía —una pasarela peatonal sobre una calle de 30, un túnel bajo una plaza—
**pasaría desapercibido**. La regla tiene un falso negativo conocido y no medido.

---

## P3 · CÓMO SE COSEN LAS DOS REDES

### P3.1 · ⭐ La duplicación: un camino o tres

**La respuesta está en el propio OSM, y está medida:**

```
sidewalk:*  declarado en 48 de 60 calzadas (80 %)   -> 40 dicen "separate"
foot=use_sidepath  en 32 calzadas
foot=no            en  5 calzadas
                    -> 37 de 60 (62 %) dicen explicitamente "no andes por aqui"
```

⭐ **OSM no sólo trae la acera: trae la declaración de que la acera está aparte.** Eso es
exactamente el dato que impide contar el camino dos veces, y viene gratis.

**Regla de precedencia (no se borra nada, se etiqueta):**

| Situación | El eje de calzada es… | Se anda por… |
|---|---|---|
| OSM dice `sidewalk=separate` o `foot=use_sidepath` | **no transitable a pie** | la acera OSM |
| OSM tiene acera pero no lo declara | no transitable a pie, **marcado dudoso** | la acera OSM |
| OSM no tiene acera ahí | **transitable a pie, precisión baja** | el eje |
| Calle `06_Peatonal` municipal | transitable | el propio eje |

Así el motor ve **un** camino a pie, siempre. Y el eje de calzada sigue existiendo —lo necesita el
portal, y lo necesitarán H2 y H3— pero con el peso de peatón desactivado.

**Alternativa descartada:** borrar el eje donde haya acera. Se descarta porque **el portal cuelga
del eje** y porque el eje es la geometría que lleva `codigo`, sentido y velocidad. Borrarlo para
resolver un problema de peatones rompería el enganche de direcciones y el trabajo de H2.

**Qué se pierde con la regla propuesta:** el grafo tiene más aristas de las que un peatón puede
usar, y hay que acordarse de filtrarlas en cada consulta peatonal. Un filtro olvidado = rutas por
mitad de la calzada. Va a las contrapruebas.

### P3.2 · Dónde se conectan las dos redes

Tres puntos de sutura, en este orden de preferencia:

1. ⭐ **Por los pasos de peatones.** Los 43 `footway=crossing` **ya cruzan** la calzada: su
   geometría corta el eje municipal. Ahí el cosido es una intersección más — el mismo planarizado.
2. **Por los extremos de acera**, cuando una acera muere en una esquina sin paso mapeado.
3. **Por el enganche del portal**: el portal está en la acera y su `codigo` apunta al eje. Es una
   costura natural entre las dos capas.

⚠️ **"Cada cuánto" es la pregunta equivocada.** Coser a intervalos fijos —cada 50 m, por ejemplo—
crearía cruces de calzada donde no los hay, que es exactamente el fallo que el nivel 2 viene a
resolver. **Se cose donde el dato dice que se cruza, y en ningún otro sitio.**

### P3.3 · Donde OSM no tiene acera

Es lo normal fuera del centro, y **cuánto es NO CONSTA**: sólo hemos visto 0,22 km² del casco.

**Comportamiento propuesto:** el eje municipal queda transitable a pie con un atributo
`precision = eje` y una penalización de coste que refleje que el peatón no va por el medio de la
calzada. **No se inventa la acera.** Inventar dos líneas paralelas a 3 m del eje produciría un
grafo que se ve perfecto y miente sobre qué lado tiene acera.

### P3.4 · ⭐ Cómo se le dice al usuario

**Decisión de honestidad, y encaja con la tesis del portfolio.** Cada arista lleva su `precision`
(`acera` / `paso` / `eje`), y la ruta hereda la peor de las que usa. La app lo dice **en la propia
lista de pasos**, no en un aviso legal al pie:

> *"Camina 300 m por Calle X — **por aquí sólo sé la calle, no de qué lado va la acera**."*

**Alternativa descartada:** un aviso global ("la precisión puede variar"). Se descarta porque un
aviso que sale siempre no lo lee nadie, y porque **la información existe por tramo**: degradarla a
un aviso global sería tirar un dato que ya tenemos.

### P3.5 · La ODbL: qué queda contagiado

Con claridad y sin dictaminar como abogado:

- **El código sigue siendo Apache 2.0.** No lo toca.
- **El grafo generado sí es una base de datos derivada de OSM** en cuanto contenga geometría o
  topología procedente de OSM. El artefacto que se publique o se sirva **hereda la ODbL**.
- No se libra separando ficheros: si el grafo peatonal usa aceras de OSM, ese grafo es derivado
  aunque viva en otro `.json` que el de calzada.
- **Qué hay que declarar y dónde:** atribución a OpenStreetMap y mención de la ODbL (a) en el
  `README`, (b) en la propia app, visible en el mapa, y (c) **dentro del artefacto de grafo**, en
  su metadata, para que viaje con el fichero y no dependa de que alguien lea el repositorio.
- ⚠️ **Y la trampa ya detectada** (bitácora nº29): algunas capas *municipales* son derivadas de OSM
  (`Carreteras_cartoOSM_2019_*`, con `OSM_ID`) y el catálogo no lo dice. `MU1_jerarquia_viaria` no
  es una de ellas —no tiene `OSM_ID`—, pero la comprobación hay que hacerla **a cada capa
  municipal que entre**, no una vez.

---

## P4 · CÓMO SE ENGANCHA UN PORTAL A SU TRAMO

### P4.1 · El mecanismo: por `codigoVia`, con la geometría de árbitro

⚠️ **Detalle que revienta el `JOIN` si no se ve:** el tipo no coincide.

```
portales : "codigoVia": "40"    <- CADENA
MU1      : "codigo"   : 60      <- ENTERO
```

Un `JOIN` directo daría **cero coincidencias**, y cero es la respuesta que no avisa. Se normaliza a
entero **y se comprueba con un positivo de control** antes de seguir.

**Medido** (807 portales dentro de las 11 ventanas, 1,7 % del total):

```
el tramo mas cercano ES el de su codigoVia : 682  (84,5 %)
el mas cercano es OTRA calle               :  28  ( 3,5 %)
su calle no esta en la muestra             :  97  (12,0 %)   <- borde de ventana
```

**Propuesta: los dos, con el código mandando.** El portal se engancha al tramo **de su
`codigoVia`**, y la geometría elige *en qué punto* de esa calle. La proximidad nunca decide **a qué
calle** pertenece un portal: sólo dónde.

### P4.2 · Cuando el código dice una calle y la geometría dice otra

Ocurre en el **3,5 %** de la muestra. Los casos son reconocibles:

```
numero 1     cod= 6980  mas cercana: RIBERA, DE LA        28,0 m  vs  su calle a 72,8 m
numero 2-4-6 cod= 7120  mas cercana: RIBERA, DE LA        11,8 m  vs  su calle a 18,4 m
numero 19    cod= 4480  mas cercana: CASAS, DOCTOR         4,6 m  vs  su calle a  8,9 m
numero 31    cod= 9040  mas cercana: SAN VICENTE MARTIR   11,5 m  vs  su calle a 14,5 m
```

Mediana de cuánto más lejos está su calle real: **5,1 m**. Son **esquinas**: el portal está en el
chaflán, más cerca del eje de la transversal que del suyo.

**Regla:** manda el código. **Siempre.** Y si la distancia a su propia calle supera un umbral, no
se cambia de calle: **se marca**. Cambiar de calle por cercanía es reintroducir el emparejamiento
aproximado por la puerta de atrás.

**Qué se pierde:** los portales cuyo `codigoVia` esté mal en origen quedarán mal enganchados y el
sistema no los corregirá solo. Es deliberado: un error de la fuente que se propaga es diagnosticable;
una corrección automática silenciosa, no.

### P4.3 · ⭐⭐ ¿De qué lado de la calle está el portal?

**Sí se puede saber, y por dos caminos que se pueden contrastar.**

**Camino 1 — geometría.** El signo del producto vectorial del portal respecto al segmento más
cercano da el lado. Medido sobre los 807: **474 a un lado, 333 al otro**, cero indeterminados. Es
un cálculo exacto: no falla, porque no depende de ningún dato ajeno.

**Camino 2 — paridad.** Sobre los 46.150 portales:

```
pares    : 22.125  (47,9 %)
impares  : 21.855  (47,4 %)
ilegibles:  2.170  ( 4,7 %)   <- "2-4-6", letras, bloques
```

⚠️ **Pero la paridad NO dice el lado por sí sola.** Dice que los pares van juntos y los impares
van juntos; **qué lado es cada uno depende de la calle** y no está en ningún campo. La paridad
sirve como **control cruzado**: si en una calle el lado geométrico y la paridad no se corresponden,
algo está mal en esa calle — y eso es una comprobación gratis sobre 95 % de los portales.

**Lo que esto implica para la promesa de la app:** el lado del portal se sabe. **Lo que no se sabe
es a qué acera de OSM corresponde ese lado** hasta que el cosido esté hecho, y en las zonas sin
acera OSM no se sabrá nunca (P3.3). La app puede decir *"acera de los pares"* con seguridad; decir
*"cruza aquí"* sólo donde haya paso mapeado.

### P4.4 · Portales lejos de cualquier tramo

Medido sobre los 807 (⚠️ contra los 160 tramos de la muestra, no contra los 3.644):

```
min 0,29   p25 4,18   MEDIANA 6,62   p75 9,45   p90 22,75   max 185,58  (m)
a mas de  10 m : 174 (21,6 %)
a mas de  30 m :  54 ( 6,7 %)
a mas de 100 m :  13 ( 1,6 %)
```

La mediana de **6,62 m** es media calle: exactamente lo que se espera de un portal en la acera.

⚠️ **La cola está inflada por el método**: un portal junto al borde de la ventana puede tener su
calle fuera de la muestra. El 12 % de "su calle no está en la muestra" es la misma causa. **La
cifra limpia sale gratis al descargar la capa entera** — es la primera comprobación de H1.

### P4.5 · ¿Partir el tramo por cada portal?

**No. Posición sobre la arista.** Cada portal guarda `(fid del tramo, distancia desde el inicio,
lado)`.

| | Partir por cada portal | Posición sobre la arista |
|---|---|---|
| Aristas resultantes | 3.644 + ~46.150 = **~50.000** | 3.644 (+ cortes de planarizado) |
| Nodos | +46.150 | +0 |
| Coste de búsqueda | el grafo crece ×14 **para nodos que casi nunca son intermedios** | intacto |
| Enganche | implícito | una proyección al empezar y otra al acabar |

Un portal es **origen o destino, nunca paso**. Meterlo como nodo permanente hace pagar a todas las
búsquedas un coste que sólo usan dos nodos de cada ruta.

**Qué se pierde:** hay que proyectar el punto sobre la arista en tiempo de consulta, y el primer y
último tramo del camino son parciales — el coste hay que prorratearlo. Es aritmética, no
estructura.

---

## P5 · ⭐⭐ CÓMO SE DEMUESTRA QUE EL RESULTADO ES UNA RED

### P5.1 · Componentes conexas

Una *componente conexa* es un grupo de nodos que se alcanzan entre sí. Un grafo bien cosido tiene
**una componente gigante** y unas pocas motas.

| Métrica | Qué se espera | Qué dispara la alarma |
|---|---|---|
| **% de nodos en la mayor** | ≥ 97 % | ⛔ **< 95 % para el despliegue** |
| Nº de componentes con ≥50 nodos | 0–2 | ⚠️ ≥3: hay un trozo de ciudad suelto |
| Componentes de 1 nodo | pocas | son tramos huérfanos reales (fondos de saco) |

⚠️ Los umbrales **NO ESTÁN MEDIDOS** — no puede haberlos hasta que exista el primer grafo. Se
declaran como lo que son: el primer valor observado se convierte en la línea base, y a partir de
ahí **lo que se vigila es la variación** (P6.5).

⭐ **Y esto resuelve el caso indistinguible de P1.1:** un fondo de saco legítimo y un tramo que
debería conectar se ven igual en el dato, pero **no en el grafo**: el segundo deja una componente
huérfana. No hay que distinguirlos de antemano; hay que dejar que el contador los saque.

### P5.2 · ⭐⭐ LOS RÍOS — la prueba explícita

El Ebro, el Huerva y el Gállego parten la ciudad. **Un puente sin coser deja media ciudad
incomunicada y el mapa se ve perfecto.**

**Prueba de puentes: 12 pares obligatorios.** Para cada río, pares de puntos a un lado y otro que
**tienen que** tener camino a pie, y cuya longitud debe estar dentro de lo razonable:

| Río | Pares | Referencias reales presentes en la muestra |
|---|---:|---|
| **Ebro** | 6 | `ATARÉS, JOSÉ` tramos *"DE PUENTE ALMOZARA A PICASSO"*, *"DE PUENTE SANTIAGO A PUENTE…"*, `RANILLAS`, `ALMOZARA`, `HISPANIDAD`, `MADRID, AUTOVÍA DE` |
| **Huerva** | 4 | `TENOR FLETA`, `TORRES, DE LAS`, `SAN VICENTE MÁRTIR`, `LEÓN XIII` |
| **Gállego** | 2 | zonas `gallego_sur` (desembocadura) y `gallego_urb` |

⭐ **Y la prueba lleva su propio control positivo:** un par de puntos **al mismo lado** del río, a
distancia parecida. Si el par cruzado falla y el par del mismo lado también, el fallo es del motor,
no del puente. **Sin ese control, un "no hay camino" no distingue un puente descosido de un motor
roto** — que es exactamente la confusión que costó cara en 003.

⚠️ El Ebro lleva 6 y no 2 porque **cada puente es un punto de fallo independiente**: coser tres
puentes y perder el cuarto sigue dejando barrios aislados, y con dos pares podría no notarse.

### P5.3 · ⭐ CONTRAPRUEBAS — el fallo se planta a propósito

⛔ Nada de "se revisará visualmente". Cada paso tiene un fallo plantado y un número que se pone
rojo.

| # | Paso | Fallo que se PLANTA | Instrumento que debe ponerse ROJO |
|---|---|---|---|
| 1 | Puentes | **Borrar un tramo de puente sobre el Ebro** antes de generar | ⭐ La prueba de los 6 pares del Ebro falla; y **% en la componente mayor cae** |
| 2 | Puentes | Borrar el puente **y** su par de control del mismo lado | Los dos fallan → el diagnóstico dice **"motor", no "puente"**. Es la contraprueba de la contraprueba |
| 3 | Nivel | **Forzar la unión** de `GRACIA, LUCIANO` × `MADRID, AUTOVÍA DE` | La ruta entre los dos lados de la autovía **acorta bruscamente**: se compara contra la línea base y una caída >30 % en un par vigilado para |
| 4 | Nivel | Marcar un cruce normal como desnivel | Aparece una componente huérfana o el % de la mayor baja |
| 5 | Aceras | **Desactivar el filtro `foot`** y dejar la calzada transitable | ⭐ **Nº de rutas peatonales que usan aristas `precision=eje` se dispara** — hoy debería ser sólo el de las zonas sin acera. Contador publicado |
| 6 | Aceras | Duplicar una acera (cargarla dos veces) | Nº de aristas peatonales sube sin que suba la longitud total peatonal única → **detector de solape** |
| 7 | Portales | Cambiar el `codigoVia` de 100 portales | ⭐ El % de "el más cercano es el de su código" cae del 84,5 % medido → **el contador ya existe** |
| 8 | Portales | Convertir `codigoVia` a texto y no normalizar | El `JOIN` da **cero**. ⚠️ Por eso el proceso **exige un positivo de control**: si el nº de portales enganchados es 0, para |
| 9 | Duplicados | No eliminar el par `SAN BRUNO` / `ARIÑO` | Nº de aristas con geometría idéntica > 0 → para |
| 10 | Planarizado | Ejecutar soldadura **antes** que partición | ⭐ Nº de pares de nodos a <1 m entre sí sube (caso `DEÁN`/`PALAFOX`: 0,62 m) |
| 11 | Tolerancia | Subirla a 5 m | Nº de nodos fundidos sube ~3×; **par de control de dos calles paralelas que NO deben unirse** pasa a tener camino directo → rojo |
| 12 | Componentes | Aislar un barrio a mano | % en la mayor < 95 % → para el despliegue |

⭐ **La contraprueba nº2 es la que este proyecto ya sabe que necesita:** un fail-safe que no
distingue el fallo propio del ajeno acaba culpando al tercero.

### P5.4 · Rutas de cordura — la demo lleva el peor caso de cada dimensión

⚠️ **Las distancias esperadas son estimaciones a ojo sobre el mapa, NO MEDIDAS.** Se apuntan como
orden de magnitud para que una ruta absurda cante; se sustituyen por el valor real en cuanto exista
el primer grafo.

| Dimensión | Trayecto | Aprox. | Qué pone a prueba |
|---|---|---|---|
| **Río** | Casco antiguo ↔ Actur (cruzando el Ebro) | ~2,5 km | Puentes cosidos |
| **Casco** | Dentro del casco antiguo, trama irregular | ~400 m | Peatonales, calles estrechas, 06_Peatonal |
| **Escaleras** | Un trayecto que use `highway=steps` | ~300 m | La capa OSM aporta lo que el municipal no tiene |
| **Periferia** | Valdespartera, sin aceras en OSM | ~1 km | `precision=eje` y el aviso honesto |
| **Autovía** | Dos lados de `MADRID, AUTOVÍA DE` | ⚠️ **largo a propósito** | ⭐ Que **NO** cruce por donde no se puede |
| **Glorieta** | A través de una `ROTONDA` | ~200 m | Los arcos sueltos, cosidos |
| ⭐ **Control negativo** | Mismo lado del río, distancia parecida al par del río | ~2,5 km | Si falla, el problema es el motor |

### P5.5 · Números que se publican con el grafo

Para que un tercero lo compruebe sin fiarse:

```
nodos · aristas · longitud total (m) · componentes conexas · % en la mayor
aristas por precision: acera / paso / eje
cruces partidos · cruces marcados como dudosos (con su lista)
puntas soldadas (y con qué tolerancia) · duplicados eliminados
portales enganchados / total · portales marcados por discordancia codigo-geometria
fecha de cada fuente · version del proceso
```

⭐ **La lista de dudosos se publica entera, no sólo su total.** Un total no se puede auditar: es
exactamente lo que dejó pasar el 106 durante dos tandas.

---

## P6 · CÓMO ENVEJECE ESTE GRAFO

### P6.1 · ⭐⭐ Reproducibilidad — y dónde se rompe hoy

**LEY: el grafo no se edita, se genera.** El artefacto es desechable; el proceso es lo que se
conserva.

| Paso | ¿Sin intervención humana? |
|---|---|
| Descargar `MU1_jerarquia_viaria` | ✅ |
| Descargar la red peatonal OSM | ✅ |
| Eliminar duplicados · planarizar · soldar | ✅ determinista |
| Enganchar portales por `codigoVia` | ✅ |
| Verificar (P5) | ✅ |
| ⛔ **Decidir un cruce dudoso nuevo** | ❌ **NO** |

⚠️ **Ahí se rompe, y se dice como el problema que es.** Un cruce dudoso que aparece por primera vez
tras un cambio de la fuente **no se puede resolver solo**. Se propone el comportamiento seguro:
**el dudoso nuevo queda sin unir y aparece en un informe de la regeneración.** El grafo sale igual,
con un trozo de menos y diciéndolo.

### P6.2 · ⭐ Dónde viven las excepciones

Fichero versionado en el repositorio —`data/excepciones-grafo.json` o equivalente—, **leído por el
proceso en cada regeneración**, con esta forma por entrada:

```
que se corrige (par de tramos, cruce, nodo)  ·  que se hace (unir / no unir / eliminar)
POR QUE, en una frase   ·   fecha   ·   quien
COMO SE COMPRUEBA QUE SIGUE HACIENDO FALTA
```

⭐ **El último campo es el que evita el sedimento.** Cada excepción declara la condición que la
justifica (*"mientras el tramo fid 3318 y el fid 1322 se crucen sin que ninguno declare `bridge`"*).
En cada regeneración el proceso **reevalúa esa condición**: si ya no se cumple —el dato se arregló
en origen— la excepción se marca **OBSOLETA** en el informe. No se borra sola: se avisa. Borrar
sola una excepción es otra edición invisible.

⚠️ Y una excepción que **no se puede aplicar** (el `fid` ya no existe) es un **error ruidoso**, no
un aviso: significa que la fuente cambió debajo y alguien tiene que mirar.

### P6.3 · Ritmo por fuente

| Fuente | Ritmo | Argumento |
|---|---|---|
| **GTFS del NAP** | ⛔ **Fecha fija: antes del 05/10/2026**, y luego mensual | No envejece: **caduca**. Es lo único con fecha de muerte escrita |
| **`MU1_jerarquia_viaria`** | Trimestral | Una calle nueva tarda meses en abrirse y más en publicarse |
| **Portales** | Trimestral, con el viario | Comparten espacio de identificadores: desincronizarlos rompe el puente |
| **OSM** | Mensual | Cambia a diario, pero **lo que nos importa (aceras, pasos, escaleras) cambia despacio**; y cada descarga es coste ajeno |

⚠️ **No son cifras medidas** — nadie ha observado todavía cuánto cambia cada fuente. Son puntos de
partida. La medición que los convertiría en dato: guardar el hash de cada descarga y ver cuántas
regeneraciones consecutivas producen un grafo idéntico. **Si nunca cambia, el ritmo sobra; si
cambia siempre, se queda corto.**

### P6.4 · El disparador manual

**Protegido con token en cabecera y fallo cerrado**, como en 003:

- Sin token o token inválido → **401**, no 404. *(Un 404 finge que la ruta no existe y convierte un
  problema de permisos en un problema de rutas para quien lo depura.)*
- **Un solo proceso a la vez.** Una segunda petición mientras hay una en marcha → **409**, no una
  segunda descarga. Sin esto, el disparador es una forma de pedirle al Ayuntamiento 3.644 tramos
  tantas veces por minuto como quiera quien tenga el token — **en nuestro nombre**.
- El token vive **fuera del repositorio** (§5 del estado: el entorno local no vive aquí).

### P6.5 · ⭐⭐ Cómo se sabe que una regeneración ha empeorado las cosas

**Se compara el grafo nuevo contra el anterior. Siempre. Y el criterio distingue el fallo propio
del ajeno.**

| Se compara | Variación normal | ⛔ PARA el despliegue |
|---|---|---|
| Nº de nodos y aristas | ±2 % | **±10 %** |
| Longitud total | ±2 % | **±10 %** |
| % en la componente mayor | ±0,5 pp | **cae >1 pp**, o baja de 95 % |
| Pares de la prueba de ríos | 12 de 12 | **cualquiera que falle** |
| Portales enganchados | ±1 % | **cae >2 %** |
| Cruces dudosos | ±5 | **aparece uno nuevo sin resolver** → despliega y avisa |

⭐ **Y la parte que 003 pagó cara — distinguir de quién es el fallo.** Antes de culpar a nadie, la
regeneración clasifica:

| Síntoma | Diagnóstico | Qué hace |
|---|---|---|
| HTTP 5xx / timeout / 0 features | **fuente caída** | Conserva el grafo anterior. Dice *"fuente caída"* |
| Descarga OK, pero el nº de features cambia >10 % | ⚠️ **la fuente cambió de verdad** | ⛔ **No despliega.** Ni "fuente caída" ni "todo bien": **cambió el mundo** y hay que mirar |
| Descarga OK, features normales, **el grafo sale mal** | ⭐ **fallo NUESTRO** | ⛔ No despliega. Y **no dice "fuente caída"** |

⚠️ **La fila del medio es la que faltaba en 003.** Con dos categorías —"fuente caída" y "todo
bien"— un cambio real de la fuente se cuela por la segunda y se despliega degradado. Con tres, no
hay ninguna donde esconderlo.

### P6.6 · Qué sirve la app cuando la regeneración falla

**El grafo viejo, diciendo su edad.** Y la edad es visible, no está en un pie de página.

- Un grafo de hace un mes te sigue llevando a casi todos los sitios: negarse a servir convierte un
  problema de frescura en una caída total.
- Pero servir dato viejo **sin decirlo** es la promesa falsa que este proyecto existe para no
  hacer.

**Propuesta de escalón** — el aviso crece con la edad, y **la única cifra dura es la del GTFS**,
que es la que tiene fecha de muerte real:

| Edad | Qué hace |
|---|---|
| < 1 mes | Sirve normal |
| 1–3 meses | Sirve y **muestra la fecha del dato** |
| > 3 meses | Sirve y **avisa** de que puede haber cambios sin recoger |
| ⛔ **GTFS caducado** | **Deja de dar horarios** y lo dice. No los estima |

⚠️ Los umbrales de 1 y 3 meses **NO ESTÁN MEDIDOS**: nadie sabe todavía cuánto cambia el viario de
Zaragoza en un mes. La medición que los cerraría es la de P6.3.

---

## ⭐ NÚMEROS PROPUESTOS — todos juntos, con su origen

| # | Número | Valor | ¿De dónde sale? |
|---|---|---|---|
| 1 | Tolerancia de soldadura de puntas | **2,0 m** | ✅ **MEDIDO**: histograma extremo→línea, 320 extremos. Recupera 31 (8 T reales) |
| 2 | Techo duro de la tolerancia | **5 m** | ✅ **MEDIDO**: mediana extremo→línea 5,10 m = ancho de media calle |
| 3 | Fusión cruce↔extremo | **1,0 m** | ✅ **MEDIDO**: vacío absoluto entre 0,01 y 1,00 m en los 89 cruces |
| 4 | Marcar cruce para revisión | **1–5 m** | ✅ **MEDIDO**: 3 casos en ese rango |
| 5 | Salto de velocidad = desnivel probable | **≥ 50 km/h** | ✅ **MEDIDO**: separa 16 de 89 cruces, todos 120 contra 50 |
| 6 | Jerarquías "rápidas" | `01_CINTURON`, `02_Penetracion` | ✅ **MEDIDO**: 28 de 160 tramos |
| 7 | Pares de prueba de ríos | **12** (6+4+2) | ⚠️ **NO MEDIDO** — criterio: un par por puente independiente |
| 8 | % mínimo en la componente mayor | **95 %** | ⛔ **NO MEDIDO**: no puede haberlo hasta el primer grafo |
| 9 | Variación que para el despliegue | **±10 %** nodos/aristas/longitud | ⛔ **NO MEDIDO**: propuesto a ojo, se calibra con las 3 primeras regeneraciones |
| 10 | Caída de portales enganchados que para | **2 %** | ⚠️ **Semi-medido**: la línea base 84,5 % sí está medida; el margen no |
| 11 | Ritmos de refresco | trimestral / mensual | ⚠️ **NO MEDIDO** (P6.3) |
| 12 | Escalones de edad | 1 y 3 meses | ⛔ **NO MEDIDO** (P6.6) |
| 13 | Umbral de cambio de features | **10 %** | ⛔ **NO MEDIDO** |

**Cinco medidos, ocho no.** Los no medidos son todos **umbrales de vigilancia**, no de
construcción: ninguno se puede medir antes de que exista el primer grafo, y todos se calibran con
la línea base. Los cinco que sí gobiernan la geometría —los que de verdad deciden cómo queda la
red— están medidos.

---

## ⭐ LO QUE NO SE PUEDE DECIDIR SIN MÁS DATOS

| # | Pregunta abierta | Qué medición la resuelve |
|---|---|---|
| 1 | ⭐⭐ **¿Etiqueta OSM los puentes de Zaragoza?** | Consulta Overpass sobre una ventana **con paso elevado conocido** (`GRACIA, LUCIANO` × `MADRID, AUTOVÍA DE`) y contar `bridge=yes`. **Lo primero de H1** |
| 2 | ⭐⭐ **¿Hasta dónde llega la acera de OSM?** | Overpass sobre 4–6 ventanas de periferia (Valdespartera, Actur, Miralbueno, Casetas) y contar `footway=sidewalk`. Decide cuánta ciudad va a `precision=eje` |
| 3 | ⭐ **¿Cuántos cruces dudosos hay en la ciudad?** | Descargar la capa entera (3.644) y reejecutar el conteo. La muestra actual está **sesgada hacia el desnivel** |
| 4 | **¿Cuántos portales quedan lejos de su calle de verdad?** | Recalcular contra los 3.644 tramos, no contra 160. Sale gratis al descargar |
| 5 | **Densidad relativa OSM ↔ municipal** | Overpass sobre **exactamente** la ventana municipal. Hoy: `NO CONSTA` (ver C2) |
| 6 | **¿Hay solapes parciales entre tramos?** | Detectable sólo sobre la capa entera |
| 7 | **¿Cuánto cambia cada fuente?** | Hash por descarga durante 3 ciclos |
| 8 | **`MU2_señalizacion_horizontal`** (las cebras municipales) | Sigue inaccesible por la eñe del nombre. `NO CONSTA` |

---

## ⚠️ QUÉ NO ENCAJA — los casos incómodos

Un diseño sin casos incómodos es un diseño que no los ha mirado. Estos no están resueltos:

1. ⭐⭐ **El falso negativo de la regla de nivel.** Una pasarela peatonal sobre una calle de 30, o un
   túnel bajo una plaza, tienen **la misma velocidad y la misma jerarquía a ambos lados**. La regla
   de P2 no los ve. Sólo los vería OSM, y **no sabemos si OSM los tiene aquí** (abierto nº1).

2. ⭐ **La glorieta que no dice ser glorieta.** Seis tramos dicen `ROTONDA`, ninguno es un anillo
   cerrado y **cero de los 160 tienen geometría cerrada**. Si una glorieta llega partida en arcos
   que ni se cruzan ni se tocan dentro de 2 m, se queda desconectada — y una glorieta desconectada
   aísla todo lo que cuelga de ella.

3. **La calle en obras.** Ninguna fuente la tiene. El grafo dirá que se pasa por donde hoy hay una
   valla. Está fuera de alcance (nivel 3) y **conviene que la app lo diga**, no que se calle.

4. **El portal con entrada por otra vía.** El 3,5 % medido incluye casos donde el código y la
   geometría discrepan de verdad, no por esquina. Mandando el código, esos quedan mal, a propósito.

5. ⭐ **El tramo que muere en nada y es correcto.** Un fondo de saco real y un tramo mal
   digitalizado son **indistinguibles en el dato**. Sólo el grafo los separa (P5.1), y sólo *a
   posteriori*.

6. **Los 16 tramos `municipal=NO` y el que tiene `codigo` nulo.** Un tramo sin código **no puede
   recibir portales**: es una arista que existe para el motor y no para las direcciones. Son
   autovías del Estado, y su papel en un buscador peatonal está por decidir.

7. ⚠️ **`carril_vh` tiene 13 valores distintos** en 160 tramos (`1`, `2`, `4_3`, `1,2`,
   `2_3_1_2_3`…), con dos separadores mezclados. Si alguna vez hace falta el número de carriles,
   ese campo hay que parsearlo, y **su formato no está documentado en ningún sitio**.

8. **`calle_z30` y `residencia` valen `NO` en los 160.** O son campos muertos, o la muestra no
   alcanza a ninguno que valga `SI`. Con el 4,4 % no se puede distinguir **un campo vacío de un
   campo que no aplica aquí**.

---

*Diseño escrito el 2026-08-02 sobre los crudos de `data/exploracion/` y una lectura del dataset
heredado. Cero peticiones de red. Nada de lo aquí propuesto está construido.*
