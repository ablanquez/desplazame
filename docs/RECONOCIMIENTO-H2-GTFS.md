# RECONOCIMIENTO H2 · EL GTFS DE ZARAGOZA (ficha 1176 del NAP)

*H2 · tanda 1 · 10 de agosto de 2026 · **solo lectura**.*

> **Registro histórico: se AÑADE, no se reescribe.** Lo que dice aquí es lo que se supo el 10 de
> agosto de 2026 con el feed que se bajó ese día. Si algo resulta estar mal, se corrige en un
> documento nuevo que diga qué corrige y por qué.
>
> ⛔ **Ni una línea de código de producto en esta tanda.** No hay grafo de transporte, ni enganche
> de paradas, ni diseño de H2. La conclusión —cómo se desglosa H2— la decide Antonio con esto
> delante.

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⭐⭐⭐ **EL TRANSBORDO NO VIENE** | **No hay `transfers.txt`, ni `pathways.txt`, ni `levels.txt`, ni un solo `parent_station`.** El feed trae 984 paradas sueltas y **cero información sobre cuáles están juntas**. ⇒ **El transbordo hay que construirlo entero**, y es el corazón de H2 |
| ⭐⭐⭐ **BUS Y TRANVÍA NO COMPARTEN NI UNA PARADA** | 934 de bus + 50 de tranvía = 984, y **la intersección es 0**. La conexión entre los dos modos **no está en el dato**: es nuestra, al metro |
| ⭐⭐ **SON DOS PUBLICADORES EN UN FICHERO** | Dos agencias, dos convenios de `stop_code`, dos calendarios con fechas distintas y dos `route_type` extendidos. **Nada en el esquema lo declara** |
| ⭐ **LA CADUCIDAD ES REAL Y EL FEED LA DECLARA** | `feed_end_date = 20261005`. **56 días desde hoy** |
| ⚠️ **TODO CUADRA CON LO PUBLICADO EL 2/08** | Y **no es tranquilizador**: es el mismo feed. `feed_version = 20260623_AUZSA_Y_TRANVIA`, sin republicar desde el 23 de junio. La descarga es de hoy; **el dato es de hace siete semanas** |
| ⛔ **944 vs 934 NO ERAN DIEZ CASOS** | Eran **doce**: 11 paradas que solo están en el WFS y 1 que solo está en el GTFS. **La resta escondía la mitad** |

---

## 1 · CÓMO SE BAJÓ, Y POR QUÉ EL `200` SIGNIFICA ALGO

**El instrumento:** `tools/bajar-gtfs.js`, código de 004, cero dependencias.
⛔ **No vive en `src/`** a propósito: `src/` es el universo de la batería, y un invariante del
proyecto no puede depender de que un tercero esté vivo.

⭐ **Ley 34 · un 200 no es un dato.** Antes de creerse la respuesta buena, tres sondas que tienen
que fallar. Si las cuatro contestaran igual, el 200 de la última no probaría nada:

```
node tools/bajar-gtfs.js --guardar

   sonda                                           estado       bytes   ¿zip?
   S1 · sin clave                                     401          25   —
   S2 · clave inventada con forma de UUID             401          20   —
   S3 · ficha 999999 con la clave buena               500         132   —
   S4 · la 1176 con la clave buena                    200     6883311   ✅
```

⭐⭐ **Y la que de verdad discrimina es la S2.** Sin clave el servidor dice *«Api Key was not
provided»*; con una clave inventada dice *«Unauthorized client»*. **Son dos mensajes distintos**
⇒ no comprueba que la cabecera exista: **comprueba la clave**.

⚠️ **La S3 no contesta lo que se le preguntaba, y eso también es un resultado.** A una ficha
inexistente devuelve **500**, no 404:

> `{"type":"…rfc7231#section-6.6.1","title":"An error occurred while processing your request.","status":500}`

⛔ **Ley 20: eso es lo que el servidor dice de sí mismo, no un hecho comprobado.** ⇒ **el NAP no
distingue «esa ficha no existe» de «me he roto»**, y por tanto **el día que la 1176 desaparezca,
la respuesta será indistinguible de una caída**. Es un dato operativo para el plazo del 05/10.

### ⚠️ Ley 21 · el sello de fecha: lo que la respuesta NO trae

```
data/exploracion/2026-08-10_nap_gtfs-ficha1176.cabeceras.txt

   date: Mon, 10 Aug 2026 09:44:50 GMT
   content-type: application/x-zip-compressed
   content-length: 6883311
   x-correlation-id: 9ada5da21794457e80f64f379022dba0
```

⛔ **No hay `last-modified`. No hay `etag`. No hay `age`, ni `x-cache`, ni `via`, ni
`content-disposition`.** ⇒ **Desde HTTP no se puede saber si esto es fresco o una réplica de hace
meses.** La única fecha es la de mi propia petición.
⇒ ⭐ **La frescura hay que sacarla de DENTRO del fichero**, y ahí sí consta: `feed_version`,
`feed_start_date` y las fechas de las entradas del zip (§2).

**El crudo se guardó tal cual** (ley 11) y las cabeceras **en fichero aparte**, para no tocarlo:

```
data/exploracion/2026-08-10_nap_gtfs-ficha1176.zip            6.883.311 bytes
data/exploracion/2026-08-10_nap_gtfs-ficha1176.cabeceras.txt
sha256  5c96992c97aac966bc9bc20babfbbbffb312f2a3cbcf9dd543982d2674cf3a82
```

⚠️ **`data/exploracion/` está fuera de git** (`.gitignore:57`). **El crudo NO se ha versionado**, y
si debe entrar, se propone y lo decide Antonio.

---

## 2 · EL INVENTARIO, MEDIDO

**Ocho ficheros. 960.948 filas de datos.** Recuento hecho con un lector de CSV con comillas, no con
`split(',')`: el GTFS admite comas dentro de comillas y un recuento partido por comas miente en
silencio justo en las filas raras.

| fichero | bytes | filas | columnas |
|---|---:|---:|---:|
| `agency.txt` | 429 | **2** | 8 |
| `calendar_dates.txt` | 729.890 | **27.161** | 3 |
| `feed_info.txt` | 244 | **1** | 7 |
| `routes.txt` | 3.430 | **53** | 9 |
| `shapes.txt` | 1.408.077 | **27.603** | 5 |
| `stop_times.txt` | 47.049.063 | **870.717** | 10 |
| `stops.txt` | 99.309 | **984** | 11 |
| `trips.txt` | 2.112.380 | **34.427** | 7 |

### ⛔ LO QUE NO VIENE — con su positivo de control

```
   falta   calendar.txt          falta   transfers.txt      ⇐ ⭐⭐⭐ el corazón de H2
   falta   frequencies.txt       falta   pathways.txt       ⇐ ⭐⭐⭐
   falta   fare_attributes.txt   falta   levels.txt         ⇐ ⭐⭐⭐
   falta   fare_rules.txt        falta   translations.txt
                                 falta   attributions.txt

   ⭐ control: el mismo listado SÍ encuentra los 8 que hay ⇒ no está roto (ley 4)
```

### ⭐ Lo que el feed dice de sí mismo

```
   feed_publisher_name    Avanza Zaragoza S.A.U
   feed_lang              es
   feed_start_date        20260623
   feed_end_date          20261005
   feed_version           20260623_AUZSA_Y_TRANVIA

   agency_id  1     Avanza Zaragoza S.A.U.              Europe/Madrid
   agency_id  11    Tranvías Urbanos de Zaragoza S.L.   Europe/Madrid
```

⭐ **Y las fechas guardadas dentro del zip, que son otra fuente de frescura:**

```
   routes.txt           23/09/2025 13:27      ⚠️ NUEVE MESES más viejo que el resto
   agency.txt           23/06/2026 10:14
   shapes.txt           23/06/2026 10:30
   stops.txt            23/06/2026 10:29
   feed_info.txt        23/06/2026 12:38
   trips.txt            30/06/2026 12:48
   stop_times.txt       30/06/2026 12:53
   calendar_dates.txt   30/06/2026 13:08
```

⚠️ **`routes.txt` lleva fecha de septiembre de 2025 y el resto de junio de 2026.** Es coherente con
que el catálogo de líneas cambie poco, pero **no está confirmado**: el zip guarda hora local sin
zona y una fecha de entrada la pone quien empaqueta. `CAUSA NO CONFIRMADA`.

---

## 3 · TABLA DE CONTRASTE — contra lo que el estado publica hoy

⚠️ Las cifras de la izquierda son del **2 de agosto** y de **otra descarga**. Eran la hipótesis.

| lo que publica el estado | lo medido hoy | veredicto |
|---|---|---|
| 984 paradas (bus y tranvía) | **984** filas en `stops.txt` | ✅ **CUADRA** |
| 52+1 rutas | **53**: 52 de `agency 1` + 1 de `agency 11` | ✅ **CUADRA** |
| 34.427 viajes | **34.427** | ✅ **CUADRA** |
| 870.717 horarios | **870.717** | ✅ **CUADRA** |
| `shapes.txt` con 89 trazados sanos y cero huérfanos | **89** distintos · **89** citados · **0** huérfanos · **0** viajes sin trazado | ✅ **CUADRA** |
| SIN `calendar.txt` | no está | ✅ **CUADRA** |
| 72 filas de 27.161 posteriores al 05/10 | **72** de **27.161** | ✅ **CUADRA la cifra** |
| «el calendario se extiende TRES MESES más allá de su propia caducidad» | la última fecha es **20261231**: **87 días**. ⛔ Pero **no es «el calendario»** — ver §6 | ⚠️ **DIFIERE la lectura** |
| escribe «Miguel ángel Blanco» | **«Miguel ángel Blanco N.º 53»**, y **cuatro más** con «ángeles» en minúscula | ✅ **CUADRA, y se queda corto** |
| 944 paradas WFS contra 934 GTFS, «sin explicar» | **explicado en §5**, y no son diez casos: son **doce** | ⚠️ **DIFIERE** |

### ⚠️⚠️ Que todo cuadre NO es una buena noticia — es una pregunta (ley 108)

**Ocho filas de nueve clavadas a una medición de hace ocho días es exactamente lo que pasaría si
estuviera leyendo el mismo artefacto.** La hipótesis se comprueba, no se descarta:

| pregunta | respuesta | con qué |
|---|---|---|
| ¿La descarga es de hoy? | **Sí** | `date: Mon, 10 Aug 2026 09:44:50 GMT` y un `x-correlation-id` distinto por petición |
| ¿El servicio está vivo y responde a lo que se le pide? | **Sí** | S1, S2 y S3 devuelven **tres cuerpos distintos**; una réplica muda no los produce |
| ¿Es el mismo fichero que el 2/08? | ⭐ **Casi con seguridad SÍ, y por eso cuadra** | `feed_version = 20260623_AUZSA_Y_TRANVIA` y `feed_start_date = 20260623`: **el feed no se ha vuelto a publicar desde el 23 de junio** |
| ¿Puedo demostrar que el NAP no sirve una copia rancia? | ⛔ **NO** | **La respuesta no trae `last-modified` ni `etag`.** `NO CONSTA` |

⇒ ⭐⭐ **La descarga es fresca y el dato es viejo, y las dos cosas son ciertas a la vez.** Cuadrar
con el 2/08 **no valida nada del instrumento**: valida que el feed lleva siete semanas quieto.
⛔ **La primera medición que sí valdría como control es la de la próxima descarga**, cuando el
`feed_version` cambie.

---

## 4 · ⭐⭐⭐ EL TRANSBORDO — no viene, y hay que construirlo entero

**Es la pregunta que decide H2, y la respuesta es la peor de las posibles.**

```
   transfers.txt      ⛔ NO ESTÁ    ⇒ ningún transbordo declarado, ni tiempo mínimo
   pathways.txt       ⛔ NO ESTÁ    ⇒ ningún recorrido interior de estación
   levels.txt         ⛔ NO ESTÁ    ⇒ ningún nivel

   stops.txt · parent_station no vacío        0 de 984
   stops.txt · location_type = 1 (estación)   0 de 984
```

⛔⛔ **Ni una sola parada declara pertenecer a una estación.** El feed son **984 puntos
independientes** y **nada dice cuáles son la misma parada en sentido contrario, ni cuáles están a
veinte metros.**

⭐⭐ **Y el dato que lo agrava:** bus y tranvía **no comparten ni una parada**.

```
   paradas usadas por rutas de tipo 704 (bus)        934
   paradas usadas por rutas de tipo 900 (tranvía)     50
   ⭐ intersección                                      0
   suma                                              984  = todas, sin sobrar ninguna
   paradas que nadie usa                               0
```

⇒ **La conexión bus↔tranvía no existe en el fichero.** Un usuario que baja del tranvía y coge el
bus lo hace en dos paradas distintas, y **cuál con cuál es una decisión nuestra**, con su umbral de
distancia y su coste a pie.

⭐ **Y aquí está lo que convierte esto en una ventaja y no en un problema:** 004 ya tiene **el
grafo peatonal de la ciudad entera**. El transbordo no hay que inventarlo con un radio: **se puede
CALCULAR andando**, que es exactamente lo que un `transfers.txt` publicado nunca dice.
⛔ **Y no se diseña aquí.** Esto es reconocimiento.

---

## 5 · ⭐⭐ LA RECONCILIACIÓN 944 · 984 · 934 — y la cuarta cifra

**Cada número mide un universo distinto, y ninguno estaba mal:**

| cifra | qué mide exactamente | de dónde sale |
|---:|---|---|
| **984** | **todas** las filas de `stops.txt`: bus **y** tranvía | GTFS 1176, medido hoy |
| **934** | las paradas que usa alguna ruta de **`route_type` 704** (Avanza) | GTFS, derivado de `stop_times` × `trips` × `routes` |
| **50** | las que usa la **única ruta de tipo 900** (tranvía L1) | ídem — y `934 + 50 = 984` |
| **944** | el inventario **municipal de paradas de bus** | WFS `movilidad:MU3_paradas_bus_unicas`, `numberMatched=944`, bajado hoy |
| **939** | *(la cuarta, que anda por §10 del estado)* paradas de `00 ZGZ RADAR` | ⛔ **NO COMPROBADA aquí**: esa carpeta no se ha abierto en esta tanda |

### ⛔ Y el cabo abierto se cierra: no eran diez casos, eran DOCE

Las dos fuentes comparten el formato de código (`PA#####`), así que **se cruzan por `stop_code`**:

```
   WFS  · códigos distintos            944   (0 repetidos)
   GTFS · códigos que empiezan por PA  934

   ⭐ en el WFS y NO en el GTFS         11
   ⭐ en el GTFS y NO en el WFS          1
   ⇒ comunes                           933
```

⭐⭐⭐ **`944 − 934 = 10` era una RESTA, y la resta escondía dos casos.** Hay **doce** paradas
discrepantes, no diez: once en un sentido y una en el otro que se compensan parcialmente.

**Las once que solo tiene el municipal**, con su nombre:

```
   PA00617  Parque De Atracciones                          PA08130  Ramón Y Cajal / Camón Aznar
   PA00646  P.Duque De Alba / Sarrión                      PA08131  Conde Aranda N.º 10
   PA00647  P. Duque De Alba / Glorieta                    PA08132  Madre Rafols N.º 13
   PA00648  P. Duque De Alba / Monumento A La Legión       PA08133  Madre Rafols / Ramón Y Cajal
   PA00649  P. Duque De Alba / Velódromo (Dir.P.Atracc.)   PA01183  Belle Epoque / Tranvía
   PA00650  P. Duque De Alba / Velódromo (Dir.Cementerio)
```

**Y la única que solo tiene el GTFS:** `PA01320 · Av. Expo 2008 / Etopía`.

### ⭐ El positivo de control geométrico — ¿están con otro código?

**Sin esto, «no está» es indistinguible de «está y no lo he encontrado».** Para cada discrepante se
buscó la parada más cercana de la otra fuente:

```
   la más cercana de las doce está a  64 m   (PA01183 → PA01026, y es OTRA parada de esa calle)
   las demás, entre 108 m y 560 m
```

⇒ ⭐ **Ninguna tiene gemela.** Las doce son **discrepancias de inventario**, no de codificación.

⚠️ **Y la explicación se queda en hipótesis, declarada como tal.** Seis de las once forman el
corredor **Parque de Atracciones / Duque de Alba** y cuatro son un grupo contiguo en
**Ramón y Cajal / Madre Ràfols**: encajaría con *«el WFS inventaría el poste físico y el GTFS
publica solo lo que se sirve en este periodo»* — línea de temporada, desvío de obras. **`CAUSA NO
CONFIRMADA`:** para saberlo haría falta el histórico de líneas, que no se ha mirado.

---

## 6 · ⭐ LA CADUCIDAD, MEDIDA — y a quién pertenece el desbordamiento

**El feed declara su propio fin: `feed_end_date = 20261005`.** Son **56 días** desde hoy.

```
   filas de calendar_dates.txt          27.161
   servicios distintos                   1.458
   primera fecha                      20250916
   última fecha                       20261231     ⇒ 87 días más allá del fin declarado
   exception_type                     1 → 27.161   ⛔ NO HAY NI UN SOLO 2
   ⭐ filas posteriores al 20261005          72
```

⛔ **No hay una sola fila `exception_type = 2`.** Sin `calendar.txt` y sin exclusiones, **el
calendario entero es una lista de «este servicio SÍ circula este día»**, día a día. Es una forma
válida de GTFS y **es la que obliga a leer fecha a fecha** — lo que §5 del estado ya había
aceptado con los ojos abiertos.

### ⭐⭐⭐ Y el desbordamiento NO es «del calendario»: es DEL TRANVÍA

Partiendo el calendario por **quién usa cada servicio** —derivado de `trips`, no del nombre del
`service_id`—:

| grupo | filas | primera | última |
|---|---:|---|---|
| solo lo usan viajes de **bus** | **22.610** | **20260623** | **20261005** |
| solo lo usan viajes del **tranvía** | **464** | **20250916** | **20261227** |
| **nadie lo usa** (servicios huérfanos) | **4.087** | 20251010 | 20261231 |

```
   filas del BUS     fuera de [20260623, 20261005]      0      ⭐ ni una
   filas del TRANVÍA posteriores al 20261005           66
   filas del TRANVÍA anteriores al 20260623           279
   filas HUÉRFANAS  posteriores al 20261005             6
```

⇒ ⭐⭐⭐ **El bus respeta sus fechas declaradas al día. Quien las desborda es el tranvía**, con un
calendario que va de septiembre de 2025 a diciembre de 2026 — **quince meses dentro de un feed que
dice durar cuatro**.

⚠️ **Y no es inocuo:** de los seis servicios con fecha posterior al 05/10, **cinco tienen viajes**
(226 · 368 · 168 · 396 · 207). ⇒ **Un motor que no mire `feed_end_date` seguirá devolviendo
tranvías después de la caducidad**, con la cara de estar contestando bien.

⚠️ **196 de los 1.458 servicios del calendario no los usa ningún viaje** (4.087 filas, el 15,0 %).
Al revés no pasa: **0 viajes citan un servicio que no esté en el calendario.**

---

## 7 · ⭐ EL TRANVÍA — cómo se separa, y su cobertura

**Se separa por tres campos a la vez, y los tres coinciden:**

```
   agency_id     11    Tranvías Urbanos de Zaragoza S.L.   (el bus es agency_id 1)
   route_type   900    ⚠️ NO es 0
   route_id     210    route_short_name=TRA
                       route_long_name=Tranvía L1 Valdespartera - Actur - Parque Goya
```

| | |
|---|---:|
| rutas de tranvía | **1** de 53 |
| paradas de tranvía | **50** de 984 |
| viajes de tranvía | **5.107** de 34.427 (**14,8 %**) |
| servicios de calendario suyos | **17** de 1.458 |

⇒ **La cobertura es COMPLETA para lo que hay: Zaragoza tiene una sola línea de tranvía y está
entera**, con sus 50 paradas y su trazado. **No es un tranvía a medias: es un tranvía de una línea.**

⚠️ ⛔ **Pero `route_type` NO es el del GTFS básico.** `900` y `704` son **tipos extendidos**: un
lector que espere `0 = tranvía` y `3 = autobús` **no reconoce ninguna de las 53 rutas** y, según
cómo esté escrito, o las descarta todas o las mete todas en el mismo saco. **Es la primera trampa
del fichero y no avisa de nada.**

---

## 8 · ⚠️ QUÉ MIENTE ESTE FICHERO

**Nueve ejes, y el décimo —la semántica— aparte.**

| # | qué | por qué importa |
|---|---|---|
| 1 | ⭐⭐⭐ **DOS CONVENIOS DE `stop_code` EN UNA COLUMNA.** El bus escribe `PA00002`; el tranvía escribe `2102`, el número pelado | Es la trampa nº3 del estado, **confirmada con el dato de hoy**: `int(stop_code[2:])` da `2` para `PA00002` **y también** para `2102`. **No revienta: colisiona en silencio** |
| 2 | ⭐⭐ **`location_type` separa los dos operadores por accidente.** 934 filas lo dejan vacío y 50 escriben `0` | **Vacío y `0` significan LO MISMO en GTFS.** Separa correctamente hoy porque son dos manos escribiendo, no porque signifique nada. **Usarlo para distinguir el tranvía funcionaría y sería falso** |
| 3 | ⭐⭐ **`route_type` extendido sin avisar** (704 y 900) | Un validador que espere el vocabulario básico no reconoce ni una ruta |
| 4 | ⭐⭐ **El calendario del tranvía desborda quince meses** dentro de un feed de cuatro | Y **cinco de esos servicios tienen viajes**: se sirven horarios después de la caducidad declarada |
| 5 | ⭐ **`exception_type` es `1` en las 27.161 filas** | No hay ni una exclusión. Un lector que espere el par «circula / no circula» **nunca verá la segunda mitad** y no sabrá si es que no hay o que no la ha leído |
| 6 | ⭐⭐ **El 86,4 % de los horarios están declarados APROXIMADOS.** `timepoint`: **752.578 a `0`** y 118.139 a `1` | **El propio feed dice que seis de cada siete horas suyas son interpoladas.** Es su afirmación (ley 20) y es la más fuerte que hace sobre sí mismo |
| 7 | ⭐ **Horas por encima de 24:00** — 15.661 filas, hasta las **27:xx** | Es GTFS correcto (el servicio de madrugada pertenece al día anterior) y **revienta cualquier parser de horas ingenuo**. Los búhos viven ahí |
| 8 | **Trece decimales de latitud** | Precisión de nanómetro sobre una parada de autobús. **La cifra promete lo que el dato no tiene** |
| 9 | ⭐ **«Miguel ángel Blanco», y cuatro más** | `Nuestra Señora De Los ángeles` ×3 y `Vía Hispanidad N.º 73 / Nuestra Señora De Los ángeles`. ⛔ **No es mojibake**: **0 caracteres U+FFFD**, el fichero es UTF-8 correcto. **El texto está mal escrito en origen**, en un `Title Case` aplicado a máquina que no sabe de tildes |

### ⭐ El décimo eje — la SEMÁNTICA: perfecto en los nueve y significando otra cosa

> **`stops.txt` no es una lista de paradas: es una lista de POSTES.**

Las 984 filas no tienen `parent_station` ni estación. Dos postes enfrentados en la misma calle —el
de ida y el de vuelta— son **dos filas sin ninguna relación declarada**, exactamente igual que dos
paradas de barrios distintos.

⇒ ⭐⭐ **Es la misma forma del hallazgo de la paridad en H1:** *«la acera par y la impar son como
dos calles distintas que no guardan relación»*. **Aquí el dato lo dice literalmente, y esta vez a
nuestro favor:** no hay que descubrir la trampa, hay que construir la relación que falta.

⚠️ **Y la consecuencia práctica, que no se decide aquí:** cualquier cifra de «paradas» que se
publique en H2 tendrá que decir **si cuenta postes o sitios**, porque no son el mismo número y hoy
solo se conoce el primero.

---

## 9 · ⛔ DECLARACIÓN DE COBERTURA — qué se miró y qué NO

**Se miró:**

- Los **8 ficheros** del feed, con recuento de filas y de columnas, leídos con un CSV con comillas.
- La **ausencia** de los 9 ficheros que no vienen, con positivo de control.
- El cruce completo `stop_times × trips × routes` para saber qué parada usa cada modo (**870.717
  filas recorridas**, no muestreadas).
- El cruce **completo** de las 944 del WFS contra las 934 del GTFS, por código y por geometría.
- El calendario **entero**, partido por quién usa cada servicio.
- La codificación de los **984** nombres de parada.

**NO se miró, y es honesto decirlo:**

| qué | por qué |
|---|---|
| ⛔ **La geometría de los 89 trazados** | Se ha contado que están sanos y sin huérfanos; **no se ha mirado ni un metro de su recorrido**. Que un `shape_id` exista no dice que su línea sea correcta |
| ⛔ **Si las 984 paradas caen donde de verdad están** | Se ha comprobado que las 984 están dentro del bbox del término y que no hay coordenadas repetidas. **Nada más.** Ningún enganche, ninguna comparación contra la calle |
| ⛔ **Las 939 paradas de `00 ZGZ RADAR`** | La carpeta no se ha abierto en esta tanda. La cuarta cifra sigue **sin contrastar** |
| ⛔ **Por qué las once del WFS no están en el GTFS** | Hipótesis razonable, **sin confirmar**. Haría falta el histórico de líneas |
| ⛔ **Si los horarios son correctos** | Es H3 y no entra. Solo se ha contado lo que el feed **declara** de ellos |
| ⛔ **La licencia del feed** | El NAP exige clave y registro; **qué permite hacer con el dato no se ha leído en esta tanda**. ⚠️ Antes de publicar nada derivado hay que mirarlo |

⚠️ **Y el límite que envuelve a todos:** esto es **un feed, de un día**. Todo lo que dice este
documento sobre *«el GTFS de Zaragoza»* es en realidad sobre **`20260623_AUZSA_Y_TRANVIA`**. La
próxima descarga puede cambiar cualquiera de estas cifras, **y ese será el primer control de verdad
del instrumento** (§3).

---

## 10 · DESCUBRIMIENTOS — lo que creo que debe subir al estado

⛔ **Yo no escribo `DESPLAZAME-ESTADO.md`.** Esto es la lista, y la destila la conversación de
estrategia.

| # | qué | por qué sube |
|---|---|---|
| **1** | ⭐⭐⭐ **El feed NO trae transbordo de ninguna forma** (`transfers` · `pathways` · `levels` · `parent_station`, los cuatro a cero) y **bus y tranvía no comparten ni una parada** | Es la pieza central de H2 y **hay que construirla entera**. Cambia el desglose del hito |
| **2** | ⭐⭐ **La fila «Transporte» de §3 pasa de ⬜ a ✅ descargado**, con `feed_version 20260623_AUZSA_Y_TRANVIA` y sha256 | Hoy dice *«Decidido, no descargado»* |
| **3** | ⭐⭐ **El cabo «944 contra 934, sin explicar» se cierra — y no eran diez casos: eran doce** | §10 lo lleva abierto desde el 2/08. La resta escondía dos |
| **4** | ⭐⭐ **El desbordamiento del calendario es DEL TRANVÍA, no «del calendario»** | El estado lo cuenta como una rareza del feed. El bus respeta sus fechas al día; el tranvía mete quince meses. **Y cinco servicios post-caducidad tienen viajes** |
| **5** | ⭐⭐ **`route_type` es 704 y 900, tipos extendidos** | Cualquier lector escrito contra el GTFS básico no reconoce ninguna de las 53 rutas |
| **6** | ⭐ **La trampa nº3 del §7 se confirma con el dato de hoy** y con su causa: **dos convenios de `stop_code` en la misma columna** | El estado la tiene como fallo histórico de 003; es una propiedad viva del feed |
| **7** | ⭐ **El feed declara aproximados el 86,4 % de sus horarios** (`timepoint=0`) | Entra directo en el diseño de H3 y en lo que la app puede prometer |
| **8** | ⚠️ **El NAP devuelve 500, no 404, ante una ficha inexistente** | El día que la 1176 caiga, la señal será indistinguible de una avería. Afecta al plazo del 05/10 |
| **9** | ⚠️ **La respuesta del NAP no trae `last-modified` ni `etag`** | No se puede detectar una réplica rancia desde HTTP: la frescura hay que sacarla de `feed_version` |
| **10** | ⚠️ **`tools/` no está protegida por ninguna regla del `.gitignore`** | Se versiona por defecto todo lo que caiga ahí, y cada derivado ha tenido que excluirse a mano cuatro veces (líneas 312, 318, 324, 334). **No muerde hoy** —`bajar-gtfs.js` solo escribe en `data/exploracion/`, que sí está cubierta— pero es un cabo. ⛔ **No se ha tocado el `.gitignore`** |
| **11** | ⚠️ **La licencia del feed del NAP no se ha leído** | Antes de publicar nada derivado del GTFS hay que saber qué permite |

---

*Reconocimiento hecho el 10 de agosto de 2026 sobre `2026-08-10_nap_gtfs-ficha1176.zip`
(sha256 `5c96992c…f3a82`) y `2026-08-10_wfs_movilidad-MU3_paradas_bus_unicas.json`.
Los dos crudos están en `data/exploracion/`, **fuera de git**.*
