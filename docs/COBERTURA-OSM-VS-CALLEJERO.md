# ¿Cuánta ciudad se pierde con D0? — OSM contra el callejero municipal

**Fecha:** 2 de agosto de 2026 · Registro histórico: **se añade, no se reescribe.**

Mide el único cabo que nace de la decisión **D0** (*el grafo se construye sobre OSM; el dato
municipal verifica, no decide*): **cuántas de las 3.359 vías del callejero municipal no existen en
OpenStreetMap.** Barrido completo, no muestra. **8 peticiones de 10.** Nada construido.

---

## ⭐ EL NÚMERO, ARRIBA DEL TODO

```
callejero municipal completo          3.359 vias   1.991,7 km
  de ellas, vias LINEALES             2.853 vias   1.612,5 km
                                      (calle · avenida · paseo · camino · ronda ·
                                       travesia · bulevar · pasaje)

SIN equivalente en OSM (instrumento estricto)   255 vias (7,6 %)   81,9 km (4,11 %)
  ├─ NO lineales (plaza, parque, glorieta…)     142   ⚠️ 114 de ellas SI estan mapeadas:
  │                                                      artefacto del instrumento, no hueco
  └─ LINEALES                                   113 (3,96 % de las lineales)  38,5 km (2,39 %)
       ├─ con OSM cerca pero desplazado/parcial  65
       └─ ⛔ SIN NADA de OSM alrededor            48  = 1,68 % de las vias lineales
```

> ⚠️ **Y este número no vale por sí solo: vale contra su línea base.** Un instrumento que dijera
> "hay calle cerca" en una ciudad densa acierta el 58 % de las veces **aunque le des el callejero
> movido 2 km**. La cifra de arriba sale de un instrumento cuya línea base desplazada es **5 %**.
> Ver §C0, que es la parte que sostiene todo lo demás.

---

## A · LA DESCARGA

### A1 · El encuadre

El bbox sale de los **46.150 portales** del callejero (lectura local, cero peticiones), no de una
estimación:

```
lat 41.50199 .. 41.77476     lon -1.16093 .. -0.76854
bbox usado: 41.50,-1.17,41.78,-0.76   ->  32,6 x 30,2 km = 984 km2
```

984 km² coincide con la superficie del término municipal de Zaragoza (~973 km²). **Cubre el término
entero**, incluidos los barrios rurales: Casetas está en `lon -1.03`, Peñaflor en `lat 41.76`.

### A2 · Lo que llegó

| Fichero | Peso | ways | Sello del dato | Instancia |
|---|---:|---:|---|---|
| Nombres OSM (`way[highway][name]`) | 4,79 MB | **19.897** | **2026-08-02T14:36:18Z** | principal |
| Geometría OSM (`way[highway]`, `out skel geom`) | 34,25 MB | **55.452** | **2026-08-02T14:36:18Z** | principal |
| `urbanismo:Vias` completa (WFS) | 3,28 MB | **3.359** | (WFS, sin sello) | IDEZar |

⭐ **Los dos crudos de OSM son del mismo sello y de la instancia principal.** No hay mezcla de
réplicas: la trampa de la tanda anterior (bitácora nº35, cuatro ventanas con tres fechas) **no se
repite aquí**, y se comprobó antes de analizar nada.

### A3 · Se partió en dos, y por qué

La descarga única con `out geom` (tags + geometría) falló. Se pidió en dos: **nombres sin
geometría** y **geometría sin tags** (`out skel geom`), unidas después por identificador de way.
Es **más barato para el servidor** que una sola con todo, y responde lo mismo.
⛔ No se troceó por zonas: son dos consultas al término entero, no veinte.

### A4 · `urbanismo:Vias` = **3.359 features exactas**

El mismo número que el callejero heredado, verificado por tres métodos independientes
(`len()`, `codigoVia` distintos, `id` distintos → 3.359 los tres). Trae `codigo` (= `codigoVia`),
`nombre_publico`, **`barrio_rural`** y `tipo_via`. **Es el universo completo, no una muestra.**

---

## B · EL BARRIDO POR NOMBRE

### B1 · Qué hace el normalizador — y qué NO

Quita tildes y mayúsculas · convierte puntuación en espacios · expande **35 abreviaturas**
municipales (`NTRA`→NUESTRA, `SRA`→SEÑORA, `STA`, `AVDA`, `DR`, `GRAL`…) · elimina **partículas**
(`de`, `del`, `la`, `los`, `y`…) · reconoce y separa el **tipo de vía** · detecta el **sufijo rural**
`---XXX`.

⚠️ **Lo que NO resuelve, medido:** los **tratamientos añadidos**. `CALLE ARZOBISPO AÑOA Y BUSTO`
(municipal) contra `Calle de Añoa del Busto` (OSM) **no casa**, y no se ha forzado que case.

### B2 · Las cuatro familias conocidas (bitácora nº33)

| Caso plantado | Resultado |
|---|---|
| `CALLE UNCETA` → *Calle de Marcelino Unceta* | ✅ CONTENIDA |
| `CALLE NTRA.SRA.DE BONARIA` | ✅ EXACTA |
| `CAMINO DEL CASCAJO ---SJN` | ✅ EXACTA *(pero marcada DUDOSA por rural, ver B3)* |
| `CALLE ARZOBISPO AÑOA Y BUSTO` | ⛔ **NO** — familia sin resolver |
| `CALLE MARCELINO UNCETA` (partículas) | ✅ EXACTA |

**5 de 6.** El fallo se declara, no se parchea.

### B3 · ⭐⭐ La contraprueba de laxitud — la primera versión no valía nada

**Primer intento:** ocho nombres inventados (`CALLE ZURRIBURRI DEL PAMPANO`, `AVENIDA DEL TRASGO
MELIFLUO`…). **Rechazados 8 de 8.** Verde perfecto.

**Y era inútil.** La muestra al azar destapó lo que el control de disparates no podía ver:

```
PLAZA ESPAÑA ---GRP      ->  EXACTA  ->  "Avenida de España"    ⛔
CAMINO DEL CASCAJO ---SJN->  EXACTA  ->  "Calle Cascajo"        ⛔
CALLE BUENOS AIRES ---SGR->  EXACTA  ->  "Avenida Buenos Aires" ⛔
```

Y la razón de fondo, que es estructural: **hay OCHO `PLAZA ESPAÑA` en el término municipal** —una
urbana y siete en barrios rurales (Alfocea, Cartuja, Casetas, Garrapinillos, Monzalbarba, Peñaflor,
San Juan de Mozarrifar)—, repartidas en 20 km. **El nombre no es un identificador: es una etiqueta
que se repite.**

⇒ **El emparejador se corrigió ANTES de mirar ningún total**, y se declara: (1) tipos de vía
distintos → `DUDOSA`, no encontrada; (2) toda vía con sufijo rural → `DUDOSA`, exige confirmación
geométrica. Bitácora nº36.

**Contraprueba v2, con casi-aciertos REALES sacados del dato** (dos calles que existen las dos y se
parecen):

| Municipal | Contra | Resultado |
|---|---|---|
| `PLAZA ESPAÑA` | *Avenida de España* | ✅ no las confunde |
| `CALLE SORIA` | *Avenida de la Ciudad de Soria* | ✅ |
| `CAMINO DEL CASCAJO` | *Calle Cascajo* | ✅ |
| `CALLE BUENOS AIRES` | *Avenida Buenos Aires* | ✅ |
| `CALLE MONTE BUENOS AIRES` | *Calle Buenos Aires* | ✅ |
| `CALLE LOS PIRINEOS` | *Avenida de los Pirineos* | ✅ |

**0 colisiones de 6.**

### B4 · Los tres cubos

```
ENCONTRADA      2.595   (77,3 %)
NO ENCONTRADA     414   (12,3 %)
DUDOSA            350   (10,4 %)
                -----
TOTAL           3.359   ✅ suma verificada contra el universo
```

⚠️ **El cubo DUDOSA se queda como está.** Repartirlo entre los otros dos habría obligado a decidir
350 casos indecidibles, y cada decisión forzada es ruido metido en el número que importa.

### B5 · Muestra de 30 `NO ENCONTRADA` al azar (semilla `20260802`)

Cuatro clases, visibles a simple vista:

- **No son calles:** `DISEMINADO DISEMINADO PEÑAFLOR`, `DISEMINADO DISEMINADO TORRECILLA` (18 en
  total, **longitud 0 m** — entradas administrativas del callejero).
- **Polígonos con código:** `CALLE CIUDAD TRANSPORTE (E)`, `(K)`, `(A)`, `(LT-SUR)`,
  `CALLE MALPICA II (Q)`.
- **Barrios rurales:** Movera, Monzalbarba, Santa Isabel, Peñaflor.
- **Huecos de mi normalizador:** `BULEVAR CORREDOR VERDE` (`BULEVAR` no estaba en la lista de
  tipos), `CALLE ASOC. VECINOS GASPAR TORRENTE` (`ASOC.` sin expandir).

---

## C · ⭐⭐ EL BARRIDO GEOMÉTRICO — la pregunta que de verdad importa

*"¿Hay calle en OSM donde el municipal dice que hay calle?"*, con independencia del nombre.

### C0 · ⛔ EL PRIMER INSTRUMENTO NO MEDÍA LO QUE CREÍA

Primera versión: se muestrea el eje municipal cada 25 m y se mira si hay **cualquier** segmento OSM
a menos de 20 m. Resultado: **98,3 % de las vías cubiertas**. Y a 5 m, 96,0 %.

Antes de firmarlo, la contraprueba obligatoria: **desplazar el callejero entero y volver a medir.**
Si mide correspondencia, la cobertura debe desplomarse.

```
desplazamiento    mediana de cobertura    vias con >=50% cubierto (de 399)
sin desplazar             100 %                      394
25 m al norte             100 %                      367
50 m al norte              87 %                      330
100 m al norte             80 %                      310
200 m al norte             75 %                      294
500 m al norte             68 %                      275
2 km al norte              59 %                      231     ⛔
```

**Con el callejero movido DOS KILÓMETROS, el 58 % de las vías seguía saliendo "cubierta".** En una
ciudad densa, cualquier línea está a menos de 20 m de alguna calle. **El instrumento medía densidad
urbana, no correspondencia.** El 98,3 % no significaba nada.

### C1 · El instrumento que sí discrimina

Dos cambios: **umbral estrecho (5 m)** y **exigencia de paralelismo (rumbo dentro de ±30°)**. Una
calle perpendicular deja de contar como "la misma calle".

```
INSTRUMENTO v2 (>=50 % del eje con OSM paralelo a <=U)
desplazamiento     U=5 m    U=10 m   U=15 m   U=20 m
sin desplazar      92,2 %   95,2 %   96,2 %   97,0 %
50 m al norte      12,5 %   28,8 %   44,1 %   58,9 %
200 m al norte      9,3 %   22,1 %   37,8 %   50,4 %
2 km al norte       5,0 %   11,8 %   18,5 %   30,6 %
```

⭐ **A 5 m: señal 92,2 % contra línea base 5,0 %.** A 20 m la línea base sube a 30,6 % y el
instrumento vuelve a ser poco fiable. **Por eso el umbral es 5 m** — no porque suene fino, sino
porque es donde la medición separa la señal del azar. *(Muestra del control: 400 vías al azar,
semilla `20260802`.)*

### C2 · El reparto que importa — barrido completo, 3.359 vías

| | Vías | % | Kilómetros | % |
|---|---:|---:|---:|---:|
| **1 · Existe en OSM y con nombre** | 2.514 | 74,8 % | 1.500,7 | 75,3 % |
| **2 · Existe en OSM, nombre no resuelto** | 590 | 17,6 % | 409,1 | 20,5 % |
| ⛔ **3 · NO existe en OSM** | **255** | **7,6 %** | **81,9** | **4,11 %** |
| | 3.359 | | 1.991,7 | |

**El grupo 2 no es un hueco de grafo, es un hueco de etiqueta:** la calle está, el motor puede
calcular por ella; lo que no se puede es nombrarla ni transportarle atributos municipales.

### C3 · ⚠️ Los 255, mirados de cerca: la mitad son artefacto

Reparto por tipo de vía:

```
CALLE        93 de 2.456   3,8 %      PARQUE      29 de  58   50,0 %
PLAZA        54 de   202  26,7 %      JARDINES    12 de  29   41,4 %
CAMINO       18 de   252   7,1 %      GLORIETA     9 de  30   30,0 %
DISEMINADO   18 de    18 100,0 %      ANDADOR      7 de  72    9,7 %
```

**Las plazas, parques, glorietas y jardines fallan 6 veces más que las calles.** Y la razón no es
que falten en OSM: **es que OSM los mapea como ÁREA**, no como eje. Un eje municipal que cruza el
centro de una plaza no tiene ninguna línea paralela a 5 m — tiene un polígono alrededor.

**Comprobado**, quitando la exigencia de paralelismo y ampliando a 20 m:

```
de los 255 sin equivalente estricto:
   NO LINEALES (142)   ->  114 SI tienen OSM cerca   ⚠️ artefacto del instrumento
                            10 no tienen nada
                            18 no tienen ni geometria propia (DISEMINADO, 0 m)
   LINEALES    (113)   ->   65 tienen OSM cerca (desplazado o parcial)
                            48 NO tienen nada        ⛔ el hueco duro
```

⇒ **El hueco real son 48 vías lineales de 2.853 = 1,68 %.**

### C4 · Dónde están, y qué kilómetros pesan

| Zona | Sin equivalente | Total | % |
|---|---:|---:|---:|
| **(urbano)** | 171 | 2.620 | 6,5 % |
| Monzalbarba (MNZ) | 10 | 49 | **20,4 %** |
| San Juan de Mozarrifar (SJN) | 8 | 43 | **18,6 %** |
| Montañana (MNT) | 12 | 66 | **18,2 %** |
| Torrecilla (TRC) | 3 | 17 | 17,6 % |
| Movera (MVR) | 8 | 61 | 13,1 % |
| Santa Isabel (SIS) | 18 | 144 | 12,5 % |
| Casetas (CST) | 6 | 89 | 6,7 % |
| Garrapinillos (GRP) | 3 | 79 | 3,8 % |

⭐ **El hueco se concentra en los barrios rurales** —hasta el 20 % en Monzalbarba— pero en términos
absolutos **la mayoría está en la zona urbana** (171 de 255), porque ahí está la mayoría de las
vías. Y en **kilómetros el hueco es la mitad de grande** que en número de vías (4,11 % contra
7,6 %): **lo que falta son calles cortas.**

Los 48 del hueco duro, con nombre: `CALLE ALFONSO II / III / IV DE ARAGÓN`,
`CALLE JAIME II DE ARAGÓN` (cuatro calles consecutivas del mismo desarrollo),
`BULEVAR DEL CIUDADANO ---CST`, `CALLE CIUDAD TRANSPORTE (A)`, `CAMINO TORRE ESCOLAPIOS ---MVR`,
`CALLE AMBROSIO DE CASANANTE ---MNZ`… **Promociones nuevas, polígonos industriales y caminos
rurales.** ⚠️ *Que sean "nuevas" es una interpretación mía por el patrón de los nombres: no está
medido.*

---

## D · VEREDICTO SOBRE D0

### D1 · En una frase

> **D0 se sostiene: el hueco duro es el 1,68 % de las vías lineales y el 2,4 % de sus kilómetros —
> 48 calles de 2.853—, y está concentrado en polígonos, promociones nuevas y barrios rurales, no en
> la ciudad donde se va a usar la aplicación.**

Los matices, que importan:

1. **El 7,6 % bruto exagera al doble.** La mitad son plazas y parques que OSM sí tiene, mapeados
   como área. Publicar el 7,6 % sin desglosar sería el mismo error que el 106 de la tanda 2.
2. ⚠️ **Pero el hueco de las plazas es real para el peatón**, aunque no sea un hueco de cobertura:
   el grafo tendrá el contorno de la plaza y no su interior. **Una ruta que cruza una plaza por el
   medio no se podrá calcular** hasta que se decida qué hacer con las áreas peatonales. Es un
   problema de H1 que esta tanda destapa y no resuelve.
3. **El nombre no sirve de identificador en los barrios rurales.** Ocho `PLAZA ESPAÑA`. Cualquier
   transporte de atributos por nombre tiene que llevar el `barrio_rural` como discriminador, y aun
   así queda el 10,4 % de dudosas.

### D2 · ¿Se puede tapar el hueco?

| Opción | A favor | En contra |
|---|---|---|
| **Geometría municipal solo donde OSM no llega** | Recupera 48 calles | ⚠️ Ver D3 |
| **Marcar la zona como "sin cobertura" y decirlo** (línea de D4) | Coherente con la tesis del proyecto; coste cero | Esas 48 calles no se pueden recorrer |
| **No hacer nada** | 1,68 % | Un vecino de Monzalbarba se topa con el 20 % |

**Recomendación (informo, no decido): la segunda, y reevaluar cuando el grafo exista.** 48 calles
en 984 km² no justifican meter una segunda geometría con sus propios problemas.

### D3 · ⚠️ El efecto secundario, dicho entero

**Si el hueco se tapa con geometría municipal, vuelve el problema del nivel en esas zonas** — y
vuelve en su peor versión: la capa municipal no tiene nodos compartidos, así que ahí no vale la
cláusula C1 de D1 (*precedencia del nodo*), que es de donde salía toda la solidez de la regla. Se
volvería a inferir con el único criterio que ya demostró fallar (salto de velocidad: el paso
inferior de Cesáreo Alierta es 50 contra 50).

⇒ **Tapar el hueco no es "añadir 48 calles": es reabrir el problema que D0 cerró**, en 48 sitios.

### D4 · Qué volver a medir cuando exista el grafo

| # | Barrido completo | Contraprueba | Qué lo pone rojo |
|---|---|---|---|
| 1 | Repetir esta cobertura con el OSM del día | **Desplazar el callejero 2 km**: la línea base debe seguir ≤6 % | Base >10 % = instrumento degradado |
| 2 | Los 48 del hueco duro, uno a uno | Que sigan siendo 48 y los mismos códigos | Aparecen nuevos = OSM ha empeorado |
| 3 | Las 350 `DUDOSA`, resueltas por geometría + `barrio_rural` | 8 `PLAZA ESPAÑA` deben caer en 8 sitios distintos | Dos que caigan en el mismo |
| 4 | Portales enganchados sobre geometría OSM | El 84,5 % medido contra tramos municipales | Desviación >2 pp |
| 5 | Áreas peatonales (plazas) atravesables | Ruta que cruza Plaza del Pilar por el medio | Si no hay camino, el hueco de D1·2 sigue abierto |

---

## E · PETICIONES, CRUDOS Y LO QUE NO HE MIRADO

**8 de 10.**

| # | Consulta | Resultado |
|---:|---|---|
| 1 | OSM término, `out geom` (todo junto), `timeout:900` | ⛔ 504 |
| 2 | OSM término, solo nombres, `timeout:900` | ⛔ 504 |
| 3 | `/api/status` | ✅ 2 slots libres → **no era mi cuota** |
| 4 | sonda de fecha a la réplica `private.coffee` | ⛔ 504 (95 s) |
| 5 | OSM nombres, **`timeout:180`** | ✅ 200 · 4,79 MB · **4,9 s** |
| 6 | ⭐ la misma con `timeout:900` otra vez | ✅ 200 · **4,4 s** |
| 7 | OSM geometría, `out skel geom` | ✅ 200 · 34,25 MB · 6,7 s |
| 8 | WFS `urbanismo:Vias` completa | ✅ 200 · 3,28 MB · 0,9 s |

⭐ **La petición 6 es el método funcionando.** Tras el éxito de la 5 parecía demostrado que el
`timeout:900` era la causa de los 504 — una variable, un cambio, un resultado. La ley nº34 (*una
intervención que funciona no demuestra por qué funciona: hay que reproducir el fallo*) obligó a
repetir la consulta original… **y devolvió 200 en 4,4 s.** Hipótesis refutada. **Es la tercera causa
que formulo para estos 504 y la tercera que se cae**; la ley escrita ayer impidió escribir hoy la
tercera explicación falsa. `CAUSA NO CONFIRMADA`.

**Crudos añadidos** (ninguno sustituido):

```
2026-08-02_osm_overpass_zaragoza-termino_nombres.json      4,79 MB  ✅ entra
2026-08-02_wfs_urbanismo-Vias_completa-4326.json           3,28 MB  ✅ entra
2026-08-02_osm_overpass_zaragoza-termino_geometria.json   34,25 MB  ⛔ NO entra
2026-08-02_osm_overpass_termino_HTTP504-intento1.html        695 B  ⛔ NO entra (repetido)
2026-08-02_osm_overpass_termino-nombres_HTTP504-intento1.html 695 B ⛔ NO entra (repetido)
```

⚠️ **Los 34 MB de geometría se quedan fuera, y se dice por qué:** cuadruplicarían el repositorio
(4 MB → 40 MB) por un solo fichero. La consulta exacta queda escrita aquí y el sello es
`2026-08-02T14:36:18Z`, pero **OSM cambia a diario: quien la repita obtendrá otro dato**. Es una
pérdida real de reproducibilidad, elegida a sabiendas, y **es la primera vez en este proyecto que la
evidencia de una afirmación fuerte no se publica**.

```
[out:json][timeout:180];
way["highway"](41.50,-1.17,41.78,-0.76);
out skel geom;
```

**Qué NO he mirado:**

- **Relaciones OSM** (`type=associatedStreet`, multipolígonos): solo *ways*.
- **Áreas peatonales como área** (`highway=pedestrian` + `area=yes`): entran en el crudo como way
  cerrado, pero **su geometría es el contorno**, y el instrumento las trata como línea. Es la causa
  del artefacto de las plazas y **no se ha corregido**, solo medido.
- **Si las 48 calles del hueco duro existen de verdad sobre el terreno.** Podrían estar en el
  callejero y no construidas todavía. Solo se resuelve mirando.
- **Los atributos**: esta tanda mide cobertura, no si el sentido o la velocidad se pueden
  transportar.
- **El resto de España**: el bbox es solo el término municipal.

---

## ⚠️ EL CASO QUE NO ENCAJA

1. ⭐⭐ **Las plazas.** El instrumento las cuenta como ausentes y están; el grafo las tendrá como
   contorno y no como superficie. **Las dos cosas son verdad y ninguna es lo que hace falta.** Una
   ruta que atraviesa la Plaza del Pilar es exactamente el tipo de caso que la demo va a enseñar.
2. **`DISEMINADO DISEMINADO VILLARRAPA`** y 17 más: entradas del callejero **con 0 m de geometría**.
   No son calles, y sin embargo cuentan en el denominador 3.359. Todo porcentaje sobre ese total
   arrastra 18 registros que no son vía.
3. **`CALLE CIUDAD TRANSPORTE (A)`, `(E)`, `(K)`, `(LT-SUR)`** — el callejero usa letras entre
   paréntesis para distinguir viales de polígono. Ni el nombre ni la geometría los resuelven bien, y
   son **calles reales por las que circula tráfico pesado**.
4. **Cuatro calles consecutivas del hueco duro** (`ALFONSO II`, `III`, `IV`, `JAIME II DE ARAGÓN`)
   caen juntas. **Un hueco agrupado no es un hueco aleatorio**: si son una promoción nueva, el
   número de hoy envejecerá solo a medida que OSM las mapee — o no.

---

*Barrido ejecutado el 2026-08-02. 8 peticiones. Universo completo: 3.359 vías, 55.452 ways de OSM.
Nada construido.*
