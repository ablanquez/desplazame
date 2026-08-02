# Bitácora de fallos — DESPLÁZAME (004)

> El registro crudo de los fallos reales del proyecto, escrito EN CALIENTE.
> No es un changelog (eso cuenta qué cambió). No es la guía (eso cuenta la ley).
> Esto cuenta EL CASO: qué pasó, qué prueba dio verde mientras pasaba, y cómo se cazó.
>
> **La meta-ley:** la retrospectiva miente, así que el fallo se graba en el
> momento, no se reconstruye al final. Por eso nace con el proyecto, no después.

## Cómo se rellena

- **Una entrada por fallo.** No se fusionan, no se suavizan. Agrupar es borrar.
- **El campo estrella (⭐)** — "qué se probó y DIO VERDE mientras el fallo estaba
  vivo" — se captura **al DESCUBRIR el fallo, antes de arreglarlo**. Es el dato
  perecedero.
- **`NO CONSTA`** es un valor honesto y válido. Nunca se inventa un dato.

### Formato de una entrada (9 campos, en este orden)

## [YYYY-MM-DD] — Título del caso (una frase)
**Categoría:** carencia | visual | datos | rompe | seguridad | aviso falso | silencio falso | despliegue
**Síntoma:** qué se vio.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la prueba que mintió (o NO CONSTA)
**Causa raíz:** por qué pasó de verdad.
**Cómo se cazó:** usuario | test | ojo humano | casualidad
**Arreglo aplicado:** qué se hizo.
**Commit:** el hash del propio fix (o "(este commit)").
**Ley que sale de aquí:** la regla que queda.
**Traza:** ficheros/funciones tocados.

---

<!-- Entradas del reconocimiento (TANDA 0) — escritas en caliente durante el barrido -->

## [2026-08-02] — El dataset heredado no tiene ni una sola línea: es una nube de puntos

**Categoría:** carencia
**Síntoma:** el reconocimiento del dataset de `01 ZGZ RADAR REACT` buscaba geometría de calle
para construir el grafo del motor de rutas. No existe. Hay 46.150 portales (puntos), 3.359
nombres de vía (texto) y ni un `LineString`. El fichero que por nombre parecía la topología
—`vias-zaragoza.json`, 1 MB— resultó ser un catálogo de nombres: sus 8 campos son
`id, codigoVia, nombre, nombreCompleto, nombrePublico, nombrePublicoNorm, tipoVia, numPortales`.
Cero coordenadas.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el `callejero-zaragoza.metadata.json`
declara `"sourceLayers": ["urbanismo:Vias", "urbanismo:Portales"]` y `"crs": "EPSG:4326"`. Leer
eso invita a dar por hecho que la capa `Vias` trae geometría de vía: es una capa WFS de un
GeoServer de urbanismo, y su nombre es literalmente "Vias". El descargador pidió solo los
atributos alfanuméricos, y el metadata no registra en ningún campo que la geometría se
descartara. Un `bounds` con `minLat/maxLat/minLon/maxLon` en el mismo fichero refuerza la
impresión falsa de que ahí hay geografía de vías: ese bounds sale de los portales.
**Causa raíz:** el proyecto 001 ZGZ RADAR era un buscador de direcciones, no un calculador de
rutas. Para geocodificar "calle X número Y" basta un punto por portal; las aristas no le hacían
falta a nadie. El dataset está completo **para su propósito original** y vacío para el nuestro.
**Cómo se cazó:** ojo humano — abrir el fichero en vez de fiarse del nombre. Confirmado después
con un barrido de `LineString|MultiLineString|FeatureCollection|"geometry"` sobre todo el
proyecto: cero ficheros. Positivo de control del mismo grep con `portalId`: 8 ficheros. El
instrumento funciona; lo que no hay, no hay.
**Arreglo aplicado:** ninguno todavía — es un hallazgo de reconocimiento, no un bug que se
parchee. Queda registrado como el condicionante nº1 del proyecto: la topología hay que traerla
de fuera.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** un fichero llamado `vias.json` no contiene vías: contiene lo que
contiene. Antes de elegir stack se abre el dato y se mira la geometría real, porque la pregunta
"¿hay aristas?" decide el proyecto entero y no se responde leyendo nombres de fichero ni
metadatos de procedencia.
**Traza:** `data/generated/territorio/callejero/ayuntamiento-zaragoza/vias-zaragoza.json`,
`callejero-zaragoza.metadata.json`

## [2026-08-02] — El enriquecimiento territorial declara 100% de cobertura y trae el 29,6% de los números mal

**Categoría:** datos
**Síntoma:** `portales-zaragoza.territorial-enrichment.full.json` (78 MB) cruza cada portal del
callejero municipal con el reverse geocoding de Nominatim. El primer registro del fichero es el
portal nº3 de Martín de Abanto y OSM le asigna `"houseNumber": "6"`. Contados los 46.150: de los
37.046 que traen número, **10.961 no coinciden** con el número real del portal (29,6%). La calle
sí acierta; el número no.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el metadata del propio fichero:
`"coveragePercent": 100`, `"totalOk": 46150`, `"totalNotFound": 0`, `"totalError": 0`,
`"totalRateLimited": 0`, `"warnings": []`. Cinco contadores en verde y una lista de avisos vacía.
Todos son ciertos y ninguno mide lo que importa: cuentan si Nominatim **respondió**, no si
respondió lo correcto. Una cobertura del 100% con cero errores es exactamente el aspecto que
tiene un dataset con un tercio de los números equivocados.
**Causa raíz:** el reverse geocoding devuelve el objeto más cercano a unas coordenadas, no el
objeto que está en esas coordenadas. Con portales a menos de 10 m unos de otros —acera de
enfrente, portal contiguo— Nominatim resuelve al vecino. No es un fallo de Nominatim: es la
herramienta respondiendo lo que se le preguntó. El error está en tratar su respuesta como
verificación del portal en vez de como una aproximación.
**Cómo se cazó:** casualidad — al mirar la cabecera del fichero para describir su esquema, el
`numero: "3"` y el `houseNumber: "6"` estaban a seis líneas de distancia en la misma pantalla.
Luego se cuantificó comparando los dos campos en los 46.150 registros.
**Arreglo aplicado:** ninguno; el fichero es de otro proyecto y esta tanda es de solo lectura.
Queda la advertencia: si Desplázame llega a usar este enriquecimiento, el campo `houseNumber`
—y todo lo derivado de él— no es de fiar. Los campos `postcode`, `district` y `road` sí encajan.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** un contador de cobertura mide respuestas recibidas, no respuestas
correctas. Cuando un dato se enriquece cruzándolo con una fuente externa, la métrica que vale es
la de **concordancia con el campo que ya se conocía**, no el porcentaje de peticiones que no
fallaron. Si el dato de partida ya traía el número, compáralo: es una contraprueba gratis que
nadie hizo.
**Traza:** `portales-zaragoza.territorial-enrichment.full.json`,
`portales-zaragoza.territorial-enrichment.full.metadata.json`

## [2026-08-02] — Los sha256 del metadata no validan ninguno de los cuatro ficheros que verifican

**Categoría:** silencio falso
**Síntoma:** `callejero-zaragoza.metadata.json` publica `sha256` y `bytes` de sus cuatro ficheros
generados. Ninguno de los cuatro cuadra con el disco. Ejemplo en vías: el metadata dice
`bytes: 990140` y `sha256: 70d73b43…`; en disco hay 1.025.210 bytes y `9c787367…`. Un verificador
de integridad que ejecutara esa comprobación daría **fallo en los cuatro ficheros** de un dataset
que está intacto.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ NO CONSTA — no hay ningún script
de verificación en el proyecto que llegue a ejecutar esos hashes. El campo se escribió y nunca se
comprobó, así que no existe la prueba que mintió: existe la prueba que **nunca se corrió**. Que
es peor, porque el hash aparenta rigor sin costar nada.
**Causa raíz:** finales de línea. El hash y el tamaño se calcularon sobre el contenido con `LF`
y los ficheros están en disco con `CRLF` (verificado con `od -c`: `[ \r \n { \r \n`). La
diferencia de bytes es exactamente el número de líneas en los cuatro casos —vías 35.070,
search-index 48.079, portales 470.746, by-street 484.401—, o sea un byte extra por línea. Cuadre
perfecto, cero ambigüedad sobre la causa.
**Cómo se cazó:** test — contador de control independiente. Se comparó el `bytes` declarado con
el `stat` real, y al no cuadrar se contaron las líneas para explicar la diferencia.
**Arreglo aplicado:** ninguno, es dataset ajeno y solo lectura. Se registra para Desplázame: si
se genera un checksum, se genera sobre bytes en disco, o se fija el modo de escritura.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** un checksum que nunca se ha verificado no es integridad, es decoración.
Todo hash publicado necesita el comando que lo comprueba, ejecutado al menos una vez contra el
fichero real — y en Windows, calculado sobre los mismos bytes que acaban en disco, porque
`CRLF` rompe silenciosamente cualquier hash calculado en memoria con `LF`.
**Traza:** `callejero-zaragoza.metadata.json` (bloque `files`), los 4 ficheros del callejero

## [2026-08-02] — El metadata del enriquecimiento apunta a una carpeta de la máquina que no está en el proyecto

**Categoría:** datos
**Síntoma:** `portales-zaragoza.territorial-enrichment.full.metadata.json` declara
`"cacheFileUsed"` con una ruta absoluta a una carpeta local del disco E: que está **fuera** del
proyecto, y `"totalCacheHits": 46150` / `"totalFetched": 0`. Es decir: el fichero de 78 MB se
generó al 100% desde una caché que no vive en el repositorio y que no se ha inventariado.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ `"runtimeDependency": false` en el
mismo metadata, repetido además en cada uno de los 46.150 registros. Y es verdad en tiempo de
ejecución —la app no llama a Nominatim para servir una página— pero da a entender que el dataset
es autocontenido, y no lo es: es irreproducible sin una carpeta ajena.
**Causa raíz:** la caché de Nominatim se dejó fuera del proyecto para no engordarlo, y el
metadata registró la ruta de la máquina donde se ejecutó en lugar de un identificador estable
(un hash de la caché, o su recuento de entradas).
**Cómo se cazó:** ojo humano, leyendo el metadata entero en vez de los campos que interesaban.
**Arreglo aplicado:** ninguno (solo lectura). Se anota como riesgo de reproducibilidad y como
ruta local expuesta en el punto de sensibilidad del informe.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** `runtimeDependency: false` no significa autocontenido. Si un artefacto
se genera desde una entrada externa, el metadata registra **qué** era esa entrada (hash, tamaño,
recuento) y no **dónde estaba en la máquina de quien lo lanzó**: la ruta absoluta ni identifica
el dato ni sobrevive al cambio de equipo, y de paso publica la estructura de discos del autor.
**Traza:** `portales-zaragoza.territorial-enrichment.full.metadata.json`

## [2026-08-02] — Una vía del callejero municipal viene con una minúscula dentro de un nombre en mayúsculas

**Categoría:** datos
**Síntoma:** la vía `codigoVia 81` se llama `ANDADOR ABOGACíA TURNO DE OFICIO`: una `í`
minúscula en mitad de un topónimo íntegramente en mayúsculas. Es 1 caso sobre 3.359 vías (0,03%).
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la comprobación de codificación.
El fichero es UTF-8 correcto y se lee sin un solo carácter roto: `od -c` sobre ese nombre da
`303 255`, que es exactamente el UTF-8 de `í`. El resto de acentuadas mayúsculas del fichero
salen bien —`ABÚ`, `ARAGÜÉS`, `BESCÓS`, `MARTÍN`—, así que cualquier test de "¿se ven bien los
acentos?" pasa en verde. No es mojibake: es un dato de origen mal escrito que sobrevive intacto
a un pipeline impecable.
**Causa raíz:** viene así de la fuente (IDEZar / Ayuntamiento). Probablemente un `toUpperCase`
en el sistema municipal de origen que no cubría la `í`, o una entrada manual. El pipeline de
descarga no normaliza mayúsculas y lo propaga fiel.
**Cómo se cazó:** ojo humano — apareció en la primera entrada de la muestra de cabecera al
abrir el fichero, antes de buscarla. Después se contó sobre las 3.359 vías para saber si era un
caso o un patrón: es un caso.
**Arreglo aplicado:** ninguno (solo lectura). Anotado porque afecta a la búsqueda: el campo
`nombrePublicoNorm` sí la normaliza correctamente a `andador abogacia turno de oficio`, así que
un buscador que use el campo normalizado no se entera. Uno que muestre `nombre` en pantalla, sí.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** "los acentos se ven bien" y "los datos están bien escritos" son dos
comprobaciones distintas. La codificación correcta transporta con total fidelidad un texto
erróneo; validar UTF-8 no valida el contenido. Para lo segundo hace falta buscar el patrón
anómalo explícitamente, no mirar si hay caracteres rotos.
**Traza:** `vias-zaragoza.json` (registro `codigoVia: "81"`)

<!-- ─────────── TANDA 0.B · reconocimiento de 003_ZETABUS (2026-08-02) ─────────── -->

## [2026-08-02] — El puente de identidad de ZetaBus es 934/934 en bus y produce basura silenciosa en el tranvía

**Categoría:** datos
**Síntoma:** el puente `poste = int(stop_code[2:])` traduce el `stop_code` del GTFS al número de
poste que usa Avanza. Contado sobre el `stops.txt` real: **984 paradas, de las que 934 cumplen
`^PA[0-9]+$` y 50 no**. Las 50 son las del tranvía y su `stop_code` es numérico de cuatro
dígitos: `0101`, `0201`, `1101`… Aplicarles el puente no lanza ninguna excepción: `int("0101"[2:])`
= `int("01")` = **1**, y devuelve el poste 1 para "Avenida de la Academia". Un número plausible,
del rango correcto, y falso. Peor: `0101` → 1 y `1101` → 1 colisionan en el mismo poste.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ `ZETABUS-ESTADO.md:487` —
*"Puente de identidad: `poste = int(stop_code[2:])`. **934/934**, verificado en cada build."*
La afirmación es **cierta** y la verificación existe y corre en cada build. Lo que da verde es
el universo sobre el que mide: el artefacto horneado de 003 contiene 934 paradas (`modes: ["bus"]`),
así que "934 de 934" es el 100 % **de lo que 003 decidió cargar**. El denominador del feed es 984.
Un 100 % siempre esconde su denominador, y ese denominador cambia al cambiar de proyecto.
**Causa raíz:** no es un fallo de 003. 003 es un proyecto de autobús y su estado lo declara
explícitamente (`ZETABUS-ESTADO.md:467`: *"Tranvía / multimodal → Es el 004"*). El fallo sería de
004 si heredara la regla sin heredar su alcance: 004 **sí** quiere tranvía, y ahí el puente entra
en un dominio para el que nunca se escribió.
**Cómo se cazó:** test — contar el patrón sobre las 984 filas en vez de citar el estado. La
instrucción de la tanda era verificar el 934/934 contra el fichero, no aceptarlo. El fichero dio
984 y la diferencia apareció sola.
**Arreglo aplicado:** ninguno; esta tanda inventaría y no toca 003. Queda como condición de
trasplante: la regla del puente se puede tomar (es una DECISIÓN, gratis) **siempre que viaje con
su guarda**: se aplica solo a `stop_code` que casen `^PA[0-9]+$`, y el resto es otro modo.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** una regla heredada trae pegado un dominio de validez que casi nunca se
escribe al lado. "934/934" no significa "todas": significa "todas las que miré". Antes de
trasplantar una regla probada, se recuenta su denominador **en el universo del proyecto nuevo** —
y si el nuevo es más ancho, la regla no está probada, está sin probar en la parte que se añade.
**Traza:** `stops.txt` del GTFS (984 filas), `src/generated/gtfs.json` (`stops` 934,
`posteByStopId` 934), `ZETABUS-ESTADO.md:487`

## [2026-08-02] — El trazado real de las líneas existe en el GTFS crudo y no está en el artefacto que se lee

**Categoría:** carencia
**Síntoma:** `shapes.txt` **sí existe** en el feed: 89 `shape_id`, 27.603 puntos, referenciado por
los 34.427 viajes de `trips.txt` sin un solo huérfano. Es exactamente la geometría de línea que
al proyecto 004 le falta. Pero el artefacto que 003 hornea y que la app lee —
`src/generated/gtfs.json`— **no la lleva**: sus 74 `directions` tienen `lineId`, `directionId`,
`headsign`, `official` y `current`, y `official.stops` es una **lista de `stop_id`**, no un
trazado. Contado: **0 de 74 directions con geometría**.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el artefacto pasa por completo y
sin avisos: `generatedAt` fresco (2026-08-01), 934 stops, 44 lines, 74 directions, `validity`
correcta. Nada en él indica que se descartó una capa de datos. Quien mire `gtfs.json` para
decidir si hay trazado disponible concluye que **no lo hay** — y se equivoca por dos niveles: no
lo hay *en el artefacto*, sí lo hay *en el ZIP del que salió*.
**Causa raíz:** decisión deliberada y documentada de 003, no descuido. `ZETABUS-ESTADO.md:466` lo
registra como cabo abierto consciente: *"Dibujar el trazado teórico con la línea desviada sería
una mentira nueva. **No dibujar nada no engaña a nadie.**"* 003 tiene desvíos por obras que el
GTFS no refleja, así que pintar el trazado teórico habría mentido. 004 tiene otro problema —no
tiene NINGUNA geometría— y por tanto otro cálculo.
**Cómo se cazó:** ojo humano. El inventario del ZIP (`unzip -l`) y el del artefacto se hicieron
por separado, y solo al ponerlos en la misma tabla se vio que `shapes.txt` estaba en uno y no en
el otro.
**Arreglo aplicado:** ninguno (solo lectura). Consecuencia directa para el trasplante: **el
candidato bueno es el ZIP, no el artefacto.** Tomar `gtfs.json` porque "ya está cocinado" costaría
la única geometría de línea localizada hasta ahora en los dos reconocimientos.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** un artefacto horneado es una **decisión de otro proyecto congelada en
un fichero**. Lo que no contiene no es lo que no existía: es lo que a aquel proyecto no le hacía
falta. Antes de heredar un derivado hay que mirar su origen, porque el filtro que se aplicó al
cocinarlo respondía a preguntas que ya no son las nuestras.
**Traza:** `data/gtfs/zaragoza-gtfs.zip` (`shapes.txt`, 1.408.077 b),
`src/generated/gtfs.json` (`directions`), `ZETABUS-ESTADO.md:466`

## [2026-08-02] — Las cuatro piezas de más valor para 004 no existen en un clon del repositorio

**Categoría:** carencia
**Síntoma:** de todo lo inventariado en 003, lo que 004 querría está **gitignoreado sin
excepción**: el GTFS crudo (`data/gtfs/zaragoza-gtfs.zip`, 6,88 MB → `.gitignore:115`), el
artefacto (`src/generated/gtfs.json` → `.gitignore:69`), el índice de correspondencias
(`data/generated/correspondencias.json` → `.gitignore:73`) y **la capa de nombres**
(`src/generated/nombres.json`, 35.688 b → `.gitignore:69`). Verificado uno a uno con
`git ls-files --error-unmatch` (falla en los cuatro) y `git check-ignore -v` (regla y línea en los
cuatro). Un `git clone` de ZetaBus no trae ninguno: **existen solo en el disco de Antonio**.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ `find` y `ls`. Los cuatro ficheros
están ahí, con su peso y su fecha, y dos de ellos se regeneraron ayer (2026-08-01). Un inventario
hecho con `find` los lista como presentes y disponibles, que es justo la conclusión falsa: están
presentes **en esta máquina**. La distinción versionado/ignorado no la ve ningún listado de
ficheros, y es la que decide si el dato sobrevive a un formateo.
**Causa raíz:** ninguna avería — es una decisión de 003 argumentada por escrito en el propio
`.gitignore` y en `data/gtfs/README.md`: *"El GTFS NO se versiona. Solo su instrucción de
descarga. […] no es legal, es de frescura"*, con tres razones (caduca, cambia cada pocos meses,
pesa 6,6 MB y git guarda todas las versiones para siempre). El `.gitignore` de 003 está comentado
línea por línea y distingue datos curados de derivados. Es de lo mejor del proyecto.
**Cómo se cazó:** test — la tanda obligaba a declarar versionado/ignorado en cada fila del
inventario. Sin esa columna obligatoria, los cuatro habrían entrado en la lista de candidatos
como si clonar bastara.
**Arreglo aplicado:** ninguno. Se traslada a la lista de candidatos como el condicionante que
gobierna toda la propuesta: 004 **no puede obtener nada de esto clonando 003**. O lo descarga del
NAP con su propia `NAP_API_KEY` (y hereda las obligaciones del MITMS), o se copia desde esta
máquina asumiendo que copia un dato con fecha de caducidad.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** "el fichero está" y "el fichero está en el proyecto" son afirmaciones
distintas, y solo la segunda sobrevive a un clon. En cualquier inventario pensado para heredar
datos, la columna *versionado / ignorado* es obligatoria y va antes que el peso: un fichero
ignorado no es una dependencia del repositorio, es una dependencia **de una máquina concreta**.
**Traza:** `.gitignore:69,73,115`, `data/gtfs/README.md`, los cuatro ficheros citados

## [2026-08-02] — El GTFS no trae `calendar.txt` y su calendario se extiende tres meses más allá de su propia caducidad

**Categoría:** datos
**Síntoma:** dos cosas en el mismo sitio. (1) El feed **no incluye `calendar.txt`**: los ocho
ficheros del ZIP son `agency`, `calendar_dates`, `feed_info`, `routes`, `shapes`, `stops`,
`stop_times` y `trips`. Todo el calendario se define por excepciones en `calendar_dates.txt`
—27.161 filas, **todas de `exception_type=1`**, ni una de tipo 2—. (2) `feed_info.txt` declara
`feed_end_date: 20261005`, pero las fechas de `calendar_dates.txt` llegan hasta **20261231**:
hay 72 filas de servicio posteriores a la fecha en que el propio publicador dice que el feed deja
de valer.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ NO CONSTA como prueba ejecutada de
003 — pero sí existe la comprobación que *habría* mentido, y es la que recomienda el propio
`data/gtfs/README.md` del proyecto: *"Comprueba que es el que crees. Mira `feed_info.txt`"*. Es la
comprobación correcta y da una respuesta parcial: mirar solo `feed_info` no revela que el
calendario siga más allá, y mirar solo `calendar_dates` (máximo 20261231) daría una caducidad
tres meses más optimista que la real. Cada fichero por separado responde en verde a una pregunta
distinta.
**Causa raíz:** el publicador (Avanza) genera un feed con ventana declarada de 23/06 a 05/10 pero
vuelca en `calendar_dates` el calendario largo que tiene cargado, incluidos servicios especiales
de otoño e invierno. No es contradicción de datos: es que `feed_end_date` es una **declaración de
vigencia** y `calendar_dates` es un **volcado operativo**, y nadie los recortó para que
coincidieran.
**Cómo se cazó:** test — se sacó el mínimo y el máximo reales de la columna `date` con `awk`
sobre las 27.161 filas, en vez de leer la fecha declarada. Los dos números no coincidían con el
`feed_info` y ahí apareció.
**Arreglo aplicado:** ninguno (solo lectura). Lo que queda fijado, y era el punto urgente de la
tanda: **la caducidad real es el 5 de octubre de 2026**, confirmada por dos sitios independientes
—`feed_info.txt` (`feed_end_date: 20261005`) y el artefacto de 003 (`validity.endDate:
"2026-10-05"`)—. Hoy, 2026-08-02, el feed está **vigente, a 64 días de caducar**. Y el volumen lo
confirma: de las 27.161 filas de calendario, solo **72 (0,26 %)** son posteriores al 05/10. El
feed no se degrada poco a poco, se vacía.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** la fecha de caducidad de un feed se lee en `feed_info.txt`, pero no se
**comprueba** ahí: se comprueba contando cuánto servicio queda después de esa fecha. Un feed cuyo
calendario se prolonga más allá de su vigencia declarada seguirá devolviendo horarios el día
después de caducar, y una app que solo mire `feed_end_date` no lo notará — ni tampoco una que
solo mire el calendario.
**Traza:** `zaragoza-gtfs.zip` → `feed_info.txt`, `calendar_dates.txt`;
`src/generated/gtfs.json` (`validity`)

## [2026-08-02] — El GTFS oficial escribe "Miguel ángel Blanco": el mismo patrón que el callejero municipal, en otra fuente

**Categoría:** datos
**Síntoma:** `stops.txt` trae `"Miguel ángel Blanco N.º 53"` — `á` minúscula donde toca `Á`. Y
`"León Moyano / Alhama De Aragón"`, con `De` capitalizado en mitad del topónimo. El fichero es
UTF-8 impecable y el resto de acentuadas salen bien (`Agustín`, `Príncipe`, `Vía`, `Andrés`).
Es el **mismo patrón** que `ANDADOR ABOGACíA TURNO DE OFICIO` del callejero del Ayuntamiento,
documentado en la entrada anterior de esta bitácora — pero en una fuente distinta (Avanza vía
NAP) y con distinto sistema de origen. Dos proveedores independientes, el mismo tipo de estropicio.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la comprobación de codificación,
otra vez, y por la misma razón: no hay ni un carácter roto que mirar. Y aquí se suma una segunda
prueba en verde: 003 **ya resolvió esto** y su solución tapa el síntoma. `nombres.json` sirve
`"8": "Miguel Ángel Blanco n.º 53"`, con la `Á` correcta, así que en la app de ZetaBus el nombre
se ve bien. El dato de origen sigue roto; lo que hay es una capa encima.
**Causa raíz:** el sistema del operador escribe los rótulos con una capitalización propia que no
respeta mayúsculas acentuadas. El feed lo publica tal cual y el NAP lo distribuye fiel.
**Cómo se cazó:** ojo humano — la muestra de encoding que pedía el método (enseñar un nombre real
con tilde o eñe) devolvió cinco filas, y la cuarta traía el fallo a la vista.
**Arreglo aplicado:** ninguno aquí (solo lectura). Lo relevante es la medida que ya existe en 003
y que cuantifica el tamaño del problema: `gtfs.json` guarda
`nombresControl: {comparables: 918, distintos: 725}`. **725 de 918 nombres (79 %) difieren** entre
lo que dice el GTFS y lo que dice el operador en su web. No es un caso aislado como en el
callejero: aquí son cuatro de cada cinco.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** cuando el mismo defecto aparece en dos fuentes oficiales
independientes, deja de ser una anécdota de un proveedor y pasa a ser una **propiedad esperable
del dato público español de callejero**. Se planifica una capa de presentación de nombres desde
el principio, en vez de descubrirla fuente por fuente. Y ojo con el efecto secundario: una capa
que corrige nombres arriba hace que el dato roto de abajo deje de verse — y lo que no se ve, no
se mide.
**Traza:** `zaragoza-gtfs.zip` → `stops.txt`; `src/generated/nombres.json`;
`src/generated/gtfs.json` (`nombresControl`)

## [2026-08-02] — `shapes.txt` trae el trazado pero no la distancia: `shape_dist_traveled` está vacío en los 27.603 puntos

**Categoría:** carencia
**Síntoma:** `shapes.txt` declara la columna `shape_dist_traveled` en su cabecera y la deja vacía
en **27.603 de 27.603 filas** (0 con valor). Lo mismo en `stop_times.txt`, que también la declara.
La geometría está; la distancia acumulada a lo largo de ella, no.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la validación de estructura. El
fichero es un GTFS válido —`shape_dist_traveled` es opcional en la especificación—, así que
cualquier validador pasa y cualquier `head` de las primeras filas enseña una columna que *parece*
estar ahí porque el nombre aparece en la cabecera. La cabecera promete una columna que el cuerpo
no rellena.
**Causa raíz:** el publicador no calcula la distancia acumulada; es opcional y se la ahorra.
**Cómo se cazó:** casualidad — se contaba el número de puntos por `shape_id` y el recuento de
campos no vacíos salió cero, lo que al principio pareció un error del `awk`. No lo era.
**Arreglo aplicado:** ninguno (solo lectura). Anotado como coste conocido: si 004 quiere el coste
en metros de un tramo de bus o tranvía, lo calcula él a partir de las coordenadas del shape. Es
trabajo acotado y sin incógnitas, pero es trabajo, y conviene que no aparezca como sorpresa a
mitad de construir el motor.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** en un formato con campos opcionales, que una columna exista en la
cabecera no dice nada sobre si tiene datos. Se cuentan los valores no vacíos antes de planificar
sobre ella — y se cuentan sobre el fichero entero, porque las primeras filas de un CSV son la
peor muestra posible.
**Traza:** `zaragoza-gtfs.zip` → `shapes.txt`, `stop_times.txt` (columna `shape_dist_traveled`)

<!-- ─────────── TANDA 0.C · reconocimiento de fuentes en red (2026-08-02) ─────────── -->

## [2026-08-02] — Hay líneas de calle, pero los tramos no se tocan en los cruces: geometría sí, topología no

**Categoría:** datos
**Síntoma:** localizada por fin la red viaria vectorial de Zaragoza
(`idezar_base:JERARQUIA_VIARIA`, 3.453 tramos con geometría `MultiLineString`), se pidieron 5
tramos vecinos de una bbox de 250 m en el casco. **Ninguno comparte vértice con ningún otro: cero
coincidencias exactas de extremos.** Y no es que sean tramos inconexos: sus propios atributos
dicen que conectan. `CALLE PREDICADORES` tiene `TRAMO: "DE POSTIGO DEL EBRO A PLAZA SANTO
DOMINGO"` y empieza en `[-0.88657304, 41.6575993]`, mientras `CALLE POSTIGO DEL EBRO` **acaba** en
`[-0.88653275, 41.6576338]`. Medido: **5,08 m de separación**. Otros pares del mismo cruce:
13,87 m y 18,37 m.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ todo lo que se había comprobado
hasta ese momento, que era mucho y era verdad: `DescribeFeatureType` declara
`gml:MultiCurvePropertyType` (geometría de línea ✓), `GetFeature` devuelve `MultiLineString` con
34 puntos en el primer tramo ✓, el CRS se reproyecta bien a WGS84 ✓, los atributos son de lujo
(`DOBLE_SENT`, `LIMITE_VEL`, `PLATAFORMA`, `LONGITUD` ya calculada) ✓ y `numberMatched: 3453`
cuadra con una ciudad ✓. **Siete comprobaciones en verde y ninguna mira si las líneas se tocan.**
Pintadas en un mapa se ven como el callejero perfecto de Zaragoza: a la escala a la que se dibuja,
5 metros son menos de un píxel.
**Causa raíz:** es cartografía de representación, no un grafo topológico. Cada tramo se digitalizó
como entidad independiente para pintarse y para colgar de él sus atributos de movilidad; nadie
necesitaba que el vértice final de uno fuera **el mismo objeto** que el inicial del siguiente,
porque el uso previsto era verlo, no recorrerlo. La topología nunca se construyó porque nunca hizo
falta.
**Cómo se cazó:** test, y solo porque la costura del encargo lo exigía explícitamente —*"¿los
tramos se TOCAN en los cruces? Un montón de líneas sueltas NO es un grafo y desde fuera se ve
igual de bonito"*—. Sin esa pregunta escrita de antemano, el hallazgo del día habría sido
"desbloqueado" y el problema habría aparecido semanas después, con el motor a medio construir y
devolviendo "no hay ruta" entre dos calles que se cruzan.
**Arreglo aplicado:** ninguno todavía (esta tanda inventaría). Lo que queda establecido es que
entre el dato y el grafo hay un paso obligatorio de **noding**: unificar extremos por proximidad
con una tolerancia del orden de 5-10 m, y verificar después que la red resultante es conexa. Es
trabajo conocido y acotado, pero es trabajo, y no estaba en la cuenta de nadie hace una hora.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** **geometría no es topología.** Que un dato tenga `LineString` responde a
"¿hay aristas dibujadas?", no a "¿hay un grafo?". Son dos preguntas y la segunda no se contesta
mirando el tipo de geometría, ni el número de features, ni los atributos: se contesta comprobando
si los extremos coinciden. Para cualquier dato que vaya a alimentar un motor de rutas, la prueba
de aceptación no es "¿se pinta bien?" sino "¿comparten vértice dos tramos que se cruzan?".
**Traza:** `data/exploracion/2026-08-02_idezar-geoserver_getfeature-JERARQUIA-bbox-centro.json`
(features 1553, 2053, 2191, 2192, 2306)

## [2026-08-02] — La capa INSPIRE de red viaria revienta con un error de PostgreSQL en cuanto se le pide una bbox

**Categoría:** rompe
**Síntoma:** `tn-ro:RoadLink` ("Red viaria tramos INSPIRE TN-RO", 3.644 tramos) responde
perfectamente a `GetFeature` con `count=3` — geometría `LineString`, `inspireId`, nombres de
tramo, `validFrom`—. Pero al añadirle un filtro espacial `bbox` devuelve **HTTP 400** con un
`<ows:ExceptionReport>` que contiene el error crudo del motor de base de datos:
`org.postgresql.util.PSQLException: ERROR: invalid input syntax for type integer: "2_3_1_2_3"`.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la petición sin filtro. `count=3`
sobre la misma capa devuelve 200 con tres features impecables y `numberMatched: 3644`. Con esa
prueba en la mano, `RoadLink` parecía la mejor candidata de las tres: geometría más rica que
`JERARQUIA_VIARIA` (8 puntos frente a 2 en el primer tramo de cada una), identificadores INSPIRE
estables y fecha de validez. Una capa puede estar sana para leerla entera y rota para consultarla.
**Causa raíz:** no verificable desde fuera. Los síntomas apuntan a que la vista SQL que sirve la
capa expone como identificador un valor compuesto (`"2_3_1_2_3"`) que el filtro espacial intenta
convertir a `integer` para resolver el `featureId`. Es una conjetura razonada, no un dato: **no
tengo acceso al servidor**. Lo que sí es un hecho es que el error viene del servidor y no de la
petición — ver más abajo.
**Cómo se cazó:** test **con control**. El primer 400 podía ser mi sintaxis de `bbox` (el orden de
ejes con `urn:ogc:def:crs` es una fuente clásica de errores). Así que se lanzó **exactamente la
misma bbox, con la misma sintaxis, contra `idezar_base:JERARQUIA_VIARIA`**: HTTP 200 y cinco
features correctas. Control positivo → la sintaxis es válida → el fallo es de la capa. Sin ese
control habría anotado "no sé pedir bboxes" y habría descartado la pista buena.
**Arreglo aplicado:** ninguno (es un servidor ajeno y esta tanda no reporta incidencias a
terceros). Consecuencia práctica: **`RoadLink` no sirve para trabajo por zonas** — ni descarga
troceada por barrios, ni consultas espaciales. O se pide entera o no se pide.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** cuando una petición falla, antes de creerte el diagnóstico que sugiere
el mensaje de error, repite la petición cambiando **una sola variable** —aquí, la capa— para
saber si el fallo es tuyo o suyo. Y un servicio que funciona sin filtro puede estar roto con
filtro: "la capa responde" no es lo mismo que "la capa se puede consultar". Se prueba el modo de
acceso que vas a usar de verdad, no el más fácil.
**Traza:** `data/exploracion/2026-08-02_idezar-geoserver_getfeature-RoadLink-bbox-centro.json`
(el ExceptionReport), y `…JERARQUIA-bbox-centro.json` (el control en verde)

## [2026-08-02] — El mismo GeoJSON, la misma calle, dos coordenadas distintas: el servidor sirve metros por defecto

**Categoría:** datos
**Síntoma:** `urbanismo:Vias` pedida en `application/json` **sin** `srsName` devuelve la vía
`Vias.8704` ("CAMINO ABEJAR") empezando en `[668516.28662123, 4617030.03515345]`. La **misma
feature**, pedida con `srsName=EPSG:4326`, empieza en `[-0.97514752, 41.68721697]`. Los dos
ficheros dicen `"type": "FeatureCollection"`, los dos tienen extensión `.json`, los dos son
GeoJSON válido. Uno está en metros (UTM 30N) y el otro en grados.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el formato. GeoJSON tiene fama de
ser siempre WGS84 —la RFC 7946 lo fija así— y por eso casi ningún consumidor mira el CRS. Un
parseo con `json.load` funciona igual de bien con los dos, cualquier validador de GeoJSON los
aprueba, y ninguno de los dos avisa de nada. Peor todavía: el `GetCapabilities` de estas capas
declara `DefaultCRS: urn:ogc:def:crs:EPSG::25830` y **cero `OtherCRS`**, o sea que el servidor
*no dice* soportar 4326 — pero lo reproyecta sin rechistar si se lo pides. Fiarse de lo declarado
lleva a no pedirlo nunca.
**Causa raíz:** el CRS nativo de la cartografía municipal es EPSG:25830, que es lo correcto para
Zaragoza. GeoServer sirve en el CRS nativo salvo que se le pida otro, y lo hace constar
honestamente en el bloque `crs` del GeoJSON. La trampa no está en el servidor: está en que ese
bloque `crs` fue **deprecado** en la especificación GeoJSON y la mayoría de librerías lo ignora
en silencio.
**Cómo se cazó:** test — el encargo obligaba a pedir las cosas dos veces, con y sin `srsName`, y a
comparar la misma entidad en las dos respuestas. La comparación fue de una feature concreta
(`Vias.8704`), no del fichero en bloque.
**Arreglo aplicado:** ninguno (reconocimiento). Queda fijado como regla de descarga para 004:
**`srsName=EPSG:4326` explícito en toda petición**, y una comprobación de rango sobre el resultado
(latitud entre 41 y 42, longitud entre -2 y 0) antes de dar por bueno ningún fichero. Mezclar
estas coordenadas con los 46.150 portales o con el GTFS no daría error: daría distancias absurdas
con cara de dato bueno.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** la extensión del fichero y el nombre del formato no determinan el
sistema de coordenadas; solo lo determinan **los valores**. Y en un servicio OGC, el CRS por
defecto es el del servidor, no el que te conviene. Se pide explícito siempre, y se valida el rango
del resultado — porque una coordenada en el sistema equivocado es el único error de datos que ni
revienta, ni avisa, ni se ve hasta que alguien mide una distancia.
**Traza:** `data/exploracion/2026-08-02_idezar-geoserver_getfeature-Vias-count3-SINsrs.json` vs
`…-EPSG4326.json` (feature `Vias.8704` en ambos)

## [2026-08-02] — Estuve a punto de anotar un fallo de codificación del servidor que lo era de mi terminal

**Categoría:** aviso falso
**Síntoma:** al listar las 178 capas del `GetCapabilities`, los títulos salían rotos:
`V�as`, `L�mite municipal`, `Clavos topogr�ficos`, `MU2_se�alizacion_horizontal`. Con dos
reconocimientos previos donde el encoding ya había dado problemas reales, la conclusión inmediata
—y equivocada— era que el servidor del Ayuntamiento estaba sirviendo latin-1 declarando UTF-8.
Iba camino de la bitácora como hallazgo del servidor.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el propio síntoma, que es
justamente el problema: los caracteres rotos **se ven**, y verlos parece prueba suficiente. La
cabecera del XML dice `encoding="UTF-8"` y en pantalla había `V�as`: contradicción aparente,
diagnóstico servido. Nadie pide una segunda opinión cuando el error es visible.
**Causa raíz:** la consola de Windows de esta sesión trabaja en **cp1252**, no en UTF-8 — quedó
demostrado poco después, cuando un `print` de Python con caracteres de caja murió con
`UnicodeEncodeError: 'charmap' codec can't encode characters`. El fichero del servidor está
perfecto: `iconv -f UTF-8 -t UTF-8` lo valida sin una sola queja, `bytes.decode('utf-8')` no
falla, hay **7 secuencias UTF-8 correctas** de `ñ` (`0xC3 0xB1`) y **cero** bytes `0xF1` o `0xED`
sueltos, que es lo que habría si de verdad fuera latin-1.
**Cómo se cazó:** test — antes de escribir la entrada se comprobó el fichero **en bytes** en vez
de en pantalla. Tres instrumentos independientes (iconv, decode de Python, recuento de bytes) y
los tres exculpan al servidor.
**Arreglo aplicado:** `PYTHONIOENCODING=utf-8` en las inspecciones posteriores. Y la entrada de
bitácora se reescribió: de "el servidor sirve mal" a "mi visor lee mal".
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** ⭐ el reverso exacto del caso `ABOGACíA` de la tanda 0.A. Allí la
codificación era correcta y el dato estaba mal; aquí el dato es correcto y **el instrumento de
lectura lo rompía**. Antes de acusar a una fuente de un problema de codificación hay que verificar
los **bytes del fichero**, no los glifos de la pantalla: la terminal es un intérprete más de la
cadena, y es el único que no deja rastro en el disco. Un fallo visible no es un fallo verificado.
**Traza:** `data/exploracion/2026-08-02_idezar-geoserver_wfs-getcapabilities.xml`

## [2026-08-02] — El campo "oficial" del estado de las estaciones BiZi dice "no operativa" en el 100 % de la muestra

**Categoría:** datos
**Síntoma:** el GeoJSON de estaciones BiZi de la sede electrónica trae **tres campos que hablan del
mismo hecho** y uno contradice a los otros dos. En las 5 estaciones de la muestra, sin excepción:

```
estado           = "IN_SERVICE"
estadoEstacion   = ".../tipo-estado-estacion/no-operativa"
description      = "<li>Estado: Operativa</li>..."
```

Y son estaciones vivas: la primera declara 3 bicis disponibles y 16 anclajes libres. Una estación
realmente no operativa no reporta ocupación.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el criterio de calidad que uno
aplicaría para elegir entre los tres campos. `estadoEstacion` es el que *parece* bueno: es el
único que apunta a un **vocabulario controlado publicado**
(`vocab.linkeddata.es/datosabiertos/kos/transporte/bicicleta-publica/…`), o sea el campo
normalizado, interoperable y "hecho como Dios manda" frente a un `estado` en inglés suelto y una
`description` que es HTML para pintar en un globo de mapa. Cualquier criterio razonable —usa el
campo normalizado, no el texto de presentación— elige justo el que está roto, y el resultado es
filtrar las **276 estaciones como no operativas** sin que nada falle.
**Causa raíz:** no verificable desde fuera; el síntoma es el de un mapeo al vocabulario que quedó
fijado a un valor constante y nunca se conectó al estado real. Es una conjetura razonada, no un
dato: solo tengo la respuesta pública.
**Cómo se cazó:** ojo humano — los tres campos entraron en la misma pantalla al volcar el esquema
completo de un registro, y `IN_SERVICE` junto a `no-operativa` chirría a la vista. Después se
comprobó en las 5 de la muestra: 5 de 5.
**Arreglo aplicado:** ninguno (esta tanda inventaría). Queda anotado que **el campo utilizable es
`estado`**, no `estadoEstacion` — y que de todas formas los tres son datos VIVOS, fuera de la v1.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** cuando una fuente ofrece varios campos para el mismo hecho, **compáralos
entre sí antes de elegir uno**: la contradicción es gratis de detectar el día que miras el
registro completo, y carísima de detectar el día que ya construiste sobre el campo equivocado. Y
el aspecto de rigor de un campo —vocabulario controlado, URI, estándar— dice cómo se diseñó, no si
se rellenó bien.
**Traza:** `data/exploracion/2026-08-02_zaragoza-api_bizi-SINsrs.geojson` (5 features)

## [2026-08-02] — La marca de tiempo de BiZi lleva sufijo `Z` con la hora local: dos horas de error

**Categoría:** datos
**Síntoma:** el mismo GeoJSON de BiZi trae `"lastUpdated": "2026-08-02T11:30:07Z"`. La `Z` es UTC.
Pero la cabecera HTTP de la misma respuesta dice `Last-Modified: Sun, 02 Aug 2026 11:30:07 CEST`
—**la misma hora, etiquetada CEST**— y el reloj del servidor, en la cabecera `Date`, marcaba
`09:30:21 GMT`. En agosto CEST es UTC+2, así que el dato se actualizó a las 09:30:07 UTC, catorce
segundos antes de mi petición. El campo debería decir `09:30:07Z` (o `11:30:07+02:00`) y dice
`11:30:07Z`: **dos horas en el futuro.**
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la propia marca de tiempo, que es
el instrumento con el que uno comprueba la frescura de un dato. Está bien formada, es ISO 8601
válido, se parsea sin error en cualquier librería, y su valor es reciente y creíble. Un chequeo de
tipo "¿el dato tiene menos de X minutos?" pasa en verde — y de hecho pasa *demasiado* en verde:
con dos horas de adelanto, un dato caducado seguiría pareciendo fresco durante dos horas más.
**Causa raíz:** se formatea la hora local del servidor y se le concatena la `Z` en lugar de
convertir a UTC o de emitir el desfase real. Es el error clásico de tratar `Z` como decoración de
formato ISO en vez de como declaración de zona horaria.
**Cómo se cazó:** casualidad — se habían guardado las cabeceras HTTP en fichero aparte para
responder a la pregunta de las cachés (`ETag`/`Last-Modified`), y al ponerlas al lado del JSON
saltó que la misma hora aparecía con dos zonas distintas.
**Arreglo aplicado:** ninguno (fuente ajena, y son datos vivos que la v1 no usa). Anotado por si
alguna vez se usa `lastUpdated` para decidir frescura: **no es fiable como UTC**; la cabecera
`Last-Modified` sí lleva zona correcta.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** una fecha bien formada no es una fecha correcta. `Z` no significa "hora
en formato ISO", significa "esta hora es UTC", y es una afirmación que se puede contrastar contra
la cabecera `Date` de la propia respuesta — que viene gratis en cada petición y nadie mira.
Guardar las cabeceras junto al cuerpo cuesta un `-D` y es lo que permitió verlo.
**Traza:** `data/exploracion/2026-08-02_zaragoza-api_bizi-SINsrs.geojson` (`lastUpdated`) y
`…-SINsrs.headers.txt` (`Date`, `Last-Modified`)

<!-- ─────────── TANDA 1 · el andamiaje (2026-08-02) ─────────── -->

## [2026-08-02] — Las reglas de claves privadas del `.gitignore` no protegían nada: el comentario formaba parte del patrón

**Categoría:** seguridad
**Síntoma:** el primer `.gitignore` de 004 se escribió con el motivo de cada exclusión al lado,
al modo de 003. Tres de esas reglas **no funcionaban**, y dos eran de credenciales:

```
*.pem                  # claves privadas
*.key                  # idem — y ojo, hay ficheros legitimos con esta extension
!.env.example          # la PLANTILLA si entra: documenta que variables hacen falta

git check-ignore servidor.pem  ->  NO IGNORADO
git check-ignore clave.key     ->  NO IGNORADO
git check-ignore .env.example  ->  IGNORADO  (por .env.*, la excepcion no llegaba a aplicarse)
```

**Git no admite comentarios al final de una regla.** El patrón real era la línea entera —
`*.pem                  # claves privadas` — que busca un fichero con ese nombre literal, espacios
y almohadilla incluidos. Un `.pem` en la carpeta habría entrado en el primer `git add`.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el fichero **leído**. Un
`.gitignore` comentado línea a línea es justo lo que uno enseña como prueba de rigor: se lee de
arriba abajo, cada exclusión tiene su porqué, y la sección de credenciales es la primera. Leído,
es impecable. Y las reglas vecinas **sí funcionan** (`.env`, `.env.*`, `id_rsa`, `*.p12`,
`credentials.json`), con lo que cualquier prueba de bulto sobre el bloque da verde: 4 de 6 aciertos
y las dos que fallan son las que menos se prueban, porque hoy no hay ningún `.pem` en el proyecto.
**Causa raíz:** transferir una costumbre de otro formato. En shell, en Python o en YAML el
comentario al final de la línea es normal y correcto; en `.gitignore` no existe esa sintaxis —
solo se admite `#` **al principio** de la línea. Es una regla que no avisa: no hay error, no hay
warning, el fichero se parsea perfectamente y el patrón simplemente no casa con nada.
**Cómo se cazó:** test — la contraprueba obligatoria del encargo (`git check-ignore -v` sobre cada
regla importante **y** sobre las excepciones). Saltó primero `.env.example`, que aparecía ignorado
cuando el comentario decía que debía entrar; al buscar por qué, cayeron los otros dos.
**Arreglo aplicado:** todos los comentarios movidos a su propia línea, y una advertencia escrita
dentro del propio `.gitignore` explicando por qué. Re-verificado: `servidor.pem`, `clave.key`,
`id_rsa`, `.env`, `.env.local` y `secretos.p12` ignorados; `.env.example` entra. Cero patrones con
`#` en línea.
**Commit:** (este commit)
**Ley que sale de aquí:** ⭐ un fichero de configuración **se prueba, no se lee**. `.gitignore`,
`.gitattributes`, `.dockerignore` y compañía comparten una propiedad venenosa: **un patrón mal
escrito no falla, simplemente no coincide con nada**, y el resultado —"no está ignorado"— es
indistinguible de "no hay nada que ignorar". Toda regla que exista para proteger algo necesita una
prueba que demuestre que protege: se inventa un fichero que debería excluir y se comprueba que lo
excluye. Y la sintaxis de comentarios no se hereda entre formatos por parecido.
**Traza:** `.gitignore` (bloque 1, credenciales)

## [2026-08-02] — La primera prueba del guardián dio verde sin haber probado nada

**Categoría:** aviso falso
**Síntoma:** recién escrito el hook `commit-msg`, se lanzó su contraprueba: un asunto
`fix(grafo): corrige el cálculo de nodos` **sin** entrada en la bitácora, que el guardián debía
rechazar. Devolvió **exit 0** y no añadió nada. El guardián no guardaba.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la propia contraprueba — que es el
instrumento que existe **precisamente** para que esto no pase. Y el verde era legítimo: el hook
comprueba que el diff en stage de `docs/BITACORA.md` añada una cabecera `## [`, y en ese momento
la bitácora estaba **entera en el índice** como fichero nuevo del primer commit. Un fichero nuevo
aparece en el diff con **todas** sus líneas marcadas como añadidas — incluidas sus veintitantas
cabeceras de entrada. La condición se cumplía de sobra. El hook funcionaba; **la prueba estaba
contaminada por el estado del índice**.
**Causa raíz:** montar la prueba dentro del mismo estado que se estaba preparando para commitear,
en lugar de aislarla. Es el error clásico de probar sobre el entorno de trabajo: el resultado
depende de una variable que no se declaró y que además iba a cambiar en cuanto se hiciera el
primer commit — con lo que el falso verde ni siquiera era estable.
**Cómo se cazó:** ojo humano, leyendo el **código de salida** en vez del hecho de que "no dio
error". La diferencia entre `exit 0` y `exit 1` era el único sitio donde se veía: no hubo mensaje,
no hubo excepción, no hubo nada que llamara la atención salvo un `0` donde tenía que haber un `1`.
**Arreglo aplicado:** ninguno en el hook, que estaba bien. Se rehízo la prueba **aislada**:
`git reset` para vaciar el índice, y entonces sí — exit 1, mensaje de rechazo y esqueleto
autogenerado de 11 líneas. Después, la batería completa: el verde (con entrada en stage, exit 0 y
sin duplicar el esqueleto), el neutro (`docs:` y `chore:` pasan sin tocar la bitácora) y las
cuatro variantes de `fix` (`fix:`, `fix(ámbito):`, `fix!:`, `fix(ámbito)!:`), las cuatro
bloqueando. Bitácora restaurada desde copia, sha256 verificado idéntico.
**Commit:** (este commit)
**Ley que sale de aquí:** ⭐ **una prueba que comparte estado con lo que está probando no prueba
nada.** El guardián hay que verlo fallar **en las condiciones en las que va a trabajar de verdad**
—con un repositorio ya en marcha y la bitácora fuera del stage—, no en el estado accidental del
momento en que se escribió. Y "no dio error" no es "pasó la prueba": el código de salida se lee,
porque en un guardián el silencio y el permiso son exactamente el mismo output.
**Traza:** `.githooks/commit-msg` (función `anade_entrada`)

<!-- ─────────── TANDA 0.D · barrido exhaustivo de fuentes (2026-08-02) ─────────── -->

## [2026-08-02] — Un guion en un regex escondió dos capas, y una de ellas era candidata a red viaria

**Categoría:** silencio falso
**Síntoma:** el reparto por workspace de la tanda 0.C sumaba **176** capas cuando el total
declarado y verificado era **178**. Las dos que faltaban son **`tn-ro:RoadLink`** y
**`tn-ro:Road`** — y la segunda, *"Vías INSPIRE TN-RO"*, **no aparece en ningún punto del informe
0.C**: nadie supo que existía.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el total. En la 0.C se contaron las
capas con `grep -o "</FeatureType>" | wc -l` → **178**, correcto y verificado. Y por separado se
listaron los workspaces con `grep -o "<Name>[a-zA-Z0-9_]*:"` → una tabla de aspecto impecable con
15 workspaces. **Los dos números se publicaron en el mismo informe y nadie los sumó.** El total era
bueno, el desglose estaba incompleto, y la comprobación que lo habría cazado —¿suman las partes el
total?— es de una línea y no se hizo.
**Causa raíz:** la clase de caracteres `[a-zA-Z0-9_]` no incluye el guion. `tn-ro:` tiene uno, así
que el patrón dejaba de casar en `tn` y descartaba la capa **en silencio**. Reproducido hoy: el
regex viejo da 176, el mismo con `[A-Za-z0-9_\-]` da 178. **Diferencia exacta: 2.**
**Cómo se cazó:** test — la tanda obligaba a contrastar el reparto nuevo con el de la 0.C y a
tratar la discrepancia como hallazgo. Al reparsear con un parser XML de verdad
(`ElementTree`) salieron 16 workspaces en vez de 15.
**Arreglo aplicado:** ninguno que aplicar (es análisis, no código). `tn-ro:Road` entra en el
inventario de esta tanda: resultó ser la entidad lógica INSPIRE, **3.318 features sin geometría**,
así que no cambia el veredicto — pero eso se sabe **ahora**, no entonces.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** cuando un inventario se presenta a la vez como **total** y como
**desglose**, hay que sumar el desglose y comprobar que da el total. Es la contraprueba más barata
que existe y detecta justo el fallo más peligroso de un barrido: no el dato equivocado, sino el
que **nunca llegó a la lista**. Y en clases de caracteres, `[a-zA-Z0-9_]` es una lista blanca que
excluye en silencio todo lo demás — guiones, puntos, acentos.
**Traza:** `data/exploracion/2026-08-02_idezar-geoserver_wfs-getcapabilities.xml`;
`docs/RECONOCIMIENTO-RED-ZARAGOZA.md` §A1 (tabla de workspaces)

## [2026-08-02] — Una capa publicada que no se puede consultar porque su nombre lleva una eñe

**Categoría:** rompe
**Síntoma:** `movilidad:MU2_señalizacion_horizontal` aparece en el `GetCapabilities` como una capa
más de las 178. Cualquier petición sobre ella falla:

```
DescribeFeatureType&typeNames=movilidad:MU2_señalizacion_horizontal   (UTF-8, %C3%B1)  -> HTTP 400
DescribeFeatureType&typeNames=movilidad:MU2_se%F1alizacion_horizontal (latin-1, %F1)   -> HTTP 400
  <ows:Exception exceptionCode="InvalidParameterValue" locator="DescribeFeatureType">
  Could not find type: {https://zaragoza.es/movilidad/}MU2_se?alizacion_horizontal
```

El servidor **anuncia** la capa y luego **no encuentra su propio tipo**. Lo mismo le pasa a
`MU2_señalizacion_vertical`, que no llegué a probar por presupuesto.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el `GetCapabilities`, que es el
instrumento con el que se decide qué existe. Ahí la capa está, con su nombre, su título y sus
palabras clave, indistinguible de las 177 restantes. Un inventario construido **solo** a partir
del catálogo la cuenta como disponible — y de hecho la clasifiqué como candidata prioritaria antes
de tocarla.
**Causa raíz:** no verificable desde fuera. El síntoma —el mensaje de error devuelve la `ñ` ya
corrompida— apunta a una pérdida de codificación entre la capa HTTP y la resolución del nombre de
tipo en GeoServer, sea cual sea la codificación con la que se pida. Es una conjetura razonada, no
un dato.
**Cómo se cazó:** test. El primer 400 podía ser mi codificación de la URL, así que se repitió una
vez con la otra codificación plausible (latin-1). Dos intentos, dos fallos → se registra y se
pasa, según la regla de la tanda.
**Arreglo aplicado:** ninguno (servidor ajeno). Queda como **`NO CONSTA` con motivo**, y duele
más de lo normal: la señalización horizontal es la pintura del suelo, o sea **donde vivirían los
pasos de cebra** — justo el dato que esta tanda salió a buscar. No puedo afirmar que la capa
contenga pasos de peatones ni que no los contenga. Es inaccesible.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** **estar en el catálogo no es estar disponible.** Un inventario de
fuentes que se construye leyendo un `GetCapabilities` mide lo que el servidor *dice* publicar, no
lo que sirve; toda capa que vaya a contar como fuente necesita al menos una petición real que la
toque. Y los nombres con caracteres no-ASCII son un punto de fallo concreto y frecuente en la
cadena HTTP→servidor: cuando aparezcan, se prueban antes de darlos por buenos.
**Traza:** `data/exploracion/2026-08-02_wfs_describe_movilidad-MU2_sealizacion_horizontal.xml` y
`…_MU2_senalizacion_horizontal_latin1.xml`

## [2026-08-02] — Mojibake de verdad esta vez: la capa de carreteras del Ayuntamiento sirve "Gran VÃ­a"

**Categoría:** datos
**Síntoma:** `idezar_base:Carreteras_cartoOSM_2019_Interiores` devuelve `"NAME": "Gran VÃ­a"`
donde debería decir "Gran Vía". Verificado **en los bytes del fichero**, no en la pantalla:

```
bytes crudos : b'Gran V\xc3\x83\xc2\xad'
                        C3 83 C2 AD  = doble codificacion de  C3 AD  ("í")
re-interpretado latin-1 -> utf-8 : 'Gran Vía'   <- el texto original aparece intacto
```

El fichero **es UTF-8 válido** (`iconv` lo aprueba). Lo que está mal es el contenido: el texto se
codificó a UTF-8 dos veces.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la validación de codificación, otra
vez, y otra vez por el mismo motivo: **un texto doblemente codificado es UTF-8 perfectamente
válido**. No hay bytes ilegales, `iconv` no protesta, `json.load` no falla, ningún validador se
queja. Y —la parte fina— la ley que sacamos hace dos horas de la tanda 0.C ("si ves caracteres
raros, sospecha de tu terminal") empuja justo a **descartar** este hallazgo como falso positivo.
Aplicada mecánicamente, esa ley habría enterrado un fallo real.
**Causa raíz:** la capa es cartografía **derivada de OpenStreetMap** (lo delata su campo `OSM_ID`
y su propio nombre, `cartoOSM_2019`). En algún paso de la importación de 2019 se leyó texto UTF-8
declarándolo latin-1 y se volvió a codificar. Es el error clásico de doble codificación en una
cadena ETL.
**Cómo se cazó:** ojo humano sobre una muestra de 5 features, y **confirmado con un control en la
misma respuesta**: `movilidad:MU1_jerarquia_viaria`, pedida al mismo servidor en la misma tanda,
devuelve `"direccion": "AAIÚN, EL"` con bytes `C3 9A` — la `Ú` correcta. Mismo servidor, misma
sesión, misma terminal: **una capa sale bien y la otra mal**. Eso descarta el terminal y descarta
el servidor, y deja el defecto donde está: en esa capa.
**Arreglo aplicado:** ninguno (solo lectura). Anotado como coste de usar esa capa: sus nombres de
calle necesitan una pasada de reparación (`s.encode('latin-1').decode('utf-8')`), y esa reparación
**no es idempotente ni segura a ciegas** — aplicada a un texto correcto, lo rompe.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** ⭐ la ley de la 0.C ("el encoding se diagnostica en el fichero, no en la
pantalla") **no dice "ignora los caracteres raros"**: dice *comprueba los bytes*. Y la forma de
distinguir un fallo del visor de un fallo del dato es el **control simultáneo**: pedir en la misma
sesión otra fuente que traiga acentos y ver si esa sale bien. Si una sale bien y otra mal, el
problema no está en el canal — está en el dato. Sin ese control, las dos hipótesis son
indistinguibles.
**Traza:** `data/exploracion/2026-08-02_wfs_feat5_idezar_base-Carreteras_cartoOSM_2019_Interiores.json`
(control: `…_movilidad-MU1_jerarquia_viaria.json`)

## [2026-08-02] — La 0.C planteó una disyuntiva que no existía: había una tercera capa con las dos mitades

**Categoría:** carencia
**Síntoma:** el informe de la tanda 0.C cerraba diciendo que ninguna capa de viario servía sola —
`urbanismo:Vias` tiene el `codigo` que engancha con los 46.150 portales pero es la **vía entera**;
`idezar_base:JERARQUIA_VIARIA` es de **tramos** y tiene sentido, velocidad y longitud, pero **no
tiene código de vía**— y sugería combinarlas. **Existe una tercera capa que tiene las dos cosas:**
`movilidad:MU1_jerarquia_viaria`, con `geom` MultiLineString, **3.644 tramos**, y entre sus 22
atributos **`codigo`**, `tipo_via`, `tramo`, `doble_sent`, `limite_vel`, `plataforma` y
`calle_2024`.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el propio método de la 0.C, que fue
correcto: se hizo un barrido por contenido sobre las 178 capas buscando `eje|tramo|viari|vial|…`
y **`movilidad:MU1_jerarquia_viaria` SÍ apareció en los resultados**. Está impresa en el informe,
en la tabla A2. Lo que falló no fue la búsqueda: fue que, teniendo dos capas ya verificadas y
suficientes para dar veredicto, no se abrió la tercera. El barrido encontró la respuesta y el
análisis se detuvo antes de leerla.
**Causa raíz:** presupuesto de peticiones gastado en profundizar en las candidatas ya elegidas en
vez de en descartar las restantes. Y un sesgo de nombre: `MU1_jerarquia_viaria` parecía un
duplicado obvio de `idezar_base:JERARQUIA_VIARIA` —mismo nombre en otro workspace— así que se
asumió que era la misma capa. **No lo es:** 3.644 features frente a 3.453, y 22 atributos frente
a 19.
**Cómo se cazó:** la tanda 0.D obligaba a abrir **las 43 capas de `movilidad` una a una**, que
era el hueco nº2 declarado por la propia 0.C.
**Arreglo aplicado:** ninguno (inventario). El efecto es que la recomendación de fuentes cambia:
no hace falta cruzar dos capas por nombre de calle para tener tramos con identificador de vía.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** dos capas con el mismo nombre en workspaces distintos **no son la misma
capa** hasta que se cuentan sus features. Y cuando un barrido produce una lista de candidatas, el
trabajo no termina al encontrar una que funciona: termina al descartar las demás, porque la
conclusión que se publica ("hay que combinar A y B") tiene el mismo peso que el hallazgo, y una
candidata sin abrir puede invalidarla entera.
**Traza:** `data/exploracion/2026-08-02_wfs_describe_movilidad-MU1_jerarquia_viaria.xml`,
`…_wfs_feat5_movilidad-MU1_jerarquia_viaria.json`; `docs/RECONOCIMIENTO-RED-ZARAGOZA.md` §B5

## [2026-08-02] — "Las líneas no se tocan" era mirar solo los extremos: se cruzan 87 veces

**Categoría:** aviso falso
**Síntoma:** la conclusión estrella de la tanda 0.C —*"hay geometría, no topología; un montón de
líneas que no se tocan no es una red"*— es **incompleta y da una impresión falsa del trabajo que
queda**. Medido sobre 160 tramos únicos de 11 zonas:

```
extremos que coinciden exactamente (<0,01 m) : 21 pares
pares de tramos que SE CRUZAN geometricamente : 87 pares  (106 puntos de cruce)
```

La información topológica **sí está en el dato**. No está donde se buscó.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la medición de la 0.C, que era
correcta en lo que medía: comparó los extremos de 5 tramos y encontró cero coincidencias, con
separaciones reales de 5,08 m y 13,87 m. Todo cierto. El error no está en el número: está en que
**la pregunta "¿se tocan?" se operacionalizó como "¿coinciden sus extremos?"**, y esa equivalencia
no se declaró ni se cuestionó. Dos calles que se cruzan en X no comparten extremos: se cortan por
el medio. Buscar solo en los extremos garantiza el resultado que salió.
**Causa raíz:** confundir dos operaciones distintas. *Noding por proximidad de extremos* (unir
puntas sueltas que casi se tocan) y *planarización* (partir las líneas en sus intersecciones) son
cosas diferentes, y para una red viaria la segunda es la principal. Con una muestra de 5 tramos en
250 m, además, casi ningún par podía cruzarse dentro de la ventana.
**Cómo se cazó:** test — antes de firmar el veredicto de tolerancia se comprobó lo que la
conclusión anterior daba por sabido: si las geometrías se intersecan. 87 de 160.
**Arreglo aplicado:** ninguno de código (esta tanda mide). Lo que cambia es el veredicto: el paso
que 004 tiene que construir no es "adivinar una tolerancia grande y arriesgada", sino
**planarizar** —partir en los cruces reales— y usar una tolerancia **pequeña** (≈2 m) solo para
las puntas sueltas. Es más trabajo del que decía la 0.C y menos arriesgado.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** ⭐ cuando una conclusión se apoya en una medición, hay que escribir al
lado **cómo se convirtió la pregunta en número**. "No se tocan" y "sus extremos no coinciden" son
frases distintas, y la segunda no demuestra la primera. Una medición correcta de la magnitud
equivocada es más peligrosa que no medir: llega con un número al lado y ya nadie la discute.
**Traza:** `data/exploracion/2026-08-02_wfs_zona-*_MU1jv.json` (11 zonas, 160 tramos únicos);
`docs/RECONOCIMIENTO-RED-ZARAGOZA.md` (sección "El matiz que cambia el plan")

## [2026-08-02] — Conté 33 nodos donde había 21: mi propio barrido por zonas contaba los mismos tramos varias veces

**Categoría:** datos
**Síntoma:** el primer recuento de conectividad sobre 11 zonas dio **33 pares de extremos
exactos** y un 16,7 % de extremos soldados. Al listar qué pares eran, el mismo par
—`MADRID, AUTOVÍA DE` ↔ `HISPANIDAD`— aparecía en **casco, ebro_pte1, ebro_pte2, huerva y
gállego** a la vez. Geográficamente imposible: son zonas separadas por kilómetros. Deduplicando
por `fid`, los números reales son **160 tramos únicos (no 198) y 21 pares exactos (no 33)**.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el diseño del muestreo, que era el
correcto y estaba justificado zona por zona: 11 ventanas repartidas por tipos de tejido urbano,
cada una con su motivo escrito, todas con `numberMatched` coherente y respuestas 200. Nada en las
respuestas indica solapamiento. Y el sesgo empuja **en la dirección optimista**: infla justo el
número que uno quiere ver alto (los nodos ya soldados).
**Causa raíz:** un filtro `bbox` de WFS devuelve toda feature **cuya geometría intersecte** la
ventana, no las contenidas en ella. Y esta capa mezcla tramos de 13 m con features de **19,4 km**
(`HISPANIDAD`, 114 puntos, la ronda entera como una sola entidad). Cuatro de esas vías gigantes
atraviesan 8 de mis 11 ventanas, y sus extremos —que están fuera de todas ellas— se contaban una
vez por ventana.
**Cómo se cazó:** ojo humano. Los números agregados eran plausibles y no chirriaban; lo que
chirrió fue **la lista de casos concretos**, al ver la Autovía de Madrid apareciendo en el casco
antiguo y en el Gállego.
**Arreglo aplicado:** deduplicación por `fid` antes de cualquier agregación, y recuento rehecho.
Todas las cifras de conectividad del informe salen del conjunto deduplicado.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** al muestrear por ventanas espaciales, **las ventanas no son
independientes**: una entidad grande cae en muchas y se cuenta varias veces. Antes de agregar
nada, se deduplica por identificador y se compara "suma de las partes" con "elementos únicos" —
si difieren, la diferencia es exactamente lo que se estaba contando de más. Y ante un agregado
sospechosamente favorable, imprimir los casos individuales cuesta un minuto y es lo único que lo
delata.
**Traza:** `data/exploracion/2026-08-02_wfs_zona-*_MU1jv.json` (198 features devueltas → 160
únicas; 12 tramos aparecen en más de una zona, 4 de ellos en 8)

## [2026-08-02] — La capa de viario no tiene ninguna forma de saber qué cruces son pasos elevados

**Categoría:** carencia
**Síntoma:** `movilidad:MU1_jerarquia_viaria`, la mejor candidata a soportar el grafo, tiene 22
atributos y **ninguno indica nivel, cota, altura, puente o túnel**. Entre sus 160 tramos hay 106
puntos de cruce geométrico, y no existe forma en la capa de distinguir un cruce real de un paso
elevado. Uno de los cruces detectados es `GRACIA, LUCIANO` × `MADRID, AUTOVÍA DE`, con la
intersección **en medio de ambos tramos**: exactamente la forma que tiene una autovía pasando por
encima de una calle.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el primer barrido de campos que
hice, que dijo *"capas con algún campo tipo nivel: 1 de 16"* y señaló solo la capa de Puentes —un
falso positivo, porque lo que casó fue el **nombre de la propia capa**, no un campo. Ese barrido
era defectuoso: extraía los campos con `<xsd:element name="…"` asumiendo que `name` es el primer
atributo, y en estos esquemas va después de `maxOccurs` y `minOccurs`. Se le escapaba **todo**.
Lo delató un control dirigido: `idezar_base:Carreteras_cartoOSM_2019` tiene un campo `BRIDGE` que
yo ya había visto con mis propios ojos media hora antes, y el barrido no lo encontraba.
**Causa raíz:** la cartografía municipal de jerarquía viaria describe **la función de la vía**
—capacidad, sentido, velocidad, si está pacificada— no su geometría 3D. El nivel no le hacía
falta a nadie para gestionar el tráfico.
**Cómo se cazó:** test con control positivo, tras desconfiar del primer resultado por demasiado
limpio.
**Arreglo aplicado:** ninguno (inventario). Lo que queda anotado es que **el único desambiguador
de nivel disponible en todo el catálogo municipal es el campo `BRIDGE`** de las capas
`Carreteras_cartoOSM_2019_*`, que son derivadas de OpenStreetMap y traen `OSM_ID` — o sea que
para desambiguar los cruces de su propio viario, el camino pasa por OSM.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** un barrido de campos sobre XML **no puede asumir el orden de los
atributos**; se extrae el elemento entero y se busca dentro. Y todo buscador que vaya a producir
un "no hay" se valida antes contra un caso que uno **sabe** que existe: aquí, un campo visto a
ojo en otra pantalla fue lo que reveló que el buscador estaba ciego.
**Traza:** `data/exploracion/2026-08-02_wfs_describe_movilidad-MU1_jerarquia_viaria.xml` (24
elementos, ninguno de nivel), `…_idezar_base-Carreteras_cartoOSM_2019_Interiores.xml` (`BRIDGE`)

## [2026-08-02] — Los pasos de peatones sí existen: están catalogados y son de acceso restringido

**Categoría:** carencia
**Síntoma:** tras confirmar con control positivo que **ninguna de las 178 capas del WFS** contiene
pasos de peatones, el barrido del catálogo de datos abiertos (709 conjuntos) los encuentra a la
primera — y a ellos y a otros dos que hacían falta:

```
4063  Rebajes pasos de peatones     accessRights: "Restringido. Tecnicos del Servicio de
                                     Conservacion de Infraestructuras y de las empresas
                                     Adjudicatarias..."   · SIN formato publicado
5580  Escaleras urbanas             accessRights: "No publico"
                                     WMS -> .../geoserver/infraestructuras-lan/wms  (intranet)
4065  Inventario de puentes         accessRights: "Restringido... con claves de acceso al
                                     Visor de Infraestructuras"    (intranet)
```

**No es que el Ayuntamiento no tenga red peatonal fina: es que no la publica.**
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el barrido del WFS, hecho bien y con
su control positivo: se buscó `paso.?de.?peat|cebra|crossing` sobre las 178 capas, dio **cero**, y
el control (`jerarquia`, `portales`, `vias`) confirmó que el buscador funcionaba. La conclusión
"no hay pasos de peatones" era correcta **sobre el WFS** y falsa sobre la realidad del
Ayuntamiento. Un catálogo de servicios publica lo que está publicado, no lo que existe: mide la
puerta, no la casa.
**Causa raíz:** son datos de **gestión interna** del mantenimiento del viario, con datos de
contratas y de inspección. Nunca se pensaron para publicarse, y viven en un GeoServer distinto —
`infraestructuras-lan`, con `lan` de red local— del que sirve el catálogo abierto.
**Cómo se cazó:** por la pregunta de calibración del encargo: *"si publican farolas y NO publican
pasos de peatones, eso es una conclusión fuerte"*. Al ir a comprobar si de verdad publicaban
farolas —sí: `4069-4072 Alumbrado Público`, hasta el nivel de **arquetas y soportes**— apareció al
lado el conjunto de pasos de peatones. La pregunta buscaba calibrar el catálogo y encontró el
dato.
**Arreglo aplicado:** ninguno, y **ninguno posible por esta vía**: el acceso exige credenciales de
técnico municipal. No se ha intentado acceder, ni registrarse, ni consultar el endpoint de
intranet — la costura de la tanda lo prohíbe expresamente y es decisión de Antonio si algún día se
pide por otra vía (una solicitud formal de reutilización, que la Ley 37/2007 contempla).
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** ⭐ **"no está publicado" y "no existe" son conclusiones distintas, y la
primera no autoriza la segunda.** Un inventario de fuentes tiene que mirar el catálogo *además*
del servicio, porque el catálogo lista también lo que no se sirve — y la diferencia entre las dos
listas es justo el mapa de lo que se podría pedir. De 709 conjuntos catalogados, solo ~25 % se
declara público y **115 apuntan a endpoints de intranet**.
**Traza:** `data/exploracion/2026-08-02_zaragoza-catalogo_pag*.json` (709 conjuntos);
fichas 4063, 5580 y 4065 (las tres devuelven 404 en la ruta pública `/catalogo/<id>.json`)

## [2026-08-02] — El Ayuntamiento publica cartografía derivada de OpenStreetMap bajo su propia licencia, sin nombrar a OSM

**Categoría:** seguridad
**Síntoma:** cuatro capas del WFS municipal —`idezar_base:Carreteras_cartoOSM_2019_Interiores`,
`…_Exteriores`, `…_Principales` y `Ferrocarriles_cartoOSM_2019`— son claramente derivadas de
OpenStreetMap: lo dice su nombre (`cartoOSM`), y sus features traen un campo **`OSM_ID`** con
identificadores reales (`153226366`, `149219582`, `148897489`) más los tags típicos de OSM
(`ONEWAY`, `BRIDGE`, `MAXSPEED`, `TYPE=primary`). Sin embargo:

```
busqueda de "openstreetmap|odbl|open street" en los 709 conjuntos del catalogo -> 0
CONTROL: conjuntos que mencionan "Ayuntamiento"                                -> 691
conjunto 3 "Cartografia Base del Municipio" (que las agrupa):
    licencia: https://www.zaragoza.es/sede/portal/aviso-legal#condiciones   (municipal)
    menciona OSM en su descripcion: NO
```

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ la comprobación de licencia, que es
exactamente la que uno hace y la que aquí engaña. El catálogo declara para estas capas la
**licencia municipal**, que permite redistribuir derivados con solo citar *"Origen de los datos:
Ayuntamiento de Zaragoza"*. Leída esa ficha, la conclusión es "puedo usarlo y publicar lo que
derive". El dato de origen real —y su licencia **ODbL, que tiene efecto contagio sobre bases de
datos derivadas**— no aparece en ningún campo de ningún registro del catálogo.
**Causa raíz:** una importación de cartografía OSM hecha en 2019 e integrada en la base municipal
como una capa más, heredando la ficha de licencia genérica del organismo. El rastro de origen
sobrevivió en los datos (`OSM_ID`) pero no en los metadatos.
**Cómo se cazó:** ojo humano — el nombre `cartoOSM` llamó la atención al listar los workspaces, y
al pedir features apareció `OSM_ID`. Después se buscó "OSM/ODbL" en el catálogo completo, con
control positivo, para comprobar si estaba declarado en algún sitio. No lo está.
**Arreglo aplicado:** ninguno (no es nuestro catálogo). Queda como **advertencia con consecuencia
legal para 004**: si el proyecto usa esas capas creyendo que son dato municipal puro, puede acabar
publicando un derivado de OSM sin la atribución que la ODbL exige y sin evaluar el share-alike.
Y es tentador usarlas: son las **únicas** capas municipales con un campo de puente (`BRIDGE`), que
es el único desambiguador de nivel que hay en todo el catálogo.
**Commit:** (sin repositorio todavía — TANDA 0 no crea git)
**Ley que sale de aquí:** ⭐ la licencia que declara un catálogo es la del **publicador**, no
necesariamente la del **origen**. Antes de dar por buena una licencia hay que buscar en los datos
las huellas de su procedencia —identificadores ajenos, nombres de campo, convenciones de
etiquetado— porque un organismo puede redistribuir bajo su licencia algo que recibió bajo otra, y
quien construya encima hereda el problema sin haberlo elegido. Un campo llamado `OSM_ID` vale más
que una ficha de metadatos.
**Traza:** `data/exploracion/2026-08-02_wfs_feat5_idezar_base-Carreteras_cartoOSM_2019_Interiores.json`
(campo `OSM_ID`), `2026-08-02_zaragoza-catalogo_3.json`, `2026-08-02_zaragoza-catalogo_pag*.json`

## [2026-08-02] — Los "106 puntos de cruce" son 89: el mismo cruce contado varias veces

**Categoría:** medición / instrumento
**Síntoma:** al remedir las intersecciones sobre los mismos 12 crudos de zona para diseñar el
planarizado, el recuento de pares salió idéntico al del informe —**87**— y el de puntos NO:
**89 frente a los 106 publicados**. Diecisiete de diferencia (16 %) en un número que ya viaja
por tres documentos.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la coincidencia exacta de los 87
pares.** Los dos números salen de la misma pasada y se imprimieron en la misma línea:

```
pares de tramos que SE CRUZAN geometricamente : 87 pares   (106 puntos de cruce)
```

Ver el 87 clavado al remedirlo es la señal más tranquilizadora posible: si el numerador coincide,
uno da por bueno el paréntesis. Y el segundo verde falso es **la repetición**: el 106 estaba en el
informe 0.D, en `DESPLAZAME-ESTADO.md` y en el cuerpo del commit `cdf6a65`. Verlo tres veces se
lee como corroboración cuando las tres copias vienen de la misma pasada sin contrastar.
**Causa raíz:** la geometría es una polilínea, y un cruce que cae **exactamente sobre un vértice**
lo encuentran los DOS segmentos que comparten ese vértice. El contador sumaba una unidad por cada
pareja de segmentos que se cortaba, sin fusionar los puntos repetidos. Comprobado:

```
puntos SIN deduplicar          : 106      <- el numero publicado
puntos deduplicados a  0,01 m  :  89
puntos deduplicados a  0,50 m  :  89      <- estable: no es cuestion del umbral
distribucion por par           : 85 pares con 1 punto, 2 pares con 2 puntos
```

**Es el fallo nº10 de esta misma bitácora una escala más abajo.** Allí el mismo *tramo* se contaba
hasta 8 veces por aparecer en 8 ventanas y se dedujo por `fid`; aquí el mismo *punto* se cuenta
varias veces por caer en el vértice común de dos segmentos, y nadie lo dedujo por coordenada.
**Cómo se cazó:** por remedir para otra cosa. No se buscaba: se necesitaba, para el diseño del
planarizado, saber a qué distancia de un extremo cae cada cruce, y eso obliga a tener la lista de
puntos y no solo su total.
**Arreglo aplicado:** ninguno sobre el informe ni sobre el estado — son registro histórico y tienen
otro escritor. La cifra correcta y su reconciliación quedan en `docs/DISEÑO-H1-GRAFO.md`, que es
documento nuevo, y **la discrepancia se reporta hacia arriba** para que decida Antonio.
⚠️ **La conclusión del informe NO cambia:** los 87 pares son correctos y lo que sostienen —que la
topología está en las intersecciones y no en los extremos— sigue en pie. Lo que cambia es el
tamaño del trabajo: 89 cortes que planificar, no 106.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **dos números impresos en la misma línea no son dos mediciones: son
una.** Si uno se verifica y el otro no, el verificado presta su credibilidad al que no lo está, y
el paréntesis viaja de documento en documento con la autoridad del número de delante. Se verifican
por separado o no se verifica ninguno. Y su corolario: **un total sin la lista que lo produce no se
puede auditar** — el 106 era irrefutable mientras fuera solo un total.
**Traza:** `data/exploracion/2026-08-02_wfs_zona-*_MU1jv.json` (12 ficheros, 160 tramos únicos);
contraste contra `docs/INVENTARIO-FUENTES-ZARAGOZA.md:310` y `DESPLAZAME-ESTADO.md:165`

## [2026-08-02] — "La misma zona del casco" eran dos rectángulos distintos que solapan un 21 %

**Categoría:** medición / comparación entre fuentes
**Síntoma:** para responder si hacen falta las dos redes, releí el contraste OSM↔municipal del
informe 0.D. Dice literalmente *"una sola consulta Overpass acotada a la **misma zona del
casco**"* y *"54 ways de calzada en OSM frente a 19 tramos municipales **en una ventana
equivalente**"*. Al ponerlas en los mismos ejes, **no son la misma zona**:

```
ventana municipal (EPSG:25830) : X 675850..676250   Y 4613850..4614250   400 x 400 m
ventana OSM  (declarada, 4326) : X 675482..675971   Y 4613674..4614130   489 x 456 m
SOLAPE                          : 121 x 280 m = 33.832 m2
   = 21 % de la ventana municipal   y   15 % de la ventana OSM
```

Prueba directa, sin depender de las cajas: de los **514 vértices** de la geometría municipal del
casco, dentro de la caja OSM declarada caen **27 (5,3 %)**, y dentro de la extensión real del
crudo, **86 (16,7 %)**. Las dos ventanas se llaman "casco" y están en el casco, pero **miran a
sitios distintos**.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el tamaño y el nombre.** 500×440
frente a 400×400 es "equivalente" a cualquier ojo, y las dos consultas se llamaron *casco* y
apuntaban al casco antiguo real. Coinciden el rótulo, el orden de magnitud y el barrio. Lo único
que no coincide es el sitio, y eso **no se ve en ningún número de los que se imprimieron**: las
dos ventanas se declararon en sistemas de coordenadas distintos —una en metros UTM, otra en grados
WGS84— y nunca llegaron a estar en la misma tabla. Nadie las restó porque no había dónde restarlas.
**Causa raíz:** las dos consultas se escribieron en tandas distintas, cada una en el CRS natural de
su servicio (el WFS en 25830, Overpass en 4326), y se dio por hecho que apuntaban al mismo
rectángulo porque las dos se habían elegido "en el casco". Nunca se convirtió una a los ejes de la
otra.
**Cómo se cazó:** al intentar comparar densidades para P0 hizo falta recortar OSM a la ventana
municipal, y para eso hubo que reproyectar. La reproyección se derivó **del par de crudos
`SINsrs`/`EPSG4326`** —la misma feature servida en metros y en grados—, con control: los 119 puntos
vuelven a su sitio con error medio 0,29 m y máximo 1,46 m, e ida y vuelta a 0,6 m.
**Arreglo aplicado:** ninguno sobre el informe (registro histórico, otro escritor). La conclusión
afectada se rectifica en `docs/DISEÑO-H1-GRAFO.md`: **con estos dos crudos la densidad relativa de
calzada NO se puede medir**, porque el terreno común son 0,034 km² con 5 tramos municipales. Se
declara `NO CONSTA` y se dice qué medición lo resolvería (una consulta Overpass sobre exactamente
la ventana municipal).
⚠️ **Lo que NO cae:** que OSM tenga 115 aceras, 43 pasos y 26 escaleras y el municipal ninguna de
las tres. Ese contraste no depende del encuadre: el municipal tiene **cero** en toda la ciudad, y
cero es cero en cualquier ventana. Lo que cae es solo la frase *"OSM está más subdividido"*.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **dos ventanas descritas en sistemas de coordenadas distintos no se
pueden comparar hasta que están en el mismo.** Mientras una se escriba en metros y otra en grados,
la comprobación de que son el mismo sitio no la hace nadie: no hay ninguna operación natural en la
que ambas coincidan, así que el error no se manifiesta. Y el corolario, que es el caro: **poner el
mismo rótulo a dos muestras es la forma más barata de que parezcan la misma muestra.** Llamarlas
las dos "casco" hizo el trabajo que debería haber hecho una resta.
**Traza:** `data/exploracion/2026-08-02_wfs_zona-casco_MU1jv.json`,
`2026-08-02_osm_overpass_casco-highway.json`, transformación derivada de
`2026-08-02_idezar-geoserver_getfeature-Vias-count3-SINsrs.json` y `...-EPSG4326.json`;
contraste contra `docs/INVENTARIO-FUENTES-ZARAGOZA.md:480,498`

## [2026-08-02] — "The server is probably too busy": tres 504 seguidos que no eran del servidor

**Categoría:** instrumento / red
**Síntoma:** tres peticiones consecutivas a Overpass devolvieron **HTTP 504** en 8-9 s, con este
cuerpo:

```
Error: runtime error: open64: 0 Success /osm3s_osm_base
Dispatcher_Client::request_read_and_idx::timeout.
The server is probably too busy to handle your request.
```

Y una cuarta, a la réplica `overpass.kumi.systems`, se colgó **más de 2 minutos** sin responder.
Cuatro señales seguidas apuntando a lo mismo: el servicio está caído o saturado.
**No lo estaba.** La misma pregunta, reescrita, contestó en **1,5 segundos**.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el propio mensaje de error, que es
un diagnóstico y viene del servidor.** No es un 500 mudo: es una frase en inglés que nombra la
causa —*"the server is probably too busy"*— y encima el tiempo de respuesta la respalda: 8-9 s
esperando y cortando, que es exactamente lo que hace un servicio saturado. Y la réplica colgada
**confirmaba** la hipótesis. Cuatro observaciones coherentes entre sí, todas falsas.
La costura de la tanda decía *"si Overpass responde lento o con corte, PARA esa rama, no
insistas"*. Aplicada al pie de la letra, la tanda se cierra aquí con cero mediciones y un informe
que dice "Overpass no estaba disponible". **La medición existía y estaba a una petición.**
**Causa raíz:** la **forma** de la consulta, no su tamaño. Las que fallaron eran **uniones** de
varias sentencias con filtro de bbox:

```
FALLA (504 en 8,8 s):   ( way["bridge"](bbox); way["tunnel"](bbox); way["layer"](bbox); );  out geom;
FUNCIONA (200 en 1,5 s): way["bridge"](bbox);  out geom;            <- 65 KB, 86 elementos
FUNCIONA (200 en 8,5 s): way["highway"](bbox); out geom;            <- 871 KB, ventana identica
```

⭐ La prueba de que no era carga: la consulta que **más datos** devolvió (871 KB, todas las vías de
la misma ventana) pasó sin problema, mientras la que pedía **un subconjunto** de esos mismos datos
fue rechazada. Si fuera saturación, la grande habría caído antes que la pequeña.
**Cómo se cazó:** por no aceptar el cuarto fallo. Antes de firmar "servicio no disponible" se
lanzó una petición **mínima y diagnóstica** —`way["bridge"]` sobre una caja de 400 m con puentes
conocidos sobre el Ebro—, que además hacía de control positivo. Devolvió 200 con el Puente de
Piedra dentro. **En ese momento la hipótesis "el servidor está caído" quedó refutada** y sólo
quedaba mirar la forma de las consultas.
**Arreglo aplicado:** todas las consultas de la tanda se reescriben como **sentencia única**. Los
tres cuerpos de error se conservan en `data/exploracion/` con extensión `.html` y `HTTP504` en el
nombre — ⚠️ **llegaron a guardarse con extensión `.json`**, que es una trampa a seis meses vista:
un fichero de 695 bytes llamado `...niveles.json` que contiene un `<!DOCTYPE html>` de error.
Renombrados en el momento.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **un mensaje de error es una afirmación del servidor sobre sí mismo,
y no está verificada por venir de dentro.** "The server is too busy" se lee como dato y es una
hipótesis del propio servidor sobre por qué no pudo servir. Y el corolario operativo: **antes de
declarar un servicio caído, hay que lanzarle la petición más pequeña que se pueda formular.** Si
contesta, lo que está roto es la pregunta, no el servicio. Esa petición mínima cuesta un segundo y
es la diferencia entre una tanda con datos y una tanda con excusa.
⚠️ **Y una segunda, sobre el método:** una costura anti-fallo escrita para proteger a un tercero
—*"no insistas, es infraestructura comunitaria"*— puede convertirse en la coartada perfecta para
no medir. La regla es correcta y se mantiene; lo que hay que añadirle es **qué comprobación
distingue "no insistir" de "rendirse"**.
**Traza:** `data/exploracion/2026-08-02_osm_overpass_localizar-dianas_HTTP504.html`,
`..._delicias_HTTP504-servidor-ocupado.html`, `..._delicias_HTTP504-intento2.html` (los fallos);
`..._control-positivo-puentes-ebro.json` (la refutación);
`..._delicias-estacion_puentes.json` y `..._delicias-estacion_todas-vias.json` (lo que sí había)

## [2026-08-02] — El control positivo lo elegí yo, con tres nombres fáciles, y por eso pasó

**Categoría:** instrumento / emparejamiento de nombres
**Síntoma:** para decidir si las vías de servicio de OSM están en el callejero municipal —de eso
dependía el número de "escapados" de la tanda— normalicé nombres y crucé las dos listas. Salieron
**NO** para calles que existen en las dos:

```
OSM                                 municipal                        mi matcher
Calle de Marcelino Unceta           CALLE UNCETA                     NO   <- FALSO
Calle Nuestra Señora de Bonaria     CALLE NTRA.SRA.DE BONARIA        NO   <- FALSO
Calle de Añoa del Busto             CALLE ARZOBISPO AÑOA Y BUSTO     NO   <- FALSO
Camino del Cascajo                  CAMINO DEL CASCAJO ---SJN        NO   <- FALSO
Calle Buenos Aires                  CALLE BUENOS AIRES ---SGR        NO   <- FALSO
```

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **un control positivo de tres
casos, que pasó 3 de 3 — y los tres los elegí yo.** `CALLE SORIA`, `CARRETERA HUESCA` y
`CALLE DE LAS ARMAS`: los tres en forma natural, sin abreviatura, sin sufijo, sin inversión y sin
tratamiento. Es decir, **elegí como control exactamente los casos que mi normalizador ya sabía
resolver**, porque son los que tenía en la cabeza al escribirlo. El control no midió la capacidad
del instrumento: midió la coincidencia entre lo que el instrumento hace y lo que yo recordaba.
Y el verde fue triple, que es peor: tres de tres se lee como cobertura.
**Causa raíz:** el callejero municipal usa **cuatro convenciones** que OSM no usa, y ninguna estaba
contemplada: abreviaturas con puntos (`NTRA.SRA.`), **sufijos de barrio rural** (`---CST` Casetas,
`---SGR` San Gregorio, `---SJN` San Juan de Mozarrifar), omisión del nombre de pila (`UNCETA` por
`Marcelino Unceta`) y tratamientos añadidos (`ARZOBISPO AÑOA Y BUSTO` por `Añoa del Busto`).
**Cómo se cazó:** por desconfiar de un resultado, no por una prueba. `Calle de Marcelino Unceta`
saliendo "NO" chirriaba: es una calle grande de Zaragoza. Al buscar `UNCETA` en crudo aparecieron
`CALLE UNCETA` y con ella las otras cuatro convenciones.
**Arreglo aplicado:** ninguno — **no se arregla el matcher, se retira la conclusión.** El anexo
declara `NO DETERMINABLE` si las vías de servicio están en `MU1_jerarquia_viaria`, y dice qué
medición lo resuelve (descargar la capa entera y mirar por `codigo`, que es identificador exacto y
no nombre). Arreglar el normalizador para este uso sería construir el emparejamiento aproximado que
el diseño acaba de descartar en P0.3.
⭐ **Y es la confirmación empírica de P0.3**, que hasta ahora se apoyaba en tres ejemplos: el
emparejamiento municipal↔OSM por nombre tiene **cola larga y cuatro familias de excepción
distintas**. Ya no es una sospecha razonada: está medido.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **un control positivo que elige quien escribió el instrumento no es un
control: es un espejo.** Prueba que el instrumento hace lo que su autor cree, que es justo lo que
no está en duda. El control tiene que salir de **una lista que no la haya hecho el mismo que el
instrumento** —muestreo al azar del universo real, o casos que aporte otra persona— y **debe
contener casos que se espera que fallen**. Corolario práctico: si un control positivo pasa al
primer intento y con todos los casos, hay que sospechar de la selección antes de celebrar el verde.
**Traza:** `E:\...\vias-zaragoza.json` (3.359 vías, lectura pura),
`data/exploracion/2026-08-02_osm_overpass_delicias-estacion_todas-vias.json`,
`..._carretera-huesca_todas-vias.json`

## [2026-08-02] — ⚠️ CORRIGE LA Nº32: la causa no era la forma de la consulta, era el límite de peticiones

**Categoría:** instrumento / atribución causal · **corrige la entrada nº32 de esta misma bitácora**
**Síntoma:** al repetir hoy el mismo trabajo, una consulta de **sentencia única** —la forma que la
nº32 declaraba buena— devolvió **HTTP 504** con el mismo texto de ayer. Eso ya contradecía la
explicación. Y al repetir la consulta exacta que acababa de fallar, el servidor cambió de código:

```
ayer y hoy (504): Dispatcher_Client::request_read_and_idx::timeout
                  "The server is probably too busy to handle your request."
hoy       (429): Dispatcher_Client::request_read_and_idx::rate_limited
                  "Please check /api/status for the quota of your IP address."
```

**Son el mismo mecanismo**: el despachador reparte *slots por IP*. Si esperas y no hay, contesta
`timeout` disfrazado de "servidor ocupado"; si te pasas de cuota, contesta `rate_limited`. **Ninguno
de los dos habla de la consulta.** La causa está en el ritmo de peticiones, no en su forma.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el experimento que parecía
decisivo, y lo hice yo.** Ayer reescribí la consulta de unión a sentencia única y **contestó 200 en
1,5 segundos**. Una intervención, un resultado inmediato, tres fallos previos y dos éxitos
posteriores: es la forma canónica de una demostración. Y hoy el discriminador —la misma consulta de
ayer, repetida— volvió a dar **200 en 0,65 s**, confirmándola otra vez.

⚠️ **Pero la intervención cambió DOS cosas a la vez**: la forma de la consulta **y el tiempo
transcurrido**. La segunda es la que operaba. Los tres fallos de ayer fueron seguidos, en ráfaga;
los éxitos llegaron después de pararme a leer, escribir y pensar. **Cada vez que "arreglaba" la
consulta, también había esperado.**
**Causa raíz de la equivocación:** una correlación de 3 de 3 y un experimento con dos variables sin
aislar. La hipótesis explicaba todos los datos disponibles, que es exactamente lo que hace una
hipótesis falsa cuando faltan datos.
**Cómo se cazó:** porque el servidor cambió de código de error. Con `429` en la mano, `504` dejó de
ser "servidor ocupado" y pasó a ser "no te ha tocado slot". **No lo cacé razonando: me lo dijo el
servidor cuando le insistí lo suficiente para cruzar el otro umbral.**
**⚠️ CAUSA NO CONFIRMADA — y la segunda hipótesis también se cayó, en la misma tanda.**

Con el 429 en la mano pensé que estaba cerrado: `/api/status` dice `Rate limit: 2`, o sea dos
slots por IP, y una consulta pesada retiene el suyo mientras se sirve. Explicaba la ráfaga de ayer
y los éxitos tras las pausas. Encajaba entero. **Y también es falso, o al menos insuficiente:**

```
14:58:25  way["highway"](bbox Alierta); out geom;   -> HTTP 504 timeout   (tras esperar 25 s)
14:58:33  /api/status                               -> "2 slots available now."
```

**Ocho segundos después del fallo, el servidor dice que yo tenía los dos slots libres.** Así que
ese 504 no era mi cuota. Dos hipótesis, las dos coherentes con todo lo observado hasta el momento
de formularlas, las dos refutadas por el dato siguiente.

**Lo que SÍ está verificado**, y es lo único que se escribe como hecho:
1. El servicio **alterna** entre servir y rechazar la misma consulta en cuestión de minutos.
   Probado con el discriminador: 200 en 0,65 s minutos después de tres 504.
2. `timeout` (504) y `rate_limited` (429) salen los dos **del despachador**, no del análisis de la
   consulta. Ninguno de los dos habla de lo que se pidió.
3. Reformular la consulta **no es lo que lo arregla**: sentencias únicas fallan igual.
4. **Reintentar más tarde sí funciona.** Siempre, en las cuatro ocasiones.

⇒ La causa real queda `CAUSA NO CONFIRMADA`. La conducta correcta no depende de conocerla:
**reintentar con espera creciente y no diagnosticar.**
**Arreglo aplicado:** la nº32 **no se borra ni se edita** —es el registro de lo que se creyó y
cuándo—, se corrige aquí, que es entrada nueva, y se dice qué parte cae y cuál aguanta:
· ⛔ **CAE** la causa: *"era la forma de la consulta (unión contra sentencia única)"*. Falso.
· ✅ **AGUANTA**, y más fuerte: *"un mensaje de error es una afirmación del servidor sobre sí mismo
  y no está verificada por venir de dentro"*. Hoy hay dos frases distintas del mismo servidor sobre
  el mismo hecho, y la primera —"estoy demasiado ocupado"— era la engañosa.
· ✅ **AGUANTA** el remedio operativo: lanzar la petición más pequeña antes de declarar nada caído.
  Funcionó las dos veces, aunque por un motivo distinto del que creí — **liberaba tiempo, no
  complejidad**.
· ➕ **SE AÑADE**: espaciar de verdad las peticiones, y leer `/api/status` cuando aparezca un 429.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **una intervención que funciona no demuestra por qué funciona.** Si al
"arreglar" algo se cambió más de una cosa —y el tiempo transcurrido cuenta como una cosa— el éxito
no distingue cuál de ellas operaba. Para atribuir causa hay que **volver a provocar el fallo**: si
no se puede reproducir a voluntad, no hay causa demostrada, hay una historia que encaja.
⚠️ Y el corolario incómodo: **la nº32 se escribió con la seguridad de haber hecho un experimento.**
El formato de la bitácora —con su casilla de "causa raíz"— **empuja a rellenarla**, y una casilla
que hay que rellenar se rellena con la mejor hipótesis disponible aunque no esté probada. A partir
de ahora, causa no reproducida se escribe **`CAUSA NO CONFIRMADA`**, que es `NO CONSTA` con apellido.
**Traza:** `data/exploracion/2026-08-02_osm_overpass_tunnel_HTTP429-limite-peticiones.html` (el 429
que lo destapó), `..._control-tunnel_HTTP504-intento1.html` (sentencia única que falla),
y los tres 504 de la nº32

## [2026-08-02] — Cuatro ventanas, cuatro fechas: los espejos de Overpass sirven datos de meses distintos

**Categoría:** frescura / fuente
**Síntoma:** cuando la instancia principal dejó de responder, las dos últimas ventanas se pidieron
a una réplica (`overpass.private.coffee`). Al imprimir el sello de cada crudo antes de compararlos:

```
DELICIAS  (principal)  timestamp_osm_base = 2026-08-02T13:16:36Z
HUESCA    (principal)  timestamp_osm_base = 2026-08-02T13:16:36Z
ALIERTA tuneles (replica) …………………… = 2026-06-12T12:14:17Z
ALIERTA vias    (replica) …………………… = 2026-05-31T22:37:44Z
PIRINEOS        (replica) …………………… = 2026-05-06T03:25:00Z
```

**Casi tres meses de diferencia entre ventanas que iban a ir en la misma tabla.** Y no es sólo
principal contra réplica: **dentro de la misma réplica**, dos consultas seguidas devolvieron datos
de 31 de mayo y de 12 de junio — es un grupo de servidores con retrasos de réplica distintos, y
te toca uno u otro sin decírtelo.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el HTTP 200 y el contenido.** Los
ficheros son válidos, completos, con la geometría correcta y el número de ways plausible para la
zona. Nada en ellos se ve viejo. El sello vive en `osm3s.timestamp_osm_base`, tres niveles dentro
del JSON, **y no se mira nunca porque no hace falta para parsear**. Y el segundo verde, que es el
peor: al cruzar los dos ficheros de Alierta —el de túneles y el de vías, de fechas distintas—
**coincidieron los 15 túneles, uno a uno**. Una comprobación de consistencia que sale limpia
refuerza la confianza justo en lo que no ha comprobado: que sean del mismo día.
**Causa raíz:** el `Announced endpoint` de la principal y las réplicas públicas son máquinas
distintas con sus propios ciclos de actualización. Nada obliga a que estén al día, y el protocolo
no lo negocia: se pide y se sirve lo que haya.
**Cómo se cazó:** por imprimir el sello al cargar cada fichero, que es rutina de este proyecto
desde la tanda 0.C. No hubo intuición: estaba en la línea de salida del script.
**Arreglo aplicado:** ninguno sobre los datos —**editar un crudo lo destruye como evidencia**—. El
anexo declara **la fecha de cada ventana junto a cada cifra**, y advierte de que las comparaciones
entre zonas cruzan hasta tres meses. Y se comprobó lo único comprobable sin más peticiones: que los
dos ficheros de Alierta, pese a sus 12 días de diferencia, contienen los mismos 15 túneles.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **el mismo servicio no garantiza el mismo dato: una réplica es otra
fuente.** Cambiar de espejo para esquivar una caída parece un detalle de infraestructura y es un
cambio de fuente con su propia fecha. Corolario duro para este proyecto: **el sello de frescura se
lee y se ESCRIBE AL LADO DE LA CIFRA, no en la sección de método.** Una tabla que compara cuatro
zonas sin fecha por fila es una tabla que afirma, sin decirlo, que las cuatro son del mismo día.
**Traza:** `data/exploracion/2026-08-02_osm_overpass_alierta-torres_todas-vias.json`,
`..._alierta-torres_tuneles.json`, `..._pirineos_todas-vias.json` (réplica) contra
`..._delicias-estacion_todas-vias.json` y `..._carretera-huesca_todas-vias.json` (principal)
