# DISEÑO H2b · LOS MODOS — qué es un modo en este proyecto

*Tanda 1 de H2b · 2026-08-12 · base `8d06b88`*

> ⛔⛔ **ESTO ES UNA PROPUESTA SIN CONSTRUIR. NO SE HA ESCRITO NI UNA LÍNEA DE CÓDIGO, y ninguna de
> las decisiones de aquí está implementada, probada ni aprobada.** Lo único que hay ejecutado son
> **mediciones de solo lectura** sobre datos que ya estaban en disco, y cada cifra lleva su comando.
> *Esta declaración existe porque su ausencia produjo `B·V1`: un documento de diseño que se leyó
> como un informe de lo construido.*

> **Este documento se AÑADE. No reescribe ninguno anterior.**

---

## §0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⭐⭐⭐ **La tabla `MODOS` NO sirve para esto, y lo que aguantó fue la semejanza** | Y se puede decir con precisión: **no es que el bus y el tranvía se parezcan en la calle — es que el fichero que los describe es el mismo.** `MODOS` describe **un FEED**, no un modo |
| ⭐⭐⭐ **Y el hallazgo mayor: el proyecto ya tiene DOS modelos de modo, en dos niveles, y no se tocan** | `MODOS` (`tools/gtfs/red-bus.js:65`) describe un feed · `papel(forma, modo)` (`src/forma.js:148`) describe una arista **y es una cadena de `if` que `throw`ea con un modo desconocido**. ⛔ **Entre los dos hay un hueco, y es justo el que H2b necesita** |
| ⭐⭐⭐ **La propuesta: un modo = CIRCULACIÓN × ACCESO** | *Por qué aristas puede ir* × *dónde se entra y se sale.* **BiZi y bici propia comparten CIRCULACIÓN y no comparten ACCESO; bus y BiZi comparten la forma del ACCESO y no la CIRCULACIÓN.** Eso explica la observación de Antonio sin inventar nada |
| ⛔⛔ **PARA Y AVISO en D2** | **Componer modos exige una unidad común, y los METROS no pueden serlo**: 2.000 m en bici baten a 500 m andando. ⚠️ **No es el reloj** —no hacen falta horarios— **es una VELOCIDAD POR MODO**, y de la bici no hay ninguna medida. **Decide Antonio** (§2.4) |
| ⛔ **¿733 tramos son una red o trozos sueltos? TROZOS, y no depende de la tolerancia** | Sin tolerancia ninguna: **666 componentes y la mayor tiene 27,05 km de 333,72 (8,1 %)**. Siendo absurdamente generoso —50 m— siguen siendo **122 piezas** (§4.3) |
| ⛔ **El aviso de los andenes gemelos en BiZi: REFUTADO, medido** | **276 estaciones, 276 nombres distintos, 276 números distintos, y el par más cercano está a 95,1 m.** El problema no existe en esta capa, y la fuente además trae `tipologia` (§3.2) |
| ⭐⭐ **Lo que de verdad frena a la bici y al coche está medido y es el mismo** | **El grafo es NO DIRIGIDO y nunca ha leído `oneway`** — la etiqueta aparece en **1 sola línea de todo `src/`, y solo para contarla**. Y la traen el **35,7 %** de los `cycleway` y el **65,3 %** de los ways de calzada (§4.2) |

---

## §1 · D1 · QUÉ ES UN MODO

### 1.1 · ⭐⭐⭐ Lo que YA hay, medido — dos modelos de modo que no se hablan

Antes de proponer nada, qué tiene el proyecto hoy. **Medido, no recordado:**

```
   $ grep -rn "modo === \|modo == \|=== 'bici'\|=== 'pie'\|esTranvia" src/*.js tools/ --include=*.js
```

De los **17** aciertos, **solo DOS deciden un comportamiento por modo de transporte**; el resto son
filtros de informe (`.filter(m => m.modo === 'bus')`) o **un `modo` que significa otra cosa** —el
veredicto de `src/direccion.js`, cuyos valores son `sin-numero-cerca`, `como-siempre`,
`misma-acera`—. ⚠️ **`modo` nombra dos conceptos sin relación en el mismo repositorio**, y eso ya es
una deuda (ley 157: *el nombre de un veredicto es una afirmación*).

Las dos que sí:

```
   src/forma.js:150     if (modo === 'pie') {
   src/forma.js:155     if (modo === 'bici') {
   src/forma.js:167     throw new Error('modo desconocido: ' + modo);
```

⇒ **Los dos modelos de modo del proyecto, uno al lado del otro:**

| | `MODOS` | `papel(forma, modo)` |
|---|---|---|
| **dónde** | `tools/gtfs/red-bus.js:65-83` | `src/forma.js:148-168` |
| **qué describe** | **un FEED**: qué líneas están muertas, qué sentidos tienen terminal condicional | **una ARISTA**: qué papel juega esta línea para quien la usa |
| **forma** | ⭐ una **TABLA**, dato por modo, **0 ramas** | ⛔ una **cadena de `if`**, una rama por modo |
| **modos que conoce** | `704` bus · `900` tranvía | `'pie'` · `'bici'` |
| **con un modo nuevo** | una fila | **una rama — y hoy `throw`ea** |

### 1.2 · ⭐⭐⭐ EL VEREDICTO SOBRE `MODOS`: lo que aguantó fue la semejanza, y se puede nombrar

⛔ **`MODOS` no sirve para D1**, y el motivo es más concreto que «bus y tranvía se parecen»:

> **Bus y tranvía caben en la misma tabla porque los describe EL MISMO FICHERO.** Son dos
> `route_type` del mismo GTFS: mismo lector (`tools/gtfs/feed.js`), mismos `stops.txt`, `trips.txt`,
> `stop_times.txt`, misma forma de dato. **Lo que la tabla parametriza no es el modo: es lo que
> cambia entre dos filas del MISMO esquema.**

⇒ **La bici no tiene feed. El coche tampoco.** Para ellos no hay ninguna fila que rellenar, porque no
hay tabla de la que sean fila. ⚠️ **La tanda 8 no demostró que el modelo escalara a cualquier modo:
demostró que escalaba a otro `route_type`** — que es un resultado verdadero y mucho más pequeño.

⭐ **Y lo que sí sobrevive de la tanda 8, y hay que conservarlo:** *«lo que un modo sabe de sí mismo
es DATO, no una rama»*. Esa frase es correcta y es la que hay que aplicar aquí. **Lo que estaba mal
era el universo de la tabla**, no la idea de la tabla.

### 1.3 · ⭐⭐⭐ LA PROPUESTA — un modo = CIRCULACIÓN × ACCESO

> **Un MODO no es una cosa: es un par.**
> **CIRCULACIÓN** — *por qué aristas puede ir, y a qué coste.* Es una función sobre la ARISTA.
> **ACCESO** — *dónde se entra y dónde se sale.* Es un conjunto de PUNTOS (o «cualquiera»).

⭐⭐ **Esto explica sin inventar nada la observación de Antonio** —*«BiZi se parece más al bus que a
la bici propia»*—:

```
   bici propia   CIRCULACIÓN bici    ACCESO libre
   BiZi          CIRCULACIÓN bici    ACCESO 276 puntos fijos     ⇐ mismo vehículo, otro acceso
   bus           CIRCULACIÓN bus     ACCESO 934 puntos fijos     ⇐ mismo ACCESO que BiZi, otra circulación
```

**BiZi y bici propia comparten la CIRCULACIÓN. BiZi y bus comparten la FORMA DEL ACCESO.** Meterlos
en un solo eje obliga a elegir cuál de los dos parecidos se honra, y los dos son reales.

**⭐ LA LEY 157 A LOS DOS NOMBRES**, y uno se cayó:

| nombre | ¿pasa? |
|---|---|
| `VEHÍCULO` | ⛔ **NO.** Era mi primer nombre para la CIRCULACIÓN. **Un peatón no es un vehículo**, y un lector concluiría que el modo «a pie» es un caso raro o que no encaja. **Encaja perfectamente: su circulación es «por donde se anda» y su acceso es «cualquier punto»** |
| `ESTACIÓN` | ⛔ **NO** para el ACCESO: nombra un nivel que unas fuentes declaran y otras no, y es exactamente la palabra que la tanda 10 rechazó |
| **`CIRCULACIÓN`** | ✅ dice por qué aristas puede moverse. No dice a qué velocidad ni si es legal: solo por dónde |
| **`ACCESO`** | ✅ dice dónde se entra y se sale. No dice si hay hueco, ni si está abierto |

**⚠️ EL COSTE DE ESTA DECISIÓN, declarado:**
- **Dos conceptos donde había uno.** Cualquiera que lea el modelo tiene que aprender los dos.
- **Lo que el usuario marca son PARES, no circulaciones**: marca «BiZi» y «bici propia» por separado
  aunque el vehículo sea el mismo. ⭐ *Eso no es un defecto del modelo: es lo que ya hace la
  definición de producto de Antonio. El modelo y el producto coinciden, y esa coincidencia es el
  mejor argumento que tiene esta propuesta.*
- **Se pierde la simplicidad de «un modo, una fila».** A cambio se gana que **añadir BiZi no toque la
  circulación de la bici**, y que el coche entre por la columna que le falta y no rompa la otra.

### 1.4 · ⭐⭐ LA TABLA DE LOS CINCO MODOS

⛔ **`NO CONSTA` significa que el proyecto no lo tiene medido, no que sea desconocible.**

| | **CIRCULACIÓN** — por qué aristas | **ACCESO** | **coste** | **qué lo excluye de donde otro sí entra** |
|---|---|---|---|---|
| **a pie** | ⭐ **existe y está medida**: `e.pie`, **94.570 de 98.774 aristas (95,7 %)**. La regla es `porQueNoSeAnda()` (`src/planarizar.js:167`) sobre una lista positiva de 17 valores de `highway` | **cualquier punto** del grafo | **metros** — la única unidad del proyecto (D2 de H2a) | `foot=no`, `access=no`, y todo `highway` fuera de la lista positiva ⇒ **4.204 aristas (4,3 %)** |
| **transporte público** | ⛔ **NO va por aristas.** Va por **secuencias de paradas** de una línea. Es otro objeto, no otro filtro | **984 postes fijos** (934 bus + 50 tranvía), y además **atado a la secuencia de su línea** | ⛔ **NO comparable**: hoy son *paradas*, sin reloj y sin distancia | que no haya línea que una las dos puntas |
| **bici propia** | ⛔ **NO EXISTE**: no hay `e.bici`. Los campos de una arista son `a b condEdificio condHorario condMirado condVia condicional highway largo nombreNoAplica pie precision pts unidoPorDefecto way` — **`pie` es el único por modo** | **cualquier punto**… ⛔ **y con ESTADO**: donde la dejas, ahí sigue (§2.3) | metros, **pero a otra velocidad** — y **de la bici no hay ninguna medida en el proyecto** | `escaleras` (**810 aristas**, la única regla que `papel()` ya declara). Del resto: **`NO CONSTA`** |
| **BiZi** | **la misma que bici propia** — ⭐ es la mitad del argumento del modelo | **276 estaciones**, subir Y bajar ⇒ **dos tramos a pie obligatorios** | metros de los 3 tramos, **+ el coste de 2 cambios de modo, que NO se puede expresar en metros** (§2.4) | lo mismo que la bici, **más** no haber estación cerca |
| **coche** ⏳ *futuro, no se diseña* | ⛔ **imposible hoy, y por una razón estructural medida**: **el grafo es NO DIRIGIDO** (`src/grafo.js`, `enlaza()` empuja en los dos sentidos) **y nunca ha leído `oneway`** | subir libre · ⛔ **bajar = aparcar, y no hay dato** | ⛔ NO comparable | **el sentido único**: `oneway` lo traen el **65,3 % de los ways de calzada** (10.096 de 15.460). Y los giros prohibidos no están en el modelo **ni como campo** |

### 1.5 · ⭐⭐ ¿QUÉ NIVEL LE PUEDE FALTAR A ESTE MODELO? (ley 169)

> *«Un modelo puede responder bien a la pregunta que se le hizo y aun así leer mal el mundo, porque
> le falta un nivel — y el nivel que falta solo se ve en el caso donde abunda.»*

`D1` de H2a identificaba postes sin una sola colisión y le faltaba **la ESTACIÓN**; se vio en el
tranvía, donde era sistemático. Aplicado aquí, **el candidato a nivel que falta es el ESTADO**:

> **CIRCULACIÓN × ACCESO describe un modo como si el viaje no tuviera memoria.** Y **la bici propia
> tiene memoria**: si la dejas en el minuto 4, en el minuto 20 sigue ahí y no está donde tú estás.

⚠️ **Y se notaría exactamente en el modo donde abunda: la bici propia.** En los otros cuatro no se ve
—andando no dejas nada, del bus te bajas y ya está, la BiZi se ancla y deja de ser tuya— **así que un
modelo probado con esos cuatro saldría verde.** Es la misma forma que el tranvía: *el caso raro no
enseña el hueco; lo enseña el caso donde es sistemático.*

⛔ **No lo resuelvo aquí.** Lo declaro como el sitio por donde este modelo se rompería, y en §5 va
antes que la bici propia por eso.

---

## §2 · D2 · LA COMBINACIÓN — cómo se compone una ruta con varios modos

### 2.1 · La forma: capas y puntos de cambio

Con `CIRCULACIÓN × ACCESO`, componer es mecánico y **no necesita un motor nuevo**:

- Cada CIRCULACIÓN marcada por el usuario define **una capa** sobre el mismo grafo: el mismo conjunto
  de nodos, y las aristas que esa circulación admite.
- Cada ACCESO define **los puntos donde se puede saltar de una capa a otra**, y en qué sentido.
- Una ruta es un camino que **atraviesa capas por sus puntos de acceso**.

⭐ **Y esto NO es un grafo nuevo:** son las mismas aristas con un predicado distinto, más una arista
de cambio en cada punto de acceso. *El coste de la propuesta es un predicado por circulación y un
campo por arista, no una segunda geometría.*

### 2.2 · ⭐⭐ El caso que hay que resolver sí o sí: andar → pedalear → andar

```
   origen ──a pie──► estación A ──BiZi──► estación B ──a pie──► destino
                        ▲                     ▲
                        └── cambio 1 ─────────┴── cambio 2
```

**Los dos cambios ocurren en un punto que el usuario no elige: la estación.** Consecuencias, y las
tres son del modelo, no del código:

1. **El punto de cambio es un NODO del grafo**, no un sitio del mapa. ⇒ las 276 estaciones tienen que
   estar enganchadas al grafo peatonal **y** ser el mismo nodo para las dos capas. Si se enganchan
   dos veces, el cambio de modo cuesta un rodeo inventado.
2. **El buscador no puede elegir la estación al final: la elige el camino.** No es *«la estación más
   cercana al origen»* — es *«la pareja de estaciones (A,B) que minimiza el total»*, y son
   **276 × 276 = 76.176 parejas** si se hace a lo bruto. ⚠️ *La aritmética de esto no está hecha y no
   la invento; va a §6 como medición pendiente.*
3. ⛔ **Y el cambio cuesta algo.** Desanclar y anclar no es gratis. **Y ahí se rompe algo (§2.4).**

### 2.3 · ⛔ Las combinaciones que NO tienen sentido, dichas

| combinación | veredicto |
|---|---|
| **bici propia → bus** | ⛔ **¿dónde va la bici?** El proyecto **NO tiene el dato** de si Avanza admite bicicletas. `NO CONSTA`, y **no se supone**: es una regla que tiene que declarar Antonio, no una que se deduzca |
| **bici propia → cualquier cosa que no sea bici propia** | ⛔ **Es el problema del ESTADO (§1.5).** Si la dejas, la ruta te obliga a volver a por ella o a abandonarla. **Ninguna de las dos cosas la sabe expresar un camino mínimo sobre un grafo** |
| **BiZi → BiZi seguidas** | ⛔ **absurda**: anclar y desanclar en el mismo sitio. Se evita solo si el cambio de modo tiene coste > 0, y **hoy no lo tiene** (§2.4) |
| **bus → BiZi**, **BiZi → bus** | ✅ **tiene sentido y es el caso interesante.** Los dos tienen acceso por puntos fijos y entre ellos hay un tramo a pie: **es exactamente la forma de los 2.538 enlaces de H2a** |
| **a pie → a pie** | ✅ trivial: es una sola capa |

⚠️ **Y lo que esto significa para el modelo:** hacen falta **dos** cosas que hoy no existen — un
**coste de cambio > 0** (o se generan rutas con cambios inútiles) y una **regla de compatibilidad
entre circulaciones**. Ninguna de las dos la invento aquí.

### 2.4 · ⛔⛔⛔ PARA Y AVISO — componer modos exige una unidad común, y los metros no lo son

**Este es el punto donde me paro, y lo digo en grande porque es la costura de parada del encargo.**

H2a nunca tuvo que comparar entre modos: publicó **metros** de un tramo a pie y **no eligió nunca**
entre dos alternativas. En el momento en que el usuario marca varios modos y el motor **compone**,
tiene que elegir. Y elegir necesita una escala común:

```
   500 m andando   contra   2.000 m en BiZi
   ⇒ en METROS gana andar.   ⇒ en la calle gana la bici, y no hay discusión.
```

⛔ **Los metros no pueden ser la unidad común de una ruta multimodal.** No es un detalle de
implementación: **es que la única unidad que el proyecto tiene deja de significar lo mismo en cuanto
hay dos modos.**

⚠️⚠️ **Y ahora la distinción que hay que hacer bien, porque parece la costura de parada y no lo es:**

| | |
|---|---|
| ⛔ **EL RELOJ** — horarios, frecuencias, bicis disponibles, llegadas | **Fuera de H2 y sigue fuera.** Nada de esto hace falta |
| ⚠️ **UNA VELOCIDAD POR MODO** — una constante | **Es otra cosa, y SÍ hace falta.** Es lo que convierte metros en algo comparable |

⇒ **Componer modos NO necesita el reloj. Necesita una velocidad por modo.** Y ahí está el problema
real, que es de datos y no de arquitectura:

- **a pie**: el proyecto la tiene **medida y como BANDA** — 4,3–4,5 km/h reales de Antonio, 5,0 km/h
  estándar en el buscador. ⛔ Convertir una banda en un punto es exactamente la ley 45: *una magnitud
  derivada arrastra el error de la constante con que se derivó, y si esa constante no está medida no
  es un dato: es una opinión con unidades.* **Y ya se cobró tres bandas físicamente imposibles.**
- **en bici**: ⛔ **NO CONSTA. Cero mediciones en todo el proyecto.**
- **bus y tranvía**: ⛔ **NO CONSTA, y no se puede derivar sin el reloj** — `stop_times` entró en H2a
  y **sus horas no sobrevivieron a propósito**.

⇒ ⛔⛔ **PARA Y AVISO. Las tres salidas que veo, con su coste, y NO elijo:**

| | salida | coste |
|---|---|---|
| **A** | **Componer solo en METROS y decirlo**: *«esta ruta es la más corta en distancia, no en tiempo»* | ⚠️ **Produce rutas que nadie usaría** —te manda andar 500 m antes que pedalear 2.000— y el usuario lo va a leer como tiempo aunque diga metros |
| **B** | **Una velocidad por modo, declarada y no medida**, con su límite viajando dentro del dato (ley 161) | ⚠️ **Es un número inventado que decide rutas.** Es lo que hizo la tanda 7 de H1 y lo retiró la tanda de arreglo 4 |
| **C** | **Medir la velocidad en bici antes de componer** — con las manos de Antonio, como se midió la de andar | ⏳ Cuesta una tanda de campo, y **es la única que no mete una opinión en el motor** |

⚠️ **Y una cuarta que no es salida y hay que nombrar para descartarla:** *dejar que el usuario marque
un solo modo cada vez.* **Eso no es componer: es el producto de antes de la definición de Antonio.**

---

## §3 · D3 · LAS ESTACIONES BiZi

### 3.1 · Lo que hay, medido hoy sobre los ficheros del 2/08

```
   $ node <medición>  sobre data/exploracion/2026-08-02_wfs_bizi_pag{0,50,100,150,200,250}.json

   features leídas ................. 276    numberMatched del servidor: 276
   id distintos .................... 276
   `numero` distintos .............. 276
   anclajes: suma .................. 5520    rellenos: 276 de 276
      mín 15 · p50 19 · máx 41
   ⭐ TODOS los campos al 100 %: numero · situacion · pavimento · coord_x · coord_y ·
     fase · nombre · anclajes_bicicletas · junta_municipal · poligono · tipologia
```

⭐ **Las 276 y los 5.520 se reproducen**, y con `numberMatched` del servidor al lado: no hubo
paginación perdida.

```
   tipologia      LINEAL 239 · ENFRENTADA 27 · DOBLE 10
   pavimento      CALZADA 122 · ACERA 122 · ZONA VERDE 28 · MEDIANA 4
   fase           FASE II 168 · FASE I 108
```

### 3.2 · ⛔⛔ EL AVISO DE LOS ANDENES GEMELOS: REFUTADO, Y MEDIDO

El encargo daba por hecho que *«las estaciones BiZi van a tener el problema de los andenes gemelos»*.
**No lo tienen, y no es una opinión:**

```
   nombres distintos (normalizados) ... 276 de 276      ⇒ CERO homónimos
   ⭐ pares de estaciones a menos de 120 m ... 2, y los dos con nombres distintos:
         95.1 m   #97 Constitución: Escar        #25 Plaza Los Sitios
        115.5 m   #32 Hospital Provincial        #20 Camón Aznar: César Augusto
```

⇒ **La marca `mismoNombreCerca` no se dispararía ni una vez sobre esta capa** —su umbral es 15 m y
aquí el par más cercano está a 95,1 m—, **y tampoco haría falta**: no hay dos estaciones con el mismo
nombre.

⭐⭐ **Y la fuente además trae el nivel que al GTFS le faltaba.** `tipologia` distingue `LINEAL` (239)
de `ENFRENTADA` (27) y `DOBLE` (10). ⚠️ **Con una cautela, porque el WFS no publica leyenda:** lo que
está medido es que **son UNA feature con UN número y UN recuento de anclajes**. Si `ENFRENTADA`
significa *«los anclajes están repartidos en dos frentes»* —que es lo que parece— entonces
**el Ayuntamiento ya modeló como una sola entidad lo que el GTFS dejaba como dos `stop_id`.** ⛔ Eso
último es una LECTURA y va marcada como tal: **lo demostrado es que no hay duplicados, no lo que
significa la palabra.**

⇒ ⭐ **La lección de la tanda 10 vale, pero al revés de como se esperaba:** *lo que la fuente
declara, no se inventa.* **Aquí lo declara, y por eso no hay nada que marcar.**

### 3.3 · El enganche al grafo — ⛔ MEDICIÓN PENDIENTE, y con su motivo medido

El enganche de H2·5 se midió para **postes de bus** (p99 11,1 m). ⛔ **Una estación BiZi no es un
poste, y la diferencia está en el dato, no en mi intuición:**

```
   pavimento de las 276 estaciones      CALZADA 122 (44,2 %) · ACERA 122 (44,2 %)
                                        ZONA VERDE 28 (10,1 %) · MEDIANA 4 (1,4 %)
```

⇒ **El 55,8 % de las estaciones NO está sobre una acera.** Un poste de bus lo está por construcción.
⚠️ **Y una estación en MEDIANA o en ZONA VERDE puede engancharse a una arista a la que no se llega
andando**, o quedar a un lado de una calzada que el peatón tiene que cruzar por otro sitio.

⇒ ⛔ **NO se supone que los 11,1 m valgan. Se vuelve a medir**, y la medición es la misma que la de
H2·5 con otro universo: distancia de cada estación a su arista de enganche, repartida **por
`pavimento`**, que es la variable que sospecho y que el dato ya trae. **Va a §6.**

---

## §4 · D4 · EL GRAFO CICLABLE

### 4.1 · ⭐⭐ ¿Grafo aparte o el mismo con aristas filtradas? — **el mismo**, y el coste está medido

**La propuesta es el MISMO grafo con un predicado nuevo por arista.** Los tres motivos, en orden de
peso:

1. ⭐⭐⭐ **Porque la red ciclable sola no lleva a ningún sitio** (§4.3): son trozos. Una ruta en bici
   **tiene que salir de ella**, y salir significa usar aristas que ya están en el grafo.
2. ⭐ **Porque la geometría ya está toda**: los `cycleway` son **4.675 aristas (191,47 km)** y la
   `calzada` **29.431 (2.075,71 km)**, ambas dentro de las 98.774. **Un grafo aparte duplicaría
   geometría que ya existe** y crearía el problema de mantener dos copias coherentes.
3. ⭐ **Porque el cambio de modo tiene que ocurrir en UN nodo** (§2.2), y dos grafos separados no
   comparten nodos.

**⚠️ EL COSTE, medido y no estimado:**

```
   campos de una arista hoy:
      a · b · condEdificio · condHorario · condMirado · condVia · condicional ·
      highway · largo · nombreNoAplica · pie · precision · pts · unidoPorDefecto · way

   ⭐ ¿existe e.bici? NO      ¿existe e.coche? NO      ⇒ `pie` es el único campo por modo
```

⛔⛔ **Y hay un coste que no esperaba y es el mayor de esta tanda:** el modelo VÍA·FORMA·PAPEL
**no está en el grafo que usa el motor.** `src/forma.js:3-5` lo declara él mismo —*«ESTE MÓDULO NO
TOCA EL MOTOR (…) `transitableAPie()` sigue mandando sin enterarse de que esto existe»*— y la lista
de campos de arriba lo confirma: **no hay `plataforma`, no hay `ciclista`, no hay `forma`.** Se
calcula en `src/modelo.js` como una capa paralela, para informes.

⇒ **Meter la bici en el grafo NO es «filtrar aristas»: es primero MOVER el modelo dentro del motor.**
Eso son **3.472 aristas** que ganan atributo, y **la decisión de si `forma` pasa a vivir en la
arista**, que cambia H1.

### 4.2 · ⛔⛔ El bloqueo estructural, y es el mismo para la bici y para el coche

```
   $ grep -rn "oneway" src/*.js
   src/bici-inventario.js:828:  for (const k of ['name', 'segregated', 'foot', 'bicycle', 'surface', 'oneway', …
   ⇒ UNA sola línea en todo src/, y solo para CONTARLA en un informe.
```

Y el grafo se construye simétrico — `src/grafo.js`, `enlaza()` empuja en `ady[id]` **y** en `ady[n]`.
⇒ **el grafo es NO DIRIGIDO y nunca ha leído el sentido.** Para andar da igual. Para la bici y para
el coche, no:

```
   ways con `oneway`   en los cycleway      536 de 1.503   (35,7 %)   yes:396 · no:140
                       en los de calzada  10.096 de 15.460 (65,3 %)   yes:9.286 · no:802 · -1:8
                       en TODOS los ways  12.596 de 48.211 (26,1 %)
```

⇒ ⚠️ **El 35,7 % de los carriles bici de OSM declara sentido y el motor no puede representarlo.**
Meterlo convierte el grafo en dirigido, **y eso toca H1**: la adyacencia, las componentes, y las diez
rutas congeladas. ⛔ **No se hace aquí ni de paso.**

⭐ **Y es el mismo bloqueo que impide el coche.** *La buena noticia es que se paga una vez.*

### 4.3 · ⛔⛔ ¿RED O TROZOS SUELTOS? — TROZOS, y no depende de la tolerancia

La capa, recontada hoy (⛔ no recitada):

```
   features 733 · numberMatched 733 · numberReturned 733 · timeStamp 2026-08-04T11:52:40.217Z
   geometrías: 2.120 líneas · 20.814 vértices
   longitud MEDIDA con src/geo.js aMetros ... 333,72 km
```

Uniendo las 2.120 líneas por sus **extremos**, con la curva entera delante y **sin elegir ninguna
tolerancia**:

```
   tolerancia   componentes  la mayor (km)  % de los km  sueltas (1 línea)
   0 m                  666          27.05         8.1 %                539
   0.1 m                487          27.05         8.1 %                373
   1 m                  466          30.41         9.1 %                364
   5 m                  383          32.44         9.7 %                286
   10 m                 285          42.71        12.8 %                194
   20 m                 203         121.82        36.5 %                135
   50 m                 122         183.03        54.9 %                 83
```

⭐ **Y el dato que no necesita ninguna decisión**, vértice a vértice:

```
   extremos de línea (2 × 2.120) ....... 4.240
   posiciones distintas ................ 2.712
   posiciones compartidas por 2 o más .. 1.327
```

⇒ ⛔⛔ **VEREDICTO: TROZOS SUELTOS.** Sin tolerancia ninguna son **666 piezas y la mayor tiene 27,05
km de 333,72 — el 8,1 %**. Y **estirando el criterio hasta lo absurdo** —50 m, que salta una calle
entera— **siguen siendo 122 piezas y la mayor no llega al 55 %.**

⭐⭐ **Y la FORMA de la curva dice más que cualquiera de sus filas:** de 0 a 5 m la mayor apenas se
mueve (27,05 → 32,44 km). **La fragmentación no son vértices que casi se tocan: son huecos de
verdad.** Por eso el veredicto **no depende de dónde se ponga el listón**, y por eso no hace falta
que Antonio decida una tolerancia para contestar esta pregunta.

⇒ **Lo que se decide con esto:** ⛔ **una ruta en bici NO puede quedarse en el carril bici**, y eso
deja de ser una sorpresa de la construcción para ser un requisito: **la circulación de la bici tiene
que admitir calzada desde el primer día.** ⚠️ *Y eso arrastra que la bici circule por donde van los
coches, con lo que eso significa para quien la use — que es una decisión de producto, no técnica.*

### 4.4 · ¿Sirve el modelo VÍA · FORMA · PAPEL? — sí, y ya está a medio camino

⭐ **Sirve, y es la pieza mejor colocada del proyecto para esto.** `papel(forma, modo)` ya contesta
*«¿qué es esta línea para quien va en bici?»*, y sus valores salen del dato municipal:

```
   reparto de CICLISTA sobre las 98.774 aristas         aristas      metros
   (ninguno)                                             95.302   6.257,15 km
   carril-en-calzada                                      1.006      47,22 km
   carril-sobre-acera                                       903      69,83 km
   calle-calmada                                            890      43,49 km
   senda-ciclable                                           673      82,29 km
   ⭐ aristas con `ciclista` .............................. 3.472     242,83 km
```

**Tres cosas que hay que decir de esta tabla:**

1. ⚠️ **`ciclista` cubre el 3,5 % de las aristas.** El otro 96,5 % es `NO CONSTA` para la bici —no
   *«no se puede»*—, y `papel()` ya lo devuelve así (`src/forma.js:165`: *«sin dato municipal NO se
   inventa»*). ⛔ **Un motor de bici que use `ciclista` como predicado no tendría por dónde ir.**
2. ⛔ **Dos de los seis valores de `CICLISTA` no aparecen nunca**: `en-obras` y `no-municipal` salen
   a **0 aristas**. Están en la capa (7 y 1 features) y no llegan a ninguna arista. ⚠️ *Un cero sin
   provocación no vale (ley 156); aquí queda declarado y sin explicar.* **Va a §6.**
3. ⭐ **Y el caso que motivó el modelo ya está contado**: **16.810 aristas (366,91 km) tienen papel a
   pie Y papel en bici** — 13.338 por la plataforma (pasos, `cycleway`) y **3.472 por el dato
   municipal.**

---

## §5 · D5 · EL ORDEN DE LAS TANDAS

⚠️ **Cambio el orden propuesto en el encargo, y con motivo.** El encargo proponía *1 estaciones · 2
grafo ciclable · 3 combinación · 4 bici propia*. **Propongo mover la unidad de coste al principio**,
porque §2.4 la convierte en un bloqueo y no en un detalle:

| | tanda | por qué ahí |
|---|---|---|
| **0** | ⛔⛔ **LA UNIDAD DE COSTE** — decisión de Antonio entre A/B/C de §2.4 | **Bloquea la 3 entera.** Y si la salida es **C**, arrastra una tanda de campo con las manos de Antonio: cuanto antes se sepa, mejor |
| **1** | **Las 276 estaciones al grafo**, con el enganche **remedido por `pavimento`** | Barato, aislado, y **su medición puede salir mal** (§3.3): si las de MEDIANA y ZONA VERDE enganchan lejos, cambia el diseño de la 3 |
| **2** | **La circulación de la bici** — el predicado, el `oneway`, y `forma` dentro del motor | Es la más cara y **toca H1** (§4.1, §4.2). No se empieza sin la 0 decidida |
| **3** | **La combinación** — capas y puntos de cambio | Necesita la 0, la 1 y la 2 |
| **4** | **La bici propia** | ⭐ **La última a propósito**: es la que trae el ESTADO (§1.5), que es el nivel que le puede faltar al modelo. **Se mete cuando lo demás está firme, no mientras se mueve** |

### 5.1 · ⭐ Cuál es la primera que puede fallar de verdad

**La 2, y no por su tamaño: por dónde muerde.**

- La **1** puede salir mal y el daño se ve: si las estaciones enganchan mal, sale un número feo y se
  decide. **Falla a la cara.**
- La **0** no puede fallar: es una decisión, y cualquiera de las tres salidas es defendible mientras
  se declare.
- ⛔⛔ **La 2 es la que puede salir VERDE estando mal.** Meter `forma` dentro del motor y añadir un
  predicado de bici **toca el grafo que sostiene H1 entero** — las diez rutas, los 26 números
  congelados, las 170 componentes. **Y un cambio en el grafo que no mueva ningún número publicado
  parece inocuo y puede no serlo**: es exactamente la forma del arreglo de `insertar` (tanda 8 de
  H1), donde el defecto llevaba tandas vivo sin mover un solo número de los que se miraban.
- ⚠️ **Y tiene una segunda trampa**: si la circulación de la bici se define como *«aristas con
  `ciclista`»*, la 2 sale verde, produce rutas, y **son rutas por el 3,5 % del grafo** (§4.4). **El
  motor contestaría, y contestaría mal.**

---

## §6 · MEDICIONES PENDIENTES — lo que este diseño necesita y no tiene

| | qué medir | por qué bloquea |
|---|---|---|
| **1** | ⛔⛔ **La velocidad en bici.** Cero mediciones en el proyecto | Sin ella, **componer modos es imposible o inventado** (§2.4) |
| **2** | ⛔ **El enganche de las 276 estaciones al grafo, repartido por `pavimento`** | El 55,8 % no está sobre acera; los 11,1 m de H2·5 son de postes de bus (§3.3) |
| **3** | ⚠️ **La aritmética de la búsqueda de pareja de estaciones** (276 × 276 = 76.176) | Decide si la combinación cabe en el motor tal cual (§2.2) |
| **4** | ⚠️ **Cuánta calzada hace falta para unir los 666 trozos** del carril bici | Dimensiona el riesgo de mandar la bici entre coches (§4.3) |
| **5** | ⚠️ **Por qué `en-obras` y `no-municipal` no llegan a ninguna arista** (7 y 1 features ⇒ 0) | Un cero sin explicación en un enumerado que el motor va a leer (§4.4) |
| **6** | ⚠️ **Qué cuesta hacer el grafo dirigido**: componentes, rutas congeladas, los 26 números | Es el bloqueo compartido de bici y coche (§4.2), **y toca H1** |
| **7** | ⛔ **La discrepancia UTM ↔ esfera** (0,079 %): decidir si H2a adopta `geo.aMetros` o se declara como límite | Bitácora nº197. **No cambia ninguna conclusión publicada**, pero H2b va a mezclar las dos métricas si no se decide |
| **8** | ⚠️ **Si Avanza admite bicicletas a bordo** | Decide si `bici propia → bus` existe (§2.3). **Es dato, no deducción** |

---

## §7 · ⚠️ LO QUE NO ME HE PREGUNTADO

- **Si el usuario quiere de verdad que se combine todo.** El producto dice *«marca varios»*; **no he
  preguntado si marcar tres modos produce una ruta que alguien quiera leer.** Una ruta con cuatro
  cambios es correcta y puede ser inservible.
- **Qué pasa con la vuelta.** Todo esto diseña **ir**. Con BiZi, volver depende de que haya anclaje
  libre en destino — y eso es el reloj, que está fuera. **No he mirado si eso rompe algo.**
- **Si «a pie» es un modo o es el suelo de todos.** Lo he metido en la tabla como uno más, pero en
  las rutas de BiZi y de bus **aparece siempre**, no por elección. ⚠️ *Puede que no sea una fila:
  puede que sea el fondo sobre el que van las demás.* **No lo he resuelto y cambia la tabla.**
- **Nada sobre la accesibilidad.** Escaleras, rampas, silla de ruedas: es otra CIRCULACIÓN con la
  misma forma, y **no la he mirado ni una vez.**
- **Si `CIRCULACIÓN × ACCESO` sobrevive al coche de verdad.** Lo he rellenado en la tabla, pero el
  coche trae **giros prohibidos**, que no son ni circulación ni acceso: **son una restricción entre
  DOS aristas.** ⛔ *Mi modelo no tiene dónde ponerlos, y lo digo antes de que llegue.*
- **Los 138 nodos huérfanos.** Midiendo el grafo salió que `g.nodos.length` = **68.787** y
  `g.contadores.nodos` = **68.649**; la causa está en `src/planarizar.js:508`, que cuenta **nodos
  usados por alguna arista**. ⇒ **El número publicado es el bueno**, y hay 138 nodos en el array que
  no toca ninguna arista. *No afecta a nada de aquí; se reporta porque nadie lo había dicho.*

---

## §8 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **La tabla `MODOS` no escala a otro modo: escala a otro `route_type`.** Lo que aguantó el
   tranvía fue **compartir fichero**, no parecerse. **Y la frase que sí sobrevive es la buena:** *lo
   que un modo sabe de sí mismo es dato, no una rama.*
2. ⭐⭐⭐ **El proyecto tiene DOS modelos de modo y no se hablan:** `MODOS` (un feed, tabla, 0 ramas)
   y `papel(forma, modo)` (una arista, cadena de `if`, **`throw` con un modo desconocido**).
   **Entre los dos falta el que H2b necesita.**
3. ⭐⭐⭐ **Propuesta: un modo = CIRCULACIÓN × ACCESO.** Explica que BiZi se parezca al bus **y** a la
   bici propia, en ejes distintos, sin inventar nada. ⛔ `VEHÍCULO` se cayó por la ley 157.
4. ⛔⛔ **PARA Y AVISO: componer modos exige una unidad común y los metros no lo son.** ⚠️ **No es el
   reloj: es una velocidad por modo.** De la bici **NO CONSTA**, cero mediciones. **Tres salidas con
   su coste, y las decide Antonio.**
5. ⛔ **La red ciclable municipal son TROZOS: 666 componentes sin tolerancia, la mayor 8,1 % de los
   km; a 50 m siguen siendo 122.** ⇒ **la bici tiene que poder ir por calzada desde el primer día.**
6. ⛔ **El aviso de los andenes gemelos en BiZi era falso**: 276 nombres distintos, par más cercano a
   **95,1 m**. Y la fuente **sí declara** el nivel (`tipologia`) que al GTFS le faltaba.
7. ⛔⛔ **El modelo VÍA·FORMA·PAPEL no está en el grafo que usa el motor**: los campos de una arista
   no incluyen `forma`, `plataforma` ni `ciclista`. **Meter la bici empieza por mover el modelo
   dentro del motor**, y eso toca H1.
8. ⛔ **El grafo es NO DIRIGIDO y nunca ha leído `oneway`** — una sola línea en todo `src/`, y solo
   para contarla. Lo traen el **35,7 %** de los `cycleway` y el **65,3 %** de la calzada. **Es el
   mismo bloqueo para la bici y para el coche, y se paga una vez.**
9. ⛔ **Dos fórmulas de distancia conviven en el proyecto** (UTM en H1, esfera en H2a) y **el rodeo
   publicado es un cociente entre las dos.** 0,079 %. Bitácora nº197.
10. ⚠️ **`modo` nombra dos conceptos sin relación** en el mismo repositorio: el modo de transporte y
    el veredicto de `src/direccion.js`.

---

## §9 · LAS DOS BATERÍAS

```
   base    10:34:41 → 10:54:17   exit 0   114 líneas
```

*(la de cierre, con su `diff`, va en el checkpoint)*

⚠️ **Esta tanda no toca código: no debería moverse ni una fila.** Y lo que sí toca —dos ficheros de
`docs/`— **está dentro del universo de la batería**, porque `src/superados.js:272` recorre `docs/`.
Por eso la línea base se lanzó **con el árbol quieto** y **no se escribió nada hasta que terminó.**

---

**Instrumentos citados:** [`src/forma.js`](../src/forma.js) · [`src/grafo.js`](../src/grafo.js) ·
[`src/planarizar.js`](../src/planarizar.js) · [`src/geo.js`](../src/geo.js) ·
[`src/modelo.js`](../src/modelo.js) · [`tools/gtfs/red-bus.js`](../tools/gtfs/red-bus.js) ·
**Bitácora:** nº197.
