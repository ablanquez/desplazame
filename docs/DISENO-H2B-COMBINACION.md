# H2b · TANDA 7 — LA COMBINACIÓN DE MODOS · DISEÑO EN PAPEL

**Qué contesta:** cómo se compondría una ruta cuando el usuario marca varios modos a la vez.

**⛔⛔ ESTO ES UNA PROPUESTA SIN CONSTRUIR. No hay código, no hay artefacto nuevo y
no se ha tocado el motor. Lo único que se ha ejecutado son CONTADORES sobre datos
que ya existían, y cada cifra lleva su comando al lado.**

⛔ **Y `D1` NO SE DECIDE AQUÍ.** Se enuncia, se le ponen sus salidas con su coste, y
se para: **es una decisión de Antonio.**

> ⛔⛔ **CORREGIDO EL 14/08 — `D1` YA ESTABA DECIDIDA desde el 13/08.** La línea de
> arriba y todo el §1 quedan **superados por §1ter y §8**, que dicen qué corrigen y
> por qué. **No se borra nada:** §1 es lo que el ejecutor supo y con qué apoyo lo
> supo. ⇒ **Lee §1ter antes que §1.**
>
> ✅ **Y el 14/08 entran las dos que quedaban en la mesa** —el tranvía en la misma
> familia que el bus, y el orden de la lista— **⇒ el diseño queda CERRADO.**
> ⛔ **Cerrado no es construido:** sigue sin haber código, sin artefacto nuevo y sin
> una línea de `src/` tocada.

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

### 1.4 · ⛔⛔ PARO AQUÍ  — ⛔ **SUPERADO POR §1ter: la decisión ya estaba tomada**

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

---

## 1ter · ⛔⛔ CORRECCIÓN — `D1` YA ESTABA DECIDIDA. LO DE ARRIBA SOBRA

**Qué corrige y por qué:** §1.3 y §1.4 presentan `D1` como una decisión abierta y
**paran**. ⛔ **Es falso: la decisión estaba tomada desde el 13/08.** Lo de arriba
**no se borra** —es lo que el ejecutor supo y con qué apoyo lo supo— pero **queda
superado por esta sección**. *(Antonio, 14/08.)*

> **El bus entra SIN duración de trayecto. El motor compone —anda al poste, coge el
> 35, bájate en el 771— y no promete un tiempo total porque el dato no existe.**
> **⇒ Enseña la opción y decide el usuario.**

**Y las dos que quedaron colgando, decididas el 14/08 y ya dentro:**

> **1 · ⭐⭐ El TRANVÍA va en la misma familia que el bus: tampoco promete duración.**
> La decisión del 13/08 nombraba el bus porque era el caso que tenía delante.
> **⇒ `G` aplica a los dos.** *(Desarrollado en §8.7 punto 1.)*
>
> **2 · ⭐⭐ La familia sin total se ordena por nº de TRANSBORDOS y, a igualdad, por
> METROS A PIE** — porque las dos cifras existen y ninguna se inventa.
> ⛔ **Con su coste dentro de la lista y visible**, que es la condición.
> *(Desarrollado en §8.4 y §8.5.)*

⇒ ✅ **Con estas dos, el diseño de la tanda 7 queda CERRADO.** Lo que sigue abierto
son mediciones (§6) y preguntas (§7), **no decisiones.**

### 1ter.1 · ⚠️ POR QUÉ NO LA VI, dicho con su evidencia

⛔ **No fue por no mirar: mi copia del estado dice lo contrario.**

```
   DESPLAZAME-ESTADO.md   (copia en disco, 13/08 19:51, 4.978 líneas)
   línea 4284 →  ⛔ DECISIÓN PENDIENTE DE ANTONIO: si el bus entra en H2b con la
                 velocidad comercial publicada, y si el encadenado de testigos …
```

⭐ **Y el positivo de control, porque un «no está» sin él no vale nada:** el mismo
buscador **sí** encuentra decisiones tomadas en ese fichero —`el reloj` en H3
(línea 1981), *«fuera de la v1»* (línea 176)— y **sí** encuentra las otras cuatro
`PENDIENTE DE ANTONIO` (4158, 4284, 4374, 4832). ⇒ **El instrumento funciona; el
contenido llegaba tarde.**

⇒ ⭐⭐⭐ **La ley que sale de aquí:** *el documento de decisiones tiene UN SOLO
ESCRITOR ⇒ el ejecutor lo lee SIEMPRE con retraso.* **«Pendiente en mi copia» no
es «pendiente».** Un enunciado de decisión abierta es un CERO y necesita decir
sobre qué copia y de qué fecha se afirma. **Bitácora nº212.**

⚠️ **Y va hacia arriba, sin tocar el fichero:** la línea 4284 sigue diciendo
`PENDIENTE`. **Yo no la edito** —ese documento tiene un solo escritor y no soy yo—:
lo declaro y decide Antonio.

### 1ter.2 · Qué salida es, de las seis

**Ninguna de las seis, y conviene verlo porque explica su coste.**

| | | |
|---|---|---|
| **no es `A`** | el bus **sí** se ofrece | ⇒ no es `coste ∞` con otro nombre |
| **no es `B`** | el motor **sí** COMPONE — *anda al poste · coge el 35 · bájate* | ⇒ no son bloques separados |
| **no es `C`** | ⛔ **no se le pone duración estimada** | ⇒ los tres avisos del SIU dejan de importar |
| **no es `E`** | ⛔ **ni siquiera un coste interno**: no hay número escondido | ⇒ nada que auditar, porque nada que ocultar |
| **no es `F`** | no hay espera ni trayecto | ⇒ el reloj sigue fuera |

⇒ **Es una séptima, `G`: COMPONER SIN PROMETER.** El bus participa en la ruta
**como camino**, no como coste. ⭐ **Y su virtud es exactamente la que este
proyecto lleva persiguiendo:** *no hay ningún número inventado que haga ganar al
modo que uno quería, porque no hay número.*

⛔ **Su coste, escrito y no escondido:** la ruta con bus **no se puede ordenar
contra la que no lo lleva**, y eso el producto **se lo pasa al usuario**. Está
desarrollado en §8.

### 1ter.3 · ⭐ La medición de la frecuencia (§1bis) NO reabre nada: la confirma

`§1bis` se pidió *«antes de decidir `D1`»* y su resultado **apuntala la decisión ya
tomada**, no la discute:

- **`frequencies.txt` no está en el feed** (§1bis P1, con sus tres controles) ⇒ la
  espera **no es un número publicado** ⇒ ⛔ **`C` no se puede arreglar sumándole la
  espera**, que era su única reparación barata.
- **La única vía sería derivarla de las horas de `stop_times`** (§1bis P2) ⇒ y eso
  es justo lo que `docs/DISENO-H2A-RED.md` prohíbe: *«sus horas no sobreviven al
  cocinado»*. **No se deriva.**
- ⭐ **El candidato que dejé en `NO CONSTA`** —catálogo 335, *«Líneas, paradas y
  tiempos»*— **queda cerrado por Antonio (14/08): es el canal en TIEMPO REAL, no
  una tabla de horarios.** ⚠️ *Va con su atribución: esto lo aporta Antonio, no lo
  he medido yo* — y el tiempo real está fuera de la v1, así que **cierra el cabo
  por partida doble**.

⇒ ⭐⭐ **La frase de §1bis —*«la puerta está cerrada por una decisión que aún no se
ha tomado»*— era falsa por los dos lados: la decisión estaba tomada, y la puerta
está cerrada por falta de dato.**

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
*(⛔ **14/08 — ya no es «puede que»: NO existe, y es permanente. Ver §8.2.**)*
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

⛔ **14/08 — esta tabla se escribió con `D1` abierta. La fila 1 está HECHA y el
riesgo de la fila 4 se ha mudado de sitio: el orden corregido está en §8.6.**

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

⭐ **14/08 — las filas 5 y 6 DEJAN DE BLOQUEAR:** eran la condición de la salida
`C`, que la decisión de §1ter descarta. **Siguen siendo interesantes, pero ya no
son requisito de H2b.** Las filas 1-4 siguen vivas tal cual. Ver §8.6.

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

---

## 8 · ⭐⭐⭐ LA CONSECUENCIA DE `G` — EL MOTOR NO ELIGE POR EL USUARIO

**Esto no es dato: es diseño.** Sale entero de la decisión de §1ter y **hay que
escribirlo**, porque es lo que cambia en `D2`–`D5` ahora que el bus está cerrado.

> ⭐⭐⭐ **Cuando el usuario marca modos CON duración y modos SIN ella, el motor
> NO ELIGE POR ÉL: enseña las opciones.**

### 8.1 · ⛔ Primero, lo que casi se me escapa: EL HUECO ES CONTAGIOSO

**No es «el bus no tiene tiempo». Es «la RUTA no tiene tiempo».** En cuanto un solo
tramo carece de número, **el total desaparece para la ruta entera**, aunque los
otros tramos lo tengan de sobra:

```
   anda 259 m  →  4,7 min      ✅ lo sé
   el 35, del poste 744 al 771  ⛔ NO CONSTA
   anda 180 m  →  3,2 min      ✅ lo sé
   ─────────────────────────────────────
   TOTAL                        ⛔ NO CONSTA    ← y no es «7,9 min y algo más»
```

⚠️ **La tentación exacta a nombrar ahora, antes de que aparezca en código:**
publicar *«7,9 min + el bus»*. **Eso es una cota inferior disfrazada de dato**, y
el usuario la leerá como un total. ⛔ **Los tramos se publican con su número; la
suma NO se hace.**

**Cuánto alcanza el contagio — contado sobre la matriz de §2.1, no supuesto:**

```
   transiciones de la matriz          25 casillas − 2 diagonales «—»  =  23
   permitidas (✅ o ⚠️)                                                  17
   permitidas que TOCAN un modo sin tiempo (bus o tranvía)              12   70,6 %
   permitidas enteramente con tiempo                                     5   29,4 %
```

⇒ ⭐⭐ **Siete de cada diez combinaciones permitidas producen una ruta sin total.**
El caso «con tiempo» no es la regla con una excepción: **es la minoría.**

### 8.2 · Dos familias de respuesta, y ⛔ NO se ordenan entre sí

| | familia **CON TIEMPO** | familia **SIN TOTAL** |
|---|---|---|
| modos | a pie · bici propia · BiZi | cualquiera que incluya **bus** o **tranvía** |
| qué publica | ⭐ un número: *«32,6 min»* | los pasos, y **el tiempo de los tramos que lo tienen** |
| cómo se ordena por dentro | por tiempo *(ya funciona: tanda 5)* | ✅ **transbordos, y a igualdad metros a pie** — §8.4 |
| contra la otra familia | ⛔⛔ **no se ordena. Nunca.** | ⛔⛔ **no se ordena. Nunca.** |

⛔ **Y no es una limitación temporal que se arregle midiendo mejor:** son
magnitudes distintas, y **no hay factor de conversión que arregle un hueco** (§1.1).
⇒ **Se enseñan las dos.**

⭐ **Esto ya estaba a medias en §4.3 punto 3** —*«una ruta por combinación de modos
marcada, no una mejor»*—, escrito entonces como precaución. **Ahora no es una
precaución: es la forma obligada.**

### 8.3 · ⭐⭐ `NO-EMPEORA-AL-MARCAR` HAY QUE REENUNCIARLO, y sale MÁS fuerte

La ley 157 comparaba *«la respuesta con el modo marcado contra la respuesta sin
él»*. ⛔ **Con dos familias inordenables, «peor» no está definido entre ellas** ⇒
tal cual estaba escrita, **no es comprobable**.

⭐ **Y su forma correcta es más barata y más dura que la vieja:**

> **Marcar un modo SIN tiempo no puede alterar la respuesta de la familia CON
> tiempo. Sale IDÉNTICA, byte a byte.**

- ⭐ **Falsable, y con un instrumento que ya existe**: dos consultas y un `diff` —
  exactamente el rito de cierre de las tandas.
- ⭐ **Caza el fallo que más miedo daba** (§1.1): si alguien mete un `coste 0` para
  el bus «provisionalmente», la caminata de 200 m se convierte en viaje en autobús
  y **el `diff` sale con líneas**. ⛔ Con la ley vieja ese fallo pasaba.
- ⚠️ **Su límite, dicho:** no dice nada sobre si la familia sin total es buena.
  **Solo garantiza que no contamina a la otra.**

⇒ **Se puede construir ANTES que nada de lo demás**, y por eso `D5` cambia (§8.6).

### 8.4 · ✅ EL ORDEN DE LA FAMILIA SIN TOTAL — **DECIDIDO (Antonio, 14/08)**

Si hay tres maneras de ir en bus, **algo tiene que decidir cuál se enseña primero**,
y **no puede ser el tiempo**. Este agujero lo abrió la decisión de §1ter, y **queda
cerrado el mismo día**:

> ⭐⭐ **Se ordena por nº de TRANSBORDOS y, a igualdad, por METROS A PIE.**
> **Motivo declarado: las dos cifras existen y ninguna se inventa.**
> ⛔ **Condición de la decisión: su coste va DENTRO de la lista, no en un apéndice.**

⚠️ **Lo que quedaba por debajo, y por eso se enseña la tabla entera:** los otros
candidatos no eran malos por capricho, y sus costes **siguen siendo el precio que
se paga**.

| candidato | ⭐ qué gana | ⛔ qué cuesta |
|---|---|---|
| ✅ **nº de transbordos** *(1º)* | ⭐ dato duro, ya existe (2.538 enlaces), **cero número inventado** | ⛔ un transbordo puede ahorrar 15 min; ordenar por su número **prefiere el directo lento** |
| ✅ **metros a pie** *(desempate)* | ⭐ medido y ya publicado por el motor | ⛔ prefiere la ruta que te deja lejos en un bus que tarda una hora |
| **nº de paradas recorridas** | ⭐ está en `stop_times` sin tocar sus horas | ⚠️ **una parada no es una distancia**: 20 paradas del centro ≠ 20 del Actur |
| ⛔ **cualquiera con tiempo estimado** | — | ⛔⛔ **es la salida `C` por la puerta de atrás**, y está descartada |

⛔⛔ **EL COSTE, QUE VIAJA CON LA DECISIÓN Y NO SE PUEDE DESPEGAR DE ELLA:**

> **El primero de la lista NO es el más rápido, y el usuario no tiene cómo saberlo.**

⇒ ⭐⭐⭐ **Y por eso se le dice EN LA LISTA, no en un apéndice ni en una leyenda**
(redacción en §8.5). Un coste que se declara donde nadie lo lee **no está
declarado**: está archivado.
⇒ ⭐⭐⭐ **La razón, en una frase: EL ORDEN ES UNA AFIRMACIÓN AUNQUE NO LLEVE
NÚMERO.** Poner una ruta primera dice *«empieza por ésta»* con la misma fuerza que
un *«32,6 min»*, y **sin un número que auditar** — que es precisamente lo que la
hace peligrosa.

⚠️ **La salida que se descarta, dicha con su motivo:** **no ordenar** —enseñarlas
como conjunto— era más honesta en el papel. ⛔ **Cuesta que con más de 3-4 opciones
es ilegible**, que es el problema ya medido en §4.2; y ⚠️ **tampoco es neutral: un
conjunto se imprime en algún orden, así que «no ordenar» acaba siendo «ordenar por
lo que salga»** — la misma afirmación, sin nadie que la firme.

### 8.5 · Qué se le enseña al usuario — la redacción

⭐ **`L6` («nunca el más rápido») deja de ser una regla que hay que recordar y pasa
a ser estructural para el bus: no hay número con el que faltar a ella.**

```
   CON TIEMPO      En BiZi                       32,6 min
                   Andando                       58,1 min

   SIN TOTAL   ⛔ estas opciones NO dicen cuánto tardan: el tiempo de viaje del
               bus y del tranvía no está publicado, y no lo estimamos.
               ⛔ ordenadas por TRANSBORDOS y metros a pie — NO por rapidez:
                  la primera no es la más rápida, y no sabemos cuál lo es.

                  0 transbordos · 439 m a pie
                     andar 259 m · el 35 (744 → 771) · andar 180 m       7,9 min a pie
                  1 transbordo  · 505 m a pie
                     andar 410 m · el 23 (…) · el 40 (…) · andar 95 m    9,1 min a pie
                  1 transbordo  · 612 m a pie
                     andar 350 m · tranvía (…) · el 40 (…) · andar 262 m 11,0 min a pie
```

⚠️ **Las cifras del recuadro son de EJEMPLO** —ilustran la forma, no son una ruta
medida—: la única real es el par de tramos a pie de §8.1, que viene de la tanda 5.

**Cuatro decisiones de redacción, con su coste:**

1. ⭐ **La razón del hueco se dice UNA vez por familia, no por tramo.** ⇒ evita
   que §4.2 se cumpla —*los avisos ya son mayoría*— repitiendo lo mismo N veces.
   ⛔ **Coste:** un aviso a nivel de familia **es un aviso que se puede saltar
   leyendo**; el de tramo no. ⇒ ⚠️ Es **la excepción** al criterio de §4.3 punto 1
   (*el aviso viaja pegado a su tramo*), y **hay que declararla como excepción**, no
   dejar que se cuele.
2. ⭐⭐ **«No lo decimos» y no «no se sabe».** El tiempo de un bus **se puede
   saber**; lo que pasa es que **no está publicado y no lo inventamos**. Es la
   distinción `sin-lados-en-el-grafo` / `no-consta` de §4.1 aplicada aquí:
   ⛔ **esto es CONOCIMIENTO, no ignorancia.**
3. ⚠️ **El tiempo de los tramos a pie SÍ se enseña, pero nunca como total**, y va
   con su etiqueta —*«a pie»*— para que no se lea como el viaje entero.
   ⛔ **Coste: es la línea que más fácilmente se malinterpreta de toda la pantalla.**
4. ⭐⭐ **El criterio de orden se imprime EN LA CABECERA DE LA LISTA, con su
   negación explícita** —*«ordenadas por transbordos y metros a pie — NO por
   rapidez»*—, y **cada fila lleva las dos cifras por las que está ordenada**, para
   que el orden sea **comprobable a ojo** y no haya que creérselo.
   ⛔ **Coste: son dos líneas de cabecera y dos cifras por fila en la familia que
   ya era la más cargada** (§4.2). ⚠️ **Y es deliberado**: el coste de §8.4 **es
   condición de la decisión**, así que **no puede irse a un apéndice** aunque
   estorbe. *Un coste declarado donde nadie lo lee no está declarado.*

### 8.6 · ⇒ QUÉ CAMBIA EN `D2`–`D5`

| | qué decía | qué dice ahora |
|---|---|---|
| **`D2`** §2.1 | la matriz | ⭐ **no cambia ni una casilla.** Las prohibiciones eran por dato (`bici a bordo`) o por estado (`bici propia`), **no por tiempo** |
| **`D3`** §3.3 | *«si el cambio a pie↔bus vale 0 y el de BiZi 240 s, el motor prefiere el bus por una asimetría del DATO»* | ⭐⭐ **el riesgo desaparece, y no por haberlo medido: el bus y el BiZi ya no compiten en la misma lista.** ⇒ los 240 s siguen aplicando **dentro** de la familia con tiempo |
| **`D4`** §4.3 pto 3 | *«con `D1` sin decidir puede que ni siquiera exista un orden»* | ⛔ **ya no es «puede que»: NO existe**, y es permanente (§8.2) |
| **`D5`** §5 fila 1 | *«tanda 1 = la decisión de `D1`»* | ✅ **hecha.** ⇒ la 2 y la 3 pasan a ser la 1 y la 2 |
| **`D5`** §5 fila 4 | *«puede fallar EN VERDE: producirá rutas y que las produzca no demuestra que sean comparables»* | ⭐ **ese fallo concreto ya no puede ocurrir** —no hay coste que las haga comparables—. ⚠️ **El riesgo se muda al orden de §8.4: la lista saldrá ordenada y nadie sabrá por qué** |
| **`D5`** — **nueva tanda 0** | — | ⭐⭐ **`NO-EMPEORA-AL-MARCAR` en su forma nueva (§8.3): dos consultas y un `diff`.** Se puede construir **hoy**, sin enganche y sin composición, y **es la red que sujeta todo lo demás** |
| **`D5`** §6 filas 5 y 6 | *«bloquean: son la condición de la salida `C`»* | ⭐ **dejan de bloquear.** `C` está descartada ⇒ la velocidad comercial del SIU y la espera **ya no son requisitos de H2b**. ⚠️ **Siguen siendo interesantes como CONTRADICTOR** (estado, línea ~4275), pero eso es otra cosa |

### 8.7 · ⚠️ LO QUE LA DECISIÓN NO DICE, Y YO NO SUPONGO

1. ✅ **RESUELTO (Antonio, 14/08) — ya no es suposición mía: `G` APLICA A LOS DOS.**
   La decisión del 13/08 nombraba el bus **porque era el caso que tenía delante**;
   el tranvía está exactamente igual —50 paradas, cero tiempo (§0)— y **tampoco
   promete duración.** ⇒ La simetría con la que escribí §8.1–§8.6 **queda
   confirmada como decisión, no como supuesto**, y esas secciones se leen tal cual.
   ⭐ **Y conviene ver lo que esto cierra:** era el aviso de la salida `C` —*«no
   incluye el tranvía ⇒ el tranvía se quedaría sin número mientras el bus lo
   tiene»*, §1.3—. **Con `G` no hay asimetría posible: ninguno de los dos tiene
   número.**
2. ⚠️ **«Enseña la opción y decide el usuario» no dice CUÁNTAS opciones.** Con
   2.266 enlaces `bus×bus` (§7), *«las rutas en bus»* pueden ser muchas. ⇒ el tope
   y el orden son §8.4, **sin resolver**.
3. ⛔ **Sigue en pie la pregunta de §7 que la decisión no toca:** el modelo **no
   tiene VIAJE**, y `bus → bus` es el 89,3 % de los enlaces. ⚠️ **`G` no la
   arregla: la vuelve más visible**, porque ahora los tramos de bus se ENSEÑAN uno
   a uno, y *«baja en la parada A y sube en la parada A»* se leería en pantalla.
