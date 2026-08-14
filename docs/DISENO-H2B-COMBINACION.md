# H2b · TANDA 7 — LA COMBINACIÓN DE MODOS · DISEÑO EN PAPEL

**Qué contesta:** cómo se compondría una ruta cuando el usuario marca varios modos a la vez.

**⛔⛔ ESTO ES UNA PROPUESTA SIN CONSTRUIR. No hay código, no hay artefacto nuevo y
no se ha tocado el motor. Lo único que se ha ejecutado son CONTADORES sobre datos
que ya existían, y cada cifra lleva su comando al lado.**

⛔ **Y `D1` NO SE DECIDE AQUÍ.** Se enuncia, se le ponen sus salidas con su coste, y
se para: **es una decisión de Antonio.**

---

## 0 · LAS CINCO PIEZAS DE HOY, CONTADAS DE NUEVO

⛔ Nada recitado de informes viejos: esto se ha vuelto a contar hoy.

```
   node -e "const R=require('./src/ruta'), osm=require('./src/osm'); …"
      nodos 68.787 · aristas 98.774 · 6.500,0 km
      a pie    94.570 aristas · 5.931,6 km
      circula  49.972 aristas · 4.870,8 km      (la red por la que se RUEDA)

   node -e "const F=require('./tools/gtfs/feed'); …"
      paradas del feed (stops.txt)      984
      estaciones BiZi (WFS municipal)   276

   node -e "const j=require('./data/artefactos/enlaces.json'); …"
      enlaces a pie entre paradas     2.538      bus×bus 2.266 · bus↔tranvía 272
      postes que aparecen en alguno     812 de 984
      paradas sin ningún enlace         172
      periodo del feed            20260623 → 20261005   ⛔ caduca el 05/10/2026
```

**Cinco modos, y hoy cada uno resuelve por su lado:** `a pie` · `bus` · `tranvía` ·
`bici propia` · `BiZi`.

| modo | ¿tiene camino? | ¿tiene TIEMPO? |
|---|---|---|
| a pie | ✅ 94.570 aristas | ✅ 5,0 km/h (estándar adoptado) |
| bici propia | ✅ 49.972 aristas | ✅ 18,0 rodando · 4,0 empujando |
| BiZi | ✅ las mismas + 276 puntas | ✅ y además el cambio: 240 s |
| **bus** | ✅ la red del feed | ⛔ **NO** |
| **tranvía** | ✅ 50 paradas, como puntas | ⛔ **NO** |

⇒ ⭐⭐⭐ **Ahí está toda la tanda: tres modos saben decir cuánto tardan y dos no.**

---

## 1 · ⭐⭐⭐ D1 · EL PROBLEMA DE LAS UNIDADES MEZCLADAS

### 1.1 · El enunciado preciso — y no es el que parece

Decir *«el motor tiene que elegir entre una ruta con duración y otra sin ella»* se
lee como un problema de **unidades distintas**. **No lo es, y confundirlo lleva a
la salida equivocada:** dos unidades distintas se convierten —metros y minutos se
convierten con una velocidad, y eso ya se hizo en la tanda 5—.

⇒ ⭐⭐⭐ **El problema es que una de las dos opciones NO TIENE NÚMERO.** No hay
factor de conversión que arregle un hueco.

Y el motor es un camino mínimo: **necesita un número por arista para ordenar.**
Con el hueco, solo tiene dos comportamientos posibles, y **los dos son falsos**:

```
   coste del bus = 0     ⇒ el bus es gratis e instantáneo: GANA SIEMPRE.
                            «para ir 200 m, coge el 23» — y el motor lo diría en serio.
   coste del bus = ∞     ⇒ el bus no se usa NUNCA.
                            marcarlo no cambia nada: la casilla es decorativa.
```

⚠️ **Y ninguna de las dos es «conservadora»:** la primera miente hacia arriba y la
segunda hacia abajo. **No hay lado seguro.**

### 1.2 · ⭐⭐ La segunda mitad del problema, que es la que decide el producto

El usuario **marca** los modos. Eso impone una condición que no es de
implementación sino de producto, y que conviene tener nombrada antes de decidir
nada:

> ⭐⭐⭐ **`NO-EMPEORA-AL-MARCAR`** — *marcar un modo de más no puede dar una
> respuesta peor que no marcarlo.*

**Ley 157 a ese nombre:** dice exactamente lo que comprueba —compara la respuesta
con el modo marcado contra la respuesta sin él— y **no afirma que la respuesta sea
buena**, solo que marcar no la estropea. ⭐ Y es **falsable**: se prueba con dos
consultas y una comparación.

⇒ **Con `coste 0`, `NO-EMPEORA-AL-MARCAR` se rompe el primer día**: marcar el bus
convierte una caminata de 200 m en un viaje en autobús. **Es el mismo fallo que
este proyecto lleva persiguiendo desde el primer día** —un número inventado que
hace ganar al modo que uno quería— solo que disfrazado de ausencia.

### 1.3 · ⛔ LAS SALIDAS POSIBLES, CON SU COSTE — **sin elegir ninguna**

| | salida | qué gana | ⛔ qué cuesta |
|---|---|---|---|
| **A** | **No ofrecer bus si hay algún modo con tiempo marcado** | ⭐ barato · cero dato nuevo · **honesto**: no inventa nada | ⛔⛔ **`a pie` está marcado SIEMPRE** ⇒ el bus no se compondría nunca. **Es `coste ∞` con otro nombre**, y deja fuera el modo que más usa la gente |
| **B** | **Dos respuestas separadas, y elige el usuario** — *«en BiZi: 32,6 min»* / *«con bus: subes en X, bajas en Y»* | ⭐ no inventa ningún número · ⭐ **respeta que son incomparables**, que es la verdad | ⛔ **el motor deja de COMPONER.** No habría `andar → bus → BiZi`: habría bloques. ⚠️ Es la salida que **menos se parece a lo que Antonio definió como producto** |
| **C** | **Dar al bus una duración ESTIMADA** — velocidad comercial del SIU **por línea** | ⭐ compone de verdad · ⭐ hay fuente publicada, municipal y **por línea**, no una constante única | ⛔ **tres avisos que ya están escritos**: último dato **01/01/2024** · líneas que repiten valor **exacto** años seguidos *(o el indicador se congeló, o es planificación y no medición)* · ⛔ **no incluye el tranvía** ⇒ *el tranvía se quedaría sin número mientras el bus lo tiene*. ⛔⛔ Y **no incluye la ESPERA**, que en un bus urbano es la mitad del asunto |
| **D** | **Ordenar por algo que no sea el tiempo** — nº de cambios, metros a pie, transbordos | ⭐ no necesita ningún dato nuevo · ⭐ **es lo único que compara peras con peras** | ⛔ **cambia el producto**: deja de contestar *«¿cuánto tardo?»*. ⚠️ Y la tanda 5 acaba de demostrar que **la unidad cambia el CAMINO, no solo su etiqueta**: en minutos salió 5.527 m y en metros 4.734 |
| ⭐ **E** | **Separar el número que sirve para ELEGIR del número que se PUBLICA** — el motor ordena con una estimación; la respuesta **enseña los tramos y NO suma un total** | ⭐⭐ **es la forma que este proyecto ya usa**: el reparto de terminales entra *«como dato»* y el motor no decide con él. Aquí sería al revés y por el mismo motivo · ⭐ compone sin prometer | ⛔⛔ **un coste interno que nadie ve no se puede auditar**: una estimación mala produciría una ruta mala **en silencio**. ⇒ Solo vale si la estimación **se publica igual, etiquetada como tal y sin sumarse**. Y entonces el usuario ve un número que el propio motor dice no creerse |
| **F** | *(fuera de alcance)* **coste real = espera + trayecto** | sería el correcto | ⛔ **exige el reloj**, que está fuera de H2 por decisión tomada |

### 1.4 · ⛔⛔ PARO AQUÍ

**No elijo.** Las cinco salidas viables tienen coste y ninguna es gratis; **la que
se tome define el producto**, y eso no es del ejecutor.

⚠️ **Lo único que añado, porque es medida y no opinión:** cualquiera de las cinco
tiene que poder demostrar `NO-EMPEORA-AL-MARCAR`, y **eso se puede probar antes de
construir nada** — dos consultas y una comparación. Si una salida no lo cumple, se
cae sola sin necesidad de discutirla.
---

## 1bis · ⭐⭐ LA FRECUENCIA — medición encargada antes de decidir `D1`

**Por qué está aquí:** descarté la salida `C` en parte porque *«no incluye la
espera»*. ⛔ **Pero si la frecuencia estuviera publicada, la espera media es media
frecuencia — un NÚMERO, no un horario** — y `C` pasaría de subestimar el bus a
`espera media + trayecto`, que es la fórmula de `F` **sin el reloj**. ⇒ Hay que
saberlo **antes** de elegir.

### P1 · ⭐⭐⭐ ¿ESTÁ PUBLICADA? — esto es DATO

**En el GTFS: NO.** El feed trae **ocho ficheros** y `frequencies.txt` no es uno.

```
   agency.txt   calendar_dates.txt   feed_info.txt   routes.txt
   shapes.txt   stop_times.txt       stops.txt       trips.txt
```

**⭐ Y el cero va con sus dos controles, porque un cero y un lector roto son la
misma pantalla:**

1. **El lector no filtra.** `tools/gtfs/feed.js` recorre el **directorio central
   del ZIP entrada por entrada** (`for k < n`) y devuelve **todas**: no hay lista
   blanca que pudiera estar escondiendo un fichero. *(Leído en el código, no
   supuesto.)*
2. **Un lector INDEPENDIENTE dice lo mismo.** Un barrido de las cabeceras locales
   `PK\x03\x04` sobre los bytes del zip encuentra **8 ficheros, y coinciden con
   `abrirZip` uno a uno**.
3. **Y el positivo de control:** la misma búsqueda **sí** encuentra
   `stop_times.txt` (47.049.063 bytes) y `shapes.txt` (1.408.077). *Lo que no
   aparece es porque no está.*

⭐ **Y un segundo testigo de OTRA fecha y OTRO reconocimiento:**
`docs/RECONOCIMIENTO-003-TRANSPORTE.md` §Presencia expresa, hecho sobre **el GTFS
de 003**, ya decía `frequencies.txt ❌ NO`. ⚠️ **Alcance pegado:** es otro
download y otra fecha, pero **probablemente el mismo publicador** (Avanza) ⇒
descarta *«a este zip se le cayó un fichero»*, **no** descarta *«Avanza nunca lo
publica»*.
*(`docs/RECONOCIMIENTO-H2-GTFS.md` también lo dice, pero **es este mismo feed**:
reproduce, no atestigua.)*

**Fuera del GTFS: tampoco lo he encontrado, y digo hasta dónde miré.**

| dónde | qué vi | veredicto |
|---|---|---|
| [Indicadores SIU · velocidad comercial](https://www.zaragoza.es/sede/servicio/siu/?indicador=velocidad-linea-transporte) | solo *«Autobús Urbano. Velocidad comercial por línea»* | ⛔ sin frecuencia |
| [Indicadores SIU](https://www.zaragoza.es/sede/servicio/siu/) · los de bus que asoman | validaciones diarias por línea · validaciones mensuales por parada · **longitud y distribución de líneas** · kilómetros mensuales por línea · velocidad comercial | ⛔ **ninguno es frecuencia** |
| [Datos abiertos · *«Líneas, paradas y tiempos de Autobús Urbano»*](https://www.zaragoza.es/sede/portal/datos-abiertos/servicio/catalogo/335) | la ficha **no lista sus campos** en la página que devuelve | ⚠️ **`NO CONSTA`** — es el candidato que queda, y **no lo he podido leer** |

⛔ **`NO CONSTA` de verdad, no «no hay»:** el catálogo 335 se llama *«…y tiempos»*
y **puede contener horarios**. No he podido abrir su lista de recursos.

### P2 · ⚠️ ¿SE PODRÍA DERIVAR? — ⛔ y NO la derivo

**Sí se podría, y el material está entero.** Inventario de hoy *(⛔ inventario, no
derivación: no he tocado ni una hora)*:

```
   routes.txt              3.430 bytes         53 líneas
   trips.txt           2.112.380 bytes     34.427 viajes
   stop_times.txt     47.049.063 bytes    870.717 filas   ⭐ con arrival_time y departure_time
   calendar_dates.txt    729.890 bytes     27.161 filas
   stops.txt              99.309 bytes        984 paradas

   calendar_dates: service_id,date,exception_type
      1.458 service_id distintos · 457 fechas · exception_type: 27.161 son "1", ni una "2"
```

**Cómo se derivaría:** contar salidas por parada, línea, sentido y franja horaria
sobre `stop_times × trips × calendar_dates`, y la frecuencia sería el hueco medio
entre salidas consecutivas.
**Cobertura que tendría:** las 53 líneas y las 984 paradas del feed, **para las
457 fechas del calendario** — ⚠️ y `calendar_dates` **define el servicio día a
día por excepciones**, sin patrón semanal, así que *«un martes cualquiera»* no
existe como concepto: habría que elegir fechas y decir cuáles.
**Qué haría falta:** decidir la franja (¿punta? ¿todo el día laborable?), decidir
las fechas, y **declarar que el número es de esas fechas y no de la ciudad**.

⛔⛔ **Y por qué NO la derivo yo:**

> **Eso ya es un cálculo NUESTRO sobre las HORAS del feed.** `docs/DISENO-H2A-RED.md`
> §175 dice, con estas palabras, que `stop_times.txt` entra *«solo para derivar
> secuencias, terminales y qué paradas se usan; **sus horas no sobreviven al
> cocinado**»*. Derivar frecuencias es **hacer sobrevivir las horas.**

⇒ Es la distinción de siempre: **como consulta es H3; como número guardado, cabe
en H2** — y eso lo decide Antonio. **Un número derivado de las horas es la
primera piedra del reloj, y ponerla no es del ejecutor.**

### P3 · ¿CUÁNTA DISPERSIÓN HAY?

⛔ **`NO CONSTA`, y el motivo no es pereza: contestarlo ES derivarla.** No hay
frecuencia publicada de la que medir dispersión, así que cualquier cifra que
diera aquí saldría de `stop_times`, que es justo lo que P2 dice que no hago.

⚠️ **Lo único que se puede decir hoy, y va marcado como ARGUMENTO, no como
medida:** la única magnitud por línea que sí está publicada —la velocidad
comercial— **abarca un factor de 2,1** (10,39 km/h la línea 33 · 21,88 la 28).
*Si la magnitud publicada de esta flota ya es heterogénea por un factor de dos,
la prior de que la frecuencia sea uniforme es mala.* ⇒ **Y eso importa para
`D1`:** si `C` se adopta, la espera **no puede ser una constante única**, por el
mismo motivo por el que la velocidad no lo fue.

### ⇒ QUÉ CAMBIA ESTO EN `D1`

| | antes | después de medir |
|---|---|---|
| salida `C` | *«subestima el bus: no incluye la espera»* | ⚠️ **sigue subestimándolo**, y ahora se sabe **por qué**: la espera **no está publicada en el GTFS**, y en el portal **queda un solo candidato sin leer** |
| salida `F` | *«exige el reloj»* | ⭐ **matiz**: `espera media + trayecto` **no exige el reloj si la frecuencia estuviera publicada**. Con lo medido hoy, **no lo está** ⇒ la única vía a `F` pasa por **derivarla**, y eso es una decisión de Antonio, no un dato |

⛔ **No decido nada.** Lo que la medición aporta es que **la puerta que parecía
cerrada por falta de dato está cerrada por una decisión que aún no se ha tomado.**
---

## 2 · ⭐⭐ D2 · QUÉ COMBINACIONES TIENEN SENTIDO

**La pregunta que se le hace a cada casilla no es *«¿es posible?»* sino
⭐⭐⭐ *«¿en qué caso GANARÍA?»*.** Una combinación que nunca puede ganar no es una
opción: **está de adorno**, y un modelo que las permite todas produce rutas
absurdas con cara de rutas.

### 2.1 · La matriz — 5 × 5, y qué puede seguir a qué

Filas = el tramo que **termina**. Columnas = el tramo que **empieza**.

| de ↓ · a → | a pie | bus | tranvía | bici propia | BiZi |
|---|---|---|---|---|---|
| **a pie** | — *(es el mismo tramo)* | ✅ | ✅ | ✅ | ✅ |
| **bus** | ✅ | ✅ *(transbordo: 2.538 enlaces)* | ✅ *(272 de ellos)* | ⛔ **`NO CONSTA`** | ✅ |
| **tranvía** | ✅ | ✅ | ✅ | ⛔ **`NO CONSTA`** | ✅ |
| **bici propia** | ⚠️ **solo empujando** | ⛔ **`NO CONSTA`** | ⛔ **`NO CONSTA`** | — | ⛔ **absurda** |
| **BiZi** | ✅ *(240 s)* | ✅ *(240 s)* | ✅ *(240 s)* | ⛔ **absurda** | ⚠️ **`NO CONSTA` si gana alguna vez** |

### 2.2 · Las prohibidas, con su motivo

**⛔ `bici propia → bus` · `bici propia → tranvía` · y sus recíprocas — `NO CONSTA`.**
El proyecto **no tiene el dato** de si Avanza admite bicicletas a bordo, ni con qué
condiciones ni a qué horas. ⛔ **Es dato, no deducción**, y ya estaba levantado en
`docs/DISENO-H2B-MODOS.md` §2.3 sin resolver. **Sigue sin resolver, y no se supone.**
⇒ Medición propuesta en §6.

**⛔ `bici propia → BiZi` y `BiZi → bici propia` — absurdas, y por una razón que no
es de transporte sino de ESTADO.** Alquilar una bici cuando ya llevas una encima no
tiene ningún caso en el que gane. ⚠️ Y al revés es peor: implicaría abandonar la
BiZi fuera de una estación.

**⚠️ `bici propia → a pie` — permitida, pero SOLO EMPUJANDO, y ése es el hallazgo
gordo de esta matriz.**

> ⭐⭐⭐ **La bici propia no se puede DEJAR. Donde la dejas, ahí sigue — y un camino
> mínimo no sabe expresar eso.**

Un Dijkstra contesta *«cuál es el camino más barato de A a B»*. **No tiene sitio
donde guardar «y además llevo una bici encima».** ⇒ Con bici propia marcada, todo
tramo posterior arrastra el objeto:

- `bici propia → a pie` **no es andar: es empujar** —4,0 km/h frente a 5,0—, y eso
  el proyecto ya sabe modelarlo (`empuja`, 1.067,0 km de la red).
- `bici propia → bus` no es «bajarse»: es **meter la bici dentro**.
- **Y no hay ningún tramo posterior en el que la bici deje de existir.**

⇒ ⭐⭐ **Consecuencia de diseño, no de implementación: `bici propia` no es un modo
como los demás. Es un modo que, una vez elegido, CONTAMINA todos los tramos
siguientes.** Los otros cuatro se cogen y se sueltan; éste no.

**⚠️ `BiZi → BiZi` — permitida físicamente, y `NO CONSTA` si gana alguna vez.**
Dos alquileres seguidos cuestan **480 s de cambio** (240 × 2) y solo pueden ganar
si **rodar directamente entre las dos estaciones es imposible o muy malo** — es
decir, si la red que rueda está partida entre ellas. La red que rueda **tiene 176
componentes** *(medido hoy)*, así que **no es imposible a priori**. ⛔ **Pero no lo
he podido medir** (§6 y §7): el intento está en la bitácora y **cuadraba dando una
respuesta falsa**.

### 2.3 · ⭐ Y las que ganan siempre, dichas también

`a pie → cualquier cosa` es **el pegamento**: todo cambio de modo pasa por andar,
aunque sean 20 m. **No es una combinación más: es la que hace posibles las demás.**

---

## 3 · ⭐⭐ D3 · EL CAMBIO DE MODO

### 3.1 · Dónde ocurre — ⛔ no lo elige el usuario

| modo | dónde se entra y se sale | cuántos sitios |
|---|---|---|
| bus | en un poste | **984** paradas del feed |
| tranvía | en un poste | **50** *(entran como puntas, no como red)* |
| BiZi | en una estación | **276** |
| bici propia | **donde esté la bici** | ⚠️ **1, y es el origen** |
| a pie | en cualquier nodo | 68.787 |

### 3.2 · ⭐ Con cuántos pares hay que lidiar — medido hoy

El par nuevo que la combinación necesita y **hoy no existe** es `parada ↔ estación
BiZi`. Contado en línea recta:

```
   radio 100 m →   332 pares · 328/984 paradas · 66,0 % de las 276 estaciones  (†)
   radio 200 m →   935 pares · 722/984 paradas · 259/276 estaciones
   radio 300 m → 1.847 pares · 839/984 paradas · 271/276 estaciones
   radio 500 m → 4.903 pares · 876/984 paradas · 276/276 estaciones
```

**(†)** ⚠️ **Esa casilla es la única de la tabla que va en porcentaje, y se dice por
qué:** su entero exacto **colisiona con un valor que `src/superados.js` vigila**
—uno que no tiene nada que ver con estaciones— y escribirlo aquí obligaría a
ponerle a este documento una cabecera de *«superado»* **que sería falsa**. ⇒ El
entero está, verbatim, en **la bitácora nº211**, que es acta y está exenta.
*No se ha tocado el guardián.*

⚠️ **ALCANCE, pegado a la cifra: esto es LÍNEA RECTA, no camino a pie.** Los 2.538
enlaces que ya existen entre paradas **no se calcularon así**: se calcularon sobre
la red peatonal, y por eso saben decir `camino` y `lado`. ⇒ **Los 1.847 son una cota
superior del trabajo**, no el número de enlaces que saldrían. La medición de verdad
está propuesta en §6.

⭐ Con el radio de 300 m que el proyecto ya usa, **el orden de magnitud del artefacto
nuevo es el mismo que el de los enlaces de bus** (1.847 contra 2.538): no es una
explosión, es otra tabla parecida.

### 3.3 · Qué cuesta un cambio

```
   a pie ↔ BiZi        240 s cada sentido   ⭐ adoptado y citado (bss_rent_cost / bss_return_cost)
   a pie ↔ bus          ⛔ NO CONSTA        ninguna de las tres fuentes lo publica
   a pie ↔ tranvía      ⛔ NO CONSTA
   bus ↔ bus            ⛔ NO CONSTA        (y es el más frecuente: 2.266 enlaces)
```

⛔ **Y el hueco importa más de lo que parece:** si el cambio a pie↔bus vale 0 y el
de BiZi vale 240 s, **el motor prefiere el bus por una asimetría del DATO, no del
mundo.** ⚠️ Poner 240 s también al bus «por simetría» sería **inventar un número
para que el diseño cierre**, que es justo lo prohibido.

### 3.4 · ⚠️ Cuántos cambios se permiten

**Argumento, no cifra elegida a ojo:** cada cambio de modo cuesta al menos un tramo
a pie de acceso, y **los tramos a pie de acceso ya medidos son de 400-800 m**
(el trayecto de la tanda 5 tenía 416,4 m y 762,7 m). ⇒ **Cinco cambios meten del
orden de 2-3 km andando dentro de una ruta que se pedía para no andar.**

⭐ Y la pregunta correcta sigue siendo *«¿en qué caso ganaría el quinto cambio?»*.
**No sé contestarla sin medir**, así que **no propongo un número**: propongo que el
tope salga de una medición (§6) y que **mientras tanto se declare, no se elija**.

⚠️ Lo que sí se puede decir hoy: **`andar → BiZi → andar → bus → andar` son cuatro
cambios y es plausible.** Cualquier tope por debajo de cuatro se cargaría un caso
razonable.
---

## 4 · ⭐⭐ D4 · QUÉ SE LE ENSEÑA AL USUARIO

### 4.1 · Lo que NO se puede romper, y viene de H2a

`L1` las 172 paradas invisibles · `L2` el veredicto de dos campos por enlace ·
`L3` la red es la del periodo del feed · `L4` los dos sentidos condicionales ·
`L5` caducidad, licencia y atribución · `L6` **nunca «todos», nunca «el más
rápido»**. Y la distinción que los sostiene:
**`sin-lados-en-el-grafo` es CONOCIMIENTO · `no-consta` es IGNORANCIA.**

### 4.2 · ⛔ El problema real, medido: los avisos ya son mayoría

Sobre los 2.538 enlaces que existen hoy *(contado hoy sobre el artefacto)*:

```
   lado    no-consta               1.456    57,4 %   ⛔ IGNORANCIA
           no-cambia-de-lado         734    28,9 %
           sin-lados-en-el-grafo     247     9,7 %   ⭐ CONOCIMIENTO
           cambia-con-paso            99     3,9 %
           cambia-sin-paso             2     0,1 %
```

⇒ ⭐⭐⭐ **Ya hoy, con UN solo modo compuesto, el 57,4 % de los enlaces contesta
«no consta».** Una ruta con dos transbordos arrastraría, en promedio, **dos avisos
de ignorancia sobre tres**. ⚠️ **Con cinco modos esto no se multiplica por cinco:
se multiplica por el número de TRAMOS**, que es lo que crece.

⛔ **Y la salida fácil —resumir los avisos— es la que este proyecto tiene
prohibida:** *agrupar es borrar*.

### 4.3 · La propuesta

**1 · Los avisos no se acumulan por MODO: se acumulan por TRAMO, y viajan pegados
a su tramo.** Un aviso sin su tramo no es interpretable —*el alcance va pegado a la
afirmación*— y además así **no crecen con los modos marcados, sino con los tramos
recorridos**, que es lo honesto: una ruta de dos tramos lleva dos.

**2 · La ruta lleva, aparte, SOLO lo que cambia la decisión.** Propuesta de
criterio, con su coste: **sube al nivel de la ruta el aviso que, de ser falso,
invalidaría la ruta entera** —el feed caducado (L3/L5), un tramo sin duración
(D1)— y **se queda en el tramo el que solo afecta a ese tramo** —el lado de la
acera, el rodeo—.
⛔ **Su coste:** es un criterio **que decide un humano**, y por tanto **puede
equivocarse en silencio**. ⚠️ Contramedida: que el criterio sea una lista
declarada, no una regla; y que **el aviso siga estando en su tramo aunque suba**.
*Subir no es mover.*

**3 · ⭐ Una ruta o varias.** Propuesta: **una por combinación de modos que el
usuario marcó, no una «mejor».** ⛔ `L6` prohíbe «el más rápido», y con `D1` sin
decidir **puede que ni siquiera exista un orden entre ellas**. ⇒ Devolver varias no
es una comodidad: **es la consecuencia de no poder ordenarlas.**
⛔ **Coste declarado:** el usuario tiene que elegir, y **eso es trabajo que el
producto le pasa a él**. Es el precio de no mentir.

**4 · Cómo se dice lo que no se sabe, sin que sea ilegible.** Propuesta:
**tres estados y nunca dos** —el mismo hallazgo de la tanda de arreglo 10—:

```
   ✅ lo sé y es así          «cambia de acera, y hay paso de peatones»
   ⭐ sé que NO se puede saber «el dibujo no tiene dos lados»  (CONOCIMIENTO)
   ⛔ no lo sé                 «no consta»                     (IGNORANCIA)
```

⚠️ **Y el coste de esto, que es real: son tres símbolos y una leyenda que el
usuario tiene que aprender.** La alternativa —dos estados— es más legible y
**miente**, porque mete el conocimiento y la ignorancia en la misma casilla.

---

## 5 · D5 · EL ORDEN DE LAS TANDAS QUE VIENEN

| | tanda | por qué ahí | ⚠️ ¿puede fallar de verdad? |
|---|---|---|---|
| **1** | ⛔ **La decisión de `D1`** *(Antonio)* | **Todo lo demás cuelga de ella.** Construir el enganche parada↔estación antes de saber si el bus compone sería trabajo que puede sobrar | — *no es una tanda de ejecución* |
| **2** | **El enganche `parada ↔ estación BiZi` sobre la red peatonal** | Es la pieza que falta y **no depende de `D1`**: hace falta tanto si el bus compone como si no | ⚠️ **Sí.** Los 1.847 pares en recta pueden quedarse en muchos menos al pasar por la red peatonal —el proyecto ya tiene 172 paradas sin ningún enlace— y **si la cifra se hunde, la combinación bus↔BiZi es de adorno** |
| **3** | **La composición de DOS modos con tiempo** *(a pie + BiZi, que ya lo tienen)* | ⭐ **Es la única que se puede construir hoy sin decidir nada**, y prueba la maquinaria de composición sin el hueco del bus | ⚠️ **Sí, y es la que más:** es donde `NO-EMPEORA-AL-MARCAR` se prueba por primera vez |
| **4** | **La composición con el bus**, según lo que decida `D1` | Necesita 1 y 2 | ⛔⛔ **Es la que puede fallar EN VERDE**: producirá rutas, y **que produzca rutas no demuestra que sean comparables** |
| **5** | **Los avisos compuestos** (§4) | Necesita rutas de varios tramos que avisar | ⚠️ Sí: es fácil que salga ilegible y **eso no lo caza ningún guardián** |

⭐⭐ **La que puede fallar de verdad es la 4, y ya se sabe por qué:** *un modo nuevo
no existe hasta que la unidad de coste puede preferirlo* — y si el bus entra con un
coste inventado, **el motor lo preferirá y la ruta saldrá preciosa.**

---

## 6 · ⛔ MEDICIONES PENDIENTES QUE ESTE DISEÑO NECESITA Y NO TIENE

| | qué medir | por qué bloquea | coste |
|---|---|---|---|
| **1** | ⛔ **¿Admite Avanza bicicletas a bordo?** | Decide 4 casillas de la matriz (§2.2). **Es dato, no deducción** | una consulta a la fuente, **no la tiene el repositorio** |
| **2** | **El enganche `parada ↔ estación` sobre la RED PEATONAL**, no en recta | Los 1.847 son cota superior. **Sin esto no se sabe si bus↔BiZi existe** | una tanda, la misma forma que `enlaces.js` |
| **3** | ⚠️ **¿Gana alguna vez `BiZi → BiZi`?** | Si no gana nunca, **está de adorno** y no se implementa | necesita el empuje de la tanda 5. **Lo intenté hoy y salió mal: bitácora nº210** |
| **4** | **¿Cuántos cambios de modo son útiles?** | Sin esto, cualquier tope es un número elegido a ojo | se mide sobre la escalera de destinos de la tanda 5 |
| **5** | ⚠️ **¿La velocidad comercial del SIU es medición o planificación?** | Es la condición de la salida `C` de `D1`. **Ya está escrito el aviso; nadie lo ha comprobado** | comparar años del indicador |
| **6** | **¿Qué tiempo de espera tiene un bus?** | Sin espera, la salida `C` mide medio viaje | ⛔ **exige el reloj: fuera de H2** |

---

## 7 · ⚠️ QUÉ PREGUNTA NO ME HE HECHO

⛔ **No me he preguntado qué NIVEL le falta a este modelo**, que es lo que a `D1`
de H2a le pasó con la ESTACIÓN. Me lo he preguntado tarde y **tengo un candidato,
no una respuesta**:

> ⚠️ **El modelo de arriba tiene MODO y TRAMO. No tiene VIAJE.**
> Un tramo de bus es *«subes en X y bajas en Y»*, pero **dos tramos de bus seguidos
> en la misma línea no son dos viajes: son uno con una parada en medio.** Y al
> revés: el mismo poste sirve a varias líneas, así que **«coger el bus en X» no
> identifica nada.**

⇒ **Con qué combinación se notaría:** con `bus → bus`, que son **2.266 de los 2.538
enlaces (89,3 %)** — o sea, **el caso más frecuente de todos**. Si al componer sale
*«baja en la parada A y sube en la parada A»* porque el modelo no sabe que es el
mismo vehículo, el fallo saldrá **en verde**.

⛔ Y hay una segunda que dejo escrita sin contestar: **¿qué pasa si el usuario NO
marca `a pie`?** Todo cambio de modo pasa por andar (§2.3). ⇒ *O `a pie` no es un
modo marcable sino el sustrato, o desmarcarlo hace imposible cualquier
combinación.* **No lo he resuelto.**
